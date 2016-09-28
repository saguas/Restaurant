import _ from "lodash";
import { Meteor } from "meteor/meteor";
import { Blaze } from 'meteor/blaze'
import { check } from 'meteor/check';
import { Template } from "meteor/templating";
import { Session } from "meteor/session";
import { Tracker } from 'meteor/tracker';
import { Reaction, Logger } from "/client/api";
import { Restaurant, TableRequestMsg, ClientsTable, RestaurantSettings } from "../../lib";
import { Cart } from "/lib/collections";
import "toastr/toastr.less";
import toastr from "toastr";
import moment from "moment";
import "moment/min/locales.min.js";
import eventemitter from "event-emitter";
import hasListeners from 'event-emitter/has-listeners';
//import "moment/locale/pt";

const lapseTime = 15;

Tracker.autorun(function () {
  const currlng = Session.get("language");
  const momentlang = moment.locale(currlng);
  console.log(`currlng ${currlng}, moment lang ${momentlang}`);
});
//let toastr = Restaurant.toastr;

const changeToastrOptions = function(options){

  toastr.options = Object.assign({
    "closeButton": true,
    "debug": false,
    "newestOnTop": true,
    "progressBar": false,
    "positionClass": "toast-bottom-right",
    "preventDuplicates": false,
    "onclick": null,
    "showDuration": "300",
    "hideDuration": "1000",
    "timeOut": "5000",
    "extendedTimeOut": "1000",
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut"
  }, options);
}


const upadateTableRequestDelivered = function(id, delivered=true, reason=""){
  check(delivered, Boolean);
  check(id, String);

  console.log(`in upadateTableRequestDelivered id ${id} delivered ${delivered} reason: ${reason}`);
  const obj = {delivered: delivered, changedAt: new Date()}
  _upadateTableRequest(id, obj);

}


const upadateTableRequestState = function(id, state, reason=""){
  check(state, String);
  check(id, String);

  console.log(`in upadateTableRequestState id ${id} state ${state}`);
  const obj = {status: state, changedAt: new Date()}
  _upadateTableRequest(id, obj);

}


const upadateTableRequestPinned = function(id){
  check(id, String);

  console.log(`in upadateTableRequestState id ${id}`);
  const obj = {pinned: true, changedAt: new Date()}
  _upadateTableRequest(id, obj);

}

const _upadateTableRequest = function(id, obj){
  const shopId = Reaction.getShopId();
  //const request = Object.assign({}, doc, {shopId: shopId});
  TableRequestMsg.update({_id:id}, {$set: obj});
}

const updateIgnoresClient = function(clientId){
  const doc = ClientsTable.findOne({masterClientNumber: Meteor.user().clientId});
  if(doc){
    console.log(`updateIgnoresClient _.id ${doc._id} clientId ${clientId}`);
    ClientsTable.update({_id: doc._id}, {$addToSet:{ignores: clientId}});
  }else{
    throw `Not possible. There is no table to add to ignores clients.`;
  }

}

/*const updateClients = function(clientId){
  const doc = ClientsTable.findOne({masterClientNumber: Meteor.user().clientId});
  ClientsTable.update({_id: doc._id}, {$addToSet:{clients: clientId}})
}*/

const dbnotify = function(doc, callback){
  //const shopId = Reaction.getShopId();
  //const request = Object.assign({}, doc, {shopId: shopId});
  const request = Object.assign({}, doc, {creatorId: Meteor.userId()});
  //const request = Object.assign({}, doc);
  console.log("dbnotify insert in TableRequestMsg ", request);
  TableRequestMsg.insert(request, callback);
}

/*TableRequestMsg.before.insert(function (userId, doc) {
  console.log("called on client ", doc);
  doc.creatorId = userId;
});*/

const notify = function(type, doc, newmsg){
  switch (type) {
    case "request":
      doc.name = doc.name || doc.fromClientId;
      doc.msg = newmsg || `<strong>${doc.name}</strong> ask permission to make request in your table.`;
      toastr["info"](Blaze.toHTMLWithData(Template.restaurantNotify, {doc: doc, date: moment(doc.changedAt).format()}));
      break;
    case "info":
      toastr.info(newmsg || doc.msg);
      break;
    case "warning":
      toastr.warning(newmsg || doc.msg);
      break;
    case "success":
      toastr.success(newmsg || doc.msg);
      break;
    case "error":
      toastr.error(newmsg || doc.msg);
      break;
    default:
        toastr.info(newmsg || doc.msg);
  }

}


