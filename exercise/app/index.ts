import * as pulumi from "@pulumi/pulumi";
import * as resources from "@pulumi/azure-native/resources";
import * as network from "@pulumi/azure-native/network";
import {VM} from "./vm";

const config = new pulumi.Config();

export = async () => {
    const username = config.require('username');
    const org = "dsauve";
    const stack = pulumi.getStack();
    const networkStack = new pulumi.StackReference(`${org}/network/${stack}`);
    
    const resourceGroup = await resources.getResourceGroup({
        resourceGroupName: await networkStack.requireOutputValue("resourceGroupName"),
    });
    
    const vnet = await network.getVirtualNetwork({
        resourceGroupName: resourceGroup.name,
        virtualNetworkName: await networkStack.requireOutputValue("vNetName"),
    });
    
    const subnet = await network.getSubnet({
        resourceGroupName: resourceGroup.name,
        virtualNetworkName: vnet.name,
        subnetName: await networkStack.requireOutputValue("subnetName"),
    });
    
    const vm = new VM("sillyServer", {
        resourceGroup,
        subnet,
        username,
    });
    
    return {
        username: username,
        password: vm.password.result,
        ip: vm.publicIp.ipAddress,
    }

}