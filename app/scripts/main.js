/*jshint unused: vars */
require.config({
  paths: {
    angular: '../../bower_components/angular/angular',
    'angular-cookies': '../../bower_components/angular-cookies/angular-cookies',
    'angular-resource': '../../bower_components/angular-resource/angular-resource',
    'angular-route': '../../bower_components/angular-route/angular-route',
    'angular-sanitize': '../../bower_components/angular-sanitize/angular-sanitize',
    jquery: '../../bower_components/jquery/dist/jquery.min',
    charts: '../../bower_components/echarts/echarts-plain',
    bootstrap: '../../bower_components/bootstrap/dist/js/bootstrap',
    markitup: '../../bower_components/markitup/jquery.markitup-1.1.14.min',
    setJs: '../../bower_components/markitup/set.min',
    mathjax: '../../bower_components/markitup/MathJax.js?config=TeX-AMS_HTML-full',
    datepicker: '../../bower_components/intimidatetime/intimidatetime',
    lazy: '../../bower_components/lazy.js/lazy',
    polyv: '../../bower_components/polyv/polyvplayer_v2.0.min'
  },
  shim: {
    angular: {
      exports: 'angular'
    },
    'angular-route': [
      'angular'
    ],
    'angular-cookies': [
      'angular'
    ],
    'angular-sanitize': [
      'angular'
    ],
    'angular-resource': [
      'angular'
    ],
    jquery: {
      exports: 'jquery'
    },
    markitup: {
      deps: [
        'jquery'
      ],
      exports: 'markitup'
    },
    setJs: {
      deps: [
        'markitup'
      ],
      exports: 'setJs'
    },
    charts: {
      exports: 'charts'
    },
    mathjax: {
      exports: 'mathjax'
    },
    datepicker: {
      deps: [
        'jquery'
      ],
      exports: 'datepicker'
    },
    lazy: {
      exports: 'lazy'
    },
    polyv: {
      exports: 'polyv'
    }
  },
  priority: [
    'angular'
  ],
  packages: [

  ],
  waitSeconds: 15
});
//http://code.angularjs.org/1.2.1/docs/guide/bootstrap#overview_deferred-bootstrap
window.name = 'NG_DEFER_BOOTSTRAP!';
require([
  'angular',
  'app',
  'angular-route',
  'angular-cookies',
  'angular-sanitize',
  'angular-resource',
  'lazy'
], function(angular, app, ngRoutes, ngCookies, ngSanitize, ngResource, lazy) {
  //angular, app, ngRoutes, ngCookies, ngSanitize, ngResource, $, _
  'use strict';
  /* jshint ignore:start */
  var $html = angular.element(document.getElementsByTagName('html')[0]);
  /* jshint ignore:end */
  /**
   * 给每个链接添加点击事件， 如果该链接指向的地址是本服务器的地址， 则判断是否属于angular.js app已经定义的路由链接，
   * 如果是则使用angular.js的导航，如果不是则使用浏览器默认处理方式
   */
  app.directive('a', ['$rootScope', '$location', '$route', function($rootScope, $location, $route) {
    return {
      restrict: 'E',
      link: function(scope, elem, attrs) {
        elem.on('click', function(e) {
          var href = attrs.href;
          if(href.indexOf('/') === 0) {
            var findRoute = Lazy($route.routes).find(function(route){
                if(route.regexp.test(href)) {
                  return true;
                }
                return false;
            });
            if(findRoute) {
              e.preventDefault();
              $location.path(href);
              $rootScope.$apply();
            }
          }
        });
      }
    };
  }]);

  angular.element().ready(function() {
    angular.resumeBootstrap([app.name]);
  });
});
