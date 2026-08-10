import { INestApplication } from "@nestjs/common";
import { SwaggerModule } from "@nestjs/swagger";
import { AuthModule } from "src/api/auth/auth.module";
import { OrganizationModule } from "src/api/organization/organization.module";
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
        ],
        operationIdFactory: (controllerKey, methodKey) => `${controllerKey}-${methodKey}`
    });

    SwaggerModule.setup('/backend/docs', app, document, {
        jsonDocumentUrl: '/swagger.json',
        yamlDocumentUrl: '/swagger.yaml',
        customSiteTitle: 'Flow Forge API docs',
    });
}