# WriteToOPCUA Designer UI - JavaScript Changes Guide

This document contains **ONLY the JavaScript file changes** (exact Before and After code snippets) made in `WriteToOPCUA-Designer/src/main/resources/UI/WriteToOPCUA/`.

---

## 1. `WriteToOPCUAComponent.js`
**Path:** `WriteToOPCUA-Designer/src/main/resources/UI/WriteToOPCUA/WriteToOPCUAComponent.js`

### Purpose:
Fixes row deletion so that:
1. Selecting multiple rows/checkboxes deletes **all selected rows** simultaneously via `grid.dataSource.remove(dataItem)` instead of deleting only the top-most row.
2. Clicking the inline delete icon also deletes via `grid.dataSource.remove(dataItem)`.

#### 🔴 OLD CODE:
```javascript
        _onDeleteGridRow: function (event) {
            var row = $(event.currentTarget).closest("tr");
            var grid = this._getGridInstance();

            if (grid && row.length) {
                grid.removeRow(row);
            }
        },

        _onDeleteToolbarRow: function () {
            var grid = this._getGridInstance();

            if (grid) {
                var selected = grid.select();
                if (selected?.length) {
                    var uniqueRows = [];
                    selected.each(function () {
                        var row = $(this).closest("tr");
                        if (row.length && uniqueRows.indexOf(row[0]) === -1) {
                            uniqueRows.push(row[0]);
                        }
                    });
                    $.each(uniqueRows, function (index, rowElem) {
                        grid.removeRow($(rowElem));
                    });
                } else {
                    var lastRow = grid.tbody.find("tr:last");
                    if (lastRow.length) {
                        grid.removeRow(lastRow);
                    }
                }
            }
        },
```

#### 🟢 NEW CODE:
```javascript
        _onDeleteGridRow: function (event) {
            var row = $(event.currentTarget).closest("tr");
            var grid = this._getGridInstance();

            if (grid && row.length) {
                var dataItem = grid.dataItem ? grid.dataItem(row) : null;
                if (dataItem && grid.dataSource) {
                    grid.dataSource.remove(dataItem);
                } else if (grid.removeRow) {
                    grid.removeRow(row);
                }
            }
        },

        _onDeleteToolbarRow: function () {
            var grid = this._getGridInstance();

            if (!grid) {
                return;
            }

            var selectedElements = grid.select ? grid.select() : [];
            var checkedBoxes = grid.tbody ? grid.tbody.find("input:checked, .k-checkbox:checked") : [];
            var uniqueRowElements = [];

            if (selectedElements && selectedElements.length) {
                selectedElements.each(function () {
                    var row = $(this).closest("tr");
                    if (row.length && uniqueRowElements.indexOf(row[0]) === -1) {
                        uniqueRowElements.push(row[0]);
                    }
                });
            }

            if (checkedBoxes && checkedBoxes.length) {
                checkedBoxes.each(function () {
                    var row = $(this).closest("tr");
                    if (row.length && uniqueRowElements.indexOf(row[0]) === -1) {
                        uniqueRowElements.push(row[0]);
                    }
                });
            }

            if (uniqueRowElements.length) {
                var dataItems = [];
                $.each(uniqueRowElements, function (index, rowElem) {
                    var item = grid.dataItem ? grid.dataItem(rowElem) : null;
                    if (item && dataItems.indexOf(item) === -1) {
                        dataItems.push(item);
                    }
                });

                if (dataItems.length && grid.dataSource) {
                    $.each(dataItems, function (index, item) {
                        grid.dataSource.remove(item);
                    });
                } else {
                    $.each(uniqueRowElements, function (index, rowElem) {
                        grid.removeRow($(rowElem));
                    });
                }
            } else {
                var lastRow = grid.tbody ? grid.tbody.find("tr:last") : [];
                if (lastRow.length) {
                    var lastItem = grid.dataItem ? grid.dataItem(lastRow) : null;
                    if (lastItem && grid.dataSource) {
                        grid.dataSource.remove(lastItem);
                    } else if (grid.removeRow) {
                        grid.removeRow(lastRow);
                    }
                }
            }
        },
```

