/**
 * Gerenciamento Central de Estado e Persistência Local (localStorage)
 * CadernoFiado & Cobrança Zap
 */

window.AppState = (function() {
  const STORAGE_KEY_CLIENTS = 'cadernofiado_clients_v1';
  const STORAGE_KEY_SETTINGS = 'cadernofiado_settings_v1';
  const STORAGE_KEY_VIP = 'cadernofiado_vip_v1';
  const STORAGE_KEY_REWARDED = 'cadernofiado_rewarded_pass_v1';

  // Semente de dados realistas de demonstração
  const MOCK_CLIENTS = [
    {
      id: 'c1',
      name: 'Maria das Dores (Salão & Manicure)',
      phone: '11987654321',
      address: 'Rua das Flores, 142 - Bairro Alto',
      creditLimit: 350.00,
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      transactions: [
        {
          id: 't101',
          type: 'sale',
          amount: 80.00,
          description: 'Alongamento em Gel + Esmaltação francesa',
          date: new Date(Date.now() - 12 * 86400000).toISOString(),
          dueDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
          photoUrl: null
        },
        {
          id: 't102',
          type: 'sale',
          amount: 90.00,
          description: 'Escova Modeladora + Kit Reparador de Pontas',
          date: new Date(Date.now() - 7 * 86400000).toISOString(),
          dueDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
          photoUrl: null
        },
        {
          id: 't103',
          type: 'payment',
          amount: 50.00,
          paymentMethod: 'Dinheiro',
          notes: 'Entregou na loja (abatimento parcial)',
          date: new Date(Date.now() - 3 * 86400000).toISOString()
        }
      ]
    },
    {
      id: 'c2',
      name: 'Seu Jorge da Silva (Oficina)',
      phone: '21998765432',
      address: 'Av. dos Trabalhadores, 50 - Galpão 2',
      creditLimit: 500.00,
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
      transactions: [
        {
          id: 't201',
          type: 'sale',
          amount: 180.00,
          description: 'Troca de Óleo Sintético 10w40 + Filtros de ar',
          date: new Date(Date.now() - 20 * 86400000).toISOString(),
          dueDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0], // Atrasado há 5 dias!
          photoUrl: null
        },
        {
          id: 't202',
          type: 'sale',
          amount: 100.00,
          description: 'Jogo de Velas de Ignição Bosh',
          date: new Date(Date.now() - 14 * 86400000).toISOString(),
          dueDate: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0], // Atrasado há 2 dias!
          photoUrl: null
        }
      ]
    },
    {
      id: 'c3',
      name: 'Carla Mendes (Revendedora Cosméticos)',
      phone: '31976543210',
      address: 'Condomínio Primavera, Bloco B Apto 304',
      creditLimit: 250.00,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      transactions: [
        {
          id: 't301',
          type: 'sale',
          amount: 150.00,
          description: 'Kit Perfume Floral + Hidratante Corporal 400ml',
          date: new Date(Date.now() - 22 * 86400000).toISOString(),
          dueDate: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
          photoUrl: null
        },
        {
          id: 't302',
          type: 'payment',
          amount: 150.00,
          paymentMethod: 'PIX',
          notes: 'Pagou valor integral via PIX no prazo',
          date: new Date(Date.now() - 5 * 86400000).toISOString()
        }
      ]
    }
  ];

  const DEFAULT_SETTINGS = {
    shopName: 'Espaço & Cantinho da Cris',
    ownerName: 'Cristina Alves',
    phone: '11987650000',
    pixKeyType: 'telefone',
    pixKey: '11987650000',
    city: 'SAO PAULO',
    supportPhone: '51985661499'
  };

  // Listeners de mudança de estado para render reativo
  const listeners = [];
  function notify() {
    listeners.forEach(fn => {
      try { fn(); } catch(e) { console.error('Erro em subscriber do AppState:', e); }
    });
  }

  function subscribe(listener) {
    listeners.push(listener);
    return () => {
      const idx = listeners.indexOf(listener);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }

  // --- CLIENTES & TRANSAÇÕES ---
  function getClients() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CLIENTS);
      if (!raw) {
        // Inicializa com semente
        localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(MOCK_CLIENTS));
        return JSON.parse(JSON.stringify(MOCK_CLIENTS));
      }
      return JSON.parse(raw);
    } catch(e) {
      console.error('Erro ao ler clientes do localStorage:', e);
      return [];
    }
  }

  function saveClients(clients) {
    try {
      localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(clients));
      notify();
    } catch(e) {
      console.error('Erro ao salvar clientes:', e);
    }
  }

  function getClient(id) {
    const clients = getClients();
    return clients.find(c => c.id === id) || null;
  }

  // Calcula o saldo devedor atual de um cliente
  function computeBalance(client) {
    if (!client || !Array.isArray(client.transactions)) return 0;
    const totalSales = client.transactions
      .filter(t => t.type === 'sale')
      .reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
    const totalPaid = client.transactions
      .filter(t => t.type === 'payment')
      .reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
    return Math.max(0, Math.round((totalSales - totalPaid) * 100) / 100);
  }

  // Retorna o status de débito do cliente ('quitado', 'atrasado', 'em_dia')
  function getClientStatus(client) {
    const debt = computeBalance(client);
    if (debt <= 0.01) return 'quitado';

    const todayStr = new Date().toISOString().split('T')[0];
    const openSales = (client.transactions || []).filter(t => t.type === 'sale');
    const isOverdue = openSales.some(s => s.dueDate && s.dueDate < todayStr);

    return isOverdue ? 'atrasado' : 'em_dia';
  }

  function addClient({ name, phone, address, creditLimit }) {
    const clients = getClients();
    const newClient = {
      id: 'c_' + Date.now(),
      name: name.trim(),
      phone: (phone || '').replace(/\D/g, ''),
      address: (address || '').trim(),
      creditLimit: parseFloat(creditLimit) || 300.00,
      createdAt: new Date().toISOString(),
      transactions: []
    };
    clients.unshift(newClient);
    saveClients(clients);
    return newClient;
  }

  function updateClient(id, updates) {
    const clients = getClients();
    const index = clients.findIndex(c => c.id === id);
    if (index === -1) return false;
    clients[index] = { ...clients[index], ...updates };
    saveClients(clients);
    return true;
  }

  function deleteClient(id) {
    const clients = getClients().filter(c => c.id !== id);
    saveClients(clients);
  }

  // Registra nova compra no fiado
  function addSale(clientId, { amount, description, dueDate, photoUrl }) {
    const clients = getClients();
    const client = clients.find(c => c.id === clientId);
    if (!client) throw new Error('Cliente não encontrado');

    const newSale = {
      id: 'sale_' + Date.now(),
      type: 'sale',
      amount: parseFloat(amount) || 0,
      description: description.trim() || 'Venda no fiado',
      date: new Date().toISOString(),
      dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      photoUrl: photoUrl || null
    };

    if (!Array.isArray(client.transactions)) client.transactions = [];
    client.transactions.unshift(newSale);
    saveClients(clients);
    return newSale;
  }

  // Registra pagamento / abatimento parcial ou total
  function addPayment(clientId, { amount, paymentMethod, notes }) {
    const clients = getClients();
    const client = clients.find(c => c.id === clientId);
    if (!client) throw new Error('Cliente não encontrado');

    const newPayment = {
      id: 'pay_' + Date.now(),
      type: 'payment',
      amount: parseFloat(amount) || 0,
      paymentMethod: paymentMethod || 'Dinheiro',
      notes: notes ? notes.trim() : 'Abatimento efetuado',
      date: new Date().toISOString()
    };

    if (!Array.isArray(client.transactions)) client.transactions = [];
    client.transactions.unshift(newPayment);
    saveClients(clients);

    const newDebt = computeBalance(client);
    return { payment: newPayment, remainingDebt: newDebt };
  }

  // --- CONFIGURAÇÕES DO LOJISTA ---
  function getSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (!raw) return { ...DEFAULT_SETTINGS };
      const parsed = JSON.parse(raw);
      return { 
        ...DEFAULT_SETTINGS, 
        ...parsed,
        supportPhone: (parsed.supportPhone && parsed.supportPhone.trim()) ? parsed.supportPhone : DEFAULT_SETTINGS.supportPhone
      };
    } catch(e) {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function saveSettings(newSettings) {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(newSettings));
      notify();
    } catch(e) {}
  }

  // --- MONETIZAÇÃO, LICENÇAS & GESTÃO DE EXPIRAÇÃO VIP ---
  const STORAGE_KEY_LICENSE = 'cadernofiado_license_v2';
  const STORAGE_KEY_DEVICE_ID = 'cadernofiado_device_id_v1';
  const SECRET_SALT = 'CF_ZAP_PRO_2026';

  function getInstallationId() {
    let id = localStorage.getItem(STORAGE_KEY_DEVICE_ID);
    if (!id) {
      // Gera ID curto e legível (ex: CF-7482)
      const num = Math.floor(1000 + Math.random() * 9000);
      id = `CF-${num}`;
      localStorage.setItem(STORAGE_KEY_DEVICE_ID, id);
    }
    return id;
  }

  function getStoredLicense() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LICENSE);
      return raw ? JSON.parse(raw) : null;
    } catch(e) {
      return null;
    }
  }

  function saveLicense(licenseObj) {
    try {
      localStorage.setItem(STORAGE_KEY_LICENSE, JSON.stringify(licenseObj));
      // Mantém compatibilidade com a chave legada
      localStorage.setItem(STORAGE_KEY_VIP, licenseObj ? 'true' : 'false');
      notify();
    } catch(e) {}
  }

  // Gera o checksum determinístico de 4 caracteres
  function computeChecksum(deviceId, planType) {
    const raw = `${deviceId.trim().toUpperCase()}_${planType.trim().toUpperCase()}_${SECRET_SALT}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) - hash) + raw.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(4, '0');
    return hex.slice(0, 4);
  }

  // Função utilizada pelo Dono no Painel Admin para gerar chaves de ativação
  function generateLicenseKey(targetDeviceId, planType) {
    const cleanId = (targetDeviceId || '').trim().toUpperCase();
    const cleanPlan = (planType || '30D').trim().toUpperCase();
    const checksum = computeChecksum(cleanId, cleanPlan);
    return `CF-${cleanPlan}-${cleanId.replace('CF-', '')}-${checksum}`;
  }

  // Ativação da chave pelo cliente
  function activateLicenseKey(keyInput) {
    if (!keyInput) return { success: false, message: 'Por favor, digite o código de ativação recebido.' };
    const raw = keyInput.trim().toUpperCase().replace(/\s+/g, '');

    // Chaves Mestres de Teste/Emergência
    if (raw === 'CF-MASTER-VIP-2026' || raw === 'VIP-MESTRE-2026' || raw === 'LIBERARVIP') {
      const expiresAt = Date.now() + 365 * 24 * 60 * 60 * 1000;
      saveLicense({
        type: '365D',
        planName: 'VIP Pro Anual (Mestre)',
        activatedAt: new Date().toISOString(),
        expiresAt: expiresAt,
        licenseKey: raw
      });
      return { success: true, message: 'Acesso VIP Mestre ativado por 1 ano com sucesso!', planName: 'VIP Pro Anual' };
    }

    const currentDeviceId = getInstallationId();
    const cleanCurrentNum = currentDeviceId.replace('CF-', '');

    const parts = raw.split('-');
    if (parts.length !== 4 || parts[0] !== 'CF') {
      return { success: false, message: 'Formato do código inválido. Exemplo correto: CF-30D-XXXX-YYYY' };
    }

    const planType = parts[1];
    const deviceNum = parts[2];
    const checksum = parts[3];

    // Valida se a chave foi gerada para este celular específico
    if (deviceNum !== cleanCurrentNum) {
      return { 
        success: false, 
        message: `Esta chave pertence ao aparelho CF-${deviceNum}. Seu aparelho é ${currentDeviceId}. Solicite uma chave para o seu ID.` 
      };
    }

    // Valida integridade e autenticidade da chave
    const expectedChecksum = computeChecksum(currentDeviceId, planType);
    if (checksum !== expectedChecksum) {
      return { success: false, message: 'Código de ativação incorreto ou expirado. Verifique os caracteres.' };
    }

    let expiresAt = null;
    let planName = 'VIP Pro';
    if (planType === '30D') {
      expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
      planName = 'VIP Pro Mensal (30 Dias)';
    } else if (planType === '365D') {
      expiresAt = Date.now() + 365 * 24 * 60 * 60 * 1000;
      planName = 'VIP Pro Anual (1 Ano)';
    } else if (planType === 'LIFETIME' || planType === 'VIT') {
      expiresAt = null; // Vitalício
      planName = 'VIP Pro Vitalício';
    } else {
      return { success: false, message: 'Tipo de plano não reconhecido.' };
    }

    saveLicense({
      type: planType,
      planName,
      activatedAt: new Date().toISOString(),
      expiresAt,
      licenseKey: raw
    });

    return { 
      success: true, 
      message: `${planName} ativado com sucesso! Aproveite todos os recursos.`,
      planName,
      expiresAt
    };
  }

  function getVipInfo() {
    const installationId = getInstallationId();
    const license = getStoredLicense();
    const now = Date.now();

    let isVip = false;
    let isLifetime = false;
    let isExpired = false;
    let daysRemaining = null;
    let expiresAtDateStr = null;
    let planName = 'Gratuito';

    if (license && license.type) {
      if (license.expiresAt === null) {
        // Vitalício
        isVip = true;
        isLifetime = true;
        planName = license.planName || 'VIP Pro Vitalício';
      } else if (license.expiresAt > now) {
        isVip = true;
        planName = license.planName || 'VIP Pro';
        daysRemaining = Math.max(0, Math.ceil((license.expiresAt - now) / (1000 * 60 * 60 * 24)));
        expiresAtDateStr = new Date(license.expiresAt).toLocaleDateString('pt-BR');
      } else {
        isExpired = true;
        planName = 'Plano Expirado';
      }
    }

    // Suporte ao passe de 24h por anúncio (Rewarded Video)
    const rewardedPassRaw = localStorage.getItem(STORAGE_KEY_REWARDED);
    const rewardedPassExpiresAt = rewardedPassRaw ? parseInt(rewardedPassRaw, 10) : null;
    const isPassActive = rewardedPassExpiresAt && rewardedPassExpiresAt > now;

    if (isPassActive && !isVip) {
      isVip = true;
      planName = 'Passe VIP 24h';
    }

    return {
      isVip,
      isVipPermanent: isLifetime,
      isLifetime,
      isExpired,
      isPassActive,
      passExpiresAt: rewardedPassExpiresAt,
      daysRemaining,
      expiresAt: license ? license.expiresAt : null,
      expiresAtDateStr,
      planName,
      installationId,
      licenseKey: license ? license.licenseKey : null
    };
  }

  function setVipPermanent(active) {
    if (active) {
      saveLicense({
        type: 'LIFETIME',
        planName: 'VIP Pro Vitalício',
        activatedAt: new Date().toISOString(),
        expiresAt: null,
        licenseKey: 'ADMIN_MANUAL'
      });
    } else {
      localStorage.removeItem(STORAGE_KEY_LICENSE);
      localStorage.setItem(STORAGE_KEY_VIP, 'false');
      notify();
    }
  }

  // Ativa passe temporário de 24 horas (Vídeo Premiado)
  function activate24hPass() {
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_KEY_REWARDED, expiresAt.toString());
    notify();
    return expiresAt;
  }

  function getPassRemainingTimeFormatted() {
    const info = getVipInfo();
    if (info.isVip && info.daysRemaining !== null) {
      return `${info.daysRemaining} dias restantes`;
    }
    if (!info.isPassActive) return null;
    const diffMs = info.passExpiresAt - Date.now();
    if (diffMs <= 0) return null;

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m restantes`;
  }

  // --- BACKUP & RESTAURAÇÃO ---
  function exportBackup() {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      shopSettings: getSettings(),
      clients: getClients()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-cadernofiado-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importBackup(jsonText) {
    try {
      const data = JSON.parse(jsonText);
      if (!data.clients || !Array.isArray(data.clients)) {
        throw new Error('Arquivo de backup inválido: lista de clientes ausente.');
      }
      saveClients(data.clients);
      if (data.shopSettings) {
        saveSettings(data.shopSettings);
      }
      return { success: true, count: data.clients.length };
    } catch(e) {
      return { success: false, error: e.message };
    }
  }

  function resetAll() {
    localStorage.removeItem(STORAGE_KEY_CLIENTS);
    localStorage.removeItem(STORAGE_KEY_SETTINGS);
    localStorage.removeItem(STORAGE_KEY_VIP);
    localStorage.removeItem(STORAGE_KEY_REWARDED);
    notify();
  }

  return {
    subscribe,
    getClients,
    getClient,
    computeBalance,
    getClientStatus,
    addClient,
    updateClient,
    deleteClient,
    addSale,
    addPayment,
    getSettings,
    saveSettings,
    getVipInfo,
    setVipPermanent,
    activate24hPass,
    getPassRemainingTimeFormatted,
    getInstallationId,
    generateLicenseKey,
    activateLicenseKey,
    exportBackup,
    importBackup,
    resetAll
  };
})();
