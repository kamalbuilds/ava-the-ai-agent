export interface EventBus {
    connect(url: string): void;
    disconnect(): void;
    emit(event: string, data: any): void;
    subscribe(event: string, callback: (data: any) => void): void;
    unsubscribe(event: string, callback: (data: any) => void): void;
    isConnected(): boolean;
    onMessage(handler: (ev: MessageEvent) => void): void;
    getWebSocket(): WebSocket | null;
}