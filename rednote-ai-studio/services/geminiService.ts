import { GoogleGenAI, Type } from "@google/genai";
import { PromptConfig, GeneratedNote, AnalysisResult } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Define the model constant to ensure consistency across the app
const MODEL_NAME = "gemini-3-pro-preview";

// 辅助函数：清理 Markdown 代码块标记，防止 JSON.parse 失败
const cleanJsonText = (text: string): string => {
  if (!text) return "{}";
  let clean = text.trim();
  // 移除 ```json ... ``` 或 ``` ... ```
  clean = clean.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  // 处理可能存在的开头 ``` 
  clean = clean.replace(/^```\s*/, "");
  return clean;
};

// 辅助函数：清理正文中的 Markdown 符号，使其适合直接复制到小红书
const cleanContent = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/\*\*/g, '')          // 移除粗体标记
    .replace(/^#{1,6}\s+/gm, '')   // 移除标题标记 (如 ### )
    .replace(/`/g, '');            // 移除代码标记
};

// 辅助函数：清理标签中的 # 号
const cleanTag = (tag: string): string => {
  return tag.replace(/^#+/, '').trim();
};

// 辅助函数：等待指定毫秒数
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 核心重试逻辑封装
async function callGeminiWithRetry<T>(
  operation: () => Promise<T>, 
  signal?: AbortSignal,
  maxRetries: number = 5, // Increased retries for stability
  initialDelay: number = 3000 // Increased initial delay to 3s
): Promise<T> {
  let lastError: any;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // 每次尝试前检查是否被中止
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // 如果是中止信号，直接抛出，不重试
      if (error.name === 'AbortError' || signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      // Robust Error Inspection for Google GenAI / Network Errors
      const errorMessage = error?.message || JSON.stringify(error);
      
      const isStatus500 = error?.status === 500 || error?.error?.code === 500;
      const isStatus503 = error?.status === 503 || error?.error?.code === 503;
      
      // Check for network-related keywords including specific RPC codes
      const isNetworkError = 
        errorMessage.includes('xhr error') || 
        errorMessage.includes('fetch failed') || 
        errorMessage.includes('network') ||
        errorMessage.includes('Rpc failed') ||
        errorMessage.includes('error code: 6'); // Specific fix for the reported error

      const isRetryable = attempt < maxRetries && (isStatus500 || isStatus503 || isNetworkError);

      if (!isRetryable) {
        throw error;
      }

      console.warn(`[Gemini Retry] Attempt ${attempt + 1}/${maxRetries} failed. Retrying in ${delay}ms...`, { isStatus500, isNetworkError, msg: errorMessage });
      
      // 等待一段指数退避的时间
      await Promise.race([
        wait(delay),
        new Promise((_, reject) => {
          if (signal) {
            signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
          }
        })
      ]);
      
      delay *= 2; // 指数退避
    }
  }
  throw lastError;
}

