<script setup lang="ts">
/**
 * 钻孔孔壁可视化：锐边圆柱孔 + 钻尖锥底，随仿真进度加深。
 */
import { computed, shallowRef, watch } from "vue";
import * as THREE from "three";
import { useLoop } from "@tresjs/core";
import { useSimStore } from "@/stores/sim";
import { extractDrillHoles, type DrillHoleSpec } from "@/lib/cnc/carve";
import { getMaterialById } from "@/lib/cnc/materials";
import { sampleMove } from "@/lib/cnc/parser";
import type { Move } from "@/lib/cnc/types";

const props = defineProps<{
  stockHeight: number;
}>();

const sim = useSimStore();

function holeProgressDepth(
  hole: DrillHoleSpec,
  moveIndex: number,
  t: number,
  moves: Move[],
): number {
  if (moveIndex < 0) return 0;
  let deepest = 0;
  for (const m of moves) {
    if (m.index > moveIndex) break;
    if (m.type !== "linear") continue;
    if (Math.hypot(m.to.x - hole.x, m.to.y - hole.y) > hole.radius * 0.6)
      continue;
    const horiz = Math.hypot(m.to.x - m.from.x, m.to.y - m.from.y);
    if (horiz > hole.radius) continue;
    let z = m.to.z;
    if (m.index === moveIndex && t < 1) {
      z = sampleMove(m, t).z;
    }
    if (z < deepest) deepest = z;
  }
  return deepest;
}

const mat = computed(() => getMaterialById(sim.materialId));
const wallMat = computed(
  () =>
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(mat.value.sideColor).offsetHSL(0, -0.05, -0.12),
      roughness: 0.55,
      metalness: mat.value.metalness * 0.7,
      side: THREE.DoubleSide,
    }),
);
const floorMat = computed(
  () =>
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(mat.value.color).offsetHSL(0.02, 0.05, 0.12),
      roughness: 0.35,
      metalness: mat.value.metalness,
      side: THREE.DoubleSide,
    }),
);

const holes = computed(() => {
  if (!sim.parseResult || sim.machineMode !== "run") return [] as DrillHoleSpec[];
  return extractDrillHoles(sim.parseResult.moves);
});

type BoreRefs = {
  wall: THREE.Mesh | null;
  cone: THREE.Mesh | null;
  lip: THREE.Mesh | null;
};
const boreRefs = shallowRef<BoreRefs[]>([]);

watch(
  holes,
  (list) => {
    boreRefs.value = list.map(() => ({ wall: null, cone: null, lip: null }));
  },
  { immediate: true },
);

function asMesh(el: unknown): THREE.Mesh | null {
  if (!el) return null;
  if (el instanceof THREE.Mesh) return el;
  const any = el as { isMesh?: boolean; object?: THREE.Object3D };
  if (any.isMesh) return el as THREE.Mesh;
  if (any.object instanceof THREE.Mesh) return any.object;
  return null;
}
function setLip(i: number, el: unknown) {
  if (!boreRefs.value[i]) boreRefs.value[i] = { wall: null, cone: null, lip: null };
  boreRefs.value[i].lip = asMesh(el);
}
function setWall(i: number, el: unknown) {
  if (!boreRefs.value[i]) boreRefs.value[i] = { wall: null, cone: null, lip: null };
  boreRefs.value[i].wall = asMesh(el);
}
function setCone(i: number, el: unknown) {
  if (!boreRefs.value[i]) boreRefs.value[i] = { wall: null, cone: null, lip: null };
  boreRefs.value[i].cone = asMesh(el);
}

function tipHFor(hole: DrillHoleSpec) {
  const half = THREE.MathUtils.degToRad(hole.pointAngle / 2);
  return Math.max(hole.radius * 0.55, hole.radius / Math.tan(half));
}

const { onBeforeRender } = useLoop();
onBeforeRender(() => {
  if (!sim.parseResult || holes.value.length === 0) return;
  holes.value.forEach((hole, i) => {
    const refs = boreRefs.value[i];
    if (!refs?.wall) return;
    const tipZ = holeProgressDepth(
      hole,
      sim.currentMoveIndex,
      sim.currentT,
      sim.parseResult!.moves,
    );
    if (tipZ >= -0.05) {
      refs.wall.visible = false;
      if (refs.cone) refs.cone.visible = false;
      if (refs.lip) refs.lip.visible = false;
      return;
    }
    refs.wall.visible = true;
    if (refs.lip) refs.lip.visible = true;

    const tipH = tipHFor(hole);
    const cylBottom = Math.min(0, tipZ + tipH);
    const cylDepth = Math.max(0.15, -cylBottom);
    const through = tipZ <= -props.stockHeight + 0.2;

    refs.wall.scale.set(1, cylDepth, 1);
    refs.wall.position.y = -cylDepth / 2;

    if (refs.cone) {
      if (through) {
        refs.cone.visible = false;
      } else {
        refs.cone.visible = true;
        const coneH = Math.min(
          tipH,
          Math.max(0.2, -tipZ - cylDepth + tipH * 0.15),
        );
        refs.cone.scale.set(1, Math.max(0.05, coneH / tipH), 1);
        refs.cone.position.y = -cylDepth - coneH / 2;
      }
    }
  });
});
</script>

<template>
  <TresGroup v-if="holes.length > 0">
    <TresGroup
      v-for="(hole, i) in holes"
      :key="`${hole.x}_${hole.y}_${i}`"
      :position="[hole.x, 0, -hole.y]"
    >
      <TresMesh
        :ref="(el) => setLip(i, el)"
        :position="[0, -0.15, 0]"
        :rotation="[-Math.PI / 2, 0, 0]"
        :visible="false"
        :material="floorMat"
      >
        <TresRingGeometry :args="[hole.radius * 0.92, hole.radius * 1.12, 28]" />
      </TresMesh>
      <TresMesh
        :ref="(el) => setWall(i, el)"
        :visible="false"
        :cast-shadow="true"
        :receive-shadow="true"
        :material="wallMat"
      >
        <TresCylinderGeometry
          :args="[hole.radius * 0.98, hole.radius * 0.98, 1, 32, 1, true]"
        />
      </TresMesh>
      <TresMesh
        :ref="(el) => setCone(i, el)"
        :rotation="[Math.PI, 0, 0]"
        :visible="false"
        :material="floorMat"
      >
        <TresConeGeometry :args="[hole.radius * 0.98, tipHFor(hole), 28]" />
      </TresMesh>
    </TresGroup>
  </TresGroup>
</template>
