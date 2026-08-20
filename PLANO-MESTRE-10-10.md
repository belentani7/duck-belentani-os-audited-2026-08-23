# Plano Mestre de Evolução — Duck x Belentani OS

## Objetivo e diagnóstico executivo

O Duck x Belentani OS já deixou de ser apenas um dashboard musical. A versão auditada é uma base full-stack funcional para duas frentes: colaboração de produção musical e prospecção automatizada de potenciais clientes. O novo centro de gravidade é a máquina lead-first: Lucas configura nicho, área, variáveis e fontes públicas HTTPS; o sistema coleta contatos empresariais visíveis, normaliza email e telefone, deduplica registros, calcula score, registra a fonte e organiza os leads em pipeline. A Home já exibe leads captados, duplicados, buscas e conversões. O sistema também possui refresh recorrente por Heartbeat, execução manual, pausa, callback cron-only e cooldown persistente de notificações.

A auditoria encontrou uma base tecnicamente consistente, mas ainda não um produto 10/10 de produção. O typecheck passa, o build de produção passa e a suíte possui 55 testes em 15 suítes. Porém, “funcionar” não é o mesmo que ser confiável em escala: ainda faltam criação e arquivamento de projetos mais completos, observabilidade, filas e retries para coleta, índices de banco, paginação, validação operacional com fontes reais autorizadas, integração real de canais externos, controles de privacidade, métricas de conversão e uma experiência comercial que transforme um lead em proposta e receita.

> A meta correta para o próximo ciclo não é coletar o máximo de contatos. É entregar contatos permitidos, relevantes, deduplicados, rastreáveis e acionáveis, com baixo custo operacional e sem gerar spam ou risco jurídico.

## 1. Critérios objetivos para considerar a plataforma “10/10”

A nota 10/10 deve ser definida por critérios verificáveis, não por impressão visual. O sistema será considerado pronto quando cumprir simultaneamente os seguintes padrões:

| Dimensão | Critério de aceitação |
| --- | --- |
| Produto | Um usuário consegue criar uma busca, executá-la, revisar leads, alterar status, adicionar notas, exportar resultados e iniciar uma proposta sem sair do fluxo principal. |
| Dados | Cada lead possui fonte, data, motivo de score, nicho, área, canal de contato e chave de deduplicação; não há registros vazios ou duplicados conhecidos. |
| Automação | Jobs são idempotentes, têm timeout, retry limitado, cooldown, estado de execução, erro visível e possibilidade de pausa imediata. |
| Segurança | Toda leitura e mutação respeita `ownerId`; URLs de áudio são assinadas; endpoints cron-only rejeitam chamadas comuns; segredos nunca chegam ao frontend. |
| Conformidade | O sistema coleta somente fontes permitidas, respeita HTTPS, robots.txt e termos aplicáveis, mantém URL de origem e oferece remoção/descarta de contato. |
| Performance | A interface permanece responsiva com centenas ou milhares de leads usando paginação, filtros server-side e carregamento incremental. |
| Receita | Um lead qualificado pode virar oportunidade, orçamento, proposta, acompanhamento e registro financeiro com rastreabilidade. |
| Operação | Lucas consegue entender o que rodou, quando rodou, quantos leads entraram, quantos foram duplicados, quais erros ocorreram e qual é a próxima ação. |
| Qualidade | TypeScript, build, testes unitários, testes HTTP, testes de autorização e verificação visual passam antes de cada checkpoint. |

## 2. Fase P0 — blindagem e correções críticas

A primeira prioridade é proteger o que já existe. Antes de adicionar recursos, deve ser feita uma auditoria de autorização em todas as queries e mutations. Há bons padrões em `server/db.ts`, mas esse padrão precisa ser aplicado de modo uniforme a assets, comentários, projetos, press kits, ledger, royalties, leads e downloads. O endpoint `getAudioDownloadUrl` deve validar que a chave pertence a um asset do usuário; aceitar apenas uma `storageKey` válida não é suficiente como regra de autorização. O mesmo princípio deve ser aplicado a `assetId`, `projectId`, `searchId` e `leadId`, sempre verificando relação e proprietário no banco.

