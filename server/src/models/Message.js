import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'audio', 'sticker', 'call_log'],
    default: 'text'
  },
  translatedText: {
    type: String
  },
  originalLanguage: {
    type: String
  },
  targetLanguage: {
    type: String
  },
  audioUrl: {
    type: String
  },
  stickerUrl: {
    type: String
  },
  imageUrl: {
    type: String
  },
  callDuration: {
    type: Number
  },
  callStatus: {
    type: String,
    enum: ['connected', 'missed', 'declined']
  },
  callType: {
    type: String,
    enum: ['audio', 'video']
  },
  reactions: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      emoji: {
        type: String,
        required: true
      }
    }
  ],
  isRead: {
    type: Boolean,
    default: false
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  deletedForUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isDeletedForEveryone: {
    type: Boolean,
    default: false
  },
  isViewOnce: {
    type: Boolean,
    default: false
  },
  viewOnceOpened: {
    type: Boolean,
    default: false
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  isForwarded: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Message = mongoose.model('Message', messageSchema);
export default Message;
