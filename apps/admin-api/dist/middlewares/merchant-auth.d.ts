import { Request, Response, NextFunction } from 'express';
export interface MerchantRequest extends Request {
    merchant?: any;
    merchantApiKey?: any;
}
export declare const merchantAuthMiddleware: (req: MerchantRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const merchantPermissionMiddleware: (requiredPermission: string) => (req: MerchantRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const verifySignature: (payload: string, signature: string, apiSecret: string) => boolean;
//# sourceMappingURL=merchant-auth.d.ts.map