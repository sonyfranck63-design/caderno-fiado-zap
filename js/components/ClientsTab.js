/**
 * Aba Principal: Clientes & Fiados
 * Identidade visual comercial brasileira: limpa, ágil, acolhedora e com estados vazios humanizados.
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
  const [sortBy, setSortBy] = React.useState('debt_desc');

  const {
    Search, PlusCircle, MessageCircle, AlertTriangle, CheckCircle2,
    Clock, DollarSign, Users, ChevronRight, Sparkles, X
  } = window.Icons || {};

  // Métricas financeiras no topo
  const totalReceivables = clients.reduce((acc, c) => acc + (window.AppState ? window.AppState.computeBalance(c) : 0), 0);
  const overdueClientsCount = clients.filter(c => window.AppState && window.AppState.getClientStatus(c) === 'atrasado').length;
  const inDebtClientsCount = clients.filter(c => window.AppState && window.AppState.computeBalance(c) > 0.01).length;

  // Filtragem
  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.phone && client.phone.includes(searchTerm.replace(/\D/g, '')));

    if (!matchesSearch) return false;

    const status = window.AppState ? window.AppState.getClientStatus(client) : 'em_dia';
    if (statusFilter === 'todos') return true;
    return status === statusFilter;
  });

  // Ordenação
  const sortedClients = [...filteredClients].sort((a, b) => {
    const debtA = window.AppState ? window.AppState.computeBalance(a) : 0;
    const debtB = window.AppState ? window.AppState.computeBalance(b) : 0;

    if (sortBy === 'debt_desc') return debtB - debtA;
    if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
    if (sortBy === 'recent') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    return 0;
  });

  return (
    <div className="space-y-4 pb-24 animate-fadeIn">
      
      {/* 3 Cards de Resumo Financeiro no Topo */}
      <div className="grid grid-cols-3 gap-2">
        
        {/* Total a Receber */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            A Receber
          </span>
          <span className="text-base font-black text-emerald-400 font-mono block mt-0.5 truncate">
            R$ {totalReceivables.toFixed(2).replace('.', ',')}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            {inDebtClientsCount} {inDebtClientsCount === 1 ? 'com saldo' : 'com saldo'}
          </span>
        </div>

        {/* Em Atraso */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-rose-900/30 shadow-sm">
          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block flex items-center gap-1">
            <AlertTriangle size={11} /> Atrasados
          </span>
          <span className="text-base font-black text-rose-400 font-mono block mt-0.5 truncate">
            {overdueClientsCount}
          </span>
          <span className="text-[10px] text-rose-300/70 mt-0.5 block">
            {overdueClientsCount === 1 ? 'Cobrança urgente' : 'Cobranças urgentes'}
          </span>
        </div>

        {/* Total Cadastrado */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
            <Users size={11} /> Clientes
          </span>
          <span className="text-base font-black text-slate-200 font-mono block mt-0.5 truncate">
            {clients.length}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Cadastrados
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
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
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

        {/* Filtros em Pílula */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setStatusFilter('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === 'todos'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            Todos ({clients.length})
          </button>

          <button
            onClick={() => setStatusFilter('atrasado')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
              statusFilter === 'atrasado'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            <AlertTriangle size={12} /> Atrasados ({overdueClientsCount})
          </button>

          <button
            onClick={() => setStatusFilter('em_dia')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
              statusFilter === 'em_dia'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            Em Aberto
          </button>

          <button
            onClick={() => setStatusFilter('quitado')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
              statusFilter === 'quitado'
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            <CheckCircle2 size={12} /> Quitados
          </button>
        </div>
      </div>

      {/* Lista de Clientes ou Estados Vazios Humanizados */}
      <div className="space-y-2.5">
        {sortedClients.length === 0 ? (
          /* Estado Vazio com Ilustração e Acolhimento */
          <div className="text-center py-10 px-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            
            {clients.length === 0 ? (
              /* Caso 1: App recém-instalado ou sem nenhum cliente */
              <>
                <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-3xl shadow-sm">
                  📖
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">
                    Seu Caderno de Fiado está pronto!
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Cadastre os clientes que compram fiado e controle cobranças no WhatsApp com total clareza e tranquilidade.
                  </p>
                </div>
                <button
                  onClick={onOpenNewRecord}
                  className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center space-x-2 transition-all active:scale-95 shadow-md"
                >
                  <PlusCircle size={16} />
                  <span>Cadastrar Primeiro Cliente</span>
                </button>
              </>
            ) : searchTerm ? (
              /* Caso 2: Busca sem resultados */
              <>
                <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center text-2xl">
                  🔍
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">
                    Nenhum cliente encontrado
                  </h3>
                  <p className="text-xs text-slate-400">
                    Não encontramos resultados para "{searchTerm}".
                  </p>
                </div>
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                >
                  Limpar busca
                </button>
              </>
            ) : (
              /* Caso 3: Filtro de status vazio */
              <>
                <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center text-2xl">
                  📋
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">
                    Nenhum cliente nesta categoria
                  </h3>
                  <p className="text-xs text-slate-400">
                    Não há registros correspondentes ao filtro selecionado.
                  </p>
                </div>
                <button
                  onClick={() => setStatusFilter('todos')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                >
                  Ver todos os clientes
                </button>
              </>
            )}

          </div>
        ) : (
          /* Listagem de Clientes */
          sortedClients.map(client => {
            const debt = window.AppState ? window.AppState.computeBalance(client) : 0;
            const status = window.AppState ? window.AppState.getClientStatus(client) : 'em_dia';
            const formattedDebt = `R$ ${debt.toFixed(2).replace('.', ',')}`;

            const initials = client.name
              .split(' ')
              .map(n => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            const openSales = (client.transactions || []).filter(t => t.type === 'sale');
            const nearestDue = openSales.length > 0 && openSales[0].dueDate 
              ? openSales[0].dueDate.split('-').reverse().join('/') 
              : null;

            return (
              <div
                key={client.id}
                onClick={() => onSelectClient(client.id)}
                className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer shadow-sm group active:scale-[0.99]"
              >
                <div className="flex items-center justify-between gap-3">
                  
                  {/* Avatar com Iniciais e Informações */}
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                      status === 'atrasado'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : status === 'quitado'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-200 border border-slate-700'
                    }`}>
                      {initials}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-emerald-400 transition-colors">
                          {client.name}
                        </h4>
                        {status === 'quitado' && (
                          <span className="text-[10px] text-emerald-400">⭐</span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {client.phone ? client.phone : (client.address || 'Sem telefone')}
                      </p>
                    </div>
                  </div>

                  {/* Saldo Devedor e Status */}
                  <div className="text-right flex-shrink-0">
                    <span className={`font-mono font-bold text-sm block ${
                      debt > 0 
                        ? (status === 'atrasado' ? 'text-rose-400' : 'text-amber-400') 
                        : 'text-emerald-400'
                    }`}>
                      {debt > 0 ? formattedDebt : 'Quitado'}
                    </span>

                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      {status === 'atrasado' 
                        ? (nearestDue ? `Venceu ${nearestDue}` : 'Atrasado') 
                        : status === 'em_dia' 
                        ? (nearestDue ? `Vence ${nearestDue}` : 'Em dia') 
                        : 'Sem pendências'}
                    </span>
                  </div>

                  <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 flex-shrink-0 ml-1 transition-colors" />

                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
