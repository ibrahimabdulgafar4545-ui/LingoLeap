import mongoose from 'mongoose';

const pronunciationAttemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  phrase: {
    type: String,
    required: true
  },
  transcript: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  fluencyScore: {
    type: Number,
    required: true
  },
  accuracyScore: {
    type: Number,
    required: true
  },
  tips: {
    type: [String]
  },
  mispronouncedWords: {
    type: [String]
  },
  audioUrl: {
    type: String // store base64 audio or url
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const PronunciationAttempt = mongoose.model('PronunciationAttempt', pronunciationAttemptSchema);
export default PronunciationAttempt;
