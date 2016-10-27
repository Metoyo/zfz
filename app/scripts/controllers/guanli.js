define(['angular', 'config', 'jquery', 'lazy'], function (angular, config, $, lazy) {
  'use strict';
  angular.module('zhifzApp.controllers.GuanLiCtrl', [])
    .controller('GuanLiCtrl', ['$rootScope', '$scope', 'DataService', '$http', '$cookieStore',
      function ($rootScope, $scope, DataService, $http, $cookieStore) {

        /**
         * 声明变量
         */
        var numPerPage = 10; //每页10条数据
        var keXuHaoPagesArr = []; //存放课序号分页的数组
        var keXuHaoStore; //存放课序号原始数据
        var paginationLength = 7; //分页部分，页码的长度，目前设定为7
        var totalStuPage = []; //所有的课序号考生的页码数
        var regKxh = /^[a-zA-Z0-9_-]+$/; //检测课序号
        var selectData = ''; //考试组和知识点用到变量
        var loginUsr = JSON.parse($cookieStore.get('ckUsr'));
        var dftKm = JSON.parse($cookieStore.get('ckKeMu')); //默认选择的科目
        var jgID = loginUsr['学校ID']; //登录用户学校
        var logUid = loginUsr['UID']; //登录用户的UID
        var keMuId = dftKm['科目ID']; //默认的科目ID
        var lingYuId = dftKm['领域ID']; //默认的科目ID
        var keMuJiaoShiUrl = '/kemu_jiaoshi'; //学校教师
        var keXuHaoUrl = '/kexuhao'; //课序号
        var kxhJiaoShiUrl = '/kexuhao_jiaoshi'; //课序号教师
        var kxhXueShengUrl = '/kexuhao_xuesheng'; //课序号学生
        var impYongHuUrl = '/imp_yonghu'; //导入用户
        var kaoShiZuUrl = '/kaoshizu'; //考试组
        var kaoShiZuZhiShiDianUrl = '/kaoshizu_zhishidian'; //考试组知识点
        var keMuConfUrl = '/kemu_conf'; //科目设置
        var zhiShiDaGangUrl = '/zhishidagang'; //知识大纲
        var kaoDianUrl = '/kaodian'; //考点
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
          selectKsz: '', //选中的考试组
          year: '', //课序号年份(新建课序号)
          term: '', //课序号学期(新建课序号)
          yearQry: '', //课序号年份(查询课序号)
          termQry: '', //课序号学期(查询课序号)
          uid: logUid
        };
        $scope.glEditBoxShow = ''; //弹出层显示那一部分内容
        $scope.jgKmTeachers = ''; //本机构科目下的老师
        $scope.keXuHaoPgData = ''; //课序号数据
        $scope.selectKxh = ''; //选中的课序号
        $scope.showMoreBtn = false; //课序号管理更多按钮
        $scope.kxhData = { //课序号的日期区分字段
          '年份': [],
          '学期': [{val: 1, name: '秋'}, {val: 2, name: '春'}]
        };
        $scope.fbdBtn = false;

        /**
         * 查询科目下的老师
         */
        var qryKeMuTeachers = function(){
          var obj = {
            method: 'GET',
            url: keMuJiaoShiUrl,
            params: {
              '学校ID': jgID,
              '科目ID': keMuId
            }
          };
          $http(obj).success(function(data){
            if(data.result && data.data){
              if($scope.glEditBoxShow == 'modifyKeXuHao'){
                var objKxhJs = {
                  method: 'GET',
                  url: kxhJiaoShiUrl,
                  params: {
                    '课序号ID': ''
                  }
                };
                var idArr = [];
                idArr.push($scope.guanliParams.modifyKxh['课序号ID']);
                objKxhJs.params['课序号ID'] = JSON.stringify(idArr);
                $http(objKxhJs).success(function(kxhJsData){
                  if(kxhJsData.result && kxhJsData.data){
                    Lazy(data.data).each(function(kmjs){
                      Lazy(kxhJsData.data).each(function(kxhjs){
                        if(kxhjs.UID == kmjs.UID){
                          kmjs.ckd = true;
                        }
                      });
                    });
                    $scope.jgKmTeachers = data.data;
                  }
                  else{
                    DataService.alertInfFun('err', kxhJsData.error);
                  }
                });
              }
              else{
                $scope.jgKmTeachers = data.data;
              }
            }
            else{
              DataService.alertInfFun('err', data.error);
            }
          });
        };

        /**
         * 查询课序号
         */
        $scope.queryKeXuHao = function(){
          var objKxh = {
            method: 'GET',
            url: keXuHaoUrl,
            params: {
              '学校ID': jgID,
              '科目ID': keMuId,
              '返回学生人数': true
            }
          };
          //$scope.kxhData['年份'] = [];
          //var mydateNew = new Date();
          //var year = mydateNew.getFullYear();
          //$scope.kxhData['年份'].push(year);
          //$scope.kxhData['年份'].push(year + 1);
          if($scope.guanliParams.yearQry){
            objKxh.params['年度'] = $scope.guanliParams.yearQry;
          }
          if($scope.guanliParams.termQry){
            objKxh.params['学期'] = $scope.guanliParams.termQry;
          }
          $http(objKxh).success(function(data){
            if(data.result && data.data){
              Lazy(data.data).each(function(kxh){
                if(kxh['学期']){
                  kxh['中文学期'] = kxh['学期'] == 1 ? '秋' : '春';
                }
              });
              var objJs = {
                method: 'GET',
                url: kxhJiaoShiUrl,
                params: {
                  '课序号ID': ''
                }
              };
              var kxhIds = Lazy(data.data).map(function(kxh){ return kxh['课序号ID']}).toArray();
              objJs.params['课序号ID'] = JSON.stringify(kxhIds);
              $http(objJs).success(function(tech){
                if(tech.result && tech.data){
                  Lazy(data.data).each(function(kxh){
                    if(kxh['学生人数'] == null){
                      kxh['学生人数'] = 0;
                    }
                    kxh['教师'] = Lazy(tech.data).filter(function(th){
                      return th['课序号ID'] == kxh['课序号ID'];
                    }).toArray();
                  });
                  var dataLength = data.data.length;
                  if(dataLength > 10){
                    var lastPage = Math.ceil(dataLength/numPerPage); //最后一页
                    $scope.lastKxhPageNum = lastPage;
                    keXuHaoPagesArr = [];
                    if(lastPage){
                      for(var i = 1; i <= lastPage; i++){
                        keXuHaoPagesArr.push(i);
                      }
                    }
                    keXuHaoStore = Lazy(data.data).reverse().toArray();
                    $scope.keXuHaoDist(1);
                  }
                  else{
                    $scope.keXuHaoData = Lazy(data.data).reverse().toArray();
                  }
                }
                else{
                  DataService.alertInfFun('err', tech.error);
                }
              });
            }
            else{
              $scope.keXuHaoData = '';
              keXuHaoStore = '';
              DataService.alertInfFun('err', data.error);
            }
          });
        };

        /**
         * 查询考试组
         */
        var glQueryKaoShiZu = function(){
          var obj = {
            method: 'GET',
            url: kaoShiZuUrl,
            params: {
              '学校ID': jgID,
              '科目ID': keMuId,
              '状态': JSON.stringify([1, 3, 4, 5, 6])
            }
          };
          var pageHeight = document.querySelector('.dashboard').clientHeight - 180 + 'px';
          $http(obj).success(function(data) {
            if(data.result && data.data){
              $scope.glKaoShiZuList = Lazy(data.data).sortBy('创建时间').reverse().toArray();
              var wrapWt = document.querySelectorAll('.glZsdgWrap');
              angular.element(wrapWt).css({height: pageHeight, 'overflow-y': 'auto'});
            }
            else{
              $scope.glKaoShiZuList = '';
              DataService.alertInfFun('err', data.error)
            }
          });
        };

        /**
         * 查询大纲的函数
         */
        var getDaGangFun = function(obj){
          //得到知识大纲知识点的递归函数
          function _do(item) {
            item.ckd = false;
            item.fld = true;
            if(item['子节点'] && item['子节点'].length > 0){
              Lazy(item['子节点']).each(_do);
            }
          }
          $scope.glKowledgeList = '';
          if(obj){
            $scope.loadingImgShow = true;
            $http(obj).success(function(data){
              if(data.result && data.data){
                Lazy(data.data[0]['节点']).each(_do);
                $scope.glKowledgeList = data.data[0];
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
              $scope.loadingImgShow = false;
            });
          }
          else{
            DataService.alertInfFun('pmt', '缺少知识大纲ID');
          }
        };

        /**
         * 获得大纲数据
         */
        var getDaGangData = function(){
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
              getDaGangFun(obj);
            }
            else{
              DataService.alertInfFun('err', sData.error);
            }
          });
        };

        /**
         * 由学校ID查询考点列表
         */
        var getKaoDianList = function(){
          $scope.kaoChangList = '';
          if(jgID){
            var obj = {method: 'GET', url: kaoDianUrl, params: {'学校ID': jgID}};
            $scope.loadingImgShow = true;
            $http(obj).success(function(data){
              if(data.result && data.data){
                $scope.kaoChangList = data.data;
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
              $scope.loadingImgShow = false;
            });
          }
          else{
            DataService.alertInfFun('pmt', '请选择学校！');
          }
        };

        /**
         * 考生内容切换
         */
        $scope.guanLiTabSlide = function (tab) {
          $scope.guanliParams.tabActive = '';
          $scope.keXuHaoPgData = '';
          keXuHaoPagesArr = [];
          keXuHaoStore = '';
          $scope.studentsOrgData = '';
          $scope.studentsData = '';
          $scope.studentsPages = [];
          $scope.guanliParams.yearQry = '';
          $scope.guanliParams.termQry = '';
          if (tab == 'kexuhao') {
            $scope.kxhData['年份'] = [];
            var mydateNew = new Date();
            var year = mydateNew.getFullYear();
            $scope.kxhData['年份'].push(year - 1);
            $scope.kxhData['年份'].push(year);
            $scope.kxhData['年份'].push(year + 1);
            $scope.queryKeXuHao();
            $scope.guanliParams.tabActive = 'kexuhao';
            $scope.guanLiTpl = 'views/guanli/kexuhao.html';
          }
          if (tab == 'tongji') {
            glQueryKaoShiZu();
            getDaGangData();
            $scope.guanliParams.tabActive = 'tongji';
            $scope.guanLiTpl = 'views/guanli/tongjiset.html';
          }
          if (tab == 'kaodian') {
            getKaoDianList();
            $scope.guanliParams.tabActive = 'kaodian';
            $scope.guanLiTpl = 'views/guanli/kaodian.html';
          }
        };
        $scope.guanLiTabSlide('kexuhao');

        /**
         * 文件上传
         */
        $scope.uploadFiles = []; //存放上传文件的数组
        $scope.fileNameChanged = function(element) {
          $scope.$apply(function($scope) {
            for (var i = 0; i < element.files.length; i++) {
              $scope.uploadFiles.push(element.files[i])
            }
          });
        };

        /**
         * 显示弹出层
         */
        $scope.showKeXuHaoPop = function(item, data){
          $scope.showKeXuHaoManage = true;
          $scope.glEditBoxShow = item;
          $scope.uploadFiles = [];
          $scope.guanliParams.modifyKxh = '';
          $scope.guanliParams.year = '';
          $scope.guanliParams.term = '';
          $scope.impClash = [];
          if(item == 'addKeXuHao'){
            qryKeMuTeachers();
          }
          else if(item == 'modifyKeXuHao'){
            $scope.guanliParams.modifyKxh = data;
            $scope.guanliParams.year = data['年度'];
            $scope.guanliParams.term = data['学期'];
            qryKeMuTeachers();
          }
          else{
            $scope.impUsrStepNum = 'more';
          }
        };

        /**
         * 关闭课序号管理的弹出层
         */
        $scope.closeKeXuHaoManage = function(){
          $scope.showKeXuHaoManage = false;
          $scope.glEditBoxShow = ''; //弹出层显示那一部分重置
          $scope.guanliParams.errorInfo = '';
        };

        /**
         * 课序号的分页数据
         */
        $scope.keXuHaoDist = function(pg){
          var startPage = (pg-1) * numPerPage;
          var endPage = pg * numPerPage;
          var lastPageNum = $scope.lastKxhPageNum;
          $scope.currentKxhPageVal = pg;
          //得到分页数组的代码
          var currentPageNum = pg ? pg : 1;
          if(lastPageNum <= paginationLength){
            $scope.keXuHaoPages = keXuHaoPagesArr;
          }
          if(lastPageNum > paginationLength){
            if(currentPageNum > 0 && currentPageNum <= 4 ){
              $scope.keXuHaoPages = keXuHaoPagesArr.slice(0, paginationLength);
            }
            else if(currentPageNum > lastPageNum - 4 && currentPageNum <= lastPageNum){
              $scope.keXuHaoPages = keXuHaoPagesArr.slice(lastPageNum - paginationLength);
            }
            else{
              $scope.keXuHaoPages = keXuHaoPagesArr.slice(currentPageNum - 4, currentPageNum + 3);
            }
          }
          $scope.keXuHaoData = keXuHaoStore.slice(startPage, endPage);
        };

        /**
         * 删除课序号
         */
        $scope.deleteKeXuHao = function(kxh){
          var obj = {
            method: 'POST',
            url: keXuHaoUrl,
            data: {
              '课序号ID': '',
              '状态': -1
            }
          };
          if(kxh){
            obj.data['课序号ID'] = kxh['课序号ID'];
            if(confirm('确定要删除此课序号吗？')){
              $http(obj).success(function(data){
                if(data.result){
                  $scope.studentsOrgData = '';
                  $scope.studentsData = '';
                  $scope.studentsPages = [];
                  $scope.selectKxh = '';
                  DataService.alertInfFun('suc', '删除成功！');
                  $scope.queryKeXuHao();
                }
                else{
                  DataService.alertInfFun('err', data.error);
                }
              });
            }
          }
        };

        /**
         * 导入用户的控制
         */
        $scope.impUsrStep = function(step){
          $scope.impUsrStepNum = step;
        };

        /**
         * 导入用户
         */
        $scope.impYongHu = function(kind){
          var fd = new FormData();
          var obj = {};
          var allRight = true;
          $scope.impClash = [];
          if(kind == 'single'){
            if($scope.guanliParams.singleStuName){
              if($scope.guanliParams.singleStuID){
                var matchRule = $scope.guanliParams.singleStuID.match(regKxh);
                if(matchRule && matchRule.length > 0){
                  var sgStu = [{
                    '姓名': $scope.guanliParams.singleStuName,
                    '学号': $scope.guanliParams.singleStuID
                  }];
                  if($scope.guanliParams.singleStuBanJi){
                    sgStu[0]['班级'] = $scope.guanliParams.singleStuBanJi;
                  }
                  obj['用户列表.json'] = JSON.stringify(sgStu);
                }
                else{
                  allRight = false;
                  $scope.guanliParams.errorInfo = '输入的学号格式不正确！';
                }
              }
              else{
                allRight = false;
                DataService.alertInfFun('pmt', '缺少学号！');
              }
            }
            else{
              allRight = false;
              DataService.alertInfFun('pmt', '缺少姓名！');
            }
            for(var key in obj){
              if (obj.hasOwnProperty(key)) {
                fd.append(key, obj[key]);
              }
              else {
                console.log(key);
              }
            }
          }
          else{
            var file = $scope.uploadFiles;
            if(file && file.length > 0){
              for(var j = 1; j <= file.length; j++){
                fd.append('用户列表.excel', file[j - 1]);
              }
            }
            else{
              allRight = false;
              DataService.alertInfFun('pmt', '请添加要上传的名单！');
            }
          }
          if(allRight){
            $scope.loadingImgShow = true;
            var impUrl = impYongHuUrl + '/?' + '学校ID=' + jgID;
            $http.post(impUrl, fd, {transformRequest: angular.identity, headers:{'Content-Type': undefined}}).success(function(data){
              if(data.result && data.data){
                $scope.impStus = Lazy($scope.impStus).union(data.data['导入成功']).toArray();
                $scope.impStus = Lazy($scope.impStus).uniq('UID').toArray();
                $scope.impUsrStepNum = 'list';
                if(data.data['数据冲突'] && data.data['数据冲突'].length > 0){
                  var msg = '';
                  $scope.impClash = data.data['数据冲突'];
                  if(data.data['导入成功'] && data.data['导入成功'].length > 0){
                    msg = '导入成功：' + data.data['导入成功'].length + '；数据冲突：' + data.data['数据冲突'].length;
                  }
                  else{
                    msg = '数据冲突：' + data.data['数据冲突'].length;
                  }
                  DataService.alertInfFun('err', msg);
                }
                if(kind == 'single'){
                  $scope.guanliParams.singleStuName = '';
                  $scope.guanliParams.singleStuID = '';
                  $scope.guanliParams.singleStuBanJi = '';
                }
                else{
                  $scope.uploadFiles = [];
                }
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
              $scope.loadingImgShow = false;
            });
          }
        };

        /**
         * 查询课序号学生
         */
        $scope.chaXunKxhYongHu = function(kxh){
          $scope.studentsData = '';
          $scope.impStus = [];
          var obj = {
            method: 'GET',
            url: kxhXueShengUrl,
            params: {
              '课序号ID': ''
            }
          };
          if(kxh){
            $scope.selectKxh = kxh;
            var idArr = [];
            idArr.push(kxh['课序号ID']);
            obj.params['课序号ID'] = JSON.stringify(idArr);
            $http(obj).success(function(data){
              if(data.result && data.data){
                $scope.studentsOrgData = Lazy(data.data).sortBy('序号').toArray();
                $scope.impStus = angular.copy($scope.studentsOrgData);
                kxh['学生人数'] = data.data.length ? data.data.length : 0;
                studentsPages(data.data);
              }
              else{
                $scope.studentsOrgData = '';
                $scope.studentsPages = [];
              }
            });
          }
          else{
            DataService.alertInfFun('pmt', '缺少课序号ID！');
          }
        };

        /**
         * 学生分页数码
         */
        var studentsPages = function(wks){
          totalStuPage = [];
          $scope.studentsPages = [];
          $scope.lastStuPageNum = '';
          if(wks && wks.length > 10){
            var stusLength;
            var stusLastPage;
            stusLength = wks.length;
            stusLastPage = Math.ceil(stusLength/numPerPage);
            $scope.lastStuPageNum = stusLastPage;
            for(var i = 1; i <= stusLastPage; i++){
              totalStuPage.push(i);
            }
            $scope.studentPgDist(1);
          }
          else{
            $scope.studentsData = $scope.studentsOrgData.slice(0);
          }
        };

        /**
         * 学生分页
         */
        $scope.studentPgDist = function(pg){
          var startPage = (pg-1) * numPerPage;
          var endPage = pg * numPerPage;
          var lastPageNum = $scope.lastStuPageNum;
          $scope.currentStuPageVal = pg;
          //得到分页数组的代码
          var currentPageNum = pg ? pg : 1;
          if(lastPageNum <= paginationLength){
            $scope.studentsPages = totalStuPage;
          }
          if(lastPageNum > paginationLength){
            if(currentPageNum > 0 && currentPageNum <= 4 ){
              $scope.studentsPages = totalStuPage.slice(0, paginationLength);
            }
            else if(currentPageNum > lastPageNum - 4 && currentPageNum <= lastPageNum){
              $scope.studentsPages = totalStuPage.slice(lastPageNum - paginationLength);
            }
            else{
              $scope.studentsPages = totalStuPage.slice(currentPageNum - 4, currentPageNum + 3);
            }
          }
          $scope.studentsData = $scope.studentsOrgData.slice(startPage, endPage);
        };

        /**
         * 删除课序号用户
         */
        $scope.deleteKxhYh = function(yh, kind){
          if(kind && kind == 'imp'){
            $scope.impStus = Lazy($scope.impStus).reject(function(stu){
              return stu['UID'] == yh['UID'];
            }).toArray();
          }
          else{
            var confirmInfo = '';
            var obj = {
              method: 'POST',
              url: kxhXueShengUrl,
              data: {
                '课序号ID': $scope.selectKxh['课序号ID'],
                '学生': ''
              }
            };
            if(yh){
              if(yh == 'all'){
                obj.data['学生'] = JSON.stringify('[]');
                confirmInfo = '确定要删除此课序号下面的所有学生吗？';
              }
              else{
                $scope.studentsOrgData = Lazy($scope.studentsOrgData).reject(function(wk){
                  return wk['UID'] == yh['UID'];
                }).toArray();
                var usrIds = Lazy($scope.studentsOrgData).map(function(stu){
                  return stu['UID'];
                }).toArray();
                obj.data['学生'] = JSON.stringify(usrIds);
                confirmInfo = '确定要删除学生吗？';
              }
              if($scope.selectKxh){
                if(confirm(confirmInfo)){
                  $http(obj).success(function(data){
                    if(data.result){
                      $scope.chaXunKxhYongHu($scope.selectKxh);
                      DataService.alertInfFun('suc', '删除成功！');
                      $scope.showKeXuHaoManage = false;
                    }
                    else{
                      DataService.alertInfFun('err', data.error);
                    }
                  });
                }
              }
              else{
                DataService.alertInfFun('pmt', '请选择要删除学生的专业！');
              }
            }
            else{
              DataService.alertInfFun('pmt', '请选择要删除的人员！');
            }
          }
        };

        /**
         * 课序号学生的移动
         */
        $scope.moveStu = function(idx, dirt, stu){
          var toIndex = idx + dirt;
          if(dirt > 0){
            $scope.impStus.splice(toIndex + 1, 0, stu);
            $scope.impStus.splice(idx, 1);
          }
          else{
            $scope.impStus.splice(idx, 1);
            $scope.impStus.splice(toIndex, 0, stu);
          }
        };

        /**
         * 课序号管理保存数据
         */
        $scope.saveKeXuHaoModify = function(){
          var saveType = $scope.glEditBoxShow;
          var uidArr = [];
          var allTrue = true;
          var mis = [];
          $scope.guanliParams.errorInfo = '';
          var obj = {method: '', url: ''};
          var checkJiaoShi = function(){
            Lazy($scope.jgKmTeachers).each(function(th){
              if(th.ckd && (th.ckd == true)){
                uidArr.push(th.UID);
              }
            });
            if(!(uidArr && uidArr.length > 0)){
              allTrue = false;
              DataService.alertInfFun('pmt', '请选择任课课老师！');
            }
          };
          if(saveType == 'addKeXuHao'){ //新增课序号
            if($scope.guanliParams.addNewKxh){
              obj.method = 'PUT';
              obj.url = keXuHaoUrl;
              obj.data = {'课序号名称': $scope.guanliParams.addNewKxh, '学校ID':jgID, '科目ID':keMuId};
              checkJiaoShi();
            }
            else{
              mis.push('课序号名称');
            }
            if($scope.guanliParams.year){
              obj.data['年度'] = $scope.guanliParams.year;
            }
            else{
              mis.push('年度');
            }
            if($scope.guanliParams.term){
              obj.data['学期'] = $scope.guanliParams.term;
            }
            if(mis.length > 0){
              allTrue = false;
              DataService.alertInfFun('pmt', '缺少：' + mis.join('；'));
            }
            //else{
            //  allTrue = false;
            //  DataService.alertInfFun('pmt', '新课序号为空！');
            //}
          }
          if(saveType == 'modifyKeXuHao'){ //修改课序号
            if($scope.guanliParams.modifyKxh){
              obj.method = 'POST';
              obj.url = keXuHaoUrl;
              obj.data = {
                '课序号ID': $scope.guanliParams.modifyKxh['课序号ID'],
                '课序号名称': ''
              };
              if($scope.guanliParams.modifyKxh['课序号名称']){
                obj.data['课序号名称'] = $scope.guanliParams.modifyKxh['课序号名称'];
              }
              else{
                allTrue = false;
                DataService.alertInfFun('pmt', '课序号名称不能为空！');
              }
              if($scope.guanliParams.modifyKxh['备注']){
                obj.data['备注'] = $scope.guanliParams.modifyKxh['备注'];
              }
              obj.data['年度'] = $scope.guanliParams.year;
              obj.data['学期'] = $scope.guanliParams.term;
              checkJiaoShi();
            }
          }
          if(saveType == 'addStus'){ //添加学生
            var stuIds = [];
            if($scope.impStus && $scope.impStus.length > 0){
              Lazy($scope.impStus).each(function(stu){
                stuIds.push(stu['UID']);
              });
            }
            if(stuIds.length > 0){
              obj.method = 'POST';
              obj.url = kxhXueShengUrl;
              obj.data = {
                '课序号ID': $scope.selectKxh['课序号ID'],
                '学生':JSON.stringify(stuIds)
              };
            }
            else{
              allTrue = false;
            }
          }
          if(allTrue){
            $scope.loadingImgShow = true;
            $http(obj).success(function(data){
              if(data.result){
                var objJs = '';
                if(saveType == 'addKeXuHao'){ //新增课序号
                  objJs = {
                    method:'POST',
                    url:kxhJiaoShiUrl,
                    data:{'课序号ID':data.data['课序号ID'], '教师':JSON.stringify(uidArr)}
                  };
                  $http(objJs).success(function(jsData){
                    if(jsData.result){
                      $scope.glEditBoxShow = ''; //弹出层显示那一部分内容重置
                      $scope.guanliParams.addNewKxh = ''; //课序号重置
                      $scope.guanliParams.addNewKxhSetting = '';
                      $scope.showKeXuHaoManage = false; //课序号重置
                      $scope.guanliParams.modifyKxh = '';
                      $scope.loadingImgShow = false;
                      $scope.queryKeXuHao();
                      DataService.alertInfFun('suc', '新增课序号成功！');
                    }
                    else{
                      $scope.loadingImgShow = false;
                      DataService.alertInfFun('err', jsData.error);
                    }
                  });
                }
                else if(saveType == 'modifyKeXuHao'){ //修改课序号
                  objJs = {
                    method: 'POST',
                    url: kxhJiaoShiUrl,
                    data: {'课序号ID': $scope.guanliParams.modifyKxh['课序号ID'], '教师': JSON.stringify(uidArr)}
                  };
                  $http(objJs).success(function(jsData){
                    if(jsData.result){
                      $scope.glEditBoxShow = ''; //弹出层显示那一部分内容重置
                      $scope.guanliParams.addNewKxh = ''; //课序号重置
                      $scope.guanliParams.addNewKxhSetting = '';
                      $scope.showKeXuHaoManage = false; //课序号重置
                      $scope.guanliParams.modifyKxh = '';
                      $scope.guanliParams.errorInfo = '';
                      $scope.loadingImgShow = false;
                      $scope.queryKeXuHao();
                      DataService.alertInfFun('suc', '新增课序修改成功！');
                    }
                    else{
                      $scope.loadingImgShow = false;
                      DataService.alertInfFun('err', jsData.error);
                    }
                  });
                }
                else{ //课序号添加考生
                  $scope.showKeXuHaoManage = false;
                  $scope.loadingImgShow = false;
                  $scope.chaXunKxhYongHu($scope.selectKxh);
                  DataService.alertInfFun('suc', '课序号添加考生成功!');
                }
              }
              else{
                DataService.alertInfFun('err', data.error);
              }
            });
          }
        };

        /**
         * 重新加载mathjax
         */
        $scope.$on('onRepeatLast', function(scope, element, attrs){
          MathJax.Hub.Config({
            tex2jax: {inlineMath: [["#$", "$#"]], displayMath: [['#$$','$$#']]},
            messageStyle: "none",
            showMathMenu: false,
            processEscapes: true
          });
          MathJax.Hub.Queue(["Typeset", MathJax.Hub, "glDaGangList"]);
        });

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
         * 查询知识点，在考务表里里，当统计的表里面没有数据时，执行此函数
         */
        function _doKszZsd(item) {
          item.ckd = false;
          item.fld = true;
          if(item['子节点'] && item['子节点'].length > 0){
            Lazy(item['子节点']).each(_doKszZsd);
          }
        }
        function _doCheckKszZsd(item) {
          if(item['知识点ID'] == selectData['知识点ID']){
            item.ckd = true;
          }
          if(item['子节点'] && item['子节点'].length > 0){
            Lazy(item['子节点']).each(_doCheckKszZsd);
          }
        }

        /**
         * 查询知识点，在统计表里
         */
        $scope.glQueryZsd = function(ksz){
          var obj = {
            method: 'GET',
            url: kaoShiZuZhiShiDianUrl,
            params: {
              '考试组ID': ''
            }
          };
          var activeDg = '';
          selectData = '';
          $scope.guanliParams.selectKsz = ksz || '';
          if($scope.guanliParams.selectKsz){
            obj.params['考试组ID'] = $scope.guanliParams.selectKsz['考试组ID'];
            if($scope.guanliParams.selectKsz['考试组设置'] && $scope.guanliParams.selectKsz['考试组设置']['考试组知识点'] &&
              $scope.guanliParams.selectKsz['考试组设置']['考试组知识点']['知识大纲ID']){
              activeDg = $scope.guanliParams.selectKsz['考试组设置']['考试组知识点']['知识大纲ID'];
            }
            $http(obj).success(function(data){
              if(data.result && data.data){
                if($scope.glKowledgeList){
                  if(activeDg && ($scope.glKowledgeList['知识大纲ID'] != activeDg)){
                    var dgObj = {
                      method: 'GET',
                      url: zhiShiDaGangUrl,
                      params: {}
                    };
                    obj.params['知识大纲ID'] = activeDg;
                    $http(dgObj).success(function(dataDg){
                      if(dataDg.result && dataDg.data){
                        $scope.glKowledgeList = dataDg.data[0];
                        Lazy($scope.glKowledgeList['节点']).each(_doKszZsd);
                        //知识点反选
                        Lazy(data.data).each(function(kszzsd){
                          selectData = kszzsd;
                          Lazy($scope.glKowledgeList['节点']).each(_doCheckKszZsd);
                        });
                      }
                      else{
                        DataService.alertInfFun('err', data.error);
                      }
                    });
                  }
                  else{
                    Lazy($scope.glKowledgeList['节点']).each(_doKszZsd);
                    //知识点反选
                    Lazy(data.data).each(function(kszzsd){
                      selectData = kszzsd;
                      Lazy($scope.glKowledgeList['节点']).each(_doCheckKszZsd);
                    });
                  }
                }
                else{
                  DataService.alertInfFun('err', '没有知识大纲数据！');
                }
              }
              else{
                Lazy($scope.glKowledgeList['节点']).each(_doKszZsd);
                DataService.alertInfFun('err', '本考试组没有知识点数据！');
              }
            });
          }
          else{
            DataService.alertInfFun('pmt', '请选择考试组！');
          }
        };

        /**
         * 保存统计设定的值
         */
        $scope.glSaveTongJiSet = function(){
          var obj = {
            method: 'POST',
            url: kaoShiZuUrl,
            data: {
              '考试组ID': '',
              '考试组设置': ''
            }
          };
          var kszZsd = {
            '知识大纲ID': '',
            '知识点ID': []
          };
          function _do(item) {
            if(item.ckd){
              kszZsd['知识点ID'].push(item['知识点ID']);
            }
            if(item['子节点'] && item['子节点'].length > 0){
              Lazy(item['子节点']).each(_do);
            }
          }
          if($scope.guanliParams.selectKsz){
            obj.data['考试组ID'] = parseInt($scope.guanliParams.selectKsz['考试组ID']);
            kszZsd['知识大纲ID'] = $scope.glKowledgeList['知识大纲ID'];
            Lazy($scope.glKowledgeList['节点']).each(_do);
            obj.data['考试组设置'] = $scope.guanliParams.selectKsz['考试组设置'] || {};
            if(kszZsd['知识大纲ID'] && kszZsd['知识点ID'].length > 0){
              kszZsd['知识点ID'] = kszZsd['知识点ID'];
              obj.data['考试组设置']['考试组知识点'] = kszZsd;
              obj.data['考试组设置'] = JSON.stringify(obj.data['考试组设置']);
              $scope.loadingImgShow = true;
              $http(obj).success(function(data){
                if(data.result){
                  DataService.alertInfFun('suc', '保存成功！');
                }
                else{
                  DataService.alertInfFun('err', data.error);
                }
                $scope.loadingImgShow = false;
              });
            }
            else{
              DataService.alertInfFun('pmt', '请选择需要的数据！');
            }
          }
          else{
            DataService.alertInfFun('pmt', '请选择考试组！');
          }
        };

        /**
         * 查询科目题型
         */
        var xueXiaoKeMuTiXingUrl = '/xuexiao_kemu_tixing'; //学校科目题型
        $scope.cxKmTx = function(keMuId){
          var obj = {method: 'GET', url: xueXiaoKeMuTiXingUrl, params: {'学校ID': jgID, '科目ID': keMuId}};
          $http(obj).success(function(data){
            if(data.result && data.data){
              $scope.kmtxList = data.data;
            }
            else{
              DataService.alertInfFun('err', data.error);
            }
          });
        };

        /**
         * 生成题库的PDF
         */
        $scope.kmArr = [
          {
            '科目ID': 1001,
            '科目名称': "高等数学"
          },
          {
            '科目ID': 1002,
            '科目名称': "线性代数"
          },
          {
            '科目ID': 1003,
            '科目名称': "概率论与数理统计"
          },
          {
            '科目ID': 1028,
            '科目名称': "数学分析"
          }
        ];
        $scope.tkPar = {
          kmid: '',
          txid: ''
        };
        var tiMuUrl = '/timu'; //题目的URL
        $scope.exportTiKu = function(){
          //var obj = {
          //  method: 'GET',
          //  url: tiMuUrl,
          //  params: {
          //    '学校ID': jgID,
          //    '科目ID': $scope.tkPar.kmid,
          //    '题型ID': $scope.tkPar.txid,
          //    '返回题目内容': true
          //  }
          //};
          //$http(obj).success(function(data){ //查询题目详情
          //  if(data.result && data.data){
          //    Lazy(data.data).each(function(tm, idx, lst){
          //      tm = DataService.formatDaAn(tm);
          //    });
          //    var tmArrSort = Lazy(data.data).sortBy('题目ID').reverse().toArray();
          //    var timu = {
          //      tixing: '我是题型',
          //      txArr: config.tiXingArr,
          //      letterArr: config.letterArr,
          //      tmArr: tmArrSort
          //    };
          //    template.config('escape', false);
          //    var html = template('tplTestList', timu);
          //    $('#tiMuWrap').html(html);
          //    MathJax.Hub.Config({
          //      tex2jax: {inlineMath: [["#$", "$#"]], displayMath: [['#$$','$$#']]},
          //      messageStyle: "none",
          //      showMathMenu: false,
          //      processEscapes: true
          //    });
          //    MathJax.Hub.Queue(["Typeset", MathJax.Hub, "testList"]);
          //  }
          //  else{
          //    DataService.alertInfFun('err', data.error);
          //  }
          //});
          var obj = {
            method: 'GET',
            url: '/tiku_pdf',
            params: {
              '学校ID': jgID,
              '科目ID': $scope.tkPar.kmid,
              '科目名称': '',
              '题型ID': $scope.tkPar.txid,
              '题型名称': ''
            }
          };
          var fdKm = Lazy($scope.kmArr).find(function(km){
            return km['科目ID'] == $scope.tkPar.kmid;
          });
          var fdTx = Lazy($scope.kmtxList).find(function(tx){
            return tx['题型ID'] == $scope.tkPar.txid;
          });
          obj.params['科目名称'] = fdKm['科目名称'];
          obj.params['题型名称'] = fdTx['题型名称'];
          $http(obj).success(function(data){
            if(data.result){
              DataService.alertInfFun('suc', '正在生成中……');
            }
            else{
              DataService.alertInfFun('err', data.error);
            }
          });
        };

      }]);
});
