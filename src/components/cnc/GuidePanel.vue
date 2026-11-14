<script setup lang="ts">
import {
  Rocket,
  Keyboard,
  Compass,
  Code2,
  Lightbulb,
  PlayCircle,
  MousePointerClick,
  Cpu,
} from "lucide-vue-next";

const KBDS: { keys: string; desc: string }[] = [
  { keys: "Space", desc: "播放 / 暂停仿真" },
  { keys: "→", desc: "前进一个程序段" },
  { keys: "←", desc: "后退一个程序段" },
  { keys: "R", desc: "复位到起点" },
  { keys: "拖动", desc: "环视 3D 相机" },
  { keys: "滚轮", desc: "放大 / 缩小" },
];
</script>

<template>
  <div class="h-full overflow-y-auto bg-[#0b0d10] p-3 [scrollbar-width:thin]">
    <div class="mx-auto max-w-2xl space-y-3">
      <div class="rounded-lg border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-transparent p-4">
        <div class="mb-1 flex items-center gap-2">
          <Rocket class="h-4 w-4 text-cyan-400" />
          <h2 class="text-sm font-bold text-slate-100">欢迎使用 CNC 模拟器 Pro</h2>
        </div>
        <p class="text-[11px] leading-relaxed text-slate-400">
          专业的浏览器端三轴 CNC 铣削模拟器。编写或加载 G-code，实时观看高保真三轴机床切削零件，并在过程中学习每一个
          <strong>G</strong>、<strong>M</strong>、<strong>T</strong>、<strong>F</strong>、
          <strong>S</strong> 与 <strong>Z</strong> 代码。
        </p>
      </div>

      <section class="rounded-lg border border-white/8 bg-white/[0.02] p-3">
        <div class="mb-2 flex items-center gap-2">
          <span
            class="flex h-6 w-6 items-center justify-center rounded-md"
            style="background: #22d3ee22; color: #22d3ee"
          >
            <PlayCircle class="h-3.5 w-3.5" />
          </span>
          <h3 class="text-xs font-semibold text-slate-100">如何使用模拟器</h3>
        </div>
        <div class="space-y-1.5 text-[11px] leading-relaxed text-slate-400">
          <div class="flex gap-2">
            <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 font-mono text-[9px] font-bold text-cyan-300">1</span>
            <span>在「程序」标签顶部的下拉菜单中选择示例程序 — 或直接在编辑器中输入自己的 G-code。</span>
          </div>
          <div class="flex gap-2">
            <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 font-mono text-[9px] font-bold text-cyan-300">2</span>
            <span>
              按
              <kbd class="inline-flex min-w-[20px] items-center justify-center rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-slate-200">Space</kbd>
              或点击大号<strong>播放</strong>按钮运行仿真。主轴旋转，刀具沿路径运动，工件实时被切削。
            </span>
          </div>
          <div class="flex gap-2">
            <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 font-mono text-[9px] font-bold text-cyan-300">3</span>
            <span>在 3D 视图中拖动环视，滚轮缩放。用右上角按钮切换刀具路径、网格与护罩显示。</span>
          </div>
          <div class="flex gap-2">
            <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 font-mono text-[9px] font-bold text-cyan-300">4</span>
            <span>
              使用时间轴滑块跳转到任意位置，或用
              <kbd class="inline-flex min-w-[20px] items-center justify-center rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-slate-200">←</kbd>
              <kbd class="inline-flex min-w-[20px] items-center justify-center rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-slate-200">→</kbd>
              逐段单步，便于细致学习。
            </span>
          </div>
          <div class="flex gap-2">
            <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 font-mono text-[9px] font-bold text-cyan-300">5</span>
            <span>调整<strong>循环速度</strong>（0.25×–10×）以及进给 / 快速 / 主轴倍率，观察它们对加工时间的影响。</span>
          </div>
        </div>
      </section>

      <section class="rounded-lg border border-white/8 bg-white/[0.02] p-3">
        <div class="mb-2 flex items-center gap-2">
          <span
            class="flex h-6 w-6 items-center justify-center rounded-md"
            style="background: #a78bfa22; color: #a78bfa"
          >
            <Code2 class="h-3.5 w-3.5" />
          </span>
          <h3 class="text-xs font-semibold text-slate-100">G-code 快速入门</h3>
        </div>
        <div class="space-y-1.5 text-[11px] leading-relaxed text-slate-400">
          <p>
            CNC 程序是一系列<em>程序段</em>（行）。每个程序段告诉机床做一件事。字由字母 + 数字组成，例如
            <code class="rounded bg-black/50 px-1 text-cyan-300">G01 X20 F150</code>。
          </p>
          <ul class="ml-3 list-disc space-y-1">
            <li>
              <code class="text-cyan-300">G 代码</code> — 运动与模式
              （G00 快速、G01 切削、G02/03 圆弧、G90 绝对…）
            </li>
            <li>
              <code class="text-amber-300">M 代码</code> — 机床功能
              （M03 主轴开、M08 冷却液、M06 换刀、M30 结束）
            </li>
            <li>
              <code class="text-violet-300">T</code> — 刀具号 ·
              <code class="text-yellow-300">F</code> — 进给速度 ·
              <code class="text-rose-300">S</code> — 主轴转速 rpm
            </li>
            <li>
              <code class="text-emerald-300">X Y Z</code> — 目标坐标
              （Z+ = 向上 / 安全高度，Z− = 切削深度）
            </li>
            <li>
              <code class="text-blue-300">I J K</code> — 相对<em>起点</em>的圆弧圆心偏置
            </li>
          </ul>
          <pre class="mt-2 overflow-x-auto rounded bg-black/50 p-2 font-mono text-[10px] leading-relaxed text-slate-300">G21 G90 G17          ; mm, absolute, XY plane
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
M05 M30               ; spindle off, program end</pre>
        </div>
      </section>

      <section class="rounded-lg border border-white/8 bg-white/[0.02] p-3">
        <div class="mb-2 flex items-center gap-2">
          <span
            class="flex h-6 w-6 items-center justify-center rounded-md"
            style="background: #34d39922; color: #34d399"
          >
            <Compass class="h-3.5 w-3.5" />
          </span>
          <h3 class="text-xs font-semibold text-slate-100">坐标系</h3>
        </div>
        <div class="space-y-1.5 text-[11px] leading-relaxed text-slate-400">
          <p>
            零件<strong>零点</strong>（原点）位于工件顶面中心。X 左右、Y 前后、Z 上下。
          </p>
          <ul class="ml-3 list-disc space-y-1">
            <li>
              <span class="text-emerald-400">Z = 0</span> = 毛坯顶面。
              <span class="text-emerald-400">Z = −5</span> = 切入 5 mm。
            </li>
            <li>
              <span class="text-emerald-400">Z = +5</span> = 安全抬刀
              （在零件上方移动）。
            </li>
            <li>
              特征之间做 XY 移动前，务必先
              <code class="text-amber-300">G00 Z5</code>（抬刀）— 这是 CNC 的第一条规则。
            </li>
          </ul>
        </div>
      </section>

      <section class="rounded-lg border border-white/8 bg-white/[0.02] p-3">
        <div class="mb-2 flex items-center gap-2">
          <span
            class="flex h-6 w-6 items-center justify-center rounded-md"
            style="background: #f59e0b22; color: #f59e0b"
          >
            <Lightbulb class="h-3.5 w-3.5" />
          </span>
          <h3 class="text-xs font-semibold text-slate-100">编程技巧</h3>
        </div>
        <div class="space-y-1.5 text-[11px] leading-relaxed text-slate-400">
          <ul class="ml-3 list-disc space-y-1">
            <li><strong>斜坡切入。</strong>不要让立铣刀一次直插到底 — 用螺旋或斜坡切入。</li>
            <li><strong>分层下刀。</strong>深型腔应分多次 Z 深度（Z-1、Z-2、Z-3…），不要一次吃太深。</li>
            <li>
              <strong>善用注释。</strong>每段加上
              <code class="text-slate-400">;</code> 或
              <code class="text-slate-400">( )</code> 注释，方便你和模拟器理解意图。
            </li>
            <li><strong>注意圆弧圆心。</strong>I、J 从圆弧<em>起点</em>测量，不是从原点。写错时模拟器会警告。</li>
            <li>
              <strong>干净结束。</strong>先
              <code class="text-amber-300">M05</code>（主轴停）再
              <code class="text-amber-300">M30</code>（程序结束并复位）。
            </li>
          </ul>
        </div>
      </section>

      <section class="rounded-lg border border-white/8 bg-white/[0.02] p-3">
        <div class="mb-2 flex items-center gap-2">
          <span
            class="flex h-6 w-6 items-center justify-center rounded-md"
            style="background: #fb718522; color: #fb7185"
          >
            <Keyboard class="h-3.5 w-3.5" />
          </span>
          <h3 class="text-xs font-semibold text-slate-100">键盘快捷键</h3>
        </div>
        <div class="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          <div
            v-for="k in KBDS"
            :key="k.keys"
            class="flex items-center gap-2 rounded-md border border-white/8 bg-black/30 px-2 py-1"
          >
            <kbd class="inline-flex min-w-[20px] items-center justify-center rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-slate-200">
              {{ k.keys }}
            </kbd>
            <span class="text-slate-400">{{ k.desc }}</span>
          </div>
        </div>
      </section>

      <section class="rounded-lg border border-white/8 bg-white/[0.02] p-3">
        <div class="mb-2 flex items-center gap-2">
          <span
            class="flex h-6 w-6 items-center justify-center rounded-md"
            style="background: #38bdf822; color: #38bdf8"
          >
            <MousePointerClick class="h-3.5 w-3.5" />
          </span>
          <h3 class="text-xs font-semibold text-slate-100">进阶技巧：点击跳转</h3>
        </div>
        <div class="space-y-1.5 text-[11px] leading-relaxed text-slate-400">
          <p>
            点击 G-code 编辑器中的任意一行，即可将 3D 仿真直接跳到该程序段 — 非常适合研究单步如何切削零件。
          </p>
        </div>
      </section>

      <div class="flex items-center gap-2 px-1 py-2 text-[10px] text-slate-600">
        <Cpu class="h-3 w-3" />
        <span>基于 Vue 3 · TresJS · Element Plus 与自定义 G-code 解释器构建。</span>
      </div>
    </div>
  </div>
</template>
