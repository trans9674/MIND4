

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, RefreshCw, Save, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { AvatarConfig } from '../types';

interface Props {
  initialConfig?: AvatarConfig;
  onSave: (config: AvatarConfig) => void;
  onClose: () => void;
}

// --- Asset Definitions (SVG Paths) ---
// Coordinates are centralized around (50, 50) to support 2x scaling without overflowing the face (approx width 50-60px)

const SKIN_COLORS = ['#fcece3', '#f5d0b0', '#eeb088', '#d68b60', '#8d5524'];
const HAIR_COLORS = ['#1a1a1a', '#4a3022', '#8d5524', '#e6cea8', '#a8a8a8', '#b91c1c', '#e0ac69', '#f5e0c4'];
const CLOTH_COLORS = [
  '#1e293b', // Slate 800
  '#334155', // Slate 700
  '#475569', // Slate 600
  '#64748b', // Slate 500
  '#94a3b8', // Slate 400
  '#000000', // Black
  '#ffffff', // White
  '#1d4ed8', // Blue 700
  '#2563eb', // Blue 600
  '#3b82f6', // Blue 500
  '#60a5fa', // Blue 400
  '#0f766e', // Teal 700
  '#059669', // Emerald 600
  '#10b981', // Emerald 500
  '#b91c1c', // Red 700
  '#ef4444', // Red 500
  '#c2410c', // Orange 700
  '#f97316', // Orange 500
  '#a16207', // Yellow 700
  '#eab308', // Yellow 500
  '#7e22ce', // Purple 700
  '#a855f7', // Purple 500
  '#be185d', // Pink 700
  '#ec4899', // Pink 500
];

const FACE_SHAPES = [
  { id: 'round', name: '丸顔', path: <path d="M25,20 Q25,10 50,10 Q75,10 75,20 V60 Q75,85 50,85 Q25,85 25,60 Z" /> },
  { id: 'oval', name: '卵型', path: <path d="M20,20 Q20,10 50,10 Q80,10 80,20 V50 Q80,85 50,95 Q20,85 20,50 Z" /> },
  { id: 'square', name: '四角', path: <path d="M20,20 Q20,10 50,10 Q80,10 80,20 V60 L75,85 H25 L20,60 Z" /> },
];

const EYEBROW_STYLES = [
  // Input Y around 42-44. Scaled 2x relative to 50 -> Target Y ~34-38
  { id: 'normal', name: '普通', path: <g><path d="M38,43 Q41,41 44,43" fill="none" stroke="currentColor" strokeWidth="1" /><path d="M62,43 Q59,41 56,43" fill="none" stroke="currentColor" strokeWidth="1" /></g> },
  { id: 'thick', name: '太め', path: <g><path d="M38,43 Q41,41 44,43" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.8" /><path d="M62,43 Q59,41 56,43" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.8" /></g> },
  { id: 'thin', name: '細め', path: <g><path d="M37,43 Q41,40 45,43" fill="none" stroke="currentColor" strokeWidth="0.5" /><path d="M63,43 Q59,40 55,43" fill="none" stroke="currentColor" strokeWidth="0.5" /></g> },
  { id: 'angry', name: '怒り', path: <g><path d="M38,41 L44,44" fill="none" stroke="currentColor" strokeWidth="1" /><path d="M62,41 L56,44" fill="none" stroke="currentColor" strokeWidth="1" /></g> },
  { id: 'troubled', name: '困り', path: <g><path d="M38,44 L44,41" fill="none" stroke="currentColor" strokeWidth="1" /><path d="M62,44 L56,41" fill="none" stroke="currentColor" strokeWidth="1" /></g> },
];

const HAIR_STYLES = [
  { id: 'short', name: 'ショート', path: <path d="M30,30 Q50,5 70,30 T90,40 V50 H10 V40 Q20,10 50,10" /> },
  { id: 'side', name: '七三分け', path: <path d="M20,40 Q30,10 80,20 Q90,30 90,50 H10 Q10,25 20,40" /> },
  { id: 'long', name: 'ロング', path: <path d="M10,40 Q30,0 70,0 Q110,0 90,100 H80 V50 H20 V100 H10 Z" /> },
  { id: 'long_wavy', name: 'ウェーブ', path: <path d="M10,40 Q30,0 70,0 Q110,0 95,50 Q105,70 90,100 H80 V50 H20 V100 H10 Q-5,70 5,50 Z" /> },
  { id: 'ponytail', name: 'ポニー', path: <path d="M15,40 Q50,0 85,40 H15 Z M85,30 Q95,10 90,60 Q95,80 80,90 L85,40" /> },
  { id: 'bun', name: 'お団子', path: <path d="M15,40 Q50,5 85,40 H15 Z M35,10 Q50,-15 65,10 Z" /> },
  { id: 'bob', name: 'ボブ', path: <path d="M15,40 Q50,0 85,40 V80 Q85,90 75,80 L75,50 H25 L25,80 Q15,90 15,80 Z" /> },
  { id: 'bald', name: 'スキン', path: null },
];

