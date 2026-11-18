<script setup lang="ts">
/**
 * 佳时特 SF-260H 五轴 — Vue + TresJS
 * 运动链：龙门 XYZ + 摇篮式 A/C；刀尖经正运动学落到世界坐标。
 */
import { computed, onBeforeUnmount, shallowRef, watch } from "vue";
import * as THREE from "three";
import { useLoop } from "@tresjs/core";
import { Edges } from "@tresjs/cientos";
import { useSimStore } from "@/stores/sim";
import { useViewStore } from "@/stores/view";
import { getToolByNumber, type CncTool } from "@/lib/cnc/tools";
import { workpieceToWorld } from "@/lib/cnc/kinematics";
import { setMachineExportRoot } from "@/lib/cnc/exportModel";
import Sf260Exterior from "./Sf260Exterior.vue";
import ExplodePart from "./ExplodePart.vue";
import { explodeAmounts } from "./explodeAmounts";
import { sf260InnerBounds } from "./sf260Layout";
import Sf260Trunnion from "./Sf260Trunnion.vue";
import ToolGeometry from "../ToolGeometry.vue";

const TOOL_FALLBACK: CncTool = {
  number: 1,
  isoCode: "ISO 1641",
  name: "立铣刀 Ø6",
  type: "end_mill",
  category: "铣削",
  diameter: 6,
  length: 20,
  flutes: 3,
  shankDiameter: 6,
  color: "#e8c878",
  surfaceSpeed: 250,
  chipLoad: 0.05,
  description: "默认立铣刀",
};

function metal(color: string, rough = 0.35, metalness = 0.9) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: rough,
    metalness: metalness,
  });
}

const sim = useSimStore();
const view = useViewStore();

const workpiece = computed(() => sim.workpiece);
const originDatum = computed(() => sim.originDatum);
const cx = computed(() =>
  originDatum.value === "front_left" ? workpiece.value.width / 2 : 0,
);
const cy = computed(() =>
  originDatum.value === "front_left" ? workpiece.value.depth / 2 : 0,
);
const cz = computed(() =>
  originDatum.value === "front_left" ? -workpiece.value.depth / 2 : 0,
);
const h = computed(() => workpiece.value.height);
const bridgeY = computed(() => h.value + 95);
const baseTopY = computed(() => -h.value - 22);
const inner = computed(() => sf260InnerBounds(baseTopY.value));
/** 床身/立柱落在内腔内，整体略偏后，避免顶到前门 */
const wOut = computed(() => inner.value.bedW);
const dOut = computed(() => inner.value.bedD);
const structZ = computed(() => inner.value.structZ);
const bedCenterY = computed(() => inner.value.y0 + 18);
const internalAmt = computed(
  () => explodeAmounts(view.explodeAmount, view.showShell).internal,
);

const toolDef = computed(
  () => getToolByNumber(sim.tool) ?? TOOL_FALLBACK,
);
const toolLen = computed(() =>
  Math.max(14, Math.min(36, toolDef.value.length)),
);

const castMat = metal("#3a4250", 0.48, 0.75);
const panelMat = metal("#d7dde6", 0.42, 0.35);
const darkMat = metal("#1f2430", 0.4, 0.85);
const railMat = metal("#9aa3b2", 0.25, 0.95);
const tableMat = metal("#5b6472", 0.45, 0.75);
const cradleMat = metal("#2f3642", 0.4, 0.8);
const quillMat = metal("#c5ccd6", 0.22, 0.95);
const blueMat = new THREE.MeshStandardMaterial({
  color: "#1d4ed8",
  roughness: 0.35,
  metalness: 0.55,
  emissive: "#1e3a8a",
  emissiveIntensity: 0.15,
});
const accentMat = new THREE.MeshStandardMaterial({
  color: "#38bdf8",
  roughness: 0.35,
  metalness: 0.5,
  emissive: "#0ea5e9",
  emissiveIntensity: 0.25,
});
const toolMat = computed(
  () =>
    new THREE.MeshStandardMaterial({
      color: toolDef.value.color,
      roughness: 0.25,
      metalness: 0.95,
      emissive: new THREE.Color(toolDef.value.color).multiplyScalar(0.15),
      emissiveIntensity: 0.4,
    }),
);

