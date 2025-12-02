import httpx
import asyncio
import hashlib
import json
from typing import Optional, Dict, List
from sqlalchemy.orm import Session
from app.crud.items import get_item_from_db, update_item_in_db

# 系统项目 ID（用于全局地理编码缓存）
SYSTEM_GEOCODE_PROJECT_ID = 0

class GeocodingService:
    """
    地理编码服务
    使用 OpenStreetMap Nominatim API 进行地址到坐标的转换
    缓存存储在 items 表中（project_id=0 为全局缓存，其他为项目专属缓存）
    """
    
    NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
    USER_AGENT = "Piceable/1.0 (https://github.com/piceable)"
    
    def __init__(self, db: Session):
        """
        初始化地理编码服务
        注意：始终使用全局缓存（project_id=0），不再区分项目
        """
        self.db = db
        self.cache_project_id = SYSTEM_GEOCODE_PROJECT_ID  # 固定为0
        # 获取 geocode_cache 表的 ID
        self.cache_table_id = self._get_geocode_cache_table_id()
        print(f"[GeocodingService] 初始化完成，使用全局缓存 (project_id={self.cache_project_id}, table_id={self.cache_table_id})")
    
    
    async def geocode_address(self, address: str) -> Optional[Dict]:
        """
        对单个地址进行地理编码
        """
        print(f"[GeocodingService] Processing address: '{address}' (cache_project={self.cache_project_id})")
        # 1. 先查询缓存
        cached = self.get_cached_coordinates(address)
        if cached:
            print(f"[GeocodingService] Cache HIT for '{address}'")
            return cached
        
        print(f"[GeocodingService] Cache MISS for '{address}', calling API...")
        
        # 2. 调用 Nominatim API
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
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
                        
                        # 3. 缓存结果
                        self.cache_coordinates(
                            address,
                            coords["lat"],
                            coords["lng"],
                            coords["confidence"],
                            coords["display_name"]
                        )
                        
                        return coords
                    else:
                        print(f"[GeocodingService] No results found for '{address}'")
                else:
                    print(f"[GeocodingService] API Error: {response.status_code}")
        except Exception as e:
            print(f"[GeocodingService] 地理编码失败: {address}, 错误: {str(e)}")
        
        return None

    async def batch_geocode(
        self,
        addresses: List[str],
        progress_callback: Optional[callable] = None
    ) -> Dict[str, Optional[Dict]]:
        """
        批量地理编码
        
        Args:
            addresses: 地址列表
            progress_callback: 进度回调函数 (current, total)
            
        Returns:
            地址到坐标的映射字典
        """
        results = {}
        total = len(addresses)
        
        for i, address in enumerate(addresses):
            if not address or not address.strip():
                results[address] = None
                continue
            
            # 地理编码
            coords = await self.geocode_address(address)
            results[address] = coords
            
            # 进度回调
            if progress_callback:
                progress_callback(i + 1, total)
            
            # 遵守 Nominatim 使用限制: 每秒最多1次请求
            if i < total - 1:  # 最后一个不需要等待
                await asyncio.sleep(1.0)
        
        return results
    
    def get_cached_coordinates(self, address: str) -> Optional[Dict]:
        """
        从缓存中获取坐标（从 items 表查询）
        """
        try:
            # 生成缓存 item ID
            item_id = self._generate_cache_id(address)
            
            # 直接查询数据库，不依赖 user_id 过滤
            from app.database.connection import get_db_connection
            import json
            
            conn = get_db_connection()
            cur = conn.cursor()
            
            # 查询缓存项（只按 id 和 project_id 过滤，不过滤 user_id）
            if conn.row_factory:  # SQLite
                cur.execute(
                    "SELECT data FROM items WHERE id = ? AND project_id = ?",
                    (item_id, self.cache_project_id)
                )
            else:  # PostgreSQL
                cur.execute(
                    "SELECT data FROM items WHERE id = %s AND project_id = %s",
                    (item_id, self.cache_project_id)
                )
            
            row = cur.fetchone()
            cur.close()
            conn.close()
            
            if row:
                # 解析数据
                data = row[0] if isinstance(row, tuple) else row['data']
                if isinstance(data, str):
                    data = json.loads(data)
                
                print(f"[GeocodingService] Cache HIT: {data.get('address')}")
                return {
                    "lat": data.get("lat"),
                    "lng": data.get("lng"),
                    "confidence": data.get("confidence", 0.8),
                    "source": data.get("source", "nominatim"),
                    "display_name": data.get("display_name", ""),
                    "cached": True
                }
            else:
                print(f"[GeocodingService] Cache MISS: '{address}'")
        except Exception as e:
            print(f"[GeocodingService] Cache query error: {e}")
        
        return None
    
    def cache_coordinates(
        self,
        address: str,
        lat: float,
        lng: float,
        confidence: float = 0.8,
        display_name: str = "",
        source: str = "nominatim"
    ):
        """
        缓存地理编码结果（存储到 items 表）
        """
        print(f"[GeocodingService] Caching: '{address}' -> ({lat}, {lng})")
        try:
            item_id = self._generate_cache_id(address)
            
            # 构造缓存数据
            cache_data = {
                "address": address,
                "lat": lat,
                "lng": lng,
                "confidence": confidence,
                "source": source,
                "display_name": display_name
            }
            
            # 检查是否已存在
            existing = get_item_from_db(item_id, user_id=1)
            
            if existing:
                print(f"[GeocodingService] Updating existing cache for '{address}'")
                # 更新现有记录
                update_item_in_db(item_id, cache_data, user_id=1)
            else:
                print(f"[GeocodingService] Creating new cache for '{address}'")
                # 创建新记录 - 使用 save_items_to_db
                from app.crud.items import save_items_to_db
                save_items_to_db(
                    items=[{**cache_data, "id": item_id}],
                    user_id=1,
                    project_id=self.cache_project_id,
                    table_id=self.cache_table_id
                )
            
            print(f"[GeocodingService] Cache saved successfully")
        except Exception as e:
            print(f"[GeocodingService] 缓存失败: {address}, 错误: {str(e)}")
    
    def _get_geocode_cache_table_id(self) -> Optional[int]:
        """
        获取 geocode_cache 表的 ID
        """
        try:
            from app.crud.tables import get_tables_by_project
            tables = get_tables_by_project(self.cache_project_id)
            for table in tables:
                if table.name == "geocode_cache":
                    print(f"[GeocodingService] Found geocode_cache table with ID: {table.id}")
                    return table.id
            print(f"[GeocodingService] WARNING: geocode_cache table not found for project {self.cache_project_id}")
            return None
        except Exception as e:
            print(f"[GeocodingService] Error getting geocode_cache table ID: {e}")
            return None
    
    def _generate_cache_id(self, address: str) -> str:
        """
        生成缓存 item 的唯一 ID
        格式: geocode_{project_id}_{address_hash}
        """
        address_hash = hashlib.md5(address.strip().encode()).hexdigest()[:16]
        return f"geocode_{self.cache_project_id}_{address_hash}"
    
    def _calculate_confidence(self, nominatim_result: Dict) -> float:
        """
        根据 Nominatim 返回结果计算置信度
        
        Args:
            nominatim_result: Nominatim API 返回的结果
            
        Returns:
            置信度 (0-1)
        """
        # 基础置信度
        confidence = 0.7
        
        # 根据 importance 调整 (Nominatim 提供的重要性评分)
        importance = nominatim_result.get("importance", 0.5)
        confidence += importance * 0.2
        
        # 根据地址详细程度调整
        address_details = nominatim_result.get("address", {})
        if address_details:
            # 有详细地址信息,提高置信度
            detail_count = len(address_details)
            confidence += min(detail_count * 0.02, 0.1)
        
        return min(confidence, 1.0)
    
    def copy_to_project_table(
        self,
        geocode_results: Dict[str, Optional[Dict]],
        target_project_id: int,
        target_table_id: int
    ) -> int:
        """
        将地理编码结果复制到项目本地表
        
        Args:
            geocode_results: 地理编码结果字典 {address: coords}
            target_project_id: 目标项目ID
            target_table_id: 目标表ID
            
        Returns:
            复制的记录数
        """
        from app.crud.items import save_items_to_db
        import uuid
        
        items_to_save = []
        for address, coords in geocode_results.items():
            if coords:
                # 生成项目本地的 item ID
                item_id = f"geocode_local_{target_project_id}_{uuid.uuid4().hex[:16]}"
                
                item_data = {
                    "id": item_id,
                    "address": address,
                    "lat": coords.get("lat"),
                    "lng": coords.get("lng"),
                    "confidence": coords.get("confidence", 0.8),
                    "source": coords.get("source", "nominatim"),
                    "display_name": coords.get("display_name", ""),
                    "is_custom": "false"  # 初始为非自定义
                }
                items_to_save.append(item_data)
        
        if items_to_save:
            save_items_to_db(
                items=items_to_save,
                user_id=1,  # TODO: 使用实际用户ID
                project_id=target_project_id,
                table_id=target_table_id
            )
            print(f"[GeocodingService] 已复制 {len(items_to_save)} 条地理数据到项目 {target_project_id}")
        
        return len(items_to_save)
    
    async def geocode_and_copy_to_project(
        self,
        addresses: List[str],
        target_project_id: int,
        field_name: str
    ) -> Dict:
        """
        地理编码并复制到项目本地表
        
        Args:
            addresses: 地址列表
            target_project_id: 目标项目ID
            field_name: 地址字段名称
            
        Returns:
            包含结果、统计信息的字典
        """
        print(f"[GeocodingService] 开始为项目 {target_project_id} 处理 {len(addresses)} 个地址...")
        
        # 1. 批量地理编码（使用全局缓存）
        geocode_results = await self.batch_geocode(addresses)
        
        # 2. 确保项目有本地地理数据表
        from app.crud.tables import ensure_project_geocode_table
        local_table_id = ensure_project_geocode_table(target_project_id)
        
        # 3. 复制到项目本地表
        copied_count = self.copy_to_project_table(
            geocode_results,
            target_project_id,
            local_table_id
        )
        
        # 4. 统计缓存命中情况
        cached_count = sum(1 for r in geocode_results.values() if r and r.get('cached'))
        new_count = len([r for r in geocode_results.values() if r]) - cached_count
        failed = [addr for addr, r in geocode_results.items() if not r]
        
        return {
            "results": geocode_results,
            "cached_count": cached_count,
            "new_count": new_count,
            "copied_count": copied_count,
            "failed": failed,
            "local_table_id": local_table_id
        }
