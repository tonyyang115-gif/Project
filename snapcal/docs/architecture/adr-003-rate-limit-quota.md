# ADR-003: AI 识别限流与配额策略

## Status
Accepted

## Context
AI 接口成本高且易被重复触发，需要限制短时流量和单日使用量。

## Decision
对 `analyzeIngredients` 增加用户级限流和日配额：
- 分钟限流：每用户每动作 6 次/分钟
- 日配额：每用户每动作 80 次/日

## Rationale
1. 防止异常重试与滥用。
2. 在成本与可用性之间取得平衡。

## Trade-offs
- 个别重度用户会遇到限额。
- 需要维护阈值并动态调优。

## Consequences
- Positive: 供应商调用量更可控，成本风险可控。
- Negative: 用户体验可能受限。
- Mitigation: 提供清晰错误提示并支持后续调参。
