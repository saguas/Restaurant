import { Template } from "meteor/templating";
import { Reaction, Logger } from "/client/api";
import { Restaurant, TableMap, ClientsTable } from "../../../lib";
import { Session } from "meteor/session";
import { ReactiveDict } from "meteor/reactive-dict";
import { ReactiveVar } from 'meteor/reactive-var';


const isNextKeyDisabled = function(name, clientId, tableName){
  if((name === "CLOSE" || name === "NEXT") && clientId){
    const shopId = Reaction.getShopId();
    return Restaurant.isClientsTableClosed(clientId, tableName, shopId);
  }
  return false;
}

setCurrentUserId = function(data){
  return function setUserId(userId){
    data._id = userId;
    Session.set("choosenUserId", userId);
  }
}

Template.restaurantOpenTable.onRendered(function () {
  console.log("restaurantOpenTable onRendered");
  //this.$(".tables.active").button('reset');
});

Template.restaurantOpenTable.onCreated(function () {
  this.getTableMap = Restaurant.getTableMap;
  this.isNextKeyDisabled = isNextKeyDisabled;
  //this.btnNextTxt = "OPEN";
  this.btnNextTxt = new ReactiveVar("OPEN");
  //this.btnNextTxtWithClientId = "CLOSE";
  this.btnNextTxtWithClientId = new ReactiveVar("CLOSE");
  this.btnNextTxtWithoutClientId = new ReactiveVar("OPEN");
  Session.setDefault("floor", "Home");


  //this.setUserId = setCurrentUserId(this.data);

  this.dict = new ReactiveDict();
  this.dict.setDefault({
    showBreadCrumbMenu: false,
    showTablesOrClient:true,
    showTables: false,
    breadCrumbMiddleMenu: [],
    currentFloor: undefined,
    tables: {tables:[]},
    tablesFloors: {tables:[]},
    btnClientId: 0,
    tablesFloor: false,
  });

  this.dict.setUserId = setCurrentUserId(this.data);

  //Session.set("choosenUserId", 0);
  //Logger.warn({tmplt:{curreData:this.data}});

  this.autorun(() => {
    //this.subscribe("TableMap");
    //if (this.subscriptionsReady() && Reaction.hasPermission(["employee/employee", "employee/master", "admin", "owner"]) ) {
    if (Reaction.hasPermission(["employee/employee", "employee/master", "admin", "owner"]) ) {
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
  });

  /*this.autorun(() => {
    this.clientId = this.dict.get("btnClientId");
    this.tableName = Restaurant.getTableName(Session.get("floor"), Session.get("tableNumber"));
    if(this.clientId){
      let tableName;
      tableName = Restaurant.getTableName(Session.get("floor"), Session.get("tableNumber"));
      this.subscribe("ClientsTable", this.clientId, tableName);
    }
  });*/

});


Template.restaurantOpenTable.helpers({
  showTablesOrClient: function(){
      const instance = Template.instance();
      let show = instance.dict.get("showTablesOrClient");
      return show;
  },
  showBreadcrumb: function(){
    const instance = Template.instance();
    return true;//instance.dict.get("showBreadCrumbMenu");
  },
  breadcrumbMiddleMenu: function(){
    const instance = Template.instance();
    return instance.dict.get("breadCrumbMiddleMenu");
  },
  currentId: function(){
    const instance = Template.instance();
    let choosenUser;
    //let clientId = instance.clientId;
    let clientId = instance.dict.get("btnClientId");
    let tableName = Restaurant.getTableName(Session.get("floor"), Session.get("tableNumber"));
    //if (instance.subscriptionsReady()){
    choosenUser = ClientsTable.findOne({
        tableNumber: tableName,
        status:{ $in: ["opened", "closed", "payment"]},
        $or:[{
          clients: {$in:[clientId]}
        },
        {
          masterClientNumber: clientId
        }]
    });

    if(choosenUser){
      return choosenUser._id;
    }
    //}
    return;
  },
  getDict: function(context){
    const instance = Template.instance();
    let data = context || {};
    //console.log("data getDict ", data);
    data.dict = instance.dict;
    //data.btnNextTxtId = instance.btnNextTxt.get();
    data.btnNextTxt = instance.btnNextTxt
    return data;
  }
});


Template.restaurantOpenTable.events({
  "click .breadcrumbMenu": function(event, instance){
    event.preventDefault();
    event.stopPropagation();
    console.log("breadcrumbName ", instance);
    let breadcrumbName = event.currentTarget.dataset.eventBreadcrumbmenuname;

    if(breadcrumbName === "Home"){
      instance.dict.set("showTablesOrClient", true);
      instance.dict.set("showBreadCrumbMenu", false);
      instance.dict.set("breadCrumbMiddleMenu",[]);
      instance.$(".floors.active").button('reset');
      instance.dict.set("btnClientId", 0);
      Restaurant.resetTables(instance.dict);

      return;
    }
    instance.$(".tables.active").button('reset');
    instance.$(".tables.active").removeClass("active");
    Session.set("floor", breadcrumbName);
    let breadcrumbId = event.currentTarget.dataset.eventBreadcrumbmenuid;
    let breadcrumbnewmenu = Restaurant.breadcrumbRemoveLast(instance.dict.get("breadCrumbMiddleMenu"));
    breadcrumbnewmenu = Restaurant.breadcrumbAddActive(breadcrumbName, breadcrumbnewmenu);
    instance.dict.set("breadCrumbMiddleMenu", breadcrumbnewmenu);

    console.log("breadcrumbId ", breadcrumbId);
    instance.dict.set("showTablesOrClient", true);
    instance.dict.set("currentFloor", breadcrumbName);
    instance.getTableMap(instance.dict, {_id: breadcrumbId});
    instance.dict.set("btnClientId", 0);
  }
});
