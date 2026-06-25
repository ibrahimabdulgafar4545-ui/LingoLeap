import React, { useState, useRef, useEffect } from 'react';
import AppLayout from '../components/common/AppLayout';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, Send, User, Sparkles, Globe, AlertTriangle, RefreshCw, Zap, X, 
  Trophy, BookOpen, LineChart, ChevronRight, Award, MessageSquare, 
  ShieldAlert, Sparkle, Volume2, CheckCircle2, MessageCircle, Loader2, Heart
} from 'lucide-react';
import api from '../services/api';
import confetti from 'canvas-confetti';

const langFlags = {
  Spanish: '🇪🇸', French: '🇫🇷', English: '🇬🇧',
  German: '🇩🇪', Arabic: '🇸🇦', Italian: '🇮🇹'
};

const scenarios = [
  { id: 'restaurant', label: '🍴 Restaurant', description: 'Order food, ask questions, or pay the bill' },
  { id: 'airport', label: '✈️ Airport Check-in', description: 'Go through check-in, security, or immigration' },
  { id: 'hotel', label: '🏨 Hotel Reception', description: 'Check-in, request room service, or ask for help' },
  { id: 'shopping', label: '🛍️ Shopping Mall', description: 'Find items, ask for sizes, and check out' },
  { id: 'job_interview', label: '💼 Job Interview', description: 'Apply for a role and describe your qualifications' },
  { id: 'casual', label: '💬 Casual Chat', description: 'Discuss hobbies, weather, and daily plans' },
  { id: 'travel', label: '🗺️ Travel Directions', description: 'Ask locals for landmarks and subway routes' },
  { id: 'school', label: '🏫 School & Studies', description: 'Talk with classmates about classes and exams' }
];

const levels = [
  { id: 'Beginner', label: 'Beginner', description: 'Simple words, slow replies' },
  { id: 'Intermediate', label: 'Intermediate', description: 'Standard vocabulary' },
  { id: 'Advanced', label: 'Advanced', description: 'Idiomatic & complex phrasing' }
];

