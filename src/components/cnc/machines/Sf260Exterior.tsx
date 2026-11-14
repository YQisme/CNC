"use client";

/**
 * SF-260H 整机外形 — 对照佳时特官网 S 系列产品渲染
 * http://www.jstcnc.com.cn/S/1199
 *
 * 白/浅灰封闭立柜、中右亮黄滑门（单条竖向黑玻璃）、门下灰条 SF-260H、
 * 左立面竖排型号与公司名、黄 S 形饰线、右侧贴装 HMI、左侧黑窗与黄检修门、
 * 顶部气动平衡缸、裙边螺栓与调平脚。
 * showEnclosure=true 门关；false 门向右滑开。
 */

import { useFrame } from "@react-three/fiber";
import { RoundedBox, Text } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useSimStore } from "@/lib/cnc/store";
import { useViewStore } from "@/lib/cnc/viewStore";

type GhostMat = THREE.Material & {
  opacity: number;
  transparent: boolean;
  depthWrite: boolean;
  userData: {
    baseOpacity?: number;
    baseTransparent?: boolean;
    baseDepthWrite?: boolean;
  };
};

function applyExteriorGhost(root: THREE.Object3D, amount: number) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const raw of list) {
      const mat = raw as GhostMat;
      if (mat.userData.baseOpacity == null) {
        mat.userData.baseOpacity = mat.opacity ?? 1;
        mat.userData.baseTransparent = mat.transparent;
        mat.userData.baseDepthWrite = mat.depthWrite;
      }
      const base = mat.userData.baseOpacity;
      // 播放时压到约 0.22，便于看清内部龙门/刀具
      const ghostOpacity = Math.min(base, 0.22);
      mat.opacity = THREE.MathUtils.lerp(base, ghostOpacity, amount);
      mat.transparent = amount > 0.02 ? true : !!mat.userData.baseTransparent;
      mat.depthWrite = amount > 0.45 ? false : !!mat.userData.baseDepthWrite;
      mat.needsUpdate = true;
    }
  });
}

