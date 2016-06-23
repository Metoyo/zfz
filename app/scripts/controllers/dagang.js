define(['angular', 'config', 'jquery', 'lazy', 'mathjax'], function (angular, config, $, lazy, mathjax) {
  'use strict';

  angular.module('zhifzApp.controllers.DagangCtrl', [])
    .controller('DagangCtrl', ['$rootScope', '$scope', '$http', '$timeout', 'DataService', '$cookieStore',
      function ($rootScope, $scope, $http, $timeout, DataService, $cookieStore) {
        /**
         * 声明变量
         */
        var loginUsr = JSON.parse($cookieStore.get('ckUsr'));
        var jgID = loginUsr['学校ID']; //登录用户学校
        var dftKm = JSON.parse($cookieStore.get('ckKeMu')); //默认选择的科目
        var keMuId = dftKm['科目ID']; //默认的科目ID
        var lingYuId = dftKm['领域ID']; //默认的科目ID
        var zhiShiDaGangUrl = '/zhishidagang'; //知识大纲
        var zhiShiDianUrl = '/zhishidian'; //知识点
        var keMuConfUrl = '/kemu_conf'; //科目设置
        $scope.defaultKeMu = dftKm; //默认科目
        $scope.publicZsdgList = []; //存放公共知识大纲的数组
        $scope.privateZsdgList = []; //存放自建知识大纲的数组
        $scope.loadingImgShow = false;
        $scope.dgParam = { //大纲参数
          dgType: '', //大纲类型
          slt_dg: '', //选择的大纲
          dgSaveAsName: '',
          showDaGangAsNew: false,
          zsdKind: '', //知识点类型
          activeNd: '', //那个输入框被激活了
          zjSaveAs: false //自建知识大纲的另存
        };

        /**
         * 获得大纲数据
         */
        var getDaGangData = function(tp){
          var obj = {
            method: 'GET',
            url: zhiShiDaGangUrl,
            params: {
              '科目ID': keMuId,
              '类型': tp
            }
          };
          $scope.dgParam.dgType = tp;
          if(tp == 2){
            obj.params['学校ID'] = jgID;
          }
          $http(obj).success(function(data){
            if(data.result){
              if(tp == 1){
                $scope.publicZsdgList = data.data;
              }
              else{
                $scope.privateZsdgList = data.data;
              }
            }
            else{
              DataService.alertInfFun('err', data.error);
            }
          });
        };

        /**
         * 查询公共知识点
         */
        $scope.qryZsd = function(tp){
          var obj = {method:'GET', url:zhiShiDianUrl, params:{'领域ID':lingYuId, '类型': tp}};
          $scope.dgParam.zsdKind = tp;
          $http(obj).success(function(data){
            if(data.result){
              $scope.allPublicZsd = angular.copy(data.data);
              $scope.publicZsd = data.data;
            }
            else{
              $scope.allPublicZsd = '';
              $scope.publicZsd = '';
              DataService.alertInfFun('err', data.error);
            }
          });
        };

        /**
         * 返回大纲首页
         */
        $scope.backToDaGangHome = function(){
          $scope.dgParam.slt_dg = '';
          $scope.publicZsd = '';
          $scope.dgParam.zsdKind = '';
          $scope.allPublicZsd = '';
          $scope.dgParam.dgSaveAsName = '';
        };

        /**
         *加载对应的大纲页面
         */
        $scope.renderDgPage = function(lx){
          $scope.dgParam.showDaGangAsNew = false;
          $scope.backToDaGangHome();
          getDaGangData(lx);
          if(lx == 1){
            $scope.knowledgePb = '';
            $scope.dgTpl = 'views/dagang/daGangPublic.html';
          }
          if(lx == 2){
            $scope.qryZsd(1);
            $scope.knowledgePr = '';
            $scope.dgTpl = 'views/dagang/daGangPrivate.html';
          }
        };
        $scope.renderDgPage(1);

        /**
         * 获得公共知识大纲知识点
         */
        $scope.getDgZsd = function(dgId){
          function _do(item) {
            var zsdId = item['知识点ID'];
            $scope.publicZsd = Lazy($scope.publicZsd).reject(function(pgz){
              return pgz['知识点ID'] == zsdId;
            }).toArray();
            if(item['子节点'] && item['子节点'].length > 0){
              Lazy(item['子节点']).each(_do);
            }
          }
          if($scope.dgParam.dgType == 1){
            $scope.knowledgePb = Lazy($scope.publicZsdgList).find(function(dg){
              return dg['知识大纲ID'] == dgId;
            });
          }
          if($scope.dgParam.dgType == 2){
            $scope.dgParam.activeNd = '';
            $scope.publicZsd = angular.copy($scope.allPublicZsd);
            $scope.knowledgePr = Lazy($scope.privateZsdgList).find(function(dg){
              return dg['知识大纲ID'] == dgId;
            });
            Lazy($scope.knowledgePr['节点']).each(_do);
          }
        };

        /**
         * 显示大纲另存
         */
        $scope.showSaveAs = function(){
          $scope.dgParam.showDaGangAsNew = true;
          $scope.dgParam.zjSaveAs = $scope.dgParam.dgType == 2;
        };

        /**
         * 新增一个自建知识大纲
         */
        $scope.addNewZjDg = function(){
          var newDg = {
            '知识大纲名称': '',
            '学校ID': jgID,
            '科目ID': keMuId,
            '类型': 2,
            '节点': []
          };
          $scope.dgParam.slt_dg = '';
          $scope.knowledgePr = newDg; //重置公共知识大纲知识点
        };

        /**
         * 添加知识点
         */
        $scope.dgAddNd = function(nd, ndl) {
          var newNd = {};
          newNd['知识点名称'] = '';
          newNd['子节点'] = [];
          if(ndl && ndl == 'jd'){
            nd['节点'] = nd['节点'] || [];
            nd['节点'].push(newNd);
          }
          else{
            nd['子节点'] = nd['子节点'] || [];
            nd['子节点'].push(newNd);
          }
        };

        /**
         * 删除知识点
         */
        $scope.dgRemoveNd = function(parentNd, nd, idx) {
          function _do(item) {
            if(item['知识点ID']){
              var fdZsd = Lazy($scope.allPublicZsd).find(function(zsd){
                return zsd['知识点ID'] == item['知识点ID'];
              });
              if(fdZsd){
                $scope.publicZsd.push(fdZsd);
              }
            }
            if(item['子节点'] && item['子节点'].length > 0){
              Lazy(item['子节点']).each(_do);
            }
          }
          if(confirm("确定要删除知识点吗？")){
            _do(nd);
            //将删除的知识节点添加到公共知识点里
            if(parentNd['节点'] && parentNd['节点'].length > 0){
              parentNd['节点'].splice(idx, 1);
            }
            else{
              parentNd['子节点'].splice(idx, 1);
            }
          }
        };

        /**
         * 那一个输入框被选中了
         */
        $scope.getInputIndex = function(nd){
          $scope.dgParam.activeNd = nd;
        };

        /**
         * 当输入介绍后检查知识大纲中是否已经存在知识点
         */
        $scope.compareInputVal = function(nd){
          var zsdName = nd['知识点名称'];
          var count = 0;
          function _do(item) {
            if(item['知识点名称'] == zsdName){
              count ++;
            }
            if(item['子节点'] && item['子节点'].length > 0){
              Lazy(item['子节点']).each(_do);
            }
          }
          if(zsdName){
            //查询公共知识大纲里是否有重名
            var find = Lazy($scope.publicZsd).find(function(zsd){
              return zsd['知识点名称'] == zsdName;
            });
            //查询已选大纲里是否有重名
            Lazy($scope.knowledgePr['节点']).each(_do);
            if(find || count > 1){
              DataService.alertInfFun('pmt', '您输入的知识点名称与已有知识点名称相同！请修改！');
            }
          }
        };

        /**
         * 将公共知识点添加到知识大纲
         */
        $scope.addToDaGang = function(zsd, idx){
          $scope.dgParam.activeNd['知识点ID'] = zsd['知识点ID'];
          $scope.dgParam.activeNd['知识点名称'] = zsd['知识点名称'];
          $scope.publicZsd.splice(idx, 1);
        };

        /**
         * 大纲另存为
         */
        $scope.saveDaGang = function(){
          var obj = {
            method:'PUT',
            url:zhiShiDaGangUrl,
            data: {
              '知识大纲名称': '',
              '学校ID': jgID,
              '科目ID': keMuId,
              '类型': 2,
              '节点': ''
            }
          };
          if($scope.dgParam.dgType == 2){ //修改自建大纲
            if($scope.dgParam.slt_dg){ //修改知识大纲
              if($scope.dgParam.zjSaveAs){
                obj.data['知识大纲名称'] = $scope.dgParam.dgSaveAsName;
              }
              else{
                obj.method = 'POST';
                obj.data['知识大纲ID'] = $scope.knowledgePr['知识大纲ID'];
                obj.data['知识大纲名称'] = $scope.knowledgePr['知识大纲名称'];
                obj.data['学校ID'] = $scope.knowledgePr['学校ID'];
                obj.data['科目ID'] = $scope.knowledgePr['科目ID'];
              }
            }
            else{
              obj.data['知识大纲名称'] = $scope.knowledgePr['知识大纲名称'];
            }
            obj.data['节点'] = JSON.stringify($scope.knowledgePr['节点']);
          }
          else{ //修改公共大纲
            obj.data['知识大纲名称'] = $scope.dgParam.dgSaveAsName; //公共知识大纲另存
            obj.data['节点'] = JSON.stringify($scope.knowledgePb['节点']);
          }
          if(!obj.data['知识大纲名称']){
            DataService.alertInfFun('pmt', '请输入知识大纲名称！');
            return ;
          }
          $scope.loadingImgShow = true;
          $http(obj).success(function(data){
            if(data.result){
              if($scope.dgParam.dgType == 2){
                getDaGangData(2);
                $scope.knowledgePr = '';
                $scope.dgParam.slt_dg = '';
              }
              $scope.dgParam.showDaGangAsNew = false;
              DataService.alertInfFun('suc', '大纲保存成功！');
            }
            else{
              DataService.alertInfFun('err', data.error);
            }
            $scope.loadingImgShow = false;
          });
        };

        /**
         * 设定默认大纲
         */
        $scope.setDefaultDg = function(){
          var gObj = {
            method: 'GET',
            url: keMuConfUrl,
            params: {
              '学校ID': jgID,
              '科目ID': keMuId
            }
          };
          var pObj = {
            method: 'POST',
            url: keMuConfUrl,
            data: {
              '学校ID': jgID,
              '科目ID': keMuId,
              '科目设置': ''
            }
          };
          var setPar = {};
          $http(gObj).success(function(gData){
            if(gData.result && gData.data){
              if(typeof(gData.data) == 'string'){
                gData.data = JSON.parse(gData.data);
              }
              setPar = gData.data;
            }
            else{
              setPar = {
                '默认大纲': {
                  '知识大纲ID': '',
                  '知识大纲名称': ''
                }
              };
            }
            if($scope.dgParam.dgType == 1){
              setPar['默认大纲']['知识大纲ID'] = $scope.knowledgePb['知识大纲ID'];
              setPar['默认大纲']['知识大纲名称'] = $scope.knowledgePb['知识大纲名称'];
            }
            if($scope.dgParam.dgType == 2){
              setPar['默认大纲']['知识大纲ID'] = $scope.knowledgePr['知识大纲ID'];
              setPar['默认大纲']['知识大纲名称'] = $scope.knowledgePr['知识大纲名称'];
            }
            pObj.data['科目设置'] = JSON.stringify(setPar);
            $http(pObj).success(function(pData){
              if(pData.result){
                DataService.alertInfFun('suc', '设置成功！');
              }
              else{
                DataService.alertInfFun('err', pData.error);
              }
            });
          });
        };

        /**
         * 删除大纲
         */
        $scope.deleteDaGang = function(){
          var obj = {
            method:'POST',
            url:zhiShiDaGangUrl,
            data: {
              '知识大纲ID': $scope.knowledgePr['知识大纲ID'],
              '状态': -1
            }
          };
          if(confirm('你确定要删除此大纲吗？')){
            $http(obj).success(function(data){
              if(data.result){
                getDaGangData(2);
                $scope.knowledgePr = '';
                $scope.dgParam.slt_dg = '';
                DataService.alertInfFun('suc', '删除成功！');
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
              $scope.loadingImgShow = false;
            });
          }
        };

        /**
         * 重新加载mathjax
         */
        $scope.$on('onRepeatLast', function(scope, element, attrs){
          MathJax.Hub.Config({
            tex2jax: {inlineMath: [["#$", "$#"]], displayMath: [['#$$','$$#']]},
            messageStyle: "none",
            showMathMenu: false,
            processEscapes: true
          });
          MathJax.Hub.Queue(["Typeset", MathJax.Hub, "daGangList"]);
        });

      }]);
});
