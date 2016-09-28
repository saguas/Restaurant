import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { Session } from "meteor/session";
import { Tracker } from 'meteor/tracker';
import { Reaction, Logger } from "/client/api";
//import { Restaurant } from "../lib";
import { Restaurant, TableMap, TableRequestMsg } from "../lib";

import * as Collections from "../lib/collections";
import { Restaurant as RestaurantLib } from "../lib";

import _places from "places.js";

Restaurant.places = _places;
places = _places;

/*
XMLHttpRequest.prototype.realOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.realSend = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.open = function(type, url, async) {
  console.log("type: ", type);
  console.log("url: ", url);
  console.log("this ", this);
  if(type === "POST" && url === "https://places-dsn.algolia.net:443/1/places/query"){
    //call meteor method to search. To return call onreadystatechange() with nothing.
    //set statusText to "OK"
    //set status to 200
    //set readyState to 4
    //set responseText to the search result
    //set response to the same as responseText
    //on the server make a POST rest api call to https://places-dsn.algolia.net:443/1/places/query.
    console.log("waiting for send to complete.");
    this.statusText = "OK";
    this.status = 200;
    this.readyState = 4;
    this.responseText = "the result here";
    this.response = "the result here";
  }else{
    this.realOpen(type, url, async);
  }

};

XMLHttpRequest.prototype.send = function(value) {
    // "{\"params\":\"hitsPerPage=5&language=pt&query=rua%20\"}"
    console.log("send value ", value);
    this.addEventListener("progress", function(){
        console.log("Loading");
    }, false);

    this.addEventListener("load", function(){
        //console.log(this.responseText);
        console.log("load not in use");
    }, false);
    this.addEventListener("open", function(){
        console.log("open");
    }, false);
    this.realSend(value);
};
*/

const getDataFromTableChildrens = function(ArrayData){
  let data = [];
  for(let arr of ArrayData){
    let parent = {group: arr.name, text: arr.name, children:[]};
    for (let table of arr.tables){
      if(table.show){
        let result = {group: arr.name};
        result.id = arr._id + table.name;
        result.text = `${table.name}`;
        parent.children.push(result);
      }
    }
    data.push(parent);
  }

  return data;
}


Tracker.autorun(function () {
  Meteor.subscribe("RestaurantSettings");
});



Tracker.autorun(function () {
  //if(Meteor.user()){
  //if(Meteor.userId()){
  const sub = Meteor.subscribe('UserClientId', Meteor.userId());
  if(sub.ready()){
    let clientId = Meteor.user().clientId;

    //if(Reaction.hasPermission(["client/table", "employee/employee", "employee/master", "admin"])){
    Meteor.subscribe('ClientsTable', clientId);
    //}

    let subMsg = Meteor.subscribe('TableRequestMsg', Meteor.userId(), clientId);
    if(subMsg.ready()){
      let msgs = TableRequestMsg.find();
      Restaurant.Messenger.observeRequests(msgs, clientId);
    }

  }
  //}
});


Tracker.autorun(function () {
  if(Reaction.Subscriptions.Shops.ready()){
    const domain = Meteor.absoluteUrl().split("/")[2].split(":")[0];
    const shop = Reaction.Collections.Shops.findOne({domains: domain});
    if(shop){
      Session.set("shopId", shop._id);
    }

  }
});


Tracker.autorun(function () {

  //Meteor.subscribe("RestaurantSettings");

  /*const status = Meteor.status();
  if (!status.connected && (status.status === "failed" || status.status === "offline")){
    console.log("Meteor reconnecting!");
    Meteor.reconnect();
  }*/

  //Reaction.hasPermission is not reactive in meteor way. Need Meteor.userId() to make this subscription reactive
  /*if(Reaction.Subscriptions.Shops.ready() && Reaction.getShopId()){
    if(Reaction.hasPermission(["employee/employee", "employee/master", "client/vip", "admin"])){*/

    const tableSub = Meteor.subscribe("TableMap");

    if(tableSub.ready()){
      console.log("table sub is ready");
      TableMap.flatMap = getDataFromTableChildrens(TableMap.find({},{sort:{order:1}}).fetch());
    }
  //}
//}

  /*const sub = Meteor.subscribe('UserClientId', Meteor.userId());
  if(sub.ready()){
    Meteor.subscribe('ClientsTable', Meteor.user() && Meteor.user().clientId);
  }*/
});

Tracker.autorun(function () {
    let sub = Meteor.subscribe('DefaultUser', Meteor.userId());
    if(sub.ready()){
      const shopid = Session.get("shopId");
      const selector = `roles.${shopid}`;
      let obj = {};
      obj[selector] = {$in:['default/user']};
      const DefaultUser = Meteor.users.findOne(obj);
      if (DefaultUser){
        Session.set("defaultUserId", DefaultUser.clientId);
      }
    }
});


Meteor.startup(function(){
  if(Meteor.isClient){
    Template.coreOrderShippingInvoice.events({
      "click .order-item.form-group.order-summary-form-group": function(event, template){
         console.log("clicked coreOrderShippingInvoice evnt obj ", event);
      }
    });
  }
});


//RestMessager = toastr;
//Restaurant = Object.assign(RestaurantLib, {toastr: toastr});
Object.assign(Reaction.Collections, Collections);
