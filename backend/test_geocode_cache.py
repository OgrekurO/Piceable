#!/usr/bin/env python3
"""
测试地理编码缓存功能
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.services.geocoding_service import GeocodingService
import asyncio

async def test_cache():
    print("=" * 60)
    print("测试地理编码缓存功能")
    print("=" * 60)
    
    # 创建服务实例（使用全局缓存）
    service = GeocodingService(db=None, project_id=None)
    print(f"Cache project ID: {service.cache_project_id}")
    print(f"Cache table ID: {service.cache_table_id}")
    print()
    
    # 测试地址列表（这些地址应该已经在缓存中）
    test_addresses = [
        "Paris",
        "London",
        "New York",
        "Tokyo",
        "Beijing"
    ]
    
    print("测试缓存查询:")
    print("-" * 60)
    for address in test_addresses:
        result = service.get_cached_coordinates(address)
        if result:
            print(f"✅ {address}: ({result['lat']}, {result['lng']}) [缓存命中]")
        else:
            print(f"❌ {address}: 缓存未命中")
    
    print()
    print("=" * 60)
    print("测试完整的地理编码流程（包含缓存）:")
    print("-" * 60)
    
    # 测试完整流程
    for address in test_addresses[:2]:  # 只测试前2个，避免API限制
        result = await service.geocode_address(address)
        if result:
            cached_flag = "✅ [缓存]" if result.get('cached') else "🆕 [新查询]"
            print(f"{cached_flag} {address}: ({result['lat']}, {result['lng']})")
        else:
            print(f"❌ {address}: 查询失败")

if __name__ == "__main__":
    asyncio.run(test_cache())
