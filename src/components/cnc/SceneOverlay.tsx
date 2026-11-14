"use client";

import { useState } from "react";
import {
  Route,
  Grid3x3,
  Box,
  Eye,
  EyeOff,
  DoorOpen,
  Bomb,
  RefreshCw,
  Maximize2,
  Camera,
  ScanEye,
  ArrowDownUp,
  ArrowUpDown,
  Wrench,
  Cpu,
  Download,
} from "lucide-react";
import { useViewStore, type CameraPreset } from "@/lib/cnc/viewStore";
import { useSimStore } from "@/lib/cnc/store";
import { MACHINE_CATALOG, type MachineType } from "@/lib/cnc/machines";
import { downloadMachineModel, type ExportFormat } from "@/lib/cnc/exportModel";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function ToggleBtn({
  active,
  onClick,
  tooltip,
  children,
}: {
  active: boolean;
  onClick: () => void;
  tooltip: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md border transition-colors",
            active
              ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-200"
              : "border-white/10 bg-black/60 text-slate-400 hover:bg-white/10 hover:text-slate-200",
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" className="text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

const PRESETS: { id: CameraPreset; icon: React.ElementType; label: string }[] = [
  { id: "iso", icon: ScanEye, label: "等轴测视图" },
  { id: "top", icon: ArrowDownUp, label: "俯视图 (XY)" },
  { id: "bottom", icon: ArrowUpDown, label: "仰视图（底部检查）" },
  { id: "front", icon: Box, label: "前视图 (XZ)" },
  { id: "right", icon: Maximize2, label: "右视图 (YZ)" },
];

export default function SceneOverlay() {
  const showToolpath = useViewStore((s) => s.showToolpath);
  const showGrid = useViewStore((s) => s.showGrid);
  const showShell = useViewStore((s) => s.showShell);
  const showEnclosure = useViewStore((s) => s.showEnclosure);
  const explodeAmount = useViewStore((s) => s.explodeAmount);
  const toggle = useViewStore((s) => s.toggle);
  const setExplodeAmount = useViewStore((s) => s.setExplodeAmount);
  const setCameraPreset = useViewStore((s) => s.setCameraPreset);
  const programName = useSimStore((s) => s.programName);
  const tool = useSimStore((s) => s.tool);
  const machineId = useSimStore((s) => s.machineId);
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState<string | null>(null);

  const canExport = machineId === "sf260_5axis";

  const onExport = async (format: ExportFormat) => {
    if (!canExport || exporting) return;
    setExporting(true);
    setExportMsg(null);
    try {
      await downloadMachineModel(format, "SF-260H");
      setExportMsg(format === "glb" ? "已下载 GLB" : "已下载 OBJ");
    } catch (e) {
      setExportMsg(e instanceof Error ? e.message : "导出失败");
    } finally {
      setExporting(false);
      window.setTimeout(() => setExportMsg(null), 2800);
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      {/* top-left: machine type selector + program badge + active tool */}
      <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col gap-1.5">
        {/* Machine Type Selector */}
        <div className="pointer-events-auto flex items-center gap-2 rounded-md border border-cyan-500/30 bg-black/70 px-2.5 py-1.5 backdrop-blur shadow-lg">
          <Cpu className="h-4 w-4 text-cyan-400" />
          <select
            value={machineId}
            onChange={(e) => useSimStore.getState().setMachineId(e.target.value as MachineType)}
            className="bg-transparent font-mono text-xs font-bold text-slate-100 outline-none cursor-pointer"
          >
            {MACHINE_CATALOG.map((m) => (
              <option key={m.id} value={m.id} className="bg-[#12161f] text-slate-200">
                {m.shortName} ({m.category})
              </option>
            ))}
          </select>
        </div>

        <div className="pointer-events-auto flex items-center gap-2 rounded-md border border-white/10 bg-black/60 px-2.5 py-1.5 backdrop-blur">
          <Camera className="h-3.5 w-3.5 text-cyan-400" />
          <span className="max-w-[180px] truncate text-xs font-semibold text-slate-100">
            {programName}
          </span>
        </div>
        <div className="pointer-events-auto flex items-center gap-2 rounded-md border border-white/10 bg-black/60 px-2.5 py-1.5 backdrop-blur">
          <Wrench className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-[10px] font-mono text-slate-300">
            T{tool || 0} 当前刀具
          </span>
        </div>

        {canExport && (
          <div className="pointer-events-auto flex flex-col gap-1 rounded-md border border-white/10 bg-black/70 p-1.5 backdrop-blur shadow-lg">
            <div className="flex items-center gap-1.5 px-1 pb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              <Download className="h-3 w-3 text-cyan-400" />
              导出模型
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={exporting}
                onClick={() => onExport("glb")}
                className="flex-1 rounded border border-cyan-500/40 bg-cyan-500/15 px-2 py-1 font-mono text-[10px] font-semibold text-cyan-100 hover:bg-cyan-500/25 disabled:opacity-50"
              >
                GLB
              </button>
              <button
                type="button"
                disabled={exporting}
                onClick={() => onExport("obj")}
                className="flex-1 rounded border border-white/15 bg-white/5 px-2 py-1 font-mono text-[10px] font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-50"
              >
                OBJ
              </button>
            </div>
            {exportMsg && (
              <span className="px-1 text-[10px] text-emerald-300">{exportMsg}</span>
            )}
          </div>
        )}
      </div>

      {/* top-right: view toggles + camera presets */}
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5">
        <div className="flex flex-col gap-1.5">
          <ToggleBtn
            active={showToolpath}
            onClick={() => toggle("showToolpath")}
            tooltip="显示/隐藏 3D 刀具路径"
          >
            <Route className="h-4 w-4" />
          </ToggleBtn>
          <ToggleBtn
            active={showGrid}
            onClick={() => toggle("showGrid")}
            tooltip="显示/隐藏网格与比例"
          >
            <Grid3x3 className="h-4 w-4" />
          </ToggleBtn>
          {machineId === "sf260_5axis" ? (
            <>
              <ToggleBtn
                active={showShell}
                onClick={() => toggle("showShell")}
                tooltip={showShell ? "隐藏整机外壳" : "显示整机外壳"}
              >
                {showShell ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </ToggleBtn>
              {showShell && (
                <ToggleBtn
                  active={showEnclosure}
                  onClick={() => toggle("showEnclosure")}
                  tooltip={showEnclosure ? "打开防护门" : "关闭防护门"}
                >
                  <DoorOpen className="h-4 w-4" />
                </ToggleBtn>
              )}
            </>
          ) : (
            <ToggleBtn
              active={showEnclosure}
              onClick={() => toggle("showEnclosure")}
              tooltip="显示/隐藏护罩"
            >
              <Box className="h-4 w-4" />
            </ToggleBtn>
          )}
        </div>
        <div className="my-1 h-px w-full bg-white/10" />
        <div className="flex flex-col gap-1.5">
          {PRESETS.map((p) => (
            <ToggleBtn
              key={p.id}
              active={false}
              onClick={() => setCameraPreset(p.id)}
              tooltip={p.label}
            >
              <p.icon className="h-4 w-4" />
            </ToggleBtn>
          ))}
          <ToggleBtn
            active={false}
            onClick={() => setCameraPreset("reset")}
            tooltip="重置相机环视"
          >
            <RefreshCw className="h-4 w-4" />
          </ToggleBtn>
        </div>
      </div>

      {/* bottom-left: axis legend */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex items-center gap-3 rounded-md border border-white/10 bg-black/60 px-2.5 py-1.5 font-mono text-[10px] backdrop-blur">
        <span className="text-emerald-400 font-bold">■ X</span>
        <span className="text-cyan-400 font-bold">■ Y</span>
        <span className="text-green-400 font-bold">■ Z</span>
        <span className="ml-2 text-slate-400">
          <Maximize2 className="inline h-3 w-3" /> 拖动 360° · 滚轮缩放
        </span>
      </div>

      {/* bottom-right: horizontal explode slider */}
      {machineId === "sf260_5axis" && (
        <div
          className={cn(
            "pointer-events-auto absolute bottom-3 right-3 z-10 flex w-56 items-center gap-2 rounded-md border px-2.5 py-2 backdrop-blur",
            explodeAmount > 0.01
              ? "border-cyan-400/50 bg-cyan-500/15"
              : "border-white/10 bg-black/60",
          )}
          title={
            showShell
              ? "爆炸视图：0–50% 外壳，50–100% 全部展开"
              : "爆炸视图：拖动展开内部龙门与加工区"
          }
        >
          <Bomb
            className={cn(
              "h-3.5 w-3.5 shrink-0",
              explodeAmount > 0.01 ? "text-cyan-200" : "text-slate-400",
            )}
          />
          <span className="shrink-0 font-mono text-[10px] text-slate-400">爆炸</span>
          <Slider
            min={0}
            max={100}
            step={1}
            value={[Math.round(explodeAmount * 100)]}
            onValueChange={(v) => setExplodeAmount(v[0] / 100)}
            className="flex-1"
          />
          <span className="w-7 shrink-0 text-right font-mono text-[10px] tabular-nums text-slate-300">
            {Math.round(explodeAmount * 100)}
          </span>
        </div>
      )}
    </TooltipProvider>
  );
}
