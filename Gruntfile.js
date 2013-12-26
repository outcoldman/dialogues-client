module.exports = function(grunt) {
  'use strict';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      files: ['Gruntfile.js', 'lib/**/*.js'],
      options: {
        // options here to override JSHint defaults
        globals: {
          jQuery: true,
          document: true,
          require: true
        }
      }
    },

    // Compile without minifying scripts
    requirejs: {
      // Compile one script, which does not depend on requirejs
      compile_dlgs: {
        options: {
          baseUrl: './lib',
          optimize: 'none',
          name: '../bower_components/almond/almond',
          include: 'dialogues',
          out: 'build/dlgs.js',
          wrap: true
        }
      },
      // Compile script with dependency on requirejs
      compile_dlgs_require: {
        options: {
          baseUrl: './lib',
          optimize: 'none',
          name: 'dialogues',
          out: 'build/dlgs.require.js',
          wrap: false
        }
      }
    },

    // Minifying 
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %> */'
      },
      my_target: {
        files: {
          'build/dlgs.min.js': ['build/dlgs.js'],
          'build/dlgs.require.min.js': ['build/dlgs.require.js']
        }
      }
    },

    // Development
    watch: {
      scripts: {
        files: 'lib/**/*.js',
        tasks: ['jshint']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('build', ['jshint', 'requirejs', 'uglify']);
  grunt.registerTask('default', ['watch']);
};