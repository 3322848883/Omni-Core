"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Jest setup file
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config({ path: '.env.test' });
// Global test timeout
jest.setTimeout(10000);
// Mock console methods in tests
global.console = {
    ...console,
    // Uncomment to ignore specific console methods in tests
    // log: jest.fn(),
    // debug: jest.fn(),
    // info: jest.fn(),
    // warn: jest.fn(),
    // error: jest.fn(),
};
//# sourceMappingURL=setup.js.map