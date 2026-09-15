/**
 * Aba Principal: Clientes & Fiados
 * Resumo financeiro rápido, busca instantânea, filtros por status e listagem interativa.
 */

window.ClientsTab = function ClientsTab({
  clients,
  onSelectClient,
  onOpenNewRecord,
  onOpenWhatsApp,
  isVip
}) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('todos'); // 'todos' | 'atrasado' | 'em_dia' | 'quitado'
  const [sortBy, setSortBy] = React.useState('debt_desc'); // 'debt_desc' | 'name_asc' | 'recent'

  const {
    Search, PlusCircle, MessageCircle, AlertTriangle, CheckCircle2,
    Clock, DollarSign, Users, ChevronRight, Sparkles
  } = window.Icons;

  // Métricas rápidas no topo
  const totalReceivables = clients.reduce((acc, c) => acc + window.AppState.computeBalance(c), 0);
  const overdueClientsCount = clients.filter(c => window.AppState.getClientStatus(c) === 'atrasado').length;
  const inDebtClientsCount = clients.filter(c => window.AppState.computeBalance(c) > 0.01).length;

  // Filtragem
  const filteredClients = clients.filter(client => {
    // Busca textual
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.phone && client.phone.includes(searchTerm.replace(/\D/g, '')));

    if (!matchesSearch) return false;

    // Filtro por status
    const status = window.AppState.getClientStatus(client);
    if (statusFilter === 'todos') return true;
    return status === statusFilter;
  });

  // Ordenação
  const sortedClients = [...filteredClients].sort((a, b) => {
    const debtA = window.AppState.computeBalance(a);
    const debtB = window.AppState.computeBalance(b);

    if (sortBy === 'debt_desc') {
      return debtB - debtA;
    }
    if (sortBy === 'name_asc') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'recent') {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
    return 0;
  });

  return (
    <div className="space-y-4 pb-24 animate-fadeIn">
      
      {/* 3 Cards de Resumo Financeiro no Topo */}
      <div className="grid grid-cols-3 gap-2 px-1">
        
        {/* Total a Receber */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-sm">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            A Receber
          </span>
          <span className="text-base font-extrabold text-brand-400 font-mono block mt-0.5">
            R$ {totalReceivables.toFixed(2).replace('.', ',')}
          </span>
          <span className="text-[9px] text-slate-400">
            {inDebtClientsCount} com saldo
          </span>
        </div>

        {/* Em Atraso */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-rose-950/40 to-slate-950 border border-rose-900/30 shadow-sm">
          <span className="text-[10px] font-semibold text-rose-300 uppercase tracking-wider block flex items-center gap-1">
            <AlertTriangle size={11} /> Atrasados
          </span>
          <span className="text-base font-extrabold text-rose-400 font-mono block mt-0.5">
            {overdueClientsCount} {overdueClientsCount === 1 ? 'cliente' : 'clientes'}
          </span>
          <span className="text-[9px] text-rose-300/80">
            Ação necessária
          </span>
        </div>

        {/* Total Cadastrado */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-sm">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
            <Users size={11} /> Carteira
          </span>
          <span className="text-base font-extrabold text-slate-200 font-mono block mt-0.5">
            {clients.length} {clients.length === 1 ? 'cliente' : 'clientes'}
          </span>
          <span className="text-[9px] text-slate-400">
            Base ativa
          </span>
        </div>

      </div>

      {/* Barra de Pesquisa e Filtros */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou WhatsApp..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 shadow-inner"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtros em Pílula (Horizontal Scroll) */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setStatusFilter('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === 'todos'
                ? 'bg-brand-500 text-slate-950 shadow-glow-emerald'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            Todos ({clients.length})
          </button>

          <button
            onClick={() => setStatusFilter('atrasado')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
              statusFilter === 'atrasado'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'bg-slate-900 text-rose-400/90 border border-slate-800 hover:bg-slate-850'
            }`}
          >
            <AlertTriangle size={12} /> Atrasados ({overdueClientsCount})
          </button>

          <button
            onClick={() => setStatusFilter('em_dia')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === 'em_dia'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-amber-400/90 border border-slate-800 hover:bg-slate-850'
            }`}
          >
            Em Aberto
          </button>

          <button
            onClick={() => setStatusFilter('quitado')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
              statusFilter === 'quitado'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-emerald-400/90 border border-slate-800 hover:bg-slate-850'
            }`}
          >
            <CheckCircle2 size={12} /> Quitados
          </button>
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="space-y-2.5">
        {sortedClients.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-3xl bg-slate-900/40 border border-dashed border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Users size={24} />
            </div>
            <h3 className="text-sm font-bold text-white">
              {searchTerm ? 'Nenhum cliente encontrado' : clients.length === 0 ? 'Seu Caderno está pronto!' : 'Nenhum cliente nessa categoria'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              {searchTerm 
                ? 'Não encontramos nenhum cliente correspondente à sua busca.' 
                : clients.length === 0
                  ? 'Cadastre seu primeiro cliente ou anote uma venda fiada para começar a usar o CadernoFiado.'
                  : 'Você não possui clientes com esse filtro no momento.'}
            </p>
            <button
              onClick={onOpenNewRecord}
              className="mt-4 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 text-xs font-bold shadow-glow-emerald inline-flex items-center space-x-1.5 transition-transform active:scale-95"
            >
              <PlusCircle size={16} />
              <span>{clients.length === 0 ? 'Adicionar Primeiro Cliente' : 'Registrar Novo Fiado'}</span>
            </button>
          </div>
        ) : (
          sortedClients.map(client => {
            const debt = window.AppState.computeBalance(client);
            const status = window.AppState.getClientStatus(client);
            const formattedDebt = `R$ ${debt.toFixed(2).replace('.', ',')}`;

            // Pega o primeiro nome para a foto/avatar
            const initials = client.name
              .split(' ')
              .map(n => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            // Pega a data da última compra ou vencimento
            const openSales = (client.transactions || []).filter(t => t.type === 'sale');
            const nearestDue = openSales.length > 0 && openSales[0].dueDate 
              ? openSales[0].dueDate.split('-').reverse().join('/') 
              : null;

            return (
              <div
                key={client.id}
                onClick={() => onSelectClient(client.id)}
                className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-850/80 border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer shadow-sm group active:scale-[0.99]"
              >
                <div className="flex items-center justify-between gap-3">
                  
                  {/* Avatar com Iniciais e Informações */}
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm ${
                      status === 'atrasado'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : status === 'quitado'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                    }`}>
                      {initials}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-brand-300 transition-colors">
                          {client.name}
                        </h4>
                        {status === 'quitado' && (
                          <span className="text-[10px] text-emerald-400">⭐</span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {client.phone ? `Zap: ${client.phone}` : 'Sem WhatsApp'}
                      </p>

                      {status === 'atrasado' && nearestDue && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-400 mt-0.5">
                          <AlertTriangle size={10} /> Vencido em {nearestDue}
                        </span>
                      )}
                      {status === 'em_dia' && nearestDue && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-300/80 mt-0.5">
                          <Clock size={10} /> Vence em {nearestDue}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Saldo e Ações Rápidas */}
                  <div className="text-right flex flex-col items-end flex-shrink-0">
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                      Saldo
                    </span>
                    <span className={`text-sm sm:text-base font-extrabold font-mono ${
                      debt > 0 
                        ? (status === 'atrasado' ? 'text-rose-400' : 'text-amber-400') 
                        : 'text-emerald-400'
                    }`}>
                      {formattedDebt}
                    </span>

                    {/* Botão de Atalho Rápido para WhatsApp */}
                    {debt > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenWhatsApp(client);
                        }}
                        className="mt-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center gap-1 transition-transform active:scale-95"
                        title="Cobrar este cliente no WhatsApp"
                      >
                        <MessageCircle size={12} />
                        <span>Cobrar</span>
                      </button>
                    )}
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
