/**
 * Created by songtao on 16/9/7.
 */
$(function(){
  //用到变量
  var ceYanUrl = '/ceyan'; //测验的url
  var loginUrl = '/login'; //登录的URL
  var yongHuUrl = '/yonghu'; //用户的URL
  var wenJuanDiaoChaUrl = '/wenjuan_diaocha'; //问卷调查url
  var qrcodeUrl = '/make_qrcode'; //生成二维码地址的url
  var jiaoShiKeXuHaoUrl = '/jiaoshi_kexuhao'; //检查教师课序号url
  var keXuHaoCeYanUrl = '/kexuhao_ceyan'; //检查教师课序号测验url
  var ceYanChengJiUrl = '/ceyan_chengji'; //测验成绩
  var keXuHaoXueShengUrl = '/kexuhao_xuesheng'; //课序号学生
  var cnNumArr = ['一','二','三','四','五','六','七','八','九','十'];
  var ziMu =  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
    'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']; //英文字母序号数组
  var regu = /[\w!#$%&'*+/=?^_`{|}~-]+(?:\.[\w!#$%&'*+/=?^_`{|}~-]+)*@(?:[\w](?:[\w-]*[\w])?\.)+[\w](?:[\w-]*[\w])?/; //验证邮箱的正则表达式
  var testInfo = { //选中测验
    id: '',
    name: '',
    ren: '',
    stat: '',
    tag: '',
    stu: []
  };
  var quizPar = {
    jgId: '',
    uid: '',
    //wxid: 'oIdzKwDONphFuHicTvtJ0tZahlYk',
    //wxid: 'oIdzKwK2JBLPkk8xapl4_evqiuJQ', //蔡路
    wxid: '',
    yx: '',
    xm: '',
    mm: ''
  };
  var kxhData = ''; //课序号数据
  var $loadingToast = $('#loadingToast');
  var emailIsNew = true; //邮箱不存在
  var keYanChengJi = []; //测验成绩
  var kxhStus = []; //课序号学生
  var kxhStusCopy = []; //课序号学生
  var kxhCeYanObj = { //课序号测验详情参数

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

  //关闭提示框
  var dialog = function(info, title){
    var ttl = title || '错误信息';
    $('.msgBox').html(info);
    $('.msgTitle').html(ttl);
    $('#iosDialog2').show().on('click', '.weui-dialog__btn', function () {
      $('#iosDialog2').off('click').hide();
    });
  };

  //模板render函数
  var renderFun =  function(data, tplId){
    var html = template(tplId, data);
    $('#content').html(html);
  };
  var renderFunNav = function(data, tplId){
    var html = template(tplId, data);
    $('#navBar').html(html);
  };

  //测验列表的加载函数
  var testListRender = function(){
    $.ajax({
      method: 'GET',
      url: ceYanUrl,
      data: {
        '学校ID': quizPar.jgId,
        '创建人UID': quizPar.uid,
        '状态': JSON.stringify([0,1])
      },
      success: function (data) {
        data = dataMake(data);
        if(data.result){
          if(data.data && data.data.length > 0){
            var nwDt = data.data.reverse();
            renderFun({testDt: nwDt}, 'tplResultList');
            renderFunNav({}, 'tplResultListNav');
            $('.navBar_item').eq(0).addClass('navBar_item_on');
            $('.title').text('随堂测验列表');
          }
          else{
            renderFun({msg: '没有随堂测验，请登录www.zhifz.com创建测验'}, 'tplNoData');
            renderFunNav({}, 'tplResultListNav');
            $('.navBar_item').eq(0).addClass('navBar_item_on');
          }
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

  //成绩页面的加载
  var scoreListRender = function(){
    $.ajax({
      method: 'GET',
      url: jiaoShiKeXuHaoUrl,
      data: {
        'UID': quizPar.uid
      },
      success: function (data) {
        data = dataMake(data);
        if(data.result){
          if(data.data && data.data.length > 0){
            Promise.map(data.data, function(kxh, idx, lst) {
              return $.ajax({
                method: 'GET',
                url: keXuHaoCeYanUrl,
                data: {
                  '课序号ID': kxh['课序号ID']
                },
                success: function (ceyan) {
                  ceyan = dataMake(ceyan);
                  if(ceyan.result){
                    if(ceyan.data){
                      kxh['测验次数'] = ceyan.data.length || 0;
                      kxh['测验人数'] = 0;
                      Lazy(ceyan.data).each(function(cy){
                        kxh['测验人数'] += cy['答题人数'];
                        cy['更新时间'] = dateFormate(cy['更新时间']);
                      });
                      kxh['测验'] = ceyan.data;
                    }
                    else{
                      kxh['测验次数'] = 0;
                      kxh['测验人数'] = 0;
                      kxh['测验'] = [];
                    }
                  }
                  else{
                    dialog(ceyan.error);
                  }
                },
                error: function (error1) {
                  dialog(error1);
                }
              });
            }).then(function() {
              kxhData = data.data;
              renderFun({scoreDt:data.data}, 'tplKxhList');
              renderFunNav({}, 'tplResultListNav');
              $('.navBar_item').eq(1).addClass('navBar_item_on');
              $('.title').text('课序号列表');
            });
          }
          else{
            renderFun({msg: '没有课序号，请登录www.zhifz.com创建课序号'}, 'tplNoData');
            renderFunNav({}, 'tplResultListNav');
            $('.navBar_item').eq(1).addClass('navBar_item_on');
          }
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

  //登录
  var loginFun = function(){
    //quizPar.wxid = $('#myBody').data('id') || '';
    $.ajax({
      method: 'GET',
      url: loginUrl,
      data:{
        '微信ID': quizPar.wxid
      },
      success: function (data) {
        data = dataMake(data);
        if(data.result){
          quizPar.jgId = data.data['学校ID'];
          quizPar.uid = data.data['UID'];
          testListRender();
        }
        else{
          //显示注册页面
          renderFun({}, 'tplCheckUsr');
          renderFunNav({}, 'tplCheckUsrNav');
          $('.step1').show();
          $('.step2').hide();
          $('.step3').hide();
        }
      },
      error: function (error) {
        dialog(error);
      }
    });
  };

  //生成二维码弹出
  var makeErWeiMa = function(url){
    $("#QRCodeBox").html('');
    $('.erWeiMa').show().on('click', '.weui-dialog__btn', function () {
      $('.erWeiMa').off('click').hide();
    });
    new QRCode(document.getElementById("QRCodeBox"), {
      text: url,
      //typeNumber: 4,
      correctLevel: QRCode.CorrectLevel.M,
      width: 200,
      height: 200,
      background: '#ccc',
      foreground: 'red'
    });
  };

  //日期处理函数
  var dateFormate = function(dateStr){
    var mydateOld = new Date(dateStr);
    var difMinutes = mydateOld.getTimezoneOffset(); //与本地相差的分钟数
    var difMilliseconds = mydateOld.valueOf() - difMinutes * 60 * 1000; //与本地相差的毫秒数
    var mydateNew = new Date(difMilliseconds);
    var year = mydateNew.getUTCFullYear(); //根据世界时从 Date 对象返回四位数的年份
    var month = mydateNew.getUTCMonth() + 1; //根据世界时从 Date 对象返回月份 (0 ~ 11)
    var day = mydateNew.getUTCDate(); //根据世界时从 Date 对象返回月中的一天 (1 ~ 31)
    var hour = mydateNew.getUTCHours(); //根据世界时返回 Date 对象的小时 (0 ~ 23)
    var minute = mydateNew.getUTCMinutes(); //根据世界时返回 Date 对象的分钟 (0 ~ 59)
    var joinDate; //返回最终时间
    if(month < 10){
      month = '0' + month;
    }
    if(day < 10){
      day = '0' + day;
    }
    if(hour < 10){
      hour = '0' + hour;
    }
    if(minute < 10){
      minute = '0' + minute;
    }
    joinDate = year + '-' + month + '-' + day + ' ' + hour + ':' + minute;
    return joinDate;
  };

  //事件处理
  $('#container').on('click', '.navBar_item', function () { //tabbar的激活函数
    $(this).addClass('navBar_item_on').siblings('.navBar_item_on').removeClass('navBar_item_on');
  })
    .on('click', '.testResult', function(){ //查看测试结果详情
      var testId = +$(this).data('id');
      var testName = $(this).data('name');
      var testRen = $(this).data('ren');
      var testStat = $(this).data('stat');
      var testTag = $(this).data('tag');
      testInfo.id = testId;
      testInfo.name = testName;
      testInfo.ren = testRen;
      testInfo.stat = testStat;
      testInfo.tag = testTag;
      $.ajax({
        method: 'GET',
        url: wenJuanDiaoChaUrl,
        data: {
          '测验ID': testId
        },
        success: function (students) {
          students = dataMake(students);
          if(students.result){
            var obj = {
              title: testInfo.name,
              ren: testInfo.ren,
              zhn: cnNumArr,
              letterArr: ziMu,
              allPep: '',
              stat: testInfo.stat,
              tag: testInfo.tag
            };
            //整理学生答题
            var tjArr = [];
            var distByTiMuId = Lazy(students.data).groupBy('题目ID').toObject();
            Lazy(distByTiMuId).each(function(v, k, l){
              var tmObj = {
                '题目ID': k,
                '答案分析': []
              };
              var distByDaAn = Lazy(v).groupBy('答案').toObject();
              Lazy(distByDaAn).each(function(v1, k1, l1){
                var dafx = {
                  '答案': '',
                  '人数': ''
                };
                dafx['答案'] = k1;
                if(v1 && v1.length > 0){
                  dafx['人数'] = Lazy(v1).reduce(function(memo, tm){ return memo + tm['人数']; }, 0);
                }
                else{
                  dafx['人数'] = 0;
                }
                tmObj['答案分析'].push(dafx);
              });
              tjArr.push(tmObj);
            });
            //查询题目详情
            $.ajax({
              method: 'GET',
              url: ceYanUrl,
              data:{
                '测验ID': testId,
                '返回详情': true
              },
              success: function (timu) {
                timu = dataMake(timu);
                if(timu.result && timu.data && timu.data[0]['测验题目']){
                  Lazy(timu.data[0]['测验题目'][0]['题目']).each(function(item){
                    var daAnArr = [];
                    var tzLen = 0;
                    var fdTm = Lazy(tjArr).find(function(tj){
                      return tj['题目ID'] == item['题目ID'];
                    });
                    if(item['题型ID'] <= 2){
                      tzLen = item['题目内容']['选项'].length;
                    }
                    if(item['题型ID'] == 3){
                      tzLen = 2;
                    }
                    for(var i = 0; i < tzLen; i++){
                      var da = {
                        '答案': i,
                        '人数': 0
                      };
                      if(fdTm){
                        var fdDa = Lazy(fdTm['答案分析']).find(function(daxx){
                          return daxx['答案'] == i;
                        });
                        if(fdDa){
                          da['人数'] = fdDa['人数'];
                        }
                      }
                      daAnArr.push(da);
                    }
                    item['选项分析'] = daAnArr;
                  });
                  obj.allPep = timu.data[0]['参与人数'] || 1;
                  obj.tiMuArr = timu.data[0]['测验题目'];
                  Lazy(obj.tiMuArr).each(function(dt){ //计算题目正确率
                    Lazy(dt['题目']).each(function(tm){
                      var answer = tm['题型ID'] == 1 ? tm['题目内容']['答案'] : '';
                      var total = Lazy(tm['选项分析']).reduce(function(memo, num){return num['人数'] + memo}, 0) || 1;
                      var totalRight = answer >= 0 ? tm['选项分析'][answer]['人数'] : 0;
                      tm['正确率'] = ((totalRight/total) * 100).toFixed(1);
                    });
                  });
                  renderFun(obj, 'tplResult');
                  renderFunNav({}, 'tplResultNav');
                  $('.title').text('随堂测验详情');
                  MathJax.Hub.Config({
                    tex2jax: {inlineMath: [["#$", "$#"]], displayMath: [['#$$','$$#']]},
                    messageStyle: "none",
                    showMathMenu: false,
                    processEscapes: true
                  });
                  MathJax.Hub.Queue(["Typeset", MathJax.Hub, "content"]);
                  $('#content').scrollTop(0);
                  if(testInfo.stat == 0){
                    $('#testStart').show();
                    $('.testStart').show();
                    $('#testEnd').hide();
                    $('.testEnd').hide();
                  }
                  else{
                    $('#testStart').hide();
                    $('.testStart').hide();
                    $('#testEnd').show();
                    $('.testEnd').show();
                  }
                }
                else{
                  dialog(timu.error || '没有题目数据！');
                }
              },
              error: function (error) {
                dialog(error);
              }
            });
          }
          else{
            dialog(students.error || '没有学生数据！');
          }
        },
        error: function (error) {
          dialog(error);
        }
      });
    })
    .on('click', '#refresh', function(){ //刷新测验
      if ($loadingToast.css('display') != 'none') return;
      $loadingToast.fadeIn(100);
      $.ajax({
        method: 'GET',
        url: wenJuanDiaoChaUrl,
        data: {
          '测验ID': testInfo.id
        },
        success: function (students) {
          students = dataMake(students);
          if(students.result && students.data){
            var obj = {
              title: testInfo.name,
              ren: testInfo.ren,
              zhn: cnNumArr,
              letterArr: ziMu,
              allPep: '',
              stat: testInfo.stat,
              tag: testInfo.tag
            };
            //整理学生答题
            var tjArr = [];
            var distByTiMuId = Lazy(students.data).groupBy('题目ID').toObject();
            Lazy(distByTiMuId).each(function(v, k, l){
              var tmObj = {
                '题目ID': k,
                '答案分析': []
              };
              var distByDaAn = Lazy(v).groupBy('答案').toObject();
              Lazy(distByDaAn).each(function(v1, k1, l1){
                var dafx = {
                  '答案': '',
                  '人数': ''
                };
                dafx['答案'] = k1;
                if(v1 && v1.length > 0){
                  dafx['人数'] = Lazy(v1).reduce(function(memo, tm){ return memo + tm['人数']; }, 0);
                }
                else{
                  dafx['人数'] = 0;
                }
                tmObj['答案分析'].push(dafx);
              });
              tjArr.push(tmObj);
            });
            //查询题目详情
            $.ajax({
              method: 'GET',
              url: ceYanUrl,
              data:{
                '测验ID': testInfo.id,
                '返回详情': true
              },
              success: function (timu) {
                timu = dataMake(timu);
                if(timu.result && timu.data && timu.data[0]['测验题目']){
                  Lazy(timu.data[0]['测验题目'][0]['题目']).each(function(item){
                    var daAnArr = [];
                    var tzLen = 0;
                    var fdTm = Lazy(tjArr).find(function(tj){
                      return tj['题目ID'] == item['题目ID'];
                    });
                    if(item['题型ID'] <= 2){
                      tzLen = item['题目内容']['选项'].length;
                    }
                    if(item['题型ID'] == 3){
                      tzLen = 2;
                    }
                    for(var i = 0; i < tzLen; i++){
                      var da = {
                        '答案': i,
                        '人数': 0
                      };
                      if(fdTm){
                        var fdDa = Lazy(fdTm['答案分析']).find(function(daxx){
                          return daxx['答案'] == i;
                        });
                        if(fdDa){
                          da['人数'] = fdDa['人数'];
                        }
                      }
                      daAnArr.push(da);
                    }
                    item['选项分析'] = daAnArr;
                  });
                  obj.allPep = timu.data[0]['参与人数'] || 1;
                  obj.tiMuArr = timu.data[0]['测验题目'];
                  Lazy(obj.tiMuArr).each(function(dt){ //计算题目正确率
                    Lazy(dt['题目']).each(function(tm){
                      var answer = tm['题型ID'] == 1 ? tm['题目内容']['答案'] : '';
                      var total = Lazy(tm['选项分析']).reduce(function(memo, num){return num['人数'] + memo}, 0) || 1;
                      var totalRight = answer >= 0 ? tm['选项分析'][answer]['人数'] : 0;
                      tm['正确率'] = ((totalRight/total) * 100).toFixed(1);
                    });
                  });
                  renderFun(obj, 'tplResult');
                  renderFunNav({}, 'tplResultNav');
                  //$('.title').text('随堂测验详情');
                  MathJax.Hub.Config({
                    tex2jax: {inlineMath: [["#$", "$#"]], displayMath: [['#$$','$$#']]},
                    messageStyle: "none",
                    showMathMenu: false,
                    processEscapes: true
                  });
                  MathJax.Hub.Queue(["Typeset", MathJax.Hub, "content"]);
                  $('#content').scrollTop(0);
                  if(testInfo.stat == 0){
                    $('#testStart').show();
                    $('.testStart').show();
                    $('#testEnd').hide();
                    $('.testEnd').hide();
                  }
                  else{
                    $('#testStart').hide();
                    $('.testStart').hide();
                    $('#testEnd').show();
                    $('.testEnd').show();
                  }
                }
                else{
                  dialog(timu.error || '没有题目数据！');
                }
                $loadingToast.fadeOut(100);
              },
              error: function (error) {
                dialog(error);
              }
            });
          }
          else{
            dialog(students.error || '没有学生数据！');
          }
          $loadingToast.fadeOut(100);
        },
        error: function (error) {
          dialog(error);
        }
      });
    })
    .on('click', '.weui-switch', function(){ //直接在列表开关测验
      var quizStat = $(this).prop('checked') ? 1 : 0;
      var sltId = $(this).data('id');
      $.ajax({
        method: 'POST',
        url: ceYanUrl,
        data: {
          '测验ID': sltId,
          '状态': quizStat
        },
        success: function (data) {
          data = dataMake(data);
          if(data.result){
            if(quizStat == 0){
              dialog('测验已关闭！', '信息提示');
            }
            else{
              dialog('测验已打开！', '信息提示');
            }
          }
          else{
            dialog(data.error);
          }
        },
        error: function (error) {
          dialog(error);
        }
      });
    })
    .on('click', '.getTestList', function(){ //返回测验列表
      testListRender();
    })
    .on('click', '.getScoreList', function(){ //加载成绩列表
      scoreListRender();
    })
    .on('click', '.kaiGuan', function(){ //随堂测验开关，测验详情页面
      var stat = testInfo.stat == 1 ? 0 : 1;
      $.ajax({
        method: 'POST',
        url: ceYanUrl,
        data: {
          '测验ID': testInfo.id,
          '状态': stat
        },
        success: function (data) {
          data = dataMake(data);
          if(data.result){
            testInfo.stat = testInfo.stat == 1 ? 0 : 1;
            if(testInfo.stat == 0){
              $('#testStart').show();
              $('.testStart').show();
              $('#testEnd').hide();
              $('.testEnd').hide();
              dialog('测验已关闭！', '信息提示');
            }
            else{
              $('#testStart').hide();
              $('.testStart').hide();
              $('#testEnd').show();
              $('.testEnd').show();
              dialog('测验已打开！', '信息提示');
            }
          }
          else{
            dialog(data.error);
          }
        },
        error: function (error) {
          dialog(error);
        }
      });
    })
    .on('click', '.scoreResult', function(){ //点击课序号，查询测验
      var kxhName = $(this).data('name');
      var kxhId = $(this).data('id');
      var kxhTestDt = {
        title: kxhName,
        kxhId: kxhId,
        kxhTest: []
      };
      var findTar = Lazy(kxhData).find(function(kxh){
        return kxh['课序号ID'] == kxhId;
      });
      if(findTar['测验'].length){
        kxhTestDt.kxhTest = findTar;
        renderFun(kxhTestDt, 'tplKxhTestList');
        renderFunNav({}, 'tplKxhTestListNav');
        //$('.title').text('课序号下测验');
      }
      else{
        dialog('此课序号下没有测验！');
      }
    })
    .on('click', '.kxhTest', function(){ //点击课序号测验
      var kxhTestId = +$(this).data('id');
      var kxhTestName = $(this).data('name');
      var kxhName = $(this).data('kxh');
      var kxhId = $(this).data('kxhid');
      var right = $(this).data('right');
      kxhCeYanObj.kxhTestId = kxhTestId;
      kxhCeYanObj.kxhTestName = kxhTestName;
      kxhCeYanObj.kxhName = kxhName;
      kxhCeYanObj.kxhId = kxhId;
      kxhCeYanObj.right = right;
      var obj = {
        testName: kxhTestName,
        zhn: cnNumArr,
        letterArr: ziMu,
        kxhName: kxhName,
        updateDate: '',
        kxhPep: 0,
        rightLv: right,
        doneLv: '',
        undoStu: '',
        tiMuArr: ''
      };
      var tjArr = [];
      keYanChengJi = []; //测验成绩
      kxhStus = []; //课序号学生
      kxhStusCopy = []; //课序号学生
      new Promise(function(resolve, reject){
        //查询考生答题情况
        $.ajax({
          method: 'GET',
          url: wenJuanDiaoChaUrl,
          data: {
            '测验ID': kxhTestId
          },
          success: function (students) {
            students = dataMake(students);
            if(students.result && students.data){
              //整理学生答题
              var distByTiMuId = Lazy(students.data).groupBy('题目ID').toObject();
              Lazy(distByTiMuId).each(function(v, k, l){
                var tmObj = {
                  '题目ID': k,
                  '答案分析': []
                };
                var distByDaAn = Lazy(v).groupBy('答案').toObject();
                Lazy(distByDaAn).each(function(v1, k1, l1){
                  var dafx = {
                    '答案': '',
                    '人数': ''
                  };
                  dafx['答案'] = k1;
                  if(v1 && v1.length > 0){
                    dafx['人数'] = Lazy(v1).reduce(function(memo, tm){ return memo + tm['人数']; }, 0);
                  }
                  else{
                    dafx['人数'] = 0;
                  }
                  tmObj['答案分析'].push(dafx);
                });
                tjArr.push(tmObj);
                resolve();
              });
            }
            else{
              dialog(students.error || '没有学生数据！');
            }
          },
          error: function (error) {
            dialog(error);
          }
        });
      })
        .then(function(){
          //查询题目详情
          return $.ajax({
            method: 'GET',
            url: ceYanUrl,
            data:{
              '测验ID': kxhTestId,
              '返回详情': true
            },
            success: function (timu) {
              timu = dataMake(timu);
              if(timu.result && timu.data && timu.data[0]['测验题目']){
                obj.updateDate = dateFormate(timu.data[0]['修改时间']);
                Lazy(timu.data[0]['测验题目'][0]['题目']).each(function(item){
                  var daAnArr = [];
                  var tzLen = 0;
                  var fdTm = Lazy(tjArr).find(function(tj){
                    return tj['题目ID'] == item['题目ID'];
                  });
                  if(item['题型ID'] <= 2){
                    tzLen = item['题目内容']['选项'].length;
                  }
                  if(item['题型ID'] == 3){
                    tzLen = 2;
                  }
                  for(var i = 0; i < tzLen; i++){
                    var da = {
                      '答案': i,
                      '人数': 0
                    };
                    if(fdTm){
                      var fdDa = Lazy(fdTm['答案分析']).find(function(daxx){
                        return daxx['答案'] == i;
                      });
                      if(fdDa){
                        da['人数'] = fdDa['人数'];
                      }
                    }
                    daAnArr.push(da);
                  }
                  item['选项分析'] = daAnArr;
                });
                obj.allPep = timu.data[0]['参与人数'] || 1;
                obj.tiMuArr = timu.data[0]['测验题目'];
                Lazy(obj.tiMuArr).each(function(dt){ //计算题目正确率
                  Lazy(dt['题目']).each(function(tm){
                    var answer = tm['题型ID'] == 1 ? tm['题目内容']['答案'] : '';
                    var total = Lazy(tm['选项分析']).reduce(function(memo, num){return num['人数'] + memo}, 0) || 1;
                    var totalRight = answer >= 0 ? tm['选项分析'][answer]['人数'] : 0;
                    tm['正确率'] = ((totalRight/total) * 100).toFixed(1);
                  });
                });
              }
              else{
                dialog(timu.error || '没有题目数据！');
              }
            },
            error: function (error) {
              dialog(error);
            }
          });
      })
        .then(function(){
          //查询测验成绩
          return $.ajax({
            method: 'GET',
            url: ceYanChengJiUrl,
            data: {
              '测验ID': kxhTestId
            },
            success: function (students) {
              students = dataMake(students);
              if(students.result && students.data){
                keYanChengJi = students.data;
              }
              else{
                dialog(students.error || '没有学生测验成绩数据！');
              }
            },
            error: function (error) {
              dialog(error);
            }
          });
        })
        .then(function(){
          //查询测验成绩
          return $.ajax({
            method: 'GET',
            url: keXuHaoXueShengUrl,
            data: {
              '课序号ID': kxhId
            },
            success: function (kxh) {
              kxh = dataMake(kxh);
              if(kxh.result && kxh.data){
                kxhStus = kxh.data;
                kxhStusCopy = kxh.data;
                obj.kxhPep = kxh.data.length;
              }
              else{
                dialog(kxh.error || '此课序号下没有学生！');
              }
            },
            error: function (error) {
              dialog(error);
            }
          });
        })
        .then(function(){
          var wc = keYanChengJi.length;
          var kxhP = kxhStus.length || 1;
          obj.doneLv = ((wc/kxhP)*100).toFixed(1);
          Lazy(keYanChengJi).each(function(stu){
            if(stu['UID']){
              kxhStus = Lazy(kxhStus).reject(function(stud){
                return stud['UID'] == stu['UID'];
              }).toArray();
            }
          });
          obj.undoStu = kxhStus;
          renderFun(obj, 'tplKxhTestDetail');
          renderFunNav({kxhName: kxhName, kxhId: kxhId}, 'tplKxhTestDetailNav');
          MathJax.Hub.Config({
            tex2jax: {inlineMath: [["#$", "$#"]], displayMath: [['#$$','$$#']]},
            messageStyle: "none",
            showMathMenu: false,
            processEscapes: true
          });
          MathJax.Hub.Queue(["Typeset", MathJax.Hub, "content"]);
          $('#content').scrollTop(0);
        })
        .catch(function(err){
          dialog(err);
        });
    })
    .on('click', '.testName', function(){ //生成二维码详情
      $.ajax({
        method: 'GET',
        url: qrcodeUrl,
        data: {
          '测验ID': testInfo.id
        },
        success: function (data) {
          data = dataMake(data);
          if(data.result && data.data){
            //var textStr = testUrl + data.data['测验ID'];
            var textStr = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxabcb783dbd59b065&redirect_uri=' +
              'https://www.zhifz.com/get_code?usrTp=tec_quiz_' + data.data['标签'] + '_' + data.data['学校ID'] + '&response_type=' +
              'code&scope=snsapi_base&state=STATE#wechat_redirect';
            makeErWeiMa(textStr);
          }
          else{
            dialog(data.error);
          }
        },
        error: function (error) {
          dialog(error);
        }
      });
    })
    .on('click', '#pswShow', function(){ //查看密码
      $('input[name="techPsw"]').prop('type', 'text');
      $('#pswShow').hide();
      $('#pswHide').show();
    })
    .on('click', '#pswHide', function(){ //隐藏密码
      $('input[name="techPsw"]').prop('type', 'password');
      $('#pswShow').show();
      $('#pswHide').hide();
    })
    .on('click', '#nextStep', function(){
      var yx = $('input[name="techEmail"]').val();
      var mis = [];
      if(!yx){
        mis.push('邮箱不能为空');
      }
      if(!yx.match(regu)){
        mis.push('邮箱格式不正确');
      }
      if(mis && mis.length > 0){
        dialog(mis.join('；'));
        return ;
      }
      quizPar.yx = yx;
      $.ajax({
        method: 'GET',
        url: yongHuUrl,
        data:{
          '邮箱': yx
        },
        success: function (data) {
          data = dataMake(data);
          if(data.result && data.data){
            if(data.data[0]['微信ID']){
              dialog('您的账号已经绑定其他微信用户，请联系客服人员处理');
            }
            else{
              $('.step1').hide();
              $('.step2').show();
              $('.step3').hide();
              $('.mima').show();
              quizPar.jgId = data.data[0]['学校ID'];
              quizPar.uid = data.data[0]['UID'];
            }
          }
          else{
            $('.step1').hide();
            $('.step2').hide();
            $('.step3').show();
            $('.mima').show();
            $('.xingming').show();
          }
        },
        error: function (error) {
          dialog(error);
        }
      });
    })
    .on('click', '#nextStep1', function(){ //教师关联微信ID，用户已注册
      var mm = $('input[name="techPsw"]').val();
      var yx = $('input[name="techEmail"]').val();
      var mis = [];
      if(!yx){
        mis.push('邮箱不能为空');
      }
      if(!yx.match(regu)){
        mis.push('邮箱格式不正确');
      }
      if(!mm){
        mis.push('密码不能为空');
      }
      if(mis && mis.length > 0){
        dialog(mis.join('；'));
        return ;
      }
      quizPar.mm = mm;
      quizPar.yx = yx;
      //教师用邮箱和密码登录
      $.ajax({
        method: 'GET',
        url: loginUrl,
        data:{
          '邮箱': yx,
          '密码': mm
        },
        success: function (data1) {
          data1 = dataMake(data1);
          if(data1.result && data1.data){
            quizPar.uid = data1.data['UID'];
            quizPar.jgId = data1.data['学校ID'];
            //去关联微信的openid
            $.ajax({
              method: 'POST',
              url: yongHuUrl,
              data:{
                'UID': data1.data['UID'],
                '微信ID': quizPar.wxid
              },
              success: function(data2){
                data2 = dataMake(data2);
                if(data2.result){
                  testListRender();
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
    })
    .on('click', '#nextStep2', function(){ //教师关联微信ID，用户未注册，注册到测试大学
      var yx = $('input[name="techEmail"]').val(); //邮箱
      var xm = $('input[name="techName"]').val(); //姓名
      var mm = $('input[name="techPsw"]').val(); //密码
      var mis = [];
      if(!yx){
        mis.push('邮箱不能为空');
      }
      if(!yx.match(regu)){
        mis.push('邮箱格式不正确');
      }
      if(!emailIsNew){
        mis.push('邮箱已存在');
      }
      if(!xm){
        mis.push('姓名不能为空');
      }
      if(!mm){
        mis.push('密码不能为空');
      }
      if(mis && mis.length > 0){
        dialog(mis.join('；'));
        return ;
      }
      quizPar.mm = mm;
      quizPar.yx = yx;
      quizPar.xm = xm;
      var regTeacherInfo = { //教师注册信息
        '邮箱': yx,
        '姓名': xm,
        '学校ID': 1033,
        '密码': mm,
        '用户类别': 1,
        '微信ID': quizPar.wxid,
        '角色': [{
          '学校ID': 1033,
          '科目ID': 1001,
          '角色ID': 3,
          '领域ID': 1000
        }]
      };
      regTeacherInfo['角色'] = JSON.stringify(regTeacherInfo['角色']);
      $.ajax({
        method: 'PUT',
        url: yongHuUrl,
        data: regTeacherInfo,
        success: function (data) {
          data = dataMake(data);
          if(data.result && data.data){
            loginFun();
          }
          else{
            dialog(data.error);
          }
        },
        error: function (error) {
          dialog(error);
        }
      });
    })
    .on('click', '.getStuScore', function(){ //查看课序号测验学生成绩
      Lazy(keYanChengJi).each(function(kxhcj){
        if(kxhcj['UID']){
          Lazy(kxhStusCopy).each(function(kxh){
            if(kxh['UID'] == kxhcj['UID']){
              kxh['答对数'] = kxhcj['答对数'];
              kxh['答题数'] = kxhcj['答题数'];
              kxh['题目数'] = kxhcj['题目数'];
            }
          });
        }
      });
      renderFun({stuDt: kxhStusCopy}, 'tplKxhTestStu');
      renderFunNav(kxhCeYanObj, 'tplKxhTestStuNav');
    });

  //初始化函数执行
  loginFun();

  /**
   * <------ 检测浏览器退出 ------>
   */
  window.onbeforeunload = function(){

  };
});
