import { logger } from '../../utils/logger';
import { db } from '../../database';
import { PaymentProvider } from './types';
import { EncryptionUtil } from '../../utils/encryption';

export interface PaymentChannel {
  id: number;
  name: string;
  provider: PaymentProvider;
  status: 'enabled' | 'disabled';
  config: any;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  lastCheckedAt?: Date;
  lastStatus?: string;
}

export interface CreatePaymentChannelRequest {
  name: string;
  provider: PaymentProvider;
  config: any;
  description?: string;
}

export interface UpdatePaymentChannelRequest {
  name?: string;
  config?: any;
  description?: string;
  status?: 'enabled' | 'disabled';
}

export class PaymentChannelService {
  /**
   * Create a new payment channel
   */
  async createChannel(request: CreatePaymentChannelRequest): Promise<PaymentChannel> {
    try {
      // Encrypt sensitive configuration
      const encryptedConfig = EncryptionUtil.encrypt(JSON.stringify(request.config));

      const [channel] = await db('payment_channels').insert({
        name: request.name,
        provider: request.provider,
        status: 'disabled',
        config: encryptedConfig,
        description: request.description,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning('*');

      // Decrypt config for response
      channel.config = JSON.parse(EncryptionUtil.decrypt(channel.config as string));

      logger.info(`Created payment channel: ${request.name}`);
      return channel;
    } catch (error) {
      logger.error('Failed to create payment channel:', error);
      throw error;
    }
  }

  /**
   * Get all payment channels
   */
  async getAllChannels(): Promise<PaymentChannel[]> {
    try {
      const channels = await db('payment_channels').select('*');
      // Decrypt config for each channel
      return channels.map(channel => {
        channel.config = JSON.parse(EncryptionUtil.decrypt(channel.config as string));
        return channel;
      });
    } catch (error) {
      logger.error('Failed to get payment channels:', error);
      throw error;
    }
  }

  /**
   * Get payment channel by ID
   */
  async getChannelById(id: number): Promise<PaymentChannel | null> {
    try {
      const channel = await db('payment_channels').where('id', id).first();
      if (channel) {
        channel.config = JSON.parse(EncryptionUtil.decrypt(channel.config as string));
      }
      return channel;
    } catch (error) {
      logger.error(`Failed to get payment channel ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get payment channel by name
   */
  async getChannelByName(name: string): Promise<PaymentChannel | null> {
    try {
      const channel = await db('payment_channels').where('name', name).first();
      if (channel) {
        channel.config = JSON.parse(EncryptionUtil.decrypt(channel.config as string));
      }
      return channel;
    } catch (error) {
      logger.error(`Failed to get payment channel ${name}:`, error);
      throw error;
    }
  }

  /**
   * Update payment channel
   */
  async updateChannel(id: number, request: UpdatePaymentChannelRequest): Promise<PaymentChannel> {
    try {
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (request.name !== undefined) {
        updateData.name = request.name;
      }
      if (request.config !== undefined) {
        updateData.config = EncryptionUtil.encrypt(JSON.stringify(request.config));
      }
      if (request.description !== undefined) {
        updateData.description = request.description;
      }
      if (request.status !== undefined) {
        updateData.status = request.status;
      }

      const [channel] = await db('payment_channels')
        .where('id', id)
        .update(updateData)
        .returning('*');

      // Decrypt config for response
      channel.config = JSON.parse(EncryptionUtil.decrypt(channel.config as string));

      logger.info(`Updated payment channel: ${id}`);
      return channel;
    } catch (error) {
      logger.error(`Failed to update payment channel ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete payment channel
   */
  async deleteChannel(id: number): Promise<void> {
    try {
      await db('payment_channels').where('id', id).delete();
      logger.info(`Deleted payment channel: ${id}`);
    } catch (error) {
      logger.error(`Failed to delete payment channel ${id}:`, error);
      throw error;
    }
  }

  /**
   * Enable payment channel
   */
  async enableChannel(id: number): Promise<PaymentChannel> {
    return this.updateChannel(id, { status: 'enabled' });
  }

  /**
   * Disable payment channel
   */
  async disableChannel(id: number): Promise<PaymentChannel> {
    return this.updateChannel(id, { status: 'disabled' });
  }

  /**
   * Check payment channel status
   */
  async checkChannelStatus(id: number): Promise<PaymentChannel> {
    try {
      const channel = await this.getChannelById(id);
      if (!channel) {
        throw new Error(`Payment channel ${id} not found`);
      }

      // Here you would implement actual status check logic
      // For example, ping the payment provider API
      const isActive = true; // Placeholder for actual check

      const [updatedChannel] = await db('payment_channels')
        .where('id', id)
        .update({
          lastCheckedAt: new Date(),
          lastStatus: isActive ? 'active' : 'inactive',
          updatedAt: new Date(),
        })
        .returning('*');

      // Decrypt config for response
      updatedChannel.config = JSON.parse(EncryptionUtil.decrypt(updatedChannel.config as string));

      logger.info(`Checked status for payment channel ${id}: ${isActive ? 'active' : 'inactive'}`);
      return updatedChannel;
    } catch (error) {
      logger.error(`Failed to check payment channel status ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get active payment channels
   */
  async getActiveChannels(): Promise<PaymentChannel[]> {
    try {
      const channels = await db('payment_channels').where('status', 'enabled').select('*');
      // Decrypt config for each channel
      return channels.map(channel => {
        channel.config = JSON.parse(EncryptionUtil.decrypt(channel.config as string));
        return channel;
      });
    } catch (error) {
      logger.error('Failed to get active payment channels:', error);
      throw error;
    }
  }

  /**
   * Get payment channels by provider
   */
  async getChannelsByProvider(provider: PaymentProvider): Promise<PaymentChannel[]> {
    try {
      const channels = await db('payment_channels').where('provider', provider).select('*');
      // Decrypt config for each channel
      return channels.map(channel => {
        channel.config = JSON.parse(EncryptionUtil.decrypt(channel.config as string));
        return channel;
      });
    } catch (error) {
      logger.error(`Failed to get payment channels for provider ${provider}:`, error);
      throw error;
    }
  }
}

export const paymentChannelService = new PaymentChannelService();
