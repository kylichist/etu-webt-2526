const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const nameInput = document.getElementById('playerName');
const startBtn = document.getElementById('startGame');
const leaderboardBody = document.querySelector('#leaderboard tbody');
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');

const COLS = 10, ROWS = 20, CELL = 20;
const TETROMINOS = [
    [[1, 1, 1, 1]], [[1, 1, 1], [0, 1, 0]], [[1, 1, 0], [0, 1, 1]],
    [[0, 1, 1], [1, 1, 0]], [[1, 1, 1], [1, 0, 0]], [[1, 1, 1], [0, 0, 1]], [[1, 1], [1, 1]]
];

let board = Array.from({length: ROWS}, () => Array(COLS).fill(0)), currentPiece, nextPiece;
let score = 0, level = 1, intervalId;
let paused = false, gameOver = false, playerName = '';
const loseLine = 1;
const scoreThresholds = [0, 500, 1000, 2000, 4000];
let dropInterval = 500;

draw();

function createPiece() {
    return {shape: TETROMINOS[Math.floor(Math.random() * TETROMINOS.length)].map(r => r.slice()), x: 3, y: 0};
}

function startGame() {
    board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
    score = 0;
    level = 1;
    paused = false;
    gameOver = false;
    overlay.textContent = '';
    currentPiece = createPiece();
    nextPiece = createPiece();
    updateScore();
    updateLevel();
    draw();
    drawNextPiece();
    startLoop();
    startBtn.disabled = true;
    nameInput.disabled = true;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (board[y][x]) drawCell(x, y, '#ffa500');

    ctx.strokeStyle = 'red';
    ctx.beginPath();
    ctx.moveTo(0, loseLine * CELL);
    ctx.lineTo(COLS * CELL, loseLine * CELL);
    ctx.stroke();

    if (currentPiece && !gameOver) {
        drawGhost();
        currentPiece.shape.forEach((row, dy) => row.forEach((v, dx) => {
            if (v) {
                const X = currentPiece.x + dx, Y = currentPiece.y + dy;
                if (Y >= 0 && Y < ROWS) drawCell(X, Y, 'red');
            }
        }));
    }
}

function drawCell(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * CELL, y * CELL, CELL - 1, CELL - 1);
}

function drawGhost() {
    let dropY = currentPiece.y;
    while (!collides(currentPiece.shape, currentPiece.x, dropY + 1)) dropY++;
    currentPiece.shape.forEach((row, dy) => row.forEach((v, dx) => {
        if (v) {
            const X = currentPiece.x + dx, Y = dropY + dy;
            if (Y >= 0 && Y < ROWS) drawCell(X, Y, 'rgba(128,128,128,0.4)');
        }
    }));
}

function drawNextPiece() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    const piece = nextPiece.shape;
    const rows = piece.length;
    const cols = piece[0].length;
    const cellSize = 16;
    const offsetX = Math.floor((nextCanvas.width - cols * cellSize) / 2);
    const offsetY = Math.floor((nextCanvas.height - rows * cellSize) / 2);
    piece.forEach((row, dy) => row.forEach((v, dx) => {
        if (v) {
            nextCtx.fillStyle = 'red';
            nextCtx.fillRect(offsetX + dx * cellSize, offsetY + dy * cellSize, cellSize - 1, cellSize - 1);
        }
    }));
}

function collides(piece, xOffset, yOffset) {
    for (let y = 0; y < piece.length; y++) for (let x = 0; x < piece[y].length; x++) if (piece[y][x]) {
        const nx = x + xOffset, ny = y + yOffset;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && board[ny][nx]) return true;
    }
    return false;
}

