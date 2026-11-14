"use client";

/**
 * SF-260H 摇篮式 A/C 双转台 — 仿实机 DD 转台结构
 * 台面顶面 Y = tableTopY（对齐毛坯底面）
 */

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useSimStore } from "@/lib/cnc/store";

export default function Sf260Trunnion({
  cx,
  cz,
  tableTopY,
  tableMat,
  cradleMat,
  accentMat,
}: {
  cx: number;
  cz: number;
  tableTopY: number;
  tableMat: THREE.Material;
  cradleMat: THREE.Material;
  accentMat: THREE.Material;
}) {
  const aRef = useRef<THREE.Group>(null);
  const cRef = useRef<THREE.Group>(null);

  const steelMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#8b939e",
        roughness: 0.28,
        metalness: 0.92,
      }),
    [],
  );
  const tableTopMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#9aa3ad",
        roughness: 0.2,
        metalness: 0.96,
      }),
    [],
  );
  const castDark = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#2a3038",
        roughness: 0.55,
        metalness: 0.55,
      }),
    [],
  );
  const slotMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#151a20",
        roughness: 0.75,
        metalness: 0.35,
      }),
    [],
  );
  const clampMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#3d4450",
        roughness: 0.32,
        metalness: 0.88,
      }),
    [],
  );
  const sealMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#1a1f26",
        roughness: 0.9,
        metalness: 0.15,
      }),
    [],
  );

  useFrame(() => {
    const { a, c } = useSimStore.getState().rotary;
    if (aRef.current) aRef.current.rotation.x = THREE.MathUtils.degToRad(a);
    if (cRef.current) cRef.current.rotation.y = THREE.MathUtils.degToRad(c);
  });

  const pivotY = tableTopY - 12;
  const houseY = pivotY;
  const plateH = 16;
  const tableR = 62;
  const armSpan = 86;

  return (
    <group position={[cx, 0, cz]} name="Trunnion_AC">
      {/* 底座托板 */}
      <mesh position={[0, tableTopY - 52, 0]} castShadow receiveShadow>
        <boxGeometry args={[210, 14, 120]} />
        <primitive object={cradleMat} attach="material" />
      </mesh>
      <mesh position={[0, tableTopY - 44, 0]} castShadow receiveShadow>
        <boxGeometry args={[198, 6, 108]} />
        <primitive object={castDark} attach="material" />
      </mesh>
      {([-88, 88] as const).flatMap((x) =>
        ([-48, 48] as const).map((z) => (
          <mesh key={`${x}_${z}`} position={[x, tableTopY - 44.5, z]}>
            <cylinderGeometry args={[3.2, 3.2, 5, 10]} />
            <primitive object={steelMat} attach="material" />
          </mesh>
        )),
      )}

      {/* A 轴左右支座 */}
      {([-1, 1] as const).map((side) => (
        <group key={side} position={[side * armSpan, houseY, 0]}>
          <mesh position={[side * 4, -8, 0]} castShadow receiveShadow>
            <boxGeometry args={[28, 64, 78]} />
            <primitive object={cradleMat} attach="material" />
          </mesh>
          <mesh position={[side * 4, -18, 28]} castShadow>
            <boxGeometry args={[22, 36, 8]} />
            <primitive object={castDark} attach="material" />
          </mesh>
          <mesh position={[side * 4, -18, -28]} castShadow>
            <boxGeometry args={[22, 36, 8]} />
            <primitive object={castDark} attach="material" />
          </mesh>
          {/* 主轴承盖 */}
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[22, 22, 16, 36]} />
            <primitive object={steelMat} attach="material" />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} position={[side * -2, 0, 0]}>
            <cylinderGeometry args={[16, 16, 6, 32]} />
            <primitive object={tableMat} attach="material" />
          </mesh>
          {Array.from({ length: 8 }).map((_, i) => {
            const ang = (i / 8) * Math.PI * 2;
            return (
              <mesh
                key={i}
                position={[side * -6, Math.cos(ang) * 18, Math.sin(ang) * 18]}
                rotation={[0, 0, Math.PI / 2]}
              >
                <cylinderGeometry args={[1.4, 1.4, 3, 8]} />
                <primitive object={steelMat} attach="material" />
              </mesh>
            );
          })}
          {side < 0 ? (
            <group position={[side * 22, 0, 0]}>
              <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[18, 20, 28, 28]} />
                <primitive object={castDark} attach="material" />
              </mesh>
              <mesh position={[side * 16, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[14, 14, 6, 24]} />
                <primitive object={accentMat} attach="material" />
              </mesh>
              <mesh position={[side * 10, 14, 0]}>
                <boxGeometry args={[10, 8, 16]} />
                <primitive object={castDark} attach="material" />
              </mesh>
            </group>
          ) : (
            <group position={[side * 18, 0, 0]}>
              <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[12, 14, 18, 24]} />
                <primitive object={castDark} attach="material" />
              </mesh>
              <mesh position={[side * 10, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[8, 8, 4, 16]} />
                <primitive object={steelMat} attach="material" />
              </mesh>
            </group>
          )}
          <mesh position={[side * 2, -36, 0]} castShadow>
            <boxGeometry args={[32, 12, 86]} />
            <primitive object={cradleMat} attach="material" />
          </mesh>
        </group>
      ))}

      {/* A 摇篮 */}
      <group ref={aRef} position={[0, pivotY, 0]} name="A_Cradle">
        {([-1, 1] as const).map((side) => (
          <mesh
            key={side}
            position={[side * (armSpan - 10), 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          >
            <cylinderGeometry args={[10, 10, 22, 24]} />
            <primitive object={steelMat} attach="material" />
          </mesh>
        ))}
        {([-1, 1] as const).map((side) => (
          <group key={`arm_${side}`} position={[side * 52, -6, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[18, 28, 70]} />
              <primitive object={cradleMat} attach="material" />
            </mesh>
            <mesh position={[0, 8, 0]} castShadow>
              <boxGeometry args={[14, 10, 58]} />
              <primitive object={castDark} attach="material" />
            </mesh>
            <mesh position={[0, -2, 28]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[8, 8, 14, 16]} />
              <primitive object={cradleMat} attach="material" />
            </mesh>
            <mesh position={[0, -2, -28]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[8, 8, 14, 16]} />
              <primitive object={cradleMat} attach="material" />
            </mesh>
          </group>
        ))}
        <mesh position={[0, -22, 0]} castShadow receiveShadow>
          <boxGeometry args={[108, 12, 78]} />
          <primitive object={cradleMat} attach="material" />
        </mesh>
        <mesh position={[0, -16, 0]} castShadow>
          <cylinderGeometry args={[48, 52, 8, 40]} />
          <primitive object={castDark} attach="material" />
        </mesh>
        {/* C 轴 DD 电机 */}
        <mesh position={[0, -32, 0]} castShadow>
          <cylinderGeometry args={[36, 38, 18, 36]} />
          <primitive object={castDark} attach="material" />
        </mesh>
        <mesh position={[0, -42, 0]} castShadow>
          <cylinderGeometry args={[28, 30, 8, 28]} />
          <primitive object={tableMat} attach="material" />
        </mesh>
        <mesh position={[-40, -28, 36]} castShadow>
          <boxGeometry args={[24, 10, 12]} />
          <primitive object={castDark} attach="material" />
        </mesh>

        {/* C 转台 */}
        <group ref={cRef} position={[0, tableTopY - pivotY, 0]} name="C_Table">
          <mesh position={[0, -plateH - 7, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[tableR + 6, tableR + 10, 10, 48]} />
            <primitive object={steelMat} attach="material" />
          </mesh>
          <mesh position={[0, -plateH - 1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[tableR + 2, 1.6, 8, 48]} />
            <primitive object={sealMat} attach="material" />
          </mesh>
          <mesh position={[0, -plateH / 2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[tableR, tableR, plateH, 48]} />
            <primitive object={tableTopMat} attach="material" />
          </mesh>
          <mesh position={[0, 0.15, 0]} receiveShadow>
            <cylinderGeometry args={[tableR - 1, tableR - 1, 0.4, 48]} />
            <meshStandardMaterial color="#b0b8c2" roughness={0.16} metalness={0.98} />
          </mesh>
          {/* 平行 T 槽 */}
          {[-42, -28, -14, 0, 14, 28, 42].map((z) => (
            <group key={z} position={[0, 0.35, z]}>
              <mesh>
                <boxGeometry args={[tableR * 1.7, 2.4, 4.2]} />
                <primitive object={slotMat} attach="material" />
              </mesh>
              <mesh position={[0, -1.4, 0]}>
                <boxGeometry args={[tableR * 1.7, 1.8, 7.5]} />
                <primitive object={slotMat} attach="material" />
              </mesh>
            </group>
          ))}
          {/* 中心定位孔 */}
          <mesh position={[0, 0.4, 0]}>
            <cylinderGeometry args={[8, 8, 1.2, 24]} />
            <primitive object={slotMat} attach="material" />
          </mesh>
          <mesh position={[0, -4, 0]}>
            <cylinderGeometry args={[6, 7.5, 10, 20]} />
            <primitive object={steelMat} attach="material" />
          </mesh>
          {/* 刻度环 */}
          <mesh position={[0, 0.55, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[tableR - 3, 0.55, 8, 64]} />
            <primitive object={accentMat} attach="material" />
          </mesh>
          {Array.from({ length: 36 }).map((_, i) => {
            const deg = i * 10;
            const ang = THREE.MathUtils.degToRad(deg);
            const major = deg % 90 === 0;
            const mid = deg % 30 === 0;
            const len = major ? 5.5 : mid ? 3.5 : 2;
            return (
              <mesh
                key={deg}
                position={[
                  Math.cos(ang) * (tableR - 5),
                  0.7,
                  Math.sin(ang) * (tableR - 5),
                ]}
                rotation={[0, -ang, 0]}
              >
                <boxGeometry args={[len, 0.6, major ? 1.3 : 0.7]} />
                <meshStandardMaterial
                  color={major ? "#f8fafc" : "#cbd5e1"}
                  roughness={0.35}
                  metalness={0.6}
                />
              </mesh>
            );
          })}
          <mesh position={[0, -2.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[tableR + 1, 2.2, 10, 48]} />
            <primitive object={sealMat} attach="material" />
          </mesh>
          {/* 压板 */}
          {[
            { x: -50, z: -40, rot: 0.3 },
            { x: 50, z: -40, rot: -0.3 },
            { x: -50, z: 40, rot: -0.3 },
            { x: 50, z: 40, rot: 0.3 },
          ].map((p, i) => (
            <group key={i} position={[p.x, 0, p.z]} rotation={[0, p.rot, 0]}>
              <mesh position={[0, 2.8, 0]} castShadow>
                <boxGeometry args={[16, 5.5, 10]} />
                <primitive object={clampMat} attach="material" />
              </mesh>
              <mesh position={[0, 6.5, 0]} castShadow>
                <cylinderGeometry args={[2.4, 2.4, 4, 12]} />
                <primitive object={steelMat} attach="material" />
              </mesh>
              <mesh position={[0, 9, 0]}>
                <cylinderGeometry args={[3.2, 3.2, 1.6, 6]} />
                <primitive object={steelMat} attach="material" />
              </mesh>
              <mesh position={[i % 2 === 0 ? 9 : -9, 1.0, 0]} castShadow>
                <boxGeometry args={[16, 2, 8]} />
                <primitive object={clampMat} attach="material" />
              </mesh>
            </group>
          ))}
        </group>
      </group>
    </group>
  );
}
