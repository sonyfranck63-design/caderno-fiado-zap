/**
 * Modal de Backup Seguro e Sincronização em Nuvem (Google Drive)
 * Permite backup automático com Google Drive (1-clique),
 * além de exportação e restauração manuais (WhatsApp, código e arquivo .txt).
 */

window.BackupModal = function BackupModal({ isOpen, onClose, isVip, onTriggerPaywall }) {
  const [activeTab, setActiveTab] = React.useState('drive'); // 'drive' | 'export' | 'restore'
  const [copiedCode, setCopiedCode] = React.useState(false);
  const [showRawCode, setShowRawCode] = React.useState(false);
  const [pastedJson, setPastedJson] = React.useState('');
  const [confirmRestoreData, setConfirmRestoreData] = React.useState(null);
  const [feedbackDialog, setFeedbackDialog] = React.useState({ isOpen: false, title: '', message: '', variant: 'info', onConfirm: null });

  // Estados do Google Drive
  const [driveStatus, setDriveStatus] = React.useState(() => {
    return window.AppState && typeof window.AppState.getGoogleDriveStatus === 'function'
      ? window.AppState.getGoogleDriveStatus()
      : { configured: false, connected: false, user: null, lastSync: null, autoSyncEnabled: true, clientId: '' };
  });
  const [isDriveConnecting, setIsDriveConnecting] = React.useState(false);
  const [isDriveSyncing, setIsDriveSyncing] = React.useState(false);
  const [isDriveRestoring, setIsDriveRestoring] = React.useState(false);
  const [showDriveConfig, setShowDriveConfig] = React.useState(false);
  const [customClientId, setCustomClientId] = React.useState(() => {
    return (window.AppState && typeof window.AppState.getGoogleDriveStatus === 'function'
      ? window.AppState.getGoogleDriveStatus().clientId
      : '') || '';
  });

  const fileInputRef = React.useRef(null);
  const { X, Cloud, Download, Upload, ShieldCheck, Lock, Copy, Check, Share2, FileText, CheckCircle2, AlertTriangle, RefreshCw, Google } = window.Icons || {};

  window.useModalHistory(isOpen, onClose, 'backupMainModal');
  window.useModalHistory(feedbackDialog.isOpen, () => setFeedbackDialog(prev => ({ ...prev, isOpen: false })), 'backupFeedback');
  window.useModalHistory(!!confirmRestoreData, () => setConfirmRestoreData(null), 'backupConfirmRestore');

  // Subscrever a alterações no estado para atualizar status do Drive em tempo real
  React.useEffect(() => {
    if (!window.AppState || typeof window.AppState.subscribe !== 'function') return;
    const unsub = window.AppState.subscribe(() => {
      if (typeof window.AppState.getGoogleDriveStatus === 'function') {
        const st = window.AppState.getGoogleDriveStatus();
        setDriveStatus(st);
        if (!customClientId && st.clientId) {
          setCustomClientId(st.clientId);
        }
      }
    });
    return unsub;
  }, []);

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

  // --- AÇÕES DO GOOGLE DRIVE ---
  const handleConnectDrive = async () => {
    if (!isVip) {
      onTriggerPaywall('backup');
      return;
    }

    setIsDriveConnecting(true);
    try {
      const res = await window.AppState.connectGoogleDrive(customClientId ? customClientId.trim() : null);
      if (res && res.success) {
        setFeedbackDialog({
          isOpen: true,
          title: 'Google Drive Conectado!',
          message: `Conta ${res.user?.email || 'Google'} conectada com sucesso!\n\nSeu primeiro backup em nuvem já foi salvo de forma automática. Todas as futuras alterações serão sincronizadas silenciosamente.`,
          variant: 'success'
        });
      }
    } catch (err) {
      setFeedbackDialog({
        isOpen: true,
        title: 'Conexão Google Drive',
        message: err.message || 'Não foi possível conectar ao Google Drive.',
        variant: 'danger'
      });
    } finally {
      setIsDriveConnecting(false);
    }
  };

  const handleSyncDriveNow = async () => {
    if (!isVip) {
      onTriggerPaywall('backup');
      return;
    }
    setIsDriveSyncing(true);
    try {
      const res = await window.AppState.syncToGoogleDrive();
      if (res && res.success) {
        setFeedbackDialog({
          isOpen: true,
          title: 'Sincronizado com Sucesso!',
          message: 'Todos os seus clientes, vendas e pagamentos foram salvos no seu Google Drive com segurança.',
          variant: 'success'
        });
      }
    } catch (err) {
      setFeedbackDialog({
        isOpen: true,
        title: 'Erro na Sincronização',
        message: err.message === 'AUTH_EXPIRED'
          ? 'Sua sessão do Google expirou. Por favor, conecte novamente sua conta.'
          : ('Falha ao enviar backup: ' + err.message),
        variant: 'danger'
      });
    } finally {
      setIsDriveSyncing(false);
    }
  };

  const handleRestoreFromDrive = async () => {
    setIsDriveRestoring(true);
    try {
      const res = await window.AppState.restoreFromGoogleDrive();
      if (!res.valid) {
        setFeedbackDialog({
          isOpen: true,
          title: 'Backup Inválido',
          message: 'O arquivo encontrado no seu Google Drive está corrompido ou é inválido:\n' + res.error,
          variant: 'danger'
        });
        return;
      }
      setConfirmRestoreData(res);
    } catch (err) {
      setFeedbackDialog({
        isOpen: true,
        title: 'Falha ao Restaurar',
        message: err.message === 'AUTH_EXPIRED'
          ? 'Sua sessão do Google expirou. Conecte sua conta novamente.'
          : (err.message || 'Erro ao buscar backup do Google Drive.'),
        variant: 'danger'
      });
    } finally {
      setIsDriveRestoring(false);
    }
  };

  const handleDisconnectDrive = () => {
    window.AppState.disconnectGoogleDrive();
    setFeedbackDialog({
      isOpen: true,
      title: 'Google Drive Desconectado',
      message: 'Sua conta Google foi desvinculada deste aparelho. O backup automático em nuvem foi pausado.',
      variant: 'info'
    });
  };

  const handleSaveClientId = () => {
    if (window.AppState && typeof window.AppState.setGoogleDriveClientId === 'function') {
      window.AppState.setGoogleDriveClientId(customClientId.trim());
      setFeedbackDialog({
        isOpen: true,
        title: 'Configuração Salva',
        message: 'Google Client ID atualizado com sucesso.',
        variant: 'success'
      });
      setShowDriveConfig(false);
    }
  };

  // --- AÇÕES MANUAIS DE BACKUP ---
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
                {!isVip && activeTab === 'drive' && <Lock size={12} className="text-white/70" />}
              </h3>
              <p className="text-[11px] text-emerald-100 mt-0.5">Google Drive, WhatsApp & Celular</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-full text-white/70 hover:bg-white/20 hover:text-white transition-colors relative z-10">
            <X size={18} />
          </button>
        </div>

        {/* Segmented Control de Abas: Google Drive vs Exportar vs Restaurar */}
        <div className="px-3 pt-3 pb-1 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div className="flex bg-slate-200/70 dark:bg-slate-800/80 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('drive')}
              className={`flex-1 py-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                activeTab === 'drive'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Cloud size={13} />
              <span>Nuvem</span>
              {driveStatus.connected && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5"></span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('export')}
              className={`flex-1 py-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                activeTab === 'export'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Download size={13} />
              <span>Salvar</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('restore')}
              className={`flex-1 py-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                activeTab === 'restore'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Upload size={13} />
              <span>Restaurar</span>
            </button>
          </div>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 hide-scrollbar">
          
          {/* ================= ABA 0: GOOGLE DRIVE (NUVEM AUTOMÁTICA) ================= */}
          {activeTab === 'drive' && (
            <div className="space-y-4 animate-fadeIn">
              
              {driveStatus.connected ? (
                /* ESTADO CONECTADO */
                <div className="space-y-3.5">
                  {/* Card do Usuário Conectado */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800/60 shadow-sm">
                    <div className="flex items-center gap-3">
                      {driveStatus.user?.picture ? (
                        <img
                          src={driveStatus.user.picture}
                          alt="Google"
                          className="w-11 h-11 rounded-full border-2 border-emerald-500 shadow-sm object-cover"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-emerald-600 text-white font-black text-base flex items-center justify-center shadow-sm">
                          {(driveStatus.user?.name || driveStatus.user?.email || 'G')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                            Google Drive Conectado
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5">
                          {driveStatus.user?.name || 'Comerciante'}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {driveStatus.user?.email}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400">Último backup:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {driveStatus.lastSync
                          ? new Date(driveStatus.lastSync).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
                          : 'Pendente (ao salvar)'}
                      </span>
                    </div>
                  </div>

                  {/* Toggle de Auto-Sync */}
                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <div className="space-y-0.5 pr-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Backup Automático
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block leading-tight">
                        Salva no Drive a cada nova venda ou quitação
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={driveStatus.autoSyncEnabled}
                      onChange={(e) => {
                        if (window.AppState && typeof window.AppState.setGoogleDriveAutoSync === 'function') {
                          window.AppState.setGoogleDriveAutoSync(e.target.checked);
                        }
                      }}
                      className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 rounded-md"
                    />
                  </label>

                  {/* Botões de Ação para Conta Conectada */}
                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={handleSyncDriveNow}
                      disabled={isDriveSyncing}
                      className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      <RefreshCw size={15} className={isDriveSyncing ? 'animate-spin' : ''} />
                      <span>{isDriveSyncing ? 'Salvando no Drive...' : 'Sincronizar Agora no Drive'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRestoreFromDrive}
                      disabled={isDriveRestoring}
                      className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      <Download size={15} className={isDriveRestoring ? 'animate-bounce' : 'text-emerald-600 dark:text-emerald-400'} />
                      <span>{isDriveRestoring ? 'Baixando Dados...' : 'Restaurar Backup do Drive'}</span>
                    </button>
                  </div>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={handleDisconnectDrive}
                      className="text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 font-medium underline underline-offset-2"
                    >
                      Desconectar Conta Google
                    </button>
                  </div>
                </div>
              ) : (
                /* ESTADO DESCONECTADO */
                <div className="space-y-3.5">
                  <div className="p-3.5 bg-gradient-to-br from-blue-50 to-emerald-50/60 dark:from-slate-800/80 dark:to-slate-900 border border-blue-200/80 dark:border-slate-700/80 rounded-2xl text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto">
                      <Google size={26} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        Backup Automático em Nuvem
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        Conecte sua conta do Google Drive para que todas as suas vendas e clientes fiquem salvos <strong>automaticamente</strong> na sua própria nuvem.
                      </p>
                    </div>
                  </div>

                  {/* Vantagens em bullet points */}
                  <div className="space-y-2 px-1 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-start gap-2">
                      <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span><strong>100% Automático:</strong> Salva em segundo plano sem que você precise lembrar.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Lock size={16} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span><strong>Privacidade Total:</strong> Fica guardado na sua conta Google pessoal.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span><strong>Troca de Aparelho:</strong> Perdeu ou trocou de telefone? Basta conectar e recuperar tudo em 1 toque.</span>
                    </div>
                  </div>

                  {/* Botão de Conexão com Google */}
                  <button
                    type="button"
                    onClick={handleConnectDrive}
                    disabled={isDriveConnecting}
                    className="w-full py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border-2 border-slate-300 dark:border-slate-600 shadow-md active:scale-95 transition-all flex items-center justify-center gap-2.5 disabled:opacity-60"
                  >
                    <Google size={20} />
                    <span>{isDriveConnecting ? 'Conectando ao Google...' : 'Conectar com Google Drive'}</span>
                  </button>

                  {/* Opção Avançada de Client ID */}
                  <div className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={() => setShowDriveConfig(!showDriveConfig)}
                      className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline"
                    >
                      {showDriveConfig ? 'Ocultar Configuração Avançada' : '⚙️ Configurar Google Client ID'}
                    </button>
                  </div>

                  {showDriveConfig && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 animate-fadeIn text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300 block">
                        OAuth 2.0 Client ID (Google Cloud)
                      </span>
                      <input
                        type="text"
                        value={customClientId}
                        onChange={(e) => setCustomClientId(e.target.value)}
                        placeholder="ex: 123456789.apps.googleusercontent.com"
                        className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                      />
                      <button
                        type="button"
                        onClick={handleSaveClientId}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors text-xs"
                      >
                        Salvar Client ID
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* ================= ABA 1: EXPORTAR / SALVAR MANUAL ================= */}
          {activeTab === 'export' && (
            <div className="space-y-3.5 animate-fadeIn">
              
              <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/40 text-xs text-slate-700 dark:text-slate-300">
                <p className="leading-relaxed">
                  Gere uma cópia segura dos seus clientes e dívidas para guardar no <strong>WhatsApp</strong> ou transferir para um celular novo.
                </p>
              </div>

              {/* Botão Destaque Principal: Copiar Código */}
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
                  <span>Baixar Arquivo</span>
                </button>
              </div>

              {/* Pré-visualização do Código */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowRawCode(!showRawCode)}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline block mx-auto"
                >
                  {showRawCode ? 'Ocultar código de texto' : 'Ver código de texto bruto'}
                </button>

                {showRawCode && (
                  <div className="mt-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[10px] font-mono max-h-32 overflow-y-auto break-all select-all text-slate-600 dark:text-slate-400">
                    {window.AppState.getBackupJsonString()}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ================= ABA 2: RESTAURAR MANUAL ================= */}
          {activeTab === 'restore' && (
            <div className="space-y-3.5 animate-fadeIn">
              
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200/80 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="leading-tight">
                  A restauração substituirá todos os clientes e vendas atuais pelos dados do backup.
                </p>
              </div>

              {/* Opção Principal de Restauração: Colar Código */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Cole o código de backup aqui:
                  </label>
                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <Copy size={12} />
                    <span>Colar</span>
                  </button>
                </div>

                <textarea
                  value={pastedJson}
                  onChange={(e) => setPastedJson(e.target.value)}
                  placeholder="Cole aqui o código que você salvou no WhatsApp ou bloco de notas..."
                  rows={4}
                  className="w-full p-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                />

                <button
                  type="button"
                  onClick={handlePromptRestore}
                  disabled={!pastedJson.trim()}
                  className="w-full py-3 px-4 rounded-2xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 size={16} />
                  <span>Validar e Restaurar Dados</span>
                </button>
              </div>

              {/* Divisor */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800"></div></div>
                <div className="relative flex justify-center text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 px-2">
                  ou
                </div>
              </div>

              {/* Opção Alternativa: Carregar Arquivo de Texto */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5"
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
