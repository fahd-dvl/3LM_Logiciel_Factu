import { Test, TestingModule } from '@nestjs/testing';
import { PdfClientService } from './pdf-client.service';

describe('PdfClientService', () => {
  let service: PdfClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfClientService],
    }).compile();

    service = module.get<PdfClientService>(PdfClientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
