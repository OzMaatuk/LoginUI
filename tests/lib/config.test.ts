import { config, getApiUrl } from '@/lib/config'

describe('config', () => {
  it('has default values', () => {
    expect(config.apiUrl).toBeDefined()
    expect(config.apiVersion).toBeDefined()
    expect(config.appName).toBeDefined()
  })

  it('generates correct API URL', () => {
    const url = getApiUrl('/auth/login')
    expect(url).toContain('/api/')
    expect(url).toContain('/auth/login')
  })
})
