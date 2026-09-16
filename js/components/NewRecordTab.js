/**
 * Aba de Novo Registro: Venda no Fiado, Parcelamento de Boca ou Cadastro de Novo Cliente
 * Suporte a parcelamento com cálculo automático de parcelas, anexo de foto e modos Claro/Escuro.
 */

window.NewRecordTab = function NewRecordTab({
  clients,
  onRecordCreated,
  onClientCreated
}) {
  const [recordType, setRecordType] = React.useState(() => {
    return (!clients || clients.length === 0) ? 'client' : 'sale';
  });

  // Estado do formulário de venda fiada
  const [selectedClientId, setSelectedClientId] = React.useState('');
  const [saleAmount, setSaleAmount] = React.useState('');
  const [saleDesc, setSaleDesc] = React.useState('');
  const [dueDate, setDueDate] = React.useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [photoPreview, setPhotoPreview] = React.useState(null);

  // Estados de Parcelamento de Boca
  const [isInstallment, setIsInstallment] = React.useState(false);
  const [installmentCount, setInstallmentCount] = React.useState(2);
  const [installmentInterval, setInstallmentInterval] = React.useState(30); // 30 = mensal, 15 = quinzenal, 7 = semanal

  // Estado do formulário de novo cliente
  const [clientName, setClientName] = React.useState('');
  const [clientPhone, setClientPhone] = React.useState('');
  const [clientAddress, setClientAddress] = React.useState('');
  const [clientLimit, setClientLimit] = React.useState('350');

  // Diálogo amigável de feedback (sem alert nativo)
  const [feedbackDialog, setFeedbackDialog] = React.useState({ isOpen: false, title: '', message: '', variant: 'warning' });

  const {
    PlusCircle, UserPlus, DollarSign, Calendar, Camera, X, Check,
    Sparkles, AlertTriangle, Users
  } = window.Icons || {};

  // Tags rápidas de produtos/serviços comuns no comércio popular brasileiro
  const quickTags = [
    'Manicure / Unhas',
    'Corte & Cabelo',
    'Roupas / Calçados',
    'Cosméticos / Perfume',
    'Oficina / Peças',
    'Mercadoria / Alimentos'
  ];

  // Atalhos de prazo de vencimento
  const handleQuickDue = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDueDate(d.toISOString().split('T')[0]);
  };

  // Upload de Foto / Comprovante
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Submissão de Venda no Fiado (À vista ou Parcelado de Boca)
  const handleSaleSubmit = (e) => {
    e.preventDefault();
    if (!selectedClientId) {
      setFeedbackDialog({
        isOpen: true,
        title: 'Selecione o Cliente',
        message: 'Por favor, selecione para qual cliente esta venda fiada será anotada.',
        variant: 'warning'
      });
      return;
    }
    const val = parseFloat(saleAmount);
    if (isNaN(val) || val <= 0) {
      setFeedbackDialog({
        isOpen: true,
        title: 'Valor Inválido',
        message: 'Por favor, informe um valor numérico válido para a venda.',
        variant: 'warning'
      });
      return;
    }

    try {
      if (isInstallment) {
        window.AppState.addInstallmentSale(selectedClientId, {
          totalAmount: val,
          description: saleDesc || 'Venda parcelada',
          startDate: dueDate,
          installmentCount: installmentCount,
          intervalDays: installmentInterval,
          photoUrl: photoPreview
        });
      } else {
        window.AppState.addSale(selectedClientId, {
          amount: val,
          description: saleDesc || 'Venda no fiado',
          dueDate: dueDate,
          photoUrl: photoPreview
        });
      }

      setSaleAmount('');
      setSaleDesc('');
      setPhotoPreview(null);
      setIsInstallment(false);

      onRecordCreated(selectedClientId);
    } catch(err) {
      setFeedbackDialog({
        isOpen: true,
        title: 'Erro ao Registrar',
        message: 'Não foi possível salvar a venda: ' + err.message,
        variant: 'danger'
      });
    }
  };

  // Submissão de Cadastro de Cliente
  const handleClientSubmit = (e) => {
    e.preventDefault();
    if (!clientName.trim()) {
      setFeedbackDialog({
        isOpen: true,
        title: 'Nome Obrigatório',
        message: 'Por favor, informe o nome ou apelido do cliente.',
        variant: 'warning'
      });
      return;
    }

    const newClient = window.AppState.addClient({
      name: clientName,
      phone: clientPhone,
      address: clientAddress,
      creditLimit: clientLimit
    });

    setClientName('');
    setClientPhone('');
    setClientAddress('');
    setClientLimit('350');

    onClientCreated(newClient.id);
  };

  return (
    <div className="space-y-4 pb-24 tab-enter">
      
      {/* Seletor de Tipo de Registro: Venda Fiada vs Novo Cliente */}
      <div className="flex rounded-2xl bg-slate-200/80 dark:bg-slate-900 p-1 border border-slate-300 dark:border-slate-800 transition-colors">
        <button
          type="button"
          onClick={() => setRecordType('sale')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 btn-smooth ${
            recordType === 'sale'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <PlusCircle size={15} />
          <span>Anotar Fiado</span>
        </button>

        <button
          type="button"
          onClick={() => setRecordType('client')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 btn-smooth ${
            recordType === 'client'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <UserPlus size={15} />
          <span>Novo Cliente</span>
        </button>
      </div>

      {recordType === 'sale' ? (
        /* FORMULÁRIO DE ANOTAR VENDA FIADA */
        <form onSubmit={handleSaleSubmit} className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5 shadow-sm transition-colors">
            
            {/* Seleção do Cliente */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Cliente que está comprando:
              </label>
              {clients.length === 0 ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300">
                  Nenhum cliente cadastrado ainda. 
                  <button
                    type="button"
                    onClick={() => setRecordType('client')}
                    className="underline font-bold ml-1"
                  >
                    Clique aqui para cadastrar o primeiro!
                  </button>
                </div>
              ) : (
                <select
                  value={selectedClientId}
                  onChange={e => setSelectedClientId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Selecione o cliente...</option>
                  {clients.map(c => {
                    const debt = window.AppState.computeBalance(c);
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} {debt > 0 ? `(Deve R$ ${debt.toFixed(2).replace('.', ',')})` : '(Sem débitos)'}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            {/* Valor da Venda */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Valor Total (R$):
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-base font-bold text-slate-400">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={saleAmount}
                  onChange={e => setSaleAmount(e.target.value)}
                  placeholder="0,00"
                  required
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono shadow-inner"
                />
              </div>
            </div>

            {/* Opção: Parcelamento de Boca */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3 transition-colors">
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isInstallment}
                    onChange={e => setIsInstallment(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      🤝 Parcelamento de Boca
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                      Dividir em parcelas com datas automáticas
                    </span>
                  </div>
                </label>
                {isInstallment && parseFloat(saleAmount) > 0 && (
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-500/30">
                    {installmentCount}x de R$ {(parseFloat(saleAmount) / installmentCount).toFixed(2).replace('.', ',')}
                  </span>
                )}
              </div>

              {isInstallment && (
                <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        Qtd. de Parcelas:
                      </label>
                      <select
                        value={installmentCount}
                        onChange={e => setInstallmentCount(parseInt(e.target.value, 10))}
                        className="w-full px-2.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                      >
                        {[2, 3, 4, 5, 6, 8, 10, 12].map(n => (
                          <option key={n} value={n}>{n}x parcelas</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        Frequência:
                      </label>
                      <select
                        value={installmentInterval}
                        onChange={e => setInstallmentInterval(parseInt(e.target.value, 10))}
                        className="w-full px-2.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value={30}>Mensal (a cada 30 dias)</option>
                        <option value={15}>Quinzenal (a cada 15 dias)</option>
                        <option value={7}>Semanal (a cada 7 dias)</option>
                      </select>
                    </div>
                  </div>

                  {/* Resumo visual do cronograma de parcelas */}
                  {parseFloat(saleAmount) > 0 && (
                    <div className="p-2.5 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-[11px] space-y-1">
                      <span className="font-bold text-emerald-800 dark:text-emerald-300 block text-[10px] uppercase tracking-wider">
                        📅 Cronograma Previsto:
                      </span>
                      <div className="space-y-1 text-slate-700 dark:text-slate-300">
                        {Array.from({ length: installmentCount }).map((_, idx) => {
                          const baseD = dueDate ? new Date(dueDate + 'T12:00:00') : new Date();
                          const currentD = new Date(baseD);
                          currentD.setDate(baseD.getDate() + (idx * installmentInterval));
                          const dStr = currentD.toLocaleDateString('pt-BR');
                          const instVal = (parseFloat(saleAmount) / installmentCount).toFixed(2).replace('.', ',');
                          return (
                            <div key={idx} className="flex justify-between text-[10.5px]">
                              <span>Parcela {idx + 1} de {installmentCount}:</span>
                              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">R$ {instVal} ({dStr})</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Descrição do Fiado */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Descrição do Produto ou Serviço:
              </label>
              <input
                type="text"
                value={saleDesc}
                onChange={e => setSaleDesc(e.target.value)}
                placeholder="Ex: Manicure + Pedicure / 2 Calças Jeans"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />

              {/* Tags rápidas */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {quickTags.map((tag, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSaleDesc(tag)}
                    className="text-[10px] px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors btn-smooth"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Data de Vencimento (1ª Parcela ou Total) */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {isInstallment ? 'Vencimento da 1ª Parcela:' : 'Data do Vencimento Acordada:'}
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />

              {/* Atalhos de prazo */}
              <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickDue(7)}
                  className="py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-[10px] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 btn-smooth"
                >
                  +7 Dias
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDue(15)}
                  className="py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-[10px] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 btn-smooth"
                >
                  +15 Dias
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDue(30)}
                  className="py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-[10px] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 btn-smooth"
                >
                  +30 Dias
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    setDueDate(today);
                  }}
                  className="py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-[10px] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 btn-smooth"
                >
                  Hoje
                </button>
              </div>
            </div>
          </div>

          {/* Anexo de Foto / Cupom / Assinatura */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-sm transition-colors">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Foto do Comprovante / Cupom (Opcional):
            </span>

            {photoPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 max-h-40">
                <img src={photoPreview} alt="Comprovante" className="w-full h-40 object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoPreview(null)}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/80 text-white hover:bg-black"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-950 cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors btn-smooth">
                <Camera size={22} className="mb-1 text-slate-400 dark:text-slate-500" />
                <span className="text-xs font-semibold">Tirar Foto ou Anexar Imagem</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Botão Salvar Fiado */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center space-x-2 transition-all active:scale-[0.99] shadow-md btn-smooth"
          >
            <Check size={18} />
            <span>{isInstallment ? `Salvar Venda em ${installmentCount}x Parcelas` : 'Salvar Fiado no Caderno'}</span>
          </button>

        </form>
      ) : (
        /* FORMULÁRIO DE CADASTRAR NOVO CLIENTE */
        <form onSubmit={handleClientSubmit} className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5 shadow-sm transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserPlus size={16} className="text-emerald-600 dark:text-emerald-400" />
              Cadastrar Novo Cliente no Caderno
            </h3>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Nome Completo ou Apelido Conhecido:
              </label>
              <input
                type="text"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="Ex: Dona Neide / Seu Jorge"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                WhatsApp com DDD:
              </label>
              <input
                type="tel"
                value={clientPhone}
                onChange={e => setClientPhone(e.target.value)}
                placeholder="Ex: 11987654321 (apenas números)"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                Fundamental para a cobrança automática e envio do PIX com 1 clique.
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Endereço ou Ponto de Referência (Opcional):
              </label>
              <input
                type="text"
                value={clientAddress}
                onChange={e => setClientAddress(e.target.value)}
                placeholder="Ex: Rua das Flores, 120 / Bloco B Apto 10"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Limite de Crédito Fiado (R$):
              </label>
              <input
                type="number"
                step="50"
                value={clientLimit}
                onChange={e => setClientLimit(e.target.value)}
                placeholder="350,00"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                O app avisará quando a dívida acumulada ultrapassar esse limite.
              </span>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all active:scale-[0.99] shadow-md btn-smooth"
            >
              <Check size={16} />
              <span>Concluir Cadastro de Cliente</span>
            </button>
          </div>
        </form>
      )}

      {/* Modal de Feedback Amigável */}
      <window.ConfirmModal
        isOpen={feedbackDialog.isOpen}
        title={feedbackDialog.title}
        message={feedbackDialog.message}
        confirmText="Entendi"
        variant={feedbackDialog.variant}
        showCancel={false}
        onConfirm={() => setFeedbackDialog({ ...feedbackDialog, isOpen: false })}
      />

    </div>
  );
};
