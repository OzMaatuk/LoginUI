# OTP Integration Guide

This document explains how to integrate an external OTP service with the SSO Login Service.

## Overview

The application supports two OTP providers:
- **Mock Provider**: For development and testing (logs OTP codes to console)
- **External Provider**: For production (sends OTP via HTTP to your service)

## Configuration

Set the following environment variables in `.env.local`:

```env
# For development/testing
OTP_PROVIDER=mock

# For production
OTP_PROVIDER=external
OTP_EXTERNAL_SERVICE_URL=https://your-otp-service.example.com/send
```

## External OTP Service Integration

### API Contract

Your external OTP service must accept POST requests with the following format:

#### Request

```http
POST /send HTTP/1.1
Host: your-otp-service.example.com
Content-Type: application/json

{
  "recipient": "user@example.com",
  "code": "123456",
  "channel": "email"
}
```

#### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `recipient` | string | Yes | Email address or phone number |
| `code` | string | Yes | 6-digit OTP code |
| `channel` | string | Yes | Either `"email"` or `"sms"` |

**Recipient Format:**
- Email: `user@example.com`
- Phone: E.164 format `+1234567890`

#### Success Response

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "sent",
  "messageId": "optional-tracking-id"
}
```

#### Error Response

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "invalid_recipient",
  "message": "Invalid email address"
}
```

### Error Codes

Your service should return appropriate HTTP status codes:

| Status | Description |
|--------|-------------|
| 200 | OTP sent successfully |
| 400 | Invalid request (bad recipient, missing fields) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
| 503 | Service temporarily unavailable |

## Implementation Examples

### Node.js/Express Example

```javascript
const express = require('express');
const app = express();

app.post('/send', async (req, res) => {
  const { recipient, code, channel } = req.body;

  // Validate input
  if (!recipient || !code || !channel) {
    return res.status(400).json({
      error: 'missing_fields',
      message: 'recipient, code, and channel are required'
    });
  }

  try {
    // Send OTP via your email/SMS service
    if (channel === 'email') {
      await sendEmail(recipient, code);
    } else if (channel === 'sms') {
      await sendSMS(recipient, code);
    }

    res.json({
      status: 'sent',
      messageId: generateMessageId()
    });
  } catch (error) {
    res.status(500).json({
      error: 'send_failed',
      message: error.message
    });
  }
});
```

### Python/Flask Example

```python
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/send', methods=['POST'])
def send_otp():
    data = request.get_json()
    
    recipient = data.get('recipient')
    code = data.get('code')
    channel = data.get('channel')
    
    if not all([recipient, code, channel]):
        return jsonify({
            'error': 'missing_fields',
            'message': 'recipient, code, and channel are required'
        }), 400
    
    try:
        if channel == 'email':
            send_email(recipient, code)
        elif channel == 'sms':
            send_sms(recipient, code)
        
        return jsonify({
            'status': 'sent',
            'messageId': generate_message_id()
        })
    except Exception as e:
        return jsonify({
            'error': 'send_failed',
            'message': str(e)
        }), 500
```

## Mock Provider

When `OTP_PROVIDER=mock`, the application logs OTP codes to the console instead of sending them:

```
[OTP Mock] Sending OTP to user@example.com via email: 123456
```

In development mode (`NODE_ENV=development`), the API response includes the code:

```json
{
  "message": "OTP sent successfully (mock)",
  "status": "sent",
  "code": "123456"
}
```

This allows you to test the OTP flow without setting up an external service.

## Testing Your Integration

### 1. Test with Mock Provider

```bash
# Set in .env.local
OTP_PROVIDER=mock

# Start the app
npm run dev

# Navigate to http://localhost:8000/login
# Enter email and request OTP
# Check console for the OTP code
```

### 2. Test with External Service

```bash
# Set in .env.local
OTP_PROVIDER=external
OTP_EXTERNAL_SERVICE_URL=http://localhost:3008/send

# Start your OTP service on port 3008
# Start the app
npm run dev

# Test the flow end-to-end
```

### 3. Test API Directly

```bash
# Test OTP send endpoint
curl -X POST http://localhost:8000/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "test@example.com",
    "channel": "email"
  }'
```

## Security Considerations

