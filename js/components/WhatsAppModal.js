/**
 * Modal de Cobrança Inteligente no WhatsApp
 * 4 tons de cobrança estratégicos (Amigável, Vence Hoje, Cobrança Firme e Acordo com Desconto).
 * Suporte a tema Claro/Escuro, micro-interações táteis e envio direto.
 */

window.WhatsAppModal = function WhatsAppModal({ isOpen, onClose, client, shopSettings, pixPayload }) {
  const [tone, setTone] = React.useState('amigavel');
  const [copied, setCopied] = React.useState(false);
  const [includePix, setIncludePix] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [customMessage, setCustomMessage] = React.useState('');

  const { X, MessageCircle, Copy, Check, QrCode, ShieldCheck, Sparkles, Phone } = window.Icons;

  if (!isOpen || !client) return null;

  const debt = window.AppState ? window.AppState.computeBalance(client) : 0;
  const formattedDebt = `R$ ${debt.toFixed(2).replace('.', ',')}`;
  const discountDebt = (debt * 0.95).toFixed(2).replace('.', ',');

  // Busca itens em aberto
  const openSales = (client.transactions || []).filter(t => t.type === 'sale');
  const itemsDescription = openSales.length > 0 
    ? openSales.map(s => s.description).filter(Boolean).slice(0, 3).join(', ')
    : 'compras no fiado';

  const nearestDueDate = openSales.length > 0 && openSales[0].dueDate 
    ? openSales[0].dueDate.split('-').reverse().join('/') 
    : 'data combinada';

  // Montagem do texto base conforme o tom
  let defaultMessage = '';
  if (tone === 'amigavel') {
    defaultMessage = `Oi, ${client.name}! Tudo bem com você? 😊\n\nPassando aqui de forma bem tranquila só para lembrar do nosso fechamento referente a: *${itemsDescription}* no valor de *${formattedDebt}*.\n\nSe puder me dar um retorno sobre o acerto para deixarmos tudo certinho, te agradeço muito! 🙏`;
  } else if (tone === 'hoje') {
    defaultMessage = `Olá, ${client.name}! Tudo bem?\n\nHoje é o dia que combinamos o acerto de *${formattedDebt}* (referente a *${itemsDescription}*).\n\nPosso te mandar a chave PIX ou prefere passar aqui para acertar? Um abraço! ✨`;
  } else if (tone === 'acordo') {
    defaultMessage = `Oi, ${client.name}! Tudo bem? 🏷️\n\nQuero te ajudar a quitar sua conta hoje: se você puder pagar hoje via PIX, consigo te dar 5% de desconto especial!\n\nDe *${formattedDebt}* fica apenas *R$ ${discountDebt}*.\n\nPodemos fechar assim? Me avisa aqui! 🤝`;
  } else {
    defaultMessage = `Olá, ${client.name}. Espero que esteja bem.\n\nConsta aqui no meu sistema um saldo em aberto de *${formattedDebt}* referente a *${itemsDescription}* (vencido em *${nearestDueDate}*).\n\nComo trabalho com capital de giro próprio e preciso honrar com meus fornecedores, peço a gentileza de regularizarmos essa pendência ainda hoje. Obrigado pela compreensão! 🤝`;
  }

  // Gera ou anexa o PIX caso habilitado
  let finalPixPayload = pixPayload;
  if (!finalPixPayload && includePix && shopSettings?.pixKey) {
    try {
      finalPixPayload = window.PixService.generatePayload({
        pixKey: shopSettings.pixKey,
        merchantName: shopSettings.shopName || 'MEU COMERCIO',
        merchantCity: shopSettings.city || 'BRASIL',
        amount: tone === 'acordo' ? (debt * 0.95) : debt,
        txid: `F${client.id ? client.id.replace(/\D/g, '').slice(-6) || '000001' : '000001'}`
      });
    } catch(e) {
      finalPixPayload = '';
    }
  }

  if (includePix && shopSettings?.pixKey) {
    defaultMessage += `\n\n🔑 *Chave PIX:* ${shopSettings.pixKey} (${shopSettings.pixType || 'Chave'})\n*Favorecido:* ${shopSettings.shopName || 'Estabelecimento'}`;
    if (finalPixPayload) {
      defaultMessage += `\n\n📲 *Código PIX Copia e Cola:*\n\`${finalPixPayload}\``;
    }
  }

  const activeMessage = isEditing ? customMessage : defaultMessage;

  const handleToneChange = (newTone) => {
    setTone(newTone);
    setIsEditing(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(activeMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-pop-in transition-colors">
        
        {/* Topo Elegante do Modal */}
        <div className="px-4 py-3.5 bg-emerald-50 dark:bg-gradient-to-r dark:from-emerald-950/80 dark:via-slate-900 dark:to-emerald-950/50 border-b border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between transition-colors">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-sm flex items-center justify-center">
              <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[14px] flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <MessageCircle size={20} />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                Cobrança WhatsApp <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/30">Turbo Zap</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-300">
                {client.name} • <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{formattedDebt}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors btn-smooth"
          >
            <X size={18} />
          </button>
        </div>

        {/* Conteúdo Rolável */}
        <div className="p-4 space-y-3.5 overflow-y-auto">
          
          {/* Seletor de 4 Estratégias de Cobrança */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Estratégia da Mensagem:
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {tone === 'amigavel' && '🌸 Mantém a boa relação'}
                {tone === 'hoje' && '📅 Lembrete de vencimento'}
                {tone === 'acordo' && '🏷️ 5% desc. p/ receber na hora'}
                {tone === 'firme' && '⚠️ Aviso formal de cobrança'}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => handleToneChange('amigavel')}
                className={`py-2 px-1 rounded-xl text-[11px] font-medium border text-center transition-all btn-smooth ${
                  tone === 'amigavel'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                Amigável
              </button>
              <button
                type="button"
                onClick={() => handleToneChange('hoje')}
                className={`py-2 px-1 rounded-xl text-[11px] font-medium border text-center transition-all btn-smooth ${
                  tone === 'hoje'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-300 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                Vence Hoje
              </button>
              <button
                type="button"
                onClick={() => handleToneChange('acordo')}
                className={`py-2 px-1 rounded-xl text-[11px] font-medium border text-center transition-all btn-smooth ${
                  tone === 'acordo'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-800 dark:text-amber-300 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                Desconto
              </button>
              <button
                type="button"
                onClick={() => handleToneChange('firme')}
                className={`py-2 px-1 rounded-xl text-[11px] font-medium border text-center transition-all btn-smooth ${
                  tone === 'firme'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-700 dark:text-rose-300 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                Firme
              </button>
            </div>
          </div>

          {/* Toggle Chave PIX */}
          {shopSettings?.pixKey && (
            <label className="flex items-center space-x-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer bg-slate-50 dark:bg-slate-950/70 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors">
              <input
                type="checkbox"
                checked={includePix}
                onChange={e => {
                  setIncludePix(e.target.checked);
                  setIsEditing(false);
                }}
                className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 w-4 h-4 bg-white dark:bg-slate-900 cursor-pointer"
              />
              <div className="flex-1">
                <span className="font-semibold text-slate-900 dark:text-white block">Anexar Chave PIX e Copia e Cola</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Facilita o cliente pagar sem sair do WhatsApp</span>
              </div>
              <QrCode size={18} className="text-emerald-600 dark:text-emerald-400" />
            </label>
          )}

          {/* Pré-visualização Autêntica do WhatsApp */}
          <div className="rounded-2xl border border-slate-300 dark:border-slate-800 overflow-hidden shadow-md">
            {/* Barra de Status do WhatsApp */}
            <div className="bg-[#1f2c34] px-3 py-2 flex items-center justify-between border-b border-[#2a3942]">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                  {client.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-semibold text-white leading-tight">{client.name}</p>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> online
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isEditing) setCustomMessage(defaultMessage);
                  setIsEditing(!isEditing);
                }}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium underline"
              >
                {isEditing ? 'Restaurar Padrão' : 'Editar Texto'}
              </button>
            </div>

            {/* Fundo da Conversa com Padrão WhatsApp */}
            <div className="wa-chat-container p-3.5 max-h-48 overflow-y-auto">
              {isEditing ? (
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full bg-[#005c4b] text-white p-3 rounded-2xl rounded-tr-none text-xs leading-relaxed border border-emerald-400/50 focus:outline-none focus:ring-1 focus:ring-emerald-400 resize-none h-36"
                  placeholder="Personalize sua mensagem aqui..."
                />
              ) : (
                <div className="wa-bubble-sent text-slate-100 p-3 text-xs whitespace-pre-wrap leading-relaxed">
                  {activeMessage}
                  <div className="text-[10px] text-emerald-200/80 text-right mt-1.5 flex items-center justify-end gap-1">
                    <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-cyan-300 font-bold">✓✓</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={handleCopy}
              className="py-3 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-white font-semibold text-xs border border-slate-300 dark:border-slate-700 flex items-center justify-center space-x-2 transition-all btn-smooth shadow-sm"
            >
              {copied ? (
                <>
                  <Check size={16} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400">Texto Copiado!</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copiar Mensagem</span>
                </>
              )}
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="py-3 px-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md flex items-center justify-center space-x-2 transition-all btn-smooth"
            >
              <MessageCircle size={17} />
              <span>Enviar no WhatsApp</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
