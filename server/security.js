import _ from "lodash";
import { Meteor } from "meteor/meteor";
import { Reaction, Hooks, Logger } from "/server/api";
import { ClientsTable, TableMap, TableRequestMsg } from "../lib";
import { Restaurant } from ".";



const checkValidUpdate = function(floor){
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
      if(checkValidUpdate(doc)){
        return true;
      }
      return false;
    };

    //console.log("startsWith ", pattern.test(objectKeys[0]));
    //let match = pattern.test(objectKeys && objectKeys[0] || []);

    if(type === "update" && _.includes(fields, "tables")) {
      if(_.isArray(modifier.$set.tables)) {
        if (checkValidUpdate(doc)){
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


Security.defineMethod("ifShopIdMatches2", {
  fetch: [],
  deny: function (type, arg, userId, doc) {
    return doc.shopId !== Reaction.getShopId();
  }
});


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
  role: ["employee/employee", "employee/master", "admin", "owner"],
  group: Reaction.getShopId()
}).ifShopIdMatches2().ifFloorEmpty().allowInClientCode();


TableRequestMsg.permit(["insert", "update"]).ifShopIdMatches2().allowInClientCode();

TableRequestMsg.permit(["remove"]).ifHasRole({
  role: ["employee/employee", "employee/master", "admin", "owner"],
  group: Reaction.getShopId()
}).ifShopIdMatches2().allowInClientCode();
