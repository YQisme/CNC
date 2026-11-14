// 机床 3D 模型导出（GLB / OBJ）

import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { OBJExporter } from "three/addons/exporters/OBJExporter.js";

/** 导出分组名：Blender Outliner 中可直接选中整组 */
export const EXPORT_SHELL_GROUP = "SF260_Shell";
export const EXPORT_INTERNAL_GROUP = "SF260_Internal";

const SHELL_ANCESTOR_NAMES = new Set([
  EXPORT_SHELL_GROUP,
  "SF260_Exterior",
  "SF260_Shell",
]);

let exportRoot: THREE.Object3D | null = null;

export function setMachineExportRoot(obj: THREE.Object3D | null) {
  exportRoot = obj;
}

export function getMachineExportRoot(): THREE.Object3D | null {
  return exportRoot;
}

function simplifyMaterial(mat: THREE.Material): THREE.Material {
  const anyMat = mat as THREE.MeshStandardMaterial & {
    transmission?: number;
    isMeshPhysicalMaterial?: boolean;
  };
  if (anyMat.isMeshPhysicalMaterial || (anyMat.transmission ?? 0) > 0.01) {
    return new THREE.MeshStandardMaterial({
      color: anyMat.color?.clone?.() ?? new THREE.Color("#9fdcff"),
      roughness: 0.15,
      metalness: 0.05,
      transparent: true,
      opacity: Math.min(0.45, anyMat.opacity ?? 0.35),
      side: THREE.DoubleSide,
      name: mat.name || "GlassExport",
    });
  }
  return mat.clone();
}

/** 沿父链判断 mesh 属于外壳还是内部（默认内部） */
function resolveExportBucket(obj: THREE.Object3D): "shell" | "internal" {
  let p: THREE.Object3D | null = obj;
  while (p) {
    const tag = p.userData?.exportGroup as string | undefined;
    if (tag === "shell") return "shell";
    if (tag === "internal") return "internal";
    if (SHELL_ANCESTOR_NAMES.has(p.name)) return "shell";
    if (p.name === EXPORT_INTERNAL_GROUP || p.name === "SF260_Internal") {
      return "internal";
    }
    p = p.parent;
  }
  return "internal";
}

/** 克隆可导出对象：剥离文字/精灵，简化玻璃材质；外壳/内部分两组 */
export function prepareExportClone(source: THREE.Object3D): THREE.Group {
  const root = new THREE.Group();
  root.name = source.name || "CNC_Machine_Export";
  source.updateWorldMatrix(true, true);

  const shell = new THREE.Group();
  shell.name = EXPORT_SHELL_GROUP;
  const internal = new THREE.Group();
  internal.name = EXPORT_INTERNAL_GROUP;

  source.traverse((obj) => {
    if (!obj.visible) return;
    // troika / drei Text 通常带 troikaText 或非标准几何
    if (obj.type === "Sprite") return;
    if ((obj as THREE.Object3D).userData?.skipExport) return;
    if (!(obj as THREE.Mesh).isMesh) return;

    const mesh = obj as THREE.Mesh;
    if (!mesh.geometry) return;

    const geom = mesh.geometry.clone();
    geom.applyMatrix4(mesh.matrixWorld);

    let material: THREE.Material | THREE.Material[];
    if (Array.isArray(mesh.material)) {
      material = mesh.material.map(simplifyMaterial);
    } else {
      material = simplifyMaterial(mesh.material);
    }

    const out = new THREE.Mesh(geom, material);
    out.name = mesh.name || "part";
    out.castShadow = true;
    out.receiveShadow = true;

    if (resolveExportBucket(mesh) === "shell") shell.add(out);
    else internal.add(out);
  });

  // 始终挂上两组，方便 Blender 里按固定名称操作（即使某一组为空）
  root.add(shell);
  root.add(internal);

  return root;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export type ExportFormat = "glb" | "obj";

export async function downloadMachineModel(
  format: ExportFormat = "glb",
  filenameBase = "SF-260H",
): Promise<void> {
  const source = exportRoot;
  if (!source) {
    throw new Error("当前没有可导出的机床模型（请先选择 SF-260H）");
  }

  const clone = prepareExportClone(source);

  if (format === "obj") {
    const exporter = new OBJExporter();
    const text = exporter.parse(clone);
    triggerDownload(new Blob([text], { type: "text/plain" }), `${filenameBase}.obj`);
    disposeExportClone(clone);
    return;
  }

  const exporter = new GLTFExporter();
  const result = await new Promise<ArrayBuffer>((resolve, reject) => {
    exporter.parse(
      clone,
      (gltf) => {
        if (gltf instanceof ArrayBuffer) resolve(gltf);
        else reject(new Error("GLB 导出失败"));
      },
      (err) => reject(err instanceof Error ? err : new Error(String(err))),
      { binary: true, onlyVisible: true },
    );
  });

  triggerDownload(new Blob([result], { type: "model/gltf-binary" }), `${filenameBase}.glb`);
  disposeExportClone(clone);
}

function disposeExportClone(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) m?.dispose?.();
  });
}
