/**
 * 刀具三维外形构建器 — 从原 ToolGeometry.tsx 逻辑移植为命令式 Three.js
 */
import * as THREE from "three";
import type { CncTool } from "@/lib/cnc/tools";

type DrillKind = "twist_hss" | "twist_carbide" | "stub" | "spot" | "center";

function resolveDrillKind(tool: CncTool): DrillKind {
  const name = `${tool.name} ${tool.isoCode}`;
  if (tool.type === "spot_drill") {
    if (/333|中心钻|center/i.test(name)) return "center";
    return "spot";
  }
  if (tool.diameter > 0 && tool.length / tool.diameter < 4.2) return "stub";
  if ((tool.pointAngle ?? 118) >= 135) return "twist_carbide";
  return "twist_hss";
}

function metalMat(color: string, rough = 0.3, metal = 0.92) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: rough,
    metalness: metal,
  });
}

function addHelicalFluteBody(
  parent: THREE.Group,
  {
    radius,
    length,
    y0,
    flutes,
    turns,
    bodyMat,
    grooveColor = "#0f172a",
    landColor = "#e2e8f0",
    coreRatio = 0.34,
    envelopeOpacity = 0.2,
  }: {
    radius: number;
    length: number;
    y0: number;
    flutes: number;
    turns: number;
    bodyMat: THREE.Material;
    grooveColor?: string;
    landColor?: string;
    coreRatio?: number;
    envelopeOpacity?: number;
  },
) {
  const grooveMat = metalMat(grooveColor, 0.55, 0.75);
  const landMat = new THREE.MeshStandardMaterial({
    color: landColor,
    roughness: 0.2,
    metalness: 0.98,
    emissive: landColor,
    emissiveIntensity: 0.06,
  });

  const nFlutes = Math.max(2, Math.min(8, flutes || 2));
  const segs = Math.max(40, Math.ceil(length * 4));
  const tubeR = Math.max(0.28, radius * 0.4);

  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(
      radius * coreRatio,
      radius * (coreRatio + 0.06),
      length,
      14,
    ),
    bodyMat,
  );
  core.position.set(0, y0 + length / 2, 0);
  core.castShadow = true;
  parent.add(core);

  if (envelopeOpacity > 0) {
    const env = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius * 0.98, length, 28),
      new THREE.MeshStandardMaterial({
        color: "#94a3b8",
        roughness: 0.35,
        metalness: 0.9,
        transparent: true,
        opacity: envelopeOpacity,
        depthWrite: false,
      }),
    );
    env.position.set(0, y0 + length / 2, 0);
    parent.add(env);
  }

  for (let f = 0; f < nFlutes; f++) {
    const phase = (f / nFlutes) * Math.PI * 2;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const ang = phase + t * turns * Math.PI * 2;
      pts.push(
        new THREE.Vector3(
          Math.cos(ang) * radius * 0.52,
          y0 + t * length,
          Math.sin(ang) * radius * 0.52,
        ),
      );
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const groove = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 72, tubeR, 10, false),
      grooveMat,
    );
    groove.castShadow = true;
    parent.add(groove);

    const landSegs = Math.max(28, Math.ceil(length * 3.2));
    for (let i = 0; i < landSegs; i++) {
      const t = (i + 0.5) / landSegs;
      const ang = phase + t * turns * Math.PI * 2 + Math.PI / nFlutes;
      const y = y0 + t * length;
      const pitch = (turns * Math.PI * 2 * radius) / Math.max(length, 1);
      const helixPitchAng = Math.atan(pitch);
      const land = new THREE.Mesh(
        new THREE.BoxGeometry(
          Math.max(0.3, radius * 0.26),
          Math.max(0.45, length / landSegs + 0.12),
          Math.max(0.22, radius * 0.16),
        ),
        landMat,
      );
      land.position.set(
        Math.cos(ang) * radius * 0.93,
        y,
        Math.sin(ang) * radius * 0.93,
      );
      land.rotation.set(helixPitchAng * 0.12, -ang, helixPitchAng);
      land.castShadow = true;
      parent.add(land);
    }
  }
}

