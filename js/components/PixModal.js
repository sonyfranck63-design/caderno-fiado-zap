/**
 * Modal de Cobrança PIX Automática (Padrão Banco Central / EMVCo)
 * QR Code dinâmico gerado no cliente + Código Copia e Cola com 1 clique e envio rápido no Zap.
 * z-index prioritário (z-[70]) para abrir na frente de qualquer modal.
 */

window.PixModal = function PixModal({ isOpen, onClose, client, shopSettings, onOpenWhatsApp }) {
  const [copied, setCopied] = React.useState(false);
  const [pixPayload, setPixPayload] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState(null);
  const qrRef = React.useRef(null);
  const timerRef = React.useRef(null);
  const { X, QrCode, Copy, Check, MessageCircle, Crown, ShieldCheck, Sparkles, AlertTriangle } = window.Icons || {};

  if (!isOpen || !client) return null;

  const debt = window.AppState ? window.AppState.computeBalance(client) : 0;
  const formattedDebt = `R$ ${debt.toFixed(2).replace('.', ',')}`;
  const hasCustomPixKey = !!shopSettings?.pixKey;

  // Gera o payload oficial do PIX e renderiza o QR Code
  React.useEffect(() => {
    if (!isOpen || !client) return;
    setErrorMsg(null);

    try {
      const payload = window.PixService.generatePayload({
        pixKey: shopSettings?.pixKey || '11987650000',
        merchantName: shopSettings?.shopName || 'MEU COMERCIO',
        merchantCity: shopSettings?.city || 'BRASIL',
        amount: debt,
        txid: `F${client.id ? client.id.replace(/\D/g, '').slice(-6) || '000001' : '000001'}`
      });

      setPixPayload(payload);

      // Renderiza o QR Code com cleanup seguro
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (qrRef.current) {
          qrRef.current.innerHTML = '';
          window.PixService.renderQRCode(qrRef.current, payload, 190);
        }
      }, 60);
    } catch(err) {
      console.error('Erro ao gerar payload PIX:', err);
      setErrorMsg('Não foi possível gerar o QR Code. Utilize os dados manuais abaixo.');
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isOpen, client, debt, shopSettings]);

  const handleCopy = () => {
    if (!pixPayload) return;
    try {
      navigator.clipboard.writeText(pixPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch(e) {
      console.warn('Clipboard writeText falhou:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/75 animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-pop-in transition-colors">
        
        {/* Cabeçalho VIP com Destaque Dourado */}
        <div className="p-4 bg-gradient-to-r from-amber-500/10 via-white to-amber-500/10 dark:from-amber-950/60 dark:via-slate-900 dark:to-amber-950/50 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-sm">
              <Crown size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1">
                Cobrança Instantânea <span className="text-amber-600 dark:text-amber-400 font-extrabold text-[11px] px-1.5 py-0.5 rounded bg-amber-500/20">PIX</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-300">{client.name}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors btn-smooth"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-4 space-y-4">
          
          {/* Alerta se não houver chave PIX cadastrada */}
          {!hasCustomPixKey && (
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle size={15} className="flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <strong className="block">Chave PIX padrão</strong>
                Cadastre sua chave PIX nas Configurações (⚙️) para o valor cair diretamente na sua conta.
              </div>
            </div>
          )}

          {/* Card do Valor Total da Cobrança */}
          <div className="bg-slate-50 dark:bg-gradient-to-br dark:from-slate-950 dark:to-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-inner relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Valor Exato a Receber
            </span>
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight font-mono">
              {formattedDebt}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center gap-1.5">
              <span>Chave: <strong>{shopSettings?.pixKey || 'Chave Teste'}</strong></span>
              <span className="text-slate-400 dark:text-slate-600">•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Sem intermediários</span>
            </div>
          </div>

          {/* QR Code Oficial */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative p-3 bg-white rounded-3xl shadow-lg border-4 border-slate-200 dark:border-slate-800 flex items-center justify-center">
              <div ref={qrRef} className="w-[190px] h-[190px] flex items-center justify-center">
                {errorMsg && (
                  <div className="text-center p-3 text-slate-500 text-xs">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Código PIX Pronto</p>
                    <p className="text-[10px] text-slate-400 mt-1">Copie o código Copia e Cola abaixo.</p>
                  </div>
                )}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mt-2 flex items-center gap-1 font-medium">
              <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
              Padrão Oficial Banco Central do Brasil (EMVCo)
            </p>
          </div>

          {/* Código PIX Copia e Cola */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Código PIX Copia e Cola:
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-semibold"
              >
                {copied ? 'Copiado!' : 'Copiar código'}
              </button>
            </div>
            <div className="relative flex items-center">
              <input
                type="text"
                readOnly
                value={pixPayload || 'Gerando código PIX...'}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-2xl py-2.5 pl-3 pr-20 text-xs text-slate-700 dark:text-slate-300 font-mono select-all focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={handleCopy}
                className="absolute right-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1 shadow-md transition-all active:scale-95 btn-smooth"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Pronto' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          {/* Ações Inferiores */}
          <div className="pt-1">
            <button
              onClick={() => {
                onClose();
                if (onOpenWhatsApp) {
                  onOpenWhatsApp(client, pixPayload);
                }
              }}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md flex items-center justify-center space-x-2 transition-all transform active:scale-95 btn-smooth"
            >
              <MessageCircle size={17} />
              <span>Enviar QR Code e Código no WhatsApp</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
