"use client";

/**
 * 佳时特 SF-260H 五轴坐标铣磨复合加工中心 — 程序化 3D 模型
 * （机床：佳时特 / 系统：华中 HNC-848D）
 *
 * 运动链：龙门 XYZ + 摇篮式 A/C 双转台；A/C 由仿真 rotary 驱动，
 * 主轴刀尖按工件坐标经正运动学落到世界坐标（立式主轴 + 转台）。
 */

import { useFrame } from "@react-three/fiber";
import { Edges, Text } from "@react-three/drei";
import { useCallback, useEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { useSimStore } from "@/lib/cnc/store";
import { useViewStore } from "@/lib/cnc/viewStore";
import { getToolByNumber, type CncTool } from "@/lib/cnc/tools";
import { workpieceToWorld } from "@/lib/cnc/kinematics";
import { setMachineExportRoot } from "@/lib/cnc/exportModel";
import Sf260Exterior from "@/components/cnc/machines/Sf260Exterior";
import ExplodePart, { explodeAmounts } from "@/components/cnc/machines/ExplodePart";

const TOOL_FALLBACK: CncTool = {
  number: 1,
  isoCode: "ISO 1641",
  name: "立铣刀 Ø6",
  type: "end_mill",
  category: "铣削",
  diameter: 6,
  length: 20,
  flutes: 3,
  shankDiameter: 6,
  color: "#e8c878",
  surfaceSpeed: 250,
  chipLoad: 0.05,
  description: "默认立铣刀",
};

function useMetal(color: string, rough = 0.35, metal = 0.9) {
  return useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color,
        roughness: rough,
        metalness: metal,
      }),
    [color, rough, metal],
  );
}

