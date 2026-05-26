import React, { useState, useEffect, useRef } from "react";
import { 
  Search, MessageSquare, Tag as TagIcon, Bot, User as UserIcon, CheckCircle2, 
  Clock, Archive, AlertTriangle, Send, Sparkles, UserCheck, Plus, Trash2, HelpCircle
} from "lucide-react";
import { Conversation, Message, Tag, QuickReply, User } from "../types";

interface InboxProps {
  conversations: Conversation[];
  channels: any[];
  tags: Tag[];
  quickReplies: QuickReply[];
  users: User[];
  token: string;
  currentUserId: string;
  onStateChange: () => void;
}

export default function Inbox({
  conversations,
  channels,
  tags,
  quickReplies,
  users,
  token,
  currentUserId,
  onStateChange
}: InboxProps) {
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusTab, setStatusTab] = useState<"open" | "pending" | "closed">("open");
  
  // Modals / Dropdowns togglers
  const [showTagModal, setShowTagModal] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("bg-slate-500 text-white");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll messages to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Poll current conversation messages on selection
  useEffect(() => {
    if (!selectedConvId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/conversations/${selectedConvId}/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (err) {
        console.error("Erro ao carregar mensagens:", err);
      }
    };

    fetchMessages();

    // Secondary local poll loop for active chat (simulates WebSocket)
    const interval = setInterval(fetchMessages, 2500);
    return () => clearInterval(interval);
  }, [selectedConvId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const activeConv = conversations.find(c => c.id === selectedConvId);

  // Filter conversations based on current active tab and query
  const filteredConversations = conversations.filter(c => {
    const matchesStatus = c.status === statusTab;
    const matchesSearch = c.contactName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.contactIdentifier.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Action: Send Message and simulate Typing Indicator + Auto Answer ticks
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!selectedConvId || !textToSend.trim()) return;

    try {
      const res = await fetch(`/api/conversations/${selectedConvId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: textToSend })
      });

      if (res.ok) {
        const newMsg = await res.json();
        setMessages(prev => [...prev, newMsg]);
        if (!customText) setInputText("");
        onStateChange();

        // Simulate a cute typing indicator from the customer typing back after 4s
        const simulateAiActive = activeConv?.aiActive;
        setTimeout(() => {
          setIsTyping(true);
        }, 3000);

        setTimeout(() => {
          setIsTyping(false);
          onStateChange();
        }, 8000);
      }
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
    }
  };

  // Action: Toggle AI Agent Control
  const handleToggleAI = async (currentStatus: boolean) => {
    if (!selectedConvId) return;
    try {
      const res = await fetch(`/api/conversations/${selectedConvId}/ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ aiActive: !currentStatus })
      });
      if (res.ok) {
        onStateChange();
      }
    } catch (err) {
      console.error("AI Toggle err:", err);
    }
  };

  // Action: Reassign Operator ticket
  const handleReassign = async (operatorId: string) => {
    if (!selectedConvId) return;
    try {
      const res = await fetch(`/api/conversations/${selectedConvId}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ assignedTo: operatorId || null })
      });
      if (res.ok) {
        onStateChange();
      }
    } catch (err) {
      console.error("Reassign err:", err);
    }
  };

  // Action: Close / Archive Conversation Ticket
  const handleStatusChange = async (targetStatus: "open" | "pending" | "closed") => {
    if (!selectedConvId) return;
    try {
      const res = await fetch(`/api/conversations/${selectedConvId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: targetStatus })
      });
      if (res.ok) {
        onStateChange();
      }
    } catch (err) {
      console.error("Status Change err:", err);
    }
  };

  // Action: Update Contact Tags
  const handleTagToggle = async (tagId: string) => {
    if (!activeConv) return;
    const tagList = activeConv.tags.includes(tagId)
      ? activeConv.tags.filter(id => id !== tagId)
      : [...activeConv.tags, tagId];

    try {
      const res = await fetch(`/api/conversations/${activeConv.id}/tags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ tags: tagList })
      });
      if (res.ok) {
        onStateChange();
      }
    } catch (err) {
      console.error("Tag Toggle err:", err);
    }
  };

  // Action: Create absolute new tag
  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newTagName, color: newTagColor })
      });
      if (res.ok) {
        setNewTagName("");
        setShowTagModal(false);
        onStateChange();
      }
    } catch (err) {
      console.error("Create Tag err:", err);
    }
  };

  const handleInsertQuickReply = (text: string) => {
    setInputText(text);
  };

  // Stylized channels badges helper
  const renderChannelIcon = (type: string) => {
    switch (type) {
      case "whatsapp": return <span className="text-[#25D366] font-extrabold text-[10px] tracking-wider">WA</span>;
      case "instagram": return <span className="text-[#f15bb5] font-extrabold text-[10px] tracking-wider">IG</span>;
      case "facebook": return <span className="text-[#00bbf9] font-extrabold text-[10px] tracking-wider">FB</span>;
      default: return <span className="text-[#6366f1] font-extrabold text-[10px] tracking-wider">WEB</span>;
    }
  };

  const colorsPreset = [
    "bg-red-500 text-white",
    "bg-amber-500 text-white",
    "bg-emerald-500 text-white",
    "bg-indigo-500 text-white",
    "bg-purple-500 text-white",
    "bg-rose-500 text-white",
  ];

  return (
    <div className="h-[calc(100vh-61px)] flex bg-[#0f172a] text-[#cbd5e1] font-sans overflow-hidden">
      
      {/* COLUMN 1: Conversation list rail styled like dark Whatsapp Web list */}
      <div className="w-80 flex flex-col border-r border-[#1e293b] bg-[#111827] h-full shrink-0">
        
        {/* Contact list search */}
        <div className="p-4 border-b border-[#1e293b] bg-[#111827]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por cliente/identificador..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#1e293b] text-white border border-[#334155] hover:border-slate-600 focus:border-[#6366f1] outline-none rounded-xl text-xs transition-all"
            />
          </div>
        </div>

        {/* Status Hub menu Selector */}
        <div className="grid grid-cols-3 text-center border-b border-[#1e293b] bg-[#111827] text-xs">
          <button
            onClick={() => setStatusTab("open")}
            className={`py-3 font-bold flex items-center justify-center gap-1.5 transition-all relative border-b-2 cursor-pointer ${
              statusTab === "open" 
                ? "text-[#6366f1] border-[#6366f1] bg-[#1e293b]/30" 
                : "text-slate-450 border-transparent hover:text-white"
            }`}
          >
            <Clock className="w-3.5 h-3.5 shrink-0" />
            Abertos
            {conversations.filter(c => c.status === "open").length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1] animate-ping" />
            )}
          </button>
          
          <button
            onClick={() => setStatusTab("pending")}
            className={`py-3 font-bold flex items-center justify-center gap-1.5 transition-all relative border-b-2 cursor-pointer ${
              statusTab === "pending" 
                ? "text-amber-500 border-amber-500 bg-[#1e293b]/20" 
                : "text-slate-450 border-transparent hover:text-white"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            Pendente
          </button>

          <button
            onClick={() => setStatusTab("closed")}
            className={`py-3 font-bold flex items-center justify-center gap-1.5 transition-all relative border-b-2 cursor-pointer ${
              statusTab === "closed" 
                ? "text-slate-350 border-slate-500 bg-[#1e293b]/20" 
                : "text-slate-450 border-transparent hover:text-[#fff]"
            }`}
          >
            <Archive className="w-3.5 h-3.5 shrink-0" />
            Resolvido
          </button>
        </div>

        {/* Sidebar chat list */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#1e293b]/40">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 mt-12 space-y-2">
              <MessageSquare className="w-8 h-8 text-[#1e293b] mb-1" />
              <p className="text-xs font-bold text-slate-400">Caixa de entrada limpa</p>
              <p className="text-[10px] text-slate-500">Sem conversações registradas nesta fila.</p>
            </div>
          ) : (
            filteredConversations.map(conv => {
              const isSelected = selectedConvId === conv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`p-4 transition-all cursor-pointer text-left border-l-4 ${
                    isSelected 
                      ? "bg-[#1e293b]/70 border-[#6366f1] shadow-md" 
                      : "hover:bg-[#1e293b]/30 border-transparent bg-transparent"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar with Channel Overlay Badge */}
                    <div className="relative shrink-0">
                      <img
                        src={conv.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                        alt={conv.contactName}
                        className="w-10 h-10 rounded-full object-cover border border-[#334155]"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#111827] shadow rounded-full flex items-center justify-center border border-[#1e293b]">
                        {renderChannelIcon(conv.channel)}
                      </span>
                    </div>

                    {/* Meta information */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <h4 className="text-xs font-bold text-white truncate">{conv.contactName}</h4>
                        <span className="text-[9px] text-slate-500 font-mono shrink-0">
                          {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <p className="text-[10px] text-slate-400 font-mono truncate mb-1">
                        {conv.contactIdentifier}
                      </p>

                      {/* Flag states queue tags */}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {conv.aiActive ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-violet-950/50 text-purple-300 text-[9px] font-bold border border-purple-900/40">
                            <Bot className="w-2.5 h-2.5" />
                            Agente IA
                          </span>
                        ) : conv.assignedName ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-300 text-[9px] font-semibold border border-indigo-900/40 truncate max-w-[120px]">
                            <UserIcon className="w-2.5 h-2.5 shrink-0" />
                            {conv.assignedName}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-rose-950/40 text-rose-300 text-[9px] font-bold border border-rose-900/40 animate-pulse">
                            Aguardando Fila
                          </span>
                        )}

                        {/* Unread message state counter bubble */}
                        {conv.unreadCount > 0 && (
                          <span className="ml-auto w-5 h-5 rounded-full bg-[#25D366] text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>

                      {/* Display customized user tags */}
                      {conv.tags.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {conv.tags.map(tId => {
                            const found = tags.find(tg => tg.id === tId);
                            if (!found) return null;
                            return (
                              <span key={tId} className={`px-1.5 py-0.5 rounded text-[8px] font-semibold truncate max-w-[80px] bg-indigo-900/30 text-indigo-200 border border-indigo-900/40`}>
                                {found.name}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* COLUMN 2: Full interactive WhatsApp style main canvas chat workspace */}
      <div className="flex-1 flex flex-col h-full bg-[#0f172a] relative">
        {activeConv ? (
          <>
            {/* Thread Header details with dynamic handover controls */}
            <div className="p-4 border-b border-[#1e293b] bg-[#111827] flex justify-between items-center relative z-20">
              <div className="flex items-center gap-3">
                <img
                  src={activeConv.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                  alt={activeConv.contactName}
                  className="w-10 h-10 rounded-full object-cover border border-[#334155]"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 className="text-xs font-bold text-white">{activeConv.contactName}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                      {activeConv.contactIdentifier}
                    </span>
                  </div>
                </div>
              </div>

              {/* Handover queue and dispatch panel */}
              <div className="flex items-center gap-2">
                {/* AI Toggle slider */}
                <button
                  onClick={() => handleToggleAI(activeConv.aiActive)}
                  className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold tracking-tight uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeConv.aiActive 
                      ? "bg-violet-600 hover:bg-violet-700 text-white border-violet-600 shadow-md shadow-violet-600/15" 
                      : "bg-[#1e293b] hover:bg-[#334155] border-[#334155] text-slate-300"
                  }`}
                >
                  <Bot className="w-3.5 h-3.5 text-purple-400" />
                  {activeConv.aiActive ? "Robô Ativo" : "Ativar IA"}
                </button>

                {/* Operator transfer picker */}
                <div className="relative">
                  <select
                    value={activeConv.assignedTo || ""}
                    onChange={(e) => handleReassign(e.target.value)}
                    className="pl-2.5 pr-8 py-1.5 rounded-xl border border-[#334155] bg-[#1a2238] text-[10px] font-bold uppercase tracking-tight text-slate-300 outline-none focus:border-[#6366f1] appearance-none cursor-pointer"
                  >
                    <option value="">Fila Geral (Fervendo)</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>Disparar: {u.name}</option>
                    ))}
                  </select>
                  <UserCheck className="w-3 h-3 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Resolve status toggle button */}
                {activeConv.status !== "closed" ? (
                  <button
                    onClick={() => handleStatusChange("closed")}
                    className="px-3 py-1.5 rounded-xl bg-emerald-950/20 text-[#25D366] border border-[#25D366]/40 hover:bg-emerald-900/30 transition-all text-[10px] font-extrabold uppercase tracking-tight flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#25D366]" />
                    Resolver
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusChange("open")}
                    className="px-3 py-1.5 rounded-xl bg-indigo-950 text-indigo-300 border border-indigo-900 hover:bg-indigo-900 transition-all text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Archive className="w-3.5 h-3.5 shrink-0" />
                    Reabrir
                  </button>
                )}
              </div>
            </div>

            {/* Conversation Stream Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingMessages ? (
                <div className="flex justify-center items-center h-48">
                  <span className="w-5 h-5 rounded-full border-2 border-[#6366f1] border-t-transparent animate-spin" />
                </div>
              ) : (
                messages.map(msg => {
                  if (msg.sender === "system") {
                     return (
                      <div key={msg.id} className="flex justify-center my-3">
                        <span className="bg-[#111827] text-slate-400 border border-[#1e293b] rounded-full px-4 py-1 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 text-center">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  const isAi = msg.sender === "ai";
                  const isAgent = msg.sender === "agent";
                  const isClient = msg.sender === "client";

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[70%] ${
                        isClient ? "mr-auto items-start" : "ml-auto items-end"
                      }`}
                    >
                      {/* Name with elegant responsive timestamp */}
                      <div className="flex items-center gap-1.5 mb-1 text-[9px] text-[#cbd5e1] font-bold uppercase tracking-wider px-1">
                        {isAi && (
                          <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-indigo-950/40 text-purple-300 font-extrabold text-[8px]">
                            • IA
                          </span>
                        )}
                        {isAgent && <span className="text-[#6366f1]">👤 {msg.senderName}</span>}
                        {isClient && <span>{activeConv.contactName}</span>}
                        <span>•</span>
                        <span className="font-mono text-slate-500">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Msg bubble container */}
                      <div
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed break-words text-left shadow-md ${
                          isClient 
                            ? "bg-[#1e293b] text-white rounded-tl-none border border-[#334155]/60" 
                            : isAi 
                              ? "bg-indigo-950/40 border border-[#6366f1]/30 text-indigo-150 rounded-tr-none"
                              : "bg-[#6366f1] text-white rounded-tr-none"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Real-time typing dots emulation */}
              {isTyping && (
                <div className="flex flex-col items-start mr-auto max-w-[70%]">
                  <div className="flex items-center gap-1 mb-1 text-[9px] text-slate-500 font-semibold px-1">
                    <span>{activeConv.contactName} está digitando</span>
                  </div>
                  <div className="p-3 bg-[#1e293b] text-white rounded-2xl rounded-tl-none border border-[#334155]/60 flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100" />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200" />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-300" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick replies shelf */}
            {quickReplies.length > 0 && activeConv.status !== "closed" && (
              <div className="px-5 py-2.5 bg-[#111827] border-t border-[#1e293b] flex gap-2 overflow-x-auto whitespace-nowrap items-center min-h-[48px]">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Respostas Rápidas:</span>
                {quickReplies.map(qr => (
                  <button
                    key={qr.id}
                    onClick={() => handleInsertQuickReply(qr.text)}
                    className="px-3 py-1.5 bg-[#1e293b] hover:bg-[#334155] border border-[#334155] rounded-xl text-[10px] text-slate-200 font-semibold transition-all cursor-pointer"
                  >
                    !{qr.shortcut}
                  </button>
                ))}
              </div>
            )}

            {/* In-chat reply footer form */}
            {activeConv.status !== "closed" ? (
              <div className="p-4 border-t border-[#1e293b] bg-[#111827]">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-3 bg-[#1e293b] border border-[#334155] focus-within:border-[#6366f1] rounded-2xl p-2.5 transition-all"
                >
                  <textarea
                    rows={1}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Digite sua resposta omnichannel de atendimento..."
                    className="flex-1 bg-transparent border-0 outline-none resize-none px-2 text-xs text-white placeholder-slate-500"
                  />
                  
                  <button
                    type="submit"
                    className="w-9 h-9 shrink-0 rounded-xl bg-[#6366f1] hover:bg-[#5053df] text-white flex items-center justify-center transition-all cursor-pointer shadow-md shadow-[#6366f1]/20 active:scale-[0.96]"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="p-4 bg-[#111827] text-center text-xs text-amber-500 font-bold border-t border-[#1e293b] shadow-inner">
                ⚠️ Ticket Resolvido por completo. Para enviar novas mensagens, clique em "Reabrir" no cabeçalho.
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 bg-[#0f172a] space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#111827] border border-[#1e293b] flex items-center justify-center text-[#6366f1] shadow-lg shadow-indigo-500/5">
              <MessageSquare className="w-8 h-8 animate-pulse" />
            </div>
            <h3 className="text-sm font-extrabold text-white">Central Inbox Omnichannel AI</h3>
            <p className="text-xs text-slate-400 max-w-sm text-center">
              Selecione qualquer contato na barra lateral esquerda para iniciar a transcrição, transferir as filas ou responder utilizando o autoatendimento.
            </p>
          </div>
        )}
      </div>

      {/* COLUMN 3: Right details panel for Tags & Quick replies configuration */}
      {activeConv && (
        <div className="w-72 border-l border-[#1e293b] h-full flex flex-col overflow-y-auto bg-[#111827] p-5 shrink-0 text-left">
          {/* Action Profile summary */}
          <div className="flex flex-col items-center text-center pb-5 border-b border-[#1e293b]">
            <img
              src={activeConv.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
              alt={activeConv.contactName}
              className="w-16 h-16 rounded-full object-cover border-2 border-[#6366f1]/20 p-0.5 mb-2.5"
              referrerPolicy="no-referrer"
            />
            <h4 className="text-xs font-bold text-white">{activeConv.contactName}</h4>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{activeConv.contactIdentifier}</p>

            {activeConv.contactEmail && (
              <span className="text-[10px] text-slate-300 bg-[#1e293b] border border-[#334155] px-2.5 py-0.5 rounded-full mt-2 font-mono">
                {activeConv.contactEmail}
              </span>
            )}
          </div>

          {/* Tag labels manager section */}
          <div className="py-5 border-b border-[#1e293b]">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <TagIcon className="w-3.5 h-3.5 text-[#6366f1]" />
                Etiquetas / Tags
              </span>
              <button
                onClick={() => setShowTagModal(true)}
                className="w-5 h-5 rounded-md bg-[#6366f1]/10 hover:bg-[#6366f1]/20 text-[#6366f1] flex items-center justify-center transition-all cursor-pointer"
                title="Criar nova etiqueta"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {tags.length === 0 ? (
              <p className="text-[10px] text-slate-500 italic">Nenhuma etiqueta cadastrada.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {tags.map(t => {
                  const hasTag = activeConv.tags.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleTagToggle(t.id)}
                      className={`px-2 py-1 rounded text-[9px] font-bold border transition-all cursor-pointer ${
                        hasTag 
                          ? `${t.color} border-transparent shadow shadow-indigo-600/10` 
                          : "bg-transparent border-[#334155] text-slate-400 hover:text-white hover:border-slate-500"
                      }`}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick replies creator form */}
          <div className="py-5">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#cbd5e1]">Atalhos Ativos</span>
              <span className="text-[9px] text-[#6366f1] font-mono font-bold">{quickReplies.length} cadastrados</span>
            </div>
            <p className="text-[9px] text-slate-500 leading-relaxed mb-4">Pressione cliques rápidas nos botões sob o chat para usá-las.</p>
            
            {quickReplies.length === 0 ? (
              <p className="text-[10px] text-slate-500 italic">Nenhuma resposta cadastrada nesta empresa.</p>
            ) : (
              <div className="space-y-2">
                {quickReplies.map(q => (
                  <div key={q.id} className="p-2.5 bg-[#1e293b]/50 border border-[#1e293b] rounded-xl text-[10px] text-slate-350 select-text">
                    <span className="font-bold text-white shrink-0 bg-[#334155] rounded px-1 text-[8px] mr-1.5 font-mono">!{q.shortcut}</span>
                    <p className="mt-1 truncate">{q.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Minimalistic modal code to configure tags popup */}
      {showTagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs font-sans">
          <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-6 w-full max-w-sm mx-4 text-left">
            <h3 className="text-sm font-extrabold text-white mb-4 uppercase">Criar Etiqueta de Atendimento</h3>
            <form onSubmit={handleCreateTag} className="space-y-4">
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-slate-450 font-bold mb-1.5">Nome da Etiqueta</label>
                <input
                  type="text"
                  placeholder="Ex: Comercial 💰"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="w-full bg-[#1e293b] text-white border border-[#334155] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#6366f1]"
                  required
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-wider text-slate-450 font-bold mb-1.5">Escolher Cor de Destaque</label>
                <div className="grid grid-cols-3 gap-2">
                  {colorsPreset.map(col => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setNewTagColor(col)}
                      className={`p-1.5 rounded-lg text-[10px] font-bold ${col} border-2 ${
                        newTagColor === col ? "border-white" : "border-transparent"
                      }`}
                    >
                      Tom
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTagModal(false)}
                  className="px-3.5 py-1.5 bg-transparent hover:bg-slate-800 text-xs text-slate-400 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#6366f1] hover:bg-[#5053df] text-white text-xs font-bold rounded-xl"
                >
                  Gravar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
