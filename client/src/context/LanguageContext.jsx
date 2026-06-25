import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { translations } from '../services/translations';
import api from '../services/api';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const { user, setUser } = useAuth();
  const [websiteLanguage, setWebsiteLanguage] = useState('English');

  // Load language from logged-in user or localstorage fallback
  useEffect(() => {
    if (user?.websiteLanguage) {
      setWebsiteLanguage(user.websiteLanguage);
    } else {
      const stored = localStorage.getItem('lingoleap_website_lang');
      if (stored && translations[stored]) {
        setWebsiteLanguage(stored);
      }
    }
  }, [user]);

  const changeWebsiteLanguage = async (newLang) => {
    if (!translations[newLang]) return;
    setWebsiteLanguage(newLang);
    localStorage.setItem('lingoleap_website_lang', newLang);

    // If logged in, update settings in the database
    if (user) {
      try {
        const res = await api.put('/auth/update', { websiteLanguage: newLang });
        if (res.data.success && res.data.user) {
          localStorage.setItem('lingoleap_user', JSON.stringify(res.data.user));
          setUser(res.data.user);
        }
      } catch (err) {
        console.error('Failed to sync website language to server:', err);
      }
    }
  };

  const t = (key) => {
    const langDict = translations[websiteLanguage] || translations['English'];
    return langDict[key] || translations['English'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ websiteLanguage, changeWebsiteLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
