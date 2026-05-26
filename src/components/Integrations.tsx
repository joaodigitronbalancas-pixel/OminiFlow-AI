import React, { useState } from "react";
import { 
  Bot, Settings, ShieldAlert, Plus, ShieldCheck, Loader2, RefreshCw, AlertCircle, HelpCircle
} from "lucide-react";
import { Channel } from "../types";

interface IntegrationsProps {
  channels: Channel[];
  token: string;
  onStateChange: () => void;
}

export default function Integrations({ channels, token, onStateChange }: IntegrationsProps) {
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Integration inputs
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"whatsapp" | "instagram" | "facebook" | "webchat">("whatsapp");
  const [instagramUser, setInstagramUser] = useState("");
  const [facebookPage, setFacebookPage] = useState("");

  const handleGenerateQR = async (channelId: string) => {
    setActiveChannelId(channelId);
    setLoadingQr(true);
    setQrCodeUrl(null);

    try {
      const res = await fetch(`/api/channels/${channelId}/qrcode`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQrCodeUrl(data.qrcode);
      }
    } catch (err) {
      console.error("Erro ao puxar QR Code Evolution:", err);
    } finally {
      setLoadingQr(false);
    }
  };

  const handleSimulateScan = async (channelId: string) => {
    try {
      const res = await fetch(`/api/channels/${channelId}/connect`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setQrCodeUrl(null);
        setActiveChannelId(null);
        onStateChange();
      }
    } catch (err) {
      console.error("Erro ao simular scan:", err);
    }
  };

  const handleDisconnect = async (channelId: string) => {
    try {
      const res = await fetch(`/api/channels/${channelId}/disconnect`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        onStateChange();
      }
    } catch (err) {
      console.error("Erro ao desconectar:", err);
    }
  };

  const handleAddIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newName,
          type: newType,
          instagramUser: newType === "instagram" ? instagramUser : undefined,
          facebookPage: newType === "facebook" ? facebookPage : undefined
        })
      });

      if (res.ok) {
        setNewName("");
        setInstagramUser("");
        setFacebookPage("");
        setShowAddModal(false);
        onStateChange();
      }
    } catch (err) {
      console.error("Erro ao adicionar integração:", err);
    }
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-[calc(100vh-61px)] overflow-y-auto font-sans text-left">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Canais Coletores (Evolution API)</h1>
          <p className="text-xs text-slate-500 mt-1">Integre múltiplos canais em lote com centralização omnichannel.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow shadow-indigo-600/15"
        >
          <Plus className="w-4 h-4" />
          Nova Integração
        </button>
      </div>

      {/* Connection Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {channels.map(chan => {
          const isWhatsApp = chan.type === "whatsapp";
          const isConnected = chan.status === "connected";
          const isConnectingActive = activeChannelId === chan.id;

          return (
            <div key={chan.id} className="bg-white rounded-2xl border border-slate-150 p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
              {/* Floating ambient badge type decoration */}
              <div className="absolute top-0 right-0 px-4 py-1.5 rounded-bl-xl bg-slate-50 text-[10px] font-bold text-slate-400 capitalize border-l border-b border-slate-100">
                {chan.type}
              </div>

              <div>
                <div className="flex items-center gap-3.5 mb-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm ${
                    chan.type === "whatsapp" ? "bg-[#25D366]/10 text-[#25D366]" :
                    chan.type === "instagram" ? "bg-[#E1306C]/10 text-[#E1306C]" :
                    chan.type === "facebook" ? "bg-[#1877F2]/10 text-[#1877F2]" :
                    "bg-indigo-50 text-indigo-600"
                  }`}>
                    {chan.type === "whatsapp" && "WA"}
                    {chan.type === "instagram" && "IG"}
                    {chan.type === "facebook" && "FB"}
                    {chan.type === "webchat" && "Web"}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{chan.name}</h3>
                    {chan.instagramUser && (
                      <p className="text-[10px] text-slate-400 font-mono">{chan.instagramUser}</p>
                    )}
                    {chan.facebookPage && (
                      <p className="text-[10px] text-slate-400 font-mono">{chan.facebookPage}</p>
                    )}
                  </div>
                </div>

                {/* Status bar details */}
                <div className="flex items-center gap-2 mb-6">
                  {isConnected ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      Status: Conectado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold border border-slate-200">
                      <ShieldAlert className="w-4 h-4 text-slate-400" />
                      Status: Desconectado
                    </span>
                  )}
                </div>
              </div>

              {/* QR Panel logic for whatsapp */}
              {isWhatsApp && isConnectingActive && (
                <div className="my-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center">
                  {loadingQr ? (
                    <div className="flex flex-col items-center justify-center h-48 py-8">
                      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                      <span className="text-[10px] text-slate-500 font-bold mt-3">Requisitando código à Evolution API...</span>
                    </div>
                  ) : qrCodeUrl ? (
                    <div className="flex flex-col items-center text-center space-y-4">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Escaneie o QR Code via WhatsApp Web</p>
                      <img src={qrCodeUrl} alt="WhatsApp QR Code" className="w-44 h-44 border-4 border-white shadow shadow-slate-200 rounded-xl" />
                      <button
                        onClick={() => handleSimulateScan(chan.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/10 active:scale-[0.97] cursor-pointer cursor-key flex items-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Simular Escaneamento
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-red-500">Falha ao carregar QR Code.</span>
                  )}
                </div>
              )}

              {/* Botões operacionais */}
              <div className="flex gap-2.5 mt-4 pt-4 border-t border-slate-100">
                {isWhatsApp && !isConnected && !isConnectingActive && (
                  <button
                    onClick={() => handleGenerateQR(chan.id)}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition-all shadow-xs shadow-indigo-600/5 cursor-pointer"
                  >
                    Gerar QR Code Baileys
                  </button>
                )}

                {isConnected ? (
                  <button
                    onClick={() => handleDisconnect(chan.id)}
                    className="flex-1 py-2 border border-rose-100 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Desconectar Canal
                  </button>
                ) : (
                  !isWhatsApp && (
                    <button
                      onClick={() => handleSimulateScan(chan.id)}
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Conectar Serviço
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Adicionar Integração */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[999] p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-slate-150 text-left">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Integrar Novo Canal Omnichannel</h3>

            <form onSubmit={handleAddIntegration} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1.5">Identificação</label>
                <input
                  type="text"
                  placeholder="Ex: WhatsApp Atendente Financeiro"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1.5">Canal de Origem</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 bg-white"
                >
                  <option value="whatsapp">WhatsApp (Evoluton / Baileys API)</option>
                  <option value="instagram">Instagram Graph API</option>
                  <option value="facebook">Facebook Messenger</option>
                  <option value="webchat">Chat do Site (Embutível)</option>
                </select>
              </div>

              {newType === "instagram" && (
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1.5">Usuário do Instagram (Visual)</label>
                  <input
                    type="text"
                    placeholder="Ex: @empresa.oficial"
                    value={instagramUser}
                    onChange={(e) => setInstagramUser(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              )}

              {newType === "facebook" && (
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1.5">Página do Facebook</label>
                  <input
                    type="text"
                    placeholder="Ex: Página Principal Oficial"
                    value={facebookPage}
                    onChange={(e) => setFacebookPage(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              )}

              <div className="flex gap-2.5 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow shadow-indigo-600/10"
                >
                  Criar Canal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Guide details */}
      <div className="bg-white rounded-2xl border border-slate-150 p-6 flex flex-col md:flex-row items-start gap-4">
        <HelpCircle className="w-8 h-8 text-indigo-500 shrink-0" />
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Como funcionam as Integrações?</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            A plataforma Pluzapp é compatível com os principais gateways de comunicação em massa. Para conectividade de <strong>WhatsApp</strong>, nossa arquitetura oferece suporte nativo à <strong>Evolution API</strong> ou bibliotecas <strong>Baileys (WebSockets)</strong>. Em canais sociais como Instagram e Facebook, a autenticação utiliza os fluxos oficiais da Graph API da Meta de forma segura e auditada.
          </p>
        </div>
      </div>
    </div>
  );
}
