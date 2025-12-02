<template>
  <el-dialog
    v-model="visible"
    title="编辑坐标"
    width="700px"
    :close-on-click-modal="false"
    @opened="handleDialogOpened"
    @closed="handleDialogClosed"
  >
    <div class="coordinate-editor">
      <!-- 地址信息 -->
      <div class="address-info">
        <h4>{{ entity?.primaryLabel || '未命名' }}</h4>
        <p class="address" v-if="addressField && entity">
          <MapPin :size="16" />
          {{ entity.data[addressField] || '无地址信息' }}
        </p>
      </div>
      
      <!-- 当前坐标 -->
      <div class="current-coords">
        <el-form label-width="80px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="纬度">
                <el-input-number 
                  v-model="editedLat" 
                  :precision="6" 
                  :step="0.001"
                  controls-position="right"
                  style="width: 100%"
                  @change="handleCoordinateChange"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="经度">
                <el-input-number 
                  v-model="editedLng" 
                  :precision="6" 
                  :step="0.001"
                  controls-position="right"
                  style="width: 100%"
                  @change="handleCoordinateChange"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
      
      <!-- 地理编码信息 -->
      <div class="geocoding-info" v-if="entity?.geocoding_metadata">
        <el-alert 
          :type="getConfidenceType(entity.geocoding_metadata.geocoding_confidence)"
          :closable="false"
        >
          <template #title>
            <div class="confidence-title">
              <span>置信度: {{ getConfidencePercent(entity.geocoding_metadata.geocoding_confidence) }}%</span>
              <el-tag 
                v-if="entity.geocoding_metadata.manual_override" 
                type="warning" 
                size="small"
              >
                手动修正
              </el-tag>
            </div>
          </template>
          <p v-if="entity.geocoding_metadata.last_geocoded_at" class="geocode-time">
            {{ entity.geocoding_metadata.manual_override ? '最后修正' : '自动编码' }}于 
            {{ formatDate(entity.geocoding_metadata.last_geocoded_at) }}
          </p>
        </el-alert>
      </div>
      
      <!-- 地图预览 -->
      <div class="map-preview-container">
        <div class="map-preview" ref="mapPreview"></div>
        <div class="map-hint">
          <Info :size="14" />
          拖拽标记可调整位置
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="actions">
        <el-button @click="handleReGeocode" :loading="geocoding" :disabled="!addressField">
          <RefreshCw :size="16" class="btn-icon" />
          重新地理编码
        </el-button>
        <el-button @click="handleResetToOriginal" :disabled="!hasOriginalCoords">
          <RotateCcw :size="16" class="btn-icon" />
          恢复原始坐标
        </el-button>
      </div>
    </div>
    
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, RefreshCw, RotateCcw, Info } from 'lucide-vue-next'
import type { VisualEntity } from '@/types/entity'
import { useGeocoding } from '@/composables/map/useGeocoding'

const props = defineProps<{
  modelValue: boolean
  entity?: VisualEntity
  addressField?: string
  projectId?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'save': [coords: { lat: number, lng: number, manual_override: boolean }]
}>()

const { geocodeSingleAddress, geocoding } = useGeocoding()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 坐标编辑
const editedLat = ref(0)
const editedLng = ref(0)
const originalLat = ref(0)
const originalLng = ref(0)

// 地图实例
let mapInstance: L.Map | null = null
let marker: L.Marker | null = null
const mapPreview = ref<HTMLElement | null>(null)

// 是否有原始坐标
const hasOriginalCoords = computed(() => {
  return originalLat.value !== 0 || originalLng.value !== 0
})

// 初始化坐标
watch(() => props.entity, (newEntity) => {
  if (newEntity && newEntity.geo) {
    editedLat.value = newEntity.geo.lat
    editedLng.value = newEntity.geo.lng
    originalLat.value = newEntity.geo.lat
    originalLng.value = newEntity.geo.lng
  }
}, { immediate: true })

// 对话框打开时初始化地图
const handleDialogOpened = async () => {
  await nextTick()
  initMapPreview()
}

// 对话框关闭时清理地图
const handleDialogClosed = () => {
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
    marker = null
  }
}

// 初始化地图预览
const initMapPreview = () => {
  if (!mapPreview.value || mapInstance) return
  
  try {
    // 创建地图
    mapInstance = L.map(mapPreview.value).setView(
      [editedLat.value, editedLng.value], 
      13
    )
    
    // 添加瓦片层
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance)
    
    // 添加可拖拽标记
    marker = L.marker([editedLat.value, editedLng.value], {
      draggable: true
    }).addTo(mapInstance)
    
    // 监听标记拖拽
    marker.on('dragend', (e) => {
      const pos = (e.target as L.Marker).getLatLng()
      editedLat.value = Number(pos.lat.toFixed(6))
      editedLng.value = Number(pos.lng.toFixed(6))
    })
  } catch (error) {
    console.error('[CoordinateEditor] 地图初始化失败:', error)
  }
}

// 坐标变化时更新地图
const handleCoordinateChange = () => {
  if (mapInstance && marker) {
    const newLatLng = L.latLng(editedLat.value, editedLng.value)
    marker.setLatLng(newLatLng)
    mapInstance.setView(newLatLng)
  }
}

// 重新地理编码
const handleReGeocode = async () => {
  if (!props.entity || !props.addressField || !props.projectId) return
  
  const address = props.entity.data[props.addressField]
  if (!address) {
    ElMessage.warning('没有地址信息')
    return
  }
  
  try {
    const result = await geocodeSingleAddress(
      props.projectId,
      address,
      props.addressField
    )
    
    if (result) {
      editedLat.value = result.lat
      editedLng.value = result.lng
      handleCoordinateChange()
      ElMessage.success('重新地理编码成功')
    } else {
      ElMessage.error('地理编码失败,请手动调整坐标')
    }
  } catch (error) {
    ElMessage.error('地理编码失败')
  }
}

// 恢复原始坐标
const handleResetToOriginal = () => {
  editedLat.value = originalLat.value
  editedLng.value = originalLng.value
  handleCoordinateChange()
}

// 获取置信度类型
const getConfidenceType = (confidence?: number): 'success' | 'warning' | 'error' => {
  if (!confidence) return 'warning'
  if (confidence >= 0.8) return 'success'
  if (confidence >= 0.5) return 'warning'
  return 'error'
}

// 获取置信度百分比
const getConfidencePercent = (confidence?: number): number => {
  return Math.round((confidence || 0) * 100)
}

// 格式化日期
const formatDate = (dateStr?: string): string => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

// 取消
const handleCancel = () => {
  visible.value = false
}

// 保存
const handleSave = () => {
  emit('save', {
    lat: editedLat.value,
    lng: editedLng.value,
    manual_override: true
  })
  visible.value = false
}
</script>

<style scoped>
.coordinate-editor {
  padding: 10px 0;
}

.address-info {
  margin-bottom: 20px;
}

.address-info h4 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: var(--el-text-color-primary);
}

.address {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  margin: 0;
}

.current-coords {
  margin-bottom: 20px;
}

.geocoding-info {
  margin-bottom: 20px;
}

.confidence-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.geocode-time {
  margin: 8px 0 0 0;
  font-size: 13px;
  opacity: 0.8;
}

.map-preview-container {
  margin-bottom: 20px;
}

.map-preview {
  width: 100%;
  height: 300px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--el-border-color);
}

.map-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.actions {
  display: flex;
  gap: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.btn-icon {
  margin-right: 4px;
}
</style>
