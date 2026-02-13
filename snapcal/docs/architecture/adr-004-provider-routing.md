# ADR-004: AI Provider 路由抽象

## Status
Accepted

## Context
当前仅使用 Qwen，后续可能引入多模型容灾或效果对比。

## Decision
引入 `providerFactory`，业务层通过统一接口获取 provider，默认路由到 Qwen。

## Rationale
1. 降低业务层与具体模型 SDK 的耦合。
2. 为多 provider 切换保留演进空间。

## Trade-offs
- 增加一层抽象和维护成本。
- 早期可能看起来“超前设计”。

## Consequences
- Positive: 后续接入新 provider 变更范围小。
- Negative: 需要约束接口一致性。
- Mitigation: 通过契约测试和适配器模式控制复杂度。
