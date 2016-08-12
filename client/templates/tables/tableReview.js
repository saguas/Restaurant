import { Template } from "meteor/templating";
import { Reaction, Logger } from "/client/api";
import { Restaurant, ClientsTable } from "../../../lib";
import { Session } from "meteor/session";
//import { ReactiveDict } from "meteor/reactive-dict";
import { ReactiveVar } from 'meteor/reactive-var';




const beginSubmit = function (instance) {
  return instance.$("#btn-processing-payment").removeClass("hidden");
};

const uiEnd = function (template) {
  return template.$("#btn-processing-payment").addClass("hidden");
};

const paymentAlert = function (errorMessage) {
  return $("#paymentError").removeClass("hidden").text(errorMessage);
};

const hidePaymentAlert = function () {
  return $("#paymentError").addClass("hidden").text("");
};

const handleRestaurantSubmitError = function (error) {
  let serverError = error !== null ? error.message : void 0;
  if (serverError) {
    return paymentAlert("Oops! " + serverError);
  } else if (error) {
    return paymentAlert("Oops! " + error);
  }
};


Template.tableReview.onCreated(function () {
  this.paymentMethodSelected = new ReactiveVar("Cash");
  console.log("tableReview this ", Template.currentData());
});

Template.tableReview.onDestroyed(function(){
  hidePaymentAlert();
})


Template.tableReview.helpers({
  isDisabled: function(){
    const shopId = Reaction.getShopId();
    const clientId = parseInt(Session.get("clientId"));
    const tableName = Restaurant.getTableName(Session.get("floor"), Session.get("tableNumber"));
    const doc = ClientsTable.findOne({
      tableNumber: tableName,
      shopId: shopId,
      $or:[{
        clients: {$in:[clientId]}
      },
      {
        masterClientNumber: clientId
      }]
    });

    if(doc && doc.status === "payment"){
      return "disabled";
    }
    return;
  },
  paymentMethodSeleted: function(){
    const instance = Template.instance();
    return instance.paymentMethodSelected.get();
  },
  btnstatus: function(method){
    console.log("method ", method);
    const shopId = Reaction.getShopId();
    const clientId = parseInt(Session.get("clientId"));
    const tableName = Restaurant.getTableName(Session.get("floor"), Session.get("tableNumber"));
    const doc = ClientsTable.findOne({
      tableNumber: tableName,
      shopId: shopId,
      $or:[{
        clients: {$in:[clientId]}
      },
      {
        masterClientNumber: clientId
      }]
    });
    let style = "info";
    if(doc && doc.paymentMethod){
      style = "default";
    }
    if(doc && doc.paymentMethod && doc.paymentMethod === method)
      style = "danger";

    return style;
  }

});



Template.tableReview.events({
  "click #payment": function(event, instance){
    event.preventDefault();
    event.stopPropagation();

    hidePaymentAlert();

    let paymentmethod = instance.$("input[type='radio']:checked").val();

    let clientId = parseInt(Session.get("clientId"));
    let tableName = Restaurant.getTableName(Session.get("floor"), Session.get("tableNumber"));

    beginSubmit(instance);
    Meteor.call("table/payment", clientId, tableName, paymentmethod, function (error, result) {
      uiEnd(instance);
      if(error){
        console.log("Error in call to table/open ", error);
        return handleRestaurantSubmitError(error);
      }else{
        if(!result.saved){
          return handleRestaurantSubmitError(result.error);
        }
        return;
      }
    });

  },
  "change .tablePayment": function(event, instance){
    //console.log("disabled ", $(event.currentTarget).attr("disabled"));
    instance.paymentMethodSelected.set(event.currentTarget.value);
  }
});
