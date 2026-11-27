class BugDomain {
  static isBlockerBug(severity) {
    return severity === 'Blocker' || severity === 'Critical';
  }
}

module.exports = BugDomain;
