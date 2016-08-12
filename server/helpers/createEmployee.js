import { Meteor } from "meteor/meteor";
import { Accounts } from 'meteor/accounts-base'
import { Reaction, Hooks, Logger } from "/server/api";
import { Shops } from "/lib/collections";
import { merge, uniqWith } from "lodash";


export default {

  createEmployeeUser() {
    Logger.info("Starting createEmployee");
    let options = {};
    let employees = [];
    const domain = Reaction.getRegistryDomain();
    let defaultEmployeeRoles = ["employee/employee"];
    let accountId;

    const shopId = Reaction.getShopId();

    // if an admin user has already been created, we'll exit
    /*if (Roles.getUsersInRole(defaultUserRoles, shopId).count() !== 0) {
      Logger.info("Not creating default user, already exists");
      return ""; // this default user has already been created for this shop.
    }*/

    options = Hooks.Events.run("beforeCreateEmployees", options);

    // but we can override with provided `meteor --settings`
    if (Meteor.settings) {
      if (Meteor.settings.reaction) {
        employees = Meteor.settings.reaction.EMPLOYEES || [];
      }
    }

    if (options.employees){
      employees = employees.concat(options.employees);
      delete options.employees;
    }

    let count = 0;

    for(let employee of employees){
        options.username = employee.REACTION_USER || (count++ && `Employee${count}`);
        employee.REACTION_AUTH ? options.password = employee.REACTION_AUTH : undefined;
        options.email = employee.REACTION_EMAIL;

        if (!options.email){
          Logger.info(`Employee ${options.username} does not have email or password.`);
          continue;
        }
        // we're checking again to see if this user was created but not specifically for this shop.
        if (Meteor.users.find({
          "emails.address": options.email
        }).count() === 0) {
          accountId = Accounts.createUser(options);
        } else {
          Logger.info(`Employee ${options.username} email: ${options.email} already exist`);
          continue;
        }

        Logger.info(`Creating Employee ${options.username} email: ${options.email}`);

        // we dont need to validate admin user in development
        if (process.env.NODE_ENV === "development" && options.password) {
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
            if(!options.password){
              //Accounts.sendEnrollmentEmail(accountId);
              const currentUserName = "Admin";
              const shop = Shops.findOne(shopId);
              const token = Random.id();
              Meteor.users.update(accountId, {
                $set: {
                  "services.password.reset": {
                    token: token,
                    email: options.email,
                    when: new Date()
                  }
                }
              });
              SSR.compileTemplate("accounts/inviteShopMember", ReactionEmailTemplate("accounts/inviteShopMember"));
              try {
                Email.send({
                  to: options.email,
                  from: `${shop.name} <${shop.emails[0].address}>`,
                  subject: `You have been invited to join ${shop.name}`,
                  html: SSR.render("accounts/inviteShopMember", {
                    homepage: Meteor.absoluteUrl(),
                    shop: shop,
                    currentUserName: currentUserName,
                    invitedUserName: options.username,
                    url: Accounts.urls.enrollAccount(token)
                  })
                });
              } catch (_error) {
                throw new Meteor.Error(403, "Unable to send invitation email.");
              }
            }else{
              Accounts.sendVerificationEmail(accountId);
            }

          } catch (error) {
            Logger.warn(
              "Unable to send admin account verification email.", error);
          }
        }

        // we don't use accounts/addUserPermissions here because we may not yet have permissions
        //defaultUserRoles = defaultUserRoles.concat(["guest", 'product', 'tag', 'index', 'cart/checkout', 'cart/completed', 'reaction-social']);
        let type = defaultEmployeeRoles.pop();
        if(employee.TYPE == "master"){
          type = "employee/master";
        }

        let permissions =
        [
          'guest',
          'product',
          'tag',
          'index',
          'cart/checkout',
          'cart/completed',
          'reaction-social',
          "account/profile",
          "reaction-dashboard",
          "dashboard",
          "shopSettings",
          "reaction-orders",
          "orders",
          "dashboard/orders",
          "dashboard/pdf/orders",
          "open",
          type
        ];

        defaultEmployeeRoles = defaultEmployeeRoles.concat(permissions);
        Roles.setUserRoles(accountId, _.uniq(defaultEmployeeRoles), shopId);
        // // the reaction owner has permissions to all sites by default
        //Roles.setUserRoles(accountId, _.uniq(defaultEmployeeRoles), Roles.GLOBAL_GROUP);

        // run hooks on new user object
        const user = Meteor.users.findOne(accountId);
        Hooks.Events.run("afterCreateEmployees", user);
    };

    return;

  }
}
