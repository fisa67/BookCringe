# Ativação do Resend — Crew Literário

Guia operacional para colocar em produção o fluxo completo de e-mail do
"Crew Literário": confirmação (double opt-in), boas-vindas e campanhas
(newsletters). Também é usado pelo formulário de contato (`/contato`), que
já reaproveita a mesma configuração.

Este documento é sobre **configuração e operação** (variáveis, domínio,
DNS, testes). Para entender a lógica de código de cada e-mail, ver:

- `src/lib/services/confirmationEmailService.ts` — e-mail de confirmação
- `src/lib/services/welcomeEmailService.ts` — e-mail de boas-vindas
- `src/lib/services/campaignEmailService.ts` — newsletters (campanhas)
- `src/lib/email/send-form-email.ts` — formulário de contato (`/contato`)

---

## 1. Variáveis de ambiente

| Variável | Obrigatória? | Onde é usada | Descrição |
|---|---|---|---|
| `RESEND_API_KEY` | Sim | `src/lib/email/resend.ts` (`getResendClient`) | Chave de API do Resend. Uma por ambiente (produção e dev/preview costumam usar chaves diferentes no painel do Resend). |
| `CONTACT_EMAIL` | Sim | `src/lib/env.ts` (`getFromEmail`) | E-mail que **envia e recebe**: é o remetente de todo e-mail transacional (confirmação, boas-vindas, campanhas, contato) e também o destino do e-mail de teste de campanha (`sendCampaignTest`). Precisa ser um endereço do domínio verificado no Resend (ver seção 3). |
| `SITE_URL` | Não (tem padrão) | `src/lib/constants.ts` | Base para os links absolutos nos e-mails (link de confirmação, "Ver Curadoria", "Ver Recomendação do mês") e para SEO (sitemap, robots, canonical). Sem essa variável, usa `https://bookcringe.com.br`. **Defina como `http://localhost:3000` em dev** — sem isso, o e-mail de confirmação gerado localmente linka para o site em produção. |
| `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` | Sim | Base de assinantes/campanhas | Ver `docs/cms.md` — sem Supabase, não há inscritos nem campanhas para enviar. |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Leitura/escrita de `newsletter_subscribers`/`newsletter_campaigns` | Ver `docs/cms.md`. |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` / `AUTH_SECRET` / `ADMIN_GITHUB_LOGIN` | Sim, para usar o admin | Login de `/admin/newsletters` (onde a campanha é criada e disparada) | Ver `docs/cms.md`. |

Não existe (e não é preciso criar) uma variável separada para o endereço de
remetente — ver seção 4.

> **Nota:** o `.env.example` tinha uma variável `RESEND_FROM_EMAIL` que
> nunca foi lida por nenhum código (remanescente de um rascunho anterior).
> Foi removida do `.env.example` para não confundir — o remetente é sempre
> montado a partir de `CONTACT_EMAIL` (seção 4).

---

## 2. Onde configurar

### Ambiente local

```bash
cp .env.example .env.local   # se ainda não tiver um
```

Preencha `RESEND_API_KEY` e `CONTACT_EMAIL` no `.env.local` (já tem
`SITE_URL=http://localhost:3000` configurado). Em dev, o Resend permite
enviar para o seu próprio e-mail (o mesmo da conta) mesmo sem domínio
verificado — dá para testar o fluxo de confirmação/boas-vindas antes de
verificar o domínio de produção.

`.env.local` nunca é commitado (está no `.gitignore`).

### Vercel

**Project Settings → Environment Variables**, uma entrada por variável,
marcando os ambientes certos:

| Variável | Production | Preview | Development |
|---|---|---|---|
| `RESEND_API_KEY` | chave de produção | chave de teste (opcional) | — (usa `.env.local`) |
| `CONTACT_EMAIL` | `contato@bookcringe.com.br` | idem ou um e-mail de teste | — |
| `SITE_URL` | deixe **vazio** (usa o padrão do código) | `https://$VERCEL_URL` ou vazio | — |
| Supabase / Auth | mesmas de `docs/cms.md` | idem | — |

Depois de criar/alterar variáveis, redeploy é necessário — a Vercel só
aplica env vars novas em builds/execuções depois da mudança, não
retroativamente no deployment atual.

