import { Meteor } from "meteor/meteor";
import { Accounts } from 'meteor/accounts-base'
import { Reaction, Hooks, Logger } from "/server/api";
import { merge, uniqWith } from "lodash";



if(Hooks){
  Hooks.Events.add("afterCreateDefaultAdminUser", () => {
    createDefaultUser();
    console.log("******************** afterCreateDefaultAdminUser createDefaultUser finish");
  });
};


const createDefaultUser = function() {
  Logger.info("Starting createDefaultUser");
  let options = {};
  const domain = Reaction.getRegistryDomain();
  let defaultUserRoles = ["default/user"];
  let accountId;

  const shopId = Reaction.getShopId();

  // if an admin user has already been created, we'll exit
  if (Roles.getUsersInRole(defaultUserRoles, shopId).count() !== 0) {
    Logger.info("Not creating default user, already exists");
    return ""; // this default user has already been created for this shop.
  }

  options = Hooks.Events.run("beforeCreateDefaultUser", options);

  // but we can override with provided `meteor --settings`
  if (Meteor.settings) {
    if (Meteor.settings.reaction) {
      options.username = Meteor.settings.reaction.DEFAULT_USER.REACTION_USER || "DefaultUser";
      options.password = Meteor.settings.reaction.DEFAULT_USER.REACTION_AUTH || Random.secret(8);
      options.email = Meteor.settings.reaction.DEFAULT_USER.REACTION_EMAIL || Random.id(8).toLowerCase() + "@" + domain;
      Logger.info("Using meteor --settings to create default user");
    }
  }


  // we're checking again to see if this user was created but not specifically for this shop.
  if (Meteor.users.find({
    "emails.address": options.email
  }).count() === 0) {
    accountId = Accounts.createUser(options);
  } else {
    // this should only occur when existing admin creates a new shop
    accountId = Meteor.users.findOne({
      "emails.address": options.email
    })._id;
  }

  // we dont need to validate admin user in development
  if (process.env.NODE_ENV === "development") {
    Meteor.users.update({
      "_id": accountId,
      "emails.address": options.email
    }, {
      $set: {
        "emails.$.verified": true
      }
    });
  } else { // send verification email to admin
    try {
      // if server is not confgured. Error in configuration
      // are caught, but admin isn't verified.
      Accounts.sendVerificationEmail(accountId);
    } catch (error) {
      Logger.warn(
        "Unable to send admin account verification email.", error);
    }
  }

  // we don't use accounts/addUserPermissions here because we may not yet have permissions
  //defaultUserRoles = defaultUserRoles.concat(["guest", 'product', 'tag', 'index', 'cart/checkout', 'cart/completed', 'reaction-social']);
  defaultUserRoles = defaultUserRoles.concat(["guest"]);
  Roles.setUserRoles(accountId, _.uniq(defaultUserRoles), shopId);
  // // the reaction owner has permissions to all sites by default
  //Roles.setUserRoles(accountId, _.uniq(defaultUserRoles), Roles.GLOBAL_GROUP);

  //
  //  notify user that default user was created account email should print on console
  //

  Logger.warn(
    `\n *********************************
      \n  IMPORTANT! DEFAULT USER INFO
      \n  EMAIL/LOGIN: ${options.email}
      \n  PASSWORD: ${options.password}
      \n ********************************* \n\n`
  );

  // run hooks on new user object
  const user = Meteor.users.findOne(accountId);
  Hooks.Events.run("afterCreateDefaultUser", user);
  return accountId;

}



export default {

  createDefaultUser: createDefaultUser

}
