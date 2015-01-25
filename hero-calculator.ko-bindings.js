/*
 * jQuery UI Autocomplete HTML Extension
 *
 * Copyright 2010, Scott González (http://scottgonzalez.com)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * http://github.com/scottgonzalez/jquery-ui-extensions
 */
(function( $ ) {

var proto = $.ui.autocomplete.prototype,
	initSource = proto._initSource;

function filter( array, term ) {
	var matcher = new RegExp( $.ui.autocomplete.escapeRegex(term), "i" );
	return $.grep( array, function(value) {
		return matcher.test( $( "<div>" ).html( value.label || value.value || value ).text() );
	});
}

$.extend( proto, {
	_initSource: function() {
		if ( this.options.html && $.isArray(this.options.source) ) {
			this.source = function( request, response ) {
				response( filter( this.options.source, request.term ) );
			};
		} else {
			initSource.call( this );
		}
	},

	_renderItem: function( ul, item) {
		return $( "<li></li>" )
			.data( "item.autocomplete", item )
			.append( $( "<a></a>" )[ this.options.html ? "html" : "text" ]( item.label ) )
			.appendTo( ul );
	}
});

})( jQuery );

Chart.types.Line.extend({
    // Passing in a name registers this chart in the Chart namespace in the same way
    name: "Scatter",
    draw : function(ease){
			var easingDecimal = ease || 1;
			this.clear();

			var ctx = this.chart.ctx;

			// Some helper methods for getting the next/prev points
			var hasValue = function(item){
				return item.value !== null;
			},
			nextPoint = function(point, collection, index){
				return Chart.helpers.findNextWhere(collection, hasValue, index) || point;
			},
			previousPoint = function(point, collection, index){
				return Chart.helpers.findPreviousWhere(collection, hasValue, index) || point;
			};

			this.scale.draw(easingDecimal);


			Chart.helpers.each(this.datasets,function(dataset){
				var pointsWithValues = Chart.helpers.where(dataset.points, hasValue);

				//Transition each point first so that the line and point drawing isn't out of sync
				//We can use this extra loop to calculate the control points of this dataset also in this loop

				Chart.helpers.each(dataset.points, function(point, index){
					if (point.hasValue()){
						point.transition({
							y : this.scale.calculateY(point.value),
							x : this.scale.calculateX(index)
						}, easingDecimal);
					}
				},this);


				// Control points need to be calculated in a seperate loop, because we need to know the current x/y of the point
				// This would cause issues when there is no animation, because the y of the next point would be 0, so beziers would be skewed
				if (this.options.bezierCurve){
					Chart.helpers.each(pointsWithValues, function(point, index){
						var tension = (index > 0 && index < pointsWithValues.length - 1) ? this.options.bezierCurveTension : 0;
						point.controlPoints = Chart.helpers.splineCurve(
							previousPoint(point, pointsWithValues, index),
							point,
							nextPoint(point, pointsWithValues, index),
							tension
						);

						// Prevent the bezier going outside of the bounds of the graph

						// Cap puter bezier handles to the upper/lower scale bounds
						if (point.controlPoints.outer.y > this.scale.endPoint){
							point.controlPoints.outer.y = this.scale.endPoint;
						}
						else if (point.controlPoints.outer.y < this.scale.startPoint){
							point.controlPoints.outer.y = this.scale.startPoint;
						}

						// Cap inner bezier handles to the upper/lower scale bounds
						if (point.controlPoints.inner.y > this.scale.endPoint){
							point.controlPoints.inner.y = this.scale.endPoint;
						}
						else if (point.controlPoints.inner.y < this.scale.startPoint){
							point.controlPoints.inner.y = this.scale.startPoint;
						}
					},this);
				}

				if (this.options.datasetFill && pointsWithValues.length > 0){
					//Round off the line by going to the base of the chart, back to the start, then fill.
					ctx.lineTo(pointsWithValues[pointsWithValues.length - 1].x, this.scale.endPoint);
					ctx.lineTo(pointsWithValues[0].x, this.scale.endPoint);
					ctx.fillStyle = dataset.fillColor;
					ctx.closePath();
					ctx.fill();
				}

				//Now draw the points over the line
				//A little inefficient double looping, but better than the line
				//lagging behind the point positions
				Chart.helpers.each(pointsWithValues,function(point){
					point.draw();
				});
			},this);
		}
});

