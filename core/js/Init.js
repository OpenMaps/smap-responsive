smap.core.Init = L.Class.extend({
	
	initialize: function() {
		var self = this;
		
		this.defineProjs();
		
		// Instantiate core classes
		smap.core.divInst = new smap.core.Div();
		this.drawMap();
		this.bindEvents(this.map);
		smap.core.layerInst = new smap.core.Layer(this.map);
		smap.core.paramInst = new smap.core.Param(this.map);
		
		var params = smap.core.paramInst.getParams();
		
		this.loadConfig(params.CONFIG).done(function() {
				smap.config = config || window.config;
				self.applyConfig(smap.config);
				smap.core.paramInst.applyParams(params);
		}).fail(function(a, text, c) {
			console.log("Config not loaded because: "+text);
		});
	},
	
	applyConfig: function(theConfig) {
		this.preProcessConfig(theConfig);
		this.addPlugins(theConfig.plugins);
	},
	
	resetMap: function() {
		config = null;
		smap.config = null;
		delete smap.config;
		
		// Remove and destroy leaflet plugins
		var p,
			plugins = smap.core.controls || [];
		for (var i=0,len=plugins.length; i<len; i++) {
			p = plugins[i];
			try {
				smap.map.removeControl(p);				
				if (p.destroy) {
					p.destroy();				
				}
				p = null;
			}
			catch(e) {}
		}
		smap.core.controls = [];
		
		// Remove and destroy layers
		var layers = smap.map._layers,
			key, layer;
		for (var key in layers) {
			layer = layers[key];
			smap.core.layerInst._removeLayer(layer);
		}
		smap.map.off();
//		smap.map.remove();
//		smap.map = null;
//		this.map = null;
//		delete smap.map;
//		delete this.map;
	},
	
	bindEvents: function(map) {
		var self = this;
		map.on("selected", function(resp) {
			var props = resp.properties;
			
			var isMarker = false;
			if (isMarker === false) {
				for (var typeName in props) {}
				
				// Get popup html for this typename
				var t = smap.cmd.getLayerConfigBy("layers", typeName, {
					inText: true
				});
				props = props[typeName][0];
				props._displayName = t.options.displayName;
				var html = utils.extractToHtml(t.options.popup, props);
				html = html.replace("${_displayName}", t.options.displayName);
				map.closePopup();
				var popup = L.popup()
					.setLatLng(resp.latLng)
					.setContent(html)
					.openOn(map);
			}
		});
	},
	
	drawMap: function(options) {
		options = options || {};
		
		var defaultOptions = smap.core.mainConfig.mapConfig || {};
		this.map = L.map("mapdiv", $.extend(defaultOptions, options));
		smap.map = this.map;
	},
	
	loadConfig: function(configName) {
		configName = configName || "config.js";
		
		return $.ajax({
			url: "configs/"+configName,
			context: this,
			dataType: "script"
		});
	},
	
	preProcessConfig: function(config) {
		try {
			config.ws = config.ws ? config.ws[document.domain] : {};
		} catch(e) {
			config.log("smap.core.Init: config file's ws property not specified for domain: "+document.domain);
		};
	},
	
	addPlugins: function(arr) {
		var t, init;
		
		smap.core.controls = smap.core.controls || []; // Keep track of controls added to the map
		for (var i=0,len=arr.length; i<len; i++) {
			t = arr[i];
			init = eval(t.init);
			if (init) {
				init = new init(t.options || {});
				this.map.addControl(init);
				smap.core.controls.push(init);
			}
		}
	},
	
	defineProjs: function() {
		proj4.defs([
		            ["EPSG:4326", "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs"],
		            ["EPSG:3857", "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs"],
		            ["EPSG:3008", "+proj=tmerc +lat_0=0 +lon_0=13.5 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],
		            ["EPSG:3006", "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],
		            ["EPSG:3021", "+proj=tmerc +lat_0=0 +lon_0=15.8062845294444 +k=1.00000561024+x_0=1500064.274 +y_0=-667.711 +ellps=GRS80 +units=m"]
		]);
	},
	
	CLASS_NAME: "smap.core.Init"
});

$(document).ready(function() {
	smap.core.initInst = new smap.core.Init();
});