export const generateNoteFromTopic = async (
  topic: string, 
  config: PromptConfig,
  sourceArticle?: string,
  signal?: AbortSignal
): Promise<GeneratedNote> => {
  
  // 动态替换逻辑：将配置中的占位符替换为用户输入的实际 Topic
  const replacePlaceholder = (text: string) => {
    if (!text) return "";
    return text
      // 支持多种引号格式
      .replace(/“引用笔记主题内容“/g, () => topic) // 中文双引号（常用于 constants.ts）
      .replace(/“引用笔记主题内容”/g, () => topic) // 标准中文引号
      .replace(/"引用笔记主题内容"/g, () => topic) // 英文引号
      .replace(/'引用笔记主题内容'/g, () => topic) // 单引号
      .replace(/引用笔记主题内容/g, () => topic);   // 无引号兜底
  };

  const dynamicConfig = {
    role: replacePlaceholder(config.role),
    task: replacePlaceholder(config.task),
    goal: replacePlaceholder(config.goal),
    strategy: replacePlaceholder(config.strategy),
    framework: replacePlaceholder(config.framework),
    tags: replacePlaceholder(config.tags),
    format: replacePlaceholder(config.format),
  };

  const systemPrompt = `你是一位顶尖的小红书（Xiaohongshu）爆款内容创作者。
  请输出符合 JSON 语法的纯文本，不要包含 Markdown 格式标记。
  输出必须使用简体中文。
  文案风格需要真实、活泼，大量使用Emoji。
  
  核心指令：
  1. 角色设定: ${dynamicConfig.role}
  2. 核心任务: ${dynamicConfig.task}
  3. 核心目标: ${dynamicConfig.goal}
  4. 算法策略: ${dynamicConfig.strategy}`;

  let articleContext = "";
  if (sourceArticle && sourceArticle.trim()) {
    articleContext = `
    【参考来源文章】
    """
    ${sourceArticle.substring(0, 5000)}
    """
    请提取该文章的核心观点，逻辑和素材，并结合下方设定的主题"${topic}"进行二次创作。不要直接复制文章，而是将其转化为小红书风格的笔记。
    `;
  }

  const userPrompt = `
  请根据以下深度配置撰写一篇小红书笔记：
  主题: ${topic}
  ${articleContext}
  
  【内容框架】
  ${dynamicConfig.framework}
  
  【标签策略】
  ${dynamicConfig.tags}
  
  【输出格式要求】
  """
  ${dynamicConfig.format}
  """
  
  请严格按照上述框架和格式生成内容。
  特别注意：如果用户在“输出格式”中定义了“职场真相”、“讨论话题”等特殊板块，请务必将它们完整包含在 JSON 的 content 字段中。
  正文中不要使用Markdown格式（如 **加粗** 或 ### 标题），直接输出纯文本。
  
  请返回严格的 JSON 对象（不要包裹在 code block 中），包含：
  - title: 字符串
  - content: 字符串（完整正文，包含所有定义的板块，约900字左右，分段清晰，Emoji丰富，无Markdown符号）
  - tags: 字符串数组
  - emoji: 单个Emoji字符
  `;

  try {
    const response = await callGeminiWithRetry(async () => {
       const result = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              emoji: { type: Type.STRING }
            },
            required: ["title", "content", "tags", "emoji"]
          }
        }
      });
      return result;
    }, signal);

    const jsonStr = cleanJsonText(response.text || "");
    const result = jsonStr ? JSON.parse(jsonStr) : {};
    
    const contentCleaned = cleanContent(result.content || '生成内容失败，请重试');
    
    // Clean tags to remove any '#' symbols provided by AI
    const uniqueTags = Array.isArray(result.tags) 
      ? Array.from(new Set(result.tags as string[])).map(cleanTag).filter(t => t.length > 0)
      : [];

    return {
      title: result.title || '生成标题失败',
      content: contentCleaned,
      tags: uniqueTags,
      emoji: result.emoji || '✨'
    } as GeneratedNote;

  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw error;
    }
    console.error("Gemini Generation Error:", error);
    return {
        title: "生成出错",
        content: "AI 响应超时或服务繁忙（RPC Error），请稍后重试。",
        tags: [],
        emoji: "⚠️"
    };
  }
};

export const refineNote = async (
  currentNote: GeneratedNote,
  instruction: string,
  config: PromptConfig,
  signal?: AbortSignal
): Promise<GeneratedNote> => {
  
  const systemPrompt = `你是一位专业的小红书内容编辑。你的任务是根据用户的修改指令，优化现有的小红书笔记。
  请保持原有的核心角色设定：${config.role}
  
  要求：
  1. 输出必须是 JSON 格式。
  2. 严格遵循用户的优化指令（例如修改语气、增减字数、调整标签等）。
  3. 保持小红书的爆款风格（Emoji丰富、段落清晰）。
  4. 严禁使用 Markdown 格式（如 ** 或 ###）。
  `;

  const userPrompt = `
  【当前笔记】
  标题：${currentNote.title}
  内容：${currentNote.content}
  标签：${currentNote.tags.join(', ')}
  
  【优化指令】
  ${instruction}
  
  请输出优化后的笔记（完整 JSON 格式）：
  `;

  try {
    const response = await callGeminiWithRetry(async () => {
      return await ai.models.generateContent({
        model: MODEL_NAME,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              emoji: { type: Type.STRING }
            },
            required: ["title", "content", "tags", "emoji"]
          }
        }
      });
    }, signal);

    const jsonStr = cleanJsonText(response.text || "");
    const result = jsonStr ? JSON.parse(jsonStr) : {};
    
    const contentCleaned = cleanContent(result.content || '生成内容失败，请重试');
    
    // Clean tags
    const uniqueTags = Array.isArray(result.tags) 
      ? Array.from(new Set(result.tags as string[])).map(cleanTag).filter(t => t.length > 0)
      : [];

    return {
      title: result.title || currentNote.title,
      content: contentCleaned,
      tags: uniqueTags,
      emoji: result.emoji || currentNote.emoji
    } as GeneratedNote;

  } catch (error: any) {
    if (error.name === 'AbortError') {
       throw error;
    }
    console.error("Refinement Error:", error);
    throw error;
  }
};

