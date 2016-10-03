const CompositeDisposable = require("atom").CompositeDisposable;
var Runtime = require("./server/runtime");

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
    elm.innerText = text || "";

    (children || []).forEach(elm.appendChild, elm);
    return elm;
  }
};

var button = element("button", "btn inline-block-tight");
var div = element("div", "");
var atomPanel = element("atom-panel", "panel-bottom log-display");
var ul = element("ul", "list");
var li = element("li", "");

module.exports = {
  activate : function() {

    var startServer = button("Start Server", { className : "icon icon-playback-play" });
    var stopServer = button("Stop Server", { className : "icon icon-primitive-square" });
    //var toggleWatcher = button("Toggle Watcher");
    var clear = button("", { className : "icon icon-flame", title : "clear"});

    var buttonContainer = div(null, {}, [ startServer, stopServer, clear]);

    var panel = atomPanel();
    var list = ul();
    panel.appendChild(list);

    var element = div(null, {}, [buttonContainer, panel]);

    element.scrollTop = element.scrollHeight;

    var r = new Runtime(function(logLine, messageType){
      if(messageType === 'info'){
          var item = li(logLine);
      } else {
          var item = li(logLine, { className : "text-error"});
      }
      list.appendChild(item);
    });

    startServer.addEventListener("click", () => r.serverStart() );
    stopServer.addEventListener("click", () => r.serverStop() );
    clear.addEventListener("click", () => {
      var ulList = document.getElementsByClassName("list")[0];
      while (ulList.firstChild) {
        ulList.removeChild(ulList.firstChild);
      }
    });

    //start Watcher
    r.startWatcher();

    this.subscriptions = new CompositeDisposable();
    this.modal = atom.workspace.addBottomPanel({
      item : element,
      visible: false
    });

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'tomcat-plugin:toggle': ()=> this.modal.isVisible() ? this.modal.hide() : this.modal.show()
      //'tomcat-plugin:startStopWatcher': ()=> r.startStopWatcher()
    }));
  },
  deactivate : function(){
    this.subscriptions.dispose();
  }
};
