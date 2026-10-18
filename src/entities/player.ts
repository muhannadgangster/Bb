/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { CharacterId, CharacterProfile, Weapon } from '../types/game';
import { materials } from '../rendering/materials';
import { VehicleEntity } from './vehicles';
import { sound } from '../audio/soundEngine';

export const CHARACTERS: Record<CharacterId, CharacterProfile> = {
  jax: {
    id: 'jax',
    name: 'Jax Vance',
    alias: 'The Ghost Operator',
    role: 'Ex-Military Tactician',
    specialAbility: 'Tactical Bullet-Time',
    color: '#38bdf8',
    hairColor: '#1e293b',
    clothingColor: '#334155',
    stats: { stamina: 85, shooting: 95, driving: 75, flying: 70, strength: 80 },
  },
  marcus: {
    id: 'marcus',
    name: 'Marcus Bell',
    alias: 'The Wheelman',
    role: 'Pro Getaway Driver',
    specialAbility: 'Precision Nitro Drift',
    color: '#f59e0b',
    hairColor: '#0f172a',
    clothingColor: '#dc2626',
    stats: { stamina: 90, shooting: 70, driving: 98, flying: 60, strength: 75 },
  },
  leo: {
    id: 'leo',
    name: 'Leo Chen',
    alias: 'The Wildcard',
    role: 'Syndicate Financier',
    specialAbility: 'Berserk Armor Surge',
    color: '#10b981',
    hairColor: '#475569',
    clothingColor: '#059669',
    stats: { stamina: 70, shooting: 85, driving: 80, flying: 90, strength: 95 },
  },
};

export const DEFAULT_WEAPONS: Weapon[] = [
  {
    id: 'fists',
    name: 'Unarmed',
    type: 'melee',
    damage: 25,
    fireRate: 2.2,
    range: 2.5,
    ammo: 999,
    maxAmmo: 999,
    magazineSize: 999,
    currentMag: 999,
    reloadTime: 0,
    icon: 'punch',
  },
  {
    id: 'pistol',
    name: 'Combat Pistol 9mm',
    type: 'pistol',
    damage: 38,
    fireRate: 3.5,
    range: 45,
    ammo: 120,
    maxAmmo: 250,
    magazineSize: 12,
    currentMag: 12,
    reloadTime: 1.2,
    icon: 'gun',
  },
  {
    id: 'smg',
    name: 'Micro SMG .45',
    type: 'smg',
    damage: 28,
    fireRate: 11.0,
    range: 35,
    ammo: 240,
    maxAmmo: 400,
    magazineSize: 30,
    currentMag: 30,
    reloadTime: 1.5,
    icon: 'crosshair',
  },
  {
    id: 'rifle',
    name: 'Carbine Rifle 5.56',
    type: 'rifle',
    damage: 52,
    fireRate: 8.0,
    range: 75,
    ammo: 180,
    maxAmmo: 300,
    magazineSize: 30,
    currentMag: 30,
    reloadTime: 1.8,
    icon: 'shield',
  },
];

export class Player {
  public mesh: THREE.Group;
  public position: THREE.Vector3 = new THREE.Vector3(-180, 1.2, 20);
  public rotationY: number = 0;
  public characterId: CharacterId = 'jax';

  // Stats
  public health: number = 100;
  public maxHealth: number = 100;
  public armor: number = 50;
  public maxArmor: number = 100;
  public stamina: number = 100;
  public cash: number = 8500;
  public specialMeter: number = 100;
  public isSpecialActive: boolean = false;

  // Weapons
  public weapons: Weapon[] = JSON.parse(JSON.stringify(DEFAULT_WEAPONS));
  public currentWeaponIndex: number = 1; // Pistol by default
  public isAiming: boolean = false;
  public isReloading: boolean = false;
  private lastShotTime: number = 0;

  // Movement State
  public isGrounded: boolean = true;
  public isSprinting: boolean = false;
  public isCrouching: boolean = false;
  public isSwimming: boolean = false;
  public verticalVelocity: number = 0;
  public speed: number = 0;

  // Vehicle
  public currentVehicle: VehicleEntity | null = null;
  public isEnteringVehicle: boolean = false;