Em seguida, devem ser criados índices compostos no banco. As tabelas de leads precisam de índices por `(ownerId, dedupeKey)`, `(ownerId, searchId)`, `(ownerId, status)`, `(ownerId, score)` e `(ownerId, discoveredAt)`. Buscas precisam de índices por `(ownerId, createdAt)` e `scheduleCronTaskUid`. Sem esses índices, a máquina funciona com poucos dados, mas degrada quando a prospecção crescer.

A deduplicação atual consulta antes de inserir. Isso é útil, mas não é suficiente contra duas execuções simultâneas. A solução de produção é adicionar uma restrição única composta ou uma chave de deduplicação compatível com o banco e tratar a violação de unicidade como duplicado. O contador de inseridos, duplicados e erros deve permanecer correto mesmo em concorrência.

Também é necessário proteger limites de coleta: máximo de URLs por busca, tamanho máximo de resposta, timeout, número de redirecionamentos, content-type HTML, limite diário por usuário e cancelamento. A interface deve mostrar o consumo da execução antes de iniciar um scan grande.

## 3. Fase P1 — transformar a prospecção em fluxo comercial completo

A tela `LeadProspector` já configura buscas, aplica filtros client-side e exporta CSV, mas ainda deve evoluir para uma fila de revisão comercial. O primeiro passo é adicionar paginação server-side, ordenação, filtros persistentes e seleção em lote. O segundo é permitir editar notas, próxima ação, data de acompanhamento, responsável e motivo do descarte. O terceiro é exibir por que o lead recebeu determinado score: email válido, telefone válido, intenção encontrada, correspondência de variável e completude empresarial.

O pipeline deve separar claramente estados: `novo`, `revisar`, `contactar`, `respondeu`, `qualificado`, `proposta`, `convertido`, `descartado` e `opt-out`. Cada transição importante deve gerar `studioEvent`, data e usuário responsável. O sistema não deve disparar mensagens automaticamente; deve oferecer um botão explícito de “preparar contato” que gere um rascunho revisável, sem envio.

O passo de maior impacto econômico é conectar `leadRecords` a `opportunities`. Um lead qualificado deve poder gerar um briefing pré-preenchido com nome da empresa, serviço sugerido, nicho e contexto da fonte. Depois, o motor de orçamento pode calcular uma faixa e criar uma oportunidade. A partir daí, o fluxo deve permitir proposta, status comercial, valor esperado, prazo, observações e vínculo com projeto. Isso transforma o scraper de um catálogo em uma máquina de receita.

## 4. Fase P2 — scraper profissional e fontes configuráveis

O coletor atual é prudente: exige HTTPS, limita tamanho, extrai contatos visíveis, normaliza email e telefone e evita criar lead sem contato ou sinal de intenção. A próxima evolução deve separar quatro camadas: descoberta, fetch, extração e qualidade. A descoberta deve trabalhar primeiro com RSS/Atom, APIs oficiais e URLs cadastradas pelo usuário. O fetch deve registrar status HTTP, tempo de resposta, content-type, redirecionamentos e hash do conteúdo. A extração deve manter evidência mínima: trecho do sinal de intenção, campo detectado e URL original. A qualidade deve classificar `contato empresarial`, `contato genérico`, `telefone plausível`, `domínio`, `intenção` e `confiança`.

Cada fonte deve ter política: permitida, pausada, bloqueada, erro repetido ou exige revisão. A máquina deve respeitar `robots.txt` quando aplicável, termos do site e limites de requisição. Não devem ser coletadas áreas autenticadas, grupos fechados, CAPTCHA, páginas que proíbem crawlers ou plataformas cujo contrato impeça automação. A arquitetura deve aceitar provedores substituíveis sem amarrar o produto a uma única API.

O score precisa ser explicável e configurável por nicho. Para música, sinais podem incluir “procura produtor”, “mixagem”, “masterização”, “estúdio”, “licenciamento” e “contratar”. Para outro nicho, as variáveis mudam. O usuário deve conseguir salvar presets por nicho e comparar a qualidade dos resultados por fonte.

## 5. Fase P3 — automação, observabilidade e confiabilidade

O Heartbeat já fornece a direção correta: jobs fora de timers locais, ativação vinculada ao usuário, callback cron-only e execução idempotente. Para chegar ao padrão 10/10, cada execução precisa de um registro próprio com `startedAt`, `finishedAt`, status, quantidade de fontes, inseridos, duplicados, erros, duração, última mensagem e `taskUid`. Isso permite uma tela de histórico e facilita diagnóstico.

