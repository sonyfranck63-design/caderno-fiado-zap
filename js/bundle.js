// ==========================================
// Arquivo: js\pix.js
// ==========================================
/**
 * Utilitário de Geração de PIX Copia e Cola & BR Code (Padrão Oficial Banco Central / EMVCo)
 */

window.PixService = (function() {

  // Formata campo no padrão TLV (Tag, Length, Value)
  function formatField(id, value) {
    if (value === undefined || value === null) return '';
    const strVal = String(value);
    const len = strVal.length.toString().padStart(2, '0');
    return `${id}${len}${strVal}`;
  }

  // Normaliza strings removendo acentos para compatibilidade com o padrão EMVCo
  function sanitizeString(str, maxLen) {
    if (!str) return '';
    const clean = str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .trim();
    return clean.slice(0, maxLen);
  }

  // Algoritmo oficial CRC16-CCITT (Polinômio 0x1021, valor inicial 0xFFFF)
  function calculateCRC16(str) {
    let crc = 0xFFFF;
    for (let c = 0; c < str.length; c++) {
      crc ^= str.charCodeAt(c) << 8;
      for (let i = 0; i < 8; i++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc = crc << 1;
        }
        crc = crc & 0xFFFF; // Garante 16 bits
      }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  }

  /**
   * Gera a string completa do PIX Copia e Cola
   * @param {Object} params
   * @param {string} params.pixKey - Chave PIX (CPF, CNPJ, Telefone, E-mail ou EVP)
   * @param {string} params.merchantName - Nome do beneficiário/estabelecimento
   * @param {string} params.merchantCity - Cidade do estabelecimento
   * @param {number|string} params.amount - Valor do débito em Reais (ex: 150.00)
   * @param {string} [params.txid] - Identificador único da transação
   */
  function generatePayload({ pixKey, merchantName, merchantCity, amount, txid = '***' }) {
    if (!pixKey) {
      throw new Error('Chave PIX não informada.');
    }

    // 00: Payload Format Indicator
    const payloadFormat = formatField('00', '01');

    // 26: Merchant Account Information (PIX)
    const gui = formatField('00', 'br.gov.bcb.pix');
    const key = formatField('01', pixKey.trim());
    const merchantAccountInfo = formatField('26', `${gui}${key}`);

    // 52: Merchant Category Code
    const mcc = formatField('52', '0000');

    // 53: Transaction Currency (986 = Real BRL)
    const currency = formatField('53', '986');

    // 54: Transaction Amount
    let formattedAmount = '';
    const numAmount = parseFloat(amount);
    if (!isNaN(numAmount) && numAmount > 0) {
      formattedAmount = formatField('54', numAmount.toFixed(2));
    }

    // 58: Country Code (BR)
    const country = formatField('58', 'BR');

    // 59: Merchant Name (Máximo 25 caracteres)
    const nameStr = sanitizeString(merchantName || 'LOJISTA', 25);
    const name = formatField('59', nameStr || 'RECEBEDOR');

    // 60: Merchant City (Máximo 15 caracteres)
    const cityStr = sanitizeString(merchantCity || 'BRASIL', 15);
    const city = formatField('60', cityStr || 'BRASIL');

    // 62: Additional Data Field (TXID)
    const txidField = formatField('05', txid || '***');
    const additionalData = formatField('62', txidField);

    // Monta o payload sem o CRC
    const rawPayload = `${payloadFormat}${merchantAccountInfo}${mcc}${currency}${formattedAmount}${country}${name}${city}${additionalData}6304`;

    // Calcula o CRC16 e anexa no final
    const crc = calculateCRC16(rawPayload);
    return `${rawPayload}${crc}`;
  }

  /**
   * Renderiza o QR Code dinâmico em um elemento HTML container
   */
  function renderQRCode(containerElement, payload, size = 200) {
    if (!containerElement) return;
    containerElement.innerHTML = '';
    
    if (typeof QRCode !== 'undefined') {
      new QRCode(containerElement, {
        text: payload,
        width: size,
        height: size,
        colorDark: "#0f172a",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M
      });
    } else {
      console.error("Biblioteca QRCode.js não disponível.");
    }
  }

  return {
    generatePayload,
    renderQRCode,
    calculateCRC16
  };
})();


// ==========================================
// Arquivo: js\pdf.js
// ==========================================
/**
 * Gerador de Recibo & Extrato Timbrado em PDF Profissional usando jsPDF
 * Suporte multi-camada: Web Share API nativa, ponte Android WebView e download tradicional.
 */

window.PdfService = (function() {

  function formatMoney(val) {
    const num = parseFloat(val) || 0;
    return `R$ ${num.toFixed(2).replace('.', ',')}`;
  }

  function formatDate(isoStr) {
    if (!isoStr) return '-';
    try {
      const parts = isoStr.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return isoStr;
    } catch (e) {
      return isoStr;
    }
  }

  /**
   * Gera o extrato em formato de texto pronto para enviar no WhatsApp
   * Utilizado como contingência quando o dispositivo tem bloqueios de download.
   */
  function generateReceiptText(client, shopInfo = {}) {
    const sales = (client.transactions || []).filter(t => t.type === 'sale');
    const payments = (client.transactions || []).filter(t => t.type === 'payment');
    const totalSales = sales.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
    const totalPaid = payments.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
    const balance = Math.max(0, totalSales - totalPaid);

    let text = `🧾 *COMPROVANTE DE EXTRATO DE FIADO*\n`;
    text += `🏬 *${shopInfo.shopName || 'Meu Estabelecimento'}*\n`;
    if (shopInfo.phone) text += `📞 Contato: ${shopInfo.phone}\n`;
    if (shopInfo.pixKey) text += `🔑 Chave PIX: ${shopInfo.pixKey}\n`;
    text += `--------------------------------\n`;
    text += `👤 *Cliente:* ${client.name}\n`;
    text += `📅 *Emissão:* ${new Date().toLocaleDateString('pt-BR')}\n`;
    text += `--------------------------------\n`;

    if (sales.length > 0) {
      text += `*COMPRAS / SERVIÇOS:*\n`;
      sales.slice(0, 8).forEach(s => {
        text += `• ${formatDate(s.date)} - ${s.description}: ${formatMoney(s.amount)}\n`;
      });
      if (sales.length > 8) text += `• ... e mais ${sales.length - 8} itens\n`;
    }

    if (payments.length > 0) {
      text += `\n*ABATIMENTOS EFETUADOS:*\n`;
      payments.slice(0, 5).forEach(p => {
        text += `• ${formatDate(p.date)} - Pago: ${formatMoney(p.amount)}\n`;
      });
    }

    text += `--------------------------------\n`;
    text += `💰 *Total Compras:* ${formatMoney(totalSales)}\n`;
    text += `✅ *Total Pago:* ${formatMoney(totalPaid)}\n`;
    text += `📌 *SALDO DEVEDOR:* ${formatMoney(balance)}\n`;
    text += `--------------------------------\n`;
    text += `_Emitido via CadernoFiado & Cobrança Zap_`;

    return text;
  }

  /**
   * Gera o PDF completo do cliente com extrato de fiados e pagamentos
   * @param {Object} client - Dados do cliente e transações
   * @param {Object} shopInfo - Dados do estabelecimento (nome, telefone, pix)
   * @returns {Promise<Object>} Resultado da operação com status e método utilizado
   */
  async function generateReceiptPdf(client, shopInfo = {}) {
    if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
      return {
        success: false,
        error: 'Módulo jsPDF não carregado no aplicativo.',
        receiptText: generateReceiptText(client, shopInfo)
      };
    }

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      let y = 18;

      // --- CABEÇALHO TIMBRADO PROFISSIONAL ---
      // Faixa verde comercial superior
      doc.setFillColor(22, 163, 74); // Green 600
      doc.rect(margin, y, pageWidth - (margin * 2), 2.5, 'F');
      y += 8;

      // Nome do Estabelecimento
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42); // Slate 900
      doc.text(shopInfo.shopName || 'MEU ESTABELECIMENTO', margin, y);

      // Subtítulo
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // Slate 500
      doc.text('Comprovante de Extrato de Conta & Registro de Fiado • CadernoFiado Pro', margin, y + 5);

      // Contato e PIX do lojista no topo direito
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      const rightInfo = [
        `Contato: ${shopInfo.phone || 'Não informado'}`,
        `Chave PIX: ${shopInfo.pixKey || 'Não cadastrada'}`,
        `Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
      ];
      rightInfo.forEach((line, idx) => {
        doc.text(line, pageWidth - margin, y + (idx * 4.5), { align: 'right' });
      });

      y += 18;

      // Linha divisória
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(margin, y, pageWidth - margin, y);
      y += 7;

      // --- BOX DO CLIENTE ---
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y, pageWidth - (margin * 2), 22, 2, 2, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(margin, y, pageWidth - (margin * 2), 22, 2, 2, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`CLIENTE: ${client.name.toUpperCase()}`, margin + 5, y + 7);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`WhatsApp: ${client.phone || 'Não informado'}`, margin + 5, y + 14);
      doc.text(`Endereço/Ref: ${client.address || 'Não cadastrado'}`, margin + 65, y + 14);
      
      // Status no box
      const balanceValue = window.AppState ? window.AppState.computeBalance(client) : 0;
      const isPaidOff = balanceValue <= 0.01;

      if (isPaidOff) {
        doc.setFillColor(220, 252, 231);
        doc.setTextColor(22, 101, 52);
        doc.roundedRect(pageWidth - margin - 35, y + 4, 30, 8, 1.5, 1.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text('QUITADO', pageWidth - margin - 20, y + 9.5, { align: 'center' });
      } else {
        doc.setFillColor(254, 242, 242);
        doc.setTextColor(185, 28, 28);
        doc.roundedRect(pageWidth - margin - 35, y + 4, 30, 8, 1.5, 1.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text('EM ABERTO', pageWidth - margin - 20, y + 9.5, { align: 'center' });
      }

      y += 28;

      // --- TABELA DE ITENS COMPRADOS NO FIADO ---
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('1. Discriminação das Compras / Serviços Realizados no Fiado', margin, y);
      y += 5;

      // Cabeçalho da Tabela
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y, pageWidth - (margin * 2), 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text('DATA', margin + 3, y + 4.8);
      doc.text('DESCRIÇÃO DO PRODUTO / SERVIÇO', margin + 30, y + 4.8);
      doc.text('VENCIMENTO', margin + 120, y + 4.8);
      doc.text('VALOR', pageWidth - margin - 3, y + 4.8, { align: 'right' });
      y += 7;

      // Linhas de Compras
      const sales = (client.transactions || []).filter(t => t.type === 'sale');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);

      if (sales.length === 0) {
        doc.text('Nenhum registro de compra encontrado.', margin + 3, y + 5);
        y += 8;
      } else {
        sales.forEach((sale) => {
          doc.text(formatDate(sale.date), margin + 3, y + 4.5);
          const desc = doc.splitTextToSize(sale.description || 'Venda a prazo', 85);
          doc.text(desc, margin + 30, y + 4.5);
          doc.text(formatDate(sale.dueDate), margin + 120, y + 4.5);
          doc.text(formatMoney(sale.amount), pageWidth - margin - 3, y + 4.5, { align: 'right' });

          const rowHeight = Math.max(7, desc.length * 4.5 + 2);
          y += rowHeight;

          doc.setDrawColor(241, 245, 249);
          doc.setLineWidth(0.2);
          doc.line(margin, y, pageWidth - margin, y);
        });
      }

      y += 6;

      // --- TABELA DE PAGAMENTOS / ABATIMENTOS ---
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('2. Histórico de Pagamentos & Abatimentos Efetuados', margin, y);
      y += 5;

      // Cabeçalho de Pagamentos
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y, pageWidth - (margin * 2), 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text('DATA DO PAGAMENTO', margin + 3, y + 4.8);
      doc.text('MODALIDADE', margin + 55, y + 4.8);
      doc.text('OBSERVAÇÃO', margin + 95, y + 4.8);
      doc.text('VALOR PAGO', pageWidth - margin - 3, y + 4.8, { align: 'right' });
      y += 7;

      const payments = (client.transactions || []).filter(t => t.type === 'payment');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);

      if (payments.length === 0) {
        doc.text('Nenhum pagamento registrado até o momento.', margin + 3, y + 5);
        y += 8;
      } else {
        payments.forEach((p) => {
          doc.text(formatDate(p.date), margin + 3, y + 4.5);
          doc.text(p.paymentMethod || 'Dinheiro / PIX', margin + 55, y + 4.5);
          doc.text(p.notes || 'Abatimento de dívida', margin + 95, y + 4.5);
          doc.setTextColor(22, 101, 52);
          doc.text(`- ${formatMoney(p.amount)}`, pageWidth - margin - 3, y + 4.5, { align: 'right' });
          doc.setTextColor(30, 41, 59);

          y += 6.5;
          doc.setDrawColor(241, 245, 249);
          doc.setLineWidth(0.2);
          doc.line(margin, y, pageWidth - margin, y);
        });
      }

      y += 6;

      // --- RESUMO FINANCEIRO FINAL ---
      const totalSales = sales.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
      const totalPaid = payments.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
      const balance = Math.max(0, totalSales - totalPaid);

      doc.setFillColor(248, 250, 252);
      doc.roundedRect(pageWidth - margin - 85, y, 85, 26, 2, 2, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(pageWidth - margin - 85, y, 85, 26, 2, 2, 'S');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text('Total Compras:', pageWidth - margin - 80, y + 6);
      doc.text(formatMoney(totalSales), pageWidth - margin - 5, y + 6, { align: 'right' });

      doc.text('Total Abatido:', pageWidth - margin - 80, y + 12);
      doc.setTextColor(22, 101, 52);
      doc.text(`- ${formatMoney(totalPaid)}`, pageWidth - margin - 5, y + 12, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(isPaidOff ? 22 : 185, isPaidOff ? 101 : 28, isPaidOff ? 52 : 28);
      doc.text('SALDO DEVEDOR:', pageWidth - margin - 80, y + 20);
      doc.text(formatMoney(balance), pageWidth - margin - 5, y + 20, { align: 'right' });

      y += 38;

      // --- TERMO DE RECONHECIMENTO & ASSINATURAS ---
      if (y < 240) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(
          'Declaro para os devidos fins que os valores e itens acima discriminados conferem fielmente com o histórico de transações acordado entre as partes.',
          margin,
          y,
          { maxWidth: pageWidth - (margin * 2) }
        );

        y += 20;

        // Linhas de Assinatura
        doc.setDrawColor(148, 163, 184);
        doc.setLineWidth(0.3);
        
        doc.line(margin + 5, y, margin + 70, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(shopInfo.shopName || 'Assinatura do Responsável', margin + 37, y + 4, { align: 'center' });

        doc.line(pageWidth - margin - 70, y, pageWidth - margin - 5, y);
        doc.text(client.name, pageWidth - margin - 37, y + 4, { align: 'center' });
      }

      // Rodapé
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text('Documento gerado eletronicamente pelo CadernoFiado & Cobrança Zap Pro • Autenticidade Garantida', pageWidth / 2, 287, { align: 'center' });

      const cleanClientName = client.name.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Recibo_Fiado_${cleanClientName}_${new Date().toISOString().split('T')[0]}.pdf`;

      // =========================================================================
      // ESTRATÉGIA DE SALVAMENTO MULTI-CAMADA (Robusto para Mobile, WebView e Web)
      // =========================================================================

      // 1. Ponte Nativa Android (se disponível via AppJavaScriptProxy)
      if (window.androidAppProxy && typeof window.androidAppProxy.saveBase64File === 'function') {
        const base64Data = doc.output('datauristring').split(',')[1];
        window.androidAppProxy.saveBase64File(base64Data, filename, 'application/pdf');
        return { success: true, method: 'android_proxy', filename };
      }

      // 2. Web Share API com File (Suporte Nativo a Android/iOS para envio direto ao Zap/Drive)
      const pdfBlob = doc.output('blob');
      if (typeof File !== 'undefined' && navigator.canShare) {
        try {
          const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });
          if (navigator.canShare({ files: [pdfFile] })) {
            await navigator.share({
              files: [pdfFile],
              title: `Recibo Fiado - ${client.name}`,
              text: `Recibo de fiado de ${client.name} emitido por ${shopInfo.shopName || 'CadernoFiado'}.`
            });
            return { success: true, method: 'web_share', filename };
          }
        } catch (shareErr) {
          // Se o usuário apenas cancelou o menu nativo de compartilhamento
          if (shareErr.name === 'AbortError') {
            return { success: true, method: 'web_share_cancelled', filename };
          }
          console.warn('Web Share API não concluiu, tentando fallback tradicional:', shareErr);
        }
      }

      // 3. Fallback Tradicional via Blob Download
      try {
        doc.save(filename);
        return { success: true, method: 'blob_download', filename };
      } catch (blobErr) {
        console.warn('doc.save falhou, tentando link de dados:', blobErr);
        const dataUri = doc.output('datauristring');
        const link = document.createElement('a');
        link.href = dataUri;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return { success: true, method: 'data_uri_download', filename };
      }

    } catch (error) {
      console.error('Erro na geração/download do PDF:', error);
      return {
        success: false,
        error: error.message || 'Falha ao processar o arquivo PDF.',
        receiptText: generateReceiptText(client, shopInfo)
      };
    }
  }

  return {
    generateReceiptPdf,
    generateReceiptText
  };
})();


