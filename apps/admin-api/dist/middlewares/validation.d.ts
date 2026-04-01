import { Request, Response, NextFunction } from 'express';
/**
 * 验证规则定义
 */
export declare const ValidationRules: {
    email: {
        pattern: RegExp;
        message: string;
    };
    password: {
        min: number;
        max: number;
        pattern: RegExp;
        message: string;
    };
    uuid: {
        pattern: RegExp;
        message: string;
    };
    userId: {
        pattern: RegExp;
        message: string;
    };
    orderNo: {
        pattern: RegExp;
        message: string;
    };
    nodeCode: {
        pattern: RegExp;
        min: number;
        max: number;
        message: string;
    };
    username: {
        min: number;
        max: number;
        pattern: RegExp;
        message: string;
    };
    page: {
        min: number;
        default: number;
        message: string;
    };
    pageSize: {
        min: number;
        max: number;
        default: number;
        message: string;
    };
    status: {
        values: string[];
        message: string;
    };
    date: {
        pattern: RegExp;
        message: string;
    };
    protocol: {
        values: string[];
        message: string;
    };
    paymentMethod: {
        values: string[];
        message: string;
    };
    orderStatus: {
        values: string[];
        message: string;
    };
    positiveInt: {
        min: number;
        message: string;
    };
    nonNegativeInt: {
        min: number;
        message: string;
    };
    amount: {
        min: number;
        max: number;
        message: string;
    };
    trafficLimit: {
        min: number;
        max: number;
        message: string;
    };
    durationDays: {
        min: number;
        max: number;
        message: string;
    };
};
/**
 * 验证函数类型
 */
type ValidatorFunction = (value: unknown, field: string) => string | null;
/**
 * 字段验证规则
 */
interface FieldValidationRule {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
    min?: number;
    max?: number;
    pattern?: RegExp;
    values?: string[];
    validator?: ValidatorFunction;
    message?: string;
    transform?: (value: unknown) => unknown;
}
/**
 * 验证模式
 */
export interface ValidationSchema {
    body?: Record<string, FieldValidationRule>;
    query?: Record<string, FieldValidationRule>;
    params?: Record<string, FieldValidationRule>;
}
/**
 * 创建验证中间件
 */
export declare function validate(schema: ValidationSchema): (req: Request, res: Response, next: NextFunction) => void;
/**
 * 预定义的验证模式 - 用户相关
 */
export declare const UserValidation: {
    create: ValidationSchema;
    update: ValidationSchema;
    list: ValidationSchema;
    byId: ValidationSchema;
    ban: ValidationSchema;
    traffic: ValidationSchema;
};
/**
 * 预定义的验证模式 - 订单相关
 */
export declare const OrderValidation: {
    create: ValidationSchema;
    update: ValidationSchema;
    list: ValidationSchema;
    byId: ValidationSchema;
    pay: ValidationSchema;
    cancel: ValidationSchema;
    refund: ValidationSchema;
    createPayment: ValidationSchema;
    paymentRefund: ValidationSchema;
};
/**
 * 预定义的验证模式 - 节点相关
 */
export declare const NodeValidation: {
    create: ValidationSchema;
    update: ValidationSchema;
    list: ValidationSchema;
    byId: ValidationSchema;
    checkIp: ValidationSchema;
    updateConfig: ValidationSchema;
};
/**
 * 预定义的验证模式 - 认证相关
 */
export declare const AuthValidation: {
    login: ValidationSchema;
    refresh: ValidationSchema;
};
export {};
//# sourceMappingURL=validation.d.ts.map