define( "config", [], function () {
  return {
    token: '12345',
    apiurl_rz: "http://test.taianting.com:3000/api/",//认证的url
    apiurl_mt: "http://test.taianting.com:4000/api/",//命题的url
    apiurl_kw: "http://test.taianting.com:4100/api/",//考务的url
    apiurl_tj: "http://test.taianting.com:4300/api/",//统计的url
    apiurl_bm: "http://test.taianting.com:4400/api/",//报名的url
    apiurl_gg: "http://test.taianting.com:5500/",//公共的url
    apiurl_sm: "http://test.taianting.com:4280/",//扫描的url

    //apiurl_rz: "http://www.zhifz.com:3000/api/",//认证的url
    //apiurl_mt: "http://www.zhifz.com:4000/api/",//命题的url
    //apiurl_kw: "http://www.zhifz.com:4100/api/",//考务的url
    //apiurl_tj: "http://www.zhifz.com:4300/api/",//统计的url
    //apiurl_bm: "http://www.zhifz.com:4400/api/",//报名的url
    //apiurl_gg: "http://www.zhifz.com:5500/",//公共的url
    //apiurl_sm: "http://www.zhifz.com:4280/",//扫描的url

    //apiurl_rz: "/renzheng/",//认证的url
    //apiurl_mt: "/mingti/",//命题的url
    //apiurl_kw: "/kaowu/",//考务的url
    //apiurl_tj: "/tongji/",//统计的url
    //apiurl_bm: "/baoming/",//报名的url
    //apiurl_gg: "/gonggong/",//公共的url
    //apiurl_sm: "/saomiao/",//扫描的url
    secret: '076ee61d63aa10a125ea872411e433b9',
    hostname: 'localhost:3000',
    letterArr: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
      'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'], //英文字母序号数组
    cnNumArr: ['一','二','三','四','五','六','七','八','九','十','十一','十二','十三','十四','十五','十六','十七','十八','十九',
      '二十'], //中文数字序号数组
    routes: {
      '/mingti': {
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
      //'/lingyu': {
      //  templateUrl: '../views/renzheng/selectLingYu.html',
      //  controller: 'RenzhengCtrl',
      //  requireLogin: true
      //},
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
      }
    ],
    tiXingArr: ['单选题', '多选题','判断题','填空题','计算题','证明题','解答题'],
    imgType: ['.jpg', '.jpeg', '.png', '.gif', '.bmp'],
    videoType: ['.ogv', '.mp4', '.avi', '.mkv', '.wmv'],
    audioType: ['.ogg', '.mp3', '.wav'],
    uploadFileSizeLimit: 2097152, //上传文件的大小限制2MB
    loginUsr: '' //登录用户
  };
});
