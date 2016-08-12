import _ from "lodash";
import { Meteor } from "meteor/meteor";
import { Reaction, Logger } from "/server/api";
import { ClientsTable, TableMap, Restaurant as RestaurantLib } from "../../lib";
import { Roles } from "meteor/alanning:roles";




const resetCartWorkflowTo = function(clientId){
  // revert workflow to checkout shipping step.
  //Meteor.call("workflow/revertCartWorkflow", "coreCheckoutShipping");
  const userId = RestaurantLib.getUserIdFromClientId(clientId);
  const cart = Reaction.Collections.Cart.findOne({
    userId: userId
  });
  workflowRevertCartWorkflow(cart, userId, "coreCheckoutShippingBeesknees");//"coreCheckoutShipping"
  // reset selected shipment method
  //Meteor.call("cart/resetShipmentMethod", cart._id);
  //cartResetShipmentMethod(cart._id, userId);
}


const workflowRevertCartWorkflow = function (cart, userId, newWorkflowStatus) {
  check(newWorkflowStatus, String);
  check(userId, String);
  //this.unblock();

  if (!cart || typeof cart.workflow !== "object") return false;
  if (typeof cart.workflow.workflow !== "object") return false;

  const { workflow } = cart.workflow;
  // get index of `newWorkflowStatus`
  const resetToIndex = workflow.indexOf(newWorkflowStatus);
  // exit if no such step in workflow
  if (!~resetToIndex) return false;
  // remove all steps that further `newWorkflowStatus` and itself
  const resetedWorkflow = workflow.slice(0, resetToIndex);

  return Reaction.Collections.Cart.update(cart._id, {
    $set: {
      "workflow.status": newWorkflowStatus,
      "workflow.workflow": resetedWorkflow
    }
  });
}

const cartResetShipmentMethod = function (cart, userId) {
  check(userId, String);

  /*const cart = Reaction.Collections.Cart.findOne({
    _id: cartId,
    userId: userId
  });*/
  if (!cart) {
    Logger.error(`Cart not found for user: ${this.userId}`);
    throw new Meteor.Error(404, "Cart not found",
      `Cart: ${cartId} not found for user: ${this.userId}`);
  }

  return Reaction.Collections.Cart.update({ _id: cart._id }, {
    $unset: { "shipping.0.shipmentMethod": "" }
  });
}


const openClientsTable = function(data){
  let shopId = data.shopId;
  let cartData = data.cartData;
  let ownerUserId = data.ownerUserId;
  let cartId = data.cartId;
  let clientUserId = data.clientUserId;

  let id;
  let userId;
  let clientId = cartData.clientId;

  if(!clientUserId){
    //if not client/vip. if client/vip we can get userId by this.userId.
    try {
      userId = RestaurantLib.getUserIdFromClientId(clientId);
      setClientPermissions(userId, ["client/table"], shopId);
      clientUserId = userId;
    } catch(err){
      let error = `There is no client with this number ${clientId}.`;
      console.log(error);
      //return getErrorResult(error);
      throw error;
    };
  }

  id = insertOnClientsTable(ownerUserId, clientUserId, cartId, clientId, cartData.tableName);

  let tableParts = cartData.tableName.split(":");
  let floor = tableParts[0];
  let tableName = tableParts[1];

  setTableMapOccupation(floor, tableName, clientId);

  return id;

}

const doClientsTableCopyTo = function(fromCollection, toCollection, tmpCollection, tableName, clientId, shopId){
  return Meteor.wrapAsync(_doClientsTableCopyTo)(fromCollection, toCollection, tmpCollection, tableName, clientId, shopId);
}

const _doClientsTableCopyTo = function(fromCollection, toCollection, tmpCollection, tableName, clientId, shopId, callback){
  doClientsTableAggregateTo(fromCollection, tmpCollection, tableName, clientId, shopId);

  Reaction.Collections[toCollection].rawCollection().copyTo("toCollection");
}

const doClientsTableFindAndCopyTo = function(fromCollection, toCollection, tableName, clientId, shopId){
  const doc = fromCollection.findOne({
    status:{ $in: ["opened", "closed", "payment"]},
    tableNumber: tableName,
    shopId: shopId,
    $or:[{
      clients: {$in:[clientId]}
    },
    {
      masterClientNumber: clientId
    }]
  });

  if(doc){
    toCollection.insert(doc);
  }

}

