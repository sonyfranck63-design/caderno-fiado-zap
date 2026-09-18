/**
 * Aba de Relatórios de Caixa & Saúde Financeira
 * Lapidação Visual Premium, UX moderna e profissional.
 */

window.ReportsTab = function ReportsTab({ clients, isVip, onTriggerPaywall, onSelectClient }) {
  const {
    BarChart3, TrendingUp, Clock, Crown, Users, CheckCircle2, AlertTriangle, ShieldCheck
  } = window.Icons || {};

  // Métricas gerais
  let totalReceivables = 0;
  let totalOverdue = 0;
  let totalOnTime = 0;
  let totalPaidEver = 0;
  let totalSalesEver = 0;
  let totalSalesCount = 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const next7DaysStr = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  const next30DaysStr = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  let forecast7Days = 0;
  let forecast30Days = 0;

  clients.forEach(c => {
    const debt = window.AppState ? window.AppState.computeBalance(c) : 0;
    totalReceivables += debt;

    const sales = (c.transactions || []).filter(t => t.type === 'sale');
    const payments = (c.transactions || []).filter(t => t.type === 'payment');

    totalSalesCount += sales.length;
    sales.forEach(s => {
      totalSalesEver += (parseFloat(s.amount) || 0);
      if (debt > 0 && s.dueDate) {
        if (s.dueDate < todayStr) {
          // Em atraso
        } else if (s.dueDate <= next7DaysStr) {
          forecast7Days += Math.min(debt, parseFloat(s.amount) || 0);
        } else if (s.dueDate <= next30DaysStr) {
          forecast30Days += Math.min(debt, parseFloat(s.amount) || 0);
        }
      }
    });

    payments.forEach(p => {
      totalPaidEver += (parseFloat(p.amount) || 0);
    });

    const status = window.AppState ? window.AppState.getClientStatus(c) : 'em_dia';
    if (status === 'atrasado') {
      totalOverdue += debt;
    } else if (status === 'em_dia') {
      totalOnTime += debt;
    }
  });

  const defaultRate = totalReceivables > 0 
    ? Math.round((totalOverdue / totalReceivables) * 100) 
    : 0;

  const avgTicket = totalSalesCount > 0 ? (totalSalesEver / totalSalesCount) : 0;

  const bestPayers = [...clients]
    .map(c => {
      const paid = (c.transactions || [])
        .filter(t => t.type === 'payment')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      const status = window.AppState ? window.AppState.getClientStatus(c) : 'em_dia';
      return { client: c, totalPaid: paid, status };
    })
    .filter(item => item.totalPaid > 0)
    .sort((a, b) => b.totalPaid - a.totalPaid)
    .slice(0, 5);

  return (
    <div className="space-y-5 pb-28 tab-enter px-1">
      
      {/* Resumo Financeiro Premium */}
      <div className="relative rounded-[24px] overflow-hidden shadow-2xl border border-slate-200/50 dark:border-slate-800/80">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 opacity-95"></div>
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-emerald-400 opacity-20 blur-3xl mix-blend-screen pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-emerald-800 opacity-40 blur-3xl mix-blend-multiply pointer-events-none"></div>
        
        <div className="relative p-5 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-[10px] bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                <BarChart3 size={16} strokeWidth={2.5} className="text-white" />
              </div>
              <span className="font-bold text-sm tracking-wide text-emerald-50">Resumo Financeiro</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
              Hoje
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-emerald-200/80 font-medium uppercase tracking-wider">Capital na Rua (A Receber)</span>
            <div className="flex items-end gap-2">
              <span className="text-sm font-bold text-emerald-300">R$</span>
              <span className="text-4xl font-black tracking-tight leading-none drop-shadow-sm">
                {totalReceivables.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 shadow-inner">
              <span className="text-[10px] text-emerald-200 uppercase tracking-widest font-semibold block mb-1">Recebido</span>
              <span className="font-mono text-lg font-bold">R$ {totalPaidEver.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 shadow-inner relative overflow-hidden">
              <span className="text-[10px] text-emerald-200 uppercase tracking-widest font-semibold block mb-1">Ticket Médio</span>
              <span className="font-mono text-lg font-bold">R$ {avgTicket.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico Visual de Distribuição da Inadimplência */}
      <div className="p-5 rounded-[24px] bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800 relative overflow-hidden transition-colors">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/[0.03] dark:bg-rose-500/[0.05] rounded-bl-full pointer-events-none"></div>
        
        <div className="flex items-center justify-between mb-4 relative z-10">
          <h4 className="text-[13px] font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 tracking-tight">
            <TrendingUp size={16} className="text-emerald-500" />
            Saúde do Caixa
          </h4>
          <span className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-md">
            {defaultRate}% Atraso
          </span>
        </div>

        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner relative z-10">
          {totalReceivables > 0 ? (
            <>
              <div
                className="bg-emerald-500 transition-all duration-700 ease-out relative"
                style={{ width: `${(totalOnTime / totalReceivables) * 100}%` }}
              >
                <div className="absolute inset-0 bg-white/20"></div>
              </div>
              <div
                className="bg-rose-500 transition-all duration-700 ease-out relative"
                style={{ width: `${(totalOverdue / totalReceivables) * 100}%` }}
              ></div>
            </>
          ) : (
            <div className="bg-emerald-500/50 w-full h-full rounded-full" />
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 text-xs relative z-10">
          <div className="flex flex-col space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" /> No Prazo
            </span>
            <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
              R$ {totalOnTime.toFixed(2).replace('.', ',')}
            </span>
          </div>

          <div className="flex flex-col space-y-1">
            <span className="text-[10px] font-bold text-rose-500/80 uppercase tracking-wider flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-rose-500" /> Atrasados
            </span>
            <span className="font-bold text-rose-600 dark:text-rose-400 font-mono text-sm">
              R$ {totalOverdue.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>
      </div>

      {/* Previsão de Entradas Acordadas */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-[20px] bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-900/5 border border-amber-200/50 dark:border-amber-500/20 shadow-sm relative overflow-hidden transition-colors group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-amber-200/50 dark:bg-amber-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest block mb-1">
            Próx. 7 Dias
          </span>
          <span className="text-base font-black text-slate-800 dark:text-slate-100 font-mono block mb-1">
            R$ {forecast7Days.toFixed(2).replace('.', ',')}
          </span>
          <span className="text-[9px] text-amber-700/60 dark:text-amber-500/60 font-medium">Entradas previstas</span>
        </div>

        <div className="p-4 rounded-[20px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-colors">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
            Próx. 30 Dias
          </span>
          <span className="text-base font-black text-slate-800 dark:text-slate-100 font-mono block mb-1">
            R$ {(forecast7Days + forecast30Days).toFixed(2).replace('.', ',')}
          </span>
          <span className="text-[9px] text-slate-400 font-medium">Total previsto no mês</span>
        </div>
      </div>

      {/* Ranking dos Melhores Pagadores */}
      <div className="p-5 rounded-[24px] bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-[13px] font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 tracking-tight">
            <Crown size={16} className="text-amber-500" />
            Top 5 Clientes Fiéis
          </h4>
        </div>

        {bestPayers.length === 0 ? (
          <div className="text-center py-8 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-300 dark:border-slate-700">
            <Users size={28} className="text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Sem pagamentos ainda</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bestPayers.map((item, idx) => {
              const posBadge = `${idx + 1}º`;
              return (
                <div
                  key={item.client.id}
                  onClick={() => onSelectClient(item.client.id)}
                  className="group relative flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 hover:bg-white dark:hover:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-emerald-500/30 hover:shadow-md cursor-pointer transition-all duration-300"
                >
                  <div className="flex items-center space-x-3 min-w-0 z-10">
                    <span className={`w-8 h-8 rounded-[10px] text-[11px] font-black flex items-center justify-center flex-shrink-0 shadow-sm ${
                      idx === 0 ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 border border-amber-400' :
                      idx === 1 ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800 border border-slate-300' :
                      idx === 2 ? 'bg-gradient-to-br from-amber-700 to-amber-900 text-amber-100 border border-amber-800' :
                      'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}>
                      {posBadge}
                    </span>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-slate-900 dark:text-white block truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {item.client.name}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        {item.status === 'quitado' ? <CheckCircle2 size={10} className="text-emerald-500"/> : null}
                        {item.status === 'quitado' ? 'Tudo pago' : 'Pagamentos em dia'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 z-10">
                    <span className="text-sm font-black text-slate-900 dark:text-white font-mono block tracking-tight">
                      R$ {item.totalPaid.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider">Pago</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

