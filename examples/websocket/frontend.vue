<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { io, type Socket } from "socket.io-client";
import { ElMessage } from "element-plus";

type User = {
  id: string;
  username: string;
};

type ChatMessage = {
  id: string;
  username: string;
  content: string;
  timestamp: Date | string;
  type: "user" | "system";
};

const messages = ref<ChatMessage[]>([]);
const inputMessage = ref("");
const username = ref("");
const isUsernameSet = ref(false);
const isConnected = ref(false);
const users = ref<User[]>([]);
let socket: Socket | null = null;

onMounted(() => {
  // Never use PORT in the URL, always use XTransformPort
  // DO NOT change the path — used by Caddy to forward to the correct port
  const socketInstance = io("/?XTransformPort=3003", {
    transports: ["websocket", "polling"],
    forceNew: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
  });

  socket = socketInstance;

  socketInstance.on("connect", () => {
    isConnected.value = true;
  });

  socketInstance.on("disconnect", () => {
    isConnected.value = false;
  });

  socketInstance.on("message", (msg: ChatMessage) => {
    messages.value.push(msg);
  });

  socketInstance.on("user-joined", (data: { user: User; message: ChatMessage }) => {
    messages.value.push(data.message);
    if (!users.value.find((u) => u.id === data.user.id)) {
      users.value.push(data.user);
    }
  });

  socketInstance.on("user-left", (data: { user: User; message: ChatMessage }) => {
    messages.value.push(data.message);
    users.value = users.value.filter((u) => u.id !== data.user.id);
  });

  socketInstance.on("users-list", (data: { users: User[] }) => {
    users.value = data.users;
  });
});

onUnmounted(() => {
  socket?.disconnect();
  socket = null;
});

function handleJoin() {
  if (socket && username.value.trim() && isConnected.value) {
    socket.emit("join", { username: username.value.trim() });
    isUsernameSet.value = true;
  } else {
    ElMessage.warning("请先连接并输入用户名");
  }
}

function sendMessage() {
  if (socket && inputMessage.value.trim() && username.value.trim()) {
    socket.emit("message", {
      content: inputMessage.value.trim(),
      username: username.value.trim(),
    });
    inputMessage.value = "";
  }
}

function onKey(e: KeyboardEvent) {
  if (e.key === "Enter") sendMessage();
}
</script>

<template>
  <div class="ws-demo">
    <el-card shadow="hover">
      <template #header>
        <div class="hdr">
          <span>WebSocket Demo</span>
          <el-tag :type="isConnected ? 'success' : 'danger'" size="small">
            {{ isConnected ? "Connected" : "Disconnected" }}
          </el-tag>
        </div>
      </template>

      <div v-if="!isUsernameSet" class="join">
        <el-input
          v-model="username"
          placeholder="Enter your username..."
          :disabled="!isConnected"
          @keyup.enter="handleJoin"
        />
        <el-button
          type="primary"
          class="full"
          :disabled="!isConnected || !username.trim()"
          @click="handleJoin"
        >
          Join Chat
        </el-button>
      </div>

      <div v-else class="chat">
        <div class="msgs cnc-scroll">
          <p v-if="messages.length === 0" class="empty">No messages yet</p>
          <div v-for="msg in messages" :key="msg.id" class="msg">
            <div class="row">
              <div>
                <p :class="msg.type === 'system' ? 'sys-name' : 'name'">
                  {{ msg.username }}
                </p>
                <p :class="msg.type === 'system' ? 'sys-body' : 'body'">
                  {{ msg.content }}
                </p>
              </div>
              <span class="time">
                {{ new Date(msg.timestamp).toLocaleTimeString() }}
              </span>
            </div>
          </div>
        </div>

        <div class="composer">
          <el-input
            v-model="inputMessage"
            placeholder="Type a message..."
            :disabled="!isConnected"
            @keyup="onKey"
          />
          <el-button
            type="primary"
            :disabled="!isConnected || !inputMessage.trim()"
            @click="sendMessage"
          >
            Send
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.ws-demo {
  max-width: 42rem;
  margin: 0 auto;
  padding: 1rem;
}
.hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.join {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.full {
  width: 100%;
}
.chat {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.msgs {
  height: 20rem;
  overflow: auto;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  padding: 1rem;
}
.empty {
  text-align: center;
  color: #94a3b8;
}
.msg {
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 0.5rem;
  margin-bottom: 0.5rem;
}
.msg:last-child {
  border-bottom: none;
}
.row {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}
.name {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
}
.body {
  margin: 0;
  color: #0f172a;
}
.sys-name,
.sys-body {
  margin: 0;
  color: #2563eb;
  font-style: italic;
}
.time {
  font-size: 0.75rem;
  color: #94a3b8;
  white-space: nowrap;
}
.composer {
  display: flex;
  gap: 0.5rem;
}
</style>
