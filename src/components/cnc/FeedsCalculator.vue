<script setup lang="ts">
import { computed, ref } from "vue";
import {
  Calculator,
  Gauge,
  Zap,
  AlertTriangle,
  Info,
  RotateCw,
  Scissors,
  Ruler,
  Layers,
} from "lucide-vue-next";
import { TOOL_LIBRARY, getToolByNumber } from "@/lib/cnc/tools";
import { MATERIAL_LIBRARY, getMaterialById } from "@/lib/cnc/materials";
import { calculateFeeds } from "@/lib/cnc/feeds";

const COOLANT_LABEL: Record<string, string> = {
  flood: "切削液",
  mist: "雾冷",
  air: "气冷",
  none: "关闭",
  off: "关闭",
};

const toolNumber = ref(TOOL_LIBRARY[0].number);
const materialId = ref(MATERIAL_LIBRARY[0].id);
const axialPct = ref(80);
const radialPct = ref(100);
const feedPct = ref(100);

const tool = computed(
  () => getToolByNumber(toolNumber.value) ?? TOOL_LIBRARY[0],
);
const material = computed(() => getMaterialById(materialId.value));

const result = computed(() =>
  calculateFeeds(tool.value, material.value ?? MATERIAL_LIBRARY[0], {
    axialOverride: axialPct.value,
    radialOverridePct: radialPct.value,
    feedOverridePct: feedPct.value,
  }),
);
</script>

