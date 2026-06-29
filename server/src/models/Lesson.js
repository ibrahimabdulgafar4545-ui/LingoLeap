import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  prompt: {
    type: String,
    required: true
  },
  promptImage: {
    type: String
  },
  options: [{
    type: String
  }],
  imageOptions: [{
    type: String
  }],
  correctAnswer: {
    type: String,
    required: true
  },
  audioUrl: {
    type: String // Fallback standard TTS voice synthesis or sound files
  }
});

const wordSchema = new mongoose.Schema({
  picture: { type: String }, // emoji or URL
  targetWord: { type: String, required: true },
  pronunciation: { type: String },
  meaning: { type: String, required: true },
  exampleSentence: { type: String },
  audioUrl: { type: String }
});

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  language: {
    type: String,
    enum: ['English', 'French', 'Spanish', 'German', 'Arabic', 'Italian', 'Korean', 'Japanese'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  difficulty: {
    type: Number,
    required: true // e.g. 1, 2, 3...
  },
  order: {
    type: Number,
    required: true // Sequencing in the Skill tree / Learning path
  },
  xpReward: {
    type: Number,
    default: 15
  },
  unit: {
    type: Number,
    required: true
  },
  unitTitle: {
    type: String,
    required: true
  },
  questions: [questionSchema],
  words: [wordSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Lesson = mongoose.model('Lesson', lessonSchema);
export default Lesson;
