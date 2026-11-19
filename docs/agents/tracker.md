# Tracker

Onde os cards vivem e qual a branch base. Escrito por `/groundwork`.

O repositório é **público** (requisito do projeto): tudo o que for postado em issues e
PRs é visível para qualquer pessoa. `main` é a branch default do remote e a de produção; os PRs dos cards vão para a `staging` (pipeline de deploy, #91).

```
platform: github-issues
scope: GusMartins499/iniciativa
visibility: public                # requisito: não tornar privado
product_docs: docs/product/
base_branch: staging              # PRs vão para a staging; staging → main leva à produção (#91)
language: user                    # idioma dos artefatos (cards, comentários de PR)
```
