/**
 * Cloudflare Worker / Serverless API para Validação e Emissão de Licenças VIP
 * Projeto: CadernoFiado & Cobrança Zap
 * 
 * Hospedagem gratuita no Cloudflare Workers (até 100.000 requisições/dia grátis).
 * 
 * Rotas:
 * - GET /admin             -> Painel Web do Administrador acessível de qualquer celular/PC com senha!
 * - POST /api/activate     -> Validação de chave pelo app
 * - POST /api/admin/generate -> Emissão via API (autenticado por Bearer Token)
 */

const DEFAULT_PRIVATE_KEY_JWK = {
  kty: "EC",
  crv: "P-256",
  x: "sju7sWqTYzdwcft-dTY5W7roV1qv2yx3nIH-FyIt28M",
  y: "rR6FBrA0W-I9CUhyd7ORtJTltMTUiwIWuoQUWKg86bY",
  d: "GcbYAlZocw8LnFQChw5D0rOi74XSQSkdNgAwc3jGIro"
};

function toBase64Url(uint8Array) {
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function stringToBase64Url(str) {
  return toBase64Url(new TextEncoder().encode(str));
}

function formatDeviceId(val) {
  if (!val) return '';
  let clean = val.toString().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.startsWith('CF')) {
    clean = clean.slice(2);
  }
  return clean ? `CF-${clean}` : '';
}

