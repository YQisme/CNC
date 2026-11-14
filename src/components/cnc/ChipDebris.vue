<script setup lang="ts">
/**
 * 切削废料 / 切屑粒子：切削时从刀尖飞溅，沉降到工作台面并堆积。
 * 需挂在与工件相同的坐标系（含 SF-260 转台旋转组）内。
 */
import { computed, shallowRef, watch } from "vue";
import * as THREE from "three";
import { useLoop } from "@tresjs/core";
import { useSimStore } from "@/stores/sim";
import { getMaterialById } from "@/lib/cnc/materials";

const props = defineProps<{
  /** 工作台顶面局部 Y（毛坯底面），切屑落点 */
  tableTopY: number;
}>();

const MAX_CHIPS = 900;
const SPAWN_PER_SEC = 52;

type Chip = {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  settled: boolean;
  size: number;
};

function makePool(n: number): Chip[] {
  return Array.from({ length: n }, () => ({
    active: false,
    x: 0,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    life: 0,
    settled: false,
    size: 0.6,
  }));
}

const sim = useSimStore();
const mat = computed(() => getMaterialById(sim.materialId));
const color = computed(() => new THREE.Color(mat.value.color));
const pool = makePool(MAX_CHIPS);
const spawnAcc = { current: 0 };
const meshRef = shallowRef<THREE.InstancedMesh | null>(null);
const dummy = new THREE.Object3D();

watch(
  () => [
    sim.exampleId,
    sim.source,
    sim.materialId,
    sim.workpiece.width,
    sim.workpiece.depth,
    sim.workpiece.height,
  ],
  () => {
    for (const c of pool) {
      c.active = false;
      c.settled = false;
    }
    spawnAcc.current = 0;
    if (meshRef.value) {
      meshRef.value.count = 0;
      meshRef.value.instanceMatrix.needsUpdate = true;
    }
  },
);

const { onBeforeRender } = useLoop();
onBeforeRender(({ delta }) => {
  const mesh = meshRef.value;
  if (!mesh) return;
  const dt = delta;

  const floorY = props.tableTopY + 0.35;
  const chips = pool;

  if (sim.playing && sim.isCutting && sim.spindleOn) {
    spawnAcc.current +=
      dt * SPAWN_PER_SEC * (sim.coolant === "flood" ? 0.75 : 1.1);
    while (spawnAcc.current >= 1) {
      spawnAcc.current -= 1;
      let slot = chips.find((c) => !c.active);
      if (!slot) slot = chips.find((c) => c.settled) ?? chips[0];

      const position = sim.position;
      const lx = position.x;
      const ly = position.z;
      const lz = -position.y;
      const spin = sim.spindleDir >= 0 ? 1 : -1;
      const speed = 16 + Math.random() * 30;
      const ang = Math.random() * Math.PI * 2;
      slot.active = true;
      slot.settled = false;
      slot.x = lx + (Math.random() - 0.5) * 2.2;
      slot.y = ly + 0.4;
      slot.z = lz + (Math.random() - 0.5) * 2.2;
      slot.vx = Math.cos(ang) * speed * spin * (0.35 + Math.random());
      slot.vy = 7 + Math.random() * 16;
      slot.vz = Math.sin(ang) * speed * (0.35 + Math.random());
      slot.life = 3 + Math.random() * 4;
      slot.size = 0.3 + Math.random() * 0.95;
    }
  } else {
    spawnAcc.current = 0;
  }

  const g = 58;
  let visible = 0;
  for (const c of chips) {
    if (!c.active) continue;
    if (!c.settled) {
      c.vy -= g * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.z += c.vz * dt;
      c.vx *= 1 - 1.15 * dt;
      c.vz *= 1 - 1.15 * dt;
      if (c.y <= floorY) {
        c.y = floorY + Math.random() * 0.4;
        c.vy *= -0.2;
        c.vx *= 0.5;
        c.vz *= 0.5;
        if (Math.abs(c.vy) < 2.2) {
          c.settled = true;
          c.vy = 0;
          c.vx = 0;
          c.vz = 0;
        }
      }
      c.life -= dt;
      if (c.life <= 0 && !c.settled) {
        c.active = false;
        continue;
      }
    }
    dummy.position.set(c.x, c.y, c.z);
    dummy.scale.setScalar(c.size);
    dummy.rotation.set(c.x * 0.15, c.z * 0.2, c.life);
    dummy.updateMatrix();
    mesh.setMatrixAt(visible, dummy.matrix);
    visible++;
  }
  mesh.count = visible;
  mesh.instanceMatrix.needsUpdate = true;
});
</script>

<template>
  <TresInstancedMesh
    ref="meshRef"
    :args="[undefined, undefined, MAX_CHIPS]"
    :frustum-culled="false"
  >
    <TresBoxGeometry :args="[1, 0.32, 0.5]" />
    <TresMeshStandardMaterial
      :color="color"
      :roughness="0.55"
      :metalness="mat.metalness * 0.85"
      :emissive="color"
      :emissive-intensity="0.07"
    />
  </TresInstancedMesh>
</template>
