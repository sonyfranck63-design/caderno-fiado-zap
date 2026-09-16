/**
 * Gerenciamento Central de Estado e Persistência Local (localStorage)
 * CadernoFiado & Cobrança Zap
 */

window.AppState = (function() {
  const STORAGE_KEY_CLIENTS = 'cadernofiado_clients_v1';
  const STORAGE_KEY_SETTINGS = 'cadernofiado_settings_v1';
  const STORAGE_KEY_VIP = 'cadernofiado_vip_v1';
  const STORAGE_KEY_REWARDED = 'cadernofiado_rewarded_pass_v1';
  const STORAGE_KEY_LICENSE = 'cadernofiado_license_v2';
  const STORAGE_KEY_DEVICE_ID = 'cadernofiado_device_id_v1';

  // Chave Pública Criptográfica ECDSA P-256 Oficial do CadernoFiado
  // Utilizada exclusivamente para validar assinaturas digitais de licenças de forma 100% offline e segura.
  // A Chave Privada permanece isolada com o dono no gerador privado (tools/admin.html) e não no bundle público.
  const PUBLIC_KEY_JWK = {
    kty: "EC",
    crv: "P-256",
    x: "sju7sWqTYzdwcft-dTY5W7roV1qv2yx3nIH-FyIt28M",
    y: "rR6FBrA0W-I9CUhyd7ORtJTltMTUiwIWuoQUWKg86bY"
  };

  const DEFAULT_SETTINGS = {
    shopName: 'Meu Caderno',
    ownerName: '',
    phone: '',
    pixKeyType: 'telefone',
    pixKey: '',
    city: '',
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
        localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify([]));
        return [];
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const isLegacyMock = parsed.some(c => c.id === 'c1' || c.id === 'c2' || c.id === 'c3') &&
                             parsed.some(c => (c.name && c.name.includes('Maria das Dores')) || (c.name && c.name.includes('Seu Jorge')));
        if (isLegacyMock) {
          localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify([]));
          return [];
        }
      }
      return parsed;
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
      id: 'c_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
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

  function addSale(clientId, { amount, description, dueDate, photoUrl }) {
    const clients = getClients();
    const client = clients.find(c => c.id === clientId);
    if (!client) throw new Error('Cliente não encontrado');

    const newSale = {
      id: 'sale_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      type: 'sale',
      amount: parseFloat(amount) || 0,
      description: (description || 'Venda no fiado').trim(),
      date: new Date().toISOString(),
      dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      photoUrl: photoUrl || null
    };

    if (!Array.isArray(client.transactions)) client.transactions = [];
    client.transactions.unshift(newSale);
    saveClients(clients);
    return newSale;
  }

  function addInstallmentSale(clientId, { totalAmount, amount, description, startDate, installmentCount, installments, intervalDays = 30, photoUrl }) {
    const clients = getClients();
    const client = clients.find(c => c.id === clientId);
    if (!client) throw new Error('Cliente não encontrado');

    const total = parseFloat(totalAmount !== undefined ? totalAmount : amount) || 0;
    const rawCount = parseInt(installmentCount !== undefined ? installmentCount : installments, 10);
    const count = isNaN(rawCount) || rawCount < 1 ? 1 : rawCount;

    if (count <= 1) {
      const singleSale = addSale(clientId, {
        amount: total,
        description: description || 'Venda no fiado',
        dueDate: startDate,
        photoUrl: photoUrl
      });
      return [singleSale];
    }

    const daysInterval = parseInt(intervalDays, 10) || 30;
    const installmentValue = Math.floor((total / count) * 100) / 100;
    const remainder = Math.round((total - (installmentValue * count)) * 100) / 100;

    const groupId = 'inst_' + Date.now();
    const start = startDate ? new Date(startDate + 'T12:00:00') : new Date();
    const createdSales = [];

    if (!Array.isArray(client.transactions)) client.transactions = [];

    for (let i = 1; i <= count; i++) {
      let dueDateStr = '';
      if (daysInterval === 30) {
        // Para parcelamento mensal: avança mês a mês preservando o dia original combinado
        const currentDueDate = new Date(start);
        const originalDay = start.getDate();
        currentDueDate.setDate(1); // Evita pular mês se o mês seguinte tiver menos dias
        currentDueDate.setMonth(start.getMonth() + (i - 1));
        const maxDaysInMonth = new Date(currentDueDate.getFullYear(), currentDueDate.getMonth() + 1, 0).getDate();
        currentDueDate.setDate(Math.min(originalDay, maxDaysInMonth));
        dueDateStr = currentDueDate.toISOString().split('T')[0];
      } else {
        // Para quinzenal (15 dias) ou semanal (7 dias)
        const currentDueDate = new Date(start);
        currentDueDate.setDate(start.getDate() + (i - 1) * daysInterval);
        dueDateStr = currentDueDate.toISOString().split('T')[0];
      }

      // Ajusta centavos restantes na última parcela para totalizar a soma exata
      const currentAmount = i === count ? Math.round((installmentValue + remainder) * 100) / 100 : installmentValue;

      const saleItem = {
        id: `sale_${Date.now()}_${i}`,
        type: 'sale',
        amount: currentAmount,
        description: `[${i}/${count}] ${(description || 'Venda no fiado').trim()}`,
        date: new Date().toISOString(),
        dueDate: dueDateStr,
        photoUrl: photoUrl || null,
        installment: {
          groupId,
          current: i,
          total: count,
          totalAmount: total
        }
      };

      createdSales.push(saleItem);
    }

    // Insere o lote de parcelas mantendo a ordem sequencial [p1, p2, p3] no topo do extrato
    client.transactions = [...createdSales, ...client.transactions];

    saveClients(clients);
    return createdSales;
  }

  function addPayment(clientId, { amount, paymentMethod, notes, targetSaleId }) {
    const clients = getClients();
    const client = clients.find(c => c.id === clientId);
    if (!client) throw new Error('Cliente não encontrado');

    const newPayment = {
      id: 'pay_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      type: 'payment',
      amount: parseFloat(amount) || 0,
      paymentMethod: paymentMethod || 'Dinheiro',
      notes: notes ? notes.trim() : 'Abatimento efetuado',
      targetSaleId: targetSaleId || null,
      date: new Date().toISOString()
    };

    if (!Array.isArray(client.transactions)) client.transactions = [];
    client.transactions.unshift(newPayment);
    saveClients(clients);

    const newDebt = computeBalance(client);
    return { payment: newPayment, remainingDebt: newDebt };
  }

  /**
   * Calcula detalhes exatos de uma parcela ou venda individual em centavos.
   * Aloca pagamentos direcionados (targetSaleId) e pagamentos gerais por ordem cronológica (FIFO).
   */
  function getInstallmentDetails(client, saleItem) {
    if (!client || !saleItem || saleItem.type !== 'sale') return null;

    const todayStr = new Date().toISOString().split('T')[0];
    const transactions = Array.isArray(client.transactions) ? client.transactions : [];

    // Clona e ordena todas as vendas cronologicamente (FIFO) para abatimento de pagamentos genéricos
    const allSales = transactions
      .filter(t => t.type === 'sale')
      .slice()
      .sort((a, b) => {
        const dateA = a.dueDate || a.date || '';
        const dateB = b.dueDate || b.date || '';
        return dateA.localeCompare(dateB) || a.id.localeCompare(b.id);
      });

    const allPayments = transactions.filter(t => t.type === 'payment');

    // Mapeamento de quanto cada venda já recebeu em centavos (garantindo precisão inteira)
    const allocatedCentsBySaleId = {};
    allSales.forEach(s => {
      allocatedCentsBySaleId[s.id] = 0;
    });

    // 1. Aplica primeiro pagamentos direcionados especificamente para uma venda/parcela
    let generalPaymentsCents = 0;
    allPayments.forEach(p => {
      const pCents = Math.round((parseFloat(p.amount) || 0) * 100);
      if (p.targetSaleId && allocatedCentsBySaleId[p.targetSaleId] !== undefined) {
        allocatedCentsBySaleId[p.targetSaleId] += pCents;
      } else {
        generalPaymentsCents += pCents;
      }
    });

    // 2. Aloca pagamentos gerais para as vendas em ordem cronológica (FIFO)
    for (const sale of allSales) {
      if (generalPaymentsCents <= 0) break;
      const saleTotalCents = Math.round((parseFloat(sale.amount) || 0) * 100);
      const alreadyAllocated = allocatedCentsBySaleId[sale.id] || 0;
      const neededCents = Math.max(0, saleTotalCents - alreadyAllocated);

      if (neededCents > 0) {
        const toAllocate = Math.min(neededCents, generalPaymentsCents);
        allocatedCentsBySaleId[sale.id] = alreadyAllocated + toAllocate;
        generalPaymentsCents -= toAllocate;
      }
    }

    // Métricas da venda solicitada
    const originalCents = Math.round((parseFloat(saleItem.amount) || 0) * 100);
    const paidCents = allocatedCentsBySaleId[saleItem.id] || 0;
    const remainingCents = Math.max(0, originalCents - paidCents);

    const originalAmount = originalCents / 100;
    const paidAmount = Math.min(originalAmount, paidCents / 100);
    const remainingAmount = remainingCents / 100;

    const isPaidOff = remainingCents === 0;
    const isPartial = paidCents > 0 && !isPaidOff;
    const isOverdue = !isPaidOff && saleItem.dueDate && saleItem.dueDate < todayStr;

    let status = 'em_aberto';
    let statusText = 'Em aberto';
    if (isPaidOff) {
      status = 'quitada';
      statusText = 'Quitada';
    } else if (isOverdue) {
      status = 'atrasada';
      statusText = 'Vencida';
    } else if (isPartial) {
      status = 'parcial';
      statusText = 'Parcialmente paga';
    }

    // Extrai descrição base limpa removendo prefixos automáticos como [1/3]
    let baseDescription = (saleItem.description || 'Compra no fiado').trim();
    if (baseDescription.startsWith('[') && baseDescription.indexOf(']') !== -1) {
      baseDescription = baseDescription.replace(/^\[\d+\/\d+\]\s*/, '').trim();
    }
    if (!baseDescription) baseDescription = 'Compra de produtos';

    const isInstallment = !!saleItem.installment;
    const current = isInstallment ? saleItem.installment.current : 1;
    const total = isInstallment ? saleItem.installment.total : 1;
    const groupId = isInstallment ? saleItem.installment.groupId : saleItem.id;

    let dueDateFormatted = '-';
    if (saleItem.dueDate) {
      const parts = saleItem.dueDate.split('-');
      if (parts.length === 3) {
        dueDateFormatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
      } else {
        dueDateFormatted = saleItem.dueDate;
      }
    }

    return {
      clientId: client.id,
      clientName: client.name,
      saleId: groupId,
      installmentId: saleItem.id,
      isInstallment,
      current,
      total,
      originalAmount,
      paidAmount,
      remainingAmount,
      dueDate: saleItem.dueDate,
      dueDateFormatted,
      status,
      statusText,
      baseDescription,
      fullDescription: saleItem.description
    };
  }

  // --- CONFIGURAÇÕES DO LOJISTA ---
  function getSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (!raw) return { ...DEFAULT_SETTINGS };
      const parsed = JSON.parse(raw);
      if (parsed.ownerName === 'Cristina Alves' || parsed.shopName === 'Espaço & Cantinho da Cris') {
        const cleaned = {
          ...DEFAULT_SETTINGS,
          supportPhone: (parsed.supportPhone && parsed.supportPhone.trim()) ? parsed.supportPhone : DEFAULT_SETTINGS.supportPhone
        };
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(cleaned));
        return cleaned;
      }
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

  // --- MONETIZAÇÃO, LICENÇAS & GESTÃO CRIPTOGRÁFICA VIP ---
  function getInstallationId() {
    let id = localStorage.getItem(STORAGE_KEY_DEVICE_ID);
    if (!id) {
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
      localStorage.setItem(STORAGE_KEY_VIP, licenseObj ? 'true' : 'false');
      notify();
    } catch(e) {}
  }

  // Utilitários de codificação Base64Url
  function base64UrlToBytes(b64url) {
    let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4 !== 0) b64 += '=';
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  function fromBase64Url(b64url) {
    let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4 !== 0) b64 += '=';
    return decodeURIComponent(escape(atob(b64)));
  }

  /**
   * Ativação de licença via Assinatura Digital ECDSA P-256
   * Valida matematicamente no dispositivo do usuário com a chave pública embutida.
   * Não depende de segredo compartilhado no client nem expõe chaves mestres.
   */
  async function activateLicenseKey(keyInput) {
    if (!keyInput) {
      return { success: false, message: 'Por favor, digite o código de ativação fornecido no WhatsApp.' };
    }
    const raw = keyInput.trim().replace(/\s+/g, '');

    // Formato de chave assimétrica: CFVIP.<payloadB64>.<sigB64>
    if (!raw.startsWith('CFVIP.')) {
      return { 
        success: false, 
        message: 'Código de ativação inválido. O formato oficial deve iniciar com "CFVIP." fornecido pelo suporte.' 
      };
    }

    const parts = raw.split('.');
    if (parts.length !== 3) {
      return { success: false, message: 'Código de ativação incompleto ou corrompido.' };
    }

    try {
      const payloadB64 = parts[1];
      const sigB64 = parts[2];

      const payloadJson = fromBase64Url(payloadB64);
      const payload = JSON.parse(payloadJson);

      function normalizeDeviceId(id) {
        return (id || '').toString().toUpperCase().replace(/[^A-Z0-9]/g, '');
      }

      const currentDeviceId = getInstallationId();
      if (payload.d && normalizeDeviceId(payload.d) !== normalizeDeviceId(currentDeviceId)) {
        return {
          success: false,
          message: `Esta chave pertence ao aparelho ${payload.d}. O identificador deste aparelho é ${currentDeviceId}. Solicite uma chave para o seu ID.`
        };
      }

      // Validação da assinatura digital com a chave pública
      const publicKey = await window.crypto.subtle.importKey(
        "jwk",
        PUBLIC_KEY_JWK,
        { name: "ECDSA", namedCurve: "P-256" },
        false,
        ["verify"]
      );

      const sigBytes = base64UrlToBytes(sigB64);
      const dataBytes = new TextEncoder().encode(payloadB64);

      const isValid = await window.crypto.subtle.verify(
        { name: "ECDSA", hash: { name: "SHA-256" } },
        publicKey,
        sigBytes,
        dataBytes
      );

      if (!isValid) {
        return { success: false, message: 'Código de ativação inválido ou chave adulterada.' };
      }

      // Checa se a chave já expirou
      const now = Date.now();
      if (payload.e && payload.e > 0 && payload.e < now) {
        return { success: false, message: 'Este código de licença já se encontra expirado.' };
      }

      let planName = 'VIP Pro';
      let expiresAt = null;
      if (payload.p === '30D') {
        planName = 'VIP Pro Mensal (30 Dias)';
        expiresAt = payload.e || (now + 30 * 24 * 60 * 60 * 1000);
      } else if (payload.p === '365D') {
        planName = 'VIP Pro Anual (1 Ano)';
        expiresAt = payload.e || (now + 365 * 24 * 60 * 60 * 1000);
      } else if (payload.p === 'LIFETIME') {
        planName = 'VIP Pro Vitalício';
        expiresAt = null;
      }

      saveLicense({
        type: payload.p,
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

    } catch (e) {
      console.error('Erro na validação da chave:', e);
      return { success: false, message: 'Falha ao processar código de ativação: ' + e.message };
    }
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
  function getBackupData() {
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      shopSettings: getSettings(),
      clients: getClients()
    };
  }

  function getBackupJsonString() {
    return JSON.stringify(getBackupData(), null, 2);
  }

  async function exportBackup() {
    const data = getBackupData();
    const dataStr = JSON.stringify(data, null, 2);
    const filename = `backup-cadernofiado-${new Date().toISOString().split('T')[0]}.json`;
    const blob = new Blob([dataStr], { type: 'application/json' });

    let salesCount = 0;
    (data.clients || []).forEach(c => {
      salesCount += (c.transactions || []).filter(t => t.type === 'sale').length;
    });

    // 1. Web Share API para Android/iOS se suportado (permite salvar no Drive, WhatsApp ou pasta do celular)
    if (typeof File !== 'undefined' && navigator.canShare) {
      try {
        const file = new File([blob], filename, { type: 'application/json' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Backup CadernoFiado',
            text: 'Backup completo dos clientes e fiados do CadernoFiado.'
          });
          return { success: true, method: 'share', filename, clientCount: data.clients.length, salesCount };
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          return { success: true, method: 'cancelled', filename, clientCount: data.clients.length, salesCount };
        }
        console.warn('Share API falhou no backup, tentando download direto:', err);
      }
    }

    // 2. Download direto com atraso seguro de revoke para não ser abortado no Chrome Mobile/Android
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      return { success: true, method: 'download', filename, clientCount: data.clients.length, salesCount };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Valida rigorosamente a estrutura de um arquivo JSON de backup antes de qualquer alteração no sistema.
   * Retorna um resumo detalhado (quantidade de clientes, vendas e pagamentos) para confirmação do usuário.
   */
  function validateBackup(jsonText) {
    if (!jsonText || typeof jsonText !== 'string' || !jsonText.trim()) {
      return { valid: false, error: 'O conteúdo fornecido para backup está vazio.' };
    }
    try {
      const data = JSON.parse(jsonText.trim());
      if (!data || typeof data !== 'object') {
        return { valid: false, error: 'Formato inválido: o conteúdo não é um objeto JSON válido.' };
      }
      if (!Array.isArray(data.clients)) {
        return { valid: false, error: 'Backup inválido: a lista de clientes não foi encontrada no arquivo.' };
      }

      let salesCount = 0;
      let installmentsCount = 0;
      let paymentsCount = 0;

      // Validação item a item dos clientes e integridade das transações
      for (let i = 0; i < data.clients.length; i++) {
        const c = data.clients[i];
        if (!c || typeof c !== 'object' || !c.id || !c.name) {
          return {
            valid: false,
            error: `O cliente na posição #${i + 1} possui dados corrompidos (sem identificador ou nome).`
          };
        }
        if (Array.isArray(c.transactions)) {
          c.transactions.forEach(t => {
            if (t.type === 'sale') {
              salesCount++;
              if (t.installment) installmentsCount++;
            } else if (t.type === 'payment') {
              paymentsCount++;
            }
          });
        }
      }

      let totalDebtCents = 0;
      data.clients.forEach(c => {
        if (Array.isArray(c.transactions)) {
          let sSum = 0;
          let pSum = 0;
          c.transactions.forEach(t => {
            if (t.type === 'sale') sSum += Math.round((parseFloat(t.amount) || 0) * 100);
            if (t.type === 'payment') pSum += Math.round((parseFloat(t.amount) || 0) * 100);
          });
          if (sSum > pSum) totalDebtCents += (sSum - pSum);
        }
      });

      return {
        valid: true,
        summary: {
          clientCount: data.clients.length,
          clientsCount: data.clients.length,
          salesCount,
          installmentsCount,
          paymentsCount,
          totalDebtCents,
          totalDebt: Math.round(totalDebtCents) / 100,
          hasShopSettings: !!data.shopSettings
        },
        data
      };
    } catch (err) {
      return { valid: false, error: 'Erro ao interpretar JSON: ' + err.message };
    }
  }

  /**
   * Aplica a restauração com dados já validados.
   */
  function restoreBackupData(validatedData) {
    if (!validatedData || !Array.isArray(validatedData.clients)) {
      return { success: false, error: 'Estrutura de dados de backup inválida.' };
    }
    try {
      saveClients(validatedData.clients);
      if (validatedData.shopSettings) {
        saveSettings(validatedData.shopSettings);
      }
      return { success: true, count: validatedData.clients.length };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  function importBackup(jsonText) {
    const valResult = validateBackup(jsonText);
    if (!valResult.valid) {
      return { success: false, error: valResult.error };
    }
    return restoreBackupData(valResult.data);
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
    getInstallmentDetails,
    addClient,
    updateClient,
    deleteClient,
    addSale,
    addInstallmentSale,
    addPayment,
    getSettings,
    saveSettings,
    getVipInfo,
    setVipPermanent,
    activate24hPass,
    getPassRemainingTimeFormatted,
    getInstallationId,
    activateLicenseKey,
    getBackupData,
    getBackupJsonString,
    exportBackup,
    validateBackup,
    restoreBackupData,
    importBackup,
    resetAll
  };
})();
