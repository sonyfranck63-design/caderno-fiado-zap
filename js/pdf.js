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
