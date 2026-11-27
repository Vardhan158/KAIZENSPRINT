class SprintDomain {
  static calculateCapacity(durationWeeks, memberCount) {
    const hoursPerWeek = 40;
    return (memberCount || 1) * hoursPerWeek * (durationWeeks || 2);
  }

  static isSprintActive(status) {
    return status === 'active';
  }
}

module.exports = SprintDomain;
