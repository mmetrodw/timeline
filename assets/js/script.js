const defaultSettings = {
  target: null,
  width: "100%",
  height: "400px",
  roundness: "5px",
  data: null,
  currentEvent: 0
}

var elements = {};
var settings;


// Objects 

function cloneObject(object) {
  const clone = {};
  for(let property in object) {
    clone[property] = object[property];
  }
  return clone;
}

function replaceObjectProps(object1, object2) {
  const object = cloneObject(object1);
  for(let property in object1) {
    object[property] = object2.hasOwnProperty(property) ? object2[property] : object1[property];
  }
  return object;
}

function mergeObjects(object1, object2) {
  const object = cloneObject(object1);
  for(let property in object2) {
    object[property] = typeof object1[property] === 'undefined' ? object2[property] : object1[property];
  }
  return object;
}

function createAndAppend(tag, parent, className, styles) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className
  };
  if (styles) {
    addCssStyle(element, styles)
  };
  parent.appendChild(element);
  return element;
}


// Css Style

function addCssStyle(element, styles) {
  for(let property in styles) {
    if (styles.hasOwnProperty(property)) {
      element.style[property] = styles[property]; 
    }
  }
}

function createTimeline() {
  if(settings.target === null) {
    throw Error("Please, add Target")
  }

  elements.wrapper = document.getElementById(settings.target);
  elements.wrapper.classList.add("dwtl-wrapper");
  // Add style
  addCssStyle(elements.wrapper, {
    width: settings.width,
    height: settings.height,
    borderRadius: settings.roundness
  });

  elements.periods = [];
  elements.navigations = [];
  let heading = null, content = null, link = null;
  
  elements.timeLine = createAndAppend("DIV", elements.wrapper, "dwtl-timeline-events", {
    width: "100%",
    height: "100%",
  });
  const navigationWrapper = createAndAppend("DIV", elements.wrapper, "dwtl-timeline-navigation");
  
  settings.data.forEach((period) => {
    const event = createAndAppend("DIV", elements.timeLine, "dwtl-event", {
      width: "100%",
      height: "100%",
    });
    
    if(period.image) {
      const imageWrapper = createAndAppend("DIV", event, "dwtl-event-image");
      imageWrapper.style.setProperty("--image-width", settings.height);
      const img = createAndAppend("IMG", imageWrapper).src = period.image;
    }
    
    const eventDetails = createAndAppend("DIV", event, "dwtl-event-details");
    
    if (period.date) {
      const date = createAndAppend("DIV", eventDetails, "dwtl-event-date");
      const eventDateTitle = createAndAppend("DIV", event, "dwtl-event-date-title");
      let index = 0;
      
      for (let spanText of period.date) {
        const span = createAndAppend("SPAN", eventDateTitle);
        span.textContent  = spanText;
        span.style.setProperty("--span-delay", 100 * index + "ms");
        date.appendChild(span.cloneNode(true));
        index++;
      }
    }

    if (period.heading) {
      heading = createAndAppend("DIV", eventDetails, "dwtl-event-heading");
      heading.textContent  = period.heading;
    }
    
    if (period.content) {
      content = createAndAppend("DIV", eventDetails, "dwtl-event-content")
      content.textContent  = period.content;
    }
    
    if (period.link) {
      const linkText = period.linkText || "Read more";
      link = createAndAppend("A", eventDetails, "dwtl-event-link");
      link.textContent  = linkText;
      link.href = period.link;
    }

    Array.from(eventDetails.children).forEach((detail) => {
      if(!detail.classList.contains("dwtl-event-date")) {
        let totalHeight = 20 + calculateTotalHeight(detail);
        detail.style.setProperty("--start-position", totalHeight + "px");
      }
    });
    elements.periods.push(event);
    const navi = createAndAppend("DIV", navigationWrapper, "dwtl-navi");
    elements.navigations.push(navi);
  });

  // Select First Item In Navigation and Event
  elements.navigations[settings.currentEvent].classList.add("dwtl-active");
  elements.periods[settings.currentEvent].classList.add("dwtl-active");
}

function calculateTotalHeight(element) {
  let totalHeight = element.offsetHeight;
  let sibling = element.nextElementSibling;
  
  while(sibling) {
    totalHeight += 5 + sibling.offsetHeight;
    sibling = sibling.nextElementSibling;
  }

  return totalHeight;
}

function dwtlWindowResize() {
  elements.periods.forEach((period) => {
    let details = period.querySelector(".dwtl-event-details").children;
    
    Array.from(details).forEach((detail) => {
      if(!detail.classList.contains("dwtl-event-date")) {
        let totalHeight = 20 + calculateTotalHeight(detail);
        detail.style.setProperty("--start-position", totalHeight + "px");
      }
    });
  })
}

