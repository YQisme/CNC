/**
 * SF-260H 整机外形 — 命令式 Three.js 构建（自 Sf260Exterior.tsx 移植）
 */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export type ExteriorHandles = {
  root: THREE.Group;
  door: THREE.Group;
  dispose: () => void;
  setShellExplode: (amount: number) => void;
};

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

export function applyExteriorGhost(root: THREE.Object3D, amount: number) {
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

function addBox(
  parent: THREE.Object3D,
  size: [number, number, number],
  at: [number, number, number],
  mat: THREE.Material,
  opts?: { name?: string; shadow?: boolean; rot?: [number, number, number] },
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
  mesh.position.set(...at);
  if (opts?.rot) mesh.rotation.set(...opts.rot);
  if (opts?.name) mesh.name = opts.name;
  if (opts?.shadow) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  }
  parent.add(mesh);
  return mesh;
}

function addRoundedBox(
  parent: THREE.Object3D,
  size: [number, number, number],
  radius: number,
  mat: THREE.Material,
  opts?: {
    name?: string;
    shadow?: boolean;
    position?: [number, number, number];
  },
) {
  const mesh = new THREE.Mesh(
    new RoundedBoxGeometry(size[0], size[1], size[2], 2, radius),
    mat,
  );
  if (opts?.position) mesh.position.set(...opts.position);
  if (opts?.name) mesh.name = opts.name;
  if (opts?.shadow) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  }
  parent.add(mesh);
  return mesh;
}

function addPictureFrame(
  parent: THREE.Object3D,
  width: number,
  height: number,
  bar: number,
  depth: number,
  mat: THREE.Material,
  name?: string,
) {
  const g = new THREE.Group();
  if (name) g.name = name;
  const sideH = Math.max(0.5, height - bar * 2);
  addBox(g, [width, bar, depth], [0, height / 2 - bar / 2, 0], mat);
  addBox(g, [width, bar, depth], [0, -height / 2 + bar / 2, 0], mat);
  addBox(g, [bar, sideH, depth], [-width / 2 + bar / 2, 0, 0], mat);
  addBox(g, [bar, sideH, depth], [width / 2 - bar / 2, 0, 0], mat);
  parent.add(g);
  return g;
}

function addLevelFoot(
  parent: THREE.Object3D,
  at: [number, number, number],
  metal: THREE.Material,
  rubber: THREE.Material,
) {
  const g = new THREE.Group();
  g.name = "Leveling_Foot";
  g.position.set(...at);
  const a = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 8.2, 12), metal);
  a.position.set(0, -4.2, 0);
  a.castShadow = true;
  g.add(a);
  const b = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 6.2, 2.5, 6), rubber);
  b.position.set(0, -8.6, 0);
  g.add(b);
  const c = new THREE.Mesh(new THREE.CylinderGeometry(14, 15, 3.6, 20), rubber);
  c.position.set(0, -11.2, 0);
  c.receiveShadow = true;
  g.add(c);
  parent.add(g);
}

function addStuds(
  parent: THREE.Object3D,
  points: [number, number, number][],
  mat: THREE.Material,
  axis: "x" | "z",
) {
  const g = new THREE.Group();
  g.name = "Skirt_Bolts";
  const rot: [number, number, number] =
    axis === "z" ? [Math.PI / 2, 0, 0] : [0, 0, Math.PI / 2];
  for (const p of points) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 1.7, 8), mat);
    m.position.set(...p);
    m.rotation.set(...rot);
    g.add(m);
  }
  parent.add(g);
}

/** 爆炸子组：记录 offset，由 setShellExplode 更新 position */
type ExplodeNode = { group: THREE.Group; offset: [number, number, number] };

