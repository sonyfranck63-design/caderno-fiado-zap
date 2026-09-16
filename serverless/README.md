# Guia de Implantação — API Serverless de Licenças (Cloudflare Workers)

Este worker permite validar licenças online e emitir tokens assinados criptograficamente. O plano gratuito da Cloudflare inclui **100.000 requisições por dia**, mais do que suficiente para centenas de milhares de clientes ativos.

---

## Passo a Passo para Deploy Gratuito (Menos de 3 minutos)

1. Crie uma conta gratuita em [cloudflare.com](https://dash.cloudflare.com/) (se ainda não tiver).
2. No menu lateral, acesse **Workers & Pages** -> **Create application** -> **Create Worker**.
3. Dê um nome ao seu worker (ex: `cadernofiado-license-api`) e clique em **Deploy**.
4. Clique em **Quick edit** (Editar código).
5. Copie todo o conteúdo do arquivo `license-worker.js` e cole no editor do Cloudflare.
6. Clique em **Save and Deploy**.
7. Pronto! O Cloudflare fornecerá uma URL pública, por exemplo:
   `https://cadernofiado-license-api.seu-usuario.workers.dev`

---

## Como configurar Variáveis Seguras no Cloudflare (Recomendado)

No painel do Worker em **Settings** -> **Variables and Secrets**:
- Adicione a variável `ADMIN_SECRET`: com uma senha forte que só você sabe (para gerar licenças via API).
- Adicione a variável `PRIVATE_KEY_JWK`: com o JSON da sua chave privada (para não manter no código).

---

## Modo 100% Offline (Sem Servidor)
Caso você **não** queira usar nenhum servidor no momento, o CadernoFiado já suporta 100% o modo offline:
- Basta abrir o arquivo `tools/admin.html` no seu próprio navegador no computador.
- Digitar o ID do celular do cliente e clicar em gerar.
- Enviar o código gerado no WhatsApp do cliente.
- O cliente cola no app e o app valida a assinatura digital localmente, sem precisar de internet!
