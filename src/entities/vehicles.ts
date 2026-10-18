/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { VehicleType, VehicleStats } from '../types/game';
import { materials } from '../rendering/materials';
import { sound } from '../audio/soundEngine';

export interface VehicleEntity {
  mesh: THREE.Group;
  stats: VehicleStats;
  velocity: THREE.Vector3;
  speed: number; // m/s
  steerAngle: number;
  engineRpm: number;
  wheels: THREE.Mesh[];
  frontWheelPivots: THREE.Group[];
  rotors?: THREE.Mesh[]; // for helicopter
  headlights: THREE.SpotLight[];
  damageSmoke?: THREE.Points;
  isPlayerDriven: boolean;
  activeRadio: string | null;
}

export class VehicleManager {
  public vehicles: VehicleEntity[] = [];
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public createVehicle(
    type: VehicleType,
    position: THREE.Vector3,
    colorHex: number = 0xd97706,
    isPolice: boolean = false
  ): VehicleEntity {
    const group = new THREE.Group();
    group.position.copy(position);

    const wheels: THREE.Mesh[] = [];
    const frontWheelPivots: THREE.Group[] = [];
    const rotors: THREE.Mesh[] = [];
    const headlights: THREE.SpotLight[] = [];

    // Base PBR vehicle paint material
    const paintMat = new THREE.MeshStandardMaterial({
      color: isPolice ? 0x111827 : colorHex,
      metalness: 0.85,
      roughness: 0.2,
    });

    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.15,
    });

    const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.35, 16);
    wheelGeo.rotateZ(Math.PI / 2);

    if (type === 'helicopter') {
      // ================= HELICOPTER (Composite 6-part) =================
      // 1. Cockpit & Fuselage
      const fuselageGeo = new THREE.SphereGeometry(1.6, 16, 12);
      fuselageGeo.scale(1.2, 1.1, 2.4);
      const fuselage = new THREE.Mesh(fuselageGeo, paintMat);
      fuselage.position.y = 1.8;
      fuselage.castShadow = true;
      group.add(fuselage);

      // 2. Cockpit bubble glass
      const glassGeo = new THREE.SphereGeometry(1.3, 16, 12);
      glassGeo.scale(1.1, 1.0, 1.4);
      const glass = new THREE.Mesh(glassGeo, materials.glass);
      glass.position.set(0, 2.0, 1.1);
      group.add(glass);

      // 3. Tail Boom
      const boomGeo = new THREE.CylinderGeometry(0.2, 0.5, 5, 8);
      boomGeo.rotateX(Math.PI / 2);
      const boom = new THREE.Mesh(boomGeo, trimMat);
      boom.position.set(0, 2.2, -3.8);
      boom.castShadow = true;
      group.add(boom);

      // 4. Landing Skids
      const skidGeo = new THREE.CylinderGeometry(0.08, 0.08, 4.2, 8);
      skidGeo.rotateX(Math.PI / 2);
      const skidL = new THREE.Mesh(skidGeo, materials.chrome);
      skidL.position.set(-1.1, 0.3, 0);
      const skidR = new THREE.Mesh(skidGeo, materials.chrome);
      skidR.position.set(1.1, 0.3, 0);
      group.add(skidL, skidR);

      // 5. Main Rotor Blades
      const mainRotorHub = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.4, 8), materials.chrome);
      mainRotorHub.position.set(0, 3.4, 0);
      const bladeGeo = new THREE.BoxGeometry(0.3, 0.04, 7.5);
      const mainBlade1 = new THREE.Mesh(bladeGeo, trimMat);
      mainBlade1.position.y = 0.2;
      mainRotorHub.add(mainBlade1);
      group.add(mainRotorHub);
      rotors.push(mainRotorHub);

      // 6. Tail Rotor
      const tailRotor = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.4, 0.15), trimMat);
      tailRotor.position.set(0.3, 2.4, -6.2);
      group.add(tailRotor);
      rotors.push(tailRotor);
    } else if (type === 'motorcycle') {
      // ================= MOTORCYCLE (Composite 6-part) =================
      const frameGeo = new THREE.BoxGeometry(0.5, 0.7, 1.8);
      const frame = new THREE.Mesh(frameGeo, paintMat);
      frame.position.y = 0.8;
      group.add(frame);

      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.7), materials.tire);
      seat.position.set(0, 1.1, -0.2);
      group.add(seat);

      // Front & rear wheels
      const fWheelPivot = new THREE.Group();
      fWheelPivot.position.set(0, 0.45, 0.9);
      const fWheel = new THREE.Mesh(wheelGeo, materials.tire);
      fWheelPivot.add(fWheel);
      group.add(fWheelPivot);
      frontWheelPivots.push(fWheelPivot);
      wheels.push(fWheel);

      const rWheel = new THREE.Mesh(wheelGeo, materials.tire);
      rWheel.position.set(0, 0.45, -0.9);
      group.add(rWheel);
      wheels.push(rWheel);
    } else {
      // ================= CARS (Supercar, Muscle, Police, SUV) =================
      const isSuper = type === 'supercar';
      const isSUV = type === 'suv';

      const bodyLength = isSuper ? 4.5 : isSUV ? 4.8 : 4.4;
      const bodyWidth = isSuper ? 2.1 : isSUV ? 2.2 : 2.0;
      const bodyHeight = isSuper ? 0.75 : isSUV ? 1.4 : 0.95;

      // 1. Lower Chassis
      const chassisGeo = new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyLength);
      const chassis = new THREE.Mesh(chassisGeo, paintMat);
      chassis.position.y = 0.55 + bodyHeight / 2;
      chassis.castShadow = true;
      group.add(chassis);

      // 2. Cabin / Greenhouse & Glass
      const cabinWidth = bodyWidth * 0.82;
      const cabinHeight = isSuper ? 0.55 : isSUV ? 0.85 : 0.65;
      const cabinLength = bodyLength * 0.55;
      const cabinGeo = new THREE.BoxGeometry(cabinWidth, cabinHeight, cabinLength);
      const cabin = new THREE.Mesh(cabinGeo, materials.glass);
      cabin.position.set(0, chassis.position.y + bodyHeight / 2 + cabinHeight / 2, -0.2);
      cabin.castShadow = true;
      group.add(cabin);

      // 3. Hood & Front Splitter
      const splitterGeo = new THREE.BoxGeometry(bodyWidth + 0.1, 0.15, 0.4);
      const splitter = new THREE.Mesh(splitterGeo, trimMat);
      splitter.position.set(0, 0.35, bodyLength / 2 + 0.15);
      group.add(splitter);

      // 4. Rear Spoiler (for Supercar)
      if (isSuper) {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(bodyWidth * 0.9, 0.08, 0.4), trimMat);
        wing.position.set(0, chassis.position.y + 0.65, -bodyLength / 2);
        group.add(wing);
      }

      // 5. Police Cruiser Lightbar
      if (isPolice || type === 'police') {
        const lightbarGeo = new THREE.BoxGeometry(1.4, 0.2, 0.35);
        const lightbar = new THREE.Mesh(lightbarGeo, trimMat);
        lightbar.position.set(0, cabin.position.y + cabinHeight / 2 + 0.15, -0.2);

        const sirenBlue = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.18, 0.3), materials.copBlue);
        sirenBlue.position.set(-0.35, 0, 0);
        const sirenRed = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.18, 0.3), materials.copRed);
        sirenRed.position.set(0.35, 0, 0);
        lightbar.add(sirenBlue, sirenRed);
        group.add(lightbar);
      }

      // 6. Headlights & Taillights
      const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.1), materials.headlight);
      hlL.position.set(-bodyWidth / 2 + 0.35, chassis.position.y + 0.1, bodyLength / 2 + 0.02);
      const hlR = hlL.clone();
      hlR.position.x = bodyWidth / 2 - 0.35;
      group.add(hlL, hlR);

      // Front Spotlights
      const spotL = new THREE.SpotLight(0xffffff, 3.5, 45, Math.PI / 6, 0.4);
      spotL.position.copy(hlL.position);
      spotL.target.position.set(hlL.position.x, 0, hlL.position.z + 20);
      group.add(spotL, spotL.target);
      headlights.push(spotL);

      const spotR = new THREE.SpotLight(0xffffff, 3.5, 45, Math.PI / 6, 0.4);
      spotR.position.copy(hlR.position);
      spotR.target.position.set(hlR.position.x, 0, hlR.position.z + 20);
      group.add(spotR, spotR.target);
      headlights.push(spotR);

      // Taillights
      const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.18, 0.1), materials.taillight);
      tlL.position.set(-bodyWidth / 2 + 0.35, chassis.position.y + 0.1, -bodyLength / 2 - 0.02);
      const tlR = tlL.clone();
      tlR.position.x = bodyWidth / 2 - 0.35;
      group.add(tlL, tlR);

      // 7. Four Wheels with Pivots for front steering
      const wheelOffsets = [
        { x: -bodyWidth / 2 - 0.05, z: bodyLength / 2 - 0.85, isFront: true },
        { x: bodyWidth / 2 + 0.05, z: bodyLength / 2 - 0.85, isFront: true },
        { x: -bodyWidth / 2 - 0.05, z: -bodyLength / 2 + 0.85, isFront: false },
        { x: bodyWidth / 2 + 0.05, z: -bodyLength / 2 + 0.85, isFront: false },
      ];

      wheelOffsets.forEach((pos) => {
        const wheel = new THREE.Mesh(wheelGeo, materials.tire);
        wheel.castShadow = true;
        if (pos.isFront) {
          const pivot = new THREE.Group();
          pivot.position.set(pos.x, 0.45, pos.z);
          wheel.position.set(0, 0, 0);
          pivot.add(wheel);
          group.add(pivot);
          frontWheelPivots.push(pivot);
        } else {
          wheel.position.set(pos.x, 0.45, pos.z);
          group.add(wheel);
        }
        wheels.push(wheel);
      });
    }

    this.scene.add(group);

    const stats: VehicleStats = {
      id: `veh_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type,
      name:
        type === 'supercar'
          ? 'Pegassi Apex GT'
          : type === 'muscle'
          ? 'Vapid Dominator'
          : type === 'police'
          ? 'Vapid Stanier Police Cruiser'
          : type === 'helicopter'
          ? 'Western Maverick Heli'
          : type === 'motorcycle'
          ? 'Shitzu Hakuchou'
          : 'Brute Ranger SUV',
      topSpeed: type === 'supercar' ? 62 : type === 'helicopter' ? 50 : type === 'police' ? 54 : 45,
      acceleration: type === 'supercar' ? 32 : type === 'police' ? 26 : 22,
      handling: type === 'supercar' ? 3.4 : 2.6,
      braking: 35,
      health: 1000,
      maxHealth: 1000,
      color: `#${colorHex.toString(16).padStart(6, '0')}`,
      isLocked: false,
      isEngineOn: false,
      headlights: true,
      siren: isPolice,
    };

    const entity: VehicleEntity = {
      mesh: group,
      stats,
      velocity: new THREE.Vector3(),
      speed: 0,
      steerAngle: 0,
      engineRpm: 800,
      wheels,
      frontWheelPivots,
      rotors,
      headlights,
      isPlayerDriven: false,
      activeRadio: 'synthwave',
    };

    this.vehicles.push(entity);
    return entity;
  }

  public update(delta: number) {
    this.vehicles.forEach((v) => {
      // Helicopter rotor blade spinning
      if (v.rotors && v.rotors.length > 0) {
        v.rotors[0].rotation.y += (v.stats.isEngineOn ? 32 : 2) * delta;
        if (v.rotors[1]) v.rotors[1].rotation.x += (v.stats.isEngineOn ? 40 : 2) * delta;
      }

      // Rotate wheels when driving
      if (v.speed !== 0) {
        const rollSpeed = (v.speed / 0.42) * delta;
        v.wheels.forEach((w) => {
          w.rotation.x += rollSpeed;
        });
      }

      // Steer front wheels smoothly
      v.frontWheelPivots.forEach((p) => {
        p.rotation.y = v.steerAngle;
      });

      // Flashing siren lightbars if police
      if (v.stats.siren && v.mesh) {
        const time = performance.now() * 0.008;
        const blueOn = Math.sin(time) > 0;
        materials.copBlue.color.setHex(blueOn ? 0x0088ff : 0x001144);
        materials.copRed.color.setHex(blueOn ? 0x330000 : 0xff0022);
      }
    });
  }

  public removeVehicle(v: VehicleEntity) {
    this.scene.remove(v.mesh);
    this.vehicles = this.vehicles.filter((item) => item !== v);
  }
}
