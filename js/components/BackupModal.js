/**
 * Modal de Backup Seguro e Sincronização
 * Permite exportar (copiar código, compartilhar no WhatsApp, baixar arquivo .txt)
 * e restaurar dados facilmente no celular ou computador sem depender de seletor de arquivos.
 */

window.BackupModal = function BackupModal({ isOpen, onClose, isVip, onTriggerPaywall }) {
  const [activeTab, setActiveTab] = React.useState('export'); // 'export' | 'restore'
  const [copiedCode, setCopiedCode] = React.useState(false);
  const [showRawCode, setShowRawCode] = React.useState(false);
  const [pastedJson, setPastedJson] = React.useState('');
  const [confirmRestoreData, setConfirmRestoreData] = React.useState(null);
  const [feedbackDialog, setFeedbackDialog] = React.useState({ isOpen: false, title: '', message: '', variant: 'info', onConfirm: null });

  const fileInputRef = React.useRef(null);
  const { X, Cloud, Download, Upload, ShieldCheck, Lock, Copy, Check, Share2, FileText, CheckCircle2, AlertTriangle } = window.Icons || {};

  window.useModalHistory(isOpen, onClose, 'backupMainModal');
  window.useModalHistory(feedbackDialog.isOpen, () => setFeedbackDialog(prev => ({ ...prev, isOpen: false })), 'backupFeedback');
  window.useModalHistory(!!confirmRestoreData, () => setConfirmRestoreData(null), 'backupConfirmRestore');

  if (!isOpen) return null;

  // Utilitário robusto para copiar texto no navegador e WebView Android
  const copyToClipboard = async (text) => {
    let success = false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        success = true;
      } catch (e) {
        console.warn('Clipboard API error, trying execCommand fallback:', e);
      }
    }
    if (!success) {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, 99999);
        success = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch (e) {
        console.error('execCommand copy failed:', e);
      }
    }
    return success;
  };

  // 1. Copiar Código de Backup para a Área de Transferência
  const handleCopyBackupCode = async () => {
    if (!isVip) {
      onTriggerPaywall('backup');
      return;
    }
    const code = window.AppState.getBackupJsonString();
    await copyToClipboard(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 4000);

    setFeedbackDialog({
      isOpen: true,
      title: 'Código Copiado com Sucesso!',
      message: 'O código de backup de todos os seus dados foi copiado para a memória do seu celular!\n\n' +
               '1. Abra o WhatsApp e cole em uma conversa com você mesmo (ou salve no bloco de notas).\n' +
               '2. No novo celular, abra este aplicativo, vá na aba "Restaurar" e cole o código.',
      variant: 'success'
    });
  };

  // 2. Compartilhar Código como Mensagem de Texto no WhatsApp
  const handleShareWhatsApp = async () => {
    if (!isVip) {
      onTriggerPaywall('backup');
      return;
    }
    const code = window.AppState.getBackupJsonString();
    await copyToClipboard(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 4000);

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Backup CadernoFiado',
          text: code
        });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    setFeedbackDialog({
      isOpen: true,
      title: 'Código Copiado!',
      message: 'O código do backup foi copiado para a sua área de transferência!\n\nAbra o WhatsApp na conversa desejada, segure o dedo na caixa de mensagem e toque em "Colar".',
      variant: 'success'
    });
  };

  // 3. Exportar como Arquivo de Texto (.txt)
  const handleExportFile = async () => {
    if (!isVip) {
      onTriggerPaywall('backup');
      return;
    }
    try {
      const res = await window.AppState.exportBackup();
      if (!res || !res.success) {
        setFeedbackDialog({
          isOpen: true,
          title: 'Aviso',
          message: 'Não foi possível gerar o arquivo direto. Utilize a opção "Copiar Código de Backup".',
          variant: 'warning'
        });
        return;
      }

      setFeedbackDialog({
        isOpen: true,
        title: 'Arquivo de Backup Gerado!',
        message: `Arquivo "${res.filename}" gerado com sucesso!\n\n` +
                 `Como este é um arquivo de texto (.txt), você pode abri-lo facilmente no celular, Google Drive ou WhatsApp para copiar o código quando precisar.`,
        variant: 'success'
      });
    } catch (err) {
      setFeedbackDialog({ isOpen: true, title: 'Erro ao Exportar', message: err.message, variant: 'danger' });
    }
  };

  // 4. Colar da Área de Transferência
  const handlePasteFromClipboard = async () => {
    let pasted = false;
    if (navigator.clipboard && navigator.clipboard.readText) {
      try {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setPastedJson(text.trim());
          pasted = true;
        }
      } catch (err) {
        console.warn('readText clipboard blocked:', err);
      }
    }
    if (!pasted) {
      setFeedbackDialog({
        isOpen: true,
        title: 'Como Colar no Celular',
        message: 'Para colar no seu aparelho:\n\n1. Pressione e segure o dedo dentro da caixa de texto abaixo.\n2. Toque no botão "Colar" que aparecerá.',
        variant: 'info'
      });
    }
  };

  // 5. Validar e Solicitar Confirmação de Restauração
  const handlePromptRestore = () => {
    if (!pastedJson.trim()) {
      setFeedbackDialog({
        isOpen: true,
        title: 'Código Ausente',
        message: 'Por favor, cole o código do backup no campo de texto antes de prosseguir.',
        variant: 'warning'
      });
      return;
    }

    const validation = window.AppState.validateBackup(pastedJson);
    if (!validation.valid) {
      setFeedbackDialog({
        isOpen: true,
        title: 'Código Inválido',
        message: 'O código informado não é um backup válido do CadernoFiado:\n\n' + validation.error,
        variant: 'danger'
      });
      return;
    }

    setConfirmRestoreData(validation);
  };

  // 6. Confirmar e Aplicar a Restauração
  const handleConfirmRestore = () => {
    if (!confirmRestoreData || !confirmRestoreData.data) return;

    const res = window.AppState.restoreBackupData(confirmRestoreData.data);
    if (res && res.success) {
      const summary = confirmRestoreData.summary;
      setConfirmRestoreData(null);
      setFeedbackDialog({
        isOpen: true,
        title: 'Backup Restaurado com Sucesso!',
        message: `• ${summary.clientsCount} Clientes restaurados\n` +
                 `• ${summary.salesCount} Vendas recuperadas\n` +
                 `• Dívida total: R$ ${(summary.totalDebtCents / 100).toFixed(2)}\n\n` +
                 `Toque em OK para atualizar os dados no aplicativo.`,
        variant: 'success',
        onConfirm: () => window.location.reload()
      });
    } else {
      setFeedbackDialog({
        isOpen: true,
        title: 'Falha na Restauração',
        message: 'Falha ao gravar os dados: ' + (res?.error || 'Erro desconhecido.'),
        variant: 'danger'
      });
    }
  };

  // 7. Seleção de Arquivo (para Desktop / Computador)
  const handleFileSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        if (!content || !content.trim()) {
          setFeedbackDialog({ isOpen: true, title: 'Arquivo Vazio', message: 'O arquivo selecionado está vazio.', variant: 'warning' });
          return;
        }
        setPastedJson(content.trim());
        const validation = window.AppState.validateBackup(content);
        if (!validation.valid) {
          setFeedbackDialog({
            isOpen: true,
            title: 'Arquivo Inválido',
            message: 'O arquivo selecionado não contém um backup válido:\n\n' + validation.error,
            variant: 'danger'
          });
          return;
        }
        setConfirmRestoreData(validation);
      };
      reader.onerror = () => {
        setFeedbackDialog({ isOpen: true, title: 'Erro de Leitura', message: 'Não foi possível ler o arquivo selecionado.', variant: 'danger' });
      };
      reader.readAsText(file);
    } catch (err) {
      setFeedbackDialog({ isOpen: true, title: 'Erro', message: err.message, variant: 'danger' });
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-pop-in transition-colors">
        
        {/* Cabeçalho Premium */}
        <div className="p-4 sm:p-5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-start justify-between relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none"></div>
          
          <div className="flex items-center space-x-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-inner">
              <Cloud size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                Backup & Sincronização
                {!isVip && activeTab === 'export' && <Lock size={12} className="text-white/70" />}
              </h3>
              <p className="text-[11px] text-emerald-100 mt-0.5">Google Drive, WhatsApp & Celular</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-full text-white/70 hover:bg-white/20 hover:text-white transition-colors relative z-10">
            <X size={18} />
          </button>
        </div>

        {/* Segmented Control de Abas: Exportar vs Restaurar */}
        <div className="px-4 pt-3 pb-1 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div className="flex bg-slate-200/70 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('export')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'export'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Download size={14} />
              <span>1. Salvar Dados</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('restore')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'restore'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Upload size={14} />
              <span>2. Restaurar</span>
            </button>
          </div>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 hide-scrollbar">
          
          {/* ================= ABA 1: EXPORTAR / SALVAR ================= */}
          {activeTab === 'export' && (
            <div className="space-y-3.5 animate-fadeIn">
              
              <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/40 text-xs text-slate-700 dark:text-slate-300">
                <p className="leading-relaxed">
                  Gere uma cópia segura dos seus clientes e dívidas para guardar no <strong>WhatsApp</strong> ou transferir para um celular novo.
                </p>
              </div>

              {/* Botão Destaque Principal: Copiar Código (Zero Dependência de Arquivos) */}
              <button
                type="button"
                onClick={handleCopyBackupCode}
                className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {copiedCode ? <Check size={18} className="text-emerald-200" /> : <Copy size={18} />}
                <span>{copiedCode ? '✅ Código Copiado com Sucesso!' : 'Copiar Código do Backup'}</span>
              </button>
              <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 -mt-1 leading-tight">
                Recomendado para celular: copie e cole em uma mensagem do WhatsApp para guardar com segurança.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {/* Botão Compartilhar WhatsApp */}
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700"
                >
                  <Share2 size={15} className="text-emerald-600 dark:text-emerald-400" />
                  <span>WhatsApp</span>
                </button>

                {/* Botão Baixar Arquivo .txt */}
                <button
                  type="button"
                  onClick={handleExportFile}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700"
                >
                  <FileText size={15} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Arquivo .txt</span>
                </button>
              </div>

              {/* Opção de Visualizar Código Diretamente na Tela */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRawCode(!showRawCode)}
                  className="w-full text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline py-1"
                >
                  {showRawCode ? '▲ Ocultar código na tela' : '▼ Ver código de backup na tela'}
                </button>

                {showRawCode && (
                  <div className="mt-2 space-y-2 animate-fadeIn">
                    <textarea
                      readOnly
                      value={window.AppState.getBackupJsonString()}
                      rows={4}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-300 select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopyBackupCode}
                      className="w-full py-2 rounded-xl bg-slate-800 dark:bg-slate-700 text-white text-xs font-bold hover:bg-slate-700 transition-colors"
                    >
                      Copiar Todo o Código
                    </button>
                  </div>
                )}
              </div>

              {!isVip && (
                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl text-xs text-amber-800 dark:text-amber-300 text-center space-y-1">
                  <p className="font-semibold flex items-center justify-center gap-1.5">
                    <ShieldCheck size={14} /> Recurso Exclusivo VIP
                  </p>
                  <p className="text-[11px] opacity-90">
                    O backup garante que você nunca perca o controle dos seus clientes e fiados.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ================= ABA 2: RESTAURAR / RECUPERAR ================= */}
          {activeTab === 'restore' && (
            <div className="space-y-3.5 animate-fadeIn">
              
              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Cole o código de backup gerado no seu celular antigo para restaurar seus clientes, fiados e plano VIP.
              </div>

              {/* Botões de Apoio para Colar */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="py-1.5 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                >
                  <Copy size={13} />
                  <span>Colar da Área de Transferência</span>
                </button>

                {pastedJson && (
                  <button
                    type="button"
                    onClick={() => setPastedJson('')}
                    className="text-[11px] text-rose-500 hover:underline font-medium"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {/* Caixa de Texto Principal */}
              <div>
                <textarea
                  value={pastedJson}
                  onChange={e => setPastedJson(e.target.value)}
                  placeholder="Pressione e segure aqui para colar o código de backup..."
                  rows={5}
                  className="w-full p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Botão de Ação: Restaurar Dados */}
              <button
                type="button"
                onClick={handlePromptRestore}
                className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Upload size={18} />
                <span>Restaurar Dados Agora</span>
              </button>

              {/* Seção Secundária: Para Usuários no Computador */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="text-center">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-2">
                    Ou selecione um arquivo se estiver no computador:
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <FileText size={14} />
                    <span>Selecionar arquivo .txt ou .json</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.json,text/plain,application/json"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    (No celular, utilize o campo de colar código acima)
                  </p>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* Confirmação de Substituição de Dados pelo Backup */}
      <window.ConfirmModal
        isOpen={!!confirmRestoreData}
        title="Restaurar Este Backup?"
        message={confirmRestoreData ? (
          `Os dados contidos no backup serão aplicados neste aparelho:\n\n` +
          `• ${confirmRestoreData.summary?.clientsCount || 0} Clientes cadastrados\n` +
          `• ${confirmRestoreData.summary?.salesCount || 0} Vendas / parcelas\n` +
          `• R$ ${((confirmRestoreData.summary?.totalDebtCents || 0) / 100).toFixed(2)} em dívidas registradas\n\n` +
          `Deseja realmente substituir os dados atuais por este backup?`
        ) : ''}
        confirmText="Sim, Restaurar Dados"
        cancelText="Cancelar"
        variant="warning"
        onConfirm={handleConfirmRestore}
        onCancel={() => setConfirmRestoreData(null)}
      />

      {/* Modal de Feedback Integrado */}
      <window.ConfirmModal
        isOpen={feedbackDialog.isOpen}
        title={feedbackDialog.title}
        message={feedbackDialog.message}
        confirmText="OK"
        variant={feedbackDialog.variant}
        showCancel={false}
        onConfirm={() => {
          const cb = feedbackDialog.onConfirm;
          setFeedbackDialog(prev => ({ ...prev, isOpen: false }));
          if (typeof cb === 'function') {
            cb();
          }
        }}
      />
    </div>
  );
};
