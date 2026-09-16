/**
 * Painel Administrativo Secreto do Dono do App (Gerador de Licenças VIP)
 * Permite gerar chaves de ativação personalizadas por ID do celular do cliente.
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

  const { X, ShieldCheck, Key, Copy, Check, Sparkles, MessageCircle, Crown, Clock } = window.Icons;

  React.useEffect(() => {
    if (isOpen) {
      setAuthError('');
      // Pré-preenche com o próprio ID do aparelho como sugestão
      const currentId = window.AppState.getInstallationId();
      if (!targetDeviceId) setTargetDeviceId(currentId);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = (e) => {
    e.preventDefault();
    if (pin.trim() === '2026' || pin.trim() === 'admin123') {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Senha de Administrador incorreta.');
    }
  };

  const handleGenerate = () => {
    if (!targetDeviceId.trim()) {
      alert('Informe o ID do aparelho do cliente (ex: CF-7482).');
      return;
    }
    const key = window.AppState.generateLicenseKey(targetDeviceId, selectedPlan);
    setGeneratedKey(key);
    setCopiedKey(false);
    setCopiedMsg(false);
  };

  const planLabels = {
    '30D': 'Plano Mensal (30 Dias)',
    '365D': 'Plano Anual (1 Ano)',
    'LIFETIME': 'Plano Vitalício Pro'
  };

  const fullWhatsAppMessage = `Olá! Seu pagamento do ${planLabels[selectedPlan]} do CadernoFiado foi confirmado com sucesso! 🎉\n\n🔑 *Seu Código de Ativação Exclusivo:*\n\`${generatedKey}\`\n\n📲 *Como ativar no seu aparelho:*\n1. Abra o CadernoFiado no seu celular\n2. Vá na aba inferior "Plano VIP"\n3. Cole o código acima no campo "Código de Ativação" e clique em Ativar!\n\nSeu acesso com cobrança PIX e PDFs timbrados já está liberado. Obrigado pela confiança! 🤝`;

  const handleCopyKey = () => {
    navigator.clipboard.writeText(generatedKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(fullWhatsAppMessage);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2000);
  };

  const handleSelfActivate = () => {
    const res = window.AppState.activateLicenseKey(generatedKey);
    alert(res.message);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-amber-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Cabeçalho do Painel Dono */}
        <div className="px-4 py-3.5 bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/50 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-glow-gold">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                Painel do Administrador <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">Dono</span>
              </h3>
              <p className="text-[11px] text-slate-300">Gerador Oficial de Chaves & Licenças</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {!isAuthenticated ? (
            /* Tela de Bloqueio por PIN */
            <form onSubmit={handleLogin} className="space-y-4 py-3">
              <div className="text-center space-y-1.5">
                <span className="text-3xl">🔒</span>
                <h4 className="font-bold text-sm text-white">Acesso Restrito ao Dono</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Digite sua senha de administrador para gerar chaves de ativação para seus clientes.
                </p>
              </div>

              <div>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Digite a senha (padrão: 2026)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl py-3 px-4 text-center font-mono text-sm tracking-widest text-white focus:outline-none focus:border-amber-500"
                  autoFocus
                />
                {authError && (
                  <p className="text-xs text-rose-400 text-center mt-1.5 font-medium">{authError}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-glow-gold transition-all"
              >
                Entrar no Gerador de Chaves
              </button>
            </form>
          ) : (
            /* Painel de Geração de Chaves */
            <div className="space-y-4">
              
              {/* Campo ID do Cliente */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  ID do Aparelho do Cliente (fornecido pelo cliente no Zap):
                </label>
                <input
                  type="text"
                  value={targetDeviceId}
                  onChange={(e) => setTargetDeviceId(e.target.value.toUpperCase())}
                  placeholder="Ex: CF-7482"
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl py-2.5 px-3.5 text-xs text-white font-mono uppercase focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Seu ID local para testes: <strong>{window.AppState.getInstallationId()}</strong>
                </span>
              </div>

              {/* Seletor de Tipo de Plano */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Tempo de Acesso da Licença:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('30D')}
                    className={`py-2.5 px-2 rounded-2xl text-xs font-medium border text-center transition-all ${
                      selectedPlan === '30D'
                        ? 'bg-emerald-500/25 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    30 Dias (Mensal)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('365D')}
                    className={`py-2.5 px-2 rounded-2xl text-xs font-medium border text-center transition-all ${
                      selectedPlan === '365D'
                        ? 'bg-amber-500/25 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    1 Ano (Anual)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('LIFETIME')}
                    className={`py-2.5 px-2 rounded-2xl text-xs font-medium border text-center transition-all ${
                      selectedPlan === 'LIFETIME'
                        ? 'bg-purple-500/25 border-purple-500 text-purple-300 font-bold'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Vitalício Pro
                  </button>
                </div>
              </div>

              {/* Botão de Geração */}
              <button
                type="button"
                onClick={handleGenerate}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-gold-500 hover:from-amber-400 hover:to-gold-400 text-slate-950 font-extrabold text-xs shadow-glow-gold flex items-center justify-center space-x-2 transition-all transform active:scale-95"
              >
                <Sparkles size={16} />
                <span>Gerar Código de Ativação Agora</span>
              </button>

              {/* Resultado da Chave Gerada */}
              {generatedKey && (
                <div className="bg-slate-950 border border-amber-500/40 rounded-2xl p-3.5 space-y-3 shadow-inner">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-amber-300 uppercase">
                        Código Gerado com Sucesso:
                      </span>
                      <button
                        onClick={handleCopyKey}
                        className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                      >
                        {copiedKey ? <Check size={13} /> : <Copy size={13} />}
                        <span>{copiedKey ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                    <div className="p-2.5 bg-slate-900 rounded-xl font-mono text-xs font-bold text-center text-emerald-400 tracking-wider border border-slate-800 select-all">
                      {generatedKey}
                    </div>
                  </div>

                  {/* Ações Rápidas */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={handleCopyMessage}
                      className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    >
                      {copiedMsg ? <Check size={14} className="text-emerald-400" /> : <MessageCircle size={14} />}
                      <span>{copiedMsg ? 'Mensagem Copiada!' : 'Copiar p/ Zap'}</span>
                    </button>

                    <button
                      onClick={handleSelfActivate}
                      className="py-2.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs border border-emerald-500/40 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    >
                      <Check size={14} />
                      <span>Ativar Neste Celular</span>
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
