define(['angular'], function (angular) {
  'use strict';

  angular.module('zhifzApp.filters.Localdate', [])
  	.filter('localDate', function () {
      return function (dateStr, type) {
        if(type == 'vd'){
          var sc = parseInt(dateStr), h, m, s, scNew = '';
          h = Math.floor(sc/3600); //小时
          m = Math.floor((sc%3600)/60);
          s = (sc%3600)%60;
          if(h > 0){
            scNew += h + ':';
          }
          scNew += (m > 10 ? m : '0' + m) + ':';
          scNew += s > 10 ? s : '0' + s;
          return scNew;
        }
        else{
          var mydate, difMinutes, difMilliseconds;
          if(dateStr){
            mydate = new Date(dateStr);
            difMinutes = mydate.getTimezoneOffset(); //与本地相差的分钟数
            difMilliseconds = mydate.valueOf() + difMinutes * 60 * 1000; //与本地相差的毫秒数
          }
          else{
            difMilliseconds = '';
          }
          return difMilliseconds;
        }
      };
  	});
});
