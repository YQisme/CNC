<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import {
  Save,
  Download,
  Upload,
  Trash2,
  FilePlus,
  FolderOpen,
  FileCode,
  Plus,
} from "lucide-vue-next";
import { ElMessage } from "element-plus";
import { useSimStore } from "@/stores/sim";
import {
  listPrograms,
  saveProgram,
  deleteProgram,
  exportProgram,
  exportAllPrograms,
  importProgramFile,
  GCODE_FILE_ACCEPT,
  type SavedProgram,
} from "@/lib/cnc/programStore";
import { CODE_SNIPPETS, type Snippet } from "@/lib/cnc/snippets";

const SNIPPET_CATEGORIES = [
  { id: "All", label: "全部" },
  { id: "程序头", label: "程序头" },
  { id: "型腔", label: "型腔" },
  { id: "钻孔", label: "钻孔" },
  { id: "轮廓", label: "轮廓" },
  { id: "精加工", label: "精加工" },
  { id: "平面", label: "平面" },
  { id: "实用", label: "实用" },
] as const;

const SNIPPET_CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  SNIPPET_CATEGORIES.map((c) => [c.id, c.label]),
);

function formatDate(ms: number): string {
  try {
    const d = new Date(ms);
    return d.toLocaleString("zh-CN", {
      year: "2-digit",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

const sim = useSimStore();
const programs = ref<SavedProgram[]>([]);
const nameInput = ref("");
const snippetCategory = ref("All");
const deleteTarget = ref<SavedProgram | null>(null);
const deleteVisible = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const mounted = ref(false);

function refresh() {
  programs.value = listPrograms();
}

onMounted(() => {
  mounted.value = true;
  refresh();
});

watch(
  () => sim.programName,
  (name) => {
    if (!nameInput.value && name) nameInput.value = name;
  },
  { immediate: true },
);

function handleSave() {
  const name =
    (nameInput.value || "").trim() || sim.programName || "未命名程序";
  const saved = saveProgram({
    name,
    code: sim.source,
    workpiece: {
      width: sim.workpiece.width,
      depth: sim.workpiece.depth,
      height: sim.workpiece.height,
    },
  });
  nameInput.value = saved.name;
  refresh();
  ElMessage.success(
    `程序已保存：「${saved.name}」已本地存储（${saved.code.length} 字符）。`,
  );
}

function handleLoad(p: SavedProgram) {
  sim.setSource(p.code, { programName: p.name });
  sim.setWorkpiece({
    width: p.workpiece.width,
    depth: p.workpiece.depth,
    height: p.workpiece.height,
  });
  nameInput.value = p.name;
  ElMessage.success(`程序已加载：「${p.name}」已载入编辑器。`);
}

function handleDownload(p: SavedProgram) {
  exportProgram(p);
  ElMessage.success(`开始下载：${p.name}.nc`);
}

function handleExportAll() {
  if (programs.value.length === 0) {
    ElMessage.warning("无可导出内容：程序库为空。");
    return;
  }
  exportAllPrograms();
  ElMessage.success(`正在导出程序库：${programs.value.length} 个程序 → JSON。`);
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
      refresh();
      ElMessage.success(
        result.count > 0
          ? `导入完成：已导入 ${result.count} 个程序到程序库。`
          : "文件中未找到有效程序。",
      );
      return;
    }
    sim.setSource(result.code, { programName: result.name });
    nameInput.value = result.name;
    ElMessage.success(
      `G 代码已导入：「${result.name}」已载入编辑器。可点「保存」写入程序库。`,
    );
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : "无法读取文件。");
  }
}

function askDelete(p: SavedProgram) {
  deleteTarget.value = p;
  deleteVisible.value = true;
}

function confirmDelete() {
  if (!deleteTarget.value) return;
  const t = deleteTarget.value;
  deleteProgram(t.id);
  deleteTarget.value = null;
  deleteVisible.value = false;
  refresh();
  ElMessage.success(`程序已删除：「${t.name}」已从程序库移除。`);
}

function handleInsertSnippet(s: Snippet) {
  const cur = sim.source;
  const sep = cur.endsWith("\n") || cur.length === 0 ? "" : "\n";
  sim.setSource(cur + sep + "\n" + s.code);
  ElMessage.success(`片段已插入：「${s.name}」已追加到编辑器。`);
}

const visibleSnippets = computed(() =>
  snippetCategory.value === "All"
    ? CODE_SNIPPETS
    : CODE_SNIPPETS.filter((s) => s.category === snippetCategory.value),
);
</script>

<template>
  <div class="flex h-full flex-col bg-[#0b0d10] text-slate-200">
    <div class="flex items-center gap-2 border-b border-white/10 px-3 py-2">
      <FolderOpen class="size-4 text-cyan-400" />
      <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-300">
        程序库
      </h3>
      <span class="ml-auto rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">
        {{ mounted ? `已保存 ${programs.length} 个` : "—" }}
      </span>
    </div>

    <div class="cnc-scroll flex-1 space-y-4 overflow-y-auto p-3">
      <section class="rounded-lg border border-white/10 bg-black/30 p-3">
        <div class="mb-2 flex items-center gap-2">
          <FilePlus class="size-3.5 text-cyan-400" />
          <span class="text-[11px] font-semibold uppercase tracking-wide text-slate-300">
            保存当前程序
          </span>
        </div>
        <div class="flex gap-2">
          <el-input
            v-model="nameInput"
            placeholder="程序名称…"
            size="small"
            class="flex-1"
            @keydown.enter="handleSave"
          />
          <el-button
            size="small"
            type="primary"
            class="!bg-cyan-500 !text-black hover:!bg-cyan-400"
            @click="handleSave"
          >
            <Save class="mr-1 size-3.5" />
            保存
          </el-button>
        </div>
        <p class="mt-1.5 text-[10px] text-slate-500">
          将编辑器内容与当前工件（{{ sim.workpiece.width }}×{{ sim.workpiece.depth }}×{{
            sim.workpiece.height
          }}
          mm）以给定名称存储。 使用已有名称保存会原地更新。
        </p>
      </section>

      <section class="rounded-lg border border-white/10 bg-black/30 p-3">
        <div class="mb-2 flex items-center gap-2">
          <FileCode class="size-3.5 text-orange-400" />
          <span class="text-[11px] font-semibold uppercase tracking-wide text-slate-300">
            已保存程序
          </span>
        </div>

        <div
          v-if="mounted && programs.length === 0"
          class="rounded-md border border-dashed border-white/10 bg-black/20 px-3 py-6 text-center"
        >
          <FileCode class="mx-auto mb-2 size-5 text-slate-600" />
          <p class="text-[11px] text-slate-500">
            暂无已保存程序。
            <br />
            在上方保存当前程序以开始建立程序库。
          </p>
        </div>
        <ul v-else class="cnc-scroll max-h-72 space-y-2 overflow-y-auto pr-1">
          <li
            v-for="p in mounted ? programs : []"
            :key="p.id"
            class="group rounded-md border border-white/10 bg-white/[0.02] p-2 transition-colors hover:border-cyan-500/40 hover:bg-white/[0.04]"
          >
            <div class="flex items-start gap-2">
              <div class="min-w-0 flex-1">
                <div class="truncate text-xs font-medium text-slate-100">
                  {{ p.name }}
                </div>
                <div class="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500">
                  <span>
                    {{ p.workpiece.width }}×{{ p.workpiece.depth }}×{{ p.workpiece.height }} mm
                  </span>
                  <span class="text-slate-700">•</span>
                  <span>{{ p.code.length }} 字符</span>
                  <span class="text-slate-700">•</span>
                  <span :title="new Date(p.updatedAt).toISOString()">
                    {{ formatDate(p.updatedAt) }}
                  </span>
                </div>
              </div>
            </div>
            <div class="mt-2 flex flex-wrap gap-1">
              <el-button
                size="small"
                text
                class="!h-6 !px-2 !text-[10px] !text-cyan-300"
                @click="handleLoad(p)"
              >
                <FolderOpen class="mr-1 size-3" />
                加载
              </el-button>
              <el-button
                size="small"
                text
                class="!h-6 !px-2 !text-[10px] !text-slate-300"
                @click="handleDownload(p)"
              >
                <Download class="mr-1 size-3" />
                .nc
              </el-button>
              <el-button
                size="small"
                text
                class="!h-6 !px-2 !text-[10px] !text-orange-300"
                @click="askDelete(p)"
              >
                <Trash2 class="mr-1 size-3" />
                删除
              </el-button>
            </div>
          </li>
        </ul>

        <div class="mt-3 flex flex-wrap gap-2 border-t border-white/10 pt-3">
          <el-button
            size="small"
            class="!h-7 border border-white/10 bg-transparent !text-[10px] text-slate-300"
            @click="handleExportAll"
          >
            <Download class="mr-1 size-3" />
            全部导出 (JSON)
          </el-button>
          <el-button
            size="small"
            class="!h-7 border border-cyan-500/40 bg-cyan-500/10 !text-[10px] text-cyan-100"
            @click="handleImportClick"
          >
            <Upload class="mr-1 size-3" />
            导入程序
          </el-button>
          <input
            ref="fileInputRef"
            type="file"
            :accept="GCODE_FILE_ACCEPT"
            class="hidden"
            @change="handleImportFile"
          />
        </div>
      </section>

      <section class="rounded-lg border border-white/10 bg-black/30 p-3">
        <div class="mb-2 flex items-center gap-2">
          <Plus class="size-3.5 text-cyan-400" />
          <span class="text-[11px] font-semibold uppercase tracking-wide text-slate-300">
            插入代码片段
          </span>
        </div>
        <el-select
          v-model="snippetCategory"
          size="small"
          class="mb-2 w-full"
          placeholder="分类"
        >
          <el-option
            v-for="c in SNIPPET_CATEGORIES"
            :key="c.id"
            :label="c.label"
            :value="c.id"
          />
        </el-select>

        <ul class="space-y-1.5">
          <li v-for="s in visibleSnippets" :key="s.id">
            <button
              type="button"
              class="w-full rounded-md border border-white/10 bg-white/[0.02] px-2.5 py-2 text-left transition-colors hover:border-cyan-500/40 hover:bg-cyan-500/[0.06]"
              @click="handleInsertSnippet(s)"
            >
              <div class="flex items-center gap-2">
                <span class="rounded bg-cyan-500/15 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-cyan-300">
                  {{ SNIPPET_CATEGORY_LABEL[s.category] ?? s.category }}
                </span>
                <span class="truncate text-xs font-medium text-slate-100">
                  {{ s.name }}
                </span>
                <Plus class="ml-auto size-3 shrink-0 text-slate-500" />
              </div>
              <p class="mt-1 line-clamp-2 text-[10px] leading-snug text-slate-500">
                {{ s.description }}
              </p>
            </button>
          </li>
        </ul>
      </section>
    </div>

    <el-dialog
      v-model="deleteVisible"
      title="删除程序？"
      width="400px"
      class="cnc-dialog"
      @closed="deleteTarget = null"
    >
      <p class="text-slate-400">
        将永久从本地程序库移除
        <span class="font-medium text-orange-300">「{{ deleteTarget?.name }}」</span>
        。此操作无法撤销。
      </p>
      <template #footer>
        <el-button @click="deleteVisible = false">取消</el-button>
        <el-button type="warning" @click="confirmDelete">
          <Trash2 class="mr-1 size-3.5" />
          删除
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
