/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { materials, createBuildingFacadeTexture, createSignTexture } from '../rendering/materials';

export interface RoadNode {
  id: number;
  x: number;
  z: number;
  connected: number[];
}

export interface BuildingCollider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  height: number;
  name?: string;
  isEnterable?: boolean;
  interiorType?: 'safehouse' | 'warehouse' | 'gunshop';
}

export interface CityData {
  rootGroup: THREE.Group;
  roadNodes: RoadNode[];
  colliders: BuildingCollider[];
  spawns: {
    player: THREE.Vector3;
    safehouse: THREE.Vector3;
    helipad: THREE.Vector3;
    warehouse: THREE.Vector3;
    dealership: THREE.Vector3;
    pier: THREE.Vector3;
  };
  trafficLights: THREE.Mesh[];
  waterPlane: THREE.Mesh;
}

export function buildOpenWorldCity(scene: THREE.Scene): CityData {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'CityRoot';

  const colliders: BuildingCollider[] = [];
  const roadNodes: RoadNode[] = [];
  const trafficLights: THREE.Mesh[] = [];

  // Ground plane: Vast base terrain with grass, asphalt, and beach
  const groundGeo = new THREE.PlaneGeometry(1600, 1600);
  groundGeo.rotateX(-Math.PI / 2);
  const groundMesh = new THREE.Mesh(groundGeo, materials.grass);
  groundMesh.receiveShadow = true;
  rootGroup.add(groundMesh);

  // Ocean Water Plane (East side of map)
  const waterGeo = new THREE.PlaneGeometry(1200, 1600, 32, 32);
  waterGeo.rotateX(-Math.PI / 2);
  const waterMesh = new THREE.Mesh(waterGeo, materials.water);
  waterMesh.position.set(650, 0.4, 0);
  waterMesh.receiveShadow = true;
  rootGroup.add(waterMesh);

  // Sandy Beach strip
  const beachGeo = new THREE.PlaneGeometry(140, 1200);
  beachGeo.rotateX(-Math.PI / 2);
  const beachMesh = new THREE.Mesh(beachGeo, materials.sand);
  beachMesh.position.set(220, 0.5, 0);
  beachMesh.receiveShadow = true;
  rootGroup.add(beachMesh);

  // ==========================================
  // ROAD NETWORK & INTERSECTIONS
  // ==========================================
  // Primary grid: -300 to +200 on X, -300 to +300 on Z
  const roadWidth = 18;
  const gridLinesX = [-240, -120, 0, 120];
  const gridLinesZ = [-240, -120, 0, 120, 240];

  // Helper to place road strip
  function addRoad(x1: number, z1: number, x2: number, z2: number) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const len = Math.hypot(dx, dz);
    const angle = Math.atan2(dx, dz);

    const geo = new THREE.PlaneGeometry(roadWidth, len);
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, materials.road);
    mesh.position.set((x1 + x2) / 2, 0.6, (z1 + z2) / 2);
    mesh.rotation.y = angle;
    mesh.receiveShadow = true;
    rootGroup.add(mesh);

    // Sidewalks on left & right of road
    const swWidth = 3.5;
    const swGeo = new THREE.BoxGeometry(swWidth, 0.3, len);
    const swLeft = new THREE.Mesh(swGeo, materials.sidewalk);
    const swRight = new THREE.Mesh(swGeo, materials.sidewalk);

    const perpX = Math.cos(angle) * (roadWidth / 2 + swWidth / 2);
    const perpZ = -Math.sin(angle) * (roadWidth / 2 + swWidth / 2);

    swLeft.position.set((x1 + x2) / 2 - perpX, 0.75, (z1 + z2) / 2 - perpZ);
    swLeft.rotation.y = angle;
    swRight.position.set((x1 + x2) / 2 + perpX, 0.75, (z1 + z2) / 2 + perpZ);
    swRight.rotation.y = angle;

    swLeft.receiveShadow = true;
    swRight.receiveShadow = true;
    rootGroup.add(swLeft);
    rootGroup.add(swRight);
  }

  // Build Road Waypoint Graph
  let nodeIdCounter = 0;
  const nodeMap: Record<string, number> = {};

  gridLinesX.forEach((x) => {
    gridLinesZ.forEach((z) => {
      const key = `${x},${z}`;
      const id = nodeIdCounter++;
      nodeMap[key] = id;
      roadNodes.push({ id, x, z, connected: [] });
    });
  });

  // Connect X grid roads and nodes
  gridLinesZ.forEach((z) => {
    for (let i = 0; i < gridLinesX.length - 1; i++) {
      const x1 = gridLinesX[i];
      const x2 = gridLinesX[i + 1];
      addRoad(x1, z, x2, z);

      const id1 = nodeMap[`${x1},${z}`];
      const id2 = nodeMap[`${x2},${z}`];
      roadNodes[id1].connected.push(id2);
      roadNodes[id2].connected.push(id1);
    }
  });

  // Connect Z grid roads and nodes
  gridLinesX.forEach((x) => {
    for (let i = 0; i < gridLinesZ.length - 1; i++) {
      const z1 = gridLinesZ[i];
      const z2 = gridLinesZ[i + 1];
      addRoad(x, z1, x, z2);

      const id1 = nodeMap[`${x},${z1}`];
      const id2 = nodeMap[`${x},${z2}`];
      roadNodes[id1].connected.push(id2);
      roadNodes[id2].connected.push(id1);
    }
  });

  // Highway Overpass (Elevated Road running along X: -60)
  const highwayLen = 600;
  const highwayGeo = new THREE.BoxGeometry(22, 1.2, highwayLen);
  const highwayMesh = new THREE.Mesh(highwayGeo, materials.road);
  highwayMesh.position.set(-60, 10, 0);
  highwayMesh.castShadow = true;
  highwayMesh.receiveShadow = true;
  rootGroup.add(highwayMesh);

  // Highway concrete pillars
  for (let z = -260; z <= 260; z += 50) {
    const pillarGeo = new THREE.CylinderGeometry(1.6, 1.8, 10, 12);
    const pillar = new THREE.Mesh(pillarGeo, materials.curb);
    pillar.position.set(-60, 5, z);
    pillar.castShadow = true;
    rootGroup.add(pillar);

    // Collider for pillars
    colliders.push({
      minX: -62,
      maxX: -58,
      minZ: z - 2,
      maxZ: z + 2,
      height: 10,
    });
  }

  // ==========================================
  // COMPOSITE PROCEDURAL BUILDINGS
  // ==========================================
  // Helper to create a composite 3-8 part building
  function createSkyscraper(
    x: number,
    z: number,
    width: number,
    depth: number,
    height: number,
    type: 'office' | 'neon' | 'residential' | 'industrial',
    signText?: string
  ) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // 1. Primary Base Podium
    const podiumHeight = Math.min(12, height * 0.15);
    const podiumGeo = new THREE.BoxGeometry(width + 4, podiumHeight, depth + 4);
    const podiumMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.7,
      metalness: 0.2,
    });
    const podium = new THREE.Mesh(podiumGeo, podiumMat);
    podium.position.y = podiumHeight / 2;
    podium.castShadow = true;
    podium.receiveShadow = true;
    group.add(podium);

    // 2. Main Tower Shaft with procedural window facade
    const towerHeight = height - podiumHeight;
    const towerGeo = new THREE.BoxGeometry(width, towerHeight, depth);
    const facadeTex = createBuildingFacadeTexture(type);
    const towerMat = new THREE.MeshStandardMaterial({
      map: facadeTex,
      roughness: 0.4,
      metalness: 0.5,
    });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.y = podiumHeight + towerHeight / 2;
    tower.castShadow = true;
    tower.receiveShadow = true;
    group.add(tower);

    // 3. Stepped Crown / Penthouse
    const crownHeight = 6;
    const crownGeo = new THREE.BoxGeometry(width * 0.7, crownHeight, depth * 0.7);
    const crownMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.3,
      metalness: 0.8,
    });
    const crown = new THREE.Mesh(crownGeo, crownMat);
    crown.position.y = height + crownHeight / 2;
    crown.castShadow = true;
    group.add(crown);

    // 4. Roof Antenna Spire / HVAC units
    const spireGeo = new THREE.CylinderGeometry(0.3, 0.8, 14, 8);
    const spire = new THREE.Mesh(spireGeo, materials.chrome);
    spire.position.y = height + crownHeight + 7;
    group.add(spire);

    // 5. Roof Beacons (Blinking aviation red lights)
    const beaconGeo = new THREE.SphereGeometry(0.6, 8, 8);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff1100 });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = height + crownHeight + 14;
    group.add(beacon);

    // 6. Neon Billboard / Sign if specified
    if (signText) {
      const signTex = createSignTexture(signText, '#0f172a', '#38bdf8');
      const signGeo = new THREE.PlaneGeometry(width * 0.8, 8);
      const signMat = new THREE.MeshBasicMaterial({ map: signTex });
      const signMesh = new THREE.Mesh(signGeo, signMat);
      signMesh.position.set(0, height - 8, depth / 2 + 0.2);
      group.add(signMesh);
    }

    rootGroup.add(group);

    // Register bounding box collider
    colliders.push({
      minX: x - (width + 4) / 2,
      maxX: x + (width + 4) / 2,
      minZ: z - (depth + 4) / 2,
      maxZ: z + (depth + 4) / 2,
      height: height + crownHeight,
      name: signText || 'Building',
    });

    return group;
  }

  // --- DOWNTOWN SKYSCRAPERS ---
  // Central Maze Bank style Tower (Highest in city, with Helipad)
  const mazeTower = createSkyscraper(0, 0, 42, 42, 140, 'office', 'MAZE HORIZON');
  // Add Helipad platform on top of central tower
  const helipadGeo = new THREE.CylinderGeometry(18, 18, 1.5, 24);
  const helipadMat = new THREE.MeshStandardMaterial({
    color: 0x22262d,
    roughness: 0.8,
  });
  const helipad = new THREE.Mesh(helipadGeo, helipadMat);
  helipad.position.set(0, 146, 0);
  helipad.receiveShadow = true;
  rootGroup.add(helipad);

  // Helipad 'H' Decal
  const hDecalTex = createSignTexture('H', '#18181b', '#facc15');
  const hDecalGeo = new THREE.PlaneGeometry(16, 16);
  hDecalGeo.rotateX(-Math.PI / 2);
  const hDecal = new THREE.Mesh(hDecalGeo, new THREE.MeshBasicMaterial({ map: hDecalTex }));
  hDecal.position.set(0, 146.8, 0);
  rootGroup.add(hDecal);

  // Surrounding downtown highrises
  createSkyscraper(-60, -60, 32, 32, 90, 'neon', 'CYBER PLAZA');
  createSkyscraper(60, -60, 36, 28, 105, 'office', 'LOMBANK');
  createSkyscraper(-60, 60, 28, 38, 85, 'neon', 'HOTEL VERITAS');
  createSkyscraper(60, 60, 34, 34, 115, 'office', 'UNION CENTRAL');

  createSkyscraper(-180, -60, 30, 30, 75, 'residential', 'METRO TOWERS');
  createSkyscraper(-180, 60, 32, 28, 68, 'residential', 'PACIFIC VIEW');
  createSkyscraper(-180, -180, 26, 26, 60, 'office', 'TECH APEX');
  createSkyscraper(-60, -180, 34, 30, 80, 'office', 'VANGUARD');
  createSkyscraper(60, -180, 28, 36, 72, 'neon', 'CLUB NEON');

  // ==========================================
  // ENTERABLE LOCATIONS
  // ==========================================
  // 1. PLAYER SAFEHOUSE & GARAGE (At X: -180, Z: 0)
  const safehouseGroup = new THREE.Group();
  safehouseGroup.position.set(-180, 0, 0);

  // Exterior villa walls
  const villaGeo = new THREE.BoxGeometry(28, 9, 22);
  const villaMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.85 });
  const villa = new THREE.Mesh(villaGeo, villaMat);
  villa.position.set(0, 4.5, 0);
  villa.castShadow = true;
  safehouseGroup.add(villa);

  // Safehouse glass balcony
  const balconyGeo = new THREE.BoxGeometry(26, 1.2, 8);
  const balcony = new THREE.Mesh(balconyGeo, materials.glass);
  balcony.position.set(0, 5, 12);
  safehouseGroup.add(balcony);

  // Garage Door with textured warning stripes
  const garageGeo = new THREE.BoxGeometry(10, 5, 0.4);
  const garageMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.2 });
  const garage = new THREE.Mesh(garageGeo, garageMat);
  garage.position.set(-7, 2.5, 11.2);
  safehouseGroup.add(garage);

  // Safehouse Doorway Marker (Enterable)
  const shDoorLight = new THREE.PointLight(0x38bdf8, 2, 8);
  shDoorLight.position.set(6, 2, 11.5);
  safehouseGroup.add(shDoorLight);

  rootGroup.add(safehouseGroup);
  colliders.push({
    minX: -195,
    maxX: -165,
    minZ: -12,
    maxZ: 12,
    height: 10,
    name: "Marcus' Safehouse & Garage",
    isEnterable: true,
    interiorType: 'safehouse',
  });

  // 2. AMMU-NATION GUN STORE (At X: -60, Z: 180)
  const gunshopGroup = new THREE.Group();
  gunshopGroup.position.set(-60, 0, 180);
  const gsGeo = new THREE.BoxGeometry(24, 7, 20);
  const gsMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
  const gsMesh = new THREE.Mesh(gsGeo, gsMat);
  gsMesh.position.y = 3.5;
  gsMesh.castShadow = true;
  gunshopGroup.add(gsMesh);

  // Gun store illuminated sign
  const gsSignTex = createSignTexture('AMMU-NATION', '#b91c1c', '#fef08a');
  const gsSignGeo = new THREE.PlaneGeometry(16, 4);
  const gsSign = new THREE.Mesh(gsSignGeo, new THREE.MeshBasicMaterial({ map: gsSignTex }));
  gsSign.position.set(0, 5.5, 10.2);
  gunshopGroup.add(gsSign);

  rootGroup.add(gunshopGroup);
  colliders.push({
    minX: -73,
    maxX: -47,
    minZ: 169,
    maxZ: 191,
    height: 8,
    name: 'Ammu-Nation Armory',
    isEnterable: true,
    interiorType: 'gunshop',
  });

  // 3. INDUSTRIAL WAREHOUSE (At X: -240, Z: 200 - Syndicate Mission Site)
  const whGroup = new THREE.Group();
  whGroup.position.set(-240, 0, 200);
  const whGeo = new THREE.BoxGeometry(45, 12, 35);
  const whMat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.9, metalness: 0.3 });
  const whMesh = new THREE.Mesh(whGeo, whMat);
  whMesh.position.y = 6;
  whMesh.castShadow = true;
  whGroup.add(whMesh);

  // Open rollup shutter door where player can enter directly
  const whEntrance = new THREE.Mesh(new THREE.BoxGeometry(14, 8, 1), new THREE.MeshBasicMaterial({ color: 0x050505 }));
  whEntrance.position.set(0, 4, 17.6);
  whGroup.add(whEntrance);

  // Interior spotlight
  const whLight = new THREE.PointLight(0xf59e0b, 3, 25);
  whLight.position.set(0, 8, 0);
  whGroup.add(whLight);

  rootGroup.add(whGroup);
  colliders.push({
    minX: -264,
    maxX: -216,
    minZ: 181,
    maxZ: 219,
    height: 13,
    name: 'Port Syndicate Warehouse',
    isEnterable: true,
    interiorType: 'warehouse',
  });

  // ==========================================
  // HARBOR & CARGO SHIPPING CRANES
  // ==========================================
  const containerColors = [0xb91c1c, 0x1d4ed8, 0x047857, 0xd97706, 0x475569];
  for (let i = 0; i < 28; i++) {
    const cx = -280 + (i % 7) * 9;
    const cz = 130 + Math.floor(i / 7) * 20;
    const stackH = 1 + (i % 3);

    for (let h = 0; h < stackH; h++) {
      const cGeo = new THREE.BoxGeometry(7.5, 3.2, 16);
      const cColor = containerColors[(i + h) % containerColors.length];
      const cMat = new THREE.MeshStandardMaterial({ color: cColor, roughness: 0.6, metalness: 0.4 });
      const cMesh = new THREE.Mesh(cGeo, cMat);
      cMesh.position.set(cx, 1.6 + h * 3.2, cz);
      cMesh.castShadow = true;
      cMesh.receiveShadow = true;
      rootGroup.add(cMesh);

      colliders.push({
        minX: cx - 4,
        maxX: cx + 4,
        minZ: cz - 8.2,
        maxZ: cz + 8.2,
        height: (h + 1) * 3.2,
      });
    }
  }

  // Giant Shipping Crane
  const craneGroup = new THREE.Group();
  craneGroup.position.set(-270, 0, 90);
  const legGeo = new THREE.BoxGeometry(2, 45, 2);
  const legMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 });
  const l1 = new THREE.Mesh(legGeo, legMat);
  l1.position.set(-8, 22.5, -8);
  const l2 = new THREE.Mesh(legGeo, legMat);
  l2.position.set(8, 22.5, -8);
  const l3 = new THREE.Mesh(legGeo, legMat);
  l3.position.set(-8, 22.5, 8);
  const l4 = new THREE.Mesh(legGeo, legMat);
  l4.position.set(8, 22.5, 8);
  craneGroup.add(l1, l2, l3, l4);

  const boomGeo = new THREE.BoxGeometry(50, 4, 6);
  const boom = new THREE.Mesh(boomGeo, legMat);
  boom.position.set(12, 45, 0);
  craneGroup.add(boom);
  rootGroup.add(craneGroup);

  // ==========================================
  // BEACH PIER & FERRIS WHEEL (Del Perro Style)
  // ==========================================
  const pierGroup = new THREE.Group();
  pierGroup.position.set(220, 0, -40);

  // Wooden deck extending 120m into ocean
  const pierDeckGeo = new THREE.BoxGeometry(32, 2.5, 140);
  const pierDeckMat = new THREE.MeshStandardMaterial({ color: 0x713f12, roughness: 0.9 });
  const pierDeck = new THREE.Mesh(pierDeckGeo, pierDeckMat);
  pierDeck.position.set(0, 3, 70);
  pierDeck.castShadow = true;
  pierDeck.receiveShadow = true;
  pierGroup.add(pierDeck);

  // Pier support stilts in water
  for (let z = 15; z <= 130; z += 18) {
    const stilt = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 6, 8), materials.curb);
    stilt.position.set(-13, 0, z);
    pierGroup.add(stilt);
    const stilt2 = stilt.clone();
    stilt2.position.set(13, 0, z);
    pierGroup.add(stilt2);
  }

  // Ferris Wheel on the pier end!
  const wheelGroup = new THREE.Group();
  wheelGroup.position.set(0, 22, 110);
  const rimGeo = new THREE.TorusGeometry(16, 0.8, 8, 32);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3, metalness: 0.8 });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  wheelGroup.add(rim);

  // Ferris Wheel Hub & Spokes
  for (let a = 0; a < 8; a++) {
    const spokeGeo = new THREE.CylinderGeometry(0.2, 0.2, 32, 6);
    const spoke = new THREE.Mesh(spokeGeo, materials.chrome);
    spoke.rotation.z = (a * Math.PI) / 8;
    wheelGroup.add(spoke);
  }
  pierGroup.add(wheelGroup);
  rootGroup.add(pierGroup);

  // ==========================================
  // VINEWOOD HILLSIDE & GIANT SIGN
  // ==========================================
  const hillGroup = new THREE.Group();
  hillGroup.position.set(0, 0, -320);

  // Rolling hill terrain
  const hillGeo = new THREE.ConeGeometry(380, 70, 16);
  const hillMat = new THREE.MeshStandardMaterial({ color: 0x1e3a1e, roughness: 0.95 });
  const hillMesh = new THREE.Mesh(hillGeo, hillMat);
  hillMesh.position.y = 30;
  hillMesh.scale.set(1.5, 0.6, 0.8);
  hillMesh.receiveShadow = true;
  hillGroup.add(hillMesh);

  // Iconic Giant "HORIZON" Sign on the hillside!
  const signLetters = ['H', 'O', 'R', 'I', 'Z', 'O', 'N'];
  signLetters.forEach((letter, idx) => {
    const letterTex = createSignTexture(letter, '#ffffff', '#0f172a');
    const letterGeo = new THREE.PlaneGeometry(8, 14);
    const letterMesh = new THREE.Mesh(letterGeo, new THREE.MeshBasicMaterial({ map: letterTex, side: THREE.DoubleSide }));
    letterMesh.position.set(-36 + idx * 12, 36, 45);
    letterMesh.rotation.x = -0.15;
    hillGroup.add(letterMesh);
  });
  rootGroup.add(hillGroup);

  // ==========================================
  // INSTANCED PROPS: STREETLIGHTS & PALM TREES
  // ==========================================
  // Streetlights
  const lightPoleGeo = new THREE.CylinderGeometry(0.2, 0.3, 8, 8);
  const lightArmGeo = new THREE.BoxGeometry(2.5, 0.2, 0.4);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });

  // Place streetlights along road edges
  gridLinesX.forEach((rx) => {
    for (let rz = -230; rz <= 230; rz += 40) {
      const poleGroup = new THREE.Group();
      poleGroup.position.set(rx + 10.5, 4, rz);
      const pole = new THREE.Mesh(lightPoleGeo, poleMat);
      const arm = new THREE.Mesh(lightArmGeo, poleMat);
      arm.position.set(-1.2, 3.9, 0);

      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), materials.headlight);
      bulb.position.set(-2.2, 3.7, 0);

      poleGroup.add(pole, arm, bulb);
      rootGroup.add(poleGroup);
    }
  });

  // Traffic Lights at Intersections
  gridLinesX.forEach((rx) => {
    gridLinesZ.forEach((rz) => {
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.2, 0.8), new THREE.MeshStandardMaterial({ color: 0xf59e0b }));
      tl.position.set(rx + 9.5, 6, rz + 9.5);
      rootGroup.add(tl);
      trafficLights.push(tl);
    });
  });

  // Palm Trees (Composite: segmented bent trunk + palm canopy)
  function createPalmTree(x: number, z: number) {
    const palm = new THREE.Group();
    palm.position.set(x, 0, z);

    // Trunk segments
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
    for (let i = 0; i < 5; i++) {
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.4 - i * 0.04, 0.45 - i * 0.04, 2, 7), trunkMat);
      seg.position.set(i * 0.2, 1 + i * 1.8, 0);
      seg.rotation.z = -0.08 * i;
      palm.add(seg);
    }

    // Fronds canopy
    const frondMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7, side: THREE.DoubleSide });
    for (let f = 0; f < 7; f++) {
      const angle = (f * Math.PI * 2) / 7;
      const frond = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 6), frondMat);
      frond.position.set(1.0 + Math.cos(angle) * 2.2, 9.8, Math.sin(angle) * 2.2);
      frond.rotation.y = angle;
      frond.rotation.x = 0.6;
      palm.add(frond);
    }
    rootGroup.add(palm);
  }

  // Plant palm trees along beach boardwalk and safehouse avenue
  for (let z = -200; z <= 200; z += 30) {
    createPalmTree(145, z);
    createPalmTree(175, z + 15);
  }
  for (let x = -220; x <= -100; x += 25) {
    createPalmTree(x, 25);
  }

  // Stunt Ramps for vehicle acrobatics!
  function createStuntRamp(x: number, z: number, rotY: number) {
    const rampGeo = new THREE.BoxGeometry(6, 3, 10);
    // Bevel/angle the ramp
    const rampMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.4, metalness: 0.6 });
    const ramp = new THREE.Mesh(rampGeo, rampMat);
    ramp.position.set(x, 1.2, z);
    ramp.rotation.y = rotY;
    ramp.rotation.x = -0.26;
    rootGroup.add(ramp);
  }

  createStuntRamp(-40, 20, 0);
  createStuntRamp(80, -100, Math.PI / 2);
  createStuntRamp(-140, 160, Math.PI / 4);

  // Key world spawn locations
  const spawns = {
    player: new THREE.Vector3(-180, 1.2, 20),
    safehouse: new THREE.Vector3(-180, 1.2, 14),
    helipad: new THREE.Vector3(0, 147.5, 0),
    warehouse: new THREE.Vector3(-240, 1.2, 190),
    dealership: new THREE.Vector3(60, 1.2, 60),
    pier: new THREE.Vector3(220, 3.5, 40),
  };

  return {
    rootGroup,
    roadNodes,
    colliders,
    spawns,
    trafficLights,
    waterPlane: waterMesh,
  };
}
