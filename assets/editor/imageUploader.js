//http://getcontenttools.com/tutorials/handling-image-uploads
function imageUploader(dialog) {
    var image, xhr, xhrComplete, xhrProgress;

    // Set up the event handlers
    dialog.addEventListener('imageuploader.cancelupload', function () {
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

    dialog.addEventListener('imageuploader.clear', function () {
        // Clear the current image
        dialog.clear();
        image = null;
    });

    //NOTE: The size attribute referenced in the following code examples is always an array of the form [width, height] in pixels.
    dialog.addEventListener('imageuploader.fileready', function (ev) {

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
                // Unpack the response (from JSON)
                response = JSON.parse(ev.target.responseText);

                // Store the image details
                image = {
                    size: response.size,
                    url: response.url
                };

                // Populate the dialog
                dialog.populate(image.url, image.size);

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
        xhr.open('PUT', user.API + 'upload/image', true);
        xhr.setRequestHeader('Authorization', 'BEARER ' + user.token);
        xhr.send(formData);
    });

    dialog.addEventListener('imageuploader.rotateccw', function () {
        alert('Not Implemented!');
    });

    dialog.addEventListener('imageuploader.rotatecw', function () {
        alert('Not Implemented!');
    });

    //The cropRegion is specified as a list of normalized values: top, left, bottom, right (e.g [0, 0, 1, 1] is the full image).
    dialog.addEventListener('imageuploader.save', function () {
        var crop, cropRegion, formData;

        // Define a function to handle the request completion
        xhrComplete = function (ev) {
            // Check the request is complete
            if (ev.target.readyState !== 4) {
                return;
            }

            // Clear the request
            xhr = null
            xhrComplete = null

            // Free the dialog from its busy state
            dialog.busy(false);

            // Handle the result of the rotation
            if (parseInt(ev.target.status) === 200) {
                // Unpack the response (from JSON)
                var response = JSON.parse(ev.target.responseText);

                // Trigger the save event against the dialog with details of the
                // image to be inserted.
                dialog.save(
                    response.url,
                    response.size,
                    {
                        'alt': response.alt,
                        'data-ce-max-width': response.size[0]
                    });

            } else {
                // The request failed, notify the user
                new ContentTools.FlashUI('no');
            }
        }

        // Set the dialog to busy while the rotate is performed
        dialog.busy(true);

        // Build the form data to post to the server
        formData = new FormData();
        formData.append('url', image.url);

        // Set the width of the image when it's inserted, this is a default
        // the user will be able to resize the image afterwards.
        //formData.append('width', 600);

        // Check if a crop region has been defined by the user
        if (dialog.cropRegion()) {
            formData.append('crop', dialog.cropRegion());
        }

        // Make the request
        xhr = new XMLHttpRequest();
        xhr.addEventListener('readystatechange', xhrComplete);
        //TODO - Figure out width, implement `alt`. I dunno.
        var pageID = getPageData().ID;//defined in editor.js
        xhr.open('POST', user.API + 'upload/image/' + pageID, true);
        xhr.setRequestHeader('Authorization', 'BEARER ' + user.token);
        xhr.send(formData);
    });
}

function getImages(editor) {
    // Return an object containing image URLs and widths for all regions
    var descendants, i, images;

    images = {};
    for (name in editor.regions) {
        // Search each region for images
        descendants = editor.regions[name].descendants();
        for (i = 0; i < descendants.length; i++) {
            // Filter out elements that are not images
            if (descendants[i].type() !== 'Image') {
                continue;
            }
            images[descendants[i].attr('src')] = descendants[i].size()[0];
        }
    }

    return images;
}