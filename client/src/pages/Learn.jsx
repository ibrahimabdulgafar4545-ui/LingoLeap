import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLearning } from '../context/LearningContext';
import AppLayout from '../components/common/AppLayout';
import { Lock, Check, BookOpen, ChevronDown, ChevronUp, Trophy, Star, Play, Sparkles, Loader2 } from 'lucide-react';

const langFlags = {
  Spanish: '🇪🇸', French: '🇫🇷', English: '🇬🇧',
  German: '🇩🇪', Arabic: '🇸🇦', Italian: '🇮🇹', Korean: '🇰🇷', Japanese: '🇯🇵'
};

const allLanguages = ['Spanish', 'French', 'English', 'German', 'Arabic', 'Italian', 'Korean', 'Japanese'];

const categoryColors = {
  Vocabulary: { bg: 'bg-secondary border-secondary-hover', text: 'text-secondary', shadow: 'shadow-3d-secondary', icon: 'Aa' },
  Grammar: { bg: 'bg-secondary border-secondary-hover', text: 'text-secondary', shadow: 'shadow-3d-secondary', icon: 'G' },
  Reading: { bg: 'bg-primary border-primary-hover', text: 'text-primary', shadow: 'shadow-3d-primary', icon: 'R' },
  Speaking: { bg: 'bg-primary border-primary-hover', text: 'text-primary', shadow: 'shadow-3d-primary', icon: 'S' },
  Listening: { bg: 'bg-secondary border-secondary-hover', text: 'text-secondary', shadow: 'shadow-3d-secondary', icon: 'L' },
  Translation: { bg: 'bg-primary border-primary-hover', text: 'text-primary', shadow: 'shadow-3d-primary', icon: 'T' },
  Quiz: { bg: 'bg-secondary border-secondary-hover', text: 'text-secondary', shadow: 'shadow-3d-secondary', icon: 'Q' },
};

const getMissionsForLanguage = (lang, landmark) => ({
  1: { title: '👋 Lesson 1 — Greetings', category: 'Speaking', location: 'Greeting Hall' },
  2: { title: '🏠 Lesson 2 — Everyday words', category: 'Vocabulary', location: 'Home & Office' },
  3: { title: '🐶 Lesson 3 — Animals', category: 'Vocabulary', location: 'Pet Store & Farm' },
  4: { title: '🍞 Lesson 4 — Food', category: 'Vocabulary', location: 'Kitchen & Table' },
  5: { title: '👨‍👩‍👧‍👦 Lesson 5 — Family', category: 'Vocabulary', location: 'Family Reunion' },
  6: { title: '🔢 Lesson 6 — Numbers', category: 'Vocabulary', location: 'Market Stalls' },
  7: { title: '🎨 Lesson 7 — Colors', category: 'Vocabulary', location: 'Art Studio' },
  8: { title: '👕 Lesson 8 — Clothing', category: 'Vocabulary', location: 'Shopping Boutique' },
  9: { title: '👃 Lesson 9 — Body parts', category: 'Vocabulary', location: 'Mirror & Studio' },
  10: { title: '☀️ Lesson 10 — Weather', category: 'Vocabulary', location: 'Outdoors' },
  11: { title: '✈️ Mission 11 — Airport Arrival', category: 'Speaking', location: `${landmark} Airport` },
  12: { title: '🚕 Mission 12 — Taxi Ride', category: 'Speaking', location: `${lang} Taxi` },
  13: { title: '🏨 Mission 13 — Hotel Check-in', category: 'Vocabulary', location: 'Hotel Desk' },
  14: { title: '🍲 Mission 14 — Café & Restaurant', category: 'Vocabulary', location: 'Bistro & Cafe' },
  15: { title: '🛍️ Mission 15 — Shopping', category: 'Speaking', location: 'Shopping Mall' },
  16: { title: '🏫 Mission 16 — School & Education', category: 'Vocabulary', location: 'Classroom' },
  17: { title: '🏥 Mission 17 — Hospital & Medical', category: 'Reading', location: 'Medical Center' },
  18: { title: '🚇 Mission 18 — City & Travel', category: 'Vocabulary', location: 'Transit Station' },
  19: { title: '🏆 Mission 19 — Grand Challenge', category: 'Quiz', location: 'City Center' }
});

