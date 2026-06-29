import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '../components/common/AppLayout';
import { useAuth } from '../context/AuthContext';
import { Mic, Square, Play, RotateCcw, Activity, Award, BarChart2, Star, CheckCircle, Volume2, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';
import api from '../services/api';

const languagePhrases = {
  Spanish: [
    "Hola, ¿cómo estás?",
    "Me gustaría pedir un café por favor.",
    "¿Dónde está la biblioteca?",
    "La cuenta, por favor.",
    "Mucho gusto en conocerte."
  ],
  French: [
    "Bonjour, comment allez-vous ?",
    "Je voudrais commander un café s'il vous plaît.",
    "Où se trouve la bibliothèque, s'il vous plaît ?",
    "L'addition, s'il vous plaît.",
    "Ravi de vous rencontrer."
  ],
  German: [
    "Hallo, wie geht es dir?",
    "Ich möchte bitte einen Kaffee bestellen.",
    "Wo ist die Bibliothek?",
    "Die Rechnung, bitte.",
    "Es freut mich, Sie kennenzulernen."
  ],
  Italian: [
    "Ciao, come stai?",
    "Vorrei ordinare un caffè per favore.",
    "Dov'è la biblioteca?",
    "Il conto, per favore.",
    "Piacere di conoscerti."
  ],
  Arabic: [
    "مرحباً، كيف حالك؟",
    "أود طلب فنجان من القهوة من فضلك.",
    "أين تقع المكتبة؟",
    "الفاتورة من فضلك.",
    "سعدت بلقائك."
  ],
  English: [
    "Hello, how are you today?",
    "I would like to order a cup of coffee, please.",
    "Excuse me, where is the nearest library?",
    "Could I have the bill, please?",
    "It is a pleasure to meet you."
  ]
};

const PronunciationPractice = () => {
  const { user } = useAuth();
  
  const targetLanguage = user?.targetLanguage || 'Spanish';
  const phrases = languagePhrases[targetLanguage] || languagePhrases['Spanish'];
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [base64Audio, setBase64Audio] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  
  // Real-time audio analyser states & refs
  const [audioLevels, setAudioLevels] = useState([15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15]);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const chunksRef = useRef([]);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  // Sync state when target language changes
  useEffect(() => {
    setCurrentIndex(0);
    setAudioUrl(null);
    setBase64Audio(null);
    setEvaluation(null);
  }, [targetLanguage]);

  // Clean up recording context on unmount
  useEffect(() => {
    return () => {
      cleanupAudioContext();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const cleanupAudioContext = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {
        console.error('Error closing AudioContext:', e);
      }
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get('/ai/pronunciation/history');
      if (res.data.success) {
        setHistory(res.data.history);
      }
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  };

  const currentPhrase = phrases[currentIndex] || phrases[0] || "";

  const startRecording = async () => {
    try {
      cleanupAudioContext();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Convert to base64
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          setBase64Audio(reader.result);
        };
      };
      
      // Set up Audio Context and Analyser for real-time visualization
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        try {
          const audioCtx = new AudioCtxClass();
          const analyser = audioCtx.createAnalyser();
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);
          analyser.fftSize = 64; // nice number of bins
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          audioContextRef.current = audioCtx;
          analyserRef.current = analyser;

          const updateLevels = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            
            // Map frequencies to 15 amplitude bars between 15% and 100% height
            const levels = [];
            const step = Math.max(1, Math.floor(bufferLength / 15));
            for (let i = 0; i < 15; i++) {
              const val = dataArray[i * step] || 0;
              const pct = Math.max(15, Math.min(100, Math.round((val / 255) * 100)));
              levels.push(pct);
            }
            setAudioLevels(levels);
            animationFrameRef.current = requestAnimationFrame(updateLevels);
          };

          animationFrameRef.current = requestAnimationFrame(updateLevels);
        } catch (audioErr) {
          console.error('Failed to initialize Web Audio Analyser:', audioErr);
        }
      }

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setAudioUrl(null);
      setBase64Audio(null);
      setEvaluation(null);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      toast.success('🎙️ Speak now...');
    } catch (err) {
      console.error('Error accessing microphone', err);
      toast.error('Microphone access denied or unavailable.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      
      cleanupAudioContext();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setAudioLevels([15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15]);
    }
  };

  const submitAudio = async () => {
    if (!base64Audio) return;
    setLoading(true);
    try {
      const res = await api.post('/ai/pronunciation/evaluate', {
        phrase: currentPhrase,
        audioUrl: base64Audio
      });
      
      if (res.data.success) {
        setEvaluation(res.data.evaluation);
        toast.success('Pronunciation evaluated!');
        fetchHistory(); // refresh history
      } else {
        toast.error(res.data.message || 'Failed to evaluate');
      }
    } catch (err) {
      toast.error('Evaluation error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextPhrase = () => {
    setCurrentIndex((prev) => (prev + 1) % phrases.length);
    setAudioUrl(null);
    setBase64Audio(null);
    setEvaluation(null);
  };

  const playPhrase = () => {
    if ('speechSynthesis' in window && currentPhrase) {
      const utterance = new SpeechSynthesisUtterance(currentPhrase);
      // Try to match language code
      const voices = window.speechSynthesis.getVoices();
      let langCode = 'es-ES';
      if (targetLanguage === 'French') langCode = 'fr-FR';
      else if (targetLanguage === 'German') langCode = 'de-DE';
      else if (targetLanguage === 'Italian') langCode = 'it-IT';
      else if (targetLanguage === 'English') langCode = 'en-US';
      else if (targetLanguage === 'Arabic') langCode = 'ar-SA';

      utterance.lang = langCode;
      
      // Match a matching language voice if possible
      const matchingVoice = voices.find(v => v.lang.startsWith(langCode));
      if (matchingVoice) utterance.voice = matchingVoice;

      window.speechSynthesis.speak(utterance);
    } else {
      toast.error("Text-to-speech is not supported on this browser.");
    }
  };

  // Highlights mispronounced words in red, correct ones in green
  const renderHighlightedPhrase = () => {
    if (!evaluation) {
      return (
        <div className="flex items-center gap-3 mb-8">
          <p className="text-3xl font-extrabold text-brand-blue">"{currentPhrase}"</p>
          <button 
            onClick={playPhrase} 
            className="p-2 bg-brand-blue/10 hover:bg-brand-blue/20 rounded-full text-brand-blue transition-all"
            title="Listen to pronunciation"
          >
            <Volume2 size={20} />
          </button>
        </div>
      );
    }

    const cleanWord = (w) => w.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?¿¡]/g, "").trim();
    const mispronouncedClean = (evaluation.mispronouncedWords || []).map(w => cleanWord(w));
    const tokens = currentPhrase.split(/(\s+)/);

    return (
      <div className="flex flex-col items-center gap-2 mb-8">
        <div className="flex items-center gap-3">
          <div className="text-2xl md:text-3xl font-extrabold flex flex-wrap justify-center items-center">
            <span className="text-brand-dark/30 mr-1">"</span>
            {tokens.map((token, idx) => {
              if (token.trim() === '') {
                return <span key={idx} className="whitespace-pre">{token}</span>;
              }
              const cleaned = cleanWord(token);
              const isMispronounced = mispronouncedClean.includes(cleaned);
              return (
                <span
                  key={idx}
                  className={`transition-colors duration-300 ${
                    isMispronounced
                      ? "text-brand-red underline decoration-wavy decoration-2 underline-offset-4"
                      : "text-brand-green"
                  }`}
                  title={isMispronounced ? "Struggled with this word" : "Correct"}
                >
                  {token}
                </span>
              );
            })}
            <span className="text-brand-dark/30 ml-1">"</span>
          </div>
          <button 
            onClick={playPhrase} 
            className="p-2 bg-brand-blue/10 hover:bg-brand-blue/20 rounded-full text-brand-blue transition-all"
            title="Listen to pronunciation"
          >
            <Volume2 size={20} />
          </button>
        </div>
      </div>
    );
  };

  // Compute Trends Metrics
  const avgScore = history.length > 0 ? Math.round(history.reduce((acc, h) => acc + h.score, 0) / history.length) : 0;
  const avgFluency = history.length > 0 ? Math.round(history.reduce((acc, h) => acc + (h.fluencyScore || h.score), 0) / history.length) : 0;
  const avgAccuracy = history.length > 0 ? Math.round(history.reduce((acc, h) => acc + (h.accuracyScore || h.score), 0) / history.length) : 0;
  
  // Trend indicator based on average of last 3 vs total
  const recentAvg = history.slice(0, 3).reduce((acc, h) => acc + h.score, 0) / Math.min(history.length || 1, 3);
  const diff = recentAvg - avgScore;
  let trendText = "Stable";
  let trendColor = "text-brand-dark/60";
  if (history.length >= 2) {
    if (diff > 2) {
      trendText = `Improving (+${Math.round(diff)}%)`;
      trendColor = "text-brand-green";
    } else if (diff < -2) {
      trendText = `Declining (${Math.round(diff)}%)`;
      trendColor = "text-brand-red";
    }
  }

  // Draw trend line chart
  const renderTrendChart = () => {
    if (history.length < 2) return null;
    
    // Sort chronological order for last 10 records
    const chartData = [...history].reverse().slice(-10);
    const width = 300;
    const height = 90;
    const padding = 15;

    const points = chartData.map((item, index) => {
      const x = padding + (index * (width - 2 * padding)) / (chartData.length - 1);
      const y = height - padding - (item.score * (height - 2 * padding)) / 100;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="bg-brand-light/40 p-4 rounded-2xl border border-border dark:border-border mb-5 relative overflow-hidden">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-black text-brand-dark/50 uppercase tracking-widest flex items-center gap-1">
            <TrendingUp size={12} className="text-brand-blue" /> Score Trend (Last 10)
          </span>
          <span className={`text-[10px] font-black uppercase ${trendColor}`}>{trendText}</span>
        </div>
        <div className="flex justify-center items-center">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-20 overflow-visible">
            {/* Grid baseline lines */}
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3,3" />
            <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3,3" />
            
            {/* Smooth connecting line */}
            <polyline
              fill="none"
              stroke="#2D98DA"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
            
            {/* Circle markers */}
            {chartData.map((item, idx) => {
              const x = padding + (idx * (width - 2 * padding)) / (chartData.length - 1);
              const y = height - padding - (item.score * (height - 2 * padding)) / 100;
              return (
                <g key={idx} className="group">
                  <circle
                    cx={x}
                    cy={y}
                    r="3.5"
                    fill="#FFF"
                    stroke="#2D98DA"
                    strokeWidth="2"
                    className="hover:r-5 hover:fill-brand-blue transition-all cursor-pointer"
                  />
                  <title>{`Score: ${item.score}%`}</title>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <AppLayout>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-main mb-1">Pronunciation Lab 🎤</h1>
          <p className="text-brand-dark/50 font-semibold text-sm">Perfect your accent and speak like a native. Practicing: <span className="text-brand-blue">{targetLanguage}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Active Practice Area */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white dark:bg-bg-card rounded-3xl p-8 border-2 border-border dark:border-border shadow-3d-card flex flex-col items-center text-center">
            <h2 className="text-xs font-bold text-brand-dark/50 uppercase tracking-widest mb-4">Speak this phrase</h2>
            {renderHighlightedPhrase()}

            <div className="flex flex-col items-center gap-4 w-full">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  disabled={loading}
                  className="w-20 h-20 bg-brand-red rounded-full flex items-center justify-center text-white shadow-3d-red hover:-translate-y-1 hover:brightness-105 transition-all disabled:opacity-50"
                  title="Start Recording"
                >
                  <Mic size={32} />
                </button>
              ) : (
                <div className="flex flex-col items-center gap-4 w-full">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <span className="text-brand-red text-xs font-bold animate-pulse">Recording ({formatTimer(recordingTime)})...</span>
                  </div>

                  {/* Real-time reactive Web Audio visualizer */}
                  <div className="flex items-end justify-center gap-1.5 h-16 w-60 mb-2 p-2 rounded-2xl bg-brand-red/5 border border-brand-red/10">
                    {audioLevels.map((level, i) => (
                      <span
                        key={i}
                        className="w-1.5 bg-brand-red rounded-full transition-all duration-75"
                        style={{ height: `${level}%` }}
                      />
                    ))}
                  </div>

                  <button
                    onClick={stopRecording}
                    className="w-16 h-16 bg-brand-dark rounded-2xl flex items-center justify-center text-white shadow-md hover:-translate-y-1 transition-transform"
                    title="Stop Recording"
                  >
                    <Square size={24} />
                  </button>
                </div>
              )}

              {audioUrl && !isRecording && (
                <div className="flex items-center gap-4 bg-brand-light p-3.5 rounded-2xl border-2 border-border dark:border-border w-full max-w-sm mt-4">
                  <button
                    onClick={() => {
                      const audio = new Audio(audioUrl);
                      audio.play();
                    }}
                    className="w-10 h-10 bg-white dark:bg-bg-card rounded-full flex items-center justify-center text-brand-blue shadow-sm border border-border dark:border-border hover:scale-105 active:scale-95 transition-all"
                  >
                    <Play size={18} className="translate-x-0.5" />
                  </button>
                  <div className="flex-1 flex items-center gap-1.5 justify-center">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div key={i} className="w-1 bg-brand-blue/30 rounded-full h-4" />
                    ))}
                  </div>
                </div>
              )}

              {audioUrl && !evaluation && !isRecording && (
                <Button
                  variant="custom"
                  onClick={submitAudio}
                  disabled={loading}
                  className="mt-6 bg-brand-green text-white font-black py-3.5 px-10 rounded-2xl btn-3d shadow-3d-green text-sm tracking-wide cursor-pointer"
                >
                  Evaluate Pronunciation
                </Button>
              )}
            </div>
          </div>

          {evaluation && (
            <div className="bg-white dark:bg-bg-card rounded-3xl p-6 border-2 border-brand-green/30 shadow-3d-card relative overflow-hidden">
              <div className="absolute -top-10 -right-10 opacity-[0.03]">
                <CheckCircle size={200} className="text-brand-green" />
              </div>
              <h3 className="font-extrabold text-xl text-text-main mb-4 flex items-center gap-2">
                <Award className="text-brand-yellow" /> Evaluation Feedback
              </h3>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-brand-light p-4 rounded-2xl flex flex-col items-center justify-center border border-border dark:border-border shadow-sm">
                  <span className="text-[10px] font-black text-brand-dark/50 uppercase tracking-wide">Pronunciation</span>
                  <span className="text-3xl font-extrabold text-brand-green mt-1">{evaluation.score}</span>
                </div>
                <div className="bg-brand-light p-4 rounded-2xl flex flex-col items-center justify-center border border-border dark:border-border shadow-sm">
                  <span className="text-[10px] font-black text-brand-dark/50 uppercase tracking-wide">Fluency</span>
                  <span className="text-3xl font-extrabold text-brand-blue mt-1">{evaluation.fluencyScore}</span>
                </div>
                <div className="bg-brand-light p-4 rounded-2xl flex flex-col items-center justify-center border border-border dark:border-border shadow-sm">
                  <span className="text-[10px] font-black text-brand-dark/50 uppercase tracking-wide">Accuracy</span>
                  <span className="text-3xl font-extrabold text-brand-purple mt-1">{evaluation.accuracyScore}</span>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-bold text-sm text-text-main mb-1.5">You said:</h4>
                <p className="p-3 bg-brand-light/60 rounded-xl italic text-brand-dark/80 font-semibold border border-border dark:border-border">"{evaluation.transcript}"</p>
              </div>

              {evaluation.mispronouncedWords && evaluation.mispronouncedWords.length > 0 ? (
                <div className="mb-4">
                  <h4 className="font-bold text-sm text-brand-red mb-2">Words to focus on:</h4>
                  <div className="flex gap-2 flex-wrap">
                    {evaluation.mispronouncedWords.map((word, i) => (
                      <span key={i} className="px-3 py-1 bg-brand-red/10 text-brand-red font-bold rounded-lg text-xs border border-brand-red/20">{word}</span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mb-4 flex items-center gap-2 text-brand-green font-bold text-sm p-3 bg-brand-green/10 rounded-xl border border-brand-green/20">
                  <CheckCircle size={18} /> Perfect pronunciation! Outstanding work.
                </div>
              )}

              {evaluation.tips && evaluation.tips.length > 0 && (
                <div>
                  <h4 className="font-bold text-sm text-brand-blue mb-2">AI Accent Tips:</h4>
                  <ul className="space-y-1.5">
                    {evaluation.tips.map((tip, i) => (
                      <li key={i} className="flex gap-2 text-xs font-semibold text-brand-dark/70 leading-relaxed">
                        <Star size={14} className="text-brand-yellow shrink-0 mt-0.5 fill-brand-yellow" /> {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button
                variant="custom"
                onClick={nextPhrase}
                className="mt-6 w-full bg-brand-blue text-white font-extrabold py-3.5 rounded-2xl btn-3d shadow-3d-blue flex items-center justify-center gap-2 text-sm uppercase tracking-wider cursor-pointer"
              >
                Next Phrase <RotateCcw size={18} />
              </Button>
            </div>
          )}
        </div>

        {/* Right Side: Progress Trends & Sidebar */}
        <div className="bg-white dark:bg-bg-card rounded-3xl p-6 border-2 border-border dark:border-border shadow-3d-card h-fit max-h-[85vh] flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="text-brand-orange" />
            <h3 className="font-extrabold text-lg text-text-main">Your Trends & Progress</h3>
          </div>
          
          {history.length === 0 ? (
            <div className="text-center py-12 text-brand-dark/40 flex-1 flex flex-col justify-center items-center">
              <BarChart2 size={44} className="mb-3 opacity-30 animate-pulse" />
              <p className="font-bold text-sm">No attempts logged yet.</p>
              <p className="text-xs max-w-[200px] mx-auto mt-1 leading-relaxed">Begin practicing to track score averages, fluency improvements, and historical accent trends.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Aggregated Trends Panel */}
              <div className="grid grid-cols-3 gap-2.5 mb-4 shrink-0">
                <div className="bg-brand-light p-2.5 rounded-2xl border border-border dark:border-border text-center shadow-sm">
                  <div className="text-[9px] font-black text-brand-dark/50 uppercase">Avg Score</div>
                  <div className="text-base font-black text-brand-blue mt-0.5">{avgScore}%</div>
                </div>
                <div className="bg-brand-light p-2.5 rounded-2xl border border-border dark:border-border text-center shadow-sm">
                  <div className="text-[9px] font-black text-brand-dark/50 uppercase">Accuracy</div>
                  <div className="text-base font-black text-brand-purple mt-0.5">{avgAccuracy}%</div>
                </div>
                <div className="bg-brand-light p-2.5 rounded-2xl border border-border dark:border-border text-center shadow-sm">
                  <div className="text-[9px] font-black text-brand-dark/50 uppercase">Fluency</div>
                  <div className="text-base font-black text-brand-green mt-0.5">{avgFluency}%</div>
                </div>
              </div>

              {/* Score Line Graph */}
              {renderTrendChart()}

              {/* Chronological attempts history */}
              <span className="text-[10px] font-black text-brand-dark/40 uppercase tracking-widest mb-2 block shrink-0">Session History</span>
              <div className="space-y-3 overflow-y-auto pr-1 flex-1 max-h-[30vh]">
                {history.map((item, idx) => (
                  <div key={item._id || idx} className="p-3 bg-brand-light rounded-2xl border border-border dark:border-border flex flex-col gap-1.5 shadow-sm hover:border-brand-blue/30 transition-colors">
                    <div className="flex justify-between items-start gap-2">
                      <p className="font-extrabold text-xs text-text-main line-clamp-2">"{item.phrase}"</p>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black shrink-0 ${
                        item.score >= 80 
                          ? 'bg-brand-green/10 text-brand-green border border-brand-green/20' 
                          : item.score >= 50 
                            ? 'bg-brand-yellow/10 text-brand-yellow border border-brand-yellow/20' 
                            : 'bg-brand-red/10 text-brand-red border border-brand-red/20'
                      }`}>
                        {item.score}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-brand-dark/50 font-bold border-t border-border dark:border-border pt-1.5">
                      <span>Fluency: {item.fluencyScore || item.score}%</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default PronunciationPractice;
