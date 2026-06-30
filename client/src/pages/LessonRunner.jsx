import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLearning } from '../context/LearningContext';
import { useAuth } from '../context/AuthContext';
import { allAchievements } from './Achievements';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { X, CheckCircle, XCircle, ChevronRight, Star, Zap, RotateCcw, Volume2, Mic, Square, AlertCircle, Heart, Gem, Award, Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import api from '../services/api';
import Button from '../components/common/Button';

// --- Progress bar at top of lesson ---
import { playAudio, playTeacherStart, playTeacherQuestion, playTeacherCorrect, playTeacherWrong, stopAudio } from '../services/audioTeacher';

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

const PlayAudioButton = ({ text, language }) => {
  const play = (e) => {
    e.stopPropagation();
    playAudio(text, language, true); // force play even if muted when explicitly clicked
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

// --- Word Learning Flow (Phase 1) ---
const WordCard = ({ word, language }) => {
  const autoPlayTTS = useCallback(() => {
    const textToPlay = word.targetWord || "";
    if (textToPlay) playAudio(textToPlay, language);
  }, [word, language]);

  const forcePlayTTS = useCallback((e) => {
    e?.stopPropagation();
    const textToPlay = word.targetWord || "";
    if (textToPlay) playAudio(textToPlay, language, true);
  }, [word, language]);

  useEffect(() => {
    autoPlayTTS();
  }, [autoPlayTTS]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 animate-fade-in">
      {word.picture && <div className="text-8xl mb-2">{word.picture}</div>}
      <div className="text-center">
        <h2 className="text-5xl font-black text-text-main mb-2">{word.targetWord}</h2>
        {word.pronunciation && (
          <p className="text-xl font-bold text-brand-dark/40 italic">{word.pronunciation}</p>
        )}
      </div>
      <button
        type="button"
        onClick={forcePlayTTS}
        className="w-20 h-20 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-full flex items-center justify-center shadow-3d-blue transition cursor-pointer transform hover:scale-105"
        title="Play Audio"
      >
        <Volume2 size={36} />
      </button>
      
      <div className="bg-white dark:bg-bg-card border-2 border-border dark:border-border rounded-3xl p-6 w-full text-center mt-2 shadow-3d-card">
        <p className="text-xs font-black text-brand-dark/30 uppercase tracking-widest mb-1">Meaning</p>
        <p className="text-2xl font-extrabold text-brand-purple mb-4">{word.meaning}</p>
        
        {word.exampleSentence && (
          <>
            <div className="w-12 h-1 bg-border dark:bg-border/30 rounded-full mx-auto my-4" />
            <p className="text-[10px] font-black text-brand-dark/30 uppercase tracking-widest mb-1">Example</p>
            <p className="text-lg font-bold text-text-main">"{word.exampleSentence}"</p>
          </>
        )}
      </div>
    </div>
  );
};

const MultipleChoice = ({ question, answered, selectedAnswer, setSelectedAnswer, language }) => (
  <div className="flex flex-col gap-3">
    {question.promptImage && (
      <div className="w-full flex justify-center mb-4">
        {question.promptImage.startsWith('http') || question.promptImage.startsWith('/') ? (
          <img src={question.promptImage} alt={question.prompt} className="max-h-[200px] w-auto max-w-full rounded-2xl object-contain shadow-sm" loading="lazy" />
        ) : (
          <span className="text-8xl md:text-9xl">{question.promptImage}</span>
        )}
      </div>
    )}
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

const ImageChoice = ({ question, answered, selectedAnswer, setSelectedAnswer, language }) => (
  <div className="flex flex-col gap-4">
    <div className="flex items-center gap-2 mb-2">
      <h2 className="text-xl font-extrabold text-text-main">{question.prompt}</h2>
      {question.prompt && <PlayAudioButton text={question.prompt} language={language} />}
    </div>
    <div className="grid grid-cols-2 gap-4 max-w-md mx-auto w-full">
      {(question.imageOptions || []).map((opt) => {
        let style = 'border-border dark:border-border bg-white dark:bg-bg-card hover:bg-brand-light hover:border-brand-blue/50';
        if (answered) {
          const correctAns = question.correctAnswer || question.answer;
          if (opt === correctAns) style = 'border-brand-green bg-brand-green/10';
          else if (opt === selectedAnswer && opt !== correctAns) style = 'border-brand-red bg-brand-red/10';
          else style = 'border-border dark:border-border bg-brand-light/50 opacity-60';
        } else {
          if (opt === selectedAnswer) style = 'border-brand-blue bg-brand-blue/10 shadow-3d-blue';
        }
        return (
          <button
            key={opt}
            type="button"
            onClick={() => !answered && setSelectedAnswer(opt)}
            disabled={answered}
            className={`w-full aspect-square rounded-2xl flex items-center justify-center transition-all duration-150 btn-3d shadow-3d-card border-2 p-2 overflow-hidden ${style}`}
          >
            {opt.startsWith('http') || opt.startsWith('/') ? (
              <img src={opt} alt="option" className="w-full h-full object-contain" loading="lazy" />
            ) : (
              <span className="text-6xl sm:text-7xl">{opt}</span>
            )}
          </button>
        );
      })}
    </div>
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
  const [isIntroPlaying, setIsIntroPlaying] = useState(true);
  const recognitionRef = React.useRef(null);
  const lastStateRef = React.useRef({ questionId: null, answered: null });

  const runSpeakQuestionSequence = (isRetry = false) => {
    setIsIntroPlaying(true);
    stopAudio();

    const targetWord = question.correctAnswer || question.answer || '';
    if (!targetWord) {
      setIsIntroPlaying(false);
      return;
    }

    if (isRetry) {
      // Short retry intro: AI repeats target word, then enables mic
      playAudio(targetWord, language, true, () => {
        setIsIntroPlaying(false);
      });
    } else {
      // Full intro: Teacher introduces word -> AI pronounces -> Teacher prompt -> Enable mic
      const introText = `Today's word is ${targetWord}. Listen carefully...`;
      playAudio(introText, 'English', false, () => {
        playAudio(targetWord, language, true, () => {
          const promptText = `Great! Now it's your turn. Say: ${targetWord}.`;
          playAudio(promptText, 'English', false, () => {
            setIsIntroPlaying(false);
          });
        });
      });
    }
  };

  const playAgain = () => {
    if (isIntroPlaying) return;
    const targetWord = question.correctAnswer || question.answer || '';
    playAudio(targetWord, language, true);
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
    return () => {
      stopAudio();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch(e) {}
      }
    };
  }, []);

  useEffect(() => {
    if (!question) return;
    const prev = lastStateRef.current;
    
    if (prev.questionId !== question._id) {
      lastStateRef.current = { questionId: question._id, answered };
      if (!answered) {
        runSpeakQuestionSequence(false);
      }
    } else if (prev.answered === true && answered === false) {
      lastStateRef.current = { questionId: question._id, answered };
      runSpeakQuestionSequence(true);
    } else {
      lastStateRef.current = { questionId: question._id, answered };
    }
  }, [question._id, answered]);

  useEffect(() => {
    let timeoutId;
    if (isIntroPlaying) {
      timeoutId = setTimeout(() => {
        setIsIntroPlaying(false);
      }, 8000); // 8-second safety backup to ensure buttons become active
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isIntroPlaying]);

  const startListening = () => {
    if (isIntroPlaying) return;
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
      spanish: 'es-ES',
      french: 'fr-FR',
      german: 'de-DE',
      italian: 'it-IT',
      english: 'en-US',
      arabic: 'ar-SA',
      korean: 'ko-KR',
      japanese: 'ja-JP',
      chinese: 'zh-CN',
      portuguese: 'pt-PT',
      russian: 'ru-RU',
      hindi: 'hi-IN',
      dutch: 'nl-NL',
      turkish: 'tr-TR'
    };
    const normalizedLang = language?.toLowerCase() || 'spanish';
    rec.lang = langMap[normalizedLang] || 'en-US';

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-extrabold text-text-main">{question.prompt}</h2>
        <button
          type="button"
          disabled={isIntroPlaying}
          onClick={playAgain}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition ${
            isIntroPlaying
              ? 'text-brand-purple/40 bg-brand-purple/5 border-2 border-brand-purple/10 cursor-not-allowed'
              : 'text-brand-purple bg-brand-purple/10 border-2 border-brand-purple/20 hover:bg-brand-purple/20 cursor-pointer'
          }`}
        >
          <Volume2 size={14} /> Play Again
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
              disabled={isIntroPlaying}
              className={`w-full flex items-center justify-center gap-2 text-white font-extrabold py-4 px-8 rounded-2xl btn-3d text-sm cursor-pointer transition ${
                isIntroPlaying 
                  ? 'bg-brand-gray/40 border-brand-gray/60 cursor-not-allowed opacity-50 shadow-none transform-none' 
                  : 'bg-brand-blue shadow-3d-blue hover:bg-brand-blue-hover'
              }`}
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
  const autoPlayTTS = useCallback(() => {
    const textToPlay = question.audioText || question.prompt || question.correctAnswer || question.answer || "";
    if (textToPlay) playAudio(textToPlay, language);
  }, [question, language]);

  const forcePlayTTS = useCallback((e) => {
    e?.stopPropagation();
    const textToPlay = question.audioText || question.prompt || question.correctAnswer || question.answer || "";
    if (textToPlay) playAudio(textToPlay, language, true);
  }, [question, language]);

  useEffect(() => {
    autoPlayTTS();
  }, [autoPlayTTS]);

  const hasOptions = (question.options && question.options.length > 0) || (question.imageOptions && question.imageOptions.length > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center justify-center p-6 bg-brand-light/60 dark:bg-brand-gray/5 border-2 border-border dark:border-border rounded-3xl gap-3">
        <button
          type="button"
          onClick={forcePlayTTS}
          className="w-20 h-20 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-full flex items-center justify-center shadow-3d-purple transition cursor-pointer transform hover:scale-105"
          title="Play Audio"
        >
          <Volume2 size={36} />
        </button>
        <span className="text-xs font-bold text-brand-purple">Click to play audio</span>
      </div>

      {hasOptions ? (
        <div className={question.imageOptions && question.imageOptions.length > 0 ? "grid grid-cols-2 gap-4 max-w-md mx-auto w-full" : "flex flex-col gap-3"}>
          {(question.imageOptions && question.imageOptions.length > 0 ? question.imageOptions : question.options).map((opt) => {
            let style = 'border-border dark:border-border bg-white dark:bg-bg-card hover:bg-brand-light hover:border-brand-blue/50 text-text-main';
            if (answered) {
              const correctAns = question.correctAnswer || question.answer;
              if (opt === correctAns) style = 'border-brand-green bg-brand-green/10 text-brand-green';
              else if (opt === selectedAnswer && opt !== correctAns) style = 'border-brand-red bg-brand-red/10 text-brand-red';
              else style = 'border-border dark:border-border bg-brand-light/50 text-brand-dark/40 opacity-60';
            } else {
              if (opt === selectedAnswer) style = 'border-brand-blue bg-brand-blue/10 text-brand-blue shadow-3d-blue';
            }
            return (
              <button
                key={opt}
                type="button"
                onClick={() => !answered && setSelectedAnswer(opt)}
                disabled={answered}
                className={question.imageOptions && question.imageOptions.length > 0 ? `w-full aspect-square rounded-2xl flex items-center justify-center transition-all duration-150 btn-3d shadow-3d-card border-2 p-2 overflow-hidden ${style}` : `w-full p-4 border-2 rounded-2xl text-sm font-bold text-left transition-all duration-150 btn-3d shadow-3d-card ${style}`}
              >
                {question.imageOptions && question.imageOptions.length > 0 ? (
                  (opt.startsWith('http') || opt.startsWith('/')) ? (
                    <img src={opt} alt="option" className="w-full h-full object-contain" loading="lazy" />
                  ) : (
                    <span className="text-6xl sm:text-7xl">{opt}</span>
                  )
                ) : (
                  opt
                )}
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
          <Button
            variant="custom"
            onClick={onContinue}
            className="w-full bg-brand-green text-white font-extrabold py-4 rounded-2xl btn-3d shadow-3d-green text-sm"
          >
            {passed ? 'Continue Learning →' : 'Back to Lessons'}
          </Button>
          <Button
            variant="custom"
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-2 bg-white dark:bg-bg-card border-2 border-brand-gray text-brand-dark/70 font-bold py-3 rounded-2xl text-sm btn-3d shadow-3d-card"
          >
            <RotateCcw size={16} /> Try Again
          </Button>
        </div>
      </div>
    </div>
  );
};

// --- Character & Environment visuals for Natural Language Acquisition ---
const characterData = {
  Korean: { name: 'Min-Jun', flag: '🇰🇷', role: 'Korean Friend', avatar: '👨‍💼', desc: 'Your friendly guide in Seoul' },
  Japanese: { name: 'Yuki', flag: '🇯🇵', role: 'Japanese Teacher', avatar: '👩‍🏫', desc: 'Your supportive Sensei in Tokyo' },
  Spanish: { name: 'Sofia', flag: '🇪🇸', role: 'Spanish Guide', avatar: '👩‍⚕️', desc: 'Your enthusiastic guide in Madrid' },
  French: { name: 'Marie', flag: '🇫🇷', role: 'French Teacher', avatar: '👩', desc: 'Your elegant tutor in Paris' },
  German: { name: 'Hans', flag: '🇩🇪', role: 'German Teacher', avatar: '👨‍🔬', desc: 'Your structured coach in Berlin' },
  Arabic: { name: 'Ahmed', flag: '🇸🇦', role: 'Arabic Guide', avatar: '👨', desc: 'Your warm host in Riyadh' },
  Italian: { name: 'Giovanni', flag: '🇮🇹', role: 'Italian Teacher', avatar: '👨‍🍳', desc: 'Your passionate tutor in Rome' },
  English: { name: 'Emma', flag: '🇬🇧', role: 'English Teacher', avatar: '👩‍💼', desc: 'Your friendly tutor in London' }
};

const getStoryCharacter = (language, category, title) => {
  const normalizedText = `${category || ''} ${title || ''}`.toLowerCase();
  
  if (language === 'Korean') {
    if (normalizedText.includes('airport')) {
      return { name: 'Officer Choi', flag: '🇰🇷', role: 'Airport Officer 👮', avatar: '👨‍✈️', desc: 'Customs and arrivals officer' };
    }
    if (normalizedText.includes('taxi')) {
      return { name: 'Mr. Park', flag: '🇰🇷', role: 'Taxi Driver 🚕', avatar: '👨', desc: 'Friendly Seoul taxi driver' };
    }
    if (normalizedText.includes('coffee') || normalizedText.includes('cafe')) {
      return { name: 'Soo-Min', flag: '🇰🇷', role: 'Korean Friend 👩', avatar: '👩', desc: 'Your close friend in Seoul' };
    }
    if (normalizedText.includes('shop') || normalizedText.includes('store') || normalizedText.includes('market')) {
      return { name: 'Mrs. Kim', flag: '🇰🇷', role: 'Store Owner 🏪', avatar: '👵', desc: 'Convenience store owner' };
    }
    if (normalizedText.includes('home') || normalizedText.includes('house') || normalizedText.includes('family')) {
      return { name: 'Grandmother Hana', flag: '🇰🇷', role: 'Korean Elder 👵', avatar: '👵', desc: 'Traditional Korean grandmother' };
    }
    if (normalizedText.includes('restaurant') || normalizedText.includes('food') || normalizedText.includes('dine')) {
      return { name: 'Chef Lee', flag: '🇰🇷', role: 'Restaurant Chef 👨‍🍳', avatar: '👨‍🍳', desc: 'Traditional Korean food chef' };
    }
    if (normalizedText.includes('school') || normalizedText.includes('class') || normalizedText.includes('teach')) {
      return { name: 'Teacher Ji-eun', flag: '🇰🇷', role: 'Korean Instructor 👩‍🏫', avatar: '👩‍🏫', desc: 'Friendly language teacher' };
    }
    return { name: 'Min-Jun', flag: '🇰🇷', role: 'Korean Guide 🇰🇷', avatar: '👨‍💼', desc: 'Your friendly guide in Seoul' };
  }
  
  if (language === 'Japanese') {
    if (normalizedText.includes('airport')) {
      return { name: 'Officer Suzuki', flag: '🇯🇵', role: 'Airport Officer 👮', avatar: '👨‍✈️', desc: 'Tokyo customs officer' };
    }
    if (normalizedText.includes('taxi')) {
      return { name: 'Mr. Sato', flag: '🇯🇵', role: 'Taxi Driver 🚕', avatar: '👨', desc: 'Polite Tokyo taxi driver' };
    }
    if (normalizedText.includes('coffee') || normalizedText.includes('cafe') || normalizedText.includes('friend')) {
      return { name: 'Kenji', flag: '🇯🇵', role: 'Japanese Friend 👦', avatar: '👦', desc: 'Your friend in Tokyo' };
    }
    if (normalizedText.includes('shop') || normalizedText.includes('store') || normalizedText.includes('market')) {
      return { name: 'Mrs. Tanaka', flag: '🇯🇵', role: 'Shop Owner 🏪', avatar: '👵', desc: 'Friendly store owner' };
    }
    if (normalizedText.includes('restaurant') || normalizedText.includes('food') || normalizedText.includes('sushi')) {
      return { name: 'Chef Hiro', flag: '🇯🇵', role: 'Sushi Chef 👨‍🍳', avatar: '👨‍🍳', desc: 'Master sushi chef' };
    }
    return { name: 'Yuki', flag: '🇯🇵', role: 'Japanese Sensei 🇯🇵', avatar: '👩‍🏫', desc: 'Your supportive Sensei in Tokyo' };
  }

  if (language === 'Spanish') {
    if (normalizedText.includes('taxi')) {
      return { name: 'Javier', flag: '🇪🇸', role: 'Taxi Driver 🚕', avatar: '👨', desc: 'Cheerful Madrid taxi driver' };
    }
    if (normalizedText.includes('coffee') || normalizedText.includes('cafe')) {
      return { name: 'Carlos', flag: '🇪🇸', role: 'Spanish Friend 👦', avatar: '👦', desc: 'Your friend in Madrid' };
    }
    if (normalizedText.includes('shop') || normalizedText.includes('store') || normalizedText.includes('market')) {
      return { name: 'Maria', flag: '🇪🇸', role: 'Market Vendor 🏪', avatar: '👵', desc: 'Enthusiastic market vendor' };
    }
    return { name: 'Sofia', flag: '🇪🇸', role: 'Spanish Guide 🇪🇸', avatar: '👩‍⚕️', desc: 'Your enthusiastic guide in Madrid' };
  }

  if (language === 'French') {
    if (normalizedText.includes('taxi')) {
      return { name: 'Pierre', flag: '🇫🇷', role: 'Taxi Driver 🚕', avatar: '👨', desc: 'Parisian taxi driver' };
    }
    if (normalizedText.includes('coffee') || normalizedText.includes('cafe') || normalizedText.includes('boulangerie')) {
      return { name: 'Jean', flag: '🇫🇷', role: 'French Friend 👦', avatar: '👦', desc: 'Your friend in Paris' };
    }
    return { name: 'Marie', flag: '🇫🇷', role: 'French Teacher 🇫🇷', avatar: '👩', desc: 'Your elegant tutor in Paris' };
  }

  return characterData[language] || characterData['English'];
};

const categoryVisuals = {
  home: { icon: '🏠', bg: 'from-amber-500/10 to-orange-500/10', title: 'At Home' },
  restaurant: { icon: '🍴', bg: 'from-rose-500/10 to-red-500/10', title: 'At a Restaurant' },
  airport: { icon: '✈️', bg: 'from-sky-500/10 to-blue-500/10', title: 'At the Airport' },
  hotel: { icon: '🏨', bg: 'from-indigo-500/10 to-purple-500/10', title: 'At a Hotel' },
  shopping: { icon: '🛍️', bg: 'from-pink-500/10 to-rose-500/10', title: 'Shopping Mall' },
  hospital: { icon: '🩺', bg: 'from-teal-500/10 to-emerald-500/10', title: 'At the Hospital' },
  school: { icon: '🏫', bg: 'from-blue-500/10 to-indigo-500/10', title: 'At School' },
  office: { icon: '🏢', bg: 'from-slate-500/10 to-zinc-500/10', title: 'At the Office' },
  beach: { icon: '🏖️', bg: 'from-yellow-400/10 to-orange-400/10', title: 'At the Beach' },
  train: { icon: '🚉', bg: 'from-cyan-500/10 to-blue-500/10', title: 'At the Train Station' },
  coffee: { icon: '☕', bg: 'from-amber-700/10 to-amber-600/10', title: 'At a Coffee Shop' },
  market: { icon: '🛒', bg: 'from-green-500/10 to-emerald-500/10', title: 'At the Market' },
  library: { icon: '📚', bg: 'from-violet-500/10 to-purple-500/10', title: 'In the Library' },
  park: { icon: '🌳', bg: 'from-green-400/10 to-emerald-400/10', title: 'In the Park' },
  cinema: { icon: '🎬', bg: 'from-red-600/10 to-rose-600/10', title: 'At the Cinema' },
  party: { icon: '🎂', bg: 'from-pink-400/10 to-purple-400/10', title: 'At a Birthday Party' },
  friends: { icon: '👥', bg: 'from-teal-400/10 to-cyan-400/10', title: 'Meeting Friends' },
  family: { icon: '👪', bg: 'from-orange-400/10 to-amber-400/10', title: 'With Family' },
  travel: { icon: '🗺️', bg: 'from-emerald-500/10 to-teal-500/10', title: 'Traveling' },
  emergency: { icon: '🚨', bg: 'from-red-500/20 to-orange-500/20 animate-pulse', title: 'Emergency Situation' },
  taxi: { icon: '🚕', bg: 'from-yellow-400/15 to-yellow-300/10', title: 'In a Taxi' },
  gym: { icon: '🏋️', bg: 'from-slate-600/10 to-zinc-700/10', title: 'At the Gym' }
};

const getCategoryVisual = (category, title) => {
  const text = `${category || ''} ${title || ''}`.toLowerCase();
  for (const [key, val] of Object.entries(categoryVisuals)) {
    if (text.includes(key)) return val;
  }
  return { icon: '🌍', bg: 'from-purple-500/10 to-indigo-500/10', title: category || 'Immersion Lesson' };
};

const getActiveFlowStepIndex = (isWordCard, questionType) => {
  if (isWordCard) return 0; // Observe
  if (questionType === 'listen') return 1; // Hear
  if (questionType === 'speak') return 2; // Repeat/Speak
  if (questionType === 'multiple-choice' || questionType === 'quiz' || questionType === 'image-choice' || questionType === 'identify-image' || questionType === 'match') return 3; // Recognize
  if (questionType === 'true-false' || questionType === 'true_false' || questionType === 'true/false' || questionType === 'true-or-false') return 4; // Understand
  if (questionType === 'translate' || questionType === 'fill-blank') return 5; // Use / Write
  return 0;
};

const AcquisitionPipeline = ({ activeIndex }) => {
  const steps = [
    { label: 'Observe 👁️' },
    { label: 'Hear 🔊' },
    { label: 'Repeat 🗣️' },
    { label: 'Recognize 🎯' },
    { label: 'Understand 💡' },
    { label: 'Use ✍️' }
  ];

  return (
    <div className="w-full overflow-x-auto py-2.5 mb-5 flex items-center justify-between border-b border-border/40 scrollbar-none">
      <div className="flex items-center gap-1.5 min-w-max mx-auto px-2">
        {steps.map((step, idx) => (
          <React.Fragment key={idx}>
            <div className={`flex flex-col items-center px-3 py-1.5 rounded-xl transition ${
              idx === activeIndex 
                ? 'bg-brand-purple/10 text-brand-purple border border-brand-purple/20' 
                : idx < activeIndex 
                  ? 'text-brand-green/70' 
                  : 'text-brand-dark/30'
            }`}>
              <span className="text-[10px] font-black tracking-tight">{step.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <span className={`text-xs font-black select-none ${idx < activeIndex ? 'text-brand-green/50' : 'text-brand-dark/20'}`}>
                →
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const AITeacherBubble = ({ language, category, title, currentIndex, stage, questionType, answered, feedback, selectedAnswer, correctAnswer, isWordCard, userLevel }) => {
  const char = getStoryCharacter(language, category, title);
  
  let level = 'Beginner';
  if (userLevel >= 15) level = 'Advanced';
  else if (userLevel >= 5) level = 'Intermediate';

  // Language-specific native phrases for the AI teacher
  const nativeGreetings = {
    Korean: '안녕하세요!', Japanese: 'こんにちは!', Spanish: '¡Hola!', French: 'Bonjour!',
    German: 'Hallo!', Arabic: 'مرحباً!', Italian: 'Ciao!', English: 'Hello!'
  };
  const nativeExcellent = {
    Korean: '훌륭해요!', Japanese: 'すごい!', Spanish: '¡Excelente!', French: 'Excellent!',
    German: 'Ausgezeichnet!', Arabic: 'ممتاز!', Italian: 'Eccellente!', English: 'Excellent!'
  };
  const nativeGoodTry = {
    Korean: '괜찮아요!', Japanese: '大丈夫!', Spanish: '¡Buen intento!', French: 'Bon effort!',
    German: 'Guter Versuch!', Arabic: 'محاولة جيدة!', Italian: 'Buon tentativo!', English: 'Good try!'
  };
  const nativeAlmost = {
    Korean: '거의 다 왔어요!', Japanese: 'もう少し!', Spanish: '¡Casi!', French: 'Presque!',
    German: 'Fast!', Arabic: 'تقريباً!', Italian: 'Quasi!', English: 'Almost!'
  };

  let storyContext = `We are exploring and learning ${language} words in real-life situations.`;
  if (category) {
    const cat = category.toLowerCase();
    if (cat.includes('restaurant') || cat.includes('food')) storyContext = `We're at a local restaurant ordering in ${language}.`;
    else if (cat.includes('airport')) storyContext = `We just arrived at the airport. Let's navigate in ${language}!`;
    else if (cat.includes('hotel')) storyContext = `We're checking into the hotel — time to practice ${language}!`;
    else if (cat.includes('coffee') || cat.includes('cafe')) storyContext = `We're at a cozy café — let's order in ${language}!`;
    else if (cat.includes('market') || cat.includes('shop')) storyContext = `We're at the market — let's shop in ${language}!`;
    else if (cat.includes('school') || cat.includes('stud')) storyContext = `We're in class practicing ${language} conversations.`;
  }

  let dialogue = '';
  if (isWordCard) {
    if (level === 'Beginner') {
      dialogue = `${nativeGreetings[language] || ''} Look at this word: "${correctAnswer}". Listen to how it sounds, then repeat after me!`;
    } else if (level === 'Intermediate') {
      dialogue = `${nativeGreetings[language] || ''} Observe: "${correctAnswer}" — pay attention to the pronunciation. Try saying it aloud!`;
    } else {
      dialogue = `"${correctAnswer}" — ${char.name} says: Focus on the natural flow and rhythm as you pronounce this word.`;
    }
  } else if (feedback === 'retry') {
    dialogue = `${nativeAlmost[language] || 'Almost!'} ${char.name} says: Check the hint above and try one more time. You've got this!`;
  } else if (feedback === 'wrong') {
    dialogue = `${nativeGoodTry[language] || 'Good try!'} The answer is "${correctAnswer}". Let's remember this and keep going!`;
  } else if (feedback === 'correct') {
    const encouragements = [
      `${nativeExcellent[language] || 'Excellent!'} You're picking up ${language} so fast!`,
      `${nativeExcellent[language] || 'Fantastic!'} That's exactly right!`,
      `${nativeExcellent[language] || 'Perfect!'} You have a great feel for ${language}!`,
      `${nativeExcellent[language] || 'Spot on!'} Let's keep this momentum going!`,
      `${nativeExcellent[language] || 'Amazing!'} You've got it!`
    ];
    dialogue = encouragements[currentIndex % encouragements.length];
  } else if (currentIndex === 0 && !answered) {
    dialogue = `${nativeGreetings[language] || 'Hi!'} I'm ${char.name}, your ${char.role}. ${storyContext} Let's learn ${language} naturally!`;
  } else {
    if (questionType === 'speak') {
      dialogue = `Time to speak ${language}! Say "${correctAnswer}" aloud. Focus on natural pronunciation.`;
    } else if (questionType === 'listen') {
      dialogue = `Listen carefully to the ${language} pronunciation. Which choice matches what you hear?`;
    } else if (questionType === 'match') {
      dialogue = `Let's match ${language} words with their meanings to build strong memory connections!`;
    } else if (questionType === 'translate') {
      dialogue = `Now try translating this ${language} sentence. Think about the word order and meaning!`;
    } else if (questionType === 'fill-blank') {
      dialogue = `Complete the ${language} sentence by filling in the missing word!`;
    } else {
      dialogue = `Let's practice what we've learned. Which ${language} answer fits this scenario?`;
    }
  }

  React.useEffect(() => {
    if (dialogue) {
      const cleanDialogue = dialogue.replace(/\([^)]*\)/g, '').replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "").trim();
      playAudio(cleanDialogue, 'English');
    }
  }, [dialogue]);

  return (
    <div className="flex gap-3 items-start bg-slate-50 dark:bg-slate-900/35 border-2 border-border p-4 rounded-3xl mb-5 shadow-sm animate-fade-in">
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-brand-purple to-indigo-600 flex items-center justify-center text-xl sm:text-2xl shadow-md border border-white/20">
          {char.avatar}
        </div>
        <span className="text-[9px] font-black text-brand-purple mt-1 flex items-center gap-0.5 whitespace-nowrap">
          {char.name} {char.flag}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[8px] font-black text-brand-purple/50 uppercase tracking-widest block mb-0.5">{char.role}</span>
        <div className="text-xs sm:text-sm font-bold text-text-main leading-normal select-text italic">
          "{dialogue}"
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong' | 'retry'
  const [validationError, setValidationError] = useState('');
  const getHeartsCount = (u) => typeof u?.hearts === 'object' ? (u?.hearts?.current ?? 5) : (u?.hearts ?? 5);

  const [lessonHearts, setLessonHearts] = useState(getHeartsCount(user));
  const [startLevel, setStartLevel] = useState(user?.level || 1);
  const [buyingHearts, setBuyingHearts] = useState(false);

  // Natural Language retry attempts tracking
  const [questionAttempts, setQuestionAttempts] = useState({});

  const handleBuyHearts = async () => {
    if (buyingHearts) return;
    setBuyingHearts(true);
    try {
      const res = await api.post('/shop/buy', { itemId: 'heart_refill' });
      if (res.data.success) {
        toast.success('Hearts refilled!');
        setLessonHearts(getHeartsCount(res.data.user));
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

  const numWords = lesson?.words?.length || 0;
  const numQuestions = lesson?.questions?.length || 0;
  const totalQ = numWords + numQuestions;
  
  const isWordCard = currentIndex < numWords;
  const currentWord = isWordCard ? lesson?.words?.[currentIndex] : null;
  const currentQ = !isWordCard ? lesson?.questions?.[currentIndex - numWords] : null;

  const [hasPlayedStart, setHasPlayedStart] = useState(false);
  const [lastQuestionPlayed, setLastQuestionPlayed] = useState(-1);

  useEffect(() => {
    if (lesson && currentIndex === 0 && !answered && !hasPlayedStart) {
      playTeacherStart(lesson.language);
      setHasPlayedStart(true);
    }
  }, [lesson, currentIndex, answered, hasPlayedStart]);

  useEffect(() => {
    if (lesson && !isWordCard && currentQ && !answered && lastQuestionPlayed !== currentIndex) {
      if (currentQ.type !== 'speak') {
        playTeacherQuestion(currentQ.prompt, currentQ.audioText, lesson.language);
      }
      setLastQuestionPlayed(currentIndex);
    }
  }, [lesson, isWordCard, currentQ, answered, currentIndex, lastQuestionPlayed]);

  const getCorrectAnswer = useCallback((q) => {
    if (!q) return '';
    return q.correctAnswer || q.answer || '';
  }, []);

  const handleRetryClick = useCallback(() => {
    setAnswered(false);
    setSelectedAnswer('');
    setUserInput('');
    setFeedback(null);
    setValidationError('');
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

    if (isCorrect) {
      setFeedback('correct');
      if (currentQ.type === 'speak') {
        playAudio("Excellent! Your pronunciation is very close to a native speaker.", 'English');
      } else {
        playTeacherCorrect(correctAns, lesson?.language);
      }
      setAnswers(prev => [...prev, { questionIndex: currentIndex, isCorrect: true, userAnswer, question: currentQ }]);
    } else {
      // Bypasses retry if user explicitly clicked "Skip"
      if (userAnswer === '') {
        setFeedback('wrong');
        playTeacherWrong(correctAns, lesson?.language);
        const nextHearts = Math.max(0, getHeartsCount(user) - 1);
        setLessonHearts(nextHearts);
        
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
        });

        setAnswers(prev => [...prev, { questionIndex: currentIndex, isCorrect: false, userAnswer: '', question: currentQ }]);
        return;
      }

      const attempts = questionAttempts[currentIndex] || 0;
      const nextAttempts = attempts + 1;
      setQuestionAttempts(prev => ({ ...prev, [currentIndex]: nextAttempts }));

      if (nextAttempts === 1) {
        // Natural Acquisition retry flow: teach first, do not deduct hearts on first mistake
        setFeedback('retry');
        if (currentQ.type === 'speak') {
          playAudio("Good try. Listen again...", 'English', false, () => {
            playAudio(correctAns, lesson?.language, true);
          });
        } else {
          playAudio("Almost! Let's reflect on the pattern and try once more.", 'English');
        }
      } else {
        // Repeated mistake: deduct heart
        setFeedback('wrong');
        playTeacherWrong(correctAns, lesson?.language);
        const nextHearts = Math.max(0, getHeartsCount(user) - 1);
        setLessonHearts(nextHearts);
        
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

        setAnswers(prev => [...prev, { questionIndex: currentIndex, isCorrect: false, userAnswer, question: currentQ }]);
      }
    }
  }, [answered, currentQ, currentIndex, user, setUser, getCorrectAnswer, questionAttempts]);

  const hasProvidedAnswer = useCallback(() => {
    if (!currentQ) return false;
    const type = currentQ.type;
    if (type === 'multiple-choice' || type === 'quiz' || type === 'true-false' || type === 'true_false' || type === 'true/false' || type === 'true-or-false' || type === 'speak' || type === 'image-choice' || type === 'identify-image') {
      return !!selectedAnswer;
    }
    if (type === 'translate' || type === 'fill-blank') {
      return !!userInput.trim();
    }
    if (type === 'listen') {
      const hasOptions = (currentQ.options && currentQ.options.length > 0) || (currentQ.imageOptions && currentQ.imageOptions.length > 0);
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
    if (type === 'multiple-choice' || type === 'quiz' || type === 'true-false' || type === 'true_false' || type === 'true/false' || type === 'true-or-false' || type === 'speak' || type === 'match' || type === 'image-choice' || type === 'identify-image') {
      answerToSubmit = selectedAnswer;
    } else if (type === 'translate' || type === 'fill-blank') {
      answerToSubmit = userInput.trim();
    } else if (type === 'listen') {
      const hasOptions = (currentQ.options && currentQ.options.length > 0) || (currentQ.imageOptions && currentQ.imageOptions.length > 0);
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
    stopAudio();
    const isWordCard = currentIndex < (lesson?.words?.length || 0);
    const currentAns = isWordCard 
      ? [...answers, { questionIndex: currentIndex, isCorrect: true, userAnswer: lesson?.words?.[currentIndex]?.targetWord }] 
      : [...answers];

    if (currentIndex < totalQ - 1) {
      setCurrentIndex(prev => prev + 1);
      setAnswered(false);
      setSelectedAnswer('');
      setUserInput('');
      setFeedback(null);
      if (isWordCard) setAnswers(currentAns);
    } else {
      // Submit lesson
      setIsSubmitting(true);
      try {
        const allAnswers = currentAns;
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
      } catch (error) {
        console.error('Error submitting lesson:', error);
        toast.error('Failed to submit lesson results.');
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [currentIndex, totalQ, answers, submitLesson, id, user, setUser]);

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

  const visualEnv = getCategoryVisual(lesson?.category, lesson?.title);
  const flowIndex = getActiveFlowStepIndex(isWordCard, currentQ?.type);

  return (
    <div className={`min-h-screen bg-gradient-to-br ${visualEnv.bg} dark:from-bg-main dark:to-bg-main flex flex-col transition-all duration-700`}>
      {/* Top Bar */}
      <div className="sticky top-0 bg-white/80 dark:bg-bg-card/85 backdrop-blur-md border-b-2 border-border/80 dark:border-border z-10 px-4 md:px-8 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/learn')} className="text-brand-dark/40 hover:text-text-main transition cursor-pointer">
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
          {/* Environment Scene Header */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-extrabold uppercase tracking-widest text-brand-blue bg-brand-blue/10 border-2 border-brand-blue/20 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-sm">
              <span>{visualEnv.icon}</span>
              <span>{visualEnv.title}</span>
            </span>
            <span className="text-[10px] font-black text-brand-purple uppercase bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 px-3 py-1 rounded-full">
              Story Mode
            </span>
          </div>

          {/* Natural Language Acquisition Pipeline */}
          <AcquisitionPipeline activeIndex={flowIndex} />

          {/* AI Teacher Avatar Speech Bubble */}
          <AITeacherBubble 
            language={lesson?.language}
            category={lesson?.category}
            title={lesson?.title}
            currentIndex={currentIndex}
            stage={feedback === 'retry' ? 'retry' : answered ? feedback : 'question'}
            questionType={currentQ?.type}
            answered={answered}
            feedback={feedback}
            selectedAnswer={selectedAnswer || userInput}
            correctAnswer={isWordCard ? currentWord?.targetWord : getCorrectAnswer(currentQ)}
            isWordCard={isWordCard}
            userLevel={user?.level || 1}
          />

          {/* Question Type Renderer */}
          <QuestionErrorBoundary onSkip={() => handleAnswer('')}>
            {(() => {
              if (currentWord) {
                return <WordCard word={currentWord} language={lesson?.language} />;
              }
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
              if (type === 'image-choice' || type === 'identify-image') {
                return (
                  <ImageChoice
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
        currentWord
          ? 'bg-white dark:bg-bg-card border-border dark:border-border'
          : answered
            ? feedback === 'correct'
              ? 'bg-brand-green/10 border-brand-green/30 dark:bg-green-950/20 dark:border-brand-green/20'
              : feedback === 'retry'
                ? 'bg-amber-500/10 border-amber-500/30 dark:bg-amber-950/20 dark:border-amber-500/20'
                : 'bg-brand-red/10 border-brand-red/30 dark:bg-red-950/20 dark:border-brand-red/20'
            : 'bg-white dark:bg-bg-card border-border dark:border-border'
      }`}>
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          {currentWord ? (
            <div className="w-full flex justify-end">
              <button
                disabled={isSubmitting}
                onClick={handleNext}
                className={`flex items-center justify-center gap-2 font-extrabold py-4 px-12 rounded-2xl btn-3d text-white text-sm transition cursor-pointer bg-brand-blue shadow-3d-blue hover:bg-brand-blue-hover w-full md:w-auto ${isSubmitting ? 'opacity-70 cursor-wait' : ''}`}
              >
                {isSubmitting ? (
                  <><Loader2 size={18} className="animate-spin" /> Submitting...</>
                ) : (
                  <>{currentIndex < totalQ - 1 ? 'Continue' : 'Finish'} <ChevronRight size={18} /></>
                )}
              </button>
            </div>
          ) : answered ? (
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
                ) : feedback === 'retry' ? (
                  <>
                    <AlertCircle size={28} className="text-amber-500 animate-pulse" />
                    <div>
                      <p className="font-extrabold text-amber-600">Let's try again! 💡</p>
                      <p className="text-xs font-semibold text-amber-600/70">Review the character's hint above.</p>
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

              {feedback === 'retry' ? (
                <Button
                  variant="custom"
                  onClick={handleRetryClick}
                  className="flex items-center gap-2 font-extrabold py-3 px-8 rounded-2xl btn-3d text-white text-sm transition cursor-pointer bg-amber-500 shadow-[0_4px_0_0_#d97706] hover:bg-amber-600"
                >
                  Try Again
                </Button>
              ) : (
                <Button
                  variant="custom"
                  loading={isSubmitting}
                  onClick={handleNext}
                  className={`flex items-center gap-2 font-extrabold py-3 px-6 rounded-2xl btn-3d text-white text-sm transition cursor-pointer ${
                    feedback === 'correct'
                      ? 'bg-brand-green shadow-3d-green hover:bg-brand-green-hover'
                      : 'bg-brand-red shadow-3d-red hover:bg-brand-red-hover'
                  }`}
                >
                  {currentIndex < totalQ - 1 ? 'Continue' : 'Finish'}
                  <ChevronRight size={18} />
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                variant="custom"
                onClick={() => handleAnswer('')}
                className="font-extrabold py-3 px-6 rounded-2xl border-2 border-border dark:border-border bg-white dark:bg-bg-card text-brand-dark/60 hover:bg-brand-light transition text-sm cursor-pointer"
              >
                Skip
              </Button>

              <div className="flex flex-col items-end gap-1">
                {validationError && (
                  <span className="text-[10px] font-bold text-brand-red animate-pulse mb-1">
                    {validationError}
                  </span>
                )}
                <Button
                  variant="custom"
                  onClick={handleCheckClick}
                  className={`font-extrabold py-3 px-8 rounded-2xl btn-3d text-white text-sm transition-all duration-200 ${
                    isAnswerProvided
                      ? 'bg-brand-blue shadow-3d-blue hover:bg-brand-blue-hover cursor-pointer'
                      : 'bg-brand-gray/40 text-brand-dark/30 shadow-none cursor-not-allowed opacity-60'
                  }`}
                >
                  Check Answer
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonRunner;
