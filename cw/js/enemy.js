// enemy.js
// Enemy — класс врага для платформера. Враг летит к игроку по кратчайшему пути и взаимодействует с ним при столкновении.

/**
 * Конструктор врага.
 * @param {number} x - начальная координата X
 * @param {number} y - начальная координата Y
 * @param {number} size - диаметр врага (по умолчанию 28)
 */
function Enemy(x, y, size) {
    this.pos_x = x;
    this.pos_y = y;
    this.size = size || 28;
    this.alive = true;
    this.speed = 1.2; // Скорость движения врага (медленно)
    this.direction = 1; // Не используется, но оставлено для возможного расширения логики
    this.type = 'Enemy';
}

/**
 * Обновляет позицию врага. Враг летит к игроку по прямой, если игра начата.
 */
Enemy.prototype.update = function() {
    if (!this.alive) return;
    // Получаем позицию игрока
    const player = gameManager.player;
    if (!player) return;
    // Вычисляем вектор до игрока
    const dx = (player.pos_x + player.size_x / 2) - (this.pos_x + this.size / 2);
    const dy = (player.pos_y + player.size_y / 2) - (this.pos_y + this.size / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);
    // Двигаемся к игроку с постоянной скоростью
    if (dist > 1) {
        const speed = this.speed;
        this.pos_x += (dx / dist) * speed;
        this.pos_y += (dy / dist) * speed;
    }
    // Ограничиваем врага границами карты
    if (this.pos_x < 0) {
        this.pos_x = 0;
    }
    if (this.pos_x + this.size > gameManager.mapWidth * gameManager.tileSize) {
        this.pos_x = gameManager.mapWidth * gameManager.tileSize - this.size;
    }
};

/**
 * Отрисовывает врага на канвасе как красный круг с тенью.
 * @param {CanvasRenderingContext2D} ctx
 */
Enemy.prototype.draw = function(ctx) {
    if (!this.alive) return;
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.pos_x + this.size/2 - gameManager.viewport.x, this.pos_y + this.size/2 - gameManager.viewport.y, this.size/2, 0, 2 * Math.PI);
    ctx.fillStyle = 'red';
    ctx.shadowColor = '#a00';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();
};

/**
 * Проверяет столкновение с игроком и обрабатывает результат:
 * - Если игрок сверху (по прощающему хитбоксу), враг погибает, игроку +1 душа
 * - Иначе враг погибает, игроку -2 души
 * @param {Player} player
 * @returns {string|boolean} 'killed' если убит сверху, 'hit' если столкновение сбоку/снизу, false если нет столкновения
 */
Enemy.prototype.checkCollision = function(player) {
    if (!this.alive) return false;
    // AABB-коллизия (простая проверка пересечения прямоугольников)
    if (
        player.pos_x < this.pos_x + this.size &&
        player.pos_x + player.size_x > this.pos_x &&
        player.pos_y < this.pos_y + this.size &&
        player.pos_y + player.size_y > this.pos_y
    ) {
        // Прощающий хитбокс: игрок может убить врага, если его нижняя точка выше верхней точки врага + 20px
        const playerBottom = player.pos_y + player.size_y;
        const enemyTop = this.pos_y;
        if (playerBottom <= enemyTop + 20) {
            // Игрок сверху — враг погибает, игроку +1 душа
            this.alive = false;
            gameManager.soulsCollected++;
            return 'killed';
        } else {
            // Враг погибает, игроку -2 души (может быть отрицательно)
            this.alive = false;
            gameManager.soulsCollected -= 2;
            return 'hit';
        }
    }
    return false;
};

window.Enemy = Enemy;
