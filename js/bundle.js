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
    let cleanKey = pixKey.trim();
    
    // Remove formatação de CPF/CNPJ (hífens e pontos são proibidos pelo BACEN no payload)
    if (cleanKey.match(/^[0-9.-]+$/) && !cleanKey.startsWith('+')) {
      cleanKey = cleanKey.replace(/[^0-9]/g, '');
    }
    
    const key = formatField('01', cleanKey);
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
  async function generateReceiptPdf(client, shopInfo = {}, signatureBase64 = null) {
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

        if (signatureBase64) {
          try {
            doc.addImage(signatureBase64, 'PNG', pageWidth - margin - 70, y - 15, 65, 15);
          } catch(e) {
            console.error('Erro ao adicionar assinatura ao PDF', e);
          }
        }
        doc.line(pageWidth - margin - 70, y, pageWidth - margin - 5, y);
        doc.text(client.name, pageWidth - margin - 37, y + 4, { align: 'center' });
      }

      // Rodapé
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text('Documento gerado eletronicamente pelo CadernoFiado & Cobrança Zap Pro • Autenticidade Garantida', pageWidth / 2, 287, { align: 'center' });

      const cleanClientName = (client.name || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Recibo_Fiado_${cleanClientName}_${new Date().toISOString().split('T')[0]}.pdf`;
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      
      let pdfFile = null;
      try {
        if (typeof File !== 'undefined') {
          pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });
        }
      } catch (e) {
        console.warn('Não foi possível instanciar File diretamente do Blob:', e);
      }

      return {
        success: true,
        blob: pdfBlob,
        file: pdfFile,
        blobUrl: blobUrl,
        filename: filename,
        clientName: client.name,
        receiptText: generateReceiptText(client, shopInfo)
      };

    } catch (error) {
      console.error('Erro na geração do PDF:', error);
      return {
        success: false,
        error: error.message || 'Falha ao processar o arquivo PDF.',
        receiptText: generateReceiptText(client, shopInfo)
      };
    }
  }

  /**
   * DOCUMENTAÇÃO DE INTEGRAÇÃO NATIVA ANDROID (Kotlin / Java)
   * =========================================================
   * Para salvar arquivos PDF gerados em Base64 na pasta de Downloads do dispositivo
   * através do WebView sem depender de DownloadListener, a classe registrada via
   * webView.addJavascriptInterface(...) precisa expor o seguinte método:
   *
   * Em Java (ex: AppJavaScriptProxy.java ou AndroidBridge.java):
   * -------------------------------------------------------------
   * @JavascriptInterface
   * public void saveBase64File(String base64Data, String fileName, String mimeType) {
   *     try {
   *         byte[] pdfAsBytes = android.util.Base64.decode(base64Data, android.util.Base64.DEFAULT);
   *         if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
   *             android.content.ContentValues values = new android.content.ContentValues();
   *             values.put(android.provider.MediaStore.MediaColumns.DISPLAY_NAME, fileName);
   *             values.put(android.provider.MediaStore.MediaColumns.MIME_TYPE, mimeType != null ? mimeType : "application/pdf");
   *             values.put(android.provider.MediaStore.MediaColumns.RELATIVE_PATH, android.os.Environment.DIRECTORY_DOWNLOADS);
   *             android.net.Uri uri = this.activity.getContentResolver().insert(android.provider.MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
   *             if (uri != null) {
   *                 try (java.io.OutputStream out = this.activity.getContentResolver().openOutputStream(uri)) {
   *                     if (out != null) out.write(pdfAsBytes);
   *                 }
   *             }
   *         } else {
   *             java.io.File downloadDir = android.os.Environment.getExternalStoragePublicDirectory(android.os.Environment.DIRECTORY_DOWNLOADS);
   *             if (!downloadDir.exists()) downloadDir.mkdirs();
   *             java.io.File targetFile = new java.io.File(downloadDir, fileName);
   *             try (java.io.FileOutputStream fos = new java.io.FileOutputStream(targetFile)) {
   *                 fos.write(pdfAsBytes);
   *             }
   *         }
   *         this.activity.runOnUiThread(() ->
   *             android.widget.Toast.makeText(this.activity, "Arquivo salvo em Downloads: " + fileName, android.widget.Toast.LENGTH_LONG).show()
   *         );
   *     } catch (Exception e) {
   *         android.util.Log.e("WebViewBridge", "Erro ao salvar arquivo base64: " + e.getMessage(), e);
   *     }
   * }
   *
   * Em Kotlin:
   * ----------
   * @JavascriptInterface
   * fun saveBase64File(base64Data: String, fileName: String, mimeType: String = "application/pdf") {
   *     try {
   *         val bytes = android.util.Base64.decode(base64Data, android.util.Base64.DEFAULT)
   *         if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
   *             val values = android.content.ContentValues().apply {
   *                 put(android.provider.MediaStore.MediaColumns.DISPLAY_NAME, fileName)
   *                 put(android.provider.MediaStore.MediaColumns.MIME_TYPE, mimeType)
   *                 put(android.provider.MediaStore.MediaColumns.RELATIVE_PATH, android.os.Environment.DIRECTORY_DOWNLOADS)
   *             }
   *             val uri = activity.contentResolver.insert(android.provider.MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
   *             uri?.let { activity.contentResolver.openOutputStream(it)?.use { out -> out.write(bytes) } }
   *         } else {
   *             val file = java.io.File(android.os.Environment.getExternalStoragePublicDirectory(android.os.Environment.DIRECTORY_DOWNLOADS), fileName)
   *             file.writeBytes(bytes)
   *         }
   *         activity.runOnUiThread {
   *             android.widget.Toast.makeText(activity, "Arquivo salvo em Downloads: $fileName", android.widget.Toast.LENGTH_LONG).show()
   *         }
   *     } catch (e: Exception) {
   *         android.util.Log.e("WebViewBridge", "Erro ao salvar: ${e.message}", e)
   *     }
   * }
   */

  /**
   * Converte um Blob ou File para string Base64 pura
   */
  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      if (typeof blob === 'string') {
        if (blob.startsWith('data:')) {
          const parts = blob.split(',');
          return resolve(parts[1] || parts[0]);
        }
        return resolve(blob);
      }
      if (typeof FileReader === 'undefined') {
        return reject(new Error('FileReader não suportado no ambiente.'));
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result || '';
        const base64 = typeof dataUrl === 'string' && dataUrl.indexOf(',') !== -1 
          ? dataUrl.split(',')[1] 
          : dataUrl;
        resolve(base64);
      };
      reader.onerror = (e) => reject(e || new Error('Falha ao converter arquivo em Base64'));
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Verifica se o navegador/dispositivo atual suporta compartilhamento de arquivos PDF
   */
  function canSharePdf(blob) {
    if (typeof navigator === 'undefined' || !navigator.share) {
      return false;
    }
    if (typeof File === 'undefined') {
      return false;
    }
    try {
      if (typeof navigator.canShare === 'function') {
        const file = (blob instanceof File)
          ? blob
          : new File([blob || ''], 'recibo_teste.pdf', { type: 'application/pdf' });
        return !!navigator.canShare({ files: [file] });
      }
      // Se tiver navigator.share mas não canShare, assume suporte
      return true;
    } catch (e) {
      return true; // Fallback permissivo para tentar no clique do usuário
    }
  }

  /**
   * Obtém a ponte nativa Android se disponível no aplicativo
   */
  function getNativeBridge() {
    if (typeof window !== 'undefined') {
      if (window.androidAppProxy && typeof window.androidAppProxy.saveBase64File === 'function') {
        return window.androidAppProxy;
      }
      if (window.AndroidBridge && typeof window.AndroidBridge.saveBase64File === 'function') {
        return window.AndroidBridge;
      }
    }
    return null;
  }

  /**
   * Compartilha o arquivo PDF através da Ponte Nativa Android ou Web Share API
   */
  async function sharePdfFile(blob, filename, title, text) {
    const safeFilename = filename || 'recibo-fiado.pdf';
    const safeTitle = title || 'Recibo / Acordo Fiado';
    const safeText = text || 'Documento em PDF gerado pelo CadernoFiado.';

    // 1. Ponte Nativa Android APK (Alta Prioridade - Abre gaveta nativa do Android para WhatsApp, Drive, etc.)
    const bridge = getNativeBridge();
    if (bridge && typeof bridge.shareBase64File === 'function') {
      try {
        const b64 = await blobToBase64(blob);
        const ok = bridge.shareBase64File(b64, safeFilename, 'application/pdf', safeTitle, safeText);
        if (ok !== false) {
          return { success: true, method: 'native_bridge' };
        }
      } catch (bridgeErr) {
        console.warn('[PdfService] Erro na ponte nativa shareBase64File:', bridgeErr);
      }
    }

    // 2. Web Share API nativa (Chrome Android, Safari iOS)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        let file;
        if (blob instanceof File) {
          file = blob;
        } else if (typeof File !== 'undefined' && blob) {
          file = new File([blob], safeFilename, { type: 'application/pdf' });
        }

        if (file) {
          const canShare = (typeof navigator.canShare === 'function')
            ? navigator.canShare({ files: [file] })
            : true;
          
          if (canShare) {
            await navigator.share({
              files: [file],
              title: safeTitle,
              text: safeText
            });
            return { success: true, method: 'navigator.share' };
          }
        }
      } catch(err) {
        if (err.name === 'AbortError') return { success: true, cancelled: true };
        console.warn('[PdfService] navigator.share falhou:', err);
      }
    }

    // 3. Se não conseguir compartilhar, tenta salvar/baixar como fallback
    return downloadPdf(blob, safeFilename);
  }

  /**
   * Baixa e salva o arquivo PDF no aparelho (Downloads)
   */
  async function downloadPdf(blob, filename) {
    const safeFilename = filename || 'recibo-fiado.pdf';
    
    try {
      // 1. Ponte Nativa Android APK (Salva diretamente na pasta Downloads pública do celular)
      const bridge = getNativeBridge();
      if (bridge && typeof bridge.saveBase64File === 'function') {
        try {
          const b64 = await blobToBase64(blob);
          const ok = bridge.saveBase64File(b64, safeFilename, 'application/pdf');
          if (ok !== false) {
            return { success: true, method: 'native_bridge' };
          }
        } catch (bridgeErr) {
          console.warn('[PdfService] Erro na ponte nativa saveBase64File:', bridgeErr);
        }
      }

      // 2. Download via tag <a> (Navegadores desktop e navegadores web mobile)
      try {
        const url = typeof blob === 'string' ? blob : URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = safeFilename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        if (typeof blob !== 'string') {
          setTimeout(() => URL.revokeObjectURL(url), 60000);
        }
        return { success: true, method: 'browser_download' };
      } catch (aErr) {
        console.warn('[PdfService] Download via <a> falhou:', aErr);
      }

      return { 
        success: false, 
        method: 'failed', 
        error: 'Não foi possível salvar o arquivo automaticamente no aparelho. Use a opção de enviar extrato em texto pelo WhatsApp.' 
      };

    } catch(err) {
      console.error('[PdfService] Falha ao processar o PDF:', err);
      return { success: false, method: 'error', error: err.message };
    }
  }

  /**
   * Abre o PDF para visualização com segurança sem quebrar WebViews Android
   */
  function openPdfPreview(blobUrl) {
    try {
      // No Android WebView, window.open(blobUrl) provoca crash nativo (ActivityNotFoundException).
      // Em desktops, pode abrir em nova aba; no Android, o app deve priorizar o visualizador interno.
      const isAndroid = /android/i.test(navigator.userAgent || '');
      if (!isAndroid && typeof window !== 'undefined' && window.open) {
        const win = window.open(blobUrl, '_blank');
        if (win) return { success: true };
      }
      return { success: false, reason: 'use_internal_viewer' };
    } catch(err) {
      console.warn('Visualização externa não suportada no ambiente atual:', err);
      return { success: false, error: err.message };
    }
  }

  return {
    generateReceiptPdf,
    generateReceiptText,
    downloadPdf,
    sharePdfFile,
    openPdfPreview,
    canSharePdf,
    blobToBase64
  };
})();


// ==========================================
// Arquivo: js\state.js
// ==========================================
/**
 * Gerenciamento Central de Estado e Persistência Local (localStorage)
 * CadernoFiado & Cobrança Zap
 */

/**
 * Gerenciador de Histórico de Navegação e Modais (Android Back Button / Popstate)
 * Controla a pilha de modais para que o botão/gesto "Voltar" do Android feche o modal mais de cima
 * e só feche o app quando nenhum modal estiver aberto.
 */
window.ModalHistory = (function() {
  const stack = [];
  let isBackTriggeredByUi = false;

  // Limpa estados residuais de histórico no carregamento inicial
  try {
    if (window.history && window.history.state && window.history.state.__cfModal) {
      window.history.replaceState(null, '');
    }
  } catch(e) {}

  window.addEventListener('popstate', function(event) {
    if (isBackTriggeredByUi) {
      isBackTriggeredByUi = false;
      return;
    }

    if (stack.length > 0) {
      const top = stack.pop();
      if (top && typeof top.close === 'function') {
        top.isPoppedByPopstate = true;
        try {
          top.close();
        } catch(err) {
          console.error('[ModalHistory] Erro ao fechar modal via popstate:', err);
        }
      }
    }
  });

  function push(id, closeFn) {
    if (!id || typeof closeFn !== 'function') return null;

    const existingIndex = stack.findIndex(item => item.id === id);
    if (existingIndex !== -1) {
      return stack[existingIndex];
    }

    const item = {
      id: id,
      close: closeFn,
      isPoppedByPopstate: false
    };
    stack.push(item);

    try {
      window.history.pushState({ __cfModal: true, modalId: id, depth: stack.length }, '');
    } catch(e) {
      console.warn('[ModalHistory] pushState não suportado ou falhou:', e);
    }

    return item;
  }

  function pop(id) {
    const index = stack.findIndex(item => item.id === id);
    if (index === -1) return;

    const item = stack[index];
    stack.splice(index, 1);

    // Se o fechamento foi disparado pela interface do app (ex: clique no X),
    // retrocedemos o histórico correspondente para manter o navegador em sincronia.
    if (!item.isPoppedByPopstate) {
      isBackTriggeredByUi = true;
      try {
        window.history.back();
      } catch(e) {
        isBackTriggeredByUi = false;
      }
    }
  }

  function getStack() {
    return [...stack];
  }

  return {
    push,
    pop,
    getStack
  };
})();

/**
 * Hook React para registrar e desregistrar modais na pilha de histórico automaticamente
 */
window.useModalHistory = function useModalHistory(isOpen, onClose, modalId) {
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;

  React.useEffect(() => {
    if (!isOpen) return;
    const id = modalId || 'modal_' + Math.random().toString(36).substring(2, 9);
    window.ModalHistory.push(id, () => {
      if (onCloseRef.current) onCloseRef.current();
    });

    return () => {
      window.ModalHistory.pop(id);
    };
  }, [isOpen, modalId]);
};

window.AppState = (function() {
  const STORAGE_KEY_CLIENTS = 'cadernofiado_clients_v1';
  const STORAGE_KEY_SETTINGS = 'cadernofiado_settings_v1';
  const STORAGE_KEY_VIP = 'cadernofiado_vip_v1';
  const STORAGE_KEY_REWARDED = 'cadernofiado_rewarded_pass_v1';
  const STORAGE_KEY_LICENSE = 'cadernofiado_license_v2';
  const STORAGE_KEY_DEVICE_ID = 'cadernofiado_device_id_v1';
  const STORAGE_KEY_LAST_SEEN_TIME = 'cadernofiado_last_seen_time_v1';

  function getEffectiveTime() {
    const now = Date.now();
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LAST_SEEN_TIME);
      const lastSeen = raw ? parseInt(raw, 10) : 0;
      if (lastSeen && now < lastSeen - 300000) {
        return lastSeen;
      }
      if (now > lastSeen) {
        localStorage.setItem(STORAGE_KEY_LAST_SEEN_TIME, now.toString());
      }
    } catch(e) {}
    return now;
  }

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

    // Clona e ordena todas as vendas cronologicamente pela data de CRIAÇÃO (FIFO) para abatimento de pagamentos genéricos.
    // O date é o critério primário imutável da dívida (o dueDate é editável e não reflete a ordem real da tomada da dívida).
    const allSales = transactions
      .filter(t => t.type === 'sale')
      .slice()
      .sort((a, b) => {
        const dateA = a.date || '';
        const dateB = b.date || '';
        if (dateA !== dateB) {
          return dateA.localeCompare(dateB);
        }
        // Desempate quando a data de criação for idêntica (ex: parcelas da mesma venda ou mesmo milissegundo)
        if (a.installment?.groupId && b.installment?.groupId && a.installment.groupId === b.installment.groupId) {
          return (a.installment.current || 1) - (b.installment.current || 1);
        }
        // Entre vendas com timestamp idêntico, a criada anteriormente fica no final do array transactions (unshift)
        return transactions.indexOf(b) - transactions.indexOf(a);
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
    } else if (isPartial) {
      status = 'parcial';
      statusText = isOverdue ? 'Parcial (vencida)' : 'Parcialmente paga';
    } else if (isOverdue) {
      status = 'atrasada';
      statusText = 'Vencida';
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
    if (!id || /^CF-\d{4}$/.test(id)) {
      // Gera ID curto e seguro de 8 caracteres hexadecimais no formato CF-XXXX-YYYY
      const p1 = Math.floor(0x1000 + Math.random() * 0xEFFF).toString(16).toUpperCase();
      const p2 = Math.floor(0x1000 + Math.random() * 0xEFFF).toString(16).toUpperCase();
      id = `CF-${p1}-${p2}`;
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
    try {
      return decodeURIComponent(escape(atob(b64)));
    } catch (e) {
      try {
        return atob(b64);
      } catch (err) {
        return "{}";
      }
    }
  }

  // Implementação Canônica de SHA-256 (RFC 6234 / FIPS 180-4) para fallback 100% offline
  function sha256Pure(ascii) {
    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    }
    var mathPow = Math.pow;
    var maxWord = mathPow(2, 32);
    var i, j;
    var result = '';
    var words = [];
    var asciiBitLength = ascii.length * 8;
    var hash = [];
    var k = [];
    var primeCounter = 0;
    var isComposite = {};
    for (var candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (i = 0; i < 313; i += candidate) {
          isComposite[i] = candidate;
        }
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
        k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      }
    }
    ascii += '\x80';
    while ((ascii.length % 64) - 56) ascii += '\x00';
    for (i = 0; i < ascii.length; i++) {
      j = ascii.charCodeAt(i);
      if (j >> 8) return '';
      words[i >> 2] |= j << ((3 - (i % 4)) * 8);
    }
    words[words.length] = (asciiBitLength / maxWord) | 0;
    words[words.length] = asciiBitLength | 0;

    for (j = 0; j < words.length;) {
      var w = words.slice(j, (j += 16));
      var oldHash = hash.slice(0);
      for (i = 0; i < 64; i++) {
        var i2 = i + j;
        var w15 = w[i - 15], w2 = w[i - 2];
        var a = hash[0], e = hash[4];
        var temp1 = hash[7] +
          (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
          ((e & hash[5]) ^ (~e & hash[6])) +
          k[i] +
          (w[i] = (i < 16) ? w[i] : (
            w[i - 16] +
            (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
            w[i - 7] +
            (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
          ) | 0);
        var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
          ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

        hash[7] = hash[6];
        hash[6] = hash[5];
        hash[5] = hash[4];
        hash[4] = (hash[3] + temp1) | 0;
        hash[3] = hash[2];
        hash[2] = hash[1];
        hash[1] = hash[0];
        hash[0] = (temp1 + temp2) | 0;
      }
      for (i = 0; i < 8; i++) {
        hash[i] = (hash[i] + oldHash[i]) | 0;
      }
    }
    for (i = 0; i < 8; i++) {
      for (j = 3; j >= 0; j--) {
        var b = (hash[i] >> (8 * j)) & 255;
        result += (b < 16 ? '0' : '') + b.toString(16);
      }
    }
    return result;
  }

  function sha256Hex(str) {
    var utf8 = unescape(encodeURIComponent(str));
    return sha256Pure(utf8).toUpperCase();
  }

  const COMPACT_KEY_SALT = 'CFZAP_2026_COMPACT_KEY_SALT_B84';

  function computeCompactChecksum(cleanDeviceId, plan) {
    const data = `${COMPACT_KEY_SALT}:${cleanDeviceId}:${plan}`;
    return sha256Hex(data).substring(0, 6);
  }

  function normalizeCompactPlanKey(plan) {
    const p = (plan || 'L').toString().toUpperCase().trim();
    if (p === '30D' || p === 'M' || p.startsWith('MENSAL')) return 'M';
    if (p === '365D' || p === 'A' || p.startsWith('ANUAL')) return 'A';
    if (p === 'LIFETIME' || p === 'L' || p.startsWith('VITAL')) return 'L';
    return ['M', 'A', 'L'].includes(p.charAt(0)) ? p.charAt(0) : 'L';
  }

  function generateCompactLicenseKey(targetDeviceId, plan) {
    let cleanId = (targetDeviceId || '').toString().toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^CF/, '');
    if (cleanId.length < 8) {
      cleanId = cleanId.padEnd(8, '0');
    } else if (cleanId.length > 8) {
      cleanId = cleanId.substring(0, 8);
    }
    const planKey = normalizeCompactPlanKey(plan);
    const checksum = computeCompactChecksum(cleanId, planKey);
    const part1 = cleanId.substring(0, 4);
    const part2 = cleanId.substring(4, 8);
    return `VIP-${planKey}-${part1}-${part2}-${checksum}`;
  }

  /**
   * Ativação de licença:
   * 1. Suporta Códigos Compactos Oficiais (ex: VIP-M-C5A6-6A19-9B2F4E, apenas 22 chars)
   * 2. Suporta Códigos Assimétricos ECDSA legados (formato CFVIP...)
   */
  async function activateLicenseKey(keyInput) {
    if (!keyInput) {
      return { success: false, message: 'Por favor, digite o código de ativação fornecido no WhatsApp.' };
    }
    // Remove espaços, aspas, quebras de linha e caracteres invisíveis
    const raw = keyInput.toString().trim().replace(/[\s"'\r\n`]/g, '');

    // 1. Suporte a Código de Ativação Compacto (Curto, prático e amigável para celular)
    if (raw.toUpperCase().startsWith('VIP-') || (raw.toUpperCase().startsWith('VIP') && raw.length >= 18)) {
      let clean = raw.toUpperCase();
      let parts;
      if (clean.includes('-')) {
        parts = clean.split('-');
      } else {
        // Sem traços: VIP + PLAN(1) + PART1(4) + PART2(4) + CHECKSUM(6)
        const withoutPrefix = clean.substring(3);
        const plan = withoutPrefix.charAt(0);
        const p1 = withoutPrefix.substring(1, 5);
        const p2 = withoutPrefix.substring(5, 9);
        const chk = withoutPrefix.substring(9);
        parts = ['VIP', plan, p1, p2, chk];
      }

      if (parts.length < 5) {
        return { success: false, message: 'Código incompleto. Exemplo esperado: VIP-M-XXXX-YYYY-ZZZZ' };
      }

      let planCode = parts[1]; // 'M', 'A' ou 'L'
      if (planCode === '3' || planCode === '30' || planCode === '30D') planCode = 'M';
      if (planCode === '365' || planCode === '365D') planCode = 'A';
      if (planCode === 'LIFETIME' || planCode === 'VIT') planCode = 'L';

      const keyDevId = parts[2] + parts[3]; // 'XXXX' + 'YYYY'
      const keyChecksum = parts[4];

      let currentDevId = getInstallationId().toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^CF/, '');
      if (currentDevId.length < 8) {
        currentDevId = currentDevId.padEnd(8, '0');
      } else if (currentDevId.length > 8) {
        currentDevId = currentDevId.substring(0, 8);
      }
      if (keyDevId !== currentDevId) {
        return {
          success: false,
          message: `Este código de ativação pertence a outro aparelho. O ID deste aparelho é ${getInstallationId()}.`
        };
      }

      if (!['M', 'A', 'L'].includes(planCode)) {
        return { success: false, message: 'Tipo de plano não identificado no código de ativação.' };
      }

      const expectedChecksum = await computeCompactChecksum(currentDevId, planCode);
      if (keyChecksum !== expectedChecksum) {
        return { success: false, message: 'Código de ativação inválido. Verifique os caracteres e tente novamente.' };
      }

      const now = getEffectiveTime();
      let planName = 'VIP Pro Vitalício';
      let planType = 'LIFETIME';
      let expiresAt = null;

      if (planCode === 'M') {
        planType = '30D';
        planName = 'VIP Pro Mensal (30 Dias)';
        expiresAt = now + 30 * 24 * 60 * 60 * 1000;
      } else if (planCode === 'A') {
        planType = '365D';
        planName = 'VIP Pro Anual (1 Ano)';
        expiresAt = now + 365 * 24 * 60 * 60 * 1000;
      } else if (planCode === 'L') {
        planType = 'LIFETIME';
        planName = 'VIP Pro Vitalício';
        expiresAt = null;
      }

      saveLicense({
        type: planType,
        planName,
        activatedAt: new Date().toISOString(),
        expiresAt,
        licenseKey: clean
      });

      return {
        success: true,
        message: `${planName} ativado com sucesso! Todos os recursos estão liberados.`,
        planName,
        expiresAt
      };
    }

    // 2. Formato assimétrico legado: CFVIP.<payloadB64>.<sigB64>
    if (!raw.startsWith('CFVIP.')) {
      return { 
        success: false, 
        message: 'Código de ativação inválido. Verifique o código recebido no WhatsApp.' 
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
      let payload;
      try {
        payload = JSON.parse(payloadJson);
      } catch (err) {
        return { success: false, message: 'Código de ativação corrompido ou com caracteres inválidos.' };
      }

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

      let planName = 'Plano VIP Mensal (30 Dias)';
      let expiresAt = payload.e;

      if (payload.p === '30D') {
        planName = 'Plano VIP Mensal (30 Dias)';
      } else if (payload.p === '365D') {
        planName = 'Plano VIP Anual (1 Ano)';
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
      return { success: false, message: 'Código de ativação inválido. Verifique os caracteres e tente novamente.' };
    }
  }

  function getVipInfo() {
    const installationId = getInstallationId();
    const license = getStoredLicense();
    const now = getEffectiveTime();

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

    // Suporte ao passe de 24h por anúncio (Rewarded Video) com bloqueio estrito em tempo real
    const rewardedPassRaw = localStorage.getItem(STORAGE_KEY_REWARDED);
    const rewardedPassExpiresAt = rewardedPassRaw ? parseInt(rewardedPassRaw, 10) : null;
    const isPassActive = Boolean(rewardedPassExpiresAt && rewardedPassExpiresAt > now);

    // Se o passe de 24h expirou, remove do storage imediatamente para garantir bloqueio real sem tolerância
    if (rewardedPassExpiresAt && rewardedPassExpiresAt <= now) {
      try { localStorage.removeItem(STORAGE_KEY_REWARDED); } catch(e) {}
    }

    if (isPassActive && !isVip) {
      isVip = true;
      planName = 'Passe VIP 24h';
    }

    return {
      isVip,
      isLicensed: Boolean(license && !isExpired),
      isVipPermanent: isLifetime,
      isLifetime,
      isExpired,
      isPassActive,
      passExpiresAt: isPassActive ? rewardedPassExpiresAt : null,
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
    const now = getEffectiveTime();
    const expiresAt = now + 24 * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_KEY_REWARDED, expiresAt.toString());
    try { localStorage.setItem(STORAGE_KEY_LAST_SEEN_TIME, now.toString()); } catch(e) {}
    notify();
    return expiresAt;
  }

  function getPassRemainingTimeFormatted() {
    const info = getVipInfo();
    if (info.isVip && info.daysRemaining !== null) {
      return `${info.daysRemaining} dias restantes`;
    }
    if (!info.isPassActive || !info.passExpiresAt) return null;
    const now = getEffectiveTime();
    const diffMs = info.passExpiresAt - now;
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
      clients: getClients(),
      license: getStoredLicense(),
      deviceId: getInstallationId()
    };
  }

  function getBackupJsonString() {
    return JSON.stringify(getBackupData(), null, 2);
  }

  async function exportBackup() {
    const data = getBackupData();
    const dataStr = JSON.stringify(data, null, 2);
    const filename = `backup-cadernofiado-${new Date().toISOString().split('T')[0]}.txt`;
    const blob = new Blob([dataStr], { type: 'text/plain;charset=utf-8' });
    const isAndroid = /android/i.test(navigator.userAgent || '');

    let salesCount = 0;
    (data.clients || []).forEach(c => {
      salesCount += (c.transactions || []).filter(t => t.type === 'sale').length;
    });

    let backupFile = null;
    if (typeof File !== 'undefined') {
      try {
        backupFile = new File([blob], filename, { type: 'text/plain' });
      } catch (e) {
        backupFile = blob;
      }
    }

    // 1. Ponte Nativa Android APK (Compartilha nativamente o arquivo como texto legível no celular)
    const bridge = (typeof window !== 'undefined')
      ? (window.androidAppProxy && typeof window.androidAppProxy.shareBase64File === 'function' ? window.androidAppProxy :
         window.AndroidBridge && typeof window.AndroidBridge.shareBase64File === 'function' ? window.AndroidBridge : null)
      : null;

    if (bridge) {
      try {
        const b64 = btoa(unescape(encodeURIComponent(dataStr)));
        const ok = bridge.shareBase64File(b64, filename, 'text/plain', 'Backup CadernoFiado', 'Arquivo de backup do CadernoFiado');
        if (ok !== false) {
          return { success: true, method: 'native_bridge', filename, clientCount: data.clients.length, salesCount, rawJson: dataStr };
        }
      } catch (bridgeErr) {
        console.warn('[AppState] Falha na ponte nativa para backup:', bridgeErr);
      }
    }

    // 2. Web Share API para Android/iOS se suportado
    if (typeof navigator !== 'undefined' && navigator.share && backupFile) {
      try {
        // Tenta com arquivo de texto primeiro
        const canShareFiles = navigator.canShare ? navigator.canShare({ files: [backupFile] }) : true;
        if (canShareFiles) {
          await navigator.share({
            files: [backupFile],
            title: 'Backup CadernoFiado',
            text: 'Backup do CadernoFiado (abra o arquivo ou copie o código para restaurar).'
          });
          return { success: true, method: 'share', filename, clientCount: data.clients.length, salesCount, rawJson: dataStr };
        }
        // Tenta compartilhar apenas como texto puro
        await navigator.share({
          title: 'Backup CadernoFiado',
          text: dataStr
        });
        return { success: true, method: 'share_text', filename, clientCount: data.clients.length, salesCount, rawJson: dataStr };
      } catch (err) {
        if (err.name === 'AbortError') {
          return { success: true, method: 'cancelled', filename, clientCount: data.clients.length, salesCount, rawJson: dataStr };
        }
        console.warn('Share API falhou no backup, tentando fallback:', err);
      }
    }

    // 3. Fallback: Download direto via tag <a> (funciona no navegador/desktop)
    if (!isAndroid) {
      try {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        return { success: true, method: 'download', filename, clientCount: data.clients.length, salesCount, rawJson: dataStr };
      } catch (e) {
        console.warn('Fallback download <a> falhou:', e);
      }
    }

    // 4. Fallback final: Retornar texto bruto para copiar na tela
    return { 
      success: true, 
      method: 'raw_json', 
      rawJson: dataStr, 
      filename, 
      clientCount: data.clients.length, 
      salesCount 
    };
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
      if (validatedData.license && validatedData.deviceId) {
        // Restaura a licença e o deviceId vinculado para manter o status VIP no aparelho novo
        localStorage.setItem(STORAGE_KEY_DEVICE_ID, validatedData.deviceId);
        saveLicense(validatedData.license);
      }
      notify();
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
    getDeviceId: getInstallationId,
    activateLicenseKey,
    generateCompactLicenseKey,
    generateLicenseKey: generateCompactLicenseKey,
    getBackupData,
    getBackupJsonString,
    exportBackup,
    exportData: exportBackup,
    validateBackup,
    restoreBackupData,
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
  ),
  ShoppingBag: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  ArrowDownLeft: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <line x1="17" x2="7" y1="7" y2="17"/><polyline points="17 17 7 17 7 7"/>
    </svg>
  ),
  BookOpen: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  ),
  Eye: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  Share2: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>
    </svg>
  ),
  Zap: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  Cloud: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
    </svg>
  ),
  Lock: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  PenTool: (props = {}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.586 7.586"/><circle cx="11" cy="11" r="2"/>
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

  // Proteção Defensiva: expor ícones também no window global
  // Previne ReferenceError caso algum componente utilize o ícone sem desestruturar de window.Icons
  try {
    Object.keys(raw).forEach(key => {
      if (typeof window[key] === 'undefined') {
        window[key] = raw[key];
      }
    });
  } catch(e) {}
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
    danger: Trash2 ? <Trash2 size={24} /> : <span className="font-bold text-lg">!</span>,
    warning: AlertTriangle ? <AlertTriangle size={24} /> : <span className="font-bold text-lg">!</span>,
    success: CheckCircle2 ? <CheckCircle2 size={24} /> : <span className="font-bold text-lg">✓</span>,
    info: Info ? <Info size={24} /> : <span className="font-bold text-lg">i</span>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-5 space-y-4 animate-pop-in">
        
        <div className="flex items-start gap-3.5">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${badgeClasses[variant] || badgeClasses.info}`}>
            {icons[variant] || icons.info}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
              {title || 'Confirmação'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed whitespace-pre-line">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          {showCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 font-medium text-xs transition-colors btn-smooth"
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-transform active:scale-95 btn-smooth ${confirmBtnClasses[variant] || confirmBtnClasses.danger}`}
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
 * Componente de Cabeçalho: Identidade do Estabelecimento e Ações Rápidas
 * Visual limpo e despoluído inspirado em interfaces nativas.
 */

