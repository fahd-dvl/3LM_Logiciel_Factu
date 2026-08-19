import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatResponseDto } from './dto/chat-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentEntreprise } from '../auth/decorators/current-entreprise.decorator';
import { EntrepriseActiveGuard } from '../auth/guards/entreprise-active.guard';

@Controller('api/chat')
@UseGuards(AuthGuard('jwt'), EntrepriseActiveGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async sendMessage(
    @Body() dto: ChatRequestDto,
    @CurrentUser() user: any,
    @CurrentEntreprise() entrepriseId: number,
  ): Promise<ChatResponseDto> {
    return this.chatService.processMessage(dto.message, entrepriseId, user.id);
  }
}