/*const askTablePermission = function(toId, tableName){
    check(toId, Number);
    check(tableName, String);
    const thisUser = Meteor.user();
    const clientId = thisUser.clientId;
    const msg = `The client ${thisUser.username} ask permission to make request to table ${tableName}.`;
    const doc = {fromId: clientId, toId: toId, msg: msg, name: thisUser.username, status:"new", tableName: tableName};

    dbnotify(doc);
}*/

const getUserName = function(){
  const cart = Cart.findOne();
  const thisUser = Meteor.user();

  if(thisUser.username){
    return thisUser.username;
  }

  if(cart){
    const fullName = cart.billing[0].address.fullName;
    const fullNameParts = fullName.split(" ");
    const lastindex = fullNameParts.length - 1;
    if( lastindex > 0){
      return `${fullNameParts[0]} ${fullNameParts[lastindex]}`;
    }
    return fullNameParts[lastindex];
  }

  return `${thisUser.clientId}`;

}


const sendTableRequest = function(toClient, msg, status="new", reason="request", responseToMsgId="", newId="", callback){
  if(_.isPlainObject(toClient)){
    const clientCallback = toClient.callback;
    //if(clientCallback)
    delete toClient.callback;
    _sendTableRequest(toClient, clientCallback);
  }else{
    const doc = {_id: newId, toClientId: parseInt(toClient), msg: msg, status: status, reason: reason, responseToMsgId: responseToMsgId, callback};
    _sendTableRequest(doc);
  }

}

const _sendTableRequest = function(doc, callback){//function(toClientId, newmsg, status="new", reason="request", responseToMsgId=""){
    //check(toId, Number);
    //if(checkedAddressBook() && !Reaction.hasPermission(["admin", "employee/employee", "employee/master"])){

    const thisUser = Meteor.user();
    const clientId = thisUser.clientId;
    const requests = TableRequestMsg.find().fetch();
    /*if(toId === clientId){
      throw `Not permited to send a request to your self!`;
    }*/
    for(request of requests){
      if(request.toClientId === doc.toClientId && request.fromClientId === clientId){
        throw `There is already a request to client with Id: ${doc.toClientId}`;
      }
    }

    const username = getUserName();
    const msg = `The client ${username} ask permission to make request in your table.`;
    const newdoc = Object.assign({
      msg: msg,
      status: "new",
      reason: "request",
      responseToMsgId: ""
    }, doc, {fromClientId: clientId, name: username});

    //const doc = {fromClientId: clientId, toClientId: parseInt(toClientId), msg: msg, name: username, status: status, reason: reason, responseToMsgId: responseToMsgId};
    console.log("sendTableRequest ", newdoc);
    dbnotify(newdoc, callback);
    return;
    //}
    /*
    Reaction.Router.go("cart/checkout", {}, {});
    toastr.options.closeButton = true;
    toastr.options.timeOut = "5000";
    toastr.options.extendedTimeOut = "1000";
    toastr.options.tapToDismiss = false;
    toastr.options.progressBar = true;
    notify("info", {}, "To send table request you need to give us some information first.");
    */
}

const sendTableNotification = function(tableName, newmsg){
  const ct = ClientsTable.findOne({tableNumber: tableName});
  if(ct && Reaction.hasPermission(["client/table"])){
    const toClientId = ct.creatorCid;
    const thisUser = Meteor.user();
    const clientId = thisUser.clientId;
    const username = getUserName();
    const tableparts = tableName.split(":");
    const floor = tableparts[0];
    const table = tableparts[1];
    const msg = newmsg || `Floor: ${floor}, Table: ${table}: request from ${username}.`;
    const doc = {fromClientId: clientId, toClientId: parseInt(toClientId), msg: msg, name: username, status: "new", reason: "waiter"};
    console.log("sendTableNotification2 ", doc);
    dbnotify(doc);
  }
}

const notifyTableRequest = function(type, doc, newmsg){
    notify(type, doc, newmsg);
}

const insertClientsTableClient = function(clientId, callback){
  const doc = ClientsTable.findOne({masterClientNumber: Meteor.user().clientId});
  if(doc && doc.tableNumber){
    Meteor.call("table/addClientTablePermission", clientId, doc.tableNumber, callback);
  }else{
    throw `Error: There are no table open.`;
  }
}

