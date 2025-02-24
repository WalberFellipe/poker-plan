export const storySchema = {
  Story: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      title: { type: 'string' },
      revealed: { type: 'boolean' },
      roomId: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' }
    }
  },
  Vote: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      value: { type: 'number' },
      userId: { type: 'string' },
      participantId: { 
        type: 'string',
        nullable: true 
      }
    }
  }
} 