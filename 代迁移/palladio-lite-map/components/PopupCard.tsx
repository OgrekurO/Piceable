
import React, { useEffect, useState } from 'react';
import { DataRecord, Annotation, SearchResult } from '../types';
import { X, ExternalLink, Loader2, Globe, Edit, Trash2, MapPin, Flag, Briefcase, Home, Landmark, Maximize2, Minimize2 } from 'lucide-react';
import { translateRecord } from '../services/ai';

type PopupType = 'record' | 'annotation' | 'search';

interface PopupCardProps {
  data: DataRecord | Annotation | SearchResult;
  type: PopupType;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  targetLanguage?: string;
}

const IMG_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', 'images.weserv.nl'];

// Helper to get category icon for annotations
const getCategoryIcon = (category?: string) => {
  switch (category) {
    case 'landmark': return <Landmark size={14} />;
    case 'home': return <Home size={14} />;
    case 'work': return <Briefcase size={14} />;
    case 'flag': return <Flag size={14} />;
    default: return <MapPin size={14} />;
  }
};

export const PopupCard: React.FC<PopupCardProps> = ({ 
  data, 
  type, 
  onClose, 
  onEdit, 
  onDelete, 
  targetLanguage = 'en' 
}) => {
  const [displayData, setDisplayData] = useState<any>(data);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // --- Translation Logic (Only for Records) ---
  useEffect(() => {
    if (type !== 'record' || !targetLanguage || targetLanguage === 'en') {
      setDisplayData(data);
      return;
    }

    let isMounted = true;
    setIsTranslating(true);

    translateRecord(data as DataRecord, targetLanguage)
      .then(translated => {
        if (isMounted) {
          setDisplayData({ ...data, ...translated });
        }
      })
      .catch(err => console.error(err))
      .finally(() => {
        if (isMounted) setIsTranslating(false);
      });

    return () => { isMounted = false; };
  }, [data, targetLanguage, type]);

  // --- Data Normalization ---
  const getDetails = () => {
    if (type === 'record') {
      const record = displayData as DataRecord;
      const title = record.title || record.name || record.label || record.city || record.site || "详细信息";
      
      // Find Image
      const imageEntry = Object.entries(record).find(([key, val]) => {
        const v = String(val).toLowerCase();
        return (
          (key.toLowerCase().includes('img') || key.toLowerCase().includes('image') || key.toLowerCase().includes('photo')) &&
          (v.startsWith('http') || v.startsWith('data:image'))
        ) || (typeof val === 'string' && IMG_EXTENSIONS.some(ext => val.toLowerCase().includes(ext)));
      });

      // Filter Props
      const props = Object.entries(record).filter(([key]) => 
        !['id', 'lat', 'lng', 'latitude', 'longitude', 'point_x', 'point_y'].includes(key.toLowerCase()) &&
        key !== imageEntry?.[0]
      );

      return { title, imageUrl: imageEntry ? String(imageEntry[1]) : null, props, subtitle: '数据记录' };
    } 
    else if (type === 'annotation') {
      const anno = data as Annotation;
      return { 
        title: anno.label, 
        subtitle: '用户标注',
        imageUrl: null, 
        props: [],
        description: anno.note,
        category: anno.category
      };
    } 
    else { // search
      const search = data as SearchResult;
      return { 
        title: search.label, 
        subtitle: search.type || '搜索结果',
        imageUrl: null, 
        props: [],
        description: search.address
      };
    }
  };

  const { title, subtitle, imageUrl, props, description, category } = getDetails();

  return (
    <div className={`bg-white rounded-none w-72 flex flex-col text-left font-sans shadow-none border-0 transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] w-80' : 'max-h-96'}`}>
      
      {/* Header */}
      <div className="bg-palladio-blue text-white px-4 py-3 flex justify-between items-start shrink-0">
        <div className="flex flex-col min-w-0 mr-2">
            <h3 className="font-serif font-bold text-base leading-tight truncate flex items-center gap-2">
              {type === 'annotation' && <span className="opacity-80">{getCategoryIcon(category)}</span>}
              {title}
            </h3>
            <div className="text-[10px] text-white/70 uppercase tracking-wider font-medium mt-1 flex items-center">
                {subtitle}
                {isTranslating && <><Loader2 size={8} className="animate-spin ml-2 mr-1" /> 翻译中...</>}
                {!isTranslating && type === 'record' && targetLanguage !== 'en' && <><Globe size={8} className="ml-2 mr-1" /> {targetLanguage}</>}
            </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
            <button 
                onClick={() => setIsExpanded(!isExpanded)} 
                className="text-white/70 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
                title={isExpanded ? "收起" : "展开更多"}
            >
                {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            <button onClick={onClose} className="text-white/70 hover:text-white p-1 rounded hover:bg-white/10 transition-colors">
                <X size={16} />
            </button>
        </div>
      </div>
      
      {/* Image Area */}
      {imageUrl && (
        <div className={`w-full bg-gray-100 shrink-0 overflow-hidden relative border-b border-gray-100 transition-all ${isExpanded ? 'h-48' : 'h-32'}`}>
          <img 
            src={imageUrl} 
            alt={title} 
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} 
          />
        </div>
      )}

      {/* Content Area */}
      <div className="p-4 overflow-y-auto text-sm custom-scrollbar flex-1">
        
        {/* Description (Annotation / Search) */}
        {description && (
           <div className="mb-3 text-gray-700 leading-relaxed whitespace-pre-wrap">
             {description}
           </div>
        )}

        {/* Properties Table (Record) */}
        {props.length > 0 && (
            <table className="w-full border-collapse">
            <tbody>
                {props.map(([key, value]) => (
                <tr key={key} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 pr-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider align-top w-1/3">
                    {key.replace(/_/g, ' ')}
                    </td>
                    <td className="py-2 text-gray-800 align-top break-words text-sm">
                    {String(value).startsWith('http') ? (
                        <a href={String(value)} target="_blank" rel="noopener noreferrer" className="text-palladio-blue hover:underline inline-flex items-center break-all">
                            链接 <ExternalLink size={10} className="ml-1 shrink-0" />
                        </a>
                    ) : (
                        isTranslating ? <span className="text-gray-300 animate-pulse">...</span> : String(value)
                    )}
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        )}
      </div>
      
      {/* Actions Footer */}
      <div className="bg-gray-50 px-3 py-2 border-t border-gray-100 flex items-center justify-between shrink-0 gap-2">
        <div className="text-[10px] text-gray-400 font-mono flex flex-col">
           <span>Lat: {Number(data.lat).toFixed(4)}</span>
           <span>Lng: {Number(data.lng).toFixed(4)}</span>
        </div>

        <div className="flex items-center gap-2">
            {type === 'annotation' && (
                <>
                    <button 
                        onClick={onEdit}
                        className="flex items-center px-2 py-1 text-[10px] bg-white border border-gray-200 text-gray-600 rounded hover:border-palladio-blue hover:text-palladio-blue transition-colors shadow-sm"
                    >
                        <Edit size={10} className="mr-1"/> 编辑
                    </button>
                    <button 
                        onClick={onDelete}
                        className="flex items-center px-2 py-1 text-[10px] bg-white border border-gray-200 text-red-500 rounded hover:bg-red-50 hover:border-red-200 transition-colors shadow-sm"
                    >
                        <Trash2 size={10} className="mr-1"/> 删除
                    </button>
                </>
            )}
        </div>
      </div>
    </div>
  );
};
