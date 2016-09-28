import { Reaction, Logger } from "/server/api";
import { Meteor } from "meteor/meteor";
import { Match } from 'meteor/check';
import { RestaurantSettings } from "../../lib";





Meteor.publish("RestaurantSettings", function () {
  //check(clientId, Match.Maybe(Number));
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
      return RestaurantSettings.find(
        {
          shopId: shopId
        }
      );
  }


  return RestaurantSettings.find(
    {
      shopId: shopId
    },
    {
      fields: {"messenger.timeout": 1, "messenger.delivertime": 1}
    }
  );

});