export function buildSf260Exterior(
  cx: number,
  cz: number,
  baseTopY: number,
): ExteriorHandles {
  const textures: THREE.Texture[] = [];
  const geos: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const explodeNodes: ExplodeNode[] = [];

  const trackTex = (t: THREE.Texture) => {
    textures.push(t);
    return t;
  };
  const trackGeo = <T extends THREE.BufferGeometry>(g: T) => {
    geos.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T) => {
    materials.push(m);
    return m;
  };

  const explode = (offset: [number, number, number], name: string) => {
    const g = new THREE.Group();
    g.name = name;
    explodeNodes.push({ group: g, offset });
    return g;
  };

  const waveTex = trackTex(canvasTexture(256, 1024, paintWave));
  const stickerTex = trackTex(canvasTexture(256, 320, paintSticker));
  const screenTex = trackTex(canvasTexture(512, 360, paintScreen));
  const logoTex = trackTex(canvasTexture(160, 160, paintLogo));
  const modelPlateTex = trackTex(canvasTexture(128, 640, paintModelPlate));
  const corpPlateTex = trackTex(canvasTexture(256, 320, paintCorpPlate));
  const stripLabelTex = trackTex(canvasTexture(512, 96, paintStripLabel));
  const sideTagTex = trackTex(canvasTexture(512, 96, paintSideTagLabel));

  const airGeo = trackGeo(
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
  );

  const cap = (color: string) =>
    trackMat(
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.36,
        metalness: 0.18,
        emissive: color,
        emissiveIntensity: 0.14,
      }),
    );

  const mats = {
    sheet: trackMat(paintMat("#f3f5f7", 0.46, 0.24, 0.62)),
    sheetAlt: trackMat(paintMat("#d5dbe3", 0.52, 0.1, 0.45)),
    yellow: trackMat(paintMat("#f6c400", 0.34, 0.42, 0.75)),
    yellowDeep: trackMat(paintMat("#e2ae00", 0.4, 0.3, 0.6)),
    stainless: trackMat(
      new THREE.MeshStandardMaterial({
        color: "#f7f9fc",
        roughness: 0.22,
        metalness: 0.48,
      }),
    ),
    steel: trackMat(
      new THREE.MeshStandardMaterial({
        color: "#d5dde6",
        roughness: 0.3,
        metalness: 0.55,
      }),
    ),
    cavity: trackMat(
      new THREE.MeshStandardMaterial({
        color: "#12161c",
        roughness: 0.62,
        metalness: 0.35,
      }),
    ),
    frame: trackMat(
      new THREE.MeshStandardMaterial({
        color: "#1a1f26",
        roughness: 0.4,
        metalness: 0.55,
      }),
    ),
    glass: trackMat(
      new THREE.MeshPhysicalMaterial({
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
      }),
    ),
    glassSide: trackMat(
      new THREE.MeshPhysicalMaterial({
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
      }),
    ),
    streak: trackMat(
      new THREE.MeshStandardMaterial({
        color: "#ffffff",
        roughness: 0.04,
        metalness: 0,
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
      }),
    ),
    nameplate: trackMat(
      new THREE.MeshPhysicalMaterial({
        color: "#b7c2ce",
        roughness: 0.38,
        metalness: 0.42,
        clearcoat: 0.25,
        clearcoatRoughness: 0.35,
        envMapIntensity: 0.8,
      }),
    ),
    seam: trackMat(
      new THREE.MeshStandardMaterial({
        color: "#c5ccd6",
        roughness: 0.5,
        metalness: 0.25,
      }),
    ),
    seamDark: trackMat(
      new THREE.MeshStandardMaterial({
        color: "#8b95a3",
        roughness: 0.48,
        metalness: 0.3,
      }),
    ),
    rubber: trackMat(
      new THREE.MeshStandardMaterial({
        color: "#14171c",
        roughness: 0.9,
        metalness: 0.04,
      }),
    ),
    cableMat: trackMat(
      new THREE.MeshStandardMaterial({
        color: "#1a1d22",
        roughness: 0.72,
        metalness: 0.08,
      }),
    ),
    blue: trackMat(
      new THREE.MeshStandardMaterial({
        color: "#1d4ed8",
        roughness: 0.34,
        metalness: 0.12,
        emissive: "#1e3a8a",
        emissiveIntensity: 0.12,
      }),
    ),
    keyDark: trackMat(
      new THREE.MeshStandardMaterial({
        color: "#2a313b",
        roughness: 0.55,
        metalness: 0.25,
      }),
    ),
    keyLight: trackMat(
      new THREE.MeshStandardMaterial({
        color: "#e7ebf0",
        roughness: 0.48,
        metalness: 0.12,
      }),
    ),
    screen: trackMat(
      new THREE.MeshStandardMaterial({
        map: screenTex,
        emissive: new THREE.Color("#7dd3fc"),
        emissiveMap: screenTex,
        emissiveIntensity: 0.42,
        roughness: 0.28,
        metalness: 0.05,
      }),
    ),
    wave: trackMat(
      new THREE.MeshBasicMaterial({
        color: "#ffffff",
        map: waveTex,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      }),
    ),
    sticker: trackMat(
      new THREE.MeshStandardMaterial({
        map: stickerTex,
        roughness: 0.58,
        metalness: 0.05,
      }),
    ),
    logo: trackMat(
      new THREE.MeshStandardMaterial({
        map: logoTex,
        transparent: true,
        roughness: 0.45,
        metalness: 0.1,
        depthWrite: false,
      }),
    ),
    modelPlate: trackMat(
      new THREE.MeshBasicMaterial({
        map: modelPlateTex,
        transparent: true,
        alphaTest: 0.15,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
        side: THREE.FrontSide,
      }),
    ),
    corpPlate: trackMat(
      new THREE.MeshBasicMaterial({
        map: corpPlateTex,
        transparent: true,
        alphaTest: 0.15,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
        side: THREE.FrontSide,
      }),
    ),
    stripLabel: trackMat(
      new THREE.MeshBasicMaterial({
        map: stripLabelTex,
        transparent: true,
        alphaTest: 0.15,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
        side: THREE.FrontSide,
      }),
    ),
    sideTagLabel: trackMat(
      new THREE.MeshBasicMaterial({
        map: sideTagTex,
        transparent: true,
        alphaTest: 0.15,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
        side: THREE.FrontSide,
      }),
    ),
    bolt: trackMat(
      new THREE.MeshStandardMaterial({
        color: "#3a4250",
        roughness: 0.42,
        metalness: 0.7,
      }),
    ),
    capRed: cap("#dc2626"),
    capGreen: cap("#16a34a"),
    capYellow: cap("#eab308"),
    capBlue: cap("#2563eb"),
  };

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
  const leftX0 = -halfW + R;
  const leftW = openL - leftX0;
  const rightW = halfW - R - openR;
  const sillH = openB - seamY;
  const headH = yTop - openT;
  const hmiW = Math.max(rightW - 2, 78);
  const hmiH = doorH + 48;
  const hmiD = 28;
  const hmiFaceZ = hmiD / 2;
  const hmiY = (doorBottom + yTop + 28) / 2;
  const coilTopY = -hmiH / 2 + 10;
  const coilTopZ = hmiFaceZ - 3;
  const coilBotY = y0 + 26 - hmiY;
  const coilBotZ = 2 - hmiD / 2 - 1;

  const cableA = trackGeo(
    makeCoil([-14, coilTopY, coilTopZ], [-20, coilBotY, coilBotZ], 9),
  );
  const cableB = trackGeo(
    makeCoil([12, coilTopY, coilTopZ], [6, coilBotY + 4, coilBotZ], 8),
  );

  const root = new THREE.Group();
  root.name = "SF260_Exterior";
  root.position.set(cx, 0, cz);

  // —— 裙边 + 调平脚 ——
  {
    const part = explode([0, -48, 0], "Explode_Skirt");
    root.add(part);
    addBox(part, [W - R * 2 + 4, 36, skin], [0, y0 + 18, zFace - skin / 2], mats.sheetAlt, { name: "Skirt_Front", shadow: true });
    addBox(part, [W - R * 2 + 4, 36, skin], [0, y0 + 18, -zFace + skin / 2], mats.sheetAlt, { name: "Skirt_Rear" });
    addBox(part, [skin, 36, D - R], [-halfW + skin / 2, y0 + 18, -R / 2], mats.sheetAlt, { name: "Skirt_Left", shadow: true });
    addBox(part, [skin, 36, D - R], [halfW - skin / 2, y0 + 18, -R / 2], mats.sheetAlt, { name: "Skirt_Right" });
    for (const side of [-1, 1] as const) {
      const c1 = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 36, 20), mats.sheetAlt);
      c1.position.set(side * (halfW - R), y0 + 18, halfD - R);
      part.add(c1);
      const c2 = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.35, R + 0.35, 2, 20), mats.seamDark);
      c2.position.set(side * (halfW - R), seamY, halfD - R);
      part.add(c2);
    }
    const footAt: [number, number][] = [
      [-halfW + 28, halfD - 16],
      [halfW - 28, halfD - 16],
      [-halfW + 36, -halfD + 28],
      [halfW - 36, -halfD + 28],
      [-20, halfD - 14],
      [halfW - 48, -halfD + 30],
    ];
    for (const [x, z] of footAt) addLevelFoot(part, [x, y0, z], mats.stainless, mats.rubber);
    const frontBolts: [number, number, number][] = [];
    for (let x = -halfW + 46; x < openL - 16; x += 26) frontBolts.push([x, y0 + 16, zFace + 1.1]);
    const sideBolts: [number, number, number][] = [];
    for (let z = -halfD + 48; z <= halfD - 52; z += 46) sideBolts.push([-halfW - 1.05, y0 + 15, z]);
    addStuds(part, frontBolts, mats.bolt, "z");
    addStuds(part, sideBolts, mats.bolt, "x");
    addBox(part, [W - 8, 2.1, 2.2], [0, seamY, zFace + 0.4], mats.seam, { name: "Seam_Front" });
    addBox(part, [2.2, 2.1, D - 24], [-halfW - 0.5, seamY, 0], mats.seam, { name: "Seam_Left" });
  }

  {
    const part = explode([0, 20, -95], "Explode_Rear");
    root.add(part);
    addBox(part, [W, upperH, skin], [0, yUpper, -halfD + skin / 2], mats.sheet, { name: "Rear", shadow: true });
    const vent = new THREE.Group();
    vent.name = "Rear_Vent";
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(14, 3, 1.4), mats.frame);
      m.position.set(-36 + (i % 3) * 22, yTop - 48 - Math.floor(i / 3) * 12, -halfD - 0.8);
      vent.add(m);
    }
    part.add(vent);
  }

  {
    const part = explode([-105, 10, 0], "Explode_LeftWall");
    root.add(part);
    addBox(part, [skin, upperH, D - R], [-halfW + skin / 2, yUpper, -R / 2], mats.sheet, { name: "Left", shadow: true });
    const corner = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.05, R - 0.05, upperH, 22), mats.sheet);
    corner.position.set(-(halfW - R), yUpper, halfD - R);
    corner.castShadow = true;
    corner.name = "Corner_FL";
    part.add(corner);
  }

  {
    const part = explode([105, 10, 0], "Explode_RightWall");
    root.add(part);
    addBox(part, [skin, upperH, D - R], [halfW - skin / 2, yUpper, -R / 2], mats.sheet, { name: "Right", shadow: true });
    const corner = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.05, R - 0.05, upperH, 22), mats.sheet);
    corner.position.set(halfW - R, yUpper, halfD - R);
    corner.castShadow = true;
    corner.name = "Corner_FR";
    part.add(corner);
  }

  {
    const part = explode([0, 90, 0], "Explode_Roof");
    root.add(part);
    addBox(part, [W + 14, 8, D + 14], [0, yTop + 4, 0], mats.sheet, { name: "Roof", shadow: true });
    const lip = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, W - 16, 18), mats.sheet);
    lip.position.set(0, yTop + 6.2, halfD + 3);
    lip.rotation.z = Math.PI / 2;
    lip.name = "Roof_Lip";
    part.add(lip);
  }

  {
    const part = explode([0, 5, 85], "Explode_Front");
    root.add(part);
    addBox(part, [leftW, upperH, skin], [leftX0 + leftW / 2, yUpper, zFace - skin / 2], mats.sheet, { name: "Front_Brand", shadow: true });
    addBox(part, [rightW, upperH, skin], [openR + rightW / 2, yUpper, zFace - skin / 2], mats.sheet, { name: "Front_Right", shadow: true });
    addBox(part, [openR - openL, sillH, skin], [(openL + openR) / 2, seamY + sillH / 2, zFace - skin / 2], mats.sheet, { name: "Front_Sill", shadow: true });
    addBox(part, [openR - openL, headH, skin], [(openL + openR) / 2, openT + headH / 2, zFace - skin / 2], mats.sheet, { name: "Front_Header", shadow: true });
    const reveal = new THREE.Group();
    reveal.name = "Door_Reveal";
    reveal.position.set((openL + openR) / 2, (openB + openT) / 2, zFace - 16);
    addPictureFrame(reveal, openR - openL + 8, openT - openB + 8, 9, 12, mats.cavity);
    part.add(reveal);
    addBox(part, [doorW + 8, stripH, 3.2], [doorX, stripY, zFace + 0.55], mats.nameplate, { name: "Model_Plate", shadow: true });
    addBox(part, [doorW + 8, 1.4, 3.4], [doorX, openB - 0.5, zFace + 0.7], mats.seamDark);
    for (const s of [-1, 1]) {
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 1.2, 8), mats.steel);
      bolt.position.set(doorX + s * (doorW / 2 - 10), stripY, zFace + 2.3);
      bolt.rotation.x = Math.PI / 2;
      part.add(bolt);
    }
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(doorW * 0.55, stripH * 0.7), mats.stripLabel);
    strip.position.set(doorX, stripY, zFace + 2.5);
    strip.name = "Strip_Label";
    part.add(strip);
    const modelPlate = new THREE.Mesh(new THREE.PlaneGeometry(28, doorH * 0.82), mats.modelPlate);
    modelPlate.position.set(-152, doorY + 4, zFace + 1.35);
    modelPlate.name = "Model_Plate";
    part.add(modelPlate);
    const corp = new THREE.Mesh(new THREE.PlaneGeometry(22, doorH * 0.42), mats.corpPlate);
    corp.position.set(-118, doorY - 2, zFace + 1.35);
    corp.name = "Corp_Plate";
    part.add(corp);
    const wave = new THREE.Mesh(new THREE.PlaneGeometry(30, doorH * 0.96), mats.wave);
    wave.position.set(-82, doorY, zFace + 1.05);
    wave.name = "Wave_Decal";
    part.add(wave);
  }

  const door = new THREE.Group();
  door.name = "Yellow_Door";
  {
    const part = explode([55, 15, 120], "Explode_Door");
    root.add(part);
    part.add(door);
    const doorInner = new THREE.Group();
    doorInner.position.set(doorX, doorY, zFace + 4.4);
    door.add(doorInner);
    addBox(doorInner, [doorW + 3, doorH + 3, 2.2], [0, 0, -2.4], mats.cavity, { name: "Door_Edge" });
    addRoundedBox(doorInner, [doorW, doorH, 6.4], 1.15, mats.yellow, { name: "Door_Slab", shadow: true });
    const win = new THREE.Group();
    win.name = "Door_Window";
    win.position.set(winX, winY, 4.6);
    addPictureFrame(win, winW + 2, winH + 2, 5.2, 3.2, mats.frame, "Door_Bezel");
    const glass = new THREE.Mesh(new THREE.BoxGeometry(winW - 8, winH - 8, 1.05), mats.glass);
    glass.position.set(0, 0, -0.7);
    glass.castShadow = true;
    glass.name = "Door_Glass";
    glass.renderOrder = 2;
    win.add(glass);
    const streak = new THREE.Mesh(new THREE.BoxGeometry(2.6, winH * 0.58, 0.25), mats.streak);
    streak.position.set(-8, 8, 0.15);
    streak.renderOrder = 3;
    win.add(streak);
    const sticker = new THREE.Mesh(new THREE.PlaneGeometry(15, 19), mats.sticker);
    sticker.position.set(-winW * 0.22, -winH * 0.3, 0.35);
    sticker.name = "Door_Sticker";
    win.add(sticker);
    doorInner.add(win);
    const handle = new THREE.Group();
    handle.name = "Door_Handle";
    handle.position.set(winX + winW / 2 + 20, 2, 7.2);
    const h1 = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.15, doorH * 0.4, 16), mats.stainless);
    h1.castShadow = true;
    handle.add(h1);
    for (const y of [doorH * 0.2, -doorH * 0.2]) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(2.15, 12, 8), mats.stainless);
      s.position.set(0, y, 0);
      handle.add(s);
    }
    for (const k of [0.15, -0.15]) {
      const hg = new THREE.Group();
      hg.position.set(0, doorH * k, 0);
      const peg = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.55, 5.2, 10), mats.stainless);
      peg.position.set(0, 0, -3.2);
      peg.rotation.x = Math.PI / 2;
      hg.add(peg);
      const plate = new THREE.Mesh(new THREE.BoxGeometry(7.5, 11, 2), mats.steel);
      plate.position.set(0, 0, -5.6);
      hg.add(plate);
      handle.add(hg);
    }
    doorInner.add(handle);
  }

  {
    const part = explode([-115, 5, 15], "Explode_LeftFeatures");
    root.add(part);
    const leftWin = new THREE.Group();
    leftWin.name = "Left_Window";
    leftWin.position.set(-halfW, sideWinY, sideWinZ);
    leftWin.rotation.y = -Math.PI / 2;
    addBox(leftWin, [sideWinW - 4, sideWinH - 4, 1.4], [0, 0, -4.5], mats.cavity);
    const sg = new THREE.Mesh(new THREE.BoxGeometry(sideWinW - 14, sideWinH - 14, 1.1), mats.glassSide);
    sg.position.set(0, 0, 0.3);
    sg.name = "Side_Glass";
    sg.renderOrder = 2;
    leftWin.add(sg);
    const st = new THREE.Mesh(new THREE.BoxGeometry(2.2, sideWinH * 0.45, 0.2), mats.streak);
    st.position.set(-12, 10, 1.05);
    st.renderOrder = 3;
    leftWin.add(st);
    addPictureFrame(leftWin, sideWinW - 6, sideWinH - 6, 3.4, 2, mats.frame);
    const frameG = new THREE.Group();
    frameG.position.set(0, 0, 1.8);
    addPictureFrame(frameG, sideWinW + 2, sideWinH + 2, 4.4, 2.4, mats.sheet, "Side_Frame");
    leftWin.add(frameG);
    addBox(leftWin, [34, 11, 1.6], [0, -sideWinH / 2 - 1, 2.4], mats.yellow, { name: "Side_Tag" });
    const tag = new THREE.Mesh(new THREE.PlaneGeometry(30, 8), mats.sideTagLabel);
    tag.position.set(0, -sideWinH / 2 - 1, 3.4);
    tag.name = "Side_Tag_Label";
    leftWin.add(tag);
    part.add(leftWin);
    addBox(part, [1.5, upperH - 24, 2.2], [-halfW - 0.6, yUpper, -16], mats.seam, { name: "Left_Panel_Seam" });
    const svc = new THREE.Group();
    svc.name = "Service_Door";
    svc.position.set(-halfW, svcY, svcZ);
    svc.rotation.y = -Math.PI / 2;
    addBox(svc, [svcW + 5, svcH + 5, 1.6], [0, 0, -1.8], mats.cavity);
    addRoundedBox(svc, [svcW, svcH, 4.6], 0.9, mats.yellow, { name: "Service_Slab", shadow: true });
    const sh = new THREE.Group();
    sh.name = "Service_Handle";
    sh.position.set(svcW / 2 - 7, 0, 3.6);
    const shc = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, svcH * 0.34, 12), mats.stainless);
    shc.castShadow = true;
    sh.add(shc);
    for (const k of [0.12, -0.12]) {
      const bm = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.4, 5), mats.steel);
      bm.position.set(0, svcH * k, -2.2);
      bm.rotation.x = Math.PI / 2;
      sh.add(bm);
    }
    svc.add(sh);
    part.add(svc);
  }

  {
    const part = explode([95, 8, 55], "Explode_HMI");
    root.add(part);
    const hmi = new THREE.Group();
    hmi.name = "HMI_Console";
    hmi.position.set(openR + hmiW / 2 + 1, hmiY, zFace + hmiD / 2 + 1);
    part.add(hmi);
    addRoundedBox(hmi, [hmiW, hmiH, hmiD], 1.4, mats.sheet, { name: "HMI_Body", shadow: true });
    addBox(hmi, [hmiW - 10, hmiH * 0.72, 10], [0, -6, -hmiD / 2 - 4], mats.sheetAlt, { name: "HMI_Mount", shadow: true });
    const logo = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), mats.logo);
    logo.position.set(-hmiW * 0.28, hmiH * 0.38, hmiFaceZ + 0.4);
    logo.name = "HMI_Logo";
    hmi.add(logo);
    // JUST / NUMERICAL CONTROL text → canvas plane substitute
    const justTex = trackTex(
      canvasTexture(256, 64, (g, w, h) => {
        g.clearRect(0, 0, w, h);
        g.fillStyle = "#1c2430";
        g.font = "bold 42px Arial, sans-serif";
        g.textBaseline = "middle";
        g.fillText("JUST", 8, h * 0.35);
        g.fillStyle = "#64748b";
        g.font = "16px Arial, sans-serif";
        g.fillText("NUMERICAL CONTROL", 8, h * 0.78);
      }),
    );
    const justMat = trackMat(
      new THREE.MeshBasicMaterial({
        map: justTex,
        transparent: true,
        depthWrite: false,
      }),
    );
    const justMesh = new THREE.Mesh(new THREE.PlaneGeometry(28, 8), justMat);
    justMesh.position.set(2, hmiH * 0.375, hmiFaceZ + 0.5);
    hmi.add(justMesh);
    addBox(hmi, [hmiW - 18, 1, 0.5], [0, hmiH * 0.28, hmiFaceZ + 0.3], mats.seamDark);
    addBox(hmi, [hmiW - 16, hmiH * 0.22, 2], [0, hmiH * 0.12, hmiFaceZ - 0.2], mats.frame, { name: "HMI_Bezel" });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(hmiW - 22, hmiH * 0.18), mats.screen);
    screen.position.set(0, hmiH * 0.12, hmiFaceZ + 1.1);
    screen.name = "HMI_Screen";
    hmi.add(screen);
    const streak = new THREE.Mesh(new THREE.PlaneGeometry(hmiW * 0.28, 6), mats.streak);
    streak.position.set(8, hmiH * 0.17, hmiFaceZ + 1.2);
    hmi.add(streak);
    addBox(hmi, [hmiW - 14, hmiH * 0.3, 2.2], [0, -hmiH * 0.12, hmiFaceZ - 0.4], mats.cavity, { name: "HMI_Keydeck" });
    const KEY_COLS = [-22, -11, 0, 11, 22];
    const KEY_ROWS = [4, -6, -16, -26];
    KEY_ROWS.forEach((y, row) => {
      KEY_COLS.forEach((x) => {
        const key = new THREE.Mesh(
          new THREE.BoxGeometry(6, 4.6, 2),
          row === 0 ? mats.keyLight : mats.keyDark,
        );
        key.position.set(x * (hmiW / 68), y * 0.95 - hmiH * 0.08, hmiFaceZ + 1.2);
        key.castShadow = true;
        hmi.add(key);
      });
    });
    const CAP_COLORS = ["#dc2626", "#16a34a", "#eab308", "#2563eb"] as const;
    const capMats = [mats.capRed, mats.capGreen, mats.capYellow, mats.capBlue];
    CAP_COLORS.forEach((_c, i) => {
      const g = new THREE.Group();
      g.position.set(-hmiW * 0.28 + i * (hmiW * 0.12), -hmiH * 0.3, hmiFaceZ + 0.9);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 1.2, 14), mats.steel);
      base.rotation.x = Math.PI / 2;
      g.add(base);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(2.55, 2.7, 1.8), capMats[i]);
      top.position.set(0, 0, 1.15);
      top.rotation.x = Math.PI / 2;
      top.castShadow = true;
      g.add(top);
      hmi.add(g);
    });
    const estop = new THREE.Group();
    estop.name = "E_Stop";
    estop.position.set(hmiW * 0.3, -hmiH * 0.3, hmiFaceZ + 0.8);
    const ey = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.2, 1.3, 16), mats.yellow);
    ey.rotation.x = Math.PI / 2;
    estop.add(ey);
    const er = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 4.1, 2.4, 16), mats.capRed);
    er.position.set(0, 0, 1.6);
    er.rotation.x = Math.PI / 2;
    er.castShadow = true;
    estop.add(er);
    hmi.add(estop);
    addBox(hmi, [hmiW - 10, 16, 10], [0, -hmiH / 2 + 14, hmiFaceZ - 5], mats.cavity, { name: "Cable_Bay" });
    const dock = new THREE.Group();
    dock.name = "Pendant_Dock";
    dock.position.set(-10, -hmiH / 2 + 16, hmiFaceZ + 2);
    addRoundedBox(dock, [14, 10, 12], 1, mats.rubber, { name: "Pendant_Body", shadow: true });
    const hw = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 1.8, 18), mats.stainless);
    hw.position.set(0, 0, 6.5);
    hw.rotation.x = Math.PI / 2;
    hw.name = "Handwheel";
    dock.add(hw);
    const led = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), mats.capGreen);
    led.position.set(4.5, 0, 4);
    dock.add(led);
    hmi.add(dock);
    const coilA = new THREE.Mesh(cableA, mats.cableMat);
    coilA.castShadow = true;
    coilA.name = "Coil_A";
    hmi.add(coilA);
    const coilB = new THREE.Mesh(cableB, mats.cableMat);
    coilB.castShadow = true;
    coilB.name = "Coil_B";
    hmi.add(coilB);
    for (const [px, name] of [
      [-14, "Gland_Top_A"],
      [12, "Gland_Top_B"],
    ] as const) {
      const gland = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.7, 3.2, 12), mats.rubber);
      gland.position.set(px, coilTopY + 3, coilTopZ);
      gland.rotation.x = Math.PI / 2;
      gland.name = name;
      hmi.add(gland);
    }
    for (const [px, py, name] of [
      [-20, coilBotY, "Body_Port_A"],
      [6, coilBotY + 4, "Body_Port_B"],
    ] as const) {
      const port = new THREE.Group();
      port.name = name;
      port.position.set(px, py, coilBotZ);
      const box = new THREE.Mesh(new THREE.BoxGeometry(8, 10, 5), mats.steel);
      box.castShadow = true;
      port.add(box);
      const rub = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 2.5, 12), mats.rubber);
      rub.position.set(0, 0, 3);
      rub.rotation.x = Math.PI / 2;
      port.add(rub);
      hmi.add(port);
    }
  }

  {
    const part = explode([20, 110, 10], "Explode_Balance");
    root.add(part);
    const bal = new THREE.Group();
    bal.name = "Balance_Cylinder";
    bal.position.set(doorX, yTop, 6);
    part.add(bal);
    addBox(bal, [56, 2.2, 50], [0, 1.2, 0], mats.yellowDeep);
    addRoundedBox(bal, [52, 16, 46], 1.4, mats.yellow, {
      name: "Cylinder_Base",
      shadow: true,
      position: [0, 10, 0],
    });
    for (const p of [
      [-16, 18.4, -13],
      [16, 18.4, -13],
      [-16, 18.4, 13],
      [16, 18.4, 13],
    ] as [number, number, number][]) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 1.6, 8), mats.steel);
      m.position.set(...p);
      bal.add(m);
    }
    const c1 = new THREE.Mesh(new THREE.CylinderGeometry(11.2, 12, 5, 22), mats.stainless);
    c1.position.set(0, 20.5, 0);
    c1.castShadow = true;
    bal.add(c1);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 7.4, 92, 24), mats.stainless);
    rod.position.set(0, 68, 0);
    rod.castShadow = true;
    rod.name = "Balance_Rod";
    bal.add(rod);
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(7.4, 6.3, 4.2, 20), mats.steel);
    tip.position.set(0, 112, 0);
    bal.add(tip);
    const fit = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 7, 10), mats.stainless);
    fit.position.set(-16, 12, 12);
    fit.rotation.z = Math.PI / 2;
    fit.name = "Air_Fitting";
    bal.add(fit);
    const tube = new THREE.Mesh(airGeo, mats.blue);
    tube.name = "Air_Tube";
    bal.add(tube);
  }

  return {
    root,
    door,
    setShellExplode(amount: number) {
      for (const n of explodeNodes) {
        n.group.position.set(
          n.offset[0] * amount,
          n.offset[1] * amount,
          n.offset[2] * amount,
        );
      }
    },
    dispose() {
      textures.forEach((t) => t.dispose());
      geos.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}
