// main.js
// Точка входа в игру. Здесь происходит запуск всей игровой логики после загрузки страницы.

window.onload = function () {
    // После полной загрузки страницы ищем gameManager и инициализируем игру
    console.log('[main.js] window.onload: старт');
    if (typeof gameManager !== 'undefined') {
        // Если gameManager найден, запускаем инициализацию всей архитектуры
        console.log('[main.js] gameManager найден, вызываю init()');
        gameManager.init();
    } else {
        // Если что-то пошло не так — выводим ошибку
        console.error('[main.js] gameManager не найден!');
    }
};
