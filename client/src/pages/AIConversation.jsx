import React, { useState, useRef, useEffect } from 'react';
import AppLayout from '../components/common/AppLayout';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, Send, User, Sparkles, Globe, AlertTriangle, RefreshCw, Zap, X, 
  Trophy, BookOpen, LineChart, ChevronRight, Award, MessageSquare, 
  Volume2, CheckCircle2, MessageCircle, Loader2, Heart, Copy, Bookmark, 
  BookmarkCheck, Trash2, Mic, MicOff, Star, ShieldAlert, Award as MedalIcon
} from 'lucide-react';
import api from '../services/api';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';

const langFlags = {
  Spanish: '🇪🇸', French: '🇫🇷', English: '🇬🇧',
  German: '🇩🇪', Arabic: '🇸🇦', Italian: '🇮🇹',
  Korean: '🇰🇷', Japanese: '🇯🇵'
};

const teacherNames = {
  Spanish: '🇪🇸 Spanish Teacher',
  French: '🇫🇷 French Teacher',
  German: '🇩🇪 German Teacher',
  Italian: '🇮🇹 Italian Teacher',
  Arabic: '🇸🇦 Arabic Teacher',
  Korean: '🇰🇷 Korean Teacher',
  Japanese: '🇯🇵 Japanese Teacher',
  English: '🇬🇧 English Teacher'
};

const scenarios = [
  { id: 'restaurant', label: '🍴 Restaurant', description: 'Order food, ask questions, or pay the bill' },
  { id: 'airport', label: '✈️ Airport Check-in', description: 'Go through check-in, security, or immigration' },
  { id: 'hotel', label: '🏨 Hotel Reception', description: 'Check-in, request room service, or ask for help' },
  { id: 'taxi', label: '🚕 Taxi Ride', description: 'Give directions, ask about fare, and chat with driver' },
  { id: 'doctor', label: '🩺 Doctor Appointment', description: 'Explain symptoms, get advice, and ask for prescription' },
  { id: 'market', label: 'Market Stall', description: 'Negotiate price, select fresh produce' },
  { id: 'school', label: '🏫 School & Studies', description: 'Discuss assignments, classes, or exams with a peer' },
  { id: 'job_interview', label: '💼 Job Interview', description: 'Describe experience and answer qualification questions' },
  { id: 'birthday_party', label: '🎂 Birthday Party', description: 'Congratulate the host, socialize, and discuss gifts' },
  { id: 'shopping_mall', label: '🛍️ Shopping Mall', description: 'Find items, ask for sizes, and check out' },
  { id: 'police_station', label: '👮 Police Station', description: 'Report a lost item or ask for help' },
  { id: 'cinema', label: '🎬 Cinema Ticket Desk', description: 'Book tickets, choose seats, and buy popcorn' },
  { id: 'coffee_shop', label: '☕ Coffee Shop', description: 'Order special coffee drinks and pastry' },
  { id: 'gym', label: '🏋️ Fitness Gym', description: 'Talk to a trainer, ask about machines, plan workouts' },
  { id: 'office', label: '🏢 Office Meeting', description: 'Collaborate with colleagues and plan projects' },
  { id: 'dating', label: '💑 First Date', description: 'Make conversation, discuss interests, choose food' },
  { id: 'travel', label: '🗺️ Travel Directions', description: 'Ask locals for landmarks, streets, and routes' },
  { id: 'friends', label: '👥 Meeting Friends', description: 'Catch up, make plans for the weekend, share stories' },
  { id: 'family', label: '🏠 Family Dinner', description: 'Discuss daily activities, plans, and household tasks' },
  { id: 'emergency', label: '🚨 Emergency Situation', description: 'Describe accidents, call emergency service, ask for help' },
  { id: 'phone_call', label: '📞 Phone Call', description: 'Inquire, leave messages, or confirm reservations' },
  { id: 'casual', label: '💬 Casual Chat', description: 'Free conversation on weather, hobbies, and life' }
];

const levels = [
  { id: 'Beginner', label: 'Beginner', description: 'Simple options, translation help, slow audio' },
  { id: 'Intermediate', label: 'Intermediate', description: 'Open writing, live grammar corrections & explanations' },
  { id: 'Advanced', label: 'Advanced', description: 'Natural immersive flow, rich idiomatic dialogues' }
];

