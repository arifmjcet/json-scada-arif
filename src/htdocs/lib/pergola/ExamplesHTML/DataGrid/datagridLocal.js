
//=============================   Pergola examples - DataGrid   ==========================


var employees = new pergola.Window("EMPLOYEES")
.build({
  type : "datagrid",
  hasZoomAndPan : false,
  x : 50,
  y : 60,
  width : 710,  
  scrollSize : 15,
  statusHeight : 32,
  mousewheel : "scroll"
})
.datagridMaker({
  readOnly : false,
  binding : object,
//  fill : "#FFFFFC",               // if not set, white
//  altFill : "#F0F0F0",            // if not set, "#F4F8FF"
//  stroke : "none",                // if not set, inherited stroke applies
  "font-size" : 12,
//  "font-family" : "'Comic Sans MS'",
  gutter : true,
//  language : "fr-FR",           // if not set, pergola.locale applies (browser's language)
//  rowHeight : 22,
  menu : true                     // or array of strings, any of default ["file", "edit", "view", "search"]
/*
  customMenus : {                 // add with regular menu syntax. You can query the data (datagrid menus are post-synchro).
    custom : {
      title : "Custom Menu",
      items : {
        menuItem : {
          string : "Item",
          ...
        }                           
      }
    }
  },
*/
//  exclude : ["Salary"]            // specify columns with sensitive data to exclude in readOnly mode. 
});