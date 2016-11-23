define(['angular', 'config', 'charts', 'jquery', 'lazy'],
  function (angular, config, charts, $, lazy) {
    'use strict';
    angular.module('zhifzApp.controllers.TongjiCtrl', [])
      .controller('TongjiCtrl', ['$rootScope', '$scope', '$http', '$timeout', 'DataService', '$location', '$cookieStore',
        'urlRedirect',
        function ($rootScope, $scope, $http, $timeout, DataService, $location, $cookieStore, urlRedirect) {

          /**
           * 声明变量
           */
          var loginUsr = JSON.parse($cookieStore.get('ckUsr'));
          var jgID = loginUsr['学校ID']; //登录用户学校
          var logUid = loginUsr['UID']; //登录用户的UID
          var dftKm = JSON.parse($cookieStore.get('ckKeMu')); //默认选择的科目
          var jsArr = JSON.parse($cookieStore.get('ckJs')) || []; //登录用户的角色数组
          var keMuId = dftKm['科目ID']; //默认的科目ID
          var kaoShiZuUrl = '/kaoshizu'; //考试组
          var kaoShengChengJiUrl = '/kaosheng_chengji'; //查询考生成绩
          var kaoShengZhiShiDianDeFenLvUrl = '/kaosheng_zhishidian_defenlv'; //查询考生知识点得分率
          var kaoShiZuTiMuDeFenLvUrl = '/kaoshizu_timu_defenlv'; //查询考试组题目得分率
          var tiMuUrl = '/timu'; //题目的URL
          var kaoShengZuoDaUrl = '/kaosheng_zuoda'; //考生作答的接口
          var exportStuUrl = '/json2excel'; //导出考生
          var jiaoShiKeXuHaoUrl = '/jiaoshi_kexuhao'; //查询教师课序号
          var kaoShengKaoShiUrl = '/kaosheng_kaoshi'; //查询考生考试
          var yongHuUrl = '/yonghu'; //查询用户
          var itemNumPerPage = 10; //每页多少条数据
          var paginationLength = 11; //分页部分，页码的长度，目前设定为11
          var kaoShiZuStore = ''; //存放考试组的变量
          var allStutents = ''; //统计所有考生数据
          var tjBarData = []; //柱状图数据
          var tjZsdOriginData = []; //存放知识点原始数据的
          var zsdDeFenLvArr = []; //知识点得分率的数组
          var tiMuDeFenLvArr = []; //存放题目得分率原始数据
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
            jgScore: 60,
            sltKszZsd: '', //选择的考试组知识点
            sltKxhPjf: '', //选中的课序号平均分
            sltKxhName: '', //选中的课序号名称
            letterArr: config.letterArr, //题支的序号
            cnNumArr: config.cnNumArr, //汉语的大写数字
            sltTmId: '', //题目修改选中的题目ID
            studentUid: '' //学生作答时重现时输入的学号
          };
          $scope.tiMuDeFenLv = []; //存放题目得分率
          $scope.jiaoShiKxh = []; //登录到教师课序号
          $scope.tiXingArr = config.tiXingArr; //题型名称数组
          $scope.letterArr = config.letterArr; //题支的序号
          var tjParaObj = { //存放统计参数的Object
            barBox: '',
            radarBox: '',
            radarBoxZsd: '',
            radarDataZsd: {
              zsdName: [],
              zsdPerAll: [],
              zsdPerKxh: []
            }
          };

          /**
           * 判断登录用户角色
           */
          var kmfzrQx = Lazy(jsArr).contains(2); //判断科目负责人
          var rkjsQx = Lazy(jsArr).contains(3); //判断任课教师
          var qryJsKxh = function(){
            var obj = {
              method: 'GET',
              url: jiaoShiKeXuHaoUrl,
              params: {
                UID: logUid
              }
            };
            $scope.jiaoShiKxh = [];
            $http(obj).success(function(data){
              if(data.result && data.data){
                $scope.jiaoShiKxh = data.data;
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
            });
          };
          if(!kmfzrQx && rkjsQx){
            qryJsKxh();
          }

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
            var optRadarZsd = {
              tooltip : {
                trigger: 'axis'
              },
              legend: {
                orient : 'vertical',
                x : 'right',
                y : 'bottom',
                data:['整体','班级']
              },
              polar : [
                {
                  indicator : tjParaObj.radarDataZsd.zsdName
                }
              ],
              calculable : true,
              series : [
                {
                  name: '整体对比',
                  type: 'radar',
                  data : [
                    {
                      value : tjParaObj.radarDataZsd.zsdPerAll,
                      name : '整体'
                    },
                    {
                      value : tjParaObj.radarDataZsd.zsdPerKxh,
                      name : '班级'
                    }
                  ]
                }
              ]
            };
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
            tjParaObj.radarBoxZsd.setOption(optRadarZsd);
            if(optBar.series[0].data.length > 0){
              tjParaObj.barBox.setOption(optBar);
            }
            $scope.loadingImgShow = false;
            $timeout(function (){
              window.onresize = function () {
                tjParaObj.barBox.resize();
                tjParaObj.radarBoxZsd.resize();
              }
            }, 200);
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
            var ztArr = [6];
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
            $scope.showKaoShengList = true;
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
              $scope.loadingImgShow = true;
              $scope.showKaoShengList = false;
              $scope.showTiMuDetailWrap = true;
              tiMuDeFenLvArr = [];
              $scope.kszPubData = {
                '考试组名称': ksz['考试组名称'],
                '考试组平均分': 0,
                '已作答人数': ksz['已作答人数'],
                '总人数': ksz['总人数'],
                '开考时间': '',
                '统计维度': [],
                '课序号摘要': ''
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
              tjParaObj.radarDataZsd.zsdPerKxh = [];
              tjBarData = [];
              tjZsdOriginData = [];
              zsdDeFenLvArr = [];
              $http(stuObj).success(function(students){
                if(students.result && students.data){
                  students.data = Lazy(students.data).sortBy('序号').toArray();
                  allStutents = angular.copy(students.data);
                  $scope.studentData = students.data;
                  //考试组数据处理
                  $scope.kszPubData['考试组平均分'] = parseFloat((Lazy(students.data).reduce(function(memo, stu){ //考试组平均分
                    return memo + stu['实际评分'];
                  }, 0)/ksz['已作答人数']).toFixed(1));
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
                    kxhObj['平均分'] = parseFloat((Lazy(v).reduce(function(memo, xs){ return memo + xs['实际评分']; }, 0)/skrs).toFixed(1));
                    kxhArr.push(kxhObj);
                    idxCount ++;
                  });
                  kxhArr = DataService.cnSort(kxhArr, '课序号名称');
                  var rkjsKxhArr = [];
                  var newKxhArr = [];
                  if(!kmfzrQx && rkjsQx){
                    var newStuData = [];
                    Lazy(kxhArr).each(function(kxh){
                      var fnTar = Lazy($scope.jiaoShiKxh).find(function(jsKxh){
                        return jsKxh['课序号ID'] == kxh['课序号ID'];
                      });
                      if(fnTar){
                        newStuData = Lazy(newStuData).union(kxh['课序号学生']).toArray();
                        rkjsKxhArr.push(kxh);
                      }
                    });
                    newKxhArr = rkjsKxhArr;
                    allStutents = angular.copy(newStuData);
                    $scope.studentData = newStuData;
                  }
                  else{
                    newKxhArr = kxhArr;
                  }
                  tjBarData = newKxhArr;
                  $scope.kszPubData['统计维度'] = newKxhArr;
                  $scope.tjKxh = newKxhArr.slice(0, 5);
                  $scope.tjParas.tjWdPgOn = 0;
                  $scope.tjParas.tjWdPgLen = Math.ceil((newKxhArr.length || 0) / 5);
                  $scope.tjParas.lastSltKxh = {
                    activeIdx: 0,
                    kxhIdx: 0
                  };
                  //知识点的统计
                  var zsdObj = {
                    method: 'GET',
                    url: kaoShengZhiShiDianDeFenLvUrl,
                    params: {
                      '考试组ID': ksz['考试组ID']
                    }
                  };
                  var kszZsd = '';
                  $scope.tjParas.sltKszZsd = '';
                  if(ksz['考试组设置'] && ksz['考试组设置']['考试组知识点'] && ksz['考试组设置']['考试组知识点']['知识点ID'].length > 0){
                    kszZsd = ksz['考试组设置']['考试组知识点']['知识点ID'];
                    $scope.tjParas.sltKszZsd = kszZsd;
                  }
                  $http(zsdObj).success(function(zsds){
                    if(zsds.result && zsds.data){
                      tjZsdOriginData = angular.copy(zsds.data);
                      var distZsd = Lazy(zsds.data).groupBy('知识点ID').toObject();
                      Lazy(distZsd).each(function(v, k, l){
                        var zsdTmp = {
                          '知识点ID': k,
                          '知识点名称': v[0]['知识点名称'],
                          '得分率': ''
                        };
                        var zfz = Lazy(v).reduce(function(memo, zsd){ return memo + zsd['总分值']; }, 0) || 1;
                        var zdf = Lazy(v).reduce(function(memo, zsd){ return memo + zsd['总得分']; }, 0);
                        zsdTmp['得分率'] = parseFloat((zdf/zfz * 100).toFixed(1));
                        zsdDeFenLvArr.push(zsdTmp);
                      });
                      if(zsdDeFenLvArr && zsdDeFenLvArr.length > 0){
                        if(kszZsd && kszZsd.length > 0){
                          Lazy(kszZsd).each(function(item){
                            var findTar = Lazy(zsdDeFenLvArr).find(function(zsdObj){
                              return zsdObj['知识点ID'] == item;
                            });
                            if(findTar){
                              var zsdNameObj = {text: findTar['知识点名称'], max: 100};
                              var zsdDeFenLv = findTar['得分率'] ? findTar['得分率'] : 0;
                              tjParaObj.radarDataZsd.zsdName.push(zsdNameObj);
                              tjParaObj.radarDataZsd.zsdPerAll.push(zsdDeFenLv);
                              tjParaObj.radarDataZsd.zsdPerKxh.push(0);
                            }
                          });
                        }
                        else{
                          Lazy(zsdDeFenLvArr).each(function(zsd){
                            var zsdNameObj = {text: zsd['知识点名称'], max: 100};
                            tjParaObj.radarDataZsd.zsdName.push(zsdNameObj);
                            tjParaObj.radarDataZsd.zsdPerAll.push(zsd['得分率']);
                            tjParaObj.radarDataZsd.zsdPerKxh.push(0);
                          });
                        }
                      }
                      else{
                        DataService.alertInfFun('err', '没有知识点数据！');
                      }
                    }
                    else{
                      DataService.alertInfFun('err', zsds.error);
                    }
                    //具体数据展示
                    $scope.tjByKxh('all');
                    //初始化统计表格容器
                    tjParaObj.barBox = echarts.init(document.getElementById('chartBar'));
                    tjParaObj.radarBoxZsd = echarts.init(document.getElementById('chartRadarZsd'));
                  });
                  //题目得分率
                  var tmObj = {
                    method: 'GET',
                    url: kaoShiZuTiMuDeFenLvUrl,
                    params: {
                      '考试组ID': ksz['考试组ID']
                    }
                  };
                  $http(tmObj).success(function(tiMu){
                    if(tiMu.result && tiMu.data){
                      Lazy(tiMu.data).each(function(tm){
                        tm['得分率'] = parseFloat((tm['得分率'] * 100).toFixed(1));
                      });
                      tiMuDeFenLvArr = Lazy(tiMu.data).sortBy('得分率').toArray();
                      $scope.tiMuDeFenLv = tiMuDeFenLvArr.slice(0, 11);
                    }
                    else{
                      DataService.alertInfFun('err', tiMu.error);
                    }
                  });
                }
                else{
                  DataService.alertInfFun('err', students.error);
                }
              });
              $scope.showKaoShengList = true;
              $scope.tj_tabActive = 'kaoshiTj';
              $scope.tjSubTpl = 'views/tongji/tj_ks_chart.html';
            }
            else{
              $scope.loadingImgShow = false;
              DataService.alertInfFun('pmt', '请选择考试组！');
            }
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
            tjParaObj.radarDataZsd.zsdPerKxh = [];
            $scope.tjParas.lastSltKxh = {
              activeIdx: $scope.tjParas.tjWdPgOn,
              kxhIdx: ''
            };
            if(kxh == 'all'){
              $scope.tjParas.sltWeiDu = '全部';
              $scope.tjParas.lastSltKxh.kxhIdx = 0;
              $scope.studentData = allStutents;
              $scope.tjParas.sltKxhPjf = $scope.kszPubData['考试组平均分'];
              $scope.tjParas.sltKxhName = $scope.kszPubData['考试组名称'];
              var zsdLength = '';
              if($scope.tjParas.sltKszZsd && $scope.tjParas.sltKszZsd.length > 0){
                zsdLength = $scope.tjParas.sltKszZsd.length;
              }
              else{
                zsdLength = zsdDeFenLvArr.length || 0;
              }
              for(var i = 0; i < zsdLength; i++){
                tjParaObj.radarDataZsd.zsdPerKxh.push(0);
              }
              //折线数据，单个班级
              addActiveFun = function(){
                chartShowFun('all');
              };
              $timeout(addActiveFun, 100);
            }
            else{
              $scope.tjParas.sltWeiDu = kxh['课序号名称'];
              $scope.tjParas.lastSltKxh.kxhIdx = kxh['索引'];
              $scope.studentData = angular.copy(kxh['课序号学生']);
              $scope.tjParas.sltKxhPjf = kxh['平均分'];
              $scope.tjParas.sltKxhName = kxh['课序号名称'];
              //知识点数据整理
              var distZsd = Lazy(tjZsdOriginData).filter(function(zsd){
                return zsd['课序号ID'] == kxh['课序号ID'];
              }).groupBy('知识点ID').toObject();
              var kxhZsdDeFenLvArr = [];
              Lazy(distZsd).each(function(v, k, l){
                var zsdTmp = {
                  '知识点ID': k,
                  '知识点名称': v[0]['知识点名称'],
                  '得分率': ''
                };
                var zfz = Lazy(v).reduce(function(memo, zsd){ return memo + zsd['总分值']; }, 0) || 1;
                var zdf = Lazy(v).reduce(function(memo, zsd){ return memo + zsd['总得分']; }, 0);
                zsdTmp['得分率'] = parseFloat((zdf/zfz * 100).toFixed(1));
                kxhZsdDeFenLvArr.push(zsdTmp);
              });
              if($scope.tjParas.sltKszZsd && $scope.tjParas.sltKszZsd.length > 0){
                Lazy($scope.tjParas.sltKszZsd).each(function(item){
                  var findTar = Lazy(kxhZsdDeFenLvArr).find(function(zsdObj){
                    return zsdObj['知识点ID'] == item;
                  });
                  if(findTar){
                    tjParaObj.radarDataZsd.zsdPerKxh.push(findTar['得分率']);
                  }
                });
              }
              else{
                Lazy(zsdDeFenLvArr).each(function(item){
                  var findTar = Lazy(kxhZsdDeFenLvArr).find(function(zsdObj){
                    return zsdObj['知识点ID'] == item['知识点ID'];
                  });
                  if(findTar){
                    tjParaObj.radarDataZsd.zsdPerKxh.push(findTar['得分率']);
                  }
                });
              }
              //点击单个考序号重现组装数据
              addActiveFun = function(){
                chartShowFun();
              };
              $timeout(addActiveFun, 100);
            }
          };

          /**
           * 数据排序
           */
          $scope.ksSortDataFun = function(sortItem){
            switch (sortItem){
              case 'stuId' : //学号排序
                if($scope.tjParas.stuIdCount){
                  //$scope.studentData = Lazy($scope.studentData).sortBy(function(stu){
                  //  return stu['学号'];
                  //}).toArray();
                  $scope.studentData = DataService.cnSort($scope.studentData, '学号');
                  $scope.tjParas.stuIdCount = false;
                }
                else{
                  $scope.studentData = DataService.cnSort($scope.studentData, '学号').reverse();
                  $scope.tjParas.stuIdCount = true;
                }
                break;
              case 'name' : //姓名排序，中文
                if($scope.tjParas.nameCount){
                  $scope.studentData = DataService.cnSort($scope.studentData, '姓名');
                  $scope.tjParas.nameCount = false;
                }
                else{
                  $scope.studentData = DataService.cnSort($scope.studentData, '姓名').reverse();
                  $scope.tjParas.nameCount = true;
                }
                break;
              case 'kxh' : //课序号名称
                if($scope.tjParas.kxhCount){
                  $scope.studentData = DataService.cnSort($scope.studentData, '课序号名称');
                  $scope.tjParas.kxhCount = false;
                }
                else{
                  $scope.studentData = DataService.cnSort($scope.studentData, '课序号名称').reverse();
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

          /**
           * 导出学生,需要的数据为考生列表
           */
          function submitFORMDownload(path, params, method) {
            method = method || 'post';
            var form = document.createElement('form');
            form.setAttribute('id', 'formDownload');
            form.setAttribute('method', method);
            form.setAttribute('action', path);
            form._submit_function_ = form.submit;
            for(var key in params) {
              if(params.hasOwnProperty(key)) {
                var hiddenField = document.createElement('input');
                hiddenField.setAttribute('type', 'hidden');
                hiddenField.setAttribute('name', key);
                hiddenField.setAttribute('value', params[key]);
                form.appendChild(hiddenField);
              }
            }
            document.body.appendChild(form);
            form._submit_function_();
            var node = document.getElementById('formDownload');
            node.parentNode.removeChild(node);
          }
          $scope.exportKsInfo = function(data){
            var ksData = {};
            var sheetName = $scope.tjParas.sltKxhName || '学生名单';
            var ksArr = [];
            var exportStu = Lazy(data).sortBy(function(stu){ return parseInt(stu['序号']);}).toArray();
            var node = document.getElementById('formDownload');
            if(node){
              node.parentNode.removeChild(node);
            }
            Lazy(exportStu).each(function(ks){
              var ksObj = {};
              ksObj['序号'] = ks['序号'] + 1;
              ksObj['学号'] = ks['学号'];
              ksObj['姓名'] = ks['姓名'];
              ksObj['成绩'] = ks['实际评分'];
              ksObj['课序号'] = ks['课序号名称'];
              ksObj['班级'] = ks['班级名称'];
              ksObj['考试ID'] = ks['考试ID'];
              ksObj['试卷ID'] = ks['试卷ID'];
              ksArr.push(ksObj);
            });
            ksData[sheetName] = ksArr;
            submitFORMDownload(exportStuUrl, {json: JSON.stringify(ksData)}, 'post');
          };

          /**
           * 作答重现
           */
          $scope.zuoDaReappear = function(ks){
            var obj = {
              method: 'GET',
              url: kaoShengZuoDaUrl,
              params: {
                '考试组ID': ks['考试组ID'],
                'UID': ks['UID']
              }
            };
            var finaData = {
              sj_name: '',
              sj_tm: []
            };
            $scope.kaoShengShiJuan = '';
            $scope.showKaoShengList = true;
            $http(obj).success(function(data){
              if(data.result && data.data){
                finaData.sj_name = data.data['试卷组名称'];
                Lazy(data.data['试卷题目']).each(function(dt){
                  Lazy(dt['题目']).each(function(tm){
                    var findTar = Lazy(tiMuDeFenLvArr).find(function(dfl){
                      return dfl['题目ID'] == tm['题目ID'];
                    });
                    tm['得分率'] = findTar ? findTar['得分率'] : 0;
                    tm = DataService.formatDaAn(tm);
                  });
                });
                finaData.sj_tm = data.data['试卷题目'];
                $scope.kaoShengShiJuan = finaData;
                $scope.showKaoShengList = false;
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
            });
          };

          /**
           * 关闭作答重新内容
           */
          $scope.closeZuoDaReappear = function(){
            $scope.showKaoShengList = true;
            $scope.showTiMuDetailWrap = true;
            $scope.timuDetails = '';
            $scope.tjParas.sltTmId = '';
          };

          /**
           * 查询题目
           */
          $scope.showTiMuDetail = function(tmId){
            var obj = {
              method: 'GET',
              url: tiMuUrl,
              params: {
                '返回题目内容': true,
                '题目ID': tmId
              }
            };
            $scope.tjParas.sltTmId = '';
            $http(obj).success(function(data){ //查询题目详情
              if(data.result && data.data){
                Lazy(data.data).each(function(tm, idx, lst){
                  tm = DataService.formatDaAn(tm);
                });
                $scope.tjParas.sltTmId = tmId;
                $scope.timuDetails = data.data;
                $scope.showTiMuDetailWrap = false;
              }
              else{
                $scope.timuDetails = '';
                DataService.alertInfFun('err', data.error);
              }
            });
          };

          /**
           * 修改题目
           */
          $scope.editItem = function(){
            var currentPath = $location.$$path;
            if($scope.tjParas.sltTmId){
              var goUrl = '/mingti/' + $scope.tjParas.sltTmId;
              urlRedirect.goTo(currentPath, goUrl);
            }

          };

          /**
          * 查询考试通过考生UID
          */
          $scope.qryKaoShiByXueHao = function(){
            var yhObj = {
              method: 'GET',
              url: yongHuUrl,
              params: {
                '学校ID': jgID,
                '学号': ''
              }
            };
            if($scope.tjParas.studentUid){
              yhObj.params['学号'] = $scope.tjParas.studentUid;
              $http(yhObj).success(function(user){
                if(user.result && user.data){
                  var ksObj = {
                    method: 'GET',
                    url: kaoShengKaoShiUrl,
                    params: {
                      'UID': user.data[0]['UID'],
                      '状态': 5
                    }
                  };
                  $http(ksObj).success(function(exam){
                    if(exam.result && exam.data){
                      $scope.tjKaoShiData = exam.data;
                    }
                    else{
                      $scope.tjKaoShiData = '';
                      DataService.alertInfFun('err', exam.error);
                    }
                  });
                }
                else{
                  $scope.tjKaoShiData = '';
                  DataService.alertInfFun('err', user.error);
                }
              });
            }
            else{
              DataService.alertInfFun('pmt', '缺少学号！');
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
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, "answerReappearShiJuan"]);
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, "testList"]);
          });

        }]);
  });
