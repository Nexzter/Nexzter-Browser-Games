document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const rpsChoices = ["✊", "✋", "✌️"]; // Rock, Paper, Scissors Emojis
    const choiceMap = { "✊": "rock", "✋": "paper", "✌️": "scissors" };
    const revealDelay = 500;
    const WINS_NEEDED = 3; // Wins required to win the match

    // Background Scroll Config (Unchanged)
    const bgGridSpacing = 150;
    const BG_CONTENT_SIZE = 6000;
    const BG_ANIMATION_DISTANCE = BG_CONTENT_SIZE / 2;
    const BG_ANIMATION_DURATION_SECONDS = 500;

    // --- DOM Elements ---
    console.log("Selecting DOM elements...");
    const playerChoiceDisplay = document.getElementById('player-choice-display');
    const computerChoiceDisplay = document.getElementById('computer-choice-display');
    const rockButton = document.getElementById('rock-button');
    const paperButton = document.getElementById('paper-button');
    const scissorsButton = document.getElementById('scissors-button');
    const choiceButtons = [rockButton, paperButton, scissorsButton];
    const messageDisplay = document.getElementById('message-display');
    const confettiContainer = document.getElementById('confetti-container');
    const scrollingBgContent = document.getElementById('scrolling-bg-content');
    // NEW Score/Winner Elements
    const playerScoreDisplay = document.getElementById('player-score');
    const cpuScoreDisplay = document.getElementById('cpu-score');
    const winnerMessageDisplay = document.getElementById('winner-message');
    console.log("Element selection finished.");

    // --- CRITICAL ELEMENT CHECK ---
    let missingElement = false;
    let missingElementName = '';
    const requiredElements = {
        playerChoiceDisplay, computerChoiceDisplay, rockButton, paperButton, scissorsButton,
        messageDisplay, confettiContainer, scrollingBgContent,
        playerScoreDisplay, cpuScoreDisplay, winnerMessageDisplay // Added new elements
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
        try { // Display error on screen if possible
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = 'color:red;position:fixed;top:10px;left:10px;background:black;padding:10px;z-index:9999;border:1px solid red;font-family:sans-serif;';
            errorDiv.textContent = `Init Error! Element "${missingElementName}" missing. Check console.`;
            (document.body || document.documentElement).appendChild(errorDiv);
        } catch (err) { console.error("Could not display init error.", err); }
        return; // Stop execution
    }
    console.log("All critical elements found. Proceeding.");

    // --- Game State ---
    let isPlaying = false;
    let playerScore = 0;
    let cpuScore = 0;
    let gameOver = false; // To stop play after match ends

    // --- Initialization ---
    setupScrollingBackground();
    resetChoiceDisplays();
    updateScoreDisplay(); // Initialize score display
    winnerMessageDisplay.textContent = ''; // Ensure winner message is clear initially
    enableChoiceButtons(); // Make sure buttons start enabled

    // --- Event Listeners ---
    rockButton.addEventListener('click', () => handlePlayerChoice('✊'));
    paperButton.addEventListener('click', () => handlePlayerChoice('✋'));
    scissorsButton.addEventListener('click', () => handlePlayerChoice('✌️'));

    // --- Core Functions ---

    /**
     * Handles the player clicking one of the choice buttons.
     */
    function handlePlayerChoice(playerChoiceEmoji) {
        // Ignore clicks if game is over or already playing
        if (isPlaying || gameOver) {
            console.warn(`Choice ignored: isPlaying=${isPlaying}, gameOver=${gameOver}`);
            return;
        }

        console.log(`--- Round Started: Player chose ${playerChoiceEmoji} ---`);
        isPlaying = true;
        disableChoiceButtons();
        messageDisplay.textContent = "Rock, Paper, Scissors...";
        winnerMessageDisplay.textContent = ''; // Clear previous winner message if any
        confettiContainer.innerHTML = '';
        resetChoiceDisplays();

        playerChoiceDisplay.textContent = playerChoiceEmoji;

        const computerChoiceEmoji = getRandomRPSChoice();

        // Reveal after delay
        setTimeout(() => {
            console.log(`Computer chose ${computerChoiceEmoji}`);
            computerChoiceDisplay.textContent = computerChoiceEmoji;

            const result = determineWinner(playerChoiceEmoji, computerChoiceEmoji);
            console.log(`Result: ${result}`);

            processResult(result); // Updates scores, messages, checks for winner

            // Only re-enable buttons if the game isn't over
            isPlaying = false;
            if (!gameOver) {
                enableChoiceButtons();
            }
            console.log("--- Round Finished ---");

        }, revealDelay);
    }

    /**
     * Determines the winner of a single round. (Unchanged)
     */
    function determineWinner(playerEmoji, computerEmoji) {
        const player = choiceMap[playerEmoji];
        const computer = choiceMap[computerEmoji];

        if (player === computer) return 'tie';
        if ((player === 'rock' && computer === 'scissors') ||
            (player === 'paper' && computer === 'rock') ||
            (player === 'scissors' && computer === 'paper')) {
            return 'win';
        }
        return 'loss';
    }

    /**
     * Updates scores, messages, triggers effects, and checks for overall winner.
     */
    function processResult(result) {
        switch (result) {
            case 'win':
                messageDisplay.textContent = "🎉 You Win Round! 🎉";
                playerScore++;
                showConfetti(); // Celebrate round win
                break;
            case 'loss':
                messageDisplay.textContent = "😭 CPU Wins Round! 😭";
                cpuScore++;
                break;
            case 'tie':
            default:
                messageDisplay.textContent = "🤝 Round Tie! 🤝";
                break;
        }
        updateScoreDisplay(); // Update visuals
        checkOverallWinner(); // Check if the match is over
    }

    /**
     * Updates the score display elements on the page.
     */
    function updateScoreDisplay() {
        playerScoreDisplay.textContent = playerScore;
        cpuScoreDisplay.textContent = cpuScore;
        console.log(`Score updated: Player ${playerScore} - CPU ${cpuScore}`);
    }

    /**
      * Checks if either player has reached the required wins.
      * If so, declares winner and ends the game.
      */
    function checkOverallWinner() {
        if (playerScore >= WINS_NEEDED) {
            winnerMessageDisplay.textContent = "🏆 Player Wins the Match! 🏆";
            console.log("MATCH OVER: Player wins");
            gameOver = true;
            disableChoiceButtons(); // Keep buttons disabled
            // Optional: Bigger confetti burst for match win?
            // showConfetti(); // Could call again for emphasis
        } else if (cpuScore >= WINS_NEEDED) {
            winnerMessageDisplay.textContent = "🤖 CPU Wins the Match! 🤖";
            console.log("MATCH OVER: CPU wins");
            gameOver = true;
            disableChoiceButtons(); // Keep buttons disabled
        }
        // Otherwise, game continues, gameOver remains false
    }


    /**
     * Resets the choice display areas to placeholders. (Unchanged)
     */
    function resetChoiceDisplays() {
        playerChoiceDisplay.textContent = '❓';
        computerChoiceDisplay.textContent = '❓';
    }

    /**
    * Disables all RPS choice buttons. (Unchanged)
    */
    function disableChoiceButtons() {
        choiceButtons.forEach(button => button.disabled = true);
    }

    /**
    * Enables all RPS choice buttons if not currently playing AND game not over.
    */
    function enableChoiceButtons() {
        // Enable only if the game is not over and not currently processing a choice
        const enable = !isPlaying && !gameOver;
        choiceButtons.forEach(button => button.disabled = !enable);

        // Update message based on state
        if (enable) {
            messageDisplay.textContent = "Make your choice!";
        } else if (isPlaying) {
             messageDisplay.textContent = "Rock, Paper, Scissors..."; // Or keep existing message
        }
        // If gameOver, the winner message is already displayed.
    }

    /**
     * Returns a random RPS choice emoji. (Unchanged)
     */
    function getRandomRPSChoice() {
        return rpsChoices[Math.floor(Math.random() * rpsChoices.length)];
    }

    /**
     * Populates the background container (Unchanged)
     */
    function setupScrollingBackground() {
        if (!scrollingBgContent) return;
        scrollingBgContent.innerHTML = '';
        const fragment = document.createDocumentFragment();
        const containerWidth = BG_CONTENT_SIZE;
        const containerHeight = BG_CONTENT_SIZE;
        const numCols = Math.ceil(containerWidth / bgGridSpacing);
        const numRows = Math.ceil(containerHeight / bgGridSpacing);
        for (let r = 0; r < numRows; r++) {
            for (let c = 0; c < numCols; c++) {
                const emojiSpan = document.createElement('span');
                emojiSpan.classList.add('bg-emoji');
                emojiSpan.textContent = rpsChoices[Math.floor(Math.random() * rpsChoices.length)];
                emojiSpan.style.left = `${c * bgGridSpacing}px`;
                emojiSpan.style.top = `${r * bgGridSpacing}px`;
                fragment.appendChild(emojiSpan);
            }
        }
        scrollingBgContent.appendChild(fragment);
        scrollingBgContent.style.setProperty('--bg-content-size', `${BG_CONTENT_SIZE}px`);
        scrollingBgContent.style.setProperty('--bg-animation-distance', `-${BG_ANIMATION_DISTANCE}px`);
        scrollingBgContent.style.setProperty('--bg-animation-duration', `${BG_ANIMATION_DURATION_SECONDS}s`);
    }

    /**
     * Shows confetti (Unchanged)
     */
    function showConfetti() {
        confettiContainer.innerHTML = ''; // Clear previous before adding new
        const confettiCount = 100;
        const colors = ['#f00', '#0f0', '#00f', '#ff0', '#f0f', '#0ff', '#ffa500', '#ff4500'];
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.classList.add('confetti');
            confetti.style.left = `${Math.random() * 100}vw`;
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDuration = `${Math.random() * 2 + 2}s`;
            confetti.style.animationDelay = `${Math.random() * 1}s`;
            confetti.style.transform = `scale(${Math.random() * 0.5 + 0.5})`;
            confettiContainer.appendChild(confetti);
        }
        setTimeout(() => confettiContainer.innerHTML = '', 5000);
    }

}); // End DOMContentLoaded