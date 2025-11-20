<template>
    <div class="home-page">
      <main>
        <h1>可视化</h1>
        <h1>你的数据库</h1>
        <el-button type="primary" @click="createProject">创建项目</el-button>

        <div class="table-container">
          <vxe-table class="project-table"
            :data="projects" 
            :row-config="{isHover: true}">
            <vxe-column type="seq" width="100" title="#" />
            <vxe-column field="name" title="项目名称" />
            <vxe-column width="200" field="date" title="最后修改时间" />
          </vxe-table>
        </div>
      </main>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
// 引入 Vxe-Table
import 'vxe-table/lib/style.css'
import { VXETable, VxeTable, VxeColumn } from 'vxe-table'

// 注册组件
VXETable.use(VxeTable)
VXETable.use(VxeColumn)

const router = useRouter();

const projects = ref([
  { name: '工业博物馆', date: '11月16日' },
  { name: '开水间自媒体素材', date: '11月10日' }
]);

const createProject = () => {
  // 跳转到创建项目的页面或弹出创建项目的对话框
  router.push('/create-project');
};
</script>

<style scoped>
.home-page {
  max-width: 99vw;
  padding: 20px;
  min-height: calc(100vh - var(--header-height));
}

.home-page::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
  background-size: 
    calc(100% / 30) calc(100% / 21);
  background-repeat: repeat;
  pointer-events: none;
  z-index: -1;
}

.home-page h1 {
  font-size: 18vh;
  margin-bottom: 0px;
  margin-left: 5vw;
  
}

.el-button {
  float: right;
  margin-right: 5vw;
  height: 40px;
  width: 180px;
  margin-top: -12vh; /* 根据实际需要调整 */
  font-size: 20px;
  background-color: var(--color-background);
  color: var(--color-button);
  border: var(--color-button) solid 1px;
  border-radius: 20px;
}

.table-container {
  margin-top: 50px;
  width: 99vw; /* 撑满画面左右 */
  position: relative;
  margin-left: -20px;
}

/* 确保表格使用指定的边框颜色 */
.project-table {
}

.project-table .vxe-table--header-wrapper {
  background-color: #fafafa !important;
}

/* 表头样式 */
.project-table ::v-deep .vxe-header--column {
  font-weight: bold;
  text-align: left;
  color: #575757;
  border-bottom: 1px solid var(--color-table-border);
}

/* 表格内容样式 */
.project-table ::v-deep .vxe-body--column {
  height: 50px;
  line-height: 80px;
  font-size: 20px;
  font-weight: bold;
  color: var(--color-text);
  padding: 0 16px;
  border-right: 1px solid var(--color-table-border);
  border-bottom: 1px solid var(--color-table-border);

}

/* 移除最后一列的右边框 */
.project-table ::v-deep .vxe-body--column:last-child {
  border-right: none;
}

/* 表格行底部边框 */
.project-table ::v-deep .vxe-body--row {
  border-bottom: 1px solid var(--color-table-border);
}

/* 表格行悬停效果 */
.project-table ::v-deep .vxe-body--row:hover {
  background-color: #2ce418;
}


</style>