const doClientsTableAggregateTo = function(fromCollection, toCollection, tableName, clientId, shopId){
    return Meteor.wrapAsync(_doClientsTableAggregateTo)(fromCollection, toCollection, tableName, clientId, shopId);
}


const _doClientsTableAggregateTo = function(fromCollection, toCollection, tableName, clientId, shopId, callback){
    console.log("in doClientsTableCopyTo ");
    fromCollection.rawCollection().aggregate(
      [
        {
          $match: {
              tableNumber: tableName,
              shopId: shopId,
              $or:[{
                clients: {$in:[clientId]}
              },
              {
                masterClientNumber: clientId
              }]
          }
        },
        {
          $out : toCollection
        }
      ],
      callback
    );
}

const filterTableValidClientId = function(){
    let project = {
      tables: {
              $filter: {
                 input: "$tables",
                 as: "tab",
                 cond: { $gt: [ "$$tab.clientId", 0 ] }
              }
      }
  };
  return filterCollection(TableMap, project);
}


const filterCollection = function(collection, project){
  return Meteor.wrapAsync(_filterCollection)(collection, project);
};

const _filterCollection = function(collection, project, callback){

  collection.rawCollection().aggregate(
      [
        {
          $project: project
      }
    ],
    callback
  )
}

const filterCollectionShow = function(){
  return Meteor.wrapAsync(_filterCollectionShow)();
};

const _filterTableCollectionShow = function(callback){
  TableMap.rawCollection().aggregate(
    [
      {
        $project: {
          tables: {
                  $filter: {
                     input: "$tables",
                     as: "tab",
                     cond: { $eq: [ "$$tab.show", true ] }
                  }
          }
      }
    }
    ],
    callback
  );
};

const removeClientsTable = function(collection, tableName, clientId, shopId){
  return collection.remove({
    tableNumber: tableName,
    shopId: shopId,
    $or:[{
      clients: {$in:[clientId]}
    },
    {
      masterClientNumber: clientId
    }]
  });
}


const doClientsTableResetWorkflow = function(collection, tableName, clientId, shopId){
  let set = {
    "status": "open",
    "worflow.status": "tableOpened",
    "workflow.workflow": [],
    "paymentMethod": undefined
  };

  const result = collection.update({
    tableNumber: tableName,
    shopId: shopId,
    $or:[{
      clients: {$in:[clientId]}
    },
    {
      masterClientNumber: clientId
    }]
    }, {
      $set: set
    });
}


const doClientsTableUpdateWorkflow = function(collection, tableName, clientId, shopId, status, workflowStatus, workflow, paymentMethod){
  let set = {
    "workflow.status": workflowStatus,
    "status": status
  };

  let paytype = {"paymentMethod": paymentMethod};

  Object.assign(set, paytype.paymentMethod && paytype || {});

  const result = collection.update({
    tableNumber: tableName,
    shopId: shopId,
    $or:[{
      clients: {$in:[clientId]}
    },
    {
      masterClientNumber: clientId
    }]
    }, {
      $set: set,
      $addToSet: {
        "workflow.workflow": workflow
      }
    });
    return result;
}


const doClientsTableInsert = function(collection, tableName, clientId, cartId, status) {
  return Meteor.wrapAsync(_doClientsTableInsert)(collection, tableName, clientId, cartId, status);
}

const _doClientsTableInsert = function(collection, tableName, clientId, cartId, status, callback) {
  console.log("inside doClientsTableInsert tableName ", tableName, clientId, cartId, status);
  collection.rawCollection().findAndModify({
      status:status,
      tableNumber: tableName,
      $or:[{
        clients: {$in:[clientId]}
      },
      {
        masterClientNumber: clientId
      }]
    },
    []
    ,
    {
      $addToSet: {cartsId: cartId}
    }, callback
  );
}

const setTableMapOccupation = function(floor, tableName, clientId, state="danger"){
  TableMap.update({
    "name": floor,
    "tables": {
        "$elemMatch": {"name": tableName}
    }
  },{
    "$set": {"tables.$.state": state, "tables.$.clientId": clientId}
  });
}
const removeClientFromTable = function(floor, tableName, clientId){
  return Meteor.wrapAsync(_removeClientFromTable)(floor, tableName, clientId);
  //console.log("removeClientFromTable obj ", obj);
}

