define(['angular', 'config', 'jquery', 'lazy', 'datepicker', 'qrcode'], // 000 开始
  function (angular, config, $, lazy, datepicker, qrcode) { // 001 开始
    'use strict';
    angular.module('zhifzApp.controllers.KejianCtrl', []) //controller 开始
      .controller('KejianCtrl', ['$rootScope', '$scope', '$http', '$timeout', 'DataService', '$cookieStore', '$routeParams',
        function ($rootScope, $scope, $http, $timeout, DataService, $cookieStore, $routeParams) { // 002 开始
          /**
           * 定义变量
           */
          var loginUsr = JSON.parse($cookieStore.get('ckUsr'));
          var jgID = loginUsr['学校ID']; //登录用户学校
          var dftKm = JSON.parse($cookieStore.get('ckKeMu')); //默认选择的科目
          var keMuId = dftKm['科目ID']; //默认的科目ID
          var logUid = loginUsr['UID']; //登录用户的UID
          var yongHuSet = loginUsr['用户设置']; //用户设置
          var lingYuId = dftKm['领域ID']; //默认的科目ID
          var ceYanUrl = '/ceyan'; //测验的url
          var qrcodeUrl = '/make_qrcode'; //生成二维码地址的url
          var wenJuanDiaoChaUrl = '/wenjuan_diaocha'; //问卷调查url
          var zhiShiDaGangUrl = '/zhishidagang'; //知识大纲
          var tiMuUrl = '/timu'; //题目的URL
          var yongHuUrl = '/yonghu'; //用户的增删改查
          var tiKuUrl = '/tiku'; //题库
          var uploadUrl = '/upload'; //命题的文件上传
          var yongHuWenJianUrl = '/yonghu_wenjian';
          var itemNumPerPage = 10; //每页多少条数据
          var paginationLength = 11; //分页显示多少也
          var classTestDataStore = ''; //存放随堂测验数据
          var keJianDataStore = ''; //存放课件数据
          var testUrl = 'https://www.zhifz.com/pub_test/'; //二维码的地址
          var tiMuIdArr = []; //获得查询题目ID的数组
          var pageArr = []; //根据得到的数据定义一个分页数组
          var allTiMuIds = ''; //存放所有题目id
          var qryTmPar = { //查询题目参数对象
            zsd: [], //知识点
            nd: '', //难度id
            tm: '', //题目id
            tk: [], //题库id
            //tx: '[1,2,3]', //题型id
            tx: '[1]', //题型id
            tmly: '', //题目来源ID
            ctr: '', //出题人UID
            ltr: ''  //录题人ID
          };
          $scope.letterArr = config.letterArr; //题支的序号
          $scope.cnNumArr = config.cnNumArr; //题支的序号
          $scope.smlLteArr = config.smlLteArr; //题支的序号
          $scope.tiXingArr = config.tiXingArr; //题型名称数组
          $scope.kjParams = {
            showErWeiMa: false, //显示二维码
            wrapTran: true, //class的转换
            tiMuLen: '', //题目数量
            allTkIds: [], //所有题库ID
            tiKuId: '', //题库ID
            sltTest: '' //选中的测验
          }; //课件参数
          $scope.pageParam = { //分页参数
            activePage: '',
            lastPage: '',
            pageArr: [],
            disPage: []
          };
          $scope.classTestDtl = ''; //课件详情
          $scope.newClassTest = {}; //新建课件
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
          $scope.kmtxList = [
            {
              '题型ID': 1,
              '题型名称': '单选题'
            }
            //{
            //  '题型ID': 2,
            //  '题型名称': '多选题'
            //},
            //{
            //  '题型ID': 3,
            //  '题型名称': '判断题'
            //}
          ];

          var tiMuId = $routeParams.id;

          /**
           * 设置用户的默认大纲
           */
          var setYongHuDefaultDg = function(parm){
            var pObj = {
              method: 'POST',
              url: yongHuUrl,
              data: {
                'UID': logUid,
                '用户设置': parm
              }
            };
            $http(pObj).success(function(pData){
              if(pData.result){
                loginUsr['用户设置'] = JSON.parse(parm);
                $cookieStore.put('ckUsr', JSON.stringify(loginUsr));
              }
              else{
                DataService.alertInfFun('err', pData.error);
              }
            });
          };

          /**
           * 查询题库
           */
          var qryTiKu = function(){
            var objZj = {method: 'GET', url: tiKuUrl, params: {'学校ID': jgID, '领域ID': lingYuId, '类型': 2}};
            var zjTk = [];
            var ggTk = [];
            qryTmPar.tk = [];
            $scope.tiKuList = [];
            $scope.tiKuPriList = [];
            $http(objZj).success(function(data){
              if(data.result){
                zjTk = data.data ? data.data : [];
                $scope.tiKuPriList = data.data || [];
                var objGg = {method: 'GET', url: tiKuUrl, params: {'领域ID': lingYuId, '类型': 1}};
                $http(objGg).success(function(ggData){
                  if(ggData.result){
                    ggTk = ggData.data ? ggData.data : [];
                    $scope.tiKuList = Lazy(zjTk).union(ggTk).toArray();
                    var allTkId = Lazy($scope.tiKuList).map(function(tk){ return tk['题库ID'];}).toArray();
                    $scope.kjParams.allTkIds = angular.copy(allTkId);
                    if(data.data && data.data.length > 0){
                      qryTmPar.tk.push(data.data[0]['题库ID']);
                      $scope.kjParams.tiKuId = data.data[0]['题库ID'];
                    }
                    else if(ggData.data && ggData.data.length > 0){
                      qryTmPar.tk.push(ggData.data[0]['题库ID']);
                      $scope.kjParams.tiKuId = ggData.data[0]['题库ID'];
                    }
                    else{
                      $scope.kjParams.tiKuId = '';
                    }
                    $scope.qryTestFun();
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
           * 获得大纲数据
           */
          var getDaGangData = function(){
            function _do(item) {
              item.ckd = false;
              item.fld = true;
              qryTmPar.zsd.push(item['知识点ID']);
              if(item['子节点'] && item['子节点'].length > 0){
                Lazy(item['子节点']).each(_do);
              }
            }
            var sltDg = '';
            var zjDg = [];
            var ggDg = [];
            qryTmPar.zsd = [];
            var reqSet = function(){
              sltDg = Lazy($scope.allZsdgData).find(function(dg){
                return dg['知识大纲ID'] == $scope.dgList[0]['知识大纲ID'];
              });
              if(sltDg){
                yongHuSet['默认大纲']['知识大纲ID'] = sltDg['知识大纲ID'];
                yongHuSet['默认大纲']['知识大纲名称'] = sltDg['知识大纲名称'];
                setYongHuDefaultDg(JSON.stringify(yongHuSet));
              }
              else{
                DataService.alertInfFun('err', '没有大纲！');
              }
            };
            var objZj = {method: 'GET', url: zhiShiDaGangUrl, params: {'学校ID': jgID, '科目ID': keMuId, '类型': 2}};
            $scope.dgList = [];
            $http(objZj).success(function(data){
              if(data.result){
                if(data.data){
                  zjDg = data.data;
                }
                var objGg = {method: 'GET', url: zhiShiDaGangUrl, params: {'科目ID': keMuId, '类型': 1}};
                $http(objGg).success(function(ggData){
                  if(ggData.result){
                    if(ggData.data){
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
                        reqSet();
                      }
                    }
                    else{
                      reqSet();
                    }
                    if(sltDg){
                      Lazy(sltDg['节点']).each(_do);
                      $scope.kjParams.slt_dg = sltDg['知识大纲ID'];
                      $scope.kowledgeList = sltDg;
                      qryTiKu();
                      if(tiMuId){
                        var obj = {
                          method: 'GET',
                          url: tiMuUrl,
                          params: {
                            '返回题目内容': true,
                            '题目ID': tiMuId
                          }
                        };
                        $http(obj).success(function(data){ //查询题目详情
                          if(data.result && data.data){
                            Lazy(data.data).each(function(tm, idx, lst){
                              tm = DataService.formatDaAn(tm);
                            });
                            $scope.editItem(data.data[0]);
                          }
                          else{
                            DataService.alertInfFun('err', data.error);
                          }
                        });
                      }
                    }
                    else{
                      $scope.kjParams.slt_dg = '';
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
           * 分页处理函数
           */
          var pageMake = function(data){
            $scope.pageParam = { //分页参数
              activePage: '',
              lastPage: '',
              pageArr: [],
              disPage: []
            };
            var dataLen = data.length; //数据长度
            var lastPage = Math.ceil(dataLen/itemNumPerPage); //最后一页
            $scope.kjParams.tiMuLen = dataLen;
            $scope.pageParam.pageArr = Lazy.generate(function(i) { return i + 1; }, lastPage).toArray();
            $scope.pageParam.lastPage = lastPage;
            $scope.pageParam.activePage = 1;
            cutPageFun(1);
            if(!$scope.kjParams.wrapTran){
              $scope.pageGetData(1);
            }
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
           * 查询题目详情
           */
          var qryTiMuDetail = function(tmArr){
            if(tmArr && tmArr.length > 0){
              $scope.loadingImgShow = true;
              var obj = {method: 'GET', url: tiMuUrl, params: {'返回题目内容': true, '题目ID': JSON.stringify(tmArr)}};
              $http(obj).success(function(data){ //查询题目详情
                if(data.result && data.data){
                  Lazy(data.data).each(function(tm, idx, lst){
                    tm = DataService.formatDaAn(tm);
                    tm.ckd = false;
                    if($scope.classTestPaper.length > 0){
                      Lazy($scope.classTestPaper).each(function(kjDt){
                        if(kjDt['题型ID'] == tm['题型ID']){
                          var fdTar = Lazy(kjDt['题目']).find(function(kj){
                            return kj['题目ID'] == tm['题目ID'];
                          });
                          if(fdTar){
                            tm.ckd = true;
                          }
                        }
                      });
                    }
                  });
                  $scope.timuDetails = Lazy(data.data).sortBy('题目ID').reverse().toArray();
                }
                else{
                  $scope.timuDetails = '';
                  DataService.alertInfFun('err', data.error);
                }
                $scope.loadingImgShow = false;
              });
            }
          };

          /**
           * 时间选择器
           */
          var datePickerFun = function(){
            var showDatePicker = function() {
              var myPicker = $('.start-date').intimidatetime({
                buttons: [
                  { text: '当前时间', classes: 'btn btn-default', action: function(inst){ inst.value( new Date() ); } }
                ]
              });
              myPicker.on('intimidatetime:close', function(e, date, inst){
                var clsSlt = document.querySelector('.start-date');
                $scope.newClassTest['测验设置']['时限'] = angular.element(clsSlt).val();
              });
            };
            $timeout(showDatePicker, 500);
          };

          /**
           * 查询课件列表
           */
          $scope.getClassTest = function(){
            var obj = {
              method: 'GET',
              url: ceYanUrl,
              params: {
                '学校ID': jgID,
                '创建人UID': logUid
              }
            };
            $http(obj).success(function(data){
              if(data.result && data.data){
                pageMake(data.data);
                classTestDataStore = Lazy(data.data).reverse().toArray();
                $scope.classTestDist(1);
              }
              else{
                classTestDataStore = '';
                DataService.alertInfFun('err', data.error);
              }
            });
            $scope.tabActive = 'stcy';
            $scope.txTpl = 'views/kejian/classTestList.html';
          };
          $scope.getClassTest();

          /**
           * 测验的分页数据查询函数
           */
          $scope.classTestDist = function(pg){
            var pgNum = pg - 1;
            var cutPage = pgNum ? pgNum : 0;
            cutPageFun(pg);
            $scope.classTestList = classTestDataStore.slice(cutPage * itemNumPerPage, (cutPage + 1) * itemNumPerPage);
          };

          /**
           * 查看测验详细
           */
          $scope.classTestDetail = function(id){
            var obj = {
              method: 'GET',
              url: wenJuanDiaoChaUrl,
              params: {
                '学校ID': jgID,
                '创建人UID': logUid,
                '测验ID': id
              }
            };
            $http(obj).success(function(data){
              if(data.result && data.data){
                //整理学生答题
                var tjArr = [];
                var distByTiMuId = Lazy(data.data).groupBy('题目ID').toObject();
                Lazy(distByTiMuId).each(function(v, k, l){
                  var tmObj = {
                    '题目ID': k,
                    '答案分析': []
                  };
                  var distByDaAn = Lazy(v).groupBy('答案').toObject();
                  Lazy(distByDaAn).each(function(v1, k1, l1){
                    var dafx = {
                      '答案': '',
                      '人数': ''
                    };
                    dafx['答案'] = k1;
                    if(v1 && v1.length > 0){
                      dafx['人数'] = Lazy(v1).reduce(function(memo, tm){ return memo + tm['人数']; }, 0);
                    }
                    else{
                      dafx['人数'] = 0;
                    }
                    tmObj['答案分析'].push(dafx);
                  });
                  tjArr.push(tmObj);
                });
                //查询题目详情
                var objCy = {
                  method: 'GET',
                  url: ceYanUrl,
                  params: {
                    '学校ID': jgID,
                    '创建人UID': logUid,
                    '测验ID': id,
                    '返回详情': true
                  }
                };
                $http(objCy).success(function(timu){
                  if(timu.result && timu.data){
                    Lazy(timu.data[0]['测验题目'][0]['题目']).each(function(item){
                      var daAnArr = [];
                      var tzLen = 0;
                      var fdTm = Lazy(tjArr).find(function(tj){
                        return tj['题目ID'] == item['题目ID'];
                      });
                      if(item['题型ID'] <= 2){
                        tzLen = item['题目内容']['选项'].length;
                      }
                      if(item['题型ID'] == 3){
                        tzLen = 2;
                      }
                      for(var i = 0; i < tzLen; i++){
                        var da = {
                          '答案': i,
                          '人数': 0
                        };
                        if(fdTm){
                          var fdDa = Lazy(fdTm['答案分析']).find(function(daxx){
                            return daxx['答案'] == i;
                          });
                          if(fdDa){
                            da['人数'] = fdDa['人数'];
                          }
                        }
                        daAnArr.push(da);
                      }
                      item['选项分析'] = daAnArr;
                    });
                    timu.data[0]['参与人数'] = timu.data[0]['参与人数'] || 1;
                    $scope.classTestDtl = timu.data[0];
                    $scope.txTpl = 'views/kejian/classTestDetail.html';
                  }
                  else{
                    $scope.classTestDtl = '';
                    DataService.alertInfFun('err', timu.error);
                  }
                });
              }
              else{
                DataService.alertInfFun('err', data.error || '缺少答题数据！');
              }
            });
          };

          /**
           * 删除测验
           */
          $scope.deleteClassTest = function(id){
            if(confirm('确定要删除此测验？')){
              var obj = {
                method: 'POST',
                url: ceYanUrl,
                data: {
                  '测验ID': id,
                  '状态': -1
                }
              };
              $http(obj).success(function(data){
                if(data.result){
                  classTestDataStore = Lazy(classTestDataStore).reject(function(kj){ return kj['测验ID'] == id}).toArray();
                  $scope.classTestList = Lazy($scope.classTestList).reject(function(kj){ return kj['测验ID'] == id}).toArray();
                  DataService.alertInfFun('suc', '删除成功！');
                }
                else{
                  DataService.alertInfFun('err', data.error);
                }
              });
            }
          };

          /**
           * 生成二维码
           */
          $scope.makeErWeiMa = function(ct){
            var obj = {
              method: 'GET',
              url: qrcodeUrl,
              params: {
                '测验ID': ct['测验ID']
              }
            };
            var idSlt = $('#QRCodeBox');
            $scope.kjParams.sltTest = ct;
            $http(obj).success(function(data){
              if(data.result && data.data){
                var textStr = testUrl + data.data['测验ID'];
                $scope.kjParams.showErWeiMa = true;
                idSlt.html('');
                new QRCode(document.getElementById('QRCodeBox'), {
                  text: textStr,
                  width: 300,
                  height: 300,
                  background: '#ccc',
                  foreground: 'red'
                });
                var showDatePicker = function() {
                  var imgDt = idSlt.find('img').prop('src');
                  $('#downloadEwm').prop('href', imgDt);
                };
                $timeout(showDatePicker, 500);
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
            });
          };

          /**
           * 返回考试组列表
           */
          $scope.backToList = function(){
            $scope.classTestDtl = '';
            $scope.getClassTest();
          };

          /**
           * 关闭弹出框
           */
          $scope.closePopup = function(){
            $scope.kjParams.showErWeiMa = false;
          };

          /**
           * 新增测验
           */
          $scope.addClassTest = function(){
            $scope.newClassTest = {
              '测验名称': '',
              '学校ID': jgID,
              '科目ID': keMuId,
              '测验设置': {
                '固定题目': true,
                '时限': '',
                '组卷规则': []
              }
            };
            $scope.tiMuArr = [
              {
                '大题名称': '单选题',
                '题型ID': 1,
                '题目': []
              },
              {
                '大题名称': '多选题',
                '题型ID': 2,
                '题目': []
              },
              {
                '大题名称': '判断题',
                '题型ID': 3,
                '题目': []
              }
            ];
            $scope.classTestPaper = [];
            //显示时间选择器
            datePickerFun();
            $scope.tabActive = 'xjcy';
            $scope.txTpl = 'views/kejian/addClassTest.html';
          };

          /**
           * 查询试题的函数分页
           */
          $scope.qryTestFun = function(parms){
            $scope.loadingImgShow = true;
            tiMuIdArr = [];
            pageArr = [];
            function _do(item) {
              qryTmPar.zsd.push(item['知识点ID']);
              if(item['子节点'] && item['子节点'].length > 0){
                Lazy(item['子节点']).each(_do);
              }
            }
            var obj = {method: 'GET', url: tiMuUrl, params: {'学校ID': jgID, '科目ID': keMuId, '返回题目内容': false}};
            if(parms == 'qryByTiMuId'){
              qryTmPar.zsd = [];
            }
            else{
              if(!(qryTmPar.zsd && qryTmPar.zsd.length > 0)){
                Lazy($scope.kowledgeList['节点']).each(_do);
              }
            }
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
            $http(obj).success(function(tmlb){ //查询题目列表
              if(tmlb.result && tmlb.data){
                var timuliebiao = Lazy(tmlb.data).sortBy('题目ID').reverse().toArray();
                allTiMuIds = angular.copy(timuliebiao);
                $scope.kjParams.wrapTran = false;
                pageMake(tmlb.data);
                $scope.txTpl = 'views/kejian/keJianTiMu.html';
              }
              else{
                $scope.pageParam = { //分页参数
                  activePage: '',
                  lastPage: '',
                  pageArr: [],
                  disPage: []
                };
                $scope.timuDetails = '';
                $scope.kjParams.tiMuLen = 0;
                DataService.alertInfFun('err', tmlb.error || '没有数据！');
              }
              $scope.loadingImgShow = false;
            });
          };

          /**
           * 得到分页数据
           */
          $scope.pageGetData = function(pg){
            var pgNum = pg - 1;
            var cutPage = pgNum ? pgNum : 0;
            cutPageFun(pg);
            var tmlbArr = allTiMuIds.slice(cutPage * itemNumPerPage, (cutPage + 1) * itemNumPerPage);
            var tmIds = Lazy(tmlbArr).map(function(tm){return tm['题目ID']}).toArray();
            qryTiMuDetail(tmIds);
          };

          /**
           * 显示试题列表
           */
          $scope.showTiMuList = function(){
            $scope.pageParam.currentPage = '';
            $scope.pageParam.pageArr = [];
            $scope.pageParam.disPage = [];
            $scope.timuDetails = '';
            $scope.kjParams.tiMuLen = '';
            allTiMuIds = '';
            $scope.txSelectenIdx = 0;
            //qryTmPar.tx = '[1,2,3]';
            qryTmPar.tx = '[1]';
            $scope.loadingImgShow = true;
            getDaGangData();
            Lazy($scope.nanDuList).each(function(nd){
              nd.ckd = false;
            });
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
            qryTmPar.zsd = [];
            function _do(item) {
              if(item.ckd){
                qryTmPar.zsd.push(item['知识点ID']);
              }
              if(item['子节点'] && item['子节点'].length > 0){
                Lazy(item['子节点']).each(_do);
              }
            }
            Lazy($scope.kowledgeList['节点']).each(_do);
            $scope.qryTestFun();
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
           * 通过录题库查询试题
           */
          $scope.qryTiMuByTiKu = function(){
            qryTmPar.tk = [];
            var fdTk = Lazy($scope.tiKuList).find(function(tk){
              return tk['题库ID'] == $scope.kjParams.tiKuId;
            });
            if($scope.kjParams.tiKuId){
              //if(fdTk && fdTk['类型'] == 1){
              //  qryTmPar.ctr = '';
              //  qryTmPar.ltr = '';
              //}
              //else{
              //  qryTmPar.ctr = logUid;
              //  qryTmPar.ltr = logUid;
              //}
              qryTmPar.tk.push($scope.kjParams.tiKuId);
            }
            else{
              //qryTmPar.ctr = logUid;
              //qryTmPar.ltr = logUid;
              qryTmPar.tk = angular.copy($scope.kjParams.allTkIds);
            }
            $scope.qryTestFun();
          };

          /**
           * 由所选的知识大纲，得到知识点
           */
          $scope.getDgZsdData = function(dgId){
            qryTmPar.zsd = [];
            function _do(item) {
              item.ckd = false;
              item.fld = true;
              qryTmPar.zsd.push(item['知识点ID']);
              if(item['子节点'] && item['子节点'].length > 0){
                Lazy(item['子节点']).each(_do);
              }
            }
            var sltDg = Lazy($scope.allZsdgData).find(function(dg){
              return dg['知识大纲ID'] == dgId;
            });
            if(!yongHuSet['默认大纲']['知识大纲ID'] || (yongHuSet['默认大纲']['知识大纲ID'] != dgId)){
              yongHuSet['默认大纲']['知识大纲ID'] = sltDg['知识大纲ID'];
              yongHuSet['默认大纲']['知识大纲名称'] = sltDg['知识大纲名称'];
              setYongHuDefaultDg(JSON.stringify(yongHuSet));
            }
            Lazy(sltDg['节点']).each(_do);
            $scope.kowledgeList = sltDg;
            $scope.qryTestFun();
          };

          /**
           * 将题加入试卷
           */
          $scope.addToPaper = function(tm){
            tm.ckd = true;
            Lazy($scope.tiMuArr).each(function(dt){
              if(dt['题型ID'] == tm['题型ID']){
                dt['题目'].push(tm);
              }
            });
          };

          /**
           * 移除题目
           */
          $scope.removeOut = function(tm){
            tm.ckd = false;
            Lazy($scope.tiMuArr).each(function(dt){
              if(dt['题型ID'] == tm['题型ID']){
                dt['题目'] = Lazy(dt['题目']).reject(function(tmd){
                  return tmd['题目ID'] == tm['题目ID'];
                }).toArray();
              }
            });
          };

          /**
           * 获得题型查询条件
           */
          $scope.getTiXingId = function(qrytxId){
            if(qrytxId >= 1){
              qryTmPar.tx = qrytxId;
              $scope.txSelectenIdx = qrytxId;
            }
            else{
              //qryTmPar.tx = '[1,2,3]';
              qryTmPar.tx = '[1]';
              $scope.txSelectenIdx = 0;
            }
            $scope.qryTestFun();
          };

          /**
           * 获得难度查询条件
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
            $scope.qryTestFun();
          };

          /**
           * 返回新建
           */
          $scope.backToAddPage = function(){
            $scope.classTestPaper = [];
            Lazy($scope.tiMuArr).each(function(kj){
              if(kj['题目'].length > 0){
                $scope.classTestPaper.push(kj);
              }
            });
            $scope.txTpl = 'views/kejian/addClassTest.html';
            //显示时间选择器
            datePickerFun();
            $scope.kjParams.wrapTran = true;
          };

          /**
           * 保存测验
           */
          $scope.saveClassTest = function(){
            Lazy($scope.classTestPaper).each(function(dt){
              var gzObj = {
                '大题名称': dt['大题名称'],
                '固定题目': []
              };
              Lazy(dt['题目']).each(function(tm){
                var tmObj = {
                  '题目ID': tm['题目ID'],
                  '分值': 1
                };
                gzObj['固定题目'].push(tmObj);
              });
              $scope.newClassTest['测验设置']['组卷规则'].push(gzObj);
            });
            //var clsSlt = document.querySelector('.start-date');
            //$scope.newClassTest['测验设置']['时限'] = angular.element(clsSlt).val();
            if($scope.newClassTest['测验设置']['组卷规则'].length > 0){
              $scope.newClassTest['测验设置'] = JSON.stringify($scope.newClassTest['测验设置']);
              $scope.loadingImgShow = true;
              var obj = {
                method: 'PUT',
                url: ceYanUrl,
                data: $scope.newClassTest
              };
              $http(obj).success(function(pData){
                if(pData.result){
                  $scope.kjParams.wrapTran = true;
                  $scope.getClassTest();
                  DataService.alertInfFun('suc', '保存成功！');
                }
                else{
                  DataService.alertInfFun('err', pData.error);
                }
                $scope.loadingImgShow = false;
              });
            }
            else{
              DataService.alertInfFun('pmt', '请选择题目！');
            }
          };

          /**
           * 测验的分页数据查询函数
           */
          $scope.keJianDist = function(pg){
            var pgNum = pg - 1;
            var cutPage = pgNum ? pgNum : 0;
            cutPageFun(pg);
            $scope.keJianList = keJianDataStore.slice(cutPage * itemNumPerPage, (cutPage + 1) * itemNumPerPage);
          };

          /**
           * 课件列表
           */
          $scope.getKeJianList = function(par){
            var obj = {
              method: 'GET',
              url: yongHuWenJianUrl,
              params: {
                '上传人': logUid
              }
            };
            $http(obj).success(function(data){
              if(data.result && data.data.length > 0){
                $scope.keJianList = data.data;
                pageMake(data.data);
                keJianDataStore = data.data;
                $scope.keJianDist(1);
              }
              else{
                keJianDataStore = '';
                $scope.keJianList = [];
                DataService.alertInfFun('err', data.error);
              }
            });
            if(!par){
              $scope.tabActive = 'kjgl';
              $scope.txTpl = 'views/kejian/keJianList.html';
            }
          };

          /**
           * 显示添加新课件
           */
          $scope.showKeJianAdd = function(){
            $scope.upLoadWrap = true;
          };

          /**
           * 文件上传
           */
            //存放上传文件的数组
          $scope.uploadFiles = [];

          //将选择的文件加入到数组
          $scope.fileNameChanged = function(element) {
            $scope.$apply(function($scope) {
              for (var i = 0; i < element.files.length; i++) {
                $scope.uploadFiles.push(element.files[i])
              }
            });
          };

          //添加文件
          $scope.addMyFile = function(){
            $('input.addFileBtn').click();
          };

          //删除选择的文件
          $scope.deleteSelectFile = function(idx){
            $scope.uploadFiles.splice(idx, 1);
            DataService.clearInput();
          };

          //关闭上传文件弹出层
          $scope.closeKeJianAdd = function(){
            $scope.upLoadWrap = false;
            $scope.uploadFiles = [];
            DataService.clearInput();
          };

          //保存上传文件
          $scope.uploadMyFiles = function() {
            var file = $scope.uploadFiles;
            var fileLen = file.length;
            var isFileSizeRight = true;
            var limitedFileSize = config.uploadFileSizeLimit; //文件大小限制，目前大小限制2MB
            Lazy($scope.uploadFiles).each(function(fl, idx, lst){
              if(fl.size > limitedFileSize){
                isFileSizeRight = false;
              }
            });
            if(isFileSizeRight){
              var fd = new FormData();
              fd.append('上传人', logUid);
              for(var i = 1; i <= fileLen; i++){
                fd.append(file[i - 1].name, file[i - 1]);
              }
              $scope.loadingImgShow = true;
              $http.post(uploadUrl, fd, {transformRequest: angular.identity, headers:{'Content-Type': undefined}}).success(function(data){
                if(data.result && data.data.length > 0){
                  $scope.uploadFiles = [];
                  $scope.getKeJianList('qry');
                }
                else{
                  DataService.alertInfFun('err', data.error);
                }
                $scope.loadingImgShow = false;
              });
            }
            else{
              DataService.alertInfFun('pmt', '文件大小不能超过：' + limitedFileSize/1024/1024 + 'MB');
            }
          };

          /**
           * 删除课件
           */
          $scope.deleteKeJian = function(kj){
            if(confirm('确定要删除此课件？')){
              var obj = {
                method: 'DELETE',
                url: yongHuWenJianUrl,
                params: {
                  '上传人': logUid,
                  '文件名称': kj['文件名称']
                }
              };
              $http(obj).success(function(data){
                if(data.result){
                  $scope.getKeJianList('qry');
                  DataService.alertInfFun('suc', '删除成功！');
                }
                else{
                  DataService.alertInfFun('err', data.error);
                }
              });
            }
          };

          /**
           * 重新加载 mathjax
           */
          $scope.$on('onRepeatLast', function(scope, element, attrs){
            MathJax.Hub.Config({
              tex2jax: {inlineMath: [['#$', '$#']], displayMath: [['#$$','$$#']]},
              messageStyle: 'none',
              showMathMenu: false,processEscapes: true
            });
            MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'paperWrap']);
            MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'testList']);
            MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'daGangList']);
          });

        }
      ]
    );
  }
);
