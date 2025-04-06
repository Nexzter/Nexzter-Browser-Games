document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const emojis = ["🍎", "🍊", "🍋", "🍉", "🍇", "🍓", "🍒", "⭐", "💎", "🔔", "💰", "🍀"];
    const spinCost = 10;
    const winAmount = 100;
    const startingMoney = 100;
    const winProbability = 0.05; // 5% chance to win
    const nearMissProbability = 0.50; // 50% chance for near miss (if not win)
    const nearMissMessages = [ "Almost there!", "So close!", "99% of gamblers quit before they hit big", "Just missed!", "Edging", "Keep trying!" ];
    const winMessages = [ "You Win!", "Big Win!", "So skill!", "Winner Winner!" ];
    const specialWinMessage = "You can win bigger my skibidi";
    const specialWinMessageChance = 0.01; // 1% chance for the special message on win
    const jackpotMultiplier = 10; // Jackpot is 10x the normal win
    const minWinsForJackpot = 5;
    const maxWinsForJackpot = 10; // Jackpot triggers after 5-10 wins

    // --- Animation & Layout Constants ---
    const REEL_HEIGHT = 100; // Matches CSS .reel height
    const EMOJI_COUNT_PER_REEL = 20; // How many emojis vertically in the reel data
    const SCROLL_SPEED_FACTOR = 15; // Base speed for reel spin (pixels per frame)
    const firstStopDelay = 1000; // ms before first reel stops
    const stopDelayIncrement = 500; // ms additional delay for subsequent reels
    const stopSettleDelay = 350; // ms to wait after reel stops for visual settle & result check

    // --- Background Scroll Configuration ---
    const bgGridSpacing = 150; // Pixel spacing for background emojis
    const BG_CONTENT_SIZE = 6000; // Increased size for seamless scroll (e.g., 2x original 3000)
    const BG_ANIMATION_DISTANCE = BG_CONTENT_SIZE / 2; // Scroll half the total size (3000px)
    // Keep original speed roughly: speed = 150px / 25s. New duration = distance / speed = 3000px / (150px/25s) = 3000 * 25 / 150 = 500s
    const BG_ANIMATION_DURATION_SECONDS = 500; // Adjusted duration for seamless loop at original speed

    // --- DOM Elements ---
    console.log("Selecting DOM elements...");
    const reel1 = document.getElementById('reel1');
    const reel2 = document.getElementById('reel2');
    const reel3 = document.getElementById('reel3');
    const reel1Inner = reel1 ? reel1.querySelector('.reel-inner') : null;
    const reel2Inner = reel2 ? reel2.querySelector('.reel-inner') : null;
    const reel3Inner = reel3 ? reel3.querySelector('.reel-inner') : null;
    const reelInnerElements = [reel1Inner, reel2Inner, reel3Inner];
    const spinButton = document.getElementById('spin-button');
    const moneyDisplay = document.getElementById('money-display');
    const moneyDisplaySpan = moneyDisplay ? moneyDisplay.querySelector('span') : null;
    const messageDisplay = document.getElementById('message-display');
    const confettiContainer = document.getElementById('confetti-container');
    const flashOverlay = document.getElementById('flash-overlay');
    const debugConsole = document.getElementById('debug-console');
    const debugCodeDisplay = document.getElementById('debug-code-display');
    const debugFeedback = document.getElementById('debug-feedback');
    const bodyElement = document.body;
    const scrollingBgContent = document.getElementById('scrolling-bg-content');
    console.log("Element selection finished.");

    // --- CRITICAL ELEMENT CHECK ---
    let missingElement = false;
    let missingElementName = '';
    const requiredElements = {
        reel1, reel2, reel3, reel1Inner, reel2Inner, reel3Inner, spinButton,
        moneyDisplay, moneyDisplaySpan, messageDisplay, confettiContainer, flashOverlay,
        debugConsole, debugCodeDisplay, debugFeedback, bodyElement, scrollingBgContent
    };
    console.log("Starting critical element check...");
    for (const [name, element] of Object.entries(requiredElements)) {
        if (!element) {
            missingElementName = name;
            console.error(`CRITICAL ERROR: Initialization failed. Required element "${missingElementName}" not found.`);
            missingElement = true;
            break;
        }
    }
    console.log("Element check finished.");

    if (missingElement) {
        try { // Attempt to display an error message on screen
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = 'color:red;position:fixed;top:10px;left:10px;background:black;padding:10px;z-index:9999;border:1px solid red;font-family:sans-serif;';
            errorDiv.textContent = `Initialization Error! Element "${missingElementName}" missing. Check console.`;
            (document.body || document.documentElement).appendChild(errorDiv);
        } catch (err) {
            console.error("Could not display on-screen initialization error.", err);
        }
        return; // Stop script execution
    }
    console.log("All critical elements found. Proceeding.");


    // --- Game State ---
    let currentMoney = startingMoney;
    let isSpinning = false;
    let reelAnimationData = [ // Store animation state for each reel
        { animationFrameId: null, currentY: 0, speed: SCROLL_SPEED_FACTOR + Math.random() * 5 },
        { animationFrameId: null, currentY: 0, speed: SCROLL_SPEED_FACTOR + Math.random() * 5 },
        { animationFrameId: null, currentY: 0, speed: SCROLL_SPEED_FACTOR + Math.random() * 5 }
    ];
    let finalResults = []; // Stores the ['🍎', '🍎', '🍓'] results of a spin
    let winsSinceLastJackpot = 0;
    let winsNeededForJackpot = 0;
    let isDebugModeActive = false;
    let currentDebugCode = "";
    let forceNextOutcome = null; // 'win', 'loss', 'near-miss', or null

    // --- Initialization ---
    setupScrollingBackground(); // Call the updated function
    reelInnerElements.forEach(populateReel);
    setNextJackpotTarget();
    updateMoneyDisplay();

    // --- Event Listeners ---
    spinButton.addEventListener('click', spin);
    window.addEventListener('keydown', handleDebugKeys);

    // --- Core Functions ---

    /**
     * Populates the background container with a larger grid of emojis
     * for seamless scrolling. Also sets the CSS variables for the animation.
     */
    function setupScrollingBackground() {
        if (!scrollingBgContent) return;
        scrollingBgContent.innerHTML = ''; // Clear existing
        const fragment = document.createDocumentFragment();

        // Use the new constants for size
        const containerWidth = BG_CONTENT_SIZE;
        const containerHeight = BG_CONTENT_SIZE;
        const numCols = Math.ceil(containerWidth / bgGridSpacing);
        const numRows = Math.ceil(containerHeight / bgGridSpacing);
        let count = 0;
        console.log(`Populating ${numCols}x${numRows} background grid (${BG_CONTENT_SIZE}x${BG_CONTENT_SIZE}px)...`);

        for (let r = 0; r < numRows; r++) {
            for (let c = 0; c < numCols; c++) {
                const emojiSpan = document.createElement('span');
                emojiSpan.classList.add('bg-emoji');
                emojiSpan.textContent = getRandomEmoji();
                let leftPos = c * bgGridSpacing;
                let topPos = r * bgGridSpacing;
                emojiSpan.style.left = `${leftPos}px`;
                emojiSpan.style.top = `${topPos}px`;
                fragment.appendChild(emojiSpan);
                count++;
            }
        }
        scrollingBgContent.appendChild(fragment);
        console.log(`Finished populating background grid with ${count} emojis.`);

        // Set CSS Variables for dynamic animation control
        scrollingBgContent.style.setProperty('--bg-content-size', `${BG_CONTENT_SIZE}px`);
        scrollingBgContent.style.setProperty('--bg-animation-distance', `-${BG_ANIMATION_DISTANCE}px`);
        scrollingBgContent.style.setProperty('--bg-animation-duration', `${BG_ANIMATION_DURATION_SECONDS}s`);
    }


    /**
     * Returns a random emoji from the configured list.
     */
    function getRandomEmoji() {
        if (!emojis || emojis.length === 0) {
            console.error("Emoji list is empty!");
            return '❓'; // Return a default if list is empty
        }
        return emojis[Math.floor(Math.random() * emojis.length)];
    }

    /**
     * Populates a single reel's inner container with emojis.
     * Duplicates the emojis to allow for smooth wrapping during spin.
     */
    function populateReel(reelInner, index) {
        if (!reelInner) {
            // Try to show error within the reel itself if possible
            const reelContainer = document.getElementById(`reel${index + 1}`);
            if (reelContainer) {
                reelContainer.innerHTML = '<div style="color:red;text-align:center;padding-top: 30px;font-size:12px;">Reel Init Error!</div>';
            }
            console.error(`Cannot populate reel ${index + 1}, inner element not found.`);
            return;
        }

        reelInner.innerHTML = ''; // Clear previous content
        const fragment = document.createDocumentFragment();
        const initialEmojis = [];

        // Create the first set of emojis
        for (let i = 0; i < EMOJI_COUNT_PER_REEL; i++) {
            const span = document.createElement('span');
            span.classList.add('emoji'); // Use class 'emoji'
            span.textContent = getRandomEmoji();
            span.style.height = `${REEL_HEIGHT}px`; // Ensure height matches reel viewport
            span.style.lineHeight = `${REEL_HEIGHT}px`; // Vertical align text
            fragment.appendChild(span);
            initialEmojis.push(span); // Keep track for duplication
        }

        // Append the first set
        reelInner.appendChild(fragment);

        // Duplicate the emojis and append them for seamless looping
        initialEmojis.forEach(node => {
            reelInner.appendChild(node.cloneNode(true));
        });

        // Initial positioning (teleport to start without transition)
        reelInner.style.transition = 'none';
        reelInner.style.transform = `translateY(0px)`;
        // Force reflow/repaint before re-enabling transitions
        void reelInner.offsetHeight;
        reelInner.style.transition = ''; // Re-enable transitions defined in CSS
    }


    /**
     * Updates the money display element with the current amount.
     * Adds/removes 'debt' class for styling negative values.
     */
    function updateMoneyDisplay() {
        let formattedMoney;
        if (currentMoney < 0) {
            moneyDisplay.classList.add('debt');
            formattedMoney = `-$${Math.abs(currentMoney)}`;
        } else {
            moneyDisplay.classList.remove('debt');
            formattedMoney = `$${currentMoney}`;
        }
        moneyDisplaySpan.textContent = formattedMoney;
    }

    /**
     * Returns a random message from a given array of messages.
     */
    function getRandomMessage(messages) {
        if (!messages || messages.length === 0) return "Message Error";
        return messages[Math.floor(Math.random() * messages.length)];
    }

    /**
     * Creates and displays confetti animation.
     */
    function showConfetti() {
        confettiContainer.innerHTML = ''; // Clear old confetti
        const confettiCount = 100;
        const colors = ['#f00', '#0f0', '#00f', '#ff0', '#f0f', '#0ff', '#ffa500', '#ff4500'];
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.classList.add('confetti');
            confetti.style.left = `${Math.random() * 100}vw`;
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDuration = `${Math.random() * 2 + 2}s`; // 2-4 seconds fall time
            confetti.style.animationDelay = `${Math.random() * 1}s`; // Stagger start times
            confetti.style.transform = `scale(${Math.random() * 0.5 + 0.5})`; // Vary size
            confettiContainer.appendChild(confetti);
        }
        // Optional: Clear confetti elements after animation ends
        setTimeout(() => confettiContainer.innerHTML = '', 5000); // Adjust time based on longest animation + delay
    }

    /**
     * Starts the continuous scrolling animation for a specific reel.
     */
    function startScrolling(reelIndex) {
        const reelInner = reelInnerElements[reelIndex];
        const data = reelAnimationData[reelIndex];
        if (!reelInner || !data) return;

        let lastTimestamp = 0;
        reelInner.style.transition = 'none'; // Disable CSS transitions during manual animation

        function scrollStep(timestamp) {
            // Ensure elements still exist (safety check)
             if (!reelInner || !data) {
                 console.warn(`scrollStep called for reel ${reelIndex} but elements missing.`);
                 cancelAnimationFrame(data.animationFrameId);
                 data.animationFrameId = null;
                 return;
             };

            if (!lastTimestamp) lastTimestamp = timestamp;
            // No need to calculate delta time if speed is constant per frame
            lastTimestamp = timestamp;

            data.currentY += data.speed; // Increment position based on speed

            // Calculate the height of the original content (first half)
            const originalContentHeight = EMOJI_COUNT_PER_REEL * REEL_HEIGHT;

            // If scrolled past the end of the first duplicate set, wrap around
            if (data.currentY >= originalContentHeight) {
                data.currentY -= originalContentHeight;
            }

            reelInner.style.transform = `translateY(${-data.currentY}px)`;

            // Continue animation if the frame ID is still set
            if (data.animationFrameId) {
                data.animationFrameId = requestAnimationFrame(scrollStep);
            }
        }

        // Cancel any previous frame before starting a new one
        cancelAnimationFrame(data.animationFrameId);
        data.animationFrameId = requestAnimationFrame(scrollStep);
    }

    /**
     * Stops a specific reel's scrolling animation and snaps it to the final emoji.
     */
    function stopReel(reelIndex, finalEmoji) {
        const reelInner = reelInnerElements[reelIndex];
        const data = reelAnimationData[reelIndex];
        if (!reelInner || !data) return;

        // Stop the animation loop
        cancelAnimationFrame(data.animationFrameId);
        data.animationFrameId = null;

        // Find the index of the target emoji within the *first* set of emojis
        const allEmojiElements = reelInner.children;
        if (!allEmojiElements || allEmojiElements.length === 0) {
            console.error(`Cannot stop reel ${reelIndex}, no emoji elements found.`);
            return;
        }

        let targetIndex = -1;
        for (let i = 0; i < EMOJI_COUNT_PER_REEL; i++) { // Only check the first half
            if (allEmojiElements[i] && allEmojiElements[i].textContent === finalEmoji) {
                targetIndex = i;
                break;
            }
        }

        // If the target emoji wasn't found (e.g., due to random generation during populate),
        // force the first emoji to be the target one.
        if (targetIndex === -1) {
            console.warn(`Target emoji ${finalEmoji} not found in reel ${reelIndex}. Defaulting to index 0.`);
            targetIndex = 0;
            // Update the actual emoji text content at the target index (and its duplicate)
             if (allEmojiElements[targetIndex]) {
                 allEmojiElements[targetIndex].textContent = finalEmoji;
                 // Update the duplicate element as well
                 const duplicateIndex = targetIndex + EMOJI_COUNT_PER_REEL;
                 if (allEmojiElements[duplicateIndex]) {
                     allEmojiElements[duplicateIndex].textContent = finalEmoji;
                 }
             }
        }

        // Calculate the target Y position based on the index and emoji height
        const targetY = targetIndex * REEL_HEIGHT;

        // Use CSS transition to smoothly snap to the target position
        reelInner.style.transition = ''; // Re-enable default CSS transition
        reelInner.style.transform = `translateY(${-targetY}px)`;

        // Update internal state (optional, but good practice)
        // Ensure currentY reflects the final position modulo the content height
        const originalContentHeight = EMOJI_COUNT_PER_REEL * REEL_HEIGHT;
        data.currentY = targetY % originalContentHeight;

        // Note: The actual visual "settle" happens due to the CSS transition.
        // The result checking logic will wait for `stopSettleDelay`.
    }


    /**
     * Sets the random number of wins required for the next jackpot.
     */
    function setNextJackpotTarget() {
        winsNeededForJackpot = Math.floor(Math.random() * (maxWinsForJackpot - minWinsForJackpot + 1)) + minWinsForJackpot;
        console.log(`Next jackpot triggers after ${winsNeededForJackpot} wins.`);
    }

    /**
     * Determines the win message, potentially picking the special one.
     */
    function determineWinMessage() {
        return (Math.random() < specialWinMessageChance) ? specialWinMessage : getRandomMessage(winMessages);
    }

     /**
      * Handles keydown events for activating/using the debug console.
      */
     function handleDebugKeys(event) {
        // Use '.' to toggle debug mode (only if not focused on input/textarea)
        if (event.key === '.' && !isDebugModeActive) {
            const activeElementTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
            if (activeElementTag !== 'input' && activeElementTag !== 'textarea') {
                event.preventDefault();
                toggleDebugMode();
                return;
            }
        }
        // Use 'Escape' to close debug mode
        if (event.key === 'Escape' && isDebugModeActive) {
            event.preventDefault();
            toggleDebugMode();
            return;
        }

        // Handle input within debug mode
        if (isDebugModeActive) {
            // Allow numbers 0-9
            if (!isNaN(parseInt(event.key)) && event.key.length === 1) {
                 event.preventDefault();
                 currentDebugCode += event.key;
                 updateDebugDisplay();
            }
            // Process code on Enter
            else if (event.key === 'Enter') {
                 event.preventDefault();
                 processDebugCode(currentDebugCode);
                 currentDebugCode = ""; // Clear code after processing
                 updateDebugDisplay(); // Update display to show cleared code
            }
            // Handle Backspace
            else if (event.key === 'Backspace') {
                 event.preventDefault();
                 currentDebugCode = currentDebugCode.slice(0, -1);
                 updateDebugDisplay();
            }
        }
     }

     /**
      * Toggles the visibility and state of the debug console.
      */
     function toggleDebugMode() {
        isDebugModeActive = !isDebugModeActive;
        bodyElement.classList.toggle('debug-active', isDebugModeActive);
        currentDebugCode = ""; // Reset code on toggle
        forceNextOutcome = null; // Reset any forced outcome
        updateDebugDisplay(isDebugModeActive ? "Debug Active. Enter code:" : "Debug Deactivated.");
        console.log(`Debug mode ${isDebugModeActive ? 'activated' : 'deactivated'}.`);
     }

     /**
      * Updates the text content of the debug console display elements.
      */
     function updateDebugDisplay(feedback = "") {
        debugCodeDisplay.textContent = currentDebugCode || "____"; // Show underscores if empty
        debugFeedback.textContent = feedback;
     }

     /**
      * Processes the entered debug code and applies cheats/actions.
      */
     function processDebugCode(code) {
        let feedbackMessage = `Code "${code}" -> `;
        switch (code) {
            case '7771': // Prime Jackpot
                winsSinceLastJackpot = winsNeededForJackpot - 1;
                feedbackMessage += "Jackpot primed for next win!";
                forceNextOutcome = 'win'; // Also force a win
                 feedbackMessage += " (Forcing WIN)";
                break;
            case '5001': // Force Win
                forceNextOutcome = 'win';
                feedbackMessage += "Force next outcome: WIN.";
                break;
            case '5000': // Force Loss
                forceNextOutcome = 'loss';
                feedbackMessage += "Force next outcome: LOSS.";
                break;
            case '5002': // Force Near Miss
                forceNextOutcome = 'near-miss';
                feedbackMessage += "Force next outcome: NEAR MISS.";
                break;
            case '8888': // Add Money
                currentMoney += 1000;
                updateMoneyDisplay();
                feedbackMessage += "Added $1000.";
                break;
            case '0101': // Reset Jackpot Counter
                winsSinceLastJackpot = 0;
                feedbackMessage += "Jackpot win counter reset.";
                break;
            default:
                feedbackMessage += "Invalid Code.";
        }
        updateDebugDisplay(feedbackMessage);
        console.log(`Debug command processed: ${feedbackMessage}`);
     }


    // --- Main Spin Logic ---
    function spin() {
         // Prevent spinning if already in progress
         if(isSpinning) {
             console.warn("Spin attempt ignored, already spinning.");
             return;
         }
         console.log("--- Spin Started ---");
         isSpinning = true;
         spinButton.disabled = true; // Disable button during spin
         messageDisplay.textContent = "Spinning..."; // Update status message
         confettiContainer.innerHTML = ''; // Clear previous confetti
         flashOverlay.classList.remove('active'); // Ensure flash is off

         // Deduct cost and update display
         currentMoney -= spinCost;
         updateMoneyDisplay();

         // Reset results for this spin
         finalResults = [];
         let outcomeType = null; // 'win', 'loss', 'near-miss'

         // 1. Determine Outcome (Check for forced outcome first)
         if(forceNextOutcome) {
             outcomeType = forceNextOutcome;
             forceNextOutcome = null; // Consume the forced outcome
             updateDebugDisplay(`Forced outcome [${outcomeType}] executed.`); // Update debug console
             console.log(`Using forced outcome: ${outcomeType}`);
         } else {
             // Regular outcome determination
             const randomRoll = Math.random();
             if (randomRoll < winProbability) {
                 outcomeType = 'win';
             } else if (randomRoll < winProbability + nearMissProbability) {
                 outcomeType = 'near-miss';
             } else {
                 outcomeType = 'loss';
             }
             console.log(`Rolled outcome: ${outcomeType} (Roll: ${randomRoll.toFixed(3)})`);
         }

         // 2. Generate Final Emojis based on Outcome
         switch (outcomeType) {
             case 'win':
                 // All three emojis are the same
                 const winningEmoji = getRandomEmoji();
                 finalResults = [winningEmoji, winningEmoji, winningEmoji];
                 break;
             case 'near-miss':
                 // First two are the same, third is different
                 const nearMissEmoji1 = getRandomEmoji();
                 let nearMissEmoji3 = getRandomEmoji();
                 while (nearMissEmoji3 === nearMissEmoji1) { // Ensure third is different
                     nearMissEmoji3 = getRandomEmoji();
                 }
                 // Randomly place the different emoji (e.g., AAB, ABA, BAA) - let's stick to AAB for simplicity now
                 finalResults = [nearMissEmoji1, nearMissEmoji1, nearMissEmoji3];
                  // Could add logic here to shuffle `finalResults` for ABA, BAA variations
                 break;
             case 'loss':
             default:
                 // Ensure no win (AAA) or simple near miss (AAB, BAA). ABB/BAB is okay.
                 let e1, e2, e3;
                 do {
                     e1 = getRandomEmoji();
                     e2 = getRandomEmoji();
                     e3 = getRandomEmoji();
                 } while (
                     (e1 === e2 && e2 === e3) || // Avoid AAA win
                     (e1 === e2 && e1 !== e3) || // Avoid AAB near miss
                     (e1 === e3 && e1 !== e2) || // Avoid ABA near miss (optional rule)
                     (e2 === e3 && e2 !== e1)    // Avoid BAA near miss
                 );
                 finalResults = [e1, e2, e3];
                 break;
         }
         console.log("Outcome determined:", outcomeType, "Final Emojis:", finalResults);

         // 3. Start Scrolling Animations for all reels
         reelInnerElements.forEach((_, i) => startScrolling(i));

         // 4. Schedule Reels to Stop Sequentially
         console.log("Scheduling reel stops...");
         setTimeout(() => {
             console.log("Stopping Reel 1 ->", finalResults[0]);
             stopReel(0, finalResults[0]);
         }, firstStopDelay);

         setTimeout(() => {
             console.log("Stopping Reel 2 ->", finalResults[1]);
             stopReel(1, finalResults[1]);
         }, firstStopDelay + stopDelayIncrement);

         const reel3StopTime = firstStopDelay + stopDelayIncrement * 2;
         setTimeout(() => {
             console.log("Stopping Reel 3 ->", finalResults[2]);
             stopReel(2, finalResults[2]);

             // 5. Schedule Final Result Check AFTER the last reel's animation should finish
             console.log(`All reels stopped. Scheduling final check in ${stopSettleDelay}ms...`);
             setTimeout(() => {
                 console.log("Executing final check...");
                 checkResult(finalResults); // Check the results
                 isSpinning = false; // Re-enable spinning
                 spinButton.disabled = false; // Re-enable button
                 console.log("--- Spin Finished ---");
             }, stopSettleDelay); // Wait for CSS transition to settle

         }, reel3StopTime);
    }

    // --- Result Checking ---
    function checkResult(finalEmojis) {
        console.log("Checking result:", finalEmojis);
        const [e1, e2, e3] = finalEmojis;

        if (e1 === e2 && e2 === e3) { // WIN condition
            winsSinceLastJackpot++;
            console.log(`Win detected! Wins since last jackpot: ${winsSinceLastJackpot}/${winsNeededForJackpot}`);

            if (winsSinceLastJackpot >= winsNeededForJackpot) { // JACKPOT condition
                const jackpotAmount = winAmount * jackpotMultiplier;
                messageDisplay.textContent = `🎉 JACKPOT! +$${jackpotAmount} 🎉`;
                currentMoney += jackpotAmount;
                flashOverlay.classList.add('active');
                // Duration of flash is handled by CSS animation iteration
                // Remove class after animation ends (adjust timing if needed)
                setTimeout(() => flashOverlay.classList.remove('active'), 1600); // 0.4s * 4 iterations
                showConfetti();
                winsSinceLastJackpot = 0; // Reset counter
                setNextJackpotTarget(); // Set next target
                console.log("Result: JACKPOT WIN!");
            } else { // Regular WIN
                messageDisplay.textContent = determineWinMessage(); // Get regular win message
                currentMoney += winAmount;
                showConfetti(); // Show celebration
                console.log("Result: Regular Win");
            }
            updateMoneyDisplay();

        } else if ( (e1 === e2 && e1 !== e3) || (e1 === e3 && e1 !== e2) || (e2 === e3 && e2 !== e1) ) { // NEAR MISS condition (any two match)
             messageDisplay.textContent = getRandomMessage(nearMissMessages);
             console.log("Result: Near Miss");
             // No money change for near miss
        } else { // LOSS condition (all different)
            messageDisplay.textContent = "Try again!";
            console.log("Result: Loss");
             // No money change for loss
        }
    }

}); // End DOMContentLoaded