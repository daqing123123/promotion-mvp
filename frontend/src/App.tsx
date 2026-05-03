import { BrowserRouter as Router, Routes, Route, useLocation, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, lazy, Suspense } from 'react'

// 常用页面直接导入（不懒加载）— 切换秒开
import HomeV2 from './pages/HomeV2'
import Topics from './pages/Topics'
import ChatPage from './pages/ChatPage'
import Profile from './pages/Profile'
import Search from './pages/Search'

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
            <Route path="/topic/:id" element={<TopicDetail />} />
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
          </Routes>
        </Suspense>
      </div>

      {!isAuth && (
        <nav className={`fixed bottom-0 left-0 right-0 z-50 ${isHome ? 'bg-black/80 backdrop-blur-xl border-t border-white/5' : 'bg-white/80 backdrop-blur-xl border-t border-gray-200/50'} ${!isMobile ? 'h-12' : ''}`}>
          <div className={`mx-auto px-6 ${isMobile ? 'max-w-lg' : 'w-full'}`}>
            <div className={`flex justify-around items-center ${isMobile ? 'h-14' : 'h-12'}`}>
              <NavItem icon="compass" label="发现" path="/" isDark={isHome} />
              <NavItem icon="megaphone" label="话题" path="/topics" isDark={isHome} />
              <NavItem icon="plus.circle.fill" label="" path={user ? "/publish" : "/login"} isCenter isDark={isHome} />
              <NavItem icon="chatbubble" label="消息" path={user ? "/chat" : "/login"} isDark={isHome} />
              <NavItem icon="person" label="我的" path={user ? "/profile" : "/login"} isDark={isHome} />
            </div>
          </div>
        </nav>
      )}
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  )
}

function NavItem({ icon, label, path, isCenter, isDark }: { icon: string; label: string; path: string; isCenter?: boolean; isDark?: boolean }) {
  const isActive = window.location.pathname === path

  if (isCenter) {
    return (
      <Link to={path} className="flex flex-col items-center justify-center -mt-4">
        <div className={`w-12 h-12 ${isDark ? 'bg-white' : 'bg-black'} rounded-full flex items-center justify-center shadow-lg ${isDark ? 'shadow-white/20' : 'shadow-black/20'}`}>
          <svg className={`w-6 h-6 ${isDark ? 'text-black' : 'text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>
      </Link>
    )
  }

  const activeColor = isDark ? 'text-white' : 'text-black'
  const inactiveColor = isDark ? 'text-white/40' : 'text-gray-400'
  const dotColor = isDark ? 'bg-white' : 'bg-black'

  return (
    <Link to={path} className="flex flex-col items-center justify-center gap-0.5 relative">
      <svg className={`w-6 h-6 ${isActive ? activeColor : inactiveColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        {icon === 'compass' && <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />}
        {icon === 'megaphone' && <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />}
        {icon === 'chatbubble' && <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />}
        {icon === 'person' && <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />}
      </svg>
      <span className={`text-[10px] ${isActive ? `${activeColor} font-medium` : inactiveColor}`}>{label}</span>
      {isActive && <div className={`absolute -bottom-1.5 w-1 h-1 ${dotColor} rounded-full`} />}
    </Link>
  )
}

export default App
