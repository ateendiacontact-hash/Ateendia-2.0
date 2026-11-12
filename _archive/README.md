# _archive/ - Archivos Historicos de Ateendia CRM 2.0

**Fecha de archivado:** 2026-11-12 (Sesion #35 - Fase 3.5.F.5)
**Razon:** Limpieza de deuda tecnica. Estos archivos NO estan en uso activo, pero se conservan por referencia historica.

## Contenido

### functions/
Codigo de Cloudflare Workers de una version anterior del proyecto.
Fue reemplazado por la arquitectura actual (Express + VPS).

### src/index.ts
Entry point viejo del frontend. El actual es src/main.tsx (usado por Vite).
Se archivo para evitar confusiones sobre cual es el punto de entrada real.

### src/lib/
Librerias del frontend antiguo. Reemplazadas por los servicios actuales en src/services/.

## Importante

- NO importar nada de esta carpeta desde el codigo activo.
- NO modificar estos archivos (son snapshot historico).
- Si necesitas recuperar algo de aqui, copialo al lugar activo, no lo importes directamente.
- El backup completo de la F.5 esta en backup_legacy_F5_20261112_113501.zip (en la raiz, ignorado por Git).
