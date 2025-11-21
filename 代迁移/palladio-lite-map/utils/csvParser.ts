import Papa from 'papaparse';
import { DataRecord } from '../types';

const LAT_KEYS = ['lat', 'latitude', 'y', 'point_y', 'latitud'];
const LNG_KEYS = ['lon', 'lng', 'longitude', 'x', 'point_x', 'longitud'];

export const parseCSV = (file: File): Promise<{ data: DataRecord[], columns: string[] }> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn("CSV Parse Warnings:", results.errors);
        }

        const rawData = results.data as Record<string, any>[];
        if (!rawData.length) {
          reject(new Error("No data found in CSV"));
          return;
        }

        const columns = Object.keys(rawData[0]);
        
        // Auto-detect lat/lng columns
        const latKey = columns.find(k => LAT_KEYS.includes(k.toLowerCase().trim()));
        const lngKey = columns.find(k => LNG_KEYS.includes(k.toLowerCase().trim()));

        if (!latKey || !lngKey) {
          reject(new Error("Could not detect Latitude/Longitude. Please use headers like 'lat', 'lng', 'latitude', 'longitude'."));
          return;
        }

        const processedData: DataRecord[] = rawData
          .map((row, index) => {
            let latStr = row[latKey];
            let lngStr = row[lngKey];
            
            // Handle potential comma decimals (European format)
            if (typeof latStr === 'string') latStr = latStr.replace(',', '.');
            if (typeof lngStr === 'string') lngStr = lngStr.replace(',', '.');

            const lat = parseFloat(latStr);
            const lng = parseFloat(lngStr);
            
            if (isNaN(lat) || isNaN(lng)) return null;
            
            return {
              id: `record-${index}`,
              lat,
              lng,
              ...row
            };
          })
          .filter((item): item is DataRecord => item !== null);

        resolve({ data: processedData, columns });
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};