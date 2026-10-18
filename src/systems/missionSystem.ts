/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { Mission } from '../types/game';
import { sound } from '../audio/soundEngine';

export const STORY_MISSIONS: Mission[] = [
  {
    id: 'm1_getaway',
    title: 'The Grand Getaway',
    giver: 'Marcus Bell',
    description: 'The heat is swarming downtown after the jewelry heist. Steal the orange Pegassi Apex, lose the cops, and stash the car in the safehouse garage!',
    rewardCash: 5000,
    rewardRep: 250,
    currentObjectiveIndex: 0,
    isCompleted: false,
    isFailed: false,
    cutsceneText: [
      'MARCUS: Jax! The downtown alarms tripped early. The cops have set up a perimeter!',
      'JAX: I see the Pegassi Apex down on the avenue. I am taking the wheel.',
      'MARCUS: Floor it and shake that 2-star tail. Do NOT lead them to the safehouse!',
    ],
    objectives: [
      {
        id: 'obj_steal_car',
        text: 'Locate and enter the Orange Pegassi Apex at the downtown avenue',
        targetPos: [-60, 1.2, 0],
        targetRadius: 10,
        type: 'steal_vehicle',
        completed: false,
      },
      {
        id: 'obj_lose_police',
        text: 'Lose the Police Heat (Evade the search radius)',
        type: 'escape_police',
        completed: false,
      },
      {
        id: 'obj_reach_safehouse',
        text: 'Deliver the vehicle into the Safehouse Garage',
        targetPos: [-180, 1.2, 14],
        targetRadius: 8,
        type: 'goto',
        completed: false,
      },
    ],
  },
  {
    id: 'm2_heli_drop',
    title: 'Skyline Transfer',
    giver: 'Leo Chen',
    description: 'Syndicate scouts are closing in on our ground routes. Take the Maverick helicopter from the Maze Tower helipad and deliver the briefcase to the ocean pier!',
    rewardCash: 12000,
    rewardRep: 400,
    currentObjectiveIndex: 0,
    isCompleted: false,
    isFailed: false,
    cutsceneText: [
      'LEO: Roadblocks are choking every freeway out of downtown.',
      'LEO: We have a Western Maverick waiting on top of Maze Horizon Tower.',
      'JAX: I am on my way up. Prepare the drop coordinates at the pier.',
    ],
    objectives: [
      {
        id: 'obj_heli_board',
        text: 'Board the Maverick Helicopter at the Downtown Helipad',
        targetPos: [0, 147.5, 0],
        targetRadius: 12,
        type: 'steal_vehicle',
        completed: false,
      },
      {
        id: 'obj_pier_drop',
        text: 'Fly over the skyline and touch down on the Ocean Beach Pier',
        targetPos: [220, 3.5, 40],
        targetRadius: 15,
        type: 'goto',
        completed: false,
      },
    ],
  },
  {
    id: 'm3_warehouse_raid',
    title: 'Port Syndicate Infiltration',
    giver: 'Jax Vance',
    description: 'A rival cartel seized our military weapons shipment in the industrial docks. Infiltrate the Port Warehouse, neutralize the guards, and reclaim the crate!',
    rewardCash: 25000,
    rewardRep: 750,
    currentObjectiveIndex: 0,
    isCompleted: false,
    isFailed: false,
    cutsceneText: [
      'JAX: Docks are crawling with armed cartel enforcers.',
      'MARCUS: Bring heavy firepower, Jax. They will not surrender quietly.',
      'JAX: Weapons free. Let us finish this.',
    ],
    objectives: [
      {
        id: 'obj_reach_dock',
        text: 'Travel to the Port Syndicate Warehouse',
        targetPos: [-240, 1.2, 190],
        targetRadius: 16,
        type: 'goto',
        completed: false,
      },
      {
        id: 'obj_eliminate_guards',
        text: 'Neutralize 5 Syndicate Enforcers',
        type: 'kill',
        currentCount: 0,
        requiredCount: 5,
        completed: false,
      },
      {
        id: 'obj_secure_crate',
        text: 'Secure the contraband military crate inside the warehouse',
        targetPos: [-240, 1.2, 205],
        targetRadius: 5,
        type: 'interact',
        completed: false,
      },
    ],
  },
];

export class MissionManager {
  public missions: Mission[] = JSON.parse(JSON.stringify(STORY_MISSIONS));
  public activeMissionIndex: number = 0;
  public onMissionSuccess?: (m: Mission) => void;

  public get currentMission(): Mission | null {
    if (this.activeMissionIndex >= this.missions.length) return null;
    return this.missions[this.activeMissionIndex];
  }

  public get currentObjective() {
    const m = this.currentMission;
    if (!m || m.isCompleted) return null;
    return m.objectives[m.currentObjectiveIndex];
  }

  public advanceObjective() {
    const m = this.currentMission;
    if (!m) return;

    const obj = m.objectives[m.currentObjectiveIndex];
    if (obj) obj.completed = true;

    m.currentObjectiveIndex++;
    sound.playMissionPassSound();

    if (m.currentObjectiveIndex >= m.objectives.length) {
      m.isCompleted = true;
      sound.playCashSound();
      if (this.onMissionSuccess) this.onMissionSuccess(m);
      this.activeMissionIndex++;
    }
  }

  public restartCurrentMission() {
    const m = this.currentMission;
    if (!m) return;
    m.currentObjectiveIndex = 0;
    m.isFailed = false;
    m.objectives.forEach((obj) => (obj.completed = false));
  }
}
