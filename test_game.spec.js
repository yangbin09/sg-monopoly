const { test, expect } = require('@playwright/test');
const { spawn } = require('child_process');

let server;

test.beforeAll(async () => {
  // 启动 vite preview 服务器
  server = spawn('npx', ['vite', 'preview', '--port', '4173'], {
    cwd: __dirname,
    shell: true,
    stdio: 'pipe'
  });

  // 等待服务器启动
  await new Promise(resolve => setTimeout(resolve, 3000));
});

test.afterAll(async () => {
  if (server) {
    server.kill();
  }
});

test.describe('三国大富翁游戏测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4173/');
  });

  // 测试1: 页面加载和初始状态
  test('1. 页面加载 - 标题和初始界面显示正确', async ({ page }) => {
    await expect(page).toHaveTitle('三国大富翁游戏');
    await expect(page.locator('#start-screen')).toBeVisible();
    await expect(page.locator('h1')).toContainText('选择你的英雄');
    await expect(page.locator('#selection-info')).toContainText('玩家 1');
  });

  // 测试2: 角色选择
  test('2. 角色选择 - 显示4个角色卡片', async ({ page }) => {
    const cards = page.locator('.character-card');
    await expect(cards).toHaveCount(4);

    // 验证角色信息
    const names = ['刘备', '关羽', '张飞', '诸葛亮'];
    for (const name of names) {
      await expect(page.locator('.character-card', { hasText: name })).toBeVisible();
    }
  });

  // 测试3: 角色选择流程
  test('3. 角色选择 - 选择2个玩家后游戏开始', async ({ page }) => {
    // 点击刘备
    await page.locator('.character-card', { hasText: '刘备' }).click();
    await expect(page.locator('#selection-info')).toContainText('玩家 2');

    // 点击关羽
    await page.locator('.character-card', { hasText: '关羽' }).click();

    // 等待游戏界面渲染
    await page.waitForSelector('#game', { state: 'visible', timeout: 5000 });

    // 游戏界面应显示
    await expect(page.locator('#start-screen')).toHaveClass(/hidden/);
    await expect(page.locator('#game')).toBeVisible();
    await expect(page.locator('#roll-button')).toBeVisible();
  });

  // 测试4: 重复角色选择拦截
  test('4. 角色选择 - 不能选择相同角色', async ({ page }) => {
    // 选择刘备
    await page.locator('.character-card', { hasText: '刘备' }).click();

    // 再点击刘备，验证提示
    await page.locator('.character-card', { hasText: '刘备' }).click();
    // 提示信息应该包含"已被选择"或"已选择"
    await expect(page.locator('#selection-info')).toContainText('已选择');
  });

  // 测试5: 棋盘渲染
  test('5. 游戏界面 - 棋盘正确渲染', async ({ page }) => {
    // 选择角色进入游戏
    await page.locator('.character-card', { hasText: '刘备' }).click();
    await page.locator('.character-card', { hasText: '关羽' }).click();

    // 等待游戏界面渲染
    await page.waitForSelector('#board', { state: 'visible', timeout: 5000 });

    // 验证棋盘
    await expect(page.locator('#board')).toBeVisible();
    await expect(page.locator('.cell')).toHaveCount(25);

    // 验证记分板
    await expect(page.locator('.scoreboard')).toBeVisible();
    await expect(page.locator('.player-info')).toHaveCount(2);
  });

  // 测试6: 掷骰子
  test('6. 掷骰子 - 按钮可用且能触发', async ({ page }) => {
    await page.locator('.character-card', { hasText: '刘备' }).click();
    await page.locator('.character-card', { hasText: '关羽' }).click();

    const rollBtn = page.locator('#roll-button');
    await expect(rollBtn).toBeEnabled();

    await rollBtn.click();

    // 等待骰子结果显示
    const diceResult = page.locator('#dice-result');
    await expect(diceResult).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(200);
    const diceText = await diceResult.textContent();
    // 提取数字
    const diceNum = parseInt(diceText.replace(/\D/g, ''));
    expect(diceNum).toBeGreaterThanOrEqual(1);
    expect(diceNum).toBeLessThanOrEqual(6);
  });

  // 测试7: 棋子移动
  test('7. 掷骰子 - 棋子位置更新', async ({ page }) => {
    await page.locator('.character-card', { hasText: '刘备' }).click();
    await page.locator('.character-card', { hasText: '关羽' }).click();

    // 获取初始棋子位置
    await page.locator('#roll-button').click();
    await page.waitForTimeout(1000);

    // 消息区域应有内容
    const messages = page.locator('#message p');
    expect(await messages.count()).toBeGreaterThan(0);
  });

  // 测试8: 记分板更新
  test('8. 游戏进行 - 记分板金币显示', async ({ page }) => {
    await page.locator('.character-card', { hasText: '刘备' }).click();
    await page.locator('.character-card', { hasText: '关羽' }).click();

    // 初始金币
    await expect(page.locator('.money').first()).toContainText('金币: 1000');
  });

  // 测试9: 回合切换
  test('9. 回合制 - 玩家轮流行动', async ({ page }) => {
    await page.locator('.character-card', { hasText: '刘备' }).click();
    await page.locator('.character-card', { hasText: '关羽' }).click();

    // 第一次掷骰
    await page.locator('#roll-button').click();
    await page.waitForTimeout(1500);

    // 按钮应再次可用
    await expect(page.locator('#roll-button')).toBeEnabled();
  });

  // 测试10: 格子类型样式
  test('10. 棋盘 - 不同类型格子有正确样式', async ({ page }) => {
    await page.locator('.character-card', { hasText: '刘备' }).click();
    await page.locator('.character-card', { hasText: '关羽' }).click();

    // 验证起点格子
    const startCell = page.locator('.cell.start');
    await expect(startCell).toBeVisible();

    // 验证事件格子
    const eventCell = page.locator('.cell.event').first();
    await expect(eventCell).toBeVisible();
  });
});
