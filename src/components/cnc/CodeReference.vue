<script setup lang="ts">
import { computed, ref } from "vue";
import { Search, BookOpen, Lightbulb, Terminal } from "lucide-vue-next";
import { CODE_REFERENCE, ALL_CODES, type CodeEntry } from "@/lib/cnc/reference";
import { cn } from "@/lib/utils";

const CATEGORY_COLOR: Record<string, string> = {
  G: "#22d3ee",
  M: "#f59e0b",
  T: "#a78bfa",
  F: "#facc15",
  S: "#fb7185",
  Z: "#4ade80",
  Other: "#94a3b8",
};

const CATEGORY_FILTER_LABEL: Record<string, string> = {
  All: "全部",
  G: "G",
  M: "M",
  T: "T",
  F: "F",
  S: "S",
  Z: "Z",
  Other: "其他",
};

const query = ref("");
const activeCat = ref<string>("All");
const categories = ["All", "G", "M", "T", "F", "S", "Z", "Other"];

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  return ALL_CODES.filter((e) => {
    if (!q) return true;
    return (
      e.code.toLowerCase().includes(q) ||
      e.name.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      (e.group ?? "").toLowerCase().includes(q)
    );
  });
});

const grouped = computed(() => {
  const map = new Map<string, CodeEntry[]>();
  for (const e of filtered.value) {
    const arr = map.get(e.code[0]) ?? [];
    arr.push(e);
    map.set(e.code[0], arr);
  }
  return map;
});

const sortedGroups = computed(() =>
  [...grouped.value.entries()].sort((a, b) => a[0].localeCompare(b[0])),
);

function groupMeta(cat: string) {
  return CODE_REFERENCE.find((g) => g.category === cat);
}

function catColor(cat: string) {
  return CATEGORY_COLOR[cat] ?? "#94a3b8";
}
</script>

