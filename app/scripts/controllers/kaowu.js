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
          var kaoDianUrl = '/kaodian'; //考点
          var shiJuanZuUrl = '/shijuanzu'; //试卷组
          var keXuHaoXueShengUrl = '/kexuhao_xuesheng'; //由课序号查询学生
          var keXuHaoUrl = '/kexuhao'; //查询课序号
          var paperListOriginData = ''; //试卷组全部数据
          var newChangCi = ''; //新场次
          var keXuHaoStore = ''; //存放课序号的变量
          var kaoShiZuStore = ''; //存放考试组的变量
          var itemNumPerPage = 10; //每页多少条数据
          var paginationLength = 11; //分页显示多少也
          var sjzIdTemp = ''; //存放试卷组ID的临时变量
          $scope.kwParams = { //考务用到的变量
            dftKmName: dftKm, //默认科目名称
            kszListZt: '', //考试列表的状态
            editKcTp: '', //编辑考点的类型
            ksLen: '', //考试时长
            kdId: '', //选择考点的ID
            addChangCi: false, //是否为添加场次
            addXsBuKxh: false, //通过课序号添加学生
            startDate: '', //添加场次是的开始时间
            kwNum: '', //选中场次的考位数
            forbidBtn: false //提交后的禁止按钮
            //showKaoShiDetail: false, //考试详细信息
            //selectShiJuan: [], //存放已选择试卷的数组
            //kaoShengState: '', //判断考生状态
            //baoMingMethod: '', //报名方式
            //selectKaoShiId: '', // 选中考试的ID
            //checkedAllChangCi: false,
            //selectedCc: '', //选中的场次
          };
          $scope.kaochangData = '';
          $scope.pageParam = { //分页参数
            activePage: '',
            lastPage: '',
            pageArr: [],
            disPage: []
          };
          //$scope.tiXingArr = config.tiXingArr; //题型名称数组
          //$scope.letterArr = config.letterArr; //题支的序号
          //$scope.cnNumArr = config.cnNumArr; //汉语的大学数字
          ////$rootScope.dashboard_shown = true;
          //$scope.showAddStuBox = false; //显示添加考生页面
          //$scope.isAddStuByKxh = false; //判断添加考生类型
          //$scope.isAddStuByExcel = false; //判断添加考生类型
          //$scope.keXuHaoData = '';

          /**
           * 查询考点
           */
          var qryKaoDianList = function(){
            if(!($scope.allKaoChangList && $scope.allKaoChangList.length > 0)){
              var obj = {method: 'GET', url: kaoDianUrl, params: {'学校ID': jgID}};
              $http(obj).success(function(data){
                if(data.result){
                  $scope.allKaoChangList = data.data;
                }
                else{
                  $scope.allKaoChangList = '';
                  DataService.alertInfFun('err', data.error);
                }
              });
            }
          };

          /**
           * 查询试卷组列表
           */
          var qryShiJuanZuList = function(){
            var obj = {
              method: 'GET',
              url: shiJuanZuUrl,
              params: {'学校ID': jgID, '科目ID': keMuId}
            };
            if(!(paperListOriginData && paperListOriginData.length > 0)){
              $http(obj).success(function(data){
                if(data.result){
                  paperListOriginData = data.data;
                }
                else{
                  paperListOriginData = '';
                  DataService.alertInfFun('err', data.error);
                }
              });
            }
          };

          /**
           * 分页处理函数 --
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
                pageMake(data.data);
                kaoShiZuStore = Lazy(data.data).reverse().toArray();
                $scope.kaoShiZuDist(1);
              }
              else{
                kaoShiZuStore = '';
                DataService.alertInfFun('err', data.error);
              }
              $scope.loadingImgShow = false;
            });
            $scope.tabActive = 'kszgl';
            $scope.kwParams.kszListZt = stat;
            $scope.txTpl = 'views/kaowu/kaoShiZuList.html';
          };
          $scope.showKaoShiZuList('all');

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
           * 新增一个考试组
           */
          $scope.addNewKaoShiZu = function(ksz){
            var editKaoShiZu = false;
            $scope.kaoShiZuData = {
              //'考试组ID': '',
              '考试组名称': '',
              '学校ID': jgID,
              '科目ID': keMuId,
              '报名方式': '',
              //'报名开始时间': '',
              //'报名截止时间': '',
              '考试须知': '',
              '考试组设置': {
                '选项乱序': false,
                '题目乱序': false,
                '填空题笔答': false,
                '允许计算器': false
              },
              '考试': []
            };
            qryKaoDianList();
            qryShiJuanZuList();
            if(editKaoShiZu){
              $scope.kwParams.ksLen = ksz['考试'][0]['考试时长'];
              $scope.kaoShiZuData['考试组ID'] = ksz['考试组ID'];
              $scope.kaoShiZuData['考试组名称'] = ksz['考试组名称'];
              $scope.kaoShiZuData['学校ID'] = ksz['学校ID'];
              $scope.kaoShiZuData['科目ID'] = ksz['科目ID'];
              $scope.kaoShiZuData['报名方式'] = ksz['报名方式'];
              $scope.kaoShiZuData['考试须知'] = ksz['考试须知'];
              $scope.kaoShiZuData['考试组设置']['选项乱序'] = ksz['考试组设置']['选项乱序'];
              $scope.kaoShiZuData['考试组设置']['题目乱序'] = ksz['考试组设置']['题目乱序'];
              $scope.kaoShiZuData['考试组设置']['填空题笔答'] = ksz['考试组设置']['填空题笔答'];
              $scope.kaoShiZuData['考试组设置']['允许计算器'] = ksz['考试组设置']['允许计算器'];
              if(ksz['报名方式'] == 2){
                $scope.kaoShiZuData['报名开始时间'] = ksz['报名开始时间'];
                $scope.kaoShiZuData['报名截止时间'] = ksz['报名截止时间'];
              }
            }
            //else{
            //
            //}
            $scope.tabActive = 'anks';
            $scope.selectChangCi = ''; //选中的场次
            Lazy(paperListOriginData).each(function(sjz){ //重置所有的试卷
              sjz.ckd = false;
            });
            $scope.txTpl = 'views/kaowu/editKaoShiZu.html';
          };

          /**
           * 根据选择的报名方式
           */
          $scope.getBaoMingCont = function(){
            if($scope.kaoShiZuData['报名方式'] == 1){ //非在线报名
              if($scope.kaoShiZuData.hasOwnProperty('报名开始时间')){
                delete $scope.kaoShiZuData['报名开始时间'];
              }
              if($scope.kaoShiZuData.hasOwnProperty('报名截止时间')){
                delete $scope.kaoShiZuData['报名截止时间'];
              }
              if($scope.kaoShiZuData.hasOwnProperty('考生')){
                delete $scope.kaoShiZuData['考生'];
              }
            }
            if($scope.kaoShiZuData['报名方式'] == 2){ //在线报名
              $scope.kaoShiZuData['报名开始时间'] = '';
              $scope.kaoShiZuData['报名截止时间'] = '';
              $scope.kaoShiZuData['考生'] = [];
              if($scope.kaoShiZuData['考试'] && $scope.kaoShiZuData['考试'].length > 0){
                Lazy($scope.kaoShiZuData['考试']).each(function(cc){
                  if(cc.hasOwnProperty('考生')){
                    delete cc['考生'];
                  }
                });
              }
            }
            $scope.kwParams.kdId = '';
            $scope.selectChangCi = ''; //选中的场次
            $scope.selectChangCiIdx = 99999999999;
            $scope.studentsOrgData = '';
            Lazy(paperListOriginData).each(function(sjz){ //重置所有的试卷
              sjz.ckd = false;
            });
            $scope.paperList = paperListOriginData.slice(0, 10);
          };

          /**
           * 显示全部试卷
           */
          $scope.getMoreShiJuan = function(){
            $scope.paperList = paperListOriginData.slice(0);
          };

          /**
           * 添加场次弹出
           */
          $scope.addNewChangCiPop = function(){
            var kssc = parseInt($scope.kwParams.ksLen);
            if(kssc){
              newChangCi = { //场次的数据
                '考试名称': '',
                '考点ID': '',
                '开始时间': '',
                '结束时间': '',
                '考试时长': '',
                '试卷组': []
              };
              if($scope.kaoShiZuData['报名方式'] == 1){
                newChangCi['考生'] = '';
              }
              $scope.kwParams.startDate = '';
              $scope.showAddStuBox = true;
              $scope.kwParams.addChangCi = true;
              $scope.kwParams.addXsBuKxh = false;
              //显示时间选择器
              var showDatePicker = function() {
                $('.start-date').intimidatetime({
                  buttons: [
                    { text: '当前时间', action: function(inst){ inst.value( new Date() ); } }
                  ]
                });
              };
              $timeout(showDatePicker, 500);
            }
            else{
              DataService.alertInfFun('pmt', '考试时长不能为空，请选输入考试时长！');
            }
          };

          /**
           * 添加场次
           */
          $scope.addNewChangCi = function(cdt){
            var domElement = document.querySelector('.start-date');
            var kssj = $scope.kwParams.startDate ? $scope.kwParams.startDate : angular.element(domElement).val();
            var kssc = parseInt($scope.kwParams.ksLen);
            if(cdt == 'submit'){
              //计算结束时间的代码
              if(kssj && kssc){
                var begDate = Date.parse(kssj); //开始时间
                var endDate = begDate + kssc * 60 * 1000; //结束时间
                newChangCi['开始时间'] = kssj;
                newChangCi['结束时间'] = DataService.formatDateZh(endDate);
                newChangCi['考试时长'] = kssc;
                if($scope.kwParams.kdId){
                  newChangCi['考点ID'] = $scope.kwParams.kdId;
                }
                if(sjzIdTemp && sjzIdTemp.length > 0){
                  newChangCi['试卷组'] = sjzIdTemp;
                }
                if($scope.kaoShiZuData['报名方式'] == 1 && $scope.studentsOrgData && $scope.studentsOrgData.length > 0){
                  newChangCi['考生'] = $scope.studentsOrgData;
                }
                $scope.kaoShiZuData['考试'].push(newChangCi);
                //重新给场次命名
                Lazy($scope.kaoShiZuData['考试']).each(function(cc, idx, lst){
                  cc.tempIdx = idx;
                  cc['考试名称'] = '场次' + parseInt(idx + 1);
                });
                $scope.showChangCiInfo(newChangCi, $scope.kaoShiZuData['考试'].length - 1);
              }
              else{
                DataService.alertInfFun('pmt', '开始时间和考试时长不能为空！');
              }
            }
            $scope.showAddStuBox = false;
            $scope.kwParams.addChangCi = false;
            $scope.kwParams.addXsBuKxh = false;
          };

          /**
           * 显示场次详情
           */
          $scope.showChangCiInfo = function(cc, idx){
            $scope.selectChangCi = cc;
            $scope.selectChangCiIdx = idx;
            var fdKd = '';
            if(cc['试卷组'] && cc['试卷组'].length > 0){
              Lazy(paperListOriginData).each(function(sjz){ //重置所有的试卷
                sjz.ckd = false;
              });
              Lazy(cc['试卷组']).each(function(ccsj){ //试卷的反选
                Lazy(paperListOriginData).each(function(sjz){
                  if(sjz['试卷组ID'] == ccsj){
                    sjz.ckd = true;
                  }
                });
              });
            }
            if(cc['考点ID']){ //考场的反选
              $scope.kwParams.kdId = cc['考点ID'];
              fdKd = Lazy($scope.allKaoChangList).each(function(kc){ return kc['考点ID'] == cc['考点ID'] });
              if(fdKd){
                $scope.kwParams.kwNum = fdKd['考位数'];
              }
              else{
                $scope.kwParams.kwNum = 0;
              }
            }
            if(!cc['考点ID']){ //所选场次为空
              fdKd = Lazy($scope.allKaoChangList).each(function(kc){ return kc['考点ID'] == $scope.kwParams.kdId });
              if(fdKd){
                $scope.kwParams.kwNum = fdKd['考位数'];
              }
              else{
                $scope.kwParams.kwNum = 0;
              }
            }
            if(!(cc['试卷组'] && cc['试卷组'].length > 0)){
              Lazy(paperListOriginData).each(function(sjz){
                if(sjz.ckd){
                  var findIn = Lazy(cc['试卷组']).contains(sjz['试卷组ID']);
                  if(!findIn){
                    cc['试卷组'].push(sjz['试卷组ID']);
                  }
                }
              });
            }
            if($scope.kaoShiZuData['报名方式'] == 1){
              $scope.studentsOrgData = cc['考生'] || 0;
            }
            //排序把选中的放到最前面
            paperListOriginData = Lazy(paperListOriginData).sortBy(function(asj){return asj.ckd}).reverse().toArray();
            $scope.paperList = paperListOriginData.slice(0, 10);
          };

          /**
           * 将考场添加到场次
           */
          $scope.addKaoChangToCc = function(kc){
            if($scope.kwParams.kdId){
              Lazy($scope.kaoShiZuData['考试']).each(function(cc){
                if(cc['考试名称'] == $scope.selectChangCi['考试名称']){
                  cc['考点ID'] = kc['考点ID'];
                }
              });
              $scope.kwParams.kwNum = kc['考位数'];
            }
            else{
              DataService.alertInfFun('pmt', '请选择试考点！');
            }
          };

          /**
           * 将试卷添加到场次
           */
          $scope.addShiJuanToCc = function(sj){
            var sjIds = [];
            sj.ckd = !sj.ckd;
            Lazy($scope.paperList).each(function(asj){
              if(asj.ckd){
                sjIds.push(asj['试卷组ID']);
              }
            });
            if(sjIds.length > 0){
              sjzIdTemp = sjIds;
              Lazy($scope.kaoShiZuData['考试']).each(function(cc){
                if(cc['考试名称'] == $scope.selectChangCi['考试名称']){
                  cc['试卷组'] = sjIds;
                }
              });
            }
            else{
              sjzIdTemp = '';
              DataService.alertInfFun('pmt', '请选择试卷组！');
            }
          };

          /**
           * 删除场次
           */
          $scope.deleteChangCi = function(cc, idx){
            $scope.kaoShiZuData['考试'].splice(idx, 1);
          };

          /**
           * 由课序号添加考生
           */
          $scope.addStuByKxh = function(){
            if(keXuHaoStore && keXuHaoStore.length > 0){
              pageMake(keXuHaoStore);
              $scope.keXuHaoDist(1);
              $scope.showAddStuBox = true;
              $scope.kwParams.addChangCi = false;
              $scope.kwParams.addXsBuKxh = true;
            }
            else{
              var obj = {
                method: 'GET',
                url: keXuHaoUrl,
                params: {'学校ID': jgID, '科目ID': keMuId, '返回学生人数': true}
              };
              $http(obj).success(function(data){
                if(data.result){
                  var dataLength = data.data.length; //课序号的长度
                  keXuHaoStore = data.data;
                  if(dataLength > 10){
                    pageMake(data.data);
                    $scope.keXuHaoDist(1);
                  }
                  else{
                    $scope.keXuHaoData = data.data;
                  }
                  $scope.showAddStuBox = true;
                  $scope.kwParams.addChangCi = false;
                  $scope.kwParams.addXsBuKxh = true;
                }
                else{
                  DataService.alertInfFun('err', data.error);
                }
              });
            }
          };

          /**
           * 课序号的分页数据
           */
          $scope.keXuHaoDist = function(pg){
            var pgNum = pg - 1;
            var cutPage = pgNum ? pgNum : 0;
            cutPageFun(pg);
            $scope.keXuHaoData = keXuHaoStore.slice(cutPage * itemNumPerPage, (cutPage + 1) * itemNumPerPage);
          };

          /**
           * 关闭添加考生页面
           */
          $scope.closeAddStuBox = function(){
            $scope.showAddStuBox = false;
            $scope.kwParams.addChangCi = false;
            $scope.kwParams.addXsBuKxh = false;
            $scope.studentsOrgData = '';
          };

          /**
           * 选中课序号
           */
          $scope.pickOnKxh = function(kxh){
            kxh.ckd = !kxh.ckd;
          };

          /**
           * 查询课序号学生
           */
          $scope.chaXunKxhYongHu = function(){
            var kxhId = [];
            $scope.studentsOrgData = [];
            Lazy(keXuHaoStore).each(function(kxh){
              if(kxh.ckd){
                kxhId.push(kxh['课序号ID']);
              }
            });
            if(kxhId && kxhId.length > 0){
              var obj = {
                method: 'GET',
                url: keXuHaoXueShengUrl,
                params: { '课序号ID': JSON.stringify(kxhId) }
              };
              $http(obj).success(function(data){
                if(data.result){
                  $scope.showAddStuBox = false;
                  $scope.studentsOrgData = Lazy(data.data).uniq('UID').toArray();
                  //将名单加入考试数据
                  if($scope.kaoShiZuData['报名方式'] == 1){ //非在线报名
                    Lazy($scope.kaoShiZuData['考试']).each(function(cc){
                      if((cc.tempIdx == $scope.selectChangCi.tempIdx) && (cc['考试名称'] == $scope.selectChangCi['考试名称'])){
                        cc['考生'] = $scope.studentsOrgData;
                      }
                    });
                  }
                  if($scope.kaoShiZuData['报名方式'] == 2){ //在线报名
                    $scope.kaoShiZuData['考生'] = $scope.studentsOrgData;
                  }
                }
                else{
                  $scope.studentsOrgData = '';
                }
              });
            }
            else{
              DataService.alertInfFun('pmt', '您未选择课序号！');
            }
          };

          /**
          * 显示考生列表
          */
          $scope.showKaoShengList = function(){
            $scope.showImportStuds = true;
          };

          /**
           * 关闭考生列表
           */
          $scope.hideImportList = function(){
            $scope.showImportStuds = false;
          };

          /**
          * 新建考试删除里面的考生
          */
          $scope.addKsDelStu = function(stu){
            if(confirm('确定要删除此考生吗？')){
              $scope.studentsOrgData = Lazy($scope.studentsOrgData).reject(function(t){
                return t['UID'] == stu['UID'];
              }).toArray();
              if($scope.kaoShiZuData['报名方式'] == 1 && $scope.selectChangCi){
                $scope.selectChangCi['考生'] = angular.copy($scope.studentsOrgData);
              }
            }
          };

          /**
          * 清除已添加的考生
          */
          $scope.clearKaoShengList = function(){
            if(confirm('确定要删除全部考生吗？')){
              if($scope.kaoShiZuData['报名方式'] == 1){
                Lazy($scope.kaoShiZuData['考试']).each(function(cc){
                  if((cc.tempIdx == $scope.selectChangCi.tempIdx) &&
                    (cc['考试名称'] == $scope.selectChangCi['考试名称'])){
                    cc['考生'] = [];
                  }
                });
              }
              else{
                $scope.kaoShiZuData['考生'] = [];
              }
              $scope.studentsOrgData = '';
            }
          };

          /**
           * 保存考试方法
           */
          function submitFORMPost(path, params, method) {
            method = method || 'PUT';
            var form = document.createElement('form');
            form.setAttribute('id', 'flowControlForm');
            form.setAttribute('method', method);
            form.setAttribute('action', path);
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
            var formData=$('#flowControlForm').serialize();
            $.ajax({
              type: 'PUT',
              url: path,
              processData: true,
              data: formData,
              success: function(data){
                if(data.result){
                  var node = document.getElementById('flowControlForm');
                  node.parentNode.removeChild(node);
                  $scope.showKaoShiZuList(); //新建成功以后返回到开始列表
                  DataService.alertInfFun('suc', '新建成功！');
                }
                else{
                  DataService.alertInfFun('err', data.error);
                }
                $scope.kwParams.forbidBtn = false;
                $scope.loadingImgShow = false;
              },
              error: function(data) {
                DataService.alertInfFun('err', data.responseText);
              }
            });
          }

          /**
           * 保存考试
           */
          $scope.saveKaoShi = function(){
            $scope.kaoShengErrorInfo = '';
            var errInfo = [];
            var kdkwErr = [];
            var allKaoWei = 0;
            var dataPar = angular.copy($scope.kaoShiZuData);
            if(dataPar['报名方式'] == 1){ //非在线报名
              Lazy(dataPar['考试']).each(function(cc){
                delete cc.tempIdx;
                var kaoWei = 0;
                if(cc['考生'] && cc['考生'].length > 0){
                  var kdDetail = Lazy($scope.allKaoChangList).find(function(dkd){
                    return dkd['考点ID'] == cc['考点ID'];
                  });
                  kaoWei += parseInt(kdDetail['考位数']) || 0;
                  if(kaoWei < cc['考生'].length){
                    kdkwErr.push(cc['考试名称']);
                  }
                  //重构考生名单
                  var newKaoShengArr = [];
                  Lazy(cc['考生']).each(function(ks){
                    var nksObj = {
                      'UID': ks.UID || '',
                      '课序号ID': ks['课序号ID']
                    };
                    newKaoShengArr.push(nksObj);
                  });
                  cc['考生'] = newKaoShengArr;
                }
                else{
                  errInfo.push(cc['考试名称']);
                }
              });
              if(errInfo && errInfo.length > 0){
                DataService.alertInfFun('pmt', errInfo.toString() + '缺少考生名单！');
                return;
              }
              if(kdkwErr && kdkwErr.length > 0){
                DataService.alertInfFun('pmt', kdkwErr.toString() + '的考位数少于考生人数！');
                return;
              }
            }
            if(dataPar['报名方式'] == 2){ //在线报名
              if($scope.studentsOrgData && $scope.studentsOrgData.length > 0){
                //重构考生名单
                var newKaoShengArr = [];
                Lazy($scope.studentsOrgData).each(function(ks){
                  var nksObj = {
                    'UID': ks.UID || '',
                    '课序号ID': ks['课序号ID']
                  };
                  newKaoShengArr.push(nksObj);
                });
                dataPar['考生'] = newKaoShengArr;
                Lazy(dataPar['考试']).each(function(cc){
                  delete cc.tempIdx;
                  var kdDetail = Lazy($scope.allKaoChangList).find(function(dkd){
                    return dkd['考点ID'] == cc['考点ID'];
                  });
                  allKaoWei += parseInt(kdDetail['考位数']);
                });
                if(allKaoWei < dataPar['考生'].length){
                  DataService.alertInfFun('pmt', '考位数少于考生人数！');
                  return;
                }
              }
              else{
                DataService.alertInfFun('pmt', '请添加考生！');
                return;
              }
              dataPar['考生'] = JSON.stringify(dataPar['考生']);
            }
            dataPar['考试'] = JSON.stringify(dataPar['考试']);
            $scope.kwParams.forbidBtn = true;
            //$scope.loadingImgShow = true;
            console.log(dataPar);
            //submitFORMPost(kaoShiZuUrl, dataPar, 'PUT');
          };

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

          ///**
          // * 由课序号添加考生
          // */
          //$scope.addStuByKxh = function(){
          //  if(keXuHaoStore && keXuHaoStore.length > 0){
          //    $scope.showAddStuBox = true;
          //    $scope.isAddStuByKxh = true;
          //    $scope.isAddStuByExcel = false;
          //    $scope.kwParams.addChangCi = false;
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
          //        $scope.kwParams.addChangCi = false;
          //      }
          //      else{
          //        DataService.alertInfFun('err', data.error);
          //      }
          //    });
          //  }
          //};
          //

          ///**
          // * 取消添加新考试
          // */
          //$scope.cancelAddStudent = function(){
          //  $scope.isAddNewKaoSheng = false; //显示添加单个考生页面
          //};

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
          //  method = method || 'post';
          //  var form = document.createElement('form');
          //  form.setAttribute('id', 'formDownload');
          //  form.setAttribute('method', method);
          //  form.setAttribute('action', path);
          //  form._submit_function_ = form.submit;
          //  for(var key in params) {
          //    if(params.hasOwnProperty(key)) {
          //      var hiddenField = document.createElement('input');
          //      hiddenField.setAttribute('type', 'hidden');
          //      hiddenField.setAttribute('name', key);
          //      hiddenField.setAttribute('value', params[key]);
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
          //  var confirmInfo = confirm('确定要删除考试吗？');
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
              tex2jax: {inlineMath: [['#$', '$#']], displayMath: [['#$$','$$#']]},
              messageStyle: 'none',
              showMathMenu: false,processEscapes: true
            });
            MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'kaoWuPaperDetail']);
          });

        }
      ]
    );
  }
);
