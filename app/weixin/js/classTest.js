/**
 * Created by songtao on 16/9/22.
 */
$(function(){
  var loginUrl = '/login'; //登录
  var classTestUrl = "/test_code"; //测验考试码
  var yongHuDaTi = '/yonghu_dati'; //用户答题
  var yongHuCeYan = '/yonghu_ceyan'; //用户测试
  var ceYanUrl = '/ceyan'; //测验的url
  var tiMuArr = []; //题目数组
  var zhuCeId = ''; //注册ID
  var daTiArr = []; //已答题目数组
  var paperLen = ''; //题目数量
  var currentPg = ''; //当前页码
  var paperTitle= ''; //试卷名称
  var testID = ''; //测验ID
  var cnNumArr = ['一','二','三','四','五','六','七','八','九','十'];
  var ziMu =  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
    'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']; //英文字母序号数组
  var ctPar = { //随堂测验的参数
    uid: '',
    jgId: '',
    xh: '',
    xm: '',
    wxid: ''
    // wxid: 'wxabcb783dbd59b067001'
    // wxid: 'oIdzKwK2JBLPkk8xapl4_evqiuJQ' //蔡路
    // wxid: 'oA5Yrw348MVRKwHLPdG8cpDFuKaA' //松涛
  };
  var oldTestArr = []; //往期测验

  /**
   * 判断是否为数组
   */
  var isArray = function (obj) {
    return obj instanceof Array;
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
   * 关闭提示框
   */
  var dialog = function(info, title){
    var ttl = title || '错误信息';
    $('.msgBox').html(info);
    $('.msgTitle').html(ttl);
    $('#iosDialog2').show().on('click', '.weui-dialog__btn', function () {
        $('#iosDialog2').off('click').hide();
    });
  };

  /**
   * 对日期进行格式化，
   * @param date 要格式化的日期
   * @param format 进行格式化的模式字符串
   *     支持的模式字母有：
   *     y:年,
   *     M:年中的月份(1-12),
   *     d:月份中的天(1-31),
   *     h:小时(0-23),
   *     m:分(0-59),
   *     s:秒(0-59),
   *     S:毫秒(0-999),
   *     q:季度(1-4)
   * @return String
   * @author yanis.wang
   */
  template.helper('dateFormat', function (date, format) {
      date = new Date(date);
      var map = {
          "M": date.getMonth() + 1, //月份
          "d": date.getDate(), //日
          "h": date.getHours(), //小时
          "m": date.getMinutes(), //分
          "s": date.getSeconds(), //秒
          "q": Math.floor((date.getMonth() + 3) / 3), //季度
          "S": date.getMilliseconds() //毫秒
      };
      format = format.replace(/([yMdhmsqS])+/g, function(all, t){
          var v = map[t];
          if(v !== undefined){
              if(all.length > 1){
                  v = '0' + v;
                  v = v.substr(v.length-2);
              }
              return v;
          }
          else if(t === 'y'){
              return (date.getFullYear() + '').substr(4 - all.length);
          }
          return all;
      });
      return format;
  });

  /**
   * 对题目答案式化，返回英文字母
   */
  template.helper('daAnFormat', function (daAn, format) {
    if(isArray(daAn)){
        var newDa = [];
        Lazy(daAn).each(function(da){
            newDa.push(ziMu[da]);
        });
        format = newDa.join(',');
    }
    else {
        format = ziMu[daAn];
    }
    return format;
  });

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
    var txId = d['题型ID'];
    var daTiLen = daTiArr.length;
    for(var i = 0; i < daTiLen; i++){
      if(daTiArr[i]['题目ID'] == tmId){
        if(txId == 1){
          var idx = parseInt(daTiArr[i]['索引']);
          $('.tiZhiOpt').eq(idx).prop('checked', true);
        }
        if(txId == 2){
          Lazy(daTiArr[i]['索引']).each(function(sy){
            $('.tiZhiOpt').eq(sy).prop('checked', true);
          });
        }
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
  var renderFun =  function(data, tplId, container){
    template.config('escape', false);
    var html = template(tplId, data);
    $(container).html(html);
  };

  /**
   * 初始化函数
   */
  var initFun = function(){
    ctPar.wxid = $('#myBody').data('id') || '';
    $('#navBar').hide();
    if(ctPar.wxid){
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
                    ctPar.jgId = data.data['学校ID'];
                    ctPar.xh = data.data['学号'];
                    ctPar.xm = data.data['姓名'];
                    //显示输入码页面
                    renderFun({}, 'tplTestNum', '#content');
                    renderFun({}, 'tplListKind', '#navBar');
                    $('#navBar').show();
                    $('.navBar_item').eq(0).addClass('navBar_item_on');
                }
                else{
                    //显示输入码和学号姓名页面
                    renderFun({}, 'tplTestNumUnLog', '#content');
                }
            },
            error: function (error) {
                dialog(error);
            }
        });
    }
    else{
        dialog('微信ID为空！');
    }
  };
  initFun();

  /**
   * 加载测验函数
   */
  var renderTest = function(pars){
    zhuCeId = '';
    tiMuArr = [];
    $.ajax({
      method: 'GET',
      url: classTestUrl,
      data: pars,
      success: function (data) {
        data = dataMake(data);
        if(data.result && data.data && data.data['测验题目'][0]['题目'].length > 0){
          renderFun({}, 'answerNav', '#navBar');
          $('#navBar').show();
          var tmpTitle = data.data['测验题目'][0]['大题名称'];
          var tmpTitleArr = tmpTitle.split('-');
          paperTitle = tmpTitleArr[1];
          Lazy(data.data['测验题目']).each(function(dt){
            Lazy(dt['题目']).each(function(xt){
              var newXx = [];
              Lazy(xt['题目内容']['选项']).each(function(tz, idx, lst){
                var newTz = {
                  '题支': tz,
                  '序号': idx
                };
                newXx.push(newTz);
              });
              xt['题目内容']['选项'] = Lazy(newXx).shuffle().value();
              tiMuArr.push(xt);
            });
          });
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
   * 延迟调用函数
   */
  var _delayTimer = {};
  function delayCall(id, delay, func) {
    var timer = _delayTimer[id];
    if (timer) {
      clearTimeout(timer);
    }
    _delayTimer[id] = setTimeout(function () {
      if (func) {
        func();
      }
      clearTimeout(_delayTimer[id]);
      delete _delayTimer[id];
    }, delay);
  }

  /**
   * 作答重现
   */
  var zuoDaFun = function(sltTestId){
      var obj = {
          title: '',
          zhn: cnNumArr,
          letterArr: ziMu,
          tiMuArr: ''
      };
      $.ajax({
          method: 'GET',
          url: ceYanUrl,
          data:{
              '测验ID': sltTestId,
              '返回详情': true
          },
          success: function (timu) {
              timu = dataMake(timu);
              if(timu.result && timu.data){
                  //用户作答数据查询
                  $.ajax({
                      method: 'GET',
                      url: yongHuDaTi,
                      data: {
                          '测验ID': sltTestId
                      },
                      success: function (data) {
                          data = dataMake(data);
                          if(data.result && data.data){
                              obj.title = timu.data[0]['测验名称'];
                              Lazy(timu.data[0]['测验题目']).each(function(dt){
                                  Lazy(dt['题目']).each(function(tm){
                                      var newXx = [];
                                      var findZd = Lazy(data.data).find(function (zd) {
                                          return zd['题目ID'] == tm['题目ID'];
                                      });
                                      var usrZdStr = '';
                                      var usrZdArr = [];
                                      if(findZd){
                                          usrZdStr = findZd['答案'];
                                          if(usrZdStr){
                                              var usrZdArrTmp = usrZdStr.split(',');
                                              Lazy(usrZdArrTmp).each(function(da){
                                                  usrZdArr.push(+da);
                                              });
                                          }
                                      }
                                      Lazy(tm['题目内容']['选项']).each(function(xx, idx, lst){
                                          var nxx = {
                                              '题支': xx,
                                              ckd: false
                                          };
                                          nxx.ckd = Lazy(usrZdArr).contains(idx);
                                          newXx.push(nxx);
                                      });
                                      if(newXx && newXx.length > 0){
                                          tm['题目内容']['选项'] = newXx;
                                      }
                                  });
                              });
                              obj.tiMuArr = timu.data[0]['测验题目'];
                              renderFun(obj, 'tplScore', '#content');
                              renderFun({}, 'tplBackToList', '#navBar');
                              MathJax.Hub.Config({
                                  tex2jax: {inlineMath: [["#$", "$#"]], displayMath: [['#$$','$$#']]},
                                  messageStyle: "none",
                                  showMathMenu: false,
                                  processEscapes: true
                              });
                              MathJax.Hub.Queue(["Typeset", MathJax.Hub, "content"]);
                              $('#content').scrollTop(0);
                          }
                          else{
                              dialog(data.error || '没有作答数据！');
                          }
                      },
                      error: function (error) {
                          dialog(error);
                      }
                  });
              }
              else{
                  dialog(timu.error || '本测验没有题目！');
              }
          },
          error: function (error) {
              dialog(error);
          }
      });
  };

  /**
   * 历史测验列表
   */
  var getHistoryTestFun = function(){
      if(oldTestArr && oldTestArr.length > 0){
          renderFun({testDt: oldTestArr}, 'classTestList', '#content');
      }
      else{
          $.ajax({
              method: 'GET',
              url: yongHuCeYan,
              data:{
                  'UID': ctPar.uid
              },
              success: function (data) {
                  data = dataMake(data);
                  if(data.result && data.data.length > 0){
                      oldTestArr = Lazy(data.data).sortBy('测验ID').toArray().reverse();
                      renderFun({testDt: oldTestArr}, 'classTestList', '#content');
                  }
                  else{
                      dialog(data.error || '没有往期测验！');
                      renderFun({}, 'classTestList', '#content');
                  }
              },
              error: function (error) {
                  dialog(error);
                  renderFun({}, 'tplTestNum', '#content');
                  $('.navBar_item').eq(0).addClass('navBar_item_on');
              }
          });
      }
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
          '随堂测验码': ctn.toUpperCase(),
          'UID': ctPar.uid,
          '学号': ctPar.xh,
          '姓名': ctPar.xm,
          '微信ID': ctPar.wxid
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
      var isChecked = $(this).prop('checked');
      var daArr = daStr.split('-');
      var da = +daArr[1]; //答案
      var idx = +daArr[2]; //索引
      var txID = +daArr[3]; //题型ID
      var tmId = +daArr[0];
      var daObj = '';
      var noIn = true;
      Lazy(daTiArr).each(function(tm, i, l){ //题目已在已答题目数组中
        if(tm['题目ID'] == tmId){
          if(txID == 1){
            tm['答案'] = da;
            tm['索引'] = idx;
          }
          else{
            var daIsIn = Lazy(tm['索引']).contains(idx);
            if(daIsIn){
              if(!isChecked){
                tm['答案'] = Lazy(tm['答案']).reject(function (daNum) {
                  return daNum == da;
                }).toArray();
                tm['索引'] = Lazy(tm['索引']).reject(function (idxNum) {
                  return idxNum == idx;
                }).toArray();
              }
            }
            else{
              tm['答案'].push(da);
              tm['索引'].push(idx);
            }
          }
          noIn = false;
        }
      });
      if(noIn){ //题目不在已答题目数组中
        if(txID == 1){
          daObj = {
            '题目ID': tmId,
            '答案': da,
            '索引': idx
          };
        }
        else{
          daObj = {
            '题目ID': tmId,
            '答案': [],
            '索引': []
          };
          daObj['答案'].push(da);
          daObj['索引'].push(idx);
        }
        daTiArr.push(daObj);
      }
      // 提交答题数据
      var findTm = Lazy(daTiArr).find(function (timu) {
        return timu['题目ID'] == tmId;
      });
      // 提交函数
      var tmArr = [];
      var subFun = function(){
        var tm = tmArr;
        if(isArray(tm[0]['答案'])){
          tm[0]['答案'] = Lazy(tm[0]['答案']).sort().toArray().join(',');
        }
        $.ajax({
          method: 'POST',
          url: yongHuDaTi,
          data: {
            '注册ID': zhuCeId,
            '测验ID':testID,
            '答题': JSON.stringify(tm)
          },
          success: function (data) {
            data = dataMake(data);
            if(data.result && data.data){
              // console.log(daTiArr);
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
      if(findTm){
        var rbTiMu = {
          '题目ID': '',
          '答案': ''
        };
        rbTiMu['题目ID'] = findTm['题目ID'];
        rbTiMu['答案'] = findTm['答案'];
        tmArr.push(rbTiMu);
        if(txID == 2){
          delayCall(tmId, 1000, subFun);
        }
        else{
          subFun();
        }
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
      var subFunTj = function(){
        $.ajax({
          method: 'POST',
          url: yongHuCeYan,
          data: {
            '注册ID': zhuCeId,
            '测验ID':testID
          },
          success: function (score) {
            score = dataMake(score);
            if(score.result && score.data){ //关闭页面
              tiMuArr = []; //题目数组
              zhuCeId = ''; //注册ID
              daTiArr = []; //已答题目数组
              paperLen = ''; //题目数量
              currentPg = ''; //当前页码
              paperTitle= ''; //试卷名称
              $('#nextBtn').show();
              $('#submitTest').hide();
              // $('#navBar').hide();
              zuoDaFun(testID);
              testID = ''; //测验ID
              // renderFun({}, 'tplTestNum', '#content');
            }
            else{
              dialog(score.error);
            }
          },
          error: function (error) {
            dialog(error);
          }
        });
      };
      if(zhuCeId){
        if(cut > 0){
          if(confirm('有' + cut + '未作答！确定要提交吗？')){
            delayCall(zhuCeId, 2000, subFunTj);
          }
        }
        else{
          delayCall(zhuCeId, 2000, subFunTj);
        }
      }
      else{
        dialog('注册ID为空！');
      }
    })
    .on('click', '#newClassTest', function () {
        renderFun({}, 'tplTestNum', '#content');
    })
    .on('click', '#historyListTest', function () {
        getHistoryTestFun();
    })
    .on('click', '.zuoDa', function () {
        var testId = $(this).data('id');
        zuoDaFun(testId);
    })
    .on('click', '#backToList', function () {
        getHistoryTestFun();
        renderFun({}, 'tplListKind', '#navBar');
        $('.navBar_item').eq(1).addClass('navBar_item_on');
    });

});
