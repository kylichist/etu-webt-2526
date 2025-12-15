// soundManager.js
// Менеджер для проигрывания фоновой музыки. Обеспечивает автоматический повтор, обработку событий пользователя для старта звука, контроль громкости и состояния.

const soundManager = {
    bgAudio: null, // Объект Audio для фоновой музыки
    isPlaying: false, // Флаг: играет ли музыка сейчас
    /**
     * Инициализация аудиосистемы: создаёт объект Audio, настраивает повтор и громкость.
     * Не запускает музыку автоматически (требуется действие пользователя).
     */
    init: function() {
        if (this.bgAudio) return;
        this.bgAudio = new Audio('sound/background.mp3');
        this.bgAudio.loop = false; // Мы вручную перезапускаем трек
        this.bgAudio.volume = 0.5;
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
    }
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
