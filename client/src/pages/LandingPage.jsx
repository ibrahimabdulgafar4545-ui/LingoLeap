import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Globe, Zap, Award, Flame, Trophy, Bot, 
  ChevronDown, CheckCircle2, Star, Users, 
  MessageSquare, TrendingUp, Sparkles, 
  Headphones, ChevronRight, Play, X
} from 'lucide-react';
import LingoLeapLogo from '../components/common/LingoLeapLogo';

const ContactForm = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !message.trim()) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center py-6">
        <CheckCircle2 className="w-12 h-12 text-brand-green mx-auto mb-3" />
        <h4 className="text-lg font-bold text-text-main mb-1">Message Sent!</h4>
        <p className="text-xs text-brand-dark/50 font-semibold">Thank you for reaching out. We will get back to you shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div>
        <label className="text-xs font-bold text-brand-dark/50 mb-1.5 block">YOUR EMAIL</label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          className="w-full px-4 py-2.5 bg-brand-light border-2 border-border dark:border-border rounded-xl outline-none font-semibold text-xs focus:border-brand-blue"
        />
      </div>
      <div>
        <label className="text-xs font-bold text-brand-dark/50 mb-1.5 block">MESSAGE</label>
        <textarea
          required
          rows="3"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How can we help you?"
          className="w-full px-4 py-2.5 bg-brand-light border-2 border-border dark:border-border rounded-xl outline-none font-semibold text-xs focus:border-brand-blue resize-none"
        ></textarea>
      </div>
      <button
        type="submit"
        className="w-full py-3 bg-brand-blue text-white font-bold rounded-xl text-xs shadow-3d-blue active:translate-y-0.5 hover:bg-brand-blue/90 transition"
      >
        Send Support Ticket
      </button>
    </form>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [modalContent, setModalContent] = useState(null);

  const handleOpenInfoModal = (type) => {
    switch (type) {
      case 'mission':
        setModalContent({
          title: 'Our Mission',
          icon: <Sparkles className="w-6 h-6 text-brand-yellow" />,
          body: (
            <p className="text-sm text-brand-dark/75 leading-relaxed font-semibold">
              Our mission is to bring premium, AI-powered, fun language learning to everyone on earth, completely free of charge. We believe language learning is the ultimate tool for cross-cultural empathy, connection, and cognitive growth.
            </p>
          )
        });
        break;
      case 'approach':
        setModalContent({
          title: 'Our Approach',
          icon: <Zap className="w-6 h-6 text-brand-blue" />,
          body: (
            <p className="text-sm text-brand-dark/75 leading-relaxed font-semibold">
              We combine high-retention spaced repetition lessons with real-time immersive AI Tutor conversation roleplays. This bridges the gap between passive vocabulary memorization and actual spoken confidence in real-world scenarios.
            </p>
          )
        });
        break;
      case 'status':
        setModalContent({
          title: 'System Status',
          icon: <CheckCircle2 className="w-6 h-6 text-brand-green" />,
          body: (
            <div className="space-y-4 font-semibold text-brand-dark/75">
              <p>LingoLeap Systems: All Systems Operational.</p>
              <ul className="list-disc pl-5 space-y-2 text-xs text-brand-dark/60 font-bold">
                <li>API Endpoint Gateways: <span className="text-brand-green font-black">Online (100%)</span></li>
                <li>Socket Signaling Server: <span className="text-brand-green font-black">Connected (live)</span></li>
                <li>Dual Database Synchronization: <span className="text-brand-green font-black">Synced</span></li>
              </ul>
            </div>
          )
        });
        break;
      case 'contact':
        setModalContent({
          title: 'Contact Support',
          icon: <MessageSquare className="w-6 h-6 text-brand-purple" />,
          body: (
            <ContactForm />
          )
        });
        break;
      case 'guidelines':
        setModalContent({
          title: 'Community Guidelines',
          icon: <Users className="w-6 h-6 text-brand-orange" />,
          body: (
            <ul className="list-decimal pl-5 space-y-3 font-semibold text-brand-dark/75">
              <li>Be respectful and supportive of fellow language learners.</li>
              <li>No spam, harassment, or offensive language in public feeds or friends chats.</li>
              <li>Keep learning goals active, celebrate each other's streak updates, and climb the leaderboard honestly!</li>
            </ul>
          )
        });
        break;
      case 'terms':
        setModalContent({
          title: 'Terms of Service',
          icon: <Globe className="w-6 h-6 text-brand-blue" />,
          body: (
            <p className="text-sm text-brand-dark/75 leading-relaxed font-semibold">
              By using LingoLeap, you agree to follow our community rules, treat other learners with respect, and allow our non-invasive, secure session cookies to keep you logged in to your learning dashboard. We hold our users to the highest standard of cognitive advancement.
            </p>
          )
        });
        break;
      case 'privacy':
        setModalContent({
          title: 'Privacy Policy',
          icon: <Globe className="w-6 h-6 text-brand-green" />,
          body: (
            <p className="text-sm text-brand-dark/75 leading-relaxed font-semibold">
              Your data privacy is our priority. We do not sell your personal data. Avatars and target languages are stored securely on MongoDB or your local fallback database configuration. Your learning progress is solely yours.
            </p>
          )
        });
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const languages = [
    { name: "Spanish", flag: "🇪🇸", color: "border-brand-orange text-brand-orange bg-brand-orange/10" },
    { name: "French", flag: "🇫🇷", color: "border-brand-blue text-brand-blue bg-brand-blue/10" },
    { name: "German", flag: "🇩🇪", color: "border-brand-yellow text-brand-yellow bg-brand-yellow/10" },
    { name: "Italian", flag: "🇮🇹", color: "border-brand-green text-brand-green bg-brand-green/10" },
    { name: "Arabic", flag: "🇸🇦", color: "border-brand-purple text-brand-purple bg-brand-purple/10" },
    { name: "English", flag: "🇬🇧", color: "border-brand-red text-brand-red bg-brand-red/10" },
  ];

  const features = [
    {
      icon: <Zap className="w-8 h-8 text-brand-yellow" />,
      title: "Bite-sized Lessons",
      desc: "Learn in just 5 minutes a day with scientifically proven micro-learning methods.",
      color: "bg-brand-yellow/20"
    },
    {
      icon: <Bot className="w-8 h-8 text-brand-purple" />,
      title: "AI Conversation Tutor",
      desc: "Practice speaking in real-time with an intelligent AI that adapts to your level.",
      color: "bg-brand-purple/20"
    },
    {
      icon: <Headphones className="w-8 h-8 text-brand-blue" />,
      title: "Speech Recognition",
      desc: "Perfect your pronunciation with instant, accurate voice feedback.",
      color: "bg-brand-blue/20"
    }
  ];

  const faqs = [
    { q: "Is LingoLeap really free?", a: "Yes! The core learning experience is entirely free. You can earn gems by learning to unlock extra features." },
    { q: "How does the AI Tutor work?", a: "Our AI Tutor engages you in dynamic roleplays. It listens to your voice, understands context, and replies just like a native speaker." },
    { q: "Can I learn multiple languages?", a: "Absolutely. You can switch between any of our available languages at any time without losing your progress." },
    { q: "How much time do I need daily?", a: "Just 5 to 15 minutes a day is enough to build a solid habit and see real progress!" },
  ];

  return (
    <div className="min-h-screen bg-brand-light flex flex-col overflow-x-hidden font-sans">
      {/* Modern Sticky Navigation */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white dark:bg-bg-card shadow-md py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-6xl w-full mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-105" onClick={() => navigate('/')}>
            <LingoLeapLogo size={42} variant="main" concept="gecko" animated={true} />
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2.5 text-sm font-bold border-2 border-brand-gray text-text-main rounded-2xl btn-3d shadow-3d-gray hover:bg-brand-gray/10 hidden sm:block"
            >
              LOG IN
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-6 py-2.5 bg-brand-green text-white font-bold rounded-2xl text-sm btn-3d shadow-3d-green hover:bg-brand-green-hover"
            >
              GET STARTED
            </button>
          </div>
        </div>
      </header>

      {/* Spacer for sticky header */}
      <div className="h-24"></div>

      {/* Hero Section */}
      <main className="max-w-6xl w-full mx-auto px-6 flex flex-col md:flex-row items-center justify-center gap-12 py-10 md:py-20 relative">
        {/* Decorative background blobs */}
        <div className="absolute top-0 right-0 -mr-40 -mt-20 w-96 h-96 bg-brand-blue/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 -ml-40 -mb-20 w-96 h-96 bg-brand-green/10 rounded-full blur-3xl -z-10"></div>

        {/* Hero Left Actions */}
        <div className="w-full md:w-1/2 text-center md:text-left flex flex-col gap-6 fade-in-up relative z-10">
          <div className="inline-flex items-center gap-2 bg-white dark:bg-bg-card px-4 py-2 rounded-full border-2 border-border dark:border-border shadow-sm w-fit mx-auto md:mx-0">
            <Sparkles className="w-5 h-5 text-brand-yellow" />
            <span className="font-bold text-sm text-brand-dark/70">The new way to learn languages</span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-text-main leading-[1.1]">
            Learn a language for <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-brand-blue">real life.</span>
          </h1>
          <p className="text-xl text-brand-dark/70 font-semibold max-w-lg mx-auto md:mx-0 leading-relaxed">
            Master vocabulary, perfect your pronunciation, and practice with our immersive AI tutor. Fun, free, and wildly effective.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-4 justify-center md:justify-start">
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-brand-green text-white font-extrabold rounded-2xl text-lg btn-3d shadow-3d-green hover:bg-brand-green-hover w-full sm:w-auto flex items-center justify-center gap-2"
            >
              START LEARNING <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-white dark:bg-bg-card border-2 border-brand-gray text-brand-blue font-extrabold rounded-2xl text-lg btn-3d shadow-3d-card hover:bg-brand-light w-full sm:w-auto"
            >
              I HAVE AN ACCOUNT
            </button>
          </div>
        </div>

        {/* Hero Right Illustration */}
        <div className="w-full md:w-1/2 flex justify-center fade-in-up-delay-2 relative z-10">
          <div className="relative w-full max-w-md aspect-square">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-green/20 to-brand-blue/20 rounded-full animate-pulse blur-xl"></div>
            
            {/* Main Phone Mockup */}
            <div className="absolute inset-10 bg-white dark:bg-bg-card border-[12px] border-brand-dark rounded-[3rem] shadow-2xl overflow-hidden flex flex-col z-20">
              <div className="bg-brand-green p-4 flex justify-between items-center text-white">
                <Globe className="w-6 h-6" />
                <div className="flex gap-3">
                  <div className="flex items-center gap-1 font-bold"><Flame className="w-4 h-4 text-brand-orange" /> 14</div>
                  <div className="flex items-center gap-1 font-bold"><Trophy className="w-4 h-4 text-brand-yellow" /> 450</div>
                </div>
              </div>
              <div className="flex-1 bg-brand-light p-6 relative">
                <div className="w-16 h-16 bg-brand-blue rounded-full absolute top-10 right-8 shadow-3d-blue animate-bounce flex items-center justify-center text-white">
                  <Play fill="white" className="w-8 h-8 ml-1" />
                </div>
                <div className="mt-28 space-y-4">
                  <div className="h-12 bg-white dark:bg-bg-card rounded-xl shadow-sm border border-border dark:border-border flex items-center px-4">
                    <div className="w-6 h-6 rounded-full bg-brand-green/20 mr-3"></div>
                    <div className="h-3 w-1/2 bg-brand-gray/50 rounded-full"></div>
                  </div>
                  <div className="h-12 bg-white dark:bg-bg-card rounded-xl shadow-sm border border-brand-green border-b-4 bg-brand-green/5 flex items-center px-4">
                    <div className="w-6 h-6 rounded-full bg-brand-green flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-white" /></div>
                    <div className="h-3 w-2/3 bg-brand-green rounded-full ml-3"></div>
                  </div>
                  <div className="h-12 bg-white dark:bg-bg-card rounded-xl shadow-sm border border-border dark:border-border flex items-center px-4">
                    <div className="w-6 h-6 rounded-full bg-brand-gray/30 mr-3"></div>
                    <div className="h-3 w-1/3 bg-brand-gray/50 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute top-4 -left-6 w-20 h-20 bg-white dark:bg-bg-card rounded-2xl flex items-center justify-center text-4xl shadow-xl border-2 border-border dark:border-border transform -rotate-12 animate-bounce z-30 card-hover">
              🇪🇸
            </div>
            <div className="absolute bottom-16 -right-8 w-24 h-24 bg-white dark:bg-bg-card rounded-2xl flex items-center justify-center shadow-xl border-2 border-border dark:border-border transform rotate-12 z-30 card-hover">
              <div className="flex flex-col items-center">
                <Flame className="w-10 h-10 text-brand-orange streak-flicker" />
                <span className="font-extrabold text-brand-orange">14 DAYS</span>
              </div>
            </div>
            <div className="absolute top-1/2 -left-12 w-16 h-16 bg-white dark:bg-bg-card rounded-full flex items-center justify-center shadow-xl border-2 border-border dark:border-border transform -rotate-6 z-30 card-hover">
              <Bot className="w-8 h-8 text-brand-purple" />
            </div>
          </div>
        </div>
      </main>

      {/* Languages Showcase */}
      <section id="courses-showcase" className="bg-white dark:bg-bg-card border-y-2 border-border dark:border-border py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold text-text-main mb-10">Available Languages</h2>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {languages.map(lang => (
              <div key={lang.name} className={`flex items-center gap-3 px-6 py-4 rounded-2xl border-2 shadow-sm card-hover cursor-pointer ${lang.color} bg-white dark:bg-bg-card`}>
                <span className="text-3xl">{lang.flag}</span>
                <span className="font-extrabold text-lg text-text-main">{lang.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works & Gamification */}
      <section className="py-24 max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-text-main mb-4">Why LingoLeap works</h2>
          <p className="text-xl text-brand-dark/60 font-semibold max-w-2xl mx-auto">
            We combine the addictiveness of games with proven language acquisition science.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feat, i) => (
            <div key={i} className="flex flex-col items-center text-center p-8 bg-white dark:bg-bg-card rounded-[2rem] border-2 border-border dark:border-border shadow-3d-card card-hover group">
              <div className={`p-4 rounded-2xl mb-6 transform group-hover:scale-110 transition-transform ${feat.color}`}>
                {feat.icon}
              </div>
              <h3 className="text-2xl font-bold text-text-main mb-3">{feat.title}</h3>
              <p className="text-brand-dark/60 text-base font-semibold leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Gamification Deep Dive */}
      <section className="bg-brand-dark text-white py-24 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-brand-blue/20 to-transparent"></div>
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
          <div className="space-y-8">
            <h2 className="text-4xl md:text-5xl font-extrabold leading-tight">
              Stay motivated with <span className="text-brand-yellow">gamification</span>.
            </h2>
            <p className="text-xl text-gray-300 font-semibold leading-relaxed">
              Learning is easier when you're having fun. Earn points, unlock achievements, and compete with friends.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-orange/20 flex items-center justify-center flex-shrink-0">
                  <Flame className="w-6 h-6 text-brand-orange" />
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-1">Daily Streaks</h4>
                  <p className="text-text-secondary font-medium">Build a daily habit. Watch your streak fire grow with every lesson you complete.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-yellow/20 flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-6 h-6 text-brand-yellow" />
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-1">Leaderboards</h4>
                  <p className="text-text-secondary font-medium">Compete against learners worldwide. Climb the leagues from Bronze to Diamond.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-green/20 flex items-center justify-center flex-shrink-0">
                  <Award className="w-6 h-6 text-brand-green" />
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-1">Achievements</h4>
                  <p className="text-text-secondary font-medium">Unlock exclusive badges and earn gems to spend in the LingoLeap shop.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            {/* Mockup of leaderboard/stats */}
            <div className="bg-[#2c2c2c] rounded-[2rem] border border-gray-700 p-6 shadow-2xl transform rotate-3 card-hover">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Weekly Leaderboard</h3>
                <Trophy className="text-brand-yellow w-6 h-6" />
              </div>
              <div className="space-y-3">
                {[
                  { name: "Maria S.", xp: 2450, color: "bg-brand-yellow" },
                  { name: "You", xp: 2100, color: "bg-brand-gray/30", isYou: true },
                  { name: "Alex K.", xp: 1840, color: "bg-brand-orange" },
                  { name: "Chen W.", xp: 1650, color: "bg-brand-blue" },
                ].map((user, i) => (
                  <div key={i} className={`flex items-center gap-4 p-3 rounded-xl ${user.isYou ? 'bg-brand-green/20 border border-brand-green' : 'bg-[#3c3c3c]'}`}>
                    <div className={`w-8 h-8 rounded-full ${user.color} flex items-center justify-center font-bold text-text-main text-sm`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 font-bold">{user.name}</div>
                    <div className="font-mono text-brand-yellow font-bold">{user.xp} XP</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Tutor Showcase */}
      <section className="py-24 max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row-reverse items-center gap-16">
          <div className="w-full md:w-1/2 space-y-6">
            <div className="inline-flex items-center gap-2 bg-brand-purple/10 px-4 py-2 rounded-full text-brand-purple font-bold">
              <Bot className="w-5 h-5" />
              <span>Next-Gen Learning</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-text-main leading-tight">
              Converse with confidence.
            </h2>
            <p className="text-xl text-brand-dark/70 font-semibold leading-relaxed">
              Don't just memorize vocabulary. Use our advanced AI Tutor to roleplay real-life scenarios like ordering coffee in Paris or navigating a train station in Berlin.
            </p>
            <ul className="space-y-3 mt-4">
              <li className="flex items-center gap-3 font-bold text-brand-dark/80">
                <CheckCircle2 className="text-brand-green w-6 h-6" /> Instant grammatical feedback
              </li>
              <li className="flex items-center gap-3 font-bold text-brand-dark/80">
                <CheckCircle2 className="text-brand-green w-6 h-6" /> Dynamic, unscripted conversations
              </li>
              <li className="flex items-center gap-3 font-bold text-brand-dark/80">
                <CheckCircle2 className="text-brand-green w-6 h-6" /> Voice recognition integration
              </li>
            </ul>
          </div>
          
          <div className="w-full md:w-1/2">
            <div className="bg-white dark:bg-bg-card rounded-[2rem] border-2 border-border dark:border-border shadow-3d-card p-6 relative">
              <div className="absolute -top-6 -left-6 w-12 h-12 bg-brand-purple rounded-xl flex items-center justify-center shadow-lg transform -rotate-12">
                <MessageSquare className="text-white w-6 h-6" />
              </div>
              
              <div className="space-y-4 mt-2">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-purple/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="text-brand-purple w-6 h-6" />
                  </div>
                  <div className="bg-brand-light p-4 rounded-2xl rounded-tl-none border border-border dark:border-border">
                    <p className="font-medium text-text-main">Bonjour! Que désirez-vous commander aujourd'hui?</p>
                  </div>
                </div>
                
                <div className="flex gap-3 flex-row-reverse">
                  <div className="w-10 h-10 rounded-full bg-brand-green/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">👩‍🎓</span>
                  </div>
                  <div className="bg-brand-green/10 p-4 rounded-2xl rounded-tr-none border border-brand-green/30">
                    <p className="font-medium text-text-main">Je voudrais un croissant et un café, s'il vous plaît.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-purple/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="text-brand-purple w-6 h-6" />
                  </div>
                  <div className="bg-brand-light p-4 rounded-2xl rounded-tl-none border border-border dark:border-border">
                    <p className="font-medium text-text-main">Très bien! Parfaite prononciation! 🥐☕</p>
                    <div className="mt-2 text-xs font-bold text-brand-green bg-brand-green/10 inline-block px-2 py-1 rounded">
                      +10 XP Excellent response
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-brand-light/50 border-t-2 border-border dark:border-border py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-text-main mb-4">Loved by learners</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Sarah M.", lang: "Learning Spanish", text: "I tried other apps, but LingoLeap's AI Tutor actually got me speaking. I just ordered food in Madrid entirely in Spanish!" },
              { name: "David K.", lang: "Learning German", text: "The gamification is incredibly addictive. I haven't missed a day in 6 months. My 180-day streak keeps me coming back." },
              { name: "Aisha R.", lang: "Learning French", text: "The bite-sized lessons are perfect for my commute. It feels less like studying and more like playing a well-designed game." }
            ].map((review, i) => (
              <div key={i} className="bg-white dark:bg-bg-card p-8 rounded-[2rem] border-2 border-border dark:border-border shadow-3d-card card-hover flex flex-col justify-between">
                <div>
                  <div className="flex text-brand-yellow mb-4">
                    <Star fill="currentColor" className="w-5 h-5" />
                    <Star fill="currentColor" className="w-5 h-5" />
                    <Star fill="currentColor" className="w-5 h-5" />
                    <Star fill="currentColor" className="w-5 h-5" />
                    <Star fill="currentColor" className="w-5 h-5" />
                  </div>
                  <p className="text-brand-dark/80 font-medium italic mb-6">"{review.text}"</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-brand-gray/30 rounded-full flex items-center justify-center text-xl">
                    {['👩🏽', '👨🏻', '🧕🏽'][i]}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-text-main">{review.name}</h4>
                    <span className="text-xs font-bold text-brand-dark/50">{review.lang}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq-section" className="py-24 max-w-3xl mx-auto px-6">
        <h2 className="text-4xl font-extrabold text-center text-text-main mb-12">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white dark:bg-bg-card rounded-2xl border-2 border-border dark:border-border overflow-hidden">
              <button 
                className="w-full text-left p-6 font-extrabold text-text-main flex justify-between items-center focus:outline-none hover:bg-brand-light/50 transition-colors"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                {faq.q}
                <ChevronDown className={`w-5 h-5 text-brand-dark/50 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === i && (
                <div className="px-6 pb-6 text-brand-dark/70 font-medium font-sans">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-brand-green py-20 border-t-4 border-[#46A302]">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">Ready to take the leap?</h2>
          <p className="text-xl font-bold text-white/90 mb-10">Join thousands of learners mastering new languages today.</p>
          <button
            onClick={() => navigate('/register')}
            className="px-10 py-5 bg-white dark:bg-bg-card text-brand-green font-extrabold rounded-2xl text-xl btn-3d shadow-3d-card hover:bg-brand-light transform hover:scale-105"
          >
            START LEARNING FOR FREE
          </button>
        </div>
      </section>

      {/* Professional Footer */}
      <footer className="bg-brand-dark text-white pt-16 pb-8 border-t-4 border-gray-800">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-brand-green rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-white">
                Lingo<span className="text-brand-blue">Leap</span>
              </span>
            </div>
            <p className="text-text-secondary font-medium text-sm">
              The free, fun, and highly effective way to learn a language.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-gray-200 mb-4 uppercase tracking-widest text-sm">About us</h4>
            <ul className="space-y-3 text-text-secondary font-medium text-sm">
              <li><button onClick={() => document.getElementById('courses-showcase')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-brand-blue transition-colors bg-transparent border-none p-0 cursor-pointer text-left font-medium text-sm">Courses</button></li>
              <li><button onClick={() => handleOpenInfoModal('mission')} className="hover:text-brand-blue transition-colors bg-transparent border-none p-0 cursor-pointer text-left font-medium text-sm">Mission</button></li>
              <li><button onClick={() => handleOpenInfoModal('approach')} className="hover:text-brand-blue transition-colors bg-transparent border-none p-0 cursor-pointer text-left font-medium text-sm">Approach</button></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-gray-200 mb-4 uppercase tracking-widest text-sm">Help and support</h4>
            <ul className="space-y-3 text-text-secondary font-medium text-sm">
              <li><button onClick={() => document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-brand-blue transition-colors bg-transparent border-none p-0 cursor-pointer text-left font-medium text-sm">FAQ</button></li>
              <li><button onClick={() => handleOpenInfoModal('contact')} className="hover:text-brand-blue transition-colors bg-transparent border-none p-0 cursor-pointer text-left font-medium text-sm">Contact</button></li>
              <li><button onClick={() => handleOpenInfoModal('status')} className="hover:text-brand-blue transition-colors bg-transparent border-none p-0 cursor-pointer text-left font-medium text-sm">Status</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-200 mb-4 uppercase tracking-widest text-sm">Privacy and terms</h4>
            <ul className="space-y-3 text-text-secondary font-medium text-sm">
              <li><button onClick={() => handleOpenInfoModal('guidelines')} className="hover:text-brand-blue transition-colors bg-transparent border-none p-0 cursor-pointer text-left font-medium text-sm">Community Guidelines</button></li>
              <li><button onClick={() => handleOpenInfoModal('terms')} className="hover:text-brand-blue transition-colors bg-transparent border-none p-0 cursor-pointer text-left font-medium text-sm">Terms</button></li>
              <li><button onClick={() => handleOpenInfoModal('privacy')} className="hover:text-brand-blue transition-colors bg-transparent border-none p-0 cursor-pointer text-left font-medium text-sm">Privacy</button></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto px-6 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-text-secondary font-medium text-sm">© 2026 LingoLeap Inc. All rights reserved.</p>
          <div className="flex gap-4">
            {/* Social Icons Placeholders */}
            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-brand-blue text-text-secondary hover:text-white transition-colors cursor-pointer">
              <span>𝕏</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-brand-blue text-text-secondary hover:text-white transition-colors cursor-pointer">
              <span>in</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-brand-blue text-text-secondary hover:text-white transition-colors cursor-pointer">
              <span>ig</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Dynamic Modal Overlay */}
      {modalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/70 backdrop-blur-sm transition-all" onClick={() => setModalContent(null)}>
          <div className="w-full max-w-md bg-white dark:bg-bg-card rounded-3xl p-8 border-4 border-border dark:border-border shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setModalContent(null)}
              className="absolute top-4 right-4 p-2 hover:bg-brand-light rounded-xl text-brand-dark/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-black text-text-main mb-4 flex items-center gap-2">
              {modalContent.icon}
              {modalContent.title}
            </h3>
            <div className="text-brand-dark/70 font-semibold font-sans leading-relaxed text-sm">
              {modalContent.body}
            </div>
            <button
              onClick={() => setModalContent(null)}
              className="w-full py-3.5 bg-brand-green text-white font-bold rounded-2xl text-sm btn-3d shadow-3d-green hover:bg-brand-green-hover mt-6 transition-all"
            >
              Close Window
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
