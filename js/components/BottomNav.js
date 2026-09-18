/**
 * Barra de Navegação Inferior: Design Nativo e Limpo (Estilo Nubank / iOS)
 * 4 Atalhos Organizados: Clientes, Nova Venda, Relatórios e Assinatura VIP
 */

window.BottomNav = function BottomNav({ activeTab, onSelectTab, overdueCount, isVip }) {
  const { Users, PlusCircle, BarChart3, Crown } = window.Icons || {};

  const tabs = [
    {
      id: 'clients',
      label: 'Clientes',
      icon: Users,
      badge: overdueCount > 0 ? overdueCount : null,
      badgeColor: 'bg-rose-500 text-white'
    },
    {
      id: 'new_record',
      label: 'Nova Venda',
      icon: PlusCircle
    },
    {
      id: 'reports',
      label: 'Relatórios',
      icon: BarChart3
    },
    {
      id: 'vip',
      label: isVip ? 'VIP Ativo' : 'Plano VIP',
      icon: Crown,
      badge: isVip ? 'PRO' : null,
      badgeColor: 'bg-emerald-600 text-white'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-bottom-nav max-w-md mx-auto transition-colors duration-200">
      <div className="grid grid-cols-4 px-1 py-2 safe-area-bottom">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 focus:outline-none btn-smooth ${
                isActive 
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold' 
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={isActive ? 2.3 : 1.8} />
                {tab.badge && (
                  <span className={`absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center leading-none ${tab.badgeColor}`}>
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className={`text-[10px] tracking-tight mt-1 truncate ${isActive ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 font-medium'}`}>
                {tab.label}
              </span>

              {isActive && (
                <div className="w-1 h-1 rounded-full bg-emerald-600 dark:bg-emerald-400 mt-0.5"></div>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

