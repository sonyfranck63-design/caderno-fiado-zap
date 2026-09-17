/**
 * Modal de Configurações do Estabelecimento, Chave PIX e Backup de Dados
 * Identidade visual comercial com suporte a exportação e importação por texto e arquivo (à prova de falhas no celular).
 */

window.SettingsModal = function SettingsModal({ isOpen, onClose, shopSettings, onSaveSettings }) {
  const [formData, setFormData] = React.useState({ ...shopSettings });
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = React.useState(false);
  const [pasteBackupOpen, setPasteBackupOpen] = React.useState(false);
  const [pastedJson, setPastedJson] = React.useState('');
  const [feedbackDialog, setFeedbackDialog] = React.useState({ isOpen: false, title: '', message: '', variant: 'info' });
  
  const fileInputRef = React.useRef(null);
  const { X, Settings, Download, Upload, Check, Trash2, ShieldCheck, Store, Phone, QrCode, Copy, FileText } = window.Icons || {};

  const [confirmRestoreData, setConfirmRestoreData] = React.useState(null);

  React.useEffect(() => {
    if (isOpen) {
      setFormData({ ...shopSettings });
      setSaveSuccess(false);
    }
  }, [isOpen, shopSettings]);

  // Controle de histórico do botão/gesto Voltar do Android para subdiálogos (BUG 2)
  window.useModalHistory(confirmResetOpen, () => setConfirmResetOpen(false), 'settingsConfirmReset');
  window.useModalHistory(pasteBackupOpen, () => setPasteBackupOpen(false), 'settingsPasteBackup');
  window.useModalHistory(!!confirmRestoreData, () => setConfirmRestoreData(null), 'settingsConfirmRestore');
  window.useModalHistory(feedbackDialog.isOpen, () => setFeedbackDialog(prev => ({ ...prev, isOpen: false })), 'settingsFeedback');

  if (!isOpen) return null;

  const handleChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  const handleExportBackup = async () => {
    try {
      const res = await window.AppState.exportBackup();
      if (!res || !res.success) {
        setFeedbackDialog({
          isOpen: true,
          title: 'Aviso de Exportação',
          message: 'Não foi possível gerar o arquivo de backup. Tente a opção "Copiar Código".',
          variant: 'warning'
        });
        return;
      }
      if (res.method === 'share') {
        setFeedbackDialog({
          isOpen: true,
          title: 'Backup Compartilhado',
          message: `Arquivo "${res.filename}" gerado com ${res.clientCount} cliente(s) e ${res.salesCount} venda(s). O menu de compartilhamento do seu aparelho foi aberto para você salvar no WhatsApp, Drive ou Gerenciador de Arquivos.`,
          variant: 'success'
        });
      } else {
        setFeedbackDialog({
          isOpen: true,
          title: 'Backup Salvo',
          message: `Download do arquivo de backup iniciado com sucesso!\nArquivo: ${res.filename}\nContém: ${res.clientCount} cliente(s) e ${res.salesCount} venda(s)/parcela(s).`,
          variant: 'success'
        });
      }
    } catch (err) {
      setFeedbackDialog({
        isOpen: true,
        title: 'Erro ao Exportar',
        message: 'Ocorreu um erro durante a exportação: ' + err.message,
        variant: 'danger'
      });
    }
  };

  const handleCopyBackupText = () => {
    try {
      const jsonStr = window.AppState.getBackupJsonString();
      navigator.clipboard.writeText(jsonStr);
      setFeedbackDialog({
        isOpen: true,
        title: 'Código Copiado!',
        message: 'O código completo do seu backup foi copiado para a área de transferência! Você pode colar nas suas anotações ou enviar para você mesmo no WhatsApp.',
        variant: 'success'
      });
    } catch(err) {
      setFeedbackDialog({
        isOpen: true,
        title: 'Erro ao Copiar',
        message: 'Não foi possível copiar: ' + err.message,
        variant: 'danger'
      });
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const validation = window.AppState.validateBackup(event.target.result);
      if (!validation.valid) {
        setFeedbackDialog({
          isOpen: true,
          title: 'Arquivo Inválido',
          message: `O arquivo selecionado não é um backup válido do CadernoFiado:\n${validation.error}`,
          variant: 'danger'
        });
        return;
      }

      // Abre confirmação com resumo dos dados antes de sobrescrever
      setConfirmRestoreData(validation);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleRestorePastedText = () => {
    if (!pastedJson.trim()) {
      setFeedbackDialog({
        isOpen: true,
        title: 'Código Vazio',
        message: 'Cole o código JSON do seu backup antes de confirmar.',
        variant: 'warning'
      });
      return;
    }

    const validation = window.AppState.validateBackup(pastedJson);
    if (!validation.valid) {
      setFeedbackDialog({
        isOpen: true,
        title: 'Código de Backup Inválido',
        message: `Não foi possível ler o código colado:\n${validation.error}`,
        variant: 'danger'
      });
      return;
    }

    setPasteBackupOpen(false);
    // Abre confirmação com resumo dos dados antes de sobrescrever
    setConfirmRestoreData(validation);
  };

  const handleConfirmRestore = () => {
    if (!confirmRestoreData || !confirmRestoreData.data) return;
    const ok = window.AppState.restoreBackupData(confirmRestoreData.data);
    const summary = confirmRestoreData.summary;
    setConfirmRestoreData(null);
    setPastedJson('');

    if (ok) {
      setFeedbackDialog({
        isOpen: true,
        title: 'Backup Restaurado com Sucesso!',
        message: `Seus dados foram recuperados com sucesso!\n• Clientes: ${summary.clientsCount}\n• Vendas e Parcelas: ${summary.salesCount}\n• Pagamentos: ${summary.paymentsCount}\n• Saldo Devedor: R$ ${(summary.totalDebtCents / 100).toFixed(2)}`,
        variant: 'success'
      });
    } else {
      setFeedbackDialog({
        isOpen: true,
        title: 'Falha na Restauração',
        message: 'Ocorreu um erro ao gravar os dados restaurados no navegador.',
        variant: 'danger'
      });
    }
  };

  const handlePerformReset = () => {
    window.AppState.resetAll();
    setConfirmResetOpen(false);
    setFeedbackDialog({
      isOpen: true,
      title: 'Dados Limpos',
      message: 'Os dados foram restaurados para o padrão inicial limpo.',
      variant: 'info'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-pop-in transition-colors">
        
        {/* Cabeçalho */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between transition-colors">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Settings size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Configurações & Backup</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Dados do seu comércio e chave PIX</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors btn-smooth"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulário com Scroll */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          <form id="settings-form" onSubmit={handleSave} className="space-y-3.5">
            
            {/* Nome da Loja */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Nome do Estabelecimento / Fantasia:
              </label>
              <input
                type="text"
                value={formData.shopName || ''}
                onChange={e => handleChange('shopName', e.target.value)}
                placeholder="Ex: Mercadinho do Bairro / Espaço Beleza"
                required
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                Aparece no topo do aplicativo, nas mensagens de cobrança e nos recibos PDF.
              </span>
            </div>

            {/* Telefone do Comércio */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                WhatsApp Comercial da Loja:
              </label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={e => handleChange('phone', e.target.value)}
                placeholder="Ex: 11999998888"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Configurações de PIX */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5 transition-colors">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <QrCode size={15} className="text-emerald-600 dark:text-emerald-400" />
                  Recebimento via PIX Oficial
                </h4>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                  Sem Intermediários
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Tipo de Chave:</label>
                  <select
                    value={formData.pixType || 'telefone'}
                    onChange={e => handleChange('pixType', e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="telefone">Celular / WhatsApp</option>
                    <option value="cpf">CPF / CNPJ</option>
                    <option value="email">E-mail</option>
                    <option value="aleatoria">Chave Aleatória (EVP)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Cidade da Loja:</label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={e => handleChange('city', e.target.value)}
                    placeholder="Ex: São Paulo"
                    className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Chave PIX:</label>
                <input
                  type="text"
                  value={formData.pixKey || ''}
                  onChange={e => handleChange('pixKey', e.target.value)}
                  placeholder="Cole sua chave PIX aqui"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Seção de Backup e Segurança dos Dados */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 transition-colors">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-300 flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-emerald-600 dark:text-emerald-400" />
                Backup e Segurança dos Seus Dados
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Seus fiados ficam salvos de forma privada neste aparelho. Faça backup para nunca perder suas anotações mesmo trocando de celular.
              </p>

              {/* Botões de Ação de Backup */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm transition-all active:scale-95 btn-smooth"
                >
                  <Download size={14} />
                  <span>Exportar / Salvar</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyBackupText}
                  className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center space-x-1.5 border border-slate-300 dark:border-slate-700 transition-colors btn-smooth"
                >
                  <Copy size={14} />
                  <span>Copiar Código</span>
                </button>
              </div>

              {/* Botões de Restauração */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-2 px-3 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center space-x-1.5 border border-slate-300 dark:border-slate-700 transition-colors btn-smooth"
                >
                  <Upload size={14} />
                  <span>Restaurar Arquivo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPasteBackupOpen(true)}
                  className="py-2 px-3 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center space-x-1.5 border border-slate-300 dark:border-slate-700 transition-colors btn-smooth"
                >
                  <FileText size={14} />
                  <span>Colar Backup</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="*/*,.json,application/json,text/plain"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setConfirmResetOpen(true)}
                  className="text-[11px] text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 flex items-center space-x-1 transition-colors btn-smooth"
                >
                  <Trash2 size={13} />
                  <span>Limpar dados locais deste aparelho</span>
                </button>
              </div>
            </div>

          </form>
        </div>

        {/* Rodapé com Salvar */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between transition-colors">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
            Dados 100% seguros
          </span>

          <button
            type="submit"
            form="settings-form"
            className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-all active:scale-95 shadow-md btn-smooth"
          >
            {saveSuccess ? (
              <>
                <Check size={16} />
                <span>Salvo!</span>
              </>
            ) : (
              <span>Salvar Alterações</span>
            )}
          </button>
        </div>

        {/* Modal de Colar Backup */}
        {pasteBackupOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 animate-fadeIn">
            <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-2xl animate-pop-in">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Restaurar Código de Backup</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cole abaixo o texto JSON exportado do seu outro aparelho:
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
                  onClick={() => setPasteBackupOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium btn-smooth"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleRestorePastedText}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold btn-smooth shadow-sm"
                >
                  Restaurar Agora
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmação para Restauração com Resumo dos Dados */}
        <window.ConfirmModal
          isOpen={!!confirmRestoreData}
          title="Substituir Dados pelo Backup?"
          message={confirmRestoreData ? (
            `Atenção: A restauração substituirá os dados atuais deste aparelho pelos dados contidos no backup:\n\n` +
            `• Clientes cadastrados: ${confirmRestoreData.summary.clientsCount}\n` +
            `• Vendas e parcelas: ${confirmRestoreData.summary.salesCount}\n` +
            `• Pagamentos registrados: ${confirmRestoreData.summary.paymentsCount}\n` +
            `• Dívida total pendente: R$ ${(confirmRestoreData.summary.totalDebtCents / 100).toFixed(2)}\n\n` +
            `Deseja realmente prosseguir e carregar este backup agora?`
          ) : ''}
          confirmText="Sim, Restaurar Dados"
          cancelText="Cancelar"
          variant="warning"
          onConfirm={handleConfirmRestore}
          onCancel={() => setConfirmRestoreData(null)}
        />

        {/* Modal de Confirmação para Limpeza de Dados */}
        <window.ConfirmModal
          isOpen={confirmResetOpen}
          title="Limpar Dados Locais"
          message="Tem certeza que deseja apagar os dados locais? Recomendamos baixar um backup antes caso queira recuperar no futuro."
          confirmText="Sim, Limpar"
          cancelText="Cancelar"
          variant="danger"
          onConfirm={handlePerformReset}
          onCancel={() => setConfirmResetOpen(false)}
        />

        {/* Modal de Feedback */}
        <window.ConfirmModal
          isOpen={feedbackDialog.isOpen}
          title={feedbackDialog.title}
          message={feedbackDialog.message}
          confirmText="Entendi"
          variant={feedbackDialog.variant}
          showCancel={false}
          onConfirm={() => setFeedbackDialog({ ...feedbackDialog, isOpen: false })}
        />

      </div>
    </div>
  );
};
