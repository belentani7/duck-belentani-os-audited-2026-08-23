# DUCK Belentani OS — snapshot auditado 2026-08-23

Snapshot auditado del sistema operativo creativo Belentani (2026-08-23).

## Contenido
- Código TypeScript del ecosistema creativo
- Estado congelado a fecha 2026-08-23 para referencia

## Stack
- Frontend: React 19 + Vite 7 + Tailwind CSS 4 + shadcn/ui (Radix) + wouter
- Backend: Node 24 + Express 4 + tRPC 11 (tRPC + zod + superjson)
- Persistencia: MySQL (drizzle-orm + drizzle-kit), migraciones en `drizzle/`
- Storage: objetos en S3 vía Forge (URLs firmadas), análisis de audio en el navegador
- Automatización: Heartbeat (cron HTTP, callback solo-cron) para refresco de leads
- Tests: Vitest 2 (unit, HTTP y autorización)

## Uso
Explorar por módulos; este snapshot es de referencia y no recibe actualizaciones (ver repos activos del ecosistema DUCK).

Para reproducir localmente:

```bash
pnpm install          # instala según pnpm-lock.yaml (frozen en CI)
cp .env.example .env  # VITE_APP_ID, JWT_SECRET, DATABASE_URL, OAUTH_SERVER_URL, etc.
pnpm dev              # entorno de desarrollo (Vite + API, puerto 3000)
pnpm build            # build de producción (client + server)
pnpm start            # sirve el build en producción
pnpm check            # typecheck (tsc --noEmit)
pnpm test             # suite Vitest completa
pnpm db:push          # genera + aplica migraciones Drizzle
```

## Referencia de auditoría
- `AUDITORIA-ESCOPO-E-ACHADOS.md` — alcance y hallazgos de la auditoría integral
- `AUDITORIA-PESADA-2026-08-23.md` — auditoría profunda de código, banco y seguridad
- `PLANO-MESTRE-10-10.md` — plan maestro de evolución priorizado
- `docs/OPERACAO-E-INTEGRACOES.md` — operación y próximas integraciones
