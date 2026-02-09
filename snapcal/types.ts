
export enum Gender {
  MALE = '男',
  FEMALE = '女'
}

export enum ActivityLevel {
  SEDENTARY = '久坐 (几乎不运动)', 
  LIGHTLY_ACTIVE = '轻度活动 (每周1-3次)', 
  MODERATELY_ACTIVE = '中度活动 (每周3-5次)', 
  VERY_ACTIVE = '高度活动 (每周6-7次)', 
  EXTRA_ACTIVE = '极高强度 (体力工作/运动员)' 
}

export enum Goal {
  LOSE_WEIGHT = '减脂',
  MAINTAIN = '保持体重',
  GAIN_MUSCLE = '增肌'
}

export enum DietPreference {
  BALANCED = '均衡饮食',
  LOW_CARB = '低碳水',
  HIGH_PROTEIN = '高蛋白',
  VEGAN = '全素'
}

export type AiProvider = 'GEMINI' | 'QWEN';

export interface NotificationConfig {
  enabled: boolean;
  time: string;
}

export interface UserNotifications {
  breakfast: NotificationConfig;
  lunch: NotificationConfig;
  dinner: NotificationConfig;
  snack: NotificationConfig;
  water: NotificationConfig;
  weight: NotificationConfig;
}

export interface UserProfile {
  name: string;
  gender: Gender;
  age: number;
  height: number; // cm
  weight: number; // kg
  targetWeight: number; // kg
  activityLevel: ActivityLevel;
  goal: Goal;
  dietPreference: DietPreference;
  bmr: number;
  tdee: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  notifications?: UserNotifications;
  avatarUrl?: string;
  aiProvider?: AiProvider;
}

export enum MealType {
  BREAKFAST = '早餐',
  LUNCH = '午餐',
  DINNER = '晚餐',
  SNACK = '加餐'
}

export interface FoodItem {
  name: string;
  calories: number;
  protein: number; // g
  carbs: number; // g
  fat: number; // g
  quantity: number; // usually grams
  unit: string;
  healthScore?: number; // 1-5
}

export interface MealLog {
  id: string;
  date: string; // ISO Date string YYYY-MM-DD
  timestamp: number;
  type: MealType;
  items: FoodItem[];
  totalCalories: number;
  imageUrl?: string;
}

export interface ExerciseLog {
  id: string;
  date: string;
  timestamp: number;
  type: string;
  duration: number; // minutes
  caloriesBurned: number;
}

export type ViewState = 'LANDING' | 'ONBOARDING' | 'DASHBOARD' | 'LOG_FOOD' | 'LOG_EXERCISE' | 'STATS' | 'PROFILE' | 'HEALTH';

export const PRESET_AVATARS = [
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Felix",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Aneka",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Zack",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Molly",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Scooter",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Bandit",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Simba",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Annie"
];
