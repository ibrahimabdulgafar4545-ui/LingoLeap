import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['multiple-choice', 'fill-blank', 'translate', 'speak', 'listen', 'quiz', 'match'],
    required: true
  },
  prompt: {
    type: String,
    required: true
  },
  options: [{
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

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  language: {
    type: String,
    enum: ['English', 'French', 'Spanish', 'German', 'Arabic', 'Italian'],
    required: true
  },
  category: {
    type: String,
    enum: ['Vocabulary', 'Grammar', 'Reading', 'Listening', 'Speaking', 'Translation', 'Quiz'],
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Lesson = mongoose.model('Lesson', lessonSchema);
export default Lesson;
