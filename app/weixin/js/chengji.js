/**
 * Created by songtao on 16/9/22.
 */
$(function(){
  var loginUrl = '/login'; //登录
  var xueXiaoUrl = '/xuexiao'; //学校
  var yongHuUrl = '/yonghu'; //用户
  var kaoShengChengJiUrl = '/kaosheng_chengji'; //查询考生成绩
  var kaoShiZuUrl = '/kaoshizu'; //考试组
  var kaoShengZhiShiDianDeFenLvUrl = '/kaosheng_zhishidian_defenlv'; //查询考生知识点得分率
  var kaoShengZuoDaUrl = '/kaosheng_zuoda'; //考生作答的接口
  var ziMu =  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
    'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']; //英文字母序号数组
  var cnNumArr = ['一','二','三','四','五','六','七','八','九','十','十一','十二','十三','十四','十五','十六','十七','十八','十九',
    '二十'];
  var cjPar = { //报名用到的参数
    allSch: '', //所有学校
    sltSch: '', //选中的学校
    uid: '', //用户UID
    jgId: '', //学校ID
    allKsz: '', //所有考试组
    wxid: 'wxabcb783dbd59b067'
  };
  //var openId = 'wxabcb783dbd59b067';
  //var openId = 'wxabcb783dbd59b070';

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
   * 模板render函数
   */
  var renderFun =  function(data, tplId){
    template.config('escape', false);
    var html = template(tplId, data);
    $('#container').html(html);
  };

  /**
   * 答案格式化
   */
    //题目题干答案格式化
  var formatDaAn = function(tm){
    if(tm['题型ID'] <= 2){ //修改选择题答案
      var daanStr = tm['题目内容']['答案'];
      var tzStr = tm['题目内容']['选项'];
      var daan = [];
      if(tm['题型ID'] == 1){
        daan.push(ziMu[daanStr]);
      }
      else{
        var daanArr = [];
        if(daanStr && typeof(daanStr) == 'string'){
          daanArr = JSON.parse(daanStr);
        }
        else{
          daanArr = daanStr;
        }
        var daanLen = daanArr.length || 0;
        for(var i = 0; i < daanLen; i++){
          daan.push(ziMu[daanArr[i]]);
        }
      }
      tm['题目内容']['答案'] = daan.join(',');
      if(tzStr && typeof(tzStr) == 'string'){
        tm['题目内容']['选项'] = JSON.parse(tzStr);
      }
    }
    if(tm['题型ID'] == 3){ //修改判断题答案
      tm['题目内容']['答案'] = tm['题目内容']['答案'] ? '对' : '错';
    }
    if(tm['题型ID'] == 4){ //修改填空题的答案
      var tkTgStr = tm['题目内容']['题干'];
      var daAnFormatReg = new RegExp('<\%{.*?}\%>', 'g');
      var count = 1;
      var daAnArr = [];
      tm['题目内容']['原始答案'] = tm['题目内容']['答案'];
      tm['题目内容']['原始题干'] = tm['题目内容']['题干'];
      tm['题目内容']['题干'] = tkTgStr.replace(daAnFormatReg, function(arg) {
        var xhStr = '';
        if(tm['考生作答']){ //作答重现
          var tkKsDa = tm['考生作答']['考生答案'];
          if (typeof(tkKsDa) == 'string') {
            tkKsDa = JSON.parse(tkKsDa);
          }
          var findDaAn = tkKsDa[count - 1];
          if (typeof(findDaAn) == 'string') {
            findDaAn = JSON.parse(findDaAn);
          }
          if(findDaAn['答题方式'] == 2){
            xhStr = '<span class="ar-tk-da"><img src="' + findDaAn['用户答案'] + '"/></span>';
          }
          else{
            xhStr = '<span class="ar-tk-da">' + findDaAn['用户答案'] + '</span>';
          }
          count ++;
          return xhStr;
        }
        else{ //题目展示
          var text = arg.slice(2, -2);
          var textJson = JSON.parse(text);
          var _len = textJson['尺寸'];
          for(var i = 0; i < _len; i ++ ){
            xhStr += '_';
          }
          count ++;
          return xhStr;
        }
      });
      Lazy(tm['题目内容']['答案']).each(function(da){
        var tmp = '第' + (da['序号'] + 1) + '空：' + da['答案'].join('，');
        daAnArr.push(tmp);
      });
      tm['题目内容']['答案'] = daAnArr.join('；');
    }
    if(tm['考生作答']){
      if(tm['考生作答']['阅卷'] && tm['考生作答']['阅卷'].length > 0){
        tm['考生作答']['阅卷教师'] = Lazy(tm['考生作答']['阅卷']).map(function(yj){
          return yj['评分教师姓名'];
        }).join(',');
      }
      if(tm['题型ID'] == 2){

      }
      if(tm['题型ID'] >= 5){
        var jstKsDa = tm['考生作答']['考生答案'];
        var jstKsFinalDaAn = [];
        if(typeof(jstKsDa) == 'string'){
          jstKsDa = JSON.parse(jstKsDa);
        }
        for(var key in jstKsDa){
          var bdDaObj = '';
          if(typeof(jstKsDa[key]) == 'string'){
            bdDaObj = JSON.parse(jstKsDa[key]);
          }
          else{
            bdDaObj = jstKsDa[key];
          }
          jstKsFinalDaAn.push('<img src="' + bdDaObj['用户答案'] + '"/>');
        }
        tm['考生作答']['考生答案'] = jstKsFinalDaAn.join(' ');
      }
    }
    return tm;
  };

  /**
   * 中文排序
   */
  var cnSort = function(data, par){
    return data.sort(function(a,b){
      if(a[par] && b[par]){
        return a[par].localeCompare(b[par]);
      }
    });
  };

  /**
   * 获取学校列表
   */
  var tplLoginRender = function(){
    cjPar.allSch = [];
    $.ajax({
      method: 'GET',
      url: xueXiaoUrl,
      success: function (data) {
        data = dataMake(data);
        if(data.result && data.data){
          data.data = cnSort(data.data, '学校名称');
          var dt = {
            xueXiao: data.data
          };
          cjPar.allSch = data.data;
          renderFun(dt, 'tplLogin');
        }
        else{
          dialog(data.error || '没有学校数据！');
        }
      },
      error: function (error) {
        dialog(error);
      }
    });
  };

  /**
   * 查询可以报名的考试
   */
  var qryKaoShiZu = function(){
    var power = '';
    $.ajax({
      method: 'GET',
      url: kaoShengChengJiUrl,
      data:{
        'UID': cjPar.uid
      },
      success: function (students) {
        students = dataMake(students);
        if(students.result && students.data){
          $.ajax({
            method: 'GET',
            url: xueXiaoUrl,
            data:{
              '学校ID': cjPar.jgId
            },
            success: function (school) {
              school = dataMake(school);
              if(school.result && school.data){
                var xxSet = school.data[0]['学校设置'];
                if(xxSet && xxSet['成绩和作答']){
                  power = xxSet['成绩和作答'];
                }
                Lazy(students.data).each(function(stu){
                  stu.score = 'off';
                  stu.zuoda = 'off';
                  if(power){
                    var fndTar = power[stu['科目ID']];
                    if(fndTar){
                      stu.score = fndTar['考试成绩'];
                      stu.zuoda = fndTar['作答重现'];
                    }
                  }
                });
                //cjPar.allKsz = Lazy(students.data).reverse().toArray();
                cjPar.allKsz = cnSort(students.data, '考试组名称');
                var dt = {
                  kszList: cjPar.allKsz
                };
                renderFun(dt, 'tplKaoShiZu')
              }
              else{
                dialog(school.error);
              }
            },
            error: function (error) {
              dialog(error);
            }
          });
        }
        else{
          dialog(students.error);
        }
      },
      error: function (error) {
        dialog(error);
      }
    });
  };

  /**
   * 初始化函数
   */
  var initFun = function(){
    $.ajax({
      method: 'GET',
      url: loginUrl,
      data:{
        '微信ID': cjPar.wxid
      },
      success: function (data) {
        data = dataMake(data);
        if(data.result && data.data){
          cjPar.uid = data.data['UID'];
          cjPar.jgId = data.data['学校ID'];
          qryKaoShiZu();
        }
        else{
          //显示用户查询界面
          tplLoginRender();
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
   * 点击事件
   */
  $('#container').on('click', '#showActionSheet', function () { //弹出学校列表
    var mask = $('#mask');
    var weuiActionsheet = $('#weui_actionsheet');
    weuiActionsheet.addClass('weui_actionsheet_toggle');
    mask.show()
      .focus()//加focus是为了触发一次页面的重排(reflow or layout thrashing),使mask的transition动画得以正常触发
      .addClass('weui_fade_toggle').one('click', function () {
        hideActionSheet(weuiActionsheet, mask);
      });
    $('#actionsheet_cancel, #actionsheet_confirm').one('click', function () {
      hideActionSheet(weuiActionsheet, mask);
    });
    $('.optXueXiao').on('click', function () {
      $(this).addClass('tabOn').siblings('.tabOn').removeClass('tabOn');
      var idx = $(this).index();
      cjPar.sltSch = cjPar.allSch[idx];
      $('.xueXiaoWrap').data('id', cjPar.sltSch['学校ID']).html(cjPar.sltSch['学校名称']).removeClass('clA8');

    });
    mask.unbind('transitionend').unbind('webkitTransitionEnd');
    function hideActionSheet(weuiActionsheet, mask) {
      weuiActionsheet.removeClass('weui_actionsheet_toggle');
      mask.removeClass('weui_fade_toggle');
      mask.on('transitionend', function () {
        mask.hide();
      }).on('webkitTransitionEnd', function () {
        mask.hide();
      })
    }
  }) //点击下一步，去验证考生是否已注册
    .on('click', '#nextStep1', function(){
      var xxId = $('.xueXiaoWrap').data('id');
      var xh = $('input[name="yourNum"]').val();
      var xm = $('input[name="yourName"]').val();
      var mis = [];
      if(!xxId){
        mis.push('选择学校');
      }
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
          '学校ID': xxId,
          '学号': xh,
          '姓名': xm
        },
        success: function (data) {
          data = dataMake(data);
          if(data.result && data.data){
            //用学校ID和学号去登陆
            $.ajax({
              method: 'GET',
              url: loginUrl,
              data:{
                '学校ID': xxId,
                '学号': xh
              },
              success: function (data1) {
                data1 = dataMake(data1);
                if(data1.result && data1.data){
                  cjPar.uid = data1.data['UID'];
                  //去关联微信的openid
                  $.ajax({
                    method: 'POST',
                    url: yongHuUrl,
                    data:{
                      UID: cjPar.uid,
                      '微信ID': cjPar.wxid
                    },
                    success: function(data2){
                      data2 = dataMake(data2);
                      if(data2.result){
                        qryKaoShiZu();
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
          else{
            renderFun({}, 'tplErrMsg');
          }
        },
        error: function (error) {
          dialog(error);
        }
      });
    })
    .on('click', '#zuoDaChongXian', function(){ //作答重现
      var kszId = $(this).data('id');
      var finaData = {
        sj_name: '',
        cnNumArr: cnNumArr,
        letterArr: ziMu,
        sj_tm: []
      };
      $.ajax({
        method: 'GET',
        url: kaoShengZuoDaUrl,
        data: {
          '考试组ID': kszId,
          'UID': cjPar.uid
        },
        success: function (data) {
          data = dataMake(data);
          if(data.result && data.data){
            finaData.sj_name = data.data['试卷组名称'];
            Lazy(data.data['试卷题目']).each(function(dt){
              Lazy(dt['题目']).each(function(tm){
                tm = formatDaAn(tm);
              });
            });
            finaData.sj_tm = data.data['试卷题目'];
            renderFun(finaData, 'tplZuoDaChongXian');
            $('body').css('padding-bottom', '72px');
            MathJax.Hub.Config({
              tex2jax: {inlineMath: [["#$", "$#"]], displayMath: [['#$$','$$#']]},
              messageStyle: "none",
              showMathMenu: false,
              processEscapes: true
            });
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, "answerReappearShiJuan"]);
          }
          else{
            dialog(data.error || '没有作答数据！');
          }
        },
        error: function (error) {
          dialog(error);
        }
      });
    })
    .on('click', '#zhiShiDianFenXi', function(){ //知识点分析
      var kszId = $(this).data('id');
      var ksz = Lazy(cjPar.allKsz).find(function(ks){return ks['考试组ID'] == kszId});
      var kszZsd = [];
      var zsdDeFenLvArr = [];
      var zsdName = [];
      var zsdPerAll = [];
      var zsdPerSf = [];
      var letterAndZsd = [];
      // 指定图表的配置项和数据
      var option = {
        title: {
          text: '知识点分析'
        },
        tooltip: {},
        legend: {
          data: ['班级', '个人']
        },
        radar: {
          name: {
            textStyle: {
              color: 'rgba(0, 0, 0, 1)'
            }
          },
          indicator: ''
        },
        series: [{
          name: '班级 vs 个人',
          type: 'radar',
          data : [
            {
              value : '',
              name : '班级'
            },
            {
              value : '',
              name : '个人'
            }
          ]
        }]
      };
      $.ajax({  //查询考试组
        method: 'GET',
        url: kaoShiZuUrl,
        data: {
          '考试组ID': kszId,
          '返回考试': true
        },
        success: function (kszData) {
          kszData = dataMake(kszData);
          if(kszData.result && kszData.data){
            if(kszData['考试组设置'] && kszData['考试组设置']['考试组知识点']
              && kszData['考试组设置']['考试组知识点']['知识点ID'].length > 0){
              kszZsd = ksz['考试组设置']['考试组知识点']['知识点ID'];
            }
          }
          else{
            dialog(kszData.error);
          }
          $.ajax({  //考生成绩
            method: 'GET',
            url: kaoShengZhiShiDianDeFenLvUrl,
            data: {
              '考试组ID': kszId
            },
            success: function (cjData) {
              cjData = dataMake(cjData);
              if(cjData.result && cjData.data){
                var distZsd = Lazy(cjData.data).groupBy('知识点ID').toObject();
                var stuSelfZsd = Lazy(cjData.data).filter(function(zsd){
                  return zsd['UID'] == cjPar.uid;
                }).toArray();
                Lazy(distZsd).each(function(v, k, l){
                  var zsdTmp = {
                    '知识点ID': k,
                    '知识点名称': v[0]['知识点名称'],
                    '得分率': ''
                  };
                  var zfz = Lazy(v).reduce(function(memo, zsd){ return memo + zsd['总分值']; }, 0) || 1;
                  var zdf = Lazy(v).reduce(function(memo, zsd){ return memo + zsd['总得分']; }, 0);
                  zsdTmp['得分率'] = parseFloat((zdf/zfz * 100).toFixed(1));
                  zsdDeFenLvArr.push(zsdTmp);
                });
                if(zsdDeFenLvArr && zsdDeFenLvArr.length > 0){
                  if(kszZsd && kszZsd.length > 0){
                    Lazy(kszZsd).each(function(item, idex, lst){
                      var fidZsdTar = Lazy(zsdDeFenLvArr).find(function(zsdObj){
                        return zsdObj['知识点ID'] == item;
                      });
                      var fidStuTar = Lazy(stuSelfZsd).find(function(zsdObj){
                        return zsdObj['知识点ID'] == item;
                      });
                      if(fidZsdTar){
                        var laz = {zm: ziMu[idex], zsdMc: fidZsdTar['知识点名称']};
                        var zsdNameObj = {text: ziMu[idex], max: 100};
                        var zsdDeFenLv = fidZsdTar['得分率'] ? fidZsdTar['得分率'] : 0;
                        var stuDeFenLv = '';
                        if(fidStuTar){
                          stuDeFenLv = fidStuTar['得分率'] ? (fidStuTar['得分率']*100).toFixed(1) : 0;
                        }
                        letterAndZsd.push(laz);
                        zsdName.push(zsdNameObj);
                        zsdPerAll.push(zsdDeFenLv);
                        zsdPerSf.push(stuDeFenLv);
                      }
                    });
                  }
                  else{
                    Lazy(zsdDeFenLvArr).each(function(zsd, idex, lst){
                      var laz = {zm: ziMu[idex], zsdMc: zsd['知识点名称']};
                      var zsdNameObj = {text: ziMu[idex], max: 100};
                      var fidStuTar = Lazy(stuSelfZsd).find(function(zsdObj){
                        return zsdObj['知识点ID'] == zsd['知识点ID'];
                      });
                      var stuDeFenLv = '';
                      if(fidStuTar){
                        stuDeFenLv = fidStuTar['得分率'] ? (fidStuTar['得分率']*100).toFixed(1) : 0;
                      }
                      letterAndZsd.push(laz);
                      zsdName.push(zsdNameObj);
                      zsdPerAll.push(zsd['得分率']);
                      zsdPerSf.push(stuDeFenLv);
                    });
                  }
                  option.radar.indicator = zsdName;
                  option.series[0].data[0].value = zsdPerAll;
                  option.series[0].data[1].value = zsdPerSf;
                  // 使用刚指定的配置项和数据显示图表。
                  renderFun({zsd: letterAndZsd}, 'tplZsd');
                  $('.container').scrollTop(0);
                  $('body').css('padding-bottom', '72px');
                  // 基于准备好的dom，初始化echarts实例
                  var myChart = echarts.init(document.getElementById('radarBox'));
                  myChart.setOption(option);
                  MathJax.Hub.Config({
                    tex2jax: {inlineMath: [["#$", "$#"]], displayMath: [['#$$','$$#']]},
                    messageStyle: "none",
                    showMathMenu: false,
                    processEscapes: true
                  });
                  MathJax.Hub.Queue(["Typeset", MathJax.Hub, "zsdList"]);
                }
                else{
                  dialog('没有知识点数据！');
                }
              }
              else{
                dialog(cjData.error);
              }
            },
            error: function (error2) {
              dialog(error2);
            }
          });
        },
        error: function (error1) {
          dialog(error1);
        }
      });
    })
    .on('click', '.backToKszList', function(){ //返回考试组
      var dt = {
        kszList: cjPar.allKsz
      };
      renderFun(dt, 'tplKaoShiZu');
      $('body').css('padding-bottom', '0');
    });

});
