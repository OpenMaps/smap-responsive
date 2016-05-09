L.Control.Opacity = L.Control.extend({
	options: {
		position: 'topright',
		addToMenu: false
	},

	_lang: {
		"sv": {
			caption: "Ändra genomskinlighet på lager",
			close: "Stäng",
			btnTitle: "Justera genomskinlighet",
			popoverTitle: "Genomskinlighet",
			transparency: "Genomskinlighet",
			transparent: "Genomskinlig",
			opaque: "Synlig"

		},
		"en": {
			caption: "Transparency tool",
			close: "Close",
			btnTitle: "Adjust transparency",
			popoverTitle: "Transparency",
			transparency: "Transparency",
			transparent: "Transparent",
			opaque: "Visible"
		}
	},

	_setLang: function(langCode) {
		langCode = langCode || smap.config.langCode;
		if (this._lang) {
			this.lang = this._lang ? this._lang[langCode] : null;
		}
	},

	initialize: function(options) {
		L.setOptions(this, options);
		if (options._lang) {
			// Always allow setting lang through options
			$.extend(true, this._lang, options._lang);
		}
		this._setLang(options.langCode);
	},

	onAdd: function(map) {
		

		this._container = L.DomUtil.create('div', 'leaflet-control-opacity'); // second parameter is class name
		L.DomEvent.disableClickPropagation(this._container);
		this.$container = $(this._container);
		
		this._createBtn();
		this._bindEvents();
		
		return this._container;
	},

	_bindEvents: function() {
		var onAddRemove = (function(e) {
			if (!e.layer.options || !e.layer.options.layerId || e.layer.feature) { 
				return;
			}
			var layer = e.layer;
			switch (e.type) {
				case "layeradd":
					// Add slider to GUI
					this._addRow(layer);
					break;
				case "layerremove":
					// Remove slider to GUI
					this._removeRow(layer);
					break;
			}
		}).bind(this);

		this._map.on("layeradd layerremove", onAddRemove);
	},

	_createId: function(layerId) {
		return "opacity-"+layerId;
	},
	_unCreateId: function(sliderId) {
		return sliderId.replace("opacity-", "");;
	},


	_setLabelValue: function($label, val) {
		$label.text(val + " %");
	},

	_setLayerOpacity: function(layer, val) {
		if (layer.setOpacity) {
			layer.setOpacity( val );
		}
		else {
			layer.eachLayer(function(marker) {
				marker.setOpacity( val );
			});
		}
	},

	onSlide: function(e) {
		// console.log(e);
		var $target = $(e.target);
		var layerId = this._unCreateId( $target.prop("id") );
		var layer = smap.cmd.getLayer(layerId);
		
		this._setLayerOpacity(layer, 1-(e.value/100));
		
		var $valueLabel = $target.parent().find(".smap-opacity-value");
		this._setLabelValue($valueLabel, e.value);


	},

	_addRow: function(layer) {
		var $c = this.$popContainer;
		var theId = this._createId(layer.options.layerId);
		if ( $c.find("#"+theId).length ) {
			return false;
		}
		if (!layer) {
			return;
		}
		var opacity;
		if (!layer.setOpacity && layer._layers) {
			// Check if the opacity can be changed for features in this layer. If not, return.
			var firstFeature;
			for (var key in layer._layers) {
				firstFeature = layer._layers[key];
				break;
			}
			if (firstFeature && firstFeature.setOpacity) {
				opacity = firstFeature.options.opacity;
			}
			else {
				return;
			}	
		}
		opacity = opacity || (typeof layer.options.opacity === "number" ? layer.options.opacity : 1);
		var displayValue = (1 - opacity )*100;
		var row = '<div class="smap-opacity-row">'+
					'<div class="smap-opacity-values">'+
						'<span class="smap-opacity-label">'+(layer.options.displayName || layer.options.layerId || "no name")+'</span>'+
						'<span class="smap-opacity-value">'+displayValue+'</span>'+
					'</div>'+
					'<input type="text" id="'+theId+'" data-provide="slider" '+
					'data-slider-min="0" data-slider-max="100" data-slider-step="10" data-slider-value="'+displayValue+'" '+
					'data-slider-tooltip="hide">'+
				'</div>';
		$c.prepend(row);

		var $slider = $c.find('#'+theId);
		var textTransparency = this.lang.transparency;
		$slider.slider({
			tooltip_position: 'bottom'
			// ticks: [0, 100],
			// ticks_positions: [0, 100],
			// ticks_labels: [this.lang.opaque, this.lang.transparent],
			// formatter: function(value) {
			// 	return value+" %";
			// 	// return textTransparency+": "+ value+" %";
			// }
		});
		$slider.on("slide", this.onSlide.bind(this));
		this._setLabelValue($c.find(".smap-opacity-value"), displayValue);
	},

	_removeRow: function(layer) {
		var c = this.$popContainer;
		var theId = this._createId(layer.options.layerId);
		c.find("#"+theId).parent().remove();
	},

	_createBtn: function() {
		var self = this;
		var $btn = $('<button id="smap-opacity-btn" title="' + this.lang.btnTitle + '" class="btn btn-default"><span class="fa fa-adjust"></span></button>');
		$btn.on("click", function () {
			self.activate();
			return false;
		});
		this.$container.append($btn);
		this.$btn = $btn;

		this.$popContainer = $('<div class="smap-opacity-popcontainer" />');
		$btn.popover({
			// container: 'body',
			content: function() {
				// console.log($(this).data("bs.popover"));
				$(this).data("bs.popover").$tip.find(".popover-content").append( self.$popContainer );
			},
			placement: "bottom",
			// title: this.lang.popoverTitle, // set by the btn's title attribute
			trigger: "click"
		});

		// Draw dropdown
		$btn.on("shown.bs.popover", function() {
			var $popover = $(".popover");
				// $popCont = $(".smap-opacity-popover");
			// if (!self.options.showPopoverTitle) {
			// 	$popover.find("h3").remove();
			// }
			$popover.addClass("opacity-popover");
		});
	},


	activate: function() {
		if (this._active) {
			return false;
		}
		this._active = true;
		var $btn = this.$btn;
		
		// this.$btn.popover("show");
		// var $popover = $btn.data("bs.tooltip").$element;
		// $popover.append(this.$popContainer);
		return true;
	},

	deactivate: function() {
		var $btn = this.$btn;
		this.$popContainer.detach();
		// $btn.popover("hide");
		$btn.popover("destroy");
	},


	onRemove: function(map) {
		this.$btn.remove();
		delete this.$btn;
		delete this.$popContainer;

	}
});

/*
 * This code lets us skip "new" before the
 * Class name when instantiating it.
 */
L.control.opacity = function (options) {
	return new L.Control.Opacity(options);
};