// physicsManager.js
// Менеджер физики для платформера. Отвечает за обработку проходимости тайлов, определение земли, гравитацию и взаимодействие с mapManager.

const physicsManager = {
    /**
     * Проверяет, является ли тайл проходимым (можно ли по нему ходить/прыгать).
     * @param {number} tileId
     * @returns {boolean}
     */
    isTilePassable: function (tileId) {
        // Непроходимые: 78, 79, 80, 81, 82, 168 (см. архитектуру)
        return !((tileId >= 78 && tileId <= 82) || tileId === 168);
    },
    /**
     * Получает id непроходимого тайла по координатам (x, y в пикселях).
     * Проверяет все слои карты, возвращает первый найденный непроходимый тайл.
     * @param {number} x
     * @param {number} y
     * @returns {number} id тайла или 0, если нет непроходимого
     */
    getTileIdAt: function (x, y) {
        const col = Math.floor(x / mapManager.tileSize);
        const row = Math.floor(y / mapManager.tileSize);
        let foundBlockId = 0;
        for (let l = 0; l < mapManager.mapData.layers.length; l++) {
            const layer = mapManager.mapData.layers[l];
            if (!layer.data) continue;
            const idx = row * mapManager.mapWidth + col;
            if (idx < 0 || idx >= layer.data.length) continue;
            const tileId = layer.data[idx];
            if ((tileId >= 78 && tileId <= 82) || tileId === 168) {
                return tileId; // Сразу возвращаем первый найденный непроходимый
            }
            if (tileId && !foundBlockId) foundBlockId = tileId; // Сохраняем любой найденный id
        }
        return foundBlockId; // Если нет непроходимого, возвращаем любой найденный id или 0
    },
    /**
     * Проверяет, можно ли стоять на тайле под (x, y).
     * @param {Entity} entity
     * @returns {boolean}
     */
    isOnGround: function (entity) {
        // Проверяем тайл под центром нижней части сущности
        const x = entity.pos_x + entity.size_x / 2;
        const y = entity.pos_y + entity.size_y + 1;
        const tileId = this.getTileIdAt(x, y);
        return ((tileId >= 78 && tileId <= 82) || tileId === 168);
    },
    /**
     * Обновляет физику для сущности (гравитация и столкновения).
     * @param {Entity} entity
     */
    update: function (entity) {
        // Гравитация
        if (!this.isOnGround(entity)) {
            entity.pos_y += 4; // Скорость падения
        } else {
            // Корректируем позицию, чтобы стоять на платформе
            entity.pos_y = Math.floor(entity.pos_y / mapManager.tileSize) * mapManager.tileSize;
        }
    }
};
