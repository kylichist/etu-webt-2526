// player.js
// Класс игрока для платформера. Отвечает за управление, анимацию, прыжки, гравитацию, взаимодействие с физикой и ограничениями карты.

/**
 * Конструктор игрока.
 * @param {number} x - начальная координата X (по центру, если не задана)
 * @param {number} y - начальная координата Y (у платформы, если не задана)
 */
function Player(x, y) {
    // Центр по X, снизу по Y (по умолчанию)
    const tileSize = gameManager.tileSize;
    this.pos_x = (typeof x === 'number') ? x : Math.floor((gameManager.mapWidth * tileSize) / 2) - tileSize / 2;
    this.pos_y = (typeof y === 'number') ? y : (gameManager.mapHeight * tileSize) - tileSize * 2 - 40;
    this.size_x = tileSize;
    this.size_y = tileSize * 2;
    this.state = 'idle'; // 'idle' или 'run'
    this.frameIndex = 0; // Индекс кадра анимации
    this.frameTick = 0;  // Счётчик для смены кадров
    this.vel_y = 0;      // Вертикальная скорость
    this.isJumping = false; // Флаг: в прыжке ли игрок
    this.jumpCooldown = 0;  // Время до следующего прыжка (мс)
    this.wasOnGround = false; // Был ли на земле в прошлом кадре
    this.coyoteTime = 0;     // Время после схода с платформы, когда можно прыгнуть (мс)
}

Player.prototype = Object.create(Entity.prototype);
Player.prototype.constructor = Player;

/**
 * Основной update-метод игрока: управление, прыжки, гравитация, взаимодействие с physicsManager, анимация.
 */
Player.prototype.update = function () {
    // Блокируем управление после победы, но продолжаем применять гравитацию и отрисовку
    if (gameManager.isGameFinished) {
        this.vel_y += 0.5;
        if (this.vel_y > 8) this.vel_y = 8;
        this.pos_y += this.vel_y;
        // Проверка на землю
        const onGround = physicsManager.isOnGround(this);
        if (onGround) {
            if (this.vel_y > 0) {
                this.vel_y = 0;
                this.isJumping = false;
                this.pos_y = Math.floor(this.pos_y / gameManager.tileSize) * gameManager.tileSize;
            }
        }
        this.wasOnGround = onGround;
        return;
    }
    // Управление движением (A/D)
    let moving = false;
    // Проверяем, был ли на земле в прошлом кадре
    const onGround = physicsManager.isOnGround(this);
    if (onGround) {
        this.coyoteTime = 120; // 0.12 сек — coyote time (можно прыгнуть чуть позже после схода с платформы)
    } else if (this.coyoteTime > 0) {
        this.coyoteTime -= 1000 / 60;
        if (this.coyoteTime < 0) this.coyoteTime = 0;
    }
    // Кулдаун прыжка (чтобы нельзя было прыгать слишком часто)
    if (this.jumpCooldown > 0) {
        this.jumpCooldown -= 1000 / 60;
        if (this.jumpCooldown < 0) this.jumpCooldown = 0;
    }
    if (typeof eventsManager !== 'undefined' && eventsManager.action) {
        if (eventsManager.action['left']) {
            this.state = 'run';
            this.direction = 'left';
            this.pos_x -= 3.2; // Скорость бега (можно регулировать)
            moving = true;
        }
        if (eventsManager.action['right']) {
            this.state = 'run';
            this.direction = 'right';
            this.pos_x += 3.2;
            moving = true;
        }
        // Прыжок: можно прыгать если был на земле или в пределах coyoteTime
        if (eventsManager.action['jump'] && !this.isJumping && (this.wasOnGround || this.coyoteTime > 0) && this.jumpCooldown === 0) {
            this.vel_y = -13; // Сила прыжка
            this.isJumping = true;
            this.jumpCooldown = 500; // Кулдаун между прыжками (мс)
            eventsManager.action['jump'] = false; // Сброс нажатия
            if (typeof soundManager !== 'undefined' && soundManager.playJump) {
                soundManager.playJump();
            }
            this.coyoteTime = 0; // Сброс coyote time после прыжка
        }
    }
    // Ограничение по краям карты (чтобы не выйти за пределы)
    const minX = 0;
    const maxX = gameManager.mapWidth * gameManager.tileSize - this.size_x;
    if (this.pos_x < minX) this.pos_x = minX;
    if (this.pos_x > maxX) this.pos_x = maxX;
    if (!moving) {
        this.state = 'idle';
        // direction не меняется, чтобы idle смотрел в последнюю сторону
    }
    // Гравитация и вертикальное движение (медленнее)
    this.vel_y += 0.5;
    if (this.vel_y > 8) this.vel_y = 8;
    this.pos_y += this.vel_y;
    // Проверка на землю
    if (onGround) {
        if (this.vel_y > 0) {
            this.vel_y = 0;
            this.isJumping = false;
            this.pos_y = Math.floor(this.pos_y / gameManager.tileSize) * gameManager.tileSize;
        }
    }
    // Сохраняем состояние земли для следующего кадра
    this.wasOnGround = onGround;
};
Player.prototype.draw = function (ctx) {
    // Физика (гравитация и столкновения)
    if (typeof physicsManager !== 'undefined') {
        physicsManager.update(this);
    }
    // Анимация: idle (17-25), run (1-16)
    let frames = [];
    if (this.state === 'run') {
        for (let i = 1; i <= 16; i++) frames.push('sprite' + i);
    } else {
        for (let i = 17; i <= 25; i++) frames.push('sprite' + i);
    }
    // Анимация
    this.frameTick++;
    if (this.frameTick > 6) { // скорость смены кадров
        this.frameTick = 0;
        this.frameIndex = (this.frameIndex + 1) % frames.length;
    }
    const spriteName = frames[this.frameIndex];
    const sprite = spriteManager.getSprite(spriteName);
    if (sprite) {
        // Idle тоже отражается, если последний раз двигались влево
        if ((this.state === 'run' && this.direction === 'left') || (this.state === 'idle' && this.direction === 'left')) {
            ctx.save();
            ctx.translate(this.pos_x + this.size_x / 2, this.pos_y);
            ctx.scale(-1, 1);
            spriteManager.drawSprite(ctx, spriteName, -this.size_x / 2, 0);
            ctx.restore();
        } else {
            spriteManager.drawSprite(ctx, spriteName, this.pos_x, this.pos_y);
        }
    }
};
