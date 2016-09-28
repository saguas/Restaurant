import _ from "lodash";
import { Template } from "meteor/templating";
import { Session } from "meteor/session";


const breadcrumbRemoveActive = function(bmenu){
  for (b of bmenu){
    if(b.breadcrumbMiddleMenuActive){
      b.breadcrumbMiddleMenuActive = false;
      break;
    }
  }

  return bmenu;
}

const splitArray = function(data, n){
  var lists = _.chain(data).groupBy(function(element, index){
    return Math.floor(index/n);
  }).toArray()
  .value();

  return lists;
}


const ajustTables = function(a,n){
  const rest = a%n;
  if (rest > 0){
    let val = Math.floor(a/n);
    return (val + 1)*n - a;
  }

  return 0;
}

const getNBtnByRow = function(){
  let w = $(window).width();
  if (w > 1024){
    return 5;

  }else if(w > 414 && w <= 1024){
    return 4;
  }

  return 4;
}


Template.TableChooserToggle.onCreated(function () {
    console.log("****Template.TableChooserToggle.onCreated ");
    Session.setDefault("tableNumber", "");
    let parent = this.parent(1);
    this.getTableMap = parent.getTableMap;
    this.dict = parent.dict;
    console.log("****** in TableChooserToggle dict is the same ", this.dict===parent.dict);
    this.nBtnByRow = 5;
    /*const parent = this.parent(1);
    this.autorun(() => {
      this.subscribe("TableMap");
      if (this.subscriptionsReady()) {
        let countTables = parent.getTableMap(parent);
        this.tablesFloor = countTables > 1;
        if(!this.tablesFloor){
          //if only one floor set the name anyway.
          const tableMap = ReactionCore.Collections.TableMap.findOne();
          Session.set("floor", tableMap.name);
          parent.showTables.set(true);
        }
      }
    });*/
});

Template.TableChooserToggle.helpers({
  tableState: function(table){
    let state = table.state;
    if(!state){
      state = "success";
    }
    return state;
  },
  getNumberOfFloors: function(){
    const instance = Template.instance();
    //const parent = Template.instance().parent(1);
    //let alltables = parent.tablesFloors.get().tables;
    let alltables = instance.dict.get("tablesFloors").tables;
    console.log("getNumberOfFloors ", alltables);
    /*if (instance.tablesFloor){
      let floor = Session.get("floor");
      Session.set("floor", floor || "  ");
    }*/
    return {
      tables: splitArray(alltables, 5)
    }
  },
  getNumberOfRowsInTable: function(){
    //const instance = Template.instance().parent(1);
    const instance = Template.instance();
    //let alltables = instance.tables.get().tables;
    let alltables = instance.dict.get("tables").tables;
    let dim = alltables.length;
    let ajust = ajustTables(dim, 5);
    if( ajust > 0){
      let total = dim+ajust;
      console.log("total ", dim);
      for(let i=dim; i<total;i++){
        alltables.push({
          name: "",//i + 1,
          state: "primary",
          floor:false,
          disabled:"disabled"
        });
      }

    }
    //if (!Session.get("tables"))
      //getTableMap(instance);

    //let tableObj = instance.tables.get();
    let tableObj = instance.dict.get("tables");
    console.log("getNumberOfRowsInTable ", tableObj);
    return {
      parentId: tableObj._id,
      parentName: tableObj.name,
      tables: splitArray(alltables, 5)
    }
    //return initializeTables();
  },
  goHome: function(){
    const instance = Template.instance();
    //const parent = Template.instance().parent(1);
    //let tableObj = parent.tables.get();
    let tableObj = instance.dict.get("tables");
    //if (instance.tablesFloor == true){
    //if (parent.tablesFloor == true){
    //if (instance.dict.get("tablesFloor") == true){
    return tableObj.parentId !== undefined;
    //}
    return false;
  },
  showTablesTitle: function(){
    //const instance = Template.instance().parent(1);
    const instance = Template.instance();
    //return instance.currentFloor.get() !== undefined;
    return instance.dict.get("currentFloor") !== undefined;
  },
  showTables: function(){
    //const parent = Template.instance().parent(1);
    const instance = Template.instance();
    //if(!Session.get("tables")){
    //if(!parent.showTables.get()){
    if(!instance.dict.get("showTables")){
      //parent.currentFloor.set();
      instance.dict.set("currentFloor", undefined);
      return false;
    }
    return true;
  },
  activeFloor: function(name){
    //const instance = Template.instance().parent(1);
    const instance = Template.instance();
    //if(instance.currentFloor.get() === name){
    if(instance.dict.get("currentFloor") === name){
      return "active";
    }
  }
});


