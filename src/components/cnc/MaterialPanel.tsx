"use client";

import { useState } from "react";
import { Palette, Check } from "lucide-react";
import { MATERIAL_LIBRARY, type IsoMaterialGroup } from "@/lib/cnc/materials";
import { useSimStore } from "@/lib/cnc/store";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const ISO_GROUPS: { id: "All" | IsoMaterialGroup; label: string }[] = [
  { id: "All", label: "全部" },
  { id: "N（有色金属）", label: "N（有色金属）" },
  { id: "P（钢）", label: "P（钢）" },
  { id: "M（不锈钢）", label: "M（不锈钢）" },
  { id: "S（高温合金）", label: "S（高温合金）" },
  { id: "K（铸铁）", label: "K（铸铁）" },
  { id: "O（合成材料）", label: "O（合成材料）" },
];

const COOLANT_LABEL: Record<string, string> = {
  flood: "切削液",
  mist: "雾冷",
  air: "气冷",
  none: "关闭",
  off: "关闭",
};

export default function MaterialPanel() {
  const materialId = useSimStore((s) => s.materialId);
  const [selectedGroup, setSelectedGroup] = useState<"All" | IsoMaterialGroup>("All");

  const filteredMaterials = MATERIAL_LIBRARY.filter(
    (m) => selectedGroup === "All" || m.isoGroup === selectedGroup
  );

  return (
    <div className="flex h-full flex-col bg-[#0b0d10] text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-orange-500/15 text-orange-400">
            <Palette className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">ISO 材料目录</h2>
            <p className="text-[10px] text-slate-500">
              ISO 513 标准材料分类
            </p>
          </div>
        </div>
        <Badge variant="outline" className="border-orange-500/30 text-orange-300 text-[10px]">
          {MATERIAL_LIBRARY.length} 种材料
        </Badge>
      </div>

      {/* ISO Group Filters */}
      <div className="flex flex-wrap gap-1 border-b border-white/10 bg-[#0d0f13] px-3 py-2">
        {ISO_GROUPS.map((grp) => (
          <button
            key={grp.id}
            onClick={() => setSelectedGroup(grp.id)}
            className={cn(
              "rounded-md px-2 py-0.5 text-[10px] font-semibold transition-colors",
              selectedGroup === grp.id
                ? "bg-orange-500/20 text-orange-200 border border-orange-400/40"
                : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
            )}
          >
            {grp.label}
          </button>
        ))}
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto p-3 [scrollbar-width:thin]">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {filteredMaterials.map((m) => {
            const active = m.id === materialId;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => useSimStore.getState().setMaterial(m.id)}
                aria-pressed={active}
                className={cn(
                  "group relative flex flex-col rounded-md border p-2.5 text-left transition",
                  active
                    ? "border-cyan-400/60 bg-cyan-500/[0.08] shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                    : "border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                )}
              >
                <div className="flex items-center gap-2">
                  {/* PBR color swatch */}
                  <span
                    className="relative h-7 w-7 shrink-0 overflow-hidden rounded-md border border-white/20 shadow-inner"
                    style={{ background: m.color }}
                  >
                    <span
                      className="absolute inset-x-0 bottom-0 h-2"
                      style={{ background: m.sideColor }}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-slate-100">
                      {m.name}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {m.density} g/cm³ · Vc {m.surfaceSpeed} m/min
                    </div>
                  </div>
                  {active && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </div>

                <p className="mt-1.5 text-[10px] leading-snug text-slate-400">{m.notes}</p>

                <div className="mt-1.5 flex flex-wrap gap-1">
                  <Pill>最大切深 {m.maxDepthOfCut} mm</Pill>
                  <Pill>步进 {m.maxStepover}%</Pill>
                  <Pill>冷却液：{COOLANT_LABEL[m.coolant] ?? m.coolant}</Pill>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Pill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-mono font-medium text-slate-400",
        className
      )}
    >
      {children}
    </span>
  );
}
