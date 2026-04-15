/**
 * useGameStorage.ts - 游戏存档系统 (增强版)
 */
import type { SavedGame, Player, WeatherType, PlayerItem, PropertyLevel } from '../types/game'

const SAVE_KEY = 'sg_monopoly_save'
const SAVE_VERSION = 2  // 当前版本

interface LegacySave {
  players: any[]
  currentPlayerIndex: number
  propertyOwners: Record<number, number>
  timestamp: number
}

export function useGameStorage() {

  // 保存游戏
  function saveGame(
    players: Player[],
    currentPlayerIndex: number,
    propertyOwners: Record<number, number>,
    weather: WeatherType,
    turnCount: number,
    messages: string[]
  ): boolean {
    try {
      const saveData: SavedGame = {
        version: SAVE_VERSION,
        players: players.map(p => ({
          ...p,
          items: p.items.map(i => ({
            id: i.id,
            name: i.name,
            description: i.description,
            type: i.type,
            value: i.value,
            cost: i.cost,
            usable: i.usable,
            icon: i.icon,
            ownedAt: i.ownedAt
          })),
          properties: p.properties.map(prop => ({
            ...prop,
            level: prop.level ?? 0
          }))
        })),
        currentPlayerIndex,
        propertyOwners,
        weather,
        turnCount,
        messages: messages.slice(-50),  // 只保留最近50条
        timestamp: Date.now()
      }

      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData))
      return true
    } catch (e) {
      console.error('保存游戏失败:', e)
      return false
    }
  }

  // 加载游戏
  function loadGame(): SavedGame | null {
    try {
      const data = localStorage.getItem(SAVE_KEY)
      if (!data) return null

      const save = JSON.parse(data) as SavedGame

      // 版本迁移
      if (save.version < SAVE_VERSION) {
        return migrateSaveData(save)
      }

      return save
    } catch (e) {
      console.error('加载游戏失败:', e)
      return null
    }
  }

  // 迁移旧版本存档
  function migrateSaveData(oldSave: any): SavedGame {
    // v1 -> v2: 添加天气、道具、地产等级
    const migrated: SavedGame = {
      version: SAVE_VERSION,
      players: (oldSave.players || []).map((p: any) => ({
        ...p,
        items: p.items || [],
        skillLevel: p.skillLevel || 1,
        achievements: p.achievements || [],
        isAI: p.isAI || false,
        shieldActive: p.shieldActive || false,
        consecutiveTurnsWithoutBuy: p.consecutiveTurnsWithoutBuy || 0,
        properties: (p.properties || []).map((prop: any) => ({
          ...prop,
          level: (prop.level ?? 0) as PropertyLevel
        }))
      })),
      currentPlayerIndex: oldSave.currentPlayerIndex || 0,
      propertyOwners: oldSave.propertyOwners || {},
      weather: (oldSave.weather || 'sunny') as WeatherType,
      turnCount: oldSave.turnCount || 0,
      messages: oldSave.messages || [],
      timestamp: oldSave.timestamp || Date.now()
    }

    // 保存迁移后的数据
    localStorage.setItem(SAVE_KEY, JSON.stringify(migrated))
    return migrated
  }

  // 删除存档
  function deleteSave(): void {
    localStorage.removeItem(SAVE_KEY)
  }

  // 检查是否存在存档
  function hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null
  }

  // 获取存档信息（不完整加载）
  function getSaveInfo(): { timestamp: number; turnCount: number; playerCount: number } | null {
    try {
      const data = localStorage.getItem(SAVE_KEY)
      if (!data) return null

      const save = JSON.parse(data) as SavedGame
      return {
        timestamp: save.timestamp,
        turnCount: save.turnCount,
        playerCount: save.players.length
      }
    } catch {
      return null
    }
  }

  // 自动保存
  function autoSave(
    players: Player[],
    currentPlayerIndex: number,
    propertyOwners: Record<number, number>,
    weather: WeatherType,
    turnCount: number,
    messages: string[]
  ): void {
    // 每5回合自动保存一次
    if (turnCount % 5 === 0) {
      saveGame(players, currentPlayerIndex, propertyOwners, weather, turnCount, messages)
    }
  }

  return {
    saveGame,
    loadGame,
    deleteSave,
    hasSave,
    getSaveInfo,
    autoSave
  }
}
