"use client";

/**
 * 切削废料 / 切屑粒子：切削时从刀尖飞溅，沉降到工作台面并堆积。
 * 需挂在与工件相同的坐标系（含 SF-260 转台旋转组）内。
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useSimStore } from "@/lib/cnc/store";
import { getMaterialById } from "@/lib/cnc/materials";

const MAX_CHIPS = 900;
const SPAWN_PER_SEC = 52;

type Chip = {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  settled: boolean;
  size: number;
};

function makePool(n: number): Chip[] {
  return Array.from({ length: n }, () => ({
    active: false,
    x: 0,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    life: 0,
    settled: false,
    size: 0.6,
  }));
}

export default function ChipDebris({
  tableTopY,
}: {
  /** 工作台顶面局部 Y（毛坯底面），切屑落点 */
  tableTopY: number;
}) {
  const materialId = useSimStore((s) => s.materialId);
  const workpiece = useSimStore((s) => s.workpiece);
  const exampleId = useSimStore((s) => s.exampleId);
  const source = useSimStore((s) => s.source);

  const mat = useMemo(() => getMaterialById(materialId), [materialId]);
  const pool = useRef(makePool(MAX_CHIPS));
  const spawnAcc = useRef(0);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(mat.color), [mat.color]);

  useEffect(() => {
    for (const c of pool.current) {
      c.active = false;
      c.settled = false;
    }
    spawnAcc.current = 0;
    if (meshRef.current) {
      meshRef.current.count = 0;
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [exampleId, source, materialId, workpiece.width, workpiece.depth, workpiece.height]);

  useFrame((_, dt) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const { isCutting, position, playing, spindleOn, spindleDir, coolant } =
      useSimStore.getState();

    const floorY = tableTopY + 0.35;
    const chips = pool.current;

    if (playing && isCutting && spindleOn) {
      spawnAcc.current += dt * SPAWN_PER_SEC * (coolant === "flood" ? 0.75 : 1.1);
      while (spawnAcc.current >= 1) {
        spawnAcc.current -= 1;
        let slot = chips.find((c) => !c.active);
        if (!slot) slot = chips.find((c) => c.settled) ?? chips[0];

        // CNC (x,y,z) → Three 局部 (x, z, -y)
        const lx = position.x;
        const ly = position.z;
        const lz = -position.y;
        const spin = spindleDir >= 0 ? 1 : -1;
        const speed = 16 + Math.random() * 30;
        const ang = Math.random() * Math.PI * 2;
        slot.active = true;
        slot.settled = false;
        slot.x = lx + (Math.random() - 0.5) * 2.2;
        slot.y = ly + 0.4;
        slot.z = lz + (Math.random() - 0.5) * 2.2;
        slot.vx = Math.cos(ang) * speed * spin * (0.35 + Math.random());
        slot.vy = 7 + Math.random() * 16;
        slot.vz = Math.sin(ang) * speed * (0.35 + Math.random());
        slot.life = 3 + Math.random() * 4;
        slot.size = 0.3 + Math.random() * 0.95;
      }
    } else {
      spawnAcc.current = 0;
    }

    const g = 58;
    let visible = 0;
    for (const c of chips) {
      if (!c.active) continue;
      if (!c.settled) {
        c.vy -= g * dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.z += c.vz * dt;
        c.vx *= 1 - 1.15 * dt;
        c.vz *= 1 - 1.15 * dt;
        if (c.y <= floorY) {
          c.y = floorY + Math.random() * 0.4;
          c.vy *= -0.2;
          c.vx *= 0.5;
          c.vz *= 0.5;
          if (Math.abs(c.vy) < 2.2) {
            c.settled = true;
            c.vy = 0;
            c.vx = 0;
            c.vz = 0;
          }
        }
        c.life -= dt;
        if (c.life <= 0 && !c.settled) {
          c.active = false;
          continue;
        }
      }
      dummy.position.set(c.x, c.y, c.z);
      dummy.scale.setScalar(c.size);
      dummy.rotation.set(c.x * 0.15, c.z * 0.2, c.life);
      dummy.updateMatrix();
      mesh.setMatrixAt(visible, dummy.matrix);
      visible++;
    }
    mesh.count = visible;
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, MAX_CHIPS]}
      frustumCulled={false}
    >
      <boxGeometry args={[1, 0.32, 0.5]} />
      <meshStandardMaterial
        color={color}
        roughness={0.55}
        metalness={mat.metalness * 0.85}
        emissive={color}
        emissiveIntensity={0.07}
      />
    </instancedMesh>
  );
}