O refresh deve processar fontes em lotes pequenos, com timeout individual, retry com backoff e limite de tentativas. Uma fonte lenta não pode impedir as demais. O job deve ser seguro para repetição: a mesma URL e a mesma dedupe key não podem criar duplicidade. O cooldown de notificação deve continuar persistente, mas também deve existir digest resumido para muitas alterações. O feed interno deve informar novos leads, duplicados e erros; Telegram e WhatsApp só devem ser ativados depois de credenciais, webhooks, opt-in, idempotência e testes de entrega.

A observabilidade mínima inclui logs estruturados sem dados sensíveis, métricas de taxa de sucesso, erro por fonte, tempo médio de coleta e conversão por busca. Dados de contato não devem aparecer em logs. Deve existir uma ação de pausar todos os jobs e uma indicação clara de último sucesso.

## 6. Fase P4 — experiência, performance e produto musical

A Home deve permanecer lead-first, mas os módulos musicais não podem parecer abandonados. `Projetos`, `Arquivos`, `Clientes`, `Financeiro` e `Press Kit` devem ter estados vazios úteis, criação real e navegação sem becos sem saída. O botão “Novo projeto” precisa criar de fato um projeto ou abrir um formulário funcional; hoje a auditoria indica que algumas ações ainda são apresentacionais. Criação, arquivamento, duplicação e restauração de projeto devem ser persistentes e testados.

Para performance, o bundle frontend está acima do aviso de 500 kB. Isso não bloqueia o uso, mas merece code splitting por área, lazy loading para workbench de áudio e carregamento sob demanda para componentes secundários. A lista de leads deve migrar filtros para o servidor e usar paginação. O áudio deve continuar direto no storage, sem bytes no banco, com URLs assinadas e expiração controlada.

A acessibilidade deve incluir foco visível, navegação por teclado, labels completos, mensagens de erro compreensíveis, contraste verificado e operação básica em mobile. A verificação visual deve ser acompanhada por testes de interação, não apenas screenshot.

## 7. Fase P5 — receita, segurança e operação real

O produto precisa de um painel “Próxima ação” que priorize leads qualificados, propostas abertas, pagamentos pendentes e projetos atrasados. O financeiro deve adotar moeda, centavos, status, vencimento e auditoria consistentes. Antes de pagamentos reais, será necessário definir provedor, conta recebedora, impostos, reembolsos e reconciliação. Royalties não devem ser liquidados automaticamente sem regras de participantes, percentuais, território e aprovação.

A privacidade deve incluir política de retenção, exclusão de lead, opt-out, registro da origem e permissão para exportação. O sistema deve separar dados públicos empresariais de notas internas. Toda alteração comercial importante deve possuir histórico. Backups, restauração testada e procedimento de incidente devem ser documentados.

## 8. Ordem de execução recomendada

| Ordem | Entrega | Critério de saída |
| --- | --- | --- |
| 1 | Auditoria de autorização, download e ownership | Testes negativos para cada entidade e chave de storage |
| 2 | Índices e deduplicação transacional | Execuções concorrentes não criam duplicados |
| 3 | Histórico de jobs e limites de coleta | Cada refresh tem estado, duração e erro rastreável |
| 4 | Paginação, revisão e notas de leads | Pipeline utilizável com grande volume |
| 5 | Lead → oportunidade → proposta | Um lead qualificado gera oportunidade real |
| 6 | Fontes, retries e score explicável | Qualidade mensurável por fonte e nicho |
| 7 | Criação/arquivamento de projetos | Fluxo musical completo sem ações falsas |
| 8 | Performance, acessibilidade e backup | Build otimizado, navegação acessível e restauração ensaiada |

## Conclusão

O próximo passo não é adicionar mais telas. É fechar o circuito entre descoberta, validação, decisão, proposta, entrega e receita. O sistema já tem a fundação correta: banco persistente, tRPC, storage, autenticação, scraper responsável, pipeline e Heartbeat. A evolução para 10/10 depende de tornar cada etapa mensurável, concorrente-segura, auditável e economicamente acionável. A prioridade deve ser P0 de segurança e integridade, seguida por lead-to-revenue, observabilidade de jobs e escala de dados. Com esse roteiro, Duck/Lucas terá uma máquina de prospecção que trabalha continuamente sem perder controle humano, conformidade ou clareza operacional.
