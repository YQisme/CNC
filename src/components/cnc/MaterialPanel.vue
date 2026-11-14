<script setup lang="ts">
import { computed, ref } from "vue";
import { Palette, Check } from "lucide-vue-next";
import { MATERIAL_LIBRARY, type IsoMaterialGroup } from "@/lib/cnc/materials";
import { useSimStore } from "@/stores/sim";
import { cn } from "@/lib/utils";

const ISO_GROUPS: { id: "All" | IsoMaterialGroup; label: string }[] = [
  { id: "All", label: "全部" },
  { id: "N（有色金属）", label: "N（有色金属）" },
  { id: "P（钢）", label: "P（钢）" },
  { id: "M（不锈钢）", label: "M（不锈钢）" },
  { id: "S（高温合金）", label: "S（高温合金）" },
  { id: "K（铸铁）", label: "K（铸铁）" },
  { id: "O（合成材料）", label: "O（合成材料）" },
];

const COOLANT_LABEL: Record<string, string> = {
  flood: "切削液",
  mist: "雾冷",
  air: "气冷",
  none: "关闭",
  off: "关闭",
};

const sim = useSimStore();
const selectedGroup = ref<"All" | IsoMaterialGroup>("All");

const filteredMaterials = computed(() =>
  MATERIAL_LIBRARY.filter(
    (m) => selectedGroup.value === "All" || m.isoGroup === selectedGroup.value,
  ),
);
</script>

<template>
  <div class="flex h-full flex-col bg-[#0b0d10] text-slate-200">
    <div class="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
      <div class="flex items-center gap-2">
        <span class="flex h-7 w-7 items-center justify-center rounded-md bg-orange-500/15 text-orange-400">
          <Palette class="h-4 w-4" />
        </span>
        <div>
          <h2 class="text-sm font-semibold text-slate-100">ISO 材料目录</h2>
          <p class="text-[10px] text-slate-500">ISO 513 标准材料分类</p>
        </div>
      </div>
      <el-tag
        size="small"
        effect="plain"
        class="border-orange-500/30 text-[10px] text-orange-300"
      >
        {{ MATERIAL_LIBRARY.length }} 种材料
      </el-tag>
    </div>

    <div class="flex flex-wrap gap-1 border-b border-white/10 bg-[#0d0f13] px-3 py-2">
      <button
        v-for="grp in ISO_GROUPS"
        :key="grp.id"
        type="button"
        :class="
          cn(
            'rounded-md px-2 py-0.5 text-[10px] font-semibold transition-colors',
            selectedGroup === grp.id
              ? 'border border-orange-400/40 bg-orange-500/20 text-orange-200'
              : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200',
          )
        "
        @click="selectedGroup = grp.id"
      >
        {{ grp.label }}
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-3 [scrollbar-width:thin]">
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          v-for="m in filteredMaterials"
          :key="m.id"
          type="button"
          :aria-pressed="m.id === sim.materialId"
          :class="
            cn(
              'group relative flex flex-col rounded-md border p-2.5 text-left transition',
              m.id === sim.materialId
                ? 'border-cyan-400/60 bg-cyan-500/[0.08] shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                : 'border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]',
            )
          "
          @click="sim.setMaterial(m.id)"
        >
          <div class="flex items-center gap-2">
            <span
              class="relative h-7 w-7 shrink-0 overflow-hidden rounded-md border border-white/20 shadow-inner"
              :style="{ background: m.color }"
            >
              <span
                class="absolute inset-x-0 bottom-0 h-2"
                :style="{ background: m.sideColor }"
              />
            </span>
            <div class="min-w-0 flex-1">
              <div class="truncate text-xs font-semibold text-slate-100">
                {{ m.name }}
              </div>
              <div class="font-mono text-[10px] text-slate-400">
                {{ m.density }} g/cm³ · Vc {{ m.surfaceSpeed }} m/min
              </div>
            </div>
            <span
              v-if="m.id === sim.materialId"
              class="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300"
            >
              <Check class="h-3 w-3" />
            </span>
          </div>

          <p class="mt-1.5 text-[10px] leading-snug text-slate-400">
            {{ m.notes }}
          </p>

          <div class="mt-1.5 flex flex-wrap gap-1">
            <span class="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[9px] font-medium text-slate-400">
              最大切深 {{ m.maxDepthOfCut }} mm
            </span>
            <span class="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[9px] font-medium text-slate-400">
              步进 {{ m.maxStepover }}%
            </span>
            <span class="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[9px] font-medium text-slate-400">
              冷却液：{{ COOLANT_LABEL[m.coolant] ?? m.coolant }}
            </span>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>
