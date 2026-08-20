# Auditoria de escopo e achados — Duck x Belentani OS

## Escopo revisado

A auditoria cobriu os arquivos e fluxos principais do produto, incluindo schema e migrações Drizzle, helpers de banco, router tRPC, autenticação protegida, storage de áudio, scraper público, automação Heartbeat, callback cron-only, componentes de prospecção, Home lead-first, central de notificações, documentação operacional, checklist, testes Vitest, typecheck, build de produção e verificação visual.

## Achados por área

| Área | Evidência revisada | Achado principal |
| --- | --- | --- |
| Arquitetura | `package.json`, estrutura `client/server/shared/drizzle`, build Vite + esbuild | Base full-stack organizada e compilável; ainda precisa code splitting e separação de routers maiores. |
| Banco | `drizzle/schema.ts`, migrações 0000–0014, `server/db.ts` | Dados persistentes cobrem leads, fontes, buscas, áudio, financeiro e projetos; faltam índices compostos, restrições únicas transacionais e histórico de jobs. |
| Rotas | `server/routers.ts`, testes de workspace e permissões | Procedimentos protegidos e owner-scoped existem; downloads, relações entre entidades e alguns fluxos CRUD precisam de auditoria negativa mais profunda. |
| UI | `Home.tsx`, `LeadProspector.tsx`, `NotificationPanel.tsx`, CSS e screenshots | Experiência lead-first está clara e responsiva; faltam paginação, notas/próxima ação e criação real de projeto em ações antes apresentacionais. |
| Automação | `leadAutomation.ts`, `scheduledLeadRoutes.ts`, Heartbeat e testes HTTP | Refresh recorrente, cron-only, execução manual, pausa, preferência `lead` e cooldown estão implementados; faltam histórico detalhado, retry/backoff e entrega real em canais externos. |
| Scraping | `leadScraper.ts`, testes de normalização e conformidade | HTTPS, limites, normalização, sinais de intenção e descarte de páginas sem contato funcionam; ainda faltam políticas por fonte, evidência de extração e métricas de qualidade. |
| Segurança | autenticação Manus, `protectedProcedure`, storage assinado e documentação | Segredos e áreas autenticadas são tratados corretamente; é prioritário validar ownership de cada download e relação entre IDs antes de produção. |
| Testes | 15 suítes, 55 testes, typecheck e build | Cobertura funcional é boa para a base atual; faltam testes de concorrência, carga, retenção, autorização de storage e restauração de backup. |

## Conclusão da auditoria

A expressão “auditoria integral” deve ser entendida como revisão dos fluxos principais e arquivos de maior risco, não como prova formal de cada linha do repositório. O plano mestre transforma esses achados em uma sequência de hardening, escala, conversão comercial e operação segura.
