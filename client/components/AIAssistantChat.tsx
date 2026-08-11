import React, { FormEvent, useMemo, useState } from "react";
import { Bot, Loader2, Send, X } from "lucide-react";
import ENDPOINTS from "@/lib/endpoint";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/context/RoleContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getAllowedModulesFromSubscription } from "@/utils/subscriptionModules";
import { hasAnyRole } from "@/lib/auth";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const AIAssistantChat: React.FC = () => {
  const { user } = useAuth();
  const { canPerformModuleAction, loading: roleLoading } = useRole();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hi, I can help with HRMS workflows, reports, payroll, leave, and attendance.",
    },
  ]);

  const canUseAssistant = useMemo(() => {
    const isAdminOrCeo = hasAnyRole(user, ["admin", "ceo", "superadmin"]);
    const currentEmployeeId = Number((user as any)?.employee_id || user?.id || 0) || null;
    const allowedModules = getAllowedModulesFromSubscription(
      subscription,
      subscriptionLoading,
      {
        currentEmployeeId,
        addonAdminBypass: isAdminOrCeo,
      },
    );

    const subscriptionAllows =
      allowedModules === null || allowedModules.has("ai_assistant");
    const roleAllows =
      canPerformModuleAction("ai_assistant", "create") ||
      canPerformModuleAction("ai_assistant", "view");

    return subscriptionAllows && (roleAllows || isAdminOrCeo);
  }, [canPerformModuleAction, subscription, subscriptionLoading, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = input.trim();
    if (!message || sending) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: message }];
    setMessages(nextMessages);
    setInput("");
    setSending(true);

    try {
      const response = await ENDPOINTS.sendAiAssistantMessage({
        message,
        history: nextMessages.slice(-10),
      });
      const reply =
        response.data?.data?.reply ||
        response.data?.reply ||
        "I could not respond right now.";
      setMessages((current) => [...current, { role: "assistant", content: reply }]);
    } catch (error: any) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            error?.response?.data?.message ||
            "AI Assistant is not available right now.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  if (roleLoading || !canUseAssistant) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen && (
        <div className="mb-3 flex h-[520px] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">AI Assistant</p>
                <p className="text-xs text-slate-500">HRMS help</p>
              </div>
            </div>
            <button
              type="button"
              className="rounded-md p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
              onClick={() => setIsOpen(false)}
              aria-label="Close AI Assistant"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 px-4 py-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "bg-emerald-600 text-white"
                      : "border border-slate-200 bg-white text-slate-800"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 border-t border-slate-200 bg-white p-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about HRMS..."
              className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              maxLength={4000}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Send message"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xl hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200"
        onClick={() => setIsOpen((current) => !current)}
        aria-label="Open AI Assistant"
      >
        <Bot className="h-5 w-5" />
      </button>
    </div>
  );
};

export default AIAssistantChat;