const onShownAdded = function() {
  let self = this;


  function timeout(doc, lapseTime=15){
    setToastrOptionWithTapToDismiss();
    const obj = getLapsedTime(doc);
    const msg = `TIMEOUT: Request from ${doc.fromUsername} was made at ${doc.time} (${obj.fromNow}).`;
    notifyTableRequest("warning", doc, msg);
  }

  function getCheckboxIgnoreClient(doc){
    const ignore = $(doc).find("[data-event-action=checkboxIgnoreClient]").is(":checked");
    const data = $(doc).find("[data-event-action=checkboxIgnoreClient]").data();
    return {data: data, ignore: ignore};
  }

  //checkbox ignore client
  $(self).find("[data-event-action=checkboxIgnoreClient]").change(
    function(event){
      event.preventDefault();
      event.stopPropagation();
      console.log("value ", $(event.currentTarget).is(':checked'));
      const ignore = $(event.currentTarget).is(':checked');
      if(ignore){
        $(event.currentTarget).closest(".list-group").find("[data-event-action=btnNotifyOk]").attr("disabled", true);
      }else{
        $(event.currentTarget).closest(".list-group").find("[data-event-action=btnNotifyOk]").attr("disabled", false);
      }
    }
  );

  //ok button
  $(self).find("[data-event-action=btnNotifyOk]").click(
    function(event){
      event.preventDefault();
      event.stopPropagation();
      console.log("btn OK was clicked ", event.currentTarget.dataset);
      const eventMsgid = event.currentTarget.dataset.eventMsgid;
      const eventMsgdate = event.currentTarget.dataset.eventMsgdate;
      const clientId = event.currentTarget.dataset.eventClientid;
      const fromUsername = event.currentTarget.dataset.eventUsername;

      toastr.clear($(self));

      if(!clientId){
        setToastrOptionWithTapToDismiss();
        notifyTableRequest("error", {}, `${fromUsername} has no clientId.`);
        upadateTableRequestDelivered(eventMsgid);
        return;
      }

      if(TableRequestMsg.findOne({_id: eventMsgid})){
        if(isValidateTime(eventMsgdate)){
          try {
            insertClientsTableClient(parseInt(clientId), function(err, result){
              if(err){
                const msg = `Error on insert clientId ${clientId} in ClientsTable for permission on table.`;
                sendTableRequest(parseInt(clientId), msg, "new", "refused", eventMsgid);
                //upadateTableRequestDelivered(eventMsgid);
                throw `Error on insert clientId ${clientId} in ClientsTable for permission on table.`;
              }
              //const username = Meteor.user() && Meteor.user().username || Meteor.user().clientId;
              const username = getUserName();
              if(result.saved){
                const msg = `The client ${username} accepted your request.`;
                //sendTableRequest(parseInt(clientId), msg, "new", "accepted", eventMsgid);
                sendTableRequest({toClientId: parseInt(clientId), msg: msg, status: "new", reason: "accepted",
                  responseToMsgId: eventMsgid, tableName: result.tableName, requesterName: fromUsername});
                //upadateTableRequestDelivered(eventMsgid);
              }else{
                const msg = `The client ${username} refused your request.`;
                sendTableRequest(parseInt(clientId), msg, "new", "refused", eventMsgid);
                //upadateTableRequestDelivered(eventMsgid);
                //throw `Error on insert clientId ${clientId} in ClientsTable for permission on table ${tableName}. Not updated.`;
              }
              return;
            });
          }catch(err){
            Logger.warn({error: err},"Error in insertClientsTableClient");
            let msg = `Error on insert clientId ${clientId} in ClientsTable for permission on table.`;
            sendTableRequest(parseInt(clientId), msg, "new", "refused", eventMsgid);
            //upadateTableRequestDelivered(eventMsgid);
          }
        }else if(!isValidateTime(eventMsgdate)){
          timeout({fromUsername: fromUsername || clientId, time: moment(eventMsgdate).format("DD/MM/YYYY HH:mm")});
          //const username = Meteor.user() && Meteor.user().username || Meteor.user().clientId;
          const username = getUserName();
          const obj = getLapsedTime({createdAt: eventMsgdate});
          const msg = `The request to the client ${username} timeout (${obj.fromNow}).`;
          sendTableRequest(parseInt(clientId), msg, "new", "timeout", eventMsgid);
        }else{
          Logger.warn({error: err},"Error in insertClientsTableClient. No clientId!");
          let msg = `Error on insert clientId ${clientId} in ClientsTable for permission on table.`;
          sendTableRequest(parseInt(clientId), msg, "new", "refused", eventMsgid);
          //upadateTableRequestDelivered(eventMsgid);
        }
        //upadateTableRequestDelivered(eventMsgid);
      }else{
        //setToastrOptionWithTapToDismiss();
        //notifyTableRequest("error", {}, `${fromUsername} remove his request.`);
        const msg = `${fromUsername} remove his request.`;
        sendTableRequest(parseInt(clientId), msg, "new", "refused", eventMsgid);
      }
    }
  );


  //cancel button
  $(self).find("[data-event-action=btnNotifyCancel]").click(
    function(event){
      event.preventDefault();
      event.stopPropagation();
      console.log("btn Cancel was clicked ", event.currentTarget.dataset);
      toastr.clear($(self));
      const fromUsername = event.currentTarget.dataset.eventUsername;
      const eventMsgid = event.currentTarget.dataset.eventMsgid;
      const eventMsgdate = event.currentTarget.dataset.eventMsgdate;
      const dataset = getCheckboxIgnoreClient(self);
      const clientId = dataset.data.eventClientid;
      const ignore = dataset.ignore;

      if(!clientId){
        setToastrOptionWithTapToDismiss();
        notifyTableRequest("error", {}, `${fromUsername} has no clientId.`);
        upadateTableRequestDelivered(eventMsgid);
        return;
      }

      if(ignore){
        updateIgnoresClient(clientId);
      }

      if(TableRequestMsg.findOne({_id: eventMsgid})){
        let reason = "timeout";
        //const username = Meteor.user() && Meteor.user().username || Meteor.user().clientId;
        const username = getUserName();
        //if(clientId){
        let msg;
        if(isValidateTime(eventMsgdate)){
          reason = "refused";
          msg = `The client ${username} refused your request.`;
        }else {
          const obj = getLapsedTime({createdAt: eventMsgdate});
          timeout({fromUsername: fromUsername || clientId, createdAt: moment(eventMsgdate), time: moment(eventMsgdate).format("DD/MM/YYYY HH:mm")});
          msg = `The request to the client ${username} timeout (${obj.fromNow}).`;
        }
        sendTableRequest(parseInt(clientId), msg, "new", reason, eventMsgid);
        /*}else{
          const msg = `Some problems were found. No clientId was found for client ${fromUsername}.`;
          notifyTableRequest("error", {}, msg);
          upadateTableRequestDelivered(eventMsgid);
          //sendTableRequest(parseInt(clientId), msg, "new", "refused", eventMsgid);
        }*/
        //upadateTableRequestDelivered(eventMsgid);
      }else{
        const msg = `${fromUsername} removed his request?`;
        sendTableRequest(parseInt(clientId), msg, "new", "refused", eventMsgid);
      }
    }
  );

}


