const User = require('../models/User');
const Task = require('../models/Task');

const getWorkloadAnalytics = async (req, res) => {
  try {
    const users = await User.find({ role: 'employee' }).select('-password');
    const tasks = await Task.find({ status: { $ne: 'done' } });

    const workloadReport = users.map(user => {
      const assignedTasks = tasks.filter(t => t.assigneeId && t.assigneeId.toString() === user._id.toString());
      const totalPoints = assignedTasks.reduce((sum, t) => sum + (t.storyPoints || 3), 0);
      const estimatedHours = totalPoints * 6;
      const capacity = user.workloadCapacity || 40;
      const loadPercentage = Math.round((estimatedHours / capacity) * 100);

      let status = 'Optimal';
      if (loadPercentage > 110) status = 'Overloaded';
      else if (loadPercentage < 50) status = 'Available';

      return {
        user,
        activeTasksCount: assignedTasks.length,
        totalStoryPoints: totalPoints,
        estimatedHours,
        capacity,
        loadPercentage,
        status
      };
    });

    res.json(workloadReport);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getWorkloadAnalytics };
