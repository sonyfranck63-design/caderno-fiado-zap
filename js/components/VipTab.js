/**
 * Aba e Tela de Paywall: Plano VIP Pro
 * Sistema seguro de Licenciamento Criptográfico por ID de Aparelho.
 * Suporte completo a temas Claro e Escuro com transições suaves.
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
  const [activating, setActivating] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState(false);

  const {
    Crown, Sparkles, Check, QrCode, FileText, ShieldCheck,
    Play, Clock, Star, Users, CheckCircle2, DollarSign, Copy, MessageCircle, AlertTriangle
  } = window.Icons || {};

  const installationId = vipInfo.installationId || (window.AppState ? window.AppState.getInstallationId() : '');

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

    const ownerPhone = (shopSettings?.supportPhone || '51985661499').replace(/\D/g, '');
    const cleanPhone = ownerPhone.startsWith('55') ? ownerPhone : '55' + ownerPhone;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Ativação assíncrona do código digitado via Web Crypto ECDSA
  const handleActivateCode = async (e) => {
    e.preventDefault();
    if (!licenseCode.trim()) {
      setActivationMessage({ success: false, text: 'Digite o código de ativação recebido no WhatsApp.' });
      return;
    }

    setActivating(true);
    setActivationMessage(null);

    const result = await window.AppState.activateLicenseKey(licenseCode);
    setActivating(false);

    if (result.success) {
      setActivationMessage({ success: true, text: result.message });
      setLicenseCode('');
    } else {
      setActivationMessage({ success: false, text: result.message });
    }
  };

  return (
    <div className="space-y-4 pb-28 tab-enter">
      
      {/* Alerta de Recurso Bloqueado */}
      {triggerReason && !vipInfo.isVip && (
        <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 flex items-start space-x-2.5 animate-pop-in">
          <Crown size={18} className="text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">
              {triggerReason === 'pix' && 'Cobrança PIX Automática é um recurso VIP!'}
              {triggerReason === 'pdf' && 'Emissão de Recibos em PDF é um recurso VIP!'}
              {triggerReason === 'signature' && 'A Assinatura Anticalote é um recurso VIP!'}
              {triggerReason === 'backup' && 'O Backup de Segurança é um recurso VIP!'}
              {triggerReason === 'mass_billing' && 'A Cobrança em Massa é um recurso VIP!'}
              {(!triggerReason || !['pix', 'pdf', 'signature', 'backup', 'mass_billing'].includes(triggerReason)) && 'Esse é um recurso VIP exclusivo!'}
            </span>
            <span className="text-[11px] text-slate-600 dark:text-slate-300">
              Assine um plano a partir de R$ 9,90/mês ou assista a um vídeo rápido para desbloquear por 24h.
            </span>
          </div>
        </div>
      )}

      {/* --- SE O CLIENTE JÁ TEM O VIP ATIVO --- */}
      {vipInfo.isVip ? (
        <div className="relative p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-500/40 shadow-xl text-center space-y-4 overflow-hidden transition-colors">
          
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500 dark:text-amber-400">
            <Crown size={28} strokeWidth={2.5} />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1.5">
              <CheckCircle2 size={13} /> Assinatura Ativa
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-2">
              {vipInfo.planName || 'VIP PRO Ativo'}
            </h2>
            
            {vipInfo.isLifetime ? (
              <p className="text-xs text-amber-600 dark:text-amber-300 mt-1 font-semibold">
                Licença Vitalícia Ativa (Acesso Permanente)
              </p>
            ) : vipInfo.daysRemaining !== null ? (
              <div className="mt-2 space-y-1">
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  Vence em {vipInfo.daysRemaining} dias ({vipInfo.expiresAtDateStr})
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Todas as funções de PIX e comprovantes estão liberadas.
                </p>
              </div>
            ) : (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                Passe temporário de 24 horas ativo.
              </p>
            )}
          </div>

          {/* Dados do Aparelho */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs transition-colors">
            <span className="text-slate-500 dark:text-slate-400">ID deste Aparelho:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">{installationId}</span>
          </div>

          {/* Renovação se estiver próximo do vencimento */}
          {!vipInfo.isLifetime && vipInfo.daysRemaining !== null && vipInfo.daysRemaining <= 5 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl text-xs text-amber-800 dark:text-amber-300 space-y-2">
              <p className="font-semibold">Seu plano vence em breve.</p>
              <button
                onClick={() => handleOrderViaWhatsApp('monthly')}
                className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs btn-smooth"
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
          <div className="relative p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-3 transition-colors">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Crown size={24} strokeWidth={2} />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 inline-block">
                Recursos Profissionais
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-2 leading-tight">
                CadernoFiado <span className="text-emerald-600 dark:text-emerald-400">PRO</span>
              </h2>
              <ul className="text-left text-xs text-slate-700 dark:text-slate-300 mt-3 mx-auto max-w-xs space-y-2">
                <li className="flex items-center gap-2"><FileText size={14} className="text-emerald-500" /> Extratos em PDF com a Logo do negócio</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Assinatura Anticalote de Clientes</li>
                <li className="flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-500" /> Backup de segurança na nuvem</li>
                <li className="flex items-center gap-2"><Star size={14} className="text-emerald-500" /> Zero propagandas no aplicativo</li>
              </ul>
            </div>

            {/* Caixa do ID do Celular */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs transition-colors">
              <div className="text-left">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">ID deste Celular:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">{installationId}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyId}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-medium flex items-center gap-1 border border-slate-200 dark:border-slate-700 btn-smooth"
              >
                {copiedId ? <Check size={13} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={13} />}
                <span>{copiedId ? 'Copiado' : 'Copiar ID'}</span>
              </button>
            </div>
          </div>

          {/* Seleção de Planos de Preço */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 px-1">
              Selecione o plano desejado:
            </p>

            <div className="grid grid-cols-3 gap-2">
              
              {/* Mensal */}
              <div
                onClick={() => setSelectedPlan('monthly')}
                className={`p-3 rounded-2xl border cursor-pointer transition-all text-center relative btn-smooth ${
                  selectedPlan === 'monthly'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-750'
                }`}
              >
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase block">Mensal</span>
                <span className="text-base font-bold text-slate-900 dark:text-white block mt-0.5">R$ 9,90</span>
                <span className="text-[10px] text-slate-400">30 dias</span>
              </div>

              {/* Anual (Destaque) */}
              <div
                onClick={() => setSelectedPlan('annual')}
                className={`p-3 rounded-2xl border cursor-pointer transition-all text-center relative btn-smooth ${
                  selectedPlan === 'annual'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-750'
                }`}
              >
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-emerald-600 text-white font-bold text-[9px] uppercase shadow-sm">
                  Recomendado
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase block mt-0.5">Anual</span>
                <span className="text-base font-bold text-slate-900 dark:text-white block mt-0.5">R$ 59,90</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">R$ 4,99/mês</span>
              </div>

              {/* Vitalício */}
              <div
                onClick={() => setSelectedPlan('lifetime')}
                className={`p-3 rounded-2xl border cursor-pointer transition-all text-center relative btn-smooth ${
                  selectedPlan === 'lifetime'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-750'
                }`}
              >
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase block">Vitalício</span>
                <span className="text-base font-bold text-slate-900 dark:text-white block mt-0.5">R$ 97,00</span>
                <span className="text-[10px] text-slate-400">Permanente</span>
              </div>

            </div>
          </div>

          {/* Botão de Solicitação no WhatsApp */}
          <button
            onClick={() => handleOrderViaWhatsApp()}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center space-x-2 transition-all active:scale-[0.99] shadow-sm btn-smooth"
          >
            <MessageCircle size={18} />
            <span>Solicitar Código de Ativação</span>
          </button>

          {/* Formulário de Ativação de Código do Cliente */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm transition-colors">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Check size={16} />
              </div>
              <h4 className="font-bold text-xs text-slate-900 dark:text-white">Ativar com Código Recebido</h4>
            </div>

            <form onSubmit={handleActivateCode} className="space-y-2.5">
              <input
                type="text"
                value={licenseCode}
                onChange={(e) => setLicenseCode(e.target.value.trim().toUpperCase())}
                placeholder="Ex: VIP-M-C5A6-6A19-9B2F4E"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500 uppercase"
              />

              {activationMessage && (
                <div className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 ${
                  activationMessage.success 
                    ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30' 
                    : 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
                }`}>
                  {activationMessage.success ? <Check size={15} /> : <AlertTriangle size={15} />}
                  <span>{activationMessage.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={activating}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold text-xs border border-slate-300 dark:border-slate-700 transition-all btn-smooth"
              >
                {activating ? 'Validando código...' : 'Ativar Código'}
              </button>
            </form>
          </div>

          {/* Opção Gratuita: Vídeo Premiado 24h */}
          {onWatchRewarded && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center space-y-2 transition-colors">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                Quer testar antes? Libere 24h grátis assistindo a um vídeo rápido:
              </span>
              <button
                onClick={onWatchRewarded}
                className="py-2 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 mx-auto border border-slate-300 dark:border-slate-700 transition-colors btn-smooth"
              >
                <Play size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>Assistir Vídeo (Liberar 24h)</span>
              </button>
            </div>
          )}

        </div>
      )}

      {/* Acesso ao Painel do Dono para emissão de licenças */}
      {onOpenAdmin && (
        <div className="pt-3 pb-2 text-center">
          <button
            type="button"
            onClick={onOpenAdmin}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-[11px] font-semibold transition-all border border-slate-200/80 dark:border-slate-800"
          >
            <ShieldCheck size={13} className="text-emerald-500" />
            <span>Painel do Administrador (Dono)</span>
          </button>
        </div>
      )}

    </div>
  );
};
