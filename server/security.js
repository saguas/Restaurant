import _ from "lodash";
import { Meteor } from "meteor/meteor";
import { Reaction, Hooks, Logger, MethodHooks } from "/server/api";
import { ClientsTable, TableMap, TableRequestMsg, RestaurantSettings } from "../lib";
import { Restaurant } from ".";



const checkTableValidUpdate = function(floor){
  for(let table of floor.tables) {
      if(table.clientId){
        return false;
      }
  };
  return true;
}


//do not remove or update `tables.$[0-9].show` if not all tables without clientId.
Security.defineMethod("ifFloorEmpty", {
  fetch: [],
  allow: function (type, arg, userId, doc, fields, modifier) {
    Logger.warn({params: {arg: arg, type: type, userId: userId, fields: fields, modifier: modifier, doc:doc}}, "ifFloorEmpty");
    let showPattern = /tables.([$0-9]).show/i;
    //console.log("includes ", _.includes(fields, "tables"));

    if(type === "remove"){
      if(checkTableValidUpdate(doc)){
        return true;
      }
      return false;
    };

    //console.log("startsWith ", pattern.test(objectKeys[0]));
    //let match = pattern.test(objectKeys && objectKeys[0] || []);

    if(type === "update" && _.includes(fields, "tables")) {
      if(_.isArray(modifier.$set.tables)) {
        if (checkTableValidUpdate(doc)){
          return true;
        }
        console.log("not empty!!!");
        return false;
      } else if (modifier && modifier.$set){
        let objectKeys = Object.keys(modifier.$set);
        let match = showPattern.exec(objectKeys && objectKeys[0] || []);
        if(match && match.length > 1){
          //let match = pattern.exec(objectKeys[0]);
          let index = parseInt(match[1]);
          let table = doc.tables[index];
          if( table && table.clientId > 0){
            return false;
          }
        }else{
          return false;
        }
      } else {
        return false;
      }
    }

    return true;
  }
});


/*TableRequestMsg.before.insert(function (userId, doc) {
  doc.creatorId = userId;
  console.log("called on server ", doc);
});*/

Security.defineMethod("ifShopIdMatches2", {
  fetch: [],
  deny: function (type, arg, userId, doc) {
    Logger.warn({obj:{type: type, arg: arg, userId: userId, doc: doc}},"in ifShopIdMatches2");
    return doc.shopId !== Reaction.getShopId();
  }
});


Security.defineMethod("ifMsgRequestValid", {
  fetch: [],
  deny: function (type, arg, userId, doc, fields, modifier) {
    //Logger.warn({obj:{type: type, arg: arg, userId: userId, doc: doc}},"in ifMsgRequestValid");
    if(type === "insert"){
      let clientId = Meteor.user().clientId;
      return doc.fromClientId === doc.toClientId || doc.fromClientId !== clientId;
    }else if(type === "update"){
      let result = false;
      if(_.includes(fields, "status") && doc.creatorId !== userId){
        return true;
      }else if(_.includes(fields, "status")){
        if(modifier && modifier.$set && modifier.$set.status !== "removed"){
          return true;
        }
      }

      for(let field of fields){
        if(_.includes(["creatorId", "fromClientId", "toClientId", "name", "requesterName", "tableName", "msg", "responseToMsgId", "shopId", "createdAt"], field)){
          return true;
        }
      }
      //only can change reason from request to "accepted" or "refused"
      if(_.includes(fields, "reason")){
        if(doc.reason !== "request"){
          return true;
        }
      }
    }
    return doc.fromClientId === doc.toClientId;
  }
});


Security.defineMethod("ifSameCreator", {
  fetch: [],
  deny: function (type, arg, userId, doc) {
    if((type === "remove" || type ==="insert") && !Reaction.hasPermission(["employee/employee", "employee/master", "admin"])){
      Logger.warn({obj:{type: type, arg: arg, userId: userId, doc: doc}},"in ifSameCreator");
      return doc.creatorId !== userId;
    }
    return false;
  }
});



Security.defineMethod("checkRefusedResponses", {
  fetch: [],
  deny: function (type, arg, userId, doc) {
    if(type === "insert" && !Reaction.hasPermission(["employee/employee", "employee/master", "admin"])){
      if(Reaction.hasPermission(["client/table/refused"])){
        return true;
      };
      let block = false;
      const results = checkClientRefusedResponses(doc.fromClientId);
      console.log("result is ", results);
      //more than 5 refused requests deny any futher request by at most 5 hours.
      if(results.length > 0){//&& result[0].count > 10){
        for(result of results){
          if(result._id.reason === "refused" && result.count > 5){
            block = true;
          }else if(result._id.reason === "accepted" && result.count > 0){
            block = false;
            break;
          }
        };
        if(block){
          Logger.warn({obj:{type: type, arg: arg, userId: userId, doc: doc, countResult: results}},"in checkRefusedResponses");
          Roles.addUsersToRoles(userId, ["client/table/refused"], Reaction.getShopId());
        }
        return block;
      }
    }
    return false;
  }
});

const checkClientRefusedResponses = function(fromClientId){
  return Meteor.wrapAsync(_checkClientRefusedResponses)(fromClientId);
}

const _checkClientRefusedResponses = function(toClientId, callback){
  const dt = moment().add(-5, "hours").toDate();
  //const dt = moment().add(-5, "minutes").toDate();
  return TableRequestMsg.rawCollection().aggregate(
     [
         { $match:  {toClientId: toClientId, delivered: true, changedAt:{$gte: dt}}},
         {$sort: {changedAt: -1}},
         { $limit : 6 },
        {
          $group : {
             _id: {reason: "$reason"},
             count: { $sum: 1 }
          }
        }
     ],
     callback
   );
};
/*Hooks.Events.add("afterCoreInit", () => {

});*/


ClientsTable.permit(["insert", "update", "remove"]).ifHasRole({
  role: ["employee/employee", "employee/master", "admin"],
  group: Reaction.getShopId()
}).ifShopIdMatches2().allowInClientCode();


ClientsTable.permit(["update"]).ifHasRole({
  role: ["client/table"],
  group: Reaction.getShopId()
}).ifShopIdMatches2().onlyProps(["ignores"]).allowInClientCode();


TableMap.permit(["insert", "update", "remove"]).ifHasRole({
  role: ["employee/employee", "employee/master", "admin"],
  group: Reaction.getShopId()
}).ifShopIdMatches2().ifFloorEmpty().allowInClientCode();


TableRequestMsg.permit(["insert", "update"])
.ifShopIdMatches2()
.ifSameCreator()
.ifMsgRequestValid()
.checkRefusedResponses()
.allowInClientCode();

TableRequestMsg.permit(["remove"]).ifShopIdMatches2().ifSameCreator().allowInClientCode();

RestaurantSettings.permit(["insert", "update", "remove"]).ifHasRole({
  role: ["employee/master", "admin"],
  group: Reaction.getShopId()
}).ifShopIdMatches2().allowInClientCode();
