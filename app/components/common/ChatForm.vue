<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import CustomInput from "~/components/common/CustomInput.vue";
import CustomButton from "~/components/common/CustomButton.vue";

type ChatMessage = {
  id?: number;
  sender: "client" | "owner";
  text: string;
  createdAt: string;
};

type SessionStatus = "active" | "awaiting_username" | "moved_to_telegram" | "closed" | string;
type SessionStage = "choose" | "awaiting_username" | "active" | "closed";

type ChatSession = {
  id: number;
  status: SessionStatus;
  stage: SessionStage;
  tgUsername?: string | null;
};

const props = withDefaults(
    defineProps<{
      titleKey?: string;
    }>(),
    {
      titleKey: "chat.title",
    }
);

const { public: publicConfig } = useRuntimeConfig();
const apiBase = computed(() => (publicConfig.apiBase || "").replace(/\/$/, ""));

const isOpen = ref(false);
const isLoading = ref(false);
const isSending = ref(false);
const hasUnread = ref(false);

const session = ref<ChatSession | null>(null);
const messages = ref<ChatMessage[]>([]);
const messageText = ref("");

const tgUsername = ref("");
const tgError = ref<string | null>(null);

const socket = ref<WebSocket | null>(null);
const socketConnected = ref(false);

const chatListRef = ref<HTMLElement | null>(null);
const clientId = ref<string>("");

const stage = computed<SessionStage>(() => session.value?.stage || "choose");

const canSend = computed(() => {
  if (stage.value !== "active") return false;
  return !isSending.value && !!messageText.value.trim();
});

function ensureClientId() {
  const key = "whiteslove_chat_client_id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const id = crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  localStorage.setItem(key, id);
  return id;
}

function normalizeTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

async function scrollChatToBottom(smooth = true) {
  await nextTick();
  const el = chatListRef.value;
  if (!el) return;
  el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
}

function openChat() {
  isOpen.value = true;
  hasUnread.value = false;
  loadHistory();
  connectSocket();
}

function closeChat() {
  isOpen.value = false;
  disconnectSocket();
}

function toggleChat() {
  if (isOpen.value) closeChat();
  else openChat();
}

function isDuplicateIncoming(incoming: ChatMessage) {
  const last = messages.value[messages.value.length - 1];
  if (!last) return false;
  if (incoming.id && last.id === incoming.id) return true;
  return last.sender === incoming.sender && last.text === incoming.text && last.createdAt === incoming.createdAt;
}

async function loadHistory() {
  isLoading.value = true;
  try {
    const res = await fetch(`${apiBase.value}/chat/history`, {
      method: "GET",
      headers: { "X-Client-Id": clientId.value },
      credentials: "include",
    });

    const data = await res.json();
    if (!data?.ok) return;

    session.value = data.session ?? null;
    messages.value = (data.messages ?? []) as ChatMessage[];

    if (stage.value === "awaiting_username") {
      tgUsername.value = session.value?.tgUsername || "";
    }

    await scrollChatToBottom(false);
  } finally {
    isLoading.value = false;
  }
}

async function chooseChannel(channel: "site" | "telegram") {
  if (isSending.value) return;
  isSending.value = true;
  tgError.value = null;

  try {
    const res = await fetch(`${apiBase.value}/chat/choose`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Client-Id": clientId.value,
      },
      body: JSON.stringify({ channel }),
      credentials: "include",
    });

    const data = await res.json();
    if (!data?.ok) return;

    await loadHistory();
    await scrollChatToBottom();
  } finally {
    isSending.value = false;
  }
}

function validateTgUsername(value: string) {
  const v = value.trim();
  if (!v) return "Введите ник в формате @username";
  if (!/^@[A-Za-z0-9_]{5,32}$/.test(v)) return "Ник должен быть в формате @username";
  return null;
}

async function submitTelegramUsername() {
  if (isSending.value) return;

  const err = validateTgUsername(tgUsername.value);
  if (err) {
    tgError.value = err;
    return;
  }

  isSending.value = true;
  tgError.value = null;

  try {
    const res = await fetch(`${apiBase.value}/chat/set-telegram`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Client-Id": clientId.value,
      },
      body: JSON.stringify({ tgUsername: tgUsername.value.trim() }),
      credentials: "include",
    });

    const data = await res.json();
    if (!data?.ok) {
      tgError.value = data?.error === "invalid_username" ? "Ник должен быть в формате @username" : "Ошибка отправки";
      return;
    }

    await loadHistory();
    await scrollChatToBottom();
  } finally {
    isSending.value = false;
  }
}

