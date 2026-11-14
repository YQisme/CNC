<script setup lang="ts">
/**
 * SF-260H 整机外形 — TresGroup 壳 + 命令式 mesh 树
 * showEnclosure=true 门关；false 门向右滑开。
 */
import { computed, onBeforeUnmount, shallowRef, watch } from "vue";
import * as THREE from "three";
import { useLoop } from "@tresjs/core";
import { useSimStore } from "@/stores/sim";
import { useViewStore } from "@/stores/view";
import { explodeAmounts } from "./explodeAmounts";
import {
  applyExteriorGhost,
  buildSf260Exterior,
  type ExteriorHandles,
} from "./sf260ExteriorBuild";

const props = defineProps<{
  cx: number;
  cz: number;
  baseTopY: number;
}>();

const view = useViewStore();
const sim = useSimStore();

const hostRef = shallowRef<THREE.Group | null>(null);
const handles = shallowRef<ExteriorHandles | null>(null);
const openAmt = { current: view.showEnclosure ? 0 : 1 };
const ghostAmt = { current: sim.playing ? 1 : 0 };
const slide = 168 * 0.9;

const shellAmt = computed(() => explodeAmounts(view.explodeAmount, true).shell);
const shellDamp = { current: 0 };

function rebuild() {
  const host = hostRef.value;
  if (!host) return;
  if (handles.value) {
    host.remove(handles.value.root);
    handles.value.dispose();
    handles.value = null;
  }
  const h = buildSf260Exterior(props.cx, props.cz, props.baseTopY);
  host.add(h.root);
  h.setShellExplode(shellDamp.current);
  if (ghostAmt.current > 0.01) applyExteriorGhost(h.root, ghostAmt.current);
  h.door.position.x = openAmt.current * slide;
  handles.value = h;
}

watch(
  () => [hostRef.value, props.cx, props.cz, props.baseTopY] as const,
  () => rebuild(),
  { flush: "post" },
);

const { onBeforeRender } = useLoop();
onBeforeRender(({ delta }) => {
  const h = handles.value;
  if (!h) return;
  const target = view.showEnclosure ? 0 : 1;
  openAmt.current = THREE.MathUtils.damp(openAmt.current, target, 5.5, delta);
  h.door.position.x = openAmt.current * slide;

  shellDamp.current = THREE.MathUtils.damp(
    shellDamp.current,
    shellAmt.value,
    14,
    delta,
  );
  h.setShellExplode(shellDamp.current);

  const ghostTarget = sim.playing ? 1 : 0;
  const prevGhost = ghostAmt.current;
  ghostAmt.current = THREE.MathUtils.damp(ghostAmt.current, ghostTarget, 6, delta);
  if (
    Math.abs(ghostAmt.current - prevGhost) > 0.0005 ||
    Math.abs(ghostAmt.current - ghostTarget) > 0.001
  ) {
    applyExteriorGhost(h.root, ghostAmt.current);
  }
});

onBeforeUnmount(() => {
  const host = hostRef.value;
  if (handles.value) {
    if (host) host.remove(handles.value.root);
    handles.value.dispose();
    handles.value = null;
  }
});
</script>

<template>
  <TresGroup ref="hostRef" />
</template>