---

## 3. Domínio no Resend

Domínio a verificar: **`bookcringe.com.br`** (o mesmo do endereço de
remetente, seção 4).

> Alternativa mais defensiva (opcional, não obrigatória agora): verificar
> um subdomínio dedicado, ex. `mail.bookcringe.com.br`, e enviar de
> `contato@mail.bookcringe.com.br`. Isolar o subdomínio de envio protege a
> reputação do domínio raiz caso algo dê errado com a newsletter no
> futuro. Se optar por isso depois, é só trocar `CONTACT_EMAIL` — nenhum
> código muda.

Passo a passo:

1. No painel do Resend: **Domains → Add Domain** → `bookcringe.com.br`
   (escolha a região mais próxima da maioria dos leitores, ex. `sa-east-1`
   se disponível).
2. O Resend gera um conjunto de registros DNS **específicos da sua
   conta** — os valores exatos (host, prioridade, conteúdo) só existem no
   painel; nunca copie valores de outro domínio/tutorial. Tipicamente:
   - **SPF**: um registro `TXT` (geralmente em um subdomínio tipo `send.bookcringe.com.br`) com algo como `v=spf1 include:amazonses.com ~all`, e um `MX` correspondente (para receber bounce/complaint feedback).
   - **DKIM**: um registro `TXT` em `resend._domainkey.bookcringe.com.br` com a chave pública.
   - **DMARC** (recomendado, não obrigatório pelo Resend, mas evita que os e-mails caiam em spam): `TXT` em `_dmarc.bookcringe.com.br`, algo como `v=DMARC1; p=none; rua=mailto:contato@bookcringe.com.br` para começar em modo monitoramento; evoluir para `p=quarantine`/`p=reject` depois de confirmar que tudo passa.
3. Adicione os registros exatamente como o Resend mostra, no provedor de
   DNS do domínio (Registro.br, Cloudflare, etc.). Cuidado com painéis que
   já completam o domínio automaticamente (nesse caso, cole só a parte do
   host antes do domínio, sem duplicar).
4. Se o DNS estiver atrás de proxy (ex. Cloudflare com "nuvem laranja"),
   os registros de DKIM/SPF precisam ficar em modo **"DNS only"** (sem
   proxy) — proxy nesses registros quebra a verificação.
5. Volte ao Resend e clique em **Verify DNS Records**. Propagação costuma
   levar minutos, mas pode levar até algumas horas.
6. Confirme pelo terminal, se quiser adiantar (substitua pelos hosts reais
   mostrados no seu painel):

   ```bash
   nslookup -type=TXT resend._domainkey.bookcringe.com.br
   nslookup -type=TXT send.bookcringe.com.br
   nslookup -type=MX send.bookcringe.com.br
   ```

---

## 4. Endereço de envio

O remetente **nunca** é uma variável separada — é sempre montado em
`getFromEmail()` (`src/lib/env.ts`):

```ts
`${SITE_NAME} <${CONTACT_EMAIL}>`
```

Com `SITE_NAME = "BookCringe"` (constante) e `CONTACT_EMAIL` configurado
como `contato@bookcringe.com.br`, o remetente de produção fica exatamente:

```
BookCringe <contato@bookcringe.com.br>
```

Ou seja: para obter o endereço pedido, basta configurar `CONTACT_EMAIL`
corretamente — nenhuma mudança de código é necessária.

---

## 5. Checklist operacional

Use esta lista, nesta ordem, antes do primeiro envio real:

