// CNC Simulator  — Feeds & Speeds calculation engine
// Computes recommended cutting parameters (RPM, feed, MRR, power, DOC/WOC)
// from a tool + material combination, with override factors and safety warnings.
//
// Formulas (metric):
//   RPM  = (Vc * 1000) / (pi * D)        Vc in m/min, D in mm
//   Feed = fz * z * RPM                   fz = chip load mm/tooth, z = flutes
//   MRR  = (WOC * DOC * Feed) / 1000      cm³/min  (inputs in mm & mm/min)
//   Power = MRR * Kp                       kW,  Kp = material unit power

import type { CncTool } from "./tools";
import type { CncMaterial } from "./materials";

export interface FeedsResult {
  rpm: number; // spindle RPM
  feedMmPerMin: number; // cutting feed rate
  chipLoadActual: number; // mm/tooth
  mrr: number; // material removal rate cm³/min
  power: number; // estimated spindle power kW
  docAxial: number; // recommended axial depth of cut mm
  docRadial: number; // recommended radial width of cut mm
  warnings: string[];
}

/** Typical hobby/production VMC spindle ceiling. */
const SPINDLE_MAX_RPM = 24000;

/**
 * Material unit-power constants, expressed in kW per (cm³/min) of removal.
 * These are the Kp coefficients used in  Power = MRR * Kp.
 * Per project spec: aluminum ~0.5, steel ~2.0, brass ~0.7, stainless ~2.5,
 * delrin ~0.2, wood ~0.3.
 */
const UNIT_POWER: Record<string, number> = {
  "aluminum-6061": 0.5,
  "aluminum-7075": 0.55,
  "steel-mild": 2.0,
  "steel-stainless": 2.5,
  brass: 0.7,
  copper: 0.6,
  delrin: 0.2,
  "wood-oak": 0.3,
};

function getUnitPower(materialId: string): number {
  return UNIT_POWER[materialId] ?? 1.0;
}

function roundTo(n: number, step: number): number {
  return Math.round(n / step) * step;
}

/**
 * Compute feeds & speeds for a tool/material pair.
 *
 * Override options (all expressed as percent, default 100):
 *  - axialOverride      : % of recommended max axial DOC (10..100)
 *  - radialOverridePct  : % of recommended max radial WOC (10..100)
 *  - feedOverridePct    : % of nominal programmed feed (50..150)
 */
