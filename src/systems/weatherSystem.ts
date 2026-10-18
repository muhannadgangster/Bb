/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { WeatherType } from '../types/game';
import { materials } from '../rendering/materials';

export class WeatherSystem {
  public timeOfDay: number = 14.5; // 24-hr clock (14:30)
  public timeSpeed: number = 0.05; // speed of day/night cycle
  public currentWeather: WeatherType = 'clear';

  private scene: THREE.Scene;
  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private rainParticles: THREE.Points | null = null;
  private rainPositions: Float32Array | null = null;

  constructor(scene: THREE.Scene, dirLight: THREE.DirectionalLight, hemiLight: THREE.HemisphereLight) {
    this.scene = scene;
    this.dirLight = dirLight;
    this.hemiLight = hemiLight;

    this.createRainSystem();
    this.applyWeather(this.currentWeather);
  }

  private createRainSystem() {
    const rainCount = 1800;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(rainCount * 3);

    for (let i = 0; i < rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = Math.random() * 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.rainPositions = positions;

    const mat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.25,
      transparent: true,
      opacity: 0.6,
    });

    this.rainParticles = new THREE.Points(geo, mat);
    this.rainParticles.visible = false;
    this.scene.add(this.rainParticles);
  }

  public setWeather(type: WeatherType) {
    this.currentWeather = type;
    this.applyWeather(type);
  }

  private applyWeather(type: WeatherType) {
    if (this.rainParticles) {
      this.rainParticles.visible = type === 'rain' || type === 'storm';
    }

    // Wet road specular reflection enhancement during rain
    const isWet = type === 'rain' || type === 'storm';
    materials.road.roughness = isWet ? 0.25 : 0.8;
    materials.road.metalness = isWet ? 0.6 : 0.1;

    if (type === 'fog') {
      this.scene.fog = new THREE.FogExp2(0x94a3b8, 0.012);
    } else {
      this.scene.fog = new THREE.Fog(0x0f172a, 120, 600);
    }
  }

  public update(delta: number, playerPos: THREE.Vector3) {
    // Advance clock
    this.timeOfDay = (this.timeOfDay + delta * this.timeSpeed) % 24;

    // Calculate sun position based on time of day
    const sunAngle = ((this.timeOfDay - 6) / 24) * Math.PI * 2;
    const sunDistance = 350;

    const sunX = Math.cos(sunAngle) * sunDistance;
    const sunY = Math.sin(sunAngle) * sunDistance;
    const isNight = sunY < 0;

    this.dirLight.position.set(sunX + playerPos.x, Math.max(sunY, 15), 100 + playerPos.z);
    this.dirLight.target.position.copy(playerPos);

    // Sky & Lighting Color temperature interpolation
    if (isNight) {
      // Midnight moonlight
      this.dirLight.intensity = 0.35;
      this.dirLight.color.setHex(0x38bdf8);
      this.hemiLight.color.setHex(0x1e293b);
      this.hemiLight.groundColor.setHex(0x090d16);
      this.hemiLight.intensity = 0.45;
      if (this.scene.fog && this.scene.fog instanceof THREE.Fog) {
        this.scene.fog.color.setHex(0x030712);
      }
    } else if (this.timeOfDay >= 17 && this.timeOfDay <= 20) {
      // Golden Hour Sunset
      const t = (this.timeOfDay - 17) / 3;
      this.dirLight.intensity = 1.6 - t * 0.8;
      this.dirLight.color.setHex(0xf97316); // vibrant sunset orange
      this.hemiLight.color.setHex(0xf43f5e);
      this.hemiLight.groundColor.setHex(0x451a03);
      if (this.scene.fog && this.scene.fog instanceof THREE.Fog) {
        this.scene.fog.color.setHex(0x7c2d12);
      }
    } else {
      // Bright Day
      this.dirLight.intensity = 1.8;
      this.dirLight.color.setHex(0xfffaed);
      this.hemiLight.color.setHex(0x38bdf8);
      this.hemiLight.groundColor.setHex(0x14532d);
      this.hemiLight.intensity = 0.8;
      if (this.scene.fog && this.scene.fog instanceof THREE.Fog) {
        this.scene.fog.color.setHex(0x60a5fa);
      }
    }

    // Update rain drops around player
    if (this.rainParticles && this.rainParticles.visible && this.rainPositions) {
      this.rainParticles.position.x = playerPos.x;
      this.rainParticles.position.z = playerPos.z;

      const posAttr = this.rainParticles.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < this.rainPositions.length / 3; i++) {
        let y = posAttr.getY(i) - 45 * delta;
        if (y < 0) y = 45;
        posAttr.setY(i, y);
      }
      posAttr.needsUpdate = true;
    }
  }

  public getFormattedTime(): string {
    const hours = Math.floor(this.timeOfDay);
    const minutes = Math.floor((this.timeOfDay % 1) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
}