function mergePiece() {
    currentPiece.shape.forEach((row, dy) => row.forEach((v, dx) => {
        if (v) {
            const X = currentPiece.x + dx, Y = currentPiece.y + dy;
            if (Y >= 0) board[Y][X] = 1;
        }
    }));
    clearLines();
    if (currentPiece.y < loseLine) {
        gameOver = true;
        stopLoop();
        overlay.textContent = 'Game Over';
        addLeaderboard();
        draw();
        startBtn.disabled = false;
        nameInput.disabled = false;
        return;
    }
    currentPiece = nextPiece;
    nextPiece = createPiece();
    drawNextPiece();
    if (collides(currentPiece.shape, currentPiece.x, currentPiece.y)) {
        gameOver = true;
        stopLoop();
        overlay.textContent = 'Game Over';
        addLeaderboard();
        draw();
        startBtn.disabled = false;
        nameInput.disabled = false;
    }
}

function clearLines() {
    let cleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(v => v)) {
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(0));
            cleared++;
            y++;
        }
    }
    if (cleared) {
        score += cleared * 100;
        updateScore();
        updateLevel();
    }
}

function rotate(piece) {
    const h = piece.length, w = piece[0].length;
    const rotated = Array.from({length: w}, () => Array(h).fill(0));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) rotated[x][h - 1 - y] = piece[y][x];
    return rotated;
}

function hardDrop() {
    if (gameOver || paused) return;
    while (!collides(currentPiece.shape, currentPiece.x, currentPiece.y + 1)) currentPiece.y++;
    mergePiece();
    draw();
}

function updateScore() {
    scoreEl.textContent = `Очки: ${score}`;
}

function updateLevel() {
    for (let i = scoreThresholds.length - 1; i >= 0; i--) {
        if (score >= scoreThresholds[i]) {
            level = i + 1;
            dropInterval = 500 - Math.min(400, (level - 1) * 50);
            levelEl.textContent = `Уровень: ${level}`;
            if (intervalId) {
                clearInterval(intervalId);
                startLoop();
            }
            break;
        }
    }
}

function startLoop() {
    stopLoop();
    intervalId = setInterval(() => {
        if (!paused && !gameOver) {
            if (!collides(currentPiece.shape, currentPiece.x, currentPiece.y + 1)) currentPiece.y++; else mergePiece();
            draw();
        }
    }, dropInterval);
}

function stopLoop() {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
}

function addLeaderboard() {
    const arr = JSON.parse(localStorage.getItem('tetris') || '[]');
    arr.push({n: playerName, s: score});
    arr.sort((a, b) => b.s - a.s);
    localStorage.setItem('tetris', JSON.stringify(arr.slice(0, 10)));
    renderLeaderboard();
}

function renderLeaderboard() {
    const arr = JSON.parse(localStorage.getItem('tetris') || '[]');
    leaderboardBody.innerHTML = arr.map(x => `<tr><td>${escapeHtml(x.n)}</td><td>${x.s}</td></tr>`).join('');
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[c]));
}

document.addEventListener('keydown', e => {
    if (gameOver) return;
    switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
            if (!paused && !collides(currentPiece.shape, currentPiece.x - 1, currentPiece.y)) currentPiece.x--;
            break;
        case 'ArrowRight':
        case 'KeyD':
            if (!paused && !collides(currentPiece.shape, currentPiece.x + 1, currentPiece.y)) currentPiece.x++;
            break;
        case 'ArrowUp':
        case 'KeyW':
            if (!paused) {
                const r = rotate(currentPiece.shape);
                if (!collides(r, currentPiece.x, currentPiece.y)) currentPiece.shape = r;
            }
            break;
        case 'ArrowDown':
        case 'KeyS':
            if (!paused) hardDrop();
            break;
        case 'KeyP':
            if (!gameOver && startBtn.disabled) {
                paused = !paused;
                overlay.textContent = paused ? 'Paused' : '';
            }
            break;
    }
    draw();
});

startBtn.addEventListener('click', () => {
    if (!startBtn.disabled) {
        const name = nameInput.value.trim();
        if (!/^[а-яА-ЯёЁa-zA-Z0-9]{1,20}$/.test(name)) {
            alert("Имя: 1-20 символов, буквы или цифры");
            return;
        }
        playerName = name;
        startGame();
    }
});

renderLeaderboard();
