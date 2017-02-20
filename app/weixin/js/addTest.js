/**
 * Created by songtao on 2017/1/3.
 */
$(function () {
    /**
     * 参数变量
     */
    var loginUrl = '/login'; //登录的URL
    var yongHuUrl = '/yonghu'; //用户的URL
    var xueXiaoUrl = '/xuexiao'; //学校
    var ceYanUrl = '/ceyan'; //测验的url
    var regu = /[\w!#$%&'*+/=?^_`{|}~-]+(?:\.[\w!#$%&'*+/=?^_`{|}~-]+)*@(?:[\w](?:[\w-]*[\w])?\.)+[\w](?:[\w-]*[\w])?/; //验证邮箱的正则表达式
    var emailIsNew = true; //邮箱不存在
    var tiMuImgArr = []; //存放上传图片serverId的数组
    var pics = []; //存放上传图片本localId的数字
    var keMuArr = []; //存放科目的数组
    var atPar = {
        jgId: '',
        uid: '',
        // wxid: 'oIdzKwDONphFuHicTvtJ0tZahlYk', //演示零零幺
        //wxid: 'oIdzKwK2JBLPkk8xapl4_evqiuJQ', //蔡路
        //wxid: 'oA5Yrw9aYHyZhFfg1zSMK1fMorPE', //蔡路学生
        // wxid: 'oIdzKwDWQg7zE54xwuw8elI-KJDA', //贾陆军
        wxid: '',
        yx: '',
        xm: '',
        mm: '',
        kmid: '',
        kmName: '',
        lyid: '',
        lyName: '',
    };
    var teacher = {
        '学校': '',
        '学校ID': '',
        '科目': '',
        '科目ID': '',
        '领域名称': '',
        '领域ID': '',
        '姓名': '',
        'UID': '',
        '测验名称': ''
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
    var renderFun =  function(data, tplId, container){
        template.config('escape', false);
        var html = template(tplId, data);
        $(container).html(html);
    };
    /**
     * 初始化函数
     */
    var initFun = function(){
        atPar.wxid = $('#myBody').data('id') || '';
        if(atPar.wxid){
            $.ajax({
                method: 'GET',
                url: loginUrl,
                data:{
                    '微信ID': atPar.wxid
                },
                success: function (data) {
                    data = dataMake(data);
                    if(data.result){
                        atPar.jgId = data.data['学校ID'];
                        atPar.uid = data.data['UID'];
                        var xuexiao = '';
                        var xingming = data.data['姓名'] || '无姓名';
                        if(data.data['权限'] && data.data['权限'].length > 0){
                            xuexiao = data.data['权限'][0]['学校名称'];
                            Lazy(data.data['权限']).each(function (qx) {
                                var kmObj = {
                                    '科目ID': qx['科目ID'],
                                    '科目名称': qx['科目名称'],
                                    '领域ID': qx['领域ID'],
                                    '领域名称': qx['领域名称'],
                                };
                                keMuArr.push(kmObj);
                            });
                            keMuArr = Lazy(keMuArr).uniq('科目ID').toArray();
                            if(keMuArr && keMuArr.length == 1){
                                atPar.kmid = keMuArr[0]['科目ID'];
                                atPar.lyid = keMuArr[0]['领域ID'];
                                atPar.kmName = keMuArr[0]['科目名称'];
                                atPar.lyName = keMuArr[0]['领域名称'];
                            }
                            renderFun({xuexiao: xuexiao, xingming: xingming}, 'tplUsr', '#topBar');
                            renderFun({keMu: keMuArr}, 'tplTestName', '#content');
                            renderFun({}, 'tplAddTestNav', '#navBar');
                        }
                        else{
                            $.ajax({
                                method: 'GET',
                                url: xueXiaoUrl,
                                data: {
                                    '学校ID': atPar.jgId
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
                                        renderFun({}, 'tplTestName', '#content');
                                        renderFun({}, 'tplAddTestNav', '#navBar');
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
                        teacher['学校'] = xuexiao;
                        teacher['学校ID'] = data.data['学校ID'];
                        teacher['姓名'] = xingming;
                        teacher['UID'] = data.data['UID'];
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
    initFun();

    /**
     * 点击事件
     */
    $('#container').on('click', '.navBar_item', function () {
        $(this).addClass('navBar_item_on').siblings('.navBar_item_on').removeClass('navBar_item_on');
    })
        .on('click', '.cardChangCi', function(){ //点击选择场次
            $(this).addClass('cardChangCiOn').siblings('.cardChangCiOn').removeClass('cardChangCiOn');
            atPar.kmid = $(this).data('kmid');
            atPar.kmName = $(this).data('kmname');
        })
        .on('click', '#saveTest', function () {
            var newClassTest = {
                '测验名称': '',
                '学校ID': atPar.jgId,
                '科目ID': '', //科目大于一的话，让老师选择
                '测验设置': {
                    '图片ID': '',
                    '微信ID': atPar.wxid,
                    '教师': ''
                    // '固定题目': true,
                    // '组卷规则': []
                },
                '状态': 2,
                '来源': '手机'
            };
            var testName = $('input[name="testName"]').val();
            var mis = [];
            if(!atPar.kmid){
                mis.push('科目ID');
            }
            if(!testName){
                mis.push('测验名称');
            }
            if(!tiMuImgArr.length){
                mis.push('图片');
            }
            if(mis.length > 0){
                dialog('缺少：' + mis.join());
                return ;
            }
            teacher['测验名称'] = testName;
            teacher['科目'] = atPar.kmName;
            teacher['科目ID'] = atPar.kmid;
            teacher['领域ID'] = atPar.lyid;
            teacher['领域名称'] = atPar.lyName;
            newClassTest['科目ID'] = atPar.kmid;
            newClassTest['测验名称'] = testName;
            newClassTest['测验设置']['图片ID'] = tiMuImgArr;
            newClassTest['测验设置']['教师'] = teacher;
            newClassTest['测验设置'] = JSON.stringify(newClassTest['测验设置']);
            $.ajax({
                method: 'PUT',
                url: ceYanUrl,
                data: newClassTest,
                success: function (data) {
                    data = dataMake(data);
                    if(data.result && data.data){
                        $('input[name="testName"]').val('');
                        tiMuImgArr = [];
                        pics = [];
                        renderFun({}, 'tplImagePreview', '#imgPreview');
                        dialog('图片上传成功！后台小二正在努力录题中……', '上传成功');
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
            atPar.yx = yx;
            $.ajax({
                method: 'GET',
                url: yongHuUrl,
                data:{
                    '邮箱': yx
                },
                success: function (data) {
                    data = dataMake(data);
                    $('#pswShow').show();
                    $('#pswHide').hide();
                    if(data.result && data.data){
                        if(data.data[0]['微信ID']){
                            dialog('您的账号已经绑定其他微信用户，请联系客服人员处理');
                        }
                        else{
                            $('.step1').hide();
                            $('.step2').show();
                            $('.step3').hide();
                            $('.mima').show();
                            atPar.jgId = data.data[0]['学校ID'];
                            atPar.uid = data.data[0]['UID'];
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
            atPar.mm = mm;
            atPar.yx = yx;
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
                        atPar.uid = data1.data['UID'];
                        atPar.jgId = data1.data['学校ID'];
                        var xuexiao = '';
                        var xingming = data1.data['姓名'] || '无姓名';
                        //renderFun({xuexiao: xuexiao, xingming: xingming}, 'tplUsr', '#topBar');
                        //去关联微信的openid
                        $.ajax({
                            method: 'POST',
                            url: yongHuUrl,
                            data:{
                                'UID': data1.data['UID'],
                                '微信ID': atPar.wxid
                            },
                            success: function(data2){
                                data2 = dataMake(data2);
                                if(data2.result){
                                    $.ajax({
                                        method: 'GET',
                                        url: xueXiaoUrl,
                                        data: {
                                            '学校ID': atPar.jgId
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
                                    renderFun({}, 'tplTestName', '#content');
                                    renderFun({}, 'tplAddTestNav', '#navBar');
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
            atPar.mm = mm;
            atPar.yx = yx;
            atPar.xm = xm;
            var regTeacherInfo = { //教师注册信息
                '邮箱': yx,
                '姓名': xm,
                '学校ID': 1033,
                '密码': mm,
                '用户类别': 1,
                '微信ID': atPar.wxid,
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
                        initFun();
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
        .on('click', '#deleteImage', function(){
            tiMuImgArr = [];
            pics = [];
            renderFun({pics: pics}, 'tplImagePreview', '#imgPreview');
        });

    /**
     * 微信接口
     */
    wx.ready(function () {
        // 拍照或从手机相册中选图接口
        tiMuImgArr = [];
        pics = [];
        $('#chooseImage').on('click', function(){
            wx.chooseImage({
                count: 9, // 默认9
                sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
                sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
                success: function (res) {
                    var localIds = res.localIds; // 返回选定照片的本地ID列表，localId可以作为img标签的src属性显示图片
                    pics = Lazy(pics).union(res.localIds).toArray();
                    function upLoad(id) {
                        wx.uploadImage({
                            localId: id, // 需要上传的图片的本地ID，由chooseImage接口获得
                            isShowProgressTips: 1, // 默认为1，显示进度提示
                            success: function (res) {
                                var serverId = res.serverId; // 返回图片的服务器端ID
                                tiMuImgArr.push(serverId);
                            }
                        });
                    }
                    //上传图片接口
                    Promise.map(localIds, function(localId, idx, lst) {
                        return upLoad(localId);
                    }).then(function () {
                        renderFun({pics: pics}, 'tplImagePreview', '#imgPreview');
                    });
                },
                fail: function (res) {
                    dialog(JSON.stringify(res));
                }
            });
        });

    });

    // wx.error(function (res) {
    //     dialog(res.errMsg);
    // });

});
