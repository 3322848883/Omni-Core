"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const { combine, timestamp, printf, colorize, errors } = winston_1.default.format;
// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
    }
    if (stack) {
        msg += `\n${stack}`;
    }
    return msg;
});
// Create logger instance
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta: {
        service: 'client-api',
    },
    transports: [
        // Console transport
        new winston_1.default.transports.Console({
            format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), consoleFormat),
        }),
    ],
});
// Add file transport in production
if (process.env.NODE_ENV === 'production') {
    logger.add(new winston_1.default.transports.File({
        filename: '/var/log/omnicore/client-api-error.log',
        level: 'error',
        format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), winston_1.default.format.json()),
    }));
    logger.add(new winston_1.default.transports.File({
        filename: '/var/log/omnicore/client-api-combined.log',
        format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), winston_1.default.format.json()),
    }));
}
exports.default = logger;
//# sourceMappingURL=logger.js.map