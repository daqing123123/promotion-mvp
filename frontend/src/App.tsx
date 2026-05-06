import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, lazy, Suspense, Component } from 'react'
import { ToastProvider } from './lib/toast'
import BottomNav from './components/BottomNav'

// 错误边界 - 防止白屏
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  componentDidCatch(error: Error, info: any) {
    console.error('App crashed:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <div className="text-5xl mb-4">🌊</div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">出了点小问题</h2>
            <p className="text-sm text-gray-500 mb-4">{this.state.error?.message || '页面加载失败'}</p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload() }}
              className="px-5 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium"
            >
              重新加载
            </button>
            <p className="mt-3 text-xs text-gray-400">
              如果还是不行，试试清除缓存后刷新
            </p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// 常用页面直接导入（不懒加载）— 切换秒开
import HomeV2 from './pages/HomeV2'
import Topics from './pages/Topics'
import ChatPage from './pages/ChatPage'
import Profile from './pages/Profile'
import Search from './pages/Search'
import Brands from './pages/Brands'
import DailyChallenge from './pages/DailyChallenge'
import Leaderboard from './pages/Leaderboard'
import Battle from './pages/Battle'
import BlindBox from './pages/BlindBox'

// 低频页面懒加载
const Promote = lazy(() => import('./pages/Promote'))
const PublishV2 = lazy(() => import('./pages/PublishV2'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const TopicDetail = lazy(() => import('./pages/TopicDetail'))
const ContentDetail = lazy(() => import('./pages/ContentDetail'))
const CheckIn = lazy(() => import('./pages/CheckIn'))
const Tasks = lazy(() => import('./pages/Tasks'))
const Activities = lazy(() => import('./pages/Activities'))
const Points = lazy(() => import('./pages/Points'))
const Achievements = lazy(() => import('./pages/Achievements'))
const Invite = lazy(() => import('./pages/Invite'))
const EditProfile = lazy(() => import('./pages/EditProfile'))
const Settings = lazy(() => import('./pages/Settings'))
const Notifications = lazy(() => import('./pages/Notifications'))
const PromoterBattle = lazy(() => import('./pages/PromoterBattle'))
const About = lazy(() => import('./pages/About'))
const Terms = lazy(() => import('./pages/Terms'))
const Privacy = lazy(() => import('./pages/Privacy'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="text-center">
        <div className="text-4xl mb-3 animate-bounce">🌊</div>
        <p className="text-gray-400 text-sm">加载中...</p>
      </div>
    </div>
  )
}

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', h); return () => window.removeEventListener('resize', h)
  }, [])
  return mobile
}

function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('julang_user')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })
  const isHome = location.pathname === '/'
  const isAuth = location.pathname === '/login' || location.pathname === '/register'
  const isMobile = useIsMobile()

  // 登录态持久化
  useEffect(() => {
    if (user) {
      localStorage.setItem('julang_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('julang_user')
    }
  }, [user])

  // 不需要顶栏的页面
  const noTopBar = ['/', '/login', '/register'].includes(location.pathname) ||
    location.pathname.startsWith('/topic/')

  return (
    <div className={isHome ? '' : 'min-h-screen bg-gray-50'}>
      {/* 顶栏 */}
      {!isAuth && !noTopBar && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
          <div className="mx-auto px-5 h-12 flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="text-gray-400">
              ←
            </button>
            <h1 className="text-sm font-bold text-gray-900">巨浪</h1>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/search')} className="text-gray-400">
                🔍
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={!isAuth && !noTopBar ? 'pt-12' : ''}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomeV2 user={user} setUser={setUser} isMobile={isMobile} />} />
            <Route path="/promote" element={<Promote user={user} setUser={setUser} isMobile={isMobile} />} />
            <Route path="/topics" element={<Topics />} />
            <Route path="/topic/:id" element={<TopicDetail user={user} />} />
            <Route path="/content/:id" element={<ContentDetail user={user} />} />
            <Route path="/search" element={<Search />} />
            <Route path="/chat" element={user ? <ChatPage user={user} /> : <Login setUser={setUser} />} />
            <Route path="/login" element={<Login setUser={setUser} />} />
            <Route path="/register" element={<Register setUser={setUser} />} />
            <Route path="/publish" element={user ? <PublishV2 user={user} isMobile={isMobile} setUser={setUser} /> : <Login setUser={setUser} />} />
            <Route path="/profile" element={user ? <Profile user={user} setUser={setUser} /> : <Login setUser={setUser} />} />
            <Route path="/profile/:id" element={user ? <Profile user={user} setUser={setUser} /> : <Login setUser={setUser} />} />
            <Route path="/checkin" element={user ? <CheckIn user={user} setUser={setUser} /> : <Login setUser={setUser} />} />
            <Route path="/tasks" element={user ? <Tasks user={user} setUser={setUser} /> : <Login setUser={setUser} />} />
            <Route path="/activities" element={user ? <Activities user={user} setUser={setUser} /> : <Login setUser={setUser} />} />
            <Route path="/points" element={user ? <Points user={user} /> : <Login setUser={setUser} />} />
            <Route path="/achievements" element={user ? <Achievements user={user} /> : <Login setUser={setUser} />} />
            <Route path="/invite" element={user ? <Invite user={user} /> : <Login setUser={setUser} />} />
            <Route path="/points-center" element={<Navigate to="/points" replace />} />
            <Route path="/edit-profile" element={user ? <EditProfile user={user} setUser={setUser} /> : <Login setUser={setUser} />} />
            <Route path="/brand" element={<Brands />} />
              <Route path="/daily-challenge" element={user ? <DailyChallenge user={user} /> : <Login setUser={setUser} />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/battle" element={user ? <Battle user={user} /> : <Login setUser={setUser} />} />
            <Route path="/blind-box" element={user ? <BlindBox /> : <Login setUser={setUser} />} />
            <Route path="/promoter-stats" element={user ? <PromoterBattle user={user} /> : <Login setUser={setUser} />} />
            <Route path="/notifications" element={user ? <Notifications user={user} /> : <Login setUser={setUser} />} />
            <Route path="/about" element={<About />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
          </Routes>
        </Suspense>
      </div>

      {!isAuth && <BottomNav unreadCount={0} />}
    </div>
  )
}

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <ToastProvider>
          <AppLayout />
        </ToastProvider>
      </ErrorBoundary>
    </Router>
  )
}

export default App
