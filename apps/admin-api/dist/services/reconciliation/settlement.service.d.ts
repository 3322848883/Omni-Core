import { PaymentProvider } from '../payment/types';
export interface SettlementReport {
    id: number;
    report_no: string;
    provider: string;
    start_date: Date;
    end_date: Date;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    total_orders: number;
    total_amount: number;
    fee_amount: number;
    net_amount: number;
    summary: any;
    created_at: Date;
    updated_at: Date;
}
export interface SettlementDetail {
    id: number;
    settlement_report_id: number;
    order_no: string;
    provider_order_id: string | null;
    amount: number;
    fee_amount: number;
    net_amount: number;
    currency: string;
    transaction_date: Date;
    created_at: Date;
}
export interface CreateSettlementRequest {
    provider: PaymentProvider;
    start_date: Date;
    end_date: Date;
}
export declare class SettlementService {
    /**
     * 生成结算报表编号
     */
    private generateReportNo;
    /**
     * 计算支付手续费
     */
    private calculateFee;
    /**
     * 创建结算报表
     */
    createSettlement(request: CreateSettlementRequest): Promise<SettlementReport>;
    /**
     * 执行结算
     */
    processSettlement(settlementId: number): Promise<SettlementReport>;
    /**
     * 获取结算报表列表
     */
    getSettlementReports(params: {
        provider?: string;
        startDate?: Date;
        endDate?: Date;
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        items: SettlementReport[];
        pagination: any;
    }>;
    /**
     * 获取结算详情
     */
    getSettlementDetails(settlementId: number, params: {
        page?: number;
        limit?: number;
    }): Promise<{
        items: SettlementDetail[];
        pagination: any;
    }>;
    /**
     * 获取结算报表详情
     */
    getSettlementById(id: number): Promise<SettlementReport | null>;
}
export declare const settlementService: SettlementService;
//# sourceMappingURL=settlement.service.d.ts.map