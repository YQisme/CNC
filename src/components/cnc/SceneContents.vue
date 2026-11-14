<script setup lang="ts">
import { computed, shallowRef, watch } from "vue";
import * as THREE from "three";
import { useLoop, useTres } from "@tresjs/core";
import { OrbitControls, ContactShadows, Grid } from "@tresjs/cientos";
import { useSimStore } from "@/stores/sim";
import { useViewStore } from "@/stores/view";
import {
  createTopSurface,
  buildCumulativeHeightmaps,
  applyPartialCut,
  buildToolpathLines,
  type TopSurface,
} from "@/lib/cnc/carve";
import { toolRadius, getToolByNumber, type CncTool } from "@/lib/cnc/tools";
import { getMaterialById } from "@/lib/cnc/materials";
import type { Move } from "@/lib/cnc/types";
import Sf260Machine from "@/components/cnc/machines/Sf260Machine.vue";
import Sf260WorkRotaryGroup from "@/components/cnc/machines/Sf260WorkRotaryGroup.vue";
import ExplodePart from "@/components/cnc/machines/ExplodePart.vue";
import { explodeAmounts } from "@/components/cnc/machines/explodeAmounts";
import ChipDebris from "@/components/cnc/ChipDebris.vue";
import DrillBores from "@/components/cnc/DrillBores.vue";
import ToolGeometry from "@/components/cnc/ToolGeometry.vue";

const TOOL_FALLBACK: CncTool = {
  number: 1,
  isoCode: "ISO 1641",
  name: "End mill Ø6",
  type: "end_mill",
  category: "铣削",
  diameter: 6,
  length: 20,
  flutes: 3,
  shankDiameter: 6,
  color: "#e8c878",
  surfaceSpeed: 250,
  chipLoad: 0.05,
  description: "Default end mill",
};

function metal(color: string, rough = 0.35, metalness = 0.9) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness });
}

const sim = useSimStore();
const view = useViewStore();
const { camera, controls } = useTres();

const isSf260 = computed(() => sim.machineId === "sf260_5axis");
const cx = computed(() =>
  sim.originDatum === "front_left" ? sim.workpiece.width / 2 : 0,
);
const cz = computed(() =>
  sim.originDatum === "front_left" ? -sim.workpiece.depth / 2 : 0,
);
const workExplodeAmt = computed(
  () => explodeAmounts(view.explodeAmount, view.showShell).internal,
);

const feedLineMat = new THREE.LineBasicMaterial({ color: "#22d3ee" });
const rapidLineMat = new THREE.LineDashedMaterial({
  color: "#f59e0b",
  dashSize: 3,
  gapSize: 2,
});

const feedLineGeo = computed(() => {
  if (!sim.parseResult || !view.showToolpath) return null;
  const pts = buildToolpathLines(sim.parseResult.moves).feedPoints;
  if (pts.length < 2) return null;
  return new THREE.BufferGeometry().setFromPoints(pts);
});
const rapidLineGeo = computed(() => {
  if (!sim.parseResult || !view.showToolpath) return null;
  const pts = buildToolpathLines(sim.parseResult.moves).rapidPoints;
  if (pts.length < 2) return null;
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  new THREE.Line(geo, rapidLineMat).computeLineDistances();
  return geo;
});

const spindleBridgeRef = shallowRef<THREE.Group | null>(null);
const spindleCarriageRef = shallowRef<THREE.Group | null>(null);
const spindleQuillRef = shallowRef<THREE.Mesh | null>(null);
const spindleToolRef = shallowRef<THREE.Group | null>(null);
const spinAccum = { current: 0 };
const spindleToolDef = computed(() => getToolByNumber(sim.tool) ?? TOOL_FALLBACK);
const spindleToolLen = computed(() =>
  Math.max(14, Math.min(36, spindleToolDef.value.length)),
);
const spindleBridgeY = computed(() => sim.workpiece.height + 70);
const tipLocalY = computed(() => sim.position.z - spindleBridgeY.value);
const spindleToolMat = metal("#e8c878", 0.25, 0.95);
const housingMat = metal("#3a3f47", 0.4, 0.8);
const motorMat = metal("#22262c", 0.5, 0.7);
const quillMat = metal("#b8bec7", 0.25, 0.95);
const baseMat = metal("#2a3038", 0.55, 0.7);
const tableMat = metal("#4b5563", 0.45, 0.75);
const pillarMat = metal("#374151", 0.4, 0.8);
const glassMat = new THREE.MeshPhysicalMaterial({
  color: "#88c0d0",
  transparent: true,
  opacity: 0.18,
  roughness: 0.1,
  metalness: 0.1,
});

