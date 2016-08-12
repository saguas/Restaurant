import { Reaction, Logger } from "/server/api";
import { Meteor } from "meteor/meteor";
import { Match } from 'meteor/check';
import { ClientsTableHistory } from "../../lib";




/**
 * ClientsTableHistory
 */
Meteor.publish("ClientsTableHistory", function (clientId) {
  check(clientId, Number);
  if (this.userId === null) {
    return this.ready();
  }
  /*if (typeof userId === "string" && this.userId !== userId) {
    return this.ready();
  }*/
  const shopId = Reaction.getShopId();
  if (!shopId) {
    return this.ready();
  }

  //let clientId = Restaurant.getClientId(this.userId);
  const permissions = ["owner", "admin", "employee/employee", "employee/master"];
  if (Roles.userIsInRole(this.userId,
    permissions, shopId ||
    Roles.userIsInRole(this.userId, permissions, Roles.GLOBAL_GROUP))) {
    return ClientsTable.find(
      {
        shopId: shopId,
        status: "paid"
      }
    );
  }

  return ClientsTableHistory.find({
    shopId: shopId,
    userId: this.userId,
    masterClientNumber: clientId,
    status: "paid"
  });
});