const checkedAddressBook = function(){
  //"checkoutAddressBook"
  const cart = Cart.findOne({"workflow.workflow": {$in:["checkoutAddressBook"]}});
  if (cart){
    return true;
  }

  return false;

}

const setToastrOptionForRequestPermission= function(){
  toastr.options.closeButton = false;
  toastr.options.tapToDismiss = false;
  toastr.options.onShown = onShownAdded;
}

const setToastrOptionWithTapToDismiss = function(){
  toastr.options.closeButton = true;
  toastr.options.timeOut = 0;
  toastr.options.extendedTimeOut = 0;
  toastr.options.tapToDismiss = true;
}

const setToastrOptionWithProgressBar = function(){
  toastr.options.closeButton = true;
  toastr.options.timeOut = "15000";
  toastr.options.extendedTimeOut = "15000";
  toastr.options.tapToDismiss = true;
  toastr.options.progressBar = true;
}

const getLapsedTime = function(doc){
  dtnow = moment();
  const fromNow = moment(doc.createdAt).fromNow();
  const lapsedTime = moment.duration(dtnow.diff(doc.createdAt));
  const lapseHours = lapsedTime.asHours();
  const lapseMinutes = lapsedTime.asMinutes();
  let pasted = "";
  if(lapseMinutes < 60){
    pasted = "Minutes";
    lapsed = `more than ${parseInt(lapseMinutes)}`;
  }else if(lapseHours < 24){
    pasted = "Hours";
    lapsed = `more than ${parseInt(lapseHours)}`;
  }else{
    pasted = "Days";
    lapsed = "several";
  }

  return {pasted: pasted, lapsed: lapsed, fromNow: fromNow};
}


