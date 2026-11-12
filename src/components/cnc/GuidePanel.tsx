"use client";

import {
  Rocket,
  Keyboard,
  Compass,
  Code2,
  Lightbulb,
  BookOpen,
  PlayCircle,
  MousePointerClick,
  Cpu,
} from "lucide-react";

function Section({
  icon: Icon,
  title,
  color,
  children,
}: {
  icon: React.ElementType;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-white/8 bg-white/[0.02] p-3">
      <div className="mb-2 flex items-center gap-2">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-md"
          style={{ background: `${color}22`, color }}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <h3 className="text-xs font-semibold text-slate-100">{title}</h3>
      </div>
      <div className="space-y-1.5 text-[11px] leading-relaxed text-slate-400">
        {children}
      </div>
    </section>
  );
}

const KBDS: { keys: string; desc: string }[] = [
  { keys: "Space", desc: "播放 / 暂停仿真" },
  { keys: "→", desc: "前进一个程序段" },
  { keys: "←", desc: "后退一个程序段" },
  { keys: "R", desc: "复位到起点" },
  { keys: "拖动", desc: "环视 3D 相机" },
  { keys: "滚轮", desc: "放大 / 缩小" },
];

export default function GuidePanel() {
  return (
    <div className="h-full overflow-y-auto bg-[#0b0d10] p-3 [scrollbar-width:thin]">
      <div className="mx-auto max-w-2xl space-y-3">
        {/* Hero */}
        <div className="rounded-lg border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-transparent p-4">
          <div className="mb-1 flex items-center gap-2">
            <Rocket className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-100">
              欢迎使用 CNC 模拟器 Pro
            </h2>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            专业的浏览器端三轴 CNC 铣削模拟器。编写或加载 G-code，实时观看高保真三轴机床切削零件，并在过程中学习每一个{" "}
            <strong>G</strong>、<strong>M</strong>、<strong>T</strong>、<strong>F</strong>、{" "}
            <strong>S</strong> 与 <strong>Z</strong> 代码。
          </p>
        </div>

        {/* How to use */}
        <Section icon={PlayCircle} title="如何使用模拟器" color="#22d3ee">
          <Step n={1}>
            在「程序」标签顶部的下拉菜单中选择示例程序 — 或直接在编辑器中输入自己的 G-code。
          </Step>
          <Step n={2}>
            按 <Kbd>Space</Kbd> 或点击大号<strong>播放</strong>按钮运行仿真。主轴旋转，刀具沿路径运动，工件实时被切削。
          </Step>
          <Step n={3}>
            在 3D 视图中拖动环视，滚轮缩放。用右上角按钮切换刀具路径、网格与护罩显示。
          </Step>
          <Step n={4}>
            使用时间轴滑块跳转到任意位置，或用 <Kbd>←</Kbd> <Kbd>→</Kbd> 逐段单步，便于细致学习。
          </Step>
          <Step n={5}>
            调整<strong>循环速度</strong>（0.25×–10×）以及进给 / 快速 / 主轴倍率，观察它们对加工时间的影响。
          </Step>
        </Section>

        {/* Code primer */}
        <Section icon={Code2} title="G-code 快速入门" color="#a78bfa">
          <p>
            CNC 程序是一系列<em>程序段</em>（行）。每个程序段告诉机床做一件事。字由字母 + 数字组成，例如{" "}
            <code className="rounded bg-black/50 px-1 text-cyan-300">G01 X20 F150</code>。
          </p>
          <ul className="ml-3 list-disc space-y-1">
            <li>
              <code className="text-cyan-300">G 代码</code> — 运动与模式
              （G00 快速、G01 切削、G02/03 圆弧、G90 绝对…）
            </li>
            <li>
              <code className="text-amber-300">M 代码</code> — 机床功能
              （M03 主轴开、M08 冷却液、M06 换刀、M30 结束）
            </li>
            <li>
              <code className="text-violet-300">T</code> — 刀具号 ·{" "}
              <code className="text-yellow-300">F</code> — 进给速度 ·{" "}
              <code className="text-rose-300">S</code> — 主轴转速 rpm
            </li>
            <li>
              <code className="text-emerald-300">X Y Z</code> — 目标坐标
              （Z+ = 向上 / 安全高度，Z− = 切削深度）
            </li>
            <li>
              <code className="text-blue-300">I J K</code> — 相对<em>起点</em>的圆弧圆心偏置
            </li>
          </ul>
          <pre className="mt-2 overflow-x-auto rounded bg-black/50 p-2 font-mono text-[10px] leading-relaxed text-slate-300">
{`G21 G90 G17          ; mm, absolute, XY plane
T1 M06                ; load tool 1
M03 S2500             ; spindle on, 2500 rpm
G00 Z5                ; rapid to safe height
G00 X-20 Y-20         ; rapid to start
G01 Z-2 F50           ; plunge 2mm
G01 X20 Y-20 F150     ; cut a line
G01 X20 Y20
G01 X-20 Y20
G01 X-20 Y-20
G00 Z5                ; retract
M05 M30               ; spindle off, program end`}
          </pre>
        </Section>

        {/* Coordinate system */}
        <Section icon={Compass} title="坐标系" color="#34d399">
          <p>
            零件<strong>零点</strong>（原点）位于工件顶面中心。X 左右、Y 前后、Z 上下。
          </p>
          <ul className="ml-3 list-disc space-y-1">
            <li>
              <span className="text-emerald-400">Z = 0</span> = 毛坯顶面。{" "}
              <span className="text-emerald-400">Z = −5</span> = 切入 5 mm。
            </li>
            <li>
              <span className="text-emerald-400">Z = +5</span> = 安全抬刀
              （在零件上方移动）。
            </li>
            <li>
              特征之间做 XY 移动前，务必先{" "}
              <code className="text-amber-300">G00 Z5</code>（抬刀）— 这是 CNC 的第一条规则。
            </li>
          </ul>
        </Section>

        {/* Programming tips */}
        <Section icon={Lightbulb} title="编程技巧" color="#f59e0b">
          <ul className="ml-3 list-disc space-y-1">
            <li>
              <strong>斜坡切入。</strong>不要让立铣刀一次直插到底 — 用螺旋或斜坡切入。
            </li>
            <li>
              <strong>分层下刀。</strong>深型腔应分多次 Z 深度（Z-1、Z-2、Z-3…），不要一次吃太深。
            </li>
            <li>
              <strong>善用注释。</strong>每段加上{" "}
              <code className="text-slate-400">;</code> 或{" "}
              <code className="text-slate-400">( )</code> 注释，方便你和模拟器理解意图。
            </li>
            <li>
              <strong>注意圆弧圆心。</strong>I、J 从圆弧<em>起点</em>测量，不是从原点。写错时模拟器会警告。
            </li>
            <li>
              <strong>干净结束。</strong>先{" "}
              <code className="text-amber-300">M05</code>（主轴停）再{" "}
              <code className="text-amber-300">M30</code>（程序结束并复位）。
            </li>
          </ul>
        </Section>

        {/* Keyboard */}
        <Section icon={Keyboard} title="键盘快捷键" color="#fb7185">
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {KBDS.map((k) => (
              <div
                key={k.keys}
                className="flex items-center gap-2 rounded-md border border-white/8 bg-black/30 px-2 py-1"
              >
                <Kbd>{k.keys}</Kbd>
                <span className="text-slate-400">{k.desc}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Click to seek */}
        <Section icon={MousePointerClick} title="进阶技巧：点击跳转" color="#38bdf8">
          <p>
            点击 G-code 编辑器中的任意一行，即可将 3D 仿真直接跳到该程序段 — 非常适合研究单步如何切削零件。
          </p>
        </Section>

        <div className="flex items-center gap-2 px-1 py-2 text-[10px] text-slate-600">
          <Cpu className="h-3 w-3" />
          <span>
            基于 Next.js、react-three-fiber 与自定义 G-code 解释器构建。
          </span>
        </div>
      </div>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 font-mono text-[9px] font-bold text-cyan-300">
        {n}
      </span>
      <span>{children}</span>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[20px] items-center justify-center rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-slate-200">
      {children}
    </kbd>
  );
}

// silence unused import warning for BookOpen (kept for future use)
void BookOpen;
