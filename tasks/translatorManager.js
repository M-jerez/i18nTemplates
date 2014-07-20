/**
 * Copyright (C) 2014 Ma-Jerez
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * Created by Ma-Jerez on 15/07/2014.
 */
'use strict';
var path = require('path');
var fs = require("fs");

function TranslatorManager(grunt) {


	var self = this;

	/**
	 * This regexp match any expression between two double brackets.
	 * Each expression found represents a locale definition with a name or "key" and
	 * optional a default text to be shown.
	 * i.e: [[hello: this is text]]
	 * Everything after the first ":" is considered text, and everything before is the
	 * Definition's name, only letters and numbers allowed for the name.
	 * @type {RegExp}
	 */
	this.delimiters = /\[\[.+\]\]/g;

	/**
	 * Stores a record of all the files to check there are no duplicated fileNames.
	 * fNames = {
	 * 	  "hello":"/users/home/...../hello.html",
	 * 	  "world":"/users/home/...../world.html"
	 * }
	 * @type {{}}
	 */
	this.fNames = {};

	/**
	 * Stores a record of all the locale Definitions and their lines in the files.
	 * Check that there are no two Definitions with the same name or "key".
	 * The key of each entry is formed by the filename+definitionName so it is
	 * possible to use the same name or "key" in different files.
	 * i.e: [[hello: Hello World]] and [[hello: What's Up]] has the same name "hello",
	 * but it is ok until they are not in the same file.
	 * defLines = {
	 * 	 "filename:hello":"this is the hello text",
	 * 	 "filename:person":"this is the person name"
	 * }
	 * @type {{}}
	 */
	this.defLines = {};

	/**
	 * Stores all the templates and an the translated templates.
	 * Each entry of this object is saved as json and contains all the templates, so they can be
	 * easily accessed in javascript.
	 * @type {{original: {}}}
	 */
	this.templates = {original: {}/* ,en:{},es:{},de:{},fr:{} */};

	/**
	 * Stores all the translations values.
	 * Each entry of this object is saved as json and is a translation file used to generate
	 * the translated templates.
	 * @type {{original: {}}}
	 */
	this.locales = {original: {}/* ,en:{},es:{},de:{},fr:{} */};


	/**
	 * The folder's path where the locales files will be generated.
	 * @type {null}
	 */
	this.localesFolder = "./locales";

	/**
	 * The folder's path where the templates files will be generated.
	 * @type {null}
	 */
	this.templatesFolder = "./templates";

	/**
	 * Suffix used as suffix of the generated templates files.
	 * template fileName = lang + "_" +  templatesSuffix
	 * @type {string}
	 */
	this.templatesSuffix = "html.json";

	/**
	 * Suffix used as suffix of the generated language files.
	 * language fileName = lang + "_" +  localesSuffix
	 * @type {string}
	 */
	this.localesSuffix = ".json";


	// ########################################################################################
	// 										METHODS
	// ########################################################################################

	/**
	 * Sets the languages to use.
	 * @param locales array("es","en","de"...)
	 */
	this.setLocales = function setLocales(locales) {
		for (var i = 0; i < locales.length; i++) {
			this.templates[locales[i]] = {};
			this.locales[locales[i]] = {};
		}
	};

	/**
	 * Sets the folder where the translation files will be generated.
	 * @param path
	 */
	this.setLocalesFolder = function setLocalesFolder(path) {
		this.localesFolder = path;
	};

	/**
	 * Sets the folder where the templates files will be generated.
	 * @param path
	 */
	this.setTemplatesFolder = function setTemplatesFolder(path) {
		this.templatesFolder = path;
	};

	/**
	 * Parse one file to generates the json template files and the translation files.
	 * @param filePath
	 */
	this.parseFile = function parseFile(filePath) {
		if (!grunt.file.exists(filePath))
			return false;
		// Read and return the file's source.
		var content = grunt.file.read(filePath);
		var fileName = getFileNameNoExt(filePath);
		this.checkDuplicateName(fileName, filePath);
		this.parseLocales(filePath, fileName, content);
	};


	this.save = function save(){
		this.overrideNewLocales();
		this.generateNewTemplates();
		this.saveLocales();
		this.saveTemplates();
	};

	/**
	 * Checks if the name has been used before as key in the templates object, if so
	 * throws an error indicating the filePath of the two files with the same name.
	 * To do that the function make use of the variable fNames that keep track of all the filePaths
	 * and fileNames previously inserted.
	 * @param fileName
	 * @param filePath
	 */
	this.checkDuplicateName = function checkDuplicateName(fileName, filePath) {
		if (typeof this.fNames[fileName] !== 'undefined') {
			throw grunt.util.error("Two files found with the same name '" + fileName
				+ "'\n" + filePath + "\n" + this.fNames[fileName]);
		} else {
			this.fNames[fileName] = filePath;
		}
	};


	/**
	 * Search in the fileContent for locale definitions, i.e: "[[key: this is the text]]"
	 * and creates the key and values in this.locales[language] and this.templates[lang] objects.
	 * The search is split by lines, so it is not possible to create multi-line
	 * locale definitions i.e: "[[key: this is \n text]]".
	 * @param filePath
	 * @param fileName
	 * @param fileContent
	 */
	this.parseLocales = function parseLocales(filePath, fileName, fileContent) {
		var lines = fileContent.split("\n");
		for (var i = 0; i < lines.length; i++) {
			var line = lines[i];
			var match;
			while ((match = this.delimiters.exec(line)) !== null) {
				var definition = match[0].substring(2, match[0].length - 2);
				var sepIndex = definition.indexOf(":");
				var key, sentence;
				// [[key : text]]
				if(sepIndex > 0){
					key = fileName + ":" + definition.substring(0, sepIndex);
					sentence = definition.substring(sepIndex + 1, definition.length);
				}
				// [[key]]
				else{
					key = fileName + ":" + definition;
					sentence = definition;
				}

				if (typeof this.defLines[key] === 'undefined') {
					this.defLines[key] = i;
				} else {
					throw grunt.util.error("Two i18n definitions found with the same name '"
						+ key + "' in \n" + filePath + " line " + i + " and " + this.defLines[key]);
				}

				Object.keys(this.locales).forEach(function (lang) {
					self.templates[lang][fileName] = fileContent;
					self.locales[lang][key] = sentence;
				});
			}
		}
	};


	/**
	 * Generates the new templates based on the values read from the locales files and reemplacing
	 * in the templates final files.
	 */
	this.generateNewTemplates = function generateNewTemplates() {
		Object.keys(this.templates).forEach(function(lang){
			Object.keys( self.templates[lang]).forEach(function(tplName){
				var content = self.templates[lang][tplName];
				self.templates[lang][tplName] = content.replace(self.delimiters, function (match) {
					var definition = match.substring(2, match.length - 2);
					var sepIndex = definition.indexOf(":");
					var key;
					if(sepIndex > 0)
						key = tplName + ":" + definition.substring(0, sepIndex);
					else
						key = tplName + ":" + definition;

					var sentence = self.locales[lang][key];
					if (!sentence) {
						sentence = self.locales.original[key];
						console.log("Key '" + key + " in "
							+ lang + self.localesSuffix + "' Not found, used the value from the original template.");
					}
				});
			});
		});
	};


	/**
	 * Reads the existent locale files and override the values obtained from parse the templates
	 * with the values previously stores in the locales files, So the values in the locales files
	 * has priority over the new values in the templates.
	 */
	this.overrideNewLocales = function overrideNewLocales() {
		Object.keys(this.locales).forEach(function (lang) {
			if (lang !== "original"){
				var fName = path.join(self.localesFolder, lang + self.localesSuffix);
				try {
					var old = grunt.file.readJSON(fName);
					Object.keys(old).forEach(function (attrName) {
						self.locales[lang][attrName] = old[attrName];
					});
				} catch (fileNotFound) {
					// if the file does not exist locales is just not override.
				}
			}
		});
	};


	/**
	 * Saves the objects contained in this.templates to a file.
	 * Each field of this.templates object corresponds directly with one template file in a
	 * different language.
	 */
	this.saveTemplates = function saveTemplates() {
		console.log("\n#########  Template Files ########");
		Object.keys(this.locales).forEach(function (lang) {
			var prefix = (lang === "original")?"":lang+"_";
			var fName = path.join(self.templatesFolder, prefix + self.templatesSuffix);
			grunt.file.write(fName, JSON.stringify(self.templates[lang], null, '\t'));
			console.log(fName);
		});
	};

	/**
	 * Saves the objects contained in this.locales to a file.
	 * Each field of this.locales object corresponds directly with one translation file.
	 */
	this.saveLocales = function saveLocales() {
		console.log("\n#########  Locale Files ########");
		Object.keys(this.locales).forEach(function (lang) {
			if(lang !== "original"){
				var fName = path.join(self.localesFolder, lang + self.localesSuffix);
				grunt.file.write(fName, JSON.stringify(self.locales[lang], null, '\t'));
				console.log(fName);
			}
		});
	};


	/**
	 * Extracts the filename  and file extension from a given path and returns only the
	 * filename.
	 * @param filePath
	 * @returns String filename
	 */
	function getFileNameNoExt(filePath) {
		filePath = path.normalize(filePath);
		var split = filePath.split(path.sep);
		var fileName = split[split.length - 1];
		var dotPost = fileName.lastIndexOf(".");
		if (dotPost === 0)
			return fileName;
		else
			return fileName.substr(0, dotPost);
	}

}


module.exports = function(grunt){
	return new TranslatorManager(grunt);
};