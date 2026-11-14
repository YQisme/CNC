<script setup lang="ts">
import { computed, ref } from "vue";
import {
  Route,
  Grid3x3,
  Box,
  Eye,
  EyeOff,
  DoorOpen,
  Bomb,
  RefreshCw,
  Maximize2,
  Camera,
  ScanEye,
  ArrowDownUp,
  ArrowUpDown,
  Wrench,
  Cpu,
  Download,
} from "lucide-vue-next";
import { useViewStore, type CameraPreset, type ViewToggleKey } from "@/stores/view";
import { useSimStore } from "@/stores/sim";
import { MACHINE_CATALOG, type MachineType } from "@/lib/cnc/machines";
import { downloadMachineModel, type ExportFormat } from "@/lib/cnc/exportModel";
import { cn } from "@/lib/utils";

const view = useViewStore();
const sim = useSimStore();

const exporting = ref(false);
const exportMsg = ref<string | null>(null);

const canExport = computed(() => sim.machineId === "sf260_5axis");

const explodePct = computed({
  get: () => Math.round(view.explodeAmount * 100),
  set: (v: number) => view.setExplodeAmount(v / 100),
});

const PRESETS: { id: CameraPreset; label: string }[] = [
  { id: "iso", label: "等轴测视图" },
  { id: "top", label: "俯视图 (XY)" },
  { id: "bottom", label: "仰视图（底部检查）" },
  { id: "front", label: "前视图 (XZ)" },
  { id: "right", label: "右视图 (YZ)" },
];

function toggle(k: ViewToggleKey) {
  view.toggle(k);
}

function setMachine(id: string) {
  sim.setMachineId(id as MachineType);
}

async function onExport(format: ExportFormat) {
  if (!canExport.value || exporting.value) return;
  exporting.value = true;
  exportMsg.value = null;
  // 导出需要外壳 mesh 在场景中，否则 SF260_Shell 组为空
  const restoreShell = !view.showShell;
  if (restoreShell) view.showShell = true;
  try {
    // 等一帧让 Sf260Exterior 挂载完成
    if (restoreShell) {
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
    }
    await downloadMachineModel(format, "SF-260H");
    exportMsg.value = format === "glb" ? "已下载 GLB（外壳+内部两组）" : "已下载 OBJ（外壳+内部两组）";
  } catch (e) {
    exportMsg.value = e instanceof Error ? e.message : "导出失败";
  } finally {
    if (restoreShell) view.showShell = false;
    exporting.value = false;
    window.setTimeout(() => {
      exportMsg.value = null;
    }, 2800);
  }
}
</script>

