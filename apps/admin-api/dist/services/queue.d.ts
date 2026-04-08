interface QueueConfig {
    name: string;
    durable?: boolean;
    autoDelete?: boolean;
}
declare class QueueService {
    private connection;
    private channel;
    private isConnected;
    private handlers;
    constructor();
    /**
     * 连接到 RabbitMQ
     */
    connect(): Promise<void>;
    /**
     * 断开连接
     */
    disconnect(): Promise<void>;
    /**
     * 确保队列存在
     */
    assertQueue(queueName: string, options?: Partial<QueueConfig>): Promise<void>;
    /**
     * 发送任务到队列
     */
    sendToQueue(queueName: string, payload: any, options?: {
        priority?: number;
    }): Promise<boolean>;
    /**
     * 注册任务处理器
     */
    registerHandler(queueName: string, handler: (payload: any) => Promise<void>): void;
    /**
     * 开始消费队列
     */
    startConsuming(queueName: string): Promise<void>;
    /**
     * 检查是否已连接
     */
    isReady(): boolean;
}
export declare const queueService: QueueService;
export {};
//# sourceMappingURL=queue.d.ts.map