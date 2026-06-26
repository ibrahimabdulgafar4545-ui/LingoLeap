import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { chatService } from '../services/chatService';
import api from '../services/api';
import AppLayout from '../components/common/AppLayout';
import toast from 'react-hot-toast';
import {
  Search, Send, Trash2, Phone, Video, Mic, Check, CheckCheck,
  ArrowLeft, Lock, ShieldAlert, Sparkles, MessageSquare, Clock, X,
  PhoneCall, UserCheck, MessageCircle, AlertCircle, MicOff, VideoOff, Smile,
  RotateCcw, Maximize2, Minimize2, Languages, BookOpen, Globe,
  Edit2, Trash, XCircle
} from 'lucide-react';

const langFlags = {
  Spanish: '🇪🇸', French: '🇫🇷', English: '🇬🇧',
  German: '🇩🇪', Arabic: '🇸🇦', Italian: '🇮🇹'
};

const STICKERS = {
  owl_happy: {
    name: 'Happy Owl',
    svg: (className) => (
      <svg className={className} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="45" fill="#58CC02" />
        <circle cx="35" cy="40" r="12" fill="white" />
        <circle cx="65" cy="40" r="12" fill="white" />
        <circle cx="35" cy="40" r="5" fill="black" />
        <circle cx="65" cy="40" r="5" fill="black" />
        <polygon points="50,45 44,55 56,55" fill="#FFC800" />
        <path d="M 30,70 Q 50,85 70,70" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" />
      </svg>
    )
  },
  owl_study: {
    name: 'Studying Owl',
    svg: (className) => (
      <svg className={className} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="45" fill="#1CB0F6" />
        <circle cx="35" cy="45" r="12" fill="white" />
        <circle cx="65" cy="45" r="12" fill="white" />
        <circle cx="35" cy="45" r="5" fill="black" />
        <circle cx="65" cy="45" r="5" fill="black" />
        <polygon points="50,50 44,60 56,60" fill="#FFC800" />
        <rect x="35" y="70" width="30" height="20" rx="3" fill="#FF9600" />
        <line x1="50" y1="70" x2="50" y2="90" stroke="white" strokeWidth="2" />
      </svg>
    )
  },
  trophy_level_up: {
    name: 'Gold Trophy',
    svg: (className) => (
      <svg className={className} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="45" fill="#FFC800" />
        <path d="M 35,30 H 65 V 50 Q 65,65 50,65 Q 35,65 35,50 Z" fill="#FF9600" />
        <rect x="45" y="65" width="10" height="15" fill="#E68500" />
        <ellipse cx="50" cy="80" rx="20" ry="6" fill="#E68500" />
        <polygon points="50,37 53,44 60,45 55,50 56,57 50,53 44,57 45,50 40,45 47,44" fill="white" />
      </svg>
    )
  },
  flame_streak: {
    name: 'Streak Fire',
    svg: (className) => (
      <svg className={className} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="45" fill="#FF4B4B" />
        <path d="M 50,18 C 65,35 75,55 70,72 C 65,85 35,85 30,72 C 25,55 35,35 50,18 Z" fill="#FF9600" />
        <path d="M 50,38 C 58,48 65,62 60,72 C 55,80 45,80 40,72 C 35,62 42,48 50,38 Z" fill="#FFC800" />
      </svg>
    )
  },
  flag_champion: {
    name: 'Language Flag',
    svg: (className) => (
      <svg className={className} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="45" fill="#A55EEA" />
        <rect x="30" y="25" width="8" height="55" rx="3" fill="#D1D8E0" />
        <path d="M 38,28 H 70 L 63,40 L 70,52 H 38 Z" fill="#FFD200" />
        <circle cx="54" cy="40" r="5" fill="white" />
      </svg>
    )
  },
  robot_smart: {
    name: 'Smart Robot',
    svg: (className) => (
      <svg className={className} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="45" fill="#2bcbba" />
        <rect x="30" y="35" width="40" height="30" rx="6" fill="#F1F2F6" />
        <rect x="35" y="42" width="10" height="10" rx="3" fill="#58CC02" />
        <rect x="55" y="42" width="10" height="10" rx="3" fill="#58CC02" />
        <rect x="42" y="58" width="16" height="4" rx="2" fill="#747D8C" />
        <line x1="50" y1="35" x2="50" y2="25" stroke="#747D8C" strokeWidth="4" strokeLinecap="round" />
        <circle cx="50" cy="23" r="4" fill="#FF4B4B" />
      </svg>
    )
  },
  owl_sad: {
    name: 'Sad Owl',
    svg: (className) => (
      <svg className={className} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="45" fill="#A5B1C2" />
        <circle cx="35" cy="45" r="12" fill="white" />
        <circle cx="65" cy="45" r="12" fill="white" />
        <circle cx="35" cy="47" r="5" fill="black" />
        <circle cx="65" cy="47" r="5" fill="black" />
        <path d="M 33,33 Q 38,36 43,33" stroke="#4B5563" strokeWidth="3" fill="none" />
        <path d="M 67,33 Q 62,36 57,33" stroke="#4B5563" strokeWidth="3" fill="none" />
        <polygon points="50,52 44,60 56,60" fill="#FFC800" />
        <path d="M 40,78 Q 50,70 60,78" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" />
      </svg>
    )
  },
  crown_master: {
    name: 'Crown Master',
    svg: (className) => (
      <svg className={className} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="45" fill="#F1C40F" />
        <path d="M 25,70 L 20,35 L 38,50 L 50,30 L 62,50 L 80,35 L 75,70 Z" fill="#E67E22" />
        <ellipse cx="50" cy="72" rx="25" ry="5" fill="#D35400" />
        <circle cx="20" cy="32" r="4" fill="#FF4B4B" />
        <circle cx="50" cy="27" r="4" fill="#FF4B4B" />
        <circle cx="80" cy="32" r="4" fill="#FF4B4B" />
      </svg>
    )
  },
  book_smart: {
    name: 'Book Smart',
    svg: (className) => (
      <svg className={className} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="45" fill="#4B7BEC" />
        <path d="M 20,70 Q 50,60 50,35 Q 50,60 80,70 V 35 Q 50,25 50,50 Q 50,25 20,35 Z" fill="white" />
        <line x1="50" y1="35" x2="50" y2="72" stroke="#2D98DA" strokeWidth="4" />
        <line x1="28" y1="45" x2="42" y2="42" stroke="#D1D8E0" strokeWidth="2" />
        <line x1="28" y1="53" x2="42" y2="50" stroke="#D1D8E0" strokeWidth="2" />
        <line x1="72" y1="45" x2="58" y2="42" stroke="#D1D8E0" strokeWidth="2" />
        <line x1="72" y1="53" x2="58" y2="50" stroke="#D1D8E0" strokeWidth="2" />
      </svg>
    )
  }
};

