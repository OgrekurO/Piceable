# Eagle API调用经验总结

## API调用基础
1. 使用正确的API方法名：
   - 正确：`eagle.item.get({})`
   - 错误：`eagle.getAllItems()`（不存在的方法）

2. 明确指定需要的字段：
   - 必须在fields参数中明确指定需要返回的字段
   - 常用字段包括：["id", "name", "url", "folders", "tags", "annotation", "lastModified", "thumbnailURL", "thumbnailPath"]
   - 不指定字段可能导致关键信息缺失

## 数据处理要点
1. 文件夹信息处理：
   - items中的folders字段是文件夹ID数组
   - 需要通过`eagle.library.info()`获取完整的文件夹结构
   - 通过文件夹ID映射到实际的文件夹名称和路径

2. 图片预览处理：
   - 优先使用thumbnailURL字段
   - 其次使用thumbnailPath字段
   - 最后使用url字段
   - 需要添加错误处理，当图片加载失败时显示占位符

## 数据同步机制
1. 保存修改：
   - 使用item对象的save()方法保存修改
   - 修改前保存原始item对象引用
   - 只在确实有修改时调用save()方法

2. 修改检测：
   - 比较表格数据与原始数据的差异
   - 检测关键字段：name, tags, annotation
   - 同步后刷新界面数据并重置状态

## 调试技巧
1. 添加详细日志：
   - 在关键步骤添加console.log调试信息
   - 记录API返回的数据结构
   - 记录数据处理过程中的中间结果

2. 环境检测：
   - 检测eagle对象是否存在
   - 在非Eagle环境中提供演示数据