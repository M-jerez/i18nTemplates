# grunt-i18nTemplates

> i18n for front-end templates.

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-i18nTemplates --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-i18nTemplates');
```

## The "i18nTemplates" task

### Overview
In your project's Gruntfile, add a section named `i18nTemplates` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  i18nTemplates: {
  	options: {
    	locales: \["en","es","de"\],
        templatesFolder: "./public/templates", //this is where the translated templates will be generated
        localesFolder: "./src/locales"  //this is where translation files will be stored	
   	},
  	your_target: {
       src: ['./src/templates/**/*.html']
    },
  },
});
```

### Options (Required) !!IMPORTANT: if this options are not configured the system will throw an exception!!

#### options.templatesFolder
Type: `String`
Default value: `none`

A path to the templates folder.

#### options.localesFolder
Type: `String`
Default value: `none`

A path to the locales folder.

### Options

#### options.locales
Type: `Array`
Default value: `none`

An Array defining all the languages. i.e: `\["en","es","de"\]`

### Usage Examples
This example will generate 4 locale files, one for each language, and will generate 5 templates files, one for each language plus the original one.
```js
grunt.initConfig({
  i18nTemplates: {
  	options: {
    	locales: \["en","es","de"\],
        templatesFolder: "./public/templates", //this is where the translated templates will be generated
        localesFolder: "./src/locales"  //this is where translation files will be stored	
   	},
  	your_target: {
       src: ['./src/templates/**/*.html']
    },
  },
});
```

## Release History
`0.1.0`  first working version. 
