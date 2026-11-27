const Counter = require('./models/Counter');

async function getNextSequenceValue(sequenceName) {
  const counter = await Counter.findByIdAndUpdate(
    sequenceName,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

module.exports = { getNextSequenceValue };
