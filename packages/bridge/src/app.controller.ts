
import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators';

@Controller()
export class AppController {
    @Public()
    @Get()
    getHello(): string {
        return 'Hello World from Bridge Service!';
    }
}
