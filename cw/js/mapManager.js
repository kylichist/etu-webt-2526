// mapManager.js
// Менеджер карты: отвечает за загрузку, парсинг, хранение и отрисовку карты, работу с тайловым изображением (tileset), поддерживает работу с несколькими слоями и viewport.

const mapManager = {
    map: null,         // Основной массив тайлов первого слоя
    mapWidth: 0,      // Ширина карты в тайлах
    mapHeight: 0,     // Высота карты в тайлах
    tileSize: 32,     // Размер одного тайла (px)
    tileset: null,    // Изображение tileset.png
    tilesetLoaded: false, // Флаг загрузки tileset
    mapData: null,    // Оригинальный json карты (все слои)
    /**
     * Загружает json-карту (Tiled JSON), парсит её и запускает загрузку tileset.
     * @param {string} mapFile - путь к json-карте
     * @param {function} callback - вызывается после загрузки tileset
     */
    load: function (mapFile, callback) {
        fetch(mapFile)
            .then(res => {
                if (!res.ok) throw new Error('Ошибка загрузки карты: ' + mapFile);
                return res.json();
            })
            .then(json => {
                this.mapData = json; // Сохраняем все слои
                this.map = json.layers[0].data; // Первый слой — основной
                this.mapWidth = json.width;
                this.mapHeight = json.height;
                this.tileSize = json.tilewidth;
                this.loadTileset(callback); // Загружаем tileset
            })
            .catch(err => {
                console.error('[mapManager] Ошибка загрузки карты:', err);
                alert('Ошибка загрузки карты: ' + err.message);
            });
    },
    /**
     * Загружает изображение tileset.png. После загрузки вызывает callback.
     * @param {function} callback
     */
    loadTileset: function (callback) {
        this.tileset = new Image();
        this.tileset.onload = () => {
            this.tilesetLoaded = true;
            if (callback) callback();
        };
        this.tileset.onerror = (e) => {
            console.error('[mapManager] Ошибка загрузки tileset.png');
            alert('Ошибка загрузки tileset.png');
        };
        this.tileset.src = 'img/tileset.png';
    },
    /**
     * Отрисовывает все слои карты на канвасе с учётом viewport.
     * @param {CanvasRenderingContext2D} ctx
     */
    draw: function (ctx) {
        ctx.save();
        // 1. Заливка цветом по всему canvas (фон ПОД тайлами)
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = 'rgb(46, 90, 137)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // 2. Рисуем все слои карты (каждый слой отдельно, прозрачные тайлы не затирают нижние)
        if (!this.tilesetLoaded || !this.mapData) {
            ctx.restore();
            return;
        }
        const tileSize = this.tileSize;
        const tilesetCols = this.tileset.width / tileSize;
        // viewport берём из gameManager
        const viewport = gameManager.viewport;
        const startCol = Math.floor(viewport.x / tileSize);
        const endCol = Math.ceil((viewport.x + viewport.width) / tileSize);
        const startRow = Math.floor(viewport.y / tileSize);
        const endRow = Math.ceil((viewport.y + viewport.height) / tileSize);
        for (let l = 0; l < this.mapData.layers.length; l++) {
            const layer = this.mapData.layers[l];
            if (!layer.data) continue;
            for (let row = startRow; row < endRow; row++) {
                for (let col = startCol; col < endCol; col++) {
                    if (row < 0 || row >= this.mapHeight || col < 0 || col >= this.mapWidth) continue;
                    const tile = layer.data[row * this.mapWidth + col];
                    if (tile === 0) continue; // Прозрачный тайл
                    const sx = ((tile - 1) % tilesetCols) * tileSize;
                    const sy = Math.floor((tile - 1) / tilesetCols) * tileSize;
                    const dx = col * tileSize - viewport.x;
                    const dy = row * tileSize - viewport.y;
                    ctx.drawImage(this.tileset, sx, sy, tileSize, tileSize, dx, dy, tileSize, tileSize);
                }
            }
        }
        ctx.restore();
    }
};