<template>
  <!-- top-left -->
  <div class="pointer-events-none absolute left-3 top-3 z-10 flex flex-col gap-1.5">
    <div
      class="pointer-events-auto flex items-center gap-2 rounded-md border border-cyan-500/30 bg-black/70 px-2.5 py-1.5 shadow-lg backdrop-blur"
    >
      <Cpu class="h-4 w-4 text-cyan-400" />
      <el-select
        :model-value="sim.machineId"
        size="small"
        class="overlay-machine-select"
        @update:model-value="setMachine"
      >
        <el-option
          v-for="m in MACHINE_CATALOG"
          :key="m.id"
          :label="`${m.shortName} (${m.category})`"
          :value="m.id"
        />
      </el-select>
    </div>

    <div
      class="pointer-events-auto flex items-center gap-2 rounded-md border border-white/10 bg-black/60 px-2.5 py-1.5 backdrop-blur"
    >
      <Camera class="h-3.5 w-3.5 text-cyan-400" />
      <span class="max-w-[180px] truncate text-xs font-semibold text-slate-100">
        {{ sim.programName }}
      </span>
    </div>
    <div
      class="pointer-events-auto flex items-center gap-2 rounded-md border border-white/10 bg-black/60 px-2.5 py-1.5 backdrop-blur"
    >
      <Wrench class="h-3.5 w-3.5 text-amber-400" />
      <span class="font-mono text-[10px] text-slate-300">
        T{{ sim.tool || 0 }} 当前刀具
      </span>
    </div>

    <div
      v-if="canExport"
      class="pointer-events-auto flex flex-col gap-1 rounded-md border border-white/10 bg-black/70 p-1.5 shadow-lg backdrop-blur"
    >
      <div
        class="flex items-center gap-1.5 px-1 pb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400"
      >
        <Download class="h-3 w-3 text-cyan-400" />
        导出模型
      </div>
      <div class="flex gap-1">
        <el-button
          size="small"
          :disabled="exporting"
          class="flex-1 !border-cyan-500/40 !bg-cyan-500/15 !font-mono !text-[10px] !font-semibold !text-cyan-100"
          @click="onExport('glb')"
        >
          GLB
        </el-button>
        <el-button
          size="small"
          :disabled="exporting"
          class="flex-1 !border-white/15 !bg-white/5 !font-mono !text-[10px] !font-semibold !text-slate-200"
          @click="onExport('obj')"
        >
          OBJ
        </el-button>
      </div>
      <span v-if="exportMsg" class="px-1 text-[10px] text-emerald-300">
        {{ exportMsg }}
      </span>
    </div>
  </div>

  <!-- top-right -->
  <div class="absolute right-3 top-3 z-10 flex flex-col gap-1.5">
    <div class="flex flex-col gap-1.5">
      <el-tooltip content="显示/隐藏 3D 刀具路径" placement="left">
        <button
          type="button"
          :class="
            cn(
              'flex h-8 w-8 items-center justify-center rounded-md border transition-colors',
              view.showToolpath
                ? 'border-cyan-400/50 bg-cyan-500/20 text-cyan-200'
                : 'border-white/10 bg-black/60 text-slate-400 hover:bg-white/10 hover:text-slate-200',
            )
          "
          @click="toggle('showToolpath')"
        >
          <Route class="h-4 w-4" />
        </button>
      </el-tooltip>
      <el-tooltip content="显示/隐藏网格与比例" placement="left">
        <button
          type="button"
          :class="
            cn(
              'flex h-8 w-8 items-center justify-center rounded-md border transition-colors',
              view.showGrid
                ? 'border-cyan-400/50 bg-cyan-500/20 text-cyan-200'
                : 'border-white/10 bg-black/60 text-slate-400 hover:bg-white/10 hover:text-slate-200',
            )
          "
          @click="toggle('showGrid')"
        >
          <Grid3x3 class="h-4 w-4" />
        </button>
      </el-tooltip>

      <template v-if="sim.machineId === 'sf260_5axis'">
        <el-tooltip
          :content="view.showShell ? '隐藏整机外壳' : '显示整机外壳'"
          placement="left"
        >
          <button
            type="button"
            :class="
              cn(
                'flex h-8 w-8 items-center justify-center rounded-md border transition-colors',
                view.showShell
                  ? 'border-cyan-400/50 bg-cyan-500/20 text-cyan-200'
                  : 'border-white/10 bg-black/60 text-slate-400 hover:bg-white/10 hover:text-slate-200',
              )
            "
            @click="toggle('showShell')"
          >
            <Eye v-if="view.showShell" class="h-4 w-4" />
            <EyeOff v-else class="h-4 w-4" />
          </button>
        </el-tooltip>
        <el-tooltip
          v-if="view.showShell"
          :content="view.showEnclosure ? '打开防护门' : '关闭防护门'"
          placement="left"
        >
          <button
            type="button"
            :class="
              cn(
                'flex h-8 w-8 items-center justify-center rounded-md border transition-colors',
                view.showEnclosure
                  ? 'border-cyan-400/50 bg-cyan-500/20 text-cyan-200'
                  : 'border-white/10 bg-black/60 text-slate-400 hover:bg-white/10 hover:text-slate-200',
              )
            "
            @click="toggle('showEnclosure')"
          >
            <DoorOpen class="h-4 w-4" />
          </button>
        </el-tooltip>
      </template>
      <el-tooltip v-else content="显示/隐藏护罩" placement="left">
        <button
          type="button"
          :class="
            cn(
              'flex h-8 w-8 items-center justify-center rounded-md border transition-colors',
              view.showEnclosure
                ? 'border-cyan-400/50 bg-cyan-500/20 text-cyan-200'
                : 'border-white/10 bg-black/60 text-slate-400 hover:bg-white/10 hover:text-slate-200',
            )
          "
          @click="toggle('showEnclosure')"
        >
          <Box class="h-4 w-4" />
        </button>
      </el-tooltip>
    </div>

    <div class="my-1 h-px w-full bg-white/10" />

    <div class="flex flex-col gap-1.5">
      <el-tooltip
        v-for="p in PRESETS"
        :key="p.id"
        :content="p.label"
        placement="left"
      >
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-black/60 text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200"
          @click="view.setCameraPreset(p.id)"
        >
          <ScanEye v-if="p.id === 'iso'" class="h-4 w-4" />
          <ArrowDownUp v-else-if="p.id === 'top'" class="h-4 w-4" />
          <ArrowUpDown v-else-if="p.id === 'bottom'" class="h-4 w-4" />
          <Box v-else-if="p.id === 'front'" class="h-4 w-4" />
          <Maximize2 v-else class="h-4 w-4" />
        </button>
      </el-tooltip>
      <el-tooltip content="重置相机环视" placement="left">
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-black/60 text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200"
          @click="view.setCameraPreset('reset')"
        >
          <RefreshCw class="h-4 w-4" />
        </button>
      </el-tooltip>
    </div>
  </div>

  <!-- bottom-left legend -->
  <div
    class="pointer-events-none absolute bottom-3 left-3 z-10 flex items-center gap-3 rounded-md border border-white/10 bg-black/60 px-2.5 py-1.5 font-mono text-[10px] backdrop-blur"
  >
    <span class="font-bold text-emerald-400">■ X</span>
    <span class="font-bold text-cyan-400">■ Y</span>
    <span class="font-bold text-green-400">■ Z</span>
    <span class="ml-2 text-slate-400">
      <Maximize2 class="inline h-3 w-3" /> 拖动 360° · 滚轮缩放
    </span>
  </div>

  <!-- bottom-right explode -->
  <div
    v-if="sim.machineId === 'sf260_5axis'"
    :class="
      cn(
        'pointer-events-auto absolute bottom-3 right-3 z-10 flex w-56 items-center gap-2 rounded-md border px-2.5 py-2 backdrop-blur',
        view.explodeAmount > 0.01
          ? 'border-cyan-400/50 bg-cyan-500/15'
          : 'border-white/10 bg-black/60',
      )
    "
    :title="
      view.showShell
        ? '爆炸视图：0–50% 外壳，50–100% 全部展开'
        : '爆炸视图：拖动展开内部龙门与加工区'
    "
  >
    <Bomb
      :class="
        cn(
          'h-3.5 w-3.5 shrink-0',
          view.explodeAmount > 0.01 ? 'text-cyan-200' : 'text-slate-400',
        )
      "
    />
    <span class="shrink-0 font-mono text-[10px] text-slate-400">爆炸</span>
    <el-slider
      v-model="explodePct"
      :min="0"
      :max="100"
      :step="1"
      :show-tooltip="false"
      class="flex-1"
    />
    <span class="w-7 shrink-0 text-right font-mono text-[10px] tabular-nums text-slate-300">
      {{ Math.round(view.explodeAmount * 100) }}
    </span>
  </div>
</template>

<style scoped>
.overlay-machine-select {
  width: 160px;
}
.overlay-machine-select :deep(.el-select__wrapper) {
  background: transparent;
  box-shadow: none;
  min-height: 24px;
  font-size: 12px;
  font-family: ui-monospace, monospace;
  font-weight: 700;
  color: #f1f5f9;
  padding: 0;
}
</style>
