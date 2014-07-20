/*
 * grunt-i18nTemplates
 * https://github.com/M-jerez/i18nTemplates
 *
 * Copyright (c) 2014 M-Jerez
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('i18nTemplates', 'i18n for front-end templates.', function() {
	  var tm = require("./translatorManager")(grunt);

	  // Check options.
	  var options = this.options();
	  if (!options.templatesFolder || !options.localesFolder)
		  throw grunt.util.error(
				  "grunt config options.templatesFolder and options.localesFolder required.\n" +
				  "i.e: options{templatesFolder:'./public/html',localesFolder:'./locales'}");
	  else{
		  tm.setLocalesFolder(options.localesFolder);
		  tm.setTemplatesFolder(options.templatesFolder);
	  }
	  if(options.locales && options.locales instanceof Array)
		  tm.setLocales(options.locales);
	  else if(options.locales)
		  throw grunt.util.error("grunt config options locales must be and array i.e: ['en','de','es']");

	  // parse each file to find i18n definitions.
	  this.files.forEach(function (file) {
		  file.src.forEach(function (filePath) {
			  tm.parseFile(filePath);
		  });
	  });

	  // Generate the translated version and save them into json files.
	  // Also generated the locales files.
	  tm.save();
  });

};
