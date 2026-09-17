/**
 * Modal de Cobrança Inteligente no WhatsApp
 * Suporta cobrança específica por parcela de boca, venda avulsa ou débito total.
 * Envio direto com identificação clara e chave PIX proporcional.
 */

window.WhatsAppModal = function WhatsAppModal({
  isOpen,
  onClose,
  client,
  shopSettings,
  pixPayload,
  targetInstallment
}) {
  const [tone, setTone] = React.useState('amigavel');
  const [includePix, setIncludePix] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [customMessage, setCustomMessage] = React.useState('');

  const { X, MessageCircle, Check, QrCode } = window.Icons || {};

  if (!isOpen || !client) return null;

  // Se houver uma parcela ou venda específica selecionada, utiliza suas métricas exatas
  const hasTarget = !!targetInstallment;
  const chargeAmount = hasTarget
    ? (parseFloat(targetInstallment.remainingAmount) || 0)
    : (window.AppState ? window.AppState.computeBalance(client) : 0);

  const totalClientDebt = window.AppState ? window.AppState.computeBalance(client) : 0;
  const formattedTotalDebt = `R$ ${totalClientDebt.toFixed(2).replace('.', ',')}`;
  const formattedCharge = `R$ ${chargeAmount.toFixed(2).replace('.', ',')}`;
  const discountCharge = (chargeAmount * 0.95).toFixed(2).replace('.', ',');
  const shopName = shopSettings?.shopName || 'CadernoFiado Zap';

  // Montagem da mensagem base conforme a parcela e a estratégia selecionada
  let defaultMessage = '';

  if (hasTarget && targetInstallment.isInstallment) {
    // Cobrança de Parcela de Boca Específica (Seção 2.B)
    const current = targetInstallment.current;
    const total = targetInstallment.total;
    const desc = targetInstallment.baseDescription || 'Compra';
    const due = targetInstallment.dueDateFormatted || '-';
    const partialNotice = (targetInstallment.paidAmount > 0)
      ? ` (Restante de ${formattedCharge})`
      : '';

    if (tone === 'amigavel') {
      defaultMessage = `Olá, ${client.name}! Tudo bem? 👋\n\nPassando para lembrar da sua parcela na loja *${shopName}*:\n\n• Compra: ${desc}\n• Parcela: ${current}/${total}\n• Valor: ${formattedCharge}${partialNotice}\n• Vencimento: ${due}\n• Saldo total da conta: ${formattedTotalDebt}\n\nQualquer dúvida estou à disposição! Obrigado.`;
    } else if (tone === 'hoje') {
      defaultMessage = `Olá, ${client.name}! Tudo bem?\n\nLembrando que hoje é o vencimento da sua parcela na *${shopName}*:\n\n• Compra: ${desc}\n• Parcela: ${current}/${total}\n• Valor: ${formattedCharge}${partialNotice}\n• Vencimento: Hoje (${due})\n\nAssim que puder acertar, me envie o comprovante por aqui. Muito obrigado!`;
    } else if (tone === 'acordo') {
      defaultMessage = `Olá, ${client.name}! Tudo bem?\n\nCondição especial para adiantar sua parcela na *${shopName}*:\n\n• Compra: ${desc}\n• Parcela: ${current}/${total}\n• De ${formattedCharge} por apenas *R$ ${discountCharge}* no PIX hoje (5% de desconto à vista).\n\nSe quiser aproveitar essa condição, me avise por aqui!`;
    } else {
      defaultMessage = `Olá, ${client.name}.\n\nConsta em nosso sistema uma pendência referente à sua parcela na *${shopName}*:\n\n• Compra: ${desc}\n• Parcela: ${current}/${total}\n• Valor da parcela: ${formattedCharge}${partialNotice}\n• Vencimento: ${due}\n• Saldo total pendente: ${formattedTotalDebt}\n\nPedimos a gentileza de regularizar essa pendência para manter seu cadastro e limite ativos. Obrigado pela atenção.`;
    }

  } else if (hasTarget && !targetInstallment.isInstallment) {
    // Cobrança de Venda Avulsa Específica
    const desc = targetInstallment.baseDescription || 'Compra no fiado';
    const due = targetInstallment.dueDateFormatted || '-';
    const partialNotice = (targetInstallment.paidAmount > 0)
      ? ` (Restante de ${formattedCharge})`
      : '';

    if (tone === 'amigavel') {
      defaultMessage = `Olá, ${client.name}! Tudo bem? 👋\n\nPassando para te enviar o resumo da sua compra anotada na *${shopName}*:\n\n• Item: ${desc}\n• Valor: ${formattedCharge}${partialNotice}\n• Vencimento: ${due}\n• Saldo total da conta: ${formattedTotalDebt}\n\nQualquer dúvida fico à sua disposição!`;
    } else if (tone === 'hoje') {
      defaultMessage = `Olá, ${client.name}! Tudo bem?\n\nLembrando que hoje vence sua compra de *${desc}* no valor de *${formattedCharge}* na *${shopName}*.\n\nQualquer dúvida, pode me chamar por aqui. Obrigado!`;
    } else if (tone === 'acordo') {
      defaultMessage = `Olá, ${client.name}!\n\nCondição especial para quitação da sua compra de *${desc}* na *${shopName}*:\n\n• De ${formattedCharge} por apenas *R$ ${discountCharge}* no PIX hoje (5% de desconto).\n\nSe quiser aproveitar, me avise por aqui!`;
    } else {
      defaultMessage = `Olá, ${client.name}.\n\nConsta em aberto o saldo de *${formattedCharge}* referente a *${desc}* (vencimento: ${due}) na *${shopName}*.\n\nPedimos a gentileza de regularizarmos essa pendência. Obrigado pela atenção.`;
    }

  } else {
    // Cobrança Geral do Débito Total do Cliente
    const openSales = (client.transactions || []).filter(t => t.type === 'sale');
    const itemsDescription = openSales.length > 0 
      ? openSales.map(s => s.description).filter(Boolean).slice(0, 3).join(', ')
      : 'compras registradas';

    if (tone === 'amigavel') {
      defaultMessage = `Olá, ${client.name}! Tudo bem? 👋\n\nPassando para enviar o resumo atualizado da sua conta na *${shopName}*:\n\n• Compras: ${itemsDescription}\n• Saldo total em aberto: ${formattedCharge}\n\nQualquer dúvida fico à sua disposição!`;
    } else if (tone === 'hoje') {
      defaultMessage = `Olá, ${client.name}! Tudo bem?\n\nHoje é a data combinada para o acerto da sua conta na *${shopName}*:\n\n• Saldo a acertar: ${formattedCharge}\n\nPodemos acertar via PIX ou pessoalmente. Muito obrigado!`;
    } else if (tone === 'acordo') {
      defaultMessage = `Olá, ${client.name}! Tudo bem?\n\nCondição especial para quitar sua conta na *${shopName}* hoje:\n\n• De ${formattedCharge} por apenas *R$ ${discountCharge}* no PIX (5% de desconto à vista).\n\nSe puder aproveitar hoje, me confirma por aqui!`;
    } else {
      defaultMessage = `Olá, ${client.name}.\n\nConsta um saldo em aberto de *${formattedCharge}* na *${shopName}* referente a: ${itemsDescription}.\n\nSolicitamos a gentileza de regularizarmos essa pendência para manter seu cadastro sempre em dia. Obrigado pela compreensão.`;
    }
  }

  // Anexa somente a Chave PIX clara e objetiva (sem código copia e cola repetitivo/longo)
  const pixTargetAmount = tone === 'acordo' ? (chargeAmount * 0.95) : chargeAmount;

  if (includePix && shopSettings?.pixKey && pixTargetAmount > 0) {
    const keyTypeFormatted = shopSettings.pixKeyType ? ` (${shopSettings.pixKeyType})` : '';
    defaultMessage += `\n\nChave PIX: *${shopSettings.pixKey}*${keyTypeFormatted}\nFavorecido: *${shopSettings.shopName || 'Estabelecimento'}*`;
  }

  const activeMessage = isEditing ? customMessage : defaultMessage;

  const handleToneChange = (newTone) => {
    setTone(newTone);
    setIsEditing(false);
  };

  const handleSendWhatsApp = () => {
    let cleanPhone = (client.phone || '').replace(/\D/g, '');
    if (!cleanPhone.startsWith('55') && cleanPhone.length >= 10) {
      cleanPhone = '55' + cleanPhone;
    }
    const url = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(activeMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(activeMessage)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-pop-in transition-colors">
        
        {/* Topo Elegante e Minimalista */}
        <div className="px-5 py-4 bg-slate-50/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between transition-colors">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm flex-shrink-0">
              <MessageCircle size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {client.name}
                </h3>
                {hasTarget && targetInstallment.isInstallment && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                    Parcela {targetInstallment.current}/{targetInstallment.total}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Valor da cobrança: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formattedCharge}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-2 flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Conteúdo Rolável */}
        <div className="p-5 space-y-4 overflow-y-auto">
          
          {/* Seletor Segmentado Moderno (Estilo iOS / Linear) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tom da Cobrança
              </label>
              <span className="text-[11px] text-slate-400">
                {tone === 'amigavel' && 'Cordial e tranquilo'}
                {tone === 'hoje' && 'Lembrete no dia do vencimento'}
                {tone === 'acordo' && 'Desconto de 5% no PIX'}
                {tone === 'firme' && 'Notificação formal'}
              </span>
            </div>

            <div className="grid grid-cols-4 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/50 text-xs">
              <button
                type="button"
                onClick={() => handleToneChange('amigavel')}
                className={`py-1.5 rounded-lg font-medium transition-all text-center ${
                  tone === 'amigavel'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Amigável
              </button>
              <button
                type="button"
                onClick={() => handleToneChange('hoje')}
                className={`py-1.5 rounded-lg font-medium transition-all text-center ${
                  tone === 'hoje'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Vence Hoje
              </button>
              <button
                type="button"
                onClick={() => handleToneChange('acordo')}
                className={`py-1.5 rounded-lg font-medium transition-all text-center ${
                  tone === 'acordo'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Desconto
              </button>
              <button
                type="button"
                onClick={() => handleToneChange('firme')}
                className={`py-1.5 rounded-lg font-medium transition-all text-center ${
                  tone === 'firme'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Firme
              </button>
            </div>
          </div>

          {/* Toggle Chave PIX Discreto e Limpo */}
          {shopSettings?.pixKey && chargeAmount > 0 && (
            <label className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 cursor-pointer transition-colors hover:border-slate-300 dark:hover:border-slate-700">
              <input
                type="checkbox"
                checked={includePix}
                onChange={e => {
                  setIncludePix(e.target.checked);
                  setIsEditing(false);
                }}
                className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 w-4 h-4 bg-white dark:bg-slate-900 cursor-pointer"
              />
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-xs text-slate-900 dark:text-white block">
                  Incluir chave PIX na mensagem
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                  Chave: <span className="font-mono text-emerald-600 dark:text-emerald-400">{shopSettings.pixKey}</span>
                </span>
              </div>
              <QrCode size={16} className="text-slate-400 flex-shrink-0" />
            </label>
          )}

          {/* Pré-visualização Autêntica do WhatsApp */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            {/* Barra do Contato no WhatsApp */}
            <div className="bg-[#1f2c34] px-3.5 py-2.5 flex items-center justify-between border-b border-[#2a3942]">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-white text-[11px] font-bold">
                  {(client.name || 'C').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#e9edef] leading-tight">{client.name}</p>
                  <p className="text-[10px] text-emerald-400">online</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isEditing) setCustomMessage(defaultMessage);
                  setIsEditing(!isEditing);
                }}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium"
              >
                {isEditing ? 'Restaurar' : 'Editar texto'}
              </button>
            </div>

            {/* Balão de Mensagem Autêntico */}
            <div className="bg-[#0b141a] p-3.5 max-h-56 overflow-y-auto">
              {isEditing ? (
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full bg-[#005c4b] text-[#e9edef] p-3 rounded-2xl rounded-tr-none text-xs leading-relaxed border border-emerald-500/40 focus:outline-none resize-none h-44 font-sans"
                  placeholder="Edite a mensagem antes de enviar..."
                />
              ) : (
                <div className="bg-[#005c4b] text-[#e9edef] p-3.5 rounded-2xl rounded-tr-none text-xs whitespace-pre-wrap leading-relaxed shadow-sm">
                  {activeMessage}
                  <div className="text-[10px] text-emerald-200/70 text-right mt-1.5 flex items-center justify-end gap-1">
                    <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-[#53bdeb] font-bold">✓✓</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Botão de Ação Direta */}
          <div className="pt-1">
            <button
              onClick={handleSendWhatsApp}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-sm flex items-center justify-center space-x-2 transition-all active:scale-[0.99] btn-smooth"
            >
              <MessageCircle size={18} />
              <span>Abrir WhatsApp do Cliente</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

