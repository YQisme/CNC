import * as THREE from "three";

/**
 * 由滑动条强度与外壳显隐推导外壳/内部爆炸量。
 * 有外壳：0→0.5 只炸外壳，0.5→1 再炸内部；
 * 外壳隐藏：整条滑轨只控制内部。
 */
export function explodeAmounts(amount: number, showShell: boolean) {
  const a = THREE.MathUtils.clamp(amount, 0, 1);
  if (!showShell) {
    return { shell: 0, internal: a };
  }
  const shell = Math.min(1, a / 0.5);
  const internal = Math.max(0, (a - 0.5) / 0.5);
  return { shell, internal };
}