const EYE_STYLES = [
  // Input centers around 41/59. Scaled 2x relative to 50 -> Target centers ~32/68
  { id: 'normal', name: '普通', path: <g><circle cx="41" cy="48" r="1.5" /><circle cx="59" cy="48" r="1.5" /></g> },
  { id: 'smile', name: '笑顔', path: <g><path d="M39,48 Q41,46 43,48" fill="none" strokeWidth="1" stroke="currentColor" /><path d="M57,48 Q59,46 61,48" fill="none" strokeWidth="1" stroke="currentColor" /></g> },
  { id: 'relaxed', name: '糸目', path: <g><path d="M38,48 Q41,45 44,48" fill="none" strokeWidth="1" stroke="currentColor" /><path d="M56,48 Q59,45 62,48" fill="none" strokeWidth="1" stroke="currentColor" /></g> },
  { id: 'serious', name: '真剣', path: <g><path d="M39,47 L43,48" fill="none" strokeWidth="1" stroke="currentColor" /><path d="M61,47 L57,48" fill="none" strokeWidth="1" stroke="currentColor" /><circle cx="41" cy="49" r="1" /><circle cx="59" cy="49" r="1" /></g> },
  { id: 'bored', name: 'ジト目', path: <g><circle cx="41" cy="48" r="1.5" /><circle cx="59" cy="48" r="1.5" /><line x1="38" y1="46" x2="44" y2="46" strokeWidth="1" stroke="currentColor" /><line x1="56" y1="46" x2="62" y2="46" strokeWidth="1" stroke="currentColor" /></g> },
  { id: 'wink', name: 'ウインク', path: <g><circle cx="41" cy="48" r="1.5" /><path d="M57,48 Q59,50 61,48" fill="none" strokeWidth="1" stroke="currentColor" /></g> },
  { id: 'lashes', name: 'まつげ', path: <g><circle cx="41" cy="48" r="1.5" /><path d="M39,47 L38,45 M41,46 L41,44 M43,47 L44,45" stroke="currentColor" strokeWidth="0.5" /><circle cx="59" cy="48" r="1.5" /><path d="M57,47 L56,45 M59,46 L59,44 M61,47 L62,45" stroke="currentColor" strokeWidth="0.5" /></g> },
  { id: 'sparkle', name: 'キラキラ', path: <g><path d="M41,46 L42,48 L41,50 L40,48 Z" fill="currentColor" /><path d="M59,46 L60,48 L59,50 L58,48 Z" fill="currentColor" /></g> },
  { id: 'wide', name: 'びっくり', path: <g><circle cx="41" cy="48" r="2.5" /><circle cx="59" cy="48" r="2.5" /><circle cx="41" cy="48" r="0.8" fill="white" /><circle cx="59" cy="48" r="0.8" fill="white" /></g> },
  { id: 'teary', name: '涙目', path: <g><circle cx="41" cy="48" r="1.5" /><circle cx="59" cy="48" r="1.5" /><path d="M43,50 Q44,52 43,53" stroke="blue" strokeWidth="0.5" fill="none" opacity="0.6"/><path d="M61,50 Q62,52 61,53" stroke="blue" strokeWidth="0.5" fill="none" opacity="0.6"/></g> },
];