const storyWorldData = {
  Korean: {
    country: 'South Korea',
    landmark: '🏯 Gyeongbokgung Palace',
    bgGradient: 'from-indigo-600 to-rose-500',
    character: 'Min-Jun',
    role: 'Korean Guide 🇰🇷',
    avatar: '👨‍💼',
    greeting: '안녕하세요! Welcome! I am Min-Jun. Let\'s learn Korean starting with basic greetings and vocabulary!',
    missions: getMissionsForLanguage('Seoul', 'Incheon')
  },
  Japanese: {
    country: 'Japan',
    landmark: '🗻 Mt. Fuji & Tokyo Tower',
    bgGradient: 'from-rose-500 to-orange-400',
    character: 'Yuki',
    role: 'Japanese Sensei 🇯🇵',
    avatar: '👩‍🏫',
    greeting: 'こんにちは! Welcome! I am Yuki, your Japanese Sensei. Let\'s master basic greetings first!',
    missions: getMissionsForLanguage('Tokyo', 'Narita')
  },
  Spanish: {
    country: 'Spain',
    landmark: '⛪ Sagrada Família',
    bgGradient: 'from-amber-500 to-red-500',
    character: 'Sofia',
    role: 'Spanish Guide 🇪🇸',
    avatar: '👩‍⚕️',
    greeting: '¡Hola! Welcome! I am Sofia, your Spanish guide. Let\'s build your vocabulary step-by-step starting with greetings!',
    missions: getMissionsForLanguage('Madrid', 'Barajas')
  },
  French: {
    country: 'France',
    landmark: '🗼 Eiffel Tower',
    bgGradient: 'from-blue-600 to-rose-500',
    character: 'Marie',
    role: 'French Tutor 🇫🇷',
    avatar: '👩',
    greeting: 'Bonjour! Welcome! I am Marie, your French tutor. Let\'s learn French starting with the basics!',
    missions: getMissionsForLanguage('Paris', 'CDG')
  },
  German: {
    country: 'Germany',
    landmark: '🏛️ Brandenburg Gate',
    bgGradient: 'from-slate-700 to-orange-600',
    character: 'Hans',
    role: 'German Coach 🇩🇪',
    avatar: '👨‍🔬',
    greeting: 'Guten Tag! Welcome! I am Hans, your German coach. Let\'s build a solid foundation together!',
    missions: getMissionsForLanguage('Berlin', 'Berlin')
  },
  Arabic: {
    country: 'Arab World',
    landmark: '🕌 Sheikh Zayed Mosque',
    bgGradient: 'from-amber-600 to-orange-500',
    character: 'Ahmed',
    role: 'Arabic Host 🇸🇦',
    avatar: '👨',
    greeting: 'مرحبا! Welcome! I am Ahmed. Let\'s start our Arabic learning with core greetings and words!',
    missions: getMissionsForLanguage('Riyadh', 'Riyadh')
  },
  Italian: {
    country: 'Italy',
    landmark: '🏛️ Colosseum',
    bgGradient: 'from-green-600 to-orange-500',
    character: 'Giovanni',
    role: 'Italian Tutor 🇮🇹',
    avatar: '👨‍🍳',
    greeting: 'Ciao! Welcome! I am Giovanni. Let\'s master Italian greetings and everyday words!',
    missions: getMissionsForLanguage('Rome', 'Fiumicino')
  },
  English: {
    country: 'United Kingdom',
    landmark: '🗼 Big Ben & London Eye',
    bgGradient: 'from-blue-700 to-indigo-500',
    character: 'Emma',
    role: 'English Tutor 🇬🇧',
    avatar: '👩‍💼',
    greeting: 'Hello! Welcome! I am Emma, your English tutor. Let\'s begin with Greetings and Everyday words!',
    missions: getMissionsForLanguage('London', 'Heathrow')
  }
};

const getLessonDetails = (lesson, lang) => {
  const world = storyWorldData[lang] || storyWorldData['English'];
  const orderNumber = lesson.order || 1;
  const mission = world.missions[orderNumber];
  if (mission) {
    return {
      ...lesson,
      title: mission.title,
      category: mission.category,
      location: mission.location
    };
  }
  return lesson;
};

