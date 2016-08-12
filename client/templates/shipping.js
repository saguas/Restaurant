import { Template } from "meteor/templating";


//get free shipping
/*function cartShippingFreeMethod(currentCart) {

  return _.find(currentCart, (m) => {
      if (m.method.name === "Free" && m.method.enabled == true)
        return true;
  });
}

// These helpers can be used in general shipping packages
// cartShippingMethods to get current shipment methods
// until we handle multiple methods, we just use the first
function cartShippingMethods(currentCart) {
  let cart = currentCart || ReactionCore.Collections.Cart.findOne();
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
  let cart = currentCart || ReactionCore.Collections.Cart.findOne();
  if (cart) {
    if (cart.shipping) {
      if (cart.shipping[0].shipmentMethod) {
        return cart.shipping[0].shipmentMethod;
      }
    }
  }
  return undefined;
}*/


Template.coreCheckoutShippingBeesknees.onCreated(function () {
  /* test code*/
  /*Session.setDefault("showTablesOrClient", true);
  Session.setDefault("showBreadCrumbMenu", false);
  Session.setDefault("showBreadCrumbMiddleMenu", []);
  Session.setDefault("tables", false);
  */
  /* end test*/

  /*this.autorun(() => {
    this.subscribe("Shipping");
  });*/

});

Template.coreCheckoutShippingBeesknees.onRendered(function () {
    //this.$("#myModal").modal();
    //this.$(".containers").bPopup();
});

Template.coreCheckoutShippingBeesknees.helpers({
  // retrieves current rates and updates shipping rates
  // in the users cart collection (historical, and prevents repeated rate lookup)
  /*shipmentQuotes: function () {
    const cart = ReactionCore.Collections.Cart.findOne();
    Restaurante.in18(Blaze.currentView);
    let shipping = cartShippingMethods(cart);
    this.method = shipping.method;
    return shipping
  },

  // helper to make sure there are some shipping providers
  shippingConfigured: function () {
    const instance = Template.instance();
    if (instance.subscriptionsReady()) {
      //return undefined;
      return ReactionCore.Collections.Shipping.find({
        "methods.enabled": true
      }).count();
    }
  },

  // helper to display currently selected shipmentMethod
  isSelected: function () {
    let self = this;
    let shipmentMethod = getShipmentMethod();
    // if there is already a selected method, set active
    if (_.isEqual(self.method, shipmentMethod)) {
      return "active";
    }
    return null;
  },
  vipPermissions: function(){
    return ["employee/employee", "client/vip"];
  },
  clientTable: function(){
    setShipmentMethod(this.method);
    return 4;
  },
  typeNumberFor: function(){
    if(ReactionCore.hasPermission(["employee/employee"])){
      return "Client";
    }else {
        return "Table";
    }
  }*//*,
  showTablesOrClient: function(){
      let show = Session.get("showTablesOrClient");
      return show;
  },
  showBreadcrumb: function(){
    return Session.get("showBreadCrumbMenu");
  },
  breadcrumbMiddleMenu: function(){
    return Session.get("showBreadCrumbMiddleMenu");
  }*/
});

/*function setShipmentMethod(method){
  let cart = ReactionCore.Collections.Cart.findOne();
  console.log("saveTable self.method ", method);
  if(cart.workflow.status !== "checkoutPayment"){
    try {
      Meteor.call("cart/setShipmentMethod", cart._id, method);
    } catch (error) {
      throw new Meteor.Error(error,
        "Cannot change methods while processing.");
    }
  }
}*/
//
// Set and store cart shipmentMethod
// this copies from shipmentMethods (retrieved rates)
// to shipmentMethod (selected rate)
//
Template.coreCheckoutShippingBeesknees.events({
  /*"click [data-event-action=tableNumberSet]": function (event, instance) {
    event.preventDefault();
    event.stopPropagation();
    //let data = event.currentTarget.dataset;
    setShipmentMethod(this.method);
  }*//*,
  "click .breadcrumbMenu": function(event, instance){
    event.preventDefault();
    event.stopPropagation();
    console.log("breadcrumbName ", instance);
    let breadcrumbName = event.currentTarget.dataset.eventBreadcrumbmenuname;
    if(breadcrumbName === "Home"){
      //todo set to home
      //remove tables buttons with getTableMap(instance);
      Session.set("showTablesOrClient", true);
      Session.set("showBreadCrumbMenu", false);
      Session.set("showBreadCrumbMiddleMenu",[]);
      resetTables();
      instance.$(".floors.active").removeClass("active");
      return;
    }
    let breadcrumbId = event.currentTarget.dataset.eventBreadcrumbmenuid;
    console.log("breadcrumbId ", breadcrumbId);
    //getTableMap(instance, {_id: breadcrumbId});
  }*/
});
