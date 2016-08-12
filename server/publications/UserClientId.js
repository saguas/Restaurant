import { Reaction, Logger } from "/server/api";
import { Meteor } from "meteor/meteor";
import { Match } from 'meteor/check';


/**
 * userClientId
 * publixh clientId
 * get any user name,social profile image
 * should be limited, secure information
 * users with permissions  ["dashboard/orders", "owner", "admin", "dashboard/
 * customers"] may view the profileUserId"s profile data.
 *
 * @params {String} profileUserId -  view this users profile when permitted
 */

Meteor.publish("UserClientId", function (profileUserId) {
    check(profileUserId, Match.OneOf(String, null));
    if (this.userId === null) {
      return this.ready();
    }
    const shopId = Reaction.getShopId();
    if (!shopId) {
      return this.ready();
    }
    const permissions = ["dashboard/orders", "owner", "admin",
      "dashboard/customers"];
    // no need to normal user so see his password hash
    const fields = {
      "clientId":1
    };

    if (profileUserId === null && Roles.userIsInRole(this.userId,
      permissions, shopId ||
      Roles.userIsInRole(this.userId, permissions, Roles.GLOBAL_GROUP))) {
      return Meteor.users.find({},
        {
          fields: fields
        });
    }

    if (profileUserId !== this.userId && Roles.userIsInRole(this.userId,
      permissions, shopId ||
      Roles.userIsInRole(this.userId, permissions, Roles.GLOBAL_GROUP))) {
      return Meteor.users.find({
        _id: profileUserId
      }, {
        fields: fields
      });
    }

    return Meteor.users.find({
      _id: this.userId
    }, {
      fields: fields
    });
});
