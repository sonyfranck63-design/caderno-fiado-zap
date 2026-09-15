/**
 * Componente de Cabeçalho (Top Bar)
 * Exibe nome do estabelecimento, badge dinâmico de status VIP/Passe e atalhos rápidos.
 */

window.Header = function Header({ vipInfo, remainingTime, onOpenSettings, onOpenVip, isDark, onToggleTheme, shopSettings, onOpenInstall }) {
  const { Crown, Sparkles, Settings, Moon, Sun, Clock, Download } = window.Icons;

  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 dark:bg-slate-950/90 light:bg-white/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 transition-colors duration-200">
      <div className="flex items-center justify-between">
        
        {/* Lado Esquerdo: Identidade do App e Estabelecimento */}
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 p-0.5 shadow-glow-emerald flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <span className="text-xl">📒</span>
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1">
                CadernoFiado <span className="text-brand-400 font-black">Zap</span>
              </h1>
            </div>
            <p className="text-[11px] text-emerald-400/90 font-semibold truncate max-w-[140px] sm:max-w-[200px]">
              {shopSettings?.shopName || 'Meu Estabelecimento'}
            </p>
          </div>
        </div>

        {/* Lado Direito: Badge VIP + Configurações + Tema */}
        <div className="flex items-center space-x-2">
          
          {/* Badge de Status VIP Dinâmico */}
          {vipInfo.isVipPermanent ? (
            <button
              onClick={onOpenVip}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-gold-500/20 border border-amber-500/50 text-amber-300 text-xs font-semibold shadow-glow-gold hover:opacity-90 transition-opacity"
              title="Assinante VIP Pro Permanente"
            >
              <Crown size={13} className="text-amber-400" />
              <span>VIP PRO</span>
            </button>
          ) : vipInfo.isPassActive ? (
            <button
              onClick={onOpenVip}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-semibold shadow-glow-emerald hover:opacity-90 transition-opacity"
              title="Passe VIP Temporário Ativo"
            >
              <Clock size={12} className="text-emerald-400 animate-pulse" />
              <span className="text-[11px]">{remainingTime || 'VIP 24h'}</span>
            </button>
          ) : (
            <button
              onClick={onOpenVip}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              <Sparkles size={12} className="text-amber-400" />
              <span className="hidden sm:inline">Virar</span> <span>VIP</span>
            </button>
          )}

          {/* Botão de Instalar App */}
          <button
            onClick={onOpenInstall}
            className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            aria-label="Instalar Aplicativo no Celular"
            title="Instalar App no Celular / Computador"
          >
            <Download size={16} />
            <span className="hidden md:inline">Instalar</span>
          </button>

          {/* Alternador de Tema Escuro / Claro */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
            aria-label="Alternar Tema"
            title="Alternar Modo Escuro / Claro"
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Botão de Configurações */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
            aria-label="Configurações do Negócio"
            title="Configurações & Backup"
          >
            <Settings size={17} />
          </button>

        </div>

      </div>
    </header>
  );
};
