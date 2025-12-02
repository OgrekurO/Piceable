#!/usr/bin/env python3
"""
测试地理编码缓存重构功能
验证全局缓存 + 项目本地副本的架构
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.services.geocoding_service import GeocodingService
from app.crud.tables import ensure_project_geocode_table, get_tables_by_project
from app.database.connection import get_db_connection
import asyncio
import json

async def test_geocode_refactor():
    print("=" * 70)
    print("测试地理编码缓存重构功能")
    print("=" * 70)
    print()
    
    # 1. 测试全局缓存
    print("【测试1】全局缓存查询")
    print("-" * 70)
    service = GeocodingService(db=None)
    print(f"✓ GeocodingService 初始化成功")
    print(f"  - 缓存项目ID: {service.cache_project_id}")
    print(f"  - 缓存表ID: {service.cache_table_id}")
    print()
    
    # 2. 测试地理编码（使用全局缓存）
    print("【测试2】地理编码（使用全局缓存）")
    print("-" * 70)
    test_addresses = ["Paris", "London", "Tokyo"]
    results = await service.batch_geocode(test_addresses)
    
    for addr, coords in results.items():
        if coords:
            status = "✓ [缓存]" if coords.get('cached') else "✓ [新查询]"
            print(f"{status} {addr}: ({coords['lat']}, {coords['lng']})")
        else:
            print(f"✗ {addr}: 查询失败")
    print()
    
    # 3. 测试项目本地表创建
    print("【测试3】项目本地表创建")
    print("-" * 70)
    test_project_id = 1  # 使用项目ID 1进行测试
    
    try:
        local_table_id = ensure_project_geocode_table(test_project_id)
        print(f"✓ 项目 {test_project_id} 的本地地理数据表ID: {local_table_id}")
        
        # 验证表是否存在
        tables = get_tables_by_project(test_project_id)
        geocode_table = next((t for t in tables if t.name == '_geocodes'), None)
        if geocode_table:
            print(f"✓ 表 '_geocodes' 已存在")
            print(f"  - 表ID: {geocode_table.id}")
            print(f"  - 描述: {geocode_table.description}")
        else:
            print("✗ 表 '_geocodes' 未找到")
    except Exception as e:
        print(f"✗ 创建失败: {e}")
    print()
    
    # 4. 测试复制到项目本地
    print("【测试4】复制地理数据到项目本地")
    print("-" * 70)
    try:
        result = await service.geocode_and_copy_to_project(
            addresses=test_addresses,
            target_project_id=test_project_id,
            field_name="test_address"
        )
        
        print(f"✓ 地理编码完成:")
        print(f"  - 缓存命中: {result['cached_count']}")
        print(f"  - 新编码: {result['new_count']}")
        print(f"  - 已复制: {result['copied_count']}")
        print(f"  - 失败: {len(result['failed'])}")
        print(f"  - 本地表ID: {result['local_table_id']}")
    except Exception as e:
        print(f"✗ 复制失败: {e}")
        import traceback
        traceback.print_exc()
    print()
    
    # 5. 验证项目本地数据
    print("【测试5】验证项目本地数据")
    print("-" * 70)
    conn = get_db_connection()
    cur = conn.cursor()
    
    if conn.row_factory:  # SQLite
        cur.execute(
            "SELECT COUNT(*) FROM items WHERE project_id = ? AND table_id = ?",
            (test_project_id, local_table_id)
        )
    else:  # PostgreSQL
        cur.execute(
            "SELECT COUNT(*) FROM items WHERE project_id = %s AND table_id = %s",
            (test_project_id, local_table_id)
        )
    
    count = cur.fetchone()[0]
    print(f"✓ 项目 {test_project_id} 本地表中有 {count} 条地理数据")
    
    # 查看一条示例数据
    if conn.row_factory:
        cur.execute(
            "SELECT id, data FROM items WHERE project_id = ? AND table_id = ? LIMIT 1",
            (test_project_id, local_table_id)
        )
    else:
        cur.execute(
            "SELECT id, data FROM items WHERE project_id = %s AND table_id = %s LIMIT 1",
            (test_project_id, local_table_id)
        )
    
    row = cur.fetchone()
    if row:
        data = row[1] if isinstance(row, tuple) else row['data']
        if isinstance(data, str):
            data = json.loads(data)
        print(f"  示例数据:")
        print(f"    - ID: {row[0]}")
        print(f"    - 地址: {data.get('address')}")
        print(f"    - 坐标: ({data.get('lat')}, {data.get('lng')})")
        print(f"    - 自定义: {data.get('is_custom')}")
    
    cur.close()
    conn.close()
    print()
    
    print("=" * 70)
    print("测试完成！")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(test_geocode_refactor())
