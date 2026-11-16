# Labels

Mapa de papéis → labels reais de `GusMartins499/iniciativa` (ver `shared/pr-flow.md` § Labels).
Todas as labels do mapa existem no repositório (verificado com `gh label list`). As
categorias usam as labels padrão do GitHub. Sem workflows de CI, `required` é vazio.

```
ready-for-agent: ready-for-agent      # card fully specified, agent may pick it up
in-progress:     in-progress
in-review:       in-review
needs-human:     needs-human          # parked by the automode park protocol
category:feature: enhancement         # existe (padrão do GitHub)
category:fix:     bug                 # existe (padrão do GitHub)
category:dx:      enhancement         # [DX] — escolhido no /create-tasks
chaos:passed:     chaos:passed
chaos:found-bugs: chaos:found-bugs
required:        []                   # labels CI enforces on every PR, if any
```
