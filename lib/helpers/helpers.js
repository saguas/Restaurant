import _ from "lodash";
import { Meteor } from "meteor/meteor";
import { TableMap, ClientsTable } from "../collections";
import { check } from 'meteor/check';
import { Tracker } from 'meteor/tracker';


const isClientsTableClosed = function(clientId, tableName, shopId){
  check(clientId, Number);
  check(tableName, String);
  check(shopId, String);

  let doc = ClientsTable.findOne(
    {
      shopId: shopId,
      tableNumber: tableName,
      status: { $in: ["closed", "payment"]},
      $or:[{
        clients: {$in:[clientId]}
      },
      {
        masterClientNumber: clientId
      }]
    }
  );

  if(doc){
    return true;
  }

  return false;
}

const getTableName = function (floor, tableNumber){
  let tableName;
  if(floor){
    tableName = floor.concat(":").concat(tableNumber);
  }else{
    tableName = tableNumber;
  }

  return tableName;
};


const hasRestaurantFloor = function(){
  const tableMap = TableMap.find();
  let countTables = tableMap.count();
  if(countTables > 1){
    return true;
  }
  return false;
}


const getClientsTableIdFromClientId = function(clientId){
  const doc = ClientsTable.findOne({
      status:{ $in: ["opened", "closed", "payment"]},
      $or:[{
        clients: {$in:[clientId]}
      },
      {
        masterClientNumber: clientId
      }]
  });

  if(doc && doc._id)
    return doc._id;

  return null;
}

const getUserIdFromClientId = function(clientId){
  let userId = Meteor.users.findOne({
      clientId: parseInt(clientId)
    },
    { _id: 1}
  )._id;

  return userId;
}

const getClientId = function(userId){
  let clientId = Meteor.users.findOne({
      _id: userId
    },
    { clientId: 1}
  ).clientId;

  return clientId;
}

/*
  This is necessary. Meteor call onRendered just one time after Blaze.render.
  When a view update reactively onRendered is not called again and we need to call
  this componente after is rendered.
*/
const in18 = function(currentView){
  currentView.onViewReady(function(){
    //console.log("view rendered this: ", this);
    $("[data-i18n]").localize();
  });
}


const resetTables = function(dict){
  //Session.set("tables", false);
  dict.set("showTables", false);
}


const breadcrumbAddActive = function(menuname, bmenu){
  for (b of bmenu){
    if(b.breadcrumbMiddleName === menuname){
        b.breadcrumbMiddleMenuActive = true;
        break;
    }
  }
  return bmenu;
}

const breadcrumbRemoveLast = function(bmenu){
  bmenu.pop();
  return bmenu;
}

const removeTablesMap = function(Reaction, query={}){
  const shopId = Reaction.getShopId();
  if(shopId && Reaction.hasPermission(["employee/employee", "employee/master", "admin"])){//remove role employee/employee after tests
    const tablesMap = TableMap.find(query).fetch();
    _.forEach(tablesMap, function(floor){
        _.forEach(floor.tables, function(table) {
          if(table.clientId){
            throw `Not all tables are free. Table ${table.name} has client number ${table.clientId}`;
          }
        });
      });
      TableMap.remove(query);
  }
}

const resetTablesMap = function(Reaction, query={}){
  const shopId = Reaction.getShopId();
  if(shopId && Reaction.hasPermission(["employee/employee", "employee/master", "admin"])){//remove role employee/employee after tests
        const tablesMap = TableMap.find(query).fetch();
        _.forEach(tablesMap, function(floor){
            _.forEach(floor.tables, function(table) {
             if(table.clientId){
                throw `Not all tables are free. Table ${table.name} has client number ${table.clientId}`;
              }
              if(_.includes(floor.showTables, table.name)){
                table.show = true;
              }else{
                table.show = false;
              }
            });
            TableMap.update({_id: floor._id}, {$set:{tables: floor.tables}});
        });
  }
}

const _validateTableMapShowChanges = function(Reaction, id, tableNumber){
  const tableIndex = tableNumber - 1;
  const floor = TableMap.findOne({_id: id});
  const validIndex = floor && floor.tables && floor.tables.length > tableIndex;
  if(validIndex){
    const table = floor.tables[tableIndex];
    if(table.clientId){
       throw `Not all tables are free. Table ${table.name} has client number ${table.clientId}`;
     }
    return true;
  }
  return false;
}

