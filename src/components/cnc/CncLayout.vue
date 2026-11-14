<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import {
  Terminal,
  BookOpen,
  Wrench,
  GraduationCap,
  Layers,
  Calculator,
  FolderOpen,
} from "lucide-vue-next";
import { useViewStore } from "@/stores/view";
import { useIsMobile } from "@/hooks/useMobile";
import ControlBar from "./ControlBar.vue";
import ProgramPanel from "./ProgramPanel.vue";
import ProgramManager from "./ProgramManager.vue";
import ToolManager from "./ToolManager.vue";
import MaterialPanel from "./MaterialPanel.vue";
import FeedsCalculator from "./FeedsCalculator.vue";
import CodeReference from "./CodeReference.vue";
import GuidePanel from "./GuidePanel.vue";
import SceneOverlay from "./SceneOverlay.vue";
import CncScene from "./CncScene.vue";

const view = useViewStore();
const isMobile = useIsMobile();
const activeTab = ref("program");

const layoutKey = computed(() =>
  isMobile.value ? "cnc-main-vertical" : "cnc-main-horizontal",
);

/** viewport share 0..1 */
const viewportRatio = ref(0.55);

function loadRatio() {
  try {
    const raw = localStorage.getItem(layoutKey.value);
    if (!raw) {
      viewportRatio.value = isMobile.value ? 0.5 : 0.55;
      return;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed === "number" && parsed > 0.2 && parsed < 0.85) {
      viewportRatio.value = parsed;
      return;
    }
    if (Array.isArray(parsed) && parsed.length >= 1) {
      const a = parsed[0];
      if (typeof a === "number" && a > 0 && a < 1) {
        viewportRatio.value = a;
        return;
      }
      if (typeof a === "string" && a.endsWith("%")) {
        const n = parseFloat(a);
        if (n > 20 && n < 85) {
          viewportRatio.value = n / 100;
          return;
        }
      }
    }
  } catch {
    /* ignore */
  }
  viewportRatio.value = isMobile.value ? 0.5 : 0.55;
}

loadRatio();
watch(isMobile, () => loadRatio());

function persistRatio() {
  try {
    localStorage.setItem(layoutKey.value, JSON.stringify(viewportRatio.value));
  } catch {
    /* ignore */
  }
}

const splitRoot = ref<HTMLElement | null>(null);
const dragging = ref(false);

