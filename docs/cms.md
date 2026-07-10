# CMS BookCringe — Setup e Faseamento

Guia do painel administrativo (`/admin`), da integração com Supabase e da
autenticação do admin. O site público, o SEO e os formulários **não são
afetados** por esta fundação.

---

## Visão geral

- **Site público** (`/`, `/biblioteca`, `/clube-de-leitura`, ...): lê dados
  estáticos em `src/data/`. Inalterado.
- **CMS / Admin** (`/admin/*`): consome o Supabase via `src/lib/services/`.
  Em construção.
- **Autenticação**: modelo single-user via GitHub OAuth (Auth.js v5). Apenas o
  login do GitHub em `ADMIN_GITHUB_LOGIN` terá acesso ao `/admin`.

---

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

| Variável | Área | Descrição |
|---|---|---|
| `RESEND_API_KEY` | E-mail | Chave da Resend (formulários públicos) |
| `CONTACT_EMAIL` | E-mail | Remetente/destino dos formulários |
| `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` | Supabase | URL do projeto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | Chave anônima (client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | Chave service role (**secreta**, só no servidor) |
| `AUTH_SECRET` | Auth | Segredo do Auth.js (`npx auth secret`) |
| `AUTH_GITHUB_ID` | Auth | Client ID do GitHub OAuth App |
| `AUTH_GITHUB_SECRET` | Auth | Client Secret do GitHub OAuth App |
| `ADMIN_GITHUB_LOGIN` | Auth | Username do GitHub autorizado (allowlist de 1) |

As variáveis de `Auth` só passam a ser exigidas quando a autenticação for
ativada (Fase 1B). Na Fase 1A elas ficam apenas documentadas.

### GitHub OAuth App (para a Fase 1B)

1. GitHub → **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App**.
2. *Homepage URL*: `http://localhost:3000` (dev) ou o domínio de produção.
3. *Authorization callback URL*: `http://localhost:3000/api/auth/callback/github`.
4. Copie o **Client ID** e gere um **Client Secret** para `.env.local`.

---

## Autenticação — arquitetura

Padrão de "split config" do Auth.js, para permitir ativação isolada:

- `src/lib/auth/types.ts` — tipos da sessão e augmentation do Auth.js.
- `src/lib/auth/config.ts` — objeto `authConfig` (provider GitHub, sessão JWT
  stateless, allowlist single-user). **Inerte**: nada o importa em runtime.

Fluxo previsto (ativado na Fase 1B):

```
/admin/* → middleware → sem sessão → /admin/login → GitHub OAuth
         → login na allowlist → sessão JWT → /admin liberado
```

---

## Faseamento

| Fase | Escopo | Ativa proteção? |
|---|---|---|
| **1A** | `.env.example`, `src/lib/env.ts`, `src/lib/auth/{types,config}.ts`, docs, dependência `next-auth` | Não — fundação inerte |
| **1B** | `middleware.ts`, `/admin/login`, rota `/api/auth/[...nextauth]`, proteção de `/admin` | Sim |
| **2** | Telas de CRUD do admin consumindo `src/lib/services/` atrás do gate | — |
| **3** | Site público passando a ler do Supabase (substituindo `src/data/mock/`) | — |

### Estado atual: Fase 1A concluída

- Fundação de autenticação criada, porém **inativa**.
- `/admin` continua acessível sem login (proteção só na Fase 1B).
- Nenhuma alteração em páginas públicas, SEO, formulários, layout, serviços,
  client do Supabase ou migrations.
