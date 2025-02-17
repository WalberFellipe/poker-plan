"use client"

import { useRealtime } from '@/hooks/useRealtime'

export default function RoomPage({ params }: { params: { roomId: string } }) {
  useRealtime(params.roomId, (event) => {
    switch (event.type) {
      case 'vote':
        console.log('Novo voto:', event.data)
        break
      case 'join':
        console.log('Usuário entrou:', event.data)
        break
      case 'leave':
        console.log('Usuário saiu:', event.data)
        break
      // ... outros casos
    }
  })

  return (
    <div>
      {/* Interface da sala */}
    </div>
  )
}
