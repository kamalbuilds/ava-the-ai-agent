export interface EventBus {
    connect(url: string): void;
    disconnect(): void;
    emit(event: string, data: any): void;
    subscribe(event: string, callback: (data: any) => void): void;
    unsubscribe(event: string, callback: (data: any) => void): void;
    isConnected(): boolean;
    onMessage(handler: (ev: MessageEvent) => void): void;
    getWebSocket(): WebSocket | null;
    register(event: string, callback: (data: any) => void): void;
    unregister(event: string, callback: (data: any) => void): void;
    subscribeToAllMessages(callback: (data: any) => void): void;
    unsubscribeFromAllMessages(callback: (data: any) => void): void;
    sendRaw(data: any): void;
}