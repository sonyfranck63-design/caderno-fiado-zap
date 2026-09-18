/**
 * Modal de Backup Seguro e Sincronização
 * Recurso exclusivo VIP para exportar/importar dados JSON.
 */

window.BackupModal = function BackupModal({ isOpen, onClose, isVip, onTriggerPaywall }) {
  const [pasteBackupOpen, setPasteBackupOpen] = React.useState(false);
  const [pastedJson, setPastedJson] = React.useState('');
  const [feedbackDialog, setFeedbackDialog] = React.useState({ isOpen: false, title: '', message: '', variant: 'info' });
  
  const fileInputRef = React.useRef(null);
  const { X, Cloud, Download, Upload, ShieldCheck, Lock, Code } = window.Icons || {};

  window.useModalHistory(pasteBackupOpen, () => setPasteBackupOpen(false), 'backupPasteBackup');
  window.useModalHistory(feedbackDialog.isOpen, () => setFeedbackDialog(prev => ({ ...prev, isOpen: false })), 'backupFeedback');

  if (!isOpen) return null;

  // Exportar Backup
  const handleExportBackup = async () => {
    if (!isVip) {
      onTriggerPaywall('backup');
      return;
    }
    try {
      const res = await window.AppState.exportBackup();
      if (!res || !res.success) {
        setFeedbackDialog({
          isOpen: true,
          title: 'Aviso de Exportação',
          message: 'Não foi possível gerar o arquivo de backup. Tente usar a opção de copiar código se disponível.',
          variant: 'warning'
        });
        return;
      }
      
      if (res.method === 'share') {
        setFeedbackDialog({
          isOpen: true,
          title: 'Backup Compartilhado',
          message: `Arquivo "${res.filename}" enviado para a gaveta de compartilhamento!\n\nSelecione o Google Drive ou WhatsApp para salvar o arquivo com segurança na nuvem.`,
          variant: 'success'
        });
      } else if (res.method === 'raw_json' && res.rawJson) {
        // Fallback seguro: O dispositivo não suporta download nem share (ex: Android Antigo WebView)
        setPastedJson(res.rawJson);
        setPasteBackupOpen(true); // Abre o modal de "Colar" mas preenchido com o texto para ele Copiar!
        setFeedbackDialog({
          isOpen: true,
          title: 'Código Gerado!',
          message: 'Seu dispositivo bloqueou o download direto. O código do seu backup foi gerado e preenchido na tela. Copie TODO o texto e guarde-o em um lugar seguro (como uma mensagem para si mesmo no WhatsApp).',
          variant: 'warning'
        });
      } else {
        setFeedbackDialog({
          isOpen: true,
          title: 'Backup Salvo',
          message: `O arquivo "${res.filename}" foi baixado. Guarde-o em um local seguro!`,
          variant: 'success'
        });
      }
    } catch (err) {
      setFeedbackDialog({ isOpen: true, title: 'Erro ao Exportar', message: err.message, variant: 'danger' });
    }
  };

  // Restaurar Backup via FileReader + JSON.parse
  const handleFileSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!isVip) {
      e.target.value = '';
      onTriggerPaywall('backup');
      return;
    }

    try {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const fileContent = event.target.result;
          if (!fileContent || !fileContent.trim()) {
            setFeedbackDialog({ isOpen: true, title: 'Arquivo Vazio', message: 'O arquivo selecionado está vazio.', variant: 'warning' });
            return;
          }

          // 1. JSON.parse em try/catch conforme especificado
          let parsedData;
          try {
            parsedData = JSON.parse(fileContent);
          } catch (parseErr) {
            setFeedbackDialog({
              isOpen: true,
              title: 'Formato Inválido',
              message: 'Erro ao ler o arquivo: o conteúdo não é um JSON válido.\n' + parseErr.message,
              variant: 'danger'
            });
            return;
          }

          // 2. Validação da estrutura
          const validation = window.AppState.validateBackup(fileContent);
          if (!validation.valid) {
            setFeedbackDialog({
              isOpen: true,
              title: 'Arquivo Inválido',
              message: 'Arquivo de backup inválido:\n' + validation.error,
              variant: 'danger'
            });
            return;
          }

          // 3. Injeção dos dados restaurados no localStorage / AppState
          const res = window.AppState.restoreBackupData(validation.data || parsedData);
          if (res && res.success) {
            const clientsCount = validation.summary?.clientsCount || (parsedData.clients?.length || 0);
            const salesCount = validation.summary?.salesCount || 0;
            
            // 4. Diálogo de sucesso antes de recarregar
            setFeedbackDialog({
              isOpen: true,
              title: 'Backup Restaurado com Sucesso!',
              message: `• ${clientsCount} Clientes carregados\n• ${salesCount} Vendas recuperadas\n\nToque em OK para atualizar os dados no aplicativo.`,
              variant: 'success',
              onConfirm: () => window.location.reload()
            });
          } else {
            setFeedbackDialog({
              isOpen: true,
              title: 'Falha na Restauração',
              message: 'Falha ao restaurar dados: ' + (res?.error || 'Erro desconhecido ao salvar.'),
              variant: 'danger'
            });
          }
        } catch (innerErr) {
          console.error('Erro ao processar backup:', innerErr);
          setFeedbackDialog({
            isOpen: true,
            title: 'Erro de Leitura',
            message: 'Erro ao processar dados do arquivo: ' + innerErr.message,
            variant: 'danger'
          });
        }
      };

      reader.onerror = (readErr) => {
        setFeedbackDialog({
          isOpen: true,
          title: 'Erro no Dispositivo',
          message: 'Erro ao ler o arquivo no dispositivo: ' + (reader.error?.message || 'Falha de leitura.'),
          variant: 'danger'
        });
      };

      reader.readAsText(file);
    } catch (err) {
      setFeedbackDialog({
        isOpen: true,
        title: 'Erro Inesperado',
        message: 'Erro inesperado: ' + err.message,
        variant: 'danger'
      });
    } finally {
      e.target.value = '';
    }
  };

  // Contingência: Restaurar via texto colado
  const handleRestorePastedText = () => {
    if (!pastedJson.trim()) {
      setFeedbackDialog({
        isOpen: true,
        title: 'Código Ausente',
        message: 'Cole o código JSON do seu backup antes de confirmar.',
        variant: 'warning'
      });
      return;
    }

    try {
      JSON.parse(pastedJson);
      const validation = window.AppState.validateBackup(pastedJson);
      if (!validation.valid) {
        setFeedbackDialog({
          isOpen: true,
          title: 'Código Inválido',
          message: 'Código de backup inválido:\n' + validation.error,
          variant: 'danger'
        });
        return;
      }
      const res = window.AppState.restoreBackupData(validation.data);
      if (res && res.success) {
        setFeedbackDialog({
          isOpen: true,
          title: 'Backup Restaurado!',
          message: 'Backup restaurado com sucesso! O aplicativo será recarregado.',
          variant: 'success',
          onConfirm: () => window.location.reload()
        });
      } else {
        setFeedbackDialog({
          isOpen: true,
          title: 'Falha na Gravação',
          message: 'Falha ao restaurar: ' + (res?.error || 'Erro ao gravar dados.'),
          variant: 'danger'
        });
      }
    } catch (e) {
      setFeedbackDialog({
        isOpen: true,
        title: 'Código JSON Inválido',
        message: 'Código JSON inválido: ' + e.message,
        variant: 'danger'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-pop-in transition-colors">
        
        {/* Cabeçalho Premium */}
        <div className="p-5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-start justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          
          <div className="flex items-center space-x-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-inner">
              <Cloud size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                Backup de Segurança
                {!isVip && <Lock size={12} className="text-white/70" />}
              </h3>
              <p className="text-[11px] text-emerald-100 mt-0.5">Google Drive & WhatsApp</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-full text-white/70 hover:bg-white/20 hover:text-white transition-colors relative z-10">
            <X size={18} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-5 space-y-4 flex-1">
          
          <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/40 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
            <div className="flex items-start gap-2.5">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center mt-0.5">1</span>
              <p className="leading-snug">
                Clique em <strong>'Exportar Dados'</strong> para gerar o arquivo do seu caderno.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center mt-0.5">2</span>
              <p className="leading-snug">
                Compartilhe e salve esse arquivo no <strong>Google Drive</strong> ou no seu <strong>WhatsApp</strong>.
              </p>
            </div>
          </div>

          {/* Botões de Ação Principais */}
          <div className="space-y-3 pt-1">
            <button
              onClick={handleExportBackup}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-sm btn-smooth ${isVip ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700'}`}
            >
              <Download size={18} className={isVip ? '' : 'text-emerald-600'} />
              <span>Exportar Dados</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!isVip) onTriggerPaywall('backup');
                else setPasteBackupOpen(true);
              }}
              className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 transition-colors btn-smooth ${isVip ? 'bg-slate-800 hover:bg-slate-700 text-white shadow-sm' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 border border-slate-200'}`}
            >
              <Upload size={18} />
              <span>Restaurar Backup</span>
            </button>
          </div>

          {!isVip && (
            <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl text-xs text-amber-800 dark:text-amber-300 text-center">
              <p className="font-semibold flex items-center justify-center gap-1.5"><ShieldCheck size={14} /> Recurso Exclusivo VIP</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Restauração Aprimorado (Com suporte a Arquivo e Texto para Mobile/Web) */}
      {pasteBackupOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/90 animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-2xl animate-pop-in flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Upload size={18} className="text-emerald-600" />
                Restaurar Backup
              </h3>
              <button onClick={() => { setPasteBackupOpen(false); setPastedJson(''); }} className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 flex-1 hide-scrollbar pb-2">
              {/* Opção 1: Selecionar Arquivo (Funciona no PC) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Opção 1: Arquivo</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                  Se você está no PC ou seu celular suporta seleção, clique abaixo:
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors btn-smooth flex items-center justify-center gap-2"
                >
                  <Upload size={14} /> Selecionar arquivo .json
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json,text/plain"
                  onChange={(e) => {
                    handleFileSelect(e);
                    setPasteBackupOpen(false);
                  }}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Opção 2: Colar Texto (Garante funcionamento no Android WebView) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Opção 2: Copiar e Colar (WhatsApp)</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                  Se o botão acima não abrir nada no seu celular, siga os passos:<br/>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">1.</span> Abra o arquivo recebido no WhatsApp (usando Chrome ou leitor HTML).<br/>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">2.</span> Selecione e copie <b>todo</b> o texto do arquivo.<br/>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">3.</span> Cole o texto na caixa abaixo:
                </p>
                
                <textarea
                  value={pastedJson}
                  onChange={e => setPastedJson(e.target.value)}
                  placeholder="Cole o código do backup aqui..."
                  rows={4}
                  className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-800 dark:text-slate-300 focus:outline-none focus:border-emerald-500"
                />
                
                <button
                  type="button"
                  onClick={handleRestorePastedText}
                  className="w-full mt-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold btn-smooth shadow-sm"
                >
                  Restaurar Texto Colado
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Genérico de Feedback Integrado */}
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
