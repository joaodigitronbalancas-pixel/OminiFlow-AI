import React, { useState, useEffect } from "react";
import { 
  BarChart, Calendar, Clock, BarChart2, MessageSquare, Bot, AlertCircle, 
  HelpCircle, UserCheck, TrendingUp, Download, CheckCircle, Smartphone
} from "lucide-react";
import { ReportStats } from "../types";

interface DashboardProps {
  token: string;
}

export default function Dashboard({ token }: DashboardProps) {
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/reports", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Erro ao carregar estatísticas do dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token]);

  // Export Data simulated CSV download
  const handleExportData = () => {
    if (!stats) return;
    setExporting(true);
    setSuccessMsg(null);

    setTimeout(() => {
      try {
        // Construct clean mock CSV tables for SLA metrics
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "=== OmniFlow AI - Relatório de Desempenho ===\n\n";
        csvContent += "Métrica,Valor\n";
        csvContent += `Volume Total de Atendimentos,${stats.ticketsCount}\n`;
        csvContent += `Atendimentos em Aberto,${stats.openCount}\n`;
        csvContent += `Atendimentos Pendentes,${stats.pendingCount}\n`;
        csvContent += `Atendimentos Finalizados,${stats.closedCount}\n`;
        csvContent += `Tempo Médio de Resposta (SLA),${stats.averageResponseTimeMinutes} minutos\n`;
        csvContent += `Volume Atendido por Robo (IA),${stats.aiResponseCount}\n`;
        csvContent += `Handoffs para Atendentes,${stats.aiHandoffCount}\n\n`;

        csvContent += "=== Distribuição de Volume por Canal ===\n";
        csvContent += "Canal,Tickets\n";
        Object.entries(stats.byChannel).forEach(([chan, val]) => {
          csvContent += `${chan.toUpperCase()},${val}\n`;
        });
        csvContent += "\n";

        csvContent += "=== Desempenho por Operador ===\n";
        csvContent += "Atendente,Tickets Atribuídos,Tickets Resolvidos\n";
        Object.entries(stats.byAgent).forEach(([_, agent]: any) => {
          csvContent += `"${agent.name}",${agent.count},${agent.closed}\n`;
        });

        // Trigger safe file download
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `OmniFlow_Relatorio_${new Date().toISOString().substring(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setSuccessMsg("Relatório exportado com sucesso! Arquivo CSV baixado.");
      } catch (err) {
        console.error(err);
      } finally {
        setExporting(false);
      }
    }, 1200);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center h-[calc(100vh-61px)] bg-[#0f172a]">
        <span className="w-8 h-8 rounded-full border-4 border-[#6366f1] border-t-transparent animate-spin mb-4" />
        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Compilando Métricas Omnichannel...</span>
      </div>
    );
  }

  if (!stats) return null;

  // Visual channel calculations for progress bars
  const totalChannels = (Object.values(stats.byChannel) as number[]).reduce((a, b) => a + b, 0) || 1;
  const channelPercent = (val: number) => Math.round((val / totalChannels) * 100);

  // Channels palette configuration
  const channelLabels: Record<string, { label: string; color: string; hover: string }> = {
    whatsapp: { label: "WhatsApp Marketing", color: "bg-[#25D366]", hover: "text-[#25D366]" },
    instagram: { label: "Instagram Direct", color: "bg-[#f15bb5]", hover: "text-[#f15bb5]" },
    facebook: { label: "Facebook Messenger", color: "bg-[#00bbf9]", hover: "text-[#00bbf9]" },
    webchat: { label: "Chat do Site (WebChat)", color: "bg-[#6366f1]", hover: "text-[#6366f1]" }
  };

  return (
    <div className="p-8 space-y-8 bg-[#0f172a] min-h-[calc(100vh-61px)] overflow-y-auto font-sans text-left text-[#cbd5e1]">
      
      {/* Visual alerts or feedback banner */}
      {successMsg && (
        <div className="p-4 bg-emerald-950/50 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-xs text-emerald-300">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Relatórios de Desempenho</h1>
          <p className="text-xs text-slate-400 mt-1">Análise detalhada de SLA, volume por canais, e desempenho de atendentes da empresa.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#111827] border border-[#1e293b] rounded-xl text-xs text-slate-300 font-semibold shadow-sm">
            <Calendar className="w-4 h-4 text-[#6366f1]" />
            Hoje: {new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}
          </div>
          
          <button
            onClick={handleExportData}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-[#6366f1] hover:bg-[#5053df] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#6366f1]/20 cursor-pointer disabled:opacity-50"
          >
            {exporting ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Exportar Dados (CSV)
          </button>
        </div>
      </div>

      {/* Top 4 Metrics Summary Cards with Contrast Fixing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1 */}
        <div className="bg-[#111827] p-6 rounded-2xl border border-[#1e293b]/80 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[#cbd5e1] font-bold">Total Atendimentos</span>
            <h3 className="text-3xl font-black text-white mt-1.5">{stats.ticketsCount}</h3>
            <span className="text-[9px] text-[#25D366] font-bold mt-1.5 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-[#25D366]" />
              Fluxo unificado
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-950/50 border border-[#6366f1]/20 text-[#6366f1] flex items-center justify-center">
            <MessageSquare className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-[#111827] p-6 rounded-2xl border border-[#1e293b]/80 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[#cbd5e1] font-bold">Tempo Resposta (SLA)</span>
            <h3 className="text-3xl font-black text-white mt-1.5">{stats.averageResponseTimeMinutes}m</h3>
            <span className="text-[9px] text-indigo-400 font-bold mt-1.5 flex items-center gap-1">
              • Monitoramento Ativo
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-[#25D366] flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-[#111827] p-6 rounded-2xl border border-[#1e293b]/80 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[#cbd5e1] font-bold">Atendidos por Robô IA</span>
            <h3 className="text-3xl font-black text-white mt-1.5">{stats.aiResponseCount}</h3>
            <span className="text-[9px] text-indigo-300 font-bold mt-1.5 block">
              Autoatendimento com Gemini
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-violet-950/30 border border-purple-500/20 text-purple-450 flex items-center justify-center">
            <Bot className="w-6 h-6 text-purple-400" />
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-[#111827] p-6 rounded-2xl border border-[#1e293b]/80 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[#cbd5e1] font-bold">Handoffs (Humano)</span>
            <h3 className="text-3xl font-black text-white mt-1.5">{stats.aiHandoffCount}</h3>
            <span className="text-[9px] text-amber-500 font-bold mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-amber-500 animate-pulse" />
              Transferências de fila
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-950/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Charts Grid: Atendimentos por Dia + Volume por Canal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Atendimentos por Dia Chart Block */}
        <div className="bg-[#111827] p-6 rounded-2xl border border-[#1e293b]/80 shadow-xl lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="text-xs font-extrabold uppercase text-[#ffffff] tracking-wider">Histórico de Atendimentos por Dia</h4>
              <p className="text-[#cbd5e1] text-[10px] mt-0.5">Frequência geral de tíquetes escalados por data</p>
            </div>
            <span className="p-1 px-3 rounded bg-indigo-950/50 border border-indigo-900/40 text-indigo-400 text-[10px] font-bold">Faturamento Semanal</span>
          </div>

          <div className="h-56 flex items-end justify-between px-4 pb-2 border-b border-[#1e293b] relative">
            {stats.byDay.map(day => {
              const maxVal = Math.max(...stats.byDay.map(d => d.count), 1);
              const heightPct = Math.round((day.count / maxVal) * 150) + 15;
              
              return (
                <div key={day.date} className="flex flex-col items-center flex-1 group">
                  <div className="text-[10px] font-bold text-[#6366f1] mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {day.count}
                  </div>
                  <div 
                    style={{ height: `${heightPct}px` }}
                    className="w-10 bg-[#6366f1]/80 hover:bg-[#6366f1] rounded-t-lg transition-all duration-300 relative shadow-sm"
                  >
                    <div className="absolute inset-0 bg-white/5 rounded-t-lg" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-450 mt-2 font-mono">
                    {day.date}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Volume por Canal Chart Block */}
        <div className="bg-[#111827] p-6 rounded-2xl border border-[#1e293b]/80 shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-extrabold uppercase text-white tracking-wider mb-1">Volume por Canal Coletador</h4>
            <p className="text-[10px] text-slate-400">Distribuição percentual por canais</p>
          </div>

          <div className="space-y-4 my-6">
            {Object.entries(stats.byChannel).map(([key, val]) => {
              const info = channelLabels[key] || { label: key, color: "bg-slate-550", hover: "text-slate-500" };
              const valNum = val as number;
              const percent = channelPercent(valNum);
              return (
                <div key={key} className="space-y-1.5 text-left">
                  <div className="flex justify-between text-[11px] font-bold text-slate-350">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${info.color}`} />
                      {info.label}
                    </span>
                    <span className="font-mono text-[#ffffff]">{valNum} tickets ({percent}%)</span>
                  </div>
                  <div className="w-full h-2 bg-[#1e293b] rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${percent}%` }}
                      className={`h-full ${info.color} transition-all duration-500`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-[#0f172a] p-3.5 rounded-xl border border-[#1e293b]/60 text-[10px] text-slate-400 flex items-start gap-2 leading-relaxed">
            <HelpCircle className="w-4 h-4 text-[#6366f1] shrink-0" />
            <span>Sincronização em tempo real de mensagens recebidas.</span>
          </div>
        </div>

      </div>

      {/* Operator stats leader board */}
      <div className="bg-[#111827] p-6 rounded-2xl border border-[#1e293b]/80 shadow-xl text-left">
        <div>
          <h4 className="text-xs font-extrabold uppercase text-white tracking-wider">Desempenho de Atendentes</h4>
          <p className="text-[10px] text-slate-400 mt-0.5 font-sans">Mão-de-obra e índice de encerramento por operador do OmniFlow AI</p>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-xs text-[#cbd5e1]">
            <thead>
              <tr className="border-b border-[#1e293b] text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                <th className="pb-3 text-left">Operador</th>
                <th className="pb-3 text-center">Atendimentos Atribuídos</th>
                <th className="pb-3 text-center">Tickets Finalizados</th>
                <th className="pb-3 text-left pl-6">Nível de Resolução</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]/40">
              {Object.entries(stats.byAgent).map(([id, agent]) => {
                const agentTyped = agent as { name: string; count: number; closed: number };
                const pct = agentTyped.count > 0 ? Math.round((agentTyped.closed / agentTyped.count) * 100) : 0;
                return (
                  <tr key={id} className="hover:bg-[#1e293b]/10 transition-colors">
                    <td className="py-4 font-bold text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-950/60 text-indigo-400 border border-[#6366f1]/20 font-bold flex items-center justify-center">
                        {agentTyped.name.charAt(0)}
                      </div>
                      {agentTyped.name}
                    </td>
                    <td className="py-4 text-center font-mono font-bold text-white">{agentTyped.count}</td>
                    <td className="py-4 text-center font-mono font-bold text-[#25D366]">{agentTyped.closed}</td>
                    <td className="py-4 pl-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-24 h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${pct}%` }} 
                            className="h-full bg-[#25D366] rounded-full"
                          />
                        </div>
                        <span className="font-mono text-[10px] font-bold text-slate-400">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
