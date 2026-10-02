/**
 * Componente de Banner Promocional Interno
 * Exibido no rodapé apenas para usuários do Plano Gratuito.
 * Desaparece 100% no modo VIP ou com Passe 24h ativo.
 * Usa apenas conteúdo próprio do app (sem marcas de terceiros).
 */

// Banners internos do app (fora do componente para evitar re-render)
const INTERNAL_BANNERS = [
  {
    tag: 'Dica',
    headline: 'Configure sua Chave PIX',
    description: 'Receba direto na sua conta bancária via WhatsApp.',
    cta: 'Configurar',
    action: 'settings',
    accent: 'text-emerald-400'
  },
  {
    tag: 'Pro',
    headline: 'Extratos e Recibos em PDF',
    description: 'Comprovantes profissionais com a logo do seu negócio.',
    cta: 'Conhecer',
    action: 'vip',
    accent: 'text-amber-400'
  },
  {
    tag: 'Nuvem',
    headline: 'Backup no Google Drive',
    description: 'Mantenha seus clientes e fiados 100% seguros.',
    cta: 'Salvar',
    action: 'backup',
    accent: 'text-blue-400'
  },
  {
    tag: 'Pro',
    headline: 'Cobrança em Massa no WhatsApp',
    description: 'Cobre todos os clientes atrasados em 1 toque.',
    cta: 'Liberar',
    action: 'vip',
    accent: 'text-purple-400'
  }
];

window.AdMobBanner = function AdMobBanner({ isVip, onOpenVip, onWatchRewarded }) {
  const [adIndex, setAdIndex] = React.useState(0);
  const { Crown, Play } = window.Icons;

  // Alterna o banner a cada 12 segundos
  React.useEffect(() => {
    if (isVip) return;
    const interval = setInterval(() => {
      setAdIndex(prev => (prev + 1) % INTERNAL_BANNERS.length);
    }, 12000);
    return () => clearInterval(interval);
  }, [isVip]);

  // Se o usuário for VIP ou tiver passe de 24h, o banner NUNCA é renderizado
  if (isVip) {
    return null;
  }

  const currentBanner = INTERNAL_BANNERS[adIndex];

  return (
    <div className="fixed bottom-[60px] left-0 right-0 z-30 max-w-md mx-auto px-2 pointer-events-auto">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border border-slate-700/80 shadow-lg p-2.5 backdrop-blur-md">
        
        {/* Cabeçalho do Banner */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-1.5">
            <span className={`text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-slate-800 ${currentBanner.accent} border border-slate-700`}>
              {currentBanner.tag}
            </span>
          </div>

          {/* Botão de Remover Banners via VIP */}
          <button
            onClick={onOpenVip}
            className="flex items-center space-x-1 text-[10px] text-slate-400 hover:text-amber-400 transition-colors"
            title="Remover banners com VIP Pro"
          >
            <Crown size={11} className="text-amber-400" />
            <span className="font-semibold text-amber-400/90">Remover</span>
          </button>
        </div>

        {/* Conteúdo do Banner */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-white truncate">
              {currentBanner.headline}
            </h4>
            <p className="text-[11px] text-slate-300 truncate mt-0.5">
              {currentBanner.description}
            </p>
          </div>

          <div className="flex items-center space-x-1.5 flex-shrink-0">
            <button
              onClick={() => {
                if (currentBanner.action === 'vip') onOpenVip();
              }}
              className="px-2.5 py-1 rounded-lg bg-brand-500 hover:bg-brand-400 text-slate-950 text-[11px] font-bold shadow-sm active:scale-95 transition-all"
            >
              {currentBanner.cta}
            </button>
          </div>
        </div>

        {/* Barra sutil de incentivo para o Teste 24h */}
        {onWatchRewarded && (
          <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
            <span className="text-slate-400 flex items-center gap-1">
              💡 Quer usar tudo liberado hoje?
            </span>
            <button
              onClick={onWatchRewarded}
              className="text-brand-400 hover:text-brand-300 font-bold flex items-center gap-1 hover:underline active:scale-95"
            >
              <Play size={10} className="fill-brand-400" />
              Testar VIP Grátis por 24h
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
