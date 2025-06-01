var idrUIGlobal = {
		idrObjectMap: {}
}

UIWidget = {
	initialize : function(){
		this.idrObjectId = Math.uuid(5, 10);
		this.children = [];
		this.properties = null;
		this.$ = $("<div class = 'idr-ui-widget'>");
		this.$.attr('idrObjectId', this.idrObjectId);
		this.$.data('idrUIObject', this);
	},
		
	setProperty : function(property, value){
		this.properties[property] = value;
		this.refresh();
	},
	
	refresh: function(){},

	show : function(){
		this.$.show();
		return this.$;
	},

	hide : function(){
		this.$.hide();
	},
	
	append : function(obj){
		this.$.append(obj.$.show());
		return this;
	},

	appendJQ : function(jqobj){
		this.$.append(jqobj);
		return this;
	},

	addContent : function(obj) {
		this.children.push(obj);
		this.refresh();
	},

	clearContent : function(obj) {
		//this.$.empty();
	},
	
	_edit_properties : function(container){
		var properties = JSON.parse(JSON.stringify(this.properties));
		var object = this;

		var form = new UIWidget_form();
		form.setProperty('title', 'Properties');
		var submit_handler = function(e) {
			e.preventDefault();
			object.properties = JSON.parse(JSON.stringify(properties));
			object.refresh();
			container.deActivate();
		}
		
		var cancel_handler = function(e) {
			e.preventDefault();
			container.deActivate();
		}

		var formContent = this.edit_properties(properties);
	    form.submit(submit_handler);
	    form.cancel(cancel_handler);
	    form.addContent(formContent);
	    return form;
	}
};


var UIWidget_modal = function() {
	this.initialize();
	this.$.addClass('idr-ui-widget-overlay');
	
	
	var modal = $('<div class="modal">');
	this.appendJQ(modal);

	this.append = function(obj){
		modal.append(obj.show());
		return this;		
	}
	
	this.clearContent = function(){
		modal.empty();
		return this;		
	}

	this.refresh = function(){
		//rewrite this to keep the sort order of children
		this.clearContent();
		for (var i = 0; i < this.children.length; i++) {
			this.append(this.children[i]);
		}
	}
	
	this.activate = function(){
		this.$.show();
	}
	
	this.deActivate = function(){
		this.$.hide();
	}

	this.refresh();
}

UIWidget_modal.prototype = UIWidget;

var UIWidget_frame = function() {
	this.initialize();
	this.$.addClass('idr-ui-widget-frame');
	
	var sortupdate = function(e,ui){
		var sortable = $(e.target).data('idrUIObject');
		var items = $(e.target).children();
		/*
		 * clear the array containing children
		 */
		sortable.children =[];
		
		/*
		 * repopulate the array with new sort order
		 */
		for (var i=0; i<items.length; i++){
			sortable.children.push($(items[i]).data('idrUIObject'));			
		}
	}

	this.$.sortable({update: sortupdate});
	
	this.model = {};
	
	this.setModel = function(m){
		this.model = m;
		this.show = this._showTemplate;
	}
	
	this.refresh = function(){
		this.$.children().detach(); 	
		for (var i = 0; i < this.children.length; i++) {
			//this.$.append(this.children[i].show());
			this.append(this.children[i]);
		}
	}

	this._showTemplate = function() {
		var container = this.$.clone();
		container.empty();
		var content = $('<span>');
		for (var i = 0; i < this.children.length; i++) {
			content.append(this.children[i].show());
		}
		var template = $('<template bind={{}}>')[0];
		template.innerHTML = content.prop('innerHTML');
		template.model = this.model;
		container.append(template);

		Platform.performMicrotaskCheckpoint();
		return container;
	}
}

UIWidget_frame.prototype = UIWidget;

