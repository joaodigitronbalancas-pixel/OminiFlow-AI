import React, { useState, useEffect } from "react";
import { 
  Users, ShieldAlert, Plus, ShieldCheck, Loader2, Key, Mail, UserPlus, CheckSquare, Square
} from "lucide-react";
import { User, UserRole } from "../types";

interface OperatorsProps {
  token: string;
  currentUserRole: UserRole;
}

export default function Operators({ token, currentUserRole }: OperatorsProps) {
  const [operators, setOperators] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Registration Inputs
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("OPERATOR");
  const [errorHeader, setErrorHeader] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchOperators = async () => {
    try {
      const res = await fetch("/api/operators", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOperators(data);
      }
    } catch (err) {
      console.error("Erro ao puxar operarios:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperators();
  }, [token]);

  const handleCreateOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    setSaving(true);
    setErrorHeader(null);

    try {
      const res = await fetch("/api/operators", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, email, password, role })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Flaha ao salvar operador.");
      }

      setName("");
      setEmail("");
      setPassword("");
      setRole("OPERATOR");
      setShowAddForm(false);
      fetchOperators();
    } catch (err: any) {
      setErrorHeader(err.message || "Impossível processar gravação.");
    } finally {
      setSaving(false);
    }
  };

  // RBAC permission matrix mock showcase for the UI list
  const getRolePermissions = (roleType: UserRole) => {
    switch (roleType) {
      case "SUPER_ADMIN":
        return ["Acesso Multi-tenant completo", "Gestão de faturamento", "Alterar IA e Prompts", "Ver relatórios amplos", "Excluir integrações"];
      case "ADMIN":
        return ["Editar dados da empresa", "Adicionar atendentes", "Adicionar conexões de canais", "Ver relatórios de equipe", "Preencher respostas rápidas"];
      case "SUPERVISOR":
        return ["Ver todas as conversas", "Transferir chats de operadores", "Interferir em contendas do robô", "Ver relatórios"];
      default:
        return ["Ver conversas atribuídas ou na fila", "Interagir com clientes", "Atualizar etiquetas e tags"];
    }
  };

  const isRoleUnauthorizedToCreate = currentUserRole !== "SUPER_ADMIN" && currentUserRole !== "ADMIN";

  return (
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-[calc(100vh-61px)] overflow-y-auto font-sans text-left">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight font-sans">Controle de Membros (RBAC)</h1>
          <p className="text-xs text-slate-500 mt-1">Defina perfis, atribua regras de atuação e gerencie múltiplos operadores.</p>
        </div>
        
        {!isRoleUnauthorizedToCreate && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow shadow-indigo-600/15"
          >
            <UserPlus className="w-4 h-4" />
            Adicionar Membro
          </button>
        )}
      </div>

      {isRoleUnauthorizedToCreate && (
        <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded text-xs text-amber-700">
          ⚠️ <strong>Perfil Restrito:</strong> Seu login atual possui perfil de <strong>{currentUserRole}</strong>. A criação, exclusão ou edição de usuários é restrita a administradores autorizados do sistema SaaS.
        </div>
      )}

      {/* Operator display table/grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {operators.map(op => (
            <div key={op.id} className="bg-white rounded-2xl border border-slate-150 p-6 flex flex-col md:flex-row justify-between gap-6 shadow-xs">
              
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-3">
                  <img
                    src={op.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                    alt={op.name}
                    className="w-11 h-11 rounded-full object-cover border border-slate-100"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">{op.name}</h3>
                    <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {op.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                    op.role === "SUPER_ADMIN" ? "bg-red-50 text-red-700 border-red-100" :
                    op.role === "ADMIN" ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                    op.role === "SUPERVISOR" ? "bg-amber-50 text-amber-700 border-amber-100" :
                    "bg-slate-100 text-slate-600 border-slate-200"
                  }`}>
                    {op.role}
                  </span>
                </div>
              </div>

              {/* Display visual RBAC policy list specifically for testing safety */}
              <div className="w-full md:w-56 bg-slate-50 p-4 rounded-xl border border-slate-150/50 flex flex-col justify-start">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-2">Escopo de Autoridade</span>
                <div className="space-y-1.5">
                  {getRolePermissions(op.role).map((p, idx) => (
                    <div key={idx} className="flex gap-1.5 items-start text-[10px] text-slate-500 leading-tight">
                      <span className="text-indigo-600 font-bold shrink-0">✓</span>
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Modal: Adicionar Membro */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[999] p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-slate-150 text-left">
            <h3 className="text-sm font-bold text-slate-800 mb-4 font-sans">Cadastrar Membro Omnichannel</h3>

            {errorHeader && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] text-red-700">
                {errorHeader}
              </div>
            )}

            <form onSubmit={handleCreateOperator} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1.5">Nome Completo</label>
                <input
                  type="text"
                  placeholder="Ex: Júlio César"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1.5">Email de Autenticação</label>
                <input
                  type="email"
                  placeholder="Ex: juliocesardev@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1.5">Senha Provisória</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                  placeholder="******"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1.5">Cargo Relacionado (Nível de Acesso)</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 bg-white"
                >
                  <option value="OPERATOR">OPERATOR (Atendimento Padrão)</option>
                  <option value="SUPERVISOR">SUPERVISOR (Controle de Fila Geral)</option>
                  <option value="ADMIN">ADMIN (Edição de Tenant e Configuração Geral)</option>
                </select>
              </div>

              <div className="flex gap-2.5 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow shadow-indigo-600/10 flex items-center justify-center"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Criar Membro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
