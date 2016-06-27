define(['angular', 'config','jquery', 'lazy'], function (angular, config, $, lazy) {
  'use strict';

  angular.module('zhifzApp.controllers.NavCtrl', [])
    .controller('NavCtrl', ['$rootScope', '$scope','$route', '$location', '$http', 'DataService', '$cookieStore',
      function ($rootScope, $scope, $route, $location, $http, DataService, $cookieStore) {
        /**
         * 定义变量
         */
        var loginUsr = '';
        var logUid = ''; //登录用户的UID
        var yongHuUrl = '/yonghu';
        $scope.usr = '';
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
         * 显示个人详情 --
         */
        $scope.showUserInfo = function(){
          loginUsr = JSON.parse($cookieStore.get('ckUsr'));
          logUid = loginUsr['UID'];
          var obj = {
            method: 'GET',
            url: yongHuUrl,
            params: {
              'UID': logUid
            }
          };
          $scope.usr = '';
          $http(obj).success(function(data){
            if(data.result){
              $scope.usr = data.data[0];
              $scope.userInfoLayer = true;
            }
            else{
              DataService.alertInfFun('err', data.error);
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
          var obj = {
            method: 'POST',
            url: yongHuUrl,
            data: {
              '密码': ''
            }
          };
          if($scope.navData.newPsd){
            obj.data['密码'] = $scope.navData.newPsd;
            $http(obj).success(function(data){
              if(data.result){
                $scope.navData.newPsd = '';
                DataService.alertInfFun('suc', '密码修改成功！');
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
            });
          }
          else{
            DataService.alertInfFun('err', '请输入新密码！');
          }
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
            //$rootScope.reloadModule = true;
            //$location.path($location.$$absUrl);
            $route.reload();
          }
        };

    }]);
});
