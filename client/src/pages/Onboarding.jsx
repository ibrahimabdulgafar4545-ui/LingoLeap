import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Globe, MessageSquare, Compass, Flame, Trophy, Award, 
  ChevronRight, ChevronLeft, Check, Sparkles, Smile, Star
} from 'lucide-react';
import api from '../services/api';
import confetti from 'canvas-confetti';

const nativeLanguages = [
  { name: 'English', flag: '🇬🇧' },
  { name: 'Spanish', flag: '🇪🇸' },
  { name: 'French', flag: '🇫🇷' },
  { name: 'German', flag: '🇩🇪' },
  { name: 'Arabic', flag: '🇸🇦' },
  { name: 'Chinese', flag: '🇨🇳' },
  { name: 'Italian', flag: '🇮🇹' },
  { name: 'Japanese', flag: '🇯🇵' },
  { name: 'Portuguese', flag: '🇵🇹' }
];

const targetLanguages = [
  { name: 'English', flag: '🇬🇧', desc: 'Global communication' },
  { name: 'Spanish', flag: '🇪🇸', desc: 'Vibrant cultures' },
  { name: 'French', flag: '🇫🇷', desc: 'Art & romance' },
  { name: 'German', flag: '🇩🇪', desc: 'Science & business' },
  { name: 'Arabic', flag: '🇸🇦', desc: 'Rich heritage' },
  { name: 'Italian', flag: '🇮🇹', desc: 'History & cuisine' },
  { name: 'Korean', flag: '🇰🇷', desc: 'South Korea, K-Pop & culture' },
  { name: 'Japanese', flag: '🇯🇵', desc: 'Japan, Anime & traditions' }
];

const learningGoals = [
  { id: 'Travel', label: '✈️ Travel & Culture', desc: 'Order food, ask directions, connect with locals' },
  { id: 'School', label: '🏫 School & Studies', desc: 'Ace exams, write essays, build academic skills' },
  { id: 'Business', label: '💼 Career & Business', desc: 'Negotiations, emails, international career growth' },
  { id: 'Exams', label: '📝 Language Certification', desc: 'Prepare for DELE, DELF, TOEFL, etc.' },
  { id: 'Casual Conversation', label: '💬 Casual Conversation', desc: 'Chat naturally with friends and family' }
];

const dailyGoals = [
  { id: '5 min', label: '⚡ 5 min / day (Casual)', desc: 'Easy progress, zero pressure', xp: 10 },
  { id: '10 min', label: '🔥 10 min / day (Regular)', desc: 'Steady building block', xp: 20 },
  { id: '15 min', label: '🏆 15 min / day (Serious)', desc: 'Excellent daily habit', xp: 30 },
  { id: '30 min', label: '👑 30 min / day (Insane)', desc: 'Rapid skill acquisition', xp: 50 },
  { id: '60 min', label: '🚀 60 min / day (Hardcore)', desc: 'Complete immersion', xp: 100 }
];

const placementLevels = [
  { id: 'Beginner', label: 'Beginner', desc: 'I am starting from scratch, learning basic words' },
  { id: 'Intermediate', label: 'Intermediate', desc: 'I can form sentences and handle simple chats' },
  { id: 'Advanced', label: 'Advanced', desc: 'I can read complex articles and converse fluently' }
];

