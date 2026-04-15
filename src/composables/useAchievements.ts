/**
 * useAchievements.ts - 成就系统
 */
import type { Achievement, UnlockedAchievement, GameStateContext, Player } from '../types/game'
import { ACHIEVEMENTS } from '../config'

export function useAchievements() {

  // 检查所有成就
  function checkAchievements(
    players: Player[],
    ctx: GameStateContext
  ): Map<number, UnlockedAchievement[]> {
    const unlockedMap = new Map<number, UnlockedAchievement[]>()

    for (const player of players) {
      const unlocked: UnlockedAchievement[] = []

      for (const achievement of ACHIEVEMENTS) {
        // 跳过已解锁的
        if (player.achievements.includes(achievement.id)) continue

        // 检查条件
        try {
          if (achievement.condition(ctx)) {
            unlocked.push({
              achievementId: achievement.id,
              unlockedAt: Date.now(),
              notified: false
            })
            player.achievements.push(achievement.id)

            // 发放奖励
            if (achievement.reward) {
              player.money += achievement.reward
            }
          }
        } catch (e) {
          console.warn(`成就 ${achievement.id} 条件检查失败:`, e)
        }
      }

      if (unlocked.length > 0) {
        unlockedMap.set(player.id, unlocked)
      }
    }

    return unlockedMap
  }

  // 获取成就列表（带解锁状态）
  function getAchievementsWithStatus(player: Player): Array<Achievement & { unlocked: boolean; unlockedAt?: number }> {
    return ACHIEVEMENTS.map(achievement => {
      const unlocked = player.achievements.includes(achievement.id)
      return {
        ...achievement,
        unlocked
      }
    })
  }

  // 获取已解锁成就
  function getUnlockedAchievements(player: Player): Achievement[] {
    return ACHIEVEMENTS.filter(a => player.achievements.includes(a.id))
  }

  // 获取进度成就
  function getAchievementProgress(player: Player, achievementId: string): { current: number; target: number; percentage: number } | null {
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId)
    if (!achievement) return null

    // 根据成就类型计算进度
    let current = 0
    let target = 1

    switch (achievementId) {
      case 'first_buy':
        current = player.properties.length
        target = 1
        break
      case 'landlord':
        current = player.properties.length
        target = 5
        break
      case 'rich':
        current = player.money
        target = 1500
        break
      case 'skill_master':
        current = player.skillLevel
        target = 3
        break
      case 'first_item':
        current = player.items.length
        target = 1
        break
      case 'upgraded':
        current = player.properties.filter(p => (p.level ?? 0) >= 3).length
        target = 1
        break
      default:
        return null
    }

    return {
      current,
      target,
      percentage: Math.min(100, Math.floor((current / target) * 100))
    }
  }

  // 格式化成就通知消息
  function formatAchievementNotification(achievement: Achievement, reward?: number): string {
    let msg = `🏆 成就解锁：${achievement.icon} ${achievement.name}`
    if (achievement.description) {
      msg += `\n${achievement.description}`
    }
    if (reward && reward > 0) {
      msg += `\n🎁 奖励：+${reward}金币`
    }
    return msg
  }

  return {
    checkAchievements,
    getAchievementsWithStatus,
    getUnlockedAchievements,
    getAchievementProgress,
    formatAchievementNotification
  }
}
