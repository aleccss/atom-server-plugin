const dom = require('./dom');

function LogView(container, maxBufferSide){
    this.container = container;
    this.items = [];
    this.maxSize = maxBufferSide;
}

LogView.prototype.init = function () {
    this.ul = dom.ul();
    this.container.appendChild(this.ul);
};

LogView.prototype.appendLog = function (logLine, messageType) {
  var item;
  if(messageType === 'info'){
      item = dom.li(logLine);
  } else {
      item = dom.li(logLine, { className : "text-error"});
  }
  if(this.items.length === this.maxSize){
    var oldItem = this.items.shift();
    if(oldItem){
      oldItem.remove();
    }
  }
  this.items.push(item);
  this.ul.appendChild(item);
};

LogView.prototype.clear = function () {
  this.ul.innerHTML = "";
};


module.exports = LogView;
