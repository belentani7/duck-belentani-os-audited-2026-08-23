# Verificação visual

A interface foi verificada em desktop (1280x720) e mobile (390x844). A composição mantém o painel lateral no desktop, transforma-o em menu recolhível no mobile, conserva contraste entre fundo escuro e verde neon e apresenta métricas em duas colunas no mobile. O estado vazio do banco aparece de forma explícita e não simula projetos ou eventos inexistentes. O nome autenticado exibido no preview veio do contexto de sessão disponível no ambiente.

Próximo ponto de validação: testar com usuário autenticado e criar um briefing para confirmar a persistência e a atualização das métricas do pipeline.

## Verificação final — 19 de agosto de 2026

A captura desktop do dashboard confirma a hierarquia visual dark, o verde neon para ações, o contraste dos cards e a navegação lateral em português. O estado vazio de projetos é legível e não apresenta dados fictícios de clientes ou avaliações. A captura de `/cliente` mostra o portal separado, com cabeçalho de área segura, estado vazio claro e linguagem consistente com o workspace. A rota continua visualmente simples quando não há projetos persistidos, conforme esperado para uma conta nova.

## Incremento de prospecção — 19 de agosto de 2026

O dashboard existente permanece estável após a integração do módulo de prospecção. O novo painel foi implementado dentro de `Oportunidades`, com formulário para nicho, área, variáveis e URLs HTTPS públicas, aviso de conformidade, tabela de leads, score, estado do pipeline e exportação CSV. A verificação TypeScript passou e a suíte aumentou para 44 testes aprovados, incluindo parser de contatos, rejeição de fontes HTTP, autorização tRPC, criação de buscas e atualização de leads. As capturas desktop e mobile mostram o painel lead-first, o formulário configurável, os filtros e a tabela sem quebra estrutural; em telas estreitas, a tabela permanece horizontalmente rolável. A captura final confirma que os quatro KPIs principais agora são leads captados, leads quentes, buscas executadas e conversões, enquanto o briefing musical não aparece no modo Comando.

Os testes adicionais cobrem fonte processada, fonte sem contato, erro de coleta, criação de evento, deduplicação, autorização, persistência agregada e atualização de status. A versão final inclui o KPI persistente de leads duplicados, alimentado pelas contagens gravadas em cada busca.

## Validação final — prospecção e automação

A Home foi verificada em desktop com experiência lead-first: KPIs de leads captados, duplicados, buscas e conversões; formulário configurável por nicho, área, variáveis e URLs HTTPS; filtros por texto, área, nicho, fonte, score e disponibilidade de contato; e pipeline sem dados fictícios. O painel de automações inclui ativação em intervalo de seis horas, execução manual e pausa do refresh. A documentação comunica que alertas automáticos de leads usam apenas o feed interno nesta versão. TypeScript e 55 testes Vitest passam em 15 suítes.
