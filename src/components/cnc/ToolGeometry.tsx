"use client";

/**
 * 刀具三维外形 — 钻孔类全场景真实还原
 * 麻花钻(HSS/硬质合金) / NC定心钻 / 中心钻 / 短钻 / 铰刀 / 丝锥 / 倒角刀
 */

import { useMemo } from "react";
import * as THREE from "three";
import type { CncTool } from "@/lib/cnc/tools";

type DrillKind = "twist_hss" | "twist_carbide" | "stub" | "spot" | "center";

function resolveDrillKind(tool: CncTool): DrillKind {
  const name = `${tool.name} ${tool.isoCode}`;
  if (tool.type === "spot_drill") {
    if (/333|中心钻|center/i.test(name)) return "center";
    return "spot";
  }
  if (tool.diameter > 0 && tool.length / tool.diameter < 4.2) return "stub";
  if ((tool.pointAngle ?? 118) >= 135) return "twist_carbide";
  return "twist_hss";
}

function useMetalMat(color: string, rough = 0.3, metal = 0.92) {
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

/** 螺旋容屑槽 + 刃带 */
function HelicalFluteBody({
  radius,
  length,
  y0,
  flutes,
  turns,
  bodyMat,
  grooveColor = "#0f172a",
  landColor = "#e2e8f0",
  coreRatio = 0.34,
  envelopeOpacity = 0.2,
}: {
  radius: number;
  length: number;
  y0: number;
  flutes: number;
  turns: number;
  bodyMat: THREE.Material;
  grooveColor?: string;
  landColor?: string;
  coreRatio?: number;
  envelopeOpacity?: number;
}) {
  const grooveMat = useMetalMat(grooveColor, 0.55, 0.75);
  const landMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: landColor,
        roughness: 0.2,
        metalness: 0.98,
        emissive: landColor,
        emissiveIntensity: 0.06,
      }),
    [landColor],
  );

  const { grooves, lands } = useMemo(() => {
    const nFlutes = Math.max(2, Math.min(8, flutes || 2));
    const segs = Math.max(40, Math.ceil(length * 4));
    const grooveCurves: THREE.CatmullRomCurve3[] = [];
    const landBoxes: {
      pos: [number, number, number];
      rot: [number, number, number];
      size: [number, number, number];
    }[] = [];

    for (let f = 0; f < nFlutes; f++) {
      const phase = (f / nFlutes) * Math.PI * 2;
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= segs; i++) {
        const t = i / segs;
        const ang = phase + t * turns * Math.PI * 2;
        pts.push(
          new THREE.Vector3(
            Math.cos(ang) * radius * 0.52,
            y0 + t * length,
            Math.sin(ang) * radius * 0.52,
          ),
        );
      }
      grooveCurves.push(new THREE.CatmullRomCurve3(pts));

      const landSegs = Math.max(28, Math.ceil(length * 3.2));
      for (let i = 0; i < landSegs; i++) {
        const t = (i + 0.5) / landSegs;
        const ang = phase + t * turns * Math.PI * 2 + Math.PI / nFlutes;
        const y = y0 + t * length;
        const pitch = (turns * Math.PI * 2 * radius) / Math.max(length, 1);
        const helixPitchAng = Math.atan(pitch);
        landBoxes.push({
          pos: [Math.cos(ang) * radius * 0.93, y, Math.sin(ang) * radius * 0.93],
          rot: [helixPitchAng * 0.12, -ang, helixPitchAng],
          size: [
            Math.max(0.3, radius * 0.26),
            Math.max(0.45, length / landSegs + 0.12),
            Math.max(0.22, radius * 0.16),
          ],
        });
      }
    }
    return { grooves: grooveCurves, lands: landBoxes };
  }, [radius, length, y0, flutes, turns]);

  const tubeR = Math.max(0.28, radius * 0.4);

  return (
    <group>
      <mesh position={[0, y0 + length / 2, 0]} castShadow>
        <cylinderGeometry args={[radius * coreRatio, radius * (coreRatio + 0.06), length, 14]} />
        <primitive object={bodyMat} attach="material" />
      </mesh>
      {envelopeOpacity > 0 && (
        <mesh position={[0, y0 + length / 2, 0]}>
          <cylinderGeometry args={[radius, radius * 0.98, length, 28]} />
          <meshStandardMaterial
            color="#94a3b8"
            roughness={0.35}
            metalness={0.9}
            transparent
            opacity={envelopeOpacity}
            depthWrite={false}
          />
        </mesh>
      )}
      {grooves.map((curve, i) => (
        <mesh key={`g${i}`} castShadow>
          <tubeGeometry args={[curve, 72, tubeR, 10, false]} />
          <primitive object={grooveMat} attach="material" />
        </mesh>
      ))}
      {lands.map((b, i) => (
        <mesh key={`l${i}`} position={b.pos} rotation={b.rot} castShadow>
          <boxGeometry args={b.size} />
          <primitive object={landMat} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

function DrillPoint({
  radius,
  pointDeg,
  mat,
}: {
  radius: number;
  pointDeg: number;
  mat: THREE.Material;
}) {
  const halfRad = THREE.MathUtils.degToRad(pointDeg / 2);
  const tipH = Math.max(radius * 0.65, radius / Math.tan(halfRad));
  return (
    <group>
      <mesh position={[0, tipH / 2, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[radius, tipH, 22]} />
        <primitive object={mat} attach="material" />
      </mesh>
      {/* 横刃 */}
      <mesh position={[0, tipH * 0.12, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[radius * 0.2, radius * 1.65, Math.max(0.25, radius * 0.12)]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.22} metalness={0.96} />
      </mesh>
      {/* 主切削刃棱线 */}
      {[0, 1].map((i) => {
        const a = (i * Math.PI) + Math.PI / 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * radius * 0.45, tipH * 0.4, Math.sin(a) * radius * 0.45]}
            rotation={[0.4, -a, 0.2]}
          >
            <boxGeometry args={[radius * 0.08, tipH * 0.7, radius * 0.08]} />
            <meshStandardMaterial color="#fff" roughness={0.15} metalness={1} />
          </mesh>
        );
      })}
    </group>
  );
}

function Shank({
  radius,
  y0,
  length,
  mat,
  flats = false,
}: {
  radius: number;
  y0: number;
  length: number;
  mat: THREE.Material;
  flats?: boolean;
}) {
  return (
    <group>
      <mesh position={[0, y0 + length / 2, 0]} castShadow>
        <cylinderGeometry args={[radius, radius, length, 22]} />
        <primitive object={mat} attach="material" />
      </mesh>
      <mesh position={[0, y0 + length - 0.15, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[radius * 1.02, radius * 0.32, 16]} />
        <primitive object={mat} attach="material" />
      </mesh>
      {flats && (
        <mesh position={[radius * 0.85, y0 + length * 0.55, 0]}>
          <boxGeometry args={[radius * 0.35, length * 0.45, radius * 1.6]} />
          <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.85} />
        </mesh>
      )}
    </group>
  );
}

/** 通用麻花钻（HSS 118° / 硬质合金 140° / 短钻） */
function TwistDrill({
  tool,
  toolLen,
  mat,
  kind,
}: {
  tool: CncTool;
  toolLen: number;
  mat: THREE.Material;
  kind: DrillKind;
}) {
  const r = Math.max(0.55, tool.diameter / 2);
  const pointDeg = tool.pointAngle ?? (kind === "twist_carbide" ? 140 : 118);
  const halfRad = THREE.MathUtils.degToRad(pointDeg / 2);
  const tipH = Math.max(r * 0.65, r / Math.tan(halfRad));
  const shankR = Math.max(r, tool.shankDiameter / 2);
  const stub = kind === "stub";
  const carbide = kind === "twist_carbide";
  const shankLen = stub
    ? Math.max(toolLen * 0.38, 5)
    : Math.max(toolLen * 0.26, 5);
  const fluteLen = Math.max(
    toolLen - shankLen - tipH * 0.5,
    stub ? toolLen * 0.35 : toolLen * 0.48,
  );
  const fluteY0 = tipH * 0.82;
  const turns = stub
    ? Math.max(1.1, fluteLen / (r * 7))
    : carbide
      ? Math.max(1.8, fluteLen / (r * 5.2))
      : Math.max(2.0, fluteLen / (r * 4.8));

  const bodyMat = useMemo(() => {
    if (carbide) {
      return new THREE.MeshStandardMaterial({
        color: tool.color,
        roughness: 0.28,
        metalness: 0.85,
        emissive: "#334155",
        emissiveIntensity: 0.12,
      });
    }
    return mat;
  }, [carbide, tool.color, mat]);

  return (
    <group>
      <DrillPoint radius={r} pointDeg={pointDeg} mat={bodyMat} />
      <HelicalFluteBody
        radius={r}
        length={fluteLen}
        y0={fluteY0}
        flutes={tool.flutes || 2}
        turns={turns}
        bodyMat={bodyMat}
        grooveColor={carbide ? "#1e293b" : "#0f172a"}
        landColor={carbide ? "#cbd5e1" : "#e8eef5"}
        coreRatio={carbide ? 0.4 : 0.32}
        envelopeOpacity={carbide ? 0.28 : 0.18}
      />
      <Shank
        radius={shankR}
        y0={fluteY0 + fluteLen}
        length={shankLen}
        mat={bodyMat}
        flats={carbide}
      />
    </group>
  );
}

/** NC 定心钻：短刚性、90° 尖、浅螺旋槽 */
function SpotDrill({
  tool,
  toolLen,
  mat,
}: {
  tool: CncTool;
  toolLen: number;
  mat: THREE.Material;
}) {
  const r = Math.max(0.8, tool.diameter / 2);
  const pointDeg = tool.pointAngle ?? 90;
  const halfRad = THREE.MathUtils.degToRad(pointDeg / 2);
  const tipH = Math.max(r * 0.9, r / Math.tan(halfRad));
  const bodyLen = Math.max(toolLen * 0.45, tipH + 2);
  const shankR = Math.max(r, tool.shankDiameter / 2);
  const shankLen = Math.max(toolLen * 0.4, 5);
  const pinkMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: tool.color,
        roughness: 0.32,
        metalness: 0.88,
      }),
    [tool.color],
  );

  return (
    <group>
      <DrillPoint radius={r} pointDeg={pointDeg} mat={pinkMat} />
      {/* 短刃部 + 浅螺旋 */}
      <HelicalFluteBody
        radius={r}
        length={bodyLen}
        y0={tipH * 0.75}
        flutes={2}
        turns={0.65}
        bodyMat={pinkMat}
        grooveColor="#3f1f1f"
        landColor="#fecaca"
        coreRatio={0.48}
        envelopeOpacity={0.25}
      />
      <mesh position={[0, tipH * 0.75 + bodyLen + 1, 0]} castShadow>
        <cylinderGeometry args={[shankR * 1.05, shankR * 1.05, 2.2, 20]} />
        <primitive object={mat} attach="material" />
      </mesh>
      <Shank
        radius={shankR}
        y0={tipH * 0.75 + bodyLen + 2}
        length={shankLen}
        mat={mat}
      />
    </group>
  );
}

