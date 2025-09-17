# Monitoring & Analytics Setup

This document explains the comprehensive monitoring and analytics system implemented for the Toto Shlush application.

## 🚀 Overview

The application uses a multi-layered monitoring approach to ensure reliability, performance, and user experience tracking.

## 📊 Monitoring Stack

### 1. **Sentry** - Error Tracking & Performance Monitoring
- **Purpose**: Real-time error tracking, performance monitoring, and session replay
- **Dashboard**: https://sentry.io
- **Project**: `atzmai/javascript-nextjs`
- **Features**:
  - JavaScript/React error tracking
  - API error monitoring
  - Performance bottlenecks detection
  - Session replay (user behavior recording)
  - Source maps for better debugging
  - Email alerts for critical errors

### 2. **Vercel Analytics** - User Behavior Analytics
- **Purpose**: User behavior tracking and page performance metrics
- **Dashboard**: https://vercel.com/dashboard → Project → Analytics
- **Features**:
  - Page views and unique visitors
  - Core Web Vitals (LCP, FID, CLS)
  - Real-time traffic data
  - Geographic user distribution
  - Device and browser analytics
  - Custom event tracking

### 3. **Uptime Robot** - System Availability Monitoring
- **Purpose**: 24/7 system uptime monitoring and alerts
- **Dashboard**: https://uptimerobot.com
- **Monitored Endpoints**:
  - Main App: `https://toto-shlush-modern.vercel.app`
  - Health Check: `https://toto-shlush-modern.vercel.app/api/health`
  - API Data: `https://toto-shlush-modern.vercel.app/api/data`
- **Features**:
  - 5-minute monitoring intervals
  - Email and SMS alerts
  - Uptime history and statistics
  - Response time tracking

### 4. **Custom Health Check API** - System Health Monitoring
- **Endpoint**: `/api/health`
- **Purpose**: Comprehensive system health monitoring
- **Checks**:
  - Redis/KV database connectivity
  - Memory usage monitoring
  - Environment information
  - Internal API endpoint health
  - Response time metrics

## 🔔 Alert Configuration

### Sentry Alerts
- **Email notifications** for new errors
- **Performance alerts** for slow operations
- **Release notifications** for deployments

### Uptime Robot Alerts
- **Email alerts** for system downtime
- **SMS alerts** for critical failures (limited in free tier)
- **Recovery notifications** when systems come back online

## 📈 Key Metrics Tracked

### Error Monitoring
- JavaScript runtime errors
- API endpoint failures
- Database connection issues
- Performance bottlenecks

### User Analytics
- Page views and sessions
- User journey tracking
- Core Web Vitals performance
- Geographic distribution

### System Health
- Uptime percentage
- Response times
- Database connectivity
- Memory usage

## 🛠️ Setup Instructions

### For Developers
1. **Sentry**: Access via https://sentry.io with project credentials
2. **Vercel Analytics**: Available in Vercel dashboard under Analytics tab
3. **Uptime Robot**: Configure monitors at https://uptimerobot.com
4. **Health Check**: Access via `/api/health` endpoint

### Alert Configuration
1. **Sentry**: Go to Project Settings → Alerts → Configure email notifications
2. **Uptime Robot**: Go to My Settings → Alert Contacts → Add email/SMS contacts

## 📱 Mobile & WhatsApp Alerts (Optional)

### WhatsApp Integration via Zapier
1. Create Zapier account (free tier available)
2. Set up webhook trigger from Sentry/Uptime Robot
3. Configure WhatsApp Business action
4. Test the integration

## 🔍 Troubleshooting

### Common Issues
- **Authentication errors**: Check Vercel project visibility settings
- **Missing alerts**: Verify email/SMS configuration in monitoring tools
- **Health check failures**: Review database and API endpoint configurations

### Debug Commands
```bash
# Check health endpoint
curl https://toto-shlush-modern.vercel.app/api/health

# View Sentry errors
# Go to https://sentry.io → Project → Issues

# Check uptime status
# Go to https://uptimerobot.com → Dashboard
```

## 📊 Dashboard URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Sentry** | https://sentry.io | Error tracking & performance |
| **Vercel Analytics** | https://vercel.com/dashboard | User behavior analytics |
| **Uptime Robot** | https://uptimerobot.com | System uptime monitoring |
| **Health Check** | /api/health | System health status |

## 🎯 Best Practices

1. **Regular Monitoring**: Check dashboards daily for any issues
2. **Alert Tuning**: Adjust alert thresholds to avoid false positives
3. **Performance Optimization**: Use Core Web Vitals data to improve user experience
4. **Error Resolution**: Address Sentry errors promptly to maintain system stability

## 📞 Support

For monitoring-related issues:
- Check the respective service documentation
- Review alert configurations
- Verify endpoint accessibility
- Contact service support if needed

---

**Last Updated**: September 2025  
**Maintained By**: Development Team
