define(['angular', 'config', 'charts', 'mathjax', 'jquery', 'lazy'],
  function (angular, config, charts, mathjax, $, lazy) {
  'use strict';
  angular.module('zhifzApp.controllers.TongjiCtrl', [])
    .controller('TongjiCtrl', ['$rootScope', '$scope', '$http', '$timeout', 'DataService', '$location', '$cookieStore',
      function ($rootScope, $scope, $http, $timeout, DataService, $location, $cookieStore) {

        /**
         * 声明变量
         */
        var loginUsr = JSON.parse($cookieStore.get('ckUsr'));
        var jgID = loginUsr['学校ID']; //登录用户学校
        var logUid = loginUsr['UID']; //登录用户的UID
        var yongHuSet = loginUsr['用户设置']; //用户设置
        var dftKm = JSON.parse($cookieStore.get('ckKeMu')); //默认选择的科目
        var keMuId = dftKm['科目ID']; //默认的科目ID
        var lingYuId = dftKm['领域ID']; //默认的科目ID
        var kaoShiZuUrl = '/kaoshizu'; //考试组
        var kaoShiZuZhiShiDianUrl = '/kaoshizu_zhishidian'; //考试组知识点
        var kaoShengChengJiUrl = '/kaosheng_chengji'; //查询考生成绩
        var kaoShengZhiShiDianDeFenLvUrl = '/kaosheng_zhishidian_defenlv'; //查询考生知识点得分率
        var kaoShiZuTiMuDeFenLvUrl = '/kaoshizu_timu_defenlv'; //查询考试组题目得分率
        var tiMuDeFenLvUrl = '/timu_defenlv'; //题目得分率
        var zhiShiDianDeFenLvUrl = '/zhishidian_defenlv'; //查询知识点得分率
        var itemNumPerPage = 10; //每页多少条数据
        var paginationLength = 11; //分页部分，页码的长度，目前设定为11
        var kaoShiZuStore = ''; //存放考试组的变量
        var allStutents = ''; //统计所有考生数据
        var tjBarData = []; //柱状图数据
        $scope.defaultKeMu = dftKm; //默认科目
        $scope.pageParam = { //分页参数
          activePage: '',
          lastPage: '',
          pageArr: [],
          disPage: []
        };
        $scope.tjParas = { //统计用到的参数
          stuIdCount: true,
          nameCount: true,
          kxhCount: true,
          scoreCount: true,
          xuHaoCount: true,
          tjWdPgOn: 0, //统计用到的统计维度激活页码
          tjWdPgLen: 0, //统计用到的统计维度总页面
          lastSltKxh: {
            activeIdx: 0,
            kxhIdx: 0
          },
          sltWeiDu: '', //当前选中的维度
          yxScore: 85,
          jgScore: 60
          //zdcxKaoShiId: '', //作答重现用到的考试id
          //letterArr: config.letterArr, //题支的序号
          //cnNumArr: config.cnNumArr, //汉语的大写数字
          //lastSltKxh: {
          //  activeIdx: 0,
          //  kxhIdx: 0
          //}, //最后选中的班级
          //allStudents: '',
          //zsdOriginData: '', //统计——存放知识点原始数据的变量
          //zsdIdArr: '',
          //selectedKaoShi: [], //统计时存放已选择的考试
          //studentUid: '', //存放考生UID的字段，用于考生统计
          //tongJiType: 'keXuHao',
        };
        var tjParaObj = {
          pieBoxAll: '',
          pieBoxKxh: '',
          barBox: '',
          lineBox: '',
          radarBox: '',
          radarBoxZsd: '',
          pieData: '',
          lineDataAll: '',
          lineDataBK: '',
          radarDataZsd: {
            zsdName: [],
            zsdPerAll: [],
            zsdPerBk: []
          }
        }; //存放统计参数的Object
        //var baseKwAPIUrl = config.apiurl_kw; //考务的api
        //var baseTjAPIUrl = config.apiurl_tj; //统计的api
        //var baseRzAPIUrl = config.apiurl_rz;
        //var token = config.token;
        //var userInfo = $rootScope.session.userInfo;
        //var caozuoyuan = userInfo.UID;//登录的用户的UID
        //var jigouid = userInfo.JIGOU[0].JIGOU_ID;
        //var lingyuid = $rootScope.session.defaultLyId;
        //var queryKaoShengBase = baseTjAPIUrl + 'query_kaosheng?token=' + token; //查询考生数据
        //var qryKaoShiByXueHaoBase = baseTjAPIUrl + 'query_kaoshi_by_xuehao?token=' + token + '&jigouid=' + jigouid
        //    + '&lingyuid=' + lingyuid + '&xuehao='; //查询考试通过考生学号
        //var dataNumOfPerPage = 10; //每页显示多少条数据
        //var paginationLength = 11; //分页部分，页码的长度，目前设定为11
        //var pagesArr = []; //定义考试页码数组
        //var tjNeedData = []; //存放查询出来的统计数数据
        //var lastPage; //符合条件的考试一共有多少页

        //var answerReappearBaseUrl = baseTjAPIUrl + 'answer_reappear?token=' + token; //作答重现的url
        //var qryItemDeFenLvBase = baseTjAPIUrl + 'query_timu_defenlv?token=' + token + '&kaoshiid='; //查询每道题目的得分率
        //var itemDeFenLv = ''; //存放考生得分率的变量
        //var qryKaoShiZuListUrl = baseKwAPIUrl + 'query_kaoshizu_liebiao?token=' + token + '&caozuoyuan='
        //  + caozuoyuan + '&jigouid=' + jigouid + '&lingyuid=' + lingyuid; //查询考试列表的url
        //var chaXunKaoShiZuDetailUrl = baseKwAPIUrl + 'query_kaoshizu_detail?token=' + token + '&caozuoyuan=' +
        //  caozuoyuan + '&kszid='; //查询考试组详情
        //var queryKaoShiZuTongJi = baseTjAPIUrl + 'query_kaoshizu_tongji'; //查询统计数据
        //var queryKaoShengByBanji = baseTjAPIUrl + 'query_kaosheng_of_banji?token=' + token + '&kaoshizuid='; //查询班级下面的考试
        //var allStutents = ''; //统计所有考生数据
        //var exportStuInfoBase = config.apiurl_gg + 'json2excel?xls_file_name='; //导出excel名单
        //var kaoShiZuZhiShiDianUrl = baseTjAPIUrl + 'kaoshizu_zhishidian'; //保存考试组知识点
        //var getZhiShiDianScoreUrl = baseTjAPIUrl + 'zhishidian_defen'; //查询知识点得分
        //var kwKaoShiZuZhiShiDianUrl = baseKwAPIUrl + 'get_ksz_zsd'; //考位查询试组知识点
        //var tjZsdOriginData = ''; //存放知识点原始数据的
        //var jueSeIds = $cookieStore.get('logged');
        //var jiaoShiKeXunHaoUrl = baseRzAPIUrl + 'jiaoshi_kexuhao'; //由UID查询科学号
        //var kaoShiZuTongJiOriginData = ''; //考试组统计数据原始数据
        //
        //$scope.tjKaoShiList = []; //试卷列表
        //$scope.tjParas = { //统计用到的参数
        //  stuIdCount: true,
        //  nameCount: true,
        //  kxhCount: true,
        //  scoreCount: true,
        //  xuHaoCount: true,
        //  zdcxKaoShiId: '', //作答重现用到的考试id
        //  letterArr: config.letterArr, //题支的序号
        //  cnNumArr: config.cnNumArr, //汉语的大写数字
        //  tjWdPgOn: 0, //统计用到的当前班级页码
        //  tjWdPgLen: 0, //统计用到的班级总分页数
        //  sltWeiDu: '', //当前选中的班级
        //  lastSltKxh: {
        //    activeIdx: 0,
        //    kxhIdx: 0
        //  }, //最后选中的班级
        //  allStudents: '',
        //  zsdOriginData: '', //统计——存放知识点原始数据的变量
        //  zsdIdArr: '',
        //  selectedKaoShi: [], //统计时存放已选择的考试
        //  studentUid: '', //存放考生UID的字段，用于考生统计
        //  tongJiType: 'keXuHao',
        //  yxScore: 85,
        //  jgScore: 60
        //};
        //$scope.selectKsz = ''; //选中考试组
        //$scope.needToXgYxJgLv = true; //允许修改优秀和及格率
        //$scope.isRenKeJiaoShi = false; //是否是任课教师

        /**
        * 判断是否为数组
        */
        var isArray = function (obj) {
          return obj instanceof Array;
        };

        /**
         * 分页处理函数
         */
        var pageMake = function(data){
          var dataLen = data.length; //数据长度
          var lastPage = Math.ceil(dataLen/itemNumPerPage); //最后一页
          $scope.pageParam.pageArr = Lazy.generate(function(i) { return i + 1; }, lastPage).toArray();
          $scope.pageParam.lastPage = lastPage;
          $scope.pageParam.activePage = 1;
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
         * 统计函数
         */
        var chartShowFun = function(kind){
          var kszPjf = $scope.kszPubData['考试组平均分']; //考试组平均分
          var kszJgl = $scope.kszPubData['及格率']; //考试组及格率
          var kszYxl = $scope.kszPubData['优秀率']; //考试组优秀率
          var sgKxh = $scope.singleData || ''; //单个课序号需要的参数
          //var radarKxh = [0, 0, 0, 0];
          //var pjrs = Lazy(tj.KEXUHAO).sortBy(function(kxh){return kxh.SKRS}).toArray().reverse()[0].SKRS;
          //var pjfs = Lazy(tj.KEXUHAO).sortBy(function(kxh){return kxh.PJF}).toArray().reverse()[0].PJF;
          //var pjfsMax = Math.ceil(pjfs);
          //var radarAll = [tj.KAOSHIZU.JGLV, tj.KAOSHIZU.YXLV, tj.KAOSHIZU.SKRS/kaoShiZuTongJiOriginData.KEXUHAO.length, tj.KAOSHIZU.PJF];
          var dataStyle = {
            normal: {
              label: {
                show: false,
                position : 'inner',
                formatter : function (params) {
                  return params.percent + '%';
                },
                textStyle : {
                  fontSize : 14
                }
              },
              labelLine: {show:false}
            }
          };
          var placeHolderStyle = {
            normal : {
              color: 'rgba(0,0,0,0)',
              label: {show:false},
              labelLine: {show:false}
            },
            emphasis : {
              color: 'rgba(0,0,0,0)'
            }
          };
          var optPieAll = { // 环形图
            title: {
              text: '全部考生',
              subtext: '',
              sublink: '',
              x: 'center',
              y: 'center',
              itemGap: 20,
              textStyle : {
                color : 'rgba(30,144,255,0.8)',
                fontFamily : '微软雅黑',
                fontSize : 24,
                fontWeight : 'bolder'
              }
            },
            tooltip : {
              show: false,
              formatter: "{a} <br/>{b} : {c} ({d}%)"
            },
            legend: {
              orient : 'vertical',
              //x : document.getElementById('chartPie').offsetWidth / 2,
              x : '52%',
              y : 30,
              itemGap:12,
              data:['及格率:' + kszJgl + '%', '优秀率:' + kszYxl + '%']
            },
            toolbox: {
              show : false,
              feature : {
                mark : {show: true},
                dataView : {show: true, readOnly: false},
                restore : {show: true},
                saveAsImage : {show: true}
              }
            },
            series : [
              {
                name:'1',
                type:'pie',
                clockWise:false,
                radius : [100, 120],
                itemStyle : dataStyle,
                data:[
                  {
                    value: kszJgl,
                    name: '及格率:' + kszJgl + '%'
                  },
                  {
                    value: 100 - kszJgl,
                    name:'invisible',
                    itemStyle : placeHolderStyle
                  }
                ]
              },
              {
                name:'2',
                type:'pie',
                clockWise:false,
                radius : [80, 100],
                itemStyle : dataStyle,
                data:[
                  {
                    value: kszYxl,
                    name: '优秀率:' + kszYxl + '%'
                  },
                  {
                    value: 100 - kszYxl,
                    name:'invisible',
                    itemStyle : placeHolderStyle
                  }
                ]
              }
            ]
          };
          var optPieKxh = { // 环形图
            title: {
              text: '',
              subtext: '',
              sublink: '',
              x: 'center',
              y: 'center',
              itemGap: 20,
              textStyle : {
                color : 'rgba(30,144,255,0.8)',
                fontFamily : '微软雅黑',
                fontSize : 24,
                fontWeight : 'bolder'
              }
            },
            tooltip : {
              show: false,
              formatter: "{a} <br/>{b} : {c} ({d}%)"
            },
            legend: {
              orient : 'vertical',
              //x : document.getElementById('chartPie').offsetWidth / 2,
              x : '52%',
              y : 30,
              itemGap:12,
              data: []
            },
            toolbox: {
              show : false,
              feature : {
                mark : {show: true},
                dataView : {show: true, readOnly: false},
                restore : {show: true},
                saveAsImage : {show: true}
              }
            },
            series : [
              {
                name:'1',
                type:'pie',
                clockWise:false,
                radius : [100, 120],
                itemStyle : dataStyle,
                data:[
                  {
                    value: '',
                    name: ''
                  },
                  {
                    value: '',
                    name:'invisible',
                    itemStyle : placeHolderStyle
                  }
                ]
              },
              {
                name:'2',
                type:'pie',
                clockWise:false,
                radius : [80, 100],
                itemStyle : dataStyle,
                data:[
                  {
                    value: '',
                    name: ''
                  },
                  {
                    value: '',
                    name:'invisible',
                    itemStyle : placeHolderStyle
                  }
                ]
              }
            ]
          };
          var optBar = {
            tooltip : {
              trigger : 'axis',
              axisPointer : {
                type : 'shadow'
              }
            },
            legend : {
              data : ['课序号平均分']
            },
            calculable : true,
            xAxis : [{
              type : 'category',
              data : [] //此处为变量表示课序号数据
            }],
            yAxis : [{
              type : 'value',
              splitArea : {
                show : true
              }
            }],
            grid : {
              x : 30,
              x2 : 30,
              y : 30,
              y2 : 25
            },
            dataZoom : {
              show : false,
              realtime : true,
              start : 0,
              end : '' //此处为变量，是下面表示拖拽的功能
            },
            series : [{
              name : '课序号平均分',
              type : 'bar',
              barWidth: 30, //柱子的宽度
              itemStyle : {
                normal: {
                  label : {show: true, position: 'top'},
                  color:'#7FB06B' //柱子的颜色
                }
              },
              data : [], //此处为变量
              markLine : { //平均值直线
                itemStyle:{
                  normal:{
                    color:'#9F79EE'
                  }
                },
                data : [
                  [
                    {name: '平均值起点', xAxis: -1, yAxis: kszPjf, value: kszPjf},
                    {name: '平均值终点', xAxis: 1000, yAxis: kszPjf}
                  ]
                ]
              }
            }]
          };
          var optLine = {
            tooltip : {
              trigger: 'axis',
              formatter: function (params, ticket, callback) {
                return params.seriesName + '</br>' + params.data[0] + '分：' +  params.data[1] + '人';
              }
            },
            legend: {
              data:['所有考生','本班考生']
            },
            grid : {
              x : 40,
              x2 : 30,
              y : 30,
              y2 : 30
            },
            calculable : true,
            xAxis : [
              {
                type : 'value',
                scale:true,
                axisLabel : {
                  formatter: '{value}分'
                }
              }
            ],
            yAxis : [
              {
                type : 'value',
                scale:false,
                axisLabel : {
                  formatter: '{value}人'
                }
              }
            ],
            series : [
              {
                name: '所有考生',
                type: 'line',
                data: tjParaObj.lineDataAll
              },
              {
                name: '本班考生',
                type: 'line',
                data: ''
              }
            ]
          };
          //var optRadar = {
          //  tooltip : {
          //    trigger: 'axis'
          //  },
          //  legend: {
          //    orient : 'vertical',
          //    x : 'right',
          //    y : 'bottom',
          //    data:['整体','班级']
          //  },
          //  polar : [
          //    {
          //      indicator : [
          //        { text: '及格率', max: 100},
          //        { text: '优秀率', max: 100},
          //        { text: '平均人数', max: pjrs},
          //        { text: '平均分', max: pjfsMax}
          //      ]
          //    }
          //  ],
          //  calculable : true,
          //  series : [
          //    {
          //      name: '整体对比',
          //      type: 'radar',
          //      data : [
          //        {
          //          value : radarAll,
          //          name : '整体'
          //        },
          //        {
          //          value : radarKxh,
          //          name : '班级'
          //        }
          //      ]
          //    }
          //  ]
          //};
          //var optRadarZsd = {
          //  tooltip : {
          //    trigger: 'axis'
          //  },
          //  legend: {
          //    orient : 'vertical',
          //    x : 'right',
          //    y : 'bottom',
          //    data:['整体','班级']
          //  },
          //  polar : [
          //    {
          //      indicator : tjParaObj.radarDataZsd.zsdName
          //    }
          //  ],
          //  calculable : true,
          //  series : [
          //    {
          //      name: '整体对比',
          //      type: 'radar',
          //      data : [
          //        {
          //          value : tjParaObj.radarDataZsd.zsdPerAll,
          //          name : '整体'
          //        },
          //        {
          //          value : tjParaObj.radarDataZsd.zsdPerBk,
          //          name : '班级'
          //        }
          //      ]
          //    }
          //  ]
          //};
          //饼状图数据
          if(kind == 'all'){
            optLine.series[1].data = '';
          }
          else{
            optLine.series[1].data = tjParaObj.lineDataBK;
            optPieKxh.title.text = $scope.tjParas.sltWeiDu;
            optPieKxh.legend.data = ['及格率:' + sgKxh['及格率'] + '%', '优秀率:' + sgKxh['优秀率'] + '%'];
            optPieKxh.series[0].data[0].value = sgKxh['及格率'];
            optPieKxh.series[0].data[0].name = '及格率:' + sgKxh['及格率'] + '%';
            optPieKxh.series[0].data[1].value = 100 - sgKxh['及格率'];
            optPieKxh.series[1].data[0].value = sgKxh['优秀率'];
            optPieKxh.series[1].data[0].name = '优秀率:' + sgKxh['优秀率'] + '%';
            optPieKxh.series[1].data[1].value = 100 - sgKxh['优秀率'];
          }
          if(sgKxh){
            //radarKxh[0] = sgKxh['及格率'];
            //radarKxh[1] = sgKxh['优秀率'];
            //radarKxh[2] = sgKxh['实考人数'];
            //radarKxh[3] = sgKxh['平均分'];
            //optRadar.series[0].data[1].value = radarKxh;
          }
          //柱状图数据
          if($scope.kszPubData['统计维度'] && $scope.kszPubData['统计维度'].length > 0){
            tjBarData = Lazy($scope.kszPubData['统计维度']).sortBy(function(kxh){return -kxh['平均分'];}).toArray();
            Lazy(tjBarData).each(function(kxh, idx, lst){
              if(kxh['课序号名称'] != '空'){
                optBar.xAxis[0].data.push(kxh['课序号名称']);
                optBar.series[0].data.push(parseFloat(kxh['平均分'].toFixed(1)));
              }
              else{
                optBar.xAxis[0].data.push('空');
                optBar.series[0].data.push(0);
              }
            });
          }
          if(tjBarData.length <= 5){
            optBar.dataZoom.end = 100;
          }
          else{
            optBar.dataZoom.end = (5 / tjBarData.length) * 100;
          }
          tjParaObj.pieBoxAll.setOption(optPieAll);
          tjParaObj.pieBoxKxh.setOption(optPieKxh);
          //tjParaObj.radarBox.setOption(optRadar);
          //tjParaObj.radarBoxZsd.setOption(optRadarZsd);
          tjParaObj.lineBox.setOption(optLine);
          tjParaObj.barBox.setOption(optBar);
          $timeout(function (){
            window.onresize = function () {
              tjParaObj.pieBoxAll.resize();
              tjParaObj.pieBoxKxh.resize();
              tjParaObj.barBox.resize();
              tjParaObj.lineBox.resize();
              //tjParaObj.radarBox.resize();
              //tjParaObj.radarBoxZsd.resize();
            }
          }, 200);
        };

        /**
         * 折线图数据处理函数
         */
        var lineDataDealFun = function(data){
          var lineDataArr = [];
          var disByScore = Lazy(data).groupBy(function(item){return item['实际评分']}).toObject();
          Lazy(disByScore).each(function(v, k, l){
            if(k && parseInt(k) >= 0){
              var ary = [];
              ary[0] = parseInt(k);
              ary[1] = v.length;
              lineDataArr.push(ary);
            }
          });
          return lineDataArr;
        };

        /**
         * 考试组的分页数据查询函数
         */
        $scope.kaoShiZuDist = function(pg){
          var pgNum = pg - 1;
          var cutPage = pgNum ? pgNum : 0;
          cutPageFun(pg);
          $scope.kaoShiZuList = kaoShiZuStore.slice(cutPage * itemNumPerPage, (cutPage + 1) * itemNumPerPage);
        };

        /**
        * 显示考试统计列表
        */
        $scope.showKszList = function(){
          var obj = {
            method: 'GET',
            url: kaoShiZuUrl,
            params: {
              '学校ID': jgID,
              '科目ID': keMuId
            }
          };
          $scope.kszPubData = {
            '考试组名称': '',
            '考试组平均分': 0,
            '已作答人数': 0,
            '总人数': 0,
            '开考时间': '',
            '统计维度': [],
            '课序号摘要': '',
            '及格率': '',
            '优秀率': ''
          };
          var ztArr = [5, 6];
          obj.params['状态'] = JSON.stringify(ztArr);
          $scope.loadingImgShow = true;
          $http(obj).success(function(data){
            if(data.result && data.data){
              pageMake(data.data);
              kaoShiZuStore = Lazy(data.data).reverse().toArray();
              $scope.kaoShiZuDist(1);
              $scope.tj_tabActive = 'kaoshiTj';
              $scope.isTjDetailShow = false;
              $scope.studentData = '';
              $scope.tjSubTpl = 'views/tongji/tj_ks.html';
            }
            else{
              DataService.alertInfFun('err', data.error);
            }
            $scope.loadingImgShow = false;
          });
        };

        /**
        * 显示考生首页
        */
        $scope.showStuList = function(){
          $scope.tj_tabActive = 'kaoshengTj';
          $scope.studentData = '';
          $scope.tjKaoShiData = '';
          $scope.tjSubTpl = 'views/tongji/tj_student.html';
        };

        /**
        * 初始化运行的程序
        */
        $scope.showKszList();

        /**
         * 显示统计的详情
         */
        $scope.kszChart = function(ksz){
        if(ksz){
          $scope.kszPubData = {
            '考试组名称': ksz['考试组名称'],
            '考试组平均分': 0,
            '已作答人数': ksz['已作答人数'],
            '总人数': ksz['总人数'],
            '开考时间': '',
            '统计维度': [],
            '课序号摘要': '',
            '及格率': '',
            '优秀率': ''
          };
          var stuObj = {
            method: 'GET',
            url: kaoShengChengJiUrl,
            params: {
              '考试组ID': ksz['考试组ID']
            }
          };
          tjParaObj.radarDataZsd.zsdName = [];
          tjParaObj.radarDataZsd.zsdPerAll = [];
          tjParaObj.radarDataZsd.zsdPerBk = [];
          tjBarData = [];
          $http(stuObj).success(function(students){
            if(students.result && students.data){
              allStutents = angular.copy(students.data);
              $scope.studentData = students.data;
              tjParaObj.pieData = angular.copy(students.data);
              //考试组数据处理
              $scope.kszPubData['考试组平均分'] = parseFloat((Lazy(students.data).reduce(function(memo, stu){ //考试组平均分
                return memo + stu['实际评分'];
              }, 0)/ksz['已作答人数']).toFixed(1));
              $scope.kszPubData['及格率'] = parseFloat((Lazy(students.data).filter(function(xs){ //及格率
                return xs['实际评分'] >= $scope.tjParas.jgScore;
              }).size()/ksz['已作答人数'] * 100).toFixed(1));
              $scope.kszPubData['优秀率'] = parseFloat((Lazy(students.data).filter(function(xs){ //优秀率
                return xs['实际评分'] >= $scope.tjParas.yxScore;
              }).size()/ksz['已作答人数'] * 100).toFixed(1));
              //课序号整理
              var disByKeXuHao = Lazy(students.data).groupBy(function(stu){
                return stu['课序号名称'];
              }).toObject();
              var idxCount = 1; //给课序号加索引值
              var kxhArr = []; //最终课序号数组
              Lazy(disByKeXuHao).each(function(v, k, l){
                var kxhObj = {
                  '课序号名称': k,
                  '课序号ID': v[0]['课序号ID'],
                  '课序号学生': v,
                  '平均分': 0,
                  '索引': idxCount
                };
                var skrs = Lazy(v).reject(function(xs){return xs['实际评分'] == null;}).size() || 1;
                kxhObj['平均分'] = Lazy(v).reduce(function(memo, xs){ return memo + xs['实际评分']; }, 0)/skrs;
                kxhArr.push(kxhObj);
                idxCount ++;
              });
              kxhArr = Lazy(kxhArr).sortBy(function(stu){ return stu['课序号名称'];}).toArray();
              tjBarData = kxhArr;
              $scope.kszPubData['统计维度'] = kxhArr;
              $scope.tjKxh = kxhArr.slice(0, 5);
              $scope.tjParas.tjWdPgOn = 0;
              $scope.tjParas.tjWdPgLen = Math.ceil(kxhArr.length / 5);
              $scope.tjParas.lastSltKxh = {
                activeIdx: 0,
                kxhIdx: 0
              };
              //按分数分组统计数据，用在按分数和人数统计的折线图
              tjParaObj.lineDataAll = lineDataDealFun(allStutents);
              $scope.tjByKxh('all');
              //初始化统计表格容器
              tjParaObj.pieBoxAll = echarts.init(document.getElementById('chartPieAll'));
              tjParaObj.pieBoxKxh = echarts.init(document.getElementById('chartPieBj'));
              tjParaObj.barBox = echarts.init(document.getElementById('chartBar'));
              tjParaObj.lineBox = echarts.init(document.getElementById('chartLine'));
              tjParaObj.radarBox = echarts.init(document.getElementById('chartRadar'));
              tjParaObj.radarBoxZsd = echarts.init(document.getElementById('chartRadarZsd'));
            }
            else{
              DataService.alertInfFun('err', students.error);
            }
          });
          $scope.showKaoShengList = true;
          $scope.tj_tabActive = 'kaoshiTj';
          $scope.tjSubTpl = 'views/tongji/tj_ks_chart.html';
          console.log(ksz);
        }
        else{
          DataService.alertInfFun('pmt', '请选择考试组！');
        }
        //  $scope.isRenKeJiaoShi = false;
        //  $scope.singleData = '';
        //  $scope.selectKsz = ks;
        //  var isArr = isArray(ks); //判读传入的参数是否为数组
        //  var tjKaoShiZuIds = [];
        //  var needParam = {
        //    token: token,
        //    kaoshizuid: '',
        //    youxiufen: $scope.tjParas.yxScore || 85,
        //    jigefen: $scope.tjParas.jgScore || 60,
        //    zhishidianid: ''
        //  };
        //  var pObj = {
        //    token: token,
        //    caozuoyuan: caozuoyuan,
        //    kaoshizuid: ''
        //  };
        //  tjParaObj.radarDataZsd.zsdName = [];
        //  tjParaObj.radarDataZsd.zsdPerAll = [];
        //  tjParaObj.radarDataZsd.zsdPerBk = [];
        //  tjBarData = [];
        //  $scope.tjParas.sltWeiDu = '全部';
        //  $scope.tjParas.tongJiType = 'keXuHao';
        //  $scope.showKaoShengList = true;
        //  $scope.kszPubData.ksRenShu = 0;
        //  tjZsdOriginData = '';
        //  var getTjData = function(zsd){
        //    needParam.zhishidianid = Lazy(zsd).map(function(z){
        //      return z.ZHISHIDIAN_ID;
        //    }).join(',');
        //    $http({url: queryKaoShiZuTongJi, method:'GET', params: needParam}).success(function(data){
        //      if(!data.error){
        //        kaoShiZuTongJiOriginData = angular.copy(data);
        //        data.KEXUHAO = Lazy(data.KEXUHAO).reject(function(kxh){
        //          return !kxh.KEXUHAO_MINGCHENG
        //        }).toArray();
        //        Lazy(data.BANJI).each(function(bj){
        //          bj.JGLV = bj.JGLV ? Number((bj.JGLV*100).toFixed(1)) : 0;
        //          bj.YXLV = bj.YXLV ? Number((bj.YXLV*100).toFixed(1)) : 0;
        //          bj.PJF = bj.PJF ? Number((bj.PJF).toFixed(1)) : 0;
        //        });
        //        Lazy(data.KEXUHAO).each(function(kxh){
        //          kxh.JGLV = kxh.JGLV ? Number((kxh.JGLV*100).toFixed(1)) : 0;
        //          kxh.YXLV = kxh.YXLV ? Number((kxh.YXLV*100).toFixed(1)) : 0;
        //          kxh.PJF = kxh.PJF ? Number((kxh.PJF).toFixed(1)) : 0;
        //        });
        //        data.KAOSHIZU.JGLV = data.KAOSHIZU.JGLV ? Number((data.KAOSHIZU.JGLV*100).toFixed(1)) : 0;
        //        data.KAOSHIZU.YXLV = data.KAOSHIZU.YXLV ? Number((data.KAOSHIZU.YXLV*100).toFixed(1)) : 0;
        //        data.KAOSHIZU.PJF = data.KAOSHIZU.PJF ? Number((data.KAOSHIZU.PJF).toFixed(1)) : 0;
        //        var queryKsBj = queryKaoShengByBanji + needParam.kaoshizuid;
        //        $http.get(queryKsBj).success(function(students){
        //          if(students && students.length > 0){
        //            var skks = [];
        //            //判断命题教师
        //            var studentArray;
        //            var rkjsKxh;
        //            var jsArr = jueSeIds.JUESE;
        //            var contain4 = Lazy(jsArr).contains('4');
        //            var contain8 = Lazy(jsArr).contains('8');
        //            var contain11 =  Lazy(jsArr).contains('11');
        //            if(jsArr && !(contain4 || contain8) && contain11){
        //              studentArray = [];
        //              rkjsKxh = [];
        //              $scope.isRenKeJiaoShi = true;
        //              var disStu = Lazy(students).groupBy('KEXUHAO_ID').toObject();
        //              Lazy(jiaoShiKeXunHaoData).each(function(jsKxh){
        //                var thisKxhStu = disStu[jsKxh.KEXUHAO_ID];
        //                if(thisKxhStu && thisKxhStu.length > 0){
        //                  studentArray = Lazy(studentArray).union(thisKxhStu).toArray();
        //                }
        //                var findKxh = Lazy(data.KEXUHAO).find(function(kxh){
        //                  return kxh.KEXUHAO_ID == jsKxh.KEXUHAO_ID;
        //                });
        //                rkjsKxh.push(findKxh);
        //              });
        //              data.KEXUHAO = rkjsKxh;
        //            }
        //            else{
        //              studentArray = angular.copy(students);
        //            }
        //            Lazy(studentArray).each(function(xs){
        //              if(xs.ZUIHOU_PINGFEN !== null && xs.ZUIHOU_PINGFEN >= 0){
        //                skks.push(xs);
        //              }
        //              else{
        //                xs.ZUIHOU_PINGFEN = '无成绩';
        //              }
        //            });
        //            tjParaObj.pieData = data;
        //            allStutents = angular.copy(studentArray);
        //            $scope.studentData = studentArray;
        //            $scope.tjParas.allStudents = skks;
        //            $scope.kszPubData.ksAvgScore = data.KAOSHIZU.PJF;
        //            $scope.needToXgYxJgLv = true;
        //            $scope.switchTongJiType('keXuHao');
        //            /* 按分数分组统计数据，用在按分数和人数统计的折线图 */
        //            tjParaObj.lineDataAll = lineDataDealFun(studentArray);
        //          }
        //          else{
        //            $scope.studentData = '';
        //            $scope.tjParas.allStudents = '';
        //            $scope.needToXgYxJgLv = false;
        //            DataService.alertInfFun('err', students.error);
        //          }
        //        });
        //      }
        //      else{
        //        kaoShiZuTongJiOriginData = '';
        //        DataService.alertInfFun('err', data.error);
        //      }
        //    });
        //  };
        //  if(isArr){
        //    Lazy(ks).each(function(item, idx, lst){
        //      tjKaoShiZuIds.push(item.KAOSHIZU_ID); //考试组id
        //      $scope.kszPubData.ksname += item.KAOSHIZU_NAME + '；';
        //      $scope.kszPubData.ksRenShu += item.ZONGRENSHU;
        //    });
        //  }
        //  else{
        //    tjKaoShiZuIds.push(ks.KAOSHIZU_ID); //考试组id
        //    $scope.kszPubData.ksname = ks.KAOSHIZU_NAME;
        //    $scope.kszPubData.ksRenShu = ks.ZONGRENSHU;
        //    $scope.kszPubData.kaikaodate = ks.UPDATE_TIME;
        //  }
        //  if(tjKaoShiZuIds && tjKaoShiZuIds.length > 0){
        //    needParam.kaoshizuid = tjKaoShiZuIds.join(',');
        //  }
        //  else{
        //    DataService.alertInfFun('err', '请选择考试组！');
        //    return ;
        //  }
        //  pObj.kaoshizuid = ks.KAOSHIZU_ID;
        //  $http({method: 'GET', url: kaoShiZuZhiShiDianUrl, params: pObj}).success(function(zsddata1){
        //    if(zsddata1 && zsddata1.length > 0){
        //      var zsdParam = {
        //        token: token,
        //        caozuoyuan: caozuoyuan,
        //        kaoshizuid: needParam.kaoshizuid
        //      };
        //      tjZsdOriginData = zsddata1;
        //      $http({method: 'GET', url: getZhiShiDianScoreUrl, params: zsdParam}).success(function(data){
        //        if(data && data.length > 0){
        //          //知识点统计
        //          Lazy(zsddata1).each(function(tjzsd){
        //            var zsdNameObj = {text: tjzsd.ZHISHIDIANMINGCHENG, max: 100};
        //            tjParaObj.radarDataZsd.zsdName.push(zsdNameObj);
        //            tjParaObj.radarDataZsd.zsdPerBk.push(0);
        //            var findTar = Lazy(data).find(function(zsdObj){
        //              return zsdObj.zhishidian_id == tjzsd.ZHISHIDIAN_ID;
        //            });
        //            if(findTar){
        //              var zsdDeFenLv = findTar.defenlv ? (findTar.defenlv*100).toFixed(1) : 0;
        //              tjParaObj.radarDataZsd.zsdPerAll.push(zsdDeFenLv);
        //            }
        //          });
        //          getTjData(zsddata1);
        //        }
        //        else{
        //          DataService.alertInfFun('err', data.error);
        //        }
        //      });
        //    }
        //    else{
        //      if(zsddata1.error){
        //        DataService.alertInfFun('err', zsddata1.error);
        //      }
        //      else{
        //        $http({method: 'GET', url: kwKaoShiZuZhiShiDianUrl, params: pObj}).success(function(zsddata2){
        //          if(zsddata2 && zsddata2.length > 0){
        //            getTjData(zsddata2);
        //          }
        //          else{
        //            DataService.alertInfFun('err', zsddata2.error);
        //          }
        //        });
        //      }
        //    }
        //  });
        //  $scope.tj_tabActive = 'kaoshiTj';
        //  $scope.tjSubTpl = 'views/tongji/tj_ks_chart.html';
        };

        /**
        * 班级列表分页
        */
        $scope.kxhPage = function(direction){
          if(direction == 'down'){
            $scope.tjParas.tjWdPgOn ++;
            if($scope.tjParas.tjWdPgOn < $scope.tjParas.tjWdPgLen){
              $scope.tjKxh = $scope.kszPubData['统计维度'].slice($scope.tjParas.tjWdPgOn * 5, ($scope.tjParas.tjWdPgOn + 1) * 5);
            }
            else{
              $scope.tjParas.tjWdPgOn = $scope.tjParas.tjWdPgLen - 1;
            }
          }
          else{
            $scope.tjParas.tjWdPgOn --;
            if($scope.tjParas.tjWdPgOn >= 0){
              $scope.tjKxh = $scope.kszPubData['统计维度'].slice($scope.tjParas.tjWdPgOn * 5, ($scope.tjParas.tjWdPgOn + 1) * 5);
            }
            else{
              $scope.tjParas.tjWdPgOn = 0;
            }
          }
        };

        /**
        * 由统计详情返回列表
        */
        $scope.backToList = function(){
          if($scope.tj_tabActive == 'kaoshiTj'){ //考试统计的返回按钮
            $scope.showKszList();
          }
          if($scope.tj_tabActive == 'kaoshengTj'){ //考生统计的返回按钮
            $scope.showStuList();
          }
        };

        /**
        * 通过班级或者课序号统计
        */
        $scope.tjByKxh = function(kxh){
          var addActiveFun;
          $scope.singleData = {
            '平均分': 0,
            '实考人数': 0,
            '及格率': 0,
            '优秀率': 0
          };
          //var stuDis; //考试分数据
          ////var zsdParamObj = {uid: '', banji: '', kexuhao: ''};
          //var needParam = {
          //  token: token,
          //  caozuoyuan: caozuoyuan,
          //  kaoshizuid: '',
          //  uid: '',
          //  banji: '',
          //  kexuhao: ''
          //};
          tjParaObj.lineDataBK = '';
          //tjParaObj.radarDataZsd.zsdPerBk = [];
          $scope.tjParas.lastSltKxh = {
            activeIdx: $scope.tjParas.tjWdPgOn,
            kxhIdx: ''
          };
          if(kxh == 'all'){
            $scope.tjParas.sltWeiDu = '全部';
            $scope.tjParas.lastSltKxh.kxhIdx = 0;
            $scope.studentData = allStutents;
          //  var zsdLength = tjZsdOriginData.length;
          //  for(var i = 0; i < zsdLength; i++){
          //    tjParaObj.radarDataZsd.zsdPerBk.push(0);
          //  }
            //折线数据，单个班级
            addActiveFun = function(){
              tjParaObj.lineBox = echarts.init(document.getElementById('chartLine'));
              tjParaObj.pieBoxKxh = echarts.init(document.getElementById('chartPieBj'));
              chartShowFun('all');
            };
            $timeout(addActiveFun, 100);
          }
          else{
            $scope.tjParas.sltWeiDu = kxh['课序号名称'];
            $scope.tjParas.lastSltKxh.kxhIdx = kxh['索引'];
            $scope.studentData = angular.copy(kxh['课序号学生']);
            //饼状图数据处理
            $scope.singleData['实考人数'] = Lazy(kxh['课序号学生']).reject(function(xs){return xs['实际评分'] == null;}).size();
            var skrs = $scope.singleData['实考人数'] || 1;
            $scope.singleData['平均分'] = parseFloat((Lazy(kxh['课序号学生']).reduce(function(memo, stu){ //考试组平均分
              return memo + stu['实际评分'];
            }, 0)/skrs).toFixed(1));
            $scope.singleData['及格率'] = parseFloat((Lazy(kxh['课序号学生']).filter(function(xs){ //及格率
              return xs['实际评分'] >= $scope.tjParas.jgScore;
            }).size()/skrs * 100).toFixed(1));
            $scope.singleData['优秀率'] = parseFloat((Lazy(kxh['课序号学生']).filter(function(xs){ //优秀率
              return xs['实际评分'] >= $scope.tjParas.yxScore;
            }).size()/skrs * 100).toFixed(1));
          //  //折线图，班级数据
          //  if($scope.tjParas.tongJiType && $scope.tjParas.tongJiType == 'keXuHao'){
          //    stuDis = Lazy(allStutents).filter(function(st){
          //      return st.KEXUHAO_MINGCHENG == bj.'课序号名称';
          //    }).toArray();
          //    needParam.kexuhao = bj.['课序号学生'].KEXUHAO_ID;
          //  }
          //  else{
          //    stuDis = Lazy(allStutents).filter(function(st){
          //      return st.BANJI == bj.'课序号名称';
          //    }).toArray();
          //    needParam.banji = bj.['课序号学生'].BANJI;
          //  }
          //  if(stuDis && stuDis.length > 0){
          //    var dfStu = Lazy(stuDis).filter(function(xs){
          //      if(xs.ZUIHOU_PINGFEN >= 0){
          //        return xs.ZUIHOU_PINGFEN;
          //      }
          //    }).toArray();
          //    $scope.studentData = angular.copy(stuDis);
          //    tjParaObj.lineDataBK = lineDataDealFun(dfStu);
          //  }
          //  else{
          //    DataService.alertInfFun('err', '没有相应的数据！');
          //  }
          //  //知识点统计
          //  if($scope.selectKsz.KAOSHIZU_ID){
          //    needParam.kaoshizuid = $scope.selectKsz.KAOSHIZU_ID;
          //  }
          //  else{
          //    DataService.alertInfFun('pmt', '缺少考试组ID');
          //    return;
          //  }
          //  $http({method: 'GET', url: getZhiShiDianScoreUrl, params: needParam}).success(function(data){
          //    if(data && data.length > 0){
          //      //知识点统计
          //      Lazy(tjZsdOriginData).each(function(tjzsd){
          //        var findTar = Lazy(data).find(function(zsdObj){
          //          return zsdObj.zhishidian_id == tjzsd.ZHISHIDIAN_ID;
          //        });
          //        if(findTar){
          //          var zsdDeFenLv = findTar.defenlv ? (findTar.defenlv*100).toFixed(1) : 0;
          //          tjParaObj.radarDataZsd.zsdPerBk.push(zsdDeFenLv);
          //        }
          //      });
          //      //饼图数据
                addActiveFun = function(){
                  tjParaObj.lineBox = echarts.init(document.getElementById('chartLine'));
                  chartShowFun();
                };
                $timeout(addActiveFun, 100);
          //    }
          //    else{
          //      DataService.alertInfFun('err', data.error);
          //    }
          //  });
          }
        };

        /**
        * 数据排序
        */
        $scope.ksSortDataFun = function(sortItem){
          switch (sortItem){
            case 'stuId' : //学号排序
              if($scope.tjParas.stuIdCount){
                $scope.studentData = Lazy($scope.studentData).sortBy(function(stu){
                  return stu['学号'];
                }).toArray();
                $scope.tjParas.stuIdCount = false;
              }
              else{
                $scope.studentData = Lazy($scope.studentData).sortBy(function(stu){
                  return stu['学号'];
                }).toArray().reverse();
                $scope.tjParas.stuIdCount = true;
              }
              break;
            case 'name' : //姓名排序，中文
              if($scope.tjParas.nameCount){
                $scope.studentData.sort(function(a,b){
                  return a['姓名'].localeCompare(b['姓名']);
                });
                $scope.tjParas.nameCount = false;
              }
              else{
                $scope.studentData.sort(function(a,b){
                  return a['姓名'].localeCompare(b['姓名']);
                }).reverse();
                $scope.tjParas.nameCount = true;
              }
              break;
            case 'kxh' : //课序号名称
              if($scope.tjParas.kxhCount){
                $scope.studentData.sort(function(a,b){
                  return a['课序号名称'].localeCompare(b['课序号名称']);
                });
                $scope.tjParas.kxhCount = false;
              }
              else{
                $scope.studentData.sort(function(a,b){
                  return a['课序号名称'].localeCompare(b['课序号名称']);
                }).reverse();
                $scope.tjParas.kxhCount = true;
              }
              break;
            case 'xuhao' : //序号排序
              if($scope.tjParas.xuHaoCount){
                $scope.studentData = Lazy($scope.studentData).sortBy(function(stu){
                  return stu['序号'];
                }).toArray();
                $scope.tjParas.xuHaoCount = false;
              }
              else{
                $scope.studentData = Lazy($scope.studentData).sortBy(function(stu){
                  return stu['序号'];
                }).toArray().reverse();
                $scope.tjParas.xuHaoCount = true;
              }
              break;
            case 'score' : //分数排序
              if($scope.tjParas.scoreCount){
                $scope.studentData = Lazy($scope.studentData).sortBy(function(stu){
                  return stu['实际评分'];
                }).toArray();
                $scope.tjParas.scoreCount = false;
              }
              else{
                $scope.studentData = Lazy($scope.studentData).sortBy(function(stu){
                  return stu['实际评分'];
                }).toArray().reverse();
                $scope.tjParas.scoreCount = true;
              }
              break;
          }
        };


        ///**
        // * 显示更多试卷统计详情
        // */
        //$scope.showTjSjMoreDetail = function(){
        //  if($scope.tjTiMuDetail){
        //    $scope.tjTmQuantity = $scope.tjTiMuDetail.length; //加载是显示的题目数量
        //  }
        //};

        ///**
        // * 导出学生,需要的数据为考生列表
        // */
        //function submitFORMDownload(path, params, method) {
        //  method = method || "post";
        //  var form = document.createElement("form");
        //  form.setAttribute("id", 'formDownload');
        //  form.setAttribute("method", method);
        //  form.setAttribute("action", path);
        //  form._submit_function_ = form.submit;
        //  for(var key in params) {
        //    if(params.hasOwnProperty(key)) {
        //      var hiddenField = document.createElement("input");
        //      hiddenField.setAttribute("type", "hidden");
        //      hiddenField.setAttribute("name", key);
        //      hiddenField.setAttribute("value", params[key]);
        //      form.appendChild(hiddenField);
        //    }
        //  }
        //  document.body.appendChild(form);
        //  form._submit_function_();
        //}
        //$scope.exportKsInfo = function(stuData){
        //  var ksData = {};
        //  var ksArr = [];
        //  var exportStu;
        //  var exportStuInfoUrl;
        //  var sheetName = $scope.kszPubData.ksname + '考生信息';
        //  //ksArr.push({col1: '序号', col2: '学号', col3: '姓名', col4: '班级', col5: '课序号', col6: '成绩'});
        //  exportStu = Lazy(stuData).sortBy(function(stu){ return parseInt(stu.XUHAO);}).toArray();
        //  Lazy(exportStu).each(function(ks){
        //    var ksObj = {};
        //    ksObj['序号'] = ks.XUHAO;
        //    ksObj['学号'] = ks.YONGHUHAO;
        //    ksObj['姓名'] = ks.XINGMING;
        //    ksObj['班级'] = ks.BANJI;
        //    ksObj['课序号'] = ks.KEXUHAO;
        //    ksObj['成绩'] = ks.ZUIHOU_PINGFEN;
        //    ksArr.push(ksObj);
        //  });
        //  ksData[sheetName] = ksArr;
        //  exportStuInfoUrl = exportStuInfoBase + sheetName;
        //  var node = document.getElementById('formDownload');
        //  if(node){
        //    node.parentNode.removeChild(node);
        //  }
        //  submitFORMDownload(exportStuInfoUrl, {json: JSON.stringify(ksData)}, 'POST');
        //};
        //
        ///**
        // * 作答重现查询没道题目的得分率
        // */
        //var qryItemDeFenLv = function(ksId){
        //  var qryItemDeFenLvUrl = qryItemDeFenLvBase + ksId;
        //  itemDeFenLv = '';
        //  if(ksId){
        //    DataService.getData(qryItemDeFenLvUrl).then(function(data) {
        //      if(data && data.length > 0) {
        //        itemDeFenLv = data;
        //      }
        //    });
        //  }
        //  else{
        //    itemDeFenLv = '';
        //    DataService.alertInfFun('pmt', '缺少考试ID');
        //  }
        //};
        //
        ///**
        // * 作答重现
        // */
        //$scope.zuoDaReappear = function(ksd){
        //  var answerReappearUrl = answerReappearBaseUrl,
        //    dataDis, tmVal,
        //    finaData = {
        //      sj_name: '',
        //      sj_tm: []
        //    };
        //  if(ksd.UID){
        //    answerReappearUrl += '&kaoshengid=' + ksd.UID;
        //  }
        //  else{
        //    DataService.alertInfFun('pmt', '缺少考生UID');
        //    return;
        //  }
        //  if(ksd.KAOSHI_ID){
        //    answerReappearUrl += '&kaoshiid=' + ksd.KAOSHI_ID;
        //  }
        //  else{
        //    DataService.alertInfFun('pmt', '缺少考试ID');
        //    return;
        //  }
        //  DataService.getData(answerReappearUrl).then(function(data) {
        //    if(data && data.length > 0){
        //      finaData.sj_name = data[0].SHIJUAN_MINGCHENG;
        //      dataDis = Lazy(data).groupBy('DATI_XUHAO').toObject();
        //      Lazy(dataDis).each(function(val, key, list){
        //        var dObj = {
        //          tx_id: key,
        //          tx_name: val[0].DATIMINGCHENG,
        //          tm: ''
        //        };
        //        Lazy(val).each(function(tm, idx, lst){
        //          var findVal = Lazy(itemDeFenLv).find(function(item){return item.TIMU_ID == tm.TIMU_ID});
        //          if(findVal){
        //            tm.itemDeFenLv = (findVal.DEFENLV * 100).toFixed(1);
        //          }
        //          if(typeof(tm.TIGAN) == 'string'){
        //            tm.TIGAN = JSON.parse(tm.TIGAN);
        //          }
        //          DataService.formatDaAn(tm);
        //        });
        //        dObj.tm = val;
        //        finaData.sj_tm.push(dObj);
        //      });
        //      $scope.showKaoShengList = false;
        //      $scope.kaoShengShiJuan = finaData;
        //    }
        //  });
        //};
        //
        ///**
        // * 关闭作答重新内容
        // */
        //$scope.closeZuoDaReappear = function(){
        //  $scope.showKaoShengList = true;
        //};

        ///**
        // * 查询知识点统计的数据
        // */
        ////var tjGetZsdData = function(paramObj){
        ////  var needParam = {
        ////    token: token,
        ////    caozuoyuan: caozuoyuan,
        ////    kaoshizuid: '',
        ////    uid: '',
        ////    banji: '',
        ////    kexuhao: ''
        ////  };
        ////  if($scope.selectKsz.KAOSHIZU_ID){
        ////    needParam.kaoshizuid = $scope.selectKsz.KAOSHIZU_ID;
        ////  }
        ////  else{
        ////    DataService.alertInfFun('pmt', '缺少考试组ID');
        ////    return;
        ////  }
        ////  if(paramObj.uid){
        ////    needParam.uid = paramObj.uid;
        ////  }
        ////  if(paramObj.banji){
        ////    needParam.banji = paramObj.banji;
        ////  }
        ////  if(paramObj.kexuhao){
        ////    needParam.kexuhao = paramObj.kexuhao;
        ////  }
        ////  $http({method: 'GET', url: getZhiShiDianScoreUrl, params: needParam}).success(function(data){
        ////    if(data && data.length > 0){
        ////      //知识点统计
        ////      Lazy(tjZsdOriginData).each(function(tjzsd){
        ////        var findTar = Lazy(data).find(function(zsdObj){
        ////          return zsdObj.zhishidian_id == tjzsd.ZHISHIDIAN_ID;
        ////        });
        ////        if(findTar){
        ////          var zsdDeFenLv = findTar.defenlv ? (findTar.defenlv*100).toFixed(1) : 0;
        ////          tjParaObj.radarDataZsd.zsdPerBk.push(zsdDeFenLv);
        ////        }
        ////      });
        ////    }
        ////    else{
        ////      DataService.alertInfFun('err', data.error);
        ////    }
        ////  });
        ////};
        //
        ///**
        // * 由UID查询课序号
        // */
        //var jiaoShiKeXunHaoData = '';
        //var getJiaoShiKeXunHao = function(){
        //  var jsArr = jueSeIds.JUESE;
        //  var contain4 = Lazy(jsArr).contains('4');
        //  var contain8 = Lazy(jsArr).contains('8');
        //  var contain11 =  Lazy(jsArr).contains('11');
        //  if(jsArr && !(contain4 || contain8) && contain11){
        //    var jsObj = {
        //      token: token,
        //      uid: caozuoyuan
        //    };
        //    $http({method: 'GET', url: jiaoShiKeXunHaoUrl, params: jsObj}).success(function(jsKxh){
        //      if(jsKxh && jsKxh.length > 0){
        //        jiaoShiKeXunHaoData = jsKxh;
        //      }
        //      else{
        //        jiaoShiKeXunHaoData = '';
        //        DataService.alertInfFun('err', jsKxh.error);
        //      }
        //    });
        //  }
        //};
        //getJiaoShiKeXunHao();

        ///**
        // * 统计页面试卷多选，将试卷加入到数组
        // */
        //$scope.addKaoShiToTj = function(event, ks){
        //  var isChecked = $(event.target).prop('checked');
        //  if(isChecked){
        //    $scope.tjParas.selectedKaoShi.push(ks);
        //  }
        //  else{
        //    if($scope.tjParas.selectedKaoShi.length){
        //      $scope.tjParas.selectedKaoShi = Lazy($scope.tjParas.selectedKaoShi).reject(function(item){
        //        return item.KAOSHI_ID == ks.KAOSHI_ID;
        //      }).toArray();
        //    }
        //  }
        //};
        //
        ///**
        // * 班级列表分页
        // */
        //$scope.kxhPage = function(direction){
        //  if(direction == 'down'){
        //    $scope.tjParas.tjWdPgOn ++;
        //    if($scope.tjParas.tjWdPgOn < $scope.tjParas.tjWdPgLen){
        //      $scope.tjKxh = $scope.kszPubData['统计维度'].slice($scope.tjParas.tjWdPgOn * 5, ($scope.tjParas.tjWdPgOn + 1) * 5);
        //    }
        //    else{
        //      $scope.tjParas.tjWdPgOn = $scope.tjParas.tjWdPgLen - 1;
        //    }
        //  }
        //  else{
        //    $scope.tjParas.tjWdPgOn --;
        //    if($scope.tjParas.tjWdPgOn >= 0){
        //      $scope.tjKxh = $scope.kszPubData['统计维度'].slice($scope.tjParas.tjWdPgOn * 5, ($scope.tjParas.tjWdPgOn + 1) * 5);
        //    }
        //    else{
        //      $scope.tjParas.tjWdPgOn = 0;
        //    }
        //  }
        //};


        ///**
        // * 查询考试通过考生UID
        // */
        //$scope.qryKaoShiByXueHao = function(){
        //  if($scope.tjParas.studentUid){
        //    var qryKaoShiByXueHaoUrl = qryKaoShiByXueHaoBase + $scope.tjParas.studentUid;
        //    DataService.getData(qryKaoShiByXueHaoUrl).then(function(data) {
        //      if(data && data.length > 0){
        //        $scope.tjKaoShiData = data;
        //        $scope.studentData = '';
        //        $scope.showKaoShengList = true;
        //        $scope.tjSubTpl = 'views/tongji/tj_stud_detail.html';
        //      }
        //    });
        //  }
        //};
        //
        ///**
        // * 由考试查询考生
        // */
        //$scope.qryKaoSheng = function(id){
        //  if(id){
        //    var qryKaoShengUrl = queryKaoShengBase + '&kaoshiid=' + id;
        //    $scope.tjParas.zdcxKaoShiId = id;
        //    DataService.getData(qryKaoShengUrl).then(function(data) {
        //      if(data && data.length > 0) {
        //        $scope.studentData = data;
        //        $scope.tjKaoShiData = '';
        //        $scope.showKaoShengList = true;
        //        qryItemDeFenLv(id);
        //        $scope.tjSubTpl = 'views/tongji/tj_stud_detail.html';
        //      }
        //    });
        //  }
        //  else{
        //    DataService.alertInfFun('pmt', '缺少考试ID');
        //  }
        //};
        //
        ///**
        // * 修改本次考试组的优秀率和及格率
        // */
        //$scope.changYouXiuJiGeLv = function(){
        //  $scope.needToXgYxJgLv = false;
        //};

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
          MathJax.Hub.Queue(["Typeset", MathJax.Hub, "answerReappearShiJuan"]);
          MathJax.Hub.Queue(["Typeset", MathJax.Hub, "testList1"]);
        });

    }]);
});
