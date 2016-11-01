define(['angular', 'config', 'jquery', 'lazy', 'datepicker'], // 000 开始
  function (angular, config, $, lazy, datepicker) { // 001 开始
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
          //var kaoShiShiJuanZuUrl = '/kaoshi_shijuanzu'; //查询考试用到的考试组
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
            notice: false, //显示考试须知
            selectedCc: '', //选中的场次
            year: '', //课序号的筛选年份
            term: '', //课序号的筛选学期
            sjType: 0, //试卷类型
            showCc: false, //显示场次
            showSj: true, //显示试卷
            showNtPre: false, //显示考试须知预览
            newSltSjzId: '', //修改考试组试卷组用到的新选择的试卷组
            sltAllPaper: false //新建考试的时候试卷的全选
          };
          $scope.sltSjz = ''; //选中的试卷组
          $scope.pageParam = { //分页参数
            activePage: '',
            lastPage: '',
            pageArr: [],
            disPage: []
          };
          $scope.pageParamSjz = { //修改考试组试卷用到的分页
            activePage: '',
            lastPage: '',
            pageArr: [],
            disPage: []
          };
          $scope.tiMuNumPerPage = [1, 2, 3, 4, 5];
          $scope.kxhData = { //课序号的日期区分字段
            '年份': [],
            '学期': [{val: 1, name: '秋'}, {val: 2, name: '春'}]
          };

          /**
           * 检查object对象是否为空
           */
          var isEmpty = function(obj){
            for (var name in obj)
            {
              return false;
            }
            return true;
          };

          /**
           * 查询考点
           */
          var qryKaoDianList = function(){
            if(!($scope.allKaoChangList && $scope.allKaoChangList.length > 0)){
              var obj = {
                method: 'GET',
                url: kaoDianUrl,
                params: {
                  '学校ID': jgID
                }
              };
              $http(obj).success(function(data){
                if(data.result && data.data){
                  $scope.allKaoChangList = DataService.cnSort(data.data, '考点名称');
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
          var qryShiJuanZuList = function(ty){
            var obj = {
              method: 'GET',
              url: shiJuanZuUrl,
              params: {
                '学校ID': jgID,
                '科目ID': keMuId,
                '返回试卷': true,
                '返回题目内容': false
              }
            };
            if(!(paperListOriginData && paperListOriginData.length > 0)){
              $http(obj).success(function(data){
                if(data.result && data.data){
                  paperListOriginData = Lazy(data.data).reverse().toArray();
                  pageMake(data.data, ty);
                }
                else{
                  paperListOriginData = '';
                  DataService.alertInfFun('err', data.error);
                }
              });
            }
            else{
              pageMake(paperListOriginData);
            }
          };

          /**
           * 分页处理函数
           */
          var pageMake = function(data, ty){
            var dataLen = data.length; //数据长度
            var lastPage = Math.ceil(dataLen/itemNumPerPage); //最后一页
            if(ty){
              $scope.pageParamSjz = { //分页参数
                activePage: '',
                lastPage: '',
                pageArr: [],
                disPage: []
              };
              $scope.pageParamSjz.pageArr = Lazy.generate(function(i) { return i + 1; }, lastPage).toArray();
              $scope.pageParamSjz.lastPage = lastPage;
              $scope.pageParamSjz.activePage = 1;
              cutPageFun(1, ty);
            }
            else{
              $scope.pageParam = { //分页参数
                activePage: '',
                lastPage: '',
                pageArr: [],
                disPage: []
              };
              $scope.pageParam.pageArr = Lazy.generate(function(i) { return i + 1; }, lastPage).toArray();
              $scope.pageParam.lastPage = lastPage;
              $scope.pageParam.activePage = 1;
              cutPageFun(1);
            }
          };

          /**
           * 分页数据变动的函数
           */
          var cutPageFun = function(pg, ty){
            var activePg = '';
            if(ty){
              activePg = $scope.pageParamSjz.activePage = pg ? pg : 1;
              if($scope.pageParamSjz.lastPage <= paginationLength){
                $scope.pageParamSjz.disPage = $scope.pageParamSjz.pageArr;
              }
              if($scope.pageParamSjz.lastPage > paginationLength){
                if(activePg > 0 && activePg <= 6 ){
                  $scope.pageParamSjz.disPage = $scope.pageParamSjz.pageArr.slice(0, paginationLength);
                }
                else if(activePg > $scope.pageParamSjz.lastPage - 5 && activePg <= $scope.pageParamSjz.lastPage){
                  $scope.pageParamSjz.disPage = $scope.pageParamSjz.pageArr.slice($scope.pageParamSjz.lastPage - paginationLength);
                }
                else{
                  $scope.pageParamSjz.disPage = $scope.pageParamSjz.pageArr.slice(activePg - 5, activePg + 5);
                }
              }
            }
            else{
              activePg = $scope.pageParam.activePage = pg ? pg : 1;
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
                  if(data.result && data.data){
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
                '返回考试': false,
                '返回考生': false,
                '返回考生详细信息': false,
                '返回试卷': false
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
              if(data.result && data.data){
                Lazy(data.data).each(function(ksz){
                  if(ksz['报名方式'] == 2 && ksz['状态'] == 1){
                    ksz['报名周期'] = DataService.formatDateZh(ksz['报名开始时间']) + '—' + DataService.formatDateZh(ksz['报名截止时间']);
                  }
                });
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
            $scope.loadingImgShow = false;
            $scope.kaoShiZuData = {
              //'考试组ID': '',
              '考试组名称': '',
              '学校ID': jgID,
              '科目ID': keMuId,
              '报名方式': '',
              '试卷组ID': '',
              //'报名开始时间': '',
              //'报名截止时间': '',
              '考试须知': '',
              '考试组设置': {
                '随机试卷': false,
                '选项乱序': false,
                '题目乱序': false,
                '填空题笔答': false,
                '允许计算器': false,
                '每页题目数': 1
              },
              '考试': []
            };
            $scope.kxhData['年份'] = [];
            var mydateNew = new Date();
            var year = mydateNew.getFullYear();
            $scope.kxhData['年份'].push(year - 1);
            $scope.kxhData['年份'].push(year);
            $scope.kxhData['年份'].push(year + 1);
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
            //  $scope.kaoShiZuData['考试组设置']['每页题目数'] = ksz['考试组设置']['每页题目数'];
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
          };

          /**
           * 试卷组分页数据
           */
          $scope.sjzDist = function(pg){
            var pgNum = pg - 1;
            var cutPage = pgNum ? pgNum : 0;
            cutPageFun(pg);
            $scope.paperList = paperListOriginData.slice(cutPage * itemNumPerPage, (cutPage + 1) * itemNumPerPage);
          };

          /**
           * 显示试卷组列表 clearSjzId
           */
          $scope.showSjzList = function(ty){
            $scope.showSjzs = true;
            $scope.sjzDist(1);
            if(ty){
              $scope.kwParams.newSltSjzId = angular.copy($scope.kaoShiZuDtl['试卷组ID']);
            }
          };

          /**
           * 选中试卷组
           */
          $scope.selectSjz = function(sjz){
            sjz['试卷'] = Lazy(sjz['试卷']).sortBy('试卷ID').toArray();
            var hasSj = sjz['试卷'] && sjz['试卷'].length > 0;
            var hasKs = $scope.kaoShiZuData['考试'] && $scope.kaoShiZuData['考试'].length > 0;
            $scope.sltSjz = sjz;
            if(hasSj){
              Lazy(sjz['试卷']).each(function(sj){
                sj.ckd = false;
              });
              $scope.kwParams.sjType = 0;
              if(hasKs){
                var sltSjzSjLen = $scope.sltSjz['试卷数量'] || 1;
                Lazy($scope.kaoShiZuData['考试']).each(function(cc, idx, lst){
                  cc['考试设置']['试卷ID'] = [];
                  if(sltSjzSjLen == 1){
                    cc['考试设置']['试卷ID'].push($scope.sltSjz['试卷'][0]['试卷ID']);
                  }
                  else{
                    var nIdx = idx % sltSjzSjLen;
                    cc['考试设置']['试卷ID'].push($scope.sltSjz['试卷'][nIdx]['试卷ID']);
                  }
                });
                $scope.showChangCiInfo($scope.kaoShiZuData['考试'][0], 0);
              }
            }
            else{
              $scope.kwParams.sjType = 1;
              if(hasKs){
                Lazy($scope.kaoShiZuData['考试']).each(function(cc){
                  if(cc['考试设置'].hasOwnProperty('试卷ID')){
                    delete cc['考试设置']['试卷ID'];
                  }
                });
              }
            }
            $scope.kaoShiZuData['试卷组ID'] = parseInt(sjz['试卷组ID']);
            $scope.kaoShiZuData['考试组设置']['随机试卷'] = $scope.kwParams.sjType == 1;
            $scope.showSjzs = false;
          };

          /**
           * 清楚选中的试卷组
           */
          $scope.clearSjzId = function(){
            var hasKs = $scope.kaoShiZuData['考试'] && $scope.kaoShiZuData['考试'].length > 0;
            $scope.sltSjz = '';
            $scope.kaoShiZuData['试卷组ID'] = '';
            $scope.showSjzs = false;
            if(hasKs){
              Lazy($scope.kaoShiZuData['考试']).each(function(cc, idx, lst){
                cc['考试设置']['试卷ID'] = [];
              });
              $scope.showChangCiInfo($scope.kaoShiZuData['考试'][0], 0);
            }
          };

          /**
           * 改变试卷类型
           */
          $scope.changeSjType = function(tp){
            var hasKs = $scope.kaoShiZuData['考试'] && $scope.kaoShiZuData['考试'].length > 0;
            if(tp == 1){
              if(hasKs){
                Lazy($scope.kaoShiZuData['考试']).each(function(cc){
                  if(cc['考试设置'].hasOwnProperty('试卷ID')){
                    delete cc['考试设置']['试卷ID'];
                  }
                });
              }
            }
            else{
              if(hasKs){
                var sltSjzSjLen = $scope.sltSjz['试卷数量'] || 1;
                Lazy($scope.kaoShiZuData['考试']).each(function(cc, idx, lst){
                  cc['考试设置']['试卷ID'] = [];
                  if(sltSjzSjLen == 1){
                    cc['考试设置']['试卷ID'].push($scope.sltSjz['试卷'][0]['试卷ID']);
                  }
                  else{
                    var nIdx = idx % sltSjzSjLen;
                    cc['考试设置']['试卷ID'].push($scope.sltSjz['试卷'][nIdx]['试卷ID']);
                  }
                });
                $scope.showChangCiInfo($scope.kaoShiZuData['考试'][0], 0);
              }
            }
          };

          /**
           * 添加场次弹出
           */
          $scope.addNewChangCiPop = function(){
            var kssc = parseInt($scope.kwParams.ksLen);
            if(!$scope.sltSjz){
              DataService.alertInfFun('pmt', '请先选择试卷组！');
              return ;
            }
            if(kssc){
              newChangCi = { //场次的数据
                '考试名称': '',
                '考点ID': '',
                '开始时间': '',
                '结束时间': '',
                '考试时长': '',
                //'试卷组': [],
                '考试设置': {}
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
                //重新给场次命名和赋值试卷
                var sltSjzSjLen = $scope.sltSjz['试卷数量'] || 1;
                Lazy($scope.kaoShiZuData['考试']).each(function(cc, idx, lst){
                  cc.tempIdx = idx;
                  cc['考试名称'] = '场次' + parseInt(idx + 1);
                  if($scope.kwParams.sjType == 0){
                    cc['考试设置']['试卷ID'] = [];
                    if(sltSjzSjLen == 1){
                      cc['考试设置']['试卷ID'].push($scope.sltSjz['试卷'][0]['试卷ID']);
                    }
                    else{
                      var nIdx = idx % sltSjzSjLen;
                      cc['考试设置']['试卷ID'].push($scope.sltSjz['试卷'][nIdx]['试卷ID']);
                    }
                  }
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
            $scope.kwParams.sltAllPaper = false;
          };

          /**
           * 显示场次详情
           */
          $scope.showChangCiInfo = function(cc, idx){
            $scope.selectChangCi = cc;
            $scope.selectChangCiIdx = idx;
            var fdKd = '';
            if($scope.kwParams.sjType == 0){
              if(cc['考试设置']['试卷ID'] && cc['考试设置']['试卷ID'].length > 0){
                Lazy($scope.sltSjz['试卷']).each(function(sj){ //重置所有的试卷
                  sj.ckd = false;
                });
                Lazy(cc['考试设置']['试卷ID']).each(function(ccsj){ //试卷的反选
                  Lazy($scope.sltSjz['试卷']).each(function(sj){
                    if(sj['试卷ID'] == ccsj){
                      sj.ckd = true;
                    }
                  });
                });
              }
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
            //if(!(cc['试卷组'] && cc['试卷组'].length > 0)){
            //  Lazy(paperListOriginData).each(function(sjz){
            //    if(sjz.ckd){
            //      var findIn = Lazy(cc['试卷组']).contains(sjz['试卷组ID']);
            //      if(!findIn){
            //        cc['试卷组'].push(sjz['试卷组ID']);
            //      }
            //    }
            //  });
            //}
            if($scope.kaoShiZuData['报名方式'] == 1){
              $scope.studentsOrgData = cc['考生'] || 0;
            }
            //排序把选中的放到最前面
            //paperListOriginData = Lazy(paperListOriginData).sortBy(function(asj){return asj.ckd}).reverse().toArray();
            //$scope.paperList = paperListOriginData.slice(0, 10);
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
            if(sj == 'all'){
              Lazy($scope.sltSjz['试卷']).each(function(asj){
                if($scope.kwParams.sltAllPaper){
                  asj.ckd = true;
                  sjIds.push(asj['试卷ID']);
                }
                else{
                  asj.ckd = false;
                }
              });
            }
            else{
              sj.ckd = !sj.ckd;
              Lazy($scope.sltSjz['试卷']).each(function(asj){
                if(asj.ckd){
                  sjIds.push(asj['试卷ID']);
                }
              });
            }
            if(sjIds.length > 0){
              sjzIdTemp = sjIds;
              Lazy($scope.kaoShiZuData['考试']).each(function(cc){
                if(cc['考试名称'] == $scope.selectChangCi['考试名称']){
                  cc['考试设置']['试卷ID'] = sjIds;
                }
              });
            }
            else{
              sjzIdTemp = '';
              DataService.alertInfFun('pmt', '请选择试卷！');
            }
          };

          /**
           * 删除场次
           */
          $scope.deleteChangCi = function(cc, idx){
            $scope.kaoShiZuData['考试'].splice(idx, 1);
          };

          /**
           * 查询课序号
           */
          $scope.qryKxh = function(){
            var obj = {
              method: 'GET',
              url: keXuHaoUrl,
              params: {'学校ID': jgID, '科目ID': keMuId, '返回学生人数': true}
            };
            if($scope.kwParams.year){
              obj.params['年度'] = $scope.kwParams.year;
            }
            if($scope.kwParams.term){
              obj.params['学期'] = $scope.kwParams.term;
            }
            $http(obj).success(function(data){
              if(data.result && data.data){
                var dataLength = data.data.length; //课序号的长度
                data.data = Lazy(data.data).reverse().toArray();
                Lazy(data.data).each(function(kxh){
                  if(kxh['学期']){
                    kxh['中文学期'] = kxh['学期'] == 1 ? '秋' : '春';
                  }
                });
                keXuHaoStore = data.data;
                pageMake(data.data);
                if(dataLength > 10){
                  $scope.keXuHaoDist(1);
                }
                else{
                  $scope.keXuHaoData = data.data;
                }
              }
              else{
                $scope.keXuHaoData = '';
                keXuHaoStore = '';
                DataService.alertInfFun('err', data.error);
              }
            });
          };

          /**
           * 由课序号添加考生
           */
          $scope.addStuByKxh = function(){
            $scope.kwParams.year = '';
            $scope.kwParams.term = '';
            $scope.qryKxh();
            $scope.showAddStuBox = true;
            $scope.kwParams.addChangCi = false;
            $scope.kwParams.addXsBuKxh = true;
            //if(keXuHaoStore && keXuHaoStore.length > 0){
            //  //pageMake(keXuHaoStore);
            //  //$scope.keXuHaoDist(1);
            //  //$scope.showAddStuBox = true;
            //  //$scope.kwParams.addChangCi = false;
            //  //$scope.kwParams.addXsBuKxh = true;
            //}
            //else{
            //  //var obj = {
            //  //  method: 'GET',
            //  //  url: keXuHaoUrl,
            //  //  params: {'学校ID': jgID, '科目ID': keMuId, '返回学生人数': true}
            //  //};
            //  //$http(obj).success(function(data){
            //  //  if(data.result && data.data){
            //  //    var dataLength = data.data.length; //课序号的长度
            //  //    Lazy(data.data).each(function(kxh){
            //  //      if(kxh['学期']){
            //  //        kxh['中文学期'] = kxh['学期'] == 1 ? '秋' : '春';
            //  //      }
            //  //    });
            //  //    keXuHaoStore = data.data;
            //  //    if(dataLength > 10){
            //  //      pageMake(data.data);
            //  //      $scope.keXuHaoDist(1);
            //  //    }
            //  //    else{
            //  //      $scope.keXuHaoData = data.data;
            //  //    }
            //  //    $scope.showAddStuBox = true;
            //  //    $scope.kwParams.addChangCi = false;
            //  //    $scope.kwParams.addXsBuKxh = true;
            //  //  }
            //  //  else{
            //  //    DataService.alertInfFun('err', data.error);
            //  //  }
            //  //});
            //}
          };

          ///**
          // * 由年份查询课序号
          // */
          //$scope.getKxhByYear = function(){
          //
          //};
          //
          ///**
          // * 由学期查询课序号
          // */
          //$scope.getKxhByYear = function(){
          //
          //};

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
                if(data.result && data.data){
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
            $scope.showSjzs = false;
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
                  $scope.closePaperDtl();
                  $scope.showKaoShiZuList(); //新建成功以后返回到开始列表
                  DataService.alertInfFun('suc', '数据保存成功！');
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
            $scope.kaoShiZuData['考试组设置']['随机试卷'] = $scope.kwParams.sjType == 1;
            var errInfo = [];
            var kdkwErr = [];
            var allKaoWei = 0;
            var dataPar = angular.copy($scope.kaoShiZuData);
            if(!dataPar['试卷组ID']){
              DataService.alertInfFun('err', '请选择试卷组！');
              return ;
            }
            dataPar['考试组设置']['每页题目数'] = dataPar['考试组设置']['每页题目数'] || 1;
            if(dataPar['报名方式'] == 1){ //非在线报名
              Lazy(dataPar['考试']).each(function(cc){
                delete cc.tempIdx;
                delete cc['结束时间'];
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
                  delete cc['结束时间'];
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
            if(confirm('确定要发布此考试吗？')){
              $http(obj).success(function(data){
                if(data.result){
                  $scope.showKaoShiZuList($scope.kwParams.kszListZt);
                  DataService.alertInfFun('suc', '发布成功！');
                }
                else{
                  DataService.alertInfFun('err', data.error);
                }
              });
            }
          };

          /**
           * 查看考试组详情
           */
          $scope.seeKaoShiZuDetail = function(ksz){
            var obj = {
              method: 'GET',
              url: kaoShiZuUrl,
              params: {
                '学校ID': jgID,
                '科目ID': keMuId,
                '考试组ID': ksz['考试组ID'],
                '返回考试': true,
                '返回考生': true,
                '返回考生详细信息': true,
                '返回试卷': true
              }
            };
            $scope.kwParams.showCc = false; //显示场次
            $scope.kwParams.showSj = true; //显示试卷
            $http(obj).success(function(data){
              if(data.result && data.data){
                $scope.kaoShiZuDtl = data.data[0];
                $scope.kwParams.showStu = false;
                $scope.kwParams.showCcSjz = false;
                $scope.changCiKaoSheng = '';
                qryShiJuanZuList(true);
              }
              else{
                $scope.kaoShiZuDtl = '';
                DataService.alertInfFun('err', data.error);
              }
            });
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
              url: shiJuanZuUrl,
              params: {
                '试卷组ID': [],
                '返回试卷': true,
                '返回题目内容': false
              }
            };
            var shiJuanId = [];
            $scope.kszSjz = '';
            $scope.sltKaoShi = '';
            $scope.kwParams.showCc = true; //显示场次
            $scope.kwParams.showSj = false; //显示试卷
            if($scope.kaoShiZuDtl['试卷组ID']){
              obj.params['试卷组ID'].push($scope.kaoShiZuDtl['试卷组ID']);
              obj.params['试卷组ID'] = JSON.stringify(obj.params['试卷组ID']);
              $http(obj).success(function(data){
                if(data.result && data.data){
                  data.data[0]['试卷'] = Lazy(data.data[0]['试卷']).sortBy('试卷ID').toArray();
                  $scope.kszSjz = data.data[0];
                  if(!$scope.kaoShiZuDtl['考试组设置']['随机试卷']){
                    shiJuanId = Lazy(data.data[0]['试卷']).map('试卷ID').toArray();
                    Lazy($scope.kaoShiZuDtl['考试']).each(function(ks){
                      var sjIdArr = '';
                      if(typeof(ks['考试设置']) == 'string'){
                        sjIdArr = JSON.parse(ks['考试设置'])['试卷ID'];
                      }
                      else{
                        sjIdArr = ks['考试设置']['试卷ID'];
                      }
                      if(sjIdArr && sjIdArr.length > 0){
                        ks['试卷'] = [];
                        Lazy(sjIdArr).each(function(sjId){
                          var sjObj = {
                            '试卷ID': sjId,
                            '试卷名称': '',
                            '试卷组ID': $scope.kaoShiZuDtl['试卷组ID']
                          };
                          var idx = Lazy(shiJuanId).indexOf(sjId);
                          if(idx > -1){
                            sjObj['试卷名称'] = '试卷' + (idx + 1);
                          }
                          else{
                            sjObj['试卷名称'] = '未找到试卷';
                          }
                          ks['试卷'].push(sjObj);
                        });
                      }
                    });
                  }
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
            $scope.kwParams.notice = false;
          };

          /**
           * 切换场次和考生名单
           */
          $scope.showChangCiToggle = function(){
            $scope.kwParams.showStu = false;
            $scope.kwParams.showCcSjz = false;
            $scope.kwParams.selectedCc = '';
            $scope.kwParams.showCc = false; //显示场次
            $scope.kwParams.showSj = true; //显示试卷
            $scope.kwParams.notice = false;
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
            $scope.changCiKaoSheng = Lazy($scope.changCiKaoSheng).sortBy('序号').toArray();
          };

          /**
           * 显示报名须知
           */
          $scope.showKszNotice = function(){
            $scope.kwParams.showCcSjz = true;
            $scope.kwParams.showStu = false;
            $scope.kwParams.notice = true;
            $scope.kwParams.showCc = true; //显示场次
            $scope.kwParams.showSj = true; //显示试卷
          };

          /**
           * 预览考试须知
           */
          $scope.previewNotice = function(){
            $scope.kwParams.showNtPre = !$scope.kwParams.showNtPre;
          };

          /**
           * 保存考试须知
           */
          $scope.saveKszNotice = function(){
            if($scope.kaoShiZuDtl['考试组ID']){
              var obj = {
                method: 'POST',
                url: kaoShiZuUrl,
                data: {
                  '考试组ID': $scope.kaoShiZuDtl['考试组ID'],
                  '考试须知': ''
                }
              };
              if($scope.kaoShiZuDtl['考试须知']){
                obj.data['考试须知'] = $scope.kaoShiZuDtl['考试须知'];
                $http(obj).success(function(data){
                  if(data.result){
                    //$scope.showKaoShiZuList($scope.kwParams.kszListZt);
                    DataService.alertInfFun('suc', '考试须知修改成功！');
                  }
                  else{
                    DataService.alertInfFun('err', data.error);
                  }
                });
              }
            }
            else{
              DataService.alertInfFun('err', '请选择考试！');
            }
          };

          /**
           * 保存考试组设置
           */
          $scope.saveKszSet = function(){
            if($scope.kaoShiZuDtl['考试组ID']){
              var obj = {
                method: 'POST',
                url: kaoShiZuUrl,
                data: {
                  '考试组ID': $scope.kaoShiZuDtl['考试组ID'],
                  '考试组设置': ''
                }
              };
              var setDt = angular.copy($scope.kaoShiZuDtl['考试组设置']);
              Lazy(setDt).each(function(v, k, l){
                if(!v){
                  delete setDt['k'];
                }
              });
              if(isEmpty(setDt)){
                DataService.alertInfFun('err', '请选择考试设置！');
              }
              else{
                obj.data['考试组设置'] = JSON.stringify(setDt);
                $http(obj).success(function(data){
                  if(data.result){
                    DataService.alertInfFun('suc', '考试设置保存成功！');
                  }
                  else{
                    DataService.alertInfFun('err', data.error);
                  }
                });
              }
            }
            else{
              DataService.alertInfFun('err', '请选择考试！');
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
           * 修改试卷组
           */
          $scope.alterPaperZu = function(){

          };

          /**
           * 修改试卷
           */
          $scope.alterPaper = function(ks){
            Lazy($scope.kszSjz['试卷']).each(function(sj){ //重置所有的试卷
              sj.ckd = false;
            });
            Lazy(ks['试卷']).each(function(ccsj){ //试卷的反选
              Lazy($scope.kszSjz['试卷']).each(function(sj){
                if(sj['试卷ID'] == ccsj['试卷ID']){
                  sj.ckd = true;
                }
              });
            });
            $scope.sltKaoShi = ks;
          };

          /**
           * 保存修改试卷
           */
          $scope.savePaperAlter = function(){
            if($scope.kaoShiZuDtl['考试组设置']['随机试卷']){
              var objSj = {
                method: 'POST',
                url: kaoShiZuUrl,
                data: {
                  '考试组ID': $scope.kaoShiZuDtl['考试组ID'],
                  '试卷组ID': $scope.kaoShiZuDtl['试卷组ID']
                }
              };
              if($scope.kaoShiZuDtl['试卷组ID']){
                $http(objSj).success(function(data){
                  if(data.result){
                    $scope.closePaperDtl();
                    $scope.showKaoShiZuList(); //新建成功以后返回到开始列表
                    DataService.alertInfFun('suc', '修改成功！');
                  }
                  else{
                    DataService.alertInfFun('err', data.error);
                  }
                });
              }
            }
            else{
              var obj = {
                '考试组ID': $scope.kaoShiZuDtl['考试组ID'],
                '试卷组ID': $scope.kaoShiZuDtl['试卷组ID'],
                '报名方式': $scope.kaoShiZuDtl['报名方式'],
                '考试': []
              };
              if($scope.kaoShiZuDtl['报名方式'] == 2){
                obj['考生'] = [];
                Lazy($scope.kaoShiZuDtl['考生']).each(function(stu){
                  var stuObj = {
                    'UID': stu['UID'],
                    '课序号ID': stu['课序号ID']
                  };
                  obj['考生'].push(stuObj);
                });
              }
              Lazy($scope.kaoShiZuDtl['考试']).each(function(ks){
                var ksObj = {
                  '考试名称': ks['考试名称'],
                  '考点ID': ks['考点ID'],
                  '开始时间': DataService.formatDateZh(ks['开始时间']),
                  //'结束时间': DataService.formatDateZh(ks['结束时间']),
                  '考试时长': ks['考试时长'],
                  '考试设置': JSON.parse(ks['考试设置'])
                  //'考生': ''
                };
                if(ks['考生'] && ks['考生'].length > 0){
                  ksObj['考生'] = [];
                  Lazy(ks['考生']).each(function(stu){
                    var stuObj = {
                      'UID': stu['UID'],
                      '课序号ID': stu['课序号ID']
                    };
                    ksObj['考生'].push(stuObj);
                  });
                }
                obj['考试'].push(ksObj);
              });
              console.log(obj);
              obj['考试'] = JSON.stringify(obj['考试']);
              obj['考生'] = JSON.stringify(obj['考生']);
              submitFORMPost(kaoShiZuUrl, obj, 'POST');
            }
          };

          /**
           * 将试卷添加到场次
           */
          $scope.changeSjState = function(sj) {
            sj.ckd = !sj.ckd;
          };

          /**
           * 将新选的试卷加入场次
           */
          $scope.addNewPaperToCc = function(){
            var sltSjIdArr = [];
            var sltSjArr = [];
            Lazy($scope.kszSjz['试卷']).each(function(sj, idx, lst){
              if(sj.ckd){
                var sjObj = {
                  '试卷ID': sj['试卷ID'],
                  '试卷名称': '试卷' + (idx + 1),
                  '试卷组ID': sj['试卷组ID']
                };
                sltSjIdArr.push(sj['试卷ID']);
                sltSjArr.push(sjObj);
              }
            });
            if(sltSjIdArr.length > 0 && sltSjArr.length > 0){
              Lazy($scope.kaoShiZuDtl['考试']).each(function(ks){
                if(ks['考试ID'] == $scope.sltKaoShi['考试ID']){
                  var kssz = {
                    '试卷ID': sltSjIdArr
                  };
                  ks['考试设置'] = JSON.stringify(kssz);
                  ks['试卷'] = sltSjArr;
                }
              });
              $scope.sltKaoShi = '';
            }
            else{
              DataService.alertInfFun('err', '请至少选择一张试卷！');
            }
          };

          /**
           * 确定试卷组选择
           */
          $scope.confirmSjzSlt = function(){
            if($scope.kwParams.newSltSjzId != $scope.kaoShiZuDtl['试卷组ID']){
              var fdTar = Lazy($scope.paperList).find(function(sjz){
                return sjz['试卷组ID'] == $scope.kwParams.newSltSjzId;
              });
              if(fdTar){
                $scope.kszSjz = fdTar;
              }
              $scope.kaoShiZuDtl['试卷组ID'] = angular.copy($scope.kwParams.newSltSjzId);
              if(!$scope.kaoShiZuDtl['考试组设置']['随机试卷']){ //非随机试卷
                var sltSjzSjLen = $scope.kszSjz['试卷数量'] || 1;
                Lazy($scope.kaoShiZuDtl['考试']).each(function(ks, idx, lst){
                  var nIdx = idx % sltSjzSjLen;
                  var sjData = $scope.kszSjz['试卷'][nIdx];
                  var sjObj = {
                    '试卷ID': sjData['试卷ID'],
                    '试卷名称': '试卷' + (nIdx + 1),
                    '试卷组ID': sjData['试卷组ID']
                  };
                  var kssz = {
                    '试卷ID': []
                  };
                  ks['试卷'] = [];
                  kssz['试卷ID'].push(sjData['试卷ID']);
                  ks['考试设置'] = JSON.stringify(kssz);
                  ks['试卷'].push(sjObj);
                });
              }
              $scope.showImportStuds = false;
              $scope.showSjzs = false;
            }
            else{
              DataService.alertInfFun('pmt', '你选择的试卷组和原试卷一样，请重新选择试卷组！');
            }
          };

          /**
           * 返回考试组的场次列表
           */
          $scope.backToCcList = function(){
            $scope.sltKaoShi = '';
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
