
var Nightmare =  require('nightmare');
var express = require('express');
var Promise = require('bluebird');
var _ = require('lodash');
var fse = require('fs-extra');
var path = require('path');


/*
 global process, __dirname
 */

/**
 * @name fse
 * @property outputFile
 */

/**
 * @name process
 * @property exit
 */

module.exports = FontMetrics;

/**
 *
 * @param options {Object} Initial data
 * @param options.fonts {Object[]} Font data
 * @param options.fonts.fontFamily {String} Font family
 * @param options.fonts.src {String} External path to font source
 * @param options.debug {Boolean} If debugging should on
 * @param options.output {String} Output dir path
 * @param options.filename {String} Output file name
 * @param options.fontSize {Number} Font size that should be used when measuring text on canvas.
 * @param [express] {Object} Express server options
 * @param [express.port] {Number} Express port to run on
 * @param [express.mount] {Object[]} Additional directories that could be mounted to Express server.
 * 										Usefull for parsing font files served locally.
 * @param [express.mount.alias] {String} Local path alias
 * @param [express.mount.path] {String} Local path that could be used for using static files
 * @returns {FontMetrics}
 * @constructor
 */
function FontMetrics (options) {

	if (!(this instanceof FontMetrics)) {
		return new FontMetrics(options);
	}

	options = _.isPlainObject(options) ? options : {};

	this.name = 'FontMetrics';

	this.defaults = {
		fonts: [],
		debug: false,
		output: './',
		filename: 'fontMetrics.json',
		fontSize: 24,
		express: {
			port: 3000,
			mount: []
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

	self.log('let\'s go!');

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

	self.log('validating configuration...');

	return new Promise(function (resolve, reject) {

		var isValid = true;
		var reason = '';
		var config = self.config;
		var fonts = config.fonts;
		var path = config.output;

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

		var fontSize = self.config.fontSize;
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

	self.log('initializing server...');

	return new Promise(function (resolve, reject) {

		var virtualPaths;

		if (self.server instanceof express) {
			resolve();
		} else {
			self.server = express();
			self.server.use(express.static(path.join(__dirname, '..', 'pages')));

			virtualPaths = _.get(self, 'config.express.mount', []);

			if (_.isArray(virtualPaths)) {
				virtualPaths.forEach(function (pathData) {

					var alias = path.resolve('/', pathData.alias);
					var virtualPath = path.resolve(pathData.path);

					self.server.use(alias, express.static(virtualPath));
				});
			}

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

	self.log('running browser...');

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

	self.log('parsing fonts...');

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
						src: fonts,
						metrics: {}
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

							fontsMap.metrics[fontData.fontFamily] = {
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
							}).catch(function (err) {
								reject('Failed to load ' + fontFamily);
							});
						})
					}

				});

			}, {
				fonts: self.config.fonts,
				fontSize: self.config.fontSize
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

	self.log('saving result...');

	return new Promise(function (resolve, reject) {

		var finalPath = path.resolve(self.config.output, self.config.filename);

		fse.outputFile(finalPath, JSON.stringify(data, null, 4), function (err) {
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
	if (this.config.debug) {
		console[type || 'log'](this.name + ': ' + msg);
	}
};


