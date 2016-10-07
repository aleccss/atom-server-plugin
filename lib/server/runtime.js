const CompositeDisposable = require("atom").CompositeDisposable;

const spawn = require('child_process').spawn;
const fs = require('fs-extra');
const chokidar = require("chokidar");


function deploy(from, to, cb){
  cb = cb || function(){};
  fs.copy(from, to, {clobber : true}, function(err){
    if(err){
      throw err;
      return;
    }
    cb();
  });
  atom.notifications.addSuccess("Project deployed");
  // this.subscriptions.add();
}

function Runtime (messageHandler, messageType) {
  this.projectPath = atom.config.get("atom-server-plugin.projectPath");
  this.serverProjectPath = atom.config.get("atom-server-plugin.serverProjectPath");
  this.serverPath = atom.config.get("atom-server-plugin.serverPath");
  this.serverStartCommand = atom.config.get("atom-server-plugin.serverStartCommand");
  this.serverStopCommand = atom.config.get("atom-server-plugin.serverStopCommand");
  this.mavenPath = atom.config.get("atom-server-plugin.mavenPath");
  this.watcherStarted = false;
  this.messageHandler = messageHandler;
  this.subscriptions = new CompositeDisposable();
  this.serverStopped = true;
  this.watcher = chokidar.watch(this.projectPath);
}

Runtime.prototype.serverStartStop = function () {
  if(this.serverStopped){
    this.serverStart();
    this.serverStopped = false;
  } else {
    this.serverStop();
    this.serverStopped = true;
  }
};

Runtime.prototype.serverStart = function(){
  const mvn = spawn(this.mavenPath + "\\mvn.cmd", ["clean", "package"], { cwd : this.projectPath });

  //mvn clean process -> copy from .target folder -> start server
  mvn.stdout.on('data', (data) => {
    this.messageHandler(data.toString(), "info");
  });

  mvn.on('exit', (code) => {

    deploy(this.projectPath + "\\target", this.serverProjectPath, _ => {
      var env = { CATALINA_OPTS : '-Dwtp.deploy="C:\\tomcat\\apache-tomcat-7.0.70\\wtpwebapps" -Djava.endorsed.dirs="C:\\tomcat\\apache-tomcat-7.0.70\\endorsed" -Dsun.net.http.allowRestrictedHeaders=true -Dorg.apache.tomcat.util.buf.UDecoder.ALLOW_ENCODED_SLASH=true'};
      var actualEnv = {};
      for (var attrname in process.env) { actualEnv[attrname] = process.env[attrname]; }
      for (var attrname in env) { actualEnv[attrname] = env[attrname]; }

      const bat = spawn(this.serverPath, [this.serverStartCommand], {env : actualEnv});
      this.subscriptions.add(atom.notifications.addSuccess("Server started"));
      bat.stdout.on('data', (data) => {
        this.messageHandler(data.toString(), "info");
      });

      bat.stderr.on('data', (data) => {
        this.messageHandler(data.toString(), "error");
      });

      bat.on('exit', (code) => {
        console.log(`Child exited with code ${code}`);
      });
      this.tomcatProcess = bat;
      this.startWatcher();
    });
  });
}

Runtime.prototype.deployProject = function(){
  deploy(this.projectPath, this.serverProjectPath);
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

function buildServerPath(serverPath, projectPath, filePath){
  var relativePath = filePath.replace(projectPath, "");
  relativePath = relativePath.replace("\\src\\main\\webapp", "");
  return serverPath + "\\" + relativePath;
}

Runtime.prototype.startWatcher = function(){
  // Add event listeners.
  this.watcher
    .on('change', path => deploy(path, buildServerPath(this.serverProjectPath, this.projectPath, path)) )
    .on('unlink', path => fs.unlink(buildServerPath(this.serverProjectPath, this.projectPath, path)) );
}

Runtime.prototype.stopWatcher = function(){
  this.watcher.close();
}

Runtime.prototype.serverStop = function(){
  if(!this.serverStopped){
    try{
      var stopBat = spawn(this.serverPath, [this.serverStopCommand]);
      stopBat.stdout.on('data', (data) => {
        this.messageHandler(data.toString(), "info");
      });
      stopBat.on('close', (code) => {
        this.subscriptions.add(atom.notifications.addError("Server stopped"));
      });
    } catch (err) {
      this.subscriptions.add(atom.notifications.addError(this.messageHandler("error")));
    }
  } else {
    this.subscriptions.add(atom.notifications.addWarning("Server is not running"));
  }
}

module.exports = Runtime;
