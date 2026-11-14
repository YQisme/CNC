// CNC Simulator Pro — view/UI options store (separate from sim state)
"use client";

import { create } from "zustand";

export type CameraPreset = "iso" | "top" | "bottom" | "front" | "right" | "reset" | "focus";

export interface ViewState {
  showToolpath: boolean;
  showGrid: boolean;
  /** 显示整机外壳（SF-260 外形柜体）；关闭则完全隐藏 */
  showShell: boolean;
  /** SF-260：防护门关/开；其它机型：简易护罩 */
  showEnclosure: boolean;
  showAxes: boolean;
  /** 爆炸视图强度 0..1（滑动条） */
  explodeAmount: number;
  resetKey: number; // bump to remount canvas (resets camera)
  cameraPreset: CameraPreset | null; // set to trigger camera move
  cameraNonce: number; // bump to re-apply same preset
  resetView: () => void;
  setCameraPreset: (p: CameraPreset) => void;
  setExplodeAmount: (amount: number) => void;
  toggle: (k: "showToolpath" | "showGrid" | "showShell" | "showEnclosure" | "showAxes") => void;
}

export const useViewStore = create<ViewState>((set) => ({
  showToolpath: true,
  showGrid: true,
  showShell: true,
  showEnclosure: true,
  showAxes: true,
  explodeAmount: 0,
  resetKey: 0,
  cameraPreset: null,
  cameraNonce: 0,
  resetView: () => set((s) => ({ resetKey: s.resetKey + 1 })),
  setCameraPreset: (p) =>
    set((s) => ({ cameraPreset: p, cameraNonce: s.cameraNonce + 1 })),
  setExplodeAmount: (amount) =>
    set({ explodeAmount: Math.min(1, Math.max(0, amount)) }),
  toggle: (k) => set((s) => ({ [k]: !s[k] }) as Partial<ViewState>),
}));
