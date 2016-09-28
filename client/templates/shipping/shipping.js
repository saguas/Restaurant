import _ from "lodash";
import { Cart, Shipping } from "/lib/collections";
import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { Session } from "meteor/session";
import { Blaze } from 'meteor/blaze';
import { ReactiveDict } from "meteor/reactive-dict";
import { Reaction, Logger } from "/client/api";
import { Restaurant, TableMap, ClientsTable } from "../../../lib";

//Template.tableCheckPermissions.inheritsHelpersFrom("coreCheckoutShippingBeesknees");
//Template.tableCheckPermissions.inheritsEventsFrom("coreCheckoutShippingBeesknees");


/*const initializeTables = function(m=5,n=5){
  let tables = [];
  for (var x=0; x < m; x++) {
    let rowTables = [];
    for (var y= 1 + n*x; y <= n + n*x; y++){
      rowTables.push({
        number:y,
        state: "danger"
      });
    }
    tables.push({tables:rowTables});
  }
  return tables;
}*/


function isNextKeyDisabled(name, clientId, tableName){

    function checkCheckoutPayment(){
      let cart = Cart.findOne();
      if(cart.workflow.status !== "checkoutPayment"){
        return false;
      }
      return true;
    }

    if((name === "CLOSE" || name === "NEXT") && clientId){
      const shopId = Reaction.getShopId();
      return Restaurant.isClientsTableClosed(clientId, tableName, shopId) || checkCheckoutPayment();
    }

    return checkCheckoutPayment();

}


//get free shipping
function cartShippingFreeMethod(currentCart) {

  return _.find(currentCart, (m) => {
      if (m.method.name === "Free" && m.method.enabled == true)
        return true;
  });
}

// These helpers can be used in general shipping packages
// cartShippingMethods to get current shipment methods
// until we handle multiple methods, we just use the first
function cartShippingMethods(currentCart) {
  let cart = currentCart || Cart.findOne();
  console.log("in tableCheckPermissions method cartShippingMethods ", cart);
  if (cart) {
    if (cart.shipping) {
      if (cart.shipping[0].shipmentQuotes) {
        let freeship = cartShippingFreeMethod(cart.shipping[0].shipmentQuotes);
        return freeship;
      }
    }
  }
  return undefined;
}
// getShipmentMethod to get current shipment method
// until we handle multiple methods, we just use the first
function getShipmentMethod(currentCart) {
  let cart = currentCart || Cart.findOne();
  if (cart) {
    if (cart.shipping) {
      if (cart.shipping[0].shipmentMethod) {
        return cart.shipping[0].shipmentMethod;
      }
    }
  }
  return undefined;
}

function setShipmentMethod(method){
  let cart = Cart.findOne();
  console.log("saveTable self.method ", method);
  if(cart.workflow.status !== "checkoutPayment"){
    try {
      Meteor.call("cart/setShipmentMethod", cart._id, method);
    } catch (error) {
      throw new Meteor.Error(error,
        "Cannot change methods while processing.");
    }
  }
}


