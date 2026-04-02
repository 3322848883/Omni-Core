"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentChannelService = exports.PaymentChannelService = void 0;
const logger_1 = require("../../utils/logger");
const database_1 = require("../../database");
const encryption_1 = require("../../utils/encryption");
class PaymentChannelService {
    /**
     * Create a new payment channel
     */
    async createChannel(request) {
        try {
            // Encrypt sensitive configuration
            const encryptedConfig = encryption_1.EncryptionUtil.encrypt(JSON.stringify(request.config));
            const [channel] = await (0, database_1.db)('payment_channels').insert({
                name: request.name,
                provider: request.provider,
                status: 'disabled',
                config: encryptedConfig,
                description: request.description,
                createdAt: new Date(),
                updatedAt: new Date(),
            }).returning('*');
            // Decrypt config for response
            channel.config = JSON.parse(encryption_1.EncryptionUtil.decrypt(channel.config));
            logger_1.logger.info(`Created payment channel: ${request.name}`);
            return channel;
        }
        catch (error) {
            logger_1.logger.error('Failed to create payment channel:', error);
            throw error;
        }
    }
    /**
     * Get all payment channels
     */
    async getAllChannels() {
        try {
            const channels = await (0, database_1.db)('payment_channels').select('*');
            // Decrypt config for each channel
            return channels.map(channel => {
                channel.config = JSON.parse(encryption_1.EncryptionUtil.decrypt(channel.config));
                return channel;
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get payment channels:', error);
            throw error;
        }
    }
    /**
     * Get payment channel by ID
     */
    async getChannelById(id) {
        try {
            const channel = await (0, database_1.db)('payment_channels').where('id', id).first();
            if (channel) {
                channel.config = JSON.parse(encryption_1.EncryptionUtil.decrypt(channel.config));
            }
            return channel;
        }
        catch (error) {
            logger_1.logger.error(`Failed to get payment channel ${id}:`, error);
            throw error;
        }
    }
    /**
     * Get payment channel by name
     */
    async getChannelByName(name) {
        try {
            const channel = await (0, database_1.db)('payment_channels').where('name', name).first();
            if (channel) {
                channel.config = JSON.parse(encryption_1.EncryptionUtil.decrypt(channel.config));
            }
            return channel;
        }
        catch (error) {
            logger_1.logger.error(`Failed to get payment channel ${name}:`, error);
            throw error;
        }
    }
    /**
     * Update payment channel
     */
    async updateChannel(id, request) {
        try {
            const updateData = {
                updatedAt: new Date(),
            };
            if (request.name !== undefined) {
                updateData.name = request.name;
            }
            if (request.config !== undefined) {
                updateData.config = encryption_1.EncryptionUtil.encrypt(JSON.stringify(request.config));
            }
            if (request.description !== undefined) {
                updateData.description = request.description;
            }
            if (request.status !== undefined) {
                updateData.status = request.status;
            }
            const [channel] = await (0, database_1.db)('payment_channels')
                .where('id', id)
                .update(updateData)
                .returning('*');
            // Decrypt config for response
            channel.config = JSON.parse(encryption_1.EncryptionUtil.decrypt(channel.config));
            logger_1.logger.info(`Updated payment channel: ${id}`);
            return channel;
        }
        catch (error) {
            logger_1.logger.error(`Failed to update payment channel ${id}:`, error);
            throw error;
        }
    }
    /**
     * Delete payment channel
     */
    async deleteChannel(id) {
        try {
            await (0, database_1.db)('payment_channels').where('id', id).delete();
            logger_1.logger.info(`Deleted payment channel: ${id}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to delete payment channel ${id}:`, error);
            throw error;
        }
    }
    /**
     * Enable payment channel
     */
    async enableChannel(id) {
        return this.updateChannel(id, { status: 'enabled' });
    }
    /**
     * Disable payment channel
     */
    async disableChannel(id) {
        return this.updateChannel(id, { status: 'disabled' });
    }
    /**
     * Check payment channel status
     */
    async checkChannelStatus(id) {
        try {
            const channel = await this.getChannelById(id);
            if (!channel) {
                throw new Error(`Payment channel ${id} not found`);
            }
            // Here you would implement actual status check logic
            // For example, ping the payment provider API
            const isActive = true; // Placeholder for actual check
            const [updatedChannel] = await (0, database_1.db)('payment_channels')
                .where('id', id)
                .update({
                lastCheckedAt: new Date(),
                lastStatus: isActive ? 'active' : 'inactive',
                updatedAt: new Date(),
            })
                .returning('*');
            // Decrypt config for response
            updatedChannel.config = JSON.parse(encryption_1.EncryptionUtil.decrypt(updatedChannel.config));
            logger_1.logger.info(`Checked status for payment channel ${id}: ${isActive ? 'active' : 'inactive'}`);
            return updatedChannel;
        }
        catch (error) {
            logger_1.logger.error(`Failed to check payment channel status ${id}:`, error);
            throw error;
        }
    }
    /**
     * Get active payment channels
     */
    async getActiveChannels() {
        try {
            const channels = await (0, database_1.db)('payment_channels').where('status', 'enabled').select('*');
            // Decrypt config for each channel
            return channels.map(channel => {
                channel.config = JSON.parse(encryption_1.EncryptionUtil.decrypt(channel.config));
                return channel;
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get active payment channels:', error);
            throw error;
        }
    }
    /**
     * Get payment channels by provider
     */
    async getChannelsByProvider(provider) {
        try {
            const channels = await (0, database_1.db)('payment_channels').where('provider', provider).select('*');
            // Decrypt config for each channel
            return channels.map(channel => {
                channel.config = JSON.parse(encryption_1.EncryptionUtil.decrypt(channel.config));
                return channel;
            });
        }
        catch (error) {
            logger_1.logger.error(`Failed to get payment channels for provider ${provider}:`, error);
            throw error;
        }
    }
}
exports.PaymentChannelService = PaymentChannelService;
exports.paymentChannelService = new PaymentChannelService();
//# sourceMappingURL=payment-channel.service.js.map