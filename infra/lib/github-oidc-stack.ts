// CI → AWS trust without long-lived keys (infrastructure-design §8, D13).
//
// GitHub Actions presents an OIDC token; the role below may be assumed ONLY by a
// workflow running in remontasupport/remontamarketplace on refs/heads/main. Both
// deployments (staging on push, prod on workflow_dispatch) run on main, so one role
// serves both. It may push images to the api repository and assume the CDK
// bootstrap roles; CloudFormation does the rest with those. Deployed once, by the
// user's admin identity; its ARN becomes the GitHub repository variable
// AWS_DEPLOY_ROLE_ARN.
import { CfnOutput, Duration, Stack, type StackProps } from 'aws-cdk-lib'
import type * as ecr from 'aws-cdk-lib/aws-ecr'
import * as iam from 'aws-cdk-lib/aws-iam'
import type { Construct } from 'constructs'

export const GITHUB_REPOSITORY = 'remontasupport/remontamarketplace'
export const DEPLOY_BRANCH = 'main'
export const DEPLOY_ROLE_NAME = 'remonta-api-deploy'

export interface GithubOidcStackProps extends StackProps {
  readonly repository: ecr.IRepository
}

export class GithubOidcStack extends Stack {
  readonly role: iam.Role

  constructor(scope: Construct, id: string, props: GithubOidcStackProps) {
    super(scope, id, props)

    const provider = new iam.OpenIdConnectProvider(this, 'GithubProvider', {
      url: 'https://token.actions.githubusercontent.com',
      clientIds: ['sts.amazonaws.com'],
    })

    this.role = new iam.Role(this, 'DeployRole', {
      roleName: DEPLOY_ROLE_NAME,
      description: `GitHub Actions deploys of apps/api from ${GITHUB_REPOSITORY} on ${DEPLOY_BRANCH}`,
      maxSessionDuration: Duration.hours(1),
      assumedBy: new iam.WebIdentityPrincipal(provider.openIdConnectProviderArn, {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
          'token.actions.githubusercontent.com:sub': `repo:${GITHUB_REPOSITORY}:ref:refs/heads/${DEPLOY_BRANCH}`,
        },
      }),
    })

    // Push and pull on the api repository only; the auth token call has no resource.
    this.role.addToPolicy(new iam.PolicyStatement({ actions: ['ecr:GetAuthorizationToken'], resources: ['*'] }))
    this.role.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'ecr:BatchCheckLayerAvailability',
          'ecr:BatchGetImage',
          'ecr:CompleteLayerUpload',
          'ecr:DescribeImages',
          'ecr:GetDownloadUrlForLayer',
          'ecr:InitiateLayerUpload',
          'ecr:PutImage',
          'ecr:UploadLayerPart',
        ],
        resources: [props.repository.repositoryArn],
      }),
    )
    // `cdk deploy` assumes the bootstrap roles (deploy, file-publishing, lookup); they do the work.
    this.role.addToPolicy(
      new iam.PolicyStatement({
        actions: ['sts:AssumeRole'],
        resources: [`arn:aws:iam::${this.account}:role/cdk-*`],
      }),
    )
    // The deploy workflow waits for the service to settle and reads its state.
    this.role.addToPolicy(
      new iam.PolicyStatement({
        actions: ['ecs:DescribeServices', 'ecs:DescribeTaskDefinition', 'ecs:ListTasks', 'ecs:DescribeTasks'],
        resources: ['*'],
      }),
    )

    new CfnOutput(this, 'DeployRoleArn', { value: this.role.roleArn, description: 'GitHub repository variable AWS_DEPLOY_ROLE_ARN' })
  }
}
