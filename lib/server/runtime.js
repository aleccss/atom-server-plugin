const CompositeDisposable = require("atom").CompositeDisposable;

const spawn = require('child_process').spawn;
const fs = require('fs-extra');
const chokidar = require("chokidar");
const projectPath = "C:\\Users\\C5244164\\workspace\\Company\\WebContent";
const serverProjectPath = "C:\\tomcat\\apache-tomcat-7.0.70\\webapps\\Company";
const serverPath = "C:\\tomcat\\apache-tomcat-7.0.70\\bin\\catalina.bat";

function Runtime (messageHanlder, messageType) {
  this.watcherStarted = false;
  this.messageHanlder = messageHanlder;
  this.subscriptions = new CompositeDisposable();
  this.serverStopped = 1;
  this.watcher = chokidar.watch(projectPath);
}

Runtime.prototype.serverStart = function(){
  const bat = spawn(serverPath, ['run']);
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
  this.serverStopped = 0;
}

Runtime.prototype.deployProject = function(){
  fs.copy(projectPath, serverProjectPath , {clobber : true}, function(err){
    if(err){
      throw err;
      return;
    }
  });
  this.subscriptions.add(atom.notifications.addSuccess("Project deployed"));
}

Runtime.prototype.deleteProject = function(cb){
  fs.emptyDir(serverProjectPath, cb);
}

Runtime.prototype.startWatcher = function(){
  // Add event listeners.
  this.watcher
    .on('change', path => deployProject())
    .on('unlink', path => deleteProject( _ => deployProject()) );
}


Runtime.prototype.stopWatcher = function(){
  this.watcher.off();
}

Runtime.prototype.serverStop = function(){
  console.log(this.tomcatProcess.pid);
  if(this.serverStopped === 0){
    try{
      process.kill(this.tomcatProcess.pid);
      this.subscriptions.add(atom.notifications.addError("Server stopped"));
    } catch (err) {
        this.messageHanlder(err.toString(), "error");
    }
  } else {
    this.subscriptions.add(atom.notifications.addWarning("Server is not running"));
  }
  this.serverStopped = 1;
}

module.exports = Runtime;
