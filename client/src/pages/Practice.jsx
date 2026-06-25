import React, { useEffect, useState } from 'react';
import { useLearning } from '../context/LearningContext';
import AppLayout from '../components/common/AppLayout';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Zap, RotateCcw, CheckCircle, XCircle, ChevronRight, Volume2, Heart, Gem, Sparkles, RefreshCw } from 'lucide-react';

const Practice = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const { practiceQuestions, fetchPracticeSession, loading } = useLearning();
  
  const getHeartsCount = (u) => typeof u?.hearts === 'object' ? (u?.hearts?.current ?? 5) : (u?.hearts ?? 5);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [userInput, setUserInput] = useState('');
  const [correct, setCorrect] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [buyingHearts, setBuyingHearts] = useState(false);

  const handleBuyHearts = async () => {
    if (buyingHearts) return;
    setBuyingHearts(true);
    try {
      const res = await api.post('/shop/buy', { itemId: 'heart_refill' });
      if (res.data.success) {
        toast.success('Hearts refilled!');
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
    fetchPracticeSession();
  }, []);

  const questions = practiceQuestions || [];
  const currentQ = questions[currentIndex];
  const totalQ = questions.length;

  const playPromptAudio = (text) => {
    if ('speechSynthesis' in window && text) {
      const utterance = new SpeechSynthesisUtterance(text);
      const langCodes = {
        Spanish: 'es-ES',
        French: 'fr-FR',
        English: 'en-US',
        German: 'de-DE',
        Arabic: 'ar-SA',
        Italian: 'it-IT'
      };
      utterance.lang = langCodes[user?.targetLanguage || 'Spanish'] || 'es-ES';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAnswer = (answer) => {
    if (answered || !currentQ) return;
    const ans = answer || '';
    const correctAns = currentQ.correctAnswer || '';
    setSelectedAnswer(ans);
    setAnswered(true);
    const isCorrect = ans.toLowerCase().trim() === correctAns.toLowerCase().trim();
    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) {
      setCorrect(prev => prev + 1);
    } else {
      const nextHearts = Math.max(0, getHeartsCount(user) - 1);
      
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
  };

  const handleNext = () => {
    if (currentIndex < totalQ - 1) {
      setCurrentIndex(prev => prev + 1);
      setAnswered(false);
      setSelectedAnswer('');
      setUserInput('');
      setFeedback(null);
    } else {
      setSessionDone(true);
    }
  };

  const restartSession = () => {
    fetchPracticeSession();
    setCurrentIndex(0);
    setAnswered(false);
    setSelectedAnswer('');
    setUserInput('');
    setFeedback(null);
    setCorrect(0);
    setSessionDone(false);
  };

  if (sessionDone) {
    const pct = Math.round((correct / totalQ) * 100);
    return (
      <AppLayout>
        <div className="max-w-md mx-auto mt-8 bg-white dark:bg-bg-card rounded-3xl border-2 border-border dark:border-border p-8 text-center shadow-3d-card">
          <div className="text-6xl mb-4">{pct >= 70 ? '🎯' : '💪'}</div>
          <h2 className="text-2xl font-extrabold text-text-main mb-2">Practice Complete!</h2>
          <p className="text-brand-dark/50 font-semibold mb-6">You got {correct} out of {totalQ} correct ({pct}%)</p>
          <div className="w-full bg-brand-gray/30 rounded-full h-4 mb-6">
            <div className="h-4 bg-brand-green rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <button onClick={restartSession} className="w-full bg-brand-green text-white font-extrabold py-4 rounded-2xl btn-3d shadow-3d-green flex items-center justify-center gap-2">
            <RotateCcw size={18} /> Practice Again
          </button>
        </div>
      </AppLayout>
    );
  }

  const userHearts = getHeartsCount(user);

  if (userHearts === 0 && !sessionDone) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto mt-8 bg-white dark:bg-bg-card rounded-3xl border-2 border-border dark:border-border p-8 text-center shadow-3d-card">
          <div className="w-20 h-20 bg-rose-100 border-2 border-rose-200 rounded-2xl flex items-center justify-center text-rose-600 mx-auto mb-4 animate-bounce">
            <Heart size={40} fill="currentColor" className="text-rose-500 animate-pulse" />
          </div>
          <h1 className="text-xl font-black text-text-main mb-2">You're out of Hearts</h1>
          <p className="text-xs font-semibold text-brand-dark/50 leading-relaxed mb-6">
            Hearts regenerate automatically at 1 heart every 30 minutes, or you can purchase an instant refill or gems packages.
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
              onClick={() => navigate('/dashboard')}
              className="w-full bg-white dark:bg-bg-card border-2 border-border dark:border-border text-brand-dark/60 font-extrabold py-3 rounded-2xl text-xs hover:bg-brand-light transition duration-150 cursor-pointer"
            >
              Wait for Hearts to regenerate
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-6 flex justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-main mb-1">Practice Mode ⚡</h1>
          <p className="text-brand-dark/50 font-semibold text-sm">Review what you've learned in randomized sessions</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-brand-red font-extrabold text-sm bg-brand-red/10 border-2 border-brand-red/20 rounded-xl px-2.5 py-1">
            <Heart size={15} fill="currentColor" />
            {getHeartsCount(user)}
          </div>
        </div>
      </div>

      {loading || questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          {loading ? (
            <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Zap size={48} className="text-brand-gray mb-4" />
              <p className="font-extrabold text-lg text-brand-dark/40">No practice material yet!</p>
              <p className="text-sm font-semibold text-brand-dark/30 mt-1">Complete at least one lesson first.</p>
            </>
          )}
        </div>
      ) : (
        <div className="max-w-2xl">
          {/* Progress */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 bg-brand-gray/30 rounded-full h-3">
              <div className="h-3 bg-brand-blue rounded-full transition-all duration-500" style={{ width: `${((currentIndex + (answered ? 1 : 0)) / totalQ) * 100}%` }} />
            </div>
            <span className="text-xs font-extrabold text-brand-dark/50">{currentIndex + 1}/{totalQ}</span>
          </div>

          <div className="bg-white dark:bg-bg-card rounded-3xl border-2 border-border p-4 sm:p-6 shadow-3d-card">
            {currentQ.lessonTitle && (
              <span className="text-[10px] sm:text-xs font-bold text-brand-blue bg-brand-blue/10 border border-brand-blue/20 rounded-full px-3 py-1 mb-4 inline-block">
                {currentQ.lessonTitle}
              </span>
            )}
            
            <div className="flex items-center justify-between gap-4 mb-5">
              <h2 className="text-base sm:text-xl font-extrabold text-text-main leading-snug">{currentQ.prompt}</h2>
              <button 
                onClick={() => playPromptAudio(currentQ.prompt)}
                className="p-2 text-brand-purple hover:scale-110 border border-border dark:border-border hover:bg-brand-purple/5 transition rounded-xl flex-shrink-0 bg-brand-light/35 shadow-sm"
                title="Pronounce prompt text"
              >
                <Volume2 size={16} />
              </button>
            </div>

            {currentQ.options ? (
              <div className="flex flex-col gap-2.5">
                {currentQ.options.map((opt) => {
                  let style = 'border-border dark:border-border bg-brand-light/50 text-text-main hover:bg-brand-light hover:border-brand-blue/40';
                  if (answered) {
                    if (opt === currentQ.correctAnswer) style = 'border-brand-green bg-brand-green/10 text-brand-green';
                    else if (opt === selectedAnswer) style = 'border-brand-red bg-brand-red/10 text-brand-red';
                    else style = 'border-border dark:border-border bg-brand-light/30 text-brand-dark/30';
                  }
                  return (
                    <button key={opt} onClick={() => handleAnswer(opt)} disabled={answered}
                      className={`w-full p-3 sm:p-4 border-2 rounded-2xl text-xs sm:text-sm font-bold text-left transition-all btn-3d shadow-3d-card ${style}`}
                    >{opt}</button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  disabled={answered}
                  placeholder="Type your answer..."
                  rows={2}
                  className="w-full p-3 sm:p-4 border-2 border-border dark:border-border rounded-2xl font-semibold outline-none focus:border-brand-blue resize-none text-xs sm:text-sm bg-brand-light/20"
                />
                {!answered && (
                  <button onClick={() => handleAnswer(userInput)} disabled={!userInput.trim()}
                    className="w-full sm:w-auto bg-brand-blue text-white font-extrabold py-2.5 px-6 rounded-xl sm:rounded-2xl btn-3d shadow-3d-blue text-xs sm:text-sm self-end">
                    Check
                  </button>
                )}
                {answered && (
                  <div className={`p-3 rounded-2xl border-2 text-[11px] sm:text-xs font-bold leading-relaxed ${feedback === 'correct' ? 'border-brand-green/30 bg-brand-green/10 text-brand-green' : 'border-brand-red/30 bg-brand-red/10 text-brand-red'}`}>
                    Correct answer: <span className="font-extrabold underline">{currentQ.correctAnswer || 'Unknown'}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {answered && (
            <div className={`mt-4 p-3.5 sm:p-4 rounded-2xl border-2 flex flex-row items-center justify-between gap-3 ${feedback === 'correct' ? 'bg-brand-green/10 border-brand-green/30' : 'bg-brand-red/10 border-brand-red/30'}`}>
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                {feedback === 'correct'
                  ? <CheckCircle className="text-brand-green w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                  : <XCircle className="text-brand-red w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />}
                <span className={`font-extrabold text-xs sm:text-sm truncate ${feedback === 'correct' ? 'text-brand-green' : 'text-brand-red'}`}>
                  {feedback === 'correct' ? 'Correct!' : 'Incorrect'}
                </span>
              </div>
              <button onClick={handleNext}
                className={`flex items-center gap-0.5 sm:gap-1 font-black text-xs sm:text-sm py-2 px-4 sm:py-2.5 sm:px-6 rounded-xl sm:rounded-2xl text-white btn-3d shrink-0 ${feedback === 'correct' ? 'bg-brand-green shadow-3d-green' : 'bg-brand-red shadow-3d-red'}`}>
                <span>{currentIndex < totalQ - 1 ? 'Next' : 'Finish'}</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
};

export default Practice;