const changeTableMapShow = function(Reaction, id, tableNumber, value){
  check(tableNumber, Number);
  check(value, Boolean);
  check(id, String);
  /*const tableIndex = tableNumber - 1;
  const floor = TableMap.findOne({_id: id});
  const validIndex = floor && floor.tables && floor.tables.length > tableIndex;
  if(validIndex){
    const table = floor.tables[tableIndex];
    if(table.clientId){
       throw `Not all tables are free. Table ${table.name} has client number ${table.clientId}`;
     }*/
  if(_validateTableMapShowChanges(Reaction, id, tableNumber)){
    const obj = {};
    obj[`tables.${tableIndex}.show`] = value;
    TableMap.update({_id: id}, {$set: obj});
  }
}

const toggleTableMapShow = function(Reaction, id, tableNumber){
  check(tableNumber, Number);
  check(id, String);
  /*const tableIndex = tableNumber - 1;
  const floor = TableMap.findOne({_id: id});
  const validIndex = floor && floor.tables && floor.tables.length > tableIndex;
  if(validIndex){
    const table = floor.tables[tableIndex];
    if(table.clientId){
       throw `Not all tables are free. Table ${table.name} has client number ${table.clientId}`;
     }*/
  if(_validateTableMapShowChanges(Reaction, id, tableNumber)){
    const obj = {};
    //obj["tables." + tableIndex + ".show"] = !table.show;
    obj[`tables.${tableIndex}.show`] = !table.show;
    TableMap.update({_id: id}, {$set: obj});
  }
}

const prepareTableMap = function(dict){

  let countTables = getTableMap(dict);
  //let tablesFloor = countTables > 1;
  //dict.set("tablesFloor", tablesFloor);
  if(!Session.equals("floor", "Home")){
    getTableMap(dict, {name: Session.get("floor")});
  }
  /*if(!tablesFloor){
    //if only one floor set the name anyway.
    const tableMap = TableMap.findOne();
    if (tableMap){
      Session.set("floor", tableMap.name);
      dict.set("showTables", true);
    }
  }*/

}

const getAllTableFloors = function(dict){
  const tableMap = TableMap.find({}, {sort: {order: 1}});

  let allfloors = tableMap.fetch();
  let countTables = tableMap.count();
  if(countTables == 1){
    //if only one floor set the name anyway.
    //const tableMap = TableMap.findOne();
    console.log("in getAllTableFloors only one floor ", allfloors);
    if (allfloors){
      let dbfloorname = allfloors[0].name;
      Tracker.nonreactive(function(){
        let currfloor = Session.get("floor");
        console.log("in getAllTableFloors only one floor currfloor ", currfloor);
        if (currfloor !== "Home" && currfloor !== dbfloorname){
          Session.set("floor", "Home");
          dict.set("breadCrumbMiddleMenu", []);
          dict.set("showTables", false);
          //resetTables(dict);
        }else if(currfloor !== "Home"){
          dict.set("showTables", true);
        }else{
          dict.set("showTables", false);
        }
      });
    }
  }
  dict.set("tablesFloors",{
    tables: allfloors
  });

  return countTables;
}

const getTableMap = function(dict, query={}){
  const tableMap = TableMap.find(query, {sort: {order: 1}});

  let allfloors = tableMap.fetch();
  let countTables = tableMap.count();
  getAllTableFloors(dict);
  /*if(countTables > 1){
      dict.set("tablesFloors",{
        tables: allfloors
      });
  }else if(allfloors.length > 0){*/
  if(allfloors.length == 1){
    _.forEach(allfloors, function(floor){
      floor.tables = _.filter(floor.tables, function(table){ return table.show || false});
    });
    dict.set("tables", {
      parentId: allfloors[0]._id,
      parentName: allfloors[0].name,
      tables:allfloors[0].tables
    });
  }
  return countTables;
}


/*
const getTableMap = function(dict, query={}){
  const tableMap = TableMap.find(query);

  console.log("subscriptionsReady ",tableMap.count());
  let alltables = tableMap.fetch();
  let countTables = tableMap.count();
  if(countTables > 1){
      dict.set("tablesFloors",{
        tables: alltables
      });
      //handler.tables.set({tables:[]});
  }else if(alltables.length > 0){
    dict.set("tables", {
      parentId: alltables[0]._id,
      parentName: alltables[0].name,
      tables:alltables[0].tables
    });
  }
  return countTables;
}
*/
const validateNif = function(nif){
  return true;
};


const select2 = {languages:{}};
//const select2.languages = {};


export default Restaurant = {
  validateNif,
  isClientsTableClosed,
  getTableName,
  hasRestaurantFloor,
  getClientsTableIdFromClientId,
  getUserIdFromClientId,
  getClientId,
  in18,
  resetTables,
  breadcrumbAddActive,
  breadcrumbRemoveLast,
  removeTablesMap,
  resetTablesMap,
  changeTableMapShow,
  toggleTableMapShow,
  prepareTableMap,
  getTableMap,
  select2
}
