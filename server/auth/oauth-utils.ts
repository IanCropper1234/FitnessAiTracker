import type { Request } from 'express';

/**
 * 從 request 推導正確的 base URL
 * 優先使用 mytrainpro.com 作為生產域名
 */
export function deriveBaseUrlFromRequest(req: Request): string {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || req.get('host');
  
  // 優先級 1: 使用 PRIMARY_DOMAIN 環境變數（mytrainpro.com）
  if (process.env.PRIMARY_DOMAIN) {
    return `https://${process.env.PRIMARY_DOMAIN}`;
  }
  
  // 優先級 2: 使用實際 request host
  if (host) {
    return `${protocol}://${host}`;
  }
  
  // 優先級 3: Fallback 到環境變數
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }
  
  // 優先級 4: Replit 環境
  if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
    return `https://${process.env.REPL_SLUG}-${process.env.REPL_OWNER}.replit.app`;
  }
  
  // 優先級 5: 本地開發
  return 'http://localhost:5000';
}

/**
 * 生成 OAuth callback URL
 */
export function generateCallbackUrl(req: Request, provider: 'google' | 'apple'): string {
  const baseUrl = deriveBaseUrlFromRequest(req);
  return `${baseUrl}/api/auth/${provider}/callback`;
}