---

## 2. `GridUtils.js`
**Path:** `WriteToOPCUA-Designer/src/main/resources/UI/WriteToOPCUA/js/GridUtils.js`

### Purpose:
Aligns the search bar with the standard `uilayer.searchBar` syntax using field array, `filterAfter: 0`, `filterEvent: "keyup"`, and eliminates conflicting manual keyup event listeners.

#### 🔴 OLD CODE:
```javascript
        renderGridSearchBar: function (searchClass, grid, fields, globalSelf, nls) {
            var searchElement = globalSelf.$("." + searchClass);

            if (!searchElement.length || !grid?.widget?.dataSource) {
                return null;
            }

            var ds = grid.widget.dataSource;
            var searchFields = Array.isArray(fields) ? fields : [fields, "nodeId"];

            searchElement.off("keyup.gridSearch input.gridSearch").on("keyup.gridSearch input.gridSearch", function () {
                var val = $(this).val();
                if (!val || val.trim() === "") {
                    ds.filter([]);
                } else {
                    var query = val.trim();
                    var filterList = searchFields.map(function (f) {
                        return { field: f, operator: "contains", value: query };
                    });
                    ds.filter({
                        logic: "or",
                        filters: filterList
                    });
                }
            });

            var searchBarFilters = searchFields.map(function (f) {
                return { field: f, operator: "contains" };
            });

            return uilayer.searchBar({
                elem: searchElement,
                uiStyle: "",
                dataSource: ds,
                filter: {
                    logic: "or",
                    filters: searchBarFilters
                },
                placeholder: nls.Search,
                filterAfter: 1
            });
        },
```

#### 🟢 NEW CODE:
```javascript
        renderGridSearchBar: function (searchClass, grid, fields, globalSelf, nls) {
            var searchElement = globalSelf.$("." + searchClass);

            if (!searchElement.length || !grid?.widget?.dataSource) {
                return null;
            }

            var ds = grid.widget.dataSource;
            var searchFields = Array.isArray(fields) ? fields : [fields, "nodeId"];

            return uilayer.searchBar({
                elem: searchElement,
                uiStyle: "",
                dataSource: [ds],
                filter: {
                    field: searchFields,
                    operator: "contains"
                },
                placeholder: nls.Search,
                filterAfter: 0,
                filterEvent: "keyup"
            });
        },
```

---

## 3. `TransportManager.js`
**Path:** `WriteToOPCUA-Designer/src/main/resources/UI/WriteToOPCUA/js/TransportManager.js`

### Purpose:
1. Adds `navigateToCAC(response, hashPath)` to dynamically construct `AdminConsole#...` URLs for Monolithic deployments (`/eQubeMI/AdminConsole#transports/create`, `AdminConsole#transports/edit/<id>`, `AdminConsole#transports`) and Central Admin Console (CAC) executor URLs for Distributed deployments.
2. Updates `createButton`, `openButton`, and `refreshButton` handlers.

#### 🔴 OLD CODE:
```javascript
        renderTransportButtons: function (globalSelf) {
            if (!globalSelf.refreshButton) {
                globalSelf.refreshButton = uilayer.button({
                    elem: globalSelf.$(".transports-refresh-button"),
                    uiStyle: "tertiary",
                    click: function () {
                        if (globalSelf.transportDropdown) {
                            globalSelf.transportDropdown.destroy();
                            globalSelf.transportDropdown = null;
                            globalSelf.$(".transport-selector-dropdown").empty();
                        }
                        TransportManager.renderTransportDropdown(globalSelf);
                    }
                });
            }

            if (!globalSelf.createButton) {
                globalSelf.createButton = uilayer.button({
                    elem: globalSelf.$(".transports-create-button"),
                    uiStyle: "tertiary",
                    click: function () {
                        window.open(
                            Constants.CREATE_TRANSPORT_URL,
                            "_blank"
                        );
                    }
                });
            }

            if (!globalSelf.openButton) {
                globalSelf.openButton = uilayer.button({
                    elem: globalSelf.$(".transports-open-button"),
                    uiStyle: "tertiary",
                    click: function () {
                        if (!globalSelf.transportDropdown?.dataItem()) {
                            return;
                        }

                        var item = globalSelf.transportDropdown.dataItem();
                        var transportId = item.toJSON ? item.toJSON().transportId : item.transportId;

                        if (transportId) {
                            window.open(
                                Constants.EDIT_TRANSPORT_URL + transportId,
                                "_blank"
                            );
                        }
                    }
                });
            }
        },
```