<template>
  <div class="flex h-full flex-col bg-[#0b0d10]">
    <div class="border-b border-white/10 p-3">
      <div class="mb-2 flex items-center gap-2">
        <BookOpen class="h-4 w-4 text-cyan-400" />
        <h3 class="text-sm font-semibold text-slate-100">CNC 代码参考手册</h3>
        <el-tag size="small" class="ml-auto bg-white/5 text-slate-300">
          {{ ALL_CODES.length }} 条代码
        </el-tag>
      </div>
      <div class="relative">
        <Search
          class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500"
        />
        <el-input
          v-model="query"
          placeholder="搜索代码，例如 G02、钻孔、冷却液…"
          size="small"
          class="pl-search"
        />
      </div>
      <div class="mt-2 flex flex-wrap gap-1">
        <button
          v-for="c in categories"
          :key="c"
          type="button"
          :class="
            cn(
              'rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-colors',
              activeCat === c
                ? 'border-cyan-400/50 bg-cyan-500/20 text-cyan-200'
                : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10',
            )
          "
          :style="
            activeCat === c && c !== 'All' ? { color: CATEGORY_COLOR[c] } : undefined
          "
          @click="activeCat = c"
        >
          {{ CATEGORY_FILTER_LABEL[c] ?? c }}
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-3 [scrollbar-width:thin]">
      <template v-if="activeCat !== 'All'">
        <div
          v-if="(grouped.get(activeCat) ?? []).length > 0"
          class="mb-4"
        >
          <div class="mb-2 flex items-center gap-2">
            <span
              class="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold"
              :style="{
                background: `${catColor(activeCat)}22`,
                color: catColor(activeCat),
              }"
            >
              {{ activeCat }}
            </span>
            <h4 class="text-xs font-semibold text-slate-200">
              {{ groupMeta(activeCat)?.title ?? `${activeCat} 代码` }}
            </h4>
          </div>
          <p
            v-if="groupMeta(activeCat)?.blurb"
            class="mb-2 text-[10px] leading-relaxed text-slate-500"
          >
            {{ groupMeta(activeCat)?.blurb }}
          </p>
          <div class="space-y-2">
            <div
              v-for="e in grouped.get(activeCat) ?? []"
              :key="e.code + e.name"
              class="rounded-md border border-white/8 bg-white/[0.03] p-2.5 transition-colors hover:border-white/15 hover:bg-white/[0.06]"
            >
              <div class="flex items-center gap-2">
                <code
                  class="rounded px-1.5 py-0.5 font-mono text-[11px] font-bold"
                  :style="{
                    background: `${catColor(activeCat)}22`,
                    color: catColor(activeCat),
                  }"
                >
                  {{ e.code }}
                </code>
                <span class="text-xs font-medium text-slate-200">{{ e.name }}</span>
                <el-tag
                  v-if="e.group"
                  size="small"
                  effect="plain"
                  class="ml-auto border-white/10 text-[9px] text-slate-400"
                >
                  {{ e.group }}
                </el-tag>
              </div>
              <p class="mt-1.5 text-[11px] leading-relaxed text-slate-400">
                {{ e.description }}
              </p>
              <pre
                v-if="e.example"
                class="mt-1.5 overflow-x-auto rounded bg-black/50 px-2 py-1 font-mono text-[10px] text-emerald-300"
              >{{ e.example }}</pre>
              <div
                v-if="e.tip"
                class="mt-1.5 flex items-start gap-1.5 text-[10px] text-amber-300/80"
              >
                <Lightbulb class="mt-0.5 h-3 w-3 shrink-0" />
                <span>{{ e.tip }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <div
          v-for="[cat, entries] in sortedGroups"
          :key="cat"
          class="mb-4"
        >
          <div class="mb-2 flex items-center gap-2">
            <span
              class="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold"
              :style="{
                background: `${catColor(cat)}22`,
                color: catColor(cat),
              }"
            >
              {{ cat }}
            </span>
            <h4 class="text-xs font-semibold text-slate-200">
              {{ groupMeta(cat)?.title ?? `${cat} 代码` }}
            </h4>
          </div>
          <p
            v-if="groupMeta(cat)?.blurb"
            class="mb-2 text-[10px] leading-relaxed text-slate-500"
          >
            {{ groupMeta(cat)?.blurb }}
          </p>
          <div class="space-y-2">
            <div
              v-for="e in entries"
              :key="e.code + e.name"
              class="rounded-md border border-white/8 bg-white/[0.03] p-2.5 transition-colors hover:border-white/15 hover:bg-white/[0.06]"
            >
              <div class="flex items-center gap-2">
                <code
                  class="rounded px-1.5 py-0.5 font-mono text-[11px] font-bold"
                  :style="{
                    background: `${catColor(cat)}22`,
                    color: catColor(cat),
                  }"
                >
                  {{ e.code }}
                </code>
                <span class="text-xs font-medium text-slate-200">{{ e.name }}</span>
                <el-tag
                  v-if="e.group"
                  size="small"
                  effect="plain"
                  class="ml-auto border-white/10 text-[9px] text-slate-400"
                >
                  {{ e.group }}
                </el-tag>
              </div>
              <p class="mt-1.5 text-[11px] leading-relaxed text-slate-400">
                {{ e.description }}
              </p>
              <pre
                v-if="e.example"
                class="mt-1.5 overflow-x-auto rounded bg-black/50 px-2 py-1 font-mono text-[10px] text-emerald-300"
              >{{ e.example }}</pre>
              <div
                v-if="e.tip"
                class="mt-1.5 flex items-start gap-1.5 text-[10px] text-amber-300/80"
              >
                <Lightbulb class="mt-0.5 h-3 w-3 shrink-0" />
                <span>{{ e.tip }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <div
        v-if="filtered.length === 0"
        class="mt-8 text-center text-xs text-slate-500"
      >
        没有匹配「{{ query }}」的代码。
      </div>
    </div>

    <div class="border-t border-white/10 p-2.5 text-[10px] text-slate-500">
      <div class="flex items-center gap-1.5">
        <Terminal class="h-3 w-3" />
        <span>点击编辑器中的某一行，可将仿真跳转到该程序段。</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pl-search :deep(.el-input__wrapper) {
  padding-left: 2rem;
  background: rgba(0, 0, 0, 0.4);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
}
</style>
