/**
 * Aba e Tela de Paywall de Alta Conversão: Plano VIP Pro
 * Sistema real de Licenciamento por ID de Aparelho, Contagem Regressiva de Expiração e Renovação via WhatsApp.
 */

window.VipTab = function VipTab({
  vipInfo,
  onWatchRewarded,
  triggerReason,
  shopSettings,
  onOpenAdmin
}) {
  const [selectedPlan, setSelectedPlan] = React.useState('monthly'); // 'monthly' | 'annual' | 'lifetime'
  const [licenseCode, setLicenseCode] = React.useState('');
  const [activationMessage, setActivationMessage] = React.useState(null);
  const [copiedId, setCopiedId] = React.useState(false);

  const {
    Crown, Sparkles, Check, QrCode, FileText, ShieldCheck,
    Play, Clock, Star, Users, CheckCircle2, DollarSign, Copy, MessageCircle, AlertTriangle
  } = window.Icons;

  const installationId = vipInfo.installationId || window.AppState.getInstallationId();

  // Copia o ID do aparelho
  const handleCopyId = () => {
    navigator.clipboard.writeText(installationId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Dispara pedido de assinatura no WhatsApp do Dono
  const handleOrderViaWhatsApp = (planKey = selectedPlan) => {
    const plansInfo = {
      monthly: { name: 'Plano VIP Mensal', price: 'R$ 9,90/mês' },
      annual: { name: 'Plano VIP Anual', price: 'R$ 59,90/ano' },
      lifetime: { name: 'Plano VIP Vitalício', price: 'R$ 97,00 (Acesso Único)' }
    };
    const current = plansInfo[planKey] || plansInfo.monthly;

    const message = `Olá! Quero assinar o *${current.name} (${current.price})* do CadernoFiado.\n\n📲 *ID do meu aparelho:* \`${installationId}\`\n\nPode me enviar a chave PIX para eu fazer o pagamento e liberar meu código de ativação? Obrigado!`;

    // Número do criador configurado ou fallback padrão
    const ownerPhone = (shopSettings?.supportPhone || '51985661499').replace(/\D/g, '');
    const cleanPhone = ownerPhone.startsWith('55') ? ownerPhone : '55' + ownerPhone;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Ativação do código digitado
  const handleActivateCode = (e) => {
    e.preventDefault();
    if (!licenseCode.trim()) {
      setActivationMessage({ success: false, text: 'Digite o código de ativação fornecido no WhatsApp.' });
      return;
    }

    const result = window.AppState.activateLicenseKey(licenseCode);
    if (result.success) {
      setActivationMessage({ success: true, text: result.message });
      setLicenseCode('');
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.5 }
        });
      }
    } else {
      setActivationMessage({ success: false, text: result.message });
    }
  };

  return (
    <div className="space-y-4 pb-28 animate-fadeIn">
      
      {/* Alerta de Recurso Bloqueado (se veio de um gatilho de Paywall) */}
      {triggerReason && !vipInfo.isVip && (
        <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-300 flex items-start space-x-2.5 shadow-lg">
          <Crown size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">
              {triggerReason === 'pix' ? 'Geração de PIX Automático' : 'Emissão de Recibo em PDF Timbrado'} é um recurso VIP!
            </span>
            <span className="text-[11px] text-slate-300">
              Assine um plano a partir de R$ 9,90/mês ou assista a um vídeo rápido para desbloquear por 24h.
            </span>
          </div>
        </div>
      )}

      {/* --- SE O CLIENTE JÁ TEM O VIP ATIVO --- */}
      {vipInfo.isVip ? (
        <div className="relative p-5 rounded-3xl bg-gradient-to-br from-amber-950/50 via-slate-900 to-slate-950 border border-amber-500/40 shadow-2xl text-center space-y-4 overflow-hidden">
          
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 shadow-glow-gold">
            <Crown size={34} strokeWidth={2.5} />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1.5">
              <CheckCircle2 size={13} /> Assinatura Ativa
            </span>
            <h2 className="text-xl font-black text-white mt-2">
              {vipInfo.planName || 'VIP PRO Ativo'}
            </h2>
            
            {vipInfo.isLifetime ? (
              <p className="text-xs text-amber-300 mt-1 font-semibold">
                ✨ Licença Vitalícia Permanente (Acesso Ilimitado)
              </p>
            ) : vipInfo.daysRemaining !== null ? (
              <div className="mt-2 space-y-1">
                <p className="text-sm font-extrabold text-emerald-400">
                  ⏳ Vence em {vipInfo.daysRemaining} dias ({vipInfo.expiresAtDateStr})
                </p>
                <p className="text-[11px] text-slate-400">
                  Todas as funções de PIX e PDF estão 100% liberadas.
                </p>
              </div>
            ) : (
              <p className="text-xs text-emerald-400 mt-1">
                Passe temporário de 24 horas ativo.
              </p>
            )}
          </div>

          {/* Dados do Aparelho */}
          <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">ID deste Aparelho:</span>
            <span className="font-mono font-bold text-white">{installationId}</span>
          </div>

          {/* Botão de Renovação se estiver próximo do vencimento */}
          {!vipInfo.isLifetime && vipInfo.daysRemaining !== null && vipInfo.daysRemaining <= 5 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 space-y-2">
              <p className="font-semibold">⚠️ Seu plano vence em breve!</p>
              <button
                onClick={() => handleOrderViaWhatsApp('monthly')}
                className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-glow-gold flex items-center justify-center gap-1.5 transition-all text-xs"
              >
                <MessageCircle size={15} />
                <span>Renovar Plano no WhatsApp Agora</span>
              </button>
            </div>
          )}

        </div>
      ) : (
        /* --- SE O CLIENTE AINDA NÃO É VIP (OU PLANO EXPIROU) --- */
        <div className="space-y-4">
          
          {/* Card Principal de Apresentação */}
          <div className="relative p-5 rounded-3xl bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/30 shadow-xl text-center space-y-3 overflow-hidden">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 shadow-glow-gold">
              <Crown size={30} strokeWidth={2.5} />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/40 inline-flex items-center gap-1">
                <Sparkles size={12} /> Acelere seu Caixa
              </span>
              <h2 className="text-xl font-extrabold text-white mt-2 leading-tight">
                CadernoFiado <span className="vip-gradient-text">VIP PRO</span>
              </h2>
              <p className="text-xs text-slate-300 mt-1.5 max-w-xs mx-auto leading-relaxed">
                Cobrança PIX automática, extratos timbrados em PDF e zero limites para expandir seu negócio!
              </p>
            </div>

            {/* Caixa do ID do Celular */}
            <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
              <div className="text-left">
                <span className="text-[10px] text-slate-400 block">Seu ID de Aparelho:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{installationId}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyId}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 border border-slate-700"
              >
                {copiedId ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copiedId ? 'Copiado' : 'Copiar ID'}</span>
              </button>
            </div>
          </div>

          {/* Seleção de Planos de Preço */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-300 px-1">
              Escolha seu plano de assinatura:
            </p>

            <div className="grid grid-cols-3 gap-2">
              
              {/* Mensal */}
              <div
                onClick={() => setSelectedPlan('monthly')}
                className={`p-3 rounded-2xl border cursor-pointer transition-all text-center relative ${
                  selectedPlan === 'monthly'
                    ? 'bg-emerald-950/40 border-emerald-500 shadow-glow-emerald'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Mensal</span>
                <span className="text-lg font-black text-white block mt-0.5">R$ 9,90</span>
                <span className="text-[10px] text-slate-400">por 30 dias</span>
              </div>

              {/* Anual (Destaque) */}
              <div
                onClick={() => setSelectedPlan('annual')}
                className={`p-3 rounded-2xl border cursor-pointer transition-all text-center relative ${
                  selectedPlan === 'annual'
                    ? 'bg-amber-950/40 border-amber-500 shadow-glow-gold'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] uppercase shadow-sm">
                  Mais Vendido
                </span>
                <span className="text-[10px] font-bold text-amber-400 uppercase block mt-1">Anual</span>
                <span className="text-lg font-black text-amber-300 block mt-0.5">R$ 59,90</span>
                <span className="text-[10px] text-emerald-400 font-semibold">R$ 4,99/mês</span>
              </div>

              {/* Vitalício */}
              <div
                onClick={() => setSelectedPlan('lifetime')}
                className={`p-3 rounded-2xl border cursor-pointer transition-all text-center relative ${
                  selectedPlan === 'lifetime'
                    ? 'bg-purple-950/40 border-purple-500 shadow-glow-violet'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="text-[10px] font-bold text-purple-300 uppercase block">Vitalício</span>
                <span className="text-lg font-black text-white block mt-0.5">R$ 97,00</span>
                <span className="text-[10px] text-purple-300">Paga 1x só</span>
              </div>

            </div>
          </div>

          {/* Botão de Pagamento / Contratação pelo WhatsApp */}
          <button
            onClick={() => handleOrderViaWhatsApp()}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-glow-emerald flex items-center justify-center space-x-2 transition-all transform active:scale-95"
          >
            <MessageCircle size={19} />
            <span>Pagar via PIX e Liberar no WhatsApp</span>
          </button>

          {/* Formulário de Ativação de Código do Cliente */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-md">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Check size={16} />
              </div>
              <h4 className="font-bold text-xs text-white">Já fez o PIX? Ative seu Código:</h4>
            </div>

            <form onSubmit={handleActivateCode} className="space-y-2.5">
              <input
                type="text"
                value={licenseCode}
                onChange={(e) => setLicenseCode(e.target.value.toUpperCase())}
                placeholder="Cole seu código (ex: CF-30D-XXXX-YYYY)"
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl py-2.5 px-3.5 text-xs text-white font-mono uppercase tracking-wider focus:outline-none focus:border-amber-500"
              />

              {activationMessage && (
                <div className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 ${
                  activationMessage.success 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  {activationMessage.success ? <Check size={15} /> : <AlertTriangle size={15} />}
                  <span>{activationMessage.text}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-glow-gold transition-all"
              >
                Validar e Ativar VIP Agora
              </button>
            </form>
          </div>

          {/* Opção Gratuita: Vídeo Premiado 24h */}
          {onWatchRewarded && (
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
              <span className="text-[11px] text-slate-400 block">
                Quer testar antes? Libere 24h grátis assistindo a um vídeo patrocinado:
              </span>
              <button
                onClick={onWatchRewarded}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 mx-auto border border-slate-700 transition-colors"
              >
                <Play size={14} className="text-emerald-400" />
                <span>Assistir Vídeo (Liberar 24h Grátis)</span>
              </button>
            </div>
          )}

        </div>
      )}

      {/* Acesso Secreto ao Painel do Administrador para o Dono */}
      {onOpenAdmin && (
        <div className="pt-2 text-center">
          <button
            onClick={onOpenAdmin}
            className="text-[11px] text-slate-500 hover:text-amber-400 transition-colors font-mono flex items-center justify-center gap-1 mx-auto"
          >
            <ShieldCheck size={12} />
            <span>Área do Dono (Gerar Chaves)</span>
          </button>
        </div>
      )}

    </div>
  );
};
