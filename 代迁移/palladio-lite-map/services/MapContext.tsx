
import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { DataRecord, Bookmark, Annotation, SearchResult } from '../types';

// Palladio-inspired Palette
const COLOR_PALETTE = [
  '#E63946', // Red
  '#2A9D8F', // Teal
  '#E9C46A', // Yellow
  '#F4A261', // Orange
  '#264653', // Dark Jungle Green
  '#8D99AE', // Cool Grey
  '#EF476F', // Pink
  '#118AB2', // Blue
  '#073B4C', // Midnight
  '#06D6A0', // Green
  '#FFD166', // Pale Orange
];

interface MapContextType {
  rawData: DataRecord[];
  setRawData: (data: DataRecord[]) => void;
  filteredData: DataRecord[]; // Data after search AND category filtering
  columns: string[];
  setColumns: (cols: string[]) => void;
  selectedRecordId: string | null;
  setSelectedRecordId: (id: string | null) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  hoveredRecordId: string | null;
  setHoveredRecordId: (id: string | null) => void;
  
  // UI State
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  targetLanguage: string;
  setTargetLanguage: (lang: string) => void;
  activeLayer: string;
  setActiveLayer: (layer: string) => void;

  // Visualization & Faceting
  groupByColumn: string | null;
  setGroupByColumn: (col: string | null) => void;
  hiddenCategories: string[]; // List of values that are unchecked
  toggleCategoryVisibility: (value: string) => void;
  categoryColors: Record<string, string>; // Map value -> color
  relationColumn: string | null; // Column used for linking records (e.g. 'linked_id')

  // New Features
  bookmarks: Bookmark[];
  addBookmark: (name: string, view: { center: [number, number], zoom: number, layer: string }) => void;
  updateBookmark: (id: string, name: string) => void;
  removeBookmark: (id: string) => void;
  
  annotations: Annotation[];
  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (id: string, data: Partial<Annotation>) => void;
  removeAnnotation: (id: string) => void;
  isAnnotationMode: boolean;
  setIsAnnotationMode: (isMode: boolean) => void;

  // Search & View
  searchResult: SearchResult | null;
  setSearchResult: (result: SearchResult | null) => void;
  currentView: { center: [number, number], zoom: number };
  setCurrentView: (view: { center: [number, number], zoom: number }) => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rawData, setRawData] = useState<DataRecord[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [hoveredRecordId, setHoveredRecordId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // UI
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [targetLanguage, setTargetLanguage] = useState<string>('zh-CN');
  const [activeLayer, setActiveLayer] = useState<string>('streets');

  // Visualization State
  const [groupByColumn, setGroupByColumn] = useState<string | null>(null);
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>({});
  const [relationColumn, setRelationColumn] = useState<string | null>(null);

  // Features
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    const saved = localStorage.getItem('palladio_bookmarks');
    return saved ? JSON.parse(saved) : [];
  });

  const [annotations, setAnnotations] = useState<Annotation[]>(() => {
    const saved = localStorage.getItem('palladio_annotations');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isAnnotationMode, setIsAnnotationMode] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);

  const [currentView, setCurrentView] = useState<{ center: [number, number], zoom: number }>({
    center: [34.0, 108.0],
    zoom: 4
  });

  // Detect potential relation columns when columns change
  useEffect(() => {
    const possibleRelCols = ['linked_id', 'target_id', 'parent_id', 'source_id', 'relation'];
    const found = columns.find(c => possibleRelCols.includes(c.toLowerCase()));
    setRelationColumn(found || null);
  }, [columns]);

  // Compute Colors when groupByColumn changes
  useEffect(() => {
    if (!groupByColumn) {
      setCategoryColors({});
      setHiddenCategories([]);
      return;
    }

    const uniqueValues = Array.from(new Set(rawData.map(r => String(r[groupByColumn] || 'Unknown'))));
    const newColors: Record<string, string> = {};
    uniqueValues.forEach((val, index) => {
      newColors[val] = COLOR_PALETTE[index % COLOR_PALETTE.length];
    });
    setCategoryColors(newColors);
    setHiddenCategories([]); // Reset visibility on column change
  }, [groupByColumn, rawData]);

  // Persistence
  useEffect(() => {
    localStorage.setItem('palladio_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem('palladio_annotations', JSON.stringify(annotations));
  }, [annotations]);

  // Actions
  const addBookmark = (name: string, view: { center: [number, number], zoom: number, layer: string }) => {
    const newBookmark: Bookmark = {
      id: Date.now().toString(),
      name,
      view,
      timestamp: Date.now()
    };
    setBookmarks(prev => [...prev, newBookmark]);
  };

  const updateBookmark = (id: string, name: string) => {
    setBookmarks(prev => prev.map(b => b.id === id ? { ...b, name } : b));
  };

  const removeBookmark = (id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  const addAnnotation = (annotation: Annotation) => {
    setAnnotations(prev => [...prev, annotation]);
  };

  const updateAnnotation = (id: string, data: Partial<Annotation>) => {
    setAnnotations(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  };

  const removeAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
  };

  const toggleCategoryVisibility = (value: string) => {
    setHiddenCategories(prev => 
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  // Filter logic: Search + Category Hiding
  const filteredData = useMemo(() => {
    let data = rawData;

    // 1. Filter by Category (if grouping is active)
    if (groupByColumn) {
      data = data.filter(record => {
        const val = String(record[groupByColumn] || 'Unknown');
        return !hiddenCategories.includes(val);
      });
    }

    // 2. Filter by Search Term
    if (!searchTerm) return data;
    const lowerTerm = searchTerm.toLowerCase();
    return data.filter(record => {
      return Object.values(record).some(val => 
        String(val).toLowerCase().includes(lowerTerm)
      );
    });
  }, [rawData, searchTerm, groupByColumn, hiddenCategories]);

  return (
    <MapContext.Provider
      value={{
        rawData,
        setRawData,
        filteredData,
        columns,
        setColumns,
        selectedRecordId,
        setSelectedRecordId,
        searchTerm,
        setSearchTerm,
        hoveredRecordId,
        setHoveredRecordId,
        isSidebarOpen,
        setIsSidebarOpen,
        targetLanguage,
        setTargetLanguage,
        activeLayer,
        setActiveLayer,
        groupByColumn,
        setGroupByColumn,
        hiddenCategories,
        toggleCategoryVisibility,
        categoryColors,
        relationColumn,
        bookmarks,
        addBookmark,
        updateBookmark,
        removeBookmark,
        annotations,
        addAnnotation,
        updateAnnotation,
        removeAnnotation,
        isAnnotationMode,
        setIsAnnotationMode,
        searchResult,
        setSearchResult,
        currentView,
        setCurrentView
      }}
    >
      {children}
    </MapContext.Provider>
  );
};

export const useMapContext = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
};
