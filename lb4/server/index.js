// Главный сервер lb4 - Express + Socket.IO для real-time обновлений
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require('path');

const apiRoutes = require('./routes/api');
const uploadRoutes = require('./routes/upload');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Статические файлы для загруженных изображений
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Передаем io в роуты через req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// API routes
app.use('/api', apiRoutes);
app.use('/api/upload', uploadRoutes);

// Serve Angular app в production
const distPath = path.join(__dirname, '../dist');
if (require('fs').existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/browser/index.html'));
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

module.exports = { app, server, io };
