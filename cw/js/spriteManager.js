// spriteManager.js
// Менеджер спрайтов для динамических сущностей (игрок, души, враги).
// Отвечает за загрузку json-атласа и изображения, хранение данных о спрайтах и отрисовку нужного спрайта на канвасе.
// Позволяет легко расширять игру новыми динамическими объектами без изменения кода отрисовки.
const spriteManager = {
    image: null, // Изображение-атлас со всеми спрайтами (загружается отдельно)
    sprites: [], // Массив описаний спрайтов: [{name, x, y, w, h}]
    imgLoaded: false, // Флаг: true, когда изображение-атлас загружен
    jsonLoaded: false, // Флаг: true, когда json-описание атласа загружено

    /**
     * Загружает json-описание атласа и после этого — изображение-атлас.
     * @param {string} atlasJsonPath - путь к json-описанию атласа
     * @param {string} imgPath - путь к изображению-атласу
     */
    loadAtlas: function(atlasJsonPath, imgPath) {
        // Загружаем json с описанием всех спрайтов (асинхронно)
        const xhr = new XMLHttpRequest();
        xhr.open('GET', atlasJsonPath, true);
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4 && xhr.status === 200) {
                // После успешной загрузки json парсим его и сохраняем данные о спрайтах
                this.parseAtlas(JSON.parse(xhr.responseText));
                this.jsonLoaded = true;
                // После json — загружаем картинку-атлас
                this.loadImg(imgPath);
            }
        };
        xhr.send();
    },

    /**
     * Парсит json-описание атласа и сохраняет массив спрайтов.
     * @param {object} atlas - объект json с frames
     */
    parseAtlas: function(atlas) {
        // frames: [{filename, frame:{x,y,w,h}, ...}]
        this.sprites = atlas.frames.map(f => ({
            name: f.filename, // Имя спрайта (например, sprite17)
            x: f.frame.x,     // Координата X в атласе
            y: f.frame.y,     // Координата Y в атласе
            w: f.frame.w,     // Ширина спрайта
            h: f.frame.h      // Высота спрайта
        }));
    },

    /**
     * Загружает изображение-атлас. После загрузки выставляет imgLoaded=true.
     * @param {string} imgPath
     */
    loadImg: function(imgPath) {
        this.image = new Image();
        this.image.onload = () => { this.imgLoaded = true; };
        this.image.onerror = () => { console.error('[spriteManager] Ошибка загрузки изображения-атласа:', imgPath); };
        this.image.src = imgPath;
    },

    /**
     * Возвращает объект-описание спрайта по имени (или undefined, если не найден).
     * @param {string} name
     * @returns {object|undefined}
     */
    getSprite: function(name) {
        return this.sprites.find(s => s.name === name);
    },

    /**
     * Рисует спрайт по имени на канвасе с учётом viewport (смещение камеры).
     * @param {CanvasRenderingContext2D} ctx
     * @param {string} name - имя спрайта (например, 'sprite17')
     * @param {number} x - координата X в игровом мире
     * @param {number} y - координата Y в игровом мире
     */
    drawSprite: function(ctx, name, x, y) {
        if (!this.imgLoaded || !this.jsonLoaded) return; // Не рисуем, если ресурсы не загружены
        const sprite = this.getSprite(name);
        if (!sprite) return; // Нет такого спрайта в атласе
        // Смещение относительно окна карты (viewport) — поддержка скроллинга
        const drawX = x - gameManager.viewport.x;
        const drawY = y - gameManager.viewport.y;
        ctx.drawImage(
            this.image,
            sprite.x, sprite.y, sprite.w, sprite.h, // Координаты и размер в атласе
            drawX, drawY, sprite.w, sprite.h        // Куда и с каким размером рисовать на канвасе
        );
    }
};
