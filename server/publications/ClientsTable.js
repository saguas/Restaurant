import { Reaction, Logger } from "/server/api";
import { Meteor } from "meteor/meteor";
import { Match } from 'meteor/check';
import { ClientsTable } from "../../lib";



/**
 * ClientsTable
 */
Meteor.publish("ClientsTable", function (clientId) {
  check(clientId, Match.Maybe(Number));
  if (this.userId === null) {
    return this.ready();
  }
  const shopId = Reaction.getShopId();
  if (!shopId) {
    return this.ready();
  }

  const permissions = ["admin", "employee/employee", "employee/master"];
  if (Roles.userIsInRole(this.userId,
    permissions, shopId ||
    Roles.userIsInRole(this.userId, permissions, Roles.GLOBAL_GROUP))) {
      return ClientsTable.find(
        {
          shopId: shopId
        }
      );
  }
  const clientPermissions = ["client/table", "client/vip"];
  if (clientId && Roles.userIsInRole(this.userId, clientPermissions, shopId)){
    check(clientId, Number);

    return ClientsTable.find({
      shopId: shopId,
      userId: this.userId,
      masterClientNumber: clientId,
      status: { $in: ["opened", "closed", "payment"]}
    });
  }else{
    return this.ready();
  }
});


/*

Meteor.publish("ClientsTable", function (clientId, tableName) {
  check(clientId, Match.Maybe(Number));
  check(tableName, Match.Maybe(String));
  if (this.userId === null) {
    return this.ready();
  }
  const shopId = Reaction.getShopId();
  if (!shopId) {
    return this.ready();
  }

  //let clientId = Restaurant.getClientId(this.userId);
  const permissions = ["owner", "admin", "employee/employee", "employee/master"];
  if (Roles.userIsInRole(this.userId,
    permissions, shopId ||
    Roles.userIsInRole(this.userId, permissions, Roles.GLOBAL_GROUP))) {
      check(tableName, String);
      check(clientId, String);
      return ClientsTable.find(
        {
          shopId: shopId,
          tableNumber: tableName,
          status: { $in: ["opened", "closed", "payment"]},
          $or:[{
            clients: {$in:[clientId]}
          },
          {
            masterClientNumber: clientId
          }]
        }
      );
  }
  const clientPermissions = ["client/table", "client/vip"];
  if (Roles.userIsInRole(this.userId, clientPermissions, shopId)){
    check(clientId, Number);

    return ClientsTable.find({
      shopId: shopId,
      userId: this.userId,
      masterClientNumber: clientId,
      status: { $in: ["opened", "closed", "payment"]}
    });
  }else{
    return this.ready();
  }
});


*/
