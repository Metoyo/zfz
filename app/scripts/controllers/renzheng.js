define(['angular', 'config', 'lazy'], function (angular, config, lazy) {
  'use strict';

  angular.module('zhifzApp.controllers.RenzhengCtrl', [])
    .controller('RenzhengCtrl', ['$rootScope', '$scope', '$location', '$http', 'urlRedirect', '$cookieStore',
      'DataService', '$routeParams', '$timeout',
      function ($rootScope, $scope, $location, $http, urlRedirect, $cookieStore, DataService, $routeParams, $timeout) {

        var baseRzAPIUrl = config.apiurl_rz;
        var token = config.token;
        var login = { //教师登录数据格式
          userName: '',
          password: ''
        };
        var stuLogin = { //学生登录数据格式
          userName: '',
          password: ''
        };
        var urlArr = [];
        var currentPath = $location.$$path;
        var checkUserUrlBase = config.apiurl_rz + 'check_user?token=' + config.token; //检测用户是否存在的url
        var findPwUrlBase = baseRzAPIUrl + 'find_password?token=' + token + '&registeremail='; //忘记密码
        var resetPwUrl = baseRzAPIUrl + 'reset_password'; //重置密码
        var xueXiaoKeMuUrl = '/xuexiao_kemu'; //学校科目URL
        var module = config.moduleObj;
        $scope.login = login;
        $scope.stuLogin = stuLogin;
        $rootScope.isPromiseAlterOthersTimu = false;
        $scope.rzParams = { //全局参数
          registerEmail: '',
          passwordRegexp:' /^.{6,20}$/',
          emailLink: '',
          sendEmailSuccess: false,
          zhuCeUrl: '',
          homeUrl: '',
          resetPwSuccess: false
        };
        $scope.rzParams.zhuCeUrl = $location.$$protocol + '://' +$location.$$host + ':' + $location.$$port + '/#/register';
        $scope.rzParams.homeUrl = $location.$$protocol + '://' +$location.$$host + ':' + $location.$$port + '/#/renzheng';
        $scope.dengluInfo = false;
        $rootScope.urlArrs = [];
        $rootScope.loginUsr = '';

        //delete $rootScope.session;
        //$cookieStore.remove('ckUrl');
        //$cookieStore.remove('ckKeMu');
        //$cookieStore.remove('ckUsr');
        //$cookieStore.remove('ckJs');

        /**
         * 显示找回密码页面
         */
        $scope.showFindPw = function(){
          $scope.rzTpl = 'views/renzheng/rz_findPw.html';
        };

        /**
         * 认证返回界面
         */
        $scope.rzBackTo = function(step){
          switch (step) {
            case 0:
              $scope.rzTpl = 'views/renzheng/rz_login.html';
              break;
          }
        };

        /**
         * 登录程序;在module数组中的索引：D0, M1, Z2, K3, T4, G5, B6, C7, W8  --
         */
        $scope.signIn = function() {
          var loginUrl = '/login?用户名=' + login.userName + '&密码=' + login.password;
          urlArr = [];
          $http.get(loginUrl).success(function(data){
            if(data.result){
              var usrInfo = { //登录用户的cookies
                UID: data.data['UID'],
                '学校ID': data.data['学校ID'],
                '用户名': data.data['用户名']
              };
              $cookieStore.put('ckUsr', JSON.stringify(usrInfo));
              if(data.data['用户类别'] == 2){ //判断是否是学生
                urlArr.push(module[6]);
                urlArr.push(module[7]);
                urlArr.push(module[8]);
                config.loginUsr = data.data;
                $rootScope.urlArrs = urlArr;
                $cookieStore.put('ckUrl', JSON.stringify(urlArr));
                urlRedirect.goTo(currentPath, '/baoming');
              }
              else{
                var qxArr = Lazy(data.data['权限']).reject(function(qx){ //去除阅卷组长4，助教5的权限
                  return qx['角色ID'] == 4 || qx['角色ID'] == 5;
                }).toArray();
                data.data['权限'] = qxArr;
                config.loginUsr = data.data;
                if(qxArr && qxArr.length > 0){ //判断是否通过审批
                  var lyTpArr = [], kmTpArr = [], jsTpArr = [], lyArr = '', kmArr = '', jsArr = '';
                  Lazy(qxArr).each(function(qx){
                    lyTpArr.push(qx['领域ID']);
                    kmTpArr.push(qx['科目ID']);
                    jsTpArr.push(qx['角色ID']);
                  });
                  //lyArr = Lazy(lyTpArr).sortBy(function(ly){ return ly; }).uniq().toArray(); //得到领域的数组
                  kmArr = Lazy(kmTpArr).sortBy(function(km){ return km; }).uniq().toArray(); //得到科目的数组
                  jsArr = Lazy(jsTpArr).sortBy(function(js){ return js; }).uniq().toArray(); //得到角色的数组
                  var adminQx = Lazy(jsArr).contains(0); //判断系统管理员
                  var xxglyQx = Lazy(jsArr).contains(1); //判断学校管理员
                  $cookieStore.put('ckJs', JSON.stringify(jsArr));
                  if(adminQx || xxglyQx){ //判断管理员
                    var navUrl = '/user/' + data.data['用户名']; //导向的URL
                    urlRedirect.goTo(currentPath, navUrl);
                  }
                  else{
                    $scope.usrKeMu = [];
                    var obj = {method: 'GET', url: xueXiaoKeMuUrl, params: {'学校ID': data.data['学校ID']}};
                    $http(obj).success(function(xxKm){
                      if(xxKm.result){
                        Lazy(kmArr).each(function(kmId){
                          var findKm = Lazy(xxKm.data).find(function(km){return km['科目ID'] == kmId});
                          $scope.usrKeMu.push(findKm);
                        });
                        if(kmArr && kmArr.length == 1){
                          $scope.moduleMake($scope.usrKeMu[0]);
                        }
                        if(kmArr && kmArr.length > 1){
                          $scope.rzTpl = 'views/renzheng/selectLingYu.html'
                        }
                      }
                      else{
                        DataService.alertInfFun('err', xxKm.error);
                      }
                    });
                  }
                }
                else{
                  DataService.alertInfFun('pmt', '您注册的信息正在审核中，新耐心等待……');
                }
              }
            }
            else{
              DataService.alertInfFun('err', data.error);
            }
          });
        };

        /**
         * 模块组织页面; 在module数组中的索引：D0, M1, Z2, K3, T4, G5, B6, C7, W8  --
         */
        $scope.moduleMake = function(km){
          var kmId = km['科目ID'];
          var usr = config.loginUsr;
          var jsArr = [];
          $rootScope.defaultKm = km;
          $cookieStore.put('ckKeMu', JSON.stringify(km));
          Lazy(usr['权限']).each(function(qx){
            if(qx['科目ID'] == kmId){
              jsArr.push(qx['角色ID']);
            }
          });
          var kmfzrQx = Lazy(jsArr).contains(2); //判断科目负责人
          var rkjsQx = Lazy(jsArr).contains(3); //判断任课教师
          if(kmfzrQx){ //科目负责人有全部模块
            for(var i = 0; i < 6; i++){
              urlArr.push(module[i]);
            }
            urlRedirect.goTo(currentPath, '/mingti');
          }
          else{
            if(rkjsQx){ //任课教师模块
              urlArr.push(module[1]);
              urlArr.push(module[2]);
              urlArr.push(module[4]);
              urlRedirect.goTo(currentPath, '/mingti');
            }
            else{
              urlRedirect.goTo(currentPath, '/renzheng');
              DataService.alertInfFun('err', '您没有权限查看相应的权限！');
            }
          }
          $rootScope.urlArrs = urlArr;
          $cookieStore.put('ckUrl', JSON.stringify(urlArr));
        };

        /**
         * 忘记密码
         */
        $scope.sendFindPwEmail = function() {
          if($scope.registerEmail){
            var findPwUrl = findPwUrlBase + $scope.registerEmail,
              mailLink = 'http://mail.' + $scope.registerEmail.split('@').pop();
            $http.get(findPwUrl).success(function(data){
              if(data.result){
                $scope.rzParams.emailLink = mailLink;
                $scope.rzParams.sendEmailSuccess = true;
              }
              else{
                DataService.alertInfFun('err', data.error)
              }
            });
          }
        };

        /**
         * 检查输入的邮箱或者是用户名，在数据库中是否存在
         */
        $scope.checkUsrExist = function(nme, info){
          var checkUserUrl = checkUserUrlBase + '&' + nme + '=' + info;
          $http.get(checkUserUrl).success(function(data){
            if(data.result){
              $scope.youxiangExist = false;
            }
            else{
              $scope.youxiangExist = true;
              DataService.alertInfFun('err', '邮箱不存在！')
            }
          });
        };

        /**
         * 重置密码
         */
        $scope.newPasswordObj = {
          token: token,
          email: $routeParams.email,
          newPw: '',
          confirmNewPw: ''
        };
        $scope.restPassword = function(){
          if($scope.newPasswordObj.newPw == $scope.newPasswordObj.confirmNewPw){
            $http.post(resetPwUrl, $scope.newPasswordObj).success(function(data){
              if(data.result){
                $scope.rzParams.resetPwSuccess = true;
                var jumpToHome = function() {
                  urlRedirect.goTo(currentPath, '/renzheng');
                };
                $timeout(jumpToHome, 5000);
              }
            });
          }
        };

        /**
         * 重置错误信息
         */
        $scope.errorInfoReset = function(){
          $scope.dengluInfo = false;
          login.userName = '';
          login.password = '';
          stuLogin.userName = '';
          stuLogin.password = '';
        };

      }]);
});
