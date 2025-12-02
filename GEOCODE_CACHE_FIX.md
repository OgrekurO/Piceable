# 地理编码缓存系统修复总结

## 问题描述
地理编码缓存数据虽然存储在数据库中，但前端无法显示，且在地图视图中仍然会重复进行地理编码查询。

## 根本原因

### 1. **数据库层面**
- ✅ 缓存数据的 `table_id` 字段为 `NULL`，导致前端查询时无法正确过滤
- ✅ 已修复：将所有缓存记录的 `table_id` 更新为 16（geocode_cache 表的 ID）

### 2. **后端层面**
- ✅ `GeocodingService` 在保存缓存时没有指定 `table_id`
- ✅ `get_cached_coordinates()` 方法使用了错误的查询逻辑（将 `project_id` 当作 `user_id` 传递）
- ✅ 已修复：
  - 添加 `_get_geocode_cache_table_id()` 方法获取表 ID
  - 在 `cache_coordinates()` 中保存时指定 `table_id`
  - 重写 `get_cached_coordinates()` 直接查询数据库，不依赖 `user_id` 过滤

### 3. **前端层面**
- ✅ `useUnifiedDataSource.ts` 缺少 `'system'` 数据源类型
- ✅ 多处对 `projectId=0` 的 falsy 检查导致系统项目无法加载
- ✅ `useTableManagement.ts` 缺少 `geocode_cache` 表的默认 schema
- ✅ 缓存数据格式与前端预期不匹配（扁平结构 vs 嵌套 `data` 对象）
- ✅ 已修复：
  - 添加 `'system'` 数据源支持
  - 修复所有 falsy 检查为显式 `null` 检查
  - 添加 `geocode_cache` 默认 schema
  - 添加数据规范化逻辑

## 修复后的工作流程

### 缓存存储
```
1. 用户上传包含地址字段的数据
2. 前端调用 /api/projects/{id}/geocode 进行地理编码
3. GeocodingService 处理每个地址：
   a. 生成缓存 ID: geocode_0_{md5_hash}
   b. 查询缓存（project_id=0, table_id=16）
   c. 如果未命中，调用 Nominatim API
   d. 将结果保存到 items 表（project_id=0, table_id=16）
```

### 缓存查询
```
1. 前端请求地理编码
2. GeocodingService.geocode_address(address)
3. get_cached_coordinates(address):
   - 生成相同的缓存 ID
   - 直接查询: SELECT * FROM items WHERE id=? AND project_id=0
   - 返回缓存数据（带 cached=True 标记）
4. 如果缓存命中，直接返回；否则调用 API
```

### 前端显示
```
1. 用户点击 __SYSTEM_GEOCODE_CACHE__ 项目
2. 前端识别 source_type='system'
3. 加载 project_id=0, table_id=16 的数据
4. 使用默认 schema 渲染表格
5. 数据规范化：将扁平数据包装到 data 对象中
6. 显示 45 条缓存记录
```

## 验证结果

### 后端测试
```bash
$ python3 test_geocode_cache.py
✅ Paris: (48.8588897, 2.320041) [缓存命中]
✅ London: (51.5074456, -0.1277653) [缓存命中]
✅ New York: (40.7127281, -74.0060152) [缓存命中]
```

### 数据库验证
```sql
SELECT COUNT(*) FROM items WHERE project_id = 0 AND table_id = 16;
-- 结果: 45 条记录
```

### 前端验证
- ✅ 可以在项目列表中看到 `__SYSTEM_GEOCODE_CACHE__` 项目
- ✅ 可以查看 `geocode_cache` 表及其 45 条数据
- ✅ 地图视图应该能够使用缓存（需要进一步测试）

## 待优化项

1. **前端日志优化**：在 `useMapProjectData.ts` 中添加缓存命中率统计
2. **缓存管理界面**：允许管理员查看、编辑、删除缓存项
3. **缓存过期策略**：考虑添加 TTL 或手动刷新机制
4. **批量缓存预热**：提供批量导入常用地址的功能

## 相关文件

### 后端
- `app/services/geocoding_service.py` - 地理编码服务
- `app/crud/items.py` - 数据项 CRUD 操作
- `app/database/init_db.py` - 数据库初始化（创建系统项目和表）

### 前端
- `composables/business/useUnifiedDataSource.ts` - 统一数据源适配器
- `composables/table/useTableManagement.ts` - 表格管理
- `composables/map/useMapProjectData.ts` - 地图数据加载
- `views/project/TablePage.vue` - 表格页面
- `core/services/uploadedItemsService.ts` - 数据项服务

## 数据库结构

### items 表（缓存存储）
```sql
CREATE TABLE items (
    id TEXT PRIMARY KEY,              -- geocode_0_{hash}
    data TEXT NOT NULL,               -- JSON: {address, lat, lng, ...}
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    project_id INTEGER,               -- 0 (系统项目)
    user_id INTEGER,                  -- 1 (admin)
    table_id INTEGER                  -- 16 (geocode_cache 表)
);
```

### tables 表（表定义）
```sql
CREATE TABLE tables (
    id INTEGER PRIMARY KEY,           -- 16
    project_id INTEGER,               -- 0
    name TEXT,                        -- 'geocode_cache'
    schema TEXT,                      -- JSON schema
    description TEXT
);
```