/** DIN 333 中心钻：阶梯 — 导引尖 + 60° 锪窝锥 + 粗柄 */
function CenterDrill({
  tool,
  toolLen,
  mat,
}: {
  tool: CncTool;
  toolLen: number;
  mat: THREE.Material;
}) {
  const bodyR = Math.max(1.2, tool.diameter / 2);
  const pilotR = bodyR * 0.38;
  const tipH = pilotR * 1.1;
  const pilotLen = Math.max(2.5, bodyR * 1.2);
  const coneH = bodyR * 1.15; // ~60°
  const bodyLen = Math.max(toolLen * 0.35, 4);
  const shankLen = Math.max(toolLen * 0.35, 5);

  return (
    <group>
      {/* 导引尖 */}
      <mesh position={[0, tipH / 2, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[pilotR, tipH, 16]} />
        <primitive object={mat} attach="material" />
      </mesh>
      <mesh position={[0, tipH + pilotLen / 2, 0]} castShadow>
        <cylinderGeometry args={[pilotR, pilotR, pilotLen, 14]} />
        <primitive object={mat} attach="material" />
      </mesh>
      {/* 60° 锪窝锥 */}
      <mesh
        position={[0, tipH + pilotLen + coneH / 2, 0]}
        rotation={[Math.PI, 0, 0]}
        castShadow
      >
        <coneGeometry args={[bodyR, coneH, 20]} />
        <primitive object={mat} attach="material" />
      </mesh>
      {/* 本体短槽 */}
      <HelicalFluteBody
        radius={bodyR}
        length={bodyLen}
        y0={tipH + pilotLen + coneH * 0.85}
        flutes={2}
        turns={0.45}
        bodyMat={mat}
        coreRatio={0.5}
        envelopeOpacity={0.15}
      />
      <Shank
        radius={bodyR}
        y0={tipH + pilotLen + coneH * 0.85 + bodyLen}
        length={shankLen}
        mat={mat}
      />
    </group>
  );
}

/** 精密铰刀：多刃、微锥导入、直/微螺旋槽 */
function ReamerTool({
  tool,
  toolLen,
  mat,
}: {
  tool: CncTool;
  toolLen: number;
  mat: THREE.Material;
}) {
  const r = Math.max(0.7, tool.diameter / 2);
  const leadH = r * 1.4;
  const fluteLen = toolLen * 0.58;
  const shankR = tool.shankDiameter / 2;
  const shankLen = toolLen * 0.32;
  const blueMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: tool.color,
        roughness: 0.25,
        metalness: 0.92,
      }),
    [tool.color],
  );

  return (
    <group>
      {/* 导入锥 */}
      <mesh position={[0, leadH / 2, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[r, leadH, 18]} />
        <primitive object={blueMat} attach="material" />
      </mesh>
      <HelicalFluteBody
        radius={r}
        length={fluteLen}
        y0={leadH * 0.7}
        flutes={tool.flutes || 6}
        turns={0.85}
        bodyMat={blueMat}
        grooveColor="#1e3a5f"
        landColor="#dbeafe"
        coreRatio={0.55}
        envelopeOpacity={0.3}
      />
      {/* 校准圆柱带 */}
      <mesh position={[0, leadH * 0.7 + fluteLen + 1, 0]} castShadow>
        <cylinderGeometry args={[r * 1.01, r * 1.01, 2.4, 24]} />
        <meshStandardMaterial color="#eff6ff" roughness={0.15} metalness={0.98} />
      </mesh>
      <Shank
        radius={Math.max(r, shankR)}
        y0={leadH * 0.7 + fluteLen + 2.2}
        length={shankLen}
        mat={mat}
      />
    </group>
  );
}

