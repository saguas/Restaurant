import { Meteor } from "meteor/meteor";
import { check, Match } from "meteor/check";
import { Reaction, Logger } from "/server/api";
import { Cart } from "/lib/collections";
import { ClientsTable, ClientsTableHistory } from "/imports/plugins/custom/beesknees/lib";
import { Restaurant } from "../";




const getErrorResult = function(error){
  Logger.warn(error);
  return result = {
    saved: false,
    error: error
  };
}



Meteor.methods({
  "table/addClientTablePermission": function (clientId, tableName) {
    check(clientId, Number);
    check(tableName, String);

    const shopId = Reaction.getShopId();

    ClientsTable.update({userId: this.userId, tableNumber: tableName, shopId: shopId}, {$addToSet:{clients: clientId}});
    const userId = Restaurant.getUserIdFromClientId(clientId);
    const permissions = ["admin", "employee/employee", "employee/master"];
    if(!Roles.userIsInRole(userId, permissions, shopId)){
      Restaurant.setClientPermissions(userId, ["client/table"], shopId);
    }

    result = {
      saved: true,
      status: "updated",
      userId: this.userId
    };

    return result;

  },
  /**
   * Submit a open table
   * @param  {Number} ClientId
   * @param  {String} tableName
   */
  "table/open": function (clientId, tableName) {
    check(clientId, Number);
    check(tableName, String);
    //check(clientCartId, Match.Optional(String));

    let cartId;
    let userId;
    let id;
    const shopId = Reaction.getShopId();

    /*if(clientCartId){
        const cart = Cart.findOne({
            userId:this.userId,
            shopId: shopId,
        });
        if(cart && cart._id === clientCartId){
          cartId = cart._id;
        }else{
          //throw new Meteor.Error("Cart: cartId Error.", "No Cart found.");
          let error = "No Cart found.";
          return getErrorResult(error);
        }
    }*/

    if(Reaction.hasPermission(["employee/employee", "employee/master", "admin", "owner"])){
      let cartData = {
        clientId: clientId,
        tableName: tableName
      };

      let data = {
        shopId: shopId,
        cartData: cartData,
        ownerUserId: this.userId,
        cartId: cartId
      };
      try {
        id = Restaurant.openClientsTable(data);
      } catch(err){
        return getErrorResult(err);
      }

      /*try {
        userId = Restaurant.getUserIdFromClientId(clientId);
        Restaurant.setClientPermissions(userId, ["client/table"], shopId);
      } catch(err){
        let error = `There is no client with this number ${clientId}.`;
        console.log(error);
        return getErrorResult(error);
      }

      //console.log("table/open tableName ", tableName, userId, cartId);
      id = Restaurant.insertOnClientsTable(this.userId, userId, cartId, clientId, tableName);

      let tableParts = tableName.split(":");
      let floor = tableParts[0];
      let tableNumber = tableParts[1];

      Restaurant.setTableMapOccupation(floor, tableNumber, clientId);*/

      result = {
        saved: true,
        status: "created",
        docInsertedId: id
      };

      return result;
    }

    let error = "User does not have permissions to open a table.";
    return getErrorResult(error);
  },

  /**
   * Submit a close table
   * @param  {Number} ClientId
   * @param  {String} tableName
   */
  "table/close": function (clientId, tableName) {
    check(clientId, Number);
    check(tableName, String);

    let cartId;
    let id;
    const shopId = Reaction.getShopId();
    /*const cart = Cart.findOne({
        userId:this.userId,
        shopId: shopId,
    });
    if(cart){
      cartId = cart._id;
    }else{
      //throw new Meteor.Error("Cart: cartId Error.", "No Cart found.");
      let error = "No Cart found.";
      return getErrorResult(error);
    }*/

    const status = "closed";
    const workflowStatus = "tableReview";
    const workflow = "tableOpened";
    //let obj = Meteor.wrapAsync(Restaurant.doClientsTableUpdateWorkflow)(ClientsTable, tableName, clientId, shopId, status, workflowStatus, workflow);
    let obj = Restaurant.doClientsTableUpdateWorkflow(ClientsTable, tableName, clientId, shopId, status, workflowStatus, workflow);
    console.log("ClientId and tableName ", clientId, tableName);
    console.log("object returned by update workflow ", obj);
    Logger.warn({obj: obj}, "object returned by update workflow");

    Restaurant.resetCartWorkflowTo(clientId);

    let tableParts = tableName.split(":");
    let floor = tableParts[0];
    let tableNumber = tableParts[1];

    let state = "info";
    Restaurant.setTableMapOccupation(floor, tableNumber, clientId, state);

    result = {
      saved: true,
      status: "created"
    };

    return result;

  },
  "table/payment": function (clientId, tableName, paymentMethod) {
    check(clientId, Number);
    check(tableName, String);
    check(paymentMethod, String);

    const shopId = Reaction.getShopId();

    const status = "payment";
    const workflowStatus = "tablePayment";
    const workflow = "tableReview";

    Restaurant.doClientsTableUpdateWorkflow(ClientsTable, tableName, clientId, shopId, status, workflowStatus, workflow, paymentMethod);

    let tableParts = tableName.split(":");
    let floor = tableParts[0];
    let tableNumber = tableParts[1];

    let state = "warning";
    Restaurant.setTableMapOccupation(floor, tableNumber, clientId, state);

    result = {
      saved: true,
      status: "created"
    };

    return result;

  },
  "table/paid-invoices": function (clientId, tableName, invoice) {
    check(clientId, Number);
    check(tableName, String);
    check(invoice, {
      nif: Match.Optional(String),
      simpleInvoice: Match.Optional(Boolean)
    });

    const shopId = Reaction.getShopId();

    const status = "paid";
    const workflowStatus = "tablePayment";
    const workflow = "tablePayment";

    //Meteor.wrapAsync(Restaurant.doClientsTableCopyTo)(ClientsTable, "ClientsTableHistory", tableName, clientId, shopId, status, workflowStatus, workflow);
    Restaurant.doClientsTableFindAndCopyTo(ClientsTable, ClientsTableHistory, tableName, clientId, shopId);
    Restaurant.doClientsTableUpdateWorkflow(ClientsTableHistory, tableName, clientId, shopId, status, workflowStatus, workflow);

    /*if(isLastClientTable(clientId)){
      const userId = RestaurantLib.getUserIdFromClientId(clientId);
      Restaurant.removeClientPermissions(userId, ["client/table"], shopId);
    }*/
    Restaurant.removePermissionsForClientLastTable(ClientsTable, tableName, clientId, shopId);

    Restaurant.removeClientsTable(ClientsTable, tableName, clientId, shopId);

    //Restaurant.resetCartWorkflowTo(clientId);

    const tableParts = tableName.split(":");
    const floor = tableParts[0];
    const tableNumber = tableParts[1];

    const state = "success";
    Restaurant.setTableMapOccupation(floor, tableNumber, clientId, state);

    Restaurant.removeClientFromTable(floor, tableNumber, clientId);

    result = {
      saved: true,
      status: "paid"
    };

    return result;

  }

});