function setActiveClass(elements, index) {
  elements.forEach((element) => {
    element.classList.remove("dwtl-active");
  });
  elements[index].classList.add("dwtl-active");
}

function slideIt() {
  console.log("slide it")
  elements.timeLine.style.top = -elements.timeLine.offsetHeight * settings.currentEvent + "px";
  setActiveClass(elements.navigations, settings.currentEvent);
  setActiveClass(elements.periods, settings.currentEvent);
}

function dwtlNaviClick(event) {
  const index = elements.navigations.indexOf(event.currentTarget);
  console.log("click")
  settings.currentEvent = index;
  slideIt();
}

function slideDirection(direction) {
  if(direction) {
    settings.currentEvent++;
    if (settings.currentEvent > settings.data.length - 1) {
      settings.currentEvent = 0;
    }
  } else {
    settings.currentEvent--;
    if (settings.currentEvent < 0) {
      settings.currentEvent = settings.data.length - 1;
    }
  }
}

function dwtlScrollEvent(event) {
  slideDirection(event.deltaY > 0);
  slideIt();
}

let touchX = 0;
let touchY = 0;
let currentDetails = null;

function dwtlHandleTouchStart(event) {
  event.preventDefault();
  
  touchX = event.touches[0].clientX;
  touchY = event.touches[0].clientY;
  currentDetails = elements.periods[settings.currentEvent].querySelector(".dwtl-event-details").children;
  
  elements.wrapper.addEventListener("touchmove", dwtlHandleTouchMove, {passive: true});
}

function dwtlHandleTouchMove(event) {
  event.preventDefault();
  const diffX = event.touches[0].clientX - touchX;
  const diffY = event.touches[0].clientY - touchY;
  
  elements.timeLine.style.transform = "translateY(" + diffY +"px)";
  
  let speed = 1;
  const order = diffY < 0 ? Array.from(currentDetails) : Array.from(currentDetails).reverse();
  order.forEach((item) => {
    speed -= 0.25;
    item.style.transform = "translateY(" + diffY * speed +"px)";
    item.style.animation = "none";
  });
  
  if(Math.abs(diffY) > 100) {
    if(diffY < 0) {
      slideDirection(true);
    } else {
      slideDirection(false);
    }
    slideIt();
    elements.wrapper.removeEventListener("touchmove", dwtlHandleTouchMove, {passive: true});
  }
}

function dwtlHandleTouchEnd(event) {
  event.preventDefault();
  elements.timeLine.style.transform = "translateY(0px)";
  
  Array.from(currentDetails).forEach((item) => {
    item.style.transform = "translateY(var(--start-position))";
    item.style.animation = "";
  });
  currentDetails = null;
  elements.wrapper.removeEventListener("touchmove", dwtlHandleTouchMove, {passive: true});
}

function addEventListeners() {
  window.onresize = dwtlWindowResize;
  
  elements.navigations.forEach((navi) => {
    navi.addEventListener("click", dwtlNaviClick);
  });

  elements.wrapper.addEventListener("wheel", dwtlScrollEvent, {passive: true});
  //elements.wrapper.addEventListener("mousedown", dwtlOnMouseDown, {passive: true});
  //elements.wrapper.addEventListener("mouseup", dwtlOnMouseUp, {passive: true});
  elements.wrapper.addEventListener("touchstart", dwtlHandleTouchStart, {passive: true});
  elements.wrapper.addEventListener("touchend", dwtlHandleTouchEnd, {passive: true});
}

function dwTimeLine(params) {
  settings = replaceObjectProps(defaultSettings, params);
  
  // check data
  if(settings.data === null) {
    throw Error("No data")
  }
  
  createTimeline();
  addEventListeners();
  console.log(elements);
}

let tl = dwTimeLine({
  target: "test",
  data: [{
    date: "2023",
    heading: "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
    content: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
  }, {
    date: "2022",
    image: "https://cc-prod.scene7.com/is/image/CCProdAuthor/adobe-firefly-marquee-text-to-image-0-mobile-600x600?$pjpeg$&jpegSize=100&wid=600",
    heading: "Nunc eget lorem dolor sed viverra.",
    content: "Aliquam ut porttitor leo a diam sollicitudin tempor id. Nunc pulvinar sapien et ligula ullamcorper malesuada. Ornare arcu odio ut sem nulla pharetra diam sit.",
    link: "#",
    linkText: "Читати повністю"
  }]
})
