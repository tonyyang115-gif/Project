import React, { useState, useMemo } from 'react';
import { UserProfile, MealLog, ExerciseLog } from '../types';
import { ChevronLeft, ChevronRight, TrendingDown, ArrowDown, Flame, Zap } from 'lucide-react';

interface StatsProps {
  user: UserProfile;
  logs: MealLog[];
  exercises: ExerciseLog[];
}

export const Stats: React.FC<StatsProps> = ({ user, logs, exercises }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Helper to get logs for a specific date string (YYYY-MM-DD)
  const getLogsForDate = (dateStr: string) => logs.filter(l => l.date === dateStr);
  const getExercisesForDate = (dateStr: string) => exercises.filter(e => e.date === dateStr);

  // Calendar Logic
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay(); // 0 is Sunday

  const generateCalendarDays = () => {
    const days = [];
    // Empty slots for previous month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    // Days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
    }
    return days;
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const toDateString = (date: Date) => date.toISOString().split('T')[0];

  // Calculations for Selected Date
  const selectedDateStr = toDateString(selectedDate);
  const dailyLogs = getLogsForDate(selectedDateStr);
  const dailyExercises = getExercisesForDate(selectedDateStr);
  
  const dailyStats = useMemo(() => {
    return dailyLogs.reduce((acc, log) => {
      log.items.forEach(item => {
        acc.calories += item.calories;
        acc.protein += item.protein;
        acc.carbs += item.carbs;
        acc.fat += item.fat;
      });
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [dailyLogs]);

  const dailyBurned = useMemo(() => {
    return dailyExercises.reduce((sum, ex) => sum + ex.caloriesBurned, 0);
  }, [dailyExercises]);

  // Target = Base + Burned
  const dailyTarget = user.targetCalories + dailyBurned;
  const remaining = Math.max(0, dailyTarget - dailyStats.calories);
  const percent = dailyTarget > 0 ? Math.min(100, (dailyStats.calories / dailyTarget) * 100) : 0;
  const isOver = dailyStats.calories > dailyTarget;

  // Calculations for Monthly Overview
  const monthlyStats = useMemo(() => {
     const monthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
     const monthLogs = logs.filter(l => l.date.startsWith(monthStr));
     
     // Get unique days logged
     const loggedDays = new Set(monthLogs.map(l => l.date)).size;
     
     const totalCals = monthLogs.reduce((acc, log) => acc + log.totalCalories, 0);
     const avgCals = loggedDays > 0 ? Math.round(totalCals / loggedDays) : 0;

     return { avgCals, loggedDays };
  }, [currentMonth, logs]);


  return (
    <div className="min-h-screen bg-gray-50 pb-32 pt-6 font-sans">
      {/* Header */}
      <div className="relative flex items-center justify-center px-6 mb-6">
        <h1 className="text-xl font-extrabold text-gray-900">数据统计</h1>
      </div>

      <div className="px-5 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Calendar Card */}
        <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-gray-100">
          {/* Month Navigator */}
          <div className="flex items-center justify-between mb-6">
             <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-50 rounded-full text-gray-400">
                <ChevronLeft className="w-5 h-5" />
             </button>
             <span className="text-base font-extrabold text-gray-900">
                {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
             </span>
             <button onClick={handleNextMonth} className="p-1 hover:bg-gray-50 rounded-full text-gray-400">
                <ChevronRight className="w-5 h-5" />
             </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 mb-4">
            {weekDays.map(day => (
                <div key={day} className="text-center text-xs font-bold text-gray-300">
                    {day}
                </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-y-4">
            {calendarDays.map((date, index) => {
                if (!date) return <div key={`empty-${index}`}></div>;
                
                const dateStr = toDateString(date);
                const hasLog = logs.some(l => l.date === dateStr);
                const isSelected = isSameDay(date, selectedDate);
                const isToday = isSameDay(date, new Date());

                return (
                    <div key={dateStr} className="flex flex-col items-center justify-center gap-1 cursor-pointer" onClick={() => setSelectedDate(date)}>
                        <div className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold transition-all ${
                            isSelected 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110' 
                                : isToday 
                                    ? 'text-blue-600 bg-blue-50'
                                    : 'text-gray-700 hover:bg-gray-50'
                        }`}>
                            {date.getDate()}
                        </div>
                        {/* Dot indicator for logged days */}
                        <div className={`w-1 h-1 rounded-full ${hasLog && !isSelected ? 'bg-orange-400' : 'bg-transparent'}`}></div>
                    </div>
                );
            })}
          </div>
        </div>

        {/* Monthly Overview */}
        <div>
           <h3 className="text-base font-extrabold text-gray-900 mb-4">月度概览</h3>
           <div className="flex gap-4">
              <div className="flex-1 bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
                  <div className="text-xs text-gray-400 font-bold mb-2">平均每日摄入</div>
                  <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-2xl font-extrabold text-gray-900">{monthlyStats.avgCals}</span>
                      <span className="text-xs text-gray-400 font-bold">kcal</span>
                  </div>
                  {monthlyStats.avgCals > 0 && (
                     <div className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                        <ArrowDown className="w-3 h-3" />
                        <span>5% 比上月</span>
                     </div>
                  )}
              </div>
              <div className="flex-1 bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
                  <div className="text-xs text-gray-400 font-bold mb-2">体重趋势</div>
                  <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-2xl font-extrabold text-gray-900">-1.2</span>
                      <span className="text-xs text-gray-400 font-bold">kg</span>
                  </div>
                  <div className="inline-flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full">
                    <TrendingDown className="w-3 h-3" />
                    <span>保持良好</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Daily Detail */}
        <div>
           <h3 className="text-base font-extrabold text-gray-900 mb-4">
             {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日详情
           </h3>
           <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-gray-100 border border-gray-50">
               
               {/* Calories Header - Redesigned to show Base + Exercise */}
               <div className="mb-6">
                 <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="text-xs font-bold text-gray-400 mb-1 flex items-center gap-1">
                            今日摄入
                            {isOver && <Flame className="w-3 h-3 text-red-500" />}
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-3xl font-extrabold ${isOver ? 'text-red-500' : 'text-blue-600'}`}>
                                {Math.round(dailyStats.calories)}
                            </span>
                            <span className="text-sm font-bold text-gray-300">kcal</span>
                        </div>
                    </div>
                    
                    <div className="text-right">
                        <div className="text-xs font-bold text-gray-400 mb-1">总计可摄入</div>
                        <div className="flex items-baseline justify-end gap-1">
                            <span className="text-xl font-extrabold text-gray-900">{dailyTarget}</span>
                            <span className="text-xs font-bold text-gray-300">kcal</span>
                        </div>
                         <div className="flex items-center justify-end gap-1 text-[10px] text-gray-400 font-bold mt-1 bg-gray-50 px-2 py-1 rounded-lg">
                            <span>基础 {user.targetCalories}</span>
                            <span className="text-gray-300">+</span>
                            <span className="flex items-center gap-0.5 text-green-600">
                                <Zap className="w-2.5 h-2.5" /> 
                                {dailyBurned}
                            </span>
                        </div>
                    </div>
                 </div>

                 {/* Progress Bar */}
                 <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div 
                        className={`h-full rounded-full transition-all duration-1000 ${isOver ? 'bg-red-500' : 'bg-blue-600'}`}
                        style={{ width: `${percent}%` }}
                    />
                 </div>
                 
                 <div className="flex justify-between items-center">
                    <div className="text-[10px] text-gray-400 font-bold">
                        进度 {Math.round(percent)}%
                    </div>
                    <div className={`text-[10px] font-bold px-2 py-1 rounded-lg ${isOver ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                        {isOver ? '已超标' : '剩余'} {Math.round(remaining)} kcal
                    </div>
                 </div>
               </div>

               {/* Macro Cards */}
               <div className="grid grid-cols-3 gap-3">
                   {/* Carbs */}
                   <div className="bg-gray-50 rounded-2xl p-3 text-center">
                       <div className="text-xs text-gray-400 font-bold mb-1">碳水</div>
                       <div className="text-lg font-extrabold text-gray-900 mb-0.5">{Math.round(dailyStats.carbs)}g</div>
                       <div className="text-[10px] text-gray-300 font-bold">
                           {dailyStats.calories > 0 ? Math.round((dailyStats.carbs * 4 / dailyStats.calories) * 100) : 0}%
                       </div>
                   </div>

                   {/* Protein */}
                   <div className="bg-gray-50 rounded-2xl p-3 text-center">
                       <div className="text-xs text-gray-400 font-bold mb-1">蛋白质</div>
                       <div className="text-lg font-extrabold text-gray-900 mb-0.5">{Math.round(dailyStats.protein)}g</div>
                       <div className="text-[10px] text-gray-300 font-bold">
                           {dailyStats.calories > 0 ? Math.round((dailyStats.protein * 4 / dailyStats.calories) * 100) : 0}%
                       </div>
                   </div>

                   {/* Fat */}
                   <div className="bg-gray-50 rounded-2xl p-3 text-center">
                       <div className="text-xs text-gray-400 font-bold mb-1">脂肪</div>
                       <div className="text-lg font-extrabold text-gray-900 mb-0.5">{Math.round(dailyStats.fat)}g</div>
                       <div className="text-[10px] text-gray-300 font-bold">
                           {dailyStats.calories > 0 ? Math.round((dailyStats.fat * 9 / dailyStats.calories) * 100) : 0}%
                       </div>
                   </div>
               </div>
           </div>
        </div>

      </div>
    </div>
  );
};