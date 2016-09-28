import _ from "lodash";
import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { Session } from "meteor/session";
import { ReactiveDict } from "meteor/reactive-dict";
import { Random } from 'meteor/random';
import { Reaction, Logger } from "/client/api";
import { Restaurant, TableRequestMsg } from "../../../lib";



const hideButtonToRemove = function(instance){
  instance.$("[data-event-action=removeClientRequest]").addClass("hidden");
}

const showButtonToRemove = function(instance){
  instance.$("[data-event-action=removeClientRequest]").removeClass("hidden");
}

const showPendents = function (errorMessage) {
  return $("#requestsPendents").removeClass("hidden");
};

const hidePendents = function () {
  return $("#requestsPendents").addClass("hidden");
};


const showRequestAlert = function (errorMessage) {
  return $("#alertRequestTablePermissions").removeClass("hidden").text(errorMessage);
};

const hideRequestAlert = function () {
  return $("#alertRequestTablePermissions").addClass("hidden").text("");
};

Template.requestClientTable.onCreated(function () {
  this.clientToRemove = new ReactiveVar();
});

Template.requestClientTable.helpers({
    showJoin: function(){
      //const clientId = Meteor.user().clientId;
      //const hasRequestsPendents = TableRequestMsg.find({reason: "request", fromClientId: clientId, status: "new"}).count() > 0;
      return !Reaction.hasPermission("client/table") && !Reaction.hasPermission("client/table/refused"); //&& !hasRequestsPendents;
    },
    hasRequestsPendents: function(){
      const clientId = Meteor.user().clientId;
      return TableRequestMsg.find({reason: "request", fromClientId: clientId, status: "new"}).count() > 0;
    },
    requestsPendents: function(){
      const clientId = Meteor.user().clientId;
      return TableRequestMsg.find({reason: "request", fromClientId: clientId, status: "new"});
    }
});

Template.requestClientTable.events({
    "click [data-event-action=removeClientRequest]": function(event, instance){
      event.preventDefault();
      event.stopPropagation();

      const id = event.currentTarget.dataset.id;
      const toClientId = event.currentTarget.dataset.toclientid;
      //console.log("remove ", event.currentTarget.dataset);
      //if(!TableRequestMsg.findOne({responseToMsgId: id})){
      //TableRequestMsg.remove({_id: id});
      //TableRequestMsg.update({_id: id}, {$set:{status="removed"}});

      //Restaurant.Messenger.upadateTableRequestState(id, "removed");

      /*instance.removedMsg.set({
        msgId: id,
        fromClientId: Meteor.user().clientId,
        toClientId: parseInt(toClientId)
      });*/

      instance.$("[data-event-action=removeClientRequestConfirm]").removeClass("hidden");
      instance.$("[data-event-action=removeClientRequestCancel]").removeClass("hidden");

      instance.$(event.currentTarget).parents("tr").addClass("danger");
      instance.clientToRemove.set({msgId: id, clientId: Meteor.user().clientId, masterClientNumber: toClientId});
      hideButtonToRemove(instance);
      hideRequestAlert();

    },
    "click [data-event-action=removeClientRequestConfirm]": function(event, instance){
      event.preventDefault();
      event.stopPropagation();

      instance.$("[data-event-action=removeClientRequestConfirm]").addClass("hidden");
      instance.$("[data-event-action=removeClientRequestCancel]").addClass("hidden");

      const clientToRemove = instance.clientToRemove.get();
      Restaurant.Messenger.upadateTableRequestState(clientToRemove.msgId, "removed");
      //removeClientFromTable(instance);
    },
    "click [data-event-action=removeClientRequestCancel]": function(event, instance){
      event.preventDefault();
      event.stopPropagation();

      const clientToRemove = instance.clientToRemove.get();
      instance.$(`#guestclientrequest${clientToRemove.masterClientNumber}`).removeClass("danger");
      instance.$("[data-event-action=removeClientRequestConfirm]").addClass("hidden");
      instance.$("[data-event-action=removeClientRequestCancel]").addClass("hidden");
      showButtonToRemove(instance);
    },
    "focus [data-event-action=textClientId]": function(event, instance){
      hideRequestAlert();
    },
    "blur [data-event-action=textClientId]": function(event, instance){
      hideRequestAlert();
    },
    "change input[data-event-action=checkboxJointClient]": function(event, instance){
      if($(event.currentTarget).is(":checked")){
        instance.$("[data-event-action=formJointClient]").addClass("show");
        instance.$("[data-event-action=formJointClient]").removeClass("hide");
        instance.$("#clientId").focus();
      }else{
        instance.$("[data-event-action=formJointClient]").removeClass("show");
        instance.$("[data-event-action=formJointClient]").addClass("hide");
      }
      hideRequestAlert();

    },
    "click [data-event-action=requestClientPermission]": function(event, instance){
      event.preventDefault();
      event.stopPropagation();

      function validNumber(num){
        return !isNaN(parseFloat(num)) && isFinite(num) && num > 2;
      }

      const toClientId = instance.$("input[data-event-action=textClientId]").val();
      if(validNumber(toClientId)){
        try{
          const _id = Random.id();
          //registerEmmiterOnce(_id, Meteor.user().clientId, parseInt(toClientId), instance);
          Restaurant.Messenger.sendTableRequest({_id: _id, toClientId: parseInt(toClientId), callback: function(err){
            if(err){
              let error;
              if(err.error === 403){
                error = "You don't have permission to make request for tables. Please call waiter.";
              }else{
                error = err;
              }
              showRequestAlert(error);
            }

          }});
          //Restaurant.Messenger.sendTableRequest({toClientId: parseInt(toClientId)});
          //instance.requestsPendents.set(pendents);
          //showRequestAlert("Please wait. If the user accept your request this message will disappear.");
        }catch(err){
          showRequestAlert(err);
        }

      }else{
        showRequestAlert("Not a valid client id.");
      }
      instance.$("input[data-event-action=textClientId]").val("");
    }
  });
