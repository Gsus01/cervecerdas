export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Cervecerdas API",
    version: "0.1.0",
    description:
      "API del MVP Cervecerdas. La autenticación usa una cookie de sesión JWT gestionada por Auth.js.",
  },
  servers: [{ url: "http://localhost:3000", description: "Entorno local" }],
  tags: [
    { name: "Auth" },
    { name: "Users" },
    { name: "Beers" },
    { name: "Beer types" },
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
    "/api/users/ranking": {
      get: {
        tags: ["Users"],
        summary: "Consultar la clasificación general",
        responses: {
          "200": {
            description: "Clasificación ordenada",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/RankingEntry" },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/beers": {
      post: {
        tags: ["Beers"],
        summary: "Registrar una cerveza para el usuario autenticado",
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
            description: "Cerveza registrada",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BeerAdded" },
              },
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
        summary: "Añadir un tipo de cerveza",
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
    "/api/beers/logs": {
      get: {
        tags: ["Beers"],
        summary: "Consultar el historial paginado",
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", minimum: 0, default: 0 },
          },
          {
            name: "size",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
          },
        ],
        responses: {
          "200": {
            description: "Página de eventos",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/BeerLogPage" } },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
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
        required: ["id", "username", "email", "beerCount", "createdAt", "updatedAt"],
        properties: {
          id: { type: "string", format: "uuid" },
          username: { type: "string" },
          email: { type: "string", format: "email" },
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
          quantity: { type: "integer", const: 1 },
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
      Conflict: {
        description: "Correo o usuario duplicado",
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/ApiError" } },
        },
      },
    },
  },
} as const;