window.Header = function Header({ vipInfo, remainingTime, onOpenSettings, onOpenBackup, onOpenVip, isDark, onToggleTheme, shopSettings, onOpenInstall }) {
  const { Crown, Settings, Moon, Sun, Clock, Cloud } = window.Icons || {};

  return (
    <header className="sticky top-0 z-30 glass-panel px-4 py-3 transition-colors duration-200">
      <div className="flex items-center justify-between">
        
        {/* Lado Esquerdo: Identidade do App e Estabelecimento */}
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
              <path d="M6 6h10"/>
              <path d="M6 10h7"/>
              <polygon points="17 12 14 17 17 17 16 21 21 15 18 15 19 12" fill="#34d399" stroke="none"/>
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-tight truncate">
              {shopSettings?.shopName || 'CadernoFiado Zap'}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Gestão de Fiados & Cobrança
            </p>
          </div>
        </div>

        {/* Lado Direito: Badge VIP + Alternador de Tema + Configurações */}
        <div className="flex items-center space-x-1.5 flex-shrink-0">
          
          {/* Badge de Status VIP */}
          {vipInfo.isVipPermanent ? (
            <button
              onClick={onOpenVip}
              className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors btn-smooth"
              title="Plano VIP Pro Ativo"
            >
              <Crown size={12} className="text-emerald-600 dark:text-emerald-400" />
              <span>PRO</span>
            </button>
          ) : vipInfo.isPassActive ? (
            <button
              onClick={onOpenVip}
              className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors btn-smooth"
              title="Passe 24h Ativo"
            >
              <Clock size={11} className="text-emerald-600 dark:text-emerald-400" />
              <span className="text-[10px] font-bold">{remainingTime || 'VIP 24h'}</span>
            </button>
          ) : (
            <button
              onClick={onOpenVip}
              className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors btn-smooth"
            >
              <Crown size={12} className="text-amber-500" />
              <span>VIP</span>
            </button>
          )}

          {/* Alternador de Tema Escuro / Claro */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors btn-smooth"
            aria-label="Alternar Tema"
            title="Alternar Tema"
          >
            {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-slate-600" />}
          </button>

          {/* Botão de Nuvem (Backup) */}
          <button
            onClick={onOpenBackup}
            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 transition-colors btn-smooth"
            aria-label="Backup de Segurança"
            title="Backup de Segurança"
          >
            <Cloud size={17} />
          </button>

          {/* Botão de Configurações */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors btn-smooth"
            aria-label="Configurações do Negócio"
            title="Configurações"
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
 * Barra de Navegação Inferior: Design Nativo e Limpo (Estilo Nubank / iOS)
 * 4 Atalhos Organizados: Clientes, Nova Venda, Relatórios e Assinatura VIP
 */

window.BottomNav = function BottomNav({ activeTab, onSelectTab, overdueCount, isVip }) {
  const { Users, PlusCircle, BarChart3, Crown } = window.Icons || {};

  const tabs = [
    {
      id: 'clients',
      label: 'Clientes',
      icon: Users,
      badge: overdueCount > 0 ? overdueCount : null,
      badgeColor: 'bg-rose-500 text-white'
    },
    {
      id: 'new_record',
      label: 'Nova Venda',
      icon: PlusCircle
    },
    {
      id: 'reports',
      label: 'Relatórios',
      icon: BarChart3
    },
    {
      id: 'vip',
      label: isVip ? 'VIP Ativo' : 'Plano VIP',
      icon: Crown,
      badge: isVip ? 'PRO' : null,
      badgeColor: 'bg-emerald-600 text-white'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-bottom-nav max-w-md mx-auto transition-colors duration-200">
      <div className="grid grid-cols-4 px-1 py-2 safe-area-bottom">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 focus:outline-none btn-smooth ${
                isActive 
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold' 
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={isActive ? 2.3 : 1.8} />
                {tab.badge && (
                  <span className={`absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center leading-none ${tab.badgeColor}`}>
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className={`text-[10px] tracking-tight mt-1 truncate ${isActive ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 font-medium'}`}>
                {tab.label}
              </span>

              {isActive && (
                <div className="w-1 h-1 rounded-full bg-emerald-600 dark:bg-emerald-400 mt-0.5"></div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-fadeIn">
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
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-glow-emerald animate-bounce text-white">
                  <window.Icons.Zap size={32} />
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
 * Suporta cobrança específica por parcela de boca, venda avulsa ou débito total.
 * Envio direto com identificação clara e chave PIX proporcional.
 */

window.WhatsAppModal = function WhatsAppModal({
  isOpen,
  onClose,
  client,
  shopSettings,
  pixPayload,
  targetInstallment
}) {
  const [tone, setTone] = React.useState('amigavel');
  const [includePix, setIncludePix] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [customMessage, setCustomMessage] = React.useState('');

  const { X, MessageCircle, Check, QrCode } = window.Icons || {};

  if (!isOpen || !client) return null;

  // Se houver uma parcela ou venda específica selecionada, utiliza suas métricas exatas
  const hasTarget = !!targetInstallment;
  const chargeAmount = hasTarget
    ? (parseFloat(targetInstallment.remainingAmount) || 0)
    : (window.AppState ? window.AppState.computeBalance(client) : 0);

  const totalClientDebt = window.AppState ? window.AppState.computeBalance(client) : 0;
  const formattedTotalDebt = `R$ ${totalClientDebt.toFixed(2).replace('.', ',')}`;
  const formattedCharge = `R$ ${chargeAmount.toFixed(2).replace('.', ',')}`;
  const discountCharge = (chargeAmount * 0.95).toFixed(2).replace('.', ',');
  const shopName = shopSettings?.shopName || 'CadernoFiado Zap';

  // Montagem da mensagem base conforme a parcela e a estratégia selecionada
  let defaultMessage = '';

  if (hasTarget && targetInstallment.isInstallment) {
    // Cobrança de Parcela de Boca Específica (Seção 2.B)
    const current = targetInstallment.current;
    const total = targetInstallment.total;
    const desc = targetInstallment.baseDescription || 'Compra';
    const due = targetInstallment.dueDateFormatted || '-';
    const partialNotice = (targetInstallment.paidAmount > 0)
      ? ` (Restante de ${formattedCharge})`
      : '';

    if (tone === 'amigavel') {
      defaultMessage = `Oi ${client.name}, tudo bem? Passando só para lembrar da sua parcela ${current}/${total} de ${desc} no valor de ${formattedCharge}${partialNotice}. Quando puder acertar, segue a minha chave Pix abaixo. Qualquer dúvida, é só me chamar!`;
    } else if (tone === 'hoje') {
      defaultMessage = `Olá, ${client.name}! Tudo bem?\n\nLembrando que hoje é o vencimento da sua parcela na *${shopName}*:\n\n• Compra: ${desc}\n• Parcela: ${current}/${total}\n• Valor: ${formattedCharge}${partialNotice}\n• Vencimento: Hoje (${due})\n\nAssim que puder acertar, me envie o comprovante por aqui. Muito obrigado!`;
    } else if (tone === 'acordo') {
      defaultMessage = `Olá, ${client.name}! Tudo bem?\n\nCondição especial para adiantar sua parcela na *${shopName}*:\n\n• Compra: ${desc}\n• Parcela: ${current}/${total}\n• De ${formattedCharge} por apenas *R$ ${discountCharge}* no PIX hoje (5% de desconto à vista).\n\nSe quiser aproveitar essa condição, me avise por aqui!`;
    } else {
      defaultMessage = `Olá, ${client.name}.\n\nConsta em nosso sistema uma pendência referente à sua parcela na *${shopName}*:\n\n• Compra: ${desc}\n• Parcela: ${current}/${total}\n• Valor da parcela: ${formattedCharge}${partialNotice}\n• Vencimento: ${due}\n• Saldo total pendente: ${formattedTotalDebt}\n\nPedimos a gentileza de regularizar essa pendência para manter seu cadastro e limite ativos. Obrigado pela atenção.`;
    }

  } else if (hasTarget && !targetInstallment.isInstallment) {
    // Cobrança de Venda Avulsa Específica
    const desc = targetInstallment.baseDescription || 'Compra no fiado';
    const due = targetInstallment.dueDateFormatted || '-';
    const partialNotice = (targetInstallment.paidAmount > 0)
      ? ` (Restante de ${formattedCharge})`
      : '';

    if (tone === 'amigavel') {
      defaultMessage = `Oi ${client.name}, tudo bem? Passando só para te avisar que a sua compra de ${desc} fechou em ${formattedCharge}${partialNotice}. Quando puder acertar, segue a minha chave Pix abaixo. Qualquer dúvida, é só me chamar!`;
    } else if (tone === 'hoje') {
      defaultMessage = `Olá, ${client.name}! Tudo bem?\n\nLembrando que hoje vence sua compra de *${desc}* no valor de *${formattedCharge}* na *${shopName}*.\n\nQualquer dúvida, pode me chamar por aqui. Obrigado!`;
    } else if (tone === 'acordo') {
      defaultMessage = `Olá, ${client.name}!\n\nCondição especial para quitação da sua compra de *${desc}* na *${shopName}*:\n\n• De ${formattedCharge} por apenas *R$ ${discountCharge}* no PIX hoje (5% de desconto).\n\nSe quiser aproveitar, me avise por aqui!`;
    } else {
      defaultMessage = `Olá, ${client.name}.\n\nConsta em aberto o saldo de *${formattedCharge}* referente a *${desc}* (vencimento: ${due}) na *${shopName}*.\n\nPedimos a gentileza de regularizarmos essa pendência. Obrigado pela atenção.`;
    }

  } else {
    // Cobrança Geral do Débito Total do Cliente
    const openSales = (client.transactions || []).filter(t => t.type === 'sale');
    const itemsDescription = openSales.length > 0 
      ? openSales.map(s => s.description).filter(Boolean).slice(0, 3).join(', ')
      : 'compras registradas';

    if (tone === 'amigavel') {
      defaultMessage = `Oi ${client.name}, tudo bem? O total do seu caderno fechou em ${formattedCharge}. Quando puder acertar, segue a minha chave Pix abaixo. Qualquer dúvida, é só me chamar!`;
    } else if (tone === 'hoje') {
      defaultMessage = `Olá, ${client.name}! Tudo bem?\n\nHoje é a data combinada para o acerto da sua conta na *${shopName}*:\n\n• Saldo a acertar: ${formattedCharge}\n\nPodemos acertar via PIX ou pessoalmente. Muito obrigado!`;
    } else if (tone === 'acordo') {
      defaultMessage = `Olá, ${client.name}! Tudo bem?\n\nCondição especial para quitar sua conta na *${shopName}* hoje:\n\n• De ${formattedCharge} por apenas *R$ ${discountCharge}* no PIX (5% de desconto à vista).\n\nSe puder aproveitar hoje, me confirma por aqui!`;
    } else {
      defaultMessage = `Olá, ${client.name}.\n\nConsta um saldo em aberto de *${formattedCharge}* na *${shopName}* referente a: ${itemsDescription}.\n\nSolicitamos a gentileza de regularizarmos essa pendência para manter seu cadastro sempre em dia. Obrigado pela compreensão.`;
    }
  }

  // Anexa somente a Chave PIX clara e objetiva (sem código copia e cola repetitivo/longo)
  const pixTargetAmount = tone === 'acordo' ? (chargeAmount * 0.95) : chargeAmount;

  if (includePix && shopSettings?.pixKey && pixTargetAmount > 0) {
    const keyTypeFormatted = shopSettings.pixKeyType ? ` (${shopSettings.pixKeyType})` : '';
    defaultMessage += `\n\nChave PIX: *${shopSettings.pixKey}*${keyTypeFormatted}\nFavorecido: *${shopSettings.shopName || 'Estabelecimento'}*`;
  }

  const activeMessage = isEditing ? customMessage : defaultMessage;

  const handleToneChange = (newTone) => {
    setTone(newTone);
    setIsEditing(false);
  };

  const handleSendWhatsApp = () => {
    let cleanPhone = (client.phone || '').replace(/\D/g, '');
    if (!cleanPhone.startsWith('55') && cleanPhone.length >= 10) {
      cleanPhone = '55' + cleanPhone;
    }
    const url = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(activeMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(activeMessage)}`;
    
    // Método seguro para WebView no Android (evita bloqueio de window.open)
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-pop-in transition-colors">
        
        {/* Topo Elegante e Minimalista */}
        <div className="px-5 py-4 bg-slate-50/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between transition-colors">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm flex-shrink-0">
              <MessageCircle size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {client.name}
                </h3>
                {hasTarget && targetInstallment.isInstallment && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                    Parcela {targetInstallment.current}/{targetInstallment.total}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Valor da cobrança: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formattedCharge}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-2 flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Conteúdo Rolável */}
        <div className="p-5 space-y-4 overflow-y-auto">
          
          {/* Seletor Segmentado Moderno (Estilo iOS / Linear) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tom da Cobrança
              </label>
              <span className="text-[11px] text-slate-400">
                {tone === 'amigavel' && 'Cordial e tranquilo'}
                {tone === 'hoje' && 'Lembrete no dia do vencimento'}
                {tone === 'acordo' && 'Desconto de 5% no PIX'}
                {tone === 'firme' && 'Notificação formal'}
              </span>
            </div>

            <div className="grid grid-cols-4 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/50 text-xs">
              <button
                type="button"
                onClick={() => handleToneChange('amigavel')}
                className={`py-1.5 rounded-lg font-medium transition-all text-center ${
                  tone === 'amigavel'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Amigável
              </button>
              <button
                type="button"
                onClick={() => handleToneChange('hoje')}
                className={`py-1.5 rounded-lg font-medium transition-all text-center ${
                  tone === 'hoje'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Vence Hoje
              </button>
              <button
                type="button"
                onClick={() => handleToneChange('acordo')}
                className={`py-1.5 rounded-lg font-medium transition-all text-center ${
                  tone === 'acordo'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Desconto
              </button>
              <button
                type="button"
                onClick={() => handleToneChange('firme')}
                className={`py-1.5 rounded-lg font-medium transition-all text-center ${
                  tone === 'firme'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Firme
              </button>
            </div>
          </div>

          {/* Toggle Chave PIX Discreto e Limpo */}
          {shopSettings?.pixKey && chargeAmount > 0 && (
            <label className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 cursor-pointer transition-colors hover:border-slate-300 dark:hover:border-slate-700">
              <input
                type="checkbox"
                checked={includePix}
                onChange={e => {
                  setIncludePix(e.target.checked);
                  setIsEditing(false);
                }}
                className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 w-4 h-4 bg-white dark:bg-slate-900 cursor-pointer"
              />
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-xs text-slate-900 dark:text-white block">
                  Incluir chave PIX na mensagem
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                  Chave: <span className="font-mono text-emerald-600 dark:text-emerald-400">{shopSettings.pixKey}</span>
                </span>
              </div>
              <QrCode size={16} className="text-slate-400 flex-shrink-0" />
            </label>
          )}

          {/* Pré-visualização Autêntica do WhatsApp */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            {/* Barra do Contato no WhatsApp */}
            <div className="bg-[#1f2c34] px-3.5 py-2.5 flex items-center justify-between border-b border-[#2a3942]">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-white text-[11px] font-bold">
                  {(client.name || 'C').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#e9edef] leading-tight">{client.name}</p>
                  <p className="text-[10px] text-emerald-400">online</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isEditing) setCustomMessage(defaultMessage);
                  setIsEditing(!isEditing);
                }}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium"
              >
                {isEditing ? 'Restaurar' : 'Editar texto'}
              </button>
            </div>

            {/* Balão de Mensagem Autêntico */}
            <div className="bg-[#0b141a] p-3.5 max-h-56 overflow-y-auto">
              {isEditing ? (
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full bg-[#005c4b] text-[#e9edef] p-3 rounded-2xl rounded-tr-none text-xs leading-relaxed border border-emerald-500/40 focus:outline-none resize-none h-44 font-sans"
                  placeholder="Edite a mensagem antes de enviar..."
                />
              ) : (
                <div className="bg-[#005c4b] text-[#e9edef] p-3.5 rounded-2xl rounded-tr-none text-xs whitespace-pre-wrap leading-relaxed shadow-sm">
                  {activeMessage}
                  <div className="text-[10px] text-emerald-200/70 text-right mt-1.5 flex items-center justify-end gap-1">
                    <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-[#53bdeb] font-bold">✓✓</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Botão de Ação Direta */}
          <div className="pt-1">
            <button
              onClick={handleSendWhatsApp}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-sm flex items-center justify-center space-x-2 transition-all active:scale-[0.99] btn-smooth"
            >
              <MessageCircle size={18} />
              <span>Abrir WhatsApp do Cliente</span>
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
 * z-index prioritário (z-[70]) para abrir na frente de qualquer modal.
 */

window.PixModal = function PixModal({ isOpen, onClose, client, shopSettings, onOpenWhatsApp }) {
  const [copied, setCopied] = React.useState(false);
  const [pixPayload, setPixPayload] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState(null);
  const qrRef = React.useRef(null);
  const timerRef = React.useRef(null);
  const { X, QrCode, Copy, Check, MessageCircle, Crown, ShieldCheck, Sparkles, AlertTriangle } = window.Icons || {};

  const debt = (isOpen && client && window.AppState) ? window.AppState.computeBalance(client) : 0;

  // Gera o payload oficial do PIX e renderiza o QR Code (executado incondicionalmente em ordem de hooks)
  React.useEffect(() => {
    if (!isOpen || !client) return;
    setErrorMsg(null);

    let payload = '';
    try {
      if (!window.PixService || typeof window.PixService.generatePayload !== 'function') {
        throw new Error('PixService não disponível.');
      }

      // Tratamento de formatação obrigatória para chaves do tipo Telefone (Exigência do BACEN/EMVCo: +55)
      let finalPixKey = shopSettings?.pixKey || '11987650000';
      const pixType = shopSettings?.pixType || 'telefone';
      
      if (pixType === 'telefone') {
        let cleanPhone = finalPixKey.replace(/\D/g, '');
        if (cleanPhone.length >= 10 && !finalPixKey.startsWith('+')) {
          finalPixKey = '+55' + cleanPhone;
        }
      }

      payload = window.PixService.generatePayload({
        pixKey: finalPixKey,
        merchantName: shopSettings?.shopName || 'MEU COMERCIO',
        merchantCity: shopSettings?.city || 'BRASIL',
        amount: debt,
        txid: '***' // Padrão genérico OBRIGATÓRIO. txid dinâmico gera "ordem rejeitada" em contas físicas (DS04).
      });

      setPixPayload(payload);
    } catch(err) {
      console.error('Erro ao gerar payload PIX:', err);
      setErrorMsg('Não foi possível gerar o QR Code. Utilize os dados manuais abaixo.');
    }

    // Renderiza o QR Code com cleanup seguro e proteção try/catch dentro do setTimeout
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        if (qrRef.current) {
          qrRef.current.innerHTML = '';
          if (window.PixService && typeof window.PixService.renderQRCode === 'function') {
            window.PixService.renderQRCode(qrRef.current, payload, 190);
          } else {
            throw new Error('Serviço PixService não disponível para renderização.');
          }
        }
      } catch (renderErr) {
        console.warn('Erro ao renderizar QR Code no timer:', renderErr);
        setErrorMsg('Não foi possível renderizar o QR Code visual. Utilize o código Copia e Cola abaixo.');
      }
    }, 60);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isOpen, client, debt, shopSettings]);

  if (!isOpen || !client) return null;

  const formattedDebt = `R$ ${debt.toFixed(2).replace('.', ',')}`;
  const hasCustomPixKey = !!shopSettings?.pixKey;

  const handleCopy = () => {
    if (!pixPayload) return;
    try {
      navigator.clipboard.writeText(pixPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch(e) {
      console.warn('Clipboard writeText falhou:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/75 animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-pop-in transition-colors">
        
        {/* Cabeçalho VIP com Destaque Dourado */}
        <div className="p-4 bg-gradient-to-r from-amber-500/10 via-white to-amber-500/10 dark:from-amber-950/60 dark:via-slate-900 dark:to-amber-950/50 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-sm">
              <Crown size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1">
                Cobrança Instantânea <span className="text-amber-600 dark:text-amber-400 font-extrabold text-[11px] px-1.5 py-0.5 rounded bg-amber-500/20">PIX</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-300">{client.name}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors btn-smooth"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-4 space-y-4">
          
          {/* Alerta se não houver chave PIX cadastrada */}
          {!hasCustomPixKey && (
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle size={15} className="flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <strong className="block">Chave PIX padrão</strong>
                Cadastre sua chave PIX nas Configurações para receber diretamente na sua conta bancária.
              </div>
            </div>
          )}

          {/* Card do Valor Total da Cobrança */}
          <div className="bg-slate-50 dark:bg-gradient-to-br dark:from-slate-950 dark:to-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-inner relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Valor Exato a Receber
            </span>
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight font-mono">
              {formattedDebt}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center gap-1.5">
              <span>Chave: <strong>{shopSettings?.pixKey || 'Chave Teste'}</strong></span>
              <span className="text-slate-400 dark:text-slate-600">•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Sem intermediários</span>
            </div>
          </div>

          {/* QR Code Oficial */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative p-3 bg-white rounded-3xl shadow-lg border-4 border-slate-200 dark:border-slate-800 flex items-center justify-center">
              <div ref={qrRef} className="w-[190px] h-[190px] flex items-center justify-center">
                {errorMsg && (
                  <div className="text-center p-3 text-slate-500 text-xs">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Código PIX Pronto</p>
                    <p className="text-[10px] text-slate-400 mt-1">Copie o código Copia e Cola abaixo.</p>
                  </div>
                )}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mt-2 flex items-center gap-1 font-medium">
              <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
              Padrão Oficial Banco Central do Brasil (EMVCo)
            </p>
          </div>

          {/* Código PIX Copia e Cola */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Código PIX Copia e Cola:
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-semibold"
              >
                {copied ? 'Copiado!' : 'Copiar código'}
              </button>
            </div>
            <div className="relative flex items-center">
              <input
                type="text"
                readOnly
                value={pixPayload || 'Gerando código PIX...'}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-2xl py-2.5 pl-3 pr-20 text-xs text-slate-700 dark:text-slate-300 font-mono select-all focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={handleCopy}
                className="absolute right-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1 shadow-md transition-all active:scale-95 btn-smooth"
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
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md flex items-center justify-center space-x-2 transition-all transform active:scale-95 btn-smooth"
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

            {/* Seção de Limpeza de Dados */}
            <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/30 transition-colors">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(true)}
                className="w-full text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 font-medium flex items-center justify-center space-x-1.5 transition-colors btn-smooth"
              >
                <Trash2 size={15} />
                <span>Limpar todos os dados locais deste aparelho</span>
              </button>
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


// ==========================================
// Arquivo: js\components\ClientDetailModal.js
// ==========================================
/**
 * Modal Detalhado do Cliente (Ficha de Fiados, Abatimentos e Ações Rápidas)
 * Inclui suporte a parcelamento, entrega multi-canal de recibo no celular e modos Claro/Escuro.
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
  const [targetSaleId, setTargetSaleId] = React.useState(null);
  const [showPhotoModal, setShowPhotoModal] = React.useState(null);
  
  // Estados para diálogos integrados (sem alert/confirm nativos)
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [feedbackModal, setFeedbackModal] = React.useState({ isOpen: false, title: '', message: '', variant: 'info' });
  const [pdfLoading, setPdfLoading] = React.useState(false);
  const [pdfModalData, setPdfModalData] = React.useState(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = React.useState(false);
  const [showInAppReceipt, setShowInAppReceipt] = React.useState(false);
  const [signatureModalOpen, setSignatureModalOpen] = React.useState(false);

  // Controle de histórico do botão/gesto Voltar do Android para submodais (BUG 2)
  window.useModalHistory(!!showDeleteConfirm, () => setShowDeleteConfirm(false), 'showDeleteConfirm');
  window.useModalHistory(feedbackModal.isOpen, () => setFeedbackModal(prev => ({ ...prev, isOpen: false })), 'feedbackModal');
  window.useModalHistory(!!pdfModalData, () => setPdfModalData(null), 'pdfModalData');
  window.useModalHistory(showInAppReceipt, () => setShowInAppReceipt(false), 'showInAppReceipt');
  window.useModalHistory(!!showPhotoModal, () => setShowPhotoModal(null), 'showPhotoModal');
  window.useModalHistory(signatureModalOpen, () => setSignatureModalOpen(false), 'SignatureModal');

  // Verifica se o compartilhamento de arquivos PDF é suportado neste ambiente (BUG 1b)
  const canSharePdf = React.useMemo(() => {
    if (!pdfModalData || !pdfModalData.blob || !window.PdfService || typeof window.PdfService.canSharePdf !== 'function') {
      return false;
    }
    return window.PdfService.canSharePdf(pdfModalData.blob);
  }, [pdfModalData]);

  const {
    X, Phone, MapPin, Calendar, Clock, DollarSign,
    CheckCircle2, AlertTriangle, FileText, QrCode, MessageCircle, Trash2, Check, Crown,
    ShoppingBag, ArrowDownLeft, Eye, Copy, Share2, Download, ChevronRight, PenTool
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
    if (isSubmittingPayment) return;

    const val = parseFloat(payAmount);
    if (isNaN(val) || val <= 0) {
      setFeedbackModal({
        isOpen: true,
        title: 'Valor Inválido',
        message: 'Informe um valor numérico válido para o abatimento.',
        variant: 'warning'
      });
      return;
    }

    setIsSubmittingPayment(true);
    try {
      window.AppState.addPayment(client.id, {
        amount: val,
        paymentMethod: payMethod,
        notes: payNotes,
        targetSaleId: targetSaleId
      });

      setPayAmount('');
      setPayNotes('');
      setTargetSaleId(null);
      setActiveSubTab('extrato');

      if (val >= debt) {
        setFeedbackModal({
          isOpen: true,
          title: 'Conta Quitada',
          message: `Pagamento de R$ ${val.toFixed(2).replace('.', ',')} registrado. O cliente está com a conta em dia.`,
          variant: 'success'
        });
      } else {
        setFeedbackModal({
          isOpen: true,
          title: 'Abatimento Registrado',
          message: `Abatimento de R$ ${val.toFixed(2).replace('.', ',')} lançado no extrato.`,
          variant: 'success'
        });
      }
    } catch(err) {
      setFeedbackModal({
        isOpen: true,
        title: 'Erro ao Registrar',
        message: 'Falha ao salvar abatimento: ' + err.message,
        variant: 'danger'
      });
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Quitar tudo com 1 clique
  const handleFullPayoff = () => {
    if (debt <= 0) return;
    setPayAmount(debt.toFixed(2));
    setPayNotes('Quitação integral de fiado');
    setTargetSaleId(null);
    setActiveSubTab('abater');
  };

  // Proteção e Abertura de Recursos VIP (PIX)
  const handlePixClick = () => {
    if (debt <= 0) {
      setFeedbackModal({
        isOpen: true,
        title: 'Conta em Dia',
        message: 'Este cliente não possui débitos pendentes para cobrança PIX.',
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

  // Gerador de Recibo com suporte à entrega no celular
  const handlePdfClick = async () => {
    if (!isVip) {
      onTriggerPaywall('pdf');
      return;
    }

    setPdfLoading(true);
    const result = await window.PdfService.generateReceiptPdf(client, shopSettings);
    setPdfLoading(false);

    // Abre o modal de opções do comprovante
    setPdfModalData(result);
  };

  const handleSharePdfFile = async () => {
    if (!pdfModalData || !pdfModalData.blob) return;

    try {
      const fileName = pdfModalData.filename || `recibo_${(client.name || 'cliente').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      const title = `Recibo Fiado - ${client.name}`;
      const text = `Extrato detalhado de fiado de ${client.name} - CadernoFiado`;

      // 1. Tenta compartilhamento nativo direto (WhatsApp / Share Sheet)
      const shareResult = await window.PdfService.sharePdfFile(pdfModalData.blob, fileName, title, text);
      if (shareResult && shareResult.success) {
        setPdfModalData(null);
        return;
      }

      // 2. Se o compartilhamento falhar, tenta salvar / baixar
      const downResult = await window.PdfService.downloadPdf(pdfModalData.blob, fileName);
      if (downResult && downResult.success) {
        setPdfModalData(null);
        return;
      }

      // 3. Fallback informativo caso o aparelho tenha restrições
      setFeedbackModal({
        isOpen: true,
        title: 'Aviso',
        message: 'Não foi possível compartilhar o arquivo diretamente no dispositivo. Recomendamos enviar o extrato em formato de texto pelo WhatsApp.',
        variant: 'warning'
      });
    } catch (err) {
      console.error('[ClientDetailModal] Erro ao compartilhar PDF:', err);
      setPdfModalData(null);
    }
  };

  // Envio do comprovante em texto pelo WhatsApp
  const handleSendTextReceiptViaWhatsApp = () => {
    if (!pdfModalData || !pdfModalData.receiptText) return;
    const phone = (client.phone || '').replace(/\D/g, '');
    const cleanPhone = phone.startsWith('55') ? phone : (phone ? '55' + phone : '');
    const url = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(pdfModalData.receiptText)}`
      : `https://wa.me/?text=${encodeURIComponent(pdfModalData.receiptText)}`;
    window.open(url, '_blank');
    setPdfModalData(null);
  };

  const handleCopyTextReceipt = () => {
    if (!pdfModalData || !pdfModalData.receiptText) return;
    navigator.clipboard.writeText(pdfModalData.receiptText);
    setFeedbackModal({
      isOpen: true,
      title: 'Extrato Copiado',
      message: 'O extrato detalhado foi copiado para sua área de transferência.',
      variant: 'success'
    });
    setPdfModalData(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#0e141f] border border-slate-200/80 dark:border-slate-800/80 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-pop-in transition-colors">
        
        {/* Cabeçalho */}
        <div className="p-4 bg-slate-50/80 dark:bg-[#121926]/90 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between transition-colors">
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-base text-slate-900 dark:text-white truncate">{client.name}</h2>
              {status === 'quitado' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <Check size={11} /> Quitado
                </span>
              )}
              {status === 'atrasado' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1">
                  <AlertTriangle size={11} /> Atrasado
                </span>
              )}
              {status === 'em_dia' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  Em Aberto
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {client.phone ? `WhatsApp: ${client.phone}` : 'Sem telefone'} • {client.address || 'Sem endereço'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ml-2 btn-smooth"
          >
            <X size={18} />
          </button>
        </div>

        {/* Card de Saldo e Barra de Limite */}
        <div className="p-4 bg-slate-50/40 dark:bg-[#121926]/50 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                Saldo Devedor Atual
              </span>
              <span className={`text-2xl font-extrabold ${
                debt > 0 ? (status === 'atrasado' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white') : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {formattedDebt}
              </span>
            </div>

            {debt > 0 ? (
              <button
                onClick={handleFullPayoff}
                className="py-1.5 px-3 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 btn-smooth"
              >
                <CheckCircle2 size={14} />
                <span>Quitar Tudo</span>
              </button>
            ) : (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <Check size={12} /> Em Dia
              </span>
            )}
          </div>

          {/* Barra de Limite de Crédito */}
          <div>
            <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
              <span>Limite Usado: {limitUsagePct}%</span>

              <span>Limite Total: R$ {creditLimit.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  limitUsagePct > 90 ? 'bg-rose-500' : limitUsagePct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${limitUsagePct}%` }}
              />
            </div>
            {limitUsagePct >= 100 && (
              <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 font-semibold flex items-center gap-1">
                <AlertTriangle size={11} /> Limite de crédito atingido! Avalie um acerto antes de novas vendas.
              </p>
            )}
          </div>
        </div>

        {/* 4 Botões Rápidos de Ação */}
        <div className="grid grid-cols-4 gap-2 p-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
          
          {/* Cobrar Zap */}
          <button
            onClick={() => {
              if (debt <= 0) {
                setFeedbackModal({
                  isOpen: true,
                  title: 'Conta Quitada',
                  message: 'Este cliente não possui débitos pendentes no momento para cobrança.',
                  variant: 'info'
                });
                return;
              }
              // Encontra a primeira parcela ou venda não quitada para priorizar
              const openSales = (client.transactions || []).filter(t => t.type === 'sale');
              let priorityTarget = null;
              for (const s of openSales) {
                const details = window.AppState.getInstallmentDetails(client, s);
                if (details && details.status !== 'quitada') {
                  priorityTarget = details;
                  break;
                }
              }
              onOpenWhatsApp(client, null, priorityTarget);
            }}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-200 transition-all active:scale-95 shadow-sm btn-smooth"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1">
              <MessageCircle size={16} />
            </div>
            <span className="text-[10px] font-semibold text-center leading-tight">Cobrar Zap</span>
          </button>

          {/* PIX Automático (VIP) */}
          <button
            onClick={handlePixClick}
            className="relative flex flex-col items-center justify-center p-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-200 transition-all active:scale-95 shadow-sm btn-smooth"
          >
            {!isVip && (
              <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded-full text-[8px] font-extrabold bg-amber-500 text-slate-950 flex items-center gap-0.5">
                VIP
              </span>
            )}
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1">
              <QrCode size={16} />
            </div>
            <span className="text-[10px] font-semibold text-center leading-tight">Gerar PIX</span>
          </button>

          {/* Recibo PDF (VIP) */}
          <button
            onClick={handlePdfClick}
            disabled={pdfLoading}
            className="relative flex flex-col items-center justify-center p-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-200 transition-all active:scale-95 shadow-sm btn-smooth"
          >
            {!isVip && (
              <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded-full text-[8px] font-extrabold bg-amber-500 text-slate-950 flex items-center gap-0.5">
                VIP
              </span>
            )}
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center mb-1">
              {pdfLoading ? (
                <div className="w-4 h-4 border-2 border-slate-400 border-t-emerald-500 rounded-full animate-spin" />
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
            className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all active:scale-95 shadow-sm btn-smooth ${
              activeSubTab === 'abater'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                : 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-200'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1">
              <DollarSign size={16} />
            </div>
            <span className="text-[10px] font-semibold text-center leading-tight">
              {activeSubTab === 'abater' ? 'Ver Extrato' : 'Abater'}
            </span>
          </button>

        </div>

        {/* Formalizar Acordo Anticalote (VIP) */}
        <div className="px-4 pb-3 pt-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
          <button
            onClick={() => {
              if (!isVip) onTriggerPaywall('signature');
              else setSignatureModalOpen(true);
            }}
            className="w-full relative flex items-center justify-center space-x-2 py-3 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 dark:from-slate-800 dark:to-slate-950 dark:hover:from-slate-700 dark:hover:to-slate-900 text-white shadow-md active:scale-[0.98] transition-all btn-smooth"
          >
            {!isVip && (
              <span className="absolute -top-2 right-2 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-500 text-slate-950 flex items-center shadow-sm">
                VIP PRO
              </span>
            )}
            <PenTool size={16} />
            <span className="font-bold text-xs">Formalizar Acordo Anticalote</span>
          </button>
        </div>

        {/* Conteúdo Dinâmico: Formulário de Abatimento OU Extrato */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          
          {activeSubTab === 'abater' ? (
            /* Formulário de Baixa de Pagamento */
            <form onSubmit={handlePaymentSubmit} className="space-y-3 animate-fadeIn">
              <div className="p-3 bg-emerald-50/50 dark:bg-slate-950/60 rounded-xl border border-emerald-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1.5">
                  <DollarSign size={14} /> Registrar Pagamento / Abatimento
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Informe o valor recebido deste cliente. O saldo devedor será recalculado instantaneamente.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
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
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono shadow-inner"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Forma:</label>
                  <select
                    value={payMethod}
                    onChange={e => setPayMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="PIX">PIX</option>
                    <option value="Cartão de Débito">Cartão Débito</option>
                    <option value="Cartão de Crédito">Cartão Crédito</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Observação:</label>
                  <input
                    type="text"
                    value={payNotes}
                    onChange={e => setPayNotes(e.target.value)}
                    placeholder="Ex: Deixou com o filho"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('extrato')}
                  className="flex-1 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors btn-smooth"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className={`flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all active:scale-95 shadow-md btn-smooth ${isSubmittingPayment ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmittingPayment ? 'Salvando...' : 'Confirmar Recebimento'}
                </button>
              </div>
            </form>
          ) : (
            /* Lista de Transações / Extrato */
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock size={14} className="text-emerald-600 dark:text-emerald-400" />
                  Extrato de Compras e Abates
                </h4>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  {client.transactions?.length || 0} registro(s)
                </span>
              </div>

              {(!client.transactions || client.transactions.length === 0) ? (
                <div className="text-center py-10 px-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80">
                  <span className="text-2xl block mb-1">📝</span>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nenhum registro ainda</p>
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
                    const instDetails = isSale && window.AppState && window.AppState.getInstallmentDetails
                      ? window.AppState.getInstallmentDetails(client, tx)
                      : null;

                    return (
                      <div
                        key={tx.id}
                        className={`p-3 rounded-2xl border transition-colors ${
                          isSale
                            ? (instDetails && instDetails.status === 'quitada'
                                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                                : instDetails && instDetails.status === 'atrasada'
                                ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                                : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/80')
                            : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-start space-x-2.5 min-w-0 flex-1">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              isSale ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            }`}>
                              {isSale ? <ShoppingBag size={15} /> : <ArrowDownLeft size={15} />}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                  {isSale
                                    ? (instDetails ? instDetails.baseDescription : tx.description || 'Compra no Fiado')
                                    : `Abatimento (${tx.paymentMethod || 'Dinheiro'})`}
                                </span>
                                {instDetails && instDetails.isInstallment && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                                    Parcela {instDetails.current}/{instDetails.total}
                                  </span>
                                )}
                                {instDetails && (
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                    instDetails.status === 'quitada'
                                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                                      : instDetails.status === 'parcial'
                                      ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30'
                                      : instDetails.status === 'atrasada'
                                      ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                                  }`}>
                                    {instDetails.statusText}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                                <span>{txDate}</span>
                                {isSale && txDue && (
                                  <span className={instDetails && instDetails.status === 'atrasada' ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-600 dark:text-slate-300 font-medium'}>
                                    Venc: {txDue}
                                  </span>
                                )}
                                {!isSale && tx.notes && (
                                  <span className="text-slate-400 truncate max-w-[130px]">{tx.notes}</span>
                                )}
                              </div>

                              {tx.photoUrl && (
                                <button
                                  type="button"
                                  onClick={() => setShowPhotoModal(tx.photoUrl)}
                                  className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline mt-0.5 block font-medium"
                                >
                                  Ver Comprovante/Foto 📎
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0 font-mono">
                            <span className={`font-bold text-xs block ${isSale ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                              {isSale ? `+ R$ ${parseFloat(tx.amount).toFixed(2).replace('.', ',')}` : `- R$ ${parseFloat(tx.amount).toFixed(2).replace('.', ',')}`}
                            </span>
                            {instDetails && instDetails.status === 'parcial' && (
                              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold block">
                                Resta R$ {instDetails.remainingAmount.toFixed(2).replace('.', ',')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Ações Diretas por Parcela / Venda */}
                        {isSale && instDetails && (
                          <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                            {instDetails.status !== 'quitada' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPayAmount(instDetails.remainingAmount.toFixed(2));
                                    setPayNotes(`Abatimento ${instDetails.isInstallment ? `Parcela ${instDetails.current}/${instDetails.total}` : 'Venda'}`);
                                    setTargetSaleId(tx.id);
                                    setActiveSubTab('abater');
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-[11px] font-semibold flex items-center gap-1 transition-colors btn-smooth"
                                >
                                  <DollarSign size={13} className="text-emerald-600 dark:text-emerald-400" />
                                  <span>Abater</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => onOpenWhatsApp(client, null, instDetails)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 btn-smooth"
                                >
                                  <MessageCircle size={13} />
                                  <span>Cobrar Zap</span>
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 py-1">
                                <CheckCircle2 size={13} /> Parcela Quitada
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Rodapé do Modal: Excluir Cliente */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between transition-colors">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors btn-smooth"
          >
            <Trash2 size={14} />
            <span>Excluir Cliente</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors btn-smooth"
          >
            Fechar Ficha
          </button>
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

        {/* Modal de Opções de Entrega do Extrato */}
        {pdfModalData && (
          <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/80 animate-fadeIn">
            <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-[#121926] border border-slate-200/80 dark:border-slate-800/80 p-5 space-y-4 shadow-2xl animate-pop-in">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Extrato de {client.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Saldo pendente: <strong className="text-slate-900 dark:text-white">{formattedDebt}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPdfModalData(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2 pt-1">
                {/* 1. Enviar Arquivo PDF Oficial (Destaque Principal) */}
                <button
                  type="button"
                  onClick={handleSharePdfFile}
                  className="w-full p-3 rounded-xl font-semibold text-xs flex items-center justify-between transition-all shadow-sm btn-smooth group bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-[0.98]"
                  title="Enviar Arquivo PDF via WhatsApp"
                >
                  <div className="flex items-center gap-2.5 text-left min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/15">
                      <FileText size={16} />
                    </div>
                    <div className="min-w-0">
                      <span className="block font-bold text-xs truncate">
                        Enviar Arquivo PDF
                      </span>
                      <span className="block text-[10px] truncate opacity-90">
                        Documento oficial direto no WhatsApp
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="opacity-70 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                </button>

                {/* 2. Enviar Extrato em Texto no WhatsApp */}
                <button
                  type="button"
                  onClick={handleSendTextReceiptViaWhatsApp}
                  className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#161f30] dark:hover:bg-[#1a2538] text-slate-800 dark:text-slate-100 font-semibold text-xs flex items-center justify-between transition-all border border-slate-200/80 dark:border-slate-700/60 btn-smooth group"
                >
                  <div className="flex items-center gap-2.5 text-left min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                      <MessageCircle size={16} />
                    </div>
                    <div className="min-w-0">
                      <span className="block font-bold text-xs truncate">Enviar Extrato em Texto</span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate">Mensagem resumida no WhatsApp</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                </button>


                {/* 3. Baixar / Salvar Arquivo PDF no Dispositivo (Celular ou Computador) */}
                <button
                  type="button"
                  onClick={async () => {
                    if (window.PdfService && pdfModalData?.blob) {
                      const res = await window.PdfService.downloadPdf(pdfModalData.blob, pdfModalData.filename);
                      if (res && !res.success) {
                        alert(res.error || 'Não foi possível salvar o arquivo.');
                      } else {
                        setPdfModalData(null);
                      }
                    }
                  }}
                  className="w-full p-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center justify-between transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  <div className="flex items-center gap-2">
                    <Download size={15} className="text-slate-400" />
                    <span>Baixar Arquivo PDF</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Salvar no aparelho</span>
                </button>

                {/* 4. Visualizar Extrato na Tela */}
                <button
                  type="button"
                  onClick={() => setShowInAppReceipt(true)}
                  className="w-full p-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center justify-between transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  <div className="flex items-center gap-2">
                    <Eye size={15} className="text-slate-400" />
                    <span>Visualizar na Tela</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Ver documento</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Visualizador In-App do Recibo Timbrado (Totalmente Seguro no Android - Sem Intent de blob: que crasha) */}
        {showInAppReceipt && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 bg-black/90 animate-fadeIn">
            <div className="relative w-full max-w-md max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-2xl overflow-hidden animate-pop-in">
              {/* Barra de Título */}
              <div className="p-3.5 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="font-bold text-xs text-slate-800 dark:text-white">Extrato Timbrado de Fiado</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInAppReceipt(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Conteúdo Timbrado Scrollável */}
              <div className="p-4 sm:p-5 overflow-y-auto flex-1 text-slate-800 dark:text-slate-100 space-y-4 font-sans text-xs bg-slate-50/50 dark:bg-slate-900/50">
                {/* Cabeçalho da Loja */}
                <div className="text-center pb-3 border-b border-dashed border-slate-300 dark:border-slate-700">
                  <h3 className="font-black text-sm uppercase tracking-wide text-slate-900 dark:text-white">
                    {shopSettings?.shopName || 'CadernoFiado Zap'}
                  </h3>
                  {shopSettings?.phone && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Contato: {shopSettings.phone}</p>
                  )}
                  {shopSettings?.pixKey && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Chave PIX: {shopSettings.pixKey}</p>
                  )}
                  <div className="mt-2 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    EXTRATO DE CONTA FIADO
                  </div>
                </div>

                {/* Dados do Cliente */}
                <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Cliente:</span>
                    <strong className="text-slate-900 dark:text-white">{client.name}</strong>
                  </div>
                  {client.phone && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Telefone:</span>
                      <span>{client.phone}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Situação:</span>
                    <span className={debt > 0 ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>
                      {debt > 0 ? 'Débito Pendente' : 'Conta em Dia'}
                    </span>
                  </div>
                </div>

                {/* Tabela de Lançamentos */}
                <div className="space-y-1.5">
                  <div className="font-bold text-[11px] text-slate-600 dark:text-slate-400 uppercase tracking-wider">Histórico de Movimentações</div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {(!client.transactions || client.transactions.length === 0) ? (
                      <p className="text-slate-400 text-center py-2">Nenhuma movimentação registrada.</p>
                    ) : (
                      client.transactions.map((tx) => {
                        const isSale = tx.type === 'sale';
                        const txDate = tx.date ? new Date(tx.date).toLocaleDateString('pt-BR') : '-';
                        return (
                          <div key={tx.id} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px]">
                            <div className="min-w-0 flex-1 pr-2">
                              <div className="font-medium truncate text-slate-800 dark:text-slate-200">
                                {isSale ? (tx.description || 'Compra no Fiado') : `Abatimento (${tx.paymentMethod || 'Dinheiro'})`}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {txDate} {tx.dueDate ? `• Venc: ${tx.dueDate.split('-').reverse().join('/')}` : ''}
                              </div>
                            </div>
                            <div className={`font-black whitespace-nowrap ${isSale ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                              {isSale ? '+' : '-'} R$ {Number(tx.amount || 0).toFixed(2).replace('.', ',')}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Saldo Total */}
                <div className="p-3 rounded-xl bg-slate-900 text-white dark:bg-emerald-950/40 dark:border dark:border-emerald-800/60 flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-300">SALDO TOTAL DEVEDOR:</span>
                  <span className="text-base font-black text-emerald-400">{formattedDebt}</span>
                </div>

                <div className="text-center text-[10px] text-slate-400">
                  Emitido em: {new Date().toLocaleString('pt-BR')}
                </div>
              </div>

              {/* Botões de Ação do Extrato */}
              <div className="p-3 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleCopyTextReceipt}
                  className="py-2.5 px-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors btn-smooth"
                >
                  <Copy size={14} />
                  <span className="truncate">Copiar Texto</span>
                </button>
                <button
                  type="button"
                  onClick={handleSendTextReceiptViaWhatsApp}
                  className="py-2.5 px-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors btn-smooth"
                >
                  <MessageCircle size={14} />
                  <span className="truncate">Texto Zap</span>
                </button>
                <button
                  type="button"
                  onClick={handleSharePdfFile}
                  className="py-2.5 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-95 btn-smooth"
                  title="Compartilhar Arquivo PDF no WhatsApp"
                >
                  <Download size={15} />
                  <span className="truncate">Enviar PDF</span>
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
          <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/90 animate-fadeIn" onClick={() => setShowPhotoModal(null)}>
            <div className="relative max-w-sm max-h-[80vh] rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-2xl animate-pop-in" onClick={e => e.stopPropagation()}>
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

      {/* Modal de Assinatura */}
      <window.SignatureModal
        isOpen={signatureModalOpen}
        onClose={() => setSignatureModalOpen(false)}
        onConfirmSignature={async (signatureBase64) => {
          setSignatureModalOpen(false);
          if (window.PdfService) {
            setPdfLoading(true);
            try {
              const result = await window.PdfService.generateReceiptPdf(client, shopSettings, signatureBase64);
              setPdfLoading(false);

              if (result && result.success && result.blob) {
                // Converte em objeto File válido e passa para a Web Share API
                const cleanClientName = (client.name || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_');
                const filename = `Acordo_Anticalote_${cleanClientName}.pdf`;
                const title = `Acordo Anticalote - ${client.name}`;
                const text = `Olá ${client.name}! Segue o Acordo de Confissão de Dívida formalizado e assinado.`;

                // Compartilhamento com suporte nativo Android e Web Share API
                const shareRes = await window.PdfService.sharePdfFile(result.blob, filename, title, text);
                if (shareRes && shareRes.success) {
                  setFeedbackModal({
                    isOpen: true,
                    title: 'Acordo Formalizado!',
                    message: 'A gaveta de compartilhamento foi aberta com sucesso. Envie o documento diretamente no WhatsApp do cliente.',
                    variant: 'success'
                  });
                  return;
                }

                // Fallback com modal de opções caso o compartilhamento direto não abra
                setPdfModalData({
                  ...result,
                  filename
                });
              } else {
                setFeedbackModal({
                  isOpen: true,
                  title: 'Erro ao Gerar Acordo',
                  message: result?.error || 'Não foi possível gerar o documento assinado.',
                  variant: 'danger'
                });
              }
            } catch (err) {
              setPdfLoading(false);
              setFeedbackModal({
                isOpen: true,
                title: 'Erro no Processamento',
                message: 'Falha ao processar o acordo: ' + err.message,
                variant: 'danger'
              });
            }
          }
        }}
      />

    </div>
  );
};


// ==========================================
// Arquivo: js\components\ClientsTab.js
// ==========================================
/**
 * Aba Principal: Clientes & Fiados
 * Identidade visual comercial brasileira: limpa, ágil, acolhedora e adaptada aos modos Claro e Escuro.
 */

window.ClientsTab = function ClientsTab({
  clients,
  onSelectClient,
  onOpenNewRecord,
  onOpenWhatsApp,
  onOpenMassBilling,
  isVip
}) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('todos'); // 'todos' | 'atrasado' | 'em_dia' | 'quitado'
  const [sortBy, setSortBy] = React.useState('debt_desc');

  const {
    Search, PlusCircle, MessageCircle, AlertTriangle, CheckCircle2,
    Clock, DollarSign, Users, ChevronRight, Sparkles, X, BookOpen
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
    <div className="space-y-3.5 pb-24 tab-enter">
      
      {/* Painel Financeiro Integrado (Estilo Fintech) */}
      <div className="fintech-card p-4 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Total em Aberto no Fiado
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight block mt-0.5 font-mono">
              R$ {totalReceivables.toFixed(2).replace('.', ',')}
            </span>
          </div>
          <button
            onClick={onOpenNewRecord}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md tap-bounce transition-all active:scale-[0.97]"
          >
            <PlusCircle size={16} />
            <span>Nova Venda</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={15} />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                {overdueClientsCount} {overdueClientsCount === 1 ? 'cliente' : 'clientes'}
              </span>
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium block">
                Cobrança pendente
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center flex-shrink-0">
              <Users size={15} />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                {clients.length} {clients.length === 1 ? 'cliente' : 'clientes'}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                Cadastrados
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ação Estratégica VIP: Cobrança em Massa */}
      {overdueClientsCount > 0 && (
        <button
          onClick={onOpenMassBilling}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 shadow-md transition-all active:scale-95 btn-smooth border border-amber-400/50"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white backdrop-blur-sm">
              <Sparkles size={20} />
            </div>
            <div className="text-left">
              <strong className="block text-sm font-black text-white leading-tight">
                Recuperador de Dívidas VIP
              </strong>
              <span className="block text-[11px] text-amber-50 font-medium leading-tight mt-0.5">
                Cobrar {overdueClientsCount} clientes de uma vez no WhatsApp
              </span>
            </div>
          </div>
          <ChevronRight size={20} className="text-white/80" />
        </button>
      )}

      {/* Barra de Pesquisa e Filtros */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou WhatsApp..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#121926] border border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors shadow-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtros em Pílula */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setStatusFilter('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all btn-smooth ${
              statusFilter === 'todos'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-semibold'
                : 'bg-white dark:bg-[#121926] text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800/80'
            }`}
          >
            Todos ({clients.length})
          </button>

          <button
            onClick={() => setStatusFilter('atrasado')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 btn-smooth ${
              statusFilter === 'atrasado'
                ? 'bg-rose-600 text-white font-semibold'
                : 'bg-white dark:bg-[#121926] text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800/80'
            }`}
          >
            <AlertTriangle size={12} /> Atrasados ({overdueClientsCount})
          </button>

          <button
            onClick={() => setStatusFilter('em_dia')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all btn-smooth ${
              statusFilter === 'em_dia'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'bg-white dark:bg-[#121926] text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800/80'
            }`}
          >
            Em Aberto
          </button>

          <button
            onClick={() => setStatusFilter('quitado')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 btn-smooth ${
              statusFilter === 'quitado'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'bg-white dark:bg-[#121926] text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800/80'
            }`}
          >
            <CheckCircle2 size={12} /> Quitados
          </button>
        </div>
      </div>


      {/* Lista de Clientes ou Estados Vazios */}
      <div className="space-y-2.5">
        {sortedClients.length === 0 ? (
          /* Estado Vazio */
          <div className="text-center py-10 px-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5 shadow-sm transition-colors">
            
            {clients.length === 0 ? (
              /* Caso 1: App recém-instalado ou sem nenhum cliente */
              <>
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
                  <BookOpen size={26} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Nenhum cliente cadastrado
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Cadastre o primeiro cliente para registrar fiados e enviar cobranças no WhatsApp.
                  </p>
                </div>
                <button
                  onClick={onOpenNewRecord}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center space-x-2 transition-all active:scale-95 shadow-md btn-smooth"
                >
                  <PlusCircle size={15} />
                  <span>Novo Cliente</span>
                </button>
              </>
            ) : searchTerm ? (
              /* Caso 2: Busca sem resultados */
              <>
                <div className="w-12 h-12 mx-auto rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                  <Search size={22} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Nenhum resultado
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Nenhum cliente corresponde a "{searchTerm}".
                  </p>
                </div>
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors btn-smooth"
                >
                  Limpar busca
                </button>
              </>
            ) : (
              /* Caso 3: Filtro de status vazio */
              <>
                <div className="w-12 h-12 mx-auto rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                  <Users size={22} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Sem registros neste filtro
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Não há clientes correspondentes à categoria selecionada.
                  </p>
                </div>
                <button
                  onClick={() => setStatusFilter('todos')}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors btn-smooth"
                >
                  Ver todos
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
                className="fintech-card p-3.5 transition-all cursor-pointer group tap-bounce"
              >
                <div className="flex items-center justify-between gap-3">
                  
                  {/* Avatar com Iniciais e Informações */}
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                      status === 'atrasado'
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        : status === 'quitado'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60'
                    }`}>
                      {initials}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {client.name}
                        </h4>
                        {status === 'quitado' && (
                          <CheckCircle2 size={13} className="text-emerald-500" />
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {client.phone ? client.phone : (client.address || 'Sem telefone cadastrado')}
                      </p>
                    </div>
                  </div>

                  {/* Saldo Devedor e Status */}
                  <div className="text-right flex-shrink-0">
                    <span className={`font-bold text-sm block ${
                      debt > 0 
                        ? (status === 'atrasado' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white') 
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {debt > 0 ? formattedDebt : 'Quitado'}
                    </span>

                    <span className={`text-[10px] font-medium mt-0.5 block ${
                      status === 'atrasado' 
                        ? 'text-rose-600 dark:text-rose-400' 
                        : status === 'em_dia' 
                        ? 'text-slate-500 dark:text-slate-400' 
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {status === 'atrasado' 
                        ? (nearestDue ? `Venceu ${nearestDue}` : 'Em atraso') 
                        : status === 'em_dia' 
                        ? (nearestDue ? `Vence ${nearestDue}` : 'Em dia') 
                        : 'Sem débito'}
                    </span>
                  </div>

                  <ChevronRight size={16} className="text-slate-400 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300 flex-shrink-0 ml-0.5 transition-colors" />

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
 * Aba de Novo Registro: Venda no Fiado, Parcelamento de Boca ou Cadastro de Novo Cliente
 * Suporte a parcelamento com cálculo automático de parcelas, anexo de foto e modos Claro/Escuro.
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

  // Estados de Parcelamento de Boca
  const [isInstallment, setIsInstallment] = React.useState(false);
  const [installmentCount, setInstallmentCount] = React.useState(2);
  const [installmentInterval, setInstallmentInterval] = React.useState(30); // 30 = mensal, 15 = quinzenal, 7 = semanal

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

  // Submissão de Venda no Fiado (À vista ou Parcelado de Boca)
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
      if (isInstallment) {
        window.AppState.addInstallmentSale(selectedClientId, {
          totalAmount: val,
          description: saleDesc || 'Venda parcelada',
          startDate: dueDate,
          installmentCount: installmentCount,
          intervalDays: installmentInterval,
          photoUrl: photoPreview
        });
      } else {
        window.AppState.addSale(selectedClientId, {
          amount: val,
          description: saleDesc || 'Venda no fiado',
          dueDate: dueDate,
          photoUrl: photoPreview
        });
      }

      setSaleAmount('');
      setSaleDesc('');
      setPhotoPreview(null);
      setIsInstallment(false);

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
    <div className="space-y-4 pb-24 tab-enter">
      
      {/* Seletor de Tipo de Registro: Venda Fiada vs Novo Cliente */}
      <div className="flex rounded-2xl bg-slate-200/80 dark:bg-slate-900 p-1 border border-slate-300 dark:border-slate-800 transition-colors">
        <button
          type="button"
          onClick={() => setRecordType('sale')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 btn-smooth ${
            recordType === 'sale'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <PlusCircle size={15} />
          <span>Anotar Fiado</span>
        </button>

        <button
          type="button"
          onClick={() => setRecordType('client')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 btn-smooth ${
            recordType === 'client'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <UserPlus size={15} />
          <span>Novo Cliente</span>
        </button>
      </div>

      {recordType === 'sale' ? (
        /* FORMULÁRIO DE ANOTAR VENDA FIADA */
        <form onSubmit={handleSaleSubmit} className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5 shadow-sm transition-colors">
            
            {/* Seleção do Cliente */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Cliente que está comprando:
              </label>
              {clients.length === 0 ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300">
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Selecione o cliente...</option>
                  {clients.map(c => {
                    const debt = window.AppState.computeBalance(c);
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} {debt > 0 ? `(Deve R$ ${debt.toFixed(2).replace('.', ',')})` : '(Sem débitos)'}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            {/* Valor da Venda */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
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
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono shadow-inner"
                />
              </div>
            </div>

            {/* Opção: Parcelamento de Boca */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3 transition-colors">
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isInstallment}
                    onChange={e => setIsInstallment(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      🤝 Parcelamento de Boca
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                      Dividir em parcelas com datas automáticas
                    </span>
                  </div>
                </label>
                {isInstallment && parseFloat(saleAmount) > 0 && (
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-500/30">
                    {installmentCount}x de R$ {(parseFloat(saleAmount) / installmentCount).toFixed(2).replace('.', ',')}
                  </span>
                )}
              </div>

              {isInstallment && (
                <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        Qtd. de Parcelas:
                      </label>
                      <select
                        value={installmentCount}
                        onChange={e => setInstallmentCount(parseInt(e.target.value, 10))}
                        className="w-full px-2.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                      >
                        {[2, 3, 4, 5, 6, 8, 10, 12].map(n => (
                          <option key={n} value={n}>{n}x parcelas</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        Frequência:
                      </label>
                      <select
                        value={installmentInterval}
                        onChange={e => setInstallmentInterval(parseInt(e.target.value, 10))}
                        className="w-full px-2.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value={30}>Mensal (a cada 30 dias)</option>
                        <option value={15}>Quinzenal (a cada 15 dias)</option>
                        <option value={7}>Semanal (a cada 7 dias)</option>
                      </select>
                    </div>
                  </div>

                  {/* Resumo visual do cronograma de parcelas */}
                  {parseFloat(saleAmount) > 0 && (
                    <div className="p-2.5 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-[11px] space-y-1">
                      <span className="font-bold text-emerald-800 dark:text-emerald-300 block text-[10px] uppercase tracking-wider">
                        📅 Cronograma Previsto:
                      </span>
                      <div className="space-y-1 text-slate-700 dark:text-slate-300">
                        {Array.from({ length: installmentCount }).map((_, idx) => {
                          const baseD = dueDate ? new Date(dueDate + 'T12:00:00') : new Date();
                          const currentD = new Date(baseD);
                          currentD.setDate(baseD.getDate() + (idx * installmentInterval));
                          const dStr = currentD.toLocaleDateString('pt-BR');
                          const instVal = (parseFloat(saleAmount) / installmentCount).toFixed(2).replace('.', ',');
                          return (
                            <div key={idx} className="flex justify-between text-[10.5px]">
                              <span>Parcela {idx + 1} de {installmentCount}:</span>
                              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">R$ {instVal} ({dStr})</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Descrição do Fiado */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Descrição do Produto ou Serviço:
              </label>
              <input
                type="text"
                value={saleDesc}
                onChange={e => setSaleDesc(e.target.value)}
                placeholder="Ex: Manicure + Pedicure / 2 Calças Jeans"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />

              {/* Tags rápidas */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {quickTags.map((tag, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSaleDesc(tag)}
                    className="text-[10px] px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors btn-smooth"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Data de Vencimento (1ª Parcela ou Total) */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {isInstallment ? 'Vencimento da 1ª Parcela:' : 'Data do Vencimento Acordada:'}
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />

              {/* Atalhos de prazo */}
              <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickDue(7)}
                  className="py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-[10px] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 btn-smooth"
                >
                  +7 Dias
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDue(15)}
                  className="py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-[10px] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 btn-smooth"
                >
                  +15 Dias
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDue(30)}
                  className="py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-[10px] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 btn-smooth"
                >
                  +30 Dias
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    setDueDate(today);
                  }}
                  className="py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-[10px] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 btn-smooth"
                >
                  Hoje
                </button>
              </div>
            </div>
          </div>

          {/* Anexo de Foto / Cupom / Assinatura */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-sm transition-colors">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Foto do Comprovante / Cupom (Opcional):
            </span>

            {photoPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 max-h-40">
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
              <label className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-950 cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors btn-smooth">
                <Camera size={22} className="mb-1 text-slate-400 dark:text-slate-500" />
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
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center space-x-2 transition-all active:scale-[0.99] shadow-md btn-smooth"
          >
            <Check size={18} />
            <span>{isInstallment ? `Salvar Venda em ${installmentCount}x Parcelas` : 'Salvar Fiado no Caderno'}</span>
          </button>

        </form>
      ) : (
        /* FORMULÁRIO DE CADASTRAR NOVO CLIENTE */
        <form onSubmit={handleClientSubmit} className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5 shadow-sm transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserPlus size={16} className="text-emerald-600 dark:text-emerald-400" />
              Cadastrar Novo Cliente no Caderno
            </h3>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Nome Completo ou Apelido Conhecido:
              </label>
              <input
                type="text"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="Ex: Dona Neide / Seu Jorge"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                WhatsApp com DDD:
              </label>
              <input
                type="tel"
                value={clientPhone}
                onChange={e => setClientPhone(e.target.value)}
                placeholder="Ex: 11987654321 (apenas números)"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                Fundamental para a cobrança automática e envio do PIX com 1 clique.
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Endereço ou Ponto de Referência (Opcional):
              </label>
              <input
                type="text"
                value={clientAddress}
                onChange={e => setClientAddress(e.target.value)}
                placeholder="Ex: Rua das Flores, 120 / Bloco B Apto 10"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Limite de Crédito Fiado (R$):
              </label>
              <input
                type="number"
                step="50"
                value={clientLimit}
                onChange={e => setClientLimit(e.target.value)}
                placeholder="350,00"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                O app avisará quando a dívida acumulada ultrapassar esse limite.
              </span>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all active:scale-[0.99] shadow-md btn-smooth"
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
 * Lapidação Visual Premium, UX moderna e profissional.
 */

window.ReportsTab = function ReportsTab({ clients, isVip, onTriggerPaywall, onSelectClient }) {
  const {
    BarChart3, TrendingUp, Clock, Crown, Users, CheckCircle2, AlertTriangle, ShieldCheck
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

  const defaultRate = totalReceivables > 0 
    ? Math.round((totalOverdue / totalReceivables) * 100) 
    : 0;

  const avgTicket = totalSalesCount > 0 ? (totalSalesEver / totalSalesCount) : 0;

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
    <div className="space-y-5 pb-28 tab-enter px-1">
      
      {/* Resumo Financeiro Premium */}
      <div className="relative rounded-[24px] overflow-hidden shadow-2xl border border-slate-200/50 dark:border-slate-800/80">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 opacity-95"></div>
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-emerald-400 opacity-20 blur-3xl mix-blend-screen pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-emerald-800 opacity-40 blur-3xl mix-blend-multiply pointer-events-none"></div>
        
        <div className="relative p-5 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-[10px] bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                <BarChart3 size={16} strokeWidth={2.5} className="text-white" />
              </div>
              <span className="font-bold text-sm tracking-wide text-emerald-50">Resumo Financeiro</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
              Hoje
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-emerald-200/80 font-medium uppercase tracking-wider">Capital na Rua (A Receber)</span>
            <div className="flex items-end gap-2">
              <span className="text-sm font-bold text-emerald-300">R$</span>
              <span className="text-4xl font-black tracking-tight leading-none drop-shadow-sm">
                {totalReceivables.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 shadow-inner">
              <span className="text-[10px] text-emerald-200 uppercase tracking-widest font-semibold block mb-1">Recebido</span>
              <span className="font-mono text-lg font-bold">R$ {totalPaidEver.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 shadow-inner relative overflow-hidden">
              <span className="text-[10px] text-emerald-200 uppercase tracking-widest font-semibold block mb-1">Ticket Médio</span>
              <span className="font-mono text-lg font-bold">R$ {avgTicket.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico Visual de Distribuição da Inadimplência */}
      <div className="p-5 rounded-[24px] bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800 relative overflow-hidden transition-colors">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/[0.03] dark:bg-rose-500/[0.05] rounded-bl-full pointer-events-none"></div>
        
        <div className="flex items-center justify-between mb-4 relative z-10">
          <h4 className="text-[13px] font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 tracking-tight">
            <TrendingUp size={16} className="text-emerald-500" />
            Saúde do Caixa
          </h4>
          <span className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-md">
            {defaultRate}% Atraso
          </span>
        </div>

        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner relative z-10">
          {totalReceivables > 0 ? (
            <>
              <div
                className="bg-emerald-500 transition-all duration-700 ease-out relative"
                style={{ width: `${(totalOnTime / totalReceivables) * 100}%` }}
              >
                <div className="absolute inset-0 bg-white/20"></div>
              </div>
              <div
                className="bg-rose-500 transition-all duration-700 ease-out relative"
                style={{ width: `${(totalOverdue / totalReceivables) * 100}%` }}
              ></div>
            </>
          ) : (
            <div className="bg-emerald-500/50 w-full h-full rounded-full" />
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 text-xs relative z-10">
          <div className="flex flex-col space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" /> No Prazo
            </span>
            <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
              R$ {totalOnTime.toFixed(2).replace('.', ',')}
            </span>
          </div>

          <div className="flex flex-col space-y-1">
            <span className="text-[10px] font-bold text-rose-500/80 uppercase tracking-wider flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-rose-500" /> Atrasados
            </span>
            <span className="font-bold text-rose-600 dark:text-rose-400 font-mono text-sm">
              R$ {totalOverdue.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>
      </div>

      {/* Previsão de Entradas Acordadas */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-[20px] bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-900/5 border border-amber-200/50 dark:border-amber-500/20 shadow-sm relative overflow-hidden transition-colors group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-amber-200/50 dark:bg-amber-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest block mb-1">
            Próx. 7 Dias
          </span>
          <span className="text-base font-black text-slate-800 dark:text-slate-100 font-mono block mb-1">
            R$ {forecast7Days.toFixed(2).replace('.', ',')}
          </span>
          <span className="text-[9px] text-amber-700/60 dark:text-amber-500/60 font-medium">Entradas previstas</span>
        </div>

        <div className="p-4 rounded-[20px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-colors">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
            Próx. 30 Dias
          </span>
          <span className="text-base font-black text-slate-800 dark:text-slate-100 font-mono block mb-1">
            R$ {(forecast7Days + forecast30Days).toFixed(2).replace('.', ',')}
          </span>
          <span className="text-[9px] text-slate-400 font-medium">Total previsto no mês</span>
        </div>
      </div>

      {/* Ranking dos Melhores Pagadores */}
      <div className="p-5 rounded-[24px] bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-[13px] font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 tracking-tight">
            <Crown size={16} className="text-amber-500" />
            Top 5 Clientes Fiéis
          </h4>
        </div>

        {bestPayers.length === 0 ? (
          <div className="text-center py-8 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-300 dark:border-slate-700">
            <Users size={28} className="text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Sem pagamentos ainda</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bestPayers.map((item, idx) => {
              const posBadge = `${idx + 1}º`;
              return (
                <div
                  key={item.client.id}
                  onClick={() => onSelectClient(item.client.id)}
                  className="group relative flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 hover:bg-white dark:hover:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-emerald-500/30 hover:shadow-md cursor-pointer transition-all duration-300"
                >
                  <div className="flex items-center space-x-3 min-w-0 z-10">
                    <span className={`w-8 h-8 rounded-[10px] text-[11px] font-black flex items-center justify-center flex-shrink-0 shadow-sm ${
                      idx === 0 ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 border border-amber-400' :
                      idx === 1 ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800 border border-slate-300' :
                      idx === 2 ? 'bg-gradient-to-br from-amber-700 to-amber-900 text-amber-100 border border-amber-800' :
                      'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}>
                      {posBadge}
                    </span>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-slate-900 dark:text-white block truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {item.client.name}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        {item.status === 'quitado' ? <CheckCircle2 size={10} className="text-emerald-500"/> : null}
                        {item.status === 'quitado' ? 'Tudo pago' : 'Pagamentos em dia'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 z-10">
                    <span className="text-sm font-black text-slate-900 dark:text-white font-mono block tracking-tight">
                      R$ {item.totalPaid.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider">Pago</span>
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
 * Sistema seguro de Licenciamento Criptográfico por ID de Aparelho.
 * Suporte completo a temas Claro e Escuro com transições suaves.
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
    } else {
      setActivationMessage({ success: false, text: result.message });
    }
  };

  return (
    <div className="space-y-4 pb-28 tab-enter">
      
      {/* Alerta de Recurso Bloqueado */}
      {triggerReason && !vipInfo.isVip && (
        <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 flex items-start space-x-2.5 animate-pop-in">
          <Crown size={18} className="text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">
              {triggerReason === 'pix' && 'Cobrança PIX Automática é um recurso VIP!'}
              {triggerReason === 'pdf' && 'Emissão de Recibos em PDF é um recurso VIP!'}
              {triggerReason === 'signature' && 'A Assinatura Anticalote é um recurso VIP!'}
              {triggerReason === 'backup' && 'O Backup de Segurança é um recurso VIP!'}
              {triggerReason === 'mass_billing' && 'A Cobrança em Massa é um recurso VIP!'}
              {(!triggerReason || !['pix', 'pdf', 'signature', 'backup', 'mass_billing'].includes(triggerReason)) && 'Esse é um recurso VIP exclusivo!'}
            </span>
            <span className="text-[11px] text-slate-600 dark:text-slate-300">
              Assine um plano a partir de R$ 9,90/mês ou assista a um vídeo rápido para desbloquear por 24h.
            </span>
          </div>
        </div>
      )}

      {/* --- SE O CLIENTE JÁ TEM O VIP ATIVO --- */}
      {vipInfo.isVip ? (
        <div className="relative p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-500/40 shadow-xl text-center space-y-4 overflow-hidden transition-colors">
          
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500 dark:text-amber-400">
            <Crown size={28} strokeWidth={2.5} />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1.5">
              <CheckCircle2 size={13} /> Assinatura Ativa
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-2">
              {vipInfo.planName || 'VIP PRO Ativo'}
            </h2>
            
            {vipInfo.isLifetime ? (
              <p className="text-xs text-amber-600 dark:text-amber-300 mt-1 font-semibold">
                Licença Vitalícia Ativa (Acesso Permanente)
              </p>
            ) : vipInfo.daysRemaining !== null ? (
              <div className="mt-2 space-y-1">
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  Vence em {vipInfo.daysRemaining} dias ({vipInfo.expiresAtDateStr})
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Todas as funções de PIX e comprovantes estão liberadas.
                </p>
              </div>
            ) : (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                Passe temporário de 24 horas ativo.
              </p>
            )}
          </div>

          {/* Dados do Aparelho */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs transition-colors">
            <span className="text-slate-500 dark:text-slate-400">ID deste Aparelho:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">{installationId}</span>
          </div>

          {/* Renovação se estiver próximo do vencimento */}
          {!vipInfo.isLifetime && vipInfo.daysRemaining !== null && vipInfo.daysRemaining <= 5 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl text-xs text-amber-800 dark:text-amber-300 space-y-2">
              <p className="font-semibold">Seu plano vence em breve.</p>
              <button
                onClick={() => handleOrderViaWhatsApp('monthly')}
                className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs btn-smooth"
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
          <div className="relative p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-3 transition-colors">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Crown size={24} strokeWidth={2} />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 inline-block">
                Recursos Profissionais
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-2 leading-tight">
                CadernoFiado <span className="text-emerald-600 dark:text-emerald-400">PRO</span>
              </h2>
              <ul className="text-left text-xs text-slate-700 dark:text-slate-300 mt-3 mx-auto max-w-xs space-y-2">
                <li className="flex items-center gap-2"><FileText size={14} className="text-emerald-500" /> Extratos em PDF com a Logo do negócio</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Assinatura Anticalote de Clientes</li>
                <li className="flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-500" /> Backup de segurança na nuvem</li>
                <li className="flex items-center gap-2"><Star size={14} className="text-emerald-500" /> Zero propagandas no aplicativo</li>
              </ul>
            </div>

            {/* Caixa do ID do Celular */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs transition-colors">
              <div className="text-left">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">ID deste Celular:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">{installationId}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyId}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-medium flex items-center gap-1 border border-slate-200 dark:border-slate-700 btn-smooth"
              >
                {copiedId ? <Check size={13} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={13} />}
                <span>{copiedId ? 'Copiado' : 'Copiar ID'}</span>
              </button>
            </div>
          </div>

          {/* Seleção de Planos de Preço */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 px-1">
              Selecione o plano desejado:
            </p>

            <div className="grid grid-cols-3 gap-2">
              
              {/* Mensal */}
              <div
                onClick={() => setSelectedPlan('monthly')}
                className={`p-3 rounded-2xl border cursor-pointer transition-all text-center relative btn-smooth ${
                  selectedPlan === 'monthly'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-750'
                }`}
              >
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase block">Mensal</span>
                <span className="text-base font-bold text-slate-900 dark:text-white block mt-0.5">R$ 9,90</span>
                <span className="text-[10px] text-slate-400">30 dias</span>
              </div>

              {/* Anual (Destaque) */}
              <div
                onClick={() => setSelectedPlan('annual')}
                className={`p-3 rounded-2xl border cursor-pointer transition-all text-center relative btn-smooth ${
                  selectedPlan === 'annual'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-750'
                }`}
              >
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-emerald-600 text-white font-bold text-[9px] uppercase shadow-sm">
                  Recomendado
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase block mt-0.5">Anual</span>
                <span className="text-base font-bold text-slate-900 dark:text-white block mt-0.5">R$ 59,90</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">R$ 4,99/mês</span>
              </div>

              {/* Vitalício */}
              <div
                onClick={() => setSelectedPlan('lifetime')}
                className={`p-3 rounded-2xl border cursor-pointer transition-all text-center relative btn-smooth ${
                  selectedPlan === 'lifetime'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-750'
                }`}
              >
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase block">Vitalício</span>
                <span className="text-base font-bold text-slate-900 dark:text-white block mt-0.5">R$ 97,00</span>
                <span className="text-[10px] text-slate-400">Permanente</span>
              </div>

            </div>
          </div>

          {/* Botão de Solicitação no WhatsApp */}
          <button
            onClick={() => handleOrderViaWhatsApp()}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center space-x-2 transition-all active:scale-[0.99] shadow-sm btn-smooth"
          >
            <MessageCircle size={18} />
            <span>Solicitar Código de Ativação</span>
          </button>

          {/* Formulário de Ativação de Código do Cliente */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm transition-colors">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Check size={16} />
              </div>
              <h4 className="font-bold text-xs text-slate-900 dark:text-white">Ativar com Código Recebido</h4>
            </div>

            <form onSubmit={handleActivateCode} className="space-y-2.5">
              <input
                type="text"
                value={licenseCode}
                onChange={(e) => setLicenseCode(e.target.value.trim())}
                placeholder="Ex: VIP-M-C5A6-6A19-9B2F4E"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
              />

              {activationMessage && (
                <div className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 ${
                  activationMessage.success 
                    ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30' 
                    : 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
                }`}>
                  {activationMessage.success ? <Check size={15} /> : <AlertTriangle size={15} />}
                  <span>{activationMessage.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={activating}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold text-xs border border-slate-300 dark:border-slate-700 transition-all btn-smooth"
              >
                {activating ? 'Validando código...' : 'Ativar Código'}
              </button>
            </form>
          </div>

          {/* Opção Gratuita: Vídeo Premiado 24h */}
          {onWatchRewarded && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center space-y-2 transition-colors">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                Quer testar antes? Libere 24h grátis assistindo a um vídeo rápido:
              </span>
              <button
                onClick={onWatchRewarded}
                className="py-2 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 mx-auto border border-slate-300 dark:border-slate-700 transition-colors btn-smooth"
              >
                <Play size={14} className="text-emerald-600 dark:text-emerald-400" />
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fadeIn">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100 overflow-hidden animate-pop-in">
        
        {/* Detalhe de iluminação de fundo */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-brand-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Botão de Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors btn-smooth"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        {/* Cabeçalho do Modal */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 p-0.5 shadow-glow-emerald flex items-center justify-center">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
              <Smartphone size={24} className="text-emerald-400" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Instalar CadernoFiado
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tenha o app direto na sua tela inicial
            </p>
          </div>
        </div>

        {/* Benefícios da instalação */}
        <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-3.5 mb-5 space-y-2.5">
          <div className="flex items-center space-x-2.5 text-xs text-slate-700 dark:text-slate-300">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">✓</span>
            <span><strong>100% Offline:</strong> Funciona mesmo sem sinal de internet.</span>
          </div>
          <div className="flex items-center space-x-2.5 text-xs text-slate-700 dark:text-slate-300">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">✓</span>
            <span><strong>Acesso Instantâneo:</strong> Abra direto pelo ícone sem digitar link.</span>
          </div>
          <div className="flex items-center space-x-2.5 text-xs text-slate-700 dark:text-slate-300">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">✓</span>
            <span><strong>Sem Ocupar Memória:</strong> Super leve e não trava o seu celular.</span>
          </div>
        </div>

        {/* Bloco de Ação / Instruções conforme dispositivo */}
        {installed ? (
          <div className="text-center py-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 rounded-2xl text-emerald-700 dark:text-emerald-300 font-semibold text-sm flex items-center justify-center gap-2">
            <Check size={18} />
            Aplicativo instalado com sucesso!
          </div>
        ) : isIos ? (
          /* Instruções para iPhone / Safari */
          <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 text-xs text-slate-700 dark:text-slate-300">
            <p className="font-semibold text-amber-600 dark:text-amber-300 flex items-center gap-1.5 text-sm">
              Dispositivos Apple (iOS / Safari):
            </p>
            <ol className="space-y-2 list-decimal list-inside pl-1 text-slate-600 dark:text-slate-300">
              <li>Toque no botão <strong>Compartilhar</strong> (ícone com quadrado e seta para cima).</li>
              <li>Role as opções e toque em <strong>"Adicionar à Tela de Início"</strong>.</li>
              <li>Toque em <strong>"Adicionar"</strong> no canto superior direito.</li>
            </ol>
          </div>
        ) : installPrompt ? (
          /* Botão Direto para Android / Chrome / Edge */
          <button
            onClick={handleInstallClick}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-brand-500 to-emerald-600 hover:from-brand-600 hover:to-emerald-700 text-slate-950 font-bold rounded-2xl shadow-glow-emerald flex items-center justify-center space-x-2 transition-all transform active:scale-95 text-sm btn-smooth"
          >
            <Download size={18} />
            <span>Instalar Aplicativo Agora</span>
          </button>
        ) : (
          /* Instruções Genéricas / Menu do Navegador */
          <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 text-xs text-slate-700 dark:text-slate-300">
            <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
              Como adicionar à tela inicial:
            </p>
            <ol className="space-y-2 list-decimal list-inside pl-1 text-slate-600 dark:text-slate-300">
              <li>Toque nos <strong>três pontinhos (⋮)</strong> no canto superior do navegador.</li>
              <li>Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</li>
              <li>Confirme para criar o atalho com o ícone do CadernoFiado.</li>
            </ol>
          </div>
        )}

        <div className="mt-4 text-center">
          <button
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors font-medium btn-smooth"
          >
            Continuar no navegador
          </button>
        </div>

      </div>
    </div>
  );
};


// ==========================================
// Arquivo: js\components\MassBillingModal.js
// ==========================================
/**
 * Modal VIP: Cobrança Automática em Massa no WhatsApp
 * Lista todos os clientes inadimplentes e permite envio sequencial ágil.
 */

window.MassBillingModal = function MassBillingModal({ isOpen, onClose, clients, shopSettings }) {
  const [sentCount, setSentCount] = React.useState(0);
  const { X, Sparkles, AlertTriangle, Send, CheckCircle2, MessageCircle } = window.Icons || {};

  // Controle de histórico
  window.useModalHistory(isOpen, onClose, 'MassBillingModal');

  React.useEffect(() => {
    if (isOpen) {
      setSentCount(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const overdueClients = clients.filter(c => window.AppState && window.AppState.getClientStatus(c) === 'atrasado');

  const handleSendToClient = (client) => {
    let cleanPhone = (client.phone || '').replace(/\D/g, '');
    if (!cleanPhone) {
      alert(`O cliente ${client.name} não possui um telefone válido cadastrado.`);
      return;
    }
    if (!cleanPhone.startsWith('55') && cleanPhone.length >= 10) {
      cleanPhone = '55' + cleanPhone;
    }

    const debt = window.AppState ? window.AppState.computeBalance(client) : 0;
    const formattedDebt = `R$ ${debt.toFixed(2).replace('.', ',')}`;
    const shopName = shopSettings?.shopName || 'nosso estabelecimento';
    
    let message = `Olá, ${client.name}.\n\nConsta um saldo em aberto de *${formattedDebt}* na *${shopName}*.\n\nSolicitamos a gentileza de regularizarmos essa pendência para manter seu cadastro sempre em dia.`;
    
    if (shopSettings?.pixKey) {
      message += `\n\nChave PIX: *${shopSettings.pixKey}*`;
    }

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    
    setSentCount(prev => prev + 1);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/80 animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-pop-in transition-colors">
        
        {/* Topo VIP */}
        <div className="p-4 bg-gradient-to-r from-amber-500/10 via-white to-amber-500/10 dark:from-amber-950/60 dark:via-slate-900 dark:to-amber-950/50 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-md">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                Recuperador VIP <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] uppercase ml-1">Automático</span>
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Cobrança em Massa no WhatsApp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors btn-smooth"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex gap-3">
            <div className="mt-0.5">
              <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <strong className="block text-xs text-amber-800 dark:text-amber-300">Como funciona?</strong>
              <span className="text-[11px] text-amber-700 dark:text-amber-400/80 leading-snug block mt-0.5">
                Clique no botão "Cobrar" ao lado de cada cliente. O seu WhatsApp será aberto automaticamente já com a mensagem e os valores preenchidos. Volte ao app para cobrar o próximo.
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {overdueClients.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
                <strong className="block text-slate-900 dark:text-white text-sm">Nenhuma dívida atrasada!</strong>
                <span className="text-xs text-slate-500">Todos os seus clientes estão em dia.</span>
              </div>
            ) : (
              overdueClients.map(client => {
                const debt = window.AppState.computeBalance(client);
                return (
                  <div key={client.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 transition-colors">
                    <div className="min-w-0 flex-1">
                      <strong className="block text-xs font-bold text-slate-900 dark:text-white truncate">{client.name}</strong>
                      <span className="text-[11px] font-mono text-rose-600 dark:text-rose-400 font-bold block">
                        R$ {debt.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => handleSendToClient(client)}
                      className="ml-3 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all btn-smooth"
                    >
                      <MessageCircle size={14} /> Cobrar
                    </button>
                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>
    </div>
  );
};


// ==========================================
// Arquivo: js\components\BackupModal.js
// ==========================================
/**
 * Modal de Backup Seguro e Sincronização
 * Permite exportar (copiar código, compartilhar no WhatsApp, baixar arquivo .txt)
 * e restaurar dados facilmente no celular ou computador sem depender de seletor de arquivos.
 */

window.BackupModal = function BackupModal({ isOpen, onClose, isVip, onTriggerPaywall }) {
  const [activeTab, setActiveTab] = React.useState('export'); // 'export' | 'restore'
  const [copiedCode, setCopiedCode] = React.useState(false);
  const [showRawCode, setShowRawCode] = React.useState(false);
  const [pastedJson, setPastedJson] = React.useState('');
  const [confirmRestoreData, setConfirmRestoreData] = React.useState(null);
  const [feedbackDialog, setFeedbackDialog] = React.useState({ isOpen: false, title: '', message: '', variant: 'info', onConfirm: null });

  const fileInputRef = React.useRef(null);
  const { X, Cloud, Download, Upload, ShieldCheck, Lock, Copy, Check, Share2, FileText, CheckCircle2, AlertTriangle } = window.Icons || {};

  window.useModalHistory(isOpen, onClose, 'backupMainModal');
  window.useModalHistory(feedbackDialog.isOpen, () => setFeedbackDialog(prev => ({ ...prev, isOpen: false })), 'backupFeedback');
  window.useModalHistory(!!confirmRestoreData, () => setConfirmRestoreData(null), 'backupConfirmRestore');

  if (!isOpen) return null;

  // Utilitário robusto para copiar texto no navegador e WebView Android
  const copyToClipboard = async (text) => {
    let success = false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        success = true;
      } catch (e) {
        console.warn('Clipboard API error, trying execCommand fallback:', e);
      }
    }
    if (!success) {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, 99999);
        success = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch (e) {
        console.error('execCommand copy failed:', e);
      }
    }
    return success;
  };

  // 1. Copiar Código de Backup para a Área de Transferência
  const handleCopyBackupCode = async () => {
    if (!isVip) {
      onTriggerPaywall('backup');
      return;
    }
    const code = window.AppState.getBackupJsonString();
    await copyToClipboard(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 4000);

    setFeedbackDialog({
      isOpen: true,
      title: 'Código Copiado com Sucesso!',
      message: 'O código de backup de todos os seus dados foi copiado para a memória do seu celular!\n\n' +
               '1. Abra o WhatsApp e cole em uma conversa com você mesmo (ou salve no bloco de notas).\n' +
               '2. No novo celular, abra este aplicativo, vá na aba "Restaurar" e cole o código.',
      variant: 'success'
    });
  };

  // 2. Compartilhar Código como Mensagem de Texto no WhatsApp
  const handleShareWhatsApp = async () => {
    if (!isVip) {
      onTriggerPaywall('backup');
      return;
    }
    const code = window.AppState.getBackupJsonString();
    await copyToClipboard(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 4000);

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Backup CadernoFiado',
          text: code
        });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    setFeedbackDialog({
      isOpen: true,
      title: 'Código Copiado!',
      message: 'O código do backup foi copiado para a sua área de transferência!\n\nAbra o WhatsApp na conversa desejada, segure o dedo na caixa de mensagem e toque em "Colar".',
      variant: 'success'
    });
  };

  // 3. Exportar como Arquivo de Texto (.txt)
  const handleExportFile = async () => {
    if (!isVip) {
      onTriggerPaywall('backup');
      return;
    }
    try {
      const res = await window.AppState.exportBackup();
      if (!res || !res.success) {
        setFeedbackDialog({
          isOpen: true,
          title: 'Aviso',
          message: 'Não foi possível gerar o arquivo direto. Utilize a opção "Copiar Código de Backup".',
          variant: 'warning'
        });
        return;
      }

      setFeedbackDialog({
        isOpen: true,
        title: 'Arquivo de Backup Gerado!',
        message: `Arquivo "${res.filename}" gerado com sucesso!\n\n` +
                 `Como este é um arquivo de texto (.txt), você pode abri-lo facilmente no celular, Google Drive ou WhatsApp para copiar o código quando precisar.`,
        variant: 'success'
      });
    } catch (err) {
      setFeedbackDialog({ isOpen: true, title: 'Erro ao Exportar', message: err.message, variant: 'danger' });
    }
  };

  // 4. Colar da Área de Transferência
  const handlePasteFromClipboard = async () => {
    let pasted = false;
    if (navigator.clipboard && navigator.clipboard.readText) {
      try {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setPastedJson(text.trim());
          pasted = true;
        }
      } catch (err) {
        console.warn('readText clipboard blocked:', err);
      }
    }
    if (!pasted) {
      setFeedbackDialog({
        isOpen: true,
        title: 'Como Colar no Celular',
        message: 'Para colar no seu aparelho:\n\n1. Pressione e segure o dedo dentro da caixa de texto abaixo.\n2. Toque no botão "Colar" que aparecerá.',
        variant: 'info'
      });
    }
  };

  // 5. Validar e Solicitar Confirmação de Restauração
  const handlePromptRestore = () => {
    if (!pastedJson.trim()) {
      setFeedbackDialog({
        isOpen: true,
        title: 'Código Ausente',
        message: 'Por favor, cole o código do backup no campo de texto antes de prosseguir.',
        variant: 'warning'
      });
      return;
    }

    const validation = window.AppState.validateBackup(pastedJson);
    if (!validation.valid) {
      setFeedbackDialog({
        isOpen: true,
        title: 'Código Inválido',
        message: 'O código informado não é um backup válido do CadernoFiado:\n\n' + validation.error,
        variant: 'danger'
      });
      return;
    }

    setConfirmRestoreData(validation);
  };

  // 6. Confirmar e Aplicar a Restauração
  const handleConfirmRestore = () => {
    if (!confirmRestoreData || !confirmRestoreData.data) return;

    const res = window.AppState.restoreBackupData(confirmRestoreData.data);
    if (res && res.success) {
      const summary = confirmRestoreData.summary;
      setConfirmRestoreData(null);
      setFeedbackDialog({
        isOpen: true,
        title: 'Backup Restaurado com Sucesso!',
        message: `• ${summary.clientsCount} Clientes restaurados\n` +
                 `• ${summary.salesCount} Vendas recuperadas\n` +
                 `• Dívida total: R$ ${(summary.totalDebtCents / 100).toFixed(2)}\n\n` +
                 `Toque em OK para atualizar os dados no aplicativo.`,
        variant: 'success',
        onConfirm: () => window.location.reload()
      });
    } else {
      setFeedbackDialog({
        isOpen: true,
        title: 'Falha na Restauração',
        message: 'Falha ao gravar os dados: ' + (res?.error || 'Erro desconhecido.'),
        variant: 'danger'
      });
    }
  };

  // 7. Seleção de Arquivo (para Desktop / Computador)
  const handleFileSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        if (!content || !content.trim()) {
          setFeedbackDialog({ isOpen: true, title: 'Arquivo Vazio', message: 'O arquivo selecionado está vazio.', variant: 'warning' });
          return;
        }
        setPastedJson(content.trim());
        const validation = window.AppState.validateBackup(content);
        if (!validation.valid) {
          setFeedbackDialog({
            isOpen: true,
            title: 'Arquivo Inválido',
            message: 'O arquivo selecionado não contém um backup válido:\n\n' + validation.error,
            variant: 'danger'
          });
          return;
        }
        setConfirmRestoreData(validation);
      };
      reader.onerror = () => {
        setFeedbackDialog({ isOpen: true, title: 'Erro de Leitura', message: 'Não foi possível ler o arquivo selecionado.', variant: 'danger' });
      };
      reader.readAsText(file);
    } catch (err) {
      setFeedbackDialog({ isOpen: true, title: 'Erro', message: err.message, variant: 'danger' });
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-pop-in transition-colors">
        
        {/* Cabeçalho Premium */}
        <div className="p-4 sm:p-5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-start justify-between relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none"></div>
          
          <div className="flex items-center space-x-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-inner">
              <Cloud size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                Backup & Sincronização
                {!isVip && activeTab === 'export' && <Lock size={12} className="text-white/70" />}
              </h3>
              <p className="text-[11px] text-emerald-100 mt-0.5">Google Drive, WhatsApp & Celular</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-full text-white/70 hover:bg-white/20 hover:text-white transition-colors relative z-10">
            <X size={18} />
          </button>
        </div>

        {/* Segmented Control de Abas: Exportar vs Restaurar */}
        <div className="px-4 pt-3 pb-1 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div className="flex bg-slate-200/70 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('export')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'export'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Download size={14} />
              <span>1. Salvar Dados</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('restore')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'restore'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Upload size={14} />
              <span>2. Restaurar</span>
            </button>
          </div>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 hide-scrollbar">
          
          {/* ================= ABA 1: EXPORTAR / SALVAR ================= */}
          {activeTab === 'export' && (
            <div className="space-y-3.5 animate-fadeIn">
              
              <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/40 text-xs text-slate-700 dark:text-slate-300">
                <p className="leading-relaxed">
                  Gere uma cópia segura dos seus clientes e dívidas para guardar no <strong>WhatsApp</strong> ou transferir para um celular novo.
                </p>
              </div>

              {/* Botão Destaque Principal: Copiar Código (Zero Dependência de Arquivos) */}
              <button
                type="button"
                onClick={handleCopyBackupCode}
                className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {copiedCode ? <Check size={18} className="text-emerald-200" /> : <Copy size={18} />}
                <span>{copiedCode ? '✅ Código Copiado com Sucesso!' : 'Copiar Código do Backup'}</span>
              </button>
              <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 -mt-1 leading-tight">
                Recomendado para celular: copie e cole em uma mensagem do WhatsApp para guardar com segurança.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {/* Botão Compartilhar WhatsApp */}
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700"
                >
                  <Share2 size={15} className="text-emerald-600 dark:text-emerald-400" />
                  <span>WhatsApp</span>
                </button>

                {/* Botão Baixar Arquivo .txt */}
                <button
                  type="button"
                  onClick={handleExportFile}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700"
                >
                  <FileText size={15} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Arquivo .txt</span>
                </button>
              </div>

              {/* Opção de Visualizar Código Diretamente na Tela */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRawCode(!showRawCode)}
                  className="w-full text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline py-1"
                >
                  {showRawCode ? '▲ Ocultar código na tela' : '▼ Ver código de backup na tela'}
                </button>

                {showRawCode && (
                  <div className="mt-2 space-y-2 animate-fadeIn">
                    <textarea
                      readOnly
                      value={window.AppState.getBackupJsonString()}
                      rows={4}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-300 select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopyBackupCode}
                      className="w-full py-2 rounded-xl bg-slate-800 dark:bg-slate-700 text-white text-xs font-bold hover:bg-slate-700 transition-colors"
                    >
                      Copiar Todo o Código
                    </button>
                  </div>
                )}
              </div>

              {!isVip && (
                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl text-xs text-amber-800 dark:text-amber-300 text-center space-y-1">
                  <p className="font-semibold flex items-center justify-center gap-1.5">
                    <ShieldCheck size={14} /> Recurso Exclusivo VIP
                  </p>
                  <p className="text-[11px] opacity-90">
                    O backup garante que você nunca perca o controle dos seus clientes e fiados.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ================= ABA 2: RESTAURAR / RECUPERAR ================= */}
          {activeTab === 'restore' && (
            <div className="space-y-3.5 animate-fadeIn">
              
              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Cole o código de backup gerado no seu celular antigo para restaurar seus clientes, fiados e plano VIP.
              </div>

              {/* Botões de Apoio para Colar */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="py-1.5 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                >
                  <Copy size={13} />
                  <span>Colar da Área de Transferência</span>
                </button>

                {pastedJson && (
                  <button
                    type="button"
                    onClick={() => setPastedJson('')}
                    className="text-[11px] text-rose-500 hover:underline font-medium"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {/* Caixa de Texto Principal */}
              <div>
                <textarea
                  value={pastedJson}
                  onChange={e => setPastedJson(e.target.value)}
                  placeholder="Pressione e segure aqui para colar o código de backup..."
                  rows={5}
                  className="w-full p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Botão de Ação: Restaurar Dados */}
              <button
                type="button"
                onClick={handlePromptRestore}
                className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Upload size={18} />
                <span>Restaurar Dados Agora</span>
              </button>

              {/* Seção Secundária: Para Usuários no Computador */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="text-center">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-2">
                    Ou selecione um arquivo se estiver no computador:
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <FileText size={14} />
                    <span>Selecionar arquivo .txt ou .json</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.json,text/plain,application/json"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    (No celular, utilize o campo de colar código acima)
                  </p>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* Confirmação de Substituição de Dados pelo Backup */}
      <window.ConfirmModal
        isOpen={!!confirmRestoreData}
        title="Restaurar Este Backup?"
        message={confirmRestoreData ? (
          `Os dados contidos no backup serão aplicados neste aparelho:\n\n` +
          `• ${confirmRestoreData.summary?.clientsCount || 0} Clientes cadastrados\n` +
          `• ${confirmRestoreData.summary?.salesCount || 0} Vendas / parcelas\n` +
          `• R$ ${((confirmRestoreData.summary?.totalDebtCents || 0) / 100).toFixed(2)} em dívidas registradas\n\n` +
          `Deseja realmente substituir os dados atuais por este backup?`
        ) : ''}
        confirmText="Sim, Restaurar Dados"
        cancelText="Cancelar"
        variant="warning"
        onConfirm={handleConfirmRestore}
        onCancel={() => setConfirmRestoreData(null)}
      />

      {/* Modal de Feedback Integrado */}
      <window.ConfirmModal
        isOpen={feedbackDialog.isOpen}
        title={feedbackDialog.title}
        message={feedbackDialog.message}
        confirmText="OK"
        variant={feedbackDialog.variant}
        showCancel={false}
        onConfirm={() => {
          const cb = feedbackDialog.onConfirm;
          setFeedbackDialog(prev => ({ ...prev, isOpen: false }));
          if (typeof cb === 'function') {
            cb();
          }
        }}
      />
    </div>
  );
};


// ==========================================
// Arquivo: js\components\SignatureModal.js
// ==========================================
/**
 * Modal de Assinatura Digital (Formalizar Acordo Anticalote)
 * Recurso VIP. Captura assinatura do cliente via Canvas HTML5.
 */

window.SignatureModal = function SignatureModal({ isOpen, onClose, onConfirmSignature }) {
  const canvasRef = React.useRef(null);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [hasSignature, setHasSignature] = React.useState(false);
  
  const { X, PenTool, Trash2, CheckCircle2 } = window.Icons || {};

  React.useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      // Ajusta para densidade de pixels do celular
      const rect = canvas.getBoundingClientRect();
      const scale = window.devicePixelRatio || 1;
      canvas.width = rect.width * scale;
      canvas.height = rect.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#0f172a'; // slate-900
      
      // Fundo transparente (ou branco)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rect.width, rect.height);
      setHasSignature(false);
    }
  }, [isOpen]);


  if (!isOpen) return null;

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = (e) => {
    e.preventDefault();
    if (isDrawing) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.closePath();
      setIsDrawing(false);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    const scale = window.devicePixelRatio || 1;
    ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale);
    setHasSignature(false);
  };

  const handleConfirm = () => {
    if (!hasSignature) return;
    const canvas = canvasRef.current;
    const signatureData = canvas.toDataURL('image/png');
    onConfirmSignature(signatureData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 animate-fadeIn" style={{ touchAction: 'none' }}>
      <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-pop-in transition-colors">
        
        {/* Cabeçalho Premium */}
        <div className="p-5 bg-gradient-to-br from-slate-800 to-slate-950 text-white flex items-start justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          
          <div className="flex items-center space-x-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm shadow-inner">
              <PenTool size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                Assinatura do Cliente
              </h3>
              <p className="text-[11px] text-slate-300 mt-0.5">Formalizar Acordo de Confissão</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-full text-white/70 hover:bg-white/20 hover:text-white transition-colors relative z-10">
            <X size={18} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-5 flex-1 flex flex-col">
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed text-center mb-3">
            Peça para o cliente assinar no quadro abaixo com o dedo.
          </p>

          <div className="flex-1 relative bg-white border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full h-48 touch-none cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {!hasSignature && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <span className="text-slate-300 font-medium text-lg rotate-[-10deg]">Assine aqui</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={clearCanvas}
              className="py-3 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center btn-smooth flex-1"
            >
              <Trash2 size={16} className="mr-1.5" /> Limpar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!hasSignature}
              className={`py-3 px-4 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center flex-[2] btn-smooth ${
                hasSignature 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 size={18} className="mr-1.5" />
              <span>Confirmar & Gerar PDF</span>
            </button>
          </div>
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


