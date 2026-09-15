/**
 * Componente de Banner AdMob Adaptativo Simulado
 * Exibido no rodapé apenas para usuários do Plano Gratuito.
 * Desaparece 100% no modo VIP ou com Passe 24h ativo.
 */

window.AdMobBanner = function AdMobBanner({ isVip, onOpenVip, onWatchRewarded }) {
  const [adIndex, setAdIndex] = React.useState(0);
  const { Crown, Play, X } = window.Icons;

  // Anúncios realistas voltados para o público de autônomos e pequenos comerciantes
  const ads = [
    {
      sponsor: 'Stone & Ton',
      headline: 'Maquininha com Taxa Zero no 1º Mês',
      description: 'Receba na hora na sua conta e venda em até 18x.',
      cta: 'Pedir Maquininha',
      tag: 'Patrocinado',
      accent: 'from-emerald-950/60 to-slate-900 border-emerald-600/40 text-emerald-400'
    },
    {
      sponsor: 'Distribuidora Cosméticos Brasil',
      headline: 'Atacado de Esmaltes e Perfumes com 50% OFF',
      description: 'Preços de fábrica direto para manicures e revendedoras.',
      cta: 'Ver Catálogo',
      tag: 'Oferta MEI',
      accent: 'from-purple-950/60 to-slate-900 border-purple-600/40 text-purple-400'
    },
    {
      sponsor: 'Banco Inter Empresas',
      headline: 'Conta PJ 100% Gratuita com PIX Ilimitado',
      description: 'Emita boletos sem taxa e gerencie seu fluxo de caixa.',
      cta: 'Abrir Conta',
      tag: 'Finanças',
      accent: 'from-amber-950/60 to-slate-900 border-amber-600/40 text-amber-400'
    }
  ];

  // Alterna o anúncio a cada 15 segundos
  React.useEffect(() => {
    if (isVip) return;
    const interval = setInterval(() => {
      setAdIndex(prev => (prev + 1) % ads.length);
    }, 15000);
    return () => clearInterval(interval);
  }, [isVip, ads.length]);

  // Se o usuário for VIP ou tiver passe de 24h, o banner NUNCA é renderizado
  if (isVip) {
    return null;
  }

  const currentAd = ads[adIndex];

  return (
    <div className="fixed bottom-[60px] left-0 right-0 z-30 max-w-md mx-auto px-2 pointer-events-auto">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border border-slate-700/80 shadow-lg p-2.5 backdrop-blur-md">
        
        {/* Cabeçalho do Banner com Selo AdMob */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-1.5">
            <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              AdMob • {currentAd.tag}
            </span>
            <span className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">
              {currentAd.sponsor}
            </span>
          </div>

          {/* Botão de Remover Anúncios via VIP */}
          <button
            onClick={onOpenVip}
            className="flex items-center space-x-1 text-[10px] text-slate-400 hover:text-amber-400 transition-colors"
            title="Remover anúncios com VIP Pro"
          >
            <Crown size={11} className="text-amber-400" />
            <span className="font-semibold text-amber-400/90">Remover Anúncios</span>
          </button>
        </div>

        {/* Conteúdo do Anúncio */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-white truncate">
              {currentAd.headline}
            </h4>
            <p className="text-[11px] text-slate-300 truncate mt-0.5">
              {currentAd.description}
            </p>
          </div>

          <div className="flex items-center space-x-1.5 flex-shrink-0">
            {/* Botão de Ação do Anúncio */}
            <button
              onClick={() => alert(`Simulação de clique no anúncio: ${currentAd.sponsor} - Redirecionando para oferta.`)}
              className="px-2.5 py-1 rounded-lg bg-brand-500 hover:bg-brand-400 text-slate-950 text-[11px] font-bold shadow-sm active:scale-95 transition-all"
            >
              {currentAd.cta}
            </button>
          </div>
        </div>

        {/* Barra sutil de incentivo para o Vídeo Premiado */}
        <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
          <span className="text-slate-400 flex items-center gap-1">
            💡 Quer usar sem anúncios hoje?
          </span>
          <button
            onClick={onWatchRewarded}
            className="text-brand-400 hover:text-brand-300 font-bold flex items-center gap-1 hover:underline active:scale-95"
          >
            <Play size={10} className="fill-brand-400" />
            Assistir vídeo (VIP 24h Grátis)
          </button>
        </div>

      </div>
    </div>
  );
};
