/**
 * @jest-environment node
 */
/**
 * @jest-environment node
 */
import { POST } from '@/app/api/otp/send/route'
import { NextRequest } from 'next/server'

describe('OTP API', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('generates and logs OTP in mock mode', async () => {
    process.env.OTP_PROVIDER = 'mock'
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
    
    const request = new NextRequest('http://localhost:8000/api/otp/send', {
      method: 'POST',
      body: JSON.stringify({
        recipient: 'test@example.com',
        channel: 'email',
      }),
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.message).toContain('mock')
    expect(data.status).toBe('sent')
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[OTP Mock]')
    )
    
    consoleSpy.mockRestore()
  })

  it('calls external service in external mode', async () => {
    process.env.OTP_PROVIDER = 'external'
    process.env.OTP_EXTERNAL_SERVICE_URL = 'http://otp-service.com/send'
    
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'sent', messageId: '123' }),
    })
    
    const request = new NextRequest('http://localhost:8000/api/otp/send', {
      method: 'POST',
      body: JSON.stringify({
        recipient: 'test@example.com',
        channel: 'email',
      }),
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.status).toBe('sent')
    expect(global.fetch).toHaveBeenCalledWith(
      'http://otp-service.com/send',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    )
  })

  it('returns 400 for missing fields', async () => {
    const request = new NextRequest('http://localhost:8000/api/otp/send', {
      method: 'POST',
      body: JSON.stringify({
        recipient: 'test@example.com',
      }),
    })
    
    const response = await POST(request)
    
    expect(response.status).toBe(400)
  })

  it('handles external service errors', async () => {
    process.env.OTP_PROVIDER = 'external'
    process.env.OTP_EXTERNAL_SERVICE_URL = 'http://otp-service.com/send'
    
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'service_error' }),
    })
    
    const request = new NextRequest('http://localhost:8000/api/otp/send', {
      method: 'POST',
      body: JSON.stringify({
        recipient: 'test@example.com',
        channel: 'email',
      }),
    })
    
    const response = await POST(request)
    
    expect(response.status).toBe(500)
  })
})
