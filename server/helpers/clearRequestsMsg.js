import _ from "lodash";
import { Meteor } from "meteor/meteor";
import { Restaurant, TableRequestMsg, RestaurantSettings } from "../../lib";
import { Reaction, Logger, Hooks } from "/server/api";
import { Jobs } from "/lib/collections";
import moment from "moment-timezone";


Hooks.Events.add("onJobServerStart", () => {
  let delay = getDelivertimeInHours();
  delay = delay > 2 ? delay - 1 : delay;
  Logger.info("Adding Job Clear Request Messages delay: ", delay);
  new Job(Jobs, "Messager/clearMsgTimeout", {})
    .priority("normal")
    .retry({
      retries: 5,
      wait: 60000,
      backoff: "exponential"
    })
    .repeat({
      //schedule: Jobs.later.parse.text(`every ${delay} minutes`)
      //schedule: Jobs.later.parse.text(`every 15 minutes`)
      schedule: Jobs.later.parse.text(`every ${delay} hours`)
    })
    .save({
      cancelRepeats: true
    });
});


export default function () {
  console.log("creating job Messager/clearMsgTimeout ");
  Jobs.processJobs("Messager/clearMsgTimeout",
    {
      pollInterval: 60 * 60 * 1000,
      workTimeout: 180 * 1000
    },
    (job, callback) => {
      let removed = clearRequestsMsg();
      job.done(removed, { repeatId: true });
      return callback();
    });
}


const getDelivertimeInMiliSeconds = function(){
  const delay = 1000*60;//minutes
  const delivertime = RestaurantSettings.findOne().messenger.delivertime;//in minutes
  return delivertime*delay;
}

const getDelivertimeInMinutes = function(){
  return RestaurantSettings.findOne().messenger.delivertime;//in minutes
}

const getDelivertimeInHours = function(){
  let delay = RestaurantSettings.findOne().messenger.delivertime;//in minutes
  return delay/60;
}

//const delay = 1000*10;
const clearRequestsMsg = function(){
    let delay = getDelivertimeInHours();
    const dt = moment().add(-delay, "hours").toDate();
    //const dt = moment().add(-5, "minutes").toDate();
    const removed = TableRequestMsg.remove({delivered: true, changedAt:{
      $lte : dt
    }});
    Logger.warn({obj:{"delay in hours": delay, removed: removed, dtnow: moment(), removeData: dt}}, "******** removed request messages");
    return removed;
}
/*
if (Hooks) {
  Hooks.Events.add("afterRestaurantSettings", () => {
    const delay = getDelivertimeInMiliSeconds();
    Logger.warn({obj:{delay: delay, dtnow: moment()}}, "******** start setInterval for removed request messages");
    Meteor.setInterval(clearRequestsMsg(delay), 1000*60*60);
  });
}
*/
