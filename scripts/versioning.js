/*
 this hook replaces config values before build
 minifies files if requires
 updates android manifest as needed
*/

module.exports = function (context) {
	var Q = require('q');
	var deferral = new Q.defer();
	var exec = require('child_process').exec, child;

	var fs = require('fs');
	var path = require('path');

	var rootdir = context.opts.projectRoot;
	var isBuild = context.cmdLine.match(/.*(cordova build)/);
	var isPrepare = context.cmdLine.match(/.*(cordova prepare)/);
	var isRunning = context.cmdLine.match(/.*(cordova run)/);

	var browser_dir = path.join(rootdir, "platforms/browser");
	var android_dir = path.join(rootdir, "platforms/android");
	var ios_dir = path.join(rootdir, "platforms/ios");

	var source_www = path.join(rootdir, "www");
	var browser_www = path.join(browser_dir, "www");
	var android_www = path.join(android_dir, "app/src/main/assets/www");
	var ios_www = path.join(ios_dir, "www");

	var is_browser = context.opts.platforms.indexOf("browser") >= 0 ? true : false;
	var is_android = context.opts.platforms.indexOf("android") >= 0 ? true : false;
	var is_ios = context.opts.platforms.indexOf("ios") >= 0 ? true : false;

	var isAdmin = process.env.POWERADMIN_ENABLED == "YES" ? true : false;

	console.log("***************************************");
	console.log(context.opts.options);
	console.log("isPrepare: " + isPrepare);
	console.log("isBuild: " + isBuild);
	console.log("isRunning: " + isRunning);
	console.log("Browser: " + is_browser);
	console.log("Android: " + is_android);
	console.log("iOS: " + is_ios);

	var target = process.env.NODE_ENV || "production";
	var version = process.env.APP_RELEASE_VERSION || "1.0.0";

	Date.prototype.version_format = function () {
		var yyyy = this.getFullYear().toString();
		var mm = (this.getMonth() + 1).toString(); // getMonth() is zero-based
		var dd = this.getDate().toString();
		var hh = this.getHours().toString();
		return yyyy + (mm[1] ? mm : "0" + mm[0]) + (dd[1] ? dd : "0" + dd[0]) + (hh[1] ? hh : "0" + hh[0]); // padding
	};

	var dt = new Date();
	var build_code = dt.version_format();
	if (process.env.APP_BUILD_CODE) {
		build_code = process.env.APP_BUILD_CODE;
	} else {
		// set it so that build-extras.gradle knows and uses it for output filename
		process.env.APP_BUILD_CODE = build_code;
	}

	console.log("************************************************");
	console.log(" BUILD TARGET is " + target.toUpperCase());
	console.log(" RELEASE VERSION is " + version);
	console.log(" Bundle ID: " + process.env.APP_BUNDLE_ID);
	console.log("************************************************");

	if (rootdir) {
		if (is_android) {
			app_update_android_manifest();
			console.log("Updated android manifest");
		} else if (is_ios) {
			app_update_ios_project();
			console.log("Updated ios pod project workspace with correct information");
		}
	}

	setTimeout(function () {
		console.log('versioning complete');
		deferral.resolve();
	}, 500);

	return deferral.promise;

	/* function definitions */

	// update android manifest for additional permissions
	function app_update_android_manifest() {
		var android_manifest = path.join(android_dir, "app/src/main/AndroidManifest.xml");
		if (fs.existsSync(android_manifest)) {
			// update version number and code in the manifest
			var dt = new Date();
			var code_string = 'android:versionCode="[a-zA-Z0-9_\\.-]+"';
			var new_code_string = 'android:versionCode="' + build_code + '"';
			replace_string_in_file(android_manifest, code_string, new_code_string, android_manifest);
			var version_string = 'android:versionName="[a-zA-Z0-9_\\.-]+"';
			var new_version_string = 'android:versionName="' + process.env.APP_RELEASE_VERSION + '"';
			replace_string_in_file(android_manifest, version_string, new_version_string, android_manifest);

			// fix keyboard issue with the view not resizing to allow scroll to input
			replace_string_in_file(android_manifest,
				'(android:windowSoftInputMode=").*?(")',
				'android:windowSoftInputMode="adjustResize"',
				android_manifest
			);

			replace_string_in_file(android_manifest,
				'android:supportsRtl="true">',
				'android:supportsRtl="true" android:usesCleartextTraffic="true">',
				android_manifest
			);

			/*replace_string_in_file(android_manifest,
				'android:icon="@mipmap/ic_launcher"',
				'android:icon="@mipmap/ic_launcher" android:roundIcon="@mipmap/ic_launcher"',
				android_manifest
			);*/

			// copy gradle build extra file to android build folder for release signing of app
			console.log("Copying build.grade for app signing to output folder");
			const gradleFile = isAdmin ? "../files/admin/build-extras.gradle" : "../files/build-extras.gradle";
			console.log("Copying gradle extra from: " + gradleFile);
			fs.copyFileSync(path.join(rootdir, gradleFile), path.join(android_dir, "build-extras.gradle"));
		} else {
			console.log("!!! Android manifest file not found !!!");
		}
	}

	function app_update_ios_project() {
		var ios_project = path.join(ios_dir, "Pods/Pods.xcodeproj/project.pbxproj");
		if (fs.existsSync(ios_project)) {
			var version_string = 'IPHONEOS_DEPLOYMENT_TARGET = [0-9_\\.-]+';
			var new_version_string = 'IPHONEOS_DEPLOYMENT_TARGET = 11.0';
			replace_string_in_file(ios_project, version_string, new_version_string, ios_project);
			var version_string = 'MARKETING_VERSION = [0-9_\\.-]+';
			var new_version_string = 'MARKETING_VERSION = ' + version;
			replace_string_in_file(ios_project, version_string, new_version_string, ios_project);
			var version_string = 'CURRENT_PROJECT_VERSION = [0-9_\\.-]+';
			var new_version_string = 'CURRENT_PROJECT_VERSION = ' + build_code;
			replace_string_in_file(ios_project, version_string, new_version_string, ios_project);
		} else {
			console.log("!!! iOS Pod Project file not found !!!");
		}
	}

	function search_string_in_file(filename, to_search) {
		var data = fs.readFileSync(filename, 'utf8');
		var result = data.search(new RegExp(to_search, "g"));
		return result;
	}

	function replace_string_in_file(filename, to_replace, replace_with, output_file) {
		var data = fs.readFileSync(filename, 'utf8');

		var result = data.replace(new RegExp(to_replace, "g"), replace_with);
		fs.writeFileSync(output_file, result, 'utf8');
	}


	// replaces a string in a filename in the generated www assets folder for app
	function app_replace_string(fl, srch, rplc) {
		var fullfilename = path.join(rootdir, fl);
		var browser_filename = path.join(browser_www, fl);
		var android_filename = path.join(android_www, fl);
		var ios_filename = path.join(ios_www, fl);
		if (fs.existsSync(fullfilename)) {
			if (is_browser && fs.existsSync(browser_filename)) {
				replace_string_in_file(fullfilename,
					srch,
					rplc,
					browser_filename
				);
			}
			if (is_android && fs.existsSync(android_filename)) {
				replace_string_in_file(fullfilename,
					srch,
					rplc,
					android_filename
				);
			}
			if (is_ios && fs.existsSync(ios_filename)) {
				replace_string_in_file(fullfilename,
					srch,
					rplc,
					ios_filename
				);
			}
		}
	}

	/* multiple string replacement in one go */
	function app_replace_strings(fl, values) {
		var fullfilename = path.join(source_www, fl);
		var browser_filename = path.join(browser_www, fl);
		var android_filename = path.join(android_www, fl);
		var ios_filename = path.join(ios_www, fl);
		if (fs.existsSync(fullfilename)) {
			console.log("Replacing string in file: " + fullfilename);
			var data = fs.readFileSync(fullfilename, 'utf8');
			for (var x in values) {
				data = data.replace(x, values[x]);
			}
			if (is_browser) {
				fs.writeFileSync(browser_filename, data, 'utf8');
			}
			if (is_android) {
				fs.writeFileSync(android_filename, data, 'utf8');
			}
			if (is_ios) {
				fs.writeFileSync(ios_filename, data, 'utf8');
			}
		} else {
			console.log("!!! File not found while replacing strings: " + fullfilename + "!!!");
		}
	}

	// less is used as is in browser platform testing, so no need to generate css from it
	function build_css_from_less() {
		console.log("Building css from less files");
		var css_filename = "index.css";
		var less_filename = path.join(rootdir, "www/css/index.less");
		var android_filename = path.join(android_www, "css/" + css_filename);
		var ios_filename = path.join(ios_www, "css/" + css_filename);
		var browser_filename = path.join(browser_www, "css/" + css_filename);

		child = exec("lessc www/css/index.less",
			function (error, stdout, stderr) {
				if (!error) {
					if (is_android) {
						fs.writeFileSync(android_filename, stdout);
					} else if (is_ios) {
						fs.writeFileSync(ios_filename, stdout);
					} else if (is_browser) {
						fs.writeFileSync(browser_filename, stdout);
					}
					console.log("Generated css file from sources");

					// delete un-needed files from the output folder
					if (is_android) {
						var dir = path.join(android_www, "css");
						remove_css_source_files(dir);
					} else if (is_ios) {
						var dir = path.join(ios_www, "css");
						remove_css_source_files(dir);
					} else if (is_browser) {
						var dir = path.join(browser_www, "css");
						remove_css_source_files(dir);
					}

				} else {
					console.log('Failed to build css from sources: ' + error);
				}
			}
		);
	}

	// delete only less files from folder
	function remove_css_source_files(dir) {
		console.log("Removing all source css files from: " + dir);
		fs.readdir(dir, function (err, files) {
			for (var i = 0, l = files.length; i < l; ++i) {
				if (files[i] != "index.css") {
					console.log("Removing css file: " + files[i]);
					fs.unlinkSync(dir + "/" + files[i]);
				}
			}
		});
	}

	function build_minified_js(combine) {
		console.log("Building js from source files");
		var js_filename = "index.js";
		var android_filename = path.join(android_www, "js/" + js_filename);
		var ios_filename = path.join(ios_www, "js/" + js_filename);
		var browser_filename = path.join(browser_www, "js/" + js_filename);

		var jsCode = "";

		var folder = "";
		if (is_android) {
			folder = path.join(android_www, "js");
		} else if (is_ios) {
			folder = path.join(ios_www, "js");
		} else if (is_browser) {
			folder = path.join(browser_www, "js");
		}

		fs.readdir(folder + "/mocks", function (err, files) {
			for (var i = 0, l = files.length; i < l; ++i) {
				console.log("Removing mock: " + files[i]);
				fs.unlinkSync(folder + "/mocks/" + files[i]);
			}
			console.log("Removing mock.js, less.js and mock folder");
			fs.unlinkSync(folder + "/mock.js");
			fs.unlinkSync(folder + "/less.js");
			fs.unlinkSync(folder + "/dev.js");
			fs.unlinkSync(folder + "/debug.js");
			delete_folder(folder + "/mocks");
		});

		var options = {
			mangle: false
		};

		var script_strings = {};
		var files = javascriptFiles;

		for (var i = 0, l = files.length; i < l; ++i) {
			console.log("uglifying: " + files[i]);
			// empty string causes buffer to be string, uglifyjs needs string
			var result = uglifyJS.minify("\n" + fs.readFileSync(folder + "/" + files[i]), options);
			if (result.error) {
				console.log(result.error);
			}

			if(combine) {
				jsCode += result.code;
				console.log("Removing js file: " + files[i]);
				script_strings['<script src="js/' + files[i] + '"></script>'] = "";
				fs.unlinkSync(folder + "/" + files[i]);
			} else {
				console.log("Minified: " + files[i]);
				fs.writeFileSync(folder + "/" + files[i], result.code);
			}
		}

		if(combine) {
			console.log("Generating combined javascript file");
			if (is_android) {
				fs.writeFileSync(android_filename, jsCode);
			} else if (is_ios) {
				fs.writeFileSync(ios_filename, jsCode);
			} else if (is_browser) {
				fs.writeFileSync(browser_filename, jsCode);
			}
			console.log("Generated index.js");

			script_strings['<!-- JS_BUILD -->'] = '<script src="js/index.js"></script>';
			app_replace_strings("index.html", script_strings);
			console.log("Replaced individual script references in code");
		}
		
	}

	// delete complete folder
	function delete_folder(dir) {
		console.log("Removing folder: " + dir);
		fs.readdir(dir, function (err, files) {
			for (var i = 0, l = files.length; i < l; ++i) {
				console.log("Removing file: " + files[i]);
				fs.unlinkSync(dir + "/" + files[i]);
			}
		});
		fs.rmdirSync(dir);
	}

	function removeFile(name) {
		var android_filename = path.join(android_www, "/" + name);
		var ios_filename = path.join(ios_www, "/" + name);

		if (is_android && fs.existsSync(android_filename)) {
			fs.unlinkSync(android_filename);
			console.log("Deleted file: " + android_filename);
		}

		if (is_ios && fs.existsSync(ios_filename)) {
			fs.unlinkSync(ios_filename);
			console.log("Deleted file: " + ios_filename);
		}
	}

};
