
var Nightmare =  require('nightmare');
var express = require('express');
var Promise = require('bluebird');
var _ = require('lodash');
var fs = require('fs');

/**
 * @name fs
 * @property writeFile
 * @property W_OK
 * @property accessSync
 */

module.exports = FontMetricsParser;

/**
 *
 * @param [options] {Object} Initial data
 * @returns {FontMetricsParser}
 * @constructor
 */
function FontMetricsParser (options) {

	if (!(this instanceof FontMetricsParser)) {
		return new FontMetricsParser(options);
	}

	options = _.isPlainObject(options) ? options : {};

	this.defaultConfiguration = {
		parser: {
			// css file containing required font-family names
			css: null,
			// font-family names
			fonts: [], // font-family names to create map for
			debug: true,
			output: './'
		},
		express: {
			port: 3000
		},
		nightmare: {
			show: false,
			webPreferences: {
				experimentalCanvasFeatures: true
			}
		}
	};

	this.configuration = _.merge({}, this.defaultConfiguration, options);

	this.browser = null;

	this.canvasPageURL = 'http://localhost:' + this.configuration.express.port + '/';

}

/**
 * Parse fonts
 */
FontMetricsParser.prototype.parse = function () {

	var self = this;

	self.validateConfiguration().then(function () {
		return self.createServer();
	}).then(function () {
		return self.createBrowser();
	}).then(function () {
		return self.parseFonts();
	}).catch(function (err) {
		console.log('Parse was rejected.');
		console.log(err);
	});

};

/**
 * Validate configuration.
 * Provide any additional checks to ensure configuration is valid for parsing.
 */
FontMetricsParser.prototype.validateConfiguration = function () {

	var self = this;

	return new Promise(function (resolve, reject) {

		var isValid = true;
		var reason = '';
		var config = self.configuration;
		var fonts = config.parser.fonts;
		var path = config.parser.output;

		// check fonts to be an array of strings
		if (!_.isArray(fonts) || !fonts.length || fonts.some(function (fontFamily) {return !_.isString(fontFamily)})) {
			isValid = false;
			reason = 'Fonts is not an array of strings.';
		}

		// output path should be a string
		if (!_.isString(path)) {
			isValid = false;
			reason = 'Output path is not a string';
		}

		// TODO: add fs.exists and fs.access validation

		isValid ? resolve() : reject(reason);

	});

};

/**
 * Create express server
 */
FontMetricsParser.prototype.createServer = function () {

	var self = this;

	return new Promise(function (resolve, reject) {

		if (self.expressApp instanceof express) {
			resolve();
		} else {
			self.expressApp = express();
			self.expressApp.use(express.static('pages'));
			self.expressApp.listen(self.configuration.express.port, function () {
				console.log('Express is running on port ' + self.configuration.express.port);
				resolve();
			});
		}

	});

};

/**
 * Create nightmare instance
 */
FontMetricsParser.prototype.createBrowser = function () {

	var self = this;

	console.log('createBrowser was called');

	return new Promise(function (resolve, reject) {

		if (self.browser instanceof Nightmare) {
			resolve();
		} else {
			self.browser = Nightmare(self.configuration.nightmare);
			resolve();
		}

	});

};

/**
 * Parse font by navigating via nightmare to html page served by express and running calculations
 */
FontMetricsParser.prototype.parseFonts = function () {

	var self = this;

	console.log('parseFonts was called.');

	return new Promise(function (resolve, reject) {
		/**
		 * @name self.browser
		 * @instanceof Nightmare
		 */
		self.browser
			.goto(self.canvasPageURL)
			.inject('css', self.configuration.parser.css)
			.evaluate(function (fonts) {

				var fontsMap = {
					__initialFonts: fonts.slice()
				};

				var canvas = document.getElementById('canvas');
				var ctx = canvas.getContext('2d');
				ctx.textBaseline = 'alphabetical';

				fonts.forEach(function (fontFamily) {
					ctx.font = '30px ' + fontFamily;
					var fontMetrics = ctx.measureText('Example');

					// TODO: find a way to merge properties from fontMetrics to new object
					// JSON, assign - doesn't work

					fontsMap[fontFamily] = {
						width: fontMetrics.width,
						actualBoundingBoxLeft: fontMetrics.actualBoundingBoxLeft,
						actualBoundingBoxRight: fontMetrics.actualBoundingBoxRight,
						fontBoundingBoxAscent: fontMetrics.fontBoundingBoxAscent,
						fontBoundingBoxDescent: fontMetrics.fontBoundingBoxDescent,
						actualBoundingBoxAscent: fontMetrics.actualBoundingBoxAscent,
						actualBoundingBoxDescent: fontMetrics.actualBoundingBoxDescent,
						emHeightAscent: fontMetrics.emHeightAscent,
						emHeightDescent: fontMetrics.emHeightDescent,
						hangingBaseline: fontMetrics.hangingBaseline,
						alphabeticBaseline: fontMetrics.alphabeticBaseline,
						ideographicBaseline: fontMetrics.ideographicBaseline
					}

				});

				return fontsMap;

			}, self.configuration.parser.fonts)
			.then(function (result) {
				self.saveResult(result);
			})
			.catch(function (error) {
				console.error('Error:', error);
			});

	});

};

FontMetricsParser.prototype.saveResult = function (data) {

	// TODO: add output path support

	fs.writeFile('fontsMap.json', JSON.stringify(data, null, 4), function (err) {
		if (err) {
			 throw new Error(err);
		}
		console.log('Done');
	});

};


