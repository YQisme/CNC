"use client";

import { useState } from "react";
import { Wrench } from "lucide-react";
import { TOOL_LIBRARY, type ToolType, type OperationCategory } from "@/lib/cnc/tools";
import { useSimStore } from "@/lib/cnc/store";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const TYPE_LABEL: Record<ToolType, string> = {
  end_mill: "立铣刀",
  ball_nose: "球头刀",
  bull_nose: "圆鼻刀",
  roughing_end_mill: "粗铣刀",
  drill: "麻花钻",
  spot_drill: "定心钻",
  reamer: "铰刀",
  chamfer: "倒角刀",
  face_mill: "面铣刀",
  fly_cutter: "飞刀",
  tap: "机用丝锥",
  thread_mill: "螺纹铣刀",
  lathe_turning: "外圆车削",
  lathe_finishing: "外圆精车",
  lathe_threading: "车螺纹",
  lathe_grooving: "切断/切槽",
  lathe_boring: "内孔镗削",
  carving_tapered: "3D 锥度刀",
};
void TYPE_LABEL;

const CATEGORIES: { id: "All" | OperationCategory; label: string }[] = [
  { id: "All", label: "全部" },
  { id: "铣削", label: "铣削" },
  { id: "钻孔", label: "钻孔" },
  { id: "孔加工", label: "孔加工" },
  { id: "精加工", label: "精加工" },
  { id: "车削", label: "车削" },
];

export default function ToolManager() {
  const currentTool = useSimStore((s) => s.tool);
  const parseResult = useSimStore((s) => s.parseResult);
  const [selectedCategory, setSelectedCategory] = useState<"All" | OperationCategory>("All");

  // track tools used in current program
  const usedTools = new Set<number>();
  if (parseResult) {
    for (const m of parseResult.moves) {
      if (m.tool > 0) usedTools.add(m.tool);
    }
  }

  const filteredTools = TOOL_LIBRARY.filter(
    (t) => selectedCategory === "All" || t.category === selectedCategory
  );

  return (
    <div className="h-full overflow-y-auto bg-[#0b0d10] p-3 [scrollbar-width:thin]">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-slate-100">ISO 刀具库</h3>
        </div>
        <Badge variant="secondary" className="bg-amber-500/10 text-amber-300 border-amber-500/20 text-[10px]">
          {TOOL_LIBRARY.length} 把标准刀具
        </Badge>
      </div>

      <p className="mb-3 text-[11px] leading-relaxed text-slate-400">
        国际 ISO 13399 与 ANSI 标准刀具目录。选择任意刀具可查看几何与加工参数。程序通过{" "}
        <code className="text-amber-300 font-mono">T&lt;n&gt; M06</code> 调用刀具。
      </p>

      {/* Category Tabs */}
      <div className="mb-3 flex flex-wrap gap-1 border-b border-white/10 pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              "rounded-md px-2 py-1 text-[10px] font-semibold transition-colors",
              selectedCategory === cat.id
                ? "bg-cyan-500/20 text-cyan-200 border border-cyan-400/40"
                : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tool Cards */}
      <div className="space-y-2">
        {filteredTools.map((t) => {
          const active = currentTool === t.number;
          const used = usedTools.has(t.number);
          return (
            <div
              key={t.number}
              className={cn(
                "group relative rounded-lg border p-2.5 transition-colors",
                active
                  ? "border-amber-400/60 bg-amber-500/10 shadow-[0_0_14px_rgba(245,158,11,0.2)]"
                  : used
                    ? "border-cyan-500/40 bg-cyan-500/5"
                    : "border-white/8 bg-white/[0.02] hover:border-white/15"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Tool Color Swatch & Number Badge */}
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/20 font-mono text-xs font-bold text-slate-100 shadow"
                    style={{ background: `linear-gradient(135deg, ${t.color}44, ${t.color}aa)` }}
                  >
                    T{t.number}
                  </div>
                  <span className="text-[8px] font-mono text-slate-500 uppercase">{t.category[0]}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="truncate text-xs font-bold text-slate-100">
                      {t.name}
                    </span>
                    <span className="rounded bg-white/5 px-1 py-0.2 font-mono text-[9px] text-slate-400">
                      {t.isoCode}
                    </span>

                    {active && (
                      <Badge className="ml-auto bg-amber-500/30 text-[9px] text-amber-200">
                        当前
                      </Badge>
                    )}
                    {used && !active && (
                      <Badge
                        variant="outline"
                        className="ml-auto border-cyan-500/30 text-[9px] text-cyan-300"
                      >
                        程序中
                      </Badge>
                    )}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] text-slate-400 font-mono">
                    <span className="text-cyan-400">Ø{t.diameter}mm</span>
                    <span>刃数: {t.flutes}</span>
                    <span>L: {t.length}mm</span>
                    <span>刀柄: Ø{t.shankDiameter}mm</span>
                    {t.cornerRadius && <span>R{t.cornerRadius}mm</span>}
                    {t.pointAngle && <span>{t.pointAngle}°</span>}
                  </div>

                  <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
                    {t.description}
                  </p>

                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Mini label="Vc" value={`${t.surfaceSpeed} m/min`} />
                    <Mini label="fz" value={`${t.chipLoad} mm`} />
                    <Mini label="类别" value={t.category} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-white/8 bg-black/40 px-1.5 py-0.5 font-mono text-[9px]">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-300">{value}</span>
    </span>
  );
}
