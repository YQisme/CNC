<script setup lang="ts">
/**
 * SF-260H 摇篮式 A/C 双转台 — 仿实机 DD 转台结构
 */
import { shallowRef } from "vue";
import * as THREE from "three";
import { useLoop } from "@tresjs/core";
import { useSimStore } from "@/stores/sim";

const props = defineProps<{
  cx: number;
  cz: number;
  tableTopY: number;
  tableMat: THREE.Material;
  cradleMat: THREE.Material;
  accentMat: THREE.Material;
}>();

const sim = useSimStore();
const aRef = shallowRef<THREE.Group | null>(null);
const cRef = shallowRef<THREE.Group | null>(null);

const steelMat = new THREE.MeshStandardMaterial({
  color: "#8b939e",
  roughness: 0.28,
  metalness: 0.92,
});
const tableTopMat = new THREE.MeshStandardMaterial({
  color: "#9aa3ad",
  roughness: 0.2,
  metalness: 0.96,
});
const castDark = new THREE.MeshStandardMaterial({
  color: "#2a3038",
  roughness: 0.55,
  metalness: 0.55,
});
const slotMat = new THREE.MeshStandardMaterial({
  color: "#151a20",
  roughness: 0.75,
  metalness: 0.35,
});
const clampMat = new THREE.MeshStandardMaterial({
  color: "#3d4450",
  roughness: 0.32,
  metalness: 0.88,
});
const sealMat = new THREE.MeshStandardMaterial({
  color: "#1a1f26",
  roughness: 0.9,
  metalness: 0.15,
});

const { onBeforeRender } = useLoop();
onBeforeRender(() => {
  const { a, c } = sim.rotary;
  if (aRef.value) aRef.value.rotation.x = THREE.MathUtils.degToRad(a);
  if (cRef.value) cRef.value.rotation.y = THREE.MathUtils.degToRad(c);
});

const pivotY = () => props.tableTopY - 12;
const plateH = 16;
const tableR = 62;
const armSpan = 86;

const tickMarks = Array.from({ length: 36 }, (_, i) => {
  const deg = i * 10;
  const ang = THREE.MathUtils.degToRad(deg);
  const major = deg % 90 === 0;
  const mid = deg % 30 === 0;
  return {
    deg,
    ang,
    major,
    mid,
    len: major ? 5.5 : mid ? 3.5 : 2,
  };
});

const clamps = [
  { x: -50, z: -40, rot: 0.3 },
  { x: 50, z: -40, rot: -0.3 },
  { x: -50, z: 40, rot: -0.3 },
  { x: 50, z: 40, rot: 0.3 },
];

const baseBolts = ([-88, 88] as const).flatMap((x) =>
  ([-48, 48] as const).map((z) => [x, z] as const),
);
</script>

