// ===== 投票卡片组件 =====

import { useState, useEffect } from 'react'
import { castVote, getVoteById } from '../lib/supabase/client'

interface VoteOption {
  index: number
  text: string
  vote_count: number
}

interface Vote {
  id: string
  title: string
  description: string
  options: VoteOption[]
  vote_cost: number
  vote_reward: number
  total_votes: number
  end_date?: string
  status: string
}

interface VoteCardProps {
  voteId?: string
  vote?: Vote
  userId?: string
  onVoteComplete?: () => void
}

export default function VoteCard({ voteId, vote: initialVote, userId, onVoteComplete }: VoteCardProps) {
  const [vote, setVote] = useState<Vote | null>(initialVote || null)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    if (voteId && !initialVote) {
      loadVote(voteId)
    }
  }, [voteId, initialVote])

  const loadVote = async (id: string) => {
    try {
      const data = await getVoteById(id)
      setVote(data)
    } catch (err) {
      console.error('加载投票失败:', err)
    }
  }

  const handleVote = async () => {
    if (!vote || selectedOption === null || !userId || loading) return

    setLoading(true)
    setError('')

    try {
      await castVote(vote.id, selectedOption)
      setHasVoted(true)
      setShowResult(true)

      // 刷新投票数据
      const updated = await getVoteById(vote.id)
      setVote(updated)

      onVoteComplete?.()
    } catch (err: any) {
      setError(err.message || '投票失败')
    } finally {
      setLoading(false)
    }
  }

  if (!vote) {
    return (
      <div className="bg-white/5 rounded-xl p-4 text-center text-white/40">
        加载中...
      </div>
    )
  }

  const options = vote.options || []
  const totalVotes = options.reduce((sum, opt) => sum + opt.vote_count, 0)
  const isEnded = vote.status === 'ended' || !!(vote.end_date && new Date(vote.end_date) < new Date())

  return (
    <div className="bg-white/5 rounded-xl overflow-hidden">
      {/* 投票头部 */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">🗳️</span>
          <h3 className="text-white font-bold">{vote.title}</h3>
        </div>
        {vote.description && (
          <p className="text-white/60 text-sm">{vote.description}</p>
        )}
        <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
          <span>📊 {totalVotes} 票</span>
          {vote.vote_cost > 0 && <span>💰 消耗 {vote.vote_cost} 积分</span>}
          {vote.vote_reward > 0 && <span>🎁 投票得 {vote.vote_reward} 积分</span>}
          {vote.end_date && (
            <span>⏰ 截止 {new Date(vote.end_date).toLocaleDateString()}</span>
          )}
        </div>
      </div>

      {/* 选项列表 */}
      <div className="p-4 space-y-3">
        {options.map((option) => {
          const percentage = totalVotes > 0 ? (option.vote_count / totalVotes) * 100 : 0
          const isSelected = selectedOption === option.index
          const isWinner = showResult && option.vote_count === Math.max(...options.map(o => o.vote_count))

          return (
            <button
              key={option.index}
              onClick={() => {
                if (!hasVoted && !isEnded) {
                  setSelectedOption(option.index)
                  setShowResult(false)
                }
              }}
              disabled={hasVoted || isEnded}
              className={`w-full relative rounded-xl p-4 transition-all ${
                hasVoted || showResult
                  ? 'cursor-default'
                  : isSelected
                    ? 'bg-primary/20 border-2 border-primary'
                    : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
              }`}
            >
              {/* 进度条背景 */}
              {(hasVoted || showResult) && (
                <div
                  className={`absolute inset-0 rounded-xl transition-all duration-500 ${
                    isWinner ? 'bg-primary/20' : 'bg-white/5'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              )}

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* 选中指示器 */}
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-primary bg-primary' : 'border-white/30'
                  }`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <span className="text-white text-sm font-medium">{option.text}</span>
                  {isWinner && hasVoted && <span className="text-xs">🏆</span>}
                </div>

                {(hasVoted || showResult) && (
                  <div className="text-right">
                    <span className="text-white font-bold text-sm">{percentage.toFixed(1)}%</span>
                    <span className="text-white/40 text-xs ml-2">({option.vote_count}票)</span>
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* 投票按钮 */}
      {!hasVoted && !isEnded && (
        <div className="px-4 pb-4">
          {error && <div className="p-2 mb-3 bg-red-500/10 text-red-400 text-xs rounded-lg">{error}</div>}
          <button
            onClick={handleVote}
            disabled={selectedOption === null || loading}
            className={`w-full py-3 rounded-xl font-bold transition-all ${
              selectedOption !== null && !loading
                ? 'bg-primary text-white active:scale-[0.98]'
                : 'bg-white/10 text-white/40'
            }`}
          >
            {loading ? '投票中...' : vote.vote_cost > 0 ? `投票 (消耗${vote.vote_cost}积分)` : '投票'}
          </button>
        </div>
      )}

      {/* 已投票提示 */}
      {hasVoted && (
        <div className="px-4 pb-4">
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
            <span className="text-green-400 text-sm">✓ 投票成功</span>
            {vote.vote_reward > 0 && (
              <span className="text-green-400 text-sm ml-2">+{vote.vote_reward}积分</span>
            )}
          </div>
        </div>
      )}

      {/* 已结束提示 */}
      {isEnded && !hasVoted && (
        <div className="px-4 pb-4">
          <div className="p-3 bg-white/5 rounded-xl text-center">
            <span className="text-white/40 text-sm">投票已结束</span>
          </div>
        </div>
      )}
    </div>
  )
}
