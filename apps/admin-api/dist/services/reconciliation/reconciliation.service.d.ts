import { PaymentProvider } from '../payment/types';
export interface Reconciliation {
    id: number;
    reconciliation_no: string;
    provider: string;
    reconciliation_date: Date;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    total_orders: number;
    matched_orders: number;
    unmatched_orders: number;
    total_amount: number;
    matched_amount: number;
    unmatched_amount: number;
    summary: any;
    created_at: Date;
    updated_at: Date;
}
export interface ReconciliationDetail {
    id: number;
    reconciliation_id: number;
    order_no: string;
    provider_order_id: string | null;
    amount: number;
    currency: string;
    status: 'matched' | 'unmatched' | 'error';
    error_message: string | null;
    created_at: Date;
}
export interface CreateReconciliationRequest {
    provider: PaymentProvider;
    reconciliation_date: Date;
}
export declare class ReconciliationService {
    /**
     * 生成对账编号
     */
    private generateReconciliationNo;
    /**
     * 创建对账记录
     */
    createReconciliation(request: CreateReconciliationRequest): Promise<Reconciliation>;
    /**
     * 执行对账
     */
    processReconciliation(reconciliationId: number): Promise<Reconciliation>;
    /**
     * 获取对账记录列表
     */
    getReconciliations(params: {
        provider?: string;
        startDate?: Date;
        endDate?: Date;
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        items: Reconciliation[];
        pagination: any;
    }>;
    /**
     * 获取对账详情
     */
    getReconciliationDetails(reconciliationId: number, params: {
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        items: ReconciliationDetail[];
        pagination: any;
    }>;
    /**
     * 获取对账记录详情
     */
    getReconciliationById(id: number): Promise<Reconciliation | null>;
}
export declare const reconciliationService: ReconciliationService;
//# sourceMappingURL=reconciliation.service.d.ts.map