const N = 120;
const topSurface = shallowRef<TopSurface | null>(null);
const liveRef = { current: new Float32Array((N + 1) * (N + 1)) };
const lastApplied = { current: { idx: -1, t: -1 } };

watch(
  () => [sim.workpiece.width, sim.workpiece.depth, sim.originDatum] as const,
  () => {
    topSurface.value = createTopSurface(
      sim.workpiece.width,
      sim.workpiece.depth,
      N,
      sim.originDatum,
    );
    const count = (N + 1) * (N + 1);
    topSurface.value.geometry.setAttribute(
      "color",
      new THREE.BufferAttribute(new Float32Array(count * 3), 3),
    );
  },
  { immediate: true },
);

const cumulative = computed(() => {
  if (!sim.parseResult || sim.parseResult.moves.length === 0) return null;
  if (sim.machineMode !== "run") return null;
  return buildCumulativeHeightmaps(
    sim.parseResult.moves,
    sim.workpiece,
    N,
    toolRadius,
    sim.originDatum,
  );
});

watch(cumulative, () => {
  lastApplied.current = { idx: -1, t: -1 };
  if (topSurface.value) topSurface.value.reset();
});

const matInfo = computed(() => getMaterialById(sim.materialId));
const stockCol = computed(() => new THREE.Color(matInfo.value?.color ?? "#a8b2bf"));
const cutCol = computed(() => new THREE.Color(matInfo.value?.sideColor ?? "#6b7280"));
const bodyGeom = computed(
  () =>
    new THREE.BoxGeometry(
      sim.workpiece.width,
      sim.workpiece.height,
      sim.workpiece.depth,
    ),
);
const bodyPos = computed(
  (): [number, number, number] => [cx.value, -sim.workpiece.height / 2, cz.value],
);
/** Box 六面材质：+Y 顶面隐藏，由高度图顶面替代，否则会把孔洞盖住 */
const bodyMats = computed(() => {
  const side = new THREE.MeshStandardMaterial({
    color: matInfo.value.sideColor,
    roughness: 0.48,
    metalness: matInfo.value.metalness * 0.85,
  });
  const topHidden = new THREE.MeshStandardMaterial({ visible: false });
  const bottom = new THREE.MeshStandardMaterial({
    color: matInfo.value.sideColor,
    roughness: 0.55,
    metalness: matInfo.value.metalness * 0.9,
    side: THREE.DoubleSide,
  });
  return [side, side, topHidden, bottom, side, side];
});
const ghostMat = computed(
  () =>
    new THREE.MeshStandardMaterial({
      color: matInfo.value.color,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      roughness: 1,
      metalness: 0,
    }),
);
const topMat = new THREE.MeshStandardMaterial({
  color: "#ffffff",
  vertexColors: true,
  roughness: 0.45,
  metalness: 0.4,
  side: THREE.DoubleSide,
});

const frameDims = computed(() => {
  const wOut = Math.max(280, sim.workpiece.width + 120);
  const dOut = Math.max(240, sim.workpiece.depth + 100);
  const baseTopY = -sim.workpiece.height - 22;
  return { wOut, dOut, baseTopY };
});
const posts = computed(() => {
  const { wOut, dOut } = frameDims.value;
  return [
    [-wOut / 2 + 12, -dOut / 2 + 12],
    [wOut / 2 - 12, -dOut / 2 + 12],
    [-wOut / 2 + 12, dOut / 2 - 12],
    [wOut / 2 - 12, dOut / 2 - 12],
  ] as [number, number][];
});
const maxPolar = Math.PI * 0.98;

watch(
  () => [view.cameraPreset, view.cameraNonce, cx.value, cz.value, isSf260.value] as const,
  () => {
    const preset = view.cameraPreset;
    if (!preset) return;
    const cam = camera.value as THREE.PerspectiveCamera | undefined;
    if (!cam) return;
    const far = isSf260.value ? 2.55 : 1;
    const lookY = isSf260.value && preset !== "focus" ? 110 : sim.workpiece.height * 0.35;
    let pos: [number, number, number] = [
      cx.value + 230 * far,
      190 * far,
      cz.value + 250 * far,
    ];
    if (preset === "top") pos = [cx.value, 420 * far, cz.value + 0.01];
    else if (preset === "bottom") pos = [cx.value, -350 * far, cz.value + 0.01];
    else if (preset === "front") pos = [cx.value, 90 * far, cz.value + 520 * far];
    else if (preset === "right") pos = [cx.value + 480 * far, 90 * far, cz.value];
    else if (preset === "focus") pos = [cx.value + 150, 115, cz.value + 170];
    cam.position.set(...pos);
    cam.lookAt(cx.value, lookY, cz.value);
    const ctrl = controls.value as { target: THREE.Vector3; update: () => void } | null;
    if (ctrl?.target) {
      ctrl.target.set(cx.value, lookY, cz.value);
      ctrl.update();
    }
  },
);

