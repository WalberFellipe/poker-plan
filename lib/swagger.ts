import { roomPaths } from '@/swagger/paths/room'
import { storyPaths } from '@/swagger/paths/story'
import { roomSchema } from '@/swagger/schemas/room'
import { storySchema } from '@/swagger/schemas/story'

export const getApiDocs = () => {
  return {
    openapi: '3.0.0',
    info: {
      title: 'Planning Poker API',
      version: '1.0.0',
      description: 'API de gerenciamento de salas de Planning Poker',
    },
    tags: [
      { name: 'Salas', description: 'Operações relacionadas a salas' },
      { name: 'Votos', description: 'Operações relacionadas a votos' }
    ],
    paths: {
      ...roomPaths,
      ...storyPaths
    },
    components: {
      schemas: {
        ...roomSchema,
        ...storySchema
      },
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
        },
      },
    },
  }
} 