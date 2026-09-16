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
   * Renderiza o QR Code dinâmico em um elemento HTML container com proteção total contra falhas
   */
  function renderQRCode(containerElement, payload, size = 200) {
    if (!containerElement) return;
    containerElement.innerHTML = '';
    
    try {
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
        throw new Error("Biblioteca QRCode.js não disponível.");
      }
    } catch (err) {
      console.warn("Fallback visual do QR Code ativado:", err);
      containerElement.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; width:${size}px; height:${size}px; border:2px dashed #cbd5e1; border-radius:20px; padding:12px; text-align:center; color:#64748b; font-size:11px; background:#f8fafc;">
          <span style="font-size:28px; margin-bottom:6px;">⚡</span>
          <strong style="color:#0f172a;">PIX Disponível</strong>
          <span style="font-size:10px; margin-top:4px; line-height:1.3;">Use o botão "Copiar código" abaixo para pagar no app do seu banco.</span>
        </div>
      `;
    }
  }

  return {
    generatePayload,
    renderQRCode,
    calculateCRC16
  };
})();
