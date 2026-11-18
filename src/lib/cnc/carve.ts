// CNC Simulator  — workpiece carving engine
// Builds a subdivided top-surface geometry and maintains a heightmap
// that represents how deep the tool has cut at every (X,Y) grid vertex.

import * as THREE from "three";
import { sampleMove } from "./parser";
import type { Move, OriginDatum } from "./types";
import type { Workpiece } from "./types";
import { getToolByNumber, toolRadius } from "./tools";

export type ToolRadiusFn = (toolNumber: number) => number;

export interface TopSurface {
  geometry: THREE.BufferGeometry;
  N: number;
  topY: Float32Array; // (N+1)^2 live heights (cnc Z, 0 = uncut, negative = cut)
  applyHeightmap: (hm: Float32Array) => void;
  reset: () => void;
}

export function createTopSurface(
  width: number,
  depth: number,
  N: number,
  originDatum: OriginDatum = "front_left",
): TopSurface {
  const cols = N + 1;
  const count = cols * cols;
  const positions = new Float32Array(count * 3);
  const topY = new Float32Array(count);

  const isFrontLeft = originDatum === "front_left";
  const hx = isFrontLeft ? 0 : width / 2;
  const hz = isFrontLeft ? 0 : depth / 2;

  for (let j = 0; j < cols; j++) {
    for (let i = 0; i < cols; i++) {
      const idx = j * cols + i;
      const x = isFrontLeft ? (i / N) * width : -hx + (i / N) * width;
      const y = isFrontLeft ? (j / N) * depth : -hz + (j / N) * depth;
      positions[idx * 3] = x;
      positions[idx * 3 + 1] = 0;
      positions[idx * 3 + 2] = -y;
      topY[idx] = 0;
    }
  }

  const indices: number[] = [];
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const a = j * cols + i;
      const b = j * cols + i + 1;
      const c = (j + 1) * cols + i + 1;
      const d = (j + 1) * cols + i;
      // CCW from +Y (up): a, c, b ; a, d, c
      indices.push(a, c, b, a, d, c);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return {
    geometry,
    N,
    topY,
    applyHeightmap(hm: Float32Array) {
      const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < count; i++) {
        topY[i] = hm[i];
        arr[i * 3 + 1] = hm[i];
      }
      pos.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
    },
    reset() {
      for (let i = 0; i < count; i++) {
        topY[i] = 0;
        positions[i * 3 + 1] = 0;
      }
      const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
      pos.needsUpdate = true;
      geometry.computeVertexNormals();
    },
  };
}

function isDrillLike(toolNum: number): boolean {
  const t = getToolByNumber(toolNum);
  if (!t) return false;
  return (
    t.type === "drill" ||
    t.type === "spot_drill" ||
    t.type === "reamer" ||
    t.type === "tap"
  );
}

// Stamp a single disc (tool cross-section) at (px,py) cnc coords with depth dz.
function stampDisc(
  hm: Float32Array,
  N: number,
  width: number,
  depth: number,
  px: number,
  py: number,
  radius: number,
  dz: number,
  originDatum: OriginDatum = "front_left",
  softEdge = true,
) {
  if (dz >= 0) return; // only cut when tool is below surface
  const cols = N + 1;
  const isFrontLeft = originDatum === "front_left";
  const hx = isFrontLeft ? 0 : width / 2;
  const hz = isFrontLeft ? 0 : depth / 2;

  // cell size
  const sx = width / N;
  const sz = depth / N;
  const edgeMargin = softEdge ? Math.min(sx, sz) * 0.75 : Math.min(sx, sz) * 0.15;
  const rMax = radius + edgeMargin;
  const rMax2 = rMax * rMax;

  const i0 = Math.max(0, Math.floor((px - rMax + hx) / sx));
  const i1 = Math.min(N, Math.ceil((px + rMax + hx) / sx));
  const j0 = Math.max(0, Math.floor((py - rMax + hz) / sz));
  const j1 = Math.min(N, Math.ceil((py + rMax + hz) / sz));

  for (let j = j0; j <= j1; j++) {
    const y = isFrontLeft ? (j / N) * depth : -hz + (j / N) * depth;
    const dy2 = (y - py) * (y - py);
    if (dy2 > rMax2) continue;
    for (let i = i0; i <= i1; i++) {
      const x = isFrontLeft ? (i / N) * width : -hx + (i / N) * width;
      const dx2 = (x - px) * (x - px);
      const d2 = dx2 + dy2;
      if (d2 > rMax2) continue;

      const dist = Math.sqrt(d2);
      let cutZ = dz;
      if (dist > radius) {
        // smooth edge chamfer anti-aliasing
        const factor = (dist - radius) / edgeMargin;
        cutZ = dz * (1 - factor);
      }

      const idx = j * cols + i;
      if (cutZ < hm[idx]) {
        hm[idx] = cutZ;
      }
    }
  }
}

