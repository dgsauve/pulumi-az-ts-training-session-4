import * as pulumi from "@pulumi/pulumi";
import * as resources from "@pulumi/azure-native/resources";
import * as storage from "@pulumi/azure-native/storage";
import {VNet} from "./vnetComponent";

const config = new pulumi.Config();

const cidrBlock = config.require("cidrBlock");
const subnetMask = config.require("subnetMask");

// Create an Azure Resource Group
const resourceGroup = new resources.ResourceGroup("resourceGroup");


//  Deploy a fully functional virtual network as a component resource
const vnet = new VNet("sharedVNET", {
    resourceGroup,
    cidrBlock,
    subnetMask,
});

export = {
    resourceGroupName: resourceGroup.name,
    vNetName: vnet.vNet.name,
    subnetName: vnet.subnet.name,
}