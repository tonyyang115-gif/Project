
import { GoogleGenAI, Type } from "@google/genai";
import { FoodItem, AiProvider } from "../types";
import OpenAI from "openai";

const geminiAi = new GoogleGenAI({ apiKey: process.env.API_KEY });

const qwenAi = new OpenAI({
    apiKey: "sk-77153435fa1248b68a4dad3d4b466221",
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    dangerouslyAllowBrowser: true // Client-side usage allowed for this demo
});

const getProvider = (): AiProvider => {
    return (localStorage.getItem('snapcal_ai_provider') as AiProvider) || 'GEMINI';
};

// Prompt for analyzing food images
const ANALYSIS_PROMPT = `
Analyze this image of food. Identify the food items present.
For each item, estimate the quantity (in grams or standard units like '碗', '个', '杯'),
estimate the calories, protein, carbohydrates, and fat.
Also, provide a health score from 1 (unhealthy) to 5 (very healthy) based on nutritional value.
Be realistic with estimations.
Return the result as a JSON array of food items.
IMPORTANT: The 'name' and 'unit' fields MUST be in Simplified Chinese (简体中文).
Example format: [{"name": "米饭", "calories": 200, "protein": 4, "carbs": 44, "fat": 0.4, "quantity": 1, "unit": "碗", "healthScore": 4}]
`;

const SEARCH_PROMPT = `
Provide nutritional information for the following food item description.
Estimate standard serving size if not specified.
Provide a health score from 1 (unhealthy) to 5 (very healthy).
Return the result as a single food item JSON object.
IMPORTANT: The 'name' and 'unit' fields MUST be in Simplified Chinese (简体中文).
Example format: [{"name": "米饭", "calories": 200, "protein": 4, "carbs": 44, "fat": 0.4, "quantity": 1, "unit": "碗", "healthScore": 4}]
Description: 
`;

const INGREDIENT_PROMPT = `
Analyze this image of a food ingredient label (配料表).
1. Identify potential health hazards, allergens, or additives (e.g., Trans fats, High fructose corn syrup, Artificial colors).
2. Assign a risk level (Low, Medium, High) to each identified concern.
3. specific explanation for the additives.
4. Calculate an overall health score (0-100), where 100 is cleanest/healthiest.
5. Provide a brief summary in Simplified Chinese.
Return JSON format.
Example format: {"score": 85, "summary": "...", "concerns": [{"name": "...", "risk": "Low", "description": "..."}]}
`;

const BODY_SCAN_PROMPT = `
Analyze this full-body photo for fitness and body composition assessment.
1. Estimate the Somatotype (Ectomorph, Mesomorph, Endomorph).
2. Estimate an approximate body fat percentage range.
3. Provide a brief fitness advice based on the body type in Simplified Chinese.
Return JSON format.
Example format: {"bodyType": "Mesomorph", "bodyFatRange": "15-20%", "advice": "..."}
`;

export interface IngredientAnalysis {
  score: number;
  summary: string;
  concerns: Array<{ name: string; risk: 'Low' | 'Medium' | 'High'; description: string }>;
}

export interface BodyAnalysis {
  bodyType: string; // Ectomorph, etc.
  bodyFatRange: string;
  advice: string;
}

