

module.exports = {
  config : {
      logBufferSize: {
          type: 'number',
          default: 100,
          description: "Defines maximum number of log lines."
      },
      projectPath: {
        type: "string",
        default: "C:\\Users\\C5244164\\workspace\\Company\\WebContent",
        description: "Path to your project location."
      },
      serverProjectPath: {
        type: "string",
        default: "C:\\tomcat\\apache-tomcat-7.0.70\\webapps\\Company",
        description: "Path to the server location where your project is stored."
      },
      serverPath: {
        type: "string",
        default: "C:\\tomcat\\apache-tomcat-7.0.70\\bin\\catalina.bat",
        description: "Path to the server starting file."
      },
      serverStartCommand: {
        type: "string",
        default: "run",
        description: "Command which will be executed on the server start/stop file."
      },
      serverStopCommand: {
        type: "string",
        default: "stop",
        description: "Command which will be executed on the server start/stop file."
      },
      toggleWatcher: {
          type: 'boolean',
          default: true,
          description: "Default value for File Watcher"
      },
      mavenPath: {
        type: "string",
        default: "C:\\sap\\apache-maven-3.3.9\\bin",
        description: "Path to maven."
      },
  },
  activate : function() {
    setTimeout(_ => this.startPlugin());
  },

  startPlugin : function(){
    const CompositeDisposable = require("atom").CompositeDisposable;
    const Runtime = require("./server/runtime");
    const dom = require("./dom");
    const LogView = require("./LogView");

    function updateStartStopServerButton(serverStopped){
      if(serverStopped){
        startStopServer.innerHTML = "Start Server";
        startStopServer.className = "btn inline-block-tight icon icon-playback-play";
      } else {
        startStopServer.innerHTML = "Stop Server";
        startStopServer.className = "btn inline-block-tight icon icon-primitive-square";
      }
    };

    var logBufferSize = atom.config.get("atom-server-plugin.logBufferSize");
    var startStopServer = dom.button("Start Server", { className : "btn inline-block-tight icon icon-playback-play" });
    var toggleWatcher = dom.checkBox("", { type : "checkbox", id : "toggleCheckbox", checked : atom.config.get("atom-server-plugin.toggleWatcher") });
    var toggleWatcherLabel = dom.label("File Watcher", { for : "toggleCheckbox" });
    var toggleWatcherDiv = dom.div(null, { className : 'toggleWatcher'}, [toggleWatcher, toggleWatcherLabel]);
    var clear = dom.button("", { className : "btn inline-block-tight icon icon-flame", title : "clear"});

    var buttonContainer = dom.div(null, {}, [ startStopServer, clear, toggleWatcherDiv]);

    var panel = dom.atomPanel();
    var logView = new LogView(panel, logBufferSize);
    logView.init();
    var element = dom.div(null, {}, [buttonContainer, panel]);

    this.r = new Runtime(function(logLine, messageType){
        logView.appendLog(logLine, messageType);
    });

    startStopServer.addEventListener("click", () => {
      this.r.serverStartStop();
      updateStartStopServerButton(this.r.serverStopped);
    });
    clear.addEventListener("click", () => logView.clear() );

    toggleWatcher.addEventListener("click", () => {
      toggleWatcher.checked = !toggleWatcher.checked;
      this.r.startStopWatcher(toggleWatcher);
    });

    this.subscriptions = new CompositeDisposable();
    this.modal = atom.workspace.addBottomPanel({
      item : element,
      visible: false
    });

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'atom-server-plugin:toggle': ()=> this.modal.isVisible() ? this.modal.hide() : this.modal.show(),
      'atom-server-plugin:startStopServer': ()=> {
        this.r.serverStartStop();
        updateStartStopServerButton(this.r.serverStopped);
      },
      'atom-server-plugin:startStopWatcher': ()=> this.r.startStopWatcher(toggleWatcher)
    }));

  },

  deactivate : function(){
    this.subscriptions.dispose();
    if(this.r){
      this.r.serverStop();
      this.r.stopWatcher();
    }
  }
};
