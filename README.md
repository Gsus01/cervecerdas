# Cervecerdas

Cervecerdas es una aplicación web para organizar quedadas privadas, registrar sus consumiciones y comparar la actividad de cada evento mediante rankings y gráficas interactivas. Cada usuario también conserva estadísticas personales que agregan su historial de todos los eventos.

El repositorio contiene un MVP full-stack listo para ejecutarse en local. La aplicación y su API comparten un proyecto Next.js; PostgreSQL se mantiene como servicio independiente y todas las mutaciones importantes se realizan en el servidor.

> Cervecerdas contabiliza consumiciones, no las incentiva. Disfruta con responsabilidad.

## Tecnologías

- Next.js 16 con App Router y Route Handlers.
- React 19 y TypeScript estricto.
- Tailwind CSS y componentes locales compatibles con shadcn/ui.
- PostgreSQL 17.
- Drizzle ORM y Drizzle Kit.
- Zod para validación compartida entre cliente y servidor.
- Auth.js/NextAuth con sesión JWT en cookie `httpOnly`.
- BCrypt para contraseñas.
- Vitest + Testing Library y Playwright.
- Docker y Docker Compose.
- OpenAPI 3.1.

No se utiliza Java. Next.js sirve tanto la interfaz como los endpoints, por lo que el despliegue necesita dos servicios (`web` y `database`) en lugar de un frontend y un backend duplicados.

## Funcionalidades del MVP

- Registro con nombre, correo, contraseña y confirmación.
- Unicidad de usuario y correo sin distinguir mayúsculas/minúsculas.
- Login y logout mediante Auth.js.
- Rutas privadas con redirección al login.
- Registro transaccional de una consumición para el usuario de la sesión y el evento seleccionado.
- Catálogo compartido entre eventos: cualquier usuario autenticado puede añadir tipos de bebida con nombre y foto.
- Rol de administrador con gestión de registros, cantidades, usuarios asociados y eliminación de tipos.
- Selección obligatoria del tipo al registrar una bebida.
- Incremento atómico del contador y evento `BEER_ADDED` en la misma transacción.
- Protección frente a dobles pulsaciones mientras una petición está en curso.
- Historial en UTC, ordenado de más reciente a más antiguo y paginado.
- Fechas convertidas a la zona horaria del navegador.
- Dashboard personal de estadísticas por cantidad, tipo, día y hora local.
- Comparativa semanal y tendencia de actividad de los últimos 14 días.
- Eventos privados con duración, creador y acceso mediante código o enlace.
- Contador contextualizado por evento y registro limitado a sus participantes mientras está en curso.
- Rankings independientes, evolución acumulada por participante y matriz de usuarios por bebida.
- Distribución por hora, desglose por tipo y filtros combinables en la analítica del evento.
- Actividad reciente del evento paginada.
- Estadísticas personales generales que combinan las consumiciones de todos los eventos.
- Ranking descendente con desempate alfabético.
- Estados de carga, éxito, error, sesión caducada y listas vacías.
- Diseño responsive, navegación por teclado y mensajes accesibles.
- Especificación OpenAPI disponible desde la propia aplicación.

## Estructura

```text
cervecerdas/
├── app/
│   ├── api/                 # Route Handlers REST y Auth.js
│   ├── docs/                # documentación humana de la API
│   ├── events/              # listado y dashboards privados de eventos
│   ├── home/                # dashboard privado
│   ├── login/
│   └── register/
├── components/
│   ├── auth/                # formularios y layout de acceso
│   ├── dashboard/           # contador, ranking e historial
│   ├── events/              # creación, acceso y analítica de quedadas
│   ├── layout/
│   └── ui/                  # componentes base estilo shadcn
├── db/
│   ├── index.ts             # conexión Drizzle/PostgreSQL
│   └── schema.ts            # modelo tipado
├── drizzle/                 # migraciones SQL versionadas
├── e2e/                     # pruebas Playwright
├── lib/
│   ├── auth/
│   ├── http/
│   ├── services/
│   ├── types/
│   └── validation/
├── tests/                   # pruebas Vitest
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

## Requisitos previos

### Con Docker

- Docker Engine o Docker Desktop con Docker Compose v2.

### Sin Docker

- Node.js 22 o superior.
- npm 10 o superior.
- PostgreSQL 16 o 17.

## Variables de entorno

Copia el ejemplo y sustituye, como mínimo, la contraseña de PostgreSQL y el secreto de autenticación:

```bash
cp .env.example .env
openssl rand -base64 32
```

| Variable | Uso | Ejemplo local |
| --- | --- | --- |
| `POSTGRES_DB` | Base creada por el contenedor | `cervecerdas` |
| `POSTGRES_USER` | Usuario de PostgreSQL | `cervecerdas` |
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL | Cambiar el ejemplo |
| `POSTGRES_PORT` | Puerto publicado de PostgreSQL | `5432` |
| `DATABASE_URL` | Conexión usada por Drizzle | `postgresql://...` |
| `AUTH_SECRET` | Firma y cifrado de la sesión | Mínimo 32 caracteres aleatorios |
| `NEXTAUTH_URL` | URL pública de la aplicación | `http://localhost:3000` |
| `SESSION_MAX_AGE_SECONDS` | Duración de la sesión | `604800` (7 días) |
| `APP_PORT` | Puerto web publicado por Compose | `3000` |

