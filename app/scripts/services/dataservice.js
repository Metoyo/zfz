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
        }
        else{
          alertFun(a, '没有符合的数据！');
        }
      };

      //查询数据，GET方法
      this.getData = function(url){
        var deferred = $q.defer();
        $http.get(url).success(function(data){
          if(data && data.length > 0 ){
            deferred.resolve(data);
          }
          else{
            console.log(data.error);
            alertFun('err', data.error || '没有符合的数据！');
            deferred.reject(data.error);
          }
        });
        return deferred.promise;
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
            //$cookieStore.remove('quanXianCk');
            config.userJs = '';
            $rootScope.loginUsr = '';
            urlRedirect.goTo($location.$$path, '/renzheng');
          }
          else{
            alertFun('err', data.error);
          }
        });
      };

      //题目题干答案格式化
      var letterArr = config.letterArr,
        newCont,
        daAnFormatReg = new RegExp('<\%{.*?}\%>', 'g');
      this.formatDaAn = function(tm){
        if(tm.TIXING_ID <= 3){
          var daanArr = tm.DAAN.split(','),
            daanLen = daanArr.length,
            daan = [];
          for(var i = 0; i < daanLen; i++){
            daan.push(letterArr[daanArr[i]]);
          }
          tm.DAAN = daan.join(',');
        }
        else if(tm.TIXING_ID == 4){
          if(tm.DAAN == 1){
            tm.DAAN = '对';
          }
          else{
            tm.DAAN = '错';
          }
        }
        else if(tm.TIXING_ID == 6 || tm.TIXING_ID == 19){ //填空题
          //修改填空题的答案
          var tkDaAnArr = [],
            tkDaAn = JSON.parse(tm.DAAN),
            tkDaAnStr;
          Lazy(tkDaAn).each(function(da, idx, lst){
            tkDaAnArr.push('第' + (idx + 1) + '个空：' + da.answer);
          });
          tkDaAnStr = tkDaAnArr.join(';');
          tm.DAAN = tkDaAnStr;
          //修改填空题的题干
          if(tm.KAOSHENGDAAN){
            var tkKsDa = tm.KAOSHENGDAAN,
              finalDaAn = [],
              _len = '',
              count = 0;
            if(typeof(tkKsDa) == 'string'){
              tkKsDa = JSON.parse(tkKsDa);
            }
            for(var key in tkKsDa){
              finalDaAn.push(tkKsDa[key]);
            }
            _len = finalDaAn.length;
            newCont = tm.TIGAN.tiGan.replace(daAnFormatReg, function(arg) {
              var xhStr = '';
              if(tm.TIXING_ID == 6){
                xhStr = '<span class="ar-tk-da">' + finalDaAn[count] + '</span>';
              }
              else{
                xhStr = '<span class="ar-tk-da">' + '        ' + '</span>';
              }
              count ++;
              return xhStr;
            });
          }
          else{
            newCont = tm.TIGAN.tiGan.replace(daAnFormatReg, function(arg) {
              var text = arg.slice(2, -2),
                textJson = JSON.parse(text),
                _len = textJson.size,
                i, xhStr = '';
              for(i = 0; i < _len; i ++ ){
                xhStr += '_';
              }
              return xhStr;
            });
          }
          tm.TIGAN.tiGan = newCont;
        }
        else{

        }
        //作答重现的答案处理
        if(tm.KAOSHENGDAAN){
          if(tm.TIXING_ID <= 3){
            var ksDaanArr = tm.KAOSHENGDAAN.split(','),
              ksDaanLen = ksDaanArr.length,
              ksDaan = [];
            for(var j = 0; j < ksDaanLen; j++){
              ksDaan.push(letterArr[ksDaanArr[j]]);
              //ksDaan.push('D');
            }
            tm.KAOSHENGDAAN = ksDaan.join(',');
          }
          else if(tm.TIXING_ID == 4){
            if(tm.KAOSHENGDAAN == 1){
              tm.KAOSHENGDAAN = '对';
            }
            else{
              tm.KAOSHENGDAAN = '错';
            }
          }
          //else if(tm.TIXING_ID == 6) { //填空题
          //  var tkKsDa = tm.KAOSHENGDAAN, cont = 1,
          //    finalDaAn = [];
          //  if(typeof(tkKsDa) == 'string'){
          //    tkKsDa = JSON.parse(tkKsDa);
          //  }
          //  for(var key in tkKsDa){
          //    finalDaAn.push('第' + cont + '个空：' + tkKsDa[key]);
          //    cont ++;
          //  }
          //  tm.KAOSHENGDAAN = finalDaAn.join(';');
          //}
          else if(tm.TIXING_ID >= 9) {
            var jstKsDa = tm.KAOSHENGDAAN,
              jstKsFinalDaAn = [];
            if(typeof(jstKsDa) == 'string'){
              jstKsDa = JSON.parse(jstKsDa);
            }
            for(var key in jstKsDa){
              jstKsFinalDaAn.push('<img src="' + jstKsDa[key] + '"/>');
            }
            tm.KAOSHENGDAAN = jstKsFinalDaAn.join(' ');
          }
          else{

          }
        }
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

      /**
       * 报名的日期格式化
       */
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
