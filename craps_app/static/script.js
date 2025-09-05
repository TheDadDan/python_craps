document.addEventListener('DOMContentLoaded', () => {
    const rollButton = document.getElementById('rollButton');
    const resetButton = document.getElementById('resetButton');
    const gameStateDisplay = document.getElementById('game-state');
    const diceContainer = document.getElementById('dice-container');
    const rollResultsDisplay = document.getElementById('roll-results');
    const pointDisplay = document.getElementById('point-display');
    const placeBetsButton = document.getElementById('placeBetsButton');
    const playerBalanceDisplay = document.getElementById('player-balance');
    const passLineBetInput = document.getElementById('pass-line-bet');
    const dontPassBetInput = document.getElementById('dont-pass-bet');
    const singleRollBetTypeSelect = document.getElementById('single-roll-bet-type');
    const singleRollBetAmountInput = document.getElementById('single-roll-bet-amount');

    async function updateGameState() {
        try {
            const response = await fetch('/craps/craps_roll', {
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
            const response = await fetch('/craps/craps_reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            renderGameState(data);
        } catch (error) {
            console.error('Error resetting game:', error);
            gameStateDisplay.textContent = 'Error: Could not reset game.';
        }
    }

    async function placeBets() {
        const passLineBet = parseInt(passLineBetInput.value);
        const dontPassBet = parseInt(dontPassBetInput.value);
        const singleRollBetType = singleRollBetTypeSelect.value;
        const singleRollBetAmount = parseInt(singleRollBetAmountInput.value);

        try {
            const response = await fetch('/craps/place_bets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pass_line_bet: passLineBet,
                    dont_pass_bet: dontPassBet,
                    single_roll_bet_type: singleRollBetType,
                    single_roll_bet_amount: singleRollBetAmount,
                }),
            });
            const data = await response.json();
            if (data.success) {
                playerBalanceDisplay.textContent = data.new_balance;
                // Optionally, clear bet inputs after placing bets
                passLineBetInput.value = 0;
                dontPassBetInput.value = 0;
                singleRollBetTypeSelect.value = 'none';
                singleRollBetAmountInput.value = 0;
                // Re-render game state to reflect any immediate changes if needed
                // renderGameState(data.game_state);
            } else {
                alert(data.message || 'Failed to place bets.');
            }
        } catch (error) {
            console.error('Error placing bets:', error);
            alert('Error: Could not place bets.');
        }
    }

    function renderGameState(state) {
        // Display message and point
        gameStateDisplay.textContent = state.message;
        // Clear point display initially, it will be updated after animation if needed
        pointDisplay.textContent = '';

        // Update player balance display
        playerBalanceDisplay.textContent = state.player_balance;

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

                // Display point after animation if applicable
                if (state.point) {
                    pointDisplay.textContent = `Point: ${state.point}`;
                } else {
                    pointDisplay.textContent = '';
                }
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

    // Initial render of game state
    resetGame();
});
