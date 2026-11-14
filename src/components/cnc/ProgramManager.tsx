"use client";

// CNC Simulator Pro — Program Manager
// localStorage-backed program library + code-snippet inserter.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Save,
  Download,
  Upload,
  Trash2,
  FilePlus,
  FolderOpen,
  FileCode,
  Plus,
} from "lucide-react";

import { useSimStore } from "@/lib/cnc/store";
import { useToast } from "@/hooks/use-toast";
import {
  listPrograms,
  saveProgram,
  deleteProgram,
  exportProgram,
  exportAllPrograms,
  importProgramFile,
  GCODE_FILE_ACCEPT,
  type SavedProgram,
} from "@/lib/cnc/programStore";
import { CODE_SNIPPETS, type Snippet } from "@/lib/cnc/snippets";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SNIPPET_CATEGORIES = [
  { id: "All", label: "全部" },
  { id: "程序头", label: "程序头" },
  { id: "型腔", label: "型腔" },
  { id: "钻孔", label: "钻孔" },
  { id: "轮廓", label: "轮廓" },
  { id: "精加工", label: "精加工" },
  { id: "平面", label: "平面" },
  { id: "实用", label: "实用" },
] as const;

const SNIPPET_CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  SNIPPET_CATEGORIES.map((c) => [c.id, c.label]),
);