const getMessagerTimeout = function(){
  const restSet = RestaurantSettings.findOne();
  console.log("getMessagerTimeout ", restSet);
  return restSet.messenger.timeout;
}

const getMessagerDeliverTime = function(){
  const restSet = RestaurantSettings.findOne();
  return restSet.messenger.delivertime;
}

const getDiffTimeMinutes = function(dt){
  const dtnow = moment();
  const dtdoc = moment(dt);
  const lapseTime = moment.duration(dtnow.diff(dtdoc));
  const lapseMinutes = lapseTime.asMinutes();
  return lapseMinutes;
}

const isValidateDeliverTime = function(dt){
  const waitTime = getMessagerDeliverTime();
  //Logger.warn({obj: {createdAt: dt, momnt: moment(dt)}},"isValidateTime ");
  const lapseMinutes = getDiffTimeMinutes(dt);
  if(lapseMinutes <= waitTime){
    return true;
  }

  return false;
}

const isValidateTime = function(dt){
  const waitTime = getMessagerTimeout();
  //Logger.warn({obj: {createdAt: dt, momnt: moment(dt)}},"isValidateTime ");
  const lapseMinutes = getDiffTimeMinutes(dt);
  if(lapseMinutes <= waitTime){
    return true;
  }

  return false;
}

const isClientsTableOpen = function(){
  const doc = ClientsTable.findOne({masterClientNumber: Meteor.user().clientId});
  if(doc && doc.status === "opened"){
    return true;
  }
  return false;
}

const isClientIgnored = function(clientId){
  const doc = ClientsTable.findOne({masterClientNumber: Meteor.user().clientId});
  if(doc && _.includes(doc.ignores, clientId)){
    return true;
  }
  return false;
}

const isClientAccepted = function(clientId){
  const doc = ClientsTable.findOne({masterClientNumber: Meteor.user().clientId});
  if(doc && _.includes(doc.clients, clientId)){
    return true;
  }
  return false;
}

/*const isClientAlreadyChecked = function(clientId){
  const doc = ClientsTable.findOne({masterClientNumber: Meteor.user().clientId});
  const ignored = doc && _.includes(doc.ignores, clientId);
  const allowed = doc && _.includes(doc.clients, clientId);
  if(!ignored && allowed) {
    return true;
  }

  return ignored;
}*/

/*const notifyAndUpdate = function(doc, newmsg){
  toastr.options.closeButton = true;
  toastr.options.timeOut = 0;
  toastr.options.extendedTimeOut = 0;
  toastr.options.tapToDismiss = true;
  let msg = newmsg || `The client ${doc.name} ${doc.status} your request. ${doc.reason || ""}`;
  let newstatus = "processed_accepted";
  if(doc.status === "accepted"){
    notifyTableRequest("success", doc, msg);
  }else{
    newstatus = "processed_refused";
    notifyTableRequest("warning", doc, msg);
  }
  //upadateTableRequestState(doc._id, newstatus);
}*/


const requestTimeout = function(doc, msg){
  setToastrOptionWithTapToDismiss();
  notifyTableRequest("warning", doc, msg);
  //upadateTableRequestState(doc._id, "processed_timeout");
}

/*const requestClosed = function(doc){
  toastr.options.closeButton = true;
  toastr.options.timeOut = 0;
  toastr.options.extendedTimeOut = 0;
  toastr.options.tapToDismiss = true;
  notifyTableRequest("warning", doc, `The table of client ${doc.toId} is already closed.`);
  //upadateTableRequestState(doc._id, "processed_closed");
}*/

const isResponseToRequest = function(doc){
  return doc.responseToMsgId ? true : false;
}

