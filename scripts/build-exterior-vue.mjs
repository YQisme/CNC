import fs from "fs";

const src = fs.readFileSync(
  "e:/Desktop/CNC/src/components/cnc/machines/Sf260Exterior.tsx",
  "utf8",
);

const marker = '<group ref={rootRef} position={[cx, 0, cz]} name="SF260_Exterior">';
const returnIdx = src.lastIndexOf(marker);
const retStart = src.lastIndexOf("return (", returnIdx);
let jsx = src.slice(retStart + "return (".length).replace(/\);\s*\}\s*$/, "");

function expandPanel(s) {
  // <Panel size={[...]} at={[...]} rot? mat={...} name? shadow? />
  return s.replace(
    /<Panel\s+([\s\S]*?)\/>/g,
    (full, attrs) => {
      const get = (name) => {
        const m = attrs.match(new RegExp(`${name}=\\{([^}]+)\\}`));
        return m ? m[1].trim() : null;
      };
      const getStr = (name) => {
        const m = attrs.match(new RegExp(`${name}="([^"]+)"`));
        return m ? m[1] : null;
      };
      const size = get("size");
      const at = get("at");
      const rot = get("rot");
      const mat = get("mat");
      const name = getStr("name") || get("name");
      const shadow = /\bshadow\b/.test(attrs);
      const nameAttr = name
        ? name.startsWith('"') || name.includes("'")
          ? ` name=${name}`
          : ` name="${name.replace(/^["']|["']$/g, "")}"`
        : "";
      // fix name if expression
      let nameVue = "";
      if (getStr("name")) nameVue = ` name="${getStr("name")}"`;
      else if (get("name")) nameVue = ` :name="${get("name")}"`;
      return `<TresMesh :position="${at}"${rot ? ` :rotation="${rot}"` : ""} :material="${mat}"${nameVue}${shadow ? " cast-shadow receive-shadow" : ""}>
  <TresBoxGeometry :args="${size}" />
</TresMesh>`;
    },
  );
}

function convert(s) {
  s = expandPanel(s);
  s = s.replace(/\bref=\{(\w+)\}/g, 'ref="$1"');
  s = s.replace(/\bkey=\{([^}]+)\}/g, ':key="$1"');
  s = s.replace(
    /(\s)(position|rotation|args|scale|offset)=\{(\[[^\]]*\])\}/g,
    ':$2="$3"',
  );
  s = s.replace(
    /(\s)(amount|material|mat|metal|rubber|points|axis|width|height|bar|depth|size|at|radius|smoothness|bevelSegments|renderOrder)=\{([^}]+)\}/g,
    (m, sp, name, val) => {
      const kebab = name.replace(/([A-Z])/g, "-$1").toLowerCase();
      return `${sp}:${kebab}="${val.trim()}"`;
    },
  );
  s = s.replace(/\s+castShadow(?=\s|\/|>)/g, " cast-shadow");
  s = s.replace(/\s+receiveShadow(?=\s|\/|>)/g, " receive-shadow");
  s = s.replace(/<\/?group\b/g, (m) => m.replace("group", "TresGroup"));
  s = s.replace(/<\/?mesh\b/g, (m) => m.replace("mesh", "TresMesh"));
  s = s.replace(/<boxGeometry\b/g, "<TresBoxGeometry");
  s = s.replace(/<\/boxGeometry>/g, "</TresBoxGeometry>");
  s = s.replace(/<cylinderGeometry\b/g, "<TresCylinderGeometry");
  s = s.replace(/<\/cylinderGeometry>/g, "</TresCylinderGeometry>");
  s = s.replace(/<planeGeometry\b/g, "<TresPlaneGeometry");
  s = s.replace(/<\/planeGeometry>/g, "</TresPlaneGeometry>");
  s = s.replace(/<sphereGeometry\b/g, "<TresSphereGeometry");
  s = s.replace(/<\/sphereGeometry>/g, "</TresSphereGeometry>");
  s = s.replace(
    /<Text[\s\S]*?<\/Text>/g,
    "<!-- Text label omitted; logo texture remains -->",
  );
  // PictureFrame → keep as component
  // LevelFoot, Studs → keep
  // RoundedBox from cientos
  // geometry={x} → :geometry
  s = s.replace(/\sgeometry=\{([^}]+)\}/g, ' :geometry="$1"');
  s = s.replace(/\smaterial=\{([^}]+)\}/g, ' :material="$1"');
  // name="x" stays; name={expr}
  s = s.replace(/\sname=\{([^}]+)\}/g, ' :name="$1"');
  // class → N/A
  // Vue comment for {/* */}
  s = s.replace(/\{\/\*([\s\S]*?)\*\/\}/g, "<!--$1-->");
  // {expr && ( → leave - Vue uses v-if differently; maps stay
  return s;
}

