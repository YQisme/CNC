import { defineStore } from "pinia";
import { parseGCode, samplePose, estimateCycleTime } from "@/lib/cnc/parser";
import type {
  Move,
  OriginDatum,
  ParseResult,
  RotaryAxes,
  Vec3,
  Workpiece,
  MachineMode,
} from "@/lib/cnc/types";
import type { MachineType } from "@/lib/cnc/machines";
import { CNC_EXAMPLES, type CncExample } from "@/lib/cnc/examples";

const RAPID_FEED = 8000;

function moveTimeSec(m: Move): number {
  if (m.type === "dwell") return m.dwell ?? 0;
  if (m.length <= 0) return 0;
  const feed = m.type === "rapid" ? RAPID_FEED : m.feed > 0 ? m.feed : 100;
  return (m.length / feed) * 60;
}

interface Cumulative {
  times: number[];
  cum: number[];
  total: number;
}

function buildCumulative(moves: Move[]): Cumulative {
  const times = moves.map(moveTimeSec);
  const cum: number[] = [];
  let acc = 0;
  for (const t of times) {
    cum.push(acc);
    acc += t;
  }
  return { times, cum, total: acc };
}

function telemetryAt(moves: Move[], index: number, t: number) {
  if (moves.length === 0) {
    return {
      position: { x: 0, y: 0, z: 0 } as Vec3,
      rotary: { a: 0, c: 0 } as RotaryAxes,
      spindleRpm: 0,
      spindleOn: false,
      spindleDir: 1 as 1 | -1,
      feed: 0,
      tool: 0,
      coolant: "off" as const,
      isCutting: false,
      currentLine: 0,
    };
  }
  const idx = Math.min(Math.max(index, 0), moves.length - 1);
  const m = moves[idx];
  const pose = samplePose(m, t);
  const isCutting =
    m.type !== "rapid" && m.type !== "dwell" && pose.z < -0.01;
  return {
    position: { x: pose.x, y: pose.y, z: pose.z },
    rotary: { a: pose.a, c: pose.c },
    spindleRpm: m.spindle,
    spindleOn: m.spindleOn,
    spindleDir: m.spindleDir,
    feed: m.feed,
    tool: m.tool,
    coolant: m.coolant,
    isCutting,
    currentLine: m.line,
  };
}

function applyProgram(source: string, workpiece: Workpiece) {
  const parseResult = parseGCode(source);
  const cumulative = buildCumulative(parseResult.moves);
  const cycleTimeSec = cumulative.total;
  const tel = telemetryAt(parseResult.moves, 0, 0);
  return {
    source,
    parseResult,
    cumulative,
    cycleTimeSec,
    currentMoveIndex: 0,
    currentT: 0,
    elapsedTimeSec: 0,
    ...tel,
    parseErrors: parseResult.errors,
    parseWarnings: parseResult.warnings,
    workpiece,
  };
}

const initialWorkpiece: Workpiece = {
  width: CNC_EXAMPLES[0].workpiece.width,
  depth: CNC_EXAMPLES[0].workpiece.depth,
  height: CNC_EXAMPLES[0].workpiece.height,
};

const initialParsed = parseGCode(CNC_EXAMPLES[0].code);
const initialCumulative = buildCumulative(initialParsed.moves);
const initialTel = telemetryAt(initialParsed.moves, 0, 0);

export type { Workpiece, MachineMode };

