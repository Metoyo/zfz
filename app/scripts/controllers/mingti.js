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
        //var timu_data = { //题目类型的数据格式公共部分
        //    token: config.token,
        //    //caozuoyuan: userInfo.UID,
        //    jigouid: jigouid,
        //    lingyuid: lingyuid,
        //    shuju: {
        //      TIMU_ID: '',
        //      TIXING_ID: '',
        //      TIMULEIXING_ID: '',
        //      NANDU_ID: '',
        //      TIMULAIYUAN_ID: '',
        //      PINGFENFANGSHI_ID: '',
        //      FUZITI_LEIXING: '',
        //      FUTI_ID: '',
        //      TIGAN:'',
        //      DAAN: '',
        //      TISHI: '',
        //      YUEJUANBIAOZHUN: '',
        //      TIMUFENXI: '',
        //      ISFENDUANPINGFEN: '',
        //      TIMUWENJIAN:[],
        //      ZHISHIDIAN: [],
        //      ZHUANGTAI: 1,
        //      REMARK: ''
        //    }
        //  };
        //var danxuan_data; //单选题数据模板
        //var duoxuan_data; //多选题数据模板
        //var jisuan_data; //计算题数据模板
        //var jieda_data; //解答题数据模板
        //var pandu_data; //判断题数据模板
        //var tiankong_data; //填空题数据模板
        //var yuedu_data; //阅读题数据模板
        //var zhengming_data;//证明题数据模板
        //var loopArr = [{itemVal: '', ckd: false},{itemVal: '', ckd: false},{itemVal: '', ckd: false},{itemVal: '', ckd: false}]; //用于题支循环的数组
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
        //var regRN = /\r\n/g; //匹配enter换行
        //var regN = /\n/g; //匹配换行
        //var replaceStr = '<br/>'; //匹配<br/>
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
        var xueXiaoKeMuTiXingUrl = '/xuexiao_kemu_tixing'; //学校科目题型
        var zhiShiDaGangUrl = '/zhishidagang'; //知识大纲
        var tiMuUrl = '/timu'; //题目的URL
        var luTiRenUrl = '/lutiren'; //录题人
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
          ltr: ''  //录题人ID
        };
        var allTiMuIds = ''; //存放所有题目id
        $scope.defaultKeMu = dftKm; //默认科目
        $scope.keMuList = true; //科目选择列表内容隐藏
        $scope.kmTxWrap = true; //初始化的过程中，题型和难度DOM元素显示
        $scope.letterArr = config.letterArr; //题支的序号
        $scope.cnNumArr = config.cnNumArr;//大写汉字
        $scope.caozuoyuan = logUid;
        $scope.tiXingNameArr = config.tiXingNameArr; //题型名称数组
        $scope.mingTiParam = { //命题用到的参数
          tiMuId: '', //题目ID
          tiMuAuthorId: '', //出题人ID
          goToPageNum: '', //分页的页码跳转
          isConvertTiXing: false, //是否是题型转换
          tiXingId: '',
          isFirstEnterMingTi: true,
          tiMuLaiYuan: '', //存放题目来源的数据
          panDuanDaAn: '', //判断题的答案
          slt_dg: '', //默认大纲
          tiMuLen: '' //题目数量
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
        cxKmTx();

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
         整理选中的知识点的ID和名称
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
          Lazy($scope.kowledgeList[0]['子节点']).each(_do);
          $scope.selectZhiShiDian = zsdName.join('】【');
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
          if($scope.kmTxWrap){ //查题阶段
            zsd.ckd = !zsd.ckd;
            Lazy(zsd['子节点']).each(_do);
            selectZsdFun();
            $scope.qryTestFun();
          }
          else{ //出题阶段
            zsd.ckd = !zsd.ckd;
            Lazy($scope.kowledgeList[0]['子节点']).each(function(nd2){
              if(nd2.ZHISHIDIAN_ID == zsd.ZHISHIDIAN_ID){
                $scope.kowledgeList[0].ckd = zsd.ckd;
              }
              else{
                if(nd2['子节点'] && nd2['子节点'].length > 0){
                  Lazy(nd2['子节点']).each(function(nd3){
                    if(nd3.ZHISHIDIAN_ID == zsd.ZHISHIDIAN_ID){
                      $scope.kowledgeList[0].ckd = zsd.ckd;
                      nd2.ckd = zsd.ckd;
                    }
                    else{
                      if(nd3['子节点'] && nd3['子节点'].length > 0){
                        Lazy(nd3['子节点']).each(function(nd4){
                          if(nd4.ZHISHIDIAN_ID == zsd.ZHISHIDIAN_ID){
                            $scope.kowledgeList[0].ckd = zsd.ckd;
                            nd2.ckd = zsd.ckd;
                            nd3.ckd = zsd.ckd;
                          }
                        })
                      }
                      else{

                      }
                    }
                  })
                }
              }
            });
            selectZsdFun();
          }
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
          $scope.qryTestFun();
        };

//        /**
//         * 展示不同的题型和模板
//         */
//        var renderTpl = function(tpl){
//          $scope.txTpl = tpl; //点击不同的题型变换不同的题型模板
//          $scope.kmTxWrap = false; // 题型和难度DOM元素隐藏
//        };

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
            obj.params['知识点'] = qryTmPar.zsd;
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
              allTiMuIds = angular.copy(tmlb.data);
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
        
