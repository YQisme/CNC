// Compatibility re-exports — simulation state lives in Pinia
export type { Workpiece, MachineMode } from "./types";
export {
  useSimStore,
  selectProgress,
  estimateCycleTime,
} from "@/stores/sim";
