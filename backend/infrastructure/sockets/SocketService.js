class SocketService {
  static io = null;

  static init(serverIo) {
    SocketService.io = serverIo;
  }

  static emitToUser(userId, event, payload) {
    if (SocketService.io && userId) {
      SocketService.io.emit(`notification_${userId}`, payload);
      SocketService.io.emit(`notification_broadcast`, payload);
    }
  }

  static broadcast(event, payload) {
    if (SocketService.io) {
      SocketService.io.emit(event, payload);
    }
  }
}

module.exports = SocketService;