const fallbackUnitTitles = [
  'First Contact & Basics',
  'Everyday Chats & Coffee',
  'Exploring the City Streets',
  'Mastering Deep Conversations'
];

const groupLessonsIntoUnits = (items, lang) => {
  const map = new Map();
  items.forEach((rawLesson, index) => {
    const lesson = getLessonDetails(rawLesson, lang);
    const unitNumber = lesson.unit || Math.floor(index / 4) + 1;
    if (!map.has(unitNumber)) {
      map.set(unitNumber, {
        unitNumber,
        title: lesson.unitTitle || (unitNumber === 1 ? `${lang} Adventure` : `Everyday Life in ${lang}`),
        lessons: []
      });
    }
    map.get(unitNumber).lessons.push({ ...lesson, pathIndex: index });
  });
  return Array.from(map.values());
};

const PathNode = ({ lesson, index, onClick, isLoading }) => {
  const colors = categoryColors[lesson.category] || categoryColors.Vocabulary;
  const isCurrent = !lesson.isCompleted && !lesson.isLocked;

  // Calculate the horizontal offset using a sine wave pattern for the classic Duolingo snake path
  // Adjust based on the index in the unit path to make it wave gracefully back and forth
  const waveOffsets = ['translate-x-0', 'translate-x-4 md:translate-x-12', 'translate-x-8 md:translate-x-20', 'translate-x-4 md:translate-x-12', 'translate-x-0', '-translate-x-4 md:-translate-x-12', '-translate-x-8 md:-translate-x-20', '-translate-x-4 md:-translate-x-12'];
  const offsetClass = waveOffsets[index % waveOffsets.length];

  return (
    <div className={`flex flex-col items-center my-4 transition-transform duration-300 ${offsetClass}`}>
      {index > 0 && (
        <div className="relative w-2 h-10 flex justify-center -mt-4 mb-2">
          {/* Connecting line */}
          <div className={`w-1.5 h-full rounded-full ${lesson.isLocked ? 'bg-border dark:bg-border/20' : 'bg-primary/40'}`} />
        </div>
      )}

      <div className="relative group">
        {/* Pulsing glow ring around the active lesson node */}
        {isCurrent && (
          <div className="absolute -inset-2 bg-primary/20 rounded-full animate-ping opacity-75" />
        )}
        
        {/* Active lesson tooltip box */}
        {isCurrent && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-primary text-white text-[11px] font-extrabold px-3 py-1.5 rounded-xl shadow-md whitespace-nowrap z-10 animate-bounce">
            <span className="flex items-center gap-1"><Play size={10} fill="currentColor" /> START LESSON</span>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rotate-45" />
          </div>
        )}

        <button
          onClick={() => !lesson.isLocked && onClick(lesson)}
          disabled={lesson.isLocked || isLoading}
          className={`relative w-20 h-20 rounded-full flex items-center justify-center font-extrabold text-white transition-all duration-300 border-b-8 cursor-pointer
            ${lesson.isCompleted
              ? 'bg-primary border-primary-hover shadow-3d-primary hover:-translate-y-1 hover:brightness-105 active:translate-y-0'
              : lesson.isLocked
                ? 'bg-border/30 border-border/40 cursor-not-allowed opacity-70'
                : `${colors.bg} ${colors.shadow} hover:-translate-y-1 hover:brightness-105 active:translate-y-0`
            }`}
        >
          {isLoading ? (
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          ) : lesson.isCompleted ? (
            <Check size={36} className="text-white stroke-[4.5]" />
          ) : lesson.isLocked ? (
            <Lock size={26} className="text-text-secondary/40" />
          ) : (
            <span className="text-2xl drop-shadow-md">{colors.icon}</span>
          )}
        </button>
      </div>

      <div className="text-center mt-3 max-w-[150px]">
        <p className={`text-sm font-extrabold leading-snug ${lesson.isLocked ? 'text-text-secondary/40' : 'text-text-main'}`}>
          {lesson.title}
        </p>
        <p className={`text-[10px] font-bold mt-1 uppercase tracking-wider ${colors.text} ${lesson.isLocked ? 'opacity-40' : ''}`}>
          {lesson.category} · +{lesson.xpReward || 15} XP
        </p>
      </div>
    </div>
  );
};

