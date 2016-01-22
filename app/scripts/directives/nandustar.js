define(['angular', 'jquery'], function (angular, $) {
  'use strict';
  angular.module('zhifzApp.directives.Nandustar', [])
    .directive('nanduStar', function () {
      return {
        restrict: 'A',
        link: function postLink(scope, element, attrs) {
          var targetClass = '.' + attrs.class,
            targetSlt = $(targetClass),
            targetA = targetSlt.find('a'),
            nanduTarget = element.find('input'),
            hoverIdx, hoverCss, clickCss;
          targetA.hover(function(){
            hoverIdx = $(this).index() + 1;
            hoverCss = 'starHover' + hoverIdx;
            targetSlt.addClass(hoverCss);
            targetSlt.removeClass(clickCss);
            $(this).click(function(){
              for(var i = 1; i <= 5; i++){
                var rmCss = 'starClick' + i;
                targetSlt.removeClass(rmCss);
              }
              clickCss = 'starClick' + hoverIdx;
              targetSlt.addClass(clickCss);
              nanduTarget.val(clickCss.slice(-1));
            });
          },function(){
            targetSlt.removeClass(hoverCss);
            targetSlt.addClass(clickCss);
          });
        }
      };
    });
});
