const clientIdHeader = {
  name: "x-poker-client-id",
  in: "header",
  required: true,
  description:
    "Id estável do browser, guardado em localStorage. É o que identifica um participante convidado entre reloads e evita duplicá-lo.",
  schema: { type: "string" },
} as const;

const roomIdParam = {
  name: "roomId",
  in: "path",
  required: true,
  schema: { type: "string" },
} as const;

export const roomPaths = {
  "/api/room": {
    post: {
      summary: "Cria uma sala",
      description:
        "Cria a sala, aplica o baralho escolhido e senta quem criou à mesa.",
      tags: ["Salas"],
      parameters: [clientIdHeader],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateRoomRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "Sala criada",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Room" },
            },
          },
        },
        400: { description: "Dados inválidos" },
        500: { description: "Erro interno" },
      },
    },
  },

  "/api/rooms/{roomId}/state": {
    get: {
      summary: "Snapshot da sala",
      description:
        "Fonte de verdade do estado. O cliente chama ao montar, ao reconectar, ao voltar para a aba e num poll de segurança — é o que torna o tempo real auto-recuperável quando um evento se perde.",
      tags: ["Tempo real"],
      parameters: [roomIdParam, clientIdHeader],
      responses: {
        200: {
          description: "Estado atual",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RoomStateResponse" },
            },
          },
        },
        404: { description: "Sala não encontrada" },
        410: { description: "Sala expirada" },
      },
    },
  },

  "/api/rooms/{roomId}/join": {
    post: {
      summary: "Entrar na sala",
      description:
        "Idempotente por (roomId, clientId): chamar de novo depois de um reload devolve a mesma cadeira em vez de criar uma duplicata.",
      tags: ["Participantes"],
      parameters: [roomIdParam, clientIdHeader],
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: { name: { type: "string" } },
            },
          },
        },
      },
      responses: {
        200: { description: "Participante ativo" },
        400: { description: "Identificação ausente" },
        410: { description: "Sala expirada" },
      },
    },
  },

  "/api/rooms/{roomId}/leave": {
    post: {
      summary: "Sair da sala",
      description:
        "Marca o participante como offline. Não apaga a linha nem os votos — apagar era o que fazia um reload duplicar a pessoa e perder o voto dela.",
      tags: ["Participantes"],
      parameters: [roomIdParam, clientIdHeader],
      responses: { 200: { description: "Marcado offline" } },
    },
  },

  "/api/rooms/{roomId}/heartbeat": {
    post: {
      summary: "Renovar presença",
      tags: ["Participantes"],
      parameters: [roomIdParam, clientIdHeader],
      responses: { 200: { description: "Presença renovada" } },
    },
  },

  "/api/rooms/{roomId}/chips": {
    post: {
      summary: "Apostar uma ficha",
      description:
        "Reação (agree/explain/risk) ou 'pagar pra ver' (call, com alvo). Só o sorteio do pouso é persistido; a trajetória é derivada em cada cliente.",
      tags: ["Mesa"],
      parameters: [roomIdParam, clientIdHeader],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ChipRequest" },
          },
        },
      },
      responses: {
        200: { description: "Ficha na mesa" },
        400: { description: "Ficha ou alvo inválido" },
      },
    },
  },

  "/api/rooms/{roomId}/accept": {
    post: {
      summary: "Aceitar a estimativa",
      description:
        "Registra a tarefa em Estimativas, tira-a da fila, promove a próxima e abre uma rodada limpa.",
      tags: ["Mesa"],
      parameters: [roomIdParam, clientIdHeader],
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                points: {
                  type: "string",
                  description:
                    "Valor fechado pelo time. Na ausência dele usa-se a mediana.",
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Estimativa registrada" },
        409: { description: "A rodada ainda não foi revelada" },
      },
    },
  },

  "/api/rooms/{roomId}/tasks": {
    post: {
      summary: "Adicionar tarefas à fila",
      tags: ["Fila"],
      parameters: [roomIdParam, clientIdHeader],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                tasks: {
                  type: "array",
                  items: { $ref: "#/components/schemas/TaskInput" },
                },
              },
            },
          },
        },
      },
      responses: { 200: { description: "Tarefas na fila" } },
    },
  },

  "/api/rooms/{roomId}/tasks/{taskId}": {
    patch: {
      summary: "Colocar a tarefa na mesa",
      tags: ["Fila"],
      parameters: [
        roomIdParam,
        { name: "taskId", in: "path", required: true, schema: { type: "string" } },
        clientIdHeader,
      ],
      responses: { 200: { description: "Tarefa promovida" } },
    },
    delete: {
      summary: "Remover a tarefa da fila",
      tags: ["Fila"],
      parameters: [
        roomIdParam,
        { name: "taskId", in: "path", required: true, schema: { type: "string" } },
        clientIdHeader,
      ],
      responses: { 200: { description: "Tarefa removida" } },
    },
  },

  "/api/rooms/{roomId}/push": {
    post: {
      summary: "Enviar os pontos ao board",
      description:
        "Escreve a estimativa de volta na issue de origem. Exige sessão: o token da integração pertence a uma conta.",
      tags: ["Integrações"],
      parameters: [roomIdParam, clientIdHeader],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["taskId", "points"],
              properties: {
                taskId: { type: "string" },
                points: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Pontos enviados" },
        400: { description: "Tarefa sem origem externa ou sem integração" },
        502: { description: "O provedor recusou a escrita" },
      },
    },
  },
};