const checkRequestTable = function(doc, clientId){
  if(isClientsTableOpen() && Reaction.hasPermission(["client/table"])){
    setToastrOptionForRequestPermission();
    notifyTableRequest("request", doc);
  }else{//no table
    let username = Meteor.user() && Meteor.user().username;
    let msg = `The client ${username || clientId} refused your request. There is no table open.`;
    sendTableRequest(doc.fromClientId, msg, "new", "closed", doc._id);
    upadateTableRequestDelivered(doc._id);
  }
}


const processRequestNotDelivered = function(doc, thisClientId){

  if(isResponseToRequest(doc)){
    tryToRemoveRequest(doc, thisClientId);
  }else{
    _processRequestNotDelivered(doc, thisClientId);
  }

}

const _processRequestNotDelivered = function(doc, clientId){
  console.log("processRequestNotDelivered");
  if(doc.reason === "request"){
    console.log("processRequestNotDelivered request");
    if(isClientIgnored(doc.fromClientId)){
      //let username = Meteor.user() && Meteor.user().username;
      const username = getUserName();
      const msg = `The client ${username} refused your request.`;
      sendTableRequest(doc.fromClientId, msg, "new", "refused", doc._id);
    }else if(isClientAccepted(doc.fromClientId)){
      //let username = Meteor.user() && Meteor.user().username;
      const username = getUserName();
      const msg = `The client ${username} has accepted your request already.`;
      sendTableRequest(doc.fromClientId, msg, "new", "accepted", doc._id);
    }else{
      checkRequestTable(doc, clientId);
      return;
    }
    upadateTableRequestDelivered(doc._id);
  }else if(doc.reason === "accepted"){
    if(doc.pinned === false){
      notifyTableRequest("success", doc);
    //Restaurant.emmiter.emit("msgAccepted", doc);
    //upadateTableRequestDelivered(doc._id);
      upadateTableRequestPinned(doc._id);
    }
  }else if(doc.reason === "refused"){
    notifyTableRequest("error", doc);
    //Restaurant.emmiter.emit("msgRefused", doc);
    upadateTableRequestDelivered(doc._id);
  }else if(doc.reason === "timeout"){
    notifyTableRequest("warning", doc);
    upadateTableRequestDelivered(doc._id);
  }else if(doc.reason === "closed"){
    notifyTableRequest("warning", doc);
    upadateTableRequestDelivered(doc._id);
  }else if(doc.reason === "waiter"){
    setToastrOptionWithProgressBar();
    notifyTableRequest("info", doc);
    upadateTableRequestDelivered(doc._id);
  }
}

const tryToRemoveRequest = function(doc, thisClientId){

    const msgs = TableRequestMsg.findOne({_id: doc.responseToMsgId, status: "removed"});
    if(msgs && doc.reason === "accepted"){
      _removeRequest(msgs);
      upadateTableRequestDelivered(doc._id);
      //upadateTableRequestSeen(doc._id);
    }else if(msgs && doc.reason === "refused"){
      upadateTableRequestDelivered(doc._id);
    }else{
      _processRequestNotDelivered(doc, thisClientId);
    }
    upadateTableRequestDelivered(doc.responseToMsgId);
}

//remove request if they were already accepted.
const _removeRequest = function(doc){
  const fromClientId = doc.fromClientId;
  const toClientId = doc.toClientId;

  Meteor.call("table/removeClientTablePermission", fromClientId, "", toClientId, function (error, result) {
    if(error){
      console.log("Error in call to table/removeClientTablePermission ", error);
      //TODO: aqui remover a entrada no clientsTable
      return ;
    }
  });
}

/*const processRequestDelivered = function(doc, clientId){
  console.log("processRequestDelivered");
  if(doc.reason === "request"){
    checkRequestMsg(doc, clientId);
  }else{
    notifyTableRequest("info", doc);
    upadateTableRequestDelivered(doc._id);
  }
}*/


