"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorResponse = exports.successResponse = void 0;
exports.createRequestId = createRequestId;
exports.sendSuccess = sendSuccess;
exports.createdResponse = createdResponse;
exports.sendError = sendError;
exports.createPaginationMeta = createPaginationMeta;
exports.paginationResponse = paginationResponse;
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
 * Alias for sendSuccess - for backward compatibility
 */
exports.successResponse = sendSuccess;
/**
 * Send created response (201)
 */
function createdResponse(res, data, message) {
    const response = {
        success: true,
        data,
        message,
        requestId: res.req.requestId || createRequestId(),
        timestamp: Date.now(),
    };
    res.status(201).json(response);
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
 * Alias for sendError - for backward compatibility
 */
exports.errorResponse = sendError;
/**
 * Create pagination metadata
 */
function createPaginationMeta(page, pageSize, total) {
    const totalPages = Math.ceil(total / pageSize);
    return {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };
}
/**
 * Send pagination response
 */
function paginationResponse(res, data, meta, message) {
    const response = {
        success: true,
        data: {
            data,
            meta,
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
    createPaginationMeta,
    paginationResponse,
};
//# sourceMappingURL=response.js.map