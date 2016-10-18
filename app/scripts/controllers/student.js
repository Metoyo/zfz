define(['angular', 'config', 'jquery', 'lazy'], function (angular, config, $, lazy) {
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
        var kaoShengZuoDaUrl = '/kaosheng_zuoda'; //考生作答的接口
        var xueShengKeXuHaoUrl = '/xuesheng_kexuhao'; //学生课序号
        var xueXiaoKeMuTiXingUrl = '/xuexiao_kemu_tixing'; //学校科目题型
        var keMuConfUrl = '/kemu_conf'; //科目设置
        var tiKuUrl = '/tiku'; //查询题库
        var lingYuUrl = '/lingyu'; //查询领域
        var zhiShiDaGangUrl = '/zhishidagang'; //知识大纲
        var lianXiUrl = '/lianxi'; //练习
        var daTiUrl = '/dati'; //答题
        var tjParaObj = { //存放统计参数的Object
          radarBoxZsd: '',
          radarDataZsd: {
            zsdName: [],
            zsdPerAll: [],
            zsdPerSf: []
          }
        };
        var currentPath = $location.$$path;
        $scope.stuParams = {
          bmKszArr: [],
          letterArr: config.letterArr, //题支的序号
          cnNumArr: config.cnNumArr, //汉语的大写数字
          zsdTjShow: false, //是否显示考生的知识点
          sltKm: '', //选中的科目
          lianXiID: '' //练习ID
        };
        $scope.kaoShiArrs = '';
        $scope.lianXiShiJuan = '';
        $scope.lianXiScore = '';
        $scope.showKaoShengList = true;
        $scope.tiMuNum = [10, 20, 50];
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
                  '状态': 1,
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
              'UID': logUid,
              '学校ID': jgID
            }
          };
          var power = '';
          $http(stuObj).success(function(students) {
            if (students.result && students.data) {
              //演示用到了上财的数据，特屏蔽演示数据
              if(jgID == 1024){
                students.data = Lazy(students.data).reject(function(ks){
                  return ks['考试组ID'] == 1532;
                });
              }
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
                        stu.zuoda = fndTar['作答重现'];
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
         * 练习查询数据
         */
        var loadLianXi = function(){
          var kxhObj = {
            method: 'GET',
            url: xueShengKeXuHaoUrl,
            params: {
              'UID': logUid
            }
          };
          var kmTmp = [];
          $scope.keMuList = [];
          $scope.lianXiShiJuan = '';
          $scope.stuParams.lianXiID = '';
          $http(kxhObj).success(function(kxh){
            if(kxh.result && kxh.data && kxh.data.length > 0){
              var dis = Lazy(kxh.data).groupBy('科目ID').toObject();
              Lazy(dis).each(function(v, k, l){
                var tmp = {
                  '科目ID': parseInt(k),
                  '科目名称': v[0]['科目名称']
                };
                kmTmp.push(tmp);
              });
              $scope.keMuList = DataService.cnSort(kmTmp, '科目名称');
              var pageHeight = document.querySelector('.dashboard').clientHeight - 140 + 'px';
              var wrapWt = document.querySelectorAll('.pointTree');
              angular.element(wrapWt).css({height: pageHeight, 'overflow-y': 'auto'});
            }
            else{
              DataService.alertInfFun('err', kxh.error);
            }
          });
        };

        /**
         * 获得大纲数据
         */
        var getDaGangData = function(keMuId){
          //得到知识大纲知识点的递归函数
          function _do(item) {
            item.ckd = false;
            item.fld = true;
            if(item['子节点'] && item['子节点'].length > 0){
              Lazy(item['子节点']).each(_do);
            }
          }
          var sObj = {
            method: 'GET',
            url: keMuConfUrl,
            params: {
              '学校ID': jgID,
              '科目ID': keMuId
            }
          };
          var obj = {
            method: 'GET',
            url: zhiShiDaGangUrl,
            params: {}
          };
          $http(sObj).success(function(sData){
            if(sData.result && sData.data){
              if(sData.data['默认大纲'] && sData.data['默认大纲']['知识大纲ID']){
                obj.params['知识大纲ID'] = sData.data['默认大纲']['知识大纲ID'];
              }
              else{
                obj.params['学校ID'] = jgID;
                obj.params['科目ID'] = keMuId;
              }
              $http(obj).success(function(data){
                if(data.result && data.data){
                  Lazy(data.data[0]['节点']).each(_do);
                  $scope.glKowledgeList = data.data[0];
                }
                else{
                  DataService.alertInfFun('err', data.error);
                }
              });
            }
            else{
              DataService.alertInfFun('err', sData.error || '没有默认大纲！');
            }
          });
        };

        /**
         * 查询题库
         */
        var qryTiKu = function(kmId){
          var lyObj = {
            method: 'GET',
            url: lingYuUrl,
            params: {
              '学校ID': jgID,
              '科目ID': kmId
            }
          };
          var tkObj = {
            method: 'GET',
            url: tiKuUrl,
            params: {
              '学校ID': jgID,
              '领域ID': ''
            }
          };
          $scope.tiKu = '';
          $http(lyObj).success(function(lingYu){
            if(lingYu.result && lingYu.data){
              tkObj.params['领域ID'] = lingYu.data['领域ID'];
              $http(tkObj).success(function(tiKu){
                if(tiKu.result && tiKu.data){
                  $scope.tiKu = tiKu.data;
                }
                else{
                  DataService.alertInfFun('err', tiKu.error);
                }
              });
            }
            else{
              DataService.alertInfFun('err', lingYu.error);
            }
          });
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
          case '/lianxi':
            loadLianXi();
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

        /**
         * 作答重现
         */
        $scope.zuoDaReappear = function (ks) {
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
                  tm = DataService.formatDaAn(tm);
                });
              });
              finaData.sj_tm = data.data['试卷题目'];
              $scope.showKaoShengList = false;
              $scope.kaoShengShiJuan = finaData;
            }
            else{
              DataService.alertInfFun('err', data.error);
            }
          });
        };

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
            //tooltip : {
            //  trigger: 'axis'
            //},
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
        };

        /**
         * 关闭作答重新内容
         */
        $scope.closeZuoDaReappear = function(){
          $scope.showKaoShengList = true;
        };

        /**
         * 查询学校科目题型
         */
        $scope.getXueXiaoKeMuTiXing = function(kmId){
          var obj = {
            method: 'GET',
            url: xueXiaoKeMuTiXingUrl,
            params: {
              '学校ID': jgID,
              '科目ID': ''
            }
          };
          $scope.tiXing = '';
          if(kmId){
            obj.params['科目ID'] = kmId;
            $http(obj).success(function(data){
              if(data.result && data.data){
                $scope.tiXing = Lazy(data.data).filter(function(tx){ return tx['题型ID'] <= 3 }).toArray();
                Lazy($scope.tiXing).each(function(tx){ tx['题目数量'] = '' });
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
            });
            getDaGangData(kmId);
            qryTiKu(kmId);
          }
        };

        /**
         * 获得难度查询条件
         */
        $scope.getNanDuId = function(nd){
          nd.ckd = !nd.ckd;
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
          zsd.ckd = !zsd.ckd;
        };

        /**
         * 开始练习
         */
        $scope.beginLianXi = function(){
          var obj = {
            method: 'PUT',
            url: lianXiUrl,
            data: {
              '学校ID': jgID,
              '科目ID': $scope.stuParams.sltKm,
              '练习设置': {
                '试卷数量': 1,
                '组卷方式': '规则',
                '组卷规则': []
              }
            }
          };
          var mis = [];
          $scope.lianXiScore = '';
          $scope.lianXiShiJuan = '';
          $scope.stuParams.lianXiID = '';
          //难度整理
          var ndArr = [];
          Lazy($scope.nanDuList).each(function(nd){
            if(nd.ckd){
              ndArr.push(nd['难度ID']);
            }
          });
          //知识点整理
          var zsdId = [];
          function _do(item) {
            if(item.ckd){
              zsdId.push(item['知识点ID']);
            }
            if(item['子节点'] && item['子节点'].length > 0){
              Lazy(item['子节点']).each(_do);
            }
          }
          Lazy($scope.glKowledgeList['节点']).each(_do);
          //题库整理
          var tkId = Lazy($scope.tiKu).map(function(tk){
            return tk['题库ID'];
          }).toArray();
          if(!$scope.stuParams.sltKm){
            mis.push('科目');
          }
          if(!(tkId.length > 0)){
            mis.push('题库');
          }
          if(!(ndArr.length > 0)){
            mis.push('难度');
          }
          if(!(zsdId.length > 0)){
            mis.push('知识点');
          }
          //题型整理
          if($scope.tiXing && $scope.tiXing.length > 0){
            Lazy($scope.tiXing).each(function(tx){
              if(tx['题目数量']){
                var gz = {
                  '大题名称': tx['题型名称'],
                  '随机题目': [
                    {
                      '题目分值': 1,
                      '题目数量': tx['题目数量'],
                      '限定题库': tkId,
                      '题型': tx['题型ID'],
                      '难度': ndArr,
                      '知识点': zsdId
                    }
                  ]
                };
                obj.data['练习设置']['组卷规则'].push(gz);
              }
            });
          }
          else{
            mis.push('题型');
          }
          if(!(obj.data['练习设置']['组卷规则'].length > 0)){
            mis.push('组卷规则');
          }
          if(!(mis.length > 0)){
            obj.data['练习设置'] = JSON.stringify(obj.data['练习设置']);
            $http(obj).success(function(data){
              if(data.result && data.data['练习题目'] && data.data['练习题目'].length > 0){
                Lazy(data.data['练习题目']).each(function(dt){
                  Lazy(dt['题目']).each(function(tm){
                    tm = DataService.formatDaAn(tm);
                    tm['考生答案'] = '';
                    if(tm['题型ID'] == 2){
                      tm['题目内容']['新选项'] = [];
                      Lazy(tm['题目内容']['选项']).each(function(tz){
                        var tzObj = {
                          cont: tz,
                          ckd: false
                        };
                        tm['题目内容']['新选项'].push(tzObj);
                      });
                    }
                  });
                });
                $scope.lianXiShiJuan = data.data['练习题目'];
                $scope.stuParams.lianXiID = data.data['练习ID'];
              }
              else{
                DataService.alertInfFun('err', data.error || '没有练习题目！');
              }
            });
          }
          else{
            DataService.alertInfFun('err', '缺少：' + mis.join('；'));
          }
        };

        /**
         * 练习答题
         */
        $scope.lianXiDaTi = function(xtm, idxDa){
          var obj = {
            method: 'POST',
            url: daTiUrl,
            data: {
              '练习ID': '',
              '题目ID': '',
              '答案': ''
            }
          };
          if($scope.stuParams.lianXiID){
            obj.data['练习ID'] = $scope.stuParams.lianXiID;
          }
          else{
            DataService.alertInfFun('err', '缺少练习ID！');
            return ;
          }
          if(xtm['题目ID']){
            obj.data['题目ID'] = xtm['题目ID'];
          }
          else{
            DataService.alertInfFun('err', '缺少题目ID！');
            return ;
          }
          if(xtm['题型ID'] == 2){ //多选题
            var da = [];
            Lazy(xtm['题目内容']['新选项']).each(function(tz, idx, lst){
              if(tz.ckd){
                da.push(idx);
              }
            });
            if(da.length > 0){
              obj.data['答案'] = JSON.stringify(da);
            }
            else{
              DataService.alertInfFun('err', '请选择答案！');
              return ;
            }
          }
          else{ //单选和判断
            obj.data['答案'] = parseInt(xtm['考生答案']);
          }
          $http(obj).success(function(data){
            if(data.result && data.data){
              console.log(data.result);
            }
            else{
              DataService.alertInfFun('err', data.error);
            }
          });
        };

        /**
         * 结束练习
         */
        $scope.endLianXi = function(){
          var obj = {
            method: 'POST',
            url: lianXiUrl,
            data: {
              '练习ID': ''
            }
          };
          if($scope.stuParams.lianXiID){
            obj.data['练习ID'] = $scope.stuParams.lianXiID;
            $http(obj).success(function(data){
              if(data.result && data.data){
                $scope.lianXiScore = data.data;
              }
              else{
                $scope.lianXiScore = '';
                DataService.alertInfFun('err', data.error);
              }
            });
          }
        };

        /**
         * 取消练习
         */
        $scope.cancelLianXi = function(){
          $scope.lianXiShiJuan = '';
          $scope.stuParams.lianXiID = '';
          $scope.lianXiScore = '';
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
          MathJax.Hub.Queue(["Typeset", MathJax.Hub, "glDaGangList"]);
          MathJax.Hub.Queue(["Typeset", MathJax.Hub, "lianXiSjWrap"]);
        });

      }]);
});
