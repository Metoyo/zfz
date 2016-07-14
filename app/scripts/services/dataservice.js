define(['angular', 'config', 'jquery', 'lazy'], function (angular, config, $, lazy) {
  'use strict';
  /**
   * @ngdoc service
   * @name tatApp.DataService
   * @description
   * # DataService
   * Service in the tatApp.
   */
  angular.module('zhifzApp.services.DataService', [])
	.service('DataService', ['$rootScope', '$location', 'urlRedirect', '$cookieStore', '$timeout', '$http', '$q',
    function ($rootScope, $location, urlRedirect, $cookieStore, $timeout, $http, $q) {
      //提示信息
      function alertFun(megKind, cont){
        $('.messageTd').css('display', 'none').html('');
        if(megKind == 'err'){
          $('.mesError').css('display', 'block').html(cont);
        }
        if(megKind == 'suc'){
          $('.mesSuccess').css('display', 'block').html(cont);
        }
        if(megKind == 'pmt'){
          $('.mesPrompt').css('display', 'block').html(cont);
        }
        $('.popInfoWrap').css('display', 'block');
        var fadeOutFun = function(){
          $('.popInfoWrap').fadeOut(1000);
        };
        $timeout(fadeOutFun, 1000);
      }
      this.alertInfFun = function(a, b){
        if(b){
          alertFun(a, b);
          if(b == '请先登录！'){
            var currentPath = $location.$$path;
            urlRedirect.goTo(currentPath, '/renzheng');
          }
        }
        else{
          alertFun(a, '没有符合的数据！');
        }
      };

      //修改试题，点击编辑器，内容立刻预览 题干
      this.tiMuContPreview = function(tgCont){
        var tgCont = $('.formulaEditTiGan').val() || tgCont;
        if(tgCont){
          tgCont = tgCont.replace(/\n/g, '<br/>');
          $('#prevDoc').html(tgCont);
          MathJax.Hub.Queue(["Typeset", MathJax.Hub, "prevDoc"]);
        }
      };

      //修改试题，点击编辑器，内容立刻预览 题支
      this.tiZhiContPreview = function(){
        var tzCont = $('.formulaEditTiZhi').val();
        if(tzCont){
          tzCont = tzCont.replace(/\n/g, '<br/>');
          $('#prevTiZhiDoc').html(tzCont);
          MathJax.Hub.Queue(["Typeset", MathJax.Hub, "prevTiZhiDoc"]);
        }
      };

      //退出登录
      this.logout = function(){
        var paramUrl = '/logout';
        $http.get(paramUrl).success(function(data){
          if(data.result){
            delete $rootScope.session;
            $cookieStore.remove('ckUrl');
            $cookieStore.remove('ckKeMu');
            $cookieStore.remove('ckUsr');
            $cookieStore.remove('ckJs');
            config.loginUsr = '';
            urlRedirect.goTo($location.$$path, '/renzheng');
          }
          else{
            alertFun('err', data.error);
          }
        });
      };

      //题目题干答案格式化
      this.formatDaAn = function(tm){
        var letterArr = config.letterArr;
        if(tm['题型ID'] <= 2){ //修改选择题答案
          var daanStr = tm['题目内容']['答案'];
          var tzStr = tm['题目内容']['选项'];
          var daan = [];
          if(tm['题型ID'] == 1){
            daan.push(letterArr[daanStr]);
          }
          else{
            var daanArr = [];
            if(daanStr && typeof(daanStr) == 'string'){
              daanArr = JSON.parse(daanStr);
            }
            var daanLen = daanArr.length || 0;
            for(var i = 0; i < daanLen; i++){
              daan.push(letterArr[daanArr[i]]);
            }
          }
          tm['题目内容']['答案'] = daan.join(',');
          if(tzStr && typeof(tzStr) == 'string'){
            tm['题目内容']['选项'] = JSON.parse(tzStr);
          }
        }
        if(tm['题型ID'] == 3){ //修改判断题答案
          tm['题目内容']['答案'] = tm['题目内容']['答案'] ? '对' : '错';
        }
        if(tm['题型ID'] == 4){ //修改填空题的答案
          var tkTgStr = tm['题目内容']['题干'];
          var daAnFormatReg = new RegExp('<\%{.*?}\%>', 'g');
          var count = 1;
          var daAnArr = [];
          tm['题目内容']['原始答案'] = angular.copy(tm['题目内容']['答案']);
          tm['题目内容']['原始题干'] = angular.copy(tm['题目内容']['题干']);
          tm['题目内容']['题干'] = tkTgStr.replace(daAnFormatReg, function(arg) {
            var xhStr = '';
            if(tm['考生作答']){ //作答重现
              var tkKsDa = tm['考生作答']['考生答案'];
              if (typeof(tkKsDa) == 'string') {
                tkKsDa = JSON.parse(tkKsDa);
              }
              var findDaAn = tkKsDa[count - 1];
              if (typeof(findDaAn) == 'string') {
                findDaAn = JSON.parse(findDaAn);
              }
              if(findDaAn['答题方式'] == 2){
                xhStr = '<span class="ar-tk-da"><img src="' + findDaAn['用户答案'] + '"/></span>';
              }
              else{
                xhStr = '<span class="ar-tk-da">' + findDaAn['用户答案'] + '</span>';
              }
              count ++;
              return xhStr;
            }
            else{ //题目展示
              var text = arg.slice(2, -2);
              var textJson = JSON.parse(text);
              var _len = textJson['尺寸'];
              for(var i = 0; i < _len; i ++ ){
                xhStr += '_';
              }
              count ++;
              return xhStr;
            }
          });
          Lazy(tm['题目内容']['答案']).each(function(da){
            var tmp = '第' + (da['序号'] + 1) + '空：' + da['答案'].join('，');
            daAnArr.push(tmp);
          });
          tm['题目内容']['答案'] = daAnArr.join('；');
        }
        if(tm['考生作答']){
          if(tm['考生作答']['阅卷'] && tm['考生作答']['阅卷'].length > 0){
            tm['考生作答']['阅卷教师'] = Lazy(tm['考生作答']['阅卷']).map(function(yj){
              return yj['评分教师姓名'];
            }).join(',');
          }
          if(tm['题型ID'] == 2){

          }
          if(tm['题型ID'] >= 5){
            var jstKsDa = tm['考生作答']['考生答案'];
            var jstKsFinalDaAn = [];
            if(typeof(jstKsDa) == 'string'){
              jstKsDa = JSON.parse(jstKsDa);
            }
            for(var key in jstKsDa){
              var bdDaObj = '';
              if(typeof(jstKsDa[key]) == 'string'){
                bdDaObj = JSON.parse(jstKsDa[key]);
              }
              else{
                bdDaObj = jstKsDa[key];
              }
              jstKsFinalDaAn.push('<img src="' + bdDaObj['用户答案'] + '"/>');
            }
            tm['考生作答']['考生答案'] = jstKsFinalDaAn.join(' ');
          }
        }
        return tm;
      };

      //文件上传
      this.uploadFileAndFieldsToUrl = function(file, fields, uploadUrl){
        var fd = new FormData();
        for(var j = 1; j <= file.length; j++){
          fd.append('file' + j, file[j - 1]);
        }
        for(var i = 0; i < fields.length; i++){
          fd.append(fields[i].name, fields[i].data)
        }
        return $http.post(uploadUrl, fd, {
          transformRequest: angular.identity,
          headers: {'Content-Type': undefined}
        })
          .success(function(data){
            return data;
          })
          .error(function(error){
            return error;
          });
      };

      //格式化时间
      this.formatDateZh = function(dateStr){ //转换为中国
        var mydateNew = new Date(dateStr),
          year = mydateNew.getFullYear(), //根据世界时从 Date 对象返回四位数的年份
          month = mydateNew.getMonth() + 1, //根据世界时从 Date 对象返回月份 (0 ~ 11)
          day = mydateNew.getDate(), //根据世界时从 Date 对象返回月中的一天 (1 ~ 31)
          hour = mydateNew.getHours(), //根据世界时返回 Date 对象的小时 (0 ~ 23)
          minute = mydateNew.getMinutes(), //根据世界时返回 Date 对象的分钟 (0 ~ 59)
          joinDate; //返回最终时间
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
        joinDate = year + '-' + month + '-' + day + ' ' + hour + ':' + minute;
        return joinDate;
      };

      //格式化时间，世界时间
      this.formatDateUtc = function(dateStr){ //转换为中国
        var mydateNew = new Date(dateStr),
          year = mydateNew.getUTCFullYear(), //根据世界时从 Date 对象返回四位数的年份
          month = mydateNew.getUTCMonth() + 1, //根据世界时从 Date 对象返回月份 (0 ~ 11)
          day = mydateNew.getUTCDate(), //根据世界时从 Date 对象返回月中的一天 (1 ~ 31)
          hour = mydateNew.getUTCHours(), //根据世界时返回 Date 对象的小时 (0 ~ 23)
          minute = mydateNew.getUTCMinutes(), //根据世界时返回 Date 对象的分钟 (0 ~ 59)
          joinDate; //返回最终时间
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
        joinDate = year + '-' + month + '-' + day + ' ' + hour + ':' + minute;
        return joinDate;
      };

      //报名的日期格式化
      this.baoMingDateFormat = function(dataBegin, dataEnd){
        if(dataBegin && dataEnd){
          var bgDataNew = new Date(dataBegin),
            edDataNew = new Date(dataEnd),
            bgYear = bgDataNew.getUTCFullYear(), //根据世界时从 Date 对象返回四位数的年份
            bgMonth = bgDataNew.getUTCMonth() + 1, //根据世界时从 Date 对象返回月份 (0 ~ 11)
            bgDay = bgDataNew.getUTCDate(), //根据世界时从 Date 对象返回月中的一天 (1 ~ 31)
            bgWeek = bgDataNew.getUTCDay(), //根据世界时从 Date 对象返回周中的一天 (0 ~ 6)
            bgHour = bgDataNew.getUTCHours(), //根据世界时返回 Date 对象的小时 (0 ~ 23)
            bgMinute = bgDataNew.getUTCMinutes(), //根据世界时返回 Date 对象的分钟 (0 ~ 59)
            edHour = edDataNew.getUTCHours(),
            edMinute = edDataNew.getUTCMinutes(),
            joinDate, //返回最终时间
            weekday = new Array(7); //定义一个星期的数组
          weekday[0] = "星期日";
          weekday[1] = "星期一";
          weekday[2] = "星期二";
          weekday[3] = "星期三";
          weekday[4] = "星期四";
          weekday[5] = "星期五";
          weekday[6] = "星期六";
          if(bgMonth < 10){
            bgMonth = '0' + bgMonth;
          }
          if(bgDay < 10){
            bgDay = '0' + bgDay;
          }
          if(bgHour < 10){
            bgHour = '0' + bgHour;
          }
          if(bgMinute < 10){
            bgMinute = '0' + bgMinute;
          }
          if(edHour < 10){
            edHour = '0' + edHour;
          }
          if(edMinute < 10){
            edMinute = '0' + edMinute;
          }
          joinDate = bgYear + '-' + bgMonth + '-' + bgDay + ' ' + weekday[bgWeek] + ' ' + bgHour + ':' + bgMinute
          + '—' + edHour + ':' + edMinute;
          return joinDate;
        }
        else{
          return '';
        }
      };

	}]);
});