function addDrillPoint(
  parent: THREE.Group,
  radius: number,
  pointDeg: number,
  mat: THREE.Material,
) {
  const halfRad = THREE.MathUtils.degToRad(pointDeg / 2);
  const tipH = Math.max(radius * 0.65, radius / Math.tan(halfRad));
  const cone = new THREE.Mesh(new THREE.ConeGeometry(radius, tipH, 22), mat);
  cone.position.set(0, tipH / 2, 0);
  cone.rotation.x = Math.PI;
  cone.castShadow = true;
  parent.add(cone);

  const chisel = new THREE.Mesh(
    new THREE.BoxGeometry(
      radius * 0.2,
      radius * 1.65,
      Math.max(0.25, radius * 0.12),
    ),
    new THREE.MeshStandardMaterial({
      color: "#f1f5f9",
      roughness: 0.22,
      metalness: 0.96,
    }),
  );
  chisel.position.set(0, tipH * 0.12, 0);
  chisel.rotation.z = Math.PI / 2;
  parent.add(chisel);

  for (let i = 0; i < 2; i++) {
    const a = i * Math.PI + Math.PI / 2;
    const edge = new THREE.Mesh(
      new THREE.BoxGeometry(radius * 0.08, tipH * 0.7, radius * 0.08),
      new THREE.MeshStandardMaterial({
        color: "#fff",
        roughness: 0.15,
        metalness: 1,
      }),
    );
    edge.position.set(
      Math.cos(a) * radius * 0.45,
      tipH * 0.4,
      Math.sin(a) * radius * 0.45,
    );
    edge.rotation.set(0.4, -a, 0.2);
    parent.add(edge);
  }
  return tipH;
}

function addShank(
  parent: THREE.Group,
  radius: number,
  y0: number,
  length: number,
  mat: THREE.Material,
  flats = false,
) {
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, length, 22),
    mat,
  );
  body.position.set(0, y0 + length / 2, 0);
  body.castShadow = true;
  parent.add(body);

  const tip = new THREE.Mesh(
    new THREE.ConeGeometry(radius * 1.02, radius * 0.32, 16),
    mat,
  );
  tip.position.set(0, y0 + length - 0.15, 0);
  tip.rotation.x = Math.PI;
  parent.add(tip);

  if (flats) {
    const flat = new THREE.Mesh(
      new THREE.BoxGeometry(radius * 0.35, length * 0.45, radius * 1.6),
      new THREE.MeshStandardMaterial({
        color: "#64748b",
        roughness: 0.4,
        metalness: 0.85,
      }),
    );
    flat.position.set(radius * 0.85, y0 + length * 0.55, 0);
    parent.add(flat);
  }
}

function buildTwistDrill(
  tool: CncTool,
  toolLen: number,
  mat: THREE.Material,
  kind: DrillKind,
) {
  const g = new THREE.Group();
  const r = Math.max(0.55, tool.diameter / 2);
  const pointDeg = tool.pointAngle ?? (kind === "twist_carbide" ? 140 : 118);
  const halfRad = THREE.MathUtils.degToRad(pointDeg / 2);
  const tipH = Math.max(r * 0.65, r / Math.tan(halfRad));
  const shankR = Math.max(r, tool.shankDiameter / 2);
  const stub = kind === "stub";
  const carbide = kind === "twist_carbide";
  const shankLen = stub
    ? Math.max(toolLen * 0.38, 5)
    : Math.max(toolLen * 0.26, 5);
  const fluteLen = Math.max(
    toolLen - shankLen - tipH * 0.5,
    stub ? toolLen * 0.35 : toolLen * 0.48,
  );
  const fluteY0 = tipH * 0.82;
  const turns = stub
    ? Math.max(1.1, fluteLen / (r * 7))
    : carbide
      ? Math.max(1.8, fluteLen / (r * 5.2))
      : Math.max(2.0, fluteLen / (r * 4.8));

  const bodyMat = carbide
    ? new THREE.MeshStandardMaterial({
        color: tool.color,
        roughness: 0.28,
        metalness: 0.85,
        emissive: "#334155",
        emissiveIntensity: 0.12,
      })
    : mat;

  addDrillPoint(g, r, pointDeg, bodyMat);
  addHelicalFluteBody(g, {
    radius: r,
    length: fluteLen,
    y0: fluteY0,
    flutes: tool.flutes || 2,
    turns,
    bodyMat,
    grooveColor: carbide ? "#1e293b" : "#0f172a",
    landColor: carbide ? "#cbd5e1" : "#e8eef5",
    coreRatio: carbide ? 0.4 : 0.32,
    envelopeOpacity: carbide ? 0.28 : 0.18,
  });
  addShank(g, shankR, fluteY0 + fluteLen, shankLen, bodyMat, carbide);
  return g;
}

