// soundManager.js
// Менеджер для проигрывания фоновой музыки. Обеспечивает автоматический повтор, обработку событий пользователя для старта звука, контроль громкости и состояния.

const soundManager = {
    bgAudio: null, // Объект Audio для фоновой музыки
    isPlaying: false, // Флаг: играет ли музыка сейчас
    // --- добавляем новые звуки событий ---
    soulAudio: null,
    jumpAudio: null,
    punchAudio: null,
    /**
     * Инициализация аудиосистемы: создаёт объект Audio, настраивает повтор и громкость.
     * Не запускает музыку автоматически (требуется действие пользователя).
     */
    init: function() {
        if (this.bgAudio) return;
        this.bgAudio = new Audio('sound/background.mp3');
        this.bgAudio.loop = false; // Мы вручную перезапускаем трек
        this.bgAudio.volume = 0.5;
        this.soulAudio = new Audio('sound/soul.mp3');
        this.soulAudio.volume = 0.7;
        this.jumpAudio = new Audio('sound/jump.mp3');
        this.jumpAudio.volume = 0.7;
        this.punchAudio = new Audio('sound/punch.mp3');
        this.punchAudio.volume = 0.7;
        // После окончания трека — запускаем заново
        this.bgAudio.addEventListener('ended', () => {
            this.play();
        });
    },
    /**
     * Запускает воспроизведение музыки с начала. Если не инициализировано — вызывает init().
     */
    play: function() {
        if (!this.bgAudio) this.init();
        this.bgAudio.currentTime = 0;
        this.bgAudio.play();
        this.isPlaying = true;
    },
    /**
     * Останавливает музыку и сбрасывает позицию в начало.
     */
    stop: function() {
        if (this.bgAudio) {
            this.bgAudio.pause();
            this.bgAudio.currentTime = 0;
            this.isPlaying = false;
        }
    },
    playSoul: function() {
        if (!this.soulAudio) this.init();
        this.soulAudio.currentTime = 0;
        this.soulAudio.play();
    },
    playJump: function() {
        if (!this.jumpAudio) this.init();
        this.jumpAudio.currentTime = 0;
        this.jumpAudio.play();
    },
    playPunch: function() {
        if (!this.punchAudio) this.init();
        this.punchAudio.currentTime = 0;
        this.punchAudio.play();
    },
};

// Автоматически инициализируем soundManager при загрузке страницы, но не запускаем музыку сразу.
// Для обхода ограничений браузера музыка стартует только после первого взаимодействия пользователя (клик, нажатие клавиши).
window.addEventListener('DOMContentLoaded', function() {
    soundManager.init();
    // Не вызываем play() здесь — ждём действия пользователя
    let started = false;
    function startMusic() {
        if (!started) {
            started = true;
            soundManager.play();
            window.removeEventListener('keydown', startMusic);
            window.removeEventListener('mousedown', startMusic);
            const canvas = document.getElementById('gameCanvas');
            if (canvas) canvas.removeEventListener('mousedown', startMusic);
        }
    }
    // Слушаем любые действия пользователя для старта музыки
    window.addEventListener('keydown', startMusic);
    window.addEventListener('mousedown', startMusic);
    const canvas = document.getElementById('gameCanvas');
    if (canvas) canvas.addEventListener('mousedown', startMusic);
});

window.soundManager = soundManager;
