import mongoose from 'mongoose';

const aiPracticeSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scenario: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true
  },
  level: {
    type: String,
    default: 'Intermediate'
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'model'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  score: {
    fluency: { type: Number, default: 0 },
    grammar: { type: Number, default: 0 },
    vocabulary: { type: Number, default: 0 }
  },
  feedback: {
    suggestions: { type: String, default: '' },
    grammarMistakes: [{
      original: String,
      correction: String,
      explanation: String
    }],
    recommendedVocab: [{
      word: String,
      translation: String,
      example: String
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const AIPracticeSession = mongoose.model('AIPracticeSession', aiPracticeSessionSchema);
export default AIPracticeSession;
