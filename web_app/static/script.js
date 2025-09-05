document.addEventListener('DOMContentLoaded', () => {
    const numDiceInput = document.getElementById('numDice');
    const numSidesInput = document.getElementById('numSides');
    const rollButton = document.getElementById('rollButton');
    const diceContainer = document.getElementById('dice-container');
    const totalResults = document.getElementById('total-results');

    rollButton.addEventListener('click', async () => {
        const numDice = parseInt(numDiceInput.value);
        const numSides = parseInt(numSidesInput.value);

        if (isNaN(numDice) || isNaN(numSides) || numDice <= 0 || numSides <= 0) {
            alert('Please enter valid positive numbers for the number of dice and sides.');
            return;
        }

        // Clear previous dice and add rolling class
        diceContainer.innerHTML = '';
        diceContainer.classList.add('rolling');
        totalResults.textContent = '';

        // Simulate dice rolling animation for a short period
        for (let i = 0; i < numDice; i++) {
            const dieWrapper = document.createElement('div');
            dieWrapper.classList.add('die-wrapper');
            const die = document.createElement('div');
            die.classList.add('die');
            die.dataset.value = Math.floor(Math.random() * 6) + 1; // Random value for animation
            drawDots(die, parseInt(die.dataset.value));
            dieWrapper.appendChild(die);
            diceContainer.appendChild(dieWrapper);
        }

        // Fetch results after a short delay to allow animation to start
        setTimeout(async () => {
            try {
                const response = await fetch('/roll', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ num_dice: numDice, num_sides: numSides }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Something went wrong');
                }

                const data = await response.json();
                displayResults(data.results, data.total);
            } catch (error) {
                console.error('Error:', error);
                alert(error.message);
            } finally {
                diceContainer.classList.remove('rolling');
            }
        }, 1000); // Animation duration
    });

    function displayResults(results, total) {
        diceContainer.innerHTML = ''; // Clear rolling dice
        results.forEach(roll => {
            const dieWrapper = document.createElement('div');
            dieWrapper.classList.add('die-wrapper');
            const die = document.createElement('div');
            die.classList.add('die');
            die.dataset.value = roll;
            drawDots(die, roll);
            dieWrapper.appendChild(die);
            diceContainer.appendChild(dieWrapper);
        });
        totalResults.textContent = `Total: ${total}`;
    }

    function drawDots(dieElement, value) {
        dieElement.innerHTML = ''; // Clear existing dots
        for (let i = 0; i < value; i++) {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            dieElement.appendChild(dot);
        }
    }
});
