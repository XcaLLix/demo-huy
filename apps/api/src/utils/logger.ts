import type { Request } from 'express';
import { prisma } from '../lib/prisma.js';
import { LogType, LogLevel } from '@prisma/client';

export function parseUserAgent(uaString: string | undefined) {
  if (!uaString) {
    return {
      browser: 'Unknown Browser',
      operatingSystem: 'Unknown OS',
      device: 'Desktop'
    };
  }

  let browser = 'Unknown Browser';
  let operatingSystem = 'Unknown OS';
  let device = 'Desktop';

  // Device detection
  if (/mobile/i.test(uaString)) {
    device = 'Mobile';
  } else if (/tablet|ipad|playbook|silk/i.test(uaString)) {
    device = 'Tablet';
  } else {
    device = 'Desktop';
  }

  // OS detection
  if (/windows/i.test(uaString)) {
    operatingSystem = 'Windows';
  } else if (/macintosh|mac os x/i.test(uaString)) {
    operatingSystem = 'macOS';
  } else if (/iphone|ipad|ipod/i.test(uaString)) {
    operatingSystem = 'iOS';
    device = /ipad/i.test(uaString) ? 'Tablet' : 'Mobile';
  } else if (/android/i.test(uaString)) {
    operatingSystem = 'Android';
    device = /mobile/i.test(uaString) ? 'Mobile' : 'Tablet';
  } else if (/linux/i.test(uaString)) {
    operatingSystem = 'Linux';
  }

  // Browser detection
  if (/edg/i.test(uaString)) {
    browser = 'Edge';
  } else if (/chrome|crios/i.test(uaString) && !/opr|opios|edg/i.test(uaString)) {
    browser = 'Chrome';
  } else if (/firefox|fxios/i.test(uaString)) {
    browser = 'Firefox';
  } else if (/safari/i.test(uaString) && !/chrome|crios|edg/i.test(uaString)) {
    browser = 'Safari';
  } else if (/opr|opera/i.test(uaString)) {
    browser = 'Opera';
  } else if (/trident|msie/i.test(uaString)) {
    browser = 'Internet Explorer';
  }

  return { browser, operatingSystem, device };
}

export async function createSystemLog({
  type,
  action,
  module,
  userId,
  ipAddress,
  device,
  browser,
  operatingSystem,
  description,
  metadata,
  level
}: {
  type: LogType;
  action: string;
  module: string;
  userId?: number | null;
  ipAddress?: string | null;
  device?: string | null;
  browser?: string | null;
  operatingSystem?: string | null;
  description: string;
  metadata?: any;
  level: LogLevel;
}) {
  try {
    return await prisma.systemLog.create({
      data: {
        type,
        action,
        module,
        userId: userId || null,
        ipAddress,
        device,
        browser,
        operatingSystem,
        description,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
        level
      }
    });
  } catch (err) {
    console.error('[SystemLog] Error creating system log:', err);
  }
}

export async function logSystemEvent(
  req: Request | null,
  options: {
    type: LogType;
    action: string;
    module: string;
    userId?: number | null;
    description: string;
    metadata?: any;
    level: LogLevel;
  }
) {
  let ipAddress = null;
  let device = null;
  let browser = null;
  let operatingSystem = null;

  if (req) {
    const rawIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
    ipAddress = rawIp.split(',')[0].trim();
    if (ipAddress === '::1' || ipAddress === '127.0.0.1') {
      ipAddress = '127.0.0.1';
    }

    const ua = req.headers['user-agent'];
    const parsedUa = parseUserAgent(ua);
    device = parsedUa.device;
    browser = parsedUa.browser;
    operatingSystem = parsedUa.operatingSystem;
  }

  return createSystemLog({
    ...options,
    ipAddress,
    device,
    browser,
    operatingSystem
  });
}
