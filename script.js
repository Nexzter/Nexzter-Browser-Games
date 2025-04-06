document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const emojis = ["🍎", "🍊", "🍋", "🍉", "🍇", "🍓", "🍒", "⭐", "💎", "🔔", "💰", "🍀"];
    const spinCost = 10; const winAmount = 100; const startingMoney = 100; const winProbability = 0.05; const nearMissProbability = 0.50;
    const nearMissMessages = [ "Almost there!", "So close!", "99% of gamblers quit before they hit big", "Just missed!", "Edging", "Keep trying!" ]; const winMessages = [ "You Win!", "Big Win!", "So skill!", "Winner Winner!" ]; const specialWinMessage = "You can win bigger my skibidi"; const specialWinMessageChance = 0.01; const jackpotMultiplier = 10; const minWinsForJackpot = 5; const maxWinsForJackpot = 10; const backgroundEmojiCount = 250; // Not used if grid works
    // --- Animation & Layout Constants ---
    const REEL_HEIGHT = 100; const EMOJI_COUNT_PER_REEL = 20; const SCROLL_SPEED_FACTOR = 15; const firstStopDelay = 1000; const stopDelayIncrement = 500; const stopSettleDelay = 350; const bgGridSpacing = 150;
    // --- DOM Elements ---
    console.log("Selecting DOM elements..."); const reel1 = document.getElementById('reel1'); const reel2 = document.getElementById('reel2'); const reel3 = document.getElementById('reel3'); const reel1Inner = reel1 ? reel1.querySelector('.reel-inner') : null; const reel2Inner = reel2 ? reel2.querySelector('.reel-inner') : null; const reel3Inner = reel3 ? reel3.querySelector('.reel-inner') : null; const reelInnerElements = [reel1Inner, reel2Inner, reel3Inner]; const spinButton = document.getElementById('spin-button'); const moneyDisplay = document.getElementById('money-display'); const moneyDisplaySpan = moneyDisplay ? moneyDisplay.querySelector('span') : null; const messageDisplay = document.getElementById('message-display'); const confettiContainer = document.getElementById('confetti-container'); const flashOverlay = document.getElementById('flash-overlay'); const debugConsole = document.getElementById('debug-console'); const debugCodeDisplay = document.getElementById('debug-code-display'); const debugFeedback = document.getElementById('debug-feedback'); const bodyElement = document.body; const scrollingBgContent = document.getElementById('scrolling-bg-content'); console.log("Element selection finished.");
    // --- CRITICAL ELEMENT CHECK ---
    let missingElement = false; let missingElementName = ''; const requiredElements = { reel1, reel2, reel3, reel1Inner, reel2Inner, reel3Inner, spinButton, moneyDisplay, moneyDisplaySpan, messageDisplay, confettiContainer, flashOverlay, debugConsole, debugCodeDisplay, debugFeedback, bodyElement, scrollingBgContent }; console.log("Starting critical element check..."); for (const [name, element] of Object.entries(requiredElements)) { if (!element) { missingElementName = name; console.error(`CRITICAL ERROR: Initialization failed. Required element "${missingElementName}" not found.`); missingElement = true; break; } } console.log("Element check finished."); if (missingElement) { try { const e = document.createElement('div'); e.style.cssText = 'color:red;position:fixed;top:10px;left:10px;background:black;padding:10px;z-index:9999;border:1px solid red;font-family:sans-serif;'; e.textContent = `Init Error! Element "${missingElementName}" missing. Check console.`; (document.body||document.documentElement).appendChild(e); } catch (err) { console.error("Could not display on-screen error.", err); } return; } console.log("All critical elements found. Proceeding.");
    // --- Game State ---
    let currentMoney = startingMoney; let isSpinning = false; let reelAnimationData = [ { animationFrameId: null, currentY: 0, speed: SCROLL_SPEED_FACTOR + Math.random() * 5 }, { animationFrameId: null, currentY: 0, speed: SCROLL_SPEED_FACTOR + Math.random() * 5 }, { animationFrameId: null, currentY: 0, speed: SCROLL_SPEED_FACTOR + Math.random() * 5 } ]; let finalResults = []; let winsSinceLastJackpot = 0; let winsNeededForJackpot = 0; let isDebugModeActive = false; let currentDebugCode = ""; let forceNextOutcome = null;
    // --- Initialization ---
    populateBackgroundEmojis(); reelInnerElements.forEach(populateReel); setNextJackpotTarget(); updateMoneyDisplay();
    // --- Event Listeners ---
    spinButton.addEventListener('click', spin); window.addEventListener('keydown', handleDebugKeys);

    // --- Core Functions ---
    function populateBackgroundEmojis() { /* ... as before ... */ if (!scrollingBgContent) return; scrollingBgContent.innerHTML = ''; const fragment = document.createDocumentFragment(); const containerWidth = 3000; const containerHeight = 3000; const numCols = Math.ceil(containerWidth / bgGridSpacing); const numRows = Math.ceil(containerHeight / bgGridSpacing); let count = 0; for (let r = 0; r < numRows; r++) { for (let c = 0; c < numCols; c++) { const emojiSpan = document.createElement('span'); emojiSpan.classList.add('bg-emoji'); emojiSpan.textContent = getRandomEmoji(); let leftPos = c * bgGridSpacing; let topPos = r * bgGridSpacing; emojiSpan.style.left = `${leftPos}px`; emojiSpan.style.top = `${topPos}px`; fragment.appendChild(emojiSpan); count++; } } scrollingBgContent.appendChild(fragment); /* console.log(`Populated background with ${count} emojis in grid.`); */ }
    function getRandomEmoji() { /* ... as before ... */ if (!emojis || emojis.length === 0) { console.error("Emoji list empty!"); return '❓'; } return emojis[Math.floor(Math.random() * emojis.length)]; }
    function populateReel(reelInner, index) { /* ... as before ... */ if (!reelInner) { const r=document.getElementById(`reel${index+1}`); if(r) r.innerHTML='<div style="color:red;text-align:center;padding-top: 30px;font-size:12px;">Error!</div>'; return; } reelInner.innerHTML=''; const f=document.createDocumentFragment(); const n=[]; for(let i=0;i<EMOJI_COUNT_PER_REEL;i++){const s=document.createElement('span');s.classList.add('emoji');s.textContent=getRandomEmoji();f.appendChild(s);n.push(s);} reelInner.appendChild(f); n.forEach(node=>{reelInner.appendChild(node.cloneNode(true));}); reelInner.style.transition='none'; reelInner.style.transform='translateY(0px)'; void reelInner.offsetHeight; reelInner.style.transition=''; }
    function updateMoneyDisplay() { /* ... as before ... */ let f; if(currentMoney<0){moneyDisplay.classList.add('debt');f=`-$${Math.abs(currentMoney)}`;}else{moneyDisplay.classList.remove('debt');f=`$${currentMoney}`;};moneyDisplaySpan.textContent=f;}
    function getRandomMessage(messages) { /* ... as before ... */ if(!messages||messages.length===0)return "Msg Error"; return messages[Math.floor(Math.random()*messages.length)]; }
    function showConfetti() { /* ... as before ... */ confettiContainer.innerHTML='';const c=100;const o=['#f00','#0f0','#00f','#ff0','#f0f','#0ff','#ffa500','#ff4500'];for(let i=0;i<c;i++){const e=document.createElement('div');e.classList.add('confetti');e.style.left=`${Math.random()*100}vw`;e.style.backgroundColor=o[Math.floor(Math.random()*o.length)];e.style.animationDuration=`${Math.random()*2+2}s`;e.style.animationDelay=`${Math.random()*1}s`;e.style.transform=`scale(${Math.random()*0.5+0.5})`;confettiContainer.appendChild(e);} setTimeout(()=>confettiContainer.innerHTML='',5000); }
    function startScrolling(reelIndex) { /* ... as before ... */ const reelInner = reelInnerElements[reelIndex]; const data = reelAnimationData[reelIndex]; if (!reelInner || !data) return; let lastTimestamp = 0; reelInner.style.transition = 'none'; function scrollStep(timestamp) { if (!reelInner || !data) return; if (!lastTimestamp) lastTimestamp = timestamp; lastTimestamp = timestamp; data.currentY += data.speed; const originalContentHeight = EMOJI_COUNT_PER_REEL * REEL_HEIGHT; if (data.currentY >= originalContentHeight) { data.currentY -= originalContentHeight; } reelInner.style.transform = `translateY(${-data.currentY}px)`; if (data.animationFrameId) { data.animationFrameId = requestAnimationFrame(scrollStep); } } cancelAnimationFrame(data.animationFrameId); data.animationFrameId = requestAnimationFrame(scrollStep); }
    function stopReel(reelIndex, finalEmoji) { /* ... as before ... */ const reelInner = reelInnerElements[reelIndex]; const data = reelAnimationData[reelIndex]; if (!reelInner || !data) return; cancelAnimationFrame(data.animationFrameId); data.animationFrameId = null; const allEmojiElements = reelInner.children; if (!allEmojiElements || allEmojiElements.length === 0) return; let targetIndex = -1; for (let i = 0; i < EMOJI_COUNT_PER_REEL; i++) { if (allEmojiElements[i] && allEmojiElements[i].textContent === finalEmoji) { targetIndex = i; break; } } if (targetIndex === -1) { targetIndex = 0; if (allEmojiElements[targetIndex]) { allEmojiElements[targetIndex].textContent=finalEmoji; const c=targetIndex+EMOJI_COUNT_PER_REEL; if(allEmojiElements[c])allEmojiElements[c].textContent=finalEmoji;}} const targetY = targetIndex * REEL_HEIGHT; reelInner.style.transition = ''; reelInner.style.transform = `translateY(${-targetY}px)`; data.currentY = targetY % (EMOJI_COUNT_PER_REEL * REEL_HEIGHT); }
    function setNextJackpotTarget() { /* ... as before ... */ winsNeededForJackpot=Math.floor(Math.random()*(maxWinsForJackpot-minWinsForJackpot+1))+minWinsForJackpot; }
    function determineWinMessage() { /* ... as before ... */ return (Math.random()<specialWinMessageChance)?specialWinMessage:getRandomMessage(winMessages); }
    function handleDebugKeys(event) { /* ... as before ... */ if(event.key==='.'&&!isDebugModeActive){const t=event.target.tagName.toLowerCase();if(t!=='input'&&t!=='textarea'){event.preventDefault();toggleDebugMode();return;}} if(event.key==='Escape'&&isDebugModeActive){event.preventDefault();toggleDebugMode();return;} if(isDebugModeActive){if(!isNaN(parseInt(event.key))&&event.key.length===1){event.preventDefault();currentDebugCode+=event.key;updateDebugDisplay();}else if(event.key==='Enter'){event.preventDefault();processDebugCode(currentDebugCode);currentDebugCode="";updateDebugDisplay();}else if(event.key==='Backspace'){event.preventDefault();currentDebugCode=currentDebugCode.slice(0,-1);updateDebugDisplay();}} }
    function toggleDebugMode() { /* ... as before ... */ isDebugModeActive=!isDebugModeActive;bodyElement.classList.toggle('debug-active',isDebugModeActive);currentDebugCode="";forceNextOutcome=null;updateDebugDisplay(isDebugModeActive?"Debug Active. Enter code:":"Debug Deactivated."); }
    function updateDebugDisplay(feedback="") { /* ... as before ... */ debugCodeDisplay.textContent=currentDebugCode||"____";debugFeedback.textContent=feedback; }
    function processDebugCode(code) { /* ... as before ... */ let f=`Code "${code}" -> `;switch(code){case'7771':winsSinceLastJackpot=winsNeededForJackpot-1;f+="Jackpot primed!";forceNextOutcome='win';break;case'5001':forceNextOutcome='win';f+="Force WIN.";break;case'5000':forceNextOutcome='loss';f+="Force LOSS.";break;case'5002':forceNextOutcome='near-miss';f+="Force NEAR MISS.";break;case'8888':currentMoney+=1000;updateMoneyDisplay();f+="+ $1000.";break;case'0101':winsSinceLastJackpot=0;f+="Jackpot counter reset.";break;default:f+="Invalid Code.";}updateDebugDisplay(f); }

    // --- Main Spin Logic (UPDATED TIMEOUT CHAIN) ---
    function spin() {
         if(isSpinning) return;
         console.log("--- Spin Started ---"); // Log start
         isSpinning = true;
         spinButton.disabled = true;
         messageDisplay.textContent = "Spinning...";
         confettiContainer.innerHTML = '';
         flashOverlay.classList.remove('active');
         currentMoney -= spinCost;
         updateMoneyDisplay();
         finalResults = [];
         let outcomeType = null;

         // Determine Outcome
         if(forceNextOutcome){ o = forceNextOutcome; forceNextOutcome = null; updateDebugDisplay(`Forced ${o} executed.`); }
         else{ const r = Math.random(); if(r < winProbability) o = 'win'; else if(r < winProbability + nearMissProbability) o = 'near-miss'; else o = 'loss'; }
         outcomeType = o; // Assign determined outcome

         // Generate Emojis
         switch(outcomeType){ case'win':const w=getRandomEmoji();finalResults=[w,w,w];break; case'near-miss':const a=getRandomEmoji();let b=getRandomEmoji();while(b===a)b=getRandomEmoji();finalResults=[a,a,b];break; case'loss':default:let e1,e2,e3;do{e1=getRandomEmoji();e2=getRandomEmoji();e3=getRandomEmoji();}while((e1===e2&&e2===e3)||(e1===e2&&e1!==e3));finalResults=[e1,e2,e3];break; }
         console.log("Outcome determined:", outcomeType, finalResults);

         // Start Scrolling
         reelInnerElements.forEach((_,i)=>startScrolling(i));

         // Stop Reels Sequentially
         console.log("Scheduling reel stops...");
         setTimeout(() => {
             console.log("Stopping Reel 1");
             stopReel(0, finalResults[0]);
         }, firstStopDelay);

         setTimeout(() => {
             console.log("Stopping Reel 2");
             stopReel(1, finalResults[1]);
         }, firstStopDelay + stopDelayIncrement);

         // --- Final Timeout for Reel 3 and Completion ---
         const reel3StopTime = firstStopDelay + stopDelayIncrement * 2;
         setTimeout(() => {
             console.log("Stopping Reel 3");
             stopReel(2, finalResults[2]);

             // Schedule the checkResult and state reset AFTER the stop animation delay
             console.log(`Reel 3 stopped. Scheduling final check in ${stopSettleDelay}ms...`);
             setTimeout(() => {
                 console.log("Executing final check...");
                 checkResult(finalResults);
                 isSpinning = false;
                 spinButton.disabled = false;
                 console.log("--- Spin Finished ---"); // Log end
             }, stopSettleDelay); // Wait for CSS transition

         }, reel3StopTime);
    }

    // --- Result Checking (unchanged) ---
    function checkResult(finalEmojis) {
        console.log("Checking result:", finalEmojis); // Log result check
        const [e1,e2,e3]=finalEmojis;if(e1===e2&&e2===e3){winsSinceLastJackpot++;if(winsSinceLastJackpot>=winsNeededForJackpot){const j=winAmount*jackpotMultiplier;messageDisplay.textContent=`🎉 JACKPOT! +$${j} 🎉`;currentMoney+=j;flashOverlay.classList.add('active');setTimeout(()=>flashOverlay.classList.remove('active'),1600);showConfetti();winsSinceLastJackpot=0;setNextJackpotTarget();console.log("Result: JACKPOT");}else{messageDisplay.textContent=determineWinMessage();currentMoney+=winAmount;showConfetti();console.log("Result: Regular Win");}updateMoneyDisplay();}else if(e1===e2&&e1!==e3){messageDisplay.textContent=getRandomMessage(nearMissMessages);console.log("Result: Near Miss");}else{messageDisplay.textContent="Try again!";console.log("Result: Loss");}
    }

}); // End DOMContentLoaded