import {ConfigModule} from "@nestjs/config";
import * as path from "path";
import { DataSource } from "typeorm";
import dbConfiguration from "./db.config";

ConfigModule.forRoot({
   envFilePath: [path.resolve('.env')],
    isGlobal: true,
    load: [dbConfiguration],
})


export default new DataSource({
    ...dbConfiguration() as any,
    migrations: [
        path.resolve(`${__dirname}/../migrations/*{.ts,.js}`),
    ],
    
});