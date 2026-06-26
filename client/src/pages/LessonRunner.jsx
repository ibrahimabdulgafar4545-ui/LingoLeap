import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLearning } from '../context/LearningContext';
import { useAuth } from '../context/AuthContext';
import { allAchievements } from './Achievements';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { X, CheckCircle, XCircle, ChevronRight, Star, Zap, RotateCcw, Volume2, Mic, Square, AlertCircle, Heart, Gem, Award, Sparkles, RefreshCw } from 'lucide-react';
import api from '../services/api';

// --- Progress bar at top of lesson ---
const LessonProgressBar = ({ current, total }) => {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="w-full bg-brand-gray/30 rounded-full h-4 overflow-hidden">
      <div
        className="h-4 bg-gradient-to-r from-brand-green to-green-400 rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

// --- Text-to-Speech Button ---
const PlayAudioButton = ({ text, language }) => {
  const play = (e) => {
    e.stopPropagation();
    const utterance = new SpeechSynthesisUtterance(text);
    const langMap = {
      Spanish: 'es-ES',
      French: 'fr-FR',
      German: 'de-DE',
      Italian: 'it-IT',
      English: 'en-US',
      Arabic: 'ar-SA'
    };
    utterance.lang = langMap[language] || 'es-ES';
    
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith(utterance.lang.substring(0, 2)));
    if (voice) utterance.voice = voice;

    window.speechSynthesis.speak(utterance);
  };

  return (
    <button
      onClick={play}
      className="p-1 text-brand-purple hover:bg-brand-purple/10 rounded-full border border-brand-purple/20 transition cursor-pointer flex items-center justify-center flex-shrink-0"
      title="Listen to pronunciation"
    >
      <Volume2 size={14} />
    </button>
  );
};

// --- Error Boundary for Questions ---
class QuestionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error rendering question:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-rose-50 border-2 border-rose-200 text-rose-700 rounded-2xl flex flex-col gap-3 shadow-sm dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400">
          <div className="flex items-center gap-2 font-extrabold text-sm text-rose-800 dark:text-rose-300">
            <AlertCircle size={18} />
            <span>Failed to load this question</span>
          </div>
          <p className="text-xs font-semibold text-rose-600/80 dark:text-rose-400/80">
            An error occurred while loading this question component: {this.state.error?.message || "Unknown error"}
          </p>
          <div className="flex justify-end mt-2">
            <button
              type="button"
              onClick={this.props.onSkip}
              className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow-md transition cursor-pointer"
            >
              Skip Question
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Individual question renderers ---

const MultipleChoice = ({ question, answered, selectedAnswer, setSelectedAnswer, language }) => (
  <div className="flex flex-col gap-3">
    <div className="flex items-center gap-2 mb-2">
      <h2 className="text-xl font-extrabold text-text-main">{question.prompt}</h2>
      <PlayAudioButton text={question.prompt} language={language} />
    </div>
    {(question.options || []).map((opt) => {
      let style = 'border-border dark:border-border bg-white dark:bg-bg-card text-text-main hover:bg-brand-light hover:border-brand-blue/50';
      if (answered) {
        const correctAns = question.correctAnswer || question.answer;
        if (opt === correctAns) style = 'border-brand-green bg-brand-green/10 text-brand-green';
        else if (opt === selectedAnswer && opt !== correctAns) style = 'border-brand-red bg-brand-red/10 text-brand-red';
        else style = 'border-border dark:border-border bg-brand-light/50 text-brand-dark/40';
      } else {
        if (opt === selectedAnswer) style = 'border-brand-blue bg-brand-blue/10 text-brand-blue shadow-3d-blue';
      }
      return (
        <button
          key={opt}
          type="button"
          onClick={() => !answered && setSelectedAnswer(opt)}
          disabled={answered}
          className={`w-full p-4 border-2 rounded-2xl text-sm font-bold text-left transition-all duration-150 btn-3d shadow-3d-card ${style}`}
        >
          {opt}
        </button>
      );
    })}
  </div>
);

const FillBlank = ({ question, answered, userInput, setUserInput, language, onSubmit }) => (
  <div className="flex flex-col gap-3">
    <div className="flex items-center gap-2 mb-2">
      <h2 className="text-xl font-extrabold text-text-main">{question.prompt}</h2>
      <PlayAudioButton text={question.prompt} language={language} />
    </div>
    <input
      type="text"
      value={userInput}
      onChange={(e) => !answered && setUserInput(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onSubmit && onSubmit();
        }
      }}
      disabled={answered}
      placeholder="Type your answer..."
      className="w-full p-4 border-2 border-border dark:border-border rounded-2xl font-semibold text-text-main outline-none focus:border-brand-blue text-sm bg-white dark:bg-bg-card"
    />
  </div>
);

