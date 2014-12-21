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

var HEROCALCULATOR = (function (my) {

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