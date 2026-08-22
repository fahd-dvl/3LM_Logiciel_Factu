import { Test, TestingModule } from '@nestjs/testing';
import { TauxTvaService } from './taux-tva.service';

describe('TauxTvaService', () => {
  let service: TauxTvaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TauxTvaService],
    }).compile();

    service = module.get<TauxTvaService>(TauxTvaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
