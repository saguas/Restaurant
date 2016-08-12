import { Template } from "meteor/templating";
import { Reaction, Logger } from "/client/api";
import { Restaurant, ClientsTable } from "../../../lib";
import { Session } from "meteor/session";
//import { ReactiveDict } from "meteor/reactive-dict";
import { ReactiveVar } from 'meteor/reactive-var';


const beginSubmit = function (instance) {
  return instance.$("#btn-processing-invoice").removeClass("hidden");
};

const uiEnd = function (template) {
  return template.$("#btn-processing-invoice").addClass("hidden");
};

const paymentAlert = function (errorMessage) {
  return $("#invoiceError").removeClass("hidden").text(errorMessage);
};

const hidePaymentAlert = function () {
  return $("#invoiceError").addClass("hidden").text("");
};

const handleRestaurantSubmitError = function (error) {
  let serverError = error !== null ? error.message : void 0;
  if (serverError) {
    return paymentAlert("Oops! " + serverError);
  } else if (error) {
    return paymentAlert("Oops! " + error);
  }
};

Template.tablePayment.onCreated(function () {
  //let parent = this.parent(4);
  //console.log("parent ", parent);
  //console.log("this ", this);
  //this.btnNextTxt = parent.btnNextTxt;
  //console.log("btnNextTxt ", this.btnNextTxt);
  const currData = Template.currentData();
  this.dict = currData.dict;
  this.btnNextTxt = currData.btnNextTxt;
  this.nif = new ReactiveVar("0");
  this.simpleInvoice = new ReactiveVar(true);
  this.hideSimpleInvoice = new ReactiveVar(false);
});

Template.tablePayment.onDestroyed(function(){
  hidePaymentAlert();
});


Template.tablePayment.helpers({
  isDisabledSimpleInvoice: function(){
    const instance = Template.instance();
    return instance.hideSimpleInvoice.get();
  },
  isDisabledInvoice: function(){
    const instance = Template.instance();
    return instance.simpleInvoice.get();
  },
  isDisabled: function(){
    /*const shopId = Reaction.getShopId();
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
    return;*/
    return false;
  }
});


Template.tablePayment.events({
  "click #paid_emit_invoice": function(event, instance){
    event.preventDefault();
    event.stopPropagation();

    hidePaymentAlert();

    let clientId = parseInt(Session.get("clientId"));
    let tableName = Restaurant.getTableName(Session.get("floor"), Session.get("tableNumber"));

    beginSubmit(instance);
    const invoice = {
        nif: instance.nif.get(),
        simpleInvoice: instance.simpleInvoice.get()
    };

    console.log("before call table/paid-invoices set to open");

    Meteor.call("table/paid-invoices", clientId, tableName, invoice, function (error, result) {
      uiEnd(instance);
      if(error){
        console.log("Error in call to table/open ", error);
        return handleRestaurantSubmitError(error);
      }else{
        if(!result.saved){
          return handleRestaurantSubmitError(result.error);
        }
        instance.dict.set("clientNumber", "0");
        instance.dict.set("btnClientId", 0);
        instance.btnNextTxt.set("OPEN");
        return;
      }
    });
  },
  "change #nif": function(event, instance){
    let nif = instance.$(event.currentTarget).val();
    console.log("change nif ", nif);
    if(nif && !Restaurant.validateNif(nif)){
      handleRestaurantSubmitError(`Vat number ${nif} is not valid.`);
      instance.$(event.currentTarget).val("");
      return;
    }else if(nif){
      instance.nif.set(nif);
      instance.simpleInvoice.set(false);
      instance.hideSimpleInvoice.set(true);
      return;
    }

    instance.hideSimpleInvoice.set(false);

  },
  "change [data-event-action=simpleInvoice]": function(event, instance){
    let isSimpleInvoiceChecked = instance.$(event.currentTarget).is(":checked");
    instance.simpleInvoice.set(isSimpleInvoiceChecked);

  }

});