const Onboarding = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const totalSteps = 7;

  // Selections
  const [nativeLanguage, setNativeLanguage] = useState('English');
  const [targetLanguage, setTargetLanguage] = useState(user?.targetLanguage || 'Spanish');
  const [learningGoal, setLearningGoal] = useState('Casual Conversation');
  const [dailyGoal, setDailyGoal] = useState('10 min');
  const [skillLevel, setSkillLevel] = useState('Beginner');
  const [submitting, setSubmitting] = useState(false);

  // Dynamic Options States
  const [nativeLanguagesList, setNativeLanguagesList] = useState(nativeLanguages);
  const [targetLanguagesList, setTargetLanguagesList] = useState(targetLanguages);
  const [learningGoalsList, setLearningGoalsList] = useState(learningGoals);
  const [dailyGoalsList, setDailyGoalsList] = useState(dailyGoals);
  const [placementLevelsList, setPlacementLevelsList] = useState(placementLevels);

  // Fetch dynamic configurations
  useEffect(() => {
    const fetchOnboardingConfig = async () => {
      try {
        const res = await api.get('/lessons/onboarding-content');
        if (res.data.success && res.data.onboarding) {
          const config = res.data.onboarding;
          if (config.nativeLanguages) setNativeLanguagesList(config.nativeLanguages);
          if (config.targetLanguages) setTargetLanguagesList(config.targetLanguages);
          if (config.learningGoals) setLearningGoalsList(config.learningGoals);
          if (config.dailyGoals) setDailyGoalsList(config.dailyGoals);
          if (config.placementLevels) setPlacementLevelsList(config.placementLevels);
        }
      } catch (err) {
        console.warn('Could not fetch onboarding config, using static defaults:', err);
      }
    };
    fetchOnboardingConfig();
  }, []);

  // Prefill target language if set on profile
  useEffect(() => {
    if (user?.targetLanguage) {
      setTargetLanguage(user.targetLanguage);
    }
  }, [user]);

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSkip = () => {
    // Skip option only allowed if user has already completed onboarding
    if (user?.isOnboarded) {
      navigate('/dashboard');
    }
  };

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      const res = await api.post('/auth/onboarding', {
        nativeLanguage,
        targetLanguage,
        learningGoal,
        dailyGoal,
        skillLevel
      });

      if (res.data.success) {
        // Trigger completion sound/confetti
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });

        // Update local session state
        if (res.data.user) {
          localStorage.setItem('lingoleap_user', JSON.stringify(res.data.user));
          setUser(res.data.user);
        }

        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (err) {
      console.error('Onboarding update failed:', err);
      alert('Could not save your preferences. Please try again!');
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-next helper for card clicks
  const selectAndNext = (setter, value) => {
    setter(value);
    setTimeout(() => {
      handleNext();
    }, 250);
  };

  return (
    <div className="min-h-screen bg-brand-light flex flex-col justify-between py-6 px-4 md:px-8">
      {/* Top Header & Progress bar */}
      <div className="max-w-2xl w-full mx-auto">
        <div className="flex items-center justify-between gap-4 mb-4">
          {step > 1 ? (
            <button 
              onClick={handleBack} 
              className="p-2 text-brand-dark/40 hover:text-text-main hover:bg-brand-gray/20 rounded-xl transition"
            >
              <ChevronLeft size={20} />
            </button>
          ) : (
            <div className="w-9" />
          )}

          {/* Progress Indicator */}
          <div className="flex-1 bg-brand-gray/30 h-3.5 rounded-full overflow-hidden border border-border dark:border-border">
            <div 
              className="bg-brand-green h-full rounded-full transition-all duration-300 progress-stripe"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>

          <div className="text-xs font-black text-brand-dark/40 w-12 text-right">
            {step}/{totalSteps}
          </div>

          {/* Conditional Skip Button */}
          {user?.isOnboarded ? (
            <button 
              onClick={handleSkip} 
              className="text-xs font-extrabold text-brand-blue hover:text-blue-600 transition"
            >
              Skip
            </button>
          ) : (
            <div className="w-8" />
          )}
        </div>
      </div>

      {/* Main Wizard Area */}
      <div className="max-w-xl w-full mx-auto bg-white dark:bg-bg-card border-2 border-border dark:border-border rounded-3xl p-6 md:p-8 shadow-3d-card flex-1 my-4 flex flex-col justify-between min-h-[480px]">
        
        {/* STEP 1: WELCOME SCREEN */}
        {step === 1 && (
          <div className="flex flex-col items-center justify-center text-center flex-1 my-auto fade-in-up">
            <div className="w-24 h-24 bg-gradient-to-br from-brand-purple/10 to-indigo-100 rounded-3xl flex items-center justify-center mb-6 shadow-sm animate-bounce">
              <Sparkles size={48} className="text-brand-purple animate-pulse" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-text-main mb-3">Welcome to LingoLeap!</h1>
            <p className="text-sm font-semibold text-brand-dark/50 leading-relaxed max-w-sm mb-6">
              Let's customize your profile settings to create the perfect language learning path tailored for you.
            </p>
            <button
              onClick={handleNext}
              className="bg-brand-purple text-white px-8 py-4 rounded-2xl font-extrabold text-sm btn-3d shadow-3d-purple flex items-center gap-2 hover:bg-purple-600 w-full max-w-xs"
            >
              Let's Go! <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* STEP 2: NATIVE LANGUAGE */}
        {step === 2 && (
          <div className="fade-in-up flex-1 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-black text-text-main text-center mb-1">What is your native language?</h2>
              <p className="text-xs font-bold text-brand-dark/40 text-center mb-5">We will explain grammar rules and definitions in this language</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {nativeLanguagesList.map((lang) => (
                  <button
                    key={lang.name}
                    onClick={() => selectAndNext(setNativeLanguage, lang.name)}
                    className={`py-3 px-2 border-2 rounded-xl text-center flex flex-col items-center justify-center font-bold text-xs gap-1 transition ${
                      nativeLanguage === lang.name 
                        ? 'border-brand-purple bg-brand-purple/5 text-brand-purple scale-[1.03]' 
                        : 'border-border dark:border-border hover:bg-brand-light text-brand-dark/70'
                    }`}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <span>{lang.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: TARGET LANGUAGE */}
        {step === 3 && (
          <div className="fade-in-up flex-1 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-black text-text-main text-center mb-1">What language do you want to learn?</h2>
              <p className="text-xs font-bold text-brand-dark/40 text-center mb-5">Select your primary practice language</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {targetLanguagesList.map((lang) => (
                  <button
                    key={lang.name}
                    onClick={() => selectAndNext(setTargetLanguage, lang.name)}
                    className={`p-4 border-2 rounded-2xl text-left flex items-center gap-3.5 transition ${
                      targetLanguage === lang.name 
                        ? 'border-brand-purple bg-brand-purple/5 text-brand-purple' 
                        : 'border-border dark:border-border hover:bg-brand-light'
                    }`}
                  >
                    <span className="text-3xl">{lang.flag}</span>
                    <div>
                      <div className="font-extrabold text-sm text-text-main">{lang.name}</div>
                      <div className="text-[10px] text-brand-dark/40 font-semibold">{lang.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: LEARNING GOAL */}
        {step === 4 && (
          <div className="fade-in-up flex-1 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-black text-text-main text-center mb-1">What is your motivation?</h2>
              <p className="text-xs font-bold text-brand-dark/40 text-center mb-5">We will recommend lessons and practice scenarios based on your goal</p>
              
              <div className="flex flex-col gap-2.5">
                {learningGoalsList.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => selectAndNext(setLearningGoal, goal.id)}
                    className={`w-full text-left p-4 border-2 rounded-2xl transition ${
                      learningGoal === goal.id 
                        ? 'border-brand-purple bg-brand-purple/5 text-brand-purple' 
                        : 'border-border dark:border-border hover:bg-brand-light text-brand-dark/70'
                    }`}
                  >
                    <div className="text-xs font-extrabold">{goal.label}</div>
                    <div className="text-[10px] text-brand-dark/50 font-bold mt-0.5">{goal.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: DAILY GOAL */}
        {step === 5 && (
          <div className="fade-in-up flex-1 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-black text-text-main text-center mb-1">Set a Daily Goal</h2>
              <p className="text-xs font-bold text-brand-dark/40 text-center mb-5">How much time do you want to practice each day?</p>
              
              <div className="flex flex-col gap-2.5">
                {dailyGoalsList.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => selectAndNext(setDailyGoal, goal.id)}
                    className={`w-full text-left p-4 border-2 rounded-2xl transition flex items-center justify-between ${
                      dailyGoal === goal.id 
                        ? 'border-brand-purple bg-brand-purple/5 text-brand-purple' 
                        : 'border-border dark:border-border hover:bg-brand-light text-brand-dark/70'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-extrabold">{goal.label}</div>
                      <div className="text-[10px] text-brand-dark/50 font-bold mt-0.5">{goal.desc}</div>
                    </div>
                    <span className="text-[10px] font-black bg-brand-gray/50 px-2 py-1 rounded-lg">
                      +{goal.xp} XP / day
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: PLACEMENT LEVEL */}
        {step === 6 && (
          <div className="fade-in-up flex-1 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-black text-text-main text-center mb-1">What is your current level?</h2>
              <p className="text-xs font-bold text-brand-dark/40 text-center mb-5">Choose where you feel most comfortable starting</p>
              
              <div className="flex flex-col gap-2.5">
                {placementLevelsList.map((lvl) => (
                  <button
                    key={lvl.id}
                    onClick={() => selectAndNext(setSkillLevel, lvl.id)}
                    className={`w-full text-left p-4 border-2 rounded-2xl transition ${
                      skillLevel === lvl.id 
                        ? 'border-brand-purple bg-brand-purple/5 text-brand-purple' 
                        : 'border-border dark:border-border hover:bg-brand-light text-brand-dark/70'
                    }`}
                  >
                    <div className="text-xs font-extrabold">{lvl.label}</div>
                    <div className="text-[10px] text-brand-dark/50 font-bold mt-0.5">{lvl.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: COMPLETION */}
        {step === 7 && (
          <div className="fade-in-up flex-1 flex flex-col justify-between">
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-brand-green/10 border-2 border-brand-green/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Star size={32} className="text-brand-green fill-brand-green" />
              </div>
              <h2 className="text-2xl font-black text-text-main mb-1">All Set! 🚀</h2>
              <p className="text-xs font-bold text-brand-dark/40 mb-6">Here is a quick summary of your profile preferences</p>
              
              {/* Summary Card */}
              <div className="bg-brand-light border-2 border-border dark:border-border rounded-2xl p-5 text-left text-xs font-bold space-y-2 mb-6">
                <div className="flex justify-between border-b border-border dark:border-border pb-1.5">
                  <span className="text-brand-dark/40">Native Language:</span>
                  <span className="text-text-main">{nativeLanguage}</span>
                </div>
                <div className="flex justify-between border-b border-border dark:border-border pb-1.5">
                  <span className="text-brand-dark/40">Learning Language:</span>
                  <span className="text-text-main">{targetLanguage}</span>
                </div>
                <div className="flex justify-between border-b border-border dark:border-border pb-1.5">
                  <span className="text-brand-dark/40">Daily Streak Goal:</span>
                  <span className="text-text-main">{dailyGoal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-dark/40">Skill placement:</span>
                  <span className="text-text-main">{skillLevel}</span>
                </div>
              </div>

              {/* Bonus alert */}
              <div className="bg-brand-purple/10 border border-brand-purple/20 text-brand-purple rounded-xl p-3.5 text-[11px] font-extrabold flex items-center justify-center gap-1.5 mb-6">
                <Sparkles size={13} /> Claim your +50 Gems Welcome Gift!
              </div>

              <button
                onClick={handleComplete}
                disabled={submitting}
                className="bg-brand-green text-white py-4 rounded-2xl font-extrabold text-sm w-full btn-3d shadow-3d-green hover:bg-brand-green-hover"
              >
                {submitting ? 'Setting up path...' : 'Enter LingoLeap Dashboard'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Onboarding;
