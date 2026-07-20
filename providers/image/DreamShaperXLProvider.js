import { ReplicateImageProvider } from './ReplicateImageProvider.js'

/**
 * DreamShaperXLProvider
 * ---------------------
 * DreamShaper XL via Replicate — a popular generalist SDXL checkpoint good at
 * both photoreal and stylized output. Falls back to the local renderer when
 * REPLICATE_API_TOKEN is absent.
 */
export class DreamShaperXLProvider extends ReplicateImageProvider {
  constructor(env = {}) {
    super({ ...env, id: 'dreamshaper-xl', name: 'DreamShaper XL (Replicate)' })
    this._models = [
      { id: 'lucataco/dreamshaper-xl-turbo', name: 'DreamShaper XL Turbo', speed: 'fast', quality: 'good' },
      { id: 'lucataco/dreamshaper-xl', name: 'DreamShaper XL', speed: 'medium', quality: 'excellent' }
    ]
  }

  resolveModel(model) {
    const known = this._models.map((m) => m.id)
    return model && known.includes(model) ? model : 'lucataco/dreamshaper-xl'
  }

  buildGenerateInput(params) {
    const input = super.buildGenerateInput({ ...params, model: this.resolveModel(params.model) })
    input.num_inference_steps = Number.isFinite(params.steps) ? Number(params.steps) : 25
    input.guidance_scale = Number.isFinite(params.guidanceScale) ? Number(params.guidanceScale) : 7
    return input
  }
}

export default DreamShaperXLProvider