const AITutor = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('practice'); // 'practice' | 'progress'
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  
  // Custom setup options
  const [selectedScenario, setSelectedScenario] = useState('casual');
  const [selectedLanguage, setSelectedLanguage] = useState(user?.targetLanguage || 'Spanish');
  const [selectedLevel, setSelectedLevel] = useState('Intermediate');
  
  // States for UX loaders and feedback
  const [isTyping, setIsTyping] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [simBanner, setSimBanner] = useState(null);
  const [isSimulated, setIsSimulated] = useState(false);
  
  // Real-time grammar & vocab popovers
  const [focusedVocab, setFocusedVocab] = useState(null);
  const [lastTurnGrammar, setLastTurnGrammar] = useState([]);
  const [lastTurnVocab, setLastTurnVocab] = useState([]);

  // Mobile layout state & active session tab
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [activeSessionTab, setActiveSessionTab] = useState('chat'); // 'chat' | 'vocab'

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Stateless search tools
  const [dictInput, setDictInput] = useState('');
  const [searchingDict, setSearchingDict] = useState(false);
  const [inlineGrammarFeedback, setInlineGrammarFeedback] = useState(null);
  const [checkingGrammar, setCheckingGrammar] = useState(false);

  // Stats and history state
  const [stats, setStats] = useState(null);
  const [historySessions, setHistorySessions] = useState([]);
  const [selectedHistorySession, setSelectedHistorySession] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Diagnostic states
  const [aiConnected, setAiConnected] = useState(null);
  const [aiDiagnosticMsg, setAiDiagnosticMsg] = useState('');

  useEffect(() => {
    checkAiConnection();
  }, []);

  const checkAiConnection = async () => {
    try {
      const res = await api.get('/ai/test');
      if (res.data.connected) {
        setAiConnected('connected');
      } else {
        setAiConnected('disconnected');
        setAiDiagnosticMsg(res.data.message || 'Gemini API Offline');
      }
    } catch (err) {
      setAiConnected('disconnected');
      setAiDiagnosticMsg('Could not reach Gemini API diagnostic endpoint.');
    }
  };

  const lookupWord = async (wordToSearch) => {
    const term = wordToSearch || dictInput;
    if (!term || term.trim() === '') return;
    
    setSearchingDict(true);
    setFocusedVocab(null);
    try {
      const vocabRes = await api.post('/ai/vocabulary-help', {
        word: term.trim(),
        language: selectedLanguage
      });
      const pronounceRes = await api.post('/ai/pronunciation-help', {
        word: term.trim(),
        language: selectedLanguage
      });

      if (vocabRes.data.success && pronounceRes.data.success) {
        const vocabData = vocabRes.data;
        const pronounceData = pronounceRes.data;

        const combined = {
          word: vocabData.word,
          translation: vocabData.translation,
          pronunciation: pronounceData.phonetic || '',
          example: vocabData.examples?.[0] || '',
          meaning: vocabData.meaning || '',
          synonyms: vocabData.synonyms || [],
          tips: pronounceData.tips || [],
          guide: pronounceData.guide || '',
          isSearchLookup: true
        };
        setFocusedVocab(combined);
        setDictInput('');
        playPronunciation(vocabData.word);
      }
    } catch (err) {
      console.error('Dictionary lookup failed:', err);
    } finally {
      setSearchingDict(false);
    }
  };

  const checkGrammarOfInput = async () => {
    if (!input.trim()) return;
    
    setCheckingGrammar(true);
    setInlineGrammarFeedback(null);
    try {
      const res = await api.post('/ai/grammar-check', {
        text: input.trim(),
        language: selectedLanguage
      });

      if (res.data.success) {
        setInlineGrammarFeedback(res.data);
      }
    } catch (err) {
      console.error('Inline grammar check failed:', err);
    } finally {
      setCheckingGrammar(false);
    }
  };

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (user?.targetLanguage) {
      setSelectedLanguage(user.targetLanguage);
    }
  }, [user?._id, user?.targetLanguage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Load stats and history when tab changes to progress
  useEffect(() => {
    if (activeTab === 'progress') {
      fetchProgressStats();
    }
  }, [activeTab]);

  const fetchProgressStats = async () => {
    setLoadingStats(true);
    try {
      const statsRes = await api.get('/ai/stats');
      const histRes = await api.get('/ai/sessions');
      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (histRes.data.success) setHistorySessions(histRes.data.sessions);
    } catch (err) {
      console.error('Error fetching progress stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const startPracticeSession = async () => {
    setIsTyping(true);
    setEvaluationResult(null);
    setFocusedVocab(null);
    setLastTurnGrammar([]);
    setLastTurnVocab([]);

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
        if (res.data.simulated) {
          setSimBanner('no_api_key');
        }
        
        // Grab opening vocabulary recommendations if any
        if (res.data.session.feedback?.recommendedVocab) {
          setLastTurnVocab(res.data.session.feedback.recommendedVocab);
        }
      }
    } catch (err) {
      console.error('Error starting AI practice:', err);
      alert('Could not start the AI practice session. Please try again!');
    } finally {
      setIsTyping(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentSession || isTyping) return;

    const trimmed = input.trim();
    setInput('');
    setIsTyping(true);

    // Optimistically update messages with user's message
    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: trimmed,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setLastTurnGrammar([]);

    try {
      const res = await api.post(`/ai/session/${currentSession._id}/message`, {
        message: trimmed
      });

      if (res.data.success) {
        const aiMsg = {
          id: Date.now() + 1,
          role: 'model',
          content: res.data.reply,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMsg]);
        setIsSimulated(res.data.simulated);
        
        // Save real-time feedback values for popovers
        if (res.data.grammarMistakes && res.data.grammarMistakes.length > 0) {
          setLastTurnGrammar(res.data.grammarMistakes);
        }
        if (res.data.vocabulary && res.data.vocabulary.length > 0) {
          setLastTurnVocab(res.data.vocabulary);
        }
      }
    } catch (err) {
      console.error('Error sending message to AI session:', err);
      // Revert/add error alert
      const errorMsg = {
        id: Date.now() + 1,
        role: 'model',
        content: 'Error: Connection lost. Please send your message again.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
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
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      console.error('Error completing session:', err);
      alert('Could not complete the session. Please try again!');
    } finally {
      setIsCompleting(false);
    }
  };

  const playPronunciation = (word) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      const langCodes = {
        Spanish: 'es-ES',
        French: 'fr-FR',
        English: 'en-US',
        German: 'de-DE',
        Arabic: 'ar-SA',
        Italian: 'it-IT'
      };
      utterance.lang = langCodes[selectedLanguage] || 'es-ES';
      window.speechSynthesis.speak(utterance);
    }
  };

  const simBannerMessages = {
    no_api_key: { 
      icon: '🔑', 
      text: 'No active Grok or Gemini API key found. Operating in local simulated fallback mode. Set GROK_API_KEY or GEMINI_API_KEY inside your server .env for live AI tutor.', 
      color: 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400 dark:bg-amber-950/20' 
    }
  };

  return (
    <AppLayout noPadding={isMobile && !!currentSession}>
      {/* Hide header on mobile if session is active to save screen space */}
      {(!isMobile || !currentSession) && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center justify-between w-full md:w-auto">
            <h1 className="text-xl md:text-3xl font-extrabold text-text-main flex items-center gap-2">
              <Bot size={24} className="text-brand-purple md:w-[30px] md:h-[30px]" /> 
              <span>AI Tutor Max</span>
              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-250 shrink-0">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                Online
              </span>
            </h1>
          </div>
          
          <p className="hidden md:block text-brand-dark/50 font-bold text-sm">Improve your real-world conversations and grammar with smart feedback</p>

          {/* Tab Controls (Segmented Control) */}
          {!currentSession && !evaluationResult && (
            <div className="flex bg-brand-gray/30 p-1 rounded-xl border border-border dark:border-border w-full md:w-auto">
              <button
                onClick={() => setActiveTab('practice')}
                className={`flex-1 md:flex-initial text-center justify-center px-4 py-2.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'practice'
                    ? 'bg-white dark:bg-bg-card text-brand-purple shadow-sm'
                    : 'text-brand-dark/60 hover:text-text-main'
                }`}
              >
                <MessageCircle size={14} /> Practice
              </button>
              <button
                onClick={() => setActiveTab('progress')}
                className={`flex-1 md:flex-initial text-center justify-center px-4 py-2.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'progress'
                    ? 'bg-white dark:bg-bg-card text-brand-purple shadow-sm'
                    : 'text-brand-dark/60 hover:text-text-main'
                }`}
              >
                <LineChart size={14} /> Progress Logs
              </button>
            </div>
          )}
        </div>
      )}

      {/* Simulation/Fallback Notice Banner */}
      {simBanner && simBannerMessages[simBanner] && (
        <div className={`mb-5 flex items-start gap-3 px-4 py-3 rounded-2xl border-2 text-xs font-bold ${simBannerMessages[simBanner].color}`}>
          <span className="text-base">{simBannerMessages[simBanner].icon}</span>
          <span className="flex-1 text-[11px] leading-tight">{simBannerMessages[simBanner].text}</span>
          <button onClick={() => setSimBanner(null)} className="opacity-60 hover:opacity-100 transition shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. SETUP SESSION SCREEN                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'practice' && !currentSession && !evaluationResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in-up">
          
          {/* Options (Left Side) */}
          <div className="lg:col-span-1 flex flex-col gap-5">
            {/* Language Selection: Horizontal scroll on mobile, grid on desktop */}
            <div className="bg-white dark:bg-bg-card rounded-2xl border-2 border-border dark:border-border p-4 md:p-5 shadow-3d-card">
              <label className="text-xs font-extrabold text-brand-dark/50 mb-3 uppercase tracking-wide flex items-center gap-2">
                <Globe size={14} className="text-brand-purple" /> Target Language
              </label>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x md:grid md:grid-cols-3 md:gap-2 md:pb-0">
                {Object.entries(langFlags).map(([lang, flag]) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLanguage(lang)}
                    className={`snap-center shrink-0 flex items-center gap-1.5 px-4 py-2 border-2 rounded-xl text-xs font-bold transition-all md:flex-col md:py-2 md:px-1 md:w-auto cursor-pointer ${
                      selectedLanguage === lang
                        ? 'border-brand-purple bg-brand-purple/5 text-brand-purple'
                        : 'border-border dark:border-border text-brand-dark/60 hover:bg-brand-light'
                    }`}
                  >
                    <span className="text-lg md:text-2xl md:mb-1">{flag}</span>
                    <span>{lang}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Adaptivity Level Selection: Pill selector on mobile, list on desktop */}
            <div className="bg-white dark:bg-bg-card rounded-2xl border-2 border-border dark:border-border p-4 md:p-5 shadow-3d-card">
              <label className="text-xs font-extrabold text-brand-dark/50 mb-3 uppercase tracking-wide flex items-center gap-2">
                <Sparkles size={14} className="text-brand-purple" /> AI Adaptivity Level
              </label>
              <div className="grid grid-cols-3 gap-2 md:flex md:flex-col md:gap-2">
                {levels.map((lvl) => (
                  <button
                    key={lvl.id}
                    onClick={() => setSelectedLevel(lvl.id)}
                    className={`flex flex-col items-center justify-center p-2 border-2 rounded-xl text-center transition-all md:text-left md:items-start md:p-3 cursor-pointer ${
                      selectedLevel === lvl.id
                        ? 'border-brand-purple bg-brand-purple/5 text-brand-purple'
                        : 'border-border dark:border-border hover:bg-brand-light text-brand-dark/70'
                    }`}
                  >
                    <div className="text-xs font-black">{lvl.label}</div>
                    <div className="hidden md:block text-[10px] text-brand-dark/50 mt-0.5">{lvl.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Practice Mode Rules (Hidden on mobile to save space) */}
            <div className="hidden md:block bg-gradient-to-br from-brand-purple/5 to-purple-50 rounded-2xl border-2 border-brand-purple/10 p-5 text-brand-dark/70">
              <h4 className="text-xs font-extrabold text-brand-purple flex items-center gap-1.5 uppercase mb-2">
                <Zap size={14} /> Practice Tips
              </h4>
              <ul className="text-xs font-bold space-y-2 leading-relaxed">
                <li>• Write full sentences in <strong>{selectedLanguage}</strong>.</li>
                <li>• Keep vocabulary helpful for the scenario.</li>
                <li>• Click on highlighted vocab words to check pronunciation.</li>
                <li>• Finish practice to claim <strong>XP & Gems</strong>.</li>
              </ul>
            </div>
          </div>

          {/* Scenario Selection (Right Side) */}
          <div className="lg:col-span-2 bg-white dark:bg-bg-card rounded-2xl border-2 border-border dark:border-border p-4 md:p-6 shadow-3d-card flex flex-col justify-between">
            <div>
              <h2 className="text-sm md:text-base font-extrabold text-text-main mb-0.5">Choose a Practice Scenario</h2>
              <p className="text-[11px] md:text-xs font-bold text-brand-dark/40 mb-4">Select a roleplay scenario below to practice speaking with your tutor</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {scenarios.map((scen) => (
                  <button
                    key={scen.id}
                    onClick={() => setSelectedScenario(scen.id)}
                    className={`text-left p-3 md:p-4 rounded-xl border-2 transition-all flex items-center justify-between cursor-pointer ${
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

            <div className="mt-6 flex justify-stretch md:justify-end w-full">
              {user?.hearts?.current === 0 ? (
                <div className="w-full bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                      <Heart className="text-rose-500 fill-rose-500 animate-pulse" size={20} />
                    </div>
                    <div>
                      <p className="font-extrabold text-sm text-text-main">You're out of Hearts</p>
                      <p className="text-xs text-brand-dark/50 font-bold">Wait for them to regenerate or buy a refill.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/buy-gems')}
                    className="w-full md:w-auto bg-brand-purple text-white px-6 py-2.5 rounded-xl font-black text-sm hover:bg-purple-600 transition shadow-sm"
                  >
                    Get Hearts
                  </button>
                </div>
              ) : (
                <button
                  onClick={startPracticeSession}
                  className="w-full md:w-auto bg-brand-purple text-white px-8 py-3.5 rounded-2xl font-black text-sm btn-3d shadow-3d-purple flex items-center justify-center gap-2 hover:bg-purple-600 cursor-pointer"
                >
                  Start AI Practice Session <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CHAT WORKSPACE SCREEN                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'practice' && currentSession && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-6 h-[calc(100dvh-120px)] lg:h-[700px] w-full">
          
          {/* Chat Workspace (Left 2 columns) */}
          <div className={`lg:col-span-2 flex flex-col bg-white dark:bg-bg-card border-0 lg:border-2 border-border shadow-3d-card overflow-hidden h-full ${
            isMobile && activeSessionTab !== 'chat' ? 'hidden' : 'flex'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b-2 border-border bg-brand-light/40 dark:bg-bg-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-brand-purple to-violet-600 rounded-2xl flex items-center justify-center shadow-md">
                  <Bot size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-text-main text-sm flex items-center gap-1.5">
                    {scenarios.find(s => s.id === currentSession.scenario)?.label} 
                    <span className="text-xs text-brand-purple font-bold">({currentSession.level})</span>
                  </h3>
                  <p className="text-xs text-brand-dark/40 font-bold flex items-center gap-1">
                    <span>{langFlags[currentSession.language]}</span>
                    <span>Tutor in {currentSession.language}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={finishPracticeSession}
                  disabled={isCompleting || messages.length < 3}
                  className="bg-brand-purple text-white px-4 py-2 rounded-xl text-xs font-extrabold hover:bg-purple-600 disabled:opacity-40 transition-all shadow-sm"
                  title="Needs at least a few messages before completing"
                >
                  {isCompleting ? 'Evaluating...' : 'Finish & Get Feedback'}
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to exit? Your conversation progress won\'t be saved.')) {
                      setCurrentSession(null);
                      setMessages([]);
                    }
                  }}
                  className="p-2 text-brand-dark/40 hover:text-text-main hover:bg-brand-gray/20 rounded-xl transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Mobile Active Session Tab Switcher */}
            {isMobile && (
              <div className="flex bg-bg-main dark:bg-bg-main/30 border-b border-border p-1">
                <button
                  type="button"
                  onClick={() => setActiveSessionTab('chat')}
                  className={`flex-1 py-2 font-black text-[10px] uppercase tracking-wider text-center rounded-xl transition ${
                    activeSessionTab === 'chat'
                      ? 'bg-white dark:bg-bg-card text-brand-purple border border-border shadow-sm font-extrabold'
                      : 'text-text-secondary hover:text-text-main'
                  }`}
                >
                  💬 Chat
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSessionTab('vocab')}
                  className={`flex-1 py-2 font-black text-[10px] uppercase tracking-wider text-center rounded-xl transition ${
                    activeSessionTab === 'vocab'
                      ? 'bg-white dark:bg-bg-card text-brand-purple border border-border shadow-sm font-extrabold'
                      : 'text-text-secondary hover:text-text-main'
                  }`}
                >
                  📚 Vocabulary
                </button>
              </div>
            )}

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-slate-50/50 dark:bg-slate-950/20">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div key={msg.id || msg._id} className={`flex gap-3 items-end ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                      isUser ? 'bg-brand-green text-white font-extrabold' : 'bg-gradient-to-br from-brand-purple to-violet-600 text-white'
                    }`}>
                      {isUser ? <User size={15} /> : <Bot size={15} />}
                    </div>
                    
                    <div className="flex flex-col gap-1 max-w-[75%]">
                      <div className={`px-4 py-3 rounded-2xl text-sm font-semibold leading-relaxed ${
                        isUser 
                          ? 'bg-brand-green text-white rounded-br-sm shadow-sm'
                          : 'bg-white dark:bg-bg-card border-2 border-border text-text-main rounded-bl-sm shadow-sm'
                      }`}>
                        <p className="whitespace-pre-line">{msg.content}</p>
                      </div>

                      {/* Display warning badge if errors found on user response in real time */}
                      {isUser && lastTurnGrammar.length > 0 && messages[messages.length - 1] === msg && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl mt-1 text-xs font-semibold animate-pulse">
                          <div className="flex items-center gap-1.5 mb-1 font-bold">
                            <AlertTriangle size={13} /> Grammar Warning
                          </div>
                          {lastTurnGrammar.map((mistake, idx) => (
                            <div key={idx} className="space-y-1">
                              <p className="text-[11px]"><span className="line-through text-red-400">"{mistake.original}"</span> → <span className="font-extrabold text-green-600">"{mistake.correction}"</span></p>
                              <p className="text-[10px] text-red-600/80 italic font-medium">{mistake.explanation}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex gap-3 items-end">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-purple to-violet-600 flex items-center justify-center shadow-sm">
                    <Bot size={15} className="text-white" />
                  </div>
                  <div className="bg-white dark:bg-bg-card border-2 border-border dark:border-border rounded-2xl rounded-bl-sm px-4 py-3.5 shadow-sm">
                    <div className="flex gap-1.5 items-center">
                      <span className="w-2 h-2 bg-brand-purple/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-brand-purple/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-brand-purple/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="border-t-2 border-border p-4 bg-white dark:bg-bg-card relative">
              
              {/* Inline Grammar Feedback bubble */}
              {inlineGrammarFeedback && (
                <div className="absolute bottom-20 left-4 right-4 bg-slate-800 text-white p-3.5 rounded-2xl shadow-xl z-20 border border-slate-700 animate-fade-in-up text-xs font-semibold">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-extrabold text-indigo-400 flex items-center gap-1">
                      ✨ Inline Grammar Review
                    </span>
                    <button onClick={() => setInlineGrammarFeedback(null)} className="text-white/40 hover:text-white">
                      <X size={14} />
                    </button>
                  </div>
                  {inlineGrammarFeedback.hasErrors ? (
                    <div className="space-y-1">
                      <p><span className="line-through text-red-300">"{input}"</span> → <span className="text-green-400 font-extrabold">"{inlineGrammarFeedback.correction}"</span></p>
                      <p className="text-white/70 italic font-medium mt-1">{inlineGrammarFeedback.explanation}</p>
                      {inlineGrammarFeedback.suggestions?.length > 0 && (
                        <p className="text-[10px] text-white/50">💡 Alternative: "{inlineGrammarFeedback.suggestions[0]}"</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-green-400">✨ Great! No errors found. Send it away!</p>
                  )}
                </div>
              )}

              <div className="flex gap-2.5">
                <div className="flex-1 relative flex items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      if (inlineGrammarFeedback) setInlineGrammarFeedback(null);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder={`Reply to tutor in ${currentSession.language}... (Press Enter)`}
                    disabled={isTyping}
                    className="w-full pl-4 pr-12 py-3.5 border-2 border-border dark:border-border/50 rounded-2xl text-sm font-semibold outline-none focus:border-brand-purple disabled:opacity-40 transition bg-bg-main/30 dark:bg-bg-main/10 text-text-main"
                  />
                  <button
                    onClick={checkGrammarOfInput}
                    disabled={!input.trim() || checkingGrammar}
                    className="absolute right-3.5 text-brand-purple hover:scale-110 disabled:opacity-30 transition p-1 hover:bg-brand-purple/5 rounded-lg"
                    title="Check grammar before sending"
                  >
                    {checkingGrammar ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Sparkles className="w-5 h-5" />
                    )}
                  </button>
                </div>

                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isTyping}
                  className="bg-brand-purple text-white px-5 py-3.5 rounded-2xl font-extrabold text-sm flex items-center gap-2 btn-3d shadow-3d-purple disabled:opacity-30 transition hover:bg-purple-600"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Vocabulary & Grammar sidebar (Right 1 column) */}
          <div className={`lg:col-span-1 flex flex-col gap-4 h-full ${
            isMobile && activeSessionTab !== 'vocab' ? 'hidden' : 'flex'
          }`}>
            {/* Real-time Vocabulary Highlight Panel */}
            <div className="bg-white dark:bg-bg-card rounded-3xl border-2 border-border p-5 shadow-3d-card flex flex-col flex-1 overflow-hidden">
              <h4 className="text-xs font-extrabold text-brand-dark/50 mb-3.5 uppercase tracking-wide flex items-center gap-2">
                <BookOpen size={14} className="text-brand-purple" /> Vocabulary Companion
              </h4>

              {/* Custom Dictionary Search Lookup */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={dictInput}
                  onChange={(e) => setDictInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && lookupWord()}
                  placeholder="Look up any word..."
                  className="flex-1 px-3 py-2 border-2 border-border rounded-xl text-xs font-bold outline-none focus:border-brand-purple transition bg-bg-main/30 dark:bg-bg-main/10 text-text-main"
                />
                <button
                  onClick={() => lookupWord()}
                  disabled={!dictInput.trim() || searchingDict}
                  className="bg-brand-purple text-white px-3 py-2 rounded-xl text-xs font-extrabold hover:bg-purple-600 disabled:opacity-40 transition"
                >
                  {searchingDict ? '...' : 'Search'}
                </button>
              </div>

              {lastTurnVocab.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-brand-dark/40 font-semibold">
                  <BookOpen size={36} className="text-brand-gray mb-3 opacity-60" />
                  <p className="text-xs">Useful vocabulary words will appear here as you converse with the AI, or search above.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
                  <p className="text-[10px] font-bold text-brand-purple/70 bg-brand-purple/5 border border-brand-purple/10 px-2.5 py-1.5 rounded-lg mb-2">
                    💡 Click on any word to check pronunciation and hear it spoken!
                  </p>
                  {lastTurnVocab.map((vocab, index) => (
                    <div 
                      key={index} 
                      onClick={() => {
                        setFocusedVocab(vocab);
                        playPronunciation(vocab.word);
                      }}
                      className={`p-3.5 rounded-xl border-2 text-left cursor-pointer transition-all hover:bg-brand-light ${
                        focusedVocab?.word === vocab.word ? 'border-brand-purple bg-brand-purple/5' : 'border-border dark:border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-text-main flex items-center gap-1">
                          {vocab.word} <Volume2 size={13} className="text-brand-purple/70" />
                        </span>
                        <span className="text-[10px] bg-brand-gray/40 text-brand-dark/60 font-extrabold px-2 py-0.5 rounded-full">
                          {vocab.pronunciation || 'Phonetics'}
                        </span>
                      </div>
                      <p className="text-xs text-brand-dark/60 font-bold mt-1">{vocab.translation}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Word details Modal/Panel if clicked */}
            {focusedVocab && (
              <div className="bg-gradient-to-br from-brand-purple to-violet-700 text-white rounded-3xl p-5 shadow-3d-purple relative animate-fade-in-up text-xs font-semibold">
                <button 
                  onClick={() => setFocusedVocab(null)}
                  className="absolute top-4 right-4 text-white/70 hover:text-white"
                >
                  <X size={16} />
                </button>
                <div className="flex items-center gap-2 mb-2">
                  <Volume2 
                    size={20} 
                    className="cursor-pointer bg-white/20 hover:bg-white/30 p-1 rounded-lg transition"
                    onClick={() => playPronunciation(focusedVocab.word)}
                  />
                  <span className="text-[10px] font-black tracking-wide uppercase text-white/75">
                    {focusedVocab.isSearchLookup ? '🔍 Dictionary Entry' : '📝 Vocab Companion'}
                  </span>
                </div>
                <h3 className="text-lg font-black">{focusedVocab.word}</h3>
                {focusedVocab.pronunciation && (
                  <p className="text-[10px] italic text-white/80 font-bold mt-0.5">[{focusedVocab.pronunciation}]</p>
                )}
                
                <div className="mt-3.5 border-t border-white/20 pt-3">
                  <p className="text-[9px] font-black text-white/60 uppercase tracking-wider">Meaning & Translation</p>
                  <p className="text-sm font-extrabold">{focusedVocab.translation}</p>
                  {focusedVocab.meaning && (
                    <p className="text-[11px] text-white/80 mt-1 font-semibold leading-relaxed">{focusedVocab.meaning}</p>
                  )}
                </div>

                {focusedVocab.guide && (
                  <div className="mt-3 border-t border-white/15 pt-2.5">
                    <p className="text-[9px] font-black text-white/60 uppercase tracking-wider">Pronunciation Guide</p>
                    <p className="text-[11px] text-white/85 mt-0.5 leading-relaxed">{focusedVocab.guide}</p>
                  </div>
                )}

                {focusedVocab.synonyms && focusedVocab.synonyms.length > 0 && (
                  <div className="mt-3 border-t border-white/15 pt-2.5">
                    <p className="text-[9px] font-black text-white/60 uppercase tracking-wider">Synonyms</p>
                    <p className="text-[11px] text-white font-extrabold mt-0.5">
                      {focusedVocab.synonyms.join(', ')}
                    </p>
                  </div>
                )}

                {focusedVocab.example && (
                  <div className="mt-3 border-t border-white/15 pt-2.5">
                    <p className="text-[9px] font-black text-white/60 uppercase tracking-wider">Context Example</p>
                    <p className="text-[11px] font-bold mt-1 bg-white/10 p-2.5 rounded-xl border border-white/10 leading-relaxed">
                      {focusedVocab.example}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SESSION COMPLETION FEEDBACK SCREEN                                     */}
      {/* ========================================================================= */}
      {evaluationResult && (
        <div className="max-w-4xl mx-auto bg-white dark:bg-bg-card rounded-3xl border-2 border-border dark:border-border p-6 md:p-8 shadow-3d-card fade-in-up">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-brand-green/10 border-2 border-brand-green/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Trophy size={32} className="text-brand-green" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-text-main">Conversation Evaluation</h2>
            <p className="text-brand-dark/40 font-bold text-sm mt-1">Excellent! You completed your practice session</p>

            {/* Rewards pop badges */}
            <div className="flex items-center justify-center gap-3.5 mt-5">
              <span className="bg-brand-green/10 border border-brand-green/20 text-brand-green font-extrabold text-xs px-4 py-2 rounded-2xl flex items-center gap-1.5 shadow-sm xp-pop">
                <Sparkle size={13} /> +25 XP
              </span>
              <span className="bg-amber-100 border border-amber-200 text-amber-800 font-extrabold text-xs px-4 py-2 rounded-2xl flex items-center gap-1.5 shadow-sm xp-pop animate-delay-100">
                <Zap size={13} /> +10 Gems
              </span>
            </div>
          </div>

          {/* Score Circle Progress Bars */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Fluency', score: evaluationResult.score?.fluency || 70, color: 'text-brand-purple', bg: 'bg-brand-purple/10' },
              { label: 'Grammar', score: evaluationResult.score?.grammar || 70, color: 'text-brand-green', bg: 'bg-brand-green/10' },
              { label: 'Vocabulary', score: evaluationResult.score?.vocabulary || 70, color: 'text-cyan-600', bg: 'bg-cyan-50' }
            ].map((ring, idx) => (
              <div key={idx} className="bg-brand-light/50 border-2 border-border dark:border-border rounded-2xl p-4 text-center">
                <span className="text-xs font-extrabold text-brand-dark/50 block mb-2">{ring.label}</span>
                <div className={`inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full font-black text-sm md:text-base ${ring.bg} ${ring.color}`}>
                  {ring.score}%
                </div>
              </div>
            ))}
          </div>

          {/* Tutors Overall Suggestions */}
          <div className="bg-brand-light border-2 border-border dark:border-border rounded-2xl p-5 mb-8">
            <h3 className="font-extrabold text-sm text-text-main flex items-center gap-1.5 mb-2.5">
              <Bot size={16} className="text-brand-purple" /> Tutor's Suggestions
            </h3>
            <p className="text-xs font-semibold text-brand-dark/70 leading-relaxed">
              {evaluationResult.feedback?.suggestions || 'No feedback loaded. Keep practicing to build confidence!'}
            </p>
          </div>

          {/* Collapsible Grammar Mistake Table */}
          <div className="mb-8">
            <h3 className="font-extrabold text-sm text-text-main flex items-center gap-2 mb-3">
              <ShieldAlert size={16} className="text-red-500" /> Grammar Mistakes Cleared ({evaluationResult.feedback?.grammarMistakes?.length || 0})
            </h3>
            
            {!evaluationResult.feedback?.grammarMistakes || evaluationResult.feedback.grammarMistakes.length === 0 ? (
              <p className="text-xs font-bold text-brand-dark/40 bg-brand-light p-4 rounded-2xl text-center border-2 border-dashed border-border dark:border-border">
                ✨ Perfect! No grammar mistakes were detected during this session.
              </p>
            ) : (
              <div className="border border-border dark:border-border rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-brand-light/50 border-b border-border dark:border-border font-extrabold text-brand-dark/50">
                      <th className="p-3">Original</th>
                      <th className="p-3">Correction</th>
                      <th className="p-3">Explanation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-gray/10 font-bold">
                    {evaluationResult.feedback.grammarMistakes.map((m, idx) => (
                      <tr key={idx} className="hover:bg-brand-light/30">
                        <td className="p-3 text-red-500 line-through">"{m.original}"</td>
                        <td className="p-3 text-brand-green font-extrabold">"{m.correction}"</td>
                        <td className="p-3 text-brand-dark/60 font-semibold italic text-[11px]">{m.explanation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recommended vocabulary list */}
          <div className="mb-8">
            <h3 className="font-extrabold text-sm text-text-main flex items-center gap-2 mb-3.5">
              <BookOpen size={16} className="text-brand-purple" /> Recommended Study Words
            </h3>

            {!evaluationResult.feedback?.recommendedVocab || evaluationResult.feedback.recommendedVocab.length === 0 ? (
              <p className="text-xs font-bold text-brand-dark/40 bg-brand-light p-4 rounded-2xl text-center">
                No recommended vocabulary generated.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {evaluationResult.feedback.recommendedVocab.map((vocab, idx) => (
                  <div key={idx} className="bg-brand-light/50 border-2 border-border dark:border-border rounded-xl p-3.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-text-main">{vocab.word}</span>
                        <Volume2 
                          size={13} 
                          className="text-brand-purple/70 cursor-pointer hover:scale-110" 
                          onClick={() => playPronunciation(vocab.word)}
                        />
                      </div>
                      <p className="text-xs text-brand-dark/50 font-extrabold mt-0.5">{vocab.translation}</p>
                    </div>
                    {vocab.example && (
                      <p className="text-[10px] text-brand-dark/70 font-semibold mt-2 border-t border-border dark:border-border pt-2 italic">
                        "{vocab.example}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={() => {
                setEvaluationResult(null);
                setActiveTab('practice');
              }}
              className="bg-brand-purple text-white px-8 py-3.5 rounded-xl font-extrabold text-sm btn-3d shadow-3d-purple"
            >
              Back to Scenarios
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. PROGRESS LOGS & STATS TAB                                              */}
      {/* ========================================================================= */}
      {activeTab === 'progress' && !currentSession && !evaluationResult && (
        <div className="space-y-6 fade-in-up">
          {loadingStats ? (
            <div className="flex flex-col items-center justify-center py-20 text-brand-dark/40 font-bold">
              <div className="w-10 h-10 border-4 border-brand-purple border-t-transparent rounded-full animate-spin mb-4" />
              <span>Fetching progress metrics...</span>
            </div>
          ) : !stats || stats.totalSessions === 0 ? (
            <div className="bg-white dark:bg-bg-card rounded-3xl border-2 border-border dark:border-border p-12 text-center shadow-3d-card">
              <Award size={48} className="text-brand-purple/40 mx-auto mb-4" />
              <h3 className="text-lg font-extrabold text-text-main mb-1">No Practice History Yet</h3>
              <p className="text-xs font-bold text-brand-dark/40 max-w-sm mx-auto mb-6 leading-relaxed">
                Complete your first conversation practice session with the AI Tutor to start tracking scores and review vocab mistakes over time.
              </p>
              <button
                onClick={() => setActiveTab('practice')}
                className="bg-brand-purple text-white px-6 py-3 rounded-xl text-xs font-extrabold btn-3d shadow-3d-purple"
              >
                Practice Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Stats overview (Left side) */}
              <div className="lg:col-span-1 space-y-5">
                {/* Score meters */}
                <div className="bg-white dark:bg-bg-card rounded-3xl border-2 border-border dark:border-border p-5 shadow-3d-card">
                  <h3 className="text-xs font-extrabold text-brand-dark/50 mb-4 uppercase tracking-wide flex items-center gap-2">
                    <Trophy size={14} className="text-brand-purple" /> Performance Indicators
                  </h3>

                  <div className="space-y-4 font-bold text-xs">
                    <div>
                      <div className="flex justify-between text-brand-dark/80 mb-1.5">
                        <span>Average Fluency</span>
                        <span>{stats.averageFluency}%</span>
                      </div>
                      <div className="w-full bg-brand-gray/30 h-3 rounded-full overflow-hidden">
                        <div className="bg-brand-purple h-full rounded-full transition-all duration-500" style={{ width: `${stats.averageFluency}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-brand-dark/80 mb-1.5">
                        <span>Average Grammar</span>
                        <span>{stats.averageGrammar}%</span>
                      </div>
                      <div className="w-full bg-brand-gray/30 h-3 rounded-full overflow-hidden">
                        <div className="bg-brand-green h-full rounded-full transition-all duration-500" style={{ width: `${stats.averageGrammar}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-brand-dark/80 mb-1.5">
                        <span>Average Vocabulary</span>
                        <span>{stats.averageVocabulary}%</span>
                      </div>
                      <div className="w-full bg-brand-gray/30 h-3 rounded-full overflow-hidden">
                        <div className="bg-cyan-500 h-full rounded-full transition-all duration-500" style={{ width: `${stats.averageVocabulary}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendations card */}
                <div className="bg-gradient-to-br from-brand-purple/5 to-purple-50 rounded-3xl border-2 border-brand-purple/15 p-5">
                  <h3 className="text-xs font-extrabold text-brand-purple mb-3 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles size={14} /> Weak Area Insights
                  </h3>
                  <p className="text-xs font-semibold text-brand-dark/70 leading-relaxed mb-4">
                    Based on your grammar checks and fluency trends, our AI suggests practicing the following scenarios next:
                  </p>
                  <div className="space-y-2">
                    {stats.recommendedPractice?.map((scen, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedScenario(scen);
                          setActiveTab('practice');
                        }}
                        className="w-full text-left bg-white dark:bg-bg-card border border-border dark:border-border rounded-xl p-3 text-xs font-bold text-text-main hover:border-brand-purple transition-all flex items-center justify-between"
                      >
                        <span>{scenarios.find(s => s.id === scen)?.label || scen}</span>
                        <ChevronRight size={14} className="text-brand-purple" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Log Details (Right side) */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Past sessions log */}
                <div className="bg-white dark:bg-bg-card rounded-3xl border-2 border-border dark:border-border p-5 shadow-3d-card">
                  <h3 className="text-xs font-extrabold text-brand-dark/50 mb-3.5 uppercase tracking-wide">
                    Practice History ({historySessions.length})
                  </h3>

                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {historySessions.map((session) => (
                      <div 
                        key={session._id}
                        onClick={() => setSelectedHistorySession(selectedHistorySession?._id === session._id ? null : session)}
                        className={`p-3.5 border-2 rounded-2xl cursor-pointer transition-all hover:bg-brand-light/40 text-xs font-semibold ${
                          selectedHistorySession?._id === session._id ? 'border-brand-purple bg-brand-purple/5' : 'border-border dark:border-border'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-extrabold text-text-main text-sm">
                            {scenarios.find(s => s.id === session.scenario)?.label || session.scenario}
                          </span>
                          <span className="text-[10px] text-brand-dark/40 font-bold">
                            {new Date(session.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-brand-dark/60">
                          <span>Lang: {session.language}</span>
                          <span>Level: {session.level || 'Intermediate'}</span>
                          <span className="text-brand-purple font-extrabold">
                            Score: {Math.round(((session.score?.fluency || 0) + (session.score?.grammar || 0) + (session.score?.vocabulary || 0)) / 3)}%
                          </span>
                        </div>

                        {/* Collapsed feedback display */}
                        {selectedHistorySession?._id === session._id && (
                          <div className="mt-3.5 border-t border-border dark:border-border pt-3.5 text-xs text-brand-dark/80 font-normal leading-relaxed animate-fade-in-up space-y-3">
                            <p><strong>Tutor Notes:</strong> {session.feedback?.suggestions || 'Keep it up!'}</p>
                            
                            {session.feedback?.grammarMistakes?.length > 0 && (
                              <div>
                                <strong className="text-red-600 block mb-1">Grammar Corrections:</strong>
                                <ul className="space-y-1 text-[11px] list-disc list-inside">
                                  {session.feedback.grammarMistakes.map((m, i) => (
                                    <li key={i}>
                                      <span className="line-through text-red-400">"{m.original}"</span> → <span className="font-extrabold text-green-600">"{m.correction}"</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Vocabulary logs */}
                <div className="bg-white dark:bg-bg-card rounded-3xl border-2 border-border dark:border-border p-5 shadow-3d-card">
                  <h3 className="text-xs font-extrabold text-brand-dark/50 mb-3.5 uppercase tracking-wide flex items-center gap-1.5">
                    <BookOpen size={14} className="text-brand-purple" /> Saved Vocabulary Study Desk
                  </h3>

                  {stats.savedVocab?.length === 0 ? (
                    <p className="text-xs font-bold text-brand-dark/40 py-6 text-center">No words collected yet. Start practice to build your library.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
                      {stats.savedVocab.map((vocab, index) => (
                        <div 
                          key={index} 
                          onClick={() => playPronunciation(vocab.word)}
                          className="p-3 border border-border dark:border-border rounded-xl hover:bg-brand-light transition cursor-pointer flex justify-between items-center"
                        >
                          <div className="truncate">
                            <span className="font-extrabold text-xs text-text-main block truncate">{vocab.word}</span>
                            <span className="text-[10px] text-brand-dark/50 block truncate">{vocab.translation}</span>
                          </div>
                          <Volume2 size={11} className="text-brand-purple/60 flex-shrink-0 ml-1.5" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
};

export default AITutor;
