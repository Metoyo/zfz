define(['angular', 'config', 'mathjax', 'jquery', 'lazy'], function (angular, config, mathjax, $, lazy) { // 001
  'use strict';
  angular.module('zhifzApp.controllers.ZujuanCtrl', [])
    .controller('ZujuanCtrl', ['$rootScope', '$scope', '$location', '$http', 'urlRedirect', '$q', '$timeout',
      'DataService', '$cookieStore',
      function ($rootScope, $scope, $location, $http, urlRedirect, $q, $timeout, DataService, $cookieStore) {
        /**
         * 声明变量
         */
        var loginUsr = JSON.parse($cookieStore.get('ckUsr'));
        var logUid = loginUsr['UID']; //登录用户的UID
        var jgID = loginUsr['学校ID']; //登录用户学校
        var yongHuSet = loginUsr['用户设置']; //用户设置
        var dftKm = JSON.parse($cookieStore.get('ckKeMu')); //默认选择的科目
        var jsArr = JSON.parse($cookieStore.get('ckJs')) || []; //登录用户的角色数组
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
        var keMuJiaoShiUrl = '/kemu_jiaoshi'; //学校教师
        var tiMuIdArr = []; //获得查询题目ID的数组
        var pageArr = []; //根据得到的数据定义一个分页数组
        var qryTmPar = { //查询题目参数对象
          zsd: [], //知识点
          nd: '', //难度id
          tm: '', //题目id
          tk: [], //题库id
          tx: '', //题型id
          tmly: '', //题目来源ID
          ctr: '', //出题人UID
          ltr: '',  //录题人ID
          cjsjKs: '', //创建时间开始
          cjsjJs: '' //创建时间结束
        };
        var tiMuUrl = '/timu'; //题目的URL
        var shiJuanUrl = '/shijuan'; //试卷的URL
        var shiJuanZuShiJuanUrl = '/shijuanzu_shijuan'; //向试卷组中添加单个试卷
        var allTiMuIds = ''; //存放所有题目id
        var txName = config.tiXingArr; //题型名称
        var gdtmTempIds = []; //临时存放固定题目ID的数组
        var allTkIds = []; //所有题库ID
        $scope.letterArr = config.letterArr; //题支的序号
        $scope.cnNumArr = config.cnNumArr; //题支的序号
        $scope.txArr = config.tiXingArr; //题型数组
        $scope.defaultKeMu = dftKm; //默认科目
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
        $scope.slt_dg = ''; //默认大纲
        $scope.showCrumbs = false; //显示面包屑导航

        /**
         * 判断用户的角色
         */
        var kmfzrQx = Lazy(jsArr).contains(2); //判断科目负责人
        var rkjsQx = Lazy(jsArr).contains(3); //判断任课教师

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
          if($scope.zuJuanParam){
            $scope.zuJuanParam.rlZsd = '';
            $scope.zuJuanParam.rlZsdName = '';
          }
        }
        var getDaGangData = function(){
          var objZj = {method: 'GET', url: zhiShiDaGangUrl, params: {'学校ID': jgID, '科目ID': dftKm['科目ID'], '类型': 2}};
          var sltDg = '';
          var zjDg = [];
          var ggDg = [];
          $scope.dgList = [];
          $http(objZj).success(function(data){
            if(data.result){
              if(data.data){
                zjDg = data.data;
              }
              var objGg = {method: 'GET', url: zhiShiDaGangUrl, params: {'科目ID': keMuId, '类型': 1}};
              $http(objGg).success(function(ggData) {
                if (ggData.result) {
                  if (ggData.data) {
                    ggDg = ggData.data;
                  }
                  var allDaGangArr = Lazy(zjDg).union(ggDg).toArray();
                  Lazy(allDaGangArr).each(function(dg){
                    var dgObj = {
                      '知识大纲ID': dg['知识大纲ID'],
                      '知识大纲名称': dg['知识大纲名称']
                    };
                    $scope.dgList.push(dgObj);
                  });
                  $scope.allZsdgData = allDaGangArr;
                  if(yongHuSet['默认大纲']['知识大纲ID']){
                    sltDg = Lazy($scope.allZsdgData).find(function(dg){
                      return dg['知识大纲ID'] == yongHuSet['默认大纲']['知识大纲ID'];
                    });
                    if(!sltDg){
                      sltDg = Lazy($scope.allZsdgData).find(function(dg){
                        return dg['知识大纲ID'] == $scope.dgList[0]['知识大纲ID'];
                      });
                    }
                  }
                  else{
                    sltDg = Lazy($scope.allZsdgData).find(function(dg){
                      return dg['知识大纲ID'] == $scope.dgList[0]['知识大纲ID'];
                    });
                  }
                  if(sltDg){
                    Lazy(sltDg['节点']).each(_zsdDo);
                    $scope.slt_dg = sltDg['知识大纲ID'];
                    $scope.kowledgeList = sltDg;
                  }
                  else{
                    $scope.slt_dg = '';
                    $scope.kowledgeList = '';
                    DataService.alertInfFun('err', '没有符合的大纲数据！');
                  }
                }
                else{
                  DataService.alertInfFun('err', ggData.error);
                }
              });
            }
            else{
              DataService.alertInfFun('err', data.error);
            }
          });
        };

        /**
         * 查询科目题型
         */
        var kmTxData = function(){
          if($scope.kmtxList && $scope.kmtxList.length > 0){
            Lazy($scope.kmtxList).each(function(tx){
              tx.ckd = false;
            });
            $scope.sjzKmtx = angular.copy($scope.kmtxList);
          }
          else{
            var obj = {method: 'GET', url: xueXiaoKeMuTiXingUrl, params: {'学校ID': jgID, '科目ID': dftKm['科目ID']}};
            $http(obj).success(function(data){
              if(data.result && data.data){
                Lazy(data.data).each(function(tx){
                  tx.ckd = false;
                });
                $scope.kmtxList = data.data;
                $scope.sjzKmtx = angular.copy(data.data);
              }
              else{
                $scope.kmtxList = '';
                $scope.sjzKmtx = '';
                DataService.alertInfFun('err', data.error);
              }
            });
          }
        };

        /**
         * 查询题库
         */
        var qryTiKu = function(){
          if(!($scope.tiKuList && $scope.tiKuList.length > 0)){
            var objZj = {method: 'GET', url: tiKuUrl, params: {'学校ID': jgID, '领域ID': lingYuId, '类型': 2}};
            var zjTk = [];
            var ggTk = [];
            $http(objZj).success(function(data){
              if(data.result){
                zjTk = data.data ? data.data : [];
                var objGg = {method: 'GET', url: tiKuUrl, params: {'领域ID': lingYuId, '类型': 1}};
                $http(objGg).success(function(ggData){
                  if(ggData.result){
                    ggTk = ggData.data ? ggData.data : [];
                    $scope.tiKuList = Lazy(zjTk).union(ggTk).toArray();
                    var allTkId = Lazy($scope.tiKuList).map(function(tk){ return tk['题库ID'];}).toArray();
                    allTkIds = angular.copy(allTkId);
                    qryTmPar.tk = allTkId;
                  }
                  else{
                    DataService.alertInfFun('err', ggData.error);
                  }
                });
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
            });
          }
        };

        /**
         *  查询试卷列表的函数，组卷页面加载时，查询数据
         */
        var qryShiJuanList = function(){
          var obj = {
            method: 'GET',
            url: shiJuanZuUrl,
            params: {
              '学校ID': jgID,
              '科目ID': keMuId,
              '返回试卷': true,
              '返回题目内容': true
            }
          };
          if(!kmfzrQx && rkjsQx){
            obj.params['创建人UID'] = logUid;
          }
          $scope.loadingImgShow = true;
          $scope.sjzPage.allPages = [];
          $http(obj).success(function(data){
            if(data.result && data.data){
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
              DataService.alertInfFun('err', data.error || '没有符合的数据！');
            }
            $scope.loadingImgShow = false;
          });
        };

        /**
         整理选中的知识点的ID和名称
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
          $scope.zuJuanParam.rlZsd = zsdId;
          $scope.zuJuanParam.rlZsdName = zsdName;
          if($scope.onlyShowAddRuleBox){
            qryTestNum();
          }
          else{
            qryTmPar.zsd = zsdId;
            qryTestFun(1);
          }
        };

        /**
         * 查询出题人
         */
        var qryChuTiRen = function(){
          if(!($scope.chuTiRens && $scope.chuTiRens.length > 0)){
            var obj = {method: 'GET', url: keMuJiaoShiUrl, params: {'学校ID': jgID, '科目ID': keMuId}};
            $http(obj).success(function(data){
              if(data.result && data.data){
                $scope.chuTiRens = data.data;
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
            });
          }
        };

        /**
         * 分页处理函数
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
         * 查询题目详情
         */
        var qryTiMuDetail = function(tmArr){
          if(tmArr && tmArr.length > 0){
            $scope.loadingImgShow = true;
            gdtmTempIds = [];
            if($scope.zuJuanParam.tmlTp == 'gdtm'){
              Lazy($scope.sjzSet['组卷规则']).each(function(dt){
                Lazy(dt['固定题目']).each(function(tm){
                  gdtmTempIds.push(tm['题目ID']);
                });
              });
              gdtmTempIds = Lazy(gdtmTempIds).uniq().toArray();
            }
            if($scope.zuJuanParam.tmlTp == 'addSjToSjz'){
              Lazy($scope.singleSj).each(function(dt){
                Lazy(dt['题目']).each(function(tm){
                  gdtmTempIds.push(tm['题目ID']);
                });
              });
            }
            gdtmTempIds = Lazy(gdtmTempIds).uniq().toArray();
            $scope.removeThisPage = false;
            var obj = {method: 'GET', url: tiMuUrl, params: {'返回题目内容': true, '题目ID': JSON.stringify(tmArr)}};
            $http(obj).success(function(data){ //查询题目详情
              if(data.result && data.data){
                var count = 0;
                Lazy(data.data).each(function(tm, idx, lst){
                  tm = DataService.formatDaAn(tm);
                  if($scope.zuJuanParam.tmlTp == 'tmc'){
                    tm.ckd = Lazy($scope.sjzSet['题目池']).contains(tm['题目ID']);
                    if(tm.ckd){
                      count ++;
                    }
                  }
                  if($scope.zuJuanParam.tmlTp == 'gdtm' || $scope.zuJuanParam.tmlTp == 'addSjToSjz'){
                    tm.ckd = Lazy(gdtmTempIds).contains(tm['题目ID']);
                  }
                });
                if(count == data.data.length){
                  $scope.removeThisPage = true;
                }
                $scope.timuDetails = Lazy(data.data).sortBy('题目ID').reverse().toArray();
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
          $scope.selectSjz = '';
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
          $scope.tiXingArr = txName;
          $scope.zuJuanParam = { //组卷参数
            rlTxId: '', //组卷规则题型ID
            rlTmNum: '', //组卷规则题目数量
            rlTmFz: '', //组卷规则题目分值
            rlTmc: false, //组卷规则是否使用题目池
            rlNd: [], //组卷规则难度
            rlNdNm: [], //组卷规则难度名称
            rlTk: [], //组卷规则题库
            rlTkNm: [], //组卷规则题库名称
            rlZsd: [], //组卷规则知识点
            rlZsdName: [], //组卷规则知识点名称
            sjzName: '', //试卷组名称
            tiMuLen: '', //题目数量
            tiKuId: '', //题库ID
            ctr: '', //出题人ID
            cjsjKs: '', //题目创建时间开始
            pvw: false, //试卷预览
            goToPageNum: '', //跳转页面true
            txId: '', //查询题目的题型ID
            tmlTp: '', //题目列表类型
            cgFrom: '', //换题来自哪个地方
            sjzEdit: false, //修改试卷
            sjMsg: '', //试卷题目是否全部选出
            msgClr: true, //信息的颜色
            showDaAn: false, //试卷显示答案
            saveSjBtn: false, //保存试卷按钮
            timuNum: '', //符合条件的题目数量
            sjScore: '', //试卷总分
            showDaTi: false, //大题弹出
            showSjzSj: false //显示试卷组试卷
          };
          Lazy($scope.tiKuList).each(function(tkl){
            tkl.ckd = false;
          });
          $scope.stepNum = {
            one: false,
            two: false
          };
          kmTxData();
          qryTiKu();
          qryChuTiRen();
        };

        /**
         * 换一题的重置函数
         */
        var cgTmResetFun = function(){
          qryTmPar = { //查询题目参数对象
            zsd: [], //知识点
            nd: '', //难度id
            tm: '', //题目id
            tk: [], //题库id
            tx: '', //题型id
            tmly: '', //题目来源ID
            ctr: '', //出题人UID
            ltr: '',  //录题人ID
            cjsjKs: '', //创建时间开始
            cjsjJs: '' //创建时间结束
          };
          Lazy($scope.tmNanDuList).each(function(nd){
            nd.ckd = false;
          });
          $scope.zjDaGangListShow = false;
          $scope.subDsShow = true;
        };

        /**
         * 固定题目检查
         */
        var checkGdtmFenZhi = function(){
          var allHaveFenZhi = true;
          Lazy($scope.sjzSet['组卷规则']).each(function(dt){
            var gdtmArr = dt['固定题目'];
            if(gdtmArr && gdtmArr.length > 0){ //处理随机固定题目
              Lazy(gdtmArr).each(function(tm){
                if(!parseInt(tm['分值'])){
                  allHaveFenZhi = false;
                }
              });
            }
          });
          return allHaveFenZhi;
        };

        /**
         * 加载默认数据
         */
        getDaGangData();

        /**
         * 由所选的知识大纲，得到知识点
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
         * 查询试卷概要的分页代码
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
          resetFun();
          $scope.zjDaGangListShow = false;
          $scope.subDsShow = true;
          $scope.selectSjz = '';
          $scope.showCrumbs = false;
          $scope.cgTiMuObj = { //换题用到的参数
            daTi: '',
            xiaoTi: '',
            idx: '',
            isCgTm: false,
            tx: {
              '题型ID': '',
              '题型名称': ''
            }
          };
          qryShiJuanList();
          $scope.zjTpl = 'views/zujuan/zj_paperList.html';
        };
        $scope.showPaperList();

        /**
         * 显示组卷页
         */
        $scope.makePaper = function(tp, from){
          if(from){
            resetFun();
            $scope.sjzSet['组卷方式'] = tp;
          }
          $scope.zjDaGangListShow = true; //控制加载规则组卷的css
          if(tp == '规则'){
            $scope.showCrumbs = true;
            $scope.stepNum = {
              one: true,
              two: false
            };
            $scope.zjTpl = 'views/zujuan/zj_rule.html'; //加载规则组卷模板
            //显示时间选择器
            var showDatePicker = function() {
              $('.start-date').intimidatetime({
                buttons: [
                  { text: '当前时间', action: function(inst){ inst.value( new Date() ); } }
                ]
              });
            };
            $timeout(showDatePicker, 500);
          }
          $scope.subDsShow = true;
          $scope.onlyShowAddRuleBox = true;
        };

        /**
         * 执行步骤
         */
        $scope.stepTo = function(num){
          if(num == 1){
            $scope.stepNum = {
              one: true,
              two: false
            };
            $scope.zuJuanParam.showDaTi = false;
            $scope.onlyShowAddRuleBox = true;
            //显示时间选择器
            var showDatePicker = function() {
              $('.start-date').intimidatetime({
                buttons: [
                  { text: '当前时间', action: function(inst){ inst.value( new Date() ); } }
                ]
              });
            };
            $timeout(showDatePicker, 500);
          }
          if(num == 2){
            var lmtDt = document.querySelector('.limitDate');
            $scope.sjzSet['限定时间'] = angular.element(lmtDt).val();
            if($scope.zuJuanParam.rlTk && $scope.zuJuanParam.rlTk.length > 0){
              if($scope.zuJuanParam.rlTmc){
                if($scope.tiMuChi && $scope.tiMuChi.length > 0){
                  $scope.stepNum = {
                    one: true,
                    two: true
                  };
                  $scope.onlyShowAddRuleBox = false;
                }
                else{
                  $scope.stepNum = {
                    one: true,
                    two: false
                  };
                  DataService.alertInfFun('pmt', '题目池题目为空！');
                }
              }
              else{
                $scope.stepNum = {
                  one: true,
                  two: true
                };
                $scope.onlyShowAddRuleBox = false;
              }
            }
            else{
              $scope.stepNum = {
                one: true,
                two: false
              };
              DataService.alertInfFun('pmt', '请选择题库！');
            }
          }
        };

        /**
         * 显示大题选择
         */
        $scope.showDaTiBox = function(){
          $scope.zuJuanParam.showDaTi = true;
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
         * 删除本大题
         */
        $scope.deleteDaTi = function(tx){
          if(confirm('确定要删除本大题吗？')){
            $scope.sjzSet['组卷规则'] = Lazy($scope.sjzSet['组卷规则']).reject({'题型ID': tx['题型ID']}).toArray();
            var findTar = Lazy($scope.sjzKmtx).find(function(kmtx){
              return kmtx['题型ID'] == tx['题型ID'];
            });
            findTar.ckd = false;
          }
        };

        /**
         * 删除组卷的条件
         */
        $scope.deleteRule = function(tx, idx){
          tx['随机题目数量'] -= parseInt(tx['随机题目'][idx]['题目数量']);
          tx['随机题目'].splice(idx, 1);
        };

        /**
         * 删除组卷的固定题目
         */
        $scope.deleteTiMu = function(tx, idx, tp){
          if(tp == 'single'){
            tx['题目'].splice(idx, 1);
          }
          else{
            tx['固定题目'].splice(idx, 1);
          }
          var reloadFun = function(){
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, "zjTestList"]);
          };
          $timeout(reloadFun, 500);
        };

        /**
         * 添加题目POP
         */
        $scope.addTiMuPop = function(dt, tp){
          $scope.zuJuanParam.txId = dt['题型ID'];
          $scope.zuJuanParam.rlTxId = dt['题型ID'];
          if(tp == 'single'){ //添加单个试卷
            $scope.sglSjParam.sltDt = dt;
            $scope.zjDaGangListShow = true;
            $scope.onlyShowAddRuleBox = false;
            $scope.zuJuanParam.tmlTp = 'addSjToSjz';
            Lazy($scope.tmNanDuList).each(function(nd){
              nd.ckd = false;
            });
            $scope.qryTiMuByTxId();
            $scope.zjTpl = 'views/zujuan/zj_tiMuSgl.html';
          }
          else{ //其他添加试题
            $scope.addSjz.sltDati = dt || '';
            $scope.addSjz.sltTp = tp || '';
            $scope.cgTiMuObj = { //换题用到的参数
              daTi: '',
              xiaoTi: '',
              idx: '',
              isCgTm: false,
              tx: {
                '题型ID': '',
                '题型名称': ''
              }
            };
            if(tp == 'fiexd'){
              $scope.zuJuanParam.tmlTp = 'gdtm';
              $scope.onlyShowAddRuleBox = false;
              Lazy($scope.tmNanDuList).each(function(nd){
                nd.ckd = false;
              });
              $scope.qryTiMuByTxId();
              $scope.zjTpl = 'views/zujuan/zj_tiMu.html';
            }
            if(tp == 'random'){
              $scope.zuJuanParam.rlTmNum = '';
              $scope.zuJuanParam.rlTmFz = '';
              Lazy($scope.nanDuList).each(function(nd){
                nd.ckd = false;
              });
              $scope.onlyShowAddRuleBox = true;
            }
          }
          $scope.subDsShow = false;
          $scope.showCrumbs = false;
        };

        /**
         * 关闭添加题目POP
         */
        $scope.closeAddTiMuPop = function(){
          $scope.subDsShow = true;
          $scope.showCrumbs = true;
          $scope.onlyShowAddRuleBox = false;
          $scope.addSjz.sltDati = '';
          $scope.zuJuanParam.timuNum = '';
          $scope.zuJuanParam.rlZsd = '';
          $scope.zuJuanParam.rlTxId = '';
          $scope.zuJuanParam.rlNd = '';
          $scope.addSjz.sltTp = '';
        };

        /**
         * 获得难度查询条件
         */
        $scope.getNanDuId = function(nd, tp){
          var ndArr = [];
          var ndArrNm = [];
          nd.ckd = !nd.ckd;
          if(tp == 'zu'){
            Lazy($scope.nanDuList).each(function(ndl){
              if(ndl.ckd){
                ndArr.push(ndl['难度ID']);
                ndArrNm.push(ndl['难度名称']);
              }
            });
            $scope.zuJuanParam.rlNd = ndArr;
            $scope.zuJuanParam.rlNdNm = ndArrNm;
            qryTestNum();
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
          var tkArrNm = [];
          tk.ckd = !tk.ckd;
          Lazy($scope.tiKuList).each(function(tkl){
            if(tkl.ckd){
              tkArr.push(tkl['题库ID']);
              tkArrNm.push(tkl['题库名称']);
            }
          });
          $scope.zuJuanParam.rlTk = tkArr;
          $scope.zuJuanParam.rlTkNm = tkArrNm;
          if($scope.onlyShowAddRuleBox){
            qryTestNum();
          }
        };

        /**
         * 显示试题页面
         */
        $scope.showTiMuList = function(){
          $scope.zuJuanParam.tmlTp = 'tmc';
          Lazy($scope.kowledgeList['节点']).each(_zsdDo);
          $scope.zuJuanParam.txId = '';
          Lazy($scope.tmNanDuList).each(function(nd){
            nd.ckd = false;
          });
          $scope.subDsShow = false;
          $scope.showCrumbs = false;
          $scope.onlyShowAddRuleBox = false;
          qryTmPar.tx = '';
          qryTmPar.nd = '';
          qryTestFun(1);
          $scope.zjTpl = 'views/zujuan/zj_tiMu.html';
        };

        /**
         * 添加全部题目到题目池
         */
        $scope.addTmToTmc = function(tp, tm){
          var data = [];
          if(tp == 'all'){
            data = allTiMuIds;
            $scope.backToSjz();
          }
          if(tp == 'page'){
            data = $scope.timuDetails;
            $scope.removeThisPage = true;
          }
          if(tp == 'sgl'){
            data.push(tm);
          }
          var disByTxId = Lazy(data).groupBy('题型ID').toObject();
          Lazy(disByTxId).each(function(v, k, l){
            var vIds = [];
            Lazy(v).each(function(tmlb){
              vIds.push(tmlb['题目ID']);
              tmlb.ckd = true;
            });
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
        $scope.cleanTiMuChi = function(tp, tm){
          if(tp == 'sgl'){
            $scope.sjzSet['题目池'] = Lazy($scope.sjzSet['题目池']).without(tm['题目ID']).uniq().toArray();
            $scope.tiMuChi = Lazy($scope.tiMuChi).reject(function(tmctx){
              return tmctx['题型ID'] == tm['题型ID'];
            }).toArray();
          }
          if(tp == 'all'){
            $scope.sjzSet['题目池'] = [];
            $scope.tiMuChi = [];
          }
        };

        /**
         * 得到分页数据
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
         * 查询试题的函数
         */
        var qryTestFun = function(pg){
          $scope.loadingImgShow = true;
          tiMuIdArr = [];
          pageArr = [];
          var obj = {method: 'GET', url: tiMuUrl, params: {'学校ID': jgID, '科目ID': keMuId, '返回题目内容': false}};
          if(qryTmPar.zsd && qryTmPar.zsd.length > 0){
            obj.params['知识点'] = JSON.stringify(qryTmPar.zsd);
          }
          if(qryTmPar.tx){
            obj.params['题型ID'] = qryTmPar.tx;
          }
          if(qryTmPar.tk && qryTmPar.tk.length > 0){
            obj.params['题库ID'] = JSON.stringify(qryTmPar.tk);
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
            if(tmlb.result && tmlb.data){
              var timuliebiao = Lazy(tmlb.data).sortBy('题目ID').reverse().toArray();
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
         * 题目数量
         */
        var qryTestNum = function(){
          var obj = {
            method: 'GET',
            url: tiMuUrl,
            params: {
              '学校ID': jgID,
              '科目ID': keMuId,
              '只返回题目数': true
            }
          };
          var mis = [];
          $scope.zuJuanParam.timuNum = '';
          if(!$scope.zuJuanParam.rlZsd.length){
            mis.push('知识点');
          }
          if(!$scope.zuJuanParam.rlTxId){
            mis.push('题型ID');
          }
          if(!$scope.zuJuanParam.rlNd.length){
            mis.push('难度');
          }
          if(!$scope.zuJuanParam.rlTk.length){
            mis.push('题库ID');
          }
          if(!mis.length){
            obj.params['知识点'] = JSON.stringify($scope.zuJuanParam.rlZsd);
            obj.params['题型ID'] = $scope.zuJuanParam.rlTxId;
            obj.params['难度'] = JSON.stringify($scope.zuJuanParam.rlNd);
            obj.params['题库ID'] = JSON.stringify($scope.zuJuanParam.rlTk);
            $http(obj).success(function(data){ //查询题目列表
              if(data.result && data.data){
                $scope.zuJuanParam.timuNum = data.data['题目数'];
              }
              else{
                $scope.zuJuanParam.timuNum = '';
              }
            });
          }
        };

        /**
         * 通过录题库查询试题
         */
        $scope.qryTiMuByTiKu = function(){
          qryTmPar.tk = [];
          if($scope.zuJuanParam.tiKuId){
            qryTmPar.tk.push($scope.zuJuanParam.tiKuId);
          }
          else{
            qryTmPar.tk = angular.copy(allTkIds);
          }
          qryTestFun();
        };

        /**
         * 通过出题人的UID查询试题
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
         * 通过创建时间查询试题
         */
        $scope.qryTiMuByCjsj = function(){
          if($scope.zuJuanParam.cjsjKs){
            qryTmPar.cjsjKs = $scope.zuJuanParam.cjsjKs;
            qryTmPar.cjsjJs = new Date();
            qryTestFun();
          }
        };

        /**
         * 得到特定页面的数据
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
          if($scope.zuJuanParam.tmlTp == 'gdtm'){
            $scope.subDsShow = true;
            $scope.onlyShowAddRuleBox = false;
            $scope.zjTpl = 'views/zujuan/zj_rule.html';
          }
          if($scope.zuJuanParam.tmlTp == 'tmc'){
            $scope.subDsShow = true;
            $scope.zjTpl = 'views/zujuan/zj_rule.html';
          }
          if($scope.cgTiMuObj.isCgTm){
            cgTmResetFun();
            if($scope.zuJuanParam.cgFrom == 'edit'){
              $scope.zjTpl = 'views/zujuan/zj_editPvw.html';
            }
            else{
              $scope.zjTpl = 'views/zujuan/zj_pvw.html';
            }
            $scope.cgTiMuObj.isCgTm = false;
          }
          Lazy($scope.kowledgeList['节点']).each(_zsdDo);
          $scope.zuJuanParam.tmlTp = '';
          $scope.showCrumbs = true;
        };

        /**
         * 返回组卷规则
         */
        $scope.backToRule = function(tp){
          $scope.zuJuanParam.tmlTp = '';
          $scope.showCrumbs = true;
          if(tp == 'single'){
            $scope.zjDaGangListShow = false;
            $scope.sglSjParam.sltDt = '';
            $scope.subDsShow = true;
            Lazy($scope.kowledgeList['节点']).each(_zsdDo);
            $scope.zjTpl = 'views/zujuan/zj_addSj.html';
          }
          else{
            $scope.zjTpl = 'views/zujuan/zj_rule.html';
          }
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
         点击checkbox得到checkbox的值
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
        $scope.addToPaper = function(tm, tp){
          if(tp == 'single'){
            var dtNum = $scope.sglSjParam.sltDt['题目数量'];
            var addNum = $scope.sglSjParam.sltDt['题目'].length;
            if(dtNum > addNum){
              tm.ckd = true;
              $scope.sglSjParam.sltDt['题目'].push(tm);
            }
            else{
              DataService.alertInfFun('pmt', $scope.sglSjParam.sltDt['大题名称'] + '已全部选出！');
            }
          }
          else{
            tm.ckd = true;
            $scope.addSjz.sltDati['固定题目'].push(tm);
          }
        };

        /**
         * 移除题目
         */
        $scope.removeOut = function(tp, tm){
          var data = [];
          if(tp == 'page'){
            data = $scope.timuDetails;
            $scope.removeThisPage = false;
          }
          if(tp == 'sgl'){
            data.push(tm);
          }
          if($scope.zuJuanParam.tmlTp=='tmc'){ //题目池
            var disByTxId = Lazy(data).groupBy('题型ID').toObject();
            Lazy(disByTxId).each(function(v, k, l){
              var vIds = [];
              Lazy(v).each(function(tmlb){
                vIds.push(tmlb['题目ID']);
                tmlb.ckd = false;
              });
              $scope.sjzSet['题目池'] = Lazy($scope.sjzSet['题目池']).without(vIds).uniq().toArray();
              var fidTar = Lazy($scope.tiMuChi).find(function(tc){
                return tc['题型ID'] == k;
              });
              if(fidTar){
                fidTar['题目ID'] = Lazy(fidTar['题目ID']).without(vIds).uniq().toArray();
                var tmNum = fidTar['题目ID'].length;
                if(tmNum){
                  fidTar['题目数量'] = fidTar['题目ID'].length;
                }
                else{
                  $scope.tiMuChi = Lazy($scope.tiMuChi).reject(function(tmctx){
                    return tmctx['题型ID'] == k;
                  }).toArray();
                }
              }
            });
          }
          if($scope.zuJuanParam.tmlTp=='gdtm'){ //固定题目
            tm.ckd = false;
            $scope.addSjz.sltDati['固定题目'] = Lazy($scope.addSjz.sltDati['固定题目']).reject(function(tmd){
              return tmd['题目ID'] == tm['题目ID'];
            }).toArray();
          }
        };

        /**
         * 添加单张试卷用到的题目移除
         */
        $scope.removeOutSgl = function(tm){
          tm.ckd = false;
          $scope.sglSjParam.sltDt['题目'] = Lazy($scope.sglSjParam.sltDt['题目']).reject(function(tmd){
            return tmd['题目ID'] == tm['题目ID'];
          }).toArray();
        };

        /**
         * 规则组卷将条件添加到相应的数组
         */
        $scope.addRule = function(){
          if($scope.addSjz.sltDati){
            var mis = [];
            var singleRl = {
              '题目分值': parseInt($scope.zuJuanParam.rlTmFz),
              '题目数量': parseInt($scope.zuJuanParam.rlTmNum),
              '使用题目池': $scope.zuJuanParam.rlTmc,
              '限定题库': $scope.zuJuanParam.rlTk,
              '限定题库名称': $scope.zuJuanParam.rlTkNm,
              '题型': $scope.zuJuanParam.rlTxId,
              '难度': $scope.zuJuanParam.rlNd,
              '难度名称': $scope.zuJuanParam.rlNdNm,
              '知识点': $scope.zuJuanParam.rlZsd,
              '知识点名称': $scope.zuJuanParam.rlZsdName
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
              $scope.addSjz.sltDati['随机题目数量'] = $scope.addSjz.sltDati['随机题目数量'] || 0;
              $scope.addSjz.sltDati['随机题目数量'] += parseInt($scope.zuJuanParam.rlTmNum);
            }
          }
          else{
            DataService.alertInfFun('pmt', '请选择大题！');
          }
        };

        /**
         * 生成试卷
         */
        $scope.generatePaper = function(){
          $scope.sjList = [];
          var chkFz = checkGdtmFenZhi();
          if(!chkFz){
            DataService.alertInfFun('pmt', '固定题目分值不能为空！');
            return ;
          }
          var gzObj = angular.copy($scope.sjzSet);
          var mis = [];
          var isHasRule = 0;
          Lazy(gzObj['组卷规则']).each(function(dt){
            var gdtmArr = angular.copy(dt['固定题目']);
            var sjtmArr = dt['随机题目'];
            var newGdtm = [];
            if(gdtmArr && gdtmArr.length > 0){ //处理固定题目
              Lazy(gdtmArr).each(function(tm){
                var ntm = {
                  '题目ID': tm['题目ID'],
                  '分值': parseInt(tm['分值'])
                };
                newGdtm.push(ntm);
              });
              dt['固定题目'] = newGdtm;
            }
            else{
              delete dt['固定题目'];
            }
            if(sjtmArr && sjtmArr.length > 0){ //处理随机规则
              Lazy(dt['随机题目']).each(function(sjr){
                delete sjr['限定题库名称'];
                delete sjr['难度名称'];
                delete sjr['知识点名称'];
              });
            }
            else{
              delete dt['随机题目'];
            }
            if(!(gdtmArr && gdtmArr.length > 0) && !(sjtmArr && sjtmArr.length > 0)){
              isHasRule ++;
            }
          });
          gzObj['试卷数量'] = parseInt(gzObj['试卷数量']) ? parseInt(gzObj['试卷数量']) : mis.push('试卷数量');
          if(!$scope.zuJuanParam.sjzName){
            mis.push('试卷组名称');
          }
          if(gzObj['限定时间']){
            gzObj['限定时间'] = DataService.formatDateZh(gzObj['限定时间']);
          }
          else{
            delete gzObj['限定时间'];
          }
          if(isHasRule == gzObj['组卷规则'].length){
            mis.push('固定题目或规则');
          }
          $scope.btnDisable = true;
          if(mis && mis.length > 0){
            $scope.btnDisable = false;
            DataService.alertInfFun('err', '缺少：' + mis.join('；'));
          }
          else{
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
            $scope.fbdBtn = true;
            $http(obj).success(function(data){
              if(data.result){
                $scope.btnDisable = false;
                Lazy(data.data).each(function(sj, idx, lst){
                  Lazy(sj['试卷题目']).each(function(dt){
                    Lazy(dt['题目']).each(function(tm){
                      tm = DataService.formatDaAn(tm);
                    });
                  });
                });
                $scope.sjList = data.data;
                $scope.showCrumbs = false;
                $scope.zuJuanParam.pvw = true;
                $scope.zjTpl = 'views/zujuan/zj_pvw.html';
                $scope.showShiJuanDtl($scope.sjList[0], 0);
              }
              else{
                $scope.btnDisable = false;
                DataService.alertInfFun('err', data.error);
              }
            });
          }
        };

        /**
         * 显示试卷详情
         */
        $scope.showShiJuanDtl = function(sj, idx){
          var mis = [];
          $scope.zuJuanParam.sjScore = 0;
          Lazy(sj['试卷题目']).each(function(dt){
            dt['大题分值'] = Lazy(dt['题目']).reduce(function(memo, tm){
              return memo + parseInt(tm['分值']);
            }, 0);
            $scope.zuJuanParam.sjScore += dt['大题分值'];
            var fdTar = Lazy($scope.sjzSet['组卷规则']).find(function(gzDt){
              return gzDt['大题名称'] == dt['大题名称'];
            });
            var gzDtNum = 0; //规则的题目数量
            var sjDtNum = dt['题目'] ? dt['题目'].length : 0; //试卷的数量
            if(fdTar){
              gzDtNum += fdTar['固定题目'] ? fdTar['固定题目'].length : 0;
              if(fdTar['随机题目'] && fdTar['随机题目'].length > 0){
                Lazy(fdTar['随机题目']).each(function(sjgz){
                  gzDtNum += parseInt(sjgz['题目数量']);
                });
              }
              var diff = gzDtNum - sjDtNum;
              if(diff){
                mis.push(dt['大题名称'] + '缺少:' + diff + '题');
              }
            }
            else{
              mis.push(dt['大题名称'] + '缺少:' + sjDtNum + '题');
            }
          });
          if(mis && mis.length > 0){
            $scope.zuJuanParam.msgClr = true;
            $scope.zuJuanParam.sjMsg = mis.join(';');
          }
          else{
            $scope.zuJuanParam.msgClr = false;
            $scope.zuJuanParam.sjMsg = '试卷题目已全部选出';
          }
          $scope.paperDtl = sj || '';
          $scope.shiJuanActive = idx > -1 ? idx : '';
        };

        /**
         *  大题的上下移动
         */
        $scope.moveDaTi = function(idx, dirt){
          var toIndex = idx + dirt;
          var item = $scope.sjzSet['组卷规则'][idx];
          if(dirt > 0){
            $scope.sjzSet['组卷规则'].splice(toIndex + 1, 0, item);
            $scope.sjzSet['组卷规则'].splice(idx, 1);
          }
          else{
            $scope.sjzSet['组卷规则'].splice(idx, 1);
            $scope.sjzSet['组卷规则'].splice(toIndex, 0, item);
          }
        };

        /**
         * 上下移动题目
         */
        $scope.moveTM = function(idx, dirt, tx, tm, tp){
          var toIndex = idx + dirt;
          if(tp == 'shijuan'){
            if(dirt > 0){
              tx['题目'].splice(toIndex + 1, 0, tm);
              tx['题目'].splice(idx, 1);
            }
            else{
              tx['题目'].splice(idx, 1);
              tx['题目'].splice(toIndex, 0, tm);
            }
          }
          else{
            if(dirt > 0){
              tx['固定题目'].splice(toIndex + 1, 0, tm);
              tx['固定题目'].splice(idx, 1);
            }
            else{
              tx['固定题目'].splice(idx, 1);
              tx['固定题目'].splice(toIndex, 0, tm);
            }
          }
          var reloadFun = function(){
            if(tp == 'shijuan'){
              MathJax.Hub.Queue(["Typeset", MathJax.Hub, "paperWrap"]);
            }
            else{
              MathJax.Hub.Queue(["Typeset", MathJax.Hub, "zjTestList"]);
            }
          };
          $timeout(reloadFun, 500);
        };

        /**
         * 显示试卷大题编辑
         */
        $scope.showSjzEdit = function(){
          $scope.zuJuanParam.sjzEdit = true;
        };

        /**
         * 显示试卷大题编辑
         */
        $scope.closeSjzEdit = function(){
          $scope.zuJuanParam.sjzEdit = false;
          $scope.zuJuanParam.showDaTi = false;
        };

        /**
         * 保存组卷规则
         */
        $scope.saveZjRule = function(){
          var chkFz = checkGdtmFenZhi();
          if(!chkFz){
            DataService.alertInfFun('pmt', '固定题目分值不能为空！');
            return ;
          }
          var gzObj = angular.copy($scope.sjzSet);
          var mis = [];
          Lazy(gzObj['组卷规则']).each(function(dt){
            var gdtmArr = angular.copy(dt['固定题目']);
            var sjtmArr = dt['随机题目'];
            var newGdtm = [];
            if(gdtmArr && gdtmArr.length > 0){ //处理随机固定题目
              Lazy(gdtmArr).each(function(tm){
                var ntm = {
                  '题目ID': tm['题目ID'],
                  '分值': parseInt(tm['分值'])
                };
                newGdtm.push(ntm);
              });
              dt['固定题目'] = newGdtm;
            }
            else{
              delete dt['固定题目'];
            }
            if(sjtmArr && sjtmArr.length > 0){ //处理随机规则
              Lazy(dt['随机题目']).each(function(sjr){
                delete sjr['限定题库名称'];
                delete sjr['难度名称'];
                delete sjr['知识点名称'];
                sjr['使用题目池'] = $scope.zuJuanParam.rlTmc;
              });
            }
            else{
              delete dt['随机题目'];
            }
          });
          gzObj['试卷数量'] = parseInt(gzObj['试卷数量']) ? parseInt(gzObj['试卷数量']) : mis.push('试卷数量');
          if(gzObj['限定时间']){
            gzObj['限定时间'] = DataService.formatDateZh(gzObj['限定时间']);
          }
          else{
            delete gzObj['限定时间'];
          }
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
          if($scope.selectSjz){ //由试卷列表点击得来
            obj.method = 'POST';
            obj.data['试卷组ID'] = $scope.selectSjz['试卷组ID'];
            obj.data['试卷组名称'] = $scope.selectSjz['试卷组名称'];
            obj.data['学校ID'] = $scope.selectSjz['学校ID'];
            obj.data['科目ID'] = $scope.selectSjz['科目ID'];
            obj.data['创建人UID'] = $scope.selectSjz['创建人UID'];
          }
          if(!$scope.zuJuanParam.sjzName){
            mis.push('试卷组名称');
          }
          if(mis && mis.length > 0){
            DataService.alertInfFun('pmt', '缺少：' + mis.join('，'));
          }
          else{
            $scope.btnDisable = true;
            if($scope.sjzSet['组卷方式'] == '规则' && $scope.sjList && $scope.sjList.length > 0 && !$scope.selectSjz){ //规则组卷
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
            }
            $http(obj).success(function(data){
              if(data.result){
                $scope.btnDisable = false;
                $scope.showPaperList();
                DataService.alertInfFun('suc', '保存成功！');
              }
              else{
                $scope.btnDisable = false;
                DataService.alertInfFun('err', data.error);
              }
            });
          }
        };

        /**
         * 删除试卷组弹出 cancelDltSjz
         */
        $scope.deleteSjzPop = function(sjzId, idx) {
          $scope.dltSjzPar = {
            '弹出': true,
            '生成验证码': '',
            '输入验证码': '',
            '试卷组ID': sjzId,
            '试卷组索引': idx
          };
          var yzm = [];
          for (var i = 0; i < 4; i++){
            yzm.push(Math.floor(Math.random() * 10));
          }
          $scope.dltSjzPar['生成验证码'] = yzm.join('');
        };

        /**
         * 取消删除试卷组
         */
        $scope.cancelDltSjz = function(){
          $scope.dltSjzPar = {
            '弹出': false,
            '生成验证码': '',
            '输入验证码': '',
            '试卷组ID': '',
            '试卷组索引': ''
          };
        };

        /**
         * 删除试卷组
         */
        $scope.deleteSjz = function(){
          if($scope.dltSjzPar['生成验证码'] == $scope.dltSjzPar['输入验证码']){
            var obj = {method: 'POST', url: shiJuanZuUrl, data: {'试卷组ID': '', '状态': -1}};
            if($scope.dltSjzPar['试卷组ID']){
              obj.data['试卷组ID'] = $scope.dltSjzPar['试卷组ID'];
              if(confirm('确定要删除此试卷组吗？')){
                $http(obj).success(function(data){
                  if(data.result){
                    $scope.paperListData.splice($scope.dltSjzPar['试卷组索引'], 1);
                    $scope.cancelDltSjz();
                    DataService.alertInfFun('suc', '删除成功！');
                  }
                  else{
                    DataService.alertInfFun('pmt', data.error);
                  }
                });
              }
            }
            else{
              $scope.cancelDltSjz();
              DataService.alertInfFun('pmt', '请选择要删除的试卷组！');
            }
          }
          else{
            DataService.alertInfFun('pmt', '输入的验证码错误！');
          }
        };

        /**
         * 由是试卷列表点击展示试卷详情
         */
        $scope.showPaperDetail = function(sjz){
          var tp = sjz['试卷组设置']['组卷方式'];
          $scope.sjzSet = sjz['试卷组设置'];
          $scope.selectSjz = sjz || '';
          $scope.zuJuanParam.sjzName = sjz['试卷组名称'];
          var tmArr = '';
          if(tp == '规则'){
            $scope.zuJuanParam.saveSjBtn = true;
            Lazy($scope.sjzSet['组卷规则']).each(function(dt){
              var sjrArr = dt['随机题目'];
              var gdtmArr = dt['固定题目'];
              if(sjrArr && sjrArr.length > 0){
                Lazy(sjrArr).each(function(sjr){
                  var tkName = [];
                  var ndName = [];
                  var zsdName = [];
                  Lazy(sjr['限定题库']).each(function(tkId){
                    Lazy($scope.tiKuList).each(function(tk){
                      if(tk['题库ID'] == tkId){
                        tkName.push(tk['题库名称']);
                      }
                    });
                  });
                  Lazy(sjr['难度']).each(function(ndId){
                    Lazy($scope.nanDuList).each(function(nd){
                      if(nd['难度ID'] == ndId){
                        ndName.push(nd['难度名称']);
                      }
                    });
                  });
                  function _do(item) {
                    var inZsdArr = Lazy(sjr['知识点']).contains(item['知识点ID']);
                    if(inZsdArr){
                      zsdName.push(item['知识点名称']);
                    }
                    if(item['子节点'] && item['子节点'].length > 0){
                      Lazy(item['子节点']).each(_do);
                    }
                  }
                  if($scope.kowledgeList && $scope.kowledgeList['节点']){
                    Lazy($scope.kowledgeList['节点']).each(_do);
                  }
                  sjr['限定题库名称'] = tkName;
                  sjr['难度名称'] = ndName;
                  sjr['知识点名称'] = zsdName;
                });
              }
              if(gdtmArr && gdtmArr.length > 0){
                tmArr = '';
                var oneSj = sjz['试卷'][0]['试卷题目'];
                var fdTar = Lazy(oneSj).find(function(dt1){
                  return dt1['大题名称'] == dt['大题名称'];
                });
                tmArr = fdTar['题目'];
                Lazy(gdtmArr).each(function(gdtm){
                  if(tmArr && tmArr.length > 0){
                    var fdTm = Lazy(tmArr).find(function(tm){
                      return tm['题目ID'] == gdtm['题目ID'];
                    });
                    if(fdTm){
                      gdtm['题目内容'] = fdTm['题目内容'];
                    }
                    else{
                      gdtm['题目内容'] = [];
                    }
                  }
                });
              }
            });
            Lazy(sjz['试卷']).each(function(sj, idx, lst){
              Lazy(sj['试卷题目']).each(function(dt){
                Lazy(dt['题目']).each(function(tm){
                  tm = DataService.formatDaAn(tm);
                });
              });
            });
            $scope.sjList = sjz['试卷'];
            $scope.showCrumbs = true;
            $scope.stepNum = {
              one: true,
              two: false
            };
            $scope.zjTpl = 'views/zujuan/zj_editPvw.html';
            if($scope.sjList[0]){
              $scope.showShiJuanDtl($scope.sjList[0], 0);
            }
            else{
              DataService.alertInfFun('pmt', '没有符合条件的试卷！');
            }
          }
        };

        /**
         * 换一题
         */
        $scope.changeItem = function(tx, tm, idx, tp){
          var txId = parseInt(tm['题型ID']);
          $scope.cgTiMuObj = { //换题用到的参数
            daTi: tx,
            xiaoTi: tm,
            idx: idx,
            isCgTm: true,
            tx: {
              '题型ID': txId,
              '题型名称': txName[txId - 1]
            }
          };
          $scope.zjDaGangListShow = true;
          $scope.onlyShowAddRuleBox = false;
          $scope.subDsShow = false;
          $scope.showCrumbs = false;
          $scope.zuJuanParam.txId = tm['题型ID'];
          $scope.zuJuanParam.tmlTp = 'cgtm';
          $scope.zuJuanParam.cgFrom = tp;
          $scope.qryTiMuByTxId();
          $scope.zjTpl = 'views/zujuan/zj_tiMu.html';
        };

        /**
         * 将选择好的题目加入试卷
         */
        $scope.changeThisTiMu = function(tm){
          var idx = $scope.cgTiMuObj.idx;
          var fdTar = Lazy($scope.cgTiMuObj.daTi['题目']).find(function(item){
            return item['题目ID'] == tm['题目ID'];
          });
          if(fdTar){
            DataService.alertInfFun('pmt', '你选择的题目在试卷中已存在，请选择其他题目！');
          }
          else{
            var timu = {
              '分值': $scope.cgTiMuObj.daTi['题目'][idx]['分值'],
              '题型ID': tm['题型ID'],
              '题目ID': tm['题目ID'],
              '题目内容': tm['题目内容'],
              '题目类型ID': tm['题目类型ID']
            };
            $scope.cgTiMuObj.daTi['题目'].splice(idx, 1, timu);
            cgTmResetFun();
            Lazy($scope.kowledgeList['节点']).each(_zsdDo);
            if($scope.zuJuanParam.cgFrom == 'edit'){
              $scope.showCrumbs = true;
              $scope.zjTpl = 'views/zujuan/zj_editPvw.html';
            }
            else{
              $scope.zjTpl = 'views/zujuan/zj_pvw.html';
            }
          }
        };

        /**
         * 保存试卷
         */
        $scope.saveShiJuan = function(){
          var obj = {method: 'POST', url: shiJuanUrl, data: {'试卷ID': '', '试卷题目': ''}};
          if($scope.paperDtl){
            var sjtmArr = [];
            obj.data['试卷ID'] = $scope.paperDtl['试卷ID'];
            Lazy($scope.paperDtl['试卷题目']).each(function(dt){
              var sjtmObj = {
                '大题ID': dt['大题ID'],
                '题目': []
              };
              Lazy(dt['题目']).each(function(tm){
                var tmObj = {
                  '题目ID': tm['题目ID'],
                  '分值': tm['分值']
                };
                sjtmObj['题目'].push(tmObj);
              });
              sjtmArr.push(sjtmObj);
            });
            if(sjtmArr.length > 0){
              obj.data['试卷题目'] = JSON.stringify(sjtmArr);
              $scope.loadingImgShow = true;
              $http(obj).success(function(data){
                if(data.result){
                  DataService.alertInfFun('suc', '试卷保存成功！');
                }
                else{
                  DataService.alertInfFun('err', data.error);
                }
                $scope.loadingImgShow = false;
              });
            }
            else{
              DataService.alertInfFun('pmt', '试卷内容为空！');
            }
          }
          else{
            DataService.alertInfFun('pmt', '请选择要保存的试卷！');
          }
        };

        /**
         * 显示试卷组试卷
         */
        $scope.showSjzPaper = function(){
          $scope.zuJuanParam.showSjzSj = true;
        };

        /**
         * 关闭试卷组试卷
         */
        $scope.closeSjzPaper = function(){
          $scope.zuJuanParam.showSjzSj = false;
        };

        /**
         * 给试卷组添加单个试卷
         */
        $scope.addPaperToSjz = function(){
          $scope.singleSj = [];
          $scope.sglSjParam = {
            sltDt: '',
            sjScore: 0
          };
          Lazy($scope.sjzSet['组卷规则']).each(function(gz){
            var dtObj = {
              '大题名称': gz['大题名称'],
              '题目数量': 0,
              '题型ID': gz['题型ID'],
              '题目': []
            };
            if(gz['固定题目'] && gz['固定题目'].length > 0){
              dtObj['题目数量'] += gz['固定题目'].length;
            }
            dtObj['题目数量'] += gz['随机题目数量'];
            $scope.singleSj.push(dtObj);
          });
          $scope.zjTpl = 'views/zujuan/zj_addSj.html';
        };

        /**
         * 计算单张试卷的分值
         */
        $scope.addSjNum = function(){
          $scope.sglSjParam.sjScore = 0;
          Lazy($scope.singleSj).each(function(dt){
            Lazy(dt['题目']).each(function(tm){
              var fenZhi = parseInt(tm['分值']);
              if(fenZhi){
                $scope.sglSjParam.sjScore += fenZhi;
              }
            });
          });
        };

        /**
         * 添加单个试卷
         */
        $scope.addSingleSj = function(){
          var allHaveFenZhi = false;
          var sjArr = [
            {
              '试卷题目': []
            }
          ];
          Lazy($scope.singleSj).each(function(dt){
            var dtObj = {
              '大题名称': dt['大题名称'],
              '题目': []
            };
            Lazy(dt['题目']).each(function(tm){
              var fenZhi = parseInt(tm['分值']);
              var tmObj = {
                '题目ID': tm['题目ID'],
                '分值': ''
              };
              if(fenZhi){
                tmObj['分值'] = fenZhi;
                dtObj['题目'].push(tmObj);
              }
              else{
                allHaveFenZhi = true;
              }
            });
            sjArr[0]['试卷题目'].push(dtObj);
          });
          if(allHaveFenZhi){
            DataService.alertInfFun('pmt', '固定题目分值不能为空！');
            return ;
          }
          var obj = {
            method: 'PUT',
            url: shiJuanZuShiJuanUrl,
            data: {
              '试卷组ID': '',
              '试卷': ''
            }
          };
          if($scope.selectSjz){
            obj.data['试卷组ID'] = $scope.selectSjz['试卷组ID'];
            obj.data['试卷'] = JSON.stringify(sjArr);
            $http(obj).success(function(data){
              if(data.result){
                $scope.showPaperList();
                DataService.alertInfFun('err', '添加成功！');
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
            });
          }
          else{
            DataService.alertInfFun('pmt', '请选择试卷组！');
          }
        };

        /**
         * 修改试卷组
         */
        $scope.alterSjz = function(){
          //试卷名称
          $scope.zuJuanParam.sjzName = $scope.selectSjz['试卷组名称'];
          //题库反选
          var tkIds = [];
          var tkArr = [];
          var tkArrNm = [];
          Lazy($scope.sjzSet['组卷规则']).each(function(rl){
            Lazy(rl['随机题目']).each(function(sjtm){
              tkIds = Lazy(tkIds).union(sjtm['限定题库']);
              if(sjtm['使用题目池']){
                $scope.zuJuanParam.rlTmc = true;
              }
            });
          });
          Lazy($scope.tiKuList).each(function(tk){
            var fdTar = Lazy(tkIds).find(function(tkid){
              return tkid == tk['题库ID'];
            });
            if(fdTar){
              tk.ckd = true;
              tkArr.push(tk['题库ID']);
              tkArrNm.push(tk['题库名称']);
            }
          });
          $scope.zuJuanParam.rlTk = tkArr;
          $scope.zuJuanParam.rlTkNm = tkArrNm;
          //题目池
          $scope.tiMuChi = [];
          if($scope.sjzSet['题目池'] && $scope.sjzSet['题目池'].length > 0){
            var tmObj = {
              method: 'GET',
              url: tiMuUrl,
              params: {
                '题目ID': JSON.stringify($scope.sjzSet['题目池']),
                '返回题目内容': false
              }
            };
            $http(tmObj).success(function(tmlb){ //查询题目列表
              if(tmlb.result && tmlb.data){
                var disByTxId = Lazy(tmlb.data).groupBy('题型ID').toObject();
                Lazy(disByTxId).each(function(v, k, l){
                  var vIds = [];
                  Lazy(v).each(function(tmlb){
                    vIds.push(tmlb['题目ID']);
                    tmlb.ckd = true;
                  });
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
              }
              else{
                DataService.alertInfFun('err', tmlb.error || '没有数据！');
              }
            });
          }
          //显示页面
          $scope.makePaper('规则', false);
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
          MathJax.Hub.Queue(["Typeset", MathJax.Hub, "paperWrap"]);
        });

      }]); //controller的结束 )
}); // 001