/**
 * 钻孔专用：锐边圆柱孔壁 + 钻尖锥底（中心最深 = tipZ）
 * tipZ 为刀尖到达的 Z（负值）；pointAngle 为钻尖角。
 */
function stampDrillHole(
  hm: Float32Array,
  N: number,
  width: number,
  depth: number,
  px: number,
  py: number,
  radius: number,
  tipZ: number,
  pointAngle: number,
  originDatum: OriginDatum = "front_left",
) {
  if (tipZ >= 0) return;
  const cols = N + 1;
  const isFrontLeft = originDatum === "front_left";
  const hx = isFrontLeft ? 0 : width / 2;
  const hz = isFrontLeft ? 0 : depth / 2;
  const sx = width / N;
  const sz = depth / N;
  const half = THREE.MathUtils.degToRad(pointAngle / 2);
  const tipH = Math.max(radius * 0.55, radius / Math.tan(half));
  // 锐边：仅半个格子过渡，避免火山口软边
  const edgeMargin = Math.min(sx, sz) * 0.2;
  const rMax = radius + edgeMargin;
  const rMax2 = rMax * rMax;

  const i0 = Math.max(0, Math.floor((px - rMax + hx) / sx));
  const i1 = Math.min(N, Math.ceil((px + rMax + hx) / sx));
  const j0 = Math.max(0, Math.floor((py - rMax + hz) / sz));
  const j1 = Math.min(N, Math.ceil((py + rMax + hz) / sz));

  for (let j = j0; j <= j1; j++) {
    const y = isFrontLeft ? (j / N) * depth : -hz + (j / N) * depth;
    const dy2 = (y - py) * (y - py);
    if (dy2 > rMax2) continue;
    for (let i = i0; i <= i1; i++) {
      const x = isFrontLeft ? (i / N) * width : -hx + (i / N) * width;
      const dist = Math.hypot(x - px, y - py);
      if (dist > rMax) continue;

      // 锥底：中心 tipZ，孔口边缘 tipZ+tipH（圆柱段之上）
      let floorZ = tipZ + tipH * Math.min(1, dist / Math.max(radius, 1e-6));
      if (dist > radius) {
        const f = (dist - radius) / edgeMargin;
        floorZ = floorZ * (1 - f); // 外缘迅速回到 0
      }
      // 孔内保持锐边圆柱观感：半径内不低于锥底
      if (dist <= radius) {
        floorZ = tipZ + tipH * (dist / Math.max(radius, 1e-6));
      }

      const idx = j * cols + i;
      if (floorZ < hm[idx]) hm[idx] = floorZ;
    }
  }
}

// Stamp a move (full or partial up to tMax) into heightmap hm.
export function stampMove(
  hm: Float32Array,
  move: Move,
  tMax: number,
  tr: number,
  width: number,
  depth: number,
  N: number,
  originDatum: OriginDatum = "front_left",
) {
  if (move.type === "dwell" || move.type === "rapid") {
    return;
  }
  if (tMax <= 0) return;

  const drill = isDrillLike(move.tool);
  const horiz = Math.hypot(move.to.x - move.from.x, move.to.y - move.from.y);
  const plunge = move.from.z - move.to.z;
  const isPlunge = drill && plunge > 0.2 && horiz < Math.max(tr * 1.2, 0.8);

  if (isPlunge) {
    const tool = getToolByNumber(move.tool);
    const pointAngle = tool?.pointAngle ?? (tool?.type === "spot_drill" ? 90 : 118);
    const samples = Math.max(3, Math.min(80, Math.ceil(plunge / 0.4)));
    for (let s = 0; s <= samples; s++) {
      const t = (s / samples) * tMax;
      const p = sampleMove(move, t);
      stampDrillHole(
        hm,
        N,
        width,
        depth,
        p.x,
        p.y,
        tr,
        p.z,
        pointAngle,
        originDatum,
      );
    }
    return;
  }

  const len = move.length;
  const samples = Math.max(2, Math.min(500, Math.ceil(len / Math.max(tr * 0.5, 0.5))));
  for (let s = 0; s <= samples; s++) {
    const t = (s / samples) * tMax;
    const p = sampleMove(move, t);
    stampDisc(hm, N, width, depth, p.x, p.y, tr, p.z, originDatum, !drill);
  }
}