<template>
  <TresGroup :position="[cx, 0, cz]" name="Trunnion_AC">
    <TresMesh
      :position="[0, tableTopY - 52, 0]"
      cast-shadow
      receive-shadow
      :material="cradleMat"
    >
      <TresBoxGeometry :args="[210, 14, 120]" />
    </TresMesh>
    <TresMesh
      :position="[0, tableTopY - 44, 0]"
      cast-shadow
      receive-shadow
      :material="castDark"
    >
      <TresBoxGeometry :args="[198, 6, 108]" />
    </TresMesh>
    <TresMesh
      v-for="([x, z], i) in baseBolts"
      :key="i"
      :position="[x, tableTopY - 44.5, z]"
      :material="steelMat"
    >
      <TresCylinderGeometry :args="[3.2, 3.2, 5, 10]" />
    </TresMesh>

    <TresGroup
      v-for="side in [-1, 1]"
      :key="side"
      :position="[side * armSpan, pivotY(), 0]"
    >
      <TresMesh
        :position="[side * 4, -8, 0]"
        cast-shadow
        receive-shadow
        :material="cradleMat"
      >
        <TresBoxGeometry :args="[28, 64, 78]" />
      </TresMesh>
      <TresMesh :position="[side * 4, -18, 28]" cast-shadow :material="castDark">
        <TresBoxGeometry :args="[22, 36, 8]" />
      </TresMesh>
      <TresMesh :position="[side * 4, -18, -28]" cast-shadow :material="castDark">
        <TresBoxGeometry :args="[22, 36, 8]" />
      </TresMesh>
      <TresMesh :rotation="[0, 0, Math.PI / 2]" cast-shadow :material="steelMat">
        <TresCylinderGeometry :args="[22, 22, 16, 36]" />
      </TresMesh>
      <TresMesh
        :rotation="[0, 0, Math.PI / 2]"
        :position="[side * -2, 0, 0]"
        :material="tableMat"
      >
        <TresCylinderGeometry :args="[16, 16, 6, 32]" />
      </TresMesh>
      <TresMesh
        v-for="i in 8"
        :key="i"
        :position="[
          side * -6,
          Math.cos(((i - 1) / 8) * Math.PI * 2) * 18,
          Math.sin(((i - 1) / 8) * Math.PI * 2) * 18,
        ]"
        :rotation="[0, 0, Math.PI / 2]"
        :material="steelMat"
      >
        <TresCylinderGeometry :args="[1.4, 1.4, 3, 8]" />
      </TresMesh>
      <template v-if="side < 0">
        <TresGroup :position="[side * 22, 0, 0]">
          <TresMesh :rotation="[0, 0, Math.PI / 2]" cast-shadow :material="castDark">
            <TresCylinderGeometry :args="[18, 20, 28, 28]" />
          </TresMesh>
          <TresMesh
            :position="[side * 16, 0, 0]"
            :rotation="[0, 0, Math.PI / 2]"
            :material="accentMat"
          >
            <TresCylinderGeometry :args="[14, 14, 6, 24]" />
          </TresMesh>
          <TresMesh :position="[side * 10, 14, 0]" :material="castDark">
            <TresBoxGeometry :args="[10, 8, 16]" />
          </TresMesh>
        </TresGroup>
      </template>
      <template v-else>
        <TresGroup :position="[side * 18, 0, 0]">
          <TresMesh :rotation="[0, 0, Math.PI / 2]" cast-shadow :material="castDark">
            <TresCylinderGeometry :args="[12, 14, 18, 24]" />
          </TresMesh>
          <TresMesh
            :position="[side * 10, 0, 0]"
            :rotation="[0, 0, Math.PI / 2]"
            :material="steelMat"
          >
            <TresCylinderGeometry :args="[8, 8, 4, 16]" />
          </TresMesh>
        </TresGroup>
      </template>
      <TresMesh :position="[side * 2, -36, 0]" cast-shadow :material="cradleMat">
        <TresBoxGeometry :args="[32, 12, 86]" />
      </TresMesh>
    </TresGroup>

    <TresGroup ref="aRef" :position="[0, pivotY(), 0]" name="A_Cradle">
      <TresMesh
        v-for="side in [-1, 1]"
        :key="'ax_' + side"
        :position="[side * (armSpan - 10), 0, 0]"
        :rotation="[0, 0, Math.PI / 2]"
        cast-shadow
        :material="steelMat"
      >
        <TresCylinderGeometry :args="[10, 10, 22, 24]" />
      </TresMesh>
      <TresGroup
        v-for="side in [-1, 1]"
        :key="'arm_' + side"
        :position="[side * 52, -6, 0]"
      >
        <TresMesh cast-shadow receive-shadow :material="cradleMat">
          <TresBoxGeometry :args="[18, 28, 70]" />
        </TresMesh>
        <TresMesh :position="[0, 8, 0]" cast-shadow :material="castDark">
          <TresBoxGeometry :args="[14, 10, 58]" />
        </TresMesh>
        <TresMesh
          :position="[0, -2, 28]"
          :rotation="[Math.PI / 2, 0, 0]"
          :material="cradleMat"
        >
          <TresCylinderGeometry :args="[8, 8, 14, 16]" />
        </TresMesh>
        <TresMesh
          :position="[0, -2, -28]"
          :rotation="[Math.PI / 2, 0, 0]"
          :material="cradleMat"
        >
          <TresCylinderGeometry :args="[8, 8, 14, 16]" />
        </TresMesh>
      </TresGroup>
      <TresMesh :position="[0, -22, 0]" cast-shadow receive-shadow :material="cradleMat">
        <TresBoxGeometry :args="[108, 12, 78]" />
      </TresMesh>
      <TresMesh :position="[0, -16, 0]" cast-shadow :material="castDark">
        <TresCylinderGeometry :args="[48, 52, 8, 40]" />
      </TresMesh>
      <TresMesh :position="[0, -32, 0]" cast-shadow :material="castDark">
        <TresCylinderGeometry :args="[36, 38, 18, 36]" />
      </TresMesh>
      <TresMesh :position="[0, -42, 0]" cast-shadow :material="tableMat">
        <TresCylinderGeometry :args="[28, 30, 8, 28]" />
      </TresMesh>
      <TresMesh :position="[-40, -28, 36]" cast-shadow :material="castDark">
        <TresBoxGeometry :args="[24, 10, 12]" />
      </TresMesh>

      <TresGroup
        ref="cRef"
        :position="[0, tableTopY - pivotY(), 0]"
        name="C_Table"
      >
        <TresMesh
          :position="[0, -plateH - 7, 0]"
          cast-shadow
          receive-shadow
          :material="steelMat"
        >
          <TresCylinderGeometry :args="[tableR + 6, tableR + 10, 10, 48]" />
        </TresMesh>
        <TresMesh
          :position="[0, -plateH - 1.5, 0]"
          :rotation="[-Math.PI / 2, 0, 0]"
          :material="sealMat"
        >
          <TresTorusGeometry :args="[tableR + 2, 1.6, 8, 48]" />
        </TresMesh>
        <TresMesh
          :position="[0, -plateH / 2, 0]"
          cast-shadow
          receive-shadow
          :material="tableTopMat"
        >
          <TresCylinderGeometry :args="[tableR, tableR, plateH, 48]" />
        </TresMesh>
        <TresMesh :position="[0, 0.15, 0]" receive-shadow>
          <TresCylinderGeometry :args="[tableR - 1, tableR - 1, 0.4, 48]" />
          <TresMeshStandardMaterial color="#b0b8c2" :roughness="0.16" :metalness="0.98" />
        </TresMesh>
        <TresGroup
          v-for="z in [-42, -28, -14, 0, 14, 28, 42]"
          :key="z"
          :position="[0, 0.35, z]"
        >
          <TresMesh :material="slotMat">
            <TresBoxGeometry :args="[tableR * 1.7, 2.4, 4.2]" />
          </TresMesh>
          <TresMesh :position="[0, -1.4, 0]" :material="slotMat">
            <TresBoxGeometry :args="[tableR * 1.7, 1.8, 7.5]" />
          </TresMesh>
        </TresGroup>
        <TresMesh :position="[0, 0.4, 0]" :material="slotMat">
          <TresCylinderGeometry :args="[8, 8, 1.2, 24]" />
        </TresMesh>
        <TresMesh :position="[0, -4, 0]" :material="steelMat">
          <TresCylinderGeometry :args="[6, 7.5, 10, 20]" />
        </TresMesh>
        <TresMesh
          :position="[0, 0.55, 0]"
          :rotation="[-Math.PI / 2, 0, 0]"
          :material="accentMat"
        >
          <TresTorusGeometry :args="[tableR - 3, 0.55, 8, 64]" />
        </TresMesh>
        <TresMesh
          v-for="t in tickMarks"
          :key="t.deg"
          :position="[
            Math.cos(t.ang) * (tableR - 5),
            0.7,
            Math.sin(t.ang) * (tableR - 5),
          ]"
          :rotation="[0, -t.ang, 0]"
        >
          <TresBoxGeometry :args="[t.len, 0.6, t.major ? 1.3 : 0.7]" />
          <TresMeshStandardMaterial
            :color="t.major ? '#f8fafc' : '#cbd5e1'"
            :roughness="0.35"
            :metalness="0.6"
          />
        </TresMesh>
        <TresMesh
          :position="[0, -2.5, 0]"
          :rotation="[-Math.PI / 2, 0, 0]"
          :material="sealMat"
        >
          <TresTorusGeometry :args="[tableR + 1, 2.2, 10, 48]" />
        </TresMesh>
        <TresGroup
          v-for="(p, i) in clamps"
          :key="i"
          :position="[p.x, 0, p.z]"
          :rotation="[0, p.rot, 0]"
        >
          <TresMesh :position="[0, 2.8, 0]" cast-shadow :material="clampMat">
            <TresBoxGeometry :args="[16, 5.5, 10]" />
          </TresMesh>
          <TresMesh :position="[0, 6.5, 0]" cast-shadow :material="steelMat">
            <TresCylinderGeometry :args="[2.4, 2.4, 4, 12]" />
          </TresMesh>
          <TresMesh :position="[0, 9, 0]" :material="steelMat">
            <TresCylinderGeometry :args="[3.2, 3.2, 1.6, 6]" />
          </TresMesh>
          <TresMesh
            :position="[i % 2 === 0 ? 9 : -9, 1.0, 0]"
            cast-shadow
            :material="clampMat"
          >
            <TresBoxGeometry :args="[16, 2, 8]" />
          </TresMesh>
        </TresGroup>
      </TresGroup>
    </TresGroup>
  </TresGroup>
</template>
