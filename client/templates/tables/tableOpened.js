import { Template } from "meteor/templating";
import { Reaction, Logger } from "/client/api";
import { Restaurant, TableMap } from "../../../lib";
import { Session } from "meteor/session";
//import { ReactiveDict } from "meteor/reactive-dict";
import { ReactiveVar } from 'meteor/reactive-var';



function formatState (state) {
  let $state;
  if(state.text === state.group){
    $state = $('<span>' + state.text + '</span>');
  }else{
    $state = $('<span><i class="icon-man-sitting-in-front-of-a-table-eating-black"></i> ' + state.text + '</span>');
  }

  return $state;
};

function template(data, container) {
  return `${data.group}:${data.text}`;
};


/*
Template.tableOpened.onCreated(function () {
});*/

Template.tableOpened.onRendered(function () {
  $(".js-table-join").select2({
    allowClear: true,
    //data: Reaction.flatTableMap,
    data: TableMap.flatMap,
    templateResult: formatState,
    templateSelection: template
  })
});