function canvasTexture(
  w: number,
  h: number,
  paint: (g: CanvasRenderingContext2D, w: number, h: number) => void,
) {
  if (typeof document === "undefined") return new THREE.Texture();
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  if (!g) return new THREE.Texture();
  paint(g, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/** 门与左白板之间的黄 S 形饰带（官网是一条流畅的金色飘带） */
function paintWave(g: CanvasRenderingContext2D, w: number, h: number) {
  g.clearRect(0, 0, w, h);
  const N = 72;
  const mid: { x: number; y: number; hw: number }[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const y = h * (0.015 + t * 0.97);
    const s = Math.sin(t * Math.PI * 1.55 - 0.45);
    const taper = Math.sin(Math.PI * t);
    mid.push({
      x: w * 0.48 + s * w * 0.26,
      y,
      hw: 10 + taper * 22,
    });
  }
  const drawRibbon = (shift: number, scale: number, color: string) => {
    const left: { x: number; y: number }[] = [];
    const right: { x: number; y: number }[] = [];
    for (let i = 0; i <= N; i++) {
      const p = mid[i];
      const prev = mid[Math.max(0, i - 1)];
      const next = mid[Math.min(N, i + 1)];
      let tx = next.x - prev.x;
      let ty = next.y - prev.y;
      const len = Math.hypot(tx, ty) || 1;
      tx /= len;
      ty /= len;
      const hw = p.hw * scale;
      left.push({ x: p.x + shift - ty * hw, y: p.y + tx * hw });
      right.push({ x: p.x + shift + ty * hw * 0.72, y: p.y - tx * hw * 0.72 });
    }
    g.beginPath();
    g.moveTo(left[0].x, left[0].y);
    for (const p of left) g.lineTo(p.x, p.y);
    for (let i = right.length - 1; i >= 0; i--) g.lineTo(right[i].x, right[i].y);
    g.closePath();
    g.fillStyle = color;
    g.fill();
  };
  drawRibbon(0, 1, "#f6c400");
  drawRibbon(18, 0.42, "#ffe08a");
}

/** 观察窗上的小黄警示贴 */
function paintSticker(g: CanvasRenderingContext2D, w: number, h: number) {
  g.fillStyle = "#f6c400";
  g.fillRect(0, 0, w, h);
  g.strokeStyle = "#1a1a1a";
  g.lineWidth = 12;
  g.strokeRect(8, 8, w - 16, h - 16);
  g.beginPath();
  g.moveTo(w * 0.5, 36);
  g.lineTo(w * 0.8, 150);
  g.lineTo(w * 0.2, 150);
  g.closePath();
  g.lineWidth = 8;
  g.stroke();
  g.fillStyle = "#1a1a1a";
  g.fillRect(w * 0.5 - 6, 72, 12, 46);
  g.beginPath();
  g.arc(w * 0.5, 132, 7, 0, Math.PI * 2);
  g.fill();
  g.fillRect(28, 176, w - 56, 10);
  g.fillRect(28, 198, w - 80, 8);
  g.fillRect(28, 216, w - 64, 8);
  g.font = "bold 26px sans-serif";
  g.fillText("CAUTION", 36, h - 28);
}

/** 操作台屏幕：华中风格坐标页示意 */
function paintScreen(g: CanvasRenderingContext2D, w: number, h: number) {
  g.fillStyle = "#07111c";
  g.fillRect(0, 0, w, h);
  g.fillStyle = "#12345a";
  g.fillRect(0, 0, w, 36);
  g.fillStyle = "#e8f4ff";
  g.font = "bold 18px sans-serif";
  g.fillText("SF-260H", 14, 24);
  g.font = "14px sans-serif";
  g.fillStyle = "#8ec8ef";
  g.fillText("HNC-848D", 150, 24);
  g.fillStyle = "#22c55e";
  g.beginPath();
  g.arc(w - 22, 18, 6, 0, Math.PI * 2);
  g.fill();

  const rows: [string, string, string][] = [
    ["X", "0.000", "mm"],
    ["Y", "0.000", "mm"],
    ["Z", "120.000", "mm"],
    ["A", "0.000", "deg"],
    ["C", "0.000", "deg"],
  ];
  rows.forEach((row, i) => {
    const y = 58 + i * 36;
    g.fillStyle = i % 2 === 0 ? "#0c1c30" : "#0a1728";
    g.fillRect(10, y - 22, w - 20, 32);
    g.fillStyle = "#67e8f9";
    g.font = "bold 18px monospace";
    g.fillText(row[0], 22, y);
    g.fillStyle = "#f1f5f9";
    g.font = "18px monospace";
    g.fillText(row[1], 150, y);
    g.fillStyle = "#64748b";
    g.font = "12px sans-serif";
    g.fillText(row[2], w - 58, y);
  });

  g.fillStyle = "#0ea5e9";
  g.fillRect(10, h - 42, 86, 30);
  g.fillStyle = "#062033";
  g.font = "bold 14px sans-serif";
  g.fillText("AUTO", 32, h - 22);
  g.fillStyle = "#1e293b";
  g.fillRect(106, h - 42, 70, 30);
  g.fillStyle = "#94a3b8";
  g.fillText("MDI", 124, h - 22);
  g.fillStyle = "#14532d";
  g.fillRect(w - 96, h - 42, 84, 30);
  g.fillStyle = "#bbf7d0";
  g.fillText("READY", w - 82, h - 22);
}

/** JUST 方标 */
function paintLogo(g: CanvasRenderingContext2D, w: number, h: number) {
  g.clearRect(0, 0, w, h);
  g.fillStyle = "#1c2430";
  g.beginPath();
  g.roundRect(6, 6, w - 12, h - 12, 16);
  g.fill();
  g.strokeStyle = "#f5c400";
  g.lineWidth = 14;
  g.lineCap = "round";
  g.lineJoin = "round";
  g.beginPath();
  g.moveTo(46, 40);
  g.lineTo(46, 78);
  g.quadraticCurveTo(46, 104, 74, 104);
  g.lineTo(96, 104);
  g.stroke();
  g.strokeStyle = "#f8fafc";
  g.lineWidth = 10;
  g.beginPath();
  g.moveTo(78, 40);
  g.lineTo(100, 40);
  g.lineTo(100, 62);
  g.stroke();
}

/** 正面左立面竖排型号：逐字正立、自上而下（S 在上），透明底贴钣金 */
function paintModelPlate(g: CanvasRenderingContext2D, w: number, h: number) {
  g.clearRect(0, 0, w, h);
  g.fillStyle = "#3a4452";
  g.font = `bold ${Math.floor(w * 0.72)}px "Arial", "Helvetica Neue", sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  const chars = ["S", "F", "-", "2", "6", "0", "H"];
  const step = h / (chars.length + 0.35);
  chars.forEach((ch, i) => {
    g.fillText(ch, w * 0.5, step * (i + 0.7));
  });
}

/** 竖排公司名小字 */
function paintCorpPlate(g: CanvasRenderingContext2D, w: number, h: number) {
  g.clearRect(0, 0, w, h);
  g.fillStyle = "#4b5568";
  g.font = `${Math.floor(w * 0.2)}px "Arial", "Helvetica Neue", sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  const lines = ["JIANGSU JUST", "NUMERICAL CONTROL", "TECHNOLOGY", "CO., LTD."];
  const step = h / (lines.length + 0.4);
  lines.forEach((line, i) => {
    g.fillText(line, w * 0.5, step * (i + 0.75));
  });
}

/** 门下灰条型号（横排白字） */
function paintStripLabel(g: CanvasRenderingContext2D, w: number, h: number) {
  g.clearRect(0, 0, w, h);
  g.fillStyle = "#f8fafc";
  g.font = `bold ${Math.floor(h * 0.55)}px "Arial", "Helvetica Neue", sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("SF-260H", w * 0.5, h * 0.52);
}

/** 左侧黄标横排型号（深色字） */
function paintSideTagLabel(g: CanvasRenderingContext2D, w: number, h: number) {
  g.clearRect(0, 0, w, h);
  g.fillStyle = "#1f2937";
  g.font = `bold ${Math.floor(h * 0.55)}px "Arial", "Helvetica Neue", sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("SF-260H", w * 0.5, h * 0.52);
}

function paintMat(color: string, rough: number, coat: number, env = 0.7) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: rough,
    metalness: 0.03,
    clearcoat: coat,
    clearcoatRoughness: 0.42,
    envMapIntensity: env,
  });
}

function Panel({
  size,
  at,
  rot,
  mat,
  name,
  shadow = false,
}: {
  size: [number, number, number];
  at: [number, number, number];
  rot?: [number, number, number];
  mat: THREE.Material;
  name?: string;
  shadow?: boolean;
}) {
  return (
    <mesh
      name={name}
      position={at}
      rotation={rot}
      material={mat}
      castShadow={shadow}
      receiveShadow={shadow}
    >
      <boxGeometry args={size} />
    </mesh>
  );
}

function PictureFrame({
  width,
  height,
  bar,
  depth,
  mat,
  name,
}: {
  width: number;
  height: number;
  bar: number;
  depth: number;
  mat: THREE.Material;
  name?: string;
}) {
  const sideH = Math.max(0.5, height - bar * 2);
  return (
    <group name={name}>
      <Panel size={[width, bar, depth]} at={[0, height / 2 - bar / 2, 0]} mat={mat} />
      <Panel size={[width, bar, depth]} at={[0, -height / 2 + bar / 2, 0]} mat={mat} />
      <Panel size={[bar, sideH, depth]} at={[-width / 2 + bar / 2, 0, 0]} mat={mat} />
      <Panel size={[bar, sideH, depth]} at={[width / 2 - bar / 2, 0, 0]} mat={mat} />
    </group>
  );
}

