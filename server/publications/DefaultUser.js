import { Reaction, Logger } from "/server/api";
import { Meteor } from "meteor/meteor";
import { Match } from 'meteor/check';




Meteor.publish("DefaultUser", function (userId) {
  check(userId, Match.Maybe(String));
  if (this.userId === null || this.userId !== userId) {
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
    let users = Roles.getUsersInRole("default/user", shopId);
    return users;
  }

  return this.ready();

});
