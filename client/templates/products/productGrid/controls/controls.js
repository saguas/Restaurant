import _ from "lodash";
import { Session } from "meteor/session";
import { Template } from "meteor/templating";

Template.gridControlsBeesknees.onRendered(function () {
  return this.$("[data-toggle='tooltip']").tooltip({
    position: "top"
  });
});

Template.gridControlsBeesknees.helpers({
  checked: function () {
    const selectedProducts = Session.get("productGrid/selectedProducts");
    return _.isArray(selectedProducts) ? selectedProducts.indexOf(this._id) >= 0 : false;
  }
});
