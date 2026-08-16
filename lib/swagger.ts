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
      { name: 'Salas', description: 'Criação e configuração de salas' },
      {
        name: 'Tempo real',
        description:
          'Snapshot versionado da sala. O servidor é dono do estado e publica o estado inteiro a cada mutação; o cliente aplica apenas versões mais novas e reconcilia por GET.',
      },
      { name: 'Participantes', description: 'Entrar, sair e presença' },
      { name: 'Votação', description: 'Votos, revelação e nova rodada' },
      { name: 'Mesa', description: 'Fichas e fechamento da estimativa' },
      { name: 'Fila', description: 'Fila de tarefas da sessão' },
      { name: 'Integrações', description: 'Escrita dos pontos no board' },
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