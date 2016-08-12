import { Meteor } from "meteor/meteor";
import { Tracker } from 'meteor/tracker';
import { Template } from "meteor/templating";
import { Session } from "meteor/session";
import { ReactiveVar } from 'meteor/reactive-var';
import { Reaction, Logger } from "/client/api";
import { Cart } from "/lib/collections";
import { Restaurant } from "../../../lib";



const paymentAlert = function (errorMessage) {
  return $("#tableError").removeClass("hidden").text(errorMessage);
};

const hidePaymentAlert = function () {
  return $("#tableError").addClass("hidden").text("");
};

const handleRestaurantSubmitError = function (error) {
  let serverError = error !== null ? error.message : void 0;
  if (serverError) {
    return paymentAlert("Oops! " + serverError);
  } else if (error) {
    return paymentAlert("Oops! " + error);
  }
};


Template.ClientChooser.onCreated(function(){
  let parent = this.parent(1);
  this.setShipmentMethod = parent.setShipmentMethod;
  this.isNextKeyDisabled = parent.isNextKeyDisabled;

  this.defaultUser = new ReactiveVar(false);

  this.dict = parent.dict;
  this.btnNextTxt = parent.btnNextTxt || new ReactiveVar("NEXT");
  this.dict.set("clientNumber", "0");
  //Logger.warn({"Teste": this.dict}, "In ClientChooser onCreated!");

  this.autorun(() => {
    if(this.dict.get("btnClientId") != 0){
      const btnNextTxtWithClientId = parent.btnNextTxtWithClientId && parent.btnNextTxtWithClientId.get();
      this.btnNextTxt.set(btnNextTxtWithClientId || this.btnNextTxt.get());
    }else{
      const btnNextTxtWithoutClientId = parent.btnNextTxtWithoutClientId && parent.btnNextTxtWithoutClientId.get() || "NEXT";
      this.btnNextTxt.set(btnNextTxtWithoutClientId);
    }
  });

  Session.setDefault("clientId", "");

  this.autorun(() => {
    this.defaultUserId = Session.get("defaultUserId");
    if(this.defaultUserId && !this.dict.get("btnClientId")){
      this.defaultUser.set(true);
      this.dict.set("clientNumber", this.defaultUserId);
      Session.set("clientId", this.defaultUserId);
    }
  });

});

/*Template.ClientChooser.onRendered(function(){

});*/

Template.ClientChooser.onDestroyed(function(){
  hidePaymentAlert();
});

Template.ClientChooser.helpers({
  getNumberOfRowsInTable: function(){
    let instance = Template.instance();
    let btnNext = instance.btnNextTxt.get();
    return [[1,2,3],[4,5,6],[7,8,9],["CLEAR",0, btnNext]];
  },
  getClientNumberSeleted: function(){
    let instance = Template.instance();
    return instance.dict.get("clientNumber");
  },
  employeePermissions: function(){
    let instance = Template.instance();
    let perm = false;
    if(Reaction.hasPermission(["employee/employee", "employee/master", "admin"]) && instance.dict.get("btnClientId")){
        perm = false;
    }else{
        perm = true;
    }
    return perm;
  },
  regularUserPermissions: function(){
    if(Reaction.hasPermission(["client/table", "client/vip"]) && !Reaction.hasPermission(["employee/employee", "employee/master", "admin"])){
        return true;
    }
    return false;
  },
  isDefaultUser: function(){
    let instance = Template.instance();
    if(instance.defaultUserId == instance.dict.get("btnClientId")){
      return "Default User";
    }
    return false;
  }
});

Template.ClientChooser.events({
  "change [data-event-action=toggleDefaultUser]": function (event, instance) {
    if($(event.currentTarget).is(":checked")){
      instance.defaultUser.set(true);
      instance.dict.set("clientNumber", instance.defaultUserId);
      Session.set("clientId", instance.defaultUserId);
    }else{
      instance.defaultUser.set(false);
      instance.dict.set("clientNumber", "0");
      Session.set("clientId", 0);
    }
  }
});

