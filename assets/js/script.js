/* COMMENT 
var heading = document.querySelector(".dwtl-event-heading");
var content = document.querySelector(".dwtl-event-content");
var image = document.querySelector(".dwtl-event-image");

function dwtlWindowResize() {
  image.style.setProperty('--image-width', image.offsetHeight + "px");
  heading.style.setProperty('--heading-start-position', heading.offsetHeight + 5 + content.offsetHeight + 20 + "px");
  content.style.setProperty('--start-position', content.offsetHeight + 20 + "px");
}

window.onresize = dwtlWindowResize;

dwtlWindowResize();
*/




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

    let headingStartPos = 20,
        contentStartPos = 20,
        linkStartPos = 20;

    if (period.heading) {
      heading = createAndAppend("DIV", eventDetails, "dwtl-event-heading");
      heading.textContent  = period.heading;
      headingStartPos += heading.offsetHeight;
    }
    
    if (period.content) {
      content = createAndAppend("DIV", eventDetails, "dwtl-event-content")
      content.textContent  = period.content;
      headingStartPos += 5 + content.offsetHeight;
      contentStartPos += content.offsetHeight;
    }
    
    if (period.link) {
      const linkText = period.linkText || "Read more";
      link = createAndAppend("A", eventDetails, "dwtl-event-link");
      link.textContent  = linkText;
      link.href = period.link;
      headingStartPos += 5 + link.offsetHeight;
      contentStartPos += 5+ link.offsetHeight;
      linkStartPos += link.offsetHeight;
    }

    if(heading) {
      heading.style.setProperty("--start-position", headingStartPos + "px");
    }
    if(content) {
      content.style.setProperty("--start-position", contentStartPos + "px");
    }
    if(link) {
      link.style.setProperty("--start-position", linkStartPos + "px");
    }

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
  console.log("resize");
  elements.periods.forEach((period) => {
    let details = period.querySelector(".dwtl-event-details").children;
    
    Array.from(details).forEach((detail) => {
      if(!detail.classList.contains("dwtl-event-date")) {
        let totalHeight = 15 + calculateTotalHeight(detail);
        detail.style.setProperty("--start-position", totalHeight + "px");
      }
    });
  })
}

function slideIt() {
  console.log("slide it")
  elements.timeLine.style.top = -elements.timeLine.offsetHeight * settings.currentEvent + "px";
  elements.navigations.forEach((element) => {
    element.classList.remove("dwtl-active");
  });
  elements.navigations[settings.currentEvent].classList.add("dwtl-active");
  elements.periods.forEach((element) => {
    element.classList.remove("dwtl-active");
  });
  elements.periods[settings.currentEvent].classList.add("dwtl-active");
}

function dwtlNaviClick(event) {
  const index = elements.navigations.indexOf(event.currentTarget);
  console.log("click")
  settings.currentEvent = index;
  slideIt();
}

function addEventListeners() {
  window.onresize = dwtlWindowResize;
  
  elements.navigations.forEach((navi) => {
    navi.addEventListener("click", dwtlNaviClick);
  });
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