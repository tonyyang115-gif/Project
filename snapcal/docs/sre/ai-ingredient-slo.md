# AI 配料识别 SLO

## SLI 指标
- 成功率：`success=true` / 总请求数
- 超时率：`errorCode=AI_TIMEOUT` / 总请求数
- P95 延迟：云函数总耗时
- Provider P95 延迟：`providerLatency`

## SLO 目标
- 成功率 >= 97%
- 超时率 <= 2%
- 云函数 P95 <= 8s
- Provider P95 <= 6s

## 告警阈值
- 5 分钟窗口成功率 < 94%
- 5 分钟窗口超时率 > 5%
- 15 分钟窗口 P95 > 10s

## 处置流程
1. 优先确认 provider 状态与网络波动。
2. 检查 `phase` 和 `errorCode` 分布。
3. 必要时启用限流降级并通知产品侧。
