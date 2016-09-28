import { Reaction, Logger } from "/server/api";
import { Meteor } from "meteor/meteor";
import { Match } from 'meteor/check';
import { TableMap } from "../../lib";

/**
 * TableMap; Only employees or admin can see TablesMap
 */
Meteor.publish("TableMap", function () {
  console.log("in TableMap 0 ");
  if (this.userId === null) {
    return this.ready();
  }
  const shopId = Reaction.getShopId();
  if (!shopId) {
    return this.ready();
  }

  console.log("in TableMap 1 ");
  const permissions = ["admin", "employee/employee", "employee/master", "client/vip"];

  if (Roles.userIsInRole(this.userId,
    permissions, shopId ||
    Roles.userIsInRole(this.userId, permissions, Roles.GLOBAL_GROUP))) {
    console.log("in TableMap 2 ");
    return TableMap.find({shopId: shopId}, {sort:{order: 1}});
  }

  console.log("in TableMap 3 ");
  return this.ready();

});
