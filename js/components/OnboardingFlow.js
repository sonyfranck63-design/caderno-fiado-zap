/**
 * Onboarding de Primeiro Uso: Configuração Inicial do Estabelecimento
 * Exibido apenas quando o lojista abre o app pela primeira vez.
 * Coleta nome do negócio, chave PIX e WhatsApp comercial em 3 etapas.
 */

window.OnboardingFlow = function OnboardingFlow({ onComplete }) {
  const [step, setStep] = React.useState(1);
  const [shopName, setShopName] = React.useState('');
  const [ownerName, setOwnerName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [pixKeyType, setPixKeyType] = React.useState('telefone');
  const [pixKey, setPixKey] = React.useState('');
  const [city, setCity] = React.useState('');

  const { Check, ChevronRight, Store, QrCode, Sparkles } = window.Icons || {};

  const totalSteps = 3;

  const handleFinish = () => {
    const settings = {
      shopName: shopName.trim() || 'Meu Negócio',
      ownerName: ownerName.trim(),
      phone: phone.replace(/\D/g, ''),
      pixKeyType,
      pixKey: pixKey.trim(),
      city: city.trim(),
      supportPhone: phone.replace(/\D/g, '')
    };
    window.AppState.saveSettings(settings);
    onComplete();
  };

  const handleNext = () => {
    if (step === 1) {
      if (!shopName.trim()) return;
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else {
      handleFinish();
    }
  };

  const handleSkipPix = () => {
    setStep(3);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-5 font-sans">
      <div className="w-full max-w-sm space-y-6 animate-pop-in">
        
        {/* Logo e Boas-vindas */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
              <path d="M6 6h10"/><path d="M6 10h7"/>
              <polygon points="17 12 14 17 17 17 16 21 21 15 18 15 19 12" fill="#34d399" stroke="none"/>
            </svg>
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">
            CadernoFiado <span className="text-emerald-400">Pro</span>
          </h1>
          <p className="text-xs text-slate-400">
            Vamos configurar o seu negócio em menos de 1 minuto.
          </p>
        </div>

        {/* Indicador de Etapas */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${
              s <= step ? 'bg-emerald-500 w-10' : 'bg-slate-800 w-6'
            }`} />
          ))}
        </div>

        {/* Etapa 1: Nome do Negócio */}
        {step === 1 && (
          <div className="space-y-4 animate-pop-in">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                  {Store ? <Store size={18} /> : <span>🏪</span>}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Seu Negócio</h3>
                  <p className="text-[11px] text-slate-400">Essas informações aparecem no topo do app e nas cobranças.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Nome do Estabelecimento *
                  </label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={e => setShopName(e.target.value)}
                    placeholder="Ex: Mercadinho do João / Espaço Beleza"
                    autoFocus
                    className="w-full px-3.5 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Seu Nome (opcional)
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={e => setOwnerName(e.target.value)}
                    placeholder="Ex: João Silva"
                    className="w-full px-3.5 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    WhatsApp Comercial com DDD *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="Ex: 11987654321"
                    className="w-full px-3.5 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Será usado para receber pedidos de assinatura e suporte.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Etapa 2: Chave PIX */}
        {step === 2 && (
          <div className="space-y-4 animate-pop-in">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                  {QrCode ? <QrCode size={18} /> : <span>⚡</span>}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Chave PIX para Receber</h3>
                  <p className="text-[11px] text-slate-400">O app gera QR Code e Copia e Cola automáticos.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Tipo de Chave PIX</label>
                  <select
                    value={pixKeyType}
                    onChange={e => setPixKeyType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="telefone">Celular / WhatsApp</option>
                    <option value="cpf">CPF / CNPJ</option>
                    <option value="email">E-mail</option>
                    <option value="aleatoria">Chave Aleatória (EVP)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Chave PIX</label>
                  <input
                    type="text"
                    value={pixKey}
                    onChange={e => setPixKey(e.target.value)}
                    placeholder="Cole sua chave PIX aqui"
                    autoFocus
                    className="w-full px-3.5 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Cidade</label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="Ex: São Paulo"
                    className="w-full px-3.5 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSkipPix}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors py-1"
            >
              Pular por agora (posso configurar depois)
            </button>
          </div>
        )}

        {/* Etapa 3: Confirmação */}
        {step === 3 && (
          <div className="space-y-4 animate-pop-in">
            <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-4 shadow-lg shadow-emerald-500/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  {Sparkles ? <Sparkles size={18} /> : <span>✨</span>}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Tudo pronto!</h3>
                  <p className="text-[11px] text-slate-400">Confira os dados antes de começar:</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-400">Negócio</span>
                  <span className="font-bold text-white">{shopName || '—'}</span>
                </div>
                {ownerName && (
                  <div className="flex justify-between p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                    <span className="text-slate-400">Responsável</span>
                    <span className="font-bold text-white">{ownerName}</span>
                  </div>
                )}
                {phone && (
                  <div className="flex justify-between p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                    <span className="text-slate-400">WhatsApp</span>
                    <span className="font-mono font-bold text-emerald-400">{phone}</span>
                  </div>
                )}
                {pixKey && (
                  <div className="flex justify-between p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                    <span className="text-slate-400">Chave PIX</span>
                    <span className="font-mono font-bold text-emerald-400 truncate max-w-[180px]">{pixKey}</span>
                  </div>
                )}
                {!pixKey && (
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]">
                    ⚠️ Chave PIX não configurada — você pode adicionar depois em Configurações.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Botão de Ação Principal */}
        <button
          type="button"
          onClick={handleNext}
          disabled={step === 1 && !shopName.trim()}
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md ${
            (step === 1 && !shopName.trim())
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
          }`}
        >
          {step < totalSteps ? (
            <>
              <span>Continuar</span>
              {ChevronRight && <ChevronRight size={18} />}
            </>
          ) : (
            <>
              {Check && <Check size={18} />}
              <span>Começar a Usar</span>
            </>
          )}
        </button>

        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors py-1"
          >
            ← Voltar
          </button>
        )}

      </div>
    </div>
  );
};
