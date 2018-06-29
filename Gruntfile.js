module.exports = function (grunt) {

  // 配置Grunt各种模块的参数
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: { /* jshint的参数 */ },
    concat: { 
      jui:{
        files:{
          'dist/assets/js/jui/jui.js':[
            "assets/js/jui/utils.js",
            "assets/js/jui/mixins/compositMixin.js",
            "assets/js/jui/mixins/dataMixin.js",
            "assets/js/jui/mixins/templateMixin.js",
            "assets/js/jui/jcomponent.js",
            "assets/js/jui/jtmpl.js",
            "assets/js/jui/misc/jpager.js",
            "assets/js/jui/misc/jcollapse.js",
            "assets/js/jui/layers/jlayer.js",
            "assets/js/jui/layers/jpop.js",
            "assets/js/jui/layers/jlayer.modal.js",
            "assets/js/jui/layers/jlayer.alert.js",
            "assets/js/jui/layers/jlayer.tip.js",
            "assets/js/jui/utils.ajax.js",
            "assets/js/jui/spa.js",
            "assets/js/jui/lists/jlist.js",
            "assets/js/jui/lists/jlistMenu.js",
            "assets/js/jui/lists/jlistTabs.js",
            "assets/js/jui/lists/jlistSteps.js",
            "assets/js/jui/lists/jlistGrid.js",
            "assets/js/jui/lists/jlistCommands.js",
            "assets/js/jui/lists/jlistWithCommands.js",
            "assets/js/jui/forms/jinput.js",
            "assets/js/jui/forms/jtextbox.js",
            "assets/js/jui/forms/jtextarea.js",
            "assets/js/jui/forms/jnumberbox.js",
            "assets/js/jui/forms/jcheckbox.js",
            "assets/js/jui/forms/jradiolist.js",
            "assets/js/jui/forms/jcheckboxlist.js",
            "assets/js/jui/forms/jselect.js",
            "assets/js/jui/forms/jdatepicker.js",
            "assets/js/jui/forms/jinputrepeat.js",
            "assets/js/jui/forms/jinputgroup.js",
            "assets/js/jui/forms/jtagbox.js",
            "assets/js/jui/forms/jformCommands.js"
          ]
        }
      }
    },


    requirejs: {
      //compile: {
      //  options: {
      //    include: ["juiall"],
      //    baseUrl: "./assets/js/jui",
      //    mainConfigFile: "build.js",
      //    out: "dist/assets/jui/jui.js"
      //  }
      //}
      compile: {
        options: {
          baseUrl: "./",
          paths: {
            jquery: "assets/js/jquery-1.11.3",
            jqueryui: "assets/js/jquery-ui",
            text: "assets/js/text",
            juiall: "assets/js/jui/juiall",
            "jui/template":"assets/js/jui/template",
            "jui/utils":"assets/js/jui/utils",
            "jui/mixins/compositMixin":"assets/js/jui/mixins/compositMixin",
            "jui/mixins/dataMixin":"assets/js/jui/mixins/dataMixin",
            "jui/mixins/templateMixin":"assets/js/jui/mixins/templateMixin",
            "jui/jcomponent":"assets/js/jui/jcomponent",
            "jui/jtmpl":"assets/js/jui/jtmpl",
            "jui/misc/jpager":"assets/js/jui/misc/jpager",
            "jui/misc/jcollapse":"assets/js/jui/misc/jcollapse",
            "jui/layers/jlayer":"assets/js/jui/layers/jlayer",
            "jui/layers/jpop":"assets/js/jui/layers/jpop",
            "jui/layers/jlayer.modal":"assets/js/jui/layers/jlayer.modal",
            "jui/layers/jlayer.alert":"assets/js/jui/layers/jlayer.alert",
            "jui/layers/jlayer.tip":"assets/js/jui/layers/jlayer.tip",
            "jui/utils.ajax":"assets/js/jui/utils.ajax",
            "jui/spa":"assets/js/jui/spa",
            "jui/lists/jlist":"assets/js/jui/lists/jlist",
            "jui/lists/jlistMenu":"assets/js/jui/lists/jlistMenu",
            "jui/lists/jlistTabs":"assets/js/jui/lists/jlistTabs",
            "jui/lists/jlistSteps":"assets/js/jui/lists/jlistSteps",
            "jui/lists/jlistGrid":"assets/js/jui/lists/jlistGrid",
            "jui/lists/jlistCommands":"assets/js/jui/lists/jlistCommands",
            "jui/lists/jlistWithCommands":"assets/js/jui/lists/jlistWithCommands",
            "jui/forms/jinput":"assets/js/jui/forms/jinput",
            "jui/forms/jtextbox":"assets/js/jui/forms/jtextbox",
            "jui/forms/jtextarea":"assets/js/jui/forms/jtextarea",
            "jui/forms/jnumberbox":"assets/js/jui/forms/jnumberbox",
            "jui/forms/jcheckbox":"assets/js/jui/forms/jcheckbox",
            "jui/forms/jradiolist":"assets/js/jui/forms/jradiolist",
            "jui/forms/jcheckboxlist":"assets/js/jui/forms/jcheckboxlist",
            "jui/forms/jselect":"assets/js/jui/forms/jselect",
            "jui/forms/jdatepicker":"assets/js/jui/forms/jdatepicker",
            "jui/forms/jinputrepeat":"assets/js/jui/forms/jinputrepeat",
            "jui/forms/jinputgroup":"assets/js/jui/forms/jinputgroup",
            "jui/forms/jtagbox":"assets/js/jui/forms/jtagbox",
            "jui/forms/jformCommands":"assets/js/jui/forms/jformCommands"
          },
          exclude: ["jquery", "jqueryui", "text"],
          include: ["juiall"],
          out: "dist/assets/js/jui/jui.js"
        }
      }
    },



    //less编译插件
    less: {

      task1: {
        options: {
          compress: false,
          yuicompress: false
        },
        files: {
          "dist/assets/css/jui.css": "assets/less/jui.less",

          //...
        }
      }

    },




//js压缩配置
    uglify: {
      build: {
        src: 'dist/assets/js/jui/jui.js',//源文件
        dest: 'dist/assets/js/jui/jui.min.js'//压缩文件  
      }
    },


    //拷贝文件配置
    copy: {
      main: {
        files: [

          { expand: false, src: ['index.html'], dest: 'dist/' },
          { expand: false, src: ['app.js'], dest: 'dist/' },
          { expand: true, src: ['assets/js/jquery.slimscroll.min.js'], dest: 'dist' },

          { expand: true, src: ['assets/js/jquery-1.11.3.js'], dest: 'dist' },
          { expand: true, src: ['assets/js/jquery-1.11.3.min.js'], dest: 'dist' },
          { expand: true, src: ['assets/js/jquery-ui.js'], dest: 'dist' },
          { expand: true, src: ['assets/js/jquery-ui.min.js'], dest: 'dist' },
          { expand: true, src: ['assets/js/mock.js'], dest: 'dist' },
          { expand: true, src: ['assets/js/modernizr-2.6.2.js'], dest: 'dist' },
          { expand: true, src: ['assets/js/prettify.js'], dest: 'dist' },
          { expand: true, src: ['assets/js/require.js'], dest: 'dist' },
          { expand: true, src: ['assets/js/respond.min.js'], dest: 'dist' },
          { expand: true, src: ['assets/js/text.js'], dest: 'dist' },
          { expand: true, src: ['assets/js/jui/template.js'], dest: 'dist' },
          { expand: true, src: ['assets/js/jui/utils.js'], dest: 'dist' },

          { expand: true, cwd: 'views', src: ['**'], dest: 'dist/views' },
          { expand: true, cwd: 'assets/css', src: ['**'], dest: 'dist/assets/css' },
          { expand: true, cwd: 'assets/fonts', src: ['**'], dest: 'dist/assets/fonts' },
          { expand: true, cwd: 'assets/img', src: ['**'], dest: 'dist/assets/img' },
          { expand: true, cwd: 'assets/js/i18n', src: ['**'], dest: 'dist/assets/js/i18n' },
          
        
        ],
      },
    },


  });

  // 从node_modules目录加载模块文件
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-requirejs');


  // 每行registerTask定义一个任务
  grunt.registerTask('default', ['copy','requirejs','uglify',  'less']);

};
