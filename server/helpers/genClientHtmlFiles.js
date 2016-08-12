import _ from "lodash";
import fs from 'fs';
import { jsdom } from "../";
import { jsdomHelpers } from "../";


/*

`<p>Hellos
    <img src="foo.jpg">
  </p>`

*/

//console.log("proccess env ", process.env);
//console.log("proccess meteor settings ", Meteor.settings);

const changeNameOfTemplate = function($, newname){
  let templates = $("template");
  _.each(templates, function(template){
      let name = $(template).attr("name");
      let _newname = `${name}${newname}`;
      $(template).attr("name", _newname);
  });
}

const insertTemplate = function($, template, where){
  console.log("insert ", $(where));
}

const generateCustomHtmlFiles = function(html, finalPath){

  let obj = jsdom(html);
  let $ = obj.$;
  //let window = obj.window;

  //$("p").text("Hello Saguas");
  insertTemplate($, "<div><p>Luis</p></div>", "template div");
  changeNameOfTemplate($, "Beesknees");
  let elements = [];
  _.each($("template").toArray(), function(template){
    elements.push(template.outerHTML);
  })
  jsdomHelpers.generateFile(finalPath, elements);
}

//[window.document.documentElement.innerHTML]
const pluginName = "product-variant";
const destPath = "/client/message.html";
const srcPath = "/client/templates/products/products.html";

let newSrcPath = jsdomHelpers.makeIncludedPluginsPath(pluginName, srcPath);
let finalDestPath = jsdomHelpers.makeCustomPluginsPath("Beesknees", destPath);
//let html = jsdomHelpers.readFileSync(newSrcPath);

//generateCustomHtmlFiles(html, finalDestPath);
