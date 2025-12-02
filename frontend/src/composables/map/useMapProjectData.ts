import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { useProjectStore } from '@/stores/projectStore';
import { ElMessage } from 'element-plus';
import type { BaseItem } from '@/types/entity';
import { FieldType } from '@/types/schema';
import type { ProjectSchema } from '@/types/schema';

type ProjectStore = ReturnType<typeof useProjectStore>;

/**
 * 地图项目数据加载 Composable
 * 负责从后端加载真实的项目数据
 */
export function useMapProjectData(projectStore: ProjectStore) {
    const route = useRoute();
    const isLoading = ref(false);

    /**
     * 加载项目数据
     */
    const loadProjectData = async () => {
        // 优先从 query 获取 projectId (例如 /map?projectId=123)
        // 其次尝试从 params 获取 (例如 /project/123/map)
        const projectId = route.query.projectId || route.params.id;

        if (!projectId) {
            console.warn('[useMapProjectData] 未找到项目ID (query.projectId 或 params.id)，无法加载项目数据');
            return;
        }

        console.log(`[useMapProjectData] 开始加载项目数据, ID: ${projectId}`);
        isLoading.value = true;
        try {
            // 1. 获取项目详情（包括 Schema）
            // 注意：这里假设有一个 API 可以获取项目详情，包括 schema
            // 如果后端 API 分离，可能需要分别调用
            const projectResponse = await fetch(`http://localhost:8001/api/projects/${projectId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });

            if (!projectResponse.ok) {
                throw new Error('获取项目详情失败');
            }

            const project = await projectResponse.json();

            // 解析 Schema
            let schema: ProjectSchema = { fields: [] };
            if (project.schema) {
                schema = typeof project.schema === 'string' ? JSON.parse(project.schema) : project.schema;
            }

            // 2. 获取项目数据 (Items)
            const itemsResponse = await fetch(`http://localhost:8001/api/items?projectId=${projectId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });

            if (!itemsResponse.ok) {
                throw new Error('获取项目数据失败');
            }

            const items: BaseItem[] = await itemsResponse.json();
            console.log(`[useMapProjectData] 加载到 ${items.length} 条原始数据`);

            if (items.length === 0) {
                ElMessage.warning('该项目没有数据');
            } else {
                // --- 智能数据预处理 ---
                // 检查 Schema 中是否已有 geo_point 字段
                const hasGeoField = schema.fields.some(f => f.type === FieldType.GEO_POINT);
                console.log(`[useMapProjectData] Schema 中是否包含 geo_point 字段: ${hasGeoField}`);

                if (!hasGeoField && items.length > 0) {
                    console.log('[useMapProjectData] 尝试自动检测经纬度字段...');
                    // 尝试自动检测经纬度字段
                    const firstItemData = items[0]?.data;
                    if (!firstItemData) {
                        console.warn('[useMapProjectData] 第一条数据为空，无法检测字段');
                        return;
                    }

                    const keys = Object.keys(firstItemData).map(k => k.toLowerCase());
                    console.log('[useMapProjectData] 数据字段列表:', keys);

                    // 常见的经纬度字段名对
                    const latKeys = ['lat', 'latitude', 'wd', '纬度'];
                    const lngKeys = ['lng', 'lon', 'long', 'longitude', 'jd', '经度'];

                    const latKey = Object.keys(firstItemData).find(k => latKeys.includes(k.toLowerCase()));
                    const lngKey = Object.keys(firstItemData).find(k => lngKeys.includes(k.toLowerCase()));

                    if (latKey && lngKey) {
                        console.log(`[useMapProjectData] ✅ 自动检测到地理坐标字段: ${latKey}, ${lngKey}`);

                        // 1. 更新 Schema，添加虚拟的 geo 字段
                        schema.fields.push({
                            key: '_generated_geo',
                            label: '地理位置 (自动生成)',
                            type: FieldType.GEO_POINT
                        });

                        // 2. 更新 Items，生成 GeoJSON 数据
                        let convertedCount = 0;
                        items.forEach(item => {
                            const lat = parseFloat(item.data[latKey]);
                            const lng = parseFloat(item.data[lngKey]);

                            if (!isNaN(lat) && !isNaN(lng)) {
                                item.data['_generated_geo'] = {
                                    type: 'Point',
                                    coordinates: [lng, lat]
                                };
                                convertedCount++;
                            }
                        });
                        console.log(`[useMapProjectData] 已为 ${convertedCount} 条数据生成 GeoJSON 坐标`);
                    } else {
                        console.log('[useMapProjectData] 未检测到经纬度字段，尝试检测地址字段...');

                        // 尝试检测地址字段
                        const addressKeys = ['address', 'city', 'location', 'place', 'site', 'birthplace', 'arrival point', 'place of death', '地址', '城市', '地点'];
                        const addressKey = Object.keys(firstItemData).find(k => addressKeys.includes(k.toLowerCase()));

                        if (addressKey) {
                            console.log(`[useMapProjectData] ✅ 检测到潜在地址字段: ${addressKey}`);

                            // 提取所有唯一地址
                            const addresses = items
                                .map(item => item.data[addressKey])
                                .filter(addr => addr && typeof addr === 'string' && addr.trim() !== '');
                            const uniqueAddresses = [...new Set(addresses)];

                            if (uniqueAddresses.length > 0) {
                                console.log(`[useMapProjectData] 开始对 ${uniqueAddresses.length} 个地址进行地理编码查询...`);
                                ElMessage.info(`开始地理编码 ${uniqueAddresses.length} 个地址，请稍候...`);

                                const BATCH_SIZE = 5;
                                let processedCount = 0;
                                let geocodedCount = 0;
                                const totalAddresses = uniqueAddresses.length;

                                // 更新 Schema (只添加一次)
                                const hasGeoField = schema.fields.some(f => f.key === '_generated_geo');
                                if (!hasGeoField) {
                                    schema.fields.push({
                                        key: '_generated_geo',
                                        label: '地理位置 (自动生成)',
                                        type: FieldType.GEO_POINT
                                    });
                                }

                                // 分批处理
                                for (let i = 0; i < totalAddresses; i += BATCH_SIZE) {
                                    const batch = uniqueAddresses.slice(i, i + BATCH_SIZE);
                                    const currentBatchNum = Math.floor(i / BATCH_SIZE) + 1;
                                    const totalBatches = Math.ceil(totalAddresses / BATCH_SIZE);

                                    console.log(`[useMapProjectData] 处理第 ${currentBatchNum}/${totalBatches} 批次 (${batch.length} 个地址)...`);

                                    try {
                                        // 调用地理编码 API (使用全局缓存 + 复制到项目本地)
                                        const geocodeResponse = await fetch(`http://localhost:8001/api/projects/${projectId}/geocode`, {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                                            },
                                            body: JSON.stringify({
                                                addresses: batch,
                                                field_name: addressKey,
                                                copy_to_project: true  // 复制到项目本地表
                                            })
                                        });

                                        if (geocodeResponse.ok) {
                                            const geocodeResult = await geocodeResponse.json();
                                            const results = geocodeResult.results || {};

                                            // 更新 Items
                                            let batchSuccessCount = 0;
                                            items.forEach(item => {
                                                const address = item.data[addressKey];
                                                // 只有当该 item 还没有坐标时才更新 (避免重复处理)
                                                if (address && results[address] && !item.data['_generated_geo']) {
                                                    const coords = results[address];
                                                    item.data['_generated_geo'] = {
                                                        type: 'Point',
                                                        coordinates: [coords.lng, coords.lat]
                                                    };
                                                    // 同时也添加 lat/lng 字段，方便其他组件使用
                                                    item.data['lat'] = coords.lat;
                                                    item.data['lng'] = coords.lng;
                                                    batchSuccessCount++;
                                                }
                                            });

                                            geocodedCount += batchSuccessCount;
                                            processedCount += batch.length;

                                            // 进度反馈
                                            if (batchSuccessCount > 0) {
                                                const cacheHits = geocodeResult.cached_count || 0;
                                                const newGeocode = geocodeResult.new_count || 0;
                                                console.log(`[useMapProjectData] 批次 ${currentBatchNum} 完成: 缓存命中 ${cacheHits}, 新编码 ${newGeocode}, 新增坐标 ${batchSuccessCount}`);
                                            }

                                            // 如果不是最后一批，稍微等待一下给 UI 喘息机会
                                            if (i + BATCH_SIZE < totalAddresses) {
                                                await new Promise(resolve => setTimeout(resolve, 100));
                                            }
                                        } else {
                                            console.error(`[useMapProjectData] 批次 ${currentBatchNum} 请求失败: ${geocodeResponse.status}`);
                                        }
                                    } catch (error) {
                                        console.error(`[useMapProjectData] 批次 ${currentBatchNum} 处理出错:`, error);
                                    }
                                }

                                console.log(`[useMapProjectData] 地理编码完成，共生成 ${geocodedCount} 个坐标`);
                                if (geocodedCount > 0) {
                                    ElMessage.success(`地理编码完成，已定位 ${geocodedCount} 个地点`);
                                } else {
                                    ElMessage.warning('地理编码完成，但未找到有效坐标');
                                }
                            }
                        } else {
                            console.warn('[useMapProjectData] ❌ 未检测到经纬度或地址字段，无法自动生成坐标');
                        }
                    }
                }
                // -----------------------

                // 3. 加载到 Store
                // ItemTransformer 会根据 Schema 自动转换数据
                projectStore.loadItems(items, schema);

                // --- 4. 后处理：识别并挂载关系 (Relationship) ---
                const allEntities = projectStore.entities;
                const linkEntities: any[] = [];
                const nodeEntities: any[] = [];

                // 4.1 构建查找表: Name/Label -> EntityID (用于解析 From/To)
                const idMap = new Map<string, string>();
                allEntities.forEach(e => {
                    // 1. 基础 ID
                    idMap.set(e.id, e.id);

                    // 2. Primary Label
                    if (e.primaryLabel && e.primaryLabel !== '未命名') {
                        idMap.set(e.primaryLabel, e.id);
                    }

                    // 3. 常见名称字段
                    const nameFields = ['name', 'Name', 'label', 'Label', 'title', 'Title', '名称', '标题', '姓名'];
                    nameFields.forEach(field => {
                        if (e.data[field]) {
                            idMap.set(String(e.data[field]).trim(), e.id);
                        }
                    });

                    // 4. 激进策略：将 data 中所有唯一的字符串值都作为潜在的引用键
                    // 这有助于匹配那些使用了非标准字段名作为引用的情况
                    Object.values(e.data).forEach(val => {
                        if (typeof val === 'string' && val.length > 1 && val.length < 100) {
                            const trimmed = val.trim();
                            // 只有当该值在 map 中不存在时才添加，避免覆盖更明确的键
                            // 或者，如果已经存在，说明有歧义，可能需要警告（这里暂不处理）
                            if (!idMap.has(trimmed)) {
                                idMap.set(trimmed, e.id);
                            }
                        }
                    });
                });

                // 4.2 分离实体和关系
                allEntities.forEach(entity => {
                    const data = entity.data;
                    const sourceRef = data.From || data.from || data.source || data.Source;
                    const targetRef = data.To || data.to || data.target || data.Target;

                    if (sourceRef && targetRef) {
                        linkEntities.push({
                            ...entity,
                            _sourceRef: sourceRef,
                            _targetRef: targetRef
                        });
                    } else {
                        nodeEntities.push(entity);
                    }
                });

                console.log(`[useMapProjectData] 分离结果: Nodes=${nodeEntities.length}, Links=${linkEntities.length}`);

                if (linkEntities.length > 0) {
                    console.log('[useMapProjectData] 关系数据样本:', linkEntities[0]);
                    console.log(`[useMapProjectData] 关系源引用: ${linkEntities[0]._sourceRef}, 目标引用: ${linkEntities[0]._targetRef}`);
                }

                // 打印一些 idMap 的键，检查是否包含预期的名称
                console.log('[useMapProjectData] ID Map Keys (前10个):', Array.from(idMap.keys()).slice(0, 10));

                // 4.3 将关系挂载到源实体
                let linkCount = 0;
                linkEntities.forEach(linkEntity => {
                    const sourceId = idMap.get(linkEntity._sourceRef);
                    const targetId = idMap.get(linkEntity._targetRef);

                    if (!sourceId) {
                        console.warn(`[useMapProjectData] 无法找到源实体: ${linkEntity._sourceRef}`);
                    }
                    if (!targetId) {
                        console.warn(`[useMapProjectData] 无法找到目标实体: ${linkEntity._targetRef}`);
                    }

                    if (sourceId && targetId) {
                        const sourceNode = nodeEntities.find(e => e.id === sourceId);
                        if (sourceNode) {
                            if (!sourceNode.links) {
                                sourceNode.links = [];
                            }
                            sourceNode.links.push({
                                targetId: targetId,
                                relationType: linkEntity.data.Type || linkEntity.data.type || 'link',
                                label: linkEntity.primaryLabel || linkEntity.data.Label || 'link',
                                direction: linkEntity.data.Direction || linkEntity.data.direction || 'directed'
                            });
                            linkCount++;
                        }
                    }
                });

                // 4.4 更新 Store，只保留节点实体
                // 注意：这里我们直接替换 store.entities，这会触发视图更新
                // 如果 store 没有提供 setEntities 方法，我们需要手动操作数组
                // 假设 projectStore.entities 是可以直接赋值的（在 Pinia 中通常是）
                // 或者我们可以调用 loadItems 重新加载过滤后的数据，但这会重复执行 transformer

                // 更安全的方式是使用 store 的 action，或者如果 store.entities 是 ref，直接赋值
                // 查看 projectStore 定义，entities 是 state，可以直接修改
                projectStore.entities = nodeEntities;

                console.log(`[useMapProjectData] 后处理完成: 保留 ${nodeEntities.length} 个节点, 挂载 ${linkCount} 条关系`);
                ElMessage.success(`成功加载 ${nodeEntities.length} 个节点和 ${linkCount} 条关系`);
            }

        } catch (error) {
            console.error('[useMapProjectData] 加载失败:', error);
            ElMessage.error('加载项目数据失败');
        } finally {
            isLoading.value = false;
        }
    };

    return {
        isLoading,
        loadProjectData
    };
}
