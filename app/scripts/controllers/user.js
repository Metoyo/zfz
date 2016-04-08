define(['angular', 'config', 'datepicker', 'jquery', 'lazy'], function (angular, config, datepicker, $, lazy) {
  'use strict';

  angular.module('zhifzApp.controllers.UserCtrl', [])
    .controller('UserCtrl', ['$rootScope', '$scope', '$http', '$location', 'DataService',
      function ($rootScope, $scope, $http, $location, DataService) {

        $scope.addedContainerClass = 'userBox';
        $scope.shenheList = [];
        $scope.showShenhe = false;
        $scope.isShenHeBox = true; //判断是不是审核页面

        /**
         * 定义变量
         */
        var baseRzAPIUrl = config.apiurl_rz; //renzheng的api;
        var baseMtAPIUrl = config.apiurl_mt; //mingti的api
        var baseKwAPIUrl = config.apiurl_kw; //考务的api
        var baseSmAPIUrl = config.apiurl_sm; //扫描的api
        var token = config.token; //token的值
        var caozuoyuan = 0;//登录的用户的UID
        var jigouid = 0;
        var lingyuid = 0;
        var qryJiGouUrl = baseRzAPIUrl + 'jiGou?token=' + token + '&leibieid='; //由机构类别查询机构的url
        var qryLingYuUrl = baseRzAPIUrl + 'lingyu?token=' + token; //查询领域的url
        var jiGouData = { //新增机构的数据
          token: token,
          caozuoyuan: caozuoyuan,
          shuju:[]
        };
        var modifyJiGouAdminUrl = baseRzAPIUrl + 'modify_jigou_admin'; //修改机构管理员
        var adminData = { //新增机构管理员的数据
          token: token,
          caozuoyuan: caozuoyuan,
          shuju:{}
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
        var isDaGangSet = false; //是否是大纲设置
        var isLingYuSet = false; //是否是领域设置
        var qrytimuliebiaoBase = baseMtAPIUrl + 'chaxun_timuliebiao?token=' + token + '&caozuoyuan=' + caozuoyuan +
          '&jigouid=' + jigouid + '&lingyuid=' + lingyuid; //查询题目列表的url
        var alterZsdUrl = baseMtAPIUrl + 'xiugai_zhishidian'; //修改知识点的url
        var modifyZsdLy = baseMtAPIUrl + 'xiugai_zhishidian_lingyu'; //修改知识点领域
        var qryZsdTiMuNumBase = baseMtAPIUrl + 'chaxun_timu_count?token=' + token + '&zhishidianid='; //查询此题目
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
        var xueXiaoUrl = '/xuexiao'; //机构的增删改查
        var yongHuUrl = '/yonghu'; //用户的增删改查
        var yongHuJueSeUrl = '/yonghu_juese'; //用户角色URL
        var lingYuUrl = '/lingyu'; //领域URL
        var keMuUrl = '/kemu'; //科目URL
        var xueXiaoKeMuUrl = '/xuexiao_kemu'; //学校科目
        var tiXingUrl = '/tixing'; //题型
        var xueXiaoKeMuTiXingUrl = '/xuexiao_kemu_tixing'; //学校科目题型
        var zhiShiDianUrl = '/zhishidian'; //知识点
        var loginUsr = $rootScope.loginUsr;
        var jgID = loginUsr['学校ID']; //登录用户学校
        var logUid = loginUsr.UID; //登录用户的UID

        $scope.adminParams = {
          selected_dg: '',
          saveDGBtnDisabled: false,
          newPsd: '',
          selectLinYuId: '',
          selectZsdId: '',
          zsdOldName: '', //知识
          zsdNewName: '' //知识点修改新名称
        };
        $scope.pageParam = {
          currentPage: '',
          lastPage: '',
          pageArr: []
        };
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
        }

        /**
         * 退出程序 --
         */
        $scope.signOut = function(){
          DataService.logout();
        };

        /**
         * 设置权限，审核权限 --
         */
        $scope.renderPerm = function() {
          $scope.loadingImgShow = true;
          var obj = {method: 'GET', url: yongHuJueSeUrl, params: ''};
          $scope.shenHeList = [];
          obj.params = {
            '学校ID': jgID,
            '状态': 0
          };
          $http(obj).success(function(data) {
            if(data.result){
              var distByUid = Lazy(data.data).groupBy(function(usr){return usr.UID;}).toObject();
              Lazy(distByUid).each(function(v, k, l){ //通过UID排序
                var temp = {
                  UID: k,
                  '用户名': v[0]['用户名'],
                  '姓名': v[0]['姓名'],
                  btn: false,
                  '待审': []
                };
                var count = 0;
                var distByKm = Lazy(v).groupBy(function(ds){return ds['科目ID']});
                Lazy(distByKm).each(function(v1, k1, l1){ //通过科目排序
                  var kmTemp = {
                    '科目ID': k1,
                    '科目名称': v1[0]['科目名称'],
                    '角色': ''
                  };
                  var jsArr = [
                    {
                      '学校ID': v1[0]['学校ID'],
                      '领域ID': v1[0]['领域ID'],
                      '科目ID': v1[0]['科目ID'],
                      '角色ID': 2,
                      '状态': -1,
                      '角色名称': '科目负责人',
                      ckd: false
                    },
                    {
                      '学校ID': v1[0]['学校ID'],
                      '领域ID': v1[0]['领域ID'],
                      '科目ID': v1[0]['科目ID'],
                      '角色ID': 4,
                      '状态': -1,
                      '角色名称': '阅卷组长',
                      ckd: false
                    },
                    {
                      '学校ID': v1[0]['学校ID'],
                      '领域ID': v1[0]['领域ID'],
                      '科目ID': v1[0]['科目ID'],
                      '角色ID': 3,
                      '状态': -1,
                      '角色名称': '任课老师',
                      ckd: false
                    },
                    {
                      '学校ID': v1[0]['学校ID'],
                      '领域ID': v1[0]['领域ID'],
                      '科目ID': v1[0]['科目ID'],
                      '角色ID': 5,
                      '状态': -1,
                      '角色名称': '助教',
                      ckd: false
                    }
                  ];
                  Lazy(jsArr).each(function(ojs){
                    var findJs = Lazy(v1).find(function(js){return js['角色ID'] == ojs['角色ID']});
                    if(findJs){
                      ojs.ckd = true;
                      ojs['状态'] = findJs['状态'];
                      if(findJs['状态'] == 0){
                        count ++;
                      }
                    }
                  });
                  kmTemp['角色'] = jsArr;
                  temp['待审'].push(kmTemp);
                });
                if(count > 0){
                  temp.btn = true;
                }
                $scope.shenHeList.push(temp);
              });
              $scope.isShenHeBox = true;
              $scope.adminSubWebTpl = 'views/renzheng/rz_shenHe.html';
            }
            else{
              DataService.alertInfFun('err', data.error);
            }
            $scope.loadingImgShow = false;
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

        /**
         * 已经通过审核的科目，点击或者选中后通过按钮显示 --
         */
        $scope.jueseClicked = function(js) {
          js.ckd = !js.ckd;
        };

        /**
         * 通过审核的按钮 --
         */
        $scope.authPerm = function(usr) {
          var obj = {method: 'POST', url: yongHuJueSeUrl, data: {UID: usr.UID, '角色': []}};
          var dsArr = [];
          Lazy(usr['待审']).each(function(km){
            Lazy(km['角色']).each(function(js){
              if(js.ckd){
                var temp = {
                  '学校ID': js['学校ID'],
                  '领域ID': js['领域ID'],
                  '科目ID': js['科目ID'],
                  '角色ID': js['角色ID'],
                  '状态': 1
                };
                dsArr.push(temp);
              }
            });
          });
          if(dsArr && dsArr.length > 0){
            obj.data['角色'] = JSON.stringify(dsArr);
            $http(obj).success(function(data){
              if(data.result){
                usr.btn = false;
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
            });
          }
          else{
            DataService.alertInfFun('pmt', '请选择需要通过审核的角色！');
          }
        };

        /**
         * 机构查询 --
         */
        var getJgList = function(jsid){
          $scope.loadingImgShow = true;
          $http.get(xueXiaoUrl).success(function(schools){
            if(schools.result){
              if(jsid > 0){
                var obj = {};
                obj['角色ID'] = jsid;
                $http({method: 'GET', url: yongHuJueSeUrl, params: obj}).success(function(data){
                  if(data.result){
                    Lazy(schools.data).each(function(sch){
                      sch.ADMINISTRATORS = Lazy(data.data).filter(function(js){
                        return js['学校ID'] == sch['学校ID'];
                      }).toArray();
                    });
                  }
                });
              }
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
            getJgList(1);
          }
          $scope.isShenHeBox = false;
          $scope.adminSubWebTpl = 'views/renzheng/rz_setJiGou.html';
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
         * 删除机构 --
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
         * 展示管理机构管理页面 --
         */
        $scope.manageAdmin = function(jg, idx){
          $scope.isAddNewAdminBoxShow = true; //显示管理管理员页面
          $scope.isAddNewJiGouBoxShow = false; //关闭机构增加页面
          $scope.selectJg = jg;
          $scope.newXxgly = {
            '用户名' : '',
            '邮箱': '',
            '手机': '',
            '密码': '',
            '学校ID': jg['学校ID'],
            '用户类别': 1,
            '角色': [
              {
                '学校ID': jg['学校ID'],
                '领域ID': 0,
                '科目ID': 0,
                '角色ID': 1
              }
            ]
          };
        };

        /**
         * 学校管理员的添加 --
         */
        $scope.saveNewAddAdmin = function(){
          var mis = [];
          if(!$scope.newXxgly['用户名']){
            mis.push('用户名');
          }
          if(!$scope.newXxgly['邮箱']){
            mis.push('邮箱');
          }
          if(!$scope.newXxgly['手机']){
            mis.push('手机');
          }
          if(!$scope.newXxgly['密码']){
            mis.push('密码');
          }
          if(mis.length > 0) {
            DataService.alertInfFun('pmt', '缺少: ' + mis.join(','));
            return ;
          }
          $scope.loadingImgShow = true;
          $scope.newXxgly['角色'] = JSON.stringify($scope.newXxgly['角色']);
          $http.put(yongHuUrl, $scope.newXxgly).success(function(data){
            if(data.result){
              $scope.closeManageAdmin();
              DataService.alertInfFun('suc', '新增成功');
              getJgList();
              $scope.newXxgly = '';
            }
            else{
              DataService.alertInfFun('err', data.error);
            }
            $scope.loadingImgShow = false;
          });
        };

        /**
         * 删除机构管理员 --
         */
        $scope.deleteJiGouAdmin = function(adm){
          if(adm['UID']){
            $scope.loadingImgShow = true;
            var obj = {};
            obj['UID'] = adm['UID'];
            $http({method: 'delete', url: yongHuUrl, params: obj}).success(function(data){
              if(data.result){
                DataService.alertInfFun('suc', '删除成功！');
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
         * 关闭添加学校管理员页面 --
         */
        $scope.closeManageAdmin = function(){
          $scope.isAddNewAdminBoxShow = false;
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
         * 展示科目设置(领域) --
         */
        $scope.renderLingYuSetTpl = function(){
          $scope.loadingImgShow = true;
          $http.get(lingYuUrl).success(function(allLy){
            if(allLy.result){
              $http.get(keMuUrl).success(function(allKm){
                if(allKm.result){
                  //数据组合
                  var allKmSortObj = Lazy(allKm.data).groupBy(function(km){
                    return km['领域ID'];
                  }).toObject();
                  Lazy(allLy.data).each(function(ly){
                    ly['科目'] = allKmSortObj[ly['领域ID']];
                  });
                  $scope.lingyu_list = allLy.data;
                  $scope.isShenHeBox = false;
                  $scope.lyKmSetPageShow = false;
                  $scope.lyOrKmSet = {
                    name: '',
                    type: '',
                    val: ''
                  };
                  $scope.adminSubWebTpl = 'views/renzheng/rz_setLingYu.html';
                }
                else{
                  DataService.alertInfFun('err', allKm.error);
                }
              });
            }
            else{
              DataService.alertInfFun('err', allLy.error);
            }
            $scope.loadingImgShow = false;
          });
        };

        /**
         * 添加领域 --
         */
        $scope.addLy = function() {
          $scope.lyOrKmSet.type = 'nl';
          $scope.lyKmSetPageShow = true;
        };

        /**
         * 修改领域 --
         */
        $scope.alterLy = function(ly) {
          $scope.lyOrKmSet.type = 'al';
          $scope.lyOrKmSet.name = ly['领域名称'];
          $scope.lyOrKmSet.val = ly;
          $scope.lyKmSetPageShow = true;
        };

        /**
         * 添加科目 --
         */
        $scope.addKm = function(ly) {
          $scope.lyOrKmSet.type = 'nk';
          $scope.lyOrKmSet.val = ly;
          $scope.lyKmSetPageShow = true;
        };

        /**
         * 修改科目 --
         */
        $scope.alterKm = function(km) {
          $scope.lyOrKmSet.type = 'ak';
          $scope.lyOrKmSet.val = km;
          $scope.lyOrKmSet.name = km['科目名称'];
          $scope.lyKmSetPageShow = true;
        };

        /**
         * 删除科目 --
         */
        $scope.deleteLyKm = function(idx, ly, km) {
          var obj = {method: 'POST', url: '', data: ''};
          if(km){
            obj.url = keMuUrl;
            obj.data = {
              '科目ID': km['科目ID'],
              '状态': -1
            };
          }
          else{
            obj.url = lingYuUrl;
            obj.data = {
              '领域ID': ly['领域ID'],
              '状态': -1
            };
          }
          if(confirm('确定要删除吗？')){
            $http(obj).success(function(data){
              if(data.result){
                if(km){
                  ly['科目'] = ly['科目'].splice(idx, 1);
                }
                else{
                  $scope.lingyu_list.splice(idx, 1);
                }
                DataService.alertInfFun('suc', '删除成功');
              }
              else{
                DataService.alertInfFun('pmt', data.error);
              }
            });
          }
        };

        /**
         * 关闭领域和科目的添加和修改 --
         */
        $scope.closeAddLMPage = function(){
          $scope.lyOrKmSet = {
            name: '',
            type: '',
            val: ''
          };
          $scope.lyKmSetPageShow = false;
        };

        /**
         * 保存领域和科目的添加和修改 --
         */
        $scope.saveAddLM = function(){
          var obj = {method: '', url: '', data: ''};
          if($scope.lyOrKmSet.type == 'nl'){ //添加领域
            obj.method = 'PUT';
            obj.url = lingYuUrl;
            if($scope.lyOrKmSet.name){
              obj.data = {'领域名称': $scope.lyOrKmSet.name};
            }
            else{
              DataService.alertInfFun('pmt', '缺少领域名称！');
              return ;
            }
          }
          if($scope.lyOrKmSet.type == 'al'){ //修改领域
            obj.method = 'POST';
            obj.url = lingYuUrl;
            if($scope.lyOrKmSet.name && $scope.lyOrKmSet.name != $scope.lyOrKmSet.val['领域名称']){
              obj.data = {
                '领域名称': $scope.lyOrKmSet.name,
                '领域ID': $scope.lyOrKmSet.val['领域ID']
              };
            }
            else{
              DataService.alertInfFun('pmt', '缺少领域名称或者领域名称没有变化！');
              return ;
            }
          }
          if($scope.lyOrKmSet.type == 'nk'){ //添加科目
            obj.method = 'PUT';
            obj.url = keMuUrl;
            if($scope.lyOrKmSet.name){
              obj.data = {
                '科目名称': $scope.lyOrKmSet.name,
                '领域ID': $scope.lyOrKmSet.val['领域ID']
              };
            }
            else{
              DataService.alertInfFun('pmt', '缺少科目名称！');
              return ;
            }
          }
          if($scope.lyOrKmSet.type == 'ak'){ //修改科目
            obj.method = 'POST';
            obj.url = keMuUrl;
            if($scope.lyOrKmSet.name && $scope.lyOrKmSet.name != $scope.lyOrKmSet.val['科目名称']){
              obj.data = {
                '科目名称': $scope.lyOrKmSet.name,
                '科目ID': $scope.lyOrKmSet.val['科目ID']
              };
            }
            else{
              DataService.alertInfFun('pmt', '缺少科目名称或者科目名称没有变化');
              return ;
            }
          }
          $http(obj).success(function(data){
            if(data.result){
              if($scope.lyOrKmSet.type == 'nl'){
                $scope.lingyu_list.push({
                  '领域ID': data.data['领域ID'],
                  '领域名称': $scope.lyOrKmSet.name,
                  '科目': []
                });
              }
              if($scope.lyOrKmSet.type == 'al'){
                $scope.lyOrKmSet.val['领域名称'] = $scope.lyOrKmSet.name;
              }
              if($scope.lyOrKmSet.type == 'nk'){
                $scope.lyOrKmSet.val['科目'] = $scope.lyOrKmSet.val['科目'] || [];
                $scope.lyOrKmSet.val['科目'].push({
                  '科目ID': data.data['科目ID'],
                  '科目名称': $scope.lyOrKmSet.name,
                  '领域ID': $scope.lyOrKmSet.val['领域ID'],
                  '领域名称': $scope.lyOrKmSet.val['领域名称']
                });
              }
              if($scope.lyOrKmSet.type == 'ak'){
                $scope.lyOrKmSet.val['科目名称'] = $scope.lyOrKmSet.name;
              }
              $scope.lyOrKmSet = {
                name: '',
                type: '',
                val: ''
              };
              DataService.alertInfFun('suc', '成功！');
            }
            else{
              DataService.alertInfFun('err', data.error);
            }
          });
          $scope.lyKmSetPageShow = false;
        };

        /**
         * 学校科目选择 --
         */
        $scope.renderLingYuSelectTpl = function(){
          $scope.jgSelectKeMu = '';
          $http.get(lingYuUrl).success(function(allLy){
            if(allLy.result){
              $http.get(keMuUrl).success(function(allKm){
                if(allKm.result){
                  //整理数据
                  Lazy(allKm.data).each(function(km){
                    km.ckd = false;
                  });
                  var obj = {};
                  obj['学校ID'] = jgID;
                  $http({method: 'GET', url: xueXiaoKeMuUrl, params: obj}).success(function(xxKm){
                    if(xxKm.result){
                      if(xxKm.data && xxKm.data.length > 0){
                        var allKmLen = allKm.data.length;
                        var i;
                        Lazy(xxKm.data).each(function(km){
                          for(i = 0; i < allKmLen; i++){
                            var item = allKm.data[i];
                            if(item['科目ID'] == km['科目ID']){
                              km['领域名称'] = item['领域名称'];
                              km['领域ID'] = item['领域ID'];
                              item.ckd = true;
                              Lazy(allLy.data).each(function(ly){
                                if(ly['领域ID'] == item['领域ID']){
                                  ly.ckd = true;
                                }
                              });
                              break;
                            }
                          }
                        });
                      }
                      $scope.jgSelectKeMu = xxKm.data;
                    }
                    else{
                      $scope.jgSelectKeMu = [];
                      DataService.alertInfFun('err', xxKm.error);
                    }
                    //数据组合
                    var allKmSortObj = Lazy(allKm.data).groupBy(function(km){
                      return km['领域ID'];
                    }).toObject();
                    Lazy(allLy.data).each(function(ly){
                      ly['科目'] = allKmSortObj[ly['领域ID']];
                      if(!ly.ckd){
                        ly.ckd = false;
                      }
                    });
                    $scope.lingyu_list = allLy.data;
                    $scope.adminSubWebTpl = 'views/renzheng/rz_selectLingYu.html';
                  });
                  $scope.isShenHeBox = false;
                }
                else{
                  DataService.alertInfFun('err', allKm.error);
                }
              });
            }
            else{
              DataService.alertInfFun('err', allLy.error);
            }
          });
        };

        /**
         * 添加领域到已选 --
         */
        $scope.addKeMuToSelect = function(ly, km){
          if(km){ //点击的为科目
            km.ckd = !km.ckd;
            if(km.ckd){
              $scope.jgSelectKeMu.push(km);
            }
            else{
              $scope.jgSelectKeMu = Lazy($scope.jgSelectKeMu).reject(function(item){
                return item['科目ID'] == km['科目ID'];
              }).toArray();
            }
            var lyCkd = Lazy(ly['科目']).find(function(kemu){
              return kemu.ckd == true;
            });
            ly.ckd = lyCkd ? true : false;
          }
          else{ //点击的为领域
            ly.ckd = !ly.ckd;
            Lazy(ly['科目']).each(function(kemu){
              if(ly.ckd){
                kemu.ckd = true;
                $scope.jgSelectKeMu.push(kemu);
              }
              else{
                kemu.ckd = false;
                $scope.jgSelectKeMu = Lazy($scope.jgSelectKeMu).reject(function(item){
                  return item['科目ID'] == kemu['科目ID'];
                }).toArray();
              }
            });
          }
        };

        /**
         * 从已选科目删除领域 --
         */
        $scope.deleteSelectedKeMu = function(idx, km){
          $scope.jgSelectKeMu.splice(idx, 1);
          var fdLy = Lazy($scope.lingyu_list).find(function(ly){
            return ly['领域ID'] == km['领域ID'];
          });
          var count = 0;
          Lazy(fdLy['科目']).each(function(kemu){
            if(kemu['科目ID'] == km['科目ID']){
              kemu.ckd = false;
            }
            if(kemu.ckd){
              count ++;
            }
          });
          fdLy.ckd = count ? true : false;
        };

        /**
         * 保存已选的领域 --
         */
        $scope.saveChooseKeMu = function(){
          var obj = {};
          obj['科目'] = Lazy($scope.jgSelectKeMu).map(function(km){
            return km['科目ID'];
          }).toArray();
          obj['学校ID'] = jgID;
          $http.post(xueXiaoKeMuUrl, obj).success(function(data){
            if(data.result){
              DataService.alertInfFun('suc', '保存成功！');
            }
            else{
              DataService.alertInfFun('err', data.error);
            }
          });
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
         * 科目题型选择 --
         */
        $scope.renderTiXingSelectTpl = function(){
          $scope.loadingImgShow = true; //rz_selectTiXing.html
          var objXxKm = {method: 'GET', url: xueXiaoKeMuUrl, params: {'学校ID': jgID}};
          $http(objXxKm).success(function(xxkm) { //查询本机构下的科目
            if(xxkm.result){
              var objTx = {method: 'GET', url: tiXingUrl};
              $http(objTx).success(function(txData){
                if(txData.result){
                  $scope.allTiXing = txData.data;
                }
                else{
                  DataService.alertInfFun('err', txData.error);
                }
              });
              $scope.xueXiaoKeMu = xxkm.data;
              $scope.isShenHeBox = false;
              $scope.adminSubWebTpl = 'views/renzheng/rz_selectTiXing.html';
            }
            else{
              DataService.alertInfFun('err', xxkm.error);
            }
            $scope.loadingImgShow = false;
          });
        };

        /**
         * 那个领域被选中 --
         */
        $scope.whichLingYuActive = function(kmID){
          if(kmID){
            $scope.activeKeMu = kmID;
            var obj = {method: 'GET', url: xueXiaoKeMuTiXingUrl, params: {'学校ID': jgID, '科目ID': kmID}};
            $http(obj).success(function(xxkmtx){
              if(xxkmtx.result){
                Lazy($scope.allTiXing).each(function(atx){
                  var findXxKmTx = Lazy(xxkmtx.data).find(function(tx){return tx['题型ID'] == atx['题型ID']});
                  atx.ckd = findXxKmTx ? true : false;
                });
              }
              else{
                Lazy($scope.allTiXing).each(function(atx){
                  atx.ckd = false;
                });
                DataService.alertInfFun('err', xxkmtx.error);
              }
            });
          }
          else{
            $scope.activeKeMu = '';
            DataService.alertInfFun('pmt', '请选择领域！');
          }
        };


        /**
         * 添加或者删除题型 --
         */
        $scope.addOrRemoveTiXing = function(tx){
          tx.ckd = !tx.ckd;
        };

        /**
         * 保存已选的题型 --
         */
        $scope.saveSelectTiXing = function(){
          var obj = {method: 'POST', url: xueXiaoKeMuTiXingUrl, data: {'学校ID': jgID, '科目ID': $scope.activeKeMu}};
          var txArr = [];
          Lazy($scope.allTiXing).each(function(atx){
            if(atx.ckd){
              txArr.push(atx['题型ID']);
            }
          });
          if(txArr && txArr.length > 0){
            obj.data['题型'] = txArr;
            $http(obj).success(function(data){
              if(data.result){
                DataService.alertInfFun('suc', '保存成功！');
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
            });
          }
          else{
            DataService.alertInfFun('pmt', '请选择题型!');
          }
        };

        /**
         * 修改管理员的密码 --
         */
        $scope.modifyAdminPassWord = function(){
          var obj = {method: 'POST', url: yongHuUrl, data: {UID: logUid, '密码': ''}};
          if($scope.adminParams.newPsd){
            obj.data['密码'] = $scope.adminParams.newPsd;
            $http(obj).success(function(data){
              if(data.result){
                DataService.alertInfFun('suc', '密码修改成功!');
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
            });
          }
          else{
            DataService.alertInfFun('pmt', '请输入新密码！');
          }
        };

        /**
         * 修改知识点 --
         */
        $scope.renderZhiShiDianSetTpl = function(){
          $scope.setZsdLingYu = '';
          $scope.loadingImgShow = true;
          $scope.zsdSetZsdData = '';
          $scope.allPublicZsdData = '';
          //$scope.adminParams.zsdWrapShow = false;
          var obj = {method:'GET', url: lingYuUrl};
          $http(obj).success(function(data){
            if(data.result){
              $scope.isShenHeBox = false; //判断是不是审核页面
              $scope.setZsdLingYu = data.data;
              $scope.adminSubWebTpl = 'views/renzheng/rz_setPubZsd.html';
            }
            else{
              DataService.alertInfFun('err', data.error);
            }
            $scope.loadingImgShow = false;
          });
        };

        /**
         * 分页处理函数
         */
        var pageMake = function(data){
          var perNumOfPage = 15; //每页15条数据
          var dataLen = data.length; //数据长度
          var lastPage = Math.ceil(dataLen/perNumOfPage); //最后一页
          $scope.pageParam.pageArr = Lazy.generate(function(i) { return i + 1; }, lastPage).toArray();
          $scope.pageParam.lastPage = lastPage;
          $scope.pageParam.currentPage = 1;
        };

        /**
         * 得到所选领域的的公共知识点 --
         */
        $scope.getPublicZsd = function(lyId){
          if(lyId){
            $scope.adminParams.selectLinYuId = lyId;
            $scope.zsdSetZsdData = '';
            var obj = {method:'GET', url:zhiShiDianUrl, params:{'领域ID':lyId, '类型': 1}};
            $http(obj).success(function(data){
              if(data.result){
                pageMake(data.data);
                $scope.allPublicZsdData = angular.copy(data.data);
                $scope.currentPage = 1;
                $scope.publicZsdDist(1);
              }
              else{
                $scope.allPublicZsdData = '';
                DataService.alertInfFun('err', data.error);
              }
            });
          }
          else{
            $scope.adminParams.selectLinYuId = '';
            DataService.alertInfFun('pmt', '请选择领域！');
          }
        };

        /**
         * 公共知识点分页
         */
        $scope.publicZsdDist = function(pg){
          var cPg = pg || 1;
          var paginationLength = 11; //分页部分，页码的长度，目前设定为11
          var totalPage = $scope.pageParam.lastPage;
          var pageArr = $scope.pageParam.pageArr; //页面数组
          $scope.currentPage = cPg;
          if(totalPage <= paginationLength){
            $scope.pages = pageArr;
          }
          if(totalPage > paginationLength){
            if(cPg > 0 && cPg <= 6 ){
              $scope.pages = pageArr.slice(0, paginationLength);
            }
            else if(cPg > totalPage - 5 && cPg <= totalPage){
              $scope.pages = pageArr.slice(totalPage - paginationLength);
            }
            else{
              $scope.pages = pageArr.slice(cPg - 6, cPg + 5);
            }
          }
          $scope.zsdSetZsdData = $scope.allPublicZsdData.slice((cPg-1) * 15, cPg * 15);
        };

        /**
         * 添加或删除科目IDs --
         */
        //$scope.getKeMuId = function(keMu){
        //  keMu.ckd = !keMu.ckd;
        //  if(keMu.ckd){
        //    $scope.adminParams.selectKeMuIds.push(keMu['科目ID']);
        //    $scope.adminParams.selectKeMuName.push(keMu['科目名称']);
        //  }
        //  else{
        //    $scope.adminParams.selectKeMuIds = Lazy($scope.adminParams.selectKeMuIds).without(keMu['科目ID']).toArray();
        //    $scope.adminParams.selectKeMuName = Lazy($scope.adminParams.selectKeMuName).without(keMu['科目名称']).toArray();
        //  }
        //};

        /**
         * 由所选科目查询所对应的知识点 --
         */
        //$scope.getKeMuPubZsdData = function(){
        //  //$scope.adminParams.fakeSelectShow = false;
        //  $scope.adminParams.pubZsdTabOn = -1;
        //  $scope.adminParams.zsdWrapShow = false;
        //  $scope.adminParams.selectZsdId = '';
        //  if($scope.adminParams.selectKeMuIds && $scope.adminParams.selectKeMuIds.length > 0){
        //    var obj = {method:'GET', url:zhiShiDianUrl, params:{'领域ID': $scope.adminParams.selectKeMuIds}};
        //    $http(obj).success(function(data){
        //      if(data.result){
        //        $scope.zsdSetZsdData = data.data;
        //      }
        //      else{
        //        DataService.alertInfFun('err', '此科目下没有知识点');
        //      }
        //    });
        //  }
        //  if($scope.adminParams.selectKeMuName && $scope.adminParams.selectKeMuName.length > 0){
        //    //$scope.adminParams.fakePlaceHolder = $scope.adminParams.selectKeMuName.join();
        //  }
        //  else{
        //    //$scope.adminParams.fakePlaceHolder = '请选择科目';
        //  }
        //};

        /**
         * 显示知识点的修改页面 --
         */
        //$scope.pubZsdTabOn = function(activeIdx, zsdId, zsdName){
        //  if(zsdId){
        //    var cxLyOfZsd = cxLyOfZsdBase + zsdId;
        //    //$scope.adminParams.zsdKeMuArr = [];
        //    $scope.adminParams.pubZsdTabOn = activeIdx;
        //    $scope.adminParams.selectZsdId = zsdId;
        //    $scope.adminParams.zsdOldName = zsdName;
        //    $scope.adminParams.zsdNewName = zsdName;
        //    $('input[name="zsdKeMuCb"]').prop('checked', false);
        //    $http.get(cxLyOfZsd).success(function(kmData){
        //      if(kmData){
        //        Lazy(kmData).each(function(km, idx, lst){
        //          var kmcss = '.keMu' + km.LINGYU_ID;
        //          $(kmcss).prop('checked', true);
        //          km.origin = true;
        //          km.changeStat = false;
        //          //$scope.adminParams.zsdKeMuArr.push(km);
        //        });
        //      }
        //      else{
        //        DataService.alertInfFun('err', kmData.error);
        //      }
        //    });
        //    $scope.adminParams.zsdWrapShow = true;
        //  }
        //  else{
        //    //$scope.adminParams.zsdKeMuArr = [];
        //    $scope.adminParams.selectZsdId = '';
        //  }
        //};

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
                      //$scope.adminParams.zsdWrapShow = false;
                      $('input[name="zsdKeMuCb"]').prop('checked', false);
                      $scope.zsdSetZsdData = Lazy($scope.zsdSetZsdData).reject(function(zsd){
                        return zsd.ZHISHIDIAN_ID  == data.id;
                      });
                      //$scope.adminParams.pubZsdTabOn = -1;
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
                //$scope.adminParams.zsdWrapShow = false;
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
            });
          }

        };

        /**
         * 本机构下教师管理 --
         */
        $scope.renderTeacherTpl = function(){
          var obj = {method: 'GET', url: yongHuUrl, params: {'学校ID': jgID, '用户类别': 1}};
          $http(obj).success(function(data){
            if(data.result){
              $scope.teacherData = data.data;
              $scope.isShenHeBox = false; //判断是不是审核页面
              $scope.adminSubWebTpl = 'views/renzheng/rz_setTeacher.html';
            }
            else{
              $scope.teacherData = '';
              DataService.alertInfFun('err', data.error);
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
            };
            //idx = $scope.adminParams.pubZsdTabOn;

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
