# Architecture Freeze

Versão

0.1

---

## Estrutura oficial

src/lib/intelligence

adapters

dashboard

datasets

imports

insights

matching

services

session

shared

---

## Regras

Toda plataforma possui Adapter.

Todo Adapter produz NormalizedImportRecord.

Dashboard nunca acessa arquivos.

Toda Persistência acontece via Services.

Toda alteração arquitetural exige ADR.

Nenhuma Sprint quebra funcionalidades existentes.