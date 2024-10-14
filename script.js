const amount_of_numbers = 27;
const numbers_per_row = 5;
const columns_per_card = 9;
const rows_per_card = 3;
const num_cards = Math.ceil(amount_of_numbers / (rows_per_card * numbers_per_row));

let generatedNumbers = new Set();
let currentNumber = null;
let uniqueNumbers = shuffle(Array.from({ length: amount_of_numbers }, (_, i) => i + 1));
const cards = [];

const nLetterInAlphabet = 26;

function encode_one(integer) {
		if (integer < 1 || integer >= 2 * nLetterInAlphabet) {
			throw new Error(`Number out of range: ${integer}`);
		}
		const addToSmallLetters = integer <= nLetterInAlphabet;
		const startingLetter = addToSmallLetters ? 97 : 65;
		return String.fromCharCode(startingLetter + ((integer - 1) % nLetterInAlphabet));
}

function decode_one(char) {
		console.assert(char.length === 1);
		const integer = char.charCodeAt(0);
		const isSmallLetter = integer >= 97 && integer < (97 + nLetterInAlphabet);
		const isLargeLetter = integer >= 65 && integer < (65 + nLetterInAlphabet);
		if (!isSmallLetter && !isLargeLetter) {
			throw new Error(`Character ${char} out of range for decoding`);
		}
		const startingLetter = isSmallLetter ? 97 : 65;
		if (isSmallLetter)
				return integer - startingLetter + 1;
		return integer - startingLetter + 1 + nLetterInAlphabet;
}

function encode_cards(cards) {
	const int_array = cards.flat(Infinity);
	result = new String();
	let nZerosInRow = 0;
	for (const num of int_array) {
		if (!num) {
			nZerosInRow += 1;
			continue;
		}
		if (nZerosInRow) {
			result += Number(nZerosInRow).toString();
			nZerosInRow = 0;
		}
		result += encode_one(num);
	}
	return result;
}

function decode_cards(encodedString) {
	let cards = [];
	let i = 0;
	while (i < encodedString.length) {
		let current_card = []
		let remainder = 0;
		for (let j = 0; j < rows_per_card; j += 1)  {
			let currentRow = [];
			for (let k = 0; k < columns_per_card;) {
				if (i >= encodedString.length) {
					remainder = columns_per_card - k;
					currentRow.push(...Array(remainder).fill(null));
					k += remainder;
					break;
				}
				if (remainder !== 0) {
					currentRow.push(...Array(remainder).fill(null));
					k += remainder;
					remainder = 0;
					continue;
				}
				const integer = encodedString[i].charCodeAt(0);
				const isNonZeroDigit = integer > 48 && integer < 48 + 10;
				if (isNonZeroDigit) {
					let nZerosToPush = integer - 48;
					if (nZerosToPush > (columns_per_card - k)) {
						remainder = nZerosToPush - (columns_per_card - k);
						nZerosToPush = (columns_per_card - k);
					}
					currentRow.push(...Array(nZerosToPush).fill(null));
					k += nZerosToPush, i += 1;
					continue;
				}
				currentRow.push(decode_one(encodedString[i]));
				k += 1, i += 1;
			}
			current_card.push(currentRow);
		}
		cards.push(current_card);
	}
	return cards;
}

function encode_state(generatedNumbers) {
	let result = new String();
	for (const num of generatedNumbers) {
		result += encode_one(num);
	}
	return result;
}

function decode_state(encodedString) {
	let parsedNumbers = [];
	for (let i = 0; i < encodedString.length; i += 1) {
		const newNumber = decode_one(encodedString[i]);
		if (parsedNumbers.includes(newNumber)) {
			console.warn(`Duplicate number occured ${newNumber}`);
		} else {
			parsedNumbers.push(newNumber);
		}
	}
	return parsedNumbers;
}

function shuffle(array) {
		for (let i = array.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[array[i], array[j]] = [array[j], array[i]];
		}
		return array;
}


function handleCellClick(number) {
	if (currentNumber) {
			removeChip(currentNumber);
			generatedNumbers.delete(currentNumber);
	}

	addChip(number, true);
	currentNumber = number;
	generatedNumbers.add(number);

	const state = encode_state(generatedNumbers);
	let params = new URLSearchParams(window.location.search);
	params.set('state', state);
	history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);

	document.getElementById("random-number").textContent = "Your number: " + number;
}

function addClickListenersToCells() {
	cards.forEach(card => {
			const cells = card.querySelectorAll('.cell');
			cells.forEach(cell => {
					if (cell.dataset.number && !cell.classList.contains('chip')) {
							cell.addEventListener('click', function() {
									const number = Number(cell.dataset.number);
									handleCellClick(number);
							});
					}
			});
	});
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
		addClickListenersToCells();
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

		removeChip(currentNumber);
		generatedNumbers.delete(currentNumber);

		currentNumber = randomNumber;

		addChip(randomNumber, true);
		generatedNumbers.add(randomNumber);

		const state = encode_state(generatedNumbers);
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
								return decode_cards(encodedCards);
						} catch (e) {
								console.error("Error decoding cards from URL: ", e);
						}
				}
				const newlyGenerated = generateRawCards();
				const newlyEncoded = encode_cards(newlyGenerated);
				params.set('cards', newlyEncoded);
				history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
				return newlyGenerated;
		})();
		displayCards(rawCards);

		const encodedNumbers = params.get('state');
		if (encodedNumbers) {
				generatedNumbers = (() => {
						try {
								const decoded = decode_state(encodedNumbers);
								if (decoded.length > 0)
									document.getElementById("random-number").textContent = "Previous number: " + decoded[decoded.length - 1];
								return new Set(decoded);
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

