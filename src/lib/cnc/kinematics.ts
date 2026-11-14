// SF-260 摇篮式双转台（A 绕机床 X，C 在摇篮上绕台面法向）正运动学

import * as THREE from "three";
import type { MachinePose, Vec3 } from "./types";

/** 转台等效半径（mm），用于把角度行程折算进给时间 */
export const ROTARY_PATH_RADIUS_MM = 80;

export function rotaryPathLength(dA: number, dC: number): number {
  const rad = (Math.hypot(dA, dC) * Math.PI) / 180;
  return rad * ROTARY_PATH_RADIUS_MM;
}

/**
 * 工件坐标系刀尖 → 世界坐标（Three.js：Y 向上，CNC Y → -Z）
 * 变换顺序：先 C（台面），再 A（摇篮），与实体转台嵌套一致。
 */
export function workpieceToWorld(
  tip: Vec3,
  rotary: { a: number; c: number },
  out = new THREE.Vector3(),
): THREE.Vector3 {
  out.set(tip.x, tip.z, -tip.y);
  out.applyAxisAngle(_Y, THREE.MathUtils.degToRad(rotary.c));
  out.applyAxisAngle(_X, THREE.MathUtils.degToRad(rotary.a));
  return out;
}

const _X = new THREE.Vector3(1, 0, 0);
const _Y = new THREE.Vector3(0, 1, 0);

/** 从姿态得到 Three 世界坐标刀尖 */
export function poseTipWorld(pose: MachinePose, out = new THREE.Vector3()): THREE.Vector3 {
  return workpieceToWorld(pose, { a: pose.a, c: pose.c }, out);
}
