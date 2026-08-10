import { applyDecorators, UseGuards } from "@nestjs/common";
import { JwtGuard } from "../guards";

export function Authorization() {
    return applyDecorators(UseGuards(JwtGuard));
}