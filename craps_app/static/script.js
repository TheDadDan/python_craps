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

    let gameState = {
        point: null,
        roundOver: true,
        lastRoll: [],
        message: 'Welcome to Craps! Roll the dice to start a new round.',
        playerBalance: 1000,
        activeBets: {
            passLine: 0,
            dontPass: 0,
            singleRoll: { type: 'none', amount: 0 }
        }
    };

    function rollDice() {
        return [
            Math.floor(Math.random() * 6) + 1,
            Math.floor(Math.random() * 6) + 1
        ];
    }

    function resolveSingleRollBet(total) {
        const bet = gameState.activeBets.singleRoll;
        if (bet.type === 'none' || bet.amount <= 0) return { delta: 0, message: null };

        const amount = bet.amount;
        let delta = 0;
        let msg = null;

        if (bet.type === 'any-7' && total === 7) {
            delta = amount * 5;
            msg = `Won $${amount * 4} on Any 7!`;
        } else if (bet.type === 'any-craps' && (total === 2 || total === 3 || total === 12)) {
            delta = amount * 8;
            msg = `Won $${amount * 7} on Any Craps!`;
        } else if (bet.type === 'two-or-twelve' && (total === 2 || total === 12)) {
            delta = amount * 31;
            msg = `Won $${amount * 30} on 2 or 12!`;
        } else if (bet.type === 'three-or-eleven' && (total === 3 || total === 11)) {
            delta = amount * 16;
            msg = `Won $${amount * 15} on 3 or 11!`;
        } else if (bet.type === 'called-2' && total === 2) {
            delta = amount * 31;
            msg = `Won $${amount * 30} on Called 2!`;
        } else if (bet.type === 'called-12' && total === 12) {
            delta = amount * 31;
            msg = `Won $${amount * 30} on Called 12!`;
        } else {
            msg = `Lost $${amount} on ${bet.type} bet.`;
        }

        gameState.activeBets.singleRoll = { type: 'none', amount: 0 };
        return { delta, message: msg };
    }

    function handleRoll() {
        const [d1, d2] = rollDice();
        const total = d1 + d2;
        gameState.lastRoll = [d1, d2];

        const outcomeMessages = [];
        let balanceChange = 0;

        const srResult = resolveSingleRollBet(total);
        balanceChange += srResult.delta;
        if (srResult.message) outcomeMessages.push(srResult.message);

        if (gameState.roundOver) {
            // Come-out roll
            const passLine = gameState.activeBets.passLine;
            const dontPass = gameState.activeBets.dontPass;

            if (total === 7 || total === 11) {
                gameState.message = `Rolled ${total}. Natural! Round Over.`;
                if (passLine > 0) {
                    balanceChange += passLine * 2;
                    outcomeMessages.push(`Won $${passLine} on Pass Line!`);
                }
                if (dontPass > 0) {
                    outcomeMessages.push(`Lost $${dontPass} on Don't Pass.`);
                }
                gameState.activeBets.passLine = 0;
                gameState.activeBets.dontPass = 0;
                gameState.roundOver = true;
            } else if (total === 2 || total === 3 || total === 12) {
                gameState.message = `Rolled ${total}. Craps! Round Over.`;
                if (passLine > 0) {
                    outcomeMessages.push(`Lost $${passLine} on Pass Line.`);
                }
                if (dontPass > 0) {
                    if (total === 12) {
                        balanceChange += dontPass;
                        outcomeMessages.push(`Don't Pass: Push on 12, bet returned.`);
                    } else {
                        balanceChange += dontPass * 2;
                        outcomeMessages.push(`Won $${dontPass} on Don't Pass!`);
                    }
                }
                gameState.activeBets.passLine = 0;
                gameState.activeBets.dontPass = 0;
                gameState.roundOver = true;
            } else {
                gameState.point = total;
                gameState.roundOver = false;
                gameState.message = `Rolled ${total}. Point is ${total}. Roll again to hit your point or a 7 to lose.`;
            }
        } else {
            // Point-established roll
            const point = gameState.point;
            const passLine = gameState.activeBets.passLine;
            const dontPass = gameState.activeBets.dontPass;

            if (total === point) {
                gameState.message = `Rolled ${total}. You hit your Point! Round Over.`;
                if (passLine > 0) {
                    balanceChange += passLine * 2;
                    outcomeMessages.push(`Won $${passLine} on Pass Line!`);
                }
                if (dontPass > 0) {
                    outcomeMessages.push(`Lost $${dontPass} on Don't Pass.`);
                }
                gameState.activeBets.passLine = 0;
                gameState.activeBets.dontPass = 0;
                gameState.roundOver = true;
                gameState.point = null;
            } else if (total === 7) {
                gameState.message = `Rolled ${total}. Seven Out! Round Over.`;
                if (passLine > 0) {
                    outcomeMessages.push(`Lost $${passLine} on Pass Line.`);
                }
                if (dontPass > 0) {
                    balanceChange += dontPass * 2;
                    outcomeMessages.push(`Won $${dontPass} on Don't Pass!`);
                }
                gameState.activeBets.passLine = 0;
                gameState.activeBets.dontPass = 0;
                gameState.roundOver = true;
                gameState.point = null;
            } else {
                gameState.message = `Rolled ${total}. Point is ${point}. Roll again.`;
            }
        }

        gameState.playerBalance += balanceChange;

        if (outcomeMessages.length > 0) {
            gameState.message += '\n' + outcomeMessages.join('\n');
        }
        gameState.message += `\n(Balance: $${gameState.playerBalance})`;

        renderGameState();
    }

    function placeBets() {
        if (!gameState.roundOver) {
            alert('Cannot place bets during an active round. Please wait for the current round to finish.');
            return;
        }

        const passLine = parseInt(passLineBetInput.value) || 0;
        const dontPass = parseInt(dontPassBetInput.value) || 0;
        const srType = singleRollBetTypeSelect.value;
        const srAmount = parseInt(singleRollBetAmountInput.value) || 0;

        if (passLine < 0 || dontPass < 0 || srAmount < 0) {
            alert('Bet amounts cannot be negative.');
            return;
        }

        const total = passLine + dontPass + srAmount;
        if (total > gameState.playerBalance) {
            alert('Insufficient balance to place bets.');
            return;
        }

        gameState.playerBalance -= total;
        gameState.activeBets.passLine = passLine;
        gameState.activeBets.dontPass = dontPass;
        gameState.activeBets.singleRoll = { type: srType, amount: srAmount };
        gameState.message = 'Bets placed successfully!';

        passLineBetInput.value = 0;
        dontPassBetInput.value = 0;
        singleRollBetTypeSelect.value = 'none';
        singleRollBetAmountInput.value = 0;

        renderGameState();
    }

    function resetGame() {
        gameState = {
            point: null,
            roundOver: true,
            lastRoll: [],
            message: 'Welcome to Craps! Roll the dice to start a new round.',
            playerBalance: 1000,
            activeBets: {
                passLine: 0,
                dontPass: 0,
                singleRoll: { type: 'none', amount: 0 }
            }
        };
        renderGameState();
    }

    function renderGameState() {
        gameStateDisplay.textContent = gameState.message;
        pointDisplay.textContent = '';
        playerBalanceDisplay.textContent = gameState.playerBalance;

        diceContainer.innerHTML = '';
        rollResultsDisplay.textContent = '';

        if (gameState.lastRoll && gameState.lastRoll.length === 2) {
            diceContainer.classList.add('rolling');

            for (let i = 0; i < 2; i++) {
                const dieWrapper = document.createElement('div');
                dieWrapper.classList.add('die-wrapper');
                const die = document.createElement('div');
                die.classList.add('die');
                die.dataset.value = Math.floor(Math.random() * 6) + 1;
                drawDots(die, parseInt(die.dataset.value));
                dieWrapper.appendChild(die);
                diceContainer.appendChild(dieWrapper);
            }

            setTimeout(() => {
                diceContainer.classList.remove('rolling');
                diceContainer.innerHTML = '';
                gameState.lastRoll.forEach(roll => {
                    const dieWrapper = document.createElement('div');
                    dieWrapper.classList.add('die-wrapper');
                    const die = document.createElement('div');
                    die.classList.add('die');
                    die.dataset.value = roll;
                    drawDots(die, roll);
                    dieWrapper.appendChild(die);
                    diceContainer.appendChild(dieWrapper);
                });
                const total = gameState.lastRoll[0] + gameState.lastRoll[1];
                rollResultsDisplay.textContent = `Rolled: ${gameState.lastRoll[0]} + ${gameState.lastRoll[1]} = ${total}`;

                if (gameState.point) {
                    pointDisplay.textContent = `Point: ${gameState.point}`;
                } else {
                    pointDisplay.textContent = '';
                }
            }, 1000);
        }

        if (gameState.roundOver) {
            rollButton.textContent = 'Start New Round';
            resetButton.style.display = 'none';
        } else {
            rollButton.textContent = 'Roll Dice';
            resetButton.style.display = 'inline-block';
        }
    }

    function drawDots(dieElement, value) {
        dieElement.innerHTML = '';
        if (value >= 1 && value <= 6) {
            for (let i = 0; i < value; i++) {
                const dot = document.createElement('div');
                dot.classList.add('dot');
                dieElement.appendChild(dot);
            }
        } else {
            dieElement.textContent = value;
        }
    }

    rollButton.addEventListener('click', handleRoll);
    resetButton.addEventListener('click', resetGame);
    placeBetsButton.addEventListener('click', placeBets);

    renderGameState();
});
