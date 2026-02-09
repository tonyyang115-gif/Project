import React, { useState, useEffect } from 'react';
import { AnalyzerState, GeneratedNote, SavedDraft } from '../types';
import { analyzeViralNote, replicateViralNotes } from '../services/geminiService';
import { ResultCard } from './ResultCard';
import { 
  Search, BarChart3, Repeat, Loader2, ArrowRight, 
  Zap, Hash, Layout, Target, FileText, Award, Archive, Trash2 
} from 'lucide-react';

const DRAFTS_KEY = 'rednote_analyzer_drafts';

export const ViralAnalyzer: React.FC = () => {
  const [state, setState] = useState<AnalyzerState>({
    content: '',
    isAnalyzing: false,
    analysisResult: null,
    targetCount: 3,
    generatedVariations: [],
    isGenerating: false,
  });

  const [drafts, setDrafts] = useState<SavedDraft[]>([]);

  // Load drafts on mount
  useEffect(() => {
    const saved = localStorage.getItem(DRAFTS_KEY);
    if (saved) {
      try {
        setDrafts(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load drafts");
      }
    }
  }, []);

  const handleAnalyze = async () => {
    if (!state.content.trim()) {
      alert("请先粘贴笔记正文内容。");
      return;
    }

    setState(prev => ({ ...prev, isAnalyzing: true, analysisResult: null, generatedVariations: [] }));
    
    try {
      const result = await analyzeViralNote(state.content);
      setState(prev => ({ ...prev, analysisResult: result }));
    } catch (error) {
      alert("分析失败，请重试。");
    } finally {
      setState(prev => ({ ...prev, isAnalyzing: false }));
    }
  };

  const handleReplicate = async () => {
    if (!state.analysisResult || !state.content) return;

    setState(prev => ({ ...prev, isGenerating: true }));
    try {
      const variations = await replicateViralNotes(state.analysisResult, state.content, state.targetCount);
      setState(prev => ({ ...prev, generatedVariations: variations }));
    } catch (error) {
      alert("仿写生成失败，请重试。");
    } finally {
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const handleVariationUpdate = (index: number, updatedNote: GeneratedNote) => {
    setState(prev => {
      const newVariations = [...prev.generatedVariations];
      newVariations[index] = updatedNote;
      return { ...prev, generatedVariations: newVariations };
    });
  };

  // Draft Management
  const handleSaveDraft = (note: GeneratedNote) => {
    const newDraft: SavedDraft = {
      id: Date.now().toString(),
      note: note,
      createdAt: Date.now(),
      source: 'analyzer'
    };
    const updatedDrafts = [newDraft, ...drafts];
    setDrafts(updatedDrafts);
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(updatedDrafts));
    alert("草稿保存成功！");
  };

  const handleDeleteDraft = (id: string) => {
    if (confirm("确定要删除这个草稿吗？")) {
      const updatedDrafts = drafts.filter(d => d.id !== id);
      setDrafts(updatedDrafts);
      localStorage.setItem(DRAFTS_KEY, JSON.stringify(updatedDrafts));
    }
  };

  // Safe access helpers
  const keywords = state.analysisResult?.keywords || [];
  const tags = state.analysisResult?.tags || [];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
       <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-bold text-gray-900">爆款仿写引擎</h2>
        <p className="text-gray-500">分析热门笔记，深度拆解并复刻其爆款基因。</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        {/* Input Section */}
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-gray-700">粘贴笔记正文</label>
          <textarea
            value={state.content}
            onChange={(e) => setState(prev => ({ ...prev, content: e.target.value }))}
            placeholder="请在此直接粘贴爆款笔记的标题和正文内容..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rednote-500 outline-none text-sm min-h-[200px] resize-y"
          />
          <p className="text-xs text-gray-400">*提示：为了获得最佳分析效果，请完整复制原笔记的标题和正文。</p>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={state.isAnalyzing || !state.content.trim()}
          className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors flex justify-center items-center space-x-2 disabled:opacity-50"
        >
          {state.isAnalyzing ? <Loader2 className="animate-spin" /> : <Search size={18} />}
          <span>分析笔记结构</span>
        </button>

        {/* Analysis Results Dashboard */}
        {state.analysisResult && (
          <div className="mt-10 border-t border-gray-100 pt-8 animate-slide-down">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <BarChart3 className="text-rednote-500 mr-2" />
              深度拆解报告
            </h3>

            {/* Top Row: Score & Tags Extraction */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
               {/* Viral Score Card */}
               <div className="md:col-span-4 bg-gradient-to-br from-rednote-500 to-rednote-600 rounded-2xl p-6 text-white relative overflow-hidden flex flex-col justify-between min-h-[180px] shadow-lg shadow-rednote-100">
                 <Zap className="absolute -right-4 -top-4 text-white opacity-20 w-32 h-32 rotate-12" />
                 <div>
                   <div className="flex items-center space-x-2 opacity-90 mb-1">
                     <Award size={18} />
                     <span className="font-medium text-sm">爆款指数</span>
                   </div>
                   <div className="text-5xl font-black tracking-tight">{state.analysisResult.viralScore}</div>
                 </div>
                 <div className="text-xs opacity-80 mt-2 bg-white/20 inline-block px-2 py-1 rounded w-fit">
                   AI 综合评分 (0-100)
                 </div>
               </div>

               {/* Keywords & Tags Extraction Card */}
               <div className="md:col-span-8 bg-white border border-gray-200 rounded-2xl p-6 relative overflow-hidden flex flex-col shadow-sm">
                 <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-gray-100">
                    <Target className="text-rednote-500" size={20} />
                    <h4 className="font-bold text-lg text-gray-800">标签与关键词提取</h4>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
                   {/* Keywords Column */}
                   <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col">
                     <div className="flex items-center space-x-2 text-gray-500 mb-3">
                       <Zap size={14} className="text-yellow-600" />
                       <span className="text-xs font-bold uppercase tracking-wider text-gray-400">核心流量词 (SEO)</span>
                     </div>
                     <div className="flex flex-wrap gap-2 content-start">
                       {keywords.length > 0 ? keywords.map((k, i) => (
                         <span key={i} className="px-2.5 py-1.5 bg-white text-gray-700 text-xs rounded-lg border border-gray-200 font-medium shadow-sm hover:border-yellow-200 transition-colors">
                           {k}
                         </span>
                       )) : <span className="text-sm text-gray-400 italic">暂无相关关键词</span>}
                     </div>
                   </div>
                   
                   {/* Tags Column */}
                   <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col">
                     <div className="flex items-center space-x-2 text-gray-500 mb-3">
                       <Hash size={14} className="text-blue-500" />
                       <span className="text-xs font-bold uppercase tracking-wider text-gray-400">推荐话题标签</span>
                     </div>
                     <div className="flex flex-wrap gap-2 content-start">
                       {tags.length > 0 ? tags.map((t, i) => (
                         <span key={i} className="text-xs text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100 font-medium hover:bg-blue-100 transition-colors cursor-default">
                           #{t}
                         </span>
                       )) : <span className="text-xs text-gray-400 italic">暂无相关标签</span>}
                     </div>
                   </div>
                 </div>
               </div>
            </div>

            {/* Detailed Text Analysis Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
               {/* Title Strategy */}
               <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-6">
                  <div className="flex items-center space-x-2 mb-3 text-orange-700">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <FileText size={20} />
                    </div>
                    <h4 className="font-bold text-lg">标题策略分析</h4>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                    {state.analysisResult.titleAnalysis || "暂无分析结果"}
                  </p>
               </div>

               {/* Framework Logic */}
               <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6">
                  <div className="flex items-center space-x-2 mb-3 text-blue-700">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Layout size={20} />
                    </div>
                    <h4 className="font-bold text-lg">内容框架逻辑</h4>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                    {state.analysisResult.frameworkAnalysis || "暂无分析结果"}
                  </p>
               </div>

               {/* Tags Strategy - NEW */}
               <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-6 md:col-span-2">
                  <div className="flex items-center space-x-2 mb-3 text-purple-700">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Hash size={20} />
                    </div>
                    <h4 className="font-bold text-lg">标签策略分析</h4>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                    {state.analysisResult.tagsAnalysis || "暂无分析结果"}
                  </p>
               </div>
            </div>

            {/* Replication Controls */}
            <div className="flex items-center space-x-4 bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
               <div className="flex items-center px-4 py-2 border-r border-gray-100">
                 <span className="text-sm font-medium text-gray-600 mr-3">生成数量:</span>
                 <select 
                  value={state.targetCount}
                  onChange={(e) => setState(prev => ({ ...prev, targetCount: Number(e.target.value) }))}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-sm outline-none focus:border-rednote-500"
                 >
                   <option value={1}>1 篇</option>
                   <option value={3}>3 篇</option>
                   <option value={5}>5 篇</option>
                 </select>
               </div>
               <button
                onClick={handleReplicate}
                disabled={state.isGenerating}
                className="flex-1 bg-gray-900 text-white h-12 rounded-lg font-bold hover:bg-black transition-all flex items-center justify-center space-x-2"
               >
                 {state.isGenerating ? <Loader2 className="animate-spin" /> : <Repeat size={18} />}
                 <span>基于分析生成仿写笔记</span>
               </button>
            </div>
          </div>
        )}
      </div>

      {/* Generated Variations List */}
      {state.generatedVariations && state.generatedVariations.length > 0 && (
        <div className="grid grid-cols-1 gap-6 animate-slide-up pb-6">
           <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <ArrowRight className="text-rednote-500 mr-2" />
            仿写结果
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {state.generatedVariations.map((note, idx) => (
               <ResultCard 
                 key={idx} 
                 note={note} 
                 onUpdate={(updatedNote) => handleVariationUpdate(idx, updatedNote)}
                 onSaveDraft={handleSaveDraft}
               />
             ))}
           </div>
        </div>
      )}

      {/* Drafts Section */}
      {drafts.length > 0 && (
        <div className="border-t border-gray-200 pt-8 animate-fade-in">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <Archive className="text-orange-500 mr-2" />
            草稿箱 ({drafts.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drafts.map((draft) => (
              <div key={draft.id} className="relative group">
                <ResultCard note={draft.note} />
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 p-1 rounded-lg backdrop-blur-sm border border-gray-200 shadow-sm">
                  <button 
                    onClick={() => handleDeleteDraft(draft.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors"
                    title="删除草稿"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="absolute bottom-3 right-4 text-[10px] text-gray-400 bg-white/90 px-2 py-1 rounded-full border border-gray-100">
                  {new Date(draft.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};