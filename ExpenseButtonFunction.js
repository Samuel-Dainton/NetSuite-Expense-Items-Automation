/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/record', 'N/search', 'N/log'], function (record, search, log) {

    function onRequest(context) {
        if (context.request.method === 'GET') {
            var itemReceiptId = context.request.parameters.irid;

            try {
                // Load the Item Receipt record
                var irRecord = record.load({
                    type: record.Type.ITEM_RECEIPT,
                    id: itemReceiptId
                });

                // Create a new Inventory Adjustment record
                var inventoryAdjustment = record.create({
                    type: record.Type.INVENTORY_ADJUSTMENT,
                    isDynamic: true
                });

                // Set the necessary fields on the Inventory Adjustment
                inventoryAdjustment.setValue({
                    fieldId: 'subsidiary',
                    value: irRecord.getValue({ fieldId: 'subsidiary' })
                });

                inventoryAdjustment.setValue({
                    fieldId: 'account',
                    value: 304 // 6305 Hub Equipment - Expensed
                });

                inventoryAdjustment.setValue({
                    fieldId: 'adjlocation',
                    value: irRecord.getValue({ fieldId: 'location' })
                });

                var date = irRecord.getValue({ fieldId: 'trandate' });
                inventoryAdjustment.setValue({
                    fieldId: 'trandate',
                    value: date
                });

                var poId = irRecord.getValue({ fieldId: 'createdfrom' });
                var memoText = "To expense Item Receipt #" + itemReceiptId + " from PO #" + poId;
                inventoryAdjustment.setValue({
                    fieldId: 'memo',
                    value: memoText
                });

                var itemAdded = false; // Flag to check if any item is added

                // Loop through the items on the Item Receipt
                var lineCount = irRecord.getLineCount({ sublistId: 'item' });
                for (var i = 0; i < lineCount; i++) {
                    var itemId = irRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                    var quantity = irRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });

                    // Determine the item record type and load it
                    var itemType = irRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i });
                    var itemRecord;
                    switch (itemType) {
                        case 'InvtPart': // Inventory Part
                            itemRecord = record.load({
                                type: record.Type.INVENTORY_ITEM,
                                id: itemId
                            });
                            break;
                        case 'Assembly': // Assembly Item
                            itemRecord = record.load({
                                type: record.Type.ASSEMBLY_ITEM,
                                id: itemId
                            });
                            break;
                        case 'LotNumberedInventoryItem': // Lot Numbered Inventory Item
                            itemRecord = record.load({
                                type: record.Type.LOT_NUMBERED_INVENTORY_ITEM,
                                id: itemId
                            });
                            break;
                        case 'SerializedInventoryItem': // Serialized Inventory Item
                            itemRecord = record.load({
                                type: record.Type.SERIALIZED_INVENTORY_ITEM,
                                id: itemId
                            });
                            break;
                        case 'LotNumberedAssemblyItem': // Lot Numbered Assembly Item
                            itemRecord = record.load({
                                type: record.Type.LOT_NUMBERED_ASSEMBLY_ITEM,
                                id: itemId
                            });
                            break;
                        case 'SerializedAssemblyItem': // Serialized Assembly Item
                            itemRecord = record.load({
                                type: record.Type.SERIALIZED_ASSEMBLY_ITEM,
                                id: itemId
                            });
                            break;
                        case 'NonInvtPart': // Non-Inventory Part
                            itemRecord = record.load({
                                type: record.Type.NON_INVENTORY_ITEM,
                                id: itemId
                            });
                            break;
                        default:
                            log.error('Unsupported Item Type', 'Item type ' + itemType + ' for item ID ' + itemId + ' is not supported');
                            continue; // Skip unsupported item types
                    }

                    var itemAssetAccount = itemRecord.getValue({ fieldId: 'assetaccount' });
                    var itemName = itemRecord.getValue({ fieldId: 'itemid' });

                    // Exclude items with asset accounts from the exclusion list
                    var excludedAccounts = ["1241", "1244", "1271", "1253", "1259", "1262", "1277", "1280", "273", "1265"];
                    if (excludedAccounts.indexOf(itemAssetAccount) === -1) {
                        inventoryAdjustment.selectNewLine({ sublistId: 'inventory' });

                        // Set item line details
                        inventoryAdjustment.setCurrentSublistValue({
                            sublistId: 'inventory',
                            fieldId: 'item',
                            value: itemId
                        });

                        inventoryAdjustment.setCurrentSublistValue({
                            sublistId: 'inventory',
                            fieldId: 'location',
                            value: irRecord.getValue({ fieldId: 'location' })
                        });

                        inventoryAdjustment.setCurrentSublistValue({
                            sublistId: 'inventory',
                            fieldId: 'adjustqtyby',
                            value: -quantity
                        });

                        log.debug('Adding Item to Inventory Adjustment', {
                            itemName: itemName,
                            itemId: itemId,
                            quantity: quantity,
                            location: irRecord.getValue({ fieldId: 'location' })
                        });

                        // Check if the item has inventory detail on the Item Receipt
                        if (irRecord.hasSublistSubrecord({
                            sublistId: 'item',
                            fieldId: 'inventorydetail',
                            line: i
                        })) {
                            // Copy inventory detail from Item Receipt
                            var inventoryDetail = inventoryAdjustment.getCurrentSublistSubrecord({
                                sublistId: 'inventory',
                                fieldId: 'inventorydetail'
                            });

                            var irInventoryDetail = irRecord.getSublistSubrecord({
                                sublistId: 'item',
                                fieldId: 'inventorydetail',
                                line: i
                            });

                            var irInventoryCount = irInventoryDetail.getLineCount({ sublistId: 'inventoryassignment' });
                            for (var j = 0; j < irInventoryCount; j++) {
                                var serialNumber = irInventoryDetail.getSublistValue({
                                    sublistId: 'inventoryassignment',
                                    fieldId: 'receiptinventorynumber',
                                    line: j
                                });

                                var status = irInventoryDetail.getSublistValue({
                                    sublistId: 'inventoryassignment',
                                    fieldId: 'inventorystatus',
                                    line: j
                                });

                                // Select the existing line instead of creating a new one
                                inventoryDetail.selectLine({
                                    sublistId: 'inventoryassignment',
                                    line: j
                                });

                                inventoryDetail.setCurrentSublistValue({
                                    sublistId: 'inventoryassignment',
                                    fieldId: 'receiptinventorynumber',
                                    value: serialNumber
                                });

                                // Copy the status from Item Receipt
                                inventoryDetail.setCurrentSublistValue({
                                    sublistId: 'inventoryassignment',
                                    fieldId: 'inventorystatus',
                                    value: status
                                });

                                inventoryDetail.setCurrentSublistValue({
                                    sublistId: 'inventoryassignment',
                                    fieldId: 'quantity',
                                    value: -irInventoryDetail.getSublistValue({
                                        sublistId: 'inventoryassignment',
                                        fieldId: 'quantity',
                                        line: j
                                    })
                                });

                                inventoryDetail.commitLine({ sublistId: 'inventoryassignment' });

                                log.debug('Inventory Detail', {
                                    serialNumber: serialNumber,
                                    status: status,
                                    quantity: -irInventoryDetail.getSublistValue({
                                        sublistId: 'inventoryassignment',
                                        fieldId: 'quantity',
                                        line: j
                                    })
                                });
                            }
                        } else {
                            // No inventory detail present on the IR, so use default status and set quantity
                            var inventoryDetail = inventoryAdjustment.getCurrentSublistSubrecord({
                                sublistId: 'inventory',
                                fieldId: 'inventorydetail'
                            });

                            inventoryDetail.selectLine({ sublistId: 'inventoryassignment', line: 0 });

                            // Set the default status to "1"
                            inventoryDetail.setCurrentSublistValue({
                                sublistId: 'inventoryassignment',
                                fieldId: 'inventorystatus',
                                value: "1"
                            });

                            inventoryDetail.setCurrentSublistValue({
                                sublistId: 'inventoryassignment',
                                fieldId: 'quantity',
                                value: -quantity
                            });

                            inventoryDetail.commitLine({ sublistId: 'inventoryassignment' });

                            log.debug('No Inventory Detail on IR', {
                                itemName: itemName,
                                itemId: itemId,
                                quantity: -quantity,
                                status: 1
                            });
                        }

                        inventoryAdjustment.commitLine({ sublistId: 'inventory' });
                        itemAdded = true; // Mark that at least one item was added
                    }
                }

                if (itemAdded) {
                    // Save the Inventory Adjustment record
                    var inventoryAdjustmentId = inventoryAdjustment.save();

                    // Redirect to the created Inventory Adjustment record
                    context.response.sendRedirect({
                        type: 'RECORD',
                        identifier: record.Type.INVENTORY_ADJUSTMENT,
                        id: inventoryAdjustmentId
                    });
                } else {
                    // Provide feedback to the user that no items were added
                    context.response.write('No valid items found for creating Inventory Adjustment. Please check the item records or asset accounts.');
                }
            } catch (e) {
                log.error('Error creating Inventory Adjustment', e.message);
                context.response.write('An error occurred: ' + e.message);
            }
        }
    }

    return {
        onRequest: onRequest
    };
});
