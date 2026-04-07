import { Request } from 'express';

// Extend Express Request interface to include custom properties
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: {
        id: string;
        email: string;
        username: string;
        role: string;
        status: string;
      };
    }
  }
}

export {};
