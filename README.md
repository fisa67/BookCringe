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
- **Resend** (e-mails transacionais dos formulários)
- **Auth.js v5** (fundação de autenticação do admin — ainda não ativa, ver [docs/cms.md](docs/cms.md))

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
é ignorado pelo Git. As variáveis cobrem três áreas: e-mail (Resend), backend
(Supabase) e autenticação do admin (GitHub OAuth — reservada para a Fase 1B).

```bash
cp .env.example .env.local
```

---

## Estrutura

```
src/
├── app/                    # Rotas (Next.js App Router)
│   ├── page.tsx            # Home
│   ├── sobre/ biblioteca/ clube-de-leitura/ estatisticas/ trabalhe-comigo/ contato/
│   ├── admin/              # Painel administrativo (CMS) — em construção
│   └── api/                # contact, bookclub, complete-reading
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
    ├── auth/               # Fundação de autenticação do admin (config + types) — inativa
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

O painel administrativo (`/admin`) e a integração com Supabase estão em
construção. O detalhamento de setup, do modelo de autenticação (GitHub OAuth)
e do faseamento (1A → 1B → 2 → 3) está em [docs/cms.md](docs/cms.md).

> **Estado atual:** a Fase 1A entrega apenas a fundação de autenticação
> (configuração, tipos, variáveis e documentação). A autenticação **não está
> ativa** — o `/admin` ainda não é protegido. A ativação ocorre na Fase 1B.

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
- [ ] Autenticação do admin (GitHub OAuth) — fundação pronta (Fase 1A), ativação na Fase 1B
- [ ] Autenticação (área de membros do clube)
