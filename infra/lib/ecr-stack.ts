// The image registry (infrastructure-design §2): one repository for both stages.
// Tags are git SHAs and immutable, so a tag can never be re-pointed; scan on push;
// the last 20 images are kept, which is what makes a rollback a redeploy of an
// existing image rather than a rebuild. Deployed once from a developer machine,
// before the first workflow run pushes to it.
import { RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib'
import * as ecr from 'aws-cdk-lib/aws-ecr'
import type { Construct } from 'constructs'

export const REPOSITORY_NAME = 'remonta-api'

export class EcrStack extends Stack {
  readonly repository: ecr.Repository

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)
    this.repository = new ecr.Repository(this, 'Repository', {
      repositoryName: REPOSITORY_NAME,
      imageTagMutability: ecr.TagMutability.IMMUTABLE,
      imageScanOnPush: true,
      removalPolicy: RemovalPolicy.RETAIN,
      lifecycleRules: [{ description: 'keep the last 20 images (rollback window)', maxImageCount: 20 }],
    })
  }
}