const MOUTH_STYLES = [
  // Input Y around 60. Scaled 2x relative to 50 -> Target Y ~70.
  // Input Width 10 (45-55). Scaled 2x -> Width 20 (40-60).
  { id: 'smile', name: '笑顔', path: <path d="M45,60 Q50,65 55,60" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /> },
  { id: 'big_smile', name: '大笑い', path: <path d="M45,60 Q50,68 55,60 Z" fill="white" stroke="currentColor" strokeWidth="0.5" /> },
  { id: 'laugh', name: '開口', path: <path d="M45,60 Q50,68 55,60 Z" fill="#333" stroke="none" /> },
  { id: 'serious', name: '真面目', path: <path d="M46,62 H54" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /> },
  { id: 'surprised', name: '驚き', path: <circle cx="50" cy="62" r="2" fill="none" stroke="currentColor" strokeWidth="1" /> },
  { id: 'frown', name: 'への字', path: <path d="M45,64 Q50,59 55,64" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /> },
  { id: 'tongue', name: 'てへぺろ', path: <g><path d="M45,60 Q50,65 55,60" fill="none" stroke="currentColor" strokeWidth="1" /><path d="M48,62 Q50,66 52,62" fill="pink" stroke="none" /></g> },
  { id: 'cat', name: '猫口', path: <path d="M46,61 Q48,63 50,61 Q52,63 54,61" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /> },
  { id: 'smirk', name: 'ニヤリ', path: <path d="M45,62 Q50,63 55,60" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /> },
  { id: 'whistle', name: '口笛', path: <circle cx="50" cy="62" r="1.5" fill="none" stroke="currentColor" strokeWidth="1" /> },
];

