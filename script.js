const values = ['A', 'A', 'B', 'B', 'C', 'C', 'D', 'D', 'E', 'E', 'F', 'F', 'G', 'G', 'H', 'H'];
let chosenCards = [];
let chosenIds = [];
let matchedCount = 0;

// 1. Перемешивание (простой способ)
values.sort(() => 0.5 - Math.random());

const board = document.getElementById('game-board');

// 2. Создание карточек
function createBoard() {
    for (let i = 0; i < values.length; i++) {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.id = i;
        card.addEventListener('click', flipCard);
        board.appendChild(card);
    }
}

// 3. Логика клика
function flipCard() {
    let cardId = this.dataset.id;
    
    // Не даем нажимать на ту же карту или если уже открыто две
    if (chosenIds.length < 2 && !chosenIds.includes(cardId)) {
        this.innerHTML = values[cardId];
        this.classList.add('open');
        chosenCards.push(values[cardId]);
        chosenIds.push(cardId);

        if (chosenCards.length === 2) {
            setTimeout(checkMatch, 500); // Небольшая пауза, чтобы увидеть вторую карту
        }
    }
}

// 4. Проверка совпадения
function checkMatch() {
    const cards = document.querySelectorAll('.card');
    const [id1, id2] = chosenIds;

    if (chosenCards[0] === chosenCards[1]) {
        cards[id1].classList.add('hidden');
        cards[id2].classList.add('hidden');
        matchedCount += 2;
        if (matchedCount === values.length) alert('Победа!');
    } else {
        cards[id1].innerHTML = '';
        cards[id2].innerHTML = '';
        cards[id1].classList.remove('open');
        cards[id2].classList.remove('open');
    }
    
    chosenCards = [];
    chosenIds = [];
}

createBoard();