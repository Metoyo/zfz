/**
 * Created by songtao on 16/9/22.
 */
$(function(){
  var loginUrl = '/login'; //登录
  var xueXiaoUrl = '/xuexiao'; //学校
  var yongHuUrl = '/yonghu'; //用户
  var kaoShengKaoShiUrl = "/kaosheng_kaoshi";//考生考试
  var zaiXianBaoMingUrl = '/zaixian_baoming'; //在线报名
  var kaoShiZuUrl = '/kaoshizu'; //考试组
  var bmPar = { //报名用到的参数
    allSch: '', //所有学校
    sltSch: '', //选中的学校
    allKsz: '', //所有需要报名的考试
    orignKsz: '', //所有考试
    uid: '', //用户UID
    sltOrgKsz: '', //选中的考试组
    sltKs: '', //选中的考试ID
    sltKc: '', //选中的考场ID
    // wxid: ''
    wxid: 'oA5Yrw348MVRKwHLPdG8cpDFuKaA'
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
   * 模板render函数
   */
  var renderFun =  function(data, tplId){
    var html = template(tplId, data);
    $('#content').html(html);
  };
  var renderXxFun =  function(data, tplId){
    var html = template(tplId, data);
    $('#xueXiaoList').html(html);
  };

  /**
   *  中文排序
   */
  var cnSort = function(data, par){
    return data.sort(function(a,b){
      if(a[par] && b[par]){
        return a[par].localeCompare(b[par]);
      }
    });
  };

  /**
   * 日期格式化
   */
  var dateFormat = function(dateStr){
    var mydateOld = new Date(dateStr);
    var difMinutes = mydateOld.getTimezoneOffset(); //与本地相差的分钟数
    var difMilliseconds = mydateOld.valueOf() - difMinutes * 60 * 1000; //与本地相差的毫秒数
    var mydateNew = new Date(difMilliseconds);
    var year = mydateNew.getUTCFullYear(); //根据世界时从 Date 对象返回四位数的年份
    var month = mydateNew.getUTCMonth() + 1; //根据世界时从 Date 对象返回月份 (0 ~ 11)
    var day = mydateNew.getUTCDate(); //根据世界时从 Date 对象返回月中的一天 (1 ~ 31)
    var week = mydateNew.getUTCDay(); //根据世界时从 Date 对象返回周中的一天 (0 ~ 6)
    var hour = mydateNew.getUTCHours(); //根据世界时返回 Date 对象的小时 (0 ~ 23)
    var minute = mydateNew.getUTCMinutes(); //根据世界时返回 Date 对象的分钟 (0 ~ 59)
    var joinDate; //返回最终时间
    var weekday = new Array(7); //定义一个星期的数组
    weekday[0] = "星期日";
    weekday[1] = "星期一";
    weekday[2] = "星期二";
    weekday[3] = "星期三";
    weekday[4] = "星期四";
    weekday[5] = "星期五";
    weekday[6] = "星期六";
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
    joinDate = year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ' ' + weekday[week];
    return joinDate;
  };

  /**
   * 获取学校列表
   */
  var tplLoginRender = function(){
    bmPar.allSch = [];
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
          bmPar.allSch = data.data;
          renderFun({}, 'tplLogin');
          renderXxFun(dt, 'tplXueXiaoList');
          var $iosActionsheet = $('#iosActionsheet');
          var $iosMask = $('#iosMask');
          function hideActionSheet() {
            $iosActionsheet.removeClass('weui-actionsheet_toggle');
            $iosMask.fadeOut(200);
          }
          $iosMask.on('click', hideActionSheet);
          $('#iosActionsheetCancel, #actionsheet_confirm').on('click', hideActionSheet);
          $("#showIOSActionSheet").on("click", function(){
            $iosActionsheet.addClass('weui-actionsheet_toggle');
            $iosMask.fadeIn(200);
          });
          $('.optXueXiao').on('click', function () {
            $(this).addClass('tabOn').siblings('.tabOn').removeClass('tabOn');
            var idx = $(this).index();
            bmPar.sltSch = bmPar.allSch[idx];
            $('.xueXiaoWrap').data('id', bmPar.sltSch['学校ID']).html(bmPar.sltSch['学校名称']).removeClass('clA8');
          });
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
  var qryKaoShi = function(){
    bmPar.allKsz = [];
    bmPar.orignKsz = [];
    $.ajax({
      method: 'GET',
      url: kaoShengKaoShiUrl,
      data:{
        'UID': bmPar.uid
      },
      success: function (data) {
        data = dataMake(data);
        if(data.result){
          if(data.data && data.data.length > 0){
            var kszId = Lazy(data.data).reverse().map('考试组ID').toArray();
            $.ajax({
              method: 'GET',
              url: kaoShiZuUrl,
              data: {
                '考试组ID': JSON.stringify(kszId),
                '返回考试': true
              },
              success: function (kszs) {
                kszs = dataMake(kszs);
                if(kszs.result){
                  if(kszs.data && kszs.data.length > 0){
                    bmPar.orignKsz = kszs.data;
                    Lazy(kszs.data).each(function(ksz){
                      if(ksz['状态'] <= 2){
                        var bmStar = new Date(ksz['报名开始时间']);
                        var bmEnd = new Date(ksz['报名截止时间']);
                        var now = new Date();
                        //var difMinutes = bmStar.getTimezoneOffset(); //与本地相差的分钟数
                        //var sDifMS = bmStar.valueOf() - difMinutes * 60 * 1000; //报名开始与本地相差的毫秒数
                        //var eDifMS = bmEnd.valueOf() - difMinutes * 60 * 1000; //报名结束与本地相差的毫秒数
                        var sDifMS = bmStar.valueOf(); //报名开始与本地相差的毫秒数
                        var eDifMS = bmEnd.valueOf(); //报名结束与本地相差的毫秒数
                        var nMS = now.valueOf(); //本地时间
                        if(nMS >= sDifMS && nMS <= eDifMS){
                          ksz.baoMingStart = (nMS >= sDifMS && nMS <= eDifMS);
                          var fidTar = Lazy(data.data).find(function(ks){ return ks['考试组ID'] == ksz['考试组ID']});
                          if(fidTar){
                            bmPar.allKsz.push(fidTar);
                          }
                        }
                      }
                    });
                    var dt = {
                      kszArr: bmPar.allKsz
                    };
                    if(bmPar.allKsz && bmPar.allKsz.length > 0){
                      renderFun(dt, 'tplKaoShiZu');
                    }
                    else{
                      renderFun({}, 'tplNoBaoMing');
                      $('#navBar').hide();
                    }
                  }
                  else{
                    renderFun({}, 'tplNoBaoMing');
                    $('#navBar').hide();
                  }
                }
                else{
                  dialog(kszs.error);
                }
              },
              error: function (error) {
                dialog(error);
              }
            });
          }
          else{
            renderFun({}, 'tplNoBaoMing')
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

  /**
   * 初始化函数
   */
  var initFun = function(){
    // bmPar.wxid = $('#myBody').data('id') || '';
    $('#navBar').hide();
    if(bmPar.wxid){
      $.ajax({
        method: 'GET',
        url: loginUrl,
        data:{
          '微信ID': bmPar.wxid
        },
        success: function (data) {
          data = dataMake(data);
          if(data.result && data.data){
            //显示可以报名的考试
            bmPar.uid = data.data['UID'];
            qryKaoShi();
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
    }
    else{
      dialog('微信ID为空！');
    }
  };
  initFun();

  /**
   * 点击事件
   */
  $('#container').on('click', '#nextStep1', function(){
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
                  bmPar.uid = data1.data['UID'];
                  //去关联微信的openid
                  $.ajax({
                    method: 'POST',
                    url: yongHuUrl,
                    data:{
                      'UID': bmPar.uid,
                      '微信ID': bmPar.wxid
                    },
                    success: function(data2){
                      data2 = dataMake(data2);
                      if(data2.result){
                        qryKaoShi();
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
    .on('click', '.cardKaoShiZu', function(){ //点击可以报名的考试组
      var sltId = $(this).data('id');
      var sltKsz = Lazy(bmPar.allKsz).find(function(ksz){ return ksz['考试组ID'] == sltId}) || '';
      var sltOrgKsz = Lazy(bmPar.orignKsz).find(function(ksz){ return ksz['考试组ID'] == sltId}) || '';
      if(sltOrgKsz){
        bmPar.sltOrgKsz = sltOrgKsz;
        Lazy(sltOrgKsz['考试']).each(function(cc){
          cc['开考时间'] = dateFormat(cc['开始时间']);
          if(cc['考试ID'] == sltKsz['考试ID']){
            cc.ckd = sltKsz['状态'] == 1;
          }
          else{
            cc.ckd = false;
          }
        });
        renderFun({ksArr: sltOrgKsz}, 'tplKaoShi');
        $('#navBar').show();
      }
      else{
        dialog('请选择考试组！');
      }
    })
    .on('click', '.cardChangCi', function(){ //点击选择场次
      $(this).addClass('cardChangCiOn').siblings('.cardChangCiOn').removeClass('cardChangCiOn');
      bmPar.sltKs = $(this).data('id');
      bmPar.sltKc = $(this).data('kc');
    })
    .on('click', '#saveKaoShi', function(){ //保存考生选择的考试
      var mis = [];
      if(!bmPar.uid){
        mis.push('缺少考生UID');
      }
      if(!bmPar.sltKs){
        mis.push('请选择考试');
      }
      if(!bmPar.sltKc){
        mis.push('请选择场次');
      }
      if(mis.length > 0){
        dialog(mis.join());
        return ;
      }
      $.ajax({
        method: 'GET',
        url: zaiXianBaoMingUrl,
        data: {
          'UID': bmPar.uid,
          '考试ID': bmPar.sltKs,
          '考点ID': bmPar.sltKc
        },
        success: function (data) {
          data = dataMake(data);
          if (data.result) {
            Lazy(bmPar.allKsz).each(function(ksz){
              if(ksz['考试组ID'] == bmPar.sltOrgKsz['考试组ID']){
                ksz['考试ID'] = bmPar.sltKs;
                ksz['考点ID'] = bmPar.sltKc;
                ksz['状态'] = 1;
              }
            });
            dialog('报名成功！', '报名成功');
            $('#backToKsz').click();
          }
          else {
            dialog(data.error);
          }
        },
        error: function (error) {
          dialog(error);
        }
      });
    })
    .on('click', '#backToKsz', function(){ //返回考试组
      var dt = {
        kszArr: bmPar.allKsz
      };
      renderFun(dt, 'tplKaoShiZu');
      $('#navBar').hide();
    });

});
