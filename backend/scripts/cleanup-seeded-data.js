require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  if (mongoose.connection.name !== 'kaizen_sprint') throw new Error('Refusing cleanup outside kaizen_sprint');

  const adminEmail = String(process.env.ADMIN_EMAIL || 'admin@kaizensprint.io').toLowerCase();
  const admin = await db.collection('users').findOne({ email: adminEmail, role: { $in: ['admin', 'ADMIN'] } });
  if (!admin) throw new Error('Configured admin not found; aborting');

  const seededNames = ['Alex Rivera', 'Marcus Chen', 'Sarah Jenkins', 'David Kim', 'Elena Rostova', 'Liam O’Connor', 'Zoe Saldana', 'Kenji Sato'];
  const seededUsers = await db.collection('users').find({
    $or: [{ name: { $in: seededNames } }, { email: 'admin@apexjira.com' }],
    _id: { $ne: admin._id }
  }).project({ _id: 1, name: 1, email: 1 }).toArray();
  const userIds = seededUsers.map(user => user._id);
  const seededProjects = await db.collection('projects').find({ $or: [{ name: 'Apex Cinematic Cloud OS' }, { key: 'APEX' }] }).project({ _id: 1, name: 1, key: 1 }).toArray();
  const projectIds = seededProjects.map(project => project._id);
  const deleted = {};

  async function deleteFrom(collection, filter) {
    if (!(await db.listCollections({ name: collection }).hasNext())) {
      deleted[collection] = 0;
      return;
    }
    deleted[collection] = (await db.collection(collection).deleteMany(filter)).deletedCount;
  }

  await deleteFrom('tasks', { $or: [{ projectId: { $in: projectIds } }, { assigneeId: { $in: userIds } }, { reporterId: { $in: userIds } }, { reviewerId: { $in: userIds } }] });
  await deleteFrom('issues', { $or: [{ projectId: { $in: projectIds } }, { assigneeId: { $in: userIds } }, { reporterId: { $in: userIds } }, { reviewerId: { $in: userIds } }] });
  await deleteFrom('bugs', { $or: [{ projectId: { $in: projectIds } }, { assignedTo: { $in: userIds } }, { reportedBy: { $in: userIds } }] });
  await deleteFrom('sprints', { $or: [{ projectId: { $in: projectIds } }, { members: { $in: userIds } }] });
  await deleteFrom('progresses', { userId: { $in: userIds } });
  await deleteFrom('standups', { employeeId: { $in: userIds } });
  await deleteFrom('work_logs', { employeeId: { $in: userIds } });
  await deleteFrom('project_members', { $or: [{ projectId: { $in: projectIds } }, { employeeId: { $in: userIds } }] });
  await deleteFrom('employee_profiles', { userId: { $in: userIds } });
  await deleteFrom('notifications', { userId: { $in: userIds } });
  await deleteFrom('refresh_tokens', { userId: { $in: userIds } });
  await deleteFrom('account_tokens', { userId: { $in: userIds } });
  await deleteFrom('leaves', { userId: { $in: userIds } });
  await deleteFrom('auditlogs', { performedBy: { $in: userIds } });
  await deleteFrom('projects', { _id: { $in: projectIds } });
  deleted.users = (await db.collection('users').deleteMany({ _id: { $in: userIds } })).deletedCount;
  await deleteFrom('settings', { 'orgProfile.name': 'KaizenSprint Global Inc.', 'departments.headName': { $in: ['Alex Rivera', 'Elena Rostova', 'Marcus Chen', 'Sarah Jenkins'] } });

  const remainingUsers = await db.collection('users').find({}).project({ email: 1, role: 1, name: 1 }).toArray();
  console.log(JSON.stringify({
    database: mongoose.connection.name,
    matchedSeededUsers: seededUsers.map(user => user.email || user.name),
    matchedSeededProjects: seededProjects.map(project => project.name),
    deleted,
    adminPreserved: remainingUsers.some(user => String(user._id) === String(admin._id) && user.email === adminEmail),
    remainingUsers: remainingUsers.map(user => ({ name: user.name, email: user.email, role: user.role })),
    remainingProjects: await db.collection('projects').countDocuments()
  }, null, 2));
}

run()
  .then(() => mongoose.disconnect())
  .catch(async error => {
    console.error(error.message);
    try { await mongoose.disconnect(); } catch {}
    process.exitCode = 1;
  });
