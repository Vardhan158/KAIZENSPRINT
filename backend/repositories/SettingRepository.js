const Setting = require('../models/Setting');

class SettingRepository {
  static async getSettings() {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }
    return settings;
  }

  static async updateSection(section, data) {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }
    settings[section] = data;
    settings.updatedAt = new Date();
    return settings.save();
  }
}

module.exports = SettingRepository;