Template.tableCheckPermissions.onCreated(function () {
  /* test code*/
  console.log("*****tableCheckPermissions.onCreated ", Template.parentData(4));
  //Session.setDefault("showTablesOrClient", true);
  //Session.setDefault("showBreadCrumbMenu", false);
  Session.setDefault("floor", "Home");
  /*this.method = {};
  this.getTableMap = getTableMap;
  this.setShipmentMethod = setShipmentMethod;
  this.showBreadCrumbMenu = new ReactiveVar(false);
  //Session.setDefault("showBreadCrumbMiddleMenu", []);
  //Session.setDefault("tables", false);
  this.showTablesOrClient = new ReactiveVar(true);
  this.showTables = new ReactiveVar(false);
  this.breadCrumbMiddleMenu = new ReactiveVar([]);
  this.currentFloor = new ReactiveVar();
  this.tables = new ReactiveVar({tables:[]});
  this.tablesFloors = new ReactiveVar({tables:[]});
  this.btnClientId = new ReactiveVar(0);*/
  this.getTableMap = Restaurant.getTableMap;
  this.setShipmentMethod = setShipmentMethod;
  this.isNextKeyDisabled = isNextKeyDisabled;
  //this.removedMsg = new ReactiveVar();
  //this.requestsPendents = new ReactiveVar([]);


  //Dictionary to share with shipping; tableChooser, clinetChooser
  this.dict = new ReactiveDict();
  this.dict.setDefault({
    method: {},
    showBreadCrumbMenu: false,
    showTablesOrClient:true,
    showTables: false,
    breadCrumbMiddleMenu: [],
    currentFloor: undefined,
    tables: {tables:[]},
    tablesFloors: {tables:[]},
    btnClientId: 0,
    tablesFloor: false
  });


  /*this.autorun(() => {
    if(Reaction.hasPermission(["client/table", "client/vip"]) && !Reaction.hasPermission(["employee/employee", "employee/master", "admin"])){
      const clientId = Meteor.user().clientId;
      console.log("subscibing ClientsTable ", clientId);
      if (clientId)
        this.subscribe("ClientsTable", parseInt(clientId));
    }
  });*/

  /*this.autorun(() => {
    this.clientId = this.dict.get("btnClientId");
    if(this.clientId){
      let tableName;
      tableName = Restaurant.getTableName(Session.get("floor"), Session.get("tableNumber"));
      this.subscribe("ClientsTable", this.clientId, tableName);
    }
  });*/


  this.autorun(() => {
    this.subscribe("Shipping");
    if (this.subscriptionsReady() && Reaction.hasPermission(["employee/employee", "employee/master", "admin"])) {
      Restaurant.prepareTableMap(this.dict);
      /*let countTables = this.getTableMap(this.dict);
      let tablesFloor = countTables > 1;
      this.dict.set("tablesFloor", tablesFloor);
      if(!Session.equals("floor", "Home")){
        this.getTableMap(this.dict, {name: Session.get("floor")});
      }
      if(!tablesFloor){
        //if only one floor set the name anyway.
        const tableMap = TableMap.findOne();
        Session.set("floor", tableMap.name);
        this.dict.set("showTables", true);
      }*/
    }
    /*console.log("subscribing clientId ", Meteor.user().clientId);
    let clientId = Meteor.user().clientId;
    if(clientId && ReactionCore.hasPermission(["client/table"])){
      this.subscribe("ClientsTable", clientId);
      if (this.subscriptionsReady()) {
        let table = ReactionCore.Collections.ClientsTable.findOne();
        if(table){
          let floor;
          let tableNumber;
          let tableNumberParts = table.tableNumber.split(":");
          if (tableNumberParts.length > 1){
            floor = tableNumberParts[0];
            tableNumber = tableNumberParts[1];
            Session.set("floor", floor);
          }else{
            tableNumber = tableNumberParts[0];
          }
          Session.set("tableNumber", tableNumber);
          Session.set("clientId", table.masterClientNumber);
        }
      }
    }*/
  });
  /* end test code*/
});



/*Template.tableCheckPermissions.onRendered(function () {
  if(this.subscriptionsReady()){
    this.$("#btn-shipping-processing").addClass("hidden");
  }else{
    this.$("#btn-shipping-processing").removeClass("hidden");
  }
});*/

Template.tableCheckPermissions.helpers({
  shipmentQuotes: function () {
    const instance = Template.instance();
    const cart = Cart.findOne();
    Restaurant.in18(Blaze.currentView);
    let shipping = cartShippingMethods(cart);
    if(shipping){
      instance.dict.set("method", shipping.method);
    }

    //instance.method = shipping.method;
    return shipping
  },

  // helper to make sure there are some shipping providers
  /*shippingConfigured: function () {
    const instance = Template.instance();
    console.log("in shippingConfigured ready subscribe shipping? ", instance.subscriptionsReady());
    if (instance.subscriptionsReady()) {
      //return undefined;
      const count = Shipping.find({
        "methods.enabled": true
      }).count();
      console.log("in shippingConfigured ", count);
      return count;
    }
  },*/

  // helper to display currently selected shipmentMethod
  isSelected: function () {
    //let self = this;
    const instance = Template.instance();
    let shipmentMethod = getShipmentMethod();
    // if there is already a selected method, set active
    let method = instance.dict.get("method");
    if (_.isEqual(method, shipmentMethod)) {
      return "active";
    }
    return null;
  },
  vipPermissions: function(){
    return ["employee/employee", "employee/master", "client/vip"];
  },
  clientTable: function(){
    const instance = Template.instance();
    let method = instance.dict.get("method");
    setShipmentMethod(method);
    return;
  },
  clientHasTable: function(){
    const instance = Template.instance();
    if (instance.subscriptionsReady()){
      const clientId = Meteor.user().clientId;
      const tables = ClientsTable.find({
          status:"opened",
          $or:[{
            clients: {$in:[clientId]}
          },
          {
            masterClientNumber: clientId
          }]
      }).count();
      console.log("tables is ", tables);
      if(Reaction.hasPermission(["client/table"]) && tables){
        return true;
      }
    }
    return false;
  },
  typeNumberFor: function(){
    if(Reaction.hasPermission(["employee/employee"])){
      return "Client";
    }else {
        return "Table";
    }
  },
  showTablesOrClient: function(){
      const instance = Template.instance();
      let show = instance.dict.get("showTablesOrClient");//instance.showTablesOrClient.get();//Session.get("showTablesOrClient");
      return show;
  },
  showBreadcrumb: function(){
    const instance = Template.instance();
    //return instance.showBreadCrumbMenu.get();//Session.get("showBreadCrumbMenu");
    return true;//instance.dict.get("showBreadCrumbMenu");
  },
  breadcrumbMiddleMenu: function(){
    const instance = Template.instance();
    //return instance.breadCrumbMiddleMenu.get();//Session.get("showBreadCrumbMiddleMenu");
    return instance.dict.get("breadCrumbMiddleMenu");
  }
});

