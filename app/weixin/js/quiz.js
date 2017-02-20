/**
 * Created by songtao on 16/9/7.
 */
$(function(){
  //用到变量
  var ceYanUrl = '/ceyan'; //测验的url
  var loginUrl = '/login'; //登录的URL
  var yongHuUrl = '/yonghu'; //用户的URL
  var yongHuDaTi = '/yonghu_dati'; //用户答题
  var qrcodeUrl = '/make_qrcode'; //生成二维码地址的url
  var jiaoShiKeXuHaoUrl = '/jiaoshi_kexuhao'; //检查教师课序号url
  var ceYanChengJiUrl = '/ceyan_chengji'; //测验成绩
  var keXuHaoXueShengUrl = '/kexuhao_xuesheng'; //课序号学生
  var xueXiaoUrl = '/xuexiao'; //学校
  var cnNumArr = ['一','二','三','四','五','六','七','八','九','十'];
  var ziMu =  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
    'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']; //英文字母序号数组
  var regu = /[\w!#$%&'*+/=?^_`{|}~-]+(?:\.[\w!#$%&'*+/=?^_`{|}~-]+)*@(?:[\w](?:[\w-]*[\w])?\.)+[\w](?:[\w-]*[\w])?/; //验证邮箱的正则表达式
  var testInfo = { //选中测验
    id: '',
    name: '',
    tiMuNum: 0,
    stat: '',
    tag: ''
  };
  var banJiInfo = { //选中的课序号或者班级信息
      id: '',
      name: ''
  };
  var quizPar = {
    jgId: '',
    uid: '',
    // wxid: 'oIdzKwDONphFuHicTvtJ0tZahlYk',
    // wxid: 'oIdzKwK2JBLPkk8xapl4_evqiuJQ', //蔡路
    //wxid: 'oA5Yrw9aYHyZhFfg1zSMK1fMorPE', //蔡路学生
    // wxid: 'oIdzKwDWQg7zE54xwuw8elI-KJDA', //贾陆军
    wxid: '',
    yx: '',
    xm: '',
    mm: ''
  };
  var kxhData = []; //教师课序号数据
  var allStudents = []; //所有课序号下学生数据
  var classData = []; //分组后的班级信息
  var $loadingToast = $('#loadingToast');
  var emailIsNew = true; //邮箱不存在
  var ceYanChengJi = []; //测验成绩
  var kxhStus = []; //课序号学生
  var kxhStusCopy = []; //课序号学生
  var tiMuZuoDa = []; //本次测验的题目作答情况
  var analysisData = {
      testName: '', //测验名称
      testStatus: '', //测验状态
      testDonePct: 0, //测验完成率
      testRightPct: 0, //测验正确率
      testTiMu: [], //测验题目
      className: '所有学生', //统计的维度班级或者课序号
      peopleNum: 0, //参与人数
      peopleList: [], //参与人名单
      peopleUndoList: [], //未完成人名单
      letter: ziMu, //选择字母
      zhn: cnNumArr //中文数字
  };
  var comeFrom = ''; //统计分析详情页来自哪里

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

  //对日期进行格式化
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
  //日期处理函数
  var dateFormate = function(dateStr, bl){
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
    if(bl){
        joinDate = year + '-' + month + '-' + '01' + ' ' + '00' + ':' + '00';
    }
    else{
        joinDate = year + '-' + month;
    }
    return joinDate;
  };

  //模板render函数
  var renderFun =  function(data, tplId, container){
    template.config('escape', false);
    var html = template(tplId, data);
    $(container).html(html);
  };

  //测验列表的加载函数
  var testListRender = function(more){
    var paramObj = {
        '学校ID': quizPar.jgId,
        '创建人UID': quizPar.uid,
        '状态': JSON.stringify([0,1,2])
    };
    if(!more) {
        var nwDate = new Date();
        paramObj['创建时间起始'] = dateFormate(nwDate, true);
    }
    $.ajax({
      method: 'GET',
      url: ceYanUrl,
      data: paramObj,
      success: function (data) {
        data = dataMake(data);
        if(data.result){
          $('#container').addClass('navBarHide');
          if(data.data && data.data.length > 0){
            Lazy(data.data).each(function (ct) {
                ct['日期分类'] = dateFormate(ct['创建时间'], false);
            });
            data.data = Lazy(data.data).sortBy('测验ID').reverse().toArray();
            var distDt = Lazy(data.data).groupBy('日期分类').toObject();
            var newTestArr = [];
            Lazy(distDt).each(function (v, k, l) {
                var ntObj = {
                    '日期': k,
                    '测验': v
                };
                newTestArr.push(ntObj);
            });
            renderFun({testDt: newTestArr}, 'tplResultList', '#content');
            if(more) {
              $('.mctWrap').hide();
            }
            else {
              $('.mctWrap').show();
            }
          }
          else{
            if(more){
                renderFun({msg: '没有随堂测验，请登录www.zhifz.com创建测验'}, 'tplNoData', '#content');
            }
            else{
                testListRender(true);
            }
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
    quizPar.wxid = $('#myBody').data('id') || '';
    if(quizPar.wxid){
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
                    var xuexiao = '';
                    var xingming = data.data['姓名'] || '无姓名';
                    $.ajax({
                        method: 'GET',
                        url: xueXiaoUrl,
                        data: {
                            '学校ID': quizPar.jgId
                        },
                        success: function (jigou) {
                            jigou = dataMake(jigou);
                            if(jigou.result){
                                if(jigou.data && jigou.data.length > 0){
                                    xuexiao = jigou.data[0]['学校名称'];
                                }
                                else{
                                    xuexiao = '学校名称不存在';
                                }
                                renderFun({xuexiao: xuexiao, xingming: xingming}, 'tplUsr', '#topBar');
                                testListRender();
                            }
                            else{
                                dialog(jigou.error);
                            }
                        },
                        error: function (error) {
                            dialog(error);
                        }
                    });
                }
                else{
                    //显示注册页面
                    renderFun({}, 'tplCheckUsr', '#content');
                    renderFun({}, 'tplCheckUsrNav', '#navBar');
                    $('.step1').show();
                    $('.step2').hide();
                    $('.step3').hide();
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

  //查询测验的函数，从测验列表点击进入
  var analysisFun = function (status) {
      analysisData.className = '所有学生';
      analysisData.testDonePct = 0;
      analysisData.testRightPct = 0;
      analysisData.peopleUndoList = [];
      analysisData.testName = testInfo.name;
      analysisData.testStatus = testInfo.stat;
      var tjArr = [];
      tiMuZuoDa = [];
      new Promise(function(resolve, reject){
          $.ajax({ //查询测验
              method: 'GET',
              url: ceYanUrl,
              data: {
                  '测验ID': testInfo.id,
                  '当前批次': false
              },
              success: function (data) {
                  data = dataMake(data);
                  if(data.result){
                      if(data.data && data.data.length > 0){
                          testInfo.tiMuNum = 0;
                          analysisData.peopleNum = data.data[0]['参与人数'] || 0;
                          analysisData.testStatus = data.data[0]['状态'];
                          Lazy(data.data[0]['测验设置']['组卷规则']).each(function(dt){
                              testInfo.tiMuNum += dt['固定题目'].length || 0;
                          });
                          resolve();
                      }
                      else{
                          dialog('没有测验数据！');
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
      .then(function(){ //查询答题人数
          return $.ajax({
              method: 'GET',
              url: yongHuDaTi,
              data: {
                  '测验ID': testInfo.id
              },
              success: function (students) {
                  students = dataMake(students);
                  if(students.result){
                      //整理学生答题
                      var distByTiMuId = Lazy(students.data).groupBy('题目ID').toObject();
                      Lazy(distByTiMuId).each(function(v, k, l){
                          var tmObj = {
                              '题目ID': +k,
                              '答案分析': []
                          };
                          var distByDaAn = Lazy(v).groupBy('答案').toObject();
                          Lazy(distByDaAn).each(function(v1, k1, l1){
                              var dafx = {
                                  '答案': '',
                                  '人数': ''
                              };
                              dafx['答案'] = k1;
                              dafx['人数'] = v1.length ? v1.length : 0;
                              tmObj['答案分析'].push(dafx);
                          });
                          tjArr.push(tmObj);
                      });
                      tiMuZuoDa = tjArr;
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
      .then(function(){ //查询参加本次测验的学生成绩
          ceYanChengJi = [];
          var stuDts = 0; //学生答题数
          var stuDds = 0; //学生答对数
          return $.ajax({
              method: 'GET',
              url: ceYanChengJiUrl,
              data: {
                  '测验ID': testInfo.id
              },
              success: function (students) {
                  students = dataMake(students);
                  if(students.result && students.data){
                      ceYanChengJi = Lazy(students.data).sortBy('答对数').toArray().reverse();
                      Lazy(ceYanChengJi).each(function(stu){
                          //处理本测验的正确率
                          stuDts += stu['答题数'];
                          stuDds += stu['答对数'];
                      });
                      stuDts = stuDts || 1;
                      analysisData.testRightPct = ((stuDds/stuDts)*100).toFixed(1);
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
      .then(function(){ //查询题目详情
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
                      Lazy(timu.data[0]['测验题目']).each(function(dt){
                          Lazy(dt['题目']).each(function(item){
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
                      });
                      analysisData.peopleNum = timu.data[0]['参与人数'] || 1;
                      analysisData.testTiMu = timu.data[0]['测验题目'];
                      Lazy(analysisData.testTiMu).each(function(dt){ //计算题目正确率
                          Lazy(dt['题目']).each(function(tm){
                              var totalRight = 0;
                              var newXx = [];
                              var txId = tm['题型ID'];
                              var answer = tm['题目内容']['答案'];
                              var total = Lazy(tm['选项分析']).reduce(function(memo, num){return num['人数'] + memo}, 0) || 1;
                              if(txId == 1){
                                  totalRight = answer >= 0 ? tm['选项分析'][answer]['人数'] : 0;
                              }
                              if(txId == 2){
                                  Lazy(answer).each(function (as) {
                                      totalRight += as >= 0 ? tm['选项分析'][as]['人数'] : 0;
                                  });
                              }
                              tm['正确率'] = ((totalRight/total) * 100).toFixed(1);
                              Lazy(tm['题目内容']['选项']).each(function(xx, idx, lst){
                                  var nxx = {
                                      '题支': xx,
                                      ckd: false
                                  };
                                  if(txId == 1){
                                      if(idx == tm['题目内容']['答案']){
                                          nxx.ckd = true;
                                      }
                                  }
                                  if(txId == 2){
                                      nxx.ckd = Lazy(tm['题目内容']['答案']).contains(idx);
                                  }
                                  newXx.push(nxx);
                              });
                              if(newXx && newXx.length > 0){
                                  tm['题目内容']['选项'] = newXx;
                              }
                          });
                      });
                      if(comeFrom = 'list'){
                          analysisData.testDonePct = '--';
                      }
                      $('#container').removeClass('navBarHide');
                      renderFun(analysisData, 'tplAnalysis', '#content');
                      renderFun({}, 'tplResultNav', '#navBar');
                      $('.title').text('随堂测验详情');
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
                      dialog(timu.error || '没有题目数据！');
                  }
                  if(status == 'refresh'){
                      $loadingToast.fadeOut(100);
                  }
              },
              error: function (error) {
                  dialog(error);
              }
          });
      });
  };

  //点击课序号时执行的函数
  var kxhFun = function (kId, kName, status) {
      var kxhId = +kId;
      var kxhName = kName;
      var tjArr = [];
      var uids = []; //存放所选学生的UID
      ceYanChengJi = []; //测验成绩
      kxhStus = []; //课序号学生
      kxhStusCopy = []; //课序号学生
      analysisData.className = kxhName;
      comeFrom = 'kxh';
      new Promise(function(resolve, reject){
          //查询测验成绩
          var cxcycjObj = {
              '测验ID': testInfo.id
          };
          if(kxhId != -1){
              cxcycjObj['课序号ID'] = kxhId;
          }
          $.ajax({
              method: 'GET',
              url: ceYanChengJiUrl,
              data: cxcycjObj,
              success: function (students) {
                  students = dataMake(students);
                  if(students.result && students.data){
                      ceYanChengJi = Lazy(students.data).sortBy('答对数').toArray().reverse();;
                  }
                  else{
                      dialog(students.error || '没有学生测验成绩数据！');
                  }
                  resolve();
              },
              error: function (error) {
                  dialog(error);
              }
          });
      })
      .then(function(){ //查询课序号考生
          var getUidFun = function(dt){ //整理传入的学生数据的UID
              Lazy(dt).each(function (stu) {
                  if(stu['UID']){
                      uids.push(stu['UID']);
                  }
              });
          };
          if(kxhId == -1){
              getUidFun(ceYanChengJi);
              return analysisData.peopleNum = ceYanChengJi.length;
          }
          else{
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
                          analysisData.peopleNum = kxh.data.length;
                          getUidFun(kxh.data);
                      }
                      else{
                          dialog(kxh.error || '此课序号下没有学生！');
                      }
                  },
                  error: function (error) {
                      dialog(error);
                  }
              });
          }
      })
      .then(function(){ //处理测验的数据
          var kxhP = kxhStus.length || 1;
          var stuDts = 0; //学生答题数
          var stuDds = 0; //学生答对数
          var stuTms = 0; //题目总数
          if(kxhId == -1){
              analysisData.testDonePct = -1;
              Lazy(ceYanChengJi).each(function(stu){
                  //处理本测验的正确率
                  stuDts += stu['答题数'];
                  stuDds += stu['答对数'];
              });
              analysisData.peopleUndoList = [];
          }
          else{
              Lazy(ceYanChengJi).each(function(stu){
                  if(stu['UID']){
                      //处理未答题人数
                      kxhStus = Lazy(kxhStus).reject(function(stud){
                          return stud['UID'] == stu['UID'];
                      }).toArray();
                      //处理本测验的正确率
                      stuDts += stu['答题数'];
                      stuDds += stu['答对数'];
                      stuTms += stu['题目数'];
                  }
              });
              analysisData.peopleUndoList = kxhStus;
              stuTms = kxhP * testInfo.tiMuNum || 1;
              analysisData.testDonePct = ((stuDts/stuTms)*100).toFixed(1);
          }
          stuDts = stuDts || 1;
          analysisData.testRightPct = ((stuDds/stuDts)*100).toFixed(1);

      })
      .then(function () { //查询考生答题情况
          return $.ajax({
              method: 'GET',
              url: yongHuDaTi,
              data: {
                  '测验ID': testInfo.id,
                  'UID': JSON.stringify(uids)
              },
              success: function (students) {
                  students = dataMake(students);
                  if(students.result){
                      //整理学生答题
                      var distByTiMuId = Lazy(students.data).groupBy('题目ID').toObject();
                      Lazy(distByTiMuId).each(function(v, k, l){
                          var tmObj = {
                              '题目ID': +k,
                              '答案分析': []
                          };
                          var distByDaAn = Lazy(v).groupBy('答案').toObject();
                          Lazy(distByDaAn).each(function(v1, k1, l1){
                              var dafx = {
                                  '答案': '',
                                  '人数': ''
                              };
                              dafx['答案'] = k1;
                              dafx['人数'] = v1.length ? v1.length : 0;
                              tmObj['答案分析'].push(dafx);
                          });
                          tjArr.push(tmObj);
                      });
                      tiMuZuoDa = tjArr;
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
      .then(function(){ //查询题目详情
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
                      Lazy(timu.data[0]['测验题目']).each(function(dt){
                          Lazy(dt['题目']).each(function(item){
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
                      });
                      analysisData.testTiMu = timu.data[0]['测验题目'];
                      Lazy(analysisData.testTiMu).each(function(dt){ //计算题目正确率
                          Lazy(dt['题目']).each(function(tm){
                              var totalRight = 0;
                              var newXx = [];
                              var txId = tm['题型ID'];
                              var answer = tm['题目内容']['答案'];
                              var total = Lazy(tm['选项分析']).reduce(function(memo, num){return num['人数'] + memo}, 0) || 1;
                              if(txId == 1){
                                  totalRight = answer >= 0 ? tm['选项分析'][answer]['人数'] : 0;
                              }
                              if(txId == 2){
                                  Lazy(answer).each(function (as) {
                                      totalRight += as >= 0 ? tm['选项分析'][as]['人数'] : 0;
                                  });
                              }
                              tm['正确率'] = ((totalRight/total) * 100).toFixed(1);
                              Lazy(tm['题目内容']['选项']).each(function(xx, idx, lst){
                                  var nxx = {
                                      '题支': xx,
                                      ckd: false
                                  };
                                  if(txId == 1){
                                      if(idx == tm['题目内容']['答案']){
                                          nxx.ckd = true;
                                      }
                                  }
                                  if(txId == 2){
                                      nxx.ckd = Lazy(tm['题目内容']['答案']).contains(idx);
                                  }
                                  newXx.push(nxx);
                              });
                              if(newXx && newXx.length > 0){
                                  tm['题目内容']['选项'] = newXx;
                              }
                          });
                      });
                      //数据展示页码
                      renderFun(analysisData, 'tplAnalysis', '#content');
                      renderFun({}, 'tplFromCLassNav', '#navBar');
                      var undoNameListHeight = $('.undoNameList').height();
                      if(undoNameListHeight >= 30){
                          $('.unDoMore').show();
                          $('.unDoClose').hide();
                          $('.undoNameList').css({height: '30px'});
                      }
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
                      dialog(timu.error || '没有题目数据！');
                  }
                  if(status == 'refresh'){
                      $loadingToast.fadeOut(100);
                  }
              },
              error: function (error) {
                  dialog(error);
              }
          });
      })
      .catch(function(err){
          dialog(err);
      });
  };

  //点击班级时执行的函数
  var bjFun = function (cId, cName, status) {
      var bjId = +cId;
      var bjName = cName;
      var tjArr = [];
      var uids = []; //存放所选学生的UID
      ceYanChengJi = []; //测验成绩
      kxhStus = []; //班级学生
      kxhStusCopy = []; //班级学生COPY
      analysisData.className = bjName;
      comeFrom = 'bj';
      var findBj = Lazy(classData).find(function(bj){
          return bj['班级ID'] == bjId;
      });
      if(!findBj){
          dialog('没有此班级数据！');
          return ;
      }
      analysisData.peopleNum = findBj['学生'].length;
      kxhStus =findBj['学生'];
      kxhStusCopy = findBj['学生'];
      Lazy(kxhStus).each(function (stu) {
          if(stu['UID']){
              uids.push(stu['UID']);
          }
      });
      new Promise(function(resolve, reject){
          //查询考生答题情况
          $.ajax({
              method: 'GET',
              url: yongHuDaTi,
              data: {
                  '测验ID': testInfo.id,
                  'UID': JSON.stringify(uids)
              },
              success: function (students) {
                  students = dataMake(students);
                  if(students.result){
                      //整理学生答题
                      var distByTiMuId = Lazy(students.data).groupBy('题目ID').toObject();
                      Lazy(distByTiMuId).each(function(v, k, l){
                          var tmObj = {
                              '题目ID': +k,
                              '答案分析': []
                          };
                          var distByDaAn = Lazy(v).groupBy('答案').toObject();
                          Lazy(distByDaAn).each(function(v1, k1, l1){
                              var dafx = {
                                  '答案': '',
                                  '人数': ''
                              };
                              dafx['答案'] = k1;
                              dafx['人数'] = v1.length ? v1.length : 0;
                              tmObj['答案分析'].push(dafx);
                          });
                          tjArr.push(tmObj);
                      });
                      tiMuZuoDa = tjArr;
                      resolve();
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
                  '测验ID': testInfo.id,
                  '返回详情': true
              },
              success: function (timu) {
                  timu = dataMake(timu);
                  if(timu.result && timu.data && timu.data[0]['测验题目']){
                      Lazy(timu.data[0]['测验题目']).each(function(dt){
                          Lazy(dt['题目']).each(function(item){
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
                      });
                      analysisData.testTiMu = timu.data[0]['测验题目'];
                      Lazy(analysisData.testTiMu).each(function(dt){ //计算题目正确率
                          Lazy(dt['题目']).each(function(tm){
                              var totalRight = 0;
                              var newXx = [];
                              var txId = tm['题型ID'];
                              var answer = tm['题目内容']['答案'];
                              var total = Lazy(tm['选项分析']).reduce(function(memo, num){return num['人数'] + memo}, 0) || 1;
                              if(txId == 1){
                                  totalRight = answer >= 0 ? tm['选项分析'][answer]['人数'] : 0;
                              }
                              if(txId == 2){
                                  Lazy(answer).each(function (as) {
                                      totalRight += as >= 0 ? tm['选项分析'][as]['人数'] : 0;
                                  });
                              }
                              tm['正确率'] = ((totalRight/total) * 100).toFixed(1);
                              Lazy(tm['题目内容']['选项']).each(function(xx, idx, lst){
                                  var nxx = {
                                      '题支': xx,
                                      ckd: false
                                  };
                                  if(txId == 1){
                                      if(idx == tm['题目内容']['答案']){
                                          nxx.ckd = true;
                                      }
                                  }
                                  if(txId == 2){
                                      nxx.ckd = Lazy(tm['题目内容']['答案']).contains(idx);
                                  }
                                  newXx.push(nxx);
                              });
                              if(newXx && newXx.length > 0){
                                  tm['题目内容']['选项'] = newXx;
                              }
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
      .then(function(){ //查询测验成绩
          var cxcycjObj = {
              '测验ID': testInfo.id
          };
          return $.ajax({
              method: 'GET',
              url: ceYanChengJiUrl,
              data: cxcycjObj,
              success: function (students) {
                  students = dataMake(students);
                  if(students.result && students.data){
                      ceYanChengJi = Lazy(students.data).sortBy('答对数').toArray().reverse();;
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
      .then(function(){ //测验数据整理
          var kxhP = kxhStus.length || 1;
          var stuDts = 0; //学生答题数
          var stuDds = 0; //学生答对数
          var stuTms = 0; //题目总数
          Lazy(ceYanChengJi).each(function(stu){
              if(stu['UID']){
                  //处理未答题人数
                  kxhStus = Lazy(kxhStus).reject(function(stud){
                      return stud['UID'] == stu['UID'];
                  }).toArray();
                  //处理本测验的正确率
                  stuDts += stu['答题数'];
                  stuDds += stu['答对数'];
                  stuTms += stu['题目数'];
              }
          });
          analysisData.peopleUndoList = kxhStus;
          stuTms = kxhP * testInfo.tiMuNum || 1;
          analysisData.testDonePct = ((stuDts/stuTms)*100).toFixed(1);
          stuDts = stuDts || 1;
          analysisData.testRightPct = ((stuDds/stuDts)*100).toFixed(1);
          renderFun(analysisData, 'tplAnalysis', '#content');
          renderFun({}, 'tplFromCLassNav', '#navBar');
          var undoNameListHeight = $('.undoNameList').height();
          if(undoNameListHeight >= 30){
              $('.unDoMore').show();
              $('.unDoClose').hide();
              $('.undoNameList').css({height: '30px'});
          }
          MathJax.Hub.Config({
              tex2jax: {inlineMath: [["#$", "$#"]], displayMath: [['#$$','$$#']]},
              messageStyle: "none",
              showMathMenu: false,
              processEscapes: true
          });
          MathJax.Hub.Queue(["Typeset", MathJax.Hub, "content"]);
          $('#content').scrollTop(0);
          if(status == 'refresh'){
              $loadingToast.fadeOut(100);
          }
      })
      .catch(function(err){
          dialog(err);
      });
  };

  //事件处理
  $('#container').on('click', '.navBar_item', function () { //tabbar的激活函数
    $(this).addClass('navBar_item_on').siblings('.navBar_item_on').removeClass('navBar_item_on');
  })
    .on('click', '.testResult', function(){ //查看测试结果详情
      var testId = +$(this).data('id');
      var testName = $(this).data('name');
      var testStat = $(this).data('stat');
      var testTag = $(this).data('tag');
      testInfo.id = testId;
      testInfo.name = testName;
      testInfo.stat = testStat;
      testInfo.tag = testTag;
      comeFrom = 'list';
      if(testStat == 2){
          dialog('测验题目正在录入中，请耐心等待！')
      }
      else{
          analysisFun();
      }

    })
    .on('click', '.refresh', function(){ //刷新测验
      if ($loadingToast.css('display') != 'none') return;
      $loadingToast.fadeIn(100);
      if(comeFrom == 'kxh'){
          kxhFun(banJiInfo.id, banJiInfo.name, 'refresh');
      }
      else if(comeFrom == 'bj'){
          bjFun(banJiInfo.id, banJiInfo.name, 'refresh');
      }
      else{
          analysisFun('refresh');
      }
    })
    .on('click', '.weui-switch', function(){ //直接在列表开关测验
      var quizStat = $(this).prop('checked') ? 1 : 0;
      var sltId = $(this).data('id');
      var dtObj = {
        '测验ID': sltId,
        '状态': quizStat
      };
      if(quizStat == 1){
        dtObj['更新批次'] = true;
      }
      $.ajax({
        method: 'POST',
        url: ceYanUrl,
        data: dtObj,
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
    .on('click', '.getClassList', function(){ //加载课序号和班级列表
        var kxhIds = [];
        var noKxh = {
            '学期': '',
            '年度': '',
            '课序号ID': -1,
            '课序号名称': '无课序号'
        };
        comeFrom = '';
        new Promise(function(resolve, reject){
            if(kxhData && kxhData.length > 0){
                resolve();
            }
            else{
                $.ajax({
                    method: 'GET',
                    url: jiaoShiKeXuHaoUrl,
                    data: {
                        'UID': quizPar.uid
                    },
                    success: function (data) {
                        data = dataMake(data);
                        if(data.result){
                            data.data = data.data ? data.data : [];
                            data.data.push(noKxh);
                            kxhData = data.data;
                        }
                        else{
                            dialog(data.error);
                        }
                        resolve();
                    },
                    error: function (error) {
                        dialog(error);
                    }
                });
            }
        })
        .then(function(){ //查询所有课序号下面的学生
            if(allStudents && allStudents.length > 0){
                return allStudents;
            }
            else{
                if(kxhData && kxhData.length > 1){
                    Lazy(kxhData).each(function (kxh) {
                        if(kxh['课序号ID'] > 0){
                            kxhIds.push(+kxh['课序号ID']);
                        }
                    });
                }
                if(kxhIds && kxhIds.length > 0){
                    return $.ajax({
                        method: 'GET',
                        url: keXuHaoXueShengUrl,
                        data:{
                            '课序号ID': JSON.stringify(kxhIds)
                        },
                        success: function (students) {
                            students = dataMake(students);
                            if(students.result && students.data.length > 0){
                                allStudents = students.data;
                            }
                            else{
                                dialog(students.error || '没有学生数据！');
                            }
                        },
                        error: function (error) {
                            dialog(error);
                        }
                    });
                }
                else{
                    return allStudents;
                }
            }
        })
        .then(function () { //由查出的学生进行班级分组
            var bjKxhObj = {
                kxhDt: kxhData,
                classDt: []
            };
            if(allStudents && allStudents.length > 0){
                var distByBjId = Lazy(allStudents).groupBy('班级ID').toObject(); //学生安装班级ID分组
                Lazy(distByBjId).each(function (v, k, l) {
                    var bjObj = {
                      '班级ID': '',
                      '班级名称': '',
                      '学生': v
                    };
                    if(k != 'null'){
                        bjObj['班级ID'] = +k;
                        bjObj['班级名称'] = v[0]['班级名称'];
                    }
                    else{
                        bjObj['班级ID'] = -1;
                        bjObj['班级名称'] = '无班级';
                    }
                    bjKxhObj.classDt.push(bjObj);
                });
                classData =  bjKxhObj.classDt;
            }
            renderFun(bjKxhObj, 'tplClass', '#content');
            renderFun({}, 'tplStuScoreNav', '#navBar');
        });
    })
    .on('click', '.teacherKxh', function(){ //点击课序号查看统计
        var kxhId = +$(this).data('id');
        var kxhName = $(this).data('name');
        banJiInfo.id = kxhId;
        banJiInfo.name = kxhName;
        kxhFun(kxhId, kxhName);
    })
    .on('click', '.teacherBanJi', function(){ //点击班级查看统计
        var bjId = +$(this).data('id');
        var bjName = $(this).data('name');
        banJiInfo.id = bjId;
        banJiInfo.name = bjName;
        bjFun(bjId, bjName);
    })
    .on('click', '.backToAnalysis' ,function () { //返回和查看全部测验统计详情页面
      if(comeFrom == 'kxh' || comeFrom == 'bj'){
          renderFun(analysisData, 'tplAnalysis', '#content');
          renderFun({}, 'tplFromCLassNav', '#navBar');
          var undoNameListHeight = $('.undoNameList').height();
          if(undoNameListHeight >= 30){
              $('.unDoMore').show();
              $('.unDoClose').hide();
              $('.undoNameList').css({height: '30px'});
          }
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
          analysisFun();
      }
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
            var xuexiao = '';
            var xingming = data1.data['姓名'] || '无姓名';
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
                  $.ajax({
                    method: 'GET',
                    url: xueXiaoUrl,
                    data: {
                      '学校ID': quizPar.jgId
                    },
                    success: function (jigou) {
                      jigou = dataMake(jigou);
                      if(jigou.result){
                        if(jigou.data && jigou.data.length > 0){
                          xuexiao = jigou.data[0]['学校名称'];
                        }
                        else{
                          xuexiao = '学校名称不存在';
                        }
                        renderFun({xuexiao: xuexiao, xingming: xingming}, 'tplUsr', '#topBar');
                      }
                      else{
                        dialog(jigou.error);
                      }
                    },
                    error: function (error) {
                      dialog(error);
                    }
                  });
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
      var wcl = +$(this).data('wcl');
      var stuScoreList = [];
      if(wcl == -1){
          stuScoreList = Lazy(ceYanChengJi).sortBy('答对数').toArray().reverse();
      }
      else{
        if(comeFrom == 'kxh' || comeFrom == 'bj'){
            Lazy(ceYanChengJi).each(function(kxhcj){
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
            Lazy(kxhStusCopy).each(function (stu) {
                stu['答对数'] = stu['答对数'] || 0;
            });
            stuScoreList = Lazy(kxhStusCopy).sortBy('答对数').toArray().reverse();
        }
        else{
            stuScoreList = ceYanChengJi;
        }
      }
      renderFun({stuDt: stuScoreList}, 'tplStuScore', '#content');
      renderFun({}, 'tplStuScoreNav', '#navBar');
    })
    .on('click', '.unDoMore', function(){
        $('.unDoMore').hide();
        $('.unDoClose').show();
        $('.undoNameList').css({height: 'auto'});
    })
    .on('click', '.unDoClose', function(){
        $('.unDoMore').show();
        $('.unDoClose').hide();
        $('.undoNameList').css({height: '30px'});
    })
    .on('click', '.moreClassTest', function () {
        testListRender(true);
    });

  //初始化函数执行
  loginFun();

  /**
   * <------ 检测浏览器退出 ------>
   */
  window.onbeforeunload = function(){

  };
});
