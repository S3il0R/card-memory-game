const { createApp, defineComponent, ref, computed, watch, onMounted, onUnmounted } = Vue;

// Константы
const DIFFICULTY = {
    easy:   { pairs: 6,  timeLimit: 60  },
    normal: { pairs: 10,  timeLimit: 120 },
    hard:   { pairs: 14, timeLimit: 180 }
};

const SYMBOLS = {
    letters: ['A','B','C','D','E','F','G','H','I','J','K','L'],
    numbers: ['1','2','3','4','5','6','7','8','9','10','11','12'],
    shapes: [
        `<svg viewBox="0 0 40 40" width="36" height="36" fill="currentColor"><circle cx="20" cy="20" r="16"/></svg>`,
        `<svg viewBox="0 0 40 40" width="36" height="36" fill="currentColor"><rect x="6" y="6" width="28" height="28" rx="3"/></svg>`,
        `<svg viewBox="0 0 40 40" width="36" height="36" fill="currentColor"><polygon points="20,4 36,36 4,36"/></svg>`,
        `<svg viewBox="0 0 40 40" width="36" height="36" fill="currentColor"><polygon points="20,3 24.9,14.6 37.6,14.6 27.4,22.1 31.3,33.7 20,26.5 8.7,33.7 12.6,22.1 2.4,14.6 15.1,14.6"/></svg>`,
        `<svg viewBox="0 0 40 40" width="36" height="36" fill="currentColor"><path d="M20 35 C20 35 4 24 4 13 A8 8 0 0 1 20 10 A8 8 0 0 1 36 13 C36 24 20 35 20 35Z"/></svg>`,
        `<svg viewBox="0 0 40 40" width="36" height="36" fill="currentColor"><polygon points="20,3 37,20 20,37 3,20"/></svg>`,
        `<svg viewBox="0 0 40 40" width="36" height="36" fill="currentColor"><polygon points="20,3 37,14 31,34 9,34 3,14"/></svg>`,
        `<svg viewBox="0 0 40 40" width="36" height="36" fill="currentColor"><rect x="15" y="3" width="10" height="34"/><rect x="3" y="15" width="34" height="10"/></svg>`,
        `<svg viewBox="0 0 40 40" width="36" height="36" fill="currentColor"><path d="M20 4 A16 16 0 1 0 20 36 A10 10 0 1 1 20 4Z"/></svg>`,
        `<svg viewBox="0 0 40 40" width="36" height="36" fill="currentColor"><ellipse cx="16" cy="22" rx="10" ry="8"/><ellipse cx="26" cy="24" rx="8" ry="6"/><ellipse cx="20" cy="17" rx="7" ry="7"/></svg>`,
        `<svg viewBox="0 0 40 40" width="36" height="36" fill="currentColor"><polygon points="22,3 10,22 20,22 18,37 30,18 20,18"/></svg>`,
        `<svg viewBox="0 0 40 40" width="36" height="36" fill="currentColor"><circle cx="20" cy="20" r="5"/><ellipse cx="20" cy="9" rx="4" ry="6"/><ellipse cx="20" cy="31" rx="4" ry="6"/><ellipse cx="9" cy="20" rx="6" ry="4"/><ellipse cx="31" cy="20" rx="6" ry="4"/></svg>`
    ]
};

