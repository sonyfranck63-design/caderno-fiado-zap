/**
 * Modal & Instruções de Instalação do Aplicativo (PWA)
 * Suporte completo para Android (instalação nativa direta) e iOS (Safari Tela de Início)
 */

window.InstallPwaModal = function InstallPwaModal({ isOpen, onClose }) {
  const [installPrompt, setInstallPrompt] = React.useState(() => window.__deferredInstallPrompt);
  const [installed, setInstalled] = React.useState(false);

  const { X, Download, Smartphone, Check, Sparkles, Share, PlusSquare } = window.Icons;

  React.useEffect(() => {
    const handlePrompt = () => {
      setInstallPrompt(window.__deferredInstallPrompt);
    };
    window.__onPwaInstallAvailable = handlePrompt;
    return () => {
      window.__onPwaInstallAvailable = null;
    };
  }, []);

  if (!isOpen) return null;

  // Detecta se é dispositivo iOS (iPhone / iPad)
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  const handleInstallClick = async () => {
    if (window.__deferredInstallPrompt) {
      window.__deferredInstallPrompt.prompt();
      const { outcome } = await window.__deferredInstallPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
        window.__deferredInstallPrompt = null;
        setInstallPrompt(null);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 overflow-hidden">
        
        {/* Detalhe de iluminação de fundo */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-brand-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Botão de Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        {/* Cabeçalho do Modal */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 p-0.5 shadow-glow-emerald flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <span className="text-2xl">📲</span>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Instalar CadernoFiado
            </h2>
            <p className="text-xs text-slate-400">
              Tenha o app direto na sua tela inicial
            </p>
          </div>
        </div>

        {/* Benefícios da instalação */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 mb-5 space-y-2.5">
          <div className="flex items-center space-x-2.5 text-xs text-slate-300">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">✓</span>
            <span><strong>100% Offline:</strong> Funciona mesmo sem sinal de internet.</span>
          </div>
          <div className="flex items-center space-x-2.5 text-xs text-slate-300">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">✓</span>
            <span><strong>Acesso Instantâneo:</strong> Abra direto pelo ícone sem digitar link.</span>
          </div>
          <div className="flex items-center space-x-2.5 text-xs text-slate-300">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">✓</span>
            <span><strong>Sem Ocupar Memória:</strong> Super leve e não trava o seu celular.</span>
          </div>
        </div>

        {/* Bloco de Ação / Instruções conforme dispositivo */}
        {installed ? (
          <div className="text-center py-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-emerald-300 font-semibold text-sm flex items-center justify-center gap-2">
            <Check size={18} />
            Aplicativo instalado com sucesso!
          </div>
        ) : isIos ? (
          /* Instruções para iPhone / Safari */
          <div className="space-y-3 bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 text-xs text-slate-300">
            <p className="font-semibold text-amber-300 flex items-center gap-1.5 text-sm">
              <span>🍎</span> No iPhone ou iPad (Safari):
            </p>
            <ol className="space-y-2 list-decimal list-inside pl-1 text-slate-300">
              <li>Toque no botão <strong>Compartilhar</strong> (ícone com quadrado e seta para cima).</li>
              <li>Role as opções e toque em <strong>"Adicionar à Tela de Início"</strong>.</li>
              <li>Toque em <strong>"Adicionar"</strong> no canto superior direito.</li>
            </ol>
          </div>
        ) : installPrompt ? (
          /* Botão Direto para Android / Chrome / Edge */
          <button
            onClick={handleInstallClick}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-brand-500 to-emerald-600 hover:from-brand-600 hover:to-emerald-700 text-slate-950 font-bold rounded-2xl shadow-glow-emerald flex items-center justify-center space-x-2 transition-all transform active:scale-95 text-sm"
          >
            <Download size={18} />
            <span>Instalar Aplicativo Agora</span>
          </button>
        ) : (
          /* Instruções Genéricas / Menu do Navegador */
          <div className="space-y-3 bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 text-xs text-slate-300">
            <p className="font-semibold text-white flex items-center gap-1.5 text-sm">
              <span>🤖</span> Como adicionar à sua tela inicial:
            </p>
            <ol className="space-y-2 list-decimal list-inside pl-1 text-slate-300">
              <li>Toque nos <strong>três pontinhos (⋮)</strong> no canto superior do navegador.</li>
              <li>Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</li>
              <li>Confirme para criar o atalho com o ícone do CadernoFiado.</li>
            </ol>
          </div>
        )}

        <div className="mt-4 text-center">
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors font-medium"
          >
            Continuar no navegador
          </button>
        </div>

      </div>
    </div>
  );
};
