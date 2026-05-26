import React, { useState } from "react";
import { Shield, Key, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";

interface LoginProps {
  onLoginSuccess: (token: string, user: any, company: any) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState("admin@admin.com");
  const [password, setPassword] = useState("admin");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Dynamic schema validation simulation
    if (!email.includes("@")) {
      setError("Por favor indique um endereço de e-mail estruturalmente estruturado.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Falha ao realizar login.");
      }

      onLoginSuccess(data.token, data.user, data.company);
    } catch (err: any) {
      setError(err.message || "Erro de conexão com o servidor OmniFlow AI.");
    } finally {
      setLoading(false);
    }
  };

  const setCredentialPreset = (newEmail: string) => {
    setEmail(newEmail);
    setPassword("admin");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative overflow-hidden font-sans">
      {/* Decorative ambient backgrounds */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#6366f1]/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#25D366]/5 rounded-full blur-3xl" />

      <div className="w-full max-w-md p-8 bg-[#111827] rounded-3xl border border-[#1e293b] shadow-2xl relative z-10 mx-4">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#6366f1] flex items-center justify-center text-white mb-4.5 shadow-xl shadow-[#6366f1]/20">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white font-sans">OmniFlow AI</h1>
          <p className="text-xs text-slate-400 mt-1">Plataforma Omnichannel Premium com Gemini AI</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-start gap-2">
            <span className="font-bold">Aviso:</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          <div>
            <label className="block text-[10px] uppercase font-extrabold tracking-wider text-slate-400 mb-2">
              E-mail de Acesso
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">@</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-3 bg-[#1e293b] text-white border border-[#334155] focus:border-[#6366f1] focus:bg-[#1a2238] rounded-xl text-xs transition-all outline-none"
                placeholder="nome@empresa.com"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-[10px] uppercase font-extrabold tracking-wider text-slate-400">
                Senha de Acesso
              </label>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                <Key className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-10 py-3 bg-[#1e293b] text-white border border-[#334155] focus:border-[#6366f1] focus:bg-[#1a2238] rounded-xl text-xs transition-all outline-none"
                placeholder="******"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#6366f1] hover:bg-[#5053df] text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-md shadow-[#6366f1]/25 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 group cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Entrar no Painel 
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Quick Credentials Seeder Panel */}
        <div className="mt-8 pt-6 border-t border-[#1e293b]">
          <p className="text-[10px] font-extrabold text-[#cbd5e1] uppercase tracking-wider mb-3 text-center">
            Mudar Acesso de Empresa SaaS:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setCredentialPreset("admin@admin.com")}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                email === "admin@admin.com"
                  ? "border-[#6366f1] bg-[#1e293b] text-white font-bold"
                  : "border-[#1e293b] hover:bg-[#1e293b]/50 text-slate-400"
              }`}
            >
              <div className="text-[10px] font-extrabold">OmniFlow (SaaS)</div>
              <div className="text-[9px] text-slate-500">admin@admin.com</div>
            </button>

            <button
              onClick={() => setCredentialPreset("julia@clinicabemestar.com")}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                email === "julia@clinicabemestar.com"
                  ? "border-[#6366f1] bg-[#1e293b] text-white font-bold"
                  : "border-[#1e293b] hover:bg-[#1e293b]/50 text-slate-400"
              }`}
            >
              <div className="text-[10px] font-extrabold">Clínica Bem Estar</div>
              <div className="text-[9px] text-slate-500">julia@clinicabemestar.com</div>
            </button>
          </div>
          <div className="mt-3 text-center text-[10px] text-slate-500">
            Senha única padrão de demonstração: <span className="font-mono bg-[#1e293b] text-slate-350 px-1.5 py-0.5 rounded">admin</span>
          </div>
        </div>
      </div>
    </div>
  );
}
