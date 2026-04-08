declare class QueueScheduler {
    private isRunning;
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    isReady(): boolean;
}
export declare const queueScheduler: QueueScheduler;
export {};
//# sourceMappingURL=scheduler.d.ts.map