/*
const removeRequest = function(doc){
  const fromClientId = doc.fromClientId;
  const toClientId = doc.toClientId;

  Meteor.call("table/removeClientTablePermission", fromClientId, "", toClientId, function (error, result) {
    if(error){
      console.log("Error in call to table/removeClientTablePermission ", error);
      //TODO: aqui remover a entrada no clientsTable
      return ;
    }
  });
}*/

/*
const registerEmmiterOnce = function(msgid, fromClientId, toClientId, instance){

  Restaurant.emmiter.once(`${msgid}`, function(doc){
    const msgs = TableRequestMsg.findOne({_id: doc.responseToMsgId, status: "removed"});
    if(msgs && doc.reason === "accepted"){
      removeRequest(msgs);
      Restaurant.Messenger.upadateTableRequestDelivered(doc._id);
    }else{
      Restaurant.Messenger.processRequestNotDelivered(doc, fromClientId);
    }
    Restaurant.Messenger.upadateTableRequestDelivered(doc.responseToMsgId);
  });

};*/


Template.tableCheckPermissions.events({
  "click [data-event-action=tableNumberSet]": function (event, instance) {
    event.preventDefault();
    event.stopPropagation();
    //let data = event.currentTarget.dataset;
    //setShipmentMethod(instance.method);
    setShipmentMethod(instance.dict.get("method"));
  },
  "click .breadcrumbMenu": function(event, instance){
    event.preventDefault();
    event.stopPropagation();
    console.log("breadcrumbName ", instance);
    let breadcrumbName = event.currentTarget.dataset.eventBreadcrumbmenuname;
    if(breadcrumbName === "Home"){
      //todo set to home
      //remove tables buttons with getTableMap(instance);
      //Session.set("showTablesOrClient", true);

      //instance.showTablesOrClient.set(true);
      instance.dict.set("showTablesOrClient", true);

      //Session.set("showBreadCrumbMenu", false);

      //instance.showBreadCrumbMenu.set(false);
      instance.dict.set("showBreadCrumbMenu", false);

      //Session.set("showBreadCrumbMiddleMenu",[]);

      //instance.breadCrumbMiddleMenu.set([]);
      instance.dict.set("breadCrumbMiddleMenu",[]);

      //instance.$(".floors.active").button('reset');
      $(".btn-group.tables").removeClass("active").end().find('[type="radio"][data-event-floor="true"]').prop('checked', false);
      //instance.$(".floors.active").removeClass("active");
      Restaurant.resetTables(instance.dict);

      return;
    }
    Session.set("floor", breadcrumbName);
    let breadcrumbId = event.currentTarget.dataset.eventBreadcrumbmenuid;
    //let breadcrumbnewmenu = breadcrumbRemoveLast(Session.get("showBreadCrumbMiddleMenu"));

    //let breadcrumbnewmenu = breadcrumbRemoveLast(instance.breadCrumbMiddleMenu.get());
    let breadcrumbnewmenu = Restaurant.breadcrumbRemoveLast(instance.dict.get("breadCrumbMiddleMenu"));

    //Session.set("showBreadCrumbMiddleMenu", breadcrumbnewmenu);
    breadcrumbnewmenu = Restaurant.breadcrumbAddActive(breadcrumbName, breadcrumbnewmenu);

    //instance.breadCrumbMiddleMenu.set(breadcrumbnewmenu);
    instance.dict.set("breadCrumbMiddleMenu", breadcrumbnewmenu);

    console.log("breadcrumbId ", breadcrumbId);
    //Session.set("showTablesOrClient", true);

    //instance.showTablesOrClient.set(true);
    instance.dict.set("showTablesOrClient", true);

    //instance.currentFloor.set(breadcrumbName);
    instance.dict.set("currentFloor", breadcrumbName);

    //instance.$(".floors [data-event-tablename='" + breadcrumbName + "']").parent().addClass("active");
    instance.getTableMap(instance.dict, {_id: breadcrumbId});
    //console.log("parent element  ",$(".floors > [data-event-tablename='" + breadcrumbName + "']"));
  }
});

/*

Template.TableChooser.onCreated(function () {
    console.log("Template.TableChooser.onCreated ");
    this.tables = new ReactiveVar([]);
    this.autorun(() => {
      this.subscribe("TableMap");
    });
});



Template.TableChooser.helpers({
  getNumberOfRowsInTable: function(){
    const instance = Template.instance();
    if (instance.subscriptionsReady()) {
      const tableMap = ReactionCore.Collections.TableMap.find();
      if(tableMap.count > 1){
        return tableMap;
      }
      return tableMap.fetch().tables;
      //return initializeTables();
    }
  }
});




Template.ButtonTable.onRendered(function () {
    console.log("Template.ButtonTable.onRendered ");
});

*/