// ==========================================
// Arquivo: js\state.js
// ==========================================
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

      const currentDeviceId = getInstallationId();
      if (payload.d && payload.d.toUpperCase() !== currentDeviceId.toUpperCase()) {
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
    activateLicenseKey,
    exportBackup,
    importBackup,
    resetAll
  };
})();


// ==========================================
// Arquivo: js\components\Icons.js
// ==========================================
/**
 * Biblioteca de Ícones SVG Inspirada em Lucide Icons
 * Alto contraste, renderização vetorial instantânea e zero dependência externa.
 */

window.Icons = {
  Users: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  UserPlus: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/>
    </svg>
  ),
  PlusCircle: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="16"/><line x1="8" x2="16" y1="12" y2="12"/>
    </svg>
  ),
  BarChart3: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
    </svg>
  ),
  Crown: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
    </svg>
  ),
  QrCode: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/>
    </svg>
  ),
  FileText: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>
    </svg>
  ),
  MessageCircle: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
    </svg>
  ),
  Search: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
    </svg>
  ),
  Phone: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  Calendar: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>
    </svg>
  ),
  DollarSign: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  CheckCircle2: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
    </svg>
  ),
  AlertTriangle: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>
    </svg>
  ),
  Settings: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  Sparkles: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
    </svg>
  ),
  Play: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="currentColor" className={props.className || ''}>
      <polygon points="6 3 20 12 6 21 6 3"/>
    </svg>
  ),
  Trash2: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>
    </svg>
  ),
  Download: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
    </svg>
  ),
  Upload: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>
    </svg>
  ),
  Copy: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
    </svg>
  ),
  X: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  ),
  Check: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Camera: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>
    </svg>
  ),
  ShieldCheck: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>
    </svg>
  ),
  Moon: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
    </svg>
  ),
  Sun: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
    </svg>
  ),
  Receipt: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>
    </svg>
  ),
  Clock: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  ChevronRight: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <path d="m9 18 6-6-6-6"/>
    </svg>
  ),
  TrendingUp: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
    </svg>
  ),
  Star: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
};

// Proxy para garantir que nenhum ícone acidentalmente retorne undefined e quebre a renderização do React
(function() {
  const fallbackIcon = (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <circle cx="12" cy="12" r="9"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
    </svg>
  );

  const raw = window.Icons;
  window.Icons = new Proxy(raw, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop === 'string' && prop !== '__esModule') {
        return fallbackIcon;
      }
      return undefined;
    }
  });
})();



// ==========================================
// Arquivo: js\components\ConfirmModal.js
// ==========================================
/**
 * Modal Unificado de Confirmação e Notificação (Design System CadernoFiado)
 * Substitui alert() e confirm() nativos por diálogos consistentes e modernos.
 */

window.ConfirmModal = function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger', // 'danger' | 'warning' | 'success' | 'info'
  onConfirm,
  onCancel,
  showCancel = true
}) {
  if (!isOpen) return null;

  const { AlertTriangle, Trash2, CheckCircle2, Info, X } = window.Icons || {};

  const icons = {
    danger: Trash2 ? <Trash2 size={24} /> : <span>🗑️</span>,
    warning: AlertTriangle ? <AlertTriangle size={24} /> : <span>⚠️</span>,
    success: CheckCircle2 ? <CheckCircle2 size={24} /> : <span>✅</span>,
    info: Info ? <Info size={24} /> : <span>ℹ️</span>
  };

  const badgeClasses = {
    danger: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    info: 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
  };

  const confirmBtnClasses = {
    danger: 'bg-rose-600 hover:bg-rose-500 text-white',
    warning: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    info: 'bg-slate-700 hover:bg-slate-600 text-white'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden p-5 space-y-4">
        
        <div className="flex items-start gap-3.5">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${badgeClasses[variant] || badgeClasses.info}`}>
            {icons[variant] || icons.info}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="font-bold text-base text-white leading-tight">
              {title || 'Confirmação'}
            </h3>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed whitespace-pre-line">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800/80">
          {showCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-medium text-xs transition-colors"
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-transform active:scale-95 ${confirmBtnClasses[variant] || confirmBtnClasses.danger}`}
          >
            {confirmText}
          </button>
        </div>

      </div>
    </div>
  );
};


// ==========================================
// Arquivo: js\components\AdMobBanner.js
// ==========================================
/**
 * Componente de Banner AdMob Adaptativo Simulado
 * Exibido no rodapé apenas para usuários do Plano Gratuito.
 * Desaparece 100% no modo VIP ou com Passe 24h ativo.
 */