function fisherYates(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function formatTime(sec) {
    const t = Math.abs(sec);
    return `${String(Math.floor(t / 60)).padStart(2,'0')}:${String(t % 60).padStart(2,'0')}`;
}

// Компонент 1: AppMenu
// Emits: start-game({ difficulty, mode, symbolType })
const AppMenu = defineComponent({
    name: 'AppMenu',
    emits: ['start-game'],
    setup(_, { emit }) {
        const difficulty  = ref('normal');
        const mode        = ref('free');
        const symbolType  = ref('letters');

        function startGame() {
            emit('start-game', {
                difficulty: difficulty.value,
                mode: mode.value,
                symbolType: symbolType.value
            });
        }

        return { difficulty, mode, symbolType, startGame };
    },
    template: `
        <div>
            <h1>Найди пару</h1>
            <div class="card-panel">

                <div class="settings-group">
                    <span class="settings-label">Сложность</span>
                    <div class="options-row">
                        <label v-for="opt in [{v:'easy',l:'Легко'},{v:'normal',l:'Нормально'},{v:'hard',l:'Сложно'}]"
                               :key="opt.v"
                               class="radio-btn"
                               :class="{ selected: difficulty === opt.v }"
                               @click="difficulty = opt.v">
                            {{ opt.l }}
                        </label>
                    </div>
                </div>

                <div class="settings-group">
                    <span class="settings-label">Режим</span>
                    <div class="options-row">
                        <label class="radio-btn" :class="{ selected: mode === 'free' }"   @click="mode = 'free'">Свободный</label>
                        <label class="radio-btn" :class="{ selected: mode === 'timed' }"  @click="mode = 'timed'">На время</label>
                    </div>
                </div>

                <div class="settings-group">
                    <span class="settings-label">Символы</span>
                    <div class="options-row">
                        <label class="radio-btn" :class="{ selected: symbolType === 'letters' }" @click="symbolType = 'letters'">🔤 Буквы</label>
                        <label class="radio-btn" :class="{ selected: symbolType === 'numbers' }" @click="symbolType = 'numbers'">🔢 Цифры</label>
                        <label class="radio-btn" :class="{ selected: symbolType === 'shapes'  }" @click="symbolType = 'shapes'">⏺️ Фигуры</label>
                    </div>
                </div>

                <button class="btn-primary btn-full" @click="startGame">Начать игру</button>
            </div>
        </div>
    `
});

// Компонент 2: GameBoard
// Props: settings
// Emits: game-end({ won, moves, seconds })
const GameBoard = defineComponent({
    name: 'GameBoard',
    props: { settings: Object },
    emits: ['game-end', 'go-menu'],
    setup(props, { emit }) {
        const cards     = ref([]);   // { id, value, isOpen, isMatched }
        const moves     = ref(0);
        const seconds   = ref(0);
        const lockBoard = ref(false);
        let   timerRef  = null;
        let   chosen    = [];

        // Вычисляемое: все карточки совпали?
        const allMatched = computed(() => cards.value.length > 0 && cards.value.every(c => c.isMatched));

        // Время в формате MM:SS
        const timeDisplay = computed(() => formatTime(seconds.value));

        // Наблюдатель победы
        watch(allMatched, (val) => {
            if (val) {
                stopTimer();
                emit('game-end', { won: true, moves: moves.value, seconds: seconds.value });
            }
        });

        function startTimer() {
            clearInterval(timerRef);
            const cfg = DIFFICULTY[props.settings.difficulty];
            if (props.settings.mode === 'free') {
                seconds.value = 0;
                timerRef = setInterval(() => seconds.value++, 1000);
            } else {
                seconds.value = cfg.timeLimit;
                timerRef = setInterval(() => {
                    seconds.value--;
                    if (seconds.value <= 0) {
                        stopTimer();
                        emit('game-end', { won: false, moves: moves.value, seconds: 0 });
                    }
                }, 1000);
            }
        }

        function stopTimer() { clearInterval(timerRef); }

        function initCards() {
            const cfg    = DIFFICULTY[props.settings.difficulty];
            const source = SYMBOLS[props.settings.symbolType].slice(0, cfg.pairs);
            const vals   = fisherYates([...source, ...source]);
            cards.value  = vals.map((value, id) => ({ id, value, isOpen: false, isMatched: false }));
            moves.value  = 0;
            chosen       = [];
            lockBoard.value = false;
        }

        function flipCard(card) {
            if (lockBoard.value || card.isOpen || card.isMatched) return;
            card.isOpen = true;
            chosen.push(card);

            if (chosen.length === 2) {
                moves.value++;
                lockBoard.value = true;
                setTimeout(checkMatch, 600);
            }
        }

        function checkMatch() {
            const [a, b] = chosen;
            if (a.value === b.value) {
                a.isMatched = true;
                b.isMatched = true;
            } else {
                a.isOpen = false;
                b.isOpen = false;
            }
            chosen = [];
            lockBoard.value = false;
        }

        function goMenu() { stopTimer(); emit('go-menu'); }

        onMounted(() => { initCards(); startTimer(); });
        onUnmounted(() => stopTimer());

        return { cards, moves, seconds, timeDisplay, flipCard, goMenu, allMatched };
    },
    template: `
        <div>
            <div class="hud">
                <span class="hud-stat">Ходов: {{ moves }}</span>
                <button class="btn-secondary" @click="goMenu">Меню</button>
                <span class="hud-stat">{{ timeDisplay }}</span>
            </div>
            <div class="board">
                <div
                    v-for="card in cards"
                    :key="card.id"
                    class="card"
                    :class="{ open: card.isOpen, matched: card.isMatched }"
                    @click="flipCard(card)"
                >
                    <template v-if="card.isOpen || card.isMatched">
                        <span v-if="$props.settings.symbolType !== 'shapes'">{{ card.value }}</span>
                        <span v-else v-html="card.value"></span>
                    </template>
                </div>
            </div>
        </div>
    `
});

// Компонент 3: ResultScreen
// Props: result { won, moves, seconds }, settings
// Emits: play-again, go-menu
const ResultScreen = defineComponent({
    name: 'ResultScreen',
    props: { result: Object, settings: Object },
    emits: ['play-again', 'go-menu'],
    setup(props) {
        const stars = computed(() => {
            if (!props.result.won) return '💔';
            const pairs = DIFFICULTY[props.settings.difficulty].pairs;
            if (props.result.moves <= pairs + 2)      return '⭐⭐⭐';
            if (props.result.moves <= pairs * 2)       return '⭐⭐';
            return '⭐';
        });

        const timeText = computed(() => {
            if (props.settings.mode === 'free') {
                return `⏱ Затрачено: ${formatTime(props.result.seconds)}`;
            }
            return props.result.won
                ? `⏱ Осталось: ${formatTime(props.result.seconds)}`
                : '⏱ Время вышло!';
        });

        return { stars, timeText };
    },
    template: `
        <div>
            <div class="card-panel result-panel">
                <h2>{{ result.won ? 'Победа! 🎉' : 'Время вышло 😔' }}</h2>
                <p class="result-stars">{{ stars }}</p>
                <p>{{ timeText }}</p>
                <p>🎯 Ходов: {{ result.moves }}</p>
                <div class="btn-row">
                    <button class="btn-primary"   @click="$emit('play-again')">Играть снова</button>
                    <button class="btn-secondary" @click="$emit('go-menu')">В меню</button>
                </div>
            </div>
        </div>
    `
});

// Корневое приложение
const App = defineComponent({
    name: 'App',
    components: { AppMenu, GameBoard, ResultScreen },
    setup() {
        const currentScreen = ref('menu');   // 'menu' | 'game' | 'result'
        const gameSettings  = ref(null);
        const gameResult    = ref(null);

        // Переключение темы
        const theme = ref(localStorage.getItem('theme') || 'light');
        document.documentElement.dataset.theme = theme.value;
        const themeIcon = computed(() => theme.value === 'dark' ? '☀️' : '🌙');

        function toggleTheme() {
            theme.value = theme.value === 'dark' ? 'light' : 'dark';
            document.documentElement.dataset.theme = theme.value;
            localStorage.setItem('theme', theme.value);
        }

        // Навигация
        function onStartGame(settings) {
            gameSettings.value = settings;
            currentScreen.value = 'game';
        }

        function onGameEnd(result) {
            gameResult.value = result;
            currentScreen.value = 'result';
        }

        function onPlayAgain() {
            currentScreen.value = 'game';
        }

        function onGoMenu() {
            currentScreen.value = 'menu';
        }

        return {
            currentScreen, gameSettings, gameResult,
            themeIcon, toggleTheme,
            onStartGame, onGameEnd, onPlayAgain, onGoMenu
        };
    },
    template: `
        <div>
            <!-- Кнопка темы (фиксированная) -->
            <button class="btn-theme" @click="toggleTheme" aria-label="Переключить тему">
                {{ themeIcon }}
            </button>

            <!-- Экраны -->
            <AppMenu
                v-if="currentScreen === 'menu'"
                @start-game="onStartGame"
            />

            <GameBoard
                v-else-if="currentScreen === 'game'"
                :key="gameSettings ? JSON.stringify(gameSettings) + Date.now() : 'game'"
                :settings="gameSettings"
                @game-end="onGameEnd"
                @go-menu="onGoMenu"
            />

            <ResultScreen
                v-else-if="currentScreen === 'result'"
                :result="gameResult"
                :settings="gameSettings"
                @play-again="onPlayAgain"
                @go-menu="onGoMenu"
            />
        </div>
    `
});

createApp(App).mount('#app');
