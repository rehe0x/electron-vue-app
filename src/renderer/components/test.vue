<template>
  <el-table
    :data="tableData"
    border
    style="width: 100%">
    <el-table-column
      prop="date"
      label="日期"
      width="180">
    </el-table-column>
    <el-table-column
      prop="name"
      label="姓名"
      width="180">
    </el-table-column>
    <el-table-column
      prop="address"
      label="地址">
    </el-table-column>
  </el-table>
</template>

<script>
  const { getUserAgent } = require('../../common/index');
  const { getID } = require('../assets/test');
  const sf = getID();
  const gg = getUserAgent();
  export default {
    name: 'test',
    methods: {
      open(link) {
        this.$electron.shell.openExternal(link);
      },
    },
    data() {
      return {
        tableData: [{
          date: '2016-05-02',
          name: sf,
          address: gg,
        }, {
          date: '2016-05-04',
          name: '王小虎',
          address: '上海市普陀区金沙江路 1517 弄',
        }, {
          date: '2016-05-01',
          name: '王小虎',
          address: '上海市普陀区金沙江路 1519 弄',
        }, {
          date: '2016-05-03',
          name: '王小虎',
          address: '上海市普陀区金沙江路 1516 弄',
        }],
      };
    },
  };
</script>