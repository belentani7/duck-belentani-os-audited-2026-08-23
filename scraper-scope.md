# Escopo inicial do scraper de oportunidades

## Objetivo

A nova camada do Duck x Belentani OS será uma máquina de descoberta de negócios configurável por nicho. O nicho padrão será música, com foco inicial em oportunidades para produção, mixagem, masterização, beats, gravação, licenciamento, sincronização e serviços correlatos. O modelo deverá permitir trocar o nicho sem reescrever o coletor.

## Fontes e conformidade

A primeira versão deve priorizar feeds RSS/Atom, APIs oficiais, diretórios públicos com autorização explícita, páginas próprias de oportunidades e formulários de entrada enviados pelos usuários. O sistema deve respeitar robots.txt, termos de uso, limites de requisição, remoção de dados pessoais desnecessários e deduplicação. Não deverá coletar LinkedIn, grupos fechados, áreas autenticadas, conteúdo atrás de CAPTCHA ou fontes que proíbam crawlers; a própria política do LinkedIn proíbe crawlers, bots e automação de coleta [1].

Para pesquisa web, a opção preferível é uma API licenciada. A documentação do Google Custom Search JSON API informa que ela retorna resultados em JSON, exige chave e mecanismo configurado, e que a oferta para novos clientes está indisponível, com descontinuação indicada para 1º de janeiro de 2027 [2]. Portanto, a arquitetura deve aceitar provedores substituíveis e também funcionar com RSS, APIs públicas e URLs cadastradas pelo usuário.

## Resultado de negócio

Cada oportunidade deve conter título, URL original, fonte, nicho, localização, tipo de serviço, sinal de intenção, resumo, data de descoberta, pontuação, estado do funil, próxima ação e notas. O sistema deve sugerir uma ação humana — por exemplo, revisar, salvar, preparar proposta ou marcar como descartada — sem enviar mensagens automáticas em nome de Lucas sem aprovação explícita.

## Opções de execução

| Abordagem | Tradeoffs | Custo | Complexidade |
|---|---|---:|---:|
| APIs oficiais, RSS e fontes cadastradas pelo usuário | Mais estável e compatível; cobertura inicial menor | Próximo de US$ 0 com fontes gratuitas | Baixa a média |
| Provedor licenciado de pesquisa + coleta limitada de páginas permitidas | Maior descoberta; depende de chave, cotas e fornecedor | Pode começar no plano gratuito; cresce por uso | Média |
| Crawling amplo de redes sociais e sites restritos | Cobertura aparente maior, mas alto risco de bloqueio, violação contratual e privacidade | Variável e potencialmente caro | Alta; não recomendado |

## Referências

[1]: https://www.linkedin.com/help/linkedin/answer/a1341387 "LinkedIn — Prohibited software and extensions"
[2]: https://developers.google.com/custom-search/v1/overview "Google Developers — Custom Search JSON API"

## Regra operacional de notificações

A automação de leads respeita as preferências persistidas, exige o evento `lead` habilitado e, nesta versão, envia alertas automáticos somente para o **feed interno**. Telegram e WhatsApp continuam disponíveis para outras preferências configuráveis, mas não são usados pelo refresh automático de leads até existir uma integração de entrega específica e autorizada. O sistema aplica cooldown persistente por busca para evitar alertas repetidos.
