import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Bot, Shield, Terminal } from "lucide-react";
import { InternalChatMessage } from "../types";

interface InternalChatProps {
  token: string;
  currentUserId: string;
}

export default function InternalChat({ token, currentUserId }: InternalChatProps) {
  const [messages, setMessages] = useState<InternalChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchInternalChatHistory = async () => {
    try {
      const res = await fetch("/api/internal-chats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Erro ao ler chat interno:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInternalChatHistory();
    // Regular polling sequence to fetch chat updates
    const interval = setInterval(fetchInternalChatHistory, 3000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendInternal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    try {
      const res = await fetch("/api/internal-chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: inputText })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, data]);
        setInputText("");
      }
    } catch (err) {
      console.error("Erro ao enviar chat interno:", err);
    }
  };

  return (
    <div className="h-[calc(100vh-61px)] flex flex-col bg-slate-50/40 font-sans text-left">
      {/* Banner info */}
      <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-5 h-5 text-indigo-600 shrink-0" />
          <div>
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Chat Corporativo Interno</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Espaço de comunicação restrito apenas a membros integrados na empresa</p>
          </div>
        </div>
      </div>

      {/* Message box */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <span className="w-3 h-3 rounded-full bg-indigo-600 animate-ping"></span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 max-w-sm mx-auto text-center mt-12">
            <MessageSquare className="w-10 h-10 text-slate-300 mb-3" />
            <span className="text-xs font-bold text-slate-700">Abra o diálogo na empresa</span>
            <p className="text-[10px] mt-1 text-slate-500">Mande uma mensagem agora e alinhe transferências de chats ou horários de SLA corporativos.</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div key={msg.id} className={`flex gap-3 items-start ${isMe ? "flex-row-reverse" : ""}`}>
                <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-xs text-indigo-700 shrink-0">
                  {msg.senderName.charAt(0)}
                </div>

                <div className={`space-y-1.5 ${isMe ? "text-right" : "text-left"}`}>
                  <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold justify-start">
                    <span className="text-slate-600">{msg.senderName}</span>
                    <span className="text-[8px] bg-slate-100 text-slate-500 px-1 rounded font-mono">{msg.senderRole}</span>
                    <span>•</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div className={`p-3 rounded-2xl text-xs leading-relaxed max-w-md ${
                    isMe 
                      ? "bg-slate-800 text-white rounded-tr-none" 
                      : "bg-white text-slate-800 border border-slate-150 rounded-tl-none"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={scrollRef} />
      </div>

      {/* Sending input form */}
      <div className="p-4 bg-white border-t border-slate-100">
        <form onSubmit={handleSendInternal} className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Escreva uma mensagem interna para o time..."
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 outline-none focus:border-indigo-500 focus:bg-white text-xs rounded-xl transition-all"
          />
          <button
            type="submit"
            className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow shadow-indigo-600/10 active:scale-[0.98]"
          >
            <Send className="w-3.5 h-3.5" />
            Enviar
          </button>
        </form>
      </div>

    </div>
  );
}
