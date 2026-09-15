/**
 * Modal de Configurações do Estabelecimento, Chave PIX e Backup de Dados
 */

window.SettingsModal = function SettingsModal({ isOpen, onClose, shopSettings, onSaveSettings, onOpenAdmin }) {
  const [formData, setFormData] = React.useState({ ...shopSettings });
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const fileInputRef = React.useRef(null);
  const { X, Settings, Download, Upload, Check, Trash2, ShieldCheck } = window.Icons;

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
    }, 900);
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
        alert(`Backup restaurado com sucesso! ${result.count} clientes importados.`);
        onClose();
      } else {
        alert(`Falha ao importar backup: ${result.error}`);
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (confirm('Tem certeza que deseja restaurar os dados de demonstração originais? Isso resetará alterações locais.')) {
      window.AppState.resetAll();
      alert('Dados restaurados com os exemplos iniciais.');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Cabeçalho */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-800 text-brand-400 flex items-center justify-center">
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
          <form id="settings-form" onSubmit={handleSave} className="space-y-3">
            
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Nome do Estabelecimento / Fantasia:
              </label>
              <input
                type="text"
                value={formData.shopName || ''}
                onChange={e => handleChange('shopName', e.target.value)}
                placeholder="Ex: Espaço Beleza da Cris"
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-brand-500"
              />
              <span className="text-[10px] text-slate-400">Aparece no topo do app e nos recibos em PDF.</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Seu Nome:
                </label>
                <input
                  type="text"
                  value={formData.ownerName || ''}
                  onChange={e => handleChange('ownerName', e.target.value)}
                  placeholder="Ex: Cristina Silva"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  WhatsApp Contato:
                </label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={e => handleChange('phone', e.target.value)}
                  placeholder="Ex: 11987650000"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* Configuração do PIX */}
            <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2.5">
              <span className="text-xs font-bold text-brand-400 uppercase tracking-wider block">
                Dados do PIX (Para Cobrança e QR Code)
              </span>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Tipo da Chave</label>
                  <select
                    value={formData.pixKeyType || 'telefone'}
                    onChange={e => handleChange('pixKeyType', e.target.value)}
                    className="w-full px-2 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="telefone">Celular</option>
                    <option value="cpf">CPF</option>
                    <option value="cnpj">CNPJ</option>
                    <option value="email">E-mail</option>
                    <option value="aleatoria">Aleatória</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-[11px] text-slate-400 block mb-1">Chave PIX</label>
                  <input
                    type="text"
                    value={formData.pixKey || ''}
                    onChange={e => handleChange('pixKey', e.target.value)}
                    placeholder="Chave para receber os fiados"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Cidade do Titular</label>
                <input
                  type="text"
                  value={formData.city || 'BRASIL'}
                  onChange={e => handleChange('city', e.target.value)}
                  placeholder="Ex: SAO PAULO (Sem acentos para o QR Code)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* Seção de Backup e Restauração */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">
                Segurança dos Seus Dados
              </span>
              <p className="text-[11px] text-slate-400">
                Seus clientes e fiados ficam salvos neste aparelho. Faça backup periódico para trocar de celular com segurança.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Download size={15} />
                  <span>Baixar Backup</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Upload size={15} />
                  <span>Restaurar Backup</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".json"
                  className="hidden"
                />
              </div>

              {/* Seção WhatsApp de Vendas / Dono */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-300 block">
                  Contato de Suporte & Vendas do App
                </span>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    WhatsApp para os lojistas solicitarem a assinatura VIP:
                  </label>
                  <input
                    type="text"
                    value={formData.supportPhone || ''}
                    onChange={e => handleChange('supportPhone', e.target.value)}
                    placeholder="Ex: 51985661499 (Seu WhatsApp oficial de vendas)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenAdmin) onOpenAdmin();
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-semibold text-xs border border-amber-500/30 flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <ShieldCheck size={15} />
                    <span>🔐 Abrir Painel do Dono (Gerador de Códigos)</span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResetData}
                  className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center space-x-1 transition-colors"
                >
                  <Trash2 size={13} />
                  <span>Restaurar dados de demonstração iniciais</span>
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
            className="py-2.5 px-6 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs shadow-glow-emerald flex items-center space-x-1.5 transition-all active:scale-95"
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

      </div>
    </div>
  );
};