// Helper to parse JSON from Markdown code blocks often returned by LLMs
const cleanAndParseJSON = (text: string) => {
    try {
        const cleaned = text.replace(/```json\n?|```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("Failed to parse JSON:", text);
        throw e;
    }
};

export const analyzeFoodImage = async (base64Image: string): Promise<FoodItem[]> => {
  const provider = getProvider();
  const cleanBase64 = base64Image.split(',')[1] || base64Image;

  try {
    if (provider === 'QWEN') {
        const response = await qwenAi.chat.completions.create({
            model: "qwen-vl-plus",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: ANALYSIS_PROMPT + " Please output strictly valid JSON." },
                        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${cleanBase64}` } }
                    ]
                }
            ]
        });
        const content = response.choices[0].message.content || "[]";
        return cleanAndParseJSON(content);
    } else {
        // Gemini
        const response = await geminiAi.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: {
                parts: [
                { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } },
                { text: ANALYSIS_PROMPT }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            calories: { type: Type.NUMBER },
                            protein: { type: Type.NUMBER },
                            carbs: { type: Type.NUMBER },
                            fat: { type: Type.NUMBER },
                            quantity: { type: Type.NUMBER },
                            unit: { type: Type.STRING },
                            healthScore: { type: Type.INTEGER }
                        },
                        required: ["name", "calories", "protein", "carbs", "fat", "quantity", "unit", "healthScore"]
                    }
                }
            }
        });
        const text = response.text;
        if (!text) return [];
        return JSON.parse(text) as FoodItem[];
    }
  } catch (error) {
    console.error(`Error analyzing food image with ${provider}:`, error);
    throw error;
  }
};

export const searchFoodText = async (query: string): Promise<FoodItem[]> => {
  const provider = getProvider();

  try {
    if (provider === 'QWEN') {
        const response = await qwenAi.chat.completions.create({
            model: "qwen-plus",
            messages: [{ role: "user", content: SEARCH_PROMPT + query + " Please output strictly valid JSON array." }]
        });
        const content = response.choices[0].message.content || "[]";
        return cleanAndParseJSON(content);
    } else {
        const response = await geminiAi.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: SEARCH_PROMPT + query,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                        name: { type: Type.STRING },
                        calories: { type: Type.NUMBER },
                        protein: { type: Type.NUMBER },
                        carbs: { type: Type.NUMBER },
                        fat: { type: Type.NUMBER },
                        quantity: { type: Type.NUMBER },
                        unit: { type: Type.STRING },
                        healthScore: { type: Type.INTEGER }
                        },
                        required: ["name", "calories", "protein", "carbs", "fat", "quantity", "unit", "healthScore"]
                    }
                }
            }
        });
        const text = response.text;
        if (!text) return [];
        return JSON.parse(text) as FoodItem[];
    }
  } catch (error) {
    console.error(`Error searching food with ${provider}:`, error);
    throw error;
  }
};

export const analyzeIngredientLabel = async (base64Image: string): Promise<IngredientAnalysis> => {
    const provider = getProvider();
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    try {
        if (provider === 'QWEN') {
             const response = await qwenAi.chat.completions.create({
                model: "qwen-vl-plus",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: INGREDIENT_PROMPT + " Please output strictly valid JSON." },
                            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${cleanBase64}` } }
                        ]
                    }
                ]
            });
            const content = response.choices[0].message.content || "{}";
            return cleanAndParseJSON(content);
        } else {
            const response = await geminiAi.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: {
                    parts: [
                        { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } },
                        { text: INGREDIENT_PROMPT }
                    ]
                },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            score: { type: Type.NUMBER },
                            summary: { type: Type.STRING },
                            concerns: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        risk: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
                                        description: { type: Type.STRING }
                                    }
                                }
                            }
                        }
                    }
                }
            });
            const text = response.text;
            if (!text) throw new Error("No response from AI");
            return JSON.parse(text) as IngredientAnalysis;
        }
    } catch (error) {
        console.error(`Error analyzing ingredients with ${provider}:`, error);
        throw error;
    }
};

export const analyzeBodyShape = async (base64Image: string): Promise<BodyAnalysis> => {
    const provider = getProvider();
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    try {
        if (provider === 'QWEN') {
            const response = await qwenAi.chat.completions.create({
                model: "qwen-vl-plus",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: BODY_SCAN_PROMPT + " Please output strictly valid JSON." },
                            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${cleanBase64}` } }
                        ]
                    }
                ]
            });
            const content = response.choices[0].message.content || "{}";
            return cleanAndParseJSON(content);
        } else {
            const response = await geminiAi.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: {
                    parts: [
                        { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } },
                        { text: BODY_SCAN_PROMPT }
                    ]
                },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            bodyType: { type: Type.STRING },
                            bodyFatRange: { type: Type.STRING },
                            advice: { type: Type.STRING }
                        }
                    }
                }
            });
             const text = response.text;
            if (!text) throw new Error("No response from AI");
            return JSON.parse(text) as BodyAnalysis;
        }
    } catch (error) {
        console.error(`Error analyzing body shape with ${provider}:`, error);
        throw error;
    }
}
