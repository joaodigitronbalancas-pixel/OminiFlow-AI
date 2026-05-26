import React, { useState, useEffect } from "react";
import { 
  Bot, Settings, Sparkles, Check, AlertTriangle, HelpCircle, Loader2, Save, BadgeHelp 
} from "lucide-react";
import { AIConfig } from "../types";

interface AICenterProps {
  token: string;
}

export default function AICenter({ token }: AICenterProps) {
  const [enabled, setEnabled] = useState(false);
  const [model, setModel] = useState("gemini-3.5-flash");
  const [systemInstruction, setSystemInstruction] = useState("");
  const [minConfidence, setMinConfidence] = useState(0.7);
  const [rules, setRules] = useState("");
  const [handoffKeywordsString, setHandoffKeywordsString] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Load AI Config
  useEffect(() => {
    const fetchAIConfig = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/ai-config", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data: AIConfig = await res.json();
          setEnabled(data.enabled);
          setModel(data.model);
          setSystemInstruction(data.systemInstruction);
          setMinConfidence(data.minConfidence);
          setRules(data.rules || "");
          setHandoffKeywordsString(data.handoffKeywords.join(", "));
        }
      } catch (err) {
        console.error("Erro ao ler configuração da IA:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAIConfig();
  }, [token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    const keywords = handoffKeywordsString
      .split(",")
      .map(k => k.trim())
      .filter(k => k.length > 0);

    try {
      const res = await fetch("/api/ai-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          enabled,
          model,
          systemInstruction,
          minConfidence,
          rules,
          handoffKeywords: keywords
        })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Erro ao atualizar parametrizações da IA:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center h-[calc(100vh-61px)] bg-[#0f172a]">
        <span className="w-8 h-8 rounded-full border-4 border-[#6366f1] border-t-transparent animate-spin mb-4" />
        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Lendo Parâmetros OmniFlow AI...</span>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-[#0f172a] min-h-[calc(100vh-61px)] overflow-y-auto font-sans text-left text-[#cbd5e1]">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Agente IA Gemini</h1>
        <p className="text-xs text-slate-400 mt-1 font-sans">Configure o comportamento do robô autoatendente da OmniFlow AI, instruções semânticas, regras de FAQ de canais e transferências de filas humanas.</p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMN 1 & 2: Forms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section: Status Toggle */}
          <div className="p-6 bg-[#111827] border border-[#1e293b] rounded-2xl flex items-center justify-between shadow-lg">
            <div className="flex gap-4 items-center">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold ${
                enabled ? "bg-violet-950/40 text-purple-400 border border-purple-900/40" : "bg-slate-900 text-slate-500"
              }`}>
                <Bot className="w-5.5 h-5.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Habilitar IA Globalmente</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Controla o autoatendimento ativo em todos os novos chats de canais integrados</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 relative cursor-pointer ${
                enabled ? "bg-[#6366f1]" : "bg-[#334155]"
              }`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow transition-transform ${
                enabled ? "translate-x-6" : "translate-x-0"
              }`} />
            </button>
          </div>

          {/* Section: Core System Prompt Editing block */}
          <div className="p-6 bg-[#111827] border border-[#1e293b] rounded-2xl space-y-4 shadow-lg">
            <div className="flex items-center gap-2 border-b border-[#1e293b] pb-3">
              <Sparkles className="w-4 h-4 text-[#6366f1]" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Personalidade & Comportamento do Agente</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">Instruções de Personalidade (Prompt de Sistema)</label>
                <textarea
                  rows={4}
                  value={systemInstruction}
                  onChange={(e) => setSystemInstruction(e.target.value)}
                  className="w-full p-3.5 bg-[#1a2238] border border-[#334155] focus:border-[#6366f1] text-white rounded-xl text-xs leading-relaxed outline-none transition-all font-sans"
                  placeholder="Você é o assistente virtual oficial da empresa..."
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">Treinamento específico, FAQ de Preços, Produtos e FAQ geral</label>
                <textarea
                  rows={4}
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                  className="w-full p-3.5 bg-[#1a2238] border border-[#334155] focus:border-[#6366f1] text-indigo-200 rounded-xl text-xs leading-relaxed outline-none transition-all font-mono"
                  placeholder="Preços: Starter R$ 99/mês, Pro R$ 249/mês..."
                />
              </div>
            </div>
          </div>

          {/* Section: Confidences and Keyword handoffs */}
          <div className="p-6 bg-[#111827] border border-[#1e293b] rounded-2xl space-y-4 shadow-lg">
            <div className="flex items-center gap-2 border-b border-[#1e293b] pb-3">
              <Settings className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Parametrização do Motor LLM</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-[#cbd5e1]">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-450 font-bold mb-2">Modelo de Inteligência Artificial</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a2238] border border-[#334155] focus:border-[#6366f1] text-white rounded-xl outline-none cursor-pointer"
                >
                  <option value="gemini-3.5-flash">Gemini 3.5 Flash (Super Rápido e Otimizado)</option>
                  <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview (Raciocínio Avançado)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-450 font-bold mb-2">Temperatura (Criatividade: {minConfidence})</label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(Number(e.target.value))}
                  className="w-full accent-[#6366f1] cursor-pointer cursor-grab"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] uppercase tracking-wider text-slate-450 font-bold mb-1.5">Palavras-chave de Handover para Humanos (separados por vírgula)</label>
                <input
                  type="text"
                  value={handoffKeywordsString}
                  onChange={(e) => setHandoffKeywordsString(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a2238] border border-[#334155] focus:border-[#6366f1] text-white rounded-xl outline-none text-xs font-mono"
                  placeholder="humano, atendente, supervisor, falar com atendente"
                />
                <span className="text-[9.5px] text-slate-450 mt-1 block">O chatbot escutará estas palavras e, ao detectá-las na pergunta, desliga a automação e migra para fila humana.</span>
              </div>
            </div>
          </div>

        </div>

        {/* COLUMN 3: Info Help side guidance */}
        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-br from-indigo-950 to-slate-900 text-white rounded-2xl space-y-4 border border-[#1e293b] shadow-xl text-left">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#cbd5e1] flex items-center gap-1">
              <HelpCircle className="w-4 h-4 text-[#6366f1]" />
              Dicas de Prompt
            </h3>
            <p className="text-[11px] leading-relaxed text-slate-300">
              Personalize o atendente com regras rígidas de comportamento:
            </p>
            <ul className="text-[10px] space-y-2 list-disc list-inside text-slate-400 font-medium">
              <li>Declare que ele deve responder apenas em português brasileiro.</li>
              <li>Impeça que ele invente preços ou dados corporativos não listados.</li>
              <li>Instrua a ser amigável e usar emojis moderados de boas-vindas.</li>
            </ul>
          </div>

          {/* Save panel Button */}
          <div className="p-6 bg-[#111827] border border-[#1e293b] rounded-2xl flex flex-col items-stretch space-y-3 shadow-lg">
            {success && (
              <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl font-bold flex items-center justify-center gap-1.5 animate-pulse">
                <Check className="w-4 h-4 text-emerald-400" />
                Gravado com segurança!
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-[#6366f1] hover:bg-[#5053df] disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#6366f1]/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 shrink-0" />
                  Salvar Configuração IA
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
