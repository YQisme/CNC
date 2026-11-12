<!-- BEGIN:nextjs-agent-rules -->

## 这不是你熟悉的那个 Next.js

此版本包含破坏性变更 — API、约定与文件结构可能都与你的训练数据不同。在编写任何代码之前，请先阅读 `node_modules/next/dist/docs/` 中的相关指南（相对本文件所在目录解析；在 monorepo 中，从仓库根目录可能看不到 `next` 包）。请留意弃用提示。

本区块由 `next dev` 写入并会重新添加 — 可在 `node_modules/next/dist/server/lib/generate-agent-files.js` 中核实。若仅在 diff 中删除它，只会再次产生未提交的变更；将其随工作一并提交可保持工作区干净。

<!-- END:nextjs-agent-rules -->