var UIWidget_multiRowFrame = function(){
	this.initialize();
	this.$.addClass('idr-ui-widget-multirowframe');
	var model = [];
	
	this.setModel = function(m){
		model = m;
		this.refresh = _refresh;
	}
	
	this.eventHandler = {
		addRow: function(e){},
		delRow: function(e){
	    	var model1 = e.target.templateInstance.model;
	    	var index = model.indexOf(model1);
	    	model.splice(index,1);
		}
	}
	
	this.bind = function(event, fn){
		this.eventHandler[event] = fn;
	}
	
	var table = $('<table class=idr-ui-widget-table>');
	var template = $('<template repeat={{}}>')[0];
	var addButton = $('<button class="idr-ui-widget-iconbutton add" type="button" name="ADD">Add</button>');
	var delButton = $('<td><button class="idr-ui-widget-iconbutton delete" type="button" name="DELETE">Del</button></td>');
	table.append(template);
	this.appendJQ(table).appendJQ(addButton);
	
	var _refresh = function(){
		var tr = $('<tr>');
		for (var i=0; i<this.children.length; i++){
			var td = $('<td>');
			td.append(this.children[i].show());
			tr.append(td);
		}
		tr.append(delButton);

		template.innerHTML = tr.prop('outerHTML');
		template.model = model;
		Platform.performMicrotaskCheckpoint();
	}

	var _clickHandler = function(e) {
		e.preventDefault();
		e.stopPropagation();
		var idrObject = $(this).data('idrUIObject');
		var action = e.target.name;
		if (action == 'DELETE') {
			idrObject.eventHandler.delRow(e);			
		}
		if (action == 'ADD') {
			idrObject.eventHandler.addRow(e);
		}

		Platform.performMicrotaskCheckpoint()
	};

	this.edit_properties = function() {}
	this.$.on('click', _clickHandler);
}

UIWidget_multiRowFrame.prototype = UIWidget;

var UIWidget_tab = function(){
	this.initialize();
	this.$.addClass('idr-ui-widget-tab');
   	
	var tablist = [];
	var tabObjects = [];
	var selectedtab = 0;
	var navigator = $('<div class="navigator">');
	var content = $('<div class="content">');
	
	this.refresh = function(){
		console.log("selected tab = "+ selectedtab);
		navigator.empty();
		content.empty();
		for (var i=0; i<tablist.length; i++){
			var tab = $('<span class="tab">').text(tablist[i]);
			//tab.attr('tabid', tablist[i]);
			tab.attr('tabid', i);
			navigator.append(tab);
		}
		$(navigator).children("[tabid=" + selectedtab + "]").addClass('selected');
		content.append((tabObjects[selectedtab]).show());
	};
	
	this.addTab = function(t, o){
		tablist.push(t);
		tabObjects.push(o);
		this.refresh();
	};

	this.removeTab = function(t){
		var index = tablist.indexOf(t);
		tablist.splice(index,1);
		tabObject.splice(index,1);
		this.refresh();
	};
	
	this.tabSwitcher = function(ev){
		var tabid = $(ev.target).attr('tabid');
		if (tabid !== undefined) {
			$(navigator).children("[tabid=" + selectedtab + "]").removeClass(
					'selected');
			$(ev.target).addClass("selected");
			console.log("Beofre selected tab = " + selectedtab);
			// selectedtab = tablist.indexOf($(ev.target).attr('tabid'));
			selectedtab = $(ev.target).attr('tabid');
			console.log("After selected tab = " + selectedtab);
			content.children().detach();
			content.append((tabObjects[selectedtab]).show());
		}
	};
	navigator.click(this.tabSwitcher);
	//this.$.append(navigator).append(content);
	this.appendJQ(navigator).appendJQ(content);
};

UIWidget_tab.prototype = UIWidget;

