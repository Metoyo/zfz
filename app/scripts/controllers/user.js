define(['angular', 'config', 'datepicker', 'jquery', 'lazy'], function (angular, config, datepicker, $, lazy) {
  'use strict';

  angular.module('zhifzApp.controllers.UserCtrl', [])
    .controller('UserCtrl', ['$rootScope', '$scope', '$http', '$location', 'DataService', '$timeout',
      function ($rootScope, $scope, $http, $location, DataService, $timeout) {

        $scope.addedContainerClass = 'userBox';
        $scope.shenheList = [];
        $scope.showShenhe = false;
        $scope.isShenHeBox = true; //判断是不是审核页面

        /**
         * 定义变量
         */
        //var userInfo = $rootScope.session.userInfo;
        var baseRzAPIUrl = config.apiurl_rz; //renzheng的api;
        var baseMtAPIUrl = config.apiurl_mt; //mingti的api
        var baseKwAPIUrl = config.apiurl_kw; //考务的api
        var baseSmAPIUrl = config.apiurl_sm; //扫描的api
        var token = config.token; //token的值
        var caozuoyuan = 0;//登录的用户的UID
        //var caozuoyuan = userInfo.UID;//登录的用户的UID
        var jigouid = 0;
        //var jigouid = userInfo.JIGOU[0].JIGOU_ID;
        var lingyuid = 0;
        var session = $rootScope.session;
        //var lingyuid = $rootScope.session.defaultLyId;
        //var session = $rootScope.session;
        var dshyhjsUrl = baseRzAPIUrl + 'daishenhe_yonghu_juese?token=' + token + '&caozuoyuan=' + 0; //待审核用户角色url
        //var dshyhjsUrl = baseRzAPIUrl + 'daishenhe_yonghu_juese?token=' + token + '&caozuoyuan=' + session.info.UID; //待审核用户角色url
        var shyhjsUrl = baseRzAPIUrl + 'shenhe_yonghu_juese'; //审核用户角色
        var qryJiGouUrl = baseRzAPIUrl + 'jiGou?token=' + token + '&leibieid='; //由机构类别查询机构的url
        var modifyJiGouUrl = baseRzAPIUrl + 'modify_jigou'; //修改机构数据
        var qryLingYuUrl = baseRzAPIUrl + 'lingyu?token=' + token; //查询领域的url
        var modifyLingYuUrl = baseRzAPIUrl + 'modify_lingyu'; //修改领域数据
        var modifyJiGouLingYuUrl = baseRzAPIUrl + 'modify_jigou_lingyu'; //修改机构领域
        var jiGouData = { //新增机构的数据
            token: token,
            caozuoyuan: caozuoyuan,
            shuju:[]
          };
        var jgLeiBieId; //机构列表id
        var modifyJiGouAdminUrl = baseRzAPIUrl + 'modify_jigou_admin'; //修改机构管理员
        var adminData = { //新增机构管理员的数据
            token: token,
            caozuoyuan: caozuoyuan,
            shuju:{}
          };
        var whichJiGouAddAdmin = ''; //那个机构添加管理员
        var lingYuData = { //定义一个空的object用来存放需要保存的领域数据
            token: token,
            caozuoyuan: caozuoyuan,
            shuju:[]
          };
        var selectedLyStr = ''; //已选择的领域ID
        var selectedLyArr = []; //已选择的领域ID
        var qryTiXingUrl = baseMtAPIUrl + 'chaxun_tixing?token=' + token; //查询全部题型的url
        var qryKmTx = baseMtAPIUrl + 'chaxun_kemu_tixing?token=' + token + '&caozuoyuan=' + caozuoyuan + '&jigouid=' +
            jigouid + '&lingyuid='; //查询科目包含什么题型的url
        var modifyTxJgLyUrl = baseMtAPIUrl + 'modify_tixing_jigou_lingyu'; //修改题型机构领域
        var tiXingData = { //定义一个空的object用来存放需要保存的题型数据
            token: token,
            caozuoyuan: caozuoyuan,
            shuju:[]
          };
        var qryZsdBaseUrl = baseMtAPIUrl + 'chaxun_zhishidian?token=' + token + '&caozuoyuan=' + caozuoyuan + '&jigouid='
            + jigouid + '&leixing=1' + '&gen=0' + '&lingyuid='; //查询公共知识点的url
        var qryZsdgBaseUrl = baseMtAPIUrl + 'chaxun_gonggong_zhishidagang?token=' + token + '&caozuoyuan=' + caozuoyuan
            + '&lingyuid='; //查询公共知识大纲的url
        var deletePublicDaGangBaseUrl = baseMtAPIUrl + 'shanchu_gonggong_zhishidagang'; //删除公共知识大纲的url
        var qryZsdgZsdBaseUrl = baseMtAPIUrl + 'chaxun_zhishidagang_zhishidian?token=' + token + '&caozuoyuan=' + caozuoyuan
            + '&jigouid=' + jigouid + '&lingyuid='; //查询知识大纲知识点的url
        var daGangData = { //定义一个空的大纲数据
            token: token,
            caozuoyuan: caozuoyuan,
            jigouid: jigouid,
            shuju:{}
          };
        var daGangJieDianData = []; //定义一个大纲节点的数据
        var modifyZsdgUrl = baseMtAPIUrl + 'xiugai_zhishidagang'; //保存知识大纲
        var queryTiKuBaseUrl = baseMtAPIUrl + 'chaxun_tiku?token=' + token + '&caozuoyuan=' + caozuoyuan
            + '&jigouid=' + jigouid + '&chaxunzilingyu=false' + '&lingyuid='; //查询题目
        var xiuGaiTiKuUrl = baseMtAPIUrl + 'xiugai_tiku'; //修改题库的url
        var alterShiJuanMuLuUrl = baseMtAPIUrl + 'xiugai_shijuanmulu'; //修改试卷目录
        var queryShiJuanMuLuUrl = baseMtAPIUrl + 'chaxun_shijuanmulu?token=' + token + '&caozuoyuan=' + caozuoyuan
            + '&jigouid=' + jigouid + '&lingyuid='; //查询试卷目录
        var isDaGangSet = false; //是否是大纲设置
        var isLingYuSet = false; //是否是领域设置
        var qrytimuliebiaoBase = baseMtAPIUrl + 'chaxun_timuliebiao?token=' + token + '&caozuoyuan=' + caozuoyuan +
            '&jigouid=' + jigouid + '&lingyuid=' + lingyuid; //查询题目列表的url
        var alterZsdUrl = baseMtAPIUrl + 'xiugai_zhishidian'; //修改知识点的url
        var alterYongHu = baseRzAPIUrl + 'xiugai_yonghu';
        var cxLyOfZsdBase = baseMtAPIUrl + 'chaxun_lingyu_of_zhishidian?token=' + token + '&caozuoyuan=' + caozuoyuan +
            '&jigouid=' + jigouid + '&zhishidianid='; //根据知识点查科目
        var modifyZsdLy = baseMtAPIUrl + 'xiugai_zhishidian_lingyu'; //修改知识点领域
        var qryZsdTiMuNumBase = baseMtAPIUrl + 'chaxun_timu_count?token=' + token + '&zhishidianid='; //查询此题目
        var originSelectLingYuArr = []; //存放本机构所选领域的原始数据
        var selectLingYuChangedArr = []; //存放本机构变动的领域数据
        var qryTeacherUrl = baseRzAPIUrl + 'query_teacher?token=' + token + '&jigouid=' + jigouid; //查询本机构下教师
        var qryKaoShiZuListUrl = baseKwAPIUrl + 'query_kaoshizu_liebiao?token=' + token + '&caozuoyuan='+ caozuoyuan; //查询考试列表的url
        var chaXunChangCiUrl = baseKwAPIUrl + 'query_changci?token=' + token + '&caozuoyuan=' + caozuoyuan + '&kszid='; //查询考试
        var scannerBaseUrl = baseSmAPIUrl + 'yuejuan/transfer_from_omr?omr_set='; //扫描的url
        var createPdfUrl = '/create_pdf'; //创建PDF
        var scannerInfo = { //扫描设定数据
          selectInfo: {
            jgid: '',
            kmid: '',
            kszid: '',
            ksid: ''
          },
          inputInfo: {
            omrksid: '',
            sjaid: '',
            sjbid: '',
            xuehao: ''
          }
        };
        //新方法用到的变量
        var xueXiaoUrl = '/xuexiao';

        $scope.adminParams = {
          selected_dg: '',
          saveDGBtnDisabled: false,
          newPsd: '',
          fakeSelectShow: false,
          selectKeMuIds: [],
          selectKeMuName: [],
          selectLinYuId: '',
          zsdKeMuArr: [],
          pubZsdTabOn: -1,
          zsdWrapShow: false,
          fakePlaceHolder: '请选择科目',
          selectZsdId: '',
          zsdOldName: '', //知识
          zsdNewName: '' //知识点修改新名称
        };
        $scope.selectedKeMu = '';
        $scope.scanner = scannerInfo;
        $scope.cnNumArr = config.cnNumArr; //题支的序号

        /**
         * 导向本页面时，判读展示什么页面，admin, xxgly --
         */
        switch (config.userJs[0]){
          case 0:
            $scope.shenHeTpl = 'views/renzheng/rz_admin.html';
            break;
          case 1:
            $scope.shenHeTpl = 'views/renzheng/rz_xxgly.html';
            break;
          //case 3:
          //  $scope.shenHeTpl = 'views/renzheng/rz_shenHeRen.html';
          //  break;
        }

        /**
         * 退出程序 --
         */
        $scope.signOut = function(){
          DataService.logout();
        };

        /**
         * 设置权限，审核权限
         */
        $scope.setPermissions = function() {
          $scope.loadingImgShow = true; //user.html
          var hasShenHe = [], //定义一个已经通过审核的数组
              notShenHe = []; //定义一个待审核的数组
          $http.get(dshyhjsUrl).success(function(data) {
            if(data){
              Lazy(data).each(function(sh, indx, lst) {
                sh.AUTH_BTN_HIDE = true;
                var zeroLength = 0; //判断有几个未审核的角色
                Lazy(sh.JUESE).each(function(js, indx, jsLst) {
                  js.JUESE_CHECKED = js.ZHUANGTAI > -1;
                  if(js.ZHUANGTAI === 0) {
                    sh.AUTH_BTN_HIDE = false;
                    zeroLength ++;
                  }
                });
                if(zeroLength){
                  notShenHe.push(sh);
                }
                else{
                  hasShenHe.push(sh);
                }
              });
              $scope.loadingImgShow = false; //user.html
              $scope.hasShenHeList = hasShenHe;
              $scope.notShenHeList = notShenHe;
              $scope.isShenHeBox = true; //判断是不是审核页面
              $scope.adminSubWebTpl = 'views/renzheng/rz_shenHe.html';

            }
            else{
              DataService.alertInfFun('err', data.error);
              $scope.loadingImgShow = false; //user.html
            }
          });
        };

        /**
         * 关闭审核页面
         */
        $scope.closeShenheBox = function() {
          if(isDaGangSet){
            if(confirm('您将要退出大纲设置，是否保存当前大纲？')){
              $scope.saveDaGangData();
            }
          }
          if(isLingYuSet){
            if(confirm('您将要退出领域设置，是否保存当前领域？')){
              $scope.saveLingYuChange();
            }
          }
          isDaGangSet = false; //是否是大纲设置
          isLingYuSet = false; //是否是领域设置
          $scope.adminSubWebTpl = '';
          $scope.isShenHeBox = true; //判断是不是审核页面
        };

        $scope.jueseClicked = function(shenhe, juese) {
          shenhe.AUTH_BTN_HIDE = false;
        };

        /**
         * 通过审核的按钮
         */
        $scope.authPerm = function(shenhe) {
          var juese = [];
          var authParam = {
            token: config.token,
            caozuoyuan: session.info.UID,
            yonghujuese: [{
              yonghuid: shenhe.UID,
              jigou: shenhe.JIGOU_ID,
              lingyu: shenhe.LINGYU_ID
            }]
          };
          Lazy(shenhe.JUESE).each(function(js, indx, lst) {
            var tmpJS = {};
            if(js.JUESE_CHECKED && (js.ZHUANGTAI === -1 || js.ZHUANGTAI === 0)) {
              tmpJS.juese_id = js.JUESE_ID;
              tmpJS.zhuangtai = 1;
            } else if(!js.JUESE_CHECKED && js.ZHUANGTAI === 1) {
              tmpJS.juese_id = js.JUESE_ID;
              tmpJS.zhuangtai = 0;
            } else if(js.JUESE_CHECKED && js.ZHUANGTAI === 1) {
              tmpJS.juese_id = js.JUESE_ID;
              tmpJS.zhuangtai = 1;
            }
            if(tmpJS.juese_id) {
              juese.push(tmpJS);
            }
          });
          if(juese && juese.length > 0){
            authParam.yonghujuese[0].juese = juese;
            $http.post(shyhjsUrl, authParam).success(function(data) {
              if(data.result) {
                shenhe.AUTH_BTN_HIDE = true;
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
            });
          }
        };

        /**
         * 机构查询
         */
        var getJgList = function(){
          $scope.loadingImgShow = true;
          $http.get(xueXiaoUrl).success(function(schools){
            if(schools.result){
              $scope.jigou_list = schools.data;
            }
            else{
              $scope.jigou_list = '';
              DataService.alertInfFun('err', schools.error);
            }
            $scope.loadingImgShow = false;
          });
        };

        /**
         * 展示设置机构的页面 --
         */
        $scope.renderJiGouSetTpl = function(){
          if(!($scope.jigou_list && $scope.jigou_list.length)){
            getJgList();
            $scope.adminSubWebTpl = 'views/renzheng/rz_setJiGou.html';
          }
        };

        /**
         * 点击新增机构，显示新增页面 --
         */
        $scope.addNewJiGouBoxShow = function(jg){
          $scope.addNewJiGou = {};
          if(jg){ //修改机构
            $scope.addNewJiGou['学校ID'] = jg['学校ID'];
            $scope.addNewJiGou['学校名称'] = jg['学校名称'];
          }
          else{ //新增机构
            $scope.addNewJiGou['学校名称'] = '';
          }
          $scope.isAddNewJiGouBoxShow = true; //显示机构增加页面
          $scope.isAddNewAdminBoxShow = false; //关闭管理员管理页面
        };

        /**
         * 关闭添加新机构页面 --
         */
        $scope.closeAddNewJiGou = function(){
          $scope.isAddNewJiGouBoxShow = false;
          $scope.addNewJiGou = {};
        };

        /**
         * 保存新增加的机构 --
         */
        $scope.saveNewAddJiGou = function(){
          if($scope.addNewJiGou['学校名称']){
            $scope.loadingImgShow = true;
            if($scope.addNewJiGou['学校ID']){ //修改机构，用POST
              $http.post(xueXiaoUrl, $scope.addNewJiGou).success(function(data){
                if(data.result){
                  $scope.closeAddNewJiGou();
                  DataService.alertInfFun('suc', '修改成功');
                  getJgList();
                }
                else{
                  DataService.alertInfFun('err', data.error);
                }
              });
            }
            else{ //新增机构，用PUT
              $http.put(xueXiaoUrl, $scope.addNewJiGou).success(function(data){
                if(data.result){
                  $scope.closeAddNewJiGou();
                  DataService.alertInfFun('suc', '新增成功');
                  getJgList();
                }
                else{
                  DataService.alertInfFun('err', data.error);
                }
              });
            }
          }
          else{
            DataService.alertInfFun('err', '请输入机构名称！');
          }
          $scope.loadingImgShow = false;
        };

        /**
         * 删除机构
         */
        $scope.deleteJiGou = function(jg){
          if(jg['学校ID']){
            $scope.loadingImgShow = true;
            var obj = {};
            obj['学校ID'] = jg['学校ID'];
            $http({method: 'delete', url: xueXiaoUrl, params: obj}).success(function(data){
              if(data.result){
                DataService.alertInfFun('suc', '删除成功！');
                jiGouData.shuju = [];
                getJgList();
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
            });
          }
          else{
            DataService.alertInfFun('pmt', '请选择学校！');
          }
          $scope.loadingImgShow = false;
        };

        /**
         * 展示管理机构管理页面
         */
        $scope.manageAdmin = function(jg, idx){
          adminData.shuju = {};
          adminData.shuju.JIGOU_ID = jg.JIGOU_ID;
          adminData.shuju.ADMINISTRATORS = [];
          whichJiGouAddAdmin = idx;
          var adminObj = {
            UID: '',
            YONGHUMING: '',
            MIMA: '',
            ZHUANGTAI: 1
          };
          adminData.shuju.ADMINISTRATORS.push(adminObj);
          $scope.isAddNewAdminBoxShow = true; //显示管理管理员页面
          $scope.isAddNewJiGouBoxShow = false; //关闭机构增加页面
          $scope.adminList = jg;
          $scope.newAdmin = adminData;
        };

        /**
         * 保存管理员的修改
         */
        $scope.saveNewAddAdmin = function(){
          $scope.loadingImgShow = true; //rz_setJiGou.html
          if(adminData.shuju.ADMINISTRATORS[0].YONGHUMING){
            if(adminData.shuju.ADMINISTRATORS[0].MIMA){
              $http.post(modifyJiGouAdminUrl, adminData).success(function(data){
                if(data.result){
                  $scope.loadingImgShow = false; //rz_setJiGou.html
                  DataService.alertInfFun('suc', '保存成功');
                  getJgList();
                  adminData.shuju.ADMINISTRATORS[0].YONGHUMING = '';
                  adminData.shuju.ADMINISTRATORS[0].MIMA = '';
                }
                else{
                  $scope.loadingImgShow = false; //rz_setJiGou.html
                  DataService.alertInfFun('err', data.error);
                }
              });
            }
            else{
              $scope.loadingImgShow = false; //rz_setJiGou.html
              DataService.alertInfFun('pmt', '请输入管理员密码！');
            }
          }
          else{
            $scope.loadingImgShow = false; //rz_setJiGou.html
            DataService.alertInfFun('pmt', '请输入管理员账号！');
          }
        };

        /**
         * 删除机构管理员
         */
        $scope.deleteJiGouAdmin = function(adm){
          adminData.shuju.ADMINISTRATORS[0].UID = adm.UID;
          adminData.shuju.ADMINISTRATORS[0].YONGHUMING = adm.YONGHUMING;
          adminData.shuju.ADMINISTRATORS[0].ZHUANGTAI = -1;
          $http.post(modifyJiGouAdminUrl, adminData).success(function(data){
            if(data.result){
              getJgList();
              adminData.shuju.ADMINISTRATORS[0].UID = '';
              adminData.shuju.ADMINISTRATORS[0].YONGHUMING = '';
              adminData.shuju.ADMINISTRATORS[0].MIMA = '';
              adminData.shuju.ADMINISTRATORS[0].ZHUANGTAI = 1;
            }
            else{
              DataService.alertInfFun('err', data.error);
            }
          });
        };

        /**
         * 关闭管理管理员页面
         */
        $scope.closeManageAdmin = function(){
          $scope.isAddNewAdminBoxShow = false;
          adminData.shuju = {};
          whichJiGouAddAdmin = '';
        };

        /**
         * 重置机构管理员密码
         */
        $scope.resetJgAdminName = function(adm){
          var psw="";
          for(var i = 0; i < 6; i++)
          {
            psw += Math.floor(Math.random()*10);
          }
          adminData.shuju.ADMINISTRATORS[0].UID = adm.UID;
          adminData.shuju.ADMINISTRATORS[0].YONGHUMING = adm.YONGHUMING;
          adminData.shuju.ADMINISTRATORS[0].MIMA = psw;
          adminData.shuju.ADMINISTRATORS[0].ZHUANGTAI = 1;
          $http.post(modifyJiGouAdminUrl, adminData).success(function(data){
            if(data.result){
              $scope.jgAdminName = adm.YONGHUMING;
              $scope.jgAmdinNewPsw = psw;
              $scope.isResetJgAdminPsw = true;
              adminData.shuju.ADMINISTRATORS[0].UID = '';
              adminData.shuju.ADMINISTRATORS[0].YONGHUMING = '';
              adminData.shuju.ADMINISTRATORS[0].MIMA = '';
              adminData.shuju.ADMINISTRATORS[0].ZHUANGTAI = 1;
            }
            else{
              DataService.alertInfFun('err', data.error);
            }
          });
        };

        /**
         * 展示科目设置(领域)
         */
        $scope.renderLingYuSetTpl = function(){
          $scope.loadingImgShow = true; //rz_setLingYu.html
          // 查询机领域
          $http.get(qryLingYuUrl).success(function(data) {
            if(data.length){
              isLingYuSet = true;
              $scope.lingyu_list = data;
              $scope.loadingImgShow = false; //rz_setLingYu.html
              $scope.isShenHeBox = false; //判断是不是审核页面
              $scope.adminSubWebTpl = 'views/renzheng/rz_setLingYu.html';
            }
            else{
              $scope.lingyu_list = '';
              $scope.loadingImgShow = false; //rz_setLingYu.html
              DataService.alertInfFun('err', '没用相关的领域！');
            }
          });
        };

        /**
         * 添加领域
         */
        $scope.addNd = function(nd) {
          var newNd = {};
          newNd.LINGYU_ID = '';
          newNd.LINGYUMINGCHENG = '';
          newNd.BIANMA = '';
          newNd.ZHUANGTAI = 1;
          newNd.CHILDREN = [];
          switch (nd.LEIBIE){
            case 0:
              newNd.LEIBIE = 1;
              break;
            case 1:
              newNd.LEIBIE = 2;
              break;
          }
          nd.CHILDREN.push(newNd);
        };

        /**
         * 删除领域
         */
        $scope.removeNd = function(parentNd, thisNd, idx) {
          lingYuData.shuju = [];
          thisNd.ZHUANGTAI = -1;
          lingYuData.shuju.push(thisNd);
          $scope.loadingImgShow = true; //rz_setLingYu.html
          $http.post(modifyLingYuUrl, lingYuData).success(function(data){
            if(data.result){
              parentNd.CHILDREN.splice(idx, 1);
              $scope.loadingImgShow = false; //rz_setLingYu.html
            }
            else{
              $scope.loadingImgShow = false; //rz_setLingYu.html
              DataService.alertInfFun('err', data.error);
            }
          });
        };

        /**
         * 保存修改过后的领域数据
         */
        $scope.saveLingYuChange = function(){
          lingYuData.shuju = [];
          $scope.loadingImgShow = true; //rz_setLingYu.html
          lingYuData.shuju = $scope.lingyu_list;
          $http.post(modifyLingYuUrl, lingYuData).success(function(data){
            if(data.result){
              isLingYuSet = false;
              DataService.alertInfFun('suc', '保存成功！');
              $scope.loadingImgShow = false; //rz_setLingYu.html
            }
            else{
              $scope.loadingImgShow = false; //rz_setLingYu.html
              DataService.alertInfFun('err', data.error);
            }
          });
        };

        /**
         * 学校科目选择 modifyJiGouLingYuUrl
         */
        $scope.renderLingYuSelectTpl = function(){
          selectedLyArr = [];
          originSelectLingYuArr = [];
          selectLingYuChangedArr = [];
          $scope.jgSelectLingYu = [];
          lingYuData.shuju = [];
          $scope.selectedLyStr = '';
          $scope.loadingImgShow = true; //rz_selectLingYu.html
          var qryLingYuByJiGou = qryLingYuUrl + '&jigouid=' + userInfo.JIGOU[0].JIGOU_ID,
            lyStr; //拼接领域字符的变量
          $http.get(qryLingYuUrl).success(function(data) { //查询全部的领域
            if(data.length){
              $http.get(qryLingYuByJiGou).success(function(jgLy) { //查询本机构下的领域
                if(jgLy.length){
                  $scope.jgSelectLingYu = jgLy;
                  $scope.loadingImgShow = false; //rz_selectLingYu.html
                  $scope.lingyu_list = data;
                  $scope.isShenHeBox = false; //判断是不是审核页面
                  Lazy(jgLy).each(function(ply){
                    lyStr = 'sly' + ply.LINGYU_ID + ';';
                    selectedLyArr.push(lyStr);
                    //保存原始的已选领域数据的id
                    originSelectLingYuArr.push(ply.LINGYU_ID);
                    if(ply.CHILDREN.length && ply.CHILDREN.length > 0){
                      Lazy(ply.CHILDREN).each(function(ly){
                        lyStr = 'sly' + ly.LINGYU_ID + ';';
                        selectedLyArr.push(lyStr);
                        //保存原始的已选领域数据的id
                        originSelectLingYuArr.push(ly.LINGYU_ID);
                      })
                    }
                  });
                  selectedLyStr = selectedLyArr.toString();
                  $scope.selectedLyStr = selectedLyStr;
                  $scope.adminSubWebTpl = 'views/renzheng/rz_selectLingYu.html';
                }
                else{
                  $scope.loadingImgShow = false; //rz_selectLingYu.html
                  $scope.lingyu_list = data;
                  $scope.isShenHeBox = false; //判断是不是审核页面
                  $scope.adminSubWebTpl = 'views/renzheng/rz_selectLingYu.html';
                }
              });
            }
            else{
              $scope.lingyu_list = '';
              $scope.loadingImgShow = false; //rz_selectLingYu.html
              DataService.alertInfFun('err', '没用相关的领域！');
            }
          });
        };

        /**
         * 添加领域到已选 media-body selectLingYuChangedArr
         */
        $scope.addLingYuToSelect = function(event, nd, parentLy){
          var ifCheckOrNot = $(event.target).prop('checked'),
            ifInOriginSelectLingYu, //是否存在于原始的领域里面
            targetId = nd.LINGYU_ID, //选中的领域
            ifInChangLingYuArr; //是否存在变动的领域数组里
          ifInOriginSelectLingYu = Lazy(originSelectLingYuArr).find(function(lyId){
            return lyId == targetId;
          });
          if(selectLingYuChangedArr && selectLingYuChangedArr.length > 0){
            ifInChangLingYuArr = Lazy(selectLingYuChangedArr).find(function(cgLy){
              return cgLy.LINGYU_ID == targetId;
            });
          }
          if(parentLy){
            var parentLyId = parentLy.LINGYU_ID;
          }
          if(ifCheckOrNot){ //添加
            if(nd.PARENT_LINGYU_ID == 0){ // 父领域
              //存在原始数据里
              if(ifInOriginSelectLingYu){
                var lyHasInChangArrDataPadd = Lazy(selectLingYuChangedArr).find(function(cLy){
                  return cLy.LINGYU_ID == targetId;
                });
                if(lyHasInChangArrDataPadd){
                  selectLingYuChangedArr = Lazy(selectLingYuChangedArr).reject(function(ly) {
                    return ly.LINGYU_ID == targetId;
                  }).toArray();
                }
                if(nd.CHILDREN && nd.CHILDREN.length > 0){ //判断子nd下面的子领域
                  Lazy(nd.CHILDREN).each(function(sLy, sIdx, sLst){
                    var lyHasInOriginData = Lazy(originSelectLingYuArr).find(function(sLyId){
                        return sLyId == sLy.LINGYU_ID;
                      }),
                      lyHasInChangArrDataC = Lazy(selectLingYuChangedArr).find(function(cLy){
                        return cLy.LINGYU_ID == sLy.LINGYU_ID;
                      });
                    if(lyHasInOriginData){ //在原始数据里面
                      if(lyHasInChangArrDataC){
                        selectLingYuChangedArr = Lazy(selectLingYuChangedArr).reject(function(ly) {
                          return ly.LINGYU_ID == sLy.LINGYU_ID;
                        }).toArray();
                      }
                    }
                    else{ //不在原始数据里面
                      if(!lyHasInChangArrDataC){
                        sLy.itemStat = 'add';
                        selectLingYuChangedArr.push(sLy);
                      }
                    }
                  })
                }
              }
              //不存在原始数据里
              else{
                var add_lyHasInChangArrDataP0 = Lazy(selectLingYuChangedArr).find(function(cLy){
                  return cLy.LINGYU_ID == targetId;
                });
                if(!add_lyHasInChangArrDataP0){
                  nd.itemStat = 'add';
                  selectLingYuChangedArr.push(nd);
                }
                if(nd.CHILDREN && nd.CHILDREN.length > 0){
                  Lazy(nd.CHILDREN).each(function(sLy){
                    var add_lyHasInChangArrDataC0 = Lazy(selectLingYuChangedArr).find(function(cLy){
                      return cLy.LINGYU_ID == sLy.LINGYU_ID;
                    });
                    if(!add_lyHasInChangArrDataC0){
                      sLy.itemStat = 'add';
                      selectLingYuChangedArr.push(sLy);
                    }
                  })
                }
              }
              $scope.jgSelectLingYu.push(nd);
              if(nd.CHILDREN.length){ //有子领域
                //操作已选领域的代码
                Lazy(nd.CHILDREN).each(function(ly, idx, lst){
                  var hasLingYuArr, hasIn;
                  hasLingYuArr = Lazy($scope.jgSelectLingYu).map(function(sly){return sly.LINGYU_ID}).toArray();
                  hasIn = Lazy(hasLingYuArr).contains(ly.LINGYU_ID);
                  if(!hasIn){
                    $scope.jgSelectLingYu.push(ly);
                  }
                });
                $(event.target).closest('.media-body').find('.media input[type="checkbox"]').prop('checked', true);
              }
            }
            else{ //子领域
              //当选择子领域的时候，同时选择父领域
              if(parentLy){
                var parentLyCss = '.checkbox' + parentLyId,
                  ifParentLyChecked = $(parentLyCss).prop('checked');
                if(!ifParentLyChecked){
                  $(parentLyCss).prop('checked', true);
                }
                //判断父是否在原始数据里
                var chd_lyHasInOriginDataAdd = Lazy(originSelectLingYuArr).find(function(sLyId){
                    return sLyId == parentLy.LINGYU_ID;
                  }),
                  chd_lyHasInChangArrDataAdd = Lazy(selectLingYuChangedArr).find(function(cLy){
                    return cLy.LINGYU_ID == parentLy.LINGYU_ID;
                  });
                if(!chd_lyHasInOriginDataAdd){
                  if(!chd_lyHasInChangArrDataAdd){
                    parentLy.itemStat = 'add';
                    selectLingYuChangedArr.push(parentLy);
                  }
                }
              }
              Lazy($scope.jgSelectLingYu).each(function(ly, idx, lst){
                if(ly.LINGYU_ID == parentLyId){
                  ly.CHILDREN.push(nd);
                }
              });
              //所选领域存在原始数据里
              if(ifInOriginSelectLingYu){
                if(ifInChangLingYuArr){ //存在于变动数组里面
                  selectLingYuChangedArr = Lazy(selectLingYuChangedArr).reject(function(ly){
                    return ly.LINGYU_ID == targetId;
                  }).toArray();
                }
              }
              //所选领域不存在原始数据里
              else{
                nd.itemStat = 'add';
                selectLingYuChangedArr.push(nd);
              }
            }
          }
          else{ //删除
            if(nd.PARENT_LINGYU_ID == 0){ // 父领域
              //存在原始数据里
              if(ifInOriginSelectLingYu){
                var lyHasInChangArrDataP = Lazy(selectLingYuChangedArr).find(function(cLy){
                  return cLy.LINGYU_ID == targetId;
                });
                if(!lyHasInChangArrDataP){
                  nd.itemStat = 'del';
                  selectLingYuChangedArr.push(nd);
                }
                if(nd.CHILDREN && nd.CHILDREN.length > 0){
                  Lazy(nd.CHILDREN).each(function(sLy, sIdx, sLst){
                    var lyHasInOriginData = Lazy(originSelectLingYuArr).find(function(sLyId){
                        return sLyId == sLy.LINGYU_ID;
                      }),
                      lyHasInChangArrDataC = Lazy(selectLingYuChangedArr).find(function(cLy){
                        return cLy.LINGYU_ID == sLy.LINGYU_ID;
                      });
                    if(lyHasInOriginData){
                      if(!lyHasInChangArrDataC){
                        sLy.itemStat = 'del';
                        selectLingYuChangedArr.push(sLy);
                      }
                    }
                    else{
                      if(lyHasInChangArrDataC){
                        selectLingYuChangedArr = Lazy(selectLingYuChangedArr).reject(function(ly) {
                          return ly.LINGYU_ID == sLy.LINGYU_ID;
                        });
                      }
                    }
                  })
                }
              }
              //不在原始数据里
              else{
                Lazy(nd).each(function(ly){
                  var lyHasInChangArrDataP = Lazy(selectLingYuChangedArr).find(function(cLy){
                    return cLy.LINGYU_ID == ly.LINGYU_ID;
                  });
                  if(lyHasInChangArrDataP){
                    selectLingYuChangedArr = Lazy(selectLingYuChangedArr).reject(function(cLy) {
                      return cLy.LINGYU_ID == ly.LINGYU_ID;
                    }).toArray();
                  }
                  if(ly.CHILDREN && ly.CHILDREN.length > 0){
                    Lazy(ly.CHILDREN).each(function(sLy){
                      var lyHasInChangArrDataC = Lazy(selectLingYuChangedArr).find(function(cLy){
                        return cLy.LINGYU_ID == sLy.LINGYU_ID;
                      });
                      if(lyHasInChangArrDataC){
                        selectLingYuChangedArr = Lazy(selectLingYuChangedArr).reject(function(cLy) {
                          return cLy.LINGYU_ID == sLy.LINGYU_ID;
                        });
                      }
                    })
                  }
                });
              }
              if(nd.CHILDREN.length){ //操作已选领域的代码
                Lazy(nd.CHILDREN).each(function(ly,idx,lst){
                  Lazy($scope.jgSelectLingYu).each(function(sly, sIdx, sLst){
                    if(sly.LINGYU_ID == nd.LINGYU_ID){
                      $scope.jgSelectLingYu.splice(sIdx, 1);
                    }
                    if(sly.LINGYU_ID == ly.LINGYU_ID){
                      $scope.jgSelectLingYu.splice(sIdx, 1);
                    }
                  });
                });
                $(event.target).closest('.media-body').find('.media input[type="checkbox"]').prop("checked", false);
              }
            }
            else{ //子领域
              //子领域全部不选的时候，父领域也不选
              if(parentLy){
                var isAllLyUnChecked = true,
                  lyClass, ifLyChecked;
                Lazy(parentLy.CHILDREN).each(function(ly){
                  lyClass = '.checkbox' + ly.LINGYU_ID;
                  ifLyChecked = $(lyClass).prop('checked');
                  if(ifLyChecked){
                    isAllLyUnChecked = false;
                  }
                });
                if(isAllLyUnChecked){
                  var parentLyClass = '.checkbox' + parentLy.LINGYU_ID;
                  $(parentLyClass).prop('checked', false);
                  //所有的子都不选的时候，将父也去除
                  var chd_lyHasInOriginDataDel = Lazy(originSelectLingYuArr).find(function(sLyId){
                      return sLyId == parentLy.LINGYU_ID;
                    }),
                    chd_lyHasInChangArrDataDel = Lazy(selectLingYuChangedArr).find(function(cLy){
                      return cLy.LINGYU_ID == parentLy.LINGYU_ID;
                    });
                  if(chd_lyHasInOriginDataDel){
                    if(!chd_lyHasInChangArrDataDel){
                      parentLy.itemStat = 'del';
                      selectLingYuChangedArr.push(parentLy);
                    }
                  }
                }
              }
              Lazy($scope.jgSelectLingYu).each(function(sly, idx, lst){
                if(sly.LINGYU_ID == targetId){
                  $scope.jgSelectLingYu.splice(idx, 1);
                }
                else{
                  if(sly.CHILDREN && sly.CHILDREN.length >0){
                    Lazy(sly.CHILDREN).each(function(secSly, secIdx, secLst){
                      if(secSly.LINGYU_ID == targetId){
                        $scope.jgSelectLingYu[idx].CHILDREN.splice(secIdx, 1);
                      }
                    });
                  }
                }
              });
              //所选领域存在原始数据里
              if(ifInOriginSelectLingYu){
                nd.itemStat = 'del';
                selectLingYuChangedArr.push(nd);
              }
              //所选领域不存在原始数据里
              else{
                if(ifInChangLingYuArr){ //存在于变动数组里面
                  selectLingYuChangedArr = Lazy(selectLingYuChangedArr).reject(function(ly){
                    return ly.LINGYU_ID == targetId;
                  }).toArray();
                }
              }
            }
          }
        };

        /**
         * 从已选科目删除领域
         */
        $scope.deleteSelectedLingYu = function(sly, idx, pIdx){
//          $scope.loadingImgShow = true; //rz_selectLingYu.html
          var targetClass = '.checkbox' + sly.LINGYU_ID,
//            slyObj = {},
            isAllCheckBoxUnChecked = true,
            findLyArr = '',
            checkBoxParm,
            parentCheckBoxElm,
            checkBoxElm,
            targetId = sly.LINGYU_ID,
            ifInOriginSelectLy,
            ifInChangSelectLy;
          ifInOriginSelectLy = Lazy(originSelectLingYuArr).find(function(lyId){
            return lyId == targetId;
          });
          if(selectLingYuChangedArr && selectLingYuChangedArr.length > 0){
            ifInChangSelectLy = Lazy(selectLingYuChangedArr).find(function(cgLy){
              return cgLy.LINGYU_ID == targetId;
            });
          }
          //选择要操作的领域数据
          Lazy($scope.lingyu_list[0].CHILDREN).each(function(ply){
            if(ply.LINGYU_ID == sly.LINGYU_ID){
              findLyArr = ply;
            }
            else{
              Lazy(ply.CHILDREN).each(function(ly){
                  if(ly.LINGYU_ID == sly.LINGYU_ID){
                    findLyArr = ply;
                  }
               });
            }
          });
          //操作已选的领域数据
          if(findLyArr.CHILDREN.length){
            $('.media').find(targetClass).prop('checked', false);
            Lazy(findLyArr.CHILDREN).each(function(ly){
              checkBoxParm = '.checkbox' + ly.LINGYU_ID;
              checkBoxElm = $(checkBoxParm).prop('checked');
              if(checkBoxElm){
                isAllCheckBoxUnChecked = false;
              }
            });
            if(isAllCheckBoxUnChecked){
              parentCheckBoxElm = '.checkbox' + findLyArr.LINGYU_ID;
              $(parentCheckBoxElm).prop('checked', false);
            }
          }
          else{
            $('.media').find(targetClass).prop('checked', false);
          }
          //新代码
          if(ifInOriginSelectLy){
            sly.itemStat = 'del';
            selectLingYuChangedArr.push(sly);
          }
          else{
            if(ifInChangSelectLy){
              selectLingYuChangedArr = Lazy(selectLingYuChangedArr).reject(function(ly){
                return ly.LINGYU_ID == targetId;
              }).toArray();
            }
          }
          $scope.jgSelectLingYu[pIdx].CHILDREN.splice(idx, 1);
//          lingYuData.shuju = [];
//          slyObj.JIGOU_ID = jigouid;
//          slyObj.LINGYU_ID = sly.LINGYU_ID;
//          slyObj.ZHUANGTAI = -1;
//          slyObj.LEIBIE = sly.LEIBIE;
//          lingYuData.shuju.push(slyObj);
//          $http.post(modifyJiGouLingYuUrl, lingYuData).success(function(data){
//            if(data.result){
//              $scope.jgSelectLingYu[pIdx].CHILDREN.splice(idx, 1);
//              $scope.loadingImgShow = false; //rz_selectLingYu.html
//              console.log(originSelectLingYuArr);
//            }
//            else{
//              $scope.loadingImgShow = false; //rz_selectLingYu.html
//              DataService.alertInfFun('err', data.error);
//            }
//          });
        };

        /**
         * 保存题库 queryTiKuBaseUrl
         */
        var saveTiKuFun = function(){
          var tiKuObj = {
            token: token,
            caozuoyuan: caozuoyuan,
            jigouid: jigouid,
            lingyuid: '',
            shuju:{
              TIKUID: "",
              TIKUMULUID: 1,
              TIKUMINGCHENG: "",
              TIKUXINGZHI: 5,
              QUANXIANBIANMA: '1,2,3,4,5',
              ZHUANGTAI: 1
            }
          },
            queryTiKuUrl,
            lyLength = $scope.jgSelectLingYu.length,
            count = 0;
          var chaXunTiKu = function(lyData){
            queryTiKuUrl = queryTiKuBaseUrl + lyData.LINGYU_ID;
            $http.get(queryTiKuUrl).success(function(data){
              if(count < lyLength){
                if(data.length){
                  chaXunTiKu($scope.jgSelectLingYu[count]);
                }
                else{
                  tiKuObj.lingyuid = lyData.LINGYU_ID;
                  tiKuObj.shuju.TIKUMINGCHENG = lyData.LINGYUMINGCHENG;
                  $http.post(xiuGaiTiKuUrl, tiKuObj).success(function(tiku){
                    if(tiku.error){
                      DataService.alertInfFun('err', tiku.error);
                    }
                    else{
                      chaXunTiKu($scope.jgSelectLingYu[count]);
                    }
                  });
                }
              }
              count ++;
            });
          };
          if($scope.jgSelectLingYu && $scope.jgSelectLingYu.length > 0){
            chaXunTiKu($scope.jgSelectLingYu[0]);
          }
        };

        /**
         * 修改试卷目录 queryShiJuanMuLuUrl  alterShiJuanMuLuUrl
         */
        var alterShiJuanMuLu = function(){
          var sjMuLuObj = {
              token: token,
              caozuoyuan: caozuoyuan,
              jigouid: jigouid,
              lingyuid: '',
              shuju:{
                SHIJUANMULUID: "",
                MULUMINGCHENG: "",
  //              FUMULUID: "",
                ZHUANGTAI: 1
              }
            },
            querySjMuLuUrl,
            lyLength = $scope.jgSelectLingYu.length,
            count = 0;
          var chaXunSjMuLu = function(lyData){
            querySjMuLuUrl = queryShiJuanMuLuUrl + lyData.LINGYU_ID;
            $http.get(querySjMuLuUrl).success(function(data){
              count ++;
              if(count < lyLength){
                if(data.length){
                  chaXunSjMuLu($scope.jgSelectLingYu[count]);
                }
                else{
                  sjMuLuObj.lingyuid = lyData.LINGYU_ID;
                  sjMuLuObj.shuju.MULUMINGCHENG = lyData.LINGYUMINGCHENG;
                  $http.post(alterShiJuanMuLuUrl, sjMuLuObj).success(function(mulu){
                    if(mulu.error){
                      DataService.alertInfFun('err', mulu.error);
                    }
                    else{
                      chaXunSjMuLu($scope.jgSelectLingYu[count]);
                    }
                  });
                }
              }
            });
          };
          if($scope.jgSelectLingYu && $scope.jgSelectLingYu.length > 0){
            chaXunSjMuLu($scope.jgSelectLingYu[0]);
          }
        };

        /**
         * 保存已选的领域
         */
        $scope.saveChooseLingYu = function(){
          $scope.loadingImgShow = true; //rz_selectLingYu.html
          lingYuData.shuju = [];
          Lazy(selectLingYuChangedArr).each(function(sly){
            var slyObj = {};
            slyObj.JIGOU_ID = jigouid;
            slyObj.LINGYU_ID = sly.LINGYU_ID;
            if(sly.itemStat && sly.itemStat == 'add'){
              slyObj.ZHUANGTAI = 1;
            }
            if(sly.itemStat && sly.itemStat == 'del'){
              slyObj.ZHUANGTAI = -1;
            }
            slyObj.LEIBIE = sly.LEIBIE;
            lingYuData.shuju.push(slyObj);
          });
          if(lingYuData.shuju && lingYuData.shuju.length > 0){
            $http.post(modifyJiGouLingYuUrl, lingYuData).success(function(data){
              if(data.result){
                saveTiKuFun();
                alterShiJuanMuLu();
                Lazy(selectLingYuChangedArr).each(function(sly){
                  var hasInOriginSelectLy = Lazy(originSelectLingYuArr).find(function(lyId){
                    return lyId == sly.LINGYU_ID;
                  });
                  if(hasInOriginSelectLy){
                    if(sly.itemStat && sly.itemStat == 'del'){
                      originSelectLingYuArr = Lazy(originSelectLingYuArr).reject(function(lyId){
                        return lyId == sly.LINGYU_ID;
                      }).toArray();
                    }
                  }
                  else{
                    if(sly.itemStat && sly.itemStat == 'add'){
                      originSelectLingYuArr.push(sly.LINGYU_ID);
                    }
                  }
                });
                DataService.alertInfFun('suc', '保存成功！');
                $scope.loadingImgShow = false; //rz_selectLingYu.html
              }
              else{
                $scope.loadingImgShow = false; //rz_selectLingYu.html
                DataService.alertInfFun('err', data.error);
              }
            });
          }

        };

        /**
         * 大纲设置
         */
        $scope.renderDaGangSetTpl = function(){
          $scope.loadingImgShow = true; //rz_setDaGang.html
          var lingYuChildArr = [];
          $scope.dgZsdList = ''; //重置公共知识大纲知识点
          $scope.pubDaGangList = ''; //重置所有所有公共知识大纲
          $scope.publicKnowledge = ''; //重置公共知识点
          // 查询领域
          $http.get(qryLingYuUrl).success(function(data) {
            if(data.length){
              Lazy(data[0].CHILDREN).each(function(sub1, idx1, lst1){
                Lazy(sub1.CHILDREN).each(function(sub2, idx2, lst2){
                  lingYuChildArr.push(sub2);
                });
              });
              $scope.lingYuChild = lingYuChildArr;
              $scope.loadingImgShow = false; //rz_setDaGang.html
              $scope.isShenHeBox = false; //判断是不是审核页面
              $scope.adminSubWebTpl = 'views/renzheng/rz_setDaGang.html';
            }
            else{
              $scope.lingyu_list = '';
              $scope.loadingImgShow = false; //rz_setDaGang.html
              $scope.adminSubWebTpl = 'views/renzheng/rz_setDaGang.html';
              DataService.alertInfFun('err', '没用相关的领域！');
            }
          });
        };

        /**
         * 减去知识点
         */
        var dgLyId = '',
          publicKnowledgeData, //存放公共知识点数据的变量
          pubDgZsdIdArr = [], //存放公共知识大纲知识点的数据
          pubZsdIdArr = []; //存放公共知识点id的数组
        var minusZsdFun = function(){
          var diffZsdIdArr, //存放不同知识点id的变量
            singleZsdData, //存放一条公共知识点数据的变量
            pubZsdList = []; //存放多条公共知识点的变量
          //从已有的公共知识点中减去知识大纲知识点
          diffZsdIdArr = Lazy(pubZsdIdArr).without(pubDgZsdIdArr).toArray();
          //得到相对应的公共知识大纲知识点
          Lazy(diffZsdIdArr).each(function(zsdId, idx, lst){
            singleZsdData = Lazy(publicKnowledgeData).findWhere({ ZHISHIDIAN_ID: zsdId });
            pubZsdList.push(singleZsdData);
          });
          Lazy($scope.pubDaGangList).each(function(pdg, idx, lst){
            pubZsdList =  Lazy(pubZsdList).reject(function(pzsd){
              return pzsd.ZHISHIDIANMINGCHENG == pdg.ZHISHIDAGANGMINGCHENG ;
            }).toArray();
          });
          $scope.publicKnowledge = pubZsdList;
        };

        //查询此领域下的所有公共知识点
        $scope.qryPubZsdByKeMu = function(lyId){
          if(lyId){
            var qryPubLyZsdUrl = qryZsdBaseUrl + lyId;
            $http.get(qryPubLyZsdUrl).success(function(zsd){
              $scope.loadingImgShow = true; //rz_setDaGang.html
              if(zsd.error){
                $scope.loadingImgShow = false; //rz_setDaGang.html
                DataService.alertInfFun('err', '此领域下没有公共知识点！');
                publicKnowledgeData = '';
              }
              else{
                $scope.loadingImgShow = false; //rz_setDaGang.html
                publicKnowledgeData = zsd;
                //得到此领域下的公共知识点id的数组
                pubZsdIdArr = Lazy(zsd).map(function(szsd){
                  return szsd.ZHISHIDIAN_ID;
                }).toArray();
                if($scope.dgZsdList && $scope.dgZsdList.length > 0){
                  minusZsdFun();
                }

              }
            });
          }
        };

        /**
         * 由领域获得大纲数据
         */
        $scope.getPubDaGangList = function(lyId){
          if(lyId){
            var qryZsdgUrl = qryZsdgBaseUrl + lyId,
              pubZsdgArr = []; //存放公共知识大纲的数组
            $scope.loadingImgShow = true; //rz_setDaGang.html
            dgLyId = lyId;
            $scope.dgZsdList = ''; //重置公共知识大纲知识点
            $scope.pubDaGangList = ''; //重置所有所有公共知识大纲
            $scope.publicKnowledge = ''; //重置公共知识点
            daGangData.lingyuid = lyId;
            //查询知识大纲
            $http.get(qryZsdgUrl).success(function(zsdg){
              //有知识大纲
              if(zsdg && zsdg.length > 0){
                $scope.loadingImgShow = false; //rz_setDaGang.html
                Lazy(zsdg).each(function(dg, idx, lst){
                  if(dg.LEIXING == 1){
                    pubZsdgArr.push(dg);
                  }
                });
                //有公共知识大纲
                if(pubZsdgArr.length){
                  $scope.pubDaGangList = pubZsdgArr;
                  $scope.adminParams.selected_dg = '';
                }
                //没有公共知识大纲
                else{
                  DataService.alertInfFun('pmt', '没有公共知识大纲，请新增一个！');
                }
                //查询此领域下的所有公共知识点
                $scope.qryPubZsdByKeMu(lyId);
              }
              //没有知识大纲
              else{
                $scope.loadingImgShow = false; //rz_setDaGang.html
                DataService.alertInfFun('pmt', '没有公共知识大纲，请新增一个！');
              }
            });
          }
          else{
            $scope.dgZsdList = ''; //重置公共知识大纲知识点
            $scope.pubDaGangList = ''; //重置所有所有公共知识大纲
            $scope.publicKnowledge = ''; //重置公共知识点
            $scope.adminParams.selected_dg = '';
          }
        };

        /**
         * 由所选的知识大纲，得到知识点
         */
        $scope.getPubDgZsdData = function(dgId){
          //得到知识大纲知识点id的递归函数
          function _do(item) {
            pubDgZsdIdArr.push(item.ZHISHIDIAN_ID);
            if(item.ZIJIEDIAN && item.ZIJIEDIAN.length > 0){
              Lazy(item.ZIJIEDIAN).each(_do);
            }
          }
          if(dgId){
            var qryZsdgZsdUrl = qryZsdgZsdBaseUrl + dgLyId + '&zhishidagangid=' + dgId, //查询知识大纲知识点的url
              //pubDgZsdIdArr = [], //存放公共知识大纲知识点id的数组
              //diffZsdIdArr, //存放不同知识点id的变量
              //singleZsdData, //存放一条公共知识点数据的变量
              //pubZsdList = [], //存放多条公共知识点的变量
              selectDgDetail; //存放所选知识大纲的详细信息
            pubDgZsdIdArr = [];
            $scope.loadingImgShow = true; //rz_setDaGang.html
            $scope.publicKnowledge = ''; //重置公共知识点
            //得到所选的知识大纲的详细信息
            selectDgDetail =  Lazy($scope.pubDaGangList).findWhere({ ZHISHIDAGANG_ID: dgId });
            if(Lazy(selectDgDetail).size()){
              daGangData.shuju.ZHISHIDAGANG_ID = selectDgDetail.ZHISHIDAGANG_ID;
              daGangData.shuju.ZHISHIDAGANGMINGCHENG = selectDgDetail.ZHISHIDAGANGMINGCHENG;
              daGangData.shuju.DAGANGSHUOMING = selectDgDetail.DAGANGSHUOMING;
              daGangData.shuju.GENJIEDIAN_ID = selectDgDetail.GENJIEDIAN_ID;
              daGangData.shuju.LEIXING = 1;
              daGangData.shuju.ZHUANGTAI = selectDgDetail.ZHUANGTAI;
              daGangData.shuju.JIEDIAN = [];
              isAddNewPubDg = false; //是否是新建知识大纲
            }
            //查询此公共知识大纲下的知识点
            $http.get(qryZsdgZsdUrl).success(function(dgZsd){
              if(dgZsd.length){
                $scope.loadingImgShow = false; //rz_setDaGang.html
                $scope.dgZsdList = dgZsd;
                //从公共知识点中去除大纲中已有的知识点
                //得到知识大纲知识点的数组
                Lazy(dgZsd).each(_do);

                //从已有的公共知识点中减去知识大纲知识点
                minusZsdFun();
                //diffZsdIdArr = Lazy(pubZsdIdArr).without(pubDgZsdIdArr);
                ////得到相对应的公共知识大纲知识点
                //Lazy(diffZsdIdArr).each(function(zsdId, idx, lst){
                //  singleZsdData = Lazy(publicKnowledgeData).findWhere({ ZHISHIDIAN_ID: zsdId });
                //  pubZsdList.push(singleZsdData);
                //});
                //Lazy($scope.pubDaGangList).each(function(pdg, idx, lst){
                //  pubZsdList = Lazy(pubZsdList).reject(function(pzsd){
                //    return pzsd.ZHISHIDIANMINGCHENG == pdg.ZHISHIDAGANGMINGCHENG ;
                //  }).toArray();
                //});
                //$scope.publicKnowledge = pubZsdList;
                isDaGangSet = true;
              }
              else{
                $scope.loadingImgShow = false; //rz_setDaGang.html
                $scope.dgZsdList = '';
              }
            });
          }
          else{
            $scope.dgZsdList = '';
          }
        };

        /**
         * 添加知识点
         */
        $scope.dgAddNd = function(nd) {
          var newNd = {};
          newNd.JIEDIAN_ID = '';
          newNd.ZHISHIDIAN_ID = '';
          newNd.ZHISHIDIANMINGCHENG = '';
          newNd.ZHISHIDIAN_LEIXING = 1;
          newNd.JIEDIANLEIXING = 1;
          newNd.JIEDIANXUHAO = nd.ZIJIEDIAN.length + 1;
          newNd.ZHUANGTAI = 1;
          newNd.ZIJIEDIAN = [];
          newNd.JIGOU_ID = 0; //公共知识大纲的机构id都为0
          nd.ZIJIEDIAN.push(newNd);
        };

        /**
         * 删除知识点
         */
        $scope.dgRemoveNd = function(parentNd, nd, idx) {
          var cfmInfo = confirm("确定要删除知识点吗？");
          function getPubZsd(item) {
            if(item.ZHISHIDIAN_ID){
              var pubZsdObj = Lazy(publicKnowledgeData).findWhere({ ZHISHIDIAN_ID: item.ZHISHIDIAN_ID });
              $scope.publicKnowledge.push(pubZsdObj);
              if(item.ZIJIEDIAN && item.ZIJIEDIAN.length > 0) {
                Lazy(item.ZIJIEDIAN).each(getPubZsd);
              }
            }
          }
          if(cfmInfo){
            getPubZsd(nd);
            parentNd.ZIJIEDIAN.splice(idx, 1);
          }
        };

        /**
         * 那一个输入框被选中了
         */
        var targetInput, targetNd;
        $scope.getInputIndex = function(event, nd){
          targetInput = $(event.target);
          targetNd = nd;
        };

        /**
         * 将公共知识点添加到知识大纲
         */
        $scope.addToDaGang = function(zsd, idx){
          targetNd.ZHISHIDIAN_ID = zsd.ZHISHIDIAN_ID;
          targetNd.ZHISHIDIANMINGCHENG = zsd.ZHISHIDIANMINGCHENG;
  //        targetInput.focus();  //此处有问题先注释掉
          targetNd = '';
          $scope.publicKnowledge.splice(idx, 1);
        };

        /**
         * 删除公共知识大纲知识点
         */
        $scope.deletePubDgZsd = function(zsdId, idx){
          var qrytimuliebiao = qrytimuliebiaoBase + '&zhishidian_id=' + zsdId,
            zsdObj = {
              token: token,
              caozuoyuan: caozuoyuan,
              jigouid: 0,
              lingyuid: 0,
              shuju: {
                ZHISHIDIAN_ID: zsdId,
                ZHUANGTAI: -1
              }
            };
          if(confirm('确定要删除此公共知识点？')){
            if(zsdId){
              //先查询此知识点下面有没有
              $http.get(qrytimuliebiao).success(function(tmIds){
                if(tmIds.length){
                  DataService.alertInfFun('pmt', '此知识点下有试题，禁止删除！');
                }
                else{
                  $http.post(alterZsdUrl, zsdObj).success(function(data){
                    if(data.result){
                      DataService.alertInfFun('suc', '删除成功！');
                      $scope.publicKnowledge.splice(idx, 1);
                    }
                    else{
                      DataService.alertInfFun('err', data.error);
                    }
                  });
                }
              });
            }
            else{
              DataService.alertInfFun('err', '请选择要删除知识点！');
            }
          }
        };

        /**
         * 当输入介绍后检查公共知识大纲中是否已经存在知识点
         */
        $scope.compareInputVal = function(nd){
          var str  = nd.ZHISHIDIANMINGCHENG;
          str = str.replace(/\s+/g,"");
          var result = Lazy($scope.publicKnowledge).findWhere({ ZHISHIDIANMINGCHENG: str });
          if(result){
            nd.ZHISHIDIAN_ID = result.ZHISHIDIAN_ID;
            nd.ZHISHIDIANMINGCHENG = result.ZHISHIDIANMINGCHENG;
            $scope.publicKnowledge = Lazy($scope.publicKnowledge).reject(function(pkg){
              return pkg.ZHISHIDIAN_ID == result.ZHISHIDIAN_ID;
            }).toArray();
          }
        };

        /**
         * 新增公共知识大纲
         */
        var isAddNewPubDg = false; //是不是新建知识大纲
        $scope.addNewPubDaGang = function(){
          var jieDianObj = {},
            selectLyText = $(".daGangLySelect").find("option:selected").text();
          $scope.dgZsdList = ''; //重置公共知识大纲知识点
          daGangJieDianData = []; //定义一个大纲节点的数据
          //保存大纲是用到的第一级子节点
          jieDianObj.JIEDIAN_ID = '';
          jieDianObj.ZHISHIDIAN_ID = '';
          jieDianObj.ZHISHIDIANMINGCHENG = selectLyText + '新建公共知识大纲';
          jieDianObj.ZHISHIDIAN_LEIXING = 1;
          jieDianObj.JIEDIANLEIXING = 0;
          jieDianObj.JIEDIANXUHAO = 1;
          jieDianObj.ZHUANGTAI = 1;
          jieDianObj.ZIJIEDIAN = [];
          jieDianObj.GEN = 1; //表示为跟知识点
          jieDianObj.JIGOU_ID = 0; //为知识点添加机构ID，admin的机构id为0
          daGangJieDianData.push(jieDianObj);
          isAddNewPubDg = true;
          $scope.dgZsdList = daGangJieDianData;

          //保存大纲其他数据赋值
          daGangData.shuju.ZHISHIDAGANG_ID = '';
          daGangData.shuju.ZHISHIDAGANGMINGCHENG = '';
          daGangData.shuju.DAGANGSHUOMING = selectLyText + '新建公共知识大纲';
          daGangData.shuju.GENJIEDIAN_ID = '';
          daGangData.shuju.LEIXING = 1;
          daGangData.shuju.ZHUANGTAI = 1;
          daGangData.shuju.ZHUANGTAI2 = 1; //添加了是否是默认大纲的状态的参数
          daGangData.shuju.JIEDIAN = [];

          //重新加载公共知识点
          $scope.publicKnowledge = publicKnowledgeData;
        };

        /**
         * 保存知识大纲
         */
        $scope.saveDaGangData = function() {
          var countEmpty = true;
          $scope.adminParams.saveDGBtnDisabled = true;
          function _do(item) {
            if(!item.LEIXING){
              item.ZHISHIDIAN_LEIXING = 1;
            }
            //item.ZHISHIDIANMINGCHENG = item.ZHISHIDIANMINGCHENG.replace(/\s+/g,"");
            if(!item.ZHISHIDIANMINGCHENG){
              countEmpty = false;
            }
            if (item.ZIJIEDIAN && item.ZIJIEDIAN.length > 0) {
              Lazy(item.ZIJIEDIAN).each(_do);
            }
          }
          if($scope.dgZsdList){
            daGangData.shuju.JIEDIAN = $scope.dgZsdList;
            daGangData.shuju.ZHISHIDAGANGMINGCHENG = $scope.dgZsdList[0].ZHISHIDIANMINGCHENG;
            if(!daGangData.shuju.ZHUANGTAI2){
              daGangData.shuju.ZHUANGTAI2 = 1;
            }
            Lazy(daGangData.shuju.JIEDIAN).each(_do);
            $scope.loadingImgShow = true; //rz_setDaGang.html
            //保存知识大纲
            if(countEmpty){
              $http.post(modifyZsdgUrl, daGangData).success(function(data) {
                if(data.result){
                  $scope.loadingImgShow = false; //rz_setDaGang.html
                  DataService.alertInfFun('suc', '保存成功！');
                  $scope.getPubDaGangList(dgLyId); //重新查询此领域下的大纲
                  isDaGangSet = false;
                  $scope.adminParams.selected_dg = '';
                  $scope.adminParams.saveDGBtnDisabled = false;
                }
                else{
                  $scope.loadingImgShow = false; //rz_setDaGang.html
                  $scope.adminParams.saveDGBtnDisabled = false;
                  DataService.alertInfFun('err', data.error);
                }
              });
            }
            else{
              $scope.loadingImgShow = false; //rz_setDaGang.html
              $scope.adminParams.saveDGBtnDisabled = false;
              DataService.alertInfFun('pmt', '知识点名称不能为空！');
            }
          }
          else{
            $scope.loadingImgShow = false; //rz_setDaGang.html
            $scope.adminParams.saveDGBtnDisabled = false;
            DataService.alertInfFun('err', '请选择您要保存的大纲！');
          }
        };

        /**
         * 删除公共知识大纲
         */
        $scope.deletePublicDaGang = function(){
          if($scope.adminParams.selected_dg){
            var pubDgDataObj = {
              token: token,
              caozuoyuan: caozuoyuan,
              zhishidagangid: $scope.adminParams.selected_dg
            };
            if(confirm('确定要删除此公共知识大纲吗？')){
              $http.post(deletePublicDaGangBaseUrl, pubDgDataObj).success(function(data){
                if(data.result){
                  DataService.alertInfFun('suc', '删除公共知识大纲成功！');
                  $scope.pubDaGangList = Lazy($scope.pubDaGangList).reject(function(pdg){
                    return pdg.ZHISHIDAGANG_ID == $scope.adminParams.selected_dg;
                  }).toArray();
                  $scope.adminParams.selected_dg = '';
                  $scope.dgZsdList = '';
                  $scope.publicKnowledge = ''; //重置公共知识点
                }
                else{
                  DataService.alertInfFun('err', data.error);
                }
              });
            }
          }
        };

        /**
         * 科目题型选择
         */
        $scope.renderTiXingSelectTpl = function(){
          $scope.loadingImgShow = true; //rz_selectTiXing.html
          var qryLingYuByJiGou = qryLingYuUrl + '&jigouid=' + userInfo.JIGOU[0].JIGOU_ID,
            childLyArr = [];
          $http.get(qryLingYuByJiGou).success(function(jgLy) { //查询本机构下的领域
            if(jgLy.length){
              Lazy(jgLy).each(function(ply, idx, lst){
                if(ply.CHILDREN.length){
                  Lazy(ply.CHILDREN).each(function(cly, cidx, clst){
                    childLyArr.push(cly);
                  });
                }
              });
              $http.get(qryTiXingUrl).success(function(allTx){
                if(allTx.length){
                  $scope.selectTiXingLiYing = childLyArr;
                  $scope.allTiXing = allTx;
                  $scope.loadingImgShow = false; //rz_selectTiXing.html
                  $scope.isShenHeBox = false; //判断是不是审核页面
                  $scope.adminSubWebTpl = 'views/renzheng/rz_selectTiXing.html';
                }
                else{
                  $scope.loadingImgShow = false; //rz_selectTiXing.html
                  DataService.alertInfFun('err', allTx.error);
                }
              });
            }
            else{
              $scope.loadingImgShow = false; //rz_selectTiXing.html
              $scope.isShenHeBox = false; //判断是不是审核页面
              $scope.adminSubWebTpl = 'views/renzheng/rz_selectTiXing.html';
              DataService.alertInfFun('err', jgLy.error);
            }
          });
        };

        /**
         * 那个领域被选中
         */
        var originKmtx;
        $scope.whichLingYuActive = function(lyId){
          originKmtx = '';
          $scope.activeLingYu = lyId;
          $http.get(qryKmTx + lyId).success(function(data){
            if(data.error){
              DataService.alertInfFun('err', data.error);
            }
            else{
              $scope.kmtxList = data;
              originKmtx = Lazy(data).map(function(tx){return tx.TIXING_ID}).toArray();
              $scope.selectedTxLyStr = Lazy(data).map(function(tx){return 'tx' + tx.TIXING_ID + ';'}).toArray().join();
            }
          });
        };

        /**
         * 添加或者删除题型
         */
        $scope.addOrRemoveTiXing = function(event, tx){
          tiXingData.shuju = [];
          var hasIn = Lazy(originKmtx).contains(tx.TIXING_ID),
            ifCheckOrNot = $(event.target).prop('checked');
          if(ifCheckOrNot){
            $scope.kmtxList.push(tx);
          }
          else{
            if(hasIn){
              var indexInOkt = Lazy(originKmtx).indexOf(tx.TIXING_ID);
              $scope.kmtxList[indexInOkt].ZHUANGTAI = -1;
            }
            else{
              $scope.kmtxList = Lazy($scope.kmtxList).reject(function(kmtx){
                return kmtx.TIXING_ID == tx.TIXING_ID;
              }).toArray();
            }
          }
        };

        /**
         * 保存已选的题型
         */
        $scope.saveSelectTiXing = function(){
          $scope.loadingImgShow = true; //rz_selectTiXing.html
          tiXingData.shuju = [];
          Lazy($scope.kmtxList).each(function(kmtx, idx, lst){
            var txObj = {};
            txObj.TIXING_ID = kmtx.TIXING_ID;
            txObj.JIGOU_ID = jigouid;
            txObj.LINGYU_ID = $scope.activeLingYu;
            txObj.ZHUANGTAI = kmtx.ZHUANGTAI >= -1 ? kmtx.ZHUANGTAI : 1;
            tiXingData.shuju.push(txObj);
          });
          $http.post(modifyTxJgLyUrl, tiXingData).success(function(data){
            if(data.result){
              DataService.alertInfFun('err', '保存成功！');
              $scope.loadingImgShow = false; //rz_selectTiXing.html
            }
            else{
              $scope.loadingImgShow = false; //rz_selectTiXing.html
              DataService.alertInfFun('err', data.error);
            }
          });
        };

        /**
         * 修改密码
         */
        $scope.modifyAdminPassWord = function(){
          var newPsdData = {
              token: token,
              yonghuid: '',
              mima: ''
            },
            userInfo = $rootScope.session.userInfo;
          newPsdData.yonghuid = userInfo.UID;
          newPsdData.mima = $scope.adminParams.newPsd;
          $http.post(alterYongHu, newPsdData).success(function(data){
            if(data.result){
              DataService.alertInfFun('suc', '密码修改成功!');
            }
            else{
              DataService.alertInfFun('err', data.error);
            }
          });
        };

        /**
         * 修改知识点--查询领域
         */
        $scope.renderZhiShiDianSetTpl = function(){
          $scope.setZsdLingYu = '';
          $scope.loadingImgShow = true;
          $scope.adminParams.pubZsdTabOn = -1;
          $scope.zsdSetZsdData = '';
          $scope.adminParams.zsdWrapShow = false;
          $scope.adminParams.fakePlaceHolder = '请选择科目';
          $http.get(qryLingYuUrl).success(function(data){
            if(data){
              $scope.isShenHeBox = false; //判断是不是审核页面
              $scope.adminSubWebTpl = 'views/renzheng/rz_setPubZsd.html';
              $scope.setZsdLingYu = data[0].CHILDREN;
            }
            else{
              DataService.alertInfFun('err', data.error);
            }
            $scope.loadingImgShow = false;
          });
        };

        /**
         * 得到本所选领域下面的科目
         */
        $scope.getKeMuOfSelectLy = function(lyId){
          $scope.selectedKeMu = '';
          $scope.adminParams.selectLinYuId = '';
          $scope.adminParams.selectKeMuIds = [];
          $scope.adminParams.selectKeMuName = [];
          $scope.adminParams.zsdKeMuArr = [];
          $scope.adminParams.zsdWrapShow = false;
          $scope.zsdSetZsdData = '';
          if(lyId){
            $scope.adminParams.selectLinYuId = lyId;
            $scope.selectedKeMu = Lazy($scope.setZsdLingYu).find(function(ly){
              return ly.LINGYU_ID == lyId;
            }).CHILDREN;
          }
          else{
            $scope.selectedKeMu = '';
            $scope.adminParams.fakePlaceHolder = '请选择科目';
          }
        };

        /**
         * 添加或删除科目IDs
         */
        $scope.getKeMuId = function(event, keMu, isKeMuSelect){
          var ifCheckOrNot = $(event.target).prop('checked'),
            idxVal = '';
          if(ifCheckOrNot){
            if(isKeMuSelect){ //此处的keMu数数据为lingyu_id
              $scope.adminParams.selectKeMuIds.push(keMu.LINGYU_ID);
              $scope.adminParams.selectKeMuName.push(keMu.LINGYUMINGCHENG);
            }
            else{ //此处的keMu数数据为lingyu
              var hasInAdd = Lazy($scope.adminParams.zsdKeMuArr).find(function(zsdKm, idx, lst){ //判断是不是原有的科目
                if(zsdKm.LINGYU_ID == keMu.LINGYU_ID){
                  idxVal = idx;
                }
                return zsdKm.LINGYU_ID == keMu.LINGYU_ID;
              });
              if(hasInAdd){
                $scope.adminParams.zsdKeMuArr[idxVal].changeStat = false; //表示原有的科目不删除
              }
              else{
                $scope.adminParams.zsdKeMuArr.push(keMu);
              }
            }
          }
          else{
            if(isKeMuSelect){  //此处的keMu数数据为lingyu_id
              $scope.adminParams.selectKeMuIds =  Lazy($scope.adminParams.selectKeMuIds).reject(function(lyId){
                return lyId  == keMu.LINGYU_ID;
              }).toArray();
              $scope.adminParams.selectKeMuName =  Lazy($scope.adminParams.selectKeMuName).reject(function(lyName){
                return lyName  == keMu.LINGYUMINGCHENG;
              }).toArray();
            }
            else{  //此处的keMu数数据为lingyu
              var hasInDel = Lazy($scope.adminParams.zsdKeMuArr).find(function(zsdKm, idx, lst){ //判断是不是原有的科目
                if(zsdKm.LINGYU_ID == keMu.LINGYU_ID){
                  idxVal = idx;
                }
                return zsdKm.LINGYU_ID == keMu.LINGYU_ID;
              });
              if(hasInDel){
                var originSelectData = $scope.adminParams.zsdKeMuArr[idxVal];
                if(originSelectData.origin){
                  originSelectData.changeStat = true; //表示原有的科目删除
                }
                else{
                  $scope.adminParams.zsdKeMuArr =  Lazy($scope.adminParams.zsdKeMuArr).reject(function(km){
                    return km.LINGYU_ID  == keMu.LINGYU_ID;
                  }).toArray();
                }
              }
            }
          }
        };

        /**
         * 由所选科目查询所对应的知识点
         */
        $scope.getKeMuPubZsdData = function(){
          $scope.adminParams.fakeSelectShow = false;
          $scope.adminParams.pubZsdTabOn = -1;
          $scope.adminParams.zsdWrapShow = false;
          $scope.adminParams.selectZsdId = '';
          if($scope.adminParams.selectKeMuIds && $scope.adminParams.selectKeMuIds.length > 0){
            var qryPubZsd = qryZsdBaseUrl + $scope.adminParams.selectLinYuId + '&kemuid='
              + $scope.adminParams.selectKeMuIds.join();
            $http.get(qryPubZsd).success(function(data){
              if(data && data.length > 0){
//                $scope.zsdSetZsdData = data.splice(0, 15);
                $scope.zsdSetZsdData = data;
              }
              else{
                DataService.alertInfFun('err', '此科目下没有知识点');
              }
            });
          }
          if($scope.adminParams.selectKeMuName && $scope.adminParams.selectKeMuName.length > 0){
            $scope.adminParams.fakePlaceHolder = $scope.adminParams.selectKeMuName.join();
          }
          else{
            $scope.adminParams.fakePlaceHolder = '请选择科目';
          }
        };

        /**
         * 显示知识点的修改页面
         */
        $scope.showModifyZsdBox = function(activeIdx, zsdId, zsdName){
          if(zsdId){
            var cxLyOfZsd = cxLyOfZsdBase + zsdId;
            $scope.adminParams.zsdKeMuArr = [];
            $scope.adminParams.pubZsdTabOn = activeIdx;
            $scope.adminParams.selectZsdId = zsdId;
            $scope.adminParams.zsdOldName = zsdName;
            $scope.adminParams.zsdNewName = zsdName;
            $('input[name="zsdKeMuCb"]').prop('checked', false);
            $http.get(cxLyOfZsd).success(function(kmData){
              if(kmData){
                Lazy(kmData).each(function(km, idx, lst){
                  var kmcss = '.keMu' + km.LINGYU_ID;
                  $(kmcss).prop('checked', true);
                  km.origin = true;
                  km.changeStat = false;
                  $scope.adminParams.zsdKeMuArr.push(km);
                });
              }
              else{
                DataService.alertInfFun('err', kmData.error);
              }
            });
            $scope.adminParams.zsdWrapShow = true;
          }
          else{
            $scope.adminParams.zsdKeMuArr = [];
            $scope.adminParams.selectZsdId = '';
          }
        };

        /**
         * 删除所选的公共知识点
         */
        $scope.deletePubZsd = function(){
          var zsdData = {
            token: token,
            caozuoyuan: caozuoyuan,
            jigouid: 0,
            lingyuid: 0,
            shuju:{
                ZHISHIDIAN_ID: $scope.adminParams.selectZsdId,
                ZHUANGTAI: -1
              }
          };
          if(zsdData.shuju.ZHISHIDIAN_ID){
            if(confirm('你确定要删除此知识大纲吗？')){
              var qryZsdTiMuNum = qryZsdTiMuNumBase + $scope.adminParams.selectZsdId;
              $http.get(qryZsdTiMuNum).success(function(count){
                if(count && count.result > 0){
                  DataService.alertInfFun('pmt', '此知识点下有' + count.result + '道题，因此不能删除此知识点');
                }
                else{
                  $http.post(alterZsdUrl, zsdData).success(function(data){
                    if(data.result){
                      $scope.adminParams.zsdWrapShow = false;
                      $('input[name="zsdKeMuCb"]').prop('checked', false);
                      $scope.zsdSetZsdData = Lazy($scope.zsdSetZsdData).reject(function(zsd){
                        return zsd.ZHISHIDIAN_ID  == data.id;
                      });
                      $scope.adminParams.pubZsdTabOn = -1;
                      $scope.adminParams.zsdOldName = '';
                      $scope.adminParams.zsdNewName = '';
                      DataService.alertInfFun('suc', '删除成功！');
                    }
                    else{
                      DataService.alertInfFun('err', data.error);
                    }
                  });
                }
              });
            }
          }
        };

        /**
         * 提交知识点和科目关系的修改
         */
        $scope.submitZsdKeMuModify = function(){
          var zsdLingYuObj = {
            token: token,
            caozuoyuan: caozuoyuan,
            jigouid: jigouid,
            lingyuid: $scope.adminParams.selectLinYuId,
            shuju: []
          };
          Lazy($scope.adminParams.zsdKeMuArr).each(function(sltKm){
            var mdfObj = {
              ZHISHIDIAN_ID: $scope.adminParams.selectZsdId,
              JIGOU_ID: jigouid,
              LINGYU_ID: '',
              ZHUANGTAI: ''
            };
            if(sltKm.origin){
              if(sltKm.changeStat){
                mdfObj.LINGYU_ID = sltKm.LINGYU_ID;
                mdfObj.ZHUANGTAI = -1;
                zsdLingYuObj.shuju.push(mdfObj);
              }
            }
            else{
              mdfObj.LINGYU_ID = sltKm.LINGYU_ID;
              mdfObj.ZHUANGTAI = 1;
              zsdLingYuObj.shuju.push(mdfObj);
            }
          });
          if(zsdLingYuObj.shuju.length > 0){
            $http.post(modifyZsdLy, zsdLingYuObj).success(function(data){
              if(data.result){
                $scope.adminParams.zsdWrapShow = false;
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
            });
          }

        };

        /**
         * 本机构下教师管理
         */
        $scope.renderTeacherTpl = function(){
          DataService.getData(qryTeacherUrl).then(function(data){
            if(data && data.length){
              var groupByUid = Lazy(data).groupBy(function(teach){ return teach.UID; }).toObject();
              var groupByLy;
              var teachData = [];
              Lazy(groupByUid).each(function(v, k, lst){
                var teachObj = {
                  JIGOUMINGCHENG: k[0].JIGOUMINGCHENG,
                  JIGOU_ID: v[0].JIGOU_ID,
                  lingyu: [],
                  SHOUJI: v[0].SHOUJI,
                  UID: k,
                  XINGMING: v[0].XINGMING,
                  YONGHUHAO: v[0].YONGHUHAO,
                  YONGHUMING: v[0].YONGHUMING,
                  YOUXIANG: v[0].YOUXIANG
                };
                groupByLy = Lazy(v).groupBy(function(tah){ return tah.LINGYU_ID; }).toObject();
                Lazy(groupByLy).each(function(sv, sk, slst){
                  var lyObj = {
                    LINGYU_ID: sk,
                    LINGYUMINGCHENG: sv[0].LINGYUMINGCHENG,
                    juese: Lazy(sv).map(function(th){return th.JUESEMINGCHENG;}).toArray().join(';')
                  };
                  teachObj.lingyu.push(lyObj);
                });
                teachData.push(teachObj);
              });
              $scope.teacherData = teachData;
              $scope.isShenHeBox = false; //判断是不是审核页面
              $scope.adminSubWebTpl = 'views/renzheng/rz_setTeacher.html';
            }
          });
        };

        /**
         * 修改知识点
         */
        $scope.modifyZsdName = function(){
          var zsdName = {
              token: token,
              caozuoyuan: caozuoyuan,
              jigouid: 0,
              lingyuid: 0,
              shuju: {
                ZHISHIDIAN_ID: $scope.adminParams.selectZsdId,
                ZHISHIDIANMINGCHENG: $scope.adminParams.zsdNewName
              }
            },
            idx = $scope.adminParams.pubZsdTabOn;

          if($scope.adminParams.selectZsdId && $scope.adminParams.zsdNewName &&
            $scope.adminParams.zsdNewName !== $scope.adminParams.zsdOldName){
            $http.post(alterZsdUrl, zsdName).success(function(data){
              if(data.result){
                if(idx >= 0){
                  $scope.zsdSetZsdData[idx].ZHISHIDIANMINGCHENG = $scope.adminParams.zsdNewName;
                }
                DataService.alertInfFun('suc', '修改成功！');
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
            });
          }
          else{
            DataService.alertInfFun('pmt', '请选择要修改的知识点，并输入新名称！');
          }
        };

        /**
         *  扫描设定
         */
        $scope.renderScannerSetTpl = function(){
          if(!($scope.jigou_list && $scope.jigou_list.length)){
            DataService.getData(qryJiGouUrl + '1').then(function(data){
              $scope.jigou_list = data;
            });
          }
          $scope.isShenHeBox = false; //判断是不是审核页面
          $scope.loadingImgShow = false;
          $scope.adminSubWebTpl = 'views/renzheng/rz_scanner.html';
        };

        /**
         * 由所选机构，得到相应的科目
         */
        $scope.getKeMuList = function(jgid){
          if(jgid){
            var qryLy = qryLingYuUrl + '&jigouid=' + jgid,
              dataArr = [];
            $scope.kemu_list = '';
            $scope.kaoChangList = '';
            $scope.scanner.selectInfo.kmid = '';
            DataService.getData(qryLy).then(function(lyData){
              Lazy(lyData).each(function(ly, idx, lst){
                Lazy(ly.CHILDREN).each(function(km, kmIdx, kmLst){
                  dataArr.push(km);
                });
              });
              $scope.kemu_list = dataArr;
            });
          }
          else{
            $scope.kemu_list = '';
            DataService.alertInfFun('pmt', '请选择机构ID');
          }
        };

        /**
         * 由所选科目，查询考试组 + '&jigouid=' + jigouid + '&lingyuid=' + lingyuid
         */
        $scope.getKaoShiZuList = function(kmId){
          var kaoShiZuListUrl = qryKaoShiZuListUrl;
          if($scope.scanner.selectInfo.jgid){
            kaoShiZuListUrl += '&jigouid=' + $scope.scanner.selectInfo.jgid;
          }
          else{
            DataService.alertInfFun('pmt', '请选择机构！');
            return ;
          }
          if(kmId){
            kaoShiZuListUrl += '&lingyuid=' + kmId;
          }
          else{
            DataService.alertInfFun('pmt', '请选择科目！');
            return ;
          }
          kaoShiZuListUrl += '&zhuangtai=' + [0, 1, 2, 3, 4, 5, 6];
          $http.get(kaoShiZuListUrl).success(function(data){
            if(data && data.length >0){
              $scope.kaoshizu_list = data;
            }
            else{
              $scope.kaoshizu_list = '';
              DataService.alertInfFun('err', data.error);
            }
          });
        };

        /**
         * 由所选考试组，查询考试
         */
        $scope.getKaoShiList = function(kszid){
          if(kszid){
            var chaXunChangCi = chaXunChangCiUrl + kszid;
            $http.get(chaXunChangCi).success(function(data) {
              if (data && data.length > 0) {
                var ccArr = [];
                Lazy(data).groupBy('KAOSHI_ID').each(function(v, k, l){
                  var ccDist = Lazy(v).groupBy('KID').toObject();
                  Lazy(ccDist).each(function(v1, k1, l1){
                    var ccObj = v1[0];
                    var sjName = [];
                    var sjId = [];
                    var sjArr = [];
                    Lazy(v1).each(function(cc){
                      var sjObj = {
                        SHIJUANMINGCHENG: cc.SHIJUANMINGCHENG,
                        SHIJUAN_ID: cc.SHIJUAN_ID
                      };
                      sjName.push(cc.SHIJUANMINGCHENG);
                      sjId.push(cc.SHIJUAN_ID);
                      sjArr.push(sjObj);
                    });
                    ccObj.SHIJUANMINGCHENG = sjName.join(';');
                    ccObj.SHIJUAN_ID = sjId.join(';');
                    ccObj.shijuans = sjArr;
                    ccObj.kaoShiShiJian = DataService.baoMingDateFormat(ccObj.KAISHISHIJIAN, ccObj.JIESHUSHIJIAN);
                    ccArr.push(ccObj);
                  });
                });
                Lazy(ccArr).sortBy(function(cc){return cc.KAISHISHIJIAN});
                $scope.kaoshi_list = ccArr;
              }
              else {
                DataService.alertInfFun('err', data.error);
              }
            })
          }
          else{
            $scope.kaoshi_list = '';
            DataService.alertInfFun('pmt', '请选择考试组！');
          }
        };

        /**
         * 由考试得到试卷
         */
        $scope.getShiJuanList = function(ksid){
          var selectKs = Lazy($scope.kaoshi_list).find(function(ks){
            return ks.KAOSHI_ID == ksid;
          });
          if(selectKs){
            $scope.shijuan_list = selectKs.shijuans;
          }
          else{
            $scope.shijuan_list = '';
            DataService.alertInfFun('pmt', '没有试卷信息！');
          }
        };

        /**
         * 保存扫描仪设定信息
         */
        $scope.saveScannerSet = function(){
          var omr_set = {
            "考试组ID": $scope.scanner.selectInfo.kszid,
            "考试ID": $scope.scanner.selectInfo.ksid,
            "OMR考试ID": $scope.scanner.inputInfo.omrksid,
            "试卷映射":[]
          };
          $scope.scannerResInfo = '';
          if($scope.scanner.inputInfo.sjaid){
            var obja = {"OMR试卷编号":"A","试卷ID": $scope.scanner.inputInfo.sjaid};
            omr_set['试卷映射'].push(obja);
          }
          else{
            DataService.alertInfFun('pmt', '请填写A卷的试卷ID！');
            return ;
          }
          if($scope.scanner.inputInfo.sjbid){
            var objb = {"OMR试卷编号":"B","试卷ID": $scope.scanner.inputInfo.sjbid};
            omr_set['试卷映射'].push(objb);
          }
          if($scope.scanner.inputInfo.xuehao && $scope.scanner.inputInfo.xuehao.length > 0){
            var newStr = $scope.scanner.inputInfo.xuehao.replace(/，/g, ',');
            var xuehaoArr = newStr.split(',');
            var xhObj = {'学号': ''};
            xhObj['学号'] = xuehaoArr;
            omr_set['筛选'] = xhObj;
          }
          if($scope.scanner.selectInfo.kszid && $scope.scanner.selectInfo.ksid){
            var scannerUrl = scannerBaseUrl + JSON.stringify(omr_set);
            $scope.loadingImgShow = true;
            $http.get(scannerUrl).success(function(data){
              if(data.result){
                $scope.scannerResInfo = data.message;
                $scope.loadingImgShow = false;
              }
              else{
                $scope.loadingImgShow = false;
                DataService.alertInfFun('err', data.error);
              }
            });
          }
          else{
            $scope.loadingImgShow = false;
            DataService.alertInfFun('pmt', '请选择考试组和考试！');
          }
        };

        /**
         * pdf设定
         */
        $scope.renderPdfTpl = function(){
          if(!($scope.jigou_list && $scope.jigou_list.length)){
            DataService.getData(qryJiGouUrl + '1').then(function(data){
              $scope.jigou_list = data;
            });
          }
          $scope.isShenHeBox = false; //判断是不是审核页面
          $scope.adminSubWebTpl = 'views/renzheng/rz_pdf.html';
        };

        /**
         * 生成pdf
         */
        $scope.createPdf = function(stat){
          var obj = {
            token: token,
            kaozhizuid: '',
            xuexiaoname: '',
            kaoshizuname: '',
            pfdtype: stat
          };
          if($scope.scanner.selectInfo.kszid){
            obj.kaozhizuid = $scope.scanner.selectInfo.kszid;
            var findKaoShiZi = Lazy($scope.jigou_list).find(function(jg){
              return jg.JIGOU_ID == $scope.scanner.selectInfo.jgid;
            });
            var findKaoShiZu = Lazy($scope.kaoshizu_list).find(function(ksz){
              return ksz.KAOSHIZU_ID == $scope.scanner.selectInfo.kszid;
            });
            obj.xuexiaoname = findKaoShiZi.JIGOUMINGCHENG;
            obj.kaoshizuname = findKaoShiZu.KAOSHIZU_NAME;
            $http({method: 'GET', url: createPdfUrl, params: obj}).success(function(data){
              if(data.result){
                DataService.alertInfFun('suc', '生成成功！');
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
            });
          }
          else{
            DataService.alertInfFun('pmt', '请选择考试组!');
          }
        };

    }]);
});
