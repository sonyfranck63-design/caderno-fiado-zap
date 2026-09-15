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
    city: 'SAO PAULO'
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
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
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

  // --- MONETIZAÇÃO & GESTÃO VIP ---
  function getVipInfo() {
    const isVipPermanent = localStorage.getItem(STORAGE_KEY_VIP) === 'true';
    const rewardedPassRaw = localStorage.getItem(STORAGE_KEY_REWARDED);
    const rewardedPassExpiresAt = rewardedPassRaw ? parseInt(rewardedPassRaw, 10) : null;
    
    const isPassActive = rewardedPassExpiresAt && rewardedPassExpiresAt > Date.now();
    const isVip = isVipPermanent || isPassActive;

    return {
      isVip,
      isVipPermanent,
      isPassActive,
      passExpiresAt: rewardedPassExpiresAt
    };
  }

  function setVipPermanent(active) {
    localStorage.setItem(STORAGE_KEY_VIP, active ? 'true' : 'false');
    notify();
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
    exportBackup,
    importBackup,
    resetAll
  };
})();
