"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settlementService = exports.SettlementService = void 0;
const logger_1 = require("../../utils/logger");
const database_1 = require("../../database");
class SettlementService {
    /**
     * 生成结算报表编号
     */
    generateReportNo() {
        const date = new Date();
        const dateStr = date.getFullYear() +
            String(date.getMonth() + 1).padStart(2, '0') +
            String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        return `SET${dateStr}${random}`;
    }
    /**
     * 计算支付手续费
     */
    calculateFee(provider, amount) {
        // 根据不同支付渠道设置不同的手续费率
        const feeRates = {
            stripe: 0.029, // Stripe 手续费率
            paypal: 0.029, // PayPal 手续费率
            alipay: 0.006, // 支付宝手续费率
            wechat: 0.006, // 微信支付手续费率
            alipay_merchant: 0.006, // 支付宝商户手续费率
            wechat_merchant: 0.006, // 微信支付商户手续费率
        };
        const rate = feeRates[provider] || 0.01;
        return amount * rate;
    }
    /**
     * 创建结算报表
     */
    async createSettlement(request) {
        try {
            const reportNo = this.generateReportNo();
            const [settlement] = await (0, database_1.db)('settlement_reports').insert({
                report_no: reportNo,
                provider: request.provider,
                start_date: request.start_date,
                end_date: request.end_date,
                status: 'pending',
                total_orders: 0,
                total_amount: 0,
                fee_amount: 0,
                net_amount: 0,
                summary: {},
                created_at: new Date(),
                updated_at: new Date(),
            }).returning('*');
            logger_1.logger.info(`Created settlement report: ${reportNo} for provider ${request.provider}`);
            return settlement;
        }
        catch (error) {
            logger_1.logger.error('Failed to create settlement report:', error);
            throw error;
        }
    }
    /**
     * 执行结算
     */
    async processSettlement(settlementId) {
        try {
            // 开始事务
            const trx = await database_1.db.transaction();
            try {
                // 更新结算状态为处理中
                await trx('settlement_reports')
                    .where('id', settlementId)
                    .update({
                    status: 'processing',
                    updated_at: new Date(),
                });
                // 获取结算信息
                const settlement = await trx('settlement_reports')
                    .where('id', settlementId)
                    .first();
                if (!settlement) {
                    throw new Error(`Settlement report ${settlementId} not found`);
                }
                // 获取指定时间段的订单
                const orders = await trx('orders')
                    .where('payment_method', settlement.provider)
                    .where('payment_time', '>=', new Date(settlement.start_date).toISOString())
                    .where('payment_time', '<=', new Date(settlement.end_date).toISOString())
                    .where('status', 'completed')
                    .select('*');
                // 计算总金额、手续费和净金额
                let totalAmount = 0;
                let totalFee = 0;
                for (const order of orders) {
                    const orderAmount = parseFloat(order.amount);
                    totalAmount += orderAmount;
                    totalFee += this.calculateFee(settlement.provider, orderAmount);
                    // 创建结算详情
                    const feeAmount = this.calculateFee(settlement.provider, orderAmount);
                    const netAmount = orderAmount - feeAmount;
                    await trx('settlement_details').insert({
                        settlement_report_id: settlementId,
                        order_no: order.order_no,
                        provider_order_id: null, // 实际应该从支付记录中获取
                        amount: orderAmount,
                        fee_amount: feeAmount,
                        net_amount: netAmount,
                        currency: 'USD', // 默认为USD，实际应该从订单中获取
                        transaction_date: order.payment_time,
                        created_at: new Date(),
                    });
                }
                const netAmount = totalAmount - totalFee;
                // 更新结算报表
                const [updatedSettlement] = await trx('settlement_reports')
                    .where('id', settlementId)
                    .update({
                    status: 'completed',
                    total_orders: orders.length,
                    total_amount: totalAmount,
                    fee_amount: totalFee,
                    net_amount: netAmount,
                    summary: {
                        orders_count: orders.length,
                        total_amount: totalAmount,
                        fee_amount: totalFee,
                        net_amount: netAmount,
                        average_order_value: orders.length > 0 ? totalAmount / orders.length : 0,
                    },
                    updated_at: new Date(),
                })
                    .returning('*');
                // 提交事务
                await trx.commit();
                logger_1.logger.info(`Processed settlement report: ${updatedSettlement.report_no} with ${orders.length} orders`);
                return updatedSettlement;
            }
            catch (error) {
                // 回滚事务
                await trx.rollback();
                throw error;
            }
        }
        catch (error) {
            // 更新结算状态为失败
            await (0, database_1.db)('settlement_reports')
                .where('id', settlementId)
                .update({
                status: 'failed',
                updated_at: new Date(),
            });
            logger_1.logger.error(`Failed to process settlement report ${settlementId}:`, error);
            throw error;
        }
    }
    /**
     * 获取结算报表列表
     */
    async getSettlementReports(params) {
        try {
            const page = params.page || 1;
            const limit = params.limit || 20;
            const offset = (page - 1) * limit;
            let query = (0, database_1.db)('settlement_reports');
            if (params.provider) {
                query = query.where('provider', params.provider);
            }
            if (params.startDate) {
                query = query.where('start_date', '>=', params.startDate);
            }
            if (params.endDate) {
                query = query.where('end_date', '<=', params.endDate);
            }
            if (params.status) {
                query = query.where('status', params.status);
            }
            const [countResult] = await query.clone().count('* as count');
            const total = parseInt(countResult.count);
            const settlements = await query
                .select('*')
                .orderBy('end_date', 'desc')
                .limit(limit)
                .offset(offset);
            return {
                items: settlements,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page * limit < total,
                    hasPrev: page > 1,
                },
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get settlement reports:', error);
            throw error;
        }
    }
    /**
     * 获取结算详情
     */
    async getSettlementDetails(settlementId, params) {
        try {
            const page = params.page || 1;
            const limit = params.limit || 20;
            const offset = (page - 1) * limit;
            const query = (0, database_1.db)('settlement_details').where('settlement_report_id', settlementId);
            const [countResult] = await query.clone().count('* as count');
            const total = parseInt(countResult.count);
            const details = await query
                .select('*')
                .orderBy('transaction_date', 'desc')
                .limit(limit)
                .offset(offset);
            return {
                items: details,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page * limit < total,
                    hasPrev: page > 1,
                },
            };
        }
        catch (error) {
            logger_1.logger.error(`Failed to get settlement details for ${settlementId}:`, error);
            throw error;
        }
    }
    /**
     * 获取结算报表详情
     */
    async getSettlementById(id) {
        try {
            const settlement = await (0, database_1.db)('settlement_reports').where('id', id).first();
            return settlement;
        }
        catch (error) {
            logger_1.logger.error(`Failed to get settlement report ${id}:`, error);
            throw error;
        }
    }
}
exports.SettlementService = SettlementService;
exports.settlementService = new SettlementService();
//# sourceMappingURL=settlement.service.js.map