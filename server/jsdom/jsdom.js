import _ from "lodash";
import { Logger } from "/server/api";
import jsdom from 'jsdom';
import fs from 'fs';
import path from "path";
import jquery from "jquery";


const appRoot = path.resolve(".").split(".meteor")[0];
const pluginsPath = appRoot + "imports/plugins/";
const corePlugins = pluginsPath + "core/";
const includedPlugins = pluginsPath + "included/";
const customPlugins = pluginsPath + "custom/";


function isEmptyOrMissing(searchPath) {
  let stat;
  try {
    stat = fs.statSync(searchPath);
  } catch (e) {
    return true;
  }
  if (stat.isDirectory()) {
    const items = fs.readdirSync(searchPath);
    return !items || !items.length;
  }
  const file = fs.readFileSync(searchPath);
  return !file || !file.length;
}


const generateFile = function(file, imports, scape=true) {
  // create/reset imports file
  try {
    Logger.info(`Resetting plugins file at ${file}`);
    fs.writeFileSync(file, "");
  } catch (e) {
    Logger.error(e, `Failed to reset plugins file at ${file}`);
    throw new Meteor.Error(e);
  }

  // populate plugins file with imports
  imports.forEach((importPath) => {
    try {
      let txt = scape ? _.unescape(`${importPath}`) : `${importPath}`;
      fs.appendFileSync(file, txt);
    } catch (e) {
      Logger.error(e, `Failed to write to plugins file at ${importPath}`);
      throw new Meteor.Error(e);
    }
  });
}


const makeCustomPluginsPath = function(pluginName, destPath){
    const pathName = customPlugins + pluginName + destPath;
    return pathName;
}

const makeCorePluginsPath = function(pluginName, destPath){
    const pathName = corePlugins + pluginName + destPath;
    return pathName;
}

const makeIncludedPluginsPath = function(pluginName, destPath){
    const pathName = includedPlugins + pluginName + destPath;
    return pathName;
}
const makePluginsPath = function(pluginName, destPath){
    const pathName = pluginsPath + pluginName + destPath;
    return pathName;
}

const makeAppRootPath = function(pluginName, destPath){
    const pathName = appRoot + pluginName + destPath;
    return pathName;
}


const readFileSync = function(path){
  const file = fs.readFileSync(path);
  return file;
}


const getJsdom = function(html){
  let window = jsdom.jsdom(html).defaultView;
  let $ = jquery(window);
  return {
      window: window,
      $: $
  }
}

export const jsdomHelpers = {
  appRoot: appRoot,
  pluginsPath: pluginsPath,
  corePlugins: corePlugins,
  includedPlugins: includedPlugins,
  customPlugins: customPlugins,
  generateFile: generateFile,
  makeAppRootPath: makeAppRootPath,
  makePluginsPath: makePluginsPath,
  makeCustomPluginsPath: makeCustomPluginsPath,
  makeCorePluginsPath: makeCorePluginsPath,
  makeIncludedPluginsPath: makeIncludedPluginsPath,
  readFileSync: readFileSync
}

export default getJsdom;
