/**
 * Created by songtao on 16/9/22.
 */
$(function(){
  var loginUrl = '/login'; //登录
  var classTestUrl = "/test_code"; //测验考试码
  var yongHuDaTi = '/yonghu_dati'; //用户答题
  var yongHuCeYan = '/yonghu_ceyan'; //用户测试
  var tiMuArr = []; //题目数组
  var zhuCeId = ''; //注册ID
  var daTiArr = []; //已答题目数组
  var paperLen = ''; //题目数量
  var currentPg = ''; //当前页码
  var paperTitle= ''; //试卷名称
  var testID = ''; //测验ID
  var ziMu =  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
    'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']; //英文字母序号数组
  var ctPar = { //随堂测验的参数
    uid: '',
    wxid: ''
    //wxid: 'wxabcb783dbd59b067001'
  };

  /**
   * 返回的数据类型处理
   */
  var dataMake = function(dt){
    if(typeof(dt) == 'string'){
      return JSON.parse(dt);
    }
    else{
      return dt;
    }
  };

  /**
   * 题目展示
   */
  var tmRender = function(d, t, p, a){
    var dt = {
      title: t,
      page: p,
      tiMu: d,
      totalPg: a,
      letterArr: ziMu
    };
    var html = template('tplPaper', dt);
    $('#content').html(html);
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
   * 模板render函数
   */
  var renderFun =  function(data, tplId){
    var html = template(tplId, data);
    $('#content').html(html);
  };
  var renderFunNav = function(data, tplId){
    var html = template(tplId, data);
    $('#navBar').html(html);
  };

  /**
   * 初始化函数
   */
  var initFun = function(){
    var opId = $('#myBody').data('id');
    ctPar.wxid = opId || '';
    $('#navBar').hide();
    $.ajax({
      method: 'GET',
      url: loginUrl,
      data:{
        '微信ID': ctPar.wxid
      },
      success: function (data) {
        data = dataMake(data);
        if(data.result && data.data){
          ctPar.uid = data.data['UID'];
          //显示输入码页面
          renderFun({}, 'tplTestNum');
        }
        else{
          //显示输入码和学号姓名页面
          renderFun({}, 'tplTestNumUnLog');
        }
      },
      error: function (error) {
        dialog(error);
      }
    });
  };
  initFun();

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
   * 加载测验函数
   */
  var renderTest = function(pars){
    $.ajax({
      method: 'GET',
      url: classTestUrl,
      data: pars,
      success: function (data) {
        data = dataMake(data);
        if(data.result && data.data && data.data['测验题目'][0]['题目'].length > 0){
          renderFunNav({}, 'answerNav');
          $('#navBar').show();
          var tmpTitle = data.data['测验题目'][0]['大题名称'];
          var tmpTitleArr = tmpTitle.split('-');
          paperTitle = tmpTitleArr[1];
          tiMuArr = data.data['测验题目'][0]['题目'];
          zhuCeId = data.data['注册ID'];
          testID = + data.data['测验ID'];
          paperLen = tiMuArr.length;
          currentPg = 1;
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
      },
      error: function (error) {
        dialog(error);
      }
    });
  };

  /**
   * 点击事件
   */
  $('#container').on('click', '.navBar_item', function(){
    $(this).addClass('navBar_item_on').siblings('.navBar_item_on').removeClass('navBar_item_on');
  })
    .on('click', '#getClassTestTiMu', function () {
    var ctn = $('input[name="testCode"]').val();
    if(ctn && ctn.length == 6){
      var obj = {
        '随堂测验码': ctn.toUpperCase()
      };
      renderTest(obj);
    }
    else{
      dialog('请输入随堂测验码');
    }
  })
    .on('click', '#getClassTestTiMuUnLog', function(){
      var ctn = $('input[name="testCode"]').val();
      var xueHao = $('input[name="xueHao"]').val();
      var xingMing = $('input[name="xingMing"]').val();
      var mis = [];
      if(!(ctn && ctn.length == 6)){
        mis.push('缺少随堂测验码或随堂测验码格式不正确');
      }
      if(!xueHao){
        mis.push('缺少学号');
      }
      if(!xingMing){
        mis.push('缺少姓名');
      }
      if(mis.length > 0){
        dialog(mis.join(';'));
        return ;
      }
      var obj = {
        '随堂测验码': ctn.toUpperCase(),
        '学号': xueHao,
        '姓名': xingMing,
        '用户状态': 'unlink',
        '微信ID': ctPar.wxid
      };
      renderTest(obj);
    })
    .on('click', '.tiZhiOpt', function(){
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
    .on('click', '#prvBtn', function(){
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
    .on('click', '#nextBtn', function(){
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
    .on('click', '#submitTest', function(){
      var yiDaLen = daTiArr.length;
      var cut = paperLen - yiDaLen;
      var subFun = function(){
        $.ajax({
          method: 'POST',
          url: yongHuDaTi,
          data: {
            '注册ID': zhuCeId,
            '测验ID':testID,
            '答题': JSON.stringify(daTiArr)
          },
          success: function (data) {
            data = dataMake(data);
            if(data.result && data.data){
              $.ajax({
                method: 'POST',
                url: yongHuCeYan,
                data: {
                  '注册ID': zhuCeId,
                  '测验ID':testID,
                  '微信ID': ctPar.wxid,
                  '用户ID': ctPar.uid
                },
                success: function (score) {
                  score = dataMake(score);
                  if(score.result && score.data){ //关闭页面
                    var dt = {
                      allTm: score.data['答题总数'],
                      rightTm: score.data['答对题数']
                    };
                    renderFun(dt, 'tplScore');
                    renderFunNav({}, 'resultNav');
                    tiMuArr = []; //题目数组
                    zhuCeId = ''; //注册ID
                    daTiArr = []; //已答题目数组
                    paperLen = ''; //题目数量
                    currentPg = ''; //当前页码
                    paperTitle= ''; //试卷名称
                    testID = ''; //测验ID
                    $('#nextBtn').show();
                    $('#submitTest').hide();
                    //$('#navBar').hide();
                  }
                  else{
                    dialog(score.error);
                  }
                },
                error: function (error) {
                  dialog(error);
                }
              });
            }
            else{
              dialog(data.error || '答题结果为空！');
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
    })
    .on('click', '#backToInput', function(){
      initFun();
    });

});
