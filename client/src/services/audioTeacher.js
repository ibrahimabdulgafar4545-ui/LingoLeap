export const getVoiceSettings = () => {
  const defaultSettings = {
    muted: false,
    speed: 1.0,
    voiceType: 'female' // 'male' or 'female'
  };
  const saved = localStorage.getItem('lingoleap_voice_settings');
  return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
};

export const saveVoiceSettings = (settings) => {
  localStorage.setItem('lingoleap_voice_settings', JSON.stringify(settings));
};

export const stopAudio = () => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

export const playAudio = (text, language, force = false, onEnd = null) => {
  if (!window.speechSynthesis) {
    if (onEnd) onEnd();
    return;
  }

  const settings = getVoiceSettings();
  if (settings.muted && !force) {
    if (onEnd) onEnd();
    return;
  }
  
  if (!text) {
    if (onEnd) onEnd();
    return;
  }

  // Cancel any ongoing speech so they don't queue endlessly
  // removed window.speechSynthesis.cancel() to allow queueing
  // call stopAudio() when explicitly navigating

  const utterance = new SpeechSynthesisUtterance(text);
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
  utterance.lang = langMap[normalizedLang] || 'es-ES';
  utterance.rate = settings.speed || 1.0;

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }
  
  const voices = window.speechSynthesis.getVoices();
  let matchedVoices = voices.filter(v => v.lang.startsWith(utterance.lang.substring(0, 2)));
  
  if (matchedVoices.length > 0) {
    let preferredVoice = matchedVoices.find(v => 
      settings.voiceType === 'male' ? v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('mark') 
      : (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('victoria'))
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    } else {
      utterance.voice = matchedVoices[0]; 
    }
  }

  if (window.speechSynthesis) {
    window.speechSynthesis.resume();
  }
  window.speechSynthesis.speak(utterance);
};

const encouragements = [
  "Amazing!",
  "Fantastic!",
  "Excellent!",
  "Brilliant!",
  "You're improving!",
  "Keep going!",
  "You're doing great!"
];

export const playTeacherStart = (language) => {
  playAudio(`Welcome back! Today we're going to learn ${language} words. Let's begin.`, 'English');
};

export const playTeacherQuestion = (prompt, audioText, language) => {
  if (prompt) {
    playAudio(prompt, 'English', false, () => {
      if (audioText) playAudio(audioText, language);
    });
  } else if (audioText) {
    playAudio(audioText, language);
  }
};

export const playTeacherCorrect = (word, language) => {
  const enc = encouragements[Math.floor(Math.random() * encouragements.length)];
  playAudio(`${enc} The word is ${word}.`, 'English', false, () => {
     playAudio(word, language);
  });
};

export const playTeacherWrong = (word, language) => {
  playAudio(`Good try. The correct answer is ${word}. Repeat after me.`, 'English', false, () => {
      const settings = getVoiceSettings();
      const savedSpeed = settings.speed;
      saveVoiceSettings({...settings, speed: 0.5}); // slow down
      playAudio(word.split('').join('. '), language, false, () => {
         saveVoiceSettings({...settings, speed: savedSpeed});
      });
  });
};

export const playTeacherSpeakPractice = (word, language) => {
  playAudio(`Now say ${word}.`, 'English', false, () => {
    playAudio(word, language);
  });
};
