/**
 * Created by songtao on 16/12/14.
 */
$(function(){
  var keyValueUrl = '/key_value';
  var initFun = function(){
    $.ajax({
      method: 'GET',
      url: keyValueUrl,
      success: function (data) {
        if(typeof(data) == 'string'){
          data = JSON.parse(data);
        }
        if(data.result && data.data){
          var newData = [];
          Lazy(data.data).each(function(tech){
            var obj = JSON.parse(tech['键值内容']);
            var dt = new Date();
            var ye = dt.getFullYear();
            var mt = dt.getMonth() + 1;
            var dy = dt.getDate();
            obj['创建时间'] = ye + '-' + mt + '-' + dy;
            newData.push(obj);
          });

          var nwDt = {
            teacher: ''
          };
          nwDt.teacher = newData.reverse();
          var html = template('teacherInfo', nwDt);
          $('#container').html(html);
        }
        else{
          alert(data.error || '没有数据！');
        }
      },
      error: function (error) {
        alert(error);
      }
    });
  };
  // initFun();
});