- [ ] **DNS**: registros do Resend adicionados no provedor de DNS de `bookcringe.com.br`
- [ ] **SPF**: registro TXT/MX de SPF publicado e propagado (`nslookup -type=TXT send.bookcringe.com.br`)
- [ ] **DKIM**: registro TXT de DKIM publicado e propagado (`nslookup -type=TXT resend._domainkey.bookcringe.com.br`)
- [ ] **Domínio verificado**: status `Verified` na aba Domains do Resend (não `pending`/`not_started`)
- [ ] **Variáveis configuradas**: `RESEND_API_KEY`, `CONTACT_EMAIL` e `SITE_URL` na Vercel (Production) — ver seção 2
- [ ] **Teste de confirmação**: cadastro em `/crew-literario` com um e-mail real → e-mail "📚 Confirme sua entrada..." chega → clicar no link confirma em `/crew-literario/confirmar` e mostra a tela de boas-vindas
- [ ] **Teste de boas-vindas**: confirmado o passo acima, o e-mail "📚 Bem-vindo ao Crew Literário" chega logo em seguida, com os links corretos (incluindo "Recomendação do mês" quando houver um livro marcado no CMS)
- [ ] **Teste de campanha**: em `/admin/newsletters`, criar uma campanha de teste → **Enviar teste** → confirmar que chega em `CONTACT_EMAIL` com o assunto prefixado `[TESTE]` → só depois usar **Enviar para o Crew**

---

## 6. Como testar cada fluxo (passo a passo)

### Confirmação + boas-vindas

1. Preencha `RESEND_API_KEY`/`CONTACT_EMAIL` (local: sua chave de teste; produção: chave real + domínio verificado).
2. Acesse `/crew-literario` e cadastre um e-mail que você acesse de verdade.
3. Verifique a resposta na tela: "📬 Quase lá! Enviamos um e-mail de confirmação...".
4. Cheque a caixa de entrada (e o spam, principalmente antes do domínio estar 100% aquecido) pelo assunto "📚 Confirme sua entrada no Crew Literário".
5. Clique em **Confirmar participação** → deve cair em `/crew-literario/confirmar?token=...` e mostrar "📚 Bem-vindo ao Crew Literário!".
6. Confirme que o e-mail de boas-vindas chegou logo depois, e que `newsletter_subscribers.confirmed_at` foi preenchido para aquele e-mail (visível em `/admin/subscribers`, filtro "Confirmados").
7. Clique no mesmo link de confirmação de novo: deve cair no estado de "link inválido" (comportamento esperado — token já foi consumido, ver comentário em `confirmSubscriberByToken`).

### Campanha

1. Tenha pelo menos um inscrito **confirmado** (passo acima).
2. Em `/admin/newsletters` → **Nova campanha** → preencha assunto/conteúdo → salvar como rascunho.
3. **Enviar teste** → chega só em `CONTACT_EMAIL`, com `[TESTE]` no assunto — confira o layout antes de ir adiante.
4. **Enviar para o Crew** → dispara para todos os `confirmed_at IS NOT NULL`. A campanha muda de status para `sent` só se o envio inteiro for bem-sucedido.

---

## 7. Problemas comuns

| Sintoma | Causa provável | Como resolver |
|---|---|---|
| `RESEND_API_KEY é obrigatória` / `CONTACT_EMAIL deve ser um e-mail válido` (erro no log, cadastro/confirmação continuam funcionando) | Variáveis ausentes/erradas | Nenhum e-mail é enviado, mas o cadastro/confirmação nunca falham por causa disso (ver `confirmationEmailService`/`welcomeEmailService` — sempre `try/catch`). Preencha as variáveis e reenvie a confirmação cadastrando o mesmo e-mail de novo em `/crew-literario` (reenvia o token, ver `createSubscriber`). |
| Domínio fica em `pending` por muito tempo | Registro copiado errado, ou proxy (Cloudflare "nuvem laranja") ativo nos registros de DKIM/SPF | Revalide com `nslookup`, compare valor por valor com o painel do Resend, desative o proxy nesses registros específicos |
| E-mail cai em spam | Domínio recém-verificado ("cold domain"), falta de DMARC, ou volume alto de repente | Envie aos poucos no início ("warm-up"), configure DMARC (seção 3), evite enviar campanhas grandes logo no primeiro dia |
| Link de confirmação aponta para produção mesmo testando local | `SITE_URL` não definida no `.env.local` | Defina `SITE_URL=http://localhost:3000` no `.env.local` e reinicie `npm run dev` |
| Segundo clique no link de confirmação dá "link inválido" mesmo tendo confirmado antes | Comportamento esperado — o token é apagado após o uso (ver limitação documentada em `confirmSubscriberByToken`) | Não é um bug: o e-mail já está confirmado (`confirmed_at` continua preenchido); apenas o link não pode mais ser reutilizado |
