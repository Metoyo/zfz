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
              urlRedirect.goTo($location.$$path, '/renzheng');
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
              else{
                daanArr = daanStr;
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
                if(findDaAn){
                  if (typeof(findDaAn) == 'string') {
                    findDaAn = JSON.parse(findDaAn);
                  }
                  if(findDaAn['答题方式'] == 2){
                    xhStr = '<span class="ar-tk-da"><img src="' + findDaAn['用户答案'] + '"/></span>';
                  }
                  else{
                    xhStr = '<span class="ar-tk-da">' + findDaAn['用户答案'] + '</span>';
                  }
                }
                else{
                  xhStr = '<span class="ar-tk-da">' + '           ' + '</span>';
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
                if(bdDaObj){
                  jstKsFinalDaAn.push('<img src="' + bdDaObj['用户答案'] + '"/>');
                }
              }
              tm['考生作答']['考生答案'] = jstKsFinalDaAn.join(' ');
            }
          }
          return tm;
        };

        //中文排序
        this.cnSort = function(data, par){
          return data.sort(function(a,b){
            if(a[par] && b[par]){
              return a[par].localeCompare(b[par]);
            }
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

        //清除上传控件里面的文件
        this.clearInput = function(){
          var file = document.getElementById('fileUpload');
          if (file.outerHTML) {
            file.outerHTML = file.outerHTML;
          }
          else { // FF(包括3.5)
            file.value = "";
          }
        };

        //检查对象里面是否有某一属性
        this.objHasProp = function(obj){
          if (typeof obj === "object" && !(obj instanceof Array)){
            var hasProp = false;
            for (var prop in obj){
              hasProp = true;
              break;
            }
            return hasProp;
          }
        };

      }]);
});
