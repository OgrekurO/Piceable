
import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Annotation } from '../types';

interface AnnotationFormProps {
  isOpen: boolean;
  initialData?: Partial<Annotation>;
  onSubmit: (data: { label: string; note: string; category: Annotation['category'] }) => void;
  onCancel: () => void;
  location?: { lat: number; lng: number };
}

export const AnnotationForm: React.FC<AnnotationFormProps> = ({ isOpen, initialData, onSubmit, onCancel, location }) => {
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<Annotation['category']>('default');

  useEffect(() => {
    if (isOpen) {
        setLabel(initialData?.label || '');
        setNote(initialData?.note || '');
        setCategory(initialData?.category || 'default');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/20 backdrop-blur-sm pointer-events-auto">
      <div className="bg-white rounded-lg shadow-xl w-80 overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-200">
        <div className="bg-palladio-blue text-white px-4 py-3 flex justify-between items-center">
            <h3 className="font-serif font-bold text-base">
                {initialData?.id ? '编辑标注' : '新建标注'}
            </h3>
            <button onClick={onCancel} className="text-white/80 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
            {location && (
                <div className="text-[11px] text-gray-500 bg-gray-50 p-2 rounded border border-gray-100 font-mono">
                    坐标: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                </div>
            )}
            <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">名称</label>
                <input 
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-palladio-blue focus:ring-1 focus:ring-palladio-blue outline-none transition-shadow"
                    value={label}
                    onChange={e => setLabel(e.target.value)}
                    placeholder="地点名称..."
                    autoFocus
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">分类</label>
                <select 
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-palladio-blue outline-none bg-white"
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                >
                    <option value="default">📍 一般</option>
                    <option value="landmark">🏛️ 地标</option>
                    <option value="home">🏠 居住地</option>
                    <option value="work">💼 工作</option>
                    <option value="flag">🚩 标记</option>
                </select>
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">备注</label>
                <textarea 
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-palladio-blue focus:ring-1 focus:ring-palladio-blue outline-none h-20 resize-none transition-shadow"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="添加详细描述或笔记..."
                />
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
                <button onClick={onCancel} className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors">取消</button>
                <button 
                    onClick={() => onSubmit({ label, note, category })} 
                    className="px-4 py-2 text-sm bg-palladio-blue text-white rounded hover:bg-blue-700 flex items-center shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!label.trim()}
                >
                    <Save size={14} className="mr-1" /> 保存
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};