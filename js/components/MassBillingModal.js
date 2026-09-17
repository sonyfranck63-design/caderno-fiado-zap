/**
 * Modal VIP: Cobrança Automática em Massa no WhatsApp
 * Lista todos os clientes inadimplentes e permite envio sequencial ágil.
 */

window.MassBillingModal = function MassBillingModal({ isOpen, onClose, clients, shopSettings }) {
  const [sentCount, setSentCount] = React.useState(0);
  const { X, Sparkles, AlertTriangle, Send, CheckCircle2, MessageCircle } = window.Icons || {};

  // Controle de histórico
  window.useModalHistory(isOpen, onClose, 'MassBillingModal');

  React.useEffect(() => {
    if (isOpen) {
      setSentCount(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const overdueClients = clients.filter(c => window.AppState && window.AppState.getClientStatus(c) === 'atrasado');

  const handleSendToClient = (client) => {
    let cleanPhone = (client.phone || '').replace(/\D/g, '');
    if (!cleanPhone) {
      alert(`O cliente ${client.name} não possui um telefone válido cadastrado.`);
      return;
    }
    if (!cleanPhone.startsWith('55') && cleanPhone.length >= 10) {
      cleanPhone = '55' + cleanPhone;
    }

    const debt = window.AppState ? window.AppState.computeBalance(client) : 0;
    const formattedDebt = `R$ ${debt.toFixed(2).replace('.', ',')}`;
    const shopName = shopSettings?.shopName || 'nosso estabelecimento';
    
    let message = `Olá, ${client.name}.\n\nConsta um saldo em aberto de *${formattedDebt}* na *${shopName}*.\n\nSolicitamos a gentileza de regularizarmos essa pendência para manter seu cadastro sempre em dia.`;
    
    if (shopSettings?.pixKey) {
      message += `\n\nChave PIX: *${shopSettings.pixKey}*`;
    }

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    
    setSentCount(prev => prev + 1);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/80 animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-pop-in transition-colors">
        
        {/* Topo VIP */}
        <div className="p-4 bg-gradient-to-r from-amber-500/10 via-white to-amber-500/10 dark:from-amber-950/60 dark:via-slate-900 dark:to-amber-950/50 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-md">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                Recuperador VIP <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] uppercase ml-1">Automático</span>
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Cobrança em Massa no WhatsApp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors btn-smooth"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex gap-3">
            <div className="mt-0.5">
              <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <strong className="block text-xs text-amber-800 dark:text-amber-300">Como funciona?</strong>
              <span className="text-[11px] text-amber-700 dark:text-amber-400/80 leading-snug block mt-0.5">
                Clique no botão "Cobrar" ao lado de cada cliente. O seu WhatsApp será aberto automaticamente já com a mensagem e os valores preenchidos. Volte ao app para cobrar o próximo.
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {overdueClients.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
                <strong className="block text-slate-900 dark:text-white text-sm">Nenhuma dívida atrasada!</strong>
                <span className="text-xs text-slate-500">Todos os seus clientes estão em dia.</span>
              </div>
            ) : (
              overdueClients.map(client => {
                const debt = window.AppState.computeBalance(client);
                return (
                  <div key={client.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 transition-colors">
                    <div className="min-w-0 flex-1">
                      <strong className="block text-xs font-bold text-slate-900 dark:text-white truncate">{client.name}</strong>
                      <span className="text-[11px] font-mono text-rose-600 dark:text-rose-400 font-bold block">
                        R$ {debt.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => handleSendToClient(client)}
                      className="ml-3 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all btn-smooth"
                    >
                      <MessageCircle size={14} /> Cobrar
                    </button>
                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