<template>
  <div class="flex h-full flex-col bg-[#0b0d10] text-slate-200">
    <div class="flex items-center gap-2 border-b border-white/10 px-4 py-3">
      <span class="flex h-7 w-7 items-center justify-center rounded-md bg-cyan-500/15 text-cyan-400">
        <Calculator class="h-4 w-4" />
      </span>
      <div class="min-w-0">
        <h2 class="text-sm font-semibold text-slate-100">进给与转速计算器</h2>
        <p class="text-[10px] text-slate-500">
          根据刀具与材料组合给出参考加工参数
        </p>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-3">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label class="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            刀具
          </label>
          <el-select v-model="toolNumber" class="w-full" size="default">
            <el-option
              v-for="t in TOOL_LIBRARY"
              :key="t.number"
              :label="`T${t.number} · ${t.name} (Ø${t.diameter}, ${t.flutes}刃)`"
              :value="t.number"
            >
              <span class="flex items-center gap-2">
                <span
                  class="h-2.5 w-2.5 rounded-full"
                  :style="{ background: t.color }"
                />
                T{{ t.number }} · {{ t.name }} (Ø{{ t.diameter }}, {{ t.flutes }}刃)
              </span>
            </el-option>
          </el-select>
        </div>
        <div>
          <label class="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            材料
          </label>
          <el-select v-model="materialId" class="w-full" size="default">
            <el-option
              v-for="m in MATERIAL_LIBRARY"
              :key="m.id"
              :label="m.name"
              :value="m.id"
            >
              <span class="flex items-center gap-2">
                <span
                  class="h-2.5 w-2.5 rounded-full border border-white/20"
                  :style="{ background: m.color }"
                />
                {{ m.name }}
              </span>
            </el-option>
          </el-select>
        </div>
      </div>

      <div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div class="rounded-md border border-white/8 bg-white/[0.02] p-2.5">
          <div class="flex items-center gap-2">
            <span
              class="h-3 w-3 rounded-full"
              :style="{
                background: tool.color,
                boxShadow: `0 0 8px ${tool.color}66`,
              }"
            />
            <span class="truncate text-xs font-semibold text-slate-100">
              T{{ tool.number }} · {{ tool.name }}
            </span>
          </div>
          <div class="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-slate-400">
            <span>Ø {{ tool.diameter }} mm</span>
            <span>{{ tool.flutes }} 刃</span>
            <span>刃长 {{ tool.length }} mm</span>
            <span>Vc {{ tool.surfaceSpeed }} m/min</span>
          </div>
        </div>
        <div class="rounded-md border border-white/8 bg-white/[0.02] p-2.5">
          <div class="flex items-center gap-2">
            <span
              class="h-3 w-3 rounded-full border border-white/20"
              :style="{ background: material.color }"
            />
            <span class="truncate text-xs font-semibold text-slate-100">
              {{ material.name }}
            </span>
          </div>
          <div class="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-slate-400">
            <span>ρ {{ material.density }} g/cm³</span>
            <span>Vc {{ material.surfaceSpeed }} m/min</span>
            <span>最大切深 {{ material.maxDepthOfCut }} mm</span>
            <span>冷却液：{{ COOLANT_LABEL[material.coolant] ?? material.coolant }}</span>
          </div>
        </div>
      </div>

      <div class="mt-3 space-y-3 rounded-md border border-white/8 bg-white/[0.02] p-3">
        <div>
          <div class="mb-1.5 flex items-center justify-between">
            <div class="flex items-center gap-1.5 text-[11px] font-medium text-slate-300">
              <Layers class="h-3.5 w-3.5" style="color: #22d3ee" />
              轴向切深 DOC
            </div>
            <div class="flex items-center gap-2">
              <span class="font-mono text-[10px] text-slate-500">
                → {{ result.docAxial.toFixed(2) }} mm
              </span>
              <span class="font-mono text-[11px] font-semibold tabular-nums" style="color: #22d3ee">
                {{ axialPct }}%
              </span>
            </div>
          </div>
          <el-slider v-model="axialPct" :min="10" :max="100" :step="5" />
        </div>
        <div>
          <div class="mb-1.5 flex items-center justify-between">
            <div class="flex items-center gap-1.5 text-[11px] font-medium text-slate-300">
              <Ruler class="h-3.5 w-3.5" style="color: #f59e0b" />
              径向切宽 WOC
            </div>
            <div class="flex items-center gap-2">
              <span class="font-mono text-[10px] text-slate-500">
                → {{ result.docRadial.toFixed(2) }} mm
              </span>
              <span class="font-mono text-[11px] font-semibold tabular-nums" style="color: #f59e0b">
                {{ radialPct }}%
              </span>
            </div>
          </div>
          <el-slider v-model="radialPct" :min="10" :max="100" :step="5" />
        </div>
        <div>
          <div class="mb-1.5 flex items-center justify-between">
            <div class="flex items-center gap-1.5 text-[11px] font-medium text-slate-300">
              <Gauge class="h-3.5 w-3.5" style="color: #fb923c" />
              进给倍率
            </div>
            <span class="font-mono text-[11px] font-semibold tabular-nums" style="color: #fb923c">
              {{ feedPct }}%
            </span>
          </div>
          <el-slider v-model="feedPct" :min="50" :max="150" :step="5" />
        </div>
      </div>

      <div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div class="rounded-md border border-white/8 bg-black/40 p-2.5">
          <div class="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
            <RotateCw class="h-3.5 w-3.5" style="color: #22d3ee" />
            主轴转速
          </div>
          <div class="mt-1 flex items-baseline gap-1">
            <span
              class="font-mono text-base font-semibold tabular-nums sm:text-lg"
              style="color: #22d3ee; text-shadow: 0 0 10px #22d3ee33"
            >
              {{ result.rpm.toLocaleString() }}
            </span>
          </div>
        </div>
        <div class="rounded-md border border-white/8 bg-black/40 p-2.5">
          <div class="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
            <Gauge class="h-3.5 w-3.5" style="color: #34d399" />
            进给
          </div>
          <div class="mt-1 flex items-baseline gap-1">
            <span
              class="font-mono text-base font-semibold tabular-nums sm:text-lg"
              style="color: #34d399; text-shadow: 0 0 10px #34d39933"
            >
              {{ result.feedMmPerMin.toLocaleString() }}
            </span>
            <span class="text-[9px] text-slate-500">mm/min</span>
          </div>
        </div>
        <div class="rounded-md border border-white/8 bg-black/40 p-2.5">
          <div class="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
            <Scissors class="h-3.5 w-3.5" style="color: #f59e0b" />
            每齿进给
          </div>
          <div class="mt-1 flex items-baseline gap-1">
            <span
              class="font-mono text-base font-semibold tabular-nums sm:text-lg"
              style="color: #f59e0b; text-shadow: 0 0 10px #f59e0b33"
            >
              {{ result.chipLoadActual.toFixed(4) }}
            </span>
            <span class="text-[9px] text-slate-500">mm/t</span>
          </div>
        </div>
        <div class="rounded-md border border-white/8 bg-black/40 p-2.5">
          <div class="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
            <Layers class="h-3.5 w-3.5" style="color: #a78bfa" />
            MRR
          </div>
          <div class="mt-1 flex items-baseline gap-1">
            <span
              class="font-mono text-base font-semibold tabular-nums sm:text-lg"
              style="color: #a78bfa; text-shadow: 0 0 10px #a78bfa33"
            >
              {{ result.mrr.toFixed(2) }}
            </span>
            <span class="text-[9px] text-slate-500">cm³/min</span>
          </div>
        </div>
        <div class="rounded-md border border-white/8 bg-black/40 p-2.5">
          <div class="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
            <Zap class="h-3.5 w-3.5" style="color: #fb923c" />
            功率
          </div>
          <div class="mt-1 flex items-baseline gap-1">
            <span
              class="font-mono text-base font-semibold tabular-nums sm:text-lg"
              style="color: #fb923c; text-shadow: 0 0 10px #fb923c33"
            >
              {{ result.power.toFixed(2) }}
            </span>
            <span class="text-[9px] text-slate-500">kW</span>
          </div>
        </div>
        <div class="rounded-md border border-white/8 bg-black/40 p-2.5">
          <div class="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
            <Ruler class="h-3.5 w-3.5" style="color: #2dd4bf" />
            DOC / WOC
          </div>
          <div class="mt-1 flex items-baseline gap-1">
            <span
              class="font-mono text-base font-semibold tabular-nums sm:text-lg"
              style="color: #2dd4bf; text-shadow: 0 0 10px #2dd4bf33"
            >
              {{ result.docAxial.toFixed(1) }} / {{ result.docRadial.toFixed(1) }}
            </span>
            <span class="text-[9px] text-slate-500">mm</span>
          </div>
        </div>
      </div>

      <div
        v-if="result.warnings.length > 0"
        class="mt-3 rounded-md border border-amber-500/30 bg-amber-500/[0.06] p-2.5"
      >
        <div class="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-amber-400">
          <AlertTriangle class="h-3.5 w-3.5" />
          {{ result.warnings.length }} 条警告
        </div>
        <ul class="space-y-1">
          <li
            v-for="(w, i) in result.warnings"
            :key="i"
            class="flex gap-1.5 text-[10px] leading-snug text-amber-200/80"
          >
            <span class="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
            {{ w }}
          </li>
        </ul>
      </div>

      <div class="mt-3 flex items-start gap-2 rounded-md border border-cyan-500/20 bg-cyan-500/[0.05] p-2.5">
        <Info class="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" />
        <p class="text-[10px] leading-snug text-slate-400">
          以上数值仅供
          <span class="font-semibold text-cyan-300">参考</span>
          ，不会修改已加载的 G-code 程序。若要应用，请手动编辑程序中的
          <code class="rounded bg-black/40 px-1 font-mono text-cyan-300">S</code>（主轴）和
          <code class="rounded bg-black/40 px-1 font-mono text-cyan-300">F</code>（进给）字。
        </p>
      </div>
    </div>
  </div>
</template>
