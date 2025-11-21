
export interface DataRecord {
  id: string;
  lat: number;
  lng: number;
  [key: string]: any;
}

export interface ParsedData {
  records: DataRecord[];
  columns: string[];
  dateColumns: string[];
}

export interface MapState {
  zoom: number;
  center: [number, number];
  pitch: number;
  bearing: number;
}

export type FilterType = 'search' | 'date' | 'layer';

export interface Filter {
  id: string;
  type: FilterType;
  value: any;
  field?: string;
}

export interface Bookmark {
  id: string;
  name: string;
  view: {
    center: [number, number];
    zoom: number;
    layer: string;
  };
  timestamp: number;
}

export interface Annotation {
  id: string;
  lat: number;
  lng: number;
  label: string;
  note: string;
  category?: 'default' | 'landmark' | 'home' | 'work' | 'flag';
}

export interface SearchResult {
  lat: number;
  lng: number;
  label: string;
  address?: string;
  type?: string; // e.g. "city", "landmark"
}