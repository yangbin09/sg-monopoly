# 旧版本架构（重构前）

## 原项目结构

```
sg_monopoly/
├── index.html        # 主页面
├── style.css         # 样式表
├── script.js         # 入口文件（模块加载）
├── game-state.js    # 游戏状态（Class）
├── game-logic.js    # 游戏逻辑（Class）
├── ui-renderer.js    # UI 渲染（Class）
├── config.js         # 配置文件
├── images/          # 图片资源
└── test_game.spec.js # Playwright 测试
```

## 旧版本特点

- **模块系统**: 原生 ES Module (`<script type="module">`)
- **状态管理**: Class 类实例
- **UI 操作**: 直接 DOM 操作
- **构建方式**: 无构建工具，直接浏览器运行
- **文件数量**: 4 个主要 JS 文件分散

## 新版本改进

详见 PR: https://github.com/yangbin09/sg-monopoly/pull/1
