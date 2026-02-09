import React, { useState, useEffect, useRef } from 'react';
import { PromptConfig, GeneratedNote, SavedPromptConfig } from '../types';
import { DEFAULT_PROMPT_CONFIG } from '../constants';
import { generateNoteFromTopic, refineNote } from '../services/geminiService';
import { ResultCard } from './ResultCard';
import { 
  Settings2, Sparkles, Loader2, ChevronDown, ChevronUp, 
  Save, RotateCcw, Download, Upload, Trash2, Plus, FileJson, Square, FileText
} from 'lucide-react';

const LABEL_MAP: Record<keyof PromptConfig, string> = {
  role: "角色设定",
  task: "核心任务",
  goal: "核心目标",
  strategy: "算法策略",
  framework: "内容与框架",
  tags: "标签策略",
  format: "输出格式"
};

const STORAGE_KEY = 'rednote_saved_configs_v2';
const DEFAULT_CONFIG_ID = 'system_default';

export const PromptGenerator: React.FC = () => {
  const [topic, setTopic] = useState('');
  
  // Source Article State
  const [useSourceArticle, setUseSourceArticle] = useState(false);
  const [sourceArticleContent, setSourceArticleContent] = useState('');

  // Config Management States
  const [savedConfigs, setSavedConfigs] = useState<SavedPromptConfig[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<string>(DEFAULT_CONFIG_ID);
  const [currentConfig, setCurrentConfig] = useState<PromptConfig>(DEFAULT_PROMPT_CONFIG);
  
  const [showConfig, setShowConfig] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedNote | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load configs from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setSavedConfigs(parsed);
      } catch (e) {
        console.error("Failed to parse saved configs", e);
      }
    }
  }, []);

  // Handle configuration selection switch
  const handleConfigSelect = (id: string) => {
    setSelectedConfigId(id);
    if (id === DEFAULT_CONFIG_ID) {
      setCurrentConfig(DEFAULT_PROMPT_CONFIG);
    } else {
      const found = savedConfigs.find(c => c.id === id);
      if (found) {
        setCurrentConfig(found.config);
      }
    }
  };

  const handleConfigFieldChange = (key: keyof PromptConfig, value: string) => {
    setCurrentConfig(prev => ({ ...prev, [key]: value }));
  };

  // Create New / Save As
  const handleSaveAs = () => {
    const name = window.prompt("请为当前配置命名：", "我的爆款模版");
    if (!name) return;

    const newId = Date.now().toString();
    const newSavedConfig: SavedPromptConfig = {
      id: newId,
      name,
      config: currentConfig,
      lastUpdated: Date.now()
    };

    const updatedList = [...savedConfigs, newSavedConfig];
    setSavedConfigs(updatedList);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    setSelectedConfigId(newId);
    alert(`配置 "${name}" 已保存！`);
  };

  // Update existing
  const handleSaveUpdate = () => {
    if (selectedConfigId === DEFAULT_CONFIG_ID) {
      handleSaveAs(); // Default cannot be overwritten, redirect to Save As
      return;
    }

    const updatedList = savedConfigs.map(item => {
      if (item.id === selectedConfigId) {
        return { ...item, config: currentConfig, lastUpdated: Date.now() };
      }
      return item;
    });

    setSavedConfigs(updatedList);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    alert("当前配置已更新！");
  };

  // Delete config
  const handleDelete = () => {
    if (selectedConfigId === DEFAULT_CONFIG_ID) return;
    
    if (confirm("确定要删除这个配置吗？此操作无法撤销。")) {
      const updatedList = savedConfigs.filter(c => c.id !== selectedConfigId);
      setSavedConfigs(updatedList);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
      handleConfigSelect(DEFAULT_CONFIG_ID);
    }
  };

  // Export to JSON
  const handleExport = () => {
    const dataStr = JSON.stringify(savedConfigs, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rednote_configs_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import from JSON
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (Array.isArray(importedData)) {
          // Simple merge strategy: append imported ones, generate new IDs to avoid conflict
          const newConfigs = importedData.map((c: any) => ({
            ...c,
            id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: `${c.name} (导入)`
          }));
          
          const merged = [...savedConfigs, ...newConfigs];
          setSavedConfigs(merged);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          alert(`成功导入 ${newConfigs.length} 个配置！`);
        } else {
          alert("文件格式不正确，请上传有效的配置导出文件。");
        }
      } catch (err) {
        console.error("Import failed", err);
        alert("导入失败：文件解析错误。");
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleResetToDefault = () => {
    if (confirm("确定要重置当前视图为默认配置吗？未保存的修改将丢失。")) {
      setCurrentConfig(DEFAULT_PROMPT_CONFIG);
      setSelectedConfigId(DEFAULT_CONFIG_ID);
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    
    // Cancel previous request if exists (defensive)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsGenerating(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Pass source article if enabled
      const articleToUse = useSourceArticle ? sourceArticleContent : undefined;
      const note = await generateNoteFromTopic(topic, currentConfig, articleToUse, controller.signal);
      setResult(note);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Ignored, user stopped
        console.log("Generation stopped by user");
      } else {
        alert("生成失败，请重试。");
      }
    } finally {
      // Only set loading to false if this is the active controller
      if (abortControllerRef.current === controller) {
        setIsGenerating(false);
        abortControllerRef.current = null;
      }
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
  };

  const handleNoteUpdate = (updatedNote: GeneratedNote) => {
    setResult(updatedNote);
  };

  // AI Refinement Handler
  const handleRefine = async (instruction: string) => {
    if (!result) return;
    
    // We don't use global 'isGenerating' here because the card handles its own loading state visually
    const controller = new AbortController();
    
    try {
      const updatedNote = await refineNote(result, instruction, currentConfig, controller.signal);
      setResult(updatedNote);
    } catch (error) {
      console.error("Refine failed", error);
      throw error; // Re-throw so card knows to show error
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-bold text-gray-900">小红书爆款生成器</h2>
        <p className="text-gray-500">输入主题，一键生成完美排版的小红书笔记。</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        {/* Main Input */}
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-gray-700">笔记主题是什么？</label>
          <div className="relative">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="例如：技术管理者如何克服'冒充者综合症'"
              className="w-full px-4 py-4 rounded-xl border border-gray-200 focus:border-rednote-500 focus:ring-2 focus:ring-rednote-200 outline-none transition-all text-lg"
              onKeyDown={(e) => e.key === 'Enter' && !isGenerating && handleGenerate()}
            />
            
            {isGenerating ? (
              <button
                onClick={handleStop}
                className="absolute right-2 top-2 bottom-2 bg-gray-900 text-white px-6 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center space-x-2 animate-pulse"
              >
                <Square size={16} fill="currentColor" />
                <span>停止生成</span>
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={!topic.trim()}
                className="absolute right-2 top-2 bottom-2 bg-rednote-500 text-white px-6 rounded-lg font-medium hover:bg-rednote-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                <Sparkles size={20} />
                <span>立即生成</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Source Article Toggle Section */}
        <div className="mt-4 space-y-2">
           <div className="flex items-center space-x-2">
             <input
               type="checkbox"
               id="useSource"
               checked={useSourceArticle}
               onChange={(e) => setUseSourceArticle(e.target.checked)}
               className="w-4 h-4 text-rednote-600 bg-gray-100 border-gray-300 rounded focus:ring-rednote-500 focus:ring-2"
             />
             <label htmlFor="useSource" className="text-sm font-medium text-gray-700 flex items-center cursor-pointer select-none">
               <FileText size={16} className="mr-1 text-gray-500" />
               参考来源文章 (AI将提取核心观点进行二创)
             </label>
           </div>
           
           <textarea
             value={sourceArticleContent}
             onChange={(e) => setSourceArticleContent(e.target.value)}
             disabled={!useSourceArticle}
             placeholder={useSourceArticle ? "请在此粘贴参考文章内容..." : "勾选上方选项以启用参考文章输入"}
             className={`w-full p-3 rounded-lg border text-sm transition-colors outline-none h-32 resize-y ${
               useSourceArticle 
                 ? 'bg-white border-gray-300 focus:border-rednote-500 focus:ring-1 focus:ring-rednote-200 text-gray-800' 
                 : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
             }`}
           />
        </div>

        {/* Configuration Toolbar */}
        <div className="mt-6 border-t border-gray-100 pt-4">
          <div className="flex flex-col space-y-4">
            <button 
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center text-gray-500 hover:text-rednote-500 transition-colors text-sm font-medium w-fit"
            >
              <Settings2 size={16} className="mr-2" />
              <span>自定义提示词逻辑</span>
              {showConfig ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
            </button>
            
            {showConfig && (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 animate-slide-down">
                {/* Tools Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-gray-200 pb-4">
                  <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
                    <FileJson size={18} className="text-gray-400" />
                    <select 
                      value={selectedConfigId}
                      onChange={(e) => handleConfigSelect(e.target.value)}
                      className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-rednote-500 focus:border-rednote-500 block w-full p-2.5"
                    >
                      <option value={DEFAULT_CONFIG_ID}>系统默认配置 (IT高管博主)</option>
                      {savedConfigs.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Action Buttons */}
                    <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1">
                      <button
                        onClick={handleSaveUpdate}
                        className={`p-2 rounded-md hover:bg-green-50 text-gray-600 hover:text-green-600 transition-colors ${selectedConfigId === DEFAULT_CONFIG_ID ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="保存当前修改"
                        disabled={selectedConfigId === DEFAULT_CONFIG_ID}
                      >
                        <Save size={18} />
                      </button>
                      <button
                        onClick={handleSaveAs}
                        className="p-2 rounded-md hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-colors"
                        title="另存为新配置"
                      >
                        <Plus size={18} />
                      </button>
                       <button
                        onClick={handleDelete}
                        className={`p-2 rounded-md hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors ${selectedConfigId === DEFAULT_CONFIG_ID ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="删除当前配置"
                        disabled={selectedConfigId === DEFAULT_CONFIG_ID}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="w-px h-8 bg-gray-200 mx-2"></div>

                    <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1">
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept=".json" 
                        className="hidden" 
                      />
                      <button
                        onClick={handleImportClick}
                        className="p-2 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
                        title="导入配置 (JSON)"
                      >
                        <Upload size={18} />
                      </button>
                      <button
                        onClick={handleExport}
                        className="p-2 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
                        title="导出所有配置 (JSON)"
                      >
                        <Download size={18} />
                      </button>
                    </div>
                    
                    <button
                        onClick={handleResetToDefault}
                        className="p-2 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors ml-2"
                        title="重置为系统默认"
                      >
                        <RotateCcw size={18} />
                      </button>
                  </div>
                </div>

                {/* Edit Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(currentConfig).map(([key, value]) => (
                    <div key={key} className={`space-y-2 ${key === 'format' ? 'md:col-span-2' : ''}`}>
                      <label className="block text-xs uppercase tracking-wider font-bold text-gray-400">
                        {LABEL_MAP[key as keyof PromptConfig] || key}
                      </label>
                      <textarea
                        value={value}
                        onChange={(e) => handleConfigFieldChange(key as keyof PromptConfig, e.target.value)}
                        className="w-full p-3 rounded-lg border border-gray-200 text-sm focus:border-rednote-500 outline-none min-h-[120px] leading-relaxed resize-y"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Result Area */}
      {result && (
        <div className="animate-slide-up">
           <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Sparkles className="text-rednote-500 mr-2" size={20} />
            生成结果
           </h3>
           <ResultCard 
            note={result} 
            onUpdate={handleNoteUpdate} 
            onRefine={handleRefine} // Pass refine handler
           />
        </div>
      )}
    </div>
  );
};