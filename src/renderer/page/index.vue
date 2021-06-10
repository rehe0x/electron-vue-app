<template>
  <div class="home">
    <div class="page1">
      <div class="page1-left">
        <div class="title">
          <label>关注列表</label>
        </div>
        <el-table
          :data="starData"
          height="100%"
          :header-row-style="{height: '0'}"
          :header-cell-style="{padding: '0'}"
          :row-style="{height: '0'}"
          :cell-style="{padding: '0'}"
          border
          style="width: 100%">
          <el-table-column
            prop="LEAGUE"
            label="联赛">
          </el-table-column>
          <el-table-column
            prop="TEAM_H"
            label="主队">
          </el-table-column>
          <el-table-column
            prop="TEAM_C"
            label="客队">
          </el-table-column>
           <el-table-column
            prop="RATIO_R"
            label="变盘">
          </el-table-column>
          <el-table-column
            prop="IOR_RC"
            label="水位C">
          </el-table-column>
          <el-table-column
            prop="IOR_RH"
            label="水位H">
          </el-table-column>
        </el-table>
      </div>
      <div class="page1-right">
        <div class="title">
          <label>设置</label>
        </div>
        <el-form :model="formInline" style="z-index: 999" class="demo-form-inline">
          <el-row>
            <el-col :span="12">    
              <el-form-item label="分钟">
                <el-input-number v-model="sData.time" :min="1" :max="60" :step="10" label="分钟" style="width: 80%;"></el-input-number>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="赔率">
                <el-input-number v-model="sData.float" :min="0.01" :max="1" :step="0.01" label="赔率" style="width: 80%;"></el-input-number>
              </el-form-item>
            </el-col>
          </el-row>
         <el-row>
            <el-col :span="12">    
              <el-form-item label="水位">
                <el-input-number v-model="sData.odds" :min="0.1" :max="5" :step="0.1" label="分钟" style="width: 80%;"></el-input-number>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="刷新">
                <el-input-number v-model="sData.refTime" :min="1" :max="60" :step="1" label="赔率" style="width: 80%;"></el-input-number>
              </el-form-item>
            </el-col>
          </el-row>
          <el-input v-model="sData.username" placeholder="账号"></el-input>
          <el-input v-model="sData.password" placeholder="密码"></el-input>
          <el-form-item>
            <el-button type="primary"  v-if="sData.status === 1" @click="start" style="width: 40%;">关闭监控</el-button>
            <el-button type="primary"  v-if="sData.status === 0" @click="start" style="width: 40%;">开启监控</el-button>

          </el-form-item>
        </el-form>
      </div>
    </div>
    <div class="page1-divider"><el-divider class="edivider"></el-divider></div>
    <div class="page2">
      <div class="title">
          <label>预警列表</label>
        </div>
        <el-table
          :data="tableData"
          height="100%"
          :header-row-style="{height: '0'}"
          :header-cell-style="{padding: '0'}"
          :row-style="{height: '0'}"
          :cell-style="{padding: '0'}"
          border
          style="width: 100%">
          <el-table-column
            prop="LEAGUE"
            label="联赛">
          </el-table-column>
          <el-table-column
            prop="TEAM_H"
            label="主队">
          </el-table-column>
          <el-table-column
            prop="TEAM_C"
            label="客队">
          </el-table-column>
           <el-table-column
            prop="RATIO_R"
            label="变盘"
            width=50>
          </el-table-column>
          <el-table-column
            prop="IOR_RC"
            label="上"
            width=50>
          </el-table-column>
          <el-table-column
            prop="IOR_RH"
            label="下"
            width=50>
          </el-table-column>
          <el-table-column
            prop="DATETIME"
            label="日期"
            width=90>
          </el-table-column>
          <!-- <el-table-column
            prop="CDATE"
            label="时间"
            width=90>
          </el-table-column> -->
          <el-table-column
            label="操作"
            width="100">
            <template slot-scope="scope">
              <el-button type="text" @click="details(scope.row.GID)">查看</el-button>
              <el-button type="text" @click="star(scope.row)">关注</el-button>
            </template>
          </el-table-column>
        </el-table>
    </div>

     <!-- Table -->
  <el-dialog title="详情" :visible.sync="dialogTableVisible" width="70%">
    <el-table
      :data="gridData"
      :header-row-style="{height: '0'}"
      :header-cell-style="{padding: '0'}"
      :row-style="{height: '0'}"
      :cell-style="{padding: '0'}"
      border>
      <el-table-column
        prop="LEAGUE"
        label="联赛">
      </el-table-column>
      <el-table-column
        prop="TEAM_H"
        label="主队">
      </el-table-column>
      <el-table-column
        prop="TEAM_C"
        label="客队">
      </el-table-column>
        <el-table-column
        prop="RATIO_R"
        label="变盘"
        width=50>
      </el-table-column>
      <el-table-column
        prop="IOR_RC"
        label="上"
        width=50>
      </el-table-column>
      <el-table-column
        prop="IOR_RH"
        label="下"
        width=50>
      </el-table-column>
      <el-table-column
        prop="DATETIME"
        label="时间"
        width=90>
      </el-table-column>
    </el-table>
  </el-dialog>
  </div>
