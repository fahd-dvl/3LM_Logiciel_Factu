import { Test, TestingModule } from '@nestjs/testing';
import { ProduitServiceController } from './produit-service.controller';

describe('ProduitServiceController', () => {
  let controller: ProduitServiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProduitServiceController],
    }).compile();

    controller = module.get<ProduitServiceController>(ProduitServiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
