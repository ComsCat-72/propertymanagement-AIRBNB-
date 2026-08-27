import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Bot, Send } from "lucide-react";
import { askAgentAssistant, type ChatListing } from "@/lib/agent-chat.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Msg { role: "user" | "assistant"; content: string }

export function AgentAssistant({
  agentName,
  agentBio,
  listings,
}: {
  agentName: string;
  agentBio: string;
  listings: ChatListing[];
}) {
  const ask = useServerFn(askAgentAssistant);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: `Hi! Ask me anything about ${agentName}'s listings — price, size, location or availability.` },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    const res = await ask({ data: { agentName, agentBio, listings, messages: next.filter((m, i) => i > 0) } });
    setBusy(false);
    setMessages([...next, { role: "assistant", content: res.reply || res.error || "Sorry, I couldn't answer that." }]);
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-brand/10 text-brand"><Bot className="h-4 w-4" /></span>
        <h3 className="font-bold">Ask about these listings</h3>
      </div>

      <div className="mt-4 max-h-80 space-y-3 overflow-y-auto">
        {messages.map((m, i) => (
          <p
            key={i}
            className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${m.role === "user" ? "ml-auto bg-brand text-brand-foreground" : "bg-muted"}`}
          >
            {m.content}
          </p>
        ))}
        {busy && <p className="max-w-[85%] rounded-2xl bg-muted px-4 py-2 text-sm text-muted-foreground">Typing…</p>}
      </div>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => { e.preventDefault(); void send(); }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Do you have a 3-bedroom in Kicukiro?"
          aria-label="Ask the assistant a question"
          className="rounded-full"
        />
        <Button type="submit" disabled={busy} aria-label="Send question" className="rounded-full bg-brand px-4 text-brand-foreground hover:bg-brand/90">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
