import * as pulumi from "@pulumi/pulumi";
import * as network from "@pulumi/azure-native/network";
import * as resources from "@pulumi/azure-native/resources"

interface VNetArgs {
    resourceGroup: resources.ResourceGroup,
    cidrBlock: pulumi.Input<string>,
    subnetMask: pulumi.Input<string>
};

//  Deploy a fully functional virtual network as a component resource
export class VNet extends pulumi.ComponentResource {
    private readonly name: string;
    private readonly args: VNetArgs;

    public readonly vNet: network.VirtualNetwork;
    public readonly subnet: network.Subnet;

    constructor(vnetName: string, args: VNetArgs) {
        super("training:VNet", vnetName);
        this.name = vnetName;
        this.args = args;

        const vnetCidr = this.args.cidrBlock;
        const subnetCidr = this.args.subnetMask;

        this.vNet = new network.VirtualNetwork("vnet", {
            resourceGroupName: this.args.resourceGroup.name,
            addressSpace: {
                addressPrefixes: [this.args.cidrBlock]
            },
        }, {
            parent: this,
        });

        this.subnet = new network.Subnet("vnetSubnet", {
            resourceGroupName: this.args.resourceGroup.name,
            virtualNetworkName: this.vNet.name,
            addressPrefix: this.args.subnetMask,
        }, {
            parent: this.vNet,
        });
    }

}

module.exports.VNet = VNet;