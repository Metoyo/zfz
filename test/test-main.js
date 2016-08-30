var tests = [];
for (var file in window.__karma__.files) {
  if (window.__karma__.files.hasOwnProperty(file)) {
    // Removed "Spec" naming from files
    if (/Spec\.js$/.test(file)) {
      tests.push(file);
    }
  }
}

requirejs.config({
    // Karma serves files from '/base'
    baseUrl: '/base/app/scripts',

    paths: {
    angular: '../../bower_components/angular/angular',
    'angular-cookies': '../../bower_components/angular-cookies/angular-cookies',
    'angular-resource': '../../bower_components/angular-resource/angular-resource',
    'angular-route': '../../bower_components/angular-route/angular-route',
    'angular-sanitize': '../../bower_components/angular-sanitize/angular-sanitize',
    jquery: '../../bower_components/jquery/jquery.min',
    charts: '../../bower_components/echarts/echarts',
    bootstrap: '../../bower_components/bootstrap/dist/js/bootstrap',
    markitup: '../../bower_components/markitup/jquery.markitup-1.1.14.min',
    setJs: '../../bower_components/markitup/set.min',
    datepicker: '../../bower_components/intimidatetime/intimidatetime',
    lazy: '../../bower_components/lazy.js/lazy'
  },

    shim: {
        'angular' : {'exports' : 'angular'},
        'angular-route': ['angular'],
        'angular-cookies': ['angular'],
        'angular-sanitize': ['angular'],
        'angular-resource': ['angular'],
        'angular-animate': ['angular'],
        'angular-touch': ['angular'],
        'angular-mocks': {
          deps:['angular'],
          'exports':'angular.mock'
        }
    },

    // ask Require.js to load these files (all our tests)
    deps: tests,

    // start test run, once Require.js is done
    callback: window.__karma__.start
});
