const mongoose = require('mongoose');

const issueReviewSchema = new mongoose.Schema({
  issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'CHANGES_REQUESTED'], default: 'PENDING' },
  feedback: { type: String, default: '' },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date }
});

module.exports = mongoose.model('IssueReview', issueReviewSchema, 'issue_reviews');
