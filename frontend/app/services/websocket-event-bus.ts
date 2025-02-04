import { EventBus } from '../types/event-bus';

export class WebSocketEventBus implements EventBus {
    private ws: WebSocket | null = null;
    private subscribers: Map<string, Function[]> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;

    constructor(url: string = 'ws://localhost:3002') {
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

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type && this.subscribers.has(data.type)) {
                    this.subscribers.get(data.type)?.forEach(callback => callback(data));
                }
            } catch (error) {
                console.error('Error processing WebSocket message:', error);
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
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.error('WebSocket not connected');
            return;
        }
        this.ws.send(JSON.stringify({ type: event, ...data }));
    }

    public subscribe(event: string, callback: Function): void {
        if (!this.subscribers.has(event)) {
            this.subscribers.set(event, []);
        }
        this.subscribers.get(event)?.push(callback);
    }

    public unsubscribe(event: string, callback: Function): void {
        const callbacks = this.subscribers.get(event);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    public disconnect(): void {
        this.ws?.close();
        this.ws = null;
        this.subscribers.clear();
    }
}