var UIWidget_form = function(){
	this.initialize();
	this.properties = {
		title : "Title",
		subtitle: "Subtitle"
	}
	
	this.$.addClass('idr-ui-widget-form');

	this.children = []
	
	var form = $('<form class="form">');
	var header = $('<div class="header">');
	var content = $('<div class="content">');
	var handler = $('<div class="handler">');
	var footer = $('<div class="footer">');
	var title = $('<span class="h1 idr-style-inherit">');
	var subtitle = $('<span class="h3">')
	var saveButton = $('<button class="button">Save</button>');
	var cancelButton = $('<button class="button">Cancel</button>');	
	
	header.append(title).append(subtitle);
	handler.append(saveButton).append(cancelButton);
	form.append(header).append(content).append(handler).append(footer);
	this.appendJQ(form);
	
	this.submit = function(fn){
		saveButton.on('click',fn);
	};

	this.cancel = function(fn){
		cancelButton.on('click',fn);
	};

	this.refresh = function(){
		title.html(this.properties.title);
		subtitle.html(this.properties.subtitle);
		content.empty();
		for (var i=0; i<this.children.length; i++){
			content.append(this.children[i].show());
		}
	}
	
	this.edit_properties = function() {}
	
		this.refresh();
};

UIWidget_form.prototype = UIWidget;

var UIWidget_inputField = function(){
	this.initialize();
	this.properties = {
			label : "First Name",
			prompt : "Enter Here .....",
			dataBinding: 'firstName',
			CSSContainer: '',
			style:''
		}
	this.$.addClass('idr-ui-widget-inputtext');
    
	var span = $("<span>");
	var label = $("<label class=idr-style-inherit>");
	var input = $("<input class=idr-style-inherit type='text'>");
	//this.$.append(span);
	this.appendJQ(span);
	span.append(label).append(input);
	
	this.refresh = function(){
		this.$.attr('style', this.properties.CSSContainer);
		span.attr('style', this.properties.style);
		label.html(this.properties.label);
		input.attr('placeholder', this.properties.prompt);
		
		/* the following is added to show value when the field is rendered 
		 * outside of designer */		
		input.attr('value','{{'+ this.properties.dataBinding +'}}');
	}

	this.refresh();

	this.edit_properties = function(properties) {
	    var uiprop1 = new UIWidget_inputField();
	    uiprop1.setProperty('label', 'Label');
	    uiprop1.setProperty("dataBinding", 'label');

	    var uiprop2 = new UIWidget_inputField();
	    uiprop2.setProperty('label', 'Prompt');
	    uiprop2.setProperty("dataBinding", 'prompt');
	    
	    var uiprop3 = new UIWidget_inputField();
	    uiprop3.setProperty('label', 'Binding');
	    uiprop3.setProperty("dataBinding", 'dataBinding');

	    var propframe = new UIWidget_frame();
	    propframe.setModel(properties);
	    propframe.addContent(uiprop1);
	    propframe.addContent(uiprop2);
	    propframe.addContent(uiprop3);
	    
	    var CSScontainer = new UIWidget_inputTextArea();
	    CSScontainer.setProperty('label', 'CSS Style');
	    CSScontainer.setProperty("dataBinding", 'CSSContainer');

	    var CSScontainerframe = new UIWidget_frame();
	    CSScontainerframe.setModel(properties);
	    CSScontainerframe.addContent(CSScontainer);

	    var uistyle = new UIWidget_inputTextArea();
	    uistyle.setProperty('label', 'CSS Style');
	    uistyle.setProperty("dataBinding", 'style');

	    var styleframe = new UIWidget_frame();
	    styleframe.setModel(properties);
	    styleframe.addContent(uistyle);

	    var tabui = new UIWidget_tab();
	    tabui.addTab("Properties", propframe);
	    tabui.addTab("Position/Layout", CSScontainerframe);
//	    tabui.addTab("CSS Style", styleframe);	 
	    
	    return tabui;
	}
};

UIWidget_inputField.prototype = UIWidget;