export function calculateFeeds(
  tool: CncTool,
  material: CncMaterial,
  opts?: {
    axialOverride?: number;
    radialOverridePct?: number;
    feedOverridePct?: number;
  },
): FeedsResult {
  const axialPct = opts?.axialOverride ?? 100;
  const radialPct = opts?.radialOverridePct ?? 100;
  const feedPct = opts?.feedOverridePct ?? 100;

  const warnings: string[] = [];

  // ---- Surface speed & chip load: constrained by the more conservative of tool / material ----
  const vc = Math.min(tool.surfaceSpeed, material.surfaceSpeed);
  const fzBase = Math.min(tool.chipLoad, material.chipLoad);

  // ---- RPM = (Vc * 1000) / (pi * D) ----
  const D = Math.max(tool.diameter, 0.1);
  let rpm = (vc * 1000) / (Math.PI * D);
  if (rpm > SPINDLE_MAX_RPM) {
    warnings.push(
      `转速超过主轴上限（${SPINDLE_MAX_RPM.toLocaleString()} rpm）— 已封顶。请减小刀具直径或接受更低的切削速度。`,
    );
    rpm = SPINDLE_MAX_RPM;
  }
  if (rpm < 100) {
    warnings.push(
      "转速过低 — 刀具过大或材料切削速度偏慢。请确认主轴在此转速下能提供足够切削扭矩。",
    );
  }
  const rpmRounded = Math.max(roundTo(rpm, 10), 0);

  // ---- Effective chip load (feed override scales fz at constant RPM) ----
  const fz = fzBase * (feedPct / 100);
  const z = Math.max(tool.flutes, 1);
  const feed = Math.max(fz * z * rpmRounded, 0);

  // ---- Recommended DOC / WOC (apply user overrides on the safe baseline) ----
  const maxAxial = Math.min(tool.length, material.maxDepthOfCut);
  const docAxial = Math.max(maxAxial * (axialPct / 100), 0);
  const radialFrac = (material.maxStepover / 100) * (radialPct / 100);
  const docRadial = Math.max(tool.diameter * radialFrac, 0);

  // ---- MRR (cm³/min) = (WOC * DOC * Feed) / 1000 ----
  const mrr = (docRadial * docAxial * feed) / 1000;

  // ---- Spindle power = MRR * Kp ----
  const kp = getUnitPower(material.id);
  const power = mrr * kp;

  // ---------------- Warnings ----------------
  if (fz > 0 && fz < 0.02) {
    warnings.push(
      "每齿进给过低（<0.020 mm/齿）— 存在摩擦风险。刀具会打磨而非切削；请降低转速或提高进给。",
    );
  }
  if (fz > 0.15) {
    warnings.push(
      "每齿进给过高（>0.150 mm/齿）— 有崩刃或断刀风险。请降低进给或增加刃数/转速。",
    );
  }
  if (feed > 5000) {
    warnings.push(
      `进给速度偏高（${Math.round(feed).toLocaleString()} mm/min）— 请确认机床快速进给与伺服刚性。`,
    );
  }
  if (power > 5) {
    warnings.push(
      `主轴功率需求偏高（${power.toFixed(2)} kW）— 请确认主轴额定功率、刚性与冷却液流量。`,
    );
  }
  if (docAxial > 3 * D) {
    warnings.push(
      "轴向切深 > 3× 刀具直径 — 排屑受影响。建议分啄钻削或减小每刀深度。",
    );
  }
  if (docRadial > 0.9 * D) {
    warnings.push(
      "径向切宽 > 90% — 接近满槽切削。请将进给降低 30–50%，或改用高速加工（HSM）刀路。",
    );
  }
  if (material.id === "steel-stainless") {
    warnings.push(
      "不锈钢极易加工硬化 — 保持足够每齿进给，避免停留，必须使用冲淋冷却。",
    );
  }
  if (material.id === "delrin" && rpmRounded < 5000) {
    warnings.push(
      "Delrin 在低转速下有熔化风险 — 请提高切削速度并用气冷清除切屑。",
    );
  }
  if (material.id === "copper") {
    warnings.push(
      "铜材黏性大 — 请使用锋利抛光硬质合金刀具并保持较大每齿进给，以避免积屑瘤。",
    );
  }
  if (tool.type === "drill" || tool.type === "spot_drill" || tool.type === "reamer") {
    const typeLabel: Record<string, string> = {
      drill: "麻花钻",
      spot_drill: "定心钻",
      reamer: "铰刀",
    };
    warnings.push(
      `${typeLabel[tool.type] ?? tool.type}：进给/转速计算为近似值 — 请按厂商建议使用啄钻循环（G83/G81）及每转进给。`,
    );
  }
  if (tool.type === "chamfer") {
    warnings.push(
      "倒角刀：有效切削直径随深度变化 — 请按实际切入直径重新计算切削速度 Vc。",
    );
  }
  if (tool.type === "face_mill") {
    warnings.push(
      "面铣刀：应从毛坯外侧切入，径向吃刀小于 50%，以避免入刀冲击。",
    );
  }

  return {
    rpm: rpmRounded,
    feedMmPerMin: Math.round(feed),
    chipLoadActual: Number(fz.toFixed(4)),
    mrr: Number(mrr.toFixed(3)),
    power: Number(power.toFixed(3)),
    docAxial: Number(docAxial.toFixed(2)),
    docRadial: Number(docRadial.toFixed(2)),
    warnings,
  };
}
