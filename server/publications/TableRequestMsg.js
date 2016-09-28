import { Reaction, Logger } from "/server/api";
import { Meteor } from "meteor/meteor";
import { Match } from 'meteor/check';
import { check } from 'meteor/check';
import { TableRequestMsg } from "../../lib";




Meteor.publish('TableRequestMsg', function(userId, clientId) {
  check(userId, String);
  check(clientId, Match.Maybe(Number));

  if (this.userId === null) {
    return this.ready();
  }
  const shopId = Reaction.getShopId();
  if (!shopId) {
    return this.ready();
  }
  let fromUser = Meteor.users.findOne({_id: this.userId});
  let permissions = ["admin"];//Admin can see all messages
  if (Roles.userIsInRole(this.userId,
    permissions, shopId ||
    Roles.userIsInRole(this.userId, permissions, Roles.GLOBAL_GROUP))) {
      return TableRequestMsg.find(
        {
          shopId: shopId
        }
      );
  }
  permissions = ["employee/employee", "employee/master"];//Admin can see all messages
  if (Roles.userIsInRole(this.userId,
    permissions, shopId ||
    Roles.userIsInRole(this.userId, permissions, Roles.GLOBAL_GROUP))) {
      return TableRequestMsg.find({
        shopId: shopId,
        pinned: true,
        delivered: false,
        status: { $in: ["new", "removed"]}
      });
  }
  /*
  const clientPermissions = ["client/table", "client/vip"];
  if (clientId && Roles.userIsInRole(this.userId, clientPermissions, shopId)){*/
  //Logger.warn({obj:{fromId: fromUser.clientId}}, "publish TableRequestMsg fromId");
  return TableRequestMsg.find({
    shopId: shopId,
    //fromId: fromId,
    delivered: false,
    $or:[{
      toClientId: clientId,
    },
    {
      fromClientId: fromUser.clientId,
    }],
    status: { $in: ["new", "removed"]}
  });
  /*}else{
    return this.ready();
  }*/
});