const TrueFalse = ({ question, answered, selectedAnswer, setSelectedAnswer, language }) => {
  const options = ['True', 'False'];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-xl font-extrabold text-text-main">{question.prompt}</h2>
        <PlayAudioButton text={question.prompt} language={language} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {options.map((opt) => {
          let style = 'border-border dark:border-border bg-white dark:bg-bg-card text-text-main hover:bg-brand-light';
          if (answered) {
            const isCorrectOpt = opt.toLowerCase() === (question.correctAnswer || question.answer || '').toLowerCase();
            const isSelectedOpt = opt.toLowerCase() === (selectedAnswer || '').toLowerCase();
            if (isCorrectOpt) style = 'border-brand-green bg-brand-green/10 text-brand-green';
            else if (isSelectedOpt && !isCorrectOpt) style = 'border-brand-red bg-brand-red/10 text-brand-red';
            else style = 'border-border dark:border-border bg-brand-light/50 text-brand-dark/40';
          } else {
            if (opt === selectedAnswer) style = 'border-brand-blue bg-brand-blue/10 text-brand-blue shadow-3d-blue';
          }
          return (
            <button
              key={opt}
              type="button"
              onClick={() => !answered && setSelectedAnswer(opt)}
              disabled={answered}
              className={`p-6 border-2 rounded-2xl text-lg font-extrabold text-center transition btn-3d shadow-3d-card ${style}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const Translate = ({ question, answered, userInput, setUserInput, language, onSubmit }) => (
  <div className="flex flex-col gap-4">
    <div className="flex items-center gap-2">
      <h2 className="text-xl font-extrabold text-text-main">{question.prompt}</h2>
      <PlayAudioButton text={question.prompt} language={language} />
    </div>
    <textarea
      value={userInput}
      onChange={(e) => !answered && setUserInput(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          onSubmit && onSubmit();
        }
      }}
      disabled={answered}
      placeholder="Type your translation here..."
      rows={3}
      className="w-full p-4 border-2 border-border dark:border-border rounded-2xl font-semibold text-text-main outline-none focus:border-brand-blue resize-none text-sm bg-white dark:bg-bg-card"
    />
  </div>
);

const SpeakQuestion = ({ question, answered, selectedAnswer, setSelectedAnswer, language }) => {
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = React.useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch(e) {}
      }
    };
  }, []);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch(e) {}
    }

    const rec = new SpeechRecognition();
    recognitionRef.current = rec;
    rec.continuous = false;
    rec.interimResults = false;
    const langMap = {
      Spanish: 'es-ES',
      French: 'fr-FR',
      German: 'de-DE',
      Italian: 'it-IT',
      English: 'en-US',
      Arabic: 'ar-SA'
    };
    rec.lang = langMap[language] || 'es-ES';

    rec.onstart = () => {
      setIsListening(true);
      setMicError(null);
      setSelectedAnswer('');
    };

    rec.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setMicError('Microphone access blocked. Please enable it in browser settings.');
      } else if (event.error === 'no-speech') {
        setMicError('No speech detected. Please try again.');
      } else {
        setMicError(`Speech error: ${event.error}`);
      }
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    rec.onresult = (event) => {
      const resultText = event.results[0][0].transcript;
      setSelectedAnswer(resultText);
    };

    try {
      rec.start();
    } catch (err) {
      console.error(err);
    }
  };

  const playTTS = () => {
    const utterance = new SpeechSynthesisUtterance(question.correctAnswer || question.answer || '');
    const langMap = {
      Spanish: 'es-ES',
      French: 'fr-FR',
      German: 'de-DE',
      Italian: 'it-IT',
      English: 'en-US',
      Arabic: 'ar-SA'
    };
    utterance.lang = langMap[language] || 'es-ES';
    
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith(utterance.lang.substring(0, 2)));
    if (voice) utterance.voice = voice;

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-extrabold text-text-main">{question.prompt}</h2>
        <button
          type="button"
          onClick={playTTS}
          className="flex items-center gap-1.5 text-xs font-bold text-brand-purple bg-brand-purple/10 border-2 border-brand-purple/20 px-3 py-1.5 rounded-full hover:bg-brand-purple/20 transition cursor-pointer"
        >
          <Volume2 size={14} /> Listen
        </button>
      </div>

      <div className="bg-brand-light/60 dark:bg-brand-gray/5 border-2 border-border dark:border-border rounded-2xl p-5 text-center flex flex-col items-center justify-center gap-3">
        <div className="text-lg font-extrabold text-text-main italic bg-white dark:bg-bg-card border border-border dark:border-border px-4 py-2.5 rounded-2xl shadow-sm">
          "{question.correctAnswer || question.answer}"
        </div>
        
        {selectedAnswer && (
          <div className="mt-2 w-full text-center">
            <p className="text-[10px] font-extrabold text-brand-dark/40 uppercase tracking-wider">You said:</p>
            <p className="text-md font-bold text-brand-blue italic">"{selectedAnswer}"</p>
          </div>
        )}

        {micError && (
          <div className="flex items-center gap-2 text-xs font-bold text-brand-red bg-brand-red/10 border border-brand-red/20 px-3 py-2 rounded-xl mt-1">
            <AlertCircle size={14} />
            <span>{micError}</span>
          </div>
        )}
      </div>

      {!isSupported && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-2xl p-4 text-xs font-bold flex flex-col gap-2">
          <span>⚠️ Voice recognition is not supported on this browser (use Chrome or Edge). You can still proceed manually:</span>
          {!answered && (
            <button
              type="button"
              onClick={() => setSelectedAnswer(question.correctAnswer || question.answer)}
              className="bg-brand-green text-white font-extrabold py-3 px-8 rounded-2xl btn-3d shadow-3d-green text-xs w-full cursor-pointer"
            >
              Use Correct Answer text ✓
            </button>
          )}
        </div>
      )}

      {isSupported && !answered && (
        <div className="flex flex-col gap-2 items-center">
          {isListening ? (
            <button
              type="button"
              disabled
              className="w-full flex items-center justify-center gap-2 bg-brand-red text-white font-extrabold py-4 px-8 rounded-2xl btn-3d shadow-3d-red text-sm animate-pulse cursor-not-allowed"
            >
              <Square size={16} /> Recording... Speak Now
            </button>
          ) : (
            <button
              type="button"
              onClick={startListening}
              className="w-full flex items-center justify-center gap-2 bg-brand-blue text-white font-extrabold py-4 px-8 rounded-2xl btn-3d shadow-3d-blue text-sm cursor-pointer"
            >
              <Mic size={16} /> Click to Record & Speak
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const ListenQuestion = ({ question, answered, selectedAnswer, setSelectedAnswer, userInput, setUserInput, language, onSubmit }) => {
  const playTTS = useCallback(() => {
    const textToPlay = question.audioText || question.prompt || question.correctAnswer || question.answer || "";
    if (!textToPlay) return;
    const utterance = new SpeechSynthesisUtterance(textToPlay);
    const langMap = {
      Spanish: 'es-ES',
      French: 'fr-FR',
      German: 'de-DE',
      Italian: 'it-IT',
      English: 'en-US',
      Arabic: 'ar-SA'
    };
    utterance.lang = langMap[language] || 'es-ES';
    
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith(utterance.lang.substring(0, 2)));
    if (voice) utterance.voice = voice;

    window.speechSynthesis.speak(utterance);
  }, [question, language]);

  useEffect(() => {
    playTTS();
  }, [playTTS]);

  const hasOptions = question.options && question.options.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center justify-center p-6 bg-brand-light/60 dark:bg-brand-gray/5 border-2 border-border dark:border-border rounded-3xl gap-3">
        <button
          type="button"
          onClick={playTTS}
          className="w-20 h-20 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-full flex items-center justify-center shadow-3d-purple transition cursor-pointer transform hover:scale-105"
          title="Play Audio"
        >
          <Volume2 size={36} />
        </button>
        <span className="text-xs font-bold text-brand-purple">Click to play audio</span>
      </div>

      {hasOptions ? (
        <div className="flex flex-col gap-3">
          {question.options.map((opt) => {
            let style = 'border-border dark:border-border bg-white dark:bg-bg-card text-text-main hover:bg-brand-light hover:border-brand-blue/50';
            if (answered) {
              const correctAns = question.correctAnswer || question.answer;
              if (opt === correctAns) style = 'border-brand-green bg-brand-green/10 text-brand-green';
              else if (opt === selectedAnswer && opt !== correctAns) style = 'border-brand-red bg-brand-red/10 text-brand-red';
              else style = 'border-border dark:border-border bg-brand-light/50 text-brand-dark/40';
            } else {
              if (opt === selectedAnswer) style = 'border-brand-blue bg-brand-blue/10 text-brand-blue shadow-3d-blue';
            }
            return (
              <button
                key={opt}
                type="button"
                onClick={() => !answered && setSelectedAnswer(opt)}
                disabled={answered}
                className={`w-full p-4 border-2 rounded-2xl text-sm font-bold text-left transition-all duration-150 btn-3d shadow-3d-card ${style}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      ) : (
        <input
          type="text"
          value={userInput}
          onChange={(e) => !answered && setUserInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onSubmit && onSubmit();
            }
          }}
          disabled={answered}
          placeholder="Type what you hear..."
          className="w-full p-4 border-2 border-border dark:border-border rounded-2xl font-semibold text-text-main outline-none focus:border-brand-blue text-sm bg-white dark:bg-bg-card"
        />
      )}
    </div>
  );
};

