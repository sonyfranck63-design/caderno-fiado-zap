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
  const [paywallReason, setPaywallReason] = React.useState(null);

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

      </div>
    </div>
  );
}

// Renderiza a aplicação React no DOM
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}
