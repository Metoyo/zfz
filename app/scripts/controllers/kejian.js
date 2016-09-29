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
          var itemNumPerPage = 10; //每页多少条数据
          var paginationLength = 11; //分页显示多少也
          var keJianDataStore = ''; //存放课件数据
          var testUrl = 'https://www.zhifz.com/pub_test/'; //二维码的地址
          $scope.kjParams = {

          }; //课件参数
          $scope.pageParam = { //分页参数
            activePage: '',
            lastPage: '',
            pageArr: [],
            disPage: []
          };

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
            $http(obj).success(function(data){
              if(data.result && data.data){
                var textStr = testUrl + data.data['测验ID'];
                $('#QRCodeBox').html('');
                new QRCode(document.getElementById('QRCodeBox'), {
                  text: textStr,
                  width: 200,
                  height: 200,
                  background: '#ccc',
                  foreground: 'red'
                });
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
            });
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
            MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'kaoWuPaperDetail']);
          });

        }
      ]
    );
  }
);
