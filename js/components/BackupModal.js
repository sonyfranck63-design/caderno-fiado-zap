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

        {/* Conteúdo com Orientação de UX Alinhada (Problema 3) */}
        <div className="p-5 space-y-4 flex-1">
          
          {/* Card com passos explicativos numerados */}
          <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/40 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
            <div className="flex items-start gap-2.5">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center mt-0.5">
                1
              </span>
              <p className="leading-snug">
                Clique em <strong>'Exportar Dados'</strong> para gerar o arquivo do seu caderno.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center mt-0.5">
                2
              </span>
              <p className="leading-snug">
                Compartilhe e salve esse arquivo no seu <strong>Google Drive</strong> ou mande para o seu próprio <strong>WhatsApp</strong>. Assim, seus dados ficam seguros na nuvem!
              </p>
            </div>
          </div>

          {/* Botões de Ação Principais (Problema 2) */}
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
                else fileInputRef.current?.click();
              }}
              className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 transition-colors btn-smooth ${isVip ? 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-500 border border-slate-200 dark:border-slate-800'}`}
            >
              <Upload size={18} />
              <span>Restaurar Backup</span>
            </button>

            {/* Input oculto sem display:none para garantir acionamento no Android WebView */}
            <input
              ref={fileInputRef}
              id="backup-file-input"
              type="file"
              accept=".json,application/json,text/plain"
              onChange={handleFileSelect}
              style={{ position: 'fixed', top: '-1000px', left: '-1000px', opacity: 0, width: '1px', height: '1px', pointerEvents: 'none' }}
            />
          </div>

          {/* Contingência: Colar Código */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                if (!isVip) onTriggerPaywall('backup');
                else setPasteBackupOpen(true);
              }}
              className="text-[11px] text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
            >
              <Code size={12} />
              <span>Restaurar colando código JSON</span>
            </button>
          </div>

          {!isVip && (
            <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl text-xs text-amber-800 dark:text-amber-300 text-center">
              <p className="font-semibold flex items-center justify-center gap-1.5"><ShieldCheck size={14} /> Recurso Exclusivo VIP</p>
              <p className="text-[10px] mt-1 opacity-90">Ative o plano VIP para liberar os backups seguros.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Contingência: Colar/Copiar Código JSON */}
      {pasteBackupOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-2xl animate-pop-in">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Código de Backup (JSON)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Copie o código abaixo para salvar, ou cole um código existente para restaurar:
            </p>
            <textarea
              value={pastedJson}
              onChange={e => setPastedJson(e.target.value)}
              placeholder="Cole o código JSON aqui..."
              rows={6}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
            />
            
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={async () => {
                  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.readText) {
                    try {
                      const text = await navigator.clipboard.readText();
                      if (text) {
                        setPastedJson(text);
                        return;
                      }
                    } catch(e) {
                      console.warn('Clipboard read failed:', e);
                    }
                  }
                }}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium btn-smooth"
              >
                Colar
              </button>
              <button
                type="button"
                onClick={async () => {
                  let copied = false;
                  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
                    try {
                      await navigator.clipboard.writeText(pastedJson);
                      copied = true;
                    } catch(e) {}
                  }
                  if (!copied) {
                    try {
                      const ta = document.createElement('textarea');
                      ta.value = pastedJson;
                      ta.style.position = 'fixed';
                      ta.style.left = '-9999px';
                      document.body.appendChild(ta);
                      ta.focus();
                      ta.select();
                      document.execCommand('copy');
                      document.body.removeChild(ta);
                      copied = true;
                    } catch(e) {}
                  }
                  setFeedbackDialog({
                    isOpen: true,
                    title: 'Código Copiado!',
                    message: 'O código de backup foi copiado com sucesso para a área de transferência.',
                    variant: 'success'
                  });
                }}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium btn-smooth"
              >
                Copiar
              </button>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setPasteBackupOpen(false); setPastedJson(''); }}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 text-xs font-medium btn-smooth"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={handleRestorePastedText}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold btn-smooth shadow-sm"
              >
                Restaurar
              </button>
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
