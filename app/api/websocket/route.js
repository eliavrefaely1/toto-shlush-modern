import { NextRequest } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'anonymous';
  
  console.log(`🔌 WebSocket connection request for: ${userId}`);
  
  // For development, return a mock response
  return new Response(JSON.stringify({
    message: 'WebSocket endpoint ready (development mode)',
    userId: userId,
    status: 'mock',
    note: 'WebSocket functionality is simulated in development mode'
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
