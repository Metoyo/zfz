define(['angular', 'config', 'jquery', 'lazy', 'polyv'], function (angular, config, $, lazy, polyv) {
  'use strict';

  angular.module('zhifzApp.controllers.StudentCtrl', [])
    .controller('StudentCtrl', ['$rootScope', '$scope', '$location', '$http', 'DataService', '$timeout', '$cookieStore',
      function ($rootScope, $scope, $location, $http, DataService, $timeout, $cookieStore) {

        /**
         * 声明变量
         */
        var loginUsr = JSON.parse($cookieStore.get('ckUsr'));
        var jgID = loginUsr['学校ID']; //登录用户学校
        var logUid = loginUsr['UID']; //登录用户的UID
        var kaoShengKaoShiUrl = '/kaosheng_kaoshi'; //查询考生考试
        var kaoShiZuUrl = '/kaoshizu'; //考试组
        var zaiXianBaoMingUrl = '/zaixian_baoming'; //在线报名
        var kaoShengChengJiUrl = '/kaosheng_chengji'; //查询考生成绩
        var xueXiaoUrl = '/xuexiao'; //机构的增删改查
        var kaoShengZhiShiDianDeFenLvUrl = '/kaosheng_zhishidian_defenlv'; //查询考生知识点得分率
        var tjParaObj = { //存放统计参数的Object
          radarBoxZsd: '',
          radarDataZsd: {
            zsdName: [],
            zsdPerAll: [],
            zsdPerSf: []
          }
        };
        //$scope.bmKaoChang = '';
        $scope.stuParams = {
          bmKszArr: [],
          //selectKaoDian: '',
          //hasBaoMing: true,
          //letterArr: config.letterArr, //题支的序号
          //cnNumArr: config.cnNumArr, //汉语的大写数字
          //noData: '', //没有数据的显示
          zsdTjShow: false //是否显示考生的知识点
        };
        $scope.kaoShiArrs = '';
        //$scope.kaoShiDetail = '';
        //$scope.showStuSelectInfo = false;
        $scope.showKaoShengList = true;
        //
        var currentPath = $location.$$path;

        /**
        * 查询考生有几场考试
        */
        var chaXunBaoMingChangCi = function(){
          var obj = {
            method: 'GET',
            url: kaoShengKaoShiUrl,
            params: {
              'UID': logUid
            }
          };
          $scope.kaoShiArrs = [];
          $scope.kaoShiChangCiDetail = false;
          $scope.stuParams.bmKszArr = [];
          $http(obj).success(function (data) {
            if(data.result && data.data) {
              var kszId = Lazy(data.data).reverse().map('考试组ID').toArray();
              var kzsObj = {
                method: 'GET',
                url: kaoShiZuUrl,
                params: {
                  '考试组ID': '',
                  '返回考试': true
                }
              };
              if(kszId && kszId.length > 0){
                kzsObj.params['考试组ID'] = JSON.stringify(kszId);
                $http(kzsObj).success(function (kszs) {
                  if(kszs.result && kszs.data) {
                    Lazy(kszs.data).each(function(ksz){
                      if(ksz['状态'] <= 2){
                        var bmStar = new Date(ksz['报名开始时间']);
                        var bmEnd = new Date(ksz['报名截止时间']);
                        var now = new Date();
                        //var difMinutes = bmStar.getTimezoneOffset(); //与本地相差的分钟数
                        //var sDifMS = bmStar.valueOf() - difMinutes * 60 * 1000; //报名开始与本地相差的毫秒数
                        //var eDifMS = bmEnd.valueOf() - difMinutes * 60 * 1000; //报名结束与本地相差的毫秒数
                        var sDifMS = bmStar.valueOf(); //报名开始与本地相差的毫秒数
                        var eDifMS = bmEnd.valueOf(); //报名结束与本地相差的毫秒数
                        var nMS = now.valueOf(); //本地时间
                        if(nMS >= sDifMS && nMS <= eDifMS){
                          ksz.baoMingStart = (nMS >= sDifMS && nMS <= eDifMS);
                          $scope.stuParams.bmKszArr.push(ksz);
                          var fidTar = Lazy(data.data).find(function(ks){ return ks['考试组ID'] == ksz['考试组ID']});
                          if(fidTar){
                            $scope.kaoShiArrs.push(fidTar);
                          }
                        }
                      }
                    });
                  }
                  else{
                    DataService.alertInfFun('err', data.error);
                  }
                });
              }
              else{
                DataService.alertInfFun('pmt', '目前没有需要报名的考试！');
              }
            }
            if(data.error){
              $scope.kaoShiArrs = '';
              DataService.alertInfFun('err', data.error);
            }
          });
        };

        /**
         * 查询考试通过考生UID
         */
        var qryKaoShiByUid = function () {
          var stuObj = {
            method: 'GET',
            url: kaoShengChengJiUrl,
            params: {
              'UID': logUid
            }
          };
          var power = '';
          $http(stuObj).success(function(students) {
            if (students.result && students.data) {
              var xxObj = {
                method: 'GET',
                url: xueXiaoUrl,
                params: {
                  '学校ID': jgID
                }
              };
              $http(xxObj).success(function(school){
                if(school.result && school.data){
                  var xxSet = school.data[0]['学校设置'];
                  if(xxSet && xxSet['成绩和作答']){
                    power = xxSet['成绩和作答'];
                  }
                  Lazy(students.data).each(function(stu){
                    stu.score = 'off';
                    stu.zuoda = 'off';
                    if(power){
                      var fndTar = power[stu['科目ID']];
                      if(fndTar){
                        stu.score = fndTar['考试成绩'];
                        stu.zuoda = fndTar['studentZsdFenXi'];
                      }
                    }
                  });
                }
                else{
                  DataService.alertInfFun('err', school.error);
                }
                $scope.kszScoreData = Lazy(students.data).reverse().toArray();
                $scope.showKaoShengList = true;
              });
            }
            else{
              DataService.alertInfFun('err', students.error);
            }
          });
        };

        /**
         * 当为微录课是加载视频列表
         */
        var loadVideoList = function(){
          //$scope.videoData = '';
          //$scope.videoData = config.videos;
          //var lastVideoPage = '';
          //var videoLen = '';
          //$scope.videoLastPage = '';
          //$scope.showVideodeoaPlay = false;
          //videoPageArr = [];
          //$scope.selectVideo = '';
          //var getVideoUrl = 'http://v.yunjiaoshou.com:4280/wlk/videos/' + caozuoyuan;
          //$http.get(getVideoUrl).success(function(data){
          //  if(data && data.length > 0){
          //    originVideoData = data;
          //    videoLen = data.length;
          //    lastVideoPage = Math.ceil(videoLen/itemsPerPage);
          //    $scope.videoLastPage = lastVideoPage;
          //    for(var i = 1; i <= lastVideoPage; i ++){
          //      videoPageArr.push(i);
          //    }
          //    if(videoLen <= 8){
          //      $scope.videoData = data;
          //    }
          //    else{
          //      $scope.videoDistFun(1);
          //    }
          //  }
          //  else{
          //    originVideoData = '';
          //    DataService.alertInfFun('err', data.error);
          //  }
          //});
        };

        /**
         * 判断是报名还是成绩
         */
        switch (currentPath) {
          case '/baoming':
            chaXunBaoMingChangCi();
            break;
          case '/chengji':
            qryKaoShiByUid();
            break;
          case '/weiluke':
            loadVideoList();
            break;
        }

        /**
        * 查看考试组详情
        */
        $scope.queryKaoShiZuDetail = function(ks){
          $scope.selectKsz = Lazy($scope.stuParams.bmKszArr).find(function(ksz){ return ksz['考试组ID'] == ks['考试组ID']}) || '';
          if($scope.selectKsz){
            Lazy($scope.selectKsz['考试']).each(function(cc){
              if(cc['考试ID'] == ks['考试ID']){
                cc.ckd = ks['状态'] == 1;
              }
              else{
                cc.ckd = false;
              }
            });
          }
        };

        /**
        * 返回报名考试列表
        */
        $scope.backToKszList = function(){
          $scope.selectKsz = '';
        };

        /**
        * 选择考点
        */
        $scope.bmKaoDianSelect = function(ks){
          Lazy($scope.selectKsz['考试']).each(function(cc){
            cc.ckd = cc['考试ID'] == ks['考试ID'];
          });
        };

        /**
        * 保存考生选择信息，考生报名
        */
        $scope.saveStudentSelcet = function () {
          var bmObj = {
            method: 'GET',
            url: zaiXianBaoMingUrl,
            params: {
              'UID': '',
              '考试ID': '',
              '考点ID': ''
            }
          };
          var findTar = Lazy($scope.selectKsz['考试']).find(function(ks){
            return ks.ckd == true;
          });
          if(findTar){
            bmObj.params['UID'] = logUid;
            bmObj.params['考试ID'] = findTar['考试ID'];
            bmObj.params['考点ID'] = findTar['考点ID'];
            $http(bmObj).success(function(data){
              if(data.result){
                DataService.alertInfFun('suc', '报名成功！');
                $scope.backToKszList();
                chaXunBaoMingChangCi();
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
            });
          }
          else{
            DataService.alertInfFun('pmt', '请选择要报考的场次！');
          }
        };

        ///**
        // * 作答重现
        // */
        //$scope.zuoDaReappear = function (ks) {
        //  var answerReappearUrl = answerReappearBaseUrl;
        //  var dataDis;
        //  var tmVal;
        //  var finaData = {
        //    sj_name: '',
        //    sj_tm: []
        //  };
        //  var studId = ks.UID;
        //  var examId = ks.KAOSHI_ID;
        //  var itemDeFenLv = '';
        //  $scope.kaoShengShiJuan = '';
        //  $scope.showKaoShengList = true;
        //  if (studId) {
        //    answerReappearUrl += '&kaoshengid=' + studId;
        //  }
        //  else {
        //    DataService.alertInfFun('pmt', '缺少考生UID');
        //    return;
        //  }
        //  if (examId) {
        //    answerReappearUrl += '&kaoshiid=' + examId;
        //  }
        //  else {
        //    DataService.alertInfFun('pmt', '缺少考试ID');
        //    return;
        //  }
        //  DataService.getData(answerReappearUrl).then(function (data) {
        //    //if (data && data.length > 0) {
        //    //  var qryItemDeFenLvUrl = qryItemDeFenLvBase + examId;
        //    //  if (examId) {
        //    //    DataService.getData(qryItemDeFenLvUrl).then(function (dfl) {
        //    //      if (dfl && dfl.length > 0) {
        //    //        itemDeFenLv = dfl;
        //    //        finaData.sj_name = data[0].SHIJUAN_MINGCHENG;
        //    //        dataDis = Lazy(data).groupBy('DATI_XUHAO').toObject();
        //    //        Lazy(dataDis).each(function (val, key, list) {
        //    //          var dObj = {
        //    //            tx_id: key,
        //    //            tx_name: val[0].DATIMINGCHENG,
        //    //            tm: ''
        //    //          };
        //    //          tmVal = Lazy(val).each(function (tm, idx, lst) {
        //    //            var findVal = Lazy(itemDeFenLv).find(function (item) {
        //    //              return item.TIMU_ID == tm.TIMU_ID
        //    //            });
        //    //            tm.itemDeFenLv = (findVal.DEFENLV * 100).toFixed(1);
        //    //            if (typeof(tm.TIGAN) == 'string') {
        //    //              tm.TIGAN = JSON.parse(tm.TIGAN);
        //    //            }
        //    //            DataService.formatDaAn(tm);
        //    //          });
        //    //          dObj.tm = tmVal;
        //    //          finaData.sj_tm.push(dObj);
        //    //        });
        //    //        $scope.kaoShengShiJuan = finaData;
        //    //      }
        //    //    });
        //    //  }
        //    //  else {
        //    //    itemDeFenLv = '';
        //    //    DataService.alertInfFun('pmt', '查询得分率缺少考试ID');
        //    //  }
        //    //}
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

        /**
        * 考生知识点分析
        */
        $scope.studentZsdFenXi = function(ksz){
          var kszObj = {
            method: 'GET',
            url: kaoShiZuUrl,
            params: {
              '考试组ID': ksz['考试组ID'],
              '返回考试': true
            }
          };
          var stuZsdObj = {
            method: 'GET',
            url: kaoShengZhiShiDianDeFenLvUrl,
            params: {
              '考试组ID': ksz['考试组ID']
            }
          };
          var kszZsd = [];
          var tjZsdOriginData = '';
          var zsdDeFenLvArr = [];
          tjParaObj.radarDataZsd.zsdName = [];
          tjParaObj.radarDataZsd.zsdPerAll = [];
          tjParaObj.radarDataZsd.zsdPerSf = [];
          $scope.stuParams.zsdTjShow = false;
          tjParaObj.radarBoxZsd = echarts.init(document.getElementById('studentZsd'));
          var optRadarZsd = {
            tooltip : {
              trigger: 'axis'
            },
            legend: {
              orient : 'vertical',
              x : 'right',
              y : 'bottom',
              data:['整体','个人'],
              selected: {
                '整体' : false
              }
            },
            polar : [
              {
                indicator : '',
                radius : 80,
                center: ['50%', '50%']
              }
            ],
            calculable : true,
            series : [
              {
                name: '整体对比',
                type: 'radar',
                itemStyle: {
                  normal: {
                    areaStyle: {
                      type: 'default'
                    }
                  }
                },
                data : [
                  {
                    value : '',
                    name : '整体'
                  },
                  {
                    value : '',
                    name : '个人'
                  }
                ]
              }
            ]
          };
          $http(kszObj).success(function(kszData){ //查询考试组
            if(kszData && kszData.data){
              if(kszData['考试组设置'] && kszData['考试组设置']['考试组知识点']
                && kszData['考试组设置']['考试组知识点']['知识点ID'].length > 0){
                kszZsd = ksz['考试组设置']['考试组知识点']['知识点ID'];
              }
            }
            else{
              DataService.alertInfFun('err', kszData.error);
            }
            $http(stuZsdObj).success(function(cjData){ //考生成绩
              if(cjData && cjData.data){
                tjZsdOriginData = angular.copy(cjData.data);
                var distZsd = Lazy(cjData.data).groupBy('知识点ID').toObject();
                var stuSelfZsd = Lazy(cjData.data).filter(function(zsd){
                  return zsd['UID'] == logUid;
                }).toArray();
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
                      var fidZsdTar = Lazy(zsdDeFenLvArr).find(function(zsdObj){
                        return zsdObj['知识点ID'] == item;
                      });
                      var fidStuTar = Lazy(stuSelfZsd).find(function(zsdObj){
                        return zsdObj['知识点ID'] == item;
                      });
                      if(fidZsdTar){
                        var zsdNameObj = {text: fidZsdTar['知识点名称'], max: 100};
                        var zsdDeFenLv = fidZsdTar['得分率'] ? fidZsdTar['得分率'] : 0;
                        var stuDeFenLv = '';
                        if(fidStuTar){
                          stuDeFenLv = fidStuTar['得分率'] ? (fidStuTar['得分率']*100).toFixed(1) : 0;
                        }
                        tjParaObj.radarDataZsd.zsdName.push(zsdNameObj);
                        tjParaObj.radarDataZsd.zsdPerAll.push(zsdDeFenLv);
                        tjParaObj.radarDataZsd.zsdPerSf.push(stuDeFenLv);
                      }
                    });
                  }
                  else{
                    Lazy(zsdDeFenLvArr).each(function(zsd){
                      var zsdNameObj = {text: zsd['知识点名称'], max: 100};
                      var fidStuTar = Lazy(stuSelfZsd).find(function(zsdObj){
                        return zsdObj['知识点ID'] == zsd['知识点ID'];
                      });
                      var stuDeFenLv = '';
                      if(fidStuTar){
                        stuDeFenLv = fidStuTar['得分率'] ? (fidStuTar['得分率']*100).toFixed(1) : 0;
                      }
                      tjParaObj.radarDataZsd.zsdName.push(zsdNameObj);
                      tjParaObj.radarDataZsd.zsdPerAll.push(zsd['得分率']);
                      tjParaObj.radarDataZsd.zsdPerSf.push(stuDeFenLv);
                    });
                  }
                  optRadarZsd.polar[0].indicator = tjParaObj.radarDataZsd.zsdName;
                  optRadarZsd.series[0].data[0].value = tjParaObj.radarDataZsd.zsdPerAll;
                  optRadarZsd.series[0].data[1].value = tjParaObj.radarDataZsd.zsdPerSf;
                  tjParaObj.radarBoxZsd.setOption(optRadarZsd);
                  $scope.stuParams.zsdTjShow = true;
                  $timeout(function (){
                    window.onresize = function () {
                      tjParaObj.radarBoxZsd.resize();
                    }
                  }, 200);
                }
                else{
                  DataService.alertInfFun('err', '没有知识点数据！');
                }
              }
              else{
                DataService.alertInfFun('err', cjData.error);
              }
            });
          });
          //if(ks.KAOSHIZU_ID){
          //  pObj.kaoshizuid = ks.KAOSHIZU_ID;
          //}
          //else{
          //  DataService.alertInfFun('err', '请选择考试！');
          //  return;
          //}
          //$http({method: 'GET', url: kaoShiZuZhiShiDianUrl, params: pObj}).success(function(zsddata1){
          //  if(zsddata1 && zsddata1.length > 0){
          //    var zsdParam = {
          //      token: token,
          //      caozuoyuan: caozuoyuan,
          //      kaoshizuid: pObj.kaoshizuid,
          //      uid: ''
          //    };
          //    $http({method: 'GET', url: getZhiShiDianScoreUrl, params: zsdParam}).success(function(kszdata){
          //      if(kszdata && kszdata.length > 0){
          //        zsdParam.uid = caozuoyuan;
          //        $http({method: 'GET', url: getZhiShiDianScoreUrl, params: zsdParam}).success(function(grdata){
          //          if(grdata && grdata.length > 0){
          //            //知识点统计
          //            Lazy(zsddata1).each(function(tjzsd){
          //              var zsdNameObj = {text: tjzsd.ZHISHIDIANMINGCHENG, max: 100};
          //              tjParaObj.radarDataZsd.zsdName.push(zsdNameObj);
          //              var findTarKsz = Lazy(kszdata).find(function(zsdObj){
          //                return zsdObj.zhishidian_id == tjzsd.ZHISHIDIAN_ID;
          //              });
          //              var findTarGr = Lazy(grdata).find(function(zsdObj){
          //                return zsdObj.zhishidian_id == tjzsd.ZHISHIDIAN_ID;
          //              });
          //              if(findTarKsz){
          //                var zsdDeFenLvKsz = findTarKsz.defenlv ? (findTarKsz.defenlv*100).toFixed(1) : 0;
          //                tjParaObj.radarDataZsd.zsdPerAll.push(zsdDeFenLvKsz);
          //              }
          //              if(findTarGr){
          //                var zsdDeFenLvGr = findTarGr.defenlv ? (findTarGr.defenlv*100).toFixed(1) : 0;
          //                tjParaObj.radarDataZsd.zsdPerSf.push(zsdDeFenLvGr);
          //              }
          //            });
          //            var personalLen = tjParaObj.radarDataZsd.zsdPerSf.length;
          //            tjParaObj.radarDataZsd.zsdName.splice(personalLen);
          //            tjParaObj.radarDataZsd.zsdPerAll.splice(personalLen);
          //            tjParaObj.radarDataZsd.zsdPerSf.splice(personalLen);
          //            optRadarZsd.polar[0].indicator = tjParaObj.radarDataZsd.zsdName;
          //            optRadarZsd.series[0].data[0].value = tjParaObj.radarDataZsd.zsdPerAll;
          //            optRadarZsd.series[0].data[1].value = tjParaObj.radarDataZsd.zsdPerSf;
          //            tjParaObj.radarBoxZsd.setOption(optRadarZsd);
          //            $scope.stuParams.zsdTjShow = true;
          //            $timeout(function (){
          //              window.onresize = function () {
          //                tjParaObj.radarBoxZsd.resize();
          //              }
          //            }, 200);
          //          }
          //          else{
          //            DataService.alertInfFun('err', grdata.error);
          //          }
          //        });
          //      }
          //      else{
          //        DataService.alertInfFun('err', kszdata.error);
          //      }
          //    });
          //  }
          //  else{
          //    if(zsddata1.error){
          //      DataService.alertInfFun('err', zsddata1.error);
          //    }
          //    else{
          //      DataService.alertInfFun('err', '没有知识点！');
          //    }
          //  }
          //});
        };

        /**
        * 关闭作答重新内容
        */
        $scope.closeZuoDaReappear = function(){
          $scope.showKaoShengList = true;
        };



        ///**
        // * 视频分页
        // */
        //$scope.videoDistFun = function(pg){
        //  var pgNum = pg - 1;
        //  var currentPage = pgNum ? pgNum : 0;
        //  $scope.videoPages = [];
        //  //得到分页数组的代码
        //  var currentVideoPage = $scope.currentVideoPage = pg ? pg : 1;
        //  if($scope.videoLastPage <= paginationLength){
        //    $scope.videoPages = videoPageArr;
        //  }
        //  if($scope.videoLastPage > paginationLength){
        //    if(currentVideoPage > 0 && currentVideoPage <= 6 ){
        //      $scope.videoPages = videoPageArr.slice(0, paginationLength);
        //    }
        //    else if(currentVideoPage > $scope.videoLastPage - 5 && currentVideoPage <= $scope.videoLastPage){
        //      $scope.videoPages = videoPageArr.slice($scope.videoLastPage - paginationLength);
        //    }
        //    else{
        //      $scope.videoPages = videoPageArr.slice(currentVideoPage - 5, currentVideoPage + 5);
        //    }
        //  }
        //  $scope.videoData = originVideoData.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
        //};

        ///**
        // * 显示视频
        // */
        //$scope.showVideo = function(vd){
        //  $scope.showVideodeoPlay = true;
        //  var wd = $('.sub-nav').width();
        //  var playH = wd * 0.7 * 0.6;
        //  $scope.relatedVideoData = [];
        //  $('.sideVideoList').height(playH - 36);
        //  Lazy(originVideoData).each(function(v){
        //    if(v.Owner == vd.Owner){
        //      $scope.relatedVideoData.push(v);
        //    }
        //  });
        //  var player = polyvObject('#videoBox').videoPlayer({
        //    'width': '100%',
        //    'height': playH,
        //    'vid': vd.VID,
        //    'flashvars': {"autoplay": "1"}
        //  });
        //  $scope.selectVideo = vd;
        //};
        //
        ///**
        // * 返回视频列表
        // */
        //$scope.backToVideoList = function(){
        //  $scope.showVideodeoPlay = false;
        //  //var param = {
        //  //  baoming: '',
        //  //  chengji: {
        //  //    lingyu: [
        //  //      {val: 1001, score: true, zuoda: false},
        //  //      {val: 1002, score: true, zuoda: false},
        //  //      {val: 1003, score: true, zuoda: false}
        //  //    ]
        //  //  },
        //  //  lvke: ''
        //  //}
        //};

        /**
         * 重新加载mathjax
         */
        $scope.$on('onRepeatLast', function (scope, element, attrs) {
          MathJax.Hub.Config({
            tex2jax: {inlineMath: [["#$", "$#"]], displayMath: [['#$$', '$$#']]},
            messageStyle: "none",
            showMathMenu: false,
            processEscapes: true
          });
          MathJax.Hub.Queue(["Typeset", MathJax.Hub, "answerReappearShiJuan"]);
        });

      }]);
});
