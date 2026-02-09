
import React, { useState, useRef } from 'react';
import { UserProfile, Gender } from '../types';
import { analyzeIngredientLabel, IngredientAnalysis } from '../services/geminiService';
import { 
  Swords, 
  Trophy, 
  ScanBarcode, 
  ShieldCheck, 
  BarChartBig, 
  Flame, 
  Percent, 
  Activity, 
  ArrowDownUp, 
  HeartPulse, 
  ChevronLeft, 
  Minus, 
  Plus, 
  X, 
  Camera, 
  Loader2, 
  CheckCircle,
  Info,
  Scale,
  Gauge,
  Thermometer,
  Zap
} from 'lucide-react';

interface HealthToolsProps {
  user: UserProfile;
}

// --- Reusable UI Components ---

const ToolHeader: React.FC<{ title: string; onBack: () => void; dark?: boolean }> = ({ title, onBack, dark = false }) => (
    <div className={`relative flex items-center justify-center px-6 py-4 mb-2 ${dark ? 'text-white' : 'text-gray-900'}`}>
        <button onClick={onBack} className={`absolute left-6 p-2 -ml-2 rounded-full transition-all ${dark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-700'}`}>
            <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-extrabold tracking-tight">{title}</h1>
    </div>
);

const ResultCard: React.FC<{ label: string; value: string | number; unit?: string; status?: string; colorClass: string; bgClass: string; icon: React.ReactNode }> = ({ label, value, unit, status, colorClass, bgClass, icon }) => (
    <div className={`rounded-[2.5rem] p-8 text-center shadow-xl shadow-gray-100 border border-white relative overflow-hidden bg-white mb-6`}>
        <div className={`absolute top-0 right-0 w-32 h-32 ${bgClass} opacity-10 rounded-bl-[5rem] -mr-8 -mt-8`}></div>
        <div className={`w-14 h-14 ${bgClass} ${colorClass} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm relative z-10`}>
            {icon}
        </div>
        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 relative z-10">{label}</div>
        <div className="flex items-baseline justify-center gap-1 mb-2 relative z-10">
            <span className={`text-6xl font-black ${colorClass} tracking-tighter transition-all`}>{value}</span>
            {unit && <span className="text-sm font-bold text-gray-400">{unit}</span>}
        </div>
        {status && (
            <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black ${bgClass} ${colorClass} relative z-10 shadow-sm border border-white`}>
                <div className={`w-2 h-2 rounded-full ${colorClass.replace('text', 'bg')} animate-pulse`}></div>
                {status}
            </div>
        )}
    </div>
);

const InputGroup: React.FC<{ label: string; value: number; min: number; max: number; step?: number; unit: string; onChange: (v: number) => void; color: string }> = ({ label, value, min, max, step = 1, unit, onChange, color }) => (
    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-50 mb-4 transition-all hover:shadow-md">
        <div className="flex justify-between items-center mb-6">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{label} ({unit})</label>
            <div className={`flex items-center gap-3 bg-gray-50 rounded-xl px-2 py-1`}>
                <button onClick={() => onChange(Math.max(min, value - step))} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 active:scale-90 transition-transform"><Minus className="w-4 h-4" /></button>
                <span className="text-lg font-black text-gray-900 min-w-[3rem] text-center">{typeof value === 'number' && !Number.isInteger(value) ? value.toFixed(1) : value}</span>
                <button onClick={() => onChange(Math.min(max, value + step))} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 active:scale-90 transition-transform"><Plus className="w-4 h-4" /></button>
            </div>
        </div>
        <input 
            type="range" min={min} max={max} step={step} value={value} 
            onChange={e => onChange(Number(e.target.value))}
            className={`w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-${color}-500`}
        />
    </div>
);

const GenderToggle: React.FC<{ value: Gender; onChange: (g: Gender) => void }> = ({ value, onChange }) => (
    <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-gray-50 mb-4 flex items-center justify-between px-6">
        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">性别</span>
        <div className="flex bg-gray-100 rounded-xl p-1">
            <button onClick={() => onChange(Gender.MALE)} className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${value === Gender.MALE ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>男</button>
            <button onClick={() => onChange(Gender.FEMALE)} className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${value === Gender.FEMALE ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-400'}`}>女</button>
        </div>
    </div>
);

// --- Sub-Calculator Components ---

const BMICalculator: React.FC<{ user: UserProfile, onBack: () => void }> = ({ user, onBack }) => {
    const [weight, setWeight] = useState(user.weight);
    const [height, setHeight] = useState(user.height);
    
    const bmi = weight / ((height / 100) * (height / 100));
    
    let status = '正常';
    let colorClass = 'text-green-500';
    let bgClass = 'bg-green-50';
    let progress = 40;

    if (bmi < 18.5) { status = '偏瘦'; colorClass = 'text-blue-500'; bgClass = 'bg-blue-50'; progress = 20; }
    else if (bmi >= 24 && bmi < 28) { status = '超重'; colorClass = 'text-orange-500'; bgClass = 'bg-orange-50'; progress = 70; }
    else if (bmi >= 28) { status = '肥胖'; colorClass = 'text-red-500'; bgClass = 'bg-red-50'; progress = 90; }

    return (
        <div className="min-h-screen bg-gray-50 pt-2 animate-in slide-in-from-right duration-300">
            <ToolHeader title="BMI 计算器" onBack={onBack} />
            <div className="px-6 pb-24">
                <ResultCard label="实时计算 BMI" value={bmi.toFixed(1)} status={status} colorClass={colorClass} bgClass={bgClass} icon={<Scale className="w-7 h-7" />} />
                
                <div className="space-y-1">
                    <InputGroup label="体重" value={weight} min={30} max={200} step={0.5} unit="kg" onChange={setWeight} color="green" />
                    <InputGroup label="身高" value={height} min={100} max={230} unit="cm" onChange={setHeight} color="green" />
                </div>

                <div className="bg-white rounded-[2rem] p-6 shadow-sm mt-4 mb-6">
                    <div className="flex justify-between items-center mb-4"><h3 className="font-extrabold text-gray-900 text-sm">等级分布</h3><Info className="w-4 h-4 text-gray-300" /></div>
                    <div className="relative h-2 bg-gray-100 rounded-full mb-6 flex overflow-hidden">
                        <div className="flex-1 bg-blue-400"></div><div className="flex-1 bg-green-400"></div><div className="flex-1 bg-orange-400"></div><div className="flex-1 bg-red-400"></div>
                        <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-gray-900 rounded-full shadow-md transition-all duration-300" style={{ left: `calc(${progress}% - 8px)` }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const BMRCalculator: React.FC<{ user: UserProfile, onBack: () => void }> = ({ user, onBack }) => {
    const [weight, setWeight] = useState(user.weight);
    const [height, setHeight] = useState(user.height);
    const [age, setAge] = useState(user.age);
    const [gender, setGender] = useState(user.gender);

    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    bmr += gender === Gender.MALE ? 5 : -161;
    
    return (
        <div className="min-h-screen bg-gray-50 pt-2 animate-in slide-in-from-right duration-300">
            <ToolHeader title="基础代谢率 (BMR)" onBack={onBack} />
            <div className="px-6 pb-24">
                <ResultCard label="每日静息消耗" value={Math.round(bmr)} unit="kcal" status="维持生命最低热量" colorClass="text-orange-600" bgClass="bg-orange-50" icon={<Flame className="w-7 h-7" />} />
                <div className="space-y-1">
                    <GenderToggle value={gender} onChange={setGender} />
                    <InputGroup label="体重" value={weight} min={30} max={200} step={0.5} unit="kg" onChange={setWeight} color="orange" />
                    <InputGroup label="身高" value={height} min={100} max={230} unit="cm" onChange={setHeight} color="orange" />
                    <InputGroup label="年龄" value={age} min={1} max={120} unit="岁" onChange={setAge} color="orange" />
                </div>
            </div>
        </div>
    );
};

const BFRCalculator: React.FC<{ user: UserProfile, onBack: () => void }> = ({ user, onBack }) => {
    const [weight, setWeight] = useState(user.weight);
    const [height, setHeight] = useState(user.height);
    const [age, setAge] = useState(user.age);
    const [gender, setGender] = useState(user.gender);

    const bmi = weight / ((height / 100) * (height / 100));
    const sexValue = gender === Gender.MALE ? 1 : 0;
    const bfr = (1.20 * bmi) + (0.23 * age) - (10.8 * sexValue) - 5.4;
    const isHealthy = gender === Gender.MALE ? (bfr >= 10 && bfr <= 20) : (bfr >= 18 && bfr <= 28);

    return (
        <div className="min-h-screen bg-gray-50 pt-2 animate-in slide-in-from-right duration-300">
            <ToolHeader title="体脂率 (BFR)" onBack={onBack} />
            <div className="px-6 pb-24">
                <ResultCard label="估算体脂百分比" value={bfr.toFixed(1)} unit="%" status={isHealthy ? '理想水平' : '建议调整'} colorClass="text-purple-600" bgClass="bg-purple-50" icon={<Percent className="w-7 h-7" />} />
                <div className="space-y-1">
                    <GenderToggle value={gender} onChange={setGender} />
                    <InputGroup label="体重" value={weight} min={30} max={200} step={0.5} unit="kg" onChange={setWeight} color="purple" />
                    <InputGroup label="身高" value={height} min={100} max={230} unit="cm" onChange={setHeight} color="purple" />
                    <InputGroup label="年龄" value={age} min={1} max={120} unit="岁" onChange={setAge} color="purple" />
                </div>
            </div>
        </div>
    );
};

const RFMCalculator: React.FC<{ user: UserProfile, onBack: () => void }> = ({ user, onBack }) => {
    const [height, setHeight] = useState(user.height);
    const [waist, setWaist] = useState(80);
    const [gender, setGender] = useState(user.gender);

    const sexCoeff = gender === Gender.MALE ? 0 : 1; 
    const rfm = 64 - (20 * (height / waist)) + (12 * sexCoeff);

    return (
        <div className="min-h-screen bg-gray-50 pt-2 animate-in slide-in-from-right duration-300">
            <ToolHeader title="相对脂肪量 (RFM)" onBack={onBack} />
            <div className="px-6 pb-24">
                <ResultCard label="RFM 估算体脂" value={rfm.toFixed(1)} unit="%" status="更精准的身高腰围比" colorClass="text-cyan-600" bgClass="bg-cyan-50" icon={<Activity className="w-7 h-7" />} />
                <div className="space-y-1">
                    <GenderToggle value={gender} onChange={setGender} />
                    <InputGroup label="腰围" value={waist} min={40} max={180} unit="cm" onChange={setWaist} color="cyan" />
                    <InputGroup label="身高" value={height} min={100} max={230} unit="cm" onChange={setHeight} color="cyan" />
                </div>
            </div>
        </div>
    );
};

const WHRCalculator: React.FC<{ user: UserProfile, onBack: () => void }> = ({ user, onBack }) => {
    const [waist, setWaist] = useState(80);
    const [hip, setHip] = useState(95);
    const [gender, setGender] = useState(user.gender);
    
    const whr = waist / hip;
    const isHealthy = gender === Gender.MALE ? whr < 0.9 : whr < 0.85;

    return (
        <div className="min-h-screen bg-gray-50 pt-2 animate-in slide-in-from-right duration-300">
            <ToolHeader title="腰臀比 (WHR)" onBack={onBack} />
            <div className="px-6 pb-24">
                <ResultCard label="腰臀比例系数" value={whr.toFixed(2)} status={isHealthy ? '健康腰臀比' : '内脏脂肪高风险'} colorClass="text-indigo-600" bgClass="bg-indigo-50" icon={<ArrowDownUp className="w-7 h-7" />} />
                <div className="space-y-1">
                    <GenderToggle value={gender} onChange={setGender} />
                    <InputGroup label="腰围" value={waist} min={40} max={180} unit="cm" onChange={setWaist} color="indigo" />
                    <InputGroup label="臀围" value={hip} min={40} max={180} unit="cm" onChange={setHip} color="indigo" />
                </div>
            </div>
        </div>
    );
};

const HeartRateCalculator: React.FC<{ user: UserProfile, onBack: () => void }> = ({ user, onBack }) => {
    const [age, setAge] = useState(user.age);
    const maxHr = 220 - age;
    const burnMin = Math.round(maxHr * 0.6);
    const burnMax = Math.round(maxHr * 0.8);

    return (
        <div className="min-h-screen bg-gray-50 pt-2 animate-in slide-in-from-right duration-300">
            <ToolHeader title="燃脂心率" onBack={onBack} />
            <div className="px-6 pb-24">
                <ResultCard label="理想燃脂区间" value={`${burnMin}-${burnMax}`} unit="bpm" status="高效减脂心率" colorClass="text-red-600" bgClass="bg-red-50" icon={<HeartPulse className="w-7 h-7" />} />
                <InputGroup label="您的年龄" value={age} min={1} max={120} unit="岁" onChange={setAge} color="red" />
                
                <div className="bg-white rounded-[2.5rem] p-6 shadow-sm mt-4">
                    <h3 className="font-black text-gray-900 mb-6 px-1 text-center uppercase tracking-widest text-xs">强度阶梯</h3>
                    <div className="space-y-3">
                         <div className="h-10 bg-gray-50 rounded-xl flex items-center px-4 justify-between">
                            <span className="text-xs font-bold text-gray-400">热身阶段 (50-60%)</span>
                            <span className="text-xs font-black text-gray-400">{Math.round(maxHr * 0.5)} - {Math.round(maxHr * 0.6)}</span>
                         </div>
                         <div className="h-12 bg-red-50 border border-red-100 rounded-xl flex items-center px-4 justify-between shadow-sm">
                            <span className="text-xs font-black text-red-600">最佳燃脂 (60-80%)</span>
                            <span className="text-sm font-black text-red-600">{burnMin} - {burnMax}</span>
                         </div>
                         <div className="h-10 bg-gray-50 rounded-xl flex items-center px-4 justify-between">
                            <span className="text-xs font-bold text-gray-400">心肺强化 (80-90%)</span>
                            <span className="text-xs font-black text-gray-400">{Math.round(maxHr * 0.8)} - {Math.round(maxHr * 0.9)}</span>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main Scanner Tool ---

const IngredientScanner: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [image, setImage] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<IngredientAnalysis | null>(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            setImage(base64);
            setLoading(true);
            try {
                const result = await analyzeIngredientLabel(base64);
                setAnalysis(result);
            } catch (err) {
                alert("识别失败，请重试");
            } finally {
                setLoading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white pt-2 animate-in slide-in-from-right duration-300">
            <ToolHeader title="配料表分析" onBack={onBack} dark />

            <div className="px-5 pb-20">
                {!image ? (
                     <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-[3/4] rounded-[3rem] border-2 border-dashed border-gray-700 flex flex-col items-center justify-center bg-gray-800/50 hover:bg-gray-800 transition-colors cursor-pointer group"
                     >
                         <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform">
                            <Camera className="w-10 h-10 text-gray-500" />
                         </div>
                         <span className="font-black text-gray-400 tracking-widest uppercase">点击拍摄配料表</span>
                         <span className="text-[10px] text-gray-600 mt-2 font-bold">AI 将自动识别添加剂并评估风险</span>
                         <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                     </div>
                ) : (
                    <div className="space-y-6">
                         <div className="relative aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-white/10">
                             <img src={image} className="w-full h-full object-cover opacity-60" alt="Ingredients" />
                             {loading && (
                                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
                                     <div className="relative w-16 h-16 mb-4">
                                         <div className="absolute inset-0 border-4 border-green-500/20 rounded-full"></div>
                                         <div className="absolute inset-0 border-4 border-t-green-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                                     </div>
                                     <span className="font-black text-sm tracking-widest uppercase animate-pulse">AI 分析中...</span>
                                 </div>
                             )}
                         </div>

                         {analysis && (
                             <div className="animate-in slide-in-from-bottom duration-500">
                                 <div className="bg-gray-800/50 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/5 mb-6">
                                     <div className="flex items-center justify-between mb-8">
                                         <div className="text-center">
                                             <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">健康评分</div>
                                             <div className={`text-6xl font-black ${analysis.score > 80 ? 'text-green-500' : analysis.score > 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                                                 {analysis.score}
                                             </div>
                                         </div>
                                         <div className="flex-1 ml-8"><p className="text-xs text-gray-400 leading-relaxed font-bold">{analysis.summary}</p></div>
                                     </div>

                                     <div className="space-y-4">
                                         <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">成分风险明细</h3>
                                         {analysis.concerns.length === 0 ? (
                                             <div className="bg-green-500/10 border border-green-500/20 p-5 rounded-2xl flex items-center gap-4">
                                                 <div className="p-2 bg-green-500 rounded-full"><CheckCircle className="w-4 h-4 text-white" /></div>
                                                 <span className="text-sm font-black text-green-500">此食品成分非常健康、洁净</span>
                                             </div>
                                         ) : (
                                             analysis.concerns.map((concern, idx) => (
                                                 <div key={idx} className="bg-gray-900/50 p-5 rounded-2xl border border-white/5 relative overflow-hidden">
                                                     <div className={`absolute top-0 left-0 bottom-0 w-1 ${concern.risk === 'High' ? 'bg-red-500' : concern.risk === 'Medium' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                                                     <div className="flex justify-between items-center mb-2">
                                                         <span className="font-black text-gray-200 text-sm tracking-tight">{concern.name}</span>
                                                         <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${concern.risk === 'High' ? 'bg-red-500/20 text-red-400' : concern.risk === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>{concern.risk} 风险</span>
                                                     </div>
                                                     <p className="text-xs text-gray-500 font-medium leading-relaxed">{concern.description}</p>
                                                 </div>
                                             ))
                                         )}
                                     </div>
                                 </div>
                                 <button onClick={() => { setImage(null); setAnalysis(null); }} className="w-full py-5 bg-white text-gray-900 rounded-2xl font-black text-lg shadow-xl shadow-black hover:bg-gray-100 transition-all active:scale-95">重新扫描配料</button>
                             </div>
                         )}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Entry Component ---

export const HealthTools: React.FC<HealthToolsProps> = ({ user }) => {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  if (activeTool === 'BMI') return <BMICalculator user={user} onBack={() => setActiveTool(null)} />;
  if (activeTool === 'RFM') return <RFMCalculator user={user} onBack={() => setActiveTool(null)} />;
  if (activeTool === 'BMR') return <BMRCalculator user={user} onBack={() => setActiveTool(null)} />;
  if (activeTool === 'INGREDIENT') return <IngredientScanner onBack={() => setActiveTool(null)} />;
  if (activeTool === 'BFR') return <BFRCalculator user={user} onBack={() => setActiveTool(null)} />;
  if (activeTool === 'WHR') return <WHRCalculator user={user} onBack={() => setActiveTool(null)} />;
  if (activeTool === 'HR') return <HeartRateCalculator user={user} onBack={() => setActiveTool(null)} />;

  return (
    <div className="min-h-screen bg-gray-50 pb-32 pt-6 font-sans">
      <div className="relative flex items-center justify-center px-6 mb-6">
        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">健康驿站</h1>
      </div>

      <div className="px-5 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 overflow-hidden shadow-2xl shadow-blue-100 h-56 flex flex-col justify-center">
            <div className="absolute right-0 top-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-36 h-36 flex items-center justify-center opacity-100 group">
                <div className="relative"><div className="absolute inset-0 bg-blue-400/20 blur-2xl rounded-full scale-150 animate-pulse"></div><div className="relative flex items-center justify-center"><Swords className="w-24 h-24 text-white/10 absolute rotate-12" strokeWidth={2} /><Trophy className="w-20 h-20 text-yellow-400 fill-yellow-200 relative z-10 drop-shadow-[0_10px_10px_rgba(0,0,0,0.2)] -rotate-6" strokeWidth={1.5} /></div></div>
            </div>
            <div className="relative z-10 w-2/3">
                <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[10px] font-black rounded-lg mb-4 uppercase tracking-widest border border-white/10">Community</div>
                <h2 className="text-2xl font-black text-white mb-2 leading-none tracking-tighter">瘦身大作战</h2>
                <p className="text-xs text-white/60 font-bold leading-relaxed mb-6">与好友一起减脂打卡<br/>相互监督共同进步</p>
                <button className="bg-white text-blue-700 px-6 py-2.5 rounded-full text-xs font-black shadow-lg hover:scale-105 active:scale-95 transition-all">立即加入</button>
            </div>
        </div>

        <div className="relative bg-white rounded-[2.5rem] p-8 overflow-hidden shadow-xl shadow-gray-100 border border-gray-50 h-56 flex flex-col justify-center">
             <div className="absolute right-4 top-1/2 -translate-y-1/2 w-36 h-36 flex items-center justify-center opacity-100">
                 <div className="relative"><div className="absolute inset-0 bg-green-500/10 blur-3xl rounded-full scale-150"></div><div className="flex items-center justify-center"><ScanBarcode className="w-28 h-28 text-green-500/5 absolute scale-125 rotate-3" strokeWidth={1.5} /><ShieldCheck className="w-20 h-20 text-green-500 fill-green-50 relative z-10 drop-shadow-sm -rotate-6" strokeWidth={1} /></div></div>
            </div>
             <div className="relative z-10 w-2/3">
                <div className="inline-block px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black rounded-lg mb-4 uppercase tracking-widest">AI Vision</div>
                <h2 className="text-2xl font-black text-gray-900 mb-2 leading-none tracking-tighter">配料表专家</h2>
                <p className="text-xs text-gray-400 font-bold leading-relaxed mb-6">深度识别食品添加剂<br/>评估健康风险等级</p>
                <button onClick={() => setActiveTool('INGREDIENT')} className="bg-gray-900 text-white px-6 py-2.5 rounded-full text-xs font-black shadow-lg shadow-gray-200 hover:scale-105 active:scale-95 transition-all">开启识别</button>
            </div>
        </div>

        <div className="pt-6">
            <h3 className="text-base font-black text-gray-900 mb-6 px-1 tracking-tight">专业工具</h3>
            <div className="grid grid-cols-2 gap-4">
                <ToolItem title="BMI查询" desc="体质指数" icon={<BarChartBig className="w-5 h-5" />} color="blue" onClick={() => setActiveTool('BMI')} />
                <ToolItem title="基础代谢" desc="BMR 评估" icon={<Flame className="w-5 h-5" />} color="orange" onClick={() => setActiveTool('BMR')} />
                <ToolItem title="体脂率" desc="全身成分" icon={<Percent className="w-5 h-5" />} color="purple" onClick={() => setActiveTool('BFR')} />
                <ToolItem title="RFM查询" desc="精准预测" icon={<Activity className="w-5 h-5" />} color="cyan" onClick={() => setActiveTool('RFM')} />
                <ToolItem title="腰臀比" desc="中心肥胖" icon={<ArrowDownUp className="w-5 h-5" />} color="indigo" onClick={() => setActiveTool('WHR')} />
                <ToolItem title="燃脂心率" desc="高效减脂" icon={<HeartPulse className="w-5 h-5" />} color="red" onClick={() => setActiveTool('HR')} />
            </div>
        </div>
      </div>
    </div>
  );
};

const ToolItem: React.FC<{ title: string; desc: string; icon: React.ReactNode; color: string; onClick: () => void }> = ({ title, desc, icon, color, onClick }) => {
    const colorMap: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-500 hover:bg-blue-100 ring-blue-100',
        orange: 'bg-orange-50 text-orange-500 hover:bg-orange-100 ring-orange-100',
        purple: 'bg-purple-50 text-purple-500 hover:bg-purple-100 ring-purple-100',
        cyan: 'bg-cyan-50 text-cyan-500 hover:bg-cyan-100 ring-cyan-100',
        indigo: 'bg-indigo-50 text-indigo-500 hover:bg-indigo-100 ring-indigo-100',
        red: 'bg-red-50 text-red-500 hover:bg-red-100 ring-red-100'
    };
    return (
        <div onClick={onClick} className="bg-white p-5 rounded-[2rem] border border-white shadow-xl shadow-gray-100/50 flex flex-col items-center text-center group cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all shadow-sm ${colorMap[color].split(' ring')[0]} group-hover:scale-110`}>{icon}</div>
            <div className="font-black text-sm text-gray-900 mb-1 tracking-tight">{title}</div>
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{desc}</div>
        </div>
    );
};
