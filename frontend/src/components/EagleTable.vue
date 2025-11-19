<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import * as TabulatorModule from 'tabulator-tables'
import 'tabulator-tables/dist/css/tabulator.min.css'

const Tabulator = TabulatorModule.default || TabulatorModule

// 定义表格数据项的类型
interface TableItem {
  id: string;
  thumbnail: string;
  name: string;
  folders: string;
  tags: string;
  annotation: string;
  lastModified: number;
}

// 定义组件属性
const props = defineProps<{
  data: TableItem[]
  loading: boolean
}>()

// 定义触发的事件
const emit = defineEmits<{
  (e: 'rowClick', data: TableItem): void
  (e: 'cellEdited', field: string, value: string, rowId: string): void
  (e: 'syncData'): void
}>()

// 表格容器引用
const tableContainer = ref<HTMLElement | null>(null)
let table: typeof Tabulator | null = null
// 初始化表格
const initializeTable = async () => {
  await nextTick() // 确保DOM已更新
  
  if (!tableContainer.value) return

  // 销毁现有表格实例（如果存在）
  if (table) {
    table.destroy()
  }

  // 创建表格实例
  table = new Tabulator(tableContainer.value, {
    data: props.data || [],
    layout: "fitColumns",
    movableColumns: false,
    resizableRows: false,
    sortable: false,
    pagination: "local",
    paginationSize: 50,
    columns: [
      {
        title: "预览",
        field: "thumbnail",
        formatter: function(cell: any) {
          const imageData = cell.getValue()
          
          if (imageData) {
            return `<div class="image-cell"><img src="${imageData}" class="thumbnail" style="width:auto; height:auto; max-width:100%; max-height:100%; object-fit:contain;" onerror="this.parentElement.innerHTML='<div style=\'width:100%;height:100%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:12px;text-align:center;\'>无预览</div>'"/></div>`
          } else {
            return '<div style="width:100%;height:100%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:12px;text-align:center;">无预览</div>'
          }
        },
        hozAlign: "center",
        width: 100,
        headerSort: false
      },
      {
        title: "名称",
        field: "name",
        editor: "input",
        width: 200,
        sorter: "string",
        validator: ["required"],
        cellClick: function(e: any, cell: any) {
          console.log('[EDIT] 名称单元格被点击，ID:', cell.getRow().getData().id)
        },
        cellDblClick: function(e: any, cell: any) {
          console.log('[EDIT] 名称单元格被双击，ID:', cell.getRow().getData().id)
          cell.edit()
        },
        cellEdited: function(cell: any) {
          console.log('[EDIT] 单元格编辑完成:', cell.getField(), '新值:', cell.getValue(), '行ID:', cell.getRow().getData().id)
          emit('cellEdited', cell.getField(), cell.getValue(), cell.getRow().getData().id)
          
          // 自动同步数据到Eagle
          setTimeout(() => {
            emit('syncData')
          }, 100)
        },
      },
      {
        title: "文件夹",
        field: "folders",
        editor: "input",
        width: 150,
        cellClick: function(e, cell) {
          console.log('[EDIT] 文件夹单元格被点击，ID:', cell.getRow().getData().id)
        },
        cellDblClick: function(e, cell) {
          console.log('[EDIT] 文件夹单元格被双击，ID:', cell.getRow().getData().id)
          cell.edit()
        },
        cellEdited: function(cell) {
          console.log('[EDIT] 单元格编辑完成:', cell.getField(), '新值:', cell.getValue(), '行ID:', cell.getRow().getData().id)
          emit('cellEdited', cell.getField(), cell.getValue(), cell.getRow().getData().id)
          
          // 自动同步数据到Eagle
          setTimeout(() => {
            emit('syncData')
          }, 100)
        }
      },
      {
        title: "标签",
        field: "tags",
        editor: "input",
        width: 150,
        sorter: "string",
        validator: ["required"],
        cellClick: function(e: any, cell: any) {
          console.log('[EDIT] 标签单元格被点击，ID:', cell.getRow().getData().id)
        },
        cellDblClick: function(e: any, cell: any) {
          console.log('[EDIT] 标签单元格被双击，ID:', cell.getRow().getData().id)
          cell.edit()
        },
        cellEdited: function(cell: any) {
          console.log('[EDIT] 单元格编辑完成:', cell.getField(), '新值:', cell.getValue(), '行ID:', cell.getRow().getData().id)
          emit('cellEdited', cell.getField(), cell.getValue(), cell.getRow().getData().id)
        }
      },
      {
        title: "注释",
        field: "annotation",
        editor: "textarea",
        formatter: "textarea",
        width: 300,
        cellClick: function(e, cell) {
          console.log('[EDIT] 注释单元格被点击，ID:', cell.getRow().getData().id)
        },
        cellDblClick: function(e, cell) {
          console.log('[EDIT] 注释单元格被双击，ID:', cell.getRow().getData().id)
          cell.edit()
        },
        cellEdited: function(cell) {
          console.log('[EDIT] 单元格编辑完成:', cell.getField(), '新值:', cell.getValue(), '行ID:', cell.getRow().getData().id)
          emit('cellEdited', cell.getField(), cell.getValue(), cell.getRow().getData().id)
          
          // 自动同步数据到Eagle
          setTimeout(() => {
            emit('syncData')
          }, 100)
        }
      },
      {
        title: "最后修改",
        field: "lastModified",
        width: 180,
        formatter: function(cell) {
          const timestamp = cell.getValue()
          if (timestamp) {
            return new Date(timestamp).toLocaleString('zh-CN')
          }
          return ''
        }
      }
    ]
  })

  // 绑定行点击事件
  table.on("rowClick", function(e, row) {
    emit('rowClick', row.getData())
  })
}

// 监听数据变化，更新表格
watch(() => props.data, (newData) => {
  if (table) {
    table.setData(newData || [])
  }
}, { deep: true })

// 组件挂载后初始化表格
onMounted(() => {
  initializeTable()
})

// 定义组件方法，供父组件调用
defineExpose({
  setPageSize: (size: number) => {
    if (table) {
      table.setPageSize(size)
    }
  },
  setGroupBy: (field: string | false) => {
    if (table) {
      table.setGroupBy(field)
    }
  }
})
</script>
