const clientIdHeader = {
  name: "x-poker-client-id",
  in: "header",
  required: true,
  description: "Id estável do browser, guardado em localStorage.",
  schema: { type: "string" },
} as const;

const storyIdParam = {
  name: "storyId",
  in: "path",
  required: true,
  schema: { type: "string" },
} as const;

export const storyPaths = {
  "/api/stories/{storyId}/votes": {
    post: {
      summary: "Registrar voto",
      description:
        "O valor é string: o baralho pode conter '?', '☕', emoji ou tamanhos de camiseta. A leitura numérica acontece só nas estatísticas.",
      tags: ["Votação"],
      parameters: [storyIdParam, clientIdHeader],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["value"],
              properties: {
                value: { type: "string", example: "8" },
                name: {
                  type: "string",
                  description:
                    "Nome usado caso o participante ainda precise ser criado.",
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Voto gravado" },
        400: { description: "Valor inválido" },
        401: { description: "Não está na sala" },
        409: { description: "A rodada já foi revelada" },
      },
    },
    delete: {
      summary: "Desmarcar o próprio voto",
      tags: ["Votação"],
      parameters: [storyIdParam, clientIdHeader],
      responses: {
        200: { description: "Voto removido" },
        409: { description: "A rodada já foi revelada" },
      },
    },
  },

  "/api/stories/{storyId}/reveal": {
    post: {
      summary: "Revelar as cartas",
      description:
        "Grava `revealAt = agora + contagem regressiva`. Os clientes agendam a virada contra esse instante absoluto, corrigido pelo offset de relógio do snapshot, então todos revelam no mesmo momento.",
      tags: ["Votação"],
      parameters: [storyIdParam, clientIdHeader],
      responses: {
        200: { description: "Revelação agendada" },
        401: { description: "Não está na sala" },
        404: { description: "História não encontrada" },
      },
    },
  },

  "/api/stories/{storyId}/reset": {
    post: {
      summary: "Nova rodada",
      description:
        "Zera votos, fichas e cronômetro criando uma história nova sobre a mesma tarefa; as rodadas anteriores continuam no banco.",
      tags: ["Votação"],
      parameters: [storyIdParam, clientIdHeader],
      responses: {
        200: { description: "Rodada aberta" },
        401: { description: "Não está na sala" },
      },
    },
  },
};
