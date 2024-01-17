var heading = document.querySelector(".dwtl-period-heading");
var content = document.querySelector(".dwtl-period-content");
var image = document.querySelector(".dwtl-period-image");

function reportWindowSize() {
  image.style.setProperty('--image-width', image.offsetHeight + "px");
  heading.style.setProperty('--heading-start-position', heading.offsetHeight + 5 + content.offsetHeight + 20 + "px");
  content.style.setProperty('--content-start-position', content.offsetHeight + 20 + "px");
}

window.onresize = reportWindowSize;

reportWindowSize();