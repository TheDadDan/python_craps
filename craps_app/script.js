document.addEventListener('DOMContentLoaded', () => {
    const rollButton = document.getElementById('rollButton');
    const resetButton = document.getElementById('resetButton');
    const gameStateDisplay = document.getElementById('game-state');
    const diceContainer = document.getElementById('dice-container');
    const rollResultsDisplay = document.getElementById('roll-results');
    const pointDisplay = document.getElementById('point-display');
    const playerBalanceDisplay = document.getElementById('player-balance');
    const passLineBetInput = document.getElementById('pass-line-bet');
    const dontPassBetInput = document.getElementById('dont-pass-bet');
    const singleRollBetTypeSelect = document.getElementById('single-roll-bet-type');
    const singleRollBetAmountInput = document.getElementById('single-roll-bet-amount');
    const placeBetsButton = document.getElementById('placeBetsButton');

    let playerBalance = 1000; // Initial player balance
    let currentBets = {}; // To store active bets

    function updateBalanceDisplay() {
        playerBalanceDisplay.textContent = playerBalance;
    }

    async function placeBets() {
        const passLineBet = parseInt(passLineBetInput.value);
        const dontPassBet = parseInt(dontPassBetInput.value);
        const singleRollBetType = singleRollBetTypeSelect.value;
        const singleRollBetAmount = parseInt(singleRollBetAmountInput.value);

        let totalBetAmount = passLineBet + dontPassBet + singleRollBetAmount;

        if (totalBetAmount > playerBalance) {
            alert("You don't have enough money for these bets!");
            return;
        }

        // Deduct from balance
        playerBalance -= totalBetAmount;
        updateBalanceDisplay();

        currentBets = {
            passLine: passLineBet,
            dontPass: dontPassBet,
            singleRoll: {
                type: singleRollBetType,
                amount: singleRollBetAmount
            }
        };

        // Send bets to backend (assumed new endpoint /craps_place_bets)
        try {
            const response = await fetch('/craps_place_bets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(currentBets)
            });
            const data = await response.json();
            renderGameState(data); // Call renderGameState to update UI with new balance and active bets
        } catch (error) {
            console.error('Error placing bets:', error);
            alert('Error placing bets. Please try again.');
            // Refund money if backend call fails
            playerBalance += totalBetAmount;
            updateBalanceDisplay();
        }
        // Reset bet inputs after placing bets
        passLineBetInput.value = 0;
        dontPassBetInput.value = 0;
        singleRollBetTypeSelect.value = 'none';
        singleRollBetAmountInput.value = 0;
    }

    async function updateGameState() {
        try {
            const response = await fetch('/craps_roll', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            renderGameState(data);
        } catch (error) {
            console.error('Error fetching game state:', error);
            gameStateDisplay.textContent = 'Error: Could not connect to server.';
        }
    }

    async function resetGame() {
        try {
            const response = await fetch('/craps_reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ active_bets: currentBets }) // Send current bets to reset them on backend
            });
            const data = await response.json();
            renderGameState(data);
        } catch (error) {
            console.error('Error resetting game:', error);
            gameStateDisplay.textContent = 'Error: Could not reset game.';
        }
    }

    function renderGameState(state) {
        // Display message and point
        gameStateDisplay.textContent = state.message;
        if (state.point) {
            pointDisplay.textContent = `Point: ${state.point}`;
        } else {
            pointDisplay.textContent = '';
        }

        // Update player balance
        playerBalance = state.player_balance;
        updateBalanceDisplay();

        // Clear existing dice
        diceContainer.innerHTML = '';
        rollResultsDisplay.textContent = '';

        if (state.last_roll && state.last_roll.length === 2) {
            // Add rolling animation class
            diceContainer.classList.add('rolling');

            // Create dice for animation
            for (let i = 0; i < 2; i++) {
                const dieWrapper = document.createElement('div');
                dieWrapper.classList.add('die-wrapper');
                const die = document.createElement('div');
                die.classList.add('die');
                die.dataset.value = Math.floor(Math.random() * 6) + 1; // Random value for animation
                drawDots(die, parseInt(die.dataset.value));
                dieWrapper.appendChild(die);
                diceContainer.appendChild(dieWrapper);
            }

            // After animation, display actual results
            setTimeout(() => {
                diceContainer.classList.remove('rolling');
                diceContainer.innerHTML = ''; // Clear animated dice
                state.last_roll.forEach(roll => {
                    const dieWrapper = document.createElement('div');
                    dieWrapper.classList.add('die-wrapper');
                    const die = document.createElement('div');
                    die.classList.add('die');
                    die.dataset.value = roll;
                    drawDots(die, roll);
                    dieWrapper.appendChild(die);
                    diceContainer.appendChild(dieWrapper);
                });
                const total = state.last_roll[0] + state.last_roll[1];
                rollResultsDisplay.textContent = `Rolled: ${state.last_roll[0]} + ${state.last_roll[1]} = ${total}`;
            }, 1000); // Animation duration should match CSS
        }

        if (state.round_over) {
            rollButton.textContent = 'Start New Round';
            resetButton.style.display = 'none';
        } else {
            rollButton.textContent = 'Roll Dice';
            resetButton.style.display = 'inline-block';
        }
    }

    function drawDots(dieElement, value) {
        dieElement.innerHTML = '';
        if (value >= 1 && value <= 6) { // Ensure value is for a standard die
            for (let i = 0; i < value; i++) {
                const dot = document.createElement('div');
                dot.classList.add('dot');
                dieElement.appendChild(dot);
            }
        } else { // For values beyond 6, display the number directly
            dieElement.textContent = value;
        }
    }

    rollButton.addEventListener('click', updateGameState);
    resetButton.addEventListener('click', resetGame);
    placeBetsButton.addEventListener('click', placeBets);

    // Initial render of game state and balance
    updateBalanceDisplay();
    resetGame();
});
