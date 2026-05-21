"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Bot,
  User,
  Terminal,
  Sparkles,
  Trash2,
  Loader2,
  ShieldAlert,
  Network,
  Database,
  RefreshCw,
  Info,
  CheckCircle2,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useGlobalData } from "@/app/context/GlobalDataContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "agent";
  content: string;
  timestamp: Date;
}

export default function AgentPage() {
  const { data, refreshData, isLoading: isDbLoading } = useGlobalData();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [agentStatus, setAgentStatus] = useState<"idle" | "thinking" | "error">("idle");
  const [lastError, setLastError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load conversation thread and messages from sessionStorage to persist during refresh
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedThreadId = sessionStorage.getItem("secops_agent_thread_id");
      const savedMessages = sessionStorage.getItem("secops_agent_messages");

      if (savedThreadId) {
        setThreadId(savedThreadId);
      } else {
        // Initialize a new unique thread ID
        const newThreadId = Math.random().toString(36).substring(2, 15);
        setThreadId(newThreadId);
        sessionStorage.setItem("secops_agent_thread_id", newThreadId);
      }

      if (savedMessages) {
        try {
          const parsed = JSON.parse(savedMessages).map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }));
          setMessages(parsed);
        } catch (e) {
          console.error("Failed to parse saved chat messages:", e);
        }
      }
    }
    // Set tab title
    document.title = "SecOps AI Agent | INIDS Dashboard";
  }, []);

  // Sync messages to sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined" && messages.length > 0) {
      sessionStorage.setItem("secops_agent_messages", JSON.stringify(messages));
    }
  }, [messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Auto-resize input textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    setLastError(null);
    const userMsg: Message = {
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setAgentStatus("thinking");

    try {
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: textToSend,
          threadId: threadId || undefined,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || `Server error: ${response.status}`);
      }

      const result = await response.json();

      if (result.threadId && result.threadId !== threadId) {
        setThreadId(result.threadId);
        sessionStorage.setItem("secops_agent_thread_id", result.threadId);
      }

      const agentMsg: Message = {
        role: "agent",
        content: result.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, agentMsg]);
      setAgentStatus("idle");
    } catch (error: any) {
      console.error("Chat error:", error);
      setLastError(error.message || "Failed to reach SecOps agent.");
      setAgentStatus("error");

      // Add a system warning message in message history
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          content: `⚠️ **Error communicating with the security agent backend:** ${error.message || "Endpoint connection failed"}.\n\nEnsure that the LangGraph agent service is running locally on port 8000.`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear this conversation session?")) {
      setMessages([]);
      const newThreadId = Math.random().toString(36).substring(2, 15);
      setThreadId(newThreadId);
      sessionStorage.setItem("secops_agent_thread_id", newThreadId);
      sessionStorage.removeItem("secops_agent_messages");
      setLastError(null);
      setAgentStatus("idle");
    }
  };

  // Pre-configured premium quick action cards
  const suggestionCards = [
    {
      title: "Show Active Devices",
      prompt: "What devices (assets) exist in our database? Summarize their details.",
      description: "List IP ranges, hostnames, and asset counts from MongoDB.",
      icon: Database,
      color: "text-blue-500 bg-blue-500/10",
    },
    {
      title: "Audit Open Ports",
      prompt: "What ports open are there on those devices? List them and highlight severity levels.",
      description: "Review open ports and critical exposed services.",
      icon: Network,
      color: "text-amber-500 bg-amber-500/10",
    },
    {
      title: "Vulnerability Summary",
      prompt: "Summarize the high-risk exposures and vulnerable services on our targets.",
      description: "Identify systems running critical risk levels or CVEs.",
      icon: ShieldAlert,
      color: "text-destructive bg-destructive/10",
    },
    {
      title: "Ask General Cyber Threats",
      prompt: "What are the top 5 cybersecurity threats currently?",
      description: "Ask general SecOps or architectural cyber questions.",
      icon: Sparkles,
      color: "text-purple-500 bg-purple-500/10",
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-5xl mx-auto w-full border rounded-xl overflow-hidden bg-card shadow-lg flex-1">
      {/* Top Header & DB Context Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b p-4 bg-muted/20 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 text-primary">
            <Bot className="size-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              SecOps Intelligence Agent
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-emerald-500 border-emerald-500/30 bg-emerald-500/5 animate-pulse flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                ACTIVE
              </Badge>
            </h1>
            <p className="text-xs text-muted-foreground">LangGraph autonomous security analyst with local DB integration</p>
          </div>
        </div>

        {/* Database Status Monitor */}
        <div className="flex items-center gap-2 md:gap-4 flex-wrap bg-background/50 border rounded-lg px-3 py-1.5 text-xs font-mono">
          <span className="text-muted-foreground flex items-center gap-1 font-sans">
            <Database className="size-3.5" /> DB Context:
          </span>
          <div className="flex items-center gap-3 divide-x text-[11px]">
            <span className="pl-0">Targets: <b className="text-foreground">{data.targets?.length || 0}</b></span>
            <span className="pl-3">Assets: <b className="text-foreground">{data.assets?.length || 0}</b></span>
            <span className="pl-3">Ports: <b className="text-foreground">{data.ports?.length || 0}</b></span>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="size-6"
            onClick={() => refreshData()}
            disabled={isDbLoading}
            title="Refresh database context"
          >
            <RefreshCw className={`size-3.5 ${isDbLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10"
              onClick={handleClearChat}
            >
              <Trash2 className="size-3.5" />
              Clear Chat
            </Button>
          )}
        </div>
      </div>

      {/* Main Messages Panel */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
        {messages.length === 0 ? (
          /* Welcome Starter View (ChatGPT style) */
          <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center space-y-8 py-10">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <div className="relative p-6 border rounded-2xl bg-background shadow-inner">
                <Terminal className="size-12 text-primary mx-auto" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">How can I assist your SecOps reconnaissance?</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                I can audit open ports, map discovered assets, examine running services, or address general security issues. I have real-time access to the local database telemetry.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-left">
              {suggestionCards.map((card, idx) => (
                <Card
                  key={idx}
                  className="hover:border-primary/40 cursor-pointer transition-all duration-200 hover:shadow-md group bg-background"
                  onClick={() => handleSendMessage(card.prompt)}
                >
                  <CardContent className="p-4 flex gap-4.5 items-start">
                    <div className={`p-2.5 rounded-lg shrink-0 mt-0.5 ${card.color}`}>
                      <card.icon className="size-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors flex items-center gap-1.5">
                        {card.title}
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-mono font-bold text-primary">➜</span>
                      </h3>
                      <p className="text-xs text-muted-foreground leading-normal">{card.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          /* Conversation Thread */
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {/* Agent Avatar */}
                {msg.role === "agent" && (
                  <div className="shrink-0 size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mt-1 shadow-sm">
                    <Bot className="size-4.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-xl px-4 py-3 shadow-sm border ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground border-primary/20 rounded-tr-none"
                      : "bg-muted/40 border-border rounded-tl-none prose prose-sm dark:prose-invert max-w-[85%] leading-relaxed"
                  }`}
                >
                  {msg.role === "agent" ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        table: ({ node, ...props }) => (
                          <div className="overflow-x-auto my-3 rounded-lg border">
                            <table className="border-collapse w-full text-xs text-left" {...props} />
                          </div>
                        ),
                        thead: ({ node, ...props }) => <thead className="bg-muted text-muted-foreground uppercase text-[10px] font-bold" {...props} />,
                        th: ({ node, ...props }) => <th className="px-3 py-2 border-b" {...props} />,
                        td: ({ node, ...props }) => <td className="px-3 py-2 border-b font-mono" {...props} />,
                        code: ({ node, ...props }) => <code className="bg-primary/5 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono text-xs text-primary dark:text-primary-foreground font-bold" {...props} />,
                        pre: ({ node, ...props }) => <pre className="bg-black/90 text-green-400 p-3 rounded-lg font-mono text-xs overflow-x-auto my-3 border border-muted-foreground/15 shadow-inner" {...props} />,
                        a: ({ node, ...props }) => <a className="text-primary underline hover:text-primary/80 font-semibold" {...props} />,
                        p: ({ node, ...props }) => <p className="mb-2.5 last:mb-0" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc ml-5 mb-2.5 space-y-1" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal ml-5 mb-2.5 space-y-1" {...props} />,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                  )}
                  <span className="text-[9px] opacity-40 mt-1.5 block text-right font-mono">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* User Avatar */}
                {msg.role === "user" && (
                  <div className="shrink-0 size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center mt-1 shadow-sm border border-primary/20">
                    <User className="size-4.5" />
                  </div>
                )}
              </div>
            ))}

            {/* Thinking Loader */}
            {isLoading && (
              <div className="flex gap-4 justify-start">
                <div className="shrink-0 size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mt-1 animate-pulse shadow-sm">
                  <Bot className="size-4.5" />
                </div>
                <div className="bg-muted/40 border border-border rounded-xl rounded-tl-none px-4 py-3 max-w-[80%] flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                    <Loader2 className="size-3.5 animate-spin text-primary" />
                    Agent is querying database and processing tool calls...
                  </div>
                  <div className="space-y-1.5 w-60">
                    <div className="h-2 bg-muted rounded animate-pulse w-full" />
                    <div className="h-2 bg-muted rounded animate-pulse w-5/6" />
                    <div className="h-2 bg-muted rounded animate-pulse w-2/3" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Message Input Form */}
      <div className="border-t p-4 bg-muted/15 flex flex-col gap-2">
        {lastError && (
          <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-2 max-w-3xl mx-auto w-full">
            <ShieldAlert className="size-4 shrink-0" />
            <span className="font-medium truncate">{lastError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto w-full bg-background border rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask SecOps Agent about database hosts, open ports, or cyber threats..."
            className="w-full resize-none bg-transparent pr-12 pl-4 py-3.5 text-sm focus:outline-none placeholder:text-muted-foreground/60 min-h-[48px] max-h-[200px]"
            disabled={isLoading}
          />
          <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5">
            {input.trim() && (
              <Badge variant="outline" className="text-[9px] font-mono text-muted-foreground/60 border-muted-foreground/15 px-1 py-0 px-1.5 mr-1 hidden sm:inline-block">
                Enter to send
              </Badge>
            )}
            <Button
              type="submit"
              size="icon"
              className="size-7.5 rounded-lg shrink-0"
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
            </Button>
          </div>
        </form>

        <p className="text-[10px] text-muted-foreground/75 text-center mt-1 flex items-center justify-center gap-1">
          <Info className="size-3" />
          Autonomous SecOps Agent matches network ports against live asset catalogs to evaluate risks.
        </p>
      </div>
    </div>
  );
}
