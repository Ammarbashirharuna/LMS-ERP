import { useState, useRef, useEffect } from "react";
import { useAIChat } from "../../hooks/useAI";
import { useAuth } from "../../hooks/useAuth";
import type { AIChatMessage } from "../../api/ai";export function AIAssistant() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatMutation = useAIChat();

  const toggleOpen = () => setIsOpen(!isOpen);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || chatMutation.isPending) return;

    const userMessage: AIChatMessage = { role: "user", content: message };
      const history = messages.map((m) => ({
      role: m.role,
      parts: m.content,
    }));

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);
    setMessage("");

    try {
      const result = await chatMutation.mutateAsync({
        message,
        role: user?.role || "teacher",
        history,
      });
      const assistantMessage: AIChatMessage = {
        role: "assistant",
        content: result.response,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: unknown) {
      const errorMessage: AIChatMessage = {
        role: "assistant",
        content: error instanceof Error ? error.message : "Sorry, I encountered an error.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={toggleOpen}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-primary-hover transition-all duration-200 flex items-center justify-center z-40 hover:scale-110 hover:shadow-xl"
        aria-label="Open AI Assistant"
      >
        AI
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 h-96 bg-surface border border-border rounded-2xl shadow-2xl flex flex-col z-40 glass">
      <div className="p-3 border-b border-border bg-surface-muted flex justify-between items-center">
        <h3 className="font-semibold text-text-primary">AI Assistant</h3>
        <button
          onClick={toggleOpen}
          className="text-text-muted hover:text-text-primary"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3" ref={messagesEndRef}>
        {messages.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-8">
            Ask me anything about Montessori practices, student progress, or curriculum planning.
          </p>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`p-2 rounded-lg text-sm ${
                msg.role === "user"
                  ? "bg-primary/10 ml-auto max-w-[80%]"
                  : "bg-surface-muted mr-auto max-w-[80%]"
              }`}
            >
              {msg.content}
            </div>
          ))
        )}
        {isTyping && (
          <div className="p-2 rounded-lg text-sm bg-surface-muted mr-auto">
            <span className="inline-block w-2 h-2 bg-text-muted rounded-full animate-bounce"></span>
            <span className="inline-block w-2 h-2 bg-text-muted rounded-full animate-bounce ml-1"></span>
            <span className="inline-block w-2 h-2 bg-text-muted rounded-full animate-bounce ml-1"></span>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-border">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary text-sm resize-none"
          rows={2}
          disabled={chatMutation.isPending}
        />
        <button
          onClick={() => void handleSend()}
          disabled={!message.trim() || chatMutation.isPending}
          className="mt-2 w-full btn-primary text-sm"
        >
          Send
        </button>
      </div>
    </div>
  );
}
