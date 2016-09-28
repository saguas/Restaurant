import { Meteor } from "meteor/meteor";
import { EJSON } from 'meteor/ejson';
import { Restaurant } from "../../lib";

const get_cookies_name = function(){
  const cookies_name = ["system_user", "sid", "full_name", "user_id", "user_image"];
  return cookies_name;
}

const set_cookies = function(cookies){
  for (cookie of cookies){
    document.cookie = cookie;
  }
}

const reset_cookies = function(cookies){
  for (cookie of cookies){
    document.cookie = cookie + "=;";
  }
}

//Meteor.call("frappeLogin", "Administrator", "8950388", function (error, result) {console.log("result frappe login ", result)});
const frappeLogin = function(user, pwd, callback){
  Meteor.call("frappeLogin", user, pwd, function (error, result) {

    if(error){
      console.log("error in frappe login ", error);
      const error_obj = {data:{message: "Not Logged In", error_status: true, error_msg: error}};
      if (callback)
        return callback(error_obj);
      return error_obj;
    };
    console.log("result frappe login ", result);
    set_cookies(result.headers["set-cookie"]);
    if (callback)
      return callback(result);
  });
}

const frappeLogout = function(cookies, callback){
  Meteor.call("frappeLogout", cookies, function (error, result) {

    if(error){
      console.log("error in frappe logout ", error);
      const error_obj = {data:{message: "Not Logged Out", error_status: true, error_msg: error}};
      if (callback)
        return callback(error_obj);
      return error_obj;
    };
    console.log("result frappe logout ", result);
    set_cookies(result.headers["set-cookie"]);
    if (callback)
      return callback(result);
  });
}


Restaurant.frappeLogin = frappeLogin;
Restaurant.frappeLogout = frappeLogout;
