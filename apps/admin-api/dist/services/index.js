"use strict";
/**
 * 服务层导出索引
 * 集中导出所有服务模块
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = exports.getRedisClient = exports.RedisClient = exports.getScheduledTaskService = exports.ScheduledTaskService = exports.ValidationErrorCode = exports.getPlanValidationService = exports.PlanValidationService = exports.getIPPoolService = exports.IPPoolService = exports.getIPReputationService = exports.IPReputationService = void 0;
// IP资产管理服务
var ip_reputation_1 = require("./ip-reputation");
Object.defineProperty(exports, "IPReputationService", { enumerable: true, get: function () { return ip_reputation_1.IPReputationService; } });
Object.defineProperty(exports, "getIPReputationService", { enumerable: true, get: function () { return ip_reputation_1.getIPReputationService; } });
var ip_pool_1 = require("./ip-pool");
Object.defineProperty(exports, "IPPoolService", { enumerable: true, get: function () { return ip_pool_1.IPPoolService; } });
Object.defineProperty(exports, "getIPPoolService", { enumerable: true, get: function () { return ip_pool_1.getIPPoolService; } });
// 套餐权益验证服务
var plan_validation_1 = require("./plan-validation");
Object.defineProperty(exports, "PlanValidationService", { enumerable: true, get: function () { return plan_validation_1.PlanValidationService; } });
Object.defineProperty(exports, "getPlanValidationService", { enumerable: true, get: function () { return plan_validation_1.getPlanValidationService; } });
Object.defineProperty(exports, "ValidationErrorCode", { enumerable: true, get: function () { return plan_validation_1.ValidationErrorCode; } });
// 定时任务服务
var scheduled_tasks_1 = require("./scheduled-tasks");
Object.defineProperty(exports, "ScheduledTaskService", { enumerable: true, get: function () { return scheduled_tasks_1.ScheduledTaskService; } });
Object.defineProperty(exports, "getScheduledTaskService", { enumerable: true, get: function () { return scheduled_tasks_1.getScheduledTaskService; } });
// 缓存服务
var redis_1 = require("./cache/redis");
Object.defineProperty(exports, "RedisClient", { enumerable: true, get: function () { return redis_1.RedisClient; } });
Object.defineProperty(exports, "getRedisClient", { enumerable: true, get: function () { return redis_1.getRedisClient; } });
// 支付服务
__exportStar(require("./payment"), exports);
// Xray服务
__exportStar(require("./xray"), exports);
// 邮件服务
var email_1 = require("./email");
Object.defineProperty(exports, "emailService", { enumerable: true, get: function () { return email_1.emailService; } });
//# sourceMappingURL=index.js.map