function LevelFoot({
  at,
  metal,
  rubber,
}: {
  at: [number, number, number];
  metal: THREE.Material;
  rubber: THREE.Material;
}) {
  return (
    <group position={at} name="Leveling_Foot">
      <mesh position={[0, -4.2, 0]} material={metal} castShadow>
        <cylinderGeometry args={[3.2, 3.2, 8.2, 12]} />
      </mesh>
      <mesh position={[0, -8.6, 0]} material={rubber}>
        <cylinderGeometry args={[6.2, 6.2, 2.5, 6]} />
      </mesh>
      <mesh position={[0, -11.2, 0]} material={rubber} receiveShadow>
        <cylinderGeometry args={[14, 15, 3.6, 20]} />
      </mesh>
    </group>
  );
}

function Studs({
  points,
  mat,
  axis,
}: {
  points: [number, number, number][];
  mat: THREE.Material;
  axis: "x" | "z";
}) {
  const rot: [number, number, number] =
    axis === "z" ? [Math.PI / 2, 0, 0] : [0, 0, Math.PI / 2];
  return (
    <group name="Skirt_Bolts">
      {points.map((p, i) => (
        <mesh key={i} position={p} rotation={rot} material={mat}>
          <cylinderGeometry args={[1.45, 1.45, 1.7, 8]} />
        </mesh>
      ))}
    </group>
  );
}

const KEY_COLS = [-22, -11, 0, 11, 22];
const KEY_ROWS = [4, -6, -16, -26];
const CAP_COLORS = ["#dc2626", "#16a34a", "#eab308", "#2563eb"] as const;

/** 螺旋线：从上端托架垂到主体接插件 */
function makeCoil(
  from: [number, number, number],
  to: [number, number, number],
  turns: number,
  rad = 4.0,
) {
  const pts: THREE.Vector3[] = [];
  const n = 100;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const ang = t * turns * Math.PI * 2;
    const envelope = Math.sin(Math.PI * Math.min(1, Math.max(0, (t - 0.02) / 0.96)));
    const r = rad * envelope;
    pts.push(
      new THREE.Vector3(
        THREE.MathUtils.lerp(from[0], to[0], t) + Math.cos(ang) * r,
        THREE.MathUtils.lerp(from[1], to[1], t),
        THREE.MathUtils.lerp(from[2], to[2], t) + Math.sin(ang) * r * 0.75,
      ),
    );
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 140, 1.15, 7, false);
}

