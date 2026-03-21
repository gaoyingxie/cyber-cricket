# 🧠 MEMORY.md

## 修正记录

### [2026-03-19] 开发流程修正
**问题**: 修改代码后未检查，导致GameState类被意外删除，游戏无法启动  
**修正**: 
- 每次修改后必须检查控制台是否有报错
- 部署前测试游戏是否能正常开始
- 重要类定义不能丢失

### [2026-03-19] 版本号规范
所有H5项目首页必须显示版本号，格式：`v{主版本}.{次版本}`

### [2026-03-19] 数值策划原则
- 体力消耗要大于自然恢复，形成资源管理压力
- 金钱系统要平衡收入和支出
- 属性加成要有明显反馈
- 每个属性都要有实际作用

## 用户偏好

### 高总
- 喜欢养成类游戏
- 注重数值平衡和策略深度
- 希望有多个结局路线
- 游戏要有版本号管理
- **所有传到 GitHub 的项目，README 必须同步更新**

## H5项目发布流程（必须遵守）

### [2026-03-21] H5自动化测试标准流程

**每次 push 部署后，必须自行用自动化工具测试通过再告知用户「自测完成」。**

#### 测试工具
- **有 Chrome 环境**：用 `agent-browser`（需 `apt-get install libnss3 libnspr4 ...`）
- **无 Chrome 环境**：用 `jsdom` 做静态+运行时测试

#### 测试清单

1. **JS语法检查**
   ```js
   new Function(gameJsCode) // 必须无报错
   ```

2. **DOM id 完整性** — 所有 `getElementById('xxx')` 的 id 必须在 HTML 中存在
   ```bash
   # 提取JS中所有getElementById的id，与HTML中所有id对比
   grep -o "getElementById('[a-zA-Z-]*')" src/*.js | sort -u > /tmp/js_ids.txt
   grep -o 'id="[a-zA-Z-]*"' index.html | sort -u > /tmp/html_ids.txt
   comm -23 /tmp/js_ids.txt /tmp/html_ids.txt  # 无输出=全部匹配
   ```

3. **游戏核心流程**（jsdom 或 puppeteer）
   - ✅ 页面加载，版本号显示正确
   - ✅ 模式选择（养虾/导入）
   - ✅ 选择敌人，敌人属性显示正确
   - ✅ 战斗开始，伤害计算正确
   - ✅ 技能使用正常
   - ✅ 回合结束正常
   - ✅ 无 console Error

4. **UI更新验证**
   - HP、攻击力、防御、等级等数值正确显示

#### 报告格式
告知用户「自测完成」时，必须说明：
- 测了哪些项，结果如何
- 发现的问题和修复情况
- 在线地址

#### 常见问题
- **agent-browser 安装后无法启动 Chrome**：缺少 `libnspr4` 等库，需要 root 权限装依赖
- **jsdom 无法执行需要 DOM 的 JS**：用 `runScripts: 'dangerously'` 并在末尾暴露全局变量
- **GitHub Pages 缓存不更新**：约5-10分钟自动刷新，或用 `curl` 直接验证 GitHub 仓库内容

## 新闻推送

### [2026-03-21] 新闻脚本配置
**脚本位置**: `/home/node/.openclaw/scripts/news-fast.py`

- 每日定时推送，格式包括：今日行情、科技精选、商业财经、世界动态
- 英文新闻使用 MyMemory API 翻译成中文

## 工具配置

### [2026-03-21] H5 自动化测试（agent-browser）
- 工具：`agent-browser` CLI（v0.21.4）
- Chrome：`/home/node/.cache/ms-playwright/chromium-1091/chrome-linux/chrome`
- 环境变量：`CHROME_PATH` + `AGENT_BROWSER_BROWSERS_PATH`
- Playwright Node.js 绑定有兼容问题，不影响测试（agent-browser 完全正常）