const observeRequests = function(msgs, clientId){

    msgs.observe({
          added: function(doc) {
              setToastrOptionWithTapToDismiss();

              if(doc.status === "new" && doc.toClientId === clientId && isValidateTime(doc.changedAt) && doc.fromClientId !== clientId){

                if(!doc.delivered){
                  /*if(doc.responseToMsgId){
                    //this way we can revert removed requests.
                    console.log("hasListeneres ", hasListeners(Restaurant.emmiter, `${doc.responseToMsgId}`));
                    if(hasListeners(Restaurant.emmiter, `${doc.responseToMsgId}`)){
                      Restaurant.emmiter.emit(`${doc.responseToMsgId}`, doc);
                      return;
                    }else{
                      upadateTableRequestDelivered(doc.responseToMsgId);
                    }
                  }*/
                  processRequestNotDelivered(doc, clientId);
                }
              }else if(doc.status === "new" && doc.toClientId === clientId && !isValidateTime(doc.changedAt) && doc.fromClientId !== clientId && doc.pinned === false){
                if(isValidateDeliverTime(doc.changedAt)){//make sense to deliver this message?
                  console.log("timeout");
                  const obj = getLapsedTime(doc);
                  //let msg = `TIMEOUT: Request from ${doc.fromUsername} was made at ${doc.time}. Has pasted ${obj.lapsed} ${obj.pasted}`
                  const time = moment(doc.createdAt).format("DD/MM/YYYY HH:mm");
                  //let msg = `${doc.name || doc.fromId} made a request to your table at ${time}, has pasted ${obj.lapsed} ${obj.pasted}.The request timeout. fromNow ${obj.fromNow}`;
                  let msg = `${doc.name || doc.fromclientId} made a request to your table at ${time}.The request timeout (${obj.fromNow}).`;
                  requestTimeout(doc, msg);
                  upadateTableRequestDelivered(doc._id);
                  upadateTableRequestPinned(doc._id);
                  const username = getUserName();
                  //msg = `Your request to ${Meteor.user().username || clientId} at ${time}, has pasted ${obj.lapsed} ${obj.pasted}.The request timeout. Please try again.`;
                  msg = `Your request to ${username} at ${time}. The request timeout (${obj.fromNow}). Please try again.`;
                  sendTableRequest(doc.fromClientId, msg, "new", "timeout", doc._id);
                }else if(!isValidateDeliverTime(doc.changedAt)){
                  upadateTableRequestDelivered(doc._id);
                  //upadateTableRequestPinned(doc._id);
                }
                //Restaurant.emmiter.emit("msgTimeout", doc);
              }else if(doc.status === "new" && doc.fromClientId === clientId && !isValidateTime(doc.changedAt) && doc.pinned === false){
                upadateTableRequestDelivered(doc._id);
              }else if(doc.status === "removed" && doc.toClientId === clientId /*&& isValidateTime(doc.changedAt)*/ && doc.fromClientId !== clientId){
                const msg = `${doc.name} remove his request.`;
                sendTableRequest(doc.fromClientId, msg, "new", "refused", doc._id);
              }else if(doc.toClientId === clientId && doc.fromClientId !== clientId && doc.pinned === false){
                const msg = `${doc.name} message is unknown.`;
                console.log("response unknown messages ", doc._id)
                sendTableRequest(doc.fromClientId, msg, "new", "refused", doc._id);
              }

              Logger.warn({added:{doc: doc, clientId: clientId, valid: isValidateTime(doc.changedAt)}},"message added");
          }/*,
          removed: function(doc) {
              toastr.options.closeButton = true;
              toastr.options.timeOut = 0;
              toastr.options.extendedTimeOut = 0;
              toastr.options.tapToDismiss = true;

              Logger.warn({removed: {doc: doc}},"message removed");
          },
          changed: function(newdoc, olddoc) {
            Logger.warn({changed: {newdoc: newdoc, olddoc: olddoc}},"message changed");
          },*/
    });
}