/** 螺旋槽丝锥：容屑槽 + 螺纹牙 */
function TapTool({
  tool,
  toolLen,
  mat,
}: {
  tool: CncTool;
  toolLen: number;
  mat: THREE.Material;
}) {
  const r = Math.max(1, tool.diameter / 2);
  const pitch = Math.max(0.7, r * 0.28); // 近似螺距
  const threadLen = toolLen * 0.55;
  const chamferLen = pitch * 3.5;
  const shankLen = toolLen * 0.35;
  const flutes = tool.flutes || 3;

  const threads = useMemo(() => {
    const n = Math.max(8, Math.floor(threadLen / pitch));
    return Array.from({ length: n }, (_, i) => i);
  }, [threadLen, pitch]);

  return (
    <group>
      {/* 切削锥（倒角牙） */}
      <mesh position={[0, chamferLen / 2, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[r, chamferLen, 18]} />
        <primitive object={mat} attach="material" />
      </mesh>
      {/* 螺纹牙（环叠近似） */}
      {threads.map((i) => {
        const y = chamferLen * 0.7 + i * pitch;
        const taper = i < 3 ? 0.75 + i * 0.08 : 1;
        return (
          <mesh key={i} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[r * 0.82 * taper, pitch * 0.28, 6, 20]} />
            <meshStandardMaterial color="#e0f2fe" roughness={0.25} metalness={0.95} />
          </mesh>
        );
      })}
      {/* 螺旋容屑槽切过螺纹 */}
      <HelicalFluteBody
        radius={r * 0.95}
        length={threadLen}
        y0={chamferLen * 0.5}
        flutes={flutes}
        turns={1.6}
        bodyMat={mat}
        grooveColor="#0c4a6e"
        landColor="#7dd3fc"
        coreRatio={0.42}
        envelopeOpacity={0.08}
      />
      <mesh position={[0, chamferLen * 0.5 + threadLen + 1.5, 0]} castShadow>
        <cylinderGeometry args={[r * 0.7, r * 0.7, 3, 16]} />
        <primitive object={mat} attach="material" />
      </mesh>
      <Shank
        radius={tool.shankDiameter / 2}
        y0={chamferLen * 0.5 + threadLen + 3}
        length={shankLen}
        mat={mat}
        flats
      />
    </group>
  );
}

