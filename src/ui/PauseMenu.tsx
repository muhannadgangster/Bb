/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Player } from '../entities/player';
import { MissionManager } from '../systems/missionSystem';
import { WeatherSystem } from '../systems/weatherSystem';
import { sound } from '../audio/soundEngine';
import { MapPin, Target, Settings, Trophy, HelpCircle, Save, Play, Volume2, VolumeX, Sun, CloudRain } from 'lucide-react';

interface PauseMenuProps {
  player: Player;
  missionManager: MissionManager;
  weather: WeatherSystem;
  onResume: () => void;
  onSave: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  player,
  missionManager,
  weather,
  onResume,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'map' | 'missions' | 'stats' | 'settings' | 'controls'>('map');
  const [saveToast, setSaveToast] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const handleSave = () => {
    onSave();
    sound.playMissionPassSound();
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col text-white font-['Inter',sans-serif]">
      {/* Top Header Bar */}
      <div className="bg-zinc-950 border-b border-zinc-800 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="font-['Chakra_Petch'] text-2xl font-black tracking-wider text-amber-500">
            VICE HORIZON
          </div>

          <div className="flex items-center gap-2">
            {[
              { id: 'map', label: 'MAP', icon: MapPin },
              { id: 'missions', label: 'BRIEF / MISSIONS', icon: Target },
              { id: 'stats', label: 'CAREER STATS', icon: Trophy },
              { id: 'settings', label: 'SETTINGS', icon: Settings },
              { id: 'controls', label: 'CONTROLS', icon: HelpCircle },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    sound.playUIClick();
                  }}
                  className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors ${
                    activeTab === tab.id
                      ? 'bg-amber-500 text-black shadow-lg'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-xs font-bold uppercase flex items-center gap-2 text-emerald-400 transition-colors"
          >
            <Save className="w-4 h-4" /> Save Game
          </button>
          <button
            onClick={onResume}
            className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded text-xs uppercase tracking-wider flex items-center gap-2 transition-colors shadow-lg"
          >
            <Play className="w-4 h-4 fill-current" /> Resume Game (ESC)
          </button>
        </div>
      </div>

      {/* Save Toast Notification */}
      {saveToast && (
        <div className="absolute top-20 right-8 bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded shadow-2xl flex items-center gap-2 animate-in fade-in">
          ✓ PROGRESS SAVED TO LOCAL STORAGE
        </div>
      )}

      {/* Main Tab Content */}
      <div className="flex-1 overflow-hidden p-6">
        {/* TAB 1: INTERACTIVE WORLD MAP */}
        {activeTab === 'map' && (
          <div className="w-full h-full bg-zinc-950 border border-zinc-800 rounded-xl relative overflow-hidden flex">
            {/* Map Canvas / Grid Graphic */}
            <div className="flex-1 relative bg-slate-950 flex items-center justify-center overflow-hidden">
              <svg className="w-full h-full" viewBox="-400 -400 800 800">
                {/* Ocean Background (East) */}
                <rect x="150" y="-400" width="250" height="800" fill="#082f49" opacity="0.6" />

                {/* City Terrain outline */}
                <rect x="-350" y="-350" width="500" height="700" fill="#090d16" stroke="#1e293b" strokeWidth="2" />

                {/* Hillside (North) */}
                <circle cx="-50" cy="-320" r="140" fill="#14532d" opacity="0.4" />
                <text x="-50" y="-315" fill="#facc15" fontSize="16" fontWeight="bold" textAnchor="middle">
                  VINEWOOD HILLS
                </text>

                {/* Road Network Lines */}
                {[-240, -120, 0, 120].map((rx) => (
                  <line key={`rx_${rx}`} x1={rx} y1="-300" x2={rx} y2="300" stroke="#334155" strokeWidth="6" />
                ))}
                {[-240, -120, 0, 120, 240].map((rz) => (
                  <line key={`rz_${rz}`} x1="-300" y1={rz} x2="150" y2={rz} stroke="#334155" strokeWidth="6" />
                ))}

                {/* Highway Overpass */}
                <line x1="-60" y1="-300" x2="-60" y2="300" stroke="#475569" strokeWidth="10" strokeDasharray="6,4" />

                {/* Del Perro Beach Pier */}
                <rect x="220" y="-40" width="30" height="130" fill="#78350f" rx="4" />
                <circle cx="235" cy="70" r="16" fill="none" stroke="#38bdf8" strokeWidth="3" />
                <text x="260" y="-20" fill="#38bdf8" fontSize="12" fontWeight="bold">
                  DEL PERRO PIER
                </text>

                {/* Harbor Cranes & Docks */}
                <rect x="-290" y="120" width="60" height="120" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
                <text x="-260" y="180" fill="#f59e0b" fontSize="11" fontWeight="bold" textAnchor="middle">
                  PORT HARBOR
                </text>

                {/* Safehouse Marker */}
                <circle cx="-180" cy="14" r="9" fill="#10b981" />
                <text x="-180" y="36" fill="#10b981" fontSize="11" fontWeight="bold" textAnchor="middle">
                  SAFEHOUSE
                </text>

                {/* Ammu-Nation Marker */}
                <circle cx="-60" cy="180" r="9" fill="#ef4444" />
                <text x="-60" y="202" fill="#ef4444" fontSize="11" fontWeight="bold" textAnchor="middle">
                  AMMU-NATION
                </text>

                {/* Central Maze Tower */}
                <rect x="-20" y="-20" width="40" height="40" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2" />
                <text x="0" y="5" fill="#c084fc" fontSize="11" fontWeight="bold" textAnchor="middle">
                  MAZE TOWER (HELIPAD)
                </text>

                {/* Mission Objective Waypoint if active */}
                {missionManager.currentObjective?.targetPos && (
                  <g>
                    <circle
                      cx={missionManager.currentObjective.targetPos[0]}
                      cy={missionManager.currentObjective.targetPos[2]}
                      r="14"
                      fill="#eab308"
                      className="animate-ping"
                    />
                    <circle
                      cx={missionManager.currentObjective.targetPos[0]}
                      cy={missionManager.currentObjective.targetPos[2]}
                      r="8"
                      fill="#fef08a"
                    />
                  </g>
                )}

                {/* Player Current Location Indicator */}
                <polygon
                  points={`${player.position.x},${player.position.z - 12} ${player.position.x + 8},${player.position.z + 10} ${player.position.x},${player.position.z + 5} ${player.position.x - 8},${player.position.z + 10}`}
                  fill="#ffffff"
                  stroke="#000000"
                  strokeWidth="2"
                />
              </svg>
            </div>

            {/* Map Legend Sidebar */}
            <div className="w-80 bg-zinc-900 border-l border-zinc-800 p-5 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">
                  WORLD LOCATIONS & ICONS
                </div>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 rounded-full bg-white border border-black" />
                    <span>Player Position</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 rounded-full bg-amber-400 animate-pulse" />
                    <span>Active Mission Objective</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-500" />
                    <span>Safehouse & Garage (Save Point)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 rounded-full bg-red-500" />
                    <span>Ammu-Nation Armory</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 rounded-full bg-purple-500" />
                    <span>Maze Tower Downtown Helipad</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 rounded-full bg-blue-400" />
                    <span>Del Perro Pier Boardwalk</span>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 text-[11px] text-zinc-400">
                <div className="font-bold text-white mb-1">GPS Navigation</div>
                Waypoints automatically sync with your mini-map radar and HUD route guide.
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MISSIONS */}
        {activeTab === 'missions' && (
          <div className="max-w-4xl mx-auto space-y-4 overflow-y-auto h-full pr-2">
            <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">
              Story Missions & Contracts
            </div>
            {missionManager.missions.map((m, idx) => (
              <div
                key={m.id}
                className={`border rounded-xl p-5 ${
                  m.isCompleted
                    ? 'bg-zinc-900/60 border-emerald-800/80'
                    : idx === missionManager.activeMissionIndex
                    ? 'bg-zinc-900 border-amber-500 shadow-xl'
                    : 'bg-zinc-950/60 border-zinc-800 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-zinc-800 text-amber-400">
                      Chapter {idx + 1}
                    </span>
                    <h3 className="text-lg font-bold text-white">{m.title}</h3>
                  </div>
                  <div className="text-xs font-bold text-emerald-400">${m.rewardCash.toLocaleString()}</div>
                </div>

                <div className="text-xs text-zinc-400 mb-3">{m.description}</div>

                <div className="space-y-1.5">
                  {m.objectives.map((obj, oIdx) => (
                    <div
                      key={obj.id}
                      className={`text-xs flex items-center gap-2 ${
                        obj.completed
                          ? 'text-emerald-400 line-through'
                          : oIdx === m.currentObjectiveIndex && idx === missionManager.activeMissionIndex
                          ? 'text-amber-300 font-semibold'
                          : 'text-zinc-500'
                      }`}
                    >
                      <span>{obj.completed ? '✓' : '○'}</span>
                      <span>{obj.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: CAREER STATS */}
        {activeTab === 'stats' && (
          <div className="max-w-3xl mx-auto grid grid-cols-2 gap-4">
            {[
              { label: 'Current Net Worth', value: `$${player.cash.toLocaleString()}` },
              { label: 'Active Character', value: player.characterId.toUpperCase() },
              { label: 'Missions Completed', value: `${missionManager.missions.filter((m) => m.isCompleted).length} / ${missionManager.missions.length}` },
              { label: 'Armory Arsenal', value: `${player.weapons.length} Weapons` },
              { label: 'Max Health / Armor', value: `${player.health} HP / ${player.armor} AP` },
              { label: 'City Time Elapsed', value: weather.getFormattedTime() },
            ].map((stat, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                <div className="text-xs text-zinc-400 mb-1">{stat.label}</div>
                <div className="text-2xl font-bold font-['Chakra_Petch'] text-amber-400">{stat.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400">Audio Configuration</h3>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-300">Master Sound FX & Web Audio Synthesizer</span>
                <button
                  onClick={handleToggleMute}
                  className="px-4 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-bold flex items-center gap-2"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                  {isMuted ? 'Muted' : 'Enabled'}
                </button>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400">Time of Day & Environment</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Morning (08:00)', time: 8, weather: 'sunny' },
                  { label: 'Sunset (18:30)', time: 18.5, weather: 'clear' },
                  { label: 'Midnight (00:00)', time: 0, weather: 'clear' },
                  { label: 'Thunderstorm', time: 15, weather: 'storm' },
                  { label: 'Dense Fog', time: 7, weather: 'fog' },
                  { label: 'Afternoon Rain', time: 16, weather: 'rain' },
                ].map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      weather.timeOfDay = preset.time;
                      weather.setWeather(preset.weather as any);
                      sound.playUIClick();
                    }}
                    className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-bold text-center border border-zinc-700 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CONTROLS */}
        {activeTab === 'controls' && (
          <div className="max-w-3xl mx-auto grid grid-cols-2 gap-4 text-xs">
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-2">On Foot Controls</h3>
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span className="text-zinc-400">Move Forward / Back / Strafe</span>
                <span className="font-mono font-bold text-white">W / A / S / D</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span className="text-zinc-400">Sprint</span>
                <span className="font-mono font-bold text-white">Left Shift</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span className="text-zinc-400">Jump</span>
                <span className="font-mono font-bold text-white">Space</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span className="text-zinc-400">Enter / Exit Vehicle</span>
                <span className="font-mono font-bold text-white">E</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span className="text-zinc-400">Aim Weapon</span>
                <span className="font-mono font-bold text-white">Right Mouse Button</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span className="text-zinc-400">Fire Weapon / Punch</span>
                <span className="font-mono font-bold text-white">Left Mouse Button</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span className="text-zinc-400">Reload Weapon</span>
                <span className="font-mono font-bold text-white">R</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-400">Switch Weapons</span>
                <span className="font-mono font-bold text-white">1, 2, 3, 4</span>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-2">Vehicle & General</h3>
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span className="text-zinc-400">Accelerate / Reverse</span>
                <span className="font-mono font-bold text-white">W / S</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span className="text-zinc-400">Steer Left / Right</span>
                <span className="font-mono font-bold text-white">A / D</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span className="text-zinc-400">Handbrake Drift</span>
                <span className="font-mono font-bold text-white">Space</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span className="text-zinc-400">Helicopter Ascend / Descend</span>
                <span className="font-mono font-bold text-white">Shift / Ctrl</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span className="text-zinc-400">Horn</span>
                <span className="font-mono font-bold text-white">H</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span className="text-zinc-400">Next Radio Station</span>
                <span className="font-mono font-bold text-white">R</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span className="text-zinc-400">Smartphone Toggle</span>
                <span className="font-mono font-bold text-white">M</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-400">Switch Character</span>
                <span className="font-mono font-bold text-white">F</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
