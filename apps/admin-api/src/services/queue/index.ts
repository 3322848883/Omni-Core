import amqp from 'amqplib';
import { config } from '../../config';
import { logger } from '../../utils/logger';

interface Task {
  type: string;
  payload: any;
  createdAt: Date;
}

class QueueService {
  private connection: any = null;
  private channel: any = null;
  private isConnected: boolean = false;
  private handlers: Map<string, (payload: any) => Promise<void>> = new Map();

  constructor() {}

  /**
   * 连接到 RabbitMQ
   */
  async connect(): Promise<void> {
    if (this.isConnected && this.connection && this.channel) {
      return;
    }

    try {
      const { rabbitmq } = config;
      const url = `amqp://${rabbitmq.user}:${rabbitmq.password}@${rabbitmq.host}:${rabbitmq.port}${rabbitmq.vhost}`;
      
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();
      
      this.isConnected = true;
      logger.info('QueueService connected to RabbitMQ successfully');

      if (this.connection) {
        this.connection.on('error', (err: any) => {
          logger.error('QueueService RabbitMQ connection error:', err);
          this.isConnected = false;
        });

        this.connection.on('close', () => {
          logger.warn('QueueService RabbitMQ connection closed');
          this.isConnected = false;
        });
      }
    } catch (error) {
      logger.error('QueueService failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
    this.isConnected = false;
    logger.info('QueueService disconnected from RabbitMQ');
  }

  /**
   * 确保队列存在
   */
  async assertQueue(queueName: string, options?: { durable?: boolean; autoDelete?: boolean }): Promise<void> {
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
  async sendToQueue(queueName: string, payload: any, options?: { priority?: number }): Promise<boolean> {
    if (!this.channel) {
      throw new Error('QueueService not connected');
    }

    try {
      await this.assertQueue(queueName);
      
      const task: Task = {
        type: queueName,
        payload,
        createdAt: new Date(),
      };

      const message = Buffer.from(JSON.stringify(task));
      const result = this.channel.sendToQueue(queueName, message, {
        persistent: true,
        priority: options?.priority,
      });

      logger.info(`QueueService sent task to queue ${queueName}`);
      return result;
    } catch (error) {
      logger.error(`QueueService failed to send task to queue ${queueName}:`, error);
      return false;
    }
  }

  /**
   * 注册任务处理器
   */
  registerHandler(queueName: string, handler: (payload: any) => Promise<void>): void {
    this.handlers.set(queueName, handler);
    logger.info(`QueueService registered handler for queue ${queueName}`);
  }

  /**
   * 开始消费队列
   */
  async startConsuming(queueName: string): Promise<void> {
    if (!this.channel) {
      throw new Error('QueueService not connected');
    }

    await this.assertQueue(queueName);

    await this.channel.consume(queueName, async (msg: any) => {
      if (!msg || !this.channel) {
        return;
      }

      try {
        const content = msg.content.toString();
        const task: Task = JSON.parse(content);
        
        const handler = this.handlers.get(queueName);
        if (handler) {
          await handler(task.payload);
          this.channel.ack(msg);
          logger.info(`QueueService processed task from queue ${queueName}`);
        } else {
          logger.warn(`QueueService no handler found for queue ${queueName}, nack message`);
          this.channel.nack(msg, false, false);
        }
      } catch (error) {
        logger.error(`QueueService failed to process task from queue ${queueName}:`, error);
        this.channel.nack(msg, false, true);
      }
    }, {
      noAck: false,
    });

    logger.info(`QueueService started consuming queue ${queueName}`);
  }

  /**
   * 检查是否已连接
   */
  isReady(): boolean {
    return this.isConnected && this.channel !== null;
  }
}

export const queueService = new QueueService();
