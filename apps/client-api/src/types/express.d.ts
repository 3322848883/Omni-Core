import 'express';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: {
        id: string;
        userId: string;
        email: string;
        username: string;
        role: string;
        status: number;
        traffic_limit: number;
        traffic_used: number;
        expire_date: Date | null;
        vpn_uuid: string;
      };
    }
  }
}

export {};
