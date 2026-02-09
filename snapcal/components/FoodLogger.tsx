import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { Camera, Search, X, Check, Loader2, Plus, ChevronDown, Star, PenTool, Keyboard, Flame, Utensils, Zap, Droplets, Wheat, ScanLine } from 'lucide-react';
import { FoodItem, MealLog, MealType } from '../types';
import { analyzeFoodImage, searchFoodText } from '../services/geminiService';

interface FoodLoggerProps {
  onSave: (log: MealLog) => void;
  onCancel: () => void;
  initialMode?: 'PHOTO' | 'SEARCH' | 'QUICK_SCAN';
  initialMealType?: MealType;
}

// Simple ID generator
const generateId = () => Math.random().toString(36).substr(2, 9);

type LoggerMode = 'PHOTO' | 'SEARCH' | 'MANUAL' | 'QUICK_SCAN';

export const FoodLogger: React.FC<FoodLoggerProps> = ({ onSave, onCancel, initialMode = 'PHOTO', initialMealType }) => {
  const [mode, setMode] = useState<LoggerMode>(initialMode);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedItems, setDetectedItems] = useState<FoodItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAnalysisResult, setShowAnalysisResult] = useState(false);
  
  // Manual Entry State
  const [manualForm, setManualForm] = useState<Partial<FoodItem>>({
    name: '', quantity: 1, unit: '份', calories: 0, protein: 0, carbs: 0, fat: 0
  });
  
  // Initialize Meal Type
  const [selectedMealType, setSelectedMealType] = useState<MealType>(() => {
    if (initialMealType) return initialMealType;
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 10) return MealType.BREAKFAST;
    else if (hour >= 10 && hour < 15) return MealType.LUNCH;
    else if (hour >= 15 && hour < 22) return MealType.DINNER;
    else return MealType.SNACK;
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto trigger file picker if QUICK_SCAN
  useEffect(() => {
      if (mode === 'QUICK_SCAN' && !imagePreview) {
          fileInputRef.current?.click();
      }
  }, [mode]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
        if (mode === 'QUICK_SCAN' && !imagePreview) onCancel(); // User cancelled picker
        return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setIsAnalyzing(true);
      try {
        const items = await analyzeFoodImage(base64);
        setDetectedItems(items);
        if (mode === 'QUICK_SCAN') {
            setShowAnalysisResult(true);
        }
      } catch (err) {
        alert("图片识别失败，请重试。");
        if (mode === 'QUICK_SCAN') onCancel();
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsAnalyzing(true);
    try {
      const items = await searchFoodText(searchQuery);
      setDetectedItems(prev => [...prev, ...items]);
      setSearchQuery('');
    } catch (err) {
      alert("搜索失败。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddManual = () => {
    if (!manualForm.name) return;
    const newItem: FoodItem = {
        name: manualForm.name,
        calories: Number(manualForm.calories) || 0,
        protein: Number(manualForm.protein) || 0,
        carbs: Number(manualForm.carbs) || 0,
        fat: Number(manualForm.fat) || 0,
        quantity: Number(manualForm.quantity) || 1,
        unit: manualForm.unit || '份',
        healthScore: 3
    };
    setDetectedItems(prev => [...prev, newItem]);
    setManualForm({ name: '', quantity: 1, unit: '份', calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const handleSave = () => {
    if (detectedItems.length === 0) return;
    const totalCals = detectedItems.reduce((sum, item) => sum + item.calories, 0);
    const newLog: MealLog = {
      id: generateId(),
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      type: selectedMealType,
      items: detectedItems,
      totalCalories: totalCals,
      imageUrl: imagePreview || undefined
    };
    onSave(newLog);
  };

  const updateItem = (index: number, field: keyof FoodItem, value: any) => {
    const newItems = [...detectedItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setDetectedItems(newItems);
  };

  const removeItem = (index: number) => {
    setDetectedItems(prev => prev.filter((_, i) => i !== index));
  };

  const renderStars = (score: number = 0) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
           <Star key={star} className={`w-3.5 h-3.5 ${star <= score ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`} />
        ))}
      </div>
    );
  };

  // --- UI FOR QUICK SCAN ANALYSIS MODE ---
  if (mode === 'QUICK_SCAN') {
      const totalCals = detectedItems.reduce((sum, i) => sum + i.calories, 0);
      const totalProtein = detectedItems.reduce((sum, i) => sum + i.protein, 0);
      const totalCarbs = detectedItems.reduce((sum, i) => sum + i.carbs, 0);
      const totalFat = detectedItems.reduce((sum, i) => sum + i.fat, 0);

      return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black text-white">
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
            
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                <button onClick={onCancel} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white/80 hover:bg-black/60"><X className="w-6 h-6"/></button>
                <div className="text-sm font-bold tracking-widest uppercase opacity-80">AI 营养分析</div>
                <div className="w-10"></div>
            </div>

            {/* Main Image Area */}
            <div className="flex-1 relative bg-gray-900 flex items-center justify-center overflow-hidden">
                {imagePreview ? (
                     <>
                        <img src={imagePreview} className="w-full h-full object-cover opacity-80" alt="Analysis" />
                        {isAnalyzing && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-30">
                                <div className="relative w-24 h-24 mb-6">
                                    <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-pulse"></div>
                                    <div className="absolute inset-0 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                                    <ScanLine className="absolute inset-0 m-auto text-blue-500 w-10 h-10 animate-pulse" />
                                </div>
                                <div className="text-xl font-bold tracking-wider animate-pulse">正在识别食物...</div>
                            </div>
                        )}
                     </>
                ) : (
                    <div className="text-gray-500 flex flex-col items-center gap-4">
                        <Camera className="w-16 h-16 opacity-50" />
                        <span>启动相机中...</span>
                    </div>
                )}
            </div>

            {/* Analysis Result Card (Slide Up) */}
            {showAnalysisResult && !isAnalyzing && (
                 <div className="bg-white text-gray-900 rounded-t-[2.5rem] p-6 pb-safe animate-in slide-in-from-bottom duration-500 shadow-2xl relative z-40 max-h-[60vh] overflow-y-auto">
                     {/* Decorative Pull Bar */}
                     <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>

                     {/* Title & Calories */}
                     <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-6">
                         <div>
                             <h2 className="text-2xl font-extrabold text-gray-900 mb-1">
                                 {detectedItems.length > 0 ? detectedItems.map(i => i.name).join(' + ') : '未识别到食物'}
                             </h2>
                             <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">AI 估算</span>
                                {detectedItems.length > 0 && renderStars(detectedItems[0].healthScore)}
                             </div>
                         </div>
                         <div className="text-right">
                             <div className="text-4xl font-extrabold text-blue-600">{Math.round(totalCals)}</div>
                             <div className="text-xs font-bold text-gray-400">千卡 (kcal)</div>
                         </div>
                     </div>

                     {/* Macros Grid */}
                     <div className="grid grid-cols-3 gap-4 mb-8">
                         <div className="bg-purple-50 rounded-2xl p-4 text-center">
                             <div className="p-2 bg-purple-100 text-purple-600 rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2">
                                 <Zap className="w-4 h-4" />
                             </div>
                             <div className="text-lg font-extrabold text-purple-900">{Math.round(totalProtein)}g</div>
                             <div className="text-[10px] font-bold text-purple-400 uppercase">蛋白质</div>
                         </div>
                         <div className="bg-blue-50 rounded-2xl p-4 text-center">
                             <div className="p-2 bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2">
                                 <Wheat className="w-4 h-4" />
                             </div>
                             <div className="text-lg font-extrabold text-blue-900">{Math.round(totalCarbs)}g</div>
                             <div className="text-[10px] font-bold text-blue-400 uppercase">碳水</div>
                         </div>
                         <div className="bg-orange-50 rounded-2xl p-4 text-center">
                             <div className="p-2 bg-orange-100 text-orange-600 rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2">
                                 <Droplets className="w-4 h-4" />
                             </div>
                             <div className="text-lg font-extrabold text-orange-900">{Math.round(totalFat)}g</div>
                             <div className="text-[10px] font-bold text-orange-400 uppercase">脂肪</div>
                         </div>
                     </div>

                     {/* Meal Selector & Action */}
                     <div className="space-y-4">
                        <label className="text-xs font-bold text-gray-400 uppercase ml-2">添加到今日记录</label>
                        <div className="flex bg-gray-100 p-1.5 rounded-xl overflow-x-auto no-scrollbar">
                           {Object.values(MealType).map(type => (
                               <button 
                                key={type}
                                onClick={() => setSelectedMealType(type)}
                                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap px-4 ${selectedMealType === type ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
                               >
                                   {type}
                               </button>
                           ))}
                        </div>

                        <Button fullWidth onClick={handleSave} className="h-14 rounded-2xl text-lg shadow-xl shadow-blue-200">
                            确认记录 <Check className="w-5 h-5 ml-2" />
                        </Button>
                     </div>
                 </div>
            )}
        </div>
      );
  }

  // --- STANDARD LOGGER UI (List Builder) ---
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center pointer-events-none">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300 pointer-events-auto" onClick={onCancel} />

      <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] h-[85vh] sm:h-[750px] flex flex-col relative z-10 shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-hidden pointer-events-auto">
        <div className="w-full flex justify-center pt-3 pb-1 cursor-pointer" onClick={onCancel}><div className="w-12 h-1.5 bg-gray-200 rounded-full"></div></div>

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-50">
           <div className="flex items-center justify-between mb-4">
              <button onClick={onCancel} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-500 font-bold text-sm">取消</button>
              <div className="font-extrabold text-lg text-gray-900">记录饮食</div>
              <button onClick={handleSave} disabled={detectedItems.length === 0} className="px-5 py-2 bg-blue-600 text-white rounded-full text-sm font-bold disabled:opacity-50 disabled:bg-gray-200 disabled:text-gray-400 transition-all shadow-lg shadow-blue-200 disabled:shadow-none hover:bg-blue-700 active:scale-95">保存 ({detectedItems.length})</button>
           </div>
           
           <div className="flex bg-gray-100 p-1.5 rounded-2xl relative">
              <div className="absolute top-1.5 bottom-1.5 rounded-xl bg-white shadow-sm transition-all duration-300 ease-out" style={{ left: mode === 'PHOTO' ? '0.375rem' : mode === 'SEARCH' ? '33.33%' : '66.66%', width: 'calc(33.33% - 0.5rem)', transform: mode === 'SEARCH' ? 'translateX(0.125rem)' : mode === 'MANUAL' ? 'translateX(-0.125rem)' : 'none' }} />
              <button onClick={() => setMode('PHOTO')} className={`flex-1 relative z-10 py-2.5 rounded-xl text-sm font-extrabold transition-colors flex items-center justify-center gap-1.5 ${mode === 'PHOTO' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}><Camera className="w-4 h-4" /> 拍照</button>
              <button onClick={() => setMode('SEARCH')} className={`flex-1 relative z-10 py-2.5 rounded-xl text-sm font-extrabold transition-colors flex items-center justify-center gap-1.5 ${mode === 'SEARCH' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}><Search className="w-4 h-4" /> 搜索</button>
              <button onClick={() => setMode('MANUAL')} className={`flex-1 relative z-10 py-2.5 rounded-xl text-sm font-extrabold transition-colors flex items-center justify-center gap-1.5 ${mode === 'MANUAL' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}><Keyboard className="w-4 h-4" /> 手输</button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 pb-8 no-scrollbar bg-gray-50/50">
          <div className="mb-6 overflow-x-auto no-scrollbar pb-2">
            <div className="flex gap-2 min-w-min mx-auto">
              {Object.values(MealType).map(type => (
                <button key={type} onClick={() => setSelectedMealType(type)} className={`px-4 py-2 rounded-xl whitespace-nowrap text-xs font-bold border transition-all ${selectedMealType === type ? 'bg-gray-900 text-white border-gray-900 shadow-md transform scale-105' : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50'}`}>{type}</button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {mode === 'PHOTO' && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                {!imagePreview ? (
                  <div onClick={() => fileInputRef.current?.click()} className="aspect-[4/3] rounded-[2rem] border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-white cursor-pointer hover:bg-blue-50 transition-all hover:border-blue-400 group shadow-sm">
                    <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4 shadow-inner group-hover:scale-110 transition-transform group-hover:bg-blue-100"><Camera className="h-8 w-8" /></div>
                    <span className="text-gray-500 font-bold group-hover:text-blue-600 transition-colors">点击拍摄食物</span>
                    <span className="text-xs text-gray-400 mt-1">AI 自动识别热量与营养</span>
                    <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                  </div>
                ) : (
                  <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden bg-black shadow-lg group">
                     <img src={imagePreview} className="w-full h-full object-contain" alt="Preview" />
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button onClick={() => { setImagePreview(null); setDetectedItems([]); }} className="bg-white/90 text-red-500 px-6 py-2.5 rounded-full font-bold shadow-lg backdrop-blur-sm hover:scale-105 transition-transform flex items-center gap-2"><Camera className="w-4 h-4" /> 重新拍摄</button>
                     </div>
                  </div>
                )}
              </div>
            )}

            {mode === 'SEARCH' && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 mb-4">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-2 mb-2 block">AI 智能搜索</label>
                    <div className="relative">
                        <input type="text" placeholder="例如：一碗牛肉面" className="w-full pl-12 pr-12 py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-gray-900 placeholder:text-gray-400" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} autoFocus />
                        <Search className="absolute left-4 top-4.5 h-5 w-5 text-gray-400" />
                        {isAnalyzing ? <div className="absolute right-4 top-4.5"><Loader2 className="h-5 w-5 animate-spin text-blue-500" /></div> : <button onClick={handleSearch} disabled={!searchQuery.trim()} className="absolute right-3 top-3 bg-blue-600 text-white p-2 rounded-xl shadow-md hover:bg-blue-700 transition-all disabled:opacity-50 disabled:shadow-none"><Search className="h-4 w-4" /></button>}
                    </div>
                </div>
              </div>
            )}

            {mode === 'MANUAL' && (
               <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                 <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                    <div className="mb-4">
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1.5 block">食物名称</label>
                        <input placeholder="例如: 红烧排骨" className="w-full text-lg font-extrabold text-gray-900 border-b-2 border-gray-100 focus:border-blue-500 outline-none py-2 px-1 bg-transparent transition-colors placeholder:text-gray-300" value={manualForm.name} onChange={(e) => setManualForm(prev => ({ ...prev, name: e.target.value }))} />
                    </div>
                    {/* ... (Manual Inputs similar to before) ... */}
                     <div className="flex gap-4 mb-6">
                        <div className="flex-1"><label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1.5 block">份量数值</label><input type="number" placeholder="1" className="w-full bg-gray-50 rounded-xl px-4 py-3 font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" value={manualForm.quantity} onChange={(e) => setManualForm(prev => ({ ...prev, quantity: Number(e.target.value) }))} /></div>
                        <div className="flex-1"><label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1.5 block">单位</label><input placeholder="碗/个/g" className="w-full bg-gray-50 rounded-xl px-4 py-3 font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" value={manualForm.unit} onChange={(e) => setManualForm(prev => ({ ...prev, unit: e.target.value }))} /></div>
                    </div>
                    <div className="mb-6"><label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1.5 block">热量 (千卡)</label><div className="relative"><input type="number" placeholder="0" className="w-full bg-orange-50 rounded-xl px-4 py-3 font-extrabold text-orange-600 text-xl focus:ring-2 focus:ring-orange-200 outline-none placeholder:text-orange-200" value={manualForm.calories || ''} onChange={(e) => setManualForm(prev => ({ ...prev, calories: Number(e.target.value) }))} /><Flame className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-300 w-5 h-5" /></div></div>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                         <div><label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block text-center">蛋白质(g)</label><input type="number" placeholder="0" className="w-full bg-gray-50 rounded-xl px-2 py-2 text-center font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" value={manualForm.protein || ''} onChange={(e) => setManualForm(prev => ({ ...prev, protein: Number(e.target.value) }))} /></div>
                         <div><label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block text-center">碳水(g)</label><input type="number" placeholder="0" className="w-full bg-gray-50 rounded-xl px-2 py-2 text-center font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" value={manualForm.carbs || ''} onChange={(e) => setManualForm(prev => ({ ...prev, carbs: Number(e.target.value) }))} /></div>
                         <div><label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block text-center">脂肪(g)</label><input type="number" placeholder="0" className="w-full bg-gray-50 rounded-xl px-2 py-2 text-center font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" value={manualForm.fat || ''} onChange={(e) => setManualForm(prev => ({ ...prev, fat: Number(e.target.value) }))} /></div>
                    </div>
                    <button onClick={handleAddManual} disabled={!manualForm.name} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold shadow-lg shadow-gray-200 hover:bg-black transition-colors disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"><Plus className="w-5 h-5" /> 添加到列表</button>
                 </div>
               </div>
            )}

            {isAnalyzing && mode === 'PHOTO' && (
               <div className="flex flex-col items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-3" /><p className="text-xs text-gray-400 font-bold uppercase tracking-widest animate-pulse">AI 正在分析...</p></div>
            )}

            {detectedItems.length > 0 && (
              <div className="space-y-4 animate-in slide-in-from-bottom-10 duration-500 pb-20">
                <div className="flex items-center justify-between px-2"><h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2"><Check className="w-5 h-5 text-green-500" /> 已添加 ({detectedItems.length})</h3><button onClick={() => setDetectedItems([])} className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">清空列表</button></div>
                {detectedItems.map((item, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-xl shadow-gray-100/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-[4rem] -z-0 opacity-50"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-2/3">
                                <input className="font-extrabold text-lg text-gray-900 bg-transparent border-b border-dashed border-gray-300 focus:border-blue-500 focus:outline-none w-full pb-1 placeholder-gray-300" value={item.name} onChange={(e) => updateItem(idx, 'name', e.target.value)} placeholder="食物名称" />
                                {item.healthScore !== undefined && <div className="flex items-center gap-2 mt-2"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">健康指数</span>{renderStars(item.healthScore || 3)}</div>}
                            </div>
                            <button onClick={() => removeItem(idx)} className="p-2 rounded-full bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"><X className="h-4 w-4" /></button>
                        </div>
                        <div className="flex gap-4 mb-5">
                            <div className="flex-1"><label className="text-[10px] text-gray-400 font-bold block mb-1 uppercase">份量</label><div className="flex items-center"><input type="number" className="w-full p-2 bg-gray-50 rounded-l-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))} /><div className="bg-gray-100 px-3 py-2 rounded-r-xl text-xs font-bold text-gray-500 border-l border-white min-w-[3rem] text-center">{item.unit}</div></div></div>
                            <div className="flex-1"><label className="text-[10px] text-gray-400 font-bold block mb-1 uppercase">热量 (kcal)</label><input type="number" className="w-full p-2 bg-gray-50 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" value={item.calories} onChange={(e) => updateItem(idx, 'calories', Number(e.target.value))} /></div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-green-50 rounded-xl p-2 text-center"><div className="text-green-700 font-extrabold text-sm">{Math.round(item.protein)}g</div><div className="text-[10px] text-green-400 font-bold uppercase">蛋白质</div></div>
                            <div className="bg-blue-50 rounded-xl p-2 text-center"><div className="text-blue-700 font-extrabold text-sm">{Math.round(item.carbs)}g</div><div className="text-[10px] text-blue-400 font-bold uppercase">碳水</div></div>
                            <div className="bg-orange-50 rounded-xl p-2 text-center"><div className="text-orange-700 font-extrabold text-sm">{Math.round(item.fat)}g</div><div className="text-[10px] text-orange-400 font-bold uppercase">脂肪</div></div>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};