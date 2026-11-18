// CNC Simulator  — International Material Catalog (ISO 513 Classification)
// Covers Steels (P), Stainless Steels (M), Cast Iron (K), Non-Ferrous (N), Superalloys (S), Hardened (H) & Synthetics (O)

export type IsoMaterialGroup =
  | "P（钢）"
  | "M（不锈钢）"
  | "K（铸铁）"
  | "N（有色金属）"
  | "S（高温合金）"
  | "H（淬硬钢）"
  | "O（合成材料）";

export interface CncMaterial {
  id: string;
  name: string;
  isoGroup: IsoMaterialGroup;
  color: string; // workpiece top surface color in 3D
  sideColor: string; // workpiece side/bottom color in 3D
  roughness: number; // PBR surface roughness (0..1)
  metalness: number; // PBR metalness (0..1)
  density: number; // g/cm³
  // cutting parameters (for baseline carbide tooling)
  surfaceSpeed: number; // Vc m/min
  chipLoad: number; // fz mm/tooth
  maxDepthOfCut: number; // axial Ae mm
  maxStepover: number; // radial % of diameter
  coolant: "flood" | "mist" | "air" | "none";
  notes: string;
}

export const MATERIAL_LIBRARY: CncMaterial[] = [
  // --- ISO N: NON-FERROUS METALS ---
  {
    id: "aluminum-6061",
    name: "铝合金 6061-T6（ISO N01）",
    isoGroup: "N（有色金属）",
    color: "#d1d5db",
    sideColor: "#9ca3af",
    roughness: 0.35,
    metalness: 0.85,
    density: 2.7,
    surfaceSpeed: 250,
    chipLoad: 0.05,
    maxDepthOfCut: 6,
    maxStepover: 50,
    coolant: "flood",
    notes: "通用结构铝合金。切削性极佳，建议使用锋利抛光硬质合金刀具并配合冲淋冷却。",
  },
  {
    id: "aluminum-7075",
    name: "铝合金 7075-T6（ISO N02）",
    isoGroup: "N（有色金属）",
    color: "#cbd5e1",
    sideColor: "#94a3b8",
    roughness: 0.3,
    metalness: 0.9,
    density: 2.81,
    surfaceSpeed: 220,
    chipLoad: 0.045,
    maxDepthOfCut: 5,
    maxStepover: 45,
    coolant: "flood",
    notes: "航空航天用高强度锌铝合金。切屑成形更硬，铣削表面光洁度好。",
  },
  {
    id: "aluminum-2024",
    name: "铝合金 2024-T3（ISO N03）",
    isoGroup: "N（有色金属）",
    color: "#e2e8f0",
    sideColor: "#cbd5e1",
    roughness: 0.32,
    metalness: 0.88,
    density: 2.78,
    surfaceSpeed: 210,
    chipLoad: 0.04,
    maxDepthOfCut: 5,
    maxStepover: 45,
    coolant: "flood",
    notes: "铜铝合金（航空级）。疲劳强度高，表面光洁度良好。",
  },
  {
    id: "brass",
    name: "黄铜 C360（ISO N10）",
    isoGroup: "N（有色金属）",
    color: "#fbbf24",
    sideColor: "#d97706",
    roughness: 0.25,
    metalness: 0.92,
    density: 8.5,
    surfaceSpeed: 300,
    chipLoad: 0.06,
    maxDepthOfCut: 6,
    maxStepover: 50,
    coolant: "air",
    notes: "易切削黄铜。切屑短而粉状，可获镜面光洁度，建议气冷。",
  },
  {
    id: "copper",
    name: "纯铜 C110（ISO N11）",
    isoGroup: "N（有色金属）",
    color: "#f97316",
    sideColor: "#c2410c",
    roughness: 0.28,
    metalness: 0.94,
    density: 8.96,
    surfaceSpeed: 150,
    chipLoad: 0.04,
    maxDepthOfCut: 4,
    maxStepover: 35,
    coolant: "flood",
    notes: "电解韧铜。延展性极高，需使用极锋利刀具。",
  },

  // --- ISO P: STEELS ---
  {
    id: "steel-mild",
    name: "低碳钢 AISI 1018（ISO P01）",
    isoGroup: "P（钢）",
    color: "#94a3b8",
    sideColor: "#64748b",
    roughness: 0.45,
    metalness: 0.75,
    density: 7.87,
    surfaceSpeed: 90,
    chipLoad: 0.04,
    maxDepthOfCut: 3,
    maxStepover: 30,
    coolant: "flood",
    notes: "低碳结构钢。韧性与延展性好，需刚性装夹与适中进给。",
  },
  {
    id: "steel-alloy-4140",
    name: "合金钢 AISI 4140（ISO P02）",
    isoGroup: "P（钢）",
    color: "#64748b",
    sideColor: "#475569",
    roughness: 0.4,
    metalness: 0.8,
    density: 7.85,
    surfaceSpeed: 80,
    chipLoad: 0.035,
    maxDepthOfCut: 2.5,
    maxStepover: 30,
    coolant: "flood",
    notes: "铬钼高强度钢。疲劳强度优异。",
  },

  // --- ISO M: STAINLESS STEELS ---
  {
    id: "steel-stainless",
    name: "不锈钢 304（ISO M01）",
    isoGroup: "M（不锈钢）",
    color: "#cbd5e1",
    sideColor: "#64748b",
    roughness: 0.35,
    metalness: 0.85,
    density: 8.0,
    surfaceSpeed: 70,
    chipLoad: 0.03,
    maxDepthOfCut: 2,
    maxStepover: 25,
    coolant: "flood",
    notes: "奥氏体 18/8 不锈钢。易加工硬化，必须使用正前角刀具。",
  },
  {
    id: "steel-stainless-316l",
    name: "不锈钢 316L（ISO M02）",
    isoGroup: "M（不锈钢）",
    color: "#94a3b8",
    sideColor: "#475569",
    roughness: 0.32,
    metalness: 0.88,
    density: 8.0,
    surfaceSpeed: 65,
    chipLoad: 0.028,
    maxDepthOfCut: 2,
    maxStepover: 25,
    coolant: "flood",
    notes: "船用与医用级含钼不锈钢。切屑黏性大。",
  },

  // --- ISO S: SUPERALLOYS & TITANIUM ---
  {
    id: "titanium-grade5",
    name: "钛合金 Ti-6Al-4V（ISO S01）",
    isoGroup: "S（高温合金）",
    color: "#64748b",
    sideColor: "#334155",
    roughness: 0.3,
    metalness: 0.85,
    density: 4.43,
    surfaceSpeed: 50,
    chipLoad: 0.03,
    maxDepthOfCut: 2,
    maxStepover: 20,
    coolant: "flood",
    notes: "5 级航空航天钛合金。导热性差，刀尖热量集中。",
  },

  // --- ISO K: CAST IRON ---
  {
    id: "cast-iron-gray",
    name: "灰铸铁 Class 40（ISO K01）",
    isoGroup: "K（铸铁）",
    color: "#475569",
    sideColor: "#1e293b",
    roughness: 0.6,
    metalness: 0.65,
    density: 7.2,
    surfaceSpeed: 110,
    chipLoad: 0.05,
    maxDepthOfCut: 3.5,
    maxStepover: 40,
    coolant: "air",
    notes: "石墨阻尼好。切屑粉状易碎，可用气冷或干切削。",
  },

  // --- ISO O: SYNTHETICS & COMPOSITES ---
  {
    id: "delrin",
    name: "Delrin POM-H 缩醛（ISO O01）",
    isoGroup: "O（合成材料）",
    color: "#f8fafc",
    sideColor: "#e2e8f0",
    roughness: 0.2,
    metalness: 0.05,
    density: 1.42,
    surfaceSpeed: 200,
    chipLoad: 0.08,
    maxDepthOfCut: 8,
    maxStepover: 60,
    coolant: "air",
    notes: "均聚缩醛工程塑料。可用高进给，需锋利刃口。",
  },
  {
    id: "peek",
    name: "PEEK 工业级（ISO O02）",
    isoGroup: "O（合成材料）",
    color: "#e2e8f0",
    sideColor: "#cbd5e1",
    roughness: 0.25,
    metalness: 0.1,
    density: 1.32,
    surfaceSpeed: 180,
    chipLoad: 0.06,
    maxDepthOfCut: 6,
    maxStepover: 50,
    coolant: "flood",
    notes: "高性能热塑性塑料。耐高温，建议使用应力消除坯料。",
  },
  {
    id: "acrylic",
    name: "亚克力 PMMA 光学级（ISO O03）",
    isoGroup: "O（合成材料）",
    color: "#f1f5f9",
    sideColor: "#cbd5e1",
    roughness: 0.1,
    metalness: 0.0,
    density: 1.19,
    surfaceSpeed: 250,
    chipLoad: 0.07,
    maxDepthOfCut: 5,
    maxStepover: 50,
    coolant: "air",
    notes: "透明光学亚克力。单刃 O 型槽刀具可防止切屑重熔。",
  },
  {
    id: "carbon-fiber",
    name: "碳纤维复合材料（ISO O10）",
    isoGroup: "O（合成材料）",
    color: "#1e293b",
    sideColor: "#0f172a",
    roughness: 0.4,
    metalness: 0.2,
    density: 1.55,
    surfaceSpeed: 300,
    chipLoad: 0.04,
    maxDepthOfCut: 3,
    maxStepover: 35,
    coolant: "air",
    notes: "磨蚀性碳纤维基体。需 PCD 金刚石或毛刺式压缩刀具。",
  },
  {
    id: "fr4-g10",
    name: "FR4 / G10 环氧玻璃布（ISO O11）",
    isoGroup: "O（合成材料）",
    color: "#a3e635",
    sideColor: "#65a30d",
    roughness: 0.45,
    metalness: 0.1,
    density: 1.85,
    surfaceSpeed: 280,
    chipLoad: 0.04,
    maxDepthOfCut: 4,
    maxStepover: 40,
    coolant: "air",
    notes: "编织玻璃环氧复合材料。需强力吸尘，使用硬质合金锣刀。",
  },
];

export function getMaterialById(id: string): CncMaterial {
  return MATERIAL_LIBRARY.find((m) => m.id === id) ?? MATERIAL_LIBRARY[0];
}