function formatDate(ms: number): string {
  try {
    const d = new Date(ms);
    return d.toLocaleString("zh-CN", {
      year: "2-digit",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export default function ProgramManager() {
  const { toast } = useToast();

  // Editor / workpiece state from sim store
  const source = useSimStore((s) => s.source);
  const workpiece = useSimStore((s) => s.workpiece);
  const programName = useSimStore((s) => s.programName);

  const [programs, setPrograms] = useState<SavedProgram[]>([]);
  const [nameInput, setNameInput] = useState("");
  const [snippetCategory, setSnippetCategory] = useState<string>("All");
  const [deleteTarget, setDeleteTarget] = useState<SavedProgram | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [mounted, setMounted] = useState(false);

  const refresh = useCallback(() => {
    setPrograms(listPrograms());
  }, []);

  // Hydration guard — localStorage data must only render after mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    refresh();
  }, [refresh]);

  // Pre-fill name input with the current program name (only when empty)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!nameInput && programName) setNameInput(programName);
  }, [programName]);

  const handleSave = useCallback(() => {
    const name = (nameInput || "").trim() || programName || "未命名程序";
    const saved = saveProgram({
      name,
      code: source,
      workpiece: {
        width: workpiece.width,
        depth: workpiece.depth,
        height: workpiece.height,
      },
    });
    setNameInput(saved.name);
    refresh();
    toast({
      title: "程序已保存",
      description: `「${saved.name}」已本地存储（${saved.code.length} 字符）。`,
    });
  }, [nameInput, programName, source, workpiece, refresh, toast]);

  const handleLoad = useCallback(
    (p: SavedProgram) => {
      // Load code into the editor + apply the saved workpiece
      useSimStore.getState().setSource(p.code, { programName: p.name });
      useSimStore.getState().setWorkpiece({
        width: p.workpiece.width,
        depth: p.workpiece.depth,
        height: p.workpiece.height,
      });
      setNameInput(p.name);
      toast({
        title: "程序已加载",
        description: `「${p.name}」已载入编辑器。`,
      });
    },
    [toast],
  );

  const handleDownload = useCallback(
    (p: SavedProgram) => {
      exportProgram(p);
      toast({
        title: "开始下载",
        description: `${p.name}.nc`,
      });
    },
    [toast],
  );

  const handleExportAll = useCallback(() => {
    if (programs.length === 0) {
      toast({
        title: "无可导出内容",
        description: "程序库为空。",
      });
      return;
    }
    exportAllPrograms();
    toast({
      title: "正在导出程序库",
      description: `${programs.length} 个程序 → JSON。`,
    });
  }, [programs, toast]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImportFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = ""; // allow re-importing the same file later
      if (!file) return;
      try {
        const result = await importProgramFile(file);
        if (result.kind === "library") {
          refresh();
          toast({
            title: "导入完成",
            description:
              result.count > 0
                ? `已导入 ${result.count} 个程序到程序库。`
                : "文件中未找到有效程序。",
          });
          return;
        }
        useSimStore.getState().setSource(result.code, {
          programName: result.name,
        });
        setNameInput(result.name);
        toast({
          title: "G 代码已导入",
          description: `「${result.name}」已载入编辑器。可点「保存」写入程序库。`,
        });
      } catch (err) {
        toast({
          title: "导入失败",
          description: err instanceof Error ? err.message : "无法读取文件。",
        });
      }
    },
    [refresh, toast],
  );

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    const t = deleteTarget;
    deleteProgram(t.id);
    setDeleteTarget(null);
    refresh();
    toast({
      title: "程序已删除",
      description: `「${t.name}」已从程序库移除。`,
    });
  }, [deleteTarget, refresh, toast]);

  const handleInsertSnippet = useCallback(
    (s: Snippet) => {
      const cur = useSimStore.getState().source;
      const sep = cur.endsWith("\n") || cur.length === 0 ? "" : "\n";
      useSimStore.getState().setSource(cur + sep + "\n" + s.code);
      toast({
        title: "片段已插入",
        description: `「${s.name}」已追加到编辑器。`,
      });
    },
    [toast],
  );

  const visibleSnippets = useMemo(
    () =>
      snippetCategory === "All"
        ? CODE_SNIPPETS
        : CODE_SNIPPETS.filter((s) => s.category === snippetCategory),
    [snippetCategory],
  );

  return (
    <div className="flex h-full flex-col bg-[#0b0d10] text-slate-200">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <FolderOpen className="size-4 text-cyan-400" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          程序库
        </h3>
        <span className="ml-auto rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">
          {mounted ? `已保存 ${programs.length} 个` : "—"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4 cnc-scroll">
        {/* Save Current */}
        <section className="rounded-lg border border-white/10 bg-black/30 p-3">
          <div className="mb-2 flex items-center gap-2">
            <FilePlus className="size-3.5 text-cyan-400" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">
              保存当前程序
            </span>
          </div>
          <div className="flex gap-2">
            <Input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="程序名称…"
              className="h-8 flex-1 border-white/10 bg-black/50 text-xs text-slate-100 placeholder:text-slate-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
            />
            <Button
              size="sm"
              onClick={handleSave}
              className="h-8 bg-cyan-500 text-black hover:bg-cyan-400"
            >
              <Save className="size-3.5" />
              保存
            </Button>
          </div>
          <p className="mt-1.5 text-[10px] text-slate-500">
            将编辑器内容与当前工件（
            {workpiece.width}×{workpiece.depth}×{workpiece.height} mm）以给定名称存储。
            使用已有名称保存会原地更新。
          </p>
        </section>

        {/* Library list */}
        <section className="rounded-lg border border-white/10 bg-black/30 p-3">
          <div className="mb-2 flex items-center gap-2">
            <FileCode className="size-3.5 text-orange-400" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">
              已保存程序
            </span>
          </div>

          {mounted && programs.length === 0 ? (
            <div className="rounded-md border border-dashed border-white/10 bg-black/20 px-3 py-6 text-center">
              <FileCode className="mx-auto mb-2 size-5 text-slate-600" />
              <p className="text-[11px] text-slate-500">
                暂无已保存程序。
                <br />
                在上方保存当前程序以开始建立程序库。
              </p>
            </div>
          ) : (
            <ul className="max-h-72 space-y-2 overflow-y-auto pr-1 cnc-scroll">
              {(mounted ? programs : []).map((p) => (
                <li
                  key={p.id}
                  className="group rounded-md border border-white/10 bg-white/[0.02] p-2 transition-colors hover:border-cyan-500/40 hover:bg-white/[0.04]"
                >
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium text-slate-100">
                        {p.name}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500">
                        <span>
                          {p.workpiece.width}×{p.workpiece.depth}×{p.workpiece.height} mm
                        </span>
                        <span className="text-slate-700">•</span>
                        <span>{p.code.length} 字符</span>
                        <span className="text-slate-700">•</span>
                        <span title={new Date(p.updatedAt).toISOString()}>
                          {formatDate(p.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleLoad(p)}
                      className="h-6 px-2 text-[10px] text-cyan-300 hover:bg-cyan-500/10 hover:text-cyan-200"
                    >
                      <FolderOpen className="size-3" />
                      加载
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(p)}
                      className="h-6 px-2 text-[10px] text-slate-300 hover:bg-white/10"
                    >
                      <Download className="size-3" />
                      .nc
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteTarget(p)}
                      className="h-6 px-2 text-[10px] text-orange-300 hover:bg-orange-500/10 hover:text-orange-200"
                    >
                      <Trash2 className="size-3" />
                      删除
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Export / Import */}
          <div className="mt-3 flex flex-wrap gap-2 border-t border-white/10 pt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportAll}
              className="h-7 border-white/10 bg-transparent text-[10px] text-slate-300 hover:bg-white/10"
            >
              <Download className="size-3" />
              全部导出 (JSON)
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleImportClick}
              className="h-7 border-cyan-500/40 bg-cyan-500/10 text-[10px] text-cyan-100 hover:bg-cyan-500/20"
            >
              <Upload className="size-3" />
              导入程序
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept={GCODE_FILE_ACCEPT}
              className="hidden"
              onChange={handleImportFile}
            />
          </div>
        </section>

        {/* Snippets */}
        <section className="rounded-lg border border-white/10 bg-black/30 p-3">
          <div className="mb-2 flex items-center gap-2">
            <Plus className="size-3.5 text-cyan-400" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">
              插入代码片段
            </span>
          </div>
          <Select value={snippetCategory} onValueChange={setSnippetCategory}>
            <SelectTrigger className="mb-2 h-8 w-full border-white/10 bg-black/50 text-xs text-slate-200">
              <SelectValue placeholder="分类" />
            </SelectTrigger>
            <SelectContent className="max-h-72 border-white/10 bg-[#15181d] text-slate-200">
              {SNIPPET_CATEGORIES.map((c) => (
                <SelectItem
                  key={c.id}
                  value={c.id}
                  className="text-xs focus:bg-white/10"
                >
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ul className="space-y-1.5">
            {visibleSnippets.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => handleInsertSnippet(s)}
                  className="w-full rounded-md border border-white/10 bg-white/[0.02] px-2.5 py-2 text-left transition-colors hover:border-cyan-500/40 hover:bg-cyan-500/[0.06]"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-cyan-500/15 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-cyan-300">
                      {SNIPPET_CATEGORY_LABEL[s.category] ?? s.category}
                    </span>
                    <span className="truncate text-xs font-medium text-slate-100">
                      {s.name}
                    </span>
                    <Plus className="ml-auto size-3 shrink-0 text-slate-500 group-hover:text-cyan-300" />
                  </div>
                  <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-slate-500">
                    {s.description}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent className="border-white/10 bg-[#15181d] text-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-100">
              删除程序？
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              将永久从本地程序库移除{" "}
              <span className="font-medium text-orange-300">
                「{deleteTarget?.name}」
              </span>
              。此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-transparent text-slate-300 hover:bg-white/10">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-orange-500 text-black hover:bg-orange-400"
            >
              <Trash2 className="size-3.5" />
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
