import { QuotesRepository }
  from '../repositories/quotes.repo'

const repo = new QuotesRepository()

export class QuotesService {
  async findAll() {
    return repo.findAll()
  }
  async findById(id: string) {
    return repo.findById(id)
  }
  async create(data: any) {
    return repo.create(data)
  }
}
