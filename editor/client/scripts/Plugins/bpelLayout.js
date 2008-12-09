/**
 * Copyright (c) 2008
 * Zhen Peng
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

if(!ORYX.Plugins)
	ORYX.Plugins = new Object();

ORYX.Plugins.BPELLayouting = Clazz.extend({

	/**
	 *	Constructor
	 *	@param {Object} Facade: The Facade of the Editor
	 */
	construct: function(facade) {
		this.facade = facade;
		
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_LAYOUT_BPEL, this.handleLayoutEvent.bind(this));
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_LAYOUT_BPEL_VERTICAL, this.handleLayoutVerticalEvent.bind(this));
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_LAYOUT_BPEL_HORIZONTAL, this.handleLayoutHorizontalEvent.bind(this));
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_LAYOUT_BPEL_SINGLECHILD, this.handleSingleChildLayoutEvent.bind(this));
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_LAYOUT_BPEL_AUTORESIZE, this.handleAutoResizeLayoutEvent.bind(this));
	},
	
	/**************************** Layout ****************************/
	
	/**
	 *  realize special BPEL layouting:
	 *  main activity: placed left,
	 *  Handler: placed right.
	 */
	handleLayoutEvent: function(event) {
		
     	var elements = event.shape.getChildShapes(false);
     	
     	// if Autolayout is not required, do nothing.
		if (!this.requiredAutoLayout (event.shape)){
     		return;
     	};
     	
		// If there are no elements
		if(!elements || elements.length == 0) {
			this.resetBounds(event);
			return;
		};
		
     	var eventHandlers = elements.find(function(node) {
				return (node.getStencil().id() == node.getStencil().namespace() + "eventHandlers");
			});
		
		var faultHandlers = elements.find(function(node) {
				return (node.getStencil().id() == node.getStencil().namespace() + "faultHandlers");
			});
			
		var compensationHandler = elements.find(function(node) {
				return (node.getStencil().id() == node.getStencil().namespace() + "compensationHandler");
			});	

		var terminationHandler = elements.find(function(node) {
				return (node.getStencil().id() == node.getStencil().namespace() + "terminationHandler");
			});
			
		var otherElements = elements.findAll(function(node){
				return (node !== eventHandlers && node !== faultHandlers 
				&& node !== compensationHandler && node !== terminationHandler)
			});
		
		var nextLeftBound = 30;
		var nextUpperBound = 30;
		
		// handle Activity
		if (otherElements){
			
			// Sort top-down
			otherElements = otherElements.sortBy(function(element){
				return element.bounds.upperLeft().y;
			});
			
			// move some certain elements to the last child position
			// if it "true" returns, that means, the arrangement of elements
			// is changed, we should sort all elements again
			if (this.moveSomeElementToLastPosition(otherElements)){
				// Sort again
				otherElements = otherElements.sortBy(function(element){
					return element.bounds.upperLeft().y;
				});
			}
			
			var lastUpperYPosition = 0;
			var elementWidth;
			var maxElementWidth = 0;
			
			// Arrange shapes like Layout-Vertical
			otherElements.each (function(element){
		
				var ul = element.bounds.upperLeft();
				var oldUlY = ul.y;
			
				ul.y = lastUpperYPosition + 30;
				lastUpperYPosition = ul.y + element.bounds.height();
			
				if (ul.y != oldUlY) {
					element.bounds.moveTo(30, ul.y);
				};
				
				elementWidth = element.bounds.width();
				if (elementWidth > maxElementWidth){
					maxElementWidth = elementWidth;
				}
			});
			
			nextLeftBound = 30 + maxElementWidth + 30;
		
		}
		
		var width;
		var maxWidth = 0;
		
		// handle EventHanlders
		if (eventHandlers){
			eventHandlers.bounds.moveTo(nextLeftBound, nextUpperBound);
			nextUpperBound = eventHandlers.bounds.lowerRight().y + 10;
			
			// record maximal width
			width = this.getRightestBoundOfAllChildren(eventHandlers)+ 30;
			if (width > maxWidth){
				maxWidth = width;
			}
		}
		// handle FaultHandlers
		if (faultHandlers){
			faultHandlers.bounds.moveTo(nextLeftBound, nextUpperBound);
			nextUpperBound = faultHandlers.bounds.lowerRight().y + 10;
			
			// record maximal width
			width = this.getRightestBoundOfAllChildren(faultHandlers)+ 30;
			if (width > maxWidth){
				maxWidth = width;
			}
		}
		// handle CompensationHandler
		if (compensationHandler){
			compensationHandler.bounds.moveTo(nextLeftBound, nextUpperBound);
			nextUpperBound = compensationHandler.bounds.lowerRight().y + 10;
			
			// record maximal width
			width = this.getRightestBoundOfAllChildren(compensationHandler)+ 30;
			if (width > maxWidth){
				maxWidth = width;
			}
		}
		
		// handle TerminationHandler
     	if (terminationHandler){
			terminationHandler.bounds.moveTo(nextLeftBound, nextUpperBound);
			
			// record maximal width
			width = this.getRightestBoundOfAllChildren(terminationHandler)+ 30;
			if (width > maxWidth){
				maxWidth = width;
			}
		}
		
		// resize all the handlers with the same width
		if (width > 0){
			var ul;
			var lr;
			
			if (eventHandlers){	
				width = eventHandlers.bounds.width();
				if (width !== maxWidth){
					ul = eventHandlers.bounds.upperLeft();
					lr = eventHandlers.bounds.lowerRight();
					eventHandlers.bounds.set(ul.x, ul.y, ul.x + maxWidth, lr.y);
				}
			}

			if (faultHandlers){
				width = faultHandlers.bounds.width();
				if (width !== maxWidth){
					ul = faultHandlers.bounds.upperLeft();
					lr = faultHandlers.bounds.lowerRight();
					faultHandlers.bounds.set(ul.x, ul.y, ul.x + maxWidth, lr.y);
				}
			}

			if (compensationHandler){
				width = compensationHandler.bounds.width();
				if (width !== maxWidth){
					ul = compensationHandler.bounds.upperLeft();
					lr = compensationHandler.bounds.lowerRight();
					compensationHandler.bounds.set(ul.x, ul.y, ul.x + maxWidth, lr.y);
				}
			}
			
	     	if (terminationHandler){
				width = terminationHandler.bounds.width();
				if (width !== maxWidth){
					ul = terminationHandler.bounds.upperLeft();
					lr = terminationHandler.bounds.lowerRight();
					terminationHandler.bounds.set(ul.x, ul.y, ul.x + maxWidth, lr.y);
				}
			}
		}
		
		this.autoResizeLayout(event);
		
		return;
		
	},
	
	getRightestBoundOfAllChildren : function(shape){
		var elements = shape.getChildShapes(false);
     	
		// If there are no elements
		if(!elements || elements.length == 0) {
			// 160 is the default width of hanlders
			return 130;
		};
			
		// Sort left-right
		elements = elements.sortBy(function(element){
			return element.bounds.lowerRight().x;
		});
		
		return elements.last().bounds.lowerRight().x;
	},
	
	handleLayoutVerticalEvent: function(event) {
	
		var elements = event.shape.getChildShapes(false);
		
		// if Autolayout is not required, do nothing.
		if (!this.requiredAutoLayout (event.shape)){
     		return;
     	};
		
		// If there are no elements
		if(!elements || elements.length == 0) {
			this.resetBounds(event);
			return;
		};
		
		// Sort top-down
		elements = elements.sortBy(function(element){
			return element.bounds.upperLeft().y;
		});
		
					
		// move some certain elements to the last child position
		// if it "true" returns, that means, the arrangement of elements
		// is changed, we should sort all elements again
		if (this.moveSomeElementToLastPosition(elements)){
			// Sort again
			elements = elements.sortBy(function(element){
				return element.bounds.upperLeft().y;
			});
		}
		
		var lastUpperYPosition = 0;
		// Arrange shapes
		elements.each(function(element){
		
			var ul = element.bounds.upperLeft();
			var oldUlY = ul.y;
			
			ul.y = lastUpperYPosition + 30;
			lastUpperYPosition = ul.y + element.bounds.height();
			
			if ((ul.y != oldUlY)) {
				element.bounds.moveTo(30, ul.y);
			}
		});
		
		this.autoResizeLayout(event);
	
		return;
	},
	
	handleLayoutHorizontalEvent: function(event) {

		var elements = event.shape.getChildShapes(false);
		
		// if Autolayout is not required, do nothing.
		if (!this.requiredAutoLayout (event.shape)){
     		return;
     	};
		
		// If there are no elements
		if(!elements || elements.length == 0) {
			this.resetBounds(event);
			return;
		};
					
		
		// Sort left-right
		elements = elements.sortBy(function(element){
			return element.bounds.upperLeft().x;
		});
		
		// move some certain elements to the last child position
		// if it "true" returns, that means, the arrangement of elements
		// is changed, we should sort all elements again
		if (this.moveSomeElementToLastPosition(elements)){
			// Sort again
			elements = elements.sortBy(function(element){
				return element.bounds.upperLeft().x;
			});
		}
		
		var lastLeftXPosition = 0;
		
		// Arrange shapes on rows (align left)
		elements.each(function(element){
		
			var ul = element.bounds.upperLeft();
			var oldUlX = ul.x;
			
			ul.x = lastLeftXPosition + 30;
			lastLeftXPosition = ul.x + element.bounds.width();

			if ((ul.x != oldUlX)) {
				element.bounds.moveTo(ul.x, 30);
			}
		});
		
		this.autoResizeLayout(event);
			
		return;
	},
	
	
	
	handleSingleChildLayoutEvent: function(event) {
     	
		var elements = event.shape.getChildShapes(false);
		
		// if Autolayout is not required, do nothing.
		if (!this.requiredAutoLayout (event.shape)){
     		return;
     	};
		
		// If there are no elements
		if(!elements || elements.length == 0) {
			this.resetBounds(event);
			return;
		};
		
		elements.first().bounds.moveTo(30, 30);
		
		this.autoResizeLayout(event);
		
		return;
	},
	
	handleAutoResizeLayoutEvent: function(event) {
		
		var elements = event.shape.getChildShapes(false);
		
		// if Autolayout is not required, do nothing.
		if (!this.requiredAutoLayout (event.shape)){
     		return;
     	};
		
		elements.each(function(element){
		
			var ul = element.bounds.upperLeft();
			
			if ((ul.x < 30)) {
				element.bounds.moveTo(30, ul.y);
				ul = element.bounds.upperLeft();
			}
			
			if ((ul.y < 30)) {
				element.bounds.moveTo(ul.x, 30);
			}
		});
		
		this.autoResizeLayout(event);
	},
	
	/**
	 * Resizes the shape to the bounds of the child shapes 
	 */
	autoResizeLayout: function(event) {
		
		var elements = event.shape.getChildShapes(false);
		
		if (elements.length > 0) {

		    elements = elements.sortBy(function(element){
				return element.bounds.lowerRight().x;
		    });
		    
			var rightBound = elements.last().bounds.lowerRight().x;
                 
		    elements = elements.sortBy(function(element){
				return element.bounds.lowerRight().y;
		    });
		    
			var lowerBound = elements.last().bounds.lowerRight().y;
			
			var ul = event.shape.bounds.upperLeft();
			
			//handle "flow" specially.
			if (event.shape.getStencil().id() ==event.shape.getStencil().namespace() + "flow"){
			 	var lr = event.shape.bounds.lowerRight();
			 	
			 	if (lr.x < ul.x + rightBound + 30){
			 		event.shape.bounds.set(ul.x, ul.y, ul.x + rightBound + 30, lr.y);
			 		lr.x = ul.x + rightBound + 30;
			 	};
			 	
			 	if (lr.y < ul.y + lowerBound + 30){
			 		event.shape.bounds.set(ul.x, ul.y, lr.x, ul.y + lowerBound + 30);
			 	};			 	
			 } else {
				event.shape.bounds.set(ul.x, ul.y, ul.x + rightBound + 30, ul.y + lowerBound + 30);
			 };
		};
		
		return;
	},
	
	resetBounds: function (event) {
		/*var shape = event.shape;
		
		if (shape.getStencil().id() == shape.getStencil().namespace() + "process"){
	  		return;
	  	};
	  	
		var ul = shape.bounds.upperLeft();
		
		if (this.isHandlers(shape)){
			shape.bounds.set(ul.x, ul.y, ul.x + 160, ul.y + 80);
		} else if (flow){
		
		} else {
			shape.bounds.set(ul.x, ul.y, ul.x + 100, ul.y + 80);	
		};*/
		
		return;
	},
	
	isHandlers: function (shape) {
	  	if (shape.getStencil().id() == shape.getStencil().namespace() + "eventHandlers"){
	  		return true;
	  	};
	  	
	  	if (shape.getStencil().id() == shape.getStencil().namespace() + "faultHandlers"){
	  		return true;
	  	};
	  	
	  	if (shape.getStencil().id() == shape.getStencil().namespace() + "compensationHandler"){
	  		return true;
	  	};
	  	
	  	if (shape.getStencil().id() == shape.getStencil().namespace() + "terminationHandler"){
	  		return true;
	  	};
		
	  	return false;
	},
	
	requiredAutoLayout: function(shape) {
		
		var key = "oryx-autolayout";
		var autolayout = shape.properties[key];
		
		if (autolayout == null){
			return true;
		};
		
		if (autolayout){
			return true;
		};
		
		return false;
	},
	
	/**
	 * find a element with the role "lastChild", that means, this shape should be
	 * the last child of their parent, e.g.: "else" in "if-block". then move these elements
	 * to the last position of the set.
	 * 
	 * 
	 * @param {} elements : the set of all elements
	 * @pre      all the elements in set are already once arranged, so we just put the 
	 *           "lastChild" after the current last one. 
	 * @return   if the arrangement of elements is changed.
	 */
	moveSomeElementToLastPosition: function (elements){
		var lastChild = elements.find(function(node) {
			 	return (Array.indexOf(node.getStencil().roles(), node.getStencil().namespace() + "lastChild")>= 0);
			});	
		
		// if there are not such element or it's already the last child,
		// do nothing.	
		if (!lastChild || lastChild == elements.last()){
			return false;
		}
		
		// move it after the current last child
		ulOfCurrentLastChild = elements.last().bounds.upperLeft();
		lastChild.bounds.moveTo(ulOfCurrentLastChild.x + 1, ulOfCurrentLastChild.y + 1);
		
		return true;
	}
});