import { Mongo } from "meteor/mongo";
import { SimpleSchema } from "meteor/aldeed:simple-schema";
import { shopIdAutoValue } from "/lib/collections/schemas/helpers";
import { Workflow } from "/lib/collections/schemas";

export const DoubleId = /^[23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz]{17}:[23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz]{17}$/;

export const ClientCounters = new Mongo.Collection("ClientCounters");

export const SchemaTableWorkflow = new SimpleSchema({
  workflow: {
    type: Workflow,
    optional: true
  }
});

export const SchemaClientsTable = new SimpleSchema({
  creatorId:{
      type: String,
      regEx: SimpleSchema.RegEx.Id,
      index: 1,
      label: "Creator UserId"
  },/*
  transactionId:{
    type:[String],
    regEx: SimpleSchema.RegEx.DoubleId,
  },*/
  userId:{
    type: String,
    regEx: SimpleSchema.RegEx.Id,
  },
  cartsId:{
    type:[String],
    regEx: SimpleSchema.RegEx.Id,
  },
  shopId: {
    type: String,
    autoValue: shopIdAutoValue,
    regEx: SimpleSchema.RegEx.Id,
    //index: 1
  },
  masterClientNumber: {
    type: Number
  },
  clients: {
    type: [Number],
    optional:true
  },
  ignores: {
    type: [Number],
    optional:true
  },
  tableNumber: {
    type: String,
  },
  status:{
    type: String,
    defaultValue: "open",
    allowedValues:["open", "opened", "closed", "payment", "paid"]
  },
  paymentMethod: {
    type: String,
    optional:true
  },
  /*,
  request:{
    type:[Object],
    optional:true
  }*/
  createdAt: {
    type: Date,
    autoValue: function () {
      if (this.isInsert) {
        return new Date;
      } else if (this.isUpsert) {
        return {
          $setOnInsert: new Date
        };
      }
    }
  }
});

export const ClientsTable = new Mongo.Collection("ClientsTable");

//ClientsTable.attachSchema(SchemaClientsTable);

ClientsTable.attachSchema([SchemaClientsTable, SchemaTableWorkflow]);
//ClientsTable.attachSchema(SchemaTableWorkflow);

/*ClientsTable.attachSchema(new SimpleSchema([SchemaClientsTable, {workflow: {
  type: Workflow,
  optional: true
}}]));*/

export const ClientsTableHistory = new Mongo.Collection("ClientsTableHistory");

ClientsTable.attachSchema(SchemaClientsTable);


export const SchemaTable = new SimpleSchema({
  name: {
    type: String,
  },
  state: {
    type: String,
    optional:true
  },
  floor:{
    type: Boolean
  },
  clientId:{
    type: Number,
    optional:true
  },
  show: {
    type: Boolean,
    optional:true
  }
});


export const SchemaTableMap = new SimpleSchema({
  shopId: {
    type: String,
    autoValue: shopIdAutoValue,
    regEx: SimpleSchema.RegEx.Id,
    //index: 1
  },
  name: {
    type: String
  },
  order:{
    type: Number
  },
  tables: {
    type: [SchemaTable]
  },
  show: {
    type: Boolean,
  },
  state: {
    type: String,
    optional:true
  },
  floor:{
    type: Boolean
  },
  showTables:{
    type: [String],
    optional:true
  },
  createdAt: {
    type: Date,
    autoValue: function () {
      if (this.isInsert) {
        return new Date;
      } else if (this.isUpsert) {
        return {
          $setOnInsert: new Date
        };
      }
    }
  }
});

export const TableMap = new Mongo.Collection("TableMap");

TableMap.attachSchema(SchemaTableMap);


export const SchemaTableRequestMsg = new SimpleSchema({
  shopId:{
    type: String
  },
  fromId: {
    type: Number,
  },
  toId: {
    type: Number,
  },
  name: {
    type: String,
  },
  msg: {
    type: String
  },
  tableName: {
    type: String,
    optional:true
  },
  reason:{
    type: String,
    optional:true
  },
  status:{
    type: String,
    defaultValue: "new",
    allowedValues:["new", "refused", "accepted", "timeout", "closed", "ignored", "processed_refused", "processed_accepted", "processed_timeout", "processed_closed", "processed_ignored"]
  },
  createdAt: {
    type: Date,
    autoValue: function () {
      if (this.isInsert) {
        return new Date;
      } else if (this.isUpsert) {
        return {
          $setOnInsert: new Date
        };
      }
    }
  },
  changedAt: {
    type: Date,
    autoValue: function () {
      if (this.isInsert) {
        return new Date;
      } else if (this.isUpsert) {
        return {
          $setOnInsert: new Date
        };
      }
    }
  }
});


export const TableRequestMsg = new Meteor.Collection('TableRequestMsg');

TableRequestMsg.attachSchema(SchemaTableRequestMsg);
