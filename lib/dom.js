
function element(el, classes){
  return function(text, options, children){
    options = options || {};
    var elm = document.createElement(el);

    for(var key in options){
      if(options.hasOwnProperty(key)){
        elm[key] = options[key];
      }
    }

    elm.className = classes + " " + (options.className || "");
    elm.innerHTML = text || "";

    (children || []).forEach(elm.appendChild, elm);
    return elm;
  }
};

module.exports.button = element("button", "");
module.exports.checkBox = element("input", "");
module.exports.label = element("label", "");
module.exports.div = element("div", "");
module.exports.atomPanel = element("atom-panel", "panel-bottom log-display");
module.exports.ul = element("ul", "list");
module.exports.li = element("li", "");
