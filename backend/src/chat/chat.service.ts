import { HttpService } from '@nestjs/axios';
import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { ChatResponseDto } from './dto/chat-response.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly aiServiceUrl = process.env.AI_SERVICE_URL;
  private readonly aiServiceApiKey = process.env.AI_SERVICE_API_KEY;

  constructor(private readonly httpService: HttpService) {}

  async processMessage(
    message: string,
    entrepriseId: number,
    userId: number,
  ): Promise<ChatResponseDto> {
    if (!this.aiServiceUrl) {
      throw new HttpException(
        'AI service not configured',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    try {
      const { data } = await firstValueFrom(
        this.httpService.post(
          this.aiServiceUrl,
          {
            message,
            entrepriseId,
            userId,
          },
          {
            headers: {
              Authorization: `Bearer ${this.aiServiceApiKey}`,
            },
            timeout: 15000,
          },
        ),
      );

      return { response: data.response ?? data.reply ?? data.message };
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(`AI service call failed: ${axiosError.message}`);

      if (axiosError.code === 'ECONNABORTED') {
        throw new HttpException(
          'AI service timed out',
          HttpStatus.GATEWAY_TIMEOUT,
        );
      }
      throw new HttpException('AI service unavailable', HttpStatus.BAD_GATEWAY);
    }
  }
}
