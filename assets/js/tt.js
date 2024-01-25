// BezierEasing https://github.com/gre/bezier-easing

const BezierEasing = (() => {

  const kSplineTableSize = 11;
  const kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

  function A(aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1 };
  function B(aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1 };
  function C(aA1)      { return 3.0 * aA1 };

  function calcBezier(aT, aA1, aA2) { return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT };
  function getSlope(aT, aA1, aA2) { return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1) };

  function binarySubdivide(aX, aA, aB, mX1, mX2) {
    let currentX, currentT, i = 0;
    do {
      currentT = aA + (aB - aA) / 2.0;
      currentX = calcBezier(currentT, mX1, mX2) - aX;
      if (currentX > 0.0) { aB = currentT } else { aA = currentT };
    } while (Math.abs(currentX) > 0.0000001 && ++i < 10);
    return currentT;
  }

  function newtonRaphsonIterate(aX, aGuessT, mX1, mX2) {
    for (let i = 0; i < 4; ++i) {
      const currentSlope = getSlope(aGuessT, mX1, mX2);
      if (currentSlope === 0.0) return aGuessT;
      const currentX = calcBezier(aGuessT, mX1, mX2) - aX;
      aGuessT -= currentX / currentSlope;
    }
    return aGuessT;
  }

  function BezierEasing(mX1, mY1, mX2, mY2) {

    if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) return;
    let sampleValues = new Float32Array(kSplineTableSize);

    if (mX1 !== mY1 || mX2 !== mY2) {
      for (let i = 0; i < kSplineTableSize; ++i) {
        sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
      }
    }

    function getTForX(aX) {

      let intervalStart = 0;
      let currentSample = 1;
      const lastSample = kSplineTableSize - 1;

      for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
        intervalStart += kSampleStepSize;
      }

      --currentSample;

      const dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
      const guessForT = intervalStart + dist * kSampleStepSize;
      const initialSlope = getSlope(guessForT, mX1, mX2);

      if (initialSlope >= 0.001) {
        return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
      } else if (initialSlope === 0.0) {
        return guessForT;
      } else {
        return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
      }

    }

    return x => {
      if (mX1 === mY1 && mX2 === mY2) return x;
      if (x === 0 || x === 1) return x;
      return calcBezier(getTForX(x), mY1, mY2);
    }

  }

  return BezierEasing;

})();

function smoothExit(t) {
  const easing = BezierEasing(1, 0, .9, 1);
  return easing(t)
}

function gentleInflow(t) {
  const easing = BezierEasing(.25, 0, 0, 1);
  return easing(t)
}

function harmoniousEase(t) {
  const easing = BezierEasing(1, 0, 1, 1);
  return easing(t)
}

function getUnit(val) {
  const split = /[+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?(%|px|pt|em|rem|in|cm|mm|ex|ch|pc|vw|vh|vmin|vmax|deg|rad|turn)?$/.exec(val);
  if (split) return split[1];
}

function getCSSValue(el, prop) {
  if (prop in el.style) {
    const uppercasePropName = prop.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    const value = el.style[prop] || getComputedStyle(el).getPropertyValue(uppercasePropName) || '0';
    return value;
  }
}

function dwMotion({duration = 1000, delay = 0, easing, draw, callback = null}) {
  const startTime = performance.now();

  requestAnimationFrame(function animate(timestamp) {
    const elapsed = timestamp - startTime;

    if(elapsed < delay) {
      requestAnimationFrame(animate);
      return;
    }

    const progress = Math.min(1, (elapsed - delay) / duration);

    const easedProgress = easing ? easing(progress) : progress;

    draw(easedProgress);

    if(progress < 1) {
      requestAnimationFrame(animate);
    } else {
      if(callback) {
        callback();
      }
    }
  });
}

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
  eventAnimation();
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

function eventAnimation() {
  const dateTitle = elements.periods[settings.currentEvent].querySelector(".dwtl-event-date-title");
  const dateSpan = elements.periods[settings.currentEvent].querySelector(".dwtl-event-date").children;
  const details = elements.periods[settings.currentEvent].querySelector(".dwtl-event-details").children;
  dwMotion({
    easing: smoothExit,
    draw(easedProgress) {
      const initialValue = 2;
      const finalValue = 1;
      const currentValue = ((finalValue - initialValue) * easedProgress) + initialValue;
      dateTitle.style.transform = "translate(-50%, -50%) scale(" + currentValue + ")";
    }
  });
  Array.from(dateTitle.children).forEach((item, index) => {
    dwMotion({
      duration: 800,
      delay: index * 100,
      easing: gentleInflow,
      draw(easedProgress) {
        const initialValue = 100;
        const finalValue = 0;
        const currentValue = ((finalValue - initialValue) * easedProgress) + initialValue;
        item.style.transform = "translateY(" + currentValue + "%)";
      },
      callback: () => {
        dwMotion({
          duration: 1000,
          delay: index * 100,
          easing: harmoniousEase,
          draw(easedProgress) {
            const initialValue = 0;
            const finalValue = -100;
            const currentValue = ((finalValue - initialValue) * easedProgress) + initialValue;
            item.style.transform = "translateY(" + currentValue + "%)";
          },
          callback: () => {
            if(index === 0) {
              Array.from(dateSpan).forEach((item, index) => {
                dwMotion({
                  duration: 1000,
                  delay: index * 100,
                  easing: gentleInflow,
                  draw(easedProgress) {
                    const initialValue = 100;
                    const finalValue = 0;
                    const currentValue = ((finalValue - initialValue) * easedProgress) + initialValue;
                    item.style.transform = "translateY(" + currentValue + "%)";
                  }
                });
                for(let i = 1; i <= details.length; i++)  {
                  dwMotion({
                    duration: 1000,
                    delay: 200 * i,
                    easing: gentleInflow,
                    draw(easedProgress) {
                      const initialValue = parseFloat(details[i].style.getPropertyValue('--start-position'));
                      const finalValue = 0;
                      const currentValue = ((finalValue - initialValue) * easedProgress) + initialValue;
                      details[i].style.transform = "translateY(" + currentValue + "px)";
                    }
                  });
                }
              });
            }
          }
        });
      }
    });
  });
}

function dwTimeLine(params) {
  settings = dwtlReplaceObjectProps(defaultSettings, params);
  
  // check data
  if(settings.data === null) {
    throw Error("No data")
  }
  
  dwtlCreateTimeline();
  dwtlAddEvents();
  eventAnimation();
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

