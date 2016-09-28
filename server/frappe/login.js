import { Meteor } from "meteor/meteor";
import { EJSON } from 'meteor/ejson';
import { Restaurant } from "../";

const get_frappe_url = function(){
  if (Meteor.settings) {
      const frappe_url = Meteor.settings.FRAPPE_URL || "http://localhost";
      return frappe_url;
  }

  return "http://localhost";
  //const json = Assets.getText("custom/data/tablesMap.json");
  //const frappe_url = EJSON.parse(json);

}

const get_frappe_url_logout = function(){
  return get_frappe_url() + "/api/method/logout";
}

const get_frappe_url_login = function(){
  return get_frappe_url() + "/api/method/login";
}

const frappe_logout = function(cookies){
  try {
    const headers = {};
    let cookie = cookies;
    const userId = this.userId;
    if(!cookie){
      cookie = Meteor.users.findOne({_id:userId}, {fields:{cookies:1}});
    }
    headers.Cookie = cookie;
    const result = HTTP.call("GET", get_frappe_url_logout(), {headers: headers});
    Meteor.users.update({_id:userId}, {$set:{cookies: result.headers["set-cookie"]}});
    return result;
  } catch (e) {
    // Got a network error, time-out or HTTP error in the 400 or 500 range.
    return {data:{message: "Not Logged Out", error_status: true, error_msg: e}};
  }
}

const frappe_login = function(user, pwd){
  try {
    const result = HTTP.call("POST", get_frappe_url_login(),
                         {params: {usr: user, pwd: pwd}});
    Meteor.users.update({_id:this.userId}, {$set:{cookies: result.headers["set-cookie"]}});
    return result;
  } catch (e) {
    // Got a network error, time-out or HTTP error in the 400 or 500 range.
    return {data:{message: "Not Logged In", error_status: true, error_msg: e}};
  }
}

Meteor.methods(
  {
    frappeLogin: function (user, pwd) {
      check(user, String);
      check(pwd, String);
      this.unblock();
      const login = frappe_login.bind(this);
      return login(user, pwd);
    },
    frappeLogout: function(cookies){
      check(cookies, Match.Maybe([String]));
      this.unblock();
      const logout = frappe_logout.bind(this);
      return logout(cookies);
    }
});

Restaurant.frappeLogin = frappe_login;
Restaurant.frappeLogout = frappe_logout;