const rootRef = shallowRef<THREE.Group | null>(null);
const ySaddleRef = shallowRef<THREE.Group | null>(null);
const xCarriageRef = shallowRef<THREE.Group | null>(null);
const toolAssemblyRef = shallowRef<THREE.Group | null>(null);
const quillRef = shallowRef<THREE.Mesh | null>(null);
const toolRef = shallowRef<THREE.Group | null>(null);
const spinAccum = { current: 0 };
const worldTip = new THREE.Vector3();

watch(
  rootRef,
  (node) => {
    setMachineExportRoot(node);
  },
  { flush: "post" },
);
onBeforeUnmount(() => setMachineExportRoot(null));

const magazineSlots = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  return { i, x: Math.cos(a) * 22, z: Math.sin(a) * 22 };
});

const { onBeforeRender } = useLoop();
onBeforeRender(({ delta }) => {
  const pos = sim.position;
  const rotary = sim.rotary;
  workpieceToWorld(
    { x: pos.x - cx.value, y: pos.y - cy.value, z: pos.z },
    rotary,
    worldTip,
  );
  worldTip.x += cx.value;
  worldTip.z += cz.value;

  const wx = worldTip.x;
  const wy = worldTip.y;
  const wz = worldTip.z;

  if (ySaddleRef.value) ySaddleRef.value.position.z = wz;
  if (xCarriageRef.value) xCarriageRef.value.position.x = wx - cx.value;
  if (toolAssemblyRef.value) {
    toolAssemblyRef.value.position.y = wy - bridgeY.value;
  }
  const length = Math.max(8, bridgeY.value - wy - toolLen.value);
  if (quillRef.value) {
    quillRef.value.scale.y = length;
    quillRef.value.position.y = -length / 2;
  }
  if (toolRef.value && sim.spindleOn) {
    const visibleSpeed = Math.min(sim.spindleRpm, 6000) / 6000;
    spinAccum.current += delta * sim.spindleDir * (5 + visibleSpeed * 18);
    toolRef.value.rotation.y = spinAccum.current;
  }
});
</script>

