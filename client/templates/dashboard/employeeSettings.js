import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { Session } from "meteor/session";
import { Shops } from "/lib/collections";
import { Reaction } from "/client/api";
import { Restaurant } from "../../../lib";
import { $ } from "meteor/jquery";


Template.employeeSettings.onCreated(function(){
  this.needUser = new ReactiveVar();
  this.autorun(() => {
    this.subscribe("ShopMembers");
    this.subscribe("UserClientId", null);
  });
});

Template.employeeSettings.onRendered(function(){
  let self = this;
  this.autorun(function(){
    let currlng = Session.get("language");
    const lng = Restaurant.select2.getLanguage(currlng);
    self.$(".js-user-clientid").select2({
      allowClear: true,
      language: lng
    });
    self.$(".js-shop-id").select2({
      language: lng
    });
    self.$(".js-user-type").select2({
      language: lng
    });
  });
});

Template.employeeSettings.helpers({
  getUsers: function(){
    let instance = Template.instance();
    if (instance.subscriptionsReady()) {
      return Meteor.users.find();
    }
  },
  getShopIds: function(){
    return Shops.find();
  },
  getShopDefaultName: function(){
    let instance = Template.instance();
    let shop = Shops.findOne();
    instance.currentShopid = shop._id;
    return shop.name;
  },
  needUser: function(){
    let ti = Template.instance();
    console.log("template instance ", ti);
    console.log("this ", this);
    if (ti.needUser.get() === "username" || ti.needUser.get() === "user type"){
      return true;
    }
    return false;
  },
  who: function(){
    let ti = Template.instance();
    return ti.needUser.get();
  }
});

Template.employeeSettings.events({
  "change .js-user-clientid": function(event, instance){
    let userid = $(event.currentTarget).val();
    console.log("change events on select2 ", userid);
    console.log("instance events on select2 ", instance);
    instance.currentUserid = userid;
    instance.needUser.set(false);
  },
  "change .js-shop-id": function(event, instance){
    let shopid = $(event.currentTarget).val();
    console.log("change events on select2 ", shopid);
    console.log("instance events on select2 ", instance);
    instance.currentShopid = shopid;
  },
  "change .js-user-type": function(event, instance){
    let userRole = $(event.currentTarget).val();
    console.log("change events on select2 ", userRole);
    console.log("instance events on select2 ", instance);
    instance.userrole = userRole;
    instance.needUser.set(false);
  },
  "change [data-event-action=toggleMemberPermission]": function (event, instance) {
    //console.log("$(event.currentTarget).is(:checked) ", $(event.currentTarget).is(":checked"));
    if($(event.currentTarget).is(":checked")){
      instance.remover = true;
    }else{
      instance.remover = false;
    }
  },/*
  "click a.shopName": function (event, instance) {
    let shopname = event.currentTarget.dataset.shopname;
    let shopid = event.currentTarget.dataset.shopid;
    instance.currentShopid = shopid;
    event.preventDefault();
    event.stopPropagation();
    instance.$("#shop").val(shopname);
    instance.$("#bt1").dropdown("toggle");
  },
  "click a.usersName": function (event, instance) {
    let username = event.currentTarget.dataset.username;
    let userid = event.currentTarget.dataset.userid;
    let clientid = event.currentTarget.dataset.clientid;
    instance.currentUserid = userid;
    event.preventDefault();
    event.stopPropagation();
    if (username)
      instance.$("#username").val(username);
    else
      instance.$("#username").val(clientid);
    instance.$("#bt2").dropdown("toggle");
    if (username !== ""){
      instance.needUser.set(false);
    }
  },
  "click a.usersRole": function (event, instance) {
    let userType = event.currentTarget.dataset.usertype;
    event.preventDefault();
    event.stopPropagation();
    instance.$("#userrole").val(userType);
    instance.$("#bt3").dropdown("toggle");
    if(userType !== ""){
       instance.needUser.set(false);
       let userRole = event.currentTarget.dataset.userrole;
       instance.userrole = userRole;
    }
  }*/
  "submit form": function(event, instance){
    event.preventDefault();
    event.stopPropagation();
    let username = instance.currentUserid;
    let userrole = instance.userrole;
    console.log("submiting userid ", username);
    console.log("submiting userType ", userrole);

    if (username === "" || username === undefined){
      instance.needUser.set("username");
      return false;
    }
    if(userrole === "" || userrole === undefined){
      instance.needUser.set("user type");
      return false;
    }
    console.log("event.target ", $(event.target.remover).is(":checked"));
    console.log("instance.remover ", instance.remover);

    if(instance.currentShopid === "" || instance.currentShopid === undefined)
      instance.currentShopid =  Reaction.getShopId();

    console.log("submiting shopid ", instance.currentShopid);

    instance.needUser.set(false);
    if(instance.remover === true){
      Meteor.call("accounts/removeUserPermissions", instance.currentUserid, userrole, instance.currentShopid);
      instance.remover = false;
    }else{
      Meteor.call("accounts/addUserPermissions", instance.currentUserid, userrole, instance.currentShopid);
    }

    instance.$(".js-user-clientid").val("").trigger("change");
    instance.$(".js-user-type").val("").trigger("change");
    $(event.target.remover).prop("checked", false);
  }
}
  /*"submit form": function(event, instance){
    event.preventDefault();
    event.stopPropagation();
    let permissions = [];
    let username = event.target.userName.value;
    let userType = event.target.userRole.value;

    let shop = event.target.shopid.value;
    console.log("submiting shopid ", instance.currentShopid);
    console.log("submiting userid ", instance.currentUserid);
    console.log("submiting userType ", userType);
    console.log("submiting userRole ", instance.userrole);
    permissions.push(instance.userrole);

    if (username === ""){
      instance.needUser.set("username");
      return false;
    }else if(userType === ""){
      instance.needUser.set("user type");
      return false;
    }
    console.log("event.target ", $(event.target.remover).is(":checked"));
    event.target.userName.value = "";
    event.target.userRole.value = "";
    instance.needUser.set(false);
    //Meteor.users.update({"_id":instance.currentUserid},{"$addToSet":{"roles." + instance.currentShopid: instance.userrole});
    if(instance.remover == true){
      Meteor.call("accounts/removeUserPermissions", instance.currentUserid, permissions, instance.currentShopid);
      instance.remover = false;
    }else{
      Meteor.call("accounts/addUserPermissions", instance.currentUserid, permissions, instance.currentShopid);
    }

    $(event.target.remover).prop("checked", false);
  }
}*/);
