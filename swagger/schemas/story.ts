export const storySchema = {
  Story: {
    type: "object",
    nullable: true,
    properties: {
      id: { type: "string" },
      title: { type: "string" },
      taskId: { type: "string", nullable: true },
      revealed: { type: "boolean" },
      revealAt: {
        type: "string",
        format: "date-time",
        nullable: true,
        description:
          "Instante absoluto em que as cartas viram. Todos os clientes agendam a virada contra este valor, por isso a revelação é simultânea.",
      },
      startedAt: {
        type: "string",
        format: "date-time",
        description: "Início da rodada, de onde o cronômetro é derivado.",
      },
    },
  },

  Vote: {
    type: "object",
    properties: {
      id: { type: "string" },
      value: {
        type: "string",
        description:
          "String, não número: o baralho pode conter '?', '☕', emoji ou tamanhos de camiseta.",
        example: "8",
      },
      storyId: { type: "string" },
      participantId: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
    },
  },
};