var HEROCALCULATOR = (function (my) {

    ko.bindingHandlers.itemBuildTable = {
        init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var options = ko.unwrap(valueAccessor()),
                $el = $(element);

            var pressedKeys = {};
            ko.utils.domData.set(element, 'pressedKeys', pressedKeys);
            
            var keyDownHandler = function(e) {
                var pressedKeys = ko.utils.domData.get(element, 'pressedKeys');
                pressedKeys[e.which] = true;
                ko.utils.domData.set(element, 'pressedKeys', pressedKeys);
            }
            ko.utils.domData.set(element, 'keyDownHandler', keyDownHandler);
            
            var keyUpHandler = function(e) {
                var pressedKeys = ko.utils.domData.get(element, 'pressedKeys');
                if ((pressedKeys[17] && pressedKeys[67]) || (pressedKeys[17] && pressedKeys[86])) { // ctrl + c
                    $hoveredRows = $(element).find('.hover-cursor:hover');
                    if ($hoveredRows.length == 1) {
                        if (pressedKeys[67]) {
                            bindingContext.$data.copyInventoryToClipBoard($("tr", $(element)).index($hoveredRows[0]));
                        }
                        else {
                            bindingContext.$data.pasteInventoryFromClipBoard($("tr", $(element)).index($hoveredRows[0]));
                        }
						$hoveredRows.fadeOut(50).fadeIn(50);
                    }
                }
                delete pressedKeys[e.which];
                ko.utils.domData.set(element, 'pressedKeys', pressedKeys);
            }
            ko.utils.domData.set(element, 'keyUpHandler', keyUpHandler);
            
            $(document).bind( "keydown", keyDownHandler );
            $(document).bind( "keyup", keyUpHandler );

            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                var keyDownHandler = ko.utils.domData.get(element, 'keyDownHandler');
                var keyUpHandler = ko.utils.domData.get(element, 'keyUpHandler');
                $(document).unbind( "keydown", keyDownHandler );
                $(document).unbind( "keyup", keyUpHandler );
            });
        }
    };

	ko.bindingHandlers.preventBubble = {
		init: function(element, valueAccessor) {
			var eventName = ko.utils.unwrapObservable(valueAccessor());
			ko.utils.registerEventHandler(element, eventName, function(event) {
			   event.cancelBubble = true;
			   if (event.stopPropagation) {
					event.stopPropagation();
			   }                
			});
		}        
	};

	ko.bindingHandlers.toggle = {
		init: function (element, valueAccessor) {
			var value = valueAccessor();
			ko.applyBindingsToNode(element, {
				click: function () {
					value(!value());
				}
			});
		}
	};

    ko.bindingHandlers.shopDockStyle = {
        init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = ko.utils.unwrapObservable(valueAccessor());
			if (bindingContext.$data.shopDock() && !bindingContext.$data.shopPopout()) {
				ko.applyBindingsToNode(element, { style: { height: (bindingContext.$data.windowHeight() - 52) + 'px', position: 'fixed', right: 0, top: '52px', 'overflow-y': 'auto' } });
			}
			else {
				ko.applyBindingsToNode(element, { style: { height: 'auto', position: 'relative', right: 'initial', top: 'initial', 'overflow-y': 'initial' } });
			}
        },
        update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = ko.utils.unwrapObservable(valueAccessor());
			if (bindingContext.$data.shopDock() && !bindingContext.$data.shopPopout()) {
				ko.applyBindingsToNode(element, { style: { height: (bindingContext.$data.windowHeight() - 52) + 'px', position: 'fixed', right: 0, top: '52px', 'overflow-y': 'auto' } });
			}
			else {
				ko.applyBindingsToNode(element, { style: { height: 'auto', position: 'relative', right: 'initial', top: 'initial', 'overflow-y': 'initial' } });
			}
        }
    };
	
    ko.bindingHandlers.logger = {
        update: function(element, valueAccessor, allBindings) {
            //store a counter with this element
            var count = ko.utils.domData.get(element, "_ko_logger") || 0,
                data = ko.toJS(valueAccessor() || allBindings());

            ko.utils.domData.set(element, "_ko_logger", ++count);

            if (window.console && console.log) {
                console.log(count, element, data);
            }
        }
    };
    
    ko.bindingHandlers.tooltip = {
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var $element, options, tooltip;
            options = ko.utils.unwrapObservable(valueAccessor());
            $element = $(element);

            // If the title is an observable, make it auto-updating.
            if (ko.isObservable(options.title)) {
                var isToolTipVisible = false;

                $element.on('show.bs.tooltip', function () {
                    isToolTipVisible = true;
                });
                $element.on('hide.bs.tooltip', function () {
                    isToolTipVisible = false;
                });

                // "true" is the bootstrap default.
                var origAnimation = options.animation || true;
                options.title.subscribe(function () {
                    if (isToolTipVisible) {
                        $element.data('bs.tooltip').options.animation = false; // temporarily disable animation to avoid flickering of the tooltip
                        $element.tooltip('fixTitle') // call this method to update the title
                            .tooltip('show');
                        $element.data('bs.tooltip').options.animation = origAnimation;
                    }
                });
            }

            tooltip = $element.data('bs.tooltip');
            if (tooltip) {
                $.extend(tooltip.options, options);
            } else {
                $element.tooltip(options);
            }
        }
    };
	
    ko.bindingHandlers.popover = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var $element = $(element);
            var popoverBindingValues = ko.utils.unwrapObservable(valueAccessor());
            var template = popoverBindingValues.template || false;
            var options = popoverBindingValues.options || {title: 'popover'};
            var data = popoverBindingValues.data || false;
            if (template !== false) {
                if (data) {
                    options.content = "<!-- ko template: { name: template, if: data, data: data } --><!-- /ko -->";
                }
                else {
                    options.content = $('#' + template).html();
                }
                options.html = true;
            }
            $element.on('shown.bs.popover', function(event) {

                var popoverData = $(event.target).data();
                var popoverEl = popoverData['bs.popover'].$tip;
                var options = popoverData['bs.popover'].options || {};
                var button = $(event.target);
                var buttonPosition = button.position();
                var buttonDimensions = {
                    x: button.outerWidth(),
                    y: button.outerHeight()
                };

                if (data) {
                    ko.applyBindingsToNode(popoverEl[0], { template: { name: template, data: data } }, bindingContext);
                    //ko.applyBindings({template: template, data: data}, popoverEl[0]);
                    //ko.renderTemplate(template, data, {}, popoverEl[0], 'replaceChildren');
                }
                else {
                    //ko.renderTemplate(template, data, {}, popoverEl[0], 'replaceChildren');
                    //ko.applyBindings(viewModel, popoverEl[0]);
                }

                var popoverDimensions = {
                    x: popoverEl.outerWidth(),
                    y: popoverEl.outerHeight()
                };

                popoverEl.find('button[data-dismiss="popover"]').click(function() {
                    button.popover('hide');
                });

                switch (options.placement) {
                    case 'right':
                        popoverEl.css({
                            left: buttonDimensions.x + buttonPosition.left,
                            top: (buttonDimensions.y / 2 + buttonPosition.top) - popoverDimensions.y / 2
                        });
                        break;
                    case 'left':
                        popoverEl.css({
                            left: buttonPosition.left - popoverDimensions.x,
                            top: (buttonDimensions.y / 2 + buttonPosition.top) - popoverDimensions.y / 2
                        });
                        break;
                    case 'top':
                        popoverEl.css({
                            left: buttonPosition.left + (buttonDimensions.x / 2 - popoverDimensions.x / 2),
                            top: buttonPosition.top - popoverDimensions.y
                        });
                        break;
                    case 'bottom':
                        popoverEl.css({
                            left: buttonPosition.left + (buttonDimensions.x / 2 - popoverDimensions.x / 2),
                            top: buttonPosition.top + buttonDimensions.y
                        });
                        break;
                }
            });

            $element.popover(options);

            return { controlsDescendantBindings: true };

        }
    };
    
    ko.bindingHandlers['class'] = {
        'update': function(element, valueAccessor) {
            console.log(valueAccessor);
            if (element['__ko__previousClassValue__']) {
                $(element).removeClass(element['__ko__previousClassValue__']);
            }
            var value = ko.utils.unwrapObservable(valueAccessor());
            $(element).addClass(value);
            element['__ko__previousClassValue__'] = value;
        }
    };
    
	ko.bindingHandlers.chart = {
		init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
			var data = ko.utils.unwrapObservable(valueAccessor()),
				ctx = $(element).get(0).getContext("2d"),
				chartType = allBindingsAccessor().chartType,
				options = allBindingsAccessor().chartOptions || {},
				myChart = new Chart(ctx)[chartType](data, options);
			ko.utils.domData.set(element, 'myChart', myChart);
			
            //handle disposal (if KO removes by the template binding)
            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                var myChart = ko.utils.domData.get(element, 'myChart');
				myChart.destroy();
            });
		},
		update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
			var data = ko.utils.unwrapObservable(valueAccessor()),
				ctx = $(element).get(0).getContext("2d"),
				chartType = allBindingsAccessor().chartType,
				options = allBindingsAccessor().chartOptions || {},
				myChart = ko.utils.domData.get(element, 'myChart');
			myChart.destroy();
            if (data.datasets.length > 0) {
                myChart = new Chart(ctx)[chartType](data, options);
                ko.utils.domData.set(element, 'myChart', myChart);
            }
		}
	};

    ko.bindingHandlers.spinner = {
        init: function(element, valueAccessor, allBindingsAccessor) {
            //initialize datepicker with some optional options
            var options = allBindingsAccessor().spinnerOptions || {};
            $(element).spinner(options);

            //handle the field changing
            ko.utils.registerEventHandler(element, "spinchange", function () {
                var observable = valueAccessor();
                observable($(element).spinner("value"));
            });

            //handle disposal (if KO removes by the template binding)
            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                $(element).spinner("destroy");
            });

        },
        update: function(element, valueAccessor) {
            var value = ko.utils.unwrapObservable(valueAccessor()),
                current = $(element).spinner("value");

            if (value !== current) {
                $(element).spinner("value", value);
            }
        }
    };

    ko.bindingHandlers.secondTab = {
        update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var $root = bindingContext.$root,
                value = ko.utils.unwrapObservable(valueAccessor());
            ko.applyBindingsToNode(element, { css: {'second-tab': $root.isSecondTab(value) && $root.sideView()} });
        }
    };
    
    ko.bindingHandlers.hoverTabPopover = {
        update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var $root = bindingContext.$root,
                value = ko.utils.unwrapObservable(valueAccessor());
                
            ko.utils.registerEventHandler(element, "mouseover", function() {
                $root.showPopover(value);
            });  

            ko.utils.registerEventHandler(element, "mouseout", function() {
                $root.hidePopover(value);
            });      
        }
    };
    
    ko.bindingHandlers.hoverTab = {
        update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var $root = bindingContext.$root,
                value = ko.utils.unwrapObservable(valueAccessor());
                
            ko.utils.registerEventHandler(element, "mouseover", function() {
                $root.highlightTab(value);
            });  

            ko.utils.registerEventHandler(element, "mouseout", function() {
                $root.unhighlightTab(value);
            });      
        }
    };
    
    ko.bindingHandlers.hoverPaneStyle = {
        init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var $root = bindingContext.$root,
                value = ko.utils.unwrapObservable(valueAccessor());
            ko.applyBindingsToNode(element, { style: { opacity: !($root.sideView()) || $root.highlightedTab() == value || $root.highlightedTab() == '' ? 1 : .5 } });
        },
        update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var $root = bindingContext.$root,
                value = ko.utils.unwrapObservable(valueAccessor());
            ko.applyBindingsToNode(element, { style: { opacity: !($root.sideView()) || $root.highlightedTab() == value || $root.highlightedTab() == '' ? 1 : .5 } });
        }
    };
    
    ko.bindingHandlers.diffStyle = {
        init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
            var value = ko.utils.unwrapObservable(valueAccessor());
            ko.applyBindingsToNode(element, { css: {'diffPos': value > 0, 'diffNeg': value < 0} });
        },
        update: function(element, valueAccessor, allBindingsAccessor, viewModel) {
            var value = ko.utils.unwrapObservable(valueAccessor());
            ko.applyBindingsToNode(element, { css: {'diffPos': value > 0, 'diffNeg': value < 0} });
        }
    };
    
    ko.bindingHandlers.jqAuto = {
        init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
            var options = valueAccessor() || {},
                allBindings = allBindingsAccessor(),
                unwrap = ko.utils.unwrapObservable,
                modelValue = allBindings.jqAutoValue,
                source = allBindings.jqAutoSource,
                valueProp = allBindings.jqAutoSourceValue,
                inputValueProp = allBindings.jqAutoSourceInputValue || valueProp,
                labelProp = allBindings.jqAutoSourceLabel || valueProp;

            //function that is shared by both select and change event handlers
            function writeValueToModel(valueToWrite) {
                if (ko.isWriteableObservable(modelValue)) {
                   modelValue(valueToWrite );  
                } else {  //write to non-observable
                   if (allBindings['_ko_property_writers'] && allBindings['_ko_property_writers']['jqAutoValue'])
                            allBindings['_ko_property_writers']['jqAutoValue'](valueToWrite );    
                }
            }
            
            //on a selection write the proper value to the model
            options.select = function(event, ui) {
                writeValueToModel(ui.item ? ui.item.actualValue : null);
            };
                
            //on a change, make sure that it is a valid value or clear out the model value
            options.change = function(event, ui) {
                var currentValue = $(element).val();
                var matchingItem =  ko.utils.arrayFirst(unwrap(source), function(item) {
                   return unwrap(item[inputValueProp]) === currentValue;  
                });
                
                if (!matchingItem) {
                   writeValueToModel(null);
                }    
            }
            
            
            //handle the choices being updated in a DO, to decouple value updates from source (options) updates
            var mappedSource = ko.dependentObservable(function() {
                    mapped = ko.utils.arrayMap(unwrap(source), function(item) {
                        var result = {};
                        result.label = labelProp ? unwrap(item[labelProp]) : unwrap(item).toString();  //show in pop-up choices
                        result.value = inputValueProp ? unwrap(item[inputValueProp]) : unwrap(item).toString();  //show in input box
                        result.actualValue = valueProp ? unwrap(item[valueProp]) : item;  //store in model
                        return result;
                });
                return mapped;                
            });
            
            //whenever the items that make up the source are updated, make sure that autocomplete knows it
            mappedSource.subscribe(function(newValue) {
               $(element).autocomplete("option", "source", newValue); 
            });
            
            options.source = mappedSource();
            
			options.minLength = 1;
            //initialize autocomplete
            $(element).autocomplete(options);
        },
        update: function(element, valueAccessor, allBindingsAccessor, viewModel) {
           //update value based on a model change
           var allBindings = allBindingsAccessor(),
               unwrap = ko.utils.unwrapObservable,
               modelValue = unwrap(allBindings.jqAutoValue) || '', 
               valueProp = allBindings.jqAutoSourceValue,
               inputValueProp = allBindings.jqAutoSourceInputValue || valueProp;
            
           //if we are writing a different property to the input than we are writing to the model, then locate the object
           if (valueProp && inputValueProp !== valueProp) {
               var source = unwrap(allBindings.jqAutoSource) || [];
               var modelValue = ko.utils.arrayFirst(source, function(item) {
                     return unwrap(item[valueProp]) === modelValue;
               }) || {};  //probably don't need the || {}, but just protect against a bad value          
           } 

           //update the element with the value that should be shown in the input
           $(element).val(modelValue && inputValueProp !== valueProp ? unwrap(modelValue[inputValueProp]) : modelValue.toString());    
        }
    };

    ko.bindingHandlers.jqAutoCombo = {
        init: function(element, valueAccessor) {
           var autoEl = $("#" + valueAccessor());
           
            $(element).click(function() {
               // close if already visible
                if (autoEl.autocomplete("widget").is(":visible")) {
                    autoEl.autocomplete( "close" );
                    return;
                }

               //autoEl.blur();
                autoEl.autocomplete("search", " ");
                autoEl.focus(); 
                
            });
            
        }  
    }
    
    ko.extenders.numeric = function(target, precision) {
        //create a writeable computed observable to intercept writes to our observable
        var result = ko.computed({
            read: target,  //always return the original observables value
            write: function(newValue) {
                var current = target(),
                    roundingMultiplier = Math.pow(10, precision),
                    newValueAsNum = isNaN(newValue) ? 0 : parseFloat(+newValue),
                    valueToWrite = Math.round(newValueAsNum * roundingMultiplier) / roundingMultiplier;
     
                //only write if it changed
                if (valueToWrite !== current) {
                    target(valueToWrite);
                } else {
                    //if the rounded value is the same, but a different value was written, force a notification for the current field
                    if (newValue !== current) {
                        target.notifySubscribers(valueToWrite);
                    }
                }
            }
        }).extend({ notify: 'always' });
     
        //initialize with current value to make sure it is rounded appropriately
        result(target());
     
        //return the new computed observable
        return result;
    };
    
    return my;
}(HEROCALCULATOR));