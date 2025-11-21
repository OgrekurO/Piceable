
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useMapContext } from '../services/MapContext';
import { PopupCard } from './PopupCard';
import { AnnotationForm } from './AnnotationForm';
import { createRoot } from 'react-dom/client';
import { Languages, Check, Layers, Edit, Trash2, Type } from 'lucide-react';
import { Annotation } from '../types';

// Enhanced Map Styles using CSS Filters on Google Tiles to preserve translation capabilities
const MAP_STYLES = [
  {
    id: 'streets',
    name: '标准 (Streets)',
    type: 'm', // roadmap
    filter: '',
    previewColor: '#f8f9fa', // Standard light gray
  },
  {
    id: 'satellite',
    name: '卫星 (Satellite)',
    type: 'y', // hybrid
    filter: '',
    previewColor: '#0f172a', // Dark blue/black
  },
  {
    id: 'terrain',
    name: '地形 (Terrain)',
    type: 'p', // terrain
    filter: '',
    previewColor: '#ecfccb', // Light green
  },
  {
    id: 'light',
    name: '淡色 (Light)',
    type: 'm',
    filter: 'grayscale(100%) contrast(90%) brightness(105%)',
    previewColor: '#ffffff', // White
  },
  {
    id: 'dark',
    name: '深色 (Dark)',
    type: 'm',
    // Invert colors but rotate hue to keep water blue-ish, adjust contrast
    filter: 'invert(100%) hue-rotate(180deg) brightness(90%) contrast(90%) grayscale(20%)',
    previewColor: '#171717', // Black
  }
];

const LANGUAGES = [
  { code: 'zh-CN', label: '中文 (简体)' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'fr', label: 'Français' },
];

