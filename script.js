function $(id) { return document.getElementById(id); }

// Константы
const DIFFICULTY = {
    easy:   { pairs: 4,  cols: 4, timeLimit: 60  },
    normal: { pairs: 8,  cols: 4, timeLimit: 120 },
    hard:   { pairs: 12, cols: 6, timeLimit: 180 }
};
const ALL_VALUES = ['A','B','C','D','E','F','G','H','I','J','K','L'];

// Состояние игры
let settings     = {};
let cards        = [];
let chosenCards  = [];
let matchedCount = 0;
let moves        = 0;
let seconds      = 0;
let timerRef     = null;
let locked       = false;


// Навигация между экранами
function showScreen(name) {
    ['menu', 'game', 'result'].forEach(key => {
        $('screen-' + key).classList.toggle('active', key === name);
    });
}

// Запуск игры
function startGame() {
    const diff = document.querySelector('input[name="difficulty"]:checked').value;
    const mode = document.querySelector('input[name="mode"]:checked').value;
    settings = { difficulty: diff, mode };

    const cfg = DIFFICULTY[diff];
    const values = ALL_VALUES.slice(0, cfg.pairs);
    cards = fisherYates([...values, ...values]);

    moves = 0; seconds = 0; matchedCount = 0;
    chosenCards = []; locked = false;

    const board = $('game-board');
    board.style.gridTemplateColumns = 'repeat(' + cfg.cols + ', 80px)';
    board.innerHTML = '';

    cards.forEach((val, idx) => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.idx = idx;
        card.addEventListener('click', onCardClick);
        board.appendChild(card);
    });

    updateHud();
    startTimer();
    showScreen('game');
}

// Таймер
function startTimer() {
    clearInterval(timerRef);
    const cfg = DIFFICULTY[settings.difficulty];

    if (settings.mode === 'free') {
        seconds = 0;
        timerRef = setInterval(() => { seconds++; updateHud(); }, 1000);
    } else {
        seconds = cfg.timeLimit;
        timerRef = setInterval(() => {
            seconds--;
            updateHud();
            if (seconds <= 0) endGame(false);
        }, 1000);
    }
}

function stopTimer() { clearInterval(timerRef); }

// HUD
function updateHud() {
    $('hud-moves').textContent = 'Ходов: ' + moves;
    const t = Math.abs(seconds);
    const mm = String(Math.floor(t / 60)).padStart(2, '0');
    const ss = String(t % 60).padStart(2, '0');
    $('hud-timer').textContent = mm + ':' + ss;
}

// Логика карточек
function onCardClick() {
    if (locked) return;
    if (this.classList.contains('matched') || this.classList.contains('open')) return;

    this.textContent = cards[this.dataset.idx];
    this.classList.add('open');
    chosenCards.push(this);

    if (chosenCards.length === 2) {
        moves++;
        updateHud();
        locked = true;
        setTimeout(checkMatch, 600);
    }
}

function checkMatch() {
    const [a, b] = chosenCards;
    if (cards[a.dataset.idx] === cards[b.dataset.idx]) {
        a.classList.add('matched');
        b.classList.add('matched');
        matchedCount += 2;
        if (matchedCount === cards.length) endGame(true);
    } else {
        a.textContent = '';
        b.textContent = '';
        a.classList.remove('open');
        b.classList.remove('open');
    }
    chosenCards = [];
    locked = false;
}

// Конец игры
function endGame(won) {
    stopTimer();

    const pairs = DIFFICULTY[settings.difficulty].pairs;

    $('result-title').textContent = won ? 'Победа! 🎉' : 'Время вышло 😔';

    if (settings.mode === 'free') {
        const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
        const ss = String(seconds % 60).padStart(2, '0');
        $('result-time').textContent = 'Затрачено времени: ' + mm + ':' + ss;
    } else {
        const remain = Math.max(0, seconds);
        const mm = String(Math.floor(remain / 60)).padStart(2, '0');
        const ss = String(remain % 60).padStart(2, '0');
        $('result-time').textContent = won ? 'Осталось времени: ' + mm + ':' + ss : 'Время вышло!';
    }

    $('result-moves').textContent = 'Ходов сделано: ' + moves;

    let stars;
    if (won) {
        if (moves <= pairs + 2)      stars = '⭐⭐⭐ Отлично!';
        else if (moves <= pairs * 2) stars = '⭐⭐ Хорошо';
        else                          stars = '⭐ Можно лучше';
    } else {
        stars = 'Попробуй ещё раз!';
    }
    $('result-stars').textContent = stars;

    showScreen('result');
}

// Вспомогательные
function fisherYates(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Привязка кнопок
$('btn-start').addEventListener('click', startGame);
$('btn-menu').addEventListener('click', () => { stopTimer(); showScreen('menu'); });
$('btn-play-again').addEventListener('click', startGame);
$('btn-to-menu').addEventListener('click', () => showScreen('menu'));