function onPointerDown(e: PointerEvent) {
  dragging.value = true;
  (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  e.preventDefault();
}

function onPointerMove(e: PointerEvent) {
  if (!dragging.value || !splitRoot.value) return;
  const rect = splitRoot.value.getBoundingClientRect();
  let ratio: number;
  if (isMobile.value) {
    ratio = (e.clientY - rect.top) / rect.height;
  } else {
    ratio = (e.clientX - rect.left) / rect.width;
  }
  const min = isMobile.value ? 0.25 : 0.4;
  const max = isMobile.value ? 0.75 : 0.8;
  viewportRatio.value = Math.min(max, Math.max(min, ratio));
}

function onPointerUp() {
  if (!dragging.value) return;
  dragging.value = false;
  persistRatio();
}

onMounted(() => {
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
});
onUnmounted(() => {
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerup", onPointerUp);
});

const viewportStyle = computed(() =>
  isMobile.value
    ? { height: `${viewportRatio.value * 100}%`, width: "100%" }
    : { width: `${viewportRatio.value * 100}%`, height: "100%" },
);

const sidebarStyle = computed(() =>
  isMobile.value
    ? { height: `${(1 - viewportRatio.value) * 100}%`, width: "100%" }
    : { width: `${(1 - viewportRatio.value) * 100}%`, height: "100%" },
);
</script>

<template>
  <div class="cnc-layout">
    <div class="control-rail">
      <ControlBar />
    </div>

    <div
      ref="splitRoot"
      class="split-root"
      :class="isMobile ? 'vertical' : 'horizontal'"
    >
      <div class="viewport-pane" :style="viewportStyle">
        <div class="viewport-wrap">
          <CncScene :key="view.resetKey" />
          <SceneOverlay />
        </div>
      </div>

      <div
        class="split-handle"
        :class="{ dragging }"
        @pointerdown="onPointerDown"
      />

      <div class="sidebar-pane" :style="sidebarStyle">
        <el-tabs v-model="activeTab" class="cnc-tabs">
          <el-tab-pane name="program">
            <template #label>
              <span class="tab-label">
                <Terminal class="h-3 w-3 text-cyan-400" /> 程序
              </span>
            </template>
            <ProgramPanel />
          </el-tab-pane>
          <el-tab-pane name="library" lazy>
            <template #label>
              <span class="tab-label">
                <FolderOpen class="h-3 w-3 text-amber-400" /> 程序库
              </span>
            </template>
            <ProgramManager />
          </el-tab-pane>
          <el-tab-pane name="tools" lazy>
            <template #label>
              <span class="tab-label">
                <Wrench class="h-3 w-3 text-purple-400" /> 刀具
              </span>
            </template>
            <ToolManager />
          </el-tab-pane>
          <el-tab-pane name="materials" lazy>
            <template #label>
              <span class="tab-label">
                <Layers class="h-3 w-3 text-emerald-400" /> 材料
              </span>
            </template>
            <MaterialPanel />
          </el-tab-pane>
          <el-tab-pane name="feeds" lazy>
            <template #label>
              <span class="tab-label">
                <Calculator class="h-3 w-3 text-pink-400" /> 进给
              </span>
            </template>
            <FeedsCalculator />
          </el-tab-pane>
          <el-tab-pane name="reference" lazy>
            <template #label>
              <span class="tab-label">
                <BookOpen class="h-3 w-3 text-blue-400" /> 参考手册
              </span>
            </template>
            <CodeReference />
          </el-tab-pane>
          <el-tab-pane name="guide" lazy>
            <template #label>
              <span class="tab-label">
                <GraduationCap class="h-3 w-3 text-rose-400" /> 指南
              </span>
            </template>
            <GuidePanel />
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cnc-layout {
  display: flex;
  flex-direction: row;
  height: 100%;
  width: 100%;
  min-height: 0;
  overflow: hidden;
}
.control-rail {
  width: 16rem;
  flex-shrink: 0;
  height: 100%;
  overflow-y: auto;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(to bottom, #15181d, #0d0f13);
  scrollbar-width: thin;
}
.split-root {
  flex: 1;
  min-width: 0;
  min-height: 0;
  height: 100%;
  display: flex;
}
.split-root.horizontal {
  flex-direction: row;
}
.split-root.vertical {
  flex-direction: column;
}
.viewport-pane,
.sidebar-pane {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
.viewport-wrap {
  position: relative;
  height: 100%;
  width: 100%;
  background: #0b0d10;
}
.viewport-wrap :deep(canvas) {
  width: 100% !important;
  height: 100% !important;
  display: block;
}
.split-handle {
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.05);
  z-index: 5;
}
.split-root.horizontal > .split-handle {
  width: 6px;
  cursor: col-resize;
}
.split-root.vertical > .split-handle {
  height: 6px;
  cursor: row-resize;
}
.split-handle:hover,
.split-handle.dragging {
  background: rgba(34, 211, 238, 0.4);
}
.sidebar-pane {
  display: flex;
  flex-direction: column;
  background: #0b0d10;
}
.cnc-tabs {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  --el-tabs-header-height: auto;
}
.tab-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
}
.cnc-tabs :deep(.el-tabs__header) {
  margin: 0;
  background: #0d0f13;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 6px 8px;
}
.cnc-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}
.cnc-tabs :deep(.el-tabs__item) {
  height: auto;
  padding: 0 10px;
  color: #cbd5e1;
  border-radius: 6px;
}
.cnc-tabs :deep(.el-tabs__item.is-active) {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}
.cnc-tabs :deep(.el-tabs__active-bar) {
  display: none;
}
.cnc-tabs :deep(.el-tabs__content) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.cnc-tabs :deep(.el-tab-pane) {
  height: 100%;
  overflow: hidden;
}
</style>
