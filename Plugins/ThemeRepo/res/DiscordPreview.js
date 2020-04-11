(_ => {
	let DiscordClassModules, DiscordClasses, userId;
	
	window.global = window;
	
	window.respondToParent = function (data = {}) {
		if (window.parent && typeof window.parent.postMessage == "function") window.parent.postMessage(data, "*");
		else if (data.hostId != null && data.hostName != null) {
			let ipcRenderer = (require("electron") || {}).ipcRenderer;
			if (ipcRenderer && typeof ipcRenderer.sendTo == "function") ipcRenderer.sendTo(data.hostId, data.hostName, data);
		}
	};

	window.onload = function () {
		window.respondToParent({
			origin: "DiscordPreview",
			reason: "OnLoad"
		});
	};
	window.onkeyup = function (e) {
		window.respondToParent({
			origin: "DiscordPreview",
			reason: "KeyUp",
			which: e.which
		});
	};
	window.onmessage = function (e) {
		let data = e.data || e;
		if (typeof data === "object" && (data.origin == "PluginRepo" || data.origin == "ThemeRepo")) {
			switch (data.reason) {
				case "OnLoad":
					document.body.innerHTML = document.body.innerHTML.replace(/\t|\n|\r/g, "");
					
					if (data.username) {
						document.body.innerHTML = document.body.innerHTML.replace(/REPLACE_USERNAMESMALL/gi, data.username.toLowerCase());
						document.body.innerHTML = document.body.innerHTML.replace(/REPLACE_USERNAME/gi, data.username);
					}
					if (data.id) {
						userId = data.id;
						document.body.innerHTML = document.body.innerHTML.replace(/REPLACE_USERID/gi, data.id);
					}
					if (data.avatar) document.body.innerHTML = document.body.innerHTML.replace(/REPLACE_AVATAR/gi, data.avatar.split('"').join('') + "?size=");
					if (data.discriminator) document.body.innerHTML = document.body.innerHTML.replace(/REPLACE_DISCRIMINATOR/gi, data.discriminator);
					if (data.classes) DiscordClasses = JSON.parse(data.classes);
					if (data.classmodules || data.classModules) DiscordClassModules = JSON.parse(data.classmodules || data.classModules);
					
					if (disCN != undefined && DiscordClasses != undefined && DiscordClassModules != undefined) {
						let oldHTML = document.body.innerHTML.split("REPLACE_CLASS_");
						let newHTML = oldHTML.shift();
						for (let html of oldHTML) {
							let reg = /([A-z0-9_]+)(.+)/.exec(html);
							newHTML += disCN[reg[1]] + reg[2];
						}
						document.body.innerHTML = newHTML;
					}
					
					if (data.nativecss || data.nativeCSS) {
						let theme = document.createElement("link");
						theme.classList.add(data.reason);
						theme.rel = "stylesheet";
						theme.href = data.nativecss || data.nativeCSS;
						document.head.appendChild(theme);
					}
					
					if (data.html || data.htmlClassName) document.documentElement.className = data.html || data.htmlClassName;
					document.documentElement.classList.add("mouse-mode");
					document.documentElement.classList.add("full-motion");
					
					if (data.titlebar || data.titleBar) document.querySelector(".preview-titlebar").outerHTML = data.titlebar || data.titleBar;
					
					document.body.firstElementChild.style.removeProperty("display");
	
					let electron = require("electron");
					if (electron && electron.remote) {
						let browserWindow = electron.remote.getCurrentWindow();
						if (browserWindow) document.addEventListener("click", event => {
							let button = getParent(dotCNC.titlebarmacbutton + dotCN.titlebarwinbutton, event.target);
							if (button) {
								if (button.className.indexOf(disCN.titlebarmacbuttonclose) > -1 || button.className.indexOf(disCN.titlebarwinbuttonclose) > -1) browserWindow.close();
								else if (button.className.indexOf(disCN.titlebarmacbuttonmax) > -1 || (button.className.indexOf(disCN.titlebarwinbuttonminmax) > -1 && button.parentElement.lastElementChild != button)) {
									if (browserWindow.isMaximized()) browserWindow.unmaximize();
									else browserWindow.maximize();
								}
								else if (button.className.indexOf(disCN.titlebarmacbuttonmin) > -1 || (button.className.indexOf(disCN.titlebarwinbuttonminmax) > -1 && button.parentElement.lastElementChild == button)) browserWindow.minimize();
							}
						});
					}
					break;
				case "Eval":
					window.evalResult = null;
					if (data.jsstring) window.eval(`(_ => {${data.jsstring}})()`);
					window.respondToParent({
						origin: "DiscordPreview",
						reason: "EvalResult",
						result: window.evalResult
					});
					break;
				case "NewTheme":
				case "CustomCSS":
				case "ThemeFixer":
					document.querySelectorAll("style." + data.reason).forEach(theme => theme.remove());
					if (data.checked) {
						let theme = document.createElement("style");
						theme.classList.add(data.reason);
						theme.innerText = data.css;
						document.head.appendChild(theme);
					}
					break;
				case "DarkLight":
					if (data.checked) {
						document.documentElement.className = document.documentElement.className.replace(new RegExp(disCN.themedark, "g"), disCN.themelight);
						document.body.innerHTML = document.body.innerHTML.replace(new RegExp(disCN.themedark, "g"), disCN.themelight);
					}
					else {
						document.documentElement.className = document.documentElement.className.replace(new RegExp(disCN.themelight, "g"), disCN.themedark);
						document.body.innerHTML = document.body.innerHTML.replace(new RegExp(disCN.themelight, "g"), disCN.themedark);
					}
					break;
				case "Normalize":
					let oldHTML2 = document.body.innerHTML.split('class="');
					let newHTML2 = oldHTML2.shift();
					for (let html of oldHTML2) {
						html = html.split('"');
						newHTML2 += 'class="' + (data.checked ? html[0].split(" ").map(n => n.replace(/([A-z0-9]+?)-([A-z0-9_-]{6})/g, "$1-$2 da-$1")).join(" ") : html[0].split(" ").filter(n => n.indexOf("da-") != 0).join(" ")) + '"' + html.slice(1).join('"');
					}
					document.body.innerHTML = newHTML2;
					break;
			}
		}
	};
	let disCN = new Proxy({}, {
		get: function (list, item) {
			return getDiscordClass(item, false).replace("#", "");
		}
	});
	let disCNS = new Proxy({}, {
		get: function (list, item) {
			return getDiscordClass(item, false).replace("#", "") + " ";
		}
	});
	let disCNC = new Proxy({}, {
		get: function (list, item) {
			return getDiscordClass(item, false).replace("#", "") + ",";
		}
	});
	let dotCN = new Proxy({}, {
		get: function (list, item) {
			let className = getDiscordClass(item, true);
			return (className.indexOf("#") == 0 ? "" : ".") + className;
		}
	});
	let dotCNS = new Proxy({}, {
		get: function (list, item) {
			let className = getDiscordClass(item, true);
			return (className.indexOf("#") == 0 ? "" : ".") + className + " ";
		}
	});
	let dotCNC = new Proxy({}, {
		get: function (list, item) {
			let className = getDiscordClass(item, true);
			return (className.indexOf("#") == 0 ? "" : ".") + className + ",";
		}
	});
	let notCN = new Proxy({}, {
		get: function (list, item) {
			return `:not(.${getDiscordClass(item, true).split(".")[0]})`;
		}
	});
	let notCNS = new Proxy({}, {
		get: function (list, item) {
			return `:not(.${getDiscordClass(item, true).split(".")[0]}) `;
		}
	});
	let notCNC = new Proxy({}, {
		get: function (list, item) {
			return `:not(.${getDiscordClass(item, true).split(".")[0]}),`;
		}
	});
	let getDiscordClass = function (item, selector) {
		let className = "Preview_undefined";
		if (DiscordClasses[item] === undefined) {
			if (userId == "278543574059057154") console.warn(`%c[Preview]%c`, 'color:#3a71c1; font-weight:700;', '', item + ' not found in DiscordClasses');
			return className;
		} 
		else if (!Array.isArray(DiscordClasses[item]) || DiscordClasses[item].length != 2) {
			if (userId == "278543574059057154") console.warn(`%c[Preview]%c`, 'color:#3a71c1; font-weight:700;', '', item + ' is not an Array of Length 2 in DiscordClasses');
			return className;
		}
		else if (DiscordClassModules[DiscordClasses[item][0]] === undefined) {
			if (userId == "278543574059057154") console.warn(`%c[Preview]%c`, 'color:#3a71c1; font-weight:700;', '', DiscordClasses[item][0] + ' not found in DiscordClassModules');
			return className;
		}
		else if (DiscordClassModules[DiscordClasses[item][0]][DiscordClasses[item][1]] === undefined) {
			if (userId == "278543574059057154") console.warn(`%c[Preview]%c`, 'color:#3a71c1; font-weight:700;', '', DiscordClasses[item][1] + ' not found in ' + DiscordClasses[item][0] + ' in DiscordClassModules');
			return className;
		}
		else {
			className = DiscordClassModules[DiscordClasses[item][0]][DiscordClasses[item][1]];
			if (selector) {
				className = className.split(" ").filter(n => n.indexOf("da-") != 0).join(selector ? "." : " ");
				className = className || "Preview_undefined";
			}
			return className;
		}
	};
	
	let getParent = function (listOrSelector, node) {
		let parent = null;
		if (Node.prototype.isPrototypeOf(node) && listOrSelector) {
			let list = NodeList.prototype.isPrototypeOf(listOrSelector) ? listOrSelector : typeof listOrSelector == "string" ? document.querySelectorAll(listOrSelector) : null;
			if (list) for (let listNode of list) if (listNode.contains(node)) {
				parent = listNode;
				break;
			}
		}
		return parent;
	};
	
	if (typeof window.require != "function") window.require = function () {
		return _ => {};
	};
	
	if (typeof window.getString != "function") window.getString = function (obj) {
		let string = "";
		if (typeof obj == "string") string = obj;
		else if (obj && obj.props) {
			if (typeof obj.props.children == "string") string = obj.props.children;
			else if (Array.isArray(obj.props.children)) for (let c of obj.props.children) string += typeof c == "string" ? c : getString(c);
		}
		return string;
	};
	
	if (typeof window.webpackJsonp != "function") window.webpackJsonp = function () {
		return {
			default: {
				m: {},
				c: {}
			}
		};
	};
	
	let WebModulesFind = function (filter) {
		const id = "PluginRepo-WebModules";
		const req = typeof(window.webpackJsonp) == "function" ? window.webpackJsonp([], {[id]: (module, exports, req) => exports.default = req}, [id]).default : window.webpackJsonp.push([[], {[id]: (module, exports, req) => module.exports = req}, [[id]]]);
		delete req.m[id];
		delete req.c[id];
		for (let m in req.c) {
			if (req.c.hasOwnProperty(m)) {
				var module = req.c[m].exports;
				if (module && module.__esModule && module.default && filter(module.default)) return module.default;
				if (module && filter(module)) return module;
			}
		}
	};
	let WebModulesFindByProperties = function (properties) {
		properties = Array.isArray(properties) ? properties : Array.from(arguments);
		let module = WebModulesFind(module => properties.every(prop => module[prop] !== undefined));
		if (!module) {
			module = {};
			for (let property of properties) module[property] = property;
		}
		return module;
	};
	let WebModulesFindByName = function (name) {
		return WebModulesFind(module => module.displayName === name) || "";
	};
	
	if (!window.BDV2) {
		window.BDV2 = {};
		window.BDV2.react = window.React;
		window.BDV2.reactDom = window.ReactDOM;
		window.BDV2.WebpackModules = {};
		window.BDV2.WebpackModules.find = WebModulesFind;
		window.BDV2.WebpackModules.findByUniqueProperties = WebModulesFindByProperties;
		window.BDV2.WebpackModules.findByDisplayName = WebModulesFindByName;
	}
	if (!window.BdApi) {
		window.BdApi = {};
		window.BdApi.getData = _ => {return {};};
		window.BdApi.loadData = _ => {return {};};
		window.BdApi.saveData = _ => {};
		window.BdApi.React = window.React;
		window.BdApi.ReactDOM = window.ReactDOM;
		window.BdApi.findModule = WebModulesFind;
		window.BdApi.findModuleByProps = WebModulesFindByProperties;
		window.BdApi.findModuleByDisplayName = WebModulesFindByName;
	}
})();