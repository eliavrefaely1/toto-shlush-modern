import { kv } from '@vercel/kv';

export async function GET() {
  const startTime = Date.now();
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {}
  };

  try {
    // בדיקת Redis/KV
    try {
      await kv.ping();
      health.checks.redis = { status: 'healthy', responseTime: Date.now() - startTime };
    } catch (error) {
      health.checks.redis = { 
        status: 'unhealthy', 
        error: error.message,
        responseTime: Date.now() - startTime 
      };
      health.status = 'unhealthy';
    }

    // בדיקת Memory
    const memUsage = process.memoryUsage();
    health.checks.memory = {
      status: 'healthy',
      used: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB'
    };

    // בדיקת Environment
    health.checks.environment = {
      status: 'healthy',
      nodeVersion: process.version,
      platform: process.platform,
      env: process.env.NODE_ENV || 'development'
    };

    // בדיקת API endpoints פנימיים
    try {
      const response = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001'}/api/data`);
      health.checks.api = {
        status: response.ok ? 'healthy' : 'unhealthy',
        statusCode: response.status,
        responseTime: Date.now() - startTime
      };
      if (!response.ok) health.status = 'unhealthy';
    } catch (error) {
      health.checks.api = {
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - startTime
      };
      health.status = 'unhealthy';
    }

    const totalResponseTime = Date.now() - startTime;
    health.responseTime = totalResponseTime;

    return Response.json(health, {
      status: health.status === 'healthy' ? 200 : 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    return Response.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      responseTime: Date.now() - startTime
    }, { status: 500 });
  }
}
