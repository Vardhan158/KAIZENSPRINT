const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../middleware/auth');
const Logger = require('../../utils/logger');

class SocketService {
  static io = null;

  static init(serverIo) {
    SocketService.io = serverIo;

    // Authenticate socket connection
    SocketService.io.use((socket, next) => {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        // Fallback allow connection in dev mode
        socket.user = { id: 'guest', role: 'guest' };
        return next();
      }

      jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
          socket.user = { id: 'guest', role: 'guest' };
        } else {
          socket.user = decoded;
        }
        next();
      });
    });

    SocketService.io.on('connection', (socket) => {
      Logger.info(`Authenticated Socket Connection: ${socket.id} (User: ${socket.user?.id})`);

      if (socket.user && socket.user.id !== 'guest') {
        // Join personal user room
        socket.join(`user_${socket.user.id}`);
        if (socket.user.role === 'admin') {
          socket.join('role_admin');
        }
      }

      // Room Subscriptions
      socket.on('subscribe:project', (projectId) => {
        if (projectId) {
          socket.join(`project_${projectId}`);
          Logger.info(`Socket ${socket.id} joined project room: project_${projectId}`);
        }
      });

      socket.on('unsubscribe:project', (projectId) => {
        if (projectId) socket.leave(`project_${projectId}`);
      });

      socket.on('subscribe:sprint', (sprintId) => {
        if (sprintId) socket.join(`sprint_${sprintId}`);
      });

      socket.on('disconnect', () => {
        Logger.info(`Socket disconnected: ${socket.id}`);
      });
    });
  }

  // 1. issue:assigned
  static emitIssueAssigned(assigneeId, projectId, issueData) {
    if (!SocketService.io) return;
    if (assigneeId) SocketService.io.to(`user_${assigneeId}`).emit('issue:assigned', issueData);
    if (projectId) SocketService.io.to(`project_${projectId}`).emit('issue:assigned', issueData);
    SocketService.io.emit('issue:assigned', issueData); // Global fallback for live boards
  }

  // 2. issue:updated
  static emitIssueUpdated(projectId, issueData) {
    if (!SocketService.io) return;
    if (projectId) SocketService.io.to(`project_${projectId}`).emit('issue:updated', issueData);
    SocketService.io.emit('issue:updated', issueData);
  }

  // 3. issue:status_changed
  static emitIssueStatusChanged(projectId, sprintId, issueData) {
    if (!SocketService.io) return;
    if (projectId) SocketService.io.to(`project_${projectId}`).emit('issue:status_changed', issueData);
    if (sprintId) SocketService.io.to(`sprint_${sprintId}`).emit('issue:status_changed', issueData);
    SocketService.io.emit('issue:status_changed', issueData);
  }

  // 4. sprint:started
  static emitSprintStarted(projectId, sprintData) {
    if (!SocketService.io) return;
    if (projectId) SocketService.io.to(`project_${projectId}`).emit('sprint:started', sprintData);
    SocketService.io.emit('sprint:started', sprintData);
  }

  // 5. sprint:completed
  static emitSprintCompleted(projectId, sprintData) {
    if (!SocketService.io) return;
    if (projectId) SocketService.io.to(`project_${projectId}`).emit('sprint:completed', sprintData);
    SocketService.io.emit('sprint:completed', sprintData);
  }

  // 6. comment:created
  static emitCommentCreated(projectId, commentData) {
    if (!SocketService.io) return;
    if (projectId) SocketService.io.to(`project_${projectId}`).emit('comment:created', commentData);
    SocketService.io.emit('comment:created', commentData);
  }

  // 7. review:submitted
  static emitReviewSubmitted(projectId, reviewData) {
    if (!SocketService.io) return;
    SocketService.io.to('role_admin').emit('review:submitted', reviewData);
    if (projectId) SocketService.io.to(`project_${projectId}`).emit('review:submitted', reviewData);
    SocketService.io.emit('review:submitted', reviewData);
  }

  // 8. review:completed
  static emitReviewCompleted(assigneeId, projectId, reviewData) {
    if (!SocketService.io) return;
    if (assigneeId) SocketService.io.to(`user_${assigneeId}`).emit('review:completed', reviewData);
    if (projectId) SocketService.io.to(`project_${projectId}`).emit('review:completed', reviewData);
    SocketService.io.emit('review:completed', reviewData);
  }

  // 9. notification:new
  static emitNotificationNew(recipientId, notificationData) {
    if (!SocketService.io) return;
    if (recipientId) {
      SocketService.io.to(`user_${recipientId}`).emit('notification:new', notificationData);
      SocketService.io.to(`user_${recipientId}`).emit(`notification_${recipientId}`, notificationData);
    }
    SocketService.io.emit('notification:new', notificationData);
  }
}

module.exports = SocketService;