//        /**
//         * 通过题目ID查询试题
//         */
//        $scope.qryTestByTiMuId = function(){
//          tiMuIdArr = [];
//          pageArr = [];
//          if($scope.mingTiParam.tiMuId){
//            $scope.testListId = [];
//            $scope.testListId.push($scope.mingTiParam.tiMuId);
//            tiMuIdArr.push($scope.mingTiParam.tiMuId);
//            totalPage = 1;
//            pageArr = [1];
//            $scope.lastPageNum = totalPage; //最后一页的数值
//            $scope.mingTiParam.tiMuAuthorId = ''; //互斥
//            //题型和难度选题重置
//            qryTmPar.nd = '';
//            $scope.txSelectenIdx = 0;
//            qryTmPar.nd = '';
//            $scope.ndSelectenIdx = 0;
//            $scope.getThisPageData();
//          }
//          else{
//            DataService.alertInfFun('pmt', '请输入要查询的题目ID！');
//          }
//        };
//
//        /**
//         * 通过出题人的UID查询试题
//         */
//        $scope.qryTiMuByChuTiRenId = function(){
//          if($scope.mingTiParam.tiMuAuthorId){
//            if($scope.mingTiParam.tiMuAuthorId == 'allUsr'){
//              $scope.mingTiParam.tiMuAuthorId = '';
//            }
//            $scope.mingTiParam.tiMuId = ''; //互斥
//            $scope.qryTestFun();
//          }
//        };
//
//        /**
//         * 查询学校题库，val是true的话表示查询学校题库，否则查询个人题库
//         */
//        $scope.checkSchoolTiMu = function(val){
//          if(val){
//            checkSchoolTiKu = '';
//            $scope.qryTestFun();
//          }
//          else{
//            checkSchoolTiKu = caozuoyuan;
//            $scope.qryTestFun();
//          }
//        };
//
//        /**
//         * 点击添加题型的取消按钮后<div class="kmTxWrap">显示
//         */
//        $scope.cancelAddPattern = function(){
//          selectZsd = [];
//          $scope.kmTxWrap = true;
//          $scope.patternListToggle = false;
//          $scope.alterTiXingBox = false;
//          $scope.mingTiParam.panDuanDaAn = '';
//          timu_data = { //题目类型的数据格式公共部分
//            token: config.token,
//            //caozuoyuan: userInfo.UID,
//            jigouid: jigouid,
//            lingyuid: lingyuid,
//            shuju: {
//              TIMU_ID: '',
//              TIXING_ID: '',
//              TIMULEIXING_ID: '',
//              NANDU_ID: '',
//              TIMULAIYUAN_ID: '',
//              PINGFENFANGSHI_ID: '',
//              FUZITI_LEIXING: '',
//              FUTI_ID: '',
//              TIGAN:'',
//              DAAN: '',
//              TISHI: '',
//              YUEJUANBIAOZHUN: '',
//              TIMUFENXI: '',
//              ISFENDUANPINGFEN: '',
//              TIMUWENJIAN:[
//
//              ],
//              ZHISHIDIAN: [],
//              ZHUANGTAI: 1
//            }
//          };
//          zhishidian_id = '';
//          function _do(item) {
//            item.ckd = false;
//            if(item['子节点'] && item['子节点'].length > 0){
//              Lazy(item['子节点']).each(_do);
//            }
//          }
//          Lazy($scope.kowledgeList[0]['子节点']).each(_do);
//          $scope.qryTestFun($scope.currentPageNum);
//          $scope.txTpl = 'views/mingti/testList.html';
//        };
//
//        /**
//         * 单选题模板加载
//         */
//        $scope.addDanXuan = function(tpl){
//          $scope.selectZhiShiDian = ''; //知识大纲名称清空
//          danxuan_data = timu_data;
//          //loopArr = [0,1,2,3];
//          loopArr = [{itemVal: '', ckd: false},{itemVal: '', ckd: false},{itemVal: '', ckd: false},{itemVal: '', ckd: false}];
//          renderTpl(tpl);
//          $scope.loopArr = loopArr;
//          $('.patternList li').removeClass('active');
//          $('li.danxuan').addClass('active');
//          danxuan_data.shuju.TIXING_ID = 1;
//          danxuan_data.shuju.TIMULEIXING_ID = 1;
//          danxuan_data.shuju.TIZHISHULIANG = '';
//          danxuan_data.shuju.SUIJIPAIXU = '';
//          danxuan_data.shuju.TIGAN = '';
//          $scope.danXuanData = danxuan_data;
//          $scope.loadingImgShow = false; //danxuan.html
//          isDanXuanType = true; //判断是否出单选题
//          isDuoXuanType = false; //判断是否出多选题
//          var addActiveFun = function() {
//            $('li.danxuan').addClass('active');
//          };
//          $timeout(addActiveFun, 500);
//        };
//
//        /**
//         * 多选题模板加载
//         */
//        $scope.addDuoXuan = function(tpl){
//          $scope.selectZhiShiDian = ''; //知识大纲名称清空
//          duoxuan_data = timu_data;
//          loopArr = [{itemVal: '', ckd: false},{itemVal: '', ckd: false},{itemVal: '', ckd: false},{itemVal: '', ckd: false}];
//          renderTpl(tpl);
//          $scope.loopArr = loopArr;
//          $('.patternList li').removeClass('active');
//          $('li.duoxuan').addClass('active');
//          duoxuan_data.shuju.TIXING_ID = 2;
//          duoxuan_data.shuju.TIMULEIXING_ID = 2;
//          duoxuan_data.shuju.TIZHISHULIANG = '';
//          duoxuan_data.shuju.SUIJIPAIXU = '';
//          duoxuan_data.shuju.ZUISHAOXUANZE = '';
//          duoxuan_data.shuju.ZUIDUOXUANZE = '';
//          duoxuan_data.shuju.TIGAN = '';
//          $scope.duoXuanData = duoxuan_data;
//          $scope.loadingImgShow = false; //duoxuan.html
//          isDanXuanType = false; //判断是否出单选题
//          isDuoXuanType = true; //判断是否出多选题
//        };
//
//        /**
//         * 计算题模板加载
//         */
//        $scope.addJiSuan = function(tpl){
//          $scope.selectZhiShiDian = ''; //知识大纲名称清空
//          jisuan_data = timu_data;
//          renderTpl(tpl);
//          $('.patternList li').removeClass('active');
//          $('li.jisuan').addClass('active');
//          jisuan_data.shuju.TIXING_ID = 9;
//          jisuan_data.shuju.TIMULEIXING_ID = 9;
//          $scope.jiSuanData = jisuan_data;
//          $scope.loadingImgShow = false; //jisuan.html
//        };
//
//        /**
//         * 查询题目来源的数据
//         */
//        var qryTiMuSourceFun = function(){
//          if(!($scope.mingTiParam.tiMuLaiYuan && $scope.mingTiParam.tiMuLaiYuan.length)){
//            DataService.getData(queryTiMuSource).then(function(data) {
//              if(data && data.length > 0){
//                $scope.mingTiParam.tiMuLaiYuan = data;
//              }
//            });
//          }
//        };
//
//        /**
//         * 添加新的试题
//         */
//        $scope.addNewShiTi = function(){
//          var newShiTiTiXingArr = [];
//          Lazy($scope.kmtxList).each(function(tx, indx, lst){
//            switch (tx.TIXING_ID)
//            {
//              case '1':
//                tx.ntxClass = 'danxuan';
//                newShiTiTiXingArr.push(tx);
//                break;
//              case '2':
//                tx.ntxClass = 'duoxuan';
//                newShiTiTiXingArr.push(tx);
//                break;
//              case '3':
//                tx.ntxClass = 'shuangxuan';
//                newShiTiTiXingArr.push(tx);
//                break;
//              case '4':
//                tx.ntxClass = 'panduan';
//                newShiTiTiXingArr.push(tx);
//                break;
//              case '5':
//                tx.ntxClass = 'shifei';
//                newShiTiTiXingArr.push(tx);
//                break;
//              case '6':
//                tx.ntxClass = 'tiankong';
//                newShiTiTiXingArr.push(tx);
//                break;
//              case '7':
//                tx.ntxClass = 'dancifanyi';
//                newShiTiTiXingArr.push(tx);
//                break;
//              case '8':
//                tx.ntxClass = 'dancijieshi';
//                newShiTiTiXingArr.push(tx);
//                break;
//              case '9':
//                tx.ntxClass = 'jisuan';
//                newShiTiTiXingArr.push(tx);
//                break;
//              case '10':
//                tx.ntxClass = 'wenda';
//                newShiTiTiXingArr.push(tx);
//                break;
//              case '11':
//                tx.ntxClass = 'jianda';
//                newShiTiTiXingArr.push(tx);
//                break;
//              case '12':
//                tx.ntxClass = 'lunshu';
//                newShiTiTiXingArr.push(tx);
//                break;
//              case '13':
//                tx.ntxClass = 'fanyi';
//                newShiTiTiXingArr.push(tx);
//                break;
//              case '14':
//                tx.ntxClass = 'zuowen';
//                newShiTiTiXingArr.push(tx);
//                break;
//              case '15':
//                tx.ntxClass = 'zhengming';
//                newShiTiTiXingArr.push(tx);
//                break;
//              case '16':
//                tx.ntxClass = 'zuotu';
//                newShiTiTiXingArr.push(tx);
//                break;
//              case '17':
//                tx.ntxClass = 'jieda';
//                newShiTiTiXingArr.push(tx);
//                break;
//              case '19':
//                tx.ntxClass = 'bidatiankong';
//                newShiTiTiXingArr.push(tx);
//                break;
//            }
//          });
//          testListStepZst = selectZsd; //保存选题阶段的知识点
//          isEditItemStep = true;
//          $scope.patternListToggle = true;
//          $scope.newShiTiTiXing = newShiTiTiXingArr;
//          $scope.mingTiParam.isConvertTiXing = false;
//          tkLoopArr = [];
//          $scope.tkLoopArr = [];
//          $('.pointTree').find('input[name=point]').prop('checked', false); // add new
//          $scope.addDanXuan('views/mingti/danxuan.html');
//          qryTiMuSourceFun();
//        };
//
//        /**
//         * 重置输入整个form和重置函数
//         */
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
//
//        /**
//         * 单选题和多选题添加函数//
//         */
//        var addDanDuoXuanFun = function(dataTpl) {
//          var deferred = $q.defer();
//          tznrIsNull = true;
//          if(dataTpl == danxuan_data){
//            dataTpl.shuju.TIXING_ID = 1;
//            dataTpl.shuju.TIMULEIXING_ID = 1;
//          }
//          if(dataTpl == duoxuan_data){
//            dataTpl.shuju.TIXING_ID = 2;
//            dataTpl.shuju.TIMULEIXING_ID = 2;
//          }
//          var tizhineirong = []; //存放题支内容
//          var daAn = []; //存放答案
//          //整理题支
//          Lazy($scope.loopArr).each(function(tizhi, idx, lst){
//            if(tizhi.itemVal){
//              tizhineirong.push(tizhi.itemVal);
//            }
//            else{
//              var itVal = $('.tizhiWrap input.tiZhi').eq(idx).val();
//              if(itVal){
//                tizhineirong.push(itVal);
//              }
//              else{
//                tznrIsNull = false;
//              }
//            }
//            if(tizhi.ckd){
//              daAn.push(idx);
//            }
//          });
//          dataTpl.shuju.DAAN = daAn.join();
//          dataTpl.shuju.NANDU_ID = $('input.nandu-input').val(); //改造成星星选择难度后的代码
//          dataTpl.shuju.TIZHINEIRONG = tizhineirong;
//          dataTpl.shuju.TIZHISHULIANG = tizhineirong.length;
//          dataTpl.shuju.ZHISHIDIAN = selectZsd;
//          dataTpl.shuju.TIGAN = $('.formulaEditTiGan').val();
//          //将题干中的\r\n和\n替换成<br/>
//          dataTpl.shuju.TIGAN = dataTpl.shuju.TIGAN.replace(regN, replaceStr);
//          dataTpl.shuju.TIGAN = dataTpl.shuju.TIGAN.replace(regRN, replaceStr);
//          if(dataTpl.shuju.TIGAN.length){
//            if(tznrIsNull){
//              if(dataTpl.shuju.DAAN.length){
//                if(dataTpl.shuju.NANDU_ID.length){
//                  if(selectZsd.length){
//                    $scope.loadingImgShow = true;
//                    $http.post(xgtmUrl, dataTpl).success(function(data){
//                      if(data.result){
//                        $scope.loadingImgShow = false;
//                        DataService.alertInfFun('suc', '提交成功！');
//                        $scope.isSaveSuccessful = true;
//                        $scope.loadingImgShow = false;
//                        deferred.resolve();
//                      }
//                      else{
//                        DataService.alertInfFun('err', '提交失败！错误信息:' + data.error);
//                        $scope.loadingImgShow = false;
//                        deferred.reject();
//                      }
//                    });
//                  }
//                  else{
//                    DataService.alertInfFun('pmt', '请选择知识点！');
//                    deferred.reject();
//                  }
//                }
//                else{
//                  DataService.alertInfFun('pmt', '请选择难度！');
//                  deferred.reject();
//                }
//              }
//              else{
//                DataService.alertInfFun('pmt', '请选择答案！');
//                deferred.reject();
//              }
//            }
//            else{
//              DataService.alertInfFun('pmt', '请输入题支选项！');
//              deferred.reject();
//            }
//          }
//          else{
//            DataService.alertInfFun('pmt', '请输入题干！');
//            deferred.reject();
//          }
//          return deferred.promise;
//        };
//
//        /**
//         * 保存问答题这部分题型的通用函数
//         */
//        $scope.addAskAnswerShiTi = function(tx){
//          var tx_data = '',
//            formulaTiGan = $('.formulaEditTiGan'),
//            formulaTiZhi = $('.formulaEditTiZhi');
//          switch (tx){
//            case 'jisuan_data':
//              tx_data = jisuan_data;
//              tx_data.shuju.TIGAN = formulaTiGan.val();
//              tx_data.shuju.DAAN = formulaTiZhi.val();
//              break;
//            case 'zhengming_data':
//              tx_data = zhengming_data;
//              tx_data.shuju.TIGAN = formulaTiGan.val();
//              tx_data.shuju.DAAN = formulaTiZhi.val();
//              break;
//            case 'jieda_data':
//              tx_data = jieda_data;
//              tx_data.shuju.TIGAN = formulaTiGan.val();
//              tx_data.shuju.DAAN = formulaTiZhi.val();
//              break;
//            case 'pandu_data':
//              tx_data = pandu_data;
//              tx_data.shuju.TIGAN = formulaTiGan.val();
//              break;
//          }
//          tx_data.shuju.ZHISHIDIAN = selectZsd;
//          tx_data.shuju.NANDU_ID = $('input.nandu-input').val(); //改造成星星选择难度后的代码
//          //替换换行符为<br/>
//          tx_data.shuju.TIGAN = tx_data.shuju.TIGAN.replace(regN, replaceStr);
//          tx_data.shuju.TIGAN = tx_data.shuju.TIGAN.replace(regRN, replaceStr);
//          tx_data.shuju.DAAN = tx_data.shuju.DAAN.replace(regN, replaceStr);
//          tx_data.shuju.DAAN = tx_data.shuju.DAAN.replace(regRN, replaceStr);
//          if(tx_data.shuju.TIGAN.length){
//            if(tx_data.shuju.DAAN.length){
//              if(selectZsd.length){
//                if(tx_data.shuju.NANDU_ID.length){
//                  if($scope.mingTiParam.tiXingId && (tx_data.shuju.TIXING_ID != $scope.mingTiParam.tiXingId)){
//                    tx_data.shuju.TIXING_ID = $scope.mingTiParam.tiXingId;
//                  }
//                  $scope.loadingImgShow = true; //jisuan.html
//                  $http.post(xgtmUrl, tx_data).success(function(data){
//                    if(data.result){
//                      if(tx_data.shuju.TIMU_ID){ //试题修改成功后！
//                        DataService.alertInfFun('suc', '修改成功！');
//                        $scope.patternListToggle = false;
//                        $scope.alterTiXingBox = false;
//                        $scope.cancelAddPattern();
//                      }
//                      else{ // 试题添加成功后！
//                        DataService.alertInfFun('suc', '添加成功！');
//                        resetFun(tx_data);
//                      }
//                      $scope.loadingImgShow = false; //jisuan.html
//                    }
//                    else{
//                      DataService.alertInfFun('err', data.error);
//                      $scope.loadingImgShow = false; //jisuan.html
//                    }
//                  });
//                }
//                else{
//                  DataService.alertInfFun('pmt', '请选择难度！');
//                }
//              }
//              else{
//                DataService.alertInfFun('pmt', '请选择知识点！');
//              }
//            }
//            else{
//              DataService.alertInfFun('pmt', '请输入答案！');
//            }
//          }
//          else{
//            DataService.alertInfFun('pmt', '请输入题干！');
//          }
//        };
//
//        /**
//         * 添加题干编辑器
//         */
//        $scope.addTiGanEditor = function(){
//          $('.formulaEditTiGan').markItUp(mySettings);
//          DataService.tiMuContPreview();
//        };
//
//        /**
//         * 添加题支编辑器
//         */
//        $scope.addTiZhiEditor = function(){
//          $('.formulaEditTiZhi').markItUp(mySettings);
//          DataService.tiZhiContPreview();
//        };
//
//        /**
//         * 移除题干编辑器
//         */
//        $scope.removeTiGanEditor = function(){
//          $('.formulaEditTiGan').markItUp('remove');
//        };
//
//        /**
//         * 移除题支编辑器
//         */
//        $scope.removeTiZhiEditor = function(tx){
//          if(tx >= 9){
//            $('.formulaEditTiZhi').markItUp('remove');
//          }
//          else{
//            $('.formulaEditTiZhi').markItUp('remove').val('');
//            $('#prevTiZhiDoc').html('');
//            $('input[name=fuzhi]').prop('checked', false);
//          }
//        };
//
//        /**
//         * 显示单选题题干编辑器
//         */
//        $scope.showDanXuanTiGanEditor = function(){
//          $('.formulaEditTiGan').markItUp(mySettings);
//          DataService.tiMuContPreview();
//        };
//
//        /**
//         * 显示单选题题支编辑器
//         */
//        $scope.showDanXuanTiZhiEditor = function(){
//          $('.formulaEditTiZhi').markItUp(mySettings);
//        };
//
//        /**
//         * 给题支选项赋值
//         */
//        $scope.fuZhiFun = function(idx){
//          $('.tizhiWrap .tiZhi').eq(idx).val($('.formulaEditTiZhi').val());
//        };
//
//        /**
//         * 填空题题支选项赋值
//         */
//        $scope.fuZhiFunTk = function(parentIdx, idx){
//          $('.tizhiWrap').eq(parentIdx).find('input.subTiZhi').eq(idx).val($('.formulaEditTiZhi').val());
//        };
//
//        /**
//         * 单选题添加代码
//         */
//        $scope.addDanxuanShiTi = function(){
//          var promise = addDanDuoXuanFun(danxuan_data);
//          promise.then(function() {
//            resetFun(danxuan_data);
//            $scope.loadingImgShow = false; //danxuan.html
//          });
//        };
//
//        /**
//         * 显示多选题题干编辑器
//         */
//        $scope.showDuoXuanTiGanEditor = function(){
//          $('.formulaEditTiGan').markItUp(mySettings);
//          DataService.tiMuContPreview();
//        };
//
//        /**
//         * 显示多选题题支编辑器
//         */
//        $scope.showDuoXuanTiZhiEditor = function(){
//          $('.formulaEditTiZhi').markItUp(mySettings);
//        };
//
//        /**
//         * 多选题添加代码
//         */
//        $scope.addDuoxuanShiTi = function(){
//          var promise = addDanDuoXuanFun(duoxuan_data);
//          promise.then(function() {
//            resetFun(duoxuan_data);
//            $scope.loadingImgShow = false; //duoxuan.html
//          });
//        };
//
//        /**
//         * 显示计算题干编辑器
//         */
//        $scope.showJiSuanTiGanEditor = function(){
//          $('.formulaEditTiGan').markItUp(mySettings);
//          DataService.tiMuContPreview();
//        };
//
//        /**
//         * 显示计算题答案编辑器
//         */
//        $scope.showJiSuanDaAnEditor = function(){
//          $('.formulaEditTiZhi').markItUp(mySettings);
//          DataService.tiZhiContPreview();
//        };
//
//        /**
//         * 多选题选择答案的效果的代码editItem
//         */
//        $scope.chooseDaAn = function(da, stat){
//          if(stat == 'dan'){
//            Lazy($scope.loopArr).each(function(tizhi, idx, lst){
//              tizhi.ckd = false;
//            });
//          }
//          da.ckd = !da.ckd;
//        };
//
//        /**
//         * 解答题模板添加
//         */
//        $scope.addZhengMing = function(tpl){
//          $scope.selectZhiShiDian = ''; //知识大纲名称清空
//          zhengming_data = timu_data;
//          renderTpl(tpl);
//          $('.patternList li').removeClass('active');
//          $('li.zhengming').addClass('active');
//          zhengming_data.shuju.TIXING_ID = 15;
//          zhengming_data.shuju.TIMULEIXING_ID = 9;
//          $scope.zhengMingData = zhengming_data;
//          $scope.loadingImgShow = false; //jieda.html
//        };
//
//        /**
//         * 解答题模板添加
//         */
//        $scope.addJieDa = function(tpl){
//          $scope.selectZhiShiDian = ''; //知识大纲名称清空
//          jieda_data = timu_data;
//          renderTpl(tpl);
//          $('.patternList li').removeClass('active');
//          $('li.jieda').addClass('active');
//          jieda_data.shuju.TIXING_ID = 17;
//          jieda_data.shuju.TIMULEIXING_ID = 9;
//          $scope.jieDaData = jieda_data;
//          $scope.loadingImgShow = false; //jieda.html
//        };
//
//        /**
//         * 判断题模板添加
//         */
//        $scope.addPanDuan = function(tpl){
//          $scope.selectZhiShiDian = ''; //知识大纲名称清空
//          pandu_data = timu_data;
//          renderTpl(tpl);
//          $('.patternList li').removeClass('active');
//          $('li.panduan').addClass('active');
//          pandu_data.shuju.TIXING_ID = 4;
//          pandu_data.shuju.TIMULEIXING_ID = 3;
//          $scope.panDuanData = pandu_data;
//          $scope.loadingImgShow = false;
//        };
//
//        /**
//         * 判断题选择答案的效果的代码
//         */
//        $scope.choosePanDuanDaan = function(idx){
//          //var tgt = '.answer' + idx,
//          //  tgtElement = $(tgt);
//          //$('div.radio').removeClass('radio-select');
//          //tgtElement.addClass('radio-select');
//          //tgtElement.find("input[name='rightAnswer']").prop('checked',true);
//          //pandu_data.shuju.DAAN = tgtElement.find("input[name='rightAnswer']").val();
//          $scope.mingTiParam.panDuanDaAn = idx;
//          pandu_data.shuju.DAAN = idx.toString();
//        };
//
//        /**
//         * 填空题模板添加
//         */
//        $scope.addTianKong = function(tpl){
//          $scope.selectZhiShiDian = ''; //知识大纲名称清空
//          tiankong_data = timu_data;
//          tkLoopArr = [];
//          renderTpl(tpl);
//          $('.patternList li').removeClass('active');
//          $('li.tiankong').addClass('active');
//          tiankong_data.shuju.TIXING_ID = 6;
//          tiankong_data.shuju.TIMULEIXING_ID = 4;
//          $scope.tianKongData = tiankong_data;
//          $scope.loadingImgShow = false; //panduan.html
//          var addTianKongFun = function() {
//            $('.formulaEditTiGan').markItUp(mySettings);
//          };
//          $timeout(addTianKongFun, 500);
//        };
//
//        /**
//         * 笔答填空题模板添加
//         */
//        $scope.addTianKongBiDa = function(tpl){
//          $scope.selectZhiShiDian = ''; //知识大纲名称清空
//          tiankong_data = timu_data;
//          tkLoopArr = [];
//          renderTpl(tpl);
//          $('.patternList li').removeClass('active');
//          $('li.bidatiankong').addClass('active');
//          tiankong_data.shuju.TIXING_ID = 19;
//          tiankong_data.shuju.TIMULEIXING_ID = 6;
//          $scope.tianKongData = tiankong_data;
//          $scope.loadingImgShow = false; //panduan.html
//          var addTianKongFun = function() {
//            $('.formulaEditTiGan').markItUp(mySettings);
//          };
//          $timeout(addTianKongFun, 500);
//        };
//
//        /**
//         * 查找字符串出现的次数
//         */
//        var countInstances = function(mainStr, subStr) {
//          var count = 0; var offset = 0;
//          do{
//            offset = mainStr.indexOf(subStr, offset);
//            if(offset != -1)
//            {
//              count++;
//              offset += subStr.length;
//            }
//          }
//          while(offset != -1);
//          return count;
//        };
//
//        /**
//         * loopArr
//         */
//        $scope.addTkDaanInput = function(){
//          var tgVal = $('.formulaEditTiGan').val(),
//            cnum, i = '', loopArrObj,
//            asLength = '';
//          cnum = countInstances(tgVal, '<span>');
//          if(tkLoopArr && tkLoopArr.length > 0){
//            asLength = tkLoopArr.length;
//            if(cnum > tkLoopArr.length){
//              for(i = asLength; i < cnum; i++){
//                loopArrObj = {
//                  tiZhiNum: '',
//                  subTiZhiNum: ['请输入答案']
//                };
//                loopArrObj.tiZhiNum = i;
//                tkLoopArr.push(loopArrObj);
//              }
//            }
//          }
//          else{
//            tkLoopArr = [];
//            for(i = 1; i <= cnum; i++){
//                loopArrObj = {
//                tiZhiNum: '',
//                subTiZhiNum: ['请输入答案']
//              };
//              loopArrObj.tiZhiNum = i;
//              tkLoopArr.push(loopArrObj);
//            }
//          }
//          $scope.tkLoopArr = tkLoopArr;
//        };
//
//        /**
//         * 添加更多变形答案
//         */
//        $scope.addSubTiZhi = function(tzCont){
//          tzCont.subTiZhiNum.push('请输入答案');
//        };
//
//        /**
//         * 删除一条变形答案
//         */
//        $scope.removeSubTiZhi = function(tzCont, idx){
//          tzCont.subTiZhiNum.splice(idx, 1);
//        };
//
//        /**
//         * 检查填空题输入的内容
//         */
//        $scope.checkTiKongVal = function(event){
//          var thisVal = $(event.target).val();
//          if(thisVal == '请输入答案'){
//            $(event.target).val('');
//          }
//        };
//
//        /**
//         * 保存填空试题
//         */
//        $scope.addTianKongShiTi = function(){
//          var tiZhiArr = $('.tizhiWrap').find('input.subTiZhi');
//          var reg = new RegExp('<span>.*?</span>', 'g');
//          var count = 0;
//          var tgVal = $('.formulaEditTiGan').val();
//          tznrIsNull = true;
//          //整理题支
//          var tzLen = tiZhiArr.length;
//          for(var i = 0; i < tzLen; i++){
//            var tiZhiCont = tiZhiArr.eq(i).val();
//            if((!tiZhiCont) || (tiZhiCont == '请输入答案')){
//              tznrIsNull = false;
//            }
//          }
//          if(tznrIsNull){
//            tiankong_data.shuju.TIGAN = tgVal.replace(reg, function(arg) {
//              var tzCont = [],
//                tarCss,
//                tzJson = {"size": "", "placeholder": "请填写", "answer": ""};
//              tarCss = '.tiZhi' + count;
//              Lazy($(tarCss).find('input.subTiZhi')).each(function(subTz){
//                if(subTz.value){
//                  tzCont.push(subTz.value);
//                }
//              });
//              tzJson.size = tzCont.length + 10;
//              tzJson.answer = tzCont;
//              count ++;
//              return '<%' + JSON.stringify(tzJson) + '%>';
//            });
//            tiankong_data.shuju.ZHISHIDIAN = selectZsd;
//            tiankong_data.shuju.NANDU_ID = $('input.nandu-input').val(); //改造成星星选择难度后的代码
//            //将题干重的换行转换为<br/>
//            tiankong_data.shuju.TIGAN = tiankong_data.shuju.TIGAN.replace(regN, replaceStr);
//            tiankong_data.shuju.TIGAN = tiankong_data.shuju.TIGAN.replace(regRN, replaceStr);
//            if(tiankong_data.shuju.TIGAN.length){
//              if(selectZsd.length){
//                if(tiankong_data.shuju.NANDU_ID.length){
//                  $scope.loadingImgShow = true; //jisuan.html
//                  $http.post(xgtmUrl, tiankong_data).success(function(data){
//                    if(data.result){
//                      if(tiankong_data.shuju.TIMU_ID){ //试题修改成功后！
//                        DataService.alertInfFun('suc', '修改成功！');
//                        $scope.patternListToggle = false;
//                        $scope.alterTiXingBox = false;
//                        $scope.cancelAddPattern();
//                      }
//                      else{ // 试题添加成功后！
//                        DataService.alertInfFun('suc', '保存成功！');
//                        resetFun(tiankong_data);
//                      }
//                      $scope.tkLoopArr = []; //重置填空题支
//                      $scope.loadingImgShow = false; //jisuan.html
//                    }
//                    else{
//                      DataService.alertInfFun('err', data.error);
//                      $scope.loadingImgShow = false; //jisuan.html
//                    }
//                  });
//                }
//                else{
//                  DataService.alertInfFun('pmt', '请选择难度！');
//                }
//              }
//              else{
//                DataService.alertInfFun('pmt', '请选择知识点！'); //
//              }
//            }
//            else{
//              DataService.alertInfFun('pmt', '请输入题干！'); //
//            }
//          }
//          else{
//            DataService.alertInfFun('pmt', '请输入填空题答案！');
//          }
//        };
//
//        /**
//         * 阅读题
//         */
//        $scope.addYueDu = function(tpl){
//          yuedu_data = timu_data;
//          renderTpl(tpl);
//          $('.patternList li').removeClass('active');
//          $('li.yuedu').addClass('active');
//          yuedu_data.shuju.TIXING_ID = '';
//          yuedu_data.shuju.TIMULEIXING_ID = '';
//          $scope.yueDuData = yuedu_data;
//          $scope.loadingImgShow = false; //panduan.html
//        };
//
//        /**
//         * 点击添加按钮添加一项题支输入框
//         */
//        $scope.addOneItem = function(){
//          var vObj = {itemVal: '', ckd: false};
//          loopArr.push(vObj);
//        };
//
//        /**
//         * 点击删除按钮删除一项题支输入框
//         */
//        $scope.deleteOneItem = function(idx, itm){
//          if(itm.ckd){
//            DataService.alertInfFun('pmt', '此项为正确答案不能删除！');
//          }
//          else{
//            loopArr.splice(idx, 1);
//          }
//        };
//
//        /**
//         * 点击删除按钮删除一道题
//         */
//        $scope.deleteItem = function(tmid, idx){
//          var truthBeDel = window.confirm('确定要删除此题吗？');
//          if (truthBeDel) {
//            deleteTiMuData.timu_id = tmid;
//            $http.post(deleteTiMuUrl, deleteTiMuData).success(function(data){
//              if(data.result){
//                $scope.timuDetails.splice(idx, 1);
//                DataService.alertInfFun('suc', '删除成功！');
//              }
//              else{
//                DataService.alertInfFun('pmt', data.error);
//              }
//            });
//          }
//        };
//
//        /**
//         * 加载修改单多选题模板
//         */
//        var makeZsdSelect = function(tmxq){ //修改题目是用于反向选择知识大纲
//          var onZsd = '';
//          function _do(item) {
//            if(item.ZHISHIDIAN_ID == onZsd.ZHISHIDIAN_ID){
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
//            //selectZsd.push(zsd.ZHISHIDIAN_ID);
//            Lazy($scope.kowledgeList[0]['子节点']).each(_do);
//            //selectZsdStr += 'select' + zsd.ZHISHIDIAN_ID + ',';
//          });
//          //$scope.selectZsdStr = selectZsdStr; //用于控制大纲结束
//          selectZsdFun();
//        };
//
//        var onceMakeWord = true;
//        $scope.editItem = function(tmxq){
//          var tpl, editDaAnArr = [], nanDuClass;
//          testListStepZst = selectZsd; //保存选题阶段的知识点
//          selectZsd = []; //new add
//          $scope.selectZsdStr = '';
//          isEditItemStep = false;
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
//          if(tmxq.TIXING_ID == 4){
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
//          if(tmxq.TIXING_ID == 6 || tmxq.TIXING_ID == 19){
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
//                $scope.tkLoopArr = tkLoopArr;
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
//          if(tmxq.TIXING_ID == 9){
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
//          if(tmxq.TIXING_ID == 15){
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
//          if(tmxq.TIXING_ID == 17){
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
//
//        /**
//         * 添加新试题
//         */
//        $scope.addNewShiTiFun = function(txId){
//          switch (txId){
//            case '1':
//              $scope.addDanXuan('views/mingti/danxuan.html');
//              break;
//            case '2':
//              $scope.addDuoXuan('views/mingti/duoxuan.html');
//              break;
//            case '3':
////              $scope.addShuangXuan('views/mingti/shuangxuan.html');
//              break;
//            case '4':
//              $scope.mingTiParam.panDuanDaAn = '';
//              $scope.addPanDuan('views/mingti/panduan.html');
//              break;
//            case '5':
////              $scope.addPanDuan('views/mingti/panduan.html');
//              break;
//            case '6':
//              $scope.addTianKong('views/mingti/tiankong.html');
//              break;
//            case '7':
////              $scope.addPanDuan('views/mingti/panduan.html');
//              break;
//            case '8':
////              $scope.addPanDuan('views/mingti/panduan.html');
//              break;
//            case '9':
//              $scope.addJiSuan('views/mingti/jisuan.html');
//              break;
//            case '10':
////              $scope.addPanDuan('views/mingti/panduan.html');
//              break;
//            case '11':
////              $scope.addPanDuan('views/mingti/panduan.html');
//              break;
//            case '12':
////              $scope.addPanDuan('views/mingti/panduan.html');
//              break;
//            case '13':
////              $scope.addPanDuan('views/mingti/panduan.html');
//              break;
//            case '14':
////              $scope.addPanDuan('views/mingti/panduan.html');
//              break;
//            case '15':
//              $scope.addZhengMing('views/mingti/zhengming.html');
//              break;
//            case '16':
////              $scope.addPanDuan('views/mingti/panduan.html');
//              break;
//            case '17':
//              $scope.addJieDa('views/mingti/jieda.html');
//              break;
//            case '19':
//              $scope.addTianKongBiDa('views/mingti/tiankong.html');
//              break;
//          }
//        };
//
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
//
//        /**
//         * 显示题干预览
//         */
//        $scope.previewTiGan = function(){
//          var tgCont = $('.formulaEditTiGan').val();
//          tgCont = tgCont.replace(/\n/g, '<br/>');
//          $('#prevDoc').html(tgCont);
//          MathJax.Hub.Queue(["Typeset", MathJax.Hub, "prevDoc"]);
//        };
//
//        /**
//         * 显示题干预览
//         */
//        $scope.previewTiZhi = function(){
//          var tzCont = $('.formulaEditTiZhi').val();
//          tzCont = tzCont.replace(/\n/g, '<br/>');
//          $('#prevTiZhiDoc').html(tzCont);
//          MathJax.Hub.Queue(["Typeset", MathJax.Hub, "prevTiZhiDoc"]);
//        };

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
          MathJax.Hub.Queue(["Typeset", MathJax.Hub, "testList"]);
          MathJax.Hub.Queue(["Typeset", MathJax.Hub, "daGangList"]);
        });

      }
    ]
  );
});