/** 倒角刀 */
function ChamferTool({
  tool,
  toolLen,
  mat,
}: {
  tool: CncTool;
  toolLen: number;
  mat: THREE.Material;
}) {
  const r = tool.diameter / 2;
  const pointDeg = tool.pointAngle ?? 90;
  const halfRad = THREE.MathUtils.degToRad(pointDeg / 2);
  const tipH = Math.max(r * 0.85, r / Math.tan(halfRad));
  return (
    <group>
      <mesh position={[0, tipH / 2, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[r, tipH, 20]} />
        <primitive object={mat} attach="material" />
      </mesh>
      <HelicalFluteBody
        radius={r * 0.7}
        length={toolLen * 0.35}
        y0={tipH * 0.7}
        flutes={tool.flutes || 2}
        turns={0.5}
        bodyMat={mat}
        coreRatio={0.45}
      />
      <Shank
        radius={tool.shankDiameter / 2}
        y0={tipH * 0.7 + toolLen * 0.35}
        length={toolLen * 0.4}
        mat={mat}
      />
    </group>
  );
}

export default function ToolGeometry({
  tool,
  toolLen,
  mat,
}: {
  tool: CncTool;
  toolLen: number;
  mat: THREE.Material;
}) {
  const r = tool.diameter / 2;

  switch (tool.type) {
    case "drill": {
      const kind = resolveDrillKind(tool);
      return <TwistDrill tool={tool} toolLen={toolLen} mat={mat} kind={kind} />;
    }
    case "spot_drill": {
      const kind = resolveDrillKind(tool);
      if (kind === "center") {
        return <CenterDrill tool={tool} toolLen={toolLen} mat={mat} />;
      }
      return <SpotDrill tool={tool} toolLen={toolLen} mat={mat} />;
    }
    case "reamer":
      return <ReamerTool tool={tool} toolLen={toolLen} mat={mat} />;
    case "tap":
      return <TapTool tool={tool} toolLen={toolLen} mat={mat} />;
    case "chamfer":
      return <ChamferTool tool={tool} toolLen={toolLen} mat={mat} />;

    case "end_mill":
    case "roughing_end_mill":
    case "bull_nose":
      return (
        <group>
          <HelicalFluteBody
            radius={r}
            length={toolLen * 0.5}
            y0={0.35}
            flutes={tool.flutes || 3}
            turns={tool.type === "roughing_end_mill" ? 0.9 : 1.15}
            bodyMat={mat}
          />
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[r, r, 0.45, 16]} />
            <primitive object={mat} attach="material" />
          </mesh>
          {tool.cornerRadius && tool.cornerRadius > 0 && (
            <mesh position={[0, tool.cornerRadius * 0.15, 0]}>
              <torusGeometry args={[r - tool.cornerRadius, tool.cornerRadius, 8, 20]} />
              <primitive object={mat} attach="material" />
            </mesh>
          )}
          <Shank
            radius={tool.shankDiameter / 2}
            y0={toolLen * 0.52}
            length={toolLen * 0.42}
            mat={mat}
          />
        </group>
      );

    case "ball_nose":
      return (
        <group>
          <mesh position={[0, 0, 0]} castShadow>
            <sphereGeometry args={[r, 18, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <primitive object={mat} attach="material" />
          </mesh>
          <HelicalFluteBody
            radius={r}
            length={toolLen * 0.42}
            y0={r * 0.8}
            flutes={tool.flutes || 2}
            turns={1.05}
            bodyMat={mat}
          />
          <Shank
            radius={tool.shankDiameter / 2}
            y0={r * 0.8 + toolLen * 0.42}
            length={toolLen * 0.4}
            mat={mat}
          />
        </group>
      );

    case "face_mill":
    case "fly_cutter":
      return (
        <group>
          <mesh position={[0, toolLen * 0.55, 0]} castShadow>
            <cylinderGeometry
              args={[tool.shankDiameter / 2, tool.shankDiameter / 2, toolLen * 0.45, 16]}
            />
            <primitive object={mat} attach="material" />
          </mesh>
          <mesh position={[0, toolLen * 0.18, 0]} castShadow>
            <cylinderGeometry args={[r, r, toolLen * 0.28, 28]} />
            <meshStandardMaterial color="#4b5563" roughness={0.45} metalness={0.7} />
          </mesh>
          {Array.from({ length: tool.flutes || 5 }).map((_, i) => {
            const n = tool.flutes || 5;
            const a = (i / n) * Math.PI * 2;
            return (
              <mesh
                key={i}
                position={[Math.cos(a) * r * 0.82, 0.15, Math.sin(a) * r * 0.82]}
                castShadow
              >
                <boxGeometry args={[Math.max(2, r * 0.22), 1.2, 2]} />
                <meshStandardMaterial color="#cbd5e1" roughness={0.2} metalness={0.95} />
              </mesh>
            );
          })}
        </group>
      );

    case "thread_mill":
      return (
        <group>
          <HelicalFluteBody
            radius={r}
            length={toolLen * 0.55}
            y0={0.5}
            flutes={tool.flutes || 4}
            turns={2.2}
            bodyMat={mat}
            landColor="#e9d5ff"
          />
          {Array.from({ length: 6 }).map((_, i) => (
            <mesh
              key={i}
              position={[0, 1 + i * (toolLen * 0.08), 0]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <torusGeometry args={[r * 0.75, 0.25, 6, 16]} />
              <meshStandardMaterial color="#f5d0fe" roughness={0.3} metalness={0.9} />
            </mesh>
          ))}
          <Shank
            radius={tool.shankDiameter / 2}
            y0={toolLen * 0.58}
            length={toolLen * 0.35}
            mat={mat}
          />
        </group>
      );

    default:
      return (
        <mesh position={[0, toolLen / 2, 0]} castShadow>
          <cylinderGeometry args={[r, r, toolLen, 16]} />
          <primitive object={mat} attach="material" />
        </mesh>
      );
  }
}
