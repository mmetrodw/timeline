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

function dwMotion({duration = 1000, delay = 0, easing, draw, callback = null}) {
  const startTime = performance.now();

  function animate(timestamp) {
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
  }

	requestAnimationFrame(animate);
}

class dwTimeLine {
	#defaultSettings = {
		target: null,
		width: "100%",
		height: "400px",
		roundness: "5px",
		data: null,
	};
	#settings = null;
	#elements = [];
	#currentEvent = 0;
	#sliding = false;
	
	constructor(params) {
		this.#settings = this.#replaceObjectProps(this.#defaultSettings, params);
		// Errors handle
		if (this.#settings.data === null) {
			throw Error("No data");
		}
		if (this.#settings.target === null) {
			throw Error("Please, add Target")
		}
		
		this.#buildTimeline();
		this.#showEvent();
		this.#addEventlisteners();
		console.log(this);
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
		
		elements.events = [];
		elements.navigations = [];
		
		elements.timeline = this.#createAndAppend("DIV", elements.wrapper, "dwtl-timeline-events", {
			width: "100%",
			height: "100%",
		});
		elements.navigationWrapper = this.#createAndAppend("DIV", elements.wrapper, "dwtl-timeline-navigation");
		
		this.#createEvent(settings.data);

		elements.naviToolTip  = this.#createAndAppend("DIV", elements.wrapper, "dwtl-timeline-navigation-tooltip", null);

		// Select First Item In Navigation and Event
		elements.navigations[this.#currentEvent].classList.add("dwtl-active");
		elements.events[this.#currentEvent].classList.add("dwtl-active");
	}
	
	#createEvent(data) {
		let elements = this.#elements;
		
		data.forEach((event) => {
			const wrapper = this.#createAndAppend("DIV", elements.timeline, "dwtl-event", {
				width: "100%",
				height: "100%",
			});
		
			if (event.image) {
				const imageWrapper = this.#createAndAppend("DIV", wrapper, "dwtl-event-image");
				this.#createAndAppend("IMG", imageWrapper).src = event.image;
				imageWrapper.style.width = this.#settings.height;
			}
		
			const eventDetails = this.#createAndAppend("DIV", wrapper, "dwtl-event-details");
		
			if (event.date) {
				const date = this.#createAndAppend("DIV", eventDetails, "dwtl-event-date");
				const eventtitle = this.#createAndAppend("DIV", wrapper, "dwtl-event-title");
				let index = 0;
		
				for (let spanText of event.date) {
					const span = this.#createAndAppend("SPAN", eventtitle);
					span.textContent = spanText;
					date.appendChild(span.cloneNode(true));
					index++;
				}
			}
		
			if (event.heading) {
				const heading = this.#createAndAppend("DIV", eventDetails, "dwtl-event-heading");
				heading.textContent = event.heading;
			}
		
			if (event.content) {
				const content = this.#createAndAppend("DIV", eventDetails, "dwtl-event-content")
				content.textContent = event.content;
			}
		
			if (event.link) {
				const linkText = event.linkText || "Read more";
				const link = this.#createAndAppend("A", eventDetails, "dwtl-event-link");
				link.textContent = linkText;
				link.href = event.link;
			}

			Array.from(eventDetails.children).forEach((item) => {
				if(!item.classList.contains("dwtl-event-date")) {
					let totalHeight = 20 + this.#calculateTotalHeight(item);
					item.style.transform = "translateY(" + totalHeight + "px)";
				}
			});

			elements.events.push(wrapper);
			const navi = this.#createAndAppend("DIV", elements.navigationWrapper, "dwtl-navi");
			const naviToolTip = this.#createAndAppend("DIV", navi, "dwtl-timeline-navigation-tooltip");
			naviToolTip.innerText = event.date;
			elements.navigations.push(navi);
		});
	}
	
	#addEventlisteners() {
		const elements = this.#elements;
		elements.navigations.forEach((navi) => {
			navi.addEventListener("click", this.#naviClick);
		});

		elements.timeline.addEventListener("wheel", this.#scrollEvent, {passive: false});
		elements.timeline.addEventListener("mousedown", this.#handleMouseDown, {passive: false});
	}

	#naviClick = (event) => {
		this.#clearEvent();
		const index = this.#elements.navigations.indexOf(event.currentTarget);
		this.#currentEvent = index;
		this.#slideIt();
	}

	#scrollEvent = (event) => {
		event.preventDefault();
		if(this.#sliding) {
			return;
		}
		this.#sliding = true;
		this.#clearEvent();
		this.#getSlideDirection(event.deltaY > 0);
		this.#slideIt();
	}

	#handleMouseDown = (event) => {
		if(this.#sliding) {
			return;
		}
		const targetElement = event.target;
		const excludeClasses = ['dwtl-event-date', 'dwtl-event-heading', 'dwtl-event-content', 'dwtl-event-link', 'dwtl-event-image'];
		if (excludeClasses.some(className => targetElement.classList.contains(className))) {
			return false;
		}
		this.touchX = event.clientX;
		this.touchY = event.clientY;

		this.#elements.currentDetails = this.#elements.events[this.#currentEvent].querySelector(".dwtl-event-details").children;
		this.#elements.timeline.style.cursor = "grabbing";

		this.#elements.timeline.addEventListener("mousemove", this.#handleMouseMove, {passive: false});
		this.#elements.timeline.addEventListener("mouseup", this.#handleMouseUp);
    this.#elements.timeline.addEventListener("mouseleave", this.#handleMouseUp);
	}

	#handleMouseMove = (event) => {
		event.preventDefault();
		const diffX = event.clientX - this.touchX;
		const diffY = event.clientY - this.touchY;
	
		this.#elements.timeline.style.transform = "translateY(" + diffY +"px)";
	
		let speed = 1;
		
		const order = diffY < 0 ? Array.from(this.#elements.currentDetails) : Array.from(this.#elements.currentDetails).reverse();
		order.forEach((item) => {
			speed -= 0.25;
			item.style.transform = "translateY(" + diffY * speed +"px)";
		});
		
		if (Math.abs(diffY) > 150) {
			this.#getSlideDirection(diffY < 0);
			this.#clearEvent();
			this.#slideIt();
			this.#cleanupAfterSlide();
		}
	}

	#handleMouseUp = (event) => {
		event.preventDefault();
		const diffX = event.clientX - this.touchX;
		const diffY = event.clientY - this.touchY;
		const elements = this.#elements;

		this.#cleanupAfterSlide();
		
		if (Math.abs(diffY) > 150) {
			this.#getSlideDirection(diffY < 0);
			this.#clearEvent();
			this.#slideIt();
		} else {
			elements.timeline.style.transition = "transform 300ms cubic-bezier(0.55, 0, 1, 0.45)";
			elements.timeline.style.transform = "translateY(0px)";
			setTimeout(() => {
				elements.timeline.style.transition = "";
			}, 350);
			elements.currentDetails = elements.events[this.#currentEvent].querySelector(".dwtl-event-details").children;
			Array.from(elements.currentDetails).forEach((item) => {
				item.style.transition = "transform 300ms cubic-bezier(0.55, 0, 1, 0.45)";
				item.style.transform = "translateY(0px)";
				setTimeout(() => {
					item.style.transition = "";
				}, 350);
			});
		}
	}

	#cleanupAfterSlide = (event) => {
    this.#elements.currentDetails = null;
    this.#elements.timeline.style.cursor = "";
    this.#elements.timeline.removeEventListener("mousemove", this.#handleMouseMove);
    this.#elements.timeline.removeEventListener("mouseup", this.#handleMouseUp);
    this.#elements.timeline.removeEventListener("mouseleave", this.#handleMouseUp);
	}

	#getSlideDirection(direction) {
		if(direction) {
			this.#currentEvent++;
			if (this.#currentEvent > this.#settings.data.length - 1) {
				this.#currentEvent = 0;
			}
		} else {
			this.#currentEvent--;
			if (this.#currentEvent < 0) {
				this.#currentEvent = this.#settings.data.length - 1;
			}
		}
	}

	#clearEvent() {
		this.#elements.events.forEach(element => {
			const dateChar = element.querySelector(".dwtl-event-date").children;
			const details = element.querySelector(".dwtl-event-details").children;

			Array.from(dateChar).forEach((item, index) => {
				item.style.transform = "translateY(-100%)";
			});
			for(let i = 1; i < details.length; i++)  {
				let totalHeight = 20 + this.#calculateTotalHeight(details[i]);
				details[i].style.transform = "translateY(" + totalHeight + "px)";
			}
		});
	}

	#showEvent() {
		const title = this.#elements.events[this.#currentEvent].querySelector(".dwtl-event-title");
		const titleChar = title.children;
		const dateChar = this.#elements.events[this.#currentEvent].querySelector(".dwtl-event-date").children;
		const details = this.#elements.events[this.#currentEvent].querySelector(".dwtl-event-details").children;
		const _self = this;

		dwMotion({
			easing: smoothExit,
			draw(easedProgress) {
				const initialValue = 2;
				const finalValue = 1;
				const currentValue = ((finalValue - initialValue) * easedProgress) + initialValue;
				title.style.transform = "translate(-50%, -50%) scale(" + currentValue + ")";
			}
		});
		// Animate Title Chars In
		Array.from(titleChar).forEach((charItem, index) => {
			dwMotion({
				duration: 800,
				delay: index * 100,
				easing: gentleInflow,
				draw(easedProgress) {
					const initialValue = 100;
					const finalValue = 0;
					const currentValue = ((finalValue - initialValue) * easedProgress) + initialValue;
					charItem.style.transform = "translateY(" + currentValue + "%)";
				},
				callback: () => {
					// Animate Title Chars Out
					dwMotion({
						duration: 1000,
						delay: index * 100,
						easing: harmoniousEase,
						draw(easedProgress) {
							const initialValue = 0;
							const finalValue = -100;
							const currentValue = ((finalValue - initialValue) * easedProgress) + initialValue;
							charItem.style.transform = "translateY(" + currentValue + "%)";
						},
						callback: () => {
							if(index === 0) {
								// Animate Date chars
								Array.from(dateChar).forEach((item, index) => {
									dwMotion({
										duration: 600,
										delay: index * 75,
										easing: gentleInflow,
										draw(easedProgress) {
											const initialValue = 100;
											const finalValue = 0;
											const currentValue = ((finalValue - initialValue) * easedProgress) + initialValue;
											item.style.transform = "translateY(" + currentValue + "%)";
										}
									});
								});
								// Animate Details
								for(let i = 1; i < details.length; i++)  {
									const initialValue = _self.#parseTranslateY(details[i].style.transform);
                  dwMotion({
                    duration: 1000,
                    delay: 200 * i,
                    easing: gentleInflow,
                    draw(easedProgress) {
                      const finalValue = 0;
                      const currentValue = ((finalValue - initialValue) * easedProgress) + initialValue;
                      details[i].style.transform = "translateY(" + currentValue + "px)";
                    },
										callback: () => {
											if(i === details.length - 1) {
												_self.#sliding = false;
											}
										}
                  });
                }
							}
						}
					});
				}
			});
		});
	}
	
	#slideIt() {
		console.log("slide it")
		const elements = this.#elements;
		elements.timeline.style.top = -elements.timeline.offsetHeight * this.#currentEvent + "px";
		elements.timeline.style.transform = "translateY(0px)";
		elements.timeline.style.cursor = "";
		this.#setActiveClass(elements.navigations, this.#currentEvent);
		this.#setActiveClass(elements.events, this.#currentEvent);
		this.#showEvent();
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
	
	/* Utility */

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

	#parseTranslateY(transformValue) {
    const regex = /translateY\(([-+]?\d*\.?\d+)px\)/;
    const match = transformValue.match(regex);

    if (match && match[1]) {
        return parseFloat(match[1]);
    }

    return null;
	}

	#setActiveClass(elements, index) {
		elements.forEach((item) => {
			item.classList.remove("dwtl-active");
		});
		elements[index].classList.add("dwtl-active");
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