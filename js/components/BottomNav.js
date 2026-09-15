/**
 * Barra de Navegação Inferior Estilo Android / Mobile App Nativo
 * 4 Atalhos Fixos: 'Clientes & Fiados', 'Novo Registro', 'Relatórios de Caixa' e 'Plano VIP Pro'
 */

window.BottomNav = function BottomNav({ activeTab, onSelectTab, overdueCount, isVip }) {
  const { Users, PlusCircle, BarChart3, Crown } = window.Icons;

  const tabs = [
    {
      id: 'clients',
      label: 'Clientes & Fiados',
      icon: Users,
      badge: overdueCount > 0 ? overdueCount : null,
      badgeColor: 'bg-rose-500'
    },
    {
      id: 'new_record',
      label: 'Novo Registro',
      icon: PlusCircle,
      isPrimary: true
    },
    {
      id: 'reports',
      label: 'Relatórios Caixa',
      icon: BarChart3
    },
    {
      id: 'vip',
      label: 'Plano VIP Pro',
      icon: Crown,
      badge: isVip ? 'ATIVO' : 'PRO',
      badgeColor: isVip ? 'bg-emerald-500' : 'bg-amber-500'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 dark:bg-slate-950/95 light:bg-white/95 backdrop-blur-lg border-t border-slate-800/90 max-w-md mx-auto transition-colors duration-200">
      <div className="flex items-center justify-around px-2 py-1.5 safe-area-bottom">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          if (tab.isPrimary) {
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className="flex flex-col items-center justify-center -mt-5 group focus:outline-none"
                aria-label={tab.label}
              >
                <div className={`w-13 h-13 p-3 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 group-active:scale-95 ${
                  isActive
                    ? 'bg-gradient-to-tr from-brand-600 to-emerald-400 text-slate-950 shadow-glow-emerald'
                    : 'bg-brand-500 hover:bg-brand-400 text-slate-950 shadow-brand-500/30'
                }`}>
                  <Icon size={24} strokeWidth={2.4} />
                </div>
                <span className={`text-[10px] font-semibold mt-1 tracking-tight ${
                  isActive ? 'text-brand-400' : 'text-slate-400 group-hover:text-slate-200'
                }`}>
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-200 focus:outline-none ${
                isActive 
                  ? 'text-brand-400 font-semibold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Ícone com badge se houver */}
              <div className="relative">
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'scale-105 transition-transform' : ''} />
                {tab.badge && (
                  <span className={`absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold text-white shadow-sm ${tab.badgeColor}`}>
                    {tab.badge}
                  </span>
                )}
              </div>

              {/* Rótulo */}
              <span className={`text-[10px] tracking-tight mt-1 ${isActive ? 'text-brand-400 font-bold' : 'text-slate-400'}`}>
                {tab.label}
              </span>

              {/* Indicador de aba ativa */}
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-0.5 shadow-glow-emerald"></div>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
