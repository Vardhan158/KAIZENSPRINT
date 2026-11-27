const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');
const fs = require('fs');

const requestIdMiddleware = require('../middleware/requestId');
const v1ApiRouter = require('./api/v1/index');

// Legacy routes
const authRoutes = require('../routes/authRoutes');
const userRoutes = require('../routes/userRoutes');
const projectRoutes = require('../routes/projectRoutes');
const sprintRoutes = require('../routes/sprintRoutes');
const taskRoutes = require('../routes/taskRoutes');
const bugRoutes = require('../routes/bugRoutes');
const progressRoutes = require('../routes/progressRoutes');
const analyticsRoutes = require('../routes/analyticsRoutes');
const notificationRoutes = require('../routes/notificationRoutes');
const settingsRoutes = require('../routes/settingsRoutes');
const auditLogRoutes = require('../routes/auditLogRoutes');
const exportRoutes = require('../routes/exportRoutes');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const app = express();

// Request ID Correlation Middleware
app.use(requestIdMiddleware);

// Security Headers & NoSQL Injection Protection
app.use(helmet({ contentSecurityPolicy: false }));
app.use(mongoSanitize());

app.use(cors());
app.use(express.json());

// Auth Endpoint Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' }
});

app.use('/api/v1/auth', authLimiter);
app.use('/api/auth', authLimiter);

app.use('/uploads', express.static(uploadsDir));

// V1 API Endpoints
app.use('/api/v1', v1ApiRouter);

// Legacy API Endpoints for complete backward compatibility
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/sprints', sprintRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/bugs', bugRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/export', exportRoutes);

module.exports = app;
