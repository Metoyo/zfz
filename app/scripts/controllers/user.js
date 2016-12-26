define(['angular', 'config', 'lazy'], function (angular, config, lazy) {
  'use strict';
  angular.module('zhifzApp.controllers.UserCtrl', [])
    .controller('UserCtrl', ['$rootScope', '$scope', '$http', '$location', 'DataService', '$cookieStore', 'urlRedirect',
      function ($rootScope, $scope, $http, $location, DataService, $cookieStore, urlRedirect) {
        /**
         * 定义变量
         */
        var xueXiaoUrl = '/xuexiao'; //机构的增删改查
        var yongHuUrl = '/yonghu'; //用户的增删改查
        var yongHuJueSeUrl = '/yonghu_juese'; //用户角色URL
        var lingYuUrl = '/lingyu'; //领域URL
        var keMuUrl = '/kemu'; //科目URL
        var xueXiaoKeMuUrl = '/xuexiao_kemu'; //学校科目
        var tiXingUrl = '/tixing'; //题型
        var xueXiaoKeMuTiXingUrl = '/xuexiao_kemu_tixing'; //学校科目题型
        var zhiShiDianUrl = '/zhishidian'; //知识点
        var zhiShiDaGangUrl = '/zhishidagang'; //知识大纲
        var tiKuUrl = '/tiku'; //题库
        var kaoDianUrl = '/kaodian'; //考点
        var kaoShiZuUrl = '/kaoshizu'; //考试组
        var shiJuanZuUrl = '/shijuanzu'; //试卷组
        var createPdfUrl = '/create_pdf'; //创建PDF
        var transferFromOmrUrl = '/transfer_from_omr'; //扫描设定
        var copyTiMuUrl = '/copy_timu'; //复制题目
        var loginUsr = JSON.parse($cookieStore.get('ckUsr'));
        var jgID = loginUsr['学校ID']; //登录用户学校
        var logUid = loginUsr['UID']; //登录用户的UID
        var jsArr = JSON.parse($cookieStore.get('ckJs'));
        $scope.shenheList = [];
        $scope.isShenHeBox = true; //判断是不是审核页面
        $scope.adminParams = {
          selectKeMu: '',
          selected_dg: '',
          lastKmId: '',
          saveDGBtnDisabled: false,
          newPsd: '',
          selectKeMuId: '',
          selectZsdId: '',
          zsdOldName: '', //知识
          zsdNewName: '', //知识点修改新名称
          activeNd: '', //公共大纲那个输入框被激活了
          sltJgId: '', //查询考点是选择的学校ID
          sltJg: '', //选中的学校
          editKcTp: '', //编辑考点的类型
          kaoDianFrom: '',
          navHide: false, //隐藏二级导航
          studentTest: false, //学生自测
          wxStyle: '' //微信查询用户的方式
        };
        $scope.pageParam = {
          currentPage: '',
          lastPage: '',
          pageArr: []
        };
        $scope.scanner = { //扫描设定数据
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
        $scope.weiXin = { //查询微信账户
          uid: '',
          email: '',
          xuexiao: '',
          xuehao: ''
        };
        $scope.cnNumArr = config.cnNumArr; //题支的序号
        $scope.usrInfo = loginUsr;
        $scope.kaochangData = '';

        /**
         * 查询学校科目
         */
        var qryXxKm = function(){
          var obj = {method: 'GET', url: xueXiaoKeMuUrl, params: {'学校ID': jgID}};
          $scope.xxkmList = '';
          $http(obj).success(function(xxKm){
            if(xxKm.result && xxKm.data){
              var nwKm = [];
              Lazy(xxKm.data).each(function(km){
                var tpObj = {
                  '科目ID': km['科目ID'],
                  '科目名称': km['科目名称'],
                  '角色': [
                    {
                      '学校ID': km['学校ID'],
                      '领域ID': km['领域ID'],
                      '科目ID': km['科目ID'],
                      '角色ID': 2,
                      '状态': -1,
                      '角色名称': '科目负责人',
                      ckd: false
                    },
                    {
                      '学校ID': km['学校ID'],
                      '领域ID': km['领域ID'],
                      '科目ID': km['科目ID'],
                      '角色ID': 4,
                      '状态': -1,
                      '角色名称': '阅卷组长',
                      ckd: false
                    },
                    {
                      '学校ID': km['学校ID'],
                      '领域ID': km['领域ID'],
                      '科目ID': km['科目ID'],
                      '角色ID': 3,
                      '状态': -1,
                      '角色名称': '任课老师',
                      ckd: false
                    },
                    {
                      '学校ID': km['学校ID'],
                      '领域ID': km['领域ID'],
                      '科目ID': km['科目ID'],
                      '角色ID': 5,
                      '状态': -1,
                      '角色名称': '助教',
                      ckd: false
                    }
                  ]
                };
                nwKm.push(tpObj);
              });
              $scope.xxkmList =nwKm;
            }
            else{
              DataService.alertInfFun('err', xxKm.error || '没有科目，请添加科目！');
            }
          });
        };

        /**
         * 导向本页面时，判读展示什么页面，admin, xxgly
         */
        var goToWhere = function(){
          var find0 = Lazy(jsArr).contains(0); //学校管理员
          var find1 = Lazy(jsArr).contains(1); //机构管理员
          if(find0){
            $scope.shenHeTpl = 'views/renzheng/rz_admin.html';
          }
          else{
            if(find1){
              qryXxKm();
              $scope.shenHeTpl = 'views/renzheng/rz_xxgly.html';
            }
            else{
              urlRedirect.goTo($location.$$path, '/renzheng');
            }
          }
        };
        goToWhere();

        /**
         * 退出程序
         */
        $scope.signOut = function(){
          DataService.logout();
        };

        /**
         * 设置权限，审核权限
         */
        //$scope.renderPerm = function() {
        //  $scope.loadingImgShow = true;
        //  var obj = {method: 'GET', url: yongHuJueSeUrl, params: ''};
        //  $scope.shenHeList = [];
        //  obj.params = {
        //    '学校ID': jgID
        //    //'状态': 0
        //  };
        //  $http(obj).success(function(data) {
        //    if(data.result && data.data){
        //      var distByUid = Lazy(data.data).groupBy(function(usr){return usr.UID;}).toObject();
        //      Lazy(distByUid).each(function(v, k, l){ //通过UID排序
        //        var temp = {
        //          UID: k,
        //          '用户名': v[0]['用户名'],
        //          '姓名': v[0]['姓名'],
        //          btn: false,
        //          '待审': []
        //        };
        //        var count = 0;
        //        var distByKm = Lazy(v).groupBy(function(ds){return ds['科目ID']});
        //        Lazy(distByKm).each(function(v1, k1, l1){ //通过科目排序
        //          var kmTemp = {
        //            '科目ID': k1,
        //            '科目名称': v1[0]['科目名称'],
        //            '角色': ''
        //          };
        //          var jsArr = [
        //            {
        //              '学校ID': v1[0]['学校ID'],
        //              '领域ID': v1[0]['领域ID'],
        //              '科目ID': v1[0]['科目ID'],
        //              '角色ID': 2,
        //              '状态': -1,
        //              '角色名称': '科目负责人',
        //              ckd: false
        //            },
        //            {
        //              '学校ID': v1[0]['学校ID'],
        //              '领域ID': v1[0]['领域ID'],
        //              '科目ID': v1[0]['科目ID'],
        //              '角色ID': 4,
        //              '状态': -1,
        //              '角色名称': '阅卷组长',
        //              ckd: false
        //            },
        //            {
        //              '学校ID': v1[0]['学校ID'],
        //              '领域ID': v1[0]['领域ID'],
        //              '科目ID': v1[0]['科目ID'],
        //              '角色ID': 3,
        //              '状态': -1,
        //              '角色名称': '任课老师',
        //              ckd: false
        //            },
        //            {
        //              '学校ID': v1[0]['学校ID'],
        //              '领域ID': v1[0]['领域ID'],
        //              '科目ID': v1[0]['科目ID'],
        //              '角色ID': 5,
        //              '状态': -1,
        //              '角色名称': '助教',
        //              ckd: false
        //            }
        //          ];
        //          Lazy(jsArr).each(function(ojs){
        //            var findJs = Lazy(v1).find(function(js){return js['角色ID'] == ojs['角色ID']});
        //            if(findJs){
        //              ojs.ckd = true;
        //              ojs['状态'] = findJs['状态'];
        //              if(findJs['状态'] == 0){
        //                count ++;
        //              }
        //            }
        //          });
        //          kmTemp['角色'] = jsArr;
        //          temp['待审'].push(kmTemp);
        //        });
        //        if(count > 0){
        //          temp.btn = true;
        //        }
        //        $scope.shenHeList.push(temp);
        //      });
        //      $scope.isShenHeBox = true;
        //      $scope.adminSubWebTpl = 'views/renzheng/rz_shenHe.html';
        //    }
        //    else{
        //      DataService.alertInfFun('err', data.error);
        //    }
        //    $scope.loadingImgShow = false;
        //  });
        //};

        /**
         * 关闭审核页面
         */
        $scope.closeShenheBox = function() {
          $scope.adminSubWebTpl = '';
          $scope.isShenHeBox = true; //判断是不是审核页面
          $scope.adminParams.navHide = false;
        };

        /**
         * 已经通过审核的科目，点击或者选中后通过按钮显示
         */
        $scope.jueseClicked = function(js) {
          js.ckd = !js.ckd;
        };

        /**
         * 通过审核的按钮
         */
        //$scope.authPerm = function(usr) {
        //  var obj = {method: 'POST', url: yongHuJueSeUrl, data: {UID: usr.UID, '角色': []}};
        //  var dsArr = [];
        //  Lazy(usr['待审']).each(function(km){
        //    Lazy(km['角色']).each(function(js){
        //      if(js.ckd){
        //        var temp = {
        //          '学校ID': js['学校ID'],
        //          '领域ID': js['领域ID'],
        //          '科目ID': js['科目ID'],
        //          '角色ID': js['角色ID'],
        //          '状态': 1
        //        };
        //        dsArr.push(temp);
        //      }
        //    });
        //  });
        //  if(dsArr && dsArr.length > 0){
        //    obj.data['角色'] = JSON.stringify(dsArr);
        //    $http(obj).success(function(data){
        //      if(data.result && data.data){
        //        usr.btn = false;
        //      }
        //      else{
        //        DataService.alertInfFun('err', data.error);
        //      }
        //    });
        //  }
        //  else{
        //    DataService.alertInfFun('pmt', '请选择需要通过审核的角色！');
        //  }
        //};

        /**
         * 机构查询
         */
        var getJgList = function(jsid){
          $scope.loadingImgShow = true;
          $http.get(xueXiaoUrl).success(function(schools){
            if(schools.result && schools.data){
              if(jsid > 0){
                var obj = {};
                obj['角色ID'] = jsid;
                $http({method: 'GET', url: yongHuJueSeUrl, params: obj}).success(function(data){
                  if(data.result && data.data){
                    Lazy(schools.data).each(function(sch){
                      sch.ADMINISTRATORS = Lazy(data.data).filter(function(js){
                        return js['学校ID'] == sch['学校ID'];
                      }).toArray();
                    });
                  }
                });
              }
              $scope.jigou_list = DataService.cnSort(schools.data, '学校名称');
            }
            else{
              $scope.jigou_list = '';
              DataService.alertInfFun('err', schools.error);
            }
            $scope.loadingImgShow = false;
          });
        };

        /**
         * 展示设置机构的页面
         */
        $scope.renderJiGouSetTpl = function(){
          getJgList(1);
          $scope.isShenHeBox = false;
          $scope.adminSubWebTpl = 'views/renzheng/rz_setJiGou.html';
        };

        /**
         * 点击新增机构，显示新增页面
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
         * 关闭添加新机构页面
         */
        $scope.closeAddNewJiGou = function(){
          $scope.isAddNewJiGouBoxShow = false;
          $scope.addNewJiGou = {};
        };

        /**
         * 保存新增加的机构
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
                  getJgList(1);
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
            var obj = {
              method: 'POST',
              url: xueXiaoUrl,
              data: {
                '学校ID': '',
                '状态': -1
              }
            };
            obj.data['学校ID'] = jg['学校ID'];
            if(confirm('确定要删除此学校吗？')){
              $http(obj).success(function(data){
                if(data.result){
                  DataService.alertInfFun('suc', '删除成功！');
                  getJgList(1);
                }
                else{
                  DataService.alertInfFun('err', data.error);
                }
              });
            }
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
         * 学校管理员的添加
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
              var obj = {
                method: 'POST',
                url: yongHuJueSeUrl,
                data: {
                  'UID': data.data['UID'],
                  '角色': [
                    {
                      '学校ID': $scope.selectJg['学校ID'],
                      '领域ID': 0,
                      '科目ID': 0,
                      '角色ID': 1,
                      '状态': 1
                    }
                  ]
                }
              };
              obj.data['角色'] = JSON.stringify(obj.data['角色']);
              $http(obj).success(function(rlt){
                if(rlt.result){
                  $scope.closeManageAdmin();
                  DataService.alertInfFun('suc', '新增成功');
                  getJgList(1);
                  $scope.newXxgly = '';
                }
                else{
                  DataService.alertInfFun('err', rlt.error);
                }
                $scope.loadingImgShow = false;
              });
            }
            else{
              DataService.alertInfFun('err', data.error);
            }
          });
        };

        /**
         * 删除机构管理员
         */
        $scope.deleteJiGouAdmin = function(adm){
          if(adm['UID']){
            $scope.loadingImgShow = true;
            var obj = {
              method: 'POST',
              url: yongHuUrl,
              data: {
                'UID': '',
                '状态': -1
              }
            };
            obj.data['UID'] = adm['UID'];
            if(confirm('确定要删除此学校的学校管理员吗？')){
              $http(obj).success(function(data){
                if(data.result){
                  DataService.alertInfFun('suc', '删除成功！');
                  $scope.isAddNewAdminBoxShow = false;
                  getJgList(1);
                }
                else{
                  DataService.alertInfFun('err', data.error);
                }
              });
            }
          }
          else{
            DataService.alertInfFun('pmt', '请选择学校！');
          }
          $scope.loadingImgShow = false;
        };

        /**
         * 关闭添加学校管理员页面
         */
        $scope.closeManageAdmin = function(){
          $scope.isAddNewAdminBoxShow = false;
        };

        /**
         * 展示科目设置(领域)
         */
        $scope.renderLingYuSetTpl = function(){
          $scope.loadingImgShow = true;
          $http.get(lingYuUrl).success(function(allLy){
            if(allLy.result && allLy.data){
              $http.get(keMuUrl).success(function(allKm){
                if(allKm.result && allKm.data){
                  //数据组合
                  var allKmSortObj = Lazy(allKm.data).groupBy(function(km){
                    return km['领域ID'];
                  }).toObject();
                  Lazy(allLy.data).each(function(ly){
                    if(allKmSortObj[ly['领域ID']] && allKmSortObj[ly['领域ID']].length > 0){
                      ly['科目'] = DataService.cnSort(allKmSortObj[ly['领域ID']], '科目名称');
                    }
                  });
                  $scope.lingyu_list = DataService.cnSort(allLy.data, '领域名称');
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
         * 添加领域
         */
        $scope.addLy = function() {
          $scope.lyOrKmSet.type = 'nl';
          $scope.lyKmSetPageShow = true;
        };

        /**
         * 修改领域
         */
        $scope.alterLy = function(ly) {
          $scope.lyOrKmSet.type = 'al';
          $scope.lyOrKmSet.name = ly['领域名称'];
          $scope.lyOrKmSet.val = ly;
          $scope.lyKmSetPageShow = true;
        };

        /**
         * 添加科目
         */
        $scope.addKm = function(ly) {
          $scope.lyOrKmSet.type = 'nk';
          $scope.lyOrKmSet.val = ly;
          $scope.lyKmSetPageShow = true;
        };

        /**
         * 修改科目
         */
        $scope.alterKm = function(km) {
          $scope.lyOrKmSet.type = 'ak';
          $scope.lyOrKmSet.val = km;
          $scope.lyOrKmSet.name = km['科目名称'];
          $scope.lyKmSetPageShow = true;
        };

        /**
         * 删除科目
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
          if(confirm('确定要删除此科目吗？')){
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
         * 关闭领域和科目的添加和修改
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
         * 保存领域和科目的添加和修改
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
          $scope.loadingImgShow = true;
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
            $scope.loadingImgShow = false;
          });
          $scope.lyKmSetPageShow = false;
        };

        /**
         * 学校科目选择
         */
        $scope.renderLingYuSelectTpl = function(){
          $scope.jgSelectKeMu = '';
          $http.get(lingYuUrl).success(function(allLy){
            if(allLy.result && allLy.data){
              $http.get(keMuUrl).success(function(allKm){
                if(allKm.result && allKm.data){
                  //整理数据
                  Lazy(allKm.data).each(function(km){
                    km.ckd = false;
                  });
                  var obj = {};
                  obj['学校ID'] = jgID;
                  $http({method: 'GET', url: xueXiaoKeMuUrl, params: obj}).success(function(xxKm){
                    if(xxKm.result && xxKm.data){
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
         * 添加领域到已选
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
         * 从已选科目删除领域
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
         * 保存已选的领域
         */
        $scope.saveChooseKeMu = function(){
          var obj = {};
          obj['科目'] = Lazy($scope.jgSelectKeMu).map(function(km){
            return km['科目ID'];
          }).toArray();
          obj['学校ID'] = jgID;
          obj['科目'] = JSON.stringify(obj['科目']);
          $scope.loadingImgShow = true;
          $http.post(xueXiaoKeMuUrl, obj).success(function(data){
            if(data.result){
              qryXxKm();
              DataService.alertInfFun('suc', '保存成功！');
            }
            else{
              DataService.alertInfFun('err', data.error);
            }
            $scope.loadingImgShow = false;
          });
        };

        /**
         * 大纲设置
         */
        $scope.renderDaGangSetTpl = function(){
          $scope.loadingImgShow = true;
          $scope.pubZsdgList = '';
          $scope.allPubZsdgData = '';
          $scope.pubZsdgData = '';
          $scope.adminParams.lastKmId = '';
          $scope.adminParams.selectKeMu = '';
          $scope.allPublicZsdData = '';
          $scope.lyKeMu = '';
          var obj = {method:'GET', url: lingYuUrl};
          $http(obj).success(function(data){
            if(data.result && data.data){
              $scope.setZsdLingYu = DataService.cnSort(data.data, '领域名称');
            }
            else{
              $scope.setZsdLingYu = '';
              DataService.alertInfFun('err', data.error);
            }
            $scope.loadingImgShow = false;
            $scope.isShenHeBox = false;
            $scope.adminSubWebTpl = 'views/renzheng/rz_setDaGang.html';
          });
        };

        /**
         * 由科目获得大纲数据
         */
        $scope.getPubDaGangList = function(kmid, cf){
          if(kmid){
            var objDg = {method:'GET', url:zhiShiDaGangUrl, params:{'科目ID':kmid, '类型':1}};
            $scope.pubZsdgList = [];
            $http(objDg).success(function(data){ //获得大纲数据
              if(data.result && data.data){
                Lazy(data.data).each(function(dg){
                  var dgObj = {
                    '知识大纲ID': dg['知识大纲ID'],
                    '知识大纲名称': dg['知识大纲名称']
                  };
                  $scope.pubZsdgList.push(dgObj);
                });
                $scope.allPubZsdgData = data.data;
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
            });
            var find = Lazy($scope.lyKeMu).find(function(km){
              return km['科目ID'] == kmid;
            });
            if(find){
              var getNewPubZsd = false;
              $scope.adminParams.selectKeMu = find;
              if(find['科目ID'] != $scope.adminParams.lastKmId){ //领域ID变化重现查询公共知识点
                $scope.adminParams.lastKmId = angular.copy(find['科目ID']);
                getNewPubZsd = true;
              }
              else{
                if(cf == 'savedg'){
                  getNewPubZsd = true;
                }
                else{
                  getNewPubZsd = $scope.allPublicZsdData.length <= 0;
                }
              }
              if(getNewPubZsd){
                var objZsd = {method:'GET', url:zhiShiDianUrl, params:{'科目ID':$scope.adminParams.lastKmId, '类型': 1}};
                $http(objZsd).success(function(data){
                  if(data.result && data.data){
                    data.data = DataService.cnSort(data.data, '知识点名称');
                    $scope.allPublicZsdData = angular.copy(data.data);
                    $scope.publicKnowledge = data.data;
                  }
                  else{
                    $scope.allPublicZsdData = '';
                    $scope.publicKnowledge = '';
                    DataService.alertInfFun('err', data.error);
                  }
                });
              }
            }
            else{
              $scope.adminParams.selectKeMu = '';
            }
          }
          else{
            DataService.alertInfFun('pmt', '请选择科目！');
          }
        };

        /**
         * 由所选的知识大纲，得到知识点
         */
        $scope.getPubDgZsdData = function(dgId){
          //得到知识大纲知识点的递归函数
          $scope.adminParams.activeNd = '';
          $scope.adminParams.selected_dg = dgId;
          function _do(item) {
            var zsdId = item['知识点ID'];
            $scope.publicKnowledge = Lazy($scope.publicKnowledge).reject(function(pgz){
              return pgz['知识点ID'] == zsdId;
            }).toArray();
            if(item['子节点'] && item['子节点'].length > 0){
              Lazy(item['子节点']).each(_do);
            }
          }
          var find = Lazy($scope.allPubZsdgData).find(function(dg){
            return dg['知识大纲ID'] == dgId;
          });
          if(find){
            Lazy(find['节点']).each(_do);
            $scope.pubZsdgData = find;
          }
          else{
            $scope.pubZsdgData = '';
            $scope.adminParams.saveDGBtnDisabled = false;
            DataService.alertInfFun('pmt', '请选择大纲！');
          }
        };

        /**
         * 已有公共知识点查询
         */
        $scope.getHasPubZsd = function(kmId){
          var objZsd = {method:'GET', url:zhiShiDianUrl, params:{'科目ID': '', '类型': 1}};
          if(kmId){
            objZsd.params['科目ID'] = kmId;
            $http(objZsd).success(function(data){
              if(data.result && data.data){
                $scope.allPublicZsdData = angular.copy(data.data);
                $scope.publicKnowledge = data.data;
              }
              else{
                $scope.allPublicZsdData = '';
                $scope.publicKnowledge = '';
                DataService.alertInfFun('err', data.error);
              }
            });
          }
          else{
            DataService.alertInfFun('pmt', '请选择科目！');
          }
        };

        /**
         * 添加知识点
         */
        $scope.dgAddNd = function(nd, ndl) {
          var newNd = {};
          newNd['知识点名称'] = '';
          newNd['子节点'] = [];
          if(ndl && ndl == 'jd'){
            nd['节点'] = nd['节点'] || [];
            nd['节点'].push(newNd);
          }
          else{
            nd['子节点'] = nd['子节点'] || [];
            nd['子节点'].push(newNd);
          }
        };

        /**
         * 删除知识点
         */
        $scope.dgRemoveNd = function(parentNd, nd, idx) {
          function _do(item) {
            if(item['知识点ID']){
              var zsd = {
                '知识点ID': item['知识点ID'],
                '知识点名称': item['知识点名称'],
                '科目ID': $scope.adminParams.lastKmId,
                '学校ID': 0,
                '类型': 1,
                '状态': 1
              };
              $scope.publicKnowledge.push(zsd);
            }
            if(item['子节点'] && item['子节点'].length > 0){
              Lazy(item['子节点']).each(_do);
            }
          }
          if(confirm("确定要删除知识点吗？")){
            _do(nd);
            //将删除的知识节点添加到公共知识点里
            if(parentNd['节点'] && parentNd['节点'].length > 0){
              parentNd['节点'].splice(idx, 1);
            }
            else{
              parentNd['子节点'].splice(idx, 1);
            }
          }
        };

        /**
         * 那一个输入框被选中了
         */
        $scope.getInputIndex = function(nd){
          $scope.adminParams.activeNd = nd;
        };

        /**
         * 将公共知识点添加到知识大纲
         */
        $scope.addToDaGang = function(zsd, idx){
          $scope.adminParams.activeNd['知识点ID'] = zsd['知识点ID'];
          $scope.adminParams.activeNd['知识点名称'] = zsd['知识点名称'];
          $scope.publicKnowledge.splice(idx, 1);
        };

        /**
         * 当输入介绍后检查公共知识大纲中是否已经存在知识点
         */
        $scope.compareInputVal = function(nd){
          var zsdName = nd['知识点名称'];
          if(zsdName){
            var find = Lazy($scope.publicKnowledge).find(function(zsd){
              return zsd['知识点名称'] == zsdName;
            });
            if(find){
              DataService.alertInfFun('pmt', '您输入的知识点名称与已有知识点名称相同！请修改！');
            }
          }
        };

        /**
         * 新增公共知识大纲
         */
        $scope.addNewPubDaGang = function(){
          var pdgObj = {
            '知识大纲名称': '',
            '学校ID': 0,
            '科目ID': '',
            '类型': 1,
            '节点': []
          };
          if($scope.adminParams.selectKeMu){
            $scope.publicKnowledge = angular.copy($scope.allPublicZsdData);
            $scope.adminParams.selected_dg = '请选择大纲';
            pdgObj['科目ID'] = $scope.adminParams.selectKeMu['科目ID'];
            $scope.pubZsdgData = pdgObj;
          }
          else{
            DataService.alertInfFun('err', '请选择科目！');
          }
        };

        /**
         * 保存知识大纲
         */
        $scope.saveDaGangData = function() {
          $scope.adminParams.saveDGBtnDisabled = true;
          $scope.loadingImgShow = true;
          if($scope.pubZsdgData){
            $scope.pubZsdgData['节点'] = JSON.stringify($scope.pubZsdgData['节点']);
            var obj = {method:'', url:zhiShiDaGangUrl, data:$scope.pubZsdgData};
            obj.method = $scope.pubZsdgData['知识大纲ID'] ? 'POST' : 'PUT';
            $http(obj).success(function(data){
              if(data.result){
                $scope.allPubZsdgData = '';
                $scope.pubZsdgData = '';
                $scope.getPubDaGangList($scope.adminParams.selectKeMu['科目ID'], 'savedg');
                DataService.alertInfFun('suc', '大纲保存成功！');
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
            });
          }
          else{
            $scope.adminParams.saveDGBtnDisabled = false;
            DataService.alertInfFun('err', '请选择您要保存的大纲！');
          }
          $scope.loadingImgShow = false;
        };

        /**
         * 删除公共知识大纲
         */
        $scope.deletePublicDaGang = function(){
          if(confirm('你确定要删除此公共大纲吗？')){
            var obj = {
              method:'POST',
              url:zhiShiDaGangUrl,
              data:{
                '知识大纲ID': '',
                '状态': -1
              }
            };
            if($scope.adminParams.selected_dg){
              obj.data['知识大纲ID'] = $scope.adminParams.selected_dg;
              $scope.loadingImgShow = true;
              $http(obj).success(function(data){
                if(data.result){
                  $scope.getPubDaGangList($scope.adminParams.selectKeMu['科目ID'], 'savedg');
                  DataService.alertInfFun('suc', '删除成功！');
                }
                else{
                  DataService.alertInfFun('err', data.error);
                }
                $scope.loadingImgShow = false;
              });
            }
            else{
              DataService.alertInfFun('err', '请选择要删出的大纲');
            }
          }
        };

        /**
         * 科目题型选择
         */
        $scope.renderTiXingSelectTpl = function(){
          $scope.loadingImgShow = true; //rz_selectTiXing.html
          var objXxKm = {method: 'GET', url: xueXiaoKeMuUrl, params: {'学校ID': jgID}};
          $http(objXxKm).success(function(xxkm) { //查询本机构下的科目
            if(xxkm.result && xxkm.data){
              var objTx = {method: 'GET', url: tiXingUrl};
              $http(objTx).success(function(txData){
                if(txData.result && txData.data){
                  $scope.allTiXing = txData.data;
                }
                else{
                  DataService.alertInfFun('err', txData.error);
                }
              });
              $scope.xueXiaoKeMu = DataService.cnSort(xxkm.data, '科目名称');
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
         * 那个领域被选中
         */
        $scope.whichLingYuActive = function(kmID){
          if(kmID){
            $scope.activeKeMu = kmID;
            var obj = {method: 'GET', url: xueXiaoKeMuTiXingUrl, params: {'学校ID': jgID, '科目ID': kmID}};
            $http(obj).success(function(xxkmtx){
              if(xxkmtx.result && xxkmtx.data){
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
         * 添加或者删除题型
         */
        $scope.addOrRemoveTiXing = function(tx){
          tx.ckd = !tx.ckd;
        };

        /**
         * 保存已选的题型
         */
        $scope.saveSelectTiXing = function(){
          var obj = {
            method: 'POST',
            url: xueXiaoKeMuTiXingUrl,
            data: {
              '学校ID': jgID,
              '科目ID': $scope.activeKeMu
            }
          };
          var txArr = [];
          Lazy($scope.allTiXing).each(function(atx){
            if(atx.ckd){
              txArr.push(atx['题型ID']);
            }
          });
          if(txArr && txArr.length > 0){
            obj.data['题型'] = JSON.stringify(txArr);
            $scope.loadingImgShow = true;
            $http(obj).success(function(data){
              if(data.result){
                DataService.alertInfFun('suc', '保存成功！');
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
              $scope.loadingImgShow = false;
            });
          }
          else{
            DataService.alertInfFun('pmt', '请选择题型!');
          }
        };

        /**
         * 修改管理员的密码
         */
        $scope.modifyAdminPassWord = function(adm){
          var obj = {
            method: 'POST',
            url: yongHuUrl,
            data: {
              UID:'', '密码':''
            }
          };
          if(adm){
            obj.data.UID = adm['UID'];
            obj.data['密码'] = 'tat12345';
          }
          else{
            obj.data.UID = logUid;
            if($scope.adminParams.newPsd){
              obj.data['密码'] = $scope.adminParams.newPsd;
            }
            else{
              DataService.alertInfFun('pmt', '请输入新密码！');
              return ;
            }
          }
          $http(obj).success(function(data){
            if(data.result){
              if(adm){
                adm['默认密码'] = 'tat12345';
              }
              DataService.alertInfFun('suc', '密码修改成功!');
            }
            else{
              DataService.alertInfFun('err', data.error);
            }
          });

        };

        /**
         * 修改知识点
         */
        $scope.renderZhiShiDianSetTpl = function(){
          $scope.setZsdLingYu = '';
          $scope.loadingImgShow = true;
          $scope.zsdSetZsdData = '';
          $scope.allPublicZsdData = '';
          $scope.currentPage = '';
          $scope.pageParam.pageArr = [];
          $scope.pages = [];
          $scope.adminParams.zsdWrapShow = false;
          $scope.lyKeMu = '';
          var obj = {method:'GET', url: lingYuUrl};
          $http(obj).success(function(data){
            if(data.result && data.data){
              $scope.isShenHeBox = false;
              data.data = DataService.cnSort(data.data, '领域名称');
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
         * 查询科目领域
         */
        $scope.getLingYuKeMu = function(lyId){
          var obj = {
            method: 'GET',
            url: keMuUrl,
            params: {
              '领域ID': ''
            }
          };
          $scope.lyKeMu = '';
          if(lyId){
            obj.params['领域ID'] = lyId;
            $http(obj).success(function(data){
              if(data.result && data.data){
                $scope.lyKeMu = DataService.cnSort(data.data, '科目名称');
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
            });
          }
          else{
            DataService.alertInfFun('err', '请选择领域！');
          }
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
         * 得到所选领域的的公共知识点
         */
        $scope.getPublicZsd = function(kmId){
          if(kmId){
            $scope.adminParams.selectKeMuId = kmId;
            $scope.zsdSetZsdData = '';
            var obj = {method:'GET', url:zhiShiDianUrl, params:{'科目ID':kmId, '类型': 1}};
            $http(obj).success(function(data){
              if(data.result && data.data){
                pageMake(data.data);
                var newData = DataService.cnSort(data.data, '知识点名称');
                $scope.allPublicZsdData = angular.copy(newData);
                $scope.currentPage = 1;
                $scope.publicZsdDist(1);
              }
              else{
                $scope.allPublicZsdData = '';
                $scope.zsdSetZsdData = '';
                $scope.currentPage = '';
                $scope.pageParam.pageArr = [];
                $scope.pages = [];
                DataService.alertInfFun('err', data.error);
              }
            });
          }
          else{
            $scope.adminParams.selectKeMuId = '';
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
         * 显示知识点修改
         */
        $scope.showModifyZsd = function(zsd){
          $scope.adminParams.zsdWrapShow = true;
          if(zsd){ //修改知识点
            $scope.adminParams.selectZsdId = zsd['知识点ID'];
            $scope.adminParams.zsdOldName = zsd['知识点名称'];
            $scope.adminParams.zsdNewName = angular.copy(zsd['知识点名称']);
          }
          else{ //新增知识点
            $scope.adminParams.selectZsdId = '';
            $scope.adminParams.zsdOldName = '';
            $scope.adminParams.zsdNewName = '';
          }
        };

        /**
         * 删除所选的公共知识点
         */
        $scope.deletePubZsd = function(zsd){
          if(confirm('你确定要删除此公共点吗？')){
            var obj = {
              method:'POST',
              url:zhiShiDianUrl,
              data:{
                '知识点ID': zsd['知识点ID'],
                '状态': -1
              }
            };
            $http(obj).success(function(data){
              if(data.result){
                $scope.adminParams.zsdNewName = '';
                $scope.getPublicZsd($scope.adminParams.selectKeMuId);
                DataService.alertInfFun('suc', '删除成功！');
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
            });
          }
        };

        /**
         * 修改知识点
         */
        $scope.modifyPubZsd = function(){
          var obj = {method:'', url:zhiShiDianUrl, data:''};
          if($scope.adminParams.selectZsdId && $scope.adminParams.zsdOldName){ //修改知识点
            if($scope.adminParams.zsdNewName !== $scope.adminParams.zsdOldName){ //名称没变
              obj.method = 'POST';
              obj.data = {
                '知识点ID':$scope.adminParams.selectZsdId,
                '知识点名称':$scope.adminParams.zsdNewName
              };
            }
            else{
              DataService.alertInfFun('pmt', '请修改知识点名称！');
              return ;
            }
          }
          else{ //新增知识点
            if($scope.adminParams.zsdNewName){
              obj.method = 'PUT';
              obj.data = {
                '知识点名称':$scope.adminParams.zsdNewName,
                '学校ID':jgID,
                '科目ID':$scope.adminParams.selectKeMuId,
                '类型': 1
              };
            }
            else{
              DataService.alertInfFun('pmt', '请填写知识点名称！');
              return ;
            }
          }
          $scope.loadingImgShow = true;
          $http(obj).success(function(data){
            if(data.result){
              $scope.getPublicZsd($scope.adminParams.selectKeMuId);
              DataService.alertInfFun('suc', '知识点保存成功！');
            }
            else{
              DataService.alertInfFun('err', data.error);
            }
            $scope.loadingImgShow = false;
          });
        };

        /**
         * 本机构下教师管理
         */
        $scope.renderTeacherTpl = function(){
          var objUsr = {
            method: 'GET',
            url: yongHuUrl,
            params: {
              '学校ID': jgID,
              '用户类别': 1
            }
          };
          $http(objUsr).success(function(user){ //机构教师
            if(user.result && user.data){
              user.data = Lazy(user.data).reverse().toArray();
              var objTec = {method: 'GET', url: yongHuJueSeUrl, params: {'学校ID': jgID, '状态': JSON.stringify([0,1])}};
              $scope.shenHeList = [];
              $http(objTec).success(function(teacher) { //查询机构教师角色
                if(teacher.result && teacher.data){
                  var distByUid = Lazy(teacher.data)
                    .reject(function(usr){ return usr['科目ID'] == 0})
                    .groupBy(function(usr){return usr.UID;}).toObject();
                  Lazy(distByUid).each(function(v, k, l){ //通过UID排序
                    var temp = {
                      UID: k,
                      '用户名': v[0]['用户名'],
                      '姓名': v[0]['姓名'],
                      '待审': []
                    };
                    var distByKm = Lazy(v).groupBy(function(ds){return ds['科目ID']}).toObject();
                    var xuXiaoKeMu = angular.copy($scope.xxkmList);
                    Lazy(distByKm).each(function(v1, k1, l1){ //通过科目排序
                      var kmTemp = Lazy(xuXiaoKeMu).find(function(xxkm){ return xxkm['科目ID'] == k1});
                      if(!kmTemp){
                        kmTemp = {
                          '科目ID': v1[0]['科目ID'],
                          '科目名称': v1[0]['科目名称'],
                          '角色': []
                        };
                        xuXiaoKeMu.push(kmTemp);
                      }
                      var jsArr = [ //角色数据
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
                        }
                      });
                      kmTemp['角色'] = jsArr;
                    });
                    temp['待审'] = xuXiaoKeMu;
                    $scope.shenHeList.push(temp);
                  });
                  Lazy(user.data).each(function(jsjs){ //合并数据
                    var fdUsr = Lazy($scope.shenHeList).find(function(thjs){ return thjs['UID'] == jsjs['UID'];});
                    if(fdUsr){
                      jsjs['科目角色'] = fdUsr['待审'];
                    }
                    else{
                      jsjs['科目角色'] = angular.copy($scope.xxkmList);
                    }
                    jsjs['审核状态'] = false;
                    Lazy(jsjs['科目角色']).each(function(km){
                      var fdTar = Lazy(km['角色']).find(function(js){
                        return js['状态'] == 0;
                      });
                      if(fdTar){
                        jsjs['审核状态'] = true;
                      }
                    });
                  });
                  $scope.teacherData = user.data;
                  $scope.isShenHeBox = true; //判断是不是审核页面
                  $scope.adminParams.navHide = true;
                  $scope.adminSubWebTpl = 'views/renzheng/rz_setTeacher.html';
                }
                else{
                  DataService.alertInfFun('err', teacher.error);
                }
              });
            }
            else{
              $scope.teacherData = '';
              DataService.alertInfFun('err', user.error);
            }
          });
        };

        /**
         * 保存教师角色修改
         */
        $scope.saveTeacherJs = function(usr) {
          var obj = {method: 'POST', url: yongHuJueSeUrl, data: {UID: usr.UID, '角色': []}};
          var dsArr = [];
          Lazy(usr['科目角色']).each(function(km){
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
            $scope.loadingImgShow = true;
            $http(obj).success(function(data){
              if(data.result){
                DataService.alertInfFun('pmt', '保存成功！');
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
              $scope.loadingImgShow = false;
            });
          }
          else{
            DataService.alertInfFun('pmt', '请选择的角色！');
          }
        };

        /**
         * 删除本机构教师
         */
        $scope.delTeacherJs = function(usr){
          if(usr['UID']){
            $scope.loadingImgShow = true;
            var obj = {
              method: 'POST',
              url: yongHuUrl,
              data: {
                'UID': '',
                '状态': -1
              }
            };
            obj.data['UID'] = usr['UID'];
            if(confirm('确定要删除此教师吗？')){
              $http(obj).success(function(data){
                if(data.result){
                  $scope.renderTeacherTpl();
                  DataService.alertInfFun('suc', '删除成功！');
                }
                else{
                  DataService.alertInfFun('err', data.error);
                }
                $scope.loadingImgShow = false;
              });
            }
          }
          else{
            DataService.alertInfFun('pmt', '请选择学校！');
          }
        };

        /**
         * 题库管理
         */
        $scope.renderTiKu = function(){
          $scope.tiKuList = '';
          $scope.tkSetPageShow = false;
          $scope.tiKuSet = {name: '', step: '', select: '', type: 2};
          var objLy = {method: 'GET', url: lingYuUrl, params: {'学校ID': jgID}};
          $http(objLy).success(function(xxLy){ //查询学校领域
            if(xxLy.result && xxLy.data){
              var obj = {method: 'GET', url: tiKuUrl, params: {'学校ID': jgID}};
              $http(obj).success(function(tiku){ //得到题库
                if(tiku.result){
                  var distTkByLy = {};
                  if(tiku.data && tiku.data.length > 0){
                    Lazy(tiku.data).each(function(tk){
                      if(tk['类型'] == 1){
                        tk['类型名称'] = '公共';
                      }
                      if(tk['类型'] == 2){
                        tk['类型名称'] = '私有';
                      }
                      if(tk['类型'] == 9){
                        tk['类型名称'] = '随堂测验';
                      }
                    });
                    distTkByLy = Lazy(tiku.data).groupBy('领域ID').toObject();
                  }
                  Lazy(xxLy.data).each(function(ly){
                    if(tiku.data && tiku.data.length > 0){
                      var tkArr = distTkByLy[ly['领域ID']];
                      if(tkArr && tkArr.length > 0){
                        ly['题库'] = tkArr;
                      }
                      else{
                        ly['题库'] = [];
                      }
                    }
                    else{
                      ly['题库'] = [];
                    }
                  });
                }
                else{
                  DataService.alertInfFun('err', tiku.error);
                }
              });
              $scope.tiKuList = xxLy.data;
              $scope.isShenHeBox = false; //判断是不是审核页面
              $scope.adminSubWebTpl = 'views/renzheng/rz_setTiKu.html';
            }
            else{
              DataService.alertInfFun('err', xxLy.error);
            }
          });
        };

        /**
         * 新增题库
         */
        $scope.addTiKu = function(ly){
          $scope.tkSetPageShow = true;
          $scope.tiKuSet.step = 'add';
          $scope.tiKuSet.select = ly;
        };

        /**
         * 删除题库
         */
        $scope.deleteTiKu = function(idx, ly, tk){
          if(confirm('确定要删除此题库吗？')){
            var obj = {
              method: 'POST',
              url: tiKuUrl,
              data: {
                '题库ID': tk['题库ID'],
                '状态': -1
              }
            };
            $http(obj).success(function(data){
              if(data.result){
                ly['题库'].splice(idx, 1);
                DataService.alertInfFun('suc', '删除成功！');
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
            });
          }
        };

        /**
         * 修改题库
         */
        $scope.alterTiKu = function(tk){
          $scope.tkSetPageShow = true;
          $scope.tiKuSet.step = 'alt';
          $scope.tiKuSet.select = tk;
          $scope.tiKuSet.name = tk['题库名称'];
          $scope.tiKuSet.type = tk['类型'];
        };

        /**
         * 保存题库
         */
        $scope.saveAddTk = function(){
          var tkName = $scope.tiKuSet.name;
          var tkInfo = $scope.tiKuSet.select;
          var tkType = parseInt($scope.tiKuSet.type);
          if(tkName){
            var obj = {method:'', url:tiKuUrl};
            if($scope.tiKuSet.step == 'add'){
              obj.method = 'PUT';
              obj.data = {
                '学校ID':jgID,
                '领域ID':tkInfo['领域ID'],
                '题库名称':tkName,
                '类型': tkType
              };
            }
            if($scope.tiKuSet.step == 'alt'){
              obj.method = 'POST';
              obj.data = {
                '题库ID':tkInfo['题库ID'],
                '题库名称':tkName,
                '类型': tkType
              };
            }
            $scope.loadingImgShow = true;
            $http(obj).success(function(data){
              if(data.result){
                $scope.tkSetPageShow = false;
                $scope.tiKuSet.name = '';
                $scope.tiKuSet.step = '';
                $scope.tiKuSet.select = '';
                $scope.renderTiKu();
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
              $scope.loadingImgShow = false;
            });
          }
          else{
            DataService.alertInfFun('pmt', '请输入题库名称！');
          }
        };

        /**
         * 取消题库添加页
         */
        $scope.closeAddTkPage = function(){
          $scope.tkSetPageShow = false;
          $scope.tiKuSet.name = '';
          $scope.tiKuSet.step = '';
        };

        /**
         * 考点管理
         */
        $scope.renderKaoDianTpl = function(tp){
          if(!($scope.jigou_list && $scope.jigou_list.length)){
            getJgList(1);
          }
          if(tp){
            $scope.adminParams.kaoDianFrom = tp;
            $scope.getKaoDianList(jgID);
          }
          $scope.adminParams.sltJgId = '';
          $scope.isShenHeBox = true; //判断是不是审核页面
          $scope.adminParams.navHide = true;
          $scope.adminSubWebTpl = 'views/renzheng/rz_kaoDian.html';
        };

        /**
         * 由学校ID查询考点列表
         */
        $scope.getKaoDianList = function(jgid){
          if(jgid){
            var obj = {method: 'GET', url: kaoDianUrl, params: {'学校ID': jgid}};
            $scope.loadingImgShow = true;
            $http(obj).success(function(data){
              if(data.result && data.data){
                $scope.kaoChangList = DataService.cnSort(data.data, '考点名称');
              }
              else{
                $scope.kaoChangList = '';
                DataService.alertInfFun('err', data.error);
              }
              $scope.loadingImgShow = false;
            });
          }
          else{
            $scope.kaoChangList = '';
            DataService.alertInfFun('pmt', '请选择学校！');
          }
        };

        /**
         * 新增考场
         */
        $scope.addNewKaoChang = function(){
          $scope.kaochangData = {
            //'考点ID': '',
            '考点名称': '',
            '学校ID': '',
            '考位数': '',
            '联系人': '',
            '联系方式': '',
            '详情': {
              '考场地址': '',
              '交通方式': ''
            }
          };
          if($scope.adminParams.kaoDianFrom){
            $scope.kaochangData['学校ID'] = jgID;
          }
          else{
            $scope.kaochangData['学校ID'] = $scope.adminParams.sltJgId;
          }
          $scope.adminParams.editKcTp = 'add';
        };

        /**
         * 删除考场
         */
        $scope.deleteKaoChang = function(kc){
          var obj = {
            method: 'POST',
            url: kaoDianUrl,
            data: {
              '考点ID': '',
              '状态': -1
            }
          };
          if(kc['考点ID']){
            obj.data['考点ID'] = kc['考点ID'];
            if(confirm('确定要删除此考场吗？')){
              $http(obj).success(function(data){
                if(data.result){
                  $scope.adminParams.editKcTp = '';
                  if($scope.adminParams.kaoDianFrom){
                    $scope.getKaoDianList(jgID);
                  }
                  else{
                    $scope.getKaoDianList($scope.adminParams.sltJgId);
                  }
                  DataService.alertInfFun('suc', '删除成功！');
                }
                else{
                  DataService.alertInfFun('err', data.error);
                }
              });
            }
          }
          else{
            DataService.alertInfFun('pmt', '请选择要删除的考场！');
          }
        };

        /**
         * 修改考场
         */
        $scope.editKaoChang = function(kc){
          $scope.kaochangData = {
            '考点ID': kc['考点ID'],
            '考点名称': kc['考点名称'],
            '学校ID': kc['学校ID'],
            '考位数': kc['考位数'],
            '联系人': kc['联系人'],
            '联系方式': kc['联系方式'],
            '详情': {
              '考场地址': kc['详情'] ? kc['详情']['考场地址'] : '',
              '交通方式': kc['详情'] ? kc['详情']['交通方式'] : ''
            }
          };
          $scope.adminParams.editKcTp = 'mod';
        };

        /**
         * 取消考点修改
         */
        $scope.closeEditKaoDian = function(){
          $scope.adminParams.editKcTp = '';
        };

        /**
         * 保存考场
         */
        $scope.saveKaoChang = function(){
          $scope.kaochangData['详情'] = JSON.stringify($scope.kaochangData['详情']);
          var obj = {method: '', url: kaoDianUrl, data: $scope.kaochangData};
          if($scope.adminParams.editKcTp == 'add'){
            obj.method = 'PUT';
          }
          if($scope.adminParams.editKcTp == 'mod'){
            obj.method = 'POST';
          }
          $scope.loadingImgShow = true; //保存考场
          $http(obj).success(function(data){
            if(data.result){
              $scope.adminParams.editKcTp = '';
              if($scope.adminParams.kaoDianFrom){
                $scope.getKaoDianList(jgID);
              }
              else{
                $scope.getKaoDianList($scope.adminParams.sltJgId);
              }
              DataService.alertInfFun('suc', '考场保存成功！');
            }
            else{
              DataService.alertInfFun('err', data.error);
            }
            $scope.loadingImgShow = false; //保存考场
          });
        };

        /**
         *  扫描设定
         */
        $scope.renderScannerSetTpl = function(){
          if(!($scope.jigou_list && $scope.jigou_list.length)){
            getJgList(1);
          }
          $scope.kemu_list = '';
          $scope.isShenHeBox = false; //判断是不是审核页面
          $scope.loadingImgShow = false;
          $scope.adminSubWebTpl = 'views/renzheng/rz_scanner.html';
        };

        /**
         * 由所选机构，得到相应的科目，扫描设定
         */
        $scope.getKeMuList = function(jgid){
          if(jgid){
            var obj = {method:'GET', url:xueXiaoKeMuUrl, params: {'学校ID': jgid}};
            $http(obj).success(function(data){
              if(data.result && data.data){
                $scope.kemu_list = DataService.cnSort(data.data, '科目名称');
              }
              else{
                $scope.kemu_list = '';
                DataService.alertInfFun('err', data.error);
              }
              $scope.loadingImgShow = false;
              $scope.isShenHeBox = false;
            });
          }
          else{
            $scope.kemu_list = '';
            DataService.alertInfFun('pmt', '请选择机构ID');
          }
        };

        /**
         * 由所选科目，查询考试组
         */
        $scope.getKaoShiZuList = function(kmId){
          var obj = {
            method: 'GET',
            url: kaoShiZuUrl,
            params: {
              '学校ID': '',
              '科目ID': '',
              '返回试卷': true,
              '返回考试': true,
              '状态': JSON.stringify([5, 6])
            }
          };
          if($scope.scanner.selectInfo.jgid){
            obj.params['学校ID'] = $scope.scanner.selectInfo.jgid;
          }
          else{
            DataService.alertInfFun('pmt', '请选择机构！');
            return ;
          }
          if(kmId){
            obj.params['科目ID'] = kmId;
          }
          else{
            DataService.alertInfFun('pmt', '请选择科目！');
            return ;
          }
          $http(obj).success(function(data){
            if(data.result && data.data){
              $scope.kaoshizu_list = data.data;
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
            var fdTar = Lazy($scope.kaoshizu_list).find(function(ksz){
              return ksz['考试组ID'] == kszid;
            });
            if(fdTar){
              $scope.kaoshi_list = fdTar['考试'];
            }
            else{
              $scope.kaoshi_list = '';
            }
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
          if(ksid){
            var obj = {
              method: 'GET',
              url: shiJuanZuUrl,
              params: {'考试ID': ksid, '返回试卷': true, '返回题目内容': false}
            };
            $http(obj).success(function(data){
              if(data.result && data.data){
                $scope.shijuan_list = data.data[0]['试卷'];
              }
              else{
                $scope.shijuan_list = '';
                DataService.alertInfFun('err', data.error);
              }
            });
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
            '考试组ID': $scope.scanner.selectInfo.kszid,
            '考试ID': $scope.scanner.selectInfo.ksid,
            'OMR考试ID': $scope.scanner.inputInfo.omrksid,
            '试卷映射':[]
          };
          $scope.scannerResInfo = '';
          if($scope.scanner.inputInfo.sjaid){
            var obja = {'OMR试卷编号':'A','试卷ID': $scope.scanner.inputInfo.sjaid['试卷ID']};
            omr_set['试卷映射'].push(obja);
          }
          else{
            DataService.alertInfFun('pmt', '请填写A卷的试卷ID！');
            return ;
          }
          if($scope.scanner.inputInfo.sjbid){
            var objb = {'OMR试卷编号':'B','试卷ID': $scope.scanner.inputInfo.sjaid['试卷ID']};
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
            var obj = {
              method: 'POST',
              url: transferFromOmrUrl,
              data: {
                '转换参数': ''
              }
            };
            obj.data['转换参数'] = JSON.stringify(omr_set);
            $scope.loadingImgShow = true;
            $http(obj).success(function(data){
              if(data.result && data.data){
                $scope.scannerResInfo = data.data;
                $scope.loadingImgShow = false;
              }
              else{
                $scope.scannerResInfo = '';
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
            getJgList(1);
          }
          $scope.kemu_list = '';
          $scope.isShenHeBox = false; //判断是不是审核页面
          $scope.adminSubWebTpl = 'views/renzheng/rz_pdf.html';
        };

        /**
         * 生成pdf
         */
        //$scope.createPdf = function(stat){
        //  var obj = {
        //    token: token,
        //    kaozhizuid: '',
        //    xuexiaoname: '',
        //    kaoshizuname: '',
        //    pfdtype: stat
        //  };
        //  if($scope.scanner.selectInfo.kszid){
        //    obj.kaozhizuid = $scope.scanner.selectInfo.kszid;
        //    var findXueXiao = Lazy($scope.jigou_list).find(function(jg){
        //      return jg['学校ID'] == $scope.scanner.selectInfo.jgid;
        //    });
        //    var findKaoShiZu = Lazy($scope.kaoshizu_list).find(function(ksz){
        //      return ksz['考试组ID'] == $scope.scanner.selectInfo.kszid;
        //    });
        //    obj.xuexiaoname = findXueXiao['学校名称'];
        //    obj.kaoshizuname = findKaoShiZu['考试组名称'];
        //    $scope.loadingImgShow = true;
        //    $http({method: 'GET', url: createPdfUrl, params: obj}).success(function(data){
        //      if(data.result){
        //        DataService.alertInfFun('suc', '生成成功！');
        //      }
        //      else{
        //        DataService.alertInfFun('err', data.error);
        //      }
        //      $scope.loadingImgShow = false;
        //    });
        //  }
        //  else{
        //    DataService.alertInfFun('pmt', '请选择考试组!');
        //  }
        //};

        /**
         * 学校权限设置
         */
        $scope.schoolePowerSet = function(){
          getJgList();
          $scope.adminParams.sltJgId = '';
          $scope.sspKmList = '';
          $scope.isShenHeBox = false; //判断是不是审核页面
          $scope.loadingImgShow = false;
          $scope.adminSubWebTpl = 'views/renzheng/rz_setSchoolPower.html';
        };

        /**
         * 展示所有学校科目设置
         */
        $scope.sspAllKeMuSet = function(xxid){
          var obj = {
            method: 'GET',
            url: xueXiaoKeMuUrl,
            params: {'学校ID': ''}
          };
          $scope.adminParams.sltJg = '';
          if(xxid){
            obj.params['学校ID'] = xxid;
            var xueXiao = Lazy($scope.jigou_list).find(function(jg){ return jg['学校ID'] == xxid; });
            var xxSet = xueXiao['学校设置'];
            var hasCjZd = false;
            if(xxSet && xxSet['成绩和作答']){
              hasCjZd = DataService.objHasProp(xxSet['成绩和作答']);
            }
            if(xxSet && xxSet['学生自测']){
              $scope.adminParams.studentTest = xxSet['学生自测'];
            }
            else{
              $scope.adminParams.studentTest = false;
            }
            $http(obj).success(function(data){
              if(data.result && data.data){
                Lazy(data.data).each(function(km){
                  var pObj = {
                    '考试成绩': 'off',
                    '作答重现': 'off'
                  };
                  if(hasCjZd && xxSet['成绩和作答'] && xxSet['成绩和作答'][km['科目ID']]){
                    var sltKm = xxSet['成绩和作答'][km['科目ID']];
                    pObj['考试成绩'] = sltKm['考试成绩'] ? sltKm['考试成绩'] : 'off';
                    pObj['作答重现'] = sltKm['作答重现'] ? sltKm['作答重现'] : 'off';
                  }
                  km['设置'] = pObj;
                });
                $scope.adminParams.sltJg = xueXiao;
                $scope.sspKmList = DataService.cnSort(data.data, '科目名称');
              }
              else{
                $scope.sspKmList = '';
                DataService.alertInfFun('err', data.error);
              }
            });
          }
        };

        /**
         * 保存学校权限设置
         */
        $scope.saveSchoolSet = function(){
          var obj = {
            method: 'POST',
            url: xueXiaoUrl,
            data: {
              '学校ID': '',
              '学校设置': ''
            }
          };
          if($scope.adminParams.sltJg){
            obj.data['学校ID'] = $scope.adminParams.sltJg['学校ID'];
            obj.data['学校设置'] = $scope.adminParams.sltJg['学校设置'] || {};
            var cjAndZd = {};
            Lazy($scope.sspKmList).each(function(km){
              cjAndZd[km['科目ID']] = km['设置'];
            });
            obj.data['学校设置']['成绩和作答'] = cjAndZd;
            obj.data['学校设置']['学生自测'] = $scope.adminParams.studentTest;
            obj.data['学校设置'] = JSON.stringify(obj.data['学校设置']);
            $scope.loadingImgShow = true;
            $http(obj).success(function(data) {
              if(data.result) {
                $scope.adminParams.sltJgId = '';
                $scope.sspKmList = '';
                getJgList();
                DataService.alertInfFun('suc', '保存成功！');
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
              $scope.loadingImgShow = false;
            });
          }
          else{
            DataService.alertInfFun('pmt', '请选择学校！');
          }
        };

        /**
         * 题目复制
         */
        $scope.renderTiMuCopy = function(){
          $scope.tiMuCopy = {
            '原学校ID': '',
            '原科目ID': '',
            '原题目ID': '',
            '目标科目ID': '',
            '目标题库ID': ''
          };
          getJgList();
          $scope.kemu_list = '';
          $scope.isShenHeBox = false; //判断是不是审核页面
          $scope.loadingImgShow = false;
          $scope.adminSubWebTpl = 'views/renzheng/rz_copyTiMu.html';
        };

        /**
         * 给目标科目赋值
         */
        $scope.assignKeMuVal = function(){
          //$scope.tiMuCopy['目标科目ID'] = $scope.tiMuCopy['原科目ID'];
          $scope.qryTiKuByKm($scope.tiMuCopy['目标科目ID']);
        };

        /**
         * 通过领域查询题库
         */
        $scope.qryTiKuByKm = function(kmid){
          var fdTar = Lazy($scope.kemu_list).find(function(km){
            return km['科目ID'] == parseInt(kmid);
          });
          var kmObj = {
            method: 'GET',
            url: keMuUrl,
            params: {
              '学校ID': 1,
              '领域ID': ''
            }
          };
          var tkObj = {
            method: 'GET',
            url: tiKuUrl,
            params: {
              '学校ID': 1,
              '领域ID': ''
            }
          };
          if(fdTar){
            kmObj.params['领域ID'] = fdTar['领域ID'];
            tkObj.params['领域ID'] = fdTar['领域ID'];
          }
          else{
            DataService.alertInfFun('err', '请选择原科目ID！');
            return ;
          }
          $scope.tarTiKuList = '';
          $scope.tarKeMuList = '';
          $http(kmObj).success(function(kmlist){
            if(kmlist.result && kmlist.data){
              $scope.tarKeMuList = kmlist.data;
              //查询题库
              $http(tkObj).success(function(tk){
                if(tk.result && tk.data){
                  $scope.tarTiKuList = tk.data;
                }
                else{
                  DataService.alertInfFun('err', tk.error);
                }
              });
            }
            else{
              DataService.alertInfFun('err', ly.error);
            }
          });
        };

        /**
         * 保存题目复制
         */
        $scope.saveCopyTiMu = function(){
          var obj = {
            method: 'POST',
            url: copyTiMuUrl,
            data: {
              '原学校ID': $scope.tiMuCopy['原学校ID'],
              '原科目ID': $scope.tiMuCopy['原科目ID'],
              '目标科目ID': $scope.tiMuCopy['目标科目ID'],
              '目标题库ID': $scope.tiMuCopy['目标题库ID']
            }
          };
          var mis = [];
          if($scope.tiMuCopy['原题目ID']){
            var yTiMuId = $scope.tiMuCopy['原题目ID'].split('；');
            obj.data['原题目ID'] = yTiMuId;
            //obj.data['原题目ID'] = JSON.stringify(yTiMuId);
          }
          Lazy(obj.data).each(function(v, k, l){
            if(!v){
              mis.push(k);
            }
          });
          if(mis && mis.length > 0){
            DataService.alertInfFun('err', '缺少：' + mis.join('；'));
          }
          else{
            $http(obj).success(function(data){
              if(data.result && data.data){
                DataService.alertInfFun('suc', '成功复制了' + data.data['记录数'] + '条数据！');
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
            });
          }
        };

        /**
         * 展示修改学生信息
         */
        $scope.renderStuInfo = function(){
          $scope.modStuInfo = {
            '新姓名': '',
            '学生学号': '',
            '学生信息': ''
          };
          $scope.isShenHeBox = false; //判断是不是审核页面
          $scope.adminSubWebTpl = 'views/renzheng/rz_modStuInfo.html';
        };

        /**
         * 查询学生信息
         */
        $scope.qryStuInfo = function(){
          var obj = {
            method: 'GET',
            url: yongHuUrl,
            params: {
              '学校ID': jgID,
              '学号': '',
              '用户类别': 2
            }
          };
          if($scope.modStuInfo['学生学号']){
            obj.params['学号'] = $scope.modStuInfo['学生学号'];
            $http(obj).success(function(data){
              if(data.result && data.data){
                $scope.modStuInfo['学生信息'] = data.data[0];
                $scope.modStuInfo['新姓名'] = angular.copy(data.data[0]['姓名']);
              }
              else{
                $scope.modStuInfo['学生信息'] = '';
                DataService.alertInfFun('err', data.error);
              }
            });
          }
          else{
            DataService.alertInfFun('pmt', '请输入要查询的学生学号！');
          }
        };

        /**
         * 保存学生信息
         */
        $scope.saveStuInfo = function(){
          var obj = {
            method: 'POST',
            url: yongHuUrl,
            data: {
              '学校ID': jgID,
              'UID': '',
              '姓名': ''
            }
          };
          var mis = [];
          if(!$scope.modStuInfo['学生信息']['UID']){
            mis.push('学生UID');
          }
          if(!$scope.modStuInfo['新姓名']){
            mis.push('学生姓名');
          }
          if(mis && mis.length > 0){
            DataService.alertInfFun('pmt', '缺少：' + mis.join());
            return ;
          }
          obj.data['UID'] = $scope.modStuInfo['学生信息']['UID'];
          obj.data['姓名'] = $scope.modStuInfo['新姓名'];
          $http(obj).success(function(data){
            if(data.result){
              $scope.qryStuInfo();
              DataService.alertInfFun('suc', '修改成功！');
            }
            else{
              DataService.alertInfFun('err', data.error);
            }
          });
        };

        /**
         * 重置学生的邮箱和密码
         */
        $scope.resetEmailAndPsw = function(){
          var obj = {
            method: 'POST',
            url: yongHuUrl,
            data: {
              '学校ID': jgID,
              'UID': '',
              '邮箱': '',
              '密码': ''
            }
          };
          if($scope.modStuInfo['学生信息']['UID']){
            if(confirm('确定要重置此学生的邮箱和密码？')){
              obj.data['UID'] = $scope.modStuInfo['学生信息']['UID'];
              $http(obj).success(function(data){
                if(data.result){
                  $scope.qryStuInfo();
                  DataService.alertInfFun('suc', '重置邮箱和密码成功！');
                }
                else{
                  DataService.alertInfFun('err', data.error);
                }
              });
            }
          }
          else{
            DataService.alertInfFun('pmt', '学生的UID不存在！');
          }
        };

        /**
         * 题目复制
         */
        $scope.renderWeiXin = function(){
          getJgList();
          $scope.kemu_list = '';
          $scope.isShenHeBox = false; //判断是不是审核页面
          $scope.loadingImgShow = false;
          $scope.adminSubWebTpl = 'views/renzheng/rz_weixin.html';
        };

        /**
         * 查询微信用户
         */
        $scope.qryWeiXinUsr = function(){
          var obj = {
            method: 'GET',
            url: yongHuUrl,
            params: {}
          };
          var mis = [];
          if($scope.adminParams.wxStyle == 'uid'){
            obj.params['UID'] = $scope.weiXin.uid ? $scope.weiXin.uid : mis.push('UID');
          }
          if($scope.adminParams.wxStyle == 'email'){
            obj.params['邮箱'] = $scope.weiXin.email ? $scope.weiXin.email : mis.push('邮箱');
          }
          if($scope.adminParams.wxStyle == 'xuexiao'){
            obj.params['学校ID'] = $scope.weiXin.xuexiao ? $scope.weiXin.xuexiao : mis.push('学校');
            obj.params['用户类别'] = 1;
          }
          if($scope.adminParams.wxStyle == 'xuehao'){
            obj.params['学校ID'] = $scope.weiXin.xuexiao ? $scope.weiXin.xuexiao : mis.push('学校');
            obj.params['学号'] = $scope.weiXin.xuehao ? $scope.weiXin.xuehao : mis.push('学号');
            obj.params['用户类别'] = 2;
          }
          if(mis.length > 0){
            DataService.alertInfFun('pmt', '缺少：' + mis.join());
            return ;
          }
          $http(obj).success(function(data){
            if(data.result && data.data){
              $scope.weiXinUsr = data.data;
            }
            else{
              $scope.weiXinUsr = [];
              DataService.alertInfFun('err', data.error || '没有用户信息！');
            }
          });
        };

        /**
         * 解除绑定
         */
        $scope.unBinding = function(wx){
          var mis = [];
          if(!wx['UID']){
            mis.push('UID');
          }
          if(!wx['微信ID']){
            mis.push('微信ID');
          }
          if(mis.length > 0){
            DataService.alertInfFun('pmt', '缺少：' + mis.join());
            return ;
          }
          $scope.loadingImgShow = true;
          var obj = {
            method: 'POST',
            url: yongHuUrl,
            data: {
              'UID': wx['UID'],
              '微信ID': ''
            }
          };
          if(confirm('确定要解除微信绑定吗？')){
            $http(obj).success(function(data){
              if(data.result){
                $scope.qryWeiXinUsr();
                DataService.alertInfFun('suc', '微信解除绑定成功！');
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
              $scope.loadingImgShow = false;
            });
          }
        };

      }]);
});