const CLOTHING_STYLES = [
  // Use fill="none" or distinct accent colors to allow the base clothingColor to show
  { id: 'suit', name: 'スーツ', path: <g><path d="M20,0 L50,15 L80,0 Z" fill="white" /><path d="M50,15 L50,35" stroke="rgba(0,0,0,0.2)" strokeWidth="1" /><path d="M30,0 L50,15 L70,0" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" /></g> },
  { id: 'tshirt', name: 'Tシャツ', path: <path d="M25,0 Q50,10 75,0" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1" /> },
  { id: 'uniform', name: '作業着', path: <g><path d="M40,0 V35 M60,0 V35" stroke="white" strokeWidth="2" strokeDasharray="4 2" fill="none" /><path d="M20,10 H80" stroke="white" strokeWidth="1" strokeDasharray="4 2" fill="none" opacity="0.5"/></g> },
  { id: 'blouse', name: 'ブラウス', path: <g><path d="M50,0 V35" stroke="rgba(0,0,0,0.1)" strokeWidth="1" /><circle cx="50" cy="10" r="1.5" fill="rgba(255,255,255,0.6)" /><circle cx="50" cy="20" r="1.5" fill="rgba(255,255,255,0.6)" /><circle cx="50" cy="30" r="1.5" fill="rgba(255,255,255,0.6)" /></g> },
];

const HATS = [
  { id: 'none', name: 'なし', path: null },
  { id: 'helmet_w', name: 'ヘルメット(白)', color: '#f8fafc', path: <path d="M20,35 Q50,-10 80,35 L90,40 L10,40 Z" /> },
  { id: 'helmet_y', name: 'ヘルメット(黄)', color: '#facc15', path: <path d="M20,35 Q50,-10 80,35 L90,40 L10,40 Z" /> },
  { id: 'cap', name: 'キャップ', color: '#1e293b', path: <path d="M25,30 Q50,5 75,30 L90,40 H10 Z" /> },
];

const GLASSES = [
  { id: 'none', name: 'なし', path: null },
  { id: 'round', name: '丸メガネ', path: <g stroke="currentColor" strokeWidth="0.5" fill="none"><circle cx="41" cy="48" r="4" /><circle cx="59" cy="48" r="4" /><line x1="45" y1="48" x2="55" y2="48" /></g> },
  { id: 'square', name: '角メガネ', path: <g stroke="currentColor" strokeWidth="0.5" fill="none"><rect x="36" y="45" width="10" height="6" rx="1" /><rect x="54" y="45" width="10" height="6" rx="1" /><line x1="46" y1="48" x2="54" y2="48" /></g> },
];

const BEARDS = [
  { id: 'none', name: 'なし', path: null },
  { id: 'stubble', name: '無精髭', path: <path d="M35,65 Q50,85 65,65" fill="none" stroke="#a8a8a8" strokeWidth="4" opacity="0.5" /> },
  { id: 'goatee', name: 'あご髭', path: <path d="M45,75 Q50,85 55,75 Z" fill="#4a3022" /> },
  { id: 'moustache', name: '口髭', path: <path d="M35,65 Q50,60 65,65 Q65,60 50,62 Q35,60 35,65 Z" fill="#4a3022" /> },
  { id: 'full', name: 'フル', path: <path d="M25,55 Q25,85 50,85 Q75,85 75,55 L73,55 Q73,80 50,80 Q27,80 27,55 Z" fill="#4a3022" /> },
];

const AvatarCreator: React.FC<Props> = ({ initialConfig, onSave, onClose }) => {
  const [config, setConfig] = useState<AvatarConfig>(initialConfig || {
    skinColor: SKIN_COLORS[0],
    faceShape: 'round',
    hairStyle: 'short',
    hairColor: HAIR_COLORS[0],
    eyebrows: 'normal',
    eyeStyle: 'normal',
    mouthStyle: 'smile',
    clothing: 'suit',
    clothingColor: CLOTH_COLORS[0],
    glasses: 'none',
    hat: 'none',
    beard: 'none',
    accessory: 'none',
  });

  const [activeTab, setActiveTab] = useState('base');


  const handleRandomize = () => {
    setConfig({
      skinColor: SKIN_COLORS[Math.floor(Math.random() * SKIN_COLORS.length)],
      faceShape: FACE_SHAPES[Math.floor(Math.random() * FACE_SHAPES.length)].id,
      hairStyle: HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)].id,
      hairColor: HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)],
      eyebrows: EYEBROW_STYLES[Math.floor(Math.random() * EYEBROW_STYLES.length)].id,
      eyeStyle: EYE_STYLES[Math.floor(Math.random() * EYE_STYLES.length)].id,
      mouthStyle: MOUTH_STYLES[Math.floor(Math.random() * MOUTH_STYLES.length)].id,
      clothing: CLOTHING_STYLES[Math.floor(Math.random() * CLOTHING_STYLES.length)].id,
      clothingColor: CLOTH_COLORS[Math.floor(Math.random() * CLOTH_COLORS.length)],
      glasses: Math.random() > 0.7 ? GLASSES[Math.floor(Math.random() * (GLASSES.length - 1)) + 1].id : 'none',
      hat: Math.random() > 0.8 ? HATS[Math.floor(Math.random() * (HATS.length - 1)) + 1].id : 'none',
      beard: Math.random() > 0.8 ? BEARDS[Math.floor(Math.random() * (BEARDS.length - 1)) + 1].id : 'none',
      accessory: 'none',
    });
  };

  const getPath = (source: any[], id: string) => source.find(i => i.id === id)?.path;
  const getHatColor = (id: string) => HATS.find(h => h.id === id)?.color || '#fff';
  
  // Helper to check for back-rendering hair styles
  const isBackHair = (style: string) => ['long', 'long_wavy', 'ponytail', 'bun'].includes(style);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Left: Preview Area */}
        <div className="w-1/3 bg-slate-100 flex flex-col items-center justify-center relative p-8 border-r">
          <div className="relative w-64 h-64">
            <div 
               className="w-full h-full relative"
            >
                <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-2xl">
                    <defs>
                        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                           <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.1"/>
                        </filter>
                    </defs>

                    {/* Body/Clothes */}
                    <g transform={`translate(0, 85)`}>
                        <path d="M20,0 Q50,-10 80,0 V40 H20 Z" fill={config.clothingColor} />
                        {getPath(CLOTHING_STYLES, config.clothing)}
                    </g>

                    {/* Head Group */}
                    <g>
                        {/* Hair Back */}
                         {config.hat === 'none' && isBackHair(config.hairStyle) && (
                             <g fill={config.hairColor} transform="translate(0, -18)">
                                 {getPath(HAIR_STYLES, config.hairStyle)}
                             </g>
                         )}

                        {/* Face Shape */}
                        <g fill={config.skinColor} filter="url(#shadow)">
                            {getPath(FACE_SHAPES, config.faceShape || 'round')}
                        </g>
                        
                        {/* Beard - Unscaled to match face shape */}
                        {getPath(BEARDS, config.beard)}

                        {/* Face Features - Scaled 2.0x from center */}
                        <g transform={`translate(50, 50) scale(2.0) translate(-50, -50)`}>
                             {/* Eyebrows */}
                             <g fill={config.hairColor} stroke={config.hairColor}>
                                 {getPath(EYEBROW_STYLES, config.eyebrows || 'normal')}
                             </g>

                             {/* Mouth */}
                             <g className="text-slate-700">{getPath(MOUTH_STYLES, config.mouthStyle)}</g>

                             {/* Eyes */}
                             <g className="text-slate-800" transform={config.hat !== 'none' ? 'translate(0, 2)' : ''}>
                                 {getPath(EYE_STYLES, config.eyeStyle)}
                             </g>

                             {/* Glasses */}
                             <g className="text-slate-600" transform={config.hat !== 'none' ? 'translate(0, 2)' : ''}>
                                 {getPath(GLASSES, config.glasses)}
                             </g>
                        </g>

                        {/* Hair Front */}
                        {config.hat === 'none' && (
                            <g fill={config.hairColor} transform="translate(0, -18)">
                                {getPath(HAIR_STYLES, config.hairStyle)}
                            </g>
                        )}

                        {/* Hat */}
                        {config.hat !== 'none' && (
                            <g fill={getHatColor(config.hat)} transform="translate(0, -10)">
                                {getPath(HATS, config.hat)}
                            </g>
                        )}
                    </g>
                </svg>
            </div>
          </div>
          
          <div className="mt-8 flex gap-4">
             <button onClick={handleRandomize} className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow hover:bg-gray-50 text-slate-600 font-medium">
                <RefreshCw className="w-4 h-4" />
                <span>ランダム</span>
             </button>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex-1 flex flex-col bg-white">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50">
             <h2 className="text-xl font-bold text-slate-800">アバター作成</h2>
             <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
               <X className="w-6 h-6" />
             </button>
          </div>

          <div className="flex-1 flex overflow-hidden">
             {/* Tabs */}
             <div className="w-24 bg-gray-50 border-r flex flex-col overflow-y-auto overscroll-y-contain">
                {[
                  { id: 'base', label: '基本', icon: '👤' },
                  { id: 'hair', label: '髪型', icon: '💇' },
                  { id: 'face', label: '顔', icon: '👀' },
                  { id: 'cloth', label: '服装', icon: '👔' },
                  { id: 'acc', label: '装飾', icon: '👓' },
                ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`p-4 text-xs font-bold text-center border-l-4 transition-colors ${
                          activeTab === tab.id 
                          ? 'bg-white border-blue-500 text-blue-600' 
                          : 'border-transparent text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                        <div className="text-2xl mb-1">{tab.icon}</div>
                        {tab.label}
                    </button>
                ))}
             </div>

             {/* Options */}
             <div className="flex-1 p-6 overflow-y-auto overscroll-y-contain">
                <div className="grid grid-cols-1 gap-6">
                   
                   {activeTab === 'base' && (
                       <div className="space-y-4">
                           <h3 className="font-bold text-gray-700">肌の色</h3>
                           <div className="flex flex-wrap gap-3">
                               {SKIN_COLORS.map(color => (
                                   <button 
                                     key={color} 
                                     onClick={() => setConfig({...config, skinColor: color})}
                                     className={`w-10 h-10 rounded-full border-2 ${config.skinColor === color ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent'}`}
                                     style={{ backgroundColor: color }}
                                   />
                               ))}
                           </div>
                           
                           <h3 className="font-bold text-gray-700 mt-6">輪郭</h3>
                           <div className="grid grid-cols-3 gap-2">
                               {FACE_SHAPES.map(shape => (
                                   <button 
                                     key={shape.id}
                                     onClick={() => setConfig({...config, faceShape: shape.id})}
                                     className={`p-2 border rounded text-sm ${config.faceShape === shape.id ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'}`}
                                   >
                                       {shape.name}
                                   </button>
                               ))}
                           </div>
                       </div>
                   )}

                   {activeTab === 'hair' && (
                       <div className="space-y-6">
                           <div>
                               <h3 className="font-bold text-gray-700 mb-2">ヘアスタイル</h3>
                               <div className="grid grid-cols-3 gap-2">
                                   {HAIR_STYLES.map(style => (
                                       <button 
                                         key={style.id}
                                         onClick={() => setConfig({...config, hairStyle: style.id})}
                                         className={`p-2 border rounded text-sm ${config.hairStyle === style.id ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'}`}
                                       >
                                           {style.name}
                                       </button>
                                   ))}
                               </div>
                           </div>
                           <div>
                               <h3 className="font-bold text-gray-700 mb-2">髪色</h3>
                               <div className="flex flex-wrap gap-3">
                                   {HAIR_COLORS.map(color => (
                                       <button 
                                         key={color} 
                                         onClick={() => setConfig({...config, hairColor: color})}
                                         className={`w-10 h-10 rounded-full border-2 ${config.hairColor === color ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent'}`}
                                         style={{ backgroundColor: color }}
                                       />
                                   ))}
                               </div>
                           </div>
                       </div>
                   )}

                   {activeTab === 'face' && (
                       <div className="space-y-6">
                           <div>
                               <h3 className="font-bold text-gray-700 mb-2">眉毛</h3>
                               <div className="grid grid-cols-3 gap-2">
                                   {EYEBROW_STYLES.map(style => (
                                       <button 
                                         key={style.id}
                                         onClick={() => setConfig({...config, eyebrows: style.id})}
                                         className={`p-2 border rounded text-sm ${config.eyebrows === style.id ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'}`}
                                       >
                                           {style.name}
                                       </button>
                                   ))}
                               </div>
                           </div>
                           <div>
                               <h3 className="font-bold text-gray-700 mb-2">目</h3>
                               <div className="grid grid-cols-3 gap-2">
                                   {EYE_STYLES.map(style => (
                                       <button 
                                         key={style.id}
                                         onClick={() => setConfig({...config, eyeStyle: style.id})}
                                         className={`p-2 border rounded text-sm ${config.eyeStyle === style.id ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'}`}
                                       >
                                           {style.name}
                                       </button>
                                   ))}
                               </div>
                           </div>
                           <div>
                               <h3 className="font-bold text-gray-700 mb-2">口</h3>
                               <div className="grid grid-cols-3 gap-2">
                                   {MOUTH_STYLES.map(style => (
                                       <button 
                                         key={style.id}
                                         onClick={() => setConfig({...config, mouthStyle: style.id})}
                                         className={`p-2 border rounded text-sm ${config.mouthStyle === style.id ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'}`}
                                       >
                                           {style.name}
                                       </button>
                                   ))}
                               </div>
                           </div>
                           <div>
                               <h3 className="font-bold text-gray-700 mb-2">ひげ</h3>
                               <div className="grid grid-cols-3 gap-2">
                                   {BEARDS.map(style => (
                                       <button 
                                         key={style.id}
                                         onClick={() => setConfig({...config, beard: style.id})}
                                         className={`p-2 border rounded text-sm ${config.beard === style.id ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'}`}
                                       >
                                           {style.name}
                                       </button>
                                   ))}
                               </div>
                           </div>
                       </div>
                   )}

                   {activeTab === 'cloth' && (
                       <div className="space-y-6">
                           <div>
                               <h3 className="font-bold text-gray-700 mb-2">服装</h3>
                               <div className="grid grid-cols-3 gap-2">
                                   {CLOTHING_STYLES.map(style => (
                                       <button 
                                         key={style.id}
                                         onClick={() => setConfig({...config, clothing: style.id})}
                                         className={`p-2 border rounded text-sm ${config.clothing === style.id ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'}`}
                                       >
                                           {style.name}
                                       </button>
                                   ))}
                               </div>
                           </div>
                           <div>
                               <h3 className="font-bold text-gray-700 mb-2">服の色</h3>
                               <div className="flex flex-wrap gap-3">
                                   {CLOTH_COLORS.map(color => (
                                       <button 
                                         key={color} 
                                         onClick={() => setConfig({...config, clothingColor: color})}
                                         className={`w-10 h-10 rounded-full border-2 ${config.clothingColor === color ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent'}`}
                                         style={{ backgroundColor: color }}
                                       />
                                   ))}
                               </div>
                           </div>
                       </div>
                   )}

                   {activeTab === 'acc' && (
                       <div className="space-y-6">
                           <div>
                               <h3 className="font-bold text-gray-700 mb-2">かぶりもの</h3>
                               <div className="grid grid-cols-3 gap-2">
                                   {HATS.map(style => (
                                       <button 
                                         key={style.id}
                                         onClick={() => setConfig({...config, hat: style.id})}
                                         className={`p-2 border rounded text-sm ${config.hat === style.id ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'}`}
                                       >
                                           {style.name}
                                       </button>
                                   ))}
                               </div>
                           </div>
                           <div>
                               <h3 className="font-bold text-gray-700 mb-2">メガネ</h3>
                               <div className="grid grid-cols-3 gap-2">
                                   {GLASSES.map(style => (
                                       <button 
                                         key={style.id}
                                         onClick={() => setConfig({...config, glasses: style.id})}
                                         className={`p-2 border rounded text-sm ${config.glasses === style.id ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'}`}
                                       >
                                           {style.name}
                                       </button>
                                   ))}
                               </div>
                           </div>
                       </div>
                   )}
                </div>
             </div>
          </div>

          <div className="p-4 border-t bg-gray-50 flex justify-end space-x-3">
             <button onClick={onClose} className="px-6 py-2 text-gray-600 hover:bg-gray-200 rounded-lg">
                キャンセル
             </button>
             <button onClick={() => onSave(config)} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center shadow-lg shadow-blue-500/30">
                <Save className="w-4 h-4 mr-2" />
                保存する
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarCreator;