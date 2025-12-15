// soul.js
// Класс души (монетки), которую игрок может собрать. Обеспечивает анимацию исчезновения и обработку коллизий с игроком.

/**
 * Конструктор души.
 * @param {number} x - координата X
 * @param {number} y - координата Y
 * @param {number} size - размер (ширина и высота)
 */
function Soul(x, y, size) {
    this.pos_x = x;
    this.pos_y = y;
    this.size = size;
    this.collected = false; // Флаг: собрана ли душа
    this.fadeAlpha = 1.0;   // Прозрачность для анимации исчезновения
    this.fadeStep = 0.07;   // Скорость исчезновения (чем больше — тем быстрее)
}

/**
 * Рисует душу на канвасе. Если душа собрана — плавно исчезает.
 * @param {CanvasRenderingContext2D} ctx
 */
Soul.prototype.draw = function (ctx) {
    if (this.collected && this.fadeAlpha <= 0) return; // Не рисуем, если полностью исчезла
    ctx.save();
    if (this.collected) {
        this.fadeAlpha -= this.fadeStep;
        if (this.fadeAlpha < 0) this.fadeAlpha = 0;
    }
    ctx.globalAlpha = this.fadeAlpha;
    // Рисуем спрайт души (id 27 в атласе)
    spriteManager.drawSprite(ctx, 'sprite27', this.pos_x, this.pos_y);
    ctx.globalAlpha = 1.0;
    ctx.restore();
};

/**
 * Проверяет коллизию с игроком (AABB) и помечает душу как собранную.
 * @param {Player} player
 * @returns {boolean} true, если собрана в этом кадре
 */
Soul.prototype.checkCollected = function (player) {
    if (this.collected) return false;
    // Простая AABB-коллизия (пересечение прямоугольников)
    if (
        player.pos_x < this.pos_x + this.size &&
        player.pos_x + player.size_x > this.pos_x &&
        player.pos_y < this.pos_y + this.size &&
        player.pos_y + player.size_y > this.pos_y
    ) {
        this.collected = true;
        return true;
    }
    return false;
};

window.Soul = Soul; // Экспортируем в глобальную область видимости
