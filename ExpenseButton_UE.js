/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/url', 'N/log', 'N/search'], function(record, runtime, url, log, search) {

    function beforeLoad(context) {
        try {
            if (context.type === context.UserEventType.VIEW) {
                var form = context.form;
                var itemReceiptId = context.newRecord.id;

                // Get the location ID from the Item Receipt
                var locationId = context.newRecord.getValue({ fieldId: 'location' });

                if (locationId) {
                    // Load the location record
                    var locationRecord = record.load({
                        type: record.Type.LOCATION,
                        id: locationId
                    });

                    // Check the location type
                    var locationType = locationRecord.getValue({ fieldId: 'locationtype' });

                    // Only add the button if the location type is 1
                    if (locationType === '1') {
                        // Get the Suitelet script and deployment IDs from the script parameters
                        var scriptObj = runtime.getCurrentScript();
                        var scriptId = scriptObj.getParameter({ name: 'custscriptcustscript_ue_suitelet_scripti' }); // Update to your parameter ID
                        var deploymentId = scriptObj.getParameter({ name: 'custscriptcustscript_suitelet_deployid' }); // Update to your parameter ID

                        // Ensure both parameters are not null or empty
                        if (!scriptId || !deploymentId) {
                            throw new Error('Script ID or Deployment ID is not set in the script parameters.');
                        }

                        // Resolve the Suitelet URL
                        var suiteletUrl = url.resolveScript({
                            scriptId: scriptId,
                            deploymentId: deploymentId,
                            returnExternalUrl: false,
                            params: {
                                irid: itemReceiptId
                            }
                        });

                        // Add the button with the Suitelet URL
                        form.addButton({
                            id: 'custpage_create_inventory_adjustment',
                            label: 'Create Inventory Adjustment',
                            functionName: "window.open('" + suiteletUrl + "', '_blank')"
                        });
                    }
                } else {
                    log.error('Location Not Found', 'No location was found on the Item Receipt.');
                }
            }
        } catch (e) {
            log.error('Error in beforeLoad', e.message);
        }
    }

    return {
        beforeLoad: beforeLoad
    };
});
