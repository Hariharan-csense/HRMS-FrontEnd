import React, { FormEvent, useState } from "react";
import { Bot, Loader2, Send } from "lucide-react";
import { Layout } from "@/components/Layout";
import ENDPOINTS from "@/lib/endpoint";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const AIAssistant: React.FC = () => {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi, ask me about attendance, payroll, leave, reports, expenses, tickets, or any HRMS workflow.",
    },
  ]);

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
        history: nextMessages.slice(-12),
      });
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            response.data?.data?.reply ||
            response.data?.reply ||
            "I could not respond right now.",
        },
      ]);
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

  return (
    <Layout>
      <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-5xl flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-600 text-white">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">AI Assistant</h1>
            <p className="text-sm text-slate-500">HRMS workflow help for your team</p>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/70 px-5 py-5">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[78%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
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
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-3 border-t border-slate-200 p-4">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask anything about HRMS..."
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
    </Layout>
  );
};

export default AIAssistant;
