class TaskDomain {
  static validateStatusTransition(currentStatus, targetStatus) {
    const validTransitions = {
      backlog: ['todo', 'in_progress'],
      todo: ['in_progress', 'done'],
      in_progress: ['review', 'testing', 'done', 'todo'],
      review: ['in_progress', 'done'],
      testing: ['in_progress', 'done'],
      done: ['in_progress', 'todo']
    };

    const allowed = validTransitions[currentStatus] || [];
    return allowed.includes(targetStatus);
  }

  static isTaskOverdue(dueDate) {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const now = new Date();
    return due < now;
  }

  static isBlockerOrCritical(priority) {
    return priority === 'critical' || priority === 'urgent';
  }
}

module.exports = TaskDomain;
