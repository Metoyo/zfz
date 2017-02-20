/**
 * Created by songtao on 16/9/7.
 */
$(function(){
  //用到变量
  var loginUrl = '/login'; //登录
  var xueXiaoUrl = '/xuexiao'; //学校
  var yongHuUrl = '/yonghu'; //用户
  var myPar = {
    allSch: '', //所有学校
    sltSch: '', //选中的学校
    uid: '',
    //wxid: 'oIdzKwDONphFuHicTvtJ0tZahlYk'
    //wxid: 'oIdzKwK2JBLPkk8xapl4_evqiuJQ' //蔡路
    //wxid: 'oA5Yrw9aYHyZhFfg1zSMK1fMorPE' //蔡路学生
    wxid: ''
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
  var renderFun =  function(data, tplId, container){
    template.config('escape', false);
    var html = template(tplId, data);
    $(container).html(html);
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
   * 获取学校列表
   */
  var tplLoginRender = function(){
    myPar.allSch = [];
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
          myPar.allSch = data.data;
          renderFun({}, 'tplLogin', '#content');
          renderFun(dt, 'tplXueXiaoList', '#xueXiaoList');
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
            myPar.sltSch = myPar.allSch[idx];
            $('.xueXiaoWrap').data('id', myPar.sltSch['学校ID']).html(myPar.sltSch['学校名称']).removeClass('clA8');
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

  //登录
  var loginFun = function(){
    myPar.wxid = $('#myBody').data('id') || '';
    if(myPar.wxid){
        $.ajax({
            method: 'GET',
            url: loginUrl,
            data:{
                '微信ID': myPar.wxid
            },
            success: function (data) {
                data = dataMake(data);
                if(data.result){
                    var obj = {
                        xuexiao: '',
                        xuehao: '',
                        xingming: '',
                        banji: ''
                    };
                    obj.xuehao = data.data['学号'] || '无学号';
                    obj.xingming = data.data['姓名'] || '无姓名';
                    obj.banji = data.data['班级'] || '无班级';
                    myPar.uid = data.data['UID'];
                    $.ajax({
                        method: 'GET',
                        url: xueXiaoUrl,
                        data: {
                            '学校ID': data.data['学校ID']
                        },
                        success: function (jigou) {
                            jigou = dataMake(jigou);
                            if(jigou.result){
                                if(jigou.data && jigou.data.length > 0){
                                    obj.xuexiao = jigou.data[0]['学校名称'];
                                }
                                else{
                                    obj.xuexiao = '学校名称不存在';
                                }
                                renderFun(obj, 'tplUsrInfo', '#content');
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

  //事件处理
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
                myPar.uid = data1.data['UID'];
                //去关联微信的openid
                $.ajax({
                  method: 'POST',
                  url: yongHuUrl,
                  data:{
                    'UID': myPar.uid,
                    '微信ID': myPar.wxid
                  },
                  success: function(data2){
                    data2 = dataMake(data2);
                    if(data2.result){
                      var obj = {
                        xuexiao: '',
                        xuehao: '',
                        xingming: '',
                        banji: ''
                      };
                      obj.xuehao = data1.data['学号'] || '无学号';
                      obj.xingming = data1.data['姓名'] || '无姓名';
                      obj.banji = data1.data['班级'] || '无班级';
                      $.ajax({
                        method: 'GET',
                        url: xueXiaoUrl,
                        data: {
                          '学校ID': data.data['学校ID']
                        },
                        success: function (jigou) {
                          jigou = dataMake(jigou);
                          if(jigou.result){
                            if(jigou.data && jigou.data.length > 0){
                              obj.xuexiao = jigou.data[0]['学校名称'];
                            }
                            else{
                              obj.xuexiao = '学校名称不存在';
                            }
                            renderFun(obj, 'tplUsrInfo', '#content');
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
          renderFun({}, 'tplErrMsg', '#content');
        }
      },
      error: function (error) {
        dialog(error);
      }
    });
  })
    .on('click', '#unBinding', function(){
      var mis = [];
      if(!myPar.uid){
        mis.push('UID');
      }
      if(!myPar.wxid){
        mis.push('微信ID');
      }
      if(mis.length > 0){
        dialog('缺少：' + mis.join());
        return ;
      }
      $.ajax({
        method: 'POST',
        url: yongHuUrl,
        data:{
          'UID': myPar.uid,
          '微信ID': ''
        },
        success: function(data){
          data = dataMake(data);
          if(data.result){
            myPar.uid = '';
            dialog('成功解除绑定！');
            loginFun();
          }
          else{
            dialog(data.error);
          }
        },
        error: function(error){
          dialog(error);
        }
      });
    });
  //初始化函数执行
  loginFun();

});
