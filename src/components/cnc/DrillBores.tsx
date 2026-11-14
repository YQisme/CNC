"use client";

/**
 * 钻孔孔壁可视化：锐边圆柱孔 + 钻尖锥底，随仿真进度加深。
 */

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useSimStore } from "@/lib/cnc/store";
import { extractDrillHoles, type DrillHoleSpec } from "@/lib/cnc/carve";
import { getMaterialById } from "@/lib/cnc/materials";
import { sampleMove } from "@/lib/cnc/parser";
import type { Move } from "@/lib/cnc/types";

function holeProgressDepth(
  hole: DrillHoleSpec,
  moveIndex: number,
  t: number,
  moves: Move[],
): number {
  if (moveIndex < 0) return 0;
  let deepest = 0;
  for (const m of moves) {
    if (m.index > moveIndex) break;
    if (m.type !== "linear") continue;
    if (Math.hypot(m.to.x - hole.x, m.to.y - hole.y) > hole.radius * 0.6) continue;
    const horiz = Math.hypot(m.to.x - m.from.x, m.to.y - m.from.y);
    if (horiz > hole.radius) continue;
    let z = m.to.z;
    if (m.index === moveIndex && t < 1) {
      z = sampleMove(m, t).z;
    }
    if (z < deepest) deepest = z;
  }
  return deepest;
}

export default function DrillBores({
  stockHeight,
}: {
  stockHeight: number;
}) {
  const parseResult = useSimStore((s) => s.parseResult);
  const machineMode = useSimStore((s) => s.machineMode);
  const materialId = useSimStore((s) => s.materialId);
  const groupRef = useRef<THREE.Group>(null);

  const mat = useMemo(() => getMaterialById(materialId), [materialId]);
  const wallMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(mat.sideColor).offsetHSL(0, -0.05, -0.12),
        roughness: 0.55,
        metalness: mat.metalness * 0.7,
        side: THREE.DoubleSide,
      }),
    [mat.sideColor, mat.metalness],
  );
  const floorMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(mat.color).offsetHSL(0.02, 0.05, 0.12),
        roughness: 0.35,
        metalness: mat.metalness,
        side: THREE.DoubleSide,
      }),
    [mat.color, mat.metalness],
  );

  const holes = useMemo(() => {
    if (!parseResult || machineMode !== "run") return [] as DrillHoleSpec[];
    return extractDrillHoles(parseResult.moves);
  }, [parseResult, machineMode]);

  // 每孔一组：壁筒 + 锥底；用 scale.y 表达当前深度
  const boreRefs = useRef<
    { wall: THREE.Mesh | null; cone: THREE.Mesh | null; lip: THREE.Mesh | null }[]
  >([]);

  useFrame(() => {
    if (!parseResult || holes.length === 0) return;
    const { currentMoveIndex, currentT } = useSimStore.getState();
    holes.forEach((hole, i) => {
      const refs = boreRefs.current[i];
      if (!refs?.wall) return;
      const tipZ = holeProgressDepth(
        hole,
        currentMoveIndex,
        currentT,
        parseResult.moves,
      );
      if (tipZ >= -0.05) {
        refs.wall.visible = false;
        if (refs.cone) refs.cone.visible = false;
        if (refs.lip) refs.lip.visible = false;
        return;
      }
      refs.wall.visible = true;
      if (refs.lip) refs.lip.visible = true;

      const half = THREE.MathUtils.degToRad(hole.pointAngle / 2);
      const tipH = Math.max(hole.radius * 0.55, hole.radius / Math.tan(half));
      // 圆柱段：从顶面到锥底上沿
      const cylBottom = Math.min(0, tipZ + tipH);
      const cylDepth = Math.max(0.15, -cylBottom);
      const through = tipZ <= -stockHeight + 0.2;

      refs.wall.scale.set(1, cylDepth, 1);
      refs.wall.position.y = -cylDepth / 2;

      if (refs.cone) {
        if (through) {
          refs.cone.visible = false;
        } else {
          refs.cone.visible = true;
          const coneH = Math.min(tipH, Math.max(0.2, -tipZ - cylDepth + tipH * 0.15));
          refs.cone.scale.set(1, Math.max(0.05, coneH / tipH), 1);
          refs.cone.position.y = -cylDepth - coneH / 2;
        }
      }
    });
  });

  if (holes.length === 0) return null;

  return (
    <group ref={groupRef}>
      {holes.map((hole, i) => {
        const half = THREE.MathUtils.degToRad(hole.pointAngle / 2);
        const tipH = Math.max(hole.radius * 0.55, hole.radius / Math.tan(half));
        // CNC (x,y) → Three (x, y=z, z=-y)
        const px = hole.x;
        const pz = -hole.y;
        return (
          <group key={`${hole.x}_${hole.y}_${i}`} position={[px, 0, pz]}>
            {/* 孔口倒角环 */}
            <mesh
              ref={(el) => {
                if (!boreRefs.current[i]) boreRefs.current[i] = { wall: null, cone: null, lip: null };
                boreRefs.current[i].lip = el;
              }}
              position={[0, -0.15, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              visible={false}
            >
              <ringGeometry
                args={[hole.radius * 0.92, hole.radius * 1.12, 28]}
              />
              <primitive object={floorMat} attach="material" />
            </mesh>
            {/* 孔壁：开口圆筒（内壁） */}
            <mesh
              ref={(el) => {
                if (!boreRefs.current[i]) boreRefs.current[i] = { wall: null, cone: null, lip: null };
                boreRefs.current[i].wall = el;
              }}
              visible={false}
              castShadow
              receiveShadow
            >
              <cylinderGeometry
                args={[hole.radius * 0.98, hole.radius * 0.98, 1, 32, 1, true]}
              />
              <primitive object={wallMat} attach="material" />
            </mesh>
            {/* 钻尖锥底 */}
            <mesh
              ref={(el) => {
                if (!boreRefs.current[i]) boreRefs.current[i] = { wall: null, cone: null, lip: null };
                boreRefs.current[i].cone = el;
              }}
              rotation={[Math.PI, 0, 0]}
              visible={false}
            >
              <coneGeometry args={[hole.radius * 0.98, tipH, 28]} />
              <primitive object={floorMat} attach="material" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
