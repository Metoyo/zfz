define(['angular', 'config', 'jquery', 'lazy'], function (angular, config, $, lazy) {
  'use strict';

  angular.module('zhifzApp.controllers.RegisterCtrl', [])
    .controller('RegisterCtrl', ['$rootScope', '$scope', '$location', '$http', 'urlRedirect', 'DataService',
      '$routeParams', '$timeout',
      function ($rootScope, $scope, $location, $http, urlRedirect, DataService, $routeParams, $timeout) {

        //新方法用到的变量
        var xueXiaoUrl = '/xuexiao';
        var xueXiaoKeMuUrl = '/xuexiao_kemu'; //学校科目
        var yongHuUrl = '/yonghu'; //用户的增删改查
        var chkEmailUrl = '/exists_youxiang'; //检查邮箱url
        var chkUserNameUrl = '/exists_yonghuming'; //检查用户名url
        var delBlankReg = /\s/g; //去除空格的正则表达
        var loginUrl = '/login'; //登录url
        $scope.phoneRegexp = /^[1][3458][0-9]{9}$/; //验证手机的正则表达式
        $scope.emailRegexp = /[\w!#$%&'*+/=?^_`{|}~-]+(?:\.[\w!#$%&'*+/=?^_`{|}~-]+)*@(?:[\w](?:[\w-]*[\w])?\.)+[\w](?:[\w-]*[\w])?/; //验证邮箱的正则表达式
        $scope.xuHaoRegexp = /^.{4,30}$/;//用户名的正则表达式
        $scope.userNameRegexp = /^([a-zA-Z])([a-zA-Z0-9_]){3,29}$/;//用户名的正则表达式
        $scope.realNameRegexp = /(^[A-Za-z]{2,20}$)|(^[\u4E00-\u9FA5]{2,20}$)/;//真实姓名的正则表达式
        $scope.passwordRegexp = /^.{6,20}$/;//密码的正则表达式
        $scope.objectWrap = false;
        $scope.stepTwo = false; //第二步的显示和隐藏
        $scope.stepThree = false; //第三步的显示和隐藏
        $scope.ifTheStuHasRegister = false;
        $scope.studentInfo = '';
        $scope.stuIfPswTheSame = false;
        $scope.fbdBtn = false;
        $scope.jigou_list = '';
        if($location.$$path == '/register'){
          $rootScope.urlArrs = [];
        }
        var ifStuFndUn = $routeParams.stuFndUn;
        /**
         * 返回
         */
        $scope.registerBackTo = function(step){
          if(step == 1){
            $scope.rzTpl = 'views/renzheng/rz_registerSelect.html';
          }
        };
        $scope.registerParam = {
          selectJgId: '',
          selectJgName: '',
          isSelectJs: false, //对应的科目是否选择了角色
          sltJsId: '' //注册是选择的角色ID
        };
        $scope.stuRegisterInfo = {
          '学校ID': '',
          '学号': '',
          '姓名': '',
          '邮箱': '',
          '密码': '',
          '确认密码': ''
        };

        /**
         * 查询科目代码
         */
        var qryJgKeMu = function(jgId){
          if(jgId){
            var obj = {method: 'GET', url: xueXiaoKeMuUrl, params: ''};
            obj.params = {
              '学校ID': jgId
            };
            $http(obj).success(function(data) {
              if(data.result && data.data){
                $scope.xxkm_list = DataService.cnSort(data.data, '科目名称');
              }
              else{
                $scope.xxkm_list = '';
                DataService.alertInfFun('err', '没有相关领域！');
              }
            });
          }
        };

        /**
         *  查询角色的代码
         */
        var qryJueSe = function(){
          $scope.juese_list = [
            {
              "角色ID": 3,
              "角色名称": "任课教师",
              ckd: false
            },
            {
              "角色ID": 5,
              "角色名称": "助教",
              ckd: false
            }
          ];
        };

        /**
         * 检查输入的邮箱或者是用户名，在数据库中是否存在
         */
        $scope.checkUsrExist = function(type, info){
          if(info){
            var obj = {method:'GET', url: '', params: {}};
            if(type == 'youxiang'){
              obj.url = chkEmailUrl;
              obj.params['邮箱'] = info;
            }
            if(type == 'yonghuming'){
              obj.url = chkUserNameUrl;
              obj.params['用户名'] = info;
            }
            $http(obj).success(function(data){
              if(data.result && data.data){
                if(type == 'yonghuming'){
                  $scope.yonghumingExist = data.data['存在'];
                }
                else{
                  $scope.youxiangExist = data.data['存在'];
                }
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
            });
          }
          else{
            DataService.alertInfFun('pmt', '输入的邮箱或者用户名为空！');
          }
        };

        /**
         * 检查密码是否一致
         */
        $scope.checkPassword = function(){
          var psw = $scope.teacherInfo['密码'];
          var pswConfirm = $scope.teacherInfo['确认密码'];
          if(pswConfirm){
            $scope.stuIfPswTheSame = (psw != pswConfirm);
          }
          else{
            $scope.ifPswTheSame = false;
          }
        };

        /**
         * 个人详情信息完整后，去第二步
         */
        $scope.validateTeacherInfo = function(){
          $scope.stepTwo = true;
          $scope.stepNum = 2;
        };

        /**
         * 机构查询
         */
        var getJgList = function(){
          if(!($scope.jigou_list && $scope.jigou_list.length > 0)){
            $scope.loadingImgShow = true;
            $http.get(xueXiaoUrl).success(function(schools){
              if(schools.result && schools.data){
                $scope.jigou_list = DataService.cnSort(schools.data, '学校名称');
              }
              else{
                $scope.jigou_list = '';
                DataService.alertInfFun('err', schools.error);
              }
              $scope.loadingImgShow = false;
            });
          }
        };

        /**
         * 得到机构id
         */
        $scope.getJgId = function(jgId){
          $scope.xxkm_list = ''; //重置领域
          $scope.registerParam.selectJgId = jgId || '';
          $scope.registerParam.isSelectJs = false;
          qryJgKeMu(jgId);
        };

        /**
         * 显示教师注册
         */
        $scope.teacherRegister = function(){
          getJgList();
          qryJueSe();
          $scope.select_km = '';
          $scope.stepNum = 1;
          $scope.teacherInfo = {
            '用户名': '',
            '密码': '',
            '邮箱': '',
            '姓名': '',
            '手机': '',
            '确认密码': '',
            '用户类别' : 1,
            '学校ID': '',
            '角色': []
          };
          $scope.rzTpl = 'views/renzheng/rz_regTeacher.html';
        };

        /**
         * 显示学生注册
         */
        $scope.studentRegister = function(){
          getJgList();
          $scope.stepNum = 1;
          $scope.rzTpl = 'views/renzheng/rz_regStudent.html';
        };

        /**
         * 学生找回用户名
         */
        if(ifStuFndUn){
          var jumpToStu = function() {
            $scope.studentRegister();
          };
          $timeout(jumpToStu, 1);
        }

        /**
         * 检查是否选择角色
         */
        var checkHaveJs = function(){
          var count = 0;
          Lazy($scope.xxkm_list).each(function(xkm){
            if(xkm['角色'] && xkm['角色'].length > 0){
              count ++;
            }
          });
          $scope.registerParam.isSelectJs = (count > 0);
        };

        /**
         * 获得科目
         */
        $scope.getKeMuVal = function(km){
          km['角色'] = km['角色'] || [];
          $scope.select_km = km;
          if(km['角色'].length > 0){
            $scope.registerParam.sltJsId = km['角色'][0]['角色ID'];
          }
          else{
            $scope.registerParam.sltJsId = '';
          }
          //Lazy($scope.juese_list).each(function(js){
          //  var ifIn = Lazy(km['角色']).find(function(k){
          //    return k['角色ID'] == js['角色ID'];
          //  });
          //  js.ckd = ifIn ? true : false;
          //});
          checkHaveJs();
        };

        /**
         * 获得角色juese（科目权限）的代码
         */
        $scope.getJueSe = function(js){
          //js.ckd = !js.ckd;
          //var jsId = [];
          //Lazy($scope.juese_list).each(function(js){
          //  if(js.ckd){
          //    jsId.push(js);
          //  }
          //});
          if(js){
            $scope.select_km['角色'].push(js);
            checkHaveJs();
          }
        };

        /**
         * 回到填写个人信息页面
         */
        $scope.goToPersonInfo = function(){
          $scope.stepNum = 1;
        };

        /**
         * 去提交个人信息页面
         */
        $scope.goToSubmit = function(){
          var findXx = Lazy($scope.jigou_list).find(function(xx){
            return xx['学校ID'] == $scope.registerParam.selectJgId;
          });
          $scope.registerParam.selectJgName = findXx['学校名称'];
          $scope.teacherInfo['学校ID'] = $scope.registerParam.selectJgId;
          $scope.teacherInfo['角色'] = [];
          Lazy($scope.xxkm_list).each(function(km){
            if(km['角色'] && km['角色'].length > 0){
              Lazy(km['角色']).each(function(js){
                var item = {
                  '学校ID': km['学校ID'],
                  '领域ID': km['领域ID'],
                  '科目ID': km['科目ID'],
                  '角色ID': ''
                };
                item['角色ID'] = js['角色ID'];
                $scope.teacherInfo['角色'].push(item);
              });
            }
          });
          $scope.stepThree = true;
          $scope.stepNum = 3;
        };

        /**
         * 去提交个人信息页面
         */
        $scope.goToJueSe = function(){
          $scope.stepNum = 2;
        };

        /**
         * 提交个人信息
         */
        $scope.submitRegisterInfo = function(){
          delete $scope.teacherInfo['确认密码'];
          $scope.teacherInfo['角色'] = JSON.stringify($scope.teacherInfo['角色']);
          var obj = {method: 'PUT', url: yongHuUrl, data: $scope.teacherInfo};
          $scope.fbdBtn = true;
          $http(obj).success(function(data){
            if(data.result){
              DataService.alertInfFun('suc', '提交成功！');
              $scope.stepTwo = false;
              $scope.stepThree = false;
              $scope.fbdBtn = false;
              urlRedirect.goTo($location.$$path, '/renzheng');
            }
            else{
              $scope.fbdBtn = false;
              DataService.alertInfFun('err', data.error);
            }
          });
        };

        /**
         * 学生注册的步骤
         */
        $scope.stuShowStep = function(num){
          $scope.stepNum = num;
        };

        /**
         * 查询考生是否已经存在
         */
        $scope.confirmTheStuIn = function(){
          $scope.studentInfo = '';
          var obj = {
            method: 'GET',
            url: yongHuUrl,
            params: {
              '学校ID': $scope.stuRegisterInfo['学校ID'],
              '用户类别': 2,
              '姓名': $scope.stuRegisterInfo['姓名'],
              '学号': $scope.stuRegisterInfo['学号']
            }
          };
          $http(obj).success(function(data){
            if(data.result && data.data){
              $scope.studentInfo = data.data;
              if(data.data[0]['邮箱']){
                $scope.stepNum = 3;
                DataService.alertInfFun('pmt', '用户已存在，请登录！');
              }
              else{
                $scope.ifTheStuHasRegister = true;
              }
            }
            else{
              $scope.studentInfo = '';
              DataService.alertInfFun('err', data.error || '用户信息不存在！请先通过Excel文件导入个人信息！');
            }
          });
        };

        /**
         * 学生注册检查密码是否一致
         */
        $scope.stuCheckPassword = function(){
          var psw = $scope.stuRegisterInfo['密码'];
          var pswConfirm = $scope.stuRegisterInfo['确认密码'];
          if(pswConfirm){
            $scope.stuIfPswTheSame = (psw != pswConfirm);
          }
          else{
            $scope.stuIfPswTheSame = false;
          }
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
          var objLogin = {
            method: 'GET',
            url: loginUrl,
            params: {
              '学校ID': $scope.stuRegisterInfo['学校ID'],
              '姓名': $scope.stuRegisterInfo['姓名'],
              '学号': $scope.stuRegisterInfo['学号']
            }
          };
          $http(objLogin).success(function(lData){
            if(lData.result && lData.data){
              //登录成功以后获得签名
              if($scope.studentInfo[0]['UID']){
                var obj = {
                  method: 'POST',
                  url: yongHuUrl,
                  data: {
                    'UID': $scope.studentInfo[0]['UID'],
                    '学号': $scope.stuRegisterInfo['学号'],
                    '姓名': $scope.stuRegisterInfo['姓名'],
                    '邮箱': $scope.stuRegisterInfo['邮箱'],
                    '密码': $scope.stuRegisterInfo['密码']
                  }
                };
                $http(obj).success(function(data){
                  if(data.result){
                    DataService.alertInfFun('suc', '注册成功！');
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
            }
            else{
              DataService.alertInfFun('err', lData.error);
            }
          });
        };

      }]);
});
