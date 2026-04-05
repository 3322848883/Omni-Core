import { TrafficStats, TrafficOverview, UserTrafficInfo } from '@/types/user';
/**
 * Get traffic overview for a user (today, this month, total)
 */
export declare const getTrafficOverview: (userId: string) => Promise<TrafficOverview>;
/**
 * Get traffic trend for a user over specified number of days
 */
export declare const getTrafficTrend: (userId: string, days: number) => Promise<TrafficStats[]>;
/**
 * Get user traffic information with daily stats
 */
export declare const getUserTraffic: (userId: string, days: number) => Promise<UserTrafficInfo>;
/**
 * Record traffic for a user
 */
export declare const recordTraffic: (userId: string, upload: number, download: number) => Promise<void>;
//# sourceMappingURL=trafficService.d.ts.map