### Rate Limiting

Implement rate limiting on your OTP service to prevent abuse:

```javascript
// Example with express-rate-limit
const rateLimit = require('express-rate-limit');

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    error: 'rate_limit_exceeded',
    message: 'Too many OTP requests, please try again later'
  }
});

app.post('/send', otpLimiter, async (req, res) => {
  // ... handle OTP sending
});
```

### Input Validation

Always validate and sanitize inputs:

```javascript
const validator = require('validator');

function validateRecipient(recipient, channel) {
  if (channel === 'email') {
    return validator.isEmail(recipient);
  } else if (channel === 'sms') {
    // Validate E.164 phone format
    return /^\+[1-9]\d{1,14}$/.test(recipient);
  }
  return false;
}
```

### OTP Storage

Store OTPs securely with expiration:

```javascript
// Example with Redis
const redis = require('redis');
const client = redis.createClient();

async function storeOTP(recipient, code) {
  // Store with 5-minute expiration
  await client.setEx(`otp:${recipient}`, 300, code);
}

async function verifyOTP(recipient, code) {
  const storedCode = await client.get(`otp:${recipient}`);
  if (storedCode === code) {
    await client.del(`otp:${recipient}`);
    return true;
  }
  return false;
}
```

### HTTPS Only

Always use HTTPS in production:

```env
# Production
OTP_EXTERNAL_SERVICE_URL=https://otp-service.example.com/send

# Never use HTTP in production
# OTP_EXTERNAL_SERVICE_URL=http://otp-service.example.com/send
```

## Monitoring and Logging

### Log OTP Requests

```javascript
app.post('/send', async (req, res) => {
  const { recipient, channel } = req.body;
  
  console.log({
    timestamp: new Date().toISOString(),
    action: 'otp_send',
    recipient: maskRecipient(recipient),
    channel,
    ip: req.ip
  });
  
  // ... send OTP
});

function maskRecipient(recipient) {
  if (recipient.includes('@')) {
    // Mask email: u***@example.com
    const [local, domain] = recipient.split('@');
    return `${local[0]}***@${domain}`;
  } else {
    // Mask phone: +1***890
    return `${recipient.slice(0, 2)}***${recipient.slice(-3)}`;
  }
}
```

### Track Delivery Status

```javascript
const deliveryStatus = {
  sent: 0,
  failed: 0,
  rateLimit: 0
};

// Expose metrics endpoint
app.get('/metrics', (req, res) => {
  res.json(deliveryStatus);
});
```

## Troubleshooting

### OTP Not Received

1. Check service logs for errors
2. Verify recipient format is correct
3. Check spam/junk folders for emails
4. Verify SMS provider has sufficient credits
5. Test with mock provider first

### Connection Errors

```
Error: connect ECONNREFUSED
```

**Solution**: Verify `OTP_EXTERNAL_SERVICE_URL` is correct and service is running

### Timeout Errors

```
Error: Request timeout
```

**Solution**: Increase timeout or optimize your OTP service response time

### Rate Limit Errors

```
HTTP 429 Too Many Requests
```

**Solution**: Implement exponential backoff or inform user to wait

## Best Practices

1. **Use Short Expiration**: OTPs should expire in 5-10 minutes
2. **Limit Attempts**: Allow only 3-5 verification attempts
3. **One-Time Use**: Invalidate OTP after successful verification
4. **Secure Transport**: Always use HTTPS
5. **Rate Limiting**: Prevent abuse with rate limits
6. **Monitoring**: Track delivery rates and failures
7. **Fallback**: Have a backup channel (email if SMS fails)
8. **Clear Messages**: Provide clear error messages to users

## Integration Checklist

- [ ] External OTP service implements required API contract
- [ ] Service validates recipient format
- [ ] Rate limiting is configured
- [ ] OTPs expire after 5-10 minutes
- [ ] HTTPS is used in production
- [ ] Error handling is implemented
- [ ] Logging and monitoring are set up
- [ ] Service is tested with mock provider
- [ ] Service is tested with external provider
- [ ] Security review completed

## Support

For questions or issues:
- Check the main README.md
- Review MIGRATION_GUIDE.md
- Test with mock provider first
- Verify external service is accessible
