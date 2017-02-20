define(['angular', 'config', 'jquery', 'lazy', 'datepicker', 'qrcode'], // 000 开始
  function (angular, config, $, lazy, datepicker, qrcode) { // 001 开始
    'use strict';
    angular.module('zhifzApp.controllers.KejianCtrl', []) //controller 开始
      .controller('KejianCtrl', ['$rootScope', '$scope', '$http', '$location', '$timeout', 'DataService', '$cookieStore',
        function ($rootScope, $scope, $http, $location, $timeout, DataService, $cookieStore) { // 002 开始
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
          var wenJuanDiaoChaUrl = '/wenjuan_diaocha'; //问卷调查url
          var tiMuUrl = '/timu'; //题目的URL
          var yongHuUrl = '/yonghu'; //用户的增删改查
          var tiKuUrl = '/tiku'; //题库
          var uploadUrl = '/upload'; //命题的文件上传
          var yongHuWenJianUrl = '/yonghu_wenjian';
          var showFileUrl = '/show_file/';//文件显示
          var jiaoShiKeXuHaoUrl = '/jiaoshi_kexuhao'; //查询教师课序号
          var keXuHaoXueShengUrl = '/kexuhao_xuesheng'; //课序号学生
          var yongHuCeYanTi = '/yonghu_ceyan'; //查询用户测验
          var exportStuUrl = '/json2excel'; //导出考生
          var itemNumPerPage = 10; //每页多少条数据
          var paginationLength = 11; //分页显示多少也
          var classTestDataStore = ''; //存放随堂测验数据
          var keJianDataStore = ''; //存放课件数据
          var tiMuIdArr = []; //获得查询题目ID的数组
          var pageArr = []; //根据得到的数据定义一个分页数组
          var allTiMuIds = ''; //存放所有题目id
          var qryTmPar = { //查询题目参数对象
            zsd: [], //知识点
            nd: '', //难度id
            tm: '', //题目id
            tk: [], //题库id
            tx: '[1,2]', //题型id
            // tx: '[1]', //题型id
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
            tiMuLen: 0, //题目数量
            tiKuId: '', //题库ID
            sltTest: '', //选中的测验
            xuanZheTiZhi: '', //选择题题支内容
            addTiMuWrap: false, //添加随堂测验题目
            isAddTiMu: true, //是否为添加新题
            testType: '', //通过时间段选择测验
            tiMuEditFrom: '', //题目修改来源
            sltKxh: '', //选中课序号
            sltBj: '', //选中班级
            jsCeyan: '', //教师测验总数
            addNewTest: '' //新建测验关闭与否
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
          //var qryTiKu = function(){
          //  var objZj = {method: 'GET', url: tiKuUrl, params: {'学校ID': jgID, '领域ID': lingYuId, '类型': 2}};
          //  var zjTk = [];
          //  var ggTk = [];
          //  qryTmPar.tk = [];
          //  $scope.tiKuList = [];
          //  $scope.tiKuPriList = [];
          //  $http(objZj).success(function(data){
          //    if(data.result){
          //      zjTk = data.data ? data.data : [];
          //      $scope.tiKuPriList = data.data || [];
          //      var objGg = {method: 'GET', url: tiKuUrl, params: {'领域ID': lingYuId, '类型': 1}};
          //      $http(objGg).success(function(ggData){
          //        if(ggData.result){
          //          ggTk = ggData.data ? ggData.data : [];
          //          $scope.tiKuList = Lazy(zjTk).union(ggTk).toArray();
          //          var allTkId = Lazy($scope.tiKuList).map(function(tk){ return tk['题库ID'];}).toArray();
          //          $scope.kjParams.allTkIds = angular.copy(allTkId);
          //          if(data.data && data.data.length > 0){
          //            qryTmPar.tk.push(data.data[0]['题库ID']);
          //            $scope.kjParams.tiKuId = data.data[0]['题库ID'];
          //          }
          //          else if(ggData.data && ggData.data.length > 0){
          //            qryTmPar.tk.push(ggData.data[0]['题库ID']);
          //            $scope.kjParams.tiKuId = ggData.data[0]['题库ID'];
          //          }
          //          else{
          //            $scope.kjParams.tiKuId = '';
          //          }
          //          $scope.qryTestFun();
          //        }
          //        else{
          //          DataService.alertInfFun('err', ggData.error);
          //        }
          //      });
          //    }
          //    else{
          //      DataService.alertInfFun('err', data.error);
          //    }
          //  });
          //};

          /**
           * 获得大纲数据
           */
          //var getDaGangData = function(){
          //  function _do(item) {
          //    item.ckd = false;
          //    item.fld = true;
          //    qryTmPar.zsd.push(item['知识点ID']);
          //    if(item['子节点'] && item['子节点'].length > 0){
          //      Lazy(item['子节点']).each(_do);
          //    }
          //  }
          //  var sltDg = '';
          //  var zjDg = [];
          //  var ggDg = [];
          //  qryTmPar.zsd = [];
          //  var reqSet = function(){
          //    sltDg = Lazy($scope.allZsdgData).find(function(dg){
          //      return dg['知识大纲ID'] == $scope.dgList[0]['知识大纲ID'];
          //    });
          //    if(sltDg){
          //      yongHuSet['默认大纲']['知识大纲ID'] = sltDg['知识大纲ID'];
          //      yongHuSet['默认大纲']['知识大纲名称'] = sltDg['知识大纲名称'];
          //      setYongHuDefaultDg(JSON.stringify(yongHuSet));
          //    }
          //    else{
          //      DataService.alertInfFun('err', '没有大纲！');
          //    }
          //  };
          //  var objZj = {method: 'GET', url: zhiShiDaGangUrl, params: {'学校ID': jgID, '科目ID': keMuId, '类型': 2}};
          //  $scope.dgList = [];
          //  $http(objZj).success(function(data){
          //    if(data.result){
          //      if(data.data){
          //        zjDg = data.data;
          //      }
          //      var objGg = {method: 'GET', url: zhiShiDaGangUrl, params: {'科目ID': keMuId, '类型': 1}};
          //      $http(objGg).success(function(ggData){
          //        if(ggData.result){
          //          if(ggData.data){
          //            ggDg = ggData.data;
          //          }
          //          var allDaGangArr = Lazy(zjDg).union(ggDg).toArray();
          //          Lazy(allDaGangArr).each(function(dg){
          //            var dgObj = {
          //              '知识大纲ID': dg['知识大纲ID'],
          //              '知识大纲名称': dg['知识大纲名称']
          //            };
          //            $scope.dgList.push(dgObj);
          //          });
          //          $scope.allZsdgData = allDaGangArr;
          //          if(yongHuSet['默认大纲']['知识大纲ID']){
          //            sltDg = Lazy($scope.allZsdgData).find(function(dg){
          //              return dg['知识大纲ID'] == yongHuSet['默认大纲']['知识大纲ID'];
          //            });
          //            if(!sltDg){
          //              reqSet();
          //            }
          //          }
          //          else{
          //            reqSet();
          //          }
          //          if(sltDg){
          //            Lazy(sltDg['节点']).each(_do);
          //            $scope.kjParams.slt_dg = sltDg['知识大纲ID'];
          //            $scope.kowledgeList = sltDg;
          //            qryTiKu();
          //            if(tiMuId){
          //              var obj = {
          //                method: 'GET',
          //                url: tiMuUrl,
          //                params: {
          //                  '返回题目内容': true,
          //                  '题目ID': tiMuId
          //                }
          //              };
          //              $http(obj).success(function(data){ //查询题目详情
          //                if(data.result && data.data){
          //                  Lazy(data.data).each(function(tm, idx, lst){
          //                    tm = DataService.formatDaAn(tm);
          //                  });
          //                  $scope.editItem(data.data[0]);
          //                }
          //                else{
          //                  DataService.alertInfFun('err', data.error);
          //                }
          //              });
          //            }
          //          }
          //          else{
          //            $scope.kjParams.slt_dg = '';
          //            $scope.kowledgeList = '';
          //            DataService.alertInfFun('err', '没有符合的大纲数据！');
          //          }
          //        }
          //        else{
          //          DataService.alertInfFun('err', ggData.error);
          //        }
          //      });
          //    }
          //    else{
          //      DataService.alertInfFun('err', data.error);
          //    }
          //  });
          //};

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
            // $scope.kjParams.tiMuLen = dataLen;
            $scope.pageParam.pageArr = Lazy.generate(function(i) { return i + 1; }, lastPage).toArray();
            $scope.pageParam.lastPage = lastPage;
            $scope.pageParam.activePage = 1;
            cutPageFun(1);
            $scope.pageGetData(1);
            //if(!$scope.kjParams.wrapTran){
            //  $scope.pageGetData(1);
            //}
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
          $scope.getClassTest = function(state){
            var zt = [];
            var nowDate = new Date();
            var endDate = '';
            var obj = {
              method: 'GET',
              url: ceYanUrl,
              params: {
                // '学校ID': jgID,
                // '创建人UID': logUid,
                // '状态': JSON.stringify(zt)
              }
            };
            if(state){
              if(state == 'zero'){ //待录入和待发布
                zt = [2,3];
              }
              if(state == 'week'){ //一周以内的
                zt = [0,1];
                endDate = Date.parse(nowDate) - 604800000;
                obj.params['创建时间起始'] = DataService.formatDateZh(endDate);
              }
              if(state == 'month'){ //一月以内的
                zt = [0,1];
                endDate = Date.parse(nowDate) - 2592000000;
                obj.params['创建时间起始'] = DataService.formatDateZh(endDate);
              }
              $scope.kjParams.sltTest = '';
              $scope.ceYanTiMuArr = [];
              $scope.classTestDtl = '';
            }
            else{
              obj.params['学校ID'] = jgID;
              obj.params['创建人UID'] = logUid;
              zt = [0,1,2,3];
            }
            obj.params['状态'] = JSON.stringify(zt);
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
            if(!state){
              $scope.tabActive = 'stcy';
              $scope.txTpl = 'views/kejian/classTestList.html';
            }
          };

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
          $scope.classTestDetail = function(cy){
            var id = cy['测验ID'];
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
                    // $scope.txTpl = 'views/kejian/classTestDetail.html';
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
           * 关闭测验详情
           */
          $scope.backToTestList = function () {
            $scope.classTestDtl = '';
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
            var idSlt = $('#QRCodeBox');
            $scope.kjParams.sltTest = ct;
            var textStr = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxce8cd001cc56f537&redirect_uri=' +
              'https://www.zhifz.com/get_code?usrTp=stu_paper_' + ct['标签'] + '_' + ct['学校ID'] + '_' + ct['状态'] +
              '&response_type=code&scope=snsapi_base&state=STATE#wechat_redirect';
            $scope.kjParams.showErWeiMa = true;
            idSlt.html('');
            new QRCode(document.getElementById('QRCodeBox'), {
              text: textStr,
              //typeNumber: 4,
              correctLevel: QRCode.CorrectLevel.M,
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
          };

          /**
           * 开始和关闭测验
           */
          $scope.classTestSwitch = function(ct){
            ct['状态'] = + ct['状态'];
            if(confirm('你确定要修改测验的状态吗？')){
              var obj = {
                method: 'POST',
                url: ceYanUrl,
                data: {
                  '测验ID': ct['测验ID'],
                  '状态': ct['状态']
                }
              };
              $http(obj).success(function(data){
                if(data.result){
                  DataService.alertInfFun('pmt', '测验状态修改成功！');
                }
                else{
                  DataService.alertInfFun('err', data.error);
                }
              });
            }
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
                //'时限': '',
                '组卷规则': []
              },
              '状态': 0
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
            $scope.loopArr = [
              {itemVal: '', ckd: false},
              {itemVal: '', ckd: false},
              {itemVal: '', ckd: false},
              {itemVal: '', ckd: false}
            ];
            $scope.classTestPaper = [];
            $scope.kjParams.tiMuLen = 0;
            $scope.ceYanTiMuArr = [];
            //显示时间选择器
            datePickerFun();
            var qryTiMuFun = function(){
              qryTmPar.tk.push($scope.kjParams.tiKuId);
              qryTmPar.ctr = logUid;
              $scope.qryTestFun();
            };
            //查询题库
            var objGr = {
              method: 'GET',
              url: tiKuUrl,
              params: {
                '学校ID': jgID,
                '领域ID': lingYuId,
                '类型': 9
              }
            };
            $http(objGr).success(function(tiku){
              if(tiku.result && tiku.data){
                // $scope.timu['题库ID'] = tiku.data[0]['题库ID'];
                $scope.kjParams.tiKuId = tiku.data[0]['题库ID'];
                qryTiMuFun();
              }
              else{
                DataService.alertInfFun('err', '没有随堂测验题库，请联系学校管理员创建题库！');
                //var objNtk = {
                //  method: 'PUT',
                //  url: tiKuUrl,
                //  data: {
                //    '题库名称': '个人私有题库',
                //    '学校ID': jgID,
                //    '领域ID': lingYuId,
                //    '类型': 9
                //  }
                //};
                //$http(objNtk).success(function(data){
                //  if(data.result && data.data){
                //    //$scope.timu['题库ID'] = data.data['题库ID'];
                //    $scope.kjParams.tiKuId = data.data['题库ID'];
                //    qryTiMuFun();
                //  }
                //  else{
                //    DataService.alertInfFun('err', data.error);
                //  }
                //});
              }
            });
            $scope.tabActive = 'xjcy';
            $scope.kjParams.addNewTest = true;
            $scope.txTpl = 'views/kejian/addClassTest.html';
          };

          /**
           * 添加题目弹出
           */
          $scope.addNewTiMuPop = function(){
            $scope.timu = {
              '题库ID': $scope.kjParams.tiKuId,
              '科目ID': keMuId,
              '题型ID': 2,
              '题目内容': {
                '题干': '',
                '答案': '',
                '提示': ''
              },
              '难度': 3,
              '出题人UID': logUid,
              '备注': ''
            };
            $scope.kjParams.addTiMuWrap = true;
            $scope.kjParams.isAddTiMu = true;
          };

          /**
           * 关闭添加题目弹出
           */
          $scope.closeAddTiMuPop = function(){
            if($scope.kjParams.tiKuId){
              qryTmPar.tk.push($scope.kjParams.tiKuId);
              qryTmPar.ctr = logUid;
              $scope.qryTestFun();
            }
            $scope.kjParams.addTiMuWrap = false;
          };

          /**
           * 点击添加按钮添加一项题支输入框
           */
          $scope.addOneItem = function(){
            var vObj = {itemVal: '', ckd: false};
            $scope.loopArr.push(vObj);
          };

          /**
           * 点击删除按钮删除一项题支输入框
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
           * 显示单选题题干编辑器
           */
          $scope.showDanXuanTiGanEditor = function(){
            $('.formulaEditTiGan').markItUp(mySettings);
            DataService.tiMuContPreview();
          };

          /**
           * 显示单选题题支编辑器
           */
          $scope.showDanXuanTiZhiEditor = function(){
            $('.formulaEditTiZhi').markItUp(mySettings);
          };

          /**
           * 移除题干编辑器
           */
          $scope.removeTiGanEditor = function(){
            $('.formulaEditTiGan').markItUp('remove');
          };

          /**
           * 显示题干预览
           */
          $scope.previewTiGan = function(){
            var tgCont = $scope.timu['题目内容']['题干'];
            tgCont = tgCont.replace(/\n/g, '<br/>');
            $('#prevDoc').html(tgCont);
            MathJax.Hub.Config({
              tex2jax: {inlineMath: [['#$', '$#']], displayMath: [['#$$','$$#']]},
              messageStyle: 'none',
              showMathMenu: false,processEscapes: true
            });
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, "prevDoc"]);
          };

          /**
           * 显示题支预览
           */
          $scope.previewTiZhi = function(){
            var tzCont = $scope.kjParams.xuanZheTiZhi;
            tzCont = tzCont.replace(/\n/g, '<br/>');
            $('#prevTiZhiDoc').html(tzCont);
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, "prevTiZhiDoc"]);
          };

          /**
           * 给题支选项赋值
           */
          $scope.fuZhiFun = function(idx){
            var tzSlt = document.querySelector('.formulaEditTiZhi');
            $scope.loopArr[idx].itemVal = angular.element(tzSlt).val();
          };

          /**
           * 多选题选择答案的效果的代码
           */
          $scope.chooseDaAn = function(da){
            if($scope.timu['题型ID'] == 1){ //单选重置所有选项
              Lazy($scope.loopArr).each(function(tizhi, idx, lst){
                tizhi.ckd = false;
              });
            }
            da.ckd = !da.ckd;
          };

          /**
           * 保存题目
           */
          $scope.saveTiMu = function(fromImg){
            var mis = [];
            var tmId = '';
            var tiMuData = angular.copy($scope.timu);
            var tgSlt = document.querySelector('.formulaEditTiGan');
            tiMuData['题目内容']['题干'] = angular.element(tgSlt).val();
            var tzArr = [];
            var daArr = [];
            Lazy($scope.loopArr).each(function(tz, idx, lst){
              tz.itemVal ? tzArr.push(tz.itemVal) : mis.push('题支' + (idx + 1));
              if(tz.ckd){
                daArr.push(idx);
              }
            });
            tiMuData['题目内容']['选项'] = tzArr.length ? tzArr : [];
            if(daArr && daArr.length > 0){
              tiMuData['题目内容']['答案'] = $scope.timu['题型ID'] == 1 ? daArr[0] : daArr;
            }
            else{
              mis.push('答案');
            }
            if(!fromImg){
              Lazy(tiMuData).each(function(v, k, l){ //判断必要字段
                if(k == '题库ID' || k == '科目ID' || k == '题型ID'){
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
                return ;
              }
            }
            if(fromImg && $scope.kjParams.sltTest['状态'] < 2){
              var nwTiMuData = {
                '题目ID': tiMuData['题目ID'],
                '题目内容': tiMuData['题目内容']
              };
              tiMuData = nwTiMuData;
            }
            tiMuData['题目内容'] = JSON.stringify(tiMuData['题目内容']);
            var obj = {method: '', url: tiMuUrl, data: tiMuData};
            if($scope.kjParams.isAddTiMu){
              obj.method = 'PUT';
              delete obj.data['题目ID'];
            }
            else{
              obj.method = 'POST';
              tmId = tiMuData['题目ID'];
            }
            $scope.loadingImgShow = true;
            $http(obj).success(function(data){
              if(data.result){
                $scope.timu['题目内容'] = {
                  '题干': '',
                  '答案': '',
                  '提示': ''
                };
                $scope.timu['备注'] = '';
                $scope.kjParams.xuanZheTiZhi = '';
                var tzSlt = document.querySelector('.formulaEditTiZhi');
                angular.element(tzSlt).val('');
                $scope.loopArr = [{itemVal: '', ckd: false},{itemVal: '', ckd: false},{itemVal: '', ckd: false},{itemVal: '', ckd: false}];
                $('#prevDoc').html('');
                $('#prevTiZhiDoc').html('');
                if(!$scope.kjParams.isAddTiMu && $scope.kjParams.tiMuEditFrom != 'superUser'){
                  $scope.closeAddTiMuPop();
                }
                if(fromImg){
                  tmId = tmId || data.data['题目ID'];
                  $scope.saveCeYan(false, tmId);
                }
                $scope.kjParams.tiMuEditFrom = '';
                $scope.kjParams.isAddTiMu = true;
                DataService.alertInfFun('suc', '题目保存成功！');
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
              $scope.loadingImgShow = false;
            });
          };

          /**
           * 点击删除按钮删除一道题
           */
          $scope.deleteItem = function(tmid, idx){
            if (confirm('确定要删除此题吗？')) {
              var obj = {
                method: 'POST',
                url: tiMuUrl,
                data: {
                  '题目ID': tmid,
                  '状态': -1
                }
              };
              $http(obj).success(function(data){
                if(data.result){
                  $scope.timuDetails.splice(idx, 1);
                  // $scope.kjParams.tiMuLen -= 1;
                  DataService.alertInfFun('suc', '删除成功！');
                }
                else{
                  DataService.alertInfFun('pmt', data.error);
                }
              });
            }
          };

          /**
           * 题目修改
           */
          $scope.editItem = function(tm, usr){
            if(usr && usr == 'superUser'){
              $scope.kjParams.tiMuEditFrom = usr;
              $scope.timu['题目内容']['题干'] = tm['题目内容']['题干'];
              $scope.timu['题目内容']['提示'] = tm['题目内容']['提示'];
              $scope.timu['题目ID'] = tm['题目ID'];
            }
            else{
              $scope.timu = {
                '题库ID': tm['题库ID'],
                '科目ID': tm['科目ID'],
                '题型ID': tm['题型ID'],
                '题目ID': tm['题目ID'],
                '题目内容': {
                  '题干': tm['题目内容']['题干'],
                  '答案': '',
                  '提示': tm['题目内容']['提示']
                },
                '难度': tm['难度'],
                '出题人UID': tm['出题人UID'],
                '备注': tm['备注']
              };
              $scope.kjParams.tiMuEditFrom = '';
            }
            var daan = tm['题目内容']['答案'];
            var txId = tm['题型ID'];
            if(txId <= 2){
              $scope.loopArr = [];
              var daanArr = daan.split(',');
              var xuanXiang = tm['题目内容']['选项'];
              Lazy(xuanXiang).each(function(xx, idx, lst){
                var tiZhiObj = {itemVal: xx, ckd: false};
                if(txId == 1){
                  if($scope.letterArr[idx] == daanArr[0]){
                    tiZhiObj.ckd = true;
                  }
                }
                else{
                  var ifIn = Lazy(daanArr).contains($scope.letterArr[idx]);
                  if(ifIn){
                    tiZhiObj.ckd = true;
                  }
                }
                $scope.loopArr.push(tiZhiObj);
              });
            }
            $scope.kjParams.addTiMuWrap = true;
            $scope.kjParams.isAddTiMu = false;
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
            //else{
            //  if(!(qryTmPar.zsd && qryTmPar.zsd.length > 0)){
            //    Lazy($scope.kowledgeList['节点']).each(_do);
            //  }
            //}
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
                //$scope.kjParams.wrapTran = false;
                pageMake(tmlb.data);
              }
              else{
                $scope.pageParam = { //分页参数
                  activePage: '',
                  lastPage: '',
                  pageArr: [],
                  disPage: []
                };
                $scope.timuDetails = '';
                // $scope.kjParams.tiMuLen = 0;
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
            // $scope.kjParams.tiMuLen = '';
            allTiMuIds = '';
            $scope.txSelectenIdx = 0;
            qryTmPar.tx = '[1,2]';
            // qryTmPar.tx = '[1]';
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
          //$scope.qryTiMuByTiKu = function(){
          //  qryTmPar.tk = [];
          //  var fdTk = Lazy($scope.tiKuList).find(function(tk){
          //    return tk['题库ID'] == $scope.kjParams.tiKuId;
          //  });
          //  if($scope.kjParams.tiKuId){
          //    //if(fdTk && fdTk['类型'] == 1){
          //    //  qryTmPar.ctr = '';
          //    //  qryTmPar.ltr = '';
          //    //}
          //    //else{
          //    //  qryTmPar.ctr = logUid;
          //    //  qryTmPar.ltr = logUid;
          //    //}
          //    qryTmPar.tk.push($scope.kjParams.tiKuId);
          //  }
          //  else{
          //    //qryTmPar.ctr = logUid;
          //    //qryTmPar.ltr = logUid;
          //    qryTmPar.tk = angular.copy($scope.kjParams.allTkIds);
          //  }
          //  $scope.qryTestFun();
          //};

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
            $scope.kjParams.tiMuLen = 0;
            $scope.ceYanTiMuArr = [];
            Lazy($scope.tiMuArr).each(function(dt){
              if(dt['题型ID'] == tm['题型ID']){
                dt['题目'].push(tm);
              }
              if(dt['题目'].length){
                $scope.kjParams.tiMuLen += dt['题目'].length;
                $scope.ceYanTiMuArr = Lazy($scope.ceYanTiMuArr).union(dt['题目']).toArray();
              }
            });
            $scope.timuDetails = Lazy($scope.timuDetails).reject(function(xtm){
              return xtm['题目ID'] == tm['题目ID'];
            }).toArray();
          };

          /**
           * 移除题目
           */
          $scope.removeOut = function(tm){
            tm.ckd = false;
            $scope.kjParams.tiMuLen = 0;
            $scope.ceYanTiMuArr = [];
            Lazy($scope.tiMuArr).each(function(dt){
              if(dt['题型ID'] == tm['题型ID']){
                dt['题目'] = Lazy(dt['题目']).reject(function(tmd){
                  return tmd['题目ID'] == tm['题目ID'];
                }).toArray();
              }
              if(dt['题目'].length){
                $scope.kjParams.tiMuLen += dt['题目'].length;
                $scope.ceYanTiMuArr = Lazy($scope.ceYanTiMuArr).union(dt['题目']).toArray();
              }
            });
            $scope.timuDetails.unshift(tm);
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
              qryTmPar.tx = '[1,2]';
              // qryTmPar.tx = '[1]';
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
           * 关闭测验
           */
          $scope.closeAddNewTest = function(){
            $scope.getClassTest();
            $scope.kjParams.addNewTest = false;
          };

          /**
           * 保存测验
           */
          $scope.saveClassTest = function(){
            $scope.newClassTest['测验设置']['组卷规则'] = [];
            Lazy($scope.tiMuArr).each(function(dt){
              if(dt['题目'].length > 0){
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
              }
            });
            var newTestData = angular.copy($scope.newClassTest);
            //var clsSlt = document.querySelector('.start-date');
            //$scope.newClassTest['测验设置']['时限'] = angular.element(clsSlt).val();
            if(newTestData['测验设置']['组卷规则'].length > 0){
              newTestData['状态'] = + newTestData['状态'];
              newTestData['测验设置'] = JSON.stringify(newTestData['测验设置']);
              $scope.loadingImgShow = true;
              var obj = {
                method: 'PUT',
                url: ceYanUrl,
                data: newTestData
              };
              $http(obj).success(function(pData){
                if(pData.result){
                  //$scope.kjParams.wrapTran = true;
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
                '上传人': logUid,
                '状态': 1
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
          $scope.addMyFile = function(tp){
            $scope.kjParams.uploadType = tp;
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

          //关闭上传文件弹出层
          $scope.closeMediaPlugin = function(){
            $('#mediaPlugin').hide();
            $scope.kjParams.uploadType = '';
            $scope.uploadFiles = [];
            DataService.clearInput();
          };

          //保存上传文件(课件)
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

          //保存上传文件(测验)
          $scope.uploadMyFilesTest = function() {
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
              if($scope.timu['出题人UID']){
                fd.append('上传人', $scope.timu['出题人UID']);
              }
              else{
                fd.append('上传人', logUid);
              }
              for(var i = 1; i <= fileLen; i++){
                fd.append('file' + 1, file[i - 1]);
              }
              $scope.loadingImgShow = true;
              $http.post(uploadUrl, fd, {transformRequest: angular.identity, headers:{'Content-Type': undefined}}).success(function(data){
                if(data.result){
                  var i, mediaLength;
                  $scope.uploadFileUrl = data.data;
                  if(data.data && data.data.length > 0){
                    mediaLength = data.data.length;
                    for(i = 0; i < mediaLength; i++){
                      var src = showFileUrl + data.data[i]; //媒体文件路径
                      if($scope.kjParams.uploadType == 'img'){
                        $.markItUp(
                          { replaceWith:'<img src="'+src+'" alt=""(!( class="[![Class]!]")!) />' }
                        );
                      }
                      if($scope.kjParams.uploadType == 'mp3'){
                        $.markItUp(
                          { replaceWith:'<audio src="'+src+'" controls="controls" (!( class="[![Class]!]")!)></audio>' }
                        );
                      }
                      if($scope.kjParams.uploadType == 'video'){
                        $.markItUp(
                          { replaceWith:'<video src="'+src+'" controls="controls" (!( class="[![Class]!]")!)></video>' }
                        );
                      }
                    }
                    $('#mediaPlugin').hide();
                    $('.formulaEditTiGan').keyup();
                  }
                  else{
                    DataService.alertInfFun('err', '没有文件！');
                  }
                }
                else{
                  DataService.alertInfFun('err', data.error);
                }
                $scope.uploadFiles = [];
                $scope.kjParams.uploadType = '';
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
           * 超级用户的录题页面
           */
          var currentPath = $location.$$path;
          if(currentPath == '/kejian/luti'){
            $scope.ceYanTiMuArr = [];
            $scope.kjParams.testType = 'zero';
            $scope.getClassTest('zero');
          }
          else{
            $scope.kjParams.testType = '';
            $scope.getClassTest();
          }

          /**
           * 查询状态为2的测验
           */
          $scope.getTestImg = function(cy){
            $scope.classTestDtl = {
              '测验名称': cy['测验名称'],
              '图片ID': ''
            };
            $scope.timu = {
              '题库ID': $scope.kjParams.tiKuId,
              '科目ID': '',
              '题型ID': 2,
              '题目内容': {
                '题干': '',
                '答案': '',
                '提示': ''
              },
              '难度': 3,
              '出题人UID': '',
              '备注': ''
            };
            $scope.loopArr = [
              {itemVal: '', ckd: false},
              {itemVal: '', ckd: false},
              {itemVal: '', ckd: false},
              {itemVal: '', ckd: false}
            ];
            $scope.kjParams.sltTest = cy;
            $scope.ceYanTiMuArr = [];
            if(cy['测验设置']['教师']){ //手机出题
              var js = cy['测验设置']['教师'];
              $scope.timu['科目ID'] = js['科目ID'];
              $scope.timu['出题人UID'] = js['UID'];
              //查询题库
              var objGr = {
                method: 'GET',
                url: tiKuUrl,
                params: {
                  '学校ID': js['学校ID'],
                  '领域ID': js['领域ID'],
                  '类型': 9
                }
              };
              $http(objGr).success(function(tiku){
                if(tiku.result && tiku.data){
                  $scope.kjParams.tiKuId = tiku.data[0]['题库ID'];
                  $scope.timu['题库ID'] = tiku.data[0]['题库ID'];
                }
                else{
                  var objNtk = {
                    method: 'PUT',
                    url: tiKuUrl,
                    data: {
                      '题库名称': js['领域名称'] + '随堂测验题库',
                      '学校ID': js['学校ID'],
                      '领域ID': js['领域ID'],
                      '类型': 9
                    }
                  };
                  $http(objNtk).success(function(data){
                    if(data.result && data.data){
                      $scope.kjParams.tiKuId = data.data['题库ID'];
                      $scope.timu['题库ID'] = tiku.data['题库ID'];
                    }
                    else{
                      DataService.alertInfFun('err', data.error);
                    }
                  });
                }
              });
              qryCyDtl();
              if(cy['测验设置']['图片ID'] && cy['测验设置']['图片ID'].length > 0){
                $scope.classTestDtl['图片ID'] = cy['测验设置']['图片ID'].reverse();
              }
              else{
                DataService.alertInfFun('pmt', '缺少题目图片信息！');
              }
            }
            else{ //pc出题
              qryCyDtl();
            }
            $scope.kjParams.isAddTiMu = true;
          };
          // $scope.getTestImg = function(cy){
          //   $scope.classTestDtl = {
          //     '测验名称': cy['测验名称'],
          //     '图片ID': ''
          //   };
          //   $scope.timu = {
          //     '题库ID': $scope.kjParams.tiKuId,
          //     '科目ID': '',
          //     '题型ID': 2,
          //     '题目内容': {
          //       '题干': '',
          //       '答案': '',
          //       '提示': ''
          //     },
          //     '难度': 3,
          //     '出题人UID': '',
          //     '备注': ''
          //   };
          //   $scope.loopArr = [
          //     {itemVal: '', ckd: false},
          //     {itemVal: '', ckd: false},
          //     {itemVal: '', ckd: false},
          //     {itemVal: '', ckd: false}
          //   ];
          //   $scope.kjParams.sltTest = cy;
          //   $scope.ceYanTiMuArr = [];
          //   if(cy['测验设置']['教师']){
          //     var js = cy['测验设置']['教师'];
          //     $scope.timu['科目ID'] = js['科目ID'];
          //     $scope.timu['出题人UID'] = js['UID'];
          //     //查询题库
          //     var objGr = {
          //       method: 'GET',
          //       url: tiKuUrl,
          //       params: {
          //         '学校ID': js['学校ID'],
          //         '领域ID': js['领域ID'],
          //         '类型': 9
          //       }
          //     };
          //     $http(objGr).success(function(tiku){
          //       if(tiku.result && tiku.data){
          //         $scope.kjParams.tiKuId = tiku.data[0]['题库ID'];
          //         $scope.timu['题库ID'] = tiku.data[0]['题库ID'];
          //       }
          //       else{
          //         var objNtk = {
          //           method: 'PUT',
          //           url: tiKuUrl,
          //           data: {
          //             '题库名称': js['领域名称'] + '随堂测验题库',
          //             '学校ID': js['学校ID'],
          //             '领域ID': js['领域ID'],
          //             '类型': 9
          //           }
          //         };
          //         $http(objNtk).success(function(data){
          //           if(data.result && data.data){
          //             $scope.kjParams.tiKuId = data.data['题库ID'];
          //             $scope.timu['题库ID'] = tiku.data['题库ID'];
          //           }
          //           else{
          //             DataService.alertInfFun('err', data.error);
          //           }
          //         });
          //       }
          //     });
          //     qryCyDtl();
          //   }
          //   else{
          //     DataService.alertInfFun('pmt', '缺少出题人信息！');
          //   }
          //   if(cy['测验设置']['图片ID'] && cy['测验设置']['图片ID'].length > 0){
          //     $scope.classTestDtl['图片ID'] = cy['测验设置']['图片ID'].reverse();
          //   }
          //   else{
          //     DataService.alertInfFun('pmt', '缺少题目图片信息！');
          //   }
          //   $scope.kjParams.isAddTiMu = true;
          // };

          /**
           * 保存图片录题测验
           */
          $scope.saveCeYan = function(zt, tmid){
            var sltCy = $scope.kjParams.sltTest;
            var copySet = '';
            var obj = {
              method: 'POST',
              url: ceYanUrl,
              data: {
                '测验ID': sltCy['测验ID'],
                '测验设置': {
                  '固定题目': true,
                  '组卷规则': [],
                  '图片ID': sltCy['测验设置']['图片ID'],
                  '微信ID': sltCy['测验设置']['微信ID'],
                  '教师': sltCy['测验设置']['教师']
                }
              }
            };
            var saveFun = function () {
              $scope.loadingImgShow = true;
              $http(obj).success(function(pData){
                if(pData.result){
                  if(zt){
                    $scope.getClassTest('zero');
                    $scope.closeThisCeYan();
                    DataService.alertInfFun('suc', '测验保存成功！');
                  }
                  else{
                    $scope.kjParams.sltTest['测验设置'] = copySet;
                    qryCyDtl();
                  }
                }
                else{
                  DataService.alertInfFun('err', pData.error);
                }
                $scope.loadingImgShow = false;
              });
            };
            if(zt == 2){ //题目已经录完，修改测验状态为待发布
              delete obj.data['测验设置'];
              obj.data['状态'] = 3;
              $scope.kjParams.sltTest = '';
              saveFun();
            }
            else if(zt == 3){ //发布测验
              delete obj.data['测验设置'];
              obj.data['状态'] = 0;
              obj.data['通知老师'] = true;
              obj.data['标签'] = sltCy['标签'];
              obj.data['微信ID'] = sltCy['测验设置']['微信ID'];
              obj.data['测验名称'] = sltCy['测验名称'];
              obj.data['姓名'] = sltCy['测验设置']['教师']['姓名'];
              $scope.kjParams.sltTest = '';
              saveFun();
            }
            else{ //还在录题
              if(sltCy['测验设置']['组卷规则'] && sltCy['测验设置']['组卷规则'].length > 0){
                obj.data['测验设置']['组卷规则'] = sltCy['测验设置']['组卷规则'];
              }
              else{
                obj.data['测验设置']['组卷规则'].push({'大题名称': '多选题', '固定题目': []});
              }
              Lazy(obj.data['测验设置']['组卷规则']).each(function(dt){
                if(dt['大题名称'] == '多选题' && tmid){
                  var tmObj = {
                    '题目ID': tmid,
                    '分值': 1
                  };
                  dt['固定题目'].push(tmObj);
                }
              });
              copySet = angular.copy(obj.data['测验设置']);
              obj.data['测验设置'] = JSON.stringify(obj.data['测验设置']);
              saveFun();
            }
          };

          /**
           * 查询测验详情
           */
          var qryCyDtl = function(){
            var obj = {
              method: 'GET',
              url: ceYanUrl,
              params: {
                '测验ID': '',
                '返回详情': true
              }
            };
            $scope.ceYanTiMuArr = [];
            if($scope.kjParams.sltTest && $scope.kjParams.sltTest['测验ID']){
              obj.params['测验ID'] = $scope.kjParams.sltTest['测验ID'];
            }
            else{
              DataService.alertInfFun('pmt', '请选择测验！');
              return ;
            }
            $http(obj).success(function(data){
              if(data.result && data.data){
                var timu = data.data[0]['测验题目'];
                Lazy(timu).each(function (dt) {
                  if(dt['题目'] && dt['题目'].length > 0){
                    Lazy(dt['题目']).each(function (tm) {
                      tm = DataService.formatDaAn(tm);
                    });
                    $scope.ceYanTiMuArr = Lazy($scope.ceYanTiMuArr).union(dt['题目']).toArray();
                  }
                });
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
            });
          };

          /**
           * 关闭测验
           */
          $scope.closeThisCeYan = function(){
            $scope.kjParams.sltTest = '';
            $scope.ceYanTiMuArr = [];
            $scope.classTestDtl = '';
          };

          /**
           * 查询测验成绩
           */
          $scope.getTestScore = function(){
            var objKxh = {
              method: 'GET',
              url: jiaoShiKeXuHaoUrl,
              params: {
                'UID': logUid
              }
            };
            $scope.ceYanTongJiDt = {
              bjName: '',
              bjPepNum: '',
              stus: []
            };
            $scope.kxhList = [];
            $scope.banJiList = [];
            var allKxhIds = [];
            $scope.kjParams.jsCeyan = [];
            $http(objKxh).success(function(data){
              if(data.result && data.data){
                $scope.kxhList = data.data;
                Lazy(data.data).each(function(kxh){
                  if(kxh['课序号ID'] > 0){
                    allKxhIds.push(+kxh['课序号ID']);
                  }
                });
              }
              else {
                DataService.alertInfFun('err', data.error);
              }
            })
              .then(function(){
                var objXs = {
                  method: 'GET',
                  url: keXuHaoXueShengUrl,
                  params:{
                    '课序号ID': JSON.stringify(allKxhIds)
                  }
                };
                $http(objXs).success(function (stus) {
                  if(stus.result && stus.data){
                    var distByBjId = Lazy(stus.data).groupBy('班级ID').toObject(); //学生安装班级ID分组
                    var distKxhId = Lazy(stus.data).groupBy('课序号ID').toObject(); //学生安课序号ID分组
                    Lazy(distByBjId).each(function (v, k, l) { //按班级分数据
                      var bjObj = {
                        '班级ID': '',
                        '班级名称': '',
                        '学生': v
                      };
                      if(k != 'null'){
                        bjObj['班级ID'] = +k;
                        bjObj['班级名称'] = v[0]['班级名称'];
                        $scope.banJiList.push(bjObj);
                      }
                      // else{
                      //   bjObj['班级ID'] = -1;
                      //   bjObj['班级名称'] = '无班级';
                      // }
                      // $scope.banJiList.push(bjObj);
                    });
                    Lazy(distKxhId).each(function (v, k, l) { //按课序号分数据
                      Lazy($scope.kxhList).each(function(kxh){
                        if(kxh['课序号ID'] == +k){
                          kxh['学生'] = v || [];
                        }
                      });
                    });
                  }
                  else{
                    DataService.alertInfFun('err', stus.error);
                  }
                })
              })
              .then(function(){
                var obj = {
                  method: 'GET',
                  url: ceYanUrl,
                  params: {
                    '学校ID': jgID,
                    '创建人UID': logUid,
                    '状态': JSON.stringify([0, 1])
                  }
                };
                $http(obj).success(function (data) {
                  if(data.result && data.data){
                    $scope.kjParams.jsCeyan = data.data;
                  }
                  else{
                    DataService.alertInfFun('err', data.error);
                  }
                });
              });
            $scope.tabActive = 'cycj';
            $scope.txTpl = 'views/kejian/testScore.html';
          };

          /**
           * 查询统计数据
           */
          $scope.getTongJiDt = function(id, tp){
            $scope.ceYanTongJiDt = {
              bjName: '',
              bjPepNum: '',
              stus: []
            };
            var allStuIds = [];
            var findTar = '';
            var allTestNums = [];
            var allTestLen = 0;
            if(id && tp == 'kxh'){
              findTar = Lazy($scope.kxhList).find(function(kxh){ //查询课序号
                return kxh['课序号ID'] == id;
              });
              allTestNums = Lazy($scope.kjParams.jsCeyan).filter(function (cy) {
                return cy['课序号ID'] == id;
              }).toArray();
              allTestLen = allTestNums.length || 0;
              if(findTar){
                $scope.ceYanTongJiDt.bjName = findTar['课序号名称'];
              }
              else{
                DataService.alertInfFun('err', '没有课序号数据！');
                return ;
              }
            }
            if(id && tp == 'bj'){
              findTar = Lazy($scope.banJiList).find(function(bj){ //查询班级
                return bj['课序号ID'] == id;
              });
              if(findTar){
                $scope.ceYanTongJiDt.bjName = findTar['班级名称'];
              }
              else{
                DataService.alertInfFun('err', '没有班级数据！');
                return ;
              }
            }
            $scope.ceYanTongJiDt.bjPepNum = findTar['学生'].length;
            $scope.ceYanTongJiDt.stus = findTar['学生'];
            Lazy(findTar['学生']).each(function(stu){
              if(stu['UID']){
                allStuIds.push(stu['UID']);
              }
            });
            var objUid = {
              method: 'GET',
              url: yongHuCeYanTi,
              params: {
                'UID': JSON.stringify(allStuIds)
              }
            };
            $http(objUid).success(function(data){
              if(data.result && data.data){
                var disByUid = Lazy(data.data).groupBy('UID').toObject();
                Lazy(disByUid).each(function(v, k, l){
                  var newObj = {
                    '总测验次数': allTestLen || 0,
                    '参与测验次数': v.length || 0,
                    '正确题数': 0,
                    '总题数': 0
                  };
                  if(v && v.length > 0){
                    Lazy(v).each(function(stu){
                      newObj['正确题数'] += stu['答对数'];
                      newObj['总题数'] += stu['答题数'];
                    });
                    Lazy($scope.ceYanTongJiDt.stus).each(function (stu) {
                      if(stu['UID'] == +k){
                        stu['测验成绩'] = newObj;
                      }
                    });
                  }
                });
                console.log($scope.ceYanTongJiDt);
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
            });
          };

          /**
           * 导出学生测验名单
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
          $scope.exportTestScore = function () {
            var ksData = {};
            var sheetName = $scope.ceYanTongJiDt.bjName || '学生名单';
            var ksArr = [];
            var exportStu = Lazy($scope.ceYanTongJiDt.stus).sortBy(function(stu){
              return stu['学号'];
            }).toArray();
            var node = document.getElementById('formDownload');
            if(node){
              node.parentNode.removeChild(node);
            }
            Lazy(exportStu).each(function(ks){
              var ksObj = {};
              ksObj['学号'] = ks['学号'];
              ksObj['姓名'] = ks['姓名'];
              ksObj['课序号'] = ks['课序号名称'];
              ksObj['班级'] = ks['班级名称'];
              if(ks['测验成绩']){
                ksObj['参与测验次数'] = ks['测验成绩']['参与测验次数'];
                ksObj['总测验次数'] = ks['测验成绩']['总测验次数'];
                ksObj['正确题数'] = ks['测验成绩']['正确题数'];
                ksObj['总题数'] = ks['测验成绩']['总题数'];
              }
              else{
                ksObj['参与测验次数'] = 0;
                ksObj['总测验次数'] = 0;
                ksObj['正确题数'] = 0;
                ksObj['总题数'] = 0;
              }
              ksArr.push(ksObj);
            });
            ksData[sheetName] = ksArr;
            submitFORMDownload(exportStuUrl, {json: JSON.stringify(ksData)}, 'post');
          };

          /**
           * 退出程序
           */
          $scope.signOut = function(){
            DataService.logout();
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
            MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'testList1']);
            MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'daGangList']);
          });

        }]
      );
  });
