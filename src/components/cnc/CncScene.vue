<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, shallowRef } from "vue";
import { TresCanvas } from "@tresjs/core";
import type { TresContext } from "@tresjs/core";
import type { PerspectiveCamera } from "three";
import SceneContents from "./SceneContents.vue";

const host = shallowRef<HTMLElement | null>(null);
const canvasRef = shallowRef<{ context?: TresContext } | null>(null);
const ready = ref(false);
const sceneKey = ref(0);
let ro: ResizeObserver | null = null;

function forceResize() {
  const ctx = canvasRef.value?.context;
  const hostEl = host.value;
  if (!ctx?.renderer?.value || !hostEl) return;
  const w = hostEl.clientWidth;
  const h = hostEl.clientHeight;
  if (w < 2 || h < 2) return;
  const renderer = ctx.renderer.value;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h, true);
  const cam = ctx.camera.value as PerspectiveCamera | undefined;
  if (cam && typeof cam.updateProjectionMatrix === "function") {
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
  }
  ctx.invalidate();
}

function tryReady() {
  const el = host.value;
  if (!el) return;
  if (el.clientWidth > 2 && el.clientHeight > 2) {
    ready.value = true;
    nextTick(() => {
      forceResize();
      requestAnimationFrame(forceResize);
    });
  }
}

function onCanvasReady() {
  forceResize();
  setTimeout(forceResize, 50);
  setTimeout(forceResize, 200);
}

onMounted(async () => {
  await nextTick();
  tryReady();
  ro = new ResizeObserver(() => {
    if (!ready.value) tryReady();
    else forceResize();
  });
  if (host.value) ro.observe(host.value);
  requestAnimationFrame(() => tryReady());
  setTimeout(tryReady, 80);
});

onUnmounted(() => {
  ro?.disconnect();
  ro = null;
});
</script>

<template>
  <div ref="host" class="cnc-scene-host">
    <TresCanvas
      v-if="ready"
      :key="sceneKey"
      ref="canvasRef"
      :shadows="true"
      :dpr="[1, 2]"
      :antialias="true"
      :preserve-drawing-buffer="true"
      :window-size="false"
      clear-color="#0b0d10"
      class="cnc-tres-canvas"
      @ready="onCanvasReady"
    >
      <TresPerspectiveCamera
        :position="[230, 190, 250]"
        :fov="38"
        :near="1"
        :far="6000"
      />
      <TresFog :args="['#0b0d10', 1400, 3200]" />
      <SceneContents />
    </TresCanvas>
    <div v-else class="cnc-scene-boot">正在初始化 3D 视口…</div>
  </div>
</template>

<style scoped>
.cnc-scene-host {
  width: 100%;
  height: 100%;
  min-height: 200px;
  position: relative;
  overflow: hidden;
  background: #0b0d10;
}
.cnc-tres-canvas {
  display: block !important;
  width: 100% !important;
  height: 100% !important;
}
.cnc-scene-boot {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 12px;
  font-family: ui-monospace, monospace;
}
</style>
