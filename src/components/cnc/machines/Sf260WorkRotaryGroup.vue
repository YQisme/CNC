<script setup lang="ts">
/** 工件 / 刀路随 A、C 转台运动的包裹层 */
import { computed, shallowRef } from "vue";
import * as THREE from "three";
import { useLoop } from "@tresjs/core";
import { useSimStore } from "@/stores/sim";

const sim = useSimStore();
const aRef = shallowRef<THREE.Group | null>(null);
const cRef = shallowRef<THREE.Group | null>(null);

const cx = computed(() =>
  sim.originDatum === "front_left" ? sim.workpiece.width / 2 : 0,
);
const cz = computed(() =>
  sim.originDatum === "front_left" ? -sim.workpiece.depth / 2 : 0,
);

const { onBeforeRender } = useLoop();
onBeforeRender(() => {
  const { a, c } = sim.rotary;
  if (aRef.value) aRef.value.rotation.x = THREE.MathUtils.degToRad(a);
  if (cRef.value) cRef.value.rotation.y = THREE.MathUtils.degToRad(c);
});
</script>

<template>
  <TresGroup :position="[cx, 0, cz]">
    <TresGroup ref="aRef">
      <TresGroup ref="cRef">
        <TresGroup :position="[-cx, 0, -cz]">
          <slot />
        </TresGroup>
      </TresGroup>
    </TresGroup>
  </TresGroup>
</template>
