import { Reaction, Logger, Hooks } from "/server/api";
import { ClientCounters } from "../../lib";
import { Meteor } from "meteor/meteor";


if (Hooks) {
    Hooks.Events.add("onCreateUser", (user, options) => {
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
    });
}


const nextAutoincrement = function(collection) {
  let obj = Meteor.wrapAsync(doAutoincrement)(collection);
  Logger.warn({nextAutoincrement: obj}, "nextAutoincrement object");
  if(obj && obj.lastErrorObject.updatedExisting){
    return obj.value.seq;
  }
  process.exit(-1);
}

const doAutoincrement = function(collection, callback) {
  collection.rawCollection().findAndModify({
    _id: 'autoincrement'
  }, [], {
    $inc: {
      seq: 1
    }
  }, {
    'new': true
  }, callback);
}