var UIWidget_button = function(){
	this.initialize();
	this.properties = {
			label : "Button",
			CSSContainer: ''			
	}
	this.$.addClass('idr-ui-widget-button');
    
	var button = $("<input type='button'>");
	//this.$.append(button);
	this.appendJQ(button);
	
	this.refresh = function(){
		this.$.attr('style', this.properties.CSSContainer);
		button.attr('value', this.properties.label);
	}
	this.refresh();
	
	this.edit_properties = function(properties) {    
	    var uiprop1 = new UIWidget_inputField();
	    uiprop1.setProperty('label', 'Label');
	    uiprop1.setProperty("dataBinding", 'label');

	    var propframe = new UIWidget_frame();
	    propframe.setModel(properties);
	    propframe.addContent(uiprop1);

	    var CSScontainer = new UIWidget_inputTextArea();
	    CSScontainer.setProperty('label', 'CSS Style');
	    CSScontainer.setProperty("dataBinding", 'CSSContainer');

	    var CSScontainerframe = new UIWidget_frame();
	    CSScontainerframe.setModel(properties);
	    CSScontainerframe.addContent(CSScontainer);

	    var tabui = new UIWidget_tab();
	    tabui.addTab("Properties", propframe);
	    tabui.addTab("Position/Layout", CSScontainerframe);	    
	    return tabui;
	};

	this.on = function(handler, fn) {
		this.$.on(handler, fn);
	};	
}

UIWidget_button.prototype = UIWidget;

var UIWidget_text = function(){
	this.initialize();
	this.properties = {
			text : "<b>Customize</b> this text ....",
			CSSContainer: ''			
	}
	this.$.addClass('idr-ui-widget-text');

	var span = $("<span>");
	//this.$.append(span);
	this.appendJQ(span);
	
	this.refresh = function(){
		this.$.attr('style', this.properties.CSSContainer);
		span.empty();
		span.append(this.properties.text)
	}
	
	this.refresh();

	this.edit_properties = function(properties) {
	    var uiprop1 = new UIWidget_inputField();
	    uiprop1.setProperty('label', 'Text');
	    uiprop1.setProperty("dataBinding", 'text');

	    var propframe = new UIWidget_frame();
	    propframe.setModel(properties);
	    propframe.addContent(uiprop1);

	    var CSScontainer = new UIWidget_inputTextArea();
	    CSScontainer.setProperty('label', 'CSS Style');
	    CSScontainer.setProperty("dataBinding", 'CSSContainer');

	    var CSScontainerframe = new UIWidget_frame();
	    CSScontainerframe.setModel(properties);
	    CSScontainerframe.addContent(CSScontainer);

	    var tabui = new UIWidget_tab();
	    tabui.addTab("Properties", propframe);
	    tabui.addTab("Position/Layout", CSScontainerframe);	    
	    return tabui;
	}
}

UIWidget_text.prototype = UIWidget;

var UIWidget_inputCheckbox = function(){
	this.initialize();
	this.properties = {
			prompt : "Customize this prompt ....",
			dataBinding: 'NONE',
			CSSContainer: ''			
	}
	this.$.addClass('idr-ui-widget-inputcheckbox');

	var input = $("<input type='checkbox'>");
	var span = $("<span>");
	//this.$.append(input).append(span);
	this.appendJQ(input).appendJQ(span);
	
	this.refresh = function(){
		this.$.attr('style', this.properties.CSSContainer);
		span.empty();
		span.append(this.properties.prompt);
		input.attr('value', '{{'+ this.properties.dataBinding +'}}');
	}
	
	this.refresh();

	this.edit_properties = function(properties) {
	    var uiprop1 = new UIWidget_inputField();
	    uiprop1.setProperty('label', 'Prompt');
	    uiprop1.setProperty("dataBinding", 'prompt');
  
	    var uiprop2 = new UIWidget_inputField();
	    uiprop2.setProperty('label', 'Binding');
	    uiprop2.setProperty("dataBinding", 'dataBinding');

	    var propframe = new UIWidget_frame();
	    propframe.setModel(properties);
	    propframe.addContent(uiprop1);
	    propframe.addContent(uiprop2);

	    var CSScontainer = new UIWidget_inputTextArea();
	    CSScontainer.setProperty('label', 'CSS Style');
	    CSScontainer.setProperty("dataBinding", 'CSSContainer');

	    var CSScontainerframe = new UIWidget_frame();
	    CSScontainerframe.setModel(properties);
	    CSScontainerframe.addContent(CSScontainer);

	    var tabui = new UIWidget_tab();
	    tabui.addTab("Properties", propframe);
	    tabui.addTab("Position/Layout", CSScontainerframe);	    
	    return tabui;
	}
}

