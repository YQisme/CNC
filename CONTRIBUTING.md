# 为 CNC 模拟器 Pro 做贡献

首先 — **感谢**你愿意抽时间参与贡献！🎉

CNC 模拟器 Pro 的目标是让 CNC 教育免费、人人可及。无论是缺陷报告、新示例程序、刀具定义、文档修正还是新功能，每一份贡献都在推动这一使命。

以下是贡献指南。请结合实际情况判断 — 这些是建议，不是硬性规则。

---

## 🚀 贡献者快速开始

```bash
# 1. Fork 并克隆
git clone https://github.com/<YOUR_USERNAME>/cnc.git
cd cnc

# 2. 安装依赖
bun install
# 或：npm install

# 3. 启动开发服务器
bun run dev    # → http://localhost:3000
# 或：npm run dev

# 4. 创建分支
git checkout -b fix/my-improvement
```

---

## 🐛 报告缺陷

一份好的缺陷报告能让修复更容易。在开 Issue 之前：

1. **搜索已有 Issue**，避免重复。
2. 先试用最新的 **`main`** 分支 — 问题可能已经修好。
3. 打开一份 [缺陷报告](https://github.com/rudra496/cnc/issues/new?labels=bug&template=bug_report.md)，并包含：
   - 你期望发生什么
   - 实际发生了什么
   - 复现步骤
   - 浏览器与操作系统（例如 Windows 11 上的 Chrome 125）
   - 相关的 G-code 程序（如有）
   - 截图或录屏（若为视觉问题）

---

## 💡 提出改进建议

有想法？请先 [发起讨论](https://github.com/rudra496/cnc/discussions) — 这是在写代码前评估兴趣的最佳方式。大致达成共识后，再开一份 [功能请求](https://github.com/rudra496/cnc/issues/new?labels=enhancement&template=feature_request.md)。

---

## 🔧 贡献方式

不一定要写代码才能帮忙！以下是很好的切入点：

### 轻松上手
- 📝 改进文档或 README
- 🌐 补充翻译或修正错别字
- 🎨 提出 UI/UX 改进建议
- 🧪 用不同 G-code 程序测试模拟器并反馈问题

### 代码贡献
- 🛠️ 修复一个 [缺陷](https://github.com/rudra496/cnc/issues?q=is:issue+label:bug)
- ➕ 在 `src/lib/cnc/examples.ts` 中新增**示例 G-code 程序**
- 🔧 在 `src/lib/cnc/tools.ts` 中新增**刀具定义**
- 🧱 在 `src/lib/cnc/materials.ts` 中新增**材料**
- 📖 扩展 `src/lib/cnc/reference.ts` 中的**代码参考**
- 🎯 改进 **G-code 解析器**（`src/lib/cnc/parser.ts`）以支持更多代码

### 关注这些标签
- [`good first issue`](https://github.com/rudra496/cnc/labels/good%20first%20issue) — 适合新手
- [`help wanted`](https://github.com/rudra496/cnc/labels/help%20wanted) — 欢迎社区协助
- [`enhancement`](https://github.com/rudra496/cnc/labels/enhancement) — 新功能

---

## 🧑‍💻 开发流程

1. **Fork** 仓库，并从 `main` 创建分支：
   ```bash
   git checkout -b feature/your-feature
   ```
2. **进行修改。** 保持提交聚焦，并写出清晰的提交说明。
3. **本地测试：**
   ```bash
   bun run lint     # 必须通过
   bun run build    # 必须成功（静态导出）
   ```
4. **推送**并针对 `main` 发起 Pull Request。
5. 关联相关 Issue（例如 `Closes #123`）。

### 代码风格

- 项目使用 **TypeScript** + **ESLint** + **Prettier** 默认配置。
- 遵循现有代码中的模式。
- 保持核心仿真逻辑（`src/lib/cnc/`）纯粹且类型完善。

---

## 📂 项目结构概览

| 路径 | 用途 |
|------|------|
| `src/lib/cnc/` | 核心仿真引擎 — 解析器、切削、状态、刀具、材料 |
| `src/components/cnc/` | UI 组件 — 3D 场景、编辑器、控制栏、面板 |
| `src/components/ui/` | shadcn/ui 基础组件 |
| `src/app/` | Next.js App Router 页面与布局 |
| `public/` | 静态资源、favicon、OG 图片 |
| `.github/workflows/` | CI 构建检查 + GitHub Pages 部署 |

> ℹ️ 核心机制（解析器、切削引擎、状态、刀具、材料）**稳定且经过充分测试**。修改这些文件时，优先做增量改动，避免大规模重写。

---

## 🏷️ Pull Request 检查清单

- [ ] 分支已与 `main` 同步
- [ ] `bun run lint` 通过
- [ ] `bun run build` 成功
- [ ] 代码遵循现有风格
- [ ] 提交说明清晰
- [ ] PR 描述说明了**做了什么**以及**为什么**
- [ ] 已关联相关 Issue

---

## 🤝 行为准则

参与本项目即表示你同意遵守我们的 [行为准则](./CODE_OF_CONDUCT.md)。请友善、尊重、建设性。我们都在这里，是为了让 CNC 学习变得更好。

---

再次感谢你的贡献！🛠️✨
