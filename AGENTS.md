# BookCringe CMS

Você está trabalhando no projeto BookCringe CMS.

## Filosofia

Cada sprint deve entregar uma funcionalidade utilizável.

Preferimos um importador completo para uma plataforma do que quatro importadores incompletos.

Nunca criar arquitetura sem entregar valor.

Priorize simplicidade sobre abstrações desnecessárias.

## Intelligence

O módulo Intelligence será responsável por centralizar todas as métricas do BookCringe.

Ele deverá importar dados de diversas plataformas.

Cada plataforma possui seu próprio adapter.

Nunca utilizar um parser genérico gigante.

Cada plataforma deve ser completamente independente.

Fluxo:

Arquivo
↓

Detection Preview

↓

Adapter da Plataforma

↓

NormalizedImportRecord

↓

Persistência

↓

Dashboard

O Dashboard nunca deve ler arquivos diretamente.

Ele trabalha apenas com dados normalizados.

## Desenvolvimento

Sempre:

- preservar a arquitetura existente
- reutilizar componentes existentes
- reutilizar services existentes
- reutilizar tipos existentes
- adicionar testes
- manter tipagem forte
- manter código simples

Sempre que possível:

- evitar duplicação
- evitar switch gigantes
- evitar funções enormes

## Sprint atual

Estamos implementando primeiro o importador do YouTube.

Somente depois serão implementados:

- Instagram
- TikTok
- Meta Ads
- Google Analytics

## Objetivo

O Intelligence deve se tornar o centro de comando do BookCringe.

## Princípio do Modelo Canônico

As plataformas nunca definem o modelo de dados do Intelligence.

Todo adapter deve transformar seus dados para o domínio do BookCringe.

O Dashboard, a persistência e a IA nunca devem conhecer formatos específicos do YouTube, Instagram, TikTok ou qualquer outra plataforma.

O domínio pertence ao BookCringe.