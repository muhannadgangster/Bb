/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Player } from '../entities/player';
import { PoliceSystem } from '../systems/policeSystem';
import { PHONE_CONTACTS, INITIAL_MESSAGES } from '../systems/phoneSystem';
import { sound } from '../audio/soundEngine';
import { Phone, MessageSquare, Landmark, Car, ShieldAlert, X, ChevronLeft, Wifi, Battery } from 'lucide-react';

interface SmartphoneProps {
  player: Player;
  police: PoliceSystem;
  onClose: () => void;
  onSpawnVehicle: (type: 'supercar' | 'muscle' | 'motorcycle' | 'helicopter') => void;
}

type PhoneApp = 'home' | 'contacts' | 'messages' | 'bank' | 'dealership' | 'cheats';

export const Smartphone: React.FC<SmartphoneProps> = ({
  player,
  police,
  onClose,
  onSpawnVehicle,
}) => {
  const [currentApp, setCurrentApp] = useState<PhoneApp>('home');
  const [activeCallText, setActiveCallText] = useState<string | null>(null);

  const handleCall = (dialogue?: string) => {
    sound.playPhoneRing();
    if (dialogue) {
      setActiveCallText(dialogue);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-72 h-[480px] bg-zinc-950 border-4 border-zinc-700 rounded-[36px] shadow-2xl flex flex-col overflow-hidden text-white font-['Inter',sans-serif] animate-in slide-in-from-bottom-8 duration-300">
      {/* Top Speaker Notch & Status Bar */}
      <div className="bg-black px-5 pt-3 pb-2 flex items-center justify-between text-[11px] text-zinc-400 border-b border-zinc-900">
        <span className="font-semibold text-white">14:45</span>
        <div className="w-16 h-4 bg-zinc-900 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-zinc-800 rounded-full" />
        </div>
        <div className="flex items-center gap-1.5">
          <Wifi className="w-3 h-3 text-zinc-300" />
          <Battery className="w-3.5 h-3.5 text-zinc-300" />
        </div>
      </div>

      {/* Screen Body */}
      <div className="flex-1 bg-gradient-to-b from-slate-900 via-zinc-900 to-black p-4 flex flex-col overflow-y-auto">
        {/* Navigation Bar inside App */}
        {currentApp !== 'home' && (
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
            <button
              onClick={() => {
                setCurrentApp('home');
                setActiveCallText(null);
                sound.playUIClick();
              }}
              className="flex items-center gap-1 text-xs text-amber-400 font-semibold hover:underline"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              {currentApp}
            </span>
            <div className="w-6" />
          </div>
        )}

        {/* Active Call Dialogue Popover */}
        {activeCallText && (
          <div className="bg-amber-950/80 border border-amber-600 rounded-lg p-2.5 text-xs text-amber-200 mb-3 animate-in fade-in">
            <div className="font-bold text-amber-400 mb-1 flex items-center gap-1">
              <Phone className="w-3 h-3 animate-bounce" /> CALL IN PROGRESS
            </div>
            {activeCallText}
          </div>
        )}

        {/* HOME APP GRID */}
        {currentApp === 'home' && (
          <div className="flex-1 flex flex-col justify-between py-2">
            <div>
              <div className="text-center mb-6">
                <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">HORIZON OS</div>
                <div className="text-2xl font-light font-['Chakra_Petch'] text-white">Los Verdes</div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => {
                    setCurrentApp('contacts');
                    sound.playUIClick();
                  }}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[11px] text-zinc-300">Contacts</span>
                </button>

                <button
                  onClick={() => {
                    setCurrentApp('messages');
                    sound.playUIClick();
                  }}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[11px] text-zinc-300">Messages</span>
                </button>

                <button
                  onClick={() => {
                    setCurrentApp('bank');
                    sound.playUIClick();
                  }}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    <Landmark className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[11px] text-zinc-300">Maze Bank</span>
                </button>

                <button
                  onClick={() => {
                    setCurrentApp('dealership');
                    sound.playUIClick();
                  }}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-red-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    <Car className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[11px] text-zinc-300">Vehicles</span>
                </button>

                <button
                  onClick={() => {
                    setCurrentApp('cheats');
                    sound.playUIClick();
                  }}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    <ShieldAlert className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[11px] text-zinc-300">Quick Hacks</span>
                </button>
              </div>
            </div>

            <div className="text-center text-[10px] text-zinc-500">
              Press <kbd className="bg-zinc-800 text-zinc-300 px-1 py-0.5 rounded border border-zinc-700">M</kbd> to close
            </div>
          </div>
        )}

        {/* CONTACTS APP */}
        {currentApp === 'contacts' && (
          <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
            {PHONE_CONTACTS.map((contact) => (
              <div
                key={contact.id}
                className="bg-zinc-800/80 border border-zinc-700/60 rounded-xl p-3 flex items-center justify-between hover:bg-zinc-700/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{contact.avatar}</span>
                  <div>
                    <div className="text-xs font-bold text-white">{contact.name}</div>
                    <div className="text-[10px] text-zinc-400">{contact.status}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleCall(contact.dialogue)}
                  className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center shadow transition-colors"
                >
                  <Phone className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* MESSAGES APP */}
        {currentApp === 'messages' && (
          <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto">
            {INITIAL_MESSAGES.map((msg) => (
              <div key={msg.id} className="bg-zinc-800/80 border border-zinc-700 rounded-xl p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-amber-400">{msg.from}</span>
                  <span className="text-[10px] text-zinc-400 font-mono">{msg.timestamp}</span>
                </div>
                <div className="text-xs text-zinc-200">{msg.body}</div>
              </div>
            ))}
          </div>
        )}

        {/* BANK APP */}
        {currentApp === 'bank' && (
          <div className="flex-1 flex flex-col gap-3">
            <div className="bg-gradient-to-r from-red-950 to-zinc-900 border border-red-700 rounded-xl p-3.5 text-center">
              <div className="text-[10px] uppercase tracking-wider text-red-300">MAZE BANK HORIZON</div>
              <div className="text-2xl font-bold font-['Chakra_Petch'] text-emerald-400 my-1">
                ${player.cash.toLocaleString()}
              </div>
              <div className="text-[10px] text-zinc-400">Account: 9482-****-3310</div>
            </div>

            <button
              onClick={() => {
                player.cash += 25000;
                sound.playCashSound();
              }}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-bold uppercase transition-colors"
            >
              Request Syndicate Wire ($25,000)
            </button>
          </div>
        )}

        {/* VEHICLE DELIVERY APP */}
        {currentApp === 'dealership' && (
          <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
            <div className="text-[10px] text-zinc-400 mb-1">Instant GPS Courier Delivery:</div>
            {[
              { type: 'supercar', name: 'Pegassi Apex GT', cost: 0, tag: 'Supercar' },
              { type: 'muscle', name: 'Vapid Dominator', cost: 0, tag: 'Muscle' },
              { type: 'motorcycle', name: 'Shitzu Hakuchou', cost: 0, tag: 'Bike' },
              { type: 'helicopter', name: 'Western Maverick', cost: 0, tag: 'Helicopter' },
            ].map((v) => (
              <button
                key={v.type}
                onClick={() => {
                  onSpawnVehicle(v.type as any);
                  sound.playCashSound();
                  onClose();
                }}
                className="bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700 rounded-xl p-2.5 flex items-center justify-between text-left transition-colors"
              >
                <div>
                  <div className="text-xs font-bold text-white">{v.name}</div>
                  <span className="text-[10px] px-1.5 py-0.2 bg-zinc-900 text-amber-400 rounded">
                    {v.tag}
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-400">SPAWN</span>
              </button>
            ))}
          </div>
        )}

        {/* QUICK CHEATS / HACKS */}
        {currentApp === 'cheats' && (
          <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
            <button
              onClick={() => {
                police.clearWanted();
                sound.playMissionPassSound();
              }}
              className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 p-2.5 rounded-xl text-left"
            >
              <div className="text-xs font-bold text-amber-400">Clear Wanted Level</div>
              <div className="text-[10px] text-zinc-400">Dismiss all police pursuit instantly</div>
            </button>

            <button
              onClick={() => {
                player.health = player.maxHealth;
                player.armor = player.maxArmor;
                sound.playMissionPassSound();
              }}
              className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 p-2.5 rounded-xl text-left"
            >
              <div className="text-xs font-bold text-emerald-400">Max Health & Armor</div>
              <div className="text-[10px] text-zinc-400">Refill full body armor and vitality</div>
            </button>

            <button
              onClick={() => {
                player.weapons.forEach((w) => (w.ammo = w.maxAmmo));
                sound.playMissionPassSound();
              }}
              className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 p-2.5 rounded-xl text-left"
            >
              <div className="text-xs font-bold text-blue-400">Max Ammo All Weapons</div>
              <div className="text-[10px] text-zinc-400">Top off magazines and reserves</div>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Home Pill Button */}
      <div className="bg-black py-2.5 flex items-center justify-center border-t border-zinc-900">
        <button
          onClick={() => {
            setCurrentApp('home');
            sound.playUIClick();
          }}
          className="w-24 h-1.5 bg-zinc-600 hover:bg-zinc-400 rounded-full transition-colors"
        />
      </div>
    </div>
  );
};