async function sendMessage() {
  const text = messageText.value.trim();
  if (!text) return;
  if (stage.value !== "active") return;

  const optimistic: ChatMessage = {
    sender: "client",
    text,
    createdAt: new Date().toISOString(),
  };

  messages.value.push(optimistic);
  messageText.value = "";
  await scrollChatToBottom();

  isSending.value = true;
  try {
    const res = await fetch(`${apiBase.value}/chat/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Client-Id": clientId.value,
      },
      body: JSON.stringify({ text }),
      credentials: "include",
    });

    const data = await res.json();
    if (!data?.ok) {
      messages.value.push({
        sender: "owner",
        text: "Не удалось отправить сообщение. Попробуйте ещё раз.",
        createdAt: new Date().toISOString(),
      });
      await scrollChatToBottom();
    }
  } finally {
    isSending.value = false;
  }
}

function connectSocket() {
  const originWs = window.location.origin.replace(
      /^http/i,
      (m) => (m.toLowerCase() === "https" ? "wss" : "ws")
  );

  const url = `${originWs}/chat-ws?clientId=${encodeURIComponent(clientId.value)}`;

  try {
    socket.value?.close();
  } catch {}

  socketConnected.value = false;
  socket.value = new WebSocket(url);

  socket.value.onopen = () => {
    socketConnected.value = true;
  };

  socket.value.onmessage = async (ev) => {
    let payload: any;
    try {
      payload = JSON.parse(ev.data);
    } catch {
      return;
    }

    if (payload?.type === "session_update") {
      if (!session.value || session.value.id !== payload.sessionId) return;
      session.value = {
        ...session.value,
        status: payload.status ?? session.value.status,
        stage: payload.stage ?? session.value.stage,
        tgUsername: payload.tgUsername ?? session.value.tgUsername,
      };
      return;
    }

    if (payload?.type === "message") {
      const msg: ChatMessage = {
        id: payload.id,
        sender: payload.sender,
        text: payload.text ?? "",
        createdAt: payload.createdAt ?? new Date().toISOString(),
      };

      if (!isDuplicateIncoming(msg)) {
        messages.value.push(msg);
      }

      if (!isOpen.value) hasUnread.value = true;
      await scrollChatToBottom();
      return;
    }

    if (payload?.type === "session_closed") {
      if (session.value && session.value.id === payload.sessionId) {
        session.value = { ...session.value, stage: "closed", status: "closed" };
      }

      await scrollChatToBottom();
    }
  };

  socket.value.onclose = () => {
    socketConnected.value = false;
    if (!isOpen.value) return;
    setTimeout(() => {
      if (isOpen.value) connectSocket();
    }, 1200);
  };

  socket.value.onerror = () => {
    socketConnected.value = false;
  };
}

function disconnectSocket() {
  try {
    socket.value?.close();
  } catch {}
  socket.value = null;
  socketConnected.value = false;
}

onMounted(() => {
  clientId.value = ensureClientId();
});

onBeforeUnmount(() => {
  disconnectSocket();
});
</script>

<template>
  <button class="floating-chat-toggle" type="button" @click="toggleChat">
    <u-icon name="i-lucide-send" class="floating-chat-toggle__icon" />
    <span v-if="hasUnread" class="floating-chat-toggle__unread" />
  </button>

  <transition name="floating-chat-animation">
    <section v-if="isOpen" class="floating-chat-panel">
      <div class="floating-chat-panel__inner">
        <header class="floating-chat-header">
          <div class="floating-chat-header__left">
            <div class="floating-chat-header__title">
              <span>{{ $t(props.titleKey) }}</span>
            </div>

            <div class="floating-chat-header__status" :class="{ 'floating-chat-header__status_connected': socketConnected }">
              <u-icon
                  :name="socketConnected ? 'i-lucide-wifi' : 'i-lucide-wifi-off'"
                  class="floating-chat-header__status-icon"
              />
              <span>{{ socketConnected ? $t("chat.status.online") : $t("chat.status.connecting") }}</span>
            </div>
          </div>

          <u-button variant="ghost" class="floating-chat-header__close" type="button" @click="closeChat">
            <u-icon name="i-lucide-x" class="floating-chat-header__close-icon" />
          </u-button>
        </header>

        <div ref="chatListRef" class="floating-chat-messages">
          <div v-if="isLoading" class="floating-chat-messages__loading">
            {{ $t("chat.loading") }}
          </div>

          <div
              v-for="(m, idx) in messages"
              :key="idx"
              class="floating-chat-message"
              :class="{
              'floating-chat-message_client': m.sender === 'client',
              'floating-chat-message_owner': m.sender === 'owner',
            }"
          >
            <div class="floating-chat-message__bubble">
              <div class="floating-chat-message__text">{{ m.text }}</div>
              <div class="floating-chat-message__meta">{{ normalizeTime(m.createdAt) }}</div>
            </div>
          </div>
        </div>

        <footer class="floating-chat-footer">
          <div v-if="stage === 'choose'" class="floating-chat-stage">
            <div class="floating-chat-stage__title">
              {{ $t("chat.stage.chooseChannel") }}
            </div>

            <div class="floating-chat-stage__row">
              <custom-button class="floating-chat-stage__button" :variant="'primary'" @click="chooseChannel('site')">
                <u-icon name="i-lucide-monitor" class="floating-chat-stage__button-icon" />
                <span>{{ $t("chat.stage.site") }}</span>
              </custom-button>

              <custom-button class="floating-chat-stage__button" :variant="'secondary'" @click="chooseChannel('telegram')">
                <u-icon name="i-lucide-send" class="floating-chat-stage__button-icon" />
                <span>{{ $t("chat.stage.telegram") }}</span>
              </custom-button>
            </div>
          </div>

          <div v-else-if="stage === 'awaiting_username'" class="floating-chat-stage">
            <div class="floating-chat-stage__title">
              {{ $t("chat.stage.enterTelegram") }}
            </div>

            <div class="floating-chat-stage__row">
              <custom-input
                  class="floating-chat-stage__input"
                  :model-value="tgUsername"
                  placeholder="@username"
                  @update:modelValue="(v: string) => (tgUsername = v)"
              />

              <custom-button class="floating-chat-stage__button" :variant="'primary'" @click="submitTelegramUsername">
                <u-icon name="i-lucide-check" class="floating-chat-stage__button-icon" />
                <span>{{ $t("chat.stage.submit") }}</span>
              </custom-button>
            </div>

            <div v-if="tgError" class="floating-chat-stage__error">{{ tgError }}</div>
          </div>

          <div v-else-if="stage === 'closed'" class="floating-chat-stage">
            <div class="floating-chat-stage__title">
              {{ $t("chat.stage.closed") }}
            </div>
          </div>

          <div v-else class="floating-chat-input">
            <div class="floating-chat-input__row">
              <custom-input
                  class="floating-chat-input__text"
                  :model-value="messageText"
                  :placeholder-key="'chat.input.placeholder'"
                  @update:modelValue="(v: string) => (messageText = v)"
              />

              <custom-button class="floating-chat-input__send" :variant="'primary'" :disabled="!canSend" @click="sendMessage">
                <u-icon name="i-lucide-send" class="floating-chat-input__send-icon" />
                <span>{{ $t("chat.send") }}</span>
              </custom-button>
            </div>
          </div>
        </footer>
      </div>
    </section>
  </transition>
</template>

<style scoped>
.floating-chat-toggle {
  position: fixed;
  right: 22px;
  bottom: 22px;
  width: 54px;
  height: 54px;
  border-radius: 16px;
  border: 1px solid var(--color-primary-alt);
  background: rgba(14, 12, 21, 0.72);
  backdrop-filter: blur(12px);
  box-shadow: var(--shadow-light);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  color: var(--color-primary);
  transition: transform 0.15s ease, filter 0.2s ease, box-shadow 0.2s ease;
}

.floating-chat-toggle:hover {
  filter: brightness(1.08);
  box-shadow: var(--shadow-primary);
}

.floating-chat-toggle:active {
  transform: translateY(1px);
}

.floating-chat-toggle__icon {
  width: 22px;
  height: 22px;
}

.floating-chat-toggle__unread {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: var(--color-secondary);
  box-shadow: 0 0 0 4px rgba(205, 153, 255, 0.18);
}

.floating-chat-panel {
  position: fixed;
  right: 22px;
  bottom: 90px;
  width: min(420px, calc(100vw - 44px));
  height: min(560px, calc(100vh - 140px));
  border-radius: 18px;
  padding: 1.5px;
  background: var(--color-primary-gradient);
  z-index: 50;
  box-shadow: var(--shadow-primary);
}

.floating-chat-panel__inner {
  height: 100%;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(14, 12, 21, 0.92);
  backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
}

.floating-chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 14px 12px;
  border-bottom: 1px solid var(--ui-border);
}

.floating-chat-header__left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.floating-chat-header__title {
  font-weight: 800;
  color: var(--ui-text-inverted);
}

.floating-chat-header__status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 800;
  color: var(--ui-text-muted);
}

.floating-chat-header__status_connected {
  color: var(--color-secondary);
}

.floating-chat-header__status-icon {
  width: 14px;
  height: 14px;
  opacity: 0.9;
}

.floating-chat-header__close {
  width: 34px;
  height: 34px;
  border-radius: 12px;
}

.floating-chat-header__close-icon {
  width: 18px;
  height: 18px;
}

.floating-chat-messages {
  flex: 1 1 auto;
  overflow: auto;
  padding: 14px;
}

.floating-chat-messages__loading {
  font-size: 12px;
  font-weight: 800;
  color: var(--ui-text-muted);
  padding: 10px 0;
}

.floating-chat-message {
  display: flex;
  margin: 8px 0;
}

.floating-chat-message_client {
  justify-content: flex-end;
}

.floating-chat-message_owner {
  justify-content: flex-start;
}

.floating-chat-message__bubble {
  max-width: 82%;
  border-radius: 14px;
  padding: 10px 12px 8px;
  border: 1px solid var(--ui-border);
  background: rgba(255, 255, 255, 0.04);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.floating-chat-message_client .floating-chat-message__bubble {
  background: rgba(128, 90, 245, 0.16);
  border-color: rgba(205, 153, 255, 0.22);
}

.floating-chat-message__text {
  color: var(--ui-text-inverted);
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 14px;
  line-height: 1.35;
}

.floating-chat-message__meta {
  margin-top: 6px;
  text-align: right;
  font-size: 11px;
  font-weight: 800;
  color: var(--ui-text-muted);
}

.floating-chat-footer {
  padding: 12px 12px 12px;
  border-top: 1px solid var(--ui-border);
}

.floating-chat-stage {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.floating-chat-stage__title {
  font-size: 12px;
  font-weight: 900;
  color: var(--ui-text-muted);
}

.floating-chat-stage__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.floating-chat-stage__button {
  height: 44px;
}

.floating-chat-stage__button-icon {
  width: 16px;
  height: 16px;
}

.floating-chat-stage__input {
  min-width: 0;
}

.floating-chat-stage__error {
  font-size: 12px;
  font-weight: 900;
  color: var(--color-error, #ef4444);
}

.floating-chat-input__row {
  display: grid;
  grid-template-columns: 1fr 140px;
  gap: 10px;
  align-items: end;
}

.floating-chat-input__send-icon {
  width: 16px;
  height: 16px;
}

.floating-chat-animation-enter-active,
.floating-chat-animation-leave-active {
  transition: transform 0.18s ease, opacity 0.18s ease;
}

.floating-chat-animation-enter-from,
.floating-chat-animation-leave-to {
  transform: translateY(10px) scale(0.98);
  opacity: 0;
}

@media (max-width: 520px) {
  .floating-chat-panel {
    right: 12px;
    bottom: 82px;
    width: calc(100vw - 24px);
    height: calc(100vh - 120px);
  }

  .floating-chat-toggle {
    right: 12px;
    bottom: 12px;
  }

  .floating-chat-stage__row {
    grid-template-columns: 1fr;
  }

  .floating-chat-input__row {
    grid-template-columns: 1fr;
  }
}
</style>