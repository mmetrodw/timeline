const defaultMotionInit = {
  target: null,
  duration: 1000,
  delay: 0,
  easing: "linear",
  properties: null,
  callback: null
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

function dwMotion(params) {
  let options = dwtlReplaceObjectProps(defaultMotionInit, params);
  let animation = [];

  // Prepare Animation
  for (const [key, value] of Object.entries(options.properties)) {
    let array = [];
    const el = options.target;
    if(key !== "transform") {
      array['target'] = el;
      array['property'] = key;
      array['startValue'] = [];
      array['startValue']['original'] = Array.isArray(value) ? value[0] : getCSSValue(el, key);
      array['startValue']['value'] = parseFloat(array['startValue']['original']);
      array['startValue']['unit'] = getUnit(array['startValue']['original']);
      array['endValue'] = [];
      array['endValue']['original'] = Array.isArray(value) ? value[1] : value;
      array['endValue']['value'] = Array.isArray(value) ? parseFloat(value[1]) : parseFloat(value);
      array['endValue']['unit'] = getUnit(array['endValue']['original']);
      array['duration'] = options.duration;
      array['delay'] = options.delay;
      array['easing'] = options.easing;
      array['callback'] = options.callback ? options.callback : null;
      animation.push(array);
    }
  }

  animation.forEach(item => {
    animateProperty(item.target, item.property, item.duration, item.easing, item.delay, item.startValue.value, item.endValue.value, item.endValue.unit, item.callback)
  });

  function animateProperty(target, property, duration, easing, delay, startValue, endValue, unit, callback) {
    let start = performance.now();
    let time = performance.now();
    function animate(time) {
      let timeFraction = (time - start) / duration;
      if (timeFraction > 1) timeFraction = 1;
  
       let progress = timeFraction;
       target.style[property] = ((endValue - startValue ) * progress) + startValue + unit;
  
       if (timeFraction < 1) {
         requestAnimationFrame(animate);
       } else {
        if (callback) {
          callback();
        }
      }
    }
    animate(time);
  }
}

dwMotion({
  target: document.querySelector("#anm"),
  duration: 1000,
  delay: 0,
  easing: "linear",
  properties: {
    left: "500px",
    width: ["100px", "350px"],
    transform: {
      scale: [2, 1],
      translateX: ["-50%", "-50%"],
      translateY: ["-50%", "-50%"]
    }
  },
  callback: () => {
    console.log("callback");
  }
});
