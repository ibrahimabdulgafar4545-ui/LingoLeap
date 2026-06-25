import React from 'react';
import { motion } from 'framer-motion';

const LingoLeapLogo = ({ 
  size = 40, 
  concept = 'gecko', 
  variant = 'compact', 
  animated = true,
  theme = 'light' 
}) => {
  const gradientId = `logoGrad-${concept}-${variant}`;
  const fillGradientId = `logoGradFill-${concept}-${variant}`;
  const trailGradientId = `logoTrailGrad-${concept}-${variant}`;

  // Pulse animation for the whole container every few seconds
  const containerVariants = {
    pulse: {
      scale: [1, 1.03, 1],
      transition: {
        duration: 3,
        ease: "easeInOut",
        repeat: Infinity,
        repeatDelay: 5
      }
    }
  };

  // 1. Speech Bubble animation
  const bubbleVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { 
      pathLength: 1, 
      opacity: 1,
      transition: { 
        duration: 0.8, 
        ease: "easeOut" 
      }
    }
  };

  // 2. Mascot jump animation
  const mascotVariants = {
    hidden: { scale: 0, y: 35, x: -15, rotate: -20, opacity: 0 },
    visible: { 
      scale: 1, 
      y: 0, 
      x: 0,
      rotate: 0,
      opacity: 1,
      transition: { 
        type: 'spring',
        stiffness: 180,
        damping: 14,
        delay: 0.5 
      }
    }
  };

  // 3. Motion trail dots animation
  const trailVariants = (delay) => ({
    hidden: { opacity: 0, scale: 0, x: -10, y: 10 },
    visible: {
      opacity: [0, 0.8, 0],
      scale: [0.3, 1, 0.3],
      x: 0,
      y: 0,
      transition: {
        duration: 2,
        ease: "easeOut",
        repeat: Infinity,
        repeatDelay: 1,
        delay: delay
      }
    }
  });

  // Text fade-in animation
  const textContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 1.0
      }
    }
  };

  const textLetterVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 200, damping: 10 }
    }
  };

  // Render Mascot based on concept
  const renderMascot = () => {
    switch (concept) {
      case 'fox':
        // Concept B: Felix the Clever Fox
        return (
          <motion.g
            variants={animated ? mascotVariants : {}}
            initial="hidden"
            animate="visible"
            className="origin-[50px_50px]"
          >
            {/* Fox Head & Ears (geometric line-art) */}
            <path
              d="M 52,28 L 62,18 L 66,28 L 74,32 L 68,36 L 62,46 L 58,38 L 52,28 Z"
              fill={`url(#${gradientId})`}
              className="opacity-95"
            />
            {/* Clever White Face Detail */}
            <path
              d="M 62,35 L 68,36 L 62,46 Z"
              fill={theme === 'dark' ? '#1E293B' : '#FFFFFF'}
            />
            {/* Smart Graduation Cap */}
            <path
              d="M 56,16 L 66,12 L 72,18 L 62,22 Z"
              fill="#1E293B"
              stroke="#FFFFFF"
              strokeWidth="1"
            />
            <path
              d="M 62,20 L 62,26"
              stroke="#F59E0B"
              strokeWidth="1.5"
            />
            <circle cx="62" cy="26" r="1.5" fill="#F59E0B" />

            {/* Fox Leaping Body */}
            <path
              d="M 52,38 Q 42,42 34,48"
              stroke={`url(#${gradientId})`}
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            {/* Fluffy Tail */}
            <path
              d="M 34,48 Q 24,52 28,42 Q 34,36 44,40"
              fill={`url(#${gradientId})`}
              className="opacity-90"
            />
            {/* White Tail Tip */}
            <path
              d="M 28,42 Q 25,48 26,45 Z"
              fill="#FFFFFF"
            />
            {/* Leaping Legs */}
            <path d="M 48,40 L 46,50" stroke={`url(#${gradientId})`} strokeWidth="3" strokeLinecap="round" />
            <path d="M 38,46 L 34,54" stroke={`url(#${gradientId})`} strokeWidth="3" strokeLinecap="round" />
            {/* Eye */}
            <circle cx="64" cy="31" r="1.5" fill="#FFFFFF" />
          </motion.g>
        );

      case 'hummingbird':
        // Concept C: Pip the Swift Hummingbird
        return (
          <motion.g
            variants={animated ? mascotVariants : {}}
            initial="hidden"
            animate="visible"
            className="origin-[50px_50px]"
          >
            {/* Beak representing directional progress */}
            <path
              d="M 68,34 L 84,28"
              stroke={`url(#${gradientId})`}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Curved hummingbird head & body */}
            <path
              d="M 50,48 Q 58,46 64,36 Q 69,30 65,28 Q 60,26 54,34 Q 48,42 40,46"
              fill={`url(#${gradientId})`}
            />
            {/* Wings flapping high */}
            <path
              d="M 54,32 Q 58,10 68,14 Q 66,22 56,30 Z"
              fill={`url(#${gradientId})`}
              className="opacity-80"
            />
            <path
              d="M 50,36 Q 42,16 48,18 Q 50,26 48,34 Z"
              fill={`url(#${gradientId})`}
              className="opacity-60"
            />
            {/* Fan tail representing language reach */}
            <path
              d="M 40,46 L 28,52 L 32,44 L 26,46 Z"
              fill={`url(#${gradientId})`}
            />
            {/* Curious learning eye */}
            <circle cx="61" cy="30" r="2" fill="#FFFFFF" />
            <circle cx="61.5" cy="29.5" r="0.7" fill="#0F172A" />

            {/* Little speech envelope dot in beak */}
            <circle cx="84" cy="28" r="2" fill="#3B82F6" />
          </motion.g>
        );

      case 'gecko':
      default:
        // Concept A (Chosen Strongest Mascot): Lingo the Leaping Gecko
        return (
          <motion.g
            variants={animated ? mascotVariants : {}}
            initial="hidden"
            animate="visible"
            className="origin-[50px_50px]"
          >
            {/* Spine & Curved Tail */}
            <path
              d="M 68,34 C 58,44 42,62 30,68 C 21,72 18,62 24,57 C 30,52 38,48 46,44"
              stroke={`url(#${gradientId})`}
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            
            {/* Head (curious, angled upwards in jump) */}
            <circle 
              cx="67" 
              cy="31" 
              r="7.5" 
              fill={`url(#${gradientId})`} 
            />

            {/* Huge curious eyes (representing learning and observation) */}
            <motion.g
              animate={{ scaleY: [1, 0.1, 1, 1, 1, 1, 1, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformOrigin: "68px 27px" }}
            >
              <circle cx="68" cy="27" r="3.5" fill="#FFFFFF" />
              <circle cx="69" cy="26.5" r="1.5" fill="#0F172A" />
            </motion.g>
            
            {/* Cute Smart Glasses */}
            <circle cx="68" cy="27" r="4.2" stroke="#FFFFFF" strokeWidth="1" fill="none" />
            <path d="M 64.5,29 L 60,32" stroke="#FFFFFF" strokeWidth="1.2" />

            {/* Communication Headphones */}
            <path
              d="M 60,33 A 8 8 0 0 1 72,25"
              stroke="#3B82F6"
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />
            {/* Ear cup */}
            <rect x="58.5" y="31.5" width="2" height="4" rx="1" fill="#3B82F6" />
            <rect x="71" y="24" width="2" height="4" rx="1" fill="#3B82F6" />

            {/* Front Left Arm raised in triumph */}
            <path
              d="M 62,35 C 57,32 50,31 46,29"
              stroke={`url(#${gradientId})`}
              strokeWidth="3.2"
              strokeLinecap="round"
              fill="none"
            />
            {/* Front Right Arm high-fiving the progress */}
            <path
              d="M 69,36 C 75,39 80,36 84,33"
              stroke={`url(#${gradientId})`}
              strokeWidth="3.2"
              strokeLinecap="round"
              fill="none"
            />
            {/* Gecko rounded toes (suction cups representing holding on to knowledge) */}
            <circle cx="45" cy="29" r="1.8" fill={`url(#${gradientId})`} />
            <circle cx="85" cy="32" r="1.8" fill={`url(#${gradientId})`} />

            {/* Back Left Leg leaping */}
            <path
              d="M 45,46 C 42,54 36,58 32,60"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              style={{ stroke: `url(#${gradientId})` }}
            />
            {/* Back Right Leg pushing off */}
            <path
              d="M 52,43 C 57,48 58,54 60,60"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              style={{ stroke: `url(#${gradientId})` }}
            />
            <circle cx="31" cy="61" r="1.6" fill={`url(#${gradientId})`} />
            <circle cx="61" cy="61" r="1.6" fill={`url(#${gradientId})`} />
          </motion.g>
        );
    }
  };

  // Base logo SVG content
  const logoSvg = (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="LingoLeap Logo"
      className="inline-block select-none overflow-visible"
      variants={animated ? containerVariants : {}}
      animate="pulse"
    >
      <defs>
        {/* Sleek Green-to-Blue premium gradient */}
        <linearGradient id={gradientId} x1="10%" y1="90%" x2="90%" y2="10%">
          <stop offset="0%" stopColor="#22C55E" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        {/* Soft backdrop fill for bubble */}
        <linearGradient id={fillGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22C55E" stopOpacity={theme === 'dark' ? "0.05" : "0.06"} />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity={theme === 'dark' ? "0.05" : "0.06"} />
        </linearGradient>
        {/* Trail Gradient */}
        <linearGradient id={trailGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>
      </defs>

      {/* ── Speech Bubble (Drawn path) ── */}
      <motion.path
        d="M 22,18 H 78 A 12,12 0 0 1 90,30 V 62 A 12,12 0 0 1 78,74 H 46 L 28,88 V 74 H 22 A 12,12 0 0 1 10,62 V 30 A 12,12 0 0 1 22,18 Z"
        fill={`url(#${fillGradientId})`}
        stroke={`url(#${gradientId})`}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={animated ? bubbleVariants : {}}
        initial="hidden"
        animate="visible"
      />

      {/* ── Mascot jumps into place ── */}
      {renderMascot()}

      {/* ── Blue motion trail following the diagonal leap ── */}
      {variant !== 'favicon' && (
        <g>
          <motion.circle
            cx="32"
            cy="78"
            r="3"
            fill={`url(#${trailGradientId})`}
            variants={animated ? trailVariants(0.8) : {}}
            initial="hidden"
            animate="visible"
          />
          <motion.circle
            cx="24"
            cy="84"
            r="2"
            fill={`url(#${trailGradientId})`}
            variants={animated ? trailVariants(1.0) : {}}
            initial="hidden"
            animate="visible"
          />
          <motion.circle
            cx="18"
            cy="89"
            r="1.2"
            fill={`url(#${trailGradientId})`}
            variants={animated ? trailVariants(1.2) : {}}
            initial="hidden"
            animate="visible"
          />
        </g>
      )}
    </motion.svg>
  );

  // If compact or favicon variant, just return the SVG icon
  if (variant === 'compact' || variant === 'favicon') {
    return logoSvg;
  }

  // Full Main Logo Variant (Includes text fade-in)
  return (
    <div className="flex items-center gap-3.5 select-none">
      {logoSvg}

      <motion.div
        variants={animated ? textContainerVariants : {}}
        initial="hidden"
        animate="visible"
        className="flex items-center text-3xl font-black tracking-tight"
        style={{
          fontSize: size * 0.75,
          fontFamily: '"Outfit", "Inter", sans-serif'
        }}
      >
        {"Lingo".split("").map((letter, idx) => (
          <motion.span
            key={`l-${idx}`}
            variants={animated ? textLetterVariants : {}}
            className="text-primary"
            style={{ display: 'inline-block' }}
          >
            {letter}
          </motion.span>
        ))}
        {"Leap".split("").map((letter, idx) => (
          <motion.span
            key={`lp-${idx}`}
            variants={animated ? textLetterVariants : {}}
            className="text-secondary"
            style={{ display: 'inline-block' }}
          >
            {letter}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
};

export default LingoLeapLogo;
