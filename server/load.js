import { Reaction, Logger, Hooks } from "/server/api";
import { Roles } from "meteor/alanning:roles";
import { Packages } from "/lib/collections";
import { Restaurant, DefaultUser, EmployeeUser } from ".";


/**
 * Hook to setup core additional imports during ReactionCore init (shops process first)
 */
if (Hooks) {
  /*Hooks.Events.add("onCoreInit", () => {
    Logger.info("Initialize using Bees Knees Data");
    Reaction.Import.fixture().process(Assets.getText("custom/data/Shops.json"), ["name"], Reaction.Import.shop);
    // ensure Shops are loaded first.
    Reaction.Import.flush(Shops);
    // these will flush/import with the rest of the imports from core init.
    Reaction.Import.fixture().process(Assets.getText("custom/data/Products.json"), ["title"], Reaction.Import.load);
    Reaction.Import.fixture().process(Assets.getText("custom/data/Tags.json"), ["name"], Reaction.Import.load);
    //Reaction.Import.fixture().process(Assets.getText("custom/data/Shipping.json"), ["name"], Reaction.Import.load);
    Reaction.Import.flush();
  });*/


  /*Hooks.Events.add("afterCreateDefaultAdminUser", () => {
    DefaultUser.createDefaultUser();
    console.log("******************** afterCreateDefaultAdminUser createDefaultUser finish");
  });*/

  Hooks.Events.add("afterCoreInit", () => {
    //modifyCheckoutWorkflow();
    //DefaultUser called here to be sure!!!
    DefaultUser.createDefaultUser();
    EmployeeUser.createEmployeeUser();
    modifyRoutesLayouts();
    //setTables();
  });

  Hooks.Events.add("onLogin", (opts) => {
    //console.log("opts: ", opts);
    console.log("sessionId: ", Reaction.sessionId);
    let group = Reaction.getShopId();
    console.log("onLogin shopId: ", group);
    console.log("Roles.userIsInRole ", Roles.userIsInRole(opts.user._id, ["cart/checkout", "table/request"], group));
    console.log("Roles.userIsInRole ", Reaction.hasPermission(["table/request"], opts.user._id, group));
    //opts.user.roles[group].push("client/table");
    console.log("onLogin userId: ", opts.user.roles);
    //adicionar um item às regras
    //Meteor.users.update({"_id":this.userId},{"$addToSet":{"roles.J8Bhq3uTtdgwZx3rz":"client/table"}})
    //if(opts.services && opts.services.anonymous !== true)
      //Roles.addUsersToRoles(opts.user._id, ["client/table"], group);
    //remover um item das regras
    //Meteor.users.update({"_id":opts.user._id},{"$pull":{"roles.J8Bhq3uTtdgwZx3rz":"client/table"}})

    //insert ClientsTable
    //ReactionCore.Collections.ClientsTable.insert({userId:opts.user._id, shopId:group,firstClientNumber:"102", clients:["102"], tableNumber:"4", status:"open"});
    return opts;
  });

  /*Hooks.Events.add("onCreateUser", (user, options) => {
    let group = Reaction.getShopId();
    console.log("onCreateUser options: ", options);
    console.log("onCreateUser shopId: ", group);
    //console.log("onCreateUser user: ", user);
    //Meteor.users.update({"_id":this.userId},{"$set":{"clientId":103}})
    if(options.services && options.services.anonymous === true)
      return user;

    user.clientId = nextAutoincrement(ClientCounters);//getNextSequence("clientid");
    console.log("onCreateUser clientId ", user.clientId);
      //user.clientId = 104;
    return user;
  });*/



  //Os dados dos Packages podem ser alterados no reaction/private/settings/reaction.json;
  //OU podem ser alterados no evento onImportPackages;
  //OU podem ser alterados diretamente na BD.
  //pode ser usado para alterar os dados dos pacotes
  /*ReactionCore.Hooks.Events.add("onImportPackages", (object) => {
    //if(object !== undefined)
      ReactionCore.Log.info("Object imported ", object.name);
      ReactionCore.Log.info("Object imported ", object.layout);
      return object;
  });*/

}

function modifycoreCheckoutShipping() {
  Packages.update({
    "name": "reaction-checkout",
    "layout": {
      "$elemMatch": {
        "template": "coreCheckoutShipping"
      }
    }
  }, {
    "$set": {
      "layout.$.template": "coreCheckoutShippingBeesknees",
      "layout.$.label": "Table Check Permissions"
    }
  });
}

function modifyTagsRoutesLayouts() {
  Packages.update({
    "name": "reaction-product-variant",
    "registry": {
      "$elemMatch": {
        "name" : "tag"
      }
    }
  }, {
    "$set": {
      "registry.$.template": "productsLanding",
      "registry.$.layout": "coreLayoutBeesknees",
      "registry.$.workflow" : "coreProductWorkflow"
    }
  });
}

function modifyProductVariantRoutesLayouts() {
  Packages.update({
    "name": "reaction-product-variant",
    "registry": {
      "$elemMatch": {
        "name" : "product"
      }
    }
  }, {
    "$set": {
      "registry.$.template": "productDetailBeesknees",
      "registry.$.layout": "coreLayoutBeesknees",
      "registry.$.workflow" : "coreProductWorkflow"
    }
  });
}