const template = convert(jsx);

const vue = `<script setup lang="ts">
/**
 * SF-260H 整机外形 — Vue + TresJS 移植
 * showEnclosure=true 门关；false 门向右滑开。
 */
import { computed, onBeforeUnmount, shallowRef, watch } from "vue";
import * as THREE from "three";
import { useLoop } from "@tresjs/core";
import { RoundedBox } from "@tresjs/cientos";
import { useSimStore } from "@/stores/sim";
import { useViewStore } from "@/stores/view";
import ExplodePart from "./ExplodePart.vue";
import { explodeAmounts } from "./explodeAmounts";
import PictureFrame from "./exterior/PictureFrame.vue";
import LevelFoot from "./exterior/LevelFoot.vue";
import Studs from "./exterior/Studs.vue";

const props = defineProps<{
  cx: number;
  cz: number;
  baseTopY: number;
}>();

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

${extractPaintFns(src)}

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

const KEY_COLS = [-22, -11, 0, 11, 22];
const KEY_ROWS = [4, -6, -16, -26];
const CAP_COLORS = ["#dc2626", "#16a34a", "#eab308", "#2563eb"] as const;

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

const view = useViewStore();
const sim = useSimStore();

const rootRef = shallowRef<THREE.Group | null>(null);
const doorRef = shallowRef<THREE.Group | null>(null);
const openAmt = { current: view.showEnclosure ? 0 : 1 };
const ghostAmt = { current: sim.playing ? 1 : 0 };

const shellAmt = computed(() => explodeAmounts(view.explodeAmount, true).shell);

const waveTex = canvasTexture(256, 1024, paintWave);
const stickerTex = canvasTexture(256, 320, paintSticker);
const screenTex = canvasTexture(512, 360, paintScreen);
const logoTex = canvasTexture(160, 160, paintLogo);
const modelPlateTex = canvasTexture(128, 640, paintModelPlate);
const corpPlateTex = canvasTexture(256, 320, paintCorpPlate);
const stripLabelTex = canvasTexture(512, 96, paintStripLabel);
const sideTagTex = canvasTexture(512, 96, paintSideTagLabel);

const airGeo = new THREE.TubeGeometry(
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
);

function buildMats() {
  const cap = (color: string) =>
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.36,
      metalness: 0.18,
      emissive: color,
      emissiveIntensity: 0.14,
    });
  return {
    sheet: paintMat("#f3f5f7", 0.46, 0.24, 0.62),
    sheetAlt: paintMat("#d5dbe3", 0.52, 0.1, 0.45),
    yellow: paintMat("#f6c400", 0.34, 0.42, 0.75),
    yellowDeep: paintMat("#e2ae00", 0.4, 0.3, 0.6),
    stainless: new THREE.MeshStandardMaterial({
      color: "#f7f9fc",
      roughness: 0.22,
      metalness: 0.48,
    }),
    steel: new THREE.MeshStandardMaterial({
      color: "#d5dde6",
      roughness: 0.3,
      metalness: 0.55,
    }),
    cavity: new THREE.MeshStandardMaterial({
      color: "#12161c",
      roughness: 0.62,
      metalness: 0.35,
    }),
    frame: new THREE.MeshStandardMaterial({
      color: "#1a1f26",
      roughness: 0.4,
      metalness: 0.55,
    }),
    glass: new THREE.MeshPhysicalMaterial({
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
    glassSide: new THREE.MeshPhysicalMaterial({
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
    streak: new THREE.MeshStandardMaterial({
      color: "#ffffff",
      roughness: 0.04,
      metalness: 0,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    }),
    nameplate: new THREE.MeshPhysicalMaterial({
      color: "#b7c2ce",
      roughness: 0.38,
      metalness: 0.42,
      clearcoat: 0.25,
      clearcoatRoughness: 0.35,
      envMapIntensity: 0.8,
    }),
    seam: new THREE.MeshStandardMaterial({
      color: "#c5ccd6",
      roughness: 0.5,
      metalness: 0.25,
    }),
    seamDark: new THREE.MeshStandardMaterial({
      color: "#8b95a3",
      roughness: 0.48,
      metalness: 0.3,
    }),
    rubber: new THREE.MeshStandardMaterial({
      color: "#14171c",
      roughness: 0.9,
      metalness: 0.04,
    }),
    cableMat: new THREE.MeshStandardMaterial({
      color: "#1a1d22",
      roughness: 0.72,
      metalness: 0.08,
    }),
    blue: new THREE.MeshStandardMaterial({
      color: "#1d4ed8",
      roughness: 0.34,
      metalness: 0.12,
      emissive: "#1e3a8a",
      emissiveIntensity: 0.12,
    }),
    keyDark: new THREE.MeshStandardMaterial({
      color: "#2a313b",
      roughness: 0.55,
      metalness: 0.25,
    }),
    keyLight: new THREE.MeshStandardMaterial({
      color: "#e7ebf0",
      roughness: 0.48,
      metalness: 0.12,
    }),
    screen: new THREE.MeshStandardMaterial({
      map: screenTex,
      emissive: new THREE.Color("#7dd3fc"),
      emissiveMap: screenTex,
      emissiveIntensity: 0.42,
      roughness: 0.28,
      metalness: 0.05,
    }),
    wave: new THREE.MeshBasicMaterial({
      color: "#ffffff",
      map: waveTex,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    }),
    sticker: new THREE.MeshStandardMaterial({
      map: stickerTex,
      roughness: 0.58,
      metalness: 0.05,
    }),
    logo: new THREE.MeshStandardMaterial({
      map: logoTex,
      transparent: true,
      roughness: 0.45,
      metalness: 0.1,
      depthWrite: false,
    }),
    modelPlate: new THREE.MeshBasicMaterial({
      map: modelPlateTex,
      transparent: true,
      alphaTest: 0.15,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      side: THREE.FrontSide,
    }),
    corpPlate: new THREE.MeshBasicMaterial({
      map: corpPlateTex,
      transparent: true,
      alphaTest: 0.15,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      side: THREE.FrontSide,
    }),
    stripLabel: new THREE.MeshBasicMaterial({
      map: stripLabelTex,
      transparent: true,
      alphaTest: 0.15,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      side: THREE.FrontSide,
    }),
    sideTagLabel: new THREE.MeshBasicMaterial({
      map: sideTagTex,
      transparent: true,
      alphaTest: 0.15,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      side: THREE.FrontSide,
    }),
    bolt: new THREE.MeshStandardMaterial({
      color: "#3a4250",
      roughness: 0.42,
      metalness: 0.7,
    }),
    capRed: cap("#dc2626"),
    capGreen: cap("#16a34a"),
    capYellow: cap("#eab308"),
    capBlue: cap("#2563eb"),
    capWhite: cap("#f8fafc"),
  };
}

const mats = buildMats();
const capMats = [mats.capRed, mats.capGreen, mats.capYellow, mats.capBlue];

const cx = computed(() => props.cx);
const cz = computed(() => props.cz);
const baseTopY = computed(() => props.baseTopY);

const W = 416;
const D = 360;
const H = 318;
const R = 14;
const skin = 8;

const dims = computed(() => {
  const y0 = baseTopY.value - 4;
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
  const coilTopY = -hmiH / 2 + 10;
  const coilTopZ = hmiFaceZ - 3;
  const coilBotY = y0 + 26 - hmiY;
  const coilBotZ = 2 - hmiD / 2 - 1;
  return {
    y0, yTop, halfW, halfD, zFace, seamY, yUpper, upperH,
    doorW, doorX, doorH, doorY, openL, openR, openB, openT, slide,
    winW, winH, winX, winY, sideWinW, sideWinH, sideWinZ, sideWinY,
    svcW, svcH, svcZ, svcY, stripH, stripY,
    leftX0, leftW, rightW, sillH, headH,
    hmiW, hmiH, hmiD, hmiFaceZ, hmiY, coilTopY, coilTopZ, coilBotY, coilBotZ,
  };
});

const frontBolts = computed(() => {
  const d = dims.value;
  const pts: [number, number, number][] = [];
  for (let x = -d.halfW + 46; x < d.openL - 16; x += 26) {
    pts.push([x, d.y0 + 16, d.zFace + 1.1]);
  }
  return pts;
});
const sideBolts = computed(() => {
  const d = dims.value;
  const pts: [number, number, number][] = [];
  for (let z = -d.halfD + 48; z <= d.halfD - 52; z += 46) {
    pts.push([-d.halfW - 1.05, d.y0 + 15, z]);
  }
  return pts;
});
const footAt = computed(() => {
  const d = dims.value;
  return [
    [-d.halfW + 28, d.halfD - 16],
    [d.halfW - 28, d.halfD - 16],
    [-d.halfW + 36, -d.halfD + 28],
    [d.halfW - 36, -d.halfD + 28],
    [-20, d.halfD - 14],
    [d.halfW - 48, -d.halfD + 30],
  ] as [number, number][];
});

const cables = computed(() => {
  const d = dims.value;
  return {
    a: makeCoil([-14, d.coilTopY, d.coilTopZ], [-20, d.coilBotY, d.coilBotZ], 9),
    b: makeCoil([12, d.coilTopY, d.coilTopZ], [6, d.coilBotY + 4, d.coilBotZ], 8),
  };
});

watch(cables, (cur, prev) => {
  prev?.a.dispose();
  prev?.b.dispose();
});

watch(
  () => mats,
  () => {
    if (rootRef.value && ghostAmt.current > 0.01) {
      applyExteriorGhost(rootRef.value, ghostAmt.current);
    }
  },
);

const { onBeforeRender } = useLoop();
onBeforeRender(({ delta }) => {
  const target = view.showEnclosure ? 0 : 1;
  openAmt.current = THREE.MathUtils.damp(openAmt.current, target, 5.5, delta);
  if (doorRef.value) doorRef.value.position.x = openAmt.current * dims.value.slide;

  const ghostTarget = sim.playing ? 1 : 0;
  const prevGhost = ghostAmt.current;
  ghostAmt.current = THREE.MathUtils.damp(ghostAmt.current, ghostTarget, 6, delta);
  if (
    rootRef.value &&
    (Math.abs(ghostAmt.current - prevGhost) > 0.0005 ||
      Math.abs(ghostAmt.current - ghostTarget) > 0.001)
  ) {
    applyExteriorGhost(rootRef.value, ghostAmt.current);
  }
});

onBeforeUnmount(() => {
  [
    waveTex, stickerTex, screenTex, logoTex,
    modelPlateTex, corpPlateTex, stripLabelTex, sideTagTex,
  ].forEach((t) => t.dispose());
  airGeo.dispose();
  cables.value.a.dispose();
  cables.value.b.dispose();
  Object.values(mats).forEach((m) => m.dispose());
});

// expose template bindings
const d = dims;
</script>

<template>
${fixTemplateBindings(template)}
</template>
`;

