
import React, { useState, useEffect } from 'react';
import { ExerciseLog } from '../types';
import { 
  X, Flame, Check, Dumbbell, Footprints, Bike, Waves, Zap, Timer, 
  Leaf, Mountain, Music, Trophy, Activity, HelpCircle,
  Wind, Target, CircleDot, RefreshCw
} from 'lucide-react';

interface ExerciseLoggerProps {
  onSave: (log: ExerciseLog) => void;
  onCancel: () => void;
  userWeight: number;
}

// MET values for estimation
const EXERCISE_TYPES = [
  { id: 'walking', name: '散步', met: 3.5, icon: <Footprints className="w-6 h-6" /> },
  { id: 'running', name: '跑步', met: 8.0, icon: <Zap className="w-6 h-6" /> },
  { id: 'cycling', name: '骑行', met: 6.0, icon: <Bike className="w-6 h-6" /> },
  { id: 'swimming', name: '游泳', met: 7.0, icon: <Waves className="w-6 h-6" /> },
  { id: 'strength', name: '力量训练', met: 4.0, icon: <Dumbbell className="w-6 h-6" /> },
  { id: 'hiit', name: 'HIIT', met: 9.0, icon: <Flame className="w-6 h-6" /> },
  { id: 'yoga', name: '瑜伽', met: 3.0, icon: <Leaf className="w-6 h-6" /> },
  { id: 'pilates', name: '普拉提', met: 3.5, icon: <Activity className="w-6 h-6" /> },
  { id: 'hiking', name: '登山', met: 6.5, icon: <Mountain className="w-6 h-6" /> },
  { id: 'jumprope', name: '跳绳', met: 10.0, icon: <Activity className="w-6 h-6" /> },
  { id: 'basketball', name: '篮球', met: 6.5, icon: <Trophy className="w-6 h-6" /> },
  { id: 'football', name: '足球', met: 7.0, icon: <Trophy className="w-6 h-6" /> },
  { id: 'badminton', name: '羽毛球', met: 5.5, icon: <Wind className="w-6 h-6" /> },
  { id: 'tennis', name: '网球', met: 7.0, icon: <Target className="w-6 h-6" /> },
  { id: 'pingpong', name: '乒乓球', met: 4.0, icon: <CircleDot className="w-6 h-6" /> },
  { id: 'elliptical', name: '椭圆机', met: 5.0, icon: <RefreshCw className="w-6 h-6" /> },
  { id: 'rowing', name: '划船机', met: 7.0, icon: <Waves className="w-6 h-6" /> },
  { id: 'aerobics', name: '有氧操', met: 6.5, icon: <Music className="w-6 h-6" /> },
  { id: 'dancing', name: '舞蹈', met: 5.0, icon: <Music className="w-6 h-6" /> },
  { id: 'other', name: '其他', met: 4.0, icon: <HelpCircle className="w-6 h-6" /> },
];

const generateId = () => Math.random().toString(36).substr(2, 9);

export const ExerciseLogger: React.FC<ExerciseLoggerProps> = ({ onSave, onCancel, userWeight }) => {
  const [selectedType, setSelectedType] = useState(EXERCISE_TYPES[1]); // Default to Running
  const [duration, setDuration] = useState<number>(30); // minutes
  const [calories, setCalories] = useState<number>(0);

  // Auto-calculate calories when type or duration changes
  useEffect(() => {
    // Formula: Calories = MET * Weight (kg) * Duration (hours)
    const hours = duration / 60;
    const estimated = Math.round(selectedType.met * userWeight * hours);
    setCalories(estimated);
  }, [selectedType, duration, userWeight]);

  const handleSave = () => {
    const newLog: ExerciseLog = {
      id: generateId(),
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      type: selectedType.name,
      duration: duration,
      caloriesBurned: calories
    };
    onSave(newLog);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300 pointer-events-auto"
        onClick={onCancel}
      />

      {/* Sheet Container */}
      <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] h-auto flex flex-col relative z-10 shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-hidden pointer-events-auto pb-8">
        
        {/* Drag Handle Indicator */}
        <div className="w-full flex justify-center pt-3 pb-1" onClick={onCancel}>
            <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <button onClick={onCancel} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
             取消
          </button>
          <h2 className="text-lg font-bold text-gray-900">记录运动</h2>
          <button 
            onClick={handleSave} 
            className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors"
          >
            保存
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          
          {/* Exercise Types Grid */}
          <div className="grid grid-cols-4 gap-2 mb-8 sm:grid-cols-3 sm:gap-3">
            {EXERCISE_TYPES.map((type) => {
              const isSelected = selectedType.id === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all hover:shadow-md ${
                    isSelected 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-gray-100 bg-white hover:border-blue-200'
                  }`}
                >
                  <div className={`mb-1.5 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                    {type.icon}
                  </div>
                  <span className={`text-xs font-bold whitespace-nowrap ${isSelected ? 'text-blue-900' : 'text-gray-600'}`}>
                    {type.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Inputs */}
          <div className="space-y-6">
            
            {/* Duration Input */}
            <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                     <Timer className="w-5 h-5 text-gray-400" />
                     <span className="font-bold text-gray-700">时长 (分钟)</span>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="5" max="180" step="5"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="w-20 text-right">
                     <span className="text-2xl font-extrabold text-gray-900">{duration}</span>
                     <span className="text-xs text-gray-400 font-bold ml-1">min</span>
                  </div>
               </div>
            </div>

            {/* Calories Input (Override) */}
            <div className="bg-orange-50 p-5 rounded-3xl border border-orange-100">
               <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                     <Flame className="w-5 h-5 text-orange-500" />
                     <span className="font-bold text-orange-900">消耗热量 (千卡)</span>
                  </div>
                  <span className="text-xs text-orange-400 font-bold bg-white/50 px-2 py-1 rounded-lg">可手动修改</span>
               </div>
               <div className="flex items-center justify-center">
                  <input 
                    type="number" 
                    value={calories}
                    onChange={(e) => setCalories(Number(e.target.value))}
                    className="w-full text-center text-4xl font-extrabold text-orange-600 bg-transparent outline-none focus:border-b-2 focus:border-orange-300 transition-all pb-1"
                  />
               </div>
               <div className="text-center text-xs text-orange-400 mt-2 font-medium">
                  基于体重 ({userWeight}kg) 和 {selectedType.name} MET值估算
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
