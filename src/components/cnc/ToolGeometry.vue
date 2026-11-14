<script setup lang="ts">
import { onBeforeUnmount, shallowRef, watch } from "vue";
import * as THREE from "three";
import type { CncTool } from "@/lib/cnc/tools";
import { buildToolGeometry } from "./toolGeometryBuild";

const props = defineProps<{
  tool: CncTool;
  toolLen: number;
  mat: THREE.Material;
}>();

const rootRef = shallowRef<THREE.Group | null>(null);
let built: THREE.Group | null = null;

function rebuild() {
  const root = rootRef.value;
  if (!root) return;
  if (built) {
    root.remove(built);
    built.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.geometry?.dispose();
        // 不 dispose 传入的 mat
        if (m.material && m.material !== props.mat) {
          const mats = Array.isArray(m.material) ? m.material : [m.material];
          for (const mat of mats) {
            if (mat !== props.mat) mat.dispose();
          }
        }
      }
    });
    built = null;
  }
  built = buildToolGeometry(props.tool, props.toolLen, props.mat);
  root.add(built);
}

watch(
  () => [rootRef.value, props.tool, props.toolLen, props.mat] as const,
  () => rebuild(),
  { flush: "post" },
);

onBeforeUnmount(() => {
  if (built && rootRef.value) rootRef.value.remove(built);
  built = null;
});
</script>

<template>
  <TresGroup ref="rootRef" />
</template>