const prevMachineId = shallowRef<string | null>(null);
watch(
  () => sim.machineId,
  (machineId) => {
    if (prevMachineId.value === machineId) return;
    const first = prevMachineId.value === null;
    prevMachineId.value = machineId;
    if (machineId === "sf260_5axis") view.setCameraPreset("iso");
    else if (!first) view.setCameraPreset("reset");
  },
  { immediate: true },
);

watch(
  () => sim.playing,
  (playing, was) => {
    if (playing && !was) view.setCameraPreset("focus");
  },
);

const { onBeforeRender } = useLoop();
onBeforeRender(({ delta }) => {
  if (!isSf260.value) {
    const pos = sim.position;
    if (spindleBridgeRef.value) spindleBridgeRef.value.position.z = -pos.y;
    if (spindleCarriageRef.value) spindleCarriageRef.value.position.x = pos.x;
    const length = Math.max(4, spindleBridgeY.value - pos.z - spindleToolLen.value);
    if (spindleQuillRef.value) {
      spindleQuillRef.value.scale.y = length;
      spindleQuillRef.value.position.y = -length / 2;
    }
    if (spindleToolRef.value && sim.spindleOn) {
      const visibleSpeed = Math.min(sim.spindleRpm, 3000) / 3000;
      spinAccum.current += delta * sim.spindleDir * (4 + visibleSpeed * 14);
      spindleToolRef.value.rotation.y = spinAccum.current;
    }
  }

  const top = topSurface.value;
  const cum = cumulative.value;
  if (!cum || !sim.parseResult || !top) return;
  const idx = sim.currentMoveIndex;
  const t = sim.currentT;
  if (lastApplied.current.idx === idx && Math.abs(lastApplied.current.t - t) < 1e-4) return;
  lastApplied.current = { idx, t };
  const base = cum[idx] ?? cum[cum.length - 1];
  const live = liveRef.current;
  const move: Move | undefined = sim.parseResult.moves[idx];
  applyPartialCut(
    live,
    base,
    move,
    t,
    toolRadius,
    sim.workpiece.width,
    sim.workpiece.depth,
    N,
    sim.originDatum,
  );
  top.applyHeightmap(live);
  const colorAttr = top.geometry.getAttribute("color") as THREE.BufferAttribute | undefined;
  if (!colorAttr) return;
  for (let i = 0; i < live.length; i++) {
    const d = live[i];
    if (d < -0.08) {
      const k = Math.min(1, -d / Math.max(2, sim.workpiece.height * 0.6));
      colorAttr.setXYZ(
        i,
        THREE.MathUtils.lerp(stockCol.value.r, cutCol.value.r, 0.45 + k * 0.55),
        THREE.MathUtils.lerp(stockCol.value.g, cutCol.value.g, 0.45 + k * 0.55),
        THREE.MathUtils.lerp(stockCol.value.b, cutCol.value.b, 0.45 + k * 0.55),
      );
    } else {
      colorAttr.setXYZ(i, stockCol.value.r, stockCol.value.g, stockCol.value.b);
    }
  }
  colorAttr.needsUpdate = true;
});
</script>

