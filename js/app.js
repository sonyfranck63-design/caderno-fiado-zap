/**
 * Componente Principal da Aplicação: CadernoFiado & Cobrança Zap
 * Conecta estado, navegação entre abas, modais de ação e persistência.
 */

function App() {
  const [activeTab, setActiveTab] = React.useState('clients');
  const [clients, setClients] = React.useState(() => window.AppState.getClients());
  const [shopSettings, setShopSettings] = React.useState(() => window.AppState.getSettings());
  const [vipInfo, setVipInfo] = React.useState(() => window.AppState.getVipInfo());
  const [remainingPassTime, setRemainingPassTime] = React.useState(() => window.AppState.getPassRemainingTimeFormatted());
  const [isDark, setIsDark] = React.useState(() => {
    return localStorage.getItem('cf_theme') !== 'light';
  });

  // Modais
  const [selectedClientId, setSelectedClientId] = React.useState(null);
  const [whatsAppModalData, setWhatsAppModalData] = React.useState({ open: false, client: null, pixPayload: null, targetInstallment: null });
  const [pixModalData, setPixModalData] = React.useState({ open: false, client: null });
  const [settingsModalOpen, setSettingsModalOpen] = React.useState(false);
  const [rewardedModalOpen, setRewardedModalOpen] = React.useState(false);
  const [installModalOpen, setInstallModalOpen] = React.useState(false);
  const [massBillingModalOpen, setMassBillingModalOpen] = React.useState(false);
  const [backupModalOpen, setBackupModalOpen] = React.useState(false);
  const [adminModalOpen, setAdminModalOpen] = React.useState(false);
  const [signatureModalData, setSignatureModalData] = React.useState({ open: false, client: null });
  const [paywallReason, setPaywallReason] = React.useState(null);

  // Controle de histórico do botão/gesto Voltar do Android (BUG 2)
  window.useModalHistory(!!selectedClientId, () => setSelectedClientId(null), 'ClientDetailModal');
  window.useModalHistory(whatsAppModalData.open, () => setWhatsAppModalData({ open: false, client: null, pixPayload: null, targetInstallment: null }), 'WhatsAppModal');
  window.useModalHistory(pixModalData.open, () => setPixModalData({ open: false, client: null }), 'PixModal');
  window.useModalHistory(settingsModalOpen, () => setSettingsModalOpen(false), 'SettingsModal');
  window.useModalHistory(rewardedModalOpen, () => setRewardedModalOpen(false), 'RewardedAdModal');
  window.useModalHistory(installModalOpen, () => setInstallModalOpen(false), 'InstallPwaModal');
  window.useModalHistory(massBillingModalOpen, () => setMassBillingModalOpen(false), 'MassBillingModal');
  window.useModalHistory(backupModalOpen, () => setBackupModalOpen(false), 'BackupModal');
  window.useModalHistory(adminModalOpen, () => setAdminModalOpen(false), 'AdminLicenseModal');
  window.useModalHistory(signatureModalData.open, () => setSignatureModalData({ open: false, client: null }), 'SignatureModal');

  // Aplica classe de tema inicial no documento
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('cf_theme');
    const darkActive = savedTheme !== 'light';
    setIsDark(darkActive);
    if (darkActive) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, []);

  // Sincronização reativa com o AppState
  React.useEffect(() => {
    const unsubscribe = window.AppState.subscribe(() => {
      setClients(window.AppState.getClients());
      setShopSettings(window.AppState.getSettings());
      setVipInfo(window.AppState.getVipInfo());
      setRemainingPassTime(window.AppState.getPassRemainingTimeFormatted());
    });

    // Timer a cada 30 segundos para atualizar tempo restante do passe
    const passInterval = setInterval(() => {
      setVipInfo(window.AppState.getVipInfo());
      setRemainingPassTime(window.AppState.getPassRemainingTimeFormatted());
    }, 30000);

    return () => {
      unsubscribe();
      clearInterval(passInterval);
    };
  }, []);

  // Alternador de tema Escuro / Claro com persistência
  const handleToggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    localStorage.setItem('cf_theme', nextDark ? 'dark' : 'light');
    if (nextDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  };

  // Acionamento de Paywall a partir de tentativa de uso de recurso VIP
  const handleTriggerPaywall = (reason) => {
    setPaywallReason(reason);
    setSelectedClientId(null); // Fecha o modal da frente para a tela VIP ser vista na hora
    setActiveTab('vip');
  };

  // Contagem de clientes em atraso para a badge do menu
  const overdueCount = clients.filter(c => window.AppState.getClientStatus(c) === 'atrasado').length;

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800'}`}>
      
      {/* Container Principal Mobile-First com Estilo de App Nativo */}
      <div className={`app-container relative min-h-screen flex flex-col transition-colors duration-200 shadow-2xl ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        
        {/* Top Header */}
        <window.Header
          vipInfo={vipInfo}
          remainingTime={remainingPassTime}
          onOpenSettings={() => setSettingsModalOpen(true)}
          onOpenBackup={() => setBackupModalOpen(true)}
          onOpenVip={() => {
            setPaywallReason(null);
            setActiveTab('vip');
          }}
          isDark={isDark}
          onToggleTheme={handleToggleTheme}
          shopSettings={shopSettings}
          onOpenInstall={() => setInstallModalOpen(true)}
        />

        {/* Conteúdo Principal das Abas */}
        <main className="flex-1 p-3.5 sm:p-4 overflow-x-hidden">
          {activeTab === 'clients' && (
            <window.ClientsTab
              clients={clients}
              onSelectClient={(id) => setSelectedClientId(id)}
              onOpenNewRecord={() => setActiveTab('new_record')}
              onOpenWhatsApp={(client) => setWhatsAppModalData({ open: true, client, pixPayload: null })}
              onOpenMassBilling={() => {
                if (vipInfo.isVip) {
                  setMassBillingModalOpen(true);
                } else {
                  handleTriggerPaywall('mass_billing');
                }
              }}
              isVip={vipInfo.isVip}
            />
          )}

          {activeTab === 'new_record' && (
            <window.NewRecordTab
              clients={clients}
              onRecordCreated={(clientId) => {
                setSelectedClientId(clientId);
                setActiveTab('clients');
              }}
              onClientCreated={(newClientId) => {
                setSelectedClientId(newClientId);
                setActiveTab('clients');
              }}
            />
          )}

          {activeTab === 'reports' && (
            <window.ReportsTab
              clients={clients}
              isVip={vipInfo.isVip}
              onTriggerPaywall={handleTriggerPaywall}
              onSelectClient={(id) => setSelectedClientId(id)}
            />
          )}

          {activeTab === 'vip' && (
            <window.VipTab
              vipInfo={vipInfo}
              onToggleVip={(val) => window.AppState.setVipPermanent(val)}
              onWatchRewarded={() => setRewardedModalOpen(true)}
              triggerReason={paywallReason}
              shopSettings={shopSettings}
              onOpenAdmin={() => setAdminModalOpen(true)}
            />
          )}
        </main>

        {/* Banner AdMob Adaptativo (Ocultado 100% no Modo VIP) */}
        <window.AdMobBanner
          isVip={vipInfo.isVip}
          onOpenVip={() => {
            setPaywallReason(null);
            setActiveTab('vip');
          }}
          onWatchRewarded={() => setRewardedModalOpen(true)}
        />

        {/* Barra de Navegação Inferior Fixa */}
        <window.BottomNav
          activeTab={activeTab}
          onSelectTab={(tabId) => {
            setPaywallReason(null);
            setActiveTab(tabId);
          }}
          overdueCount={overdueCount}
          isVip={vipInfo.isVip}
        />

        {/* --- MODAIS GLOBAIS --- */}

        {/* Modal de Detalhes do Cliente */}
        <window.ClientDetailModal
          isOpen={!!selectedClientId}
          onClose={() => setSelectedClientId(null)}
          clientId={selectedClientId}
          onOpenWhatsApp={(client, payload, targetInstallment) => setWhatsAppModalData({ open: true, client, pixPayload: payload, targetInstallment: targetInstallment || null })}
          onOpenPix={(client) => setPixModalData({ open: true, client })}
          isVip={vipInfo.isVip}
          onTriggerPaywall={handleTriggerPaywall}
          shopSettings={shopSettings}
        />

        {/* Modal de Cobrança no WhatsApp */}
        <window.WhatsAppModal
          isOpen={whatsAppModalData.open}
          onClose={() => setWhatsAppModalData({ open: false, client: null, pixPayload: null, targetInstallment: null })}
          client={whatsAppModalData.client}
          shopSettings={shopSettings}
          pixPayload={whatsAppModalData.pixPayload}
          targetInstallment={whatsAppModalData.targetInstallment}
        />

        {/* Modal de PIX Automático VIP */}
        <window.PixModal
          isOpen={pixModalData.open}
          onClose={() => setPixModalData({ open: false, client: null })}
          client={pixModalData.client}
          shopSettings={shopSettings}
          onOpenWhatsApp={(client, payload) => {
            setWhatsAppModalData({ open: true, client, pixPayload: payload, targetInstallment: null });
          }}
        />

        {/* Modal de Vídeo Premiado (Rewarded Ad) */}
        <window.RewardedAdModal
          isOpen={rewardedModalOpen}
          onClose={() => setRewardedModalOpen(false)}
          onRewardGranted={() => {
            setVipInfo(window.AppState.getVipInfo());
            setRemainingPassTime(window.AppState.getPassRemainingTimeFormatted());
          }}
        />

        {/* Modal de Configurações do Estabelecimento & Backup */}
        <window.SettingsModal
          isOpen={settingsModalOpen}
          onClose={() => setSettingsModalOpen(false)}
          shopSettings={shopSettings}
          onSaveSettings={(newSettings) => window.AppState.saveSettings(newSettings)}
        />

        {/* Modal de Instalação do Aplicativo (PWA) */}
        <window.InstallPwaModal
          isOpen={installModalOpen}
          onClose={() => setInstallModalOpen(false)}
        />

        {/* Modal VIP de Cobrança em Massa */}
        <window.MassBillingModal
          isOpen={massBillingModalOpen}
          onClose={() => setMassBillingModalOpen(false)}
          clients={clients}
          shopSettings={shopSettings}
        />

        {/* Modal de Backup na Nuvem */}
        <window.BackupModal
          isOpen={backupModalOpen}
          onClose={() => setBackupModalOpen(false)}
          isVip={vipInfo.isVip}
          onTriggerPaywall={handleTriggerPaywall}
        />

        {/* Painel Administrativo do Dono (Gerador de Licenças VIP) */}
        {window.AdminLicenseModal && (
          <window.AdminLicenseModal
            isOpen={adminModalOpen}
            onClose={() => setAdminModalOpen(false)}
          />
        )}

      </div>
    </div>
  );
}

/**
 * ErrorBoundary React: Captura erros não tratados na árvore de componentes e exibe interface
 * amigável de recuperação em vez de tela preta silenciosa (BUG 4a).
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error: error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[CadernoFiado ErrorBoundary]', error, errorInfo);
    try {
      if (window.__appErrors) {
        window.__appErrors.push(`[React Error] ${error?.message || error}`);
      }
    } catch(e) {}
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    if (window.confirm('Deseja restaurar as configurações padrão do aplicativo? Os dados locais serão redefinidos.')) {
      try {
        localStorage.clear();
      } catch(e) {}
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-rose-500 selection:text-white font-sans">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center text-2xl font-bold shadow-sm">
              ⚠️
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Ops! Algo deu errado</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Ocorreu uma falha inesperada no aplicativo, mas seus dados continuam seguros.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-left overflow-x-auto text-[11px] font-mono text-rose-300/90 max-h-28">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                Recarregar Aplicativo
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
              >
                Restaurar Padrões
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Renderiza a aplicação React no DOM
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
