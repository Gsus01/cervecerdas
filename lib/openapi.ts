export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Cervecerdas API",
    version: "0.5.0",
    description:
      "API de Cervecerdas para eventos privados, consumiciones y estadísticas personales. La autenticación usa una cookie de sesión JWT gestionada por Auth.js.",
  },
  servers: [{ url: "http://localhost:3000", description: "Entorno local" }],
  tags: [
    { name: "Auth" },
    { name: "Users" },
    { name: "Beers" },
    { name: "Beer types" },
    { name: "Events" },
    { name: "Admin" },
    { name: "System" },
  ],
  paths: {
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Registrar una cuenta",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Usuario creado",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/User" } },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "409": { $ref: "#/components/responses/Conflict" },
        },
      },
    },
    "/api/users/me": {
      get: {
        tags: ["Users"],
        summary: "Obtener el usuario autenticado",
        responses: {
          "200": {
            description: "Usuario autenticado",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/User" } },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/beer-types": {
      get: {
        tags: ["Beer types"],
        summary: "Consultar los tipos de cerveza disponibles",
        responses: {
          "200": {
            description: "Tipos ordenados por nombre",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/BeerType" },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      post: {
        tags: ["Beer types"],
        summary: "Añadir un tipo al catálogo compartido",
        description:
          "Cualquier usuario autenticado puede crear un tipo, disponible después en todos los eventos.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateBeerTypeRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Tipo creado",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/BeerType" } },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "409": { $ref: "#/components/responses/Conflict" },
        },
      },
    },
    "/api/beer-types/{id}": {
      delete: {
        tags: ["Beer types"],
        summary: "Eliminar un tipo de bebida (administrador)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "Tipo eliminado; sus registros conservan la cantidad" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/admin/overview": {
      get: {
        tags: ["Admin"],
        summary: "Consultar usuarios y registros administrables",
        responses: {
          "200": { description: "Resumen administrativo" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/admin/logs/{id}": {
      patch: {
        tags: ["Admin"],
        summary: "Cambiar usuario, bebida, cantidad o fecha de un registro",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateBeerLogRequest" } } },
        },
        responses: {
          "200": { description: "Registro y contadores actualizados" },
          "400": { $ref: "#/components/responses/BadRequest" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Admin"],
        summary: "Eliminar un registro y recalcular el contador",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "Registro eliminado" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/beers/statistics": {
      get: {
        tags: ["Beers"],
        summary: "Consultar las estadísticas del usuario autenticado",
        parameters: [
          {
            name: "timeZone",
            in: "query",
            description: "Zona horaria IANA usada para agrupar días y horas",
            schema: { type: "string", default: "UTC", examples: ["Europe/Madrid"] },
          },
        ],
        responses: {
          "200": {
            description: "Resumen y distribuciones del historial personal",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BeerStatistics" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/events": {
      get: {
        tags: ["Events"],
        summary: "Listar los eventos privados del usuario",
        responses: {
          "200": {
            description: "Eventos creados o a los que pertenece",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/EventSummary" },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      post: {
        tags: ["Events"],
        summary: "Crear un evento privado",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateEventRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Evento creado y creador añadido como miembro",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/EventSummary" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/events/join": {
      post: {
        tags: ["Events"],
        summary: "Unirse a un evento mediante su código privado",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/JoinEventRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Membresía creada o ya existente",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/EventSummary" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/events/{id}": {
      get: {
        tags: ["Events"],
        summary: "Consultar la analítica de un evento privado",
        description:
          "Solo los miembros pueden acceder. Los filtros se aplican al ranking, la evolución acumulada, los desgloses, la distribución horaria y la actividad reciente.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
          {
            name: "beerTypeId",
            in: "query",
            deprecated: true,
            description:
              "Filtro singular conservado por compatibilidad; se puede repetir.",
            schema: { type: "string", format: "uuid" },
          },
          {
            name: "beerTypeIds",
            in: "query",
            description:
              "Hasta 20 UUID separados por comas o repitiendo el parámetro. Si se omite, se incluyen todas las bebidas.",
            style: "form",
            explode: false,
            schema: {
              type: "array",
              maxItems: 20,
              items: { type: "string", format: "uuid" },
            },
          },
          {
            name: "page",
            in: "query",
            description: "Página de la actividad reciente",
            schema: { type: "integer", minimum: 0, default: 0 },
          },
          {
            name: "size",
            in: "query",
            description: "Registros recientes por página",
            schema: {
              type: "integer",
              minimum: 1,
              maximum: 50,
              default: 12,
            },
          },
          {
            name: "timeZone",
            in: "query",
            description:
              "Zona horaria IANA usada en horas y etiquetas de las gráficas",
            schema: {
              type: "string",
              default: "Europe/Madrid",
              examples: ["Europe/Madrid"],
            },
          },
        ],
        responses: {
          "200": {
            description:
              "Ranking, evolución, desgloses y actividad reciente filtrados",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/EventDashboard" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/events/{id}/beers": {
      post: {
        tags: ["Events"],
        summary: "Registrar una consumición dentro de un evento activo",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AddBeerRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Consumición añadida al total y al evento",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BeerAdded" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/health": {
      get: {
        tags: ["System"],
        summary: "Comprobar que el proceso web está disponible",
        responses: { "200": { description: "Proceso disponible" } },
      },
    },
  },
  components: {
    schemas: {
      RegisterRequest: {
        type: "object",
        required: ["username", "email", "password", "confirmPassword"],
        properties: {
          username: { type: "string", maxLength: 50, examples: ["Carlos"] },
          email: { type: "string", format: "email" },
          password: { type: "string", format: "password", minLength: 8, maxLength: 72 },
          confirmPassword: { type: "string", format: "password" },
        },
      },
      User: {
        type: "object",
        required: ["id", "username", "email", "role", "beerCount", "createdAt", "updatedAt"],
        properties: {
          id: { type: "string", format: "uuid" },
          username: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["USER", "ADMIN"] },
          beerCount: { type: "integer", minimum: 0 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      RankingEntry: {
        type: "object",
        required: ["position", "userId", "username", "beerCount"],
        properties: {
          position: { type: "integer", minimum: 1 },
          userId: { type: "string", format: "uuid" },
          username: { type: "string" },
          beerCount: { type: "integer", minimum: 0 },
        },
      },
      BeerLog: {
        type: "object",
        required: [
          "id",
          "userId",
          "username",
          "actionType",
          "quantity",
          "beerType",
          "createdAt",
        ],
        properties: {
          id: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          username: { type: "string" },
          actionType: { type: "string", enum: ["BEER_ADDED"] },
          quantity: { type: "integer", minimum: 1, maximum: 1000 },
          beerType: {
            anyOf: [
              { $ref: "#/components/schemas/BeerType" },
              { type: "null" },
            ],
          },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      AddBeerRequest: {
        type: "object",
        required: ["beerTypeId"],
        properties: {
          beerTypeId: { type: "string", format: "uuid" },
        },
      },
      UpdateBeerLogRequest: {
        type: "object",
        required: ["userId", "beerTypeId", "quantity", "createdAt"],
        properties: {
          userId: { type: "string", format: "uuid" },
          beerTypeId: { type: "string", format: "uuid" },
          quantity: { type: "integer", minimum: 1, maximum: 1000 },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      BeerType: {
        type: "object",
        required: ["id", "name", "photoDataUrl", "createdAt"],
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", maxLength: 50 },
          photoDataUrl: {
            type: "string",
            pattern: "^data:image/(jpeg|png|webp);base64,",
          },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      CreateBeerTypeRequest: {
        type: "object",
        required: ["name", "photoDataUrl"],
        properties: {
          name: { type: "string", minLength: 1, maxLength: 50 },
          photoDataUrl: { type: "string", maxLength: 1400000 },
        },
      },
      BeerAdded: {
        type: "object",
        required: ["beerCount", "log"],
        properties: {
          beerCount: { type: "integer", minimum: 1 },
          log: { $ref: "#/components/schemas/BeerLog" },
        },
      },
      BeerLogPage: {
        type: "object",
        required: ["content", "page", "size", "totalElements", "totalPages"],
        properties: {
          content: {
            type: "array",
            items: { $ref: "#/components/schemas/BeerLog" },
          },
          page: { type: "integer", minimum: 0 },
          size: { type: "integer", minimum: 1 },
          totalElements: { type: "integer", minimum: 0 },
          totalPages: { type: "integer", minimum: 0 },
        },
      },
      StatisticCount: {
        type: "object",
        required: ["key", "label", "count"],
        properties: {
          key: { type: "string" },
          label: { type: "string" },
          count: { type: "integer", minimum: 0 },
        },
      },
      BeerTypeStatistic: {
        allOf: [
          { $ref: "#/components/schemas/StatisticCount" },
          {
            type: "object",
            required: ["beerTypeId", "photoDataUrl", "percentage"],
            properties: {
              beerTypeId: {
                anyOf: [{ type: "string", format: "uuid" }, { type: "null" }],
              },
              photoDataUrl: {
                anyOf: [{ type: "string" }, { type: "null" }],
              },
              percentage: { type: "integer", minimum: 0, maximum: 100 },
            },
          },
        ],
      },
      BeerStatistics: {
        type: "object",
        required: [
          "totalBeers",
          "activeDays",
          "averagePerActiveDay",
          "varietyCount",
          "last7Days",
          "previous7Days",
          "recentTrendPercentage",
          "favoriteType",
          "favoriteHour",
          "byType",
          "byWeekday",
          "byTimeRange",
          "last14Days",
          "timeZone",
          "generatedAt",
        ],
        properties: {
          totalBeers: { type: "integer", minimum: 0 },
          activeDays: { type: "integer", minimum: 0 },
          averagePerActiveDay: { type: "number", minimum: 0 },
          varietyCount: { type: "integer", minimum: 0 },
          last7Days: { type: "integer", minimum: 0 },
          previous7Days: { type: "integer", minimum: 0 },
          recentTrendPercentage: {
            anyOf: [{ type: "integer" }, { type: "null" }],
          },
          favoriteType: {
            anyOf: [
              { $ref: "#/components/schemas/BeerTypeStatistic" },
              { type: "null" },
            ],
          },
          favoriteHour: {
            anyOf: [
              { $ref: "#/components/schemas/StatisticCount" },
              { type: "null" },
            ],
          },
          byType: {
            type: "array",
            items: { $ref: "#/components/schemas/BeerTypeStatistic" },
          },
          byWeekday: {
            type: "array",
            items: { $ref: "#/components/schemas/StatisticCount" },
          },
          byTimeRange: {
            type: "array",
            items: { $ref: "#/components/schemas/StatisticCount" },
          },
          last14Days: {
            type: "array",
            items: { $ref: "#/components/schemas/StatisticCount" },
          },
          timeZone: { type: "string", examples: ["Europe/Madrid"] },
          generatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateEventRequest: {
        type: "object",
        required: ["name", "startsAt", "endsAt"],
        properties: {
          name: { type: "string", minLength: 1, maxLength: 80 },
          startsAt: { type: "string", format: "date-time" },
          endsAt: { type: "string", format: "date-time" },
        },
      },
      JoinEventRequest: {
        type: "object",
        required: ["code"],
        properties: {
          code: {
            type: "string",
            minLength: 10,
            maxLength: 10,
            pattern: "^[A-Z0-9]+$",
          },
        },
      },
      EventSummary: {
        type: "object",
        required: [
          "id",
          "name",
          "startsAt",
          "endsAt",
          "status",
          "isCreator",
          "inviteCode",
          "memberCount",
          "totalBeers",
        ],
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          startsAt: { type: "string", format: "date-time" },
          endsAt: { type: "string", format: "date-time" },
          status: {
            type: "string",
            enum: ["UPCOMING", "ACTIVE", "FINISHED"],
          },
          isCreator: { type: "boolean" },
          inviteCode: {
            anyOf: [{ type: "string", minLength: 10, maxLength: 10 }, { type: "null" }],
          },
          memberCount: { type: "integer", minimum: 1 },
          totalBeers: {
            type: "integer",
            minimum: 0,
            description: "Total completo del evento, independiente de los filtros",
          },
        },
      },
      EventTimelinePoint: {
        type: "object",
        required: ["key", "label", "startsAt", "endsAt"],
        properties: {
          key: { type: "string", format: "date-time" },
          label: { type: "string" },
          startsAt: { type: "string", format: "date-time" },
          endsAt: { type: "string", format: "date-time" },
        },
      },
      EventTimelineSeries: {
        type: "object",
        required: ["key", "label", "userId", "values", "total"],
        properties: {
          key: { type: "string", format: "uuid" },
          label: { type: "string" },
          userId: { type: "string", format: "uuid" },
          values: {
            type: "array",
            description:
              "Totales acumulados, alineados por posición con los puntos de la timeline",
            items: { type: "integer", minimum: 0 },
          },
          total: { type: "integer", minimum: 0 },
        },
      },
      EventTimeline: {
        type: "object",
        required: ["bucketMinutes", "points", "series"],
        properties: {
          bucketMinutes: { type: "integer", minimum: 1 },
          points: {
            type: "array",
            minItems: 1,
            maxItems: 48,
            items: { $ref: "#/components/schemas/EventTimelinePoint" },
          },
          series: {
            type: "array",
            items: { $ref: "#/components/schemas/EventTimelineSeries" },
          },
        },
      },
      EventBeverageTotal: {
        type: "object",
        required: [
          "key",
          "beerTypeId",
          "name",
          "photoDataUrl",
          "total",
          "percentage",
        ],
        properties: {
          key: { type: "string" },
          beerTypeId: {
            anyOf: [{ type: "string", format: "uuid" }, { type: "null" }],
          },
          name: { type: "string" },
          photoDataUrl: {
            anyOf: [{ type: "string" }, { type: "null" }],
          },
          total: { type: "integer", minimum: 0 },
          percentage: { type: "integer", minimum: 0, maximum: 100 },
        },
      },
      EventParticipantBreakdown: {
        type: "object",
        required: ["userId", "username", "total", "values"],
        properties: {
          userId: { type: "string", format: "uuid" },
          username: { type: "string" },
          total: { type: "integer", minimum: 0 },
          values: {
            type: "array",
            description:
              "Cantidades alineadas por posición con beverageTotals",
            items: { type: "integer", minimum: 0 },
          },
        },
      },
      EventDashboard: {
        type: "object",
        required: [
          "event",
          "ranking",
          "hourlyConsumption",
          "timeline",
          "beverageTotals",
          "participantBreakdown",
          "recentLogs",
          "filteredTotal",
          "selectedBeerTypeId",
          "selectedBeerTypeIds",
          "timeZone",
          "generatedAt",
        ],
        properties: {
          event: { $ref: "#/components/schemas/EventSummary" },
          ranking: {
            type: "array",
            description: "Clasificación resultante de los filtros aplicados",
            items: { $ref: "#/components/schemas/RankingEntry" },
          },
          hourlyConsumption: {
            type: "array",
            minItems: 24,
            maxItems: 24,
            items: { $ref: "#/components/schemas/StatisticCount" },
          },
          timeline: { $ref: "#/components/schemas/EventTimeline" },
          beverageTotals: {
            type: "array",
            items: { $ref: "#/components/schemas/EventBeverageTotal" },
          },
          participantBreakdown: {
            type: "array",
            description:
              "Matriz participante por bebida; cada values se alinea con beverageTotals",
            items: {
              $ref: "#/components/schemas/EventParticipantBreakdown",
            },
          },
          recentLogs: {
            description: "Actividad reciente resultante de los filtros",
            $ref: "#/components/schemas/BeerLogPage",
          },
          filteredTotal: {
            type: "integer",
            minimum: 0,
            description: "Total resultante de los filtros aplicados",
          },
          selectedBeerTypeId: {
            deprecated: true,
            description: "Primer filtro seleccionado, conservado por compatibilidad",
            anyOf: [{ type: "string", format: "uuid" }, { type: "null" }],
          },
          selectedBeerTypeIds: {
            type: "array",
            maxItems: 20,
            uniqueItems: true,
            items: { type: "string", format: "uuid" },
          },
          timeZone: { type: "string", examples: ["Europe/Madrid"] },
          generatedAt: { type: "string", format: "date-time" },
        },
      },
      ApiError: {
        type: "object",
        required: ["timestamp", "status", "error", "message", "path"],
        properties: {
          timestamp: { type: "string", format: "date-time" },
          status: { type: "integer" },
          error: { type: "string" },
          message: { type: "string" },
          path: { type: "string" },
          fieldErrors: {
            type: "object",
            additionalProperties: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
    responses: {
      BadRequest: {
        description: "Petición o validación incorrecta",
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/ApiError" } },
        },
      },
      Unauthorized: {
        description: "Sesión no válida",
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/ApiError" } },
        },
      },
      Forbidden: {
        description: "La cuenta no tiene permisos para realizar la operación",
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/ApiError" } },
        },
      },
      NotFound: {
        description: "El recurso no existe",
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/ApiError" } },
        },
      },
      Conflict: {
        description: "Correo o usuario duplicado",
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/ApiError" } },
        },
      },
    },
  },
} as const;
