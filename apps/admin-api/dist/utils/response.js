"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequestId = createRequestId;
exports.sendSuccess = sendSuccess;
exports.sendError = sendError;
exports.sendPaginated = sendPaginated;
const uuid_1 = require("uuid");
/**
 * Generate a unique request ID
 */
function createRequestId() {
    return (0, uuid_1.v4)();
}
/**
 * Send success response
 */
function sendSuccess(res, data, message, statusCode = 200) {
    const response = {
        success: true,
        data,
        message,
        requestId: res.req.requestId || createRequestId(),
        timestamp: Date.now(),
    };
    res.status(statusCode).json(response);
}
/**
 * Send error response
 */
function sendError(res, message, code = 'INTERNAL_ERROR', statusCode = 500, errors) {
    const response = {
        success: false,
        message,
        code,
        requestId: res.req.requestId || createRequestId(),
        timestamp: Date.now(),
    };
    res.status(statusCode).json(response);
}
/**
 * Send paginated response
 */
function sendPaginated(res, data, total, page, limit, message) {
    const response = {
        success: true,
        data,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
        message,
        requestId: res.req.requestId || createRequestId(),
        timestamp: Date.now(),
    };
    res.status(200).json(response);
}
exports.default = {
    createRequestId,
    sendSuccess,
    sendError,
    sendPaginated,
};
//# sourceMappingURL=response.js.map