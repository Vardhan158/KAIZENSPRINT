const mongoose = require('mongoose');

const memStore = {
  users: [],
  projects: [],
  sprints: [],
  tasks: [],
  bugs: [],
  progress: []
};

module.exports = memStore;
