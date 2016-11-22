var user = window.user || JSON.parse(localStorage.user);//in editor.js and utilities.js
user.token = localStorage.access_token;
user.API = (window.location.href.indexOf("localhost") > -1 ? 'http://localhost:21695/cms/' : 'https://api.auburnalabama.org/cms/');
//user.API = 'http://localhost:21695/cms/';
//user.API = 'https://api.auburnalabama.org/cms/';

var editor;

window.getPageData = function() {
    var pageDataElem = document.getElementById('pageData');
    return {
        ID: pageDataElem.getAttribute('page-id'),
        SiteID: 1,
        PageTypeID: pageDataElem.getAttribute('page-type'),
        Name: pageDataElem.getAttribute('page-name'),
        Path: pageDataElem.getAttribute('page-path')
    };
}

window.addEventListener('load', function () {
    if (!user.token) return;
    
    //Config
    if (imageUploader)
        ContentTools.IMAGE_UPLOADER = imageUploader;
    
    if (pdfUploader)
        ContentTools.PDF_UPLOADER = pdfUploader;

    ContentTools.DEFAULT_TOOLS = [
        [
            'bold',
            'italic',
            'link',
            'align-left',
            'align-center',
            'align-right'
        ], [
            'heading',
            'subheading',
            'paragraph',
            'unordered-list',
            'ordered-list',
            'table'
        ], [
            'image',
            'video',
            'pdf'
        ], [
            'undo',
            'redo',
            'remove'
        ]
    ];

    editor = ContentTools.EditorApp.get();
    editor.init('*[data-editable]', 'data-name');
    var pageData = getPageData();
    if (pageData.PageTypeID == 1) {//if landing page
    	var defaultPlaceholder = editor.createPlaceholderElement;
    	editor.createPlaceholderElement = function (region) {
    		//NOTE!!! IMPORTANT!! - When adding here, don't forget to update editor.css if custom message wanted. 
    		//Entering content here will result in the page still having the content after the editor is switched off (though it won't save unless changed)
    		switch(region._domElement.getAttribute(editor._namingProp)) {
    			case 'landing-alert':
    				return new ContentEdit.Text('h2', {}, '');//fn(tagName, Attributes, Content)
    			case 'landing-services':
    				var list = new ContentEdit.List('ul', {});//fn(tagName, Attributes)
    				var listItem = new ContentEdit.ListItem();
    				var listItemText= new ContentEdit.ListItemText();
    				listItem.attach(listItemText);
    				list.attach(listItem);
    				return list;
    			case 'landing-news-header':
    				return new ContentEdit.Text('h2', {}, '');
    			case 'landing-calendar-header':
    				return new ContentEdit.Text('h2', {}, '');
    			case 'landing-action-content':
    				return new ContentEdit.Text('h2', {}, '');
    			case 'landing-faq':
    				var list = new ContentEdit.List('ul', {});//fn(tagName, Attributes) //NOTE: nested `ol` is bugged.
    				var listItem = new ContentEdit.ListItem();
    				var listItemText= new ContentEdit.ListItemText();
    				listItem.attach(listItemText);
    				list.attach(listItem);
    				return list;
    			default:
    				return defaultPlaceholder();//it's just `p`
    		}
    	}
    }

    editor.addEventListener('saved', function (ev) {
        var regions = ev.detail().regions;
        console.dir(regions);
        var pageData = getPageData();
        var regionPayload = [];
        for (var prop in regions) {
            regionPayload.push({
                "Name": prop,
                "SitePageID" : pageData.ID,
                "HTML": regions[prop]
            });
        }
        if (regionPayload.length == 0) {
        	console.log('no change');
        	return;
        }
        // Collect the contents of each region into a FormData instance
        //payload = new FormData();
        //var sitePage = pageData();
        //payload.append('page', sitePage);
        //payload.append('images', JSON.stringify(getImages(editor)));
        //payload.append('regions', JSON.stringify(regionPayload));

        // Send the updated content to the server to be saved
        function onStateChange(ev) {
            // Check if the request is finished
            if (ev.target.readyState == 4) {
                editor.busy(false);
                if (parseInt(ev.target.status) === 200) {
                    // Save was successful, notify the user with a flash
                    new ContentTools.FlashUI('ok');
                } else {
                    // Save failed, notify the user with a flash
                    new ContentTools.FlashUI('no');
                }
            }
        };

        xhr = new XMLHttpRequest();
        xhr.addEventListener('readystatechange', onStateChange);
        xhr.open('PUT', user.API + 'sitepage/' + pageData.ID + '/region');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Authorization', 'BEARER ' + user.token);
        xhr.send(JSON.stringify(regionPayload));
    });
});