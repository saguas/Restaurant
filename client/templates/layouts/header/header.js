import { Template } from "meteor/templating";
import { Tags } from "/lib/collections";
import { Reaction } from "/client/api";
import { $ } from "meteor/jquery";

/**
 * layoutHeader events
 */
Template.layoutHeaderBeesknees.events({
  "click .navbar-accounts .dropdown-toggle": function () {
    return setTimeout(function () {
      return $("#login-email").focus();
    }, 100);
  },
  "click .header-tag, click .navbar-brand": function () {
    return $(".dashboard-navbar-packages ul li").removeClass("active");
  }
});

Template.layoutHeaderBeesknees.helpers({
  TagNav() {
    return ReactionUI.TagNav.Components.TagNav;
  },

  coreNavProps() {
    const instance = Template.instance();
    return {
      onMenuButtonClick() {
        instance.toggleMenuCallback();
      }
    };
  },

  tagNavProps() {
    const instance = Template.instance();
    let tags = [];

    tags = Tags.find({
      isTopLevel: true
    }, {
      sort: {
        position: 1
      }
    }).fetch();

    return {
      name: "coreHeaderNavigation",
      editable: Reaction.hasAdminAccess(),
      tags: tags,
      onToggleMenu(callback) {
        // Register the callback
        instance.toggleMenuCallback = callback;
      }
    };
  }
});
