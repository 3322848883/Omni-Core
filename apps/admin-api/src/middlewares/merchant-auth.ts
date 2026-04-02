import { Request, Response, NextFunction } from 'express';
import { db } from '../database';
import crypto from 'crypto';

export interface MerchantRequest extends Request {
  merchant?: any;
  merchantApiKey?: any;
}

export const merchantAuthMiddleware = async (req: MerchantRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        code: 401,
        message: 'Authorization header missing or invalid'
      });
    }
    
    const apiKey = authHeader.slice(7); 
    
    const apiKeyRecord = await db('merchant_api_keys')
      .where('api_key', apiKey)
      .where('is_active', true)
      .first();
    
    if (!apiKeyRecord) {
      return res.status(401).json({
        success: false,
        code: 401,
        message: 'Invalid API key'
      });
    }
    
    if (apiKeyRecord.expires_at && new Date(apiKeyRecord.expires_at) < new Date()) {
      return res.status(401).json({
        success: false,
        code: 401,
        message: 'API key has expired'
      });
    }
    
    if (apiKeyRecord.ip_whitelist) {
      const allowedIps = apiKeyRecord.ip_whitelist.split(',').map(ip => ip.trim());
      const clientIp = req.ip || req.connection.remoteAddress;
      
      if (clientIp && !allowedIps.includes(clientIp)) {
        return res.status(403).json({
          success: false,
          code: 403,
          message: 'IP address not allowed'
        });
      }
    }
    
    const merchant = await db('merchants')
      .where('id', apiKeyRecord.merchant_id)
      .where('status', 'active')
      .first();
    
    if (!merchant) {
      return res.status(401).json({
        success: false,
        code: 401,
        message: 'Merchant not found or inactive'
      });
    }
    
    await db('merchant_api_keys')
      .where('id', apiKeyRecord.id)
      .update({
        last_used_at: new Date()
      });
    
    req.merchant = merchant;
    req.merchantApiKey = apiKeyRecord;
    
    next();
  } catch (error) {
    console.error('Merchant auth error:', error);
    return res.status(500).json({
      success: false,
      code: 500,
      message: 'Internal server error during authentication'
    });
  }
};

export const merchantPermissionMiddleware = (requiredPermission: string) => {
  return async (req: MerchantRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.merchant) {
        return res.status(401).json({
          success: false,
          code: 401,
          message: 'Merchant not authenticated'
        });
      }
      
      if (req.merchantApiKey?.scopes) {
        const scopes = req.merchantApiKey.scopes.split(',').map(s => s.trim());
        if (!scopes.includes(requiredPermission)) {
          return res.status(403).json({
            success: false,
            code: 403,
            message: 'Insufficient permissions for this API key'
          });
        }
      }
      
      const hasPermission = await db('merchant_permissions')
        .where('merchant_id', req.merchant.id)
        .where('permission_code', requiredPermission)
        .first();
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          code: 403,
          message: 'Merchant does not have required permission'
        });
      }
      
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        code: 500,
        message: 'Internal server error during permission check'
      });
    }
  };
};

export const verifySignature = (payload: string, signature: string, apiSecret: string): boolean => {
  const hmac = crypto.createHmac('sha256', apiSecret);
  const expectedSignature = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
};
