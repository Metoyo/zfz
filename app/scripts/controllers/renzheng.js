define(['angular', 'config', 'lazy'], function (angular, config, lazy) {
  'use strict';

  angular.module('zhifzApp.controllers.RenzhengCtrl', [])
    .controller('RenzhengCtrl', ['$rootScope', '$scope', '$location', '$http', 'urlRedirect', '$cookieStore',
      'DataService', '$routeParams', '$timeout',
      function ($rootScope, $scope, $location, $http, urlRedirect, $cookieStore, DataService, $routeParams,
                $timeout) {

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
        var session = {};
        var urlArr = [];
        var currentPath = $location.$$path;
        var checkUserUrlBase = config.apiurl_rz + 'check_user?token=' + config.token; //检测用户是否存在的url
        var findPwUrlBase = baseRzAPIUrl + 'find_password?token=' + token + '&registeremail='; //忘记密码
        var resetPwUrl = baseRzAPIUrl + 'reset_password'; //重置密码

        $rootScope.session = session;
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
         * 登录程序
         */
        $scope.signIn = function() {
          var loginUrl = '/login?用户名=' + login.userName + '&密码=' + login.password;
          urlArr = [];
          config.userJs = '';
          $http.get(loginUrl).success(function(data){
            if(data.result){
              if(data.data['用户类别'] == 2){ //判断是否是学生
                var urlObj1 = {
                  myUrl: 'baoming',
                  urlName: '报名'
                };
                var urlObj2 = {
                  myUrl: 'chengji',
                  urlName: '成绩'
                };
                var urlObj3 = {
                  myUrl: 'weiluke',
                  urlName: '录课'
                };
                urlArr.push(urlObj1);
                urlArr.push(urlObj2);
                urlArr.push(urlObj3);
              }
              else{
                var qxArr = data.data['权限'];
                if(qxArr && qxArr.length > 0){ //判断是否通过审批
                  var lyTpArr = [], kmTpArr = [], jsTpArr = [], lyArr = '', kmArr = '', jsArr = '';
                  Lazy(qxArr).each(function(qx){
                    lyTpArr.push(qx['领域ID']);
                    kmTpArr.push(qx['科目ID']);
                    jsTpArr.push(qx['角色ID']);
                  });
                  lyArr = Lazy(lyTpArr).sortBy(function(ly){ return ly; }).uniq().toArray(); //得到领域的数组
                  kmArr = Lazy(kmTpArr).sortBy(function(km){ return km; }).uniq().toArray(); //得到科目的数组
                  jsArr = Lazy(jsTpArr).sortBy(function(js){ return js; }).uniq().toArray(); //得到角色的数组
                  var adminQx = Lazy(jsArr).contains(0); //判断系统管理员
                  var xxglyQx = Lazy(jsArr).contains(1); //判断学校管理员
                  if(adminQx || xxglyQx){ //判断管理员
                    var navUrl = '/user/' + data.data['用户名']; //导向的URL
                    config.userJs = jsArr;
                    urlRedirect.goTo(currentPath, navUrl);
                  }
                  else{
                    if(kmArr && kmArr.length > 1){ //科目大于1，导向领域选择页面
                      urlRedirect.goTo(currentPath, '/lingyu');
                    }
                    else{ //直接转向业务模块

                    }
                  }
                }
                else{
                  DataService.alertInfFun('pmt', '您注册的信息正在审核中，新耐心等待……');
                }
              }
              $rootScope.urlArrs = urlArr;
            }
            else{
              DataService.alertInfFun('err', data.error);
            }
          });
          //urlArr = [];
          //if(login.userName && login.password) {
          //  var loginPostParams = {
          //    token : config.token,
          //    yonghuming : login.userName,
          //    mima : login.password
          //  };
          //  //登录信息的验证
          //  $http.post(loginApiUrl, loginPostParams).success(function(result) {
          //    var jsArr, quanxianDist, userCookie, lingyuCookie, myUrlCookie;
          //    session.info = result[0];
          //    session.userInfo = '';
          //    session.quanxian2032 = false;
          //    if(result && result.length > 0){
          //      var profileUrl = '/user/' + login.userName,
          //        yhxxxxApiUrl = config.apiurl_rz + 'yonghu_xiangxi_xinxi?token=' + config.token + '&yonghuid=' +
          //          session.info.UID; //通过UID查询用户详细的url
          //      /**
          //       *查询过用户的详细信息，得到jigouid,lingyuid等等 JUESE
          //       */
          //      $http.get(yhxxxxApiUrl).success(function(data){
          //        if(data.JIGOU && data.JIGOU.length > 0){
          //          if(data.JUESE && data.JUESE.length > 0){
          //            session.userInfo = data;
          //            jsArr = Lazy(data.JUESE)
          //              .sortBy(function(js){ return js.JUESE_ID; })
          //              .map(function(js){ return js.JUESE_ID; })
          //              .uniq()
          //              .without("9", "10")
          //              .toArray(); //得到角色的数组
          //            quanxianDist = Lazy(data.QUANXIAN).groupBy(function(qx){ return qx.LINGYU_ID; }).toObject();
          //            Lazy(data.LINGYU).each(function(ly){
          //              var qxIds = Lazy(quanxianDist[parseInt(ly.LINGYU_ID)]).map(function(qx){ return qx.QUANXIAN_ID; }).toArray();
          //              ly.quanxian = qxIds;
          //            });
          //            if(Lazy(jsArr).contains("1")){
          //              urlRedirect.goTo(currentPath, profileUrl);
          //            }
          //            else{
          //              // 查询用户权限的代码，用来导航，如果权限中包含QUANXIAN_ID包含4就导向审核页面，否则去相对应的页面
          //              var permissions = data.QUANXIAN,
          //                find_QUANXIAN_ID_4, find_QUANXIAN_ID_5,
          //                quanxianArr = [],
          //                urlShowAndHideArr = [],
          //                jsUrl = '';
          //              find_QUANXIAN_ID_4 = Lazy(permissions).find(function(permission) {
          //                return permission.QUANXIAN_ID == 2004;
          //              });
          //              find_QUANXIAN_ID_5 = Lazy(permissions).find(function(permission) {
          //                return permission.QUANXIAN_ID == 2005;
          //              });
          //              if(find_QUANXIAN_ID_4 || find_QUANXIAN_ID_5) {
          //                urlRedirect.goTo(currentPath, profileUrl);
          //              }
          //              else {
          //                if(data.LINGYU.length == 1){
          //                  session.defaultLyId = data.LINGYU[0].LINGYU_ID;
          //                  session.defaultLyName = data.LINGYU[0].LINGYUMINGCHENG;
          //                  session.defaultTiKuLyId = data.LINGYU[0].PARENT_LINGYU_ID;
          //                  quanxianArr = Lazy(quanxianDist[parseInt(data.LINGYU[0].LINGYU_ID)]).map(function(qx){
          //                    return qx.QUANXIAN_ID;
          //                  }).toArray();
          //                  quanxianArr = Lazy(quanxianArr).uniq().toArray();
          //                  //存放权限id的cookies
          //                  var quanXianCookie = {
          //                      quanXianId: quanxianArr
          //                    },
          //                    tiKuCookie = {
          //                      tkLingYuId: data.LINGYU[0].PARENT_LINGYU_ID
          //                    };
          //                  $cookieStore.put('quanXianCk', quanXianCookie);
          //                  $cookieStore.put('tiKuCk', tiKuCookie);
          //                  //根据角色判断要显示的模块
          //                  Lazy(config.quanxianObj).each(function(qx, idx, lst){
          //                    var navName = Lazy(qx.jsArr).intersection(jsArr).toArray().length;
          //                    var urlObj = {
          //                      myUrl: '',
          //                      urlName: ''
          //                    };
          //                    //显示和隐藏url
          //                    if(navName > 0){
          //                      urlShowAndHideArr.push(qx.navName);
          //                      urlObj.myUrl = qx.navName;
          //                      urlObj.urlName = qx.hanName;
          //                      urlArr.push(urlObj);
          //                    }
          //                  });
          //                  //默认url
          //                  if(urlShowAndHideArr && urlShowAndHideArr.length > 0){
          //                    $rootScope.urlArrs = urlArr;
          //                    //jsUrl = '/' + urlShowAndHideArr[0];
          //                    var keMuManage = Lazy(quanxianArr).contains('2032'); //判断科目负责人
          //                    var hasMingTiUrl = Lazy(urlShowAndHideArr).contains('mingti');//判断有没有命题模块
          //                    if(keMuManage && hasMingTiUrl){
          //                      jsUrl = '/mingti';
          //                    }
          //                    else{
          //                      jsUrl = '/' + urlShowAndHideArr[0];
          //                    }
          //                  }
          //                  session.quanxianStr = urlShowAndHideArr.join();
          //                  urlRedirect.goTo(currentPath, jsUrl);
          //                }
          //                else{
          //                  urlRedirect.goTo(currentPath, '/lingyu');
          //                }
          //              }
          //            }
          //            //cookies代码
          //            userCookie = {
          //              UID: $rootScope.session.info.UID,
          //              XINGMING: $rootScope.session.info.XINGMING,
          //              defaultLyId: session.defaultLyId,
          //              defaultLyName: session.defaultLyName,
          //              quanxianStr: session.quanxianStr,
          //              JIGOU: session.userInfo.JIGOU,
          //              JUESE: jsArr
          //            };
          //            lingyuCookie = {
          //              lingyu: data.LINGYU
          //            };
          //            myUrlCookie = {
          //              myUrl: $rootScope.urlArrs
          //            };
          //            $cookieStore.put('logged', userCookie);
          //            $cookieStore.put('lingyuCk', lingyuCookie);
          //            $cookieStore.put('myUrlCk', myUrlCookie);
          //          }
          //          else{
          //            DataService.alertInfFun('pmt', '您注册的信息正在审核中，新耐心等待……');
          //          }
          //        }
          //        else{
          //          if(data.YONGHULEIBIE == 2){
          //            var urlObj1 = {
          //              myUrl: 'baoming',
          //              urlName: '报名'
          //            };
          //            var urlObj2 = {
          //              myUrl: 'chengji',
          //              urlName: '成绩'
          //            };
          //            var urlObj3 = {
          //              myUrl: 'weiluke',
          //              urlName: '录课'
          //            };
          //            //var findNongDa = JSON.parse(result[0].JIGOU);
          //            //var findNongDaIn = Lazy(findNongDa).find(function(jd){ return jd.JIGOU_ID == 1003; });
          //            //if(!findNongDaIn){
          //            //  urlArr.push(urlObj2);
          //            //}
          //            urlArr.push(urlObj1);
          //            urlArr.push(urlObj2);
          //            urlArr.push(urlObj3);
          //            $rootScope.urlArrs = urlArr;
          //            //cookies代码
          //            userCookie = {
          //              UID: $rootScope.session.info.UID,
          //              XINGMING: $rootScope.session.info.XINGMING,
          //              defaultLyId: session.defaultLyId,
          //              defaultLyName: session.defaultLyName,
          //              quanxianStr: session.quanxianStr,
          //              JIGOU: JSON.parse(session.info.JIGOU)[0].JIGOU_ID,
          //              JUESE: jsArr,
          //              xuehao: session.info.YONGHUHAO
          //            };
          //            lingyuCookie = {
          //              lingyu: data.LINGYU
          //            };
          //            myUrlCookie = {
          //              myUrl: $rootScope.urlArrs
          //            };
          //            $cookieStore.put('logged', userCookie);
          //            $cookieStore.put('lingyuCk', lingyuCookie);
          //            $cookieStore.put('myUrlCk', myUrlCookie);
          //            urlRedirect.goTo(currentPath, '/baoming');
          //          }
          //          else{
          //            $scope.dengluInfo = false;
          //            DataService.alertInfFun('pmt', '您注册的信息正在审核中，新耐心等待……');
          //          }
          //        }
          //      });
          //    }
          //    else{
          //      $scope.dengluInfo = true;
          //    }
          //  });
          //}
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
