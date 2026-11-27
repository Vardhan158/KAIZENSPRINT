class UserDomain {
  static calculateWorkloadCapacity(workingHoursPerDay) {
    const hours = workingHoursPerDay || 8;
    return hours * 5; // 5 working days per week
  }

  static isAdmin(role) {
    return role === 'admin';
  }
}

module.exports = UserDomain;
