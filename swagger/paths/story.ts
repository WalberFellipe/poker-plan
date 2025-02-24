export const storyPaths = {
  '/api/stories/{storyId}/votes': {
    get: {
      summary: 'Retorna os votos de uma história',
      tags: ['Votos'],
      parameters: [
        {
          in: 'path',
          name: 'storyId',
          required: true,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: {
        200: {
          description: 'Lista de votos',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Vote'
                }
              }
            }
          }
        }
      }
    },
    post: {
      summary: 'Registra um voto em uma história',
      tags: ['Votos'],
      parameters: [
        {
          in: 'path',
          name: 'storyId',
          required: true,
          schema: {
            type: 'string'
          }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['value'],
              properties: {
                value: {
                  type: 'number'
                },
                participantId: {
                  type: 'string'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Voto registrado com sucesso'
        }
      }
    }
  }
} 