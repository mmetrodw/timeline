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

function dwtlCloneObject(object) {
  const clone = {};
  for(let property in object) {
    clone[property] = object[property];
  }
  return clone;
}

function dwtlReplaceObjectProps(object1, object2) {
  const object = dwtlCloneObject(object1);
  for(let property in object1) {
    object[property] = object2.hasOwnProperty(property) ? object2[property] : object1[property];
  }
  return object;
}

function dwtlMergeObjects(object1, object2) {
  const object = dwtlCloneObject(object1);
  for(let property in object2) {
    object[property] = typeof object1[property] === 'undefined' ? object2[property] : object1[property];
  }
  return object;
}


// Css Style

function dwtlAddCssStyle(target, styles) {
  for(let property in styles) {
    if (styles.hasOwnProperty(property)) {
      target.style[property] = styles[property]; 
    }
  }
}

function dwtlCreateAndAppend(tag, parent, className, styles) {
  const item = document.createElement(tag);
  if (className) {
    item.className = className
  };
  if (styles) {
    dwtlAddCssStyle(item, styles)
  };
  parent.appendChild(item);
  return item;
}

function dwtlCreateTimeline() {
  if(settings.target === null) {
    throw Error("Please, add Target")
  }

  elements.wrapper = document.getElementById(settings.target);
  elements.wrapper.classList.add("dwtl-wrapper");
  // Add style
  dwtlAddCssStyle(elements.wrapper, {
    width: settings.width,
    height: settings.height,
    borderRadius: settings.roundness
  });

  elements.periods = [];
  elements.navigations = [];
  let heading = null, content = null, link = null;
  
  elements.timeline = dwtlCreateAndAppend("DIV", elements.wrapper, "dwtl-timeline-events", {
    width: "100%",
    height: "100%",
  });
  const navigationWrapper = dwtlCreateAndAppend("DIV", elements.wrapper, "dwtl-timeline-navigation");
  
  settings.data.forEach((period) => {
    const event = dwtlCreateAndAppend("DIV", elements.timeline, "dwtl-event", {
      width: "100%",
      height: "100%",
    });
    
    if(period.image) {
      const imageWrapper = dwtlCreateAndAppend("DIV", event, "dwtl-event-image");
      imageWrapper.style.setProperty("--image-width", settings.height);
      const img = dwtlCreateAndAppend("IMG", imageWrapper).src = period.image;
    }
    
    const eventDetails = dwtlCreateAndAppend("DIV", event, "dwtl-event-details");
    
    if (period.date) {
      const date = dwtlCreateAndAppend("DIV", eventDetails, "dwtl-event-date");
      const eventDateTitle = dwtlCreateAndAppend("DIV", event, "dwtl-event-date-title");
      let index = 0;
      
      for (let spanText of period.date) {
        const span = dwtlCreateAndAppend("SPAN", eventDateTitle);
        span.textContent  = spanText;
        span.style.setProperty("--span-delay", 100 * index + "ms");
        date.appendChild(span.cloneNode(true));
        index++;
      }
    }

    if (period.heading) {
      heading = dwtlCreateAndAppend("DIV", eventDetails, "dwtl-event-heading");
      heading.textContent  = period.heading;
    }
    
    if (period.content) {
      content = dwtlCreateAndAppend("DIV", eventDetails, "dwtl-event-content")
      content.textContent  = period.content;
    }
    
    if (period.link) {
      const linkText = period.linkText || "Read more";
      link = dwtlCreateAndAppend("A", eventDetails, "dwtl-event-link");
      link.textContent  = linkText;
      link.href = period.link;
    }

    Array.from(eventDetails.children).forEach((detail) => {
      if(!detail.classList.contains("dwtl-event-date")) {
        let totalHeight = 20 + dwtlCalculateTotalHeight(detail);
        detail.style.setProperty("--start-position", totalHeight + "px");
      }
    });
    elements.periods.push(event);
    const navi = dwtlCreateAndAppend("DIV", navigationWrapper, "dwtl-navi");
    elements.navigations.push(navi);
  });

  // Select First Item In Navigation and Event
  elements.navigations[settings.currentEvent].classList.add("dwtl-active");
  elements.periods[settings.currentEvent].classList.add("dwtl-active");
}

function dwtlCalculateTotalHeight(item) {
  let totalHeight = item.offsetHeight;
  let sibling = item.nextElementSibling;
  
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
        let totalHeight = 20 + dwtlCalculateTotalHeight(detail);
        detail.style.setProperty("--start-position", totalHeight + "px");
      }
    });
  })
}

function dwtlSetActiveClass(elements, index) {
  elements.forEach((item) => {
    item.classList.remove("dwtl-active");
  });
  elements[index].classList.add("dwtl-active");
}

function dwtlSlideIt() {
  console.log("slide it")
  //elements.timeline.style.transition = "all 0.5s ease-in-out";
  elements.timeline.style.top = -elements.timeline.offsetHeight * settings.currentEvent + "px";
  elements.timeline.style.transform = "translateY(0px)";
  elements.timeline.style.cursor = "";
  if(currentDetails) {
    Array.from(currentDetails).forEach((item) => {
      item.style.transform = "translateY(var(--start-position))";
      item.style.animation = "";
    });
  }
  dwtlSetActiveClass(elements.navigations, settings.currentEvent);
  dwtlSetActiveClass(elements.periods, settings.currentEvent);
}