UIWidget_inputCheckbox.prototype = UIWidget;

var UIWidget_inputTextArea = function(){
	this.initialize();
	this.properties = {
			label : "Description",
			prompt : "Enter text here .....",
			dataBinding: 'description',
			CSSContainer: ''			
		}
	this.$.addClass('idr-ui-widget-inputtextarea');

	var label = $("<label class=idr-style-block>");
	var textarea = $("<textarea>");
	//this.$.append(label).append(textarea);
	this.appendJQ(label).appendJQ(textarea);
	
	this.refresh = function(){
		this.$.attr('style', this.properties.CSSContainer);
		label.html(this.properties.label);
		textarea.attr('placeholder',this.properties.prompt);
		textarea.attr('value','{{'+ this.properties.dataBinding +'}}');
		textarea.html('{{'+ this.properties.dataBinding +'}}');
	}
	
	this.refresh();

	this.edit_properties = function(properties) {
	    var uiprop1 = new UIWidget_inputField();
	    uiprop1.setProperty('label', 'Label');
	    uiprop1.setProperty("dataBinding", 'label');

	    var uiprop2 = new UIWidget_inputField();
	    uiprop2.setProperty('label', 'Prompt');
	    uiprop2.setProperty("dataBinding", 'prompt');
	    
	    var uiprop3 = new UIWidget_inputField();
	    uiprop3.setProperty('label', 'Binding');
	    uiprop3.setProperty("dataBinding", 'dataBinding');

	    var propframe = new UIWidget_frame();
	    propframe.setModel(properties);
	    propframe.addContent(uiprop1);
	    propframe.addContent(uiprop2);
	    propframe.addContent(uiprop3);

	    var CSScontainer = new UIWidget_inputTextArea();
	    CSScontainer.setProperty('label', 'CSS Style');
	    CSScontainer.setProperty("dataBinding", 'CSSContainer');

	    var CSScontainerframe = new UIWidget_frame();
	    CSScontainerframe.setModel(properties);
	    CSScontainerframe.addContent(CSScontainer);

	    var tabui = new UIWidget_tab();
	    tabui.addTab("Properties", propframe);
	    tabui.addTab("Position/Layout", CSScontainerframe);	    
	    return tabui;
	}
}

UIWidget_inputTextArea.prototype = UIWidget;


