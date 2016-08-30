define(['angular'], function (angular) {
  'use strict';

  angular.module('zhifzApp.filters.Localdate', [])
  	.filter('localDate', function () {
      return function (dateStr, type) {
        var difMinutes, difMilliseconds;
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
        else if(type == 'ww'){ //返回带星期的日期
          if(dateStr){
            var mydateOld = new Date(dateStr);
              difMinutes = mydateOld.getTimezoneOffset(); //与本地相差的分钟数
              difMilliseconds = mydateOld.valueOf() - difMinutes * 60 * 1000; //与本地相差的毫秒数
            var mydateNew = new Date(difMilliseconds);
            var year = mydateNew.getUTCFullYear(); //根据世界时从 Date 对象返回四位数的年份
            var month = mydateNew.getUTCMonth() + 1; //根据世界时从 Date 对象返回月份 (0 ~ 11)
            var day = mydateNew.getUTCDate(); //根据世界时从 Date 对象返回月中的一天 (1 ~ 31)
            var week = mydateNew.getUTCDay(); //根据世界时从 Date 对象返回周中的一天 (0 ~ 6)
            var hour = mydateNew.getUTCHours(); //根据世界时返回 Date 对象的小时 (0 ~ 23)
            var minute = mydateNew.getUTCMinutes(); //根据世界时返回 Date 对象的分钟 (0 ~ 59)
            var joinDate; //返回最终时间
            var weekday = new Array(7); //定义一个星期的数组
            weekday[0] = "星期日";
            weekday[1] = "星期一";
            weekday[2] = "星期二";
            weekday[3] = "星期三";
            weekday[4] = "星期四";
            weekday[5] = "星期五";
            weekday[6] = "星期六";
            if(month < 10){
              month = '0' + month;
            }
            if(day < 10){
              day = '0' + day;
            }
            if(hour < 10){
              hour = '0' + hour;
            }
            if(minute < 10){
              minute = '0' + minute;
            }
            joinDate = year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ' ' + weekday[week];
            return joinDate;
          }
          else{
            return '';
          }
        }
        else{
          var mydate;
          if(dateStr){
            mydate = new Date(dateStr);
            difMinutes = mydate.getTimezoneOffset(); //与本地相差的分钟数
            //difMilliseconds = mydate.valueOf() - difMinutes * 60 * 1000; //与本地相差的毫秒数
            difMilliseconds = mydate.valueOf(); //与本地相差的毫秒数
          }
          else{
            difMilliseconds = '';
          }
          return difMilliseconds;
        }
      };
  	});
});