export const MapView: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const dataLayerRef = useRef<L.FeatureGroup | null>(null);
  const relationLayerRef = useRef<L.FeatureGroup | null>(null); // For connection lines
  const annotationLayerRef = useRef<L.FeatureGroup | null>(null);
  const searchLayerRef = useRef<L.FeatureGroup | null>(null);
  
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [showLabels, setShowLabels] = useState(true);

  // Annotation Form State
  const [isAnnotationFormOpen, setIsAnnotationFormOpen] = useState(false);
  const [tempAnnotationLoc, setTempAnnotationLoc] = useState<{lat: number, lng: number} | undefined>(undefined);
  const [editingAnnotation, setEditingAnnotation] = useState<Annotation | undefined>(undefined);

  const { 
    filteredData, 
    rawData,
    selectedRecordId, 
    setSelectedRecordId, 
    isSidebarOpen,
    targetLanguage,
    setTargetLanguage,
    activeLayer,
    setActiveLayer,
    annotations,
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
    setCurrentView,
    searchResult,
    setSearchResult,
    isAnnotationMode,
    setIsAnnotationMode,
    groupByColumn,
    categoryColors,
    relationColumn
  } = useMapContext();

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return;

    map.current = L.map(mapContainer.current, {
      zoomControl: false,
      attributionControl: false,
      zoomSnap: 0.5
    }).setView([34.0, 108.0], 4);

    L.control.zoom({ position: 'topright' }).addTo(map.current);
    L.control.scale({ position: 'bottomleft' }).addTo(map.current);

    // Layer Order: Tiles < Relations < Data Points < Search < Annotations
    relationLayerRef.current = L.featureGroup().addTo(map.current);
    dataLayerRef.current = L.featureGroup().addTo(map.current);
    searchLayerRef.current = L.featureGroup().addTo(map.current);
    annotationLayerRef.current = L.featureGroup().addTo(map.current);

    map.current.on('moveend', () => {
      if (map.current) {
        setCurrentView({
          center: [map.current.getCenter().lat, map.current.getCenter().lng],
          zoom: map.current.getZoom()
        });
      }
    });

    map.current.on('click', (e: L.LeafletMouseEvent) => {
      setSelectedRecordId(null);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Handle Map Click for Annotation placement
  useEffect(() => {
    if (!map.current) return;
    
    const mapContainerEl = mapContainer.current;
    if (mapContainerEl) {
        mapContainerEl.style.cursor = isAnnotationMode ? 'crosshair' : 'grab';
    }

    const handleClick = (e: L.LeafletMouseEvent) => {
        if (isAnnotationMode) {
            setTempAnnotationLoc(e.latlng);
            setEditingAnnotation(undefined);
            setIsAnnotationFormOpen(true);
            setIsAnnotationMode(false);
            L.DomEvent.stopPropagation(e);
        }
    };

    map.current.on('click', handleClick);

    return () => {
        map.current?.off('click', handleClick);
    };
  }, [isAnnotationMode]);


  // Handle Layer & Language Change with Smooth Transition
  useEffect(() => {
    if (!map.current) return;
    
    const oldLayer = tileLayerRef.current;

    const currentStyle = MAP_STYLES.find(s => s.id === activeLayer) || MAP_STYLES[0];
    
    // Append apistyle to hide labels if showLabels is false
    // s.e:l|p.v:off => element:labels | visibility:off
    const apistyle = !showLabels ? '&apistyle=s.e:l|p.v:off' : '';
    const url = `https://mt1.google.com/vt/lyrs=${currentStyle.type}&x={x}&y={y}&z={z}&hl=${targetLanguage}${apistyle}`;

    // Create new layer with initial opacity 0 (handled via CSS on container for smoothness)
    const newLayer = L.tileLayer(url, {
      maxZoom: 20,
      attribution: '&copy; Google Maps',
      zIndex: 0 
    }).addTo(map.current);
    
    const newContainer = newLayer.getContainer();

    if (newContainer) {
        // Apply Filters
        if (currentStyle.filter) {
            newContainer.style.filter = currentStyle.filter;
        }

        // Animate Opacity
        newContainer.style.opacity = '0';
        newContainer.style.transition = 'opacity 0.5s ease-in-out';
        
        requestAnimationFrame(() => {
            newContainer.style.opacity = '1';
        });
    }

    // Remove old layer after transition
    if (oldLayer) {
        setTimeout(() => {
            if (map.current && map.current.hasLayer(oldLayer)) {
                oldLayer.remove();
            }
        }, 500);
    }

    tileLayerRef.current = newLayer;

    // Ensure overlay ordering
    relationLayerRef.current?.bringToBack(); // Lines at bottom of overlays
    dataLayerRef.current?.bringToFront();    // Dots on top
    searchLayerRef.current?.bringToFront();
    annotationLayerRef.current?.bringToFront();

  }, [activeLayer, targetLanguage, showLabels]);

  // Handle Data Points & Relation Lines
  useEffect(() => {
    if (!map.current || !dataLayerRef.current || !relationLayerRef.current) return;
    
    dataLayerRef.current.clearLayers();
    relationLayerRef.current.clearLayers();

    // 1. Render Relations (Lines) first so they are under dots
    if (relationColumn) {
        filteredData.forEach(record => {
            const targetId = record[relationColumn!];
            if (targetId) {
                // Find target in rawData (to allow connecting even if target is filtered out visually, 
                // or strict: find in filteredData. Let's use rawData for robust linking)
                const target = rawData.find(r => String(r.id) === String(targetId) || String(r.label) === String(targetId));
                
                if (target) {
                    L.polyline([[record.lat, record.lng], [target.lat, target.lng]], {
                        color: '#999',
                        weight: 1,
                        opacity: 0.6,
                        dashArray: '5, 5'
                    }).addTo(relationLayerRef.current!);
                }
            }
        });
    }

    // 2. Render Data Points with Semantic Coloring
    filteredData.forEach(record => {
      let color = '#0077b6'; // Default Blue
      
      if (groupByColumn && categoryColors) {
          const val = String(record[groupByColumn] || 'Unknown');
          color = categoryColors[val] || '#999';
      }

      const marker = L.circleMarker([record.lat, record.lng], {
        radius: 6,
        fillColor: color,
        color: '#fff',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.85
      });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setSelectedRecordId(record.id);
      });

      marker.addTo(dataLayerRef.current!);
    });
  }, [filteredData, groupByColumn, categoryColors, relationColumn, rawData]);

  // Handle Annotations
  useEffect(() => {
    if (!map.current || !annotationLayerRef.current) return;
    annotationLayerRef.current.clearLayers();

    annotations.forEach(anno => {
      const iconHtml = `
        <div style="position: relative;">
           <div style="
              background-color: ${anno.category === 'default' ? '#e63946' : '#2a9d8f'}; 
              width: 14px; height: 14px; 
              border-radius: 50%; 
              border: 2px solid white; 
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
           "></div>
           <div style="
              position: absolute; top: -20px; left: 50%; transform: translateX(-50%);
              background: white; padding: 1px 4px; border-radius: 3px;
              font-size: 10px; white-space: nowrap; font-weight: bold;
              box-shadow: 0 1px 2px rgba(0,0,0,0.1);
              opacity: 0.9;
              display: ${map.current && map.current.getZoom() > 10 ? 'block' : 'none'}
           ">
              ${anno.label}
           </div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-anno-icon',
        html: iconHtml,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const marker = L.marker([anno.lat, anno.lng], { icon });
      
      const container = document.createElement('div');
      const popup = L.popup({ 
        minWidth: 280, 
        maxWidth: 320, 
        closeButton: false,
        className: 'custom-popup' 
      }).setContent(container);
      
      marker.bindPopup(popup);
      
      marker.on('popupopen', () => {
        const root = createRoot(container);
        root.render(
           <PopupCard 
             data={anno} 
             type="annotation"
             onClose={() => marker.closePopup()}
             onEdit={() => {
                marker.closePopup();
                setTempAnnotationLoc({ lat: anno.lat, lng: anno.lng });
                setEditingAnnotation(anno);
                setIsAnnotationFormOpen(true);
             }}
             onDelete={() => {
                if(window.confirm(`删除 "${anno.label}"?`)) {
                    marker.closePopup();
                    removeAnnotation(anno.id);
                }
             }}
           />
        );
      });

      marker.addTo(annotationLayerRef.current!);
    });
  }, [annotations]);

  // --- Handle Search Result Marker ---
  useEffect(() => {
    if (!map.current || !searchLayerRef.current) return;
    searchLayerRef.current.clearLayers();

    if (searchResult) {
      const searchIcon = L.divIcon({
        className: 'search-marker-icon',
        html: `<div style="
          background-color: #FFB703; 
          width: 24px; 
          height: 24px; 
          border-radius: 50% 50% 0 50%; 
          border: 2px solid white; 
          transform: rotate(45deg);
          box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 24], 
        popupAnchor: [0, -24]
      });

      const marker = L.marker([searchResult.lat, searchResult.lng], { icon: searchIcon });
      
      const container = document.createElement('div');
      const popup = L.popup({ 
          minWidth: 280, 
          maxWidth: 320, 
          closeButton: false,
          className: 'custom-popup' 
      }).setContent(container);

      marker.bindPopup(popup).openPopup();

      marker.on('popupopen', () => {
        const root = createRoot(container);
        root.render(
            <PopupCard 
                data={searchResult}
                type="search"
                onClose={() => marker.closePopup()}
            />
        );
      });
      
      marker.addTo(searchLayerRef.current);
    }
  }, [searchResult]);

  // Handle Data Popup
  useEffect(() => {
    if (!map.current) return;
    
    if (selectedRecordId) {
        map.current.closePopup();
        const record = filteredData.find(r => r.id === selectedRecordId);
        if (record) {
            const container = document.createElement('div');
            L.popup({ 
                minWidth: 280, 
                maxWidth: 320, 
                closeButton: false,
                offset: [0, -10],
                className: 'custom-popup'
            })
            .setLatLng([record.lat, record.lng])
            .setContent(container)
            .openOn(map.current);

            const root = createRoot(container);
            root.render(
            <PopupCard 
                data={record} 
                type="record"
                onClose={() => setSelectedRecordId(null)} 
                targetLanguage={targetLanguage}
            />
            );
        }
    }
  }, [selectedRecordId, targetLanguage]);

  // Sidebar Resize handler
  useEffect(() => {
    setTimeout(() => map.current?.invalidateSize(), 300);
  }, [isSidebarOpen]);

  // FlyTo Event Listener
  useEffect(() => {
    const handleFlyTo = (e: CustomEvent) => {
      const { lat, lng, zoom } = e.detail;
      // Enhanced smooth animation
      map.current?.flyTo([lat, lng], zoom || 14, { 
          duration: 2.0, // 2 seconds duration for a smooth flight
          easeLinearity: 0.25 // Standard easing
      });
    };
    window.addEventListener('map:flyTo' as any, handleFlyTo);
    return () => window.removeEventListener('map:flyTo' as any, handleFlyTo);
  }, []);

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainer} className="w-full h-full bg-[#e5e5e5] z-0" />
      
      {/* Annotation Form Modal */}
      <AnnotationForm 
        isOpen={isAnnotationFormOpen}
        initialData={editingAnnotation}
        location={tempAnnotationLoc}
        onCancel={() => {
            setIsAnnotationFormOpen(false);
            setEditingAnnotation(undefined);
        }}
        onSubmit={(data) => {
            if (editingAnnotation) {
                updateAnnotation(editingAnnotation.id, data);
            } else if (tempAnnotationLoc) {
                addAnnotation({
                    id: `anno-${Date.now()}`,
                    lat: tempAnnotationLoc.lat,
                    lng: tempAnnotationLoc.lng,
                    label: data.label,
                    note: data.note,
                    category: data.category
                });
            }
            setIsAnnotationFormOpen(false);
            setEditingAnnotation(undefined);
        }}
      />

      {/* Custom Map Controls */}
      <div className="absolute top-[80px] right-[10px] z-[400] flex flex-col gap-3 items-end pointer-events-none">
        <div className="pointer-events-auto flex flex-col gap-3 items-end">
        
        {/* Layer Switcher Button & Panel */}
        <div className="relative" onMouseEnter={() => setShowLayerPanel(true)} onMouseLeave={() => setShowLayerPanel(false)}>
           <button 
             className="bg-white w-[34px] h-[34px] flex items-center justify-center rounded shadow-md border border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors"
             title="切换底图"
           >
             <Layers size={18} />
           </button>
           
           {showLayerPanel && (
             <div className="absolute right-[40px] top-0 bg-white p-3 rounded-lg shadow-xl border border-gray-200 w-[320px] animate-in fade-in slide-in-from-right-4 duration-200">
                <div className="flex justify-between items-center mb-2">
                   <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">地图风格 (Base Map)</h4>
                   <span className="text-[10px] text-gray-400">预览</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                   {MAP_STYLES.map(style => (
                     <div 
                       key={style.id}
                       onClick={() => setActiveLayer(style.id)}
                       className={`
                         cursor-pointer rounded-md overflow-hidden border-2 transition-all relative group shadow-sm hover:shadow-md
                         ${activeLayer === style.id ? 'border-palladio-blue ring-2 ring-palladio-blue ring-offset-1' : 'border-gray-100 hover:border-gray-300'}
                       `}
                     >
                        <div 
                          className="h-14 w-full bg-gray-200 relative overflow-hidden"
                          style={{ backgroundColor: style.previewColor }}
                        >
                          <div className="absolute inset-0 opacity-30" 
                               style={{ 
                                 filter: style.filter, 
                                 background: 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)',
                                 backgroundSize: '20px 20px',
                                 backgroundPosition: '0 0, 10px 10px'
                               }}>
                          </div>
                          
                          {activeLayer === style.id && (
                             <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                               <div className="bg-palladio-blue rounded-full p-1 shadow-sm">
                                 <Check size={12} className="text-white" />
                               </div>
                             </div>
                          )}
                        </div>
                        <div className="text-[10px] text-center py-1.5 font-medium text-gray-700 bg-white border-t border-gray-50">
                          {style.name.split(' ')[0]}
                        </div>
                     </div>
                   ))}
                </div>
             </div>
           )}
        </div>

        {/* Language Switcher */}
        <div className="relative group">
           <button 
             onClick={() => setShowLangMenu(!showLangMenu)}
             className="bg-white w-[34px] h-[34px] flex items-center justify-center rounded shadow-md border border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors"
             title="Translation / 翻译"
           >
             <Languages size={18} />
           </button>
           
           {showLangMenu && (
             <div className="absolute right-[40px] top-0 bg-white rounded-lg shadow-xl border border-gray-200 w-40 overflow-hidden z-50">
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500">
                   选择显示语言
                </div>
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => { setTargetLanguage(lang.code); setShowLangMenu(false); }}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors ${targetLanguage === lang.code ? 'bg-blue-50 text-palladio-blue font-medium' : 'hover:bg-gray-50 text-gray-700'}`}
                  >
                    {lang.label}
                    {targetLanguage === lang.code && <Check size={14} />}
                  </button>
                ))}
             </div>
           )}
        </div>

        {/* Label Visibility Toggle */}
        <button 
             onClick={() => setShowLabels(!showLabels)}
             className={`w-[34px] h-[34px] flex items-center justify-center rounded shadow-md border border-gray-300 transition-colors relative
                ${showLabels ? 'bg-white text-gray-700 hover:bg-gray-50' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}
             `}
             title={showLabels ? "隐藏地名 (Hide Labels)" : "显示地名 (Show Labels)"}
           >
             <Type size={18} />
             {!showLabels && (
                <div className="absolute w-[20px] h-[1.5px] bg-gray-400 rotate-45 rounded-full" />
             )}
        </button>

        </div>
      </div>

      <div className="absolute bottom-1 right-24 text-[10px] text-gray-500 z-[300] pointer-events-none opacity-70 bg-white/50 px-2 rounded">
        Map data ©2024 Google
      </div>
    </div>
  );
};
