/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { RoadNode } from '../world/cityBuilder';
import { VehicleManager, VehicleEntity } from './vehicles';

export type NPCState = 'walking' | 'idle' | 'fleeing' | 'aggressive' | 'cowering';

export interface Pedestrian {
  mesh: THREE.Group;
  position: THREE.Vector3;
  targetPos: THREE.Vector3;
  speed: number;
  state: NPCState;
  health: number;
  rotationY: number;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  fleeTimer: number;
}

export interface TrafficCar {
  vehicle: VehicleEntity;
  currentNodeIndex: number;
  targetNodeIndex: number;
  speed: number;
  targetSpeed: number;
}

export class NPCSystem {
  public pedestrians: Pedestrian[] = [];
  public trafficCars: TrafficCar[] = [];

  private scene: THREE.Scene;
  private roadNodes: RoadNode[];
  private vehicleManager: VehicleManager;

  private pedPoolMax: number = 35;
  private trafficPoolMax: number = 14;

  constructor(scene: THREE.Scene, roadNodes: RoadNode[], vehicleManager: VehicleManager) {
    this.scene = scene;
    this.roadNodes = roadNodes;
    this.vehicleManager = vehicleManager;

    this.spawnInitialPedestrians();
    this.spawnInitialTraffic();
  }

  private createPedestrianMesh(colorHex: number): { mesh: THREE.Group; leftLeg: THREE.Group; rightLeg: THREE.Group } {
    const group = new THREE.Group();

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xdeb887, roughness: 0.8 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.7 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.28), shirtMat);
    torso.position.y = 1.1;
    torso.castShadow = true;
    group.add(torso);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), skinMat);
    head.position.y = 0.5;
    torso.add(head);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.18, 0.7, 0.2);

    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.14, 0.75, 0);
    const lLMesh = new THREE.Mesh(legGeo, pantsMat);
    lLMesh.position.y = -0.35;
    leftLeg.add(lLMesh);
    group.add(leftLeg);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.14, 0.75, 0);
    const rLMesh = new THREE.Mesh(legGeo, pantsMat);
    rLMesh.position.y = -0.35;
    rightLeg.add(rLMesh);
    group.add(rightLeg);

    return { mesh: group, leftLeg, rightLeg };
  }

  private spawnInitialPedestrians() {
    const colors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6, 0xec4899, 0x64748b];

    for (let i = 0; i < this.pedPoolMax; i++) {
      const node = this.roadNodes[Math.floor(Math.random() * this.roadNodes.length)];
      if (!node) continue;

      // Spawn on sidewalk offset
      const x = node.x + (Math.random() > 0.5 ? 12 : -12);
      const z = node.z + (Math.random() * 100 - 50);

      const color = colors[i % colors.length];
      const { mesh, leftLeg, rightLeg } = this.createPedestrianMesh(color);
      mesh.position.set(x, 0.95, z);
      this.scene.add(mesh);

      const ped: Pedestrian = {
        mesh,
        position: new THREE.Vector3(x, 0.95, z),
        targetPos: new THREE.Vector3(x, 0.95, z + (Math.random() > 0.5 ? 80 : -80)),
        speed: 1.6 + Math.random() * 0.6,
        state: 'walking',
        health: 50,
        rotationY: Math.random() * Math.PI * 2,
        leftLeg,
        rightLeg,
        fleeTimer: 0,
      };

      this.pedestrians.push(ped);
    }
  }

  private spawnInitialTraffic() {
    const types: ('supercar' | 'muscle' | 'suv')[] = ['supercar', 'muscle', 'suv'];
    const carColors = [0xd97706, 0x2563eb, 0xdc2626, 0x16a34a, 0x475569, 0xffffff, 0x111827];

    for (let i = 0; i < this.trafficPoolMax; i++) {
      const nodeA = this.roadNodes[i % this.roadNodes.length];
      if (!nodeA || nodeA.connected.length === 0) continue;
      const targetId = nodeA.connected[Math.floor(Math.random() * nodeA.connected.length)];
      const nodeB = this.roadNodes.find((n) => n.id === targetId);
      if (!nodeB) continue;

      const type = types[i % types.length];
      const color = carColors[i % carColors.length];

      // Position in lane
      const pos = new THREE.Vector3(nodeA.x + 3.5, 0.4, nodeA.z);
      const vehicle = this.vehicleManager.createVehicle(type, pos, color, false);
      vehicle.stats.isEngineOn = true;

      this.trafficCars.push({
        vehicle,
        currentNodeIndex: nodeA.id,
        targetNodeIndex: nodeB.id,
        speed: 12 + Math.random() * 6,
        targetSpeed: 15,
      });
    }
  }

  public triggerPanic(sourcePos: THREE.Vector3, radius: number = 35) {
    this.pedestrians.forEach((ped) => {
      const dist = ped.position.distanceTo(sourcePos);
      if (dist < radius) {
        ped.state = 'fleeing';
        ped.speed = 4.8;
        ped.fleeTimer = 8; // flee for 8 seconds

        // Flee in opposite direction
        const dir = ped.position.clone().sub(sourcePos).normalize();
        ped.targetPos.copy(ped.position).add(dir.multiplyScalar(60));
      }
    });
  }

  public update(delta: number, playerPos: THREE.Vector3) {
    // 1. Update Pedestrians
    this.pedestrians.forEach((ped) => {
      if (ped.health <= 0) return;

      if (ped.state === 'fleeing') {
        ped.fleeTimer -= delta;
        if (ped.fleeTimer <= 0) {
          ped.state = 'walking';
          ped.speed = 1.6;
        }
      }

      // Move toward target
      const dir = ped.targetPos.clone().sub(ped.position);
      dir.y = 0;
      const dist = dir.length();

      if (dist < 2.0) {
        // Pick new sidewalk destination
        ped.targetPos.set(
          ped.position.x + (Math.random() * 80 - 40),
          ped.position.y,
          ped.position.z + (Math.random() * 80 - 40)
        );
      } else {
        dir.normalize();
        ped.position.addScaledVector(dir, ped.speed * delta);
        ped.rotationY = Math.atan2(dir.x, dir.z);
      }

      ped.mesh.position.copy(ped.position);
      ped.mesh.rotation.y = ped.rotationY;

      // Leg swing animation
      const swing = Math.sin(performance.now() * 0.008 * (ped.speed > 3 ? 2 : 1)) * 0.5;
      ped.leftLeg.rotation.x = swing;
      ped.rightLeg.rotation.x = -swing;
    });

    // 2. Update AI Traffic Cars
    this.trafficCars.forEach((tc) => {
      if (tc.vehicle.isPlayerDriven) return;

      const targetNode = this.roadNodes.find((n) => n.id === tc.targetNodeIndex);
      if (!targetNode) return;

      const targetVec = new THREE.Vector3(targetNode.x + 3.5, 0.4, targetNode.z);
      const dir = targetVec.clone().sub(tc.vehicle.mesh.position);
      dir.y = 0;
      const dist = dir.length();

      if (dist < 6.0) {
        // Pick next road waypoint
        tc.currentNodeIndex = targetNode.id;
        if (targetNode.connected.length > 0) {
          const nextId = targetNode.connected[Math.floor(Math.random() * targetNode.connected.length)];
          tc.targetNodeIndex = nextId;
        }
      } else {
        dir.normalize();
        tc.vehicle.speed = tc.speed;
        tc.vehicle.mesh.position.addScaledVector(dir, tc.speed * delta);

        const targetRotY = Math.atan2(dir.x, dir.z);
        tc.vehicle.mesh.rotation.y = targetRotY;
      }
    });
  }
}
