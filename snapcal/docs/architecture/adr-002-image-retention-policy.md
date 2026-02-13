# ADR-002: 配料识别临时图片留存策略

## Status
Accepted

## Context
配料识别流程会上传用户图片到云存储，如果不清理会产生隐私和成本风险。

## Decision
识别流程默认在分析完成后删除临时图片，清理 SLA 为 24 小时内完成。

## Rationale
1. 满足数据最小化原则。
2. 控制云存储成本，降低历史堆积。

## Trade-offs
- 调试时无法长期复现同一原图。
- 增加删除失败重试与监控成本。

## Consequences
- Positive: 隐私风险与存储成本显著下降。
- Negative: 排障可用素材减少。
- Mitigation: 保存脱敏日志和结构化识别结果。