function ToolGeometry({
  tool,
  toolLen,
  mat,
}: {
  tool: CncTool;
  toolLen: number;
  mat: THREE.Material;
}) {
  const r = tool.diameter / 2;
  if (tool.type === "face_mill") {
    return (
      <group>
        <mesh position={[0, toolLen * 0.55, 0]} castShadow>
          <cylinderGeometry args={[tool.shankDiameter / 2, tool.shankDiameter / 2, toolLen * 0.45, 16]} />
          <primitive object={mat} attach="material" />
        </mesh>
        <mesh position={[0, toolLen * 0.18, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[r * 1.4, r * 1.4, 4, 32]} />
          <meshStandardMaterial color="#4b5563" roughness={0.45} metalness={0.7} />
        </mesh>
        <mesh position={[0, toolLen * 0.18, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[r * 1.15, 1.2, 10, 36]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={0.85} />
        </mesh>
      </group>
    );
  }
  return (
    <group>
      <mesh position={[0, toolLen * 0.7, 0]} castShadow>
        <cylinderGeometry args={[tool.shankDiameter / 2, tool.shankDiameter / 2, toolLen * 0.6, 16]} />
        <primitive object={mat} attach="material" />
      </mesh>
      <mesh position={[0, toolLen * 0.25, 0]} castShadow>
        <cylinderGeometry args={[r + 0.2, r, toolLen * 0.5, 16]} />
        <primitive object={mat} attach="material" />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[r, r, 0.4, 16]} />
        <primitive object={mat} attach="material" />
      </mesh>
    </group>
  );
}

/** 工件 / 刀路随 A、C 转台运动的包裹层 */
export function Sf260WorkRotaryGroup({ children }: { children: ReactNode }) {
  const workpiece = useSimStore((s) => s.workpiece);
  const originDatum = useSimStore((s) => s.originDatum);
  const aRef = useRef<THREE.Group>(null);
  const cRef = useRef<THREE.Group>(null);

  const cx = originDatum === "front_left" ? workpiece.width / 2 : 0;
  const cz = originDatum === "front_left" ? -workpiece.depth / 2 : 0;

  useFrame(() => {
    const { a, c } = useSimStore.getState().rotary;
    if (aRef.current) aRef.current.rotation.x = THREE.MathUtils.degToRad(a);
    if (cRef.current) cRef.current.rotation.y = THREE.MathUtils.degToRad(c);
  });

  return (
    <group position={[cx, 0, cz]}>
      <group ref={aRef}>
        <group ref={cRef}>
          <group position={[-cx, 0, -cz]}>{children}</group>
        </group>
      </group>
    </group>
  );
}

/** 摇篮式 A/C 双转台 — 台面顶对齐毛坯底面 (tableTopY = -stockHeight) */
function TrunnionTable({
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
  const fixtureMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#6b7280",
        roughness: 0.42,
        metalness: 0.72,
      }),
    [],
  );
  const slotMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#1f2937",
        roughness: 0.7,
        metalness: 0.45,
      }),
    [],
  );
  const clampMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#374151",
        roughness: 0.35,
        metalness: 0.85,
      }),
    [],
  );

  useFrame(() => {
    const { a, c } = useSimStore.getState().rotary;
    if (aRef.current) aRef.current.rotation.x = THREE.MathUtils.degToRad(a);
    if (cRef.current) cRef.current.rotation.y = THREE.MathUtils.degToRad(c);
  });

  // 台面厚度；C 组局部 Y=0 = 台面顶 = tableTopY
  const plateH = 14;
  const cradleY = tableTopY - 28;
  const pivotY = tableTopY - 8;

  return (
    <group position={[cx, 0, cz]}>
      {/* A 轴摇篮支座 */}
      {([-1, 1] as const).map((side) => (
        <group key={side} position={[side * 78, cradleY, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[20, 56, 72]} />
            <primitive object={cradleMat} attach="material" />
          </mesh>
          <mesh position={[side * -6, 18, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[14, 14, 12, 28]} />
            <primitive object={tableMat} attach="material" />
          </mesh>
          <mesh position={[side * -8, 18, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[6, 6, 8, 16]} />
            <primitive object={accentMat} attach="material" />
          </mesh>
          <mesh position={[0, -32, 0]} castShadow>
            <boxGeometry args={[26, 10, 80]} />
            <primitive object={cradleMat} attach="material" />
          </mesh>
        </group>
      ))}

      <group ref={aRef} position={[0, pivotY, 0]}>
        {/* 摇篮横梁 */}
        <mesh position={[0, -6, 0]} castShadow receiveShadow>
          <boxGeometry args={[128, 16, 54]} />
          <primitive object={cradleMat} attach="material" />
        </mesh>
        <mesh position={[0, -6, 22]} castShadow>
          <boxGeometry args={[110, 8, 8]} />
          <primitive object={tableMat} attach="material" />
        </mesh>
        <mesh position={[0, -6, -22]} castShadow>
          <boxGeometry args={[110, 8, 8]} />
          <primitive object={tableMat} attach="material" />
        </mesh>

        <group ref={cRef} position={[0, tableTopY - pivotY, 0]}>
          {/* C 转台底座：Ø~140，可托住 70×70 毛坯 */}
          <mesh position={[0, -plateH - 5, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[68, 72, 10, 48]} />
            <primitive object={tableMat} attach="material" />
          </mesh>
          {/* T 槽夹具台面 */}
          <mesh position={[0, -plateH / 2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[64, 64, plateH, 48]} />
            <primitive object={fixtureMat} attach="material" />
          </mesh>
          {/* 径向 T 槽 */}
          {Array.from({ length: 8 }).map((_, i) => {
            const ang = (i / 8) * Math.PI * 2;
            return (
              <group key={i} rotation={[0, ang, 0]}>
                <mesh position={[28, 0.2, 0]} receiveShadow>
                  <boxGeometry args={[48, 2.2, 5]} />
                  <primitive object={slotMat} attach="material" />
                </mesh>
                <mesh position={[28, -1.2, 0]}>
                  <boxGeometry args={[48, 1.6, 8]} />
                  <primitive object={slotMat} attach="material" />
                </mesh>
              </group>
            );
          })}
          {/* 圆周刻度 */}
          <mesh position={[0, 0.35, 0]}>
            <torusGeometry args={[61, 0.45, 8, 64]} />
            <primitive object={accentMat} attach="material" />
          </mesh>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
            const ang = THREE.MathUtils.degToRad(deg);
            return (
              <mesh
                key={deg}
                position={[Math.cos(ang) * 58, 0.5, Math.sin(ang) * 58]}
                rotation={[0, -ang, 0]}
              >
                <boxGeometry args={[deg % 90 === 0 ? 5 : 2.5, 0.8, 1.2]} />
                <meshStandardMaterial color="#e2e8f0" roughness={0.4} metalness={0.55} />
              </mesh>
            );
          })}
          {/* 压板：放在毛坯外侧（70×70 半宽 35），避免穿入工件 */}
          {[
            { x: -48, z: -42 },
            { x: 48, z: -42 },
            { x: -48, z: 42 },
            { x: 48, z: 42 },
          ].map((p, i) => (
            <group key={i} position={[p.x, 0, p.z]}>
              <mesh position={[0, 3.2, 0]} castShadow>
                <boxGeometry args={[12, 6.4, 9]} />
                <primitive object={clampMat} attach="material" />
              </mesh>
              <mesh position={[0, 7.2, 0]} castShadow>
                <cylinderGeometry args={[2, 2, 3.5, 12]} />
                <meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={0.9} />
              </mesh>
              <mesh position={[i % 2 === 0 ? 7 : -7, 1.1, 0]} castShadow>
                <boxGeometry args={[14, 2.2, 7]} />
                <primitive object={clampMat} attach="material" />
              </mesh>
            </group>
          ))}
          {/* 排屑环槽 */}
          <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[65, 1.8, 10, 48]} />
            <meshStandardMaterial color="#111827" roughness={0.85} metalness={0.3} />
          </mesh>
          <Text
            position={[0, 1.2, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={3.2}
            color="#94a3b8"
            anchorX="center"
            anchorY="middle"
          >
            C-AXIS
          </Text>
        </group>
      </group>

      <Text position={[-78, cradleY + 36, 0]} fontSize={3.2} color="#60a5fa" anchorX="center">
        A
      </Text>
    </group>
  );
}
export default function Sf260Machine() {
  const workpiece = useSimStore((s) => s.workpiece);
  const originDatum = useSimStore((s) => s.originDatum);
  const spindleOn = useSimStore((s) => s.spindleOn);
  const spindleDir = useSimStore((s) => s.spindleDir);
  const spindleRpm = useSimStore((s) => s.spindleRpm);
  const coolant = useSimStore((s) => s.coolant);
  const toolNum = useSimStore((s) => s.tool);
  const showShell = useViewStore((s) => s.showShell);
  const explodeAmount = useViewStore((s) => s.explodeAmount);
  const { internal: internalAmt } = explodeAmounts(explodeAmount, showShell);

  const cx = originDatum === "front_left" ? workpiece.width / 2 : 0;
  const cy = originDatum === "front_left" ? workpiece.depth / 2 : 0;
  const cz = originDatum === "front_left" ? -workpiece.depth / 2 : 0;
  const h = workpiece.height;
  const bridgeY = h + 95;

  const rootRef = useRef<THREE.Group>(null);
  const ySaddleRef = useRef<THREE.Group>(null);
  const xCarriageRef = useRef<THREE.Group>(null);
  const toolAssemblyRef = useRef<THREE.Group>(null);
  const quillRef = useRef<THREE.Mesh>(null);
  const toolRef = useRef<THREE.Group>(null);
  const spinAccum = useRef(0);
  const worldTip = useRef(new THREE.Vector3());

  const bindExportRoot = useCallback((node: THREE.Group | null) => {
    rootRef.current = node;
    setMachineExportRoot(node);
  }, []);

  useEffect(() => () => setMachineExportRoot(null), []);

  const toolDef = useMemo(() => getToolByNumber(toolNum) ?? TOOL_FALLBACK, [toolNum]);
  const toolLen = Math.max(14, Math.min(36, toolDef.length));

  const castMat = useMetal("#3a4250", 0.48, 0.75);
  const panelMat = useMetal("#d7dde6", 0.42, 0.35);
  const darkMat = useMetal("#1f2430", 0.4, 0.85);
  const railMat = useMetal("#9aa3b2", 0.25, 0.95);
  const tableMat = useMetal("#5b6472", 0.45, 0.75);
  const cradleMat = useMetal("#2f3642", 0.4, 0.8);
  const quillMat = useMetal("#c5ccd6", 0.22, 0.95);
  const blueMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#1d4ed8",
        roughness: 0.35,
        metalness: 0.55,
        emissive: "#1e3a8a",
        emissiveIntensity: 0.15,
      }),
    [],
  );
  const accentMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#38bdf8",
        roughness: 0.35,
        metalness: 0.5,
        emissive: "#0ea5e9",
        emissiveIntensity: 0.25,
      }),
    [],
  );
  const toolMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: toolDef.color,
        roughness: 0.25,
        metalness: 0.95,
        emissive: new THREE.Color(toolDef.color).multiplyScalar(0.15),
        emissiveIntensity: 0.4,
      }),
    [toolDef.color],
  );

  useFrame((_, dt) => {
    const { position: pos, rotary } = useSimStore.getState();
    // 相对转台中心的工件坐标 → 世界刀尖
    workpieceToWorld(
      { x: pos.x - cx, y: pos.y - cy, z: pos.z },
      rotary,
      worldTip.current,
    );
    worldTip.current.x += cx;
    worldTip.current.z += cz;

    const wx = worldTip.current.x;
    const wy = worldTip.current.y;
    const wz = worldTip.current.z;

    if (ySaddleRef.current) ySaddleRef.current.position.z = wz;
    if (xCarriageRef.current) xCarriageRef.current.position.x = wx - cx;
    // 刀尖在世界 Y；套筒从横梁向下
    if (toolAssemblyRef.current) {
      toolAssemblyRef.current.position.y = wy - bridgeY;
    }
    const length = Math.max(8, bridgeY - wy - toolLen);
    if (quillRef.current) {
      quillRef.current.scale.y = length;
      quillRef.current.position.y = -length / 2;
    }
    if (toolRef.current && spindleOn) {
      const visibleSpeed = Math.min(spindleRpm, 6000) / 6000;
      spinAccum.current += dt * spindleDir * (5 + visibleSpeed * 18);
      toolRef.current.rotation.y = spinAccum.current;
    }
  });

  const wOut = 320;
  const dOut = 300;
  const baseTopY = -h - 22;

  return (
    <group ref={bindExportRoot} name="SF-260H_Machine">
      {/* 整机外形外壳（可由视图开关完全隐藏） */}
      {showShell && <Sf260Exterior cx={cx} cz={cz} baseTopY={baseTopY} />}

      {/* 内部结构：力封闭床身 + 立柱 */}
      <group position={[cx, 0, cz]} name="SF260_Structure">
        <ExplodePart offset={[0, -35, 0]} amount={internalAmt} name="Explode_Bed">
          <mesh position={[0, baseTopY - 36, 0]} receiveShadow castShadow name="Bed">
            <boxGeometry args={[wOut + 40, 28, dOut + 30]} />
            <primitive object={castMat} attach="material" />
          </mesh>
          <mesh position={[0, baseTopY - 16, 0]} receiveShadow castShadow>
            <boxGeometry args={[wOut, 18, dOut]} />
            <primitive object={darkMat} attach="material" />
          </mesh>
          <mesh position={[-wOut / 2 + 30, baseTopY + 20, 0]} castShadow>
            <boxGeometry args={[28, 70, dOut - 40]} />
            <primitive object={castMat} attach="material" />
          </mesh>
          <mesh position={[wOut / 2 - 30, baseTopY + 20, 0]} castShadow>
            <boxGeometry args={[28, 70, dOut - 40]} />
            <primitive object={castMat} attach="material" />
          </mesh>
        </ExplodePart>

        {([-1, 1] as const).map((side) => (
          <ExplodePart
            key={side}
            offset={[side * 70, 10, -15]}
            amount={internalAmt}
            name={side < 0 ? "Explode_Column_L" : "Explode_Column_R"}
          >
            <group position={[(wOut / 2 - 28) * side, 70, -20]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[42, 230, 78]} />
                <primitive object={panelMat} attach="material" />
              </mesh>
              <mesh position={[side * -12, 0, 22]}>
                <boxGeometry args={[8, 210, 8]} />
                <primitive object={blueMat} attach="material" />
              </mesh>
              <mesh position={[side * -18, 10, 38]} castShadow>
                <boxGeometry args={[10, 160, 16]} />
                <primitive object={darkMat} attach="material" />
              </mesh>
              <Edges threshold={18} color="#94a3b8" />
            </group>
          </ExplodePart>
        ))}

        <ExplodePart offset={[0, 55, -20]} amount={internalAmt} name="Explode_Crossbeam">
          <mesh position={[0, 178, -20]} castShadow name="Crossbeam_Fixed">
            <boxGeometry args={[wOut - 40, 32, 78]} />
            <primitive object={panelMat} attach="material" />
          </mesh>
          <mesh position={[0, 168, 12]}>
            <boxGeometry args={[wOut - 80, 6, 6]} />
            <primitive object={railMat} attach="material" />
          </mesh>
          <mesh position={[0, 162, 12]}>
            <boxGeometry args={[wOut - 80, 3, 10]} />
            <primitive object={darkMat} attach="material" />
          </mesh>
        </ExplodePart>

        <ExplodePart offset={[-95, 15, -35]} amount={internalAmt} name="Explode_Magazine">
          <group position={[-wOut / 2 - 6, 55, -40]} name="Tool_Magazine">
            <mesh castShadow>
              <cylinderGeometry args={[32, 32, 22, 28]} />
              <primitive object={darkMat} attach="material" />
            </mesh>
            <mesh position={[0, 14, 0]}>
              <cylinderGeometry args={[30, 30, 4, 28]} />
              <primitive object={panelMat} attach="material" />
            </mesh>
            {Array.from({ length: 12 }).map((_, i) => {
              const a = (i / 12) * Math.PI * 2;
              return (
                <group key={i} position={[Math.cos(a) * 22, 12, Math.sin(a) * 22]}>
                  <mesh castShadow>
                    <cylinderGeometry args={[3.2, 3.2, 18, 10]} />
                    <meshStandardMaterial color="#cbd5e1" roughness={0.3} metalness={0.9} />
                  </mesh>
                  <mesh position={[0, 10, 0]}>
                    <cylinderGeometry args={[4, 4, 3, 10]} />
                    <primitive object={blueMat} attach="material" />
                  </mesh>
                </group>
              );
            })}
          </group>
        </ExplodePart>
      </group>

      <ExplodePart offset={[0, -25, 55]} amount={internalAmt} name="Explode_Trunnion">
        <TrunnionTable
          cx={cx}
          cz={cz}
          tableTopY={-h}
          tableMat={tableMat}
          cradleMat={cradleMat}
          accentMat={accentMat}
        />
      </ExplodePart>

      {/* XYZ 龙门主轴：爆炸父级不干扰运动学对 ySaddle / xCarriage 的写入 */}
      <ExplodePart offset={[0, 65, 40]} amount={internalAmt} name="Explode_Gantry">
        <group ref={ySaddleRef} position={[cx, bridgeY, cz]} name="Y_Saddle">
          <mesh castShadow>
            <boxGeometry args={[260, 26, 42]} />
            <primitive object={panelMat} attach="material" />
          </mesh>
          <mesh position={[0, -16, 0]}>
            <boxGeometry args={[240, 5, 5]} />
            <primitive object={railMat} attach="material" />
          </mesh>
          <mesh position={[0, -16, 12]}>
            <boxGeometry args={[240, 4, 4]} />
            <primitive object={railMat} attach="material" />
          </mesh>
          <mesh position={[-110, 4, 24]} castShadow>
            <boxGeometry args={[44, 20, 16]} />
            <primitive object={blueMat} attach="material" />
          </mesh>
          <mesh position={[110, 4, 24]} castShadow>
            <boxGeometry args={[44, 20, 16]} />
            <primitive object={blueMat} attach="material" />
          </mesh>
          <mesh position={[0, 14, -22]} castShadow>
            <boxGeometry args={[200, 8, 8]} />
            <primitive object={darkMat} attach="material" />
          </mesh>

          <ExplodePart offset={[0, 25, 35]} amount={internalAmt} name="Explode_Carriage">
            <group ref={xCarriageRef} name="X_Carriage">
              <mesh position={[0, 6, 0]} castShadow>
                <boxGeometry args={[58, 38, 48]} />
                <primitive object={darkMat} attach="material" />
              </mesh>
              <mesh position={[0, 30, 0]} castShadow>
                <cylinderGeometry args={[19, 19, 32, 32]} />
                <primitive object={darkMat} attach="material" />
              </mesh>
              <mesh position={[0, 50, 0]} castShadow>
                <cylinderGeometry args={[13, 15, 12, 28]} />
                <primitive object={castMat} attach="material" />
              </mesh>
              <mesh position={[0, 58, 0]}>
                <cylinderGeometry args={[8, 10, 6, 20]} />
                <primitive object={railMat} attach="material" />
              </mesh>
              <mesh position={[0, 36, 0]}>
                <torusGeometry args={[20, 1.8, 8, 32]} />
                <primitive object={accentMat} attach="material" />
              </mesh>
              <mesh position={[14, 28, 14]} castShadow>
                <cylinderGeometry args={[1.5, 1.5, 36, 8]} />
                <meshStandardMaterial color="#67e8f9" roughness={0.3} metalness={0.6} />
              </mesh>
              <mesh position={[-14, 28, 14]} castShadow>
                <cylinderGeometry args={[1.5, 1.5, 36, 8]} />
                <meshStandardMaterial color="#67e8f9" roughness={0.3} metalness={0.6} />
              </mesh>

              <mesh ref={quillRef} position={[0, -10, 0]} castShadow name="Quill">
                <cylinderGeometry args={[8.5, 8.5, 1, 24]} />
                <primitive object={quillMat} attach="material" />
              </mesh>

              <group ref={toolAssemblyRef} position={[0, -20, 0]} name="Tool_Assembly">
                <mesh position={[0, toolLen, 0]}>
                  <coneGeometry args={[9, 11, 16]} />
                  <primitive object={quillMat} attach="material" />
                </mesh>
                <group ref={toolRef}>
                  <ToolGeometry tool={toolDef} toolLen={toolLen} mat={toolMat} />
                  <mesh position={[0, toolLen + 2, 0]}>
                    <torusGeometry args={[5, 0.6, 8, 24]} />
                    <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.7} />
                  </mesh>
                </group>
                {coolant !== "off" && (
                  <mesh position={[8, 6, 8]} userData={{ skipExport: true }}>
                    <cylinderGeometry args={[0.4, 0.2, 16, 8]} />
                    <meshStandardMaterial
                      color="#7dd3fc"
                      transparent
                      opacity={0.6}
                      emissive="#0ea5e9"
                      emissiveIntensity={0.3}
                    />
                  </mesh>
                )}
              </group>
            </group>
          </ExplodePart>
        </group>
      </ExplodePart>
    </group>
  );
}
