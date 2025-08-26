import { BrowserRouter } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from './state/store'
import AppRouter from './router/router'
import ErrorBoundary from './components/ui/ErrorBoundary'
import LoadingSpinner from './components/ui/LoadingSpinner'
import { useAuthCheck } from './hooks/useAuthCheck'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useNetworkStatus } from './hooks/useNetworkStatus'
import { offlineDB } from './utils/db'
import React from 'react'
import { registerSW } from 'virtual:pwa-register'
import { OfflineStatus } from './components/ui/OfflineStatus'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: (failureCount, error: any) => {
        if (error?.status >= 400 && error?.status < 500 && error?.status !== 408) {
          return false
        }
        return failureCount < 3
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
    },
    mutations: {
      retry: 1
    }
  }
})

const PWARegistration: React.FC = () => {
  useEffect(() => {
    const updateSW = registerSW({
      onNeedRefresh() {
        if (confirm('New version available! Reload to update?')) {
          updateSW(true)
        }
      },
      onOfflineReady() {
        console.log('App ready to work offline')
      },
      onRegisterError(error) {
        console.error('SW registration error:', error)
      }
    })
    return () => {
      updateSW(false)
    }
  }, [])
  return null
}

const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const networkStatus = useNetworkStatus()
  useEffect(() => {
    const initDB = async () => {
      try {
        await offlineDB.init()
        console.log('Offline database initialized')
      } catch (error) {
        console.error('Failed to initialize offline database:', error)
      }
    }
    initDB()
  }, [])
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && networkStatus.isOnline) {
        console.log('App visible and online - consider syncing')
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [networkStatus.isOnline])
  return <>{children}</>
}

class PWAErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true }
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('PWA Error:', error, errorInfo)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
            <div className="text-6xl mb-4">😞</div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-4">The app encountered an error. Please reload the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
            >
              Reload App
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function App() {
  const { isLoading } = useAuthCheck()
  const authState = useSelector((state: RootState) => state.auth)

  if (isLoading || authState.isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <PWAErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <PWARegistration />
        <NetworkProvider>
          <ErrorBoundary>
            <BrowserRouter>
            <OfflineStatus position="top" showDetails={false} />
              <div className="min-h-screen bg-gray-50">
                <AppRouter />
              </div>
            </BrowserRouter>
          </ErrorBoundary>
        </NetworkProvider>
      </QueryClientProvider>
    </PWAErrorBoundary>
  )
}

export default App
