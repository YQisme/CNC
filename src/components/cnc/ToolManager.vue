<script setup lang="ts">
import { computed, ref } from "vue";
import { Wrench } from "lucide-vue-next";
import {
  TOOL_LIBRARY,
  type OperationCategory,
} from "@/lib/cnc/tools";
import { useSimStore } from "@/stores/sim";
import { cn } from "@/lib/utils";

const CATEGORIES: { id: "All" | OperationCategory; label: string }[] = [
  { id: "All", label: "全部" },
  { id: "铣削", label: "铣削" },
  { id: "钻孔", label: "钻孔" },
  { id: "孔加工", label: "孔加工" },
  { id: "精加工", label: "精加工" },
  { id: "车削", label: "车削" },
];

const sim = useSimStore();
const selectedCategory = ref<"All" | OperationCategory>("All");

const usedTools = computed(() => {
  const set = new Set<number>();
  if (sim.parseResult) {
    for (const m of sim.parseResult.moves) {
      if (m.tool > 0) set.add(m.tool);
    }
  }
  return set;
});

const filteredTools = computed(() =>
  TOOL_LIBRARY.filter(
    (t) =>
      selectedCategory.value === "All" || t.category === selectedCategory.value,
  ),
);
</script>

<template>
  <div class="h-full overflow-y-auto bg-[#0b0d10] p-3 [scrollbar-width:thin]">
    <div class="mb-3 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Wrench class="h-4 w-4 text-amber-400" />
        <h3 class="text-sm font-semibold text-slate-100">ISO 刀具库</h3>
      </div>
      <el-tag
        size="small"
        class="border border-amber-500/20 bg-amber-500/10 text-[10px] text-amber-300"
      >
        {{ TOOL_LIBRARY.length }} 把标准刀具
      </el-tag>
    </div>

    <p class="mb-3 text-[11px] leading-relaxed text-slate-400">
      国际 ISO 13399 与 ANSI 标准刀具目录。选择任意刀具可查看几何与加工参数。程序通过
      <code class="font-mono text-amber-300">T&lt;n&gt; M06</code> 调用刀具。
    </p>

    <div class="mb-3 flex flex-wrap gap-1 border-b border-white/10 pb-2">
      <button
        v-for="cat in CATEGORIES"
        :key="cat.id"
        type="button"
        :class="
          cn(
            'rounded-md px-2 py-1 text-[10px] font-semibold transition-colors',
            selectedCategory === cat.id
              ? 'border border-cyan-400/40 bg-cyan-500/20 text-cyan-200'
              : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200',
          )
        "
        @click="selectedCategory = cat.id"
      >
        {{ cat.label }}
      </button>
    </div>

    <div class="space-y-2">
      <div
        v-for="t in filteredTools"
        :key="t.number"
        :class="
          cn(
            'group relative rounded-lg border p-2.5 transition-colors',
            sim.tool === t.number
              ? 'border-amber-400/60 bg-amber-500/10 shadow-[0_0_14px_rgba(245,158,11,0.2)]'
              : usedTools.has(t.number)
                ? 'border-cyan-500/40 bg-cyan-500/5'
                : 'border-white/8 bg-white/[0.02] hover:border-white/15',
          )
        "
      >
        <div class="flex items-start gap-3">
          <div class="flex flex-col items-center gap-1">
            <div
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/20 font-mono text-xs font-bold text-slate-100 shadow"
              :style="{
                background: `linear-gradient(135deg, ${t.color}44, ${t.color}aa)`,
              }"
            >
              T{{ t.number }}
            </div>
            <span class="font-mono text-[8px] uppercase text-slate-500">
              {{ t.category[0] }}
            </span>
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="truncate text-xs font-bold text-slate-100">
                {{ t.name }}
              </span>
              <span class="rounded bg-white/5 px-1 font-mono text-[9px] text-slate-400">
                {{ t.isoCode }}
              </span>
              <el-tag
                v-if="sim.tool === t.number"
                size="small"
                class="ml-auto bg-amber-500/30 text-[9px] text-amber-200"
              >
                当前
              </el-tag>
              <el-tag
                v-else-if="usedTools.has(t.number)"
                size="small"
                effect="plain"
                class="ml-auto border-cyan-500/30 text-[9px] text-cyan-300"
              >
                程序中
              </el-tag>
            </div>

            <div class="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 font-mono text-[10px] text-slate-400">
              <span class="text-cyan-400">Ø{{ t.diameter }}mm</span>
              <span>刃数: {{ t.flutes }}</span>
              <span>L: {{ t.length }}mm</span>
              <span>刀柄: Ø{{ t.shankDiameter }}mm</span>
              <span v-if="t.cornerRadius">R{{ t.cornerRadius }}mm</span>
              <span v-if="t.pointAngle">{{ t.pointAngle }}°</span>
            </div>

            <p class="mt-1 text-[10px] leading-relaxed text-slate-400">
              {{ t.description }}
            </p>

            <div class="mt-1.5 flex flex-wrap gap-1.5">
              <span class="inline-flex items-center gap-1 rounded border border-white/8 bg-black/40 px-1.5 py-0.5 font-mono text-[9px]">
                <span class="text-slate-500">Vc</span>
                <span class="text-slate-300">{{ t.surfaceSpeed }} m/min</span>
              </span>
              <span class="inline-flex items-center gap-1 rounded border border-white/8 bg-black/40 px-1.5 py-0.5 font-mono text-[9px]">
                <span class="text-slate-500">fz</span>
                <span class="text-slate-300">{{ t.chipLoad }} mm</span>
              </span>
              <span class="inline-flex items-center gap-1 rounded border border-white/8 bg-black/40 px-1.5 py-0.5 font-mono text-[9px]">
                <span class="text-slate-500">类别</span>
                <span class="text-slate-300">{{ t.category }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