</template>

<script>
import { Service, getConfig, setConfig } from '../../service';

const se = new Service();
export default {
  name: 'Home',
  data() {
    return {
      starData: null,
      gridData: null,
      dialogTableVisible: false,
      tableData: null,
      tableDataStar: null,
      formInline: {
        user: '',
        region: '',
      },
      sData: {
        float: 0.06,
        time: 30,
        refTime: 10,
        odds: 1.8,
        status: 0,
        username: '',
        password: '',
      },
    };
  },
  mounted() {
    if (getConfig() != null) {
      this.sData = getConfig();
      if (this.sData.status === 1) {
        this.on();
      }
      this.tableData = se.getLeagueMon();
      if (this.timer) {
        clearInterval(this.timer);
      } else {
        this.timer = setInterval(() => {
          this.tableData = se.getLeagueMon();
        }, 3000);
      }
    }
    this.starData = se.getStarData();
  },
  methods: {
    async start() {
      if (this.sData.username.length === 0 || this.sData.password.length === 0) {
        this.errorAlert('请输入账号密码');
        return;
      }
      const st = this.sData.status === 0 ? 1 : 0;
      await setConfig(
        this.sData.odds, this.sData.float, this.sData.time,
        this.sData.refTime, st, this.sData.username, this.sData.password,
      );
      this.sData.status = st;
      if (st === 1) {
        this.on();
      } else {
        this.successAlert();
        se.cancelAll();
      }
    },
    async on() {
      this.successAlert();
      await se.timingLogin();
      se.createScheduleJobLogin();
      const s = await se.timingLeague();
      if (!s) {
        this.warningAlert('今日无赛事，未登陆～');
      } else {
        se.timingLeagueValid();
      }
    },
    details(gid) {
      const i = this.tableData.findIndex(item => item.GID === gid);
      if (i === -1) {
        return;
      }
      this.gridData = this.tableData[i].arr;
      this.dialogTableVisible = true;
    },
    star(data) {
      se.starData(data);
      this.starData = se.getStarData();
      this.successAlert();
    },
    successAlert() {
      this.$notify({
        duration: 1000,
        type: 'success',
        position: 'top-left',
        title: '成功',
        message: '',
      });
    },
    warningAlert(msg) {
      this.$notify({
        duration: 6000,
        type: 'warning',
        position: 'top-left',
        title: '预警',
        message: msg,
      });
    },
    errorAlert(msg) {
      this.$notify({
        duration: 2000,
        type: 'error',
        position: 'top-left',
        title: '错误',
        message: msg,
      });
    },
  },
  destroyed() {
    clearInterval(this.timer);
  },
};

</script>

<style scoped>
  .edivider{
    margin: 0;
  }
  /deep/ .el-dialog {
    height: 70%;
    overflow: auto;
  }

  >>> .el-dialog__body {
    padding: 0px 20px;
  }
</style>
