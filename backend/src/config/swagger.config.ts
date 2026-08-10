import { DocumentBuilder } from "@nestjs/swagger";

export function getSwaggerConfig() {
    return new DocumentBuilder()
    .setTitle('Flow Forge API')
    .setDescription('A simple and powerful REST API for Flow-Forge project built with Nest.js')
    .setVersion('1.0.0')
    .setContact('Ilona', 'https://github.com/Ilonchik11', "ilonka7011@gmail.com")
    .addBearerAuth()
    .build();
}