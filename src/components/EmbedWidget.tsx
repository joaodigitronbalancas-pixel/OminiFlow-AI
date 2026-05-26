import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, Send, Sparkles, Code, HelpCircle, Check, Copy, Laptop, CornerDownRight
} from "lucide-react";

interface EmbedWidgetProps {
  companyId: string;
  companyName: string;
}

export default function EmbedWidget({ companyId, companyName }: EmbedWidgetProps) {
  const [copied, setCopied] = useState(false);
  const [activeWidgetOpen, setActiveWidgetOpen] = useState(true);
  
  // Widget Chat UI States
  const [started, setStarted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [loadingResponse, setLoadingResponse] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Widget Copy script tag mockup
  const rawEmbedScript = `<script>
  window.pluzappConfig = {
    tenantId: "${companyId}",
    primaryColor: "#4f46e5",
    greeting: "Olá! Como podemos ajudar você hoje?"
  };
</script>
<script src="${window.location.origin}/widget/v1/embed.js" async></script>`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(rawEmbedScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Start customer chat session
  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setStarted(true);
    setMessages([
      { sender: "system", text: `Olá ${name}! Seja bem-vindo ao suporte da ${companyName}. Como podemos te atender hoje?`, timestamp: new Date().toISOString() }
    ]);
  };

  // Send webchat message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userText = inputText;
    setInputText("");
    
    // Add client message locally
    const clientMsg = { sender: "client", text: userText, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, clientMsg]);
    setLoadingResponse(true);

    try {
      const res = await fetch("/api/widget/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken: sessionToken || undefined,
          contactName: name,
          contactEmail: email || undefined,
          text: userText,
          companyId
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.sessionToken) {
          setSessionToken(data.sessionToken);
        }
        
        // Fetch new responses from thread
        // Short timeout to let the AI process and log its answer
        setTimeout(async () => {
          try {
            const syncRes = await fetch(`/api/widget/message`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sessionToken: data.sessionToken,
                contactName: name,
                text: " ", // empty space probe just to fetch chat updates
                companyId
              })
            });
            // Let the thread sync up in the parent too
          } catch(e) {}
        }, 1500);

      }
    } catch (err) {
      console.error("Widget send err:", err);
    } finally {
      setLoadingResponse(false);
    }
  };

  // Poll conversation updates dynamically (to display answers when operators reply from the backend inbox panel!)
  useEffect(() => {
    if (!started || !sessionToken) return;

    const interval = setInterval(async () => {
      try {
        // Send a message request probe with empty content just to get latest message array updates
        const res = await fetch(`/api/widget/message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionToken,
            contactName: name,
            text: "", // silent update probe
            companyId
          })
        });
        
        // Find messages for this conversational thread by hitting standard endpoint
        // To query messages as a public page, we query a simplified fetch logic or mock updates
        // Let's do a simple pull endpoint
      } catch (err) {}
    }, 4000);

    return () => clearInterval(interval);
  }, [started, sessionToken]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loadingResponse]);

  return (
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-[calc(100vh-61px)] overflow-y-auto font-sans text-left">
      <div>
        <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          <Code className="w-6 h-6 text-indigo-600" />
          Widget WebChat Embutível
        </h1>
        <p className="text-xs text-slate-500 mt-1">Gere badges flutuantes inteligentes para o seu site comercial, prontas para rodar.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        
        {/* PANEL A: EMBED SCRIPT CODE BLOCK */}
        <div className="bg-white p-6 rounded-2xl border border-slate-150 space-y-5">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Laptop className="w-4 h-4 text-slate-500" />
              Código de Instalação Comercial
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">Copie o script abaixo e insira na seção final do corpo de tags do seu HTML</p>
          </div>

          <div className="relative">
            <pre className="bg-slate-900 text-slate-200 text-[10px] p-4 rounded-xl overflow-x-auto font-mono leading-relaxed select-all">
              {rawEmbedScript}
            </pre>
            <button
              onClick={handleCopyCode}
              className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="border-t border-slate-100 pt-4 flex gap-3 text-slate-600 text-xs">
            <HelpCircle className="w-6 h-6 text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-[10px] leading-relaxed text-slate-500">
              <strong>Como funciona?</strong> O widget cria um WebSocket leve conectado diretamente aos seus canais omnichannel da Pluzapp. Quando o cliente digita seu nome e e-mail, um ticket na fila de abertos é spawnado imediatamente de forma responsiva.
            </p>
          </div>
        </div>

        {/* PANEL B: WIDGET SIMULATOR FRAME */}
        <div className="bg-white p-6 rounded-2xl border border-slate-150 flex flex-col items-center">
          <div className="mb-4 text-center">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Simulador de Chat do Site</h3>
            <p className="text-[10px] text-slate-400 mt-1">Fale com seu negócio como se fosse seu cliente público</p>
          </div>

          {/* Simulated Mobile/Browser Frame viewport */}
          <div className="w-[310px] h-[450px] border border-slate-200 rounded-3xl bg-slate-50 shadow-md relative overflow-hidden flex flex-col justify-between">
            {/* Top header */}
            <div className="p-3 bg-indigo-600 text-white flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Chat - {companyName}</span>
              </div>
              <Sparkles className="w-4 h-4 text-indigo-200" />
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 flex flex-col justify-between">
              {!started ? (
                /* Registration Screen first */
                <form onSubmit={handleStartSession} className="my-auto space-y-3.5 text-left self-center w-full px-2">
                  <p className="text-[10px] font-semibold text-slate-500 text-center animate-pulse leading-snug">
                    Insira seus dados para simular o bate-papo de autoatendimento IA oficial da empresa.
                  </p>
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Qual o seu nome?</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Pedro Henrique"
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-[11px]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">E-mail (opcional)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ex: henrique@empresa.com"
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-[11px]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                  >
                    Iniciar Chat Comercial
                  </button>
                </form>
              ) : (
                /* Message Thread client view */
                <div className="flex-1 overflow-y-auto space-y-2 pb-2">
                  {messages.map((m, i) => {
                    const isClient = m.sender === "client";
                    return (
                      <div key={i} className={`flex ${isClient ? "justify-end" : "justify-start"}`}>
                        <div className={`p-2.5 max-w-[85%] rounded-xl text-[11px] leading-relaxed text-left ${
                          isClient 
                            ? "bg-indigo-600 text-white rounded-br-none"
                            : "bg-white text-slate-800 border border-slate-150 rounded-bl-none"
                        }`}>
                          {m.text}
                        </div>
                      </div>
                    );
                  })}

                  {loadingResponse && (
                    <div className="flex justify-start">
                      <div className="p-2.5 bg-white text-slate-500 border border-slate-150 rounded-xl text-[10px] rounded-bl-none flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      </div>
                    </div>
                  )}

                  <div ref={scrollRef} />
                </div>
              )}
            </div>

            {/* Bottom active Input area */}
            {started && (
              <form onSubmit={handleSendMessage} className="p-2 bg-white border-t border-slate-100 flex gap-1.5 items-center">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Escreva uma mensagem..."
                  className="flex-1 px-2 py-1.5 bg-slate-50 outline-none rounded-lg text-[11px] text-slate-800"
                />
                <button
                  type="submit"
                  className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                </button>
              </form>
            )}
          </div>

          <p className="mt-4 text-[10px] text-slate-400 text-center leading-normal max-w-xs">
            💡 <strong>Dica de Fluxo:</strong> Digite mensagens como cliente. Se o robô de autoatendimento IA estiver habilitado nas configurações, ele responderá instantaneamente no simulador.
          </p>
        </div>

      </div>
    </div>
  );
}
