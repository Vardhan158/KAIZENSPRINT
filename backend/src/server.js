require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

const app = require('./app');
const { connectDB } = require('../config/db');
const { seedInitialData } = require('../seed');
const Logger = require('../utils/logger');
const SocketService = require('../infrastructure/sockets/SocketService');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
  }
});

SocketService.init(io);

app.use((req, res, next) => {
  req.io = io;
  next();
});

const PORT = process.env.PORT || 5000;

connectDB(async (isDbConnected) => {
  await seedInitialData(isDbConnected);
});

server.listen(PORT, () => {
  Logger.info(`KaizenSprint Server running on port ${PORT}`);
});
