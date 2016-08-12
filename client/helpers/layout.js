import _ from "lodash";
import Logger from "/client/modules/logger";
import { Reaction } from "/client/api";
import * as Collections from "/lib/collections";
import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";

/**
 * reactionTemplate helper
 * use the reactionTemplate helper when you are using templates defined
 * as workflow templates in the package registery.Layout
 * use "collection" on the layout to indicate a workflow source
 *
 * @summary reactionTemplate provides templates as defined in ReactionRegistry.Layout
 * @param {Object} options - workflow defaults to "coreLayout/coreWorkflow"
 * @returns {Array} returns an array with labels, templates that match workflow
 */
Template.registerHelper("myreactionTemplate", function (options) {
  //console.log("myreactionTemplate ", options);
  const shopId = options.hash.shopId || Reaction.getShopId();
  // get shop info, defaults to current
  const Shop = Collections.Shops.findOne(shopId);
  const reactionTemplates = [];
  // fetch collection from shop.layout configuration
  let layout = _.find(Shop.layout, {
    workflow: options.hash.workflow || "coreTableWorkflow"
  });

  let layoutConfigCollection;
  let currentId;

  // determine if workflow has a target
  // collection defined. This is where we'll
  // fetch/save workflow changes.
  if (layout) {
    layoutConfigCollection = layout.collection || "ClientsTable";
  } else {
    Logger.error("Shop Layout Undefined");
    layoutConfigCollection = "ClientsTable";
  }

  // if we've got an id, we'll use it with the layout's collection
  // and get the current status of the workflowTargetCollection
  /*if (Template.currentData() && Template.currentData()._id) {
    currentId = Template.currentData()._id;
  } else {
    const currentClientsTable = (Collections[layoutConfigCollection] || Reaction.Collections[layoutConfigCollection]).findOne({
      userId: Meteor.userId()
    });
    currentId = currentClientsTable && currentClientsTable._id;
  }*/
  // we'll get current cart status by default, as the most common case
  // TODO: expand query options
  currentId = options.hash.id;// || currentId;

  delete options.hash.id;

  let workflowTargetCollection;
  let currentCollection;
  let currentStatus;
  let currentCollectionWorkflow;

  if(currentId){
    //Logger.warn({obj:{currentId: currentId, options: options.hash, template_currdata: Template.currentData()}}, "CurrentId");
    // The currentCollection must have workflow schema attached.
    // layoutConfigCollection is the collection defined in Shops.workflow
    workflowTargetCollection = Collections[layoutConfigCollection] || Reaction.Collections[layoutConfigCollection];
    currentCollection = workflowTargetCollection.findOne(currentId);
    //Logger.warn({obj:{currentId: currentId, options: options.hash, layoutConfigCollection: layoutConfigCollection, workflowTargetCollection: workflowTargetCollection, currentCollection: currentCollection}}, "CurrentId");
    currentStatus = currentCollection.workflow.status;
    currentCollectionWorkflow = currentCollection.workflow.workflow;
  }

  const packages = Collections.Packages.find({
    layout: {
      $elemMatch: options.hash
    },
    shopId: shopId
  });

  //  we can have multiple packages contributing to the layout / workflow
  packages.forEach(function (reactionPackage) {
    const layoutWorkflows = _.filter(reactionPackage.layout, options.hash);
    //Logger.warn({obj:{layoutWorkflows: layoutWorkflows, reactionPackage_layout: reactionPackage.layout, options: options.hash}}, "layoutWorkflows");
    // check the packages for layout workflow templates
    for (layout of layoutWorkflows) {
      // audience is layout permissions
      if (layout.audience === undefined) {
        layout.audience = Shop.defaultRoles || "owner";
      }
      //Logger.warn({obj:{layout: layout}}, "layout for each packages");
      // check permissions so you don't have to on template.
      if (Reaction.hasPermission(layout.audience)) {
        // todo: review this hack to remove layout
        // from the workflow
        if (!layout.layout) {
          // default is boolean false status
          // true = we've completed this workflow
          // false = pending (future) step
          // <template> = in process (current) step.
          if(currentCollectionWorkflow){
            layout.status = _.includes(currentCollectionWorkflow, layout.template);
            // if the current template is already the current status
            if (layout.template === currentStatus) {
              layout.status = currentStatus;
            }
          }else{
            layout.status = false;
          }
            // push to reactionTemplates
            reactionTemplates.push(layout);
        }
      }
    }
  });

  console.log("in layout reactionTemplates ", reactionTemplates);
  return reactionTemplates;
});
