/**
 * Componente de Cabeçalho: Identidade do Estabelecimento e Ações Rápidas
 * Visual limpo e despoluído inspirado em interfaces nativas.
 */

window.Header = function Header({ vipInfo, remainingTime, onOpenSettings, onOpenBackup, onOpenVip, isDark, onToggleTheme, shopSettings, onOpenInstall }) {
  const { Crown, Settings, Moon, Sun, Clock, Cloud } = window.Icons || {};

  return (
    <header className="sticky top-0 z-30 glass-panel px-3 sm:px-4 py-2.5 sm:py-3 transition-colors duration-200">
      <div className="flex items-center justify-between gap-1">
        
        {/* Lado Esquerdo: Identidade do App e Estabelecimento com largura máxima */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0 flex-1 mr-1">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
              <path d="M6 6h10"/>
              <path d="M6 10h7"/>
              <polygon points="17 12 14 17 17 17 16 21 21 15 18 15 19 12" fill="#34d399" stroke="none"/>
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-extrabold text-xs sm:text-sm tracking-tight text-slate-900 dark:text-white leading-tight truncate" title={shopSettings?.shopName || 'CadernoFiado Zap'}>
              {shopSettings?.shopName || 'Meu Caderno'}
            </h1>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold tracking-wide truncate">
              Caderno Fiado
            </p>
          </div>
        </div>

        {/* Lado Direito: Ações Rápidas Compactas */}
        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
          
          {/* Badge de Status VIP */}
          {vipInfo.isVipPermanent ? (
            <button
              onClick={onOpenVip}
              className="flex items-center space-x-1 px-1.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] sm:text-xs font-semibold hover:bg-emerald-500/20 transition-colors btn-smooth"
              title="Plano VIP Pro Ativo"
            >
              <Crown size={11} className="text-emerald-600 dark:text-emerald-400" />
              <span>PRO</span>
            </button>
          ) : vipInfo.isPassActive ? (
            <button
              onClick={onOpenVip}
              className="flex items-center space-x-1 px-1.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] sm:text-xs font-semibold hover:bg-emerald-500/20 transition-colors btn-smooth"
              title="Passe 24h Ativo"
            >
              <Clock size={11} className="text-emerald-600 dark:text-emerald-400" />
              <span className="text-[10px] font-bold">{remainingTime || 'VIP 24h'}</span>
            </button>
          ) : (
            <button
              onClick={onOpenVip}
              className="flex items-center space-x-1 px-1.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] sm:text-xs font-medium transition-colors btn-smooth"
            >
              <Crown size={11} className="text-amber-500" />
              <span>VIP</span>
            </button>
          )}

          {/* Alternador de Tema Escuro / Claro */}
          <button
            onClick={onToggleTheme}
            className="p-1 sm:p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors btn-smooth"
            aria-label="Alternar Tema"
            title="Alternar Tema"
          >
            {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-600" />}
          </button>

          {/* Botão de Nuvem (Backup & Google Drive) */}
          <button
            onClick={onOpenBackup}
            className="p-1 sm:p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 transition-colors btn-smooth relative"
            aria-label="Backup de Segurança"
            title="Backup de Segurança & Google Drive"
          >
            <Cloud size={16} className={window.GoogleDriveService && window.GoogleDriveService.isConnected() ? "text-emerald-500" : ""} />
            {window.GoogleDriveService && window.GoogleDriveService.isConnected() && (
              <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 animate-pulse"></span>
            )}
          </button>

          {/* Botão de Configurações */}
          <button
            onClick={onOpenSettings}
            className="p-1 sm:p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors btn-smooth"
            aria-label="Configurações do Negócio"
            title="Configurações"
          >
            <Settings size={16} />
          </button>

        </div>

      </div>
    </header>
  );
};

