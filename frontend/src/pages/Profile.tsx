// ===== 涓汉涓婚〉锛堟敮鎸佹煡鐪嬩粬浜猴級 =====

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toggleFollow, isFollowing, getFollowCounts, getUserById, getMemesByUser, getUserContents, getOrCreateInviteCode, getInviteStats } from '../lib/api/client'
import { levelTitle, levelProgress as calcLevelProgress, formatXP, xpForNextLevel } from '../lib/levels'
import { getAchievementProgressList, AchievementDef } from '../lib/achievements'
import { toast } from '../lib/toast'

const GROWTH_LEVELS: Record<string, { name: string; icon: string; color: string }> = {
  newbie: { name: '鏂版墜', icon: '馃尡', color: 'text-gray-500' },
  starter: { name: '鍏ラ棬', icon: '馃尶', color: 'text-green-500' },
  promoter: { name: '鎺ㄥ箍杈句汉', icon: '馃尦', color: 'text-blue-500' },
  expert: { name: '璧勬繁杈句汉', icon: '猸?, color: 'text-yellow-500' },
  master: { name: '澶у笀', icon: '馃憫', color: 'text-purple-500' },
  legend: { name: '浼犲', icon: '馃弳', color: 'text-orange-500' },
}

export default function Profile({ user, setUser: _setUser }: { user: any; setUser: (u: any) => void }) {
  const navigate = useNavigate()
  const { id: profileId } = useParams()
  const isOwnProfile = !profileId || profileId === user?.id

  const [tab, setTab] = useState<'memes' | 'achievements' | 'stats'>('memes')
  const [myContents, setMyContents] = useState<any[]>([])
  const [achievements, setAchievements] = useState<(AchievementDef & { isUnlocked: boolean; progress: { current: number; max: number } })[]>([])
  const [loading, setLoading] = useState(true)
  const [myCode, setMyCode] = useState('')
  const [inviteCount, setInviteCount] = useState(0)
  const [growthLevel, setGrowthLevel] = useState('newbie')

  // 浠栦汉璧勬枡
  const [profileUser, setProfileUser] = useState<any>(null)
  const [following, setFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 })

  const displayUser = isOwnProfile ? user : profileUser

  useEffect(() => {
    if (isOwnProfile && user) {
      fetchMyContents(user.id)
      loadAchievements(user.id)
      fetchGrowthData()
    } else if (profileId) {
      loadOtherProfile(profileId)
    }
  }, [profileId, user?.id])

  const loadOtherProfile = async (uid: string) => {
    setLoading(true)
    try {
      const data = await getUserById(uid)
      if (!data) {
        toast.error('鐢ㄦ埛涓嶅瓨鍦?)
        navigate(-1)
        return
      }

      setProfileUser(data)
      fetchMyContents(uid)
      loadAchievements(uid)

      // 妫€鏌ュ叧娉ㄧ姸鎬?
      if (user?.id && user.id !== uid) {
        const [isFol, counts] = await Promise.all([
          isFollowing(user.id, uid),
          getFollowCounts(uid),
        ])
        setFollowing(isFol)
        setFollowCounts(counts)
      }
    } catch {}
    setLoading(false)
  }

  const fetchGrowthData = async () => {
    if (!user) return
    try {
      const [code, stats] = await Promise.all([
        getOrCreateInviteCode(user.id).catch(() => ''),
        getInviteStats(user.id).catch(() => ({ inviteCount: 0 })),
      ])
      if (code) setMyCode(code)
      const c = stats.inviteCount || 0
      setInviteCount(c)
      if (c >= 50) setGrowthLevel('legend')
      else if (c >= 20) setGrowthLevel('master')
      else if (c >= 10) setGrowthLevel('expert')
      else if (c >= 5) setGrowthLevel('promoter')
      else if (c >= 1) setGrowthLevel('starter')
      else setGrowthLevel('newbie')
    } catch {}
  }

  const loadAchievements = async (uid: string) => {
    try {
      const data = await getAchievementProgressList(uid)
      setAchievements(data)
    } catch {}
  }

  const fetchMyContents = async (uid: string) => {
    setLoading(true)
    const [memes, contents] = await Promise.all([
      getMemesByUser(uid).catch(() => []),
      getUserContents(uid).catch(() => []),
    ])
    const memeItems = (Array.isArray(memes) ? memes : []).map((m: any) => ({ ...m, _source: 'memes' }))
    const contentItems = (Array.isArray(contents) ? contents : []).map((c: any) => ({ ...c, _source: 'contents' }))
    setMyContents([...memeItems, ...contentItems].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ))
    setLoading(false)
  }

  const handleFollow = async () => {
    if (!user?.id) { toast.warning('璇峰厛鐧诲綍'); return }
    if (!profileId) return
    setFollowLoading(true)
    try {
      const result = await toggleFollow(user.id, profileId)
      setFollowing(result)
      setFollowCounts(prev => ({
        ...prev,
        followers: prev.followers + (result ? 1 : -1),
      }))
      toast.success(result ? '宸插叧娉? : '宸插彇娑堝叧娉?)
    } catch (e: any) {
      toast.error(e.message || '鎿嶄綔澶辫触')
    } finally {
      setFollowLoading(false)
    }
  }

  const formatNum = (n: number) => n >= 10000 ? (n / 10000).toFixed(1) + '涓? : n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n)

  if (!user && !profileId) {
    return (
      <div className="bg-white min-h-screen flex flex-col items-center justify-center pb-20">
        <div className="text-4xl mb-4">馃懁</div>
        <p className="text-gray-400 mb-4">鐧诲綍鍚庢煡鐪嬩釜浜轰富椤?/p>
        <button onClick={() => navigate('/login')} className="px-6 py-2 bg-black text-white rounded-full text-sm font-medium">鍘荤櫥褰?/button>
      </div>
    )
  }

  if (loading || !displayUser) {
    return <div className="bg-gray-50 min-h-screen flex items-center justify-center text-gray-400">鍔犺浇涓?..</div>
  }

  const lvl = displayUser.level || 1
  const levelTitleText = levelTitle(lvl)
  const progress = calcLevelProgress(displayUser.experience || 0, lvl)
  const nextXP = xpForNextLevel(lvl)

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* 澶撮儴 */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-700 px-5 pt-12 pb-6 text-white">
        {/* 杩斿洖鎸夐挳锛堟煡鐪嬩粬浜烘椂鏄剧ず锛?*/}
        {!isOwnProfile && (
          <button onClick={() => navigate(-1)} className="text-white/70 mb-3">鈫?杩斿洖</button>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-3xl">{displayUser.avatar}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{displayUser.name}</h1>
                {isOwnProfile && (
                  <button onClick={() => navigate('/edit-profile')} className="text-xs bg-white/20 px-2 py-0.5 rounded-full">鉁忥笍</button>
                )}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Lv.{lvl}</span>
                <span className="text-xs text-white/60">{levelTitleText}</span>
              </div>
              {displayUser.bio && <p className="text-xs text-white/60 mt-1">{displayUser.bio}</p>}
            </div>
          </div>
          {isOwnProfile ? (
            <button onClick={() => navigate('/settings')} className="text-xs bg-white/10 px-3 py-1.5 rounded-full">鈿欙笍</button>
          ) : (
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                following ? 'bg-white/20 text-white' : 'bg-white text-black'
              }`}
            >
              {followLoading ? '...' : following ? '宸插叧娉? : '+ 鍏虫敞'}
            </button>
          )}
        </div>

        {/* 鍏虫敞鏁版嵁 */}
        <div className="flex gap-6 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold">{followCounts.followers || displayUser.follower_count || 0}</div>
            <div className="text-[10px] text-white/60">绮変笣</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">{followCounts.following || displayUser.following_count || 0}</div>
            <div className="text-[10px] text-white/60">鍏虫敞</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">{myContents.length}</div>
            <div className="text-[10px] text-white/60">鍐呭</div>
          </div>
        </div>

        {/* 绛夌骇杩涘害鏉★紙浠呰嚜宸憋級 */}
        {isOwnProfile && (
          <div className="bg-white/10 rounded-xl p-3 mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span>{levelTitleText}</span>
              <span>Lv.{lvl} 鈫?Lv.{Math.min(lvl + 1, 100)}</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2"><div className="bg-white rounded-full h-2 transition-all" style={{ width: `${Math.min(progress * 100, 100)}%` }}></div></div>
            <div className="flex justify-between text-[10px] text-white/50 mt-1">
              <span>{formatXP(displayUser.experience || 0)} XP</span>
              <span>涓嬬骇闇€瑕?{formatXP(nextXP)} XP</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 gap-3">
          <div className="text-center"><div className="text-lg font-bold">{myContents.length}</div><div className="text-[10px] text-white/60">鍐呭</div></div>
          <div className="text-center"><div className="text-lg font-bold">{formatNum(myContents.reduce((s, m) => s + (m.view_count || 0), 0))}</div><div className="text-[10px] text-white/60">鏇濆厜</div></div>
          <div className="text-center"><div className="text-lg font-bold">{formatNum(myContents.reduce((s, m) => s + (m.like_count || 0), 0))}</div><div className="text-[10px] text-white/60">鐐硅禐</div></div>
          <div className="text-center"><div className="text-lg font-bold">{displayUser.points || 0}</div><div className="text-[10px] text-white/60">绉垎</div></div>
        </div>
      </div>

      {/* 蹇嵎鍏ュ彛锛堜粎鑷繁锛?*/}
      {isOwnProfile && (
        <div className="mx-5 mt-4 grid grid-cols-4 gap-3">
          <button onClick={() => navigate('/points-center')} className="bg-white rounded-xl p-3 text-center border border-gray-100">
            <div className="text-xl mb-1">馃挵</div>
            <div className="text-[10px] text-gray-600">绉垎涓績</div>
          </button>
          <button onClick={() => navigate('/invite')} className="bg-white rounded-xl p-3 text-center border border-gray-100">
            <div className="text-xl mb-1">馃懃</div>
            <div className="text-[10px] text-gray-600">閭€璇峰ソ鍙?/div>
          </button>
          <button onClick={() => navigate('/checkin')} className="bg-white rounded-xl p-3 text-center border border-gray-100">
            <div className="text-xl mb-1">馃搮</div>
            <div className="text-[10px] text-gray-600">绛惧埌</div>
          </button>
          <button onClick={() => navigate('/achievements')} className="bg-white rounded-xl p-3 text-center border border-gray-100">
            <div className="text-xl mb-1">馃弳</div>
            <div className="text-[10px] text-gray-600">鎴愬氨</div>
          </button>
        </div>
      )}

      {/* 閭€璇风爜锛堜粎鑷繁锛?*/}
      {isOwnProfile && myCode && (
        <div className="mx-5 mt-4 bg-white rounded-2xl p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{GROWTH_LEVELS[growthLevel]?.icon || '馃尡'}</span>
              <div>
                <span className={`text-xs font-bold ${GROWTH_LEVELS[growthLevel]?.color || 'text-gray-500'}`}>
                  {GROWTH_LEVELS[growthLevel]?.name || '鏂版墜'}
                </span>
                <span className="text-xs text-gray-400 ml-2">閭€璇?{inviteCount} 浜?/span>
              </div>
            </div>
            <button onClick={() => navigate('/invite')} className="text-xs bg-black text-white px-3 py-1.5 rounded-full">
              閭€璇峰ソ鍙?
            </button>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
            <span className="text-xs text-gray-400">閭€璇风爜</span>
            <span className="text-base font-mono font-bold tracking-widest">{myCode}</span>
            <button onClick={() => { navigator.clipboard.writeText(myCode); toast.success('宸插鍒?) }} className="ml-auto text-xs text-blue-500">澶嶅埗</button>
          </div>
        </div>
      )}

      {/* Tab */}
      <div className="flex bg-white border-b border-gray-100 mt-4">
        {(['memes', 'achievements', 'stats'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3 text-sm font-medium ${tab === t ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400'}`}>
            {t === 'memes' ? '鍐呭' : t === 'achievements' ? '鎴愬氨' : '鏁版嵁'}
          </button>
        ))}
      </div>

      {/* 鍐呭 */}
      <div className="px-5 pt-4">
        {tab === 'memes' && (
          loading ? <div className="text-center py-10 text-gray-400">鍔犺浇涓?..</div> :
          myContents.length === 0 ? <div className="text-center py-10 text-gray-400">{isOwnProfile ? '杩樻病鏈夊唴瀹癸紝鍘诲彂甯冧竴涓惂' : '杩樻病鏈夊彂甯冨唴瀹?}</div> :
          <div className="space-y-3">
            {myContents.map(item => (
              <div key={item.id} onClick={() => navigate(`/content/${item.id}`)} className="bg-white rounded-2xl p-4 active:bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-gray-100 text-gray-600">
                    {item._source === 'memes' ? '馃摑 娈靛瓙' : `馃摝 ${item.type}`}
                  </span>
                  {item.status === 'viral' && (
                    <span className="px-2 py-0.5 text-[10px] rounded-full bg-red-50 text-red-500">馃敟 鐖嗘</span>
                  )}
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500 mb-2 line-clamp-2">{item.content || item.description}</p>
                <div className="flex gap-4 text-xs text-gray-400">
                  <span>馃憗 {formatNum(item.view_count)}</span>
                  <span>鉂わ笍 {formatNum(item.like_count)}</span>
                  <span>馃攧 {formatNum(item.share_count || 0)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'achievements' && (
          achievements.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">鍔犺浇涓?..</div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {achievements.map(a => (
                <div key={a.id} className={`rounded-xl p-4 text-center ${a.isUnlocked ? 'bg-white border border-yellow-200' : 'bg-gray-50 opacity-50'}`}>
                  <div className="text-3xl mb-2">{a.icon}</div>
                  <div className="text-xs font-bold text-gray-900">{a.name}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{a.desc}</div>
                  {a.isUnlocked && <div className="text-[10px] text-yellow-500 mt-1">鉁?宸茶揪鎴?/div>}
                  {!a.isUnlocked && a.progress.max > 0 && (
                    <div className="text-[10px] text-gray-300 mt-1">{a.progress.current}/{a.progress.max}</div>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'stats' && (
          <div className="space-y-3">
            <div className="bg-white rounded-xl p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">馃搳 鏁版嵁姒傝</h3>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-sm text-gray-500">鎬诲唴瀹规暟</span><span className="text-sm font-bold">{myContents.length}</span></div>
                <div className="flex justify-between"><span className="text-sm text-gray-500">鎬绘洕鍏?/span><span className="text-sm font-bold">{formatNum(myContents.reduce((s, m) => s + (m.view_count || 0), 0))}</span></div>
                <div className="flex justify-between"><span className="text-sm text-gray-500">鎬荤偣璧?/span><span className="text-sm font-bold">{formatNum(myContents.reduce((s, m) => s + (m.like_count || 0), 0))}</span></div>
                <div className="flex justify-between"><span className="text-sm text-gray-500">鎬诲垎浜?/span><span className="text-sm font-bold">{formatNum(myContents.reduce((s, m) => s + (m.share_count || 0), 0))}</span></div>
                <div className="flex justify-between"><span className="text-sm text-gray-500">绮変笣</span><span className="text-sm font-bold">{followCounts.followers || displayUser.follower_count || 0}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

