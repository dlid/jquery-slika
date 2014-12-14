/*! jQuery Slika | (c) 2014 | https://github.com/dlid/jquery-slika  */
/* slika means image/painting in slovene language */
/*global window, jQuery */
/*jslint bitwise: true */
/*Compiled via http://closure-compiler.appspot.com/home*/
window.slika = (function (window, $) {
    'use strict';
    /** @global $ */
    /*global window, $ */
    /**
     * @global $
     */

    var Slika = function (elm, options) {
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
    dataNameSlikaInstance = "slika",
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
    classNameLightboxClose = 'slika-ui-close',
    classNameLightboxTitle = "slika-ui-title",
    defaultImageSelector = "a img",
    cssLoaderNormal = {
        fontWeight: 'normal'
    },
    cssLoaderHighlight = {
        fontWeight: 'bold'
    };

    Slika.prototype = {

        defaults: {
            useHash : true,
            selectText : 'Filter by tag',
            closeText : 'x'
        },

        init: function () {
            var self = this;
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

            this.jqTagList.append( $('<option>').text(this.config.selectText) );

            for (var i=0; i < this.tags.names.length; i++) {
                this.jqTagList.append( $('<option>').text(this.tags.names[i]).val(this.tags.names[i]));
            }

            
            this.jqToolbarElement
                .append($('<span>').addClass(classNameTagContainer).append(this.jqTagList))
                .append(slikaCreateLoader().hide())
            this.jqToolbarElement.css('visibility', 'visible').hide().fadeIn('slow');

            this.jqFilterElement.on('click', 'a', slikaRemoveTag);
            this.jqTagList.data(dataNameSlikaInstance, this).on('change', slikaSelectTag)


            if (this.config.useHash) {
                if (document.location.hash.indexOf('#!/') === 0) {
                    this.jqImageElements.hide();
                    $(window).on('hashchange', function(e) {
                        self.refreshFromHash();
                    });
                    this.refreshFromHash();
                }
            }


         },

         setFilter : function(newFilter) {
            if (typeof newFilter === "string" ) {
                var tags = newFilter.split('/'),
                    useTags = [],
                    tag;
                for( var i=0; i < tags.length; i++) {
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

         refreshFromHash : function(a,b) {
            if(document.location.hash.indexOf('#!/') === 0) {
                var tags = document.location.hash.substr(3);
                this.setFilter(document.location.hash.substr(3));
            } else {
                this.filter = {tags : []};
                this.refreshToolbar();
            }
         },

         refreshToolbar : function() {
            var self = this,
                tbr = this.jqToolbarElement,
                lst = this.jqTagList;

                lst.attr('disabled','disabled');

            startLoader(tbr.find('.' + classNameLoaderElement).attr('id'), slikaRefreshToolbar(self))
                .then(function() {
                lst.removeAttr('disabled');
                   
                });

         }

     };


     function slikaRemoveTag(e) {
         var slika = $(this).parent().data(dataNameSlikaInstance),
            selectedTag = $(this).data('tag'),
            index;

        e.preventDefault();



        if (!slika.filter) {
            slika.filter = { tags : [] };
        }

        index = $.inArray(selectedTag, slika.filter.tags);
        if (index!==-1) {
            slika.filter.tags.splice( index, 1 );
        }

        slikaUpdateHash(slika);

     }

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

     function slikaUpdateHash(slika) {
        var i,hashQuery = ""

        for(  i=0; i < slika.filter.tags.length; i++) {
            if (i > 0) {
                hashQuery += "/";
            }
            hashQuery+= encodeURIComponent(slika.filter.tags[i]);
        }

        if (slika.config.useHash) {
            document.location.hash = '#!/' + hashQuery;
        } else {
            slika.refreshToolbar();
        }
     }

     function slikaRefreshToolbar(slika){
        var deferred = $.Deferred();

        // Ok, let's make sure we only show the images with the
        // current filter
        // 

        var allTagitems = [],
            allItems = [],
            theones = [],
            allRemainingTags = [];

        if (slika.filter.tags && slika.filter.tags.length > 0) {

            for (var i=0; i < slika.filter.tags.length; i++) {
                for (var j = 0; j < slika.tags.images[slika.filter.tags[i]].length; j++) {
                    if ($.inArray(slika.tags.images[slika.filter.tags[i]][j], allItems) === -1) {
                        allItems.push(slika.tags.images[slika.filter.tags[i]][j]);
                    }
                }
                allTagitems.push( slika.tags.images[slika.filter.tags[i]] );
            }

            $(slika.jqImageElements).addClass('slika-temp-hidden');

            for( var i=0; i < allItems.length; i++) {
                var inTags = 0;
                for( var j=0; j < allTagitems.length; j++) {
                    if ( $.inArray(allItems[i], allTagitems[j]) !==-1 ) {
                        inTags ++;
                    }
                }
                if ( inTags === allTagitems.length) {
                    theones.push(allItems[i]);
                    $(slika.jqImageElements[allItems[i]]).removeClass('slika-temp-hidden');
                } 
            }

            $(slika.jqImageElements).filter('.slika-temp-hidden').fadeOut();
            $(slika.jqImageElements).not('.slika-temp-hidden').fadeIn();



            // Only show tags that exist for the selected filter
            for (var i=0; i < theones.length; i++) {
                for( var j=0; j < slika.tags.imageTags[theones[i]].length; j++) {
                    if ($.inArray(slika.tags.imageTags[theones[i]][j], allRemainingTags) === -1) {
                        if($.inArray(slika.tags.imageTags[theones[i]][j], slika.filter.tags) === -1) {
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
        for( var i=0; i < allRemainingTags.length; i++) {
            slika.jqTagList.append( $('<option>').text(allRemainingTags[i]).val(allRemainingTags[i]) );
        }

        slika.jqTagList.find('option').first().attr('selected','selected');

        
        for (var i=0; i < slika.filter.tags.length; i++) {
            slika.jqFilterElement.append($('<a>').data('tag', slika.filter.tags[i]).attr('href', '#' + slika.filter.tags[i]).text(slika.filter.tags[i]).append($('<span>').text('x')));
        }
        slika.jqFilterElement.css('visibility', 'visible');
      
        deferred.resolve();
    

        return deferred;
     }

     function startLoader(jqLoaderElementId, jqDeferred) {
        var deferred = $.Deferred(),
            jqLoaderElement = $('#' + jqLoaderElementId);
        jqLoaderElement.addClass('loader-active').find('span').css(cssLoaderNormal).end().fadeIn().css('display', 'inline-block');

   
            
    

        function highlightNext() {
            var nextItem = null;
            if (jqLoaderElement.find('.highlight').length==0) {
                nextItem = jqLoaderElement.find('span').first();
            } else {
                nextItem = jqLoaderElement.find('.highlight').next();
                jqLoaderElement.find('.highlight').removeClass('highlight').css(cssLoaderNormal);
            }
            nextItem.css(cssLoaderHighlight).addClass('highlight');
            setTimeout(function() {
                if(jqLoaderElement.hasClass('loader-active')) {
                    highlightNext();
                }
            },150);
        }
        highlightNext();

        jqDeferred.done(function() {
            jqLoaderElement.removeClass('loader-active').find('span').removeClass('highlight').css(cssLoaderNormal).end()
            .fadeOut(100, function() {
                deferred.resolve();
            });
        });

        return deferred;
     }

     function slikaCreateLoader() {
        uidCounter++;
        return $('<span>').attr('id', idNameLoader + uidCounter)
            .addClass(classNameLoaderElement)
            .html('<span>.</span><span>.</span><span>.</span>');
     }

     function slikaWrapInContainer() {

     }

     function slikaCloseOverlay() {
        var i = 0;

        function animationReady() {
        i++;
            if (i==2) {
                $('.' + classNameLightboxContainer).remove();
                $('.' + classNameOverlayElement).remove();
            }            
        }

        $('.' + classNameLightboxContainer).fadeOut('fast', animationReady);
        $('.' + classNameOverlayElement).fadeOut('fast', animationReady);

     }

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

     function slikaCallbackImageClick(e) {
        e.preventDefault();
        var jqContainer = $(this).closest('.' + classNameWrapperElement),
            slika = jqContainer.data(dataNameSlikaInstance),
            lightbox = $('.' + classNameLightboxContainer),
            closeBtn = $('<span>').addClass(classNameLightboxClose).text('x'),
            imageUrl = $(this).parent().attr('href'),
            imageTitle = $(this).attr('title');


        if (lightbox.length == 0) {
            lightbox = $('<div>').addClass(classNameLightboxContainer).hide();
            $('body').append(lightbox);
        }

        var d = $('<div>').addClass(classNameOverlayElement).appendTo('body').click(slikaCloseOverlay),
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

        var img = new Image();
       

        startLoader(loader.attr('id'), function(loaderDeferredHidden) {
            var da = $.Deferred();

            img.onload = function() {
                da.resolve();
            }

            img.src = imageUrl;
            return da;
        }()).done(function() {
                            // Find a good size for the image
                
                if (img.width > $(window).width()) {
                    img.width = $(window).width() - ($(window).width() * .2);
                }

                if (img.height > $(window).height()) {
                    img.height = $(window).height() - ($(window).height() * .2);
                }


                lightbox.css('visibility','hidden')
                .append(img);

                var tbrContainer = $('<div>').addClass(classNameLightboxToolbar)

                    .append($('<span>').addClass(classNameLightboxTitle).text(imageTitle))
                    .append($('<a>').addClass(classNameLightboxButton + ' close').html(slika.config.closeText))
                    /*.append($('<a>').addClass(classNameLightboxButton + ' disabled').html(slika.config.prevText))
                    .append($('<a>').addClass(classNameLightboxButton + ' next').html(slika.config.nextText))
                    .append($('<a>').addClass(classNameLightboxButton + ' info').html(slika.config.infoText))*/
                    .width($(img).width());

                lightbox.prepend(tbrContainer)
                .on('click', '.' + classNameLightboxButton, function() {
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
                lightbox.css('visibility','visible').hide().fadeIn();
               


        });

        
       
        


     }

     function slikaParseElements(slika) {

        var width = 0, height = 0, tags = {}, dataTags, tagsObj, i, tagNames = [], imageTags = [];

        slika.jqImageElements.each(function(index) {
            $(this).addClass(slika);
            dataTags = $(this).data('slikaTags');
            imageTags[index] = [];
            
            if (dataTags && typeof dataTags === "object") {
               if (Object.prototype.toString.call(dataTags) == "[object Array]") {
                    for (i = 0; i < dataTags.length; i++) {
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
        }
     }

     function slikaDebug() {
        if (this.config.debug && console !== undefined && console.log !== undefined) {
            console.log.apply(window.console, arguments);
        }
     }

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
                    } else {
                        new Slika(this, options || {}).init();
                    }
                });
            }
            $.error('No method ' + options + ' in slika');
        }
    };

    // To modify global settings
    Slika.globals = $.extend({}, window.slika);

    return Slika;

}(window, jQuery));