define(['angular', 'config','jquery', 'lazy'], function (angular, config, $, lazy) {
  'use strict';

  angular.module('zhifzApp.controllers.NavCtrl', [])
    .controller('NavCtrl', ['$rootScope', '$scope', '$location', '$http', 'DataService',
      function ($rootScope, $scope, $location, $http, DataService) {
        /**
         * 定义变量
         */
        var baseRzAPIUrl = config.apiurl_rz; //renzheng的api
        var token = config.token;
        var alterYongHu = baseRzAPIUrl + 'xiugai_yonghu';
        var apiUrlLy = baseRzAPIUrl + 'lingYu?token=' + config.token + '&jigouid='; //lingYu 学科领域的api
        var apiLyKm = baseRzAPIUrl + 'lingYu?token=' + config.token + '&parentid='; //由lingYu id 的具体的学科
        var apiUrlJueSe = baseRzAPIUrl + 'jueSe?token=' + config.token; //jueSe 查询科目权限的数据的api
        var objAndRightList = []; //已经选择的科目和单位
        var userInfo;
        var selectedLingYuIndex;

        $scope.userInfoLayer = false;
        $scope.navData = {
          newPsd: '',
          select_ly: '',
          jiGouId: ''
        };

        /**
         * 控制导航的代码
         */
        $scope.navClass = function (page) {
          var currentRoute = $location.path().substring(1);
          return page === currentRoute ? 'active' : '';
        };

        /**
         * 显示个人详情
         */
        $scope.showUserInfo = function(){
          var user = {};
          var jueseDist;
          var yhxxxxApiUrl = baseRzAPIUrl + 'yonghu_xiangxi_xinxi?token=' + token + '&yonghuid=' +
              $rootScope.session.info.UID; //通过UID查询用户详细的url
          userInfo = $rootScope.session.userInfo;
          $http.get(yhxxxxApiUrl).success(function(data){
            if(data.JIGOU && data.JIGOU.length >= 0){
              user.LINGYU = [];
              jueseDist = Lazy(data.JUESE).groupBy(function(js){ return js.LINGYUMINGCHENG; }).toObject();
              Lazy(data.LINGYU).each(function(ly){
                var jsName = Lazy(jueseDist[ly.LINGYUMINGCHENG]).map(function(js){ return js.JUESEMINGCHENG; }).toArray();
                var lyObj = {
                    LINGYUMINGCHENG: '',
                    LINGYU_ID: '',
                    jueseStr: ''
                  };
                lyObj.LINGYUMINGCHENG = ly.LINGYUMINGCHENG;
                lyObj.LINGYU_ID = ly.LINGYU_ID;
                lyObj.jueseStr = jsName.join();
                user.LINGYU.push(lyObj);
              });
              //基本信息
              user.XINGMING = data.XINGMING || '';
              user.YOUXIANG = data.YOUXIANG || '';
              user.SHOUJI = data.SHOUJI || '';
              user.GERENJIANLI = data.GERENJIANLI || '';
              user.YONGHULEIBIE = data.YONGHULEIBIE;
              user.UID = $rootScope.session.info.UID;
              $('.modifuMiMaInfo').html('');
              //查询领域，去取已有领域;查询父领域的代码
              if(data.JIGOU[0]){
                $scope.navData.jiGouId = data.JIGOU[0].JIGOU_ID;
                user.JIGOUMINGCHENG = data.JIGOU[0].JIGOUMINGCHENG;
                $http.get(apiUrlLy + data.JIGOU[0].JIGOU_ID).success(function(jgData) {
                  if(jgData && jgData.length){
                    $scope.lingYuList = jgData;
                  }
                  else{
                    $scope.lingYuList = '';
                    DataService.alertInfFun('err', '没有相关领域！');
                  }
                });
              }
              else{
                user.JIGOUMINGCHENG = '';
              }
              //查询角色的代码
              $http.get(apiUrlJueSe).success(function(jsData) {
                if(jsData && jsData.length > 0){
                  $scope.juese_list = jsData;
                }
              });
              $scope.usr = user;
              $scope.userInfoLayer = true;
            }
          });
        };

        /**
         /重新选择时，删除已选择的科目和角色
         */
        var deleteAllSelectedKmAndJs = function(){
          objAndRightList = [];
          $scope.objAndRight = objAndRightList;
        };

        /**
         * 有父领域查询子领域领域（即科目）
         */
        $scope.getKemuList = function(lyId){
          if(lyId){
            $http.get(apiLyKm + lyId).success(function(data) {
              if(data.length){
                var newData;
                Lazy($scope.usr.LINGYU).each(function(hasLy, idx, lst){
                  newData = Lazy(data).reject(function(ly){ return ly.LINGYU_ID  == hasLy.LINGYU_ID; }).toArray();
                });
                $scope.kemu_list = newData;
                deleteAllSelectedKmAndJs();
              }
              else{
                $scope.kemu_list = '';
                DataService.alertInfFun('err', '没有对应的科目！');
              }
            });
          }
          else{
            $scope.kemu_list = '';
          }
        };

        /**
         * 添加科目和权限
         */
        $scope.getObjectAndRight = function(){
          var objAndRightObj = {
            lingyu:'',
            juese:{
              jueseId: '',
              jueseName: ''
            }
          };
          objAndRightObj.lingyu = $scope.kemu_list.splice(selectedLingYuIndex, 1);
          objAndRightObj.juese.jueseId = selectJueseIdArr;
          objAndRightObj.juese.jueseName = selectJueseNameArr;
          objAndRightList.push(objAndRightObj);
          $scope.objAndRight = objAndRightList;
          $('input[name=rightName]:checked').prop('checked', false);
          $scope.jueseValue = false;
          $scope.linyuValue = false;
        };

        /**
         * 获得领域lingyu（选择科目）的值
         */
        $scope.getLingYuVal = function(idx){
          selectedLingYuIndex = '';
          selectedLingYuIndex = idx;
          $scope.linyuValue = idx >=0 ? true : false;
        };

        /**
         * 获得角色juese（科目权限）的代码
         */
        var selectJueseIdArr = [],
          selectJueseNameArr = [];
        $scope.getJueSeArr = function(){
          selectJueseIdArr = [];
          selectJueseNameArr = [];
          var jueseItem = $('input[name=rightName]:checked');
          Lazy(jueseItem).each(function(js, idx, lst){
            selectJueseIdArr.push(js.value);
            var jsName = js.nextElementSibling;
            if(jsName){
              selectJueseNameArr.push(jsName.innerHTML);
            }
          });
          $scope.jueseValue = selectJueseIdArr.length;
        };

        /**
         *  删除一条已选科目
         */
        $scope.delSelectedObject = function(idx){
          var deleteObjectAndRight = $scope.objAndRight.splice(idx, 1);
          $scope.kemu_list.push(deleteObjectAndRight[0].lingyu[0]);
        };

        /**
         * 保存新增加的领域
         */
        $scope.saveNewLingYu = function(){
          var select_juese = [];
          var newLingYuDate = {
              token: token,
              UID: userInfo.UID,
              JUESE: ''
            };
          Lazy(objAndRightList).each(function(oar, indx, lst){
            Lazy(oar.juese.jueseId).each(function(jsid, idx, lst){
              var jueseObg = {
                jigou: $scope.navData.jiGouId,
                lingyu: '',
                juese: ''
              };
              jueseObg.lingyu = oar.lingyu[0].LINGYU_ID;
              jueseObg.juese = jsid;
              select_juese.push(jueseObg);
            });
          });
          newLingYuDate.JUESE = select_juese;
          $http.post(alterYongHu, newLingYuDate).success(function(data){
            if(data.result){
              DataService.alertInfFun('suc', '成功添加新领域添加！');
            }
            else{
              DataService.alertInfFun('err', '修改失败！错误信息为：' + data.error);
            }
          });
        };

        /**
         * 关闭个人详情页
         */
        $rootScope.closeUserInfoLayer = function(){
          $scope.userInfoLayer = false;
        };

        /**
         * 修改密码
         */
        $scope.modifyPassWord = function(){
          var newPsdData = {
            token: token,
            UID: '',
            MIMA: ''
          };
          newPsdData.UID = userInfo.UID;
          newPsdData.MIMA = $scope.navData.newPsd;
          $('.modifuMiMaInfo').html('');
          $http.post(alterYongHu, newPsdData).success(function(data){
            if(data.result){
              $scope.navData.newPsd = '';
              DataService.alertInfFun('suc', '密码修改成功！');
            }
            else{
              DataService.alertInfFun('err', data.error);
            }
          });
        };

        /**
         * 退出程序
         */
        $scope.signOut = function(){
          DataService.logout();
        };

        /**
         * 点击相应的模块刷新
         */
        $scope.reloadModule = function(targUrl){
          if($location.$$url == targUrl){
            $location.path($location.$$absUrl);
          }
        };

        /**
         * 个人简历修改
         */
        $scope.saveGenRenJianLi = function(){
          var newGrjlDate = {
            token: token,
            UID: userInfo.UID,
            GERENJIANLI: ''
          };
          if($scope.usr.GERENJIANLI){
            newGrjlDate.GERENJIANLI = $scope.usr.GERENJIANLI;
            $http.post(alterYongHu, newGrjlDate).success(function(data){
              if(data.result){
                DataService.alertInfFun('suc', '个人简历修改成功！');
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
            });
          }
        };

    }]);
});
