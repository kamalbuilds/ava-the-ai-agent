import { EventBus } from '../types/event-bus';

export class WebSocketEventBus implements EventBus {
    private ws: WebSocket | null = null;
    private subscribers: Map<string, Array<(data: any) => void>> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;

    constructor(url: string = process.env['NEXT_PUBLIC_WEBSOCKET_URL'] || 'ws://localhost:3001') {
        this.connect(url);
    }

    public register(event: string, callback: Function): void {
        this.subscribe(event, callback);
    }

    public unregister(event: string, callback: Function): void {
        this.unsubscribe(event, callback);
    }

    public connect(url: string): void {
        try {
            this.ws = new WebSocket(url);
            this.setupWebSocketHandlers();
        } catch (error) {
            console.error('WebSocket connection error:', error);
            this.handleReconnect();
        }
    }

    private setupWebSocketHandlers(): void {
        if (!this.ws) return;

        this.ws.onopen = () => {
            console.log('WebSocket connected');
            this.reconnectAttempts = 0;
            this.emit('connection', { status: 'connected' });
        };

        this.ws.onmessage = (ev) => {
            try {
                const data = JSON.parse(ev.data);
                const subscribers = this.subscribers.get(data.type);
                if (subscribers) {
                    subscribers.forEach((callback) => callback(data));
                }
            } catch (error) {
                console.error('Error handling WebSocket message:', error);
            }
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.handleReconnect();
        };

        this.ws.onclose = () => {
            console.log('WebSocket closed');
            this.handleReconnect();
        };
    }

    private handleReconnect(): void {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
                console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                this.connect(this.ws?.url || '');
            }, this.reconnectDelay * this.reconnectAttempts);
        }
    }

    public emit(event: string, data: any): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: event, ...data }));
        }
    }

    public subscribe(event: string, callback: (data: any) => void): void {
        if (!this.subscribers.has(event)) {
            this.subscribers.set(event, []);
        }
        this.subscribers.get(event)?.push(callback);
    }

    public unsubscribe(event: string, callback: (data: any) => void): void {
        const subscribers = this.subscribers.get(event);
        if (subscribers) {
            const index = subscribers.indexOf(callback);
            if (index !== -1) {
                subscribers.splice(index, 1);
            }
        }
    }

    public disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.subscribers.clear();
    }

    public isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }

    public onMessage(handler: (ev: MessageEvent) => void): void {
        if (this.ws) {
            this.ws.onmessage = handler;
        }
    }

    public getWebSocket(): WebSocket | null {
        return this.ws;
    }
}
