"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySignature = exports.merchantPermissionMiddleware = exports.merchantAuthMiddleware = void 0;
const database_1 = require("../database");
const crypto_1 = __importDefault(require("crypto"));
const merchantAuthMiddleware = async (req, res, next) => {
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
        const apiKeyRecord = await (0, database_1.db)('merchant_api_keys')
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
        const merchant = await (0, database_1.db)('merchants')
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
        await (0, database_1.db)('merchant_api_keys')
            .where('id', apiKeyRecord.id)
            .update({
            last_used_at: new Date()
        });
        req.merchant = merchant;
        req.merchantApiKey = apiKeyRecord;
        next();
    }
    catch (error) {
        console.error('Merchant auth error:', error);
        return res.status(500).json({
            success: false,
            code: 500,
            message: 'Internal server error during authentication'
        });
    }
};
exports.merchantAuthMiddleware = merchantAuthMiddleware;
const merchantPermissionMiddleware = (requiredPermission) => {
    return async (req, res, next) => {
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
            const hasPermission = await (0, database_1.db)('merchant_permissions')
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
        }
        catch (error) {
            console.error('Permission check error:', error);
            return res.status(500).json({
                success: false,
                code: 500,
                message: 'Internal server error during permission check'
            });
        }
    };
};
exports.merchantPermissionMiddleware = merchantPermissionMiddleware;
const verifySignature = (payload, signature, apiSecret) => {
    const hmac = crypto_1.default.createHmac('sha256', apiSecret);
    const expectedSignature = hmac.update(payload).digest('hex');
    return crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
};
exports.verifySignature = verifySignature;
//# sourceMappingURL=merchant-auth.js.map