const Learn = () => {
  const { user } = useAuth();
  const { lessons, fetchLessons, loading } = useLearning();
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState(user?.targetLanguage || 'Spanish');
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [loadingLessonId, setLoadingLessonId] = useState(null);

  // Keep selectedLanguage in sync when user changes language in Settings
  useEffect(() => {
    if (user?.targetLanguage && user.targetLanguage !== selectedLanguage) {
      setSelectedLanguage(user.targetLanguage);
    }
  }, [user?.targetLanguage]);

  useEffect(() => {
    fetchLessons(selectedLanguage);
  }, [selectedLanguage]);

  const mappedLessons = lessons.map(l => getLessonDetails(l, selectedLanguage));
  const completedCount = mappedLessons.filter(l => l.isCompleted).length;
  const totalLessons = mappedLessons.length;
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const units = groupLessonsIntoUnits(mappedLessons, selectedLanguage);

  return (
    <AppLayout>
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-1">Learning Path</h1>
          <p className="text-text-secondary font-semibold text-sm">Follow the snake path to absolute language fluency!</p>
        </div>

        {/* Dynamic language selection dropdown */}
        <div className="relative self-start md:self-auto">
          <button
            onClick={() => setShowLangPicker(!showLangPicker)}
            className="flex items-center gap-3 bg-white dark:bg-bg-card border-2 border-border dark:border-border rounded-2xl px-4 py-3 font-extrabold text-sm text-text-main btn-3d shadow-3d-card cursor-pointer"
          >
            <span className="text-lg leading-none">{langFlags[selectedLanguage]}</span>
            {selectedLanguage}
            {showLangPicker ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showLangPicker && (
            <div className="absolute top-full mt-2 right-0 bg-white dark:bg-bg-card border-2 border-border dark:border-border rounded-2xl shadow-lg z-30 p-2 min-w-[180px]">
              {allLanguages.map(lang => (
                <button
                  key={lang}
                  onClick={() => { setSelectedLanguage(lang); setShowLangPicker(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-extrabold transition hover:bg-bg-main/50 cursor-pointer ${selectedLanguage === lang ? 'text-primary' : 'text-text-secondary'}`}
                >
                  <span className="text-lg leading-none">{langFlags[lang]}</span> {lang}
                  {selectedLanguage === lang && <Check size={14} className="ml-auto text-primary stroke-[3]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Path overall progress header */}
      <div className="bg-white dark:bg-bg-card border-2 border-border dark:border-border rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 shadow-3d-card mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
          <Trophy size={26} />
        </div>
        <div className="flex-1 w-full">
          <div className="flex justify-between items-end mb-2 gap-2">
            <span className="text-[10px] sm:text-xs font-extrabold text-text-secondary uppercase tracking-wide truncate">Overall Path Mastery</span>
            <span className="text-xs sm:text-sm font-extrabold text-primary shrink-0">{completedCount} / {totalLessons} Lessons Finished</span>
          </div>
          <div className="w-full bg-border dark:bg-border/20 rounded-full h-3 sm:h-4 overflow-hidden border-2 border-border dark:border-border">
            <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
        <div className="flex flex-row sm:flex-col items-center justify-center bg-primary text-white font-extrabold px-4 py-2.5 rounded-2xl shadow-sm gap-1 flex-shrink-0">
          <Sparkles size={16} />
          <span className="text-xs sm:text-sm">{progressPct}% Done</span>
        </div>
      </div>

      {!loading && mappedLessons.length > 0 && (
        <div className={`relative bg-gradient-to-r ${storyWorldData[selectedLanguage]?.bgGradient || 'from-primary to-secondary'} border-2 border-white/10 rounded-3xl p-5 sm:p-6 text-white shadow-lg overflow-hidden mb-8`}>
          {/* Decorative background landmark emoji */}
          <div className="absolute right-4 -bottom-6 text-8xl opacity-15 select-none pointer-events-none">
            {storyWorldData[selectedLanguage]?.avatar}
          </div>
          <div className="relative flex flex-col sm:flex-row items-center gap-4 z-10">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-4xl shadow-md border border-white/10 flex-shrink-0 animate-bounce">
              {storyWorldData[selectedLanguage]?.avatar}
            </div>
            <div className="text-center sm:text-left flex-1">
              <div className="flex flex-col sm:flex-row items-center gap-2 mb-1">
                <h3 className="text-lg font-black">{storyWorldData[selectedLanguage]?.character}</h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-black/25 px-2 py-0.5 rounded-md">
                  {storyWorldData[selectedLanguage]?.role}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-semibold italic">
                "{storyWorldData[selectedLanguage]?.greeting}"
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="text-[10px] font-bold bg-white/25 px-2.5 py-1 rounded-full flex items-center gap-1">
                  📍 Current Place: <span className="underline font-black">{completedCount < totalLessons ? (mappedLessons[completedCount]?.location || 'Airport') : 'Completed'}</span>
                </span>
                <span className="text-[10px] font-bold bg-white/25 px-2.5 py-1 rounded-full">
                  🌍 Landmark: {storyWorldData[selectedLanguage]?.landmark}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : lessons.length === 0 ? (
        <div className="bg-white dark:bg-bg-card border-2 border-border dark:border-border p-12 text-center shadow-3d-card max-w-lg mx-auto">
          <BookOpen size={48} className="text-text-secondary mx-auto mb-4" />
          <h3 className="text-xl font-extrabold text-text-main">No Path Available</h3>
          <p className="text-sm font-semibold text-text-secondary mt-2">
            We couldn't find any lessons designed for {selectedLanguage} yet. Switch languages using the picker above or check with the administrator.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center py-4 gap-12 select-none">
          {units.map((unit) => {
            const unitCompleted = unit.lessons.filter(l => l.isCompleted).length;
            const unitPct = Math.round((unitCompleted / unit.lessons.length) * 100);
            const unitLocked = unit.lessons.every(l => l.isLocked);

            return (
              <section key={unit.unitNumber} className="w-full max-w-xl flex flex-col items-center">
                {/* Header for the Unit */}
                <div className={`w-full rounded-3xl border-2 p-4 sm:p-5 mb-6 shadow-3d-card text-white overflow-hidden relative
                  ${unitLocked 
                    ? 'bg-slate-400 dark:bg-slate-700 border-slate-350 dark:border-slate-600 text-slate-200' 
                    : `bg-gradient-to-br ${storyWorldData[selectedLanguage]?.bgGradient || 'from-primary to-secondary'} border-white/10 shadow-3d-primary`}`}>
                  
                  {/* Decorative background circle */}
                  <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-white/10 rounded-full" />
                  
                  <div className="flex items-center justify-between gap-3 relative z-10">
                    <div>
                      <p className={`text-[10px] sm:text-xs font-extrabold uppercase tracking-widest ${unitLocked ? 'text-white/60' : 'text-green-100'}`}>
                        Unit {unit.unitNumber}
                      </p>
                      <h2 className="text-lg sm:text-xl font-extrabold leading-tight mt-1">{unit.title}</h2>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className="text-[10px] sm:text-xs font-extrabold bg-black/25 px-2.5 py-1 rounded-lg">
                        {unitCompleted}/{unit.lessons.length} LESSONS
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 relative z-10">
                    <div className="h-2.5 rounded-full bg-black/20 overflow-hidden">
                      <div className="h-full bg-white dark:bg-bg-card rounded-full transition-all duration-700" style={{ width: `${unitPct}%` }} />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center w-full px-4">
                  {unit.lessons.map((lesson, idx) => (
                    <PathNode 
                      key={lesson._id} 
                      lesson={lesson} 
                      index={idx} 
                      isLoading={loadingLessonId === lesson._id}
                      onClick={(l) => {
                        setLoadingLessonId(l._id);
                        navigate(`/lesson/${l._id}`);
                      }} 
                    />
                  ))}
                </div>
              </section>
            );
          })}

          {/* Final course completion Trophy */}
          <div className="flex flex-col items-center mt-6">
            <div className="relative group">
              <div className="absolute -inset-2 bg-primary/15 rounded-full blur-lg animate-pulse" />
              <div className="relative w-24 h-24 rounded-full bg-primary/10 border-4 border-primary/30 flex items-center justify-center shadow-md">
                <Trophy size={48} className="text-primary drop-shadow-md animate-bounce" />
              </div>
            </div>
            <p className="text-sm font-extrabold text-text-secondary mt-3 uppercase tracking-widest">Course Mastered</p>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Learn;
