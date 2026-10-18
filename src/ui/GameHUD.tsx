/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { Player, CHARACTERS } from '../entities/player';
import { MissionManager } from '../systems/missionSystem';
import { PoliceSystem } from '../systems/policeSystem';
import { WeatherSystem } from '../systems/weatherSystem';
import { sound } from '../audio/soundEngine';
import { Shield, Crosshair, Radio, Smartphone as PhoneIcon, Navigation, Car, AlertTriangle } from 'lucide-react';

interface GameHUDProps {
  player: Player;
  police: PoliceSystem;
  missionManager: MissionManager;
  weather: WeatherSystem;
  onOpenPhone: () => void;
  onOpenMap: () => void;
  onOpenCharacterWheel: () => void;
  onNextRadio: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  player,
  police,
  missionManager,
  weather,
  onOpenPhone,
  onOpenMap,
  onOpenCharacterWheel,
  onNextRadio,
}) => {
  const radarCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Radar drawing loop
  useEffect(() => {
    let animId: number;
    const canvas = radarCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderRadar = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = canvas.width / 2 - 8;

      // Circular Radar Background & Clip
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();

      // Dark Radar Grid
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Radar range scale: 1 world unit = 0.45 canvas pixels
      const scale = 0.45;
      const pX = player.position.x;
      const pZ = player.position.z;

      // Draw road grid lines relative to player
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 4;
      const gridX = [-240, -120, 0, 120];
      const gridZ = [-240, -120, 0, 120, 240];

      gridX.forEach((rx) => {
        const sx = cx + (rx - pX) * scale;
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, canvas.height);
        ctx.stroke();
      });

      gridZ.forEach((rz) => {
        const sy = cy + (rz - pZ) * scale;
        ctx.beginPath();
        ctx.moveTo(0, sy);
        ctx.lineTo(canvas.width, sy);
        ctx.stroke();
      });

      // Ocean water boundary on East side
      const waterX = cx + (650 - pX) * scale;
      if (waterX < canvas.width) {
        ctx.fillStyle = 'rgba(2, 132, 199, 0.35)';
        ctx.fillRect(waterX, 0, canvas.width - waterX, canvas.height);
      }

      // Draw Police Blips (Flashing Red/Blue)
      if (police.wantedStars > 0) {
        const flash = Math.sin(performance.now() * 0.01) > 0;
        police.policeCruisers.forEach((c) => {
          const bx = cx + (c.mesh.position.x - pX) * scale;
          const by = cy + (c.mesh.position.z - pZ) * scale;
          ctx.fillStyle = flash ? '#ef4444' : '#3b82f6';
          ctx.beginPath();
          ctx.arc(bx, by, 5, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Draw Mission Objective Blip (Gold Star / Waypoint)
      const obj = missionManager.currentObjective;
      if (obj && obj.targetPos) {
        const ox = cx + (obj.targetPos[0] - pX) * scale;
        const oy = cy + (obj.targetPos[2] - pZ) * scale;

        // Draw pulsing gold waypoint
        const pulse = 6 + Math.sin(performance.now() * 0.006) * 2;
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(ox, oy, pulse, 0, Math.PI * 2);
        ctx.fill();

        // Draw GPS route line from player to target
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ox, oy);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore();

      // Outer Radar Bezel
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Health Meter (Green Arc on Left Side)
      const healthPct = Math.max(0, Math.min(1, player.health / player.maxHealth));
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 2, Math.PI * 0.75, Math.PI * 0.75 + healthPct * Math.PI * 0.75);
      ctx.stroke();

      // Armor Meter (Blue Arc on Right Side)
      const armorPct = Math.max(0, Math.min(1, player.armor / player.maxArmor));
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 2, Math.PI * 0.25 - armorPct * Math.PI * 0.75, Math.PI * 0.25);
      ctx.stroke();

      // Player Arrow in Center
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(player.rotationY);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(6, 7);
      ctx.lineTo(0, 4);
      ctx.lineTo(-6, 7);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      animId = requestAnimationFrame(renderRadar);
    };

    animId = requestAnimationFrame(renderRadar);
    return () => cancelAnimationFrame(animId);
  }, [player, police, missionManager]);

  const activeChar = CHARACTERS[player.characterId];
  const currentWeapon = player.currentWeapon;
  const currentVehicle = player.currentVehicle;
  const mission = missionManager.currentMission;
  const objective = missionManager.currentObjective;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden font-['Inter',sans-serif]">
      {/* Dynamic Crosshair (Center) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none opacity-75">
        {player.isAiming ? (
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]" />
            <div className="absolute top-0 w-0.5 h-2 bg-white/80" />
            <div className="absolute bottom-0 w-0.5 h-2 bg-white/80" />
            <div className="absolute left-0 w-2 h-0.5 bg-white/80" />
            <div className="absolute right-0 w-2 h-0.5 bg-white/80" />
          </div>
        ) : (
          <div className="w-1.5 h-1.5 bg-white/60 rounded-full" />
        )}
      </div>

      {/* TOP-RIGHT: STATUS CLUSTER (Cash, Character Badge, Weapon, Clock) */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-2.5 pointer-events-auto">
        {/* Cash Readout */}
        <div className="bg-black/75 border border-zinc-700/80 rounded-md px-3.5 py-1.5 shadow-lg flex items-center gap-2">
          <span className="text-emerald-400 font-bold font-['Chakra_Petch'] text-2xl tracking-wider tabular-nums">
            ${player.cash.toLocaleString()}
          </span>
        </div>

        {/* Time & Weather */}
        <div className="bg-black/60 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-300 font-mono flex items-center gap-2">
          <span>{weather.getFormattedTime()}</span>
          <span className="text-zinc-500">|</span>
          <span className="capitalize text-amber-300">{weather.currentWeather}</span>
        </div>

        {/* Character Switch & Profile Badge */}
        <button
          onClick={onOpenCharacterWheel}
          title="Switch Character (F key)"
          className="bg-black/80 hover:bg-zinc-800 border-2 rounded-lg p-2 flex items-center gap-3 transition-colors shadow-md"
          style={{ borderColor: activeChar.color }}
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-lg text-black" style={{ backgroundColor: activeChar.color }}>
            {activeChar.name[0]}
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-white tracking-wide uppercase">{activeChar.name}</div>
            <div className="text-[10px] text-zinc-400">{activeChar.alias}</div>
          </div>
          <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-700">F</span>
        </button>

        {/* Active Weapon Ammo HUD */}
        <div className="bg-black/75 border border-zinc-700 rounded-md px-3 py-2 flex items-center gap-3">
          <div className="text-amber-400 font-bold text-sm tracking-wide">{currentWeapon.name}</div>
          <div className="text-zinc-400 font-mono text-sm">
            {currentWeapon.id === 'fists' ? (
              <span className="text-emerald-400 font-bold">READY</span>
            ) : (
              <span className="tabular-nums">
                <span className="text-white font-bold text-base">{currentWeapon.currentMag}</span> / {currentWeapon.ammo}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* TOP-LEFT: ACTIVE MISSION TRACKER */}
      {mission && !mission.isCompleted && (
        <div className="absolute top-4 left-4 max-w-sm pointer-events-auto">
          <div className="bg-black/85 border-l-4 border-l-amber-500 border border-zinc-800 rounded-r-lg p-3.5 shadow-xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                Story Mission
              </span>
              <span className="text-xs font-bold text-zinc-200">{mission.giver}</span>
            </div>
            <div className="text-base font-bold text-white mb-1">{mission.title}</div>
            {objective && (
              <div className="text-xs text-amber-200/90 leading-snug flex items-start gap-1.5">
                <span className="text-amber-400 font-bold">▶</span>
                <span>{objective.text}</span>
              </div>
            )}
            <div className="mt-2 text-[11px] text-zinc-400">Reward: ${mission.rewardCash.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* BOTTOM-LEFT: GTA-STYLE RADAR / MINIMAP & WANTED STARS */}
      <div className="absolute bottom-6 left-6 flex flex-col items-start gap-2 pointer-events-auto">
        {/* Wanted Stars (1 to 5) */}
        {police.wantedStars > 0 && (
          <div className="bg-black/85 border border-red-900 rounded-md px-3 py-1 flex items-center gap-1.5 shadow-lg animate-pulse">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-lg font-black ${
                    star <= police.wantedStars ? 'text-red-500' : 'text-zinc-700'
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            {police.isEvading && (
              <span className="text-[10px] text-zinc-300 font-mono ml-2">
                EVADING: {Math.ceil(police.evadeTimer)}s
              </span>
            )}
          </div>
        )}

        {/* Radar Circular Canvas with Health/Armor Arcs */}
        <div className="relative group cursor-pointer" onClick={onOpenMap} title="Click to open Full World Map (M key)">
          <canvas
            ref={radarCanvasRef}
            width={160}
            height={160}
            className="rounded-full shadow-2xl bg-black/80 border border-zinc-700/60"
          />
          <div className="absolute bottom-1 right-1 text-[9px] font-bold text-zinc-400 bg-black/70 px-1.5 py-0.5 rounded border border-zinc-700">
            MAP (P)
          </div>
        </div>
      </div>

      {/* BOTTOM-RIGHT: VEHICLE SPEEDOMETER & RADIO BANNER */}
      {currentVehicle && (
        <div className="absolute bottom-6 right-6 flex flex-col items-end gap-2 pointer-events-auto">
          {/* Radio Station Banner */}
          <button
            onClick={onNextRadio}
            className="bg-black/80 hover:bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-md flex items-center gap-2 text-xs text-amber-300 transition-colors shadow"
          >
            <Radio className="w-3.5 h-3.5 text-amber-400" />
            <span>Radio: <strong className="uppercase text-white">{currentVehicle.activeRadio || 'Synthwave FM'}</strong></span>
            <span className="text-[10px] text-zinc-500">(R)</span>
          </button>

          {/* Speedometer Cluster */}
          <div className="bg-black/85 border border-zinc-800 rounded-xl p-4 flex items-center gap-4 shadow-2xl">
            <div className="flex flex-col items-center">
              <span className="text-4xl font-extrabold text-white font-['Teko'] tracking-wider leading-none tabular-nums">
                {Math.floor(Math.abs(currentVehicle.speed) * 2.237)}
              </span>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">MPH</span>
            </div>
            <div className="h-10 w-px bg-zinc-800" />
            <div>
              <div className="text-xs font-bold text-zinc-300">{currentVehicle.stats.name}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-400 border border-zinc-700 font-mono">
                  HP {Math.floor(currentVehicle.stats.health / 10)}%
                </span>
                <span className="text-[10px] text-zinc-400">Headlights: ON</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK FLOATING HOTKEY DOCK (Collapsible & Viewport First) */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/80 border border-zinc-800 px-3.5 py-1.5 rounded-full pointer-events-auto text-[11px] text-zinc-300 shadow-xl backdrop-blur-none">
        <button
          onClick={onOpenPhone}
          className="hover:text-amber-400 flex items-center gap-1.5 transition-colors px-2 py-0.5"
        >
          <PhoneIcon className="w-3.5 h-3.5 text-amber-400" />
          <span>Phone (M)</span>
        </button>
        <span className="text-zinc-600">|</span>
        <button
          onClick={onOpenMap}
          className="hover:text-amber-400 flex items-center gap-1.5 transition-colors px-2 py-0.5"
        >
          <Navigation className="w-3.5 h-3.5 text-blue-400" />
          <span>GPS Map (P)</span>
        </button>
        <span className="text-zinc-600">|</span>
        <span className="text-zinc-400">
          WASD Move · Space Jump/Brake · E Enter/Exit · LMB Shoot · RMB Aim
        </span>
      </div>
    </div>
  );
};
