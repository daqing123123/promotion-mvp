// @ts-nocheck
// ===== 鍙戝竷椤甸潰锛堝叏绫诲瀷鏀寔锛?=====

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTopic, createVote, createContent } from '../lib/api/client'
import { checkAndUnlockAchievements } from '../lib/achievements'

const CONTENT_TYPES = [
  { key: 'video', icon: '馃幀', label: '瑙嗛', enabled: true },
  { key: 'image', icon: '馃柤锔?, label: '鍥剧墖', enabled: true },
  { key: 'content', icon: '馃摑', label: '鏂囧瓧', enabled: true },
  { key: 'topic', icon: '馃挰', label: '璇濋', enabled: true },
  { key: 'article', icon: '馃搫', label: '鏂囩珷', enabled: true },
  { key: 'product', icon: '馃摝', label: '浜у搧', enabled: true },
  { key: 'software', icon: '馃捇', label: '杞欢', enabled: true },
  { key: 'skill', icon: '馃', label: 'Skill', enabled: true },
  { key: 'agent', icon: '馃', label: 'Agent', enabled: true },
  { key: 'game', icon: '馃幃', label: '娓告垙', enabled: true },
  { key: 'movie', icon: '馃幀', label: '褰辫', enabled: true },
  { key: 'music', icon: '馃幍', label: '闊充箰', enabled: true },
  { key: 'drama', icon: '馃幁', label: '鐭墽', enabled: true },
  { key: 'person', icon: '馃懁', label: '浜虹墿', enabled: true },
  { key: 'live', icon: '馃摗', label: '鐩存挱', enabled: true },
  { key: 'blindbox', icon: '馃巵', label: '鐩茬洅', enabled: true },
]

const TOPIC_TYPES = [
  { key: 'discussion', icon: '馃挰', label: '璁ㄨ' },
  { key: 'challenge', icon: '馃弳', label: '鎸戞垬' },
  { key: 'vote', icon: '馃棾锔?, label: '鎶曠エ' },
  { key: 'trend', icon: '馃敟', label: '鐑偣' },
]

interface FormData {
  title: string
  description: string
  content: string
  tags: string
  coverUrl: string
  videoUrl: string
  imageUrl: string
  // 璇濋鐗规湁
  topicType: string
  rewardPool: string
  voteOptions: string
  voteEndDate: string
  // 鍝佺墝鎺ㄥ箍
  brandName: string
  brandLogo: string
  brandDescription: string
  promoteReward: string
  promoteTarget: string
  rewardType: string
  rewardDescription: string
  couponValue: string
  couponCount: string
  // 閫氱敤瀛楁
  linkUrl: string
  price: string
}

export default function PublishV2({ user, setUser }: { user: any; isMobile?: boolean; setUser?: (u: any) => void }) {
  const navigate = useNavigate()
  const [selectedType, setSelectedType] = useState('')
  const [form, setForm] = useState<FormData>({
    title: '', description: '', content: '', tags: '', coverUrl: '', videoUrl: '', imageUrl: '',
    topicType: 'discussion', rewardPool: '', voteOptions: '', voteEndDate: '',
    brandName: '', brandLogo: '', brandDescription: '', promoteReward: '20', promoteTarget: '100',
    rewardType: 'points', rewardDescription: '', couponValue: '', couponCount: '',
    linkUrl: '', price: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = (key: keyof FormData, val: string) => setForm(f => ({ ...f, [key]: val }))

  const canPublish = selectedType && form.title.trim() && (
    (selectedType === 'content' && form.content.trim()) ||
    (selectedType === 'video' && form.videoUrl.trim()) ||
    (selectedType === 'image' && form.imageUrl.trim()) ||
    (selectedType === 'topic') ||
    (selectedType !== 'content' && selectedType !== 'video' && selectedType !== 'image' && selectedType !== 'topic')
  )

  const handlePublish = async () => {
    if (!canPublish) return
    setLoading(true)
    setError('')

    try {
      const tags = form.tags.split(/[,锛宂/).map(s => s.trim()).filter(Boolean)

      if (selectedType === 'topic') {
        // 鍙戝竷璇濋
        const topicData: any = {
          title: form.title.trim(),
          description: form.description.trim(),
          type: form.topicType,
          tags: JSON.stringify(tags),
          creator_name: user.name || '',
          creator_avatar: user.avatar || '馃懁',
          creator_type: form.brandName.trim() ? 'brand' : 'personal',
          brand_name: form.brandName.trim(),
          brand_logo: form.brandLogo.trim(),
          brand_description: form.brandDescription.trim(),
          promote_reward: parseInt(form.promoteReward) || 20,
          promote_target: parseInt(form.promoteTarget) || 100,
          reward_type: form.rewardType,
          reward_description: form.rewardDescription.trim(),
          coupon_type: form.rewardType === 'coupon' ? 'discount' : '',
          coupon_value: form.couponValue || '',
          coupon_count: parseInt(form.couponCount) || 0,
        }

        if (form.rewardPool && parseInt(form.rewardPool) > 0) {
          topicData.reward_pool = parseInt(form.rewardPool)
        }

        await createTopic(topicData)

        // 鎶曠エ璇濋
        if (form.topicType === 'vote' && form.voteOptions.trim()) {
          const options = form.voteOptions.split('\n').map(s => s.trim()).filter(Boolean)
          if (options.length >= 2) {
            await createVote({
              title: form.title.trim(),
              description: form.description.trim(),
              options,
              vote_cost: 0,
              vote_reward: 5,
              end_date: form.voteEndDate || undefined,
            })
          }
        }
      } else {
        // 鍙戝竷鍐呭锛堟墍鏈夌被鍨嬶級
        let description = form.description
        if (selectedType === 'content') {
          description = form.content
        }

        // 纭畾 render_mode
        let renderMode = 'card'
        if (selectedType === 'video') renderMode = 'player'
        else if (selectedType === 'image') renderMode = 'card'
        else if (selectedType === 'article') renderMode = 'reader'

        // 纭畾 cover 鍜?src
        let coverUrl = form.coverUrl || form.imageUrl || ''
        let renderSrc = form.videoUrl || form.imageUrl || ''

        // 鏋勫缓 render_config
        const renderConfig: any = {}
        if (form.linkUrl) renderConfig.link = form.linkUrl
        if (form.price) renderConfig.price = form.price

        await createContent({
          type: selectedType,
          title: form.title.trim(),
          description: description.trim(),
          tags,
          render_mode: renderMode,
          cover_url: coverUrl,
          render_src: renderSrc,
          render_config: renderConfig,
        })
      }

      try { await checkAndUnlockAchievements(user.id) } catch {}
      navigate('/')
    } catch (err: any) {
      setError(err.message || '鍙戝竷澶辫触')
    } finally {
      setLoading(false)
    }
  }

  // 鑾峰彇绫诲瀷鏍囩
  const getTypeLabel = (key: string) => CONTENT_TYPES.find(t => t.key === key)?.label || key
  const isSpecialType = !['content', 'video', 'image', 'topic'].includes(selectedType)

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <div className="bg-white px-5 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="text-gray-400">鈫?/button>
          <h1 className="text-xl font-bold text-gray-900">鍙戝竷鍐呭</h1>
        </div>
      </div>

      {/* 绫诲瀷閫夋嫨 */}
      <div className="bg-white px-5 py-4 mb-3">
        <h2 className="text-sm font-medium text-gray-500 mb-3">閫夋嫨鍐呭绫诲瀷</h2>
        <div className="grid grid-cols-5 gap-2">
          {CONTENT_TYPES.map(t => (
            <button
              key={t.key}
              onClick={() => setSelectedType(t.key)}
              className={`p-3 rounded-xl text-center transition-all ${
                selectedType === t.key ? 'bg-black text-white' : 'bg-gray-50 text-gray-600 active:bg-gray-100'
              }`}
            >
              <div className="text-xl mb-1">{t.icon}</div>
              <div className="text-[10px]">{t.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 琛ㄥ崟 */}
      {selectedType && (
        <div className="bg-white px-5 py-4 space-y-4">
          {/* 鏍囬 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              {selectedType === 'content' ? '鎯虫硶/瑙傜偣' : selectedType === 'topic' ? '璇濋鏍囬' : '鏍囬'}
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => update('title', e.target.value)}
              placeholder={
                selectedType === 'content' ? '鍒嗕韩浣犵殑鎯虫硶...' :
                selectedType === 'topic' ? '璧蜂釜鍚稿紩浜虹殑璇濋鏍囬...' :
                selectedType === 'product' ? '浜у搧鍚嶇О...' :
                selectedType === 'software' ? '杞欢鍚嶇О...' :
                selectedType === 'game' ? '娓告垙鍚嶇О...' :
                selectedType === 'movie' ? '鐢靛奖/鍓ч泦鍚嶇О...' :
                selectedType === 'music' ? '姝屾洸/涓撹緫鍚嶇О...' :
                `缁?{getTypeLabel(selectedType)}璧蜂釜鏍囬...`
              }
              className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>

          {/* ========== 璇濋鐗规湁瀛楁 ========== */}
          {selectedType === 'topic' && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">璇濋绫诲瀷</label>
                <div className="grid grid-cols-4 gap-2">
                  {TOPIC_TYPES.map(t => (
                    <button key={t.key} onClick={() => update('topicType', t.key)}
                      className={`p-3 rounded-xl text-center transition-all ${form.topicType === t.key ? 'bg-black text-white' : 'bg-gray-50 text-gray-600'}`}>
                      <div className="text-xl mb-1">{t.icon}</div>
                      <div className="text-xs">{t.label}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">璇濋鎻忚堪</label>
                <textarea value={form.description} onChange={e => update('description', e.target.value)}
                  placeholder="鎻忚堪涓€涓嬭繖涓瘽棰?.." rows={3}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-200" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">濂栧姳姹犵Н鍒嗭紙鍙€夛級</label>
                <input type="number" value={form.rewardPool} onChange={e => update('rewardPool', e.target.value)}
                  placeholder="璁剧疆璇濋濂栧姳姹犵Н鍒?
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" />
              </div>

              {/* 鍝佺墝鎺ㄥ箍 */}
              <div className="bg-blue-50 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-medium text-blue-800">馃彿锔?鍝佺墝鎺ㄥ箍锛堝彲閫夛級</h3>
                <p className="text-xs text-blue-600">濉啓鍝佺墝淇℃伅鍚庯紝璇濋浼氭爣璁颁负"鍝佺墝鎺ㄥ箍"</p>
                <input type="text" value={form.brandName} onChange={e => update('brandName', e.target.value)}
                  placeholder="鍝佺墝鍚嶇О锛堝锛氬皬绫炽€佺憺骞革級"
                  className="w-full px-4 py-3 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                <input type="text" value={form.brandLogo} onChange={e => update('brandLogo', e.target.value)}
                  placeholder="鍝佺墝 Logo 鍥剧墖閾炬帴"
                  className="w-full px-4 py-3 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                <input type="text" value={form.brandDescription} onChange={e => update('brandDescription', e.target.value)}
                  placeholder="涓€鍙ヨ瘽浠嬬粛鍝佺墝..."
                  className="w-full px-4 py-3 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">姣忔甯帹绉垎</label>
                    <input type="number" value={form.promoteReward} onChange={e => update('promoteReward', e.target.value)} placeholder="20"
                      className="w-full px-3 py-2.5 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">鐩爣甯帹娆℃暟</label>
                    <input type="number" value={form.promoteTarget} onChange={e => update('promoteTarget', e.target.value)} placeholder="100"
                      className="w-full px-3 py-2.5 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-2 block">濂栧姳绫诲瀷</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'points', label: '馃挵 绾Н鍒? },
                      { key: 'physical', label: '馃摝 绾疄鐗? },
                      { key: 'both', label: '馃巵 绉垎+瀹炵墿' },
                      { key: 'cash', label: '馃挼 鐜伴噾濂栧姳' },
                      { key: 'coupon', label: '馃帿 浼樻儬鍒? },
                      { key: 'none', label: '鉂?鏃犲鍔? },
                    ].map(rt => (
                      <button key={rt.key} onClick={() => update('rewardType', rt.key)}
                        className={`p-2 rounded-xl text-xs text-center transition-all ${form.rewardType === rt.key ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
                        {rt.label}
                      </button>
                    ))}
                  </div>
                </div>
                {(form.rewardType === 'physical' || form.rewardType === 'both') && (
                  <input type="text" value={form.rewardDescription} onChange={e => update('rewardDescription', e.target.value)}
                    placeholder="瀹炵墿濂栧姳璇存槑锛堝锛氶檺閲忚€虫満 x10锛?
                    className="w-full px-4 py-3 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                )}
                {form.rewardType === 'cash' && (
                  <input type="text" value={form.rewardDescription} onChange={e => update('rewardDescription', e.target.value)}
                    placeholder="鐜伴噾濂栧姳璇存槑锛堝锛氭帹骞挎弧100娆″楼50锛?
                    className="w-full px-4 py-3 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                )}
                {form.rewardType === 'coupon' && (
                  <div className="space-y-2">
                    <input type="text" value={form.rewardDescription} onChange={e => update('rewardDescription', e.target.value)}
                      placeholder="浼樻儬鍒歌鏄庯紙濡傦細鍏ㄥ満8鎶樺埜锛?
                      className="w-full px-4 py-3 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" value={form.couponValue} onChange={e => update('couponValue', e.target.value)}
                        placeholder="鍒搁潰鍊硷紙濡傦細8鎶樸€佹弧100鍑?0锛?
                        className="px-3 py-2.5 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                      <input type="number" value={form.couponCount} onChange={e => update('couponCount', e.target.value)}
                        placeholder="鍙戞斁鏁伴噺"
                        className="px-3 py-2.5 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                    </div>
                  </div>
                )}
              </div>

              {form.topicType === 'vote' && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">鎶曠エ閫夐」锛堟瘡琛屼竴涓級</label>
                    <textarea value={form.voteOptions} onChange={e => update('voteOptions', e.target.value)}
                      placeholder={'閫夐」涓€\n閫夐」浜孿n閫夐」涓?} rows={4}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-200" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">鎴鏃堕棿锛堝彲閫夛級</label>
                    <input type="datetime-local" value={form.voteEndDate} onChange={e => update('voteEndDate', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" />
                  </div>
                </>
              )}
            </>
          )}

          {/* ========== 鏂囧瓧鍐呭 ========== */}
          {selectedType === 'content' && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">鍐呭</label>
              <textarea value={form.content} onChange={e => update('content', e.target.value)}
                placeholder="鍐欎笅浣犳兂璇寸殑..." rows={6}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-200" />
            </div>
          )}

          {/* ========== 瑙嗛 ========== */}
          {selectedType === 'video' && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">瑙嗛閾炬帴</label>
              <input type="text" value={form.videoUrl} onChange={e => update('videoUrl', e.target.value)}
                placeholder="绮樿创瑙嗛URL锛堟敮鎸丅绔欍€佹姈闊崇瓑锛?
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" />
            </div>
          )}

          {/* ========== 鍥剧墖 ========== */}
          {selectedType === 'image' && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">鍥剧墖閾炬帴</label>
              <input type="text" value={form.imageUrl} onChange={e => update('imageUrl', e.target.value)}
                placeholder="绮樿创鍥剧墖URL"
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" />
            </div>
          )}

          {/* ========== 閫氱敤绫诲瀷锛堜骇鍝?杞欢/娓告垙/褰辫/闊充箰绛夛級 ========== */}
          {isSpecialType && (
            <>
              {/* 鎻忚堪 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">璇︾粏鎻忚堪</label>
                <textarea value={form.description} onChange={e => update('description', e.target.value)}
                  placeholder={`浠嬬粛涓€涓嬭繖涓?{getTypeLabel(selectedType)}...`}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-200" />
              </div>

              {/* 灏侀潰鍥?*/}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">灏侀潰鍥綰RL锛堝彲閫夛級</label>
                <input type="text" value={form.coverUrl} onChange={e => update('coverUrl', e.target.value)}
                  placeholder="灏侀潰鍥剧墖閾炬帴"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" />
              </div>

              {/* 澶栭摼 */}
              {(selectedType === 'product' || selectedType === 'software' || selectedType === 'game' ||
                selectedType === 'movie' || selectedType === 'music' || selectedType === 'drama' ||
                selectedType === 'live' || selectedType === 'agent' || selectedType === 'skill') && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    {selectedType === 'product' ? '鍟嗗搧閾炬帴' :
                     selectedType === 'software' ? '涓嬭浇閾炬帴' :
                     selectedType === 'game' ? '娓告垙閾炬帴' :
                     selectedType === 'movie' ? '瑙傜湅閾炬帴' :
                     selectedType === 'music' ? '鏀跺惉閾炬帴' :
                     selectedType === 'live' ? '鐩存挱闂撮摼鎺? :
                     selectedType === 'agent' ? '瀵硅瘽閾炬帴' :
                     selectedType === 'skill' ? '瀹夎閾炬帴' : '閾炬帴'}
                  </label>
                  <input type="text" value={form.linkUrl} onChange={e => update('linkUrl', e.target.value)}
                    placeholder={`绮樿创${getTypeLabel(selectedType)}閾炬帴`}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" />
                </div>
              )}

              {/* 浠锋牸锛堜骇鍝佺壒鏈夛級 */}
              {selectedType === 'product' && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">浠锋牸锛堝彲閫夛級</label>
                  <input type="text" value={form.price} onChange={e => update('price', e.target.value)}
                    placeholder="楼99.9"
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" />
                </div>
              )}
            </>
          )}

          {/* ========== 瑙嗛/鍥剧墖鐨勫皝闈㈠拰鎻忚堪 ========== */}
          {(selectedType === 'video' || selectedType === 'image') && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">灏侀潰鍥綰RL锛堝彲閫夛級</label>
                <input type="text" value={form.coverUrl} onChange={e => update('coverUrl', e.target.value)}
                  placeholder="鑷畾涔夊皝闈㈠浘閾炬帴"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">鎻忚堪</label>
                <textarea value={form.description} onChange={e => update('description', e.target.value)}
                  placeholder="娣诲姞鎻忚堪..." rows={3}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-200" />
              </div>
            </>
          )}

          {/* 鏍囩 */}
          {selectedType !== 'topic' && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">璇濋鏍囩</label>
              <input type="text" value={form.tags} onChange={e => update('tags', e.target.value)}
                placeholder="鐢ㄩ€楀彿鍒嗛殧锛屽锛氬浗浜х墖涔嬪厜,骞村害鏈€浣?
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" />
            </div>
          )}

          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>}

          <button
            onClick={handlePublish}
            disabled={!canPublish || loading}
            className={`w-full py-3 rounded-2xl font-bold text-base transition-all ${
              canPublish && !loading
                ? 'bg-black text-white active:scale-[0.98]'
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            {loading ? '鍙戝竷涓?..' : selectedType === 'topic' ? '鍙戝竷璇濋 (+10绉垎)' : `鍙戝竷${getTypeLabel(selectedType)} (+10绉垎)`}
          </button>
        </div>
      )}

      {!selectedType && (
        <div className="text-center py-10 text-gray-400 text-sm">璇烽€夋嫨鍐呭绫诲瀷</div>
      )}
    </div>
  )
}
