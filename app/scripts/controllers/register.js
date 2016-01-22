define(['angular', 'config','jquery', 'lazy'], function (angular, config, $, lazy) {
  'use strict';

  angular.module('zhifzApp.controllers.RegisterCtrl', [])
    .controller('RegisterCtrl', ['$rootScope', '$scope', '$location', '$http', 'urlRedirect', 'DataService',
      function ($rootScope, $scope, $location, $http, urlRedirect, DataService) {

        var baseRzAPIUrl = config.apiurl_rz;
        var baseBmAPIUrl = config.apiurl_bm; //报名的api
        var token = config.token;
        var apiUrlLy = baseRzAPIUrl + 'lingYu?token=' + token + '&jigouid='; //lingYu 学科领域的api
        var apiLyKm = baseRzAPIUrl + 'lingYu?token=' + token + '&parentid='; //由lingYu id 的具体的学科
        var apiUrlJglb = baseRzAPIUrl + 'jiGou_LeiBie?token=' + token + '&leibieid=1,2'; //jiGouLeiBie 机构类别的api
        var apiUrlJueSe = baseRzAPIUrl + 'jueSe?token=' + token; //jueSe 查询科目权限的数据的api
        var jiGou_LeiBieUrl = baseRzAPIUrl + 'jiGou?token=' + token + '&leibieid='; //由机构类别查询机构的url
        var select_juese = []; //得到已选择的角色[{jigou: id, lingyu: id, juese: id}, {jigou: id, lingyu: id, juese: id}]
        var registerDate = {}; // 注册时用到的数据
        var jigouId; //所选的机构ID
        var registerUrl = baseRzAPIUrl + 'zhuce'; //提交注册信息的url
        var stuRegisterUrl = baseRzAPIUrl + 'stu_zhuce'; //提交学生注册信息的url
        var objAndRightList = []; //已经选择的科目和单位
        var checkUserUrlBase = baseRzAPIUrl + 'check_user?token=' + token; //检测用户是否存在的url
        var qryKaoShengBaseUrl = baseBmAPIUrl + 'chaxun_kaosheng?token=' + token; //检查考生是否在报名表里
        var checkStuInYhxxBaseUrl = baseRzAPIUrl + 'query_student?token=' + token + '&jigouid='; //检查考生是否在报名表里
        var delBlankReg = /\s/g; //去除空格的正则表达
        var checkUserData; //当输入学号和姓名后返回到用户信息表的数据
        var alterYongHu = baseRzAPIUrl + 'xiugai_yonghu';

        $scope.phoneRegexp = /^[1][3458][0-9]{9}$/; //验证手机的正则表达式
        $scope.emailRegexp = /[\w!#$%&'*+/=?^_`{|}~-]+(?:\.[\w!#$%&'*+/=?^_`{|}~-]+)*@(?:[\w](?:[\w-]*[\w])?\.)+[\w](?:[\w-]*[\w])?/; //验证邮箱的正则表达式
        $scope.xuHaoRegexp = /^.{4,30}$/;//用户名的正则表达式
        $scope.userNameRegexp = /^([a-zA-Z])([a-zA-Z0-9_]){3,29}$/;//用户名的正则表达式
        $scope.realNameRegexp = /(^[A-Za-z]{2,20}$)|(^[\u4E00-\u9FA5]{2,20}$)/;//真实姓名的正则表达式
        $scope.passwordRegexp = /^.{6,20}$/;//密码的正则表达式
        $scope.objectWrap = false;
        $scope.stepTwo = false; //第二步的显示和隐藏
        $scope.stepThree = false; //第三步的显示和隐藏
        $scope.stuRegisterInfo = { //学生注册信息
          jigouid: '',
          xuehao: '',
          xingming: '',
          youxiang: '',
          mima: ''
        };
        $scope.ifTheStuHasRegister = false;
        $scope.studentInfo = '';
        $scope.stuIfPswTheSame = false;
        $scope.jigou_list = '';

        /**
         * 注册信息的第一步，个人详情信息
         */
        $scope.personalInfo = {
          yonghuming: '',
          mima: '',
          youxiang: '',
          xingming: '',
          shouji: ''
        };
        registerDate = $scope.personalInfo;
        $scope.registerParam = {
          selectJiGouId: ''
        };
        $scope.stuRegisterInfo = {
          jigouid: '',
          xuehao: '',
          xingming: '',
          youxiang: '',
          mima: '',
          mima_verify: ''
        };

        /**
         * 检查输入的邮箱或者是用户名，在数据库中是否存在
         */
        $scope.checkUsrExist = function(nme, info){
          var checkUserUrl = checkUserUrlBase + '&' + nme + '=' + info;
          $http.get(checkUserUrl).success(function(data){
            if(nme == 'yonghuming'){
              if(data.result){
                $scope.yonghumingExist = true;
              }
              else{
                $scope.yonghumingExist = false;
              }
            }
            else{
              if(data.result){
                $scope.youxiangExist = true;
              }
              else{
                $scope.youxiangExist = false;
              }
            }
          });
        };

        /**
         * 检查密码是否一致
         */
        $scope.checkPassword = function(){
          var psw = $scope.personalInfo.mima,
            pswConfirm = $scope.personalInfo.mima_verify;
          if(pswConfirm){
            if(psw == pswConfirm){
              $scope.ifPswTheSame = false;
            }
            else{
              $scope.ifPswTheSame = true;
            }
          }
          else{
            $scope.ifPswTheSame = false;
          }
        };

        /**
         * 学生注册检查密码是否一致
         */
        $scope.stuCheckPassword = function(){
          var psw = $scope.stuRegisterInfo.mima,
            pswConfirm = $scope.stuRegisterInfo.mima_verify;
          if(pswConfirm){
            if(psw == pswConfirm){
              $scope.stuIfPswTheSame = false;
            }
            else{
              $scope.stuIfPswTheSame = true;
            }
          }
          else{
            $scope.stuIfPswTheSame = false;
          }
        };

        /**
         * 个人详情信息完整后，去第二步
         */
        $scope.validatePersonalInfo = function(){
          $scope.stepTwo = true;
          $('.nav-tabs li').removeClass('active').eq(1).addClass('active');
          $('.tab-pane').removeClass('active').eq(1).addClass('active');
        };

        /**
         /重新选择时，删除已选择的科目和角色
         */
        var deleteAllSelectedKmAndJs = function(){
          objAndRightList = [];
          $scope.objAndRight = objAndRightList;
          $scope.ifKuMuListNull = false;
        };

        /**
         * 查询机构类别
         */
        $http.get(apiUrlJglb).success(function(data) {
          $scope.jigoulb_list = [];
          if(data && data.length > 0){
            $scope.jigoulb_list = data;
          }
          else{
            DataService.alertInfFun('err', '没用相关机构！');
          }
        });

        /**
         * 由机构类别查询机构 getJgId
         */
        $scope.getJglist = function(jglbId){
          $scope.keMuListLengthExist = false;
          $scope.selected_jg = '';
          $scope.selected_ly = '';
          $http.get(jiGou_LeiBieUrl + jglbId).success(function(data) {
            if(data.length){
              $scope.jigou_list = data;
              $scope.lingyu_list = ''; //重置领域
            }
            else{
              $scope.jigou_list = '';
              $scope.lingyu_list = ''; //重置领域
              DataService.alertInfFun('err', '没有相关机构！');
            }
          });
        };
        $scope.getJglist(1);

        /**
         * 得到机构id
         */
        $scope.getJgId = function(jgId){
          $scope.keMuListLengthExist = false;
          $scope.lingyu_list = ''; //重置领域
          $scope.selected_ly = '';
          jigouId = jgId;
          registerDate.jiGouName = $(".subOrganization  option:selected").text();
          qryParentLingYu(jgId);
        };

        /**
         * 查询父领域的代码
         */
        var qryParentLingYu = function(jgId){
          $http.get(apiUrlLy + jgId).success(function(data) {
            if(data.length){
              $scope.lingyu_list = data;
            }
            else{
              $scope.lingyu_list = '';
              DataService.alertInfFun('err', '没有相关领域！');
            }
          });
        };

        /**
         * 有父领域查询子领域领域（即科目）
         */
        $scope.getKemuList = function(lyId){
          var qryLyKmUrl;
          if($scope.selected_jg){
            if(lyId){
              qryLyKmUrl = apiLyKm + lyId + '&jigouid=' + $scope.selected_jg;
              $http.get(qryLyKmUrl).success(function(data) {
                if(data.length){
                  $scope.kemu_list = data;
                  $scope.keMuSelectBox = true;
                  $scope.keMuListLengthExist = true;
                  deleteAllSelectedKmAndJs();
                }
                else{
                  $scope.kemu_list = '';
                  $scope.keMuSelectBox = false;
                  $scope.keMuListLengthExist = false;
                  DataService.alertInfFun('err', '没有对应的科目！');
                }
              });
            }
            else{
              $scope.kemu_list = '';
              $scope.keMuSelectBox = false;
              $scope.keMuListLengthExist = false;
            }
          }
          else{
            DataService.alertInfFun('pmt', '机构ID不能为空！');
          }
        };

        /**
         *  查询角色的代码
         */
        $http.get(apiUrlJueSe).success(function(data) {
          if(data && data.length > 0){
            $scope.juese_list = data;
          }
          else{
            DataService.alertInfFun('err', '没有对应的角色！');
          }
        });

        /**
         * 添加科目和权限
         */
        $scope.getObjectAndRight = function(){
          var objAndRightObj = {
            lingyu:'',
            juese:{
              jueseId: '',
              jueseName: ''
            }
          };
          objAndRightObj.lingyu = $scope.kemu_list.splice(selectedLingYuIndex, 1);
          objAndRightObj.juese.jueseId = selectJueseIdArr;
          objAndRightObj.juese.jueseName = selectJueseNameArr;
          objAndRightList.push(objAndRightObj);
          $scope.objAndRight = objAndRightList;
          $('input[name=rightName]:checked').prop('checked', false);
          $scope.jueseValue = false;
          $scope.linyuValue = false;
          if(!$scope.kemu_list.length){
            $scope.ifKuMuListNull = true; //添加按钮的显示和隐藏
          }
        };

        /**
         * 获得领域lingyu（选择科目）的值
         */
        var selectedLingYuIndex;
        $scope.getLingYuVal = function(idx){
          selectedLingYuIndex = '';
          selectedLingYuIndex = idx;
          $scope.linyuValue = idx >=0 ? true : false;
        };

        /**
         * 获得角色juese（科目权限）的代码
         */
        var selectJueseIdArr = [],
            selectJueseNameArr = [];
        $scope.getJueSeArr = function(){
          selectJueseIdArr = [];
          selectJueseNameArr = [];
          var jueseItem = $('input[name=rightName]:checked');
          Lazy(jueseItem).each(function(js, idx, lst){
            selectJueseIdArr.push(js.value);
            var ne = js.nextElementSibling;
            if(ne){
              selectJueseNameArr.push(ne.innerText);
            }
          });
          $scope.jueseValue = selectJueseIdArr.length;
        };

        /**
         *  删除一条已选科目
         */
        $scope.delSelectedObject = function(idx){
          var deleteObjectAndRight = $scope.objAndRight.splice(idx, 1);
          $scope.kemu_list.push(deleteObjectAndRight[0].lingyu[0]);
          if($scope.kemu_list.length){
            $scope.ifKuMuListNull = false;
          }
        };

        /**
         * 回到填写个人信息页面
         */
        $scope.goToPersonInfo = function(){
          $('.nav-tabs li').removeClass('active').eq(0).addClass('active');
          $('.tab-pane').removeClass('active').eq(0).addClass('active');
        };

        /**
         * 去提交个人信息页面
         */
        $scope.goToSubmit = function(){
          select_juese = [];
          Lazy(objAndRightList).each(function(oar, indx, lst){
            Lazy(oar.juese.jueseId).each(function(jsid, idx, lst){
              var jueseObg = {
                jigou: jigouId,
                lingyu: '',
                juese: ''
              };
              jueseObg.lingyu = oar.lingyu[0].LINGYU_ID;
              jueseObg.juese = jsid;
              select_juese.push(jueseObg);
            });
          });
          registerDate.juese = select_juese;
          $scope.registerDate = registerDate;
          $scope.stepThree = true;
          $('.nav-tabs li').removeClass('active').eq(2).addClass('active');
          $('.tab-pane').removeClass('active').eq(2).addClass('active');
        };

        /**
         * 去提交个人信息页面 getObjectAndRight
         */
        $scope.goToJueSe = function(){
          $('.nav-tabs li').removeClass('active').eq(1).addClass('active');
          $('.tab-pane').removeClass('active').eq(1).addClass('active');
        };

        /**
         * 提交个人信息
         */
        $scope.submitRegisterInfo = function(){
          registerDate.token = token;
          registerDate.YONGHULEIBIE = 1;
          $http.post(registerUrl, registerDate).success(function(data){
            if(data.result){
              DataService.alertInfFun('suc', '提交成功！');
              $scope.stepTwo = false;
              $scope.stepThree = false;
              urlRedirect.goTo($location.$$path, '/renzheng');
            }
            else{
              DataService.alertInfFun('err', data.error);
            }
          });
        };

        /**
         * 去第二步，显示学号和姓名输入框
         */
        $scope.stuShowStepOne = function(){
          $('.tab-pane').removeClass('active').eq(0).addClass('active');
        };

        /**
         * 去第二步，显示学号和姓名输入框
         */
        $scope.stuShowStepTwo = function(){
          $('.tab-pane').removeClass('active').eq(1).addClass('active');
        };

        /**
         * 查询用户信息表
         */
        //var qryUserIfRegister = function(){
        //  var checkStuInYhxxUrl = checkStuInYhxxBaseUrl + $scope.stuRegisterInfo.jigouid;
        //  checkStuInYhxxUrl += '&xuehao=' + $scope.stuRegisterInfo.xuehao;
        //  //checkStuInYhxxUrl += '&xingming=' + $scope.stuRegisterInfo.xingming;
        //  $http.get(checkStuInYhxxUrl).success(function(student){
        //    if(student && student.length > 0){
        //      $scope.studentInfo = student;
        //      $('.tab-pane').removeClass('active').eq(2).addClass('active');
        //      DataService.alertInfFun('pmt', '用户已存在，请登录！');
        //    }
        //    else{
        //      $scope.studentInfo = '';
        //      $scope.ifTheStuHasRegister = true;
        //    }
        //  });
        //};

        /**
         * 查询报名考生表
         */
        var qryUserIfInBmksb = function(){
          var chaXunKaoSheng = qryKaoShengBaseUrl + '&jigouid=';
          if($scope.stuRegisterInfo.jigouid){
            chaXunKaoSheng += $scope.stuRegisterInfo.jigouid;
            checkStuInYhxxBaseUrl += $scope.stuRegisterInfo.jigouid;
            if($scope.stuRegisterInfo.xuehao){
              $scope.stuRegisterInfo.xuehao = $scope.stuRegisterInfo.xuehao.replace(delBlankReg, '');
              chaXunKaoSheng += '&xuehao=' + $scope.stuRegisterInfo.xuehao;
              if($scope.stuRegisterInfo.xingming){
                $scope.stuRegisterInfo.xingming = $scope.stuRegisterInfo.xingming.replace(delBlankReg, '');
                chaXunKaoSheng += '&xingming=' + $scope.stuRegisterInfo.xingming;
                DataService.getData(chaXunKaoSheng).then(function(data){
                  if(data && data.length > 0){
                    $scope.ifTheStuHasRegister = true;
                  }
                  else{
                    $scope.ifTheStuHasRegister = false;
                    DataService.alertInfFun('err', '无学号信息，请核对学号信息！');
                  }
                });
              }
              else{
                DataService.alertInfFun('pmt', '请输入姓名！');
              }
            }
            else{
              DataService.alertInfFun('pmt', '请输入学号！');
            }
          }
          else{
            DataService.alertInfFun('pmt', '请选择学校！');
          }
        };

        /**
         * 查询考生是否已经存在
         */

        $scope.confirmTheStuIn = function(){
          //查询用户信息表
          checkUserData = '';
          $scope.studentInfo = [];
          var checkStuInYhxxUrl = checkStuInYhxxBaseUrl + $scope.stuRegisterInfo.jigouid;
          checkStuInYhxxUrl += '&xuehao=' + $scope.stuRegisterInfo.xuehao;
          checkStuInYhxxUrl += '&xingming=' + $scope.stuRegisterInfo.xingming;
          $http.get(checkStuInYhxxUrl).success(function(student){
            if(student && student.length > 0){
              if(student[0].YOUXIANG && student[0].MIMA){
                $scope.studentInfo.push(student[0]);
                $('.tab-pane').removeClass('active').eq(2).addClass('active');
                DataService.alertInfFun('pmt', '用户已存在，请登录！');
              }
              else{
                $scope.ifTheStuHasRegister = true;
                checkUserData = student[0];
              }
            }
            else{
              $scope.studentInfo = '';
              //qryUserIfInBmksb();
              //qryUserIfRegister();
              DataService.alertInfFun('err', student.error || '用户不存在！');
            }
          });
        };

        /**
         * 返回登录页面
         */
        $scope.backToLoginPage = function(){
          urlRedirect.goTo($location.$$path, '/renzheng');
        };

        /**
         * 保存学生注册信息
         */
        $scope.saveStudentInfo = function(){
          $scope.stuRegisterInfo.youxiang = $scope.stuRegisterInfo.youxiang.replace(delBlankReg,'');
          $scope.stuRegisterInfo.mima = $scope.stuRegisterInfo.mima.replace(delBlankReg,'');
          if(checkUserData.UID){
            var stuData = {
              token: token,
              YONGHULEIBIE: 2,
              UID: checkUserData.UID,
              YONGHUHAO: $scope.stuRegisterInfo.xuehao,
              XINGMING: $scope.stuRegisterInfo.xingming,
              YOUXIANG: $scope.stuRegisterInfo.youxiang,
              JIGOU:  [{JIGOU_ID:$scope.stuRegisterInfo.jigouid, ZHUANGTAI: 1}],
              MIMA: $scope.stuRegisterInfo.mima
            };
            $http.post(alterYongHu, stuData).success(function(data){
              if(data.result){
                DataService.alertInfFun('suc', '提交成功！');
                urlRedirect.goTo($location.$$path, '/renzheng');
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
            });
          }
          else{
            DataService.alertInfFun('err', '缺少UID！');
          }
        };

    }]);
});
