import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const LearningContext = createContext(null);

export const LearningProvider = ({ children }) => {
  const { user, setUser } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [learningState, setLearningState] = useState(null);
  const [practiceQuestions, setPracticeQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Offline state tracking
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const isSyncing = useRef(false);

  // Read initial pending submissions count
  useEffect(() => {
    const pending = JSON.parse(localStorage.getItem('lingoleap_pending_submissions') || '[]');
    setPendingSyncCount(pending.length);
  }, []);

  // Sync function to upload pending progress when online
  const syncOfflineSubmissions = async () => {
    if (!navigator.onLine || isSyncing.current) return;
    const pending = JSON.parse(localStorage.getItem('lingoleap_pending_submissions') || '[]');
    if (pending.length === 0) return;

    isSyncing.current = true;
    let successCount = 0;
    const remainingPending = [];

    // Save a toast instance ID to update the user with progress
    const toastId = toast.loading('Syncing offline progress...');

    for (const sub of pending) {
      try {
        const res = await api.post(`/lessons/${sub.id}/submit`, {
          answers: sub.answers,
          totalQuestions: sub.totalQuestions
        });
        if (res.data.success) {
          successCount++;
          if (res.data.user && setUser) {
            setUser(res.data.user);
            localStorage.setItem('lingoleap_user', JSON.stringify(res.data.user));
          }
        } else {
          remainingPending.push(sub);
        }
      } catch (err) {
        console.error(`Syncing lesson ${sub.id} failed:`, err);
        remainingPending.push(sub);
      }
    }

    localStorage.setItem('lingoleap_pending_submissions', JSON.stringify(remainingPending));
    setPendingSyncCount(remainingPending.length);
    isSyncing.current = false;

    if (successCount > 0) {
      toast.success(`Synced ${successCount} offline lesson(s) successfully!`, { id: toastId });
      // Refresh lessons tree
      const selectedLanguage = user?.targetLanguage || 'Spanish';
      const url = `/lessons?language=${selectedLanguage}`;
      try {
        const res = await api.get(url);
        if (res.data.success) {
          setLessons(res.data.lessons);
          localStorage.setItem(`lingoleap_lessons_${selectedLanguage}`, JSON.stringify(res.data.lessons));
        }
      } catch (e) {
        console.error('Failed to refresh lessons list after sync:', e);
      }
    } else {
      toast.dismiss(toastId);
    }
  };

  // Listen to network status change
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineSubmissions();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Run sync on load if online
    if (navigator.onLine) {
      syncOfflineSubmissions();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user?._id]);

  const fetchLessons = async (language = null) => {
    setLoading(true);
    const selectedLanguage = language || user?.targetLanguage || 'Spanish';
    try {
      const url = `/lessons?language=${selectedLanguage}`;
      const res = await api.get(url);
      if (res.data.success) {
        setLessons(res.data.lessons);
        localStorage.setItem(`lingoleap_lessons_${selectedLanguage}`, JSON.stringify(res.data.lessons));
        // Individual lessons are cached on-demand in fetchLesson()
        return res.data.lessons;
      }
    } catch (err) {
      console.warn('Network request failed, checking offline lessons cache...', err);
      const cached = localStorage.getItem(`lingoleap_lessons_${selectedLanguage}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        setLessons(parsed);
        return parsed;
      }
      setError(err.response?.data?.message || 'Failed to fetch lessons');
    } finally {
      setLoading(false);
    }
  };

  const fetchLesson = async (id) => {
    setLoading(true);
    try {
      const res = await api.get(`/lessons/${id}`);
      if (res.data.success) {
        setCurrentLesson(res.data.lesson);
        localStorage.setItem(`lingoleap_lesson_${id}`, JSON.stringify(res.data.lesson));
        return res.data.lesson;
      }
    } catch (err) {
      console.warn('Network request failed, checking cached lesson details...', err);
      const cached = localStorage.getItem(`lingoleap_lesson_${id}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        setCurrentLesson(parsed);
        return parsed;
      }
      // Fallback: look in the currently loaded lessons state
      const found = lessons.find(l => l._id === id);
      if (found) {
        setCurrentLesson(found);
        return found;
      }
      setError(err.response?.data?.message || 'Failed to fetch lesson');
    } finally {
      setLoading(false);
    }
  };

  const submitLesson = async (id, answers, totalQuestions) => {
    setLoading(true);
    try {
      const res = await api.post(`/lessons/${id}/submit`, { answers, totalQuestions });
      if (res.data.success) {
        await fetchLessons();
        await fetchLearningState();
        return res.data;
      }
    } catch (err) {
      const isOfflineError = !err.response || !navigator.onLine;
      if (isOfflineError) {
        const selectedLanguage = user?.targetLanguage || 'Spanish';
        const cached = localStorage.getItem(`lingoleap_lessons_${selectedLanguage}`);
        let parsedLessons = cached ? JSON.parse(cached) : [...lessons];
        
        const lesson = parsedLessons.find(l => l._id === id);
        if (lesson) {
          const correctCount = answers.filter(a => a.isCorrect).length;
          const score = Math.round((correctCount / totalQuestions) * 100);
          const xpEarned = Math.round((score / 100) * (lesson.xpReward || 15));
          
          // Queue offline submission
          const pending = JSON.parse(localStorage.getItem('lingoleap_pending_submissions') || '[]');
          if (!pending.some(p => p.id === id)) {
            pending.push({ id, answers, totalQuestions, timestamp: Date.now() });
            localStorage.setItem('lingoleap_pending_submissions', JSON.stringify(pending));
            setPendingSyncCount(pending.length);
          }
          
          // Update local status of lesson
          parsedLessons = parsedLessons.map((l) => {
            if (l._id === id) {
              return { ...l, isCompleted: true };
            }
            return l;
          });
          parsedLessons = parsedLessons.map((l, idx) => {
            const isLocked = idx > 0 && !parsedLessons[idx - 1].isCompleted;
            return { ...l, isLocked };
          });
          
          setLessons(parsedLessons);
          localStorage.setItem(`lingoleap_lessons_${selectedLanguage}`, JSON.stringify(parsedLessons));
          
          // Update user level and XP
          if (user && setUser) {
            const updatedUser = { ...user };
            updatedUser.xp += xpEarned;
            const newLevel = Math.floor(Math.sqrt(updatedUser.xp / 100)) + 1;
            if (newLevel > updatedUser.level) {
              updatedUser.level = newLevel;
            }
            if (!updatedUser.unlockedLessons.includes(id)) {
              updatedUser.unlockedLessons.push(id);
            }
            setUser(updatedUser);
            localStorage.setItem('lingoleap_user', JSON.stringify(updatedUser));
          }
          
          toast.success("Offline: Progress saved locally. We'll sync with the server once you're back online!");
          
          return {
            success: true,
            score,
            xpEarned,
            user: user ? { ...user, xp: user.xp + xpEarned } : null,
            message: 'Offline complete!'
          };
        }
      }
      setError(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await api.get('/leaderboard');
      if (res.data.success) {
        setLeaderboard(res.data.leaders);
        localStorage.setItem('lingoleap_leaderboard', JSON.stringify(res.data.leaders));
        return res.data;
      }
    } catch (err) {
      const cached = localStorage.getItem('lingoleap_leaderboard');
      if (cached) {
        setLeaderboard(JSON.parse(cached));
        return { leaders: JSON.parse(cached) };
      }
      setError(err.response?.data?.message || 'Failed to fetch leaderboard');
    }
  };

  const fetchLeagueLeaderboard = async () => {
    try {
      const res = await api.get('/leaderboards/current');
      return res.data;
    } catch (err) {
      console.error('Fetch league leaderboard error:', err);
      return null;
    }
  };

  const fetchFriendsLeaderboard = async () => {
    try {
      const res = await api.get('/leaderboards/friends');
      return res.data;
    } catch (err) {
      console.error('Fetch friends leaderboard error:', err);
      return null;
    }
  };

  const fetchLearningState = async () => {
    try {
      const res = await api.get('/learning-state');
      if (res.data.success) {
        setLearningState(res.data);
        if (res.data.user && setUser) {
          setUser(res.data.user);
          localStorage.setItem('lingoleap_user', JSON.stringify(res.data.user));
        }
        localStorage.setItem('lingoleap_learning_state', JSON.stringify(res.data));
        return res.data;
      }
    } catch (err) {
      console.warn('Network request failed, checking learning state cache...', err);
      const cached = localStorage.getItem('lingoleap_learning_state');
      if (cached) {
        const parsed = JSON.parse(cached);
        setLearningState(parsed);
        return parsed;
      }
      setError(err.response?.data?.message || 'Failed to fetch learning state');
    }
  };

  const claimDailyQuest = async (questId) => {
    try {
      const res = await api.post(`/quests/${questId}/claim`);
      if (res.data.success) {
        if (res.data.user && setUser) {
          setUser(res.data.user);
          localStorage.setItem('lingoleap_user', JSON.stringify(res.data.user));
        }
        await fetchLearningState();
        return res.data;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to claim quest');
      return { success: false, error: err.response?.data?.message || 'Failed to claim quest' };
    }
  };

  const fetchPracticeSession = async () => {
    setLoading(true);
    try {
      const res = await api.get('/practice/recommend');
      if (res.data.success) {
        setPracticeQuestions(res.data.questions);
        localStorage.setItem('lingoleap_practice_questions', JSON.stringify(res.data.questions));
        return res.data.questions;
      }
    } catch (err) {
      console.warn('Network request failed, retrieving practice questions offline...', err);
      const cachedQ = localStorage.getItem('lingoleap_practice_questions');
      if (cachedQ) {
        const parsed = JSON.parse(cachedQ);
        setPracticeQuestions(parsed);
        return parsed;
      }
      
      // Dynamic generation from cached lessons
      const selectedLanguage = user?.targetLanguage || 'Spanish';
      const cachedLessons = localStorage.getItem(`lingoleap_lessons_${selectedLanguage}`);
      if (cachedLessons) {
        const parsed = JSON.parse(cachedLessons);
        const completedLessons = parsed.filter(l => l.isCompleted);
        
        let practiceQ = [];
        completedLessons.forEach(l => {
          if (l.questions) {
            l.questions.forEach(q => practiceQ.push({ ...q, lessonTitle: l.title }));
          }
        });
        
        practiceQ = practiceQ.sort(() => 0.5 - Math.random()).slice(0, 10);
        
        if (practiceQ.length === 0 && parsed.length > 0 && parsed[0].questions) {
          practiceQ = parsed[0].questions.map(q => ({ ...q, lessonTitle: parsed[0].title })).slice(0, 5);
        }
        
        if (practiceQ.length > 0) {
          setPracticeQuestions(practiceQ);
          return practiceQ;
        }
      }
      setError(err.response?.data?.message || 'Failed to fetch practice questions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LearningContext.Provider value={{
      lessons, currentLesson, leaderboard, learningState, practiceQuestions,
      loading, error, isOnline, pendingSyncCount,
      fetchLessons, fetchLesson, submitLesson,
      fetchLeaderboard, fetchLearningState, claimDailyQuest,
      fetchPracticeSession,
      fetchLeagueLeaderboard,
      fetchFriendsLeaderboard,
      syncOfflineSubmissions,
    }}>
      {children}
    </LearningContext.Provider>
  );
};

export const useLearning = () => {
  const context = useContext(LearningContext);
  if (!context) throw new Error('useLearning must be used inside LearningProvider');
  return context;
};
