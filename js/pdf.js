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

      const cleanClientName = (client.name || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Recibo_Fiado_${cleanClientName}_${new Date().toISOString().split('T')[0]}.pdf`;
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);

      return {
        success: true,
        blob: pdfBlob,
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
   * Verifica se o navegador/dispositivo atual realmente suporta compartilhamento de arquivos PDF
   */
  function canSharePdf(blob) {
    if (typeof navigator === 'undefined' || !navigator.canShare || typeof File === 'undefined') {
      return false;
    }
    try {
      const file = (blob instanceof File)
        ? blob
        : new File([blob || ''], 'recibo_teste.pdf', { type: 'application/pdf' });
      return !!navigator.canShare({ files: [file] });
    } catch (e) {
      return false;
    }
  }

  /**
   * Baixa diretamente o arquivo PDF com segurança
   * Suporta ponte JS nativa Android (saveBase64File), fallback Web e detecção de WebView
   */
  async function downloadPdf(blob, filename) {
    const safeFilename = filename || 'recibo-fiado.pdf';
    try {
      // 1. Detecção de ponte JS nativa no Android WebView (ex: window.AndroidBridge ou window.androidAppProxy)
      const bridge = (typeof window.AndroidBridge !== 'undefined' && typeof window.AndroidBridge.saveBase64File === 'function')
        ? window.AndroidBridge
        : (typeof window.androidAppProxy !== 'undefined' && typeof window.androidAppProxy.saveBase64File === 'function')
        ? window.androidAppProxy
        : null;

      if (bridge) {
        const base64Data = await blobToBase64(blob);
        bridge.saveBase64File(base64Data, safeFilename, 'application/pdf');
        return {
          success: true,
          method: 'native_bridge',
          message: `Arquivo "${safeFilename}" salvo na pasta Downloads do seu aparelho.`
        };
      }

      // 2. Detecção de WebView Android sem ponte e sem suporte nativo a download
      const isAndroidWebView = /android/i.test(navigator.userAgent || '') && 
        (typeof window.androidAppProxy !== 'undefined' || /; wv\)/.test(navigator.userAgent || '') || !window.chrome);

      // 3. Fallback para navegador web tradicional ou desktop via <a download>
      const url = typeof blob === 'string' ? blob : URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = safeFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (typeof blob !== 'string') {
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }

      if (isAndroidWebView) {
        return {
          success: false,
          method: 'webview_no_bridge',
          error: 'O download direto neste aplicativo requer suporte nativo do WebView. Utilize a opção "Enviar Arquivo PDF" ou visualize na tela.'
        };
      }

      return {
        success: true,
        method: 'browser_download',
        message: `Download do arquivo "${safeFilename}" iniciado.`
      };
    } catch(err) {
      console.error('Falha no download direto do PDF:', err);
      return { success: false, error: err.message || 'Erro ao realizar download do arquivo.' };
    }
  }

  /**
   * Compartilha o arquivo PDF através da Web Share API nativa a partir de um gesto direto
   */
  async function sharePdfFile(blob, filename, title, text) {
    if (typeof File === 'undefined' || !navigator.canShare) {
      return { success: false, reason: 'unsupported' };
    }
    try {
      const file = new File([blob], filename || 'recibo-fiado.pdf', { type: 'application/pdf' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: title || 'Recibo Fiado',
          text: text || 'Recibo de compras e fiado emitido pelo CadernoFiado.'
        });
        return { success: true };
      }
      return { success: false, reason: 'cannot_share_files' };
    } catch(err) {
      if (err.name === 'AbortError') return { success: true, cancelled: true };
      return { success: false, error: err.message };
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
