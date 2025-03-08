import { NextResponse } from 'next/server'
import { cleanupExpiredRooms } from '@/lib/jobs/cleanup/cleanup-room'

export async function GET() {
  try {
    const result = await cleanupExpiredRooms()
    return NextResponse.json({ success: true, ...result })
  } catch {
    return NextResponse.json(
      { error: 'Failed to cleanup rooms' },
      { status: 500 }
    )
  }
} 