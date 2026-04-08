"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueService = void 0;
const amqplib_1 = __importDefault(require("amqplib"));
const config_1 = require("../../config");
const logger_1 = require("../../utils/logger");
class QueueService {
    connection = null;
    channel = null;
    isConnected = false;
    handlers = new Map();
    constructor() { }
    /**
     * 连接到 RabbitMQ
     */
    async connect() {
        if (this.isConnected && this.connection && this.channel) {
            return;
        }
        try {
            const { rabbitmq } = config_1.config;
            const url = `amqp://${rabbitmq.user}:${rabbitmq.password}@${rabbitmq.host}:${rabbitmq.port}${rabbitmq.vhost}`;
            this.connection = await amqplib_1.default.connect(url);
            this.channel = await this.connection.createChannel();
            this.isConnected = true;
            logger_1.logger.info('QueueService connected to RabbitMQ successfully');
            if (this.connection) {
                this.connection.on('error', (err) => {
                    logger_1.logger.error('QueueService RabbitMQ connection error:', err);
                    this.isConnected = false;
                });
                this.connection.on('close', () => {
                    logger_1.logger.warn('QueueService RabbitMQ connection closed');
                    this.isConnected = false;
                });
            }
        }
        catch (error) {
            logger_1.logger.error('QueueService failed to connect to RabbitMQ:', error);
            throw error;
        }
    }
    /**
     * 断开连接
     */
    async disconnect() {
        if (this.channel) {
            await this.channel.close();
        }
        if (this.connection) {
            await this.connection.close();
        }
        this.isConnected = false;
        logger_1.logger.info('QueueService disconnected from RabbitMQ');
    }
    /**
     * 确保队列存在
     */
    async assertQueue(queueName, options) {
        if (!this.channel) {
            throw new Error('QueueService not connected');
        }
        await this.channel.assertQueue(queueName, {
            durable: options?.durable ?? true,
            autoDelete: options?.autoDelete ?? false,
        });
    }
    /**
     * 发送任务到队列
     */
    async sendToQueue(queueName, payload, options) {
        if (!this.channel) {
            throw new Error('QueueService not connected');
        }
        try {
            await this.assertQueue(queueName);
            const task = {
                type: queueName,
                payload,
                createdAt: new Date(),
            };
            const message = Buffer.from(JSON.stringify(task));
            const result = this.channel.sendToQueue(queueName, message, {
                persistent: true,
                priority: options?.priority,
            });
            logger_1.logger.info(`QueueService sent task to queue ${queueName}`);
            return result;
        }
        catch (error) {
            logger_1.logger.error(`QueueService failed to send task to queue ${queueName}:`, error);
            return false;
        }
    }
    /**
     * 注册任务处理器
     */
    registerHandler(queueName, handler) {
        this.handlers.set(queueName, handler);
        logger_1.logger.info(`QueueService registered handler for queue ${queueName}`);
    }
    /**
     * 开始消费队列
     */
    async startConsuming(queueName) {
        if (!this.channel) {
            throw new Error('QueueService not connected');
        }
        await this.assertQueue(queueName);
        await this.channel.consume(queueName, async (msg) => {
            if (!msg || !this.channel) {
                return;
            }
            try {
                const content = msg.content.toString();
                const task = JSON.parse(content);
                const handler = this.handlers.get(queueName);
                if (handler) {
                    await handler(task.payload);
                    this.channel.ack(msg);
                    logger_1.logger.info(`QueueService processed task from queue ${queueName}`);
                }
                else {
                    logger_1.logger.warn(`QueueService no handler found for queue ${queueName}, nack message`);
                    this.channel.nack(msg, false, false);
                }
            }
            catch (error) {
                logger_1.logger.error(`QueueService failed to process task from queue ${queueName}:`, error);
                this.channel.nack(msg, false, true);
            }
        }, {
            noAck: false,
        });
        logger_1.logger.info(`QueueService started consuming queue ${queueName}`);
    }
    /**
     * 检查是否已连接
     */
    isReady() {
        return this.isConnected && this.channel !== null;
    }
}
exports.queueService = new QueueService();
//# sourceMappingURL=index.js.map