// Константы
const DIFFICULTY = {
    easy:   { pairs: 4,  cols: 4, timeLimit: 60  },
    normal: { pairs: 8,  cols: 4, timeLimit: 120 },
    hard:   { pairs: 12, cols: 6, timeLimit: 180 }
};

const SYMBOLS = {
    letters: ['A','B','C','D','E','F','G','H','I','J','K','L'],
    numbers: ['1','2','3','4','5','6','7','8','9','10','11','12'],
    shapes: [
        // Круг
        `<svg viewBox="0 0 40 40" width="36" height="36" fill="currentColor"><circle cx="20" cy="20" r="16"/></svg>`,
        // Квадрат
        `<svg viewBox="0 0 40 40" width="36" height="36" fill="currentColor"><rect x="6" y="6" width="28" height="28" rx="3"/></svg>`,
        // Треугольник
        `<svg viewBox="0 0 40 40" width="36" height="36" fill="currentColor"><polygon points="20,4 36,36 4,36"/></svg>`,
        // Звезда
        `<svg viewBox="0 0 40 40" width="36" height="36" fill="currentColor"><polygon points="20,3 24.9,14.6 37.6,14.6 27.4,22.1 31.3,33.7 20,26.5 8.7,33.7 12.6,22.1 2.4,14.6 15.1,14.6"/></svg>`,
        // Сердце
        `<svg viewBox="0 0 40 40" width="36" height="36" fill="currentColor"><path d="M20 35 C20 35 4 24 4 13 A8 8 0 0 1 20 10 A8 8 0 0 1 36 13 C36 24 20 35 20 35Z"/></svg>`,
        // Ромб
        `<svg viewBox="0 0 40 40" width="36" height="36" fill="currentColor"><polygon points="20,3 37,20 20,37 3,20"/></svg>`,
        // Пятиугольник
        `<svg viewBox="0 0 40 40" width="36" height="36" fill="currentColor"><polygon points="20,3 37,14 31,34 9,34 3,14"/></svg>`,
        // Крест
        `<svg viewBox="0 0 40 40" width="36" height="36" fill="currentColor"><rect x="15" y="3" width="10" height="34"/><rect x="3" y="15" width="34" height="10"/></svg>`,
        // Луна
        `<svg viewBox="0 0 40 40" width="36" height="36" fill="currentColor"><path d="M20 4 A16 16 0 1 0 20 36 A10 10 0 1 1 20 4Z"/></svg>`,
        // Облако
        `<svg viewBox="0 0 40 40" width="36" height="36" fill="currentColor"><ellipse cx="16" cy="22" rx="10" ry="8"/><ellipse cx="26" cy="24" rx="8" ry="6"/><ellipse cx="20" cy="17" rx="7" ry="7"/></svg>`,
        // Молния
        `<svg viewBox="0 0 40 40" width="36" height="36" fill="currentColor"><polygon points="22,3 10,22 20,22 18,37 30,18 20,18"/></svg>`,
        // Цветок
        `<svg viewBox="0 0 40 40" width="36" height="36" fill="currentColor"><circle cx="20" cy="20" r="5"/><ellipse cx="20" cy="9" rx="4" ry="6"/><ellipse cx="20" cy="31" rx="4" ry="6"/><ellipse cx="9" cy="20" rx="6" ry="4"/><ellipse cx="31" cy="20" rx="6" ry="4"/><ellipse cx="12" cy="12" rx="4" ry="6" transform="rotate(-45 12 12)"/><ellipse cx="28" cy="28" rx="4" ry="6" transform="rotate(-45 28 28)"/><ellipse cx="28" cy="12" rx="4" ry="6" transform="rotate(45 28 12)"/><ellipse cx="12" cy="28" rx="4" ry="6" transform="rotate(45 12 28)"/></svg>`
    ]
};

// Состояние игры
let settings     = {};
let cards        = [];
let chosenCards  = [];
let matchedCount = 0;
let moves        = 0;
let seconds      = 0;
let timerRef     = null;
let locked       = false;

// DOM
function $(id) { return document.getElementById(id); }

const screens = { menu: $('screen-menu'), game: $('screen-game'), result: $('screen-result') };
const board   = $('game-board');

// Тема
const btnTheme = $('btn-theme');

// Загрузка сохранённой темы
(function loadTheme() {
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.dataset.theme = saved;
    btnTheme.textContent = saved === 'dark' ? '☀️' : '🌙';
})();

btnTheme.addEventListener('click', () => {
    const current = document.documentElement.dataset.theme;
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    btnTheme.textContent = next === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', next);
});

// Навигация
function showScreen(name) {
    Object.entries(screens).forEach(([key, el]) => {
        el.classList.toggle('active', key === name);
    });
}

// Запуск игры
function startGame() {
    const diff       = document.querySelector('input[name="difficulty"]:checked').value;
    const mode       = document.querySelector('input[name="mode"]:checked').value;
    const symbolType = document.querySelector('input[name="symbol"]:checked').value;
    settings = { difficulty: diff, mode, symbolType };

    const cfg      = DIFFICULTY[diff];
    const source   = SYMBOLS[symbolType].slice(0, cfg.pairs);
    cards = fisherYates([...source, ...source]);

    moves = 0; seconds = 0; matchedCount = 0;
    chosenCards = []; locked = false;

    board.style.gridTemplateColumns = `repeat(${cfg.cols}, 88px)`;
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
    $('hud-moves').textContent = `Ходов: ${moves}`;
    const t = Math.abs(seconds);
    const mm = String(Math.floor(t / 60)).padStart(2, '0');
    const ss = String(t % 60).padStart(2, '0');
    $('hud-timer').textContent = `${mm}:${ss}`;
}

// Карточки
function renderCardFace(card, val) {
    if (settings.symbolType === 'shapes') {
        card.innerHTML = val;  // SVG-строка
    } else {
        card.textContent = val;
    }
}

function onCardClick() {
    if (locked) return;
    if (this.classList.contains('matched') || this.classList.contains('open')) return;

    renderCardFace(this, cards[this.dataset.idx]);
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
    const va = cards[a.dataset.idx];
    const vb = cards[b.dataset.idx];

    if (va === vb) {
        a.classList.add('matched');
        b.classList.add('matched');
        matchedCount += 2;
        if (matchedCount === cards.length) endGame(true);
    } else {
        a.innerHTML = '';
        b.innerHTML = '';
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

    // Время
    if (settings.mode === 'free') {
        const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
        const ss = String(seconds % 60).padStart(2, '0');
        $('result-time').textContent = `⏱ Затрачено: ${mm}:${ss}`;
    } else {
        const remain = Math.max(0, seconds);
        const mm = String(Math.floor(remain / 60)).padStart(2, '0');
        const ss = String(remain % 60).padStart(2, '0');
        $('result-time').textContent = won ? `⏱ Осталось: ${mm}:${ss}` : '⏱ Время вышло!';
    }

    $('result-moves').textContent = `🎯 Ходов: ${moves}`;

    // Звёзды
    if (won) {
        if (moves <= pairs + 2)      $('result-stars').textContent = '⭐⭐⭐';
        else if (moves <= pairs * 2) $('result-stars').textContent = '⭐⭐';
        else                          $('result-stars').textContent = '⭐';
    } else {
        $('result-stars').textContent = '💔';
    }

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
