export const roomSchema = {
  Room: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      code: { type: 'string' },
      hostId: { 
        type: 'string',
        nullable: true 
      },
      createdAt: { type: 'string', format: 'date-time' }
    }
  },
  CreateRoomRequest: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { 
        type: 'string',
        description: 'Nome da sala'
      }
    }
  }
} 