export const roomSchema = {
  Room: {
    type: "object",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      deckValues: { type: "array", items: { type: "string" } },
      expiresAt: { type: "string", format: "date-time" },
      version: {
        type: "integer",
        description:
          "Contador monotônico do estado. Os clientes descartam snapshots com version menor que a última aplicada.",
      },
      createdAt: { type: "string", format: "date-time" },
    },
  },

  CreateRoomRequest: {
    type: "object",
    required: ["name"],
    properties: {
      name: { type: "string", description: "Nome da sala" },
      participantName: {
        type: "string",
        description: "Como chamar quem está criando a sala",
      },
      deckValues: {
        type: "array",
        items: { type: "string" },
        description: "Cartas do baralho. Aceita valores não-numéricos.",
      },
    },
  },

  RoomStateResponse: {
    type: "object",
    properties: {
      snapshot: { $ref: "#/components/schemas/RoomSnapshot" },
      you: {
        type: "string",
        nullable: true,
        description: "Id do participante que fez a requisição.",
      },
      yourVote: {
        type: "string",
        nullable: true,
        description:
          "Seu próprio voto. Vai só nesta resposta individual, nunca no broadcast — é o que permite ver a própria carta sem vazar a dos outros.",
      },
    },
  },

  RoomSnapshot: {
    type: "object",
    properties: {
      version: { type: "integer" },
      serverNow: {
        type: "string",
        format: "date-time",
        description: "Relógio do servidor, usado para corrigir skew local.",
      },
      room: { $ref: "#/components/schemas/Room" },
      story: { $ref: "#/components/schemas/Story" },
      participants: {
        type: "array",
        items: { $ref: "#/components/schemas/Participant" },
      },
      chips: { type: "array", items: { $ref: "#/components/schemas/Chip" } },
      queue: { type: "array", items: { $ref: "#/components/schemas/Task" } },
      estimates: {
        type: "array",
        items: { $ref: "#/components/schemas/Estimate" },
      },
    },
  },

  Participant: {
    type: "object",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      image: { type: "string", nullable: true },
      isAnonymous: { type: "boolean" },
      isOnline: { type: "boolean" },
      hasVoted: {
        type: "boolean",
        description: "Sempre visível — é o que acende o ponto na cadeira.",
      },
      vote: {
        type: "string",
        nullable: true,
        description: "Preenchido somente depois da revelação.",
      },
      callsReceived: { type: "integer" },
    },
  },

  Chip: {
    type: "object",
    properties: {
      id: { type: "string" },
      authorId: { type: "string" },
      targetId: { type: "string", nullable: true },
      kind: { type: "string", enum: ["agree", "explain", "risk", "call"] },
      mode: { type: "string", enum: ["land", "call"] },
      jitterX: { type: "number" },
      jitterY: { type: "number" },
      rot: { type: "number" },
    },
  },

  ChipRequest: {
    type: "object",
    required: ["kind", "mode"],
    properties: {
      kind: { type: "string", enum: ["agree", "explain", "risk", "call"] },
      mode: { type: "string", enum: ["land", "call"] },
      targetId: {
        type: "string",
        description: "Obrigatório no modo call. Não pode ser você mesmo.",
      },
      jitterX: { type: "number" },
      jitterY: { type: "number" },
      rot: { type: "number" },
    },
  },

  Task: {
    type: "object",
    properties: {
      id: { type: "string" },
      key: { type: "string" },
      title: { type: "string" },
      source: {
        type: "string",
        enum: ["manual", "jira", "trello", "github", "izzyplan"],
      },
      type: { type: "string", nullable: true },
      order: { type: "integer" },
      status: { type: "string", enum: ["queued", "active", "estimated"] },
    },
  },

  TaskInput: {
    type: "object",
    required: ["title"],
    properties: {
      key: { type: "string" },
      title: { type: "string" },
      source: {
        type: "string",
        enum: ["manual", "jira", "trello", "github", "izzyplan"],
      },
      type: { type: "string" },
      externalId: { type: "string" },
      externalUrl: { type: "string" },
    },
  },

  Estimate: {
    type: "object",
    properties: {
      id: { type: "string" },
      key: { type: "string" },
      title: { type: "string" },
      source: { type: "string" },
      points: { type: "string" },
      consensus: { type: "integer", description: "0–100" },
      durationSeconds: { type: "integer", nullable: true },
      createdAt: { type: "string", format: "date-time" },
    },
  },
};
