import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide an announcement title'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Please provide the announcement content']
  },
  type: {
    type: String,
    enum: ['update', 'maintenance', 'feature', 'event', 'reward', 'competition'],
    default: 'update'
  },
  sender: {
    type: String,
    default: 'LingoLeap Organization'
  },
  targetGroup: {
    type: String,
    enum: ['all', 'selected'],
    default: 'all'
  },
  targetUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['sent', 'scheduled'],
    default: 'sent'
  },
  scheduledFor: {
    type: Date,
    default: null
  },
  viewsCount: {
    type: Number,
    default: 0
  },
  clicksCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Announcement = mongoose.model('Announcement', announcementSchema);
export default Announcement;
