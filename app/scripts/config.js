define( "config", [], function () {
  return {
    letterArr: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
      'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'], //英文字母序号数组
    smlLteArr: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p',
      'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'],
    cnNumArr: ['一','二','三','四','五','六','七','八','九','十','十一','十二','十三','十四','十五','十六','十七','十八','十九',
      '二十'], //中文数字序号数组
    routes: {
      '/mingti': {
        templateUrl: '../views/mingti/mingti.html',
        controller: 'MingtiCtrl',
        requireLogin: true
      },
      '/mingti/:id': {
        templateUrl: '../views/mingti/mingti.html',
        controller: 'MingtiCtrl',
        requireLogin: true
      },
      '/dagang': {
        templateUrl: '../views/dagang/dagang.html',
        controller: 'DagangCtrl',
        requireLogin: true
      },
      '/renzheng': {
        templateUrl: '../views/renzheng/renzheng.html',
        controller: 'RenzhengCtrl',
        requireLogin: false
      },
      '/user/:name': {
        templateUrl: '../views/renzheng/user.html',
        controller: 'UserCtrl',
        requireLogin: true
      },
      '/register': {
        templateUrl: '../views/renzheng/register.html',
        controller: 'RegisterCtrl',
        requireLogin: false
      },
      '/register/:stuFndUn': {
        templateUrl: '../views/renzheng/register.html',
        controller: 'RegisterCtrl',
        requireLogin: false
      },
      '/zujuan': {
        templateUrl: '../views/zujuan/zujuan.html',
        controller: 'ZujuanCtrl',
        requireLogin: true
      },
      '/kaowu': {
        templateUrl: '../views/kaowu/kaowu.html',
        controller: 'KaowuCtrl',
        requireLogin: true
      },
      '/tongji': {
        templateUrl: '../views/tongji/tongji.html',
        controller: 'TongjiCtrl',
        requireLogin: true
      },
      '/resetPassword/:email': {
        templateUrl: '../views/renzheng/rz_resetPw.html',
        controller: 'RenzhengCtrl',
        requireLogin: false
      },
      '/baoming': {
        templateUrl: '../views/student/baoming.html',
        controller: 'StudentCtrl',
        requireLogin: true
      },
      '/chengji': {
        templateUrl: '../views/student/chengji.html',
        controller: 'StudentCtrl',
        requireLogin: true
      },
      '/guanli': {
        templateUrl: '../views/guanli/guanli.html',
        controller: 'GuanLiCtrl',
        requireLogin: true
      },
      '/weiluke': {
        templateUrl: '../views/student/luke.html',
        controller: 'StudentCtrl',
        requireLogin: true
      },
      '/lianxi': {
        templateUrl: '../views/student/lianxi.html',
        controller: 'StudentCtrl',
        requireLogin: true
      },
      '/kejian': {
        templateUrl: '../views/kejian/kejian.html',
        controller: 'KejianCtrl',
        requireLogin: true
      }
    },
    moduleObj: [ //得到角色是数组
      {
        myUrl : 'dagang',
        urlName: '大纲'
      },
      {
        myUrl : 'mingti',
        urlName: '命题'
      },
      {
        myUrl : 'zujuan',
        urlName: '组卷'
      },
      {
        myUrl : 'kaowu',
        urlName: '考务'
      },
      {
        myUrl : 'tongji',
        urlName: '统计'
      },
      {
        myUrl : 'guanli',
        urlName: '管理'
      },
      {
        myUrl : 'kejian',
        urlName: '课件'
      },
      {
        myUrl : 'baoming',
        urlName: '报名'
      },
      {
        myUrl : 'chengji',
        urlName: '成绩'
      },
      {
        myUrl : 'weiluke',
        urlName: '微课'
      },
      {
        myUrl : 'lianxi',
        urlName: '练习'
      }
    ],
    tiXingArr: ['单选题','多选题','判断题','填空题','计算题','证明题','解答题'],
    imgType: ['.jpg', '.jpeg', '.png', '.gif', '.bmp'],
    videoType: ['.ogv', '.mp4', '.avi', '.mkv', '.wmv'],
    audioType: ['.ogg', '.mp3', '.wav'],
    uploadFileSizeLimit: 209715200, //上传文件的大小限制2MB
    loginUsr: '' //登录用户
  };
});