  // Camera tracking
  public cameraPitch: number = 0.2; // vertical angle
  public cameraYaw: number = 0; // horizontal angle
  public cameraDistance: number = 4.2;

  // Humanoid visual sub-meshes for animation
  private torsoMesh!: THREE.Mesh;
  private headMesh!: THREE.Mesh;
  private leftLegPivot!: THREE.Group;
  private rightLegPivot!: THREE.Group;
  private leftArmPivot!: THREE.Group;
  private rightArmPivot!: THREE.Group;
  private weaponPropMesh!: THREE.Mesh;

  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.mesh = new THREE.Group();
    this.buildCharacterMesh();
    this.scene.add(this.mesh);
  }

  private buildCharacterMesh() {
    this.mesh.clear();

    const char = CHARACTERS[this.characterId];
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xdeb887, roughness: 0.8 });
    const clothesMat = new THREE.MeshStandardMaterial({ color: char.clothingColor, roughness: 0.6 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 });
    const hairMat = new THREE.MeshStandardMaterial({ color: char.hairColor, roughness: 0.9 });
    const vestMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7, metalness: 0.2 });

    // 1. Torso & Tactical Vest
    const torsoGeo = new THREE.BoxGeometry(0.55, 0.75, 0.32);
    this.torsoMesh = new THREE.Mesh(torsoGeo, clothesMat);
    this.torsoMesh.position.y = 1.15;
    this.torsoMesh.castShadow = true;
    this.mesh.add(this.torsoMesh);

    const vestGeo = new THREE.BoxGeometry(0.58, 0.55, 0.35);
    const vest = new THREE.Mesh(vestGeo, vestMat);
    vest.position.set(0, 0.05, 0);
    this.torsoMesh.add(vest);

    // 2. Head & Hair
    const headGeo = new THREE.BoxGeometry(0.3, 0.32, 0.3);
    this.headMesh = new THREE.Mesh(headGeo, skinMat);
    this.headMesh.position.set(0, 0.55, 0);
    this.torsoMesh.add(this.headMesh);

    const hairGeo = new THREE.BoxGeometry(0.32, 0.12, 0.32);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 0.16, 0);
    this.headMesh.add(hair);

    // Sunglasses / shades
    const shadesGeo = new THREE.BoxGeometry(0.28, 0.07, 0.08);
    const shades = new THREE.Mesh(shadesGeo, materials.chrome);
    shades.position.set(0, 0.02, 0.16);
    this.headMesh.add(shades);

    // 3. Legs
    const legGeo = new THREE.BoxGeometry(0.2, 0.75, 0.22);

    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(-0.16, 0.78, 0);
    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.position.y = -0.375;
    leftLeg.castShadow = true;
    this.leftLegPivot.add(leftLeg);
    this.mesh.add(this.leftLegPivot);

    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(0.16, 0.78, 0);
    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.position.y = -0.375;
    rightLeg.castShadow = true;
    this.rightLegPivot.add(rightLeg);
    this.mesh.add(this.rightLegPivot);

    // 4. Arms
    const armGeo = new THREE.BoxGeometry(0.16, 0.65, 0.18);

    this.leftArmPivot = new THREE.Group();
    this.leftArmPivot.position.set(-0.36, 0.32, 0);
    const leftArm = new THREE.Mesh(armGeo, clothesMat);
    leftArm.position.y = -0.28;
    this.leftArmPivot.add(leftArm);
    this.torsoMesh.add(this.leftArmPivot);

    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(0.36, 0.32, 0);
    const rightArm = new THREE.Mesh(armGeo, clothesMat);
    rightArm.position.y = -0.28;
    this.rightArmPivot.add(rightArm);
    this.torsoMesh.add(this.rightArmPivot);

    // 5. Weapon Prop in Right Hand
    const weaponGeo = new THREE.BoxGeometry(0.1, 0.16, 0.45);
    this.weaponPropMesh = new THREE.Mesh(weaponGeo, materials.chrome);
    this.weaponPropMesh.position.set(0, -0.32, 0.25);
    this.rightArmPivot.add(this.weaponPropMesh);
  }

  public switchCharacter(id: CharacterId) {
    if (this.characterId === id) return;
    this.characterId = id;
    this.buildCharacterMesh();
    sound.playUIClick();
  }

  public get currentWeapon(): Weapon {
    return this.weapons[this.currentWeaponIndex];
  }

  public shoot(): boolean {
    const w = this.currentWeapon;
    if (w.id === 'fists') {
      sound.playPunch();
      return true;
    }

    const now = performance.now() / 1000;
    if (now - this.lastShotTime < 1 / w.fireRate) return false;
    if (w.currentMag <= 0) {
      this.reload();
      return false;
    }

    w.currentMag--;
    this.lastShotTime = now;
    sound.playGunshot(w.type);
    return true;
  }

  public reload() {
    const w = this.currentWeapon;
    if (w.id === 'fists' || this.isReloading || w.currentMag === w.magazineSize || w.ammo <= 0) return;
    this.isReloading = true;
    setTimeout(() => {
      const needed = w.magazineSize - w.currentMag;
      const loaded = Math.min(needed, w.ammo);
      w.currentMag += loaded;
      w.ammo -= loaded;
      this.isReloading = false;
    }, w.reloadTime * 1000);
  }

  public enterVehicle(vehicle: VehicleEntity) {
    this.currentVehicle = vehicle;
    vehicle.isPlayerDriven = true;
    vehicle.stats.isEngineOn = true;
    this.mesh.visible = false;
    sound.updateEngineSound(true, 0.2, vehicle.stats.type);
  }

  public exitVehicle() {
    if (!this.currentVehicle) return;
    const v = this.currentVehicle;
    v.isPlayerDriven = false;
    v.stats.isEngineOn = false;
    this.currentVehicle = null;

    // Place player beside vehicle driver door
    const exitOffset = new THREE.Vector3(-2.2, 0, 0).applyQuaternion(v.mesh.quaternion);
    this.position.copy(v.mesh.position).add(exitOffset);
    this.position.y = 1.0;
    this.mesh.position.copy(this.position);
    this.mesh.visible = true;

    sound.updateEngineSound(false, 0);
    sound.playHorn(false);
  }

  public updateAnimation(delta: number) {
    if (this.currentVehicle) return;

    // Leg & Arm swinging procedural kinematics
    if (this.speed > 0.1) {
      const frequency = this.isSprinting ? 14 : 8;
      const angle = Math.sin(performance.now() * 0.001 * frequency) * (this.isSprinting ? 0.8 : 0.45);

      this.leftLegPivot.rotation.x = angle;
      this.rightLegPivot.rotation.x = -angle;

      if (!this.isAiming) {
        this.leftArmPivot.rotation.x = -angle * 0.8;
        this.rightArmPivot.rotation.x = angle * 0.8;
      }
    } else {
      // Idle breathing
      this.leftLegPivot.rotation.x = 0;
      this.rightLegPivot.rotation.x = 0;
      if (!this.isAiming) {
        this.leftArmPivot.rotation.x = 0.05 * Math.sin(performance.now() * 0.002);
        this.rightArmPivot.rotation.x = -0.05 * Math.sin(performance.now() * 0.002);
      }
    }

    // Aiming arm pose
    if (this.isAiming) {
      this.rightArmPivot.rotation.x = -Math.PI / 2 + this.cameraPitch;
      this.rightArmPivot.rotation.y = -0.2;
      this.leftArmPivot.rotation.x = -Math.PI / 2 + this.cameraPitch;
      this.leftArmPivot.rotation.y = 0.35;
    }
  }

  public update(delta: number) {
    if (this.currentVehicle) {
      this.position.copy(this.currentVehicle.mesh.position);
      return;
    }

    // Gravity & Ground collision
    if (!this.isGrounded) {
      this.verticalVelocity -= 22 * delta;
      this.position.y += this.verticalVelocity * delta;

      if (this.position.y <= 1.0) {
        this.position.y = 1.0;
        this.verticalVelocity = 0;
        this.isGrounded = true;
      }
    }

    // Check swimming condition (water plane on East side X > 50, Z between -800 and 800)
    if (this.position.x > 80 && this.position.y <= 1.2) {
      this.isSwimming = true;
      this.position.y = 0.6; // floating height
    } else {
      this.isSwimming = false;
    }

    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotationY;
    this.updateAnimation(delta);
  }
}
