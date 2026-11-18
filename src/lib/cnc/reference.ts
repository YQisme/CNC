// CNC Simulator  — CNC code reference data
// Used by the in-app reference panel (educational).

export interface CodeEntry {
  code: string; // e.g. "G00"
  name: string;
  group: string; // modal group name
  description: string;
  example?: string;
  tip?: string;
}

export interface CodeGroup {
  category: "G" | "M" | "T" | "F" | "S" | "Z" | "Other";
  title: string;
  blurb: string;
  entries: CodeEntry[];
}

export const CODE_REFERENCE: CodeGroup[] = [
  {
    category: "G",
    title: "G 代码 — 准备 / 运动",
    blurb:
      "G 代码告诉控制器使用何种运动或模式。它们是模态的 — 一旦设定，将保持有效直到被更改。",
    entries: [
      {
        code: "G00",
        name: "快速定位",
        group: "运动",
        description:
          "以最大移动速度将刀具移至目标点。用于非切削移动（接近、回退、特征之间）。",
        example: "G00 X10 Y20 Z5",
        tip: "切勿用 G00 切削 — 刀具会以全速撞入材料。",
      },
      {
        code: "G01",
        name: "直线插补（进给）",
        group: "运动",
        description:
          "以编程进给速度直线移动到目标点。最常用的切削移动。",
        example: "G01 X50 Y20 F150",
        tip: "F 是模态的 — 设定一次后保持有效直到更改。",
      },
      {
        code: "G02",
        name: "圆弧插补 — 顺时针",
        group: "运动",
        description:
          "顺时针切削圆弧至目标点。圆心由 I/J（相对起点的偏移）或 R（半径）定义。",
        example: "G02 X25 Y25 I10 J0",
        tip: "I 和 J 是从圆弧起点到圆心的距离 — 不是圆心的绝对坐标。",
      },
      {
        code: "G03",
        name: "圆弧插补 — 逆时针",
        group: "运动",
        description:
          "逆时针切削圆弧至目标点。I/J/R 规则与 G02 相同，方向相反。",
        example: "G03 X25 Y25 I10 J0",
      },
      {
        code: "G04",
        name: "暂停",
        group: "杂项",
        description:
          "按秒数（P）或毫秒暂停程序。用于断屑或让冷却液到达刀具。",
        example: "G04 P2",
        tip: "多数铣床上 P 以秒计（部分系统为毫秒 — 请核对你的系统）。",
      },
      {
        code: "G17",
        name: "XY 平面选择",
        group: "平面",
        description: "选择 XY 平面用于圆弧运动（立铣机默认）。",
      },
      {
        code: "G18",
        name: "ZX 平面选择",
        group: "平面",
        description: "选择 ZX 平面用于圆弧运动（车床端面常用）。",
      },
      {
        code: "G19",
        name: "YZ 平面选择",
        group: "平面",
        description: "选择 YZ 平面用于圆弧运动。",
      },
      {
        code: "G20",
        name: "英制单位",
        group: "单位",
        description: "所有坐标与进给按英寸解释。",
        example: "G20 G01 X1.5 F6.0",
        tip: "切勿在程序中途混用 G20/G21 — 其后所有数值都会被重新解释。",
      },
      {
        code: "G21",
        name: "毫米单位",
        group: "单位",
        description: "所有坐标与进给按毫米（公制）解释。",
        example: "G21 G01 X40 F150",
      },
      {
        code: "G28",
        name: "返回机床原点",
        group: "定位",
        description: "经中间点将刀具送至机床原点/参考点。",
        example: "G28 G91 Z0",
        tip: "务必先用 G28 回退 Z，以免撞到工件。",
      },
      {
        code: "G40",
        name: "取消刀具半径补偿",
        group: "刀补",
        description: "关闭刀具半径补偿 — 刀心沿编程路径运动。",
      },
      {
        code: "G41",
        name: "刀补 — 左",
        group: "刀补",
        description:
          "按刀具半径将路径向左偏移。常用于精加工走刀。",
      },
      {
        code: "G42",
        name: "刀补 — 右",
        group: "刀补",
        description: "按刀具半径将路径向右偏移。",
      },
      {
        code: "G43",
        name: "刀具长度补偿",
        group: "刀具",
        description: "对当前刀具应用已存储的长度偏置（配合 H 字）。",
        example: "G43 H1",
      },
      {
        code: "G53",
        name: "机床坐标系",
        group: "坐标系",
        description: "使用机床绝对坐标系移动（非模态）。",
      },
      {
        code: "G54",
        name: "工件坐标系 1",
        group: "坐标系",
        description:
          "选择工件坐标系 #1。最常用偏置 — 零件零点通常设于此。",
      },
      {
        code: "G55",
        name: "工件坐标系 2",
        group: "坐标系",
        description: "选择工件坐标系 #2（第二虎钳 / 第二零件）。",
      },
      {
        code: "G80",
        name: "取消固定循环",
        group: "固定循环",
        description: "取消任何活动的固定循环（钻孔、攻丝、镗孔）。",
      },
      {
        code: "G81",
        name: "钻孔循环",
        group: "固定循环",
        description:
          "标准钻孔循环：快速到 R 平面，进给至深度，快速退出。在后续每个 XY 重复，直到 G80。",
        example: "G81 R2 Z-10 F100",
        tip: "调用 G81 后，每个 X/Y 移动都会再钻一个孔 — 直到调用 G80。",
      },
      {
        code: "G82",
        name: "带暂停的钻孔循环",
        group: "固定循环",
        description: "类似 G81，但在孔底暂停（P）— 适合定心钻 / 锪窝。",
        example: "G82 R2 Z-5 P0.5 F100",
      },
      {
        code: "G83",
        name: "啄钻循环",
        group: "固定循环",
        description:
          "深孔啄钻：每次钻 Q 深度后回退排屑，再重复。可防止切屑堵塞。",
        example: "G83 R2 Z-30 Q5 F100",
      },
      {
        code: "G90",
        name: "绝对坐标",
        group: "距离",
        description: "所有坐标相对于程序零点（零件原点）计量。",
        example: "G90 G01 X20 Y10",
      },
      {
        code: "G91",
        name: "增量坐标",
        group: "距离",
        description: "所有坐标相对于刀具当前位置计量。",
        example: "G91 G01 X5 ; 从当前位置在 X 向移动 +5mm",
      },
      {
        code: "G94",
        name: "每分钟进给",
        group: "进给模式",
        description: "进给单位为距离/分钟（mm/min 或 in/min）。铣床默认。",
      },
      {
        code: "G98",
        name: "回退到初始平面",
        group: "固定循环",
        description: "固定循环后回退到初始 Z 高度（对夹具更安全）。",
      },
      {
        code: "G99",
        name: "回退到 R 平面",
        group: "固定循环",
        description: "固定循环后仅回退到 R 平面（多孔加工更快）。",
      },
    ],
  },
  {
    category: "M",
    title: "M 代码 — 杂项 / 机床功能",
    blurb:
      "M 代码控制机床功能：主轴、冷却液、程序流程、换刀。它们不像 G 代码那样模态保持。",
    entries: [
      {
        code: "M00",
        name: "程序停止",
        group: "程序流程",
        description: "停止程序与主轴。操作者按循环启动继续。用于检测。",
      },
      {
        code: "M01",
        name: "选择停",
        group: "程序流程",
        description: "仅在选择停开关打开时停止。便于设置检测点。",
      },
      {
        code: "M02",
        name: "程序结束",
        group: "程序流程",
        description: "结束程序（多数系统不会回绕到开头）。",
      },
      {
        code: "M03",
        name: "主轴正转（顺时针）",
        group: "主轴",
        description: "启动主轴顺时针旋转（右手刀具标准）。用 S 设定转速。",
        example: "M03 S1200",
      },
      {
        code: "M04",
        name: "主轴反转（逆时针）",
        group: "主轴",
        description: "启动主轴逆时针旋转（左手刀具 / 攻丝退出）。",
        example: "M04 S800",
      },
      {
        code: "M05",
        name: "主轴停止",
        group: "主轴",
        description: "停止主轴。通常在换刀前和程序结束时调用。",
      },
      {
        code: "M06",
        name: "换刀",
        group: "刀具",
        description: "执行自动换刀，切换到 T 字指定的刀具号。",
        example: "T3 M06 ; 装入 3 号刀",
        tip: "M06 前务必回退到安全 Z 并停止主轴（M05）。",
      },
      {
        code: "M07",
        name: "冷却液 — 雾冷",
        group: "冷却液",
        description: "开启雾状冷却液。",
      },
      {
        code: "M08",
        name: "冷却液 — 冲淋",
        group: "冷却液",
        description: "开启冲淋冷却液（铣削钢/铝的标准方式）。",
        tip: "刀具切入前开启冷却液，快速移动时关闭。",
      },
      {
        code: "M09",
        name: "冷却液关闭",
        group: "冷却液",
        description: "关闭所有冷却液。",
      },
      {
        code: "M19",
        name: "主轴定向",
        group: "主轴",
        description: "将主轴定向到固定角度（用于刚性攻丝 / 换刀）。",
      },
      {
        code: "M30",
        name: "程序结束并复位",
        group: "程序流程",
        description: "结束程序并将指针复位到开头（标准程序结束代码）。",
        example: "M30",
      },
      {
        code: "M98",
        name: "调用子程序",
        group: "子程序",
        description: "调用子程序（P = 程序号，L = 重复次数）。",
        example: "M98 P1001 L3",
      },
      {
        code: "M99",
        name: "子程序返回",
        group: "子程序",
        description: "从子程序返回到调用程序。",
      },
    ],
  },
  {
    category: "T",
    title: "T 代码 — 刀具选择",
    blurb:
      "T 字选择使用哪把刀。多数铣床上 T1 M06 从刀库装入 1 号刀并应用其偏置。",
    entries: [
      {
        code: "T",
        name: "刀具号",
        group: "刀具",
        description:
          "选择刀具号（1–N）。与 M06 组合执行换刀。每把刀具有各自的长度与直径偏置。",
        example: "T1 M06",
        tip: "常用刀具：T1 = 面铣刀，T2 = 立铣刀，T3 = 钻头，T4 = 倒角刀。",
      },
      {
        code: "T01",
        name: "刀具 1 — 面铣刀",
        group: "刀具",
        description: "通常为大直径刀具，用于将零件顶面铣平。",
      },
      {
        code: "T02",
        name: "刀具 2 — 立铣刀",
        group: "刀具",
        description: "通用刀具，用于型腔、槽、轮廓。最常用刀具。",
      },
      {
        code: "T03",
        name: "刀具 3 — 钻头",
        group: "刀具",
        description: "麻花钻，用于钻孔。配合 G81/G83 固定循环使用。",
      },
      {
        code: "T04",
        name: "刀具 4 — 倒角 / 定心钻",
        group: "刀具",
        description: "定心定位孔位，并用倒角去棱。",
      },
      {
        code: "H",
        name: "刀具长度偏置寄存器",
        group: "刀具",
        description:
          "H 字（与 G43 配合）告诉系统使用哪个长度偏置寄存器 — 通常与刀具号相同。",
        example: "G43 H1 ; 使用长度偏置 #1",
      },
      {
        code: "D",
        name: "刀具半径偏置寄存器",
        group: "刀具",
        description: "D 字选择 G41/G42 刀补使用的半径偏置寄存器。",
      },
    ],
  },
  {
    category: "F",
    title: "F 代码 — 进给速度",
    blurb:
      "F 字设定刀具切入材料的进给速度。太快易断刀；太慢会摩擦并导致加工硬化。F 是模态的。",
    entries: [
      {
        code: "F",
        name: "进给速度",
        group: "进给",
        description:
          "设定切削进给。在 G94（默认）下单位为 mm/min 或 in/min。保持有效直到更改。",
        example: "G01 X50 F150",
        tip: "进给 = 每齿进给 × 主轴转速 × 刃数。建议从保守值开始。",
      },
      {
        code: "F (Rapid)",
        name: "快速移动无 F",
        group: "进给",
        description:
          "G00 忽略 F，始终以机床最大移动速度运行。无法用 F 减慢快速移动 — 请改用 G01。",
      },
      {
        code: "F — Surface Speed",
        name: "如何选择进给",
        group: "进给",
        description:
          "铝合金配 6mm 硬质合金立铣刀：约 0.05mm/齿 × 8000 rpm × 2 刃 ≈ 800 mm/min。",
        tip: "不确定时先将进给减半，并注意听振刀声。",
      },
    ],
  },
  {
    category: "S",
    title: "S 代码 — 主轴转速",
    blurb:
      "S 字设定主轴 RPM。单独无效 — 需配合 M03/M04 才能真正启动主轴。",
    entries: [
      {
        code: "S",
        name: "主轴转速（RPM）",
        group: "主轴",
        description:
          "以转/分钟设定主轴转速。调用 M03 或 M04 后生效。",
        example: "M03 S2500",
        tip: "RPM = (切削速度 × 1000) / (π × 刀具直径 mm)。",
      },
      {
        code: "S — Constant Surface Speed",
        name: "G96（车床）",
        group: "主轴",
        description: "车床上 G96 通过改变转速保持恒定线速度 — 铣床不用。",
      },
    ],
  },
  {
    category: "Z",
    title: "Z 轴 — 深度与安全移动",
    blurb:
      "Z 字控制垂直深度。零件顶面为 Z=0；切削为负 Z。特征之间正 Z 安全回退可防止撞刀。",
    entries: [
      {
        code: "Z (safe retract)",
        name: "正 Z = 安全",
        group: "Z",
        description:
          "任何 XY 快速移动前，先将刀具抬到正 Z（如 Z5 或 Z10）。这是避免撞刀的首要规则。",
        example: "G00 Z5",
      },
      {
        code: "Z (cut depth)",
        name: "负 Z = 切削",
        group: "Z",
        description:
          "负 Z 使刀具切入工件。每刀切深取决于刀具直径与材料。",
        example: "G01 Z-2 F50",
        tip: "切勿让立铣刀一次直插到底 — 请斜坡或螺旋下刀。",
      },
      {
        code: "Z (pecking)",
        name: "啄钻深度（Q）",
        group: "Z",
        description:
          "深孔请用 G83 啄钻 — 每 Q mm 回退一次以排屑降温。",
        example: "G83 R2 Z-20 Q3 F80",
      },
      {
        code: "Z (step-down)",
        name: "多层 Z 走刀",
        group: "Z",
        description:
          "深型腔应分多层：Z-1、Z-2、Z-3… 每一层完成完整 XY 轮廓。",
      },
    ],
  },
  {
    category: "Other",
    title: "其他地址字与语法",
    blurb: "出现在 G/M 代码旁、为其提供数值的地址字母。",
    entries: [
      {
        code: "X / Y / Z",
        name: "坐标字",
        group: "坐标系",
        description: "设定各轴目标位置。省略某轴则保持当前值。",
      },
      {
        code: "I / J / K",
        name: "圆弧圆心偏移",
        group: "圆弧",
        description:
          "从圆弧起点到圆心沿 X / Y / Z 的距离。始终相对起点增量。",
        example: "G02 X20 Y20 I5 J0",
      },
      {
        code: "R",
        name: "圆弧半径",
        group: "圆弧",
        description: "I/J/K 的替代：直接给出圆弧半径。符号选择两条可能圆弧之一。",
      },
      {
        code: "P",
        name: "暂停时间 / 程序号",
        group: "杂项",
        description: "配合 G04 = 暂停秒数；配合 M98 = 子程序号；配合 G82 = 孔底暂停。",
      },
      {
        code: "Q",
        name: "啄钻深度 / 偏移",
        group: "杂项",
        description: "配合 G83 = 啄钻增量；配合 G76/G87 = 镗刀偏移。",
      },
      {
        code: "N",
        name: "程序段 / 行号",
        group: "语法",
        description: "行首可选的顺序号。现代系统很少需要。",
        example: "N10 G01 X10",
      },
      {
        code: "; or ( )",
        name: "注释",
        group: "语法",
        description: "`;` 之后或 `( )` 内的文字被机床忽略 — 用于备注。",
        example: "G01 X10 ; 精加工走刀",
      },
      {
        code: "/",
        name: "程序段跳过",
        group: "语法",
        description: "行首 `/` 允许操作者通过开关跳过该程序段。",
      },
    ],
  },
];

export const ALL_CODES: CodeEntry[] = CODE_REFERENCE.flatMap((g) => g.entries);
