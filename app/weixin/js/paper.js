/**
 * Created by songtao on 16/12/3.
 */
$(function(){
  var loginUrl = '/login'; //登录
  var yongHuUrl = '/yonghu'; //用户
  var yongHuCeYan = '/yonghu_ceyan'; //用户测试
  var yongHuDaTi = '/yonghu_dati'; //用户答题
  var tiMuArr = []; //题目数组
  var zhuCeId = ''; //注册ID
  var daTiArr = []; //已答题目数组
  var paperLen = ''; //题目数量
  var currentPg = ''; //当前页码
  var paperTitle= ''; //试卷名称
  var ziMu =  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
    'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']; //英文字母序号数组
  var ppPar = { //测验用到的参数
    wxid: '',
    //wxid: 'wxabcb783dbd59b067',
    testID: '',
    jgId: '',
    uid: '',
    stat: ''
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

  /**
   * 关闭提示框
   */
  var dialog = function(info, title){
    var ttl = title || '错误信息';
    $('.msgBox').html(info);
    $('.msgTitle').html(ttl);
    $('#dialog2').show().on('click', '.weui_btn_dialog', function () {
      $('#dialog2').off('click').hide();
    });
  };

  /**
   * 模板render函数
   */
  var renderFun =  function(data, tplId){
    var html = template(tplId, data);
    $('#content').html(html);
  };

  /**
   * 题目的展示
   */
  var tmRender = function(d, t, p, a){
    var dt = {
      title: t,
      page: p,
      tiMu: d,
      totalPg: a,
      letterArr: ziMu
    };
    renderFun(dt, 'tplPaper');
    MathJax.Hub.Config({
      tex2jax: {inlineMath: [["#$", "$#"]], displayMath: [['#$$','$$#']]},
      messageStyle: "none",
      showMathMenu: false,
      processEscapes: true
    });
    MathJax.Hub.Queue(["Typeset", MathJax.Hub, "content"]);
    var tmId = d['题目ID'];
    var daTiLen = daTiArr.length;
    for(var i = 0; i < daTiLen; i++){
      if(daTiArr[i]['题目ID'] == tmId){
        var idx = parseInt(daTiArr[i]['答案']);
        $('.tiZhiOpt').eq(idx).prop('checked', true);
      }
    }
    if(p == a){
      $('.submitTestWrap').show();
    }
    else{
      $('.submitTestWrap').hide();
    }
  };

  /**
   * 加载测验
   */
  var loadTest = function(){
    if(ppPar.stat == 1){
      $.ajax({
        method: 'PUT',
        url: yongHuCeYan,
        data: {
          '测验ID':ppPar.testID
        },
        success: function (data) {
          data = dataMake(data);
          if(data.result && data.data){
            if(data.data['测验题目'][0]['题目'].length > 0){
              var tmpTitle = data.data['测验题目'][0]['大题名称'];
              var tmpTitleArr = tmpTitle.split('-');
              paperTitle = tmpTitleArr[1];
              tiMuArr = data.data['测验题目'][0]['题目'];
              zhuCeId = data.data['注册ID'];
              paperLen = tiMuArr.length;
              currentPg = 1;
              $('#navBar').show();
              if(paperLen == 1){
                $('#prvBtn').hide();
                $('#nextBtn').hide();
                $('#submitTest').show().css({width: '100%'});
              }
              tmRender(tiMuArr[0], paperTitle, currentPg, paperLen);
            }
            else{
              dialog(data.error || '没有题目！');
            }
          }
          else{
            dialog(data.error || '没有测验数据！');
          }
        },
        error: function (error) {
          dialog(error);
        }
      });
    }
    else{
      dialog('测验还没开始！');
    }
  };

  /**
   * 函数初始化
   */
  var initFun = function(){
    var tarId = $('#myBody');
    ppPar.wxid = tarId.data('id');
    ppPar.testID = tarId.data('test');
    ppPar.jgId = tarId.data('jg');
    ppPar.stat = tarId.data('stat');
    $.ajax({
      method: 'GET',
      url: loginUrl,
      data:{
        '微信ID': ppPar.wxid
      },
      success: function (data) {
        data = dataMake(data);
        if(data.result && data.data){
          //加载测验
          loadTest();
        }
        else{
          //用户注册
          renderFun({}, 'tplLogin');
        }
      },
      error: function (error) {
        dialog(error);
      }
    });
  };
  initFun();

  /**
   * 试卷处理
   */
  $('#container').on('click', '.navBar_item', function(){
    $(this).addClass('navBar_item_on').siblings('.navBar_item_on').removeClass('navBar_item_on');
  })
    .on('click', '#linkUsr', function(){ //关联账号
      var xh = $('input[name="xueHao"]').val();
      var xm = $('input[name="xingMing"]').val();
      var mis = [];
      if(!xh){
        mis.push('填写学号');
      }
      if(!xm){
        mis.push('填写姓名');
      }
      if(mis.length > 0){
        dialog('请：' + mis.join());
        return ;
      }
      $.ajax({ //查询学生信息
        method: 'GET',
        url: yongHuUrl,
        data:{
          '学校ID': ppPar.jgId,
          '学号': xh,
          '姓名': xm
        },
        success: function (data) {
          data = dataMake(data);
          if(data.result && data.data){ //有用户信息
            //用学校ID和学号去登陆
            $.ajax({
              method: 'GET',
              url: loginUrl,
              data:{
                '学校ID': ppPar.jgId,
                '学号': xh
              },
              success: function (data1) {
                data1 = dataMake(data1);
                if(data1.result && data1.data){
                  ppPar.uid = data1.data['UID'];
                  //去关联微信的openid
                  $.ajax({
                    method: 'POST',
                    url: yongHuUrl,
                    data:{
                      'UID': ppPar.uid,
                      '微信ID': ppPar.wxid
                    },
                    success: function(data2){
                      data2 = dataMake(data2);
                      if(data2.result){
                        //加载测验
                        loadTest();
                      }
                      else{
                        dialog(data2.error);
                      }
                    },
                    error: function(error2){
                      dialog(error2);
                    }
                  });
                }
                else{
                  dialog(data1.error);
                }
              },
              error: function (error1) {
                dialog(error1);
              }
            });
          }
          else{ //没有用户信息注册新用户, 目前没有接口
            $.ajax({
              method: 'PUT',
              url: yongHuUrl,
              data: {
                '微信ID': ppPar.wxid,
                '学校ID': ppPar.jgId,
                '用户类别': 2,
                '姓名': xm,
                '学号': xh
              },
              success: function(data3){
                if(data3.result && data3.data){
                  $.ajax({
                    method: 'GET',
                    url: loginUrl,
                    data:{
                      '微信ID': ppPar.wxid
                    },
                    success: function (data4) {
                      data4 = dataMake(data4);
                      if(data4.result && data4.data){
                        //加载测验
                        loadTest();
                      }
                      else{
                        dialog(data4.error)
                      }
                    },
                    error: function (error4) {
                      dialog(error4);
                    }
                  });
                }
                else{
                  dialog(data3.error)
                }
              },
              error: function(error3){
                dialog(error3);
              }
            });
          }
        },
        error: function (error) {
          dialog(error);
        }
      });
    })
    .on('click', '.tiZhiOpt', function(){ //答题
      var daStr = $(this).val();
      var daArr = daStr.split('-');
      var da = daArr[1];
      var tmId = parseInt(daArr[0]);
      var daTiLen = daTiArr.length;
      var daObj = {
        '题目ID': tmId,
        '答案': da
      };
      var noIn = true;
      for(var i = 0; i < daTiLen; i++){
        if(daTiArr[i]['题目ID'] == tmId){
          daTiArr[i]['答案'] = da;
          noIn = false;
        }
      }
      if(noIn){
        daTiArr.push(daObj);
      }
    })
    .on('click', '#prvBtn', function(){ //上一页
      -- currentPg;
      if(currentPg >= 1){
        var dt = tiMuArr[currentPg - 1];
        if(currentPg < paperLen){
          $('#nextBtn').show();
          $('#submitTest').hide();
        }
        tmRender(dt, paperTitle, currentPg, paperLen);
      }
      else{
        currentPg = 1;
        dialog('已经到第一题！');
      }
    })
    .on('click', '#nextBtn', function(){ //下一页
      ++ currentPg;
      var dt = tiMuArr[currentPg - 1];
      if(currentPg <= paperLen){
        if(currentPg == paperLen){
          currentPg = paperLen;
          $(this).hide();
          $('#submitTest').show();
        }
        tmRender(dt, paperTitle, currentPg, paperLen);
      }
    })
    .on('click', '#submitTest', function(){ //提交用户答题
      var yiDaLen = daTiArr.length;
      var cut = paperLen - yiDaLen;
      var subFun = function(){
        $.ajax({
          method: 'POST',
          url: yongHuDaTi,
          data: {
            '注册ID': zhuCeId,
            '测验ID':ppPar.testID,
            '答题': JSON.stringify(daTiArr)
          },
          success: function (data) {
            if(typeof(data) == 'string'){
              data = JSON.parse(data);
            }
            if(data.result){
              $.ajax({
                method: 'POST',
                url: yongHuCeYan,
                data: {
                  '注册ID': zhuCeId,
                  '测验ID': ppPar.testID,
                  '微信ID': ppPar.id
                },
                success: function (data) {
                  if(typeof(data) == 'string'){
                    data = JSON.parse(data);
                  }
                  if(data.result){ //关闭页面
                    var dt = {
                      allTm: data.data['答题总数'] - data.data['答对题数'],
                      rightTm: data.data['答对题数']
                    };
                    renderFun(dt, 'tplScore');
                    $('#navBar').hide();
                  }
                  else{
                    dialog(data.error);
                  }
                },
                error: function (error) {
                  dialog(error);
                }
              });
            }
            else{
              dialog(data.error);
            }
          },
          error: function (error) {
            dialog(error);
          }
        });
      };
      if(cut > 0){
        if(confirm('有' + cut + '未作答！确定要提交吗？')){
          subFun();
        }
      }
      else{
        subFun();
      }
    });
});