const MatchQuestion = ({ question, onAnswer, answered, language }) => {
  const pairs = React.useMemo(() => {
    return (question.options || []).map(opt => {
      const parts = opt.split(' - ');
      return { left: parts[0]?.trim(), right: parts[1]?.trim() };
    });
  }, [question]);

  const leftItems = React.useMemo(() => {
    return pairs.map(p => p.left).sort(() => 0.5 - Math.random());
  }, [pairs]);

  const rightItems = React.useMemo(() => {
    return pairs.map(p => p.right).sort(() => 0.5 - Math.random());
  }, [pairs]);

  const [selectedLeft, setSelectedLeft] = useState(null);
  const [selectedRight, setSelectedRight] = useState(null);
  const [matchedLeft, setMatchedLeft] = useState([]);
  const [matchedRight, setMatchedRight] = useState([]);
  const [wrongMatch, setWrongMatch] = useState(null);

  const handleLeftClick = (item) => {
    if (answered || matchedLeft.includes(item)) return;
    setSelectedLeft(item);
    if (selectedRight) {
      checkMatch(item, selectedRight);
    }
  };

  const handleRightClick = (item) => {
    if (answered || matchedRight.includes(item)) return;
    setSelectedRight(item);
    if (selectedLeft) {
      checkMatch(selectedLeft, item);
    }
  };

  const checkMatch = (left, right) => {
    const isCorrect = pairs.some(p => p.left === left && p.right === right);
    if (isCorrect) {
      const newMatchedLeft = [...matchedLeft, left];
      const newMatchedRight = [...matchedRight, right];
      setMatchedLeft(newMatchedLeft);
      setMatchedRight(newMatchedRight);
      setSelectedLeft(null);
      setSelectedRight(null);
      
      if (newMatchedLeft.length === pairs.length) {
        onAnswer(question.correctAnswer || question.answer);
      }
    } else {
      setWrongMatch({ left, right });
      setSelectedLeft(null);
      setSelectedRight(null);
      setTimeout(() => {
        setWrongMatch(null);
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-xl font-extrabold text-text-main">{question.prompt}</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Left Column */}
        <div className="flex flex-col gap-3">
          {leftItems.map(item => {
            const isMatched = matchedLeft.includes(item);
            const isSelected = selectedLeft === item;
            const isWrong = wrongMatch?.left === item;
            
            let btnClass = "border-border dark:border-border bg-white dark:bg-bg-card text-text-main hover:bg-brand-light";
            if (isMatched) btnClass = "border-brand-green bg-brand-green/10 text-brand-green opacity-60 pointer-events-none";
            else if (isSelected) btnClass = "border-brand-blue bg-brand-blue/5 text-brand-blue";
            else if (isWrong) btnClass = "border-brand-red bg-brand-red/10 text-brand-red";
            
            return (
              <button
                key={item}
                type="button"
                onClick={() => handleLeftClick(item)}
                className={`p-4 border-2 rounded-2xl text-sm font-bold text-center transition btn-3d shadow-3d-card ${btnClass}`}
              >
                {item}
              </button>
            );
          })}
        </div>
        
        {/* Right Column */}
        <div className="flex flex-col gap-3">
          {rightItems.map(item => {
            const isMatched = matchedRight.includes(item);
            const isSelected = selectedRight === item;
            const isWrong = wrongMatch?.right === item;
            
            let btnClass = "border-border dark:border-border bg-white dark:bg-bg-card text-text-main hover:bg-brand-light";
            if (isMatched) btnClass = "border-brand-green bg-brand-green/10 text-brand-green opacity-60 pointer-events-none";
            else if (isSelected) btnClass = "border-brand-blue bg-brand-blue/5 text-brand-blue";
            else if (isWrong) btnClass = "border-brand-red bg-brand-red/10 text-brand-red";
            
            return (
              <button
                key={item}
                type="button"
                onClick={() => handleRightClick(item)}
                className={`p-4 border-2 rounded-2xl text-sm font-bold text-center transition btn-3d shadow-3d-card ${btnClass}`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// --- Result/Score Screen ---
const ResultScreen = ({ score, xpEarned, gemsEarned, leveledUp, total, correct, onRestart, onContinue }) => {
  const pct = Math.round((correct / total) * 100);
  const passed = pct >= 60;

  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center p-4">
      <div className="bg-white dark:bg-bg-card rounded-3xl border-2 border-border dark:border-border p-8 max-w-md w-full text-center shadow-3d-card">
        <div className="text-7xl mb-4 xp-pop">{passed ? '🎉' : '↻'}</div>
        <h2 className="text-3xl font-extrabold text-text-main mb-1">
          {passed ? 'Lesson Complete!' : 'Keep Practicing!'}
        </h2>
        <p className="text-brand-dark/50 font-semibold mb-6">
          {passed ? 'Great job, you passed this lesson.' : 'You can do better. Try again!'}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-brand-green/10 rounded-2xl p-4 border-2 border-brand-green/20">
            <CheckCircle size={24} className="text-brand-green mx-auto mb-1" />
            <p className="text-2xl font-extrabold text-brand-green">{correct}</p>
            <p className="text-xs font-bold text-brand-green/70">Correct</p>
          </div>
          <div className="bg-brand-yellow/10 rounded-2xl p-4 border-2 border-brand-yellow/20 xp-pop">
            <Zap size={24} className="text-brand-orange mx-auto mb-1" />
            <p className="text-2xl font-extrabold text-brand-orange">+{xpEarned}</p>
            <p className="text-xs font-bold text-brand-orange/70">XP Earned</p>
          </div>
          <div className="bg-brand-purple/10 rounded-2xl p-4 border-2 border-brand-purple/20 xp-pop">
            <Gem size={24} className="text-brand-purple mx-auto mb-1" />
            <p className="text-2xl font-extrabold text-brand-purple">+{gemsEarned || 0}</p>
            <p className="text-xs font-bold text-brand-purple/70">Gems</p>
          </div>
          <div className="bg-brand-blue/10 rounded-2xl p-4 border-2 border-brand-blue/20">
            <Star size={24} className="text-brand-blue mx-auto mb-1" />
            <p className="text-2xl font-extrabold text-brand-blue">{pct}%</p>
            <p className="text-xs font-bold text-brand-blue/70">Score</p>
          </div>
        </div>

        {leveledUp && (
          <div className="mb-6 rounded-2xl border-2 border-brand-purple/20 bg-brand-purple/10 p-4 flex items-center justify-center gap-2 text-brand-purple font-extrabold achievement-unlock">
            <Award size={20} />
            Level up!
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={onContinue}
            className="w-full bg-brand-green text-white font-extrabold py-4 rounded-2xl btn-3d shadow-3d-green text-sm"
          >
            {passed ? 'Continue Learning →' : 'Back to Lessons'}
          </button>
          <button
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-2 bg-white dark:bg-bg-card border-2 border-brand-gray text-brand-dark/70 font-bold py-3 rounded-2xl text-sm btn-3d shadow-3d-card"
          >
            <RotateCcw size={16} /> Try Again
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main LessonRunner ---
const LessonRunner = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchLesson, submitLesson, loading } = useLearning();
  const { user, setUser } = useAuth();

  const [lesson, setLesson] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [userInput, setUserInput] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong'
  const [validationError, setValidationError] = useState('');
  const getHeartsCount = (u) => typeof u?.hearts === 'object' ? (u?.hearts?.current ?? 5) : (u?.hearts ?? 5);

  const [lessonHearts, setLessonHearts] = useState(getHeartsCount(user));
  const [startLevel, setStartLevel] = useState(user?.level || 1);
  const [buyingHearts, setBuyingHearts] = useState(false);

  const handleBuyHearts = async () => {
    if (buyingHearts) return;
    setBuyingHearts(true);
    try {
      const res = await api.post('/shop/buy', { itemId: 'heart_refill' });
      if (res.data.success) {
        toast.success('Hearts refilled!');
        setLessonHearts(res.data.user.hearts.current);
        if (setUser) {
          setUser(res.data.user);
          localStorage.setItem('lingoleap_user', JSON.stringify(res.data.user));
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to buy hearts. Please buy gems.');
    } finally {
      setBuyingHearts(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      const data = await fetchLesson(id);
      setLesson(data);
      setLessonHearts(getHeartsCount(user));
      setStartLevel(user?.level || 1);
    };
    load();
  }, [id]);

  const currentQ = lesson?.questions?.[currentIndex];
  const totalQ = lesson?.questions?.length || 0;

  const getCorrectAnswer = useCallback((q) => {
    if (!q) return '';
    return q.correctAnswer || q.answer || '';
  }, []);

  const handleAnswer = useCallback((userAnswer) => {
    if (answered) return;
    setSelectedAnswer(userAnswer);
    setAnswered(true);

    const correctAns = getCorrectAnswer(currentQ);

    // Check correctness
    const isCorrect =
      currentQ.type === 'speak'
        ? (userAnswer ? (
            (() => {
              const clean = (str) => str.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?¿¡]/g,"").replace(/\s+/g," ").trim();
              const targetClean = clean(correctAns);
              const userClean = clean(userAnswer);
              return userClean === targetClean || userClean.includes(targetClean) || targetClean.includes(userClean);
            })()
          ) : false)
        : userAnswer.toLowerCase().trim() === correctAns.toLowerCase().trim();

    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (!isCorrect) {
      const nextHearts = Math.max(0, getHeartsCount(user) - 1);
      setLessonHearts(nextHearts);
      
      // Update backend hearts immediately
      api.put('/auth/update', {
        hearts: {
          ...(typeof user.hearts === 'object' ? user.hearts : {}),
          current: nextHearts
        }
      }).then(res => {
        if (res.data.success && setUser) {
          setUser(res.data.user);
          localStorage.setItem('lingoleap_user', JSON.stringify(res.data.user));
        }
      }).catch(err => {
        console.error('Failed to sync hearts to backend:', err);
      });
    }

    setAnswers(prev => [...prev, { questionIndex: currentIndex, isCorrect, userAnswer, question: currentQ }]);
  }, [answered, currentQ, currentIndex, user, setUser, getCorrectAnswer]);

  const hasProvidedAnswer = useCallback(() => {
    if (!currentQ) return false;
    const type = currentQ.type;
    if (type === 'multiple-choice' || type === 'quiz' || type === 'true-false' || type === 'true_false' || type === 'true/false' || type === 'true-or-false' || type === 'speak') {
      return !!selectedAnswer;
    }
    if (type === 'translate' || type === 'fill-blank') {
      return !!userInput.trim();
    }
    if (type === 'listen') {
      const hasOptions = currentQ.options && currentQ.options.length > 0;
      return hasOptions ? !!selectedAnswer : !!userInput.trim();
    }
    if (type === 'match') {
      return !!selectedAnswer;
    }
    return false;
  }, [currentQ, selectedAnswer, userInput]);

  const isAnswerProvided = hasProvidedAnswer();

  useEffect(() => {
    if (selectedAnswer || userInput) {
      setValidationError('');
    }
  }, [selectedAnswer, userInput]);

  const checkAnswer = useCallback(() => {
    if (answered) return;
    if (!hasProvidedAnswer()) {
      setValidationError("Please select or type an answer to continue.");
      toast.error("Please select or type an answer to continue.");
      return;
    }
    setValidationError('');
    
    let answerToSubmit = '';
    const type = currentQ.type;
    if (type === 'multiple-choice' || type === 'quiz' || type === 'true-false' || type === 'true_false' || type === 'true/false' || type === 'true-or-false' || type === 'speak' || type === 'match') {
      answerToSubmit = selectedAnswer;
    } else if (type === 'translate' || type === 'fill-blank') {
      answerToSubmit = userInput.trim();
    } else if (type === 'listen') {
      const hasOptions = currentQ.options && currentQ.options.length > 0;
      answerToSubmit = hasOptions ? selectedAnswer : userInput.trim();
    }

    handleAnswer(answerToSubmit);
  }, [answered, hasProvidedAnswer, currentQ, selectedAnswer, userInput, handleAnswer]);

  const handleCheckClick = useCallback(() => {
    if (!hasProvidedAnswer()) {
      setValidationError("Please select or type an answer to continue.");
      toast.error("Please select or type an answer to continue.");
      return;
    }
    checkAnswer();
  }, [hasProvidedAnswer, checkAnswer]);

  const handleNext = useCallback(async () => {
    if (currentIndex < totalQ - 1) {
      setCurrentIndex(prev => prev + 1);
      setAnswered(false);
      setSelectedAnswer('');
      setUserInput('');
      setFeedback(null);
    } else {
      // Submit lesson
      const allAnswers = [...answers];
      const result = await submitLesson(id, allAnswers, totalQ);
      setResultData(result);

      if (result?.success && result?.user) {
        // Check for new achievements
        const prevUser = user;
        const nextUser = result.user;
        setUser(nextUser);

        // Celebrate lesson completion
        if (result.score >= 60) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }

        // Compare achievements status
        const getEarnedStatus = (u, ach) => {
          if (!u) return false;
          let current = 0;
          if (ach.requireType === 'xp') current = u.xp || 0;
          if (ach.requireType === 'streak') current = u.streakCount || 0;
          if (ach.requireType === 'lessons') current = (u.unlockedLessons || []).length;
          if (ach.requireType === 'weeklyXp') current = u.weeklyXp || 0;
          if (ach.requireType === 'aiMessages') current = (u.recentActivity || []).filter(a => a.type === 'ai_chat').length > 0 ? 1 : 0;
          return current >= ach.requireValue;
        };

        const newlyUnlocked = allAchievements.filter(ach => {
          const wasEarned = getEarnedStatus(prevUser, ach);
          const isEarned = getEarnedStatus(nextUser, ach);
          return !wasEarned && isEarned;
        });

        newlyUnlocked.forEach((ach) => {
          setTimeout(() => {
            toast.success(
              (t) => (
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{ach.icon}</span>
                  <div>
                    <p className="font-extrabold text-sm text-text-main">Achievement Unlocked!</p>
                    <p className="font-bold text-xs text-brand-dark/60">{ach.name}: {ach.description}</p>
                  </div>
                </div>
              ),
              { duration: 5000, id: `ach-${ach.id}` }
            );
            // Double burst for achievements
            confetti({
              particleCount: 50,
              angle: 60,
              spread: 55,
              origin: { x: 0 }
            });
            confetti({
              particleCount: 50,
              angle: 120,
              spread: 55,
              origin: { x: 1 }
            });
          }, 1000);
        });
      }
      
      setShowResult(true);
    }
  }, [currentIndex, totalQ, answers, id, submitLesson, user, setUser]);

  if (loading && !lesson) {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!lesson) return null;

  if (showResult) {
    const correct = answers.filter(a => a.isCorrect).length;
    return (
      <ResultScreen
        score={resultData?.score || 0}
        xpEarned={resultData?.xpEarned || 0}
        gemsEarned={resultData?.gemsEarned || 0}
        leveledUp={(resultData?.user?.level || startLevel) > startLevel}
        total={totalQ}
        correct={correct}
        onRestart={() => {
          setCurrentIndex(0);
          setAnswers([]);
          setAnswered(false);
          setSelectedAnswer('');
          setUserInput('');
          setFeedback(null);
          setShowResult(false);
          setResultData(null);
          setLessonHearts(getHeartsCount(user));
        }}
        onContinue={() => navigate('/learn')}
      />
    );
  }

  const userHearts = getHeartsCount(user);

  if (lessonHearts === 0 || (userHearts === 0 && !showResult)) {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center p-4">
        <div className="bg-white dark:bg-bg-card rounded-3xl border-2 border-border dark:border-border p-8 max-w-sm w-full text-center shadow-3d-card">
          <div className="w-20 h-20 bg-rose-100 border-2 border-rose-200 rounded-2xl flex items-center justify-center text-rose-600 mx-auto mb-4 animate-bounce">
            <Heart size={40} fill="currentColor" className="text-rose-500 animate-pulse" />
          </div>
          <h1 className="text-xl font-black text-text-main mb-2">You're out of Hearts</h1>
          <p className="text-xs font-semibold text-brand-dark/50 leading-relaxed mb-6">
            Hearts regenerate automatically at 1 heart every 30 minutes, or you can purchase an instant refill or gems.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleBuyHearts}
              disabled={buyingHearts}
              className="w-full bg-brand-green text-text-main hover:bg-brand-green-hover py-3.5 rounded-2xl font-extrabold text-xs btn-3d shadow-3d-green transition flex items-center justify-center gap-1.5 border-0 cursor-pointer"
            >
              {buyingHearts ? (
                <RefreshCw size={14} className="animate-spin text-text-main" />
              ) : (
                <>
                  <Gem size={14} /> Buy Hearts (30 Gems)
                </>
              )}
            </button>
            <button
              onClick={() => navigate('/buy-gems')}
              className="w-full bg-brand-purple text-white hover:bg-brand-purple/95 py-3.5 rounded-2xl font-extrabold text-xs btn-3d shadow-3d-purple transition flex items-center justify-center gap-1.5 border-0 cursor-pointer animate-pulse-slow"
            >
              <Sparkles size={14} /> Buy Gems Pack
            </button>
            <button
              onClick={() => navigate('/learn')}
              className="w-full bg-white dark:bg-bg-card border-2 border-border dark:border-border text-brand-dark/60 font-extrabold py-3 rounded-2xl text-xs hover:bg-brand-light transition duration-150 cursor-pointer"
            >
              Wait for Hearts to regenerate
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-light flex flex-col">
      {/* Top Bar */}
      <div className="sticky top-0 bg-white dark:bg-bg-card border-b-2 border-border dark:border-border z-10 px-4 md:px-8 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/learn')} className="text-brand-dark/40 hover:text-text-main transition">
            <X size={24} />
          </button>
          <div className="flex-1">
            <LessonProgressBar current={currentIndex + (answered ? 1 : 0)} total={totalQ} />
          </div>
          <span className="text-xs font-extrabold text-brand-dark/50 whitespace-nowrap">
            {currentIndex + 1} / {totalQ}
          </span>
          <div className="flex items-center gap-1 text-brand-red font-extrabold text-sm bg-brand-red/10 border-2 border-brand-red/20 rounded-xl px-2.5 py-1">
            <Heart size={15} fill="currentColor" />
            {lessonHearts}
          </div>
        </div>
      </div>

      {/* Question Area */}
      <div className="flex-1 flex flex-col justify-center px-4 md:px-8 py-8">
        <div className="max-w-2xl mx-auto w-full">
          {/* Category Badge */}
          <div className="mb-4">
            <span className="text-xs font-extrabold uppercase tracking-widest text-brand-blue bg-brand-blue/10 border-2 border-brand-blue/20 rounded-full px-3 py-1">
              {lesson.category} · {lesson.title}
            </span>
          </div>

          {/* Question Type Renderer */}
          <QuestionErrorBoundary onSkip={() => handleAnswer('')}>
            {(() => {
              if (!currentQ) {
                return (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-900/30 rounded-xl font-bold">
                    No question data available for this step.
                  </div>
                );
              }
              const type = currentQ.type;
              if (type === 'multiple-choice' || type === 'quiz') {
                return (
                  <MultipleChoice
                    question={currentQ}
                    answered={answered}
                    selectedAnswer={selectedAnswer}
                    setSelectedAnswer={setSelectedAnswer}
                    language={lesson?.language}
                  />
                );
              }
              if (type === 'fill-blank') {
                return (
                  <FillBlank
                    question={currentQ}
                    answered={answered}
                    userInput={userInput}
                    setUserInput={setUserInput}
                    language={lesson?.language}
                    onSubmit={handleCheckClick}
                  />
                );
              }
              if (type === 'true-false' || type === 'true_false' || type === 'true/false' || type === 'true-or-false') {
                return (
                  <TrueFalse
                    question={currentQ}
                    answered={answered}
                    selectedAnswer={selectedAnswer}
                    setSelectedAnswer={setSelectedAnswer}
                    language={lesson?.language}
                  />
                );
              }
              if (type === 'translate') {
                return (
                  <Translate
                    question={currentQ}
                    answered={answered}
                    userInput={userInput}
                    setUserInput={setUserInput}
                    language={lesson?.language}
                    onSubmit={handleCheckClick}
                  />
                );
              }
              if (type === 'speak') {
                return (
                  <SpeakQuestion
                    question={currentQ}
                    answered={answered}
                    selectedAnswer={selectedAnswer}
                    setSelectedAnswer={setSelectedAnswer}
                    language={lesson?.language}
                  />
                );
              }
              if (type === 'listen') {
                return (
                  <ListenQuestion
                    question={currentQ}
                    answered={answered}
                    selectedAnswer={selectedAnswer}
                    setSelectedAnswer={setSelectedAnswer}
                    userInput={userInput}
                    setUserInput={setUserInput}
                    language={lesson?.language}
                    onSubmit={handleCheckClick}
                  />
                );
              }
              if (type === 'match') {
                return (
                  <MatchQuestion
                    question={currentQ}
                    onAnswer={handleAnswer}
                    answered={answered}
                    language={lesson?.language}
                  />
                );
              }
              // Fallback error for unsupported types
              throw new Error(`Unrecognized or unsupported question type: "${type}"`);
            })()}
          </QuestionErrorBoundary>
        </div>
      </div>

      {/* Feedback Footer */}
      <div className={`sticky bottom-0 border-t-2 px-4 md:px-8 py-5 z-20 transition-colors duration-150 ${
        answered
          ? feedback === 'correct'
            ? 'bg-brand-green/10 border-brand-green/30 dark:bg-green-950/20 dark:border-brand-green/20'
            : 'bg-brand-red/10 border-brand-red/30 dark:bg-red-950/20 dark:border-brand-red/20'
          : 'bg-white dark:bg-bg-card border-border dark:border-border'
      }`}>
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          {answered ? (
            <>
              <div className="flex items-center gap-3">
                {feedback === 'correct' ? (
                  <>
                    <CheckCircle size={28} className="text-brand-green" />
                    <div>
                      <p className="font-extrabold text-brand-green">Correct! 🎉</p>
                      <p className="text-xs font-semibold text-brand-green/70">Keep it up!</p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle size={28} className="text-brand-red" />
                    <div>
                      <p className="font-extrabold text-brand-red">Incorrect</p>
                      <p className="text-xs font-semibold text-brand-red/70">
                        Correct: <strong>{getCorrectAnswer(currentQ)}</strong>
                      </p>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={handleNext}
                className={`flex items-center gap-2 font-extrabold py-3 px-6 rounded-2xl btn-3d text-white text-sm transition cursor-pointer ${
                  feedback === 'correct'
                    ? 'bg-brand-green shadow-3d-green hover:bg-brand-green-hover'
                    : 'bg-brand-red shadow-3d-red hover:bg-brand-red-hover'
                }`}
              >
                {currentIndex < totalQ - 1 ? 'Continue' : 'Finish'}
                <ChevronRight size={18} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleAnswer('')}
                className="font-extrabold py-3 px-6 rounded-2xl border-2 border-border dark:border-border bg-white dark:bg-bg-card text-brand-dark/60 hover:bg-brand-light transition text-sm cursor-pointer"
              >
                Skip
              </button>

              <div className="flex flex-col items-end gap-1">
                {validationError && (
                  <span className="text-[10px] font-bold text-brand-red animate-pulse mb-1">
                    {validationError}
                  </span>
                )}
                <button
                  onClick={handleCheckClick}
                  className={`font-extrabold py-3 px-8 rounded-2xl btn-3d text-white text-sm transition-all duration-200 ${
                    isAnswerProvided
                      ? 'bg-brand-blue shadow-3d-blue hover:bg-brand-blue-hover cursor-pointer'
                      : 'bg-brand-gray/40 text-brand-dark/30 shadow-none cursor-not-allowed opacity-60'
                  }`}
                >
                  Check Answer
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonRunner;
