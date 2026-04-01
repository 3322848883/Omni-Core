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
    date: {
        pattern: RegExp;
        message: string;
    };
    orderStatus: {
        values: string[];
        message: string;
    };
    paymentMethod: {
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
    nodeId: {
        pattern: RegExp;
        min: number;
        max: number;
        message: string;
    };
    token: {
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
 * 预定义的验证模式 - 认证相关
 */
export declare const AuthValidation: {
    register: ValidationSchema;
    login: ValidationSchema;
    refresh: ValidationSchema;
    forgotPassword: ValidationSchema;
    resetPassword: ValidationSchema;
    updatePassword: ValidationSchema;
};
/**
 * 预定义的验证模式 - 用户相关
 */
export declare const UserValidation: {
    update: ValidationSchema;
    changePassword: ValidationSchema;
    uploadAvatar: ValidationSchema;
};
/**
 * 预定义的验证模式 - 订单相关
 */
export declare const OrderValidation: {
    create: ValidationSchema;
    list: ValidationSchema;
    byId: ValidationSchema;
};
/**
 * 预定义的验证模式 - 节点相关
 */
export declare const NodeValidation: {
    list: ValidationSchema;
    byId: ValidationSchema;
};
/**
 * 预定义的验证模式 - 邀请相关
 */
export declare const InviteValidation: {
    validate: ValidationSchema;
    create: ValidationSchema;
};
export {};
//# sourceMappingURL=validation.d.ts.map