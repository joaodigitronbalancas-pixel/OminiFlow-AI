import { useState, useEffect } from "react";
import { 
  MessageSquare, BarChart3, Radio, Bot, Users, MessageCirclePlus, Laptop, LogOut, Building2, ShieldCheck, Zap, History as HistoryIcon
} from "lucide-react";

// Sub-components import
import Login from "./components/Login";
import Inbox from "./components/Inbox";
import Dashboard from "./components/Dashboard";
import History from "./components/History";
import Integrations from "./components/Integrations";
import AICenter from "./components/AICenter";
import Operators from "./components/Operators";
import InternalChat from "./components/InternalChat";
import EmbedWidget from "./components/EmbedWidget";

import { Conversation, Channel, Tag, QuickReply, User, Company } from "./types";

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("pluzapp_token"));
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  
  // Navigation
  const [activeTab, setActiveTab] = useState<"inbox" | "dashboard" | "history" | "integrations" | "ai" | "team-chat" | "rbac" | "widget">("inbox");

  // Global State snapshots synced from DB
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [internalChats, setInternalChats] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);

  // Load active session profile
  useEffect(() => {
    if (!token) return;

    const fetchMe = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setCompany(data.company);
        } else {
          handleLogout();
        }
      } catch (err) {
        console.error("Erro ao validar sessão:", err);
      }
    };

    fetchMe();
  }, [token]);

  // Infinite Sync & Orchestrate Loop
  useEffect(() => {
    if (!token) return;

    const syncTick = async () => {
      try {
        const res = await fetch("/api/sync", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const snapshot = await res.json();
          setConversations(snapshot.conversations);
          setChannels(snapshot.channels);
          setTags(snapshot.tags);
          setQuickReplies(snapshot.quickReplies);
          setInternalChats(snapshot.internalChats);
          setUsersList(snapshot.users);
        }
      } catch (err) {
        console.error("Sync tick error:", err);
      }
    };

    syncTick();
    const interval = setInterval(syncTick, 2000);
    return () => clearInterval(interval);
  }, [token, activeTab]);

  const handleLoginSuccess = (newToken: string, loggedUser: User, loggedCompany: Company) => {
    localStorage.setItem("pluzapp_token", newToken);
    setToken(newToken);
    setUser(loggedUser);
    setCompany(loggedCompany);
    setActiveTab("inbox");
  };

  const handleLogout = () => {
    localStorage.removeItem("pluzapp_token");
    setToken(null);
    setUser(null);
    setCompany(null);
  };

  // Switch enterprise tenant instantly
  const handleSwitchTenant = async (targetCompanyId: string) => {
    try {
      const res = await fetch("/api/auth/switch-tenant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ targetCompanyId })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("pluzapp_token", data.token);
        setToken(data.token);
        setCompany(data.company);
        setActiveTab("inbox");
      }
    } catch (err) {
      console.error("Falha ao alternar empresa multi-tenant:", err);
    }
  };

  if (!token || !user || !company) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const isSuperAdmin = user.role === "SUPER_ADMIN";

  return (
    <div className="h-screen flex flex-col bg-[#0f172a] font-sans text-[#cbd5e1] antialiased overflow-hidden select-none">
      
      {/* OmniFlow AI - Top Navigation bar */}
      <header className="h-[60px] bg-[#111827] text-white flex justify-between items-center px-6 border-b border-[#1e293b] relative z-30 shadow-md">
        
        {/* Logo and Premium Branding */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#6366f1] flex items-center justify-center font-bold text-sm shadow-lg shadow-[#6366f1]/20 text-white">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-black tracking-tight text-base font-sans">
            OmniFlow <span className="text-[#6366f1]">AI</span>
          </span>
        </div>

        {/* Tenant selector & Operator profile details */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          
          {/* Multi-tenant toggles */}
          {isSuperAdmin ? (
            <div className="flex items-center gap-2 bg-[#1e293b] px-3.5 py-1.5 rounded-xl border border-[#334155]/60">
              <Building2 className="w-4 h-4 text-[#6366f1] shrink-0" />
              <span className="text-[10px] text-slate-400 uppercase font-bold">Alternar Empresa:</span>
              <select
                value={company.id}
                onChange={(e) => handleSwitchTenant(e.target.value)}
                className="bg-transparent border-0 outline-none text-[#cbd5e1] font-bold max-w-[190px] cursor-pointer"
              >
                <option value="1" className="bg-[#111827] text-white font-semibold">OmniFlow Corp (SaaS)</option>
                <option value="2" className="bg-[#111827] text-white font-semibold flex">Clínica Bem Estar</option>
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-[#1e293b]/50 px-3.5 py-1.5 rounded-xl text-slate-300 border border-[#334155]/40 text-[11px]">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>SaaS Ativo: <strong className="text-white font-extrabold">{company.name}</strong></span>
            </div>
          )}

          {/* Active Profile Info */}
          <div className="flex items-center gap-3.5 border-l border-[#1e293b] pl-4">
            <div className="text-right">
              <p className="text-[11px] font-bold text-white leading-none">{user.name}</p>
              <div className="flex items-center gap-1 mt-1 justify-end">
                <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[9px] text-indigo-300 font-extrabold uppercase bg-indigo-950 px-1.5 py-0.2 rounded tracking-wider border border-purple-900/40">
                  {user.role}
                </span>
              </div>
            </div>
            
            <img
              src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
              alt={user.name}
              className="w-8.5 h-8.5 rounded-full object-cover border border-[#1e293b] shadow"
              referrerPolicy="no-referrer"
            />

            <button
              onClick={handleLogout}
              className="p-1.5 hover:bg-[#1e293b] rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Encerrar Sessão"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* 2-PART GLOBAL LAYOUT: SIDEBAR + CONTENT VIEW */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Aside premium Sidebar and lists */}
        <aside className="w-64 bg-[#111827] text-slate-350 border-r border-[#1e293b] py-6 px-3 flex flex-col justify-between sticky top-[60px] h-[calc(100vh-60px)] z-20">
          
          {/* Menu Items */}
          <div className="space-y-1.5">
            <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-4">Workspace Principal</span>
            
            <button
              onClick={() => setActiveTab("inbox")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                activeTab === "inbox" 
                  ? "bg-[#6366f1] text-white font-extrabold shadow-md shadow-[#6366f1]/20" 
                  : "hover:bg-[#1e293b] hover:text-slate-200 text-slate-400"
              }`}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              📥 Inbox
            </button>

            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                activeTab === "dashboard" 
                  ? "bg-[#6366f1] text-white font-extrabold shadow-md shadow-[#6366f1]/20" 
                  : "hover:bg-[#1e293b] hover:text-slate-200 text-slate-400"
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              📊 Relatórios
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                activeTab === "history" 
                  ? "bg-[#6366f1] text-white font-extrabold shadow-md shadow-[#6366f1]/20" 
                  : "hover:bg-[#1e293b] hover:text-slate-200 text-slate-400"
              }`}
            >
              <HistoryIcon className="w-4 h-4 shrink-0" />
              🕘 Histórico
            </button>

            <button
              onClick={() => setActiveTab("ai")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                activeTab === "ai" 
                  ? "bg-[#6366f1] text-white font-extrabold shadow-md shadow-[#6366f1]/20" 
                  : "hover:bg-[#1e293b] hover:text-slate-200 text-slate-400"
              }`}
            >
              <Bot className="w-4 h-4 shrink-0 text-purple-400" />
              🤖 Agente IA
            </button>

            <span className="px-3 pt-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-4">Atendentes & Config</span>

            <button
              onClick={() => setActiveTab("integrations")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                activeTab === "integrations" 
                  ? "bg-[#6366f1] text-white font-extrabold shadow-md shadow-[#6366f1]/20" 
                  : "hover:bg-[#1e293b] hover:text-slate-200 text-slate-400"
              }`}
            >
              <Radio className="w-4 h-4 shrink-0" />
              🔌 Canais Coletadores
            </button>

            <button
              onClick={() => setActiveTab("team-chat")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                activeTab === "team-chat" 
                  ? "bg-[#6366f1] text-white font-extrabold shadow-md shadow-[#6366f1]/20" 
                  : "hover:bg-[#1e293b] hover:text-slate-200 text-slate-400"
              }`}
            >
              <MessageCirclePlus className="w-4 h-4 shrink-0 text-indigo-400" />
              💬 Chat Corporativo
            </button>

            <button
              onClick={() => setActiveTab("rbac")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                activeTab === "rbac" 
                  ? "bg-[#6366f1] text-white font-extrabold shadow-md shadow-[#6366f1]/20" 
                  : "hover:bg-[#1e293b] hover:text-slate-200 text-slate-400"
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              👤 Membros
            </button>

            <button
              onClick={() => setActiveTab("widget")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                activeTab === "widget" 
                  ? "bg-[#6366f1] text-white font-extrabold shadow-md shadow-[#6366f1]/20" 
                  : "hover:bg-[#1e293b] hover:text-slate-200 text-slate-400"
              }`}
            >
              <Laptop className="w-4 h-4 shrink-0" />
              🌐 Widget do Site
            </button>
          </div>

          <div className="bg-[#1e293b]/40 p-4 rounded-xl border border-[#334155]/30 text-[10px] space-y-1 hover:border-slate-700/40 transition">
            <span className="font-bold text-white uppercase text-[8px] bg-indigo-950 px-1 py-0.2 rounded border border-indigo-900 text-indigo-300">OmniFlow AI v3.0</span>
            <p className="text-slate-500 mt-1 font-semibold leading-relaxed">Conectores inteligentes e roteamentos autônomos com alta segurança.</p>
          </div>
        </aside>

        {/* Primary View Area */}
        <main className="flex-1 bg-[#0f172a] h-[calc(100vh-60px)] relative overflow-hidden">
          {activeTab === "inbox" && (
            <Inbox
              conversations={conversations}
              channels={channels}
              tags={tags}
              quickReplies={quickReplies}
              users={usersList}
              token={token}
              currentUserId={user.id}
              onStateChange={() => {}}
            />
          )}

          {activeTab === "dashboard" && <Dashboard token={token} />}

          {activeTab === "history" && (
            <History
              token={token}
              users={usersList}
              channels={channels}
            />
          )}

          {activeTab === "integrations" && (
            <Integrations
              channels={channels}
              token={token}
              onStateChange={() => {}}
            />
          )}

          {activeTab === "ai" && <AICenter token={token} />}

          {activeTab === "team-chat" && <InternalChat token={token} currentUserId={user.id} />}

          {activeTab === "rbac" && <Operators token={token} currentUserRole={user.role} />}

          {activeTab === "widget" && (
            <EmbedWidget
              companyId={company.id}
              companyName={company.name}
            />
          )}
        </main>

      </div>
    </div>
  );
}
