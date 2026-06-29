# BookCringe

> **"Cringe por fora, cult por dentro."**

Plataforma literária brasileira. Vídeos, resenhas, estatísticas, clube de leitura e conteúdo para redes sociais.

---

## Stack

- **Next.js 16** (App Router, Static Generation)
- **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Geist** (fonte principal)

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

## Estrutura

```
src/
├── app/                    # Rotas (Next.js App Router)
│   ├── page.tsx            # Home
│   ├── sobre/
│   ├── biblioteca/
│   ├── clube-de-leitura/
│   ├── estatisticas/
│   ├── trabalhe-comigo/
│   └── contato/
│
├── components/
│   ├── layout/             # Header, Footer
│   ├── ui/                 # Button, Card, Badge, SectionHeader, PageHero
│   └── home/               # Hero, StatsSection, AboutSection, RecentReads, ClubCTA
│
├── data/
│   └── mock/               # Dados mock (substituir por API/Bookly)
│
└── lib/
    ├── constants.ts        # Nome do site, navegação, redes sociais
    ├── types.ts            # Tipos globais (Book, ReadingStats, etc.)
    └── utils.ts            # cn(), formatNumber(), slugify(), etc.
```

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
- [ ] Autenticação (área de membros do clube)