export const analyzeViralNote = async (content: string): Promise<AnalysisResult> => {
  const systemPrompt = `你是一位专业的小红书爆款内容分析师。
  你的任务是深度拆解给定的热门笔记，分析其具备"爆款"潜质的原因。
  
  请分析以下维度并以 JSON 格式输出：
  1. titleAnalysis: 标题吸引力分析（使用了什么套路？悬念？反差？利益点？）
  2. frameworkAnalysis: 内容逻辑与结构分析（详细拆解开头、中间、结尾是如何铺排的，逻辑要清晰）
  3. keywords: 提取至少5个核心SEO关键词
  4. tags: 提取或推断至少5个适合的标签
  5. viralScore: 预测爆款指数 (0-100之间的整数)
  6. tagsAnalysis: 标签策略分析（分析标签的垂直度、流量词搭配等）`;

  const userPrompt = `请分析这篇笔记：\n\n"${content.substring(0, 3000)}"`;

  try {
    const response = await callGeminiWithRetry(async () => {
      return await ai.models.generateContent({
        model: MODEL_NAME,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              titleAnalysis: { type: Type.STRING },
              frameworkAnalysis: { type: Type.STRING },
              keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              viralScore: { type: Type.INTEGER },
              tagsAnalysis: { type: Type.STRING }
            },
            required: ["titleAnalysis", "frameworkAnalysis", "keywords", "tags", "viralScore", "tagsAnalysis"]
          }
        }
      });
    });

    const jsonStr = cleanJsonText(response.text || "");
    const result = jsonStr ? JSON.parse(jsonStr) : {};
    
    return {
      titleAnalysis: result.titleAnalysis || '暂无分析结果',
      frameworkAnalysis: result.frameworkAnalysis || '暂无分析结果',
      keywords: Array.isArray(result.keywords) && result.keywords.length > 0 ? result.keywords : [],
      tags: Array.isArray(result.tags) && result.tags.length > 0 ? Array.from(new Set(result.tags as string[])).map(cleanTag).filter(t => t.length > 0) : [],
      viralScore: typeof result.viralScore === 'number' ? result.viralScore : 0,
      tagsAnalysis: result.tagsAnalysis || '暂无分析结果'
    } as AnalysisResult;

  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
};

export const replicateViralNotes = async (
  analysis: AnalysisResult, 
  originalContent: string, 
  count: number
): Promise<GeneratedNote[]> => {
  
  const systemPrompt = `你是一位小红书爆款仿写专家。
  任务：基于给定的分析数据和原笔记语感，创作全新的小红书笔记。
  
  核心原则：
  1. **字数控制**: 
     - 笔记主体内容严格控制在 **850字** 以内。
     - 加上标签后的全篇总字数严格控制在 **950字** 以内。
     - (注意：字数过多会导致发布失败，请务必精简)
  2. **排版优化**: 拒绝大段文字，多换行（每段<4行），丰富Emoji（✨🔥✅等）。
  3. **结构逻辑**: 黄金3秒开头 -> 干货中间 -> 互动结尾。
  4. **输出格式**: 纯文本输出，严禁使用Markdown标记（如 **加粗** 或 ### 标题）。
  
  输出：必须是合法的 JSON 对象。`;

  const generateSingleVariation = async (index: number): Promise<GeneratedNote> => {
      const userPrompt = `
      这是第 ${index + 1} 篇仿写任务。

      【参考数据】
      - 标题策略: ${analysis.titleAnalysis}
      - 结构逻辑: ${analysis.frameworkAnalysis}
      - 核心关键词: ${(analysis.keywords || []).join(", ")}
      
      【原笔记片段（仅供参考语感）】
      ${originalContent.substring(0, 300)}...

      请生成一篇全新的笔记，返回 JSON：
      {
        "title": "新标题",
        "content": "正文...",
        "tags": ["tag1", "tag2"],
        "emoji": "心情emoji"
      }
      `;

      try {
        const response = await callGeminiWithRetry(async () => {
          return await ai.models.generateContent({
            model: MODEL_NAME,
            contents: userPrompt,
            config: {
              systemInstruction: systemPrompt,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  content: { type: Type.STRING },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  emoji: { type: Type.STRING }
                },
                required: ["title", "content", "tags", "emoji"]
              }
            }
          });
        });

        const jsonStr = cleanJsonText(response.text || "");
        const v = jsonStr ? JSON.parse(jsonStr) : {};
        
        const cleanedContent = cleanContent(v.content || '生成失败，请重试');
        
        // Clean tags
        const uniqueTags = Array.isArray(v.tags) 
          ? Array.from(new Set(v.tags as string[])).map(cleanTag).filter(t => t.length > 0)
          : [];

        return {
            title: v.title || `仿写笔记 ${index + 1}`,
            content: cleanedContent,
            tags: uniqueTags,
            emoji: v.emoji || '📝'
        };
      } catch (e) {
        console.error(`Variation ${index} failed:`, e);
        return {
            title: "生成超时或失败",
            content: "该笔记生成过程中遇到问题，建议稍后重试。",
            tags: [],
            emoji: "❌"
        };
      }
  };

  const promises = Array.from({ length: count }).map((_, i) => generateSingleVariation(i));
  
  try {
    const results = await Promise.all(promises);
    return results;
  } catch (error) {
    console.error("Replication Error:", error);
    throw error;
  }
};