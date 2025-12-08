// Главный сервер lb4 - Express + Socket.IO для real-time обновлений
const express = require('express');
const http = require('http');
const fs = require('fs');
const {Server} = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createProxyMiddleware } = require('http-proxy-middleware');
const morgan = require('morgan');
const path = require('path');

const apiRoutes = require('./routes/api');
const uploadRoutes = require('./routes/upload');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));

const uploadsPath = path.join(__dirname, '../uploads');

const LB3_URL = process. env.LB3_API_URL || 'http://localhost:3000';
app.use('/static/img', createProxyMiddleware({
  target: LB3_URL,
  changeOrigin: true
}));

app.use((req, res, next) => {
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('X-Content-Security-Policy');
  res.removeHeader('X-Frame-Options');
  next();
});

// Статические файлы для загруженных изображений
app.use('/uploads', express.static(uploadsPath));

// Передаем io в роуты через req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// API routes
app.use('/api', apiRoutes);
app.use('/api/upload', uploadRoutes);

// Serve Angular app в production
// Проверяем оба возможных пути
const distPaths = [
  path.join(__dirname, '../dist/social-app/browser'),
  path.join(__dirname, '../dist/browser'),
  path.join(__dirname, '../dist')
];

let distPath = null;
for (const p of distPaths) {
  if (fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html'))) {
    distPath = p;
    break;
  }
}

if (distPath) {
  console.log('Serving Angular from:', distPath);
  app.use(express.static(distPath));

  app.use((req, res, next) => {
    // Пропускаем API, uploads и socket.io
    if (req.path.startsWith('/api') ||
      req.path.startsWith('/uploads') ||
      req.path.startsWith('/socket. io')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  console.log('Angular dist not found, API-only mode');
  app.get('/', (req, res) => {
    res.json({status: 'ok', message: 'lb4 API server running'});
  });
}

// WebSocket подключение
io.on('connection', (socket) => {
  console.log('Клиент подключился к WebSocket:', socket.id);

  socket.on('disconnect', () => {
    console.log('Клиент отключился:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`Сервер lb4 запущен на http://${HOST}:${PORT}`);
  console.log(`WebSocket сервер готов к подключениям`);
});

module.exports = {app, server, io};
