import { Session } from "meteor/session";
import { Logger } from "/client/api";

Session.set("DEFAULT_LAYOUT", "coreLayoutBeesknees");
Logger.info("setting DEFAULT_LAYOUT");

Session.set("DEFAULT_WORKFLOW", "coreProductWorkflow");
Logger.info("setting DEFAULT_WORKFLOW");

Session.set("INDEX_OPTIONS", {
  layout: "coreLayoutBeesknees",
  template: "my_custom_template",
  layoutHeader: "layoutHeaderBeesknees",
  layoutFooter: "layoutFooterBeesknees",
  notFound: "notFound",
  dashboardControls: "dashboardControls",
  adminControlsFooter: "adminControlsFooter"
});
Logger.info("setting INDEX_OPTIONS");
