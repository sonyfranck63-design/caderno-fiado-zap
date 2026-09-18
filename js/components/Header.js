/**
 * Componente de Cabeçalho: Identidade do Estabelecimento e Ações Rápidas
 * Visual limpo e despoluído inspirado em interfaces nativas.
 */

window.Header = function Header({ vipInfo, remainingTime, onOpenSettings, onOpenBackup, onOpenVip, isDark, onToggleTheme, shopSettings, onOpenInstall }) {
  const { Crown, Settings, Moon, Sun, Clock, Cloud } = window.Icons || {};

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#0e141f]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/70 px-4 py-3 transition-colors duration-200">
      <div className="flex items-center justify-between">
        
        {/* Lado Esquerdo: Identidade do App e Estabelecimento */}
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
              <path d="M6 6h10"/>
              <path d="M6 10h7"/>
              <polygon points="17 12 14 17 17 17 16 21 21 15 18 15 19 12" fill="#34d399" stroke="none"/>
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-tight truncate">
              {shopSettings?.shopName || 'CadernoFiado Zap'}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Gestão de Fiados & Cobrança
            </p>
          </div>
        </div>

        {/* Lado Direito: Badge VIP + Alternador de Tema + Configurações */}
        <div className="flex items-center space-x-1.5 flex-shrink-0">
          
          {/* Badge de Status VIP */}
          {vipInfo.isVipPermanent ? (
            <button
              onClick={onOpenVip}
              className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors btn-smooth"
              title="Plano VIP Pro Ativo"
            >
              <Crown size={12} className="text-emerald-600 dark:text-emerald-400" />
              <span>PRO</span>
            </button>
          ) : vipInfo.isPassActive ? (
            <button
              onClick={onOpenVip}
              className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors btn-smooth"
              title="Passe 24h Ativo"
            >
              <Clock size={11} className="text-emerald-600 dark:text-emerald-400" />
              <span className="text-[10px] font-bold">{remainingTime || 'VIP 24h'}</span>
            </button>
          ) : (
            <button
              onClick={onOpenVip}
              className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors btn-smooth"
            >
              <Crown size={12} className="text-amber-500" />
              <span>VIP</span>
            </button>
          )}

          {/* Alternador de Tema Escuro / Claro */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors btn-smooth"
            aria-label="Alternar Tema"
            title="Alternar Tema"
          >
            {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-slate-600" />}
          </button>

          {/* Botão de Nuvem (Backup) */}
          <button
            onClick={onOpenBackup}
            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 transition-colors btn-smooth"
            aria-label="Backup de Segurança"
            title="Backup de Segurança"
          >
            <Cloud size={17} />
          </button>

          {/* Botão de Configurações */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors btn-smooth"
            aria-label="Configurações do Negócio"
            title="Configurações"
          >
            <Settings size={17} />
          </button>

        </div>

      </div>
    </header>
  );
};

