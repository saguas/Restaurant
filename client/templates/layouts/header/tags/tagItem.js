import $ from "jquery";
import { Reaction } from "/client/api";
import { Tags } from "/lib/collections";
import classnames from "classnames";

require("jquery-ui");

Template.tagItemBeesknees.helpers({
  tagBlankProps() {
    const instance = Template.instance();
    return {
      onTagCreate: instance.data.onTagCreate
    };
  },

  tagEditableProps(tag) {
    const instance = Template.instance();

    return {
      tag,
      controls: _.map(instance.data.controls, (control) => {
        return {
          ...control,
          toggleOn() {
            if (control.toggleOn) {
              if (_.isFunction(control.toggleOn)) {
                return control.toggleOn(tag);
              }

              return control.toggleOn;
            }
          },
          onClick(event) {
            // Call the original onClick and add the current tag
            control.onClick(event, tag);
          }
        };
      }),
      className: instance.data.className,
      isSelected: instance.data.isSelected,
      selectable: instance.data.selectable,
      onTagRemove: instance.data.onTagRemove,
      onTagSelect: instance.data.onTagSelect,
      onTagUpdate: instance.data.onTagUpdate
    };
  }
});

Template.tagEditableBeesknees.onCreated(function () {
  // this.autorun(() => {
  //   new SimpleSchema({
  //     tag: {type: }
  //   })
  // })
});

Template.tagEditableBeesknees.onRendered(function () {
  const instance = Template.instance();
  const textInput = instance.$("input")[0];

  $(textInput).autocomplete({
    delay: 0,
    source: function (request, response) {
      let datums = [];
      let slug = Reaction.getSlug(request.term);
      Tags.find({
        slug: new RegExp(slug, "i")
      }).forEach(function (tag) {
        return datums.push({
          label: tag.name
        });
      });
      return response(datums);
    },
    select: (selectEvent, ui) => {
      if (ui.item.value) {
        if (instance.data.onTagUpdate) {
          instance.data.onTagUpdate(instance.data.tag._id, ui.item.value);
        }
      }
    }
  });

  this.updateTag = () => {
    const input = instance.$("input");
    const value = input.val().trim();

    if (this.data.onTagUpdate && _.isEmpty(value) === false) {
      this.data.onTagUpdate(this.data.tag._id, value);
    }
  };
});

Template.tagEditableBeesknees.helpers({
  className() {
    const instance = Template.instance();

    return classnames(instance.data.className, {
      selected: instance.data.classes
    });
  },

  handleTagSelect() {
    const instance = Template.instance();
    return () => {
      // Pass the tag back up to the parent component
      if (instance.data.onTagSelect) {
        instance.data.onTagSelect(instance.data.tag);
      }
    };
  },
  handleTagRemove() {
    const instance = Template.instance();
    return () => {
      // Pass the tag back up to the parent component
      if (instance.data.onTagRemove) {
        instance.data.onTagRemove(instance.data.tag);
      }
    };
  }
});

Template.tagEditableBeesknees.events({
  "blur input"(event, instance) {
    instance.updateTag();
  },

  "keydown input"(event, instance) {
    // 9 == Tab key
    // 13 == Enter Key
    if (event.keyCode === 9 || event.keyCode === 13) {
      instance.updateTag();
    }
  }
});

Template.tagBlankBeesknees.onRendered(function () {
  const instance = Template.instance();
  const textInput = instance.$("input")[0];

  $(textInput).autocomplete({
    delay: 0,
    source: function (request, response) {
      let datums = [];
      let slug = Reaction.getSlug(request.term);
      Tags.find({
        slug: new RegExp(slug, "i")
      }).forEach(function (tag) {
        return datums.push({
          label: tag.name
        });
      });
      return response(datums);
    },
    select: (selectEvent, ui) => {
      if (ui.item.value) {
        if (instance.data.onTagUpdate) {
          instance.data.onTagUpdate(instance.data.tag._id, ui.item.value);
        }
      }
    }
  });

  this.submitInput = () => {
    const input = instance.$("input");
    const value = input.val().trim();

    if (this.data.onTagCreate && _.isEmpty(value) === false) {
      this.data.onTagCreate(value);
    }

    input.val("");
  };
});

Template.tagBlankBeesknees.helpers({});

Template.tagBlankBeesknees.events({
  "blur input"(event, instance) {
    instance.submitInput();
  },

  "keydown input"(event, instance) {
    // 9 == Tab key
    // 13 == Enter Key
    if (event.keyCode === 9 || event.keyCode === 13) {
      instance.submitInput();
    }
  }
});

