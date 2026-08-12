import { INestApplication } from "@nestjs/common";
import { SwaggerModule } from "@nestjs/swagger";
import { AuthModule } from "src/api/auth/auth.module";
import { IssueModule } from "src/api/issue/issue.module";
import { OrganizationModule } from "src/api/organization/organization.module";
import { ProjectMemberModule } from "src/api/project-member/project-member.module";
import { ProjectModule } from "src/api/project/project.module";
import { UserModule } from "src/api/user/user.module";
import { WorkspaceMemberModule } from "src/api/workspace-member/workspace-member.module";
import { WorkspaceModule } from "src/api/workspace/workspace.module";
import { getSwaggerConfig } from "src/config";

export function setUpSwagger(app: INestApplication) {
    const config = getSwaggerConfig();

    const document = SwaggerModule.createDocument(app, config, {
        include: [ 
            AuthModule, 
            UserModule, 
            OrganizationModule, 
            WorkspaceModule,
            WorkspaceMemberModule,
            ProjectModule,
            ProjectMemberModule,
            IssueModule,
        ],
        operationIdFactory: (controllerKey, methodKey) => `${controllerKey}-${methodKey}`
    });

    SwaggerModule.setup('/backend/docs', app, document, {
        jsonDocumentUrl: '/swagger.json',
        yamlDocumentUrl: '/swagger.yaml',
        customSiteTitle: 'Flow Forge API docs',
    });
}