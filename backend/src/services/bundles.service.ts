import { BundlesRepository }
  from '../repositories/bundles.repo'

const repo = new BundlesRepository()

export class BundlesService {
  async findAll() {
    return repo.findAll()
  }
  async findBySlug(slug: string) {
    return repo.findBySlug(slug)
  }
}