function modifyDashboardRoutesLayouts() {
  Packages.update({
    "name": "reaction-dashboard",
    "registry": {
      "$elemMatch": {
        "name" : "dashboard"
      }
    }
  }, {
    "$set": {
      "registry.$.layout": "coreLayoutBeesknees"
    }
  });

  Packages.update({
    "name": "reaction-dashboard",
    "layout": {
      "$elemMatch": {
        "layout": "coreLayout"
      }
    }
  }, {
    "$set": {
      "layout.$.layout": "coreLayoutBeesknees"
    }
  });

}

function modifyCheckoutRoutesLayouts() {
  Packages.update({
    "name": "reaction-checkout",
    "registry": {
      "$elemMatch": {
        "name" : "cart/checkout"
      }
    }
  }, {
    "$set": {
      "registry.$.layout": "coreLayoutBeesknees",
      //"registry.$.workflow" : "coreWorkflow"
      "registry.$.workflow" : "coreCartWorkflow"
    }
  });

  Packages.update({
    "name": "reaction-checkout",
    "layout": {
      "$elemMatch": {
        "layout": "coreLayout"
      }
    }
  }, {
    "$set": {
      "layout.$.layout": "coreLayoutBeesknees"
    }
  });
}

let funcs = [
  modifyTagsRoutesLayouts,
  modifyProductVariantRoutesLayouts,
  modifyDashboardRoutesLayouts,
  modifyCheckoutRoutesLayouts,
  modifycoreCheckoutShipping
];

function modifyRoutesLayouts() {
  console.log("modifyRoutesLayouts called afterCoreInit");
  for (let func of funcs) {
    func();
  }
};

//Not necessary
function modifyCheckoutWorkflow() {
  // Replace checkoutReview with our custom Template
  console.log("modifyCheckoutWorkflow called afterCoreInit");
  Packages.update({
    "layout": {
      "$elemMatch":{
        "$or":[
          {
            "layout": "coreLayout"
          },
          {
            "layout": "coreLayoutBeesknees"
          }
        ]
      }
    }
  },
  {
    "$set": {
      "layout.$.layout": "coreLayoutBeesknees"
    }
  },
  {
    multi: true
  });
};

/*
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

});*/


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
/*Meteor.publish("UserClientId", function (profileUserId) {
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

  // TODO: this part currently not working as expected.
  // we could have three situation here:
  // 1 - registered user log in.
  // 2 - admin log in
  // 3 - admin want to get user data
  // I'm not sure about the 3rd case, but we do not cover 2nd case here, because
  // we can see a situation when anonymous user still represented by
  // `profileUserId`, but admin user already could be found by `this.userId`
  // In that case what we should do here?
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
});*/


/*
ReactionCore.initializeTables = function(m=5, n=5, state="success"){
  let tables = [];
  for (var x=0; x < m; x++) {
    let rowTables = [];
    for (var y= 1 + n*x; y <= n + n*x; y++){
      rowTables.push({
        name:y,
        state: state,
        floor:false
      });
    }
    tables.push(rowTables);
  }
  return tables;
}*/

/*
const setTables = function(){

    const tableMap = TableMap.find();

    if (tableMap.count() == 0) {
      const shopId = Reaction.getShopId();
      const tables1 = Restaurant.initializeTables();
      const tables2 = Restaurant.initializeTables(11);
      console.log("shopoId ", shopId);
      if(shopId){
          //console.log("tables ", tables1);
          TableMap.insert(
             {
                name: "First Floor",
                shortName:"1",
                shopId: shopId,
                show:true,
                state:"success",
                floor: true,
                tables: tables1
             }
          );
          TableMap.insert(
             {
                name: "Second Floor",
                shortName:"2",
                shopId: shopId,
                show:true,
                state:"success",
                floor: true,
                tables: tables2
             }
          );
        }
    }
}*/
/**
 * TableMap; Only employees or admin can see TablesMap
 */
/*Meteor.publish("TableMap", function () {
  if (this.userId === null) {
    return this.ready();
  }
  const shopId = Reaction.getShopId();
  if (!shopId) {
    return this.ready();
  }

  const permissions = ["owner", "admin", "employee/employee", "employee/master", "client/vip"];

  if (Roles.userIsInRole(this.userId,
    permissions, shopId ||
    Roles.userIsInRole(this.userId, permissions, Roles.GLOBAL_GROUP))) {
    return TableMap.find({shopId: shopId});
  }

  return this.ready();

});*/


/**
 * ClientsTable
 */
/*Meteor.publish("ClientsTable", function (clientId, tableName) {
  check(clientId, Number);
  check(tableName, Match.Optional(String));
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

  return ClientsTable.find({
    shopId: shopId,
    userId: this.userId,
    masterClientNumber: clientId,
    status: { $in: ["opened", "closed", "payment"]}
  });
});*/

/**
 * ClientsTableHistory
 */
/*Meteor.publish("ClientsTableHistory", function (clientId) {
  check(clientId, Number);
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
});*/