export const useSimStore = defineStore("sim", {
  state: () => ({
    exampleId: CNC_EXAMPLES[0].id as string | null,
    source: CNC_EXAMPLES[0].code,
    programName: CNC_EXAMPLES[0].name,
    parseResult: initialParsed as ParseResult | null,
    workpiece: initialWorkpiece as Workpiece,
    originDatum: "center" as OriginDatum,
    machineId: "sf260_5axis" as MachineType,
    materialId: "aluminum-6061",
    playing: false,
    speed: 1,
    feedOverride: 100,
    rapidOverride: 100,
    spindleOverride: 100,
    singleBlock: false,
    optionalStop: true,
    blockSkip: true,
    machineMode: "run" as MachineMode,
    currentMoveIndex: 0,
    currentT: 0,
    cumulative: initialCumulative,
    cycleTimeSec: initialCumulative.total,
    elapsedTimeSec: 0,
    ...initialTel,
    parseErrors: initialParsed.errors,
    parseWarnings: initialParsed.warnings,
  }),

  getters: {
    progress(state): number {
      if (state.cycleTimeSec <= 0) return 0;
      return Math.min(state.elapsedTimeSec / state.cycleTimeSec, 1);
    },
  },

  actions: {
    loadExample(id: string) {
      const ex = CNC_EXAMPLES.find((e) => e.id === id) as CncExample | undefined;
      if (!ex) return;
      const patch = applyProgram(ex.code, {
        width: ex.workpiece.width,
        depth: ex.workpiece.depth,
        height: ex.workpiece.height,
      });
      const parseRes = patch.parseResult;
      let datum: OriginDatum = "center";
      if (!id.startsWith("sf260-") && parseRes?.bounds) {
        const { minX, minY } = parseRes.bounds;
        if (minX >= -5 && minY >= -5) datum = "front_left";
      }
      this.exampleId = id;
      this.programName = ex.name;
      this.playing = false;
      this.originDatum = datum;
      if (id.startsWith("sf260-")) this.machineId = "sf260_5axis";
      Object.assign(this, patch);
    },

    setSource(code: string, opts?: { keepPlay?: boolean; programName?: string }) {
      const patch = applyProgram(code, this.workpiece);
      const parseRes = patch.parseResult;
      let datum: OriginDatum = this.originDatum;
      let newWorkpiece = this.workpiece;
      if (parseRes?.bounds) {
        const { minX, maxX, minY, maxY, minZ } = parseRes.bounds;
        if (minX >= -5 && minY >= -5) {
          datum = "front_left";
          newWorkpiece = {
            width: Math.max(100, Math.ceil(maxX + 25)),
            depth: Math.max(100, Math.ceil(maxY + 25)),
            height: Math.max(20, Math.ceil(Math.abs(Math.min(0, minZ)) + 10)),
          };
        }
      }
      this.exampleId = null;
      this.programName = (opts?.programName ?? "").trim() || "自定义程序";
      this.playing = opts?.keepPlay ? this.playing : false;
      this.originDatum = datum;
      this.workpiece = newWorkpiece;
      Object.assign(this, patch);
    },

    setWorkpiece(w: Partial<Workpiece>) {
      this.workpiece = { ...this.workpiece, ...w };
    },

    setOriginDatum(datum: OriginDatum) {
      this.originDatum = datum;
    },

    setMachineId(id: MachineType) {
      this.machineId = id;
    },

    autoFitWorkpiece() {
      if (!this.parseResult || this.parseResult.moves.length === 0) return;
      const { minX, maxX, minY, maxY, minZ } = this.parseResult.bounds;
      const depthCut = Math.abs(Math.min(0, minZ));
      const isFL = this.originDatum === "front_left";
      let newW: number;
      let newD: number;
      const newH = Math.max(20, Math.ceil(depthCut + 10));
      if (isFL) {
        newW = Math.max(80, Math.ceil(Math.max(maxX + 25, maxX - minX + 30)));
        newD = Math.max(80, Math.ceil(Math.max(maxY + 25, maxY - minY + 30)));
      } else {
        const maxAbsX = Math.max(Math.abs(minX), Math.abs(maxX));
        const maxAbsY = Math.max(Math.abs(minY), Math.abs(maxY));
        newW = Math.max(80, Math.ceil(maxAbsX * 2 + 30));
        newD = Math.max(80, Math.ceil(maxAbsY * 2 + 30));
      }
      this.workpiece = { width: newW, depth: newD, height: newH };
    },

    play() {
      if (!this.parseResult || this.parseResult.moves.length === 0) return;
      if (
        this.currentMoveIndex >= this.parseResult.moves.length - 1 &&
        this.currentT >= 1
      ) {
        this.currentMoveIndex = 0;
        this.currentT = 0;
        this.elapsedTimeSec = 0;
      }
      this.playing = true;
    },

    pause() {
      this.playing = false;
    },

    toggle() {
      if (this.playing) this.pause();
      else this.play();
    },

    reset() {
      this.playing = false;
      this.currentMoveIndex = 0;
      this.currentT = 0;
      this.elapsedTimeSec = 0;
      if (this.parseResult) {
        Object.assign(this, telemetryAt(this.parseResult.moves, 0, 0));
      }
    },

    stepForward() {
      if (!this.parseResult) return;
      const moves = this.parseResult.moves;
      let next = this.currentMoveIndex + 1;
      if (next >= moves.length) next = moves.length - 1;
      const tel = telemetryAt(moves, next, 0);
      this.playing = false;
      this.currentMoveIndex = next;
      this.currentT = 0;
      this.elapsedTimeSec = this.cumulative.cum[next] ?? 0;
      Object.assign(this, tel);
    },

    stepBackward() {
      if (!this.parseResult) return;
      const moves = this.parseResult.moves;
      let prev = this.currentMoveIndex - 1;
      if (prev < 0) prev = 0;
      const tel = telemetryAt(moves, prev, 0);
      this.playing = false;
      this.currentMoveIndex = prev;
      this.currentT = 0;
      this.elapsedTimeSec = this.cumulative.cum[prev] ?? 0;
      Object.assign(this, tel);
    },

    jumpToMove(index: number) {
      if (!this.parseResult) return;
      const moves = this.parseResult.moves;
      const idx = Math.min(Math.max(index, 0), moves.length - 1);
      const tel = telemetryAt(moves, idx, 0);
      this.currentMoveIndex = idx;
      this.currentT = 0;
      this.elapsedTimeSec = this.cumulative.cum[idx] ?? 0;
      Object.assign(this, tel);
    },

    seek(progress: number) {
      if (!this.parseResult || this.parseResult.moves.length === 0) return;
      const p = Math.min(Math.max(progress, 0), 1);
      const target = p * this.cumulative.total;
      const cum = this.cumulative.cum;
      let idx = 0;
      for (let i = 0; i < cum.length; i++) {
        if (cum[i] <= target + 1e-6) idx = i;
        else break;
      }
      const moveStart = cum[idx] ?? 0;
      const moveDur = this.cumulative.times[idx] ?? 0;
      const t = moveDur > 0 ? (target - moveStart) / moveDur : 0;
      const tel = telemetryAt(this.parseResult.moves, idx, Math.min(t, 1));
      this.playing = false;
      this.currentMoveIndex = idx;
      this.currentT = Math.min(t, 1);
      this.elapsedTimeSec = target;
      Object.assign(this, tel);
    },

    setSpeed(sp: number) {
      this.speed = sp;
    },
    setFeedOverride(v: number) {
      this.feedOverride = Math.min(200, Math.max(0, Math.round(v)));
    },
    setRapidOverride(v: number) {
      this.rapidOverride = Math.min(100, Math.max(0, Math.round(v)));
    },
    setSpindleOverride(v: number) {
      this.spindleOverride = Math.min(200, Math.max(0, Math.round(v)));
    },
    toggleSingleBlock() {
      this.singleBlock = !this.singleBlock;
    },
    toggleOptionalStop() {
      this.optionalStop = !this.optionalStop;
    },
    toggleBlockSkip() {
      this.blockSkip = !this.blockSkip;
    },
    setMachineMode(m: MachineMode) {
      this.machineMode = m;
    },
    setMaterial(id: string) {
      this.materialId = id;
    },

    tick(dt: number) {
      if (!this.playing || !this.parseResult || this.parseResult.moves.length === 0)
        return;
      const moves = this.parseResult.moves;
      let idx = this.currentMoveIndex;
      let t = this.currentT;
      let elapsed = this.elapsedTimeSec;
      let budget = dt * this.speed;
      let finishedBlock = false;

      while (budget > 0 && idx < moves.length) {
        const m = moves[idx];
        const dur = this.cumulative.times[idx] ?? 0;
        const isRapid = m.type === "rapid";
        const factor =
          m.type === "dwell"
            ? 1
            : isRapid
              ? this.rapidOverride / 100
              : this.feedOverride / 100;
        if (dur <= 0) {
          if (m.type === "dwell") {
            const dwellDur = m.dwell ?? 0;
            const done = t * dwellDur;
            const left = dwellDur - done;
            const need = left / Math.max(factor, 0.0001);
            if (budget >= need) {
              budget -= need;
              elapsed += left;
              idx++;
              t = 0;
              if (this.singleBlock) {
                finishedBlock = true;
                break;
              }
              continue;
            } else {
              const adv = budget * factor;
              t = (done + adv) / dwellDur;
              elapsed += adv;
              budget = 0;
              break;
            }
          } else {
            idx++;
            t = 0;
            continue;
          }
        }
        const remainingInMove = dur * (1 - t);
        const need = remainingInMove / Math.max(factor, 0.0001);
        if (budget >= need) {
          budget -= need;
          elapsed += remainingInMove;
          idx++;
          t = 0;
          if (this.singleBlock) {
            finishedBlock = true;
            break;
          }
        } else {
          const adv = budget * factor;
          t += adv / dur;
          elapsed += adv;
          budget = 0;
          break;
        }
      }

      let playing: boolean = this.playing;
      if (idx >= moves.length) {
        idx = moves.length - 1;
        t = 1;
        playing = false;
      } else if (finishedBlock) {
        playing = false;
      }
      const tel = telemetryAt(moves, idx, t);
      this.currentMoveIndex = idx;
      this.currentT = t;
      this.elapsedTimeSec = elapsed;
      this.playing = playing;
      Object.assign(this, tel);
    },
  },
});

export function selectProgress(s: {
  cycleTimeSec: number;
  elapsedTimeSec: number;
}): number {
  if (s.cycleTimeSec <= 0) return 0;
  return Math.min(s.elapsedTimeSec / s.cycleTimeSec, 1);
}

export { estimateCycleTime };
