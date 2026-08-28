# Informe de Auditoría: duck-belentani-os-audited-2026-08-23

Fecha: 2026-08-27
Stack detectado: React 19 + Vite 7 + Tailwind 4 + shadcn/ui (Radix) · Node 24 + Express 4 + tRPC 11 (zod, superjson) · MySQL + drizzle-orm/drizzle-kit · Storage S3 vía Forge (URLs firmadas) · Heartbeat cron HTTP · Vitest 2 · pnpm
Commits analizados: 1 (5fc48a4, docs: add README) + 3 del auditor en `agent/auditoria-2026-08-27` (PR #1)
Veredicto: **mejorable** — base sólida, sin secretos reales ni RCE; se corrigieron los riesgos altos de autorización de descargas y un bug de filtrado de assets.

## Lo mejor del repo (mínimo 3)

1. **Arquitectura full-stack limpia y persistente**: separación `client/`, `server/`, `shared/`, `drizzle/` con migraciones versionadas (0000–0014), tRPC tipado de punta a punta y una máquina de prospección de leads (scraper responsable, deduplicación, scoring, pipeline y Heartbeat cron-only) bien integrada.
2. **Seguridad defensiva en la base**: JWT HS256 firmado con secreto de entorno, middleware `protectedProcedure`/`adminProcedure`, guard CSRF OAuth por nonce en cookie `__Host-`, endpoints cron-only que rechazan llamadas comunes, SQL siempre parametrizado a través de Drizzle (sin concatenación), URLs firmadas y validación de checksum SHA-256 en los uploads.
3. **Calidad verificable**: 55 tests en 15 suítes (unit, HTTP y de autorización), `tsc --noEmit` sin errores y build de producción (vite + esbuild) verde. El scraper exige HTTPS, limita tamaño/timeout y normaliza email y teléfono con tests.
4. **Documentación honesta y priorizada**: `AUDITORIA-ESCOPO-E-ACHADOS.md`, `AUDITORIA-PESADA-2026-08-23.md` y `PLANO-MESTRE-10-10.md` son excepcionalmente claros y convierten los hallazgos en un roadmap ejecutable; `docs/OPERACAO-E-INTEGRACOES.md` explica operación y próximas integraciones.

## Hallazgos CRÍTICOS (archivo:línea)

No se detectaron secretos reales en código versionado. Los patrones de credenciales conocidos (OpenAI/Anthropic/AWS/GCP/GitHub/GitLab/PRIVATE KEY), los archivos por nombre (`.env*`, credenciales, `.pem`, `.key`) y `password/apiKey/secret/token` en código arrojaron **cero coincidencias**. El único "posible secreto — revisar manualmente" es la familia de variables de entorno (JWT_SECRET, BUILT_IN_FORGE_API_KEY…), que por diseño no debe versionarse.

## Hallazgos ALTOS

1. **IDOR en descargas de audio** — `server/routers.ts:50` (`getAudioDownloadUrl`): devolvía una URL firmada para *cualquier* `storageKey` sin verificar que el asset perteneciera al usuario. **CORREGIDO**: ahora consulta `getAudioAssetByKey(ownerId, storageKey)` y responde NOT_FOUND si no existe el asset del usuario (PR #1, commit 4dab7a8).
2. **Proxy de storage sin autenticación** — `server/_core/storageProxy.ts:5` (`GET /manus-storage/*`): firma y redirige (307) cualquier clave de storage solicitada. Debe validar que la clave corresponde a un recurso del dueño de la sesión antes de presignar (mismo principio que el punto 1). **No tocado** (riesgo de romper imágenes de `generated/`); recomendado como siguiente paso.
3. **`registerAudioAsset` sin verificación de propiedad de la clave** — `server/routers.ts:49`: acepta una `storageKey` arbitraria y la re-firma para verificar integridad; un cliente malicioso podría "adoptar" un asset ajeno si conoce su clave y checksum. Mitigación recomendada: exigir prefijo `audio/{ownerId}/` (claves emitidas solo por `prepareAudioUpload`). No corregido para no alterar el contrato de los tests existentes.
4. **SSRF potencial en el scraper** — `server/leadScraper.ts:49-51`: `scrapePublicPage` acepta URLs del usuario vía `createLeadSearch` y hace `fetch` server-side. Exige HTTPS pero no valida el host (permitiría hosts internos tipo `169.254.169.254`, `localhost`, rangos privados). Riesgo contenido por el modelo de dueño único, pero conviene bloquear IPs privadas/loopback.
5. **Telemetría que captura headers** — `client/public/__manus__/debug-collector.js`: se distribuye en producción y registra consola, red (headers/body de fetch y XHR) y eventos de UI hacia `/__manus__/logs`. Los *bodies* se sanitizan, pero los **headers de red no** (p. ej. `Authorization`). No hay endpoint registrado en el servidor (los POST caerían en el fallback estático), pero debería excluirse de builds de producción.

## Hallazgos MEDIOS

- **Placeholders de analytics indefinidos** — `client/index.html:20-23`: la etiqueta umami usa `%VITE_ANALYTICS_ENDPOINT%`/`%VITE_ANALYTICS_WEBSITE_ID%` sin valores; produce warning en el build y una etiqueta rota. Documentado en `.env.example` (opt-in).
- **Sin CI/CD**: no existe `.github/workflows/`, `.gitlab-ci.yml` ni `Jenkinsfile`. Un workflow mínimo (typecheck + test + build en PR) eliminaría la dependencia de verificaciones manuales.
- **Bug de filtrado de assets corregido** — `server/db.ts:131`: `listAudioAssets` recuperaba solo los 50 assets más recientes del propietario y luego filtraba por proyecto en memoria; con >50 assets globales, versiones antiguas de un proyecto podían desaparecer. **CORREGIDO**: filtrado `(ownerId, projectId)` en SQL.
- **Deduplicación no transaccional** — `server/db.ts:225-232`: el chequeo "consultar antes de insertar" no es seguro bajo concurrencia (dos refrescos simultáneos pueden insertar duplicados). Recomendado por el plan maestro: índice único compuesto `(ownerId, dedupeKey)` tratando la violación como duplicado.
- **Índices de base faltantes**: el plan maestro ya lista los índices compuestos necesarios (`(ownerId, dedupeKey)`, `(ownerId, searchId)`, etc.) y las migraciones 0000–0014 no los incluyen.
- **Sin paginación server-side** en `listLeadRecords` (top 500) ni en listas de assets/leads; degradará con volumen.
- **`.gitignore` reforzado** — se añadieron `*.pem`, `*.key`, `*.crt`, `credentials`, `secrets` y variantes `.env.*` (con `!.env.example`).

## Añadido por el auditor

Rama `agent/auditoria-2026-08-27` → PR #1 (3 commits):

1. `security: enforce ownership on audio download URLs` — `server/db.ts` (nuevo `getAudioAssetByKey`), `server/routers.ts:50` (check de propiedad + NOT_FOUND), y fix de `listAudioAssets` con filtrado SQL; mock añadido en `workspace-router.test.ts`.
2. `chore: ignore secrets and document required env vars` — `.gitignore` + nuevo `.env.example` (sin valores reales).
3. `docs: expand README with stack, scripts and audit references`.

Verificación ejecutada en el clon: `pnpm check` OK · `pnpm test` 55/55 OK (15 suítes) · `pnpm build` OK (vite + esbuild; warning preexistente de `%VITE_ANALYTICS_*%`).

## Próximos pasos recomendados

1. Autenticar `GET /manus-storage/*` (validar recurso→dueño por sesión cookie) y exigir prefijo `audio/{ownerId}/` en `registerAudioAsset`.
2. Bloquear IPs privadas/loopback en `leadScraper.ts` y añadir política por fuente, robots.txt y límites diarios del plan maestro.
3. Índice único `(ownerId, dedupeKey)` con manejo de violación como duplicado; añadir el resto de índices compuestos de la Fase P0.
4. Crear `.github/workflows/ci.yml` (pnpm install --frozen-lockfile + check + test + build).
5. Excluir `client/public/__manus__/debug-collector.js` de builds de producción o servir `/__manus__/logs` solo en desarrollo.
6. Paginación server-side para `leads` y filtros persistentes (Fase P1 del plan maestro).

## No tocado (pero anotado)

- `magic/` (plugin de opencode `/immersive`, HTML inmótico, lore) — contenido intencional del ecosistema, sin llamadas externas ni credenciales.
- `AUDITORIA-ESCOPO-E-ACHADOS.md` / `AUDITORIA-PESADA-2026-08-23.md` / `PLANO-MESTRE-10-10.md` — documentos del proyecto, intactos.
- `server/_core/llm.ts`, `imageGeneration.ts`, `voiceTranscription.ts`, `dataApi.ts`, `map.ts` — utilidades del template Manus con backoff y validación decentes; no expuestas en el router.
- SQL migraciones (`drizzle/*.sql`) — sin secretos; no se modificaron.
- Sin commits forzados ni push directo a `main`; la rama de trabajo quedó como PR preservando el historial original.