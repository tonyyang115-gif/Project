
import React, { useState, useRef } from 'react';
import { UserProfile, Gender, Goal, ActivityLevel, DietPreference, UserNotifications, NotificationConfig, PRESET_AVATARS, AiProvider } from '../types';
import { ChevronRight, User, Heart, Bell, HelpCircle, UserCircle2, Edit2, Activity, TrendingUp, Target, ChevronLeft, Minus, Plus, MessageSquare, BookOpen, ToggleLeft, ToggleRight, Check, Flame, Camera, BrainCircuit, Cpu } from 'lucide-react';

interface ProfileProps {
  user: UserProfile;
  onUpdateUser?: (user: UserProfile) => void;
}

type ProfileSubPage = 'MAIN' | 'PERSONAL' | 'NUTRITION' | 'NOTIFICATIONS' | 'HELP' | 'AI_SETTINGS';

// --- Personal Profile Subpage ---
const PersonalProfile: React.FC<{ user: UserProfile, onUpdate?: (user: UserProfile) => void, onBack: () => void }> = ({ user, onUpdate, onBack }) => {
    // Local state for editing
    const [name, setName] = useState(user.name);
    const [age, setAge] = useState(user.age);
    const [height, setHeight] = useState(user.height);
    const [gender, setGender] = useState(user.gender);
    const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        if (onUpdate) {
            onUpdate({
                ...user,
                name,
                age,
                height,
                gender,
                avatarUrl
            });
        }
        onBack();
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-10 pt-6 font-sans animate-in slide-in-from-right duration-300">
             <div className="relative flex items-center justify-center px-6 mb-6">
                <button onClick={onBack} className="absolute left-6 p-2 -ml-2 rounded-full hover:bg-white hover:shadow-sm text-gray-700 transition-all"><ChevronLeft className="w-6 h-6" /></button>
                <h1 className="text-xl font-extrabold text-gray-900">个人资料</h1>
                <button onClick={handleSave} className="absolute right-6 text-sm font-bold text-blue-600">保存</button>
            </div>
            
            <div className="px-5 space-y-6">
                 {/* Avatar */}
                 <div className="flex flex-col items-center justify-center pt-2">
                     <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-bold border-4 border-white shadow-md relative mb-3 cursor-pointer overflow-hidden group"
                     >
                         {avatarUrl ? (
                             <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                         ) : (
                             name.charAt(0)
                         )}
                         <div className="absolute bottom-0 right-0 p-2 bg-gray-900 text-white rounded-full border-4 border-white z-10">
                             <Edit2 className="w-3 h-3" />
                         </div>
                         {/* Hover overlay for image hint */}
                         <div className="absolute inset-0 bg-black/30 hidden group-hover:flex items-center justify-center transition-all">
                             <Camera className="w-8 h-8 text-white opacity-80" />
                         </div>
                     </div>
                     <p className="text-xs text-gray-400 font-medium mb-4">点击修改头像</p>
                     
                     {/* Preset Avatars */}
                     <div className="w-full px-2">
                         <div className="text-xs font-bold text-gray-400 uppercase mb-3 ml-2">推荐头像</div>
                         <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-1">
                             {PRESET_AVATARS.map((url, idx) => (
                                 <button 
                                    key={idx}
                                    onClick={() => setAvatarUrl(url)}
                                    className={`relative w-12 h-12 flex-shrink-0 rounded-full overflow-hidden border-2 transition-all ${avatarUrl === url ? 'border-blue-600 scale-110 shadow-md ring-2 ring-blue-100' : 'border-white opacity-70 hover:opacity-100 hover:scale-105'}`}
                                 >
                                     <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                                     {avatarUrl === url && (
                                         <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                                             <Check className="w-4 h-4 text-white drop-shadow-md" strokeWidth={3} />
                                         </div>
                                     )}
                                 </button>
                             ))}
                         </div>
                     </div>

                     <input 
                        ref={fileInputRef} 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileChange} 
                     />
                 </div>

                 {/* Form Fields */}
                 <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-gray-50 space-y-1">
                     <div className="flex items-center justify-between p-4 border-b border-gray-50">
                         <span className="text-sm font-bold text-gray-700">昵称</span>
                         <input value={name} onChange={e => setName(e.target.value)} className="text-right text-sm font-medium text-gray-900 outline-none" />
                     </div>
                     <div className="flex items-center justify-between p-4 border-b border-gray-50">
                         <span className="text-sm font-bold text-gray-700">性别</span>
                         <div className="flex bg-gray-100 rounded-lg p-0.5">
                             <button onClick={() => setGender(Gender.MALE)} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${gender === Gender.MALE ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}>男</button>
                             <button onClick={() => setGender(Gender.FEMALE)} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${gender === Gender.FEMALE ? 'bg-white shadow text-pink-600' : 'text-gray-400'}`}>女</button>
                         </div>
                     </div>
                     <div className="flex items-center justify-between p-4">
                         <span className="text-sm font-bold text-gray-700">年龄</span>
                         <div className="flex items-center gap-3">
                             <button onClick={() => setAge(a => a - 1)} className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center"><Minus className="w-3 h-3 text-gray-500" /></button>
                             <span className="text-sm font-bold w-4 text-center">{age}</span>
                             <button onClick={() => setAge(a => a + 1)} className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center"><Plus className="w-3 h-3 text-gray-500" /></button>
                         </div>
                     </div>
                 </div>

                  <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-gray-50">
                     <div className="flex items-center justify-between p-4">
                         <span className="text-sm font-bold text-gray-700">身高 (cm)</span>
                         <div className="flex items-center gap-3">
                              <button onClick={() => setHeight(h => h - 1)} className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center"><Minus className="w-3 h-3 text-gray-500" /></button>
                             <span className="text-sm font-bold w-8 text-center">{height}</span>
                             <button onClick={() => setHeight(h => h + 1)} className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center"><Plus className="w-3 h-3 text-gray-500" /></button>
                         </div>
                     </div>
                 </div>
            </div>
        </div>
    );
};

// --- Nutrition Goals Subpage ---
const NutritionGoals: React.FC<{ user: UserProfile, onUpdateUser?: (user: UserProfile) => void, onBack: () => void }> = ({ user, onUpdateUser, onBack }) => {
    const [targetWeight, setTargetWeight] = useState(user.targetWeight);
    const [goal, setGoal] = useState(user.goal);
    const [diet, setDiet] = useState(user.dietPreference);
    const [customCalories, setCustomCalories] = useState(user.targetCalories);

    const handleSave = () => {
        if (onUpdateUser) {
            // Recalculate Macros based on new calories and diet preference
            let proteinRatio = 0.3;
            let fatRatio = 0.3;
            let carbsRatio = 0.4;

            if (diet === DietPreference.LOW_CARB) {
                proteinRatio = 0.4; fatRatio = 0.4; carbsRatio = 0.2;
            } else if (diet === DietPreference.HIGH_PROTEIN) {
                proteinRatio = 0.4; fatRatio = 0.3; carbsRatio = 0.3;
            } else if (diet === DietPreference.VEGAN) {
                proteinRatio = 0.25; fatRatio = 0.25; carbsRatio = 0.5;
            }

            const targetProtein = Math.round((customCalories * proteinRatio) / 4);
            const targetFat = Math.round((customCalories * fatRatio) / 9);
            const targetCarbs = Math.round((customCalories * carbsRatio) / 4);

            onUpdateUser({
                ...user,
                targetWeight,
                goal,
                dietPreference: diet,
                targetCalories: customCalories,
                targetProtein,
                targetFat,
                targetCarbs
            });
        }
        onBack();
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-10 pt-6 font-sans animate-in slide-in-from-right duration-300">
             <div className="relative flex items-center justify-center px-6 mb-6">
                <button onClick={onBack} className="absolute left-6 p-2 -ml-2 rounded-full hover:bg-white hover:shadow-sm text-gray-700 transition-all"><ChevronLeft className="w-6 h-6" /></button>
                <h1 className="text-xl font-extrabold text-gray-900">营养目标</h1>
                <button onClick={handleSave} className="absolute right-6 text-sm font-bold text-blue-600">保存</button>
            </div>

            <div className="px-5 space-y-6">
                {/* Target Weight Card */}
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-50 text-center">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">目标体重</span>
                    <div className="my-4 flex items-center justify-center gap-6">
                         <button onClick={() => setTargetWeight(w => w - 0.5)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-blue-50 hover:text-blue-500 transition-colors"><Minus className="w-5 h-5" /></button>
                         <div className="text-4xl font-extrabold text-gray-900">{targetWeight.toFixed(1)} <span className="text-sm text-gray-400">kg</span></div>
                         <button onClick={() => setTargetWeight(w => w + 0.5)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-blue-50 hover:text-blue-500 transition-colors"><Plus className="w-5 h-5" /></button>
                    </div>
                </div>

                {/* Goal Selector */}
                <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-3 px-2">主要目标</h3>
                    <div className="grid grid-cols-3 gap-3">
                        {[Goal.LOSE_WEIGHT, Goal.MAINTAIN, Goal.GAIN_MUSCLE].map(g => (
                            <button 
                                key={g}
                                onClick={() => setGoal(g)}
                                className={`py-3 px-2 rounded-xl text-xs font-bold border-2 transition-all ${goal === g ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-white bg-white text-gray-500'}`}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Diet Selector */}
                 <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-3 px-2">饮食偏好</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {Object.values(DietPreference).map(d => (
                             <button 
                                key={d}
                                onClick={() => setDiet(d)}
                                className={`py-4 px-4 rounded-xl text-left border-2 transition-all relative ${diet === d ? 'border-blue-600 bg-blue-50' : 'border-white bg-white'}`}
                            >
                                <div className={`text-sm font-bold mb-1 ${diet === d ? 'text-blue-900' : 'text-gray-900'}`}>{d}</div>
                                {diet === d && <div className="absolute top-3 right-3 text-blue-600"><Check className="w-4 h-4" /></div>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Calorie Override */}
                 <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-50">
                    <div className="flex justify-between items-center mb-2">
                         <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                             <Flame className="w-4 h-4 text-orange-500" />
                             自定义热量目标
                         </div>
                    </div>
                    <div className="relative">
                         <input 
                            type="number"
                            value={customCalories}
                            onChange={(e) => setCustomCalories(Number(e.target.value))}
                            className="w-full bg-gray-50 rounded-xl px-4 py-3 text-xl font-extrabold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                         />
                         <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">kcal</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 ml-1">根据您的资料建议: {user.targetCalories} kcal</p>
                 </div>
            </div>
        </div>
    );
};

