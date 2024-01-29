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
	#isSliding = false;
	
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
		this.#slideIt();
		this.#addEventlisteners();
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
		// Resolve height
		console.log(elements.events)
		elements.events.forEach((event) => {
		  console.log(event.offsetHeight)
		})
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
				const eventTitle = this.#createAndAppend("DIV", wrapper, "dwtl-event-title");
				let index = 0;
				
				for (let spanText of event.date) {
					const delay = 100 * index;
					const spanTitle = this.#createAndAppend("SPAN", eventTitle);
					const spanDate = this.#createAndAppend("SPAN", date);

					spanTitle.textContent = spanText;
     		  spanDate.textContent = spanText;

					spanTitle.style.animationDelay = delay + "ms," + (1000 + delay )+ "ms";
					spanDate.style.animationDelay = 1800 + delay + "ms";
					index++;
				}
			}
		
			if (event.heading) {
				const heading = this.#createAndAppend("DIV", eventDetails, "dwtl-event-heading");
				heading.textContent = event.heading;
			}
		
			if (event.content) {
				const content = this.#createAndAppend("DIV", eventDetails, "dwtl-event-content")
				content.innerHTML = event.content;
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
		if (this.#isSliding) { return };
		const index = this.#elements.navigations.indexOf(event.currentTarget);
		this.#currentEvent = index;
		this.#slideIt();
	}

	#scrollEvent = (event) => {
		event.preventDefault();
		if (this.#isSliding) { return };
		this.#getSlideDirection(event.deltaY > 0);
		this.#slideIt();
	}

	#handleMouseDown = (event) => {
		if (this.#isSliding) { return };
		const targetElement = event.target;
		const excludeClasses = ['dwtl-event-date', 'dwtl-event-heading', 'dwtl-event-content', 'dwtl-event-link', 'dwtl-event-image'];
		if (excludeClasses.some(className => targetElement.classList.contains(className))) {
			return false;
		}
		this.touchX = event.clientX;
		this.touchY = event.clientY;

		this.#elements.currentDetails = this.#elements.events[this.#currentEvent].querySelector(".dwtl-event-details").children;
		Array.from(this.#elements.currentDetails).forEach((item) => {
			item.style.transform = "";
			item.style.animation = "";
		});

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
			this.#slideIt();
			this.#cleanupAfterSlide();
		}
	}

	#handleMouseUp = (event) => {
		event.preventDefault();
		if (this.#isSliding) { return };
		const diffX = event.clientX - this.touchX;
		const diffY = event.clientY - this.touchY;
		const elements = this.#elements;

		this.#cleanupAfterSlide();
		
		if (Math.abs(diffY) > 150) {
			this.#getSlideDirection(diffY < 0);
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

	#slideIt() {
		const elements = this.#elements;
		const currentEvent = this.#currentEvent;

		elements.timeline.style.top = -elements.timeline.offsetHeight * currentEvent + "px";
		elements.timeline.style.transform = "translateY(0px)";
		elements.timeline.style.cursor = "";

		this.#setActiveClass(elements.navigations, currentEvent);
		this.#setActiveClass(elements.events, currentEvent);
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
			date: "1963–1966",
			heading: "First Doctor",
			content: "<p>The <strong>First Doctor<\/strong> is an incarnation of <a title=\"The Doctor (Doctor Who)\" href=\"https:\/\/en.wikipedia.org\/wiki\/The_Doctor_(Doctor_Who)\">the Doctor<\/a>, the protagonist of the <a title=\"BBC\" href=\"https:\/\/en.wikipedia.org\/wiki\/BBC\">BBC<\/a> <a title=\"Science fiction on television\" href=\"https:\/\/en.wikipedia.org\/wiki\/Science_fiction_on_television\">science fiction television<\/a> series <em><a title=\"Doctor Who\" href=\"https:\/\/en.wikipedia.org\/wiki\/Doctor_Who\">Doctor Who<\/a><\/em>. He was portrayed by actor <a title=\"William Hartnell\" href=\"https:\/\/en.wikipedia.org\/wiki\/William_Hartnell\">William Hartnell<\/a>.<\/p>",
			image: "assets/img/First_Doctor_%28Doctor_Who%29.jpg",
			link: {
				url: "https://en.wikipedia.org/wiki/First_Doctor",
				text: "Read More"
			}
		}, {
			date: "1966–1969",
			heading: "Second Doctor",
			content: "<p>The <strong>Second Doctor<\/strong> is an incarnation of <a title=\"\" href=\"https:\/\/en.wikipedia.org\/wiki\/The_Doctor_(Doctor_Who)\">the Doctor<\/a>, the protagonist of the <a title=\"BBC\" href=\"https:\/\/en.wikipedia.org\/wiki\/BBC\">BBC<\/a> <a title=\"Science fiction on television\" href=\"https:\/\/en.wikipedia.org\/wiki\/Science_fiction_on_television\">science fiction television<\/a> series <em><a title=\"Doctor Who\" href=\"https:\/\/en.wikipedia.org\/wiki\/Doctor_Who\">Doctor Who<\/a><\/em>. He was portrayed by actor <a title=\"Patrick Troughton\" href=\"https:\/\/en.wikipedia.org\/wiki\/Patrick_Troughton\">Patrick Troughton<\/a>. While the Troughton era of <em>Doctor Who<\/em> is well-remembered by fans and in that era's <em>Doctor Who<\/em> literature, it is difficult to appraise in full; of his 119 episodes, 53 <a title=\"Doctor Who missing episodes\" href=\"https:\/\/en.wikipedia.org\/wiki\/Doctor_Who_missing_episodes\">remain missing<\/a>.<\/p>",
			image: "assets/img/Second_Doctor_%28Doctor_Who%29.jpg",
			link: {
				url: "https://en.wikipedia.org/wiki/Second_Doctor",
				text: "Read More"
			}
		}, {
			date: "1970–1974",
			heading: "Third Doctor",
			content: "<p>The <strong>Third Doctor<\/strong> is an incarnation of <a title=\"\" href=\"https:\/\/en.wikipedia.org\/wiki\/The_Doctor_(Doctor_Who)\">the Doctor<\/a>, the protagonist of the <a title=\"BBC\" href=\"https:\/\/en.wikipedia.org\/wiki\/BBC\">BBC<\/a> <a title=\"Science fiction on television\" href=\"https:\/\/en.wikipedia.org\/wiki\/Science_fiction_on_television\">science fiction television<\/a> series <em><a title=\"Doctor Who\" href=\"https:\/\/en.wikipedia.org\/wiki\/Doctor_Who\">Doctor Who<\/a><\/em>. He was portrayed by actor <a title=\"Jon Pertwee\" href=\"https:\/\/en.wikipedia.org\/wiki\/Jon_Pertwee\">Jon Pertwee<\/a>. Within the series' narrative, the Doctor is a centuries-old <a title=\"Extraterrestrials in popular culture\" href=\"https:\/\/en.wikipedia.org\/wiki\/Extraterrestrials_in_popular_culture\">alien<\/a> <a title=\"Time Lord\" href=\"https:\/\/en.wikipedia.org\/wiki\/Time_Lord\">Time Lord<\/a> from the planet <a title=\"Gallifrey\" href=\"https:\/\/en.wikipedia.org\/wiki\/Gallifrey\">Gallifrey<\/a> who <a title=\"Time travel in fiction\" href=\"https:\/\/en.wikipedia.org\/wiki\/Time_travel_in_fiction\">travels in time<\/a> and space in the <a title=\"TARDIS\" href=\"https:\/\/en.wikipedia.org\/wiki\/TARDIS\">TARDIS<\/a>, frequently with <a title=\"Companion (Doctor Who)\" href=\"https:\/\/en.wikipedia.org\/wiki\/Companion_(Doctor_Who)\">companions<\/a>. At the end of life, the Doctor <a title=\"Regeneration (Doctor Who)\" href=\"https:\/\/en.wikipedia.org\/wiki\/Regeneration_(Doctor_Who)\">regenerates<\/a>. Consequently, both the physical appearance and personality of the Doctor changes.<\/p> <p>Pertwee portrays the Third Doctor as a dapper man of action in stark contrast to his wily but less action-orientated predecessors. While previous Doctors' stories had all involved time and space travel, for production reasons Pertwee's stories initially depicted the Doctor stranded on Earth in exile, where he worked as a scientific advisor to the international military group <a title=\"United Nations Intelligence Taskforce\" href=\"https:\/\/en.wikipedia.org\/wiki\/United_Nations_Intelligence_Taskforce\">UNIT<\/a>. Within the story, the Third Doctor came into existence as part of a punishment from his own race, the Time Lords, who forced him to regenerate and also disabled his TARDIS. Eventually, this restriction is lifted and the Third Doctor embarks on more traditional time travel and space exploration stories.<\/p>",
			image: "assets/img/Third_Doctor_%28Doctor_Who%29.jpg",
			link: {
				url: "https://en.wikipedia.org/wiki/Third_Doctor",
				text: "Read More"
			}
		}, {
			date: "1974–1981",
			heading: "Fourth Doctor",
			content: "<p>The <strong>Fourth Doctor<\/strong> is an incarnation of <a title=\"The Doctor (Doctor Who)\" href=\"https:\/\/en.wikipedia.org\/wiki\/The_Doctor_(Doctor_Who)\">the Doctor<\/a>, the protagonist of the <a title=\"BBC\" href=\"https:\/\/en.wikipedia.org\/wiki\/BBC\">BBC<\/a> <a title=\"\" href=\"https:\/\/en.wikipedia.org\/wiki\/Science_fiction_on_television\">science fiction television<\/a> series <em><a title=\"Doctor Who\" href=\"https:\/\/en.wikipedia.org\/wiki\/Doctor_Who\">Doctor Who<\/a><\/em>. He is portrayed by <a title=\"Tom Baker\" href=\"https:\/\/en.wikipedia.org\/wiki\/Tom_Baker\">Tom Baker<\/a>.<\/p> <p>Within the series' narrative, the Doctor is a centuries-old <a title=\"Extraterrestrials in fiction\" href=\"https:\/\/en.wikipedia.org\/wiki\/Extraterrestrials_in_fiction\">alien<\/a> <a title=\"Time Lord\" href=\"https:\/\/en.wikipedia.org\/wiki\/Time_Lord\">Time Lord<\/a> from the planet <a title=\"Gallifrey\" href=\"https:\/\/en.wikipedia.org\/wiki\/Gallifrey\">Gallifrey<\/a> who <a title=\"Time travel in fiction\" href=\"https:\/\/en.wikipedia.org\/wiki\/Time_travel_in_fiction\">travels in time<\/a> and space in the <a title=\"TARDIS\" href=\"https:\/\/en.wikipedia.org\/wiki\/TARDIS\">TARDIS<\/a>, frequently with <a title=\"Companion (Doctor Who)\" href=\"https:\/\/en.wikipedia.org\/wiki\/Companion_(Doctor_Who)\">companions<\/a>. At the end of life, the Doctor <a title=\"Regeneration (Doctor Who)\" href=\"https:\/\/en.wikipedia.org\/wiki\/Regeneration_(Doctor_Who)\">regenerates<\/a>; as a result, the physical appearance and personality of the Doctor changes.<\/p> <p>Baker portrays the Fourth Doctor as a whimsical and sometimes brooding individual whose enormous personal warmth is at times tempered by his capacity for righteous anger. His initial companions were intrepid journalist <a title=\"Sarah Jane Smith\" href=\"https:\/\/en.wikipedia.org\/wiki\/Sarah_Jane_Smith\">Sarah Jane Smith<\/a> (<a title=\"Elisabeth Sladen\" href=\"https:\/\/en.wikipedia.org\/wiki\/Elisabeth_Sladen\">Elisabeth Sladen<\/a>), who had travelled alongside his previous incarnation, and <a title=\"Lieutenant (navy)\" href=\"https:\/\/en.wikipedia.org\/wiki\/Lieutenant_(navy)\">Surgeon-Lieutenant<\/a> <a title=\"Harry Sullivan (Doctor Who)\" href=\"https:\/\/en.wikipedia.org\/wiki\/Harry_Sullivan_(Doctor_Who)\">Harry Sullivan<\/a> (<a title=\"Ian Marter\" href=\"https:\/\/en.wikipedia.org\/wiki\/Ian_Marter\">Ian Marter<\/a>) of <a title=\"UNIT\" href=\"https:\/\/en.wikipedia.org\/wiki\/UNIT\">UNIT<\/a>. His later companions were savage warrior <a title=\"Leela (Doctor Who)\" href=\"https:\/\/en.wikipedia.org\/wiki\/Leela_(Doctor_Who)\">Leela<\/a> (<a title=\"Louise Jameson\" href=\"https:\/\/en.wikipedia.org\/wiki\/Louise_Jameson\">Louise Jameson<\/a>), robotic dog <a title=\"K9 (Doctor Who)\" href=\"https:\/\/en.wikipedia.org\/wiki\/K9_(Doctor_Who)\">K9<\/a> (<a title=\"John Leeson\" href=\"https:\/\/en.wikipedia.org\/wiki\/John_Leeson\">John Leeson<\/a> and <a title=\"David Brierly\" href=\"https:\/\/en.wikipedia.org\/wiki\/David_Brierly\">David Brierly<\/a>), Time Lady <a title=\"Romana (Doctor Who)\" href=\"https:\/\/en.wikipedia.org\/wiki\/Romana_(Doctor_Who)\">Romana<\/a> (<a title=\"Mary Tamm\" href=\"https:\/\/en.wikipedia.org\/wiki\/Mary_Tamm\">Mary Tamm<\/a> and <a title=\"Lalla Ward\" href=\"https:\/\/en.wikipedia.org\/wiki\/Lalla_Ward\">Lalla Ward<\/a>), teen genius <a title=\"Adric\" href=\"https:\/\/en.wikipedia.org\/wiki\/Adric\">Adric<\/a> (<a title=\"Matthew Waterhouse\" href=\"https:\/\/en.wikipedia.org\/wiki\/Matthew_Waterhouse\">Matthew Waterhouse<\/a>), alien teenage aristocrat <a title=\"Nyssa (Doctor Who)\" href=\"https:\/\/en.wikipedia.org\/wiki\/Nyssa_(Doctor_Who)\">Nyssa<\/a> (<a title=\"Sarah Sutton\" href=\"https:\/\/en.wikipedia.org\/wiki\/Sarah_Sutton\">Sarah Sutton<\/a>), and Australian flight attendant <a title=\"Tegan Jovanka\" href=\"https:\/\/en.wikipedia.org\/wiki\/Tegan_Jovanka\">Tegan Jovanka<\/a> (<a title=\"Janet Fielding\" href=\"https:\/\/en.wikipedia.org\/wiki\/Janet_Fielding\">Janet Fielding<\/a>).<\/p>",
			image: "assets/img/Fourth_Doctor_%28Doctor_Who%29.jpg",
			link: {
				url: "https://en.wikipedia.org/wiki/Fourth_Doctor",
				text: "Read More"
			}
		}, {
			date: "1982–1984",
			heading: "Fifth Doctor",
			content: "<p>The <strong>Fifth Doctor<\/strong> is an incarnation of <a title=\"The Doctor (Doctor Who)\" href=\"https:\/\/en.wikipedia.org\/wiki\/The_Doctor_(Doctor_Who)\">the Doctor<\/a>, the protagonist of the <a title=\"BBC\" href=\"https:\/\/en.wikipedia.org\/wiki\/BBC\">BBC<\/a> <a title=\"Science fiction on television\" href=\"https:\/\/en.wikipedia.org\/wiki\/Science_fiction_on_television\">science fiction television<\/a> series <em><a title=\"Doctor Who\" href=\"https:\/\/en.wikipedia.org\/wiki\/Doctor_Who\">Doctor Who<\/a><\/em>. He is portrayed by <a title=\"Peter Davison\" href=\"https:\/\/en.wikipedia.org\/wiki\/Peter_Davison\">Peter Davison<\/a>.<\/p> <p>Within the series' narrative, the Doctor is a centuries-old <a title=\"Extraterrestrials in fiction\" href=\"https:\/\/en.wikipedia.org\/wiki\/Extraterrestrials_in_fiction\">alien<\/a> <a title=\"Time Lord\" href=\"https:\/\/en.wikipedia.org\/wiki\/Time_Lord\">Time Lord<\/a> from the planet <a title=\"Gallifrey\" href=\"https:\/\/en.wikipedia.org\/wiki\/Gallifrey\">Gallifrey<\/a> who <a title=\"Time travel in fiction\" href=\"https:\/\/en.wikipedia.org\/wiki\/Time_travel_in_fiction\">travels in time<\/a> and space in the <a title=\"TARDIS\" href=\"https:\/\/en.wikipedia.org\/wiki\/TARDIS\">TARDIS<\/a>, frequently with <a title=\"Companion (Doctor Who)\" href=\"https:\/\/en.wikipedia.org\/wiki\/Companion_(Doctor_Who)\">companions<\/a>. At the end of life, the Doctor <a title=\"\" href=\"https:\/\/en.wikipedia.org\/wiki\/Regeneration_(Doctor_Who)\">regenerates<\/a>; as a result, the physical appearance and personality of the Doctor changes.<\/p> <p>Davison portrays the Fifth Doctor as having a vulnerable side and a tendency towards indecisiveness, dressed as a boyish <a title=\"Edwardian era\" href=\"https:\/\/en.wikipedia.org\/wiki\/Edwardian_era\">Edwardian<\/a> cricketer. He travelled with a host of companions, including boy genius <a title=\"Adric\" href=\"https:\/\/en.wikipedia.org\/wiki\/Adric\">Adric<\/a> (<a title=\"Matthew Waterhouse\" href=\"https:\/\/en.wikipedia.org\/wiki\/Matthew_Waterhouse\">Matthew Waterhouse<\/a>), alien aristocrat <a title=\"Nyssa (Doctor Who)\" href=\"https:\/\/en.wikipedia.org\/wiki\/Nyssa_(Doctor_Who)\">Nyssa<\/a> (<a title=\"Sarah Sutton\" href=\"https:\/\/en.wikipedia.org\/wiki\/Sarah_Sutton\">Sarah Sutton<\/a>) and Australian flight attendant <a title=\"Tegan Jovanka\" href=\"https:\/\/en.wikipedia.org\/wiki\/Tegan_Jovanka\">Tegan Jovanka<\/a> (<a title=\"Janet Fielding\" href=\"https:\/\/en.wikipedia.org\/wiki\/Janet_Fielding\">Janet Fielding<\/a>), whom he had travelled alongside in his previous incarnation. He also shared later adventures alongside devious schoolboy <a title=\"Vislor Turlough\" href=\"https:\/\/en.wikipedia.org\/wiki\/Vislor_Turlough\">Vislor Turlough<\/a> (<a title=\"Mark Strickson\" href=\"https:\/\/en.wikipedia.org\/wiki\/Mark_Strickson\">Mark Strickson<\/a>) and American college student <a title=\"Peri Brown\" href=\"https:\/\/en.wikipedia.org\/wiki\/Peri_Brown\">Peri Brown<\/a> (<a title=\"Nicola Bryant\" href=\"https:\/\/en.wikipedia.org\/wiki\/Nicola_Bryant\">Nicola Bryant<\/a>)<\/p>",
			image: "assets/img/Fifth_Doctor_%28Doctor_Who%29.jpg",
			link: {
				url: "https://en.wikipedia.org/wiki/Fifth_Doctor",
				text: "Read More"
			}
		}, {
			date: "1984–1986",
			heading: "Sixth Doctor",
			content: "<p>The <strong>Sixth Doctor<\/strong> is an incarnation of <a title=\"The Doctor (Doctor Who)\" href=\"https:\/\/en.wikipedia.org\/wiki\/The_Doctor_(Doctor_Who)\">the Doctor<\/a>, the protagonist of the <a title=\"BBC\" href=\"https:\/\/en.wikipedia.org\/wiki\/BBC\">BBC<\/a> <a title=\"Science fiction on television\" href=\"https:\/\/en.wikipedia.org\/wiki\/Science_fiction_on_television\">science fiction television<\/a> series <em><a title=\"Doctor Who\" href=\"https:\/\/en.wikipedia.org\/wiki\/Doctor_Who\">Doctor Who<\/a><\/em>. He is portrayed by <a title=\"Colin Baker\" href=\"https:\/\/en.wikipedia.org\/wiki\/Colin_Baker\">Colin Baker<\/a>. Although his televisual time on the series was comparatively brief and turbulent, Baker has continued as the Sixth Doctor in <a title=\"Big Finish Productions\" href=\"https:\/\/en.wikipedia.org\/wiki\/Big_Finish_Productions\">Big Finish<\/a>'s range of original <em>Doctor Who<\/em> audio adventures. Within the series' narrative, the Doctor is a centuries-old <a title=\"Extraterrestrials in popular culture\" href=\"https:\/\/en.wikipedia.org\/wiki\/Extraterrestrials_in_popular_culture\">alien<\/a> <a title=\"Time Lord\" href=\"https:\/\/en.wikipedia.org\/wiki\/Time_Lord\">Time Lord<\/a> from the planet <a title=\"Gallifrey\" href=\"https:\/\/en.wikipedia.org\/wiki\/Gallifrey\">Gallifrey<\/a> who <a title=\"Time travel in fiction\" href=\"https:\/\/en.wikipedia.org\/wiki\/Time_travel_in_fiction\">travels in time<\/a> and space in the <a title=\"TARDIS\" href=\"https:\/\/en.wikipedia.org\/wiki\/TARDIS\">TARDIS<\/a>, frequently with <a title=\"Companion (Doctor Who)\" href=\"https:\/\/en.wikipedia.org\/wiki\/Companion_(Doctor_Who)\">companions<\/a>. At the end of life, the Doctor <a title=\"Regeneration (Doctor Who)\" href=\"https:\/\/en.wikipedia.org\/wiki\/Regeneration_(Doctor_Who)\">regenerates<\/a>; as a result, the physical appearance and personality of the Doctor changes. Baker portrays the sixth such incarnation: an arrogant and flamboyant character in brightly coloured, mismatched clothes whose brash and often patronising personality set him apart from all his previous incarnations.<\/p>",
			image: "assets/img/Sixth_Doctor_%28Doctor_Who%29.jpg",
			link: {
				url: "https://en.wikipedia.org/wiki/Sixth_Doctor",
				text: "Read More"
			}
		}, {
			date: "1987–1989",
			heading: "Seventh Doctor",
			content: "<p>The <strong>Seventh Doctor<\/strong> is an incarnation of <a title=\"The Doctor (Doctor Who)\" href=\"https:\/\/en.wikipedia.org\/wiki\/The_Doctor_(Doctor_Who)\">the Doctor<\/a>, the <a title=\"Protagonist\" href=\"https:\/\/en.wikipedia.org\/wiki\/Protagonist\">protagonist<\/a> of the <a title=\"BBC\" href=\"https:\/\/en.wikipedia.org\/wiki\/BBC\">BBC<\/a> <a title=\"Science fiction on television\" href=\"https:\/\/en.wikipedia.org\/wiki\/Science_fiction_on_television\">science fiction television<\/a> series <em><a title=\"Doctor Who\" href=\"https:\/\/en.wikipedia.org\/wiki\/Doctor_Who\">Doctor Who<\/a><\/em>, and the final incarnation of the original Doctor Who series. He is portrayed by Scottish actor <a title=\"Sylvester McCoy\" href=\"https:\/\/en.wikipedia.org\/wiki\/Sylvester_McCoy\">Sylvester McCoy<\/a>.<\/p> <p>Within the series' narrative, the Doctor is a centuries-old <a title=\"Extraterrestrials in popular culture\" href=\"https:\/\/en.wikipedia.org\/wiki\/Extraterrestrials_in_popular_culture\">alien<\/a> <a title=\"Time Lord\" href=\"https:\/\/en.wikipedia.org\/wiki\/Time_Lord\">Time Lord<\/a> from the planet <a title=\"Gallifrey\" href=\"https:\/\/en.wikipedia.org\/wiki\/Gallifrey\">Gallifrey<\/a> who <a title=\"Time travel in fiction\" href=\"https:\/\/en.wikipedia.org\/wiki\/Time_travel_in_fiction\">travels in time<\/a> and space in the <a title=\"TARDIS\" href=\"https:\/\/en.wikipedia.org\/wiki\/TARDIS\">TARDIS<\/a>, frequently with <a title=\"Companion (Doctor Who)\" href=\"https:\/\/en.wikipedia.org\/wiki\/Companion_(Doctor_Who)\">companions<\/a>. At the end of life, the Doctor <a title=\"Regeneration (Doctor Who)\" href=\"https:\/\/en.wikipedia.org\/wiki\/Regeneration_(Doctor_Who)\">regenerates<\/a>; as a result, the physical appearance and personality of the Doctor changes.<\/p> <p>McCoy portrays the Seventh Doctor as a whimsical, thoughtful character who quickly becomes more layered, secretive, and <a title=\"Psychological manipulation\" href=\"https:\/\/en.wikipedia.org\/wiki\/Psychological_manipulation\">manipulative<\/a>. His first companion was <a title=\"Melanie Bush\" href=\"https:\/\/en.wikipedia.org\/wiki\/Melanie_Bush\">Melanie Bush<\/a> (<a title=\"Bonnie Langford\" href=\"https:\/\/en.wikipedia.org\/wiki\/Bonnie_Langford\">Bonnie Langford<\/a>), a computer programmer who travelled with his <a title=\"Sixth Doctor\" href=\"https:\/\/en.wikipedia.org\/wiki\/Sixth_Doctor\">previous incarnation<\/a>, and who is soon succeeded by troubled teenager and explosives expert <a title=\"Ace (Doctor Who)\" href=\"https:\/\/en.wikipedia.org\/wiki\/Ace_(Doctor_Who)\">Ace<\/a> (<a title=\"Sophie Aldred\" href=\"https:\/\/en.wikipedia.org\/wiki\/Sophie_Aldred\">Sophie Aldred<\/a>), who becomes his <a title=\"Prot&eacute;g&eacute;e\" href=\"https:\/\/en.wikipedia.org\/wiki\/Prot%C3%A9g%C3%A9e\">prot&eacute;g&eacute;e<\/a>.<\/p>",
			image: "assets/img/Seventh_Doctor_%28Doctor_Who%29.jpg",
			link: {
				url: "https://en.wikipedia.org/wiki/Seventh_Doctor",
				text: "Read More"
			}
		}, {
			date: "1996",
			heading: "Eighth Doctor",
			content: "<p>The <strong>Eighth Doctor<\/strong> is an incarnation of <a title=\"The Doctor (Doctor Who)\" href=\"https:\/\/en.wikipedia.org\/wiki\/The_Doctor_(Doctor_Who)\">the Doctor<\/a>, the protagonist of the <a title=\"BBC\" href=\"https:\/\/en.wikipedia.org\/wiki\/BBC\">BBC<\/a> <a title=\"Science fiction on television\" href=\"https:\/\/en.wikipedia.org\/wiki\/Science_fiction_on_television\">science fiction television<\/a> series <em><a title=\"Doctor Who\" href=\"https:\/\/en.wikipedia.org\/wiki\/Doctor_Who\">Doctor Who<\/a><\/em>. He is portrayed by <a title=\"Paul McGann\" href=\"https:\/\/en.wikipedia.org\/wiki\/Paul_McGann\">Paul McGann<\/a>.<\/p> <p>The character was introduced in the 1996 TV film <em><a title=\"Doctor Who (film)\" href=\"https:\/\/en.wikipedia.org\/wiki\/Doctor_Who_(film)\">Doctor Who<\/a><\/em>, a <a title=\"Television pilot\" href=\"https:\/\/en.wikipedia.org\/wiki\/Television_pilot#Backdoor_pilot\">back-door pilot<\/a> produced in an unsuccessful attempt to relaunch the series following its 1989 cancellation. While the Eighth Doctor initially had only one on-screen appearance, his adventures were portrayed extensively in subsequent <a title=\"Doctor Who spin-offs\" href=\"https:\/\/en.wikipedia.org\/wiki\/Doctor_Who_spin-offs\">spin-off media<\/a>, including more than 70 audio dramas starring McGann. In 2013, the actor reprised the role in the mini-episode \"<a title=\"The Night of the Doctor\" href=\"https:\/\/en.wikipedia.org\/wiki\/The_Night_of_the_Doctor\">The Night of the Doctor<\/a>\", which depicts the Eighth Doctor's final adventure and his regeneration into the <a title=\"War Doctor\" href=\"https:\/\/en.wikipedia.org\/wiki\/War_Doctor\">War Doctor<\/a> (played by <a title=\"John Hurt\" href=\"https:\/\/en.wikipedia.org\/wiki\/John_Hurt\">John Hurt<\/a>). In 2022, he appeared alongside other past incarnations in \"<a title=\"The Power of the Doctor\" href=\"https:\/\/en.wikipedia.org\/wiki\/The_Power_of_the_Doctor\">The Power of the Doctor<\/a>\", the final adventure of the <a title=\"Thirteenth Doctor\" href=\"https:\/\/en.wikipedia.org\/wiki\/Thirteenth_Doctor\">Thirteenth Doctor<\/a> (<a title=\"Jodie Whittaker\" href=\"https:\/\/en.wikipedia.org\/wiki\/Jodie_Whittaker\">Jodie Whittaker<\/a>), marking the Eighth Doctor's first-ever appearance in a regular episode of <em>Doctor Who<\/em> 26 years after McGann first played the role.<\/p>",
			image: "assets/img/Eighth_Doctor_%28Doctor_Who%29_%28cropped%29.jpg",
			link: {
				url: "https://en.wikipedia.org/wiki/Eighth_Doctor",
				text: "Read More"
			}
		}, {
			date: "2005",
			heading: "Ninth Doctor",
			content: "<p>The <strong>Ninth Doctor<\/strong> is an incarnation of <a title=\"The Doctor (Doctor Who)\" href=\"https:\/\/en.wikipedia.org\/wiki\/The_Doctor_(Doctor_Who)\">the Doctor<\/a>, the protagonist of the <a title=\"BBC\" href=\"https:\/\/en.wikipedia.org\/wiki\/BBC\">BBC<\/a> <a title=\"Science fiction on television\" href=\"https:\/\/en.wikipedia.org\/wiki\/Science_fiction_on_television\">science fiction television<\/a> programme <em><a title=\"Doctor Who\" href=\"https:\/\/en.wikipedia.org\/wiki\/Doctor_Who\">Doctor Who<\/a><\/em>. He is portrayed by <a title=\"Christopher Eccleston\" href=\"https:\/\/en.wikipedia.org\/wiki\/Christopher_Eccleston\">Christopher Eccleston<\/a> during the <a title=\"Doctor Who (series 1)\" href=\"https:\/\/en.wikipedia.org\/wiki\/Doctor_Who_(series_1)\">first series<\/a> of the show's revival in 2005. Within the series' narrative, the Doctor is a centuries-old <a title=\"Extraterrestrials in popular culture\" href=\"https:\/\/en.wikipedia.org\/wiki\/Extraterrestrials_in_popular_culture\">alien<\/a> <a title=\"Time Lord\" href=\"https:\/\/en.wikipedia.org\/wiki\/Time_Lord\">Time Lord<\/a> from the planet <a title=\"Gallifrey\" href=\"https:\/\/en.wikipedia.org\/wiki\/Gallifrey\">Gallifrey<\/a> who <a title=\"Time travel in fiction\" href=\"https:\/\/en.wikipedia.org\/wiki\/Time_travel_in_fiction\">travels in time<\/a> and space in the <a title=\"TARDIS\" href=\"https:\/\/en.wikipedia.org\/wiki\/TARDIS\">TARDIS<\/a>, frequently with <a title=\"Companion (Doctor Who)\" href=\"https:\/\/en.wikipedia.org\/wiki\/Companion_(Doctor_Who)\">companions<\/a>. At the end of life, the Doctor <a title=\"Regeneration (Doctor Who)\" href=\"https:\/\/en.wikipedia.org\/wiki\/Regeneration_(Doctor_Who)\">regenerates<\/a>; as a result, the physical appearance and personality of the Doctor changes. Eccleston's Doctor was a war-torn loner who disguises his trauma brought on by the Time War using a sense of humour and determination to protect the innocent. The production team's approach to the character and Eccleston's portrayal were highlighted as being intentionally different from his predecessors, with Eccleston portraying the character as being less eccentric.<\/p> <p>To fit in with a 21st-century audience, the Doctor was given a primary companion, <a title=\"Rose Tyler\" href=\"https:\/\/en.wikipedia.org\/wiki\/Rose_Tyler\">Rose Tyler<\/a> (<a title=\"Billie Piper\" href=\"https:\/\/en.wikipedia.org\/wiki\/Billie_Piper\">Billie Piper<\/a>), who was designed to be just as independent and courageous as the Doctor. He also briefly travels with <a title=\"Adam Mitchell (Doctor Who)\" href=\"https:\/\/en.wikipedia.org\/wiki\/Adam_Mitchell_(Doctor_Who)\">Adam Mitchell<\/a> (<a title=\"Bruno Langley\" href=\"https:\/\/en.wikipedia.org\/wiki\/Bruno_Langley\">Bruno Langley<\/a>), a self-serving boy genius who acts as a foil to the companions but ultimately proves unworthy, and <a title=\"Jack Harkness\" href=\"https:\/\/en.wikipedia.org\/wiki\/Jack_Harkness\">Captain Jack Harkness<\/a> (<a title=\"John Barrowman\" href=\"https:\/\/en.wikipedia.org\/wiki\/John_Barrowman\">John Barrowman<\/a>), a reformed con man from the 51st century. The Doctor, Rose and Jack form a close team but are separated in the series finale in which each character has to make difficult choices and face sacrifice.<\/p>",
			image: "assets/img/Ninth_Doctor_%28Doctor_Who%29.jpg",
			link: {
				url: "https://en.wikipedia.org/wiki/Ninth_Doctor",
				text: "Read More"
			}
		}, {
			date: "2005–2010",
			heading: "Tenth Doctor",
			content: "<p>The <strong>Tenth Doctor<\/strong> is an incarnation of <a title=\"The Doctor (Doctor Who)\" href=\"https:\/\/en.wikipedia.org\/wiki\/The_Doctor_(Doctor_Who)\">the Doctor<\/a>, the main protagonist of the <a title=\"BBC\" href=\"https:\/\/en.wikipedia.org\/wiki\/BBC\">BBC<\/a> <a title=\"Science fiction on television\" href=\"https:\/\/en.wikipedia.org\/wiki\/Science_fiction_on_television\">science fiction television<\/a> franchise <em><a title=\"Doctor Who\" href=\"https:\/\/en.wikipedia.org\/wiki\/Doctor_Who\">Doctor Who<\/a><\/em>. He is played by <a title=\"David Tennant\" href=\"https:\/\/en.wikipedia.org\/wiki\/David_Tennant\">David Tennant<\/a> in three series as well as nine specials. As with previous incarnations of the Doctor, the character has also appeared in other <a title=\"Doctor Who spin-offs\" href=\"https:\/\/en.wikipedia.org\/wiki\/Doctor_Who_spin-offs\"><em>Doctor Who<\/em> spin-offs<\/a>. Tennant's time as the Tenth Doctor is highly regarded among <a title=\"Doctor Who fandom\" href=\"https:\/\/en.wikipedia.org\/wiki\/Doctor_Who_fandom\">fans of the show<\/a> and is generally regarded as one of the most iconic incarnations of the character, often ranked alongside <a title=\"Tom Baker\" href=\"https:\/\/en.wikipedia.org\/wiki\/Tom_Baker\">Tom Baker's<\/a> <a title=\"Fourth Doctor\" href=\"https:\/\/en.wikipedia.org\/wiki\/Fourth_Doctor\">Fourth Doctor<\/a>.<\/p>",
			image: "assets/img/Tenth_Doctor_%28Doctor_Who%29.jpg",
			link: {
				url: "https://en.wikipedia.org/wiki/Tenth_Doctor",
				text: "Read More"
			}
		}, {
			date: "2010–2013",
			heading: "Eleventh Doctor",
			content: "<p>The <strong>Eleventh Doctor<\/strong> is an incarnation of <a title=\"The Doctor (Doctor Who)\" href=\"https:\/\/en.wikipedia.org\/wiki\/The_Doctor_(Doctor_Who)\">the Doctor<\/a>, the protagonist of the <a title=\"BBC\" href=\"https:\/\/en.wikipedia.org\/wiki\/BBC\">BBC<\/a> <a title=\"Science fiction on television\" href=\"https:\/\/en.wikipedia.org\/wiki\/Science_fiction_on_television\">science fiction television<\/a> programme <em><a title=\"Doctor Who\" href=\"https:\/\/en.wikipedia.org\/wiki\/Doctor_Who\">Doctor Who<\/a><\/em>. He is played by <a title=\"Matt Smith\" href=\"https:\/\/en.wikipedia.org\/wiki\/Matt_Smith\">Matt Smith<\/a> in three series as well as five specials. As with previous incarnations of the Doctor, the character has also appeared in other <a title=\"Doctor Who spin-offs\" href=\"https:\/\/en.wikipedia.org\/wiki\/Doctor_Who_spin-offs\"><em>Doctor Who<\/em> spin-offs<\/a>. Smith's portrayal of the Eleventh Doctor has been critically acclaimed.<\/p>",
			image: "assets/img/Eleventh_Doctor_%28Doctor_Who%29.jpg",
			link: {
				url: "https://en.wikipedia.org/wiki/Eleventh_Doctor",
				text: "Read More"
			}
		}, {
			date: "2014–2017",
			heading: "Twelfth Doctor",
			content: "<p>The <strong>Twelfth Doctor<\/strong> is an incarnation of <a title=\"The Doctor (Doctor Who)\" href=\"https:\/\/en.wikipedia.org\/wiki\/The_Doctor_(Doctor_Who)\">the Doctor<\/a>, the protagonist of the <a title=\"BBC\" href=\"https:\/\/en.wikipedia.org\/wiki\/BBC\">BBC<\/a> <a title=\"Science fiction on television\" href=\"https:\/\/en.wikipedia.org\/wiki\/Science_fiction_on_television\">science fiction television<\/a> programme <em><a title=\"Doctor Who\" href=\"https:\/\/en.wikipedia.org\/wiki\/Doctor_Who\">Doctor Who<\/a><\/em>. He is portrayed by Scottish actor <a title=\"Peter Capaldi\" href=\"https:\/\/en.wikipedia.org\/wiki\/Peter_Capaldi\">Peter Capaldi<\/a> in three series as well as four specials. As with previous incarnations of the Doctor, the character has also appeared in other <a title=\"Doctor Who spin-offs\" href=\"https:\/\/en.wikipedia.org\/wiki\/Doctor_Who_spin-offs\"><em>Doctor Who<\/em> spin-offs<\/a>. Capaldi's portrayal of the Twelfth Doctor has been met with critical acclaim.<\/p>",
			image: "assets/img/Twelfth_Doctor_%28Doctor_Who%29.jpg",
			link: {
				url: "https://en.wikipedia.org/wiki/Twelfth_Doctor",
				text: "Read More"
			}
		}, {
			date: "2018–2022",
			heading: "Thirteenth Doctor",
			content: "<p>The <strong>Thirteenth Doctor<\/strong> is an incarnation of <a title=\"The Doctor (Doctor Who)\" href=\"https:\/\/en.wikipedia.org\/wiki\/The_Doctor_(Doctor_Who)\">the Doctor<\/a>, the fictional protagonist of the <a title=\"BBC\" href=\"https:\/\/en.wikipedia.org\/wiki\/BBC\">BBC<\/a> <a title=\"Science fiction on television\" href=\"https:\/\/en.wikipedia.org\/wiki\/Science_fiction_on_television\">science fiction television<\/a> programme, <em><a title=\"Doctor Who\" href=\"https:\/\/en.wikipedia.org\/wiki\/Doctor_Who\">Doctor Who<\/a><\/em>. She is portrayed by English actress <a title=\"Jodie Whittaker\" href=\"https:\/\/en.wikipedia.org\/wiki\/Jodie_Whittaker\">Jodie Whittaker<\/a>, the first woman to portray the character, starring in three series as well as five specials. Whittaker's portrayal of the Thirteenth Doctor has been met with praise, though her tenure as the Doctor was considered divisive, particularly regarding changes to the series established lore.<\/p>",
			image: "assets/img/Thirteenth_Doctor_%28Doctor_Who%29.jpg",
			link: {
				url: "https://en.wikipedia.org/wiki/Thirteenth_Doctor",
				text: "Read More"
			}
		}]
});