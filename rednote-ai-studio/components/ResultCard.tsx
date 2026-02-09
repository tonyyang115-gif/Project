import React, { useState, useEffect } from 'react';
import { Copy, Check, Edit2, Save, X, Sparkles, Send, Loader2, FileDown } from 'lucide-react';
import { GeneratedNote } from '../types';

interface ResultCardProps {
  note: GeneratedNote;
  onUpdate?: (updatedNote: GeneratedNote) => void;
  onRefine?: (instruction: string) => Promise<void>;
  onSaveDraft?: (note: GeneratedNote) => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({ note, onUpdate, onRefine, onSaveDraft }) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Refine Mode State
  const [showRefineInput, setShowRefineInput] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  
  // Local state for editing form
  const [editForm, setEditForm] = useState<GeneratedNote>(note);
  // Separate state for tags string input to make editing easier
  const [tagsInput, setTagsInput] = useState("");

  // Sync state when prop changes
  useEffect(() => {
    // Only update form from props if NOT editing, to prevent overwriting user work
    if (!isEditing) {
      setEditForm(note);
      setTagsInput((note.tags || []).join(" "));
    }
  }, [note, isEditing]);

  const handleCopy = () => {
    const currentState = isEditing ? getProcessedState() : note;
    const tags = Array.isArray(currentState.tags) ? currentState.tags : [];
    const fullText = `${currentState.title}\n\n${currentState.content}\n\n${tags.map(t => `#${t}`).join(' ')}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startEditing = () => {
    setEditForm(note);
    setTagsInput((note.tags || []).join(" ")); // Join with space for cleaner editing
    setIsEditing(true);
    setShowRefineInput(false); // Close refine if open
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditForm(note); // Revert
  };

  // Helper to get current state (handling tag processing)
  const getProcessedState = (): GeneratedNote => {
    const processedTags = tagsInput
      .split(/[,，\s]+/)
      .map(t => t.trim())
      .filter(t => t.length > 0);

    return {
      ...editForm,
      tags: processedTags
    };
  };

  const saveEditing = () => {
    const updatedNote = getProcessedState();
    if (onUpdate) {
      onUpdate(updatedNote);
    }
    setIsEditing(false);
  };
  
  const handleSaveDraft = () => {
    if (!onSaveDraft) return;
    // If editing, save the current work-in-progress. If viewing, save the note as is.
    const noteToSave = isEditing ? getProcessedState() : note;
    onSaveDraft(noteToSave);
  };

  const handleRefineSubmit = async () => {
    if (!refineInstruction.trim() || !onRefine) return;
    
    setIsRefining(true);
    try {
      await onRefine(refineInstruction);
      setRefineInstruction(''); // Clear input on success
      setShowRefineInput(false); // Close input
    } catch (e) {
      // Error handling is typically done in parent or global toast
      alert("优化失败，请重试");
    } finally {
      setIsRefining(false);
    }
  };

  // Safe access for display
  const displayTags = isEditing 
    ? [] // handled by input
    : (Array.isArray(note.tags) ? note.tags : []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300 relative">
      {/* Loading Overlay for Refining */}
      {isRefining && (
        <div className="absolute inset-0 bg-white/80 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
          <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-2" />
          <p className="text-purple-600 font-medium animate-pulse">AI 正在优化内容...</p>
        </div>
      )}

      {/* Header Area */}
      <div className="bg-gradient-to-r from-rednote-50 to-white p-4 border-b border-gray-100 flex justify-between items-start gap-4">
        <div className="flex items-center space-x-3 flex-1">
          <span className="text-3xl shadow-sm bg-white rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
            {note.emoji}
          </span>
          
          {isEditing ? (
             <input 
               type="text" 
               value={editForm.title}
               onChange={(e) => setEditForm({...editForm, title: e.target.value})}
               className="w-full text-lg font-bold text-gray-800 border-b-2 border-rednote-300 bg-transparent outline-none px-1 py-1"
               placeholder="请输入标题"
             />
          ) : (
             <h3 className="font-bold text-gray-800 leading-tight line-clamp-2">{note.title}</h3>
          )}
        </div>

        <div className="flex items-center space-x-1 flex-shrink-0">
          {/* Common Actions */}
          {onSaveDraft && (
            <button
              onClick={handleSaveDraft}
              className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
              title="保存为草稿 (稍后编辑)"
            >
              <FileDown size={18} />
            </button>
          )}

          {isEditing ? (
            <>
              <button 
                onClick={saveEditing}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="完成编辑"
              >
                <Save size={18} />
              </button>
              <button 
                onClick={cancelEditing}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                title="取消编辑"
              >
                <X size={18} />
              </button>
            </>
          ) : (
            <>
              {onRefine && (
                <button
                  onClick={() => setShowRefineInput(!showRefineInput)}
                  className={`p-2 rounded-lg transition-colors ${showRefineInput ? 'text-purple-600 bg-purple-50' : 'text-gray-400 hover:text-purple-500 hover:bg-purple-50'}`}
                  title="AI 优化 (修改建议)"
                >
                  <Sparkles size={18} />
                </button>
              )}
              {onUpdate && (
                <button 
                  onClick={startEditing}
                  className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  title="编辑内容"
                >
                  <Edit2 size={18} />
                </button>
              )}
              <button 
                onClick={handleCopy}
                className="p-2 text-gray-400 hover:text-rednote-500 hover:bg-rednote-50 rounded-lg transition-colors"
                title="复制完整内容"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Refine Input Section */}
      {showRefineInput && !isEditing && (
        <div className="bg-purple-50 p-3 border-b border-purple-100 animate-slide-down">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={refineInstruction}
              onChange={(e) => setRefineInstruction(e.target.value)}
              placeholder="想怎么改？例如：语气更幽默点、缩短正文、多加点Emoji..."
              className="flex-1 border border-purple-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 bg-white"
              onKeyDown={(e) => e.key === 'Enter' && handleRefineSubmit()}
            />
            <button
              onClick={handleRefineSubmit}
              disabled={!refineInstruction.trim() || isRefining}
              className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {isRefining ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="p-4 space-y-4">
        {isEditing ? (
          <textarea
            value={editForm.content}
            onChange={(e) => setEditForm({...editForm, content: e.target.value})}
            className="w-full h-96 p-3 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl focus:border-rednote-500 focus:ring-1 focus:ring-rednote-200 outline-none resize-y leading-relaxed"
            placeholder="在此编辑正文内容..."
          />
        ) : (
          <div className="text-gray-600 text-sm whitespace-pre-line leading-relaxed min-h-[100px]">
            {note.content}
          </div>
        )}
        
        {/* Tags Area */}
        <div className="pt-2">
          {isEditing ? (
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase">标签 (用空格或逗号分隔)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full p-2 text-sm border-b border-gray-200 focus:border-blue-500 outline-none text-blue-600 bg-transparent"
                placeholder="tag1 tag2 tag3"
              />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {displayTags.length > 0 ? displayTags.map((tag, idx) => (
                <span key={idx} className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  #{tag}
                </span>
              )) : <span className="text-xs text-gray-400">无标签</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};