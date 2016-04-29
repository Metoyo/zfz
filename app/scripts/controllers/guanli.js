define(['angular', 'config', 'jquery', 'lazy', 'mathjax'], function (angular, config, $, lazy, mathjax) {
  'use strict';
  angular.module('zhifzApp.controllers.GuanLiCtrl', [])
    .controller('GuanLiCtrl', ['$rootScope', '$scope', 'DataService', '$http', '$timeout', '$cookieStore',
      function ($rootScope, $scope, DataService, $http, $timeout, $cookieStore) {

        /**
         * 声明变量
         */
        //var kxhManageUrl = baseRzAPIUrl + 'kexuhao'; //课序号管理的url
        //var qryTeacherUrl = baseRzAPIUrl + 'query_jgly_teacher?token=' + token + '&jigouid=' + jigouid +
        //  '&lingyuid=' + lingyuid; //查询本机构下教师
        //var numPerPage = 10; //每页10条数据
        //var keXuHaoPagesArr = []; //存放课序号分页的数组
        //var keXuHaoStore; //存放课序号原始数据
        //var paginationLength = 7; //分页部分，页码的长度，目前设定为7
        //var chaXunStuBaseUrl = baseRzAPIUrl + 'query_student'; //查询机构下面的用户
        //var modifyKxhYh = baseRzAPIUrl + 'kexuhao_yonghu'; //修改课序号下面的用户
        //var singleYhAddToKxh = baseRzAPIUrl + 'add_yonghu_withkxh'; //单个新用户添加课序号
        //var totalStuPage = []; //所有的课序号考生的页码数
        //var regKxh = /^[a-zA-Z0-9_-]+$/; //检测课序号
        //var chaxunzilingyu = true;
        //var qryKaoShiZuListUrl = baseKwAPIUrl + 'query_kaoshizu_liebiao?token=' + token + '&caozuoyuan='
        //  + caozuoyuan + '&jigouid=' + jigouid + '&lingyuid=' + lingyuid; //查询考试列表的url
        //var qryMoRenDgUrl = baseMtAPIUrl + 'chaxun_zhishidagang?token=' + token + '&caozuoyuan=' + caozuoyuan + '&jigouid='
        //  + jigouid + '&lingyuid=' + lingyuid + '&chaxunzilingyu=' + chaxunzilingyu + '&moren=1'; //查询默认知识大纲的url
        //var qryKnowledgeBaseUrl = baseMtAPIUrl + 'chaxun_zhishidagang_zhishidian?token=' + token + '&caozuoyuan=' +
        //  caozuoyuan + '&jigouid=' + jigouid + '&lingyuid=' + lingyuid + '&zhishidagangid='; //查询知识点基础url
        //var kaoShiZuZhiShiDianUrl = baseTjAPIUrl + 'kaoshizu_zhishidian'; //保存考试组知识点
        //var kwKaoShiZuZhiShiDianUrl = baseKwAPIUrl + 'get_ksz_zsd'; //考位查询试组知识点
        //var selectData = ''; //考试组和知识点用到变量
        var loginUsr = JSON.parse($cookieStore.get('ckUsr'));
        var dftKm = JSON.parse($cookieStore.get('ckKeMu')); //默认选择的科目
        var jgID = loginUsr['学校ID']; //登录用户学校
        var logUid = loginUsr['UID']; //登录用户的UID
        var keMuId = dftKm['科目ID']; //默认的科目ID
        var lingYuId = dftKm['领域ID']; //默认的科目ID
        var keMuJiaoShiUrl = '/kemu_jiaoshi'; //学校教师
        var keXuHaoUrl = '/kexuhao'; //课序号
        var kxhJiaoShiUrl = '/kexuhao_jiaoshi'; //课序号教师
        var kxhXueShengUrl = '/kexuhao_xuesheng '; //课序号学生
        var impYongHuUrl = '/imp_yonghu'; //导入用户
        $scope.defaultKeMu = dftKm; //默认科目
        $scope.guanliParams = {
          tabActive: '',
          addNewKxh: '', //添加课序号
          addNewKxhSetting: '', //添加课序号设置
          modifyKxh: '', //课序号修改
          singleStuName: '', //学生姓名
          singleStuID: '', //学生学号
          singleStuBanJi: '', //学生班级
          errorInfo: '',
          selectKsz: '' //选中的考试组
        };
        $scope.glEditBoxShow = ''; //弹出层显示那一部分内容
        $scope.jgKmTeachers = ''; //本机构科目下的老师
        $scope.keXuHaoPgData = ''; //课序号数据
        $scope.glSelectData = ''; //课序号保存是选中的课序号
        $scope.selectKxh = ''; //选中的课序号
        $scope.showMoreBtn = false; //课序号管理更多按钮

        /**
         * 查询科目下的老师 --
         */
        var qryKeMuTeachers = function(){
          var obj = {method:'GET', url:keMuJiaoShiUrl, params:{'学校ID':jgID, '科目ID':keMuId}};
          $http(obj).success(function(data){
            if(data.result){
              $scope.jgKmTeachers = data.data;
            }
            else{
              DataService.alertInfFun('err', data.error);
            }
          });
          //$http.get(qryTeacherUrl).success(function(data){
          //  if(data && data.length > 0){
          //    if(itmeType && (itmeType == 'modifyKeXuHao')){
          //      if(jsArr && jsArr.length > 0){
          //        Lazy(jsArr).each(function(sjs){
          //          Lazy(data).each(function(js){
          //            if(js.UID == sjs.UID){
          //              js.ckd = true;
          //            }
          //          });
          //        });
          //      }
          //    }
          //    $scope.jgKmTeachers = data;
          //  }
          //  else{
          //    DataService.alertInfFun('err', data.error);
          //  }
          //});
        };
        //qryKeMuTeachers();

        /**
         * 查询课序号下的老师 --
         */
        var qryKeXuHaoTeachers = function(ids){
          var obj = {method:'GET', url:kxhJiaoShiUrl, params:{'课序号ID':''}};
          obj.params['课序号ID'] = JSON.stringify(ids);
          $http(obj).success(function(data){
            if(data.result){
              $scope.jgKmTeachers = data.data;
            }
            else{
              DataService.alertInfFun('err', data.error);
            }
          });
          //$http.get(qryTeacherUrl).success(function(data){
          //  if(data && data.length > 0){
          //    if(itmeType && (itmeType == 'modifyKeXuHao')){
          //      if(jsArr && jsArr.length > 0){
          //        Lazy(jsArr).each(function(sjs){
          //          Lazy(data).each(function(js){
          //            if(js.UID == sjs.UID){
          //              js.ckd = true;
          //            }
          //          });
          //        });
          //      }
          //    }
          //    $scope.jgKmTeachers = data;
          //  }
          //  else{
          //    DataService.alertInfFun('err', data.error);
          //  }
          //});
        };
        //qryKeMuTeachers();

        /**
         * 查询课序号 --
         */
        var queryKeXuHao = function(){
          var objKxh = {method:'GET', url:keXuHaoUrl, params:{'学校ID': jgID, '科目ID': keMuId, '返回学生人数': true}};
          $http(objKxh).success(function(data){
            if(data.result){
              var objJs = {method:'GET', url:kxhJiaoShiUrl, params:{'课序号ID':''}};
              var kxhIds = Lazy(data.data).map(function(kxh){ return kxh['课序号ID']}).toArray();
              objJs.params['课序号ID'] = JSON.stringify(kxhIds);
              $http(objJs).success(function(tech){
                if(tech.result){
                  Lazy(data.data).each(function(kxh){
                    kxh['教师'] = Lazy(tech.data).filter(function(th){
                      return th['课序号ID'] == kxh['课序号ID'];
                    }).toArray();
                  });
                  $scope.keXuHaoData = data.data;
                }
                else{
                  DataService.alertInfFun('err', tech.error);
                }
              });
            }
            else{
              DataService.alertInfFun('err', data.error);
            }
          });
          //$http.get(qryKxhUrl).success(function(data){
          //  if(data && data.length > 0){
          //    var dataLength = data.length; //所以二级专业长度
          //    var sortData = Lazy(data).sortBy(function(stu){
          //      return stu.KEXUHAO_MINGCHENG;
          //    }).toArray();
          //    Lazy(sortData).each(function(kxh){
          //      kxh.jiaoShiStr = Lazy(kxh.JIAOSHI).map(function(js){
          //        return js.XINGMING;
          //      }).toArray().join(';');
          //    });
          //    if(dataLength > 10){
          //      var lastPage = Math.ceil(dataLength/numPerPage); //最后一页
          //      $scope.lastKxhPageNum = lastPage;
          //      keXuHaoPagesArr = [];
          //      if(lastPage){
          //        for(var i = 1; i <= lastPage; i++){
          //          keXuHaoPagesArr.push(i);
          //        }
          //      }
          //      keXuHaoStore = sortData;
          //      $scope.keXuHaoDist(1);
          //    }
          //    else{
          //      $scope.keXuHaoData = sortData;
          //    }
          //  }
          //  else{
          //    DataService.alertInfFun('err', data.error);
          //  }
          //});
        };
        //queryKeXuHao();


        /**
         * 考生内容切换
         */
        $scope.guanLiTabSlide = function (tab) {
          $scope.guanliParams.tabActive = '';
          $scope.glSelectData = '';
          $scope.keXuHaoPgData = '';
          //keXuHaoPagesArr = [];
          //keXuHaoStore = '';
          $scope.studentsOrgData = '';
          $scope.studentsData = '';
          $scope.studentsPages = '';
          if (tab == 'kexuhao') {
            queryKeXuHao();
            $scope.guanliParams.tabActive = 'kexuhao';
            $scope.guanLiTpl = 'views/guanli/kexuhao.html';
          }
          //if (tab == 'tongji') {
          //  glQueryKaoShiZu();
          //  getDaGangData();
          //  $scope.guanliParams.tabActive = 'tongji';
          //  $scope.guanLiTpl = 'views/guanli/tongjiset.html';
          //}
        };
        $scope.guanLiTabSlide('kexuhao');


        ///**
        // * 文件上传
        // */
        //  //存放上传文件的数组
        //$scope.uploadFiles = [];
        //
        ////将选择的文件加入到数组
        //$scope.$on("fileSelected", function (event, args) {
        //  $scope.$apply(function () {
        //    $scope.uploadFiles.push(args.file);
        //  });
        //});
        //
        ///**
        // * 显示更多按钮
        // */
        //$scope.showMoreBtnFun = function(){
        //  $scope.showMoreBtn = !$scope.showMoreBtn;
        //};
        //var showMoreBtnFun = function(){
        //  if($scope.showMoreBtn){
        //    $scope.showMoreBtn = false;
        //  }
        //};
        //
        ///**
        // * 显示弹出层
        // */
        //$scope.showKeXuHaoPop = function(item, data){
        //  $scope.showKeXuHaoManage = true;
        //  $scope.glEditBoxShow = item;
        //  $scope.uploadFiles = [];
        //  if(item == 'addKeXuHao'){
        //    qryTeachers();
        //  }
        //  if(item == 'modifyKeXuHao'){
        //    qryTeachers(data.JIAOSHI, 'modifyKeXuHao');
        //    $scope.guanliParams.modifyKxh = data;
        //  }
        //  if(data){
        //    $scope.glSelectData = data;
        //  }
        //  showMoreBtnFun();
        //};
        //
        ///**
        // * 关闭课序号管理的弹出层
        // */
        //$scope.closeKeXuHaoManage = function(){
        //  $scope.showKeXuHaoManage = false;
        //  $scope.glEditBoxShow = ''; //弹出层显示那一部分重置
        //  $scope.guanliParams.errorInfo = '';
        //};
        //
        ///**
        // * 课序号的分页数据
        // */
        //$scope.keXuHaoDist = function(pg){
        //  var startPage = (pg-1) * numPerPage;
        //  var endPage = pg * numPerPage;
        //  var lastPageNum = $scope.lastKxhPageNum;
        //  $scope.currentKxhPageVal = pg;
        //  //得到分页数组的代码
        //  var currentPageNum = pg ? pg : 1;
        //  if(lastPageNum <= paginationLength){
        //    $scope.keXuHaoPages = keXuHaoPagesArr;
        //  }
        //  if(lastPageNum > paginationLength){
        //    if(currentPageNum > 0 && currentPageNum <= 4 ){
        //      $scope.keXuHaoPages = keXuHaoPagesArr.slice(0, paginationLength);
        //    }
        //    else if(currentPageNum > lastPageNum - 4 && currentPageNum <= lastPageNum){
        //      $scope.keXuHaoPages = keXuHaoPagesArr.slice(lastPageNum - paginationLength);
        //    }
        //    else{
        //      $scope.keXuHaoPages = keXuHaoPagesArr.slice(currentPageNum - 4, currentPageNum + 3);
        //    }
        //  }
        //  $scope.keXuHaoData = keXuHaoStore.slice(startPage, endPage);
        //  showMoreBtnFun();
        //};
        //
        ///**
        // * 课序号管理保存数据
        // */
        //$scope.saveKeXuHaoModify = function(){
        //  var saveType = $scope.glEditBoxShow;
        //  var keXuHaoObj;
        //  var uidArr = [];
        //  $scope.guanliParams.errorInfo = '';
        //  if(saveType == 'addKeXuHao'){ //新增课序号
        //    if($scope.guanliParams.addNewKxh){
        //      keXuHaoObj = {
        //        token: token,
        //        caozuoyuan: caozuoyuan,
        //        shuju: {
        //          KEXUHAO_ID: '',
        //          KEXUHAO_MINGCHENG: $scope.guanliParams.addNewKxh,
        //          JIGOU_ID: jigouid,
        //          LINGYU_ID: lingyuid,
        //          SETTINGS: $scope.guanliParams.addNewKxhSetting,
        //          UIDS: ''
        //        }
        //      };
        //      Lazy($scope.jgKmTeachers).each(function(th){
        //        if(th.ckd && (th.ckd == true)){
        //          uidArr.push(th.UID);
        //        }
        //      });
        //      if(uidArr && uidArr.length > 0){
        //        keXuHaoObj.shuju.UIDS = uidArr.join(',');
        //        $http.post(kxhManageUrl, keXuHaoObj).success(function(data){
        //          if(data.result == true){
        //            $scope.glEditBoxShow = ''; //弹出层显示那一部分内容重置
        //            $scope.guanliParams.addNewKxh = ''; //课序号重置
        //            $scope.guanliParams.addNewKxhSetting = '';
        //            $scope.showKeXuHaoManage = false; //课序号重置
        //            $scope.guanliParams.modifyKxh = '';
        //            queryKeXuHao();
        //            DataService.alertInfFun('suc', '新增课序号成功！');
        //          }
        //          if(data.result == false){
        //            DataService.alertInfFun('pmt', '课序号名称已存在！请修改课序号名称！');
        //          }
        //          if(data.error){
        //            DataService.alertInfFun('err', data.error);
        //          }
        //        });
        //      }
        //      else{
        //        DataService.alertInfFun('pmt', '请选择任课课老师！');
        //      }
        //    }
        //    else{
        //      DataService.alertInfFun('pmt', '新课序号为空！');
        //    }
        //  }
        //  if(saveType == 'modifyKeXuHao'){ //修改课序号
        //    if($scope.guanliParams.modifyKxh){
        //      keXuHaoObj = {
        //        token: token,
        //        caozuoyuan: caozuoyuan,
        //        shuju: {
        //          KEXUHAO_ID: '',
        //          KEXUHAO_MINGCHENG: $scope.guanliParams.modifyKxh.KEXUHAO_MINGCHENG,
        //          JIGOU_ID: jigouid,
        //          LINGYU_ID: lingyuid,
        //          SETTINGS: $scope.guanliParams.modifyKxh.SETTINGS,
        //          UIDS: ''
        //        }
        //      };
        //      if($scope.glSelectData){
        //        keXuHaoObj.shuju.KEXUHAO_ID = $scope.glSelectData.KEXUHAO_ID;
        //        Lazy($scope.jgKmTeachers).each(function(th){
        //          if(th.ckd && (th.ckd == true)){
        //            uidArr.push(th.UID);
        //          }
        //        });
        //        if(uidArr && uidArr.length > 0) {
        //          keXuHaoObj.shuju.UIDS = uidArr.join(',');
        //          $http.post(kxhManageUrl, keXuHaoObj).success(function(data){
        //            if(data.result){
        //              $scope.glEditBoxShow = ''; //弹出层显示那一部分内容重置
        //              $scope.guanliParams.addNewKxh = ''; //课序号重置
        //              $scope.guanliParams.addNewKxhSetting = '';
        //              $scope.showKeXuHaoManage = false; //课序号重置
        //              $scope.glSelectData = '';
        //              $scope.guanliParams.modifyKxh = '';
        //              $scope.guanliParams.errorInfo = '';
        //              queryKeXuHao();
        //              DataService.alertInfFun('suc', '修改成功！');
        //            }
        //            else{
        //              DataService.alertInfFun('err', data.error);
        //            }
        //          });
        //        }
        //        else{
        //          $scope.guanliParams.errorInfo = '至少需要选择一个老师！';
        //        }
        //      }
        //    }
        //  }
        //  if(saveType == 'addSingleStu'){ //添加单个学生
        //    if($scope.guanliParams.singleStuName){
        //      if($scope.guanliParams.singleStuID){
        //        var matchRule = $scope.guanliParams.singleStuID.match(regKxh);
        //        if(matchRule && matchRule.length > 0){
        //          //先去查询UID
        //          var chaXunStuUrl = chaXunStuBaseUrl + '?token=' + token + '&jigouid=' + jigouid +
        //            '&xuehao=' + $scope.guanliParams.singleStuID + '&xingming=' + $scope.guanliParams.singleStuName;
        //          $http.get(chaXunStuUrl).success(function(data){
        //            if(data && data.length > 0){
        //              keXuHaoObj = {
        //                token: token,
        //                kexuhaoid: '',
        //                users: [{uid: data[0].UID, zhuangtai: 1}]
        //              };
        //              if($scope.selectKxh){
        //                keXuHaoObj.kexuhaoid = $scope.selectKxh.KEXUHAO_ID;
        //                $http.post(modifyKxhYh, keXuHaoObj).success(function(addKxh){
        //                  if(addKxh.result){
        //                    DataService.alertInfFun('suc', '添加用户成功!');
        //                    $scope.renYuanAddType = '';
        //                    $scope.glSelectData = '';
        //                    $scope.showKeXuHaoManage = false;
        //                    $scope.guanliParams.singleStuName = '';
        //                    $scope.guanliParams.singleStuID = '';
        //                    $scope.guanliParams.singleStuBanJi = '';
        //                    $scope.chaXunKxhYongHu($scope.selectKxh);
        //                  }
        //                  else{
        //                    DataService.alertInfFun('err', addKxh.error);
        //                  }
        //                });
        //              }
        //              else{
        //                DataService.alertInfFun('pmt', '课序号ID为空！');
        //              }
        //            }
        //            else if(data && data.length == 0){
        //              var singleYhObj = {
        //                token: token,
        //                YONGHULEIBIE: 2,
        //                YONGHUHAO: $scope.guanliParams.singleStuID,
        //                XINGMING: $scope.guanliParams.singleStuName,
        //                BANJI: $scope.guanliParams.singleStuBanJi,
        //                ZHUANGTAI: 1,
        //                JIGOU: [{JIGOU_ID: jigouid, ZHUANGTAI: 1}],
        //                KEXUHAO_ID: $scope.selectKxh.KEXUHAO_ID
        //              };
        //              $http.post(singleYhAddToKxh, singleYhObj).success(function(result){
        //                if(result.result){
        //                  $scope.renYuanAddType = '';
        //                  $scope.glSelectData = '';
        //                  $scope.showKeXuHaoManage = false;
        //                  $scope.guanliParams.singleStuName = '';
        //                  $scope.guanliParams.singleStuID = '';
        //                  $scope.guanliParams.singleStuBanJi = '';
        //                  $scope.chaXunKxhYongHu($scope.selectKxh);
        //                  DataService.alertInfFun('suc', '添加用户成功!');
        //                }
        //                else{
        //                  DataService.alertInfFun('err', result.error);
        //                }
        //              });
        //            }
        //            else{
        //              DataService.alertInfFun('err', data.error);
        //            }
        //          });
        //          $scope.guanliParams.errorInfo = '';
        //        }
        //        else{
        //          $scope.guanliParams.errorInfo = '输入的学号格式不正确！';
        //        }
        //      }
        //      else{
        //        DataService.alertInfFun('pmt', '缺少学号！');
        //      }
        //    }
        //    else{
        //      DataService.alertInfFun('pmt', '缺少姓名！');
        //    }
        //  }
        //  if(saveType == 'addBatchStus'){ //批量添加学生
        //    var file = $scope.uploadFiles;
        //    var stusData = {
        //      token: token,
        //      jigouid: jigouid,
        //      kexuhaoid: ''
        //    };
        //    if($scope.selectKxh){
        //      stusData.kexuhaoid = $scope.selectKxh.KEXUHAO_ID;
        //      $scope.loadingImgShow = true;
        //      var fd = new FormData();
        //      for(var j = 1; j <= file.length; j++){
        //        fd.append('file' + j, file[j - 1]);
        //      }
        //      for(var key in stusData){
        //        fd.append(key, stusData[key]);
        //      }
        //      $scope.loadingImgShow = true;
        //      $http.post(modifyKxhYh, fd, {transformRequest: angular.identity, headers:{'Content-Type': undefined}})
        //        .success(function(data){
        //          if(data.result){
        //            $scope.showKeXuHaoManage = '';
        //            DataService.alertInfFun('suc', '批量新增成功！');
        //            $scope.chaXunKxhYongHu($scope.selectKxh);
        //          }
        //          else{
        //            DataService.alertInfFun('err', data.error);
        //          }
        //          $scope.loadingImgShow = false;
        //        });
        //    }
        //    else{
        //      DataService.alertInfFun('pmt', '请选择课序号！');
        //    }
        //  }
        //};
        //
        ///**
        // * 删除专业
        // */
        //$scope.deleteKeXuHao = function(kxh){
        //  var keXuHaoObj = {
        //    token: token,
        //    caozuoyuan: caozuoyuan,
        //    shuju: {
        //      KEXUHAO_ID: ''
        //    }
        //  };
        //  if(kxh){
        //    keXuHaoObj.shuju.KEXUHAO_ID = kxh.KEXUHAO_ID;
        //    console.log(kxh);
        //    if(confirm('确定要删除此课序号吗？')){
        //      $http.delete(kxhManageUrl, {params: keXuHaoObj}).success(function(data){
        //        if(data.result){
        //          $scope.studentsOrgData = '';
        //          $scope.studentsData = '';
        //          $scope.studentsPages = '';
        //          $scope.selectKxh = '';
        //          DataService.alertInfFun('suc', '删除成功！');
        //          queryKeXuHao();
        //        }
        //        else{
        //          DataService.alertInfFun('err', data.error);
        //        }
        //      });
        //    }
        //  }
        //  showMoreBtnFun();
        //};
        //
        ///**
        // * 查询考试组
        // */
        //var glQueryKaoShiZu = function(){
        //  var kaoShiState = [-3, 0, 1, 2, 3, 4, 5, 6];
        //  var qryKaoShiZuList = qryKaoShiZuListUrl + '&zhuangtai=' + kaoShiState;
        //  $http.get(qryKaoShiZuList).success(function(data) {
        //    if(data && data.length > 0){
        //      $scope.glKaoShiZuList = data;
        //      $('.glZsdgWrap').css({height: pageHeight, 'overflow-y': 'auto'});
        //    }
        //    else{
        //      $scope.glKaoShiZuList = '';
        //      DataService.alertInfFun('err', data.error)
        //    }
        //  });
        //};
        //
        ///**
        // * 获得大纲数据
        // */
        //var getDaGangData = function(){
        //  //var zsdgZsdArr = [];
        //  //得到知识大纲知识点的递归函数
        //  function _do(item) {
        //    item.ckd = false;
        //    item.fld = true;
        //    //zsdgZsdArr.push(item.ZHISHIDIAN_ID);
        //    if(item.ZIJIEDIAN && item.ZIJIEDIAN.length > 0){
        //      Lazy(item.ZIJIEDIAN).each(_do);
        //    }
        //  }
        //  $http.get(qryMoRenDgUrl).success(function(mrDg){
        //    if(mrDg && mrDg.length > 0){
        //      $scope.glDgList = mrDg;
        //      //获取大纲知识点
        //      var qryKnowledge = qryKnowledgeBaseUrl + mrDg[0].ZHISHIDAGANG_ID;
        //      $http.get(qryKnowledge).success(function(zsddata){
        //        if(zsddata.length){
        //          $scope.glKowledgeList = zsddata;
        //          //得到知识大纲知识点id的函数
        //          Lazy(zsddata).each(_do);
        //          $('.glZsdgWrap').css({height: pageHeight, 'overflow-y': 'auto'});
        //        }
        //        else{
        //          DataService.alertInfFun('err', '查询大纲失败！错误信息为：' + zsddata.error); // '查询大纲失败！错误信息为：' + data.error
        //        }
        //      });
        //    }
        //    else{
        //      DataService.alertInfFun('err', mrDg.error);
        //    }
        //  });
        //};

        ///**
        // * 查询课序号学生
        // */
        //$scope.chaXunKxhYongHu = function(kxh){
        //  $scope.studentsData = '';
        //  if(kxh){
        //    $scope.selectKxh = kxh;
        //    var chaXunYongHu = chaXunStuBaseUrl + '?token=' + token + '&kexuhaoid=' + kxh.KEXUHAO_ID;
        //    $http.get(chaXunYongHu).success(function(data){
        //      if(data && data.length > 0){
        //        $scope.studentsOrgData = Lazy(data).sortBy('XUHAO').toArray();
        //        kxh.STUDENTS = data.length;
        //        studentsPages(data);
        //      }
        //      else{
        //        $scope.studentsOrgData = '';
        //        $scope.studentsPages = '';
        //      }
        //    });
        //  }
        //  else{
        //    DataService.alertInfFun('pmt', '缺少课序号ID！');
        //  }
        //  showMoreBtnFun();
        //};
        //
        ///**
        // * 学生分页数码
        // */
        //var studentsPages = function(wks){
        //  totalStuPage = [];
        //  $scope.studentsPages = '';
        //  $scope.lastStuPageNum = '';
        //  if(wks && wks.length > 10){
        //    var stusLength;
        //    var stusLastPage;
        //    stusLength = wks.length;
        //    stusLastPage = Math.ceil(stusLength/numPerPage);
        //    $scope.lastStuPageNum = stusLastPage;
        //    for(var i = 1; i <= stusLastPage; i++){
        //      totalStuPage.push(i);
        //    }
        //    $scope.studentPgDist(1);
        //  }
        //  else{
        //    $scope.studentsData = $scope.studentsOrgData.slice(0);
        //  }
        //};
        //
        ///**
        // * 学生分页
        // */
        //$scope.studentPgDist = function(pg){
        //  var startPage = (pg-1) * numPerPage;
        //  var endPage = pg * numPerPage;
        //  var lastPageNum = $scope.lastStuPageNum;
        //  $scope.currentStuPageVal = pg;
        //  //得到分页数组的代码
        //  var currentPageNum = pg ? pg : 1;
        //  if(lastPageNum <= paginationLength){
        //    $scope.studentsPages = totalStuPage;
        //  }
        //  if(lastPageNum > paginationLength){
        //    if(currentPageNum > 0 && currentPageNum <= 4 ){
        //      $scope.studentsPages = totalStuPage.slice(0, paginationLength);
        //    }
        //    else if(currentPageNum > lastPageNum - 4 && currentPageNum <= lastPageNum){
        //      $scope.studentsPages = totalStuPage.slice(lastPageNum - paginationLength);
        //    }
        //    else{
        //      $scope.studentsPages = totalStuPage.slice(currentPageNum - 4, currentPageNum + 3);
        //    }
        //  }
        //  $scope.studentsData = $scope.studentsOrgData.slice(startPage, endPage);
        //  showMoreBtnFun();
        //};
        //
        ///**
        // * 删除课序号
        // */
        //$scope.deleteKxhYh = function(yh){
        //  var confirmInfo = '';
        //  if(yh){
        //    var obj = {
        //      token: token,
        //      kexuhaoid: '',
        //      users: ''
        //    };
        //    if(yh == 'all'){
        //      obj.users = [];
        //      Lazy($scope.studentsOrgData).each(function(wk){
        //        var wkObj = {uid: wk.UID, zhuangtai: -1};
        //        obj.users.push(wkObj);
        //      });
        //      confirmInfo = '确定要删除此课序号下面的所有学生吗？';
        //    }
        //    else{
        //      obj.users = [{uid: yh.UID, zhuangtai: -1}];
        //      confirmInfo = '确定要删除学生吗？';
        //    }
        //    if($scope.selectKxh){
        //      obj.kexuhaoid = $scope.selectKxh.KEXUHAO_ID;
        //      if(confirm(confirmInfo)){
        //        $http.post(modifyKxhYh, obj).success(function(data){
        //          if(data.result){
        //            $scope.studentsOrgData = Lazy($scope.studentsOrgData).reject(function(wk){
        //              return wk.UID == yh.UID;
        //            }).toArray();
        //            $scope.studentsData = Lazy($scope.studentsData).reject(function(wk){
        //              return wk.UID == yh.UID;
        //            }).toArray();
        //            Lazy($scope.keXuHaoData).each(function(kxh){
        //              if(kxh.KEXUHAO_ID == $scope.selectKxh.KEXUHAO_ID){
        //                kxh.STUDENTS = 0;
        //              }
        //            });
        //            $scope.chaXunKxhYongHu($scope.selectKxh);
        //            DataService.alertInfFun('suc', '删除成功！');
        //            $scope.showKeXuHaoManage = false;
        //          }
        //          else{
        //            DataService.alertInfFun('err', data.error);
        //          }
        //        });
        //      }
        //    }
        //    else{
        //      DataService.alertInfFun('pmt', '请选择要删除学生的专业！');
        //    }
        //  }
        //  else{
        //    DataService.alertInfFun('pmt', '请选择要删除的人员！');
        //  }
        //  showMoreBtnFun();
        //};
        //
        ///**
        // * 重新加载mathjax
        // */
        //$scope.$on('onRepeatLast', function(scope, element, attrs){
        //  MathJax.Hub.Config({
        //    tex2jax: {inlineMath: [["#$", "$#"]], displayMath: [['#$$','$$#']]},
        //    messageStyle: "none",
        //    showMathMenu: false,
        //    processEscapes: true
        //  });
        //  MathJax.Hub.Queue(["Typeset", MathJax.Hub, "glDaGangList"]);
        //});
        //
        ///**
        // * 点击展开和收起的按钮子一级显示和隐藏
        // */
        //$scope.toggleChildNode = function(nd) {
        //  function _do(item) {
        //    item.fld = nd.fld;
        //    if(item.ZIJIEDIAN && item.ZIJIEDIAN.length > 0){
        //      Lazy(item.ZIJIEDIAN).each(_do);
        //    }
        //  }
        //  nd.fld = !nd.fld;
        //  Lazy(nd.ZIJIEDIAN).each(_do);
        //};
        //
        ///**
        // 点击checkbox得到checkbox的值
        // */
        //$scope.toggleSelection = function(zsd) {
        //  zsd.ckd = !zsd.ckd;
        //};
        //
        ///**
        // * 查询知识点，在考务表里里，当统计的表里面没有数据时，执行此函数
        // */
        //function _doKszZsd(item) {
        //  item.ckd = false;
        //  if(item.ZIJIEDIAN && item.ZIJIEDIAN.length > 0){
        //    Lazy(item.ZIJIEDIAN).each(_doKszZsd);
        //  }
        //}
        //function _doCheckKszZsd(item) {
        //  if(item.ZHISHIDIAN_ID == selectData.ZHISHIDIAN_ID){
        //    item.ckd = true;
        //  }
        //  if(item.ZIJIEDIAN && item.ZIJIEDIAN.length > 0){
        //    Lazy(item.ZIJIEDIAN).each(_doCheckKszZsd);
        //  }
        //}
        //$scope.glKaoWuGetZsd = function(){
        //  var pObj = {
        //    token: token,
        //    caozuoyuan: caozuoyuan,
        //    kaoshizuid: ''
        //  };
        //  Lazy($scope.glKowledgeList[0].ZIJIEDIAN).each(_doKszZsd);
        //  if($scope.guanliParams.selectKsz){
        //    pObj.kaoshizuid = $scope.guanliParams.selectKsz;
        //    //查询知识点，在考务表里里，当统计的表里面没有数据时，执行此函数
        //    $http({method: 'GET', url: kwKaoShiZuZhiShiDianUrl, params: pObj}).success(function(zsddata){
        //      if(zsddata && zsddata.length > 0){
        //        //知识点反选
        //        Lazy(zsddata).each(function(kszzsd){
        //          selectData = kszzsd;
        //          Lazy($scope.glKowledgeList[0].ZIJIEDIAN).each(_doCheckKszZsd);
        //        });
        //      }
        //      else{
        //        DataService.alertInfFun('err', zsddata.error);
        //      }
        //    });
        //  }
        //  else{
        //    DataService.alertInfFun('pmt', '请选择考试组！');
        //  }
        //};
        //
        ///**
        // * 查询知识点，在统计表里
        // */
        //$scope.glQueryZsd = function(){
        //  var pObj = {
        //    token: token,
        //    caozuoyuan: caozuoyuan,
        //    kaoshizuid: ''
        //  };
        //  selectData = '';
        //  if($scope.guanliParams.selectKsz){
        //    pObj.kaoshizuid = $scope.guanliParams.selectKsz;
        //    $http({method: 'GET', url: kaoShiZuZhiShiDianUrl, params: pObj}).success(function(data){
        //      if(data && data.length > 0){
        //        Lazy($scope.glKowledgeList[0].ZIJIEDIAN).each(_doKszZsd);
        //        //知识点反选
        //        Lazy(data).each(function(kszzsd){
        //          selectData = kszzsd;
        //          Lazy($scope.glKowledgeList[0].ZIJIEDIAN).each(_doCheckKszZsd);
        //        });
        //      }
        //      else{
        //        $scope.glKaoWuGetZsd();
        //      }
        //    });
        //  }
        //  else{
        //    DataService.alertInfFun('pmt', '请选择考试组！');
        //  }
        //};
        //
        ///**
        // * 保存统计设定的值
        // */
        //$scope.glSaveTongJiSet = function(){
        //  var kszZsdObj = {
        //    token: token,
        //    caozuoyuan: caozuoyuan,
        //    kszzsd: [],
        //    kaoshizuid: ''
        //  };
        //  function _do(item) {
        //    if(item.ckd){
        //      var obj = {
        //        KAOSHIZU_ID: $scope.guanliParams.selectKsz,
        //        ZHISHIDIAN_ID: item.ZHISHIDIAN_ID
        //      };
        //      kszZsdObj.kszzsd.push(obj);
        //    }
        //    if(item.ZIJIEDIAN && item.ZIJIEDIAN.length > 0){
        //      Lazy(item.ZIJIEDIAN).each(_do);
        //    }
        //  }
        //  if($scope.guanliParams.selectKsz){
        //    Lazy($scope.glKowledgeList[0].ZIJIEDIAN).each(_do);
        //    kszZsdObj.kaoshizuid = $scope.guanliParams.selectKsz;
        //    if(kszZsdObj.kszzsd && kszZsdObj.kszzsd.length > 0){
        //      $http.post(kaoShiZuZhiShiDianUrl, kszZsdObj).success(function(data){
        //        if(data.result){
        //          DataService.alertInfFun('suc', '保存成功！');
        //        }
        //        else{
        //          DataService.alertInfFun('err', data.error);
        //        }
        //      });
        //    }
        //    else{
        //      DataService.alertInfFun('pmt', '请选择需要的数据！');
        //    }
        //  }
        //  else{
        //    DataService.alertInfFun('pmt', '请选择考试组！');
        //  }
        //};

      }]);
});
