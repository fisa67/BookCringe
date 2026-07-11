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

As variáveis de `Auth` são exigidas a partir da Fase 1B (autenticação ativa).

### GitHub OAuth Apps (dois, um por ambiente)

Para evitar troca de callback URL a cada deploy, use **dois OAuth Apps
separados** — mesmas variáveis de ambiente em ambos, valores diferentes por
ambiente, sem qualquer alteração de código:

| | Desenvolvimento | Produção |
|---|---|---|
| Homepage URL | `http://localhost:3000` | `https://bookcringe.com.br` |
| Authorization callback URL | `http://localhost:3000/api/auth/callback/github` | `https://bookcringe.com.br/api/auth/callback/github` |
| Onde configurar | `.env.local` | Variáveis de ambiente do hosting |

Para cada app: GitHub → **Settings** → **Developer settings** → **OAuth Apps**
→ **New OAuth App** → copie o **Client ID** e gere um **Client Secret** para
`AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` no ambiente correspondente.

---

## Autenticação — arquitetura

Padrão de "split config" do Auth.js:

- `src/lib/auth/types.ts` — tipos da sessão e augmentation do Auth.js.
- `src/lib/auth/config.ts` — objeto `authConfig` (provider GitHub, sessão JWT
  stateless, allowlist single-user via callback `signIn`, `trustHost: true`
  para funcionar em qualquer domínio sem `AUTH_URL` fixo).
- `src/lib/auth/index.ts` — única instância `NextAuth(authConfig)`, exporta
  `{ handlers, auth, signIn, signOut }`. **Todo o resto do app reutiliza este
  módulo** — nunca instancia `NextAuth()` de novo.

Duas camadas de proteção para `/admin/*` (defesa em profundidade,
recomendação oficial do Next.js — "Proxy should not be your only line of
defense"), ambas reutilizando o mesmo `auth()`:

1. `src/proxy.ts` — checagem otimista (lê o JWT do cookie) via `matcher:
   ["/admin/:path*"]`, excluindo `/admin/login` explicitamente.
2. `src/app/admin/layout.tsx` — checagem redundante no Server Component,
   para proteger mesmo em acesso direto que eventualmente não passe pelo
   proxy. Sabe pular `/admin/login` através do header `x-bc-pathname`
   propagado pelo proxy (um layout não recebe o pathname da rota diretamente).

Fluxo:

```
/admin/* → proxy (otimista) → sem sessão → /admin/login → GitHub OAuth
         → login fora da allowlist → sessão nunca criada, acesso negado
         → login na allowlist → sessão JWT → layout confirma → /admin liberado
```

> Nota: desde o Next.js 16, `middleware.ts` está deprecado em favor de
> `proxy.ts` (mesma API de `matcher`, agora em runtime Node.js por padrão).
> Por isso o arquivo se chama `src/proxy.ts`, não `middleware.ts`.

---

## Faseamento

| Fase | Escopo | Ativa proteção? |
|---|---|---|
| **1A** | `.env.example`, `src/lib/env.ts`, `src/lib/auth/{types,config}.ts`, docs, dependência `next-auth` | Não — fundação inerte |
| **1B** | `src/lib/auth/index.ts`, `src/proxy.ts`, `/admin/login`, rota `/api/auth/[...nextauth]`, defesa em profundidade em `admin/layout.tsx` | Sim |
| **2** | Telas de CRUD do admin consumindo `src/lib/services/` atrás do gate | — |
| **3** | Site público passando a ler do Supabase (substituindo `src/data/mock/`) | — |

### Estado atual: Fase 1B concluída

- Autenticação **ativa**: `/admin/*` exige login GitHub com o username em
  `ADMIN_GITHUB_LOGIN` (allowlist de 1 usuário).
- Duas camadas de proteção (proxy + layout), reutilizando o mesmo `auth()`.
- Dois OAuth Apps do GitHub (dev/prod) — mesmas variáveis de ambiente, sem
  alteração de código entre ambientes.
- Nenhuma alteração em páginas públicas, SEO, formulários, serviços, client
  do Supabase ou migrations. O layout público raiz (`src/app/layout.tsx`)
  continua envolvendo `/admin` com `Header`/`Footer` — fica para a Fase 2.
