//http://getcontenttools.com/tutorials/handling-image-uploads
function pdfUploader(dialog) {
    var pdf, xhr, xhrComplete, xhrProgress;

    // Set up the event handlers
    dialog.addEventListener('pdfuploader.cancelupload', function () {
        console.error('Not Implemented');
        // Cancel the current upload

        // Stop the upload
        if (xhr) {
            xhr.upload.removeEventListener('progress', xhrProgress);
            xhr.removeEventListener('readystatechange', xhrComplete);
            xhr.abort();
        }

        // Set the dialog to empty
        dialog.state('empty');
    });

    //NOTE: The size attribute referenced in the following code examples is always an array of the form [width, height] in pixels.
    dialog.addEventListener('pdfuploader.fileready', function (ev) {

        // Upload a file to the server
        var formData;
        var file = ev.detail().file;

        // Define functions to handle upload progress and completion
        xhrProgress = function (ev) {
            // Set the progress for the upload
            dialog.progress((ev.loaded / ev.total) * 100);
        }

        xhrComplete = function (ev) {
            var response;

            // Check the request is complete
            if (ev.target.readyState != 4) {
                return;
            }

            // Clear the request
            xhr = null
            xhrProgress = null
            xhrComplete = null

            // Handle the result of the upload
            if (parseInt(ev.target.status) == 200) {
                pdf = ev.target.responseText;
                // Trigger the save event against the dialog with the filename
                dialog.save(pdf);
                new ContentTools.FlashUI('ok')
            } else {
                // The request failed, notify the user
                new ContentTools.FlashUI('no');
            }
        }

        // Set the dialog state to uploading and reset the progress bar to 0
        dialog.state('uploading');
        dialog.progress(0);

        // Build the form data to post to the server
        formData = new FormData();
        formData.append('file', file);

        // Make the request
        xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', xhrProgress);
        xhr.addEventListener('readystatechange', xhrComplete);
        var pageID = getPageData().ID;//defined in editor.js
        xhr.open('POST', user.API + 'upload/pdf/' + pageID, true);
        xhr.setRequestHeader('Authorization', 'BEARER ' + user.token);
        xhr.send(formData);
    });
}