const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g., 'employee_code' or 'issue_key_ACLOS'
  seq: { type: Number, default: 100 }
});

module.exports = mongoose.model('Counter', counterSchema, 'counters');