function buildSpotDrill(tool: CncTool, toolLen: number, mat: THREE.Material) {
  const g = new THREE.Group();
  const r = Math.max(0.8, tool.diameter / 2);
  const pointDeg = tool.pointAngle ?? 90;
  const halfRad = THREE.MathUtils.degToRad(pointDeg / 2);
  const tipH = Math.max(r * 0.9, r / Math.tan(halfRad));
  const bodyLen = Math.max(toolLen * 0.45, tipH + 2);
  const shankR = Math.max(r, tool.shankDiameter / 2);
  const shankLen = Math.max(toolLen * 0.4, 5);
  const pinkMat = new THREE.MeshStandardMaterial({
    color: tool.color,
    roughness: 0.32,
    metalness: 0.88,
  });
  addDrillPoint(g, r, pointDeg, pinkMat);
  addHelicalFluteBody(g, {
    radius: r,
    length: bodyLen,
    y0: tipH * 0.75,
    flutes: 2,
    turns: 0.65,
    bodyMat: pinkMat,
    grooveColor: "#3f1f1f",
    landColor: "#fecaca",
    coreRatio: 0.48,
    envelopeOpacity: 0.25,
  });
  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(shankR * 1.05, shankR * 1.05, 2.2, 20),
    mat,
  );
  collar.position.set(0, tipH * 0.75 + bodyLen + 1, 0);
  collar.castShadow = true;
  g.add(collar);
  addShank(g, shankR, tipH * 0.75 + bodyLen + 2, shankLen, mat);
  return g;
}

function buildCenterDrill(tool: CncTool, toolLen: number, mat: THREE.Material) {
  const g = new THREE.Group();
  const bodyR = Math.max(1.2, tool.diameter / 2);
  const pilotR = bodyR * 0.38;
  const tipH = pilotR * 1.1;
  const pilotLen = Math.max(2.5, bodyR * 1.2);
  const coneH = bodyR * 1.15;
  const bodyLen = Math.max(toolLen * 0.35, 4);
  const shankLen = Math.max(toolLen * 0.35, 5);

  const tip = new THREE.Mesh(new THREE.ConeGeometry(pilotR, tipH, 16), mat);
  tip.position.set(0, tipH / 2, 0);
  tip.rotation.x = Math.PI;
  tip.castShadow = true;
  g.add(tip);

  const pilot = new THREE.Mesh(
    new THREE.CylinderGeometry(pilotR, pilotR, pilotLen, 14),
    mat,
  );
  pilot.position.set(0, tipH + pilotLen / 2, 0);
  pilot.castShadow = true;
  g.add(pilot);

  const cone = new THREE.Mesh(new THREE.ConeGeometry(bodyR, coneH, 20), mat);
  cone.position.set(0, tipH + pilotLen + coneH / 2, 0);
  cone.rotation.x = Math.PI;
  cone.castShadow = true;
  g.add(cone);

  addHelicalFluteBody(g, {
    radius: bodyR,
    length: bodyLen,
    y0: tipH + pilotLen + coneH * 0.85,
    flutes: 2,
    turns: 0.45,
    bodyMat: mat,
    coreRatio: 0.5,
    envelopeOpacity: 0.15,
  });
  addShank(g, bodyR, tipH + pilotLen + coneH * 0.85 + bodyLen, shankLen, mat);
  return g;
}

function buildReamer(tool: CncTool, toolLen: number, mat: THREE.Material) {
  const g = new THREE.Group();
  const r = Math.max(0.7, tool.diameter / 2);
  const leadH = r * 1.4;
  const fluteLen = toolLen * 0.58;
  const shankR = tool.shankDiameter / 2;
  const shankLen = toolLen * 0.32;
  const blueMat = new THREE.MeshStandardMaterial({
    color: tool.color,
    roughness: 0.25,
    metalness: 0.92,
  });
  const tip = new THREE.Mesh(new THREE.ConeGeometry(r, leadH, 18), blueMat);
  tip.position.set(0, leadH / 2, 0);
  tip.rotation.x = Math.PI;
  tip.castShadow = true;
  g.add(tip);
  addHelicalFluteBody(g, {
    radius: r,
    length: fluteLen,
    y0: leadH * 0.7,
    flutes: tool.flutes || 6,
    turns: 0.85,
    bodyMat: blueMat,
    grooveColor: "#1e3a5f",
    landColor: "#dbeafe",
    coreRatio: 0.55,
    envelopeOpacity: 0.3,
  });
  const cal = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 1.01, r * 1.01, 2.4, 24),
    new THREE.MeshStandardMaterial({
      color: "#eff6ff",
      roughness: 0.15,
      metalness: 0.98,
    }),
  );
  cal.position.set(0, leadH * 0.7 + fluteLen + 1, 0);
  cal.castShadow = true;
  g.add(cal);
  addShank(g, Math.max(r, shankR), leadH * 0.7 + fluteLen + 2.2, shankLen, mat);
  return g;
}

