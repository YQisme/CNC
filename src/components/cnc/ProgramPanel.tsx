"use client";

import { useCallback, useMemo, useRef } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Cpu,
  Layers,
  Ruler,
  CircleAlert,
  Upload,
} from "lucide-react";
import { useSimStore } from "@/lib/cnc/store";
import { CNC_EXAMPLES } from "@/lib/cnc/examples";
import {
  GCODE_FILE_ACCEPT,
  importProgramFile,
} from "@/lib/cnc/programStore";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import GCodeEditor from "./GCodeEditor";

const DIFFICULTY_COLOR: Record<string, string> = {
  入门: "#34d399",
  进阶: "#f59e0b",
  高级: "#fb7185",
};

export default function ProgramPanel() {
  const { toast } = useToast();
  const exampleId = useSimStore((s) => s.exampleId);
  const loadExample = useSimStore((s) => s.loadExample);
  const workpiece = useSimStore((s) => s.workpiece);
  const parseErrors = useSimStore((s) => s.parseErrors);
  const parseWarnings = useSimStore((s) => s.parseWarnings);
  const cycleTimeSec = useSimStore((s) => s.cycleTimeSec);
  const parseResult = useSimStore((s) => s.parseResult);
  const setSource = useSimStore((s) => s.setSource);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentExample = useMemo(
    () => CNC_EXAMPLES.find((e) => e.id === exampleId),
    [exampleId],
  );

  const moveCount = parseResult?.moves.length ?? 0;
  const cutMoves = useMemo(
    () =>
      parseResult?.moves.filter(
        (m) => m.type !== "rapid" && m.type !== "dwell",
      ).length ?? 0,
    [parseResult],
  );

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImportFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      try {
        const result = await importProgramFile(file);
        if (result.kind === "library") {
          toast({
            title: "程序库已导入",
            description:
              result.count > 0
                ? `已合并 ${result.count} 个程序到本地程序库（见「程序库」页）。`
                : "JSON 中未找到有效程序。",
          });
          return;
        }
        setSource(result.code, { programName: result.name });
        toast({
          title: "程序已导入",
          description: `「${result.name}」已载入编辑器（${result.code.length} 字符）。`,
        });
      } catch (err) {
        toast({
          title: "导入失败",
          description: err instanceof Error ? err.message : "无法读取文件。",
        });
      }
    },
    [setSource, toast],
  );

  return (
    <div className="flex h-full flex-col bg-[#0b0d10]">
      {/* program meta header */}
      <div className="border-b border-white/10 p-2">
        <div className="mb-1.5 flex items-center gap-2">
          <Select value={exampleId ?? "custom"} onValueChange={(v) => {
            if (v === "custom") {
              setSource("; 在此输入自定义 G-code\n");
            } else {
              loadExample(v);
            }
          }}>
            <SelectTrigger className="h-8 flex-1 border-white/10 bg-black/40 text-xs text-slate-200">
              <SelectValue placeholder="选择程序" />
            </SelectTrigger>
            <SelectContent className="max-h-72 border-white/10 bg-[#15181d] text-slate-200">
              {CNC_EXAMPLES.map((ex) => (
                <SelectItem
                  key={ex.id}
                  value={ex.id}
                  className="text-xs focus:bg-white/10"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: DIFFICULTY_COLOR[ex.difficulty] }}
                    />
                    {ex.name}
                  </span>
                </SelectItem>
              ))}
              <SelectItem value="custom" className="text-xs focus:bg-white/10">
                自定义（编辑器）
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleImportClick}
            className="h-8 shrink-0 border-cyan-500/40 bg-cyan-500/10 px-2 text-[11px] text-cyan-100 hover:bg-cyan-500/20"
            title="导入 G 代码或程序库 JSON"
          >
            <Upload className="size-3.5" />
            导入
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept={GCODE_FILE_ACCEPT}
            className="hidden"
            onChange={handleImportFile}
          />
          {currentExample && (
            <Badge
              variant="outline"
              className="shrink-0 border-white/10 text-[10px]"
              style={{ color: DIFFICULTY_COLOR[currentExample.difficulty] }}
            >
              {currentExample.difficulty}
            </Badge>
          )}
        </div>

        {currentExample?.description && (
          <p className="mb-2 text-[11px] leading-relaxed text-slate-400">
            {currentExample.description}
          </p>
        )}

        {/* stats row */}
        <div className="grid grid-cols-2 gap-1 text-[9px] mt-1.5">
          <Stat
            icon={Ruler}
            label="毛坯"
            value={`${workpiece.width}×${workpiece.depth}×${workpiece.height} mm`}
            color="#34d399"
          />
          <Stat
            icon={Cpu}
            label="刀具"
            value="Ø6 立铣刀"
            color="#a78bfa"
          />
          <Stat
            icon={Layers}
            label="程序段"
            value={`${moveCount}（${cutMoves} 切削）`}
            color="#22d3ee"
          />
          <Stat
            icon={Info}
            label="循环"
            value={`${cycleTimeSec.toFixed(1)} s`}
            color="#f59e0b"
          />
        </div>

        {/* diagnostics */}
        <div className="mt-1.5">
          {parseErrors.length > 0 ? (
            <DiagList
              kind="error"
              items={parseErrors}
            />
          ) : parseWarnings.length > 0 ? (
            <DiagList kind="warning" items={parseWarnings} />
          ) : (
            <div className="flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-2 py-1 text-[10px] text-emerald-300">
              <CheckCircle2 className="h-3 w-3" />
              程序解析成功 — 无错误或警告。
            </div>
          )}
        </div>
      </div>

      {/* editor */}
      <div className="relative min-h-0 flex-1">
        <GCodeEditor />
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-white/8 bg-white/[0.03] px-2 py-1">
      <Icon className="h-3 w-3 shrink-0" style={{ color }} />
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="text-[8px] uppercase tracking-wider text-slate-500">
          {label}
        </span>
        <span className="truncate font-mono text-[10px] font-semibold text-slate-200">
          {value}
        </span>
      </div>
    </div>
  );
}

function DiagList({
  kind,
  items,
}: {
  kind: "error" | "warning";
  items: { line: number; message: string }[];
}) {
  const isErr = kind === "error";
  return (
    <div
      className={cn(
        "max-h-24 overflow-y-auto rounded-md border px-2 py-1 text-[10px] [scrollbar-width:thin]",
        isErr
          ? "border-rose-500/20 bg-rose-500/5"
          : "border-amber-500/20 bg-amber-500/5",
      )}
    >
      <div
        className={cn(
          "mb-1 flex items-center gap-1.5 font-semibold",
          isErr ? "text-rose-300" : "text-amber-300",
        )}
      >
        {isErr ? (
          <CircleAlert className="h-3 w-3" />
        ) : (
          <AlertTriangle className="h-3 w-3" />
        )}
        {items.length} 条{isErr ? "错误" : "警告"}
      </div>
      {items.map((it, i) => (
        <div key={i} className="flex gap-1.5 py-0.5">
          <span
            className={cn(
              "font-mono font-bold",
              isErr ? "text-rose-400" : "text-amber-400",
            )}
          >
            L{it.line}
          </span>
          <span className="text-slate-400">{it.message}</span>
        </div>
      ))}
    </div>
  );
}
