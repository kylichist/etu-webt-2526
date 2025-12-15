// gameManager — основной менеджер игры. Отвечает за инициализацию, загрузку уровней, механику, статистику, обработку событий, спавн и обновление всех сущностей.
const gameManager = {
    canvas: null,
    ctx: null,
    viewport: {
        x: 0,
        y: 0,
        width: 0,
        height: 0
    },
    map: null,
    tileSize: 32,
    mapWidth: 0,
    mapHeight: 0,
    entities: [],
    player: null,
    factory: {},
    enemies: [], // массив врагов
    // --- Статистика ---
    souls: [],
    soulsCollected: 0,
    startTime: null,
    elapsedTime: 0,
    isWinSequence: false,
    winCountdown: 0,
    winStats: null,
    isGameFinished: false,
    levelIndex: 0,
    levels: ['data/map1.json', 'data/map2.json'],
    totalSouls: 0, // для статистики по всем уровням
    totalSoulsCollected: 0, // для статистики по всем уровням
    _restartCountdownActive: false,
    _restartCountdown: 0,
    _gameLoopId: null,
    /**
     * Инициализация игры: находит canvas, задаёт размеры, подписывается на resize, загружает первый уровень и спрайты.
     */
    init: function() {
        console.log('[gameManager] init старт');
        this.levelIndex = 0;
        this.totalSouls = 0;
        this.totalSoulsCollected = 0;
        this.isGameFinished = false;
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('[gameManager] Не найден canvas с id gameCanvas');
        } else {
            console.log('[gameManager] Найден canvas, задаём размеры');
        }
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        console.log('[gameManager] После resizeCanvas: canvas.width=' + this.canvas.width + ', height=' + this.canvas.height);
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.setInitialViewport();
        });
        this.loadLevel(this.levelIndex);
        spriteManager.loadAtlas('data/sprites.json', 'img/spritesheet.png');
        console.log('[gameManager] Вызван spriteManager.loadAtlas');
        this.factory['Soul'] = Soul;
    },
    /**
     * Загружает уровень по индексу, сбрасывает все сущности, статистику, спавнит игрока, души и врагов.
     * @param {number} idx
     */
    loadLevel: function(idx) {
        console.log('[gameManager] loadLevel', idx, this.levels[idx]);
        this.isGameFinished = false;
        this.isWinSequence = false;
        this.winCountdown = 0;
        this.winStats = null;
        this.entities = [];
        this.souls = [];
        this.player = null;
        this.enemies = [];
        this.startTime = this.startTime || null;
        this.elapsedTime = this.elapsedTime || 0;
        mapManager.load(this.levels[idx], () => {
            console.log('[gameManager] mapManager.load callback');
            this.map = mapManager.map;
            this.mapWidth = mapManager.mapWidth;
            this.mapHeight = mapManager.mapHeight;
            this.tileSize = mapManager.tileSize;
            this.setInitialViewport();
            this.parseSouls(true); // true — не сбрасывать статистику
            console.log('[gameManager] После parseSouls, всего душ:', this.souls.length);
            // --- Новое: для второго уровня спавним игрока выше ---
            let playerY;
            if (this.levelIndex === 1) {
                playerY = (this.mapHeight * this.tileSize) - this.tileSize * 7;
            } else {
                playerY = (this.mapHeight * this.tileSize) - this.tileSize * 2 - 40;
            }
            this.player = new Player(undefined, playerY);
            console.log('[gameManager] Создан Player');
            this.entities.push(this.player);
            setTimeout(() => this.parseEntities(), 500);
            this.spawnEnemies();
            if (!this._gameLoopStarted) {
                this.startGameLoop();
                this._gameLoopStarted = true;
                console.log('[gameManager] Старт игрового цикла');
            }
        });
    },
    /**
     * Спавнит врагов в случайных местах верхней части карты. На втором уровне враги не спавнятся рядом друг с другом.
     */
    spawnEnemies: function() {
        this.enemies = [];
        const enemyCount = this.levelIndex === 0 ? 1 : 2;
        const usedPositions = [];
        for (let i = 0; i < enemyCount; i++) {
            let x, y, unique = false, attempts = 0;
            while (!unique && attempts < 20) {
                x = Math.floor(Math.random() * (this.mapWidth - 2)) * this.tileSize + this.tileSize / 2;
                y = Math.floor(Math.random() * 5) * this.tileSize + this.tileSize / 2;
                unique = true;
                for (const pos of usedPositions) {
                    if (Math.abs(pos.x - x) < 10 && Math.abs(pos.y - y) < 10) {
                        unique = false;
                        break;
                    }
                }
                attempts++;
            }
            usedPositions.push({x, y});
            this.enemies.push(new Enemy(x, y, 28));
        }
        // Увеличиваем максимум душ в статистике (может быть отрицательным)
        this.totalSouls += this.enemies.length;
    },
    /**
     * Парсит души из объектного слоя карты. Если keepStats=false — сбрасывает статистику.
     */
    parseSouls: function(keepStats) {
        console.log('[gameManager] parseSouls', keepStats);
        // Инициализация душ из объектного слоя карты
        if (!keepStats) {
            this.soulsCollected = 0;
            this.startTime = null;
            this.elapsedTime = 0;
            this.totalSouls = 0;
            this.totalSoulsCollected = 0;
        }
        let prevSoulsCollected = this.soulsCollected || 0;
        let prevTotalSouls = this.totalSouls || 0;
        this.souls = [];
        if (mapManager && mapManager.mapData && mapManager.mapData.layers) {
            for (let l = 0; l < mapManager.mapData.layers.length; l++) {
                const layer = mapManager.mapData.layers[l];
                if (layer.type === 'objectgroup' && layer.objects) {
                    for (const obj of layer.objects) {
                        if (obj.type === 'Soul') {
                            this.souls.push(new window.Soul(obj.x, obj.y, obj.width || mapManager.tileSize));
                        }
                    }
                }
            }
        }
        if (!keepStats) {
            this.totalSouls = this.souls.length;
            this.soulsCollected = 0;
        } else {
            this.totalSouls = prevTotalSouls + this.souls.length;
            this.soulsCollected = prevSoulsCollected;
        }
    },
    /**
     * Устанавливает размеры canvas и viewport.
     */
    resizeCanvas: function() {
        this.canvas.width = 480;
        this.canvas.height = 600;
        this.viewport.width = this.canvas.width;
        this.viewport.height = this.canvas.height;
    },
    /**
     * Центрирует viewport по горизонтали и прижимает к низу карты.
     */
    setInitialViewport: function() {
        // Центрируем по горизонтали, снизу по вертикали
        this.viewport.x = Math.max(0, Math.floor((this.mapWidth * this.tileSize - this.viewport.width) / 2));
        this.viewport.y = Math.max(0, this.mapHeight * this.tileSize - this.viewport.height);
        if (this.viewport.x < 0) this.viewport.x = 0;
        if (this.viewport.y < 0) this.viewport.y = 0;
    },
    /**
     * Парсит динамические сущности из карты (расширяемо для будущих типов).
     */
    parseEntities: function() {
        if (!mapManager.mapData) {
            setTimeout(() => this.parseEntities(), 100);
            return;
        }
        const objectLayers = mapManager.mapData.layers.filter(l => l.type === 'objectgroup');
        for (const layer of objectLayers) {
            for (const obj of layer.objects) {
                if (this.factory[obj.type]) {
                    const entity = new this.factory[obj.type](obj);
                    this.entities.push(entity);
                }
            }
        }
    },
    /**
     * Запускает основной игровой цикл (setInterval 60 FPS).
     */
    startGameLoop: function() {
        if (this._gameLoopId) clearInterval(this._gameLoopId);
        this._gameLoopId = setInterval(() => this.update(), 1000/60);
    },
    /**
     * Главный update-метод: обновляет все сущности, обрабатывает механику, статистику, победу, рестарт, таблицу результатов.
     */
    update: function() {
        handleCameraMove();
        if (!this.ctx) return;
        mapManager.draw(this.ctx);
        // Враги: обновление и отрисовка
        for (const enemy of this.enemies) {
            // Враги двигаются только после первого действия игрока
            if (this.startTime) {
                enemy.update();
            }
            enemy.draw(this.ctx);
        }
        // Затем души и игрок
        for (const soul of this.souls) {
            soul.draw(this.ctx);
        }
        if (this.player && typeof this.player.update === 'function') {
            this.player.update();
            // Проверка столкновений с врагами
            for (const enemy of this.enemies) {
                enemy.checkCollision(this.player);
            }
            // Победная анимация: мерцание
            if (this.isWinSequence) {
                if (!this._blink) this._blink = 0;
                this._blink++;
                if (Math.floor(this._blink / 5) % 2 === 0) {
                    this.ctx.save();
                    this.ctx.globalAlpha = 0.3;
                    this.player.draw(this.ctx);
                    this.ctx.restore();
                } else {
                    this.player.draw(this.ctx);
                }
            } else {
                this.player.draw(this.ctx);
            }
        }
        // Запуск таймера при первом действии
        if (!this.startTime && (eventsManager.action['left'] || eventsManager.action['right'] || eventsManager.action['jump'])) {
            this.startTime = Date.now();
        }
        if (this.startTime && !this.isWinSequence) {
            this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
        }
        // Проверка сбора душ
        let collectedThisFrame = 0;
        for (const soul of this.souls) {
            if (soul.checkCollected(this.player)) {
                this.soulsCollected++;
                collectedThisFrame++;
            }
        }
        // Победная зона: тайловые координаты 10,0 - 19,3
        const tileX = Math.floor(this.player.pos_x / this.tileSize);
        const tileY = Math.floor(this.player.pos_y / this.tileSize);
        if (!this.isWinSequence) {
            if (tileX >= 10 && tileX <= 19 && tileY >= 0 && tileY <= 3) {
                this.isWinSequence = true;
                this.winCountdown = 5.0;
                this.winStats = {
                    souls: this.soulsCollected,
                    total: this.totalSouls,
                    time: this.elapsedTime
                };
            }
        } else {
            // Если игрок вышел из зоны до окончания отсчёта — сбрасываем winSequence
            if (!(tileX >= 10 && tileX <= 19 && tileY >= 0 && tileY <= 3)) {
                this.isWinSequence = false;
                this.winCountdown = 0;
                this.winStats = null;
            }
        }
        // Победная последовательность: обратный отсчёт
        if (this.isWinSequence) {
            this.winCountdown -= 1/60;
            if (this.winCountdown <= 0) {
                this.winCountdown = 0;
                // Завершить игру, зафиксировать статистику
                if (this.levelIndex + 1 < this.levels.length) {
                    // Переход на следующий уровень без финальной победы
                    this.levelIndex++;
                    this.isWinSequence = false;
                    this.winCountdown = 0;
                    // Не сбрасываем winStats, чтобы финальная статистика сохранилась
                    this.isGameFinished = false;
                    this.loadLevel(this.levelIndex);
                    return;
                } else if (!this.isGameFinished) {
                    // Финальная победа (только один раз)
                    this.isGameFinished = true;
                    this.finishWin();
                    return;
                }
            }
        }
        // Обновление статистики на странице
        const statsDiv = document.getElementById('stats');
        const statsText = document.getElementById('statsText');
        const helpText = document.getElementById('helpText');
        const winForm = document.getElementById('winForm');
        if (statsDiv && statsText && helpText && winForm) {
            // Справка по управлению
            helpText.innerHTML = 'Управление:<br>W/S — камера вверх/вниз<br>A/D — бег влево/вправо<br>Пробел — прыжок';
            helpText.style.display = 'block';
            helpText.style.color = '#fff';
            winForm.style.display = 'none';
            if (this._restartCountdownActive) {
                let min = Math.floor(this.winStats.time / 60);
                let sec = this.winStats.time % 60;
                let timeStr = min.toString().padStart(2, '0') + ':' + sec.toString().padStart(2, '0');
                statsText.innerHTML = `<span style=\"color:#fff;font-size:20px;\">Победа!<br>Души: ${this.winStats.souls} / ${this.winStats.total}<br>Время: ${timeStr}</span><br><span style=\"color:#fff;font-size:20px;\">Рестарт через: ${this._restartCountdown} сек</span>`;
            } else if (this.isWinSequence && this.winCountdown > 0) {
                let min = Math.floor(this.winStats.time / 60);
                let sec = this.winStats.time % 60;
                let timeStr = min.toString().padStart(2, '0') + ':' + sec.toString().padStart(2, '0');
                statsText.innerHTML = `<span style="color:#fff;font-size:20px;">Души: ${this.winStats.souls} / ${this.winStats.total}<br>Время: ${timeStr}<br>Завершение через: ${Math.ceil(this.winCountdown)} сек</span>`;
            } else if (this.isGameFinished && this.winStats && this.levelIndex === this.levels.length - 1) {
                let min = Math.floor(this.winStats.time / 60);
                let sec = this.winStats.time % 60;
                let timeStr = min.toString().padStart(2, '0') + ':' + sec.toString().padStart(2, '0');
                statsText.innerHTML = `<span style="color:#fff;font-size:20px;">Победа!<br>Души: ${this.winStats.souls} / ${this.winStats.total}<br>Время: ${timeStr}</span>`;
                winForm.style.display = 'block';
                // Сброс состояния кнопки и поля
                setTimeout(() => {
                    const btn = document.getElementById('addResultBtn');
                    const input = document.getElementById('playerNameInput');
                    if (btn) btn.disabled = false;
                    if (input) input.value = 'Player';
                    if (btn && !btn._handlerAttached) {
                        btn._handlerAttached = true;
                        btn.onclick = () => {
                            if (btn.disabled) return;
                            btn.disabled = true;
                            const nameRaw = (document.getElementById('playerNameInput').value || '').trim() || 'Player';
                            const name = nameRaw.length > 15 ? nameRaw.slice(0, 15) : nameRaw;
                            let results = [];
                            try {
                                results = JSON.parse(localStorage.getItem('cw_results') || '[]');
                            } catch(e) { results = []; }
                            results.push({
                                name,
                                souls: gameManager.winStats.souls,
                                total: gameManager.winStats.total,
                                time: gameManager.winStats.time
                            });
                            localStorage.setItem('cw_results', JSON.stringify(results));
                            gameManager.showResultsTable();
                            // Показываем 'Рестарт через N сек' сразу и держим до рестарта
                            gameManager._restartCountdownActive = true;
                            gameManager._restartCountdown = 5;
                            let countdown = gameManager._restartCountdown;
                            winForm.style.display = 'none';
                            const interval = setInterval(() => {
                                countdown--;
                                gameManager._restartCountdown = countdown;
                                if (countdown <= 0) {
                                    clearInterval(interval);
                                    gameManager._restartCountdownActive = false;
                                    statsText.innerHTML = '';
                                    gameManager.resetGame();
                                } else {
                                    let min = Math.floor(gameManager.winStats.time / 60);
                                    let sec = gameManager.winStats.time % 60;
                                    let timeStr = min.toString().padStart(2, '0') + ':' + sec.toString().padStart(2, '0');
                                    statsText.innerHTML = `<span style=\"color:#fff;font-size:20px;\">Победа!<br>Души: ${gameManager.winStats.souls} / ${gameManager.winStats.total}<br>Время: ${timeStr}</span><br><span style=\"color:#fff;font-size:20px;\">Рестарт через: ${countdown} сек</span>`;
                                }
                            }, 1000);
                        };
                    }
                    gameManager.showResultsTable();
                }, 0);
            } else {
                let min = Math.floor(this.elapsedTime / 60);
                let sec = this.elapsedTime % 60;
                let timeStr = min.toString().padStart(2, '0') + ':' + sec.toString().padStart(2, '0');
                statsText.innerHTML = `<span style="color:#fff;font-size:20px;">Души: ${this.soulsCollected} / ${this.totalSouls} <br>Время: ${timeStr}</span>`;
            }
        }
        // Всегда показываем таблицу справа
        gameManager.showResultsTable();
    },
    /**
     * Показывает таблицу результатов справа от canvas, сортирует по душам, времени, имени.
     */
    showResultsTable: function() {
        let results = [];
        try {
            results = JSON.parse(localStorage.getItem('cw_results') || '[]');
        } catch(e) { results = []; }
        const tbl = document.getElementById('resultsTableFixed');
        if (!tbl) return;
        if (!results.length) {
            tbl.innerHTML = '';
            return;
        }
        // Сортировка: по душам (desc), по времени (asc), по имени (asc)
        results.sort((a, b) => {
            if (b.souls !== a.souls) return b.souls - a.souls;
            if (a.time !== b.time) return a.time - b.time;
            return a.name.localeCompare(b.name, 'ru');
        });
        // Показываем только 10 лучших
        results = results.slice(0, 10);
        let html = '<table style="color:#fff;font-family:Arial,sans-serif;font-size:20px;border-collapse:separate;border-spacing:0 6px;width:100%;text-align:left;">';
        html += '<tr><th style="padding-right:12px;">Имя</th><th style="padding-right:12px;">Души</th><th>Время</th></tr>';
        for (const r of results) {
            let min = Math.floor(r.time / 60);
            let sec = r.time % 60;
            let timeStr = min.toString().padStart(2, '0') + ':' + sec.toString().padStart(2, '0');
            let name = r.name.length > 15 ? r.name.slice(0, 15) : r.name;
            html += `<tr style="height:28px;"><td style="padding-right:12px;">${name}</td><td style="padding-right:12px;">${r.souls} / ${r.total}</td><td>${timeStr}</td></tr>`;
        }
        html += '</table>';
        tbl.innerHTML = html;
    },
    /**
     * Полный сброс игры и статистики, рестарт с первого уровня.
     */
    resetGame: function() {
        // Сброс статистики и рестарт с первого уровня
        this.levelIndex = 0;
        this.totalSouls = 0;
        this.totalSoulsCollected = 0;
        this.soulsCollected = 0;
        this.startTime = null;
        this.elapsedTime = 0;
        this.isWinSequence = false;
        this.winCountdown = 0;
        this.winStats = null;
        this.isGameFinished = false;
        this._restartCountdownActive = false;
        this._restartCountdown = 0;
        if (this._gameLoopId) {
            clearInterval(this._gameLoopId);
            this._gameLoopId = null;
        }
        this._gameLoopStarted = false;
        // Полный сброс игрока: удаляем старого, создаём нового при загрузке уровня
        this.player = null;
        this.entities = [];
        this.souls = [];
        this.enemies = [];
        this.loadLevel(0);
    },
    /**
     * Рисует статистику на canvas (дублируется для совместимости).
     */
    draw: function(ctx) {
        // Рисуем души
        for (const soul of this.souls) {
            soul.draw(ctx);
        }
        // Рисуем игрока и прочее...
        // Рисуем статистику (слева сверху)
        ctx.save();
        ctx.font = '20px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('Души: ' + this.soulsCollected + ' / ' + this.souls.length, 10, 10);
        // Время
        let min = Math.floor(this.elapsedTime / 60);
        let sec = this.elapsedTime % 60;
        let timeStr = min.toString().padStart(2, '0') + ':' + sec.toString().padStart(2, '0');
        ctx.fillText('Время: ' + timeStr, 10, 36);
        ctx.restore();
    }
};

/**
 * Обработка движения камеры по W/S (viewport).
 */
function handleCameraMove() {
    const speed = 8; // px за кадр
    if (eventsManager.action) {
        if (eventsManager.action['up']) {
            gameManager.viewport.y = Math.max(0, gameManager.viewport.y - speed);
        }
        if (eventsManager.action['down']) {
            const maxY = gameManager.mapHeight * gameManager.tileSize - gameManager.viewport.height;
            gameManager.viewport.y = Math.min(maxY, gameManager.viewport.y + speed);
        }
    }
}

/**
 * Базовый класс сущности (Entity) для расширения.
 */
function Entity(obj) {
    this.pos_x = obj.x;
    this.pos_y = obj.y;
    this.size_x = obj.width;
    this.size_y = obj.height;
}
Entity.prototype.draw = function(ctx) {};
