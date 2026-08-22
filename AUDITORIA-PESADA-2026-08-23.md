# Auditoria pesada — Duck x Belentani OS

**Data:** 23 de agosto de 2026  
**Escopo:** ferramenta completa, não apenas interface web.

## Resultado executivo

A ferramenta está em `main`, alinhada ao checkpoint `43e3f74f` antes desta auditoria, com apenas a alteração esperada em `todo.md` durante a preparação da preservação. O typecheck passou, o build de produção passou e a suíte passou com **55 testes em 15 suítes**. Não foram encontrados arquivos `.env`, chaves privadas, certificados ou padrões evidentes de segredos no repositório auditado.

## Componentes revisados

| Área | Estado | Risco ou recomendação |
| --- | --- | --- |
| Arquitetura | React/Vite no frontend, Express/tRPC no backend, Drizzle/MySQL e storage compatível com S3 | O bundle JavaScript principal está acima de 500 kB; priorizar code splitting por área. |
| Persistência | Usuários, projetos, eventos, oportunidades, áudio, finanças, royalties, press kits, notificações, buscas, fontes e leads | Adicionar índices compostos e reforçar unicidade transacional da deduplicação antes de alto volume. |
| Autorização | Procedimentos protegidos por sessão e filtros por proprietário na maioria dos helpers | Fazer uma rodada específica de testes negativos para cada relação ID e para URLs de download. |
| Scraper | Apenas páginas HTTPS públicas fornecidas, com limites, normalização, sinais de intenção e descarte de registros vazios | Adicionar política por fonte, métricas de qualidade e histórico de fetch. |
| Automação | Heartbeat, callback cron-only, execução manual, pausa, cooldown e feed interno condicionado à preferência `lead` | Adicionar histórico de jobs, retry/backoff, métricas e integração externa somente com opt-in e webhook validado. |
| Produto comercial | Pipeline, score, filtros, CSV e KPIs de leads, duplicados, buscas e conversões | Fechar fluxo lead → oportunidade → proposta → projeto → receita. |
| Áudio | Upload direto ao storage, checksum, análise local, waveform, A/B e comentários temporais | Validar ownership de download e testar arquivos grandes, falhas de rede e expiração de URL. |
| Qualidade | 55 testes, typecheck e build aprovados; verificação visual anterior registrada | Adicionar testes de concorrência, carga, backup/restauração e integração real com fontes autorizadas. |
| Documentação | Plano mestre, escopo do scraper, operação e verificações visuais preservados | Manter o relatório junto do código e atualizar a cada release. |

## Validações executadas

Foram executados `pnpm run check`, `pnpm test -- --run` e `pnpm run build`. O build gera frontend e bundle server-side sem erro. Permanece um aviso não bloqueante sobre o bundle frontend acima de 500 kB e outro aviso de atualização do pacote `baseline-browser-mapping`; ambos devem entrar no backlog de performance/dependências.

## Preservação

O pacote de preservação deve conter código-fonte, migrações, documentação, testes e este relatório. Não deve conter `node_modules`, `dist`, logs de sessão, cookies, tokens, arquivos `.env`, chaves, exports de banco ou arquivos de áudio de clientes. A cópia no GitHub deve ser privada por padrão. A cópia no Drive deve ficar em uma pasta restrita ao proprietário e com nome versionado.

## Veredito

A ferramenta está tecnicamente preservável e pronta para o próximo ciclo de hardening, mas não deve ser descrita como 10/10 de produção sem concluir os itens de autorização profunda, índices, deduplicação concorrente, observabilidade, backup/restauração e integração comercial. O estado atual é uma base funcional forte, com riscos identificados e roteiro claro para evolução.