function buildTap(tool: CncTool, toolLen: number, mat: THREE.Material) {
  const g = new THREE.Group();
  const r = Math.max(1, tool.diameter / 2);
  const pitch = Math.max(0.7, r * 0.28);
  const threadLen = toolLen * 0.55;
  const chamferLen = pitch * 3.5;
  const shankLen = toolLen * 0.35;
  const flutes = tool.flutes || 3;

  const tip = new THREE.Mesh(new THREE.ConeGeometry(r, chamferLen, 18), mat);
  tip.position.set(0, chamferLen / 2, 0);
  tip.rotation.x = Math.PI;
  tip.castShadow = true;
  g.add(tip);

  const n = Math.max(8, Math.floor(threadLen / pitch));
  for (let i = 0; i < n; i++) {
    const y = chamferLen * 0.7 + i * pitch;
    const taper = i < 3 ? 0.75 + i * 0.08 : 1;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(r * 0.82 * taper, pitch * 0.28, 6, 20),
      new THREE.MeshStandardMaterial({
        color: "#e0f2fe",
        roughness: 0.25,
        metalness: 0.95,
      }),
    );
    ring.position.set(0, y, 0);
    ring.rotation.x = -Math.PI / 2;
    ring.castShadow = true;
    g.add(ring);
  }

  addHelicalFluteBody(g, {
    radius: r * 0.95,
    length: threadLen,
    y0: chamferLen * 0.5,
    flutes,
    turns: 1.6,
    bodyMat: mat,
    grooveColor: "#0c4a6e",
    landColor: "#7dd3fc",
    coreRatio: 0.42,
    envelopeOpacity: 0.08,
  });
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 0.7, r * 0.7, 3, 16),
    mat,
  );
  neck.position.set(0, chamferLen * 0.5 + threadLen + 1.5, 0);
  neck.castShadow = true;
  g.add(neck);
  addShank(
    g,
    tool.shankDiameter / 2,
    chamferLen * 0.5 + threadLen + 3,
    shankLen,
    mat,
    true,
  );
  return g;
}

function buildChamfer(tool: CncTool, toolLen: number, mat: THREE.Material) {
  const g = new THREE.Group();
  const r = tool.diameter / 2;
  const pointDeg = tool.pointAngle ?? 90;
  const halfRad = THREE.MathUtils.degToRad(pointDeg / 2);
  const tipH = Math.max(r * 0.85, r / Math.tan(halfRad));
  const tip = new THREE.Mesh(new THREE.ConeGeometry(r, tipH, 20), mat);
  tip.position.set(0, tipH / 2, 0);
  tip.rotation.x = Math.PI;
  tip.castShadow = true;
  g.add(tip);
  addHelicalFluteBody(g, {
    radius: r * 0.7,
    length: toolLen * 0.35,
    y0: tipH * 0.7,
    flutes: tool.flutes || 2,
    turns: 0.5,
    bodyMat: mat,
    coreRatio: 0.45,
  });
  addShank(
    g,
    tool.shankDiameter / 2,
    tipH * 0.7 + toolLen * 0.35,
    toolLen * 0.4,
    mat,
  );
  return g;
}

