/**
 * Modal de Configurações do Estabelecimento, Chave PIX e Backup de Dados
 * Identidade visual comercial refinada e modais integrados sem alerts/confirms nativos.
 */

window.SettingsModal = function SettingsModal({ isOpen, onClose, shopSettings, onSaveSettings }) {
  const [formData, setFormData] = React.useState({ ...shopSettings });
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = React.useState(false);
  const [feedbackDialog, setFeedbackDialog] = React.useState({ isOpen: false, title: '', message: '', variant: 'info' });
  
  const fileInputRef = React.useRef(null);
  const { X, Settings, Download, Upload, Check, Trash2, ShieldCheck, Store, Phone, QrCode } = window.Icons || {};

  React.useEffect(() => {
    if (isOpen) {
      setFormData({ ...shopSettings });
      setSaveSuccess(false);
    }
  }, [isOpen, shopSettings]);

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

  const handleExportBackup = () => {
    window.AppState.exportBackup();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = window.AppState.importBackup(event.target.result);
      if (result.success) {
        setFeedbackDialog({
          isOpen: true,
          title: 'Backup Restaurado',
          message: `Backup restaurado com sucesso! Foram importados ${result.count} clientes com seus respectivos históricos.`,
          variant: 'success'
        });
      } else {
        setFeedbackDialog({
          isOpen: true,
          title: 'Falha no Backup',
          message: `Não foi possível importar o arquivo: ${result.error}`,
          variant: 'danger'
        });
      }
    };
    reader.readAsText(file);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Cabeçalho */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center">
              <Settings size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Configurações & Backup</h3>
              <p className="text-xs text-slate-400">Dados do seu comércio e chave PIX</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulário com Scroll */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          <form id="settings-form" onSubmit={handleSave} className="space-y-3.5">
            
            {/* Nome da Loja */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Nome do Estabelecimento / Fantasia:
              </label>
              <input
                type="text"
                value={formData.shopName || ''}
                onChange={e => handleChange('shopName', e.target.value)}
                placeholder="Ex: Mercadinho do Bairro / Espaço Beleza"
                required
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Aparecerá nos recibos em PDF e mensagens de cobrança.
              </span>
            </div>

            {/* Nome do Responsável */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Seu Nome (Responsável):
              </label>
              <input
                type="text"
                value={formData.ownerName || ''}
                onChange={e => handleChange('ownerName', e.target.value)}
                placeholder="Ex: Maria da Silva"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Telefone/WhatsApp do Comércio */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Seu WhatsApp de Contato:
              </label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={e => handleChange('phone', e.target.value)}
                placeholder="Ex: (11) 99999-8888"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Dados do PIX para Recebimentos */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2.5">
              <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <span>💰</span> Chave PIX para Cobranças
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Tipo de Chave:</label>
                  <select
                    value={formData.pixKeyType || 'telefone'}
                    onChange={e => handleChange('pixKeyType', e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="telefone">Celular / Telefone</option>
                    <option value="cpf">CPF</option>
                    <option value="cnpj">CNPJ</option>
                    <option value="email">E-mail</option>
                    <option value="aleatoria">Chave Aleatória (EVP)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Cidade do Banco:</label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={e => handleChange('city', e.target.value)}
                    placeholder="Ex: São Paulo"
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Chave PIX:</label>
                <input
                  type="text"
                  value={formData.pixKey || ''}
                  onChange={e => handleChange('pixKey', e.target.value)}
                  placeholder="Cole sua chave PIX aqui"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Seção de Backup e Segurança dos Dados */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <span>💾</span> Backup e Segurança dos Seus Dados
              </h4>
              <p className="text-[11px] text-slate-400">
                Seus fiados ficam salvos de forma privada neste aparelho. Exporte uma cópia regularmente para garantir que nunca perderá suas anotações.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-1.5 border border-slate-700 transition-colors"
                >
                  <Download size={14} />
                  <span>Baixar Backup</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-1.5 border border-slate-700 transition-colors"
                >
                  <Upload size={14} />
                  <span>Restaurar Backup</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              <div className="pt-1 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setConfirmResetOpen(true)}
                  className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center space-x-1 transition-colors"
                >
                  <Trash2 size={13} />
                  <span>Limpar dados locais deste aparelho</span>
                </button>
              </div>
            </div>

          </form>
        </div>

        {/* Rodapé com Salvar */}
        <div className="p-3.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldCheck size={14} className="text-emerald-400" />
            Dados 100% seguros
          </span>

          <button
            type="submit"
            form="settings-form"
            className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-all active:scale-95"
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

        {/* Modal de Feedback (Avisos/Sucesso) */}
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
