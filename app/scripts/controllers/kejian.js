define(['angular', 'config', 'jquery', 'lazy', 'datepicker', 'qrcode'], // 000 开始
  function (angular, config, $, lazy, datepicker, qrcode) { // 001 开始
    'use strict';
    angular.module('zhifzApp.controllers.KejianCtrl', []) //controller 开始
      .controller('KejianCtrl', ['$rootScope', '$scope', '$http', '$timeout', 'DataService', '$cookieStore',
        function ($rootScope, $scope, $http, $timeout, DataService, $cookieStore) { // 002 开始
          /**
           * 定义变量
           */
          var loginUsr = JSON.parse($cookieStore.get('ckUsr'));
          var jgID = loginUsr['学校ID']; //登录用户学校
          var dftKm = JSON.parse($cookieStore.get('ckKeMu')); //默认选择的科目
          var keMuId = dftKm['科目ID']; //默认的科目ID
          var ceYanUrl = '/ceyan'; //测验的url
          var qrcodeUrl = '/make_qrcode'; //生成二维码地址的url
          var wenJuanDiaoChaUrl = '/wenjuan_diaocha'; //问卷调查url
          var itemNumPerPage = 10; //每页多少条数据
          var paginationLength = 11; //分页显示多少也
          var keJianDataStore = ''; //存放课件数据
          var testUrl = 'https://www.zhifz.com/pub_test/'; //二维码的地址
          $scope.letterArr = config.letterArr; //题支的序号
          $scope.cnNumArr = config.cnNumArr; //题支的序号
          $scope.kjParams = {
            showErWeiMa: false
          }; //课件参数
          $scope.pageParam = { //分页参数
            activePage: '',
            lastPage: '',
            pageArr: [],
            disPage: []
          };
          $scope.keJianDtl = ''; //课件详情

          /**
           * 分页处理函数
           */
          var pageMake = function(data){
            $scope.pageParam = { //分页参数
              activePage: '',
              lastPage: '',
              pageArr: [],
              disPage: []
            };
            var dataLen = data.length; //数据长度
            var lastPage = Math.ceil(dataLen/itemNumPerPage); //最后一页
            $scope.pageParam.pageArr = Lazy.generate(function(i) { return i + 1; }, lastPage).toArray();
            $scope.pageParam.lastPage = lastPage;
            $scope.pageParam.activePage = 1;
            cutPageFun(1);
          };

          /**
           * 分页数据变动的函数
           */
          var cutPageFun = function(pg){
            var activePg = $scope.pageParam.activePage = pg ? pg : 1;
            if($scope.pageParam.lastPage <= paginationLength){
              $scope.pageParam.disPage = $scope.pageParam.pageArr;
            }
            if($scope.pageParam.lastPage > paginationLength){
              if(activePg > 0 && activePg <= 6 ){
                $scope.pageParam.disPage = $scope.pageParam.pageArr.slice(0, paginationLength);
              }
              else if(activePg > $scope.pageParam.lastPage - 5 && activePg <= $scope.pageParam.lastPage){
                $scope.pageParam.disPage = $scope.pageParam.pageArr.slice($scope.pageParam.lastPage - paginationLength);
              }
              else{
                $scope.pageParam.disPage = $scope.pageParam.pageArr.slice(activePg - 5, activePg + 5);
              }
            }
          };

          /**
           * 查询课件列表
           */
          $scope.getKeJianList = function(){
            if(!(keJianDataStore && keJianDataStore.length > 0)){
              var obj = {
                method: 'GET',
                url: ceYanUrl,
                params: {
                  '学校ID': 1033,
                  '创建人UID': 15023
                }
              };
              $http(obj).success(function(data){
                if(data.result && data.data){
                  pageMake(data.data);
                  keJianDataStore = Lazy(data.data).reverse().toArray();
                  $scope.keJianDist(1);
                }
                else{
                  keJianDataStore = '';
                  DataService.alertInfFun('err', data.error);
                }
              });
            }
            $scope.txTpl = 'views/kejian/keJianList.html';
          };
          $scope.getKeJianList();

          /**
           * 课件的分页数据查询函数
           */
          $scope.keJianDist = function(pg){
            var pgNum = pg - 1;
            var cutPage = pgNum ? pgNum : 0;
            cutPageFun(pg);
            $scope.keJianList = keJianDataStore.slice(cutPage * itemNumPerPage, (cutPage + 1) * itemNumPerPage);
          };

          /**
           * 查看测验详细
           */
          $scope.keJianDetail = function(id){
            var obj = {
              method: 'GET',
              url: wenJuanDiaoChaUrl,
              params: {
                '学校ID': 1033,
                '创建人UID': 15023,
                '测验ID': id
              }
            };
            $http(obj).success(function(data){
              if(data.result && data.data){
                //整理学生答题
                var tjArr = [];
                var distByTiMuId = Lazy(data.data).groupBy('题目ID').toObject();
                Lazy(distByTiMuId).each(function(v, k, l){
                  var tmObj = {
                    '题目ID': k,
                    '答案分析': []
                  };
                  var distByDaAn = Lazy(v).groupBy('答案').toObject();
                  Lazy(distByDaAn).each(function(v1, k1, l1){
                    var dafx = {
                      '答案': '',
                      '人数': ''
                    };
                    dafx['答案'] = k1;
                    if(v1 && v1.length > 0){
                      dafx['人数'] = Lazy(v1).reduce(function(memo, tm){ return memo + tm['人数']; }, 0);
                    }
                    else{
                      dafx['人数'] = 0;
                    }
                    tmObj['答案分析'].push(dafx);
                  });
                  tjArr.push(tmObj);
                });
                //查询题目详情
                var objCy = {
                  method: 'GET',
                  url: ceYanUrl,
                  params: {
                    '学校ID': 1033,
                    '创建人UID': 15023,
                    '测验ID': id,
                    '返回详情': true
                  }
                };
                $http(objCy).success(function(timu){
                  if(timu.result && timu.data){
                    Lazy(timu.data[0]['测验题目'][0]['题目']).each(function(item){
                      var daAnArr = [];
                      var tzLen = 0;
                      var fdTm = Lazy(tjArr).find(function(tj){
                        return tj['题目ID'] == item['题目ID'];
                      });
                      if(item['题型ID'] <= 2){
                        tzLen = item['题目内容']['选项'].length;
                      }
                      if(item['题型ID'] == 3){
                        tzLen = 2;
                      }
                      for(var i = 0; i < tzLen; i++){
                        var da = {
                          '答案': i,
                          '人数': 0
                        };
                        if(fdTm){
                          var fdDa = Lazy(fdTm['答案分析']).find(function(daxx){
                            return daxx['答案'] == i;
                          });
                          if(fdDa){
                            da['人数'] = fdDa['人数'];
                          }
                        }
                        daAnArr.push(da);
                      }
                      item['选项分析'] = daAnArr;
                    });
                    timu.data[0]['参与人数'] = timu.data[0]['参与人数'] || 1;
                    $scope.keJianDtl = timu.data[0];
                    $scope.txTpl = 'views/kejian/kjDetail.html';
                  }
                  else{
                    $scope.keJianDtl = '';
                    DataService.alertInfFun('err', timu.error);
                  }
                });
              }
              else{
                DataService.alertInfFun('err', data.error || '缺少答题数据！');
              }
            });
          };

          /**
           * 删除课件
           */
          $scope.deleteKeJian = function(id){
            if(confirm('确定要删除此测验？')){
              var obj = {
                method: 'POST',
                url: ceYanUrl,
                data: {
                  '测验ID': id,
                  '状态': -1
                }
              };
              $http(obj).success(function(data){
                if(data.result){
                  keJianDataStore = Lazy(keJianDataStore).reject(function(kj){ return kj['测验ID'] == id}).toArray();
                  $scope.keJianList = Lazy($scope.keJianList).reject(function(kj){ return kj['测验ID'] == id}).toArray();
                  DataService.alertInfFun('suc', '删除成功！');
                }
                else{
                  DataService.alertInfFun('err', data.error);
                }
              });
            }
          };

          /**
           * 生成二维码
           */
          $scope.makeErWeiMa = function(id){
            var obj = {
              method: 'GET',
              url: qrcodeUrl,
              params: {
                '测验ID': id
              }
            };
            var idSlt = $('#QRCodeBox');
            $http(obj).success(function(data){
              if(data.result && data.data){
                var textStr = testUrl + data.data['测验ID'];
                $scope.kjParams.showErWeiMa = true;
                idSlt.html('');
                new QRCode(document.getElementById('QRCodeBox'), {
                  text: textStr,
                  width: 300,
                  height: 300,
                  background: '#ccc',
                  foreground: 'red'
                });
                var showDatePicker = function() {
                  var imgDt = idSlt.find('img').prop('src');
                  $('#downloadEwm').prop('href', imgDt);
                };
                $timeout(showDatePicker, 500);
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
            });
          };

          /**
           * 新增课件
           */
          $scope.addNewKeJian = function(){

          };

          /**
           * 保存二维码
           */
          $scope.saveErWeiMa = function(){

          };

          /**
           * 返回考试组列表
           */
          $scope.backToList = function(){
            $scope.keJianDtl = '';
            $scope.getKeJianList();
          };

          /**
           * 关闭弹出框
           */
          $scope.closePopup = function(){
            $scope.kjParams.showErWeiMa = false;
          };

          /**
           * 重新加载 mathjax
           */
          $scope.$on('onRepeatLast', function(scope, element, attrs){
            MathJax.Hub.Config({
              tex2jax: {inlineMath: [['#$', '$#']], displayMath: [['#$$','$$#']]},
              messageStyle: 'none',
              showMathMenu: false,processEscapes: true
            });
            MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'paperWrap']);
          });

        }
      ]
    );
  }
);
