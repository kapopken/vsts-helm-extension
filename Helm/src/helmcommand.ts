"use strict";
import * as del from "del";
import * as fs from "fs";
import * as tr from "vsts-task-lib/toolrunner";
import trm = require('vsts-task-lib/toolrunner');
import * as path from "path";
import * as tl from "vsts-task-lib/task";
import ClusterConnection from "./clusterconnection";
import stream = require('stream');

export function run(connection: ClusterConnection, kubecommand: string, outputUpdate: (data: string) => any): any {
    var command = connection.createCommand();
    command.on("stdout", output => {
        outputUpdate(output);
    });

    // need to specify our kubectl as env since helm doesn't support it as a parameter
    // https://github.com/kubernetes/helm/pull/2621
    let options: tr.IExecOptions = {
        failOnStdErr: true,
        ignoreReturnCode: false,
        env: {
            KUBECONFIG: connection.kubeconfigFile
        },
        silent: false,
        cwd: process.cwd(),
        outStream: <stream.Writable>process.stdout,
        errStream: <stream.Writable>process.stderr,
        windowsVerbatimArguments: false
    };

    command.arg(kubecommand)
    command.arg(getCommandConfigurationFile());
    command.arg(getCommandArguments());
    command.arg(getCommandOutputFormat());
    return connection.execCommand(command, options);
}

function getCommandOutputFormat() : string[] {
    var args: string[] =[];
    var ouputVariableName =  tl.getInput("kubectlOutput", false);  
    var outputFormat = tl.getInput("outputFormat", false);
    if(ouputVariableName)
    {
       args[0] = "-o";
       args[1] = outputFormat;
    }

    return args;
}

function getCommandConfigurationFile() : string[] {
    var args: string[] =[];
    var useConfigurationFile : boolean  =  tl.getBoolInput("useConfigurationFile", false);
    if(useConfigurationFile) {
        var configurationPath = tl.getInput("configuration", false);
        if(configurationPath && tl.exist(configurationPath))
        {
            args[0] = "-f";
            args[1] = configurationPath;
        }
    }

    return args;
}

function getCommandArguments(): string[] {
    var args: string[] =[];
    var argument = tl.getInput("arguments", false);
    if(argument){
        args = argument.split(" ");
    }

    return args;
}