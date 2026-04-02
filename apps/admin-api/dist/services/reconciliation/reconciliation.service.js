"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reconciliationService = exports.ReconciliationService = void 0;
const logger_1 = require("../../utils/logger");
const database_1 = require("../../database");
class ReconciliationService {
    /**
     * 生成对账编号
     */
    generateReconciliationNo() {
        const date = new Date();
        const dateStr = date.getFullYear() +
            String(date.getMonth() + 1).padStart(2, '0') +
            String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        return `REC${dateStr}${random}`;
    }
    /**
     * 创建对账记录
     */
    async createReconciliation(request) {
        try {
            const reconciliationNo = this.generateReconciliationNo();
            const [reconciliation] = await (0, database_1.db)('reconciliations').insert({
                reconciliation_no: reconciliationNo,
                provider: request.provider,
                reconciliation_date: request.reconciliation_date,
                status: 'pending',
                total_orders: 0,
                matched_orders: 0,
                unmatched_orders: 0,
                total_amount: 0,
                matched_amount: 0,
                unmatched_amount: 0,
                summary: {},
                created_at: new Date(),
                updated_at: new Date(),
            }).returning('*');
            logger_1.logger.info(`Created reconciliation: ${reconciliationNo} for provider ${request.provider}`);
            return reconciliation;
        }
        catch (error) {
            logger_1.logger.error('Failed to create reconciliation:', error);
            throw error;
        }
    }
    /**
     * 执行对账
     */
    async processReconciliation(reconciliationId) {
        try {
            // 开始事务
            const trx = await database_1.db.transaction();
            try {
                // 更新对账状态为处理中
                await trx('reconciliations')
                    .where('id', reconciliationId)
                    .update({
                    status: 'processing',
                    updated_at: new Date(),
                });
                // 获取对账信息
                const reconciliation = await trx('reconciliations')
                    .where('id', reconciliationId)
                    .first();
                if (!reconciliation) {
                    throw new Error(`Reconciliation ${reconciliationId} not found`);
                }
                // 获取指定日期的订单
                const orders = await trx('orders')
                    .where('payment_method', reconciliation.provider)
                    .where('payment_time', '>=', new Date(reconciliation.reconciliation_date).toISOString())
                    .where('payment_time', '<', new Date(reconciliation.reconciliation_date).setDate(new Date(reconciliation.reconciliation_date).getDate() + 1).toISOString())
                    .where('status', 'completed')
                    .select('*');
                // 获取支付流程记录
                const paymentFlows = await trx('payment_flows')
                    .where('provider', reconciliation.provider)
                    .where('createdAt', '>=', new Date(reconciliation.reconciliation_date).toISOString())
                    .where('createdAt', '<', new Date(reconciliation.reconciliation_date).setDate(new Date(reconciliation.reconciliation_date).getDate() + 1).toISOString())
                    .where('status', 'success')
                    .select('*');
                // 匹配订单和支付记录
                const matchedOrders = new Set();
                const matchedPaymentFlows = new Set();
                let totalAmount = 0;
                let matchedAmount = 0;
                // 处理匹配
                for (const order of orders) {
                    totalAmount += parseFloat(order.amount);
                    const paymentFlow = paymentFlows.find(pf => pf.orderId === order.id.toString() &&
                        parseFloat(pf.amount) === parseFloat(order.amount));
                    if (paymentFlow) {
                        matchedOrders.add(order.order_no);
                        matchedPaymentFlows.add(paymentFlow.idempotencyKey);
                        matchedAmount += parseFloat(order.amount);
                        // 创建对账详情
                        await trx('reconciliation_details').insert({
                            reconciliation_id: reconciliationId,
                            order_no: order.order_no,
                            provider_order_id: paymentFlow.providerOrderId,
                            amount: order.amount,
                            currency: paymentFlow.currency,
                            status: 'matched',
                            error_message: null,
                            created_at: new Date(),
                        });
                    }
                    else {
                        // 未匹配的订单
                        await trx('reconciliation_details').insert({
                            reconciliation_id: reconciliationId,
                            order_no: order.order_no,
                            provider_order_id: null,
                            amount: order.amount,
                            currency: 'USD', // 默认为USD，实际应该从订单中获取
                            status: 'unmatched',
                            error_message: 'No matching payment flow found',
                            created_at: new Date(),
                        });
                    }
                }
                // 处理未匹配的支付记录
                for (const paymentFlow of paymentFlows) {
                    if (!matchedPaymentFlows.has(paymentFlow.idempotencyKey)) {
                        await trx('reconciliation_details').insert({
                            reconciliation_id: reconciliationId,
                            order_no: paymentFlow.orderNo,
                            provider_order_id: paymentFlow.providerOrderId,
                            amount: paymentFlow.amount,
                            currency: paymentFlow.currency,
                            status: 'unmatched',
                            error_message: 'No matching order found',
                            created_at: new Date(),
                        });
                    }
                }
                // 更新对账记录
                const unmatchedAmount = totalAmount - matchedAmount;
                const totalOrders = orders.length + (paymentFlows.length - matchedPaymentFlows.size);
                const unmatchedOrders = totalOrders - matchedOrders.size;
                const [updatedReconciliation] = await trx('reconciliations')
                    .where('id', reconciliationId)
                    .update({
                    status: 'completed',
                    total_orders: totalOrders,
                    matched_orders: matchedOrders.size,
                    unmatched_orders: unmatchedOrders,
                    total_amount: totalAmount,
                    matched_amount: matchedAmount,
                    unmatched_amount: unmatchedAmount,
                    summary: {
                        orders_count: orders.length,
                        payment_flows_count: paymentFlows.length,
                        matched_count: matchedOrders.size,
                        unmatched_count: unmatchedOrders,
                    },
                    updated_at: new Date(),
                })
                    .returning('*');
                // 提交事务
                await trx.commit();
                logger_1.logger.info(`Processed reconciliation: ${updatedReconciliation.reconciliation_no} with ${matchedOrders.size} matched orders`);
                return updatedReconciliation;
            }
            catch (error) {
                // 回滚事务
                await trx.rollback();
                throw error;
            }
        }
        catch (error) {
            // 更新对账状态为失败
            await (0, database_1.db)('reconciliations')
                .where('id', reconciliationId)
                .update({
                status: 'failed',
                updated_at: new Date(),
            });
            logger_1.logger.error(`Failed to process reconciliation ${reconciliationId}:`, error);
            throw error;
        }
    }
    /**
     * 获取对账记录列表
     */
    async getReconciliations(params) {
        try {
            const page = params.page || 1;
            const limit = params.limit || 20;
            const offset = (page - 1) * limit;
            let query = (0, database_1.db)('reconciliations');
            if (params.provider) {
                query = query.where('provider', params.provider);
            }
            if (params.startDate) {
                query = query.where('reconciliation_date', '>=', params.startDate);
            }
            if (params.endDate) {
                query = query.where('reconciliation_date', '<=', params.endDate);
            }
            if (params.status) {
                query = query.where('status', params.status);
            }
            const [countResult] = await query.clone().count('* as count');
            const total = parseInt(countResult.count);
            const reconciliations = await query
                .select('*')
                .orderBy('reconciliation_date', 'desc')
                .limit(limit)
                .offset(offset);
            return {
                items: reconciliations,
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
            logger_1.logger.error('Failed to get reconciliations:', error);
            throw error;
        }
    }
    /**
     * 获取对账详情
     */
    async getReconciliationDetails(reconciliationId, params) {
        try {
            const page = params.page || 1;
            const limit = params.limit || 20;
            const offset = (page - 1) * limit;
            let query = (0, database_1.db)('reconciliation_details').where('reconciliation_id', reconciliationId);
            if (params.status) {
                query = query.where('status', params.status);
            }
            const [countResult] = await query.clone().count('* as count');
            const total = parseInt(countResult.count);
            const details = await query
                .select('*')
                .orderBy('created_at', 'desc')
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
            logger_1.logger.error(`Failed to get reconciliation details for ${reconciliationId}:`, error);
            throw error;
        }
    }
    /**
     * 获取对账记录详情
     */
    async getReconciliationById(id) {
        try {
            const reconciliation = await (0, database_1.db)('reconciliations').where('id', id).first();
            return reconciliation;
        }
        catch (error) {
            logger_1.logger.error(`Failed to get reconciliation ${id}:`, error);
            throw error;
        }
    }
}
exports.ReconciliationService = ReconciliationService;
exports.reconciliationService = new ReconciliationService();
//# sourceMappingURL=reconciliation.service.js.map