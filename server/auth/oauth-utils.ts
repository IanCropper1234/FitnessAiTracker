import type { Request } from 'express';

/**
 * 從 request 推導正確的 base URL
 * 這是最可靠的方法，因為它使用實際的 request host
 */
export function deriveBaseUrlFromRequest(req: Request): string {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || req.get('host');
  
  if (!host) {
    // Fallback：使用環境變數
    if (process.env.BASE_URL) {
      return process.env.BASE_URL;
    }
    
    if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
      return `https://${process.env.REPL_SLUG}-${process.env.REPL_OWNER}.replit.app`;
    }
    
    return 'http://localhost:5000';
  }
  
  return `${protocol}://${host}`;
}

/**
 * 生成 OAuth callback URL
 */
export function generateCallbackUrl(req: Request, provider: 'google' | 'apple'): string {
  const baseUrl = deriveBaseUrlFromRequest(req);
  return `${baseUrl}/api/auth/${provider}/callback`;
}
