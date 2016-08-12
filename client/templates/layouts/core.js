import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";

Template.coreLayoutBeesknees.helpers({
  permissions: function(){
    return ["employee/master", "admin", "owner", "employee/employee"];
  },
  registerUser: function(){
    let clientId = Meteor.users.findOne().clientId;

    if(clientId){
      return true;
    }

    return false;
  }
  
});
