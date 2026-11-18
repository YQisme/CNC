// CNC Simulator  — Machine Architectures & Specifications

export type MachineType =
  | "vmc_3axis"
  | "lathe_cnc"
  | "hmc_4axis"
  | "gantry_router"
  | "sf260_5axis";

export interface CncMachineSpec {
  id: MachineType;
  name: string;
  shortName: string;
  category: "铣削" | "车削" | "雕刻/路由" | "铣磨复合";
  description: string;
  spindleMaxRpm: number;
  rapidFeed: number; // mm/min
  maxTravel: { x: number; y: number; z: number }; // mm
  toolChangerCapacity: number;
  supportedGCode: string[];
  iconName: string;
}

export const MACHINE_CATALOG: CncMachineSpec[] = [
  {
    id: "sf260_5axis",
    name: "佳时特 SF-260H 五轴坐标铣磨复合加工中心",
    shortName: "SF-260H 五轴",
    category: "铣磨复合",
    description:
      "小型立式五轴坐标铣磨复合机：力封闭床身、XYZ 直线电机直驱、摇篮式 A/C 双转台，配套华中 HNC-848D。",
    spindleMaxRpm: 30000,
    rapidFeed: 60000,
    maxTravel: { x: 260, y: 260, z: 260 },
    toolChangerCapacity: 16,
    supportedGCode: [
      "G00",
      "G01",
      "G02",
      "G03",
      "G43.4",
      "G43.5",
      "G53.1",
      "G68.2",
      "G90",
      "G91",
    ],
    iconName: "Cpu",
  },
  {
    id: "vmc_3axis",
    name: "立式加工中心（三轴 VMC）",
    shortName: "三轴 VMC",
    category: "铣削",
    description: "标准 Fanuc 风格三轴立式数控铣床，刚性箱式立柱，配备自动换刀库。",
    spindleMaxRpm: 12000,
    rapidFeed: 24000,
    maxTravel: { x: 600, y: 400, z: 400 },
    toolChangerCapacity: 24,
    supportedGCode: ["G00", "G01", "G02", "G03", "G81", "G82", "G83", "G73", "G90", "G91"],
    iconName: "Cpu",
  },
  {
    id: "lathe_cnc",
    name: "数控车削中心（车床 NC）",
    shortName: "数控车床",
    category: "车削",
    description: "斜床身数控车床，8 工位刀塔、三爪液压卡盘与尾座，用于回转车削加工。",
    spindleMaxRpm: 4500,
    rapidFeed: 18000,
    maxTravel: { x: 200, y: 0, z: 500 },
    toolChangerCapacity: 8,
    supportedGCode: ["G00", "G01", "G02", "G03", "G33", "G70", "G71", "G76", "G96", "G97"],
    iconName: "RotateCw",
  },
  {
    id: "hmc_4axis",
    name: "卧式加工中心（HMC）",
    shortName: "四轴 HMC",
    category: "铣削",
    description: "高产能卧式主轴数控铣床，配备 B 轴回转分度台与墓碑式夹具。",
    spindleMaxRpm: 15000,
    rapidFeed: 30000,
    maxTravel: { x: 500, y: 500, z: 500 },
    toolChangerCapacity: 40,
    supportedGCode: ["G00", "G01", "G02", "G03", "G81", "G83", "G90", "G91", "G00 B..."],
    iconName: "Layers",
  },
  {
    id: "gantry_router",
    name: "高速数控龙门雕刻机",
    shortName: "数控雕刻机",
    category: "雕刻/路由",
    description: "开放式高速数控雕刻机，适用于铝材、塑料、复合材料与木材，配备真空吸盘台面。",
    spindleMaxRpm: 24000,
    rapidFeed: 36000,
    maxTravel: { x: 1200, y: 800, z: 200 },
    toolChangerCapacity: 10,
    supportedGCode: ["G00", "G01", "G02", "G03", "G90", "G91"],
    iconName: "Box",
  },
];
export function getMachineById(id: MachineType): CncMachineSpec {
  return MACHINE_CATALOG.find((m) => m.id === id) ?? MACHINE_CATALOG[0];
}
