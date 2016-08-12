import _ from "lodash";
import { Meteor } from "meteor/meteor";
import { Blaze } from 'meteor/blaze'
import { check } from 'meteor/check';
import { Template } from "meteor/templating";
import { Session } from "meteor/session";
import { Tracker } from 'meteor/tracker';
import { Reaction, Logger } from "/client/api";
import { Restaurant, TableRequestMsg, ClientsTable } from "../../lib";
import "toastr/toastr.less";
import toastr from "toastr";

const lapseTime = 15;
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


const upadateTableRequestState = function(id, newstate, reason=""){
  check(newstate, String);
  check(id, String);

  console.log(`in upadateTableRequestState id ${id} state ${newstate}`);
  _upadateTableRequestState(id, newstate, reason);

}


const _upadateTableRequestState = function(id, state, reason=""){
  const shopId = Reaction.getShopId();
  //const request = Object.assign({}, doc, {shopId: shopId});
  TableRequestMsg.update({_id:id}, {$set:{status: state, changedAt: new Date(), reason: reason}});
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

const dbnotify = function(doc){
  const shopId = Reaction.getShopId();
  const request = Object.assign({}, doc, {shopId: shopId});
  TableRequestMsg.insert(request);
}

const notify = function(type, doc, newmsg){
  switch (type) {
    case "info":
      doc.msg = `The client <strong>${doc.name}</strong> ask permission to make request in your table.`;
      toastr["info"](Blaze.toHTMLWithData(Template.restaurantNotify, {doc: doc, date: moment(doc.changedAt).format()}));
      break;
    case "warning":
      toastr.warning(newmsg);
      break;
    case "success":
      toastr.success(newmsg);
      break;
    case "error":
      toastr.error(newmsg);
      break;
    default:
        toastr.info(newmsg);
  }

}


const askTablePermission = function(toId, tableName){
    check(toId, Number);
    check(tableName, String);
    const thisUser = Meteor.user();
    const clientId = thisUser.clientId;
    const msg = `The client ${thisUser.username} ask permission to make request to table ${tableName}.`;
    const doc = {fromId: clientId, toId: toId, msg: msg, name: thisUser.username, status:"new", tableName: tableName};

    dbnotify(doc);
}

const askClientTablePermission = function(toId){
    check(toId, Number);

    const thisUser = Meteor.user();
    const clientId = thisUser.clientId;
    const msg = `The client ${thisUser.username} ask permission to make request in your table.`;
    const doc = {fromId: clientId, toId: toId, msg: msg, name: thisUser.username, status:"new"};
    dbnotify(doc);
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
  console.log('hello ', this);
  let self = this;


  function timeout(doc, lapseTime=15){
    toastr.options.closeButton = true;
    toastr.options.timeOut = 0;
    toastr.options.extendedTimeOut = 0;
    toastr.options.tapToDismiss = true;
    notifyTableRequest("warning", doc, `TIMEOUT: Was passed more than ${lapseTime} minutes after this request from client ${doc.fromId}.`);
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
      /*let dataset = getCheckboxIgnoreClient(self);
      const clientId = dataset.eventClientid;
      const ignore = dataset.ignore;
      console.log(`clientId ${clientId} ignore ${ignore}`);*/
      toastr.clear($(self));
      if(isValidateTime(eventMsgdate) && clientId){
        try {
          insertClientsTableClient(parseInt(clientId), function(err, result){
            if(err){
              throw `Error on insert clientId ${clientId} in ClientsTable for permission on table ${tableName}.`;
            }
            upadateTableRequestState(eventMsgid, "accepted");
          });
        }catch(err){
          Logger.warn({error: err},"Error in insertClientsTableClient");
        }
      }else if(!isValidateTime(eventMsgdate) && clientId){
        timeout({fromId: eventMsgid});
        upadateTableRequestState(eventMsgid, "timeout");
      }else{
        Logger.warn({error: err},"Error in insertClientsTableClient. No clientId!");
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
      let eventMsgid = event.currentTarget.dataset.eventMsgid;
      let eventMsgdate = event.currentTarget.dataset.eventMsgdate;
      let dataset = getCheckboxIgnoreClient(self);
      const clientId = dataset.data.eventClientid;
      const ignore = dataset.ignore;
      if(ignore){
        updateIgnoresClient(clientId);
      }
      if(isValidateTime(eventMsgdate)){
        upadateTableRequestState(eventMsgid, "refused");
      }else {
        timeout({fromId: eventMsgid});
        upadateTableRequestState(eventMsgid, "timeout");
      }
    }
  );

}

const getDiffTimeMinutes = function(dt){
  const dtnow = moment();
  const dtdoc = moment(dt);
  const lapseTime = moment.duration(dtnow.diff(dtdoc));
  const lapseMinutes = lapseTime.asMinutes();
  return lapseMinutes;
}

const isValidateTime = function(dt, waitTime=15){
  Logger.warn({obj: {createdAt: dt, momnt: moment(dt)}},"isValidateTime ");
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

const isClientAlreadyChecked = function(clientId){
  const doc = ClientsTable.findOne({masterClientNumber: Meteor.user().clientId});
  const ignored = doc && _.includes(doc.ignores, clientId);
  const allowed = doc && _.includes(doc.clients, clientId);
  if(!ignored && allowed) {
    return true;
  }

  return ignored;
}

const notifyAndUpdate = function(doc, newmsg){
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
  upadateTableRequestState(doc._id, newstatus);
}


const requestTimeout = function(doc){
  toastr.options.closeButton = true;
  toastr.options.timeOut = 0;
  toastr.options.extendedTimeOut = 0;
  toastr.options.tapToDismiss = true;
  notifyTableRequest("warning", doc, `Was passed more than ${lapseTime} minutes after your request to client ${doc.toId}.`);
  upadateTableRequestState(doc._id, "processed_timeout");
}

const requestClosed = function(doc){
  toastr.options.closeButton = true;
  toastr.options.timeOut = 0;
  toastr.options.extendedTimeOut = 0;
  toastr.options.tapToDismiss = true;
  notifyTableRequest("warning", doc, `The table of client ${doc.toId} is already closed.`);
  upadateTableRequestState(doc._id, "processed_closed");
}


Tracker.autorun(function () {
  if(Meteor.user()){
    const sub = Meteor.subscribe('UserClientId', Meteor.userId());
    if(sub.ready()){
      let clientId = Meteor.user().clientId;
      const clisub = Meteor.subscribe('ClientsTable', clientId);
      if(clisub.ready()){
        Meteor.subscribe('TableRequestMsg', Meteor.userId(), clientId);
        var msgs = TableRequestMsg.find();
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
      }
    }
  }
});

const Messager = {
  upadateTableRequestState,
  updateIgnoresClient,
  askTablePermission,
  askClientTablePermission,
  notifyTableRequest
}

RestMessager = toastr;

Object.assign(Restaurant, {Messager: Messager}, {toastr: toastr});

changeToastrOptions();
