import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { Session } from "meteor/session";
import { Tracker } from 'meteor/tracker';
import { Reaction, Logger } from "/client/api";
//import { Restaurant } from "../lib";
import { TableMap } from "../lib";



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

  //Reaction.hasPermission is not reactive in meteor way. Need Meteor.userId() to make this subscription reactive
  if(Meteor.user() && Reaction.hasPermission(["employee/employee", "employee/master", "client/vip", "admin"])){
    const tableSub = Meteor.subscribe("TableMap");
    if(tableSub.ready()){
      TableMap.flatMap = getDataFromTableChildrens(TableMap.find({},{sort:{order:1}}).fetch());
    }
  }

  /*const sub = Meteor.subscribe('UserClientId', Meteor.userId());
  if(sub.ready()){
    Meteor.subscribe('ClientsTable', Meteor.user() && Meteor.user().clientId);
  }*/
});

Tracker.autorun(function () {
    let sub = Meteor.subscribe('DefaultUser', Meteor.userId());
    if(sub.ready()){
      const DefaultUser = Roles.getUsersInRole("default/user", Reaction.getShopId());
      if (DefaultUser.count() >= 1){
        Session.set("defaultUserId", DefaultUser.fetch()[0].clientId);
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
