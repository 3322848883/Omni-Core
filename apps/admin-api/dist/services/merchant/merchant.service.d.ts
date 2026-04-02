export interface CreateMerchantRequest {
    name: string;
    email: string;
    phone?: string;
    businessLicense?: string;
    taxId?: string;
    contactPerson?: string;
    address?: string;
    website?: string;
    notes?: string;
}
export interface UpdateMerchantRequest {
    name?: string;
    email?: string;
    phone?: string;
    businessLicense?: string;
    taxId?: string;
    contactPerson?: string;
    address?: string;
    website?: string;
    status?: string;
    notes?: string;
}
export interface CreateApiKeyRequest {
    keyName: string;
    scopes?: string;
    ipWhitelist?: string;
    expiresAt?: Date;
}
export interface CreateRateRequest {
    paymentMethod: string;
    currency?: string;
    transactionRate: number;
    fixedFee?: number;
    minFee?: number;
    maxFee?: number;
    effectiveFrom: Date;
    effectiveTo?: Date;
}
export declare class MerchantService {
    static createMerchant(data: CreateMerchantRequest): Promise<any>;
    static getMerchantById(id: number): Promise<any>;
    static getMerchantByMerchantId(merchantId: string): Promise<any>;
    static listMerchants(page?: number, limit?: number, status?: string, search?: string): Promise<{
        items: any[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
    static updateMerchant(id: number, data: UpdateMerchantRequest): Promise<any>;
    static createApiKey(merchantId: number, data: CreateApiKeyRequest): Promise<{
        id: number;
        apiKey: string;
        apiSecret: string;
    }>;
    static listApiKeys(merchantId: number): Promise<any[]>;
    static revokeApiKey(id: number, merchantId: number): Promise<number>;
    static createRate(merchantId: number, data: CreateRateRequest): Promise<any>;
    static getRateById(id: number): Promise<any>;
    static listRates(merchantId: number, paymentMethod?: string): Promise<any[]>;
    static updateRate(id: number, merchantId: number, data: Partial<CreateRateRequest>): Promise<any>;
    static getMerchantStats(merchantId: number, startDate?: Date, endDate?: Date): Promise<{
        summary: any;
        dailyStats: any[];
    }>;
    static assignPermission(merchantId: number, permissionCode: string, permissionName: string, description?: string): Promise<any>;
    static removePermission(merchantId: number, permissionCode: string): Promise<number>;
    static listPermissions(merchantId: number): Promise<any[]>;
    static hasPermission(merchantId: number, permissionCode: string): Promise<boolean>;
}
//# sourceMappingURL=merchant.service.d.ts.map