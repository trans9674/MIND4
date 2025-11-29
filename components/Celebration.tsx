import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
}

interface Props {
  taskTitle: string;
}

const Celebration: React.FC<Props> = ({ taskTitle }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [heroEmoji, setHeroEmoji] = useState('🚀');
  const [isRare, setIsRare] = useState<'none' | 'shima-enaga' | 'dinosaur'>('none');
  const [isSpecial, setIsSpecial] = useState(false);

  useEffect(() => {
    // 1. Determine Event Type & Emoji
    const roll = Math.random(); // 0.0 to 1.0
    let emoji = '🚀';
    let rareType: 'none' | 'shima-enaga' | 'dinosaur' = 'none';
    let specialEvent = false;

    // Check for Special Keywords (Contract, Handover, Approval)
    if (taskTitle.includes('契約') || taskTitle.includes('請負')) {
        emoji = '🎊'; // Kusudama/Confetti
        specialEvent = true;
    } else if (taskTitle.includes('引き渡し') || taskTitle.includes('引渡') || taskTitle.includes('鍵')) {
        emoji = '🏠'; // House + Keys (handled visually or just house)
        specialEvent = true;
    } else if (taskTitle.includes('承認') || taskTitle.includes('確定') || taskTitle.includes('許可')) {
        emoji = '💮'; // White Flower/Stamp
        specialEvent = true;
    }

    // Rare Character Logic overrides standard/special emoji
    if (roll < 0.01) { // 1% (1/100)
        rareType = 'dinosaur';
        emoji = '🦖';
    } else if (roll < 0.03) { // 2% (approx 1/50)
        rareType = 'shima-enaga';
        emoji = '🕊️'; // White bird (approx Shima Enaga)
    } else if (!specialEvent) {
        // Randomize standard celebrations if not special
        const standardEmojis = ['🚀', '🎉', '👏', '🥂', '🎈', '🌟', '💐', '🎁', '🎺', '🌈'];
        emoji = standardEmojis[Math.floor(Math.random() * standardEmojis.length)];
    }

    setHeroEmoji(emoji);
    setIsRare(rareType);
    setIsSpecial(specialEvent);

    // 2. Generate Particles
    const particleCount = specialEvent ? 80 : 40; // More particles for special events
    const colors = specialEvent 
        ? ['#FFD700', '#FFA500', '#FFFFFF', '#F0E68C'] // Gold/White theme
        : ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];

    const newParticles = Array.from({ length: particleCount }).map((_, i) => ({
      id: i,
      x: 0,
      y: 0,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * (specialEvent ? 12 : 8) + 4,
    }));
    setParticles(newParticles);

  }, [taskTitle]);

  // Animation Variants based on type
  const getHeroAnimation = () => {
      if (isRare === 'dinosaur') {
          return {
              initial: { scale: 0, y: 200, rotate: -10 },
              animate: { scale: 5, y: 0, rotate: [0, -5, 5, 0] }, // Stomp
              // FIX: Add 'as const' to the 'type' property to ensure TypeScript infers the literal type 'spring'
              // instead of the general 'string' type, which resolves the assignment error with framer-motion's Transition type.
              transition: { duration: 1.5, type: "spring" as const, bounce: 0.6 }
          };
      }
      if (isRare === 'shima-enaga') {
          return {
              initial: { x: -200, y: 100, scale: 0 },
              animate: { x: [ -100, 0, 100, 0], y: [0, -50, 0, -20], scale: 3, rotateY: [0, 180, 0] }, // Fly around
              transition: { duration: 2.5, times: [0, 0.5, 0.8, 1] }
          };
      }
      if (isSpecial) {
          // Flashy Pop
          return {
              initial: { scale: 0, rotate: 180 },
              animate: { scale: [0, 1.5, 1], rotate: 0 },
              transition: { duration: 0.8, ease: "backOut" }
          };
      }
      // Standard Rocket/Balloon
      return {
          initial: { y: 200, opacity: 0, scale: 0.5 },
          animate: { y: -50, opacity: 1, scale: 2 },
          transition: { duration: 0.8, ease: "easeOut" }
      };
  };

  const anim = getHeroAnimation();

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[100] flex items-center justify-center">
      {/* Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{
            x: (Math.random() - 0.5) * (isSpecial ? 1000 : 600),
            y: (Math.random() - 0.5) * (isSpecial ? 1000 : 600),
            scale: [0, 1, 0],
            rotate: Math.random() * 360,
          }}
          transition={{ duration: isSpecial ? 2 : 1.5, ease: "easeOut" }}
          className="absolute rounded-full"
          style={{ 
              backgroundColor: p.color,
              width: p.size,
              height: p.size,
              boxShadow: isSpecial ? `0 0 10px ${p.color}` : 'none'
          }}
        />
      ))}

      {/* Hero Character */}
       <motion.div
        initial={anim.initial}
        animate={anim.animate}
        transition={anim.transition}
        className="text-6xl filter drop-shadow-2xl"
        style={{
            fontSize: isRare === 'dinosaur' ? '120px' : '80px',
            textShadow: '0 4px 10px rgba(0,0,0,0.2)'
        }}
       >
         {heroEmoji}
       </motion.div>
       
       {/* Special Text Effect for Contracts/Handover */}
       {isSpecial && !isRare && (
           <motion.div
             initial={{ opacity: 0, scale: 0 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ delay: 0.2 }}
             className="absolute mt-32 bg-yellow-100 text-yellow-800 px-6 py-2 rounded-full font-bold border-2 border-yellow-400 shadow-xl"
           >
               Congratulations!
           </motion.div>
       )}
    </div>
  );
};

export default Celebration;
