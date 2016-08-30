define(['angular', 'jquery'], function (angular, $) {
  'use strict';

  angular.module('zhifzApp.directives.Hoverslide', [])
  	.directive('hoverSlide', function ($timeout) {
      return {
        restrict: 'A',
        link: function postLink(scope, element, attrs) {
          var slideTarget = '.' + attrs.hoverSlideTarget;
          var slideGetval = '.' + attrs.hoverSlideGetval;
          var slideSetval = '.' + attrs.hoverSlideSetval;
          var timeOut;
          var targetOn = '.' + element.attr('class');
          $(targetOn).hover(
            function () {
              var cont = element.find(slideGetval).val();
              timeOut = $timeout(function(){
                $(slideSetval).html(cont);
                $(slideTarget).show();
              }, 500);
            },
            function () {
              $timeout.cancel(timeOut);
              $(slideTarget).hide();
              $(slideSetval).html('');
            }
          );
        }
      };
  	});
});
