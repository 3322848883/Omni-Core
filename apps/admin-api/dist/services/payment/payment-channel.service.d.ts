import { PaymentProvider } from './types';
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
export declare class PaymentChannelService {
    /**
     * Create a new payment channel
     */
    createChannel(request: CreatePaymentChannelRequest): Promise<PaymentChannel>;
    /**
     * Get all payment channels
     */
    getAllChannels(): Promise<PaymentChannel[]>;
    /**
     * Get payment channel by ID
     */
    getChannelById(id: number): Promise<PaymentChannel | null>;
    /**
     * Get payment channel by name
     */
    getChannelByName(name: string): Promise<PaymentChannel | null>;
    /**
     * Update payment channel
     */
    updateChannel(id: number, request: UpdatePaymentChannelRequest): Promise<PaymentChannel>;
    /**
     * Delete payment channel
     */
    deleteChannel(id: number): Promise<void>;
    /**
     * Enable payment channel
     */
    enableChannel(id: number): Promise<PaymentChannel>;
    /**
     * Disable payment channel
     */
    disableChannel(id: number): Promise<PaymentChannel>;
    /**
     * Check payment channel status
     */
    checkChannelStatus(id: number): Promise<PaymentChannel>;
    /**
     * Get active payment channels
     */
    getActiveChannels(): Promise<PaymentChannel[]>;
    /**
     * Get payment channels by provider
     */
    getChannelsByProvider(provider: PaymentProvider): Promise<PaymentChannel[]>;
}
export declare const paymentChannelService: PaymentChannelService;
//# sourceMappingURL=payment-channel.service.d.ts.map