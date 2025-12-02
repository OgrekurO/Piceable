import httpx
from sqlalchemy import inspect
from app.database.session import SessionLocal, engine
from app.services.geocoding_service import GeocodingService
from app.models.geocode_cache import GeocodeCache

# Mock GeocodingService to use synchronous httpx for testing
class SyncGeocodingService(GeocodingService):
    def geocode_address_sync(self, address: str):
        print(f"[SyncService] Processing address: '{address}'")
        # 1. Check Cache
        cached = self.get_cached_coordinates(address)
        if cached:
            print(f"[SyncService] Cache HIT for '{address}'")
            return cached
        
        print(f"[SyncService] Cache MISS for '{address}', calling API...")
        
        # 2. Call API (Synchronous using httpx)
        try:
            # Use httpx.get (synchronous)
            response = httpx.get(
                self.NOMINATIM_URL,
                params={
                    "q": address,
                    "format": "json",
                    "limit": 1,
                    "addressdetails": 1
                },
                headers={
                    "User-Agent": self.USER_AGENT
                },
                timeout=10.0
            )
            
            if response.status_code == 200:
                results = response.json()
                if results and len(results) > 0:
                    result = results[0]
                    coords = {
                        "lat": float(result["lat"]),
                        "lng": float(result["lon"]),
                        "confidence": self._calculate_confidence(result),
                        "display_name": result.get("display_name", "")
                    }
                    
                    # 3. Cache Result
                    self.cache_coordinates(
                        address,
                        coords["lat"],
                        coords["lng"],
                        coords["confidence"]
                    )
                    return coords
                else:
                    print(f"[SyncService] No results found for '{address}'")
            else:
                print(f"[SyncService] API Error: {response.status_code}")
        except Exception as e:
            print(f"[SyncService] Error: {e}")
        return None

def test_sync_cache():
    print("--- Checking Database ---")
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Existing tables: {tables}")
    
    if "geocode_cache" not in tables:
        print("❌ CRITICAL: 'geocode_cache' table DOES NOT EXIST!")
        return
    else:
        print("✅ 'geocode_cache' table exists.")

    db = SessionLocal()
    service = SyncGeocodingService(db)
    address = "Beijing, China"
    
    print(f"\nTesting address: {address}")
    
    # 1. Clear existing cache
    try:
        existing = db.query(GeocodeCache).filter(GeocodeCache.address == address).first()
        if existing:
            print("Found existing cache, deleting...")
            db.delete(existing)
            db.commit()
    except Exception as e:
        print(f"❌ DB Error during clear: {e}")
        return
    
    # 2. First Request (API)
    print("\n--- Request 1 (Should hit API) ---")
    result1 = service.geocode_address_sync(address)
    print(f"Result 1: {result1}")
    
    # 3. Verify DB
    print("\n--- Verifying DB ---")
    cached_entry = db.query(GeocodeCache).filter(GeocodeCache.address == address).first()
    if cached_entry:
        print(f"✅ DB Entry found: {cached_entry.address}")
    else:
        print("❌ DB Entry NOT found")

    # 4. Second Request (Cache)
    print("\n--- Request 2 (Should hit Cache) ---")
    result2 = service.geocode_address_sync(address)
    print(f"Result 2: {result2}")
    
    if result2 and result2.get("cached"):
        print("✅ Request 2 correctly identified as CACHED")
    else:
        print("❌ Request 2 failed or identified as NEW incorrectly")
        
    db.close()

if __name__ == "__main__":
    test_sync_cache()
