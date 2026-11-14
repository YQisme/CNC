<script setup lang="ts">
import { computed, ref } from "vue";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Cpu,
  Layers,
  Ruler,
  CircleAlert,
  Upload,
} from "lucide-vue-next";
import { ElMessage } from "element-plus";
import { useSimStore } from "@/stores/sim";
import { CNC_EXAMPLES } from "@/lib/cnc/examples";
import {
  GCODE_FILE_ACCEPT,
  importProgramFile,
} from "@/lib/cnc/programStore";
import { getToolByNumber } from "@/lib/cnc/tools";
import { cn } from "@/lib/utils";
import GCodeEditor from "./GCodeEditor.vue";

const DIFFICULTY_COLOR: Record<string, string> = {
  入门: "#34d399",
  进阶: "#f59e0b",
  高级: "#fb7185",
};

const sim = useSimStore();
const fileInputRef = ref<HTMLInputElement | null>(null);

const currentExample = computed(() =>
  CNC_EXAMPLES.find((e) => e.id === sim.exampleId),
);

const moveCount = computed(() => sim.parseResult?.moves.length ?? 0);
const cutMoves = computed(
  () =>
    sim.parseResult?.moves.filter(
      (m) => m.type !== "rapid" && m.type !== "dwell",
    ).length ?? 0,
);
const toolLabel = computed(() => {
  const t = getToolByNumber(sim.tool);
  if (!t) return `T${sim.tool}`;
  return `Ø${t.diameter} ${t.name}`;
});

const selectValue = computed(() => sim.exampleId ?? "custom");

function onSelect(v: string) {
  if (v === "custom") {
    sim.setSource("; 在此输入自定义 G-code\n");
  } else {
    sim.loadExample(v);
  }
}

function handleImportClick() {
  fileInputRef.value?.click();
}

async function handleImportFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  try {
    const result = await importProgramFile(file);
    if (result.kind === "library") {
      ElMessage.success(
        result.count > 0
          ? `程序库已导入：已合并 ${result.count} 个程序到本地程序库（见「程序库」页）。`
          : "JSON 中未找到有效程序。",
      );
      return;
    }
    sim.setSource(result.code, { programName: result.name });
    ElMessage.success(
      `程序已导入：「${result.name}」已载入编辑器（${result.code.length} 字符）。`,
    );
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : "无法读取文件。");
  }
}
</script>

