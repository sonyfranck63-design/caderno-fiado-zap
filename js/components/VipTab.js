/**
 * Aba e Tela de Paywall de Alta Conversão: Plano VIP Pro
 * Gatilhos de ancoragem, 7 dias grátis, comparativo de planos e simulador de status VIP para teste.
 */

window.VipTab = function VipTab({
  vipInfo,
  onToggleVip,
  onWatchRewarded,
  triggerReason
}) {
  const [billingCycle, setBillingCycle] = React.useState('annual'); // 'annual' | 'monthly'
  const [subscribedToast, setSubscribedToast] = React.useState(false);

  const {
    Crown, Sparkles, Check, QrCode, FileText, ShieldCheck,
    Play, Clock, Star, Users, CheckCircle2, DollarSign
  } = window.Icons;

  const handleSubscribe = () => {
    // Simula contratação do plano com 7 dias grátis
    window.AppState.setVipPermanent(true);
    setSubscribedToast(true);
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.5 }
      });
    }
    setTimeout(() => setSubscribedToast(false), 3500);
  };

  return (
    <div className="space-y-4 pb-28 animate-fadeIn">
      
      {/* Toast de Confirmação */}
      {subscribedToast && (
        <div className="fixed top-16 left-4 right-4 z-50 p-3 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-2xl flex items-center justify-center space-x-2 animate-bounce">
          <CheckCircle2 size={18} />
          <span>Assinatura VIP PRO Ativada com Sucesso! 7 Dias Grátis Iniciados.</span>
        </div>
      )}

      {/* Alerta de Recurso Bloqueado (se veio de um gatilho de Paywall) */}
      {triggerReason && !vipInfo.isVip && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start space-x-2.5">
          <Crown size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">
              {triggerReason === 'pix' ? 'Geração de PIX Automático' : 'Emissão de Recibo em PDF Timbrado'} é um recurso VIP!
            </span>
            <span className="text-[11px] text-slate-300">
              Assine o VIP Pro ou assista a um vídeo de 5s para desbloquear por 24h.
            </span>
          </div>
        </div>
      )}

      {/* Hero do Paywall com Gatilho Psicológico de Ancoragem */}
      <div className="relative p-5 rounded-3xl bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/30 shadow-xl text-center space-y-3 overflow-hidden">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 shadow-glow-gold">
          <Crown size={30} strokeWidth={2.5} />
        </div>

        <div>
          <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/40 inline-flex items-center gap-1">
            <Sparkles size={12} /> Exclusivo para Profissionais
          </span>
          <h2 className="text-xl font-extrabold text-white mt-2 leading-tight">
            CadernoFiado <span className="vip-gradient-text">VIP PRO</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1.5 max-w-xs mx-auto leading-relaxed">
            <b>Recupere até 3x mais dívidas esquecidas</b> com cobranças profissionais no PIX e recibos timbrados logo no primeiro mês!
          </p>
        </div>

        {/* 7 Dias Grátis Badge */}
        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1.5">
          <ShieldCheck size={16} />
          <span>Comece hoje com 7 Dias Grátis • Cancele quando quiser</span>
        </div>
      </div>

      {/* Switch de Ciclo de Cobrança: Anual (40% OFF) vs Mensal */}
      <div className="p-1 bg-slate-900 rounded-2xl border border-slate-800 grid grid-cols-2 gap-1 text-center">
        <button
          type="button"
          onClick={() => setBillingCycle('annual')}
          className={`py-2 px-2 rounded-xl text-xs font-bold transition-all relative ${
            billingCycle === 'annual'
              ? 'bg-gradient-to-r from-amber-500 to-gold-500 text-slate-950 shadow-glow-gold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span className="absolute -top-2 right-2 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-rose-500 text-white shadow-sm">
            40% OFF
          </span>
          <span>Plano Anual</span>
        </button>

        <button
          type="button"
          onClick={() => setBillingCycle('monthly')}
          className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
            billingCycle === 'monthly'
              ? 'bg-slate-800 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Plano Mensal</span>
        </button>
      </div>

      {/* Card de Preço & Assinatura */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
        <div className="flex items-baseline justify-between border-b border-slate-800 pb-3">
          <div>
            <span className="text-xs font-semibold text-slate-400 block">
              {billingCycle === 'annual' ? 'Faturamento Anual (Economize R$ 58)' : 'Faturamento Mensal flexível'}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-3xl font-extrabold text-white font-mono">
                {billingCycle === 'annual' ? 'R$ 9,99' : 'R$ 14,90'}
              </span>
              <span className="text-xs text-slate-400 font-medium">/mês</span>
            </div>
            {billingCycle === 'annual' && (
              <span className="text-[10px] text-amber-400/90 font-medium">
                Cobrado anualmente R$ 119,90 (Menos de R$ 0,33 por dia)
              </span>
            )}
          </div>

          <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
            7 DIAS GRÁTIS
          </span>
        </div>

        {/* Lista de Vantagens VIP */}
        <div className="space-y-2.5 text-xs text-slate-200">
          <div className="flex items-center space-x-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Check size={12} strokeWidth={3} />
            </div>
            <span><b>Geração de PIX Automática:</b> QR Code dinâmico com valor exato.</span>
          </div>

          <div className="flex items-center space-x-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Check size={12} strokeWidth={3} />
            </div>
            <span><b>Recibos & Extratos em PDF Timbrado:</b> Com logotipo e assinatura.</span>
          </div>

          <div className="flex items-center space-x-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Check size={12} strokeWidth={3} />
            </div>
            <span><b>100% Livre de Anúncios:</b> Tela limpa sem banners AdMob.</span>
          </div>

          <div className="flex items-center space-x-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Check size={12} strokeWidth={3} />
            </div>
            <span><b>Backup em Nuvem / JSON:</b> Seus clientes nunca se perdem.</span>
          </div>
        </div>

        {/* Botão de Assinar */}
        <button
          onClick={handleSubscribe}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-gold-500 hover:from-amber-400 hover:to-gold-400 text-slate-950 font-extrabold text-sm shadow-glow-gold flex items-center justify-center space-x-2 transition-all active:scale-95"
        >
          <Crown size={17} />
          <span>Assinar Agora com 7 Dias Grátis</span>
        </button>
      </div>

      {/* Alternativa: Desbloquear 24h Assistindo Vídeo Premiado */}
      <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Play size={12} className="fill-brand-400 text-brand-400" />
            Precisa de um recurso VIP agora?
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Assista a 1 anúncio de 5 segundos e libere o Passe VIP por 24 horas.
          </p>
        </div>

        <button
          onClick={onWatchRewarded}
          className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-brand-400 font-bold text-xs border border-slate-700 whitespace-nowrap flex-shrink-0 active:scale-95 transition-all"
        >
          Assistir Vídeo (5s)
        </button>
      </div>

      {/* Prova Social: Depoimentos Reais */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
        <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <Star size={14} className="text-amber-400 fill-amber-400" />
          Quem usa, recomenda:
        </h4>

        <div className="space-y-2 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <p className="text-slate-300 italic">
              "O botão do PIX com o valor exato no WhatsApp mudou meu salão. Os clientes pagam na mesma hora sem ficar pedindo chave!"
            </p>
            <span className="text-[10px] text-amber-400 font-semibold block mt-1">
              — Camila Santos, Designer de Sobrancelhas (SP)
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <p className="text-slate-300 italic">
              "Recuperei R$ 850 em fiados que já dava como perdidos só mandando o lembrete educado com o comprovante em PDF."
            </p>
            <span className="text-[10px] text-amber-400 font-semibold block mt-1">
              — Marcos Oliveira, Autopeças & Mecânica (MG)
            </span>
          </div>
        </div>
      </div>

      {/* SIMULADOR DE STATUS VIP (Para Testes e Avaliação do Usuário) */}
      <div className="p-4 rounded-3xl bg-slate-950 border-2 border-brand-500/40 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🧪</span>
            <div>
              <h4 className="text-xs font-bold text-white">Simulador de Status VIP</h4>
              <p className="text-[10px] text-slate-400">Alterne instantaneamente para testar Grátis vs VIP</p>
            </div>
          </div>

          {/* Toggle Switch */}
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={vipInfo.isVip}
              onChange={e => onToggleVip(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>

        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
          <span>Status Atual no App:</span>
          <span className={`font-bold font-mono ${vipInfo.isVip ? 'text-amber-400' : 'text-slate-400'}`}>
            {vipInfo.isVipPermanent 
              ? '👑 VIP PRO PERMANENTE' 
              : vipInfo.isPassActive 
              ? '⏳ PASSE 24H ATIVO' 
              : '🆓 PLANO GRÁTIS COM ADMOB'}
          </span>
        </div>
      </div>

    </div>
  );
};
