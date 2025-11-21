
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useMapContext } from '../services/MapContext';
import { parseCSV } from '../utils/csvParser';
import { 
  Search, Bookmark, MapPin, UploadCloud, Share2, 
  ChevronDown, ChevronRight, Trash2, Plus, Download, ExternalLink, ChevronLeft, X, Loader2, Edit2, Check, Save,
  PieChart, GitMerge, Eye, EyeOff
} from 'lucide-react';
import { Bookmark as BookmarkType } from '../types';

// Module Header Component
const ModuleHeader: React.FC<{ 
  title: string; 
  icon: React.ReactNode; 
  isOpen: boolean; 
  onToggle: () => void 
}> = ({ title, icon, isOpen, onToggle }) => (
  <button 
    onClick={onToggle}
    className="w-full flex items-center justify-between p-4 bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors"
  >
    <div className="flex items-center text-gray-700 font-medium">
      <span className="mr-2 text-palladio-blue">{icon}</span>
      {title}
    </div>
    {isOpen ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
  </button>
);

export const Sidebar: React.FC = () => {
  const { 
    rawData, setRawData, setColumns, columns,
    searchTerm, setSearchTerm, filteredData, setSelectedRecordId,
    setIsSidebarOpen,
    bookmarks, addBookmark, updateBookmark, removeBookmark,
    annotations, removeAnnotation, isAnnotationMode, setIsAnnotationMode,
    currentView, activeLayer, setActiveLayer,
    setSearchResult, searchResult,
    groupByColumn, setGroupByColumn, categoryColors, hiddenCategories, toggleCategoryVisibility, relationColumn
  } = useMapContext();

  // Accordion State
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({
    'search': true,
    'viz': true,
    'bookmarks': false,
    'annotations': false,
    'data': false,
    'export': false
  });

  const toggleModule = (key: string) => {
    setOpenModules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // --- Search Logic (Autocomplete) ---
  const [addressQuery, setAddressQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAddressQuery(val);
    
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    if (val.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&addressdetails=1&limit=5&accept-language=zh`);
        const data = await res.json();
        setSuggestions(data);
      } catch (e) {
        console.error("Search failed", e);
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms Debounce
  };

  const handleSelectSuggestion = (item: any) => {
    setAddressQuery(item.display_name.split(',')[0]); // Simplified name for input
    setSuggestions([]);
    
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);

    // Update Context State
    setSearchResult({
      lat,
      lng,
      label: item.display_name.split(',')[0],
      address: item.display_name,
      type: item.type
    });

    // Fly to location
    window.dispatchEvent(new CustomEvent('map:flyTo', { detail: { lat, lng, zoom: 13 } }));
  };

  const clearSearch = () => {
    setAddressQuery('');
    setSuggestions([]);
    setSearchResult(null);
  };

  // --- Bookmark Logic ---
  const [isAddingBookmark, setIsAddingBookmark] = useState(false);
  const [newBookmarkName, setNewBookmarkName] = useState('');
  const [editingBookmarkId, setEditingBookmarkId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAddBookmark = () => {
    if (!newBookmarkName.trim()) return;
    addBookmark(newBookmarkName, { ...currentView, layer: activeLayer });
    setNewBookmarkName('');
    setIsAddingBookmark(false);
  };

  const startEditBookmark = (b: BookmarkType) => {
    setEditingBookmarkId(b.id);
    setEditName(b.name);
  };

  const saveEditBookmark = () => {
    if (editingBookmarkId && editName.trim()) {
        updateBookmark(editingBookmarkId, editName);
        setEditingBookmarkId(null);
    }
  };

  const handleRestoreBookmark = (b: BookmarkType) => {
    if (editingBookmarkId) return; // Don't restore if editing
    setActiveLayer(b.view.layer); // Restore layer
    window.dispatchEvent(new CustomEvent('map:flyTo', { 
        detail: { 
            lat: b.view.center[0], 
            lng: b.view.center[1], 
            zoom: b.view.zoom 
        } 
    }));
  };

  // --- CSV Logic ---
  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      const { data, columns } = await parseCSV(files[0]);
      setColumns(columns);
      setRawData(data);
    } catch (err) {
      alert("CSV 解析错误");
    }
  }, [setRawData, setColumns]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="h-16 border-b border-palladio-border flex items-center justify-between px-4 shrink-0 bg-gray-50">
        <h1 className="font-serif text-lg font-bold text-gray-800">Palladio-Lite</h1>
        {/* Collapse Button aligned with title */}
        <button 
          onClick={() => setIsSidebarOpen(false)}
          className="p-2 text-gray-500 hover:text-palladio-blue hover:bg-gray-200 rounded-full transition-colors"
          title="收起侧边栏"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        
        {/* 1. Search / Retrieval */}
        <ModuleHeader 
          title="地理信息检索" 
          icon={<Search size={18} />} 
          isOpen={openModules['search']} 
          onToggle={() => toggleModule('search')} 
        />
        {openModules['search'] && (
          <div className="p-4 bg-gray-50/50 border-b border-gray-100 space-y-4 relative z-50">
             {/* Search Input Container */}
             <div className="relative">
               <input 
                 className="w-full border border-gray-300 rounded px-3 py-2 pr-10 text-sm focus:border-palladio-blue focus:ring-1 focus:ring-palladio-blue outline-none transition-shadow"
                 placeholder="搜索地点、地址或坐标..."
                 value={addressQuery}
                 onChange={handleSearchInput}
               />
               <div className="absolute right-2 top-2.5 text-gray-400">
                 {isSearching ? (
                   <Loader2 size={16} className="animate-spin" />
                 ) : addressQuery ? (
                   <button onClick={clearSearch} className="hover:text-gray-600"><X size={16} /></button>
                 ) : (
                   <Search size={16} />
                 )}
               </div>

               {/* Autocomplete Dropdown */}
               {suggestions.length > 0 && (
                 <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-[1000] max-h-60 overflow-y-auto">
                   {suggestions.map((res, i) => (
                     <div 
                       key={i} 
                       className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-50 last:border-0 flex flex-col"
                       onClick={() => handleSelectSuggestion(res)}
                     >
                       <span className="font-medium text-gray-800">{res.display_name.split(',')[0]}</span>
                       <span className="text-[10px] text-gray-500 truncate">{res.display_name}</span>
                     </div>
                   ))}
                 </div>
               )}
             </div>

             {/* Quick POI Buttons */}
             <div className="pt-2 border-t border-gray-200">
                <div className="text-xs font-bold text-gray-400 mb-2 uppercase">快速搜索 (POI)</div>
                <div className="flex flex-wrap gap-2">
                  {['博物馆', '学校', '公园', '医院', '餐厅', '古迹', '地铁站'].map(poi => (
                    <button 
                      key={poi}
                      onClick={() => { 
                        setAddressQuery(poi); 
                        handleSearchInput({ target: { value: poi } } as any);
                      }}
                      className="px-2 py-1 bg-white border border-gray-300 rounded text-xs hover:border-palladio-blue hover:text-palladio-blue text-gray-600 transition-colors"
                    >
                      {poi}
                    </button>
                  ))}
                </div>
             </div>
          </div>
        )}

        {/* 2. Visualization & Analysis (NEW) */}
        <ModuleHeader 
          title="可视化与分析" 
          icon={<PieChart size={18} />} 
          isOpen={openModules['viz']} 
          onToggle={() => toggleModule('viz')} 
        />
        {openModules['viz'] && (
          <div className="p-4 bg-gray-50/50 border-b border-gray-100 space-y-4">
            {rawData.length === 0 ? (
                <div className="text-xs text-gray-400 italic text-center py-2">请先上传数据以使用分析功能</div>
            ) : (
                <>
                {/* Group By Control */}
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">分类着色 (Group By)</label>
                    <select 
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 bg-white focus:border-palladio-blue outline-none"
                        value={groupByColumn || ''}
                        onChange={(e) => setGroupByColumn(e.target.value || null)}
                    >
                        <option value="">-- 默认 (统一颜色) --</option>
                        {columns.filter(c => !['lat','lng','id','latitude','longitude'].includes(c.toLowerCase())).map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>

                {/* Legend & Faceting */}
                {groupByColumn && (
                    <div className="bg-white border border-gray-200 rounded p-3 max-h-60 overflow-y-auto custom-scrollbar">
                        <div className="text-xs font-bold text-gray-500 mb-2 flex justify-between items-center">
                            <span>图例与筛选 ({Object.keys(categoryColors).length})</span>
                        </div>
                        <div className="space-y-1">
                            {Object.entries(categoryColors).map(([val, color]) => {
                                const isHidden = hiddenCategories.includes(val);
                                return (
                                    <div 
                                        key={val} 
                                        className={`flex items-center gap-2 text-sm p-1 rounded hover:bg-gray-50 cursor-pointer ${isHidden ? 'opacity-50' : ''}`}
                                        onClick={() => toggleCategoryVisibility(val)}
                                    >
                                        <div 
                                            className="w-3 h-3 rounded-full shrink-0 border border-black/10" 
                                            style={{ backgroundColor: color }}
                                        />
                                        <span className="flex-1 truncate" title={val}>{val}</span>
                                        <span className="text-gray-400">
                                            {isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Relation Info */}
                {relationColumn && (
                    <div className="flex items-center text-xs text-palladio-blue bg-blue-50 p-2 rounded border border-blue-100">
                        <GitMerge size={14} className="mr-2" />
                        <span>检测到关联字段 "{relationColumn}"，已自动绘制连线。</span>
                    </div>
                )}
                </>
            )}
          </div>
        )}

        {/* 3. Bookmarks */}
        <ModuleHeader 
          title="书签 / 收藏" 
          icon={<Bookmark size={18} />} 
          isOpen={openModules['bookmarks']} 
          onToggle={() => toggleModule('bookmarks')} 
        />
        {openModules['bookmarks'] && (
          <div className="p-4 bg-gray-50/50 border-b border-gray-100">
            {/* Add Bookmark UI */}
            {!isAddingBookmark ? (
                <button 
                    onClick={() => setIsAddingBookmark(true)}
                    className="w-full mb-3 flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:text-palladio-blue hover:border-palladio-blue transition-colors shadow-sm"
                >
                    <Plus size={16} className="mr-2"/> 收藏当前视角
                </button>
            ) : (
                <div className="mb-4 p-3 bg-white border border-palladio-blue rounded shadow-sm animate-in fade-in slide-in-from-top-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">命名新书签</label>
                    <input 
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mb-2 focus:outline-none focus:border-palladio-blue"
                        placeholder="例如: 研究区域 A..."
                        value={newBookmarkName}
                        onChange={e => setNewBookmarkName(e.target.value)}
                        autoFocus
                    />
                    <div className="flex justify-end gap-2">
                        <button 
                            onClick={() => setIsAddingBookmark(false)}
                            className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded"
                        >
                            取消
                        </button>
                        <button 
                            onClick={handleAddBookmark}
                            disabled={!newBookmarkName.trim()}
                            className="px-2 py-1 text-xs bg-palladio-blue text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            保存
                        </button>
                    </div>
                </div>
            )}

            {/* Bookmarks List */}
            <div className="space-y-2">
              {bookmarks.length === 0 && !isAddingBookmark && (
                 <div className="text-xs text-gray-400 text-center py-4 italic">
                    暂无收藏视图. 移动地图并点击上方按钮保存.
                 </div>
              )}
              {bookmarks.map(b => (
                <div key={b.id} className="group bg-white p-2 rounded border border-gray-200 shadow-sm hover:shadow-md transition-all">
                   {editingBookmarkId === b.id ? (
                       /* Edit Mode */
                       <div className="flex items-center gap-2">
                           <input 
                               className="flex-1 border border-blue-300 rounded px-1 py-0.5 text-sm focus:outline-none"
                               value={editName}
                               onChange={e => setEditName(e.target.value)}
                               autoFocus
                           />
                           <button onClick={saveEditBookmark} className="text-green-600 p-1 hover:bg-green-50 rounded">
                               <Check size={14} />
                           </button>
                           <button onClick={() => setEditingBookmarkId(null)} className="text-gray-400 p-1 hover:bg-gray-100 rounded">
                               <X size={14} />
                           </button>
                       </div>
                   ) : (
                       /* View Mode */
                       <div className="flex justify-between items-center">
                            <div 
                                className="flex-1 cursor-pointer"
                                onClick={() => handleRestoreBookmark(b)}
                            >
                                <div className="text-sm font-bold text-gray-700 flex items-center">
                                    <Bookmark size={12} className="mr-1.5 text-palladio-gold" fill="currentColor" />
                                    {b.name}
                                </div>
                                <div className="text-[10px] text-gray-400 pl-4 mt-0.5">
                                    缩放: {b.view.zoom.toFixed(1)} | {b.view.layer === 'streets' ? '街道' : b.view.layer === 'satellite' ? '卫星' : '自定义'}
                                </div>
                            </div>
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); startEditBookmark(b); }} 
                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded mr-1"
                                    title="重命名"
                                >
                                    <Edit2 size={12} />
                                </button>
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        if(window.confirm(`确定删除书签 "${b.name}"?`)) removeBookmark(b.id); 
                                    }} 
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                    title="删除"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                       </div>
                   )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Annotations */}
        <ModuleHeader 
          title="标注与标记" 
          icon={<MapPin size={18} />} 
          isOpen={openModules['annotations']} 
          onToggle={() => toggleModule('annotations')} 
        />
        {openModules['annotations'] && (
          <div className="p-4 bg-gray-50/50 border-b border-gray-100">
            <button 
                onClick={() => setIsAnnotationMode(!isAnnotationMode)}
                className={`w-full mb-3 flex items-center justify-center px-4 py-2 rounded border text-sm font-medium transition-all
                  ${isAnnotationMode 
                    ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' 
                    : 'bg-white border-gray-300 text-gray-700 hover:border-palladio-blue hover:text-palladio-blue'}
                `}
            >
                {isAnnotationMode ? (
                   <>点击地图放置标记 (ESC 取消)</>
                ) : (
                   <><Plus size={16} className="mr-2"/> 新增标注</>
                )}
            </button>

            {isAnnotationMode && (
              <div className="text-xs text-center text-gray-500 mb-3 italic animate-in fade-in">
                鼠标变为十字准星时，点击地图任意位置即可添加。
              </div>
            )}

            <div className="space-y-2">
              {annotations.length === 0 && !isAnnotationMode && <div className="text-xs text-gray-400 text-center py-2">暂无手动标记</div>}
              {annotations.map(a => (
                <div key={a.id} className="flex justify-between items-center bg-white p-2 rounded border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => window.dispatchEvent(new CustomEvent('map:flyTo', { detail: { lat: a.lat, lng: a.lng, zoom: 15 } }))}
                  >
                    <div className="text-sm font-bold text-gray-700 flex items-center">
                       {a.category && a.category !== 'default' && <span className="mr-1 text-[10px] bg-gray-100 px-1 rounded text-gray-500">{
                         a.category === 'landmark' ? '🏛️' :
                         a.category === 'home' ? '🏠' :
                         a.category === 'work' ? '💼' : '🚩'
                       }</span>}
                       {a.label}
                    </div>
                    <div className="text-[10px] text-gray-400 truncate">{a.note || '无备注'}</div>
                  </div>
                  <button 
                      onClick={() => { if(window.confirm('确定删除此标注?')) removeAnnotation(a.id); }} 
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Upload & Data */}
        <ModuleHeader 
          title="数据管理" 
          icon={<UploadCloud size={18} />} 
          isOpen={openModules['data']} 
          onToggle={() => toggleModule('data')} 
        />
        {openModules['data'] && (
          <div className="border-b border-gray-100">
            {/* Upload Area */}
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-palladio-blue transition-colors cursor-pointer bg-white"
                   onClick={() => document.getElementById('csv-upload')?.click()}>
                <UploadCloud className="mx-auto text-gray-400 mb-2" size={24} />
                <div className="text-xs text-gray-600 font-medium">点击上传 CSV 文件</div>
                <input 
                  id="csv-upload" 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  onChange={(e) => handleFiles(e.target.files)} 
                />
              </div>
              {rawData.length > 0 && (
                <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
                  <span>{rawData.length} 条记录</span>
                  <button onClick={() => setRawData([])} className="text-red-500 hover:underline">清空数据</button>
                </div>
              )}
            </div>

            {/* Data Filter & List */}
            {rawData.length > 0 && (
              <div className="flex flex-col max-h-96">
                <div className="p-2 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                    <input 
                      className="w-full pl-8 pr-2 py-1 text-sm border border-gray-200 rounded bg-white focus:outline-none focus:border-palladio-blue"
                      placeholder="筛选数据..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="overflow-y-auto flex-1">
                  {filteredData.slice(0, 100).map(record => (
                    <div 
                      key={record.id}
                      onClick={() => {
                        setSelectedRecordId(record.id);
                        window.dispatchEvent(new CustomEvent('map:flyTo', { detail: { lat: record.lat, lng: record.lng, zoom: 14 } }));
                      }}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0"
                    >
                      <div className="text-sm font-medium text-gray-700 truncate">
                         {record.title || record.name || record.city || 'Record'}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {record.lat.toFixed(2)}, {record.lng.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 6. Export */}
        <ModuleHeader 
          title="导出视图" 
          icon={<Share2 size={18} />} 
          isOpen={openModules['export']} 
          onToggle={() => toggleModule('export')} 
        />
        {openModules['export'] && (
          <div className="p-4 bg-gray-50/50 border-b border-gray-100 space-y-3">
             <button 
               onClick={() => {
                 const url = `${window.location.origin}?lat=${currentView.center[0]}&lng=${currentView.center[1]}&zoom=${currentView.zoom}`;
                 navigator.clipboard.writeText(url);
                 alert('当前视图链接已复制到剪贴板！');
               }}
               className="w-full flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm text-gray-700"
             >
               <ExternalLink size={16} className="mr-2" />
               复制视图链接
             </button>
             
             <button 
               onClick={() => window.print()}
               className="w-full flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm text-gray-700"
             >
               <Download size={16} className="mr-2" />
               打印 / 导出 PDF
             </button>
          </div>
        )}

      </div>
      
      <div className="p-3 bg-gray-100 text-[10px] text-center text-gray-400 shrink-0">
        Palladio-Lite © 2024
      </div>
    </div>
  );
};
