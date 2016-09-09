/**
 * Created by songtao on 16/9/7.
 */
$(function(){
  //模板render函数
  function renderFun(data, tplId){
    var html = template(tplId, data);
    $('#htmlShowBox').html(html);
  }

  //初始化函数
  function initFun(){
    renderFun({}, 'tplResult');
    $('.title').text('测试结果');
    //renderFun({}, 'tplAddNewTest');
    //$('.seniorSetBtn').on('click', function(){
    //  $('.seniorSetBox').slideToggle();
    //});
    //$('.title').text('发起自测');
  }
  initFun();

  //tabbar的激活函数
  $('#container').on('click', '.weui_tabbar_item', function () {
    $(this).addClass('weui_bar_item_on').siblings('.weui_bar_item_on').removeClass('weui_bar_item_on');
  });

  //发起测试按钮
  $('#tabBtnAddNew').on('click', function(){
    initFun();
  });

  //测试结果按钮
  //$('#tabBtnResult').on('click', function(){
  //  //renderFun({}, 'tplResultList');
  //  renderFun({}, 'tplResult');
  //  $('.title').text('测试结果');
  //});

  //宣传视频按钮
  $('#tabBtnVideo').on('click', function(){
    renderFun({}, 'tplVideos');
    $('.title').text('宣传视频');
  });

  //免费试用按钮
  $('#tabBtnFree').on('click', function(){
    renderFun({}, 'tplFree');
    $('.title').text('免费试用');
  });
});