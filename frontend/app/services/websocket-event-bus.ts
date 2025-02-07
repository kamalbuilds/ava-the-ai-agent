import { EventBus } from '../types/event-bus';

export class WebSocketEventBus implements EventBus {
    private ws: WebSocket | null = null;
    private subscribers: Map<string, ((data: any) => void)[]> = new Map();

    constructor(url: string = 'ws://localhost:3002') {
        this.connect(url);
    }

    private connect(url: string) {
        this.ws = new WebSocket(url);

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type && this.subscribers.has(data.type)) {
                    this.subscribers
                        .get(data.type)
                        ?.forEach((callback) => callback(data));
                }
            } catch (error) {
                console.error("Error processing WebSocket message:", error);
            }
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        this.ws.onclose = () => {
            console.log('WebSocket disconnected, attempting to reconnect...');
            setTimeout(() => this.connect(url), 2000);
        };
    }

    subscribe(event: string, callback: (data: any) => void): void {
        const subscribers = this.subscribers.get(event) || [];
        subscribers.push(callback);
        this.subscribers.set(event, subscribers);
    }

    unsubscribe(event: string, callback: (data: any) => void): void {
        const subscribers = this.subscribers.get(event) || [];
        const index = subscribers.indexOf(callback);
        if (index > -1) {
            subscribers.splice(index, 1);
            this.subscribers.set(event, subscribers);
        }
    }

    emit(event: string, data: any): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.error('WebSocket not connected');
            return;
        }
        this.ws.send(JSON.stringify({ type: event, ...data }));
    }
}
