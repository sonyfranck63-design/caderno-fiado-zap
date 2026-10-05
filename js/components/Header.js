/**
 * Componente de Cabeçalho: Identidade do Estabelecimento e Ações Rápidas
 * Visual premium, ergonômico e responsivo (adaptado para qualquer modelo de aparelho).
 */

window.Header = function Header({ vipInfo, remainingTime, onOpenSettings, onOpenBackup, onOpenVip, isDark, onToggleTheme, shopSettings, onOpenInstall }) {
  const { Crown, Settings, Moon, Sun, Clock, Cloud } = window.Icons || {};

  return (
    <header className="sticky top-0 z-30 glass-panel px-3 sm:px-4 py-2.5 sm:py-3 transition-colors duration-200">
      <div className="flex items-center justify-between gap-2 max-w-md mx-auto">
        
        {/* Lado Esquerdo: Identidade do App e Estabelecimento com largura adaptativa */}
        <div className="flex items-center space-x-2.5 min-w-0 flex-1 mr-1">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
              <path d="M6 6h10"/>
              <path d="M6 10h7"/>
              <polygon points="17 12 14 17 17 17 16 21 21 15 18 15 19 12" fill="#34d399" stroke="none"/>
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white leading-tight truncate" title={shopSettings?.shopName || 'CadernoFiado Zap'}>
              {shopSettings?.shopName || 'Meu Caderno'}
            </h1>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold tracking-wide truncate mt-0.5">
              Caderno Fiado
            </p>
          </div>
        </div>

        {/* Lado Direito: Ações Rápidas Confortáveis e Fáceis de Tocar */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          
          {/* Badge de Status VIP */}
          {vipInfo.isVipPermanent ? (
            <button
              onClick={onOpenVip}
              className="h-9 px-2.5 sm:px-3 rounded-xl flex items-center space-x-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 border border-emerald-500/20 transition-all btn-smooth shadow-sm"
              title="Plano VIP Pro Ativo"
            >
              <Crown size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>PRO</span>
            </button>
          ) : vipInfo.isPassActive ? (
            <button
              onClick={onOpenVip}
              className="h-9 px-2.5 sm:px-3 rounded-xl flex items-center space-x-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 border border-emerald-500/20 transition-all btn-smooth shadow-sm"
              title="Passe 24h Ativo"
            >
              <Clock size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span className="font-bold">{remainingTime || 'VIP 24h'}</span>
            </button>
          ) : (
            <button
              onClick={onOpenVip}
              className="h-9 px-2.5 sm:px-3 rounded-xl flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all btn-smooth border border-slate-200/50 dark:border-slate-700/50"
            >
              <Crown size={14} className="text-amber-500" />
              <span>VIP</span>
            </button>
          )}

          {/* Alternador de Tema Escuro / Claro */}
          <button
            onClick={onToggleTheme}
            className="header-action-btn text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80 btn-smooth"
            aria-label="Alternar Tema"
            title="Alternar Tema"
          >
            {isDark ? <Sun size={19} className="text-amber-400" /> : <Moon size={19} className="text-slate-600" />}
          </button>

          {/* Botão de Nuvem (Backup & Google Drive) */}
          <button
            onClick={onOpenBackup}
            className="header-action-btn text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 btn-smooth relative"
            aria-label="Backup de Segurança"
            title="Backup de Segurança & Google Drive"
          >
            <Cloud size={19} className={window.GoogleDriveService && window.GoogleDriveService.isConnected() ? "text-emerald-500" : ""} />
            {window.GoogleDriveService && window.GoogleDriveService.isConnected() && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 animate-pulse"></span>
            )}
          </button>

          {/* Botão de Configurações */}
          <button
            onClick={onOpenSettings}
            className="header-action-btn text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80 btn-smooth"
            aria-label="Configurações do Negócio"
            title="Configurações"
          >
            <Settings size={19} />
          </button>

        </div>

      </div>
    </header>
  );
};

