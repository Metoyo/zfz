/**
 * @title 考试网站路由
 * @overview 建立访问路径与api的映射
 * @copyright (c) 2013 泰安厅教育科技有限公司
 * @author 曾勇
 */
exports.router = function (config, logger) {
  function _bind(app, express) {

    // 依赖库
    var http = require('http');
    var path = require('path');
    var request = require('request');
    var session = require('express-session');
    var bodyParser = require('body-parser');
    var cookieParser = require('cookie-parser');
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json());
    app.use(cookieParser());
    app.use(session({secret: 'tat1234554321ata'}));

    //引入api
    var api = require('./api.js').api(config, logger);

    // 静态路由
    app.use('/', express.static(
      require('path').resolve(__dirname + '/../app')
    ));

    app.use('/show_file', express.static('d:/考试系统/ZhiFuZi/data/upload'));

    //图片的格式化
    /*    app.get('/show_file/:file', function(req, res){
     var opt = {
     host: '127.0.0.1',
     port: '4280',
     path: '/show_file/' + req.params.file,
     method: 'GET',
     headers: req.headers
     };
     http.request(opt, function (result) {
     result.pipe(res);
     }).end();
     });*/

    //生成PDF
    app.engine('.html', require('art-template'));
    app.get('/create_pdf', api.createPdf);
    app.get('/zuoda_pdf', api.getTiMuPage);
    app.get('/create_pdf_single', api.createPdfSingle);

    //认证部分的url请求
    app.get('/login', api.login); //登录
    app.get('/logout', api.logout); //退出登录
    app.put('/xuexiao', api.addXueXiao); //新建学校
    app.delete('/xuexiao', api.deleteXueXiao); //删除学校
    app.get('/xuexiao', api.getXueXiao); //得到学校机构的列表
    app.post('/xuexiao', api.modifyXueXiao); //修改学校
    app.put('/yonghu', api.addYongHu); //新建用户
    app.delete('/yonghu', api.deleteYongHu); //删除用户
    app.get('/yonghu', api.getYongHu); //查询用户
    app.post('/yonghu', api.modifyYongHu); //修改用户
    app.post('/imp_yonghu', api.impYongHu); //导入用户
    app.get('/yonghu_juese', api.getYongHuJueSe); //查询用户角色
    app.post('/yonghu_juese', api.modifyYongHuJueSe); //修改用户角色
    app.put('/lingyu', api.addLingYu); //新建领域
    app.delete('/lingyu', api.deleteLingYu); //删除领域
    app.get('/lingyu', api.getLingYu); //查询领域
    app.post('/lingyu', api.modifyLingYu); //修改领域
    app.put('/kemu', api.addKeMu); //新建科目
    app.delete('/kemu', api.deleteKeMu); //删除科目
    app.get('/kemu', api.getKeMu); //查询科目
    app.post('/kemu', api.modifyKeMu); //修改科目
    app.get('/kemu_jiaoshi', api.getKeMuJiaoShi); //查询科目教师
    app.get('/xuexiao_kemu', api.getXueXiaoKeMu); //查询学校科目
    app.post('/xuexiao_kemu', api.modifyXueXiaoKeMu); //修改学校科目
    app.put('/juese', api.addJueSe); //添加角色
    app.delete('/juese', api.deleteJueSe); //删除角色
    app.get('/juese', api.getJueSe); //查询角色
    app.post('/juese', api.modifyJueSe); //修改角色
    app.get('/exists_youxiang', api.existYouXiang); //检查邮箱是否存在
    app.get('/exists_yonghuming', api.existYougHuMing); //检查用户名是否存在
    app.put('/kexuhao', api.addKeXuHao); //新增课序号
    app.delete('/kexuhao', api.deleteKeXuHao); //删除课序号
    app.get('/kexuhao', api.getKeXuHao); //查询课序号
    app.post('/kexuhao', api.modifyKeXuHao); //修改课序号
    app.get('/kexuhao_jiaoshi', api.getKeXuHaoJiaoShi); //查询课序号教师
    app.post('/kexuhao_jiaoshi', api.modifyKeXuHaoJiaoShi); //修改课序号教师
    app.get('/kexuhao_xuesheng', api.getKeXuHaoXueSheng); //查询课序号学生
    app.post('/kexuhao_xuesheng', api.modifyKeXuHaoXueSheng); //修改课序号学生
    app.get('/xuesheng_kexuhao', api.getXueShengKeXuHao); //查询学生课序号
    app.get('/yonghu_session', api.getYongHuSession); //查询用户的Session

    //命题的url
    app.put('/tiku', api.addTiKu); //新建题库
    app.delete('/tiku', api.deleteTiKu); //删除题库
    app.get('/tiku', api.getTiKu); //查询题库
    app.post('/tiku', api.modifyTiKu); //修改题库
    app.put('/timu', api.addTiMu); //新建题目
    app.delete('/timu', api.deleteTiMu); //删除题目
    app.get('/timu', api.getTiMu); //查询题目
    app.post('/timu', api.modifyTiMu); //修改题目
    app.put('/timulaiyuan', api.addTiMuLaiYuan); //新建题目来源
    app.delete('/timulaiyuan', api.deleteTiMuLaiYuan); //删除题目来源
    app.get('/timulaiyuan', api.getTiMuLaiYuan); //查询题目来源
    app.post('/timulaiyuan', api.modifyTiMuLaiYuan); //修改题目来源
    app.put('/timuleixing', api.addTiMuLeiXing); //新建题目类型
    app.delete('/timuleixing', api.deleteTiMuLeiXing); //删除题目类型
    app.get('/timuleixing', api.getTiMuLeiXing); //查询题目类型
    app.post('/timuleixing', api.modifyTiMuLeiXing); //修改题目类型
    app.put('/tixing', api.addTiXing); //新建题型
    app.delete('/tixing', api.deleteTiXing); //删除题型
    app.get('/tixing', api.getTiXing); //查询题型
    app.post('/tixing', api.modifyTiXing); //修改题型Z
    app.put('/zhishidagang', api.addZhiShiDaGang); //新建知识大纲
    app.delete('/zhishidagang', api.deleteZhiShiDaGang); //删除知识大纲
    app.get('/zhishidagang', api.getZhiShiDaGang); //查询知识大纲
    app.post('/zhishidagang', api.modifyZhiShiDaGang); //修改知识大纲
    app.put('/zhishidian', api.addZhiShiDian); //新建知识点
    app.delete('/zhishidian', api.deleteZhiShiDian); //删除知识点
    app.get('/zhishidian', api.getZhiShiDian); //查询知识点
    app.post('/zhishidian', api.modifyZhiShiDian); //修改知识点
    app.get('/chutiren', api.getChuTiRen); //查询出题人
    app.get('/lutiren', api.getLuTiRen); //查询录题人
    app.get('/xuexiao_kemu_tixing', api.getXueXiaoKeMuTiXing); //查询学习科目题型
    app.post('/xuexiao_kemu_tixing', api.modifyXueXiaoKeMuTiXing); //修改学习科目题型
    app.put('/shijuanzu', api.addShiJuanZu); //新建试卷组
    app.delete('/shijuanzu', api.deleteShiJuanZu); //删除试卷组
    app.get('/shijuanzu', api.getShiJuanZu); //查询试卷组
    app.post('/shijuanzu', api.modifyShiJuanZu); //修改试卷组
    app.post('/zujuan', api.modifyZuJuan); //组卷
    app.get('/shijuan', api.getShiJuan); //查询试卷
    app.post('/shijuan', api.modifyShiJuan); //修改试卷
    app.get('/kemu_conf', api.getKeMuConf); //查询科目配置
    app.post('/kemu_conf', api.modifyKeMuConf); //修改科目配置

    //考务的url
    app.put('/kaodian', api.addKaoDian); //新建考点
    app.delete('/kaodian', api.deleteKaoDian); //删除考点
    app.get('/kaodian', api.getKaoDian); //查询考点
    app.post('/kaodian', api.modifyKaoDian); //修改考点
    app.put('/kaoshizu', api.addKaoShiZu); //新建考试组
    app.delete('/kaoshizu', api.deleteKaoShiZu); //删除考试组
    app.get('/kaoshizu', api.getKaoShiZu); //查询考试组
    app.post('/kaoshizu', api.modifyKaoShiZu); //修改考试组
    app.get('/dabao_shijuan', api.daBaoShiJuan); //打包试卷
    app.get('/fabu_kaoshizu', api.faBuKaoShiZu); //发布考试组
    app.get('/kaosheng_kaoshi', api.getKaoShengKaoShi); //查询考生考试
    app.get('/zaixian_baoming', api.zaiXianBaoMing); //在线报名
    app.get('/kaoshi_shijuanzu', api.kaoShiShiJuanZu); //查询考试用到的考试组
    app.post('/json2excel', api.exportStu); //导出考生

    //阅卷的url
    app.post('/transfer_from_omr', api.transferFromOmr); //扫描设定
    app.get('/kaosheng_zuoda', api.kaoShengZuoDa); //考生作答

    //统计的url
    app.get('/kaoshizu_zhishidian', api.kaoShiShiJuanZuZhiShiDian); //查询考试组知识点
    app.get('/kaosheng_chengji', api.kaoShengChengJi); //查询考生成绩
    app.get('/kaosheng_zhishidian_defenlv', api.kaoShengZhiShiDianDeFenLv); //查询考生知识点得分率
    app.get('/kaoshizu_timu_defenlv', api.kaoShiZuTiMuDeFenLv); //查询考试组题目得分率
    app.get('/timu_defenlv', api.tiMuDeFenLv); //题目得分率
    app.get('/zhishidian_defenlv', api.zhiShiDianDeFenLv); //查询知识点得分率

    //公共的url
    app.post('/upload', api.upload); //命题的文件上传
    app.get('/find_password', api.findPassword); //找回密码
    app.post('/reset_password', api.resetPassword); //重置密码

    //练习
    app.put('/lianxi', api.beginLianXi); //开始练习
    app.post('/lianxi', api.endLianXi); //结束练习
    app.post('/dati', api.lianXiDaTi); //练习答题

  }

  return {bind: _bind}
};
