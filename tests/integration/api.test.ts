import axios from 'axios'
import * as auth from '@/lib/auth'

jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
  isAxiosError: jest.fn(),
}))
jest.mock('@/lib/auth')

const mockedAxios = axios as jest.Mocked<typeof axios>

// Import after mocking
import { api, handleApiError } from '@/lib/api'

describe('API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('handleApiError', () => {
    it('handles axios error with response', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          data: { message: 'Invalid credentials' },
          status: 401,
        },
        message: 'Request failed',
      }

      ;(mockedAxios.isAxiosError as jest.MockedFunction<typeof axios.isAxiosError>).mockReturnValue(true)

      const result = handleApiError(axiosError)

      expect(result).toEqual({
        message: 'Invalid credentials',
        status: 401,
        errors: undefined,
      })
    })

    it('handles generic error', () => {
      const error = new Error('Network error')
      ;(mockedAxios.isAxiosError as jest.MockedFunction<typeof axios.isAxiosError>).mockReturnValue(false)

      const result = handleApiError(error)

      expect(result).toEqual({
        message: 'Network error',
      })
    })

    it('handles unknown error', () => {
      ;(mockedAxios.isAxiosError as jest.MockedFunction<typeof axios.isAxiosError>).mockReturnValue(false)

      const result = handleApiError('Unknown error')

      expect(result).toEqual({
        message: 'An error occurred',
      })
    })
  })
})
