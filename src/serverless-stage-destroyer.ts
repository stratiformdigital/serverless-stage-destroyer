import {
  CloudFormationClient,
  DescribeStacksCommand,
  paginateDescribeStacks,
  paginateListStackResources,
  DeleteStackCommand,
  waitUntilStackDeleteComplete,
} from "@aws-sdk/client-cloudformation";

import {
  S3Client,
  PutBucketVersioningCommand,
  ListObjectVersionsCommand,
  DeleteObjectsCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
} from "@aws-sdk/client-s3";
import * as readlineSync from "readline-sync";

export class ServerlessStageDestroyer {

    public async destroy(region: string, stage: string) {

      this.confirmDestroyCommand(stage);

      let stacksToDestroy = await this.getAllStacksForStage(region, stage);

      for (let i of stacksToDestroy || []) {
        await this.destroyStack(region, i.StackName || "");
      }

      for (let i of stacksToDestroy || []) {
        await this.ensureStackIsDeleted(region, i.StackName || "");
      }
    }

    private async ensureStackIsDeleted(region: string , stack: string) {
      console.log(`Waiting for stack ${stack} to be deleted...`)
      const client = new CloudFormationClient({ region: region });
      await waitUntilStackDeleteComplete(
        {
          client: client,
          maxWaitTime: 1500
        },
        {
          StackName: stack
        }
      );
    }

    private async getAllStacksForRegion(region: string) {
      const client = new CloudFormationClient({ region: region });
      const stacks = [];
      for await (const page of paginateDescribeStacks({ client }, {})) {
        stacks.push(...(page.Stacks || []));
      }
      return stacks;
    }

    private async getAllStacksForStage(region: string, stage: string) {
      let stacks = await this.getAllStacksForRegion(region);
      return stacks.filter((i) =>
        i.Tags?.find((j) => j.Key == "STAGE" && j.Value == stage)
      );
    }

    private confirmDestroyCommand(stage: string) {
      // Another safeguard against destroying protected stages
      if (stage == "master" || stage == "main" || stage == "staging" || stage == "production") {
        throw `
          **********************************************************************
          You've requested a destroy for a protected stage (${stage}).
          The destroy operation has been aborted.
          **********************************************************************
        `;
      }
      if (process.env.CI != "true") {
        var confirmation = readlineSync.question(`
          ********************************* STOP *******************************
          You've requested a destroy for stage: ${stage}.
          Continuing will irreversibly delete all data and infrastructure
          associated with ${stage}.
          Do you really want to destroy it?
          Re-enter the stage name to continue:
          **********************************************************************
        `);
        if (confirmation != stage) {
          throw `
            **********************************************************************
            The destroy operation has been aborted.
            **********************************************************************
          `;
        }
      }
    }

    private async getBucketsForStack(region: string, stack: string) {
      const client = new CloudFormationClient({ region: region });
      const buckets = [];
      for await (const page of paginateListStackResources(
        { client },
        { StackName: stack }
      )) {
        // The spread operator was causing an error, so using a for loop
        for (let i of page.StackResourceSummaries || []) {
          if (i.ResourceType == "AWS::S3::Bucket") {
            buckets.push(i.PhysicalResourceId);
          }
        }
      }
      return buckets;
    }

    private async deleteVersions(bucket: string, client: S3Client) {
      // Get all versions
      let objectVersions = await client.send(
        new ListObjectVersionsCommand({
          Bucket: bucket,
        })
      );

      // Delete all versions
      if (objectVersions.Versions) {
        let versionsToDelete = [];
        for (let i of objectVersions.Versions) {
          versionsToDelete.push({
            Key: i.Key,
            VersionId: i.VersionId,
          });
        }
        await client.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: {
              Objects: versionsToDelete,
            },
          })
        );
      }

      // Delete all delete markers
      if (objectVersions.DeleteMarkers) {
        let deleteMarkersToDelete = [];
        for (let i of objectVersions.DeleteMarkers) {
          deleteMarkersToDelete.push({
            Key: i.Key,
            VersionId: i.VersionId,
          });
        }
        await client.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: {
              Objects: deleteMarkersToDelete,
            },
          })
        );
      }

      if (objectVersions.Versions || objectVersions.DeleteMarkers) {
        await this.deleteVersions(bucket, client);
      }
    }

    public async destroyStack(region: string, stack: string) {
      console.log(`Destroying stack:  ${stack}...`);

      // Find buckets belonging to the stack
      let bucketsToEmpty = await this.getBucketsForStack(region, stack);
      const client = new S3Client({ region: region });

      // For each bucket to destroy
      for (let bucket of bucketsToEmpty) {
        console.log(`    Emptying bucket ${bucket}`)

        // Check if the bucket was removed outside of CloudFormation's knowledge.
        try {
          await client.send(
            new HeadBucketCommand({
              Bucket: bucket,
            })
          );
        } catch {
          continue;
        }

        // Suspend versioning on the bucket
        await client.send(
          new PutBucketVersioningCommand({
            Bucket: bucket,
            VersioningConfiguration: {
              Status: "Suspended",
            },
          })
        );

        // Put a policy denying any puts or gets
        await client.send(
          new PutBucketPolicyCommand({
            Bucket: bucket,
            Policy: JSON.stringify({
              Version: "2012-10-17",
              Statement: [
                {
                  Action: ["s3:GetObject", "s3:PutObject"],
                  Effect: "Deny",
                  Resource: `arn:aws:s3:::${bucket}/*`,
                  Principal: "*",
                },
              ],
            }),
          })
        );

        // Delete all object versions and delete markers
        await this.deleteVersions(bucket || "", client);
      }

      // Destroy the stack
      console.log(`    Sending cloudformation delete for ${stack}`)
      const cloudformation = new CloudFormationClient({ region: region });
      await cloudformation.send(
        new DeleteStackCommand({
          StackName: stack,
        })
      );
    }

}