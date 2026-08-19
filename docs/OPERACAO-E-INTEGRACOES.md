# Duck x Belentani OS — operação e integrações

## Como usar agora

O painel Comando mostra apenas dados persistidos do workspace autenticado: projetos, eventos e oportunidades. No Motor de Renda, o briefing exige cliente/projeto, serviço, duração, quantidade de faixas e prazo. Ao salvar, o backend calcula a faixa, grava a oportunidade e registra o evento de receita.

Na área Arquivos, escolha um projeto existente para abrir o Audio Workbench. O envio de WAV/MP3 gera uma URL direta de storage, calcula duração e waveform no navegador, calcula SHA-256, valida o objeto armazenado no backend e registra a versão. A waveform permite selecionar um ponto, criar comentário temporal, reproduzir, baixar e comparar a versão atual com uma referência B.

A área Clientes separa a apresentação de andamento, versão e aprovação do painel interno. O Press Kit usa somente dados fornecidos no projeto; não cria avaliações, depoimentos ou métricas de terceiros.

## Integrações planejadas

| Integração | Estado | Próximo passo seguro |
| --- | --- | --- |
| Telegram | Preparada conceitualmente | Adicionar credencial do bot e mapear eventos `studioEvents` para mensagens; nunca expor token no frontend. |
| WhatsApp | Não ativada | Confirmar provedor e custo antes de habilitar; usar somente webhooks assinados. |
| DAW Bridge | Em desenho | Criar agente local opt-in que monitore uma pasta escolhida e envie somente arquivos aprovados. |
| Pagamentos | Motor de proposta pronto | Conectar provedor de pagamento após definir moeda, conta recebedora, impostos e política de reembolso. |
| Royalties | Modelo ainda não conectado | Definir participantes, percentuais, território e momento de liquidação antes de criar qualquer split automático. |

## Segurança operacional

Tokens e chaves devem entrar como segredos de ambiente, nunca no código. Assets de áudio não devem ser públicos; downloads usam URLs assinadas. Antes de ativar notificações ou pagamentos reais, validar os webhooks, registrar idempotência e manter trilha de auditoria.
