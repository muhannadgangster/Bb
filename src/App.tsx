/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

import { GameMode, CharacterId, VehicleType } from './types/game';
import { Player } from './entities/player';
import { VehicleManager, VehicleEntity } from './entities/vehicles';
import { NPCSystem } from './entities/npcSystem';
import { PoliceSystem } from './systems/policeSystem';
import { MissionManager } from './systems/missionSystem';
import { WeatherSystem } from './systems/weatherSystem';
import { buildOpenWorldCity, CityData } from './world/cityBuilder';
import { sound } from './audio/soundEngine';

import { GameHUD } from './ui/GameHUD';
import { TitleScreen } from './ui/TitleScreen';
import { PauseMenu } from './ui/PauseMenu';
import { Smartphone } from './ui/Smartphone';
import { CharacterSwitchRadial } from './ui/CharacterSwitchRadial';

// Pre-allocated scratch math vectors to enforce ZERO GC inside requestAnimationFrame
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _camPos = new THREE.Vector3();
const _camTarget = new THREE.Vector3();
const _moveDir = new THREE.Vector3();
const _scratchVec = new THREE.Vector3();

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);

  // High-level Game States
  const [gameState, setGameState] = useState<'title' | 'playing' | 'paused'>('title');
  const [gameMode, setGameMode] = useState<GameMode>('story');
  const [showPhone, setShowPhone] = useState(false);
  const [showCharWheel, setShowCharWheel] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Engine references kept in refs to avoid tearing down the WebGL scene on React re-renders
  const engineRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    cityData: CityData;
    player: Player;
    vehicleManager: VehicleManager;
    npcSystem: NPCSystem;
    policeSystem: PoliceSystem;
    missionManager: MissionManager;
    weatherSystem: WeatherSystem;
    keys: Record<string, boolean>;
    mouseDelta: { x: number; y: number };
    isMouseDown: boolean;
    isRightMouseDown: boolean;
  } | null>(null);

  // Trigger temporary on-screen toast
  const triggerNotification = (text: string) => {
    setNotification(text);
    setTimeout(() => setNotification(null), 3500);
  };

  // Initialize Three.js WebGL Engine once
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    // 1. Scene, Camera & Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.Fog(0x0f172a, 100, 600);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1500);
    camera.position.set(-180, 25, 60);

    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    const renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: !isHeadless,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 2. Studio PBR Environment Map via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 3. Studio Lighting Rig
    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.8);
    dirLight.position.set(150, 250, 150);
    dirLight.castShadow = !isHeadless;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 600;
    const d = 160;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    dirLight.shadow.normalBias = 0.02;
    scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x14532d, 0.7);
    scene.add(hemiLight);

    // 4. Build Open-World City & Systems
    const cityData = buildOpenWorldCity(scene);
    scene.add(cityData.rootGroup);

    const vehicleManager = new VehicleManager(scene);
    const player = new Player(scene);
    const npcSystem = new NPCSystem(scene, cityData.roadNodes, vehicleManager);
    const policeSystem = new PoliceSystem(scene, vehicleManager);
    const missionManager = new MissionManager();
    const weatherSystem = new WeatherSystem(scene, dirLight, hemiLight);

    // Pre-spawn key world vehicles:
    // 1. Getaway Supercar at Downtown Avenue
    vehicleManager.createVehicle('supercar', new THREE.Vector3(-60, 0.5, 0), 0xf97316);
    // 2. Muscle car at Safehouse
    vehicleManager.createVehicle('muscle', new THREE.Vector3(-180, 0.5, 8), 0x2563eb);
    // 3. Helicopter on Maze Tower Helipad
    vehicleManager.createVehicle('helicopter', new THREE.Vector3(0, 147.2, 0), 0x111827);
    // 4. Motorcycle at Beach Pier
    vehicleManager.createVehicle('motorcycle', new THREE.Vector3(210, 3.2, 30), 0xdc2626);

    // 5. Input State
    const keys: Record<string, boolean> = {};
    const mouseDelta = { x: 0, y: 0 };
    let isMouseDown = false;
    let isRightMouseDown = false;

    // Window Listeners
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keys[k] = true;

      // Single-trigger actions
      if (k === 'escape') {
        setGameState((prev) => (prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev));
        setShowPhone(false);
        setShowCharWheel(false);
        sound.playUIClick();
      } else if (k === 'm') {
        setShowPhone((prev) => !prev);
        sound.playUIClick();
      } else if (k === 'p') {
        setGameState((prev) => (prev === 'playing' ? 'paused' : 'playing'));
        sound.playUIClick();
      } else if (k === 'f') {
        setShowCharWheel((prev) => !prev);
        sound.playUIClick();
      } else if (k === 'e') {
        // Vehicle Entry / Exit Toggle
        if (player.currentVehicle) {
          player.exitVehicle();
        } else {
          // Find closest vehicle within 4 meters
          let closest: VehicleEntity | null = null;
          let minDist = 4.5;
          vehicleManager.vehicles.forEach((v) => {
            const d = v.mesh.position.distanceTo(player.position);
            if (d < minDist) {
              minDist = d;
              closest = v;
            }
          });
          if (closest) {
            player.enterVehicle(closest);
          }
        }
      } else if (k === 'r') {
        if (player.currentVehicle) {
          // Next Radio Station
          const stations = ['synthwave', 'hiphop', 'rock', 'off'];
          const curIdx = stations.indexOf(player.currentVehicle.activeRadio || 'synthwave');
          const next = stations[(curIdx + 1) % stations.length];
          player.currentVehicle.activeRadio = next;
          sound.setRadioStation(next);
        } else {
          player.reload();
        }
      } else if (k === 'h' && player.currentVehicle) {
        sound.playHorn(true);
      } else if (['1', '2', '3', '4'].includes(k)) {
        const idx = parseInt(k, 10) - 1;
        if (idx < player.weapons.length) {
          player.currentWeaponIndex = idx;
          sound.playUIClick();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keys[k] = false;
      if (k === 'h') {
        sound.playHorn(false);
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isMouseDown = true;
        if (engineRef.current?.player) {
          const didShoot = engineRef.current.player.shoot();
          if (didShoot) {
            // Panic nearby pedestrians & report crime if weapon fired
            if (engineRef.current.player.currentWeapon.id !== 'fists') {
              npcSystem.triggerPanic(engineRef.current.player.position, 40);
              policeSystem.reportCrime(2);
            }
          }
        }
      } else if (e.button === 2) {
        isRightMouseDown = true;
        if (engineRef.current?.player) {
          engineRef.current.player.isAiming = true;
        }
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) isMouseDown = false;
      if (e.button === 2) {
        isRightMouseDown = false;
        if (engineRef.current?.player) {
          engineRef.current.player.isAiming = false;
        }
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      // Mouse look when dragging or pointer locked
      if (document.pointerLockElement === renderer.domElement || e.buttons > 0) {
        mouseDelta.x += e.movementX;
        mouseDelta.y += e.movementY;
      }
    };

    const onContextMenu = (e: MouseEvent) => e.preventDefault();
    const onBlur = () => {
      Object.keys(keys).forEach((k) => (keys[k] = false));
      sound.playHorn(false);
    };

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('blur', onBlur);
    window.addEventListener('resize', onResize);

    // Save references
    engineRef.current = {
      renderer,
      scene,
      camera,
      cityData,
      player,
      vehicleManager,
      npcSystem,
      policeSystem,
      missionManager,
      weatherSystem,
      keys,
      mouseDelta,
      isMouseDown,
      isRightMouseDown,
    };

    // 6. 60 FPS Lossless Render & Physics Loop
    let lastTime = performance.now();
    let animId: number;

    const tick = () => {
      const now = performance.now();
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const delta = Math.min(rawDt, 0.05); // Clamp dt to prevent frame spikes

      // Orbit camera mouse look
      if (mouseDelta.x !== 0 || mouseDelta.y !== 0) {
        player.cameraYaw -= mouseDelta.x * 0.0035;
        player.cameraPitch = Math.max(-0.4, Math.min(0.9, player.cameraPitch + mouseDelta.y * 0.0035));
        mouseDelta.x = 0;
        mouseDelta.y = 0;
      }

      // Check if player is alive
      if (player.health > 0) {
        if (player.currentVehicle) {
          // ================= VEHICLE DRIVING PHYSICS =================
          const v = player.currentVehicle;
          const isHeli = v.stats.type === 'helicopter';

          if (isHeli) {
            // Helicopter Flight Controls
            if (keys['shift']) v.mesh.position.y += 18 * delta;
            if (keys['control']) v.mesh.position.y = Math.max(1.8, v.mesh.position.y - 14 * delta);
            if (keys['a']) v.mesh.rotation.y += 1.8 * delta;
            if (keys['d']) v.mesh.rotation.y -= 1.8 * delta;

            const heliSpeed = keys['w'] ? 35 : keys['s'] ? -15 : 0;
            v.speed = heliSpeed;
            if (heliSpeed !== 0) {
              _forward.set(0, 0, 1).applyQuaternion(v.mesh.quaternion);
              v.mesh.position.addScaledVector(_forward, heliSpeed * delta);
              v.mesh.rotation.x = keys['w'] ? 0.15 : -0.1;
            } else {
              v.mesh.rotation.x *= 0.95;
            }
          } else {
            // Car / Bike Driving Controls
            const accel = v.stats.acceleration;
            const topSpeed = v.stats.topSpeed;

            if (keys['w']) {
              v.speed = Math.min(topSpeed, v.speed + accel * delta);
            } else if (keys['s']) {
              v.speed = Math.max(-topSpeed * 0.35, v.speed - accel * 1.2 * delta);
            } else {
              v.speed *= 0.97; // rolling drag
            }

            // Handbrake Drifting
            if (keys[' ']) {
              v.speed *= 0.94;
              if (Math.abs(v.speed) > 10) {
                sound.playTireSqueal(0.3);
              }
            }

            // Steering
            const steerTarget = (keys['a'] ? 1 : 0) - (keys['d'] ? 1 : 0);
            v.steerAngle += (steerTarget * 0.55 - v.steerAngle) * Math.min(1, 10 * delta);

            if (Math.abs(v.speed) > 0.5) {
              const turnFactor = (v.speed > 0 ? 1 : -1) * v.steerAngle * v.stats.handling;
              v.mesh.rotation.y += turnFactor * delta;
            }

            // Move vehicle forward
            _forward.set(0, 0, 1).applyQuaternion(v.mesh.quaternion);
            v.mesh.position.addScaledVector(_forward, v.speed * delta);

            // Ground alignment
            v.mesh.position.y = 0.55;

            // Audio pitch update
            const normSpeed = Math.abs(v.speed) / topSpeed;
            sound.updateEngineSound(true, normSpeed, v.stats.type);
          }
        } else {
          // ================= ON-FOOT PLAYER MOVEMENT =================
          player.isSprinting = !!keys['shift'];
          player.isCrouching = !!keys['c'];

          const moveForward = (keys['w'] ? 1 : 0) - (keys['s'] ? 1 : 0);
          const moveStrafe = (keys['a'] ? 1 : 0) - (keys['d'] ? 1 : 0);

          _moveDir.set(0, 0, 0);

          if (moveForward !== 0 || moveStrafe !== 0) {
            _forward.set(0, 0, -1).applyAxisAngle(THREE.Object3D.DEFAULT_UP, player.cameraYaw);
            _right.set(1, 0, 0).applyAxisAngle(THREE.Object3D.DEFAULT_UP, player.cameraYaw);

            _moveDir.addScaledVector(_forward, moveForward);
            _moveDir.addScaledVector(_right, moveStrafe);
            _moveDir.normalize();

            const baseSpeed = player.isSwimming ? 3.0 : player.isSprinting ? 8.5 : player.isCrouching ? 2.0 : 4.5;
            player.speed = baseSpeed;

            player.position.addScaledVector(_moveDir, baseSpeed * delta);
            player.rotationY = Math.atan2(_moveDir.x, _moveDir.z);
          } else {
            player.speed = 0;
            if (player.isAiming) {
              player.rotationY = player.cameraYaw;
            }
          }

          // Jump
          if (keys[' '] && player.isGrounded && !player.isSwimming) {
            player.verticalVelocity = 8.5;
            player.isGrounded = false;
          }

          player.update(delta);
        }
      }

      // 7. Third-Person Camera with Smooth Damping
      const targetPos = player.currentVehicle ? player.currentVehicle.mesh.position : player.position;
      const camDist = player.currentVehicle
        ? player.currentVehicle.stats.type === 'helicopter'
          ? 14
          : 6.5
        : player.isAiming
        ? 2.2
        : player.cameraDistance;

      // Compute ideal camera position in spherical coordinates
      const camYOffset = player.currentVehicle ? 2.5 : 1.6;
      _camPos.set(
        targetPos.x + Math.sin(player.cameraYaw) * Math.cos(player.cameraPitch) * camDist,
        targetPos.y + camYOffset + Math.sin(player.cameraPitch) * camDist,
        targetPos.z + Math.cos(player.cameraYaw) * Math.cos(player.cameraPitch) * camDist
      );

      _camTarget.set(targetPos.x, targetPos.y + camYOffset * 0.9, targetPos.z);

      // Exponential damping
      const dampFactor = 1 - Math.exp(-12 * delta);
      camera.position.lerp(_camPos, dampFactor);
      camera.lookAt(_camTarget);

      // 8. Update Game Systems
      vehicleManager.update(delta);
      npcSystem.update(delta, targetPos);
      policeSystem.update(delta, targetPos);
      weatherSystem.update(delta, targetPos);

      // 9. Mission Checkpoint Collision Checks
      const curObj = missionManager.currentObjective;
      if (curObj && curObj.targetPos && !curObj.completed) {
        _scratchVec.set(curObj.targetPos[0], curObj.targetPos[1], curObj.targetPos[2]);
        const dist = targetPos.distanceTo(_scratchVec);

        if (curObj.type === 'steal_vehicle' && player.currentVehicle) {
          missionManager.advanceObjective();
          policeSystem.reportCrime(2);
          triggerNotification('STOLE GETAWAY CAR! 2-STAR HEAT REPORTED!');
        } else if (dist < (curObj.targetRadius || 8)) {
          missionManager.advanceObjective();
          triggerNotification('OBJECTIVE COMPLETED!');
        }
      }

      // Render
      renderer.render(scene, camera);
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Handlers for UI interactions
  const handleStartGame = (mode: GameMode, charId: CharacterId) => {
    setGameMode(mode);
    setGameState('playing');
    if (engineRef.current) {
      engineRef.current.player.switchCharacter(charId);
    }
  };

  const handleSaveProgress = () => {
    if (!engineRef.current) return;
    const { player, missionManager } = engineRef.current;
    const saveData = {
      cash: player.cash,
      characterId: player.characterId,
      activeMissionIndex: missionManager.activeMissionIndex,
    };
    try {
      localStorage.setItem('vice_horizon_save', JSON.stringify(saveData));
    } catch (e) {}
  };

  const handleSpawnVehicle = (type: VehicleType) => {
    if (!engineRef.current) return;
    const { player, vehicleManager } = engineRef.current;
    const spawnPos = player.position.clone().add(new THREE.Vector3(4, 0.5, 4));
    vehicleManager.createVehicle(type, spawnPos, 0xe11d48, false);
    triggerNotification(`${type.toUpperCase()} DELIVERED NEARBY!`);
  };

  const handleNextRadio = () => {
    if (!engineRef.current?.player.currentVehicle) return;
    const v = engineRef.current.player.currentVehicle;
    const stations = ['synthwave', 'hiphop', 'rock', 'off'];
    const curIdx = stations.indexOf(v.activeRadio || 'synthwave');
    const next = stations[(curIdx + 1) % stations.length];
    v.activeRadio = next;
    sound.setRadioStation(next);
  };

  const currentEngine = engineRef.current;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* Isolated Three.js Canvas Container */}
      <div ref={canvasMountRef} className="absolute inset-0 z-0 pointer-events-auto" />

      {/* On-screen Notification Banner */}
      {notification && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-black font-extrabold text-sm px-6 py-2 rounded-lg shadow-2xl tracking-wider font-['Chakra_Petch'] animate-in fade-in slide-in-from-top-4 duration-300">
          ★ {notification}
        </div>
      )}

      {/* TITLE SCREEN */}
      {gameState === 'title' && <TitleScreen onStartGame={handleStartGame} />}

      {/* ACTIVE GAMEPLAY HUD */}
      {gameState === 'playing' && currentEngine && (
        <GameHUD
          player={currentEngine.player}
          police={currentEngine.policeSystem}
          missionManager={currentEngine.missionManager}
          weather={currentEngine.weatherSystem}
          onOpenPhone={() => setShowPhone(true)}
          onOpenMap={() => setGameState('paused')}
          onOpenCharacterWheel={() => setShowCharWheel(true)}
          onNextRadio={handleNextRadio}
        />
      )}

      {/* IN-GAME SMARTPHONE (HORIZON OS) */}
      {showPhone && currentEngine && (
        <Smartphone
          player={currentEngine.player}
          police={currentEngine.policeSystem}
          onClose={() => setShowPhone(false)}
          onSpawnVehicle={handleSpawnVehicle}
        />
      )}

      {/* CHARACTER SWITCH RADIAL */}
      {showCharWheel && currentEngine && (
        <CharacterSwitchRadial
          activeCharacterId={currentEngine.player.characterId}
          onSelectCharacter={(id) => currentEngine.player.switchCharacter(id)}
          onClose={() => setShowCharWheel(false)}
        />
      )}

      {/* PAUSE MENU & FULL WORLD MAP */}
      {gameState === 'paused' && currentEngine && (
        <PauseMenu
          player={currentEngine.player}
          missionManager={currentEngine.missionManager}
          weather={currentEngine.weatherSystem}
          onResume={() => setGameState('playing')}
          onSave={handleSaveProgress}
        />
      )}
    </div>
  );
}
