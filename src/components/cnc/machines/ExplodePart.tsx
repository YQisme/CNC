"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, type ReactNode } from "react";
import * as THREE from "three";

/** 按 amount(0..1) 平滑偏移的爆炸分组 */
export default function ExplodePart({
  offset,
  amount,
  children,
  name,
}: {
  offset: readonly [number, number, number];
  amount: number;
  children: ReactNode;
  name?: string;
}) {
  const ref = useRef<THREE.Group>(null);
  const t = useRef(0);

  useFrame((_, dt) => {
    // 跟滑动条略有阻尼，避免拖动时抖动
    t.current = THREE.MathUtils.damp(t.current, amount, 14, dt);
    const g = ref.current;
    if (!g) return;
    g.position.set(offset[0] * t.current, offset[1] * t.current, offset[2] * t.current);
  });

  return (
    <group ref={ref} name={name}>
      {children}
    </group>
  );
}

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