<template>
  <TresGroup ref="rootRef" name="SF-260H_Machine">
    <!-- 外壳组：导出 GLB/OBJ 时归入 SF260_Shell，便于 Blender 整组编辑 -->
    <TresGroup name="SF260_Shell" :user-data="{ exportGroup: 'shell' }">
      <Sf260Exterior
        v-if="view.showShell"
        :cx="cx"
        :cz="cz"
        :base-top-y="baseTopY"
      />
    </TresGroup>

    <!-- 内部结构 / 摇篮 / 龙门：导出归入 SF260_Internal -->
    <TresGroup name="SF260_Internal" :user-data="{ exportGroup: 'internal' }">
      <TresGroup :position="[cx, 0, cz]" name="SF260_Structure">
        <ExplodePart :offset="[0, -35, 0]" :amount="internalAmt" name="Explode_Bed">
          <!-- 床身落在内腔中心（structZ），四周留墙距，不再顶出前门 -->
          <TresMesh
            :position="[0, bedCenterY, structZ]"
            receive-shadow
            cast-shadow
            name="Bed"
            :material="castMat"
          >
            <TresBoxGeometry :args="[wOut, 28, dOut]" />
          </TresMesh>
          <TresMesh
            :position="[0, bedCenterY + 20, structZ]"
            receive-shadow
            cast-shadow
            :material="darkMat"
          >
            <TresBoxGeometry :args="[wOut - 36, 16, dOut - 36]" />
          </TresMesh>
          <TresMesh
            :position="[-wOut / 2 + 26, bedCenterY + 48, structZ]"
            cast-shadow
            :material="castMat"
          >
            <TresBoxGeometry :args="[24, 56, dOut - 60]" />
          </TresMesh>
          <TresMesh
            :position="[wOut / 2 - 26, bedCenterY + 48, structZ]"
            cast-shadow
            :material="castMat"
          >
            <TresBoxGeometry :args="[24, 56, dOut - 60]" />
          </TresMesh>
        </ExplodePart>

        <ExplodePart
          v-for="side in [-1, 1]"
          :key="side"
          :offset="[side * 70, 10, -15]"
          :amount="internalAmt"
          :name="side < 0 ? 'Explode_Column_L' : 'Explode_Column_R'"
        >
          <!-- 立柱靠后墙内侧，完全在壳内 -->
          <TresGroup :position="[(wOut / 2 - 36) * side, 85, structZ - 36]">
            <TresMesh cast-shadow receive-shadow :material="panelMat">
              <TresBoxGeometry :args="[38, 200, 64]" />
            </TresMesh>
            <TresMesh :position="[side * -10, 0, 18]" :material="blueMat">
              <TresBoxGeometry :args="[8, 180, 8]" />
            </TresMesh>
            <TresMesh :position="[side * -14, 8, 30]" cast-shadow :material="darkMat">
              <TresBoxGeometry :args="[10, 140, 14]" />
            </TresMesh>
            <Edges :threshold="18" color="#94a3b8" />
          </TresGroup>
        </ExplodePart>

        <ExplodePart :offset="[0, 55, -20]" :amount="internalAmt" name="Explode_Crossbeam">
          <TresMesh
            :position="[0, 178, structZ - 36]"
            cast-shadow
            name="Crossbeam_Fixed"
            :material="panelMat"
          >
            <TresBoxGeometry :args="[wOut - 56, 28, 64]" />
          </TresMesh>
          <TresMesh :position="[0, 168, structZ - 8]" :material="railMat">
            <TresBoxGeometry :args="[wOut - 90, 6, 6]" />
          </TresMesh>
          <TresMesh :position="[0, 162, structZ - 8]" :material="darkMat">
            <TresBoxGeometry :args="[wOut - 90, 3, 10]" />
          </TresMesh>
        </ExplodePart>

        <ExplodePart :offset="[-95, 15, -35]" :amount="internalAmt" name="Explode_Magazine">
          <!-- 刀库收进左侧内腔，不再贴穿侧墙 -->
          <TresGroup
            :position="[-wOut / 2 + 48, 70, structZ - 20]"
            name="Tool_Magazine"
          >
            <TresMesh cast-shadow :material="darkMat">
              <TresCylinderGeometry :args="[28, 28, 20, 28]" />
            </TresMesh>
            <TresMesh :position="[0, 12, 0]" :material="panelMat">
              <TresCylinderGeometry :args="[26, 26, 4, 28]" />
            </TresMesh>
            <TresGroup
              v-for="s in magazineSlots"
              :key="s.i"
              :position="[s.x * 0.85, 10, s.z * 0.85]"
            >
              <TresMesh cast-shadow>
                <TresCylinderGeometry :args="[3, 3, 16, 10]" />
                <TresMeshStandardMaterial color="#cbd5e1" :roughness="0.3" :metalness="0.9" />
              </TresMesh>
              <TresMesh :position="[0, 9, 0]" :material="blueMat">
                <TresCylinderGeometry :args="[3.6, 3.6, 3, 10]" />
              </TresMesh>
            </TresGroup>
          </TresGroup>
        </ExplodePart>
      </TresGroup>

    <ExplodePart :offset="[0, -25, 55]" :amount="internalAmt" name="Explode_Trunnion">
      <Sf260Trunnion
        :cx="cx"
        :cz="cz"
        :table-top-y="-h"
        :table-mat="tableMat"
        :cradle-mat="cradleMat"
        :accent-mat="accentMat"
      />
    </ExplodePart>

    <ExplodePart :offset="[0, 65, 40]" :amount="internalAmt" name="Explode_Gantry">
      <TresGroup
        ref="ySaddleRef"
        :position="[cx, bridgeY, cz]"
        name="Y_Saddle"
      >
        <!-- 横梁宽度收进内腔，避免两端穿出侧墙 -->
        <TresMesh cast-shadow :material="panelMat">
          <TresBoxGeometry :args="[wOut - 48, 26, 40]" />
        </TresMesh>
        <TresMesh :position="[0, -16, 0]" :material="railMat">
          <TresBoxGeometry :args="[wOut - 72, 5, 5]" />
        </TresMesh>
        <TresMesh :position="[0, -16, 12]" :material="railMat">
          <TresBoxGeometry :args="[wOut - 72, 4, 4]" />
        </TresMesh>
        <TresMesh :position="[-(wOut / 2 - 70), 4, 22]" cast-shadow :material="blueMat">
          <TresBoxGeometry :args="[40, 18, 14]" />
        </TresMesh>
        <TresMesh :position="[wOut / 2 - 70, 4, 22]" cast-shadow :material="blueMat">
          <TresBoxGeometry :args="[40, 18, 14]" />
        </TresMesh>
        <TresMesh :position="[0, 14, -20]" cast-shadow :material="darkMat">
          <TresBoxGeometry :args="[wOut - 100, 8, 8]" />
        </TresMesh>

        <ExplodePart :offset="[0, 25, 35]" :amount="internalAmt" name="Explode_Carriage">
          <TresGroup ref="xCarriageRef" name="X_Carriage">
            <TresMesh :position="[0, 6, 0]" cast-shadow :material="darkMat">
              <TresBoxGeometry :args="[58, 38, 48]" />
            </TresMesh>
            <TresMesh :position="[0, 30, 0]" cast-shadow :material="darkMat">
              <TresCylinderGeometry :args="[19, 19, 32, 32]" />
            </TresMesh>
            <TresMesh :position="[0, 50, 0]" cast-shadow :material="castMat">
              <TresCylinderGeometry :args="[13, 15, 12, 28]" />
            </TresMesh>
            <TresMesh :position="[0, 58, 0]" :material="railMat">
              <TresCylinderGeometry :args="[8, 10, 6, 20]" />
            </TresMesh>
            <TresMesh :position="[0, 36, 0]" :material="accentMat">
              <TresTorusGeometry :args="[20, 1.8, 8, 32]" />
            </TresMesh>
            <TresMesh :position="[14, 28, 14]" cast-shadow>
              <TresCylinderGeometry :args="[1.5, 1.5, 36, 8]" />
              <TresMeshStandardMaterial color="#67e8f9" :roughness="0.3" :metalness="0.6" />
            </TresMesh>
            <TresMesh :position="[-14, 28, 14]" cast-shadow>
              <TresCylinderGeometry :args="[1.5, 1.5, 36, 8]" />
              <TresMeshStandardMaterial color="#67e8f9" :roughness="0.3" :metalness="0.6" />
            </TresMesh>

            <TresMesh
              ref="quillRef"
              :position="[0, -10, 0]"
              cast-shadow
              name="Quill"
              :material="quillMat"
            >
              <TresCylinderGeometry :args="[8.5, 8.5, 1, 24]" />
            </TresMesh>

            <TresGroup
              ref="toolAssemblyRef"
              :position="[0, -20, 0]"
              name="Tool_Assembly"
            >
              <TresMesh :position="[0, toolLen, 0]" :material="quillMat">
                <TresConeGeometry :args="[9, 11, 16]" />
              </TresMesh>
              <TresGroup ref="toolRef">
                <ToolGeometry :tool="toolDef" :tool-len="toolLen" :mat="toolMat" />
              </TresGroup>
              <TresMesh
                v-if="sim.coolant !== 'off'"
                :position="[8, 6, 8]"
                :user-data="{ skipExport: true }"
              >
                <TresCylinderGeometry :args="[0.4, 0.2, 16, 8]" />
                <TresMeshStandardMaterial
                  color="#7dd3fc"
                  transparent
                  :opacity="0.6"
                  emissive="#0ea5e9"
                  :emissive-intensity="0.3"
                />
              </TresMesh>
            </TresGroup>
          </TresGroup>
        </ExplodePart>
      </TresGroup>
    </ExplodePart>
    </TresGroup>
  </TresGroup>
</template>