// --- Notifications Subpage ---
const NotificationSettings: React.FC<{ user: UserProfile, onUpdateUser?: (u: UserProfile) => void, onBack: () => void }> = ({ user, onUpdateUser, onBack }) => {
    // ... same as before
    const defaultSettings: UserNotifications = {
        breakfast: { enabled: false, time: '08:00' },
        lunch: { enabled: false, time: '12:00' },
        dinner: { enabled: false, time: '18:00' },
        snack: { enabled: false, time: '15:00' },
        water: { enabled: false, time: '10:00' },
        weight: { enabled: false, time: '09:00' },
    };

    const notifications = user.notifications || defaultSettings;

    const handleToggle = (key: keyof UserNotifications) => {
        if (!onUpdateUser) return;
        const newSettings = { ...notifications, [key]: { ...notifications[key], enabled: !notifications[key].enabled } };
        onUpdateUser({ ...user, notifications: newSettings });
    };

    const handleTimeChange = (key: keyof UserNotifications, newTime: string) => {
        if (!onUpdateUser) return;
        const newSettings = { ...notifications, [key]: { ...notifications[key], time: newTime } };
        onUpdateUser({ ...user, notifications: newSettings });
    };

    const ToggleItem = ({ label, itemKey }: { label: string, itemKey: keyof UserNotifications }) => {
        const config = notifications[itemKey];
        return (
            <div className="flex items-center justify-between p-4">
                <div className="flex-1">
                    <div className="font-bold text-gray-900 text-sm mb-1">{label}</div>
                    <div className="relative">
                         <input 
                            type="time" 
                            value={config.time}
                            disabled={!config.enabled}
                            onChange={(e) => handleTimeChange(itemKey, e.target.value)}
                            className={`bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:border-blue-500 transition-colors ${!config.enabled ? 'opacity-50' : ''}`}
                         />
                    </div>
                </div>
                <button onClick={() => handleToggle(itemKey)} className={`transition-colors ml-4 ${config.enabled ? 'text-blue-600' : 'text-gray-300'}`}>
                    {config.enabled ? <ToggleRight className="w-10 h-10 fill-current" /> : <ToggleLeft className="w-10 h-10" />}
                </button>
            </div>
        )
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 pt-6 font-sans animate-in slide-in-from-right duration-300">
             <div className="relative flex items-center justify-center px-6 mb-6">
                <button onClick={onBack} className="absolute left-6 p-2 -ml-2 rounded-full hover:bg-white hover:shadow-sm text-gray-700 transition-all"><ChevronLeft className="w-6 h-6" /></button>
                <h1 className="text-xl font-extrabold text-gray-900">提醒通知</h1>
            </div>

            <div className="px-5 space-y-4">
                <div className="space-y-2">
                    <h3 className="text-xs font-bold text-gray-400 uppercase ml-2">用餐记录提醒</h3>
                    <div className="bg-white rounded-[2rem] px-2 py-2 shadow-sm border border-gray-50 divide-y divide-gray-50">
                        <ToggleItem label="早餐" itemKey="breakfast" />
                        <ToggleItem label="午餐" itemKey="lunch" />
                        <ToggleItem label="晚餐" itemKey="dinner" />
                        <ToggleItem label="加餐" itemKey="snack" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-xs font-bold text-gray-400 uppercase ml-2">日常提醒</h3>
                    <div className="bg-white rounded-[2rem] px-2 py-2 shadow-sm border border-gray-50 divide-y divide-gray-50">
                        <ToggleItem label="喝水提醒" itemKey="water" />
                        <ToggleItem label="体重记录" itemKey="weight" />
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- AI Settings Subpage ---
const AiSettings: React.FC<{ user: UserProfile, onUpdateUser?: (u: UserProfile) => void, onBack: () => void }> = ({ user, onUpdateUser, onBack }) => {
    const provider = user.aiProvider || 'GEMINI';

    const handleSelect = (p: AiProvider) => {
        if (onUpdateUser) {
            onUpdateUser({ ...user, aiProvider: p });
            // Also save to localStorage directly for service access
            localStorage.setItem('snapcal_ai_provider', p);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-10 pt-6 font-sans animate-in slide-in-from-right duration-300">
             <div className="relative flex items-center justify-center px-6 mb-6">
                <button onClick={onBack} className="absolute left-6 p-2 -ml-2 rounded-full hover:bg-white hover:shadow-sm text-gray-700 transition-all"><ChevronLeft className="w-6 h-6" /></button>
                <h1 className="text-xl font-extrabold text-gray-900">AI 模型设置</h1>
            </div>

            <div className="px-5 space-y-6">
                <div className="bg-blue-50 rounded-2xl p-4 flex gap-3 items-start border border-blue-100">
                    <BrainCircuit className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <div className="text-sm font-bold text-gray-900 mb-1">选择您的智能助手</div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                            不同的模型在处理图片和营养分析时可能有所差异。您可以根据实际体验选择最适合的模型。
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                     {/* Gemini */}
                     <div 
                        onClick={() => handleSelect('GEMINI')}
                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${provider === 'GEMINI' ? 'border-blue-600 bg-white shadow-md' : 'border-gray-100 bg-white'}`}
                     >
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${provider === 'GEMINI' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                    <Cpu className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="font-extrabold text-gray-900">Google Gemini</div>
                                    <div className="text-xs text-gray-400 font-medium">默认模型，分析全面</div>
                                </div>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${provider === 'GEMINI' ? 'border-blue-600' : 'border-gray-200'}`}>
                                {provider === 'GEMINI' && <div className="w-3 h-3 rounded-full bg-blue-600" />}
                            </div>
                        </div>
                     </div>

                     {/* Qwen */}
                     <div 
                        onClick={() => handleSelect('QWEN')}
                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${provider === 'QWEN' ? 'border-blue-600 bg-white shadow-md' : 'border-gray-100 bg-white'}`}
                     >
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${provider === 'QWEN' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'}`}>
                                    <BrainCircuit className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="font-extrabold text-gray-900">Aliyun Qwen</div>
                                    <div className="text-xs text-gray-400 font-medium">通义千问，懂中文更懂你</div>
                                </div>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${provider === 'QWEN' ? 'border-blue-600' : 'border-gray-200'}`}>
                                {provider === 'QWEN' && <div className="w-3 h-3 rounded-full bg-blue-600" />}
                            </div>
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
}

// --- Help & Feedback Subpage ---
const HelpFeedback: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-gray-50 pb-10 pt-6 font-sans animate-in slide-in-from-right duration-300">
             <div className="relative flex items-center justify-center px-6 mb-6">
                <button onClick={onBack} className="absolute left-6 p-2 -ml-2 rounded-full hover:bg-white hover:shadow-sm text-gray-700 transition-all"><ChevronLeft className="w-6 h-6" /></button>
                <h1 className="text-xl font-extrabold text-gray-900">帮助与反馈</h1>
            </div>

            <div className="px-5 space-y-6">
                {/* FAQ */}
                <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-3 px-2 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-orange-500" /> 常见问题
                    </h3>
                    <div className="bg-white rounded-[2rem] px-4 py-2 shadow-sm border border-gray-50 divide-y divide-gray-50">
                        {['如何修改我的体重目标?', '食物识别不准确怎么办?', '如何连接健康设备?'].map((q, i) => (
                             <div key={i} className="py-4 flex justify-between items-center cursor-pointer group">
                                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">{q}</span>
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Feedback Form */}
                 <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-3 px-2 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-blue-500" /> 问题反馈
                    </h3>
                    <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-50">
                        <textarea 
                            className="w-full h-32 bg-gray-50 rounded-xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder-gray-400"
                            placeholder="请描述您遇到的问题或建议..."
                        ></textarea>
                        <button className="w-full mt-4 bg-gray-900 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-gray-200 hover:bg-black transition-colors">
                            提交反馈
                        </button>
                    </div>
                </div>
                
                 <div className="text-center py-6">
                    <p className="text-xs text-gray-300 font-bold">SnapCal v1.0.0</p>
                </div>
            </div>
        </div>
    );
};


// --- Main Profile Component ---
export const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser }) => {
  const [subPage, setSubPage] = useState<ProfileSubPage>('MAIN');

  // Calculate BMI
  const heightM = user.height / 100;
  const bmi = (user.weight / (heightM * heightM)).toFixed(1);

  if (subPage === 'PERSONAL') return <PersonalProfile user={user} onUpdate={onUpdateUser} onBack={() => setSubPage('MAIN')} />;
  if (subPage === 'NUTRITION') return <NutritionGoals user={user} onUpdateUser={onUpdateUser} onBack={() => setSubPage('MAIN')} />;
  if (subPage === 'NOTIFICATIONS') return <NotificationSettings user={user} onUpdateUser={onUpdateUser} onBack={() => setSubPage('MAIN')} />;
  if (subPage === 'HELP') return <HelpFeedback onBack={() => setSubPage('MAIN')} />;
  if (subPage === 'AI_SETTINGS') return <AiSettings user={user} onUpdateUser={onUpdateUser} onBack={() => setSubPage('MAIN')} />;

  const StatBox = ({ label, value, icon, colorClass, bgClass }: { label: string, value: string | number, icon: React.ReactNode, colorClass: string, bgClass: string }) => (
    <div className="flex flex-col items-center justify-center py-2">
      <div className={`w-12 h-12 rounded-2xl ${bgClass} ${colorClass} flex items-center justify-center mb-3 shadow-sm`}>
        {icon}
      </div>
      <div className="text-xl font-extrabold text-gray-900 mb-1">{value}</div>
      <div className="text-xs text-gray-400 font-bold">{label}</div>
    </div>
  );

  const MenuItem = ({ icon, label, onClick, iconBg, iconColor }: { icon: React.ReactNode, label: string, onClick?: () => void, iconBg: string, iconColor: string }) => (
    <div onClick={onClick} className="flex items-center p-4 active:bg-gray-50 transition-colors cursor-pointer group">
      <div className={`w-10 h-10 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center mr-4 group-hover:scale-105 transition-transform`}>
        {icon}
      </div>
      <div className="flex-1 font-bold text-gray-900 text-sm">{label}</div>
      <ChevronRight className="w-5 h-5 text-gray-300" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-32 pt-6 font-sans animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="relative flex items-center justify-center px-6 mb-6">
        <h1 className="text-xl font-extrabold text-gray-900">个人设置</h1>
      </div>

      <div className="px-5 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* User Card */}
        <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-gray-100">
          <div className="flex items-center gap-4 mb-8">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-bold border-4 border-white shadow-md overflow-hidden">
                 {user.avatarUrl ? (
                     <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                 ) : (
                     user.name ? user.name.charAt(0).toUpperCase() : <UserCircle2 className="w-12 h-12" />
                 )}
              </div>
              <div className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-sm border border-gray-100 cursor-pointer" onClick={() => setSubPage('PERSONAL')}>
                <Edit2 className="w-3 h-3 text-gray-400" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-1">{user.name || '未登录'}</h2>
              <p className="text-gray-400 text-xs font-medium">记得午休哦~</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-gray-50 pt-6">
            <StatBox 
              label="BMI" 
              value={bmi} 
              icon={<Activity className="w-6 h-6" />}
              bgClass="bg-blue-50"
              colorClass="text-blue-500"
            />
            <StatBox 
              label="体重(kg)" 
              value={user.weight} 
              icon={<TrendingUp className="w-6 h-6" />}
              bgClass="bg-green-50"
              colorClass="text-green-500"
            />
            <StatBox 
              label="目标体重(kg)" 
              value={user.targetWeight} 
              icon={<Target className="w-6 h-6" />}
              bgClass="bg-purple-50"
              colorClass="text-purple-500"
            />
          </div>
        </div>

        {/* Health Management */}
        <div className="bg-white rounded-[2rem] px-2 py-3 shadow-xl shadow-gray-100">
          <div className="flex items-baseline justify-between px-4 pt-2 pb-1">
             <h3 className="text-base font-extrabold text-gray-900">健康管理</h3>
          </div>
          
          <div className="divide-y divide-gray-50">
            <MenuItem 
              label="个人资料" 
              icon={<User className="w-5 h-5" />} 
              iconBg="bg-blue-50" 
              iconColor="text-blue-600"
              onClick={() => setSubPage('PERSONAL')}
            />
            <MenuItem 
              label="营养目标设置" 
              icon={<Heart className="w-5 h-5" />} 
              iconBg="bg-pink-50" 
              iconColor="text-pink-500"
              onClick={() => setSubPage('NUTRITION')}
            />
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-white rounded-[2rem] px-2 py-3 shadow-xl shadow-gray-100">
           <div className="flex items-baseline justify-between px-4 pt-2 pb-1">
             <h3 className="text-base font-extrabold text-gray-900">系统设置</h3>
          </div>
          <div className="divide-y divide-gray-50">
            <MenuItem 
              label="AI 模型设置" 
              icon={<BrainCircuit className="w-5 h-5" />} 
              iconBg="bg-purple-50" 
              iconColor="text-purple-500"
              onClick={() => setSubPage('AI_SETTINGS')}
            />
            <MenuItem 
              label="提醒通知" 
              icon={<Bell className="w-5 h-5" />} 
              iconBg="bg-indigo-50" 
              iconColor="text-indigo-500"
              onClick={() => setSubPage('NOTIFICATIONS')}
            />
            <MenuItem 
              label="帮助与反馈" 
              icon={<HelpCircle className="w-5 h-5" />} 
              iconBg="bg-gray-100" 
              iconColor="text-gray-600"
              onClick={() => setSubPage('HELP')}
            />
          </div>
        </div>

      </div>
    </div>
  );
};
