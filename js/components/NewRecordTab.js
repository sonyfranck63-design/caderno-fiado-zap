/**
 * Aba de Novo Registro: Venda no Fiado ou Cadastro de Novo Cliente
 * Suporte a anexo de foto/comprovante, tags rápidas e prazos pré-configurados.
 */

window.NewRecordTab = function NewRecordTab({
  clients,
  onRecordCreated,
  onClientCreated
}) {
  const [recordType, setRecordType] = React.useState('sale'); // 'sale' | 'client'

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

  // Estado do formulário de novo cliente
  const [clientName, setClientName] = React.useState('');
  const [clientPhone, setClientPhone] = React.useState('');
  const [clientAddress, setClientAddress] = React.useState('');
  const [clientLimit, setClientLimit] = React.useState('350');

  const {
    PlusCircle, UserPlus, DollarSign, Calendar, Camera, X, Check,
    Sparkles, AlertTriangle, Users
  } = window.Icons;

  // Tags rápidas de produtos/serviços comuns
  const quickTags = [
    'Alongamento / Manicure',
    'Escova & Tratamento',
    'Roupas & Vestuário',
    'Cosméticos / Perfume',
    'Troca de Óleo & Peças',
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

    // Converte para Base64 para persistência simples
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Submissão de Venda no Fiado
  const handleSaleSubmit = (e) => {
    e.preventDefault();
    if (!selectedClientId) {
      alert('Por favor, selecione um cliente.');
      return;
    }
    const val = parseFloat(saleAmount);
    if (isNaN(val) || val <= 0) {
      alert('Por favor, informe um valor válido para a venda.');
      return;
    }

    try {
      window.AppState.addSale(selectedClientId, {
        amount: val,
        description: saleDesc || 'Venda no fiado',
        dueDate: dueDate,
        photoUrl: photoPreview
      });

      // Limpa formulário
      setSaleAmount('');
      setSaleDesc('');
      setPhotoPreview(null);

      // Notifica e redireciona
      onRecordCreated(selectedClientId);
    } catch(err) {
      alert('Erro ao registrar venda: ' + err.message);
    }
  };

  // Submissão de Cadastro de Cliente
  const handleClientSubmit = (e) => {
    e.preventDefault();
    if (!clientName.trim()) {
      alert('Por favor, informe o nome do cliente.');
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

    onClientCreated(newClient.id);
  };

  return (
    <div className="space-y-4 pb-24 animate-fadeIn">
      
      {/* Seletor de Tipo de Registro: Nova Venda Fiada vs Novo Cliente */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-2xl border border-slate-800">
        <button
          type="button"
          onClick={() => setRecordType('sale')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
            recordType === 'sale'
              ? 'bg-brand-500 text-slate-950 shadow-glow-emerald'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <PlusCircle size={16} />
          <span>Anotar Fiado</span>
        </button>

        <button
          type="button"
          onClick={() => setRecordType('client')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
            recordType === 'client'
              ? 'bg-brand-500 text-slate-950 shadow-glow-emerald'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <UserPlus size={16} />
          <span>Cadastrar Cliente</span>
        </button>
      </div>

      {recordType === 'sale' ? (
        /* FORMULÁRIO DE ANOTAR FIADO */
        <form onSubmit={handleSaleSubmit} className="space-y-4">
          
          {/* Seleção do Cliente */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Users size={14} className="text-brand-400" />
                Para quem é este fiado?
              </label>
              <button
                type="button"
                onClick={() => setRecordType('client')}
                className="text-[11px] text-brand-400 hover:underline font-semibold"
              >
                + Novo Cliente
              </button>
            </div>

            <select
              value={selectedClientId}
              onChange={e => setSelectedClientId(e.target.value)}
              required
              className="w-full px-3.5 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm font-semibold text-white focus:outline-none focus:border-brand-500 shadow-inner"
            >
              <option value="">Selecione um cliente cadastrado...</option>
              {clients.map(c => {
                const debt = window.AppState.computeBalance(c);
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} {debt > 0 ? `(Deve R$ ${debt.toFixed(2).replace('.', ',')})` : '(Quitado)'}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Valor da Venda */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-sm">
            <label className="text-xs font-bold text-slate-300 block">
              Valor da Venda Fiada (R$):
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-lg font-bold text-slate-400">R$</span>
              <input
                type="number"
                step="0.01"
                min="0.50"
                value={saleAmount}
                onChange={e => setSaleAmount(e.target.value)}
                placeholder="0,00"
                required
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xl font-extrabold text-white focus:outline-none focus:border-brand-500 font-mono shadow-inner"
              />
            </div>

            {/* Chips de valores rápidos */}
            <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pt-1">
              {[20, 50, 80, 100, 150].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setSaleAmount(amt.toString())}
                  className="px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 text-xs font-mono font-semibold text-slate-300 active:scale-95"
                >
                  +R${amt}
                </button>
              ))}
            </div>
          </div>

          {/* Descrição & Tags Rápidas */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-sm">
            <label className="text-xs font-bold text-slate-300 block">
              Descrição dos Produtos ou Serviços:
            </label>
            <input
              type="text"
              value={saleDesc}
              onChange={e => setSaleDesc(e.target.value)}
              placeholder="Ex: Escova + Selagem, 2 Camisetas, Troca de pastilhas..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-brand-500 shadow-inner"
            />

            {/* Sugestões de Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {quickTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSaleDesc(prev => prev ? `${prev}, ${tag}` : tag)}
                  className="px-2 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 text-[10px] text-slate-400 hover:text-slate-200 transition-colors"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Data Combinada de Vencimento */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-sm">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Calendar size={14} className="text-brand-400" />
              Data Combinada para Pagamento (Vencimento):
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-brand-500 shadow-inner font-mono"
            />

            {/* Atalhos de Prazo */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleQuickDue(7)}
                className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-[11px] font-medium text-slate-300"
              >
                Em 7 dias
              </button>
              <button
                type="button"
                onClick={() => handleQuickDue(15)}
                className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-[11px] font-medium text-slate-300"
              >
                Em 15 dias
              </button>
              <button
                type="button"
                onClick={() => handleQuickDue(30)}
                className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-[11px] font-medium text-slate-300"
              >
                Em 30 dias
              </button>
            </div>
          </div>

          {/* Anexo de Foto / Comprovante Opcional */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Camera size={14} className="text-brand-400" />
                Foto / Comprovante Assinado (Opcional):
              </label>
              {photoPreview && (
                <button
                  type="button"
                  onClick={() => setPhotoPreview(null)}
                  className="text-[10px] text-rose-400 hover:underline"
                >
                  Remover
                </button>
              )}
            </div>

            {photoPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-700 max-h-40">
                <img src={photoPreview} alt="Comprovante" className="w-full h-40 object-cover" />
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-2xl cursor-pointer bg-slate-950/40 transition-colors">
                <Camera size={22} className="text-slate-500 mb-1" />
                <span className="text-xs font-semibold text-slate-400">Tirar foto ou anexar recibo</span>
                <span className="text-[10px] text-slate-400">Ajuda a comprovar o pedido em caso de dúvida</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Botão de Gravar Registro */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-emerald-400 hover:from-brand-400 hover:to-emerald-300 text-slate-950 font-extrabold text-sm shadow-glow-emerald flex items-center justify-center space-x-2 transition-all active:scale-95"
          >
            <Check size={18} />
            <span>Salvar Fiado no Caderno</span>
          </button>

        </form>
      ) : (
        /* FORMULÁRIO DE CADASTRAR NOVO CLIENTE */
        <form onSubmit={handleClientSubmit} className="space-y-4">
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3.5 shadow-sm">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserPlus size={16} className="text-brand-400" />
              Cadastrar Novo Cliente no Caderno
            </h3>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Nome Completo ou Apelido Conhecido:
              </label>
              <input
                type="text"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="Ex: Dona Neide (Costureira)"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-brand-500 shadow-inner"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                WhatsApp com DDD:
              </label>
              <input
                type="tel"
                value={clientPhone}
                onChange={e => setClientPhone(e.target.value)}
                placeholder="Ex: 11987654321 (apenas números)"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-brand-500 shadow-inner"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Fundamental para a cobrança automática e envio do PIX com 1 clique.
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Endereço ou Ponto de Referência (Opcional):
              </label>
              <input
                type="text"
                value={clientAddress}
                onChange={e => setClientAddress(e.target.value)}
                placeholder="Ex: Casa verde em frente à padaria / Bloco C Apto 12"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-brand-500 shadow-inner"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Limite de Crédito Fiado (R$):
              </label>
              <input
                type="number"
                step="50"
                value={clientLimit}
                onChange={e => setClientLimit(e.target.value)}
                placeholder="350,00"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-brand-500 font-mono shadow-inner"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                O app avisará quando a dívida acumulada ultrapassar esse limite.
              </span>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 rounded-2xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs shadow-glow-emerald flex items-center justify-center space-x-2 transition-all active:scale-95"
            >
              <Check size={16} />
              <span>Concluir Cadastro de Cliente</span>
            </button>
          </div>
        </form>
      )}

    </div>
  );
};
