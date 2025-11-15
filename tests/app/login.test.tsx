import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSession, signIn } from 'next-auth/react'
import LoginPage from '@/app/login/page'

jest.mock('next-auth/react')

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })
  })

  it('renders login page with Authentik button', () => {
    render(<LoginPage />, { wrapper: createWrapper() })
    
    expect(screen.getByText('SSO Login')).toBeInTheDocument()
    expect(screen.getByText('Login with Authentik')).toBeInTheDocument()
  })

  it('calls signIn when Authentik button is clicked', async () => {
    render(<LoginPage />, { wrapper: createWrapper() })
    
    const authentikButton = screen.getByText('Login with Authentik')
    fireEvent.click(authentikButton)
    
    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('authentik', { callbackUrl: '/profile' })
    })
  })

  it('disables button when loading', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'loading',
    })
    
    render(<LoginPage />, { wrapper: createWrapper() })
    
    const button = screen.getByText('Loading...')
    expect(button).toBeDisabled()
  })
})
