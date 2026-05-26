import React, { useState, useEffect } from "react";
import { 
  Search, Calendar, User as UserIcon, Radio, MessageSquare, Clock, ArrowRight, CornerDownRight 
} from "lucide-react";
import { Conversation, Message, User, Channel } from "../types";

interface HistoryProps {
  token: string;
  users: User[];
  channels: Channel[];
}

export default function History({ token, users, channels }: HistoryProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const fetchConversations = async () => {
    try {
      setLoadingConv(true);
      const res = await fetch("/api/conversations", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Only show closed tickets
        const closed = data.filter((c: Conversation) => c.status === "closed");
        setConversations(closed);
      }
    } catch (err) {
      console.error("Erro ao carregar histórico:", err);
    } finally {
      setLoadingConv(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [token]);

  // Load message history on selection
  useEffect(() => {
    if (!selectedConvId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        setLoadingMessages(true);
        const res = await fetch(`/api/conversations/${selectedConvId}/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (err) {
        console.error("Erro ao carregar mensagens do histórico:", err);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedConvId]);

  // Handle multi filtration
  const filteredConversations = conversations.filter(c => {
    // 1. Search Query
    const matchesSearch = c.contactName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.contactIdentifier.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 2. Filter by Agent
    const matchesAgent = selectedAgent ? c.assignedTo === selectedAgent : true;

    // 3. Filter by Channel
    const matchesChannel = selectedChannel ? c.channel === selectedChannel : true;

    // 4. Filter by Date
    const matchesDate = selectedDate ? c.updatedAt.startsWith(selectedDate) : true;

    return matchesSearch && matchesAgent && matchesChannel && matchesDate;
  });

  const activeConv = conversations.find(c => c.id === selectedConvId);

  const getChannelIcon = (type: string) => {
    switch (type) {
      case "whatsapp": return "🟢 WhatsApp";
      case "instagram": return "📸 Instagram";
      case "facebook": return "🔵 Messenger";
      case "webchat": return "🌐 WebChat";
      default: return type;
    }
  };

  const getSenderName = (m: Message) => {
    if (m.sender === "client") return activeConv?.contactName || "Cliente";
    if (m.sender === "ai") return "🤖 OmniFlow AI";
    if (m.sender === "system") return "⚙️ Sistema";
    return m.senderName || "Atendente";
  };

  return (
    <div className="flex h-full bg-[#0f172a] text-[#cbd5e1] font-sans">
      
      {/* Sidebar List of Closed Conversations */}
      <div className="w-[380px] border-r border-[#1e293b] flex flex-col bg-[#111827] shrink-0">
        
        {/* Sidebar Header with Filter Panel */}
        <div className="p-4 border-b border-[#1e293b] space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white tracking-tight uppercase">Histórico</h2>
            <span className="px-2 py-0.5 bg-[#1e293b] text-indigo-400 font-bold text-[10px] rounded">
              {filteredConversations.length} Finalizados
            </span>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar cliente ou contato..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#6366f1] transition-all"
            />
          </div>

          {/* Core filters */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            
            {/* Filter 1: Channels */}
            <div>
              <label className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1">Canal</label>
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="w-full bg-[#1e293b] border border-[#334155] rounded-lg p-1.5 text-[11px] text-[#cbd5e1] focus:outline-none cursor-pointer"
              >
                <option value="">Todos</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="webchat">WebChat</option>
              </select>
            </div>

            {/* Filter 2: Agent */}
            <div>
              <label className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1">Atendente</label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="w-full bg-[#1e293b] border border-[#334155] rounded-lg p-1.5 text-[11px] text-[#cbd5e1] focus:outline-none cursor-pointer"
              >
                <option value="">Todos</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            {/* Filter 3: Date */}
            <div className="col-span-2">
              <label className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1">Filtrar por data de encerramento</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-[#1e293b] border border-[#334155] rounded-lg p-1.5 text-[11px] text-[#cbd5e1] focus:outline-none"
              />
            </div>

          </div>

          {(searchQuery || selectedAgent || selectedChannel || selectedDate) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedAgent("");
                setSelectedChannel("");
                setSelectedDate("");
              }}
              className="text-[10px] text-red-400 hover:text-red-300 transition font-bold block ml-auto pt-1 cursor-pointer"
            >
              Limpar Filtros ✕
            </button>
          )}

        </div>

        {/* Closed list scroll wrapper */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#1e293b]/60">
          {loadingConv && filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">Carregando histórico...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">Nenhum atendimento finalizado encontrado com os filtros atuais.</div>
          ) : (
            filteredConversations.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedConvId(c.id)}
                className={`w-full p-4 text-left flex gap-3 transition-colors duration-200 cursor-pointer ${
                  selectedConvId === c.id ? "bg-[#1e293b]" : "hover:bg-[#1e293b]/40"
                }`}
              >
                <img
                  src={c.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                  alt={c.contactName}
                  className="w-10 h-10 rounded-full object-cover shrink-0 border border-[#334155]"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xs font-bold text-white truncate">{c.contactName}</h3>
                    <span className="text-[9px] font-mono text-slate-500 shrink-0">
                      {new Date(c.updatedAt).toLocaleDateString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{c.contactIdentifier}</p>
                  
                  <div className="flex gap-2 items-center mt-2">
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-[#1e293b] text-[#cbd5e1]">
                      {getChannelIcon(c.channel)}
                    </span>
                    {c.assignedName && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-indigo-950/80 text-indigo-300">
                        Atendido: {c.assignedName}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

      </div>

      {/* Main Chat History Viewer */}
      <div className="flex-1 flex flex-col bg-[#0f172a]">
        {activeConv ? (
          <>
            {/* Header toolbar stats */}
            <div className="h-16 border-b border-[#1e293b] px-6 flex items-center justify-between bg-[#111827]">
              <div className="flex items-center gap-3">
                <img
                  src={activeConv.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                  alt={activeConv.contactName}
                  className="w-9 h-9 rounded-full object-cover border border-[#334155]"
                />
                <div>
                  <h2 className="text-xs font-bold text-white">{activeConv.contactName}</h2>
                  <p className="text-[10px] text-slate-400 leading-none mt-1">Contato ID: {activeConv.contactIdentifier}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block text-[10px] font-extrabold uppercase px-2.5 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700 tracking-wider">
                  Atendimento Resolvido
                </span>
                <p className="text-[9px] text-[#6366f1] font-bold mt-1">Concluído em: {new Date(activeConv.updatedAt).toLocaleDateString("pt-BR")}</p>
              </div>
            </div>

            {/* Conversational Stream History */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingMessages ? (
                <div className="flex-1 flex justify-center items-center h-full">
                  <span className="text-slate-500 animate-pulse text-xs text-center font-bold">Carregando transcrições de mensagens...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-slate-500 pt-12 text-xs">Sem conteúdos de mensagem registrados.</div>
              ) : (
                messages.map((m) => {
                  const isClient = m.sender === "client";
                  const isSystem = m.sender === "system";
                  const isAI = m.sender === "ai";

                  if (isSystem) {
                    return (
                      <div key={m.id} className="flex justify-center my-2 animate-fadeIn">
                        <span className="text-[10px] bg-slate-900/60 border border-slate-850 text-slate-400 px-3 py-1 rounded-lg">
                          {m.text}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col max-w-[70%] ${
                        isClient ? "mr-auto items-start" : "ml-auto items-end"
                      }`}
                    >
                      {/* Name tag */}
                      <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider mb-1">
                        {getSenderName(m)}
                      </span>

                      {/* Content bubble */}
                      <div
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                          isClient
                            ? "bg-[#1e293b] text-white rounded-tl-none border border-[#334155]/60"
                            : isAI
                            ? "bg-indigo-950/40 border border-[#6366f1]/30 text-indigo-200 rounded-tr-none"
                            : "bg-[#6366f1] text-white rounded-tr-none"
                        }`}
                      >
                        <p>{m.text}</p>
                        
                        {/* Message timestamp */}
                        <div className={`text-[8px] mt-1.5 text-right font-mono ${isClient || isAI ? "text-slate-500" : "text-white/70"}`}>
                          {new Date(m.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-center p-12 space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-[#6366f1] shadow-lg">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-extrabold text-[#fff]">Nenhum Atendimento Histórico Selecionado</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Selecione qualquer contato finalizado na barra lateral esquerda para visualizar o histórico de conversação completo do cliente.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
