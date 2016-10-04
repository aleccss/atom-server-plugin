const CompositeDisposable = require("atom").CompositeDisposable;

const spawn = require('child_process').spawn;
const fs = require('fs-extra');
const chokidar = require("chokidar");

function Runtime (messageHanlder, messageType) {
  this.projectPath = atom.config.get("atom-server-plugin.projectPath");
  this.serverProjectPath = atom.config.get("atom-server-plugin.serverProjectPath");
  this.serverPath = atom.config.get("atom-server-plugin.serverPath");
  this.serverStartCommand = atom.config.get("atom-server-plugin.serverStartCommand");
  this.serverStopCommand = atom.config.get("atom-server-plugin.serverStopCommand");
  this.watcherStarted = false;
  this.messageHanlder = messageHanlder;
  this.subscriptions = new CompositeDisposable();
  this.serverStopped = true;
  this.watcher = chokidar.watch(this.projectPath);
}

Runtime.prototype.serverStartStop = function () {
  if(this.serverStopped){
    this.serverStart();
  } else {
    this.serverStop();
  }
};

Runtime.prototype.serverStart = function(){
  debugger;
  const bat = spawn(this.serverPath, [this.serverStartCommand]);
  this.subscriptions.add(atom.notifications.addSuccess("Server started"));
  bat.stdout.on('data', (data) => {
    this.messageHanlder(data.toString(), "info");
  });

  bat.stderr.on('data', (data) => {
    this.messageHanlder(data.toString(), "error");
  });

  bat.on('exit', (code) => {
    console.log(`Child exited with code ${code}`);
  });
  this.tomcatProcess = bat;
  this.serverStopped = false;
}

Runtime.prototype.deployProject = function(){
  fs.copy(this.projectPath, this.serverProjectPath , {clobber : true}, function(err){
    if(err){
      throw err;
      return;
    }
  });
  this.subscriptions.add(atom.notifications.addSuccess("Project deployed"));
}

Runtime.prototype.deleteProject = function(cb){
  fs.emptyDir(this.serverProjectPath, cb);
}

Runtime.prototype.startStopWatcher = function (toggleWatcher) {
  if(toggleWatcher.checked){
    this.stopWatcher();
    toggleWatcher.checked = false;
  } else {
    this.startWatcher();
    toggleWatcher.checked = true;
  }
};

Runtime.prototype.startWatcher = function(){
  // Add event listeners.
  this.watcher
    .on('change', path => deployProject())
    .on('unlink', path => deleteProject( _ => deployProject()) );
}

Runtime.prototype.stopWatcher = function(){
  this.watcher.close();
}

Runtime.prototype.serverStop = function(){
  if(!this.serverStopped){
    try{
      var stopBat = spawn(this.serverPath, [this.serverStopCommand]);
      stopBat.stdout.on('data', (data) => {
        this.messageHanlder(data.toString(), "info");
      });
      stopBat.on('close', (code) => {
        this.subscriptions.add(atom.notifications.addError("Server stopped"));
      });
    } catch (err) {
      this.subscriptions.add(atom.notifications.addError(this.messageHanlder("error")));
    }
  } else {
    this.subscriptions.add(atom.notifications.addWarning("Server is not running"));
  }
  this.serverStopped = true;
}

module.exports = Runtime;
