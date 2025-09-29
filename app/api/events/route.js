import { NextResponse } from 'next/server';
import { eventLogger } from '../../lib/event-logger';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      entityType: searchParams.get('entityType') || null,
      action: searchParams.get('action') || null,
      actor: searchParams.get('actor') || null,
      startDate: searchParams.get('startDate') || null,
      endDate: searchParams.get('endDate') || null,
      limit: parseInt(searchParams.get('limit')) || 100
    };

    const events = eventLogger.getEvents(filters);
    const stats = eventLogger.getStats();

    return NextResponse.json({
      success: true,
      events,
      stats,
      totalCount: events.length
    });

  } catch (error) {
    console.error('❌ API: Error fetching events:', error);
    return NextResponse.json({
      error: 'Failed to fetch events',
      details: error.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, clearOld = false, keepCount = 500 } = body;

    if (action === 'clear') {
      if (clearOld) {
        eventLogger.clearOldEvents(keepCount);
        return NextResponse.json({
          success: true,
          message: `Cleared old events, keeping last ${keepCount}`
        });
      } else {
        eventLogger.events = [];
        return NextResponse.json({
          success: true,
          message: 'All events cleared'
        });
      }
    }

    if (action === 'export') {
      const exportData = eventLogger.exportEvents();
      return NextResponse.json({
        success: true,
        data: exportData
      });
    }

    return NextResponse.json({
      error: 'Invalid action'
    }, { status: 400 });

  } catch (error) {
    console.error('❌ API: Error managing events:', error);
    return NextResponse.json({
      error: 'Failed to manage events',
      details: error.message
    }, { status: 500 });
  }
}
