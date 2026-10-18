/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameMode = 'story' | 'sandbox';

export type WeatherType = 'clear' | 'sunny' | 'overcast' | 'rain' | 'storm' | 'fog';

export type CharacterId = 'jax' | 'marcus' | 'leo';

export interface CharacterProfile {
  id: CharacterId;
  name: string;
  alias: string;
  role: string;
  specialAbility: string;
  color: string;
  hairColor: string;
  clothingColor: string;
  stats: {
    stamina: number;
    shooting: number;
    driving: number;
    flying: number;
    strength: number;
  };
}

export interface Weapon {
  id: string;
  name: string;
  type: 'melee' | 'pistol' | 'smg' | 'rifle' | 'shotgun' | 'sniper';
  damage: number;
  fireRate: number; // shots per sec
  range: number;
  ammo: number;
  maxAmmo: number;
  magazineSize: number;
  currentMag: number;
  reloadTime: number; // seconds
  icon: string;
}

export type VehicleType = 'supercar' | 'muscle' | 'police' | 'suv' | 'motorcycle' | 'helicopter';

export interface VehicleStats {
  id: string;
  type: VehicleType;
  name: string;
  topSpeed: number;
  acceleration: number;
  handling: number;
  braking: number;
  health: number;
  maxHealth: number;
  color: string;
  isLocked: boolean;
  isEngineOn: boolean;
  headlights: boolean;
  siren?: boolean;
}

export interface MissionObjective {
  id: string;
  text: string;
  targetPos?: [number, number, number];
  targetRadius?: number;
  type: 'goto' | 'kill' | 'steal_vehicle' | 'escape_police' | 'race_checkpoint' | 'interact';
  completed: boolean;
  currentCount?: number;
  requiredCount?: number;
}

export interface Mission {
  id: string;
  title: string;
  giver: string;
  description: string;
  rewardCash: number;
  rewardRep: number;
  objectives: MissionObjective[];
  currentObjectiveIndex: number;
  isCompleted: boolean;
  isFailed: boolean;
  failureReason?: string;
  cutsceneText?: string[];
}

export interface RadioStation {
  id: string;
  name: string;
  genre: string;
  frequency: string;
}

export interface PhoneContact {
  id: string;
  name: string;
  avatar: string;
  status: string;
  phone: string;
  dialogue?: string;
}

export interface PhoneMessage {
  id: string;
  from: string;
  preview: string;
  body: string;
  timestamp: string;
  read: boolean;
}

export interface CityDistrict {
  id: string;
  name: string;
  center: [number, number];
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  description: string;
}