Template.ButtonClient.onCreated(function(){
  let parent = this.parent(1);
  this.setShipmentMethod = parent.setShipmentMethod;
  this.isNextKeyDisabled = parent.isNextKeyDisabled;
  this.btnNextTxt = parent.btnNextTxt;
  this.defaultUser = parent.defaultUser;
  this.dict = parent.dict;
});

Template.ButtonClient.helpers({
  validNumber: function(num){
    return !isNaN(parseFloat(num)) && isFinite(num);
  },
  isKeyDisabled: function(key){
    let instance = Template.instance();


    if(instance.defaultUser.get() && key !== instance.btnNextTxt.get()){
      return "disabled";
    }

    if(!Reaction.hasPermission(["employee/employee", "employee/master","owner", "admin"]) && key !== instance.btnNextTxt.get()){
      let clientNumber = Meteor.user().clientId;
      instance.dict.set("clientNumber", clientNumber.toString());
      return "disabled";
    }

    let btnClientId = instance.dict.get("btnClientId");

    if( btnClientId && key !== instance.btnNextTxt.get()){
      instance.dict.set("clientNumber", btnClientId.toString());
      Session.set("clientId", btnClientId);
      return "disabled";
    }

    let tblName;
    Tracker.nonreactive(function(){
        tblName = Restaurant.getTableName(Session.get("floor"), Session.get("tableNumber"));
    })

    let clientNumber = parseInt(instance.dict.get("clientNumber"));
    let disable = instance.isNextKeyDisabled(key, clientNumber, tblName);
    if(( disable && key === instance.btnNextTxt.get()) || (instance.dict.get("clientNumber") === "0" && key === instance.btnNextTxt.get())){
      return "disabled";
    }
  }
});

Template.ButtonClient.events({
  "click [data-event-action=tableClient]": function (event, instance) {
    event.preventDefault();
    event.stopPropagation();
    let number = event.currentTarget.dataset.eventTablenumber;

    hidePaymentAlert();

    if (!Number.isNaN(Number.parseFloat(number)) && isFinite(number)){
      let clientNumber = instance.dict.get("clientNumber");//clientNumberVar.get();
      console.log("instance ", clientNumber);
      let newnumber;
      if(clientNumber === "0"){
        newnumber = number.toString();
        instance.dict.set("clientNumber", newnumber);
        Session.set("clientId", newnumber);
      }else{
        newnumber = clientNumber.concat(number.toString());
        instance.dict.set("clientNumber", newnumber);
        Session.set("clientId", newnumber);
      }

    }else if(number === "CLEAR"){
      instance.dict.set("clientNumber", "0");
    }else{
      let clientId = parseInt(Session.get("clientId"));
      let tableName = Restaurant.getTableName(Session.get("floor"), Session.get("tableNumber"));
      if(number === "OPEN"){
        Meteor.call("table/open", clientId, tableName, function (error, result) {
          if(error){
            console.log("Error in call to table/open ", error);
            return handleRestaurantSubmitError(error);
          }else{
            if(!result.saved){
              return handleRestaurantSubmitError(result.error);
            }
            instance.dict.set("btnClientId", clientId);
            instance.btnNextTxt.set("CLOSE");
            return;
          }
        });
        return;
      }else if(number === "CLOSE"){
        Meteor.call("table/close", clientId, tableName, function (error, result) {
          if(error){
            console.log("Error in call to table/close ", error);
            return handleRestaurantSubmitError(error);
          }else{
            if(!result.saved){
              return handleRestaurantSubmitError(result.error);
            }
            instance.dict.set("btnClientId", clientId);
            return;
          }
        });
        return;
      }
      instance.setShipmentMethod(instance.dict.get("method"));
    }
  }
});
