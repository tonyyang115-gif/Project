import React, { useState, useEffect } from 'react';
import { UserProfile, Gender, ActivityLevel, Goal, DietPreference, PRESET_AVATARS } from '../types';
import { Button } from './Button';
import { ChevronLeft, ArrowRight, Check, Info, Rocket, Minus, Plus, Armchair, Footprints, Dumbbell, Zap, Trophy, Flame, ShieldCheck } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: '',
    gender: Gender.MALE,
    age: 28,
    height: 175,
    weight: 68.5,
    targetWeight: 65.0,
    activityLevel: ActivityLevel.LIGHTLY_ACTIVE,
    goal: Goal.LOSE_WEIGHT,
    dietPreference: DietPreference.BALANCED
  });

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Helper to adjust weight/age/etc
  const adjustValue = (field: keyof UserProfile, amount: number) => {
    const current = formData[field] as number;
    handleInputChange(field, Number((current + amount).toFixed(1)));
  };

  const calculateResults = () => {
    const { gender, weight, height, age, activityLevel, goal, dietPreference } = formData as UserProfile;
    
    // Mifflin-St Jeor Equation
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    bmr += gender === Gender.MALE ? 5 : -161;

    let multiplier = 1.2;
    switch (activityLevel) {
      case ActivityLevel.SEDENTARY: multiplier = 1.2; break;
      case ActivityLevel.LIGHTLY_ACTIVE: multiplier = 1.375; break;
      case ActivityLevel.MODERATELY_ACTIVE: multiplier = 1.55; break;
      case ActivityLevel.VERY_ACTIVE: multiplier = 1.725; break;
      case ActivityLevel.EXTRA_ACTIVE: multiplier = 1.9; break;
    }

    const tdee = Math.round(bmr * multiplier);
    
    let targetCalories = tdee;
    if (goal === Goal.LOSE_WEIGHT) targetCalories -= 500;
    if (goal === Goal.GAIN_MUSCLE) targetCalories += 300;

    // Macro split based on Diet Preference
    let proteinRatio = 0.3;
    let fatRatio = 0.3;
    let carbsRatio = 0.4;

    if (dietPreference === DietPreference.LOW_CARB) {
        proteinRatio = 0.4; fatRatio = 0.4; carbsRatio = 0.2;
    } else if (dietPreference === DietPreference.HIGH_PROTEIN) {
        proteinRatio = 0.4; fatRatio = 0.3; carbsRatio = 0.3;
    } else if (dietPreference === DietPreference.VEGAN) {
        proteinRatio = 0.25; fatRatio = 0.25; carbsRatio = 0.5;
    }

    const targetProtein = Math.round((targetCalories * proteinRatio) / 4);
    const targetFat = Math.round((targetCalories * fatRatio) / 9);
    const targetCarbs = Math.round((targetCalories * carbsRatio) / 4);

    return { bmr: Math.round(bmr), tdee, targetCalories, targetProtein, targetFat, targetCarbs };
  };

  const handleFinish = () => {
    const stats = calculateResults();
    // Assign random default avatar
    const randomAvatar = PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)];
    onComplete({ ...formData, ...stats, avatarUrl: randomAvatar } as UserProfile);
  };

  // --- Render Functions (Not Components, to prevent focus loss) ---

  const renderHeader = () => (
    <div className="pt-6 pb-2 px-6 bg-white sticky top-0 z-10">
      <div className="relative flex items-center justify-center h-12 mb-2">
        {step > 0 && (
            <button 
                onClick={() => setStep(step - 1)}
                className="absolute left-0 p-2 -ml-2 text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>
        )}
        <h2 className="text-lg font-bold text-gray-900">基础档案设置</h2>
      </div>
      <div className="flex justify-between items-center text-xs font-bold text-gray-500 mb-2">
         <span>第 {step + 1} 步 / 共 3 步</span>
         <span className="text-blue-600">完成 {Math.round(((step + 1) / 3) * 100)}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
         <div 
           className="h-full bg-blue-600 rounded-full transition-all duration-500"
           style={{ width: `${((step + 1) / 3) * 100}%` }}
         />
      </div>
    </div>
  );

  const getActivityIcon = (levelStr: string) => {
    if (levelStr.includes('久坐')) return <Armchair className="w-5 h-5" />;
    if (levelStr.includes('轻度')) return <Footprints className="w-5 h-5" />;
    if (levelStr.includes('中度')) return <Dumbbell className="w-5 h-5" />;
    if (levelStr.includes('高度')) return <Zap className="w-5 h-5" />;
    if (levelStr.includes('极高')) return <Trophy className="w-5 h-5" />;
    return <Dumbbell className="w-5 h-5" />;
  };

  const renderStep1 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
       <div>
         <h1 className="text-2xl font-extrabold text-gray-900 mb-2">让我们了解一下您</h1>
         <p className="text-gray-500 text-sm">我们需要这些数据来准确计算您的个性化热量和营养目标。</p>
       </div>

       {/* Nickname */}
       <div>
         <label className="text-sm font-bold text-gray-900 mb-2 block">昵称</label>
         <input
            type="text"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-medium"
            placeholder="请输入您的昵称"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            autoFocus
         />
       </div>

       {/* Gender */}
       <div>
         <label className="text-sm font-bold text-gray-900 mb-3 block">性别</label>
         <div className="grid grid-cols-2 gap-4">
            {[Gender.MALE, Gender.FEMALE].map(g => (
                <button
                    key={g}
                    onClick={() => handleInputChange('gender', g)}
                    className={`h-32 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                        formData.gender === g 
                        ? 'border-blue-600 bg-blue-50' 
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                        formData.gender === g ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                        {g === Gender.MALE ? '♂' : '♀'}
                    </div>
                    <span className={`font-bold ${formData.gender === g ? 'text-blue-700' : 'text-gray-500'}`}>{g}</span>
                </button>
            ))}
         </div>
       </div>

       {/* Body Data */}
       <div>
          <h3 className="text-sm font-bold text-gray-900 mb-4">身体数据</h3>
          
          {/* Age */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center mb-4">
             <span className="font-medium text-gray-700">年龄</span>
             <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', Number(e.target.value))}
                  className="text-right text-2xl font-bold text-gray-900 w-20 outline-none border-b border-transparent focus:border-blue-500 transition-colors"
                />
                <span className="text-sm text-gray-400 font-bold">岁</span>
             </div>
          </div>

          {/* Height */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 mb-4">
             <div className="flex justify-between items-center mb-6">
                <span className="font-medium text-gray-700">身高</span>
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                   <span className="px-2 py-0.5 bg-white rounded-md text-xs font-bold shadow-sm">CM</span>
                   <span className="px-2 py-0.5 text-gray-400 text-xs font-bold">FT</span>
                </div>
             </div>
             <input 
                type="range" 
                min="100" max="230" 
                value={formData.height}
                onChange={(e) => handleInputChange('height', Number(e.target.value))}
                className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-4"
             />
             <div className="text-center">
                <span className="text-3xl font-extrabold text-gray-900">{formData.height}</span>
                <span className="text-sm text-gray-400 ml-1 font-bold">cm</span>
             </div>
          </div>

          {/* Weight */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100">
             <div className="flex justify-between items-center mb-6">
                <span className="font-medium text-gray-700">体重</span>
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                   <span className="px-2 py-0.5 text-gray-400 text-xs font-bold">LBS</span>
                   <span className="px-2 py-0.5 bg-white rounded-md text-xs font-bold shadow-sm">KG</span>
                </div>
             </div>
             <div className="flex justify-center items-center gap-6">
                <button onClick={() => adjustValue('weight', -0.5)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 text-gray-600 transition-colors"><Minus className="w-5 h-5"/></button>
                <div className="text-center w-32">
                    <span className="text-3xl font-extrabold text-gray-900">{formData.weight?.toFixed(1)}</span>
                    <span className="text-sm text-gray-400 ml-1 font-bold">kg</span>
                </div>
                <button onClick={() => adjustValue('weight', 0.5)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 text-gray-600 transition-colors"><Plus className="w-5 h-5"/></button>
             </div>
          </div>
       </div>

       {/* Activity Level */}
       <div>
         <h3 className="text-sm font-bold text-gray-900 mb-4">活动量</h3>
         <div className="space-y-3">
            {Object.values(ActivityLevel).map((level) => {
                const label = level.split(' ')[0];
                const desc = level.split(' ')[1]?.replace('(', '').replace(')', '') || '';
                const isSelected = formData.activityLevel === level;
                
                return (
                    <div 
                        key={level}
                        onClick={() => handleInputChange('activityLevel', level)}
                        className={`flex items-center p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                            isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-100 bg-white'
                        }`}
                    >
                        {/* Icon Container */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 flex-shrink-0 transition-colors ${
                            isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                           {getActivityIcon(level)}
                        </div>
                        
                        <div className="flex-1">
                            <div className={`font-bold text-sm ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>{label}</div>
                            <div className="text-xs text-gray-400">{desc}</div>
                        </div>
                        
                        {/* Selection Radio */}
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-200'}`}>
                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                        </div>
                    </div>
                );
            })}
         </div>
       </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
        <div>
         <h1 className="text-2xl font-extrabold text-gray-900 mb-2">您的目标是什么?</h1>
         <p className="text-gray-500 text-sm">我们将根据目标为您定制饮食计划。</p>
       </div>

       {/* Goal Cards */}
       <div className="space-y-4">
          {[
              { id: Goal.LOSE_WEIGHT, title: '减脂', desc: '消耗体脂，塑造紧致身形', icon: <Flame className="w-6 h-6" /> },
              { id: Goal.MAINTAIN, title: '保持', desc: '维持当前状态，保持健康', icon: <ShieldCheck className="w-6 h-6" /> },
              { id: Goal.GAIN_MUSCLE, title: '增肌', desc: '增加肌肉质量，提升体能', icon: <Dumbbell className="w-6 h-6" /> },
          ].map((item) => {
              const isSelected = formData.goal === item.id;
              return (
                <div 
                    key={item.id}
                    onClick={() => handleInputChange('goal', item.id)}
                    className={`flex items-center p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                        isSelected ? 'border-blue-600 bg-white shadow-md shadow-blue-50' : 'border-gray-100 bg-white'
                    }`}
                >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-4 transition-colors ${
                        isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                        {item.icon}
                    </div>
                    <div className="flex-1">
                        <div className="font-bold text-gray-900 text-lg">{item.title}</div>
                        <div className="text-xs text-gray-400 mt-1">{item.desc}</div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-blue-600' : 'border-gray-200'}`}>
                        {isSelected && <div className="w-3 h-3 rounded-full bg-blue-600" />}
                    </div>
                </div>
              );
          })}
       </div>

       {/* Target Weight */}
       <div>
         <h3 className="text-sm font-bold text-gray-900 mb-4">目标体重</h3>
         
         <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-8">
                <span className="text-xs text-gray-400 font-medium">当前: {formData.weight} kg</span>
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                   <span className="px-2 py-0.5 bg-white rounded-md text-xs font-bold shadow-sm">KG</span>
                   <span className="px-2 py-0.5 text-gray-400 text-xs font-bold">LBS</span>
                </div>
             </div>

             <div className="flex justify-center items-center gap-8 mb-6">
                <button onClick={() => adjustValue('targetWeight', -0.5)} className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-100 text-blue-600 transition-colors text-xl font-bold"><Minus className="w-6 h-6"/></button>
                <div className="text-center w-36">
                    <span className="text-4xl font-extrabold text-gray-900">{formData.targetWeight?.toFixed(1)}</span>
                    <span className="text-base text-gray-400 ml-1 font-bold">kg</span>
                </div>
                <button onClick={() => adjustValue('targetWeight', 0.5)} className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-100 text-blue-600 transition-colors text-xl font-bold"><Plus className="w-6 h-6"/></button>
             </div>

             <input 
                type="range" 
                min="40" max="150" step="0.5"
                value={formData.targetWeight}
                onChange={(e) => handleInputChange('targetWeight', Number(e.target.value))}
                className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
             />
         </div>
       </div>
    </div>
  );

  const renderStep3 = () => {
    const stats = calculateResults();
    
    return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
        <div>
         <h1 className="text-2xl font-extrabold text-gray-900 mb-2">您的饮食偏好?</h1>
         <p className="text-gray-500 text-sm">帮助我们更精准地推荐食物</p>
       </div>

       {/* Diet Grid */}
       <div className="grid grid-cols-2 gap-3">
          {[
              { id: DietPreference.VEGAN, title: '全素', sub: '不含动物性食品' },
              { id: DietPreference.LOW_CARB, title: '低碳水', sub: '控糖，高燃脂' },
              { id: DietPreference.HIGH_PROTEIN, title: '高蛋白', sub: '增肌必备选择' },
              { id: DietPreference.BALANCED, title: '均衡饮食', sub: '营养比例均衡' },
          ].map((item) => {
              const isSelected = formData.dietPreference === item.id;
              return (
                  <div
                    key={item.id}
                    onClick={() => handleInputChange('dietPreference', item.id)}
                    className={`p-4 rounded-2xl border-2 relative cursor-pointer transition-all ${
                        isSelected ? 'border-blue-600 bg-blue-50/50' : 'border-gray-100 bg-white'
                    }`}
                  >
                     <div className="font-bold text-gray-900 mb-1">{item.title}</div>
                     <div className="text-xs text-gray-400">{item.sub}</div>
                     {isSelected && (
                         <div className="absolute top-3 right-3 text-blue-600">
                             <Check className="w-4 h-4" />
                         </div>
                     )}
                  </div>
              )
          })}
       </div>

       {/* Results */}
       <div>
         <h3 className="text-sm font-bold text-gray-900 mb-4">您的初步计算结果</h3>
         <div className="flex gap-4">
             <div className="flex-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="text-xs text-gray-500 mb-2">BMR (基础代谢)</div>
                <div className="text-2xl font-extrabold text-blue-600 mb-1">{stats.bmr} <span className="text-xs text-gray-400 font-normal">kcal</span></div>
                <div className="text-[10px] text-gray-300">维持基本生命所需最低热量</div>
             </div>
             <div className="flex-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="text-xs text-gray-500 mb-2">TDEE (每日消耗)</div>
                <div className="text-2xl font-extrabold text-blue-600 mb-1">{stats.tdee} <span className="text-xs text-gray-400 font-normal">kcal</span></div>
                <div className="text-[10px] text-gray-300">考虑活动量后的每日总消耗量</div>
             </div>
         </div>
       </div>

       {/* AI Recommendation */}
       <div className="bg-blue-50 rounded-2xl p-4 flex gap-3 items-start border border-blue-100">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
              <div className="text-sm font-bold text-gray-900 mb-1">AI 建议目标</div>
              <p className="text-xs text-gray-600 leading-relaxed">
                  根据您的档案，若想达到平稳{formData.goal === Goal.LOSE_WEIGHT ? '减脂' : formData.goal === Goal.GAIN_MUSCLE ? '增肌' : '保持'}效果，
                  我们建议每日摄入量设为 <span className="font-bold text-blue-700">{stats.targetCalories} kcal</span>。
              </p>
          </div>
       </div>
    </div>
  )};

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans relative">
        {renderHeader()}
        
        <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-32 pt-4">
            {step === 0 && renderStep1()}
            {step === 1 && renderStep2()}
            {step === 2 && renderStep3()}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-50 max-w-lg mx-auto z-50">
            {step < 2 ? (
                <Button 
                    fullWidth 
                    size="lg" 
                    onClick={() => setStep(step + 1)}
                    disabled={step === 0 && !formData.name}
                    className="h-14 text-lg font-bold rounded-2xl shadow-xl shadow-blue-200 flex items-center justify-center gap-2"
                >
                   下一步 <ArrowRight className="w-5 h-5" />
                </Button>
            ) : (
                <Button 
                    fullWidth 
                    size="lg" 
                    onClick={handleFinish}
                    className="h-14 text-lg font-bold rounded-2xl shadow-xl shadow-blue-200 bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                   完成并开启健康之旅 <Rocket className="w-5 h-5" />
                </Button>
            )}
        </div>
    </div>
  );
};
