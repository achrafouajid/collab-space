import { BrowserRouter } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from './state/store'
import AppRouter from './router/router'
import ErrorBoundary from './components/ui/ErrorBoundary'
import LoadingSpinner from './components/ui/LoadingSpinner'
import { useAuthCheck } from './hooks/useAuthCheck'

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
    <ErrorBoundary>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <AppRouter />
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App 