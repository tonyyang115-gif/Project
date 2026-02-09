# 移除 TabBar 底部导航栏说明

## 修改内容

### 1. 移除 TabBar 配置
- ✅ 从 `app.json` 中移除了 `tabBar` 配置
- ✅ 底部不再显示"首页"、"历史"、"我的"三个导航入口

### 2. 更新页面导航方式
- ✅ 将 `wx.switchTab` 改为 `wx.navigateTo` 或 `wx.redirectTo`
- ✅ 因为不再使用 tabBar，所有页面导航都使用普通页面跳转

## 修改的文件

1. **miniprogram/app.json**
   - 移除了 `tabBar` 配置项

2. **miniprogram/pages/room/index.js**
   - `confirmLeave()` 方法：`wx.switchTab` → `wx.redirectTo`

3. **miniprogram/pages/profile/index.js**
   - `viewHistory()` 方法：`wx.switchTab` → `wx.navigateTo`

## 现在的导航方式

- **首页** → **房间页面**：`wx.navigateTo`
- **房间页面** → **首页**：`wx.redirectTo`（离开房间时）
- **房间页面** → **个人中心**：`wx.navigateTo`
- **个人中心** → **历史战绩**：`wx.navigateTo`

## 注意事项

1. **返回按钮**
   - 现在所有页面都会显示导航栏的返回按钮
   - 用户可以通过返回按钮回到上一页

2. **页面栈管理**
   - 使用 `wx.redirectTo` 会关闭当前页面，无法返回
   - 使用 `wx.navigateTo` 会保留当前页面，可以返回

3. **首页设置**
   - 首页仍然是第一个页面（在 pages 数组的第一位）
   - 小程序启动时会自动打开首页

## 如果需要恢复 TabBar

如果以后需要恢复底部导航栏，只需要：
1. 在 `app.json` 中重新添加 `tabBar` 配置
2. 将相关导航代码改回 `wx.switchTab`

---

**修改时间**：2024年
**版本**：v1.2








