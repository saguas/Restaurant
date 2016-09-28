import { Template } from "meteor/templating";
import { Reaction, Logger } from "/client/api";
import { Restaurant, ClientsTable, TableRequestMsg } from "../../../lib";
import { Session } from "meteor/session";
//import { ReactiveDict } from "meteor/reactive-dict";
import { ReactiveVar } from 'meteor/reactive-var';
import moment from "moment-timezone";




const removeClientFromTable = function(instance){
  const doc = instance.clientToRemove.get();

  console.log("before call ", doc);
  Meteor.call("table/removeClientTablePermission", doc.clientId, doc.tableName, doc.masterClientNumber, function (error, result) {
    if(error){
      console.log("Error in call to table/removeClientTablePermission ", error);
      //TODO: aqui remover a entrada no clientsTable
      return ;
    }
    if(!result.saved){
      showRequestAlertWithTimer(result.error);
    }else{
      Restaurant.Messenger.upadateTableRequestDelivered(doc.id);
      instance.clientToRemove.set();
    }

    showButtonToRemove(instance);
  });
}

const hideButtonToRemove = function(instance){
  instance.$("[data-event-action=removeClientRequest]").addClass("hidden");
}

const showButtonToRemove = function(instance){
  instance.$("[data-event-action=removeClientRequest]").removeClass("hidden");
}

const showRequestAlert = function (errorMessage) {
  return $("#alertGuestClientsTable").removeClass("hidden").text(errorMessage);
};

const showRequestAlertWithTimer = function (errorMessage, delay=30) {
  Meteor.setTimeout(function(){
     hideRequestAlert();
  }, delay);
  return $("#alertGuestClientsTable").removeClass("hidden").text(errorMessage);
};

const hideRequestAlert = function () {
  return $("#alertGuestClientsTable").addClass("hidden").text("");
};

Template.guestClientsInTable.onCreated(function () {
  const currData = Template.currentData();
  this.dict = currData.dict || this.parent(1);
  console.log("dict ", this.dict);
  this.clientToRemove = new ReactiveVar();
});


Template.guestClientsInTable.helpers({
  hasGuestClients: function(){
    const instance = Template.instance();

    let count = 0;
    const masterClientNumber = instance.dict.get("btnClientId") || Meteor.user().clientId;
    let tableName = Restaurant.getTableName(Session.get("floor"), Session.get("tableNumber"));
    const clientsInTable = ClientsTable.find({masterClientNumber: masterClientNumber, tableNumber: tableName},{fields: {clients:1}}).fetch();
    if(clientsInTable.length > 0){
      count = clientsInTable[0].clients.length > 0;
    }
    return count;
    //return TableRequestMsg.find({fromClientId: masterClientNumber, creatorId: Meteor.userId(), seen: true, reason: "accepted"}).count() > 0;
  },
  guestClients: function(){
    const instance = Template.instance();
    //return ClientsTable.find({},{fields: {clients:1, tableNumber: 1, masterClientNumber: 1, createdAt: 1}});
    let result = {};
    const masterClientNumber = instance.dict.get("btnClientId") || Meteor.user().clientId;
    if(Reaction.hasPermission(["employee/employee", "employee/master", "admin"])){
      result = TableRequestMsg.find({fromClientId: masterClientNumber, pinned: true, reason: "accepted"});
    }else{
      result = TableRequestMsg.find({fromClientId: masterClientNumber, creatorId: Meteor.userId(), pinned: true, reason: "accepted"});
    }

    return result;
  },
  textGuestClients: function(){
    const instance = Template.instance();
    let text = "" ;

    if(Reaction.hasPermission(["employee/employee", "employee/master", "admin"])){
        text = "Client does not have any guest.";
    }else{
      const clientId = Meteor.user().clientId;
      const clientsTable = ClientsTable.findOne({},{fields: {clients:1, tableNumber: 1, masterClientNumber: 1, userId: 1}});
      if(clientsTable && clientsTable.masterClientNumber === clientId){
        text = "There aren't any guest client.";
      }else if(clientsTable){
        const result = TableRequestMsg.findOne({fromClientId: clientsTable.masterClientNumber, creatorId: clientsTable.userId, pinned: true, reason: "accepted"}) || {};
        text = `You are a guest of client <strong>${clientsTable.masterClientNumber}
        (${result.name})</strong> in table <strong>${Session.get("tableNumber")}</strong> in floor <strong>${Session.get("floor")}</strong>
        (${moment(result.createdAt).fromNow()}).`
      }
    }

    return text;
  }

});



Template.guestClientsInTable.events({
  "click [data-event-action=removeClientRequest]": function(event, instance){
    event.preventDefault();
    event.stopPropagation();

    const id = event.currentTarget.dataset.id;
    const clientId = parseInt(event.currentTarget.dataset.clientid);
    const masterClientNumber = parseInt(event.currentTarget.dataset.masterclientnumber);
    const tableName = Restaurant.getTableName(Session.get("floor"), Session.get("tableNumber"));//event.currentTarget.dataset.tablename;

    instance.$("[data-event-action=removeClientRequestConfirm]").removeClass("hidden");
    instance.$("[data-event-action=removeClientRequestCancel]").removeClass("hidden");

    instance.$(event.currentTarget).parents("tr").addClass("danger");
    instance.clientToRemove.set({id: id, clientId: clientId, masterClientNumber: masterClientNumber, tableName: tableName});
    hideButtonToRemove(instance);
    hideRequestAlert();
  },
  "click [data-event-action=removeClientRequestConfirm]": function(event, instance){
    event.preventDefault();
    event.stopPropagation();

    instance.$("[data-event-action=removeClientRequestConfirm]").addClass("hidden");
    instance.$("[data-event-action=removeClientRequestCancel]").addClass("hidden");
    removeClientFromTable(instance);
  },
  "click [data-event-action=removeClientRequestCancel]": function(event, instance){
    event.preventDefault();
    event.stopPropagation();

    const clientToRemove = instance.clientToRemove.get();
    instance.$(`#guestclient${clientToRemove.clientId}`).removeClass("danger");
    instance.$("[data-event-action=removeClientRequestConfirm]").addClass("hidden");
    instance.$("[data-event-action=removeClientRequestCancel]").addClass("hidden");
    showButtonToRemove(instance);
  }

});
