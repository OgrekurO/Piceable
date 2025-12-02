import asyncio
from app.database.session import SessionLocal
from app.services.geocoding_service import GeocodingService
from app.models.geocode_cache import GeocodeCache

async def test_cache():
    db = SessionLocal()
    service = GeocodingService(db)
    
    address = "Shanghai, China"
    
    print(f"Testing address: {address}")
    
    # 1. Clear existing cache for this address
    existing = db.query(GeocodeCache).filter(GeocodeCache.address == address).first()
    if existing:
        print("Found existing cache, deleting...")
        db.delete(existing)
        db.commit()
    
    # 2. First request (should hit API)
    print("\n--- Request 1 (Should hit API) ---")
    try:
        result1 = await service.geocode_address(address)
        print(f"Result 1: {result1}")
        
        if result1 and not result1.get("cached"):
            print("✅ Request 1 correctly identified as NEW")
        else:
            print("❌ Request 1 failed or identified as CACHED incorrectly")
    except Exception as e:
        print(f"❌ Request 1 Exception: {e}")
        import traceback
        traceback.print_exc()

    # 3. Verify DB
    print("\n--- Verifying DB ---")
    cached_entry = db.query(GeocodeCache).filter(GeocodeCache.address == address).first()
    if cached_entry:
        print(f"✅ DB Entry found: {cached_entry.address}, lat={cached_entry.lat}, lng={cached_entry.lng}")
    else:
        print("❌ DB Entry NOT found after Request 1")

    # 4. Second request (should hit Cache)
    print("\n--- Request 2 (Should hit Cache) ---")
    try:
        result2 = await service.geocode_address(address)
        print(f"Result 2: {result2}")
        
        if result2 and result2.get("cached"):
            print("✅ Request 2 correctly identified as CACHED")
        else:
            print("❌ Request 2 failed or identified as NEW incorrectly")
    except Exception as e:
        print(f"❌ Request 2 Exception: {e}")

    db.close()

if __name__ == "__main__":
    asyncio.run(test_cache())
