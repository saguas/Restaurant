import { Reaction, Logger } from "/server/api";
import { Meteor } from "meteor/meteor";
import { Match } from 'meteor/check';
import { check } from 'meteor/check';
import { TableRequestMsg } from "../../lib";

Meteor.publish('TableRequestMsg', function(userId, clientId) {
  check(userId, String);
  check(clientId, Number);

  if (this.userId === null) {
    return this.ready();
  }
  const shopId = Reaction.getShopId();
  if (!shopId) {
    return this.ready();
  }
  let fromUser = Meteor.users.findOne({_id: this.userId});
  const permissions = ["admin"];//Admin can see all messages
  if (Roles.userIsInRole(this.userId,
    permissions, shopId ||
    Roles.userIsInRole(this.userId, permissions, Roles.GLOBAL_GROUP))) {
      return TableRequestMsg.find(
        {
          shopId: shopId
        }
      );
  }
  /*
  const clientPermissions = ["client/table", "client/vip"];
  if (clientId && Roles.userIsInRole(this.userId, clientPermissions, shopId)){*/
  //Logger.warn({obj:{fromId: fromUser.clientId}}, "publish TableRequestMsg fromId");
  return TableRequestMsg.find({
    shopId: shopId,
    //fromId: fromId,
    $or:[{
      toId: clientId,
    },
    {
      fromId: fromUser.clientId,
    }],
    status: { $in: ["new", "refused", "accepted", "timeout", "closed", "ignored"]}
  });
  /*}else{
    return this.ready();
  }*/
});
