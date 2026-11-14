<script setup lang="ts">
import { shallowRef, toRef } from "vue";
import * as THREE from "three";
import { useLoop } from "@tresjs/core";

const props = defineProps<{
  offset: readonly [number, number, number];
  amount: number;
  name?: string;
}>();

const groupRef = shallowRef<THREE.Group | null>(null);
const t = shallowRef(0);
const amountRef = toRef(props, "amount");

const { onBeforeRender } = useLoop();
onBeforeRender(({ delta }) => {
  t.value = THREE.MathUtils.damp(t.value, amountRef.value, 14, delta);
  const g = groupRef.value;
  if (!g) return;
  const a = t.value;
  const o = props.offset;
  g.position.set(o[0] * a, o[1] * a, o[2] * a);
});
</script>

<template>
  <TresGroup ref="groupRef" :name="name">
    <slot />
  </TresGroup>
</template>
