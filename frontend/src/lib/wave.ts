// ===== 浪级系统 =====

export type WaveLevel = 0 | 1 | 2 | 3 | 4

export interface WaveInfo {
  level: WaveLevel
  name: string
  icon: string
  minExposure: number
  description: string
}

export const WAVE_LEVELS: WaveInfo[] = [
  { level: 0, name: '小浪', icon: '🌊', minExposure: 0, description: '在推广广场可见' },
  { level: 1, name: '中浪', icon: '🌊🌊', minExposure: 50, description: '进入推广推荐位' },
  { level: 2, name: '大浪', icon: '🌊🌊🌊', minExposure: 500, description: '混入有机内容流' },
  { level: 3, name: '巨浪', icon: '🌊🌊🌊🌊', minExposure: 5000, description: '全站推送 + 浪潮标识' },
  { level: 4, name: '海啸', icon: '🌊🌊🌊🌊🌊', minExposure: 50000, description: '现象级传播' },
]

/**
 * 根据曝光量计算浪级
 */
export function getWaveLevel(exposure: number): WaveLevel {
  if (exposure >= 50000) return 4
  if (exposure >= 5000) return 3
  if (exposure >= 500) return 2
  if (exposure >= 50) return 1
  return 0
}

/**
 * 获取浪级信息
 */
export function getWaveInfo(exposure: number): WaveInfo {
  return WAVE_LEVELS[getWaveLevel(exposure)]
}

/**
 * 计算帮推带来的曝光增量
 * 每次帮推 +50 曝光，但受内容质量系数影响
 */
export function calcExposureBoost(qualityScore: number): number {
  const baseBoost = 50
  // 质量系数：优质内容加成，垃圾内容惩罚
  let coefficient = 1.0
  if (qualityScore >= 80) coefficient = 1.5
  else if (qualityScore >= 60) coefficient = 1.2
  else if (qualityScore >= 40) coefficient = 1.0
  else if (qualityScore >= 20) coefficient = 0.7
  else coefficient = 0.3

  return Math.round(baseBoost * coefficient)
}
