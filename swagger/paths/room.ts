export const roomPaths = {
  '/api/room': {
    post: {
      summary: 'Cria uma nova sala de Planning Poker',
      description: 'Cria uma nova sala e retorna seus detalhes',
      tags: ['Salas'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CreateRoomRequest'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Sala criada com sucesso',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Room'
              }
            }
          }
        },
        400: {
          description: 'Dados inválidos'
        },
        500: {
          description: 'Erro interno do servidor'
        }
      }
    }
  }
} 