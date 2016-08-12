import { Reaction } from "/server/api";

// Register package as ReactionCommerce package
Reaction.registerPackage({
  label: "Bees Knees",
  name: "beesknees",
  icon: "fa fa-vine",
  autoEnable: true,
  registry: [
    {
      route: "/dashboard/opentable",
      name: "open",
      workflow: "coreDashboardWorkflow",
      provides: "shortcut",
      label: "Open/Close Table",
      template: "restaurantOpenTable",
      icon: "icon-restaurantopen2",
      priority: 1
    },
    {
      route: "/about",
      name: "about",
      template: "aboutUs",
      workflow: "coreWorkflow"
    },
    {
      template: "tableCheckPermissions",
      provides: "tableMethod"
    },
    {
      provides: "dashboard",
      label: "Beesknees",
      description: "Beesknees Channel configuration",
      icon: "fa fa-gear",
      priority: 2,
      container: "utilities",
      permissions: [{
        label: "Beesknees",
        permission: "dashboard/beesknees"
      }]
    },
    {
      label: "Beesknees Settings",
      route: "/dashboard/beesknees",
      provides: 'settings',
      container: "dashboard",
      icon: "fa fa-user-plus",
      template: "employeeSettings",
      permissions: [
        {
          label: "Client Table",
          provides: "settings",
          permission: "client/table"
        },
        {
          label: "Client Vip",
          provides: "settings",
          permission: "client/vip"
        },
        {
          label: "Employee",
          provides: "settings",
          permission: "employee/employee"
        },
        {
          label: "Employee Master",
          provides: "settings",
          permission: "employee/master"
        }
      ]
    }
  ],
  layout: [{
    layout: "coreLayoutBeesknees",
    workflow: "coreProductWorkflow",
    collection: "Products",
    theme: "default",
    enabled: true,
    structure: {
      template: "productsLanding",
      layoutHeader: "layoutHeaderBeesknees",
      layoutFooter: "layoutFooterBeesknees",
      notFound: "productNotFound",
      dashboardHeader: "",
      dashboardControls: "dashboardControls",
      dashboardHeaderControls: "",
      adminControlsFooter: "adminControlsFooter"
    }
  },{
    layout: "coreLayoutBeesknees",
    workflow: "coreWorkflow",
    collection: "Products",
    theme: "default",
    enabled: true,
    structure: {
      template: "my_custom_template",
      layoutHeader: "layoutHeaderBeesknees",
      layoutFooter: "layoutFooterBeesknees",
      notFound: "productNotFound",
      dashboardHeader: "",
      dashboardControls: "dashboardControls",
      dashboardHeaderControls: "",
      adminControlsFooter: "adminControlsFooter"
    }
  },
  {
    layout: "coreLayoutBeesknees",
    workflow: "coreDashboardWorkflow",
    collection: "Orders",
    theme: "default",
    enabled: true,
    structure: {
      template: "restaurantOpenTable",
      layoutHeader: "layoutHeaderBeesknees",
      layoutFooter: "layoutFooterBeesknees",
      notFound: "productNotFound",
      dashboardHeader: "dashboardHeader",
      dashboardHeaderControls: "orderListFilters",
      dashboardControls: "dashboardControls",
      adminControlsFooter: "adminControlsFooter"
    }
  },
  {
    layout: "coreLayoutBeesknees",
    workflow: "coreOrderWorkflow",
    collection: "Orders",
    theme: "default",
    enabled: true,
    structure: {
      template: "orders",
      layoutHeader: "layoutHeader",
      layoutFooter: "layoutFooter",
      notFound: "notFound",
      dashboardHeader: "dashboardHeader",
      dashboardHeaderControls: "orderListFilters",
      dashboardControls: "dashboardControls",
      adminControlsFooter: "adminControlsFooter"
    }
  },
  {
    layout: "coreLayoutBeesknees",
    workflow: "coreOrderShipmentWorkflow",
    collection: "Orders",
    theme: "default",
    enabled: true
  },
  {
    layout: "coreLayoutBeesknees",
    workflow: "coreAccountsWorkflow",
    collection: "Accounts",
    theme: "default",
    enabled: true,
    structure: {
      template: "accountsDashboard",
      layoutHeader: "layoutHeader",
      layoutFooter: "",
      notFound: "notFound",
      dashboardHeader: "dashboardHeader",
      dashboardControls: "",
      dashboardHeaderControls: "",
      adminControlsFooter: "adminControlsFooter"
    }
  },
  {
    layout: "coreLayoutBeesknees",
    workflow: "coreCartWorkflow",
    collection: "Cart",
    theme: "default",
    enabled: true,
    structure: {
      template: "cartCheckout",
      layoutHeader: "checkoutHeader",
      layoutFooter: "",
      notFound: "notFound",
      dashboardHeader: "",
      dashboardControls: "dashboardControls",
      dashboardHeaderControls: "",
      adminControlsFooter: "adminControlsFooter"
    }
  },
  {
    layout: "coreLayoutBeesknees",
    workflow: "coreTableWorkflow",
    collection: "ClientsTable",
    theme: "default",
    enabled: true,
    structure: {
      template: "",
      layoutHeader: "layoutHeaderBeesknees",
      layoutFooter: "layoutFooterBeesknees",
      notFound: "notFound",
      dashboardHeader: "",
      dashboardControls: "dashboardControls",
      dashboardHeaderControls: "",
      adminControlsFooter: "adminControlsFooter"
    }
  },
  {
    template: "tableOpened",
    label: "Table Opened",
    workflow: "coreTableWorkflow",
    container: "table-steps-side",
    audience: ["employee/employee", "employee/master", "admin"],
    priority: 1,
    position: "1"
  },
  {
    template: "tableReview",
    label: "Table Review",
    workflow: "coreTableWorkflow",
    container: "table-steps-side",
    audience: ["employee/employee", "employee/master", "admin"],
    priority: 2,
    position: "2"
  }, {
    template: "tablePayment",
    label: "Complete Payment",
    workflow: "coreTableWorkflow",
    container: "table-steps-side",
    audience: ["employee/employee", "employee/master", "admin"],
    priority: 3,
    position: "3"
  }
]
});
