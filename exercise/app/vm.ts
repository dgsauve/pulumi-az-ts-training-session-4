import * as pulumi from "@pulumi/pulumi";
import * as resources from "@pulumi/azure-native/resources";
import * as network from "@pulumi/azure-native/network";
import * as compute from "@pulumi/azure-native/compute";
import * as random from "@pulumi/random"

interface vmArgs {
    resourceGroup: resources.ResourceGroup | resources.GetResourceGroupResult,
    subnet: network.Subnet | network.GetSubnetResult,
    username: pulumi.Input<string>
}

export class VM extends pulumi.ComponentResource {
    private readonly name: string;
    private readonly args: vmArgs;

    public readonly publicIp: network.PublicIPAddress;
    public readonly networkInterface: network.NetworkInterface;
    // public readonly networkSecurityGroup: network.NetworkSecurityGroup;
    // public readonly networkSecurityRule: network.NetworkSecurityRule;
    public readonly password: random.RandomPassword;
    public readonly virtualMachine: compute.VirtualMachine;

    constructor(name: string, args: vmArgs) {
        super("training:VM", name);

        this.name = name;
        this.args = args;

        this.publicIp = new network.PublicIPAddress("ip", {
            resourceGroupName: this.args.resourceGroup.name,
            allocationMethod: "Static"
        }, {
            parent: this,
        });

        this.networkInterface = new network.NetworkInterface("nic", {
            resourceGroupName: this.args.resourceGroup.name,
            ipConfigurations: [{
                name: "webserveripcfg",
                subnetId: this.args.subnet.id,
                privateIpAddressAllocation: "Dynamic",
                publicIpAddressId: this.publicIp.id,
            }],
        }, {
            parent: this.publicIp
        });

        // this.networkSecurityGroup = new network.NetworkSecurityGroup("sg", {
        //     resourceGroupName: this.args.resourceGroup.name,
        //     location: this.args.resourceGroup.location,
        // }, { 
        //     parent: this 
        // });

        // this.networkSecurityRule = new network.NetworkSecurityRule("sgrule", {
        //     priority: 100,
        //     direction: "Inbound",
        //     access: "Allow",
        //     protocol: "Tcp",
        //     sourcePortRange: "*",
        //     destinationPortRange: "22",
        //     sourceAddressPrefix: "*",
        //     destinationAddressPrefix: "*",
        //     resourceGroupName: this.args.resourceGroup.name,
        //     networkSecurityGroupName: this.networkSecurityGroup.name,
        // }, { 
        //     parent: this 
        // });

        // new network.NetworkInterfaceSecurityGroupAssociation("sg-nic-assoc", {
        //     networkInterfaceId: this.networkInterface.id,
        //     networkSecurityGroupId: this.networkSecurityGroup.id,
        // }, { 
        //     parent: this 
        // });

        this.password = new random.RandomPassword('password', {
            length: 33,
            special: false,
        }, { 
            parent: this 
        });

        this.virtualMachine = new compute.VirtualMachine("vm", {
            resourceGroupName: this.args.resourceGroup.name,
            networkInterfaceIds: [this.networkInterface.id],
            vmSize: "Standard_A0",
            deleteDataDisksOnTermination: true,
            deleteOsDiskOnTermination: true,
            osProfile: {
                computerName: "hostname",
                adminUsername: this.args.username,
                adminPassword: this.password.result,
            },
            osProfileLinuxConfig: {
                disablePasswordAuthentication: false,
            },
            storageOsDisk: {
                createOption: "FromImage",
                name: "osdisk1",
            },
            storageImageReference: {
                publisher: "Canonical",
                offer: "0001-com-ubuntu-server-focal",
                sku: "20_04-lts",
                version: "latest",
            },
        }, { 
            parent: this 
        });
    }
}