function extractPaintFns(src) {
  const names = [
    "paintWave",
    "paintSticker",
    "paintScreen",
    "paintLogo",
    "paintModelPlate",
    "paintCorpPlate",
    "paintStripLabel",
    "paintSideTagLabel",
  ];
  const chunks = [];
  for (const name of names) {
    const re = new RegExp(
      `function ${name}\\([\\s\\S]*?\\n\\}\\n`,
    );
    const m = src.match(re);
    if (m) chunks.push(m[0]);
    else console.warn("missing", name);
  }
  return chunks.join("\n");
}

function fixTemplateBindings(t) {
  // Replace local const refs used in original template with d.xxx / props
  // The original used bare identifiers: y0, W, doorX, mats, shellAmt, etc.
  // Keep mats, shellAmt, KEY_*, CAP_*, airGeo, cables, frontBolts, sideBolts, footAt, capMats
  // Map dimension vars through d
  const dimKeys = [
    "y0","yTop","halfW","halfD","zFace","seamY","yUpper","upperH",
    "doorW","doorX","doorH","doorY","openL","openR","openB","openT","slide",
    "winW","winH","winX","winY","sideWinW","sideWinH","sideWinZ","sideWinY",
    "svcW","svcH","svcZ","svcY","stripH","stripY",
    "leftX0","leftW","rightW","sillH","headH",
    "hmiW","hmiH","hmiD","hmiFaceZ","hmiY","coilTopY","coilTopZ","coilBotY","coilBotZ",
  ];
  // In :attr="expr" replace bare dim keys with d.xxx carefully - too hard generally.
  // Instead unwrap dims in template via const aliases - we'll use computed dims as `d`
  // and do a careful replace in attribute expressions.
  for (const k of dimKeys) {
    // only inside attribute quotes after :=
    t = t.replace(new RegExp(`(:[\\w-]+=\\")([^"]*)\\b${k}\\b([^"]*)(\\")`, "g"), (m, a, b, c, d2) => {
      // avoid replacing d.k already
      if (b.endsWith("d.") || /\\wd\\./.test(b.slice(-2))) return m;
      return `${a}${b.replace(new RegExp(`\\\\b${k}\\\\b`,'g'), `d.${k}`)}${c.replace(new RegExp(`\\\\b${k}\\\\b`,'g'), `d.${k}`)}${d2}`;
    });
  }
  // Fix botched replace - do simpler: replace in whole template expressions
  // Actually rewrite: for each :attr="...", replace \bkey\b with d.key if key in dimKeys
  t = t.replace(/:([\w-]+)="([^"]*)"/g, (m, name, expr) => {
    let e = expr;
    for (const k of dimKeys) {
      e = e.replace(new RegExp(`(?<![.\\w])${k}(?![\\w])`, "g"), `d.${k}`);
    }
    // W, D, H, R, skin constants stay (script const)
    // cx, cz → props already same names via defineProps - in template props are unwrapped
    e = e.replace(/\\bmats\\./g, "mats.");
    return `:${name}="${e}"`;
  });
  // position={[cx,0,cz]} already converted
  t = t.replace(/shellAmt/g, "shellAmt");
  // Vue needs v-for instead of .map in some cases - keep .map as JSX expressions don't work in Vue templates!
  // CRITICAL: Vue templates cannot use Array.map() JSX style. Need to convert maps to v-for.
  return t;
}

fs.writeFileSync(
  "e:/Desktop/CNC/scripts/_exterior_raw_template.txt",
  template,
);
console.log("template len", template.length);
console.log("WARNING: Vue template cannot use .map() — need manual fix");
fs.writeFileSync("e:/Desktop/CNC/scripts/_exterior_partial.vue", vue.slice(0, 2000));
console.log("partial written, full vue length", vue.length);
