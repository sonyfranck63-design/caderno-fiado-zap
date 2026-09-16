/**
 * Modal Detalhado do Cliente (Ficha de Fiados, Abatimentos e Ações Rápidas)
 * Inclui suporte a parcelamento, entrega multi-canal de recibo no celular e modos Claro/Escuro.
 */

window.ClientDetailModal = function ClientDetailModal({
  isOpen,
  client: propClient,
  clientId,
  onClose,
  onOpenWhatsApp,
  onOpenPix,
  onTriggerPaywall,
  isVip,
  shopSettings
}) {
  const client = propClient || (clientId && window.AppState ? window.AppState.getClient(clientId) : null);
  const [activeSubTab, setActiveSubTab] = React.useState('extrato'); // 'extrato' | 'abater'
  const [payAmount, setPayAmount] = React.useState('');
  const [payMethod, setPayMethod] = React.useState('Dinheiro');
  const [payNotes, setPayNotes] = React.useState('');
  const [showPhotoModal, setShowPhotoModal] = React.useState(null);
  
  // Estados para diálogos integrados (sem alert/confirm nativos)
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [feedbackModal, setFeedbackModal] = React.useState({ isOpen: false, title: '', message: '', variant: 'info' });
  const [pdfLoading, setPdfLoading] = React.useState(false);
  const [pdfModalData, setPdfModalData] = React.useState(null);

  const {
    X, Phone, MapPin, Calendar, Clock, DollarSign,
    CheckCircle2, AlertTriangle, FileText, QrCode, MessageCircle, Trash2, Check, Crown
  } = window.Icons || {};

  if (!isOpen || !client) return null;

  const debt = window.AppState ? window.AppState.computeBalance(client) : 0;
  const status = window.AppState ? window.AppState.getClientStatus(client) : 'em_dia';
  const formattedDebt = `R$ ${debt.toFixed(2).replace('.', ',')}`;
  const creditLimit = client.creditLimit || 300;
  const limitUsagePct = Math.min(100, Math.round((debt / creditLimit) * 100));

  // Handler para registrar abatimento
  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(payAmount);
    if (isNaN(val) || val <= 0) {
      setFeedbackModal({
        isOpen: true,
        title: 'Valor Inválido',
        message: 'Por favor, informe um valor numérico válido para o abatimento.',
        variant: 'warning'
      });
      return;
    }

    try {
      window.AppState.addPayment(client.id, {
        amount: val,
        paymentMethod: payMethod,
        notes: payNotes
      });

      setPayAmount('');
      setPayNotes('');
      setActiveSubTab('extrato');

      if (val >= debt && typeof confetti === 'function') {
        confetti({ particleCount: 60, spread: 55, origin: { y: 0.6 } });
      }
    } catch(err) {
      setFeedbackModal({
        isOpen: true,
        title: 'Erro ao Registrar',
        message: 'Falha ao salvar abatimento: ' + err.message,
        variant: 'danger'
      });
    }
  };

  // Quitar tudo com 1 clique
  const handleFullPayoff = () => {
    if (debt <= 0) return;
    setPayAmount(debt.toFixed(2));
    setActiveSubTab('abater');
  };

  // Proteção e Abertura de Recursos VIP (PIX)
  const handlePixClick = () => {
    if (debt <= 0) {
      setFeedbackModal({
        isOpen: true,
        title: 'Conta Quitada',
        message: 'Este cliente já está com o saldo em dia! Não há débitos pendentes no momento para gerar cobrança PIX.',
        variant: 'info'
      });
      return;
    }

    if (isVip) {
      onOpenPix(client);
    } else {
      onTriggerPaywall('pix');
    }
  };

  // Gerador de Recibo PDF com suporte a entrega no celular
  const handlePdfClick = async () => {
    if (!isVip) {
      onTriggerPaywall('pdf');
      return;
    }

    setPdfLoading(true);
    const result = await window.PdfService.generateReceiptPdf(client, shopSettings);
    setPdfLoading(false);

    // Abre o modal de opções do recibo sempre, garantindo que o usuário veja
    setPdfModalData(result);
  };

  // Envio do comprovante pelo WhatsApp
  const handleSendTextReceiptViaWhatsApp = () => {
    if (!pdfModalData || !pdfModalData.receiptText) return;
    const phone = (client.phone || '').replace(/\D/g, '');
    const cleanPhone = phone.startsWith('55') ? phone : (phone ? '55' + phone : '');
    const url = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(pdfModalData.receiptText)}`
      : `https://wa.me/?text=${encodeURIComponent(pdfModalData.receiptText)}`;
    window.open(url, '_blank');
    setPdfModalData(null);
  };

  const handleCopyTextReceipt = () => {
    if (!pdfModalData || !pdfModalData.receiptText) return;
    navigator.clipboard.writeText(pdfModalData.receiptText);
    setFeedbackModal({
      isOpen: true,
      title: 'Extrato Copiado',
      message: 'O extrato detalhado foi copiado para sua área de transferência! Você pode colar em qualquer conversa do WhatsApp.',
      variant: 'success'
    });
    setPdfModalData(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-pop-in transition-colors">
        
        {/* Cabeçalho */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between transition-colors">
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-base text-slate-900 dark:text-white truncate">{client.name}</h2>
              {status === 'quitado' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Check size={11} /> Quitado
                </span>
              )}
              {status === 'atrasado' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1">
                  <AlertTriangle size={11} /> Atrasado
                </span>
              )}
              {status === 'em_dia' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  Em Aberto
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {client.phone ? `WhatsApp: ${client.phone}` : 'Sem telefone'} • {client.address || 'Sem endereço'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ml-2 btn-smooth"
          >
            <X size={18} />
          </button>
        </div>

        {/* Card de Saldo e Barra de Limite */}
        <div className="p-4 bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800/80 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                Saldo Devedor Atual
              </span>
              <span className={`text-2xl font-extrabold font-mono ${
                debt > 0 ? (status === 'atrasado' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400') : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {formattedDebt}
              </span>
            </div>

            {debt > 0 ? (
              <button
                onClick={handleFullPayoff}
                className="py-1.5 px-3 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 btn-smooth"
              >
                <CheckCircle2 size={14} />
                <span>Quitar Tudo</span>
              </button>
            ) : (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                ⭐ Em Dia
              </span>
            )}
          </div>

          {/* Barra de Limite de Crédito */}
          <div>
            <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
              <span>Limite Usado: {limitUsagePct}%</span>
              <span>Limite Total: R$ {creditLimit.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  limitUsagePct > 90 ? 'bg-rose-500' : limitUsagePct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${limitUsagePct}%` }}
              />
            </div>
            {limitUsagePct >= 100 && (
              <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 font-semibold flex items-center gap-1">
                <AlertTriangle size={11} /> Limite de crédito atingido! Avalie um acerto antes de novas vendas.
              </p>
            )}
          </div>
        </div>

        {/* 4 Botões Rápidos de Ação */}
        <div className="grid grid-cols-4 gap-2 p-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
          
          {/* Cobrar Zap */}
          <button
            onClick={() => onOpenWhatsApp(client)}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-200 transition-all active:scale-95 shadow-sm btn-smooth"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1">
              <MessageCircle size={16} />
            </div>
            <span className="text-[10px] font-semibold text-center leading-tight">Cobrar Zap</span>
          </button>

          {/* PIX Automático (VIP) */}
          <button
            onClick={handlePixClick}
            className="relative flex flex-col items-center justify-center p-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-200 transition-all active:scale-95 shadow-sm btn-smooth"
          >
            {!isVip && (
              <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded-full text-[8px] font-extrabold bg-amber-500 text-slate-950 flex items-center gap-0.5">
                VIP
              </span>
            )}
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1">
              <QrCode size={16} />
            </div>
            <span className="text-[10px] font-semibold text-center leading-tight">Gerar PIX</span>
          </button>

          {/* Recibo PDF (VIP) */}
          <button
            onClick={handlePdfClick}
            disabled={pdfLoading}
            className="relative flex flex-col items-center justify-center p-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-200 transition-all active:scale-95 shadow-sm btn-smooth"
          >
            {!isVip && (
              <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded-full text-[8px] font-extrabold bg-amber-500 text-slate-950 flex items-center gap-0.5">
                VIP
              </span>
            )}
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center mb-1">
              {pdfLoading ? (
                <div className="w-4 h-4 border-2 border-slate-400 border-t-emerald-500 rounded-full animate-spin" />
              ) : (
                <FileText size={16} />
              )}
            </div>
            <span className="text-[10px] font-semibold text-center leading-tight">
              {pdfLoading ? 'Gerando...' : 'Recibo PDF'}
            </span>
          </button>

          {/* Abater Pagamento */}
          <button
            onClick={() => setActiveSubTab(activeSubTab === 'abater' ? 'extrato' : 'abater')}
            className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all active:scale-95 shadow-sm btn-smooth ${
              activeSubTab === 'abater'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                : 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-200'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1">
              <DollarSign size={16} />
            </div>
            <span className="text-[10px] font-semibold text-center leading-tight">
              {activeSubTab === 'abater' ? 'Ver Extrato' : 'Abater'}
            </span>
          </button>

        </div>

        {/* Conteúdo Dinâmico: Formulário de Abatimento OU Extrato */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          
          {activeSubTab === 'abater' ? (
            /* Formulário de Baixa de Pagamento */
            <form onSubmit={handlePaymentSubmit} className="space-y-3 animate-fadeIn">
              <div className="p-3 bg-emerald-50/50 dark:bg-slate-950/60 rounded-xl border border-emerald-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1.5">
                  <DollarSign size={14} /> Registrar Pagamento / Abatimento
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Informe o valor recebido deste cliente. O saldo devedor será recalculado instantaneamente.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Valor Pago (R$):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={debt > 0 ? debt : undefined}
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    placeholder="0,00"
                    required
                    autoFocus
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono shadow-inner"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Forma:</label>
                  <select
                    value={payMethod}
                    onChange={e => setPayMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="PIX">PIX</option>
                    <option value="Cartão de Débito">Cartão Débito</option>
                    <option value="Cartão de Crédito">Cartão Crédito</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Observação:</label>
                  <input
                    type="text"
                    value={payNotes}
                    onChange={e => setPayNotes(e.target.value)}
                    placeholder="Ex: Deixou com o filho"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('extrato')}
                  className="flex-1 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors btn-smooth"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all active:scale-95 shadow-md btn-smooth"
                >
                  Confirmar Recebimento
                </button>
              </div>
            </form>
          ) : (
            /* Lista de Transações / Extrato */
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock size={14} className="text-emerald-600 dark:text-emerald-400" />
                  Extrato de Compras e Abates
                </h4>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  {client.transactions?.length || 0} registro(s)
                </span>
              </div>

              {(!client.transactions || client.transactions.length === 0) ? (
                <div className="text-center py-10 px-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80">
                  <span className="text-2xl block mb-1">📝</span>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nenhum registro ainda</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    As compras no fiado e pagamentos deste cliente serão listados aqui.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {client.transactions.map((tx) => {
                    const isSale = tx.type === 'sale';
                    const txDate = tx.date ? new Date(tx.date).toLocaleDateString('pt-BR') : '-';
                    const txDue = tx.dueDate ? tx.dueDate.split('-').reverse().join('/') : null;

                    return (
                      <div
                        key={tx.id}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs transition-colors"
                      >
                        <div className="flex items-start space-x-2.5 min-w-0">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            isSale ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {isSale ? '🛍️' : '💵'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-slate-900 dark:text-white truncate">
                                {isSale ? tx.description || 'Compra no Fiado' : `Abatimento (${tx.paymentMethod || 'Dinheiro'})`}
                              </span>
                              {tx.installment && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                                  Parcela {tx.installment.current}/{tx.installment.total}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                              <span>{txDate}</span>
                              {isSale && txDue && (
                                <span className="text-amber-600 dark:text-amber-400 font-medium">Venc: {txDue}</span>
                              )}
                              {!isSale && tx.notes && (
                                <span className="text-slate-400 truncate max-w-[120px]">{tx.notes}</span>
                              )}
                            </div>
                            {tx.photoUrl && (
                              <button
                                onClick={() => setShowPhotoModal(tx.photoUrl)}
                                className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline mt-0.5 block font-medium"
                              >
                                Ver Comprovante/Foto 📎
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0 font-mono font-bold">
                          <span className={isSale ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                            {isSale ? `+ R$ ${parseFloat(tx.amount).toFixed(2).replace('.', ',')}` : `- R$ ${parseFloat(tx.amount).toFixed(2).replace('.', ',')}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Rodapé do Modal: Excluir Cliente */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between transition-colors">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors btn-smooth"
          >
            <Trash2 size={14} />
            <span>Excluir Cliente</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors btn-smooth"
          >
            Fechar Ficha
          </button>
        </div>

        {/* Modal de Confirmação de Exclusão */}
        <window.ConfirmModal
          isOpen={showDeleteConfirm}
          title="Excluir Cliente"
          message={`Tem certeza que deseja remover o cadastro de ${client.name}?\nO histórico de compras e pagamentos será apagado.`}
          confirmText="Sim, Excluir"
          cancelText="Cancelar"
          variant="danger"
          onConfirm={() => {
            window.AppState.deleteClient(client.id);
            setShowDeleteConfirm(false);
            onClose();
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />

        {/* Modal de Entrega do Recibo de Fiado (WhatsApp / Download / Cópia) */}
        {pdfModalData && (
          <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-2xl animate-pop-in">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Recibo de Fiado Gerado!</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-300 mt-1 leading-relaxed">
                    O comprovante com o histórico de compras e saldo devedor de {client.name} está pronto para envio.
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleSendTextReceiptViaWhatsApp}
                  className="w-full py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-md btn-smooth"
                >
                  <MessageCircle size={16} />
                  <span>📲 Enviar Recibo no WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyTextReceipt}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors btn-smooth"
                >
                  📋 Copiar Texto do Extrato
                </button>

                <button
                  type="button"
                  onClick={() => setPdfModalData(null)}
                  className="w-full py-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white text-center transition-colors btn-smooth"
                >
                  Concluído / Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Genérico de Feedback */}
        <window.ConfirmModal
          isOpen={feedbackModal.isOpen}
          title={feedbackModal.title}
          message={feedbackModal.message}
          confirmText="Entendi"
          variant={feedbackModal.variant}
          showCancel={false}
          onConfirm={() => setFeedbackModal({ ...feedbackModal, isOpen: false })}
        />

        {/* Modal de Foto/Comprovante Anexo */}
        {showPhotoModal && (
          <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/90 animate-fadeIn" onClick={() => setShowPhotoModal(null)}>
            <div className="relative max-w-sm max-h-[80vh] rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-2xl animate-pop-in" onClick={e => e.stopPropagation()}>
              <img src={showPhotoModal} alt="Comprovante" className="w-full h-auto object-contain max-h-[70vh]" />
              <button
                onClick={() => setShowPhotoModal(null)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
