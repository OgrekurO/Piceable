// Eagle插件主文件
class EagleOntologyPlugin {
  constructor() {
    this.init()
  }

  init() {
    console.log('[EagleOntologyPlugin] 插件初始化')
    
    // 监听来自前端的消息
    window.addEventListener('message', this.handleMessage.bind(this))
    
    // 插件创建完成后通知前端
    if (window.eagle) {
      window.eagle.onPluginCreate(() => {
        console.log('[EagleOntologyPlugin] 插件创建完成')
        this.notifyFrontend({ type: 'PLUGIN_READY' })
      })
    }
  }

  // 处理来自前端的消息
  handleMessage(event) {
    const { type, data } = event.data
    console.log('[EagleOntologyPlugin] 收到前端消息:', type, data)
    
    switch (type) {
      case 'GET_LIBRARY_INFO':
        this.getLibraryInfo()
        break
      case 'GET_ITEMS':
        this.getItems(data)
        break
      case 'UPDATE_ITEM':
        this.updateItem(data)
        break
      default:
        console.warn('[EagleOntologyPlugin] 未知消息类型:', type)
    }
  }

  // 通知前端
  notifyFrontend(message) {
    // 如果有源窗口，则直接发送消息
    if (event && event.source) {
      event.source.postMessage(message, '*')
    } else {
      // 否则发送给所有可能的窗口
      window.postMessage(message, '*')
    }
  }

  // 获取库信息
  async getLibraryInfo() {
    try {
      if (window.eagle) {
        const libraryInfo = await window.eagle.library.info()
        this.notifyFrontend({
          type: 'LIBRARY_INFO_RESULT',
          data: libraryInfo
        })
      } else {
        // 模拟数据用于开发环境
        this.notifyFrontend({
          type: 'LIBRARY_INFO_RESULT',
          data: {
            id: 'mock-library-id',
            name: 'Mock Library',
            folders: [],
            tags: []
          }
        })
      }
    } catch (error) {
      console.error('[EagleOntologyPlugin] 获取库信息失败:', error)
      this.notifyFrontend({
        type: 'LIBRARY_INFO_ERROR',
        error: error.message
      })
    }
  }

  // 获取项目列表
  async getItems(options = {}) {
    try {
      if (window.eagle) {
        const items = await window.eagle.item.get({
          limit: options.limit || 100,
          offset: options.offset || 0,
          // 可以根据需要添加更多筛选条件
        })
        
        this.notifyFrontend({
          type: 'ITEMS_RESULT',
          data: items
        })
      } else {
        // 模拟数据用于开发环境
        this.notifyFrontend({
          type: 'ITEMS_RESULT',
          data: [
            {
              id: 'mock-item-1',
              name: 'Mock Image 1',
              url: 'https://via.placeholder.com/150',
              tags: ['tag1', 'tag2'],
              folders: [],
              annotation: ''
            },
            {
              id: 'mock-item-2',
              name: 'Mock Image 2',
              url: 'https://via.placeholder.com/150',
              tags: ['tag3', 'tag4'],
              folders: [],
              annotation: ''
            }
          ]
        })
      }
    } catch (error) {
      console.error('[EagleOntologyPlugin] 获取项目列表失败:', error)
      this.notifyFrontend({
        type: 'ITEMS_ERROR',
        error: error.message
      })
    }
  }

  // 更新项目
  async updateItem(itemData) {
    try {
      if (window.eagle) {
        await window.eagle.item.save(itemData)
        this.notifyFrontend({
          type: 'UPDATE_ITEM_SUCCESS',
          data: itemData.id
        })
      } else {
        // 模拟更新成功
        console.log('[EagleOntologyPlugin] 模拟更新项目:', itemData)
        this.notifyFrontend({
          type: 'UPDATE_ITEM_SUCCESS',
          data: itemData.id
        })
      }
    } catch (error) {
      console.error('[EagleOntologyPlugin] 更新项目失败:', error)
      this.notifyFrontend({
        type: 'UPDATE_ITEM_ERROR',
        error: error.message,
        data: itemData.id
      })
    }
  }
}

// 初始化插件
new EagleOntologyPlugin()