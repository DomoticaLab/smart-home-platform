# Estrategia de Ramas

Este repositorio usa una variante simplificada de **Git Flow** adaptada a un equipo pequeño con despliegues frecuentes.

## Ramas permanentes

| Rama     | Propósito                                                              |
| -------- | ---------------------------------------------------------------------- |
| `main`   | Producción. Refleja el estado desplegable en todo momento.             |
| `develop`| Integración. Rama principal de trabajo. Acumula features listas.       |

## Ramas temporales

| Prefijo         | Uso                                                            | Ejemplo                          |
| --------------- | -------------------------------------------------------------- | -------------------------------- |
| `feature/*`     | Nuevas funcionalidades listas para merge a `develop`.          | `feature/quote-wizard`           |
| `fix/*`         | Correcciones de bugs que van a `develop`.                      | `fix/pricing-calculation`        |
| `chore/*`       | Mantenimiento: deps, configs, scripts, refactors menores.      | `chore/update-deps`              |
| `release/*`     | (Opcional) Preparación de una release a `main`.                | `release/2026-q2`                |
| `hotfix/*`      | (Opcional) Fix urgente que va directo a `main` desde `main`.   | `hotfix/login-crash`             |

> Los nombres de las ramas temporales van en **kebab-case** y, preferentemente, en **inglés** para consistencia con el código. La descripción del commit va en español (ver `COMMIT_CONVENTION.md`).

## Reglas de oro

1. **Nunca hacer push directo a `main` ni a `develop`.**
   - Todo cambio entra por un PR desde una rama temporal.
2. **PRs requieren al menos 1 review** antes de mergear.
   - El revisor debe validar: build limpio, typecheck, tests pasando, y cumplimiento de las convenciones del repo.
3. **`main` se mergea sólo desde `develop` (o desde `hotfix/*` en emergencias) mediante PR.**
4. **Las ramas `feature/*`, `fix/*` y `chore/*` se borran después del merge** (usar el botón de GitHub "Delete branch" o `git push origin --delete <rama>`).
5. **Mantener `develop` siempre compilable.** Antes de abrir un PR a `develop`, correr:
   ```bash
   npm run build:backend
   npm run build:frontend
   npm test
   ```
6. **Commits en el código van en inglés; los mensajes de commit en español.**

## Flujo de trabajo típico

```text
main
  │
  ├── develop
  │     │
  │     ├── feature/quote-wizard        ─┐
  │     │     commits: feat(frontend)... │
  │     │                                │  PR + 1 review
  │     │   ────────────────────────────►│
  │     │                                │
  │     ├── fix/pricing-calculation     ─┘
  │     │     commits: fix(backend)...
  │     │
  │     ...
  │
  └── (release) ──► main vía PR
```

### Ejemplo paso a paso

```bash
# 1. Actualizar develop y crear rama de feature
git checkout develop
git pull origin develop
git checkout -b feature/quote-wizard

# 2. Trabajar + commits atómicos en español
git add .
git commit -m "feat(frontend): agregar wizard de cotización paso 1"

# 3. Push y abrir PR a develop
git push origin feature/quote-wizard
# Abrir PR en GitHub apuntando a develop

# 4. Después del merge aprobado, limpiar
git checkout develop
git pull origin develop
git branch -d feature/quote-wizard
git push origin --delete feature/quote-wizard
```

## Mensaje en código vs. mensaje de commit

| Elemento                                          | Idioma  |
| ------------------------------------------------- | ------- |
| Identificadores, nombres de variables y funciones  | Inglés  |
| Comentarios en el código                          | Español |
| Mensajes de commit                                | Español |
| Documentación (`README.md`, `.github/`)           | Español |
| Mensajes de log de la aplicación                  | Inglés  |
| Mensajes de error visibles al usuario final       | Español |

## Protecciones recomendadas en GitHub

Configurar en **Settings → Branches → Branch protection rules**:

- **`main`**:
  - Require pull request before merging
  - Require approvals: 1
  - Dismiss stale pull request approvals when new commits are pushed
  - Require status checks to pass (CI: build, test)
  - Do not allow force pushes
  - Do not allow deletions
- **`develop`**:
  - Require pull request before merging
  - Require approvals: 1
  - Do not allow force pushes
  - Allow deletions: ❌ (sólo se borran las ramas temporales, no `develop`)
