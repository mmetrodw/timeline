var heading = document.querySelector(".dwtl-event-heading");
var content = document.querySelector(".dwtl-event-content");
var image = document.querySelector(".dwtl-event-image");

function reportWindowSize() {
  image.style.setProperty('--image-width', image.offsetHeight + "px");
  heading.style.setProperty('--heading-start-position', heading.offsetHeight + 5 + content.offsetHeight + 20 + "px");
  content.style.setProperty('--content-start-position', content.offsetHeight + 20 + "px");
}

window.onresize = reportWindowSize;

reportWindowSize();





const defaultSettings = {
  target: null,
  width: "100%",
  height: "400px",
  roundness: "5px",
  data: null
}

var elements = {};


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
  if (className) element.className = className;
  if (styles) addCssStyle(element, styles);
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

function createTimeline(settings) {
  if(settings.target === null) {
    throw Error("Please, add Target")
  }

  elements.wrapper = document.getElementById(settings.target);
  elements.wrapper.classList.add("dwtl-timeline");
  // Add style
  addCssStyle(elements.wrapper, {
    width: settings.width,
    height: settings.height,
    borderRadius: settings.roundness
  });
  
  const eventsWrapper = createAndAppend("DIV", elements.wrapper, "dwtl-timeline-events", {
    width: "100%",
    height: "100%",
  });
  
  elements.periods = [];
  elements.navigations = [];
  
  settings.data.forEach((period) => {
    const event = createAndAppend("DIV", eventsWrapper, "dwtl-event", {
      width: "100%",
      height: "100%",
    });
    
    if(period.image) {
      const imageWrapper = createAndAppend("DIV", event, "dwtl-event-image");
      const img = createAndAppend("IMG", imageWrapper).src = period.image;
    }
    
    const eventDetails = createAndAppend("DIV", event, "dwtl-event-details");
    
    if (period.date) {
      const date = createAndAppend("DIV", eventDetails, "dwtl-event-date");
      const eventDateTitle = createAndAppend("DIV", eventDetails, "dwtl-event-date-title");
      let index = 0;
      
      for (spanText of period.date) {
        const span = createAndAppend("SPAN", eventDateTitle);
        span.innerText = spanText;
        span.style.setProperty("--span-delay", 100 * index + "ms");
        date.appendChild(span.cloneNode(true));
        index++;
      }
    }
    
    if (period.heading) {
      const heading = createAndAppend("DIV", eventDetails, "dwtl-event-heading").innerText = period.heading
    }
    
    if (period.content) {
      const content = createAndAppend("DIV", eventDetails, "dwtl-event-content").innerText = period.content;
    }
    
    if (period.link) {
      const linkText = period.linkText || "Read more";
      const link = createAndAppend("A", eventDetails, "dwtl-event-link").innerText = linkText;
      link.href = period.link;
    }
    
    elements.periods.push(event);
  });
  
  const navigationWrapper = createAndAppend("DIV", elements.wrapper, "dwtl-timeline-navigation");
  
  for (const period of settings.data) {
    const navi = createAndAppend("DIV", navigationWrapper, "dwtl-navi");
    elements.navigations.push(navi);
  }

  elements.navigations[0].classList.add("dwtl-active");
}

function dwTimeLine(params) {
  const settings = replaceObjectProps(defaultSettings, params);
  
  // check data
  if(settings.data === null) {
    throw Error("No data")
  }
  
  createTimeline(settings);
  console.log(elements);
}

let tl = dwTimeLine({
  target: "test",
  data: [{
    date: "18.01.2023",
    heading: "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
    content: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
  }, {
    date: "17.01.2023",
    image: "https://cc-prod.scene7.com/is/image/CCProdAuthor/adobe-firefly-marquee-text-to-image-0-mobile-600x600?$pjpeg$&jpegSize=100&wid=600",
    heading: "Nunc eget lorem dolor sed viverra.",
    content: "Aliquam ut porttitor leo a diam sollicitudin tempor id. Nunc pulvinar sapien et ligula ullamcorper malesuada. Ornare arcu odio ut sem nulla pharetra diam sit.",
    link: "#",
    linkText: "Читати повністю"
  }]
})