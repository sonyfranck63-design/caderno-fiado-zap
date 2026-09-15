/**
 * Modal de Cobrança PIX Automática (Padrão Banco Central / EMVCo)
 * QR Code dinâmico gerado no cliente + Código Copia e Cola com 1 clique e envio rápido no Zap.
 */

window.PixModal = function PixModal({ isOpen, onClose, client, shopSettings, onOpenWhatsApp }) {
  const [copied, setCopied] = React.useState(false);
  const [pixPayload, setPixPayload] = React.useState('');
  const qrRef = React.useRef(null);
  const { X, QrCode, Copy, Check, MessageCircle, Crown, ShieldCheck, Sparkles } = window.Icons;

  if (!isOpen || !client) return null;

  const debt = window.AppState.computeBalance(client);
  const formattedDebt = `R$ ${debt.toFixed(2).replace('.', ',')}`;

  // Gera o payload oficial do PIX e renderiza o QR Code
  React.useEffect(() => {
    if (!isOpen || !client) return;

    try {
      const payload = window.PixService.generatePayload({
        pixKey: shopSettings?.pixKey || '11987650000',
        merchantName: shopSettings?.shopName || 'MEU COMERCIO',
        merchantCity: shopSettings?.city || 'BRASIL',
        amount: debt,
        txid: `F${client.id.replace(/\D/g, '').slice(-6)}`
      });

      setPixPayload(payload);

      // Renderiza o QR Code após o elemento estar no DOM
      setTimeout(() => {
        if (qrRef.current) {
          window.PixService.renderQRCode(qrRef.current, payload, 190);
        }
      }, 50);
    } catch(err) {
      console.error('Erro ao gerar payload PIX:', err);
    }
  }, [isOpen, client, debt, shopSettings]);

  const handleCopy = () => {
    if (!pixPayload) return;
    navigator.clipboard.writeText(pixPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Cabeçalho VIP com Destaque Dourado */}
        <div className="p-4 bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/50 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-glow-gold">
              <Crown size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-1">
                Cobrança Instantânea <span className="text-amber-400 font-extrabold text-[11px] px-1.5 py-0.5 rounded bg-amber-500/20">PIX</span>
              </h3>
              <p className="text-xs text-slate-300">{client.name}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-4 space-y-4">
          
          {/* Card do Valor Total da Cobrança */}
          <div className="bg-gradient-to-br from-slate-950 to-slate-900 p-3.5 rounded-2xl border border-slate-800 text-center shadow-inner relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Valor Exato a Receber
            </span>
            <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">
              {formattedDebt}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-center gap-1.5">
              <span>Chave: <strong>{shopSettings?.pixKey || 'Não cadastrada'}</strong></span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-medium">Sem taxas intermediárias</span>
            </div>
          </div>

          {/* QR Code Oficial */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative p-3 bg-white rounded-3xl shadow-xl border-4 border-slate-800 flex items-center justify-center">
              {/* Linha animada de scanner */}
              <div className="absolute inset-x-3 top-3 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-scanline pointer-events-none" />
              <div ref={qrRef} className="w-[190px] h-[190px] flex items-center justify-center" />
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-2 flex items-center gap-1 font-medium">
              <ShieldCheck size={14} className="text-emerald-400" />
              Padrão Oficial Banco Central do Brasil (EMVCo)
            </p>
          </div>

          {/* Código PIX Copia e Cola */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                Código PIX Copia e Cola:
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold"
              >
                {copied ? 'Copiado!' : 'Copiar código'}
              </button>
            </div>
            <div className="relative flex items-center">
              <input
                type="text"
                readOnly
                value={pixPayload || 'Gerando código PIX...'}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl py-2.5 pl-3 pr-20 text-xs text-slate-300 font-mono select-all focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={handleCopy}
                className="absolute right-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1 shadow-md transition-all active:scale-95"
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
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-glow-emerald flex items-center justify-center space-x-2 transition-all transform active:scale-95"
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
