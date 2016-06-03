define(['angular', 'config', 'jquery', 'lazy', 'mathjax', 'datepicker'], // 000 开始
  function (angular, config, $, lazy, mathjax, datepicker) { // 001 开始
    'use strict';
    angular.module('zhifzApp.controllers.KaowuCtrl', []) //controller 开始
      .controller('KaowuCtrl', ['$rootScope', '$scope', '$http', '$timeout', 'DataService', '$q', '$cookieStore',
        function ($rootScope, $scope, $http, $timeout, DataService, $q, $cookieStore) { // 002 开始
          /**
           * 定义变量
           */
          var loginUsr = JSON.parse($cookieStore.get('ckUsr'));
          var jgID = loginUsr['学校ID']; //登录用户学校
          var logUid = loginUsr['UID']; //登录用户的UID
          var dftKm = JSON.parse($cookieStore.get('ckKeMu')); //默认选择的科目
          var keMuId = dftKm['科目ID']; //默认的科目ID
          var lingYuId = dftKm['领域ID']; //默认的科目ID
          var kaoShiZuUrl = '/kaoshizu'; //考试组
          var daBaoShiJuanUrl = '/dabao_shijuan'; //打包试卷
          var faBuKaoShiZuUrl = '/fabu_kaoshizu'; //发布考试组
          var kaoShengKaoShiUrl = '/kaosheng_kaoshi'; //考生考试
          var zaiXianBaoMingUrl = '/zaixian_baoming'; //在线报名
          $scope.kwParams = { //考务用到的变量
            dftKmName: dftKm, //默认科目名称
            kszListZt: '', //考试列表的状态
            editKcTp: '' //编辑考点的类型
            //showKaoShiDetail: false, //考试详细信息
            //selectShiJuan: [], //存放已选择试卷的数组
            //kaoShengState: '', //判断考生状态
            //baoMingMethod: '', //报名方式
            //selectKaoShiId: '', // 选中考试的ID
            //checkedAllChangCi: false,
            //selectedCc: '', //选中的场次
            //forbidBtn: false //提交后的禁止按钮
          };
          $scope.kaochangData = '';
          //var kaoshi_data; //考试的数据格式
          //var kaochang_data; //考场的数据格式
          //var isEditKaoShi = false; //是否为编辑考试
          //var isEditKaoChang = false; //是否为编辑考场
          //var isDeleteKaoChang = false; //是否为删除考场
          //var xiuGaiKaoChangUrl = baseKwAPIUrl + 'xiugai_kaodiankaochang'; //修改考场的url
          //var itemNumPerPage = 10; //每页显示多少条数据
          //var paginationLength = 11; //分页部分，页码的长度，目前设定为11
          //var faBuKaoShiBaseUrl = baseKwAPIUrl + 'fabu_kaoshizu?token=' + token + '&caozuoyuan=' + caozuoyuan +
          //  '&jigouid=' + jigouid + '&lingyuid=' + lingyuid + '&kaoshizu_id='; //发布考试的url
          //var qryPaperDetailBase = baseMtAPIUrl + 'chaxun_shijuanxiangqing?token=' + token + '&caozuoyuan=' + caozuoyuan +
          //  '&jigouid=' + jigouid + '&lingyuid=' + lingyuid + '&shijuanid='; //查询试卷详情的url
          //var kaoShiPageArr = []; //定义考试页码数组
          //var kaoShiZuIdsData = []; //存放所有考试组ID的数据
          //var totalKaoShiPage; //符合条件的考试一共有多少页
          //var kaoChangPageArr = []; //定义考场页码数组
          //var kaoChangIdArrRev = []; //存放所有考场ID的数组
          //var totalKaoChangPage; //符合条件的考场一共有多少页
          //var uploadKsUrl = baseMtAPIUrl + 'excel_to_json'; //上传考生信息
          //var keXuHaoPagesArr = []; //存放课序号分页的数组
          //var keXuHaoStore = ''; //存放课序号原始数据
          //var numPerPage = 10; //每页10条数据
          //var kxhManageUrl = baseRzAPIUrl + 'kexuhao'; //课序号管理的url
          //var chaXunStuBaseUrl = baseRzAPIUrl + 'query_student'; //查询机构下面的用户
          //var paperListOriginData; //试卷的原始的值
          //var addNewKaoShiUrl = baseKwAPIUrl + 'new_kaoshizu'; //新建考试
          //var deleteKaoShiZuUrl = baseKwAPIUrl + 'delete_kaoshizu?token=' + token + '&caozuoyuan='
          //  + caozuoyuan + '&kszid='; //删除考试组
          //var chaXunChangCiUrl = baseKwAPIUrl + 'query_changci?token=' + token + '&caozuoyuan=' + caozuoyuan + '&kszid='; //查询场次
          //var chaXunKaoShiZuDetailUrl = baseKwAPIUrl + 'query_kaoshizu_detail?token=' + token + '&caozuoyuan=' +
          //  caozuoyuan + '&kszid='; //查询考试组详情
          //var qryKaoShengBaseUrl = baseKwAPIUrl + 'chaxun_kaosheng?token=' + token + '&caozuoyuan=' + caozuoyuan +
          //  '&jigouid=' + jigouid + '&lingyuid=' + lingyuid; //查询考生
          //var qryWeiBaoMingBaseUrl = baseKwAPIUrl + 'query_weibaoming_student?token=' + token + '&caozuoyuan=' + caozuoyuan +
          //  '&jigouid=' + jigouid + '&lingyuid=' + lingyuid; //查询未报名考生
          //var deleteChangCiStudent = baseKwAPIUrl + 'delete_changci_student'; //删除场次中的考生
          //var xiuGaiKaoShiShiJuanUrl = baseKwAPIUrl + 'xiugai_kaoshi_shijuan'; //修改考试试卷
          //var exportStuInfoBase = config.apiurl_gg + 'json2excel?xls_file_name='; //导出excel名单
          //
          //$scope.tiXingArr = config.tiXingArr; //题型名称数组
          //$scope.letterArr = config.letterArr; //题支的序号
          //$scope.cnNumArr = config.cnNumArr; //汉语的大学数字
          ////$rootScope.dashboard_shown = true;
          //$scope.showAddStuBox = false; //显示添加考生页面
          //$scope.isAddStuByKxh = false; //判断添加考生类型
          //$scope.isAddStuByExcel = false; //判断添加考生类型
          //$scope.addChangCi = false;
          //$scope.keXuHaoData = '';

          /**
          * 显示考试列表,可分页的方法, zt表示状态 1，2，3，4为完成；5，6已完成
          */
          $scope.showKaoShiZuList = function(zt){
            var obj = {method: 'GET', url: kaoShiZuUrl, params: {'学校ID': jgID, '科目ID': keMuId}};
            var stat = zt || 'ing';
            var ztArr = [];
            switch (stat) {
              case 'all':
                ztArr = [1, 3, 4, 5, 6];
                break;
              case 'ing':
                ztArr = [1, 3, 4];
                break;
              case 'done':
                ztArr = [5, 6];
                break;
            }
            obj.params['状态'] = JSON.stringify(ztArr);
            $scope.loadingImgShow = true;
            $http(obj).success(function(data){
              if(data.result){
                $scope.kaoShiZuList = data.data;
              }
              else{
                $scope.kaoShiZuList = '';
                DataService.alertInfFun('err', data.error);
              }
              $scope.loadingImgShow = false;
            });
            $scope.tabActive = 'kszgl';
            $scope.kwParams.kszListZt = stat;
            $scope.txTpl = 'views/kaowu/kaoChangList.html';
          };
          $scope.showKaoShiZuList('all');

          ///**
          //* 显示考场列表
          //*/
          //$scope.showKaoChangList = function(){
          //  var obj = {method: 'GET', url: kaoDianUrl, params: {'学校ID': jgID}};
          //  $scope.loadingImgShow = true;
          //  $http(obj).success(function(data){
          //    if(data.result){
          //      $scope.kaoChangList = data.data;
          //    }
          //    else{
          //      $scope.kaoChangList = '';
          //      DataService.alertInfFun('err', data.error);
          //    }
          //    $scope.loadingImgShow = false;
          //  });
          //  $scope.tabActive = 'kcgl';
          //  $scope.txTpl = 'views/kaowu/kaoChangList.html';
          //};
          //
          ///**
          //* 新增考场
          //*/
          //$scope.addNewKaoChang = function(){
          //  $scope.kaochangData = {
          //    //'考点ID': '',
          //    '考点名称': '',
          //    '学校ID': jgID,
          //    '考位数': '',
          //    '联系人': '',
          //    '联系方式': '',
          //    '详情': {
          //      '考场地址': '',
          //      '交通方式': ''
          //    }
          //  };
          //  $scope.kwParams.editKcTp = 'add';
          //  $scope.txTpl = 'views/kaowu/editKaoChang.html';
          //};
          //
          ///**
          //* 删除考场
          //*/
          //$scope.deleteKaoChang = function(kc){
          //  var obj = {method: 'POST', url: kaoDianUrl, data: {'考点ID': '', '状态': -1}};
          //  if(kc['考点ID']){
          //    obj.data['考点ID'] = kc['考点ID'];
          //    if(confirm('确定要删除此考场吗？')){
          //      $http(obj).success(function(data){
          //        if(data.result){
          //          $scope.showKaoChangList();
          //        }
          //        else{
          //          DataService.alertInfFun('err', data.error);
          //        }
          //      });
          //    }
          //  }
          //  else{
          //    DataService.alertInfFun('pmt', '请选择要删除的考场！');
          //  }
          //};
          //
          ///**
          //* 修改考场
          //*/
          //$scope.editKaoChang = function(kc){
          //  $scope.kaochangData = {
          //    '考点ID': kc['考点ID'],
          //    '考点名称': kc['考点名称'],
          //    '学校ID': kc['学校ID'],
          //    '考位数': kc['考位数'],
          //    '联系人': kc['联系人'],
          //    '联系方式': kc['联系方式'],
          //    '详情': {
          //      '考场地址': kc['详情'] ? kc['详情']['考场地址'] : '',
          //      '交通方式': kc['详情'] ? kc['详情']['交通方式'] : ''
          //    }
          //  };
          //  $scope.kwParams.editKcTp = 'mod';
          //  $scope.txTpl = 'views/kaowu/editKaoChang.html';
          //};
          //
          ///**
          //* 保存考场
          //*/
          //$scope.saveKaoChang = function(){
          //  var obj = {method: '', url: kaoDianUrl, data: $scope.kaochangData};
          //  $scope.loadingImgShow = true; //保存考场
          //  if($scope.kwParams.editKcTp == 'add'){
          //    obj.method = 'PUT';
          //  }
          //  if($scope.kwParams.editKcTp == 'mod'){
          //    obj.method = 'POST';
          //  }
          //  $http(obj).success(function(data){
          //    if(data.result){
          //      $scope.showKaoChangList();
          //      DataService.alertInfFun('suc', '考场保存成功！');
          //    }
          //    else{
          //      DataService.alertInfFun('err', data.error);
          //    }
          //    $scope.loadingImgShow = false; //保存考场
          //  });
          //};




          ///**
          // * 考试的分页数据查询函数
          // */
          //$scope.getThisKaoShiPageData = function(pg){
          //  var pgNum = pg - 1;
          //  var currentPage = pgNum ? pgNum : 0;
          //  $scope.kaoShiPages = [];
          //  //得到分页数组的代码
          //  var currentKsPageVal = $scope.currentKsPageVal = pg ? pg : 1;
          //  if(totalKaoShiPage <= paginationLength){
          //    $scope.kaoShiPages = kaoShiPageArr;
          //  }
          //  if(totalKaoShiPage > paginationLength){
          //    if(currentKsPageVal > 0 && currentKsPageVal <= 6 ){
          //      $scope.kaoShiPages = kaoShiPageArr.slice(0, paginationLength);
          //    }
          //    else if(currentKsPageVal > totalKaoShiPage - 5 && currentKsPageVal <= totalKaoShiPage){
          //      $scope.kaoShiPages = kaoShiPageArr.slice(totalKaoShiPage - paginationLength);
          //    }
          //    else{
          //      $scope.kaoShiPages = kaoShiPageArr.slice(currentKsPageVal - 5, currentKsPageVal + 5);
          //    }
          //  }
          //  //查询考试组数据 chaXunKaoShiZuDetailUrl
          //  var pageKsz = kaoShiZuIdsData.slice(currentPage * itemNumPerPage, (currentPage + 1) * itemNumPerPage);
          //  if(pageKsz && pageKsz.length > 0){
          //    var pageKszId = Lazy(pageKsz).map(function(ksz){return ksz.KAOSHIZU_ID;}).join();
          //    var chaXunKaoShiZuDetail = chaXunKaoShiZuDetailUrl + pageKszId;
          //    $http.get(chaXunKaoShiZuDetail).success(function(data){
          //      if(data && data.length > 0){
          //        $scope.kaoShiZuList = Lazy(data).reverse().toArray();
          //      }
          //      else{
          //        DataService.alert('err', data.error);
          //      }
          //      $scope.loadingImgShow = false; //kaoShiZuList.html
          //    });
          //  }
          //};
          //
          ///**
          // * 显示考试列表,可分页的方法, zt表示状态 1，2，3，4为完成；5，6已完成
          // */
          //$scope.showKaoShiZuList = function(zt){
          //  var ztArr = [];
          //  var qryKaoShiZuList;
          //  zt = zt || 'ing';
          //  $scope.loadingImgShow = true; //kaoShiZuList.html
          //  $scope.kwParams.baoMingMethod = '';
          //  kaoShiPageArr = []; //定义考试页码数组
          //  kaoShiZuIdsData = []; //存放所有考试ID的数组
          //  //先查询所有考试的Id
          //  switch (zt) {
          //    case 'all':
          //      ztArr = [];
          //      break;
          //    case 'ing':
          //      ztArr = [0, 1, 2, 3, 4];
          //      break;
          //    case 'done':
          //      ztArr = [5, 6];
          //      break;
          //  }
          //  $scope.kwParams.kszListZt = zt;
          //  qryKaoShiZuList = qryKaoShiZuListUrl + '&zhuangtai=' + ztArr;
          //  $http.get(qryKaoShiZuList).success(function(kslst){
          //    kaoShiZuIdsData = kslst;
          //    totalKaoShiPage = Math.ceil(kslst.length/itemNumPerPage); //得到所有考试的页码
          //    if(kslst.length){
          //      for(var i = 1; i <= totalKaoShiPage; i++){
          //        kaoShiPageArr.push(i);
          //      }
          //      $scope.lastKaoShiPageNum = totalKaoShiPage; //最后一页的数值
          //      //查询数据开始
          //      $scope.getThisKaoShiPageData();
          //      $scope.txTpl = 'views/kaowu/kaoShiZuList.html';
          //      $scope.isAddNewKaoSheng = false; //显示添加单个考生页面
          //      isEditKaoShi = false;//是否为编辑考试
          //    }
          //    else{
          //      $scope.kaoShiZuList = '';
          //      kaoShiPageArr = [];
          //      $scope.kaoShiPages = [];
          //      kaoShiZuIdsData = []; //存放所有考试ID的数组
          //      $scope.kwParams.kszListZt = '';
          //      $scope.txTpl = 'views/kaowu/kaoShiZuList.html';
          //      $scope.isAddNewKaoSheng = false; //显示添加单个考生页面
          //      isEditKaoShi = false;//是否为编辑考试
          //      DataService.alertInfFun('pmt', '没有相关的考试！');
          //      $scope.loadingImgShow = false; //kaoShiZuList.html
          //    }
          //  });
          //  $scope.tabActive = 'ksgl';
          //  qryShiJuanList();
          //};
          //
          ///**
          // * 考务页面加载时，加载考试列表
          // */
          //$scope.showKaoShiZuList();
          //
          ///**
          // * 显示试卷详情
          // */
          //$scope.showShiJuanInfo = function(sjId){
          //  var newCont,
          //    tgReg = new RegExp('<\%{.*?}\%>', 'g');
          //  var qryPaperDetail = qryPaperDetailBase + sjId;
          //  $http.get(qryPaperDetail).success(function(data){
          //    if(data){
          //      //给模板大题添加存放题目的数组
          //      Lazy(data.MUBANDATI).each(function(mbdt, idx, lst){
          //        mbdt.TIMUARR = [];
          //        mbdt.datiScore = 0;
          //      });
          //      //将各个题目添加到对应的模板大题中
          //      Lazy(data.TIMU).each(function(tm, idx, lst){
          //        //修改填空题的题干
          //        newCont = tm.DETAIL.TIGAN.tiGan.replace(tgReg, function(arg) {
          //          var text = arg.slice(2, -2), //提起内容
          //            textJson = JSON.parse(text),
          //            _len = textJson.size,
          //            i, xhStr = '';
          //          for(i = 0; i < _len; i ++ ){
          //            xhStr += '_';
          //          }
          //          return xhStr;
          //        });
          //        tm.DETAIL.TIGAN.tiGan = newCont;
          //        Lazy(data.MUBANDATI).each(function(mbdt, subIdx, subLst){
          //          if(mbdt.MUBANDATI_ID == tm.MUBANDATI_ID){
          //            mbdt.TIMUARR.push(tm);
          //            mbdt.datiScore += parseFloat(tm.FENZHI);
          //          }
          //        });
          //      });
          //      //赋值
          //      $scope.paperDetail = data;
          //      $scope.showPaperDetail = true;
          //    }
          //    else{
          //      DataService.alertInfFun('err', '查询试卷失败！错误信息为：' + data.error);
          //    }
          //  });
          //};
          //
          ///**
          // * 关闭试卷详情
          // */
          //$scope.closePaperDetail = function(){
          //  $scope.showPaperDetail = false;
          //};
          //
          ///**
          // * 查询本机构下的所有考场
          // */
          //var qryAllKaoChang = function(){
          //  $scope.loadingImgShow = true; //kaoChangList.html
          //  $http.get(qryKaoChangDetailBaseUrl).success(function(data){
          //    if(data.length){
          //      $scope.allKaoChangList = data;
          //      $scope.loadingImgShow = false; //kaoChangList.html
          //    }
          //    else{
          //      $scope.loadingImgShow = false; //kaoChangList.html
          //      DataService.alertInfFun('pmt', '没有相关的考场数据!');
          //    }
          //  });
          //};
          //
          ///**
          // * 新增一个考试
          // */
          //$scope.addNewKaoShi = function(ks){
          //  $scope.isAddNewKaoSheng = false; //显示添加单个考生页面
          //  $scope.showPaperDetail = false; //控制试卷详情的显示和隐藏
          //  $scope.kwParams.selectShiJuan = []; //重置已选择的时间数组
          //  $scope.onlineBaoMing = false; //在线报名
          //  $scope.unOnlineBaoMing = false; //非在线报名
          //  $scope.studentsData = ''; // 由课序号查出来的分页学生数据
          //  $scope.studentsOrgData = ''; //由课序号查出来的所有学生
          //  $scope.showImportStuds = false; //显示导入的考生
          //  $scope.selectChangCi = ''; //选中的场次
          //  kaoshi_data = { //考试的数据格式
          //    token: token,
          //    caozuoyuan: caozuoyuan,
          //    jigouid: jigouid,
          //    lingyuid: lingyuid,
          //    shuju:{
          //      KAOSHIZU_ID: '',
          //      KAOSHIZU_NAME: '',
          //      BAOMINGFANGSHI: '', //1固定名单，2是线上报名
          //      SHICHANG: '', //考试时长，临时数据，赋值给每个场次
          //      XUZHI: '', //考试须知
          //      ZHUANGTAI: 0, //等待发布，用于发布考试
          //      CHANGCI: [
          //        //{
          //        //  KAOSHI_ID: '',
          //        //  KAOSHI_MINGCHENG: '考场一',
          //        //  KAISHISHIJIAN: '',
          //        //  JIESHUSHIJIAN: '',
          //        //  XINGZHI: 1,
          //        //  LEIXING: 0,
          //        //  SHIJUAN_ID: [],
          //        //  ZHUANGTAI: 0,
          //        //  KAOCHANG:[]
          //        //  //KAOSHENG: []
          //        //}
          //      ]
          //      //KAOSHENG: []
          //    }
          //  };
          //  if(isEditKaoShi){
          //    qryAllKaoChang();
          //    qryShiJuanList();
          //    kaoshi_data.shuju.KAOSHI_ID = ks.KAOSHI_ID;
          //    kaoshi_data.shuju.KAOSHI_MINGCHENG = ks.KAOSHI_MINGCHENG;
          //    //kaoshi_data.shuju.KAISHISHIJIAN = DataService.formatDateUtc(ks.KAISHISHIJIAN);
          //    //kaoshi_data.shuju.JIESHUSHIJIAN = ks.JIESHUSHIJIAN;
          //    kaoshi_data.shuju.SHICHANG = ks.SHICHANG;
          //    kaoshi_data.shuju.XINGZHI = ks.XINGZHI;
          //    kaoshi_data.shuju.LEIXING = ks.LEIXING;
          //    kaoshi_data.shuju.XUZHI = ks.XUZHI;
          //    $scope.kwParams.selectShiJuan = ks.SHIJUAN;
          //    //kaoshi_data.shuju.KAOCHANG = ks.KAODIANKAOCHANG;
          //    kaoshi_data.shuju.ZHUANGTAI = ks.ZHUANGTAI;
          //    $scope.kaoshiData = kaoshi_data;
          //    $scope.txTpl = 'views/kaowu/editKaoShi.html';
          //  }
          //  else{
          //    qryAllKaoChang();
          //    qryShiJuanList();
          //    $scope.kaoshiData = kaoshi_data;
          //    $scope.txTpl = 'views/kaowu/editKaoShi.html';
          //  }
          //  $scope.tabActive = 'anks';
          //  //显示时间选择器
          //  var showDatePicker = function() {
          //    $('.start-date').intimidatetime({
          //      buttons: [
          //        { text: '当前时间', action: function(inst){ inst.value( new Date() ); } }
          //      ]
          //    });
          //  };
          //  $timeout(showDatePicker, 500);
          //};
          //
          ///**
          // * 根据选择的报名方式
          // */
          //$scope.getBaoMingCont = function(){
          //  $scope.studentsOrgData = '';
          //  if($scope.kaoshiData.shuju.KAOSHENG && $scope.kaoshiData.shuju.KAOSHENG.length > -1){
          //    delete $scope.kaoshiData.shuju.KAOSHENG;
          //  }
          //  Lazy($scope.kaoshiData.shuju.CHANGCI).each(function(cc){
          //    if(cc.KAOSHENG && cc.KAOSHENG.length > -1){
          //      delete cc.KAOSHENG;
          //    }
          //  });
          //  Lazy(keXuHaoStore).each(function(kxh){
          //    kxh.ckd = false;
          //  });
          //  if($scope.kaoshiData.shuju.BAOMINGFANGSHI == 2){ //在线报名
          //    $scope.onlineBaoMing = true; //在线报名
          //    $scope.unOnlineBaoMing = false; //非在线报名
          //  }
          //  else{
          //    $scope.onlineBaoMing = false; //在线报名
          //    $scope.unOnlineBaoMing = true; //非在线报名
          //  }
          //  $scope.paperListIds = paperListOriginData.slice(0, 10);
          //};
          //
          ///**
          // * 由课序号添加考生
          // */
          //$scope.addStuByKxh = function(){
          //  if(keXuHaoStore && keXuHaoStore.length > 0){
          //    $scope.showAddStuBox = true;
          //    $scope.isAddStuByKxh = true;
          //    $scope.isAddStuByExcel = false;
          //    $scope.addChangCi = false;
          //  }
          //  else{
          //    var qryKxhUrl = kxhManageUrl + '?token=' + token + '&JIGOU_ID=' + jigouid + '&LINGYU_ID=' + lingyuid;
          //    $http.get(qryKxhUrl).success(function(data){
          //      if(data && data.length > 0){
          //        var dataLength = data.length; //所以二级专业长度
          //        Lazy(data).each(function(kxh){
          //          kxh.jiaoShiStr = Lazy(kxh.JIAOSHI).map(function(js){
          //            return js.XINGMING;
          //          }).toArray().join(';');
          //        });
          //        keXuHaoStore = data;
          //        if(dataLength > 10){
          //          var lastPage = Math.ceil(dataLength/numPerPage); //最后一页
          //          $scope.lastKxhPageNum = lastPage;
          //          keXuHaoPagesArr = [];
          //          if(lastPage){
          //            for(var i = 1; i <= lastPage; i++){
          //              keXuHaoPagesArr.push(i);
          //            }
          //          }
          //          $scope.keXuHaoDist(1);
          //        }
          //        else{
          //          $scope.keXuHaoData = data;
          //        }
          //        $scope.showAddStuBox = true;
          //        $scope.isAddStuByKxh = true;
          //        $scope.isAddStuByExcel = false;
          //        $scope.addChangCi = false;
          //      }
          //      else{
          //        DataService.alertInfFun('err', data.error);
          //      }
          //    });
          //  }
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
          //};
          //
          ///**
          // * 选中课序号
          // */
          //$scope.pickOnKxh = function(kxh){
          //  kxh.ckd = !kxh.ckd;
          //};
          //
          ///**
          // * 查询课序号学生
          // */
          //$scope.chaXunKxhYongHu = function(){
          //  var kxhId = [];
          //  Lazy(keXuHaoStore).each(function(kxh){
          //    if(kxh.ckd){
          //      kxhId.push(kxh.KEXUHAO_ID);
          //    }
          //  });
          //  if(kxhId && kxhId.length > 0){
          //    var chaXunYongHu = chaXunStuBaseUrl + '?token=' + token + '&kexuhaoid=' + kxhId.join(',');
          //    $http.get(chaXunYongHu).success(function(data){
          //      if(data && data.length > 0){
          //        $scope.showAddStuBox = false;
          //        //重构考生名单
          //        var newKaoShengArr = [];
          //        Lazy(data).each(function(ks){
          //          var nksObj = {
          //            UID: ks.UID || ''
          //            //XINGMING: ks.XINGMING || '',
          //            //YONGHUHAO: ks.YONGHUHAO || '',
          //            //KEXUHAO_ID: ks.KEXUHAO_ID || '',
          //            //KEXUHAO_MINGCHENG: ks.KEXUHAO_MINGCHENG || '',
          //            //BANJI: ks.BANJI || ''
          //          };
          //          newKaoShengArr.push(nksObj);
          //        });
          //        $scope.studentsOrgData = Lazy($scope.studentsOrgData).union(newKaoShengArr).uniq('UID').toArray();
          //        //$scope.studentsOrgData = newKaoShengArr;
          //        //将名单加入考试数据
          //        if($scope.kaoshiData.shuju.BAOMINGFANGSHI == 1){ //非在线报名
          //          Lazy($scope.kaoshiData.shuju.CHANGCI).each(function(cc){
          //            if((cc.tempIdx == $scope.selectChangCi.tempIdx) &&
          //              (cc.KAOSHI_MINGCHENG == $scope.selectChangCi.KAOSHI_MINGCHENG)){
          //              cc.KAOSHENG = Lazy(cc.KAOSHENG).union(newKaoShengArr).uniq('UID').toArray();
          //              //cc.KAOSHENG = newKaoShengArr;
          //            }
          //          });
          //        }
          //        if($scope.kaoshiData.shuju.BAOMINGFANGSHI == 2){ //在线报名
          //          $scope.kaoshiData.shuju.KAOSHENG = Lazy($scope.kaoshiData.shuju.KAOSHENG).union(newKaoShengArr)
          //            .uniq('UID').toArray();
          //          //$scope.kaoshiData.shuju.KAOSHENG = newKaoShengArr;
          //        }
          //      }
          //      else{
          //        $scope.studentsOrgData = '';
          //      }
          //    });
          //  }
          //  else{
          //    DataService.alertInfFun('pmt', '您未选择课序号！');
          //  }
          //};
          //
          ///**
          // * 由Excel文件添加学生
          // */
          //$scope.addStuByExcel = function(){
          //  $scope.showAddStuBox = true;
          //  $scope.isAddStuByKxh = false;
          //  $scope.isAddStuByExcel = true;
          //  $scope.addChangCi = false;
          //};
          //
          ///**
          // * 关闭添加考生页面
          // */
          //$scope.closeAddStuBox = function(){
          //  $scope.showAddStuBox = false;
          //  $scope.studentsOrgData = '';
          //  $scope.uploadFiles = [];
          //  $('input.addFileBtn').val('');
          //};
          //
          ///**
          // * 添加场次弹出
          // */
          //$scope.addNewChangCiPop = function(){
          //  $scope.changCiObj = { //场次的数据
          //    KAOSHI_ID: '',
          //    KAOSHI_MINGCHENG: '',
          //    KAISHISHIJIAN: '',
          //    JIESHUSHIJIAN: '',
          //    SHICHANG: $scope.kaoshiData.shuju.SHICHANG,
          //    XINGZHI: 1,
          //    LEIXING: 0,
          //    XUZHI: '',
          //    SHIJUAN_ID: [],
          //    ZHUANGTAI: 0,
          //    KAOCHANG:[],
          //    tempIdx: ''
          //  };
          //  $('.start-date').val('');
          //  $scope.showAddStuBox = true;
          //  $scope.isAddStuByKxh = false;
          //  $scope.isAddStuByExcel = false;
          //  $scope.addChangCi = true;
          //};
          //
          ///**
          // * 添加场次
          // */
          //$scope.addNewChangCi = function(cdt){
          //  var kssj = $('.start-date').val();
          //  if(cdt == 'submit'){
          //    //计算结束时间的代码
          //    if(kssj && $scope.kaoshiData.shuju.SHICHANG){
          //      var startDate = Date.parse(kssj); //开始时间
          //      var endDate = startDate + $scope.kaoshiData.shuju.SHICHANG * 60 * 1000; //结束时间
          //      $scope.changCiObj.KAISHISHIJIAN = kssj;
          //      $scope.changCiObj.JIESHUSHIJIAN = DataService.formatDateZh(endDate);
          //      $scope.kaoshiData.shuju.CHANGCI.push($scope.changCiObj);
          //      //重新给场次命名
          //      Lazy($scope.kaoshiData.shuju.CHANGCI).each(function(cc, idx, lst){
          //        cc.tempIdx = idx;
          //        cc.KAOSHI_MINGCHENG = '场次' + parseInt(idx + 1);
          //      });
          //      $scope.showChangCiInfo($scope.changCiObj, $scope.kaoshiData.shuju.CHANGCI.length - 1);
          //    }
          //    else{
          //      DataService.alertInfFun('pmt', '开始时间和考试时长不能为空！');
          //    }
          //  }
          //  $scope.showAddStuBox = false;
          //  $scope.isAddStuByKxh = false;
          //  $scope.isAddStuByExcel = false;
          //  $scope.addChangCi = false;
          //};
          //
          ///**
          // * 显示场次详情
          // */
          //$scope.showChangCiInfo = function(cc, idx){
          //  $scope.selectChangCi = cc;
          //  $scope.selectChangCiIdx = idx;
          //  var selectedKaoWei = 0;
          //  //重置所有的考场和试卷
          //  if(cc.KAOCHANG && cc.KAOCHANG.length > 0){
          //    Lazy($scope.allKaoChangList).each(function(kc){
          //      kc.ckd = false;
          //    });
          //  }
          //  if(cc.SHIJUAN_ID && cc.SHIJUAN_ID.length > 0){
          //    Lazy(paperListOriginData).each(function(sj){
          //      sj.ckd = false;
          //    });
          //  }
          //  //考场的反选
          //  Lazy(cc.KAOCHANG).each(function(cckc){
          //    Lazy($scope.allKaoChangList).each(function(kc){
          //      if(kc.KID == cckc){
          //        kc.ckd = true;
          //        selectedKaoWei += kc.KAOWEISHULIANG;
          //      }
          //    });
          //  });
          //  //试卷的反选
          //  Lazy(cc.SHIJUAN_ID).each(function(ccsj){
          //    Lazy(paperListOriginData).each(function(sj){
          //      if(sj.SHIJUAN_ID == ccsj){
          //        sj.ckd = true;
          //      }
          //    });
          //  });
          //  //排序把选中的放到最前面
          //  $scope.allKaoChangList = Lazy($scope.allKaoChangList).sort(function(akc){return akc.ckd}).reverse().toArray();
          //  paperListOriginData = Lazy(paperListOriginData).sortBy(function(asj){return asj.ckd}).reverse().toArray();
          //  //不清空上一场考试的数据
          //  if(!(cc.KAOCHANG && cc.KAOCHANG.length > 0)){
          //    Lazy($scope.allKaoChangList).each(function(kc){
          //      if(kc.ckd){
          //        var findIn = Lazy(cc.KAOCHANG).contains(kc.KID);
          //        if(!findIn){
          //          cc.KAOCHANG.push(kc.KID);
          //        }
          //        selectedKaoWei += kc.KAOWEISHULIANG;
          //      }
          //    });
          //  }
          //  if(!(cc.SHIJUAN_ID && cc.SHIJUAN_ID.length > 0)){
          //    Lazy(paperListOriginData).each(function(sj){
          //      if(sj.ckd){
          //        var findIn = Lazy(cc.SHIJUAN_ID).contains(sj.SHIJUAN_ID);
          //        if(!findIn){
          //          cc.SHIJUAN_ID.push(sj.SHIJUAN_ID);
          //        }
          //      }
          //    });
          //  }
          //  cc.selectKaoWei = selectedKaoWei;
          //  $scope.paperListIds = paperListOriginData.slice(0, 10);
          //};
          //
          ///**
          // * 显示试卷个数
          // */
          //$scope.getMoreShiJuan = function(){
          //  $scope.paperListIds = paperListOriginData.slice(0);
          //};
          //
          ///**
          // * 将考场添加到场次
          // */
          //$scope.addKaoChangToCc = function(kc){
          //  var kcIds = [];
          //  var kaoWeiNum = 0;
          //  kc.ckd = !kc.ckd;
          //  Lazy($scope.allKaoChangList).each(function(akc){
          //    if(akc.ckd){
          //      kcIds.push(akc.KID);
          //      kaoWeiNum += akc.KAOWEISHULIANG;
          //    }
          //  });
          //  Lazy($scope.kaoshiData.shuju.CHANGCI).each(function(cc){
          //    if(cc.KAOSHI_MINGCHENG == $scope.selectChangCi.KAOSHI_MINGCHENG){
          //      cc.KAOCHANG = kcIds;
          //    }
          //  });
          //  $scope.selectChangCi.selectKaoWei = kaoWeiNum;
          //};
          //
          ///**
          // * 将试卷添加到场次
          // */
          //$scope.addShiJuanToCc = function(sj){
          //  var sjIds = [];
          //  sj.ckd = !sj.ckd;
          //  Lazy($scope.paperListIds).each(function(asj){
          //    if(asj.ckd){
          //      sjIds.push(asj.SHIJUAN_ID);
          //    }
          //  });
          //  Lazy($scope.kaoshiData.shuju.CHANGCI).each(function(cc){
          //    if(cc.KAOSHI_MINGCHENG == $scope.selectChangCi.KAOSHI_MINGCHENG){
          //      cc.SHIJUAN_ID = sjIds;
          //    }
          //  });
          //};
          //
          ///**
          // * 删除场次
          // */
          //$scope.deleteChangCi = function(cc, idx){
          //  $scope.kaoshiData.shuju.CHANGCI.splice(idx, 1);
          //};
          //
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
          ////添加文件
          //$scope.addMyFile = function(){
          //  $('input.addFileBtn').click();
          //};
          //
          ////保存上传文件
          //$scope.uploadXlsFile = function() {
          //  var file = $scope.uploadFiles;
          //  var fields = [{"name": "token", "data": token}];
          //  var kaoShengOldArr = [];
          //  var kaoShengNewArr = [];
          //  var trimBlankReg = /\s/g;
          //  var delBlank = '';
          //  if(file && file.length > 0){
          //    $scope.kwParams.forbidBtn = true;
          //    $scope.loadingImgShow = true;
          //    DataService.uploadFileAndFieldsToUrl(file, fields, uploadKsUrl).then(function(result){
          //      $scope.uploadFiles = [];
          //      $('input.addFileBtn').val('');
          //      if(!result.error){
          //        if(result.data && result.data.length >= 2){
          //          Lazy(result.data).each(function(d){
          //            var stuArr;
          //            for(var item in d.json){
          //              stuArr = d.json[item];
          //              break;
          //            }
          //            kaoShengOldArr = Lazy(kaoShengOldArr).union(stuArr);
          //          });
          //        }
          //        if(result.data.json){
          //          for(var item in result.data.json){
          //            kaoShengOldArr = result.data.json[item];
          //            break;
          //          }
          //        }
          //        Lazy(kaoShengOldArr).each(function(ks, idx, list){
          //          var ksObj = {
          //            UID: '',
          //            XINGMING: '',
          //            YONGHUHAO:'',
          //            BANJI: '',
          //            KEXUHAO_MINGCHENG:'',
          //            XUHAO:'',
          //            ZUOWEIHAO:''
          //          };
          //          Lazy(ks).each(function(value, key, list){
          //            delBlank = key.replace(trimBlankReg, "");
          //            switch (delBlank){
          //              case '姓名' :
          //                ksObj.XINGMING = value;
          //                break;
          //              case '学号':
          //                ksObj.YONGHUHAO = value;
          //                break;
          //              case '班级':
          //                ksObj.BANJI = value;
          //                break;
          //              case '序号':
          //                ksObj.XUHAO = value;
          //                break;
          //              case '课序号':
          //                ksObj.KEXUHAO_MINGCHENG = value;
          //                break;
          //              case '座位号':
          //                ksObj.ZUOWEIHAO = value;
          //                break;
          //            }
          //          });
          //          kaoShengNewArr.push(ksObj);
          //        });
          //        //将名单加入考试数据
          //        if($scope.kaoshiData.shuju.BAOMINGFANGSHI == 1){ //非在线报名
          //          Lazy($scope.kaoshiData.shuju.CHANGCI).each(function(cc){
          //            if((cc.tempIdx == $scope.selectChangCi.tempIdx) &&
          //              (cc.KAOSHI_MINGCHENG == $scope.selectChangCi.KAOSHI_MINGCHENG)){
          //              cc.KAOSHENG = Lazy(cc.KAOSHENG).union(kaoShengNewArr).uniq('YONGHUHAO').toArray();
          //              //cc.KAOSHENG = kaoShengNewArr;
          //            }
          //          });
          //        }
          //        if($scope.kaoshiData.shuju.BAOMINGFANGSHI == 2){ //在线报名
          //          $scope.kaoshiData.shuju.KAOSHENG = Lazy($scope.kaoshiData.shuju.KAOSHENG).union(kaoShengNewArr)
          //            .uniq('YONGHUHAO').toArray();
          //          //$scope.kaoshiData.shuju.KAOSHENG = kaoShengNewArr;
          //        }
          //        //$scope.studentsOrgData = kaoShengNewArr;
          //        $scope.studentsOrgData = Lazy($scope.studentsOrgData).union(kaoShengNewArr).uniq('YONGHUHAO').toArray();
          //        $scope.loadingImgShow = false;
          //        $scope.showAddStuBox = false;
          //        $scope.isAddStuByKxh = false;
          //        $scope.isAddStuByExcel = false;
          //        $scope.addChangCi = false;
          //        DataService.alertInfFun('suc', '上传成功！');
          //      }
          //      else{
          //        $scope.loadingImgShow = false;
          //        DataService.alertInfFun('err', result.error);
          //      }
          //      $scope.kwParams.forbidBtn = false;
          //    });
          //  }
          //  else{
          //    DataService.alertInfFun('pmt', '你未选择任何Excel文件！');
          //  }
          //};
          //
          ///**
          // * 显示添加的考试
          // */
          //$scope.showKaoShengList = function(){
          //  if($scope.kaoshiData.shuju.BAOMINGFANGSHI == 1){
          //    $scope.studentsOrgData = $scope.selectChangCi.KAOSHENG;
          //  }
          //  $scope.showImportStuds = true;
          //};
          //
          ///**
          // * 关闭导入成功后的考生列表
          // */
          //$scope.hideImportList = function(){
          //  $scope.showImportStuds = false;
          //};
          //
          ///**
          // * 取消添加新考试
          // */
          //$scope.cancelAddStudent = function(){
          //  $scope.isAddNewKaoSheng = false; //显示添加单个考生页面
          //};
          //
          ///**
          // * 新建考试删除里面的考生
          // */
          //$scope.addKsDelStu = function(stu){
          //  if(confirm('确定要删除此考生吗？')){
          //    $scope.studentsOrgData = Lazy($scope.studentsOrgData).reject(function(t){
          //      return t.UID == stu.UID;
          //    }).toArray();
          //  }
          //};
          //
          ///**
          // * 清楚已添加的考生
          // */
          //$scope.clearKaoShengList = function(){
          //  if($scope.kaoshiData.shuju.BAOMINGFANGSHI == 1){
          //    Lazy($scope.kaoshiData.shuju.CHANGCI).each(function(cc){
          //      if((cc.tempIdx == $scope.selectChangCi.tempIdx) &&
          //        (cc.KAOSHI_MINGCHENG == $scope.selectChangCi.KAOSHI_MINGCHENG)){
          //        cc.KAOSHENG = [];
          //      }
          //    });
          //  }
          //  else{
          //    $scope.kaoshiData.shuju.KAOSHENG = [];
          //  }
          //  $scope.studentsOrgData = '';
          //};
          //
          ///**
          // * 保存考试
          // */
          //function submitFORMPost(path, params, method) {
          //  method = method || "post";
          //  var form = document.createElement("form");
          //  form.setAttribute("id", 'flowControlForm');
          //  form.setAttribute("method", method);
          //  form.setAttribute("action", path);
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
          //  var formData=$("#flowControlForm").serialize();
          //  $.ajax({
          //    type: "POST",
          //    url: path,
          //    processData: true,
          //    data: formData,
          //    success: function(data){
          //      if(data.result){
          //        var node = document.getElementById("flowControlForm");
          //        node.parentNode.removeChild(node);
          //        $scope.showKaoShiZuList(); //新建成功以后返回到开始列表
          //        DataService.alertInfFun('suc', '新建成功！');
          //      }
          //      else{
          //        DataService.alertInfFun('err', data.error);
          //      }
          //      $scope.kwParams.forbidBtn = false;
          //      $scope.loadingImgShow = false;
          //    },
          //    error: function(data) {
          //      DataService.alertInfFun("err", data.responseText);
          //    }
          //  });
          //}
          //$scope.saveKaoShi = function(){
          //  $scope.kaoShengErrorInfo = '';
          //  var errInfo = [];
          //  var kdkwErr = [];
          //  var allKaoWei = 0;
          //  if($scope.kaoshiData.shuju.BAOMINGFANGSHI == 1){ //非在线报名
          //    Lazy($scope.kaoshiData.shuju.CHANGCI).each(function(kc){
          //      var kaoWei = 0;
          //      if(kc.KAOSHENG && kc.KAOSHENG.length > 0){
          //        Lazy(kc.KAOCHANG).each(function(kd){
          //          var kdDetail = Lazy($scope.allKaoChangList).find(function(dkd){
          //            return dkd.KID == kd;
          //          });
          //          kaoWei += parseInt(kdDetail.KAOWEISHULIANG);
          //        });
          //        if(kaoWei < kc.KAOSHENG.length){
          //          kdkwErr.push(kc.KAOSHI_MINGCHENG);
          //        }
          //      }
          //      else{
          //        errInfo.push(kc.KAOSHI_MINGCHENG);
          //      }
          //    });
          //    if(errInfo && errInfo.length > 0){
          //      DataService.alertInfFun('pmt', errInfo.toString() + '缺少考生名单！');
          //      return;
          //    }
          //    if(kdkwErr && kdkwErr.length > 0){
          //      DataService.alertInfFun('pmt', kdkwErr.toString() + '的考位数少于考生人数！');
          //      return;
          //    }
          //  }
          //  if($scope.kaoshiData.shuju.BAOMINGFANGSHI == 2){ //在线报名
          //    //添加考生名单
          //    if($scope.studentsOrgData && $scope.studentsOrgData.length > 0){
          //      $scope.kaoshiData.shuju.KAOSHENG = $scope.studentsOrgData;
          //      Lazy($scope.kaoshiData.shuju.CHANGCI).each(function(kc){
          //        Lazy(kc.KAOCHANG).each(function(kd){
          //          var kdDetail = Lazy($scope.allKaoChangList).find(function(dkd){
          //            return dkd.KID == kd;
          //          });
          //          allKaoWei += parseInt(kdDetail.KAOWEISHULIANG);
          //        });
          //      });
          //      if(allKaoWei < $scope.kaoshiData.shuju.KAOSHENG.length){
          //        DataService.alertInfFun('pmt', '考位数少于考生人数！');
          //        return;
          //      }
          //    }
          //    else{
          //      DataService.alertInfFun('pmt', '请添加考生！');
          //      return;
          //    }
          //    $scope.kaoshiData.shuju.ZHUANGTAI = 2;
          //  }
          //  $scope.kwParams.forbidBtn = true;
          //  $scope.loadingImgShow = true;
          //  $scope.kaoshiData.shuju = JSON.stringify($scope.kaoshiData.shuju);
          //  submitFORMPost(addNewKaoShiUrl, $scope.kaoshiData, 'POST');
          //};
          //
          ///**
          // * 查询报名考生
          // */
          //$scope.queryBaoMingStu = function(stat, cc){
          //  //var deferred = $q.defer();
          //  var chaXunKaoSheng;
          //  $scope.changCiKaoSheng = '';
          //  $scope.kwParams.kaoShengState = stat;
          //  if(stat == 'no'){ //在线报名未报名人数
          //    chaXunKaoSheng = qryWeiBaoMingBaseUrl + '&kszid=' + cc;
          //    $scope.kwParams.selectedCc = 'weibaoming';
          //  }
          //  if(stat == 'on'){ //已报名的人数
          //    $scope.kwParams.selectKaoShiId = cc.KAOSHI_ID;
          //    chaXunKaoSheng = qryKaoShengBaseUrl + '&kid=' + cc.KID + '&kaoshiid=' + cc.KAOSHI_ID;
          //    $scope.kwParams.selectedCc = cc;
          //  }
          //  $http.get(chaXunKaoSheng).success(function(data){
          //    if(data && data.length > 0){
          //      $scope.changCiKaoSheng = data;
          //      $scope.kaoChangListShow = false;
          //      //deferred.resolve();
          //    }
          //    else{
          //      $scope.changCiKaoSheng = '';
          //      $scope.kaoChangListShow = true;
          //      DataService.alertInfFun('err', data.error);
          //      //deferred.reject();
          //    }
          //    $scope.showPaperBtn = false;
          //  });
          //  //return deferred.promise;
          //};
          //
          ///**
          // * 删除考生
          // */
          //$scope.deleteKaoSheng = function(ks){
          //  var ksObj = {
          //    token: token,
          //    caozuoyuan: caozuoyuan,
          //    jigouid: jigouid,
          //    lingyuid: lingyuid,
          //    uid: ks.UID,
          //    kszid: $scope.kaoShiDetailData.KAOSHIZU_ID,
          //    kaoshiid: '',
          //    studentState: ''
          //  };
          //  if($scope.kwParams.kaoShengState == 'on'){ //已报名考生删除
          //    ksObj.kaoshiid = $scope.kwParams.selectKaoShiId;
          //    ksObj.studentState = 'on';
          //  }
          //  else{
          //    ksObj.studentState = 'no';
          //  }
          //  if(confirm('你确定要删除此考生吗？')){
          //    $http.get(deleteChangCiStudent, {params:ksObj}).success(function(data){
          //      if(data.result){
          //        $scope.changCiKaoSheng = Lazy($scope.changCiKaoSheng).reject(function(ccks){
          //          return ccks.UID == ks.UID;
          //        }).toArray();
          //        DataService.alertInfFun('suc', '删除成功！')
          //      }
          //      else{
          //        DataService.alertInfFun('err', data.error)
          //      }
          //    });
          //  }
          //};
          //
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
          //$scope.exportKsInfo = function(bmStat, kc){
          //  var ksData = {};
          //  var sheetName = '';
          //  var ksArr = [];
          //  var exportStu;
          //  var exportStuInfoUrl;
          //  var exportFun = function(stuData){
          //    exportStu = Lazy(stuData).sortBy(function(stu){ return parseInt(stu.XUHAO);}).toArray();
          //    Lazy(exportStu).each(function(ks){
          //      var ksObj = {};
          //      ksObj['学号'] = ks.YONGHUHAO;
          //      ksObj['姓名'] = ks.XINGMING;
          //      ksObj['班级'] = ks.BANJI;
          //      ksObj['座位号'] = ks.ZUOWEIHAO;
          //      ksArr.push(ksObj);
          //    });
          //    ksData[sheetName] = ksArr;
          //    exportStuInfoUrl = exportStuInfoBase + sheetName;
          //    var node = document.getElementById('formDownload');
          //    if(node){
          //      node.parentNode.removeChild(node);
          //    }
          //    submitFORMDownload(exportStuInfoUrl, {json: JSON.stringify(ksData)}, 'POST');
          //  };
          //  if(bmStat == 'mdOff'){ //直接从场次那导出考生
          //    var chaXunKaoSheng = qryKaoShengBaseUrl + '&kid=' + kc.KID + '&kaoshiid=' + kc.KAOSHI_ID;
          //    $http.get(chaXunKaoSheng).success(function(data){
          //      if(data && data.length > 0){
          //        var exlName = kc.KAOSHI_MINGCHENG + '_' + kc.kaoShiShiJian.replace(/\ +/g, '_') + '_' + kc.KMINGCHENG;
          //        sheetName = exlName.replace(/:/g, '_');
          //        exportFun(data);
          //      }
          //      else{
          //        DataService.alertInfFun('err', data.error);
          //      }
          //    });
          //  }
          //  if(bmStat == 'mdOn'){ //名单列表考生
          //    if($scope.kwParams.selectedCc && $scope.kwParams.selectedCc != 'weibaoming'){
          //      var exlName = $scope.kwParams.selectedCc.KAOSHI_MINGCHENG + '_' +
          //      $scope.kwParams.selectedCc.kaoShiShiJian.replace(/\ +/g, '_') + '_' + $scope.kwParams.selectedCc.KMINGCHENG;
          //      sheetName = exlName.replace(/:/g, '_');
          //    }
          //    if($scope.kwParams.selectedCc && $scope.kwParams.selectedCc == 'weibaoming'){
          //      sheetName = '未报名考生';
          //    }
          //    exportFun($scope.changCiKaoSheng);
          //  }
          //};
          //
          ///**
          // * 删除考试
          // */
          //$scope.deleteKaoShi = function(ks){
          //  isEditKaoShi = false;
          //  var confirmInfo = confirm("确定要删除考试吗？");
          //  if(confirmInfo){
          //    var deleteKaoShiZu = deleteKaoShiZuUrl + ks.KAOSHIZU_ID;
          //    $http.get(deleteKaoShiZu).success(function(data){
          //      if(data.result){
          //        $scope.showKaoShiZuList($scope.kwParams.kszListZt);
          //        DataService.alertInfFun('suc', '考试删除成功！');
          //      }
          //      else{
          //        DataService.alertInfFun('err', data.error);
          //      }
          //      console.log(data);
          //    });
          //  }
          //};
          //
          ///**
          // * 发布考试 faBuKaoShiBaseUrl
          // */
          //$scope.faBuKaoShi = function(ksId){
          //  var faBuKaoShiUrl = faBuKaoShiBaseUrl + ksId;
          //  var confirmInfo = confirm('确定要发布本次考试吗？');
          //  if(confirmInfo){
          //    $scope.loadingImgShow = true;
          //    $http.get(faBuKaoShiUrl).success(function(data){
          //      if(data.result){
          //        $scope.showKaoShiZuList();
          //        DataService.alertInfFun('suc', '本次考试发布成功！');
          //      }
          //      else{
          //        DataService.alertInfFun('err', '考试发布失败！');
          //      }
          //      $scope.loadingImgShow = false;
          //    });
          //  }
          //};
          //
          ///**
          // * 查看考试详情
          // */
          //$scope.seeKaoShiDetail = function(ks){
          //  var chaXunChangCi = chaXunChangCiUrl + ks.KAOSHIZU_ID;
          //  var ksObj = {
          //    KAOSHIZU_NAME: ks.KAOSHIZU_NAME,
          //    BAOMINGFANGSHI: ks.BAOMINGFANGSHI,
          //    KAOSHIZU_ID: ks.KAOSHIZU_ID,
          //    ZHUANGTAI: ks.ZHUANGTAI,
          //    changci: []
          //  };
          //  $scope.changCiKaoSheng = '';
          //  $scope.kwParams.kaoShengState = '';
          //  $http.get(chaXunChangCi).success(function(data){
          //    if(data && data.length > 0){
          //      var ccArr = [];
          //      Lazy(data).groupBy('KAOSHI_ID').each(function(v, k, l){
          //        var ccDist = Lazy(v).groupBy('KID').toObject();
          //        Lazy(ccDist).each(function(v1, k1, l1){
          //          var ccObj = v1[0];
          //          var sjName = Lazy(v1).map(function(cc){
          //            return cc.SHIJUANMINGCHENG;
          //          }).toArray().join('; ');
          //          var sjId = Lazy(v1).map(function(cc){
          //            return cc.SHIJUAN_ID;
          //          }).toArray().join('; ');
          //          ccObj.SHIJUANMINGCHENG = sjName;
          //          ccObj.SHIJUAN_ID = sjId;
          //          ccObj.kaoShiShiJian = DataService.baoMingDateFormat(ccObj.KAISHISHIJIAN, ccObj.JIESHUSHIJIAN);
          //          ccArr.push(ccObj);
          //        });
          //      });
          //      Lazy(ccArr).sortBy(function(cc){return cc.KAISHISHIJIAN});
          //      ksObj.changci = ccArr;
          //      $scope.kaoShiDetailData = ksObj;
          //      $scope.kaoChangListShow = true;
          //      $scope.showPaperBtn = false;
          //      $scope.kwParams.showKaoShiDetail = true;
          //    }
          //    else{
          //      DataService.alertInfFun('err', data.error);
          //      $scope.kaoShiDetailData = '';
          //    }
          //  });
          //};
          //
          ///**
          // * 切换场次和考生名单
          // */
          //$scope.showChangCiToggle = function(){
          //  $scope.kaoChangListShow = true;
          //  $scope.showPaperBtn = false;
          //  $scope.kwParams.selectedCc = '';
          //};
          //
          ///**
          // * 显示场次的试卷信息
          // */
          //$scope.showPaperInfo = function(){
          //  var alertKsArr = [];
          //  $scope.alertPaperCc = '';
          //  $scope.showPaperBtn = true;
          //  Lazy($scope.kaoShiDetailData.changci)
          //    .groupBy('KAOSHI_ID')
          //    .each(function(v, k, l){
          //      v[0].ckd = false;
          //      alertKsArr.push(v[0]);
          //    });
          //  if(alertKsArr && alertKsArr.length > 0){
          //    $scope.alertPaperCc = alertKsArr;
          //  }
          //  else{
          //    $scope.alertPaperCc = '';
          //    DataService.alertInfFun('err', '没有场次信息！');
          //  }
          //  $scope.paperListIds = '';
          //  $scope.showPaperListBox = false;
          //};
          //
          ///**
          // * 修改试卷
          // */
          //$scope.alertPaperWrapShow = function(){
          //  $scope.paperListIds = angular.copy(paperListOriginData);
          //  $scope.kwParams.checkedAllChangCi = false;
          //  $scope.showPaperListBox = true;
          //};
          //
          ///**
          // * 考场的全选
          // */
          //$scope.checkAllChangCi = function(){
          //  Lazy($scope.alertPaperCc).each(function(cc){
          //    if($scope.kwParams.checkedAllChangCi){
          //      cc.ckd = true;
          //    }
          //    else{
          //      cc.ckd = false;
          //    }
          //  })
          //};
          //
          ///**
          // * 选择本场次
          // */
          //$scope.checkThisChangCi = function(cc){
          //  cc.ckd = !cc.ckd;
          //};
          //
          ///**
          // * 选择本试卷
          // */
          //$scope.checkThisShiJuan = function(sj){
          //  sj.ckd = !sj.ckd;
          //};
          //
          ///**
          // * 保存试卷修改
          // */
          //$scope.saveAlertPaper = function(){
          //  var ccIdArr = [];
          //  var sjIdArr = [];
          //  var err = [];
          //  var obj = {
          //    token: token,
          //    caozuoyuan: caozuoyuan,
          //    jigouid: jigouid,
          //    lingyuid: lingyuid,
          //    kaoshiid: '',
          //    shijuanid: ''
          //  };
          //  Lazy($scope.alertPaperCc).each(function(cc){
          //    if(cc.ckd){
          //      ccIdArr.push(cc.KAOSHI_ID);
          //    }
          //  });
          //  Lazy($scope.paperListIds).each(function(sj){
          //    if(sj.ckd){
          //      sjIdArr.push(sj.SHIJUAN_ID);
          //    }
          //  });
          //  if(!(ccIdArr && ccIdArr.length > 0)){
          //    err.push('请选择考试！');
          //  }
          //  if(!(sjIdArr && sjIdArr.length > 0)){
          //    err.push('请选择试卷！');
          //  }
          //  if(err && err.length > 0){
          //    DataService.alertInfFun('err', err.join(';'));
          //  }
          //  else{
          //    obj.kaoshiid = ccIdArr;
          //    obj.shijuanid = sjIdArr;
          //    $http.post(xiuGaiKaoShiShiJuanUrl, obj).success(function(data){
          //      if(data.result){
          //        $scope.kwParams.showKaoShiDetail = false;
          //        DataService.alertInfFun('suc', '修改成功！');
          //      }
          //      else{
          //        DataService.alertInfFun('err', data.error);
          //      }
          //    });
          //  }
          //};
          //
          ///**
          // * 导出考生
          // */
          ////$scope.exportKaoSheng = function(){
          ////
          ////};
          //
          ///**
          // * 查询考场数据
          // */
          //$scope.getThisKaoChangPageData = function(pg){
          //  $scope.loadingImgShow = true;
          //  var pgNum = pg - 1,
          //    kaochang_id,
          //    currentPage = pgNum ? pgNum : 0,
          //    qrySelectKaoChangsUrl;
          //  //得到分页数组的代码
          //  var currentKcPageVal = $scope.currentKcPageVal = pg ? pg : 1;
          //  if(totalKaoChangPage <= paginationLength){
          //    $scope.kaoChangPages = kaoChangPageArr;
          //  }
          //  if(totalKaoChangPage > paginationLength){
          //    if(currentKcPageVal > 0 && currentKcPageVal <= 6 ){
          //      $scope.kaoChangPages = kaoChangPageArr.slice(0, paginationLength);
          //    }
          //    else if(currentKcPageVal > totalKaoChangPage - 5 && currentKcPageVal <= totalKaoChangPage){
          //      $scope.kaoChangPages = kaoChangPageArr.slice(totalKaoChangPage - paginationLength);
          //    }
          //    else{
          //      $scope.kaoChangPages = kaoChangPageArr.slice(currentKcPageVal - 5, currentKcPageVal + 5);
          //    }
          //  }
          //  //查询数据的代码
          //  kaochang_id = kaoChangIdArrRev.slice(currentPage * itemNumPerPage, (currentPage + 1) * itemNumPerPage).toString();
          //  qrySelectKaoChangsUrl = qryKaoChangDetailBaseUrl + '&kid=' + kaochang_id;
          //  $http.get(qrySelectKaoChangsUrl).success(function(kcdtl){
          //    if(kcdtl.length){
          //      $scope.loadingImgShow = false; //kaoChangList.html
          //      $scope.kaoChangList = kcdtl;
          //    }
          //    else{
          //      DataService.alertInfFun('err', '没有相关的考场信息！');
          //      $scope.loadingImgShow = false; //kaoChangList.html
          //    }
          //  });
          //};

          /**
           * 重新加载 mathjax
           */
          $scope.$on('onRepeatLast', function(scope, element, attrs){
            MathJax.Hub.Config({
              tex2jax: {inlineMath: [["#$", "$#"]], displayMath: [['#$$','$$#']]},
              messageStyle: "none",
              showMathMenu: false,processEscapes: true
            });
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, "kaoWuPaperDetail"]);
          });

        }
      ]
    );
  }
);
