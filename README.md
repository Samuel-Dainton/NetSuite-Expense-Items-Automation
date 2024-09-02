# NetSuite Script for Expensing Items on Item Receipt

## Overview

This project consists of two NetSuite scripts designed to facilitate the expensing of items on an Item Receipt. The purpose of these scripts is to add a button on the Item Receipt page that triggers the creation of an Inventory Adjustment record. This adjustment expends the appropriate items from the Item Receipt, as they are expected to be consumed during production when transferred to their location.

## Scripts

### 1. User Event Script (`ItemReceipt_UE.js`)

**Purpose**:  
This script adds a custom button labeled "Create Inventory Adjustment" on the Item Receipt record. The button is only added when the location of the Item Receipt is of type 1 (a store). When clicked, the button opens a Suitelet that handles the creation of the Inventory Adjustment.

**Key Features**:
- The button only appears when viewing the Item Receipt record.
- The location of the Item Receipt must be of type 1 (a store) for the button to be added.
- The script fetches the Suitelet Script ID and Deployment ID from script parameters.

**Entry Point**:  
`beforeLoad(context)`

**Script Type**:  
User Event Script

### 2. Suitelet Script (`CreateInventoryAdjustment_SL.js`)

**Purpose**:  
This Suitelet handles the creation of the Inventory Adjustment when the custom button from the User Event Script is clicked. It retrieves the necessary information from the Item Receipt and generates an Inventory Adjustment to expense the items, excluding specific items based on their asset accounts.

**Key Features**:
- Loads the Item Receipt and prepares an Inventory Adjustment record.
- Copies item details and inventory status from the Item Receipt to the Inventory Adjustment.
- Excludes items from specified asset accounts.
- Redirects the user to the newly created Inventory Adjustment record or provides feedback if no valid items were found.

**Entry Point**:  
`onRequest(context)`

**Script Type**:  
Suitelet Script

## Script Deployment Parameters

The User Event Script expects two script parameters to be set:
1. **custscriptcustscript_ue_suitelet_scripti**: The Script ID of the Suitelet to be called.
2. **custscriptcustscript_suitelet_deployid**: The Deployment ID of the Suitelet to be called.

These parameters must be defined in the script deployment to ensure proper functionality.

## Installation and Deployment

1. **Upload the Scripts**: Place the scripts in the appropriate File Cabinet folder in NetSuite.
2. **Create Script Records**:
   - Create a new Script Record for the User Event Script.
   - Create a new Script Record for the Suitelet Script.
3. **Deploy the Scripts**:
   - Deploy the User Event Script on the Item Receipt record.
   - Deploy the Suitelet Script with a specific deployment ID.
4. **Set Script Parameters**: Ensure the Script ID and Deployment ID parameters are correctly set in the User Event Script deployment.

## Usage

Once the scripts are deployed and configured:
- Open any Item Receipt record with a location of type 1.
- Click on the "Create Inventory Adjustment" button to generate an Inventory Adjustment that expenses the items on the Item Receipt.

## Error Handling

Both scripts include error logging to help diagnose any issues. Errors are logged to the NetSuite script logs, which can be reviewed under `Customization > Scripting > Script Logs`.

## Contributions

Please feel free to submit issues or pull requests if you encounter bugs or have improvements for these scripts. Contributions are welcome!

## Please don't use my work without giving credit. :(
