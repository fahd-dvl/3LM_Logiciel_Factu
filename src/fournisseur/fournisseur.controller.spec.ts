import { Test, TestingModule } from '@nestjs/testing';
import { FournisseurController } from './fournisseur.controller';

describe('FournisseurController', () => {
  let controller: FournisseurController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FournisseurController],
    }).compile();

    controller = module.get<FournisseurController>(FournisseurController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