const VoiceMessagePlayer = ({ audioUrl }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = (e) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex items-center gap-3 bg-white/20 p-2.5 rounded-2xl border border-white/30 text-white min-w-[200px]" onClick={(e) => e.stopPropagation()}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" className="hidden" />
      <button
        type="button"
        onClick={togglePlay}
        className="w-9 h-9 rounded-full bg-white dark:bg-bg-card text-brand-blue flex items-center justify-center shadow hover:scale-105 active:scale-95 transition-all flex-shrink-0"
      >
        {isPlaying ? (
          <span className="flex gap-1 justify-center items-center">
            <span className="w-1.5 h-3.5 bg-brand-blue rounded-full"></span>
            <span className="w-1.5 h-3.5 bg-brand-blue rounded-full"></span>
          </span>
        ) : (
          <svg className="w-4 h-4 fill-current translate-x-0.5 text-brand-blue" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" fill="currentColor" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex gap-0.5 items-end h-5 mt-1 overflow-hidden">
          {Array.from({ length: 18 }).map((_, i) => {
            const seed = (i * 7) % 12 + 3;
            return (
              <span
                key={i}
                style={{ height: `${seed}px` }}
                className={`w-1 rounded-full transition-all duration-300 ${
                  (duration > 0 && currentTime / duration >= i / 18) ? 'bg-white dark:bg-bg-card' : 'bg-white/40'
                }`}
              />
            );
          })}
        </div>
        <div className="flex justify-between items-center text-[8px] font-bold text-white/80 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default function Chat() {
  const { user, socket, socketConnected } = useAuth();
  const targetLanguage = user?.targetLanguage || 'Spanish';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryUserId = searchParams.get('userId');

  // Conversations & Selection
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const [isViewOnce, setIsViewOnce] = useState(false);

  // Sockets & Activity
  const [isTyping, setIsTyping] = useState(false);
  const [friendIsTyping, setFriendIsTyping] = useState(false);
  const [onlineStatuses, setOnlineStatuses] = useState({}); // userId -> Boolean

  // Voice Note states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevels, setAudioLevels] = useState([10, 10, 10, 10, 10]);

  // Audio analyzer refs
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Call state
  const [activeCall, setActiveCall] = useState(null); // { type: 'audio' | 'video', role: 'caller' | 'recipient', user: otherUser, status: 'ringing' | 'connected', signalData }
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const callDurationRef = useRef(0);

  // Call Helper & Language Lab states
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showCallHelper, setShowCallHelper] = useState(false);
  const [localCaption, setLocalCaption] = useState('');
  const [remoteCaption, setRemoteCaption] = useState('');
  const [translateCaptions, setTranslateCaptions] = useState(false);
  const [translatedCaption, setTranslatedCaption] = useState('');
  const recognitionRef = useRef(null);

  // Call History states
  const [leftPanelTab, setLeftPanelTab] = useState('chats');
  const [callsHistory, setCallsHistory] = useState([]);
  const [loadingCalls, setLoadingCalls] = useState(false);

  const callHelpers = {
    Spanish: {
      vocab: [
        { word: "El micrófono", meaning: "The microphone" },
        { word: "La cámara", meaning: "The camera" },
        { word: "¿Me escuchas?", meaning: "Can you hear me?" },
        { word: "Videollamada", meaning: "Video call" },
        { word: "Se corta", meaning: "It is cutting out" }
      ],
      hints: [
        "Say 'Hola' to start greeting your partner.",
        "Ask '¿Cómo estás?' to check how they are.",
        "Say 'Te escucho bien' to confirm clear audio."
      ]
    },
    French: {
      vocab: [
        { word: "Le microphone", meaning: "The microphone" },
        { word: "La caméra", meaning: "The camera" },
        { word: "Tu m'entends?", meaning: "Can you hear me?" },
        { word: "Appel vidéo", meaning: "Video call" },
        { word: "Ça coupe", meaning: "It is cutting out" }
      ],
      hints: [
        "Say 'Bonjour' to start greeting your partner.",
        "Ask 'Comment ça va?' to check how they are.",
        "Say 'Je t'entends bien' to confirm clear audio."
      ]
    },
    German: {
      vocab: [
        { word: "Das Mikrofon", meaning: "The microphone" },
        { word: "Die Kamera", meaning: "The camera" },
        { word: "Hörst du mich?", meaning: "Can you hear me?" },
        { word: "Videoanruf", meaning: "Video call" },
        { word: "Es hackt", meaning: "It is cutting out" }
      ],
      hints: [
        "Say 'Hallo' to start greeting your partner.",
        "Ask 'Wie geht es dir?' to check how they are.",
        "Say 'Ich höre dich gut' to confirm clear audio."
      ]
    },
    Italian: {
      vocab: [
        { word: "Il microfono", meaning: "The microphone" },
        { word: "La fotocamera", meaning: "The camera" },
        { word: "Mi senti?", meaning: "Can you hear me?" },
        { word: "Videocall", meaning: "Video call" },
        { word: "Si interrompe", meaning: "It is cutting out" }
      ],
      hints: [
        "Say 'Ciao' to start greeting your partner.",
        "Ask 'Come stai?' to check how they are.",
        "Say 'Ti sento bene' to confirm clear audio."
      ]
    },
    Arabic: {
      vocab: [
        { word: "الميكروفون", meaning: "The microphone" },
        { word: "الكاميرا", meaning: "The camera" },
        { word: "هل تسمعني؟", meaning: "Can you hear me?" },
        { word: "مكالمة فيديو", meaning: "Video call" },
        { word: "الاتصال يقطع", meaning: "It is cutting out" }
      ],
      hints: [
        "Say 'مرحباً (Marhaban)' to greet your partner.",
        "Ask 'كيف حالك؟ (Kayfa haluk)' to check in.",
        "Say 'أسمعك جيداً' to confirm clear audio."
      ]
    },
    English: {
      vocab: [
        { word: "Microphone", meaning: "El micrófono" },
        { word: "Camera", meaning: "La cámara" },
        { word: "Can you hear me?", meaning: "¿Me escuchas?" },
        { word: "Video call", meaning: "Videollamada" },
        { word: "Breaking up", meaning: "Se corta" }
      ],
      hints: [
        "Say 'Hello' to greet your partner.",
        "Ask 'How are you?' to check in.",
        "Say 'I can hear you clearly' to confirm audio."
      ]
    }
  };

  const fetchCallsHistory = async () => {
    setLoadingCalls(true);
    try {
      const res = await api.get('/calls/history');
      if (res.data.success) {
        setCallsHistory(res.data.history);
      }
    } catch (err) {
      console.error('Error fetching call history:', err);
    } finally {
      setLoadingCalls(false);
    }
  };

  // Media Drawer state
  const [showMediaDrawer, setShowMediaDrawer] = useState(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState('emoji'); // 'emoji' | 'stickers'
  const [reactingMessageId, setReactingMessageId] = useState(null);

  // UI state
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showOriginal, setShowOriginal] = useState({}); // msgId -> boolean

  const toggleTranslation = (msgId) => {
    setShowOriginal(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  // Refs
  const messageEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);

  // Load conversations
  const loadConversations = async (selectUserId = null) => {
    try {
      const convList = await chatService.getConversations(searchQuery);
      setConversations(convList);

      // Keep online statuses updated
      const statuses = {};
      convList.forEach(c => {
        statuses[c.otherUser._id] = {
          isOnline: c.otherUser.isOnline,
          lastSeen: c.otherUser.lastSeen
        };
      });
      setOnlineStatuses(prev => ({ ...prev, ...statuses }));

      // If we need to select a conversation based on queryUserId
      if (selectUserId) {
        // Find existing conversation
        const existing = convList.find(c => c.otherUser._id === selectUserId);
        if (existing) {
          setSelectedConv(existing);
        } else {
          // Create conversation if friends
          try {
            const newConv = await chatService.createConversation(selectUserId);
            // Refresh list
            const updatedList = await chatService.getConversations('');
            setConversations(updatedList);
            const foundNew = updatedList.find(c => c._id === newConv._id);
            if (foundNew) setSelectedConv(foundNew);
          } catch (err) {
            toast.error(err.response?.data?.message || 'Could not start chat with this user.');
          }
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load chats');
    } finally {
      setLoadingConvs(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadConversations(queryUserId);
  }, [queryUserId, searchQuery]);

  // Load messages when conversation selection changes
  useEffect(() => {
    if (!selectedConv) return;
    
    const fetchHistory = async () => {
      setLoadingMessages(true);
      try {
        const history = await chatService.getMessages(selectedConv._id);
        setMessages(history);
        
        // Mark as read
        await chatService.markAsRead(selectedConv._id, selectedConv.otherUser._id);
        
        // Trigger socket to tell recipient we read their messages
        if (socket) {
          socket.emit('read_messages', {
            conversationId: selectedConv._id,
            otherUserId: selectedConv.otherUser._id
          });
        }

        // Subtract unread counts from local UI state
        setConversations(prev =>
          prev.map(c => (c._id === selectedConv._id ? { ...c, unreadCount: 0 } : c))
        );
      } catch (err) {
        toast.error('Failed to load message history');
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchHistory();
    setFriendIsTyping(false);
  }, [selectedConv, socket]);

  // Sockets listening hook
  useEffect(() => {
    if (!socket) return;

    // Listen to new messages
    socket.on('new_message', (message) => {
      // If we are currently looking at this conversation
      if (selectedConv && message.conversationId === selectedConv._id) {
        setMessages(prev => {
          if (prev.some(m => m._id === message._id)) return prev; // Avoid duplicates
          return [...prev, message];
        });

        // Trigger read receipt since we are actively viewing
        if (message.sender !== user._id) {
          chatService.markAsRead(selectedConv._id, selectedConv.otherUser._id);
          socket.emit('read_messages', {
            conversationId: selectedConv._id,
            otherUserId: selectedConv.otherUser._id
          });
        }
      } else {
        // Increment unread count locally
        setConversations(prev =>
          prev.map(c => {
            if (c._id === message.conversationId) {
              return {
                ...c,
                unreadCount: c.unreadCount + 1,
                lastMessage: message,
                updatedAt: message.createdAt
              };
            }
            return c;
          })
        );

        // Show toast notification
        if (message.sender !== user._id) {
          toast.success(`New message from user!`);
        }
      }

      // Re-sort conversation list
      setConversations(prev => {
        const list = [...prev];
        const idx = list.findIndex(c => c._id === message.conversationId);
        if (idx !== -1) {
          list[idx].lastMessage = message;
          list[idx].updatedAt = message.createdAt;
          list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        }
        return list;
      });
    });

    // Listen for read receipts
    socket.on('messages_read', ({ conversationId, readerId }) => {
      if (selectedConv && conversationId === selectedConv._id && readerId === selectedConv.otherUser._id) {
        setMessages(prev => prev.map(m => (m.sender === user._id ? { ...m, isRead: true } : m)));
      }
    });

    // Listen to message deletes
    socket.on('message_deleted', ({ messageId, conversationId }) => {
      if (selectedConv && conversationId === selectedConv._id) {
        setMessages(prev => prev.filter(m => m._id !== messageId));
      }
      
      // Update last message in sidebar
      loadConversations();
    });

    socket.on('message_deleted_for_everyone', ({ messageId, conversationId, message }) => {
      if (selectedConv && conversationId === selectedConv._id) {
        setMessages(prev => prev.map(m => m._id === messageId ? message : m));
      }
      loadConversations();
    });

    socket.on('message_edited', (editedMessage) => {
      if (selectedConv && editedMessage.conversationId === selectedConv._id) {
        setMessages(prev => prev.map(m => m._id === editedMessage._id ? editedMessage : m));
      }
    });

    socket.on('message_view_once_opened', ({ messageId, conversationId, message }) => {
      if (selectedConv && conversationId === selectedConv._id) {
        setMessages(prev => prev.map(m => m._id === messageId ? message : m));
      }
    });

    // Listen for typing indicators
    socket.on('typing', ({ conversationId, senderId, isTyping }) => {
      if (selectedConv && conversationId === selectedConv._id && senderId === selectedConv.otherUser._id) {
        setFriendIsTyping(isTyping);
      }
    });

    // Listen to presence updates
    socket.on('user_status', ({ userId, isOnline, lastSeen }) => {
      setOnlineStatuses(prev => ({
        ...prev,
        [userId]: { isOnline, lastSeen: lastSeen || new Date().toISOString() }
      }));
    });

    // Listen to message reactions
    socket.on('message_reaction', ({ messageId, conversationId, reactions }) => {
      if (selectedConv && conversationId === selectedConv._id) {
        setMessages(prev => prev.map(m => (m._id === messageId ? { ...m, reactions } : m)));
      }
    });

    // Listen for incoming call
    socket.on('incoming_call', ({ callerId, callerUsername, callerAvatarUrl, signalData, type }) => {
      console.log(`📞 Incoming call from ${callerUsername} (${type})`);
      // If already in a call, decline
      if (activeCall) {
        socket.emit('answer_call', { callerId, accepted: false });
        return;
      }
      setActiveCall({
        type,
        role: 'recipient',
        user: { _id: callerId, username: callerUsername, avatarUrl: callerAvatarUrl },
        status: 'ringing',
        signalData
      });
    });

    // Listen for call answer
    socket.on('call_answered', async ({ recipientId, signalData, accepted }) => {
      console.log(`📞 Call answer: accepted = ${accepted}`);
      if (!accepted) {
        toast.error('Call declined');
        if (activeCall && activeCall.role === 'caller') {
          socket.emit('log_call', {
            receiverId: activeCall.user._id,
            type: activeCall.type,
            status: 'declined',
            duration: 0
          });
        }
        endCallSession();
        return;
      }

      toast.success('Call connected!');
      setActiveCall(prev => (prev ? { ...prev, status: 'connected' } : null));

      if (signalData && peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signalData));
        } catch (err) {
          console.error('Error setting remote description:', err);
        }
      }
    });

    // Listen for WebRTC signals (ICE Candidates or SDP offer/answers)
    socket.on('webrtc_signal', async ({ senderId, signalData }) => {
      if (!peerConnectionRef.current) return;
      try {
        if (signalData.candidate) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(signalData.candidate));
        } else if (signalData.sdp || signalData.type) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signalData));
        }
      } catch (err) {
        console.error('Error handling WebRTC signaling data:', err);
      }
    });

    // Listen for incoming call caption
    socket.on('incoming_caption', ({ text }) => {
      setRemoteCaption(text);
    });

    // Listen for call ended
    socket.on('call_ended', () => {
      toast.success('Call ended');
      if (activeCall && activeCall.role === 'caller' && activeCall.status === 'connected') {
        socket.emit('log_call', {
          receiverId: activeCall.user._id,
          type: activeCall.type,
          status: 'connected',
          duration: callDurationRef.current
        });
      }
      endCallSession();
    });

    return () => {
      socket.off('new_message');
      socket.off('messages_read');
      socket.off('message_deleted');
      socket.off('message_deleted_for_everyone');
      socket.off('message_edited');
      socket.off('typing');
      socket.off('user_status');
      socket.off('message_reaction');
      socket.off('incoming_call');
      socket.off('call_answered');
      socket.off('webrtc_signal');
      socket.off('incoming_caption');
      socket.off('call_ended');
      socket.off('message_view_once_opened');
    };
  }, [socket, selectedConv, user, activeCall]);

  // Auto-scroll to latest message
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, friendIsTyping]);

  // Handle typing input
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!socket || !selectedConv) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', {
        conversationId: selectedConv._id,
        recipientId: selectedConv.otherUser._id,
        isTyping: true
      });
    }

    // Debounce typing end
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing', {
        conversationId: selectedConv._id,
        recipientId: selectedConv.otherUser._id,
        isTyping: false
      });
    }, 2000);
  };

  // Send message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConv) return;

    if (!socket || !socketConnected) {
      toast.error('Chat connection is offline. Trying to reconnect...');
      return;
    }

    // Stop typing timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setIsTyping(false);
    socket.emit('typing', {
      conversationId: selectedConv._id,
      recipientId: selectedConv.otherUser._id,
      isTyping: false
    });

    if (editingMessageId) {
      socket.emit('edit_message', {
        messageId: editingMessageId,
        conversationId: selectedConv._id,
        recipientId: selectedConv.otherUser._id,
        newText: inputText.trim()
      }, (response) => {
        if (response.success) {
          setInputText('');
          setEditingMessageId(null);
          toast.success('Message edited');
        } else {
          toast.error(response.error || 'Failed to edit message');
        }
      });
    } else {
      socket.emit('send_message', {
        conversationId: selectedConv._id,
        recipientId: selectedConv.otherUser._id,
        text: inputText.trim(),
        isViewOnce
      }, (response) => {
        if (response.success) {
          setInputText('');
          setIsViewOnce(false);
        } else {
          toast.error(response.error || 'Failed to send message');
        }
      });
    }
  };

  const handleOpenViewOnce = (messageId) => {
    if (!socket || !selectedConv) return;
    socket.emit('open_view_once', {
      messageId,
      conversationId: selectedConv._id,
      recipientId: selectedConv.otherUser._id
    });
  };

  const handleEditMessage = (msg) => {
    setEditingMessageId(msg._id);
    setInputText(msg.text);
    setDeletingMessageId(null);
  };

  const handleDeleteForMe = (messageId) => {
    if (!socket || !selectedConv) return;
    socket.emit('delete_message_for_me', {
      messageId,
      conversationId: selectedConv._id
    }, (response) => {
      if (response.success) {
        setMessages(prev => prev.filter(m => m._id !== messageId));
        toast.success('Deleted for you');
      } else {
        toast.error(response.error || 'Failed to delete message');
      }
    });
    setDeletingMessageId(null);
  };

  const handleDeleteForEveryone = (messageId) => {
    if (!socket || !selectedConv) return;
    socket.emit('delete_message_for_everyone', {
      messageId,
      conversationId: selectedConv._id,
      recipientId: selectedConv.otherUser._id
    }, (response) => {
      if (response.success) {
        toast.success('Deleted for everyone');
      } else {
        toast.error(response.error || 'Failed to delete message');
      }
    });
    setDeletingMessageId(null);
  };

  // React to message with emoji
  const handleReactMessage = (messageId, emoji) => {
    if (!socket || !selectedConv) return;

    socket.emit('react_message', {
      messageId,
      conversationId: selectedConv._id,
      recipientId: selectedConv.otherUser._id,
      emoji
    }, (response) => {
      if (response.success) {
        setMessages(prev => prev.map(m => (m._id === messageId ? { ...m, reactions: response.reactions } : m)));
      } else {
        toast.error(response.error || 'Failed to add reaction');
      }
    });
  };

  // Format last seen presence string
  const formatLastSeen = (lastSeenTime) => {
    if (!lastSeenTime) return 'Offline';
    const date = new Date(lastSeenTime);
    const now = new Date();

    if (isNaN(date.getTime())) return 'Offline';

    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));

    if (diffMins < 1) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  // WebRTC Call Controls & Setup
  const startCall = async (type) => {
    if (!selectedConv) return;
    const otherUser = selectedConv.otherUser;

    setActiveCall({
      type,
      role: 'caller',
      user: otherUser,
      status: 'ringing'
    });

    try {
      const constraints = {
        audio: true,
        video: type === 'video'
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerConnectionRef.current = pc;

      // Add tracks to connection
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('webrtc_signal', {
            recipientId: otherUser._id,
            signalData: { candidate: event.candidate }
          });
        }
      };

      // Handle remote tracks addition
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        }
      };

      // Create local SDP offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('call_user', {
        recipientId: otherUser._id,
        signalData: offer,
        type
      });

      // Bind stream to local video element immediately
      setTimeout(() => {
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      }, 500);

    } catch (err) {
      console.error('Call media access error:', err);
      toast.error('Camera/Microphone permission denied. Starting audio simulation.');
      // Graceful fallback to loopback stream simulation
      setActiveCall({
        type,
        role: 'caller',
        user: otherUser,
        status: 'ringing'
      });
      setTimeout(() => {
        setActiveCall(prev => (prev ? { ...prev, status: 'connected' } : null));
        toast.success('Connected (Simulated Local Feed)');
      }, 2500);
    }
  };

  const acceptCall = async () => {
    if (!activeCall || !activeCall.signalData) return;

    try {
      const constraints = {
        audio: true,
        video: activeCall.type === 'video'
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerConnectionRef.current = pc;

      // Add tracks
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('webrtc_signal', {
            recipientId: activeCall.user._id,
            signalData: { candidate: event.candidate }
          });
        }
      };

      // Handle remote tracks
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        }
      };

      // Set remote offer SDP
      await pc.setRemoteDescription(new RTCSessionDescription(activeCall.signalData));

      // Create SDP answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Send SDP answer
      socket.emit('answer_call', {
        callerId: activeCall.user._id,
        signalData: answer,
        accepted: true
      });

      setActiveCall(prev => ({ ...prev, status: 'connected' }));
      toast.success('Connected to call!');

      setTimeout(() => {
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      }, 500);

    } catch (err) {
      console.error('Accept call media error:', err);
      toast.error('Accept call failed. Fallback connected.');
      // Fallback response accepting call without hardware feeds
      socket.emit('answer_call', {
        callerId: activeCall.user._id,
        accepted: true
      });
      setActiveCall(prev => ({ ...prev, status: 'connected' }));
    }
  };

  const declineCall = () => {
    if (activeCall && socket) {
      socket.emit('answer_call', {
        callerId: activeCall.user._id,
        accepted: false
      });
    }
    endCallSession();
  };

  const endCallSession = () => {
    if (activeCall && socket) {
      socket.emit('end_call', { otherUserId: activeCall.user._id });

      // Caller emits log_call to log details in history database
      if (activeCall.role === 'caller') {
        const duration = callDurationRef.current;
        const status = activeCall.status === 'connected' ? 'connected' : 'missed';
        socket.emit('log_call', {
          receiverId: activeCall.user._id,
          type: activeCall.type,
          status,
          duration
        });
      }
    }

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    setLocalStream(null);
    setRemoteStream(null);

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Terminate speech recognition if running
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setLocalCaption('');
    setRemoteCaption('');
    setTranslatedCaption('');

    setActiveCall(null);
    setIsFullScreen(false);
    setShowCallHelper(false);
  };

  // Call ringing timeout handler (30 seconds)
  useEffect(() => {
    let ringingTimeout;
    if (activeCall && activeCall.status === 'ringing' && activeCall.role === 'caller') {
      ringingTimeout = setTimeout(() => {
        toast.error('No answer');
        socket.emit('log_call', {
          receiverId: activeCall.user._id,
          type: activeCall.type,
          status: 'missed',
          duration: 0
        });
        endCallSession();
      }, 30000);
    }
    return () => {
      if (ringingTimeout) clearTimeout(ringingTimeout);
    };
  }, [activeCall?.status]);

  // Call timer effect using mutable ref for stale closures
  useEffect(() => {
    let timer;
    if (activeCall && activeCall.status === 'connected') {
      setCallDuration(0);
      callDurationRef.current = 0;
      timer = setInterval(() => {
        setCallDuration(prev => {
          const next = prev + 1;
          callDurationRef.current = next;
          return next;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeCall?.status]);

  // Real-time speech recognition effect for captions
  useEffect(() => {
    if (activeCall && activeCall.status === 'connected') {
      const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechClass) {
        try {
          const rec = new SpeechClass();
          rec.continuous = true;
          rec.interimResults = true;
          
          let langCode = 'es-ES';
          if (targetLanguage === 'French') langCode = 'fr-FR';
          else if (targetLanguage === 'German') langCode = 'de-DE';
          else if (targetLanguage === 'Italian') langCode = 'it-IT';
          else if (targetLanguage === 'English') langCode = 'en-US';
          else if (targetLanguage === 'Arabic') langCode = 'ar-SA';
          
          rec.lang = langCode;

          rec.onresult = (event) => {
            const result = event.results[event.results.length - 1];
            if (result) {
              const transcript = result[0].transcript;
              setLocalCaption(transcript);
              
              if (socket && activeCall.user) {
                socket.emit('call_caption', {
                  recipientId: activeCall.user._id,
                  text: transcript
                });
              }
            }
          };

          rec.onerror = (err) => {
            // 'no-speech' error occurs naturally when the mic is open but no one is speaking; ignore it.
            if (err.error === 'no-speech') return;
            console.error('Speech recognition call error:', err.error || err);
          };

          rec.onend = () => {
            if (activeCall && activeCall.status === 'connected' && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {}
            }
          };

          recognitionRef.current = rec;
          rec.start();
        } catch (e) {
          console.error('Speech recognition failed to init:', e);
        }
      }
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
        recognitionRef.current = null;
      }
    }
  }, [activeCall?.status]);

  // Translation of incoming subtitle captions
  useEffect(() => {
    if (remoteCaption && translateCaptions) {
      const runTranslation = async () => {
        try {
          const res = await api.post('/ai/chat', {
            scenario: 'general',
            language: targetLanguage,
            level: 'Intermediate',
            messages: [
              { role: 'user', content: `Translate this sentence to English: "${remoteCaption}". Reply with ONLY the English translation and nothing else.` }
            ]
          });
          if (res.data && res.data.reply) {
            setTranslatedCaption(res.data.reply);
          } else {
            setTranslatedCaption(`[Translated] ${remoteCaption}`);
          }
        } catch (err) {
          setTranslatedCaption(`[Translated] ${remoteCaption}`);
        }
      };
      runTranslation();
    } else {
      setTranslatedCaption('');
    }
  }, [remoteCaption, translateCaptions]);

  const formatCallDuration = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Voice Note MediaRecorder Recording Controls
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result;
          sendAudioMessage(base64Audio);
        };
      };

      // Set up Audio Context and Analyser for real-time visualization
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        try {
          const audioCtx = new AudioCtxClass();
          const analyser = audioCtx.createAnalyser();
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);
          analyser.fftSize = 32;
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          audioContextRef.current = audioCtx;
          analyserRef.current = analyser;

          const updateLevels = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            
            // Map frequencies to 5 amplitude values between 15% and 100% height
            const levels = [];
            const step = Math.max(1, Math.floor(bufferLength / 5));
            for (let i = 0; i < 5; i++) {
              const val = dataArray[i * step] || 0;
              const pct = Math.max(15, Math.min(100, Math.round((val / 255) * 100)));
              levels.push(pct);
            }
            setAudioLevels(levels);
            animationFrameRef.current = requestAnimationFrame(updateLevels);
          };

          animationFrameRef.current = requestAnimationFrame(updateLevels);
        } catch (audioErr) {
          console.error('Failed to initialize Web Audio Analyser:', audioErr);
        }
      }

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      
      toast.success('🎙️ Voice Note recording started...');
    } catch (err) {
      console.error(err);
      toast.error('Microphone access denied. Please verify your system permissions.');
    }
  };

  const stopRecording = (shouldSend = true) => {
    if (!mediaRecorderRef.current) return;
    
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {
        console.error('Error closing AudioContext:', e);
      }
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevels([10, 10, 10, 10, 10]);
    
    const stream = mediaRecorderRef.current.stream;
    stream.getTracks().forEach(track => track.stop());

    if (shouldSend) {
      mediaRecorderRef.current.stop();
    } else {
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
      setIsRecording(false);
      toast.error('Voice Note recording cancelled.');
    }
  };

  const sendAudioMessage = (base64Audio) => {
    if (!selectedConv) return;
    
    socket.emit('send_message', {
      conversationId: selectedConv._id,
      recipientId: selectedConv.otherUser._id,
      text: '[Voice Note]',
      messageType: 'audio',
      audioUrl: base64Audio
    }, (response) => {
      if (response.success) {
        setIsRecording(false);
        toast.success('🎙️ Voice Note sent successfully!');
      } else {
        toast.error(response.error || 'Failed to send Voice Note');
        setIsRecording(false);
      }
    });
  };

  // Sticker Message trigger
  const sendStickerMessage = (stickerId) => {
    if (!selectedConv || !socket) return;
    
    socket.emit('send_message', {
      conversationId: selectedConv._id,
      recipientId: selectedConv.otherUser._id,
      text: '[Sticker]',
      messageType: 'sticker',
      stickerUrl: stickerId
    }, (response) => {
      if (response.success) {
        setShowMediaDrawer(false);
        toast.success('🎉 Sticker sent!');
      } else {
        toast.error(response.error || 'Failed to send Sticker');
      }
    });
  };

  return (
    <AppLayout noPadding={true}>
      <div className="w-full max-w-6xl mx-auto p-0 md:px-4 md:py-6 h-[calc(100dvh-64px-58px)] md:h-[750px] flex flex-col">
        <div className="bg-white dark:bg-bg-card md:rounded-[2rem] border-0 md:border-4 border-border overflow-hidden md:shadow-2xl flex flex-col md:flex-row h-full w-full relative">
          
          {/* LEFT SIDEBAR: Conversations List */}
          <div className={`w-full md:w-80 border-r-4 border-border flex flex-col h-full bg-bg-main/30 dark:bg-bg-main/5 ${selectedConv ? 'hidden md:flex' : 'flex'}`}>
            
            {/* Search Box */}
            <div className="p-4 border-b-2 border-border bg-white dark:bg-bg-card">
              <h2 className="text-xl font-black text-text-main mb-3 flex items-center justify-between w-full">
                <span className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-brand-blue" />
                  Conversations
                </span>
                <span className="flex items-center gap-1.5" title={socketConnected ? "Chat connected" : "Chat offline"}>
                  <span className={`w-2.5 h-2.5 rounded-full ${socketConnected ? 'bg-brand-green' : 'bg-brand-red animate-pulse'}`} />
                  <span className="text-[10px] font-bold text-text-secondary">{socketConnected ? 'Live' : 'Offline'}</span>
                </span>
              </h2>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary/55 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  className="w-full pl-9 pr-4 py-2.5 bg-bg-main/30 dark:bg-bg-main/10 border-2 border-border dark:border-border/50 rounded-2xl outline-none font-bold text-xs focus:border-brand-blue transition-all text-text-main"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Sidebar tab selector */}
            <div className="flex gap-2 p-3.5 border-b-2 border-border shrink-0 bg-white dark:bg-bg-card">
              <button
                type="button"
                onClick={() => setLeftPanelTab('chats')}
                className={`flex-1 py-2 rounded-2xl font-black text-[10px] tracking-wider uppercase transition-all ${
                  leftPanelTab === 'chats'
                    ? 'bg-brand-blue text-white shadow-3d-blue'
                    : 'bg-brand-light text-brand-dark/60 hover:text-text-main'
                }`}
              >
                Chats
              </button>
              <button
                type="button"
                onClick={() => {
                  setLeftPanelTab('calls');
                  fetchCallsHistory();
                }}
                className={`flex-1 py-2 rounded-2xl font-black text-[10px] tracking-wider uppercase transition-all ${
                  leftPanelTab === 'calls'
                    ? 'bg-brand-blue text-white shadow-3d-blue'
                    : 'bg-brand-light text-brand-dark/60 hover:text-text-main'
                }`}
              >
                Calls
              </button>
            </div>

            {/* Content Sidebar */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
              {leftPanelTab === 'chats' ? (
                loadingConvs ? (
                  <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-brand-blue border-t-transparent"></div>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-12 px-4 text-brand-dark/50">
                    <MessageCircle className="w-10 h-10 mx-auto mb-2 text-brand-dark/25" />
                    <p className="text-xs font-bold">No active conversations.</p>
                    <p className="text-[10px] text-brand-dark/40 mt-1">Start a chat via the Friends menu!</p>
                  </div>
                ) : (
                  conversations.map((conv) => {
                    const status = onlineStatuses[conv.otherUser._id];
                    const isOnline = status ? (typeof status === 'object' ? status.isOnline : status) : conv.otherUser.isOnline;
                    const isSelected = selectedConv && selectedConv._id === conv._id;
                    
                    return (
                      <div
                        key={conv._id}
                        onClick={() => setSelectedConv(conv)}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer flex gap-3 items-center hover:bg-white dark:bg-bg-card hover:border-brand-blue/30 transition-all ${
                          isSelected
                            ? 'bg-white dark:bg-bg-card border-brand-blue shadow-3d-blue'
                            : 'bg-transparent border-transparent'
                        }`}
                      >
                        {/* Avatar with Status indicator */}
                        <div className="relative flex-shrink-0">
                          <img
                            src={conv.otherUser.avatarUrl}
                            alt={conv.otherUser.username}
                            className="w-12 h-12 rounded-xl border border-border dark:border-border"
                          />
                          <div
                            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                              isOnline ? 'bg-brand-green' : 'bg-brand-gray'
                            }`}
                          />
                        </div>

                        {/* Snippet */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <h4 className="font-extrabold text-sm text-text-main truncate flex items-center gap-1">
                              {conv.otherUser.username}
                              <span>{langFlags[conv.otherUser.targetLanguage] || '🌐'}</span>
                            </h4>
                            {conv.lastMessage && (
                              <span className="text-[9px] font-bold text-brand-dark/40 flex-shrink-0">
                                {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-brand-dark/50 truncate mt-1">
                            {conv.lastMessage ? conv.lastMessage.text : 'Start chatting!'}
                          </p>
                        </div>

                        {/* Badges & Lock */}
                        <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
                          {conv.isLocked && (
                            <Lock className="w-3.5 h-3.5 text-brand-orange" title="Chat locked" />
                          )}
                          {conv.unreadCount > 0 && (
                            <span className="bg-brand-red text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )
              ) : (
                loadingCalls ? (
                  <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-brand-blue border-t-transparent"></div>
                  </div>
                ) : callsHistory.length === 0 ? (
                  <div className="text-center py-12 px-4 text-brand-dark/50">
                    <PhoneCall className="w-10 h-10 mx-auto mb-2 text-brand-dark/25 animate-pulse" />
                    <p className="text-xs font-bold">No call history logs.</p>
                    <p className="text-[10px] text-brand-dark/40 mt-1">Directly call friends on Chat views!</p>
                  </div>
                ) : (
                  callsHistory.map((call) => {
                    const isCaller = call.caller._id === user._id || call.caller === user._id;
                    const targetUser = isCaller ? call.receiver : call.caller;
                    if (!targetUser) return null;
                    
                    return (
                      <div
                        key={call._id}
                        className="p-3 bg-white dark:bg-bg-card rounded-2xl border-2 border-border dark:border-border flex gap-3 items-center hover:border-brand-blue/20 transition-all justify-between"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={targetUser.avatarUrl}
                            alt={targetUser.username}
                            className="w-10 h-10 rounded-xl border border-border dark:border-border"
                          />
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-xs text-text-main truncate">{targetUser.username}</h4>
                            <div className="flex items-center gap-1 mt-0.5">
                              {call.type === 'audio' ? (
                                <Phone className="w-3 h-3 text-brand-blue" />
                              ) : (
                                <Video className="w-3 h-3 text-brand-blue" />
                              )}
                              <span className={`text-[9px] font-black uppercase tracking-wider ${
                                call.status === 'missed' 
                                  ? 'text-brand-red' 
                                  : call.status === 'declined' 
                                    ? 'text-brand-orange' 
                                    : 'text-brand-green'
                              }`}>
                                {call.status === 'missed' 
                                  ? 'Missed' 
                                  : call.status === 'declined' 
                                    ? 'Declined' 
                                    : `Connected (${formatCallDuration(call.duration)})`}
                              </span>
                            </div>
                            <p className="text-[8px] font-black text-brand-dark/40 mt-0.5">
                              {new Date(call.createdAt).toLocaleDateString()} {new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => {
                            const matchedConv = conversations.find(c => c.otherUser._id === targetUser._id);
                            if (matchedConv) {
                              setSelectedConv(matchedConv);
                            }
                            startCall(call.type);
                          }}
                          className="p-2 bg-brand-blue/10 hover:bg-brand-blue/25 text-brand-blue rounded-xl transition-colors"
                          title={`Call back ${targetUser.username}`}
                        >
                          <PhoneCall className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })
                )
              )}
            </div>
          </div>

          {/* RIGHT VIEWPORT: Chat Box */}
          <div className={`flex-1 flex flex-col h-full bg-bg-main/30 dark:bg-bg-main/5 ${!selectedConv ? 'hidden md:flex' : 'flex'}`}>
            
            {selectedConv ? (
              <>
                {/* Header info */}
                <div className="p-4 bg-white dark:bg-bg-card border-b-2 border-border flex justify-between items-center">
                  
                  {/* Left elements: back, avatar, names */}
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => setSelectedConv(null)}
                      className="md:hidden p-1.5 hover:bg-bg-main dark:hover:bg-bg-main/10 rounded-xl text-text-main"
                    >
                      <ArrowLeft className="w-5 h-5 text-text-main" />
                    </button>

                    <div className="relative flex-shrink-0">
                      <img
                        src={selectedConv.otherUser.avatarUrl}
                        alt={selectedConv.otherUser.username}
                        className="w-12 h-12 rounded-xl bg-brand-light border border-border dark:border-border"
                      />
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                          (() => {
                            const status = onlineStatuses[selectedConv.otherUser._id];
                            const isOnline = status ? (typeof status === 'object' ? status.isOnline : status) : selectedConv.otherUser.isOnline;
                            return isOnline ? 'bg-brand-green' : 'bg-brand-gray';
                          })()
                        }`}
                      />
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-extrabold text-text-main flex items-center gap-1.5">
                        {selectedConv.otherUser.username}
                        <span title={`Learning ${selectedConv.otherUser.targetLanguage}`} className="text-sm">
                          {langFlags[selectedConv.otherUser.targetLanguage] || '🌐'}
                        </span>
                      </h3>
                      <span className="text-[10px] font-bold text-brand-dark/45 block">
                        {(() => {
                          const status = onlineStatuses[selectedConv.otherUser._id];
                          const isOnline = status ? (typeof status === 'object' ? status.isOnline : status) : selectedConv.otherUser.isOnline;
                          const lastSeen = status && typeof status === 'object' ? status.lastSeen : selectedConv.otherUser.lastSeen;
                          return isOnline ? (
                            <span className="text-brand-green">Online</span>
                          ) : (
                            <span>Last seen {formatLastSeen(lastSeen)}</span>
                          );
                        })()}
                      </span>
                    </div>
                  </div>

                  {/* Right elements: Live WebRTC Calls */}
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      disabled={selectedConv.isLocked}
                      onClick={() => startCall('audio')}
                      className={`p-2.5 rounded-xl border-2 shadow-3d-card transition-all ${
                        selectedConv.isLocked
                          ? 'border-brand-gray text-brand-dark/25 cursor-not-allowed bg-brand-light'
                          : 'border-brand-blue/30 text-brand-blue hover:bg-brand-blue/5 hover:-translate-y-0.5'
                      }`}
                      title={selectedConv.isLocked ? "Unlock chat by becoming friends first!" : "Start Audio Call"}
                    >
                      <Phone className="w-4.5 h-4.5" />
                    </button>
                    <button
                      disabled={selectedConv.isLocked}
                      onClick={() => startCall('video')}
                      className={`p-2.5 rounded-xl border-2 shadow-3d-card transition-all ${
                        selectedConv.isLocked
                          ? 'border-brand-gray text-brand-dark/25 cursor-not-allowed bg-brand-light'
                          : 'border-brand-blue/30 text-brand-blue hover:bg-brand-blue/5 hover:-translate-y-0.5'
                      }`}
                      title={selectedConv.isLocked ? "Unlock chat by becoming friends first!" : "Start Video Call"}
                    >
                      <Video className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>

                {/* Locked System Indicator */}
                {selectedConv.isLocked && (
                  <div className="bg-brand-orange/15 border-b-2 border-brand-orange/30 p-3 text-center flex items-center justify-center gap-2 text-xs font-extrabold text-brand-orange">
                    <AlertCircle className="w-4.5 h-4.5" />
                    <span>Chat is locked. Both of you must accept friend requests to exchange messages or call.</span>
                  </div>
                )}

                {/* Message display area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-brand-light/10 custom-scrollbar">
                  {loadingMessages ? (
                    <div className="flex justify-center items-center py-20">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-brand-blue border-t-transparent"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-20 text-brand-dark/45 max-w-sm mx-auto">
                      <MessageSquare className="w-12 h-12 text-brand-dark/20 mx-auto mb-3" />
                      <p className="font-extrabold">Send a Greeting!</p>
                      <p className="text-[11px] mt-0.5">Write your first message to begin your conversation.</p>
                    </div>
                  ) : (
                    messages.filter(msg => !msg.deletedForUsers?.includes(user._id)).map((msg) => {
                      const isMe = msg.sender === user._id;
                      return (
                        <div
                          key={msg._id}
                          className={`flex group ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className="flex items-end gap-1.5 max-w-[70%]">
                            
                            {/* Hover actions bar: react and delete */}
                            <div className={`opacity-0 group-hover:opacity-100 flex gap-0.5 items-center transition-all self-center ${isMe ? 'mr-1' : 'ml-1 order-last'}`}>
                              {/* Emoji React Button */}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setReactingMessageId(reactingMessageId === msg._id ? null : msg._id)}
                                  className="p-1 text-brand-dark/40 hover:text-brand-blue rounded-lg transition-all"
                                  title="React with Emoji"
                                >
                                  <Smile className="w-4 h-4" />
                                </button>
                                
                                {reactingMessageId === msg._id && (
                                  <div className="absolute bottom-full mb-1 z-50 bg-white dark:bg-bg-card border border-border dark:border-border shadow-xl rounded-full px-2 py-1 flex gap-1.5 animate-scale-up">
                                    {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                                      <button
                                        type="button"
                                        key={emoji}
                                        onClick={() => {
                                          handleReactMessage(msg._id, emoji);
                                          setReactingMessageId(null);
                                        }}
                                        className="hover:scale-130 transition-transform p-0.5 text-base select-none"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Delete message button */}
                              {isMe && !msg.isDeletedForEveryone && (
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => setDeletingMessageId(deletingMessageId === msg._id ? null : msg._id)}
                                    className="p-1 text-brand-dark/40 hover:text-brand-red rounded-lg transition-all"
                                    title="Message Options"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                  
                                  {deletingMessageId === msg._id && (
                                    <div className="absolute bottom-full mb-1 right-0 z-50 bg-white dark:bg-bg-card border border-border dark:border-border shadow-xl rounded-xl py-1 w-44 animate-scale-up text-xs font-bold flex flex-col overflow-hidden">
                                      {msg.messageType !== 'audio' && msg.messageType !== 'sticker' && msg.messageType !== 'call_log' && (
                                        <button 
                                          type="button" 
                                          onClick={() => handleEditMessage(msg)}
                                          className="w-full text-left px-3 py-2 hover:bg-brand-light flex items-center gap-2 text-text-main"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" /> Edit Message
                                        </button>
                                      )}
                                      <button 
                                        type="button" 
                                        onClick={() => handleDeleteForMe(msg._id)}
                                        className="w-full text-left px-3 py-2 hover:bg-brand-light flex items-center gap-2 text-text-main"
                                      >
                                        <Trash className="w-3.5 h-3.5" /> Delete for me
                                      </button>
                                      <button 
                                        type="button" 
                                        onClick={() => handleDeleteForEveryone(msg._id)}
                                        className="w-full text-left px-3 py-2 hover:bg-brand-red/10 flex items-center gap-2 text-brand-red"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" /> Delete for everyone
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            <div
                              className={`p-3.5 rounded-3xl shadow-sm text-sm border-2 ${
                                msg.messageType === 'sticker'
                                  ? 'bg-transparent border-transparent shadow-none p-1'
                                  : isMe
                                  ? 'bg-brand-blue text-white rounded-br-none border-brand-blue/30 shadow-3d-blue'
                                  : 'bg-white dark:bg-bg-card text-text-main rounded-bl-none border-border dark:border-border shadow-3d-card'
                              }`}
                            >
                              {msg.messageType === 'audio' ? (
                                <div className="flex flex-col gap-2">
                                  <VoiceMessagePlayer audioUrl={msg.audioUrl} />
                                  {msg.text && msg.text !== '[Voice Note]' && (
                                    <div className="bg-black/15 rounded-2xl p-3 mt-1.5 border border-white/10 text-white">
                                      <div className="mb-2">
                                        <span className="text-[9px] uppercase tracking-widest font-black text-white/50 block mb-0.5">Original Transcript</span>
                                        <p className="whitespace-pre-wrap break-words text-xs font-bold leading-relaxed">{msg.text}</p>
                                      </div>
                                      {msg.translatedText && (
                                        <div className="border-t border-white/10 pt-2">
                                          <span className="text-[9px] uppercase tracking-widest font-black text-white/50 block mb-0.5">Translation</span>
                                          <p className="whitespace-pre-wrap break-words text-xs font-bold leading-relaxed italic text-white/95">{msg.translatedText}</p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : msg.messageType === 'sticker' ? (
                                (() => {
                                  const sticker = STICKERS[msg.stickerUrl];
                                  if (sticker) {
                                    return (
                                      <div className="w-24 h-24 p-1 flex justify-center items-center bg-white/10 rounded-2xl border border-border dark:border-border shadow-sm backdrop-blur-sm hover:scale-105 transition-all cursor-pointer">
                                        {sticker.svg("w-full h-full")}
                                      </div>
                                    );
                                  }
                                  return <p className="font-bold whitespace-pre-wrap break-words">{msg.text}</p>;
                                })()
                              ) : msg.messageType === 'call_log' ? (
                                <div className="flex flex-col gap-2 p-3 bg-black/15 rounded-2xl border border-white/10 text-white min-w-[200px]">
                                  <div className="flex items-center gap-2">
                                    {msg.callType === 'audio' ? (
                                      <Phone className="w-4 h-4 text-brand-blue" />
                                    ) : (
                                      <Video className="w-4 h-4 text-brand-blue" />
                                    )}
                                    <div className="flex-1">
                                      <p className="text-xs font-black leading-snug">{msg.text}</p>
                                      <p className="text-[8px] font-bold text-white/50">{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                    </div>
                                  </div>
                                  {msg.callStatus === 'missed' && msg.sender !== user._id && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        startCall(msg.callType);
                                      }}
                                      className="w-full bg-brand-blue hover:brightness-105 py-1.5 rounded-xl font-extrabold text-[9px] uppercase tracking-wider transition-all text-white flex items-center justify-center gap-1 shadow-sm mt-1"
                                    >
                                      <PhoneCall className="w-3 h-3" /> Call Back
                                    </button>
                                  )}
                                </div>
                              ) : msg.isViewOnce && !msg.viewOnceOpened && msg.sender !== user._id ? (
                                <div>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenViewOnce(msg._id)}
                                    className="flex items-center gap-2 px-4 py-2 bg-brand-blue/10 hover:bg-brand-blue/20 text-brand-blue border border-brand-blue/30 rounded-xl transition-all font-bold text-xs shadow-sm"
                                  >
                                    <ShieldAlert className="w-4 h-4" /> View Once Message
                                  </button>
                                </div>
                              ) : msg.isViewOnce && !msg.viewOnceOpened && msg.sender === user._id ? (
                                <div>
                                  <div className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-xl font-bold text-xs italic">
                                    <ShieldAlert className="w-4 h-4" /> View Once (Unopened)
                                  </div>
                                </div>
                              ) : msg.viewOnceOpened ? (
                                <div>
                                  <p className="font-bold text-brand-dark/40 italic flex items-center gap-1.5">
                                    <ShieldAlert className="w-3.5 h-3.5" /> Opened View Once Message
                                  </p>
                                </div>
                              ) : (
                                <div>
                                  <p className="font-bold whitespace-pre-wrap break-words">
                                    {msg.translatedText && !showOriginal[msg._id] ? msg.translatedText : msg.text}
                                  </p>
                                  {msg.translatedText && (
                                    <div className="mt-2 flex items-center justify-between border-t border-border dark:border-border pt-1.5">
                                      <span className="text-[10px] font-black opacity-70">
                                        {!showOriginal[msg._id] ? `Translated to ${msg.targetLanguage}` : `Original (${msg.originalLanguage})`}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); toggleTranslation(msg._id); }}
                                        className="text-[10px] font-black underline hover:opacity-80"
                                      >
                                        {!showOriginal[msg._id] ? 'Show Original' : 'Show Translation'}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Reactions list */}
                              {msg.reactions && msg.reactions.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {(() => {
                                    const groups = {};
                                    msg.reactions.forEach(r => {
                                      groups[r.emoji] = groups[r.emoji] || [];
                                      groups[r.emoji].push(r.userId);
                                    });
                                    
                                    return Object.entries(groups).map(([emoji, userIds]) => {
                                      const hasMyReaction = userIds.includes(user._id);
                                      return (
                                        <button
                                          type="button"
                                          key={emoji}
                                          onClick={() => handleReactMessage(msg._id, emoji)}
                                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black border transition-all ${
                                            hasMyReaction
                                              ? isMe
                                                ? 'bg-white/20 border-white text-white'
                                                : 'bg-brand-blue/10 border-brand-blue text-brand-blue'
                                              : isMe
                                              ? 'bg-white/10 border-white/20 text-white/90 hover:bg-white/20'
                                              : 'bg-brand-light border-border dark:border-border text-brand-dark/70 hover:bg-brand-gray/10'
                                          }`}
                                        >
                                          <span className="select-none text-[11px]">{emoji}</span>
                                          <span>{userIds.length}</span>
                                        </button>
                                      );
                                    });
                                  })()}
                                </div>
                              )}
                              
                              <div className={`flex justify-end items-center gap-1 mt-1.5 text-[9px] font-black ${
                                msg.messageType === 'sticker'
                                  ? 'text-brand-dark/45'
                                  : isMe
                                  ? 'text-white/60'
                                  : 'text-brand-dark/45'
                              }`}>
                                <Clock className="w-2.5 h-2.5" />
                                <span>
                                  {new Date(msg.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                                {msg.isEdited && <span className="ml-1 opacity-75 italic">(Edited)</span>}
                                {isMe && (
                                  <span>
                                    {msg.isRead ? (
                                      <CheckCheck className={`w-3.5 h-3.5 ${msg.messageType === 'sticker' ? 'text-brand-blue' : 'text-white'} fill-current`} />
                                    ) : (
                                      <Check className={`w-3.5 h-3.5 ${msg.messageType === 'sticker' ? 'text-brand-dark/40' : 'text-white/70'}`} />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Typing Bubble */}
                  {friendIsTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white dark:bg-bg-card border border-border p-3 rounded-2xl rounded-bl-none flex items-center gap-1.5 shadow-sm text-xs font-bold text-text-secondary animate-pulse">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-text-secondary/50 rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-text-secondary/50 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                          <div className="w-1.5 h-1.5 bg-text-secondary/50 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                        </div>
                        <span>{selectedConv.otherUser.username} is typing...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Text Form */}
                <div className="p-4 bg-white dark:bg-bg-card border-t-2 border-border relative">
                  
                  {/* Emoji / Sticker Drawer */}
                  {showMediaDrawer && !selectedConv.isLocked && (
                    <div className="absolute bottom-full left-4 right-4 bg-white dark:bg-bg-card border-4 border-border rounded-3xl p-4 shadow-2xl mb-2 z-40 max-h-60 overflow-y-auto animate-scale-up">
                      {/* Drawer Tabs */}
                      <div className="flex gap-2 border-b-2 border-border pb-2 mb-3">
                        <button
                          type="button"
                          onClick={() => setActiveDrawerTab('emoji')}
                          className={`px-4 py-1.5 rounded-xl font-black text-xs transition-all ${
                            activeDrawerTab === 'emoji'
                              ? 'bg-brand-blue text-white shadow-3d-blue'
                              : 'bg-brand-light text-brand-dark/60 hover:bg-brand-gray/35'
                          }`}
                        >
                          Emojis
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveDrawerTab('stickers')}
                          className={`px-4 py-1.5 rounded-xl font-black text-xs transition-all ${
                            activeDrawerTab === 'stickers'
                              ? 'bg-brand-blue text-white shadow-3d-blue'
                              : 'bg-brand-light text-brand-dark/60 hover:bg-brand-gray/35'
                          }`}
                        >
                          LingoStickers
                        </button>
                      </div>

                      {/* Tab Content */}
                      {activeDrawerTab === 'emoji' ? (
                        <div className="grid grid-cols-8 sm:grid-cols-12 gap-2 text-xl select-none">
                          {['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🎒', '📚', '📝', '🎓', '🌟', '🏆', '🔥', '💯'].map((emo, idx) => (
                            <span
                              key={idx}
                              onClick={() => setInputText(prev => prev + emo)}
                              className="cursor-pointer hover:scale-125 transition-transform flex items-center justify-center p-1 rounded hover:bg-brand-light"
                            >
                              {emo}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                          {Object.entries(STICKERS).map(([id, sticker]) => (
                            <div
                              key={id}
                              onClick={() => sendStickerMessage(id)}
                              className="bg-brand-light hover:bg-brand-blue/5 border-2 border-border dark:border-border hover:border-brand-blue/30 p-2.5 rounded-2xl cursor-pointer flex flex-col items-center justify-center gap-1.5 transition-all shadow-3d-card hover:-translate-y-0.5"
                              title={sticker.name}
                            >
                              <div className="w-12 h-12">
                                {sticker.svg("w-full h-full")}
                              </div>
                              <span className="text-[9px] font-black text-brand-dark/50">{sticker.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
                    {/* Emoji / Media Drawer Toggle Button */}
                    <button
                      type="button"
                      disabled={selectedConv.isLocked}
                      onClick={() => setShowMediaDrawer(prev => !prev)}
                      className={`p-3 rounded-2xl border-2 transition-all shadow-3d-card ${
                        selectedConv.isLocked
                          ? 'border-brand-gray bg-brand-light/50 text-brand-dark/20 cursor-not-allowed'
                          : showMediaDrawer
                          ? 'border-brand-blue bg-brand-blue/5 text-brand-blue'
                          : 'border-border dark:border-border text-brand-dark/50 hover:bg-brand-light'
                      }`}
                      title="Emojis and Stickers"
                    >
                      <Smile className="w-4.5 h-4.5" />
                    </button>

                    <input
                      disabled={selectedConv.isLocked || isRecording}
                      type="text"
                      placeholder={
                        selectedConv.isLocked
                          ? "Become friends to unlock chat system"
                          : isRecording
                          ? "Voice note recording active..."
                          : "Type a message..."
                      }
                      className={`flex-1 px-4 py-3 border-2 rounded-2xl outline-none font-bold text-sm transition-all shadow-3d-card ${
                        selectedConv.isLocked || isRecording
                          ? 'border-brand-gray bg-brand-light/50 text-brand-dark/30 cursor-not-allowed'
                          : 'border-border dark:border-border text-text-main focus:border-brand-blue'
                      }`}
                      value={inputText}
                      onChange={handleInputChange}
                    />

                    {editingMessageId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMessageId(null);
                          setInputText('');
                        }}
                        className="p-2 text-brand-red hover:bg-brand-red/10 rounded-xl transition-all"
                        title="Cancel Editing"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    )}

                    {!editingMessageId && !isRecording && (
                      <button
                        type="button"
                        disabled={selectedConv.isLocked}
                        onClick={() => setIsViewOnce(prev => !prev)}
                        className={`p-2 rounded-xl transition-all ${
                          isViewOnce
                            ? 'text-brand-orange bg-brand-orange/10'
                            : 'text-brand-dark/40 hover:bg-brand-light'
                        }`}
                        title="View Once Mode"
                      >
                        <ShieldAlert className="w-5 h-5" />
                      </button>
                    )}

                    {/* Voice Recording Panel / Trigger */}
                    {isRecording ? (
                      <div className="flex items-center gap-2.5 bg-brand-red/10 border-2 border-brand-red/30 rounded-2xl px-3.5 py-2.5 shadow-3d-red">
                        <span className="w-2.5 h-2.5 rounded-full bg-brand-red animate-ping" />
                        
                        {/* Real-time reactive audio levels visualizer */}
                        <div className="flex items-end gap-1 h-5 px-1 min-w-[36px]">
                          {audioLevels.map((level, i) => (
                            <span
                              key={i}
                              style={{ height: `${level}%` }}
                              className="w-1 bg-brand-red rounded-full transition-all duration-75"
                            />
                          ))}
                        </div>

                        <span className="text-xs font-black text-brand-red select-none">{formatCallDuration(recordingTime)}</span>
                        <button
                          type="button"
                          onClick={() => stopRecording(false)} // Cancel
                          className="p-1 hover:bg-brand-red/10 rounded-lg text-brand-dark/60 hover:text-brand-red transition-all"
                          title="Cancel Recording"
                        >
                          <X className="w-4.5 h-4.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => stopRecording(true)} // Send
                          className="bg-brand-red hover:bg-brand-red/90 text-white p-1.5 rounded-xl shadow-md flex items-center justify-center transition-all shadow-3d-red active:translate-y-0.5"
                          title="Send Voice Note"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={selectedConv.isLocked}
                        onClick={startRecording}
                        className={`p-3.5 rounded-2xl text-white font-black shadow-md flex items-center justify-center transition-all ${
                          selectedConv.isLocked
                            ? 'bg-brand-gray/80 shadow-3d-gray cursor-not-allowed'
                            : 'bg-brand-orange hover:bg-brand-orange/95 shadow-3d-orange hover:translate-y-0.5 active:translate-y-1'
                        }`}
                        title="Record Voice Note"
                      >
                        <Mic className="w-4.5 h-4.5" />
                      </button>
                    )}

                    {/* Standard Text Send Button */}
                    {!isRecording && (
                      <button
                        type="submit"
                        disabled={selectedConv.isLocked || !inputText.trim()}
                        className={`p-3.5 rounded-2xl text-white font-black shadow-md flex items-center justify-center transition-all ${
                          selectedConv.isLocked || !inputText.trim()
                            ? 'bg-brand-gray/80 shadow-3d-gray cursor-not-allowed'
                            : 'bg-brand-blue hover:bg-brand-blue-hover shadow-3d-blue hover:translate-y-0.5 active:translate-y-1'
                        }`}
                      >
                        <Send className="w-4.5 h-4.5" />
                      </button>
                    )}
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center p-8 text-center text-brand-dark/55 bg-brand-light/10">
                <MessageSquare className="w-20 h-20 text-brand-dark/15 mb-4 animate-bounce" />
                <h3 className="text-2xl font-black text-text-main mb-1">Select a Conversation</h3>
                <p className="text-sm font-bold text-brand-dark/50 max-w-xs">
                  Choose an active chat from the sidebar or request a friend to start chatting!
                </p>
              </div>
            )}
          </div>

          {/* WebRTC Video/Audio Call Overlay */}
          {activeCall && (
            <div className={`absolute inset-0 bg-brand-dark/95 backdrop-blur-md flex flex-col justify-between items-center p-6 z-50 animate-fade-in text-white ${isFullScreen ? 'fixed inset-0 w-screen h-screen z-[999]' : ''}`}>
              
              {/* Header Info */}
              <div className="text-center mt-6 w-full">
                <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/10 px-3.5 py-1.5 rounded-full text-xs font-black tracking-widest uppercase mb-3 animate-pulse">
                  {activeCall.type === 'audio' ? <Phone className="w-4 h-4 text-brand-blue" /> : <Video className="w-4 h-4 text-brand-blue" />}
                  <span>
                    {activeCall.status === 'ringing'
                      ? (activeCall.role === 'caller' ? 'Calling...' : 'Incoming Call...')
                      : `Connected • ${formatCallDuration(callDuration)}`}
                  </span>
                </div>
                
                {/* Caller/Recipient Avatar */}
                {activeCall.status === 'ringing' && (
                  <div className="mt-4">
                    <img
                      src={activeCall.user.avatarUrl}
                      alt={activeCall.user.username}
                      className="w-24 h-24 rounded-3xl mx-auto border-4 border-brand-blue shadow-2xl bg-brand-light/10 animate-bounce"
                    />
                    <h3 className="text-2xl font-black mt-3">{activeCall.user.username}</h3>
                    <p className="text-xs font-bold text-white/50">LingoLeap Call Session</p>
                  </div>
                )}
              </div>

              {/* Video Element Viewport for Video Calls */}
              {activeCall.type === 'video' && activeCall.status === 'connected' ? (
                <div className="flex-1 w-full max-w-lg bg-black border-4 border-border dark:border-border rounded-3xl overflow-hidden shadow-2xl relative flex items-center justify-center my-4">
                  {/* Remote Stream Video */}
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Local Stream PIP Video */}
                  <div className="absolute bottom-4 right-4 w-32 h-44 bg-brand-dark/90 border-2 border-white/40 rounded-2xl overflow-hidden shadow-lg">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform -scale-x-100"
                    />
                  </div>

                  {/* Remote Muted / Video Off overlays */}
                  {(!remoteStream || remoteStream.getAudioTracks()[0]?.enabled === false) && (
                    <div className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1.5">
                      <MicOff className="w-3.5 h-3.5 text-brand-red" />
                      <span>User Muted</span>
                    </div>
                  )}
                </div>
              ) : activeCall.type === 'audio' && activeCall.status === 'connected' ? (
                <div className="flex-1 flex flex-col justify-center items-center my-4">
                  {/* Audio Call pulsing graphic */}
                  <div className="relative">
                    <img
                      src={activeCall.user.avatarUrl}
                      alt={activeCall.user.username}
                      className="w-32 h-32 rounded-3xl border-4 border-brand-blue shadow-2xl bg-brand-light/10 relative z-10"
                    />
                    <div className="absolute -inset-2 bg-brand-blue/30 rounded-3xl animate-ping opacity-60"></div>
                  </div>
                  <h3 className="text-2xl font-black mt-6">{activeCall.user.username}</h3>
                  <span className="text-xs font-bold text-brand-green/80 mt-1 uppercase tracking-wider">Audio Connection Active</span>
                  <audio ref={remoteVideoRef} autoPlay className="hidden" />
                </div>
              ) : (
                /* Ringing / Dialing Sound wave */
                <div className="h-28 flex items-center justify-center gap-2">
                  <span className="w-3 h-3 bg-brand-blue rounded-full animate-ping"></span>
                  <span className="w-3 h-3 bg-brand-blue rounded-full animate-ping [animation-delay:0.3s]"></span>
                  <span className="w-3 h-3 bg-brand-blue rounded-full animate-ping [animation-delay:0.6s]"></span>
                </div>
              )}

              {/* Captions / Subtitles overlay */}
              {activeCall.status === 'connected' && (localCaption || remoteCaption) && (
                <div className="absolute bottom-28 left-4 right-4 bg-black/70 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 text-center z-40 max-w-lg mx-auto">
                  {remoteCaption && (
                    <div className="mb-2 last:mb-0">
                      <span className="text-[8px] uppercase tracking-widest font-black text-brand-blue block mb-0.5">Friend</span>
                      <p className="text-xs font-black text-white leading-relaxed">{remoteCaption}</p>
                      {translateCaptions && translatedCaption && (
                        <p className="text-[10px] font-bold text-white/80 italic leading-relaxed mt-1 border-t border-white/5 pt-1 flex items-center justify-center gap-1">
                          ✨ Translation: {translatedCaption}
                        </p>
                      )}
                    </div>
                  )}
                  {localCaption && (
                    <div className="mt-2 border-t border-white/10 pt-2 first:mt-0 first:border-t-0 first:pt-0">
                      <span className="text-[8px] uppercase tracking-widest font-black text-brand-green block mb-0.5">You</span>
                      <p className="text-xs font-black text-white/90 leading-relaxed">{localCaption}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Language Lab Helper Drawer */}
              {activeCall.status === 'connected' && showCallHelper && (
                <div className="absolute top-4 right-4 bottom-28 w-64 bg-brand-dark/95 border-2 border-white/20 rounded-3xl p-4 overflow-y-auto text-white shadow-2xl z-40 animate-fade-in flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <h4 className="text-sm font-extrabold flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-brand-blue" /> Language Lab Helper
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowCallHelper(false)}
                      className="p-1 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <h5 className="text-[10px] font-black text-brand-blue uppercase tracking-wider mb-2">Useful Call Vocab</h5>
                    <div className="space-y-2">
                      {(callHelpers[targetLanguage] || callHelpers['Spanish']).vocab.map((item, idx) => (
                        <div key={idx} className="bg-white/5 p-2 rounded-xl border border-white/5">
                          <div className="font-extrabold text-xs text-white">{item.word}</div>
                          <div className="text-[9px] text-white/50 font-bold">{item.meaning}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-[10px] font-black text-brand-green uppercase tracking-wider mb-2">Speaking Hints</h5>
                    <div className="space-y-2">
                      {(callHelpers[targetLanguage] || callHelpers['Spanish']).hints.map((hint, idx) => (
                        <div key={idx} className="bg-white/5 p-2 rounded-xl border border-white/5 text-[10px] font-bold text-white/80 leading-relaxed">
                          💡 {hint}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Call Controls Panel */}
              <div className="mb-6 w-full max-w-sm flex flex-col gap-4 z-40">
                
                {/* Accept / Decline triggers for recipient */}
                {activeCall.status === 'ringing' && activeCall.role === 'recipient' ? (
                  <div className="flex gap-4 w-full">
                    <button
                      onClick={declineCall}
                      className="flex-1 bg-brand-red hover:bg-brand-red/90 text-white py-3.5 rounded-2xl font-black text-sm shadow-3d-red active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5"
                    >
                      <X className="w-5 h-5" />
                      Decline
                    </button>
                    <button
                      onClick={acceptCall}
                      className="flex-1 bg-brand-green hover:bg-brand-green-hover text-white py-3.5 rounded-2xl font-black text-sm shadow-3d-green active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-5 h-5" />
                      Accept
                    </button>
                  </div>
                ) : (
                  /* Audio controls & hangup for active call */
                  <div className="flex flex-col gap-3.5 items-center w-full">
                    
                    {/* Language Assistant row */}
                    {activeCall.status === 'connected' && (
                      <div className="flex gap-2 w-full justify-center flex-wrap">
                        {/* Subtitles toggle indicator */}
                        <button
                          type="button"
                          onClick={() => {
                            toast.success('Speech recognition subtitles auto-active.');
                          }}
                          className="p-2 px-3 rounded-xl border text-[10px] font-bold flex items-center gap-1 bg-brand-green/20 border-brand-green text-brand-green"
                          title="Live Captioning Subtitles"
                        >
                          <Languages className="w-3.5 h-3.5" /> Subtitles
                        </button>

                        {/* Translation Toggle */}
                        <button
                          type="button"
                          onClick={() => {
                            setTranslateCaptions(!translateCaptions);
                            toast.success(!translateCaptions ? 'Subtitle Translation Enabled' : 'Subtitle Translation Disabled');
                          }}
                          className={`p-2 px-3 rounded-xl border text-[10px] font-bold flex items-center gap-1 transition-all ${
                            translateCaptions
                              ? 'bg-brand-blue/20 border-brand-blue text-brand-blue'
                              : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                          }`}
                          title="AI Subtitles translation toggle"
                        >
                          <Globe className="w-3.5 h-3.5" /> AI Translate
                        </button>

                        {/* Vocab Helper Toggle */}
                        <button
                          type="button"
                          onClick={() => setShowCallHelper(!showCallHelper)}
                          className={`p-2 px-3 rounded-xl border text-[10px] font-bold flex items-center gap-1 transition-all ${
                            showCallHelper
                              ? 'bg-brand-orange/20 border-brand-orange text-brand-orange'
                              : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                          }`}
                          title="View Vocabulary & Hints"
                        >
                          <BookOpen className="w-3.5 h-3.5" /> Vocab Lab
                        </button>

                        {/* Full Screen Mode Toggle */}
                        {activeCall.type === 'video' && (
                          <button
                            type="button"
                            onClick={() => setIsFullScreen(!isFullScreen)}
                            className={`p-2 px-3 rounded-xl border text-[10px] font-bold flex items-center gap-1 transition-all ${
                              isFullScreen
                                ? 'bg-brand-purple/20 border-brand-purple text-brand-purple shadow-lg'
                                : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                            }`}
                            title="Toggle Fullscreen viewport"
                          >
                            <Maximize2 className="w-3.5 h-3.5" /> Fullscreen
                          </button>
                        )}
                      </div>
                    )}

                    <div className="flex gap-4 items-center mt-1">
                      {activeCall.status === 'connected' && (
                        <>
                          {/* Mute Mic Toggle */}
                          <button
                            onClick={() => {
                              if (localStream) {
                                const track = localStream.getAudioTracks()[0];
                                if (track) {
                                  track.enabled = !track.enabled;
                                  setIsMuted(!track.enabled);
                                }
                              }
                            }}
                            className={`p-3 rounded-2xl border-2 transition-all shadow-3d-card ${
                              isMuted
                                ? 'bg-brand-red/10 border-brand-red text-brand-red shadow-3d-red'
                                : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                            }`}
                            title={isMuted ? "Unmute Mic" : "Mute Mic"}
                          >
                            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                          </button>
                          
                          {/* Mute Video Toggle (only for video call) */}
                          {activeCall.type === 'video' && (
                            <button
                              onClick={() => {
                                if (localStream) {
                                  const track = localStream.getVideoTracks()[0];
                                  if (track) {
                                    track.enabled = !track.enabled;
                                    setIsVideoOff(!track.enabled);
                                  }
                                }
                              }}
                              className={`p-3 rounded-2xl border-2 transition-all shadow-3d-card ${
                                isVideoOff
                                  ? 'bg-brand-red/10 border-brand-red text-brand-red shadow-3d-red'
                                  : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                              }`}
                              title={isVideoOff ? "Turn Video On" : "Turn Video Off"}
                            >
                              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                    
                    <button
                      onClick={endCallSession}
                      className="w-full bg-brand-red hover:bg-brand-red/90 text-white py-3.5 rounded-2xl font-black text-sm shadow-3d-red active:translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-1"
                    >
                      <X className="w-5 h-5" />
                      {activeCall.status === 'ringing' ? 'Cancel Call' : 'Hang Up Call'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </AppLayout>
  );
}