var UIWidget_inputSingleSelect = function(){
	this.initialize();
	this.properties = {
			label : "Pick a color",
			dataBinding: 'color',
			CSSContainer: '',
			style:'',
			options:[{key:'RED', value:'Red'},{key:'GREEN', value:'Green'}]
	}
	this.$.addClass('idr-ui-widget-inputsingleselect');

	var content = $("<span>");
	var label = $("<label class=idr-style-inherit>");
	var options = $('<select class=idr-style-inherit>');
	content.append(label).append(options);
	this.appendJQ(content);
	
	this.refresh = function(){
		this.$.attr('style', this.properties.CSSContainer);
		content.attr('style',this.properties.style);
		label.html(this.properties.label);
		options.empty();
		options.attr('value', '{{'+ this.properties.dataBinding +'}}');
		for (var i = 0; i < this.properties.options.length; i++) {
			var opt = $("<option>"+ this.properties.options[i].value + "</option>");
			opt.attr('value', this.properties.options[i].key)
			options.append(opt);
		}
	}
	
	this.refresh();

	this.edit_properties = function(properties) {    
	    var uiprop1 = new UIWidget_inputField();
	    uiprop1.setProperty('label', 'Label');
	    uiprop1.setProperty("dataBinding", 'label');

	    var uiprop2 = new UIWidget_inputField();
	    uiprop2.setProperty('label', 'Binding');
	    uiprop2.setProperty("dataBinding", 'dataBinding');

	    var propframe = new UIWidget_frame();
	    propframe.setModel(properties);
	    propframe.addContent(uiprop1);
	    propframe.addContent(uiprop2);

	    var CSScontainer = new UIWidget_inputTextArea();
	    CSScontainer.setProperty('label', 'CSS Style');
	    CSScontainer.setProperty("dataBinding", 'CSSContainer');

	    var CSScontainerframe = new UIWidget_frame();
	    CSScontainerframe.setModel(properties);
	    CSScontainerframe.addContent(CSScontainer);

	    var uistyle = new UIWidget_inputTextArea();
	    uistyle.setProperty('label', 'CSS Style');
	    uistyle.setProperty("dataBinding", 'style');

	    var styleframe = new UIWidget_frame();
	    styleframe.setModel(properties);
	    styleframe.addContent(uistyle);

	    var uiopt1 = new UIWidget_inputField();
	    uiopt1.setProperty('label', '');
	    uiopt1.setProperty("dataBinding", 'value');

	    var optionframe = new UIWidget_multiRowFrame();
	    optionframe.setModel(properties.options);
	    optionframe.addContent(uiopt1);
	    optionframe.bind('addRow', function(){
	    	properties.options.push({key:Math.uuid(5, 10), value:"New Option"});
	    });
	    	    
	    var tabui = new UIWidget_tab();
	    tabui.addTab("Properties", propframe);
	    tabui.addTab("Position/Layout", CSScontainerframe);
//	    tabui.addTab("CSS Style", styleframe);
	    tabui.addTab("Options", optionframe);	
	    
	    return tabui;
	}
}
UIWidget_inputSingleSelect.prototype = UIWidget;

var UIWidget_inputRadioGroup = function(){
	this.initialize();
	this.properties = {
			label : "Pick a color",
			dataBinding: 'color',
			CSSContainer: '',
			style:'',
			options:[{key:'RED', value:'Red'},{key:'GREEN', value:'Green'}]
	}
	this.$.addClass('idr-ui-widget-inputradio');

	var label = $("<label class=idr-style-inherit>");
	var options = $('<div class=idr-style-inherit>');
	this.appendJQ(label).appendJQ(options);
	
	this.refresh = function(){
		this.$.attr('style', this.properties.CSSContainer);
		label.html(this.properties.label);
		options.attr('style',this.properties.style);
		options.attr('value', '{{'+ this.properties.dataBinding +'}}');
		options.empty();
		options.attr('value', '{{'+ this.properties.dataBinding +'}}');
		for (var i = 0; i < this.properties.options.length; i++) {
			var opt = $("<span class=idr-style-inherit><input type='radio'>"+ this.properties.options[i].value + "</input><span>");
			opt.attr('name', this.idrObjectId);
			opt.attr('value', this.properties.options[i].key);
			options.append(opt);
		}
	}
	
	this.refresh();

	this.edit_properties = function(properties) {    
	    var uiprop1 = new UIWidget_inputField();
	    uiprop1.setProperty('label', 'Label');
	    uiprop1.setProperty("dataBinding", 'label');

	    var uiprop2 = new UIWidget_inputField();
	    uiprop2.setProperty('label', 'Binding');
	    uiprop2.setProperty("dataBinding", 'dataBinding');

	    var propframe = new UIWidget_frame();
	    propframe.setModel(properties);
	    propframe.addContent(uiprop1);
	    propframe.addContent(uiprop2);

	    var CSScontainer = new UIWidget_inputTextArea();
	    CSScontainer.setProperty('label', 'CSS Style');
	    CSScontainer.setProperty("dataBinding", 'CSSContainer');

	    var CSScontainerframe = new UIWidget_frame();
	    CSScontainerframe.setModel(properties);
	    CSScontainerframe.addContent(CSScontainer);

	    var uistyle = new UIWidget_inputTextArea();
	    uistyle.setProperty('label', 'CSS Style');
	    uistyle.setProperty("dataBinding", 'style');

	    var styleframe = new UIWidget_frame();
	    styleframe.setModel(properties);
	    styleframe.addContent(uistyle);

	    var uiopt1 = new UIWidget_inputField();
	    uiopt1.setProperty('label', '');
	    uiopt1.setProperty("dataBinding", 'value');

	    var optionframe = new UIWidget_multiRowFrame();
	    optionframe.setModel(properties.options);
	    optionframe.addContent(uiopt1);
	    optionframe.bind('addRow', function(){
	    	properties.options.push({key:Math.uuid(5, 10), value:"New Option"});
	    });
	    	    
	    var tabui = new UIWidget_tab();
	    tabui.addTab("Properties", propframe);
	    tabui.addTab("Position/Layout", CSScontainerframe);
	    tabui.addTab("CSS Style", styleframe);
	    tabui.addTab("Options", optionframe);	
	    
	    return tabui;
	}
}
UIWidget_inputRadioGroup.prototype = UIWidget;




