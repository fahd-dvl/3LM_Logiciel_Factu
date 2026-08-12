import { Test, TestingModule } from '@nestjs/testing';
import { ProduitServiceService } from './produit-service.service';

describe('ProduitServiceService', () => {
  let service: ProduitServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProduitServiceService],
    }).compile();

    service = module.get<ProduitServiceService>(ProduitServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
