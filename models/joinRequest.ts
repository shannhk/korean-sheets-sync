import mongoose from 'mongoose';

const joinRequestSchema = new mongoose.Schema({
  telegramId: {
    type: String,
    required: true,
    unique: true
  },
  username: String,
  xLink: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

// Use the Korean-specific collection
const JoinRequest = mongoose.model('JoinRequest', joinRequestSchema, 'joinrequestskorea');

export default JoinRequest;