`.env` está ignorado por Git. `.env.example` solo contiene valores de desarrollo y ningún secreto real.

## Ejecución con Docker

```bash
cp .env.example .env
# Edita .env antes de continuar
docker compose up --build
```

El contenedor web espera al healthcheck de PostgreSQL, aplica las migraciones de Drizzle y después arranca Next.js.

- Aplicación: <http://localhost:3000>
- Documentación: <http://localhost:3000/docs>
- OpenAPI JSON: <http://localhost:3000/api/openapi>
- PostgreSQL: `localhost:${POSTGRES_PORT:-5432}`

Para detener los contenedores conservando los datos:

```bash
docker compose down
```

`docker compose down -v` también elimina el volumen y todos los datos locales.

## Ejecución sin Docker

1. Crea una base PostgreSQL vacía y un usuario con permisos sobre ella.
2. Copia `.env.example` a `.env` y adapta `DATABASE_URL`.
3. Instala dependencias, migra y arranca:

```bash
npm install
npm run db:migrate
npm run dev
```

La aplicación estará en <http://localhost:3000>. Drizzle carga automáticamente `.env` al ejecutar sus comandos.

Comandos de base de datos adicionales:

```bash
npm run db:generate   # genera una migración después de cambiar db/schema.ts
npm run db:studio     # abre el explorador local de Drizzle
```

### Crear el primer administrador

Después de aplicar las migraciones, crea una cuenta administrativa con:

```bash
npm run admin:create -- --username admin --email admin@example.com --password 'una-clave-segura'
```

Si ya existe una cuenta con ese correo, el comando conserva su nombre e historial, actualiza la contraseña indicada y la convierte en administradora. No hay ninguna contraseña administrativa predeterminada.

## API

| Método | Ruta | Sesión | Descripción |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | No | Registra un usuario |
| `GET/POST` | `/api/auth/*` | No | Endpoints internos de Auth.js |
| `GET` | `/api/users/me` | Sí | Devuelve el perfil actual |
| `GET` | `/api/beer-types` | Sí | Devuelve los tipos de bebida compartidos |
| `POST` | `/api/beer-types` | Sí | Añade al catálogo compartido un tipo con nombre y foto |
| `DELETE` | `/api/beer-types/:id` | Admin | Elimina un tipo conservando el historial |
| `GET` | `/api/admin/overview` | Admin | Devuelve usuarios y registros administrables |
| `PATCH/DELETE` | `/api/admin/logs/:id` | Admin | Corrige o elimina un registro y recalcula totales |
| `GET` | `/api/beers/statistics?timeZone=Europe%2FMadrid` | Sí | Devuelve estadísticas personales |
| `GET/POST` | `/api/events` | Sí | Lista o crea eventos privados |
| `POST` | `/api/events/join` | Sí | Une al usuario mediante un código |
| `GET` | `/api/events/:id?timeZone=Europe%2FMadrid&beerTypeIds=...,...&page=0&size=12` | Miembro | Devuelve ranking, gráficas, desglose y actividad reciente filtrados |
| `POST` | `/api/events/:id/beers` | Miembro | Registra una consumición durante el evento |
| `GET` | `/api/health` | No | Healthcheck del proceso web |
| `GET` | `/api/openapi` | No | Especificación OpenAPI 3.1 |

El login de la interfaz usa el proveedor de credenciales de Auth.js. La cookie de sesión se envía automáticamente a los endpoints del mismo origen; no se guarda ningún token en `localStorage`.

