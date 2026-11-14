<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Cpu, GitBranch, BookOpen, Terminal, GraduationCap, Wrench } from "lucide-vue-next";
import { useSimStore } from "@/stores/sim";
import { CNC_EXAMPLES } from "@/lib/cnc/examples";
import CncLayout from "@/components/cnc/CncLayout.vue";

const sim = useSimStore();
const ready = ref(false);

onMounted(() => {
  sim.loadExample(CNC_EXAMPLES[0].id);
  ready.value = true;
});
</script>

<template>
  <div class="app-root">
    <header class="app-header">
      <div class="brand">
        <div class="brand-icon">
          <Cpu :size="18" color="#fff" />
        </div>
        <div class="brand-text">
          <h1>CNC 模拟器 <span class="pro">PRO</span></h1>
          <span class="sub">三轴铣削 · G-code · 实时加工</span>
        </div>
      </div>

      <div class="badges hide-sm">
        <span class="badge online">
          <span class="dot" />
          在线
        </span>
        <span class="badge">v2.4.0</span>
      </div>

      <div class="meta hide-lg">
        <span><Terminal :size="12" /> Fanuc 风格</span>
        <span><BookOpen :size="12" /> {{ CNC_EXAMPLES.length }} 个示例</span>
        <span><Wrench :size="12" /> 28 把刀具</span>
        <span><GraduationCap :size="12" /> 学习模式</span>
      </div>

      <a
        class="src-link"
        href="https://github.com/rudra496/cnc"
        target="_blank"
        rel="noreferrer"
      >
        <GitBranch :size="12" /> 源代码
      </a>
    </header>

    <div class="main">
      <div v-if="!ready" class="boot">
        <div class="spinner" />
        <span>正在启动 CNC 模拟器 Pro…</span>
      </div>
      <CncLayout v-else />
    </div>

    <footer class="app-footer">
      <span>
        CNC 模拟器 Pro — 拖动 3D 视图环视 ·
        <kbd>Space</kbd> 播放 ·
        <kbd>← →</kbd> 单步
      </span>
      <span class="hide-sm">基于 Vue 3 · TresJS · Element Plus · 自定义 G-code 解释器</span>
    </footer>
  </div>
</template>

<style scoped>
.app-root {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: #0b0d10;
  color: #f1f5f9;
}

.app-header {
  z-index: 20;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(90deg, #15181d, #0d0f13);
  padding: 10px 16px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-icon {
  display: flex;
  height: 32px;
  width: 32px;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: linear-gradient(135deg, #06b6d4, #f97316);
  box-shadow: 0 0 14px rgba(34, 211, 238, 0.4);
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}

.brand-text h1 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
}

.brand-text .pro {
  color: #22d3ee;
}

.brand-text .sub {
  font-size: 10px;
  color: #64748b;
}

.badges {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 12px;
}

.badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 8px;
  font-size: 10px;
  color: #94a3b8;
}

.badge.online {
  border-color: rgba(16, 185, 129, 0.3);
  background: rgba(16, 185, 129, 0.1);
  color: #6ee7b7;
}

.dot {
  width: 6px;
  height: 6px;
  margin-right: 4px;
  border-radius: 50%;
  background: #34d399;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

.meta {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 10px;
  color: #64748b;
}

.meta span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.src-link {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 10px;
  font-size: 10px;
  color: #94a3b8;
  text-decoration: none;
}

.src-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
}

.main {
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 0; /* flex-1 fill trick */
}

.boot {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #64748b;
  font-size: 12px;
  font-family: ui-monospace, monospace;
}

.spinner {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid rgba(34, 211, 238, 0.3);
  border-top-color: #22d3ee;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.app-footer {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: #0d0f13;
  padding: 4px 16px;
  font-size: 10px;
  color: #475569;
}

.app-footer kbd {
  border-radius: 3px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  padding: 0 4px;
  color: #94a3b8;
}

@media (max-width: 768px) {
  .hide-sm {
    display: none !important;
  }
}

@media (max-width: 1024px) {
  .hide-lg {
    display: none !important;
  }
  .src-link {
    margin-left: auto;
  }
}

@media (min-width: 1025px) {
  .src-link {
    margin-left: 8px;
  }
}
</style>