const _removeClientFromTable = function(floor, tableName, clientId, callback){
  console.log("in removeClientFromTable ", floor, tableName, clientId);
  TableMap.rawCollection().findAndModify({
    "name": floor,
    "tables": {
        "$elemMatch": {"name": tableName}
    }
  },
  []
  ,
  {
    "$unset": {"tables.$.clientId":""}
  }, callback
  );
}

const setClientPermissions = function(userId, perm){
  const shopId = Reaction.getShopId();
  Roles.addUsersToRoles(userId, perm, shopId);
}
const removeClientPermissions = function(userId, perm){
  const shopId = Reaction.getShopId();
  Roles.removeUsersFromRoles(userId, perm, shopId);
}

const checkIfClientHasTable = function(clientId, status="opened"){
  return ClientsTable.findOne({
      status:{ $in: ["opened", "closed", "payment"]},
      $or:[{
        clients: {$in:[clientId]}
      },
      {
        masterClientNumber: clientId
      }]
    });
}

const insertOnClientsTable = function(creatorId, userId, cartId, clientId, tableName, status="opened", shopId=Reaction.getShopId()){
  let doc = {
    creatorId: creatorId,
    userId: userId,
    cartsId:cartId && [cartId] || [],
    shopId: shopId,
    clients:[],
    ignores:[],
    masterClientNumber: clientId,
    tableNumber: tableName,
    status: status,
    workflow: {
        status: "tableOpened",
        workflow: []
    }
  };
  //console.log("ClientsTable.simpleSchema() ", ClientsTable.simpleSchema());
  //check(doc, ClientsTable.simpleSchema());
  return ClientsTable.insert(doc);
}

const numberClientTables = function(clientId){
  return ClientsTable.find({
    status:{ $in: ["opened", "closed", "payment"]},
    $or:[{
      clients: {$in:[clientId]}
    },
    {
      masterClientNumber: clientId
    }]
  }).count();
}

const removePermissionsForClientLastTable = function(collection, tableName, clientId, shopId){
  const doc = ClientsTable.findOne({
    status:{ $in: ["opened", "closed", "payment"]},
    tableNumber: tableName,
    $or:[{
      clients: {$in:[clientId]}
    },
    {
      masterClientNumber: clientId
    }]
  });

  if(doc){
    const masterId = doc.masterClientNumber;
    if (isLastClientTable(masterId)){
      const userId = RestaurantLib.getUserIdFromClientId(masterId);
      removeClientPermissions(userId, ["client/table"], shopId);
    }
    _.forEach(doc.clients, function(cid) {
      if (isLastClientTable(cid)){
        const userId = RestaurantLib.getUserIdFromClientId(cid);
        removeClientPermissions(userId, ["client/table"], shopId);
      }
    });
    return;
  }

  return;

}

const isLastClientTable = function(clientId){
  return numberClientTables(clientId) <= 1;
}


const initializeTables = function(m=23, state="success"){
  let tables = [];
  for (var x=1; x <= m; x++) {
    //let rowTables = [];
    //for (var y= 1 + n*x; y <= n + n*x; y++){
      tables.push({
        name: x,
        state: state,
        floor:false
      });
    //}
    //tables.push(rowTables);
  }
  return tables;
}

const Restaurant = Object.assign({
  resetCartWorkflowTo,
  workflowRevertCartWorkflow,
  cartResetShipmentMethod,
  openClientsTable,
  doClientsTableCopyTo,
  doClientsTableFindAndCopyTo,
  doClientsTableAggregateTo,
  filterTableValidClientId,
  filterCollection,
  filterCollectionShow,
  removeClientsTable,
  doClientsTableResetWorkflow,
  doClientsTableUpdateWorkflow,
  doClientsTableInsert,
  setTableMapOccupation,
  removeClientFromTable,
  removeClientPermissions,
  setClientPermissions,
  checkIfClientHasTable,
  insertOnClientsTable,
  numberClientTables,
  removePermissionsForClientLastTable,
  isLastClientTable,
  initializeTables
},
RestaurantLib
);

export default Restaurant;
