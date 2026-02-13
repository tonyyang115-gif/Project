# ADR-001: AI 配料识别结果契约标准化

## Status
Accepted

## Context
AI 返回结果存在字段缺失、类型漂移、风险等级不在枚举内的问题，前端渲染易崩溃。

## Decision
在云函数 `aiService` 增加 `normalizeIngredientResult`，将 AI 原始结果标准化后再返回前端。

## Rationale
1. 在服务端集中修正，比在多个客户端重复兜底更可控。
2. 能确保接口稳定，降低前端崩溃风险。

## Trade-offs
- 增加服务端代码复杂度。
- 对模型原始输出有“纠偏”，需要记录原始日志用于排查。

## Consequences
- Positive: 返回契约稳定，前端容错压力下降。
- Negative: 维护规范化逻辑的成本上升。
- Mitigation: 增加契约回归测试并版本化 prompt。
