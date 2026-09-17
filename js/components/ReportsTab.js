/**
 * Aba de Relatórios de Caixa & Saúde Financeira
 * Indicadores claros, projeção de recebimentos e ranking de clientes pontuais.
 * Suporte completo a tema Claro e Escuro com transição suave.
 */

window.ReportsTab = function ReportsTab({ clients, isVip, onTriggerPaywall, onSelectClient }) {
  const {
    BarChart3, DollarSign, AlertTriangle, CheckCircle2, Clock,
    Crown, Sparkles, TrendingUp, Users, ChevronRight, ShieldCheck
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
  const upcomingClients = [];

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
          upcomingClients.push({ client: c, amount: parseFloat(s.amount) || 0, dueDate: s.dueDate });
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

  // Inadimplência
  const defaultRate = totalReceivables > 0 
    ? Math.round((totalOverdue / totalReceivables) * 100) 
    : 0;

  // Ticket Médio
  const avgTicket = totalSalesCount > 0 ? (totalSalesEver / totalSalesCount) : 0;

  // Ranking de Bons Pagadores
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
    <div className="space-y-4 pb-24 tab-enter">
      
      {/* Top Banner de Resumo de Caixa */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <BarChart3 size={18} />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Relatório de Caixa & Fiados</h3>
          </div>

          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Atualizado Hoje
          </span>
        </div>

        {/* Grade 2x2 de Indicadores */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/90 transition-colors">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Total a Receber
            </span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono block mt-0.5">
              R$ {totalReceivables.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[9px] text-slate-400 dark:text-slate-500">Capital na rua</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/90 transition-colors">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Total Já Recebido
            </span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono block mt-0.5">
              R$ {totalPaidEver.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[9px] text-slate-400 dark:text-slate-500">Recuperado com sucesso</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-rose-200 dark:border-slate-800/90 transition-colors">
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
              Inadimplência
            </span>
            <span className="text-base font-black text-rose-600 dark:text-rose-400 font-mono block mt-0.5">
              {defaultRate}%
            </span>
            <span className="text-[9px] text-rose-500 dark:text-rose-300/80">
              R$ {totalOverdue.toFixed(2).replace('.', ',')} vencidos
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/90 transition-colors">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Ticket Médio Fiado
            </span>
            <span className="text-base font-black text-slate-800 dark:text-slate-200 font-mono block mt-0.5">
              R$ {avgTicket.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[9px] text-slate-400 dark:text-slate-500">Por venda anotada</span>
          </div>
        </div>
      </div>

      {/* Gráfico Visual de Distribuição da Inadimplência */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm transition-colors">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <TrendingUp size={14} className="text-emerald-600 dark:text-emerald-400" />
            Distribuição dos Valores a Receber
          </h4>
          <span className="text-[10px] text-slate-400">Total: 100%</span>
        </div>

        {/* Barra Proporcional */}
        <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden flex border border-slate-200 dark:border-slate-800 p-0.5">
          {totalReceivables > 0 ? (
            <>
              <div
                title={`Em Dia: R$ ${totalOnTime.toFixed(2)}`}
                className="bg-emerald-500 h-full rounded-l-full transition-all duration-500"
                style={{ width: `${(totalOnTime / totalReceivables) * 100}%` }}
              />
              <div
                title={`Em Atraso: R$ ${totalOverdue.toFixed(2)}`}
                className="bg-rose-500 h-full rounded-r-full transition-all duration-500"
                style={{ width: `${(totalOverdue / totalReceivables) * 100}%` }}
              />
            </>
          ) : (
            <div className="bg-emerald-500 w-full h-full rounded-full" />
          )}
        </div>

        {/* Legenda Explicativa */}
        <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
          <div className="flex items-center space-x-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 transition-colors">
            <div className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">No Prazo / Em Dia</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono text-xs">
                R$ {totalOnTime.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 transition-colors">
            <div className="w-3 h-3 rounded-full bg-rose-500 flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-rose-600 dark:text-rose-300 block truncate">Atrasados</span>
              <span className="font-bold text-rose-600 dark:text-rose-400 font-mono text-xs">
                R$ {totalOverdue.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Previsão de Entradas Acordadas */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm transition-colors">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Clock size={14} className="text-amber-500 dark:text-amber-400" />
            Previsão de Entradas (Vencimentos Acordados)
          </h4>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 transition-colors">
            <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase block">
              Próximos 7 Dias
            </span>
            <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400 font-mono block mt-1">
              R$ {forecast7Days.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 block">Entradas previstas</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 transition-colors">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">
              Próximos 30 Dias
            </span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 font-mono block mt-1">
              R$ {(forecast7Days + forecast30Days).toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 block">Total previsto no mês</span>
          </div>
        </div>
      </div>

      {/* Ranking dos Melhores Pagadores */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm transition-colors">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Crown size={15} className="text-amber-500" />
            Ranking: Clientes Mais Pontuais
          </h4>
          <span className="text-[10px] text-slate-400">Honraram compromissos</span>
        </div>

        {bestPayers.length === 0 ? (
          <div className="text-center py-6 px-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80">
            <Users size={28} className="text-slate-400 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nenhum pagamento registrado ainda</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Conforme os clientes forem abatendo suas dívidas, o ranking de pontualidade aparecerá aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {bestPayers.map((item, idx) => {
              const posBadge = `${idx + 1}º`;
              return (
                <div
                  key={item.client.id}
                  onClick={() => onSelectClient(item.client.id)}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/60 dark:hover:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer transition-colors btn-smooth"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center flex-shrink-0 ${
                      idx === 0 ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30' :
                      idx === 1 ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700' :
                      idx === 2 ? 'bg-amber-700/20 text-amber-700 dark:text-amber-400 border border-amber-700/30' :
                      'bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400'
                    }`}>
                      {posBadge}
                    </span>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                        {item.client.name}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {item.status === 'quitado' ? 'Tudo pago no dia' : 'Pagamentos em dia'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono block">
                      R$ {item.totalPaid.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500">total honrado</span>
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
