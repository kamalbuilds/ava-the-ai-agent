# Guide API Reference

## Endpoints

### GET /api/guide/health
Returns the health status of the Guide service.

**Response:**
```json
{
  "status": "healthy",
  "initialized": true
}
```

### POST /api/guide/action
Performs an action on the Guide service.

**Request Body:**
```json
{
  "action": "activate|deactivate",
  "params": {}
}
```

**Response:**
```json
{
  "success": true,
  "component": "Guide",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 500 | Service not initialized |
| 400 | Invalid request parameters |