/*const observeRequests = function(msgs){
    msgs.observe({
          added: function(doc) {
              if(doc.status === "new" && doc.toId === clientId && isValidateTime(doc.changedAt)){
                toastr.options.closeButton = false;
                toastr.options.timeOut = 0;
                toastr.options.extendedTimeOut = 0;
                toastr.options.tapToDismiss = false;
                //toastr.options.onCloseClick = function() { console.log('close button clicked'); };
                toastr.options.onShown = onShownAdded;
                //toastr.options.onclick = function() { console.log('clicked'); };
                //toastr.options.onHidden = function() { console.log('goodbye'); };
                if(Reaction.hasPermission("client/table") && isClientsTableOpen() && !isClientAlreadyChecked(doc.fromId)){//only if already has a table
                  notifyTableRequest("info", doc);
                }else if(Reaction.hasPermission("client/table") && !isClientsTableOpen()){
                  upadateTableRequestState(doc._id, "closed");
                }else if(Reaction.hasPermission("client/table") && isClientIgnored(doc.fromId)){
                  upadateTableRequestState(doc._id, "refused");
                }else if(Reaction.hasPermission("client/table") && isClientAccepted(doc.fromId)){
                  upadateTableRequestState(doc._id, "accepted", `Request have been already accepted.`);
                }else if(!Reaction.hasPermission("client/table")){
                  upadateTableRequestState(doc._id, "refused", `No table open for client ${doc.toId}.`);//ignore every thing else.
                }
                else{
                  upadateTableRequestState(doc._id, "ignored");//ignore every thing else.
                }
              }else if((doc.status === "accepted" || doc.status === "refused") && doc.toId === clientId && isValidateTime(doc.changedAt)){
                notifyAndUpdate(doc);
              }else if(doc.fromId === clientId && !isValidateTime(doc.changedAt)){
                toastr.options.closeButton = true;
                toastr.options.timeOut = 0;
                toastr.options.extendedTimeOut = 0;
                toastr.options.tapToDismiss = true;
                notifyTableRequest("warning", doc, `Was passed more than ${lapseTime} minutes after your request to client ${doc.toId}.`);
                upadateTableRequestState(doc._id, "timeout");
              }else if(doc.fromId === clientId && doc.status === "timeout"){
                requestTimeout(doc);
              }else if(doc.fromId === clientId && doc.status === "closed"){
                requestClosed(doc);
              }else if(doc.status === "ignored"){
                upadateTableRequestState(doc._id, "processed_ignored");
              }

              Logger.warn({added:{doc: doc}},"message added");
          },
          removed: function(doc) {
              toastr.options.closeButton = true;
              toastr.options.timeOut = 0;
              toastr.options.extendedTimeOut = 0;
              toastr.options.tapToDismiss = true;

              if(doc.status !== "processed_timeout" && doc.status !== "processed_closed" && doc.status !== "processed_accepted" && doc.status !== "processed_refused" && doc.status !== "processed_ignored" && isValidateTime(doc.changedAt)){
                if(doc.fromId === clientId){
                  notifyTableRequest("error", doc, `removed error id ${doc._id} status ${doc.status}`);
                }
              }else if(doc.fromId === clientId && !isValidateTime(doc.changedAt) && doc.status !== "processed_ignored"){
                notifyTableRequest("warning", doc, `TIMEOUT: Was passed more than ${lapseTime} minutes after your request to client ${doc.toId}.`);
              }else if(!doc.status.startsWith("processed")){
                upadateTableRequestState(doc._id, "processed_ignored");
              }
              Logger.warn({removed: {doc: doc}},"message removed");
          },
          changed: function(newdoc, olddoc) {
              if((newdoc.status === "accepted" || newdoc.status === "refused") && newdoc.fromId === clientId && isValidateTime(newdoc.changedAt)){
                notifyAndUpdate(newdoc);
              }else if(newdoc.status === "closed" && newdoc.fromId === clientId && isValidateTime(newdoc.changedAt)){
                //notifyAndUpdate(newdoc, `The table of client ${newdoc.toId} is already closed.`);
                requestClosed(newdoc);
              }else if(newdoc.fromId === clientId && newdoc.status === "timeout"){
                requestTimeout(doc);
              }else if(newdoc.fromId === clientId && newdoc.status === "closed"){
                requestClosed(doc);
              }else if(newdoc.status === "ignored"){
                upadateTableRequestState(newdoc._id, "processed_ignored");
              }
              Logger.warn({changed: {newdoc: newdoc, olddoc: olddoc}},"message changed");
          },
    });
}*/

const Messenger = {
  observeRequests,
  upadateTableRequestDelivered,
  upadateTableRequestState,
  upadateTableRequestPinned,
  updateIgnoresClient,
  //askTablePermission,
  sendTableRequest,
  sendTableNotification,
  notifyTableRequest,
  processRequestNotDelivered,
  isValidateTime
}


const MyEventEmitterClass = function () {};
eventemitter(MyEventEmitterClass.prototype); // All instances of MyClass will expose event-emitter itnterface


emitter = new MyEventEmitterClass();

Restaurant.emmiter = emitter;
Restaurant.hasListeners = hasListeners;

RestMessager = toastr;

Object.assign(Restaurant, {Messenger: Messenger}, {toastr: toastr});

changeToastrOptions();
