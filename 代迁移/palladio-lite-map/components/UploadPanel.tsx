
import React, { useCallback, useState } from 'react';
import { useMapContext } from '../services/MapContext';
import { parseCSV } from '../utils/csvParser';
import { UploadCloud, AlertCircle, ChevronLeft } from 'lucide-react';

export const UploadPanel: React.FC = () => {
  const { setRawData, setColumns, setIsSidebarOpen } = useMapContext();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError("请上传有效的 CSV 文件。");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { data, columns } = await parseCSV(file);
      setColumns(columns);
      setRawData(data);
    } catch (err: any) {
      setError(err.message || "CSV 解析失败");
    } finally {
      setLoading(false);
    }
  }, [setRawData, setColumns]);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="flex flex-col h-full">
        {/* Header to match Sidebar */}
        <div className="h-16 border-b border-palladio-border flex items-center justify-between px-6 shrink-0 bg-gray-50/50">
            <h1 className="font-serif text-xl font-bold text-gray-800 tracking-tight">Palladio-Lite</h1>
            <button 
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 text-gray-400 hover:text-palladio-blue hover:bg-gray-100 rounded transition-colors"
                title="收起侧边栏"
            >
            <ChevronLeft size={20} />
            </button>
        </div>

        <div className="p-6 flex flex-col items-center justify-center flex-1 text-center">
        <div 
            className={`w-full max-w-xs p-8 border-2 border-dashed rounded-lg transition-colors duration-200 cursor-pointer
            ${isDragging ? 'border-palladio-blue bg-blue-50' : 'border-gray-300 hover:border-palladio-blue'}
            ${loading ? 'opacity-50 pointer-events-none' : ''}
            `}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => document.getElementById('file-input')?.click()}
        >
            <UploadCloud className="w-10 h-10 mx-auto text-gray-400 mb-4" />
            <h3 className="text-sm font-bold text-gray-700 mb-1">拖放 CSV 文件</h3>
            <p className="text-xs text-gray-500 mb-4">或点击浏览</p>
            <input 
            type="file" 
            id="file-input" 
            className="hidden" 
            accept=".csv"
            onChange={(e) => handleFiles(e.target.files)}
            />
        </div>

        {error && (
            <div className="mt-4 flex items-center text-xs text-red-600 bg-red-50 p-2 rounded w-full max-w-xs text-left">
            <AlertCircle size={14} className="mr-2 shrink-0" />
            {error}
            </div>
        )}

        <div className="mt-8 text-left w-full max-w-xs">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">文件要求</h4>
            <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
            <li>仅限 CSV 格式</li>
            <li>必须包含 <code>lat</code>/<code>latitude</code> 和 <code>lng</code>/<code>longitude</code> 列</li>
            <li>第一行为表头</li>
            </ul>
        </div>
        
        <div className="mt-8 pt-6 border-t border-dashed border-gray-200 w-full max-w-xs">
            <p className="text-xs text-gray-400 italic">
                演示数据: 尝试下载包含城市或考古遗址的 CSV 样本。
            </p>
        </div>
        </div>
    </div>
  );
};
