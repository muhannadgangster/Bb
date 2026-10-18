/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameMode, CharacterId } from '../types/game';
import { CHARACTERS } from '../entities/player';
import { sound } from '../audio/soundEngine';
import { Play, Compass, Shield, Users, Volume2, Sparkles } from 'lucide-react';

interface TitleScreenProps {
  onStartGame: (mode: GameMode, character: CharacterId) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStartGame }) => {
  const [selectedChar, setSelectedChar] = useState<CharacterId>('jax');
  const [selectedMode, setSelectedMode] = useState<GameMode>('story');

  const char = CHARACTERS[selectedChar];

  const handleStart = () => {
    sound.playMissionPassSound();
    onStartGame(selectedMode, selectedChar);
  };

  return (
    <div className="absolute inset-0 z-40 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col justify-between p-8 text-white font-['Inter',sans-serif] pointer-events-auto select-none">
      {/* Top Banner */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold tracking-widest uppercase bg-amber-500 text-black px-2.5 py-1 rounded">
            AAA Open-World 3D
          </span>
          <span className="text-xs text-zinc-400 font-mono">v1.0.0 · Los Verdes & Horizon Coast</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Volume2 className="w-4 h-4 text-emerald-400" />
          <span>Web Audio Procedural Sound Engine</span>
        </div>
      </div>

      {/* Center Cinematic Title Lockup */}
      <div className="max-w-2xl my-auto">
        <div className="mb-2 flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest">
          <Sparkles className="w-4 h-4" /> Next-Gen Action Adventure
        </div>

        {/* Bespoke SVG Title Lockup */}
        <div className="mb-6">
          <h1 className="font-['Chakra_Petch'] text-7xl md:text-8xl font-black italic tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-500 to-cyan-400 drop-shadow-[0_10px_25px_rgba(245,158,11,0.3)]">
            VICE HORIZON
          </h1>
          <div className="text-sm font-semibold tracking-[0.3em] uppercase text-zinc-300 mt-1 pl-1">
            Los Verdes County · Crime Syndicate · Full Freedom
          </div>
        </div>

        {/* Game Mode Selector */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => {
              setSelectedMode('story');
              sound.playUIClick();
            }}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedMode === 'story'
                ? 'bg-amber-950/40 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-base text-amber-400 mb-1">
              <Play className="w-4 h-4 fill-current" /> FULL STORY MODE
            </div>
            <div className="text-xs text-zinc-400">
              Structured narrative missions, heist planning, character cutscenes, checkpoints, and police pursuit.
            </div>
          </button>

          <button
            onClick={() => {
              setSelectedMode('sandbox');
              sound.playUIClick();
            }}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedMode === 'sandbox'
                ? 'bg-cyan-950/40 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-base text-cyan-400 mb-1">
              <Compass className="w-4 h-4" /> SANDBOX FREE ROAM
            </div>
            <div className="text-xs text-zinc-400">
              Complete world freedom, all vehicles & weapons unlocked, custom weather, ramp stunts, zero story limits.
            </div>
          </button>
        </div>

        {/* Character Selection Cards */}
        <div className="mb-8">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Select Starting Character:
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(['jax', 'marcus', 'leo'] as CharacterId[]).map((cId) => {
              const c = CHARACTERS[cId];
              const isSelected = selectedChar === cId;
              return (
                <button
                  key={cId}
                  onClick={() => {
                    setSelectedChar(cId);
                    sound.playUIClick();
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-zinc-900 border-white shadow-lg'
                      : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700'
                  }`}
                  style={isSelected ? { borderColor: c.color } : {}}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-black"
                      style={{ backgroundColor: c.color }}
                    >
                      {c.name[0]}
                    </div>
                    <span className="font-bold text-xs text-white">{c.name}</span>
                  </div>
                  <div className="text-[11px] text-zinc-400">{c.role}</div>
                  <div className="text-[10px] text-amber-300 font-semibold mt-1">
                    ★ {c.specialAbility}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary Start CTA Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleStart}
            className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-['Chakra_Petch'] font-black text-xl tracking-wider uppercase rounded-xl shadow-[0_10px_30px_rgba(245,158,11,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3 cursor-pointer"
          >
            <Play className="w-6 h-6 fill-current" /> ENTER LOS VERDES
          </button>
        </div>
      </div>

      {/* Bottom Flat Control Hint Line */}
      <div className="border-t border-zinc-800/80 pt-4 flex flex-wrap justify-between items-center text-xs text-zinc-400">
        <div>
          <span className="text-zinc-500">CONTROLS:</span> WASD Move / Drive · Space Jump / Handbrake · E Enter Vehicle · LMB Fire · RMB Aim · M Smartphone · P Pause
        </div>
        <div className="text-zinc-500">Press ENTER or click button to start</div>
      </div>
    </div>
  );
};
