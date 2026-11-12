<div align="center">

<img src="./public/og-image.svg" alt="CNC 模拟器 Pro — 3D CNC 铣削与 G-code 模拟器" width="100%"/>

# 🛠️ CNC 模拟器 Pro

### 免费的浏览器端三轴 CNC 铣削模拟器，支持实时 G-code 动画

在浏览器中运行一台真实的 CNC 机床 — 随着 G-code 执行，在 3D 中观看材料被切削去除。无需安装、无需注册、无需付费。**100% 客户端运行。**

[![在线演示](https://img.shields.io/badge/🚀_在线演示-立即体验-22d3ee?style=for-the-badge)](https://rudra496.github.io/cnc/)
[![License: MIT](https://img.shields.io/badge/License-MIT-22d3ee?style=for-the-badge)](./LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/rudra496/cnc?style=for-the-badge&color=22d3ee&label=⭐%20STARS)](https://github.com/rudra496/cnc/stargazers)
[![Next.js](https://img.shields.io/badge/Next.js_16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-black?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**[🌐 在线演示](https://rudra496.github.io/cnc/)** · **[⭐ 给仓库加星](https://github.com/rudra496/cnc/stargazers)** · **[🐛 报告问题](https://github.com/rudra496/cnc/issues)** · **[💬 讨论区](https://github.com/rudra496/cnc/discussions)**

</div>

---

> ⚡ **一句话概括** — CNC 模拟器 Pro 是一款专业级、**免费开源**的 CNC 铣削模拟器，完全在浏览器中运行。具备高保真 3D 加工中心、实时 G-code 可视化、车间风格 DRO 控制栏、进给与转速计算器，以及完整的 G/M 代码与刀具管理学习套件。适合**学生、机械师、爱好者、教育者，以及任何正在学习 CNC 编程的人。**

基于 **Next.js 16**、**react-three-fiber**、**Three.js**、**TypeScript**、**Tailwind CSS 4** 和 **shadcn/ui** 构建，以静态站点形式部署到 **GitHub Pages**。

---

## 📑 目录

- [为什么选择 CNC 模拟器 Pro？](#-为什么选择-cnc-模拟器-pro)
- [功能特性](#-功能特性)
- [刀具库](#-刀具库8-把预配置刀具)
- [材料库](#-材料库8-种材料)
- [进给与转速计算器](#-进给与转速计算器)
- [立即体验](#-立即体验)
- [截图](#-截图)
- [部署到 GitHub Pages](#-部署到-github-pages)
- [本地开发](#-本地开发)
- [键盘快捷键](#-键盘快捷键)
- [项目结构](#-项目结构)
- [技术栈](#-技术栈)
- [路线图](#-路线图)
- [参与贡献](#-参与贡献)
- [社区与支持](#-社区与支持)
- [许可证](#-许可证)

---

## 💡 为什么选择 CNC 模拟器 Pro？

商业 CNC 仿真软件动辄**数千美元**，还需要高性能硬件。CNC 模拟器 Pro 的理念是：**学习 CNC 应当免费、人人可及**。

| | CNC 模拟器 Pro | 商业软件 |
|---|---|---|
| **价格** | 💯 永久免费 | 💸 昂贵 |
| **安装** | 无需安装 — 浏览器即可运行 | 沉重的桌面应用 |
| **平台** | 任意有浏览器的设备 | 仅 Windows/Linux |
| **源代码** | 开源（MIT） | 闭源 |
| **真实 3D 切削** | ✅ 有 | ✅ 有 |
| **G-code 学习** | ✅ 65 条代码参考 | 因产品而异 |

**面向人群：**
- 🎓 **学生** — 学习 CNC 编程、制造或机电一体化
- 👨‍🏫 **教育者** — 讲授加工、G-code 或 CAM 概念
- 🔧 **机械师与工程师** — 原型验证与刀路校验
- 🛠️ **爱好者与创客** — 购机前先探索 CNC
- 💻 **开发者** — 研究基于 Three.js 的实时 3D 仿真

---

## ✨ 功能特性

### 🎯 3D 机床与仿真
- **高保真龙门立加（VMC）** — 机座、T 型槽工作台、立柱、移动横梁（Y）、滑鞍（X）、伸缩主轴套筒（Z）、主轴电机、安全玻璃护罩
- **真实材料去除** — 细分高度图工件，刀具随程序走刀时被*真正铣削*
- **按刀具几何渲染** — 立铣刀、球头刀、钻头、倒角刀、面铣刀、定心钻、铰刀等，各自真实外形与直径切削
- **实时刀路** — 青色进给 + 琥珀色虚线快速移动，含圆弧细分
- **PBR 材质、柔和阴影、环境反射、雾效、无限网格**
- **相机预设** — 等轴测 / 俯视 / 前视 / 右视 / 重置，以及环视 / 缩放

### 🎛️ 独特的高级控制栏
- **液晶风格 DRO** — 实时 X / Y / Z 坐标与切削指示
- **状态灯** — 主轴转速、进给、当前刀具、冷却液
- **传输控制** — 复位、后退一步、播放/暂停、前进一步、单段运行
- **机床模式** — **运行**（完整切削）/ **干运行**（不切削材料）/ **机床锁定**（仅预览刀路）
- **选择停止（M01）** 与 **跳过程序段（/）** 开关
- **时间轴 scrubber** — 已用/剩余循环时间 + 程序段计数
- **循环速度** — 0.25× 至 10× 预设
- **倍率旋钮** — 进给 / 快速 / 主轴 % 滑块，真实影响节拍
- **键盘快捷键** — `Space` 播放/暂停，`←/→` 单步，`R` 复位

### 💻 手动 G-code 编程
- **完整代码编辑器**，带语法高亮（G/M/T/F/S/X/Y/Z/I/J 分色）
- **行号 + 当前执行行跟踪**（高亮 3D 中正在运行的程序段）
- **点击行跳转** — 点击任意行即可将仿真跳到该程序段
- **解析诊断** — 错误与警告按行号内联显示
- **26 个即开即用示例程序**（入门 → 高级）：圆形型腔、方形型腔、钻孔、心形、螺旋、"HI" 雕刻、网格型腔、齿轮、星形、花朵、平面、六边形型腔、刀补、圆镗、啄钻阵列、键槽、岛屿型腔、"CNC" 雕刻、燕尾、螺栓圆、凸轮轮廓、"2024"、键槽、星芒、同心环、奖杯底板

### 🔧 刀具库（8 把预配置刀具）
| T# | 刀具 | 直径 | 用途 |
|----|------|------|------|
| T1 | 立铣刀 | Ø6 mm | 通用型腔、槽、轮廓 |
| T2 | 立铣刀 | Ø10 mm | 粗加工较大特征 |
| T3 | 钻头 | Ø3 mm | 钻孔（G81/G83） |
| T4 | 球头刀 | Ø6 mm | 3D 曲面 |
| T5 | 倒角刀 | Ø10 mm 90° | 去锐边、定心 |
| T6 | 面铣刀 | Ø50 mm | 平面铣平 |
| T7 | 定心钻 | Ø8 mm | 精确孔定心 |
| T8 | 铰刀 | Ø5 mm | 精密精铰孔 |

每把刀具按真实几何渲染，并以真实直径切削。**刀具** 标签页显示全部刀具、高亮当前刀具，并标记当前程序用到的刀具。

### 🧱 材料库（8 种材料）
铝合金 6061/7075、低碳钢、不锈钢 304、黄铜、铜、Delrin、橡木 — 各自含推荐切削速度（Vc）、每齿进给（fz）、最大切深与冷却液建议。**选择材料会改变 3D 视图中工件颜色。**

### 📐 进给与转速计算器
选择刀具 + 材料，调整轴向/径向/进给倍率，实时得到：
- **转速 RPM** = (Vc × 1000) / (π × D)
- **进给** = fz × 刃数 × RPM
- **MRR**（材料去除率，cm³/min）
- **主轴功率**估算（kW）
- **推荐切深 / 切宽（DOC / WOC）**
- 情境警告（摩擦风险、转速上限、加工硬化等）

### 💾 程序库（保存 / 加载 / 导出 / 导入）
- **保存**当前编辑器内容 + 工件到浏览器 `localStorage`
- **加载**任意已存程序回编辑器
- **下载**单个程序为 `.nc` 文件
- **全部导出** / **导入**整个程序库为 JSON
- **15 个代码片段**（程序头、换刀、圆形型腔、钻孔循环、轮廓、精加工、平面等）— 点击即可插入编辑器

### 📚 全面学习资料
- **参考** 标签页 — 65 条 CNC 代码（G/M/T/F/S/Z），含说明、示例与提示，可搜索与分类筛选
- **指南** 标签页 — 使用步骤、G-code 入门、坐标系、编程技巧、键盘快捷键

---

## 🚀 立即体验

<div align="center">

### 👉 [**打开 CNC 模拟器 Pro →**](https://rudra496.github.io/cnc/)

无需下载、无需账号、无需配置。选一个示例程序，点 ▶️ 播放即可。

</div>

---

## 📸 截图

> _截图即将补充 — 眼下可先 [体验在线演示](https://rudra496.github.io/cnc/)，查看 3D 机床、控制栏、编辑器与材料去除效果。_

---

## 🚀 部署到 GitHub Pages

本项目已配置为**静态导出**，并包含可自动构建与部署的 GitHub Action。

### 方案 A — 自动部署（推荐）

1. **新建 GitHub 仓库**，并将本项目源代码推送上去：
   ```bash
   git init
   git add .
   git commit -m "CNC Simulator Pro"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git
   git push -u origin main
   ```

2. **启用 GitHub Pages**：进入仓库 → **Settings → Pages → Build and deployment → Source: GitHub Actions**。

3. 内置工作流（`.github/workflows/deploy.yml`）会在每次推送到 `main` 时自动构建并部署。等待约 2 分钟后访问：
   ```
   https://<YOUR_USERNAME>.github.io/<YOUR_REPO>/
   ```

> `basePath` 会根据仓库名自动检测 — 无需额外配置。

### 方案 B — 手动构建

```bash
bun install
# 项目页（username.github.io/REPO）：
NEXT_PUBLIC_BASE_PATH="/REPO" bun run build
# 用户页（username.github.io）：
bun run build
```
静态站点生成在 `out/` 目录。将 `out/` **中的内容**上传到 `gh-pages` 分支或 GitHub Pages 站点根目录。`.nojekyll` 文件会自动包含。

也可用 npm：

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
```

---

## 🧑‍💻 本地开发

```bash
bun install
bun run dev      # http://localhost:3000
bun run lint     # ESLint 检查
```

或使用 npm：

```bash
npm install
npm run dev
npm run lint
```

环境要求：Node 18+ / Bun 1.0+。

---

## ⌨️ 键盘快捷键

| 按键 | 操作 |
|------|------|
| `Space` | 播放 / 暂停 |
| `→` | 前进一个程序段 |
| `←` | 后退一个程序段 |
| `R` | 复位到起点 |

---

## 🗂️ 项目结构

```
src/
├── app/
│   ├── layout.tsx          # 根布局 + 元数据
│   └── page.tsx            # 主页面（3D 视口 + 标签面板 + 控制栏）
├── components/
│   ├── cnc/
│   │   ├── CncScene.tsx        # 3D 机床（react-three-fiber）
│   │   ├── ControlBar.tsx      # 控制器控制台
│   │   ├── GCodeEditor.tsx     # 语法高亮编辑器
│   │   ├── ProgramPanel.tsx    # 示例选择 + 编辑器 + 诊断
│   │   ├── ProgramManager.tsx  # 保存/加载/导出/导入 + 片段
│   │   ├── ToolManager.tsx     # 刀具库浏览器
│   │   ├── MaterialPanel.tsx   # 材料库选择器
│   │   ├── FeedsCalculator.tsx # 进给与转速计算器
│   │   ├── CodeReference.tsx   # 65 条代码参考
│   │   ├── GuidePanel.tsx      # 教学指南
│   │   └── SceneOverlay.tsx    # 3D 视图开关 + 相机预设
│   └── ui/                     # shadcn/ui 组件
└── lib/
    └── cnc/
        ├── parser.ts       # G-code 解释器
        ├── store.ts        # Zustand 仿真状态
        ├── carve.ts        # 工件切削引擎
        ├── tools.ts        # 刀具库
        ├── materials.ts    # 材料库
        ├── feeds.ts        # 进给与转速计算
        ├── reference.ts    # 65 条 CNC 代码条目
        ├── examples.ts     # 示例程序
        ├── snippets.ts     # 代码模板
        ├── programStore.ts # localStorage 程序管理
        ├── viewStore.ts    # 视图/相机选项
        └── types.ts        # 共享类型
```

---

## 🎨 技术栈

- **Next.js 16**（App Router，静态导出）· **TypeScript 5**
- **react-three-fiber** + **@react-three/drei** + **Three.js** — 3D 渲染
- **Tailwind CSS 4** + **shadcn/ui** — UI 组件
- **Zustand** — 仿真状态 · **react-resizable-panels** — 布局
- **lucide-react** — 图标

---

## 🗺️ 路线图

- [x] 高保真 3D 龙门立加，支持真实材料去除
- [x] 26 个示例 G-code 程序（入门 → 高级）
- [x] DRO 控制栏，含运行 / 干运行 / 机床锁定模式
- [x] 进给与转速计算器
- [x] 刀具与材料库
- [x] 65 条 G/M 代码参考
- [x] 本地保存 / 加载 / 导出程序
- [ ] 第四轴（回转）仿真
- [ ] STL/STEP 毛坯导入
- [ ] 从 CAM 风格几何导出 G-code
- [ ] 车床 / 车削仿真
- [ ] 移动端优化触控操作

> 有想法？[开启讨论](https://github.com/rudra496/cnc/discussions) 或 [提交功能请求](https://github.com/rudra496/cnc/issues/new?labels=enhancement&template=feature_request.md)！

---

## 🤝 参与贡献

欢迎并感谢各类贡献！无论是缺陷修复、新示例程序、刀具定义、文档，还是新功能 — 每一份贡献都能让 CNC 学习更易获得。

1. **Fork** 本仓库
2. 创建功能分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add amazing feature'`
4. 推送到分支：`git push origin feature/amazing-feature`
5. 发起 **Pull Request**

详见 [**CONTRIBUTING.md**](./CONTRIBUTING.md)，并请阅读我们的 [**行为准则**](./CODE_OF_CONDUCT.md)。

---

## 💬 社区与支持

<div align="center">

[![GitHub Discussions](https://img.shields.io/badge/Discussions-加入讨论-22d3ee?style=for-the-badge&logo=github)](https://github.com/rudra496/cnc/discussions)
[![Report Bug](https://img.shields.io/badge/Issue-报告缺陷-red?style=for-the-badge&logo=github)](https://github.com/rudra496/cnc/issues)
[![Feature Request](https://img.shields.io/badge/Issue-功能请求-blue?style=for-the-badge&logo=github)](https://github.com/rudra496/cnc/issues)

</div>

- 🐛 发现缺陷？[提交 Issue](https://github.com/rudra496/cnc/issues/new?labels=bug&template=bug_report.md)
- 💡 有想法？[发起讨论](https://github.com/rudra496/cnc/discussions)
- ⭐ 喜欢本项目？[给仓库加星](https://github.com/rudra496/cnc/stargazers) — 能帮助更多人发现它！
- 🔄 分享给可能喜欢它的机械师、学生或创客。

---

## 📜 许可证

以 **MIT License** 发布 — 见 [LICENSE](./LICENSE)。可自由使用、修改与分享。为学习与实验而构建。

---

<div align="center">

**享受铣削！** 🏭

由 [**Rudra Sarker**](https://github.com/rudra496) 用 ❤️ 制作

[🌐 作品集](https://rudra496.github.io/site) · [💻 GitHub](https://github.com/rudra496) · [💼 LinkedIn](https://www.linkedin.com/in/rudrasarker)

如果 CNC 模拟器 Pro 帮助你学习或教授 CNC，请考虑 **⭐ 给本仓库加星** 并 **分享**。这真的很有帮助。

</div>
