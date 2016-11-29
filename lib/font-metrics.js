
var Nightmare =  require('nightmare');
var express = require('express');
var Promise = require('bluebird');
var _ = require('lodash');
var fs = require('fs');


/*
 global process
 */

/**
 * @name fs
 * @property writeFile
 * @property W_OK
 * @property accessSync
 * @property existsSync
 * @property mkdirSync
 */

/**
 * @name process
 * @property exit
 */

module.exports = FontMetrics;

/**
 *
 * @param [options] {Object} Initial data
 * @returns {FontMetrics}
 * @constructor
 */
function FontMetrics (options) {

	if (!(this instanceof FontMetrics)) {
		return new FontMetrics(options);
	}

	options = _.isPlainObject(options) ? options : {};

	this.defaults = {
		parser: {
			fonts: [],
			debug: false,
			output: './',
			filename: 'fontMetrics.json',
			fontSize: 24
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

	this.config = _.merge({}, this.defaults, options);
	this.server = null;
	this.browser = null;
	this.canvasPageURL = 'http://localhost:' + this.config.express.port + '/';

}

/**
 * Parse fonts
 */
FontMetrics.prototype.parse = function () {

	var self = this;

	self.validateConfiguration().then(function () {
		return self.createServer();
	}).then(function () {
		return self.createBrowser();
	}).then(function () {
		return self.parseFonts();
	}).catch(function (err) {
		throw new Error(err);
	});

};

/**
 * Validate configuration.
 * Provide any additional checks to ensure configuration is valid for parsing.
 */
FontMetrics.prototype.validateConfiguration = function () {

	var self = this;

	return new Promise(function (resolve, reject) {

		var isValid = true;
		var reason = '';
		var config = self.config;
		var fonts = config.parser.fonts;
		var path = config.parser.output;

		// check fonts to be an array of objects. Each object should contain:
		// fontFamily {String}
		// [src] {String}
		var fontDataFormatIsValid = _.isArray(fonts) && fonts.length;
		var fontDataPropertiesAreValid = !fonts.some(function (fontData) {
			// should be Object.
			// should contain "fontFamily" property
			// could contain "src" property
			return !_.isPlainObject(fontData) || !_.isString(fontData.fontFamily || (fontData.hasOwnProperty('src') && !_.isString(fontData.src)))
		});

		if (!fontDataFormatIsValid) {
			isValid = false;
			reason = 'Fonts property expected to be an array.';
		}

		if (!fontDataPropertiesAreValid) {
			isValid = false;
			reason = 'Fonts property contains data with invalid format.';
		}

		// output path should be a string
		if (!_.isString(path)) {
			isValid = false;
			reason = 'Output path is not a string';
		}

		var fontSize = self.config.parser.fontSize;
		if (!_.isNumber(fontSize) || isNaN(fontSize) || fontSize < 0) {
			isValid = false;
			reason = 'fontSize is not a valid positive number';
		}

		isValid ? resolve() : reject(reason);

	});

};

/**
 * Create express server
 */
FontMetrics.prototype.createServer = function () {

	var self = this;

	return new Promise(function (resolve, reject) {

		if (self.server instanceof express) {
			resolve();
		} else {
			self.server = express();
			self.server.use(express.static('pages'));
			self.server.listen(self.config.express.port, function () {
				self.log('Express is running on port ' + self.config.express.port);
				resolve();
			});
		}

	});

};

/**
 * Create nightmare instance
 */
FontMetrics.prototype.createBrowser = function () {

	var self = this;

	return new Promise(function (resolve, reject) {

		if (self.browser instanceof Nightmare) {
			resolve();
		} else {
			self.browser = Nightmare(self.config.nightmare);
			resolve();
		}

	});

};

/**
 * Parse font by navigating via nightmare to html page served by express and running calculations
 */
FontMetrics.prototype.parseFonts = function () {

	var self = this;

	return new Promise(function (resolve, reject) {
		/**
		 * @name self.browser
		 * @instanceof Nightmare
		 */
		self.browser
			.goto(self.canvasPageURL)
			.evaluate(function (data) {

				// for browser scope use window.Promise
				return new window.Promise(function (resolve, reject) {

					var fontsLoaded = [];

					var fonts = data.fonts;
					var fontSize = data.fontSize;

					var fontsMap = {
						__initialFonts: fonts
					};

					fonts.forEach(function (fontData) {
						// load font only when src property is specified.
						if (typeof fontData.src === 'string') {
							fontsLoaded.push(loadFont(fontData.fontFamily, fontData.src));
						}
					});

					window.Promise.all(fontsLoaded).then(function () {

						var canvas = document.getElementById('canvas');
						var ctx = canvas.getContext('2d');
						ctx.textBaseline = 'alphabetical';

						fonts.forEach(function (fontData) {
							ctx.font = fontSize + 'px ' + fontData.fontFamily;
							var fontMetrics = ctx.measureText('Example');

							// TODO: find a way to merge properties from fontMetrics to new object
							// JSON, Object.assign - doesn't work

							fontsMap[fontData.fontFamily] = {
								_textBaseline: ctx.textBaseline,
								_fontSize: fontSize,
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

						resolve(fontsMap);

					}).catch(function (err) {
						reject(err);
					});

					/**
					 *
					 * @param fontFamily {String} Font-family name
					 * @param fontUrl {String} Font src
					 * @returns {Promise}
					 */
					function loadFont (fontFamily, fontUrl) {
						return new window.Promise(function (resolve, reject) {
							/**
							 * @namespace FontFace
							 * @type {Function}
							 * @propertyof window
							 * @property load
							 */

							/**
							 * @name font
							 * @instanceof FontFace
							 */

							var fontface = new window.FontFace(fontFamily, 'url(' + fontUrl +')');
							fontface.load().then(function () {
								document.fonts.add(fontface);
								resolve(fontFamily);
							});
						})
					}

				});

			}, {
				fonts: self.config.parser.fonts,
				fontSize: self.config.parser.fontSize
			})
			.end()
			.then(function (result) {
				self.saveResult(result);
			})
			.then(function () {
				self.log('Fonts were parsed.');
			})
			.catch(function (err) {
				throw new Error(err);
			});

	});

};

FontMetrics.prototype.saveResult = function (data) {

	var self = this;

	return new Promise(function (resolve, reject) {

		var finalPath = self.config.parser.output.split('/').reduce(function (prev, next) {
			if (!_.isString(prev) || !prev.length) {
				return prev;
			}
			var checkPath = prev + '/' + next;
			if (!fs.existsSync(checkPath)) {
				fs.mkdirSync(checkPath);
			}
			return checkPath;
		}, './');

		if (finalPath[finalPath.length - 1] !== '/') {
			finalPath += '/';
		}

		fs.writeFile(finalPath + self.config.parser.filename, JSON.stringify(data, null, 4), function (err) {
			if (err) {
				reject(err);
			} else {
				resolve();
			}
		});
	});

};

FontMetrics.prototype.finish = function () {

	this.server.close();

};

FontMetrics.prototype.log = function (msg, type) {
	if (this.config.parser.debug) {
		console[type || 'log'](msg);
	}
};


