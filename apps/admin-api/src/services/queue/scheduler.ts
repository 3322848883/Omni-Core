import { config } from '../../config';
import { logger } from '../../utils/logger';
import { queueService } from './index';
import { emailTaskHandler } from './email-handler';
import { trafficStatsHandler } from './traffic-handler';

class QueueScheduler {
  private isRunning: boolean = false;

  async initialize(): Promise<void> {
    try {
      logger.info('QueueScheduler: Initializing queue scheduler...');

      await queueService.connect();

      queueService.registerHandler(config.queues.email, emailTaskHandler.handle.bind(emailTaskHandler));
      queueService.registerHandler(config.queues.trafficStats, trafficStatsHandler.handle.bind(trafficStatsHandler));

      await queueService.startConsuming(config.queues.email);
      await queueService.startConsuming(config.queues.trafficStats);

      this.isRunning = true;
      logger.info('QueueScheduler: Queue scheduler initialized successfully');
    } catch (error) {
      logger.error('QueueScheduler: Failed to initialize queue scheduler', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      logger.info('QueueScheduler: Shutting down queue scheduler...');
      await queueService.disconnect();
      this.isRunning = false;
      logger.info('QueueScheduler: Queue scheduler shut down successfully');
    } catch (error) {
      logger.error('QueueScheduler: Error shutting down queue scheduler', error);
      throw error;
    }
  }

  isReady(): boolean {
    return this.isRunning && queueService.isReady();
  }
}

export const queueScheduler = new QueueScheduler();
