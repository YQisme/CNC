import { defineStore } from "pinia";

export type CameraPreset =
  | "iso"
  | "top"
  | "bottom"
  | "front"
  | "right"
  | "reset"
  | "focus";

export type ViewToggleKey =
  | "showToolpath"
  | "showGrid"
  | "showShell"
  | "showEnclosure"
  | "showAxes";

export const useViewStore = defineStore("view", {
  state: () => ({
    showToolpath: true,
    showGrid: true,
    showShell: true,
    showEnclosure: true,
    showAxes: true,
    explodeAmount: 0,
    resetKey: 0,
    cameraPreset: null as CameraPreset | null,
    cameraNonce: 0,
  }),
  actions: {
    resetView() {
      this.resetKey += 1;
    },
    setCameraPreset(p: CameraPreset) {
      this.cameraPreset = p;
      this.cameraNonce += 1;
    },
    setExplodeAmount(amount: number) {
      this.explodeAmount = Math.min(1, Math.max(0, amount));
    },
    toggle(k: ViewToggleKey) {
      this[k] = !this[k];
    },
  },
});
