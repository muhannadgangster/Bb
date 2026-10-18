/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CharacterId } from '../types/game';
import { CHARACTERS } from '../entities/player';
import { sound } from '../audio/soundEngine';
import { X, Shield, Zap, Target } from 'lucide-react';

interface CharacterSwitchRadialProps {
  activeCharacterId: CharacterId;
  onSelectCharacter: (id: CharacterId) => void;
  onClose: () => void;
}

export const CharacterSwitchRadial: React.FC<CharacterSwitchRadialProps> = ({
  activeCharacterId,
  onSelectCharacter,
  onClose,
}) => {
  const characters: CharacterId[] = ['jax', 'marcus', 'leo'];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center font-['Inter',sans-serif] animate-in fade-in duration-200">
      <div className="relative flex flex-col items-center">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
            PROTAGONIST SELECTION
          </div>
          <div className="font-['Chakra_Petch'] text-3xl font-black text-white">
            SWITCH PROTAGONIST
          </div>
        </div>

        {/* 3 Character Cards */}
        <div className="flex gap-6 items-stretch">
          {characters.map((id) => {
            const char = CHARACTERS[id];
            const isActive = activeCharacterId === id;

            return (
              <button
                key={id}
                onClick={() => {
                  onSelectCharacter(id);
                  onClose();
                }}
                className={`w-56 p-5 rounded-2xl border-2 text-left transition-all hover:scale-105 active:scale-95 shadow-2xl flex flex-col justify-between ${
                  isActive
                    ? 'bg-zinc-900 shadow-[0_0_30px_rgba(255,255,255,0.2)]'
                    : 'bg-zinc-950/90 border-zinc-800 hover:border-zinc-600'
                }`}
                style={isActive ? { borderColor: char.color } : {}}
              >
                <div>
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-3xl text-black mb-4 shadow"
                    style={{ backgroundColor: char.color }}
                  >
                    {char.name[0]}
                  </div>

                  <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    {char.role}
                  </div>
                  <div className="text-xl font-black text-white font-['Chakra_Petch'] mb-1">
                    {char.name}
                  </div>
                  <div className="text-xs text-zinc-300 italic mb-4">"{char.alias}"</div>

                  {/* Stats bars */}
                  <div className="space-y-2 text-[10px] text-zinc-400">
                    <div>
                      <div className="flex justify-between mb-0.5">
                        <span>Shooting</span>
                        <span className="font-mono text-white">{char.stats.shooting}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${char.stats.shooting}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-0.5">
                        <span>Driving</span>
                        <span className="font-mono text-white">{char.stats.driving}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${char.stats.driving}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-0.5">
                        <span>Stamina</span>
                        <span className="font-mono text-white">{char.stats.stamina}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${char.stats.stamina}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-zinc-800 text-[11px] font-semibold text-amber-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>{char.specialAbility}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Close Button / Cancel */}
        <button
          onClick={onClose}
          className="mt-8 text-xs font-bold text-zinc-400 hover:text-white px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center gap-1.5 transition-colors"
        >
          <X className="w-4 h-4" /> Cancel (ESC)
        </button>
      </div>
    </div>
  );
};
