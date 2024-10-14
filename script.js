const amount_of_numbers = 27;
const numbers_per_row = 5;
const columns_per_card = 9;
const rows_per_card = 3;
const num_cards = Math.ceil(amount_of_numbers / (rows_per_card * numbers_per_row));

let generatedNumbers = new Set();
let drawnNumber = null;
let uniqueNumbers = shuffle(Array.from({ length: amount_of_numbers }, (_, i) => i + 1));
const cards = [];

function shuffle(array) {
		for (let i = array.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[array[i], array[j]] = [array[j], array[i]];
		}
		return array;
}

function displayCards(generated_cards) {
		for (let cardIndex = 0; cardIndex < num_cards; cardIndex++) {
				const card = document.createElement('div');
				card.classList.add('card');

				for (let row = 0; row < rows_per_card; row++) {
						const rowDiv = document.createElement('div');
						rowDiv.classList.add('row');
						const cols = generated_cards[cardIndex][row];
						cols.forEach(num => {
								const cell = document.createElement('div');
								cell.classList.add('cell');
								if (num !== null) {
										cell.textContent = num;
										cell.dataset.number = num;
								}
								rowDiv.appendChild(cell);
						});

						card.appendChild(rowDiv);
				}

				document.getElementById('cards-container').appendChild(card);
				cards.push(card);
		}
}

function generateRawCards() {
		let currentIndex = 0;
		let cards = [];

		for (let cardIndex = 0; cardIndex < num_cards; cardIndex++) {
				card = [];
				for (let row = 0; row < rows_per_card; row++) {
						let rowNumbers = [];
						if (currentIndex + numbers_per_row <= uniqueNumbers.length) {
								rowNumbers = uniqueNumbers.slice(currentIndex, currentIndex + numbers_per_row);
								currentIndex += numbers_per_row;
						} else {
								rowNumbers = uniqueNumbers.slice(currentIndex);
								currentIndex = uniqueNumbers.length;
						}

						const cols = Array(columns_per_card).fill(null);
						rowNumbers.forEach(num => {
								let colIndex;
								do {
										colIndex = Math.floor(Math.random() * columns_per_card);
								} while (cols[colIndex] !== null);
								cols[colIndex] = num;
						});

						card.push(cols);
				}
				cards.push(card);
		}
		return cards;
}

function generateRandomNumber() {
		if (generatedNumbers.size === amount_of_numbers) {
				alert("All numbers have been generated!");
				return;
		}

		let randomNumber;
		do {
				randomNumber = Math.floor(Math.random() * amount_of_numbers) + 1;
		} while (generatedNumbers.has(randomNumber));

		removeChip(drawnNumber);
		generatedNumbers.delete(drawnNumber);

		drawnNumber = randomNumber;

		addChip(randomNumber, true);
		generatedNumbers.add(randomNumber);

		const state = btoa(JSON.stringify(Array.from(generatedNumbers)));
		let params = new URLSearchParams(window.location.search);
		params.set('state', state);
		history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);

		document.getElementById("random-number").textContent = "Your number: " + randomNumber;
}

function removeChip(number) {
		cards.forEach(card => {
				const cells = card.querySelectorAll('.cell');
				cells.forEach(cell => {
						if (Number(cell.dataset.number) === number) {
								const chip = cell.querySelector('.chip');
								if (chip) {
										cell.removeChild(chip); // Remove the chip element
								}
						}
				});
		});
}

function addChip(number, add_highlight = false) {
		cards.forEach(card => {
				const cells = card.querySelectorAll('.cell');
				cells.forEach(cell => {
						if (Number(cell.dataset.number) === number) {
								const chip = document.createElement('div');
								chip.classList.add('chip');
								if (add_highlight) {
										chip.classList.add('highlight');
								}
								cell.appendChild(chip);
						}
				});
		});
}

document.getElementById('generate-btn').addEventListener('click', generateRandomNumber);

window.onload = function() {
		let params = new URLSearchParams(window.location.search);
		const encodedCards = params.get('cards');
		const rawCards = (() => {
				if (encodedCards) {
						try {
								return JSON.parse(atob(encodedCards));
						} catch (e) {
								console.error("Error decoding cards from URL: ", e);
						}
				}
				const newlyGenerated = generateRawCards();
				const newlyEncoded = btoa(JSON.stringify(newlyGenerated));
				params.set('cards', newlyEncoded);
				history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
				return newlyGenerated;
		})();
		displayCards(rawCards);

		const encodedNumbers = params.get('state');
		if (encodedNumbers) {
				generatedNumbers = (() => {
						try {
								return new Set(JSON.parse(atob(encodedNumbers)));
						} catch (e) {
								console.error("Error decoding cards from URL: ", e);
						}
						return new Set();
				})();
				for (const number of generatedNumbers) {
						addChip(number);
				}
		}
};

function copyLinkToClipBoard() {
		navigator.clipboard.writeText(window.location.href).then(function() {
				alert('Copied to clipboard!');
		}, function(err) {
				alert('Failed to copy text: ', err);
		});
}

document.getElementById('copy-link').addEventListener('click', copyLinkToClipBoard);

