/**
 * Modal de Vídeo Premiado (Rewarded Video Ad)
 * Simula uma experiência realista de anúncio AdMob com contagem regressiva de 5s,
 * barra de progresso interativa e liberação do Passe VIP Pro de 24 Horas com confetes.
 */

window.RewardedAdModal = function RewardedAdModal({ isOpen, onClose, onRewardGranted }) {
  const [countdown, setCountdown] = React.useState(5);
  const [completed, setCompleted] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const { X, Crown, Sparkles, CheckCircle2 } = window.Icons;

  React.useEffect(() => {
    if (!isOpen) {
      setCountdown(5);
      setCompleted(false);
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClaimReward = () => {
    window.AppState.activate24hPass();
    if (onRewardGranted) onRewardGranted();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
        
        {/* Barra de Progresso Superior */}
        <div className="w-full bg-slate-800 h-1.5 overflow-hidden">
          <div 
            className="bg-brand-500 h-full transition-all duration-1000 ease-linear"
            style={{ width: `${((5 - countdown) / 5) * 100}%` }}
          />
        </div>

        {/* Topo com Contador e Selo AdMob */}
        <div className="p-3.5 flex items-center justify-between border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Rewarded Ad • AdMob
            </span>
            <span className="text-xs text-slate-400">Vídeo Premiado</span>
          </div>

          <div className="flex items-center space-x-2">
            {!completed ? (
              <span className="text-xs font-mono font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20">
                Recompensa em {countdown}s
              </span>
            ) : (
              <button 
                onClick={onClose} 
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Corpo do Anúncio (Simulação Realista de Vídeo) */}
        <div className="p-6 text-center">
          {!completed ? (
            <div className="space-y-4">
              {/* Moldura de Vídeo Interativa */}
              <div className="relative rounded-2xl bg-gradient-to-br from-slate-950 to-slate-800 border border-slate-700/60 p-6 flex flex-col items-center justify-center min-h-[190px] shadow-inner">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-3xl shadow-glow-emerald animate-bounce">
                  💳
                </div>
                <h3 className="text-base font-bold text-white mt-3">
                  InfinitePay & Ton Brasil
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-[220px]">
                  A maquininha com a menor taxa do Brasil para autônomos. Sem mensalidade e com PIX no visor.
                </p>
                
                {/* Simulação de ondas sonoras/reprodução */}
                <div className="flex items-center space-x-1 mt-3">
                  <div className="w-1 h-3 bg-brand-400 rounded-full animate-pulse"></div>
                  <div className="w-1 h-5 bg-brand-500 rounded-full animate-pulse delay-75"></div>
                  <div className="w-1 h-4 bg-brand-300 rounded-full animate-pulse delay-150"></div>
                  <div className="w-1 h-6 bg-brand-400 rounded-full animate-pulse"></div>
                  <span className="text-[10px] text-slate-400 ml-2 font-mono">Reproduzindo anúncio...</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                Assista até o fim para desbloquear <b>24h de PIX Automático, PDF Timbrado e Zero Anúncios</b>!
              </p>
            </div>
          ) : (
            /* Estado de Sucesso: Recompensa Pronta */
            <div className="py-2 space-y-4 animate-scaleUp">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-glow-emerald">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white flex items-center justify-center gap-1.5">
                  <Sparkles size={18} className="text-amber-400" />
                  Passe VIP Liberado!
                </h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  Você concluiu o vídeo e desbloqueou <b>24 Horas de Acesso VIP PRO</b> em todas as funcionalidades do aplicativo!
                </p>
              </div>

              <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800 text-left space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
                  <span>✓</span> <span>PIX Copia e Cola & QR Code Automático liberados</span>
                </div>
                <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
                  <span>✓</span> <span>Recibos e Extratos em PDF Profissionais</span>
                </div>
                <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
                  <span>✓</span> <span>100% Livre de Banners e Anúncios</span>
                </div>
              </div>

              <button
                onClick={handleClaimReward}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-emerald-400 hover:from-brand-400 hover:to-emerald-300 text-slate-950 font-bold text-sm shadow-glow-emerald active:scale-95 transition-all flex items-center justify-center space-x-2"
              >
                <Crown size={16} />
                <span>Ativar Meu Passe VIP de 24h</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
