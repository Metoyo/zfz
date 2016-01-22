define(['angular', 'config', 'jquery', 'lazy', 'polyv'], function (angular, config, $, lazy, polyv) {
  'use strict';

  angular.module('zhifzApp.controllers.StudentCtrl', [])
    .controller('StudentCtrl', ['$rootScope', '$scope', '$location', '$http', 'DataService', '$timeout',
      function ($rootScope, $scope, $location, $http, DataService, $timeout) {

        /**
         * 声明变量
         */
        var userInfo = $rootScope.session.userInfo;
        var defaultJg = userInfo.JIGOU;
        var caozuoyuan = userInfo.UID;//登录的用户的UID   chaxun_kaoshi_liebiao
        var xuehao = userInfo.xuehao;
        var baseTjAPIUrl = config.apiurl_tj; //统计的api
        var baseKwAPIUrl = config.apiurl_kw; //考务的api
        var baseRzAPIUrl = config.apiurl_rz; //认证的api
        var token = config.token;
        var currentPath = $location.$$path;
        var qryKaoShiByXueHaoBase = baseTjAPIUrl + 'query_kaoshi_by_xuehao?token=' + token + '&jigouid=' + defaultJg
          + '&userType=' + 'student' + '&xuehao='; //查询考试通过考生学号
        var answerReappearBaseUrl = baseTjAPIUrl + 'answer_reappear?token=' + token; //作答重现的url
        var qryItemDeFenLvBase = baseTjAPIUrl + 'query_timu_defenlv?token=' + token + '&kaoshiid='; //查询每道题目的得分率
        var originVideoData; //原始视频
        var itemsPerPage = 8; //每页数据数量
        var videoPageArr = []; // 视频页码数组
        var paginationLength = 11; //分页部分，页码的长度，目前设定为11
        var queryBaoMingKaoShiUrl = baseKwAPIUrl + 'query_baoming_kaoshi?token=' + token + '&caozuoyuan=' + caozuoyuan +
          '&jigouid=' + defaultJg + '&uid=' + caozuoyuan; //查询考生需要参加的考试
        var chaXunChangCiUrl = baseKwAPIUrl + 'query_changci?token=' + token + '&caozuoyuan=' + caozuoyuan + '&kszid='; //查询场次
        var zaiXianBaoMingUrl = baseKwAPIUrl + 'zaixianbaoming'; //在线报名的url
        var jiGouConf = baseRzAPIUrl + 'jigou_conf?token=' + token + '&jigouid=' + defaultJg; //查询机构配置
        var deleteChangCiStudent = baseKwAPIUrl + 'delete_changci_student'; //删除场次中的考生
        var tjParaObj = {
          radarBoxZsd: '',
          radarDataZsd: {
            zsdName: [],
            zsdPerAll: [],
            zsdPerBk: []
          }
        }; //存放统计参数的Object
        var kaoShiZuZhiShiDianUrl = baseTjAPIUrl + 'kaoshizu_zhishidian'; //保存考试组知识点
        var getZhiShiDianScoreUrl = baseTjAPIUrl + 'zhishidian_defen'; //查询知识点得分

        $scope.bmKaoChang = '';
        $scope.stuParams = {
          selectKaoDian: '',
          hasBaoMing: true,
          letterArr: config.letterArr, //题支的序号
          cnNumArr: config.cnNumArr, //汉语的大写数字
          noData: '', //没有数据的显示
          zsdTjShow: false //是否显示考生的知识点
        };
        $scope.kaoShiArrs = '';
        $scope.kaoShiDetail = '';
        $scope.showStuSelectInfo = false;
        $scope.showKaoShengList = true;

        /**
         * 查询考生有几场考试
         */
        var chaXunBaoMingChangCi = function () {
          $scope.kaoShiArrs = '';
          var kaoShiZu = [];
          $scope.kaoShiChangCiDetail = false;
          $http.get(queryBaoMingKaoShiUrl).success(function (data) {
            if (data && data.length > 0) {
              var kszSort = Lazy(data).groupBy(function(ksz){ return ksz.KAOSHIZU_ID; });
              Lazy(kszSort).each(function(v, k, l){
                var kszObj = {
                  KAOSHIZU_ID: k,
                  KAOSHIZU_NAME: v[0].KAOSHIZU_NAME,
                  LINGYU_ID: v[0].LINGYU_ID,
                  YIBAOMING: 0,
                  kaoShiShiJian: '',
                  kaoChangInfo: [],
                  baoMingChangCi: '',
                  ZHUANGTAI:v[0].ZHUANGTAI
                };
                Lazy(v).each(function(cc){
                  if(cc.YIBAOMING == 1){
                    var kci = cc.KMINGCHENG;
                    //if(cc.ZUOWEIHAO){
                    //  kci += '--' + cc.ZUOWEIHAO + '号机';
                    //}
                    kszObj.kaoShiShiJian = DataService.baoMingDateFormat(cc.KAISHISHIJIAN, cc.JIESHUSHIJIAN);
                    kszObj.YIBAOMING = 1;
                    kszObj.baoMingChangCi = cc;
                    kszObj.kaoChangInfo.push(kci);
                  }
                });
                kaoShiZu.push(kszObj);
              });
              $scope.kaoShiArrs = Lazy(kaoShiZu).reverse().toArray();
            }
            if(data.error){
              $scope.kaoShiArrs = '';
              DataService.alertInfFun('err', data.error);
            }
          });
        };

        /**
         * 查看考试详情
         */
        $scope.queryKaoShiZuDetail = function(ks){
          var chaXunChangCi = chaXunChangCiUrl + ks.KAOSHIZU_ID;
          var ksObj = {
            KAOSHIZU_ID: ks.KAOSHIZU_ID,
            KAOSHIZU_NAME: ks.KAOSHIZU_NAME,
            changci: []
          };
          $http.get(chaXunChangCi).success(function(data){
            if(data && data.length > 0){
              var disChangCi = Lazy(data).groupBy(function(cc){
                return cc.KAOSHI_ID;
              });
              Lazy(disChangCi).each(function(v, k, l){
                var fd = v[0];
                var ccObj = {
                  KAOSHI_ID: k,
                  KAOSHI_MINGCHENG: fd.KAOSHI_MINGCHENG,
                  KAISHISHIJIAN: fd.KAISHISHIJIAN,
                  JIESHUSHIJIAN: fd.JIESHUSHIJIAN,
                  SHICHANG: fd.SHICHANG,
                  LINGYU_ID: ks.LINGYU_ID,
                  kaoShiShiJian: DataService.baoMingDateFormat(fd.KAISHISHIJIAN, fd.JIESHUSHIJIAN),
                  kaoDian: []
                };
                var disChangCiSec = Lazy(v).groupBy(function(ccs){ return ccs.KID; });
                Lazy(disChangCiSec).each(function(v1, k1, l1){
                  var kdObj = {
                    KID: k1,
                    KMINGCHENG: v1[0].KMINGCHENG,
                    KAOWEISHULIANG: v1[0].KAOWEISHULIANG,
                    YIBAOMINGRENSHU: v1[0].YIBAOMINGRENSHU || 0,
                    ckd: false
                  };
                  kdObj.isFull = kdObj.YIBAOMINGRENSHU >= kdObj.KAOWEISHULIANG ? true : false;
                  ccObj.kaoDian.push(kdObj);
                });
                ksObj.changci.push(ccObj);
              });
              $scope.kaoShiDetailData = ksObj;
              $scope.kaoShiChangCiDetail = true;
            }
            else{
              $scope.kaoShiDetailData = '';
              $scope.kaoShiChangCiDetail = false;
              DataService.alertInfFun('err', data.error);
            }
          });
        };

        /**
         * 返回报名考试列表
         */
        $scope.backToBoMingList = function(){
          $scope.kaoShiDetailData = '';
          $scope.kaoShiChangCiDetail = false;
        };

        /**
         * 选择考点
         */
        $scope.bmKaoDianSelect = function(kd){
          Lazy($scope.kaoShiDetailData.changci).each(function(cc){
            Lazy(cc.kaoDian).each(function(kd){
              kd.ckd = false;
            });
          });
          kd.ckd = !kd.ckd;
        };

        /**
         * 保存考生选择信息，考生报名
         */
        $scope.saveStudentSelcet = function () {
          var bmObj = {
            token: token,
            caozuoyuan: caozuoyuan,
            uid: caozuoyuan,
            kid: '',
            ksid: '',
            lingyuid: '',
            kszid: $scope.kaoShiDetailData.KAOSHIZU_ID
          };
          Lazy($scope.kaoShiDetailData.changci).each(function(cc){
            Lazy(cc.kaoDian).each(function(kd){
             if(kd.ckd == true){
               bmObj.ksid = cc.KAOSHI_ID;
               bmObj.lingyuid = cc.LINGYU_ID;
               bmObj.kid = kd.KID;
             }
            });
          });
          if(bmObj.ksid){
            if(bmObj.kid){
              $http.post(zaiXianBaoMingUrl, bmObj).success(function(data){
                if(data.result){
                  DataService.alertInfFun('suc', '报名成功！');
                  $scope.backToBoMingList();
                  chaXunBaoMingChangCi();
                }
                else{
                  DataService.alertInfFun('err', data.error);
                }
              });
            }
            else{
              DataService.alertInfFun('pmt', '考点ID不能为空！');
            }
          }
          else{
            DataService.alertInfFun('pmt', '考试ID不能为空！');
          }
        };

        /**
         * 取消报名
         */
        $scope.cancelBaoMing = function (ks) {
          var ksObj = {
            token: token,
            caozuoyuan: caozuoyuan,
            jigouid: defaultJg,
            lingyuid: '',
            uid: caozuoyuan,
            kszid: '',
            kaoshiid: '',
            studentState: 'on'
          };
          if(ks.baoMingChangCi){
            ksObj.lingyuid = ks.baoMingChangCi.LINGYU_ID;
            ksObj.kszid = ks.baoMingChangCi.KAOSHIZU_ID;
            ksObj.kaoshiid = ks.baoMingChangCi.KAOSHI_ID;
          }
          else{
            return;
          }
          if(confirm('你确定要取消报名吗？')){
            $http.get(deleteChangCiStudent, {params:ksObj}).success(function(data){
              if(data.result){
                chaXunBaoMingChangCi();
                DataService.alertInfFun('suc', '取消成功！')
              }
              else{
                DataService.alertInfFun('err', data.error)
              }
            });
          }
        };

        /**
         * 查询考试通过考生UID
         */
        var qryKaoShiByXueHao = function () {
          $http.get(jiGouConf).success(function(conf){
            if(!conf.error){
              var confObj = '';
              if(conf && conf.length > 0){
                confObj = JSON.parse(conf[0].JIGOU_CONF);
              }
              if(xuehao) {
                var qryKaoShiByXueHaoUrl = qryKaoShiByXueHaoBase + xuehao;
                $http.get(qryKaoShiByXueHaoUrl).success(function (data) {
                  if (data && data.length > 0) {
                    Lazy(data).each(function(ks){
                      ks.score = true;
                      ks.zuoda = true;
                      if(confObj){
                        var findTar = Lazy(confObj.chengji.lingyu).find(function(ly){
                          return ly.val == ks.LINGYU_ID;
                        });
                        if(findTar){
                          ks.score = findTar.score;
                          ks.zuoda = findTar.zuoda;
                        }
                      }
                    });
                    $scope.ksScoreData = data;
                    tjParaObj.radarBoxZsd = echarts.init(document.getElementById('studentZsd'));
                    $scope.showKaoShengList = true;
                  }
                  if(data.error){
                    DataService.alertInfFun('err', data.error);
                  }
                });
              }
            }
            else{
              DataService.alertInfFun('err', conf.error);
            }
          });
        };

        /**
         * 作答重现
         */
        $scope.zuoDaReappear = function (ks) {
          var answerReappearUrl = answerReappearBaseUrl;
          var dataDis;
          var tmVal;
          var finaData = {
            sj_name: '',
            sj_tm: []
          };
          var studId = ks.UID;
          var examId = ks.KAOSHI_ID;
          var itemDeFenLv = '';
          $scope.kaoShengShiJuan = '';
          $scope.showKaoShengList = true;
          if (studId) {
            answerReappearUrl += '&kaoshengid=' + studId;
          }
          else {
            DataService.alertInfFun('pmt', '缺少考生UID');
            return;
          }
          if (examId) {
            answerReappearUrl += '&kaoshiid=' + examId;
          }
          else {
            DataService.alertInfFun('pmt', '缺少考试ID');
            return;
          }
          DataService.getData(answerReappearUrl).then(function (data) {
            //if (data && data.length > 0) {
            //  var qryItemDeFenLvUrl = qryItemDeFenLvBase + examId;
            //  if (examId) {
            //    DataService.getData(qryItemDeFenLvUrl).then(function (dfl) {
            //      if (dfl && dfl.length > 0) {
            //        itemDeFenLv = dfl;
            //        finaData.sj_name = data[0].SHIJUAN_MINGCHENG;
            //        dataDis = Lazy(data).groupBy('DATI_XUHAO').toObject();
            //        Lazy(dataDis).each(function (val, key, list) {
            //          var dObj = {
            //            tx_id: key,
            //            tx_name: val[0].DATIMINGCHENG,
            //            tm: ''
            //          };
            //          tmVal = Lazy(val).each(function (tm, idx, lst) {
            //            var findVal = Lazy(itemDeFenLv).find(function (item) {
            //              return item.TIMU_ID == tm.TIMU_ID
            //            });
            //            tm.itemDeFenLv = (findVal.DEFENLV * 100).toFixed(1);
            //            if (typeof(tm.TIGAN) == 'string') {
            //              tm.TIGAN = JSON.parse(tm.TIGAN);
            //            }
            //            DataService.formatDaAn(tm);
            //          });
            //          dObj.tm = tmVal;
            //          finaData.sj_tm.push(dObj);
            //        });
            //        $scope.kaoShengShiJuan = finaData;
            //      }
            //    });
            //  }
            //  else {
            //    itemDeFenLv = '';
            //    DataService.alertInfFun('pmt', '查询得分率缺少考试ID');
            //  }
            //}
            if(data && data.length > 0){
              finaData.sj_name = data[0].SHIJUAN_MINGCHENG;
              dataDis = Lazy(data).groupBy('DATI_XUHAO').toObject();
              Lazy(dataDis).each(function(val, key, list){
                var dObj = {
                  tx_id: key,
                  tx_name: val[0].DATIMINGCHENG,
                  tm: ''
                };
                Lazy(val).each(function(tm, idx, lst){
                  var findVal = Lazy(itemDeFenLv).find(function(item){return item.TIMU_ID == tm.TIMU_ID});
                  if(findVal){
                    tm.itemDeFenLv = (findVal.DEFENLV * 100).toFixed(1);
                  }
                  if(typeof(tm.TIGAN) == 'string'){
                    tm.TIGAN = JSON.parse(tm.TIGAN);
                  }
                  DataService.formatDaAn(tm);
                });
                dObj.tm = val;
                finaData.sj_tm.push(dObj);
              });
              $scope.showKaoShengList = false;
              $scope.kaoShengShiJuan = finaData;
            }
          });
        };

        /**
         * 考生知识点分析
         */
        $scope.studentZsdFenXi = function(ks){
          var pObj = {
            token: token,
            caozuoyuan: caozuoyuan,
            kaoshizuid: ''
          };
          tjParaObj.radarDataZsd.zsdName = [];
          tjParaObj.radarDataZsd.zsdPerAll = [];
          tjParaObj.radarDataZsd.zsdPerBk = [];
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
          if(ks.KAOSHIZU_ID){
            pObj.kaoshizuid = ks.KAOSHIZU_ID;
          }
          else{
            DataService.alertInfFun('err', '请选择考试！');
            return;
          }
          $http({method: 'GET', url: kaoShiZuZhiShiDianUrl, params: pObj}).success(function(zsddata1){
            if(zsddata1 && zsddata1.length > 0){
              var zsdParam = {
                token: token,
                caozuoyuan: caozuoyuan,
                kaoshizuid: pObj.kaoshizuid,
                uid: ''
              };
              $http({method: 'GET', url: getZhiShiDianScoreUrl, params: zsdParam}).success(function(kszdata){
                if(kszdata && kszdata.length > 0){
                  zsdParam.uid = caozuoyuan;
                  $http({method: 'GET', url: getZhiShiDianScoreUrl, params: zsdParam}).success(function(grdata){
                    if(grdata && grdata.length > 0){
                      //知识点统计
                      Lazy(zsddata1).each(function(tjzsd){
                        var zsdNameObj = {text: tjzsd.ZHISHIDIANMINGCHENG, max: 100};
                        tjParaObj.radarDataZsd.zsdName.push(zsdNameObj);
                        var findTarKsz = Lazy(kszdata).find(function(zsdObj){
                          return zsdObj.zhishidian_id == tjzsd.ZHISHIDIAN_ID;
                        });
                        var findTarGr = Lazy(grdata).find(function(zsdObj){
                          return zsdObj.zhishidian_id == tjzsd.ZHISHIDIAN_ID;
                        });
                        if(findTarKsz){
                          var zsdDeFenLvKsz = findTarKsz.defenlv ? (findTarKsz.defenlv*100).toFixed(1) : 0;
                          tjParaObj.radarDataZsd.zsdPerAll.push(zsdDeFenLvKsz);
                        }
                        if(findTarGr){
                          var zsdDeFenLvGr = findTarGr.defenlv ? (findTarGr.defenlv*100).toFixed(1) : 0;
                          tjParaObj.radarDataZsd.zsdPerBk.push(zsdDeFenLvGr);
                        }
                      });
                      var personalLen = tjParaObj.radarDataZsd.zsdPerBk.length;
                      tjParaObj.radarDataZsd.zsdName.splice(personalLen);
                      tjParaObj.radarDataZsd.zsdPerAll.splice(personalLen);
                      tjParaObj.radarDataZsd.zsdPerBk.splice(personalLen);
                      optRadarZsd.polar[0].indicator = tjParaObj.radarDataZsd.zsdName;
                      optRadarZsd.series[0].data[0].value = tjParaObj.radarDataZsd.zsdPerAll;
                      optRadarZsd.series[0].data[1].value = tjParaObj.radarDataZsd.zsdPerBk;
                      tjParaObj.radarBoxZsd.setOption(optRadarZsd);
                      $scope.stuParams.zsdTjShow = true;
                      $timeout(function (){
                        window.onresize = function () {
                          tjParaObj.radarBoxZsd.resize();
                        }
                      }, 200);
                    }
                    else{
                      DataService.alertInfFun('err', grdata.error);
                    }
                  });
                }
                else{
                  DataService.alertInfFun('err', kszdata.error);
                }
              });
            }
            else{
              if(zsddata1.error){
                DataService.alertInfFun('err', zsddata1.error);
              }
              else{
                DataService.alertInfFun('err', '没有知识点！');
              }
            }
          });
        };

        /**
         * 关闭作答重新内容
         */
        $scope.closeZuoDaReappear = function(){
          $scope.showKaoShengList = true;
        };

        /**
         * 当为微录课是加载视频列表
         */
        var loadVideoList = function(){
          $scope.videoData = '';
          $scope.videoData = config.videos;
          var lastVideoPage = '';
          var videoLen = '';
          $scope.videoLastPage = '';
          $scope.showVideodeoPlay = false;
          videoPageArr = [];
          $scope.selectVideo = '';
          //临时数据
          var data = config.videos;
          if(data && data.length > 0){
            originVideoData = data;
            videoLen = data.length;
            lastVideoPage = Math.ceil(videoLen/itemsPerPage);
            $scope.videoLastPage = lastVideoPage;
            for(var i = 1; i <= lastVideoPage; i ++){
              videoPageArr.push(i);
            }
            if(videoLen <= 8){
              $scope.videoData = data;
            }
            else{
              $scope.videoDistFun(1);
            }
          }
          else{
            originVideoData = '';
            DataService.alertInfFun('err', data.error);
          }
          //var getVideoUrl = 'http://v.yunjiaoshou.com:4280/wlk/videos/1180';
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
         * 视频分页
         */
        $scope.videoDistFun = function(pg){
          var pgNum = pg - 1;
          var currentPage = pgNum ? pgNum : 0;
          $scope.videoPages = [];
          //得到分页数组的代码
          var currentVideoPage = $scope.currentVideoPage = pg ? pg : 1;
          if($scope.videoLastPage <= paginationLength){
            $scope.videoPages = videoPageArr;
          }
          if($scope.videoLastPage > paginationLength){
            if(currentVideoPage > 0 && currentVideoPage <= 6 ){
              $scope.videoPages = videoPageArr.slice(0, paginationLength);
            }
            else if(currentVideoPage > $scope.videoLastPage - 5 && currentVideoPage <= $scope.videoLastPage){
              $scope.videoPages = videoPageArr.slice($scope.videoLastPage - paginationLength);
            }
            else{
              $scope.videoPages = videoPageArr.slice(currentVideoPage - 5, currentVideoPage + 5);
            }
          }
          $scope.videoData = originVideoData.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
        };

        /**
         * 判断是报名还是成绩
         */
        switch (currentPath) {
          case '/baoming':
            chaXunBaoMingChangCi();
            break;
          case '/chengji':
            qryKaoShiByXueHao();
            break;
          case '/weiluke':
            loadVideoList();
            break;
        }

        /**
         * 显示视频
         */
        $scope.showVideo = function(vd){
          $scope.showVideodeoPlay = true;
          var wd = $('.sub-nav').width();
          var playH = wd * 0.7 * 0.6;
          $scope.relatedVideoData = [];
          $('.sideVideoList').height(playH - 36);
          Lazy(originVideoData).each(function(v){
            if(v.Owner == vd.Owner){
              $scope.relatedVideoData.push(v);
            }
          });
          var player = polyvObject('#videoBox').videoPlayer({
            'width': '100%',
            'height': playH,
            'vid': vd.VID,
            'flashvars': {"autoplay": "1"}
          });
          $scope.selectVideo = vd;
        };

        /**
         * 返回视频列表
         */
        $scope.backToVideoList = function(){
          $scope.showVideodeoPlay = false;
          //var param = {
          //  baoming: '',
          //  chengji: {
          //    lingyu: [
          //      {val: 1001, score: true, zuoda: false},
          //      {val: 1002, score: true, zuoda: false},
          //      {val: 1003, score: true, zuoda: false}
          //    ]
          //  },
          //  lvke: ''
          //}
        };

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
