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
          var dftKm = JSON.parse($cookieStore.get('ckKeMu')); //默认选择的科目
          var keMuId = dftKm['科目ID']; //默认的科目ID
          var kaoShiZuUrl = '/kaoshizu'; //考试组
          var daBaoShiJuanUrl = '/dabao_shijuan'; //打包试卷
          var faBuKaoShiZuUrl = '/fabu_kaoshizu'; //发布考试组
          var kaoDianUrl = '/kaodian'; //考点
          var shiJuanZuUrl = '/shijuanzu'; //试卷组
          var keXuHaoXueShengUrl = '/kexuhao_xuesheng'; //由课序号查询学生
          var keXuHaoUrl = '/kexuhao'; //查询课序号
          var kaoShiShiJuanZuUrl = '/kaoshi_shijuanzu'; //查询考试用到的考试组
          var exportStuUrl = '/json2excel'; //导出考生
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
            forbidBtn: false, //提交后的禁止按钮
            showCcSjz: false, //显示场次用到的试卷组
            showStu: false, //显示考生列表
            selectedCc: '' //选中的场次
          };
          $scope.kaochangData = '';
          $scope.pageParam = { //分页参数
            activePage: '',
            lastPage: '',
            pageArr: [],
            disPage: []
          };

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
           * 打包试卷
           */
          $scope.daBaoShiJuan = function(kszId){
            var obj = {
              method: 'GET',
              url: daBaoShiJuanUrl,
              params: {
                '考试组ID': ''
              }
            };
            if($scope.kaoShiZuDtl && $scope.kaoShiZuDtl['考试组ID']){
              obj.params['考试组ID'] = $scope.kaoShiZuDtl['考试组ID'];
              if(confirm('你确定要重新打包试卷组吗？')){
                $http(obj).success(function(data){
                  if(data.result){
                    DataService.alertInfFun('suc', '打包成功！');
                  }
                  else{
                    DataService.alertInfFun('err', data.error);
                  }
                });
              }
            }
            else{
              DataService.alertInfFun('err', '请选择要重新打包的考试组！');
            }
          };

          /**
           * 显示考试列表,可分页的方法, zt表示状态 1，2，3，4为完成；5，6已完成
           */
          $scope.showKaoShiZuList = function(zt){
            var obj = {
              method: 'GET',
              url: kaoShiZuUrl,
              params: {
                '学校ID': jgID,
                '科目ID': keMuId,
                '返回考试': true,
                '返回考生': true,
                '返回考生详细信息': true,
                '返回试卷': true
              }
            };
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
            //var editKaoShiZu = false;
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
            //if(editKaoShiZu){
            //  $scope.kwParams.ksLen = ksz['考试'][0]['考试时长'];
            //  $scope.kaoShiZuData['考试组ID'] = ksz['考试组ID'];
            //  $scope.kaoShiZuData['考试组名称'] = ksz['考试组名称'];
            //  $scope.kaoShiZuData['学校ID'] = ksz['学校ID'];
            //  $scope.kaoShiZuData['科目ID'] = ksz['科目ID'];
            //  $scope.kaoShiZuData['报名方式'] = ksz['报名方式'];
            //  $scope.kaoShiZuData['考试须知'] = ksz['考试须知'];
            //  $scope.kaoShiZuData['考试组设置']['选项乱序'] = ksz['考试组设置']['选项乱序'];
            //  $scope.kaoShiZuData['考试组设置']['题目乱序'] = ksz['考试组设置']['题目乱序'];
            //  $scope.kaoShiZuData['考试组设置']['填空题笔答'] = ksz['考试组设置']['填空题笔答'];
            //  $scope.kaoShiZuData['考试组设置']['允许计算器'] = ksz['考试组设置']['允许计算器'];
            //  if(ksz['报名方式'] == 2){
            //    $scope.kaoShiZuData['报名开始时间'] = ksz['报名开始时间'];
            //    $scope.kaoShiZuData['报名截止时间'] = ksz['报名截止时间'];
            //  }
            //}
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
            var domElement = document.querySelector('.ccStart');
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
              fdKd = Lazy($scope.allKaoChangList).find(function(kc){ return kc['考点ID'] == cc['考点ID'] });
              if(fdKd){
                $scope.kwParams.kwNum = fdKd['考位数'];
              }
              else{
                $scope.kwParams.kwNum = 0;
              }
            }
            if(!cc['考点ID']){ //所选场次为空
              fdKd = Lazy($scope.allKaoChangList).find(function(kc){ return kc['考点ID'] == $scope.kwParams.kdId });
              if(fdKd){
                cc['考点ID'] = $scope.kwParams.kdId;
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
              type: method,
              url: path,
              processData: true,
              data: formData,
              success: function(data){
                var newData = '';
                if(typeof(data) == 'string'){
                  newData = JSON.parse(data);
                }
                if(newData.result){
                  var node = document.getElementById('flowControlForm');
                  node.parentNode.removeChild(node);
                  $scope.showKaoShiZuList(); //新建成功以后返回到开始列表
                  DataService.alertInfFun('suc', '新建成功！');
                }
                else{
                  DataService.alertInfFun('err', newData.error);
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
              var bbStart = document.querySelector('.bbStart');
              $scope.kaoShiZuData['报名开始时间'] = $scope.kaoShiZuData['报名开始时间'] ? $scope.kaoShiZuData['报名开始时间'] : angular.element(bbStart).val();
              dataPar['报名开始时间'] = dataPar['报名开始时间'] ? dataPar['报名开始时间'] : angular.element(bbStart).val();
              var bbEnd = document.querySelector('.bbEnd');
              $scope.kaoShiZuData['报名截止时间'] = $scope.kaoShiZuData['报名截止时间'] ? $scope.kaoShiZuData['报名截止时间'] : angular.element(bbEnd).val();
              dataPar['报名截止时间'] = dataPar['报名截止时间'] ? dataPar['报名截止时间'] : angular.element(bbEnd).val();
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
            dataPar['考试组设置'] = JSON.stringify(dataPar['考试组设置']);
            $scope.kwParams.forbidBtn = true;
            $scope.loadingImgShow = true;
            submitFORMPost(kaoShiZuUrl, dataPar, 'PUT');
          };

          /**
           * 删除考试
           */
          $scope.deleteKaoShiZu = function(kszId){
            if(confirm('确定要删除此考试组吗？')){
              var obj = {
                method: 'POST',
                url: kaoShiZuUrl,
                data: {'考试组ID': kszId, '状态': -1}
              };
              $http(obj).success(function(data){
                if(data.result){
                  $scope.showKaoShiZuList($scope.kwParams.kszListZt);
                  DataService.alertInfFun('suc', '考试删除成功！');
                }
                else{
                  DataService.alertInfFun('err', data.error);
                }
              });
            }
          };

          /**
           * 发布考试组
           */
          $scope.faBuKaoShiZu = function(kszId){
            var obj = {
              method: 'GET',
              url: faBuKaoShiZuUrl,
              params: { '考试组ID': kszId }
            };
            $http(obj).success(function(data){
              if(data.result){
                $scope.showKaoShiZuList($scope.kwParams.kszListZt);
                DataService.alertInfFun('suc', '发布成功！');
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
            });
          };

          /**
           * 查看考试组详情
           */
          $scope.seeKaoShiZuDetail = function(ksz){
            $scope.kaoShiZuDtl = ksz;
            $scope.kwParams.showStu = false;
            $scope.kwParams.showCcSjz = false;
            $scope.changCiKaoSheng = '';
          };

          /**
           * 关闭查看考试组详情
           */
          $scope.closePaperDtl = function(){
            $scope.kaoShiZuDtl = '';
          };

          /**
           * 显示场次的试卷信息
           */
          $scope.showPaperInfo = function(){
            var obj = {
              method: 'GET',
              url: kaoShiShiJuanZuUrl,
              params: {
                '考试组ID': []
              }
            };
            $scope.alertPaperCc = [];
            if($scope.kaoShiZuDtl['考试组ID']){
              obj.params['考试组ID'].push($scope.kaoShiZuDtl['考试组ID']);
              obj.params['考试组ID'] = JSON.stringify(obj.params['考试组ID']);
              $http(obj).success(function(data){
                if(data.result){
                  var disDt = Lazy(data.data).groupBy('考试ID').toObject();
                  Lazy(disDt).each(function(v, k, l){
                    var ccObj = {
                      '考试ID': k,
                      '考试名称': v[0]['考试名称'],
                      '试卷组信息': ''
                    };
                    var strArr = [];
                    Lazy(v).each(function(ks){
                      strArr.push(ks['试卷组名称'] + '(' + ks['试卷组ID'] + ')');
                    });
                    ccObj['试卷组信息'] = strArr.join(';');
                    $scope.alertPaperCc.push(ccObj);
                  });
                }
                else{
                  DataService.alertInfFun('err', data.error);
                }
              });
            }
            else{
              DataService.alertInfFun('pmt', '请选择考试组！');
            }
            $scope.kwParams.showCcSjz = true;
          };

          /**
           * 切换场次和考生名单
           */
          $scope.showChangCiToggle = function(){
            $scope.kwParams.showStu = false;
            $scope.kwParams.showCcSjz = false;
            $scope.kwParams.selectedCc = '';
          };

          /**
           * 查询报名考生
           */
          $scope.showBaoMingStu = function(stat, cc){
            $scope.kwParams.showCcSjz = false;
            $scope.kwParams.showStu = true;
            if(stat == 'no'){ //在线报名未报名人数
              $scope.changCiKaoSheng = angular.copy($scope.kaoShiZuDtl['考生']);
              Lazy($scope.kaoShiZuDtl['考试']).each(function(ks){
                if(ks['考生'] && ks['考生'].length > 0){
                  Lazy(ks['考生']).each(function(stu){
                    $scope.changCiKaoSheng = Lazy($scope.changCiKaoSheng).reject(function(cStu){
                      return cStu['UID'] == stu['UID'];
                    }).toArray();
                  });
                }
              });
              $scope.kwParams.selectedCc = 'weibaoming';
            }
            if(stat == 'on'){ //已报名的人数
              $scope.changCiKaoSheng = cc['考生'];
              $scope.kwParams.selectedCc = cc;
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
          $scope.exportKsInfo = function(bmStat, kc){
            var ksData = {};
            var exlName = '';
            var sheetName = '';
            var ksArr = [];
            var exportStu;
            var exportFun = function(stuData){
              exportStu = Lazy(stuData).sortBy(function(stu){ return parseInt(stu['序号']);}).toArray();
              Lazy(exportStu).each(function(ks){
                var ksObj = {};
                ksObj['序号'] = ks['序号'];
                ksObj['学号'] = ks['学号'];
                ksObj['姓名'] = ks['姓名'];
                ksObj['座位号'] = ks['座位号'];
                ksArr.push(ksObj);
              });
              ksData[sheetName] = ksArr;
              var node = document.getElementById('formDownload');
              if(node){
                node.parentNode.removeChild(node);
              }
              submitFORMDownload(exportStuUrl, {json: JSON.stringify(ksData)}, 'post');
            };
            if(bmStat == 'mdOff'){ //直接从场次那导出考生
              exlName = kc['考试名称'] + '_' + kc['开始时间'].replace(/\ +/g, '_') + '_' + kc['考点名称'];
              sheetName = exlName.replace(/:/g, '_');
              exportFun(kc['考生']);
            }
            if(bmStat == 'mdOn'){ //名单列表考生
              if($scope.kwParams.selectedCc && $scope.kwParams.selectedCc != 'weibaoming'){
                exlName = $scope.kwParams.selectedCc['考试名称'] + '_' +
                $scope.kwParams.selectedCc['开始时间'].replace(/\ +/g, '_') + '_' + $scope.kwParams.selectedCc['考点名称'];
                sheetName = exlName.replace(/:/g, '_');
              }
              if($scope.kwParams.selectedCc && $scope.kwParams.selectedCc == 'weibaoming'){
                sheetName = '未报名考生';
              }
              exportFun($scope.changCiKaoSheng);
            }
          };

          /**
           * 修改试卷
           */
          $scope.alertPaperWrapShow = function(){

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
            MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'kaoWuPaperDetail']);
          });

        }
      ]
    );
  }
);
