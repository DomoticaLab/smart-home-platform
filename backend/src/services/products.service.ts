import { ProductsRepository }
  from '../repositories/products.repo'

const repo = new ProductsRepository()

export class ProductsService {
  async findAll() {
    return repo.findAll()
  }
  async findBySlug(slug: string) {
    return repo.findBySlug(slug)
  }
}
