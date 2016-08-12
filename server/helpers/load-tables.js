import _ from "lodash";
import { EJSON } from 'meteor/ejson';
import { Reaction, Logger, Hooks } from "/server/api";
import { TableMap } from "../../lib";



const setTable = function(table){

    //const tableMap = TableMap.find();

    const shopId = Reaction.getShopId();
    if(shopId){
        //console.log("table ", table);
        _.forEach(table.tables, function(obj) {
          if(_.includes(table.showTables, obj.name)){
            obj.show = true;
          }
        });
        //TableMap.insert(table);
    }
}


if (Hooks) {
  Hooks.Events.add("afterCoreInit", () => {
    Logger.info("Initialize tables");
    const tableMap = TableMap.find();
    if (tableMap.count() == 0) {
      let json = Assets.getText("custom/data/tablesMap.json");
      let tables = EJSON.parse(json);
      for (table of tables){
        setTable(table);
        TableMap.insert(table);
      }
    }
  });
}
