define(['angular', 'config', 'lazy'], function (angular, config, lazy) {
  'use strict';

  angular.module('zhifzApp.controllers.RenzhengCtrl', [])
    .controller('RenzhengCtrl', ['$rootScope', '$scope', '$location', '$http', 'urlRedirect', '$cookieStore',
      'DataService', '$routeParams', '$timeout',
      function ($rootScope, $scope, $location, $http, urlRedirect, $cookieStore, DataService, $routeParams, $timeout) {

        var login = { //教师登录数据格式
          userName: '',
          password: ''
        };
        var urlArr = [];
        var currentPath = $location.$$path;
        var checkEmailUrl = '/exists_youxiang'; //检测邮箱是否存在
        var findPwUrlUrl = '/find_password'; //忘记密码
        var resetPwUrl = '/reset_password'; //重置密码
        var xueXiaoKeMuUrl = '/xuexiao_kemu'; //学校科目URL
        var xueXiaoUrl = '/xuexiao'; //机构的增删改查
        var module = config.moduleObj;
        var loginUrl = '/login'; //登录的URL
        var regu = /[\w!#$%&'*+/=?^_`{|}~-]+(?:\.[\w!#$%&'*+/=?^_`{|}~-]+)*@(?:[\w](?:[\w-]*[\w])?\.)+[\w](?:[\w-]*[\w])?/; //验证邮箱的正则表达式
        $scope.login = login;
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
        $scope.rzParams.zhuCeUrl = $location.$$protocol + '://' +$location.$$host + ':' + $location.$$port + '/#/register/stuFindUsername';
        $scope.rzParams.homeUrl = $location.$$protocol + '://' +$location.$$host + ':' + $location.$$port + '/#/renzheng';
        $scope.dengluInfo = false;
        $scope.loginBtn = false;
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
         * 学生找回用户名
         */
        $scope.stuFindUsrName = function(){
          urlRedirect.goTo(currentPath, '/register/stuFindUsername');
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
         * 登录程序;在module数组中的索引：D0, M1, Z2, K3, T4, G5, B6, C7, W8, J9  --
         */
        $scope.signIn = function() {
          var obj = {
            method: 'GET',
            url: loginUrl,
            params: {
              '密码': login.password
            }
          };
          var re = new RegExp(regu);
          if (re.test(login.userName)) {
            obj.params['邮箱'] = login.userName;
          }
          else {
            obj.params['用户名'] = login.userName;
          }
          urlArr = [];
          $scope.loginBtn = true;
          $http(obj).success(function(data){
            if(data.result && data.data){
              var usrInfo = { //登录用户的cookies
                UID: data.data['UID'],
                '学校ID': data.data['学校ID'],
                '用户名': data.data['用户名'],
                '姓名': data.data['姓名']
                //'用户设置': data.data['用户设置']
              };
              $rootScope.xingMing = data.data['姓名'];
              if(data.data['用户设置']){
                if(!data.data['用户设置']['默认大纲']){
                  data.data['用户设置']['默认大纲'] = {
                    '知识大纲ID': '',
                    '知识大纲名称': ''
                  };
                }
                usrInfo['用户设置'] = data.data['用户设置'];
              }
              else{
                usrInfo['用户设置'] = {
                  '默认大纲':{
                    '知识大纲ID': '',
                    '知识大纲名称': ''
                  }
                };
              }
              $cookieStore.put('ckUsr', JSON.stringify(usrInfo));
              if(data.data['用户类别'] == 2){ //判断是否是学生
                urlArr.push(module[7]);
                urlArr.push(module[8]);
                //urlArr.push(module[9]);
                var jgObj = {
                  method: 'GET',
                  url: xueXiaoUrl,
                  params: {
                    '学校ID': data.data['学校ID']
                  }
                };
                $http(jgObj).success(function(xuexiao){
                  if(xuexiao.result && xuexiao.data){
                    var xxData = xuexiao.data[0];
                    if(xxData['学校设置'] && xxData['学校设置']['学生自测'] != 'undefined' && xxData['学校设置']['学生自测']){
                      urlArr.push(module[10]);
                    }
                  }
                  config.loginUsr = data.data;
                  $rootScope.urlArrs = urlArr;
                  $cookieStore.put('ckUrl', JSON.stringify(urlArr));
                  urlRedirect.goTo(currentPath, '/baoming');
                });
              }
              else{
                var qxArr = Lazy(data.data['权限']).reject(function(qx){ //去除阅卷负责人4，助教5的权限
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
                      if(xxKm.result && xxKm.data){
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
              $scope.loginBtn = false;
            }
            else{
              $scope.loginBtn = false;
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
            for(var i = 0; i < 7; i++){
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
          if($scope.rzParams.registerEmail){
            var obj = {
              method: 'GET',
              url: findPwUrlUrl,
              params: {
                '注册邮箱': $scope.rzParams.registerEmail
              }
            };
            var mailLink = 'http://mail.' + $scope.rzParams.registerEmail.split('@').pop();
            $scope.loginBtn = true;
            $http(obj).success(function(data){
              if(data.result){
                $scope.loginBtn = false;
                $scope.rzParams.emailLink = mailLink;
                $scope.rzParams.sendEmailSuccess = true;
              }
              else{
                $scope.loginBtn = false;
                DataService.alertInfFun('err', data.error)
              }
            });
          }
        };

        /**
         * 检查输入的邮箱或者是用户名，在数据库中是否存在
         */
        $scope.checkUsrExist = function(info){
          var obj = {
            method: 'GET',
            url: checkEmailUrl,
            params: {
              '邮箱': ''
            }
          };
          if(info){
            obj.params['邮箱'] = info;
            $http(obj).success(function(data){
              if(data.result && data.data){
                if(data.data['存在']){
                  $scope.youxiangExist = false;
                }
                else{
                  $scope.youxiangExist = true;
                  DataService.alertInfFun('err', '邮箱不存在！');
                }
              }
              else{
                $scope.youxiangExist = true;
                DataService.alertInfFun('err', data.error);
              }
            });
          }
        };

        /**
         * 重置密码
         */
        $scope.newPasswordObj = {
          '邮箱': $routeParams.email,
          '密码': '',
          '确认密码': ''
        };
        $scope.restPassword = function(){
          if($scope.newPasswordObj['密码'] == $scope.newPasswordObj['确认密码']){
            //delete $scope.newPasswordObj['确认密码'];
            var obj = {
              method: 'POST',
              url: resetPwUrl,
              data: $scope.newPasswordObj
            };
            $scope.loginBtn = true;
            $http(obj).success(function(data){
              if(data.result){
                $scope.rzParams.resetPwSuccess = true;
                var jumpToHome = function() {
                  urlRedirect.goTo(currentPath, '/renzheng');
                };
                $timeout(jumpToHome, 5000);
                $scope.loginBtn = false;
              }
              else{
                $scope.loginBtn = false;
                DataService.alertInfFun('err', data.error);
              }
            });
          }
          else{
            DataService.alertInfFun('err', '两次密码输入的不一样！');
          }
        };

      }]);
});
