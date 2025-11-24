export interface DataRecord {
  id: string;
  [key: string]: any;
  lat: number;
  lng: number;
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
  category: string;
}

export interface SearchResult {
  record: DataRecord;
  score: number;
}