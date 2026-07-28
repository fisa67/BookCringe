# BookCringe

> **"Cringe por fora, cult por dentro."**

Plataforma literária brasileira. Vídeos, resenhas, estatísticas, clube de leitura e conteúdo para redes sociais.

---

## Stack

- **Next.js 16** (App Router, Static Generation)
- **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Geist** (fonte principal)
- **Supabase** (backend do CMS)
- **Resend** (e-mails transacionais dos formulários e do Crew Literário — ver [docs/email-setup.md](docs/email-setup.md))
- **Auth.js v5** (autenticação do admin via GitHub OAuth — ver [docs/cms.md](docs/cms.md))

---

## Iniciar o projeto

```bash
# Instalar dependências
npm install

# Servidor de desenvolvimento
npm run dev

# Build de produção
npm run build

# Servir o build
npm start
```

Acesse em [http://localhost:3000](http://localhost:3000).

---

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha os valores. O `.env.local`
é ignorado pelo Git. As variáveis cobrem quatro áreas: site/SEO (`SITE_URL`),
e-mail (Resend), backend (Supabase) e autenticação do admin (GitHub OAuth,
ativa desde a Fase 1B).

```bash
cp .env.example .env.local
```

Para ativar o envio de e-mail em produção (domínio, DNS, checklist e testes
do fluxo do Crew Literário), ver [docs/email-setup.md](docs/email-setup.md).

---

## Estrutura

```
src/
├── proxy.ts                # Proteção otimista de /admin/* (Auth.js) — Fase 1B
│
├── app/                    # Rotas (Next.js App Router)
│   ├── page.tsx            # Home
│   ├── sobre/ biblioteca/ clube-de-leitura/ estatisticas/ trabalhe-comigo/ contato/
│   ├── admin/              # Painel administrativo (CMS) — protegido por login
│   │   ├── login/          # Página de login (GitHub OAuth)
│   │   └── layout.tsx      # Defesa em profundidade (auth()) + shell do admin
│   └── api/
│       ├── auth/[...nextauth]/  # Rota do Auth.js (GitHub OAuth)
│       └── contact/ bookclub/ complete-reading/
│
├── components/
│   ├── layout/             # Header, Footer
│   ├── ui/                 # Button, Card, Badge, SectionHeader, PageHero
│   ├── home/ book/ bookclub/ library/ forms/ analytics/
│
├── data/                   # Dados estáticos do site público (mock + clube)
│   ├── mock/
│   └── bookclub/
│
└── lib/
    ├── auth/               # Autenticação do admin: index.ts (NextAuth), config.ts, types.ts
    ├── services/           # Serviços do CMS (Supabase)
    ├── supabase/           # Client do Supabase
    ├── types/ validations/ email/
    ├── constants.ts        # Nome do site, navegação, redes sociais
    ├── env.ts              # Validação de variáveis de ambiente (Zod)
    ├── types.ts            # Tipos globais (Book, ReadingStats, etc.)
    └── utils.ts            # cn(), formatNumber(), slugify(), etc.
```

---

## CMS & Admin

O painel administrativo (`/admin`) exige login com GitHub (apenas o usuário
em `ADMIN_GITHUB_LOGIN` tem acesso) e a integração com Supabase está em
construção. O detalhamento de setup, do modelo de autenticação (GitHub OAuth,
dois OAuth Apps — dev/prod) e do faseamento (1A → 1B → 2 → 3) está em
[docs/cms.md](docs/cms.md).

> **Estado atual:** a Fase 1B ativou a autenticação. `/admin/*` é protegido
> em duas camadas (`src/proxy.ts` + defesa em profundidade em
> `src/app/admin/layout.tsx`), ambas reutilizando o mesmo `auth()` central.

---

## Identidade visual

Extraída diretamente da logo oficial. Tokens em `src/app/globals.css`:

| Token | Valor | Uso |
|---|---|---|
| `--bc-cream` | `#F7F3EC` | Background principal |
| `--bc-ink` | `#1A1A1A` | Texto e elementos escuros |
| `--bc-red` | `#E8302A` | Cor de destaque (brand) |
| `--bc-muted` | `#6B6B6B` | Textos secundários |
| `--bc-border` | `#E5E0D8` | Bordas e divisores |
| `--bc-surface` | `#F0EBE2` | Backgrounds de seção |

---

## Roadmap futuro

- [ ] Integração com API do **Bookly**
- [ ] Blog / Resenhas (MDX ou CMS headless)
- [ ] Newsletter (Resend ou Mailchimp)
- [ ] Sistema de busca na biblioteca
- [ ] Filtros avançados (gênero, país, autor, ano)
- [ ] Timeline de leituras
- [ ] Área para editoras / formulário de envio de livros
- [ ] Mídia Kit para download
- [ ] Dashboard de leitura em tempo real
- [x] Autenticação do admin (GitHub OAuth) — ativa desde a Fase 1B
- [ ] Autenticação (área de membros do clube)
