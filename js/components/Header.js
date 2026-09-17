/**
 * Componente de Cabeçalho (Top Bar)
 * Exibe nome do estabelecimento, badge dinâmico de status VIP/Passe e atalhos rápidos.
 * Suporte completo a tema Claro e Escuro com transição suave.
 */

window.Header = function Header({ vipInfo, remainingTime, onOpenSettings, onOpenVip, isDark, onToggleTheme, shopSettings, onOpenInstall }) {
  const { Crown, Sparkles, Settings, Moon, Sun, Clock, Download } = window.Icons;

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 py-3 transition-colors duration-200">
      <div className="flex items-center justify-between">
        
        {/* Lado Esquerdo: Identidade do App e Estabelecimento */}
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
              <path d="M6 6h10"/>
              <path d="M6 10h7"/>
              <polygon points="17 12 14 17 17 17 16 21 21 15 18 15 19 12" fill="#facc15" stroke="none"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                CadernoFiado <span className="text-emerald-600 dark:text-brand-400 font-black">Zap</span>
              </h1>
            </div>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold truncate max-w-[140px] sm:max-w-[200px]">
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
              className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-xs font-semibold shadow-sm hover:opacity-90 transition-opacity btn-smooth"
              title="Assinante VIP Pro Permanente"
            >
              <Crown size={13} className="text-amber-500 dark:text-amber-400" />
              <span>VIP PRO</span>
            </button>
          ) : vipInfo.isPassActive ? (
            <button
              onClick={onOpenVip}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold shadow-sm hover:opacity-90 transition-opacity btn-smooth"
              title="Passe VIP Temporário Ativo"
            >
              <Clock size={12} className="text-emerald-600 dark:text-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold">{remainingTime || 'VIP 24h'}</span>
            </button>
          ) : (
            <button
              onClick={onOpenVip}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors btn-smooth"
            >
              <Sparkles size={12} className="text-amber-500 dark:text-amber-400" />
              <span className="hidden sm:inline">Virar</span> <span>VIP</span>
            </button>
          )}

          {/* Botão de Instalar App */}
          <button
            onClick={onOpenInstall}
            className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 transition-colors flex items-center gap-1.5 text-xs font-semibold btn-smooth"
            aria-label="Instalar Aplicativo no Celular"
            title="Instalar App no Celular / Computador"
          >
            <Download size={16} />
            <span className="hidden md:inline">Instalar</span>
          </button>

          {/* Alternador de Tema Escuro / Claro */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-300 dark:border-slate-800 transition-all btn-smooth"
            aria-label="Alternar Tema"
            title="Alternar Modo Escuro / Claro"
          >
            {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-slate-700" />}
          </button>

          {/* Botão de Configurações */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-300 dark:border-slate-800 transition-all btn-smooth"
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