function dwtlNaviClick(event) {
  const index = elements.navigations.indexOf(event.currentTarget);
  console.log("click")
  settings.currentEvent = index;
  dwtlSlideIt();
}

function dwtlSlideDirection(direction) {
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
  event.preventDefault();
  dwtlSlideDirection(event.deltaY > 0);
  dwtlSlideIt();
}

let touchX = 0;
let touchY = 0;
let currentDetails = null;

function dwtlHandleMouseDown(event) {
  const targetElement = event.target;
  const excludeClasses = ['dwtl-event-date', 'dwtl-event-heading', 'dwtl-event-content', 'dwtl-event-link', 'dwtl-event-image'];
  if (excludeClasses.some(className => targetElement.classList.contains(className))) {
    return false;
  }
  touchX = event.clientX;
  touchY = event.clientY;

  currentDetails = elements.periods[settings.currentEvent].querySelector(".dwtl-event-details").children;
  elements.timeline.style.cursor = "grabbing";

  elements.timeline.addEventListener("mousemove", dwtlHandleMouseMove, {passive: false});
}

function dwtlHandleMouseMove(event) {
  event.preventDefault();
  const diffX = event.clientX - touchX;
  const diffY = event.clientY - touchY;

  elements.timeline.style.transform = "translateY(" + diffY +"px)";

  let speed = 1;
  const order = diffY < 0 ? Array.from(currentDetails) : Array.from(currentDetails).reverse();
  order.forEach((item) => {
    speed -= 0.25;
    item.style.transform = "translateY(" + diffY * speed +"px)";
    item.style.animation = "none";
  });
  
  if(Math.abs(diffY) > 100) {
    if(diffY < 0) {
      dwtlSlideDirection(true);
    } else {
      dwtlSlideDirection(false);
    }
    dwtlSlideIt();
    elements.timeline.removeEventListener("mousemove", dwtlHandleMouseMove);
    elements.timeline.style.cursor = "";
  }
}

function dwtlHandleMouseUp() {
  dwtlSlideIt();
  currentDetails = null;
  elements.timeline.removeEventListener("mousemove", dwtlHandleMouseMove);
}

function dwtlHandleTouchStart(event) {
  const targetElement = event.target;
  console.log(targetElement)
  const excludeClasses = ['dwtl-event-date', 'dwtl-event-heading', 'dwtl-event-content', 'dwtl-event-link', 'dwtl-event-image'];
  if (excludeClasses.some(className => targetElement.classList.contains(className))) {
    return false;
  }
  touchX = event.touches[0].clientX;
  touchY = event.touches[0].clientY;
  currentDetails = elements.periods[settings.currentEvent].querySelector(".dwtl-event-details").children;
  
  elements.timeline.addEventListener("touchmove", dwtlHandleTouchMove, {passive: false});
}

function dwtlHandleTouchMove(event) {
  event.preventDefault();
  const diffX = event.touches[0].clientX - touchX;
  const diffY = event.touches[0].clientY - touchY;
  
  elements.timeline.style.transform = "translateY(" + diffY +"px)";
  
  let speed = 1;
  const order = diffY < 0 ? Array.from(currentDetails) : Array.from(currentDetails).reverse();
  order.forEach((item) => {
    speed -= 0.25;
    item.style.transform = "translateY(" + diffY * speed +"px)";
    item.style.animation = "none";
  });
  
  if(Math.abs(diffY) > 100) {
    if(diffY < 0) {
      dwtlSlideDirection(true);
    } else {
      dwtlSlideDirection(false);
    }
    dwtlSlideIt();
    elements.timeline.removeEventListener("touchmove", dwtlHandleTouchMove);
  }
}

function dwtlHandleTouchEnd(event) {
  event.preventDefault();
  dwtlSlideIt();
  currentDetails = null;
  elements.timeline.removeEventListener("touchmove", dwtlHandleTouchMove);
}

function dwtlAddEvents() {
  window.onresize = dwtlWindowResize;
  
  elements.navigations.forEach((navi) => {
    navi.addEventListener("click", dwtlNaviClick);
  });

  elements.timeline.addEventListener("wheel", dwtlScrollEvent, {passive: false});
  elements.timeline.addEventListener("mousedown", dwtlHandleMouseDown, {passive: false});
  elements.timeline.addEventListener("mouseup", dwtlHandleMouseUp, {passive: false});
  elements.timeline.addEventListener("mouseleave", dwtlHandleMouseUp, {passive: false});
  elements.timeline.addEventListener("touchstart", dwtlHandleTouchStart, {passive: false});
  elements.timeline.addEventListener("touchend", dwtlHandleTouchEnd, {passive: false});
}

function dwTimeLine(params) {
  settings = dwtlReplaceObjectProps(defaultSettings, params);
  
  // check data
  if(settings.data === null) {
    throw Error("No data")
  }
  
  dwtlCreateTimeline();
  dwtlAddEvents();
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
  }, {
    date: "2021",
    heading: "Nunc eget lorem dolor sed viverra.",
    link: "#",
    linkText: "Read More"
  }]
})