export default function Sf260Exterior({
  cx,
  cz,
  baseTopY,
}: {
  cx: number;
  cz: number;
  baseTopY: number;
}) {
  const showEnclosure = useViewStore((s) => s.showEnclosure);
  const playing = useSimStore((s) => s.playing);
  const rootRef = useRef<THREE.Group>(null);
  const doorRef = useRef<THREE.Group>(null);
  const openAmt = useRef(showEnclosure ? 0 : 1);
  const ghostAmt = useRef(playing ? 1 : 0);

  const waveTex = useMemo(() => canvasTexture(256, 1024, paintWave), []);
  const stickerTex = useMemo(() => canvasTexture(256, 320, paintSticker), []);
  const screenTex = useMemo(() => canvasTexture(512, 360, paintScreen), []);
  const logoTex = useMemo(() => canvasTexture(160, 160, paintLogo), []);
  const modelPlateTex = useMemo(() => canvasTexture(128, 640, paintModelPlate), []);
  const corpPlateTex = useMemo(() => canvasTexture(256, 320, paintCorpPlate), []);
  const stripLabelTex = useMemo(() => canvasTexture(512, 96, paintStripLabel), []);
  const sideTagTex = useMemo(() => canvasTexture(512, 96, paintSideTagLabel), []);

  const airGeo = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(-16, 13, 14),
          new THREE.Vector3(-34, 8, 26),
          new THREE.Vector3(-30, -6, 16),
          new THREE.Vector3(-14, -20, 4),
        ]),
        36,
        1.3,
        8,
        false,
      ),
    [],
  );

  const mats = useMemo(() => {
    const cap = (color: string) =>
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.36,
        metalness: 0.18,
        emissive: color,
        emissiveIntensity: 0.14,
      });
    const sheet = paintMat("#f3f5f7", 0.46, 0.24, 0.62);
    const sheetAlt = paintMat("#d5dbe3", 0.52, 0.1, 0.45);
    const yellow = paintMat("#f6c400", 0.34, 0.42, 0.75);
    const yellowDeep = paintMat("#e2ae00", 0.4, 0.3, 0.6);
    // 场景环境贴图很弱，全金属会变成黑杆；用浅色标准材质吃主光，读成拉丝不锈钢
    const stainless = new THREE.MeshStandardMaterial({
      color: "#f7f9fc",
      roughness: 0.22,
      metalness: 0.48,
    });
    const steel = new THREE.MeshStandardMaterial({
      color: "#d5dde6",
      roughness: 0.3,
      metalness: 0.55,
    });
    const cavity = new THREE.MeshStandardMaterial({
      color: "#12161c",
      roughness: 0.62,
      metalness: 0.35,
    });
    const frame = new THREE.MeshStandardMaterial({
      color: "#1a1f26",
      roughness: 0.4,
      metalness: 0.55,
    });
    const glass = new THREE.MeshPhysicalMaterial({
      color: "#8ea0b5",
      roughness: 0.05,
      metalness: 0,
      transmission: 0.18,
      thickness: 0.6,
      ior: 1.45,
      transparent: true,
      opacity: 0.7,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      envMapIntensity: 1.15,
      attenuationColor: "#0d1520",
      attenuationDistance: 1.4,
    });
    const glassSide = new THREE.MeshPhysicalMaterial({
      color: "#141a22",
      roughness: 0.08,
      metalness: 0.08,
      transmission: 0.12,
      thickness: 0.5,
      ior: 1.45,
      transparent: true,
      opacity: 0.78,
      clearcoat: 0.85,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1,
    });
    const streak = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      roughness: 0.04,
      metalness: 0,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    });
    const nameplate = new THREE.MeshPhysicalMaterial({
      color: "#b7c2ce",
      roughness: 0.38,
      metalness: 0.42,
      clearcoat: 0.25,
      clearcoatRoughness: 0.35,
      envMapIntensity: 0.8,
    });
    const seam = new THREE.MeshStandardMaterial({
      color: "#c5ccd6",
      roughness: 0.5,
      metalness: 0.25,
    });
    const seamDark = new THREE.MeshStandardMaterial({
      color: "#8b95a3",
      roughness: 0.48,
      metalness: 0.3,
    });
    const rubber = new THREE.MeshStandardMaterial({
      color: "#14171c",
      roughness: 0.9,
      metalness: 0.04,
    });
    const cableMat = new THREE.MeshStandardMaterial({
      color: "#1a1d22",
      roughness: 0.72,
      metalness: 0.08,
    });
    const blue = new THREE.MeshStandardMaterial({
      color: "#1d4ed8",
      roughness: 0.34,
      metalness: 0.12,
      emissive: "#1e3a8a",
      emissiveIntensity: 0.12,
    });
    const keyDark = new THREE.MeshStandardMaterial({
      color: "#2a313b",
      roughness: 0.55,
      metalness: 0.25,
    });
    const keyLight = new THREE.MeshStandardMaterial({
      color: "#e7ebf0",
      roughness: 0.48,
      metalness: 0.12,
    });
    const screen = new THREE.MeshStandardMaterial({
      map: screenTex,
      emissive: new THREE.Color("#7dd3fc"),
      emissiveMap: screenTex,
      emissiveIntensity: 0.42,
      roughness: 0.28,
      metalness: 0.05,
    });
    const wave = new THREE.MeshBasicMaterial({
      color: "#ffffff",
      map: waveTex,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const sticker = new THREE.MeshStandardMaterial({
      map: stickerTex,
      roughness: 0.58,
      metalness: 0.05,
    });
    const logo = new THREE.MeshStandardMaterial({
      map: logoTex,
      transparent: true,
      roughness: 0.45,
      metalness: 0.1,
      depthWrite: false,
    });
    const modelPlate = new THREE.MeshBasicMaterial({
      map: modelPlateTex,
      transparent: true,
      alphaTest: 0.15,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      side: THREE.FrontSide,
    });
    const corpPlate = new THREE.MeshBasicMaterial({
      map: corpPlateTex,
      transparent: true,
      alphaTest: 0.15,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      side: THREE.FrontSide,
    });
    const stripLabel = new THREE.MeshBasicMaterial({
      map: stripLabelTex,
      transparent: true,
      alphaTest: 0.15,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      side: THREE.FrontSide,
    });
    const sideTagLabel = new THREE.MeshBasicMaterial({
      map: sideTagTex,
      transparent: true,
      alphaTest: 0.15,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      side: THREE.FrontSide,
    });
    const bolt = new THREE.MeshStandardMaterial({
      color: "#3a4250",
      roughness: 0.42,
      metalness: 0.7,
    });
    return {
      sheet,
      sheetAlt,
      yellow,
      yellowDeep,
      stainless,
      steel,
      cavity,
      frame,
      glass,
      glassSide,
      streak,
      nameplate,
      seam,
      seamDark,
      rubber,
      cableMat,
      blue,
      keyDark,
      keyLight,
      screen,
      wave,
      sticker,
      logo,
      modelPlate,
      corpPlate,
      stripLabel,
      sideTagLabel,
      bolt,
      capRed: cap("#dc2626"),
      capGreen: cap("#16a34a"),
      capYellow: cap("#eab308"),
      capBlue: cap("#2563eb"),
      capWhite: cap("#f8fafc"),
    };
  }, [
    waveTex,
    stickerTex,
    screenTex,
    logoTex,
    modelPlateTex,
    corpPlateTex,
    stripLabelTex,
    sideTagTex,
  ]);

  useEffect(() => {
    const textures = [
      waveTex,
      stickerTex,
      screenTex,
      logoTex,
      modelPlateTex,
      corpPlateTex,
      stripLabelTex,
      sideTagTex,
    ];
    const geos = [airGeo];
    const materials = Object.values(mats);
    return () => {
      textures.forEach((t) => t.dispose());
      geos.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    };
  }, [
    mats,
    waveTex,
    stickerTex,
    screenTex,
    logoTex,
    modelPlateTex,
    corpPlateTex,
    stripLabelTex,
    sideTagTex,
    airGeo,
  ]);

  // 材质重建后若仍在播放，立刻重新套半透明
  useEffect(() => {
    if (rootRef.current && ghostAmt.current > 0.01) {
      applyExteriorGhost(rootRef.current, ghostAmt.current);
    }
  }, [mats]);

  // 柜体包住内部龙门与左侧刀库，正立面比例接近官网：左铭牌 / 黄门 / 右颊
  const W = 416;
  const D = 360;
  const H = 318;
  const R = 14;
  const skin = 8;
  const y0 = baseTopY - 4;
  const yTop = y0 + H;
  const halfW = W / 2;
  const halfD = D / 2;
  const zFace = halfD;
  const seamY = y0 + 36;
  const yUpper = (seamY + yTop) / 2;
  const upperH = yTop - seamY;

  const doorW = 168;
  const doorX = 8;
  const doorLeft = doorX - doorW / 2;
  const doorRight = doorX + doorW / 2;
  const gap = 1.2;
  const doorBottom = y0 + 84;
  const doorTop = yTop - 32;
  const doorH = doorTop - doorBottom;
  const doorY = (doorTop + doorBottom) / 2;
  const openL = doorLeft - gap;
  const openR = doorRight + gap;
  const openB = doorBottom - gap;
  const openT = doorTop + gap;
  const slide = doorW * 0.9;

  const winW = 72;
  const winH = doorH - 48;
  const winX = -16;
  const winY = 4;

  const sideWinW = 88;
  const sideWinH = 170;
  const sideWinZ = 58;
  const sideWinY = y0 + 178;
  const svcW = 56;
  const svcH = 116;
  const svcZ = -72;
  const svcY = y0 + 166;

  const stripH = 15;
  const stripY = openB - stripH / 2 - 1.2;

  useFrame((_, dt) => {
    const target = showEnclosure ? 0 : 1;
    openAmt.current = THREE.MathUtils.damp(openAmt.current, target, 5.5, dt);
    if (doorRef.current) doorRef.current.position.x = openAmt.current * slide;

    const ghostTarget = playing ? 1 : 0;
    const prevGhost = ghostAmt.current;
    ghostAmt.current = THREE.MathUtils.damp(ghostAmt.current, ghostTarget, 6, dt);
    if (
      rootRef.current &&
      (Math.abs(ghostAmt.current - prevGhost) > 0.0005 ||
        Math.abs(ghostAmt.current - ghostTarget) > 0.001)
    ) {
      applyExteriorGhost(rootRef.current, ghostAmt.current);
    }
  });

  const frontBolts: [number, number, number][] = [];
  for (let x = -halfW + 46; x < openL - 16; x += 26) {
    frontBolts.push([x, y0 + 16, zFace + 1.1]);
  }
  const sideBolts: [number, number, number][] = [];
  for (let z = -halfD + 48; z <= halfD - 52; z += 46) {
    sideBolts.push([-halfW - 1.05, y0 + 15, z]);
  }

  const leftX0 = -halfW + R;
  const rightX1 = halfW - R;
  const leftW = openL - leftX0;
  const rightW = rightX1 - openR;
  const sillH = openB - seamY;
  const headH = yTop - openT;
  const hmiW = Math.max(rightW - 2, 78);
  const hmiH = doorH + 48;
  const hmiD = 28;
  const hmiFaceZ = hmiD / 2;
  const hmiY = (doorBottom + yTop + 28) / 2;
  // 螺旋线上端在面板底部托架，下端接到柜体裙边
  const coilTopY = -hmiH / 2 + 10;
  const coilTopZ = hmiFaceZ - 3;
  const coilBotY = y0 + 26 - hmiY;
  // 下端落到柜体正立面裙边（世界 z ≈ zFace+2）
  const coilBotZ = 2 - hmiD / 2 - 1;
  const cables = useMemo(
    () => ({
      a: makeCoil([-14, coilTopY, coilTopZ], [-20, coilBotY, coilBotZ], 9),
      b: makeCoil([12, coilTopY, coilTopZ], [6, coilBotY + 4, coilBotZ], 8),
    }),
    [coilTopY, coilTopZ, coilBotY, coilBotZ],
  );
  useEffect(() => {
    return () => {
      cables.a.dispose();
      cables.b.dispose();
    };
  }, [cables]);

  const footAt: [number, number][] = [
    [-halfW + 28, halfD - 16],
    [halfW - 28, halfD - 16],
    [-halfW + 36, -halfD + 28],
    [halfW - 36, -halfD + 28],
    [-20, halfD - 14],
    [halfW - 48, -halfD + 30],
  ];

  const capMats = [mats.capRed, mats.capGreen, mats.capYellow, mats.capBlue];

  return (
    <group ref={rootRef} position={[cx, 0, cz]} name="SF260_Exterior">
      {/* —— 裙边 + 调平脚 —— */}
      <Panel
        size={[W - R * 2 + 4, 36, skin]}
        at={[0, y0 + 18, zFace - skin / 2]}
        mat={mats.sheetAlt}
        name="Skirt_Front"
        shadow
      />
      <Panel
        size={[W - R * 2 + 4, 36, skin]}
        at={[0, y0 + 18, -zFace + skin / 2]}
        mat={mats.sheetAlt}
        name="Skirt_Rear"
      />
      <Panel
        size={[skin, 36, D - R]}
        at={[-halfW + skin / 2, y0 + 18, -R / 2]}
        mat={mats.sheetAlt}
        name="Skirt_Left"
        shadow
      />
      <Panel
        size={[skin, 36, D - R]}
        at={[halfW - skin / 2, y0 + 18, -R / 2]}
        mat={mats.sheetAlt}
        name="Skirt_Right"
      />
      {/* 前立边圆角，下段跟裙边同色 */}
      {([-1, 1] as const).map((side) => (
        <group key={side}>
          <mesh position={[side * (halfW - R), y0 + 18, halfD - R]} material={mats.sheetAlt}>
            <cylinderGeometry args={[R, R, 36, 20]} />
          </mesh>
          <mesh
            position={[side * (halfW - R), yUpper, halfD - R]}
            material={mats.sheet}
            castShadow
            name={side < 0 ? "Corner_FL" : "Corner_FR"}
          >
            <cylinderGeometry args={[R - 0.05, R - 0.05, upperH, 22]} />
          </mesh>
          <mesh position={[side * (halfW - R), seamY, halfD - R]} material={mats.seamDark}>
            <cylinderGeometry args={[R + 0.35, R + 0.35, 2, 20]} />
          </mesh>
        </group>
      ))}
      {footAt.map(([x, z], i) => (
        <LevelFoot key={i} at={[x, y0, z]} metal={mats.stainless} rubber={mats.rubber} />
      ))}
      <Studs points={frontBolts} mat={mats.bolt} axis="z" />
      <Studs points={sideBolts} mat={mats.bolt} axis="x" />

      {/* —— 上柜钣金 —— */}
      <Panel
        size={[W, upperH, skin]}
        at={[0, yUpper, -halfD + skin / 2]}
        mat={mats.sheet}
        name="Rear"
        shadow
      />
      <Panel
        size={[skin, upperH, D - R]}
        at={[-halfW + skin / 2, yUpper, -R / 2]}
        mat={mats.sheet}
        name="Left"
        shadow
      />
      <Panel
        size={[skin, upperH, D - R]}
        at={[halfW - skin / 2, yUpper, -R / 2]}
        mat={mats.sheet}
        name="Right"
        shadow
      />
      {/* 裙边接缝 */}
      <Panel size={[W - 8, 2.1, 2.2]} at={[0, seamY, zFace + 0.4]} mat={mats.seam} name="Seam_Front" />
      <Panel size={[2.2, 2.1, D - 24]} at={[-halfW - 0.5, seamY, 0]} mat={mats.seam} name="Seam_Left" />
      <Panel size={[W + 14, 8, D + 14]} at={[0, yTop + 4, 0]} mat={mats.sheet} name="Roof" shadow />
      <mesh
        position={[0, yTop + 6.2, halfD + 3]}
        rotation={[0, 0, Math.PI / 2]}
        material={mats.sheet}
        name="Roof_Lip"
      >
        <cylinderGeometry args={[4.2, 4.2, W - 16, 18]} />
      </mesh>

      {/* 后部散热狭缝，绕到背面才看得到 */}
      <group name="Rear_Vent">
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={i} position={[-36 + (i % 3) * 22, yTop - 48 - Math.floor(i / 3) * 12, -halfD - 0.8]} material={mats.frame}>
            <boxGeometry args={[14, 3, 1.4]} />
          </mesh>
        ))}
      </group>

      {/* —— 正立面：左铭牌板 / 门洞 / 右颊 —— */}
      <Panel
        size={[leftW, upperH, skin]}
        at={[leftX0 + leftW / 2, yUpper, zFace - skin / 2]}
        mat={mats.sheet}
        name="Front_Brand"
        shadow
      />
      <Panel
        size={[rightW, upperH, skin]}
        at={[openR + rightW / 2, yUpper, zFace - skin / 2]}
        mat={mats.sheet}
        name="Front_Right"
        shadow
      />
      <Panel
        size={[openR - openL, sillH, skin]}
        at={[(openL + openR) / 2, seamY + sillH / 2, zFace - skin / 2]}
        mat={mats.sheet}
        name="Front_Sill"
        shadow
      />
      <Panel
        size={[openR - openL, headH, skin]}
        at={[(openL + openR) / 2, openT + headH / 2, zFace - skin / 2]}
        mat={mats.sheet}
        name="Front_Header"
        shadow
      />
      {/* 门洞内凹，关门时只露一条暗缝，开门后能看见内部 */}
      <group position={[(openL + openR) / 2, (openB + openT) / 2, zFace - 16]} name="Door_Reveal">
        <PictureFrame
          width={openR - openL + 8}
          height={openT - openB + 8}
          bar={9}
          depth={12}
          mat={mats.cavity}
        />
      </group>

      {/* 门下灰铭牌 */}
      <Panel
        size={[doorW + 8, stripH, 3.2]}
        at={[doorX, stripY, zFace + 0.55]}
        mat={mats.nameplate}
        name="Model_Plate"
        shadow
      />
      <Panel
        size={[doorW + 8, 1.4, 3.4]}
        at={[doorX, openB - 0.5, zFace + 0.7]}
        mat={mats.seamDark}
      />
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[doorX + s * (doorW / 2 - 10), stripY, zFace + 2.3]}
          rotation={[Math.PI / 2, 0, 0]}
          material={mats.steel}
        >
          <cylinderGeometry args={[1.15, 1.15, 1.2, 8]} />
        </mesh>
      ))}
      <mesh position={[doorX, stripY, zFace + 2.5]} material={mats.stripLabel} name="Strip_Label">
        <planeGeometry args={[doorW * 0.55, stripH * 0.7]} />
      </mesh>

      {/* 左立面超大竖排型号：画布贴图，逐字正立、自上而下 */}
      <mesh position={[-152, doorY + 4, zFace + 1.35]} material={mats.modelPlate} name="Model_Plate">
        <planeGeometry args={[28, doorH * 0.82]} />
      </mesh>
      <mesh position={[-118, doorY - 2, zFace + 1.35]} material={mats.corpPlate} name="Corp_Plate">
        <planeGeometry args={[22, doorH * 0.42]} />
      </mesh>
      <mesh position={[-82, doorY, zFace + 1.05]} material={mats.wave} name="Wave_Decal">
        <planeGeometry args={[30, doorH * 0.96]} />
      </mesh>

      {/* —— 亮黄滑门：单条竖窗 + 右拉手 + 警示贴 —— */}
      <group ref={doorRef} name="Yellow_Door">
        <group position={[doorX, doorY, zFace + 4.4]}>
          <Panel
            size={[doorW + 3, doorH + 3, 2.2]}
            at={[0, 0, -2.4]}
            mat={mats.cavity}
            name="Door_Edge"
          />
          <RoundedBox
            args={[doorW, doorH, 6.4]}
            radius={1.15}
            smoothness={3}
            bevelSegments={2}
            material={mats.yellow}
            castShadow
            receiveShadow
            name="Door_Slab"
          />
          <group position={[winX, winY, 4.6]} name="Door_Window">
            <PictureFrame width={winW + 2} height={winH + 2} bar={5.2} depth={3.2} mat={mats.frame} name="Door_Bezel" />
            <mesh position={[0, 0, -0.7]} material={mats.glass} castShadow name="Door_Glass" renderOrder={2}>
              <boxGeometry args={[winW - 8, winH - 8, 1.05]} />
            </mesh>
            <mesh position={[-8, 8, 0.15]} material={mats.streak} renderOrder={3}>
              <boxGeometry args={[2.6, winH * 0.58, 0.25]} />
            </mesh>
            <mesh position={[-winW * 0.22, -winH * 0.3, 0.35]} material={mats.sticker} name="Door_Sticker">
              <planeGeometry args={[15, 19]} />
            </mesh>
          </group>
          <group position={[winX + winW / 2 + 20, 2, 7.2]} name="Door_Handle">
            <mesh material={mats.stainless} castShadow>
              <cylinderGeometry args={[2.15, 2.15, doorH * 0.4, 16]} />
            </mesh>
            <mesh position={[0, doorH * 0.2, 0]} material={mats.stainless}>
              <sphereGeometry args={[2.15, 12, 8]} />
            </mesh>
            <mesh position={[0, -doorH * 0.2, 0]} material={mats.stainless}>
              <sphereGeometry args={[2.15, 12, 8]} />
            </mesh>
            {[0.15, -0.15].map((k) => (
              <group key={k} position={[0, doorH * k, 0]}>
                <mesh position={[0, 0, -3.2]} rotation={[Math.PI / 2, 0, 0]} material={mats.stainless}>
                  <cylinderGeometry args={[1.25, 1.55, 5.2, 10]} />
                </mesh>
                <mesh position={[0, 0, -5.6]} material={mats.steel}>
                  <boxGeometry args={[7.5, 11, 2]} />
                </mesh>
              </group>
            ))}
          </group>
        </group>
      </group>

      {/* —— 左侧：前部黑窗 + 后部黄检修门 —— */}
      <group position={[-halfW, sideWinY, sideWinZ]} rotation={[0, -Math.PI / 2, 0]} name="Left_Window">
        <Panel size={[sideWinW - 4, sideWinH - 4, 1.4]} at={[0, 0, -4.5]} mat={mats.cavity} />
        <mesh position={[0, 0, 0.3]} material={mats.glassSide} name="Side_Glass" renderOrder={2}>
          <boxGeometry args={[sideWinW - 14, sideWinH - 14, 1.1]} />
        </mesh>
        <mesh position={[-12, 10, 1.05]} material={mats.streak} renderOrder={3}>
          <boxGeometry args={[2.2, sideWinH * 0.45, 0.2]} />
        </mesh>
        <PictureFrame width={sideWinW - 6} height={sideWinH - 6} bar={3.4} depth={2} mat={mats.frame} />
        <group position={[0, 0, 1.8]}>
          <PictureFrame width={sideWinW + 2} height={sideWinH + 2} bar={4.4} depth={2.4} mat={mats.sheet} name="Side_Frame" />
        </group>
        <Panel size={[34, 11, 1.6]} at={[0, -sideWinH / 2 - 1, 2.4]} mat={mats.yellow} name="Side_Tag" />
        <mesh position={[0, -sideWinH / 2 - 1, 3.4]} material={mats.sideTagLabel} name="Side_Tag_Label">
          <planeGeometry args={[30, 8]} />
        </mesh>
      </group>
      <Panel
        size={[1.5, upperH - 24, 2.2]}
        at={[-halfW - 0.6, yUpper, -16]}
        mat={mats.seam}
        name="Left_Panel_Seam"
      />
      <group position={[-halfW, svcY, svcZ]} rotation={[0, -Math.PI / 2, 0]} name="Service_Door">
        <Panel size={[svcW + 5, svcH + 5, 1.6]} at={[0, 0, -1.8]} mat={mats.cavity} />
        <RoundedBox
          args={[svcW, svcH, 4.6]}
          radius={0.9}
          smoothness={2}
          bevelSegments={2}
          material={mats.yellow}
          castShadow
          name="Service_Slab"
        />
        <group position={[svcW / 2 - 7, 0, 3.6]} name="Service_Handle">
          <mesh material={mats.stainless} castShadow>
            <cylinderGeometry args={[1.25, 1.25, svcH * 0.34, 12]} />
          </mesh>
          {[0.12, -0.12].map((k) => (
            <mesh key={k} position={[0, svcH * k, -2.2]} rotation={[Math.PI / 2, 0, 0]} material={mats.steel}>
              <boxGeometry args={[3.2, 2.4, 5]} />
            </mesh>
          ))}
        </group>
      </group>

      {/* —— 正面右颊操作台：明显凸出柜面、顶部高出柜顶，左缘紧贴黄门 —— */}
      <group position={[openR + hmiW / 2 + 1, hmiY, zFace + hmiD / 2 + 1]} name="HMI_Console">
        <RoundedBox
          args={[hmiW, hmiH, hmiD]}
          radius={1.4}
          smoothness={3}
          bevelSegments={2}
          material={mats.sheet}
          castShadow
          receiveShadow
          name="HMI_Body"
        />
        <Panel
          size={[hmiW - 10, hmiH * 0.72, 10]}
          at={[0, -6, -hmiD / 2 - 4]}
          mat={mats.sheetAlt}
          name="HMI_Mount"
          shadow
        />
        <mesh position={[-hmiW * 0.28, hmiH * 0.38, hmiFaceZ + 0.4]} material={mats.logo} name="HMI_Logo">
          <planeGeometry args={[12, 12]} />
        </mesh>
        <Text
          position={[-hmiW * 0.12, hmiH * 0.4, hmiFaceZ + 0.5]}
          fontSize={7}
          letterSpacing={0.08}
          color="#1c2430"
          anchorX="left"
          anchorY="middle"
        >
          JUST
        </Text>
        <Text
          position={[-hmiW * 0.12, hmiH * 0.35, hmiFaceZ + 0.5]}
          fontSize={1.7}
          color="#64748b"
          anchorX="left"
          anchorY="middle"
        >
          NUMERICAL CONTROL
        </Text>
        <Panel size={[hmiW - 18, 1, 0.5]} at={[0, hmiH * 0.28, hmiFaceZ + 0.3]} mat={mats.seamDark} />
        <Panel
          size={[hmiW - 16, hmiH * 0.22, 2]}
          at={[0, hmiH * 0.12, hmiFaceZ - 0.2]}
          mat={mats.frame}
          name="HMI_Bezel"
        />
        <mesh position={[0, hmiH * 0.12, hmiFaceZ + 1.1]} material={mats.screen} name="HMI_Screen">
          <planeGeometry args={[hmiW - 22, hmiH * 0.18]} />
        </mesh>
        <mesh position={[8, hmiH * 0.17, hmiFaceZ + 1.2]} material={mats.streak}>
          <planeGeometry args={[hmiW * 0.28, 6]} />
        </mesh>
        <Panel
          size={[hmiW - 14, hmiH * 0.3, 2.2]}
          at={[0, -hmiH * 0.12, hmiFaceZ - 0.4]}
          mat={mats.cavity}
          name="HMI_Keydeck"
        />
        {KEY_ROWS.map((y, row) =>
          KEY_COLS.map((x, col) => (
            <mesh
              key={`${row}-${col}`}
              position={[x * (hmiW / 68), y * 0.95 - hmiH * 0.08, hmiFaceZ + 1.2]}
              material={row === 0 ? mats.keyLight : mats.keyDark}
              castShadow
            >
              <boxGeometry args={[6, 4.6, 2]} />
            </mesh>
          )),
        )}
        {/* 彩色钮 + 急停：在线缆上端、键盘下方 */}
        {CAP_COLORS.map((color, i) => (
          <group
            key={color}
            position={[-hmiW * 0.28 + i * (hmiW * 0.12), -hmiH * 0.3, hmiFaceZ + 0.9]}
          >
            <mesh rotation={[Math.PI / 2, 0, 0]} material={mats.steel}>
              <cylinderGeometry args={[3.4, 3.4, 1.2, 14]} />
            </mesh>
            <mesh
              position={[0, 0, 1.15]}
              rotation={[Math.PI / 2, 0, 0]}
              material={capMats[i]}
              castShadow
            >
              <cylinderGeometry args={[2.55, 2.7, 1.8]} />
            </mesh>
          </group>
        ))}
        <group position={[hmiW * 0.3, -hmiH * 0.3, hmiFaceZ + 0.8]} name="E_Stop">
          <mesh rotation={[Math.PI / 2, 0, 0]} material={mats.yellow}>
            <cylinderGeometry args={[5.2, 5.2, 1.3, 16]} />
          </mesh>
          <mesh
            position={[0, 0, 1.6]}
            rotation={[Math.PI / 2, 0, 0]}
            material={mats.capRed}
            castShadow
          >
            <cylinderGeometry args={[3.8, 4.1, 2.4, 16]} />
          </mesh>
        </group>

        {/* 线缆上端托架：手轮座在按钮正下方 */}
        <Panel
          size={[hmiW - 10, 16, 10]}
          at={[0, -hmiH / 2 + 14, hmiFaceZ - 5]}
          mat={mats.cavity}
          name="Cable_Bay"
        />
        <group position={[-10, -hmiH / 2 + 16, hmiFaceZ + 2]} name="Pendant_Dock">
          <RoundedBox
            args={[14, 10, 12]}
            radius={1}
            smoothness={2}
            material={mats.rubber}
            castShadow
            name="Pendant_Body"
          />
          <mesh
            position={[0, 0, 6.5]}
            rotation={[Math.PI / 2, 0, 0]}
            material={mats.stainless}
            name="Handwheel"
          >
            <cylinderGeometry args={[4.2, 4.2, 1.8, 18]} />
          </mesh>
          <mesh position={[4.5, 0, 4]} material={mats.capGreen}>
            <sphereGeometry args={[1.2, 8, 8]} />
          </mesh>
        </group>

        {/* 两根螺旋线：上端接面板，下端接主体裙边 */}
        <mesh geometry={cables.a} material={mats.cableMat} castShadow name="Coil_A" />
        <mesh geometry={cables.b} material={mats.cableMat} castShadow name="Coil_B" />
        <mesh
          position={[-14, coilTopY + 3, coilTopZ]}
          rotation={[Math.PI / 2, 0, 0]}
          material={mats.rubber}
          name="Gland_Top_A"
        >
          <cylinderGeometry args={[2.5, 2.7, 3.2, 12]} />
        </mesh>
        <mesh
          position={[12, coilTopY + 3, coilTopZ]}
          rotation={[Math.PI / 2, 0, 0]}
          material={mats.rubber}
          name="Gland_Top_B"
        >
          <cylinderGeometry args={[2.5, 2.7, 3.2, 12]} />
        </mesh>
        {/* 下端主体接插件（相对 HMI 组的裙边位置） */}
        <group position={[-20, coilBotY, coilBotZ]} name="Body_Port_A">
          <mesh material={mats.steel} castShadow>
            <boxGeometry args={[8, 10, 5]} />
          </mesh>
          <mesh position={[0, 0, 3]} rotation={[Math.PI / 2, 0, 0]} material={mats.rubber}>
            <cylinderGeometry args={[2.4, 2.6, 2.5, 12]} />
          </mesh>
        </group>
        <group position={[6, coilBotY + 4, coilBotZ]} name="Body_Port_B">
          <mesh material={mats.steel} castShadow>
            <boxGeometry args={[8, 10, 5]} />
          </mesh>
          <mesh position={[0, 0, 3]} rotation={[Math.PI / 2, 0, 0]} material={mats.rubber}>
            <cylinderGeometry args={[2.4, 2.6, 2.5, 12]} />
          </mesh>
        </group>
      </group>

      {/* —— 顶部气动平衡缸 + 蓝气管 —— */}
      <group position={[doorX, yTop, 6]} name="Balance_Cylinder">
        <Panel size={[56, 2.2, 50]} at={[0, 1.2, 0]} mat={mats.yellowDeep} />
        <RoundedBox
          args={[52, 16, 46]}
          radius={1.4}
          smoothness={2}
          position={[0, 10, 0]}
          material={mats.yellow}
          castShadow
          name="Cylinder_Base"
        />
        {(
          [
            [-16, 18.4, -13],
            [16, 18.4, -13],
            [-16, 18.4, 13],
            [16, 18.4, 13],
          ] as [number, number, number][]
        ).map((p, i) => (
          <mesh key={i} position={p} material={mats.steel}>
            <cylinderGeometry args={[1.15, 1.15, 1.6, 8]} />
          </mesh>
        ))}
        <mesh position={[0, 20.5, 0]} material={mats.stainless} castShadow>
          <cylinderGeometry args={[11.2, 12, 5, 22]} />
        </mesh>
        <mesh position={[0, 68, 0]} material={mats.stainless} castShadow name="Balance_Rod">
          <cylinderGeometry args={[7.2, 7.4, 92, 24]} />
        </mesh>
        <mesh position={[0, 112, 0]} material={mats.steel}>
          <cylinderGeometry args={[7.4, 6.3, 4.2, 20]} />
        </mesh>
        <mesh position={[-16, 12, 12]} rotation={[0, 0, Math.PI / 2]} material={mats.stainless} name="Air_Fitting">
          <cylinderGeometry args={[2.4, 2.4, 7, 10]} />
        </mesh>
        <mesh geometry={airGeo} material={mats.blue} name="Air_Tube" />
      </group>
    </group>
  );
}
