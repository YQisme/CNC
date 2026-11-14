<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Gauge,
  Wind,
  Wrench,
  FastForward,
  Footprints,
  CircleDot,
  FlaskConical,
  Lock,
  OctagonX,
  PauseCircle,
  Zap,
  Cpu,
} from "lucide-vue-next";
import { useSimStore } from "@/stores/sim";
import type { MachineMode } from "@/stores/sim";
import { MACHINE_CATALOG, type MachineType } from "@/lib/cnc/machines";
import { cn } from "@/lib/utils";

const sim = useSimStore();

function fmtTime(sec: number) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const cs = Math.floor((sec * 10) % 10);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${cs}`;
}

function fmt(n: number, digits = 2) {
  if (!isFinite(n)) n = 0;
  return n.toFixed(digits);
}

const showRotary = computed(() => sim.machineId === "sf260_5axis");

const axes = computed(() => {
  const list: { label: string; v: number; color: string; unit: string }[] = [
    { label: "X", v: sim.position.x, color: "#34d399", unit: "mm" },
    { label: "Y", v: sim.position.y, color: "#22d3ee", unit: "mm" },
    { label: "Z", v: sim.position.z, color: "#4ade80", unit: "mm" },
  ];
  if (showRotary.value) {
    list.push(
      { label: "A", v: sim.rotary.a, color: "#a78bfa", unit: "deg" },
      { label: "C", v: sim.rotary.c, color: "#f472b6", unit: "deg" },
    );
  }
  return list;
});

const rpmDisp = computed(() =>
  Math.round((sim.spindleRpm * sim.spindleOverride) / 100),
);

const coolantLabel = computed(() => {
  switch (sim.coolant) {
    case "flood":
      return "切削液";
    case "mist":
      return "雾冷";
    case "air":
      return "气冷";
    default:
      return "关闭";
  }
});

const progress = computed(() => sim.progress);
const totalMoves = computed(() => sim.parseResult?.moves.length ?? 0);
const timelineValue = computed({
  get: () => Math.round(progress.value * 1000),
  set: (v: number) => sim.seek(v / 1000),
});

const speedPresets = [0.25, 0.5, 1, 2, 5, 10];

const modes: { id: MachineMode; label: string; tip: string }[] = [
  { id: "run", label: "运行", tip: "运行模式 — 完整切削仿真" },
  { id: "dry_run", label: "干运行", tip: "干运行 — 刀具路径运行但不切削材料" },
  { id: "machine_lock", label: "锁定", tip: "机床锁定 — 不切削，仅预览刀具路径" },
];

function modeClass(id: MachineMode, active: boolean) {
  if (!active) return "text-slate-500 hover:text-slate-300";
  if (id === "run") return "bg-emerald-500/20 text-emerald-300";
  if (id === "dry_run") return "bg-amber-500/20 text-amber-300";
  return "bg-rose-500/20 text-rose-300";
}

const lastRef = ref<number | null>(null);
let raf = 0;

function loop(t: number) {
  if (lastRef.value == null) lastRef.value = t;
  const dt = Math.min(0.05, (t - lastRef.value) / 1000);
  lastRef.value = t;
  if (dt > 0) sim.tick(dt);
  raf = requestAnimationFrame(loop);
}

function onKey(e: KeyboardEvent) {
  const target = e.target as HTMLElement;
  if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") return;
  if (e.code === "Space") {
    e.preventDefault();
    sim.toggle();
  } else if (e.code === "ArrowRight") {
    e.preventDefault();
    sim.stepForward();
  } else if (e.code === "ArrowLeft") {
    e.preventDefault();
    sim.stepBackward();
  } else if (e.code === "KeyR") {
    e.preventDefault();
    sim.reset();
  }
}

onMounted(() => {
  raf = requestAnimationFrame(loop);
  window.addEventListener("keydown", onKey);
});

onUnmounted(() => {
  cancelAnimationFrame(raf);
  window.removeEventListener("keydown", onKey);
});

function setMachine(id: string) {
  sim.setMachineId(id as MachineType);
}

function setWorkpieceDim(key: "width" | "depth" | "height", raw: string | number) {
  const n = Number(raw);
  if (key === "height") sim.setWorkpiece({ height: Math.max(5, n) });
  else sim.setWorkpiece({ [key]: Math.max(10, n) });
}
</script>

<template>
  <div class="flex h-full flex-col gap-4 p-4">
    <!-- DRO -->
    <div class="flex w-full flex-col gap-1.5">
      <div
        v-for="a in axes"
        :key="a.label"
        class="relative flex min-w-[92px] flex-col rounded-md border border-white/10 bg-black/60 px-2.5 py-1.5 shadow-inner"
      >
        <div class="flex items-center justify-between">
          <span
            class="text-[10px] font-bold tracking-widest"
            :style="{ color: a.color }"
          >
            {{ a.label }}
          </span>
          <span class="text-[8px] uppercase tracking-wider text-slate-500">
            {{ a.unit }}
          </span>
        </div>
        <span
          class="font-mono text-lg font-semibold tabular-nums leading-tight"
          :style="{ color: a.color, textShadow: `0 0 8px ${a.color}55` }"
        >
          {{ fmt(a.v, a.unit === "deg" ? 2 : 3) }}
        </span>
        <span
          v-if="sim.isCutting && a.label === 'Z'"
          class="absolute right-1 top-1 h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500"
        />
      </div>
    </div>

    <div class="h-px w-full shrink-0 bg-white/10" />

    <!-- Status lamps -->
    <div class="grid grid-cols-2 gap-1.5">
      <div
        :class="
          cn(
            'flex items-center gap-2 rounded-md border px-2.5 py-1.5 transition-colors',
            sim.spindleOn
              ? 'border-white/15 bg-white/5'
              : 'border-white/5 bg-black/40 opacity-60',
          )
        "
      >
        <CircleDot
          v-if="sim.spindleDir >= 0"
          class="h-4 w-4 shrink-0"
          :style="{ color: sim.spindleOn ? '#f59e0b' : '#64748b' }"
        />
        <RotateCcw
          v-else
          class="h-4 w-4 shrink-0"
          :style="{ color: sim.spindleOn ? '#f59e0b' : '#64748b' }"
        />
        <div class="flex flex-col leading-tight">
          <span class="text-[8px] uppercase tracking-wider text-slate-500">主轴</span>
          <span
            class="font-mono text-xs font-semibold tabular-nums"
            :style="{ color: sim.spindleOn ? '#f59e0b' : '#94a3b8' }"
          >
            {{ sim.spindleOn ? `${rpmDisp} rpm` : "关闭" }}
          </span>
        </div>
      </div>

      <div
        :class="
          cn(
            'flex items-center gap-2 rounded-md border px-2.5 py-1.5 transition-colors',
            sim.isCutting
              ? 'border-white/15 bg-white/5'
              : 'border-white/5 bg-black/40 opacity-60',
          )
        "
      >
        <Gauge
          class="h-4 w-4 shrink-0"
          :style="{ color: sim.isCutting ? '#22d3ee' : '#64748b' }"
        />
        <div class="flex flex-col leading-tight">
          <span class="text-[8px] uppercase tracking-wider text-slate-500">进给</span>
          <span
            class="font-mono text-xs font-semibold tabular-nums"
            :style="{ color: sim.isCutting ? '#22d3ee' : '#94a3b8' }"
          >
            {{ sim.isCutting ? `${fmt(sim.feed, 0)} mm/min` : "—" }}
          </span>
        </div>
      </div>

      <div
        :class="
          cn(
            'flex items-center gap-2 rounded-md border px-2.5 py-1.5 transition-colors',
            sim.tool > 0
              ? 'border-white/15 bg-white/5'
              : 'border-white/5 bg-black/40 opacity-60',
          )
        "
      >
        <Wrench
          class="h-4 w-4 shrink-0"
          :style="{ color: sim.tool > 0 ? '#a78bfa' : '#64748b' }"
        />
        <div class="flex flex-col leading-tight">
          <span class="text-[8px] uppercase tracking-wider text-slate-500">刀具</span>
          <span
            class="font-mono text-xs font-semibold tabular-nums"
            :style="{ color: sim.tool > 0 ? '#a78bfa' : '#94a3b8' }"
          >
            T{{ sim.tool || 0 }}
          </span>
        </div>
      </div>

      <div
        :class="
          cn(
            'flex items-center gap-2 rounded-md border px-2.5 py-1.5 transition-colors',
            sim.coolant !== 'off'
              ? 'border-white/15 bg-white/5'
              : 'border-white/5 bg-black/40 opacity-60',
          )
        "
      >
        <Wind
          class="h-4 w-4 shrink-0"
          :style="{ color: sim.coolant !== 'off' ? '#38bdf8' : '#64748b' }"
        />
        <div class="flex flex-col leading-tight">
          <span class="text-[8px] uppercase tracking-wider text-slate-500">冷却液</span>
          <span
            class="font-mono text-xs font-semibold tabular-nums"
            :style="{ color: sim.coolant !== 'off' ? '#38bdf8' : '#94a3b8' }"
          >
            {{ coolantLabel }}
          </span>
        </div>
      </div>
    </div>

    <div class="h-px w-full shrink-0 bg-white/10" />

    <!-- Timeline -->
    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between text-[9px] uppercase tracking-wider text-slate-500">
        <span>时间轴</span>
        <span class="font-mono tabular-nums text-slate-400">
          {{ (progress * 100).toFixed(1) }}%
        </span>
      </div>
      <el-slider
        v-model="timelineValue"
        :min="0"
        :max="1000"
        :step="1"
        :show-tooltip="false"
      />
      <div class="flex items-center justify-between font-mono text-[9px] tabular-nums text-slate-500">
        <span>{{ fmtTime(sim.elapsedTimeSec) }}</span>
        <span>-{{ fmtTime(Math.max(0, sim.cycleTimeSec - sim.elapsedTimeSec)) }}</span>
      </div>
    </div>

    <div class="h-px w-full shrink-0 bg-white/10" />

    <!-- Machine + modes -->
    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between gap-1.5 rounded-md border border-white/10 bg-black/60 px-2 py-1">
        <div class="flex items-center gap-1 text-[10px] font-semibold uppercase text-cyan-400">
          <Cpu class="h-3.5 w-3.5" />
          机床
        </div>
        <el-select
          :model-value="sim.machineId"
          size="small"
          class="machine-select"
          @update:model-value="setMachine"
        >
          <el-option
            v-for="m in MACHINE_CATALOG"
            :key="m.id"
            :label="m.shortName"
            :value="m.id"
          />
        </el-select>
      </div>

      <div class="flex items-center justify-between gap-1.5">
        <el-tooltip content="选择停止 (M01)" placement="top">
          <el-button
            circle
            :class="
              cn(
                'h-9 w-9 border border-white/10 bg-white/5 text-slate-200',
                sim.optionalStop && 'border-cyan-400/50 bg-cyan-500/20 text-cyan-200',
              )
            "
            @click="sim.toggleOptionalStop()"
          >
            <PauseCircle class="h-4 w-4" />
          </el-button>
        </el-tooltip>
        <el-tooltip content="跳过程序段 (/)" placement="top">
          <el-button
            circle
            :class="
              cn(
                'h-9 w-9 border border-white/10 bg-white/5 text-slate-200',
                sim.blockSkip && 'border-cyan-400/50 bg-cyan-500/20 text-cyan-200',
              )
            "
            @click="sim.toggleBlockSkip()"
          >
            <OctagonX class="h-4 w-4" />
          </el-button>
        </el-tooltip>
        <div class="ml-auto flex items-center gap-0.5 rounded-md border border-white/10 bg-black/50 p-0.5">
          <el-tooltip
            v-for="m in modes"
            :key="m.id"
            :content="m.tip"
            placement="top"
          >
            <button
              type="button"
              :class="
                cn(
                  'flex h-7 items-center gap-1 rounded px-2 text-[10px] font-semibold uppercase tracking-wider transition-colors',
                  modeClass(m.id, sim.machineMode === m.id),
                )
              "
              @click="sim.setMachineMode(m.id)"
            >
              <Play v-if="m.id === 'run'" class="h-3 w-3" />
              <FlaskConical v-else-if="m.id === 'dry_run'" class="h-3 w-3" />
              <Lock v-else class="h-3 w-3" />
              {{ m.label }}
            </button>
          </el-tooltip>
        </div>
      </div>
    </div>

    <!-- Transport -->
    <div class="flex items-center justify-center gap-2 py-2">
      <el-tooltip content="单步后退 (←)" placement="top">
        <el-button
          circle
          class="h-9 w-9 border border-white/10 bg-white/5 text-slate-200"
          @click="sim.stepBackward()"
        >
          <SkipBack class="h-4 w-4" />
        </el-button>
      </el-tooltip>
      <el-tooltip :content="sim.playing ? '暂停 (Space)' : '播放 (Space)'" placement="top">
        <el-button
          circle
          :class="
            cn(
              'h-12 w-12 shrink-0 border-2 transition-all',
              sim.playing
                ? 'border-amber-400/60 bg-amber-500/20 text-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.45)]'
                : 'border-cyan-400/60 bg-cyan-500/20 text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.4)]',
            )
          "
          @click="sim.toggle()"
        >
          <Pause v-if="sim.playing" class="h-5 w-5" />
          <Play v-else class="h-5 w-5 translate-x-0.5" />
        </el-button>
      </el-tooltip>
      <el-tooltip content="单步前进 (→)" placement="top">
        <el-button
          circle
          class="h-9 w-9 border border-white/10 bg-white/5 text-slate-200"
          @click="sim.stepForward()"
        >
          <SkipForward class="h-4 w-4" />
        </el-button>
      </el-tooltip>
    </div>
    <div class="flex items-center justify-center gap-4">
      <el-tooltip content="复位 (R)" placement="top">
        <el-button
          circle
          class="h-9 w-9 border border-white/10 bg-white/5 text-slate-200"
          @click="sim.reset()"
        >
          <RotateCcw class="h-4 w-4" />
        </el-button>
      </el-tooltip>
      <el-tooltip content="单段运行模式" placement="top">
        <el-button
          circle
          :class="
            cn(
              'h-9 w-9 border border-white/10 bg-white/5 text-slate-200',
              sim.singleBlock && 'border-cyan-400/50 bg-cyan-500/20 text-cyan-200',
            )
          "
          @click="sim.toggleSingleBlock()"
        >
          <Footprints class="h-4 w-4" />
        </el-button>
      </el-tooltip>
    </div>

    <div class="h-px w-full shrink-0 bg-white/10" />

    <!-- Speed presets -->
    <div class="flex shrink-0 flex-col gap-2">
      <div class="flex items-center gap-1.5">
        <FastForward class="h-3 w-3 text-slate-500" />
        <span class="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
          循环速度
        </span>
      </div>
      <div class="flex flex-wrap items-center gap-1.5">
        <button
          v-for="sp in speedPresets"
          :key="sp"
          type="button"
          :class="
            cn(
              'flex-1 rounded-md border px-1 py-1 font-mono text-[11px] font-semibold tabular-nums transition-colors',
              sim.speed === sp
                ? 'border-cyan-400/60 bg-cyan-500/25 text-cyan-200 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200',
            )
          "
          @click="sim.setSpeed(sp)"
        >
          {{ sp }}×
        </button>
      </div>
    </div>

    <div class="h-px w-full shrink-0 bg-white/10" />

    <!-- Workpiece -->
    <div class="flex shrink-0 flex-col gap-2 rounded-md border border-white/10 bg-black/40 p-2">
      <div class="flex items-center justify-between">
        <span class="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
          工件设置
        </span>
        <button
          type="button"
          class="flex items-center gap-1 rounded bg-cyan-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/30"
          @click="sim.autoFitWorkpiece()"
        >
          <Zap class="h-2.5 w-2.5" /> 自动适配
        </button>
      </div>

      <div class="flex items-center gap-1 rounded border border-white/5 bg-black/60 p-0.5">
        <button
          type="button"
          :class="
            cn(
              'flex-1 rounded py-0.5 text-[9px] font-mono font-semibold transition-colors',
              sim.originDatum === 'front_left'
                ? 'bg-cyan-500/25 text-cyan-200'
                : 'text-slate-500 hover:text-slate-300',
            )
          "
          @click="sim.setOriginDatum('front_left')"
        >
          前左 (G54)
        </button>
        <button
          type="button"
          :class="
            cn(
              'flex-1 rounded py-0.5 text-[9px] font-mono font-semibold transition-colors',
              sim.originDatum === 'center'
                ? 'bg-cyan-500/25 text-cyan-200'
                : 'text-slate-500 hover:text-slate-300',
            )
          "
          @click="sim.setOriginDatum('center')"
        >
          中心
        </button>
      </div>

      <div class="grid grid-cols-3 gap-1">
        <div class="flex flex-col">
          <span class="text-[8px] text-slate-500">X（宽度）</span>
          <el-input
            :model-value="sim.workpiece.width"
            type="number"
            size="small"
            @update:model-value="(v) => setWorkpieceDim('width', v)"
          />
        </div>
        <div class="flex flex-col">
          <span class="text-[8px] text-slate-500">Y（深度）</span>
          <el-input
            :model-value="sim.workpiece.depth"
            type="number"
            size="small"
            @update:model-value="(v) => setWorkpieceDim('depth', v)"
          />
        </div>
        <div class="flex flex-col">
          <span class="text-[8px] text-slate-500">Z（高度）</span>
          <el-input
            :model-value="sim.workpiece.height"
            type="number"
            size="small"
            @update:model-value="(v) => setWorkpieceDim('height', v)"
          />
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="mt-auto flex shrink-0 flex-col gap-1.5 rounded-md border border-white/10 bg-black/50 px-2.5 py-1.5">
      <div class="flex items-center justify-between">
        <span class="text-[8px] uppercase tracking-wider text-slate-500">程序段</span>
        <span class="font-mono text-xs font-semibold tabular-nums text-slate-200">
          {{ Math.min(sim.currentMoveIndex + 1, totalMoves || 1)
          }}<span class="text-slate-500"> / {{ totalMoves }}</span>
        </span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-[8px] uppercase tracking-wider text-slate-500">循环时间</span>
        <span class="font-mono text-xs font-semibold tabular-nums text-slate-200">
          {{ fmtTime(sim.elapsedTimeSec)
          }}<span class="text-slate-500"> / {{ fmtTime(sim.cycleTimeSec) }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.machine-select {
  width: 120px;
}
.machine-select :deep(.el-select__wrapper) {
  background: rgba(255, 255, 255, 0.05);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  min-height: 24px;
  font-size: 10px;
  font-family: ui-monospace, monospace;
  font-weight: 600;
  color: #e2e8f0;
}
</style>
