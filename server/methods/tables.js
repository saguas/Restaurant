import { Meteor } from "meteor/meteor";
import { check, Match } from "meteor/check";
import { Reaction, Logger } from "/server/api";
import { Cart } from "/lib/collections";
import { ClientsTable, ClientsTableHistory, TableRequestMsg } from "/imports/plugins/custom/beesknees/lib";
import { Restaurant } from "../";




const getErrorResult = function(error){
  Logger.warn(error);
  return result = {
    saved: false,
    error: error
  };
}



Meteor.methods({
  "table/removeClientTablePermission": function (clientId, tableName, toClientId) {
    check(clientId, Number);
    check(tableName, Match.Maybe(String));
    check(toClientId, Match.Maybe(Number));

    const shopId = Reaction.getShopId();

    const clientUserId = Restaurant.getUserIdFromClientId(clientId);
    const toClientUserId = Restaurant.getUserIdFromClientId(toClientId);

    const permissions = ["admin", "employee/employee", "employee/master"];
    //only can remove the clients involve and the master client and any employee and admin
    if(!Roles.userIsInRole(this.userId, permissions, shopId) && clientUserId !== this.userId && toClientUserId !== this.userId){
      //if(clientUserId !== this.userId && toClientId !== this.userId){
      const error = "User does not have permissions to remove from a table.";
      return getErrorResult(error);
      //}
    };

    console.log("tableName in removeClientTablePermission ", tableName);
    /*if(!tableName){
      const clientsTable = ClientsTable.findOne({
          status:{ $in: ["opened"]},
          $or:[{
            clients: {$in:[clientId]}
          },
          {
            masterClientNumber: toClientId
          }]
        });
      if(clientsTable){
        tableName = clientsTable.tableNumber;
      }else{
        const error = `User ${clientId} does not have a table.`;
        return getErrorResult(error);
      }

      //Restaurant.removePermissionsForClientAdded(ClientsTable, tableName, toClientId, clientId, shopId);
    }*/

    Restaurant.removePermissionsForClientAdded(tableName, clientId, shopId);
    Restaurant.removeClientFromMongoCliensTable(tableName, toClientId, clientId, shopId);
    //Restaurant.removeClientsTable(ClientsTable, tableName, clientId, shopId);

    /*const tableParts = tableName.split(":");
    const floor = tableParts[0];
    const tableNumber = tableParts[1];*/

    //Restaurant.removeClientPermissions(userId, ["client/table", `${tableParts[0]}/${tableParts[1]}`], shopId);

    //Restaurant.removeClientFromTable(floor, tableNumber, clientId);

    return  {
      saved: true,
      status: "updated",
      userId: this.userId
    };

  },
  "table/addClientTablePermission": function (clientId, tableName) {
    check(clientId, Number);
    check(tableName, String);

    const shopId = Reaction.getShopId();
    const permissions = ["admin", "employee/employee", "employee/master"];
    let update = 0;

    if(Roles.userIsInRole(this.userId, permissions, shopId)){
      update = ClientsTable.update({tableNumber: tableName, shopId: shopId}, {$addToSet:{clients: clientId}});
    }else{
      //only update if clientId is for master client. Any other client can't update.
      update = ClientsTable.update({userId: this.userId, tableNumber: tableName, shopId: shopId}, {$addToSet:{clients: clientId}});
    }
    if(update){
        const clientUserId = Restaurant.getUserIdFromClientId(clientId);
        if(!Roles.userIsInRole(clientUserId, permissions, shopId)){
          const tableParts = tableName.split(":");
          Restaurant.setClientPermissions(clientUserId, ["client/table", `${tableParts[0]}/${tableParts[1]}`], shopId);
        }
        return  {
          saved: true,
          status: "updated",
          tableName: tableName,
          userId: this.userId
        };

    };
    return  {
      saved: false,
      status: "error",
      tableName: tableName,
      userId: this.userId
    };


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

    if(Reaction.hasPermission(["employee/employee", "employee/master", "admin"])){
      let cartData = {
        clientId: clientId,
        tableName: tableName
      };

      let data = {
        shopId: shopId,
        cartData: cartData,
        ownerUserId: this.userId,
        creatorCid: Meteor.user().clientId,
        masterName: Meteor.users.findOne({clientId: clientId}).username,
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

    const error = "User does not have permissions to open a table.";
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
    if(!Reaction.hasPermission(["employee/employee", "employee/master", "admin"])){
      const error = "User does not have permissions to close a table.";
      return getErrorResult(error);
    }
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

    if(!Reaction.hasPermission(["employee/employee", "employee/master", "admin"])){
      const error = "User does not have permissions to payment a table.";
      return getErrorResult(error);
    }

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

    if(!Reaction.hasPermission(["employee/employee", "employee/master", "admin"])){
      const error = "User does not have permissions to paid-invoices for a table.";
      return getErrorResult(error);
    }

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

    //TODO: colocar delivered em todas as mensagens referentes ao utilizador master.
    TableRequestMsg.update({$or:[{fromClientId: clientId}, {toClientId: clientId}]}, {$set:{delivered: true, pinned: false}}, {multi:true});

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
