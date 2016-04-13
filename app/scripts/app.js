/*jshint unused: vars */
define([
  'angular',
  'config',
  'lazy',
  'services/urlredirect',
  'controllers/renzheng',
  'controllers/nav',
  'controllers/mingti',
  'controllers/dagang',
  'controllers/user',
  'controllers/register',
  'controllers/zujuan',
  'controllers/kaowu',
  'controllers/tongji',
  'controllers/student',
  'controllers/guanli',
  'filters/mylocaldate',
  'filters/mylocaldatewithweek',
  'filters/examstatus',
  'filters/outtigan',
  'directives/nandustar',
  'directives/passwordverify',
  'directives/bnslideshow',
  'directives/hoverslide',
  'directives/fileupload',
  'directives/repeatdone',
  'services/dataservice'
], function (angular, config, lazy, UrlredirectService, RenzhengCtrl, NavCtrl, MingtiCtrl, DagangCtrl, UserCtrl, RegisterCtrl,
             ZujuanCtrl, KaowuCtrl, TongjiCtrl, StudentCtrl, GuanLiCtrl, MylocaldateFilter, MylocaldatewithweekFilter,
             ExamstatusFilter, OuttiganFilter, NandustarDirective, PasswordverifyDirective, BnslideshowDirective,
             HoverslideDirective, FileuploadDirective, RepeatdoneDirective, DataServiceService) {
  'use strict';
  return angular.module('zhifzApp', [
    'zhifzApp.controllers.RenzhengCtrl',
    'zhifzApp.controllers.NavCtrl',
    'zhifzApp.services.Urlredirect',
    'zhifzApp.controllers.MingtiCtrl',
    'zhifzApp.controllers.DagangCtrl',
    'zhifzApp.controllers.UserCtrl',
    'zhifzApp.controllers.RegisterCtrl',
    'zhifzApp.controllers.ZujuanCtrl',
    'zhifzApp.controllers.KaowuCtrl',
    'zhifzApp.controllers.TongjiCtrl',
    'zhifzApp.controllers.StudentCtrl',
    'zhifzApp.controllers.GuanLiCtrl',
    'zhifzApp.filters.Mylocaldate',
    'zhifzApp.filters.Mylocaldatewithweek',
    'zhifzApp.filters.Examstatus',
    'zhifzApp.filters.Outtigan',
    'zhifzApp.directives.Hoverslide',
    'zhifzApp.directives.Repeatdone',
    'zhifzApp.directives.Fileupload',
    'zhifzApp.directives.Bnslideshow',
    'zhifzApp.directives.Nandustar',
    'zhifzApp.directives.Passwordverify',
    'zhifzApp.services.DataService',
/*angJSDeps*/
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ngRoute'
  ])
    .config(['$routeProvider',
      function ($routeProvider) {
        var routes = config.routes;
        /**
         * 根据config文件中的路由配置信息加载本应用中要使用到的路由规则
         */
        for (var path in routes) {
          $routeProvider.when(path, routes[path]);
        }
        $routeProvider.otherwise({redirectTo: '/renzheng'});
      }])
    .run(['$rootScope', '$location', '$route', 'urlRedirect', '$cookieStore',
      function ($rootScope, $location, $route, urlRedirect, $cookieStore) {
        /**
         * 确保所有需要登陆才可以访问的链接进行用户登陆信息验证，如果没有登陆的话，则导向登陆界面
         */
        $rootScope.$on("$locationChangeStart", function (event, next, current) {
          var routes = config.routes;
          var nextUrlPattern;
          var nextRoute;
          var currentUrlParser = document.createElement('a'); // 使用浏览器内置的a标签进行url的解析判断
          var nextUrlParser = document.createElement('a');
          var nextPath;
          var currentPath;
          var urlArr = $cookieStore.get('ckUrl');
          var lgUsr = $cookieStore.get('ckUsr');
          var loginUsr = '';
          if(urlArr && urlArr.length > 0){
            $rootScope.urlArrs = JSON.parse(urlArr);
          }
          else{
            $rootScope.urlArrs = [];
          }
          if(lgUsr){
            loginUsr = JSON.parse(lgUsr);
          }
          //var session = {
          //    defaultLyId: '',
          //    defaultLyName: '',
          //    quanxianStr: '',
          //    info: {},
          //    userInfo: {}
          //  };
          //cookies 代码
          //$cookieStore.put('lastUrl', current);
          //var loggedInfo = $cookieStore.get('logged'),
          //  lastUrl = $cookieStore.get('lastUrl'),
          //  quanXianIds = $cookieStore.get('quanXianCk'),
          //  tiKuInfo = $cookieStore.get('tiKuCk'),
          //  isKeMuManage,
          //  myUrl = $cookieStore.get('myUrlCk');
          //$rootScope.urlArrs = myUrl.myUrl;
          //if (quanXianIds) {
          //  if (quanXianIds.quanXianId && quanXianIds.quanXianId.length > 0) {
          //    isKeMuManage = Lazy(quanXianIds.quanXianId).contains('2032');
          //  }
          //}
          //if (loggedInfo && loggedInfo.UID) {
          //  $rootScope.session = session;
          //  $rootScope.session.defaultLyId = loggedInfo.defaultLyId;
          //  $rootScope.session.defaultLyName = loggedInfo.defaultLyName;
          //  $rootScope.session.quanxianStr = loggedInfo.quanxianStr;
          //  $rootScope.session.info.UID = loggedInfo.UID;
          //  $rootScope.session.info.XINGMING = loggedInfo.XINGMING;
          //  $rootScope.session.userInfo.UID = loggedInfo.UID;
          //  $rootScope.session.userInfo.XINGMING = loggedInfo.XINGMING;
          //  $rootScope.session.userInfo.JIGOU = loggedInfo.JIGOU;
          //  $rootScope.session.userInfo.JUESE = loggedInfo.JUESE;
          //  $rootScope.session.userInfo.xuehao = loggedInfo.xuehao;
          //}
          //if (tiKuInfo && $rootScope.session) {
          //  $rootScope.session.defaultTiKuLyId = tiKuInfo.tkLingYuId;
          //}
          //if (isKeMuManage) { //判断科目负责人
          //  $rootScope.isPromiseAlterOthersTimu = true;
          //}
          //else {
          //  $rootScope.isPromiseAlterOthersTimu = false;
          //}
          currentUrlParser.href = current; // current为当前的url地址
          nextUrlParser.href = next; // next为即将要访问的url地址
          if (currentUrlParser.protocol === nextUrlParser.protocol && currentUrlParser.host === nextUrlParser.host) { // 确保current与next的url地址都是属于同一个网站的链接地址
            nextPath = nextUrlParser.hash.substr(1); // 因为我们使用的是hash即#开头的浏览器端路由， 在这儿解析的时候要去掉#
            /**
             * 测试即将要访问的路由是否已经在我们的angular.js程序中定义
             * @type {*|Mixed}
             */
            var findRoute = Lazy($route.routes).find(function (route, urlPattern) {
              if (route && route !== 'null' && route.regexp) { // 测试即将要访问的url是否否何定义的路由规则
                if (route.regexp.test(nextPath)) {
                  nextUrlPattern = urlPattern; // 记录即将要访问的路由模式，i.e: /user/:name
                  return true;
                }
              }
              return false;
            });
            if (findRoute) { // 如果在我们的路由表中已找到即将要访问的路由， 那么执行以下代码
              nextRoute = routes[nextUrlPattern]; // 找到即将要访问的路由的配置信息
              /**
               * 判断即将要访问的路由是否需要登陆验证， 并且确保如果当前用户没有登陆的话，将用户重定向至登陆界面
               */
              if (nextRoute && nextRoute.requireLogin && !(loginUsr['UID'] >= 0)) {
                event.preventDefault(); // 取消访问下一个路由地址
                currentPath = $location.$$path;
                urlRedirect.goTo(currentPath, '/renzheng');
              }
            }
          }
        });
      }]);
});