/** 从刀路提取钻孔位置，用于孔壁三维可视化 */
export interface DrillHoleSpec {
  x: number;
  y: number;
  radius: number;
  tipZ: number;
  pointAngle: number;
  tool: number;
  /** 孔达到最终深度的 move index */
  doneMoveIndex: number;
}

export function extractDrillHoles(moves: Move[]): DrillHoleSpec[] {
  const holes: DrillHoleSpec[] = [];
  for (const m of moves) {
    if (m.type !== "linear") continue;
    if (!isDrillLike(m.tool)) continue;
    const tool = getToolByNumber(m.tool);
    if (!tool) continue;
    const horiz = Math.hypot(m.to.x - m.from.x, m.to.y - m.from.y);
    const plunge = m.from.z - m.to.z;
    if (plunge < 0.4 || horiz > tool.diameter * 0.55) continue;
    if (m.to.z >= -0.05) continue;

    const r = tool.diameter / 2;
    const existing = holes.find(
      (h) => Math.hypot(h.x - m.to.x, h.y - m.to.y) < r * 0.45,
    );
    const pointAngle =
      tool.pointAngle ?? (tool.type === "spot_drill" ? 90 : 118);
    if (existing) {
      if (m.to.z < existing.tipZ) {
        existing.tipZ = m.to.z;
        existing.radius = Math.max(existing.radius, r);
        existing.doneMoveIndex = m.index;
        existing.pointAngle = pointAngle;
        existing.tool = m.tool;
      }
    } else {
      holes.push({
        x: m.to.x,
        y: m.to.y,
        radius: r,
        tipZ: m.to.z,
        pointAngle,
        tool: m.tool,
        doneMoveIndex: m.index,
      });
    }
  }
  return holes;
}

// Build cumulative heightmaps: result[k] = state after k moves (result[0] = uncut).
// Uses the per-move tool number to look up the cutting radius.
export function buildCumulativeHeightmaps(
  moves: Move[],
  workpiece: Workpiece,
  N: number,
  trFn: ToolRadiusFn = toolRadius,
  originDatum: OriginDatum = "front_left",
): Float32Array[] {
  const cols = N + 1;
  const count = cols * cols;
  const result: Float32Array[] = [];
  const current = new Float32Array(count); // all zeros
  result.push(new Float32Array(current));
  for (const m of moves) {
    stampMove(current, m, 1, trFn(m.tool), workpiece.width, workpiece.depth, N, originDatum);
    result.push(new Float32Array(current));
  }
  return result;
}

// Apply the partial state: copy base (after previous move) then stamp partial current move.
export function applyPartialCut(
  target: Float32Array,
  base: Float32Array,
  move: Move | undefined,
  t: number,
  trFn: ToolRadiusFn,
  width: number,
  depth: number,
  N: number,
  originDatum: OriginDatum = "front_left",
) {
  target.set(base);
  if (move) {
    stampMove(target, move, t, trFn(move.tool), width, depth, N, originDatum);
  }
}

// Build a polyline (with per-vertex color) for the toolpath, split by type.
export function buildToolpathLines(moves: Move[]): {
  feedPoints: THREE.Vector3[];
  rapidPoints: THREE.Vector3[];
} {
  const feedPoints: THREE.Vector3[] = [];
  const rapidPoints: THREE.Vector3[] = [];
  // map cnc (x,y,z) -> three (x, z, -y)
  const toVec = (p: { x: number; y: number; z: number }) =>
    new THREE.Vector3(p.x, p.z, -p.y);
  let lastFeed = false;
  for (let i = 0; i < moves.length; i++) {
    const m = moves[i];
    const isRapid = m.type === "rapid";
    const arr = isRapid ? rapidPoints : feedPoints;
    if (arr.length === 0 || (isRapid !== lastFeed)) {
      arr.push(toVec(m.from));
    }
    if (m.type === "arc_cw" || m.type === "arc_ccw") {
      const samples = Math.max(8, Math.min(120, Math.ceil((m.sweep ?? 0) / 0.1)));
      for (let s = 1; s <= samples; s++) {
        const t = s / samples;
        const p = sampleMove(m, t);
        arr.push(toVec(p));
      }
    } else {
      arr.push(toVec(m.to));
    }
    lastFeed = !isRapid;
  }
  return { feedPoints, rapidPoints };
}
