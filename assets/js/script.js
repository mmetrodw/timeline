class dwTimeLine {
  #settings = null;
  #defaultSettings = {
    target: null,
    width: "100%",
    height: "400px",
    roundness: "5px",
    data: null,
    currentEvent: 0
  };
  #elements = [];
  
  constructor(params) {
    console.log(this);
    this.#settings = this.#replaceObjectProps(this.#defaultSettings, params);
    // errors handle
    if (this.#settings.data === null) {
      throw Error("No data");
    }
    if (this.#settings.target === null) {
      throw Error("Please, add Target")
    }
    
    this.#buildTimeline();
  }
  
  #buildTimeline() {
    let elements = this.#elements;
    let settings = this.#settings;
    
    elements.wrapper = document.getElementById(settings.target);
    elements.wrapper.classList.add("dwtl-wrapper");
    this.#addCssStyle(elements.wrapper, {
      width: settings.width,
      height: settings.height,
      borderRadius: settings.roundness
    });
    
    elements.periods = [];
    elements.navigations = [];
    let heading = null, content = null, link = null;
    
    elements.timeline = this.#createAndAppend("DIV", elements.wrapper, "dwtl-timeline-events", {
      width: "100%",
      height: "100%",
    });
    const navigationWrapper = this.#createAndAppend("DIV", elements.wrapper, "dwtl-timeline-navigation");
    
    settings.data.forEach((period) => {
      const event = this.#createAndAppend("DIV", elements.timeline, "dwtl-event", {
        width: "100%",
        height: "100%",
      });
    
      if (period.image) {
        const imageWrapper = this.#createAndAppend("DIV", event, "dwtl-event-image");
        imageWrapper.style.setProperty("--image-width", settings.height);
        const img = this.#createAndAppend("IMG", imageWrapper).src = period.image;
      }
    
      const eventDetails = this.#createAndAppend("DIV", event, "dwtl-event-details");
    
      if (period.date) {
        const date = this.#createAndAppend("DIV", eventDetails, "dwtl-event-date");
        const eventDateTitle = this.#createAndAppend("DIV", event, "dwtl-event-date-title");
        let index = 0;
    
        for (let spanText of period.date) {
          const span = this.#createAndAppend("SPAN", eventDateTitle);
          span.textContent = spanText;
          span.style.setProperty("--span-delay", 100 * index + "ms");
          date.appendChild(span.cloneNode(true));
          index++;
        }
      }
    
      if (period.heading) {
        heading = this.#createAndAppend("DIV", eventDetails, "dwtl-event-heading");
        heading.textContent = period.heading;
      }
    
      if (period.content) {
        content = this.#createAndAppend("DIV", eventDetails, "dwtl-event-content")
        content.textContent = period.content;
      }
    
      if (period.link) {
        const linkText = period.linkText || "Read more";
        link = this.#createAndAppend("A", eventDetails, "dwtl-event-link");
        link.textContent = linkText;
        link.href = period.link;
      }
    
      Array.from(eventDetails.children).forEach((detail) => {
        if (!detail.classList.contains("dwtl-event-date")) {
          let totalHeight = 20 + this.#calculateTotalHeight(detail);
          detail.style.setProperty("--start-position", totalHeight + "px");
        }
      });
      
      elements.periods.push(event);
      const navi = this.#createAndAppend("DIV", navigationWrapper, "dwtl-navi");
      elements.navigations.push(navi);
    });
    
    // Select First Item In Navigation and Event
    elements.navigations[settings.currentEvent].classList.add("dwtl-active");
    elements.periods[settings.currentEvent].classList.add("dwtl-active");
  }
  
  
  
  
  #cloneObject(object) {
    const clone = {};
    for (let property in object) {
      clone[property] = object[property];
    }
    return clone;
  }
  
  #replaceObjectProps(object1, object2) {
    const object = this.#cloneObject(object1);
    for (let property in object1) {
      object[property] = object2.hasOwnProperty(property) ? object2[property] : object1[property];
    }
    return object;
  }
  
  #addCssStyle(target, styles) {
    for (let property in styles) {
      if (styles.hasOwnProperty(property)) {
        target.style[property] = styles[property];
      }
    }
  }
  
  #createAndAppend(tag, parent, className, styles) {
    const item = document.createElement(tag);
    if (className) {
      item.className = className
    };
    if (styles) {
      this.#addCssStyle(item, styles)
    };
    parent.appendChild(item);
    return item;
  }
  
  #calculateTotalHeight(item) {
    let totalHeight = item.offsetHeight;
    let sibling = item.nextElementSibling;
  
    while (sibling) {
      totalHeight += 5 + sibling.offsetHeight;
      sibling = sibling.nextElementSibling;
    }
  
    return totalHeight;
  }
}

new dwTimeLine({
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
});