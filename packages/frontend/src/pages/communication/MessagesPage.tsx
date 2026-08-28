import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../api/client";
import {
  MessageSquare,
  Send,
  Plus,
  ArrowLeft,
  Search,
  X,
  Check,
  CheckCheck,
  Reply,
  Clock,
  Users,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ConversationUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface MessageParticipant {
  userId: string;
  isRead: boolean;
  readAt?: string;
  user?: { id: string; firstName?: string; lastName?: string; email: string };
}

interface Message {
  id: string;
  subject?: string | null;
  content: string;
  createdAt: string;
  parentId?: string | null;
  participants: MessageParticipant[];
  replyCount?: number;
  lastReply?: {
    id: string;
    content: string;
    createdAt: string;
    sender?: { id: string; firstName?: string; lastName?: string; email: string } | null;
  } | null;
  replies?: Message[];
  isUnread?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getOtherParticipants(msg: Message, currentUserId: string): MessageParticipant[] {
  return (msg.participants || []).filter((p) => p.userId !== currentUserId);
}

function getParticipantName(p: MessageParticipant): string {
  if (p.user) {
    const name = `${p.user.firstName || ""} ${p.user.lastName || ""}`.trim();
    return name || p.user.email || "Unknown";
  }
  return "Unknown";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatFullTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function MessagesPage() {
  const qc = useQueryClient();
  const [currentUserId, setCurrentUserId] = useState<string>("");

  if (!currentUserId) {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.id) setCurrentUserId(parsed.id);
      }
    } catch { /* ignore */ }
  }

  const [view, setView] = useState<"inbox" | "compose" | "thread">("inbox");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [threadVersion, setThreadVersion] = useState(0);

  /* ----- Queries ----- */
  const { data: messagesData, isLoading: messagesLoading, refetch } = useQuery({
    queryKey: ["messages"],
    queryFn: () => apiClient.get("/communication/messages").then((r) => r.data),
    retry: 1,
    refetchInterval: 30000, // Poll every 30s for new messages
  });

  const { data: usersData } = useQuery({
    queryKey: ["conversation-users"],
    queryFn: () => apiClient.get("/communication/users").then((r) => r.data),
    retry: 1,
  });

  const messages: Message[] = messagesData?.data || messagesData || [];
  const users: ConversationUser[] = usersData || [];

  const filteredMessages = messages.filter((msg) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const others = getOtherParticipants(msg, currentUserId);
    const names = others.map((p) => getParticipantName(p).toLowerCase()).join(" ");
    const subject = (msg.subject || "").toLowerCase();
    const content = (msg.content || "").toLowerCase();
    return names.includes(term) || subject.includes(term) || content.includes(term);
  });

  /* ----- Mutations ----- */
  const sendMessage = useMutation({
    mutationFn: (data: { recipientIds: string[]; subject?: string; content: string; parentId?: string }) =>
      apiClient.post("/communication/messages", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages"] });
    },
  });

  const handleSelectMessage = (msg: Message) => {
    setSelectedMessage(msg);
    setView("thread");
  };

  /* ----- Compose View ----- */
  if (view === "compose") {
    return (
      <ComposeView
        users={users}
        onSend={sendMessage}
        onBack={() => setView("inbox")}
        sending={sendMessage.isPending}
      />
    );
  }

  /* ----- Thread View ----- */
  if (view === "thread" && selectedMessage) {
    return (
      <ThreadView
        message={selectedMessage}
        currentUserId={currentUserId}
        users={users}
        threadVersion={threadVersion}
        onBack={() => { setView("inbox"); setSelectedMessage(null); }}
        onReply={(parentId, content) => {
          sendMessage.mutate(
            { recipientIds: [], content, parentId },
            {
              onSuccess: () => {
                qc.invalidateQueries({ queryKey: ["messages"] });
                refetch();
                setThreadVersion((v) => v + 1);
              },
            }
          );
        }}
        sendingReply={sendMessage.isPending}
      />
    );
  }

  /* ----- Inbox View ----- */
  return (
    <div className="p-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            Messages
          </h1>
          <p className="text-text-muted text-sm mt-1">
            {messages.length} conversation{messages.length !== 1 ? "s" : ""} · {" "}
            {messages.filter((m) => m.isUnread).length} unread
          </p>
        </div>
        <button
          onClick={() => setView("compose")}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Message
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm"
          />
        </div>
      </div>

      {/* Error */}
      {sendMessage.isError && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-danger text-sm">
          {(sendMessage.error as Error)?.message || "Failed to send message. Please try again."}
        </div>
      )}

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {messagesLoading ? (
          <div className="text-center py-12 animate-pulse text-text-muted">Loading conversations...</div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="w-16 h-16 text-text-muted/20 mx-auto mb-4" />
            <p className="text-text-muted font-medium text-lg">No conversations yet</p>
            <p className="text-text-muted text-sm mt-1">Click &quot;New Message&quot; to start a conversation</p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const others = getOtherParticipants(msg, currentUserId);
            const otherName = others.length > 0 ? getParticipantName(others[0]) : "Unknown";
            const unread = msg.isUnread;
            const replyCount = msg.replyCount || 0;
            const lastReply = msg.lastReply;

            return (
              <button
                key={msg.id}
                onClick={() => handleSelectMessage(msg)}
                className={`w-full text-left p-4 rounded-xl transition-all duration-150 flex items-start gap-3 ${
                  unread
                    ? "bg-primary/5 border border-primary/20 hover:bg-primary/10"
                    : "bg-surface hover:bg-surface-muted"
                }`}
              >
                {/* Avatar */}
                <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
                  unread ? "bg-primary text-white" : "bg-primary-subtle text-primary"
                }`}>
                  <span className="text-sm font-bold">{getInitials(otherName)}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-sm truncate ${unread ? "font-bold text-text-primary" : "font-medium text-text-primary"}`}>
                        {otherName}
                      </span>
                      {others.length > 1 && (
                        <span className="text-xs text-text-muted bg-surface-muted px-1.5 py-0.5 rounded">
                          +{others.length - 1}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-text-muted whitespace-nowrap flex items-center gap-1">
                      {formatTime(lastReply?.createdAt || msg.createdAt)}
                    </span>
                  </div>

                  {/* Subject */}
                  {msg.subject && (
                    <p className={`text-sm mt-0.5 ${unread ? "font-semibold text-text-primary" : "text-text-primary"}`}>
                      {msg.subject}
                    </p>
                  )}

                  {/* Preview */}
                  <p className="text-sm text-text-muted mt-0.5 truncate">
                    {lastReply
                      ? `${lastReply.sender ? getParticipantName({ userId: "", isRead: false, user: lastReply.sender }) : "Someone"}: ${lastReply.content}`
                      : msg.content
                    }
                  </p>

                  {/* Reply count */}
                  {replyCount > 0 && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-text-muted">
                      <Reply className="w-3 h-3" />
                      <span>{replyCount} {replyCount === 1 ? "reply" : "replies"}</span>
                    </div>
                  )}
                </div>

                {/* Unread indicator */}
                {unread && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0 mt-2" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Compose View                                                       */
/* ------------------------------------------------------------------ */

function ComposeView({
  users,
  onSend,
  onBack,
  sending,
}: {
  users: ConversationUser[];
  onSend: any;
  onBack: () => void;
  sending: boolean;
}) {
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [recipientSearch, setRecipientSearch] = useState("");
  const [error, setError] = useState("");

  const filteredUsers = users.filter((u) => {
    if (!recipientSearch) return true;
    const term = recipientSearch.toLowerCase();
    return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term) || u.role.toLowerCase().includes(term);
  });

  const toggleRecipient = (userId: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const removeRecipient = (userId: string) => {
    setSelectedRecipients((prev) => prev.filter((id) => id !== userId));
  };

  const handleSend = () => {
    if (selectedRecipients.length === 0) {
      setError("Please select at least one recipient");
      return;
    }
    if (!content.trim()) {
      setError("Please enter a message");
      return;
    }
    setError("");
    onSend.mutate({
      recipientIds: selectedRecipients,
      subject: subject.trim() || undefined,
      content: content.trim(),
    });
  };

  const selectedUsers = users.filter((u) => selectedRecipients.includes(u.id));

  return (
    <div className="p-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-surface-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-text-muted" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">New Message</h1>
          <p className="text-text-muted text-sm">Select recipients and write your message</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-danger text-sm">{error}</div>
      )}

      {onSend.isError && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-danger text-sm">
          {(onSend.error as Error)?.message || "Failed to send. Please try again."}
        </div>
      )}

      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Recipients */}
        <div className="surface p-4">
          <label className="block text-sm font-semibold text-text-primary mb-2">To:</label>

          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedUsers.map((u) => (
                <span
                  key={u.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-white text-xs font-medium"
                >
                  {u.name}
                  <button onClick={() => removeRecipient(u.id)} className="hover:bg-white/20 rounded-full p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={recipientSearch}
              onChange={(e) => setRecipientSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm"
            />
          </div>

          {recipientSearch && filteredUsers.length > 0 && (
            <div className="mt-2 max-h-48 overflow-y-auto border border-border rounded-xl divide-y divide-border">
              {filteredUsers.slice(0, 10).map((u) => {
                const isSelected = selectedRecipients.includes(u.id);
                return (
                  <button
                    key={u.id}
                    onClick={() => toggleRecipient(u.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      isSelected ? "bg-primary/5" : "hover:bg-surface-muted"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-subtle flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-primary">{getInitials(u.name)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{u.name}</p>
                      <p className="text-xs text-text-muted">{u.email} · {u.role}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Subject */}
        <div className="surface p-4">
          <label className="block text-sm font-semibold text-text-primary mb-2">Subject (optional)</label>
          <input
            type="text"
            placeholder="What is this about?"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm"
          />
        </div>

        {/* Message Body */}
        <div className="surface p-4 flex-1 flex flex-col">
          <label className="block text-sm font-semibold text-text-primary mb-2">Message</label>
          <textarea
            placeholder="Write your message..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 min-h-[120px] px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm resize-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <button onClick={onBack} className="px-4 py-2.5 text-sm font-medium text-text-muted hover:text-text-primary transition-colors">
          Cancel
        </button>
        <button
          onClick={handleSend}
          disabled={sending || selectedRecipients.length === 0 || !content.trim()}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {sending ? "Sending..." : "Send Message"}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Thread View — realistic chat-like conversation                     */
/* ------------------------------------------------------------------ */

function ThreadView({
  message: rootMsg,
  currentUserId,
  users,
  onBack,
  onReply,
  sendingReply,
  threadVersion,
}: {
  message: Message;
  currentUserId: string;
  users: ConversationUser[];
  onBack: () => void;
  onReply: (parentId: string, content: string) => void;
  sendingReply: boolean;
  threadVersion?: number;
}) {
  const [replyContent, setReplyContent] = useState("");
  const [threadData, setThreadData] = useState<Message | null>(null);
  const [loadingThread, setLoadingThread] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch full thread — re-fetch when threadVersion changes (after reply)
  useEffect(() => {
    setLoadingThread(true);
    apiClient
      .get(`/communication/messages/${rootMsg.id}`)
      .then((r) => {
        setThreadData(r.data.data || r.data);
        setLoadingThread(false);
      })
      .catch(() => {
        // Fallback to the root message
        setThreadData(rootMsg);
        setLoadingThread(false);
      });
  }, [rootMsg.id, threadVersion]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (!loadingThread) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [loadingThread, threadData?.replies?.length]);

  const handleSendReply = () => {
    if (!replyContent.trim()) return;
    onReply(rootMsg.id, replyContent.trim());
    setReplyContent("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  const root = threadData || rootMsg;
  const replies = root.replies || [];
  const allMessages = [root, ...replies];
  const others = getOtherParticipants(root, currentUserId);
  const conversationName = others.length > 0
    ? others.map((p) => getParticipantName(p)).join(", ")
    : "Unknown";

  return (
    <div className="h-full flex flex-col">
      {/* Thread Header */}
      <div className="p-4 border-b border-border bg-surface flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-surface-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-text-muted" />
        </button>
        <div className="w-10 h-10 rounded-full bg-primary-subtle flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-primary">{getInitials(conversationName)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text-primary text-sm truncate">{conversationName}</p>
          <p className="text-xs text-text-muted">
            {root.subject && <span className="font-medium">{root.subject}</span>}
            {root.subject && " · "}
            {allMessages.length} message{allMessages.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs text-text-muted">
          <Users className="w-3.5 h-3.5" />
          {allMessages.length} messages
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-bg">
        {loadingThread ? (
          <div className="text-center py-12 animate-pulse text-text-muted">Loading conversation...</div>
        ) : (
          <>
            {/* Date separator */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-text-muted font-medium">
                {new Date(root.createdAt).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {allMessages.map((msg, idx) => {
              const sender = msg.participants?.[0]?.user;
              const senderName = sender
                ? `${sender.firstName || ""} ${sender.lastName || ""}`.trim() || sender.email
                : "Unknown";
              const isMe = msg.participants?.[0]?.userId === currentUserId;

              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] ${isMe ? "order-1" : ""}`}>
                    {/* Sender name (only for first message or when sender changes) */}
                    {(idx === 0 || allMessages[idx - 1]?.participants?.[0]?.userId !== msg.participants?.[0]?.userId) && (
                      <p className={`text-xs font-medium text-text-muted mb-1 ${isMe ? "text-right" : ""}`}>
                        {isMe ? "You" : senderName}
                      </p>
                    )}

                    {/* Message bubble */}
                    <div className={`rounded-2xl px-4 py-3 ${
                      isMe
                        ? "bg-primary text-white rounded-br-md"
                        : "bg-surface border border-border rounded-bl-md"
                    }`}>
                      <p className={`text-sm whitespace-pre-wrap leading-relaxed ${isMe ? "text-white" : "text-text-primary"}`}>
                        {msg.content}
                      </p>
                    </div>

                    {/* Time */}
                    <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : ""}`}>
                      <Clock className={`w-3 h-3 ${isMe ? "text-text-muted/50" : "text-text-muted/50"}`} />
                      <span className={`text-xs ${isMe ? "text-text-muted/50" : "text-text-muted/50"}`}>
                        {formatFullTime(msg.createdAt)}
                      </span>
                      {isMe && msg.participants?.[0]?.isRead && (
                        <CheckCheck className="w-3.5 h-3.5 text-primary ml-1" />
                      )}
                      {isMe && !msg.participants?.[0]?.isRead && (
                        <Check className="w-3.5 h-3.5 text-text-muted/50 ml-1" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Reply Box */}
      <div className="p-4 pb-24 border-t border-border bg-surface">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              placeholder="Type a reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm resize-none min-h-[44px] max-h-[120px]"
              style={{ height: "auto" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, 120) + "px";
              }}
            />
          </div>
          <button
            onClick={handleSendReply}
            disabled={sendingReply || !replyContent.trim()}
            className="btn-primary p-3 rounded-xl disabled:opacity-50 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-text-muted mt-2 text-center">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