window.AdMobBanner = function AdMobBanner({ isVip, onOpenVip, onWatchRewarded }) {
  const [adIndex, setAdIndex] = React.useState(0);
  const { Crown, Play, X } = window.Icons;

  // Anúncios realistas voltados para o público de autônomos e pequenos comerciantes
  const ads = [
    {
      sponsor: 'Stone & Ton',
      headline: 'Maquininha com Taxa Zero no 1º Mês',
      description: 'Receba na hora na sua conta e venda em até 18x.',
      cta: 'Pedir Maquininha',
      tag: 'Patrocinado',
      accent: 'from-emerald-950/60 to-slate-900 border-emerald-600/40 text-emerald-400'
    },
    {
      sponsor: 'Distribuidora Cosméticos Brasil',
      headline: 'Atacado de Esmaltes e Perfumes com 50% OFF',
      description: 'Preços de fábrica direto para manicures e revendedoras.',
      cta: 'Ver Catálogo',
      tag: 'Oferta MEI',
      accent: 'from-purple-950/60 to-slate-900 border-purple-600/40 text-purple-400'
    },
    {
      sponsor: 'Banco Inter Empresas',
      headline: 'Conta PJ 100% Gratuita com PIX Ilimitado',
      description: 'Emita boletos sem taxa e gerencie seu fluxo de caixa.',
      cta: 'Abrir Conta',
      tag: 'Finanças',
      accent: 'from-amber-950/60 to-slate-900 border-amber-600/40 text-amber-400'
    }
  ];

  // Alterna o anúncio a cada 15 segundos
  React.useEffect(() => {
    if (isVip) return;
    const interval = setInterval(() => {
      setAdIndex(prev => (prev + 1) % ads.length);
    }, 15000);
    return () => clearInterval(interval);
  }, [isVip, ads.length]);

  // Se o usuário for VIP ou tiver passe de 24h, o banner NUNCA é renderizado
  if (isVip) {
    return null;
  }

  const currentAd = ads[adIndex];

  return (
    <div className="fixed bottom-[60px] left-0 right-0 z-30 max-w-md mx-auto px-2 pointer-events-auto">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border border-slate-700/80 shadow-lg p-2.5 backdrop-blur-md">
        
        {/* Cabeçalho do Banner com Selo AdMob */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-1.5">
            <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              AdMob • {currentAd.tag}
            </span>
            <span className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">
              {currentAd.sponsor}
            </span>
          </div>

          {/* Botão de Remover Anúncios via VIP */}
          <button
            onClick={onOpenVip}
            className="flex items-center space-x-1 text-[10px] text-slate-400 hover:text-amber-400 transition-colors"
            title="Remover anúncios com VIP Pro"
          >
            <Crown size={11} className="text-amber-400" />
            <span className="font-semibold text-amber-400/90">Remover Anúncios</span>
          </button>
        </div>

        {/* Conteúdo do Anúncio */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-white truncate">
              {currentAd.headline}
            </h4>
            <p className="text-[11px] text-slate-300 truncate mt-0.5">
              {currentAd.description}
            </p>
          </div>

          <div className="flex items-center space-x-1.5 flex-shrink-0">
            {/* Botão de Ação do Anúncio */}
            <button
              onClick={() => alert(`Simulação de clique no anúncio: ${currentAd.sponsor} - Redirecionando para oferta.`)}
              className="px-2.5 py-1 rounded-lg bg-brand-500 hover:bg-brand-400 text-slate-950 text-[11px] font-bold shadow-sm active:scale-95 transition-all"
            >
              {currentAd.cta}
            </button>
          </div>
        </div>

        {/* Barra sutil de incentivo para o Vídeo Premiado */}
        <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
          <span className="text-slate-400 flex items-center gap-1">
            💡 Quer usar sem anúncios hoje?
          </span>
          <button
            onClick={onWatchRewarded}
            className="text-brand-400 hover:text-brand-300 font-bold flex items-center gap-1 hover:underline active:scale-95"
          >
            <Play size={10} className="fill-brand-400" />
            Assistir vídeo (VIP 24h Grátis)
          </button>
        </div>

      </div>
    </div>
  );
};


// ==========================================
// Arquivo: js\components\Header.js
// ==========================================
/**
 * Componente de Cabeçalho (Top Bar)
 * Exibe nome do estabelecimento, badge dinâmico de status VIP/Passe e atalhos rápidos.
 */

window.Header = function Header({ vipInfo, remainingTime, onOpenSettings, onOpenVip, isDark, onToggleTheme, shopSettings, onOpenInstall }) {
  const { Crown, Sparkles, Settings, Moon, Sun, Clock, Download } = window.Icons;

  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 dark:bg-slate-950/90 light:bg-white/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 transition-colors duration-200">
      <div className="flex items-center justify-between">
        
        {/* Lado Esquerdo: Identidade do App e Estabelecimento */}
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 p-0.5 shadow-glow-emerald flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <span className="text-xl">📒</span>
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1">
                CadernoFiado <span className="text-brand-400 font-black">Zap</span>
              </h1>
            </div>
            <p className="text-[11px] text-emerald-400/90 font-semibold truncate max-w-[140px] sm:max-w-[200px]">
              {shopSettings?.shopName || 'Meu Estabelecimento'}
            </p>
          </div>
        </div>

        {/* Lado Direito: Badge VIP + Configurações + Tema */}
        <div className="flex items-center space-x-2">
          
          {/* Badge de Status VIP Dinâmico */}
          {vipInfo.isVipPermanent ? (
            <button
              onClick={onOpenVip}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-gold-500/20 border border-amber-500/50 text-amber-300 text-xs font-semibold shadow-glow-gold hover:opacity-90 transition-opacity"
              title="Assinante VIP Pro Permanente"
            >
              <Crown size={13} className="text-amber-400" />
              <span>VIP PRO</span>
            </button>
          ) : vipInfo.isPassActive ? (
            <button
              onClick={onOpenVip}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-semibold shadow-glow-emerald hover:opacity-90 transition-opacity"
              title="Passe VIP Temporário Ativo"
            >
              <Clock size={12} className="text-emerald-400 animate-pulse" />
              <span className="text-[11px]">{remainingTime || 'VIP 24h'}</span>
            </button>
          ) : (
            <button
              onClick={onOpenVip}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              <Sparkles size={12} className="text-amber-400" />
              <span className="hidden sm:inline">Virar</span> <span>VIP</span>
            </button>
          )}

          {/* Botão de Instalar App */}
          <button
            onClick={onOpenInstall}
            className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            aria-label="Instalar Aplicativo no Celular"
            title="Instalar App no Celular / Computador"
          >
            <Download size={16} />
            <span className="hidden md:inline">Instalar</span>
          </button>

          {/* Alternador de Tema Escuro / Claro */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
            aria-label="Alternar Tema"
            title="Alternar Modo Escuro / Claro"
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Botão de Configurações */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
            aria-label="Configurações do Negócio"
            title="Configurações & Backup"
          >
            <Settings size={17} />
          </button>

        </div>

      </div>
    </header>
  );
};


// ==========================================
// Arquivo: js\components\BottomNav.js
// ==========================================
/**
 * Barra de Navegação Inferior Estilo Android / Mobile App Nativo
 * 4 Atalhos Fixos: 'Clientes & Fiados', 'Novo Registro', 'Relatórios de Caixa' e 'Plano VIP Pro'
 */

window.BottomNav = function BottomNav({ activeTab, onSelectTab, overdueCount, isVip }) {
  const { Users, PlusCircle, BarChart3, Crown } = window.Icons;

  const tabs = [
    {
      id: 'clients',
      label: 'Clientes & Fiados',
      icon: Users,
      badge: overdueCount > 0 ? overdueCount : null,
      badgeColor: 'bg-rose-500'
    },
    {
      id: 'new_record',
      label: 'Novo Registro',
      icon: PlusCircle,
      isPrimary: true
    },
    {
      id: 'reports',
      label: 'Relatórios Caixa',
      icon: BarChart3
    },
    {
      id: 'vip',
      label: 'Plano VIP Pro',
      icon: Crown,
      badge: isVip ? 'ATIVO' : 'PRO',
      badgeColor: isVip ? 'bg-emerald-500' : 'bg-amber-500'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 dark:bg-slate-950/95 light:bg-white/95 backdrop-blur-lg border-t border-slate-800/90 max-w-md mx-auto transition-colors duration-200">
      <div className="flex items-center justify-around px-2 py-1.5 safe-area-bottom">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          if (tab.isPrimary) {
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className="flex flex-col items-center justify-center -mt-5 group focus:outline-none"
                aria-label={tab.label}
              >
                <div className={`w-13 h-13 p-3 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 group-active:scale-95 ${
                  isActive
                    ? 'bg-gradient-to-tr from-brand-600 to-emerald-400 text-slate-950 shadow-glow-emerald'
                    : 'bg-brand-500 hover:bg-brand-400 text-slate-950 shadow-brand-500/30'
                }`}>
                  <Icon size={24} strokeWidth={2.4} />
                </div>
                <span className={`text-[10px] font-semibold mt-1 tracking-tight ${
                  isActive ? 'text-brand-400' : 'text-slate-400 group-hover:text-slate-200'
                }`}>
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-200 focus:outline-none ${
                isActive 
                  ? 'text-brand-400 font-semibold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Ícone com badge se houver */}
              <div className="relative">
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'scale-105 transition-transform' : ''} />
                {tab.badge && (
                  <span className={`absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold text-white shadow-sm ${tab.badgeColor}`}>
                    {tab.badge}
                  </span>
                )}
              </div>

              {/* Rótulo */}
              <span className={`text-[10px] tracking-tight mt-1 ${isActive ? 'text-brand-400 font-bold' : 'text-slate-400'}`}>
                {tab.label}
              </span>

              {/* Indicador de aba ativa */}
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-0.5 shadow-glow-emerald"></div>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};


// ==========================================
// Arquivo: js\components\RewardedAdModal.js
// ==========================================
/**
 * Modal de Vídeo Premiado (Rewarded Video Ad)
 * Simula uma experiência realista de anúncio AdMob com contagem regressiva de 5s,
 * barra de progresso interativa e liberação do Passe VIP Pro de 24 Horas com confetes.
 */

window.RewardedAdModal = function RewardedAdModal({ isOpen, onClose, onRewardGranted }) {
  const [countdown, setCountdown] = React.useState(5);
  const [completed, setCompleted] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const { X, Crown, Sparkles, CheckCircle2 } = window.Icons;

  React.useEffect(() => {
    if (!isOpen) {
      setCountdown(5);
      setCompleted(false);
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCompleted(true);
          // Dispara confetes de comemoração!
          if (typeof confetti === 'function') {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 }
            });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClaimReward = () => {
    window.AppState.activate24hPass();
    if (onRewardGranted) onRewardGranted();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
        
        {/* Barra de Progresso Superior */}
        <div className="w-full bg-slate-800 h-1.5 overflow-hidden">
          <div 
            className="bg-brand-500 h-full transition-all duration-1000 ease-linear"
            style={{ width: `${((5 - countdown) / 5) * 100}%` }}
          />
        </div>

        {/* Topo com Contador e Selo AdMob */}
        <div className="p-3.5 flex items-center justify-between border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Rewarded Ad • AdMob
            </span>
            <span className="text-xs text-slate-400">Vídeo Premiado</span>
          </div>

          <div className="flex items-center space-x-2">
            {!completed ? (
              <span className="text-xs font-mono font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20">
                Recompensa em {countdown}s
              </span>
            ) : (
              <button 
                onClick={onClose} 
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Corpo do Anúncio (Simulação Realista de Vídeo) */}
        <div className="p-6 text-center">
          {!completed ? (
            <div className="space-y-4">
              {/* Moldura de Vídeo Interativa */}
              <div className="relative rounded-2xl bg-gradient-to-br from-slate-950 to-slate-800 border border-slate-700/60 p-6 flex flex-col items-center justify-center min-h-[190px] shadow-inner">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-3xl shadow-glow-emerald animate-bounce">
                  💳
                </div>
                <h3 className="text-base font-bold text-white mt-3">
                  InfinitePay & Ton Brasil
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-[220px]">
                  A maquininha com a menor taxa do Brasil para autônomos. Sem mensalidade e com PIX no visor.
                </p>
                
                {/* Simulação de ondas sonoras/reprodução */}
                <div className="flex items-center space-x-1 mt-3">
                  <div className="w-1 h-3 bg-brand-400 rounded-full animate-pulse"></div>
                  <div className="w-1 h-5 bg-brand-500 rounded-full animate-pulse delay-75"></div>
                  <div className="w-1 h-4 bg-brand-300 rounded-full animate-pulse delay-150"></div>
                  <div className="w-1 h-6 bg-brand-400 rounded-full animate-pulse"></div>
                  <span className="text-[10px] text-slate-400 ml-2 font-mono">Reproduzindo anúncio...</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                Assista até o fim para desbloquear <b>24h de PIX Automático, PDF Timbrado e Zero Anúncios</b>!
              </p>
            </div>
          ) : (
            /* Estado de Sucesso: Recompensa Pronta */
            <div className="py-2 space-y-4 animate-scaleUp">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-glow-emerald">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white flex items-center justify-center gap-1.5">
                  <Sparkles size={18} className="text-amber-400" />
                  Passe VIP Liberado!
                </h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  Você concluiu o vídeo e desbloqueou <b>24 Horas de Acesso VIP PRO</b> em todas as funcionalidades do aplicativo!
                </p>
              </div>

              <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800 text-left space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
                  <span>✓</span> <span>PIX Copia e Cola & QR Code Automático liberados</span>
                </div>
                <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
                  <span>✓</span> <span>Recibos e Extratos em PDF Profissionais</span>
                </div>
                <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
                  <span>✓</span> <span>100% Livre de Banners e Anúncios</span>
                </div>
              </div>

              <button
                onClick={handleClaimReward}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-emerald-400 hover:from-brand-400 hover:to-emerald-300 text-slate-950 font-bold text-sm shadow-glow-emerald active:scale-95 transition-all flex items-center justify-center space-x-2"
              >
                <Crown size={16} />
                <span>Ativar Meu Passe VIP de 24h</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};


// ==========================================
// Arquivo: js\components\WhatsAppModal.js
// ==========================================
/**
 * Modal de Cobrança Inteligente no WhatsApp
 * 4 tons de cobrança estratégicos (Amigável, Vence Hoje, Cobrança Firme e Acordo com Desconto).
 * Pré-visualização idêntica à interface do WhatsApp com edição direta e envio em 1 clique.
 */

window.WhatsAppModal = function WhatsAppModal({ isOpen, onClose, client, shopSettings, pixPayload }) {
  const [tone, setTone] = React.useState('amigavel');
  const [copied, setCopied] = React.useState(false);
  const [includePix, setIncludePix] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [customMessage, setCustomMessage] = React.useState('');

  const { X, MessageCircle, Copy, Check, QrCode, ShieldCheck, Sparkles, Phone } = window.Icons;

  if (!isOpen || !client) return null;

  const debt = window.AppState.computeBalance(client);
  const formattedDebt = `R$ ${debt.toFixed(2).replace('.', ',')}`;
  const discountDebt = (debt * 0.95).toFixed(2).replace('.', ',');

  // Busca itens em aberto
  const openSales = (client.transactions || []).filter(t => t.type === 'sale');
  const itemsDescription = openSales.length > 0 
    ? openSales.map(s => s.description).filter(Boolean).slice(0, 3).join(', ')
    : 'compras no fiado';

  const nearestDueDate = openSales.length > 0 && openSales[0].dueDate 
    ? openSales[0].dueDate.split('-').reverse().join('/') 
    : 'data combinada';

  // Montagem do texto base conforme o tom
  let defaultMessage = '';
  if (tone === 'amigavel') {
    defaultMessage = `Oi, ${client.name}! Tudo bem com você? 😊\n\nPassando aqui de forma bem tranquila só para lembrar do nosso fechamento referente a: *${itemsDescription}* no valor de *${formattedDebt}*.\n\nSe puder me dar um retorno sobre o acerto para deixarmos tudo certinho, te agradeço muito! 🙏`;
  } else if (tone === 'hoje') {
    defaultMessage = `Olá, ${client.name}! Tudo bem?\n\nHoje é o dia que combinamos o acerto de *${formattedDebt}* (referente a *${itemsDescription}*).\n\nPosso te mandar a chave PIX ou prefere passar aqui para acertar? Um abraço! ✨`;
  } else if (tone === 'acordo') {
    defaultMessage = `Oi, ${client.name}! Tudo bem? 🏷️\n\nQuero te ajudar a quitar sua conta hoje: se você puder pagar hoje via PIX, consigo te dar 5% de desconto especial!\n\nDe *${formattedDebt}* fica apenas *R$ ${discountDebt}*.\n\nPodemos fechar assim? Me avisa aqui! 🤝`;
  } else {
    defaultMessage = `Olá, ${client.name}. Espero que esteja bem.\n\nConsta aqui no meu sistema um saldo em aberto de *${formattedDebt}* referente a *${itemsDescription}* (vencido em *${nearestDueDate}*).\n\nComo trabalho com capital de giro próprio e preciso honrar com meus fornecedores, peço a gentileza de regularizarmos essa pendência ainda hoje. Obrigado pela compreensão! 🤝`;
  }

  // Gera ou anexa o PIX caso habilitado
  let finalPixPayload = pixPayload;
  if (!finalPixPayload && includePix && shopSettings?.pixKey) {
    try {
      finalPixPayload = window.PixService.generatePayload({
        pixKey: shopSettings.pixKey,
        merchantName: shopSettings.shopName || 'MEU COMERCIO',
        merchantCity: shopSettings.city || 'BRASIL',
        amount: tone === 'acordo' ? (debt * 0.95) : debt,
        txid: `F${client.id.replace(/\D/g, '').slice(-6)}`
      });
    } catch(e) {
      finalPixPayload = '';
    }
  }

  if (includePix && shopSettings?.pixKey) {
    defaultMessage += `\n\n🔑 *Chave PIX:* ${shopSettings.pixKey} (${shopSettings.pixKeyType || 'Chave'})\n*Favorecido:* ${shopSettings.shopName || shopSettings.ownerName || 'Estabelecimento'}`;
    if (finalPixPayload) {
      defaultMessage += `\n\n📲 *Código PIX Copia e Cola:*\n\`${finalPixPayload}\``;
    }
  }

  const activeMessage = isEditing ? customMessage : defaultMessage;

  const handleToneChange = (newTone) => {
    setTone(newTone);
    setIsEditing(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(activeMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendWhatsApp = () => {
    let cleanPhone = (client.phone || '').replace(/\D/g, '');
    if (!cleanPhone.startsWith('55') && cleanPhone.length >= 10) {
      cleanPhone = '55' + cleanPhone;
    }
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(activeMessage)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Topo Elegante do Modal */}
        <div className="px-4 py-3.5 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/50 border-b border-emerald-800/40 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-glow-emerald flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-emerald-400">
                <MessageCircle size={20} />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                Cobrança WhatsApp <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">Turbo Zap</span>
              </h3>
              <p className="text-xs text-slate-300">
                {client.name} • <span className="text-emerald-400 font-semibold">{formattedDebt}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Conteúdo Rolável */}
        <div className="p-4 space-y-3.5 overflow-y-auto">
          
          {/* Seletor de 4 Estratégias de Cobrança */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Estratégia da Mensagem:
              </label>
              <span className="text-[11px] text-slate-400">
                {tone === 'amigavel' && '🌸 Mantém a boa relação'}
                {tone === 'hoje' && '📅 Lembrete de vencimento'}
                {tone === 'acordo' && '🏷️ 5% desc. p/ receber na hora'}
                {tone === 'firme' && '⚠️ Aviso formal de cobrança'}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => handleToneChange('amigavel')}
                className={`py-2 px-1 rounded-xl text-[11px] font-medium border text-center transition-all ${
                  tone === 'amigavel'
                    ? 'bg-emerald-500/25 border-emerald-500 text-emerald-300 font-bold shadow-glow-emerald'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Amigável
              </button>
              <button
                type="button"
                onClick={() => handleToneChange('hoje')}
                className={`py-2 px-1 rounded-xl text-[11px] font-medium border text-center transition-all ${
                  tone === 'hoje'
                    ? 'bg-blue-500/25 border-blue-500 text-blue-300 font-bold'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Vence Hoje
              </button>
              <button
                type="button"
                onClick={() => handleToneChange('acordo')}
                className={`py-2 px-1 rounded-xl text-[11px] font-medium border text-center transition-all ${
                  tone === 'acordo'
                    ? 'bg-amber-500/25 border-amber-500 text-amber-300 font-bold shadow-glow-gold'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Desconto
              </button>
              <button
                type="button"
                onClick={() => handleToneChange('firme')}
                className={`py-2 px-1 rounded-xl text-[11px] font-medium border text-center transition-all ${
                  tone === 'firme'
                    ? 'bg-rose-500/25 border-rose-500 text-rose-300 font-bold'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Firme
              </button>
            </div>
          </div>

          {/* Toggle Chave PIX */}
          {shopSettings?.pixKey && (
            <label className="flex items-center space-x-2.5 text-xs text-slate-300 cursor-pointer bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors">
              <input
                type="checkbox"
                checked={includePix}
                onChange={e => {
                  setIncludePix(e.target.checked);
                  setIsEditing(false);
                }}
                className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4 bg-slate-900"
              />
              <div className="flex-1">
                <span className="font-semibold text-white block">Anexar Chave PIX e Copia e Cola</span>
                <span className="text-[10px] text-slate-400">Facilita o cliente pagar sem sair do WhatsApp</span>
              </div>
              <QrCode size={18} className="text-emerald-400" />
            </label>
          )}

          {/* Pré-visualização Autêntica do WhatsApp */}
          <div className="rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
            {/* Barra de Status do WhatsApp */}
            <div className="bg-[#1f2c34] px-3 py-2 flex items-center justify-between border-b border-[#2a3942]">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                  {client.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-semibold text-white leading-tight">{client.name}</p>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> online
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isEditing) setCustomMessage(defaultMessage);
                  setIsEditing(!isEditing);
                }}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium underline"
              >
                {isEditing ? 'Restaurar Padrão' : 'Editar Texto'}
              </button>
            </div>

            {/* Fundo da Conversa com Padrão WhatsApp */}
            <div className="wa-chat-container p-3.5 max-h-48 overflow-y-auto">
              {isEditing ? (
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full bg-[#005c4b] text-white p-3 rounded-2xl rounded-tr-none text-xs leading-relaxed border border-emerald-400/50 focus:outline-none focus:ring-1 focus:ring-emerald-400 resize-none h-36"
                  placeholder="Personalize sua mensagem aqui..."
                />
              ) : (
                <div className="wa-bubble-sent text-slate-100 p-3 text-xs whitespace-pre-wrap leading-relaxed">
                  {activeMessage}
                  <div className="text-[10px] text-emerald-200/80 text-right mt-1.5 flex items-center justify-end gap-1">
                    <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-cyan-300 font-bold">✓✓</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={handleCopy}
              className="py-3 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 flex items-center justify-center space-x-2 transition-all transform active:scale-95 shadow-md"
            >
              {copied ? (
                <>
                  <Check size={16} className="text-emerald-400" />
                  <span className="text-emerald-400">Texto Copiado!</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copiar Mensagem</span>
                </>
              )}
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="py-3 px-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-glow-emerald flex items-center justify-center space-x-2 transition-all transform active:scale-95"
            >
              <MessageCircle size={17} />
              <span>Enviar no WhatsApp</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};


// ==========================================
// Arquivo: js\components\PixModal.js
// ==========================================
/**
 * Modal de Cobrança PIX Automática (Padrão Banco Central / EMVCo)
 * QR Code dinâmico gerado no cliente + Código Copia e Cola com 1 clique e envio rápido no Zap.
 */

window.PixModal = function PixModal({ isOpen, onClose, client, shopSettings, onOpenWhatsApp }) {
  const [copied, setCopied] = React.useState(false);
  const [pixPayload, setPixPayload] = React.useState('');
  const qrRef = React.useRef(null);
  const { X, QrCode, Copy, Check, MessageCircle, Crown, ShieldCheck, Sparkles } = window.Icons;

  if (!isOpen || !client) return null;

  const debt = window.AppState.computeBalance(client);
  const formattedDebt = `R$ ${debt.toFixed(2).replace('.', ',')}`;

  // Gera o payload oficial do PIX e renderiza o QR Code
  React.useEffect(() => {
    if (!isOpen || !client) return;

    try {
      const payload = window.PixService.generatePayload({
        pixKey: shopSettings?.pixKey || '11987650000',
        merchantName: shopSettings?.shopName || 'MEU COMERCIO',
        merchantCity: shopSettings?.city || 'BRASIL',
        amount: debt,
        txid: `F${client.id.replace(/\D/g, '').slice(-6)}`
      });

      setPixPayload(payload);

      // Renderiza o QR Code após o elemento estar no DOM
      setTimeout(() => {
        if (qrRef.current) {
          window.PixService.renderQRCode(qrRef.current, payload, 190);
        }
      }, 50);
    } catch(err) {
      console.error('Erro ao gerar payload PIX:', err);
    }
  }, [isOpen, client, debt, shopSettings]);

  const handleCopy = () => {
    if (!pixPayload) return;
    navigator.clipboard.writeText(pixPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Cabeçalho VIP com Destaque Dourado */}
        <div className="p-4 bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/50 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-glow-gold">
              <Crown size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-1">
                Cobrança Instantânea <span className="text-amber-400 font-extrabold text-[11px] px-1.5 py-0.5 rounded bg-amber-500/20">PIX</span>
              </h3>
              <p className="text-xs text-slate-300">{client.name}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-4 space-y-4">
          
          {/* Card do Valor Total da Cobrança */}
          <div className="bg-gradient-to-br from-slate-950 to-slate-900 p-3.5 rounded-2xl border border-slate-800 text-center shadow-inner relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Valor Exato a Receber
            </span>
            <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">
              {formattedDebt}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-center gap-1.5">
              <span>Chave: <strong>{shopSettings?.pixKey || 'Não cadastrada'}</strong></span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-medium">Sem taxas intermediárias</span>
            </div>
          </div>

          {/* QR Code Oficial */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative p-3 bg-white rounded-3xl shadow-xl border-4 border-slate-800 flex items-center justify-center">
              {/* Linha animada de scanner */}
              <div className="absolute inset-x-3 top-3 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-scanline pointer-events-none" />
              <div ref={qrRef} className="w-[190px] h-[190px] flex items-center justify-center" />
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-2 flex items-center gap-1 font-medium">
              <ShieldCheck size={14} className="text-emerald-400" />
              Padrão Oficial Banco Central do Brasil (EMVCo)
            </p>
          </div>

          {/* Código PIX Copia e Cola */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                Código PIX Copia e Cola:
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold"
              >
                {copied ? 'Copiado!' : 'Copiar código'}
              </button>
            </div>
            <div className="relative flex items-center">
              <input
                type="text"
                readOnly
                value={pixPayload || 'Gerando código PIX...'}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl py-2.5 pl-3 pr-20 text-xs text-slate-300 font-mono select-all focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={handleCopy}
                className="absolute right-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1 shadow-md transition-all active:scale-95"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Pronto' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          {/* Ações Inferiores */}
          <div className="pt-1">
            <button
              onClick={() => {
                onClose();
                if (onOpenWhatsApp) {
                  onOpenWhatsApp(client, pixPayload);
                }
              }}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-glow-emerald flex items-center justify-center space-x-2 transition-all transform active:scale-95"
            >
              <MessageCircle size={17} />
              <span>Enviar QR Code e Código no WhatsApp</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};


// ==========================================
// Arquivo: js\components\SettingsModal.js
// ==========================================
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


// ==========================================
// Arquivo: js\components\ClientDetailModal.js
// ==========================================
/**
 * Modal Detalhado do Cliente (Ficha de Fiados, Abatimentos e Ações Rápidas)
 * Inclui geração robusta de PDF, integração com ConfirmModal e contingência via WhatsApp.
 */

window.ClientDetailModal = function ClientDetailModal({
  isOpen,
  client: propClient,
  clientId,
  onClose,
  onOpenWhatsApp,
  onOpenPix,
  onTriggerPaywall,
  isVip,
  shopSettings
}) {
  const client = propClient || (clientId && window.AppState ? window.AppState.getClient(clientId) : null);
  const [activeSubTab, setActiveSubTab] = React.useState('extrato'); // 'extrato' | 'abater'
  const [payAmount, setPayAmount] = React.useState('');
  const [payMethod, setPayMethod] = React.useState('Dinheiro');
  const [payNotes, setPayNotes] = React.useState('');
  const [showPhotoModal, setShowPhotoModal] = React.useState(null);
  
  // Estados para diálogos integrados (sem alert/confirm nativos)
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [feedbackModal, setFeedbackModal] = React.useState({ isOpen: false, title: '', message: '', variant: 'info' });
  const [pdfLoading, setPdfLoading] = React.useState(false);
  const [pdfErrorData, setPdfErrorData] = React.useState(null);

  const {
    X, Phone, MapPin, Calendar, Clock, DollarSign,
    CheckCircle2, AlertTriangle, FileText, QrCode, MessageCircle, Trash2, Check, Crown
  } = window.Icons || {};

  if (!isOpen || !client) return null;

  const debt = window.AppState ? window.AppState.computeBalance(client) : 0;
  const status = window.AppState ? window.AppState.getClientStatus(client) : 'em_dia';
  const formattedDebt = `R$ ${debt.toFixed(2).replace('.', ',')}`;
  const creditLimit = client.creditLimit || 300;
  const limitUsagePct = Math.min(100, Math.round((debt / creditLimit) * 100));

  // Handler para registrar abatimento
  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(payAmount);
    if (isNaN(val) || val <= 0) {
      setFeedbackModal({
        isOpen: true,
        title: 'Valor Inválido',
        message: 'Por favor, informe um valor numérico válido maior que zero para o pagamento.',
        variant: 'warning'
      });
      return;
    }

    const { remainingDebt } = window.AppState.addPayment(client.id, {
      amount: val,
      paymentMethod: payMethod,
      notes: payNotes
    });

    if (remainingDebt <= 0.01) {
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    }

    setPayAmount('');
    setPayNotes('');
    setActiveSubTab('extrato');
  };

  // Quitação total rápida
  const handleFullPayoff = () => {
    if (debt <= 0) return;
    setPayAmount(debt.toFixed(2));
    setPayNotes('Quitação total do saldo');
    setActiveSubTab('abater');
  };

  // Proteção de Recursos VIP
  const handlePixClick = () => {
    if (debt <= 0) {
      setFeedbackModal({
        isOpen: true,
        title: 'Conta Quitada',
        message: 'Este cliente já está com o saldo em dia! Não há débitos pendentes para gerar cobrança.',
        variant: 'info'
      });
      return;
    }
    if (isVip) {
      onOpenPix(client);
    } else {
      onTriggerPaywall('pix');
    }
  };

  // Gerador de Recibo PDF com suporte a erro amigável e fallback
  const handlePdfClick = async () => {
    if (!isVip) {
      onTriggerPaywall('pdf');
      return;
    }

    setPdfLoading(true);
    const result = await window.PdfService.generateReceiptPdf(client, shopSettings);
    setPdfLoading(false);

    if (!result.success) {
      setPdfErrorData(result);
    }
  };

  // Envio alternativo em texto pelo WhatsApp quando PDF falha
  const handleSendTextReceiptViaWhatsApp = () => {
    if (!pdfErrorData || !pdfErrorData.receiptText) return;
    const phone = (client.phone || '').replace(/\D/g, '');
    const cleanPhone = phone.startsWith('55') ? phone : (phone ? '55' + phone : '');
    const url = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(pdfErrorData.receiptText)}`
      : `https://wa.me/?text=${encodeURIComponent(pdfErrorData.receiptText)}`;
    window.open(url, '_blank');
    setPdfErrorData(null);
  };

  const handleCopyTextReceipt = () => {
    if (!pdfErrorData || !pdfErrorData.receiptText) return;
    navigator.clipboard.writeText(pdfErrorData.receiptText);
    setFeedbackModal({
      isOpen: true,
      title: 'Copiado com Sucesso',
      message: 'O extrato detalhado em texto foi copiado para sua área de transferência! Você pode colar em qualquer conversa do WhatsApp.',
      variant: 'success'
    });
    setPdfErrorData(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Cabeçalho */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-base text-white truncate">{client.name}</h2>
              {status === 'quitado' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Check size={11} /> Quitado
                </span>
              )}
              {status === 'atrasado' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                  <AlertTriangle size={11} /> Atrasado
                </span>
              )}
              {status === 'em_dia' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  Em Aberto
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 truncate mt-0.5">
              {client.phone ? `WhatsApp: ${client.phone}` : 'Sem telefone'} • {client.address || 'Sem endereço'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
          >
            <X size={18} />
          </button>
        </div>

        {/* Card de Saldo e Barra de Limite */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                Saldo Devedor Atual
              </span>
              <span className={`text-2xl font-extrabold font-mono ${
                debt > 0 ? (status === 'atrasado' ? 'text-rose-400' : 'text-amber-400') : 'text-emerald-400'
              }`}>
                {formattedDebt}
              </span>
            </div>

            {debt > 0 ? (
              <button
                onClick={handleFullPayoff}
                className="py-1.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
              >
                <CheckCircle2 size={14} />
                <span>Quitar Tudo</span>
              </button>
            ) : (
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                ⭐ Em Dia
              </span>
            )}
          </div>

          {/* Barra de Limite de Crédito */}
          <div>
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>Limite Usado: {limitUsagePct}%</span>
              <span>Limite Total: R$ {creditLimit.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  limitUsagePct > 90 ? 'bg-rose-500' : limitUsagePct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${limitUsagePct}%` }}
              />
            </div>
            {limitUsagePct >= 100 && (
              <p className="text-[10px] text-rose-400 mt-1 font-semibold flex items-center gap-1">
                <AlertTriangle size={11} /> Limite de crédito atingido! Avalie um acerto antes de novas vendas.
              </p>
            )}
          </div>
        </div>

        {/* 4 Botões Rápidos de Ação */}
        <div className="grid grid-cols-4 gap-2 p-3 bg-slate-900 border-b border-slate-800">
          
          {/* Cobrar Zap */}
          <button
            onClick={() => onOpenWhatsApp(client)}
            disabled={debt <= 0}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-750 text-slate-200 disabled:opacity-40 transition-all active:scale-95"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-1">
              <MessageCircle size={16} />
            </div>
            <span className="text-[10px] font-semibold text-center leading-tight">Cobrar Zap</span>
          </button>

          {/* PIX Automático (VIP) */}
          <button
            onClick={handlePixClick}
            disabled={debt <= 0}
            className="relative flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-750 text-slate-200 disabled:opacity-40 transition-all active:scale-95"
          >
            {!isVip && (
              <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded-full text-[8px] font-extrabold bg-amber-500 text-slate-950 flex items-center gap-0.5">
                VIP
              </span>
            )}
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-1">
              <QrCode size={16} />
            </div>
            <span className="text-[10px] font-semibold text-center leading-tight">Gerar PIX</span>
          </button>

          {/* Recibo PDF (VIP) */}
          <button
            onClick={handlePdfClick}
            disabled={pdfLoading}
            className="relative flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-750 text-slate-200 transition-all active:scale-95"
          >
            {!isVip && (
              <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded-full text-[8px] font-extrabold bg-amber-500 text-slate-950 flex items-center gap-0.5">
                VIP
              </span>
            )}
            <div className="w-8 h-8 rounded-lg bg-slate-700 text-slate-200 flex items-center justify-center mb-1">
              {pdfLoading ? (
                <div className="w-4 h-4 border-2 border-slate-300 border-t-emerald-500 rounded-full animate-spin" />
              ) : (
                <FileText size={16} />
              )}
            </div>
            <span className="text-[10px] font-semibold text-center leading-tight">
              {pdfLoading ? 'Gerando...' : 'Recibo PDF'}
            </span>
          </button>

          {/* Abater Pagamento */}
          <button
            onClick={() => setActiveSubTab(activeSubTab === 'abater' ? 'extrato' : 'abater')}
            className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all active:scale-95 ${
              activeSubTab === 'abater'
                ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 hover:bg-slate-750 border-slate-750 text-slate-200'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-1">
              <DollarSign size={16} />
            </div>
            <span className="text-[10px] font-semibold text-center leading-tight">
              {activeSubTab === 'abater' ? 'Ver Extrato' : 'Abater'}
            </span>
          </button>

        </div>

        {/* Conteúdo Dinâmico: Formulário de Abatimento OU Extrato */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          
          {activeSubTab === 'abater' ? (
            /* Formulário de Baixa de Pagamento */
            <form onSubmit={handlePaymentSubmit} className="space-y-3 animate-fadeIn">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <h4 className="text-xs font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                  <DollarSign size={14} /> Registrar Pagamento / Abatimento
                </h4>
                <p className="text-[11px] text-slate-400">
                  Informe o valor recebido deste cliente. O saldo devedor será recalculado instantaneamente.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Valor Pago (R$):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={debt > 0 ? debt : undefined}
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    placeholder="0,00"
                    required
                    autoFocus
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-base font-bold text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Forma:</label>
                  <select
                    value={payMethod}
                    onChange={e => setPayMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="PIX">PIX</option>
                    <option value="Cartão de Débito">Cartão Débito</option>
                    <option value="Cartão de Crédito">Cartão Crédito</option>
                    <option value="Transferência">Transferência</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Observação:</label>
                  <input
                    type="text"
                    value={payNotes}
                    onChange={e => setPayNotes(e.target.value)}
                    placeholder="Ex: Deixou com a funcionária"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('extrato')}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all active:scale-95"
                >
                  Confirmar Recebimento
                </button>
              </div>
            </form>
          ) : (
            /* Lista de Transações / Extrato */
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Clock size={14} className="text-emerald-400" />
                  Extrato de Compras e Abates
                </h4>
                <span className="text-[10px] text-slate-400">
                  {client.transactions?.length || 0} registro(s)
                </span>
              </div>

              {(!client.transactions || client.transactions.length === 0) ? (
                <div className="text-center py-10 px-4 rounded-xl bg-slate-950/40 border border-slate-800/80">
                  <span className="text-2xl block mb-1">📝</span>
                  <p className="text-xs font-semibold text-slate-300">Nenhum registro ainda</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    As compras no fiado e pagamentos deste cliente serão listados aqui.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {client.transactions.map((tx) => {
                    const isSale = tx.type === 'sale';
                    const txDate = tx.date ? new Date(tx.date).toLocaleDateString('pt-BR') : '-';
                    const txDue = tx.dueDate ? tx.dueDate.split('-').reverse().join('/') : null;

                    return (
                      <div
                        key={tx.id}
                        className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-start space-x-2.5 min-w-0">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            isSale ? 'bg-rose-500/15 text-rose-400' : 'bg-emerald-500/15 text-emerald-400'
                          }`}>
                            {isSale ? '🛍️' : '💵'}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-white block truncate">
                              {isSale ? tx.description || 'Compra no Fiado' : `Abatimento (${tx.paymentMethod || 'Dinheiro'})`}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                              <span>{txDate}</span>
                              {isSale && txDue && (
                                <span className="text-amber-400/90 font-medium">Venc: {txDue}</span>
                              )}
                              {!isSale && tx.notes && (
                                <span className="text-slate-400 truncate max-w-[120px]">{tx.notes}</span>
                              )}
                            </div>
                            {tx.photoUrl && (
                              <button
                                onClick={() => setShowPhotoModal(tx.photoUrl)}
                                className="text-[10px] text-emerald-400 hover:underline mt-0.5 block"
                              >
                                Ver Comprovante/Foto 📎
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0 font-mono font-bold">
                          <span className={isSale ? 'text-rose-400' : 'text-emerald-400'}>
                            {isSale ? `+ R$ ${parseFloat(tx.amount).toFixed(2).replace('.', ',')}` : `- R$ ${parseFloat(tx.amount).toFixed(2).replace('.', ',')}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Rodapé com Exclusão */}
        <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
          >
            <Trash2 size={13} />
            <span>Excluir cadastro</span>
          </button>

          <span className="text-[10px] text-slate-500">
            Cadastrado em: {client.createdAt ? new Date(client.createdAt).toLocaleDateString('pt-BR') : '-'}
          </span>
        </div>

        {/* Modal de Confirmação de Exclusão */}
        <window.ConfirmModal
          isOpen={showDeleteConfirm}
          title="Excluir Cliente"
          message={`Tem certeza que deseja remover o cadastro de ${client.name}?\nO histórico de compras e pagamentos será apagado.`}
          confirmText="Sim, Excluir"
          cancelText="Cancelar"
          variant="danger"
          onConfirm={() => {
            window.AppState.deleteClient(client.id);
            setShowDeleteConfirm(false);
            onClose();
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />

        {/* Modal de Contingência de PDF (Falha de download nativo) */}
        {pdfErrorData && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-2xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Download do PDF Bloqueado</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    O sistema operacional deste aparelho bloqueou o download direto de arquivos. Você pode enviar o extrato detalhado por texto no WhatsApp ou copiá-lo:
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleSendTextReceiptViaWhatsApp}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle size={15} />
                  <span>Enviar Extrato no WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyTextReceipt}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold text-xs transition-colors"
                >
                  Copiar Texto do Extrato
                </button>

                <button
                  type="button"
                  onClick={() => setPdfErrorData(null)}
                  className="w-full py-1.5 text-xs text-slate-400 hover:text-white text-center transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Genérico de Feedback */}
        <window.ConfirmModal
          isOpen={feedbackModal.isOpen}
          title={feedbackModal.title}
          message={feedbackModal.message}
          confirmText="Entendi"
          variant={feedbackModal.variant}
          showCancel={false}
          onConfirm={() => setFeedbackModal({ ...feedbackModal, isOpen: false })}
        />

        {/* Modal de Foto/Comprovante Anexo */}
        {showPhotoModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90" onClick={() => setShowPhotoModal(null)}>
            <div className="relative max-w-sm max-h-[80vh] rounded-2xl overflow-hidden bg-slate-900 border border-slate-700" onClick={e => e.stopPropagation()}>
              <img src={showPhotoModal} alt="Comprovante" className="w-full h-auto object-contain max-h-[70vh]" />
              <button
                onClick={() => setShowPhotoModal(null)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};


// ==========================================
// Arquivo: js\components\ClientsTab.js
// ==========================================
/**
 * Aba Principal: Clientes & Fiados
 * Identidade visual comercial brasileira: limpa, ágil, acolhedora e com estados vazios humanizados.
 */

window.ClientsTab = function ClientsTab({
  clients,
  onSelectClient,
  onOpenNewRecord,
  onOpenWhatsApp,
  isVip
}) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('todos'); // 'todos' | 'atrasado' | 'em_dia' | 'quitado'
  const [sortBy, setSortBy] = React.useState('debt_desc');

  const {
    Search, PlusCircle, MessageCircle, AlertTriangle, CheckCircle2,
    Clock, DollarSign, Users, ChevronRight, Sparkles, X
  } = window.Icons || {};

  // Métricas financeiras no topo
  const totalReceivables = clients.reduce((acc, c) => acc + (window.AppState ? window.AppState.computeBalance(c) : 0), 0);
  const overdueClientsCount = clients.filter(c => window.AppState && window.AppState.getClientStatus(c) === 'atrasado').length;
  const inDebtClientsCount = clients.filter(c => window.AppState && window.AppState.computeBalance(c) > 0.01).length;

  // Filtragem
  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.phone && client.phone.includes(searchTerm.replace(/\D/g, '')));

    if (!matchesSearch) return false;

    const status = window.AppState ? window.AppState.getClientStatus(client) : 'em_dia';
    if (statusFilter === 'todos') return true;
    return status === statusFilter;
  });

  // Ordenação
  const sortedClients = [...filteredClients].sort((a, b) => {
    const debtA = window.AppState ? window.AppState.computeBalance(a) : 0;
    const debtB = window.AppState ? window.AppState.computeBalance(b) : 0;

    if (sortBy === 'debt_desc') return debtB - debtA;
    if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
    if (sortBy === 'recent') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    return 0;
  });

  return (
    <div className="space-y-4 pb-24 animate-fadeIn">
      
      {/* 3 Cards de Resumo Financeiro no Topo */}
      <div className="grid grid-cols-3 gap-2">
        
        {/* Total a Receber */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            A Receber
          </span>
          <span className="text-base font-black text-emerald-400 font-mono block mt-0.5 truncate">
            R$ {totalReceivables.toFixed(2).replace('.', ',')}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            {inDebtClientsCount} {inDebtClientsCount === 1 ? 'com saldo' : 'com saldo'}
          </span>
        </div>

        {/* Em Atraso */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-rose-900/30 shadow-sm">
          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block flex items-center gap-1">
            <AlertTriangle size={11} /> Atrasados
          </span>
          <span className="text-base font-black text-rose-400 font-mono block mt-0.5 truncate">
            {overdueClientsCount}
          </span>
          <span className="text-[10px] text-rose-300/70 mt-0.5 block">
            {overdueClientsCount === 1 ? 'Cobrança urgente' : 'Cobranças urgentes'}
          </span>
        </div>

        {/* Total Cadastrado */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
            <Users size={11} /> Clientes
          </span>
          <span className="text-base font-black text-slate-200 font-mono block mt-0.5 truncate">
            {clients.length}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Cadastrados
          </span>
        </div>

      </div>

      {/* Barra de Pesquisa e Filtros */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou WhatsApp..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtros em Pílula */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setStatusFilter('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === 'todos'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            Todos ({clients.length})
          </button>

          <button
            onClick={() => setStatusFilter('atrasado')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
              statusFilter === 'atrasado'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            <AlertTriangle size={12} /> Atrasados ({overdueClientsCount})
          </button>

          <button
            onClick={() => setStatusFilter('em_dia')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
              statusFilter === 'em_dia'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            Em Aberto
          </button>

          <button
            onClick={() => setStatusFilter('quitado')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
              statusFilter === 'quitado'
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            <CheckCircle2 size={12} /> Quitados
          </button>
        </div>
      </div>

      {/* Lista de Clientes ou Estados Vazios Humanizados */}
      <div className="space-y-2.5">
        {sortedClients.length === 0 ? (
          /* Estado Vazio com Ilustração e Acolhimento */
          <div className="text-center py-10 px-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            
            {clients.length === 0 ? (
              /* Caso 1: App recém-instalado ou sem nenhum cliente */
              <>
                <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-3xl shadow-sm">
                  📖
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">
                    Seu Caderno de Fiado está pronto!
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Cadastre os clientes que compram fiado e controle cobranças no WhatsApp com total clareza e tranquilidade.
                  </p>
                </div>
                <button
                  onClick={onOpenNewRecord}
                  className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center space-x-2 transition-all active:scale-95 shadow-md"
                >
                  <PlusCircle size={16} />
                  <span>Cadastrar Primeiro Cliente</span>
                </button>
              </>
            ) : searchTerm ? (
              /* Caso 2: Busca sem resultados */
              <>
                <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center text-2xl">
                  🔍
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">
                    Nenhum cliente encontrado
                  </h3>
                  <p className="text-xs text-slate-400">
                    Não encontramos resultados para "{searchTerm}".
                  </p>
                </div>
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                >
                  Limpar busca
                </button>
              </>
            ) : (
              /* Caso 3: Filtro de status vazio */
              <>
                <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center text-2xl">
                  📋
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">
                    Nenhum cliente nesta categoria
                  </h3>
                  <p className="text-xs text-slate-400">
                    Não há registros correspondentes ao filtro selecionado.
                  </p>
                </div>
                <button
                  onClick={() => setStatusFilter('todos')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                >
                  Ver todos os clientes
                </button>
              </>
            )}

          </div>
        ) : (
          /* Listagem de Clientes */
          sortedClients.map(client => {
            const debt = window.AppState ? window.AppState.computeBalance(client) : 0;
            const status = window.AppState ? window.AppState.getClientStatus(client) : 'em_dia';
            const formattedDebt = `R$ ${debt.toFixed(2).replace('.', ',')}`;

            const initials = client.name
              .split(' ')
              .map(n => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            const openSales = (client.transactions || []).filter(t => t.type === 'sale');
            const nearestDue = openSales.length > 0 && openSales[0].dueDate 
              ? openSales[0].dueDate.split('-').reverse().join('/') 
              : null;

            return (
              <div
                key={client.id}
                onClick={() => onSelectClient(client.id)}
                className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer shadow-sm group active:scale-[0.99]"
              >
                <div className="flex items-center justify-between gap-3">
                  
                  {/* Avatar com Iniciais e Informações */}
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                      status === 'atrasado'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : status === 'quitado'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-200 border border-slate-700'
                    }`}>
                      {initials}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-emerald-400 transition-colors">
                          {client.name}
                        </h4>
                        {status === 'quitado' && (
                          <span className="text-[10px] text-emerald-400">⭐</span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {client.phone ? client.phone : (client.address || 'Sem telefone')}
                      </p>
                    </div>
                  </div>

                  {/* Saldo Devedor e Status */}
                  <div className="text-right flex-shrink-0">
                    <span className={`font-mono font-bold text-sm block ${
                      debt > 0 
                        ? (status === 'atrasado' ? 'text-rose-400' : 'text-amber-400') 
                        : 'text-emerald-400'
                    }`}>
                      {debt > 0 ? formattedDebt : 'Quitado'}
                    </span>

                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      {status === 'atrasado' 
                        ? (nearestDue ? `Venceu ${nearestDue}` : 'Atrasado') 
                        : status === 'em_dia' 
                        ? (nearestDue ? `Vence ${nearestDue}` : 'Em dia') 
                        : 'Sem pendências'}
                    </span>
                  </div>

                  <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 flex-shrink-0 ml-1 transition-colors" />

                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};


// ==========================================
// Arquivo: js\components\NewRecordTab.js
// ==========================================
/**
 * Aba de Novo Registro: Venda no Fiado ou Cadastro de Novo Cliente
 * Suporte a anexo de foto/comprovante, tags rápidas e prazos pré-configurados.
 */

window.NewRecordTab = function NewRecordTab({
  clients,
  onRecordCreated,
  onClientCreated
}) {
  const [recordType, setRecordType] = React.useState(() => {
    return (!clients || clients.length === 0) ? 'client' : 'sale';
  });

  // Estado do formulário de venda fiada
  const [selectedClientId, setSelectedClientId] = React.useState('');
  const [saleAmount, setSaleAmount] = React.useState('');
  const [saleDesc, setSaleDesc] = React.useState('');
  const [dueDate, setDueDate] = React.useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [photoPreview, setPhotoPreview] = React.useState(null);

  // Estado do formulário de novo cliente
  const [clientName, setClientName] = React.useState('');
  const [clientPhone, setClientPhone] = React.useState('');
  const [clientAddress, setClientAddress] = React.useState('');
  const [clientLimit, setClientLimit] = React.useState('350');

  // Diálogo amigável de feedback (sem alert nativo)
  const [feedbackDialog, setFeedbackDialog] = React.useState({ isOpen: false, title: '', message: '', variant: 'warning' });

  const {
    PlusCircle, UserPlus, DollarSign, Calendar, Camera, X, Check,
    Sparkles, AlertTriangle, Users
  } = window.Icons || {};

  // Tags rápidas de produtos/serviços comuns no comércio popular brasileiro
  const quickTags = [
    'Manicure / Unhas',
    'Corte & Cabelo',
    'Roupas / Calçados',
    'Cosméticos / Perfume',
    'Oficina / Peças',
    'Mercadoria / Alimentos'
  ];

  // Atalhos de prazo de vencimento
  const handleQuickDue = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDueDate(d.toISOString().split('T')[0]);
  };

  // Upload de Foto / Comprovante
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Submissão de Venda no Fiado
  const handleSaleSubmit = (e) => {
    e.preventDefault();
    if (!selectedClientId) {
      setFeedbackDialog({
        isOpen: true,
        title: 'Selecione o Cliente',
        message: 'Por favor, selecione para qual cliente esta venda fiada será anotada.',
        variant: 'warning'
      });
      return;
    }
    const val = parseFloat(saleAmount);
    if (isNaN(val) || val <= 0) {
      setFeedbackDialog({
        isOpen: true,
        title: 'Valor Inválido',
        message: 'Por favor, informe um valor numérico válido para a venda.',
        variant: 'warning'
      });
      return;
    }

    try {
      window.AppState.addSale(selectedClientId, {
        amount: val,
        description: saleDesc || 'Venda no fiado',
        dueDate: dueDate,
        photoUrl: photoPreview
      });

      setSaleAmount('');
      setSaleDesc('');
      setPhotoPreview(null);

      onRecordCreated(selectedClientId);
    } catch(err) {
      setFeedbackDialog({
        isOpen: true,
        title: 'Erro ao Registrar',
        message: 'Não foi possível salvar a venda: ' + err.message,
        variant: 'danger'
      });
    }
  };

  // Submissão de Cadastro de Cliente
  const handleClientSubmit = (e) => {
    e.preventDefault();
    if (!clientName.trim()) {
      setFeedbackDialog({
        isOpen: true,
        title: 'Nome Obrigatório',
        message: 'Por favor, informe o nome ou apelido do cliente.',
        variant: 'warning'
      });
      return;
    }

    const newClient = window.AppState.addClient({
      name: clientName,
      phone: clientPhone,
      address: clientAddress,
      creditLimit: clientLimit
    });

    setClientName('');
    setClientPhone('');
    setClientAddress('');
    setClientLimit('350');

    onClientCreated(newClient.id);
  };

  return (
    <div className="space-y-4 pb-28 animate-fadeIn">
      
      {/* Alternador de Tipo de Registro: Fiado OU Novo Cliente */}
      <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-bold">
        <button
          type="button"
          onClick={() => setRecordType('sale')}
          className={`py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
            recordType === 'sale'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <DollarSign size={15} />
          <span>Anotar Fiado</span>
        </button>

        <button
          type="button"
          onClick={() => setRecordType('client')}
          className={`py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
            recordType === 'client'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <UserPlus size={15} />
          <span>Novo Cliente</span>
        </button>
      </div>

      {recordType === 'sale' ? (
        /* FORMULÁRIO DE ANOTAR VENDA FIADA */
        <form onSubmit={handleSaleSubmit} className="space-y-4">
          
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3.5 shadow-sm">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <DollarSign size={16} className="text-emerald-400" />
              Dados da Venda no Fiado
            </h3>

            {/* Seletor de Cliente */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">Cliente:</label>
                <button
                  type="button"
                  onClick={() => setRecordType('client')}
                  className="text-[11px] text-emerald-400 hover:underline"
                >
                  + Cadastrar novo
                </button>
              </div>

              {(!clients || clients.length === 0) ? (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300">
                  Nenhum cliente cadastrado ainda. 
                  <button
                    type="button"
                    onClick={() => setRecordType('client')}
                    className="underline font-bold ml-1"
                  >
                    Clique aqui para cadastrar o primeiro!
                  </button>
                </div>
              ) : (
                <select
                  value={selectedClientId}
                  onChange={e => setSelectedClientId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Selecione o cliente...</option>
                  {clients.map(c => {
                    const debt = window.AppState.computeBalance(c);
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} {debt > 0 ? `(Deve R$ ${debt.toFixed(2)})` : '(Quitado)'}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            {/* Valor da Venda */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Valor Total (R$):
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-base font-bold text-slate-400">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={saleAmount}
                  onChange={e => setSaleAmount(e.target.value)}
                  placeholder="0,00"
                  required
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-base font-bold text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* Descrição do Fiado */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Descrição do Produto ou Serviço:
              </label>
              <input
                type="text"
                value={saleDesc}
                onChange={e => setSaleDesc(e.target.value)}
                placeholder="Ex: Manicure + Pedicure / 2 Calças Jeans"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
              />

              {/* Tags rápidas */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {quickTags.map((tag, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSaleDesc(tag)}
                    className="text-[10px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Data de Vencimento */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Data do Vencimento Acordada:
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
              />

              {/* Atalhos de prazo */}
              <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickDue(7)}
                  className="py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-[10px] text-slate-300 border border-slate-700"
                >
                  +7 Dias
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDue(15)}
                  className="py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-[10px] text-slate-300 border border-slate-700"
                >
                  +15 Dias
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDue(30)}
                  className="py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-[10px] text-slate-300 border border-slate-700"
                >
                  +30 Dias
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    setDueDate(today);
                  }}
                  className="py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-[10px] text-slate-300 border border-slate-700"
                >
                  Hoje
                </button>
              </div>
            </div>
          </div>

          {/* Anexo de Foto / Cupom / Assinatura */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
            <span className="text-xs font-bold text-slate-300 block">
              Foto do Comprovante / Cupom (Opcional):
            </span>

            {photoPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-700 max-h-40">
                <img src={photoPreview} alt="Comprovante" className="w-full h-40 object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoPreview(null)}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/80 text-white hover:bg-black"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 hover:bg-slate-950 cursor-pointer text-slate-400 hover:text-slate-200 transition-colors">
                <Camera size={22} className="mb-1 text-slate-500" />
                <span className="text-xs font-semibold">Tirar Foto ou Anexar Imagem</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Botão Salvar Fiado */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center space-x-2 transition-all active:scale-[0.99] shadow-md"
          >
            <Check size={18} />
            <span>Salvar Fiado no Caderno</span>
          </button>

        </form>
      ) : (
        /* FORMULÁRIO DE CADASTRAR NOVO CLIENTE */
        <form onSubmit={handleClientSubmit} className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3.5 shadow-sm">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserPlus size={16} className="text-emerald-400" />
              Cadastrar Novo Cliente no Caderno
            </h3>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Nome Completo ou Apelido Conhecido:
              </label>
              <input
                type="text"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="Ex: Dona Neide / Seu Jorge"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                WhatsApp com DDD:
              </label>
              <input
                type="tel"
                value={clientPhone}
                onChange={e => setClientPhone(e.target.value)}
                placeholder="Ex: 11987654321 (apenas números)"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Fundamental para a cobrança automática e envio do PIX com 1 clique.
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Endereço ou Ponto de Referência (Opcional):
              </label>
              <input
                type="text"
                value={clientAddress}
                onChange={e => setClientAddress(e.target.value)}
                placeholder="Ex: Rua das Flores, 120 / Bloco B Apto 10"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Limite de Crédito Fiado (R$):
              </label>
              <input
                type="number"
                step="50"
                value={clientLimit}
                onChange={e => setClientLimit(e.target.value)}
                placeholder="350,00"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                O app avisará quando a dívida acumulada ultrapassar esse limite.
              </span>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all active:scale-[0.99] shadow-md"
            >
              <Check size={16} />
              <span>Concluir Cadastro de Cliente</span>
            </button>
          </div>
        </form>
      )}

      {/* Modal de Feedback Amigável */}
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
  );
};


// ==========================================
// Arquivo: js\components\ReportsTab.js
// ==========================================
/**
 * Aba de Relatórios de Caixa & Saúde Financeira
 * Indicadores claros, projeção de recebimentos e ranking de clientes pontuais.
 */

window.ReportsTab = function ReportsTab({ clients, isVip, onTriggerPaywall, onSelectClient }) {
  const {
    BarChart3, DollarSign, AlertTriangle, CheckCircle2, Clock,
    Crown, Sparkles, TrendingUp, Users, ChevronRight, ShieldCheck
  } = window.Icons || {};

  // Métricas gerais
  let totalReceivables = 0;
  let totalOverdue = 0;
  let totalOnTime = 0;
  let totalPaidEver = 0;
  let totalSalesEver = 0;
  let totalSalesCount = 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const next7DaysStr = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  const next30DaysStr = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  let forecast7Days = 0;
  let forecast30Days = 0;
  const upcomingClients = [];

  clients.forEach(c => {
    const debt = window.AppState ? window.AppState.computeBalance(c) : 0;
    totalReceivables += debt;

    const sales = (c.transactions || []).filter(t => t.type === 'sale');
    const payments = (c.transactions || []).filter(t => t.type === 'payment');

    totalSalesCount += sales.length;
    sales.forEach(s => {
      totalSalesEver += (parseFloat(s.amount) || 0);
      if (debt > 0 && s.dueDate) {
        if (s.dueDate < todayStr) {
          // Em atraso
        } else if (s.dueDate <= next7DaysStr) {
          forecast7Days += Math.min(debt, parseFloat(s.amount) || 0);
          upcomingClients.push({ client: c, amount: parseFloat(s.amount) || 0, dueDate: s.dueDate });
        } else if (s.dueDate <= next30DaysStr) {
          forecast30Days += Math.min(debt, parseFloat(s.amount) || 0);
        }
      }
    });

    payments.forEach(p => {
      totalPaidEver += (parseFloat(p.amount) || 0);
    });

    const status = window.AppState ? window.AppState.getClientStatus(c) : 'em_dia';
    if (status === 'atrasado') {
      totalOverdue += debt;
    } else if (status === 'em_dia') {
      totalOnTime += debt;
    }
  });

  // Inadimplência
  const defaultRate = totalReceivables > 0 
    ? Math.round((totalOverdue / totalReceivables) * 100) 
    : 0;

  // Ticket Médio
  const avgTicket = totalSalesCount > 0 ? (totalSalesEver / totalSalesCount) : 0;

  // Ranking de Bons Pagadores
  const bestPayers = [...clients]
    .map(c => {
      const paid = (c.transactions || [])
        .filter(t => t.type === 'payment')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      const status = window.AppState ? window.AppState.getClientStatus(c) : 'em_dia';
      return { client: c, totalPaid: paid, status };
    })
    .filter(item => item.totalPaid > 0)
    .sort((a, b) => b.totalPaid - a.totalPaid)
    .slice(0, 5);

  return (
    <div className="space-y-4 pb-24 animate-fadeIn">
      
      {/* Top Banner de Resumo de Caixa */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <BarChart3 size={18} />
            </div>
            <h3 className="font-bold text-sm text-white">Relatório de Caixa & Fiados</h3>
          </div>

          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            Atualizado Hoje
          </span>
        </div>

        {/* Grade 2x2 de Indicadores */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/90">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total a Receber
            </span>
            <span className="text-base font-black text-emerald-400 font-mono block mt-0.5">
              R$ {totalReceivables.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[9px] text-slate-500">Capital na rua</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/90">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Já Recebido
            </span>
            <span className="text-base font-black text-emerald-400 font-mono block mt-0.5">
              R$ {totalPaidEver.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[9px] text-slate-500">Recuperado com sucesso</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/90">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
              Inadimplência
            </span>
            <span className="text-base font-black text-rose-400 font-mono block mt-0.5">
              {defaultRate}%
            </span>
            <span className="text-[9px] text-rose-300/80">
              R$ {totalOverdue.toFixed(2).replace('.', ',')} vencidos
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/90">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Ticket Médio Fiado
            </span>
            <span className="text-base font-black text-slate-200 font-mono block mt-0.5">
              R$ {avgTicket.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[9px] text-slate-500">Por venda anotada</span>
          </div>
        </div>
      </div>

      {/* Gráfico Visual de Distribuição da Inadimplência */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
            <TrendingUp size={14} className="text-emerald-400" />
            Distribuição dos Valores a Receber
          </h4>
          <span className="text-[10px] text-slate-400">Total: 100%</span>
        </div>

        {/* Barra Proporcional */}
        <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800 p-0.5">
          {totalReceivables > 0 ? (
            <>
              <div
                title={`Em Dia: R$ ${totalOnTime.toFixed(2)}`}
                className="bg-emerald-500 h-full rounded-l-full transition-all duration-500"
                style={{ width: `${(totalOnTime / totalReceivables) * 100}%` }}
              />
              <div
                title={`Em Atraso: R$ ${totalOverdue.toFixed(2)}`}
                className="bg-rose-500 h-full rounded-r-full transition-all duration-500"
                style={{ width: `${(totalOverdue / totalReceivables) * 100}%` }}
              />
            </>
          ) : (
            <div className="bg-emerald-500 w-full h-full rounded-full" />
          )}
        </div>

        {/* Legenda Explicativa */}
        <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
          <div className="flex items-center space-x-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 block truncate">No Prazo / Em Dia</span>
              <span className="font-bold text-white font-mono text-xs">
                R$ {totalOnTime.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="w-3 h-3 rounded-full bg-rose-500 flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-rose-300 block truncate">Atrasados</span>
              <span className="font-bold text-rose-400 font-mono text-xs">
                R$ {totalOverdue.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Previsão de Entradas Acordadas */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Clock size={14} className="text-amber-400" />
            Previsão de Entradas (Vencimentos Acordados)
          </h4>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-[10px] font-bold text-amber-300 uppercase block">
              Próximos 7 Dias
            </span>
            <span className="text-sm font-extrabold text-amber-400 font-mono block mt-1">
              R$ {forecast7Days.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[9px] text-slate-400 mt-0.5 block">Entradas previstas</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              Próximos 30 Dias
            </span>
            <span className="text-sm font-extrabold text-slate-200 font-mono block mt-1">
              R$ {(forecast7Days + forecast30Days).toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[9px] text-slate-400 mt-0.5 block">Total previsto no mês</span>
          </div>
        </div>
      </div>

      {/* Ranking dos Melhores Pagadores */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>⭐</span>
            Ranking: Clientes Mais Pontuais
          </h4>
          <span className="text-[10px] text-slate-400">Honraram compromissos</span>
        </div>

        {bestPayers.length === 0 ? (
          <div className="text-center py-6 px-4 rounded-xl bg-slate-950/40 border border-slate-800/80">
            <span className="text-2xl block mb-1">🤝</span>
            <p className="text-xs font-semibold text-slate-300">Nenhum pagamento registrado ainda</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Conforme os clientes forem abatendo suas dívidas, o ranking de pontualidade aparecerá aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {bestPayers.map((item, idx) => {
              const medals = ['🥇', '🥈', '🥉', '4º', '5º'];
              return (
                <div
                  key={item.client.id}
                  onClick={() => onSelectClient(item.client.id)}
                  className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span className="text-base flex-shrink-0">{medals[idx]}</span>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-white block truncate">
                        {item.client.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {item.status === 'quitado' ? 'Tudo pago no dia' : 'Pagamentos em dia'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-bold text-emerald-400 font-mono block">
                      R$ {item.totalPaid.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-[9px] text-slate-500">total honrado</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};


// ==========================================
// Arquivo: js\components\VipTab.js
// ==========================================
/**
 * Aba e Tela de Paywall: Plano VIP Pro
 * Sistema seguro de Licenciamento Criptográfico por ID de Aparelho e Contagem Regressiva.
 */

window.VipTab = function VipTab({
  vipInfo,
  onWatchRewarded,
  triggerReason,
  shopSettings
}) {
  const [selectedPlan, setSelectedPlan] = React.useState('monthly'); // 'monthly' | 'annual' | 'lifetime'
  const [licenseCode, setLicenseCode] = React.useState('');
  const [activationMessage, setActivationMessage] = React.useState(null);
  const [activating, setActivating] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState(false);

  const {
    Crown, Sparkles, Check, QrCode, FileText, ShieldCheck,
    Play, Clock, Star, Users, CheckCircle2, DollarSign, Copy, MessageCircle, AlertTriangle
  } = window.Icons || {};

  const installationId = vipInfo.installationId || (window.AppState ? window.AppState.getInstallationId() : '');

  // Copia o ID do aparelho
  const handleCopyId = () => {
    navigator.clipboard.writeText(installationId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Dispara pedido de assinatura no WhatsApp do Dono
  const handleOrderViaWhatsApp = (planKey = selectedPlan) => {
    const plansInfo = {
      monthly: { name: 'Plano VIP Mensal', price: 'R$ 9,90/mês' },
      annual: { name: 'Plano VIP Anual', price: 'R$ 59,90/ano' },
      lifetime: { name: 'Plano VIP Vitalício', price: 'R$ 97,00 (Acesso Único)' }
    };
    const current = plansInfo[planKey] || plansInfo.monthly;

    const message = `Olá! Quero assinar o *${current.name} (${current.price})* do CadernoFiado.\n\n📲 *ID do meu aparelho:* \`${installationId}\`\n\nPode me enviar a chave PIX para eu fazer o pagamento e liberar meu código de ativação? Obrigado!`;

    const ownerPhone = (shopSettings?.supportPhone || '51985661499').replace(/\D/g, '');
    const cleanPhone = ownerPhone.startsWith('55') ? ownerPhone : '55' + ownerPhone;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Ativação assíncrona do código digitado via Web Crypto ECDSA
  const handleActivateCode = async (e) => {
    e.preventDefault();
    if (!licenseCode.trim()) {
      setActivationMessage({ success: false, text: 'Digite o código de ativação recebido no WhatsApp.' });
      return;
    }

    setActivating(true);
    setActivationMessage(null);

    const result = await window.AppState.activateLicenseKey(licenseCode);
    setActivating(false);

    if (result.success) {
      setActivationMessage({ success: true, text: result.message });
      setLicenseCode('');
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.5 }
        });
      }
    } else {
      setActivationMessage({ success: false, text: result.message });
    }
  };

  return (
    <div className="space-y-4 pb-28 animate-fadeIn">
      
      {/* Alerta de Recurso Bloqueado */}
      {triggerReason && !vipInfo.isVip && (
        <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-300 flex items-start space-x-2.5">
          <Crown size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">
              {triggerReason === 'pix' ? 'Cobrança PIX Automática' : 'Emissão de Recibo em PDF Timbrado'} é um recurso VIP!
            </span>
            <span className="text-[11px] text-slate-300">
              Assine um plano a partir de R$ 9,90/mês ou assista a um vídeo rápido para desbloquear por 24h.
            </span>
          </div>
        </div>
      )}

      {/* --- SE O CLIENTE JÁ TEM O VIP ATIVO --- */}
      {vipInfo.isVip ? (
        <div className="relative p-5 rounded-2xl bg-slate-900 border border-amber-500/40 shadow-xl text-center space-y-4 overflow-hidden">
          
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Crown size={28} strokeWidth={2.5} />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1.5">
              <CheckCircle2 size={13} /> Assinatura Ativa
            </span>
            <h2 className="text-xl font-bold text-white mt-2">
              {vipInfo.planName || 'VIP PRO Ativo'}
            </h2>
            
            {vipInfo.isLifetime ? (
              <p className="text-xs text-amber-300 mt-1 font-semibold">
                ✨ Licença Vitalícia Permanente (Acesso Ilimitado)
              </p>
            ) : vipInfo.daysRemaining !== null ? (
              <div className="mt-2 space-y-1">
                <p className="text-sm font-bold text-emerald-400">
                  ⏳ Vence em {vipInfo.daysRemaining} dias ({vipInfo.expiresAtDateStr})
                </p>
                <p className="text-[11px] text-slate-400">
                  Todas as funções de PIX e PDF estão 100% liberadas.
                </p>
              </div>
            ) : (
              <p className="text-xs text-emerald-400 mt-1">
                Passe temporário de 24 horas ativo.
              </p>
            )}
          </div>

          {/* Dados do Aparelho */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">ID deste Aparelho:</span>
            <span className="font-mono font-bold text-white">{installationId}</span>
          </div>

          {/* Renovação se estiver próximo do vencimento */}
          {!vipInfo.isLifetime && vipInfo.daysRemaining !== null && vipInfo.daysRemaining <= 5 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 space-y-2">
              <p className="font-semibold">⚠️ Seu plano vence em breve!</p>
              <button
                onClick={() => handleOrderViaWhatsApp('monthly')}
                className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs"
              >
                <MessageCircle size={15} />
                <span>Renovar Plano no WhatsApp Agora</span>
              </button>
            </div>
          )}

        </div>
      ) : (
        /* --- SE O CLIENTE AINDA NÃO É VIP (OU PLANO EXPIROU) --- */
        <div className="space-y-4">
          
          {/* Card Principal de Apresentação */}
          <div className="relative p-5 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-lg text-center space-y-3 overflow-hidden">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Crown size={26} strokeWidth={2.5} />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30 inline-flex items-center gap-1">
                <Sparkles size={12} /> Recursos Profissionais
              </span>
              <h2 className="text-xl font-bold text-white mt-2 leading-tight">
                CadernoFiado <span className="text-amber-400 font-extrabold">VIP PRO</span>
              </h2>
              <p className="text-xs text-slate-300 mt-1.5 max-w-xs mx-auto leading-relaxed">
                Cobrança com QR Code PIX automático no WhatsApp e recibos em PDF timbrados para seus clientes.
              </p>
            </div>

            {/* Caixa do ID do Celular */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <div className="text-left">
                <span className="text-[10px] text-slate-400 block">Seu ID de Aparelho:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{installationId}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyId}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-[11px] font-medium flex items-center gap-1 border border-slate-700"
              >
                {copiedId ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copiedId ? 'Copiado' : 'Copiar ID'}</span>
              </button>
            </div>
          </div>

          {/* Seleção de Planos de Preço */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-300 px-1">
              Escolha seu plano de acesso:
            </p>

            <div className="grid grid-cols-3 gap-2">
              
              {/* Mensal */}
              <div
                onClick={() => setSelectedPlan('monthly')}
                className={`p-3 rounded-2xl border cursor-pointer transition-all text-center relative ${
                  selectedPlan === 'monthly'
                    ? 'bg-emerald-950/30 border-emerald-500'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Mensal</span>
                <span className="text-base font-extrabold text-white block mt-0.5">R$ 9,90</span>
                <span className="text-[10px] text-slate-400">30 dias</span>
              </div>

              {/* Anual (Destaque) */}
              <div
                onClick={() => setSelectedPlan('annual')}
                className={`p-3 rounded-2xl border cursor-pointer transition-all text-center relative ${
                  selectedPlan === 'annual'
                    ? 'bg-amber-950/30 border-amber-500'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] uppercase shadow-sm">
                  Mais Popular
                </span>
                <span className="text-[10px] font-bold text-amber-400 uppercase block mt-0.5">Anual</span>
                <span className="text-base font-extrabold text-amber-300 block mt-0.5">R$ 59,90</span>
                <span className="text-[10px] text-emerald-400 font-semibold">R$ 4,99/mês</span>
              </div>

              {/* Vitalício */}
              <div
                onClick={() => setSelectedPlan('lifetime')}
                className={`p-3 rounded-2xl border cursor-pointer transition-all text-center relative ${
                  selectedPlan === 'lifetime'
                    ? 'bg-amber-950/30 border-amber-500'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Vitalício</span>
                <span className="text-base font-extrabold text-white block mt-0.5">R$ 97,00</span>
                <span className="text-[10px] text-slate-400">Paga 1x só</span>
              </div>

            </div>
          </div>

          {/* Botão de Pagamento pelo WhatsApp */}
          <button
            onClick={() => handleOrderViaWhatsApp()}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center space-x-2 transition-all active:scale-[0.99] shadow-md"
          >
            <MessageCircle size={18} />
            <span>Pagar via PIX e Liberar Código</span>
          </button>

          {/* Formulário de Ativação de Código do Cliente */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-md">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <Check size={16} />
              </div>
              <h4 className="font-bold text-xs text-white">Já recebeu seu código? Ative aqui:</h4>
            </div>

            <form onSubmit={handleActivateCode} className="space-y-2.5">
              <input
                type="text"
                value={licenseCode}
                onChange={(e) => setLicenseCode(e.target.value.trim())}
                placeholder="Cole o código fornecido (ex: CFVIP...)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />

              {activationMessage && (
                <div className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 ${
                  activationMessage.success 
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                }`}>
                  {activationMessage.success ? <Check size={15} /> : <AlertTriangle size={15} />}
                  <span>{activationMessage.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={activating}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs border border-slate-700 transition-all"
              >
                {activating ? 'Validando chave...' : 'Validar e Ativar Acesso'}
              </button>
            </form>
          </div>

          {/* Opção Gratuita: Vídeo Premiado 24h */}
          {onWatchRewarded && (
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
              <span className="text-[11px] text-slate-400 block">
                Quer testar antes? Libere 24h grátis assistindo a um vídeo rápido:
              </span>
              <button
                onClick={onWatchRewarded}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 mx-auto border border-slate-700 transition-colors"
              >
                <Play size={14} className="text-emerald-400" />
                <span>Assistir Vídeo (Liberar 24h)</span>
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
};


// ==========================================
// Arquivo: js\components\InstallPwaModal.js
// ==========================================
/**
 * Modal & Instruções de Instalação do Aplicativo (PWA)
 * Suporte completo para Android (instalação nativa direta) e iOS (Safari Tela de Início)
 */

window.InstallPwaModal = function InstallPwaModal({ isOpen, onClose }) {
  const [installPrompt, setInstallPrompt] = React.useState(() => window.__deferredInstallPrompt);
  const [installed, setInstalled] = React.useState(false);

  const { X, Download, Smartphone, Check, Sparkles, Share, PlusSquare } = window.Icons;

  React.useEffect(() => {
    const handlePrompt = () => {
      setInstallPrompt(window.__deferredInstallPrompt);
    };
    window.__onPwaInstallAvailable = handlePrompt;
    return () => {
      window.__onPwaInstallAvailable = null;
    };
  }, []);

  if (!isOpen) return null;

  // Detecta se é dispositivo iOS (iPhone / iPad)
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  const handleInstallClick = async () => {
    if (window.__deferredInstallPrompt) {
      window.__deferredInstallPrompt.prompt();
      const { outcome } = await window.__deferredInstallPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
        window.__deferredInstallPrompt = null;
        setInstallPrompt(null);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 overflow-hidden">
        
        {/* Detalhe de iluminação de fundo */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-brand-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Botão de Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        {/* Cabeçalho do Modal */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 p-0.5 shadow-glow-emerald flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <span className="text-2xl">📲</span>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Instalar CadernoFiado
            </h2>
            <p className="text-xs text-slate-400">
              Tenha o app direto na sua tela inicial
            </p>
          </div>
        </div>

        {/* Benefícios da instalação */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 mb-5 space-y-2.5">
          <div className="flex items-center space-x-2.5 text-xs text-slate-300">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">✓</span>
            <span><strong>100% Offline:</strong> Funciona mesmo sem sinal de internet.</span>
          </div>
          <div className="flex items-center space-x-2.5 text-xs text-slate-300">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">✓</span>
            <span><strong>Acesso Instantâneo:</strong> Abra direto pelo ícone sem digitar link.</span>
          </div>
          <div className="flex items-center space-x-2.5 text-xs text-slate-300">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">✓</span>
            <span><strong>Sem Ocupar Memória:</strong> Super leve e não trava o seu celular.</span>
          </div>
        </div>

        {/* Bloco de Ação / Instruções conforme dispositivo */}
        {installed ? (
          <div className="text-center py-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-emerald-300 font-semibold text-sm flex items-center justify-center gap-2">
            <Check size={18} />
            Aplicativo instalado com sucesso!
          </div>
        ) : isIos ? (
          /* Instruções para iPhone / Safari */
          <div className="space-y-3 bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 text-xs text-slate-300">
            <p className="font-semibold text-amber-300 flex items-center gap-1.5 text-sm">
              <span>🍎</span> No iPhone ou iPad (Safari):
            </p>
            <ol className="space-y-2 list-decimal list-inside pl-1 text-slate-300">
              <li>Toque no botão <strong>Compartilhar</strong> (ícone com quadrado e seta para cima).</li>
              <li>Role as opções e toque em <strong>"Adicionar à Tela de Início"</strong>.</li>
              <li>Toque em <strong>"Adicionar"</strong> no canto superior direito.</li>
            </ol>
          </div>
        ) : installPrompt ? (
          /* Botão Direto para Android / Chrome / Edge */
          <button
            onClick={handleInstallClick}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-brand-500 to-emerald-600 hover:from-brand-600 hover:to-emerald-700 text-slate-950 font-bold rounded-2xl shadow-glow-emerald flex items-center justify-center space-x-2 transition-all transform active:scale-95 text-sm"
          >
            <Download size={18} />
            <span>Instalar Aplicativo Agora</span>
          </button>
        ) : (
          /* Instruções Genéricas / Menu do Navegador */
          <div className="space-y-3 bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 text-xs text-slate-300">
            <p className="font-semibold text-white flex items-center gap-1.5 text-sm">
              <span>🤖</span> Como adicionar à sua tela inicial:
            </p>
            <ol className="space-y-2 list-decimal list-inside pl-1 text-slate-300">
              <li>Toque nos <strong>três pontinhos (⋮)</strong> no canto superior do navegador.</li>
              <li>Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</li>
              <li>Confirme para criar o atalho com o ícone do CadernoFiado.</li>
            </ol>
          </div>
        )}

        <div className="mt-4 text-center">
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors font-medium"
          >
            Continuar no navegador
          </button>
        </div>

      </div>
    </div>
  );
};


// ==========================================
// Arquivo: js\app.js
// ==========================================
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
  const [isDark, setIsDark] = React.useState(true);

  // Modais
  const [selectedClientId, setSelectedClientId] = React.useState(null);
  const [whatsAppModalData, setWhatsAppModalData] = React.useState({ open: false, client: null, pixPayload: null });
  const [pixModalData, setPixModalData] = React.useState({ open: false, client: null });
  const [settingsModalOpen, setSettingsModalOpen] = React.useState(false);
  const [rewardedModalOpen, setRewardedModalOpen] = React.useState(false);
  const [installModalOpen, setInstallModalOpen] = React.useState(false);
  const [paywallReason, setPaywallReason] = React.useState(null);

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

  // Alternador de tema Escuro / Claro
  const handleToggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
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
    setActiveTab('vip');
  };

  // Contagem de clientes em atraso para a badge do menu
  const overdueCount = clients.filter(c => window.AppState.getClientStatus(c) === 'atrasado').length;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800'}`}>
      
      {/* Container Principal Mobile-First com Estilo de App Nativo */}
      <div className="app-container bg-slate-950 relative min-h-screen flex flex-col transition-colors duration-200 shadow-2xl">
        
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
          onOpenWhatsApp={(client, payload) => setWhatsAppModalData({ open: true, client, pixPayload: payload })}
          onOpenPix={(client) => setPixModalData({ open: true, client })}
          isVip={vipInfo.isVip}
          onTriggerPaywall={handleTriggerPaywall}
          shopSettings={shopSettings}
        />

        {/* Modal de Cobrança no WhatsApp */}
        <window.WhatsAppModal
          isOpen={whatsAppModalData.open}
          onClose={() => setWhatsAppModalData({ open: false, client: null, pixPayload: null })}
          client={whatsAppModalData.client}
          shopSettings={shopSettings}
          pixPayload={whatsAppModalData.pixPayload}
        />

        {/* Modal de PIX Automático VIP */}
        <window.PixModal
          isOpen={pixModalData.open}
          onClose={() => setPixModalData({ open: false, client: null })}
          client={pixModalData.client}
          shopSettings={shopSettings}
          onOpenWhatsApp={(client, payload) => {
            setWhatsAppModalData({ open: true, client, pixPayload: payload });
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