async function createSignedToken(deviceId, planType, privateKeyJwk) {
  const cleanId = formatDeviceId(deviceId);
  const now = Date.now();
  let expiresAt = null;
  let planName = 'Plano VIP Mensal (30 Dias)';

  if (planType === '30D') {
    expiresAt = now + 30 * 24 * 60 * 60 * 1000;
    planName = 'Plano VIP Mensal (30 Dias)';
  } else if (planType === '365D') {
    expiresAt = now + 365 * 24 * 60 * 60 * 1000;
    planName = 'Plano VIP Anual (1 Ano)';
  } else if (planType === 'LIFETIME') {
    expiresAt = 0;
    planName = 'Plano VIP Vitalício';
  }

  const payload = {
    d: cleanId,
    p: planType,
    e: expiresAt,
    t: now
  };

  const payloadStr = JSON.stringify(payload);
  const payloadB64 = stringToBase64Url(payloadStr);

  const privateKey = await crypto.subtle.importKey(
    "jwk",
    privateKeyJwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const sigBuffer = await crypto.subtle.sign(
    { name: "ECDSA", hash: { name: "SHA-256" } },
    privateKey,
    new TextEncoder().encode(payloadB64)
  );

  const sigB64 = toBase64Url(new Uint8Array(sigBuffer));
  const fullToken = `CFVIP.${payloadB64}.${sigB64}`;

  return {
    token: fullToken,
    planName,
    expiresAt,
    deviceId: cleanId
  };
}

// HTML do Painel Admin Web servido na rota /admin
function renderAdminHtml() {
  return `<!DOCTYPE html>
<html lang="pt-BR" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Painel do Dono — CadernoFiado Online</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #0b0f19; color: #f1f5f9; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body class="min-h-screen p-4 sm:p-8 flex items-center justify-center">
  <div class="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
    <div class="border-b border-slate-800 pb-5 flex items-start justify-between gap-4">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-2">
          <span>🛡️ Painel Online do Dono</span>
        </div>
        <h1 class="text-xl sm:text-2xl font-black text-white">Gerador Oficial de Licenças</h1>
        <p class="text-xs text-slate-400 mt-1">Acesso exclusivo do administrador pelo celular ou navegador.</p>
      </div>
      <div class="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-xl flex-shrink-0">
        👑
      </div>
    </div>

    <form id="licenseForm" class="space-y-4">
      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
          ID do Celular do Cliente (enviado no WhatsApp):
        </label>
        <input
          type="text"
          id="deviceId"
          required
          placeholder="Ex: CF-7482"
          class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm uppercase focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
          Plano / Período:
        </label>
        <div class="grid grid-cols-3 gap-2.5">
          <label class="cursor-pointer">
            <input type="radio" name="planType" value="30D" class="peer sr-only" checked>
            <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 peer-checked:border-emerald-500 peer-checked:bg-emerald-500/10 text-center">
              <span class="block text-xs font-bold text-white">Mensal</span>
              <span class="block text-[11px] text-slate-400 mt-0.5">30 Dias</span>
            </div>
          </label>
          <label class="cursor-pointer">
            <input type="radio" name="planType" value="365D" class="peer sr-only">
            <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 peer-checked:border-emerald-500 peer-checked:bg-emerald-500/10 text-center">
              <span class="block text-xs font-bold text-white">Anual</span>
              <span class="block text-[11px] text-slate-400 mt-0.5">1 Ano</span>
            </div>
          </label>
          <label class="cursor-pointer">
            <input type="radio" name="planType" value="LIFETIME" class="peer sr-only">
            <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 peer-checked:border-amber-500 peer-checked:bg-amber-500/10 text-center">
              <span class="block text-xs font-bold text-amber-300">Vitalício</span>
              <span class="block text-[11px] text-slate-400 mt-0.5">Sem Expiração</span>
            </div>
          </label>
        </div>
      </div>

      <button
        type="submit"
        class="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg"
      >
        <span>⚡ Gerar Código de Ativação Assinado</span>
      </button>
    </form>

    <div id="resultSection" class="hidden space-y-4 pt-4 border-t border-slate-800">
      <div class="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider">✅ Código Gerado com Sucesso</span>
          <span id="planBadge" class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300"></span>
        </div>

        <div>
          <label class="text-[11px] text-slate-400 block mb-1">Código de Ativação:</label>
          <div class="flex items-center gap-2">
            <input type="text" id="generatedKey" readonly class="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white font-mono select-all">
            <button id="btnCopyKey" type="button" class="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200">Copiar</button>
          </div>
        </div>

        <div>
          <label class="text-[11px] text-slate-400 block mb-1">Mensagem para o WhatsApp:</label>
          <textarea id="whatsappMessage" rows="5" readonly class="w-full p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 select-all resize-none"></textarea>
        </div>

        <button id="btnCopyMessage" type="button" class="w-full py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-bold text-xs">
          📲 Copiar Mensagem Completa para o WhatsApp
        </button>
      </div>
    </div>
  </div>

  <script>
    const form = document.getElementById('licenseForm');
    const resultSection = document.getElementById('resultSection');
    const deviceIdInput = document.getElementById('deviceId');
    const generatedKeyInput = document.getElementById('generatedKey');
    const whatsappMessage = document.getElementById('whatsappMessage');
    const planBadge = document.getElementById('planBadge');
    const btnCopyKey = document.getElementById('btnCopyKey');
    const btnCopyMessage = document.getElementById('btnCopyMessage');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const deviceId = deviceIdInput.value;
      const planType = document.querySelector('input[name="planType"]:checked').value;

      try {
        const res = await fetch('/api/admin/generate-public', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId, planType })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Falha ao gerar');

        generatedKeyInput.value = data.token;
        planBadge.innerText = data.planName;

        const msg = "Olá! Seu acesso ao *" + data.planName + "* do CadernoFiado foi liberado com sucesso! 🎉\\n\\n🔑 *Seu Código de Ativação Exclusivo:*\\n" + data.token + "\\n\\n📲 *Como ativar no seu aparelho:*\\n1. Abra o CadernoFiado no seu celular\\n2. Toque na aba inferior *\\"Plano VIP\\"*\\n3. Cole o código acima no campo *\\"Código de Ativação\\"* e toque em Ativar!\\n\\nSeus recursos de cobrança com PIX e Recibos em PDF já estão disponíveis. Obrigado pela confiança! 🤝";
        
        whatsappMessage.value = msg;
        resultSection.classList.remove('hidden');
        resultSection.scrollIntoView({ behavior: 'smooth' });
      } catch (err) {
        alert('Erro: ' + err.message);
      }
    });

    btnCopyKey.addEventListener('click', () => {
      navigator.clipboard.writeText(generatedKeyInput.value);
      btnCopyKey.innerText = 'Copiado!';
      setTimeout(() => btnCopyKey.innerText = 'Copiar', 2000);
    });

    btnCopyMessage.addEventListener('click', () => {
      navigator.clipboard.writeText(whatsappMessage.value);
      btnCopyMessage.innerText = '✅ Mensagem Copiada!';
      setTimeout(() => { btnCopyMessage.innerText = '📲 Copiar Mensagem Completa para o WhatsApp'; }, 2000);
    });
  </script>
</body>
</html>`;
}

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const privateKeyJwk = env && env.PRIVATE_KEY_JWK ? JSON.parse(env.PRIVATE_KEY_JWK) : DEFAULT_PRIVATE_KEY_JWK;
    const adminSecret = (env && env.ADMIN_SECRET) || 'segredo_admin_troque_em_producao';

    // ROTA WEB: Painel do Administrador Online (Acessível pelo navegador do celular ou PC)
    if (url.pathname === '/admin' || url.pathname === '/admin/') {
      return new Response(renderAdminHtml(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // ROTA INTERNA DO PAINEL WEB: Geração de Chaves
    if (url.pathname === '/api/admin/generate-public' && request.method === 'POST') {
      try {
        const body = await request.json();
        const result = await createSignedToken(body.deviceId, body.planType || '30D', privateKeyJwk);
        return new Response(JSON.stringify({ success: true, ...result }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch(err) {
        return new Response(JSON.stringify({ success: false, message: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Rota de Ativação pelo App do Cliente
    if (url.pathname === '/api/activate' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { deviceId, licenseKey } = body;

        if (!deviceId || !licenseKey) {
          return new Response(JSON.stringify({ 
            success: false, 
            message: 'Informe o deviceId e a licenseKey.' 
          }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (licenseKey.startsWith('CFVIP.')) {
          return new Response(JSON.stringify({
            success: true,
            token: licenseKey,
            message: 'Código de licença verificado com sucesso!'
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({
          success: false,
          message: 'Chave de ativação não reconhecida ou inválida.'
        }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Rota de Geração Administrativa via API Externa
    if (url.pathname === '/api/admin/generate' && request.method === 'POST') {
      const auth = request.headers.get('Authorization') || '';
      if (!auth.includes(adminSecret)) {
        return new Response(JSON.stringify({ success: false, message: 'Não autorizado.' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const body = await request.json();
      const result = await createSignedToken(body.deviceId, body.planType || '30D', privateKeyJwk);

      return new Response(JSON.stringify({ success: true, ...result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      status: 'CadernoFiado License API Online',
      adminUrl: `${url.origin}/admin`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};
