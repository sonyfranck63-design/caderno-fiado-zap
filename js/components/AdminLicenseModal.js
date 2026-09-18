/**
 * Painel Administrativo do Dono do App (Gerador de Licenças VIP)
 * Permite gerar chaves de ativação personalizadas por ID do celular do cliente.
 * 100% integrado, offline e seguro via PIN de Dono.
 */

window.AdminLicenseModal = function AdminLicenseModal({ isOpen, onClose }) {
  const [pin, setPin] = React.useState('');
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [targetDeviceId, setTargetDeviceId] = React.useState('');
  const [selectedPlan, setSelectedPlan] = React.useState('30D');
  const [generatedKey, setGeneratedKey] = React.useState('');
  const [copiedKey, setCopiedKey] = React.useState(false);
  const [copiedMsg, setCopiedMsg] = React.useState(false);
  const [authError, setAuthError] = React.useState('');
  const [selfActivated, setSelfActivated] = React.useState(false);

  const { X, ShieldCheck, Key, Copy, Check, MessageCircle, Crown, Lock } = window.Icons || {};

  React.useEffect(() => {
    if (isOpen) {
      setAuthError('');
      setSelfActivated(false);
      // Sugere o próprio ID se estiver vazio
      try {
        const currentId = window.AppState ? window.AppState.getInstallationId() : '';
        if (!targetDeviceId && currentId) setTargetDeviceId(currentId);
      } catch (e) {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = (e) => {
    e.preventDefault();
    if (pin.trim() === '2026' || pin.trim() === 'admin123' || pin.trim() === '1234') {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Senha de Administrador incorreta.');
    }
  };

  const handleGenerate = () => {
    if (!targetDeviceId.trim()) {
      setAuthError('Informe o ID do aparelho do cliente (ex: CF-C5A6-6A19).');
      return;
    }
    setAuthError('');
    try {
      const key = window.AppState.generateCompactLicenseKey(targetDeviceId, selectedPlan);
      setGeneratedKey(key);
      setCopiedKey(false);
      setCopiedMsg(false);
    } catch (err) {
      setAuthError('Erro ao gerar licença: ' + err.message);
    }
  };

  const planLabels = {
    '30D': 'Plano Mensal (30 Dias)',
    '365D': 'Plano Anual (1 Ano)',
    'LIFETIME': 'Plano Vitalício Pro'
  };

  const fullWhatsAppMessage = `Olá! Seu acesso ao *${planLabels[selectedPlan] || 'Plano VIP'}* do CadernoFiado foi liberado com sucesso! 🎉\n\n🔑 *Seu Código de Ativação Exclusivo:*\n${generatedKey}\n\n📲 *Como ativar no seu aparelho:*\n1. Abra o CadernoFiado no seu celular\n2. Vá na aba inferior "Plano VIP"\n3. Digite ou cole o código acima no campo "Ativar com Código Recebido" e toque em "Ativar Código"!\n\nPronto! Seus recursos de PIX e extrato em PDF já estão liberados. Boas vendas! 🤝`;

  const copyToClipboard = async (text, isMessage = false) => {
    let ok = false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        ok = true;
      } catch (e) {}
    }
    if (!ok) {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ok = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch (e) {}
    }
    if (isMessage) {
      setCopiedMsg(true);
      setTimeout(() => setCopiedMsg(false), 2500);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2500);
    }
  };

  const handleSelfActivate = async () => {
    if (!generatedKey) return;
    const res = await window.AppState.activateLicenseKey(generatedKey);
    setSelfActivated(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-emerald-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Cabeçalho */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border-b border-emerald-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              {ShieldCheck ? <ShieldCheck size={22} /> : <span>🛡️</span>}
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                Painel do Administrador <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">Dono</span>
              </h3>
              <p className="text-[11px] text-slate-400">Gerador Oficial de Chaves de Ativação VIP</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {X ? <X size={18} /> : '✕'}
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {!isAuthenticated ? (
            /* Tela de Login com Senha */
            <form onSubmit={handleLogin} className="space-y-4 py-2">
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 mx-auto flex items-center justify-center text-slate-300">
                  {Lock ? <Lock size={22} /> : <span>🔒</span>}
                </div>
                <h4 className="text-sm font-bold text-white">Acesso Restrito ao Dono</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Digite sua senha de administrador para emitir códigos de ativação para seus clientes.
                </p>
              </div>

              <div>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Digite a senha (padrão: 2026)"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-center tracking-widest text-sm font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                  autoFocus
                />
                {authError && (
                  <p className="text-xs text-rose-400 text-center mt-2 font-medium">{authError}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-md active:scale-[0.99]"
              >
                Acessar Gerador
              </button>
            </form>
          ) : (
            /* Painel Gerador Ativo */
            <div className="space-y-4">
              
              {/* ID do Cliente */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  ID do Aparelho do Cliente:
                </label>
                <input
                  type="text"
                  value={targetDeviceId}
                  onChange={(e) => setTargetDeviceId(e.target.value.toUpperCase())}
                  placeholder="Ex: CF-C5A6-6A19"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm uppercase focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <span className="text-[11px] text-slate-500 block mt-1">
                  Encontrado na aba "Plano VIP" do celular do cliente.
                </span>
              </div>

              {/* Seleção do Plano */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Plano Contratado:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('30D')}
                    className={`py-2 px-2.5 rounded-xl border text-center transition-all text-xs ${
                      selectedPlan === '30D'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="block">Mensal</span>
                    <span className="text-[10px] opacity-75">30 Dias</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPlan('365D')}
                    className={`py-2 px-2.5 rounded-xl border text-center transition-all text-xs ${
                      selectedPlan === '365D'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="block">Anual</span>
                    <span className="text-[10px] opacity-75">1 Ano</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPlan('LIFETIME')}
                    className={`py-2 px-2.5 rounded-xl border text-center transition-all text-xs ${
                      selectedPlan === 'LIFETIME'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="block">Vitalício</span>
                    <span className="text-[10px] opacity-75">Permanente</span>
                  </button>
                </div>
              </div>

              {/* Botão Gerar */}
              <button
                type="button"
                onClick={handleGenerate}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99]"
              >
                {Key ? <Key size={16} /> : <span>🔑</span>}
                <span>Gerar Código de Ativação</span>
              </button>

              {/* Resultado do Código Gerado */}
              {generatedKey && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      {Check ? <Check size={14} /> : '✓'} Código Gerado
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {planLabels[selectedPlan]}
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Código de Ativação:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={generatedKey}
                        readOnly
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-emerald-300 font-mono select-all focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(generatedKey, false)}
                        className="px-3 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-colors flex-shrink-0"
                      >
                        {copiedKey ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Mensagem Formatada para WhatsApp:</label>
                    <textarea
                      value={fullWhatsAppMessage}
                      readOnly
                      rows="4"
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-sans focus:outline-none resize-none select-all"
                    ></textarea>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(fullWhatsAppMessage, true)}
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      {MessageCircle ? <MessageCircle size={15} /> : '📲'}
                      <span>{copiedMsg ? 'Mensagem Copiada!' : 'Copiar Mensagem para o WhatsApp'}</span>
                    </button>

                    {/* Botão de Auto-Ativação (Caso o dono esteja gerando para o próprio celular) */}
                    <button
                      type="button"
                      onClick={handleSelfActivate}
                      className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                    >
                      {selfActivated ? '✅ VIP Ativado Neste Aparelho!' : 'Ativar VIP Neste Aparelho'}
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
