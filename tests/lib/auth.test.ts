import Cookies from 'js-cookie'
import {
  setToken,
  getToken,
  clearToken,
  setUser,
  getUser,
  isAuthenticated,
  decodeToken,
  User,
} from '@/lib/auth'

jest.mock('js-cookie')
jest.mock('@/lib/config', () => ({
  config: {
    tokenStorage: 'cookie',
    sessionTimeout: 3600000,
  },
}))

describe('auth library', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(localStorage.clear as jest.Mock).mockClear()
    ;(localStorage.getItem as jest.Mock).mockClear()
    ;(localStorage.setItem as jest.Mock).mockClear()
    ;(localStorage.removeItem as jest.Mock).mockClear()
  })

  describe('setToken', () => {
    it('sets token in cookies when tokenStorage is cookie', () => {
      setToken('test-token')
      expect(Cookies.set).toHaveBeenCalledWith('auth_token', 'test-token', {
        expires: expect.any(Number),
        secure: false,
        sameSite: 'strict',
      })
    })
  })

  describe('getToken', () => {
    it('gets token from cookies when tokenStorage is cookie', () => {
      ;(Cookies.get as jest.Mock).mockReturnValue('test-token')
      expect(getToken()).toBe('test-token')
    })

    it('returns null when no token exists', () => {
      ;(Cookies.get as jest.Mock).mockReturnValue(undefined)
      expect(getToken()).toBeNull()
    })
  })

  describe('clearToken', () => {
    it('removes token from cookies and user from localStorage', () => {
      clearToken()
      expect(Cookies.remove).toHaveBeenCalledWith('auth_token')
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_user')
    })
  })

  describe('setUser and getUser', () => {
    it('stores and retrieves user from localStorage', () => {
      const user: User = { id: '1', email: 'test@example.com', name: 'Test' }
      setUser(user)
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'auth_user',
        JSON.stringify(user)
      )

      ;(localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(user))
      expect(getUser()).toEqual(user)
    })

    it('returns null when user data is invalid', () => {
      ;(localStorage.getItem as jest.Mock).mockReturnValue('invalid-json')
      expect(getUser()).toBeNull()
    })
  })

  describe('isAuthenticated', () => {
    it('returns true when token exists', () => {
      ;(Cookies.get as jest.Mock).mockReturnValue('test-token')
      expect(isAuthenticated()).toBe(true)
    })

    it('returns false when token does not exist', () => {
      ;(Cookies.get as jest.Mock).mockReturnValue(undefined)
      expect(isAuthenticated()).toBe(false)
    })
  })

  describe('decodeToken', () => {
    it('decodes a valid JWT token', () => {
      const payload = { sub: '123', email: 'test@example.com' }
      const token = `header.${btoa(JSON.stringify(payload))}.signature`
      const decoded = decodeToken(token)
      expect(decoded).toEqual(payload)
    })

    it('returns null for invalid token', () => {
      expect(decodeToken('invalid-token')).toBeNull()
    })
  })
})
