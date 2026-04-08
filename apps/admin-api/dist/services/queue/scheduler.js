"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueScheduler = void 0;
const config_1 = require("../../config");
const logger_1 = require("../../utils/logger");
const index_1 = require("./index");
const email_handler_1 = require("./email-handler");
const traffic_handler_1 = require("./traffic-handler");
class QueueScheduler {
    isRunning = false;
    async initialize() {
        try {
            logger_1.logger.info('QueueScheduler: Initializing queue scheduler...');
            await index_1.queueService.connect();
            index_1.queueService.registerHandler(config_1.config.queues.email, email_handler_1.emailTaskHandler.handle.bind(email_handler_1.emailTaskHandler));
            index_1.queueService.registerHandler(config_1.config.queues.trafficStats, traffic_handler_1.trafficStatsHandler.handle.bind(traffic_handler_1.trafficStatsHandler));
            await index_1.queueService.startConsuming(config_1.config.queues.email);
            await index_1.queueService.startConsuming(config_1.config.queues.trafficStats);
            this.isRunning = true;
            logger_1.logger.info('QueueScheduler: Queue scheduler initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('QueueScheduler: Failed to initialize queue scheduler', error);
            throw error;
        }
    }
    async shutdown() {
        if (!this.isRunning) {
            return;
        }
        try {
            logger_1.logger.info('QueueScheduler: Shutting down queue scheduler...');
            await index_1.queueService.disconnect();
            this.isRunning = false;
            logger_1.logger.info('QueueScheduler: Queue scheduler shut down successfully');
        }
        catch (error) {
            logger_1.logger.error('QueueScheduler: Error shutting down queue scheduler', error);
            throw error;
        }
    }
    isReady() {
        return this.isRunning && index_1.queueService.isReady();
    }
}
exports.queueScheduler = new QueueScheduler();
//# sourceMappingURL=scheduler.js.map