<template>
  <div class="flex h-full flex-col bg-[#0b0d10]">
    <div class="border-b border-white/10 p-2">
      <div class="mb-1.5 flex items-center gap-2">
        <el-select
          :model-value="selectValue"
          class="flex-1"
          size="small"
          placeholder="选择程序"
          @update:model-value="onSelect"
        >
          <el-option
            v-for="ex in CNC_EXAMPLES"
            :key="ex.id"
            :label="ex.name"
            :value="ex.id"
          >
            <span class="flex items-center gap-2 text-xs">
              <span
                class="h-1.5 w-1.5 rounded-full"
                :style="{ background: DIFFICULTY_COLOR[ex.difficulty] }"
              />
              {{ ex.name }}
            </span>
          </el-option>
          <el-option label="自定义（编辑器）" value="custom" />
        </el-select>
        <el-button
          size="small"
          class="shrink-0 border border-cyan-500/40 bg-cyan-500/10 text-[11px] text-cyan-100"
          title="导入 G 代码或程序库 JSON"
          @click="handleImportClick"
        >
          <Upload class="mr-1 size-3.5" />
          导入
        </el-button>
        <input
          ref="fileInputRef"
          type="file"
          :accept="GCODE_FILE_ACCEPT"
          class="hidden"
          @change="handleImportFile"
        />
        <el-tag
          v-if="currentExample"
          size="small"
          effect="plain"
          class="shrink-0 border-white/10 text-[10px]"
          :style="{ color: DIFFICULTY_COLOR[currentExample.difficulty] }"
        >
          {{ currentExample.difficulty }}
        </el-tag>
      </div>

      <p
        v-if="currentExample?.description"
        class="mb-2 text-[11px] leading-relaxed text-slate-400"
      >
        {{ currentExample.description }}
      </p>

      <div class="mt-1.5 grid grid-cols-2 gap-1 text-[9px]">
        <div class="flex items-center gap-1.5 rounded-md border border-white/8 bg-white/[0.03] px-2 py-1">
          <Ruler class="h-3 w-3 shrink-0" style="color: #34d399" />
          <div class="flex min-w-0 flex-col leading-tight">
            <span class="text-[8px] uppercase tracking-wider text-slate-500">毛坯</span>
            <span class="truncate font-mono text-[10px] font-semibold text-slate-200">
              {{ sim.workpiece.width }}×{{ sim.workpiece.depth }}×{{ sim.workpiece.height }} mm
            </span>
          </div>
        </div>
        <div class="flex items-center gap-1.5 rounded-md border border-white/8 bg-white/[0.03] px-2 py-1">
          <Cpu class="h-3 w-3 shrink-0" style="color: #a78bfa" />
          <div class="flex min-w-0 flex-col leading-tight">
            <span class="text-[8px] uppercase tracking-wider text-slate-500">刀具</span>
            <span class="truncate font-mono text-[10px] font-semibold text-slate-200">
              {{ toolLabel }}
            </span>
          </div>
        </div>
        <div class="flex items-center gap-1.5 rounded-md border border-white/8 bg-white/[0.03] px-2 py-1">
          <Layers class="h-3 w-3 shrink-0" style="color: #22d3ee" />
          <div class="flex min-w-0 flex-col leading-tight">
            <span class="text-[8px] uppercase tracking-wider text-slate-500">程序段</span>
            <span class="truncate font-mono text-[10px] font-semibold text-slate-200">
              {{ moveCount }}（{{ cutMoves }} 切削）
            </span>
          </div>
        </div>
        <div class="flex items-center gap-1.5 rounded-md border border-white/8 bg-white/[0.03] px-2 py-1">
          <Info class="h-3 w-3 shrink-0" style="color: #f59e0b" />
          <div class="flex min-w-0 flex-col leading-tight">
            <span class="text-[8px] uppercase tracking-wider text-slate-500">循环</span>
            <span class="truncate font-mono text-[10px] font-semibold text-slate-200">
              {{ sim.cycleTimeSec.toFixed(1) }} s
            </span>
          </div>
        </div>
      </div>

      <div class="mt-1.5">
        <div
          v-if="sim.parseErrors.length > 0"
          :class="
            cn(
              'max-h-24 overflow-y-auto rounded-md border px-2 py-1 text-[10px] [scrollbar-width:thin]',
              'border-rose-500/20 bg-rose-500/5',
            )
          "
        >
          <div class="mb-1 flex items-center gap-1.5 font-semibold text-rose-300">
            <CircleAlert class="h-3 w-3" />
            {{ sim.parseErrors.length }} 条错误
          </div>
          <div
            v-for="(it, i) in sim.parseErrors"
            :key="i"
            class="flex gap-1.5 py-0.5"
          >
            <span class="font-mono font-bold text-rose-400">L{{ it.line }}</span>
            <span class="text-slate-400">{{ it.message }}</span>
          </div>
        </div>
        <div
          v-else-if="sim.parseWarnings.length > 0"
          :class="
            cn(
              'max-h-24 overflow-y-auto rounded-md border px-2 py-1 text-[10px] [scrollbar-width:thin]',
              'border-amber-500/20 bg-amber-500/5',
            )
          "
        >
          <div class="mb-1 flex items-center gap-1.5 font-semibold text-amber-300">
            <AlertTriangle class="h-3 w-3" />
            {{ sim.parseWarnings.length }} 条警告
          </div>
          <div
            v-for="(it, i) in sim.parseWarnings"
            :key="i"
            class="flex gap-1.5 py-0.5"
          >
            <span class="font-mono font-bold text-amber-400">L{{ it.line }}</span>
            <span class="text-slate-400">{{ it.message }}</span>
          </div>
        </div>
        <div
          v-else
          class="flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-2 py-1 text-[10px] text-emerald-300"
        >
          <CheckCircle2 class="h-3 w-3" />
          程序解析成功 — 无错误或警告。
        </div>
      </div>
    </div>

    <div class="relative min-h-0 flex-1">
      <GCodeEditor />
    </div>
  </div>
</template>