const AIConversation = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  
  // Tabs: 'practice' | 'bookmarks' | 'progress'
  const [activeTab, setActiveTab] = useState('practice');
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  
  // Setup Options
  const [selectedScenario, setSelectedScenario] = useState('casual');
  const [selectedLanguage, setSelectedLanguage] = useState(user?.targetLanguage || 'Spanish');
  const [selectedLevel, setSelectedLevel] = useState('Intermediate');

  // Voice Practice States
  const [voiceMode, setVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechActive, setSpeechActive] = useState(false);
  const recognitionRef = useRef(null);

  // Translation mapping & playback rates
  const [translationsMap, setTranslationsMap] = useState({}); // msgId -> translation
  const [savedPhrasesMap, setSavedPhrasesMap] = useState({}); // phraseText -> boolean

  // Word Dictionary Modal State
  const [selectedWordObj, setSelectedWordObj] = useState(null);
  const [searchingDict, setSearchingDict] = useState(false);

  // Bookmark Lists
  const [savedWords, setSavedWords] = useState([]);
  const [savedPhrases, setSavedPhrases] = useState([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);
  const [bookmarkSubTab, setBookmarkSubTab] = useState('words'); // 'words' | 'phrases'

  // UX states
  const [isTyping, setIsTyping] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [isSimulated, setIsSimulated] = useState(false);

  // Progress Logs States
  const [stats, setStats] = useState(null);
  const [historySessions, setHistorySessions] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (user?.targetLanguage) {
      setSelectedLanguage(user.targetLanguage);
    }
  }, [user?._id, user?.targetLanguage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (activeTab === 'bookmarks') {
      fetchBookmarks();
    } else if (activeTab === 'progress') {
      fetchProgressStats();
    }
  }, [activeTab]);

  // Speech Recognition Initialization
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      
      const langCodes = {
        Spanish: 'es-ES', French: 'fr-FR', English: 'en-US',
        German: 'de-DE', Arabic: 'ar-SA', Italian: 'it-IT',
        Korean: 'ko-KR', Japanese: 'ja-JP'
      };
      
      rec.lang = langCodes[selectedLanguage] || 'es-ES';
      
      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onerror = () => setIsListening(false);
      rec.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setInput(transcript);
        if (voiceMode && transcript.trim()) {
          submitUserSpeech(transcript);
        }
      };
      
      recognitionRef.current = rec;
    }
  }, [selectedLanguage, voiceMode]);

  // Voice Output Auto-Play triggers
  useEffect(() => {
    if (messages.length > 0 && voiceMode) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'model') {
        speakText(lastMsg.content, selectedLanguage, false);
      }
    }
  }, [messages, voiceMode]);

  const speakText = (text, language, isSlow = false) => {
    if (!('speechSynthesis' in window)) {
      toast.error('Text-to-speech not supported in this browser.');
      return;
    }
    
    // Clean text by stripping english translations in parentheses
    const cleanText = text.replace(/\([^)]*\)/g, '').trim();

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const langCodes = {
      Spanish: 'es-ES', French: 'fr-FR', English: 'en-US',
      German: 'de-DE', Arabic: 'ar-SA', Italian: 'it-IT',
      Korean: 'ko-KR', Japanese: 'ja-JP'
    };
    utterance.lang = langCodes[language] || 'es-ES';
    utterance.rate = isSlow ? 0.6 : 0.85;
    
    utterance.onstart = () => setSpeechActive(true);
    utterance.onend = () => {
      setSpeechActive(false);
      // Auto-trigger microphone input if in Voice-First mode after AI speaks
      if (voiceMode && currentSession && !isTyping) {
        startListening();
      }
    };
    utterance.onerror = () => setSpeechActive(false);

    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      window.speechSynthesis.cancel();
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Speech start error:', err);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  // Bookmark fetching & operations
  const fetchBookmarks = async () => {
    setLoadingBookmarks(true);
    try {
      const res = await api.get('/ai/saved-items');
      if (res.data.success) {
        setSavedWords(res.data.savedWords || []);
        setSavedPhrases(res.data.savedPhrases || []);
        
        // Cache phrase bookmark states
        const phraseMap = {};
        res.data.savedPhrases.forEach(p => {
          phraseMap[p.phrase.toLowerCase()] = true;
        });
        setSavedPhrasesMap(phraseMap);
      }
    } catch (err) {
      toast.error('Failed to load bookmarks.');
    } finally {
      setLoadingBookmarks(false);
    }
  };

  const toggleBookmarkPhrase = async (msg) => {
    const isBookmarked = savedPhrasesMap[msg.content.toLowerCase()];
    try {
      if (isBookmarked) {
        const res = await api.post('/ai/unsave-phrase', { phrase: msg.content, language: selectedLanguage });
        if (res.data.success) {
          toast.success('Removed phrase bookmark');
          setSavedPhrasesMap(prev => ({ ...prev, [msg.content.toLowerCase()]: false }));
        }
      } else {
        const phraseObj = {
          phrase: msg.content,
          translation: translationsMap[msg.id || msg._id] || 'Translation pending',
          language: selectedLanguage
        };
        const res = await api.post('/ai/save-phrase', { phraseObj });
        if (res.data.success) {
          toast.success('Saved sentence bookmark!');
          setSavedPhrasesMap(prev => ({ ...prev, [msg.content.toLowerCase()]: true }));
        }
      }
    } catch (err) {
      toast.error('Failed to update phrase bookmark.');
    }
  };

  const handleUnsaveWord = async (wordText) => {
    try {
      const res = await api.post('/ai/unsave-word', { word: wordText, language: selectedLanguage });
      if (res.data.success) {
        toast.success('Removed word bookmark');
        setSavedWords(prev => prev.filter(w => w.word !== wordText));
      }
    } catch (err) {
      toast.error('Failed to remove bookmark.');
    }
  };

  const handleUnsavePhrase = async (phraseText) => {
    try {
      const res = await api.post('/ai/unsave-phrase', { phrase: phraseText, language: selectedLanguage });
      if (res.data.success) {
        toast.success('Removed phrase bookmark');
        setSavedPhrases(prev => prev.filter(p => p.phrase !== phraseText));
      }
    } catch (err) {
      toast.error('Failed to remove bookmark.');
    }
  };

  const fetchProgressStats = async () => {
    setLoadingStats(true);
    try {
      const statsRes = await api.get('/ai/stats');
      const histRes = await api.get('/ai/sessions');
      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (histRes.data.success) setHistorySessions(histRes.data.sessions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Start learning session
  const startPracticeSession = async () => {
    setIsTyping(true);
    setEvaluationResult(null);
    setSelectedWordObj(null);
    
    try {
      const res = await api.post('/ai/session/start', {
        scenario: selectedScenario,
        language: selectedLanguage,
        level: selectedLevel
      });

      if (res.data.success) {
        setCurrentSession(res.data.session);
        setMessages(res.data.session.messages || []);
        setIsSimulated(res.data.simulated);
        toast.success(`Starting ${selectedLanguage} Practice!`);
      }
    } catch (err) {
      toast.error('Failed to start conversation session.');
    } finally {
      setIsTyping(false);
    }
  };

  const submitUserSpeech = async (spokenText) => {
    if (!spokenText.trim() || !currentSession || isTyping) return;
    setInput('');
    setIsTyping(true);

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: spokenText.trim(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await api.post(`/ai/session/${currentSession._id}/message`, {
        message: spokenText.trim()
      });

      if (res.data.success) {
        const aiMsg = {
          id: Date.now() + 1,
          role: 'model',
          content: res.data.reply,
          options: res.data.options || [],
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (err) {
      toast.error('Failed to send message.');
    } finally {
      setIsTyping(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    await submitUserSpeech(input);
  };

  const handleTranslateMessage = async (msg) => {
    if (translationsMap[msg.id || msg._id]) {
      // Toggle off if already showing
      setTranslationsMap(prev => ({ ...prev, [msg.id || msg._id]: null }));
      return;
    }
    
    try {
      const res = await api.post('/ai/chat', {
        scenario: selectedScenario,
        language: selectedLanguage,
        level: selectedLevel,
        messages: [{ role: 'user', content: `Translate this message to English: "${msg.content}"` }]
      });
      if (res.data.success) {
        setTranslationsMap(prev => ({ ...prev, [msg.id || msg._id]: res.data.reply }));
      }
    } catch (err) {
      // Fallback: strip parenthesis which usually contain translation
      const match = msg.content.match(/\(([^)]+)\)/);
      if (match) {
        setTranslationsMap(prev => ({ ...prev, [msg.id || msg._id]: match[1] }));
      } else {
        toast.error('Translation failed.');
      }
    }
  };

  const handleWordClick = async (word, messageContent) => {
    setSelectedWordObj(null);
    setSearchingDict(true);
    try {
      const res = await api.post('/ai/vocabulary-help', {
        word: word,
        language: selectedLanguage,
        context: messageContent
      });

      if (res.data.success) {
        setSelectedWordObj({
          word: res.data.word,
          translation: res.data.translation,
          pronunciation: res.data.pronunciation || word,
          grammar: res.data.grammar || 'General vocab entry',
          relatedWords: res.data.relatedWords || [],
          example: res.data.examples?.[0] || '',
          synonyms: res.data.synonyms || []
        });
      }
    } catch (err) {
      toast.error('Could not load definition.');
    } finally {
      setSearchingDict(false);
    }
  };

  const saveWordToBookmarks = async () => {
    if (!selectedWordObj) return;
    try {
      const wordObj = {
        ...selectedWordObj,
        language: selectedLanguage
      };
      const res = await api.post('/ai/save-word', { wordObj });
      if (res.data.success) {
        toast.success('Word saved to bookmarks!');
      }
    } catch (err) {
      toast.error('Failed to bookmark word.');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const finishPracticeSession = async () => {
    if (!currentSession) return;
    setIsCompleting(true);

    try {
      const res = await api.post(`/ai/session/${currentSession._id}/complete`);
      if (res.data.success) {
        setEvaluationResult(res.data.session);
        setCurrentSession(null);
        setMessages([]);
        setVoiceMode(false);
        confetti({
          particleCount: 200,
          spread: 80,
          origin: { y: 0.6 }
        });
        
        // Refresh User Stats live in navbar
        if (setUser && res.data.session) {
          // Trigger a silent auth update
          const meRes = await api.get('/auth/me');
          if (meRes.data.success) {
            setUser(meRes.data.user);
            localStorage.setItem('lingoleap_user', JSON.stringify(meRes.data.user));
          }
        }
      }
    } catch (err) {
      toast.error('Failed to compile session evaluation.');
    } finally {
      setIsCompleting(false);
    }
  };

  const renderMessageSpans = (content) => {
    // Regex splits on spaces and punctuation, keeping matches in array
    const tokens = content.split(/([\s\.,!\?\(\)\"\u3002\u3001\uFF01\uFF1F\u300C\u300D\u300E\u300F]+)/g);
    return tokens.map((token, idx) => {
      // Regex checks if it contains valid characters for language alphabets
      const isWord = /^[a-zA-Z\u00C0-\u00FF\u0100-\u017F\u0400-\u04FF\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\uC548-\uD7AF\u0600-\u06FF]+$/.test(token);
      if (isWord) {
        return (
          <span
            key={idx}
            onClick={() => handleWordClick(token, content)}
            className="cursor-pointer hover:text-brand-purple dark:hover:text-purple-400 hover:underline px-0.5 rounded transition font-medium text-purple-650"
            title="Tap to define word"
          >
            {token}
          </span>
        );
      }
      return <span key={idx}>{token}</span>;
    });
  };

  return (
    <AppLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-3xl font-extrabold text-text-main flex items-center gap-2">
            <Globe size={24} className="text-brand-purple" /> 
            <span>AI Conversation Practice</span>
            <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-purple-250">
              <Sparkles size={8} className="animate-spin" />
              Conversation Mode
            </span>
          </h1>
          <p className="text-xs font-semibold text-text-secondary mt-1">Immerse yourself by speaking directly with native speaker tutors</p>
        </div>

        {/* Tab Selection */}
        {!currentSession && !evaluationResult && (
          <div className="flex bg-brand-gray/30 p-1 rounded-2xl border border-border dark:border-border w-full md:w-auto">
            <button
              onClick={() => setActiveTab('practice')}
              className={`flex-1 md:flex-initial text-center justify-center px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'practice'
                  ? 'bg-white dark:bg-bg-card text-brand-purple shadow-sm'
                  : 'text-brand-dark/60 hover:text-text-main'
              }`}
            >
              <MessageCircle size={14} /> Practice
            </button>
            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`flex-1 md:flex-initial text-center justify-center px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'bookmarks'
                  ? 'bg-white dark:bg-bg-card text-brand-purple shadow-sm'
                  : 'text-brand-dark/60 hover:text-text-main'
              }`}
            >
              <Bookmark size={14} /> Bookmarks
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`flex-1 md:flex-initial text-center justify-center px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'progress'
                  ? 'bg-white dark:bg-bg-card text-brand-purple shadow-sm'
                  : 'text-brand-dark/60 hover:text-text-main'
              }`}
            >
              <LineChart size={14} /> Reports
            </button>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* 1. PRACTICE WORKSPACE - SETUP SCREEN        */}
      {/* ========================================== */}
      {activeTab === 'practice' && !currentSession && !evaluationResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in-up">
          {/* Options sidebar */}
          <div className="lg:col-span-1 flex flex-col gap-5">
            {/* Target Language Selection */}
            <div className="bg-white dark:bg-bg-card rounded-3xl border-2 border-border p-5 shadow-3d-card">
              <label className="text-xs font-extrabold text-brand-dark/50 mb-3.5 uppercase tracking-wide flex items-center gap-2">
                <Globe size={14} className="text-brand-purple" /> Target Language
              </label>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(langFlags).map(([lang, flag]) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLanguage(lang)}
                    className={`flex flex-col items-center justify-center p-2.5 border-2 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                      selectedLanguage === lang
                        ? 'border-brand-purple bg-brand-purple/5 text-brand-purple'
                        : 'border-border dark:border-border text-brand-dark/60 hover:bg-brand-light'
                    }`}
                  >
                    <span className="text-xl mb-1">{flag}</span>
                    <span>{lang}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Proficiency Levels */}
            <div className="bg-white dark:bg-bg-card rounded-3xl border-2 border-border p-5 shadow-3d-card">
              <label className="text-xs font-extrabold text-brand-dark/50 mb-3.5 uppercase tracking-wide flex items-center gap-2">
                <Sparkles size={14} className="text-brand-purple" /> Proficiency Level
              </label>
              <div className="flex flex-col gap-2">
                {levels.map((lvl) => (
                  <button
                    key={lvl.id}
                    onClick={() => setSelectedLevel(lvl.id)}
                    className={`text-left p-3 border-2 rounded-2xl transition cursor-pointer ${
                      selectedLevel === lvl.id
                        ? 'border-brand-purple bg-brand-purple/5 text-brand-purple shadow-sm'
                        : 'border-border dark:border-border hover:bg-brand-light text-brand-dark/70'
                    }`}
                  >
                    <div className="text-xs font-extrabold">{lvl.label}</div>
                    <div className="text-[10px] text-brand-dark/40 font-bold mt-0.5">{lvl.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Speaking instructions */}
            <div className="bg-gradient-to-br from-brand-purple/5 to-purple-100/10 rounded-3xl border-2 border-brand-purple/10 p-5 text-brand-dark/75">
              <h4 className="text-xs font-extrabold text-brand-purple flex items-center gap-1.5 uppercase mb-2">
                <Mic size={14} /> Voice-First Practice
              </h4>
              <p className="text-[11px] font-bold leading-normal mb-3">
                Toggle "Voice Mode" in chat. The AI will speak its replies automatically, and you can speak back without typing!
              </p>
              <span className="inline-flex bg-brand-purple/10 text-brand-purple font-black text-[9px] px-2.5 py-0.5 rounded-full">
                Supported for all 8 languages
              </span>
            </div>
          </div>

          {/* Scenarios Panel */}
          <div className="lg:col-span-2 bg-white dark:bg-bg-card rounded-3xl border-2 border-border p-5 md:p-6 shadow-3d-card flex flex-col justify-between">
            <div>
              <h2 className="text-sm md:text-base font-extrabold text-text-main mb-0.5">Select a Practice Scenario</h2>
              <p className="text-[11px] md:text-xs font-bold text-brand-dark/40 mb-4">Practice vocabulary in context across 21 diverse real-life situations</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 h-[380px] overflow-y-auto pr-1">
                {scenarios.map((scen) => (
                  <button
                    key={scen.id}
                    onClick={() => setSelectedScenario(scen.id)}
                    className={`text-left p-3 rounded-xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                      selectedScenario === scen.id
                        ? 'border-brand-purple bg-brand-purple/5 shadow-sm'
                        : 'border-border dark:border-border hover:bg-brand-light'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-xs md:text-sm text-text-main mb-0.5">{scen.label}</div>
                      <div className="text-[10px] md:text-xs font-bold text-brand-dark/40 leading-normal">{scen.description}</div>
                    </div>
                    <ChevronRight size={14} className={`text-brand-purple shrink-0 transition-transform ${selectedScenario === scen.id ? 'translate-x-1' : ''}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end w-full">
              <Button
                variant="custom"
                onClick={startPracticeSession}
                className="w-full md:w-auto bg-brand-purple text-white px-8 py-3.5 rounded-2xl font-black text-sm btn-3d shadow-3d-purple flex items-center justify-center gap-2 hover:bg-purple-600 cursor-pointer"
              >
                Launch Conversation <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 2. CHAT WORKSPACE SCREEN                   */}
      {/* ========================================== */}
      {activeTab === 'practice' && currentSession && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-190px)] lg:h-[650px] w-full max-w-7xl mx-auto">
          {/* Main Chat Feed */}
          <div className="lg:col-span-2 flex flex-col bg-white dark:bg-bg-card rounded-3xl border-2 border-border shadow-3d-card overflow-hidden h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b-2 border-border bg-slate-50/50 dark:bg-slate-900/30">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{langFlags[currentSession.language]}</span>
                <div>
                  <h3 className="font-extrabold text-text-main text-sm">
                    {teacherNames[currentSession.language] || `${currentSession.language} Native Speaker`}
                  </h3>
                  <p className="text-[10px] text-brand-purple font-extrabold uppercase tracking-wide">
                    {scenarios.find(s => s.id === currentSession.scenario)?.label} &middot; {currentSession.level}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="custom"
                  onClick={finishPracticeSession}
                  className="bg-brand-purple text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-purple-600 shadow-sm transition btn-3d shadow-3d-purple cursor-pointer"
                >
                  {isCompleting ? 'Grading...' : 'Finish & Exit'}
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-slate-50/20 dark:bg-slate-950/10">
              {messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                const hasTranslation = !!translationsMap[msg.id || msg._id];
                
                return (
                  <div key={msg.id || msg._id || index} className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                      isUser ? 'bg-brand-green text-white font-extrabold' : 'bg-gradient-to-br from-brand-purple to-indigo-600 text-white font-black'
                    }`}>
                      {isUser ? <User size={15} /> : <Bot size={15} />}
                    </div>

                    <div className="flex flex-col gap-1.5 max-w-[80%]">
                      {/* Bubble */}
                      <div className={`px-4 py-3 rounded-2xl text-xs sm:text-sm shadow-sm ${
                        isUser 
                          ? 'bg-brand-green text-white rounded-tr-sm' 
                          : 'bg-white dark:bg-bg-card border-2 border-border text-text-main rounded-tl-sm'
                      }`}>
                        {isUser ? (
                          <p className="font-semibold leading-relaxed">{msg.content}</p>
                        ) : (
                          <div className="font-semibold leading-relaxed tracking-wide select-text">
                            {renderMessageSpans(msg.content)}
                          </div>
                        )}

                        {/* Inline translation output */}
                        {hasTranslation && (
                          <div className="mt-2 pt-2 border-t border-dashed border-border text-[11px] text-text-secondary italic">
                            {translationsMap[msg.id || msg._id]}
                          </div>
                        )}
                      </div>

                      {/* Control toolbar for AI messages */}
                      {!isUser && (
                        <div className="flex items-center gap-3 px-1 text-[10px] text-brand-dark/40 font-extrabold">
                          <Button 
                            variant="custom"
                            size="custom"
                            onClick={() => handleTranslateMessage(msg)}
                            className="hover:text-brand-purple flex items-center gap-0.5 cursor-pointer"
                          >
                            Translate
                          </Button>
                          <span>&middot;</span>
                          <button 
                            onClick={() => speakText(msg.content, selectedLanguage, false)}
                            className="hover:text-brand-purple flex items-center gap-0.5 cursor-pointer"
                          >
                            Speak
                          </button>
                          <span>&middot;</span>
                          <button 
                            onClick={() => speakText(msg.content, selectedLanguage, true)}
                            className="hover:text-brand-purple flex items-center gap-0.5 cursor-pointer"
                          >
                            Slower
                          </button>
                          <span>&middot;</span>
                          <button 
                            onClick={() => copyToClipboard(msg.content)}
                            className="hover:text-brand-purple flex items-center gap-0.5 cursor-pointer"
                          >
                            Copy
                          </button>
                          <span>&middot;</span>
                          <Button 
                            variant="custom"
                            size="custom"
                            onClick={() => toggleBookmarkPhrase(msg)}
                            className="hover:text-brand-purple flex items-center gap-0.5 cursor-pointer"
                          >
                            {savedPhrasesMap[msg.content.toLowerCase()] ? 'Saved!' : 'Save'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-purple to-indigo-600 flex items-center justify-center">
                    <Bot size={15} className="text-white" />
                  </div>
                  <div className="bg-white dark:bg-bg-card border-2 border-border px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-brand-purple/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-brand-purple/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-brand-purple/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom input workspace */}
            <div className="border-t-2 border-border p-4 bg-white dark:bg-bg-card">
              {/* Beginner multiple-choice buttons */}
              {currentSession.level === 'Beginner' && messages.length > 0 && messages[messages.length - 1].role === 'model' && (
                <div className="mb-4">
                  <p className="text-[10px] text-brand-dark/40 font-extrabold uppercase tracking-wider mb-2">Select a response option:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(messages[messages.length - 1].options || [
                      "안녕하세요", "안녕히 가세요", "감사합니다", "죄송합니다"
                    ]).map((opt, idx) => (
                      <Button
                        variant="custom"
                        key={idx}
                        onClick={() => submitUserSpeech(opt)}
                        disabled={isTyping}
                        className="bg-purple-50 hover:bg-purple-100 border border-purple-200 text-brand-purple text-xs font-bold py-2.5 px-3 rounded-xl transition cursor-pointer text-center"
                      >
                        {opt}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Writing / Speaking Input */}
              <div className="flex gap-2.5 items-center">
                <button
                  onClick={() => {
                    const next = !voiceMode;
                    setVoiceMode(next);
                    if (!next) stopListening();
                  }}
                  className={`p-3.5 border-2 rounded-2xl transition-all cursor-pointer shrink-0 ${
                    voiceMode 
                      ? 'border-brand-purple bg-brand-purple/10 text-brand-purple' 
                      : 'border-border text-brand-dark/50 hover:bg-slate-50'
                  }`}
                  title="Toggle Hands-Free Voice Mode"
                >
                  <Mic size={18} className={isListening ? 'animate-pulse text-red-500' : ''} />
                </button>

                {voiceMode && (
                  <button
                    onClick={isListening ? stopListening : startListening}
                    className={`px-6 py-3.5 border-2 rounded-2xl transition cursor-pointer font-black text-xs uppercase flex items-center gap-2 ${
                      isListening 
                        ? 'border-red-500 bg-red-50 text-red-500 animate-pulse' 
                        : 'border-brand-purple text-brand-purple hover:bg-purple-50'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                        Listening...
                      </>
                    ) : (
                      <>
                        <Mic size={14} /> Click to Speak
                      </>
                    )}
                  </button>
                )}

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  disabled={isTyping}
                  placeholder={voiceMode ? 'Speak now, or type here...' : `Reply in ${currentSession.language}...`}
                  className="flex-1 px-4 py-3.5 border-2 border-border rounded-2xl text-xs sm:text-sm font-semibold outline-none focus:border-brand-purple bg-bg-main/20 text-text-main"
                />

                <Button
                  variant="custom"
                  onClick={sendMessage}
                  disabled={!input.trim() || isTyping}
                  className="bg-brand-purple text-white p-3.5 rounded-2xl font-extrabold btn-3d shadow-3d-purple hover:bg-purple-600 disabled:opacity-40"
                >
                  <Send size={18} />
                </Button>
              </div>
            </div>
          </div>

          {/* Right companion dictionary / word details card */}
          <div className="lg:col-span-1 flex flex-col gap-4 h-full">
            <div className="bg-white dark:bg-bg-card rounded-3xl border-2 border-border p-5 shadow-3d-card flex flex-col h-full overflow-hidden">
              <h4 className="text-xs font-extrabold text-brand-dark/50 mb-3.5 uppercase tracking-wide flex items-center gap-2">
                <BookOpen size={14} className="text-brand-purple" /> Tap Dictionary
              </h4>
              
              {searchingDict ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-brand-dark/40">
                  <Loader2 className="w-10 h-10 animate-spin text-brand-purple mb-3" />
                  <p className="text-xs font-bold">Querying AI Dictionary...</p>
                </div>
              ) : selectedWordObj ? (
                <div className="flex-1 overflow-y-auto space-y-4">
                  <div className="border-b border-border pb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black text-brand-purple flex items-center gap-1.5">
                        {selectedWordObj.word}
                        <button 
                          onClick={() => speakText(selectedWordObj.word, selectedLanguage)}
                          className="p-1 hover:bg-purple-50 rounded-lg text-brand-purple"
                        >
                          <Volume2 size={15} />
                        </button>
                      </span>
                      <button
                        onClick={saveWordToBookmarks}
                        className="p-1 text-brand-dark/40 hover:text-brand-purple border border-border rounded-lg"
                        title="Bookmark word"
                      >
                        <Bookmark size={15} />
                      </button>
                    </div>
                    <span className="text-[9px] bg-slate-100 font-extrabold px-2 py-0.5 rounded-full text-slate-600 uppercase inline-block mt-1">
                      {selectedWordObj.grammar}
                    </span>
                  </div>

                  <div>
                    <h5 className="text-[10px] text-brand-dark/40 font-extrabold uppercase mb-1">Translation & Meaning</h5>
                    <p className="text-xs text-text-main font-bold">{selectedWordObj.translation}</p>
                    <p className="text-xs text-text-secondary mt-1">{selectedWordObj.meaning}</p>
                  </div>

                  <div>
                    <h5 className="text-[10px] text-brand-dark/40 font-extrabold uppercase mb-1">Pronunciation</h5>
                    <p className="text-xs font-mono text-brand-purple font-bold">{selectedWordObj.pronunciation}</p>
                  </div>

                  {selectedWordObj.example && (
                    <div>
                      <h5 className="text-[10px] text-brand-dark/40 font-extrabold uppercase mb-1">Example Sentence</h5>
                      <p className="text-xs text-text-main font-semibold italic">"{selectedWordObj.example}"</p>
                    </div>
                  )}

                  {selectedWordObj.synonyms?.length > 0 && (
                    <div>
                      <h5 className="text-[10px] text-brand-dark/40 font-extrabold uppercase mb-1">Synonyms</h5>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {selectedWordObj.synonyms.map((s, i) => (
                          <span key={i} className="text-[10px] bg-purple-50 text-brand-purple font-bold px-2 py-0.5 rounded-md border border-purple-100">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedWordObj.relatedWords?.length > 0 && (
                    <div>
                      <h5 className="text-[10px] text-brand-dark/40 font-extrabold uppercase mb-1">Related Words</h5>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {selectedWordObj.relatedWords.map((w, i) => (
                          <span key={i} className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-md border border-indigo-100">
                            {w}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-brand-dark/40 font-bold">
                  <BookOpen size={36} className="text-brand-gray mb-3 opacity-60" />
                  <p className="text-xs">Tap on any word in the AI messages to review meaning, grammar, and synonyms instantly.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 3. EVALUATION REWARDS SCREEN               */}
      {/* ========================================== */}
      {activeTab === 'practice' && evaluationResult && (
        <div className="max-w-3xl mx-auto bg-white dark:bg-bg-card rounded-3xl border-2 border-border p-6 sm:p-8 shadow-3d-card fade-in-up">
          <div className="text-center mb-6">
            <Trophy size={48} className="text-yellow-500 mx-auto mb-2 drop-shadow-md animate-bounce" />
            <h2 className="text-2xl font-black text-text-main">Practice Complete!</h2>
            <p className="text-xs font-semibold text-text-secondary mt-1">Here is how you performed in this conversation</p>
          </div>

          {/* XP & Gems Reward Panel */}
          <div className="grid grid-cols-2 gap-4 mb-6 bg-gradient-to-r from-purple-550 to-indigo-650 text-white rounded-3xl p-5 shadow-3d-purple">
            <div className="text-center border-r border-white/20">
              <span className="text-[10px] uppercase font-black text-purple-200">XP Awarded</span>
              <p className="text-3xl font-black mt-1 flex items-center justify-center gap-1.5">
                <Zap size={22} className="text-yellow-300 fill-yellow-300" /> +25 XP
              </p>
            </div>
            <div className="text-center">
              <span className="text-[10px] uppercase font-black text-purple-200">Gems Awarded</span>
              <p className="text-3xl font-black mt-1 flex items-center justify-center gap-1.5">
                <Sparkles size={22} className="text-yellow-300" /> +10 Gems
              </p>
            </div>
          </div>

          {/* Score Metrics Grid */}
          <h4 className="text-xs font-black text-brand-dark/50 uppercase tracking-wider mb-3">Language Performance Metrics</h4>
          <div className="grid grid-cols-5 gap-3 mb-6">
            {[
              { label: 'Fluency', score: evaluationResult.score?.fluency || 70, color: 'text-green-500' },
              { label: 'Grammar', score: evaluationResult.score?.grammar || 70, color: 'text-blue-500' },
              { label: 'Vocabulary', score: evaluationResult.score?.vocabulary || 70, color: 'text-purple-500' },
              { label: 'Pronunciation', score: evaluationResult.score?.pronunciation || 75, color: 'text-rose-500' },
              { label: 'Listening', score: evaluationResult.score?.listening || 80, color: 'text-amber-500' }
            ].map((m, i) => (
              <div key={i} className="bg-slate-50 dark:bg-bg-main/30 border-2 border-border rounded-2xl p-3 text-center">
                <span className="text-[9px] font-black uppercase text-brand-dark/40 block truncate">{m.label}</span>
                <span className={`text-xl font-black ${m.color} block mt-1`}>{m.score}%</span>
              </div>
            ))}
          </div>

          {/* Conversation Rating */}
          <div className="flex items-center justify-center gap-2 mb-6 bg-yellow-50/50 border border-yellow-200 rounded-2xl p-4">
            <span className="text-xs font-black text-yellow-700">Conversation Rating:</span>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  size={18} 
                  className={i < (evaluationResult.score?.rating || 4) ? 'text-yellow-500 fill-yellow-500' : 'text-slate-200'} 
                />
              ))}
            </div>
          </div>

          {/* Mapped Feedback & Review */}
          <div className="space-y-4 mb-6">
            <div className="bg-slate-50 dark:bg-bg-main/30 border border-border rounded-2xl p-4">
              <h5 className="text-xs font-black text-brand-dark/60 uppercase mb-1 flex items-center gap-1">
                <MedalIcon size={14} className="text-brand-purple" /> General Feedback
              </h5>
              <p className="text-xs font-semibold text-text-secondary leading-relaxed">{evaluationResult.feedback?.suggestions}</p>
            </div>

            {evaluationResult.feedback?.newWordsLearned?.length > 0 && (
              <div>
                <h5 className="text-[10px] text-brand-dark/40 font-extrabold uppercase tracking-wide mb-2">New Words Introduced</h5>
                <div className="flex flex-wrap gap-2">
                  {evaluationResult.feedback.newWordsLearned.map((w, i) => (
                    <span key={i} className="text-xs font-bold bg-green-50 border border-green-200 text-green-700 px-3 py-1 rounded-full">
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {evaluationResult.feedback?.suggestedReview?.length > 0 && (
              <div>
                <h5 className="text-[10px] text-brand-dark/40 font-extrabold uppercase tracking-wide mb-2">Grammar / Vocab Topics to Review</h5>
                <div className="flex flex-wrap gap-2">
                  {evaluationResult.feedback.suggestedReview.map((r, i) => (
                    <span key={i} className="text-xs font-bold bg-red-50 border border-red-200 text-red-750 px-3 py-1 rounded-full">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setEvaluationResult(null)}
              className="bg-brand-purple text-white px-8 py-3.5 rounded-2xl font-black text-sm btn-3d shadow-3d-purple cursor-pointer hover:bg-purple-600"
            >
              Continue Practicing
            </button>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 4. BOOKMARKS TAB                           */}
      {/* ========================================== */}
      {activeTab === 'bookmarks' && (
        <div className="bg-white dark:bg-bg-card rounded-3xl border-2 border-border p-5 md:p-6 shadow-3d-card fade-in-up">
          {/* Sub-tabs switch */}
          <div className="flex bg-slate-50 p-1 border border-border rounded-2xl mb-6 max-w-xs">
            <button
              onClick={() => setBookmarkSubTab('words')}
              className={`flex-1 text-center py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                bookmarkSubTab === 'words' ? 'bg-white text-brand-purple shadow-sm' : 'text-brand-dark/65'
              }`}
            >
              Saved Vocabulary ({savedWords.length})
            </button>
            <button
              onClick={() => setBookmarkSubTab('phrases')}
              className={`flex-1 text-center py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                bookmarkSubTab === 'phrases' ? 'bg-white text-brand-purple shadow-sm' : 'text-brand-dark/65'
              }`}
            >
              Saved Phrases ({savedPhrases.length})
            </button>
          </div>

          {loadingBookmarks ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-brand-purple mb-2" />
              <p className="text-xs font-bold text-brand-dark/40">Loading bookmarks list...</p>
            </div>
          ) : bookmarkSubTab === 'words' ? (
            savedWords.length === 0 ? (
              <div className="py-20 text-center text-brand-dark/40 font-bold flex flex-col items-center justify-center">
                <BookOpen size={44} className="mb-2 text-slate-300" />
                <p className="text-sm">No bookmarked words found.</p>
                <p className="text-xs font-semibold text-brand-dark/30 mt-1">Tap words in conversations to define and bookmark them.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedWords.map((item, idx) => (
                  <div key={idx} className="border-2 border-border rounded-3xl p-5 hover:border-brand-purple/40 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-base font-black text-brand-purple flex items-center gap-1">
                          {item.word}
                          <button 
                            onClick={() => speakText(item.word, item.language || selectedLanguage)}
                            className="p-1 hover:bg-purple-50 rounded-lg text-brand-purple"
                          >
                            <Volume2 size={14} />
                          </button>
                        </span>
                        <button
                          onClick={() => handleUnsaveWord(item.word)}
                          className="text-brand-dark/30 hover:text-red-500 transition p-1"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <span className="text-[9px] bg-slate-100 text-slate-500 font-extrabold px-2 py-0.5 rounded-full inline-block uppercase mb-3">
                        {item.grammar || 'Noun'}
                      </span>
                      <p className="text-xs text-text-main font-bold mb-1">{item.translation}</p>
                      <p className="text-xs text-text-secondary">{item.meaning}</p>
                      
                      {item.example && (
                        <p className="text-[11px] text-brand-purple/70 italic mt-3 border-t border-dashed border-border pt-2">
                          "{item.example}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            savedPhrases.length === 0 ? (
              <div className="py-20 text-center text-brand-dark/40 font-bold flex flex-col items-center justify-center">
                <MessageSquare size={44} className="mb-2 text-slate-300" />
                <p className="text-sm">No bookmarked phrases found.</p>
                <p className="text-xs font-semibold text-brand-dark/30 mt-1">Save sentences in chats to practice them later.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedPhrases.map((item, idx) => (
                  <div key={idx} className="border-2 border-border rounded-2xl p-4 flex justify-between items-center gap-4 hover:border-brand-purple/20 transition-all">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-text-main">{item.phrase}</span>
                        <button 
                          onClick={() => speakText(item.phrase, item.language || selectedLanguage, false)}
                          className="text-brand-purple p-1 hover:bg-purple-50 rounded-lg"
                        >
                          <Volume2 size={14} />
                        </button>
                      </div>
                      <p className="text-xs text-text-secondary font-medium mt-1">{item.translation}</p>
                    </div>
                    <button
                      onClick={() => handleUnsavePhrase(item.phrase)}
                      className="text-brand-dark/30 hover:text-red-500 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* 5. REPORTS TAB                             */}
      {/* ========================================== */}
      {activeTab === 'progress' && (
        <div className="bg-white dark:bg-bg-card rounded-3xl border-2 border-border p-5 md:p-6 shadow-3d-card fade-in-up">
          {loadingStats ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-brand-purple mb-2" />
              <p className="text-xs font-bold text-brand-dark/40">Loading reports...</p>
            </div>
          ) : stats ? (
            <div>
              {/* Aggregated score averages */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-50 dark:bg-bg-main/30 border border-border p-4 rounded-3xl text-center">
                  <span className="text-[10px] text-brand-dark/40 font-extrabold uppercase">Total Conversations</span>
                  <p className="text-2xl font-black text-brand-purple mt-1">{stats.totalSessions}</p>
                </div>
                <div className="bg-slate-50 dark:bg-bg-main/30 border border-border p-4 rounded-3xl text-center">
                  <span className="text-[10px] text-brand-dark/40 font-extrabold uppercase">Average Fluency</span>
                  <p className="text-2xl font-black text-green-500 mt-1">{stats.averageFluency}%</p>
                </div>
                <div className="bg-slate-50 dark:bg-bg-main/30 border border-border p-4 rounded-3xl text-center">
                  <span className="text-[10px] text-brand-dark/40 font-extrabold uppercase">Average Grammar</span>
                  <p className="text-2xl font-black text-blue-500 mt-1">{stats.averageGrammar}%</p>
                </div>
                <div className="bg-slate-50 dark:bg-bg-main/30 border border-border p-4 rounded-3xl text-center">
                  <span className="text-[10px] text-brand-dark/40 font-extrabold uppercase">Average Vocabulary</span>
                  <p className="text-2xl font-black text-purple-500 mt-1">{stats.averageVocabulary}%</p>
                </div>
              </div>

              {/* Progress Chart Logs */}
              <h3 className="text-xs font-black text-brand-dark/50 uppercase tracking-wider mb-3">Conversation Progress History</h3>
              {stats.overallProgress?.length === 0 ? (
                <p className="text-xs font-bold text-brand-dark/35 py-10 text-center">No finished conversations log found.</p>
              ) : (
                <div className="space-y-3.5 mb-6">
                  {stats.overallProgress.map((p, idx) => (
                    <div key={idx} className="border border-border rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-black text-brand-purple uppercase">{p.scenario} Scenario</span>
                        <p className="text-[10px] text-brand-dark/40 font-bold mt-0.5">{new Date(p.date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="text-center">
                          <span className="text-[9px] text-brand-dark/40 font-black block">FLUE</span>
                          <span className="text-xs font-black text-green-500">{p.fluency}%</span>
                        </div>
                        <div className="text-center">
                          <span className="text-[9px] text-brand-dark/40 font-black block">GRAM</span>
                          <span className="text-xs font-black text-blue-500">{p.grammar}%</span>
                        </div>
                        <div className="text-center">
                          <span className="text-[9px] text-brand-dark/40 font-black block">VOCO</span>
                          <span className="text-xs font-black text-purple-500">{p.vocabulary}%</span>
                        </div>
                        <div className="text-center">
                          <span className="text-[9px] text-brand-dark/40 font-black block">PRON</span>
                          <span className="text-xs font-black text-rose-500">{p.pronunciation}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="py-20 text-center font-bold text-brand-dark/40 text-sm">No statistics available yet.</p>
          )}
        </div>
      )}
    </AppLayout>
  );
};

export default AIConversation;