Los errores propios de la API tienen una forma consistente:

```json
{
  "timestamp": "2026-07-17T19:35:00.000Z",
  "status": 400,
  "error": "Validation error",
  "message": "Revisa los datos enviados",
  "path": "/api/auth/register",
  "fieldErrors": {
    "email": ["El correo electrónico no es válido"]
  }
}
```

## Modelo de datos

`users` contiene UUID, usuario `citext`, correo `citext`, hash BCrypt, contador y fechas de creación/actualización. `beer_types` guarda un nombre único y una foto JPG, PNG o WebP de hasta 1 MB. `events` guarda creador, nombre, código privado e intervalo de duración; `event_members` limita cada evento a sus participantes. `beer_logs` contiene UUID, usuario, tipo de bebida, evento opcional, acción, cantidad y fecha. La relación opcional con el evento conserva íntegros los registros históricos anteriores a esta funcionalidad; las nuevas consumiciones solo se crean desde un evento en curso.

La migración impone en PostgreSQL:

- Campos obligatorios no nulos.
- Usuario y correo únicos sin distinguir mayúsculas.
- `beer_count >= 0`.
- `quantity > 0`.
- Claves foráneas del evento y sus miembros a los usuarios.
- Claves foráneas opcionales del registro al evento y al tipo de bebida.
- Índices para ranking, historial y relaciones por usuario y tipo.
- Duración de evento válida, código de invitación único y una sola membresía por usuario/evento.

## Seguridad y decisiones técnicas

- El servidor ignora cualquier ID enviado al registrar una cerveza y obtiene el usuario de la sesión.
- Los eventos no se enumeran públicamente: su detalle exige membresía y el código solo se devuelve al creador.
- El servidor comprueba membresía y duración antes de asociar una consumición a un evento.
- No existe un ranking ni un historial global entre usuarios: cada comparación compartida queda limitada a los miembros de un evento.
- Auth.js firma una sesión JWT y la mantiene en una cookie `httpOnly`; el navegador no puede leerla desde JavaScript.
- Las contraseñas se validan con un máximo de 72 caracteres y se hashean con BCrypt, coste 12.
- Las búsquedas de login comparan también contra un hash ficticio cuando el usuario no existe, reduciendo diferencias temporales obvias.
- El contador usa `beer_count = beer_count + 1`, una actualización atómica de PostgreSQL.
- Contador e historial se escriben en una sola transacción de Drizzle.
- Al ser una aplicación de mismo origen no se envían cabeceras CORS; otros orígenes no reciben permiso del navegador.
- Las consultas devuelven DTOs explícitos y nunca exponen `password_hash`.
- Las fechas se guardan como `timestamp with time zone` y se serializan en ISO 8601.
- El desempate del MVP es alfabético por nombre de usuario.
- El Dockerfile genera la salida `standalone` de Next.js para poder desplegarla detrás de un proxy HTTPS.

Antes de producción se debe cambiar todos los secretos, usar TLS, retirar la publicación del puerto de PostgreSQL, configurar copias de seguridad y revisar límites de peticiones.

## Pruebas y calidad

Pruebas unitarias y de componentes:

```bash
npm test
```

Comprobaciones estáticas y build de producción:

```bash
npm run typecheck
npm run lint
npm run build
npx drizzle-kit check
```

Las pruebas de Playwright necesitan la aplicación y PostgreSQL en ejecución:

```bash
npx playwright install chromium
docker compose up -d --build
npm run test:e2e
```

La suite E2E crea un usuario único, inicia sesión, crea un evento activo, añade un tipo de bebida, registra una consumición y comprueba el contador, la analítica del evento y las estadísticas personales.

## Datos de demostración

El MVP no inyecta usuarios ni contraseñas por defecto. Las pruebas E2E crean sus propios datos con identificadores únicos. Esto evita que un seed de desarrollo pueda activarse accidentalmente en producción.

## Futuras mejoras

- Eliminar o corregir un registro con auditoría.
- Añadir diferentes tipos de bebida y cantidades.
- Retos semanales o mensuales.
- Estadísticas por día, semana y mes.
- Logros y avatares.
- Idempotencia mediante clave de petición para reintentos de red.
- Rate limiting para registro, login y contador.
- Recuperación de contraseña y verificación de correo.
- WebSockets o Server-Sent Events para actualizar el ranking en tiempo real.
- Despliegue en un servidor con CI/CD, TLS, observabilidad y copias de seguridad.
