import React, { createContext, useState, useContext } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const LearningContext = createContext(null);

export const LearningProvider = ({ children }) => {
  const { setUser } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [learningState, setLearningState] = useState(null);
  const [practiceQuestions, setPracticeQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLessons = async (language = null) => {
    setLoading(true);
    setError(null);
    const selectedLanguage = language || 'Spanish';
    try {
      const url = `/lessons?language=${selectedLanguage}`;
      const res = await api.get(url);
      if (res.data.success) {
        setLessons(res.data.lessons);
        return res.data.lessons;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch lessons');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchLesson = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/lessons/${id}`);
      if (res.data.success) {
        setCurrentLesson(res.data.lesson);
        return res.data.lesson;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch lesson');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const submitLesson = async (id, answers, totalQuestions) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(`/lessons/${id}/submit`, { answers, totalQuestions });
      if (res.data.success) {
        await fetchLessons();
        await fetchLearningState();
        return res.data;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await api.get('/leaderboard');
      if (res.data.success) {
        setLeaderboard(res.data.leaders);
        return res.data;
      }
    } catch (err) {
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
        return res.data;
      }
    } catch (err) {
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
        return res.data.questions;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch practice questions');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <LearningContext.Provider value={{
      lessons, currentLesson, leaderboard, learningState, practiceQuestions,
      loading, error,
      fetchLessons, fetchLesson, submitLesson,
      fetchLeaderboard, fetchLearningState, claimDailyQuest,
      fetchPracticeSession,
      fetchLeagueLeaderboard,
      fetchFriendsLeaderboard,
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
