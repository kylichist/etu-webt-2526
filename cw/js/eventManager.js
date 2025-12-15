// eventManager.js
// Менеджер событий: отвечает за обработку нажатий клавиш для управления viewport и игроком. Позволяет легко расширять биндинг под новые действия.

const eventsManager = {
    bind: [], // Массив: keyCode -> действие ('up', 'down', 'left', 'right', 'jump')
    action: {}, // Объект: действие -> true/false (нажата ли клавиша)
    /**
     * Настраивает биндинг клавиш и подписывается на события keydown/keyup.
     */
    setup: function() {
        this.bind[87] = 'up';    // W
        this.bind[83] = 'down';  // S
        this.bind[65] = 'left';  // A
        this.bind[68] = 'right'; // D
        this.bind[32] = 'jump';  // Пробел
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
    },
    /**
     * Обработка нажатия клавиши: выставляет action[action]=true.
     * @param {KeyboardEvent} e
     */
    onKeyDown: function(e) {
        const action = this.bind[e.keyCode];
        if (action) this.action[action] = true;
    },
    /**
     * Обработка отпускания клавиши: выставляет action[action]=false.
     * @param {KeyboardEvent} e
     */
    onKeyUp: function(e) {
        const action = this.bind[e.keyCode];
        if (action) this.action[action] = false;
    }
};

// Инициализация событий при загрузке страницы
window.addEventListener('DOMContentLoaded', function() {
    eventsManager.setup();
});

window.eventsManager = eventsManager;
