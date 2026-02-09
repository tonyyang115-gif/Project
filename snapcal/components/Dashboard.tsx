import React, { useMemo } from 'react';
import { UserProfile, MealLog, MealType, ExerciseLog } from '../types';
import { Calendar, ChevronRight, ScanLine, PenTool, Plus, Flame, Droplets, Wheat, Zap } from 'lucide-react';

interface DashboardProps {
  user: UserProfile;
  logs: MealLog[];
  exercises: ExerciseLog[];
  onLogFood: (mode: 'PHOTO' | 'SEARCH', mealType?: MealType) => void;
  onLogExercise: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, logs, exercises, onLogFood, onLogExercise }) => {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
  const todaysLogs = logs.filter(log => log.date === dateStr);
  const todaysExercises = exercises.filter(ex => ex.date === dateStr);

  // Calculate Totals
  const totals = useMemo(() => {
    return todaysLogs.reduce((acc, log) => {
      acc.calories += log.totalCalories;
      log.items.forEach(item => {
        acc.protein += item.protein;
        acc.carbs += item.carbs;
        acc.fat += item.fat;
      });
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [todaysLogs]);

  const totalBurned = useMemo(() => {
    return todaysExercises.reduce((sum, ex) => sum + ex.caloriesBurned, 0);
  }, [todaysExercises]);

  // Remaining = Target + Burned - Consumed
  const remainingCalories = Math.max(0, (user.targetCalories + totalBurned) - totals.calories);
  // Calculate percentage for the circle (consumed / (target + burned))
  const dailyTarget = user.targetCalories + totalBurned;
  const percentConsumed = Math.min(100, (totals.calories / dailyTarget) * 100);
  
  // Group logs by Meal Type
  const logsByType = useMemo(() => {
    const grouped: Record<string, MealLog[]> = {
      [MealType.BREAKFAST]: [],
      [MealType.LUNCH]: [],
      [MealType.DINNER]: [],
      [MealType.SNACK]: [],
    };
    todaysLogs.forEach(log => {
      if (grouped[log.type]) {
        grouped[log.type].push(log);
      }
    });
    return grouped;
  }, [todaysLogs]);

  // Helper to get total calories for a meal section
  const getSectionCalories = (type: string) => {
    return logsByType[type]?.reduce((sum, log) => sum + log.totalCalories, 0) || 0;
  };

  const getDayName = (date: Date) => {
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    return `星期${days[date.getDay()]}`;
  };

  const renderMacroCard = (
    label: string, 
    value: number, 
    target: number, 
    unit: string, 
    color: 'purple' | 'blue' | 'orange', 
    Icon: React.ElementType
  ) => {
    const percent = Math.min(100, (value / target) * 100);
    
    const colors = {
      purple: { bg: 'bg-purple-50', text: 'text-purple-600', bar: 'bg-purple-500', iconBg: 'bg-purple-100' },
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', bar: 'bg-blue-500', iconBg: 'bg-blue-100' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-600', bar: 'bg-orange-500', iconBg: 'bg-orange-100' }
    };
    
    const theme = colors[color];

    return (
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex flex-col justify-between h-32">
        <div className="flex justify-between items-start">
          <span className="text-xs font-bold text-gray-500">{label}</span>
          <div className={`p-1 rounded-full ${theme.iconBg} ${theme.text}`}>
             <Icon className="w-3 h-3" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-1 mb-1">
             <span className="text-xl font-extrabold text-gray-900">{Math.round(value)}</span>
             <span className="text-xs text-gray-400 font-bold">{unit}</span>
          </div>
          <div className="text-[10px] text-gray-300 font-bold mb-2">/ {target}{unit}</div>
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
             <div className={`h-full ${theme.bar} rounded-full transition-all duration-1000`} style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>
    );
  };

  const renderMealSection = (type: MealType, icon: React.ReactNode, iconBg: string, iconColor: string) => {
    const sectionLogs = logsByType[type] || [];
    const sectionCals = getSectionCalories(type);

    return (
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-50 mb-4">
         {/* Section Header */}
         <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
               <div className={`w-10 h-10 rounded-full ${iconBg} ${iconColor} flex items-center justify-center`}>
                  {icon}
               </div>
               <div>
                  <div className="font-bold text-gray-900">{type}</div>
                  <div className="text-xs text-gray-400 font-bold">{Math.round(sectionCals)} 千卡</div>
               </div>
            </div>
            
            <div className="flex gap-2">
               <button onClick={() => onLogFood('PHOTO', type)} className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full text-[10px] font-bold hover:bg-orange-100 transition-colors">
                  <ScanLine className="w-3 h-3" />
                  AI识别
               </button>
               <button onClick={() => onLogFood('SEARCH', type)} className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-full text-[10px] font-bold hover:bg-gray-100 transition-colors">
                  <PenTool className="w-3 h-3" />
                  快捷记录
               </button>
            </div>
         </div>

         {/* Items List */}
         <div className="space-y-4 pl-1">
            {sectionLogs.length === 0 ? (
               <div className="text-xs text-gray-300 font-medium pl-12 py-1">暂无记录</div>
            ) : (
               sectionLogs.map(log => (
                 <div key={log.id} className="flex items-center gap-3 pl-2">
                    {/* Item Image */}
                    {log.imageUrl ? (
                       <img src={log.imageUrl} className="w-12 h-12 rounded-xl object-cover bg-gray-100" alt="Food" />
                    ) : (
                       <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-xl">🍽️</div>
                    )}
                    
                    {/* Item Details */}
                    <div className="flex-1">
                       <div className="text-sm font-bold text-gray-900">{log.items.map(i => i.name).join(', ')}</div>
                       <div className="text-xs text-gray-400 font-medium mt-0.5">{Math.round(log.totalCalories)} 千卡</div>
                    </div>
                 </div>
               ))
            )}
         </div>
      </div>
    );
  };

  return (
    <div className="pb-32 pt-6 px-5 max-w-lg mx-auto bg-gray-50 min-h-screen font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm">
               {user.avatarUrl ? (
                   <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
               ) : (
                   <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      {user.name.charAt(0).toUpperCase()}
                   </div>
               )}
            </div>
            <div>
               <div className="text-[10px] text-gray-400 font-bold tracking-wide uppercase">你好, {user.name}</div>
               <div className="text-base font-extrabold text-gray-900">
                  {today.getMonth() + 1}月{today.getDate()}日, 今天
               </div>
            </div>
         </div>
         <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-700 shadow-sm border border-gray-100 hover:bg-gray-50">
            <Calendar className="w-5 h-5" />
         </button>
      </div>

      {/* Main Calorie Circle */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-100/50 mb-8 relative overflow-hidden text-center">
         {/* Simple Green Gradient Background Hint */}
         <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-green-50/50 to-transparent pointer-events-none"></div>

         <div className="relative w-80 h-80 mx-auto -my-4">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full" viewBox="0 0 192 192">
               {/* Track */}
               <circle cx="96" cy="96" r="80" stroke="#f0fdf4" strokeWidth="12" fill="transparent" />
               {/* Indicator - Using Green to match screenshot */}
               <circle 
                  cx="96" cy="96" r="80"
                  stroke="#4ade80"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={502} // 2 * PI * 80
                  strokeDashoffset={502 - (percentConsumed / 100) * 502}
                  strokeLinecap="round"
                  transform="rotate(-90 96 96)" 
                  className="transition-all duration-1000 ease-out"
               />
            </svg>
            
            {/* Inner Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
               <Flame className="w-8 h-8 text-green-500 mb-2" fill="currentColor" />
               <div className="text-6xl font-extrabold text-gray-900 tracking-tight">{Math.round(remainingCalories)}</div>
               <div className="text-sm text-gray-400 font-bold mt-1">剩余可摄入 (千卡)</div>
               <div className="mt-4 bg-green-50 text-green-600 px-4 py-2 rounded-full text-xs font-bold shadow-sm border border-green-100 flex flex-col items-center justify-center min-w-[140px]">
                  <div className="flex items-center gap-1 mb-0.5">
                     <span>总计可摄入卡数:</span>
                     <span className="text-sm font-extrabold">{dailyTarget}</span>
                  </div>
                  <div className="text-[10px] opacity-80 flex items-center gap-1">
                     <span>基础 {user.targetCalories}</span>
                     <span>+</span>
                     <span>运动 {totalBurned}</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Nutrition Cards Header */}
      <div className="flex justify-between items-end px-1 mb-4">
         <h3 className="font-extrabold text-lg text-gray-900">营养摄入</h3>
         <button className="text-green-500 text-xs font-bold hover:text-green-600 transition-colors">详情</button>
      </div>

      {/* Nutrition Cards Grid */}
      <div className="grid grid-cols-3 gap-3 mb-8">
         {renderMacroCard('蛋白质', totals.protein, user.targetProtein, '克', 'purple', Zap)}
         {renderMacroCard('碳水', totals.carbs, user.targetCarbs, '克', 'blue', Wheat)}
         {renderMacroCard('脂肪', totals.fat, user.targetFat, '克', 'orange', Droplets)}
      </div>

      {/* Daily Records Header */}
      <div className="mb-4 px-1">
         <h3 className="font-extrabold text-lg text-gray-900">今日记录</h3>
      </div>

      <div className="space-y-2">
         {renderMealSection(MealType.BREAKFAST, <div className="text-lg">☀️</div>, 'bg-orange-50', 'text-orange-500')}
         {renderMealSection(MealType.LUNCH, <div className="text-lg">🌤️</div>, 'bg-blue-50', 'text-blue-500')}
         {renderMealSection(MealType.DINNER, <div className="text-lg">🌙</div>, 'bg-indigo-50', 'text-indigo-500')}
         {renderMealSection(MealType.SNACK, <div className="text-lg">🍪</div>, 'bg-pink-50', 'text-pink-500')}
         
         {/* Exercise Section */}
         <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-50 mb-4">
            <div className="flex justify-between items-center mb-4">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                     <ScanLine className="w-5 h-5" />
                  </div>
                  <div>
                     <div className="font-bold text-gray-900">运动</div>
                     <div className="text-xs text-gray-400 font-bold">{totalBurned} 千卡</div>
                  </div>
               </div>
               <button 
                onClick={onLogExercise}
                className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
               >
                  <Plus className="w-5 h-5" />
               </button>
            </div>
            
            {/* Exercise Items */}
             <div className="space-y-4 pl-1">
               {todaysExercises.length === 0 ? (
                  <div className="text-xs text-gray-300 font-medium pl-12 py-1">暂无运动记录</div>
               ) : (
                  todaysExercises.map(ex => (
                    <div key={ex.id} className="flex items-center gap-3 pl-2">
                       <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-xl text-red-400">
                          {ex.type === '游泳' ? '🏊' : ex.type === '骑行' ? '🚴' : ex.type === '跑步' ? '🏃' : '🏋️'}
                       </div>
                       <div className="flex-1">
                          <div className="text-sm font-bold text-gray-900">{ex.type}</div>
                          <div className="text-xs text-gray-400 font-medium mt-0.5">{ex.duration} 分钟 · {ex.caloriesBurned} 千卡</div>
                       </div>
                    </div>
                  ))
               )}
            </div>
         </div>
      </div>

    </div>
  );
};