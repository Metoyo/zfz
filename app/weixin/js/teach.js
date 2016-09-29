/**
 * Created by songtao on 16/9/7.
 */
$(function(){
  //用到变量
  var sltShowBox = $('#htmlShowBox');
  //var container = $('#container');
  var ceYanUrl = '/ceyan'; //测验的url
  var loginUrl = '/login'; //登录的URL
  var ceYanChengJiUrl = '/ceyan_chengji'; //测验成绩
  var zhiShiDaGangUrl = '/zhishidagang'; //知识大纲
  var cyZsdDfl = '/ceyan_zhishidian_defenlv'; //测验得分率
  var keyValueUrl = '/key_value'; //键值保存
  var qrcodeUrl = '/make_qrcode'; //生成二维码地址的url
  var testInfo = { //选中测验
    id: '',
    name: '',
    ren: '',
    zsd: [],
    daZsd: [],
    stu: []
  };

  //var localUrl = 'http://192.168.1.156';
  //var localUrl = 'https://www.zhifz.com';
  //var localUrl = 'http://127.0.0.1:3000';
  var localUrl = 'http://192.168.1.156:3000';
  var testUrl = localUrl + '/pub_test/';
  var pubPars = {
    '学校ID': 1033,
    '科目ID': 1001,
    '知识大纲ID': 1106
  };

  //返回的数据类型处理
  var dataMake = function(dt){
    if(typeof(dt) == 'string'){
      return JSON.parse(dt);
    }
    else{
      return dt;
    }
  };

  //模板render函数
  var renderFun =  function(data, tplId){
    var html = template(tplId, data);
    $('#htmlShowBox').html(html);
  };

  //初始化函数
  var initFun = function(dt){
    $('.title').text('发起自测');
    renderFun(dt, 'tplAddNewTest');
  };

  //获得大纲
  var getDaGang = function(){
    $.ajax({
      method: 'GET',
      url: zhiShiDaGangUrl,
      data:{
        '学校ID': pubPars['学校ID'],
        '科目ID': pubPars['科目ID'],
        '类型': 2
      },
      success: function (data) {
        data = dataMake(data);
        if(data.result && data.data){
          testInfo.daZsd = data.data[0]['节点'];
          var dgDt = {
            daGang: data.data[0]['节点']
          };
          initFun(dgDt);
        }
        else{
          alert('没有大纲数据！');
        }
      },
      error: function (error) {
        alert(error);
      }
    });
  };

  //登录
  var loginFun = function(){
    //var myUrl = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxabcb783dbd59b065&redirect_uri=https%3a%2f%2fwww.zhifz.com%2fweixin%2fteacher%2findex.html&response_type=code&scope=snsapi_base&state=1234#wechat_redirect';
    //window.location.href = myUrl;
    $.ajax({
      method: 'GET',
      url: loginUrl,
      data:{
        '微信ID':'wxabcb783dbd59b065'
      },
      success: function (data) {
        data = dataMake(data);
        if(data.result){
          getDaGang();
        }
        else{
          //显示注册页面
        }
      },
      error: function (error) {
        alert(error);
      }
    });
  };

  //初始化函数执行
  loginFun();

  //显示考试详情函数
  var showTestResult = function(id){
    $.ajax({
      method: 'GET',
      url: cyZsdDfl,
      data: {
        '测验ID': id
      },
      success: function (data) {
        data = dataMake(data);
        if(data.result){
          var obj = {
            title: testInfo.name,
            ren: testInfo.ren,
            score: 0
          };
          //查询成绩
          $.ajax({
            method: 'GET',
            url: ceYanChengJiUrl,
            data: {
              '测验ID': id
            },
            success: function (stus) {
              stus = dataMake(stus);
              if(stus.result){
                testInfo.stu = stus.data;
                var pepLen = 1;
                if(stus.data){
                  pepLen = stus.data.length;
                  obj.score = +((Lazy(stus.data).reduce(function(memo, pep){ return memo + pep['答对数']; }, 0) * 10) / pepLen).toFixed(1);
                }
                else{
                  obj.score = 0;
                }
                renderFun(obj, 'tplResult');
                $('.weui_tab_bd').scrollTop(0);
                // 基于准备好的dom，初始化echarts实例
                var myChart = echarts.init(document.getElementById('radarBox'));
                // 指定图表的配置项和数据
                var option = {
                  title: {
                    text: '知识点得分率'
                  },
                  tooltip: {},
                  legend: {
                    data: ['知识点']
                  },
                  radar: {
                    name: {
                      textStyle: {
                        color: 'rgba(0, 0, 0, 1)'
                      }
                    },
                    indicator: [
                      //{ name: '知识点1', max: 100},
                      //{ name: '知识点2', max: 100},
                      //{ name: '知识点3', max: 100},
                      //{ name: '知识点4', max: 100},
                      //{ name: '知识点5', max: 100}
                    ]
                  },
                  series: [{
                    name: '知识点',
                    type: 'radar',
                    data : [
                      {
                        //value : [30, 56, 74, 45, 100],
                        value : [],
                        name : '知识点'
                      }
                    ]
                  }]
                };
                Lazy(testInfo.daZsd).each(function(dgZsd){
                  var fd = Lazy(data.data).find(function(zsd){
                    return zsd['知识点ID'] == dgZsd['知识点ID'];
                  });
                  var zsdObj = {
                    name: dgZsd['知识点名称'],
                    max: 100
                  };
                  var dfl = 0;
                  if(fd){
                    dfl = fd['得分率'] * 100;
                  }
                  option.radar.indicator.push(zsdObj);
                  option.series[0].data[0].value.push(parseInt(dfl.toFixed(1)));
                });
                // 使用刚指定的配置项和数据显示图表。
                myChart.setOption(option);
              }
              else{
                alert(stus.error);
              }
            },
            error: function (error) {
              alert(error);
            }
          });
        }
        else{
          alert(data.error);
        }
      },
      error: function (error) {
        alert(error);
      }
    });
  };

  //生成二维码弹出
  var makeErWeiMa = function(url){
    $("#QRCodeBox").html('');
    $('.erWeiMa').show().on('click', '.weui_btn_dialog', function () {
      $('.erWeiMa').off('click').hide();
    });
    new QRCode(document.getElementById("QRCodeBox"), {
      text: url,
      width: 200,
      height: 200,
      background: '#ccc',
      foreground: 'red'
    });
  };

  //事件处理
  $('#container').on('click', '.weui_tabbar_item', function () { //tabbar的激活函数
    $(this).addClass('weui_bar_item_on').siblings('.weui_bar_item_on').removeClass('weui_bar_item_on');
  })
    .on('click', '.radioSty', function(){ //radio选择样式
      $(this).addClass('iptStyOn').siblings('.iptStyOn').removeClass('iptStyOn');
      $(this).siblings('.radioSty').find('input').prop('checked', false);
      $(this).find('input').prop('checked', true);
    })
    .on('click', '.checkboxSty', function(){ //checkbox选择样式
      $(this).toggleClass('iptStyOn');
      var chkIn = $(this).hasClass('iptStyOn');
      if(chkIn){
        $(this).find('input').prop('checked', true);
      }
      else{
        $(this).find('input').prop('checked', false);
      }
    });

  /**
   * <------ 发起测试模块 ------>
   */
  //发起测试按钮
  $('#tabBtnAddNew').on('click', function(){
    var dgDt = {
      daGang: testInfo.daZsd
    };
    initFun(dgDt);
  });

  //新建测验
  sltShowBox.on('click', '#renderQRBtn', function(){
    var dt = new Date();
    var mt = dt.getMonth() + 1;
    var dy = dt.getDate();
    var testName = mt + '月' + dy + '日' + '测试';
    var kmId = $('input[name="csType"]:checked').val(); //科目
    var tmNum = $('input[name="csTmNum"]:checked').val(); //题目数量
    var ctfs = $('input[name="csCtfs"]:checked').val(); //抽题方式
    var zsdSlt = document.querySelectorAll('input[name="zsd"]');
    var zsdLen = zsdSlt.length;
    var zsdArr = [];
    var mis = [];
    for(var i = 0; i < zsdLen; i++) {
      if(zsdSlt[i].checked){
        zsdArr.push(parseInt(zsdSlt[i].value));
      }
    }
    if(!kmId){
      mis.push('测试类别');
    }
    if(!tmNum){
      mis.push('题目数量');
    }
    if(!(zsdArr.length > 0)){
      mis.push('考查内容');
    }
    if(mis && mis.length > 0){
      alert('缺少：' + mis.join('，'));
      return ;
    }
    var obj = {
      '测验名称': testName,
      '学校ID': +pubPars['学校ID'],
      '科目ID': +kmId,
      '测验设置': {
        '组卷规则': [{
          '大题名称': '单选题-' + testName,
          '随机题目': [
            {
              '题目分值': 1,
              '题目数量': +tmNum,
              '使用题目池': false,
              '限定题库': [1111],
              '难度': [1,2,3,4,5],
              '题型': 1,
              '知识点': zsdArr
            }
          ]
        }], // 与组卷接口定义一致
        '固定题目': true // true 表示所有参与测验的用户使用同一套题目
      }
    };
    if(ctfs == 0){
      obj['测验设置']['固定题目'] = false;
    }
    obj['测验设置'] = JSON.stringify(obj['测验设置']);
    $.ajax({
      method: 'PUT',
      url: ceYanUrl,
      data: obj,
      success: function (data) {
        data = dataMake(data);
        if(data.result){
          var textStr = testUrl + data.data['测验ID'];
          makeErWeiMa(textStr);
        }
        else{
          alert(data.error);
        }
      },
      error: function (error) {
        alert(error);
      }
    });
  });

  //自己测验
  sltShowBox.on('click', '.selfTest', function(){
    $('#teacherInfo2').show().on('click', '#submitTechInfo2', function () {
      var school = $('input[name="yourSchool"]').val();
      var name = $('input[name="yourName"]').val();
      var phone = $('input[name="yourPhone"]').val();
      var email = $('input[name="yourEmail"]').val();
      var mis = [];
      if(!school){
        mis.push('学校名称');
      }
      if(!name){
        mis.push('您的姓名');
      }
      if(!phone){
        mis.push('联系方式');
      }
      if(mis.length > 0){
        alert('缺少：' + mis.join('，'));
        return ;
      }
      var obj = {
        '学校名称': school,
        '姓名': name,
        '联系方式': phone,
        '电子信箱': email
      };
      $.ajax({
        method: 'PUT',
        url: keyValueUrl,
        data: {
          '键值内容': JSON.stringify(obj)
        },
        success: function (data) {
          data = dataMake(data);
          if(data.result){
            $('#teacherInfo2').off('click').hide();
          }
          else{
            alert(data.error);
          }
        },
        error: function (error) {
          alert(error);
        }
      });
    });
  });

  /**
   * <------ 测试结果模块 ------>
   */
  //测验列表的加载函数
  var testListRender = function(){
    $.ajax({
      method: 'GET',
      url: ceYanUrl,
      data: {
        '学校ID': 1033
      },
      success: function (data) {
        data = dataMake(data);
        if(data.result && data.data){
          var nwDt = data.data.reverse();
          renderFun({testDt: nwDt}, 'tplResultList');
          $('.title').text('测试结果');
        }
        else{
          alert(data.error || '没有符合的数据！');
        }
      },
      error: function (error) {
        alert(error);
      }
    });
  };

  //测试结果按钮
  $('#tabBtnResult').on('click', function(){
    testListRender();
  });

  //查看测试结果详情
  sltShowBox.on('click', '.testResult', function(){
    var testId = +$(this).data('id');
    var testName = $(this).data('name');
    var testRen = $(this).data('ren');
    testInfo.id = testId;
    testInfo.name = testName;
    testInfo.ren = testRen;
    $.ajax({
      method: 'GET',
      url: ceYanUrl,
      data: {
        '测验ID': testId,
        '返回详情': true
      },
      success: function (data) {
        data = dataMake(data);
        if(data.result && data.data){
          testInfo.zsd = data.data[0]['测验设置']['组卷规则'][0]['随机题目'][0]['知识点'];
          showTestResult(testId);
        }
        else{
          alert(data.error || '没有符合的数据！');
        }
      },
      error: function (error) {
        alert(error);
      }
    });
  });

  //返回函数
  sltShowBox.on('click', '#backToRltList', function(){
    testListRender();
  });

  //测试人员列表
  sltShowBox.on('click', '.resultScore', function(){
    var dt = {
      title: testInfo.name,
      staff: testInfo.stu
    };
    renderFun(dt, 'tplResultStaff');
  });

  //返回测试结果
  sltShowBox.on('click', '#backToRlt', function(){
    showTestResult(testInfo.id);
  });

  //教师的免费试用
  sltShowBox.on('click', '.freeToUse', function () {
    $('#teacherInfo1').show().on('click', '#submitTechInfo', function () {
      var school = $('input[name="yourSchool"]').val();
      var name = $('input[name="yourName"]').val();
      var phone = $('input[name="yourPhone"]').val();
      var email = $('input[name="yourEmail"]').val();
      var mis = [];
      if(!school){
        mis.push('学校名称');
      }
      if(!name){
        mis.push('您的姓名');
      }
      if(!phone){
        mis.push('联系方式');
      }
      if(mis.length > 0){
        alert('缺少：' + mis.join('，'));
        return ;
      }
      var obj = {
        '学校名称': school,
        '姓名': name,
        '联系方式': phone,
        '电子信箱': email
      };
      $.ajax({
        method: 'PUT',
        url: keyValueUrl,
        data: {
          '键值内容': JSON.stringify(obj)
        },
        success: function (data) {
          data = dataMake(data);
          if(data.result){
            $('#teacherInfo1').off('click').hide();
          }
          else{
            alert(data.error);
          }
        },
        error: function (error) {
          alert(error);
        }
      });
    });
  });

  //点击测试标题生成二维码
  sltShowBox.on('click', '.testName', function(){
    $.ajax({
      method: 'GET',
      url: qrcodeUrl,
      data: {
        '测验ID': testInfo.id
      },
      success: function (data) {
        data = dataMake(data);
        if(data.result && data.data){
          var textStr = testUrl + data.data['测验ID'];
          makeErWeiMa(textStr);
        }
        else{
          alert(data.error);
        }
      },
      error: function (error) {
        alert(error);
      }
    });
  });

  //关闭按钮
  sltShowBox.on('click', '.closeBtn', function(){
    $('#teacherInfo1').off('click').hide();
    $('#teacherInfo2').off('click').hide();
  });

  /**
   * <------ 宣传视频模块 ------>
   */
  //宣传视频按钮
  $('#tabBtnVideo').on('click', function(){
    window.location.href = 'http://mp.weixin.qq.com/s?__biz=MzIzNDUyMDA5Nw==&mid=100000003&idx=1&sn=5c43809e2caf508f7064526ab48663e2&scene=18#wechat_redirect';
    //$('.title').text('宣传视频');
    //renderFun({}, 'tplVideos');
  });

  /**
   * <------ 免费试用模块 ------>
   */
  //免费试用按钮
  $('#tabBtnFree').on('click', function(){
    $('.title').text('免费试用');
    renderFun({}, 'tplFree');
  });

  /**
   * <------ 检测浏览器退出 ------>
   */
  window.onbeforeunload = function(){

  };
});
