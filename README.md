# jQuery Slika

Sika is a tiny jQuery plugin that will turn your list of image links into a list filterable by tags

[Check out a demo](http://goo.gl/9aZIUS Demo)

### Features
 - Add tag filtering to a static list of images
 - Simple Lightbox feature for viewing images

### Version
1.0

### Tech

Slika uses one well known open source project to work properly:

* [jQuery] - duh

### Installation

Download Slika and include it after jQuery on your page.

```sh
<script src="jquery.js"></script>
<script src="jquery.slika.js"></script>
```

Also make sure to include the Slika CSS that  you can use as a base  for changing the style of Slika.

```sh
<link rel="stylesheet" type="text/css" href="jquery.slika.css">
```
Then you have to have your list of images. Currently Slika supports only a wrapping element containing a list of a-elements. Each a-element must contain one img-element.

```sh
<div id="wrapper">
 <a href="big-image.jpg"><img src="thumb1.jpg" title="Image title" data-slika-tags="['Tag 1', 'Tag 2']" /></a>
 <a href="big-image2.jpg"><img src="thumb2.jpg" title="Image2 title" data-slika-tags="['Tag 2', 'Tag 3']" /></a>
</div>
```
That's what you need. Then you initialize Slika on your wrapper, and boom you will have the ability to quickly filter and drill down by the tags you've set.

```sh
<script type="text/javascript">
$(function() {
  $("#wrapper").slika();
});
</script>
```

### Todo's

 - Let the user change CSS class names
 - Back/Forward navigation in Lightbox
 - Load data from an Ajax source
 - Support paging
 - Additional and more customizable filters
 - Appliable to other things than images
 - More flexible selectors (supporting more than a-elements containing an img-element)

License
----

MIT
[jQuery]:http://jquery.com

