import { Meteor } from "meteor/meteor";
import { Reaction, Hooks, Logger } from "/server/api";
import { Shops } from "/lib/collections";
import { RestaurantSettings } from "../../lib";



if (Hooks) {
    Hooks.Events.add("afterCoreInit", () => {
      const shopId = Reaction.getShopId();
      let DELIVER_TIME;
      let TIMEOUT;
      let MAX_REFUSED;
      let Messenger;
      // but we can override with provided `meteor --settings`
      if (Meteor.settings) {
        if (Meteor.settings.reaction) {
          Messenger = Meteor.settings.reaction.MESSENGER || [];
        }

        if(Messenger){
          DELIVER_TIME = Messenger.DELIVER_TIME;//minutes
          TIMEOUT = Messenger.TIMEOUT;//minutes
          //nº of times in a row that a request can be refused before block messages from user.
          //if between refused messages the user get a accepted message than the process starts again.
          MAX_REFUSED = Messenger.MAX_REFUSED;
        }

        const restSet = RestaurantSettings.findOne();
        if(!restSet){
          const doc = {
            shopId: shopId,
            messenger:{
              delivertime: DELIVER_TIME || 300,
              timeout: TIMEOUT || 15,
              maxrefused: MAX_REFUSED || 5
            }
          };
          RestaurantSettings.insert(doc);
        }
      }
      Hooks.Events.run("afterRestaurantSettings", {});
    });
};