Template.TableChooserToggle.events({
  "change [data-event-action=TableChooserToggle]": function (event, instance) {
      /*let eventid = event.currentTarget.dataset.eventId;
      if(eventid !== undefined){
        console.log("eventid ", eventid);
          return getTableMap(instance, {_id: eventid});
      }*/
      //parent = instance.parent(1);
      let tablename = event.currentTarget.dataset.eventTablename;
      let clientId = event.currentTarget.dataset.eventClientid;


      //let tableObj = parent.dict.get("tables");
      let tableObj = instance.dict.get("tables");

      console.log("TableChooserToggle ", event.currentTarget.dataset);
      console.log("TableChooserToggle ", tablename);
      console.log("parentId ", tableObj.parentId);
      console.log("parentName ", tableObj.parentName);
      console.log("button clientId ", clientId);
      //getTableMap(instance);
      //Session.set("showTablesOrClient", false);

      //set clientId for tables with clients. Button is red!
      //this way when we press button for table, the clientId is automatically filled, and ClientKeys are disabled.
      if(clientId){
        //Session.set("disableAllKyes", parseInt(clientId));

        //parent.btnClientId.set(parseInt(clientId));
        instance.dict.set("btnClientId", parseInt(clientId));

      }else{
        instance.dict.set("btnClientId", 0);
      }
      instance.dict.set("showTablesOrClient", false);

      //if(instance.tablesFloor){
      //let tablesFloor = instance.dict.get("tablesFloor");
      //console.log("in data-event-action=TableChooserToggle tablesFloor ", tablesFloor);
      //if(tablesFloor){
      let breadcrumbold = instance.dict.get("breadCrumbMiddleMenu");

      console.log("breadcrumbold ", breadcrumbold);
      let breadcrumbnew = breadcrumbRemoveActive(breadcrumbold);
      breadcrumbnew.push({breadcrumbMiddleName:tablename, breadcrumbMiddleMenuActive: true});

      instance.dict.set("breadCrumbMiddleMenu", breadcrumbnew);
      //}else{
        //instance.dict.set("showBreadCrumbMenu", true);
      //}

      Session.set("tableNumber", tablename);
  },
  "change [data-event-action=TableChooserToggleFloors]": function (event, instance) {
    parent = instance.parent(1);
    let eventid = event.currentTarget.dataset.eventId;
    let tablename = event.currentTarget.dataset.eventTablename;

    //let currFloor = parent.currentFloor.get();
    let currFloor = instance.dict.get("currentFloor");

    console.log("In TableChooserToggleFloors ", currFloor, tablename);

    if (currFloor !== tablename){
      //parent.currentFloor.set(tablename);
      instance.dict.set("currentFloor", tablename);
      //parent.$(".tables.active").button('reset');
      parent.$(".btn-group.tables").removeClass("active").end().find('[type="radio"][data-event-floor="true"]').prop('checked', false);
      //parent.$(".tables.active").removeClass("active");
    }else if(currFloor === tablename){
      return;
    }
    //Session.set("showTablesOrClient", false);
    //Session.set("tables", true);

    //parent.showTables.set(true);
    instance.dict.set("showTables", true);

    //Session.set("showBreadCrumbMenu", true);

    //parent.showBreadCrumbMenu.set(true);
    instance.dict.set("showBreadCrumbMenu", true);

    //Session.set("showBreadCrumbMiddleMenu", [{breadcrumbMiddleName:tablename, breadcrumbMiddleMenuActive: true, id: eventid}]);

    //parent.breadCrumbMiddleMenu.set([{breadcrumbMiddleName:tablename, breadcrumbMiddleMenuActive: true, id: eventid}]);
    instance.dict.set("breadCrumbMiddleMenu", [{breadcrumbMiddleName:tablename, breadcrumbMiddleMenuActive: true, id: eventid}]);

    Session.set("floor", tablename);
    //return parent.getTableMap(parent, {_id: eventid});
    return instance.getTableMap(instance.dict, {_id: eventid});
  },
  "click [data-event-action=TableChooserHome]": function (event, instance) {
    //getTableMap(instance);
  }
  });
