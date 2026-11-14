<script setup lang="ts">
import { computed, ref, type CSSProperties } from "vue";
import { useSimStore } from "@/stores/sim";

type Tok = { t: string; c: string };

const COLORS: Record<string, string> = {
  G: "#22d3ee",
  M: "#f59e0b",
  T: "#a78bfa",
  F: "#facc15",
  S: "#fb7185",
  X: "#34d399",
  Y: "#34d399",
  Z: "#4ade80",
  I: "#60a5fa",
  J: "#60a5fa",
  K: "#60a5fa",
  R: "#c084fc",
  N: "#64748b",
  num: "#e2e8f0",
  comment: "#6b7280",
  punct: "#94a3b8",
  default: "#cbd5e1",
};

function tokenizeLine(line: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  const n = line.length;
  while (i < n) {
    const ch = line[i];
    if (ch === " " || ch === "\t") {
      let j = i;
      while (j < n && (line[j] === " " || line[j] === "\t")) j++;
      toks.push({ t: line.slice(i, j), c: "default" });
      i = j;
      continue;
    }
    if (ch === ";") {
      toks.push({ t: line.slice(i), c: "comment" });
      i = n;
      continue;
    }
    if (ch === "(") {
      const end = line.indexOf(")", i);
      const stop = end === -1 ? n : end + 1;
      toks.push({ t: line.slice(i, stop), c: "comment" });
      i = stop;
      continue;
    }
    if (/[A-Za-z]/.test(ch)) {
      const letter = ch.toUpperCase();
      let j = i + 1;
      while (j < n && /[-+0-9.]/.test(line[j])) j++;
      const word = line.slice(i, j);
      toks.push({ t: word, c: COLORS[letter] ?? "default" });
      i = j;
      continue;
    }
    toks.push({ t: ch, c: "punct" });
    i++;
  }
  return toks;
}

const FONT: CSSProperties = {
  fontFamily:
    "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: "13px",
  lineHeight: "20px",
  letterSpacing: "0",
  tabSize: 2,
  whiteSpace: "pre",
  wordBreak: "keep-all",
  margin: "0",
};

const sim = useSimStore();
const preRef = ref<HTMLPreElement | null>(null);
const gutterRef = ref<HTMLDivElement | null>(null);
const taRef = ref<HTMLTextAreaElement | null>(null);

const lines = computed(() => sim.source.split("\n"));

const lineToMove = computed(() => {
  const m = new Map<number, number>();
  if (sim.parseResult) {
    for (const mv of sim.parseResult.moves) {
      if (!m.has(mv.line)) m.set(mv.line, mv.index);
    }
  }
  return m;
});

function handleScroll() {
  const ta = taRef.value;
  if (!ta) return;
  if (preRef.value) {
    preRef.value.scrollTop = ta.scrollTop;
    preRef.value.scrollLeft = ta.scrollLeft;
  }
  if (gutterRef.value) {
    gutterRef.value.scrollTop = ta.scrollTop;
  }
}

function onLineClick(lineNo: number) {
  const mv = lineToMove.value.get(lineNo);
  if (mv !== undefined) sim.jumpToMove(mv);
}

function onChange(e: Event) {
  const ta = e.target as HTMLTextAreaElement;
  sim.setSource(ta.value);
}

function onClick(e: MouseEvent) {
  const ta = e.currentTarget as HTMLTextAreaElement;
  const upto = sim.source.slice(0, ta.selectionStart);
  const lineNo = upto.split("\n").length;
  onLineClick(lineNo);
}

function tokColor(c: string) {
  return COLORS[c] ?? "#cbd5e1";
}
</script>

<template>
  <div class="relative h-full w-full overflow-hidden bg-[#0b0d10]">
    <div class="flex h-full">
      <div
        ref="gutterRef"
        class="select-none overflow-hidden py-3 pl-3 pr-2 text-right"
        :style="{ ...FONT, color: '#475569', minWidth: '52px' }"
        aria-hidden="true"
      >
        <div v-for="(_, i) in lines" :key="i" style="height: 20px">
          {{ i + 1 }}
        </div>
      </div>

      <div class="relative flex-1 overflow-hidden">
        <pre
          ref="preRef"
          aria-hidden="true"
          class="pointer-events-none absolute inset-0 overflow-auto py-3 pl-2 pr-6"
          :style="FONT"
        ><div
            v-for="(ln, i) in lines"
            :key="i"
            :data-line="i + 1"
            :style="{
              height: '20px',
              background: i + 1 === sim.currentLine ? 'rgba(34,211,238,0.16)' : undefined,
              boxShadow: i + 1 === sim.currentLine ? 'inset 2px 0 0 #22d3ee' : undefined,
            }"
          ><span
              v-for="(tk, k) in tokenizeLine(ln || ' ')"
              :key="k"
              :style="{ color: tokColor(tk.c) }"
            >{{ tk.t }}</span><template v-if="ln === ''">&#8203;</template></div></pre>

        <textarea
          ref="taRef"
          :value="sim.source"
          spellcheck="false"
          wrap="off"
          placeholder="; 在此输入 G-code…"
          class="absolute inset-0 overflow-auto bg-transparent py-3 pl-2 pr-6 text-transparent caret-cyan-300 outline-none"
          :style="FONT"
          @input="onChange"
          @scroll="handleScroll"
          @click="onClick"
        />
      </div>
    </div>
  </div>
</template>
