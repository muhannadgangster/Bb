/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { VehicleManager, VehicleEntity } from '../entities/vehicles';
import { sound } from '../audio/soundEngine';

export class PoliceSystem {
  public wantedStars: number = 0;
  public isEvading: boolean = false;
  public evadeTimer: number = 0;
  public maxEvadeTime: number = 18; // seconds to lose cops

  private scene: THREE.Scene;
  private vehicleManager: VehicleManager;
  public policeCruisers: VehicleEntity[] = [];
  public policeHeli: VehicleEntity | null = null;

  constructor(scene: THREE.Scene, vehicleManager: VehicleManager) {
    this.scene = scene;
    this.vehicleManager = vehicleManager;
  }

  public reportCrime(severity: 1 | 2 | 3 | 4 | 5) {
    const newStars = Math.min(5, Math.max(this.wantedStars, severity));
    if (newStars !== this.wantedStars) {
      this.wantedStars = newStars;
      sound.playWantedLevelAlert(this.wantedStars);
      this.isEvading = false;
      this.evadeTimer = this.maxEvadeTime;
      this.dispatchPolice();
    }
  }

  public clearWanted() {
    this.wantedStars = 0;
    this.isEvading = false;
    this.evadeTimer = 0;
    sound.updateSiren(false);

    // Remove active police vehicles
    this.policeCruisers.forEach((c) => this.vehicleManager.removeVehicle(c));
    this.policeCruisers = [];
    if (this.policeHeli) {
      this.vehicleManager.removeVehicle(this.policeHeli);
      this.policeHeli = null;
    }
  }

  private dispatchPolice() {
    sound.updateSiren(true);

    const neededCruisers = Math.min(this.wantedStars, 3);
    while (this.policeCruisers.length < neededCruisers) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 70 + Math.random() * 30;
      const spawnPos = new THREE.Vector3(Math.cos(angle) * dist, 0.5, Math.sin(angle) * dist);

      const cruiser = this.vehicleManager.createVehicle('police', spawnPos, 0x111827, true);
      cruiser.stats.isEngineOn = true;
      this.policeCruisers.push(cruiser);
    }

    // Spawn Police Helicopter at 4+ stars
    if (this.wantedStars >= 4 && !this.policeHeli) {
      const heliPos = new THREE.Vector3(0, 45, 0);
      this.policeHeli = this.vehicleManager.createVehicle('helicopter', heliPos, 0x111827, true);
      this.policeHeli.stats.isEngineOn = true;
    }
  }

  public update(delta: number, playerPos: THREE.Vector3) {
    if (this.wantedStars === 0) return;

    let canSeePlayer = false;

    // Update cruisers pursuing player
    this.policeCruisers.forEach((cruiser) => {
      const dir = playerPos.clone().sub(cruiser.mesh.position);
      dir.y = 0;
      const dist = dir.length();

      if (dist < 60) {
        canSeePlayer = true;
      }

      if (dist > 3) {
        dir.normalize();
        const chaseSpeed = 24 + this.wantedStars * 3;
        cruiser.mesh.position.addScaledVector(dir, chaseSpeed * delta);
        cruiser.mesh.rotation.y = Math.atan2(dir.x, dir.z);
        cruiser.speed = chaseSpeed;
      }
    });

    // Update Police Helicopter
    if (this.policeHeli) {
      const heliTarget = playerPos.clone();
      heliTarget.y = 42; // maintain altitude above player

      const heliDir = heliTarget.sub(this.policeHeli.mesh.position);
      const heliDist = heliDir.length();

      if (heliDist < 80) {
        canSeePlayer = true;
      }

      if (heliDist > 5) {
        heliDir.normalize();
        this.policeHeli.mesh.position.addScaledVector(heliDir, 28 * delta);
        this.policeHeli.mesh.rotation.y = Math.atan2(heliDir.x, heliDir.z);
      }
    }

    // Evade cooldown logic
    if (!canSeePlayer) {
      this.isEvading = true;
      this.evadeTimer -= delta;

      if (this.evadeTimer <= 0) {
        // Successfully escaped police!
        this.clearWanted();
        sound.playMissionPassSound();
      }
    } else {
      this.isEvading = false;
      this.evadeTimer = this.maxEvadeTime;
    }
  }
}
