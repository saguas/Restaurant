import { ClientCounters } from "../../lib";
import { Reaction, Logger } from "/server/api";
import { Meteor } from "meteor/meteor";


const clientCounters = ClientCounters.find();

if (clientCounters.count() == 0) {
  Meteor.users._ensureIndex( { "clientId" : 1 } );
  ClientCounters.insert(
     {
        _id: 'autoincrement',
        seq: 0
     }
  );

}
