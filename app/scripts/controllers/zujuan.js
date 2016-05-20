define(['angular', 'config', 'mathjax', 'jquery', 'lazy'], function (angular, config, mathjax, $, lazy) { // 001
  'use strict';
  angular.module('zhifzApp.controllers.ZujuanCtrl', [])
    .controller('ZujuanCtrl', ['$rootScope', '$scope', '$location', '$http', 'urlRedirect', '$q', '$timeout', 'DataService', '$cookieStore',
      function ($rootScope, $scope, $location, $http, urlRedirect, $q, $timeout, DataService, $cookieStore) {
        /**
         * 声明变量
         */
        var loginUsr = JSON.parse($cookieStore.get('ckUsr'));
        var jgID = loginUsr['学校ID']; //登录用户学校
        var logUid = loginUsr['UID']; //登录用户的UID
        var dftKm = JSON.parse($cookieStore.get('ckKeMu')); //默认选择的科目
        var keMuId = dftKm['科目ID']; //默认的科目ID
        var lingYuId = dftKm['领域ID']; //默认的科目ID
        var zhiShiDaGangUrl = '/zhishidagang'; //知识大纲
        var shiJuanZuUrl = '/shijuanzu'; //试卷组
        var zuJuanUrl = '/zujuan'; //组卷，用在规则组卷
        var xueXiaoKeMuTiXingUrl = '/xuexiao_kemu_tixing'; //学校科目题型
        var tiKuUrl = '/tiku'; //题库
        var itemNumPerPage = 10; //每页显示多少条数据
        var paginationLength = 11; //分页部分，页码的长度，目前设定为11
        var originSjzData = ''; //存放试卷组原始数据的变量
        var chuTiRenUrl = '/chutiren'; //出题人
        var tiMuIdArr = []; //获得查询题目ID的数组
        var pageArr = []; //根据得到的数据定义一个分页数组
        var qryTmPar = { //查询题目参数对象
          zsd: [], //知识点
          nd: '', //难度id
          tm: '', //题目id
          tk: '', //题库id
          tx: '', //题型id
          tmly: '', //题目来源ID
          ctr: '', //出题人UID
          ltr: '',  //录题人ID
          cjsjKs: '', //创建时间开始
          cjsjJs: '' //创建时间结束
        };
        var tiMuUrl = '/timu'; //题目的URL
        var allTiMuIds = ''; //存放所有题目id
        var txName = config.tiXingNameArr; //题型名称
        var gdtmTempIds = []; //临时存放固定题目ID的数组
        $scope.letterArr = config.letterArr; //题支的序号
        $scope.defaultKeMu = dftKm; //默认科目
        $scope.zuJuanParam = { //组卷参数
          slt_dg: '', //默认大纲
          rlTxId: '', //组卷规则题型ID
          rlTmNum: '', //组卷规则题目数量
          rlTmFz: '', //组卷规则题目分值
          rlTmc: false, //组卷规则是否使用题目池
          rlNd: [], //组卷规则难度
          rlTk: [], //组卷规则题库
          rlZsd: [], //组卷规则知识点
          rlZsdName: [], //组卷规则知识点名称
          sjzName: '', //试卷组名称
          tiMuLen: '', //题目数量
          tiKuId: '', //题库ID
          ctr: '', //出题人ID
          cjsjKs: '', //题目创建时间开始
          showTiMu: false, //显示题目列表
          goToPageNum: '', //跳转页面
          txId: '', //查询题目的题型ID
          tmlTp: '' //题目列表类型
        };
        $scope.sjzPage = { //试卷组分页参数
          lastPage: '',
          currentPage: '',
          allPages: [],
          pages: []
        };
        $scope.pageParam = { //题目分页参数
          currentPage: '',
          lastPage: '',
          pageArr: []
        };
        $scope.zjDaGangListShow = false; //规则组卷的显示
        $scope.kmtxList = ''; //科目题型
        $scope.sjzKmtx = ''; //试卷组用到的科目题型

        /**
         * 获得大纲数据
         */
        function _zsdDo(item) {
          item.ckd = false;
          item.fld = true;
          if(item['子节点'] && item['子节点'].length > 0){
            Lazy(item['子节点']).each(_zsdDo);
          }
          qryTmPar.zsd = [];
          $scope.zuJuanParam.rlZsd = '';
          $scope.zuJuanParam.rlZsdName = '';
        }
        var getDaGangData = function(){
          var obj = {method:'GET', url:zhiShiDaGangUrl, params:{'学校ID':jgID, '科目ID':dftKm['科目ID'], '类型':2}};
          $scope.dgList = [];
          $http(obj).success(function(data){
            if(data.result){
              Lazy(data.data).each(function(dg){
                var dgObj = {
                  '知识大纲ID': dg['知识大纲ID'],
                  '知识大纲名称': dg['知识大纲名称']
                };
                $scope.dgList.push(dgObj);
              });
              $scope.allZsdgData = data.data;
              var sltDg = Lazy($scope.allZsdgData).find(function(dg){
                return dg['知识大纲ID'] == $scope.dgList[0]['知识大纲ID'];
              });
              Lazy(sltDg['节点']).each(_zsdDo);
              $scope.zuJuanParam.slt_dg = sltDg['知识大纲ID'];
              $scope.kowledgeList = sltDg;
            }
            else{
              DataService.alertInfFun('err', data.error);
            }
          });
        };

        /**
         * 查询科目题型 --
         */
        var kmTxData = function(){
          if($scope.kmtxList && $scope.kmtxList.length > 0){
            Lazy($scope.kmtxList).each(function(tx){
              tx.ckd = false;
            });
            $scope.sjzKmtx = angular.copy($scope.kmtxList);
            //$scope.tmKmtx = angular.copy($scope.kmtxList);
          }
          else{
            var obj = {method:'GET', url:xueXiaoKeMuTiXingUrl, params:{'学校ID':jgID, '科目ID':dftKm['科目ID']}};
            $http(obj).success(function(data){
              if(data.result){
                Lazy(data.data).each(function(tx){
                  tx.ckd = false;
                });
                $scope.kmtxList = data.data;
                $scope.sjzKmtx = angular.copy(data.data);
                //$scope.tmKmtx = angular.copy(data.data);
              }
              else{
                $scope.kmtxList = '';
                $scope.sjzKmtx = '';
                //$scope.tmKmtx = '';
                DataService.alertInfFun('err', data.error);
              }
            });
          }
        };

        /**
         * 查询题库 --
         */
        var qryTiKu = function(){
          if(!($scope.tiKuList && $scope.tiKuList.length > 0)){
            var obj = {method:'GET', url:tiKuUrl, params:{'学校ID':jgID, '领域ID': lingYuId}};
            $http(obj).success(function(data){
              if(data.result){
                $scope.tiKuList = data.data;
              }
              else{
                $scope.tiKuList = '';
                DataService.alertInfFun('err', data.error);
              }
            });
          }
        };

        /**
         *  查询试卷列表的函数，组卷页面加载时，查询数据
         */
        var qryShiJuanList = function(){
          var obj = {method:'GET', url:shiJuanZuUrl, params:{'学校ID':jgID, '科目ID':keMuId}};
          $scope.loadingImgShow = true;
          $http(obj).success(function(data){
            if(data.result){
              $scope.sjzPage.lastPage = Math.ceil(data.data.length/itemNumPerPage); //试卷一共有多少页
              for(var i = 1; i <= $scope.sjzPage.lastPage; i++){
                $scope.sjzPage.allPages.push(i);
              }
              originSjzData = Lazy(data.data).reverse().toArray();
              $scope.getSjzPageData(1);
            }
            else{
              originSjzData = '';
              $scope.sjzPage = {
                lastPage: '',
                currentPage: '',
                allPages: [],
                pages: []
              };
              DataService.alertInfFun('err', data.error);
            }
            $scope.loadingImgShow = false;
          });
        };

        /**
        * 查询知识点题目数量
        */
        var queryZsdTiMuNum = function(tx){

        };

        /**
         整理选中的知识点的ID和名称 --
         */
        var selectZsdFun = function(){ //用于将选择的知识点变成字符串
          var zsdName = [];
          var zsdId = [];
          qryTmPar.zsd = [];
          function _do(item) {
            if(item.ckd){
              zsdId.push(item['知识点ID']);
              zsdName.push(item['知识点名称']);
            }
            if(item['子节点'] && item['子节点'].length > 0){
              Lazy(item['子节点']).each(_do);
            }
          }
          Lazy($scope.kowledgeList['节点']).each(_do);
          if($scope.zuJuanParam.showTiMu){
            qryTmPar.zsd = zsdId;
            qryTestFun(1);
          }
          $scope.zuJuanParam.rlZsd = zsdId;
          $scope.zuJuanParam.rlZsdName = zsdName;
        };

        /**
         * 添加单个规则后，重置所有的选择框
         */
        var resetSingleRule = function(){

        };

        /**
         * 保存试卷组的通用函数
         */
        var addSjzFun = function(pars){
          $http(pars).success(function(data){
            if(data.result){
              $scope.btnDisable = false;
              $scope.ruleMakePaper();
              DataService.alertInfFun('suc', '保存成功！');
            }
            else{
              $scope.btnDisable = false;
              DataService.alertInfFun('err', data.error);
            }
          });
        };

        /**
         * 查询出题人 --
         */
        var qryChuTiRen = function(){
          if(!($scope.chuTiRens && $scope.chuTiRens.length > 0)){
            var obj = {method:'GET', url:chuTiRenUrl, params:{'学校ID':jgID, '科目ID': keMuId}};
            $http(obj).success(function(data){
              if(data.result){
                $scope.chuTiRens = data.data;
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
            });
          }
        };

        /**
         * 分页处理函数 --
         */
        var pageMake = function(data){
          var perNumOfPage = 15; //每页15条数据
          var dataLen = data.length; //数据长度
          var lastPage = Math.ceil(dataLen/perNumOfPage); //最后一页
          $scope.zuJuanParam.tiMuLen = dataLen;
          $scope.pageParam.pageArr = Lazy.generate(function(i) { return i + 1; }, lastPage).toArray();
          $scope.pageParam.lastPage = lastPage;
          $scope.pageParam.currentPage = 1;
          $scope.pageGetData(1);
        };

        /**
         * 查询题目详情 --
         */
        var qryTiMuDetail = function(tmArr){
          if(tmArr && tmArr.length > 0){
            $scope.loadingImgShow = true;
            if($scope.zuJuanParam.tmlTp == 'gdtm'){
              gdtmTempIds = [];
              Lazy($scope.sjzSet['组卷规则']).each(function(dt){
                Lazy(dt['固定题目']).each(function(tm){
                  gdtmTempIds.push(tm['题目ID']);
                });
              });
              gdtmTempIds = Lazy(gdtmTempIds).uniq().toArray();
            }
            var obj = {method:'GET', url:tiMuUrl, params:{'题目ID':JSON.stringify(tmArr)}};
            $http(obj).success(function(data){ //查询题目详情
              if(data.result){
                Lazy(data.data).each(function(tm, idx, lst){
                  tm = DataService.formatDaAn(tm);
                  if($scope.zuJuanParam.tmlTp=='tmc'){
                    tm.ckd = Lazy($scope.sjzSet['题目池']).contains(tm['题目ID']);
                  }
                  if($scope.zuJuanParam.tmlTp=='gdtm'){
                    tm.ckd = Lazy(gdtmTempIds).contains(tm['题目ID']);
                  }
                });
                $scope.timuDetails = data.data;
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
              $scope.loadingImgShow = false;
            });
          }
        };

        /**
         * 重置函数
         */
        var resetFun = function(){
          $scope.sjzSet = { //试卷组设置
            '试卷数量': '',
            '组卷方式': '',
            '限定时间': '',
            //'期望正确率': 0.8,
            '题目池': [], // 题目ID数组
            '组卷规则': []
          };
          $scope.sjArr = []; //试卷，可选，只有规则组卷该参数才有意义
          $scope.addSjz = { //添加试卷组的参数
            addTmc: false, //题目池
            tmcArr: [],
            useTk: false, //题库
            tkInfo: {
              '题库ID': '',
              '题库名称': ''
            },
            sltDati: '', //选定的大题
            sltTp: '' //选定的添加题目（固定 || 随机）
          };
          $scope.nanDuList = [
            {
              '难度ID': 1,
              '难度名称': '容易',
              ckd: false
            },
            {
              '难度ID': 2,
              '难度名称': '较易',
              ckd: false
            },
            {
              '难度ID': 3,
              '难度名称': '一般',
              ckd: false
            },
            {
              '难度ID': 4,
              '难度名称': '较难',
              ckd: false
            },
            {
              '难度ID': 5,
              '难度名称': '困难',
              ckd: false
            }
          ];
          $scope.tmNanDuList = angular.copy($scope.nanDuList);
          $scope.tiMuChi = [];
          $scope.tiXingNameArr = txName;
          kmTxData();
          qryTiKu();
          qryChuTiRen();
        };

        /**
         * 加载默认数据
         */
        getDaGangData();

        /**
         * 由所选的知识大纲，得到知识点 --
         */
        $scope.getDgZsdData = function(dgId){
          function _do(item) {
            item.ckd = false;
            item.fld = true;
            if(item['子节点'] && item['子节点'].length > 0){
              Lazy(item['子节点']).each(_do);
            }
          }
          var sltDg = Lazy($scope.allZsdgData).find(function(dg){
            return dg['知识大纲ID'] == dgId;
          });
          Lazy(sltDg['节点']).each(_do);
          $scope.kowledgeList = sltDg;
        };

        /**
        * 查询试卷概要的分页代码 --
        */
        $scope.getSjzPageData = function(pg){
          var pgNum = pg - 1;
          var currentPage = pgNum ? pgNum : 0;
          //得到分页数组的代码
          var currentPageVal = $scope.sjzPage.currentPage = pg ? pg : 1;
          if($scope.sjzPage.lastPage <= paginationLength){
            $scope.sjzPage.pages = $scope.sjzPage.allPages;
          }
          if($scope.sjzPage.lastPage > paginationLength){
            if(currentPageVal > 0 && currentPageVal <= 6 ){
              $scope.sjzPage.pages = $scope.sjzPage.allPages.slice(0, paginationLength);
            }
            else if(currentPageVal > $scope.sjzPage.lastPage - 5 && currentPageVal <= $scope.sjzPage.lastPage){
              $scope.sjzPage.pages = $scope.sjzPage.allPages.slice($scope.sjzPage.lastPage - paginationLength);
            }
            else{
              $scope.sjzPage.pages = $scope.sjzPage.allPages.slice(currentPageVal - 5, currentPageVal + 5);
            }
          }
          //查询数据的代码
          $scope.paperListData = originSjzData.slice(currentPage * itemNumPerPage, (currentPage + 1) * itemNumPerPage);
        };

        /**
         * 查看试卷列表
         */
        $scope.showPaperList = function(){
          $scope.zj_tabActive = 'shiJuan';
          $scope.showBackToPaperListBtn = false;
          $scope.zjDaGangListShow = false;
          qryShiJuanList();
          $scope.zjTpl = 'views/zujuan/zj_paperList.html';
        };
        //$scope.showPaperList();

        /**
         * 规则组卷
         */
        $scope.ruleMakePaper = function(){
          resetFun();
          $scope.sjzSet['组卷方式'] = '规则';
          $scope.zj_tabActive = 'ruleMakePaper';
          $scope.zjDaGangListShow = true; //控制加载规则组卷的css
          $scope.showBackToPaperListBtn = true;
          $scope.zjTpl = 'views/zujuan/zj_ruleMakePaper.html'; //加载规则组卷模板
        };
        $scope.ruleMakePaper();

        /**
         * 随机组卷
         */
        $scope.randomMakePaper = function(){
          resetFun();
          $scope.sjzSet['组卷方式'] = '随机';
          $scope.zj_tabActive = 'randomMakePaper';
        };

        /**
         * 试卷题型选择
         */
        $scope.checkTiXing = function(tx){
          tx.ckd = !tx.ckd;
          var findTar = Lazy($scope.sjzSet['组卷规则']).find(function(gz){
            return gz['题型ID'] == tx['题型ID'];
          });
          if(tx.ckd){
            if(!findTar){
              var obj = {
                '大题名称': tx['题型名称'],
                '题型ID': tx['题型ID'],
                '固定题目': [],
                '随机题目': []
              };
              $scope.sjzSet['组卷规则'].push(obj);
            }
          }
          else{
            if(findTar){
              $scope.sjzSet['组卷规则'] = Lazy($scope.sjzSet['组卷规则']).reject({'题型ID': tx['题型ID']}).toArray();
            }
          }
        };

        /**
        * 删除组卷的条件
        */
        $scope.deleteRule = function(sjtm, idx){
          sjtm.splice(idx, 1);
        };

        /**
         * 添加题目POP
         */
        $scope.addTiMuPop = function(dt, tp){
          $scope.addSjz.sltDati = dt || '';
          $scope.addSjz.sltTp = tp || '';
          if(tp == 'fiexd'){
            $scope.zuJuanParam.showTiMu = true;
            $scope.zuJuanParam.tmlTp = 'gdtm';
            Lazy($scope.kowledgeList['节点']).each(_zsdDo);
            qryTestFun(1);
          }
          if(tp == 'random'){
            $scope.zuJuanParam.rlTmc = false;
          }
        };

        /**
         * 关闭添加题目POP
         */
        $scope.closeAddTiMuPop = function(){
          $scope.addSjz.sltDati = '';
        };

        /**
         * 规则组卷得到题型信息
        */
        $scope.rmpGetTxId = function(txId){

          //queryZsdTiMuNum(txId);
        };

        /**
         * 获得难度查询条件 --
         */
        $scope.getNanDuId = function(nd, tp){
          var ndArr = [];
          nd.ckd = !nd.ckd;
          if(tp == 'zu'){
            Lazy($scope.nanDuList).each(function(ndl){
              if(ndl.ckd){
                ndArr.push(ndl['难度ID']);
              }
            });
            $scope.zuJuanParam.rlNd = ndArr;
          }
          if(tp == 'qr'){
            Lazy($scope.tmNanDuList).each(function(nd){
              if(nd.ckd){
                ndArr.push(nd['难度ID']);
              }
            });
            qryTmPar.nd = ndArr.length ? JSON.stringify(ndArr) : '';
            qryTestFun();
          }
        };

        /**
         * 得到题库ID
         */
        $scope.getTiKuId = function(tk, tp){
          var tkArr = [];
          tk.ckd = !tk.ckd;
          Lazy($scope.tiKuList).each(function(tkl){
            if(tkl.ckd){
              tkArr.push(tkl['题库ID']);
            }
          });
          $scope.zuJuanParam.rlTk = tkArr;
        };

        /**
         * 显示试题页面
         */
        $scope.showTiMuList = function(){
          $scope.zuJuanParam.showTiMu = true;
          $scope.zuJuanParam.tmlTp = 'tmc';
          Lazy($scope.kowledgeList['节点']).each(_zsdDo);
          qryTestFun(1);
        };

        /**
         * 添加全部题目到题目池
         */
        $scope.addTmToTmc = function(tp, tm){
          var data = [];
          if(tp == 'all'){
            data = allTiMuIds;
          }
          if(tp == 'page'){
            data = $scope.timuDetails;
          }
          if(tp == 'sgl'){
            data.push(tm);
            tm.ckd = true;
          }
          var disByTxId = Lazy(data).groupBy('题型ID').toObject();
          Lazy(disByTxId).each(function(v, k, l){
            var vIds = Lazy(v).map(function(tmlb){ return tmlb['题目ID'] }).toArray();
            $scope.sjzSet['题目池'] = Lazy($scope.sjzSet['题目池']).union(vIds).uniq().toArray();
            var fidTar = Lazy($scope.tiMuChi).find(function(tc){
              return tc['题型ID'] == k;
            });
            if(fidTar){
              fidTar['题目ID'] = Lazy(fidTar['题目ID']).union(vIds).uniq().toArray();
              fidTar['题目数量'] = fidTar['题目ID'].length || 0;
            }
            else{
              var obj = {
                '题型ID': k,
                '题型名称': txName[k - 1],
                '题目ID': vIds,
                '题目数量': vIds.length || 0
              };
              $scope.tiMuChi.push(obj);
            }
          });
        };

        /**
         * 清空题目池
         */
        $scope.cleanTiMuChi = function(){

        };

        /**
         * 得到分页数据 --
         */
        $scope.pageGetData = function(pg){
          var cPg = pg || 1;
          var paginationLength = 11; //分页部分，页码的长度，目前设定为11
          var totalPage = $scope.pageParam.lastPage;
          var pageArr = $scope.pageParam.pageArr; //页面数组
          $scope.currentPage = cPg;
          if(totalPage <= paginationLength){
            $scope.pages = pageArr;
          }
          if(totalPage > paginationLength){
            if(cPg > 0 && cPg <= 6 ){
              $scope.pages = pageArr.slice(0, paginationLength);
            }
            else if(cPg > totalPage - 5 && cPg <= totalPage){
              $scope.pages = pageArr.slice(totalPage - paginationLength);
            }
            else{
              $scope.pages = pageArr.slice(cPg - 6, cPg + 5);
            }
          }
          var tmlbArr = allTiMuIds.slice((cPg-1) * 15, cPg * 15);
          var tmIds = Lazy(tmlbArr).map(function(tm){return tm['题目ID']}).toArray();
          qryTiMuDetail(tmIds);
        };

        /**
         * 查询试题的函数 --
         */
        var qryTestFun = function(pg){
          $scope.loadingImgShow = true;
          tiMuIdArr = [];
          pageArr = [];
          var obj = {method:'GET', url:tiMuUrl, params:{'学校ID':jgID, '科目ID':keMuId, '返回题目内容':false}};
          if(qryTmPar.zsd && qryTmPar.zsd.length > 0){
            obj.params['知识点'] = JSON.stringify(qryTmPar.zsd);
          }
          if(qryTmPar.tx){
            obj.params['题型ID'] = qryTmPar.tx;
          }
          if(qryTmPar.tm){
            obj.params['题目ID'] = qryTmPar.tm;
          }
          if(qryTmPar.nd){
            obj.params['难度'] = qryTmPar.nd;
          }
          if(qryTmPar.tmly){
            obj.params['题目来源ID'] = qryTmPar.tmly;
          }
          if(qryTmPar.ctr){
            obj.params['出题人UID'] = qryTmPar.ctr;
          }
          if(qryTmPar.ltr){
            obj.params['录题人UID'] = qryTmPar.ltr;
          }
          if(qryTmPar.cjsjKs){
            obj.params['创建时间起始'] = DataService.formatDateZh(qryTmPar.cjsjKs);
          }
          if(qryTmPar.cjsjJs){
            obj.params['创建时间截止'] = DataService.formatDateZh(qryTmPar.cjsjJs);
          }
          $http(obj).success(function(tmlb){ //查询题目列表
            if(tmlb.result){
              var timuliebiao = Lazy(tmlb.data).reverse().toArray();
              allTiMuIds = angular.copy(timuliebiao);
              if(tmlb.data && tmlb.data.length > 0){
                pageMake(tmlb.data);
              }
              else{
                $scope.currentPage = '';
                $scope.pageParam.pageArr = [];
                $scope.pages = [];
                $scope.timuDetails = '';
                $scope.zuJuanParam.tiMuLen = '';
                allTiMuIds = '';
                DataService.alertInfFun('pmt', '没有查到符合条件的数据！');
              }
            }
            else{
              $scope.currentPage = '';
              $scope.pageParam.pageArr = [];
              $scope.pages = [];
              $scope.timuDetails = '';
              $scope.zuJuanParam.tiMuLen = '';
              allTiMuIds = '';
              DataService.alertInfFun('err', tmlb.error);
            }
            $scope.loadingImgShow = false;
          });
        };

        /**
         * 通过录题库查询试题 --
         */
        $scope.qryTiMuByTiKu = function(){
          qryTmPar.tk = $scope.zuJuanParam.tiKuId ? $scope.zuJuanParam.tiKuId : '';
          qryTestFun();
        };

        /**
         * 通过出题人的UID查询试题 --
         */
        $scope.qryTiMuByChuTiRenId = function(){
          qryTmPar.ctr = $scope.zuJuanParam.ctr ? $scope.zuJuanParam.ctr : '';
          qryTestFun();
        };

        /**
         * 通过题型ID查询题目
         */
        $scope.qryTiMuByTxId = function(){
          qryTmPar.tx = parseInt($scope.zuJuanParam.txId);
          qryTestFun();
        };

        /**
         * 通过创建时间查询试题 --
         */
        $scope.qryTiMuByCjsj = function(){
          if($scope.zuJuanParam.cjsjKs){
            qryTmPar.cjsjKs = $scope.zuJuanParam.cjsjKs;
            qryTmPar.cjsjJs = new Date();
            qryTestFun();
          }
        };

        /**
         * 得到特定页面的数据 --
         */
        $scope.getFixedPageData = function(){
          var goToPage = parseInt($scope.zuJuanParam.goToPageNum);
          if(goToPage && goToPage > 0 && goToPage <= $scope.pageParam.lastPage){
            $scope.pageGetData(goToPage);
          }
          else{
            DataService.alertInfFun('pmt', '请输入正确的跳转的页码！');
          }
        };

        /**
         * 返回规则组卷页面
         */
        $scope.backToSjz = function(){
          $scope.zuJuanParam.showTiMu = false;
        };

        /**
         * 点击展开和收起的按钮子一级显示和隐藏
         */
        $scope.toggleChildNode = function(nd) {
          function _do(item) {
            item.fld = nd.fld;
            if(item['子节点'] && item['子节点'].length > 0){
              Lazy(item['子节点']).each(_do);
            }
          }
          nd.fld = !nd.fld;
          Lazy(nd['子节点']).each(_do);
        };

        /**
         点击checkbox得到checkbox的值 --
         */
        $scope.toggleSelection = function(zsd) {
          function _do(item) {
            item.ckd = zsd.ckd;
            if(item['子节点'] && item['子节点'].length > 0){
              Lazy(item['子节点']).each(_do);
            }
          }
          zsd.ckd = !zsd.ckd;
          Lazy(zsd['子节点']).each(_do);
          selectZsdFun();
        };

        /**
        * 将题加入试卷
        */
        $scope.addToPaper = function(tm){
          tm.ckd = true;
          tm['分值'] = '';
          $scope.addSjz.sltDati['固定题目'].push(tm);
        };

        /**
         * 移除题目
         */
        $scope.removeOut = function(tm){
          tm.ckd = false;
          if($scope.zuJuanParam.tmlTp=='tmc'){ //题目池
            $scope.sjzSet['题目池'] = Lazy($scope.sjzSet['题目池']).without(tm['题目ID']).toArray();
            var fidTar = Lazy($scope.tiMuChi).find(function(tc){
              return tc['题型ID'] == tm['题型ID'];
            });
            if(fidTar){
              fidTar['题目ID'] = Lazy(fidTar['题目ID']).without(tm['题目ID']).toArray();
              fidTar['题目数量'] = fidTar['题目ID'].length || 0;
            }
          }
          if($scope.zuJuanParam.tmlTp=='gdtm'){ //固定题目
            $scope.addSjz.sltDati['固定题目'] = Lazy($scope.addSjz.sltDati['固定题目']).reject(function(tmd){
              return tmd['题目ID'] == tm['题目ID'];
            }).toArray();
          }
        };

        /**
        * 规则组卷将条件添加到相应的数组
        */
        $scope.addRule = function(){
          if($scope.addSjz.sltDati){
            var mis = [];
            var singleRl = {
              '题目分值': $scope.zuJuanParam.rlTmFz,
              '题目数量': $scope.zuJuanParam.rlTmNum,
              '使用题目池': $scope.zuJuanParam.rlTmc,
              '限定题库': $scope.zuJuanParam.rlTk,
              '题型': $scope.zuJuanParam.rlTxId,
              '难度': $scope.zuJuanParam.rlNd,
              '知识点': $scope.zuJuanParam.rlZsd
            };
            if(!$scope.zuJuanParam.rlTxId){
              mis.push('题型');
            }
            if(!$scope.zuJuanParam.rlTmNum){
              mis.push('题目数量');
            }
            if(!$scope.zuJuanParam.rlTmFz){
              mis.push('题目分值');
            }
            if(!$scope.zuJuanParam.rlNd.length){
              mis.push('难度');
            }
            if(!$scope.zuJuanParam.rlTk.length){
              mis.push('题库');
            }
            if(!$scope.zuJuanParam.rlZsd.length){
              mis.push('知识点');
            }
            if(mis && mis.length > 0){
              DataService.alertInfFun('pmt', '缺少：' + mis.join('，'));
            }
            else{
              $scope.addSjz.sltDati['随机题目'].push(singleRl);
            }
          }
          else{
            DataService.alertInfFun('pmt', '请选择大题！');
          }
        };

        /**
         * 生成试卷
         */
        $scope.generatePaper = function(pa){
          var gzObj = angular.copy($scope.sjzSet);
          Lazy(gzObj['组卷规则']).each(function(dt){
            var gdtmArr = angular.copy(dt['固定题目']);
            var newGdtm = [];
            Lazy(gdtmArr).each(function(tm){
              var ntm = {
                '题目ID': tm['题目ID'],
                '分值': parseInt(tm['分值'])
              };
              newGdtm.push(ntm);
            });
            dt['固定题目'] = newGdtm;
          });
          gzObj['试卷数量'] = parseInt(gzObj['试卷数量']);
          //gzObj['题目池'] = JSON.stringify(gzObj['题目池']);
          //gzObj['组卷规则'] = JSON.stringify(gzObj['组卷规则']);
          gzObj['限定时间'] = DataService.formatDateZh(gzObj['限定时间']);
          var obj = {
            method: 'POST',
            url: zuJuanUrl,
            data: {
              '学校ID': jgID,
              '科目ID': keMuId,
              '返回题目内容': true,
              '组卷规则': JSON.stringify(gzObj)
            }
          };
          $scope.sjList = '';
          if(pa){ //没有点击试卷预览
            obj.data['返回题目内容'] = false;
          }
          $scope.btnDisable = true;
          $http(obj).success(function(data){
            if(data.result){
              $scope.btnDisable = false;
              if(pa){ //没有点击试卷预览
                var objSjz = {
                  method: 'PUT',
                  url: shiJuanZuUrl,
                  data: {
                    '试卷组名称': $scope.zuJuanParam.sjzName,
                    '学校ID': jgID,
                    '科目ID': keMuId,
                    '试卷组设置': JSON.stringify(gzObj),
                    '试卷': JSON.stringify(data.data)
                  }
                };
                addSjzFun(objSjz);
              }
              else{
                $scope.sjList = data.data;
              }
            }
            else{
              $scope.btnDisable = false;
              DataService.alertInfFun('err', data.error);
            }
          });
        };

        /**
         * 保存组卷规则
         */
        $scope.saveZjRule = function(){
          var gzObj = angular.copy($scope.sjzSet);
          Lazy(gzObj['组卷规则']).each(function(dt){
            var gdtmArr = angular.copy(dt['固定题目']);
            var newGdtm = [];
            Lazy(gdtmArr).each(function(tm){
              var ntm = {
                '题目ID': tm['题目ID'],
                '分值': parseInt(tm['分值'])
              };
              newGdtm.push(ntm);
            });
            dt['固定题目'] = newGdtm;
          });
          gzObj['试卷数量'] = parseInt(gzObj['试卷数量']);
          //gzObj['题目池'] = JSON.stringify(gzObj['题目池']);
          //gzObj['组卷规则'] = JSON.stringify(gzObj['组卷规则']);
          gzObj['限定时间'] = DataService.formatDateZh(gzObj['限定时间']);
          var mis = [];
          var obj = {
            method: 'PUT',
            url: shiJuanZuUrl,
            data: {
              '试卷组名称': $scope.zuJuanParam.sjzName,
              '学校ID': jgID,
              '科目ID': keMuId,
              '试卷组设置': JSON.stringify(gzObj)
            }
          };
          if(!$scope.zuJuanParam.sjzName){
            mis.push('试卷组名称');
          }
          if(mis && mis.length > 0){
            DataService.alertInfFun('pmt', '缺少：' + mis.join('，'));
          }
          else{
            $scope.btnDisable = true;
            if($scope.sjzSet['组卷方式'] == '规则'){ //规则组卷
              if($scope.sjList && $scope.sjList.length > 0){ //点击了试卷预览
                Lazy($scope.sjList).each(function(sj){
                  Lazy(sj['试卷题目']).each(function(tm){
                    var oldStArr = angular.copy(tm['题目']);
                    var newStArr = [];
                    Lazy(oldStArr).each(function(st){
                      var tmObj = {
                        '题目ID': tm['题目ID'],
                        '分值': parseInt(tm['分值'])
                      };
                      newStArr.push(tmObj);
                    });
                    tm['题目'] = newStArr;
                  });
                });
                obj['试卷'] = JSON.stringify($scope.sjList);
                addSjzFun(obj);
              }
              else{ //没有点击试卷预览
                $scope.generatePaper(true);
              }
            }
            else{ //随机组卷，不需要预览试卷
              addSjzFun(obj);
            }
          }
        };

        /**
        * 重新加载 mathjax
        */
        $scope.$on('onRepeatLast', function(scope, element, attrs){
          MathJax.Hub.Config({
            tex2jax: {inlineMath: [["#$", "$#"]], displayMath: [['#$$','$$#']]},
            messageStyle: "none",
            showMathMenu: false,
            processEscapes: true
          });
          MathJax.Hub.Queue(["Typeset", MathJax.Hub, "daGangList"]);
          MathJax.Hub.Queue(["Typeset", MathJax.Hub, "testList"]);
          MathJax.Hub.Queue(["Typeset", MathJax.Hub, "zjTestList"]);
        });

        ///**
        // * kmtx.datiScore的值清零
        // */
        //var restoreKmtxDtscore = function(){
        //  Lazy($scope.kmtxList).each(function(kmtx, idx, lst){
        //    kmtx.datiScore = 0;
        //  });
        //};
        //
        ///**
        // * 点击,显示大纲列表
        // */
        //$scope.showDgList = function(dgl){ //dgl是判断da gang有没有数据
        //  if(dgl.length){
        //    $scope.dgListBox = $scope.dgListBox === false ? true: false; //点击是大纲列表展现
        //  }
        //};

        ///**
        // 点击checkbox得到checkbox的值(既是大纲知识点的值)
        // */
        //$scope.toggleSelection = function(zsdId) {
        //  var onSelect = '.select' + zsdId,
        //    gitThisChbx = $(onSelect),//得到那个展开和隐藏按钮被点击了
        //    getTarChbxChild = gitThisChbx.closest('li').find('>ul');//得到要隐藏的ul;
        //  gitThisChbx.closest('li').find('div.foldBtn').addClass('unfoldBtn'); //得到相邻的foldBtn元素,添加unfoldBtn样式
        //  gitThisChbx.closest('li').find('ul').show();//下面的子元素全部展开
        //  getTarChbxChild.find('input[name=point]').each(function() {
        //    if(gitThisChbx.prop("checked")) {
        //      this.checked = true;
        //    } else {
        //      this.checked = false;
        //    }
        //  });
        //  selectZsd = [];
        //  selectZsdName = [];
        //  var cbArray = $('input[name=point]'),
        //    cbl = cbArray.length;
        //  for( var i = 0; i < cbl; i++) {
        //    if(cbArray.eq(i).prop("checked")) {
        //      selectZsd.push(cbArray.eq(i).val());
        //      selectZsdName.push(cbArray.eq(i).data('zsdname'));
        //    }
        //  }
        //  zhishidian_id = selectZsd.toString();
        //  if($scope.zjTpl == 'views/zujuan/zj_testList.html'){
        //    $scope.qryTestFun();
        //  }
        //  if($scope.randomTestListShow){
        //    $scope.qryTestFun();
        //  }
        //};
        //
        ///**
        // * 组卷规则的难度选择
        // */
        //$scope.zjNanDuSelect = function(nd){
        //  $scope.zjNaDuStar = '';
        //  if(nd >= 0){
        //    $scope.zjNaDuStar = 'zj-style-star-' + nd;
        //    $scope.zuJuanParam.zjLastNd = nd;
        //  }
        //};
        //
        ///**
        // *查询科目（LingYu，url：/api/ling yu）
        // */
        //$scope.lyList = userInfo.LINGYU; //从用户详细信息中得到用户的lingyu
        //$scope.loadLingYu = function(){
        //  if($scope.keMuList){
        //    $scope.keMuList = false;
        //  }
        //  else{
        //    $scope.keMuList = true;
        //  }
        //};
        //
        ///**
        // * 查询试题的函数
        // */
        //$scope.qryTestFun = function(pg){
        //  $scope.loadingImgShow = true; //zj_testList.html
        //  var qrytimuliebiao; //查询题目列表的url
        //  var chuangJianRenUidArr = []; //创建人UID数组
        //  tiMuIdArr = [];
        //  pageArr = [];
        //  if(zhishidian_id){
        //    qrytimuliebiao = qrytimuliebiaoBase + '&tixing_id=' + tixing_id + '&nandu_id=' + nandu_id +
        //      '&zhishidian_id=' + zhishidian_id + '&chuangjianren_uid=' + $scope.zuJuanParam.tiMuAuthorId; //查询题目列表的url
        //  }
        //  else{
        //    qrytimuliebiao = qrytimuliebiaoBase + '&tixing_id=' + tixing_id + '&nandu_id=' + nandu_id +
        //      '&zhishidian_id=' + zsdgZsdArr.join() + '&chuangjianren_uid=' + $scope.zuJuanParam.tiMuAuthorId; //查询题目列表的url
        //  }
        //  //查询题库
        //  $http.get(qryTiKuUrl).success(function(tiku){
        //    if(tiku.length){
        //      $http.get(qrytimuliebiao).success(function(data){
        //        if(data.length){
        //          $scope.testListId = data;
        //          Lazy(data).each(function(tm, idx, lst){
        //            tiMuIdArr.push(tm.TIMU_ID);
        //            chuangJianRenUidArr.push(tm.CHUANGJIANREN_UID);
        //          });
        //          //获得一共多少页的代码开始
        //          totalPage = Math.ceil(data.length/itemNumPerPage);
        //          for(var i = 1; i <= totalPage; i++){
        //            pageArr.push(i);
        //          }
        //          $scope.lastPageNum = totalPage; //最后一页的数值
        //          //得到创建人uid和姓名的数组
        //          chuangJianRenUidArr = Lazy(chuangJianRenUidArr).uniq().sortBy().toArray().join();
        //          var getUserNameUrl = getUserNameBase + chuangJianRenUidArr;
        //          if($scope.zuJuanParam.isFirstEnterZuJuan){
        //            $http.get(getUserNameUrl).success(function(users){
        //              if(users && users.length > 0){
        //                $scope.chuTiRens = users;//创建人数组，临时性的 {uid: 1122, name: '邓继'}, {UID: 1122, XINGMING: '邓继'}
        //                $scope.chuTiRens.unshift({UID: 'allUsr', XINGMING: '全部出题人'});
        //                $scope.zuJuanParam.isFirstEnterZuJuan = false;
        //                //查询数据开始
        //                $scope.getThisPageData(pg);
        //              }
        //              else{
        //                $scope.chuTiRens = [];
        //                $scope.timudetails = null;
        //                DataService.alertInfFun('err', '查询创建人名称失败！'); //
        //                $scope.loadingImgShow = false; //testList.html loading
        //              }
        //            });
        //          }
        //          else{
        //            //查询数据开始
        //            $scope.getThisPageData(pg);
        //          }
        //        }
        //        else{
        //          tiMuIdArr = [];
        //          pageArr = [];
        //          totalPage = 0;
        //          $scope.lastPageNum = 0;
        //          $scope.pages = [];
        //          $scope.timudetails = '';
        //          $scope.testListId = [];
        //          DataService.alertInfFun('err', '没有相应的题目！'); //
        //          $scope.loadingImgShow = false; //testList.html loading
        //        }
        //      });
        //    }
        //    else{
        //      DataService.alertInfFun('err', '没有题库！'); //
        //      $scope.loadingImgShow = false; //testList.html loading
        //    }
        //  });
        //};
        //
        ///**
        // * 查询题目详情的分页代码
        // */
        //$scope.getThisPageData = function(pg){
        //  $scope.loadingImgShow = true; //zj_testList.html
        //  var qrytimuxiangqing,
        //    pgNum = pg - 1,
        //    timu_id,
        //    currentPage = pgNum ? pgNum : 0 ; //存放user id的数组
        //
        //  //得到分页数组的代码
        //  var currentPageNum = $scope.currentPageNum = pg ? pg : 1;
        //  if(totalPage <= paginationLength){
        //    $scope.pages = pageArr;
        //  }
        //  if(totalPage > paginationLength){
        //    if(currentPageNum > 0 && currentPageNum <= 6 ){
        //      $scope.pages = pageArr.slice(0, paginationLength);
        //    }
        //    else if(currentPageNum > totalPage - 5 && currentPageNum <= totalPage){
        //      $scope.pages = pageArr.slice(totalPage - paginationLength);
        //    }
        //    else{
        //      $scope.pages = pageArr.slice(currentPageNum - 5, currentPageNum + 5);
        //    }
        //  }
        //  //查询数据的代码
        //  if($scope.zuJuanParam.tiMuId){
        //    timu_id = $scope.zuJuanParam.tiMuId;
        //    $scope.pages = [1];
        //  }
        //  else{
        //    timu_id = tiMuIdArr.slice(currentPage * itemNumPerPage, (currentPage + 1) * itemNumPerPage).toString();
        //  }
        //  qrytimuxiangqing = qrytimuxiangqingBase + '&timu_id=' + timu_id; //查询详情url
        //  $http.get(qrytimuxiangqing).success(function(data){
        //    if(data.length){
        //      Lazy(data).each(function(tm, idx, lst){
        //        DataService.formatDaAn(tm);
        //        //件创建人的姓名加入到题目里面
        //        Lazy($scope.chuTiRens).each(function(usr, subidx, sublst){
        //          if(usr.UID == tm.CHUANGJIANREN_UID){
        //            tm.chuangjianren = usr.XINGMING;
        //          }
        //        });
        //      });
        //      $scope.loadingImgShow = false; //zj_testList.html
        //      $scope.timudetails = data;
        //      $scope.caozuoyuan = caozuoyuan;
        //      timudetails = data;
        //    }
        //    else{
        //      DataService.alertInfFun('err', '没有相关的题目！');
        //      $scope.loadingImgShow = false; //zj_testList.html
        //    }
        //  })
        //};
        //
        ///**
        // * 得到特定页面的数据
        // */
        //$scope.getFixedPageData = function(){
        //  var goToPage = parseInt($scope.zuJuanParam.goToPageNum);
        //  if(goToPage && goToPage > 0 && goToPage <= $scope.lastPageNum){
        //    $scope.getThisPageData(goToPage);
        //  }
        //  else{
        //    DataService.alertInfFun('pmt', '请输入正确的跳转的页码！');
        //  }
        //};
        //
        ///**
        // * 查询学校题库，val是true的话表示查询学校题库，否则查询个人题库
        // */
        //$scope.checkSchoolTiMu = function(val){
        //  if(val){
        //    checkSchoolTiKu = '';
        //    $scope.qryTestFun();
        //  }
        //  else{
        //    checkSchoolTiKu = caozuoyuan;
        //    $scope.qryTestFun();
        //  }
        //};
        //
        ///**
        // * 通过题目ID查询试题
        // */
        //$scope.qryTestByTiMuId = function(){
        //  tiMuIdArr = [];
        //  pageArr = [];
        //  if($scope.zuJuanParam.tiMuId){
        //    $scope.testListId = [];
        //    $scope.testListId.push($scope.zuJuanParam.tiMuId);
        //    tiMuIdArr.push($scope.zuJuanParam.tiMuId);
        //    totalPage = 1;
        //    pageArr = [1];
        //    $scope.lastPageNum = totalPage; //最后一页的数值
        //    $scope.zuJuanParam.tiMuAuthorId = ''; //互斥
        //    //题型和难度选题重置
        //    tixing_id = '';
        //    $scope.txSelectenIdx = 0;
        //    nandu_id = '';
        //    $scope.ndSelectenIdx = 0;
        //    $scope.getThisPageData();
        //  }
        //  else{
        //    DataService.alertInfFun('pmt', '请输入要查询的题目ID！');
        //  }
        //};
        //
        ///**
        // * 通过出题人的UID查询试题
        // */
        //$scope.qryTiMuByChuTiRenId = function(){
        //  if($scope.zuJuanParam.tiMuAuthorId){
        //    if($scope.zuJuanParam.tiMuAuthorId == 'allUsr'){
        //      $scope.zuJuanParam.tiMuAuthorId = '';
        //    }
        //    $scope.zuJuanParam.tiMuId = ''; //互斥
        //    $scope.qryTestFun();
        //  }
        //};
        //
        ///**
        // * 获得题型查询条件
        // */
        //$scope.getTiXingId = function(qrytxId){
        //  if(qrytxId >= 1){
        //    tixing_id = qrytxId;
        //    $scope.txSelectenIdx = qrytxId;
        //  }
        //  else{
        //    tixing_id = '';
        //    $scope.txSelectenIdx = 0;
        //  }
        //  $scope.zuJuanParam.tiMuId = '';
        //  queryZsdTiMuNum(qrytxId);
        //  $scope.qryTestFun();
        //};

        ///**
        // * 提交临时模板的数据
        // */
        //var getShiJuanMuBanData = function(){
        //  var deferred = $q.defer();
        //  mbdt_data = []; // 得到模板大题的数组
        //  Lazy($scope.kmtxList).each(function(kmtx, idx, lst){
        //    var mubandatiItem = {
        //      MUBANDATI_ID: '',
        //      DATIMINGCHENG: '',
        //      SHUOMINGDAOYU:'',
        //      TIMUSHULIANG: '',
        //      MEITIFENZHI: '',
        //      XUHAO: '',
        //      ZHUANGTAI: 1,
        //      TIMUARR:[],//自己添加的数组
        //      datiScore: ''//自己定义此大题的分数
        //    };
        //    mubandatiItem.MUBANDATI_ID = kmtx.TIXING_ID;
        //    mubandatiItem.DATIMINGCHENG = kmtx.TIXINGMINGCHENG;
        //    mubandatiItem.XUHAO = kmtx.TIXING_ID;
        //    mubanData.shuju.MUBANDATI.push(mubandatiItem);
        //    mbdt_data.push(mubandatiItem);
        //  });
        //  $http.post(xgmbUrl, mubanData).success(function(data){
        //    if(data.result){
        //      $rootScope.session.lsmb_id.push(data.id); //新创建的临时模板id
        //      shijuanData.shuju.SHIJUANMUBAN_ID = data.id; //将创建的临时试卷模板id赋值给试卷的试卷模板id
        //      deferred.resolve();
        //    }
        //    else{
        //      DataService.alertInfFun('err', data.error);
        //      deferred.reject();
        //    }
        //  });
        //  return deferred.promise;
        //};
        //
        ///**
        // * 显示试题列表
        // */
        //$scope.showTestList = function(txid){
        //  $scope.paper_hand_form = true;
        //  $scope.shijuanyulanBtn = true;
        //  //查询试题的函数
        //  $scope.getTiXingId(txid);
        //  $scope.txSelectenIdx = txid ? txid : 0;
        //  $scope.zjTpl = 'views/zujuan/zj_testList.html';
        //  $scope.sjPreview = false;
        //};
        //
        ///**
        // * 点击添加新试卷，显示组卷列表
        // */
        //$scope.showZuJuanPage = function(){
        //  $scope.dropMakePaper();
        //  var promise = getShiJuanMuBanData(); //保存试卷模板成功以后r
        //  promise.then(function(){
        //    $scope.zj_tabActive = 'addNewShiJuan';
        //    $scope.zjDaGangListShow = false;
        //    $scope.showBackToPaperListBtn = true;
        //    $scope.zuJuanParam.sjzj_zongfen = 0;
        //    $scope.zjTpl = 'views/zujuan/zj_addNewShiJuan.html';
        //  });
        //};
        //
        ///**
        // *  手动添加试题
        // */
        $scope.manualAddTm = function(txid){
        //  $scope.showTestList(txid);
        //  $scope.shijuanyulanBtn = true; //试卷预览的按钮
        //  $scope.fangqibencizujuanBtn = true; //放弃本次组卷的按钮
        //  $scope.baocunshijuanBtn = true; //保存试卷的按钮
        //  zhishidian_id = '';
        //  $scope.zjDaGangListShow = true; //控制加载规则组卷的css
        };

        ///**
        // * 如果选出的题目没有达到规则规定的数量，运行的函数
        // */
        //var findWhichRuleHasNoItem = function(ruleData, tiMuTjData, itemData){
        //  var txArrs = [], groupObj;
        //  $scope.zuJuanParam.xuanTiError = [];
        //  Lazy(ruleData).each(function(rl, idx, lst){
        //    if(rl.txTotalNum > 0 && (rl.txTotalNum != tiMuTjData[idx].itemsNum)){
        //      txArrs = Lazy(itemData).filter(function(item){ return item.TIXING_ID == rl.TIXING_ID; }).toArray();
        //      groupObj = Lazy(txArrs).groupBy(function(tm){ return tm.NANDU_ID; }).toObject();
        //      Lazy(rl.zsdXuanTiArr).each(function(xt, subIdx, subLst){
        //        var errorTx = {
        //          errTxName: '',
        //          errNanDu: '',
        //          lessenVal: ''
        //        };
        //        if(groupObj[xt.NANDU * 5] && groupObj[xt.NANDU * 5].length > 0){
        //          if(xt.TIXING[0].COUNT != groupObj[xt.NANDU * 5].length){
        //            errorTx.errTxName = rl.TIXINGMINGCHENG;
        //            errorTx.errNanDu = xt.NANDU * 5;
        //            errorTx.lessenVal = parseInt(xt.TIXING[0].COUNT) - parseInt(groupObj[xt.NANDU * 5].length);
        //            $scope.zuJuanParam.xuanTiError.push(errorTx);
        //          }
        //        }
        //        else{
        //          errorTx.errTxName = rl.TIXINGMINGCHENG;
        //          errorTx.errNanDu = xt.NANDU * 5;
        //          errorTx.lessenVal = parseInt(xt.TIXING[0].COUNT);
        //          $scope.zuJuanParam.xuanTiError.push(errorTx);
        //        }
        //      });
        //    }
        //  });
        //};
        //
        ///**
        // * 关闭规则组卷题目数量不匹配的信息窗口
        // */
        //$scope.closeRuleZuJuanTiMuNumErr = function(){
        //  $scope.zuJuanParam.xuanTiError = [];
        //};
        //
        ///**
        // * 由规则列表页直接组卷
        // */
        //$scope.directRuleMakePaper = function(dzjr){
        //  $scope.loadingImgShow = true;
        //  var promise = getShiJuanMuBanData(); //保存试卷模板成功以后
        //  promise.then(function(){
        //    //去选题
        //    var directRuleMakePaperData = JSON.parse(dzjr.GUIZEBIANMA),
        //      totalTiMuNums;
        //    Lazy(dzjr.txTongJi).each(function(txArr, idx, lst){
        //      if(txArr.zsdXuanTiArr.length){
        //        totalTiMuNums += txArr.txTotalNum;
        //      }
        //    });
        //    $http.post(guiZeZuJuanUrl, directRuleMakePaperData).success(function(tmIdsData){
        //      if(tmIdsData.length){
        //        var qrytimuxiangqing = qrytimuxiangqingBase + '&timu_id=' + tmIdsData.toString(); //查询详情url
        //        $http.get(qrytimuxiangqing).success(function(stdata){
        //          if(stdata.length){
        //            Lazy(stdata).each(function(tm, idx, lst){
        //              //将试题详情添加到mabandData
        //              Lazy(mubanData.shuju.MUBANDATI).each(function(mbdt, subIdx, lst){
        //                if(mbdt.MUBANDATI_ID == tm.TIXING_ID){
        //                  mbdt.TIMUARR.push(tm);
        //                }
        //              });
        //              //难度统计  nanduTempData NANDU_ID
        //              for(var j = 0; j < nanduLength; j++){
        //                if(nanduTempData[j].nanduId == tm.NANDU_ID){
        //                  nanduTempData[j].nanduCount.push(tm.TIMU_ID);
        //                }
        //              }
        //            });
        //            //统计每种题型的数量和百分比
        //            //Lazy(mubanData.shuju.MUBANDATI).each(function(mbdt, idx, lst){
        //            //  tixingStatistics(idx, kmtxListLength);
        //            //});
        //            nanduPercent(); //难度统计
        //            //判读是否执行完成
        //            $scope.fangqibencizujuanBtn = true; //放弃本次组卷的按钮
        //            $scope.baocunshijuanBtn = true; //保存试卷的按钮
        //            $scope.loadingImgShow = false;
        //            $scope.zjDaGangListShow = false; //控制加载规则组卷的css
        //            //新增加
        //            zuJuanRuleStr = JSON.stringify(directRuleMakePaperData);
        //            $scope.showBackToPaperListBtn = true;
        //            isComeFromRuleList = true;
        //            comeFromRuleListData = dzjr;
        //            //试卷预览
        //            $scope.shijuanPreview();
        //            //规则题目数量与已选出的题目的对比
        //            if(stdata.length != totalTiMuNums){
        //              findWhichRuleHasNoItem(dzjr.txTongJi, $scope.kmtxList, stdata);
        //            }
        //          }
        //          else{
        //            $scope.timudetails = null;
        //            $scope.loadingImgShow = false;
        //            DataService.alertInfFun('err', stdata.error);
        //          }
        //        });
        //      }
        //      else{
        //        $scope.loadingImgShow = false;
        //        DataService.alertInfFun('err', tmIdsData.error);
        //      }
        //    });
        //  });
        //};
        //
        ///**
        // * 返回到组卷的3中情形页面
        // */
        //$scope.ruleBackToZuJuanHome = function(){
        //  Lazy($scope.ampKmtxWeb).each(function(ampw, idx, lst){
        //    ampw.txTotalNum = 0;
        //    ampw.zsdXuanTiArr = [];
        //  });
        //  $scope.totalSelectedItmes = 0; //已选试题的总数量
        //  $scope.addMoreTiMuBtn = false; //添加试卷按钮隐藏
        //  //$scope.autoMakePaperClass = false; //加载自动组卷的样式
        //  //clearData()代码
        //  mubanData.shuju.MUBANDATI = []; //清除模板中试题的临时数据
        //  shijuanData.shuju.SHIJUAN_TIMU = []; //清除试卷中的数据
        //  shijuanData.shuju.SHIJUANMINGCHENG = ''; //试卷名称重置
        //  shijuanData.shuju.FUBIAOTI = ''; //试卷副标题重置
        //  shijuanData.shuju.SHIJUANMUBAN_ID = ''; //删除试卷中的试卷模板id
        //  shijuanData.shuju.SHIJUAN_ID = ''; //清楚试卷id
        //  mubanData.shuju.ZONGDAOYU = ''; //试卷模板总导语重置
        //  Lazy($scope.nanduTempData).each(function(ndkmtx, idx, lst){ //清除难度的数据
        //    ndkmtx.nanduCount = [];
        //    ndkmtx.ndPercentNum = '0%';
        //    return ndkmtx;
        //  });
        //  Lazy($scope.kmtxList).each(function(tjkmtx, idx, lst){ //清除科目题型的统计数据
        //    tjkmtx.itemsNum = 0;
        //    tjkmtx.txPercentNum = '0%';
        //    return tjkmtx;
        //  });
        //  $scope.selectTestStr = ''; //清除试题加入和移除按钮
        //  $scope.shijuanyulanBtn = false; //试卷预览的按钮
        //  $scope.fangqibencizujuanBtn = false; //放弃本次组卷的按钮
        //  $scope.baocunshijuanBtn = false; //保存试卷的按钮
        //  deleteTempTemp();
        //  restoreKmtxDtscore();
        //  $scope.zjDaGangListShow = false; //控制加载规则组卷的css
        //  //返回组卷页面还是组卷规则列表页
        //  $scope.paper_hand_form = false; //手动组卷时添加的样式
        //  $scope.sjPreview = false;
        //  if(isComeFromRuleList){
        //    $scope.showBackToPaperListBtn = false;
        //    $scope.zj_tabActive = 'zjRule';
        //    isComeFromRuleList = false;
        //    comeFromRuleListData = '';
        //  }
        //  else{
        //    $scope.zjTpl = 'views/zujuan/paper_preview.html'; //加载试卷预览模板
        //  }
        //};

        ///**
        // * 规则组卷将条件添加到相应的数组
        // */
        //$scope.addRuleCondition = function(){
        //  var targetTx = {
        //      NANDU: '', // 难度系数
        //      ZHISHIDIAN: [], //知识点ID, 数组
        //      zsdNameArr: [], //知识点名称, 数组
        //      PIPEIDU: 1, //匹配度
        //      TIXING: [{
        //        TIXING_ID: '',
        //        COUNT: ''
        //      }] //{TIXING_ID: 1, COUNT: 10}
        //    },
        //    txNumClass = $('.ruleMakePaper-header input.txNum'),
        //    txNum = parseInt(txNumClass.val()),
        //    coefftRule = (parseInt($scope.zuJuanParam.zjLastNd) - 1) * 0.25;
        //  if(selectZsd.length){
        //    if(ruleMakePaperSelectTxid){
        //      if(txNum){
        //        if(coefftRule){
        //          targetTx.TIXING[0].TIXING_ID = ruleMakePaperSelectTxid;
        //          targetTx.TIXING[0].COUNT = txNum;
        //          targetTx.NANDU = coefftRule;
        //          targetTx.ZHISHIDIAN = selectZsd;
        //          targetTx.zsdNameArr = selectZsdName;
        //          Lazy($scope.ampKmtxWeb).each(function(txw, idx, lst){
        //            if(txw.TIXING_ID == targetTx.TIXING[0].TIXING_ID){
        //              txw.zsdXuanTiArr.push(targetTx);
        //              txw.txTotalNum += targetTx.TIXING[0].COUNT;//统计题目数量
        //            }
        //          });
        //          //将规则大题添加的模板数组
        //          if($scope.zj_tabActive == 'addNewShiJuan'){
        //            var idxNum = ''; //符合数据的索引
        //            var mbdtArr = [];
        //            var ruleInMbda = Lazy(mubanData.shuju.MUBANDATI).find(function(mbdt, idx, lst){
        //              if(mbdt.MUBANDATI_ID == ruleMakePaperSelectTxid){
        //                idxNum = idx;
        //                return mbdt;
        //              }
        //            });
        //            if(ruleInMbda){
        //              mubanData.shuju.MUBANDATI[idxNum].daTiNeedShow = true;
        //            }
        //            else{
        //              var mubandatiItem = {
        //                MUBANDATI_ID: ruleMakePaperSelectTxid,
        //                DATIMINGCHENG: $scope.tiXingNameArr[parseInt(ruleMakePaperSelectTxid) - 1],
        //                SHUOMINGDAOYU:'',
        //                TIMUSHULIANG: '',
        //                MEITIFENZHI: '',
        //                XUHAO: '',
        //                ZHUANGTAI: 1,
        //                TIMUARR:[], //自己添加的数组
        //                datiScore: '', //自己定义此大题的分数
        //                daTiNeedShow: true
        //              };
        //              mubanData.shuju.MUBANDATI.push(mubandatiItem);
        //            }
        //            //判断TIMUARR有题或者添加了大题规则
        //            Lazy(mubanData.shuju.MUBANDATI).each(function(mbdt){
        //              mbdt.tiMuTotalNum = mbdt.TIMUARR.length || 0;
        //              if(mbdt.daTiNeedShow || mbdt.TIMUARR.length > 0){
        //                mbdt.daTiNeedShow = true;
        //                var findInRuleArr = Lazy($scope.ampKmtxWeb).find(function(ruleData){
        //                  return ruleData.TIXING_ID == mbdt.MUBANDATI_ID;
        //                });
        //                if(findInRuleArr){
        //                  mbdt.tiMuTotalNum += findInRuleArr.txTotalNum;
        //                }
        //              }
        //              if(mbdt.tiMuTotalNum > 0){
        //                mbdtArr.push(mbdt);
        //              }
        //              mubanData.shuju.MUBANDATI = mbdtArr;
        //              $scope.mubanData = mubanData;
        //            });
        //          }
        //          txNumClass.val(''); //重置题目数量
        //          $('input[name=point]:checked').prop('checked', false);//重置知识点
        //          selectZsd = [];
        //          selectZsdName = [];
        //          $('.zj-style-star li').removeClass('active');
        //          $scope.zuJuanParam.zjLastNd = '';
        //          $scope.zjNaDuStar = '';
        //        }
        //        else{
        //          DataService.alertInfFun('pmt', '请选择难度！');
        //        }
        //      }
        //      else{
        //        DataService.alertInfFun('pmt', '请填写数量！');
        //      }
        //    }
        //    else{
        //      DataService.alertInfFun('pmt', '请选择题型！');
        //    }
        //  }
        //  else{
        //    DataService.alertInfFun('pmt', '请选择知识点！');
        //  }
        //};
        //
        ///**
        // * 删除组卷的条件
        // */
        //$scope.deleteRuleCondition = function(txw, idx){
        //  txw.txTotalNum -= parseInt(txw.zsdXuanTiArr[idx].TIXING[0].COUNT);
        //  //删除模板大题里的题目数量统计
        //  if($scope.zj_tabActive == 'addNewShiJuan'){
        //    Lazy(mubanData.shuju.MUBANDATI).each(function(mbdt){
        //      if(mbdt.MUBANDATI_ID == txw.TIXING_ID){
        //        mbdt.tiMuTotalNum -= parseInt(txw.zsdXuanTiArr[idx].TIXING[0].COUNT);
        //        if(mbdt.tiMuTotalNum == 0){
        //          mbdt.daTiNeedShow = false;
        //        }
        //      }
        //    });
        //  }
        //  txw.zsdXuanTiArr.splice(idx, 1);
        //};
        //
        ///**
        // * 组卷规则的增删改
        // */
        //$scope.saveZjRule = function(rule, opt, isSavePaper){
        //  //rule是具体的数据，opt是要实现的功能sav(保存), upd(修改), del(删除)
        //  var ruleData = {
        //      token: token,
        //      caozuoyuan: caozuoyuan,
        //      lingyuid: lingyuid,
        //      shuju:{
        //        XUANTIGUIZE_ID: '',//选题规则ID (留空表示新建)
        //        GUIZEMINGCHENG: '',// 规则名称
        //        GUIZEBIANMA: '',//规则编码
        //        GUIZESHUOMING: '', //规则说明
        //        ZHUANGTAI: 1 //状态(-1表示删除, 否则表示添加或修改)
        //      }
        //    },
        //    date = new Date(),
        //    monthStr = (date.getMonth() + 1) > 9 ? (date.getMonth() + 1) : ('0' + (date.getMonth() + 1)),
        //    dayStr = date.getDate() > 9 ? date.getDate() : ('0' + date.getDate()),
        //    currentDate = monthStr.toString() + dayStr.toString(), //当前的日期
        //    saveZjRuleFun = function(){
        //      $http.post(updateXuanTiRule, ruleData).success(function(data){
        //        if(data.id){
        //          if(isSavePaper){ //判断是否为保存试卷，如果是话，更新使用次数
        //            var guizeTouch = {
        //              token: token,
        //              caozuoyuan: caozuoyuan,
        //              xuantiguize_id: data.id
        //            };
        //            $http.post(updateRuleUseTimes, guizeTouch).success(function(subData){
        //              if(subData.result){
        //                isComeFromRuleList = false;
        //                comeFromRuleListData = '';
        //              }
        //              else{
        //                DataService.alertInfFun('err', subData.error);
        //              }
        //            });
        //          }
        //          else{
        //            qryZjRule();
        //          }
        //        }
        //        else{
        //          DataService.alertInfFun('pmt', data.error);
        //        }
        //      });
        //    };
        //  if(opt == 'sav'){
        //    ruleData.shuju.GUIZEMINGCHENG = '组卷规则' + currentDate;
        //    ruleData.shuju.GUIZEBIANMA = rule;
        //  }
        //  if(opt == 'upd'){
        //    ruleData.shuju.XUANTIGUIZE_ID = rule.XUANTIGUIZE_ID;
        //    ruleData.shuju.GUIZEMINGCHENG = rule.GUIZEMINGCHENG;
        //    ruleData.shuju.GUIZEBIANMA = rule.GUIZEBIANMA;
        //    ruleData.shuju.GUIZESHUOMING = rule.GUIZESHUOMING;
        //  }
        //  if(opt == 'del'){
        //    ruleData.shuju.XUANTIGUIZE_ID = rule;
        //    ruleData.shuju.ZHUANGTAI = -1;
        //  }
        //  if(ruleData.shuju.GUIZEBIANMA.length || ruleData.shuju.XUANTIGUIZE_ID){
        //    if(opt == 'del'){
        //      if(confirm('确定要删除此规则吗？')){
        //        saveZjRuleFun();
        //      }
        //    }
        //    else{
        //      saveZjRuleFun();
        //    }
        //  }
        //};
        //
        ///**
        // * 查询组卷规则
        // */
        //var qryZjRule = function(rId){
        //  $scope.loadingImgShow = true; //zj_ruleList.html
        //  var qryXuanTiRule;
        //  if(rId){
        //    qryXuanTiRule = qryXuanTiRuleBase + '&xuantiguize_id=' + rId;
        //  }
        //  else{
        //    qryXuanTiRule = qryXuanTiRuleBase;
        //  }
        //  $http.get(qryXuanTiRule).success(function(data){
        //    if(data){
        //      $scope.loadingImgShow = false; //zj_ruleList.html
        //      Lazy(data).each(function(rule, idx, lst){
        //        //给查询出来的数组重新赋值
        //        rule.txTongJi = [];
        //        Lazy($scope.ampKmtxWeb).each(function(wcont, idx1, lst1){
        //          var txTotalObj = {
        //            TIXING_ID: '',
        //            TIXINGMINGCHENG: '',
        //            txTotalNum: 0,
        //            zsdXuanTiArr:[]
        //          };
        //          txTotalObj.TIXING_ID = wcont.TIXING_ID;
        //          txTotalObj.TIXINGMINGCHENG = wcont.TIXINGMINGCHENG;
        //          rule.txTongJi.push(txTotalObj);
        //        });
        //        //统计具体的数字
        //        var ruleObj = JSON.parse(rule.GUIZEBIANMA);
        //        Lazy(ruleObj.shuju.items).each(function(it, subIdx, subLst){
        //          Lazy(rule.txTongJi).each(function(ampw, idx3, lst3){
        //            if(ampw.TIXING_ID == it.TIXING[0].TIXING_ID){
        //              ampw.txTotalNum += it.TIXING[0].COUNT;
        //              ampw.zsdXuanTiArr.push(it);
        //            }
        //          });
        //        });
        //      });
        //      $scope.zjRuleData = data;
        //    }
        //    else{
        //      $scope.loadingImgShow = false; //zj_ruleList.html
        //      DataService.alertInfFun('err', data.error);
        //    }
        //  });
        //};
        //
        ///**
        // * 检查下拉框的去重数据
        // */
        //$scope.checkSelectQuChongNum = function(){
        //  if($scope.zuJuanParam.selectQuChongNum) {
        //    $scope.zuJuanParam.inputQuChongNum = '';
        //    $scope.zuJuanParam.quChongNum = $scope.zuJuanParam.selectQuChongNum;
        //  }
        //};
        //
        ///**
        // * 检查下拉框的去重数据
        // */
        //$scope.checkInPutQuChongNum = function(){
        //  if(isNaN($scope.zuJuanParam.inputQuChongNum)){
        //    $scope.zuJuanParam.inputQuChongNum = '';
        //  }
        //  if($scope.zuJuanParam.inputQuChongNum) {
        //    $scope.zuJuanParam.selectQuChongNum = '';
        //    $scope.zuJuanParam.quChongNum = parseInt($scope.zuJuanParam.inputQuChongNum);
        //  }
        //};
        //
        ///**
        // * 保存规则组卷数据
        // */
        //$scope.addRuleMakePaperShiJuan = function(){
        //  var distAutoMakePaperData = {
        //      token: token,
        //      caozuoyuan: caozuoyuan,
        //      jigouid: jigouid,
        //      lingyuid: lingyuid,
        //      shuju:{
        //        items: []
        //      }
        //    },
        //    totalTiMuNums = 0; //规则组卷出题的总数量
        //  $scope.ruleMakePaperSaveBtnDisabled = true;
        //  //得到题型数量和难度的数组
        //  Lazy($scope.ampKmtxWeb).each(function(txArr, idx, lst){
        //    if(txArr.zsdXuanTiArr.length){
        //      totalTiMuNums += txArr.txTotalNum;
        //      Lazy(txArr.zsdXuanTiArr).each(function(ntx, subIdx, subLst){
        //        distAutoMakePaperData.shuju.items.push(ntx);
        //      });
        //    }
        //  });
        //  if($scope.zuJuanParam.inputQuChongNum || $scope.zuJuanParam.selectQuChongNum){
        //    if($scope.zuJuanParam.quChongNum){
        //      distAutoMakePaperData.shuju.exclude = { type: "year", value: $scope.zuJuanParam.quChongNum };
        //    }
        //  }
        //  else{
        //    $scope.zuJuanParam.quChongNum = '';
        //  }
        //  if(distAutoMakePaperData.shuju.items.length){
        //    $scope.loadingImgShow = true;
        //    $http.post(guiZeZuJuanUrl, distAutoMakePaperData).success(function(tmIdsData){
        //      if(tmIdsData.length){
        //        var qrytimuxiangqing = qrytimuxiangqingBase + '&timu_id=' + tmIdsData.toString(); //查询详情url
        //        $http.get(qrytimuxiangqing).success(function(stdata){
        //          if(stdata.length){
        //            Lazy(stdata).each(function(tm, idx, lst){
        //              //将试题详情添加到mabandData
        //              Lazy(mubanData.shuju.MUBANDATI).each(function(mbdt, subIdx, lst){
        //                if(mbdt.MUBANDATI_ID == tm.TIXING_ID){
        //                  mbdt.TIMUARR.push(tm);
        //                }
        //              });
        //              //难度统计  nanduTempData NANDU_ID
        //              for(var j = 0; j < nanduLength; j++){
        //                if(nanduTempData[j].nanduId == tm.NANDU_ID){
        //                  nanduTempData[j].nanduCount.push(tm.TIMU_ID);
        //                }
        //              }
        //            });
        //            //统计每种题型的数量和百分比
        //            //Lazy(mubanData.shuju.MUBANDATI).each(function(mbdt, idx, lst){
        //            //  tixingStatistics(idx, kmtxListLength);
        //            //});
        //            nanduPercent(); //难度统计
        //            //判读是否执行完成
        //            $scope.fangqibencizujuanBtn = true; //放弃本次组卷的按钮
        //            $scope.baocunshijuanBtn = true; //保存试卷的按钮
        //            $scope.shijuanPreview();
        //            $scope.loadingImgShow = false;
        //            $scope.zjDaGangListShow = false; //控制加载规则组卷的css
        //            //规则题目数量与已选出的题目的对比
        //            if(stdata.length != totalTiMuNums){
        //              findWhichRuleHasNoItem($scope.ampKmtxWeb, $scope.kmtxList, stdata);
        //            }
        //            //保存规则用到的转化
        //            zuJuanRuleStr = JSON.stringify(distAutoMakePaperData);
        //            $scope.ruleMakePaperSaveBtnDisabled = false;
        //            comeFromRuleMakePaper = true;
        //          }
        //          else{
        //            $scope.timudetails = null;
        //            $scope.loadingImgShow = false;
        //            $scope.ruleMakePaperSaveBtnDisabled = false;
        //            comeFromRuleMakePaper = false;
        //            DataService.alertInfFun('err', stdata.error);
        //          }
        //        });
        //      }
        //      else{
        //        $scope.loadingImgShow = false;
        //        $scope.ruleMakePaperSaveBtnDisabled = false;
        //        DataService.alertInfFun('pmt', tmIdsData.error);
        //      }
        //    });
        //  }
        //  else{
        //    $scope.loadingImgShow = false;
        //    $scope.ruleMakePaperSaveBtnDisabled = false;
        //    DataService.alertInfFun('err', '请选择题型！');
        //  }
        //};
        //
        ///**
        //* 随机试题
        //*/
        $scope.randomAddTm = function(){
        //  isComeFromRuleList = false;
        //  $scope.zuJuanParam.zjLastNd = '';
        //  comeFromRuleListData = '';
        //  $scope.ruleMakePaperTx = { selectTx: null };
        //  $scope.zjDaGangListShow = true; //控制加载规则组卷的css
        //  $scope.showBackToPaperListBtn = true;
        };
        //
        ///**
        // * 随机组卷显示试题
        // */
        //$scope.randomMpShowItem = function(){
        //  zhishidian_id = '';
        //  $scope.qryTestFun();
        //  $scope.randomTestListShow = true;
        //};
        //
        ///**
        // * 由收到组卷返回的组卷的首页
        // */
        //var backToZjHomeFun = function(){
        //  $scope.paper_hand_form = false; //手动组卷时添加的样式
        //  if($scope.zj_tabActive == 'addNewShiJuan'){
        //    $scope.zjTpl = 'views/zujuan/zj_addNewShiJuan.html'; //加载新增试卷预览模板
        //  }
        //  else{
        //    $scope.zjTpl = 'views/zujuan/paper_preview.html'; //加载试卷预览模板
        //  }
        //};
        //$scope.backToZjHome = function(){
        //  backToZjHomeFun();
        //  $scope.sjPreview = false;
        //};
        //
        ///**
        // * 题型统计的函数
        // */
        ////var tixingStatistics = function(lv1, lv2){
        ////  for(var lp = 0; lp < lv2; lp++){
        ////    if(mubanData.shuju.MUBANDATI[lv1].MUBANDATI_ID == $scope.kmtxList[lp].TIXING_ID){
        ////      $scope.kmtxList[lp].itemsNum =  mubanData.shuju.MUBANDATI[lv1].TIMUARR.length;
        ////      //得到总题量
        ////      var tixingSum = Lazy($scope.kmtxList).reduce(function(memo, itm){
        ////        var itemNumVal = itm.itemsNum ? itm.itemsNum : 0;
        ////        return memo + itemNumVal;
        ////      },0);
        ////      //得到已选试题的总量
        ////      $scope.totalSelectedItmes = tixingSum;
        ////      //计算每种题型的百分比
        ////      Lazy($scope.kmtxList).each( function(tjkmtx, idx, lst){
        ////        var itemNumVal = tjkmtx.itemsNum ? tjkmtx.itemsNum : 0,
        ////          percentVal = ((itemNumVal/tixingSum)*100).toFixed(0) + '%';
        ////        return tjkmtx.txPercentNum = percentVal;
        ////      });
        ////    }
        ////  }
        ////};

        //
        ///**
        // * 将题移除试卷
        // */
        //$scope.removeOutPaper = function(tm){
        //  var mbdtdLength = mubanData.shuju.MUBANDATI.length;
        //  shijuanData.shuju.SHIJUAN_TIMU = Lazy(shijuanData.shuju.SHIJUAN_TIMU).reject(function(shtm){
        //    return shtm.TIMU_ID  == tm.TIMU_ID;
        //  }).toArray();
        //  //加入试卷按钮和移除试卷按钮的显示和隐藏
        //  addOrRemoveItemToPaper(shijuanData.shuju.SHIJUAN_TIMU);
        //  //难度统计
        //  for(var k = 0; k < nanduLength; k++){
        //    if(nanduTempData[k].nanduId == tm.NANDU_ID){
        //      var ndCountLenght = nanduTempData[k].nanduCount.length;
        //      for(var l = 0; l < ndCountLenght; l++){
        //        if(nanduTempData[k].nanduCount[l] == tm.TIMU_ID){
        //          nanduTempData[k].nanduCount.splice(l, 1);
        //
        //          //每种难度的数量和百分比
        //          nanduPercent();
        //        }
        //      }
        //    }
        //  }
        //  //查找要删除的元素的位置
        //  for(var i = 0; i < mbdtdLength; i++){
        //    //从mubanData中删除数据
        //    if(mubanData.shuju.MUBANDATI[i].MUBANDATI_ID == tm.TIXING_ID){ // 判断那个题目类型id; 将TIMULEIXING_ID换成TIXING_ID
        //      var tmarrLength = mubanData.shuju.MUBANDATI[i].TIMUARR.length; // 得到这个题目类型下面的题目数组
        //      for(var j = 0; j < tmarrLength; j ++){
        //        if(mubanData.shuju.MUBANDATI[i].TIMUARR[j].TIMU_ID == tm.TIMU_ID){ //找到要删除的对应数据
        //          mubanData.shuju.MUBANDATI[i].TIMUARR.splice(j, 1);
        //          //统计每种题型的数量
        //          //tixingStatistics(i, kmtxListLength);
        //          //均分大题分数
        //          divideDatiScore(mubanData.shuju.MUBANDATI[i]);
        //          break;
        //        }
        //      }
        //    }
        //  }
        //};
        //
        ///**
        // * 加入试卷按钮和移除试卷按钮的显示和隐藏
        // */
        //var addOrRemoveItemToPaper = function(arr){
        //  var selectTestStr = '';
        //  Lazy(arr).each(function(shtm, idx, lst){
        //    selectTestStr += 'selectTest' + shtm.TIMU_ID + ',';
        //  });
        //  $scope.selectTestStr = selectTestStr;
        //};
        //
        ///**
        // *  计算难度的百分比
        // */
        //var nanduPercent = function(){
        //  var nanduSum = Lazy($scope.nanduTempData).reduce(function(memo, ndItm){
        //    var ndItemNumVal = ndItm.nanduCount.length;
        //    return memo + ndItemNumVal;
        //  },0);
        //
        //  Lazy($scope.nanduTempData).each(function(ndkmtx, idx, lst){
        //    var ndItemNumVal = ndkmtx.nanduCount.length,
        //      percentVal = ((ndItemNumVal/nanduSum)*100).toFixed(0) + '%';
        //    return ndkmtx.ndPercentNum = percentVal;
        //  });
        //};
        //
        ///**
        // * 试卷预览代码
        // */
        //$scope.shijuanPreview = function(){
        //  var mbdtArr = [], //定义一个空的数组用来存放模板大题
        //    newCont,
        //    tgReg = new RegExp('<\%{.*?}\%>', 'g');
        //  //删除数据为空的模板大题
        //  Lazy(mubanData.shuju.MUBANDATI).each(function(mbdt, idx, lst){
        //    mbdt.tiMuTotalNum = mbdt.TIMUARR.length || 0;
        //    if(mbdt.TIMUARR.length || mbdt.daTiNeedShow){
        //      mbdt.daTiNeedShow = true;
        //      if(mbdt.MUBANDATI_ID == 6){
        //        Lazy(mbdt.TIMUARR).each(function(tm, subIdx, subLst){
        //          //修改填空题的题干
        //          newCont = tm.TIGAN.tiGan.replace(tgReg, function(arg) {
        //            var text = arg.slice(2, -2), //提起内容
        //              textJson = JSON.parse(text),
        //              _len = textJson.size,
        //              i, xhStr = '';
        //            for(i = 0; i < _len; i ++ ){
        //              xhStr += '_';
        //            }
        //            return xhStr;
        //          });
        //          tm.TIGAN.tiGan = newCont;
        //        });
        //        mbdtArr.push(mbdt);
        //      }
        //      else{
        //        mbdtArr.push(mbdt);
        //      }
        //    }
        //    var findInRuleArr = Lazy($scope.ampKmtxWeb).find(function(ruleData){
        //      return ruleData.TIXING_ID == mbdt.MUBANDATI_ID;
        //    });
        //    if(findInRuleArr){
        //      mbdt.tiMuTotalNum += findInRuleArr.txTotalNum;
        //    }
        //  });
        //  mubanData.shuju.MUBANDATI = mbdtArr;
        //  $scope.mubanData = mubanData;
        //  backToZjHomeFun();
        //  $scope.sjPreview = true;
        //  $scope.shijuanyulanBtn = false;
        //  $scope.addMoreTiMuBtn = true; //添加试卷按钮显示
        //};
        //
        ///**
        // * 均分大题的分值
        // */
        //var divideDatiScore = function(mbdt){
        //  var datiTotalScore = mbdt.datiScore, //本大题总分
        //    txLen = mbdt.tiMuTotalNum, //本题型的所有数量
        //    tiMuLen = mbdt.TIMUARR.length, //规定试题的数量
        //    datiItemNum = txLen || tiMuLen, //得到本大题下的题目数量
        //    biLvVal = datiTotalScore/datiItemNum, //本大题总分/大题下的题目数量
        //    xiaotiAverageScore, //每小题的平均分数
        //    zeroLen = 0, //记录题目分值为0的个数
        //    isInAmpKmTxWeb, //是否在临时的模板题型中
        //    idxNum = ''; //符合条件的规则
        //  //给规则里面的试题增加分数
        //  if($scope.zj_tabActive == 'addNewShiJuan'){
        //    isInAmpKmTxWeb = Lazy($scope.ampKmtxWeb).find(function(zjRule, idx, lst){
        //      if(zjRule.TIXING_ID == mbdt.MUBANDATI_ID){
        //        idxNum = idx;
        //        return zjRule;
        //      }
        //    });
        //  }
        //  if(biLvVal < 1){
        //    if(biLvVal == 0.5){
        //      xiaotiAverageScore = 0.5; //每小题的分数
        //      //给规则赋分数
        //      if(isInAmpKmTxWeb){
        //        Lazy($scope.ampKmtxWeb[idxNum].zsdXuanTiArr).each(function(zjr, idx, lst){
        //          zjr.TIXING[0].thisRuleScore = xiaotiAverageScore * zjr.TIXING[0].COUNT;
        //        });
        //      }
        //      //给固定试题赋分
        //      Lazy(mbdt.TIMUARR).each(function(xiaoti, idx, lst){
        //        xiaoti.xiaotiScore = xiaotiAverageScore;
        //      });
        //    }
        //    else{
        //      xiaotiAverageScore = 1; //每小题的分数
        //      //给规定试题赋分
        //      Lazy(mbdt.TIMUARR).each(function(xiaoti, idx, lst){
        //        if( idx < datiTotalScore){
        //          xiaoti.xiaotiScore = xiaotiAverageScore;
        //        }
        //        else{
        //          xiaoti.xiaotiScore = 0;
        //          zeroLen ++;
        //        }
        //      });
        //      //给固定试题赋分
        //      if(isInAmpKmTxWeb){
        //        Lazy($scope.ampKmtxWeb[idxNum].zsdXuanTiArr).each(function(zjr, idx, lst){
        //          zjr.TIXING[0].thisRuleScore = 0;
        //        });
        //      }
        //    }
        //  }
        //  else{
        //    xiaotiAverageScore = biLvVal.toFixed(0); //每小题的分数
        //    //给规则赋分数
        //    if(isInAmpKmTxWeb){
        //      Lazy($scope.ampKmtxWeb[idxNum].zsdXuanTiArr).each(function(zjr, idx, lst){
        //        zjr.TIXING[0].thisRuleScore = xiaotiAverageScore * zjr.TIXING[0].COUNT;
        //      });
        //      datiTotalScore -= xiaotiAverageScore * $scope.ampKmtxWeb[idxNum].txTotalNum;
        //    }
        //    //给固定试题赋分
        //    Lazy(mbdt.TIMUARR).each(function(xiaoti, idx, lst){
        //      if(idx + 1 < tiMuLen){
        //        xiaoti.xiaotiScore = xiaotiAverageScore;
        //        datiTotalScore -= xiaotiAverageScore;
        //      }
        //      if(idx +1 == tiMuLen){ //给最后一小题赋值
        //        xiaoti.xiaotiScore = datiTotalScore;
        //      }
        //    });
        //  }
        //};
        //
        ///**
        // * 有小题的到大题的分值
        // */
        //$scope.addXiaotiScore = function(mbdt){
        //  var datiScore = 0;
        //  Lazy(mbdt.TIMUARR).each( function(xiaoti, idx, lst){
        //    datiScore += parseFloat(xiaoti.xiaotiScore);
        //  });
        //  mbdt.datiScore = datiScore;
        //};
        //
        ///**
        // * 删除大题
        // */
        //$scope.deleteDaTi = function(idx){
        //  var targetMbdtId = mubanData.shuju.MUBANDATI[idx].MUBANDATI_ID,
        //    mubandatiLength, //定义一个模板大题的长度
        //    i, j, k;
        //  //删除试卷里面对应的数据
        //  shijuanData.shuju.SHIJUAN_TIMU = Lazy(shijuanData.shuju.SHIJUAN_TIMU).reject(function(sjtm){
        //    return sjtm.MUBANDATI_ID == targetMbdtId;
        //  }).toArray();
        //  //删除$scope.kmtxList中对应的元素,此处不删除的话，试题统计就会有问题
        //  for(j = 0; j < kmtxListLength; j++){
        //    if(targetMbdtId == $scope.kmtxList[j].TIXING_ID){
        //      $scope.kmtxList[j].itemsNum = 0;
        //      $scope.kmtxList[j].txPercentNum = '0%';
        //      $scope.kmtxList[j].datiScore = 0;//删除此大题在二级控制面版上的大题分数
        //      break;
        //    }
        //  }
        //  //删除难度中对应的数据 nanduTempData nanduLength
        //  Lazy(mubanData.shuju.MUBANDATI[idx].TIMUARR).each(function(dtm, idx, lst){
        //    Lazy(nanduTempData).each(function(ndtd, ndidx, ndlst){
        //      if(ndtd.nanduId == dtm.NANDU_ID){
        //        var thisNaduLength = ndtd.nanduCount.length;
        //        for(k = 0; k < thisNaduLength; k++){
        //          if(ndtd.nanduCount[k] == dtm.TIMU_ID){
        //            ndtd.nanduCount.splice(k, 1);
        //          }
        //        }
        //      }
        //    });
        //  });
        //  //加入试卷按钮和移除试卷按钮的显示和隐藏
        //  addOrRemoveItemToPaper(shijuanData.shuju.SHIJUAN_TIMU);
        //  mubanData.shuju.MUBANDATI.splice(idx, 1); //删除大图数据,放在最后
        //  mubandatiLength = mubanData.shuju.MUBANDATI.length; //给删除所选项后的模板大题的长度
        //  //统计每种题型的数量和百分比
        //  //for(i = 0; i < mubandatiLength; i++){
        //  //  tixingStatistics(i, kmtxListLength);
        //  //}
        //  //难度统计
        //  nanduPercent();
        //};
        //
        ///**
        // * 从试题统计中删除大题
        // */
        //$scope.deleteDaTiArr = function(mbdtid){
        //  var mbdtIds = Lazy(mubanData.shuju.MUBANDATI).map(function(mbdt){ return mbdt.MUBANDATI_ID;}).toArray();
        //  var idx = Lazy(mbdtIds).indexOf(mbdtid);
        //  $scope.deleteDaTi(idx);
        //};
        ///**
        // * 编辑试卷信息
        // */
        //$scope.editMuBanDaTiNameAndScore = function(styl){
        //  var focusTarget = '.' + styl;
        //  $scope.shijuan_edit = true;
        //  if($scope.shijuan_edit){
        //    var setScoreFun = function(){
        //      $(focusTarget).focus();
        //    };
        //    $timeout(setScoreFun, 500);
        //  }
        //};
        //
        ///**
        // * 取消编辑试卷信息
        // */
        //$scope.cancelEditPaper = function(){
        //  $scope.shijuan_edit = false;
        //};
        //
        ///**
        // * 保存编辑试卷信息
        // */
        //$scope.saveEditPaper = function(){
        //  $scope.zuJuanParam.sjzj_zongfen = 0;
        //  Lazy(mubanData.shuju.MUBANDATI).each(function(mbdt, indx, lst){
        //    $scope.zuJuanParam.sjzj_zongfen += parseInt(mbdt.datiScore);
        //    var xiaoTiNumIsNull = false;
        //    Lazy(mbdt.TIMUARR).each(function(xt){
        //      if(!(xt.xiaotiScore && xt.xiaotiScore > 0)){
        //        xiaoTiNumIsNull = true;
        //      }
        //    });
        //    if(xiaoTiNumIsNull){
        //      //均分大题分数
        //      divideDatiScore(mbdt);
        //    }
        //    //二级控制面板上的分数统计
        //    //Lazy($scope.kmtxList).each(function(kmtx, idx, lst){
        //    //  if(kmtx.TIXING_ID == mbdt.MUBANDATI_ID){
        //    //   kmtx.datiScore = mbdt.datiScore;
        //    //  }
        //    //});
        //  });
        //  //试卷编辑层隐藏
        //  $scope.shijuan_edit = false;
        //};
        //
        ///**
        // * 更换小题
        // */
        //var isChangeItem, cg_mbdt_idx, cg_timuId, cg_thisItem_idx;
        //$scope.changeItem = function(mbdtId, timuId){
        //  $scope.showTestList(mbdtId); //显示试题列表
        //  isChangeItem = true; // 是否是题目替换
        //  cg_mbdt_idx = this.$parent.$index; // 需要更换的模板大题Id
        //  cg_timuId = timuId; // 需要被更换的题目的Id
        //  cg_thisItem_idx = this.$index; // 需要被更换的题目的索引
        //  $scope.hideOrShowTixing = true; //如何是换一题，隐藏不必要的题型
        //};
        //
        ///**
        // * 保存试卷前的确认
        // */
        //$scope.savePaperConfirm = function(comeFromWhere){
        //  var nanDuArr = {
        //      paperNanDu: '',
        //      daTiNanDuArr:[]
        //    },
        //    fenZhiIsNull = 0,
        //    muBanDaTiLen = mubanData.shuju.MUBANDATI.length,
        //    ppNanDuAdd = 0; //定义一个试卷难度相加字段
        //  shijuanData.shuju.SHIJUAN_TIMU = [];
        //  $scope.paperScore = 0;
        //  //试卷设置分数后，再做修改后，
        //  $scope.saveEditPaper();
        //  Lazy(mubanData.shuju.MUBANDATI).each(function(dati, idx, lst){
        //    $scope.paperScore += parseInt(dati.datiScore); //将试卷分数转换为整形
        //    var nanDuObj = { //定义一个存放难度object对象
        //        mubandati_id: dati.MUBANDATI_ID,
        //        nanDu: ''
        //      },
        //      thisDaTiTiMuArrLen = dati.TIMUARR.length, //本大题的题目长度
        //      dtNanDuAdd = 0; //定义一个难度求和的字段
        //    Lazy(dati.TIMUARR).each(function(tm, subidx, lst){
        //      //统计小题难度
        //      dtNanDuAdd += parseInt(tm.NANDU_ID)/5;
        //      if(subidx == thisDaTiTiMuArrLen - 1 ){
        //        nanDuObj.nanDu = (dtNanDuAdd/thisDaTiTiMuArrLen).toFixed(2);
        //        ppNanDuAdd += dtNanDuAdd/thisDaTiTiMuArrLen;
        //        nanDuArr.daTiNanDuArr.push(nanDuObj);
        //      }
        //      //重组试卷数据
        //      var shijuanTimu = {
        //        TIMU_ID: '',
        //        MUBANDATI_ID: '',
        //        WEIZHIXUHAO: '',
        //        FENZHI: ''
        //      };
        //      shijuanTimu.MUBANDATI_ID = dati.MUBANDATI_ID; //模板大题的id
        //      shijuanTimu.TIMU_ID = tm.TIMU_ID; //试题的id
        //      shijuanTimu.WEIZHIXUHAO = subidx; //位置序号
        //      //给题目类型是9的题添加分页符
        //      if(tm.TIMULEIXING_ID == 9){
        //        shijuanTimu.HUANYE = 1;
        //      }
        //      //得到小题的分数
        //      if(tm.xiaotiScore && tm.xiaotiScore > 0){
        //        shijuanTimu.FENZHI = tm.xiaotiScore; //得到小题的分数
        //      }
        //      else{
        //        shijuanTimu.FENZHI = '';
        //        fenZhiIsNull ++;
        //      }
        //      shijuanData.shuju.SHIJUAN_TIMU.push(shijuanTimu);
        //    });
        //    if(idx == muBanDaTiLen - 1){
        //      nanDuArr.paperNanDu = (ppNanDuAdd/muBanDaTiLen).toFixed(2);
        //      shijuanData.shuju.NANDU = nanDuArr;
        //    }
        //    dati.XUHAO = idx + 1;
        //  });
        //  if(shijuanData.shuju.SHIJUANMINGCHENG){ //11 检查试卷名称
        //    if(!fenZhiIsNull){// 22 检查每小题是否有分值 开始
        //      //提交数据
        //      if($scope.zj_tabActive == 'addNewShiJuan'){
        //        if(shijuanData.shuju.SHIJUANMUBAN_ID){ // 33
        //          $scope.isSavePaperConfirm = true;
        //        }
        //        else{ //33
        //          DataService.alertInfFun('pmt', '请检查试卷的完整性！');
        //        }
        //      }
        //      else{
        //        if(shijuanData.shuju.SHIJUANMUBAN_ID && shijuanData.shuju.SHIJUAN_TIMU.length){ // 33
        //          $scope.isSavePaperConfirm = true;
        //        }
        //        else{ //33
        //          DataService.alertInfFun('pmt', '请检查试卷的完整性！');
        //        }
        //      }
        //    }
        //    else{ // 22 检查每小题是否有分值 结束
        //      DataService.alertInfFun('pmt', '每小题的分数不能为空！请给每个小题一个分数！');
        //    }
        //  }
        //  else{ //11 检查试卷名称
        //    DataService.alertInfFun('pmt', '给我起个名字吧 ^ _ ^');
        //  }
        //  if(comeFromWhere && (comeFromWhere == 'comeFromRandom')){
        //    var totalTiMuNums = 0; //规则组卷出题的总数量
        //    var guiZeArr = []; //存放随机规则的数值
        //    shijuanData.shuju.SUIJIGUIZE = ''; //试卷里面的随机规则
        //    shijuanData.shuju.SHIJUANLEIXING = 1; //试卷类型
        //    //得到题型数量和难度的数组
        //    Lazy($scope.ampKmtxWeb).each(function(txArr, idx, lst){
        //      if(txArr.zsdXuanTiArr.length){
        //        totalTiMuNums += txArr.txTotalNum;
        //        Lazy(txArr.zsdXuanTiArr).each(function(ntx, subIdx, subLst){
        //          guiZeArr.push(ntx);
        //        });
        //      }
        //    });
        //    if(guiZeArr.length > 0){
        //      shijuanData.shuju.SUIJIGUIZE = JSON.stringify(guiZeArr);
        //    }
        //  }
        //};
        //
        ///**
        // * 保存试卷
        // */
        //$scope.savePaper = function(){
        //  //保存试卷
        //  //更新数据模板
        //  var lsmbIdLenght = $rootScope.session.lsmb_id.length;
        //  mubanData.shuju.SHIJUANMUBAN_ID = shijuanData.shuju.SHIJUANMUBAN_ID;
        //  if($scope.zuJuanParam.tiMuSuiJi){
        //    mubanData.shuju.TIMU_SUIJI = true;
        //  }
        //  else{
        //    mubanData.shuju.TIMU_SUIJI = false;
        //  }
        //  if($scope.zuJuanParam.xuanXiangSuiJi){
        //    mubanData.shuju.XUANXIANG_SUIJI = true;
        //  }
        //  else{
        //    mubanData.shuju.XUANXIANG_SUIJI = false;
        //  }
        //  $http.post(xgmbUrl, mubanData).success(function(mbdata){
        //    if(mbdata.result){
        //      for(var i = 0; i < lsmbIdLenght; i++){
        //        if($rootScope.session.lsmb_id[i] == shijuanData.shuju.SHIJUANMUBAN_ID){
        //          $rootScope.session.lsmb_id.splice(i, 1);
        //        }
        //      }
        //      $scope.shijuanyulanBtn = false; //试卷预览的按钮
        //      $scope.fangqibencizujuanBtn = false; //放弃本次组卷的按钮
        //      $scope.baocunshijuanBtn = false; //保存试卷的按钮
        //      $scope.isSavePaperConfirm = false;
        //      $scope.addMoreTiMuBtn = false; //添加试卷按钮隐藏
        //      $scope.zuJuanParam.xuanTiError = [];
        //      //保存组卷规则
        //      if(isComeFromRuleList){
        //        comeFromRuleListData.GUIZEBIANMA = zuJuanRuleStr;
        //        $scope.saveZjRule(comeFromRuleListData, 'upd', true);
        //      }
        //      else{
        //        $scope.saveZjRule(zuJuanRuleStr, 'sav', true);
        //      }
        //      if(shijuanData.shuju.SUIJIGUIZE){
        //        shijuanData.shuju.SHIJUANLEIXING = 1;
        //      }
        //      else{
        //        shijuanData.shuju.SHIJUANLEIXING = 0;
        //      }
        //      $http.post(xgsjUrl, shijuanData).success(function(data){
        //        if(data.result){
        //          $scope.showZuJuan();
        //          DataService.alertInfFun('suc', '试卷保存成功！');
        //        }
        //        else{
        //          DataService.alertInfFun('err', data.error);
        //        }
        //      });
        //    }
        //    else{
        //      DataService.alertInfFun('err', '更新试卷模板是错误！错误信息为：' + mbdata.error);
        //    }
        //  });
        //
        //};
        //
        ///**
        // * 取消保存试卷
        // */
        //$scope.cancelSavePaper = function(){
        //  $scope.isSavePaperConfirm = false;
        //};
        //
        ///**
        // * 将试卷保存为PDF
        // */
        ////$scope.exportShiJuanToPdf = function(id){
        ////  var idSl = '#' + id;
        ////  var source = $('body')[0];
        ////  var pdfCode = new jsPDF('p', 'pt', 'letter');
        ////  var specialElementHandlers = {
        ////      '#bypassme': function (element, renderer) {
        ////      }
        ////    },
        ////    margins = {
        ////      top: 80,
        ////      bottom: 60,
        ////      left: 40,
        ////      width: 522
        ////    };
        ////  pdfCode.fromHTML(
        ////    source // HTML string or DOM elem ref.
        ////    , margins.left // x coord
        ////    , margins.top // y coord
        ////    , {
        ////      'width': margins.width // max width of content on PDF
        ////      , 'elementHandlers': specialElementHandlers
        ////    },
        ////    function (dispose) {
        ////      pdfCode.save('Test.pdf');
        ////    },
        ////    margins
        ////  );
        ////};
        //
        ///**
        // * 删除临时模板
        // */
        //var deleteTempTemp = function(){
        //  deletelsmbData.muban_id = $rootScope.session.lsmb_id;
        //  if(deletelsmbData.muban_id.length){
        //    $http.post(deletelsmbUrl, deletelsmbData).success(function(data){
        //      if(data.result){
        //        $rootScope.session.lsmb_id = [];
        //        deletelsmbData.muban_id = [];
        //        mubanData.shuju.SHIJUANMUBAN_ID = ''; //清空试卷模板id
        //      }
        //      else{
        //        DataService.alertInfFun('err', data.error);
        //      }
        //    });
        //  }
        //  else{
        //    mubanData.shuju.SHIJUANMUBAN_ID = ''; //清空试卷模板id
        //  }
        //};
        //
        ///**
        // * 清除试卷、模板、难度、题型的数据
        // */
        //var clearData = function(){
        //  mubanData.shuju.MUBANDATI = []; //清除模板中试题的临时数据
        //  shijuanData.shuju.SHIJUAN_TIMU = []; //清除试卷中的数据
        //  shijuanData.shuju.SHIJUANMINGCHENG = ''; //试卷名称重置
        //  shijuanData.shuju.FUBIAOTI = ''; //试卷副标题重置
        //  shijuanData.shuju.SHIJUANMUBAN_ID = ''; //删除试卷中的试卷模板id
        //  shijuanData.shuju.SHIJUAN_ID = ''; //清楚试卷id
        //  shijuanData.shuju.SUIJIGUIZE = ''; //试卷随机规则
        //  shijuanData.shuju.SHIJUANLEIXING = ''; //试卷类型
        //  mubanData.shuju.ZONGDAOYU = ''; //试卷模板总导语重置
        //  Lazy($scope.nanduTempData).each(function(ndkmtx, idx, lst){ //清除难度的数据
        //    ndkmtx.nanduCount = [];
        //    ndkmtx.ndPercentNum = '0%';
        //    return ndkmtx;
        //  });
        //  Lazy($scope.kmtxList).each(function(tjkmtx, idx, lst){ //清除科目题型的统计数据
        //    tjkmtx.itemsNum = 0;
        //    tjkmtx.txPercentNum = '0%';
        //    return tjkmtx;
        //  });
        //  $scope.selectTestStr = ''; //清除试题加入和移除按钮
        //  $scope.backToZjHome(); //返回选择手动和自动组卷页面
        //  $scope.shijuanyulanBtn = false; //试卷预览的按钮
        //  $scope.fangqibencizujuanBtn = false; //放弃本次组卷的按钮
        //  $scope.baocunshijuanBtn = false; //保存试卷的按钮
        //};
        //
        ///**
        // * 放弃组卷
        // */
        //$scope.dropMakePaper = function(){
        //  $scope.totalSelectedItmes = 0; //已选试题的总数量
        //  $scope.addMoreTiMuBtn = false; //添加试卷按钮隐藏
        //  $scope.zuJuanParam.xuanTiError = [];
        //  deleteTempTemp();
        //  clearData();
        //  restoreKmtxDtscore();
        //  if(isComeFromRuleList){
        //    $scope.showZuJuanRuleList();
        //  }
        //  if(comeFromRuleMakePaper){
        //    $scope.ruleMakePaper();
        //  }
        //  Lazy($scope.ampKmtxWeb).each(function(ampw, idx, lst){
        //    ampw.txTotalNum = 0;
        //    ampw.zsdXuanTiArr = [];
        //  });
        //};

        ///**
        // * 返回组卷首页
        // */
        //$scope.showZuJuan = function(){
        //  mubanData.shuju.MUBANDATI = []; //清除模板中试题的临时数据
        //  shijuanData.shuju.SHIJUAN_TIMU = []; //清除试卷中的数据
        //  shijuanData.shuju.SHIJUANMINGCHENG = ''; //试卷名称重置
        //  shijuanData.shuju.FUBIAOTI = ''; //试卷副标题重置
        //  shijuanData.shuju.SHIJUANMUBAN_ID = ''; //删除试卷中的试卷模板id
        //  shijuanData.shuju.SHIJUAN_ID = ''; //清楚试卷id
        //  shijuanData.shuju.SUIJIGUIZE = ''; //试卷随机规则
        //  shijuanData.shuju.SHIJUANLEIXING = ''; //试卷类型
        //  mubanData.shuju.ZONGDAOYU = ''; //试卷模板总导语重置
        //  Lazy($scope.nanduTempData).each(function(ndkmtx, idx, lst){ //清除难度的数据
        //    ndkmtx.nanduCount = [];
        //    ndkmtx.ndPercentNum = '0%';
        //    return ndkmtx;
        //  });
        //  Lazy($scope.kmtxList).each(function(tjkmtx, idx, lst){ //清除科目题型的统计数据
        //    tjkmtx.itemsNum = 0;
        //    tjkmtx.txPercentNum = '0%';
        //    return tjkmtx;
        //  });
        //  $scope.selectTestStr = ''; //清除试题加入和移除按钮
        //  $scope.shijuanyulanBtn = false; //试卷预览的按钮
        //  $scope.fangqibencizujuanBtn = false; //放弃本次组卷的按钮
        //  $scope.baocunshijuanBtn = false; //保存试卷的按钮
        //  $scope.paper_hand_form = false;
        //  $scope.sjPreview = false; //试卷预览
        //  $scope.showBackToPaperListBtn = false;
        //  //$scope.zjTpl = 'views/zujuan/zj_home.html';
        //  $scope.showPaperList();
        //  deleteTempTemp();
        //  restoreKmtxDtscore();
        //};

        ///**
        // * 查看组卷规则列表
        // */
        //$scope.showZuJuanRuleList = function(){
        //  $scope.zj_tabActive = 'zjRule';
        //  $scope.zjDaGangListShow = false;
        //  $scope.showBackToPaperListBtn = false;
        //  qryZjRule();
        //  $scope.zjTpl = 'views/zujuan/zj_ruleList.html'; //加载试卷列表模板
        //};

        ///**
        // * 查看试卷详情
        // */
        //$scope.showPaperDetail = function(sjId){
        //  var qryPaperDetailUrl = qryPaperDetailUrlBase + sjId;
        //  mubanData.shuju.MUBANDATI = [];
        //  shijuanData.shuju.SHIJUAN_TIMU = [];
        //  paperDetailData = '';
        //  paperDetailId = ''; //用来存放所选试卷的id
        //  paperDetailName = ''; //用来存放所选试卷的名称
        //  $scope.zuJuanGuiZe = '';
        //  $http.get(qryPaperDetailUrl).success(function(data){
        //    if(!data.error){
        //      paperDetailId = data.SHIJUAN.SHIJUAN_ID; //用来存放所选试卷的id
        //      paperDetailName =  data.SHIJUAN.SHIJUANMINGCHENG; //用来存放所选试卷的名称
        //      //给临时模板赋值
        //      mubanData.shuju.SHIJUANMUBAN_ID = data.MUBAN.SHIJUANMUBAN_ID; //模板id
        //      mubanData.shuju.MUBANMINGCHENG = data.MUBAN.MUBANMINGCHENG; //模板名称
        //      mubanData.shuju.ZONGDAOYU = data.MUBAN.ZONGDAOYU; //总导语
        //      //给试卷赋值
        //      shijuanData.shuju.SHIJUAN_ID = data.SHIJUAN.SHIJUAN_ID; //试卷id
        //      shijuanData.shuju.SHIJUANMINGCHENG = data.SHIJUAN.SHIJUANMINGCHENG; //试卷名称
        //      shijuanData.shuju.FUBIAOTI = data.SHIJUAN.FUBIAOTI; //副标题
        //      shijuanData.shuju.SHIJUANMUBAN_ID = data.SHIJUAN.SHIJUANMUBAN_ID; //试卷模板id
        //      //将模板大题赋值到模板里面
        //      Lazy(data.MUBANDATI).each(function(mbdt, indx, lst){
        //        mbdt.TIMUARR = []; //自己添加的数组
        //        mbdt.datiScore = 0; //自己定义此大题的分数
        //        mubanData.shuju.MUBANDATI.push(mbdt);
        //      });
        //      var mbdtdLength = mubanData.shuju.MUBANDATI.length;//模板大题的长度
        //      //将试卷详情放入临时模板的数组中
        //      Lazy(data.TIMU).each(function(tm, indx, lst){
        //        // SHIJUAN_TIMU里的元素
        //        var sjtm = {
        //          TIMU_ID: '',
        //          MUBANDATI_ID: '',
        //          WEIZHIXUHAO: '',
        //          FENZHI: ''
        //        };
        //        //将本题加入试卷
        //        sjtm.TIMU_ID = tm.TIMU_ID;
        //        sjtm.MUBANDATI_ID = tm.MUBANDATI_ID;
        //        sjtm.WEIZHIXUHAO = tm.WEIZHIXUHAO;
        //        sjtm.FENZHI = tm.FENZHI;
        //        shijuanData.shuju.SHIJUAN_TIMU.push(sjtm);
        //        //将此题加入模板
        //        for(var i = 0; i < mbdtdLength; i++){
        //          //将题加入到临时模板
        //          if(tm.MUBANDATI_ID == mubanData.shuju.MUBANDATI[i].MUBANDATI_ID){
        //            tm.DETAIL.xiaotiScore = tm.FENZHI;
        //            mubanData.shuju.MUBANDATI[i].TIMUARR.push(tm.DETAIL);
        //            mubanData.shuju.MUBANDATI[i].datiScore += tm.FENZHI;
        //          }
        //          //统计每种题型的数量和百分比
        //          //tixingStatistics(i, kmtxListLength);
        //        }
        //        //难度统计  nanduTempData NANDU_ID
        //        for(var j = 0; j < nanduLength; j++){
        //          if(nanduTempData[j].nanduId == tm.DETAIL.NANDU_ID){
        //            nanduTempData[j].nanduCount.push(tm.TIMU_ID);
        //          }
        //        }
        //      });
        //      nanduPercent(); //难度统计
        //      addOrRemoveItemToPaper(shijuanData.shuju.SHIJUAN_TIMU); //添加和删除按钮
        //      //二级控制面板上的分数统计
        //      restoreKmtxDtscore();
        //      Lazy(mubanData.shuju.MUBANDATI).each(function(mbdt, indx, lst){ //再给kmtx.datiScore赋值
        //        Lazy($scope.kmtxList).each(function(kmtx, idx, lst){
        //          if(kmtx.TIXING_ID == mbdt.MUBANDATI_ID){
        //            kmtx.datiScore = mbdt.datiScore;
        //          }
        //        });
        //      });
        //      //展示随机试卷的组卷规则
        //      if(data.SHIJUAN.SUIJIGUIZE){
        //        $scope.zuJuanGuiZe = JSON.parse(data.SHIJUAN.SUIJIGUIZE);
        //      }
        //      $scope.shijuanPreview(); //试卷预览
        //      $scope.shijuanyulanBtn = false; //试卷预览的按钮
        //      $scope.fangqibencizujuanBtn = true; //放弃本次组卷的按钮
        //      $scope.baocunshijuanBtn = true; //保存试卷的按钮
        //      paperDetailData = mubanData; //用于答题卡赋值
        //      $scope.showBackToPaperListBtn = true;
        //    }
        //    else{
        //      $scope.showBackToPaperListBtn = false;
        //      DataService.alertInfFun('err', data.error);
        //    }
        //  });
        //};
        //
        ///**
        // * 删除试卷 xgsjUrl
        // */
        //var isDeletePaper;
        //$scope.deleteThisPaper = function(paperId, idx){
        //  var deleteDate = {
        //    token: token,
        //    caozuoyuan: caozuoyuan,
        //    jigouid: jigouid,
        //    lingyuid: lingyuid,
        //    shuju:{
        //      SHIJUAN_ID: paperId,
        //      ZHUANGTAI: -1
        //    }
        //  };
        //  var alertCon = confirm("确定要删除次试卷吗？");
        //  if(alertCon){
        //    $http.post(xgsjUrl, deleteDate).success(function(data){
        //      if(data.result){
        //        $scope.paperListData.splice(idx, 1);
        //        isDeletePaper = true;
        //        qryShiJuanList();
        //        DataService.alertInfFun('suc', '删除成功！');
        //      }
        //      else{
        //        DataService.alertInfFun('err', data.error);
        //      }
        //    });
        //  }
        //};
        //
        ///**
        // *  大题的上下移动
        // */
        //$scope.moveDaTi = function(idx, dirt){
        //  var toIndex = idx + dirt,
        //    item = mubanData.shuju.MUBANDATI[idx];
        //  if(dirt>0){
        //    mubanData.shuju.MUBANDATI.splice(toIndex + 1, 0, item);
        //    mubanData.shuju.MUBANDATI.splice(idx, 1);
        //  }
        //  else{
        //    mubanData.shuju.MUBANDATI.splice(idx, 1);
        //    mubanData.shuju.MUBANDATI.splice(toIndex, 0, item);
        //  }
        //};
        //
        ///**
        // * 上下移动题目
        // */
        //$scope.moveTM = function(tm, num, mbdtId){
        //  var dati = Lazy(mubanData.shuju.MUBANDATI).where({ MUBANDATI_ID: mbdtId }).toArray()[0];
        //  var tmIds = Lazy(dati.TIMUARR).map(function(t){ return t.TIMU_ID;}).toArray(),
        //      index = Lazy(tmIds).indexOf(tm.TIMU_ID),
        //      toIndex = index + num,
        //      item = dati.TIMUARR[index];
        //  if(num>0){
        //    dati.TIMUARR.splice(toIndex + 1, 0, item);
        //    dati.TIMUARR.splice(index, 1);
        //  }
        //  else{
        //    dati.TIMUARR.splice(index, 1);
        //    dati.TIMUARR.splice(toIndex, 0, item);
        //  }
        //  var reloadFun = function(){
        //    MathJax.Hub.Queue(["Typeset", MathJax.Hub, "testList"]);
        //  };
        //  $timeout(reloadFun, 500);
        //};

      }]); //controller的结束 )
}); // 001
