import { WebSocket, WebSocketServer } from 'ws';
import { EventBus } from './comms/event-bus';

const WS_PORT = 3002; // Different port for WebSocket

export function setupWebSocket(eventBus: EventBus) {
    const wss = new WebSocketServer({ port: WS_PORT });

    wss.on('connection', (ws: WebSocket) => {
        console.log(`[WebSocket] Client connected on port ${WS_PORT}`);

        // Forward agent events to the client
        const forwardEvent = (data: any) => {
            ws.send(JSON.stringify(data));
        };

        eventBus.subscribe('agent-action', forwardEvent);
        eventBus.subscribe('agent-response', forwardEvent);
        eventBus.subscribe('agent-error', forwardEvent);

        ws.on('message', async (message: string) => {
            try {
                const data = JSON.parse(message);
                if (data.type === 'command') {
                    // Handle user commands
                    eventBus.emit('user-command', data);
                }
            } catch (error) {
                console.error('Error processing WebSocket message:', error);
            }
        });

        ws.on('close', () => {
            console.log('Client disconnected');
            eventBus.unsubscribe('agent-action', forwardEvent);
            eventBus.unsubscribe('agent-response', forwardEvent);
            eventBus.unsubscribe('agent-error', forwardEvent);
        });
    });

    return wss;
} 