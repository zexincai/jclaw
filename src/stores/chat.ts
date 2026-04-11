import { defineStore } from "pinia";
import { ref } from "vue";

export interface Project {
  id: string;
  name: string;
  channelId: string;
  avatar?: string;
  orgType?: number;
}

export interface Session {
  id: string;
  projectId: string;
  title: string;
  createdAt: string;
}

export interface PlatformAction {
  label: string
  payload: unknown
}

export interface ActionPayload {
  action: "open_modal";
  modal: string;
  data: Record<string, unknown>;
  autoOpen: boolean;
}

export interface Attachment {
  name: string;
  mimeType: string;
  data: string; // base64
  previewUrl?: string;
}

export interface Message {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  thinking?: string;
  actionJson?: ActionPayload;
  platformAction?: PlatformAction;
  attachments?: Attachment[];
  status: "sending" | "streaming" | "done" | "error";
  createdAt: string;
}

export interface UsageStats {
  inputTokens: number;
  outputTokens: number;
  totalCostUsd: number;
  totalMessages: number;
  lastUpdated: string;
}

export const useChatStore = defineStore("chat", () => {
  const projects = ref<Project[]>([]);
  const activeProjectId = ref<string>("");
  const sessions = ref<Session[]>([]);
  const activeSessionId = ref<string>("");
  const messages = ref<Message[]>([]);
  const wsStatus = ref<"connecting" | "connected" | "disconnected">(
    "disconnected",
  );
  const wsMaxRetries = ref(false); // true = 超出重试上限
  const agentRunning = ref(false);
  const usage = ref<UsageStats | null>(null);

  function activeProject() {
    return projects.value.find((p) => p.id === activeProjectId.value) ?? null;
  }

  function activeSessionMessages() {
    return messages.value.filter((m) => m.sessionId === activeSessionId.value);
  }

  function sessionsByProject(projectId: string) {
    return sessions.value
      .filter((s) => s.projectId === projectId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }

  return {
    projects,
    activeProjectId,
    sessions,
    activeSessionId,
    messages,
    wsStatus,
    wsMaxRetries,
    agentRunning,
    usage,
    activeProject,
    activeSessionMessages,
    sessionsByProject,
  };
});