#### 🟢 NEW CODE:
```javascript
        navigateToCAC: function (response, hashPath) {
            var navigationURL;
            if (response && response.IS_DISTRIBUTED_DEPLOYMENT === "TRUE") {
                navigationURL = response.URL + "/" + encodeURIComponent(response.ENVIRONMENT_ID) + "/EXECUTOR/" + encodeURIComponent(hashPath);
            } else {
                var appPath = window.location.pathname.split("/")[1] || "eQubeMI";
                navigationURL = window.location.origin + "/" + appPath + "/AdminConsole#" + hashPath;
            }
            window.open(navigationURL, "_blank");
        },

        renderTransportButtons: function (globalSelf) {
            var self = this;

            if (!globalSelf.refreshButton) {
                globalSelf.refreshButton = uilayer.button({
                    elem: globalSelf.$(".transports-refresh-button"),
                    uiStyle: "tertiary",
                    click: function () {
                        if (globalSelf.transportDropdown) {
                            globalSelf.transportDropdown.dataSource.read();
                        } else {
                            self.renderTransportDropdown(globalSelf);
                        }
                    }
                });
            }

            if (!globalSelf.createButton) {
                globalSelf.createButton = uilayer.button({
                    elem: globalSelf.$(".transports-create-button"),
                    uiStyle: "tertiary",
                    click: function () {
                        var promise = AjaxUtility.cachedAjaxRequest("GET", "services/application-navigation-url/cac", null, "json", null, true);
                        promise.done(function (response) {
                            self.navigateToCAC(response, "transports/create");
                        });
                        promise.fail(function () {
                            self.navigateToCAC(null, "transports/create");
                        });
                    }
                });
            }

            if (!globalSelf.openButton) {
                globalSelf.openButton = uilayer.button({
                    elem: globalSelf.$(".transports-open-button"),
                    uiStyle: "tertiary",
                    click: function () {
                        var selectedTransportId = null;
                        if (globalSelf.transportDropdown && globalSelf.transportDropdown.dataItem()) {
                            var item = globalSelf.transportDropdown.dataItem();
                            selectedTransportId = item.toJSON ? item.toJSON().transportId : item.transportId;
                        }

                        var hashPath = selectedTransportId ? ("transports/edit/" + selectedTransportId) : "transports";

                        var promise = AjaxUtility.cachedAjaxRequest("GET", "services/application-navigation-url/cac", null, "json", null, true);
                        promise.done(function (response) {
                            self.navigateToCAC(response, hashPath);
                        });
                        promise.fail(function () {
                            self.navigateToCAC(null, hashPath);
                        });
                    }
                });
            }
        },
```

---

## 4. `constants.js`
**Path:** `WriteToOPCUA-Designer/src/main/resources/UI/WriteToOPCUA/js/constants.js`

### Purpose:
Updates routing URLs to use AdminConsole hash routes.

#### 🔴 OLD CODE:
```javascript
        CREATE_TRANSPORT_URL: "/ADMINCONSOLE?servicePath=transports/create",
        EDIT_TRANSPORT_URL: "/ADMINCONSOLE?servicePath=transports/edit/"
```

#### 🟢 NEW CODE:
```javascript
        TRANSPORTS_URL: "/AdminConsole#transports",
        CREATE_TRANSPORT_URL: "/AdminConsole#transports/create",
        EDIT_TRANSPORT_URL: "/AdminConsole#transports/edit/"
```