var idrObj = function() {
	this.children = [];
	this.dump = function() {
		var temp = {}
		temp.factory = this.factory;
		temp.properties = this.properties;
		temp.actionHandler = this.actionHandler;
		temp.children = [];
		for (var i = 0; i < this.children.length; i++) {
			temp.children.push(this.children[i].dump());
		}
		return temp;
	}
};

var UIDesignerFactory = {
	factory : "UIDesignerFactory",

	create_object : function() {

		var properties_default = {};

		var idrObject = new idrObj();
		idrObject.idrObjectId = Math.uuid(5, 10);
		idrObject.factory = this.factory;
		idrObject.properties = properties_default;

		var idrNode = $("<div class=idr-uidesigner idrObjectId="+idrObject.idrObjectId+" >");
		idrObject.node = idrNode;
		idrObject.designer = new idrDesigner(idrNode, idrObject.idrObjectId);
		
		return idrObject;
	}
}

var idrDesigner = function(container, containerId){
	this.widgetFrame = $('<div class="widgetFrame">');

	var frameTemplate = $('<img id="frame_template" class="widget" idrWidgetFactory="UIWidget_frame" idrDesignerId='+ containerId +' src="resources/images/iframe.ico" draggable="true"/>');
	var fieldTemplate = $('<img id="field_template" class="widget" idrWidgetFactory="UIWidget_inputField" idrDesignerId='+ containerId +' src="resources/images/form_input_text.ico" draggable="true" />');
	var buttonTemplate = $('<img id="button_template" class="widget" idrWidgetFactory="UIWidget_button" idrDesignerId='+ containerId +' src="resources/images/form_input_button_ok.ico" draggable="true"/>');
	var textTemplate = $('<img id="text_template" class="widget" idrWidgetFactory="UIWidget_text" idrDesignerId='+ containerId +' src="resources/images/label.ico" draggable="true" />');
	var checkBoxTemplate = $('<img id="checkbox_template" class="widget" idrWidgetFactory="UIWidget_inputCheckbox" idrDesignerId='+ containerId +' src="resources/images/form_input_checkbox.ico" draggable="true" />');
	var textareaTemplate = $('<img id="textarea_template" class="widget" idrWidgetFactory="UIWidget_inputTextArea" idrDesignerId='+ containerId +' src="resources/images/form_input_textarea.ico" draggable="true" />');
	var singleSelectTemplate = $('<img id="select_single_template" class="widget" idrWidgetFactory="UIWidget_inputSingleSelect" idrDesignerId='+ containerId +' src="resources/images/form_input_select_single.ico" draggable="true"/>');
	var radioTemplate = $('<img id="radio_template" class="widget" idrWidgetFactory="UIWidget_inputRadioGroup" idrDesignerId='+ containerId +' src="resources/images/form_input_radio.ico" draggable="true" />');
	var tileTemplate = $('<img id="tile_template" class="widget" idrWidgetFactory="UIWidget_tile" idrDesignerId='+ containerId +' src="resources/images/application_tile_horizontal.ico" draggable="true" />');

	var dragstartHandler = function(ev) {
		ev.originalEvent.dataTransfer.setData("text/html", ev.target.id);
	}

	this.widgetFrame.on('dragstart','.widget', dragstartHandler);
	
	this.widgetFrame.append(frameTemplate).append(buttonTemplate).append(textTemplate)
			.append(fieldTemplate).append(checkBoxTemplate).append(radioTemplate).append(textareaTemplate)
			.append(singleSelectTemplate).append(tileTemplate);
	
	this.canvasFrame = new UIWidget_frame();
	this.canvasFrame.$.addClass("canvasFrame");
	
	designer = this;
	var dblclickHandler = function(ev){
		var t = $(ev.target);
		var t_idrObject = designer.idrObjectMap[t.closest("[idrObjectId]").attr("idrObjectId")];
		var form = designer.idrObjectMap[t_idrObject.idrObjectId]._edit_properties(designer.propertyFrame);
		designer.propertyFrame.clearContent();
		designer.propertyFrame.append(form);
		designer.propertyFrame.activate();
	}

	var dragOverHandler = function(ev){
		ev.preventDefault();
	};
	
	var dropHandler = function(ev){
		ev.preventDefault();
		ev.stopPropagation();
		var t = $(ev.target);
		if (t.hasClass("idr-ui-widget-frame")) {
			var sId = ev.originalEvent.dataTransfer.getData("text/html");
			var s = $("#" + sId);
			var wClass = s.attr("idrWidgetFactory");
			var t_idrObject = designer.idrObjectMap[t.attr("idrObjectId")];		
			var o = new window[wClass]();
			
			designer.idrObjectMap[o.idrObjectId] = o;			
			t_idrObject.addContent(o);						
		}
	};	
	
	this.canvasFrame.$.on('dblclick',dblclickHandler);
	this.canvasFrame.$.on("drop", dropHandler);
	this.canvasFrame.$.on("dragover", dragOverHandler);

	this.propertyFrame = new UIWidget_modal();
	container.append(this.widgetFrame).append(this.canvasFrame.show()).append(this.propertyFrame.show());
	this.propertyFrame.deActivate();
	
	this.rootNode = this.canvasFrame;
	this.idrObjectMap = {};
	this.idrObjectMap[this.canvasFrame.idrObjectId] = this.canvasFrame;
	
	this.dumpNodeTree = function(){
		console.log(JSON.stringify(this.rootNode.dump()));
	};

	this.saveUiNodeTree = function() {
		o = {}
		o.data = JSON.stringify(rootNode.dump());
		o.url = "uidesigner";
		o.onSuccess = function(data) {
			console.log(JSON.stringify(data));
		};

		console.log(o.data);

		$.ajax({
			url : o.url,
			data : {
				ui : o.data
			},
			dataType : "json",
			type : "POST",
			success : function(data) {
				o.onSuccess(data)
			}
		});
	};
	
	this.drop = function(){alert('Hello');};
};


function onPageLoad() {
	var mydesigner = UIDesignerFactory.create_object();
	idrUIGlobal.idrObjectMap[mydesigner.idrObjectId] = mydesigner;
	$('body').append(mydesigner.node);
    var dump = function(){mydesigner.dumpNodeTree();};
    var button = $('<button>click</button>');
//    button.click(dump);
//   $('body').append(button);

//    var overlay = $('<div class="overlay">');
//    $('body').append(overlay);
//    var popup = $('<div class="popup">');
//    var test = new UIWidget_form();
//    test.addContent(new UIWidget_button);
//    overlay.append(popup);
//    popup.append(test.show());

};