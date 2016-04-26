define(['angular', 'config', 'jquery', 'lazy', 'mathjax', 'markitup', 'setJs'], function (angular, config, $, lazy, mathjax, markitup, setJs) {
  'use strict';
  angular.module('zhifzApp.controllers.MingtiCtrl', [])
    .controller('MingtiCtrl', ['$rootScope', '$scope', '$http', '$q', '$timeout', 'DataService', '$cookieStore',
      function ($rootScope, $scope, $http, $q, $timeout, DataService, $cookieStore) {
        /**
         * 声明变量
         */
        //var baseMtAPIUrl = config.apiurl_mt; //mingti的api
        //var baseRzAPIUrl = config.apiurl_rz; //renzheng的api
        //var token = config.token;
        //var letterArr = config.letterArr;
        //var chaxunzilingyu = true;
        //var qryKnowledge = ''; //定义一个空的查询知识点的url
        //var checkSchoolTiKu = caozuoyuan; //查看学校题库需要传的参数
        //var zsdgZsdArr = []; //存放所有知识大纲知识点的数组
        //var danxuan_data; //单选题数据模板
        //var duoxuan_data; //多选题数据模板
        //var jisuan_data; //计算题数据模板
        //var jieda_data; //解答题数据模板
        //var pandu_data; //判断题数据模板
        //var tiankong_data; //填空题数据模板
        //var yuedu_data; //阅读题数据模板
        //var zhengming_data;//证明题数据模板
        //var tkLoopArr = []; //用于填空题支循环的数组
        //var tznrIsNull;//用了判断题支内容是否为空
        //var deleteTiMuUrl = baseMtAPIUrl + 'shanchu_timu'; //删除题目的url
        //var deleteTiMuData = { //删除题目的数据格式
        //    token: config.token,
        //    //caozuoyuan: userInfo.UID,
        //    jigouid: jigouid,
        //    lingyuid: lingyuid,
        //    timu_id: ''
        //  };
        //var totalPage; //符合条件的数据一共有多少页
        //var itemNumPerPage = 10; //每页显示多少条数据
        //var paginationLength = 11; //分页部分，页码的长度，目前设定为11
        //var testListStepZst; //用了保存查询试题阶段的知识点
        //var isEditItemStep = true; //是否是编辑阶段
        //var getUserNameBase = baseRzAPIUrl + 'get_user_name?token=' + token + '&uid='; //得到用户名的URL
        //var isDanXuanType = false; //判断是否出单选题
        //var isDuoXuanType = false; //判断是否出多选题
        //var uploadFileUrl = baseMtAPIUrl + 'upload_file';//文件上传
        //var showFileUrl =  '/show_file/';//文件显示
        //var fileTypeReg = /\.\b\w+$\b/; // 匹配文件类型/\.(\w+)$/  \.\b\w+$\b
        //var qryMoRenDgUrl = baseMtAPIUrl + 'chaxun_zhishidagang?token=' + token + '&caozuoyuan=' + caozuoyuan + '&jigouid='
        //    + jigouid + '&lingyuid=' + lingyuid + '&chaxunzilingyu=' + chaxunzilingyu + '&moren=1'; //查询默认知识大纲的url
        //var queryTiMuSource = baseMtAPIUrl + 'query_timusource?token=' + token + '&jigouid=' + jigouid
        //    + '&lingyuid=' + lingyuid; //查询题目来源
        var loginUsr = JSON.parse($cookieStore.get('ckUsr'));
        var jgID = loginUsr['学校ID']; //登录用户学校
        var logUid = loginUsr['UID']; //登录用户的UID
        var dftKm = JSON.parse($cookieStore.get('ckKeMu')); //默认选择的科目
        var keMuId = dftKm['科目ID']; //默认的科目ID
        var lingYuId = dftKm['领域ID']; //默认的科目ID
        var xueXiaoKeMuTiXingUrl = '/xuexiao_kemu_tixing'; //学校科目题型
        var zhiShiDaGangUrl = '/zhishidagang'; //知识大纲
        var tiMuUrl = '/timu'; //题目的URL
        var luTiRenUrl = '/lutiren'; //录题人
        var chuTiRenUrl = '/chutiren'; //出题人
        var tiKuUrl = '/tiku'; //题库
        var tiMuLaiYuanUrl = '/timulaiyuan'; //题目来源
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
          ltr: ''  //录题人ID
        };
        var allTiMuIds = ''; //存放所有题目id
        var tkLoopArr = []; //用于填空题支循环的数组
        var regRN = /\r\n/g; //匹配enter换行
        var regN = /\n/g; //匹配换行
        var replaceStr = '<br/>'; //匹配<br/>
        $scope.defaultKeMu = dftKm; //默认科目
        $scope.keMuList = true; //科目选择列表内容隐藏
        $scope.kmTxWrap = true; //初始化的过程中，题型和难度DOM元素显示
        $scope.letterArr = config.letterArr; //题支的序号
        $scope.cnNumArr = config.cnNumArr;//大写汉字
        $scope.caozuoyuan = logUid;
        $scope.tiXingNameArr = config.tiXingNameArr; //题型名称数组
        $scope.mingTiParam = { //命题用到的参数
          tiMuId: '', //题目ID
          ctr: '', //出题人ID
          ltr: '', //录题人ID
          tiKuId: '', //题库ID
          goToPageNum: '', //分页的页码跳转
          isConvertTiXing: false, //是否是题型转换
          isFirstEnterMingTi: true,
          tiMuLaiYuan: '', //存放题目来源的数据
          panDuanDaAn: '', //判断题的答案
          slt_dg: '', //默认大纲
          tiMuLen: '', //题目数量
          isAddTiMu: true, //是否是编辑题目
          xuanZheTiZhi: '', //选择题题支内容
          tianKongDaAn: '' //填空题答案
        };
        $scope.tiXingIdArr = [ //题型转换数组
          {txId: 9, txName: '计算题'},
          {txId: 17, txName: '解答题'}
        ];
        $scope.pageParam = { //分页参数
          currentPage: '',
          lastPage: '',
          pageArr: []
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

        /**
         * 查询科目题型 --
         */
        var cxKmTx = function(){
          var obj = {method:'GET', url:xueXiaoKeMuTiXingUrl, params:{'学校ID':jgID, '科目ID':dftKm['科目ID']}};
          $http(obj).success(function(data){
            if(data.result){
              $scope.kmtxList = data.data;
              $scope.keMuList = true;
            }
            else{
              DataService.alertInfFun('err', data.error);
            }
          });
        };

        /**
         * 获得大纲数据 --
         */
        var getDaGangData = function(){
          function _do(item) {
            item.ckd = false;
            item.fld = true;
            if(item['子节点'] && item['子节点'].length > 0){
              Lazy(item['子节点']).each(_do);
            }
          }
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
              Lazy(sltDg['节点']).each(_do);
              $scope.mingTiParam.slt_dg = sltDg['知识大纲ID'];
              $scope.kowledgeList = sltDg;
              $scope.qryTestFun();
            }
            else{
              DataService.alertInfFun('err', data.error);
            }
          });
        };

        /**
         整理选中的知识点的ID和名称 --
         */
        var selectZsdFun = function(){ //用于将选择的知识点变成字符串
          var zsdName = [];
          qryTmPar.zsd = [];
          function _do(item) {
            if(item.ckd){
              qryTmPar.zsd.push(item['知识点ID']);
              zsdName.push(item['知识点名称']);
            }
            if(item['子节点'] && item['子节点'].length > 0){
              Lazy(item['子节点']).each(_do);
            }
          }
          Lazy($scope.kowledgeList['节点']).each(_do);
          $scope.selectZhiShiDian = zsdName.join('】【');
          $scope.mingTiParam.tiMuId = '';
          qryTmPar.tm = '';
          if($scope.kmTxWrap){ //查题阶段
            $scope.qryTestFun();
          }
          else{
            $scope.timu['知识点'] = qryTmPar.zsd.length ? JSON.stringify(qryTmPar.zsd) : '';
          }
        };

        /**
         * 分页处理函数 --
         */
        var pageMake = function(data){
          var perNumOfPage = 15; //每页15条数据
          var dataLen = data.length; //数据长度
          var lastPage = Math.ceil(dataLen/perNumOfPage); //最后一页
          $scope.mingTiParam.tiMuLen = dataLen;
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
            var obj = {method:'GET', url:tiMuUrl, params:{'题目ID':JSON.stringify(tmArr)}};
            $http(obj).success(function(data){ //查询题目详情
              if(data.result){
                Lazy(data.data).each(function(tm, idx, lst){
                  tm = DataService.formatDaAn(tm);
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
         * 查询出题人
         */
        var qryChuTiRen = function(){
          var obj = {method:'GET', url:chuTiRenUrl, params:{'学校ID':jgID, '科目ID': keMuId}};
          $http(obj).success(function(data){
            if(data.result){
              $scope.chuTiRens = data.data;
            }
            else{
              DataService.alertInfFun('err', data.error);
            }
          });
        };

        /**
         * 查询录题人
         */
        var qryLuTiRen = function(){
          var obj = {method:'GET', url:luTiRenUrl, params:{'学校ID':jgID, '科目ID': keMuId}};
          $http(obj).success(function(data){
            if(data.result){
              $scope.luTiRens = data.data;
            }
            else{
              DataService.alertInfFun('err', data.error);
            }
          });
        };

        /**
         * 查询题库
         */
        var qryTiKu = function(){
          var obj = {method:'GET', url:tiKuUrl, params:{'学校ID':jgID, '领域ID': lingYuId}};
          $http(obj).success(function(data){
            if(data.result){
              $scope.tiKuList = data.data;
            }
            else{
              DataService.alertInfFun('err', data.error);
            }
          });
        };

        /**
         * 展示不同的题型和模板
         */
        var renderTpl = function(tpl){
          $scope.txTpl = tpl; //点击不同的题型变换不同的题型模板
          $scope.kmTxWrap = false; // 题型和难度DOM元素隐藏
        };

        /**
         * 初始化需要查询到数据
         */
        cxKmTx();
        getDaGangData();
        qryLuTiRen();
        qryChuTiRen();
        qryTiKu();

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
          if($scope.kmTxWrap){ //查题阶段
            zsd.ckd = !zsd.ckd;
            Lazy(zsd['子节点']).each(_do);
          }
          else{ //出题阶段
            zsd.ckd = !zsd.ckd;
            Lazy($scope.kowledgeList['节点']).each(function(nd1){
              if(nd1['知识点ID'] == zsd['知识点ID']){
                nd1.ckd = zsd.ckd;
              }
              else{
                if(nd1['子节点'] && nd1['子节点'].length > 0){
                  Lazy(nd1['子节点']).each(function(nd2){
                    if(nd2['知识点ID'] == zsd['知识点ID']){
                      nd1.ckd = zsd.ckd;
                    }
                    else{
                      if(nd2['子节点'] && nd2['子节点'].length > 0){
                        Lazy(nd2['子节点']).each(function(nd3){
                          if(nd3['知识点ID'] == zsd['知识点ID']){
                            nd1.ckd = zsd.ckd;
                            nd2.ckd = zsd.ckd;
                          }
                          else{
                            if(nd3['子节点'] && nd3['子节点'].length > 0){
                              Lazy(nd3['子节点']).each(function(nd4){
                                if(nd4['知识点ID'] == zsd['知识点ID']){
                                  nd1.ckd = zsd.ckd;
                                  nd2.ckd = zsd.ckd;
                                  nd3.ckd = zsd.ckd;
                                }
                              })
                            }
                          }
                        })
                      }
                    }
                  })
                }
              }

            });
          }
          selectZsdFun();
        };

        /**
         * 获得题型查询条件 --
         */
        $scope.getTiXingId = function(qrytxId){
          if(qrytxId >= 1){
            qryTmPar.tx = qrytxId;
            $scope.txSelectenIdx = qrytxId;
          }
          else{
            qryTmPar.tx = '';
            $scope.txSelectenIdx = 0;
          }
          $scope.mingTiParam.tiMuId = '';
          qryTmPar.tm = '';
          $scope.qryTestFun();
        };

        /**
         * 获得难度查询条件 --
         */
        $scope.getNanDuId = function(nd){
          var ndArr = [];
          nd.ckd = !nd.ckd;
          Lazy($scope.nanDuList).each(function(nd){
            if(nd.ckd){
              ndArr.push(nd['难度ID']);
            }
          });
          qryTmPar.nd = ndArr.length ? JSON.stringify(ndArr) : '';
          $scope.mingTiParam.tiMuId = '';
          qryTmPar.tm = '';
          $scope.qryTestFun();
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
        $scope.qryTestFun = function(pg){
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
          $http(obj).success(function(tmlb){ //查询题目列表
            if(tmlb.result){
              var timuliebiao = Lazy(tmlb.data).reverse().toArray();
              allTiMuIds = angular.copy(timuliebiao);
              pageMake(tmlb.data);
            }
            else{
              $scope.currentPage = '';
              $scope.pageParam.pageArr = [];
              $scope.pages = [];
              $scope.timuDetails = '';
              $scope.mingTiParam.tiMuLen = '';
              DataService.alertInfFun('err', tmlb.error);
            }
            $scope.loadingImgShow = false;
          });
        };

        /**
         * 通过题目ID查询试题 --
         */
        $scope.qryTestByTiMuId = function(){
          function _do(item) {
            item.ckd = false;
            item.fld = true;
            if(item['子节点'] && item['子节点'].length > 0){
              Lazy(item['子节点']).each(_do);
            }
          }
          if($scope.mingTiParam.tiMuId){
            $scope.mingTiParam.ctr = ''; //互斥
            $scope.mingTiParam.ltr = ''; //互斥
            $scope.txSelectenIdx = 0;
            Lazy($scope.nanDuList).each(function(nd){
              nd.ckd = false;
            });
            Lazy($scope.kowledgeList['节点']).each(_do);
            qryTmPar = { //查询题目参数对象
              zsd: [], //知识点
              nd: '', //难度id
              tk: '', //题库id
              tx: '', //题型id
              tmly: '', //题目来源ID
              ctr: '', //出题人UID
              ltr: ''  //录题人ID
            };
            qryTmPar.tm = $scope.mingTiParam.tiMuId; //题目id
            $scope.qryTestFun();
          }
          else{
            DataService.alertInfFun('pmt', '请输入要查询的题目ID！');
          }
        };

        /**
         * 通过出题人的UID查询试题 --
         */
        $scope.qryTiMuByChuTiRenId = function(){
          qryTmPar.ctr = $scope.mingTiParam.ctr ? $scope.mingTiParam.ctr : '';
          $scope.mingTiParam.tiMuId = '';
          qryTmPar.tm = '';
          $scope.qryTestFun();
        };

        /**
         * 通过录题人的UID查询试题 --
         */
        $scope.qryTiMuByLuTiRenId = function(){
          qryTmPar.ctr = $scope.mingTiParam.ltr ? $scope.mingTiParam.ltr : '';
          $scope.mingTiParam.tiMuId = '';
          qryTmPar.tm = '';
          $scope.qryTestFun();
        };

        /**
         * 通过录题库查询试题 --
         */
        $scope.qryTiMuByTiKu = function(){
          qryTmPar.tk = $scope.mingTiParam.tiKuId ? $scope.mingTiParam.tiKuId : '';
          $scope.mingTiParam.tiMuId = '';
          qryTmPar.tm = '';
          $scope.qryTestFun();
        };

        /**
         * 得到特定页面的数据 --
         */
        $scope.getFixedPageData = function(){
          var goToPage = parseInt($scope.mingTiParam.goToPageNum);
          if(goToPage && goToPage > 0 && goToPage <= $scope.pageParam.lastPage){
            $scope.pageGetData(goToPage);
          }
          else{
            DataService.alertInfFun('pmt', '请输入正确的跳转的页码！');
          }
        };

        /**
         * 添加新的试题 --
         */
        $scope.addNewShiTi = function(){
          $scope.mingTiParam.isAddTiMu = true;
          $scope.patternListToggle = true;
          $scope.newTiMuId = 1;
          $scope.mingTiParam.isConvertTiXing = false;
          $scope.timu = {
            '题库ID': '',
            '科目ID': keMuId,
            '题型ID': $scope.newTiMuId,
            '题目内容': {
              '题干': '',
              '答案': '',
              '提示': ''
            },
            '难度': '',
            '题目来源ID': '',
            '出题人UID': '',
            '知识点': ''
          };
          function _do(item) {
            item.ckd = false;
            if(item['子节点'] && item['子节点'].length > 0){
              Lazy(item['子节点']).each(_do);
            }
          }
          Lazy($scope.kowledgeList['节点']).each(_do);
          qryTiMuSourceFun();
          $scope.addTiMuTpl(1);
        };

        /**
         * 题型模板加载 --
         */
        $scope.addTiMuTpl = function(txId){
          $scope.newTiMuId = txId;
          $scope.timu['题型ID'] = txId;
          $scope.loopArr = '';
          $scope.loadingImgShow = true;
          var tpl = '';
          switch (txId){
            case 1:
              tpl = 'views/mingti/danxuan.html';
              break;
            case 2:
              tpl = 'views/mingti/duoxuan.html';
              break;
            case 3:
              $scope.mingTiParam.panDuanDaAn = '';
              tpl = 'views/mingti/panduan.html';
              break;
            case 4:
              tkLoopArr = [];
              $scope.mingTiParam.tianKongDaAn = '';
              var addTianKongFun = function() {
                $('.formulaEditTiGan').markItUp(mySettings);
              };
              $timeout(addTianKongFun, 500);
              tpl = 'views/mingti/tiankong.html';
              break;
            case 5:
              tpl = 'views/mingti/jisuan.html';
              break;
            case 6:
              tpl = 'views/mingti/zhengming.html';
              break;
            case 7:
              tpl = 'views/mingti/jieda.html';
              break;
          }
          $scope.timu['题目内容'] = {
            '题干': '',
            '答案': '',
            '提示': ''
          };
          if(txId == 1 || txId == 2){
            $scope.timu['题目内容']['选项'] = '';
            $scope.loopArr = [{itemVal: '', ckd: false},{itemVal: '', ckd: false},{itemVal: '', ckd: false},{itemVal: '', ckd: false}];
          }
          $scope.selectZhiShiDian = ''; //知识大纲名称清空
          renderTpl(tpl);
          $scope.loadingImgShow = false;
        };

        /**
         * 点击添加题型的取消按钮后< div class="kmTxWrap">显示 --
         */
        $scope.cancelAddPattern = function(){
          $scope.kmTxWrap = true;
          $scope.patternListToggle = false;
          $scope.alterTiXingBox = false;
          $scope.mingTiParam.panDuanDaAn = '';
          $scope.timu = {
            '题库ID': '',
            '科目ID': '',
            '题型ID': '',
            '题目内容': {
              '题干': '',
              '答案': '',
              '提示': ''
            },
            '难度': '',
            '题目来源ID': '',
            '出题人UID': '',
            '知识点': ''
          };
          function _do(item) {
            item.ckd = false;
            if(item['子节点'] && item['子节点'].length > 0){
              Lazy(item['子节点']).each(_do);
            }
          }
          Lazy($scope.kowledgeList['节点']).each(_do);
          qryTmPar.zsd = [];
          $scope.qryTestFun($scope.currentPage);
          $scope.txTpl = 'views/mingti/testList.html';
        };

        /**
         * 查询题目来源的数据 --
         */
        var qryTiMuSourceFun = function(){
          if(!($scope.mingTiParam.tiMuLaiYuan && $scope.mingTiParam.tiMuLaiYuan.length)){
            var obj = {method:'GET', url:tiMuLaiYuanUrl, params:{'学校ID':jgID, '科目ID': keMuId}};
            $http(obj).success(function(data){
              if(data.result){
                $scope.mingTiParam.tiMuLaiYuan = data.data;
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
            });
          }
        };

        /**
         * 重置输入整个form和重置函数
         */
//        var resetFun = function(dataTpl){
//          dataTpl.shuju.DAAN = ''; //重置难度
//          dataTpl.shuju.TIGAN = ''; //重置题干
//          dataTpl.shuju.TIZHINEIRONG = ''; //重置题支
//          dataTpl.shuju.ZHISHIDIAN = '';
//          $scope.selectZhiShiDian = '';
//          selectZsd = [];
//          function _do(item) {
//            item.ckd = false;
//            if(item['子节点'] && item['子节点'].length > 0){
//              Lazy(item['子节点']).each(_do);
//            }
//          }
//          Lazy($scope.kowledgeList[0]['子节点']).each(_do);
//          loopArr = [{itemVal: '', ckd: false},{itemVal: '', ckd: false},{itemVal: '', ckd: false},{itemVal: '', ckd: false}];
//          $scope.loopArr = loopArr;
//          $scope.mingTiParam.panDuanDaAn = '';
//        };
//        $scope.resetForm = function(){
//          resetFun();
//        };

        /**
         * 添加题干编辑器 --
         */
        $scope.addTiGanEditor = function(){
          $('.formulaEditTiGan').markItUp(mySettings);
          DataService.tiMuContPreview();
        };

        /**
         * 添加题支编辑器 --
         */
        $scope.addTiZhiEditor = function(){
          $('.formulaEditTiZhi').markItUp(mySettings);
          DataService.tiZhiContPreview();
        };

        /**
         * 移除题干编辑器 --
         */
        $scope.removeTiGanEditor = function(){
          $('.formulaEditTiGan').markItUp('remove');
        };

        /**
         * 移除题支编辑器 --
         */
        $scope.removeTiZhiEditor = function(tx){
          if(tx >= 9){
            $('.formulaEditTiZhi').markItUp('remove');
          }
          else{
            $('.formulaEditTiZhi').markItUp('remove').val('');
            $('#prevTiZhiDoc').html('');
            $('input[name=fuzhi]').prop('checked', false);
          }
        };

        /**
         * 显示单选题题干编辑器 --
         */
        $scope.showDanXuanTiGanEditor = function(){
          $('.formulaEditTiGan').markItUp(mySettings);
          DataService.tiMuContPreview();
        };

        /**
         * 显示单选题题支编辑器 --
         */
        $scope.showDanXuanTiZhiEditor = function(){
          $('.formulaEditTiZhi').markItUp(mySettings);
        };

        /**
         * 给题支选项赋值 --
         */
        $scope.fuZhiFun = function(idx){
          $scope.loopArr[idx].itemVal = $scope.mingTiParam.xuanZheTiZhi;
        };

        /**
         * 填空题题支选项赋值 --
         */
        $scope.fuZhiFunTk = function(tzCont, idx){
          //$('.tizhiWrap').eq(parentIdx).find('input.subTiZhi').eq(idx).val($('.formulaEditTiZhi').val());
          tzCont.subTiZhiNum[idx].itmVal = $scope.mingTiParam.tianKongDaAn;
        };

        /**
         * 显示多选题题干编辑器 --
         */
        $scope.showDuoXuanTiGanEditor = function(){
          $('.formulaEditTiGan').markItUp(mySettings);
          DataService.tiMuContPreview();
        };

        /**
         * 显示多选题题支编辑器 --
         */
        $scope.showDuoXuanTiZhiEditor = function(){
          $('.formulaEditTiZhi').markItUp(mySettings);
        };

        /**
         * 显示计算题干编辑器 --
         */
        $scope.showJiSuanTiGanEditor = function(){
          $('.formulaEditTiGan').markItUp(mySettings);
          DataService.tiMuContPreview();
        };

        /**
         * 显示计算题答案编辑器 --
         */
        $scope.showJiSuanDaAnEditor = function(){
          $('.formulaEditTiZhi').markItUp(mySettings);
          DataService.tiZhiContPreview();
        };

        /**
         * 多选题选择答案的效果的代码 --
         */
        $scope.chooseDaAn = function(da, stat){
          if(stat == 'dan'){
            Lazy($scope.loopArr).each(function(tizhi, idx, lst){
              tizhi.ckd = false;
            });
          }
          da.ckd = !da.ckd;
        };

        /**
         * 判断题选择答案的效果的代码 --
         */
        $scope.choosePanDuanDaan = function(idx){
          $scope.mingTiParam.panDuanDaAn = idx;
          $scope.timu['题目内容']['答案'] = idx ? true : false;
        };

        /**
         * 查找字符串出现的次数
         */
        var countInstances = function(mainStr, subStr) {
          var count = 0; var offset = 0;
          do{
            offset = mainStr.indexOf(subStr, offset);
            if(offset != -1)
            {
              count++;
              offset += subStr.length;
            }
          }
          while(offset != -1);
          return count;
        };

        /**
         * 填空题题干处理 --
         */
        $scope.addTkDaanInput = function(){
          var tgVal = $scope.timu['题目内容']['题干'];
          var loopArrObj;
          var cnum = countInstances(tgVal, '<span>');
          tkLoopArr = [];
          for(var i = 1; i <= cnum; i++){
            loopArrObj = {
              tiZhiNum: '',
              subTiZhiNum: [{itmVal: '请输入答案'}]
            };
            loopArrObj.tiZhiNum = i;
            tkLoopArr.push(loopArrObj);
          }
          $scope.tkLoopArr = tkLoopArr;
        };

        /**
         * 添加更多变形答案 --
         */
        $scope.addSubTiZhi = function(tzCont){
          tzCont.subTiZhiNum.push({itmVal: '请输入答案'});
        };

        /**
         * 删除一条变形答案 --
         */
        $scope.removeSubTiZhi = function(tzCont, idx){
          tzCont.subTiZhiNum.splice(idx, 1);
        };

        /**
         * 检查填空题输入的内容 --
         */
        $scope.checkTiKongVal = function(tzCont, idx){
          var thisVal = tzCont.subTiZhiNum[idx].itmVal;
          if(thisVal == '请输入答案'){
            tzCont.subTiZhiNum[idx].itmVal = '';
          }
        };

        /**
         * 点击添加按钮添加一项题支输入框 --
         */
        $scope.addOneItem = function(){
          var vObj = {itemVal: '', ckd: false};
          $scope.loopArr.push(vObj);
        };

        /**
         * 点击删除按钮删除一项题支输入框 --
         */
        $scope.deleteOneItem = function(idx, itm){
          if(itm.ckd){
            DataService.alertInfFun('pmt', '此项为正确答案不能删除！');
          }
          else{
            $scope.loopArr.splice(idx, 1);
          }
        };

        /**
         * 点击删除按钮删除一道题 --
         */
        $scope.deleteItem = function(tmid, idx){
          if (confirm('确定要删除此题吗？')) {
            var obj = {method:'DELETE', url:tiMuUrl, params:{'题目ID':tmid}};
            $http(obj).success(function(data){
              if(data.result){
                $scope.timuDetails.splice(idx, 1);
                DataService.alertInfFun('suc', '删除成功！');
              }
              else{
                DataService.alertInfFun('pmt', data.error);
              }
            });
          }
        };

//        /**
//         * 加载修改单多选题模板
//         */
//        var makeZsdSelect = function(tmxq){ //修改题目是用于反向选择知识大纲
//          var onZsd = '';
//          function _do(item) {
//            if(item['知识点ID'] == onZsd['知识点ID']){
//              item.ckd = true;
//            }
//            if(item['子节点'] && item['子节点'].length > 0){
//              Lazy(item['子节点']).each(_do);
//            }
//          }
//          //var selectZsdStr = '';
//          //selectZsd = [];
//          //$('ul.levelFour').css('display','block');//用于控制大纲 开始
//          //$('.levelFour').closest('li').find('.foldBtn').addClass('unfoldBtn');
//          Lazy(tmxq.ZHISHIDIAN).each(function(zsd, idx, lst){
//            onZsd = zsd;
//            //selectZsd.push(zsd['知识点ID']);
//            Lazy($scope.kowledgeList[0]['子节点']).each(_do);
//            //selectZsdStr += 'select' + zsd['知识点ID'] + ',';
//          });
//          //$scope.selectZsdStr = selectZsdStr; //用于控制大纲结束
//          selectZsdFun();
//        };

//        var onceMakeWord = true;
//        $scope.editItem = function(tmxq){
//          var tpl, editDaAnArr = [], nanDuClass;
//          testListStepZst = selectZsd; //保存选题阶段的知识点
//          selectZsd = []; //new add
//          $scope.selectZsdStr = '';
//          isEditItemStep = false;
//          $scope.mingTiParam.isAddTiMu = false;
//          if(onceMakeWord){
//            $('.pointTree').find('input[name=point]').prop('checked', false); //add new
//          }
//          loopArr = [];
//          //生成题支编辑器的数组
//          if(tmxq.TIXING_ID <= 3){
//            Lazy(tmxq.TIGAN.tiZhiNeiRong).each(function(tznr){
//              var vObj = {itemVal: tznr, ckd: false};
//              loopArr.push(vObj);
//            });
//            var daAnArr = tmxq.DAAN.split(',');
//            Lazy(daAnArr).each(function(da){
//              var daLetter = Lazy(letterArr).indexOf(da);
//              loopArr[daLetter].ckd = true;
//            });
//          }
//          //单选题
//          if(tmxq.TIXING_ID == 1){
//            tpl = 'views/mingti/danxuanedit.html';
//            danxuan_data = timu_data;
//            $scope.danXuanData = danxuan_data; //数据赋值和模板展示的顺序
//            danxuan_data.shuju.TIMU_ID = tmxq.TIMU_ID;
//            //danxuan_data.shuju.DAAN = tmxq.DAAN;
//            danxuan_data.shuju.TIGAN = tmxq.TIGAN.tiGan;
//            danxuan_data.shuju.NANDU_ID = tmxq.NANDU_ID;
//            danxuan_data.shuju.TIMULAIYUAN_ID = tmxq.TIMULAIYUAN_ID;
//            danxuan_data.shuju.REMARK = tmxq.REMARK;
//            $scope.timudetail = tmxq;
//            $scope.alterTiMuTiXing = '单选题';
//            renderTpl(tpl); //render 修改过模板
//          }
//          //多选题
//          if(tmxq.TIXING_ID == 2){
//            tpl = 'views/mingti/duoxuanedit.html';
//            duoxuan_data = timu_data;
//            $scope.duoXuanData = duoxuan_data; //数据赋值和模板展示的顺序
//            duoxuan_data.shuju.TIMU_ID = tmxq.TIMU_ID;
//            //duoxuan_data.shuju.DAAN = tmxq.DAAN;
//            duoxuan_data.shuju.TIGAN = tmxq.TIGAN.tiGan;
//            duoxuan_data.shuju.NANDU_ID = tmxq.NANDU_ID;
//            duoxuan_data.shuju.TIMULAIYUAN_ID = tmxq.TIMULAIYUAN_ID;
//            duoxuan_data.shuju.REMARK = tmxq.REMARK;
//            $scope.timudetail = tmxq;
//            $scope.alterTiMuTiXing = '多选题';
//            renderTpl(tpl); //render 修改过模板
//          }
//          //判断题
//          if(tmxq.TIXING_ID == 3){
//            tpl = 'views/mingti/panduan.html';
//            pandu_data = timu_data;
//            $scope.panDuanData = pandu_data; //数据赋值和模板展示的顺序
//            if(tmxq.DAAN == '对'){
//              pandu_data.shuju.DAAN = 1;
//            }
//            else{
//              pandu_data.shuju.DAAN = 0;
//            }
//            pandu_data.shuju.TIXING_ID = tmxq.TIXING_ID;
//            pandu_data.shuju.TIMULEIXING_ID = tmxq.TIMULEIXING_ID;
//            pandu_data.shuju.TIMU_ID = tmxq.TIMU_ID;
//            pandu_data.shuju.TIGAN = tmxq.TIGAN.tiGan;
//            pandu_data.shuju.NANDU_ID = tmxq.NANDU_ID;
//            pandu_data.shuju.TIMULAIYUAN_ID = tmxq.TIMULAIYUAN_ID;
//            pandu_data.shuju.REMARK = tmxq.REMARK;
//            $scope.alterTiMuTiXing = '判断题';
//            renderTpl(tpl); //render 修改过模板
//            var daAnSelectFun = function() {
//              if(pandu_data.shuju.DAAN == 1){
//                $scope.choosePanDuanDaan(1);
//              }
//              else{
//                $scope.choosePanDuanDaan(0);
//              }
//            };
//            $timeout(daAnSelectFun, 500);
//          }
//          //填空题
//          if(tmxq.TIXING_ID == 4){
//            var tkEdReg = new RegExp('<%{.*?}%>', 'g'),
//              dataFirst,
//              tkqrytimuxiangqing = qrytimuxiangqingBase + '&timu_id=' + tmxq.TIMU_ID; //查询详情url
//            loopArr = [];
//            tpl = 'views/mingti/tiankong.html';
//            tiankong_data = timu_data;
//            $scope.tianKongData = tiankong_data; //数据赋值和模板展示的顺序
//            //查询填空题详情
//            $http.get(tkqrytimuxiangqing).success(function(data){
//              if(data.length){
//                dataFirst = data[0];
//                //题干转换
//                tiankong_data.shuju.TIGAN = dataFirst.TIGAN.tiGan.replace(tkEdReg, function(arg) {
//                  return '<span>_____</span>';
//                });
//                //答案转换
//                tkLoopArr = [];
//                Lazy(JSON.parse(dataFirst.DAAN)).each(function(da, idx, lst){
//                  var loopArrObj = {
//                    tiZhiNum: '',
//                    subTiZhiNum: ''
//                  };
//                  if(typeof(da.answer) == 'string'){
//                    loopArrObj.subTiZhiNum = [];
//                    loopArrObj.subTiZhiNum[0] = da.answer;
//                  }
//                  else{
//                    loopArrObj.subTiZhiNum = da.answer;
//                  }
//                  loopArrObj.tiZhiNum = parseInt(idx) + 1;
//                  tkLoopArr.push(loopArrObj);
//                });
//                DataService.tiMuContPreview(tiankong_data.shuju.TIGAN);
//              }
//              else{
//                DataService.alertInfFun('err', data.error);
//              }
//            });
//            //赋值
//            tiankong_data.shuju.TIXING_ID = tmxq.TIXING_ID;
//            tiankong_data.shuju.TIMULEIXING_ID = tmxq.TIMULEIXING_ID;
//            tiankong_data.shuju.TIMU_ID = tmxq.TIMU_ID;
//            tiankong_data.shuju.NANDU_ID = tmxq.NANDU_ID;
//            tiankong_data.shuju.TIMULAIYUAN_ID = tmxq.TIMULAIYUAN_ID;
//            tiankong_data.shuju.REMARK = tmxq.REMARK;
//            if(tmxq.TIXING_ID == 6){
//              $scope.alterTiMuTiXing = '填空题';
//            }
//            else{
//              $scope.alterTiMuTiXing = '笔答填空题';
//            }
//            renderTpl(tpl); //render 修改过模板
//            var addTianKongFun = function() {
//              $('.formulaEditTiGan').markItUp(mySettings);
//            };
//            $timeout(addTianKongFun, 500);
//          }
//          //计算题
//          if(tmxq.TIXING_ID == 5){
//            tpl = 'views/mingti/jisuan.html';
//            jisuan_data = timu_data;
//            $scope.jiSuanData = jisuan_data; //数据赋值和模板展示的顺序
//            jisuan_data.shuju.TIXING_ID = tmxq.TIXING_ID;
//            jisuan_data.shuju.TIMULEIXING_ID = tmxq.TIMULEIXING_ID;
//            jisuan_data.shuju.TIMU_ID = tmxq.TIMU_ID;
//            jisuan_data.shuju.DAAN = tmxq.DAAN;
//            jisuan_data.shuju.TIGAN = tmxq.TIGAN.tiGan;
//            jisuan_data.shuju.NANDU_ID = tmxq.NANDU_ID;
//            jisuan_data.shuju.TIMULAIYUAN_ID = tmxq.TIMULAIYUAN_ID;
//            jisuan_data.shuju.REMARK = tmxq.REMARK;
//            $scope.alterTiMuTiXing = '计算题';
//            $scope.mingTiParam.isConvertTiXing = true;
//            renderTpl(tpl); //render 修改过模板
//          }
//          //证明题
//          if(tmxq.TIXING_ID == 6){
//            tpl = 'views/mingti/zhengming.html';
//            zhengming_data = timu_data;
//            $scope.zhengMingData = zhengming_data; //数据赋值和模板展示的顺序
//            zhengming_data.shuju.TIXING_ID = tmxq.TIXING_ID;
//            zhengming_data.shuju.TIMULEIXING_ID = tmxq.TIMULEIXING_ID;
//            zhengming_data.shuju.TIMU_ID = tmxq.TIMU_ID;
//            zhengming_data.shuju.DAAN = tmxq.DAAN;
//            zhengming_data.shuju.TIGAN = tmxq.TIGAN.tiGan;
//            zhengming_data.shuju.NANDU_ID = tmxq.NANDU_ID;
//            zhengming_data.shuju.TIMULAIYUAN_ID = tmxq.TIMULAIYUAN_ID;
//            zhengming_data.shuju.REMARK = tmxq.REMARK;
//            $scope.alterTiMuTiXing = '证明题';
//            $scope.mingTiParam.isConvertTiXing = true;
//            renderTpl(tpl); //render 修改过模板
//          }
//          //解答题
//          if(tmxq.TIXING_ID == 7){
//            tpl = 'views/mingti/jieda.html';
//            jieda_data = timu_data;
//            $scope.jieDaData = jieda_data; //数据赋值和模板展示的顺序
//            jieda_data.shuju.TIXING_ID = tmxq.TIXING_ID;
//            jieda_data.shuju.TIMULEIXING_ID = tmxq.TIMULEIXING_ID;
//            jieda_data.shuju.TIMU_ID = tmxq.TIMU_ID;
//            jieda_data.shuju.DAAN = tmxq.DAAN;
//            jieda_data.shuju.TIGAN = tmxq.TIGAN.tiGan;
//            jieda_data.shuju.NANDU_ID = tmxq.NANDU_ID;
//            jieda_data.shuju.TIMULAIYUAN_ID = tmxq.TIMULAIYUAN_ID;
//            jieda_data.shuju.REMARK = tmxq.REMARK;
//            $scope.alterTiMuTiXing = '解答题';
//            $scope.mingTiParam.isConvertTiXing = true;
//            renderTpl(tpl); //render 修改过模板
//          }
//          //反选知识点
//          makeZsdSelect(tmxq);
//          //难度反向选择代码
//          var nanDuSelectFun = function() {
//            nanDuClass = 'starClick' + tmxq.NANDU_ID;
//            $('.nandu-star-box').addClass(nanDuClass);
//            $('.nandu-input').val(tmxq.NANDU_ID);
//            selectZsdFun(); //加载知识大纲名称
//            if(tmxq.TIXING_ID == 6){
//              var tkTiZhiArr = $('.tizhiWrap').find('input.tiZhi');
//              var tkcnum;
//              var tkEditDaAnArr = tmxq.DAAN.split(';');
//              tkcnum = $scope.tkLoopArr.length;
//              for(var i = 0; i < tkcnum; i++){
//                tkTiZhiArr.eq(i).val(tkEditDaAnArr[i]);
//              }
//            }
//            $scope.loopArr = loopArr;
//          };
//          qryTiMuSourceFun();
//          $scope.alterTiXingBox = true;
//          onceMakeWord = false;
//          $timeout(nanDuSelectFun, 500);
//        };
//
//        /**
//         * 修改单选题
//         */
//        $scope.saveDanxuanEdit = function(){
//          var promise = addDanDuoXuanFun(danxuan_data);
//          promise.then(function() {
//            $scope.patternListToggle = false;
//            $scope.alterTiXingBox = false;
//            $scope.cancelAddPattern();
//          });
//        };
//
//        /**
//         * 修改多选题
//         */
//        $scope.saveDuoxuanEdit = function(){
//          var promise = addDanDuoXuanFun(duoxuan_data);
//          promise.then(function() {
//            $scope.patternListToggle = false;
//            $scope.alterTiXingBox = false;
//            $scope.cancelAddPattern();
//          });
//        };

//        /**
//         * 文件上传
//         */
//        //存放上传文件的数组
//        $scope.uploadFiles = [];
//
//        //将选择的文件加入到数组
//        $scope.$on("fileSelected", function (event, args) {
//          $scope.$apply(function () {
//            $scope.uploadFiles.push(args.file);
//          });
//          console.log($scope.uploadFiles);
//        });
//
//        //添加文件
//        $scope.addMyFile = function(){
//          $('input.addFileBtn').click();
//        };
//
//        //删除选择的文件
//        $scope.deleteSelectFile = function(idx){
//          $scope.uploadFiles.splice(idx, 1);
//        };
//
//        //关闭上传文件弹出层
//        $scope.closeMediaPlugin = function(){
//          $('#mediaPlugin').hide();
//        };
//
//        //保存上传文件
//        $scope.uploadMyFiles = function() {
//          var file = $scope.uploadFiles,
//            fields = [{"name": "token", "data": token}],
//            isFileSizeRight = true,
//            limitedFileSize = config.uploadFileSizeLimit; //文件大小限制，目前大小限制2MB
//          Lazy($scope.uploadFiles).each(function(fl, idx, lst){
//            if(fl.size > limitedFileSize){
//              isFileSizeRight = false;
//            }
//          });
//          if(isFileSizeRight){
//            DataService.uploadFileAndFieldsToUrl(file, fields, uploadFileUrl).then(function(result){
//              console.log(result);
//              var i, mediaLength;
//              $scope.uploadFileUrl = result.data;
//              $scope.uploadFiles = [];
//              if(result.data && result.data.length > 0){
//                mediaLength = result.data.length;
//                for(i = 0; i < mediaLength; i++){
//                  var findFileType = result.data[i].match(fileTypeReg)[0], //得到文件格式
//                    isImg = Lazy(config.imgType).contains(findFileType),
//                    isVideo = Lazy(config.videoType).contains(findFileType),
//                    isAudio = Lazy(config.audioType).contains(findFileType),
//                    src = showFileUrl + result.data[i]; //媒体文件路径
//                  if(isImg){
//                    $.markItUp(
//                      { replaceWith:'<img src="'+src+'" alt=""(!( class="[![Class]!]")!) />' }
//                    );
//                  }
//                  if(isAudio){
//                    $.markItUp(
//                      { replaceWith:'<audio src="'+src+'" controls="controls" (!( class="[![Class]!]")!)></audio>' }
//                    );
//                  }
//                  if(isVideo){
//                    $.markItUp(
//                      { replaceWith:'<video src="'+src+'" controls="controls" (!( class="[![Class]!]")!)></video>' }
//                    );
//                  }
//                }
//                $('#mediaPlugin').hide();
//                $('.formulaEditTiGan').keyup();
//                return false;
//              }
//            });
//          }
//          else{
//            DataService.alertInfFun('pmt', '文件大小不能超过：' + limitedFileSize/1024/1024 + 'MB');
//          }
//        };

        /**
         * 显示题干预览 --
         */
        $scope.previewTiGan = function(){
          var tgCont = $scope.timu['题目内容']['题干'];
          tgCont = tgCont.replace(/\n/g, '<br/>');
          $('#prevDoc').html(tgCont);
          MathJax.Hub.Queue(["Typeset", MathJax.Hub, "prevDoc"]);
        };

        /**
         * 显示题支预览 --
         */
        $scope.previewTiZhi = function(){
          var tzCont = $scope.mingTiParam.xuanZheTiZhi;
          tzCont = tzCont.replace(/\n/g, '<br/>');
          $('#prevTiZhiDoc').html(tzCont);
          MathJax.Hub.Queue(["Typeset", MathJax.Hub, "prevTiZhiDoc"]);
        };

        /**
         * 保存题目 --
         */
        $scope.saveTiMu = function(){
          var mis = [];
          var tiMuData = angular.copy($scope.timu);
          if($scope.newTiMuId == 1 || $scope.newTiMuId == 2){ //整理单选和多选题答案
            var tzArr = [];
            var daArr = [];
            Lazy($scope.loopArr).each(function(tz, idx, lst){
              tz.itemVal ? tzArr.push(tz.itemVal) : mis.push('题支' + (idx + 1));
              if(tz.ckd){
                daArr.push(idx);
              }
            });
            tiMuData['题目内容']['选项'] = tzArr.length ? JSON.stringify(tzArr) : '';
            if(daArr && daArr.length > 0){
              tiMuData['题目内容']['答案'] = $scope.newTiMuId == 1 ? daArr[0] : JSON.stringify(daArr);
            }
            else{
              mis.push('答案');
            }
          }
          if($scope.newTiMuId == 4){ //整理填空题
            //var tiZhiArr = $('.tizhiWrap').find('input.subTiZhi');
            var reg = new RegExp('<span>.*?</span>', 'g');
            var count = 1;
            var tgVal = tiMuData['题目内容']['题干'];
            var tznrIsNull = true;
            var tiGanStr = tgVal.replace(reg, function(arg) {
              var tzCont = [];
              var tzJson = {'尺寸': '', "占位": '请填写', '答案': '', '提示': ''};
              var findItem = Lazy($scope.tkLoopArr).find(function(tk){
                return tk.tiZhiNum == count;
              });
              Lazy(findItem.subTiZhiNum).each(function(subTz){
                if(subTz.itmVal && subTz.itmVal != '请输入答案'){
                  tzCont.push(subTz.itmVal);
                }
                else{
                  tznrIsNull = false;
                }
              });
              tzJson['尺寸'] = tzCont.length + 10;
              tzJson['答案'] = tzCont;
              count ++;
              return '<%' + JSON.stringify(tzJson) + '%>';
            });
            //将题干重的换行转换为<br/>
            tiGanStr = tiGanStr.replace(regN, replaceStr);
            tiGanStr = tiGanStr.replace(regRN, replaceStr);
            tiMuData['题目内容']['题干'] = tiGanStr;
            if(!tznrIsNull){
              DataService.alertInfFun('pmt', '请输入填空题答案！');
              return ;
            }
          }
          Lazy(tiMuData).each(function(v, k, l){ //判断必要字段
            if(k == '题库ID' || k == '科目ID' || k == '题型ID' || k == '难度' || k == '知识点'){
              if(!v){
                mis.push(k);
              }
            }
            else if(k == '题目内容'){
              if(!v['题干']){
                mis.push('题干');
              }
            }
            else{
              if(!v){
                delete tiMuData[k];
              }
            }
          });
          if(mis && mis.length > 0){ //判读是否有空字段
            DataService.alertInfFun('pmt', '缺少' + mis.join(',') + '。');
          }
          else{
            tiMuData['题目内容'] = JSON.stringify(tiMuData['题目内容']);
            var obj = {method:'', url:tiMuUrl, data:tiMuData};
            if($scope.mingTiParam.isAddTiMu){
              obj.method = 'PUT';
            }
            else{
              obj.method = 'POST';
            }
            $http(obj).success(function(data){
              if(data.result){
                $scope.timu['题目内容'] = {
                  '题干': '',
                  '答案': '',
                  '提示': ''
                };
                if($scope.newTiMuId < 3){
                  $scope.loopArr = [{itemVal: '', ckd: false},{itemVal: '', ckd: false},{itemVal: '', ckd: false},{itemVal: '', ckd: false}];
                }
                $('#prevDoc').html('');
                $('#prevTiZhiDoc').html('');
                $scope.mingTiParam.panDuanDaAn = '';
                tkLoopArr = [];
                $scope.tkLoopArr = '';
                DataService.alertInfFun('suc', '保存成功！');
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
            });
          }
        };

        /**
         * 重新加载mathjax --
         */
        $scope.$on('onRepeatLast', function(scope, element, attrs){
          MathJax.Hub.Config({
            tex2jax: {inlineMath: [["#$", "$#"]], displayMath: [['#$$','$$#']]},
            messageStyle: "none",
            showMathMenu: false,
            processEscapes: true
          });
          MathJax.Hub.Queue(["Typeset", MathJax.Hub, "testList"]);
          MathJax.Hub.Queue(["Typeset", MathJax.Hub, "daGangList"]);
        });

      }
    ]
  );
});