/** 构建刀具几何，挂到 parent；返回新建的根 Group */
export function buildToolGeometry(
  tool: CncTool,
  toolLen: number,
  mat: THREE.Material,
): THREE.Group {
  const r = tool.diameter / 2;

  switch (tool.type) {
    case "drill":
      return buildTwistDrill(tool, toolLen, mat, resolveDrillKind(tool));
    case "spot_drill": {
      const kind = resolveDrillKind(tool);
      if (kind === "center") return buildCenterDrill(tool, toolLen, mat);
      return buildSpotDrill(tool, toolLen, mat);
    }
    case "reamer":
      return buildReamer(tool, toolLen, mat);
    case "tap":
      return buildTap(tool, toolLen, mat);
    case "chamfer":
      return buildChamfer(tool, toolLen, mat);

    case "end_mill":
    case "roughing_end_mill":
    case "bull_nose": {
      const g = new THREE.Group();
      addHelicalFluteBody(g, {
        radius: r,
        length: toolLen * 0.5,
        y0: 0.35,
        flutes: tool.flutes || 3,
        turns: tool.type === "roughing_end_mill" ? 0.9 : 1.15,
        bodyMat: mat,
      });
      const tip = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.45, 16), mat);
      tip.position.set(0, 0.12, 0);
      g.add(tip);
      if (tool.cornerRadius && tool.cornerRadius > 0) {
        const torus = new THREE.Mesh(
          new THREE.TorusGeometry(r - tool.cornerRadius, tool.cornerRadius, 8, 20),
          mat,
        );
        torus.position.set(0, tool.cornerRadius * 0.15, 0);
        g.add(torus);
      }
      addShank(g, tool.shankDiameter / 2, toolLen * 0.52, toolLen * 0.42, mat);
      return g;
    }

    case "ball_nose": {
      const g = new THREE.Group();
      const ball = new THREE.Mesh(
        new THREE.SphereGeometry(r, 18, 14, 0, Math.PI * 2, 0, Math.PI / 2),
        mat,
      );
      ball.castShadow = true;
      g.add(ball);
      addHelicalFluteBody(g, {
        radius: r,
        length: toolLen * 0.42,
        y0: r * 0.8,
        flutes: tool.flutes || 2,
        turns: 1.05,
        bodyMat: mat,
      });
      addShank(
        g,
        tool.shankDiameter / 2,
        r * 0.8 + toolLen * 0.42,
        toolLen * 0.4,
        mat,
      );
      return g;
    }

    case "face_mill":
    case "fly_cutter": {
      const g = new THREE.Group();
      const shank = new THREE.Mesh(
        new THREE.CylinderGeometry(
          tool.shankDiameter / 2,
          tool.shankDiameter / 2,
          toolLen * 0.45,
          16,
        ),
        mat,
      );
      shank.position.set(0, toolLen * 0.55, 0);
      shank.castShadow = true;
      g.add(shank);
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(r, r, toolLen * 0.28, 28),
        new THREE.MeshStandardMaterial({
          color: "#4b5563",
          roughness: 0.45,
          metalness: 0.7,
        }),
      );
      body.position.set(0, toolLen * 0.18, 0);
      body.castShadow = true;
      g.add(body);
      const n = tool.flutes || 5;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const insert = new THREE.Mesh(
          new THREE.BoxGeometry(Math.max(2, r * 0.22), 1.2, 2),
          new THREE.MeshStandardMaterial({
            color: "#cbd5e1",
            roughness: 0.2,
            metalness: 0.95,
          }),
        );
        insert.position.set(Math.cos(a) * r * 0.82, 0.15, Math.sin(a) * r * 0.82);
        insert.castShadow = true;
        g.add(insert);
      }
      return g;
    }

    case "thread_mill": {
      const g = new THREE.Group();
      addHelicalFluteBody(g, {
        radius: r,
        length: toolLen * 0.55,
        y0: 0.5,
        flutes: tool.flutes || 4,
        turns: 2.2,
        bodyMat: mat,
        landColor: "#e9d5ff",
      });
      for (let i = 0; i < 6; i++) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(r * 0.75, 0.25, 6, 16),
          new THREE.MeshStandardMaterial({
            color: "#f5d0fe",
            roughness: 0.3,
            metalness: 0.9,
          }),
        );
        ring.position.set(0, 1 + i * (toolLen * 0.08), 0);
        ring.rotation.x = -Math.PI / 2;
        g.add(ring);
      }
      addShank(g, tool.shankDiameter / 2, toolLen * 0.58, toolLen * 0.35, mat);
      return g;
    }

    default: {
      const g = new THREE.Group();
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(r, r, toolLen, 16),
        mat,
      );
      mesh.position.set(0, toolLen / 2, 0);
      mesh.castShadow = true;
      g.add(mesh);
      return g;
    }
  }
}