/*

//"use strict";
import $ from "jquery";
import { Tags } from "/lib/collections";
import { Template } from "meteor/templating";
import classnames from "classnames";

//const $ = require("jquery");
// load modules
require("jquery-ui");
const classnames = ReactionUI.Lib.classnames;

Template.tagItemBeesknees.helpers({
  tagBlankProps() {
    const instance = Template.instance();
    return {
      onTagCreate: instance.data.onTagCreate
    };
  },

  tagEditableProps(tag) {
    const instance = Template.instance();

    return {
      tag,
      controls: _.map(instance.data.controls, (control) => {
        return {
          ...control,
          toggleOn() {
            if (control.toggleOn) {
              if (_.isFunction(control.toggleOn)) {
                return control.toggleOn(tag);
              }

              return control.toggleOn;
            }
          },
          onClick(event) {
            // Call the original onClick and add the current tag
            control.onClick(event, tag);
          }
        };
      }),
      className: instance.data.className,
      isSelected: instance.data.isSelected,
      selectable: instance.data.selectable,
      onTagRemove: instance.data.onTagRemove,
      onTagSelect: instance.data.onTagSelect,
      onTagUpdate: instance.data.onTagUpdate
    };
  }
});

Template.tagEditableBeesknees.onCreated(function () {
  // this.autorun(() => {
  //   new SimpleSchema({
  //     tag: {type: }
  //   })
  // })
});

Template.tagEditableBeesknees.onRendered(function () {
  const instance = Template.instance();
  const textInput = instance.$("input")[0];

  $(textInput).autocomplete({
    delay: 0,
    source: function (request, response) {
      let datums = [];
      let slug = getSlug(request.term);
      Tags.find({
        slug: new RegExp(slug, "i")
      }).forEach(function (tag) {
        return datums.push({
          label: tag.name
        });
      });
      return response(datums);
    },
    select: (selectEvent, ui) => {
      if (ui.item.value) {
        if (instance.data.onTagUpdate) {
          instance.data.onTagUpdate(instance.data.tag._id, ui.item.value);
        }
      }
    }
  });

  this.updateTag = () => {
    const input = instance.$("input");
    const value = input.val().trim();

    if (this.data.onTagUpdate && _.isEmpty(value) === false) {
      this.data.onTagUpdate(this.data.tag._id, value);
    }
  };
});

Template.tagEditableBeesknees.helpers({
  className() {
    const instance = Template.instance();

    return classnames(instance.data.className, {
      selected: instance.data.classes
    });
  },

  handleTagSelect() {
    const instance = Template.instance();
    return () => {
      // Pass the tag back up to the parent component
      if (instance.data.onTagSelect) {
        instance.data.onTagSelect(instance.data.tag);
      }
    };
  },
  handleTagRemove() {
    const instance = Template.instance();
    return () => {
      // Pass the tag back up to the parent component
      if (instance.data.onTagRemove) {
        instance.data.onTagRemove(instance.data.tag);
      }
    };
  }
});

Template.tagEditableBeesknees.events({
  "blur input"(event, instance) {
    instance.updateTag();
  },

  "keydown input"(event, instance) {
    // 9 == Tab key
    // 13 == Enter Key
    if (event.keyCode === 9 || event.keyCode === 13) {
      instance.updateTag();
    }
  }
});

Template.tagBlank.onRendered(function () {
  const instance = Template.instance();
  const textInput = instance.$("input")[0];

  $(textInput).autocomplete({
    delay: 0,
    source: function (request, response) {
      let datums = [];
      let slug = getSlug(request.term);
      Tags.find({
        slug: new RegExp(slug, "i")
      }).forEach(function (tag) {
        return datums.push({
          label: tag.name
        });
      });
      return response(datums);
    },
    select: (selectEvent, ui) => {
      if (ui.item.value) {
        if (instance.data.onTagUpdate) {
          instance.data.onTagUpdate(instance.data.tag._id, ui.item.value);
        }
      }
    }
  });

  this.submitInput = () => {
    const input = instance.$("input");
    const value = input.val().trim();

    if (this.data.onTagCreate && _.isEmpty(value) === false) {
      this.data.onTagCreate(value);
    }

    input.val("");
  };
});

Template.tagBlankBeesknees.helpers({});

Template.tagBlankBeesknees.events({
  "blur input"(event, instance) {
    instance.submitInput();
  },

  "keydown input"(event, instance) {
    // 9 == Tab key
    // 13 == Enter Key
    if (event.keyCode === 9 || event.keyCode === 13) {
      instance.submitInput();
    }
  }
});
*/