<template>
  <TresAmbientLight :intensity="0.85" />
  <TresDirectionalLight
    :position="[cx + 140, 220, cz + 140]"
    :intensity="2"
    cast-shadow
  />
  <TresDirectionalLight :position="[cx - 120, 90, cz - 70]" :intensity="0.6" color="#9fdcff" />
  <TresHemisphereLight :args="['#c8d4e8', '#1a1e24', 0.45]" />

  <Sf260Machine v-if="isSf260" />

  <TresGroup v-else :position="[cx, 0, cz]">
    <TresMesh :position="[0, frameDims.baseTopY - 30, 0]" :material="baseMat" receive-shadow cast-shadow>
      <TresBoxGeometry :args="[frameDims.wOut, 20, frameDims.dOut]" />
    </TresMesh>
    <TresMesh :position="[0, frameDims.baseTopY + 12, 0]" :material="tableMat" receive-shadow cast-shadow>
      <TresBoxGeometry :args="[Math.max(240, sim.workpiece.width + 80), 12, Math.max(200, sim.workpiece.depth + 80)]" />
    </TresMesh>
    <TresMesh
      v-for="(p, idx) in posts"
      :key="idx"
      :position="[p[0], 70, p[1]]"
      :material="pillarMat"
      cast-shadow
    >
      <TresBoxGeometry :args="[16, 220, 16]" />
    </TresMesh>
    <TresMesh v-if="view.showEnclosure" :position="[0, 75, frameDims.dOut / 2 - 6]" :material="glassMat">
      <TresBoxGeometry :args="[frameDims.wOut - 30, 200, 2]" />
    </TresMesh>
  </TresGroup>

  <ExplodePart
    v-if="isSf260"
    :offset="[0, -25, 55]"
    :amount="workExplodeAmt"
    name="Explode_Workzone"
  >
    <Sf260WorkRotaryGroup>
      <TresGroup>
        <TresMesh :geometry="bodyGeom" :material="ghostMat" :position="bodyPos" />
        <TresMesh
          :geometry="bodyGeom"
          :material="bodyMats"
          :position="bodyPos"
          cast-shadow
          receive-shadow
        />
        <TresMesh
          v-if="topSurface"
          :geometry="topSurface.geometry"
          :material="topMat"
          cast-shadow
          receive-shadow
        />
        <DrillBores :stock-height="sim.workpiece.height" />
      </TresGroup>
      <ChipDebris :table-top-y="-sim.workpiece.height" />
      <TresGroup v-if="view.showToolpath">
        <TresLine v-if="feedLineGeo" :geometry="feedLineGeo" :material="feedLineMat" />
        <TresLine v-if="rapidLineGeo" :geometry="rapidLineGeo" :material="rapidLineMat" />
      </TresGroup>
    </Sf260WorkRotaryGroup>
  </ExplodePart>

  <template v-else>
    <TresGroup>
      <TresMesh :geometry="bodyGeom" :material="ghostMat" :position="bodyPos" />
      <TresMesh
        :geometry="bodyGeom"
        :material="bodyMats"
        :position="bodyPos"
        cast-shadow
        receive-shadow
      />
      <TresMesh
        v-if="topSurface"
        :geometry="topSurface.geometry"
        :material="topMat"
        cast-shadow
        receive-shadow
      />
      <DrillBores :stock-height="sim.workpiece.height" />
    </TresGroup>
    <ChipDebris :table-top-y="-sim.workpiece.height" />
    <TresGroup v-if="view.showToolpath">
      <TresLine v-if="feedLineGeo" :geometry="feedLineGeo" :material="feedLineMat" />
      <TresLine v-if="rapidLineGeo" :geometry="rapidLineGeo" :material="rapidLineMat" />
    </TresGroup>
    <TresGroup ref="spindleBridgeRef" :position="[0, spindleBridgeY, 0]">
      <TresMesh cast-shadow :material="housingMat">
        <TresBoxGeometry :args="[280, 16, 22]" />
      </TresMesh>
      <TresGroup ref="spindleCarriageRef">
        <TresMesh :position="[0, 18, 0]" cast-shadow :material="motorMat">
          <TresCylinderGeometry :args="[16, 16, 22, 24]" />
        </TresMesh>
        <TresMesh ref="spindleQuillRef" :position="[0, -10, 0]" cast-shadow :material="quillMat">
          <TresCylinderGeometry :args="[7, 7, 1, 20]" />
        </TresMesh>
        <TresGroup :position="[0, tipLocalY, 0]">
          <TresGroup ref="spindleToolRef">
            <ToolGeometry
              :tool="spindleToolDef"
              :tool-len="spindleToolLen"
              :mat="spindleToolMat"
            />
          </TresGroup>
        </TresGroup>
      </TresGroup>
    </TresGroup>
  </template>

  <ContactShadows
    :position="[cx, -sim.workpiece.height - 12, cz]"
    :opacity="0.35"
    :scale="400"
    :blur="2"
    :far="120"
    :resolution="512"
  />
  <Grid
    :position="[cx, -sim.workpiece.height - 12.5, cz]"
    :args="[700, 700]"
    :cell-size="10"
    :cell-thickness="0.6"
    cell-color="#3b4049"
    :section-size="50"
    :section-thickness="1.2"
    section-color="#f97316"
    :fade-distance="460"
    :infinite-grid="true"
    :visible="view.showGrid"
  />
  <OrbitControls
    make-default
    :target="[cx, 0, cz]"
    :min-distance="10"
    :max-distance="2800"
    :min-polar-angle="0.01"
    :max-polar-angle="maxPolar"
    enable-damping
    :damping-factor="0.08"
  />
</template>
