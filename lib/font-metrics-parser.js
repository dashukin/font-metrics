
var Nightmare =  require('nightmare');
var express = require('express');
var Promise = require('bluebird');
var _ = require('lodash');

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
			fonts: [],
			debug: false
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

FontMetricsParser.prototype.parse = function () {

	var self = this;

	self.createServer().then(function () {
		return self.createBrowser();
	}).then(function () {
		return self.parseFonts();
	});

};

/**
 * Create express server
 */
FontMetricsParser.prototype.createServer = function () {

	var self = this;

	console.log('createServer was called');

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
			.evaluate(function () {

				// TODO: inject font-face

				// TODO: calculate font-metrics

				return;

			})
			.then(function (result) {
				console.log(result, '!!!');
				// TODO: save results
			})
			// .evaluate(self.getMetricslo)
			// .then(function (result) {
			// 	self.saveResult(result);
			// })
			.catch(function (error) {
				console.error('Error:', error);
			});

	});

};

FontMetricsParser.prototype.injectFonts = function () {

	return document.querySelector('canvas').width;

};

FontMetricsParser.prototype.getMetrics = function () {

	return;

};

FontMetricsParser.prototype.saveResult = function (data) {

	console.log('save results', data);

};

function createParser () {

	var app = express();
	app.use(express.static('pages'));
	app.listen(portNumber, function () {
		console.log('Express is running on port ' + portNumber);

		var nightmare = Nightmare({
			webPreferences: {
				experimentalCanvasFeatures: true
			}
		});



	});

}










