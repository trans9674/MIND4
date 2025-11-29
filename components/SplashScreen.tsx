
import React from 'react';
import { motion } from 'framer-motion';

const SplashScreen: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
      className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center text-white overflow-hidden"
    >
      <div className="relative flex flex-col items-center">
        {/* Logo Animation */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
          className="bg-blue-600 p-5 rounded-3xl shadow-2xl shadow-blue-500/30 mb-6"
        >
          {/* Custom Logo Icon: House centered at X=16 (ViewBox 32), Dot moved to X=31 */}
          <svg 
            viewBox="0 0 32 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="w-[4.3rem] h-[4.3rem] text-white"
          >
            {/* House: Width 22, Height 20.5. Center X=16. Peak Y=2. */}
            <path d="M5 22.5V8.5L16 2L27 8.5V22.5" />
            <circle cx="31" cy="22.5" r="1" fill="currentColor" stroke="none" />
          </svg>
        </motion.div>

        {/* Text Animation */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-center space-y-1"
        >
          <h1 className="text-[1.6rem] leading-[2rem] font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            ie-koto MIND
          </h1>
          <p className="text-slate-400 text-xs tracking-wide font-light">
            Construction Management Platform
          </p>
        </motion.div>
      </div>

      {/* Loading Bar */}
      <div className="absolute bottom-20 w-64 h-1 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 3, ease: "linear" }}
          className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
        />
      </div>
      
      <div className="absolute bottom-6 text-xs text-slate-600">
        © 2024 ie-koto MIND Inc.
      </div>
    </motion.div>
  );
};

export default SplashScreen;