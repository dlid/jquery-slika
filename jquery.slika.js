/*! jQuery Slika | (c) 2014 | https://github.com/dlid/jquery-slika  */
/* slika means image/painting in slovene language */
/*global window, jQuery, Image, setTimeout, document, console */
/*jslint bitwise: true */
/*Compiled via http://closure-compiler.appspot.com/home*/
window.slika = (function (window, $) {
    'use strict';
    /** @global $ */
    /*global window, $ */
    /**
     * @global $
     */

    var dataNameSlikaInstance = "slika",
        Slika = function (elm, options) {
            this.version = '0.1';
            this.jqElement = $(elm);
            this.jqElement.data(dataNameSlikaInstance, this);
            this.jqWrapperElement = null;
            this.jqContainerElement = null;
            this.jqToolbarElement = null;
            this.options = options;
            this.metadata = this.jqElement.data('slika');
            this.jqImageElements = null;
            this.tags = {};
        },
        uidCounter = 0,
        idNameLoader = 'slikaloader',
        classNameWrapperElement = "slika-ui-wrapper",
        classNameToolbarElement = "slika-ui-toolbar",
        classNameFilterElement = 'slika-ui-filter',
        classNameLoaderElement = "slika-ui-loader",
        classNameContainerElement = "slika-ui-container",
        classNameTagContainer = "slika-ui-tags",
        classNameTagList = "slika-ui-tag-list",
        classNameOverlayElement = "slika-ui-overlay",
        classNameLightboxButton = "slika-ui-nav",
        classNameLightboxContainer = "slika-ui-lightbox",
        classNameLightboxToolbar = 'slika-ui-lightbox-toolbar',
        classNameLightboxTitle = "slika-ui-title",
        defaultImageSelector = "a img",
        cssLoaderNormal = {
            fontWeight: 'normal'
        },
        cssLoaderHighlight = {
            fontWeight: 'bold'
        };

    /**
     * Update the location hash to match the current filter
     * @param  {object} slika [description]
     */
    function slikaUpdateHash(slika) {
        var i, hashQuery = "";

        for (i = 0; i < slika.filter.tags.length; i += 1) {
            if (i > 0) {
                hashQuery += "/";
            }
            hashQuery += encodeURIComponent(slika.filter.tags[i]);
        }

        if (slika.config.useHash) {
            document.location.hash = '#!/' + hashQuery;
        } else {
            slika.refreshToolbar();
        }
    }

    /**
     * Event receiver triggered when a tag is selected in the list
     */
    function slikaSelectTag() {
        var slika = $(this).data(dataNameSlikaInstance),
            selectedTag = $(this).val();

        if (!slika.filter) {
            slika.filter = { tags : [] };
        }

        if ($.inArray(selectedTag, slika.filter.tags) === -1) {
            slika.filter.tags.push(selectedTag);
        }

        slikaUpdateHash(slika);
    }

    /**
     * Event receiver triggered when a tag was clicked to be removed
     * @param  {Event} e [description]
     */
    function slikaRemoveTag(e) {
        var slika = $(this).parent().data(dataNameSlikaInstance),
            selectedTag = $(this).data('tag'),
            index;

        e.preventDefault();

        if (!slika.filter) {
            slika.filter = { tags : [] };
        }

        index = $.inArray(selectedTag, slika.filter.tags);
        if (index !== -1) {
            slika.filter.tags.splice(index, 1);
        }

        slikaUpdateHash(slika);
    }

    /**
     * Start a loader with a specified ID
     * @param  {string} jqLoaderElementId The ID of the loader element
     * @param  {$.Deferred} jqDeferred    Deferred object to wait for
     */
    function startLoader(jqLoaderElementId, jqDeferred) {
        var deferred = $.Deferred(),
            jqLoaderElement = $('#' + jqLoaderElementId),
            nextItem;

        jqLoaderElement.addClass('loader-active').find('span').css(cssLoaderNormal).end().fadeIn().css('display', 'inline-block');

        function highlightNext() {
            nextItem = null;
            if (jqLoaderElement.find('.highlight').length === 0) {
                nextItem = jqLoaderElement.find('span').first();
            } else {
                nextItem = jqLoaderElement.find('.highlight').next();
                jqLoaderElement.find('.highlight').removeClass('highlight').css(cssLoaderNormal);
            }
            nextItem.css(cssLoaderHighlight).addClass('highlight');
            setTimeout(function () {
                if (jqLoaderElement.hasClass('loader-active')) {
                    highlightNext();
                }
            }, 150);
        }
        highlightNext();

        jqDeferred.done(function () {
            jqLoaderElement.removeClass('loader-active').find('span').removeClass('highlight').css(cssLoaderNormal).end()
                .fadeOut(100, function () {
                    deferred.resolve();
                });
        });

        return deferred;
    }

    /**
     * Create a new loader element
     * @return {jQuery} New jQuery Element
     */
    function slikaCreateLoader() {
        uidCounter += 1;
        return $('<span>').attr('id', idNameLoader + uidCounter)
            .addClass(classNameLoaderElement)
            .html('<span>.</span><span>.</span><span>.</span>');
    }

    /**
     * Close the overlay, the image and remove the elements from the DOM
     */
    function slikaCloseOverlay() {
        var i = 0;

        function animationReady() {
            i += 1;
            if (i === 2) {
                $('.' + classNameLightboxContainer).remove();
                $('.' + classNameOverlayElement).remove();
            }
        }
        $('.' + classNameLightboxContainer).fadeOut('fast', animationReady);
        $('.' + classNameOverlayElement).fadeOut('fast', animationReady);
    }

    /**
     * Center the given element on the screen
     * @param  {jQuery} jqElm jQuery element to center
     */
    function slikaCenterElement(jqElm) {
        var windowWidth = $(window).width(), windowHeight = $(window).height(),
            w = $(jqElm).width(), h = $(jqElm).height(),
            x = (windowWidth / 2) - (w / 2),
            y = (windowHeight / 2) - (h / 2);

        jqElm.css({
            left : x + 'px',
            top : y + 'px'
        });
    }

    /**
     * Iterate all image elements and extract tags
     * @param  {object} slika Current Slika instance
     */
    function slikaParseElements(slika) {
        var tags = {}, dataTags,  i, tagNames = [], imageTags = [];

        slika.jqImageElements.each(function (index) {
            $(this).addClass(slika);
            dataTags = $(this).data('slikaTags');
            imageTags[index] = [];

            if (dataTags && typeof dataTags === "object") {
                if (Object.prototype.toString.call(dataTags) === "[object Array]") {
                    for (i = 0; i < dataTags.length; i += 1) {
                        if (tags[dataTags[i]] === undefined) {
                            tags[dataTags[i]] = [];
                            tagNames.push(dataTags[i]);
                        }
                        imageTags[index].push(dataTags[i]);
                        tags[dataTags[i]].push(index);
                    }
                }
            }
        });

        // Sort tag names
        tagNames.sort();

        slika.tags = {
            names : tagNames,
            images : tags,
            imageTags : imageTags
        };
    }

    /**
     * Callback for when an image is clicked
     * @param  {Event} e Click event
     */
    function slikaCallbackImageClick(e) {
        e.preventDefault();
        var jqContainer = $(this).closest('.' + classNameWrapperElement),
            slika = jqContainer.data(dataNameSlikaInstance),
            lightbox = $('.' + classNameLightboxContainer),
            imageUrl = $(this).parent().attr('href'),
            imageTitle = $(this).attr('title'),
            img,
            da,
            tbrContainer,
            loader;

        if (lightbox.length === 0) {
            lightbox = $('<div>').addClass(classNameLightboxContainer).hide();
            $('body').append(lightbox);
        }

        $('<div>').addClass(classNameOverlayElement).appendTo('body').click(slikaCloseOverlay);
        loader = slikaCreateLoader();

        lightbox.empty().addClass('slika-image').css({
            padding: '10px',
            width : '100px',
            height : '40px',
            textAlign : 'center',
            backgroundColor : 'transparent',
            left : 100,
            top: 100,
            position: 'fixed'
        }).append(loader).show();

        slikaCenterElement(lightbox);

        img = new Image();

        startLoader(loader.attr('id'), (function () {
            da = $.Deferred();

            img.onload = function () {
                da.resolve();
            };

            img.src = imageUrl;
            return da;
        }())).done(function () {
            // Find a good size for the image
            if (img.width > $(window).width()) {
                img.width = $(window).width() - ($(window).width() * 0.2);
            }

            if (img.height > $(window).height()) {
                img.height = $(window).height() - ($(window).height() * 0.2);
            }

            lightbox.css('visibility', 'hidden').append(img);
            tbrContainer = $('<div>').addClass(classNameLightboxToolbar)
                .append($('<span>').addClass(classNameLightboxTitle).text(imageTitle))
                .append($('<a>').addClass(classNameLightboxButton + ' close').html(slika.config.closeText))
                /*.append($('<a>').addClass(classNameLightboxButton + ' disabled').html(slika.config.prevText))
                .append($('<a>').addClass(classNameLightboxButton + ' next').html(slika.config.nextText))
                .append($('<a>').addClass(classNameLightboxButton + ' info').html(slika.config.infoText))*/
                .width($(img).width());

            lightbox.prepend(tbrContainer)
                .on('click', '.' + classNameLightboxButton, function () {
                    if ($(this).hasClass('close')) {
                        slikaCloseOverlay();
                    }
                });

            lightbox.css({
                backgroundColor: '#000',
                width : 'auto',
                height : 'auto'
            });
            slikaCenterElement(lightbox);
            lightbox.css('visibility', 'visible').hide().fadeIn();
        });
    }

    /**
     * Refresh the toolbar to only show the available tags
     * @param  {object} slika The current Slika instance
     */
    function slikaRefreshToolbar(slika) {
        var deferred = $.Deferred(),
            allTagitems = [],
            allItems = [],
            theones = [],
            allRemainingTags = [],
            i,
            j,
            inTags;

        if (slika.filter.tags && slika.filter.tags.length > 0) {

            for (i = 0; i < slika.filter.tags.length; i += 1) {
                for (j = 0; j < slika.tags.images[slika.filter.tags[i]].length; j += 1) {
                    if ($.inArray(slika.tags.images[slika.filter.tags[i]][j], allItems) === -1) {
                        allItems.push(slika.tags.images[slika.filter.tags[i]][j]);
                    }
                }
                allTagitems.push(slika.tags.images[slika.filter.tags[i]]);
            }

            $(slika.jqImageElements).addClass('slika-temp-hidden');

            for (i = 0; i < allItems.length; i += 1) {
                inTags = 0;
                for (j = 0; j < allTagitems.length; j += 1) {
                    if ($.inArray(allItems[i], allTagitems[j]) !== -1) {
                        inTags += 1;
                    }
                }
                if (inTags === allTagitems.length) {
                    theones.push(allItems[i]);
                    $(slika.jqImageElements[allItems[i]]).removeClass('slika-temp-hidden');
                }
            }

            $(slika.jqImageElements).filter('.slika-temp-hidden').fadeOut();
            $(slika.jqImageElements).not('.slika-temp-hidden').fadeIn();

            // Only show tags that exist for the selected filter
            for (i = 0; i < theones.length; i += 1) {
                for (j = 0; j < slika.tags.imageTags[theones[i]].length; j += 1) {
                    if ($.inArray(slika.tags.imageTags[theones[i]][j], allRemainingTags) === -1) {
                        if ($.inArray(slika.tags.imageTags[theones[i]][j], slika.filter.tags) === -1) {
                            allRemainingTags.push(slika.tags.imageTags[theones[i]][j]);
                        }
                    }
                }
            }
        } else {
            allRemainingTags = slika.tags.names;
            $(slika.jqImageElements).fadeIn();
        }

        slika.jqFilterElement.css('visibility', 'hidden').empty();

         // Sort tag names
        allRemainingTags.sort();


        slika.jqTagList.find('option').not(':nth-child(1)').remove();
        for (i = 0; i < allRemainingTags.length; i += 1) {
            slika.jqTagList.append($('<option>').text(allRemainingTags[i]).val(allRemainingTags[i]));
        }

        slika.jqTagList.find('option').first().attr('selected', 'selected');

        for (i = 0; i < slika.filter.tags.length; i += 1) {
            slika.jqFilterElement
                .append($('<a>').data('tag', slika.filter.tags[i]).attr('href', '#' + slika.filter.tags[i]).text(slika.filter.tags[i]).append($('<span>').text('x')));
        }
        slika.jqFilterElement.css('visibility', 'visible');

        deferred.resolve();

        return deferred;
    }



    Slika.prototype = {

        // Default parameters
        defaults: {
            useHash : true,
            selectText : 'Filter by tag',
            closeText : 'x'
        },

        // Initialize Slika
        init: function () {
            var self = this, i;
            this.config = $.extend(true, {}, this.defaults, Slika.globals, this.options);
            this.jqImageElements = this.jqElement.find(defaultImageSelector);
            slikaParseElements(this);
            this.jqElement.on('click', defaultImageSelector, slikaCallbackImageClick);
            this.jqToolbarElement = $('<div>').css('visibility', 'hidden').addClass(classNameToolbarElement);
            this.jqFilterElement = $('<div>').css('visibility', 'hidden').addClass(classNameFilterElement).data(dataNameSlikaInstance, this);
            this.jqWrapperElement = $('<div>').addClass(classNameWrapperElement).data(dataNameSlikaInstance, this);
            this.jqContainerElement = $('<div>').addClass(classNameContainerElement);
            this.jqWrapperElement.insertBefore(this.jqElement);
            this.jqWrapperElement.data(dataNameSlikaInstance, this).append(this.jqFilterElement).append(this.jqToolbarElement).append(this.jqContainerElement);
            this.jqElement.appendTo(this.jqContainerElement);

            this.jqTagList = $('<select>').addClass(classNameTagList);

            this.jqTagList.append($('<option>').text(this.config.selectText));

            for (i = 0; i < this.tags.names.length; i += 1) {
                this.jqTagList.append($('<option>').text(this.tags.names[i]).val(this.tags.names[i]));
            }

            this.jqToolbarElement
                .append($('<span>').addClass(classNameTagContainer).append(this.jqTagList))
                .append(slikaCreateLoader().hide())
                .css('visibility', 'visible').hide().fadeIn('slow');

            this.jqFilterElement.on('click', 'a', slikaRemoveTag);
            this.jqTagList.data(dataNameSlikaInstance, this).on('change', slikaSelectTag);

            if (this.config.useHash) {
                if (document.location.hash.indexOf('#!/') === 0) {
                    this.jqImageElements.hide();
                }
                $(window).on('hashchange', function () {
                    self.refreshFromHash();
                });
                this.refreshFromHash();
            }
        },

        /**
         * Set the current tag filter
         * @param  {string} newFilter string with uri encoded tags separated with /
         */
        setFilter : function (newFilter) {
            if (typeof newFilter === "string") {
                var tags = newFilter.split('/'),
                    useTags = [],
                    tag,
                    i;
                for (i = 0; i < tags.length; i += 1) {
                    tag = $.trim(decodeURIComponent(tags[i]));
                    if (tag) {
                        useTags.push(tag);
                    }
                }
                this.filter = {
                    tags : useTags
                };
                this.refreshToolbar();
            }
        },

        /**
         * Refresh the filter and images based on current hash string
         */
        refreshFromHash : function () {
            if (document.location.hash.indexOf('#!/') === 0) {
                this.setFilter(document.location.hash.substr(3));
            } else {
                this.filter = {tags : []};
                this.refreshToolbar();
            }
        },

        /**
         * Refresh the toolbar
         */
        refreshToolbar : function () {
            var self = this,
                tbr = this.jqToolbarElement,
                lst = this.jqTagList;

            lst.attr('disabled', 'disabled');

            startLoader(tbr.find('.' + classNameLoaderElement).attr('id'), slikaRefreshToolbar(self))
                .then(function () {
                    lst.removeAttr('disabled');
                });
        }

    };

    // Add as a jQuery plugin
    $.fn.slika = function (options) {
        if (Slika.prototype[options]) {
            // only call methods on created objects
            if ($(this).data(dataNameSlikaInstance)) {
                return Slika.prototype[options]
                    .apply($(this), Array.prototype.slice.call(arguments, 1));
            }
        } else {
            if (typeof options === 'object' || !options) {
                return this.each(function () {
                    if ($(this).data(dataNameSlikaInstance)) {
                        return this;
                    }
                    return new Slika(this, options || {}).init();
                });
            }
            $.error('No method ' + options + ' in slika');
        }
    };

    // To modify global settings
    Slika.globals = $.extend({}, window.slika);

    return Slika;

}(window, jQuery));